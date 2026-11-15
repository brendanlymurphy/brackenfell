// ───────────────────────── renderer: quality tiers, camera, sun and shadows, post, frame ─────────────────────────
const QUALITY = {
  low:    { name: 'Low',    pr: 1.0, msaa: 1, shadowRes: 1024, bloom: false, grassRange: 18, grassThin: 1.45, treeLod: 40, lights: 4, aniso: 2, far1: 3, shadowNear: 16, scatter: false, yardRange: 32, yardCast: false, rockDist: 90, villagerCast: 16, maxLong: 1024, farStatics: false },
  medium: { name: 'Medium', pr: 1.5, msaa: 4, shadowRes: 1536, bloom: true,  grassRange: 30, grassThin: 1.15, treeLod: 65, lights: 6, aniso: 4, far1: 2, shadowNear: 20, scatter: true, yardRange: 58, yardCast: true, rockDist: 170, villagerCast: 32, maxLong: 1280, farStatics: false },
  high:   { name: 'High',   pr: 2.0, msaa: 4, shadowRes: 2048, bloom: true,  grassRange: 36, grassThin: 1, treeLod: 90, lights: 8, aniso: 8, far1: 2, shadowNear: 24, scatter: true, yardRange: 58, yardCast: true, rockDist: 170, villagerCast: 32, maxLong: 1920, farStatics: true },
};
const R = {
  q: QUALITY.high, qName: 'high', scale: 1, frame: 0, P: null, busy: false,
  cam: { pos: [0, 2, 0], yaw: 0, pitch: 0, fovMin: 0.92 },
  maxSkin: 96, boneData: new Float32Array(96 * 256),
  partMax: 1536, partData: new Float32Array(1536 * 12), partCount: 0,
  stats: { draws: 0, tris: 0 },
};
function renderInit() {
  const cam = R.camera = new THREE.PerspectiveCamera(60, 1, 0.09, 12000);
  cam.rotation.order = 'YXZ'; cam.layers.enable(1);
  const sun = R.sun = new THREE.DirectionalLight(0xffffff, Math.PI);
  sun.castShadow = true; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.05;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 700;
  // count what one whole frame draws (shadow maps and the scene pass run nested inside the pipeline's own render call)
  const info = G.renderer.info, upd = info.update.bind(info);
  info.update = (o, count, inst) => { R.stats.n++; if (o.isMesh) R.stats.t += inst * count / 3; upd(o, count, inst); };
}
function camBasis(cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const f = [sy * cp, sp, -cy * cp], r = [cy, 0, sy], u = v3.cross(r, f);
  return { f, r, u };
}
async function setQuality(name) {
  const prev = R.P ? R.q : null;
  R.qName = name; const q = R.q = QUALITY[name], U = SH.U, r = G.renderer;
  if (!SC.scene) {
    G.albedoArr.anisotropy = Math.min(q.aniso, r.getMaxAnisotropy ? r.getMaxAnisotropy() : q.aniso); G.narArr.anisotropy = Math.min(q.aniso, 4);
    const scene = sceneBuild();
    scene.add(R.sun); scene.add(R.sun.target);
    scene.fogNode = TSL.fog(SH.fogColor(), SH.fogAmount());
    Sky.build(scene); Particles.build(scene);
    if (G.chars) scene.add(Chars.group);
  }
  // sun shadows: a tight map around the player and a wide one beyond it
  if (!R.shadows) { R.shadows = makeSunShadows(R.sun); for (const l of R.shadows.lights) { SC.scene.add(l); SC.scene.add(l.target); } R.sun.shadow.shadowNode = R.shadows; }
  if (!prev || prev.shadowRes !== q.shadowRes) for (const l of R.shadows.lights) { l.shadow.mapSize.set(q.shadowRes, q.shadowRes); if (l.shadow.map) { l.shadow.map.dispose(); l.shadow.map = null; } }
  U.grassRange.value = q.grassRange; U.treeLod.value = q.treeLod;
  { const lf = SC.mats.leaf, a2c = q.msaa > 1; if (lf.alphaToCoverage !== a2c) { lf.alphaToCoverage = a2c; lf.alphaTest = a2c ? 0.06 : 0.5; lf.needsUpdate = true; } }
  if (!prev || prev.grassRange !== q.grassRange || prev.grassThin !== q.grassThin) { if (prev) Grass.dispose(); Grass.build(SC.scene, q); }
  if (!prev || prev.msaa !== q.msaa || prev.bloom !== q.bloom) buildPipeline();
  R.P = true; R.camKey = '';
}
function buildPipeline() {
  const { pass, uniform, Fn, vec2, vec3, vec4, dot, mix, smoothstep, pow, max, clamp, screenUV, screenCoordinate, fract, sin } = TSL;
  if (R.pipeline) R.pipeline.dispose();
  const q = R.q, scenePass = R.scenePass = pass(SC.scene, R.camera, { samples: q.msaa > 1 ? q.msaa : 0 });
  scenePass.setResolutionScale(R.scale); R.passScale = R.scale;
  const col = scenePass.getTextureNode('output');
  let hdr = col.rgb;
  R.bloomNode = null;
  if (q.bloom) { R.bloomNode = T3X.bloom(col, 0.22, 0.55, 1.6); hdr = hdr.add(R.bloomNode.rgb); }
  const P = R.pu = { exposure: uniform(0.6), vignette: uniform(0.55), sat: uniform(1.0), frame: uniform(0) };
  const lum = vec3(0.2126, 0.7152, 0.0722);
  const fin = Fn(() => {
    const qv = screenUV.sub(0.5);
    const x = max(hdr, vec3(0)).mul(P.exposure).mul(dot(qv, qv).mul(P.vignette).oneMinus()).toVar();
    const c = clamp(x.mul(x.mul(2.51).add(0.03)).div(x.mul(x.mul(2.43).add(0.59)).add(0.14)), 0, 1).toVar();      // ACES (Narkowicz)
    // grade: a little more contrast and colour, shadows leaning cool and highlights warm
    c.assign(mix(vec3(dot(c, lum)), c, P.sat));
    c.assign(mix(c, c.mul(c).mul(c.mul(-2).add(3)), 0.22));
    c.mulAssign(mix(vec3(0.93, 0.99, 1.07), vec3(1.045, 1.0, 0.93), smoothstep(0.06, 0.62, dot(c, lum))));
    c.assign(pow(max(c, vec3(0)), vec3(1 / 2.2)));
    const n = fract(sin(dot(screenCoordinate.xy.add(P.frame), vec2(12.9898, 78.233))).mul(43758.5453));
    return vec4(c.add(n.sub(0.5).div(255)), 1);
  })();
  const p = R.pipeline = new THREE.RenderPipeline(G.renderer, fin);
  p.outputColorTransform = false;
}
// Two shadow maps for the one sun, blended by distance from each map's centre: a tight one around the player drawn every
// frame and a wide one redrawn every few frames. Both are always sampled, so there is no branching around shadow lookups.
function makeSunShadows(light) {
  const { Fn, uniform, vec4, dot, length, smoothstep, mix, shadowPositionWorld } = TSL;
  class SunShadows extends THREE.ShadowBaseNode {
    constructor() {
      super(light); this.updateBeforeType = THREE.NodeUpdateType.NONE;
      this.lights = []; this.nodes = []; this.centre = [uniform(new THREE.Vector3()), uniform(new THREE.Vector3())]; this.radius = [uniform(24), uniform(92)];
      for (let i = 0; i < 2; i++) {
        const lw = new THREE.Object3D(); lw.target = new THREE.Object3D(); lw.castShadow = true;
        const sh = lw.shadow = light.shadow.clone(); sh.bias = light.shadow.bias * (i ? 3 : 1); sh.normalBias = light.shadow.normalBias * (i ? 3 : 1);
        if (i) { sh.autoUpdate = false; sh.camera.layers.enable(2); } else sh.camera.layers.enable(1);
        this.lights.push(lw); this.nodes.push(TSL.shadow(lw, sh));
      }
    }
    setup(builder) {
      return Fn(() => {
        this.setupShadowPosition(builder);
        const U = SH.U, w = i => { const d = shadowPositionWorld.sub(this.centre[i]), perp = d.sub(U.sunDir.mul(dot(d, U.sunDir))); return smoothstep(0.80, 0.96, length(perp).div(this.radius[i])).oneMinus(); };
        return mix(mix(vec4(1), this.nodes[1], w(1)), this.nodes[0], w(0));
      })();
    }
  }
  return new SunShadows();
}
function shadowPlace(i, c, radius, L, env) {
  const S = R.shadows, lw = S.lights[i], sh = lw.shadow, cam = sh.camera, texel = 2 * radius / sh.mapSize.x, D = 260;
  const z = L, up = Math.abs(z[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0], x = v3.norm(v3.cross(up, z)), y = v3.cross(z, x);
  const cx = Math.round(v3.dot(c, x) / texel) * texel, cy = Math.round(v3.dot(c, y) / texel) * texel, cz = v3.dot(c, z);
  const p = [x[0] * cx + y[0] * cy + z[0] * cz, x[1] * cx + y[1] * cy + z[1] * cz, x[2] * cx + y[2] * cy + z[2] * cz];
  lw.target.position.set(p[0], p[1], p[2]); lw.position.set(p[0] + z[0] * D, p[1] + z[1] * D, p[2] + z[2] * D);
  lw.updateMatrixWorld(); lw.target.updateMatrixWorld();
  if (cam.right !== radius) { cam.left = -radius; cam.right = radius; cam.top = radius; cam.bottom = -radius; cam.near = 1; cam.far = D + 150; cam.updateProjectionMatrix(); }
  sh.intensity = env.shadowStrength;
  S.centre[i].value.set(p[0], p[1], p[2]); S.radius[i].value = radius;
}
// choose the point lights that matter for this view
function pickLights(camPos, camZone, env) {
  const cand = [], maxN = R.q.lights, U = SH.U, P = U.lightPos.array, C = U.lightCol.array;
  for (const l of World.lights) {
    const inten = l.power(env); if (inten <= 0.003) continue;
    const dx = l.p[0] - camPos[0], dy = l.p[1] - camPos[1], dz = l.p[2] - camPos[2], d2 = dx * dx + dy * dy + dz * dz;
    const reach = l.r + 34; if (d2 > reach * reach) continue;
    let score = inten * l.r / (d2 + 4);
    if (l.zone === camZone) score *= 6; else if (l.zone !== 0 && camZone === 0) score *= 0.5; else if (l.zone !== 0) score *= 0.05;
    cand.push([score, l, inten * (1 - smooth(l.r + 20, l.r + 34, Math.sqrt(d2)))]);
  }
  cand.sort((a, b) => b[0] - a[0]);
  const n = Math.min(cand.length, maxN);
  const pick = cand.slice(0, n).map((c, i) => [c[1], c[2] * (i >= maxN - 1 && cand.length > maxN ? 0.5 : 1)]);
  const outdoor = pick.filter(x => x[0].zone === 0 || x[0].zone > 254.5), sorted = outdoor.concat(pick.filter(x => !(x[0].zone === 0 || x[0].zone > 254.5)));      // lights that reach the open air first, so outdoor surfaces stop their loop early
  for (let i = 0; i < 8; i++) {
    if (i >= n) { P[i].set(0, -9999, 0, 0); C[i].set(0, 0, 0, 0); continue; }
    const l = sorted[i][0], k = sorted[i][1];
    P[i].set(l.p[0], l.p[1], l.p[2], l.r); C[i].set(l.c[0] * k, l.c[1] * k, l.c[2] * k, l.zone);
  }
  U.lightN.value = n; U.lightNOut.value = outdoor.length;
  return n;
}
function renderFrame(time, env) {
  const q = R.q, cam = R.cam, c3 = R.camera, r = G.renderer, e = cam.pos;
  R.frame++;
  // ── camera: keep the short side's field of view, cap how wide the long side may get ──
  const aspect = G.w / G.h;
  let fovy = aspect > 1 ? cam.fovMin : 2 * Math.atan(Math.tan(cam.fovMin / 2) / aspect);
  fovy = Math.min(fovy, 1.75); if (aspect > 1) { const hf = 2 * Math.atan(Math.tan(fovy / 2) * aspect); if (hf > 1.62) fovy = 2 * Math.atan(Math.tan(1.62 / 2) / aspect); }
  const key = aspect.toFixed(4) + ':' + fovy.toFixed(4);
  if (key !== R.camKey) { R.camKey = key; c3.aspect = aspect; c3.fov = fovy * 180 / Math.PI; c3.updateProjectionMatrix(); }
  c3.position.set(e[0], e[1], e[2]); c3.rotation.set(cam.pitch, -cam.yaw, 0); c3.updateMatrixWorld();
  const { f } = camBasis(cam);
  // ── light and atmosphere ──
  SH.update(env, e, time);
  pickLights(e, World.camZone | 0, env);
  const L = env.keyDir, sun = R.sun;
  sun.position.set(L[0] * 100, L[1] * 100, L[2] * 100); sun.target.position.set(0, 0, 0); sun.color.setRGB(env.keyCol[0], env.keyCol[1], env.keyCol[2]);
  // near map every frame, far map every few frames (its centre only moves when it is redrawn)
  const fh = v3.norm([f[0], 0, f[2]]), r0 = q.shadowNear, r1 = 92, S = R.shadows;      // r0: radius (m) of the tight shadow map, which is drawn every frame
  const upd1 = !R.shadow1Ready || (!World.deepIn && ((R.frame % q.far1) === 1 || !!TEST));      // deep inside a building the far map keeps what it last saw (see deepIndoors)
  shadowPlace(0, [e[0] + fh[0] * r0 * 0.72, e[1], e[2] + fh[2] * r0 * 0.72], r0, L, env);
  if (upd1) { shadowPlace(1, [e[0] + fh[0] * r1 * 0.6, e[1], e[2] + fh[2] * r1 * 0.6], r1, L, env); R.shadow1Ready = true; }
  S.lights[1].shadow.needsUpdate = upd1;
  // ── world ──
  sceneUpdate(e, q);
  Sky.update(e); Grass.update(e, [f[0], f[2]]); Particles.update();
  // ── post ──
  if (R.passScale !== R.scale) { R.scenePass.setResolutionScale(R.scale); R.passScale = R.scale; }
  R.pu.exposure.value = env.exposure; R.pu.frame.value = (R.frame % 64) * 1.37;
  if (R.bloomNode) R.bloomNode.threshold.value = 1.15 / env.exposure;
  R.stats.n = 0; R.stats.t = 0;
  // Three advances its frame counter in its own animation loop; this game drives the loop itself, so step it here or
  // per-frame nodes (the scene pass, shadow maps) would only ever run once
  const nf = r._nodes && r._nodes.nodeFrame; if (nf) { nf.update(); r.info.frame = nf.frameId; }
  // a headless test browser cannot present a WebGPU canvas (it loses the device), so test frames always go to a target
  const off = TEST && r.backend.isWebGPUBackend && !r.getRenderTarget();
  if (off) { if (!G.testRT) G.testRT = new THREE.RenderTarget(G.w, G.h, { type: THREE.UnsignedByteType, depthBuffer: false }); r.setRenderTarget(G.testRT); }
  R.pipeline.render();
  if (off) r.setRenderTarget(null);
  R.stats.draws = R.stats.n; R.stats.tris = Math.round(R.stats.t);
}
