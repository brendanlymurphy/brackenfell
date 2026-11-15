// ───────────────────────── WGSL: scene shaders ─────────────────────────
const K = {
  terrainHalf: 144, terrainCell: 1.5, heightN: 193,   // level-0 terrain grid (also the grass / splat region)
  splatRes: 1024, cloudH: 700, fogBase: -2,
  grassCell: 0.30, grassBlock: 32, grassGridN: 30,     // 30x30 blocks of 32x32 tufts
};
K.grassHalf = K.grassCell * K.grassBlock * K.grassGridN / 2;   // = 144

const f1 = x => Number(x).toFixed(4);
const WGSL_COMMON = /* wgsl */`
const TAU = 6.2831853;
const T_HALF = ${f1(K.terrainHalf)};
const HEIGHT_N = ${f1(K.heightN)};
const CLOUD_H = ${f1(K.cloudH)};
const FOG_BASE = ${f1(K.fogBase)};
struct Globals {
  viewProj: mat4x4f,
  shadow0: mat4x4f,
  shadow1: mat4x4f,
  camPos: vec4f,      // xyz, time
  camRight: vec4f,    // xyz * tan(hfov/2)
  camUp: vec4f,       // xyz * tan(vfov/2)
  camFwd: vec4f,      // xyz, w exposure
  sunDir: vec4f,      // active key light direction (sun or moon), w shadow strength
  sunCol: vec4f,      // rgb radiance
  ambSky: vec4f,      // rgb, w night 0..1
  ambGnd: vec4f,      // rgb, w cloud cover
  fogCol: vec4f,      // rgb, w density
  fogSun: vec4f,      // rgb, w height falloff
  zenith: vec4f,      // rgb, w star intensity
  horizon: vec4f,     // rgb, w aurora intensity
  moonDir: vec4f,     // xyz, w moon brightness
  sunDisc: vec4f,     // xyz true sun direction, w disc brightness
  wind: vec4f,        // dir.x, dir.z, strength, time
  misc: vec4f,        // lightCount, shadow texel world size 0, 1, cloud shadow strength
  misc2: vec4f,       // grass range, tree LOD distance, window glow, 1/shadowRes
  misc3: vec4f,       // bloom strength, indoor 0..1, water level (lake), quality
  lightPos: array<vec4f, 8>,   // xyz, radius
  lightCol: array<vec4f, 8>,   // rgb, zone (255 = everywhere)
};
@group(0) @binding(0) var<uniform> g: Globals;
@group(0) @binding(1) var smp: sampler;
@group(0) @binding(2) var albedoT: texture_2d_array<f32>;
@group(0) @binding(3) var normalT: texture_2d_array<f32>;
@group(0) @binding(4) var noiseT: texture_2d<f32>;
@group(0) @binding(5) var nsmp: sampler;
@group(0) @binding(6) var shadowT: texture_depth_2d_array;
@group(0) @binding(7) var ssmp: sampler_comparison;
@group(0) @binding(8) var splatT: texture_2d<f32>;
@group(0) @binding(9) var csmp: sampler;
@group(0) @binding(10) var heightT: texture_2d<f32>;
@group(0) @binding(11) var albedoB: texture_2d_array<f32>;   // special layers (ids from 32)
@group(0) @binding(12) var normalB: texture_2d_array<f32>;
@group(0) @binding(13) var splat2T: texture_2d<f32>;           // r under trees, g wet ground, b contact shade, a worn turf

struct VIn { @location(0) pos: vec3f, @location(1) nrm: vec4f, @location(2) uv: vec2f, @location(3) col: vec4f, @location(4) m: vec4u };
struct VOut {
  @builtin(position) clip: vec4f,
  @location(0) wp: vec3f, @location(1) n: vec3f, @location(2) uv: vec2f, @location(3) col: vec4f,
  @location(4) @interpolate(flat) m: vec4u,
};
fn sat(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }
fn uhash(x: u32) -> u32 { var v = x; v ^= v >> 16u; v *= 0x7feb352du; v ^= v >> 15u; v *= 0x846ca68bu; v ^= v >> 16u; return v; }

fn shadowTap(uv: vec2f, layer: i32, z: f32) -> f32 { return textureSampleCompareLevel(shadowT, ssmp, uv, layer, z); }
fn sunShadow(wp: vec3f, n: vec3f) -> f32 {
  let ts = g.misc2.w;
  var p = (g.shadow0 * vec4f(wp + n * (g.misc.y * 1.8), 1.0)).xyz;
  var layer = 0; var fade = 1.0;
  if (max(abs(p.x), abs(p.y)) > 0.97) {
    p = (g.shadow1 * vec4f(wp + n * (g.misc.z * 1.8), 1.0)).xyz;
    layer = 1;
    fade = 1.0 - smoothstep(0.82, 0.97, max(abs(p.x), abs(p.y)));
  }
  if (fade <= 0.0 || p.z <= 0.0 || p.z >= 1.0) { return 1.0; }
  let uv = p.xy * vec2f(0.5, -0.5) + 0.5;
  let o = ts * 0.8;
  let s = (shadowTap(uv + vec2f(-o, -o), layer, p.z) + shadowTap(uv + vec2f(o, -o), layer, p.z)
         + shadowTap(uv + vec2f(-o, o), layer, p.z) + shadowTap(uv + vec2f(o, o), layer, p.z)) * 0.25;
  return mix(1.0, s, fade * g.sunDir.w);
}
fn shadowCheap(wp: vec3f) -> f32 {
  var p = (g.shadow0 * vec4f(wp, 1.0)).xyz;
  var layer = 0; var fade = 1.0;
  if (max(abs(p.x), abs(p.y)) > 0.97) {
    p = (g.shadow1 * vec4f(wp, 1.0)).xyz; layer = 1;
    fade = 1.0 - smoothstep(0.82, 0.97, max(abs(p.x), abs(p.y)));
  }
  if (fade <= 0.0 || p.z <= 0.0 || p.z >= 1.0) { return 1.0; }
  return mix(1.0, shadowTap(p.xy * vec2f(0.5, -0.5) + 0.5, layer, p.z - 0.0006), fade * g.sunDir.w);
}
fn cloudDensity(p: vec2f) -> f32 {
  let t = g.wind.w;
  let uv = p * 0.00022 + vec2f(t * 0.0030, t * 0.0011);
  let d = textureSampleLevel(noiseT, nsmp, uv, 0.0).r * 0.64 + textureSampleLevel(noiseT, nsmp, uv * 3.1 + vec2f(t * 0.002, 0.0), 0.0).g * 0.36;
  let cover = g.ambGnd.w;
  return smoothstep(0.86 - cover * 0.62, 1.10 - cover * 0.62, d);
}
fn cloudShadow(wp: vec3f) -> f32 {
  let L = g.sunDir.xyz;
  let pc = wp.xz + L.xz * ((CLOUD_H - wp.y) / max(L.y, 0.2));
  return 1.0 - cloudDensity(pc) * g.misc.w;
}
// sky gradient without clouds (also used for reflections)
fn skyBase(dir: vec3f) -> vec3f {
  let y = max(dir.y, 0.0);
  let t = pow(sat(1.0 - y), 3.5);
  var c = mix(g.zenith.rgb, g.horizon.rgb, t);
  let sd = max(dot(dir, g.sunDisc.xyz), 0.0);
  c += g.fogSun.rgb * (pow(sd, 6.0) * 0.45 * (0.3 + 0.7 * t) + pow(sd, 90.0) * 0.8);
  return mix(c, g.fogCol.rgb, (1.0 - smoothstep(-0.10, 0.03, dir.y)));
}
fn fogged(col: vec3f, wp: vec3f) -> vec3f {
  let d = wp - g.camPos.xyz; let dist = length(d);
  let k = g.fogSun.w * d.y;
  var integ = dist;
  if (abs(k) > 0.002) { integ = dist * (1.0 - exp(-k)) / k; }
  let dens = g.fogCol.w * exp(-g.fogSun.w * max(g.camPos.y - FOG_BASE, 0.0));
  let amt = (1.0 - exp(-dens * integ)) * (1.0 - g.misc3.y * 0.0);
  let s = pow(max(dot(d / max(dist, 0.001), g.sunDisc.xyz), 0.0), 6.0);
  return mix(col, mix(g.fogCol.rgb, g.fogCol.rgb + g.fogSun.rgb * 0.6, s), amt);
}
// tangent frame from screen derivatives, then apply a tangent-space normal
fn perturb(N: vec3f, wp: vec3f, uv: vec2f, nxy: vec2f, strength: f32) -> vec3f {
  let dp1 = dpdx(wp); let dp2 = dpdy(wp); let du1 = dpdx(uv); let du2 = dpdy(uv);
  let det = du1.x * du2.y - du2.x * du1.y;
  let sg = select(-1.0, 1.0, det >= 0.0);
  var T = (dp1 * du2.y - dp2 * du1.y) * sg;
  var B = (dp2 * du1.x - dp1 * du2.x) * sg;
  T = T - N * dot(N, T); B = B - N * dot(N, B);
  let tl = dot(T, T); let bl = dot(B, B);
  if (tl < 1e-14 || bl < 1e-14) { return N; }
  let n2 = (nxy * 2.0 - 1.0) * strength;
  return normalize(T * (inverseSqrt(tl) * n2.x) + B * (inverseSqrt(bl) * n2.y) + N * sqrt(max(1.0 - dot(n2, n2), 0.05)));
}
fn pointLights(wp: vec3f, N: vec3f, zone: u32, wrap: f32) -> vec3f {
  var acc = vec3f(0.0);
  let n = u32(g.misc.x);
  for (var i = 0u; i < n; i++) {
    let lc = g.lightCol[i]; let lz = u32(lc.w);
    if (lz == zone || lz == 255u) {
      let lp = g.lightPos[i];
      let d = lp.xyz - wp; let d2 = dot(d, d);
      let r2 = lp.w * lp.w;
      if (d2 < r2) {
        let f = 1.0 - d2 / r2;
        let att = f * f / (1.0 + d2 * 0.55);
        let ndl = (dot(N, d) * inverseSqrt(max(d2, 1e-4)) + wrap) / (1.0 + wrap);
        acc += lc.rgb * (att * max(ndl, 0.0));
      }
    }
  }
  return acc;
}
// full surface lighting. skyVis: 0 (deep interior) .. 1 (open sky)
fn shade(albedo: vec3f, N: vec3f, wp: vec3f, skyVis: f32, ao: f32, rough: f32, zone: u32) -> vec3f {
  let L = g.sunDir.xyz;
  let ndl = dot(N, L);
  var sun = vec3f(0.0); var spec = vec3f(0.0);
  if (ndl > 0.0) {
    let sh = sunShadow(wp, N) * cloudShadow(wp);
    sun = g.sunCol.rgb * (ndl * sh);
    let V = normalize(g.camPos.xyz - wp);
    let nh = max(dot(N, normalize(L + V)), 0.0);
    let gl = 1.0 - rough;
    spec = g.sunCol.rgb * (pow(nh, 4.0 + gl * gl * 180.0) * gl * gl * 1.6 * sh * ndl);
  }
  var hemi = mix(g.ambGnd.rgb, g.ambSky.rgb, N.y * 0.5 + 0.5) * (skyVis * ao);
  if (zone != 0u) { hemi = mix(vec3f(dot(hemi, vec3f(0.3333))), hemi, 0.25) * vec3f(1.10, 1.0, 0.88); }
  let pl = pointLights(wp, N, zone, 0.25) * mix(0.6, 1.0, ao);
  return albedo * (sun + hemi + pl) + spec;
}
@vertex fn vsStatic(v: VIn) -> VOut {
  var o: VOut;
  o.clip = g.viewProj * vec4f(v.pos, 1.0);
  o.wp = v.pos; o.n = v.nrm.xyz; o.uv = v.uv;
  o.col = vec4f(v.col.rgb * v.col.rgb, v.col.a);
  o.m = v.m;
  return o;
}`;

// tree / rock instance transform, shared by colour + shadow passes
const WGSL_INST = /* wgsl */`
struct IIn { @location(5) ipos: vec4f, @location(6) iprm: vec4f };   // xyz scale | yaw, tint, phase, -
fn instPos(lpos: vec3f, ww: f32, ipos: vec4f, iprm: vec4f, wind: vec4f) -> vec3f {
  let c = cos(iprm.x); let s = sin(iprm.x);
  let lp = lpos * ipos.w;
  var p = vec3f(lp.x * c + lp.z * s, lp.y, -lp.x * s + lp.z * c);
  let wt = wind.w; let ph = iprm.z * 40.0;
  let sway = sin(wt * 1.1 + ph + p.y * 0.2) * 0.6 + sin(wt * 2.3 + ph * 1.7 + lp.x * 1.3) * 0.4;
  let lean = p.y * p.y * 0.0004 * (sin(wt * 0.7 + ph) + 0.5);
  let off = (sway * ww * 0.10 + lean) * wind.z;
  p = vec3f(p.x + wind.x * off, p.y + sin(wt * 2.9 + ph + lp.x * 2.1 + lp.z * 1.7) * ww * 0.03 * wind.z, p.z + wind.y * off);
  return p + ipos.xyz;
}
fn instNrm(n: vec3f, iprm: vec4f) -> vec3f {
  let c = cos(iprm.x); let s = sin(iprm.x);
  return vec3f(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
}`;

const WGSL_SCENE = WGSL_COMMON + WGSL_INST + /* wgsl */`
// ─── opaque world geometry ───
@fragment fn fsOpaque(i: VOut) -> @location(0) vec4f {
  let layer = i32(i.m.x);
  let dx = dpdx(i.uv); let dy = dpdy(i.uv);
  var a: vec4f; var nt: vec4f;
  if (layer >= 32) { a = textureSampleGrad(albedoB, smp, i.uv, layer - 32, dx, dy); nt = textureSampleGrad(normalB, smp, i.uv, layer - 32, dx, dy); }
  else { a = textureSampleGrad(albedoT, smp, i.uv, layer, dx, dy); nt = textureSampleGrad(normalT, smp, i.uv, layer, dx, dy); }
  let albedo = a.rgb * mix(vec3f(1.0), i.col.rgb, a.a);
  let N = perturb(normalize(i.n), i.wp, i.uv, nt.xy, 1.0);
  var col = shade(albedo, N, i.wp, i.col.a, nt.z, nt.w, i.m.y);
  if ((i.m.z & 2u) != 0u) { col = albedo * (f32(i.m.w) * 0.0625); }
  return vec4f(fogged(col, i.wp), 1.0);
}
// ─── terrain: scanned ground layers blended by painted masks, slope and their own height ───
const L_GRASS: i32 = ${MAT.GRASS}; const L_GRASS2: i32 = ${MAT.GRASS2}; const L_FOREST: i32 = ${MAT.FOREST}; const L_DIRT: i32 = ${MAT.DIRT}; const L_MUD: i32 = ${MAT.MUD};
const L_SOIL: i32 = ${MAT.SOIL}; const L_GRAVEL: i32 = ${MAT.GRAVEL}; const L_COBBLE: i32 = ${MAT.COBBLE}; const L_ROCK: i32 = ${MAT.ROCK};
struct Gnd { c: vec3f, h: f32, n: vec2f, ao: f32, r: f32 };
fn gnd(layer: i32, uv: vec2f, dx: vec2f, dy: vec2f, detail: bool) -> Gnd {
  let a = textureSampleGrad(albedoT, smp, uv, layer, dx, dy);
  var o = Gnd(a.rgb, a.a, vec2f(0.5), 1.0, 0.9);
  if (detail) { let t = textureSampleGrad(normalT, smp, uv, layer, dx, dy); o.n = t.xy; o.ao = t.z; o.r = t.w; }
  return o;
}
// b shows through a first where b's own surface stands higher, so borders follow pebbles and tufts instead of fading
fn over(a: Gnd, b: Gnd, w: f32) -> Gnd {
  let k = sat((w - 0.5) * 3.0 + (b.h - a.h) * 1.4 + 0.5) * smoothstep(0.0, 0.10, w);
  return Gnd(mix(a.c, b.c, k), mix(a.h, b.h, k), mix(a.n, b.n, k), mix(a.ao, b.ao, k), mix(a.r, b.r, k));
}
fn groundTint(mn: vec4f, mn2: vec4f) -> vec3f { return mix(vec3f(0.80, 0.90, 0.70), vec3f(1.16, 1.06, 0.80), mn.r) * (0.86 + 0.28 * mn2.a); }
@fragment fn fsTerrain(i: VOut) -> @location(0) vec4f {
  let wp = i.wp;
  let r = length(wp.xz);
  let dist = distance(wp, g.camPos.xyz);
  let inside = step(abs(wp.x), T_HALF) * step(abs(wp.z), T_HALF);
  let suv = wp.xz / (2.0 * T_HALF) + 0.5;
  let sp = textureSample(splatT, csmp, suv) * inside;          // r road, g cobbles, b field, a bare
  let s2 = textureSample(splat2T, csmp, suv) * inside;
  let mn = textureSample(noiseT, nsmp, wp.xz * 0.0041);
  let mn2 = textureSample(noiseT, nsmp, wp.xz * 0.037);
  let mn3 = textureSample(noiseT, nsmp, wp.xz * 0.23);
  let dn = textureSample(noiseT, nsmp, wp.xz * 0.0013).ba - 0.5;
  let Nv = normalize(i.n + vec3f(dn.x, 0.0, dn.y) * (smoothstep(260.0, 700.0, r) * 1.1));
  let slope = 1.0 - Nv.y;
  let uvG = wp.xz * (1.0 / 3.0); let uvF = wp.xz * (1.0 / 14.0) + vec2f(0.37, 0.11); let uvC = wp.xz * (1.0 / 2.5);
  let uvR = vec2f(wp.x + wp.z, wp.y * 1.3) * 0.16;
  let dGx = dpdx(uvG); let dGy = dpdy(uvG); let dFx = dpdx(uvF); let dFy = dpdy(uvF); let dCx = dpdx(uvC); let dCy = dpdy(uvC); let dRx = dpdx(uvR); let dRy = dpdy(uvR);
  let det = dist < 110.0;                                      // normal maps only matter near the camera
  let farK = smoothstep(16.0, 55.0, dist);
  let wRock = sat((slope - 0.24 + (mn2.r - 0.5) * 0.22 - smoothstep(120.0, 300.0, wp.y) * 0.12) * 7.0);
  let wSnow = smoothstep(400.0, 540.0, wp.y + mn.r * 170.0) * (1.0 - smoothstep(0.30, 0.60, slope));
  let wFar = smoothstep(300.0, 480.0, r) * (1.0 - wRock * 0.7) * (1.0 - smoothstep(210.0, 330.0, wp.y + mn.g * 90.0));
  let tint = groundTint(mn, mn2);
  // meadow: a near and a far repeat of the same scan, cross-faded, so it is sharp underfoot and never a grid on the hills
  var G0 = gnd(L_GRASS, uvG, dGx, dGy, det);
  if (farK > 0.01) { let f = textureSampleGrad(albedoT, smp, uvF, L_GRASS, dFx, dFy); G0.c = mix(G0.c, f.rgb, farK * 0.85); G0.h = mix(G0.h, f.a, farK); }
  G0.c *= tint;
  // clover and thin turf in patches, and wherever feet have worn the grass
  let w2 = sat(sat((mn.g - 0.47) * 6.0 + (mn2.r - 0.5) * 1.6) * 0.8 + s2.a * 1.2);
  if (w2 > 0.004) { var g2 = gnd(L_GRASS2, uvG * 1.31, dGx * 1.31, dGy * 1.31, det); g2.c *= tint; G0 = over(G0, g2, w2); }
  // leaf litter and moss in the shade of trees
  if (s2.r > 0.004) { let f = gnd(L_FOREST, uvG, dGx, dGy, det); G0 = over(G0, f, s2.r); }
  G0.c = mix(G0.c, vec3f(0.030, 0.062, 0.030) * (0.6 + 0.9 * mn2.r), wFar);
  // tilled fields and the bare yards around buildings
  let wSoil = max(sp.b, sp.a * 0.92);
  if (wSoil > 0.004) {
    var s = gnd(L_SOIL, uvG, dGx, dGy, det);
    let fr = sin((wp.x * 0.35 + wp.z * 0.94) * 8.2) * sp.b;
    s.c *= 1.0 + 0.22 * fr; s.n.x += fr * 0.16; s.h += fr * 0.2;
    G0 = over(G0, s, wSoil);
  }
  // road: trodden gravel in the middle, mud along the verge and wherever water stands
  let road = sat(sp.r + (mn3.g - 0.5) * 0.30 * step(0.03, sp.r));
  let wMud = max(smoothstep(0.10, 0.34, road) * (1.0 - smoothstep(0.48, 0.74, road)), s2.g * (1.0 - sp.a)) * (1.0 - sp.g);
  if (wMud > 0.004) { let m = gnd(L_MUD, uvG * 1.17, dGx * 1.17, dGy * 1.17, det); G0 = over(G0, m, wMud); }
  let wPath = smoothstep(0.44, 0.76, road);
  if (wPath > 0.004) { let q = gnd(L_DIRT, uvG, dGx, dGy, det); G0 = over(G0, q, wPath); }
  let wGrav = sp.a * smoothstep(0.25, 0.65, s2.g);             // river bed and shore
  if (wGrav > 0.004) { let q = gnd(L_GRAVEL, uvG * 1.4, dGx * 1.4, dGy * 1.4, det); G0 = over(G0, q, wGrav); }
  if (sp.g > 0.004) { var c = gnd(L_COBBLE, uvC, dCx, dCy, det); c.h = 0.72 + 0.2 * c.h; G0 = over(G0, c, sat(sp.g * 1.15)); }
  // puddles collect in the low spots of roads and wet banks
  let wetGround = max(max(wMud, wPath * 0.8), s2.g * 0.9) * (1.0 - sp.g);
  let pud = smoothstep(0.58, 0.70, mn2.a * 0.50 + mn3.b * 0.28 + s2.g * 0.55) * wetGround * (1.0 - smoothstep(0.02, 0.09, slope)) * (1.0 - smoothstep(0.30, 0.55, G0.h)) * (1.0 - farK * 0.6);
  let damp = sat(s2.g * 0.7 + pud);
  G0.c *= mix(1.0, 0.52, damp); G0.r = mix(G0.r, 0.07, pud); G0.r = mix(G0.r, 0.45, damp * 0.6); G0.n = mix(G0.n, vec2f(0.5), pud); G0.ao = mix(G0.ao, 1.0, pud);
  var Nr = Nv;
  if (wRock > 0.004) {
    var q = gnd(L_ROCK, uvR, dRx, dRy, det); q.c *= (0.80 + 0.45 * mn.g) * vec3f(0.97, 0.98, 1.04);
    G0.c = mix(G0.c, q.c, wRock); G0.ao = mix(G0.ao, q.ao, wRock); G0.r = mix(G0.r, q.r, wRock); G0.n = mix(G0.n, vec2f(0.5), wRock);
  }
  G0.c = mix(G0.c, vec3f(0.80, 0.84, 0.90), wSnow);
  let N = perturb(Nv, wp, uvG, G0.n, 1.0 - smoothstep(80.0, 110.0, dist));
  var col = shade(G0.c, N, wp, 1.0, G0.ao * (1.0 - 0.55 * s2.b), mix(G0.r, 0.6, wSnow), 0u);
  if (pud > 0.01) {                                            // standing water mirrors the sky
    let V = normalize(g.camPos.xyz - wp); let Rf = reflect(-V, N);
    let F = 0.03 + 0.97 * pow(sat(1.0 - dot(N, V)), 5.0);
    col = mix(col, skyBase(vec3f(Rf.x, abs(Rf.y) + 0.02, Rf.z)), F * pud * 0.85);
  }
  col *= 1.0 - 0.32 * s2.b;                                    // soft contact shade at the foot of walls and trunks
  return vec4f(fogged(col, wp), 1.0);
}
// ─── instanced trees / rocks ───
@vertex fn vsInst(v: VIn, inst: IIn) -> VOut {
  var o: VOut;
  let wp = instPos(v.pos, max(v.nrm.w, 0.0), inst.ipos, inst.iprm, g.wind);
  o.clip = g.viewProj * vec4f(wp, 1.0);
  let dist = distance(inst.ipos.xyz, g.camPos.xyz);
  if ((v.m.w == 1u && dist > g.misc2.y) || (v.m.w == 2u && dist <= g.misc2.y)) { o.clip = vec4f(0.0, 0.0, 2.0, 1.0); }
  o.wp = wp; o.n = instNrm(v.nrm.xyz, inst.iprm); o.uv = v.uv;
  let tint = mix(vec3f(0.80, 0.86, 0.80), vec3f(1.16, 1.06, 0.84), inst.iprm.y);
  o.col = vec4f(v.col.rgb * v.col.rgb * tint, v.col.a);
  o.m = v.m;
  return o;
}
struct FOutA { @location(0) color: vec4f };
@fragment fn fsFoliage(i: VOut) -> @location(0) vec4f {
  let a = textureSample(albedoB, smp, i.uv, max(i32(i.m.x) - 32, 0));
  let alpha = sat((a.a - 0.45) / max(fwidth(a.a), 0.001) + 0.5);
  if (alpha < 0.05) { discard; }
  let N = normalize(i.n);
  let L = g.sunDir.xyz;
  let albedo = a.rgb * i.col.rgb;
  let sh = shadowCheap(i.wp + N * 0.15) * cloudShadow(i.wp);
  let ndl = sat(dot(N, L) * 0.6 + 0.4);
  let V = normalize(g.camPos.xyz - i.wp);
  let back = pow(sat(dot(V, -L)), 3.0) * 0.55;
  let hemi = mix(g.ambGnd.rgb, g.ambSky.rgb, N.y * 0.5 + 0.5) * i.col.a;
  var col = albedo * (g.sunCol.rgb * (ndl * sh) + hemi + pointLights(i.wp, N, 0u, 0.6));
  col += albedo * vec3f(1.3, 1.25, 0.6) * g.sunCol.rgb * (back * sh * i.col.a);
  return vec4f(fogged(col, i.wp), alpha);
}
// ─── grass: every tuft is placed in the vertex shader from its instance index ───
struct GOut { @builtin(position) clip: vec4f, @location(0) col: vec3f };
@vertex fn vsGrass(@location(0) b: vec4f, @builtin(instance_index) ii: u32) -> GOut {
  var o: GOut;
  let blockId = ii >> 10u; let li = ((ii & 1023u) * 421u + 77u) & 1023u;
  let bx = blockId % ${K.grassGridN}u; let bz = blockId / ${K.grassGridN}u;
  let cx = bx * 32u + (li & 31u); let cz = bz * 32u + (li >> 5u);
  let h0 = uhash((cx * 73856093u) ^ (cz * 19349663u));
  let r0 = vec4f(f32(h0 & 255u), f32((h0 >> 8u) & 255u), f32((h0 >> 16u) & 255u), f32(h0 >> 24u)) / 255.0;
  let h1 = uhash(h0 + 0x9e3779b9u);
  let r1 = vec4f(f32(h1 & 255u), f32((h1 >> 8u) & 255u), f32((h1 >> 16u) & 255u), f32(h1 >> 24u)) / 255.0;
  let root2 = (vec2f(f32(cx), f32(cz)) + r0.xy) * ${f1(K.grassCell)} - ${f1(K.grassHalf)};
  let huv = (root2 + T_HALF) / (2.0 * T_HALF) * ((HEIGHT_N - 1.0) / HEIGHT_N) + 0.5 / HEIGHT_N;
  let hy = textureSampleLevel(heightT, csmp, huv, 0.0).r;
  let sp = textureSampleLevel(splatT, csmp, root2 / (2.0 * T_HALF) + 0.5, 0.0);
  let s2 = textureSampleLevel(splat2T, csmp, root2 / (2.0 * T_HALF) + 0.5, 0.0);
  let mn = textureSampleLevel(noiseT, nsmp, root2 * 0.0041, 0.0);
  let mn2 = textureSampleLevel(noiseT, nsmp, root2 * 0.037, 0.0);
  let root = vec3f(root2.x, hy, root2.y);
  let dcam = distance(root, g.camPos.xyz);
  let lim = g.misc2.x * (0.28 + 0.72 * r0.z);
  let field = step(0.5, sp.b);
  let bare = max(max(sp.r, sp.g), sp.a);
  var s = (1.0 - smoothstep(lim * 0.72, lim, dcam)) * step(bare, 0.22 + r0.w * 0.25) * step(g.misc3.z + 0.05, hy);
  s *= step(r1.z, 0.35 + mn2.a * 0.9 + field);                      // natural bald patches
  s *= step(r1.w * 0.999, 1.0 - 0.72 * s2.r - 1.4 * s2.a);          // thin under trees and where the turf is worn
  var height = mix(0.20, 0.46, r1.x) * (0.65 + 0.8 * mn2.r) * (1.0 - 0.45 * s2.a);
  height = mix(height, 0.80 + 0.2 * r1.x, field);
  let t = b.y;
  let ang = b.z + r1.y * TAU;
  let dirv = vec2f(cos(ang), sin(ang));
  var p = root;
  p = vec3f(p.x + dirv.x * b.w * 0.08, p.y, p.z + dirv.y * b.w * 0.08);
  let wv = textureSampleLevel(noiseT, nsmp, root2 * 0.013 - g.wind.xy * (g.wind.w * 0.035), 0.0).r - 0.42;
  let gust = wv * 2.2 + sin(g.wind.w * 2.6 + root2.x * 0.9 + root2.y * 1.3) * 0.18;
  let toP = root2 - g.camPos.xz; let dP = length(toP);
  let pushAmt = (1.0 - smoothstep(0.25, 1.0, dP)) * step(abs(g.camPos.y - 1.6 - hy), 1.2);
  var bend = dirv * mix(0.32, 0.06, field) + g.wind.xy * (gust * g.wind.z * 0.55) + toP / max(dP, 0.05) * pushAmt * 0.9;
  let bl = length(bend);
  if (bl > 0.95) { bend *= 0.95 / bl; }
  let tt = t * t;
  let wide = (0.016 + dcam * 0.0011) * mix(1.0, 0.7, field);
  p = vec3f(p.x + bend.x * tt * height - dirv.y * b.x * wide * s, p.y + t * height * s * sqrt(1.0 - min(bl, 0.95) * min(bl, 0.95) * t), p.z + bend.y * tt * height + dirv.x * b.x * wide * s);
  o.clip = g.viewProj * vec4f(p, 1.0);
  if (s <= 0.001) { o.clip = vec4f(0.0, 0.0, 2.0, 1.0); }
  // colour matches the terrain tint below it
  var base = vec3f(0.062, 0.090, 0.026) * groundTint(mn, mn2) * mix(1.0, 0.72, s2.r);
  base = mix(base, vec3f(0.16, 0.145, 0.045), smoothstep(0.75, 1.0, r1.w) * 0.6);
  var tip = base * vec3f(1.32, 1.30, 1.05);
  base = mix(base, vec3f(0.30, 0.21, 0.06), field); tip = mix(tip, vec3f(0.72, 0.52, 0.17), field);
  let flower = step(1.0 - 0.006 - 0.05 * smoothstep(0.55, 0.80, mn2.b), r0.w) * (1.0 - field) * step(0.5, t) * 0.85;
  let fc = mix(mix(vec3f(0.95, 0.9, 0.85), vec3f(0.95, 0.75, 0.15), step(0.5, r1.x)), vec3f(0.55, 0.35, 0.85), step(0.75, r1.y));
  var c = mix(base * 0.55, tip, t);
  c = mix(c, fc, flower);
  let sh = shadowCheap(root + vec3f(0.0, 0.12, 0.0)) * cloudShadow(root);
  let L = g.sunDir.xyz;
  let V = normalize(g.camPos.xyz - p);
  let back = pow(sat(dot(V, -L)), 4.0) * t * 0.9;
  let light = g.sunCol.rgb * ((0.30 + 0.70 * sat(L.y * 1.6)) * sh * (1.0 + back)) + mix(g.ambGnd.rgb, g.ambSky.rgb, 0.85) * mix(0.5, 1.0, t)
            + pointLights(root + vec3f(0.0, 0.2, 0.0), vec3f(0.0, 1.0, 0.0), 0u, 0.5);
  o.col = fogged(c * light, p);
  return o;
}
@fragment fn fsGrass(i: GOut) -> @location(0) vec4f { return vec4f(i.col, 1.0); }
// ─── skinned characters and hinged objects ───
@group(1) @binding(0) var<storage, read> bones: array<mat4x4f>;
@vertex fn vsSkin(v: VIn, @builtin(instance_index) ii: u32) -> VOut {
  var o: VOut;
  let base = ii * 16u;
  let b0 = bones[base + v.m.y]; let b1 = bones[base + v.m.z];
  let w1 = f32(v.m.w) / 255.0;
  let p4 = vec4f(v.pos, 1.0); let n4 = vec4f(v.nrm.xyz, 0.0);
  let wp = mix((b0 * p4).xyz, (b1 * p4).xyz, w1);
  let info = bones[base + 15u];
  o.clip = g.viewProj * vec4f(wp, 1.0);
  o.wp = wp; o.n = mix((b0 * n4).xyz, (b1 * n4).xyz, w1); o.uv = v.uv;
  o.col = vec4f(v.col.rgb * v.col.rgb, v.col.a * info[0].y);
  o.m = vec4u(v.m.x, u32(info[0].x), 0u, 0u);
  return o;
}
// ─── water ───
@fragment fn fsWater(i: VOut) -> @location(0) vec4f {
  let t = g.wind.w; let p = i.wp.xz;
  let fd = i.uv;
  let n1 = textureSample(noiseT, nsmp, p * 0.09 - fd * (t * 0.05)).rg;
  let n2 = textureSample(noiseT, nsmp, p * 0.23 - fd * (t * 0.09) + vec2f(0.37, 0.11)).ga;
  let n3 = textureSample(noiseT, nsmp, p * 0.71 + vec2f(t * 0.02, -t * 0.017)).rb;
  let nn = n1 + n2 * 0.7 + n3 * 0.35 - 1.025;
  let N = normalize(vec3f(nn.x * 0.55, 1.0, nn.y * 0.55));
  let V = normalize(g.camPos.xyz - i.wp);
  let fres = 0.025 + 0.975 * pow(sat(1.0 - dot(N, V)), 5.0);
  var R = reflect(-V, N); R.y = abs(R.y);
  var refl = skyBase(R);
  let pc = g.camPos.xz + R.xz * (CLOUD_H / max(R.y, 0.05));
  let cl = cloudDensity(pc) * smoothstep(0.04, 0.25, R.y);
  refl = mix(refl, g.sunCol.rgb * 0.45 + g.ambSky.rgb * 0.9, cl * 0.8);
  refl = mix(vec3f(0.02, 0.045, 0.03) * (g.ambSky.rgb * 2.0 + g.sunCol.rgb * 0.3), refl, smoothstep(0.015, 0.16, R.y));   // dark far bank
  let sh = shadowCheap(i.wp);
  let spec = g.sunCol.rgb * (pow(max(dot(R, g.sunDir.xyz), 0.0), 260.0) * 7.0 * sh);
  let depth = i.col.a;
  let body = vec3f(0.03, 0.085, 0.075) * (g.ambSky.rgb * 1.2 + g.sunCol.rgb * (0.35 * sh));
  let foam = (1.0 - smoothstep(0.0, 0.16, depth)) * smoothstep(0.35, 0.75, n3.x + n1.y * 0.6);
  var col = mix(body, refl, fres) + spec;
  col = mix(col, (g.ambSky.rgb + g.sunCol.rgb * sh * 0.6) * 0.75, foam * 0.6);
  let alpha = max(mix(0.30, 0.94, smoothstep(0.0, 0.7, depth)), fres) * smoothstep(0.0, 0.05, depth);
  return vec4f(fogged(col, i.wp), max(alpha, foam * 0.5));
}
// ─── lit window panes at night (additive) ───
@fragment fn fsGlow(i: VOut) -> @location(0) vec4f {
  let q = i.uv * vec2f(4.0, 5.0);
  let lat = min(abs(fract(q.x + q.y) - 0.5), abs(fract(q.x - q.y) - 0.5));
  let pane = smoothstep(0.02, 0.08, lat);
  let id = floor(vec2f(q.x + q.y, q.x - q.y));
  let hv = f32(uhash(u32(id.x + 64.0) * 131u + u32(id.y + 64.0) * 7919u) & 255u) / 255.0;
  let flick = 0.9 + 0.1 * sin(g.wind.w * 7.0 + i.wp.x * 3.0 + i.wp.z * 5.0);
  let c = i.col.rgb * (pane * (0.65 + 0.5 * hv) * flick * g.misc2.z * (f32(i.m.w) * 0.0625));
  let d = i.wp - g.camPos.xyz;
  let fade = exp(-g.fogCol.w * length(d) * 0.6);
  return vec4f(c * fade, 0.0);
}
// ─── sky ───
struct SOut { @builtin(position) clip: vec4f, @location(0) ndc: vec2f };
@vertex fn vsSky(@builtin(vertex_index) vi: u32) -> SOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: SOut; o.clip = vec4f(p[vi], 0.0, 1.0); o.ndc = p[vi]; return o;
}
@fragment fn fsSky(i: SOut) -> @location(0) vec4f {
  let dir = normalize(g.camFwd.xyz + g.camRight.xyz * i.ndc.x + g.camUp.xyz * i.ndc.y);
  var c = skyBase(dir);
  let t = g.wind.w;
  // stars
  if (g.zenith.w > 0.01 && dir.y > -0.05) {
    let sp = dir * 260.0; let cell = floor(sp); let f = fract(sp) - 0.5;
    let hc = uhash((u32(i32(cell.x) + 4096) * 73856093u) ^ (u32(i32(cell.y) + 4096) * 19349663u) ^ (u32(i32(cell.z) + 4096) * 83492791u));
    let rnd = f32(hc & 1023u) / 1023.0;
    if (rnd > 0.955) {
      let off = vec3f(f32((hc >> 10u) & 255u), f32((hc >> 18u) & 255u), f32(hc >> 26u) * 4.0) / 255.0 - 0.5;
      let dd = length(f - off * 0.6);
      let tw = 0.75 + 0.25 * sin(t * (2.0 + rnd * 40.0) + rnd * 100.0);
      let warm = mix(vec3f(0.75, 0.85, 1.0), vec3f(1.0, 0.88, 0.7), f32((hc >> 4u) & 15u) / 15.0);
      c += warm * ((1.0 - smoothstep(0.0, 0.16, dd)) * (rnd - 0.955) * 40.0 * tw * g.zenith.w * smoothstep(-0.05, 0.25, dir.y));
    }
  }
  // sun and moon discs
  let sd = dot(dir, g.sunDisc.xyz);
  c += g.fogSun.rgb * (smoothstep(0.99985, 0.99995, sd) * g.sunDisc.w);
  let md = dot(dir, g.moonDir.xyz);
  if (md > 0.9993) {
    let mr = sat((md - 0.9993) / 0.0007);
    let mp = dir.xy * 300.0;
    let crater = textureSampleLevel(noiseT, nsmp, mp * 0.02, 0.0).g;
    c += vec3f(0.78, 0.84, 1.0) * (smoothstep(0.0, 0.25, mr) * (0.55 + 0.6 * crater) * g.moonDir.w);
  }
  c += vec3f(0.3, 0.4, 0.6) * (pow(max(md, 0.0), 300.0) * 0.25 * g.moonDir.w);
  // aurora over the northern peaks
  if (g.horizon.w > 0.01 && dir.y > 0.04) {
    let q = dir.xz / (dir.y + 0.32);
    let n = textureSampleLevel(noiseT, nsmp, vec2f(q.x * 0.10 + t * 0.003, q.y * 0.03 + t * 0.001), 0.0).r;
    let curtain = pow(sat(1.0 - abs(n - 0.5) * 6.5), 2.0);
    let rays = textureSampleLevel(noiseT, nsmp, vec2f(q.x * 1.9 + q.y * 0.4, t * 0.015), 0.0).a;
    let hgt = smoothstep(0.04, 0.3, dir.y) * (1.0 - smoothstep(0.45, 0.98, dir.y)) * smoothstep(-0.35, 0.45, -dir.z);
    let ac = mix(vec3f(0.08, 1.0, 0.42), vec3f(0.55, 0.18, 0.95), smoothstep(0.28, 0.8, dir.y + rays * 0.2));
    c += ac * (curtain * (0.35 + 1.1 * rays) * hgt * g.horizon.w * 0.5);
  }
  // clouds
  if (dir.y > 0.012) {
    let pc = g.camPos.xz + dir.xz * ((CLOUD_H - g.camPos.y) / dir.y);
    var dens = cloudDensity(pc);
    if (dens > 0.003) {
      let det = textureSampleLevel(noiseT, nsmp, pc * 0.0031 + vec2f(t * 0.004, 0.0), 0.0).a;
      dens = sat(dens * (0.72 + 0.6 * det));
      let toward = cloudDensity(pc + g.sunDisc.xz * 260.0);
      let lit = sat(1.15 - toward * 1.1);
      let sunlit = g.sunCol.rgb * 0.5 + g.ambSky.rgb * 1.0 + g.fogSun.rgb * (pow(max(sd, 0.0), 4.0) * 0.5);
      let dark = g.ambSky.rgb * 0.55 + g.horizon.rgb * 0.25;
      let cc = mix(dark, sunlit, lit * (0.55 + 0.45 * (1.0 - dens)));
      let fade = smoothstep(0.012, 0.20, dir.y);
      c = mix(c, mix(g.horizon.rgb, cc, fade), dens * fade * 0.94);
    }
  }
  return vec4f(c, 1.0);
}
// ─── billboards: glows, smoke, flames, fireflies ───
struct POut { @builtin(position) clip: vec4f, @location(0) uv: vec2f, @location(1) col: vec4f, @location(2) @interpolate(flat) prm: vec4f, @location(3) wp: vec3f };
@vertex fn vsPart(@builtin(vertex_index) vi: u32, @location(0) ps: vec4f, @location(1) col: vec4f, @location(2) prm: vec4f) -> POut {
  var q = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0));
  let c = q[vi];
  var right = normalize(g.camRight.xyz); var up = normalize(g.camUp.xyz);
  if (prm.y > 1.5 && prm.y < 2.5) { up = vec3f(0.0, 1.0, 0.0); right = normalize(vec3f(right.x, 0.0, right.z)); }
  let cr = cos(prm.x); let sr = sin(prm.x);
  let cc = vec2f(c.x * cr - c.y * sr, c.x * sr + c.y * cr);
  var wp = ps.xyz + (right * cc.x + up * (cc.y * prm.z)) * ps.w;
  wp += normalize(g.camPos.xyz - ps.xyz) * (ps.w * 0.35);       // pull toward the eye so sprites don't slice into walls
  var o: POut;
  o.clip = g.viewProj * vec4f(wp, 1.0); o.uv = c; o.col = col; o.prm = prm; o.wp = wp;
  return o;
}
@fragment fn fsPart(i: POut) -> @location(0) vec4f {
  let r2 = dot(i.uv, i.uv);
  let kind = i.prm.y;
  let n = textureSample(noiseT, nsmp, i.uv * 0.21 + vec2f(i.prm.w * 7.3, i.prm.w * 3.1 - g.wind.w * 0.05));
  let dist = distance(i.wp, g.camPos.xyz);
  let fogf = exp(-g.fogCol.w * dist * 0.5);
  if (kind < 0.5) {                              // soft additive glow
    let a = exp(-r2 * 4.5) * (1.0 - smoothstep(0.7, 1.0, r2));
    return vec4f(i.col.rgb * (a * i.col.a * fogf), 0.0);
  } else if (kind < 1.5) {                       // smoke puff (alpha, lit by sky)
    let a = sat((1.0 - r2) * (0.35 + n.r * 1.3) - 0.25) * i.col.a;
    let lit = (g.ambSky.rgb * 1.3 + g.sunCol.rgb * 0.35) * i.col.rgb;
    return vec4f(fogged(lit, i.wp) * a, a);
  } else if (kind < 2.5) {                       // flame tongue
    let y = i.uv.y * 0.5 + 0.5;
    let tm = g.wind.w * 1.7 + i.prm.w * 31.0;
    let f1 = textureSampleLevel(noiseT, nsmp, vec2f(i.uv.x * 0.16 + i.prm.w, y * 0.22 - tm * 0.42), 0.0).g;
    let f2 = textureSampleLevel(noiseT, nsmp, vec2f(i.uv.x * 0.45 + i.prm.w * 2.0, y * 0.5 - tm * 0.9), 0.0).r;
    let x = i.uv.x + (f1 - 0.5) * 1.1 * y;
    let wdt = 0.62 * pow(sat(1.0 - y), 0.75) * (0.55 + 0.9 * f2);
    let body = sat(1.0 - abs(x) / max(wdt, 0.02)) * smoothstep(0.0, 0.10, y);
    let heat = body * body * (1.25 - y * 0.6);
    let fc = mix(vec3f(1.0, 0.16, 0.02), vec3f(1.0, 0.58, 0.14), sat(heat * 1.5)) + vec3f(0.7, 0.6, 0.3) * sat(heat * 1.8 - 1.15);
    return vec4f(fc * (heat * i.col.a * 1.7) * i.col.rgb, 0.0);
  }
  let a = exp(-r2 * 7.0);                         // firefly / ember
  return vec4f(i.col.rgb * (a * i.col.a * fogf), 0.0);
}`;

// ─── shadow depth passes ───
const WGSL_SHADOW = WGSL_INST + /* wgsl */`
struct SG { lightVP: mat4x4f, camPos: vec4f, wind: vec4f, misc: vec4f };
@group(0) @binding(0) var<uniform> sg: SG;
@group(0) @binding(1) var smp: sampler;
@group(0) @binding(2) var albedoT: texture_2d_array<f32>;
@group(1) @binding(0) var<storage, read> bones: array<mat4x4f>;
@vertex fn vsStatic(@location(0) pos: vec3f) -> @builtin(position) vec4f { return sg.lightVP * vec4f(pos, 1.0); }
@vertex fn vsSkin(@location(0) pos: vec3f, @location(4) m: vec4u, @builtin(instance_index) ii: u32) -> @builtin(position) vec4f {
  let base = ii * 16u; let p4 = vec4f(pos, 1.0);
  let wp = mix((bones[base + m.y] * p4).xyz, (bones[base + m.z] * p4).xyz, f32(m.w) / 255.0);
  return sg.lightVP * vec4f(wp, 1.0);
}
struct CO { @builtin(position) clip: vec4f, @location(0) uv: vec2f, @location(1) @interpolate(flat) layer: u32 };
@vertex fn vsInst(@location(0) pos: vec3f, @location(1) nrm: vec4f, @location(2) uv: vec2f, @location(4) m: vec4u, inst: IIn) -> CO {
  var o: CO;
  let wp = instPos(pos, max(nrm.w, 0.0), inst.ipos, inst.iprm, sg.wind);
  o.clip = sg.lightVP * vec4f(wp, 1.0);
  let dist = distance(inst.ipos.xyz, sg.camPos.xyz);
  if ((m.w == 1u && dist > sg.misc.x) || (m.w == 2u && dist <= sg.misc.x)) { o.clip = vec4f(0.0, 0.0, 2.0, 1.0); }
  o.uv = uv; o.layer = m.x;
  return o;
}
@fragment fn fsCut(i: CO) { if (textureSample(albedoT, smp, i.uv, max(i32(i.layer) - 32, 0)).a < 0.4) { discard; } }`;

// ─── post: bloom + tonemap ───
const WGSL_POST = /* wgsl */`
struct PU { a: vec4f, b: vec4f, c: vec4f, d: vec4f };      // a: texel.xy, threshold, strength | b: exposure, vignette, time, saturation | c: shaft colour | d: sun uv
@group(0) @binding(0) var<uniform> u: PU;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@group(0) @binding(3) var bloomT: texture_2d<f32>;
@group(0) @binding(4) var aoT: texture_2d<f32>;        // r ambient occlusion, g light shafts
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VSOut; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * vec2f(0.5, -0.5) + 0.5; return o;
}
fn tap4(uv: vec2f, d: vec2f) -> vec3f {
  return (textureSampleLevel(src, smp, uv + vec2f(-d.x, -d.y), 0.0).rgb + textureSampleLevel(src, smp, uv + vec2f(d.x, -d.y), 0.0).rgb
        + textureSampleLevel(src, smp, uv + vec2f(-d.x, d.y), 0.0).rgb + textureSampleLevel(src, smp, uv + vec2f(d.x, d.y), 0.0).rgb) * 0.25;
}
@fragment fn fsBright(i: VSOut) -> @location(0) vec4f {
  let c = clamp(tap4(i.uv, u.a.xy), vec3f(0.0), vec3f(24.0));
  let l = max(c.r, max(c.g, c.b));
  return vec4f(c * (max(l - u.a.z, 0.0) / max(l, 0.0001)), 1.0);
}
@fragment fn fsDown(i: VSOut) -> @location(0) vec4f { return vec4f(tap4(i.uv, u.a.xy), 1.0); }
@fragment fn fsUp(i: VSOut) -> @location(0) vec4f { return vec4f(tap4(i.uv, u.a.xy * 0.75), 1.0); }
fn aces(x: vec3f) -> vec3f { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0)); }
// second half of the occlusion step: a 4x4 box (four bilinear taps) removes the sampling pattern; the same pass marches toward the sun through the sky mask for light shafts
@fragment fn fsAOBlur(i: VSOut) -> @location(0) vec4f {
  let t = u.a.xy;
  let ao = (textureSampleLevel(src, smp, i.uv + t * vec2f(-1.5, -1.5), 0.0).r + textureSampleLevel(src, smp, i.uv + t * vec2f(0.5, -1.5), 0.0).r
          + textureSampleLevel(src, smp, i.uv + t * vec2f(-1.5, 0.5), 0.0).r + textureSampleLevel(src, smp, i.uv + t * vec2f(0.5, 0.5), 0.0).r) * 0.25;
  var sh = 0.0;
  if (u.b.x > 0.0) {
    let dir = u.a.zw - i.uv;
    let jit = fract(52.9829189 * fract(dot(i.pos.xy, vec2f(0.06711056, 0.00583715))));
    for (var k = 0; k < 14; k++) { sh += textureSampleLevel(src, smp, i.uv + dir * ((f32(k) + jit) / 14.0 * 0.92), 0.0).g; }
    let far = dir * vec2f(1.0, u.b.y);
    sh = sh / 14.0 * exp(-dot(far, far) * 2.6);
  }
  return vec4f(ao, sh, 0.0, 1.0);
}
@fragment fn fsFinal(i: VSOut) -> @location(0) vec4f {
  var c = textureSampleLevel(src, smp, i.uv, 0.0).rgb;
  let ao = textureSampleLevel(aoT, smp, i.uv, 0.0);
  c *= mix(1.0, ao.r, u.a.z * ao.a);            // alpha is 0 until the occlusion pass has really written the texture
  c += u.c.rgb * (ao.g * ao.g);
  c += textureSampleLevel(bloomT, smp, i.uv, 0.0).rgb * u.a.w;
  c = max(c, vec3f(0.0)) * u.b.x;
  let q = i.uv - 0.5;
  c *= 1.0 - dot(q, q) * u.b.y;
  c = aces(c);
  // grade: a little more contrast and colour, shadows leaning cool and highlights warm
  let l0 = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  c = mix(vec3f(l0), c, u.b.w);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
  let l = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  c *= mix(vec3f(0.93, 0.99, 1.07), vec3f(1.045, 1.0, 0.93), smoothstep(0.06, 0.62, l));
  c = pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2));
  let n = fract(sin(dot(i.pos.xy + u.b.z, vec2f(12.9898, 78.233))) * 43758.5453);
  return vec4f(c + (n - 0.5) / 255.0, 1.0);
}`;

// ─── ambient occlusion from the depth buffer (half resolution); also marks sky pixels for the light shafts ───
const WGSL_AO = /* wgsl */`
struct PU { a: vec4f, b: vec4f, c: vec4f, d: vec4f };   // a: -, -, near, radius (m) | b: tan half fov x, y, strength, fade distance
@group(0) @binding(0) var<uniform> u: PU;
@group(0) @binding(1) var depthT: texture_depth_multisampled_2d;
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VSOut; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * vec2f(0.5, -0.5) + 0.5; return o;
}
// view-space position (x right, y up, z = distance ahead) of a full-resolution pixel
fn viewPos(px: vec2i, dims: vec2i) -> vec3f {
  let c = clamp(px, vec2i(0), dims - vec2i(1));
  let z = u.a.z / max(textureLoad(depthT, c, 0), 0.000001);
  let ndc = (vec2f(c) + 0.5) / vec2f(dims) * 2.0 - 1.0;
  return vec3f(ndc.x * u.b.x * z, -ndc.y * u.b.y * z, z);
}
@fragment fn fsAO(i: VSOut) -> @location(0) vec4f {
  let dims = vec2i(textureDimensions(depthT));
  let px = vec2i(i.pos.xy) * 2 + vec2i(1);
  let d0 = textureLoad(depthT, clamp(px, vec2i(0), dims - vec2i(1)), 0);
  if (d0 <= 0.0) { return vec4f(1.0, 1.0, 0.0, 1.0); }
  let P = viewPos(px, dims);
  if (P.z > u.b.w) { return vec4f(1.0, 0.0, 0.0, 1.0); }
  // surface normal from whichever neighbour on each axis is closer in depth (keeps edges clean)
  var dx = viewPos(px + vec2i(1, 0), dims) - P; let dx2 = P - viewPos(px - vec2i(1, 0), dims);
  if (abs(dx2.z) < abs(dx.z)) { dx = dx2; }
  var dy = viewPos(px + vec2i(0, 1), dims) - P; let dy2 = P - viewPos(px - vec2i(0, 1), dims);
  if (abs(dy2.z) < abs(dy.z)) { dy = dy2; }
  var N = normalize(cross(dx, dy));
  if (dot(N, P) > 0.0) { N = -N; }
  let rad = u.a.w * (0.6 + 0.4 * smoothstep(1.0, 8.0, P.z));
  let rpx = clamp(rad / (P.z * u.b.x) * 0.5 * f32(dims.x), 3.0, 0.11 * f32(dims.x));
  let ip = vec2i(i.pos.xy);
  let rot = f32((((ip.x & 3) + (ip.y & 3) * 4) * 7) & 15) * 0.3926991;
  var occ = 0.0;
  for (var k = 0; k < 8; k++) {
    let a = rot + f32(k) * 2.3999632;
    let off = vec2f(cos(a), sin(a)) * (rpx * sqrt((f32(k) + 0.5) * 0.125));
    let v = viewPos(px + vec2i(off), dims) - P;
    let dv = dot(v, v);
    occ += max(dot(N, v) * inverseSqrt(dv + 0.0001) - 0.10, 0.0) / (1.0 + dv / (rad * rad));
  }
  let ao = clamp(1.0 - occ * 0.125 * u.b.z, 0.0, 1.0);
  return vec4f(mix(ao, 1.0, smoothstep(u.b.w * 0.55, u.b.w, P.z)), 0.0, 0.0, 1.0);
}`;
