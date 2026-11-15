// ───────────────────────── procedural material textures (generated on the GPU at load) ─────────────────────────
// Surface materials sit in array A: a baked pack of scanned textures, with a generated stand-in if the pack cannot load.
// The special ones (foliage cut-outs, cloth, metal ...) sit in array B and are generated on the GPU. Layer ids of B start at 32.
const MAT = { PLASTER: 0, TIMBER: 1, PLANKS: 2, STONE: 3, COBBLE: 4, THATCH: 5, SHINGLE: 6, DIRT: 7, GRASS: 8, ROCK: 9, BARK: 10, GRASS2: 11, FOREST: 12, MUD: 13, SOIL: 14, GRAVEL: 15, MOSS: 16,
  PLAIN: 32, BIRCH: 33, PINE: 34, LEAVES: 35, IMPOSTOR: 36, CLOTH: 37, METAL: 38, STRIPES: 39 };
const MAT_B0 = 32;
const MAT_A = ['plaster', 'timber', 'planks', 'stone', 'cobble', 'thatch', 'shingle', 'dirt', 'grass', 'rock', 'bark', 'grass2', 'forest', 'mud', 'soil', 'gravel', 'moss'];
const MAT_A_GEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 9, 9, 8, 8, 5, 9];      // generator standing in for each pack layer
const MAT_B_GEN = [0, 12, 13, 14, 15, 16, 17, 18];
const MAT_B_CUTOUT = [0, 0, 1, 1, 1, 0, 0, 0];
// world metres covered by one texture repeat
const MAT_TILE = [];
[2.5, 1.5, 2, 2, 2.5, 2, 2, 3, 3, 4, 1, 3, 3, 3, 3, 2.5, 3].forEach((t, i) => { MAT_TILE[i] = t; });
[1, 1, 1, 1, 1, 0.5, 1, 1].forEach((t, i) => { MAT_TILE[MAT_B0 + i] = t; });

const WGSL_NOISE = /* wgsl */`
const TAU = 6.2831853;
fn ih(x: u32) -> u32 { var v = x; v ^= v >> 16u; v *= 0x7feb352du; v ^= v >> 15u; v *= 0x846ca68bu; v ^= v >> 16u; return v; }
fn hi(p: vec2i, s: u32) -> u32 { return ih(u32(p.x) * 0x9e3779b1u + ih(u32(p.y) * 0x85ebca6bu + s * 0xc2b2ae35u)); }
fn h1(p: vec2i, s: u32) -> f32 { return f32(hi(p, s) >> 8u) * (1.0 / 16777216.0); }
fn h2(p: vec2i, s: u32) -> vec2f { let h = hi(p, s); return vec2f(f32(h & 0xffffu), f32(h >> 16u)) * (1.0 / 65536.0); }
fn wrp(p: vec2i, per: vec2i) -> vec2i { return ((p % per) + per) % per; }
fn vn(p: vec2f, per: vec2i, s: u32) -> f32 {
  let i = vec2i(floor(p)); let f = fract(p); let w = f * f * (3.0 - 2.0 * f);
  let a = h1(wrp(i, per), s); let b = h1(wrp(i + vec2i(1, 0), per), s);
  let c = h1(wrp(i + vec2i(0, 1), per), s); let d = h1(wrp(i + vec2i(1, 1), per), s);
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}
fn gr(i: vec2i, per: vec2i, s: u32, f: vec2f) -> f32 { let a = h1(wrp(i, per), s) * TAU; return dot(vec2f(cos(a), sin(a)), f); }
fn gn(p: vec2f, per: vec2i, s: u32) -> f32 {
  let i = vec2i(floor(p)); let f = fract(p); let w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let a = gr(i, per, s, f); let b = gr(i + vec2i(1, 0), per, s, f - vec2f(1.0, 0.0));
  let c = gr(i + vec2i(0, 1), per, s, f - vec2f(0.0, 1.0)); let d = gr(i + vec2i(1, 1), per, s, f - vec2f(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y) * 1.5;
}
// periodic fbm, ~0..1
fn fbm(p: vec2f, per: vec2i, oct: i32, s: u32) -> f32 {
  var r = 0.0; var a = 0.5; var q = p; var pr = per;
  for (var i = 0; i < oct; i++) { r += a * gn(q, pr, s + u32(i) * 7u); q *= 2.0; pr *= 2; a *= 0.5; }
  return clamp(r * 0.5 + 0.5, 0.0, 1.0);
}
// periodic voronoi: (F1, F2, id)
fn vor(p: vec2f, per: vec2i, s: u32) -> vec3f {
  let i = vec2i(floor(p)); let f = fract(p);
  var d1 = 9.0; var d2 = 9.0; var id = 0.0;
  for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
    let c = vec2i(x, y); let w = wrp(i + c, per);
    let r = vec2f(c) + h2(w, s) - f; let d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h1(w, s + 101u); } else if (d < d2) { d2 = d; }
  } }
  return vec3f(sqrt(d1), sqrt(d2), id);
}`;

const WGSL_TEXGEN = WGSL_NOISE + /* wgsl */`
struct U { layer: f32, res: f32, tile: f32, gain: f32 };
@group(0) @binding(0) var<uniform> u: U;
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VSOut; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * vec2f(0.5, -0.5) + 0.5; return o;
}
struct M { c: vec3f, a: f32, h: f32, ao: f32, r: f32 };
struct Blk { du: f32, dv: f32, id: f32, lu: f32, lv: f32 };
// staggered rows of blocks with jittered joints. du/dv = distance to joints in tile units
fn blocks(uv: vec2f, rows: i32, cols: i32, jit: f32, s: u32) -> Blk {
  let r = i32(floor(uv.y * f32(rows))); let rv = fract(uv.y * f32(rows));
  let x = uv.x * f32(cols) + h1(vec2i(r, 3), s) + f32(r) * 0.5;
  var k = i32(floor(x));
  let per = vec2i(cols, rows);
  let b0 = f32(k) + (h1(wrp(vec2i(k, r), per), s + 1u) - 0.5) * jit;
  let b1 = f32(k + 1) + (h1(wrp(vec2i(k + 1, r), per), s + 1u) - 0.5) * jit;
  var lo = b0; var hi2 = b1;
  if (x < b0) { k = k - 1; hi2 = b0; lo = f32(k) + (h1(wrp(vec2i(k, r), per), s + 1u) - 0.5) * jit; }
  else if (x >= b1) { k = k + 1; lo = b1; hi2 = f32(k + 1) + (h1(wrp(vec2i(k + 1, r), per), s + 1u) - 0.5) * jit; }
  var o: Blk;
  o.du = min(x - lo, hi2 - x) / f32(cols); o.dv = min(rv, 1.0 - rv) / f32(rows);
  o.id = h1(wrp(vec2i(k, r), per), s + 2u); o.lu = (x - lo) / (hi2 - lo); o.lv = rv;
  return o;
}
fn grain(uv: vec2f, fu: i32, fv: i32, s: u32) -> vec2f {
  let warp = fbm(uv * vec2f(f32(fu), f32(fv) * 0.25), vec2i(fu, fv / 4), 3, s);
  let g = sin((uv.y * f32(fv) + warp * 3.0) * TAU) * 0.5 + 0.5;
  let fine = vn(uv * vec2f(f32(fu * 8), f32(fv * 12)), vec2i(fu * 8, fv * 12), s + 3u);
  return vec2f(g, fine);
}
fn mPlaster(uv: vec2f) -> M {
  let n1 = fbm(uv * 6.0, vec2i(6), 5, 11u);
  let n2 = fbm(uv * 24.0, vec2i(24), 4, 12u);
  let n3 = fbm(uv * 3.0, vec2i(3), 3, 13u);
  let trowel = fbm(uv * vec2f(4.0, 14.0), vec2i(4, 14), 3, 14u);
  let cr = abs(fbm(uv * 5.0, vec2i(5), 5, 15u) - 0.5);
  let crack = (1.0 - smoothstep(0.001, 0.006, cr)) * smoothstep(0.64, 0.74, n3) * 0.6;
  var c = vec3f(0.70, 0.655, 0.56) * (0.80 + 0.30 * n1);
  c = mix(c, vec3f(0.50, 0.45, 0.36), smoothstep(0.55, 0.85, n2) * 0.3);
  c = mix(c, vec3f(0.60, 0.53, 0.41), smoothstep(0.5, 0.9, n3) * 0.25);
  c *= 1.0 - crack * 0.5;
  return M(c, 1.0, n1 * 0.012 + trowel * 0.006 + n2 * 0.002 - crack * 0.004, 1.0 - crack * 0.4, 0.93);
}
fn mTimber(uv: vec2f) -> M {
  let g = grain(uv, 2, 16, 21u);
  let big = fbm(uv * vec2f(2.0, 6.0), vec2i(2, 6), 3, 22u);
  let cn = vn(uv * vec2f(3.0, 40.0), vec2i(3, 40), 23u);
  let crack = (1.0 - smoothstep(0.03, 0.10, cn)) * smoothstep(0.4, 0.7, big);
  var c = mix(vec3f(0.15, 0.10, 0.062), vec3f(0.34, 0.23, 0.14), g.x * 0.6 + g.y * 0.4);
  c *= (0.75 + 0.5 * big) * (1.0 - crack * 0.7);
  return M(c, 1.0, g.x * 0.0015 + g.y * 0.001 - crack * 0.006 + big * 0.004, 1.0 - crack * 0.5, 0.82);
}
fn mPlanks(uv: vec2f) -> M {
  let nb = 6.0;
  let bi = i32(floor(uv.y * nb)); let bv = fract(uv.y * nb);
  let bh = h1(vec2i(bi, 7), 31u); let bh2 = h1(vec2i(bi, 9), 32u);
  let ju = fract(uv.x + bh);
  let je = min(ju, 1.0 - ju);
  let endGap = (1.0 - smoothstep(0.0015, 0.004, je));
  let gap = (1.0 - smoothstep(0.02, 0.05, min(bv, 1.0 - bv)));
  let g = grain(uv, 2, 36, 40u + u32(bi) * 5u);
  var c = mix(vec3f(0.34, 0.235, 0.14), vec3f(0.56, 0.42, 0.27), g.x * 0.55 + g.y * 0.45);
  c *= 0.78 + 0.4 * bh2;
  let groove = max(gap, endGap);
  c *= 1.0 - groove * 0.78;
  let nail = (1.0 - smoothstep(0.006, 0.009, length(vec2f((je - 0.035) * 2.0, (abs(bv - 0.5) - 0.28) * (2.0 / nb)))));
  c = mix(c, vec3f(0.07, 0.065, 0.06), nail);
  let h = (bh - 0.5) * 0.004 + g.x * 0.001 - groove * 0.008 + (0.5 - abs(bv - 0.5)) * 0.003 - nail * 0.002;
  return M(c, 1.0, h, 1.0 - groove * 0.6, 0.78);
}
fn mStone(uv: vec2f) -> M {
  let wob = vec2f(fbm(uv * 6.0, vec2i(6), 2, 41u), fbm(uv * 6.0, vec2i(6), 2, 42u)) - 0.5;
  let b = blocks(uv + wob * 0.014, 8, 5, 0.7, 43u);
  let d = min(b.du, b.dv) * 2.0;
  let edge = smoothstep(0.0, 0.035, d - 0.006);
  let n = fbm(uv * 16.0, vec2i(16), 4, 44u);
  let n2 = fbm(uv * 48.0, vec2i(48), 3, 45u);
  var sc = mix(vec3f(0.29, 0.28, 0.265), vec3f(0.44, 0.41, 0.35), b.id);
  sc = mix(sc, vec3f(0.26, 0.27, 0.30), smoothstep(0.7, 1.0, fract(b.id * 7.3)) * 0.6);
  sc *= (0.72 + 0.55 * n) * (0.9 + 0.2 * n2);
  let mortar = vec3f(0.36, 0.335, 0.29) * (0.8 + 0.3 * n2);
  let c = mix(mortar, sc, smoothstep(0.004, 0.012, d));
  let h = edge * (0.022 + (b.id - 0.5) * 0.012) + n * 0.006 * edge + n2 * 0.002;
  return M(c, 1.0, h, mix(0.5, 1.0, smoothstep(0.0, 0.03, d)), 0.88);
}
fn mCobble(uv: vec2f) -> M {
  let v = vor(uv * 9.0, vec2i(9), 51u);
  let e = v.y - v.x;
  let top = smoothstep(0.03, 0.30, e);
  let dome = 1.0 - (1.0 - top) * (1.0 - top);
  let n = fbm(uv * 20.0, vec2i(20), 4, 52u);
  let n2 = fbm(uv * 64.0, vec2i(64), 2, 53u);
  var sc = mix(vec3f(0.22, 0.215, 0.20), vec3f(0.38, 0.36, 0.32), v.z);
  sc = mix(sc, vec3f(0.30, 0.26, 0.21), smoothstep(0.6, 1.0, fract(v.z * 5.7)) * 0.5);
  sc *= 0.8 + 0.4 * n;
  let gapc = mix(vec3f(0.12, 0.10, 0.07) * (0.8 + 0.4 * n2), vec3f(0.09, 0.14, 0.04), smoothstep(0.55, 0.75, n) * 0.6);
  let c = mix(gapc, sc, smoothstep(0.02, 0.10, e));
  return M(c, 1.0, dome * 0.035 + n2 * 0.002 * dome + (v.z - 0.5) * 0.008 * top, mix(0.5, 1.0, top), mix(0.95, 0.72, top));
}
fn mThatch(uv: vec2f) -> M {
  let wav = fbm(uv * vec2f(8.0, 1.0), vec2i(8, 1), 2, 61u) * 0.14;
  let cv = fract(uv.y * 4.0 + wav);
  let s1 = vn(uv * vec2f(120.0, 5.0), vec2i(120, 5), 62u);
  let s2 = vn(uv * vec2f(48.0, 3.0), vec2i(48, 3), 63u);
  let big = fbm(uv * 3.0, vec2i(3), 3, 64u);
  let strand = s1 * 0.6 + s2 * 0.4;
  var c = mix(vec3f(0.26, 0.19, 0.09), vec3f(0.56, 0.45, 0.23), strand);
  c = mix(c, vec3f(0.28, 0.26, 0.20), smoothstep(0.35, 0.75, big) * 0.55);
  let lip = smoothstep(0.0, 0.10, cv);
  c *= mix(0.42, 1.0, lip) * (0.85 + 0.15 * smoothstep(0.6, 1.0, cv));
  return M(c, 1.0, cv * 0.05 + strand * 0.012, mix(0.6, 1.0, lip), 0.95);
}
fn mShingle(uv: vec2f) -> M {
  let b = blocks(uv, 8, 7, 0.6, 71u);
  let gr2 = vn(vec2f(uv.x * 90.0, uv.y * 6.0 + b.id * 13.0), vec2i(90, 6), 72u);
  var c = mix(vec3f(0.24, 0.22, 0.20), vec3f(0.44, 0.40, 0.35), b.id);
  c *= 0.8 + 0.35 * gr2;
  let gap = (1.0 - smoothstep(0.003, 0.012, b.du * 2.0));
  let lip = smoothstep(0.0, 0.14, b.lv);
  c *= mix(0.4, 1.0, lip) * (1.0 - gap * 0.7);
  return M(c, 1.0, b.lv * 0.022 + (b.id - 0.5) * 0.006 + gr2 * 0.002 - gap * 0.01, mix(0.55, 1.0, lip) * (1.0 - gap * 0.4), 0.85);
}
fn mDirt(uv: vec2f) -> M {
  let n = fbm(uv * 5.0, vec2i(5), 5, 81u);
  let n2 = fbm(uv * 32.0, vec2i(32), 3, 82u);
  let v = vor(uv * 28.0, vec2i(28), 83u);
  let peb = (1.0 - smoothstep(0.12, 0.22, v.x)) * step(0.72, v.z);
  var c = mix(vec3f(0.17, 0.125, 0.08), vec3f(0.31, 0.24, 0.155), n);
  c *= 0.85 + 0.3 * n2;
  c = mix(c, vec3f(0.30, 0.285, 0.26) * (0.7 + 0.5 * v.z), peb * 0.8);
  return M(c, 1.0, n * 0.02 + n2 * 0.004 + peb * 0.012, 1.0 - 0.3 * (1.0 - n) * (1.0 - peb), 0.95);
}
fn mGrass(uv: vec2f) -> M {
  let n = fbm(uv * 4.0, vec2i(4), 4, 91u);
  let n2 = fbm(uv * 14.0, vec2i(14), 3, 92u);
  let b1 = vn(uv * vec2f(160.0, 26.0), vec2i(160, 26), 93u);
  let b2 = vn(uv.yx * vec2f(150.0, 22.0), vec2i(150, 22), 94u);
  let blades = max(b1, b2);
  var c = mix(vec3f(0.045, 0.095, 0.022), vec3f(0.125, 0.185, 0.045), n * 0.6 + blades * 0.4);
  c = mix(c, vec3f(0.19, 0.19, 0.065), smoothstep(0.55, 0.8, n2) * 0.35);
  c *= 0.75 + 0.5 * blades;
  return M(c, 1.0, blades * 0.02 + n2 * 0.01, 0.7 + 0.3 * blades, 0.95);
}
fn mRock(uv: vec2f) -> M {
  let st = fbm(uv * vec2f(3.0, 10.0), vec2i(3, 10), 5, 101u);
  let n = fbm(uv * 8.0, vec2i(8), 5, 102u);
  let v = vor(uv * 5.0 + (n - 0.5) * 0.4, vec2i(5), 103u);
  let crack = (1.0 - smoothstep(0.0, 0.06, v.y - v.x));
  let rid = 1.0 - abs(st * 2.0 - 1.0);
  var c = mix(vec3f(0.20, 0.195, 0.19), vec3f(0.36, 0.345, 0.32), st);
  c = mix(c, vec3f(0.31, 0.27, 0.22), smoothstep(0.5, 0.8, n) * 0.4);
  c *= 0.8 + 0.4 * n;
  c = mix(c, vec3f(0.27, 0.30, 0.18), smoothstep(0.62, 0.8, fbm(uv * 6.0, vec2i(6), 3, 104u)) * 0.35);
  c *= 1.0 - crack * 0.6;
  return M(c, 1.0, rid * 0.05 + n * 0.03 - crack * 0.03 + (v.z - 0.5) * 0.03, 1.0 - crack * 0.5, 0.9);
}
fn mBark(uv: vec2f) -> M {
  let wob = fbm(uv * vec2f(6.0, 3.0), vec2i(6, 3), 2, 113u) - 0.5;
  let v = vor(vec2f(uv.x * 14.0 + wob * 1.2, uv.y * 3.0), vec2i(14, 3), 111u);
  let plate = smoothstep(0.03, 0.30, v.y - v.x);
  let n = fbm(uv * vec2f(40.0, 10.0), vec2i(40, 10), 3, 112u);
  var c = mix(vec3f(0.030, 0.022, 0.017), mix(vec3f(0.115, 0.085, 0.062), vec3f(0.16, 0.13, 0.105), v.z), plate);
  c *= 0.8 + 0.4 * n;
  return M(c, 1.0, plate * 0.03 + n * 0.006, mix(0.5, 1.0, plate), 0.92);
}
fn mBirch(uv: vec2f) -> M {
  let n = fbm(uv * vec2f(4.0, 8.0), vec2i(4, 8), 4, 121u);
  let lent = smoothstep(0.78, 0.86, vn(uv * vec2f(7.0, 60.0), vec2i(7, 60), 122u));
  let v = vor(uv * vec2f(3.0, 5.0), vec2i(3, 5), 123u);
  let scar = (1.0 - smoothstep(0.10, 0.20, v.x)) * step(0.55, v.z);
  var c = vec3f(0.86, 0.85, 0.80) * (0.85 + 0.2 * n);
  c = mix(c, vec3f(0.25, 0.22, 0.20), lent * 0.8);
  c = mix(c, vec3f(0.07, 0.06, 0.06), scar);
  return M(c, 1.0, n * 0.004 - lent * 0.003 - scar * 0.008, 1.0 - scar * 0.4, 0.75);
}
// conifer bough card: u across, v from trunk (0) to tip (1)
fn mPine(uv: vec2f) -> M {
  let ax = abs(uv.x - 0.5); let v = uv.y;
  let w = 0.49 * pow(max(1.0 - v, 0.0), 0.62) * smoothstep(-0.03, 0.14, v);
  let k = v * 11.0 - ax * 8.0;
  let tw = abs(fract(k) - 0.5);
  let fing = 1.0 - smoothstep(0.0, 0.5, tw);
  let reach = w * mix(0.42, 1.0, fing);
  let fine = vn(uv * 72.0, vec2i(72), 132u);
  let needles = vn(vec2f(k * 10.0, ax * 34.0), vec2i(4096), 133u);
  let inside = reach - ax + (fine - 0.5) * 0.06;
  let a = smoothstep(-0.008, 0.012, inside) * smoothstep(0.18, 0.42, needles + fing * 0.6 + (0.3 - ax) * 0.8);
  var c = mix(vec3f(0.028, 0.062, 0.026), vec3f(0.10, 0.185, 0.065), fing * 0.45 + needles * 0.55);
  c = mix(c, vec3f(0.15, 0.24, 0.085), smoothstep(0.45, 1.0, v) * 0.5);
  c = mix(c, vec3f(0.15, 0.10, 0.065), (1.0 - smoothstep(0.006, 0.014, ax)) * (1.0 - smoothstep(0.5, 0.92, v)));
  return M(c, max(a, (1.0 - smoothstep(0.007, 0.012, ax)) * step(v, 0.9)), fing * 0.01, 0.55 + 0.45 * fing, 0.8);
}
// round clump of small leaves (greyscale, tinted per tree)
fn mLeaves(uv: vec2f) -> M {
  var a = 0.0; var c = vec3f(0.0);
  for (var L = 0; L < 3; L++) {
    let p = uv * (6.0 + f32(L) * 2.0) + f32(L) * 17.3;
    let i = vec2i(floor(p)); let f = fract(p);
    for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
      let cell = i + vec2i(x, y);
      if (h1(cell, 151u + u32(L)) < 0.14) { continue; }
      let ang = h1(cell, 161u + u32(L)) * TAU;
      let d = vec2f(f32(x), f32(y)) + h2(cell, 141u + u32(L)) - f;
      let ca = cos(ang); let sa = sin(ang);
      let q = vec2f(d.x * ca + d.y * sa, -d.x * sa + d.y * ca) * vec2f(1.0, 1.9) / 0.46;
      let leaf = (1.0 - smoothstep(0.82, 1.0, length(vec2f(q.x, q.y * (1.0 + 0.7 * abs(q.x))))));
      let tone = h1(cell, 171u + u32(L));
      let lc = vec3f(mix(0.5, 1.0, tone)) * (0.8 + 0.2 * (1.0 - smoothstep(0.0, 0.10, abs(q.y)))) * mix(0.75, 1.0, f32(L) * 0.5);
      c = mix(c, lc, leaf); a = max(a, leaf);
    } }
  }
  a *= (1.0 - smoothstep(0.38, 0.5, length(uv - 0.5) + (vn(uv * 9.0, vec2i(9), 181u) - 0.5) * 0.14));
  return M(c, a, a * 0.004, 0.75 + 0.25 * a, 0.7);
}
// far-distance conifer silhouette: v=0 top, v=1 base
fn mImpostor(uv: vec2f) -> M {
  let x = abs(uv.x - 0.5); let t = uv.y;
  let k = t * 9.0; let kf = fract(k);
  let prof = 0.47 * smoothstep(0.0, 1.0, t * 1.06) * (0.58 + 0.42 * kf);
  let jag = (vn(uv * 44.0, vec2i(44), 191u) - 0.5) * 0.07;
  var a = smoothstep(-0.006, 0.01, prof - x + jag) * step(t, 0.9);
  let trunk = step(x, 0.022) * step(0.86, t);
  let n = vn(uv * vec2f(60.0, 30.0), vec2i(60, 30), 192u);
  var c = mix(vec3f(0.03, 0.065, 0.028), vec3f(0.10, 0.18, 0.065), (1.0 - kf) * 0.6 + n * 0.4);
  c *= 0.75 + 0.5 * (1.0 - smoothstep(0.0, 0.5, x / max(prof, 0.01)));
  c = mix(c, vec3f(0.14, 0.10, 0.07), trunk * (1.0 - a));
  return M(c, max(a, trunk), 0.0, 0.6 + 0.4 * (1.0 - kf), 0.85);
}
fn mCloth(uv: vec2f) -> M {
  let weave = sin(uv.x * 48.0 * TAU) * sin(uv.y * 48.0 * TAU);
  let n = fbm(uv * 8.0, vec2i(8), 3, 201u);
  let thread = vn(uv * vec2f(96.0, 6.0), vec2i(96, 6), 202u) * 0.5 + vn(uv.yx * vec2f(96.0, 6.0), vec2i(96, 6), 203u) * 0.5;
  let c = vec3f(0.9) * (0.85 + 0.15 * thread) * (0.93 + 0.07 * weave) * (0.88 + 0.22 * n);
  return M(c, 1.0, weave * 0.0012 + n * 0.002, 1.0, 0.95);
}
fn mMetal(uv: vec2f) -> M {
  let v = vor(uv * 14.0, vec2i(14), 211u);
  let dent = (1.0 - smoothstep(0.0, 0.5, v.x));
  let n = fbm(uv * 10.0, vec2i(10), 4, 212u);
  let scr = vn(uv * vec2f(6.0, 120.0), vec2i(6, 120), 213u);
  var c = vec3f(0.30, 0.31, 0.33) * (0.75 + 0.4 * n) * (0.92 + 0.16 * scr);
  let rust = smoothstep(0.62, 0.8, fbm(uv * 7.0, vec2i(7), 4, 214u));
  c = mix(c, vec3f(0.32, 0.17, 0.08) * (0.7 + 0.5 * n), rust * 0.6);
  return M(c, 1.0, dent * 0.004 + n * 0.002, 1.0, mix(0.36, 0.8, rust));
}
fn mStripes(uv: vec2f) -> M {
  let s = step(0.5, fract(uv.x * 4.0));
  let weave = sin(uv.x * 40.0 * TAU) * sin(uv.y * 40.0 * TAU);
  let n = fbm(uv * 6.0, vec2i(6), 3, 221u);
  let c = mix(vec3f(0.84, 0.78, 0.64), vec3f(1.0), s) * (0.86 + 0.22 * n) * (0.94 + 0.06 * weave);
  return M(c, s, weave * 0.001 + n * 0.002, 1.0, 0.95);
}
fn material(l: i32, uv: vec2f) -> M {
  switch (l) {
    case 1 { return mPlaster(uv); } case 2 { return mTimber(uv); } case 3 { return mPlanks(uv); }
    case 4 { return mStone(uv); } case 5 { return mCobble(uv); } case 6 { return mThatch(uv); }
    case 7 { return mShingle(uv); } case 8 { return mDirt(uv); } case 9 { return mGrass(uv); }
    case 10 { return mRock(uv); } case 11 { return mBark(uv); } case 12 { return mBirch(uv); }
    case 13 { return mPine(uv); } case 14 { return mLeaves(uv); } case 15 { return mImpostor(uv); }
    case 16 { return mCloth(uv); } case 17 { return mMetal(uv); } case 18 { return mStripes(uv); }
    default { return M(vec3f(1.0), 1.0, 0.0, 1.0, 0.8); }
  }
}
struct FOut { @location(0) albedo: vec4f, @location(1) aux: vec4f };
@fragment fn fsMat(i: VSOut) -> FOut {
  let m = material(i32(u.layer), i.uv);
  var o: FOut; o.albedo = vec4f(max(m.c, vec3f(0.0)), m.a); o.aux = vec4f(m.h, m.ao, m.r, 1.0); return o;
}
// tileable multi-purpose noise: R low fbm, G mid fbm, B cells, A fine fbm
@fragment fn fsNoise(i: VSOut) -> @location(0) vec4f {
  return vec4f(fbm(i.uv * 4.0, vec2i(4), 5, 301u), fbm(i.uv * 8.0, vec2i(8), 4, 302u), vor(i.uv * 8.0, vec2i(8), 303u).x, fbm(i.uv * 16.0, vec2i(16), 3, 304u));
}
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
// height (aux.r, metres) -> tangent-space normal;  out = (nx, ny, ao, roughness)
@fragment fn fsNormal(i: VSOut) -> @location(0) vec4f {
  let n = i32(u.res); let p = vec2i(i.pos.xy);
  let hl = textureLoad(src, (p + vec2i(n - 1, 0)) % n, 0).r; let hr = textureLoad(src, (p + vec2i(1, 0)) % n, 0).r;
  let hu = textureLoad(src, (p + vec2i(0, n - 1)) % n, 0).r; let hd = textureLoad(src, (p + vec2i(0, 1)) % n, 0).r;
  let c = textureLoad(src, p, 0);
  let k = u.res / (2.0 * u.tile);
  let nrm = normalize(vec3f(-(hr - hl) * k, -(hd - hu) * k, 1.0));
  return vec4f(nrm.xy * 0.5 + 0.5, c.g, c.b);
}
// pack file layout for the normal/occlusion/roughness maps: one grey image holding four maps as a 2x2 mosaic (nx ny / ao rough)
@fragment fn fsPack(i: VSOut) -> @location(0) vec4f {
  let q = vec2f(textureDimensions(src)) * 0.5;
  let uv = clamp(i.uv, vec2f(0.5) / q, vec2f(1.0) - vec2f(0.5) / q) * 0.5;
  return vec4f(textureSampleLevel(src, smp, uv, 0.0).r, textureSampleLevel(src, smp, uv + vec2f(0.5, 0.0), 0.0).r,
               textureSampleLevel(src, smp, uv + vec2f(0.0, 0.5), 0.0).r, textureSampleLevel(src, smp, uv + vec2f(0.5), 0.0).r);
}
@fragment fn fsMip(i: VSOut) -> @location(0) vec4f {
  let c = textureSampleLevel(src, smp, i.uv, 0.0);
  return vec4f(c.rgb, clamp(c.a * u.gain, 0.0, 1.0));
}`;

const TG = {};
function tgInit() {
  const d = G.device, FS = GPUShaderStage.FRAGMENT;
  TG.mod = shaderModule(WGSL_TEXGEN, 'texgen');
  TG.TU = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
  TG.lin = d.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  TG.bglU = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: FS, buffer: {} }] });
  TG.bglT = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: FS, buffer: {} }, { binding: 1, visibility: FS, texture: {} }, { binding: 2, visibility: FS, sampler: {} }] });
  const plU = d.createPipelineLayout({ bindGroupLayouts: [TG.bglU] }), plT = d.createPipelineLayout({ bindGroupLayouts: [TG.bglT] });
  const mk = (layout, entry, targets) => d.createRenderPipeline({ layout, vertex: { module: TG.mod, entryPoint: 'vs' }, fragment: { module: TG.mod, entryPoint: entry, targets: targets.map(format => ({ format })) } });
  TG.pMat = mk(plU, 'fsMat', ['rgba8unorm-srgb', 'rgba16float']); TG.pNoise = mk(plU, 'fsNoise', ['rgba8unorm']); TG.pNormal = mk(plT, 'fsNormal', ['rgba8unorm']);
  TG.pMipS = mk(plT, 'fsMip', ['rgba8unorm-srgb']); TG.pMipL = mk(plT, 'fsMip', ['rgba8unorm']); TG.pPack = mk(plT, 'fsPack', ['rgba8unorm']);
  TG.ubuf = (vals) => { const b = d.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(b, 0, new Float32Array(vals)); return b; };
  TG.pass = (enc, view, pipe, bg, view2) => {
    const atts = [{ view, loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 0] }];
    if (view2) atts.push({ view: view2, loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 0] });
    const p = enc.beginRenderPass({ colorAttachments: atts });
    p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); p.end();
  };
  TG.lv = (tex, layer, mip) => tex.createView({ dimension: '2d', baseArrayLayer: layer, arrayLayerCount: 1, baseMipLevel: mip, mipLevelCount: 1 });
  TG.bgT = (ub, view) => d.createBindGroup({ layout: TG.bglT, entries: [{ binding: 0, resource: { buffer: ub } }, { binding: 1, resource: view }, { binding: 2, resource: TG.lin }] });
  // fills the mips below level 0 of one array layer
  TG.mips = (enc, tex, layer, res, pipe, gain) => {
    const ub = TG.ubuf([0, res, 1, gain || 1]);
    for (let m = 1; (res >> m) >= 1; m++) TG.pass(enc, TG.lv(tex, layer, m), pipe, TG.bgT(ub, TG.lv(tex, layer, m - 1)));
  };
}
function tgArrays(resA, resN, layers, tag) {
  const d = G.device;
  return [d.createTexture({ size: [resA, resA, layers], format: 'rgba8unorm-srgb', mipLevelCount: Math.log2(resA) + 1, usage: TG.TU, label: 'albedo' + tag }),
          d.createTexture({ size: [resN, resN, layers], format: 'rgba8unorm', mipLevelCount: Math.log2(resN) + 1, usage: TG.TU, label: 'nar' + tag })];
}
// generated layers: gens[i] is the generator id for layer i
async function tgGenerate(alb, nar, res, gens, tiles, cutout, progress) {
  const d = G.device, tmp = d.createTexture({ size: [res, res], format: 'rgba16float', usage: TG.TU }), tmpView = tmp.createView();
  for (let l = 0; l < gens.length; l++) {
    const ub = TG.ubuf([gens[l], res, tiles[l], 1]);
    const enc = d.createCommandEncoder();
    TG.pass(enc, TG.lv(alb, l, 0), TG.pMat, d.createBindGroup({ layout: TG.bglU, entries: [{ binding: 0, resource: { buffer: ub } }] }), tmpView);
    TG.pass(enc, TG.lv(nar, l, 0), TG.pNormal, TG.bgT(ub, tmpView));
    // cut-out layers get an alpha boost per mip so thin foliage keeps its coverage far away
    TG.mips(enc, alb, l, res, TG.pMipS, cutout && cutout[l] ? 1.22 : 1); TG.mips(enc, nar, l, res, TG.pMipL, 1);
    d.queue.submit([enc.finish()]);
    if ((l % 4) === 3) { await d.queue.onSubmittedWorkDone(); if (progress) progress(l / gens.length); }
  }
  await d.queue.onSubmittedWorkDone(); tmp.destroy();
}
// array B (special layers) and the shared noise texture
async function genTextures(res, progress) {
  const d = G.device;
  tgInit();
  [G.albedoB, G.normalB] = tgArrays(res, res, MAT_B_GEN.length, 'B');
  await tgGenerate(G.albedoB, G.normalB, res, MAT_B_GEN, MAT_B_GEN.map((g, i) => MAT_TILE[MAT_B0 + i]), MAT_B_CUTOUT, progress);
  const NR = 256, nmips = 9;
  G.noiseTex = d.createTexture({ size: [NR, NR], format: 'rgba8unorm', mipLevelCount: nmips, usage: TG.TU, label: 'noise' });
  const ub = TG.ubuf([0, NR, 1, 1]), enc = d.createCommandEncoder();
  const v = m => G.noiseTex.createView({ baseMipLevel: m, mipLevelCount: 1 });
  TG.pass(enc, v(0), TG.pNoise, d.createBindGroup({ layout: TG.bglU, entries: [{ binding: 0, resource: { buffer: ub } }] }));
  for (let m = 1; m < nmips; m++) TG.pass(enc, v(m), TG.pMipL, TG.bgT(ub, v(m - 1)));
  d.queue.submit([enc.finish()]);
  await d.queue.onSubmittedWorkDone();
}
// array A generated on the GPU: the stand-in when the texture pack is unavailable
async function genSurfaces(res, progress) {
  [G.albedoArr, G.normalArr] = tgArrays(res, res, MAT_A.length, 'A');
  await tgGenerate(G.albedoArr, G.normalArr, res, MAT_A_GEN, MAT_A.map((n, i) => MAT_TILE[i]), null, progress);
  G.pack = 'generated';
}
// ───────────────────────── texture pack (scanned surfaces baked offline, shipped next to the page) ─────────────────────────
async function packImage(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  const blob = await r.blob();
  return createImageBitmap(blob.type.startsWith('image/') ? blob : new Blob([blob], { type: url.endsWith('.jpg') ? 'image/jpeg' : 'image/webp' }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
}
// plain images: albedo as WebP (rgb + tint mask or height in alpha), the other maps as one grey JPEG mosaic. Decoded here, mips built on the GPU.
async function loadPackImages(resA, resN, progress) {
  const d = G.device, NA = MAT_A.length, SRC = 1024;
  const [alb, nar] = tgArrays(resA, resN, NA, 'A');
  const tmpA = resA === SRC ? null : d.createTexture({ size: [SRC, SRC], format: 'rgba8unorm-srgb', usage: TG.TU });
  const tmpN = d.createTexture({ size: [SRC * 2, SRC * 2], format: 'rgba8unorm', usage: TG.TU });
  const ub = TG.ubuf([0, resN, 1, 1]);
  let done = 0, next = 0;
  const worker = async () => {
    while (next < NA) {
      const l = next++;
      const [ia, im] = await Promise.all([packImage('tex/a_' + MAT_A[l] + '.webp'), packImage('tex/n_' + MAT_A[l] + '.jpg')]);
      if (ia.width !== SRC || im.width !== SRC * 2) throw new Error('unexpected pack image size');
      // everything below runs without yielding, so the shared scratch textures are safe
      const enc = d.createCommandEncoder();
      if (tmpA) { d.queue.copyExternalImageToTexture({ source: ia }, { texture: tmpA }, [SRC, SRC]); TG.pass(enc, TG.lv(alb, l, 0), TG.pMipS, TG.bgT(ub, tmpA.createView())); }
      else d.queue.copyExternalImageToTexture({ source: ia }, { texture: alb, origin: [0, 0, l] }, [SRC, SRC]);
      d.queue.copyExternalImageToTexture({ source: im }, { texture: tmpN }, [SRC * 2, SRC * 2]);
      TG.pass(enc, TG.lv(nar, l, 0), TG.pPack, TG.bgT(ub, tmpN.createView()));
      TG.mips(enc, alb, l, resA, TG.pMipS, 1); TG.mips(enc, nar, l, resN, TG.pMipL, 1);
      d.queue.submit([enc.finish()]);
      ia.close(); im.close();
      await d.queue.onSubmittedWorkDone();
      if (progress) progress(++done / NA);
    }
  };
  try { await Promise.all([worker(), worker(), worker()]); }
  catch (e) { next = NA; alb.destroy(); nar.destroy(); throw e; }
  finally { if (tmpA) tmpA.destroy(); tmpN.destroy(); }
  G.albedoArr = alb; G.normalArr = nar; G.pack = 'images ' + resA + '/' + resN;
}

// The artifact host only serves web file types, so each compressed blob travels as a grey PNG whose pixel bytes are the data.
// It is unpacked by hand (rows are stored unfiltered) so no canvas or colour management can touch the bytes.
async function packBlob(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  const png = new Uint8Array(await r.arrayBuffer()), dv = new DataView(png.buffer);
  if (png.length < 64 || dv.getUint32(0) !== 0x89504e47) throw new Error('bad pack file');
  let off = 8, w = 0, h = 0; const parts = [];
  while (off + 12 <= png.length) {
    const len = dv.getUint32(off), type = dv.getUint32(off + 4);
    if (type === 0x49484452) { w = dv.getUint32(off + 8); h = dv.getUint32(off + 12); }
    else if (type === 0x49444154) parts.push(png.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = new Uint8Array(await new Response(new Blob(parts).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  if (!w || raw.length !== h * (w + 1)) throw new Error('bad pack file');
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    if (raw[y * (w + 1)] !== 0) throw new Error('bad pack file');        // a filtered row means something re-encoded the image on the way
    out.set(raw.subarray(y * (w + 1) + 1, (y + 1) * (w + 1)), y * w);
  }
  return out.buffer;
}
// compressed variant: every mip level arrives ready-made, so there is nothing to decode and no mips to build
async function loadPackAstc(progress) {
  const d = G.device, NA = MAT_A.length;
  const files = await Promise.all([0, 1].map(k => packBlob('tex/' + 'an'[k] + '_' + MAT_A[0] + '.png')));
  const head = buf => { const v = new DataView(buf); if (v.getUint32(0, true) !== 0x58544642) throw new Error('bad pack file'); return { bw: v.getUint8(4), bh: v.getUint8(5), res: v.getUint16(6, true), n: v.getUint8(8) }; };
  const mk = (h, srgb, label) => d.createTexture({ size: [h.res, h.res, NA], format: 'astc-' + h.bw + 'x' + h.bh + '-unorm' + (srgb ? '-srgb' : ''), mipLevelCount: h.n, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST, label });
  d.pushErrorScope('validation');
  const hs = files.map(head), tex = [mk(hs[0], true, 'albedoA'), mk(hs[1], false, 'narA')];
  const put = (k, buf, layer) => {
    const h = head(buf); let off = 16;
    for (let m = 0; m < h.n; m++) {
      const w = Math.max(1, h.res >> m), bx = Math.ceil(w / h.bw), by = Math.ceil(w / h.bh), len = bx * by * 16;
      d.queue.writeTexture({ texture: tex[k], mipLevel: m, origin: [0, 0, layer] }, new Uint8Array(buf, off, len), { bytesPerRow: bx * 16, rowsPerImage: by }, [bx * h.bw, by * h.bh, 1]);
      off += len;
    }
  };
  let done = 0, next = 0, failed = null;
  const worker = async () => {
    while (next < NA && !failed) {
      const l = next++;
      try {
        const bufs = l === 0 ? files : await Promise.all([0, 1].map(k => packBlob('tex/' + 'an'[k] + '_' + MAT_A[l] + '.png')));
        put(0, bufs[0], l); put(1, bufs[1], l);
        if (progress) progress(++done / NA);
      } catch (e) { failed = e; }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  const err = await d.popErrorScope();
  if (failed || err) { tex[0].destroy(); tex[1].destroy(); throw failed || new Error(err.message); }
  await d.queue.onSubmittedWorkDone();
  G.albedoArr = tex[0]; G.normalArr = tex[1]; G.pack = 'astc ' + hs[0].res;
}
async function loadPack(lowMem, progress) {
  if (G.astc && !(TEST && TEST.pack === 'images')) {
    try { await loadPackAstc(progress); return; } catch (e) { console.warn('compressed pack failed, using images: ' + (e && e.message || e)); G.packNote = String(e && e.message || e); }
  }
  // without compression phones keep the normal maps at half size
  const small = lowMem || coarse();
  await loadPackImages(lowMem ? 512 : 1024, small ? 512 : 1024, progress);
}
