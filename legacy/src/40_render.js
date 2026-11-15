// ───────────────────────── renderer: targets, pipelines, frame ─────────────────────────
const QUALITY = {
  low:    { name: 'Low',    pr: 1.0,  msaa: 1, shadowRes: 1024, bloom: false, grassRange: 18, grassDensity: 0.30, treeLod: 40, lights: 4, aniso: 2, cloudShadow: 0.0, far1: 3, ao: 0 },
  medium: { name: 'Medium', pr: 1.5,  msaa: 4, shadowRes: 1536, bloom: true,  grassRange: 30, grassDensity: 0.60, treeLod: 65, lights: 6, aniso: 4, cloudShadow: 0.55, far1: 2, ao: 1 },
  high:   { name: 'High',   pr: 2.0,  msaa: 4, shadowRes: 2048, bloom: true,  grassRange: 42, grassDensity: 1.00, treeLod: 90, lights: 8, aniso: 8, cloudShadow: 0.55, far1: 2, ao: 1 },
};
const R = {
  q: QUALITY.high, qName: 'high', scale: 1, frame: 0,
  gdata: new Float32Array(184), sdata: [new Float32Array(28), new Float32Array(28)],
  cam: { pos: [0, 2, 0], yaw: 0, pitch: 0, fovMin: 0.92 },
  vp: m4.create(), view: m4.create(), proj: m4.create(), planes: new Float32Array(20),
  shadowVP: [m4.create(), m4.create()], shadowC: [[0, 0, 0, 1], [0, 0, 0, 1]],
  partMax: 1536, partData: null, partCount: 0,
  stats: { draws: 0, tris: 0 },
};
const VB_STATIC = { arrayStride: 32, attributes: [
  { shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 1, offset: 12, format: 'snorm8x4' },
  { shaderLocation: 2, offset: 16, format: 'float32x2' }, { shaderLocation: 3, offset: 24, format: 'unorm8x4' },
  { shaderLocation: 4, offset: 28, format: 'uint8x4' }] };
const VB_INST = { arrayStride: 32, stepMode: 'instance', attributes: [{ shaderLocation: 5, offset: 0, format: 'float32x4' }, { shaderLocation: 6, offset: 16, format: 'float32x4' }] };
const VB_GRASS = { arrayStride: 16, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }] };
const VB_PART = { arrayStride: 48, stepMode: 'instance', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }, { shaderLocation: 1, offset: 16, format: 'float32x4' }, { shaderLocation: 2, offset: 32, format: 'float32x4' }] };
const VB_SH_POS = { arrayStride: 32, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] };
const VB_SH_SKIN = { arrayStride: 32, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 4, offset: 28, format: 'uint8x4' }] };
const VB_SH_INST = { arrayStride: 32, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 1, offset: 12, format: 'snorm8x4' }, { shaderLocation: 2, offset: 16, format: 'float32x2' }, { shaderLocation: 4, offset: 28, format: 'uint8x4' }] };
const HDR = 'rgba16float';

function renderInit() {
  const d = G.device, VS = GPUShaderStage.VERTEX, FS = GPUShaderStage.FRAGMENT;
  R.modScene = shaderModule(WGSL_SCENE, 'scene'); R.modShadow = shaderModule(WGSL_SHADOW, 'shadow'); R.modPost = shaderModule(WGSL_POST, 'post'); R.modAO = shaderModule(WGSL_AO, 'ao');
  R.gbuf = d.createBuffer({ size: 184 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  R.sbuf = [0, 1].map(() => d.createBuffer({ size: 28 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
  R.bglScene = d.createBindGroupLayout({ entries: [
    { binding: 0, visibility: VS | FS, buffer: {} },
    { binding: 1, visibility: FS, sampler: {} },
    { binding: 2, visibility: FS, texture: { viewDimension: '2d-array' } },
    { binding: 3, visibility: FS, texture: { viewDimension: '2d-array' } },
    { binding: 4, visibility: VS | FS, texture: {} },
    { binding: 5, visibility: VS | FS, sampler: {} },
    { binding: 6, visibility: VS | FS, texture: { sampleType: 'depth', viewDimension: '2d-array' } },
    { binding: 7, visibility: VS | FS, sampler: { type: 'comparison' } },
    { binding: 8, visibility: VS | FS, texture: {} },
    { binding: 9, visibility: VS | FS, sampler: {} },
    { binding: 10, visibility: VS | FS, texture: {} },
    { binding: 11, visibility: FS, texture: { viewDimension: '2d-array' } }, { binding: 12, visibility: FS, texture: { viewDimension: '2d-array' } },
    { binding: 13, visibility: VS | FS, texture: {} }] });
  R.bglBones = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: VS, buffer: { type: 'read-only-storage' } }] });
  R.bglShadow = d.createBindGroupLayout({ entries: [
    { binding: 0, visibility: VS | FS, buffer: {} }, { binding: 1, visibility: FS, sampler: {} },
    { binding: 2, visibility: FS, texture: { viewDimension: '2d-array' } }] });
  R.bglPostA = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: FS, buffer: {} }, { binding: 1, visibility: FS, texture: {} }, { binding: 2, visibility: FS, sampler: {} }] });
  R.bglPostB = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: FS, buffer: {} }, { binding: 1, visibility: FS, texture: {} }, { binding: 2, visibility: FS, sampler: {} }, { binding: 3, visibility: FS, texture: {} }, { binding: 4, visibility: FS, texture: {} }] });
  R.bglAO = d.createBindGroupLayout({ entries: [{ binding: 0, visibility: FS, buffer: {} }, { binding: 1, visibility: FS, texture: { sampleType: 'depth', multisampled: true } }] });
  R.plScene = d.createPipelineLayout({ bindGroupLayouts: [R.bglScene] });
  R.plSkin = d.createPipelineLayout({ bindGroupLayouts: [R.bglScene, R.bglBones] });
  R.plShadow = d.createPipelineLayout({ bindGroupLayouts: [R.bglShadow] });
  R.plShadowSkin = d.createPipelineLayout({ bindGroupLayouts: [R.bglShadow, R.bglBones] });
  R.plPostA = d.createPipelineLayout({ bindGroupLayouts: [R.bglPostA] });
  R.plPostB = d.createPipelineLayout({ bindGroupLayouts: [R.bglPostB] });
  R.plAO = d.createPipelineLayout({ bindGroupLayouts: [R.bglAO] });
  R.aoNone = d.createTexture({ size: [1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
  d.queue.writeTexture({ texture: R.aoNone }, new Uint8Array([255, 0, 0, 255]), {}, [1, 1]);
  R.smpNoise = d.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' });
  R.smpClamp = d.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  R.smpShadow = d.createSampler({ magFilter: 'linear', minFilter: 'linear', compare: 'less-equal' });
  R.smpCut = d.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' });
  // bones: 48 skinned objects x 16 matrices
  R.maxSkin = 72; R.boneData = new Float32Array(R.maxSkin * 256);
  R.boneBuf = d.createBuffer({ size: R.boneData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  R.bgBones = d.createBindGroup({ layout: R.bglBones, entries: [{ binding: 0, resource: { buffer: R.boneBuf } }] });
  R.partData = new Float32Array(R.partMax * 12);
  R.partBuf = d.createBuffer({ size: R.partData.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  R.postBufs = []; for (let i = 0; i < 14; i++) R.postBufs.push(d.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }));
  // grass tuft: 3 blades, each one triangle.  (side, height, blade angle, radial offset)
  const gv = []; for (let b = 0; b < 3; b++) { const a = b * 2.2 + 0.4, ro = 0.3 + b * 0.35; gv.push(-1, 0, a, ro, 1, 0, a, ro, 0, 1, a, ro); }
  R.grassVB = makeBuffer(new Float32Array(gv), GPUBufferUsage.VERTEX, 'grass');
  const px = t => { const x = d.createTexture({ size: [1, 1], format: t, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST }); return x; };
  if (!G.splatTex) G.splatTex = px('rgba8unorm');
  if (!G.heightTex) G.heightTex = px('r16float');
}

async function setQuality(name) {
  const prevMsaa = R.P ? R.q.msaa : -1;
  R.qName = name; R.q = QUALITY[name]; R.shadow1Ready = false;
  const d = G.device, q = R.q;
  R.smpAniso = d.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat', maxAnisotropy: q.aniso });
  if (R.shadowTex) R.shadowTex.destroy();
  R.shadowTex = d.createTexture({ size: [q.shadowRes, q.shadowRes, 2], format: 'depth16unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
  R.shadowViews = [0, 1].map(l => R.shadowTex.createView({ dimension: '2d', baseArrayLayer: l, arrayLayerCount: 1 }));
  R.bgScene = d.createBindGroup({ layout: R.bglScene, entries: [
    { binding: 0, resource: { buffer: R.gbuf } }, { binding: 1, resource: R.smpAniso },
    { binding: 2, resource: G.albedoArr.createView({ dimension: '2d-array' }) }, { binding: 3, resource: G.normalArr.createView({ dimension: '2d-array' }) },
    { binding: 4, resource: G.noiseTex.createView() }, { binding: 5, resource: R.smpNoise },
    { binding: 6, resource: R.shadowTex.createView({ dimension: '2d-array' }) }, { binding: 7, resource: R.smpShadow },
    { binding: 8, resource: G.splatTex.createView() }, { binding: 9, resource: R.smpClamp },
    { binding: 10, resource: G.heightTex.createView() },
    { binding: 11, resource: G.albedoB.createView({ dimension: '2d-array' }) }, { binding: 12, resource: G.normalB.createView({ dimension: '2d-array' }) },
    { binding: 13, resource: G.splat2Tex.createView() }] });
  R.bgShadow = [0, 1].map(i => d.createBindGroup({ layout: R.bglShadow, entries: [{ binding: 0, resource: { buffer: R.sbuf[i] } }, { binding: 1, resource: R.smpCut }, { binding: 2, resource: G.albedoB.createView({ dimension: '2d-array' }) }] }));
  R.targetKey = '';
  if (R.q.msaa !== prevMsaa) await buildPipelines();       // only the sample count changes the pipelines
}

async function buildPipelines() {
  const d = G.device, q = R.q, sc = q.msaa, P = {};
  const depthMain = (write, compare) => ({ format: 'depth32float', depthWriteEnabled: write, depthCompare: compare || 'greater' });
  const mk = (o) => d.createRenderPipelineAsync({
    label: o.label, layout: o.layout || R.plScene,
    vertex: { module: o.mod || R.modScene, entryPoint: o.vs, buffers: o.buffers || [] },
    fragment: o.fs === null ? undefined : { module: o.mod || R.modScene, entryPoint: o.fs, targets: o.targets || [{ format: HDR, blend: o.blend }] },
    primitive: { topology: 'triangle-list', cullMode: o.cull || 'back', frontFace: 'ccw' },
    depthStencil: o.depth,
    multisample: { count: o.count === undefined ? sc : o.count, alphaToCoverageEnabled: !!o.a2c && sc > 1 },
  });
  const addBlend = { color: { srcFactor: 'one', dstFactor: 'one' }, alpha: { srcFactor: 'one', dstFactor: 'one' } };
  const preBlend = { color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } };
  const alphaBlend = { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } };
  const shDepth = { format: 'depth16unorm', depthWriteEnabled: true, depthCompare: 'less', depthBias: 3, depthBiasSlopeScale: 2.5 };
  const jobs = {
    opaque: mk({ label: 'opaque', vs: 'vsStatic', fs: 'fsOpaque', buffers: [VB_STATIC], depth: depthMain(true) }),
    terrain: mk({ label: 'terrain', vs: 'vsStatic', fs: 'fsTerrain', buffers: [VB_STATIC], depth: depthMain(true) }),
    instOpaque: mk({ label: 'instOpaque', vs: 'vsInst', fs: 'fsOpaque', buffers: [VB_STATIC, VB_INST], depth: depthMain(true) }),
    foliage: mk({ label: 'foliage', vs: 'vsInst', fs: 'fsFoliage', buffers: [VB_STATIC, VB_INST], depth: depthMain(true), cull: 'none', a2c: true }),
    grass: mk({ label: 'grass', vs: 'vsGrass', fs: 'fsGrass', buffers: [VB_GRASS], depth: depthMain(true), cull: 'none' }),
    skin: mk({ label: 'skin', layout: R.plSkin, vs: 'vsSkin', fs: 'fsOpaque', buffers: [VB_STATIC], depth: depthMain(true) }),
    water: mk({ label: 'water', vs: 'vsStatic', fs: 'fsWater', buffers: [VB_STATIC], depth: depthMain(false), blend: alphaBlend, cull: 'none' }),
    glow: mk({ label: 'glow', vs: 'vsStatic', fs: 'fsGlow', buffers: [VB_STATIC], depth: depthMain(false), blend: addBlend }),
    sky: mk({ label: 'sky', vs: 'vsSky', fs: 'fsSky', depth: depthMain(false, 'greater-equal'), cull: 'none' }),
    part: mk({ label: 'part', vs: 'vsPart', fs: 'fsPart', buffers: [VB_PART], depth: depthMain(false), blend: preBlend, cull: 'none' }),
    shStatic: mk({ label: 'shStatic', mod: R.modShadow, layout: R.plShadow, vs: 'vsStatic', fs: null, buffers: [VB_SH_POS], depth: shDepth, cull: 'none', count: 1 }),
    shSkin: mk({ label: 'shSkin', mod: R.modShadow, layout: R.plShadowSkin, vs: 'vsSkin', fs: null, buffers: [VB_SH_SKIN], depth: shDepth, cull: 'none', count: 1 }),
    shInst: mk({ label: 'shInst', mod: R.modShadow, layout: R.plShadow, vs: 'vsInst', fs: 'fsCut', targets: [], buffers: [VB_SH_INST, VB_INST], depth: shDepth, cull: 'none', count: 1 }),
    bright: mk({ label: 'bright', mod: R.modPost, layout: R.plPostA, vs: 'vs', fs: 'fsBright', count: 1, cull: 'none' }),
    down: mk({ label: 'down', mod: R.modPost, layout: R.plPostA, vs: 'vs', fs: 'fsDown', count: 1, cull: 'none' }),
    up: mk({ label: 'up', mod: R.modPost, layout: R.plPostA, vs: 'vs', fs: 'fsUp', count: 1, cull: 'none', blend: addBlend }),
    final: mk({ label: 'final', mod: R.modPost, layout: R.plPostB, vs: 'vs', fs: 'fsFinal', count: 1, cull: 'none', targets: [{ format: G.fmt }] }),
    // the occlusion passes are a nicety: if a browser will not build them the game simply runs without
    ao: mk({ label: 'ao', mod: R.modAO, layout: R.plAO, vs: 'vs', fs: 'fsAO', count: 1, cull: 'none', targets: [{ format: 'rgba8unorm' }] }).catch(e => { G.errors.push('[ao] ' + (e && e.message || e)); return null; }),
    aoBlur: mk({ label: 'aoBlur', mod: R.modPost, layout: R.plPostA, vs: 'vs', fs: 'fsAOBlur', count: 1, cull: 'none', targets: [{ format: 'rgba8unorm' }] }).catch(e => { G.errors.push('[ao] ' + (e && e.message || e)); return null; }),
  };
  for (const k in jobs) P[k] = await jobs[k];
  R.P = P; R.targetKey = null;
}

// internal render targets follow the canvas size x dynamic resolution scale
function ensureTargets() {
  const d = G.device, q = R.q;
  const w = Math.max(8, Math.round(G.w * R.scale)), h = Math.max(8, Math.round(G.h * R.scale));
  const key = w + 'x' + h + ':' + q.msaa + ':' + q.bloom + ':' + q.ao;
  if (key === R.targetKey) return;
  R.targetKey = key; R.iw = w; R.ih = h;
  for (const t of R.targets || []) t.destroy();
  const T = [], mkT = (w, h, format, usage, sampleCount) => { const t = d.createTexture({ size: [w, h], format, usage, sampleCount: sampleCount || 1 }); T.push(t); return t; };
  const RA = GPUTextureUsage.RENDER_ATTACHMENT, TB = GPUTextureUsage.TEXTURE_BINDING;
  R.hdr = mkT(w, h, HDR, RA | TB); R.hdrView = R.hdr.createView();
  R.aoOn = !!(q.ao && q.msaa > 1 && R.P && R.P.ao && R.P.aoBlur);
  R.depthTex = mkT(w, h, 'depth32float', R.aoOn ? RA | TB : RA, q.msaa); R.depthView = R.depthTex.createView();
  if (R.aoOn) { R.aoW = Math.max(4, w >> 1); R.aoH = Math.max(4, h >> 1); R.aoA = mkT(R.aoW, R.aoH, 'rgba8unorm', RA | TB).createView(); R.aoB = mkT(R.aoW, R.aoH, 'rgba8unorm', RA | TB).createView(); }
  R.msView = q.msaa > 1 ? mkT(w, h, HDR, RA, q.msaa).createView() : null;
  R.bloom = [];
  if (q.bloom) { let bw = w, bh = h; for (let i = 0; i < 5; i++) { bw = Math.max(2, bw >> 1); bh = Math.max(2, bh >> 1); const t = mkT(bw, bh, HDR, RA | TB); R.bloom.push({ w: bw, h: bh, view: t.createView() }); } }
  else { R.bloom.push({ w: 2, h: 2, view: mkT(2, 2, HDR, RA | TB).createView() }); }
  R.targets = T; R.postBG = null;
}

function camBasis(cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const f = [sy * cp, sp, -cy * cp], r = [cy, 0, sy], u = v3.cross(r, f);
  return { f, r, u };
}
function shadowSetup(i, center, radius, L) {
  const res = R.q.shadowRes, texel = 2 * radius / res, D = 260, back = 150;
  const z = L, up = Math.abs(z[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0], x = v3.norm(v3.cross(up, z)), y = v3.cross(z, x);
  let cx = v3.dot(center, x), cy = v3.dot(center, y); const cz = v3.dot(center, z);
  cx = Math.round(cx / texel) * texel; cy = Math.round(cy / texel) * texel;
  const view = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -cx, -cy, -(cz + D), 1]);
  const proj = m4.ortho(m4.create(), -radius, radius, -radius, radius, 0, D + back);
  m4.mul(R.shadowVP[i], proj, view);
  // only things between the light and the lit region can cast into it: long shadows need a longer reach
  R.shadowC[i] = { x, y, z, cx, cy, cz, r: radius, texel, zmax: Math.min(D - 10, radius + 17 / Math.max(L[1] / Math.max(hyp(L[0], L[2]), 0.01), 0.09)) };
}
const inShadowBox = (s, c, rad) => { if (Math.abs(v3.dot(c, s.x) - s.cx) > s.r + rad || Math.abs(v3.dot(c, s.y) - s.cy) > s.r + rad) return false; const zc = v3.dot(c, s.z) - s.cz; return zc > -(s.r + rad + 8) && zc < s.zmax + rad; };

// choose the point lights that matter for this view
function pickLights(g, camPos, camZone, env) {
  const cand = [], maxN = R.q.lights;
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
  for (let i = 0; i < n; i++) {
    const l = cand[i][1], k = cand[i][2] * (i >= maxN - 1 && cand.length > maxN ? 0.5 : 1), o = 120 + i * 4, c = 152 + i * 4;
    g[o] = l.p[0]; g[o + 1] = l.p[1]; g[o + 2] = l.p[2]; g[o + 3] = l.r;
    g[c] = l.c[0] * k; g[c + 1] = l.c[1] * k; g[c + 2] = l.c[2] * k; g[c + 3] = l.zone;
  }
  return n;
}

function renderFrame(time, env) {
  const d = G.device, q = R.q, P = R.P, cam = R.cam, g = R.gdata, st = R.stats;
  ensureTargets();
  R.frame++; st.draws = 0; st.tris = 0; st.sh = 0; st.shTris = 0;
  // ── camera ──
  const aspect = R.iw / R.ih;
  let fovy = cam.fovMin; if (aspect > 1) fovy = cam.fovMin; else fovy = 2 * Math.atan(Math.tan(cam.fovMin / 2) / aspect);
  fovy = Math.min(fovy, 1.75); if (aspect > 1) { const hf = 2 * Math.atan(Math.tan(fovy / 2) * aspect); if (hf > 1.62) fovy = 2 * Math.atan(Math.tan(1.62 / 2) / aspect); }
  const { f, r, u } = camBasis(cam), e = cam.pos, th = Math.tan(fovy / 2);
  R.view.set([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -v3.dot(r, e), -v3.dot(u, e), v3.dot(f, e), 1]);
  m4.perspective(R.proj, fovy, aspect, 0.09); m4.mul(R.vp, R.proj, R.view);
  frustumPlanes(R.planes, R.vp);
  // ── shadows: near cascade every frame, far cascade every few frames ──
  const L = env.keyDir, fh = v3.norm([f[0], 0, f[2]]);
  const r0 = 24, r1 = 92;
  shadowSetup(0, [e[0] + fh[0] * r0 * 0.72, e[1], e[2] + fh[2] * r0 * 0.72], r0, L);
  const upd1 = (R.frame % q.far1) === 1 || !R.shadow1Ready || TEST;
  if (upd1) { R.s1prev = R.shadowC[1]; shadowSetup(1, [e[0] + fh[0] * r1 * 0.6, e[1], e[2] + fh[2] * r1 * 0.6], r1, L); R.shadow1Ready = true; }
  // ── globals ──
  g.set(R.vp, 0); g.set(R.shadowVP[0], 16); g.set(R.shadowVP[1], 32);
  const s4 = (o, a, w) => { g[o] = a[0]; g[o + 1] = a[1]; g[o + 2] = a[2]; g[o + 3] = w; };
  s4(48, e, time); s4(52, v3.scale(r, th * aspect), 0); s4(56, v3.scale(u, th), 0); s4(60, f, env.exposure);
  s4(64, L, env.shadowStrength); s4(68, env.keyCol, 0); s4(72, env.ambSky, env.night); s4(76, env.ambGnd, env.cloud);
  s4(80, env.fogCol, env.fogDensity); s4(84, env.fogSun, 0.011); s4(88, env.zenith, env.stars); s4(92, env.horizon, env.aurora);
  s4(96, env.moonDir, env.moonBright); s4(100, env.sunDir, env.sunDisc);
  g[104] = env.windDir[0]; g[105] = env.windDir[1]; g[106] = env.windStrength; g[107] = time;
  const nLights = pickLights(g, e, World.camZone | 0, env);
  g[108] = nLights; g[109] = R.shadowC[0].texel; g[110] = R.shadowC[1].texel; g[111] = q.cloudShadow * env.day;
  g[112] = q.grassRange; g[113] = q.treeLod; g[114] = env.windowGlow; g[115] = 1 / q.shadowRes;
  g[116] = q.bloom ? 0.07 : 0; g[117] = World.indoor || 0; g[118] = World.lakeY; g[119] = 0;
  d.queue.writeBuffer(R.gbuf, 0, g);
  if (World.skinCount) d.queue.writeBuffer(R.boneBuf, 0, R.boneData, 0, World.skinCount * 256);
  if (R.partCount) d.queue.writeBuffer(R.partBuf, 0, R.partData, 0, R.partCount * 12);
  const enc = d.createCommandEncoder();
  // ── shadow passes ──
  for (let ci = 0; ci < 2; ci++) {
    if (ci === 1 && !upd1) continue;
    const sd = R.sdata[ci], S = R.shadowC[ci];
    sd.set(R.shadowVP[ci], 0); sd[16] = e[0]; sd[17] = e[1]; sd[18] = e[2]; sd[19] = time;
    sd[20] = env.windDir[0]; sd[21] = env.windDir[1]; sd[22] = ci ? 0 : env.windStrength; sd[23] = time; sd[24] = ci ? -1 : 1e6;      // near cascade: full trees, far cascade: flat stand-ins
    d.queue.writeBuffer(R.sbuf[ci], 0, sd);
    const sp = enc.beginRenderPass({ colorAttachments: [], depthStencilAttachment: { view: R.shadowViews[ci], depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' } });
    sp.setBindGroup(0, R.bgShadow[ci]);
    if (env.shadowStrength > 0.01) {
      sp.setPipeline(P.shStatic);
      for (const pk of World.packs) {
        if (!pk.shadow) continue;
        sp.setVertexBuffer(0, pk.vb); sp.setIndexBuffer(pk.ib, 'uint32');
        for (const it of pk.items) { if (it.noShadow || (ci === 1 && it.nearOnly) || (ci === 0 && it.kind === 'terrain') || !inShadowBox(S, it.c, it.r)) continue; sp.drawIndexed(it.count, 1, it.first, it.base, 0); st.draws++; st.sh++; st.shTris += it.count / 3; }
      }
      if (World.skinCount && ci === 0) {
        sp.setPipeline(P.shSkin); sp.setBindGroup(1, R.bgBones);
        sp.setVertexBuffer(0, World.skinPack.vb); sp.setIndexBuffer(World.skinPack.ib, 'uint32');
        for (const o of World.skinned) { if (!o.visible || !inShadowBox(S, o.c, o.r)) continue; sp.drawIndexed(o.count, 1, o.first, o.base, o.slot); st.draws++; st.sh++; st.shTris += o.count / 3; }
      }
      if (World.instPack) {
        sp.setPipeline(P.shInst);
        sp.setVertexBuffer(0, World.instPack.vb); sp.setIndexBuffer(World.instPack.ib, 'uint32');
        for (const grp of World.instGroups) {
          if (!grp.shadow || (ci === 1 ? (grp.nearOnly || grp.lod === 1) : grp.lod === 2)) continue;
          sp.setVertexBuffer(1, grp.ibuf);
          for (const c of grp.cells) {
            if (!inShadowBox(S, c.c, c.r)) continue;
            sp.drawIndexed(grp.count, c.count, grp.first, grp.base, c.first); st.draws++; st.sh++; st.shTris += grp.count / 3 * c.count;
          }
        }
      }
    }
    sp.end();
  }
  // ── main pass ──
  const pass = enc.beginRenderPass({
    colorAttachments: [q.msaa > 1 ? { view: R.msView, resolveTarget: R.hdrView, loadOp: 'clear', storeOp: 'discard', clearValue: [0, 0, 0, 1] } : { view: R.hdrView, loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }],
    depthStencilAttachment: { view: R.depthView, depthClearValue: 0, depthLoadOp: 'clear', depthStoreOp: R.aoOn ? 'store' : 'discard' } });
  pass.setBindGroup(0, R.bgScene);
  const pl = R.planes;
  const drawKind = (kind, pipeline) => {
    let set = false;
    for (const pk of World.packs) {
      let bound = false;
      for (const it of pk.items) {
        if (it.kind !== kind) continue;
        if (it.maxDist && hyp(it.c[0] - e[0], it.c[1] - e[1], it.c[2] - e[2]) > it.maxDist + it.r) continue;
        if (!sphereInFrustum(pl, it.c[0], it.c[1], it.c[2], it.r)) continue;
        if (!set) { pass.setPipeline(pipeline); set = true; }
        if (!bound) { pass.setVertexBuffer(0, pk.vb); pass.setIndexBuffer(pk.ib, 'uint32'); bound = true; }
        pass.drawIndexed(it.count, 1, it.first, it.base, 0); st.draws++; st.tris += it.count / 3;
      }
    }
  };
  drawKind('opaque', P.opaque);
  if (World.skinCount) {
    pass.setPipeline(P.skin); pass.setBindGroup(1, R.bgBones);
    pass.setVertexBuffer(0, World.skinPack.vb); pass.setIndexBuffer(World.skinPack.ib, 'uint32');
    for (const o of World.skinned) { if (!o.visible || !sphereInFrustum(pl, o.c[0], o.c[1], o.c[2], o.r)) continue; pass.drawIndexed(o.count, 1, o.first, o.base, o.slot); st.draws++; st.tris += o.count / 3; }
  }
  const drawInst = (kind, pipeline) => {
    if (!World.instPack) return;
    pass.setPipeline(pipeline); pass.setVertexBuffer(0, World.instPack.vb); pass.setIndexBuffer(World.instPack.ib, 'uint32');
    for (const grp of World.instGroups) {
      if (grp.kind !== kind) continue;
      pass.setVertexBuffer(1, grp.ibuf);
      for (const c of grp.cells) {
        if (!sphereInFrustum(pl, c.c[0], c.c[1], c.c[2], c.r)) continue;
        const dc = hyp(c.c[0] - e[0], c.c[2] - e[2]);
        if ((grp.lod === 1 && dc > q.treeLod + c.r) || (grp.lod === 2 && dc < q.treeLod - c.r) || (grp.maxDist && dc > grp.maxDist + c.r)) continue;
        pass.drawIndexed(grp.count, c.count, grp.first, grp.base, c.first); st.draws++; st.tris += grp.count / 3 * c.count;
      }
    }
  };
  drawInst('opaque', P.instOpaque);
  drawKind('terrain', P.terrain);
  drawInst('leaf', P.foliage);
  // grass blocks around the camera
  if (World.grassOn && q.grassRange > 0) {
    pass.setPipeline(P.grass); pass.setVertexBuffer(0, R.grassVB);
    const bs = K.grassCell * K.grassBlock, N = K.grassGridN, half = K.grassHalf, rng = q.grassRange, br = bs * 0.75;
    const bx0 = Math.max(0, Math.floor((e[0] - rng + half) / bs)), bx1 = Math.min(N - 1, Math.floor((e[0] + rng + half) / bs));
    const bz0 = Math.max(0, Math.floor((e[2] - rng + half) / bs)), bz1 = Math.min(N - 1, Math.floor((e[2] + rng + half) / bs));
    for (let bz = bz0; bz <= bz1; bz++) for (let bx = bx0; bx <= bx1; bx++) {
      const cx = (bx + 0.5) * bs - half, cz = (bz + 0.5) * bs - half, cy = World.groundY(cx, cz);
      const dc = hyp(cx - e[0], cz - e[2]); if (dc > rng + br) continue;
      if (!sphereInFrustum(pl, cx, cy, cz, br + 1)) continue;
      const cnt = Math.max(16, Math.round(1024 * q.grassDensity * (1 - smooth(rng * 0.35, rng + br, dc) * 0.75)));
      pass.draw(9, cnt, 0, (bz * N + bx) * 1024); st.draws++; st.tris += cnt * 3;
    }
  }
  pass.setPipeline(P.sky); pass.draw(3); st.draws++;
  drawKind('water', P.water);
  if (env.windowGlow > 0.01) drawKind('glow', P.glow);
  if (R.partCount) { pass.setPipeline(P.part); pass.setVertexBuffer(0, R.partBuf); pass.draw(6, R.partCount); st.draws++; }
  pass.end();
  // ── bloom + tonemap ──
  if (!R.postBG) {
    const bg = (i, layout, view, extra) => d.createBindGroup({ layout, entries: [{ binding: 0, resource: { buffer: R.postBufs[i] } }, { binding: 1, resource: view }, { binding: 2, resource: R.smpClamp }].concat(extra ? [{ binding: 3, resource: extra }, { binding: 4, resource: R.aoOn ? R.aoB : R.aoNone.createView() }] : []) });
    const B = R.bloom, o = { down: [], up: [] };
    if (q.bloom) {
      o.down.push(bg(0, R.bglPostA, R.hdrView));
      for (let i = 1; i < B.length; i++) o.down.push(bg(i, R.bglPostA, B[i - 1].view));
      for (let i = B.length - 1; i > 0; i--) o.up.push(bg(5 + i, R.bglPostA, B[i].view));
    }
    o.fin = bg(11, R.bglPostB, R.hdrView, B[0].view);
    if (R.aoOn) { o.ao = d.createBindGroup({ layout: R.bglAO, entries: [{ binding: 0, resource: { buffer: R.postBufs[12] } }, { binding: 1, resource: R.depthView }] }); o.aoBlur = bg(13, R.bglPostA, R.aoA); }
    R.postBG = o;
  }
  const fs = (view, pipeline, bgr, clear) => { const p = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: clear ? 'clear' : 'load', storeOp: 'store', clearValue: [0, 0, 0, 1] }] }); p.setPipeline(pipeline); p.setBindGroup(0, bgr); p.draw(3); p.end(); };
  const pu = new Float32Array(16);
  // ── ambient occlusion and light shafts (half resolution) ──
  let shaft = 0, sunU = 0.5, sunV = 0.5;
  if (R.aoOn) {
    pu.fill(0); pu.set([0, 0, 0.09, 0.85, th * aspect, th, 1.6, 48]); d.queue.writeBuffer(R.postBufs[12], 0, pu); fs(R.aoA, P.ao, R.postBG.ao, true);
    const s = env.sunDir, vp = R.vp, X = e[0] + s[0] * 1000, Y = e[1] + s[1] * 1000, Z = e[2] + s[2] * 1000;
    const cw = vp[3] * X + vp[7] * Y + vp[11] * Z + vp[15];
    if (cw > 0 && s[1] > -0.02 && !(World.indoor > 0.5)) {
      const nx = (vp[0] * X + vp[4] * Y + vp[8] * Z + vp[12]) / cw, ny = (vp[1] * X + vp[5] * Y + vp[9] * Z + vp[13]) / cw;
      sunU = nx * 0.5 + 0.5; sunV = -ny * 0.5 + 0.5;
      shaft = (1 - smooth(1.0, 1.7, Math.max(Math.abs(nx), Math.abs(ny)))) * smooth(-0.02, 0.06, s[1]) * (0.45 + 0.55 * Math.exp(-(s[1] * s[1]) / 0.07));
    }
    pu.fill(0); pu.set([1 / R.aoW, 1 / R.aoH, sunU, sunV, shaft, R.aoH / R.aoW, 0, 0]); d.queue.writeBuffer(R.postBufs[13], 0, pu); fs(R.aoB, P.aoBlur, R.postBG.aoBlur, true);
  }
  if (q.bloom) {
    const B = R.bloom;
    pu.fill(0); pu.set([0.5 / R.iw, 0.5 / R.ih, 1.15 / env.exposure, 0]); d.queue.writeBuffer(R.postBufs[0], 0, pu); fs(B[0].view, P.bright, R.postBG.down[0], true);
    for (let i = 1; i < B.length; i++) { pu.set([0.5 / B[i - 1].w, 0.5 / B[i - 1].h, 0, 0]); d.queue.writeBuffer(R.postBufs[i], 0, pu); fs(B[i].view, P.down, R.postBG.down[i], true); }
    for (let i = B.length - 1, k = 0; i > 0; i--, k++) { pu.set([1 / B[i].w, 1 / B[i].h, 0, 0]); d.queue.writeBuffer(R.postBufs[5 + i], 0, pu); fs(B[i - 1].view, P.up, R.postBG.up[k], false); }
  }
  pu.fill(0); pu.set([1 / R.iw, 1 / R.ih, R.aoOn ? 0.92 : 0, g[116], env.exposure, 0.55, (R.frame % 64) * 1.37, 1.14, env.keyCol[0] * shaft * 0.22, env.keyCol[1] * shaft * 0.22, env.keyCol[2] * shaft * 0.22, 0, sunU, sunV, 0, 0]); d.queue.writeBuffer(R.postBufs[11], 0, pu);
  fs(backbufferView(), P.final, R.postBG.fin, true);
  d.queue.submit([enc.finish()]);
}
