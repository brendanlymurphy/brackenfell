
// ---- 00_math.js ----
'use strict';
// ───────────────────────── math, noise, small utilities ─────────────────────────
const PI = Math.PI, TAU = Math.PI * 2;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sat = x => x < 0 ? 0 : x > 1 ? 1 : x;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hyp = Math.hypot;

function rng(seed) {            // mulberry32
  let a = seed >>> 0;
  const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.r = (a, b) => a + (b - a) * f();
  f.i = (a, b) => Math.floor(a + (b - a + 1) * f());
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.s = () => f() * 2 - 1;
  return f;
}
function ihash(x, z, s) {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
const hash01 = (x, z, s) => ihash(x, z, s) / 4294967296;
const GRAD = new Float32Array(512);
for (let i = 0; i < 256; i++) { const a = i / 256 * TAU; GRAD[i * 2] = Math.cos(a); GRAD[i * 2 + 1] = Math.sin(a); }
// 2D gradient noise, roughly -1..1
function gnoise(x, z, s) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  let h = (ihash(ix, iz, s) & 255) * 2; const a = GRAD[h] * fx + GRAD[h + 1] * fz;
  h = (ihash(ix + 1, iz, s) & 255) * 2; const b = GRAD[h] * (fx - 1) + GRAD[h + 1] * fz;
  h = (ihash(ix, iz + 1, s) & 255) * 2; const c = GRAD[h] * fx + GRAD[h + 1] * (fz - 1);
  h = (ihash(ix + 1, iz + 1, s) & 255) * 2; const d = GRAD[h] * (fx - 1) + GRAD[h + 1] * (fz - 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 1.5;
}
function fbm(x, z, oct, s) { let r = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { r += a * gnoise(x * f, z * f, s + i * 31); f *= 2.03; a *= 0.5; } return r; }
function ridged(x, z, oct, s) { let r = 0, a = 0.5, f = 1, w = 1; for (let i = 0; i < oct; i++) { let n = 1 - Math.abs(gnoise(x * f, z * f, s + i * 31)); n *= n * w; w = sat(n * 2); r += a * n; f *= 2.07; a *= 0.5; } return r; }

// ───────────────────────── vectors / matrices (column-major mat4) ─────────────────────────
const v3 = {
  len: a => hyp(a[0], a[1], a[2]),
  norm(a) { const l = hyp(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
const m4 = {
  create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  ident(m) { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  copy(o, a) { o.set(a); return o; },
  mul(o, a, b) {       // o = a * b   (o may alias a or b)
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
      a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    for (let i = 0; i < 4; i++) {
      const b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
      o[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      o[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      o[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      o[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    }
    return o;
  },
  translate(m, x, y, z) {   // m = m * T
    m[12] += m[0] * x + m[4] * y + m[8] * z; m[13] += m[1] * x + m[5] * y + m[9] * z;
    m[14] += m[2] * x + m[6] * y + m[10] * z; m[15] += m[3] * x + m[7] * y + m[11] * z; return m;
  },
  scale(m, x, y, z) { for (let i = 0; i < 4; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; } return m; },
  rotY(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } return m; },
  rotX(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = z * c - y * s; } return m; },
  rotZ(m, a) { const c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 4; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = y * c - x * s; } return m; },
  // basis: columns x,y,z + origin
  basis(m, x, y, z, o) { m[0] = x[0]; m[1] = x[1]; m[2] = x[2]; m[3] = 0; m[4] = y[0]; m[5] = y[1]; m[6] = y[2]; m[7] = 0; m[8] = z[0]; m[9] = z[1]; m[10] = z[2]; m[11] = 0; m[12] = o[0]; m[13] = o[1]; m[14] = o[2]; m[15] = 1; return m; },
  tp(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]; },
  td(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]]; },
  invert(o, m) {
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
      a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11,
      b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30,
      b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; det = det ? 1 / det : 0;
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
  },
  // reversed-Z, infinite far.  ndc.z = near / dist
  perspective(o, fovy, aspect, near) {
    const f = 1 / Math.tan(fovy / 2); o.fill(0);
    o[0] = f / aspect; o[5] = f; o[11] = -1; o[14] = near; return o;
  },
  // standard 0..1 ortho (for shadow maps)
  ortho(o, l, r, b, t, n, f) {
    o.fill(0); o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = 1 / (n - f);
    o[12] = (l + r) / (l - r); o[13] = (t + b) / (b - t); o[14] = n / (n - f); o[15] = 1; return o;
  },
  lookAt(o, eye, target, up) {
    const z = v3.norm(v3.sub(eye, target)), x = v3.norm(v3.cross(up, z)), y = v3.cross(z, x);
    o[0] = x[0]; o[1] = y[0]; o[2] = z[0]; o[3] = 0; o[4] = x[1]; o[5] = y[1]; o[6] = z[1]; o[7] = 0;
    o[8] = x[2]; o[9] = y[2]; o[10] = z[2]; o[11] = 0;
    o[12] = -v3.dot(x, eye); o[13] = -v3.dot(y, eye); o[14] = -v3.dot(z, eye); o[15] = 1; return o;
  },
};
// frustum planes (reversed infinite projection): L,R,B,T,N -> Float32Array(20)
function frustumPlanes(out, m) {
  const r = (i, j) => m[j * 4 + i];
  const set = (k, a, b, c, d) => { const l = hyp(a, b, c) || 1; out[k * 4] = a / l; out[k * 4 + 1] = b / l; out[k * 4 + 2] = c / l; out[k * 4 + 3] = d / l; };
  set(0, r(3, 0) + r(0, 0), r(3, 1) + r(0, 1), r(3, 2) + r(0, 2), r(3, 3) + r(0, 3));
  set(1, r(3, 0) - r(0, 0), r(3, 1) - r(0, 1), r(3, 2) - r(0, 2), r(3, 3) - r(0, 3));
  set(2, r(3, 0) + r(1, 0), r(3, 1) + r(1, 1), r(3, 2) + r(1, 2), r(3, 3) + r(1, 3));
  set(3, r(3, 0) - r(1, 0), r(3, 1) - r(1, 1), r(3, 2) - r(1, 2), r(3, 3) - r(1, 3));
  set(4, r(3, 0) - r(2, 0), r(3, 1) - r(2, 1), r(3, 2) - r(2, 2), r(3, 3) - r(2, 3));
  return out;
}
function sphereInFrustum(pl, x, y, z, rad) {
  for (let k = 0; k < 20; k += 4) if (pl[k] * x + pl[k + 1] * y + pl[k + 2] * z + pl[k + 3] < -rad) return false;
  return true;
}
// Catmull-Rom through points [[x,z],...] -> dense polyline
function catmull(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    const n = Math.max(1, Math.ceil(hyp(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
// distance from point to polyline; returns [dist, arcParam 0..1, index]
function polyDist(pl, x, z) {
  let best = 1e9, bi = 0, bt = 0;
  for (let i = 0; i < pl.length - 1; i++) {
    const ax = pl[i][0], az = pl[i][1], bx = pl[i + 1][0] - ax, bz = pl[i + 1][1] - az;
    const l2 = bx * bx + bz * bz; let t = l2 ? ((x - ax) * bx + (z - az) * bz) / l2 : 0; t = sat(t);
    const dx = x - ax - bx * t, dz = z - az - bz * t, d = dx * dx + dz * dz;
    if (d < best) { best = d; bi = i; bt = t; }
  }
  return [Math.sqrt(best), (bi + bt) / (pl.length - 1), bi];
}
const yawDir = yaw => [Math.sin(yaw), 0, -Math.cos(yaw)];     // yaw 0 = north (-Z), clockwise
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };


// ---- 10_gfx.js ----
// ───────────────────────── Three.js renderer, canvas, texture pack ─────────────────────────
const TEST = (typeof window !== 'undefined' && window.__TEST__) || null;
const G = { renderer: null, canvas: null, errors: [], w: 1, h: 1, lost: false, backend: '', astc: false, pack: '' };

// Surface materials: one texture array. 0-16 are scanned surfaces, 17-24 are the special layers (foliage cut-outs, cloth, metal ...).
const MAT = { PLASTER: 0, TIMBER: 1, PLANKS: 2, STONE: 3, COBBLE: 4, THATCH: 5, SHINGLE: 6, DIRT: 7, GRASS: 8, ROCK: 9, BARK: 10, GRASS2: 11, FOREST: 12, MUD: 13, SOIL: 14, GRAVEL: 15, MOSS: 16,
  PLAIN: 17, BIRCH: 18, PINE: 19, LEAVES: 20, IMPOSTOR: 21, CLOTH: 22, METAL: 23, STRIPES: 24 };
const MAT_NAMES = ['plaster', 'timber', 'planks', 'stone', 'cobble', 'thatch', 'shingle', 'dirt', 'grass', 'rock', 'bark', 'grass2', 'forest', 'mud', 'soil', 'gravel', 'moss',
  'plain', 'birch', 'pine', 'leaves', 'impostor', 'cloth', 'metal', 'stripes'];
// world metres covered by one texture repeat
const MAT_TILE = [2.5, 1.5, 2, 2, 2.5, 2, 2, 3, 3, 4, 1, 3, 3, 3, 3, 2.5, 3, 1, 1, 1, 1, 1, 0.5, 1, 1];
const K = {
  terrainHalf: 144, terrainCell: 1.5, heightN: 193,   // level-0 terrain grid (also the grass / splat region)
  splatRes: 1024, cloudH: 700, fogBase: -2,
  grassCell: 0.30,
};

// Which graphics backend to start: WebGPU unless this device has already shown it cannot run it (remembered in localStorage),
// or the address says otherwise (?webgl or ?webgpu).
const GFX_KEY = 'brackenfell.gfx';
function gfxChoice() {
  const q = location.search;
  if (/[?&]webgl\b/.test(q)) return 'webgl';
  if (/[?&]webgpu\b/.test(q)) return 'webgpu';
  if (TEST) return TEST.webgl ? 'webgl' : 'webgpu';
  try { if (localStorage.getItem(GFX_KEY) === 'webgl') { G.gfxWhy = localStorage.getItem(GFX_KEY + '.why') || 'chosen earlier'; return 'webgl'; } } catch (e) { }
  return 'webgpu';
}
async function gfxInit(canvas) {
  const want = gfxChoice();
  const make = async (cv, forceWebGL) => { const r = new THREE.WebGPURenderer({ canvas: cv, antialias: false, forceWebGL, powerPreference: 'high-performance', reversedDepthBuffer: true }); await r.init(); return r; };
  let r;
  try { r = await make(canvas, want === 'webgl'); }
  catch (e) {
    if (want === 'webgl') throw e;
    // WebGPU would not start. A canvas that was asked for one kind of context cannot give another, so continue on a fresh one.
    G.gfxWhy = 'WebGPU did not start: ' + String(e && e.message || e).slice(0, 160); console.warn(G.gfxWhy);
    const c2 = canvas.cloneNode(false); canvas.parentNode.replaceChild(c2, canvas); canvas = c2;
    r = await make(canvas, true);
  }
  G.renderer = r; G.canvas = canvas; G.t0 = performance.now();
  G.backend = r.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL 2';
  if (G.backend === 'WebGL 2' && want === 'webgpu' && !G.gfxWhy) G.gfxWhy = 'WebGPU is not available here';
  G.astc = !!r.hasFeature('texture-compression-astc') && !(TEST && TEST.noAstc);
  r.toneMapping = THREE.NoToneMapping;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  r.setPixelRatio(1);
  r.onDeviceLost = info => { G.lost = true; if (typeof onDeviceLost === 'function') onDeviceLost(info); };
  const dev = r.backend.device;
  if (dev && dev.addEventListener) dev.addEventListener('uncapturederror', e => { const msg = (e.error && e.error.message) || String(e.error); if (G.errors.length < 40) G.errors.push(msg); G.gpuErrors = (G.gpuErrors || 0) + 1; console.error('[gpu]', msg); });
  if (dev && dev.adapterInfo) G.gpuName = [dev.adapterInfo.vendor, dev.adapterInfo.architecture].filter(Boolean).join(' ');
}
// WebGPU went wrong on this device (errors while drawing, or the device was lost): remember that and start again on WebGL 2.
// Returns false when there is nothing to fall back to.
function gfxFallback(why) {
  if (TEST || G.backend !== 'WebGPU' || /[?&]webgpu\b/.test(location.search) || G.fellBack) return false;
  G.fellBack = true;
  let stored = false;
  try { localStorage.setItem(GFX_KEY, 'webgl'); localStorage.setItem(GFX_KEY + '.why', String(why).slice(0, 200)); stored = localStorage.getItem(GFX_KEY) === 'webgl'; } catch (e) { }
  if (stored) location.reload(); else location.replace(location.pathname + '?webgl');
  return true;
}
function gfxPrefer(kind) { try { if (kind === 'webgl') { localStorage.setItem(GFX_KEY, 'webgl'); localStorage.setItem(GFX_KEY + '.why', 'chosen in Settings'); } else { localStorage.removeItem(GFX_KEY); localStorage.removeItem(GFX_KEY + '.why'); } } catch (e) { } location.replace(location.pathname); }
function gfxResize(w, h) {
  w = Math.max(16, w | 0); h = Math.max(16, h | 0);
  if (G.w === w && G.h === h) return;
  G.w = w; G.h = h;
  G.renderer.setSize(w, h, false);
  if (G.testRT) { G.testRT.dispose(); G.testRT = null; }
}
// test mode on WebGPU: a headless browser cannot show the canvas, so the frame goes to a target that is read back onto a 2D canvas laid over the page
async function gfxCapture(drawFn) {
  const r = G.renderer;
  if (!r.backend.isWebGPUBackend) { drawFn(); return; }
  if (!G.testRT) G.testRT = new THREE.RenderTarget(G.w, G.h, { type: THREE.UnsignedByteType, depthBuffer: false });
  r.setRenderTarget(G.testRT); drawFn(); r.setRenderTarget(null);
  const px = await r.readRenderTargetPixelsAsync(G.testRT, 0, 0, G.w, G.h);
  let cv = document.getElementById('testcv');
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'testcv'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none'; G.canvas.parentNode.insertBefore(cv, G.canvas.nextSibling); }
  cv.width = G.w; cv.height = G.h;
  const img = new ImageData(new Uint8ClampedArray(px.buffer, px.byteOffset, G.w * G.h * 4), G.w, G.h);
  cv.getContext('2d').putImageData(img, 0, 0);
}

// ── texture pack ──
// Compressed layers travel inside grey PNG files (pixel bytes = data, rows unfiltered); unpack them by hand.
async function packBlob(url) {
  const res = await fetch(url); if (!res.ok) throw new Error(url + ' ' + res.status);
  const b = new Uint8Array(await res.arrayBuffer()), dv = new DataView(b.buffer);
  if (dv.getUint32(0) !== 0x89504e47) throw new Error('bad pack file');
  let o = 8, w = 0, h = 0; const idat = [];
  while (o < b.length) {
    const len = dv.getUint32(o), type = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]);
    if (type === 'IHDR') { w = dv.getUint32(o + 8); h = dv.getUint32(o + 12); }
    else if (type === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const raw = new Uint8Array(await new Response(new Blob(idat).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) { if (raw[y * (w + 1)] !== 0) throw new Error('bad pack file'); out.set(raw.subarray(y * (w + 1) + 1, (y + 1) * (w + 1)), y * w); }
  return out;
}
const ASTC_FMT = { '6x6': () => THREE.RGBA_ASTC_6x6_Format, '5x5': () => THREE.RGBA_ASTC_5x5_Format };
async function loadPackAstc(progress) {
  const L = MAT_NAMES.length; let done = 0;
  const load = async pre => {
    const blobs = await Promise.all(MAT_NAMES.map(async n => { const d = await packBlob('tex/' + pre + n + '.png'); progress(++done / (L * 2)); return d; }));
    const dv = new DataView(blobs[0].buffer, blobs[0].byteOffset);
    if (dv.getUint32(0, true) !== 0x58544642) throw new Error('bad pack header');
    const bw = blobs[0][4], bh = blobs[0][5], res = dv.getUint16(6, true), nm = blobs[0][8], mips = [];
    let off = 16;
    for (let m = 0, w = res; m < nm; m++, w = Math.max(1, w >> 1)) {
      const size = Math.ceil(w / bw) * Math.ceil(w / bh) * 16, data = new Uint8Array(size * L);
      for (let l = 0; l < L; l++) data.set(blobs[l].subarray(off, off + size), l * size);
      mips.push({ data, width: w, height: w }); off += size;
    }
    const t = new THREE.CompressedArrayTexture(mips, res, res, L, ASTC_FMT[bw + 'x' + bh](), THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
    return t;
  };
  const a = await load('a_'); a.colorSpace = THREE.SRGBColorSpace;
  const n = await load('n_'); n.colorSpace = THREE.NoColorSpace;
  a.needsUpdate = n.needsUpdate = true;
  G.albedoArr = a; G.narArr = n; G.pack = 'astc ' + a.image.width;
}
// Fallback where the GPU has no ASTC: WebP colour + JPEG maps, decoded to plain RGBA. A scratch WebGL context reads the colour
// images back so their alpha channel (a mask, not transparency) is not multiplied into the colour on the way.
async function loadPackImages(res, progress) {
  const L = MAT_NAMES.length, a = new Uint8Array(res * res * 4 * L), n = new Uint8Array(res * res * 4 * L);
  const cv = document.createElement('canvas'); cv.width = cv.height = res;
  const gl = cv.getContext('webgl2', { premultipliedAlpha: false }); if (!gl) throw new Error('no webgl2 for unpacking');
  const tex = gl.createTexture(), fb = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, tex); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  const c2 = document.createElement('canvas'); c2.width = c2.height = res * 2; const x2 = c2.getContext('2d', { willReadFrequently: true });
  const bmp = async (url, o) => { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return createImageBitmap(await r.blob(), o); };
  let done = 0;
  for (let l = 0; l < L; l++) {
    const [ba, bn] = await Promise.all([bmp('tex/a_' + MAT_NAMES[l] + '.webp', { premultiplyAlpha: 'none', colorSpaceConversion: 'none', resizeWidth: res, resizeHeight: res, resizeQuality: 'high' }), bmp('tex/n_' + MAT_NAMES[l] + '.jpg', { colorSpaceConversion: 'none', resizeWidth: res * 2, resizeHeight: res * 2, resizeQuality: 'high' })]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ba); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.readPixels(0, 0, res, res, gl.RGBA, gl.UNSIGNED_BYTE, a.subarray(l * res * res * 4, (l + 1) * res * res * 4));
    x2.drawImage(bn, 0, 0); const d = x2.getImageData(0, 0, res * 2, res * 2).data, o = l * res * res * 4, W = res * 2;
    for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) { const k = o + (y * res + x) * 4; n[k] = d[(y * W + x) * 4]; n[k + 1] = d[(y * W + x + res) * 4]; n[k + 2] = d[((y + res) * W + x) * 4]; n[k + 3] = d[((y + res) * W + x + res) * 4]; }
    ba.close(); bn.close(); progress(++done / L);
  }
  const mk = (data, cs) => { const t = new THREE.DataArrayTexture(data, res, res, L); t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType; t.colorSpace = cs; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t; };
  G.albedoArr = mk(a, THREE.SRGBColorSpace); G.narArr = mk(n, THREE.NoColorSpace); G.pack = 'images ' + res;
}
async function loadPack(lowMem, progress) {
  if (G.astc && !(TEST && TEST.pack === 'images')) {
    try { await loadPackAstc(progress); return; } catch (e) { console.warn('compressed textures failed, using images: ' + (e && e.message || e)); G.packNote = String(e && e.message || e); }
  }
  await loadPackImages(TEST && TEST.texRes || (lowMem ? 512 : 1024), progress);
}
async function loadNoise() {
  const r = await fetch('tex/noise.bin'); if (!r.ok) throw new Error('noise ' + r.status);
  const t = new THREE.DataTexture(new Uint8Array(await r.arrayBuffer()), 256, 256, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  G.noiseTex = t;
}


// ---- 31_mesh.js ----
// ───────────────────────── mesh builder: 32-byte vertices, transform stack, primitives ─────────────────────────
// vertex: pos f32x3 | normal snorm8x3 + wind snorm8 | uv f32x2 | tint unorm8x3 + skyVis unorm8 | layer, m1, m2, m3 (uint8)
const GRAIN_LAYERS = new Set([MAT.TIMBER, MAT.PLANKS]);
class Mesh {
  constructor(cap = 1024) {
    this.cap = cap; this.icap = cap * 2;
    this.buf = new ArrayBuffer(cap * 32); this.f = new Float32Array(this.buf); this.u8 = new Uint8Array(this.buf); this.i8 = new Int8Array(this.buf);
    this.idx = new Uint32Array(this.icap); this.nv = 0; this.ni = 0;
    this.m = m4.create(); this.st = []; this.nm = new Float32Array(9); this.dirty = true; this.flip = false;
    this.grad = null; this.layer = MAT.PLAIN; this.cr = 255; this.cg = 255; this.cb = 255; this.ao = 1; this.m1 = 0; this.m2 = 0; this.m3 = 0; this.wind = 0; this.tile = 1;
    this.min = [1e9, 1e9, 1e9]; this.max = [-1e9, -1e9, -1e9];
    this.seed = 12345;
  }
  _growV() { const nb = new ArrayBuffer(this.cap * 64); new Uint8Array(nb).set(this.u8); this.cap *= 2; this.buf = nb; this.f = new Float32Array(nb); this.u8 = new Uint8Array(nb); this.i8 = new Int8Array(nb); }
  _growI(n) { while (this.ni + n > this.icap) this.icap *= 2; const ni = new Uint32Array(this.icap); ni.set(this.idx.subarray(0, this.ni)); this.idx = ni; }
  rnd() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) | 0; return (this.seed >>> 8) / 16777216; }
  // ── state ──
  push() { this.st.push(this.m.slice()); return this; }
  pop() { this.m = this.st.pop(); this.dirty = true; return this; }
  T(x, y, z) { m4.translate(this.m, x, y, z); return this; }
  RY(a) { m4.rotY(this.m, a); this.dirty = true; return this; }
  RX(a) { m4.rotX(this.m, a); this.dirty = true; return this; }
  RZ(a) { m4.rotZ(this.m, a); this.dirty = true; return this; }
  S(x, y, z) { m4.scale(this.m, x, y === undefined ? x : y, z === undefined ? x : z); this.dirty = true; return this; }
  // material: layer + tint (sRGB-ish 0..1) ; tileScale multiplies the texture's world size
  mat(layer, col, tileScale) {
    this.layer = layer; this.tile = MAT_TILE[layer] * (tileScale || 1);
    if (col) { this.cr = clamp(col[0] * 255, 0, 255) | 0; this.cg = clamp(col[1] * 255, 0, 255) | 0; this.cb = clamp(col[2] * 255, 0, 255) | 0; }
    else { this.cr = this.cg = this.cb = 255; }
    return this;
  }
  col(c) { this.cr = clamp(c[0] * 255, 0, 255) | 0; this.cg = clamp(c[1] * 255, 0, 255) | 0; this.cb = clamp(c[2] * 255, 0, 255) | 0; return this; }
  _nm() {
    const m = this.m, n = this.nm;
    n[0] = m[5] * m[10] - m[6] * m[9]; n[1] = m[6] * m[8] - m[4] * m[10]; n[2] = m[4] * m[9] - m[5] * m[8];
    n[3] = m[9] * m[2] - m[10] * m[1]; n[4] = m[10] * m[0] - m[8] * m[2]; n[5] = m[8] * m[1] - m[9] * m[0];
    n[6] = m[1] * m[6] - m[2] * m[5]; n[7] = m[2] * m[4] - m[0] * m[6]; n[8] = m[0] * m[5] - m[1] * m[4];
    const det = m[0] * n[0] + m[1] * n[1] + m[2] * n[2];
    this.flip = det < 0; if (this.flip) for (let i = 0; i < 9; i++) n[i] = -n[i];
    this.dirty = false;
  }
  vert(x, y, z, nx, ny, nz, u, v, ao) {
    if (this.nv >= this.cap) this._growV();
    if (this.dirty) this._nm();
    const m = this.m, n = this.nm, i = this.nv++, o = i * 8, b = i * 32, f = this.f, i8 = this.i8, u8 = this.u8;
    const px = m[0] * x + m[4] * y + m[8] * z + m[12], py = m[1] * x + m[5] * y + m[9] * z + m[13], pz = m[2] * x + m[6] * y + m[10] * z + m[14];
    let ax = n[0] * nx + n[3] * ny + n[6] * nz, ay = n[1] * nx + n[4] * ny + n[7] * nz, az = n[2] * nx + n[5] * ny + n[8] * nz;
    const l = 127 / (Math.sqrt(ax * ax + ay * ay + az * az) || 1);
    f[o] = px; f[o + 1] = py; f[o + 2] = pz;
    i8[b + 12] = Math.round(ax * l); i8[b + 13] = Math.round(ay * l); i8[b + 14] = Math.round(az * l); i8[b + 15] = Math.round(this.wind * 127);
    f[o + 4] = u; f[o + 5] = v;
    u8[b + 24] = this.cr; u8[b + 25] = this.cg; u8[b + 26] = this.cb;
    const a = this.ao * (ao === undefined ? 1 : ao); u8[b + 27] = a >= 1 ? 255 : a <= 0 ? 0 : (a * 255) | 0;
    u8[b + 28] = this.layer; u8[b + 29] = this.m1; u8[b + 30] = this.m2; u8[b + 31] = this.m3;
    const mn = this.min, mx = this.max;
    if (px < mn[0]) mn[0] = px; if (py < mn[1]) mn[1] = py; if (pz < mn[2]) mn[2] = pz;
    if (px > mx[0]) mx[0] = px; if (py > mx[1]) mx[1] = py; if (pz > mx[2]) mx[2] = pz;
    return i;
  }
  tri(a, b, c) { if (this.ni + 3 > this.icap) this._growI(3); const x = this.idx; if (this.flip) { x[this.ni++] = a; x[this.ni++] = c; x[this.ni++] = b; } else { x[this.ni++] = a; x[this.ni++] = b; x[this.ni++] = c; } }
  // flat quad, corners given top-left, bottom-left, bottom-right, top-right as seen from the front
  quad(tl, bl, br, tr, u0, v0, u1, v1, swap) {
    const ex = bl[0] - tl[0], ey = bl[1] - tl[1], ez = bl[2] - tl[2], fx = tr[0] - tl[0], fy = tr[1] - tl[1], fz = tr[2] - tl[2];
    const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
    if (u0 === undefined) { u0 = this.rnd() * 4; v0 = this.rnd() * 4; }
    if (u1 === undefined) { const w = hyp(fx, fy, fz) / this.tile, h = hyp(ex, ey, ez) / this.tile; if (swap) { u1 = u0 + h; v1 = v0 + w; } else { u1 = u0 + w; v1 = v0 + h; } }
    let a, b, c, d; const gt = this.grad ? this.grad[0] : 1, gb = this.grad ? this.grad[1] : 1;
    if (swap) {        // texture U runs along the vertical edge
      a = this.vert(tl[0], tl[1], tl[2], nx, ny, nz, u0, v0, gt); b = this.vert(bl[0], bl[1], bl[2], nx, ny, nz, u1, v0, gb);
      c = this.vert(br[0], br[1], br[2], nx, ny, nz, u1, v1, gb); d = this.vert(tr[0], tr[1], tr[2], nx, ny, nz, u0, v1, gt);
    } else {
      a = this.vert(tl[0], tl[1], tl[2], nx, ny, nz, u0, v0, gt); b = this.vert(bl[0], bl[1], bl[2], nx, ny, nz, u0, v1, gb);
      c = this.vert(br[0], br[1], br[2], nx, ny, nz, u1, v1, gb); d = this.vert(tr[0], tr[1], tr[2], nx, ny, nz, u1, v0, gt);
    }
    this.tri(a, b, c); this.tri(a, c, d);
    return this;
  }
  // double-sided quad
  quad2(tl, bl, br, tr, u0, v0, u1, v1) { this.quad(tl, bl, br, tr, u0, v0, u1, v1); this.quad(tr, br, bl, tl, u1, v0, u0, v1); return this; }
  // axis-aligned box from min to max corner (local space). skip = bitmask of faces to omit: 1 -X, 2 +X, 4 -Y, 8 +Y, 16 -Z, 32 +Z
  box(x0, y0, z0, x1, y1, z1, skip) {
    skip = skip | 0;
    const g = GRAIN_LAYERS.has(this.layer), dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    if (!(skip & 2)) this.quad([x1, y1, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], undefined, undefined, undefined, undefined, g && dy > dz);
    if (!(skip & 1)) this.quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], undefined, undefined, undefined, undefined, g && dy > dz);
    if (!(skip & 32)) this.quad([x0, y1, z1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], undefined, undefined, undefined, undefined, g && dy > dx);
    if (!(skip & 16)) this.quad([x1, y1, z0], [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], undefined, undefined, undefined, undefined, g && dy > dx);
    if (!(skip & 8)) this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], undefined, undefined, undefined, undefined, g && dz > dx);
    if (!(skip & 4)) this.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], undefined, undefined, undefined, undefined, g && dz > dx);
    return this;
  }
  // box centred on (x,z) sitting on y
  cbox(x, y, z, w, h, d, skip) { return this.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, skip); }
  // oriented beam from p0 to p1 with cross-section w (sideways) x h (up-ish)
  beam(p0, p1, w, h, skip) {
    const ax = v3.sub(p1, p0), L = v3.len(ax); if (L < 1e-5) return this;
    const z = v3.scale(ax, 1 / L), up = Math.abs(z[1]) > 0.985 ? [1, 0, 0] : [0, 1, 0];
    const x = v3.norm(v3.cross(up, z)), y = v3.cross(z, x);
    this.push(); const b = m4.create(); m4.basis(b, x, y, z, p0); m4.mul(this.m, this.m, b); this.dirty = true;
    this.box(-w / 2, -h / 2, 0, w / 2, h / 2, L, skip);
    return this.pop();
  }
  // parametric grid of shared vertices; fn(i, j) must call vert() once and return its index
  grid(cols, rows, fn) {
    const base = this.nv;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) fn(i, j);
    // decide winding from the first non-degenerate cell
    let flipW = false;
    const f = this.f, i8 = this.i8, W = cols + 1;
    outer: for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = base + j * W + i, b = a + W, c = b + 1;
      const ex = f[b * 8] - f[a * 8], ey = f[b * 8 + 1] - f[a * 8 + 1], ez = f[b * 8 + 2] - f[a * 8 + 2];
      const gx = f[c * 8] - f[a * 8], gy = f[c * 8 + 1] - f[a * 8 + 1], gz = f[c * 8 + 2] - f[a * 8 + 2];
      const nx = ey * gz - ez * gy, ny = ez * gx - ex * gz, nz = ex * gy - ey * gx;
      if (nx * nx + ny * ny + nz * nz < 1e-12) continue;
      const d = nx * i8[a * 32 + 12] + ny * i8[a * 32 + 13] + nz * i8[a * 32 + 14];
      flipW = d < 0; break outer;
    }
    if (this.ni + cols * rows * 6 > this.icap) this._growI(cols * rows * 6);
    const x = this.idx;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = base + j * W + i, b = a + W, c = b + 1, d = a + 1;
      if (flipW) { x[this.ni++] = a; x[this.ni++] = c; x[this.ni++] = b; x[this.ni++] = a; x[this.ni++] = d; x[this.ni++] = c; }
      else { x[this.ni++] = a; x[this.ni++] = b; x[this.ni++] = c; x[this.ni++] = a; x[this.ni++] = c; x[this.ni++] = d; }
    }
    return this;
  }
  // surface of revolution about +Y. profile = [[r, y], ...] bottom to top. caps: 1 bottom, 2 top
  lathe(prof, n, caps) {
    const np = prof.length, circ = TAU * Math.max(...prof.map(p => p[0]));
    const uo = this.rnd() * 3, vo = this.rnd() * 3; let len = 0; const acc = [0];
    for (let k = 1; k < np; k++) { len += hyp(prof[k][0] - prof[k - 1][0], prof[k][1] - prof[k - 1][1]); acc.push(len); }
    this.grid(n, np - 1, (i, j) => {
      const k = np - 1 - j, a = -i / n * TAU, p = prof[k], pa = prof[Math.max(k - 1, 0)], pb = prof[Math.min(k + 1, np - 1)];
      const tr = pb[0] - pa[0], ty = pb[1] - pa[1];           // tangent in (r,y); normal = (ty, -tr)
      const c = Math.cos(a), s = Math.sin(a);
      return this.vert(p[0] * c, p[1], p[0] * s, ty * c, -tr, ty * s, uo + i / n * circ / this.tile, vo + (len - acc[k]) / this.tile);
    });
    caps = caps | 0;
    if (caps & 2) this.disc(0, prof[np - 1][1], 0, prof[np - 1][0], n, 1);
    if (caps & 1) this.disc(0, prof[0][1], 0, prof[0][0], n, -1);
    return this;
  }
  cyl(x, y, z, r0, r1, h, n, caps) { this.push().T(x, y, z); this.lathe([[r0, 0], [r1, h]], n, caps === undefined ? 2 : caps); return this.pop(); }
  disc(x, y, z, r, n, dir) {
    const c = this.vert(x, y, z, 0, dir, 0, 0.5 * r / this.tile, 0.5 * r / this.tile); let prev = -1, first = -1;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
      const v = this.vert(x + cx, y, z + cz, 0, dir, 0, (cx + r * 0.5) / this.tile, (cz + r * 0.5) / this.tile);
      if (prev >= 0) { if (dir > 0) this.tri(c, v, prev); else this.tri(c, prev, v); } else first = v;
      prev = v;
    }
    if (dir > 0) this.tri(c, first, prev); else this.tri(c, prev, first);
    return this;
  }
  // ellipsoid
  ball(x, y, z, rx, ry, rz, nu, nv) {
    nu = nu || 10; nv = nv || 6; if (ry === undefined) { ry = rx; rz = rx; }
    return this.grid(nu, nv, (i, j) => {
      const a = -i / nu * TAU, b = j / nv * PI, sb = Math.sin(b), cb = Math.cos(b), ca = Math.cos(a), sa = Math.sin(a);
      return this.vert(x + rx * sb * ca, y + ry * cb, z + rz * sb * sa, sb * ca / rx, cb / ry, sb * sa / rz, i / nu * 2, j / nv);
    });
  }
  // tube along a polyline of [x,y,z] with per-point radii
  tube(pts, radii, n, capEnds) {
    const N = pts.length, frames = []; let prevX = null, len = 0; const acc = [0];
    for (let k = 0; k < N; k++) {
      const a = pts[Math.max(k - 1, 0)], b = pts[Math.min(k + 1, N - 1)];
      const t = v3.norm(v3.sub(b, a));
      let x = prevX ? v3.sub(prevX, v3.scale(t, v3.dot(prevX, t))) : v3.cross(Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], t);
      x = v3.norm(x); const y = v3.cross(t, x); prevX = x; frames.push([x, y]);
      if (k > 0) { len += v3.len(v3.sub(pts[k], pts[k - 1])); acc.push(len); }
    }
    const rad = k => typeof radii === 'number' ? radii : radii[k];
    const uo = this.rnd() * 3;
    this.grid(n, N - 1, (i, j) => {
      const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a), fr = frames[j], p = pts[j], r = rad(j);
      const nx = fr[0][0] * c + fr[1][0] * s, ny = fr[0][1] * c + fr[1][1] * s, nz = fr[0][2] * c + fr[1][2] * s;
      return this.vert(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, uo + i / n * TAU * rad(0) / this.tile, acc[j] / this.tile);
    });
    if (capEnds) { for (const k of [0, N - 1]) { const p = pts[k], r = rad(k), fr = frames[k], sgn = k ? 1 : -1; const t = v3.scale(v3.cross(fr[0], fr[1]), sgn);
      const c = this.vert(p[0], p[1], p[2], t[0], t[1], t[2], 0, 0); const ring = [];
      for (let i = 0; i < n; i++) { const a = i / n * TAU, cs = Math.cos(a), sn = Math.sin(a); ring.push(this.vert(p[0] + (fr[0][0] * cs + fr[1][0] * sn) * r, p[1] + (fr[0][1] * cs + fr[1][1] * sn) * r, p[2] + (fr[0][2] * cs + fr[1][2] * sn) * r, t[0], t[1], t[2], cs * r / this.tile, sn * r / this.tile)); }
      for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; if (sgn > 0) this.tri(c, a, b); else this.tri(c, b, a); } } }
    return this;
  }
  // convex polygon fan (points CCW from the front), planar UVs from the first edge
  poly(pts) {
    const a = pts[0], e = v3.norm(v3.sub(pts[1], a)), n = v3.norm(v3.cross(v3.sub(pts[1], a), v3.sub(pts[pts.length - 1], a))), f = v3.cross(n, e);
    const uo = this.rnd() * 3, vo = this.rnd() * 3;
    const ids = pts.map(p => { const d = v3.sub(p, a); return this.vert(p[0], p[1], p[2], n[0], n[1], n[2], uo + v3.dot(d, e) / this.tile, vo - v3.dot(d, f) / this.tile); });
    for (let i = 1; i < ids.length - 1; i++) this.tri(ids[0], ids[i], ids[i + 1]);
    return this;
  }
  get bytes() { return this.u8.subarray(0, this.nv * 32); }
  get indices() { return this.idx.subarray(0, this.ni); }
  center() { return [(this.min[0] + this.max[0]) / 2, (this.min[1] + this.max[1]) / 2, (this.min[2] + this.max[2]) / 2]; }
  radius() { return 0.5 * hyp(this.max[0] - this.min[0], this.max[1] - this.min[1], this.max[2] - this.min[2]); }
}
// packs many meshes into one vertex + one index buffer; returns ranges
class MeshPack {
  constructor() { this.items = []; this.nv = 0; this.ni = 0; }
  add(mesh, extra) {
    const it = Object.assign({ first: this.ni, count: mesh.ni, base: this.nv, mesh, c: mesh.center(), r: mesh.radius() }, extra || {});
    this.items.push(it); this.nv += mesh.nv; this.ni += mesh.ni; return it;
  }
  // de-interleaves the 32-byte vertices into attributes every item's geometry shares; indices become absolute
  upload(label) {
    const nv = Math.max(this.nv, 1), pos = new Float32Array(nv * 3), nrm = new Int8Array(nv * 4), uv = new Float32Array(nv * 2), tint = new Uint8Array(nv * 4), mm = new Uint8Array(nv * 4), wind = new Float32Array(nv);
    const ix = new Uint32Array(Math.max(this.ni, 3));
    for (const it of this.items) {
      const m = it.mesh, f = m.f, u8 = m.u8, i8 = m.i8, b0 = it.base;
      for (let v = 0; v < m.nv; v++) {
        const o = v * 8, b = v * 32, d = b0 + v;
        pos[d * 3] = f[o]; pos[d * 3 + 1] = f[o + 1]; pos[d * 3 + 2] = f[o + 2];
        nrm[d * 4] = i8[b + 12]; nrm[d * 4 + 1] = i8[b + 13]; nrm[d * 4 + 2] = i8[b + 14]; wind[d] = Math.max(i8[b + 15], 0) / 127;
        uv[d * 2] = f[o + 4]; uv[d * 2 + 1] = f[o + 5];
        tint[d * 4] = u8[b + 24]; tint[d * 4 + 1] = u8[b + 25]; tint[d * 4 + 2] = u8[b + 26]; tint[d * 4 + 3] = u8[b + 27];
        mm[d * 4] = u8[b + 28]; mm[d * 4 + 1] = u8[b + 29]; mm[d * 4 + 2] = u8[b + 30]; mm[d * 4 + 3] = u8[b + 31];
      }
      const src = m.indices; for (let k = 0; k < src.length; k++) ix[it.first + k] = src[k] + b0;
      it.mesh = null;
    }
    const BA = THREE.BufferAttribute;
    this.attr = { position: new BA(pos, 3), normal: new BA(nrm, 4, true), uv: new BA(uv, 2), tint: new BA(tint, 4, true), mm: new BA(mm, 4, true), wind: new BA(wind, 1) };
    this.index = new BA(ix, 1); this.label = label;
    this.tris = this.ni / 3;
    return this;
  }
}


// ---- 40_shade.js ----
// ───────────────────────── shared shading: frame uniforms and TSL helpers every material uses ─────────────────────────
// SH.init() must run after the textures in G exist. Other files take what they need from SH and from TSL inside their own closure,
// because TSL names such as clamp, mix or length would collide with the game's own maths helpers at the top level.
const SH = { U: null };
SH.init = function () {
  const { Fn, If, Loop, float, int, vec2, vec3, step, uniform, uniformArray, texture, positionWorld, mix, smoothstep, clamp, max, pow, exp, abs, dot, normalize, length, sqrt, select, dFdx, dFdy } = TSL;
  const V3 = () => new THREE.Vector3(), V4 = () => new THREE.Vector4();
  // one set of uniforms for the whole frame, written by renderFrame() from ENV
  const U = SH.U = {
    time: uniform(0), camPos: uniform(V3()),                 // camPos is always the player's eye, also inside shadow passes
    sunDir: uniform(new THREE.Vector3(0, 1, 0)), sunCol: uniform(V3()),      // active key light (sun or moon)
    ambSky: uniform(V3()), ambGnd: uniform(V3()),
    fogCol: uniform(V3()), fogDens: uniform(0.001), fogSun: uniform(V3()), fogFall: uniform(0.011),
    zenith: uniform(V3()), horizon: uniform(V3()), stars: uniform(0), aurora: uniform(0),
    moonDir: uniform(new THREE.Vector3(0, 1, 0)), moonBright: uniform(0), sunDisc: uniform(new THREE.Vector3(0, 1, 0)), sunDiscI: uniform(0),
    wind: uniform(V4()),                                      // dir.x, dir.z, strength, time
    cloud: uniform(0.45), grassRange: uniform(30), treeLod: uniform(65), windowGlow: uniform(0), lakeY: uniform(0), indoor: uniform(0),
    lightPos: uniformArray(Array.from({ length: 8 }, V4), 'vec4'),   // xyz, radius
    lightCol: uniformArray(Array.from({ length: 8 }, V4), 'vec4'),   // rgb, zone (255 = everywhere)
  };
  const sat = SH.sat = x => clamp(x, 0, 1);
  const noiseL = SH.noiseL = uvn => texture(G.noiseTex, uvn).level(0);
  // sky gradient without clouds (also used for reflections)
  SH.skyBase = Fn(([dir]) => {
    const t = pow(sat(max(dir.y, 0).oneMinus()), 3.5);
    const c = mix(U.zenith, U.horizon, t).toVar();
    const sd = max(dot(dir, U.sunDisc), 0);
    c.addAssign(U.fogSun.mul(pow(sd, 6).mul(0.45).mul(t.mul(0.7).add(0.3)).add(pow(sd, 90).mul(0.8))));
    return mix(c, U.fogCol, smoothstep(-0.10, 0.03, dir.y).oneMinus());
  });
  SH.cloudDensity = Fn(([p]) => {
    const t = U.time, uvc = p.mul(0.00022).add(vec2(t.mul(0.0030), t.mul(0.0011)));
    const d = noiseL(uvc).r.mul(0.64).add(noiseL(uvc.mul(3.1).add(vec2(t.mul(0.002), 0))).g.mul(0.36));
    return smoothstep(float(0.86).sub(U.cloud.mul(0.62)), float(1.10).sub(U.cloud.mul(0.62)), d);
  });
  // sky + ground ambient for a surface. skyVis: 0 deep interior .. 1 open sky. Rooms (zone != 0) get a greyer, warmer bounce.
  SH.hemi = Fn(([N, skyVis, zone]) => {
    const h = mix(U.ambGnd, U.ambSky, N.y.mul(0.5).add(0.5)).mul(skyVis);
    const room = mix(vec3(dot(h, vec3(0.3333))), h, 0.25).mul(vec3(1.10, 1.0, 0.88));
    return mix(h, room, step(0.5, zone));      // arithmetic, not select(): select() with these branches makes Three r187 emit a redeclared variable
  });
  // the eight nearest point lights (hearths, lanterns). A light only reaches surfaces of its own zone, so it cannot leak through walls.
  SH.pointLights = Fn(([wp, N, zone, wrap]) => {
    const acc = vec3(0).toVar();
    Loop({ start: int(0), end: int(8), type: 'int', condition: '<' }, ({ i }) => {
      const lc = U.lightCol.element(i), lp = U.lightPos.element(i);
      const d = lp.xyz.sub(wp), d2 = dot(d, d), r2 = lp.w.mul(lp.w);
      If(abs(lc.w.sub(zone)).lessThan(0.5).or(lc.w.greaterThan(254.5)).and(d2.lessThan(r2)), () => {
        const f = float(1).sub(d2.div(r2)), att = f.mul(f).div(d2.mul(0.55).add(1));
        const ndl = dot(N, d).mul(max(d2, 1e-4).inverseSqrt()).add(wrap).div(float(1).add(wrap));
        acc.addAssign(lc.rgb.mul(att.mul(max(ndl, 0))));
      });
    });
    return acc;
  });
  // tangent frame from screen derivatives, then a tangent-space normal (xy in 0..1) applied to the world normal N
  SH.perturb = Fn(([N, wp, uvn, nxy, strength]) => {
    const dp1 = dFdx(wp), dp2 = dFdy(wp), du1 = dFdx(uvn), du2 = dFdy(uvn);
    const det = du1.x.mul(du2.y).sub(du2.x.mul(du1.y)), sg = select(det.greaterThanEqual(0), float(1), float(-1));
    const T0 = dp1.mul(du2.y).sub(dp2.mul(du1.y)).mul(sg), B0 = dp2.mul(du1.x).sub(dp1.mul(du2.x)).mul(sg);
    const T = T0.sub(N.mul(dot(N, T0))), B = B0.sub(N.mul(dot(N, B0)));
    const tl = dot(T, T), bl = dot(B, B), n2 = nxy.mul(2).sub(1).mul(strength);
    const out = normalize(T.mul(max(tl, 1e-20).inverseSqrt().mul(n2.x)).add(B.mul(max(bl, 1e-20).inverseSqrt().mul(n2.y))).add(N.mul(sqrt(max(float(1).sub(dot(n2, n2)), 0.05)))));
    return mix(N, out, step(1e-14, tl).mul(step(1e-14, bl)));
  });
  // height fog with a sun-side glow; use as scene.fogNode = TSL.fog(SH.fogColor(), SH.fogAmount())
  SH.fogAmount = Fn(() => {
    const d = positionWorld.sub(U.camPos), dist = length(d), k = U.fogFall.mul(d.y);
    const ks = mix(k, float(0.002), step(abs(k), 0.002)), integ = dist.mul(float(1).sub(exp(ks.negate()))).div(ks);
    const dens = U.fogDens.mul(exp(U.fogFall.negate().mul(max(U.camPos.y.sub(K.fogBase), 0))));
    return float(1).sub(exp(dens.negate().mul(integ)));
  });
  SH.fogColor = Fn(() => {
    const s = pow(max(dot(normalize(positionWorld.sub(U.camPos)), U.sunDisc), 0), 6);
    return mix(U.fogCol, U.fogCol.add(U.fogSun.mul(0.6)), s);
  });
  SH.groundTint = (mn, mn2) => mix(vec3(0.80, 0.90, 0.70), vec3(1.16, 1.06, 0.80), mn.r).mul(mn2.a.mul(0.28).add(0.86));
};
// copies ENV (see 50_env.js) and the camera into the frame uniforms
SH.update = function (env, camPos, time) {
  const U = SH.U, s3 = (u, a) => u.value.set(a[0], a[1], a[2]);
  U.time.value = time; s3(U.camPos, camPos);
  s3(U.sunDir, env.keyDir); s3(U.sunCol, env.keyCol); s3(U.ambSky, env.ambSky); s3(U.ambGnd, env.ambGnd);
  s3(U.fogCol, env.fogCol); U.fogDens.value = env.fogDensity; s3(U.fogSun, env.fogSun);
  s3(U.zenith, env.zenith); s3(U.horizon, env.horizon); U.stars.value = env.stars; U.aurora.value = env.aurora;
  s3(U.moonDir, env.moonDir); U.moonBright.value = env.moonBright; s3(U.sunDisc, env.sunDir); U.sunDiscI.value = env.sunDisc;
  U.wind.value.set(env.windDir[0], env.windDir[1], env.windStrength, time);
  U.cloud.value = env.cloud; U.windowGlow.value = env.windowGlow; U.lakeY.value = World.lakeY || 0; U.indoor.value = World.indoor || 0;
};


// ---- 41_materials.js ----
// ───────────────────────── materials: buildings and props, terrain, foliage ─────────────────────────
// The sun (diffuse, specular, shadow) is Three's own DirectionalLight. Everything else a surface receives (sky and ground
// ambient, hearth and lantern light limited to its own zone, glowing geometry) is added through emissiveNode with the SH helpers.
function gfxDataTex(data, w, h, format, type) {
  const t = new THREE.DataTexture(data, w, h, format, type);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}
// tree / rock instance transform with wind; ipos = xyz scale, iprm = yaw, tint, phase
function instNodes(noLod) {
  const { Fn, vec3, attribute, positionLocal, normalLocal, cos, sin, distance, select, float } = TSL, U = SH.U;
  const ipos = attribute('ipos', 'vec4'), iprm = attribute('iprm', 'vec4'), lod = attribute('mm', 'vec4').w.mul(255).round();
  const pos = Fn(() => {
    const c = cos(iprm.x), s = sin(iprm.x), lp = positionLocal.mul(ipos.w), ww = attribute('wind', 'float');
    const p = vec3(lp.x.mul(c).add(lp.z.mul(s)), lp.y, lp.x.negate().mul(s).add(lp.z.mul(c)));
    const wt = U.wind.w, ph = iprm.z.mul(40);
    const sway = sin(wt.mul(1.1).add(ph).add(p.y.mul(0.2))).mul(0.6).add(sin(wt.mul(2.3).add(ph.mul(1.7)).add(lp.x.mul(1.3))).mul(0.4));
    const lean = p.y.mul(p.y).mul(0.0004).mul(sin(wt.mul(0.7).add(ph)).add(0.5));
    const off = sway.mul(ww).mul(0.10).add(lean).mul(U.wind.z);
    const w = vec3(p.x.add(U.wind.x.mul(off)), p.y.add(sin(wt.mul(2.9).add(ph).add(lp.x.mul(2.1)).add(lp.z.mul(1.7))).mul(ww).mul(0.03).mul(U.wind.z)), p.z.add(U.wind.y.mul(off))).add(ipos.xyz);
    // full trees near the player, flat stand-ins beyond; measured from the player even while a shadow map is drawn
    const d = distance(ipos.xyz, U.camPos);
    const far = TSL.step(U.treeLod, d), is1 = TSL.step(TSL.abs(lod.sub(1)), 0.5), is2 = TSL.step(TSL.abs(lod.sub(2)), 0.5);
    return noLod ? w : TSL.mix(w, vec3(0, -20000, 0), is1.mul(far).add(is2.mul(far.oneMinus())));
  })();
  const c = cos(iprm.x), s = sin(iprm.x), n = normalLocal;
  const nrm = vec3(n.x.mul(c).add(n.z.mul(s)), n.y, n.x.negate().mul(s).add(n.z.mul(c)));
  const tintK = TSL.mix(vec3(0.80, 0.86, 0.80), vec3(1.16, 1.06, 0.84), iprm.y);
  return { pos, nrm, tintK, float };
}
// mode: 'static' world-space geometry | 'inst' instanced trunks and rocks | 'rigid' objects moved by their matrix | 'skin' two-bone villagers
function surfaceMaterial(mode) {
  const { float, int, vec3, vec4, attribute, texture, uv, varying, uniform, uniformArray, positionWorld, positionLocal, normalLocal, normalWorld, mix, mod, step, normalize, transformNormalToView } = TSL;
  const m = new THREE.MeshStandardNodeMaterial();
  const mm = attribute('mm', 'vec4').mul(255).round(), tint = attribute('tint', 'vec4');
  let vN, tintLin = tint.rgb.mul(tint.rgb), zone = float(0), light = float(1), unlit = float(0);
  if (mode === 'static') { vN = varying(normalLocal); zone = mm.y; unlit = step(1.5, mod(mm.z, 4)); }
  else if (mode === 'inst') { const I = instNodes(); m.positionNode = I.pos; vN = varying(I.nrm); tintLin = varying(tintLin.mul(I.tintK)); }
  else if (mode === 'rigid') { vN = TSL.normalWorldGeometry; }
  else {
    const bones = uniformArray(Array.from({ length: 16 }, () => new THREE.Matrix4()), 'mat4');
    const zoneU = uniform(0), lightU = uniform(1);
    const b0 = bones.element(int(mm.y)), b1 = bones.element(int(mm.z)), w1 = mm.w.div(255);
    const p4 = vec4(positionLocal, 1), n4 = vec4(normalLocal, 0);
    m.positionNode = mix(b0.mul(p4).xyz, b1.mul(p4).xyz, w1);
    vN = varying(mix(b0.mul(n4).xyz, b1.mul(n4).xyz, w1));
    zone = zoneU; light = lightU; m.userData = { bones: bones.array, zoneU, lightU };
  }
  const layer = int(mm.x), a = texture(G.albedoArr, uv()).depth(layer), nt = texture(G.narArr, uv()).depth(layer);
  const albedo = a.rgb.mul(mix(vec3(1), tintLin, a.a));
  const N = SH.perturb(normalize(vN), positionWorld, uv(), nt.xy, float(1));
  const amb = SH.hemi(N, tint.a.mul(light).mul(nt.z), zone).add(SH.pointLights(positionWorld, N, zone, float(0.25)).mul(mix(float(0.6), 1.0, nt.z)));
  m.colorNode = albedo.mul(unlit.oneMinus());
  m.emissiveNode = albedo.mul(mix(amb, vec3(mm.w.div(16)), unlit));
  m.normalNode = transformNormalToView(N);
  m.roughnessNode = nt.w; m.metalnessNode = float(0);
  return m;
}
// leaf cards: cut-out, lit from both sides, a little sun shining through
// noLod: the copy that only the wide shadow map draws, where every tree is its flat stand-in whatever the distance
function foliageMaterial(noLod) {
  const { float, int, vec3, attribute, texture, uv, varying, positionWorld, normalize, transformNormalToView, pow, dot, max } = TSL, U = SH.U;
  const m = new THREE.MeshLambertNodeMaterial();
  const I = instNodes(noLod), mm = attribute('mm', 'vec4').mul(255).round(), tint = attribute('tint', 'vec4');
  m.positionNode = I.pos;
  const vN = varying(I.nrm), vTint = varying(tint.rgb.mul(tint.rgb).mul(I.tintK)), sky = varying(tint.a);
  const a = texture(G.albedoArr, uv()).depth(int(mm.x)), raw = a.rgb.mul(vTint), N = normalize(vN);
  // leaves were the brightest, most saturated thing in the valley (and glowed at night): take them down toward the ground's values
  const albedo = TSL.mix(vec3(dot(raw, vec3(0.2126, 0.7152, 0.0722))), raw, 0.72).mul(0.62);
  const V = normalize(U.camPos.sub(positionWorld)), back = pow(SH.sat(dot(V, U.sunDir.negate())), 3).mul(0.55);
  // sharpen the cut-out to about one pixel so multisampling can smooth the leaf edges
  m.colorNode = albedo; m.opacityNode = SH.sat(a.a.sub(0.45).div(max(TSL.fwidth(a.a), 0.001)).add(0.5)); m.alphaTest = 0.5;
  m.normalNode = transformNormalToView(normalize(N.add(U.sunDir.mul(0.6))));      // wrap the sun around the crown
  m.emissiveNode = albedo.mul(SH.hemi(N, sky, float(0)).add(SH.pointLights(positionWorld, N, float(0), float(0.6))).add(vec3(1.3, 1.25, 0.6).mul(U.sunCol).mul(back.mul(sky).mul(0.3))));
  m.side = THREE.DoubleSide;
  return m;
}
// terrain: scanned ground layers blended by painted masks, slope and their own height
function terrainMaterial() {
  const { Fn, If, float, int, vec2, vec3, vec4, property, texture, varying, positionWorld, normalLocal, mix, smoothstep, step, max, pow, abs, sin, dot, normalize, length, distance, reflect, dFdx, dFdy, transformNormalToView } = TSL;
  const U = SH.U, sat = SH.sat, TH = K.terrainHalf, wp = positionWorld, vN = varying(normalLocal);
  const m = new THREE.MeshStandardNodeMaterial();
  const pN = property('vec3'), pRough = property('float'), pEmis = property('vec3');
  m.colorNode = Fn(() => {
    const r = length(wp.xz), dist = distance(wp, U.camPos);
    const inside = step(abs(wp.x), TH).mul(step(abs(wp.z), TH)), suv = wp.xz.div(2 * TH).add(0.5);
    const sp = texture(G.splatTex, suv).mul(inside).toVar(), s2 = texture(G.splat2Tex, suv).mul(inside).toVar();      // sp: r road, g cobbles, b field, a bare
    const mn = texture(G.noiseTex, wp.xz.mul(0.0041)).toVar(), mn2 = texture(G.noiseTex, wp.xz.mul(0.037)).toVar(), mn3 = texture(G.noiseTex, wp.xz.mul(0.23)).toVar();
    const dn = texture(G.noiseTex, wp.xz.mul(0.0013)).zw.sub(0.5);
    const Nv = normalize(vN.add(vec3(dn.x, 0, dn.y).mul(smoothstep(260, 700, r).mul(1.1)))).toVar();
    const slope = Nv.y.oneMinus();
    const uvG = wp.xz.div(3).toVar(), uvF = wp.xz.div(14).add(vec2(0.37, 0.11)).toVar(), uvC = wp.xz.div(2.5).toVar(), uvR = vec2(wp.x.add(wp.z), wp.y.mul(1.3)).mul(0.16).toVar();
    const dGx = dFdx(uvG).toVar(), dGy = dFdy(uvG).toVar(), dFx = dFdx(uvF).toVar(), dFy = dFdy(uvF).toVar(), dCx = dFdx(uvC).toVar(), dCy = dFdy(uvC).toVar(), dRx = dFdx(uvR).toVar(), dRy = dFdy(uvR).toVar();
    const det = dist.lessThan(110);                             // normal maps only matter near the camera
    const farK = smoothstep(16, 55, dist).toVar();
    const wRock = sat(slope.sub(0.24).add(mn2.r.sub(0.5).mul(0.22)).sub(smoothstep(120, 300, wp.y).mul(0.12)).mul(7)).toVar();
    const wSnow = smoothstep(400, 540, wp.y.add(mn.r.mul(170))).mul(smoothstep(0.30, 0.60, slope).oneMinus()).toVar();
    const wFar = smoothstep(300, 480, r).mul(wRock.mul(0.7).oneMinus()).mul(smoothstep(210, 330, wp.y.add(mn.g.mul(90))).oneMinus());
    const tintG = SH.groundTint(mn, mn2).toVar();
    const samp = (layer, uvn, dx, dy) => {
      const a = texture(G.albedoArr, uvn).depth(int(layer)).grad(dx, dy).toVar();
      const o = { c: a.rgb.toVar(), h: a.a.toVar(), n: vec2(0.5).toVar(), ao: float(1).toVar(), r: float(0.9).toVar() };
      If(det, () => { const t = texture(G.narArr, uvn).depth(int(layer)).grad(dx, dy).toVar(); o.n.assign(t.xy); o.ao.assign(t.z); o.r.assign(t.w); });
      return o;
    };
    // meadow: a near and a far repeat of the same scan, cross-faded, so it is sharp underfoot and never a grid on the hills
    const G0 = samp(MAT.GRASS, uvG, dGx, dGy);
    If(farK.greaterThan(0.01), () => { const f = texture(G.albedoArr, uvF).depth(int(MAT.GRASS)).grad(dFx, dFy).toVar(); G0.c.assign(mix(G0.c, f.rgb, farK.mul(0.85))); G0.h.assign(mix(G0.h, f.a, farK)); });
    G0.c.mulAssign(tintG);
    // b shows through first where b's own surface stands higher, so borders follow pebbles and tufts instead of fading
    const over = (b, w) => {
      const k = sat(w.sub(0.5).mul(3).add(b.h.sub(G0.h).mul(1.4)).add(0.5)).mul(smoothstep(0, 0.10, w)).toVar();
      G0.c.assign(mix(G0.c, b.c, k)); G0.h.assign(mix(G0.h, b.h, k)); G0.n.assign(mix(G0.n, b.n, k)); G0.ao.assign(mix(G0.ao, b.ao, k)); G0.r.assign(mix(G0.r, b.r, k));
    };
    const w2 = sat(sat(mn.g.sub(0.47).mul(6).add(mn2.r.sub(0.5).mul(1.6))).mul(0.8).add(s2.a.mul(1.2))).toVar();
    If(w2.greaterThan(0.004), () => { const g2 = samp(MAT.GRASS2, uvG.mul(1.31), dGx.mul(1.31), dGy.mul(1.31)); g2.c.mulAssign(tintG); over(g2, w2); });
    If(s2.r.greaterThan(0.004), () => { over(samp(MAT.FOREST, uvG, dGx, dGy), s2.r); });
    G0.c.assign(mix(G0.c, vec3(0.030, 0.062, 0.030).mul(mn2.r.mul(0.9).add(0.6)), wFar));
    const wSoil = max(sp.b, sp.a.mul(0.92)).toVar();
    If(wSoil.greaterThan(0.004), () => {
      const s = samp(MAT.SOIL, uvG, dGx, dGy), fr = sin(wp.x.mul(0.35).add(wp.z.mul(0.94)).mul(8.2)).mul(sp.b).toVar();
      s.c.mulAssign(fr.mul(0.22).add(1)); s.n.assign(vec2(s.n.x.add(fr.mul(0.16)), s.n.y)); s.h.addAssign(fr.mul(0.2)); over(s, wSoil);
    });
    // road: trodden gravel in the middle, mud along the verge and wherever water stands
    const road = sat(sp.r.add(mn3.g.sub(0.5).mul(0.30).mul(step(0.03, sp.r)))).toVar();
    const wMud = max(smoothstep(0.10, 0.34, road).mul(smoothstep(0.48, 0.74, road).oneMinus()), s2.g.mul(sp.a.oneMinus())).mul(sp.g.oneMinus()).toVar();
    If(wMud.greaterThan(0.004), () => { over(samp(MAT.MUD, uvG.mul(1.17), dGx.mul(1.17), dGy.mul(1.17)), wMud); });
    const wPath = smoothstep(0.44, 0.76, road).toVar();
    If(wPath.greaterThan(0.004), () => { over(samp(MAT.DIRT, uvG, dGx, dGy), wPath); });
    const wGrav = sp.a.mul(smoothstep(0.25, 0.65, s2.g)).toVar();
    If(wGrav.greaterThan(0.004), () => { over(samp(MAT.GRAVEL, uvG.mul(1.4), dGx.mul(1.4), dGy.mul(1.4)), wGrav); });
    If(sp.g.greaterThan(0.004), () => { const c = samp(MAT.COBBLE, uvC, dCx, dCy); c.h.assign(c.h.mul(0.2).add(0.72)); over(c, sat(sp.g.mul(1.15)).toVar()); });
    // puddles collect in the low spots of roads and wet banks
    const wetGround = max(max(wMud, wPath.mul(0.8)), s2.g.mul(0.9)).mul(sp.g.oneMinus());
    const pud = smoothstep(0.58, 0.70, mn2.a.mul(0.50).add(mn3.b.mul(0.28)).add(s2.g.mul(0.55))).mul(wetGround).mul(smoothstep(0.02, 0.09, slope).oneMinus()).mul(smoothstep(0.30, 0.55, G0.h).oneMinus()).mul(farK.mul(0.6).oneMinus()).toVar();
    const damp = sat(s2.g.mul(0.7).add(pud)).toVar();
    G0.c.mulAssign(mix(float(1), 0.52, damp)); G0.r.assign(mix(G0.r, 0.07, pud)); G0.r.assign(mix(G0.r, 0.45, damp.mul(0.6))); G0.n.assign(mix(G0.n, vec2(0.5), pud)); G0.ao.assign(mix(G0.ao, 1.0, pud));
    If(wRock.greaterThan(0.004), () => {
      const q = samp(MAT.ROCK, uvR, dRx, dRy); q.c.mulAssign(vec3(0.97, 0.98, 1.04).mul(mn.g.mul(0.45).add(0.80)));
      G0.c.assign(mix(G0.c, q.c, wRock)); G0.ao.assign(mix(G0.ao, q.ao, wRock)); G0.r.assign(mix(G0.r, q.r, wRock)); G0.n.assign(mix(G0.n, vec2(0.5), wRock));
    });
    G0.c.assign(mix(G0.c, vec3(0.80, 0.84, 0.90), wSnow));
    const N = SH.perturb(Nv, wp, uvG, G0.n, smoothstep(80, 110, dist).oneMinus()).toVar();
    const ao = G0.ao.mul(s2.b.mul(0.55).oneMinus()), contact = s2.b.mul(0.32).oneMinus();        // soft contact shade at the foot of walls and trunks
    // standing water mirrors the sky
    const V = normalize(U.camPos.sub(wp)), Rf = reflect(V.negate(), N), F = pow(sat(dot(N, V).oneMinus()), 5).mul(0.97).add(0.03);
    const k = F.mul(pud).mul(0.85).mul(step(0.01, pud)).toVar();
    const sky = SH.skyBase(vec3(Rf.x, abs(Rf.y).add(0.02), Rf.z));
    const albedo = G0.c.mul(contact).mul(k.oneMinus()).toVar();
    pN.assign(N); pRough.assign(mix(G0.r, 0.6, wSnow));
    pEmis.assign(albedo.mul(SH.hemi(N, ao, float(0)).add(SH.pointLights(wp, N, float(0), float(0.25)).mul(mix(float(0.6), 1.0, ao)))).add(sky.mul(k).mul(contact)));
    return vec4(albedo, 1);
  })();
  m.normalNode = transformNormalToView(pN); m.roughnessNode = pRough; m.metalnessNode = float(0); m.emissiveNode = pEmis;
  return m;
}


// ---- 42_scene.js ----
// ───────────────────────── scene: Three objects built from the generated world ─────────────────────────
// Layers: 0 = seen by the camera and both sun shadow maps; 1 = camera and the near shadow map only (interiors, full trees,
// villagers, small props); 2 = the wide shadow map only (flat tree stand-ins that cast for every tree out there).
const SC = { scene: null, statics: [], cells: [], rigid: [], bodies: [], mats: {} };
function sceneBuild() {
  const scene = SC.scene = new THREE.Scene(), M = SC.mats;
  scene.matrixWorldAutoUpdate = true;
  M.static = surfaceMaterial('static'); M.inst = surfaceMaterial('inst'); M.rigid = surfaceMaterial('rigid'); M.leaf = foliageMaterial(); M.leafFar = foliageMaterial(true); M.terrain = terrainMaterial();
  M.water = WaterMat(); M.glow = GlowMat();
  const sphere = (c, r) => new THREE.Sphere(new THREE.Vector3(c[0], c[1], c[2]), r);
  const geo = (pk, first, count, inst) => {
    const g = inst ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
    for (const k in pk.attr) if (k !== 'wind' || inst) g.setAttribute(k, pk.attr[k]);
    g.setIndex(pk.index); g.setDrawRange(first, count);
    return g;
  };
  // ── static world: terrain tiles, houses inside and out, props, water, window panes ──
  for (const pk of World.packs) for (const it of pk.items) {
    const mat = it.kind === 'terrain' ? M.terrain : it.kind === 'water' ? M.water : it.kind === 'glow' ? M.glow : M.static;
    if (!mat || !it.count) continue;
    const g = geo(pk, it.first, it.count); g.boundingSphere = sphere(it.c, it.r);
    const mesh = new THREE.Mesh(g, mat); mesh.matrixAutoUpdate = false;
    mesh.castShadow = !!pk.shadow && !it.noShadow && it.kind === 'opaque'; mesh.receiveShadow = it.kind === 'opaque' || it.kind === 'terrain';
    if (it.kind === 'water') mesh.renderOrder = 2; else if (it.kind === 'glow') mesh.renderOrder = 3;
    if (it.nearOnly) mesh.layers.set(1);
    scene.add(mesh); SC.statics.push({ mesh, it });
  }
  // ── instanced trees, bushes and boulders: one mesh per (model, cell) so cells cull and switch level of detail ──
  const IBA = THREE.InstancedBufferAttribute;
  for (const grp of World.instGroups) for (const c of grp.cells) {
    if (!c.ipos) {
      const a = new Float32Array(c.count * 4), b = new Float32Array(c.count * 4), src = grp.ibuf;
      for (let i = 0; i < c.count; i++) { const o = (c.first + i) * 8; a.set(src.subarray(o, o + 4), i * 4); b.set(src.subarray(o + 4, o + 8), i * 4); }
      c.ipos = new IBA(a, 4); c.iprm = new IBA(b, 4);
    }
    const g = geo(World.instPack, grp.first, grp.count, true); g.setAttribute('ipos', c.ipos); g.setAttribute('iprm', c.iprm); g.instanceCount = c.count; g.boundingSphere = sphere(c.c, c.r);
    const mesh = new THREE.Mesh(g, grp.kind === 'leaf' ? M.leaf : M.inst); mesh.matrixAutoUpdate = false;
    mesh.castShadow = !!grp.shadow && grp.lod !== 2; mesh.receiveShadow = true;
    if (grp.nearOnly || grp.lod === 1) mesh.layers.set(1);
    scene.add(mesh); SC.cells.push({ mesh, grp, c });
    if (grp.lod === 2 && grp.shadow) { const tw = new THREE.Mesh(g, M.leafFar); tw.matrixAutoUpdate = false; tw.castShadow = true; tw.layers.set(2); scene.add(tw); }
  }
  // ── hinged and carried things (doors, mill wheel, pickups, chickens): rigid pieces, one per bone, moved by R.boneData ──
  const pk = World.skinPack, mmA = pk.attr.mm.array, ixA = pk.index.array, pieces = new Map();
  const split = obj => {
    let p = pieces.get(obj.first); if (p) return p;
    const by = new Map();
    for (let k = obj.first; k < obj.first + obj.count; k += 3) { const b = mmA[ixA[k] * 4 + 1]; let l = by.get(b); if (!l) by.set(b, l = []); l.push(ixA[k], ixA[k + 1], ixA[k + 2]); }
    p = [];
    for (const [bone, list] of by) { const g = new THREE.BufferGeometry(); for (const k in pk.attr) if (k !== 'wind') g.setAttribute(k, pk.attr[k]); g.setIndex(new THREE.BufferAttribute(new Uint32Array(list), 1)); p.push({ bone, g }); }
    pieces.set(obj.first, p); return p;
  };
  for (const obj of World.skinned) {
    if (obj.npc && obj.hasChar) continue;      // an animated glTF villager stands in for this old body (49_chars.js)
    if (obj.npc) {
      const mat = surfaceMaterial('skin'), g = geo(pk, obj.first, obj.count), mesh = new THREE.Mesh(g, mat);
      mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = true; mesh.layers.set(1);
      scene.add(mesh); SC.bodies.push({ mesh, obj, mat });
    } else for (const p of split(obj)) {
      const mesh = new THREE.Mesh(p.g, M.rigid); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = true; mesh.layers.set(1);
      scene.add(mesh); SC.rigid.push({ mesh, obj, o: obj.slot * 256 + p.bone * 16 });
    }
  }
  return scene;
}
// per frame: move the dynamic pieces, switch tree detail, hide what is too far to matter
function sceneUpdate(camPos, q) {
  const bd = R.boneData, e = camPos;
  for (const s of SC.statics) { const it = s.it; if (it.maxDist) s.mesh.visible = hyp(it.c[0] - e[0], it.c[1] - e[1], it.c[2] - e[2]) <= it.maxDist + it.r; }
  for (const s of SC.cells) {
    const c = s.c, grp = s.grp, dc = hyp(c.c[0] - e[0], c.c[2] - e[2]);
    s.mesh.visible = !((grp.lod === 1 && dc > q.treeLod + c.r) || (grp.lod === 2 && dc < q.treeLod - c.r) || (grp.maxDist && dc > grp.maxDist + c.r));
  }
  for (const r of SC.rigid) {
    const o = r.obj, vis = o.visible && hyp(bd[o.slot * 256 + 12] - e[0], bd[o.slot * 256 + 14] - e[2]) < 160;
    r.mesh.visible = vis; if (!vis) continue;
    r.mesh.matrix.fromArray(bd, r.o); r.mesh.matrixWorld.copy(r.mesh.matrix);
  }
  for (const b of SC.bodies) {
    const o = b.obj; b.mesh.visible = o.visible; if (!o.visible) continue;
    const k = o.slot * 256, arr = b.mat.userData.bones;
    for (let i = 0; i < 11; i++) arr[i].fromArray(bd, k + i * 16);
    b.mat.userData.zoneU.value = bd[k + 240]; b.mat.userData.lightU.value = bd[k + 241];
  }
}


// ---- 43_render.js ----
// ───────────────────────── renderer: quality tiers, camera, sun and shadows, post, frame ─────────────────────────
const QUALITY = {
  low:    { name: 'Low',    pr: 1.0, msaa: 1, shadowRes: 1024, bloom: false, grassRange: 18, grassDensity: 0.30, treeLod: 40, lights: 4, aniso: 2, far1: 3 },
  medium: { name: 'Medium', pr: 1.5, msaa: 4, shadowRes: 1536, bloom: true,  grassRange: 30, grassDensity: 0.60, treeLod: 65, lights: 6, aniso: 4, far1: 2 },
  high:   { name: 'High',   pr: 2.0, msaa: 4, shadowRes: 2048, bloom: true,  grassRange: 36, grassDensity: 1.00, treeLod: 90, lights: 8, aniso: 8, far1: 2 },
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
  if (!prev || prev.grassRange !== q.grassRange) { if (prev) Grass.dispose(); Grass.build(SC.scene, q); }
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
  for (let i = 0; i < 8; i++) {
    if (i >= n) { P[i].set(0, -9999, 0, 0); C[i].set(0, 0, 0, 0); continue; }
    const l = cand[i][1], k = cand[i][2] * (i >= maxN - 1 && cand.length > maxN ? 0.5 : 1);
    P[i].set(l.p[0], l.p[1], l.p[2], l.r); C[i].set(l.c[0] * k, l.c[1] * k, l.c[2] * k, l.zone);
  }
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
  const fh = v3.norm([f[0], 0, f[2]]), r0 = 24, r1 = 92, S = R.shadows;
  const upd1 = (R.frame % q.far1) === 1 || !R.shadow1Ready || !!TEST;
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


// ---- 44_kit.js ----
// ───────────────────────── asset kits: modular buildings, props, nature (glTF packs under kits/) ─────────────────────────
// A pack is one GLB whose top-level nodes are the pieces, plus a catalogue (bbox, category, notes). Pieces from every pack share one
// namespace. Level code places pieces through a batch, which merges them into a few meshes per material and 24 m cell, or as
// instanced meshes for things repeated hundreds of times. Every kit material is lit like the rest of the world: Three's sun light
// and shadow, plus ambient and the zone-aware point lights in the emissive term (see 40_shade.js).
const Kit = (() => {
  const { Fn, float, vec2, vec3, vec4, uniform, attribute, texture, uv, positionWorld, positionLocal, positionGeometry, normalWorld, normalMap,
    mix, dot, sin, floor, fract, smoothstep, max, reflect, normalize, pow, frontFacing, select, abs } = TSL;
  const K_ = {
    PACKS: [{ glb: 'kits/village.glb', catalog: 'kits/CATALOG.json' }, { glb: 'kits/props.glb' }, { glb: 'kits/nature.glb' }, { glb: 'kits/scan.glb', catalog: 'kits/SCAN_CATALOG.json', optional: true }],
    pieces: {}, cat: {}, defs: {}, mats: new Map(), skin: 'realistic', skinDef: {}, ready: false, instanced: [],
    grade: null,
  };
  const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _n3 = new THREE.Matrix3();

  // ── loading ──
  async function fetchJson(url, optional) { const r = await fetch(url); if (!r.ok) { if (optional) return null; throw new Error(url + ' ' + r.status); } return r.json(); }
  function extract(mesh) {       // one primitive -> plain arrays in piece space
    const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, T = g.attributes.uv, C = g.attributes.color, n = P.count;
    const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uvs = new Float32Array(n * 2), col = C ? new Float32Array(n * 3) : null;
    mesh.updateWorldMatrix(true, false); _n3.getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < n; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(mesh.matrixWorld); pos[i * 3] = _v.x; pos[i * 3 + 1] = _v.y; pos[i * 3 + 2] = _v.z;
      if (N) { _v.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize(); nrm[i * 3] = _v.x; nrm[i * 3 + 1] = _v.y; nrm[i * 3 + 2] = _v.z; } else nrm[i * 3 + 1] = 1;
      if (T) { uvs[i * 2] = T.getX(i); uvs[i * 2 + 1] = T.getY(i); }
      if (col) { col[i * 3] = C.getX(i); col[i * 3 + 1] = C.getY(i); col[i * 3 + 2] = C.getZ(i); }
    }
    let idx; if (g.index) idx = Uint32Array.from(g.index.array); else { idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; }
    return { mat: mesh.material.name || 'unnamed', pos, nrm, uv: uvs, col, idx, n };
  }
  function registerMaterial(m) {       // remember the glTF material's maps once per name
    const name = m.name || 'unnamed'; if (K_.defs[name]) return;
    const orm = m.roughnessMap || m.metalnessMap || null;
    K_.defs[name] = {
      name, map: m.map || null, normalMap: m.normalMap || null, orm, aoInOrm: !!m.aoMap || (!!orm && /ORM|_arm|_orm/i.test(orm.name || '')),
      color: m.color ? [m.color.r, m.color.g, m.color.b] : [1, 1, 1], rough: m.roughness === undefined ? 1 : m.roughness, metal: m.metalness || 0,
      alphaTest: m.alphaTest || 0, blend: !!m.transparent, opacity: m.transparent && m.opacity < 1 ? m.opacity : 1, doubleSided: m.side === THREE.DoubleSide,
      emissive: m.emissive ? [m.emissive.r * (m.emissiveIntensity || 1), m.emissive.g * (m.emissiveIntensity || 1), m.emissive.b * (m.emissiveIntensity || 1)] : [0, 0, 0], emissiveMap: m.emissiveMap || null,
      uvScale: [1, 1], gain: 1, nScale: 1,
    };
    for (const t of [m.map, m.normalMap, orm, m.emissiveMap]) if (t) { t.anisotropy = 4; }
  }
  async function loadPack(pack, progress) {
    const loader = new T3X.GLTFLoader();
    let gltf;
    try { gltf = await loader.loadAsync(pack.glb, e => { if (progress && e.total) progress(e.loaded / e.total); }); }
    catch (e) { if (pack.optional) return false; throw new Error('kit ' + pack.glb + ': ' + (e && e.message || e)); }
    if (pack.catalog) { const c = await fetchJson(pack.catalog, pack.optional); if (c) Object.assign(K_.cat, c.pieces || c); }
    gltf.scene.updateMatrixWorld(true);
    for (const node of gltf.scene.children) {
      const prims = []; node.traverse(o => { if (o.isMesh) { registerMaterial(o.material); prims.push(extract(o)); } });
      if (!prims.length) continue;
      const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
      for (const p of prims) for (let i = 0; i < p.pos.length; i++) { const k = i % 3, v = p.pos[i]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
      K_.pieces[node.name] = { name: node.name, prims, min, max, pack: pack.glb };
    }
    return true;
  }
  const texLoad = url => new Promise((res, rej) => new THREE.TextureLoader().load(url, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = 4; res(t); }, undefined, () => rej(new Error('texture ' + url))));
  // the realistic skin: scanned or re-worked texture sets that replace the kit's painted ones, material by material (kits/skin/SKIN.json)
  async function loadSkin() {
    const S = await fetchJson('kits/skin/SKIN.json', true); if (!S) { K_.skin = 'painted'; return; }
    K_.skinDef = S;
    if (S.grade) Object.assign(K_.gradeInit, S.grade);
    const jobs = [];
    for (const name of Object.keys(S.materials || {})) {
      const s = S.materials[name], d = K_.defs[name]; if (!d) continue;
      if (s.gain !== undefined) d.gain = s.gain; if (s.sat !== undefined) d.sat = s.sat; if (s.uvScale) d.uvScale = s.uvScale; if (s.nScale !== undefined) d.nScale = s.nScale; if (s.rough !== undefined) d.roughMul = s.rough;
      if (s.a) jobs.push(texLoad('kits/skin/' + s.a).then(t => { t.colorSpace = THREE.SRGBColorSpace; d.map = t; }));
      if (s.n) jobs.push(texLoad('kits/skin/' + s.n).then(t => { t.colorSpace = THREE.NoColorSpace; d.normalMap = t; }));
      if (s.orm) jobs.push(texLoad('kits/skin/' + s.orm).then(t => { t.colorSpace = THREE.NoColorSpace; d.orm = t; d.aoInOrm = s.ao !== false; }));
    }
    await Promise.all(jobs);
  }
  K_.gradeInit = { sat: 1, gain: 1, tint: [1, 1, 1], weather: 0 };
  // opts: { packs: [{ glb, catalog, optional }], skin: 'realistic' | 'painted' }
  K_.load = async function (progress, opts) {
    opts = opts || {};
    const packs = opts.packs || K_.PACKS; K_.skin = opts.skin || (TEST && TEST.skin) || 'realistic';
    for (let i = 0; i < packs.length; i++) await loadPack(packs[i], f => progress && progress((i + f) / (packs.length + 1)));
    if (K_.skin === 'realistic') await loadSkin();
    const g = K_.gradeInit;
    K_.grade = { sat: uniform(g.sat), gain: uniform(g.gain), tint: uniform(new THREE.Vector3(g.tint[0], g.tint[1], g.tint[2])), weather: uniform(g.weather || 0) };
    if (K_.skin !== 'realistic') { K_.grade.sat.value = 1; K_.grade.gain.value = 1; K_.grade.tint.value.set(1, 1, 1); K_.grade.weather.value = 0; }
    K_.ready = true; if (progress) progress(1);
  };
  // one knob set for the whole kit look: saturation, brightness, a colour cast, and weathering (large soft stains so no two walls match)
  K_.setGrade = function (o) { const G_ = K_.grade; if (o.weather !== undefined) G_.weather.value = o.weather; if (o.sat !== undefined) G_.sat.value = o.sat; if (o.gain !== undefined) G_.gain.value = o.gain; if (o.tint) G_.tint.value.set(o.tint[0], o.tint[1], o.tint[2]); };

  K_.info = name => { const p = K_.pieces[name]; if (!p) return null; return Object.assign({ name, min: p.min, max: p.max, size: [p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]] }, K_.cat[name] || {}); };
  K_.names = filter => Object.keys(K_.pieces).filter(n => !filter || filter(K_.info(n))).sort();
  // local positions of the light sources on a piece (candle tips, lantern, torch head), from the catalogue
  K_.lights = name => ((K_.cat[name] || {}).lights || []).map(p => p.slice());

  // position / rotation / scale shorthand -> Matrix4. Accepts a Matrix4, a column-major array of 16, or { p:[x,y,z], ry, r:[rx,ry,rz], s }
  function toMatrix(x, out) {
    out = out || new THREE.Matrix4();
    if (!x) return out.identity();
    if (x.isMatrix4) return out.copy(x);
    if (x.length === 16) return out.fromArray(x);
    const p = x.p || x.pos || [0, 0, 0], s = x.s === undefined ? 1 : x.s, sv = typeof s === 'number' ? [s, s, s] : s;
    const e = new THREE.Euler(x.r ? x.r[0] : 0, x.r ? x.r[1] : (x.ry || 0), x.r ? x.r[2] : 0, 'YXZ');
    return out.compose(new THREE.Vector3(p[0], p[1], p[2]), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(sv[0], sv[1], sv[2]));
  }
  K_.matrix = toMatrix;
  // world-space box of a placed piece: { min:[x,y,z], max:[x,y,z] }
  K_.box = function (name, xf) {
    const p = K_.pieces[name]; if (!p) return null;
    const M = toMatrix(xf, _m), min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
    for (let i = 0; i < 8; i++) { _v.set(i & 1 ? p.max[0] : p.min[0], i & 2 ? p.max[1] : p.min[1], i & 4 ? p.max[2] : p.min[2]).applyMatrix4(M); min[0] = Math.min(min[0], _v.x); min[1] = Math.min(min[1], _v.y); min[2] = Math.min(min[2], _v.z); max[0] = Math.max(max[0], _v.x); max[1] = Math.max(max[1], _v.y); max[2] = Math.max(max[2], _v.z); }
    return { min, max };
  };

  // ── materials ──
  const isFoliage = d => d.alphaTest > 0 || /leaf|leaves|grass|flower|vine|fern|plant|clover/i.test(d.name);
  const isGlass = d => /glass/i.test(d.name);
  const gradeFn = c => {
    const G_ = K_.grade, l = dot(c, vec3(0.2126, 0.7152, 0.0722)), wp = positionWorld;
    const st = texture(G.noiseTex, vec2(wp.x.add(wp.z.mul(0.7)).mul(0.11), wp.y.mul(0.16).add(wp.z.mul(0.05)))), stain = st.r.mul(0.65).add(st.g.mul(0.35)).sub(0.5).mul(1.5);
    return mix(vec3(l), c, G_.sat).mul(G_.tint).mul(G_.gain).mul(stain.mul(G_.weather).add(1).clamp(0.55, 1.25));
  };
  // mode 'batch': per-vertex kc (rgb tint, a sky visibility) and kz (x zone / 255, y emissive strength / 16 * 255 ...). mode 'inst': InstancedMesh, outdoors.
  function material(name, mode, o) {
    o = o || {};
    const key = name + '|' + mode + '|' + (o.wind ? 'w' : '') + (o.zone || 0) + (o.skyVis === undefined ? '' : o.skyVis);
    let m = K_.mats.get(key); if (m) return m;
    const d = K_.defs[name] || { name, color: [1, 1, 1], uvScale: [1, 1], gain: 1, rough: 1, metal: 0, alphaTest: 0, emissive: [0, 0, 0], nScale: 1 }, U = SH.U;
    m = new THREE.MeshStandardNodeMaterial(); m.name = key;
    const uvn = (d.uvScale[0] !== 1 || d.uvScale[1] !== 1) ? uv().mul(vec2(d.uvScale[0], d.uvScale[1])) : uv();
    const batch = mode === 'batch';
    const kc = batch ? attribute('kc', 'vec4') : null, kz = batch ? attribute('kz', 'vec4') : null;
    const tint = batch ? kc.rgb : (o.hasColor ? attribute('color', 'vec3') : vec3(1)).mul(o.hasTint ? attribute('itint', 'vec3') : vec3(1));
    // wall modules are often a single sheet seen from both sides: its back face is the room side. Such pieces carry a second zone and
    // sky visibility (kz.z, kz.w) that the back face uses; pieces without that have both pairs equal.
    const inside = batch ? frontFacing.not().and(abs(kz.z.sub(kz.x)).greaterThan(0.002)) : null;
    const skyVis = batch ? select(inside, kz.w, kc.a) : float(o.skyVis === undefined ? 1 : o.skyVis), zone = batch ? select(inside, kz.z, kz.x).mul(255).round() : float(o.zone || 0);
    const glow = batch ? kz.y.mul(255 / 16) : float(0);          // extra self-illumination in HDR units (candle wax near the flame, embers)
    const N = normalWorld, wp = positionWorld;
    if (isGlass(d)) {         // window panes: dark by day with a little sky in them, lit from inside after dusk (each pane a slightly different warmth)
      const cell = floor(wp.mul(0.9)), h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));
      const V = normalize(wp.sub(U.camPos)), R = reflect(V, N);
      const sky = SH.skyBase(vec3(R.x, max(R.y, 0.02), R.z)).mul(0.22);
      const lit = vec3(1.0, 0.60, 0.24).mul(h.mul(0.9).add(0.35)).mul(U.windowGlow).mul(2.4).mul(smoothstep(0.12, 0.3, h));
      m.colorNode = vec3(0.012, 0.016, 0.02); m.roughnessNode = float(0.15); m.metalnessNode = float(0);
      // from the room side a pane just shows the dim sky outside
      const outsideView = batch ? frontFacing : frontFacing;
      m.emissiveNode = select(outsideView, sky.add(lit), SH.skyBase(vec3(V.x, max(V.y, 0.03), V.z)).mul(0.55)).add(vec3(0.02, 0.025, 0.03).mul(SH.hemi(N, float(1), float(0))));
      m.side = THREE.DoubleSide;
      K_.mats.set(key, m); return m;
    }
    const base = d.map ? texture(d.map, uvn) : vec4(1);
    const orm = d.orm ? texture(d.orm, uvn) : null;
    const metal = orm ? orm.b : float(d.metal || 0);
    // no reflection probes here, so metal keeps a darkened diffuse instead of going black, and gets its shine from a lower roughness
    const raw = base.rgb.mul(vec3(d.color[0] * d.gain, d.color[1] * d.gain, d.color[2] * d.gain)).mul(tint);
    const alb = gradeFn(d.sat === undefined ? raw : mix(vec3(dot(raw, vec3(0.2126, 0.7152, 0.0722))), raw, d.sat)).mul(metal.mul(0.45).oneMinus()).toVar('kitAlbedo');
    const ao = (orm && d.aoInOrm) ? orm.r : float(1);
    m.colorNode = vec4(alb, d.opacity < 1 ? base.a.mul(d.opacity) : base.a);
    if (d.normalMap) m.normalNode = normalMap(texture(d.normalMap, uvn), vec2(d.nScale, d.nScale));
    m.roughnessNode = orm ? orm.g.mul(d.roughMul === undefined ? 1 : d.roughMul).clamp(0.08, 1) : float(d.rough);
    m.metalnessNode = float(0);
    let em = alb.mul(SH.hemi(N, skyVis.mul(ao), zone).add(SH.pointLights(wp, N, zone, 0.25).mul(ao.mul(0.4).add(0.6))));
    em = em.add(alb.mul(glow));
    if (d.emissiveMap) em = em.add(texture(d.emissiveMap, uvn).rgb.mul(vec3(d.emissive[0], d.emissive[1], d.emissive[2])));
    else if (d.emissive[0] + d.emissive[1] + d.emissive[2] > 0) em = em.add(vec3(d.emissive[0], d.emissive[1], d.emissive[2]));
    m.emissiveNode = em;
    if (batch) m.receivedShadowNode = Fn(([shadow]) => shadow.mul(select(inside, float(0), float(1))));      // the sheet would not shadow its own back face
    if (d.alphaTest > 0) { m.alphaTest = Math.max(d.alphaTest, 0.35); m.side = THREE.DoubleSide; }
    else m.side = d.doubleSided && !o.frontOnly ? THREE.DoubleSide : THREE.FrontSide;
    if (d.blend && !(d.alphaTest > 0)) { m.transparent = true; m.depthWrite = false; }
    if (o.wind) {             // trees lean with the gusts, leaves and grass flutter on top; the root stays planted
      m.positionNode = Fn(() => {
        const p = positionLocal, h = max(positionGeometry.y, 0), t = U.wind.w, ph = p.x.mul(0.31).add(p.z.mul(0.27));
        const lean = h.mul(h).mul(0.0016).mul(sin(t.mul(0.9).add(ph.mul(0.35))).mul(0.6).add(0.55));
        const flut = sin(t.mul(3.1).add(ph.mul(4.0)).add(h.mul(1.7))).mul(isFoliage(d) ? 0.035 : 0).mul(smoothstep(0.0, 1.2, h));
        const k = lean.add(flut).mul(U.wind.z);
        return vec3(p.x.add(U.wind.x.mul(k)), p.y, p.z.add(U.wind.y.mul(k)));
      })();
    }
    K_.mats.set(key, m); return m;
  }
  K_.material = material;

  // ── batches ──
  K_.batch = function (opts) {
    opts = opts || {};
    const cell = opts.cell || 24, buckets = new Map(), inst = [], B = { count: 0 };
    // o: { zone: 0 outdoors | n the interior of building n, skyVis: 1 outdoors .. ~0.3 indoors, tint: [r,g,b] linear, cast: true, glow: HDR self-illumination,
    //      lit: 0..1 for light-source pieces: the wax around each flame position glows (the flame itself is a particle the game adds),
    //      inZone, inSkyVis: for wall, gable and roof pieces (outside face = local +z or up): the room side gets this zone / sky visibility instead }
    B.add = function (name, xf, o) {
      const p = K_.pieces[name]; if (!p) { console.warn('Kit: unknown piece ' + name); return B; }
      o = o || {};
      const M = toMatrix(xf);
      _v.set((p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2).applyMatrix4(M);
      const ck = Math.floor(_v.x / cell) + ',' + Math.floor(_v.z / cell), cast = o.cast === false ? 0 : 1;
      for (const prim of p.prims) {
        const key = prim.mat + '|' + ck + '|' + cast; let b = buckets.get(key);
        if (!b) buckets.set(key, b = { mat: prim.mat, cast, items: [], nv: 0, ni: 0 });
        b.items.push({ prim, M, zone: o.zone || 0, skyVis: o.skyVis === undefined ? 1 : o.skyVis, tint: o.tint || null, glow: o.glow || 0, lit: o.lit || 0, lights: o.lit ? ((K_.cat[name] || {}).lights || null) : null, inZone: o.inZone, inSky: o.inSkyVis === undefined ? 0.3 : o.inSkyVis }); b.nv += prim.n; b.ni += prim.idx.length;
      }
      B.count++; return B;
    };
    // many copies of one piece (trees, rocks, tufts). matrices: array of Matrix4 / shorthand. o: { tints: [[r,g,b]...], wind, cast, cell, maxDist, zone, skyVis }
    B.addInstanced = function (name, matrices, o) {
      const p = K_.pieces[name]; if (!p) { console.warn('Kit: unknown piece ' + name); return B; }
      inst.push({ p, matrices: matrices.map(x => toMatrix(x)), o: o || {} }); return B;
    };
    B.build = function () {
      const group = new THREE.Group(); group.name = opts.name || 'kit-batch'; group.matrixAutoUpdate = false;
      const nm = new THREE.Matrix3(), v = new THREE.Vector3();
      for (const b of buckets.values()) {
        const pos = new Float32Array(b.nv * 3), nrm = new Int8Array(b.nv * 4), uvs = new Float32Array(b.nv * 2), kc = new Uint8Array(b.nv * 4), kz = new Uint8Array(b.nv * 4);
        const idx = b.nv > 65535 ? new Uint32Array(b.ni) : new Uint16Array(b.ni); let vo = 0, io = 0;
        for (const it of b.items) {
          const pr = it.prim, M = it.M, flip = M.determinant() < 0; nm.getNormalMatrix(M);
          const sky = Math.round(Math.min(Math.max(it.skyVis, 0), 1) * 255), skyIn = Math.round(Math.min(Math.max(it.inSky, 0), 1) * 255), split = it.inZone !== undefined, tr = it.tint ? it.tint[0] : 1, tg = it.tint ? it.tint[1] : 1, tb = it.tint ? it.tint[2] : 1, gl = Math.min(255, Math.round(it.glow * 16));
          for (let i = 0; i < pr.n; i++) {
            const o = vo + i;
            v.set(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2]).applyMatrix4(M); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
            v.set(pr.nrm[i * 3], pr.nrm[i * 3 + 1], pr.nrm[i * 3 + 2]).applyMatrix3(nm).normalize(); nrm[o * 4] = Math.round(v.x * 127); nrm[o * 4 + 1] = Math.round(v.y * 127); nrm[o * 4 + 2] = Math.round(v.z * 127);
            uvs[o * 2] = pr.uv[i * 2]; uvs[o * 2 + 1] = pr.uv[i * 2 + 1];
            const c = pr.col;
            kc[o * 4] = Math.min(255, Math.round((c ? c[i * 3] : 1) * tr * 255)); kc[o * 4 + 1] = Math.min(255, Math.round((c ? c[i * 3 + 1] : 1) * tg * 255)); kc[o * 4 + 2] = Math.min(255, Math.round((c ? c[i * 3 + 2] : 1) * tb * 255));
            // faces modelled toward the room (inner plaster, the ceiling beam, reveals) are indoors outright; single sheets switch by facing in the shader
            const inside = split && (pr.nrm[i * 3 + 2] < -0.5 || (pr.nrm[i * 3 + 2] < 0.5 && pr.pos[i * 3 + 2] < -0.12));
            kc[o * 4 + 3] = inside ? skyIn : sky; kz[o * 4] = inside ? it.inZone : it.zone;
            let g1 = gl;
            if (it.lights) { let best = 9; for (const L of it.lights) { const dx = pr.pos[i * 3] - L[0], dy = pr.pos[i * 3 + 1] - L[1], dz = pr.pos[i * 3 + 2] - L[2]; best = Math.min(best, Math.sqrt(dx * dx + dy * dy * 0.5 + dz * dz)); } g1 = Math.min(255, gl + Math.round(Math.max(0, 1 - best / 0.11) * it.lit * 40)); }
            kz[o * 4 + 1] = g1;
            kz[o * 4 + 2] = split ? it.inZone : it.zone; kz[o * 4 + 3] = split ? skyIn : sky;
          }
          const src = pr.idx;
          if (flip) for (let i = 0; i < src.length; i += 3) { idx[io + i] = src[i] + vo; idx[io + i + 1] = src[i + 2] + vo; idx[io + i + 2] = src[i + 1] + vo; }
          else for (let i = 0; i < src.length; i++) idx[io + i] = src[i] + vo;
          vo += pr.n; io += src.length;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 4, true)); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        g.setAttribute('kc', new THREE.BufferAttribute(kc, 4, true)); g.setAttribute('kz', new THREE.BufferAttribute(kz, 4, true)); g.setIndex(new THREE.BufferAttribute(idx, 1));
        g.computeBoundingBox(); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, material(b.mat, 'batch'));
        mesh.castShadow = !!b.cast && !isGlass(K_.defs[b.mat] || { name: b.mat }); mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = b.mat;
        group.add(mesh);
      }
      for (const it of inst) {
        const o = it.o, cs = o.cell || 48, cells = new Map();
        it.matrices.forEach((M, i) => { const k = Math.floor(M.elements[12] / cs) + ',' + Math.floor(M.elements[14] / cs); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(i); });
        for (const prim of it.p.prims) {
          const d = K_.defs[prim.mat] || { name: prim.mat, alphaTest: 0 };
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(prim.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(prim.nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(prim.uv, 2));
          if (prim.col) g.setAttribute('color', new THREE.BufferAttribute(prim.col, 3));
          g.setIndex(new THREE.BufferAttribute(prim.idx, 1)); g.computeBoundingBox(); g.computeBoundingSphere();
          const wind = o.wind === undefined ? /tree|pine|bush|grass|flower|plant|fern|clover/i.test(it.p.name) : o.wind;
          const mat = material(prim.mat, 'inst', { wind, hasColor: !!prim.col, hasTint: !!o.tints, zone: o.zone, skyVis: o.skyVis });
          for (const list of cells.values()) {
            const gi = new THREE.BufferGeometry();          // shares the vertex buffers; each cell only adds its own instanced attributes
            for (const k of Object.keys(g.attributes)) gi.setAttribute(k, g.attributes[k]); gi.setIndex(g.index); gi.boundingBox = g.boundingBox; gi.boundingSphere = g.boundingSphere;
            const im = new THREE.InstancedMesh(gi, mat, list.length);
            list.forEach((src, j) => im.setMatrixAt(j, it.matrices[src]));
            if (o.tints) { const a = new Float32Array(list.length * 3); list.forEach((src, j) => { const t = o.tints[src] || [1, 1, 1]; a[j * 3] = t[0]; a[j * 3 + 1] = t[1]; a[j * 3 + 2] = t[2]; }); gi.setAttribute('itint', new THREE.InstancedBufferAttribute(a, 3)); }
            im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.computeBoundingBox();
            im.castShadow = o.cast !== false; im.receiveShadow = true; im.matrixAutoUpdate = false; im.name = it.p.name + ':' + prim.mat;
            if (o.maxDist) { im.userData.maxDist = o.maxDist; K_.instanced.push(im); }
            group.add(im);
          }
        }
      }
      return group;
    };
    return B;
  };
  // hides instanced cells that asked for a draw distance (o.maxDist) once the camera is farther than that
  K_.update = function (camPos) {
    for (const im of K_.instanced) { const s = im.boundingSphere, dx = s.center.x - camPos[0], dz = s.center.z - camPos[2]; im.visible = Math.sqrt(dx * dx + dz * dz) - s.radius < im.userData.maxDist; }
  };
  return K_;
})();


// ---- 45_sky.js ----
// ───────────────────────── sky dome: gradient, stars, sun and moon, aurora, clouds ─────────────────────────
// A sphere that follows the camera. It is drawn after the opaque world with the depth test on, so only uncovered pixels pay for it.
// Weather: Sky.setWeather(cover, mist), both 0..1. cover thickens the cloud layer up to a full overcast; mist fills the valley with fog.
// The render loop must call Sky.applyWeather(env) right after updateEnv() and before SH.update(), so that the sun, ambient light,
// fog and cloud cover every material sees agree with the sky. With both at 0 nothing changes.
const Sky = { mesh: null, radius: 10000, weather: { cover: 0, mist: 0 } };
(() => {
  Sky.build = function (scene) {
    const { Fn, If, float, vec2, vec3, uniform, positionLocal, mix, smoothstep, max, pow, sin, dot, normalize, length, floor, fract, abs } = TSL;
    const uCover = Sky.uCover = uniform(0), uMist = Sky.uMist = uniform(0);
    const U = SH.U, sat = SH.sat, noiseL = SH.noiseL;
    const h31 = (p, k) => fract(sin(dot(p, k)).mul(43758.5453));
    const m = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false });
    m.fog = false; m.toneMapped = false;
    m.colorNode = Fn(() => {
      const dir = normalize(positionLocal).toVar();
      const c = SH.skyBase(dir).toVar();
      const t = U.time;
      // stars
      If(U.stars.greaterThan(0.01).and(dir.y.greaterThan(-0.05)), () => {
        const sp = dir.mul(260), cell = floor(sp), f = fract(sp).sub(0.5);
        const rnd = h31(cell, vec3(127.1, 311.7, 74.7));
        If(rnd.greaterThan(0.955), () => {
          const off = vec3(h31(cell, vec3(269.5, 183.3, 246.1)), h31(cell, vec3(113.5, 271.9, 124.6)), h31(cell, vec3(71.3, 157.7, 311.3))).sub(0.5);
          const dd = length(f.sub(off.mul(0.6)));
          const tw = sin(t.mul(rnd.mul(40).add(2)).add(rnd.mul(100))).mul(0.25).add(0.75);
          const warm = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.88, 0.7), h31(cell, vec3(12.9, 78.2, 37.7)));
          c.addAssign(warm.mul(smoothstep(0.0, 0.16, dd).oneMinus().mul(rnd.sub(0.955)).mul(40).mul(tw).mul(U.stars).mul(smoothstep(-0.05, 0.25, dir.y))));
        });
      });
      // sun and moon discs
      const sd = dot(dir, U.sunDisc);
      c.addAssign(U.fogSun.mul(smoothstep(0.99985, 0.99995, sd).mul(U.sunDiscI)));
      const md = dot(dir, U.moonDir);
      If(md.greaterThan(0.9993), () => {
        const mr = sat(md.sub(0.9993).div(0.0007));
        const crater = noiseL(dir.xy.mul(300 * 0.02)).g;
        c.addAssign(vec3(0.78, 0.84, 1.0).mul(smoothstep(0.0, 0.25, mr).mul(crater.mul(0.6).add(0.55)).mul(U.moonBright)));
      });
      c.addAssign(vec3(0.3, 0.4, 0.6).mul(pow(max(md, 0), 300).mul(0.25).mul(U.moonBright)));
      // aurora over the northern peaks
      If(U.aurora.greaterThan(0.01).and(dir.y.greaterThan(0.04)), () => {
        const q = dir.xz.div(dir.y.add(0.32));
        const n = noiseL(vec2(q.x.mul(0.10).add(t.mul(0.003)), q.y.mul(0.03).add(t.mul(0.001)))).r;
        const curtain = pow(sat(abs(n.sub(0.5)).mul(6.5).oneMinus()), 2);
        const rays = noiseL(vec2(q.x.mul(1.9).add(q.y.mul(0.4)), t.mul(0.015))).a;
        const hgt = smoothstep(0.04, 0.3, dir.y).mul(smoothstep(0.45, 0.98, dir.y).oneMinus()).mul(smoothstep(-0.35, 0.45, dir.z.negate()));
        const ac = mix(vec3(0.08, 1.0, 0.42), vec3(0.55, 0.18, 0.95), smoothstep(0.28, 0.8, dir.y.add(rays.mul(0.2))));
        c.addAssign(ac.mul(curtain.mul(rays.mul(1.1).add(0.35)).mul(hgt).mul(U.aurora).mul(0.5)));
      });
      // clouds: one flat layer high above, lit from the sun side
      If(dir.y.greaterThan(0.012), () => {
        const pc = U.camPos.xz.add(dir.xz.mul(float(K.cloudH).sub(U.camPos.y).div(dir.y)));
        const dens = SH.cloudDensity(pc).toVar();
        If(dens.greaterThan(0.003), () => {
          const det = noiseL(pc.mul(0.0031).add(vec2(t.mul(0.004), 0))).a;
          dens.assign(sat(dens.mul(det.mul(0.6).add(0.72))));
          const toward = SH.cloudDensity(pc.add(U.sunDisc.xz.mul(260)));
          const lit = sat(float(1.15).sub(toward.mul(1.1)));
          const sunlit = U.sunCol.mul(0.5).add(U.ambSky).add(U.fogSun.mul(pow(max(sd, 0), 4).mul(0.5)));
          const dark = U.ambSky.mul(0.55).add(U.horizon.mul(0.25));
          const cc = mix(dark, sunlit, lit.mul(dens.oneMinus().mul(0.45).add(0.55))).toVar();
          // overcast: no sunlit tops, just a mottled grey ceiling that is a little brighter where it is thin
          const lid = U.ambSky.mul(0.80).add(U.horizon.mul(0.42)).mul(noiseL(pc.mul(0.00035)).g.mul(0.75).add(noiseL(pc.mul(0.0011).add(vec2(t.mul(0.002), 0.3))).b.mul(0.35)).add(0.47));
          cc.assign(mix(cc, lid, uCover.mul(0.9)));
          const fade = smoothstep(0.012, 0.20, dir.y);
          c.assign(mix(c, mix(U.horizon, cc, fade), dens.mul(fade).mul(0.94)));
        });
      });
      // mist: the horizon dissolves into the fog colour, and a little of it veils the whole sky
      c.assign(mix(c, U.fogCol, uMist.mul(smoothstep(0.02, 0.42, dir.y).oneMinus().mul(0.8).add(0.2))));
      return c;
    })();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), m);
    mesh.scale.setScalar(Sky.radius); mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false;
    mesh.renderOrder = 1000;          // last among the opaque draws
    mesh.name = 'sky';
    scene.add(mesh); Sky.mesh = mesh;
    return mesh;
  };
  Sky.update = function (camPos) {
    if (!Sky.mesh) return;
    Sky.mesh.position.set(camPos[0], camPos[1], camPos[2]); Sky.mesh.updateMatrixWorld();
    const w = Sky.weather; Sky.uCover.value = w.cover; Sky.uMist.value = w.mist;
    SH.U.fogFall.value = 0.011 + 0.014 * w.mist;          // mist hugs the valley floor
  };
  Sky.setWeather = function (cover, mist) { Sky.weather.cover = sat(cover || 0); Sky.weather.mist = sat(mist || 0); };
  // Adjusts a freshly computed ENV (50_env.js) in place for the current weather.
  Sky.applyWeather = function (env) {
    const c = Sky.weather.cover, m = Sky.weather.mist;
    if (c <= 0 && m <= 0) return env;
    const lum = a => 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2], grey = (g, t) => [g * (1 - 0.04 * t), g, g * (1 + 0.07 * t)];
    const sunL = lum(env.keyCol);
    // thick cloud takes most of the direct light and nearly all of the shadow contrast, and hands part of it back as flat sky light
    env.keyCol = v3.scale(env.keyCol, 1 - 0.90 * c); env.shadowStrength *= 1 - 0.85 * c;
    env.ambSky = mix3(env.ambSky, grey(lum(env.ambSky) * 1.05 + sunL * 0.085, 1), c);
    env.ambGnd = mix3(env.ambGnd, grey(lum(env.ambGnd) * 0.9 + sunL * 0.02, -1), c * 0.7);
    const sk = lum(mix3(env.zenith, env.horizon, 0.55));
    env.zenith = mix3(env.zenith, grey(sk * 0.62, 1), c); env.horizon = mix3(env.horizon, grey(sk * 0.95, 0.6), c);
    env.fogSun = v3.scale(env.fogSun, (1 - 0.92 * c) * (1 - 0.5 * m)); env.sunDisc *= (1 - c) * (1 - c) * (1 - 0.7 * m);
    env.stars *= (1 - c) * (1 - 0.6 * m); env.aurora *= (1 - c) * (1 - 0.5 * m); env.moonBright *= (1 - 0.9 * c) * (1 - 0.5 * m);
    env.cloud = lerp(env.cloud, 1.25, c);
    // mist: much denser air, its colour a pale grey lit by whatever light is left
    const k = Math.max(c * 0.6, m);
    env.fogCol = mix3(env.fogCol, grey(lum(env.fogCol) * (1 + 0.15 * m), 0.7), k * 0.8);
    env.fogDensity = env.fogDensity * (1 + 0.8 * c + 5 * m) + 0.0055 * m * m;
    return env;
  };
})();


// ---- 46_grass.js ----
// ───────────────────────── grass: a sliding window of tufts placed entirely in the vertex shader ─────────────────────────
// The window is a square of N x N cells (K.grassCell apart) that sits ahead of the camera. Instance i is cell (i mod N, i / N)
// of that window; everything about a tuft comes from a hash of its absolute cell, so tufts stay put while the window slides.
// A tuft is 3 to 5 blades (more on the higher detail tiers). Height and colour vary blade by blade, tuft by tuft and in broad
// patches; drifts of tufts carry a tall pale seed stalk; gusts lay the blades over and catch the light as they pass.
const Grass = { mesh: null, N: 0, range: 0 };
(() => {
  const WINDOW = 1.4, AHEAD = 0.45;        // window side and forward shift, in units of the grass range
  Grass.build = function (scene, quality) {
    Grass.dispose();
    const range = (quality && quality.grassRange) || 0;
    if (!(range > 0)) return null;
    const { Fn, If, float, vec2, vec3, ivec2, uniform, attribute, texture, textureLoad, varyingProperty, instanceIndex, mix, smoothstep, step, max, min, sin, cos, sqrt, floor, abs, fract, length, distance, normalize, transformNormalToView } = TSL;
    const U = SH.U, sat = SH.sat, noiseL = SH.noiseL;
    if (!G.hashTex) {       // white noise: four independent random bytes per cell
      const rnd = rng(9173), d = new Uint8Array(256 * 256 * 4); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 256) | 0;
      const t = new THREE.DataTexture(d, 256, 256, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; G.hashTex = t;
    }
    const N = Math.max(8, Math.round(range * WINDOW / K.grassCell)), cellSz = K.grassCell, TH = K.terrainHalf, HN = K.heightN;
    const uOrg = uniform(new THREE.Vector2());
    const blades = range <= 32 ? 3 : 4;      // kept modest: every blade vertex samples several textures, and phones run the middle tier
    U.grassRange.value = range;
    const vCol = varyingProperty('vec3', 'vGrassCol'), vEm = varyingProperty('vec3', 'vGrassEm');
    const m = new THREE.MeshLambertNodeMaterial({ side: THREE.DoubleSide });
    const b = attribute('b', 'vec4');         // side (-1, 0, 1), height along the blade (0..1), blade angle, radial offset
    m.positionNode = Fn(() => {
      const fi = float(instanceIndex), iz = floor(fi.add(0.5).div(N)), ix = fi.sub(iz.mul(N));
      const cell = uOrg.add(vec2(ix, iz));
      const r0 = textureLoad(G.hashTex, ivec2(cell.add(65536.5).mod(256)));
      const root2 = cell.add(r0.xy).mul(cellSz);
      const out = vec3(0, -10000, 0).toVar();
      vCol.assign(vec3(0)); vEm.assign(vec3(0));
      const lim = U.grassRange.mul(r0.z.mul(0.72).add(0.28));
      const inside = abs(root2.x).lessThan(TH - 0.5).and(abs(root2.y).lessThan(TH - 0.5));
      If(inside.and(distance(root2, U.camPos.xz).lessThan(lim)), () => {
        const r1 = textureLoad(G.hashTex, ivec2(cell.add(vec2(65536.5 + 97, 65536.5 + 41)).mod(256)));
        const hy = texture(G.heightTex, root2.add(TH).div(2 * TH).mul((HN - 1) / HN).add(0.5 / HN)).level(0).r;
        const suv = root2.div(2 * TH).add(0.5);
        const sp = texture(G.splatTex, suv).level(0), s2 = texture(G.splat2Tex, suv).level(0);   // r road, g cobbles, b field, a bare | r under trees, g wet, b contact, a worn
        const mn = noiseL(root2.mul(0.0041)), mn2 = noiseL(root2.mul(0.037));
        const root = vec3(root2.x, hy, root2.y);
        const dcam = distance(root, U.camPos);
        const field = step(0.5, sp.b);
        const bare = max(max(sp.r, sp.g), sp.a);
        const s = smoothstep(lim.mul(0.72), lim, dcam).oneMinus().mul(step(bare, r0.w.mul(0.25).add(0.22))).mul(step(U.lakeY.add(0.05), hy)).toVar();
        s.mulAssign(step(r1.z, mn2.a.mul(0.9).add(0.35).add(field)));                 // natural bald patches
        s.mulAssign(step(r1.w.mul(0.999), float(1).sub(s2.r.mul(0.72)).sub(s2.a.mul(1.4))));               // thin under trees and where the turf is worn
        If(s.greaterThan(0.001), () => {
          // one tuft in a drift (clumped by noise) sends up a seed stalk: its first blade grows tall, thin and straw-coloured
          const seedy = step(0.80, r0.w).mul(smoothstep(0.50, 0.62, mn2.g)).mul(field.oneMinus()).mul(step(b.w, 0.31));
          const hb = fract(b.z.mul(0.731).add(r1.x.mul(3.1)));                                               // differs blade by blade
          const height = mix(0.20, 0.46, r1.x).mul(mn2.r.mul(0.8).add(0.65)).mul(s2.a.mul(0.45).oneMinus())
            .mul(mix(0.62, 1.18, hb)).mul(mn.g.mul(1.1).add(0.50)).toVar();                                   // and in broad patches of long and short grass
          height.assign(mix(height, height.mul(1.5).add(r1.y.mul(0.22)).add(0.22), seedy));
          height.assign(mix(height, r1.x.mul(0.2).add(0.80), field));
          const t = b.y, ang = b.z.add(r1.y.mul(6.2831853)), dirv = vec2(cos(ang), sin(ang));
          const p0 = vec3(root.x.add(dirv.x.mul(b.w).mul(0.08)), root.y, root.z.add(dirv.y.mul(b.w).mul(0.08)));
          // wind: slow gusts drifting across the meadow plus a quick shiver; `wave` is kept for the colour
          const wv = noiseL(root2.mul(0.013).sub(U.wind.xy.mul(U.time.mul(0.035)))).r.sub(0.42);
          const gust = wv.mul(2.2).add(sin(U.time.mul(2.6).add(root2.x.mul(0.9)).add(root2.y.mul(1.3))).mul(0.18));
          const toP = root2.sub(U.camPos.xz), dP = length(toP);
          const pushAmt = smoothstep(0.25, 1.0, dP).oneMinus().mul(step(abs(U.camPos.y.sub(1.6).sub(hy)), 1.2));      // blades part around the player
          const bend0 = dirv.mul(mix(0.32, 0.06, field)).add(U.wind.xy.mul(gust.mul(U.wind.z).mul(0.55))).add(toP.div(max(dP, 0.05)).mul(pushAmt).mul(0.9));
          const bl0 = length(bend0), bend = bend0.mul(float(0.95).div(max(bl0, 0.95))), bl = min(bl0, 0.95);
          const tt = t.mul(t), wide = dcam.mul(0.0011).add(0.016).mul(mix(1.0, 0.7, field)).mul(mix(1.0, 0.55, seedy));
          out.assign(vec3(
            p0.x.add(bend.x.mul(tt).mul(height)).sub(dirv.y.mul(b.x).mul(wide).mul(s)),
            p0.y.add(t.mul(height).mul(s).mul(sqrt(float(1).sub(bl.mul(bl).mul(t))))),
            p0.z.add(bend.y.mul(tt).mul(height)).add(dirv.x.mul(b.x).mul(wide).mul(s))));
          // colour matches the terrain tint below it
          const base = vec3(0.062, 0.090, 0.026).mul(SH.groundTint(mn, mn2)).mul(mix(1.0, 0.72, s2.r)).toVar();
          base.mulAssign(mix(vec3(0.90, 1.05, 0.84), vec3(1.14, 0.98, 0.78), r1.z));                           // fresh green to yellowing, tuft by tuft
          base.assign(mix(base, vec3(0.16, 0.145, 0.045), smoothstep(0.75, 1.0, r1.w).mul(0.6)));
          const sheen = sat(wv.mul(2.4)).mul(U.wind.z).mul(0.30).add(1);                                      // a passing gust shows as a paler band
          const tip = base.mul(vec3(1.32, 1.30, 1.05)).mul(sheen).toVar();
          tip.assign(mix(tip, vec3(0.40, 0.33, 0.15).mul(mn2.r.mul(0.5).add(0.75)), seedy));
          base.assign(mix(base, vec3(0.30, 0.21, 0.06), field)); tip.assign(mix(tip, vec3(0.72, 0.52, 0.17), field));
          const flower = step(float(1 - 0.006).sub(smoothstep(0.55, 0.80, mn2.b).mul(0.05)), r0.w).mul(field.oneMinus()).mul(step(0.5, t)).mul(0.85);
          const fc = mix(mix(vec3(0.95, 0.9, 0.85), vec3(0.95, 0.75, 0.15), step(0.5, r1.x)), vec3(0.55, 0.35, 0.85), step(0.75, r1.y));
          const c = mix(mix(base.mul(0.55), tip, t), fc, flower);
          vCol.assign(c);
          const amb = mix(U.ambGnd, U.ambSky, 0.85).mul(mix(0.5, 1.0, t));
          vEm.assign(c.mul(amb.add(SH.pointLights(root.add(vec3(0, 0.2, 0)), vec3(0, 1, 0), float(0), float(0.5)))));
        });
      });
      return out;
    })();
    m.colorNode = vCol;
    m.emissiveNode = vEm;
    m.normalNode = transformNormalToView(normalize(vec3(0, 1, 0).add(U.sunDir.mul(0.6))));     // blades take the sun as the turf does, whichever way they face
    // one triangle per blade
    const gv = [], pv = []; for (let k = 0; k < blades; k++) { const a = k * 2.2 + 0.4, ro = 0.3 + k * 0.35; gv.push(-1, 0, a, ro, 1, 0, a, ro, 0, 1, a, ro); pv.push(-1, 0, 0, 1, 0, 0, 0, 1, 0); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); g.setAttribute('b', new THREE.Float32BufferAttribute(gv, 4));
    g.instanceCount = N * N;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = 'grass';
    scene.add(mesh);
    Object.assign(Grass, { mesh, N, range, uOrg, scene, blades, tufts: N * N, verts: N * N * blades * 3 });
    return mesh;
  };
  Grass.update = function (camPos, fwdXZ) {
    if (!Grass.mesh) return;
    const r = Grass.range, c = K.grassCell, fl = Math.hypot(fwdXZ[0], fwdXZ[1]) || 1;
    const cx = camPos[0] + fwdXZ[0] / fl * r * AHEAD, cz = camPos[2] + fwdXZ[1] / fl * r * AHEAD;
    Grass.uOrg.value.set(Math.floor(cx / c) - (Grass.N >> 1), Math.floor(cz / c) - (Grass.N >> 1));
  };
  Grass.dispose = function () {
    if (!Grass.mesh) return;
    if (Grass.scene) Grass.scene.remove(Grass.mesh);
    Grass.mesh.geometry.dispose(); Grass.mesh.material.dispose(); Grass.mesh = null;
  };
})();


// ---- 47_water.js ----
// ───────────────────────── water surface and lit window panes ─────────────────────────
// Both are used on meshes built by the world code: attributes position, uv, 'tint' (Uint8 x4 normalized) and 'mm' (Uint8 x4 normalized).
let WaterMat, GlowMat;
(() => {
  let water = null, glow = null;
  // River and lake: uv carries the flow direction, tint.a the water depth (0 at the bank .. 1).
  WaterMat = function () {
    if (water) return water;
    const { Fn, float, vec2, vec3, vec4, attribute, texture, uv, positionWorld, mix, smoothstep, max, pow, abs, dot, normalize, reflect } = TSL;
    const U = SH.U, sat = SH.sat;
    const m = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const noise = uvn => texture(G.noiseTex, uvn);
    const res = Fn(() => {
      const t = U.time, wp = positionWorld, p = wp.xz, fd = uv(), depth = attribute('tint', 'vec4').a;
      const n1 = noise(p.mul(0.09).sub(fd.mul(t.mul(0.05)))).rg;
      const n2 = noise(p.mul(0.23).sub(fd.mul(t.mul(0.09))).add(vec2(0.37, 0.11))).ga;
      const n3 = noise(p.mul(0.71).add(vec2(t.mul(0.02), t.mul(-0.017)))).rb;
      const nn = n1.add(n2.mul(0.7)).add(n3.mul(0.35)).sub(1.025);
      const N = normalize(vec3(nn.x.mul(0.55), 1.0, nn.y.mul(0.55)));
      const V = normalize(U.camPos.sub(wp));
      const fres = pow(sat(dot(N, V).oneMinus()), 5).mul(0.975).add(0.025);
      const R0 = reflect(V.negate(), N), R = vec3(R0.x, abs(R0.y), R0.z);
      const refl = SH.skyBase(R).toVar();
      const pc = U.camPos.xz.add(R.xz.mul(float(K.cloudH).div(max(R.y, 0.05))));
      const cl = SH.cloudDensity(pc).mul(smoothstep(0.04, 0.25, R.y));
      refl.assign(mix(refl, U.sunCol.mul(0.45).add(U.ambSky.mul(0.9)), cl.mul(0.8)));
      refl.assign(mix(vec3(0.02, 0.045, 0.03).mul(U.ambSky.mul(2.0).add(U.sunCol.mul(0.3))), refl, smoothstep(0.015, 0.16, R.y)));   // dark far bank
      const spec = U.sunCol.mul(pow(max(dot(R, U.sunDir), 0), 260).mul(7.0));
      const body = vec3(0.03, 0.085, 0.075).mul(U.ambSky.mul(1.2).add(U.sunCol.mul(0.35)));
      const foam = smoothstep(0.0, 0.16, depth).oneMinus().mul(smoothstep(0.35, 0.75, n3.x.add(n1.y.mul(0.6))));
      const col = mix(mix(body, refl, fres).add(spec), U.ambSky.add(U.sunCol.mul(0.6)).mul(0.75), foam.mul(0.6));
      const alpha = max(mix(0.30, 0.94, smoothstep(0.0, 0.7, depth)), fres).mul(smoothstep(0.0, 0.05, depth));
      return vec4(col, max(alpha, foam.mul(0.5)));
    })();
    m.colorNode = res.rgb; m.opacityNode = res.a;
    m.toneMapped = false;
    return (water = m);
  };
  // Window panes after dusk: a leaded lattice, each pane a little different, added on top of the wall. mm.w * 255 / 16 is the strength.
  GlowMat = function () {
    if (glow) return glow;
    const { Fn, vec2, vec3, attribute, uv, positionWorld, smoothstep, min, abs, sin, exp, dot, floor, fract, length } = TSL;
    const U = SH.U;
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    m.fog = false; m.toneMapped = false;
    m.colorNode = Fn(() => {
      const wp = positionWorld, tint = attribute('tint', 'vec4'), strength = attribute('mm', 'vec4').w.mul(255).round().mul(0.0625);
      const q = uv().mul(vec2(4.0, 5.0));
      const lat = min(abs(fract(q.x.add(q.y)).sub(0.5)), abs(fract(q.x.sub(q.y)).sub(0.5)));
      const pane = smoothstep(0.02, 0.08, lat);
      const id = floor(vec2(q.x.add(q.y), q.x.sub(q.y)));
      const hv = fract(sin(dot(id, vec2(127.1, 311.7))).mul(43758.5453));
      const flick = sin(U.time.mul(7.0).add(wp.x.mul(3.0)).add(wp.z.mul(5.0))).mul(0.1).add(0.9);
      const fade = exp(U.fogDens.negate().mul(length(wp.sub(U.camPos))).mul(0.6));
      return tint.rgb.mul(tint.rgb).mul(pane.mul(hv.mul(0.5).add(0.65)).mul(flick).mul(U.windowGlow).mul(strength).mul(fade));
    })();
    return (glow = m);
  };
})();


// ---- 48_particles.js ----
// ───────────────────────── billboards: glows, smoke, flames, embers, fireflies ─────────────────────────
// One instanced quad fed from R.partData (12 floats per particle: x y z size | r g b a | rot kind aspect seed), R.partCount of them.
// kind 0 soft additive glow, 1 smoke puff (alpha), 2 flame tongue (upright), 3 ember / firefly. Output is premultiplied.
const Particles = { mesh: null };
(() => {
  Particles.build = function (scene) {
    if (Particles.mesh) { if (Particles.mesh.parent) Particles.mesh.parent.remove(Particles.mesh); Particles.mesh.geometry.dispose(); Particles.mesh.material.dispose(); Particles.mesh = null; }
    const { Fn, If, float, vec2, vec3, vec4, attribute, texture, positionWorld, cameraWorldMatrix, mix, smoothstep, max, min, pow, abs, sin, cos, exp, dot, normalize, distance, select } = TSL;
    const U = SH.U, sat = SH.sat, noiseL = SH.noiseL;
    if (!R.partData) R.partData = new Float32Array((R.partMax || 1536) * 12);
    const max_ = R.partData.length / 12;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    const ib = new THREE.InstancedInterleavedBuffer(R.partData, 12, 1); ib.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('ps', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('pcol', new THREE.InterleavedBufferAttribute(ib, 4, 4)); g.setAttribute('prm', new THREE.InterleavedBufferAttribute(ib, 4, 8));
    g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const m = new THREE.NodeMaterial();
    m.transparent = true; m.depthWrite = false; m.side = THREE.DoubleSide; m.fog = false; m.lights = false; m.toneMapped = false;
    m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
    const ps = attribute('ps', 'vec4'), pcol = attribute('pcol', 'vec4'), prm = attribute('prm', 'vec4'), corner = attribute('position', 'vec3').xy;
    m.positionNode = Fn(() => {
      const camR = normalize(cameraWorldMatrix.mul(vec4(1, 0, 0, 0)).xyz), camU = normalize(cameraWorldMatrix.mul(vec4(0, 1, 0, 0)).xyz);
      const upright = prm.y.greaterThan(1.5).and(prm.y.lessThan(2.5));          // flames stand up instead of tilting with the view
      const right = select(upright, normalize(vec3(camR.x, 0, camR.z)), camR), up = select(upright, vec3(0, 1, 0), camU);
      const cr = cos(prm.x), sr = sin(prm.x);
      const cc = vec2(corner.x.mul(cr).sub(corner.y.mul(sr)), corner.x.mul(sr).add(corner.y.mul(cr)));
      const wp = ps.xyz.add(right.mul(cc.x).add(up.mul(cc.y.mul(prm.z))).mul(ps.w));
      return wp.add(normalize(U.camPos.sub(ps.xyz)).mul(min(ps.w.mul(0.35), 0.3)));      // pull toward the eye so sprites don't slice into walls (capped: a big glow must not float in front of its fire)
    })();
    m.fragmentNode = Fn(() => {
      const q = corner, wp = positionWorld, r2 = dot(q, q), kind = prm.y, seed = prm.w;
      const n = texture(G.noiseTex, q.mul(0.21).add(vec2(seed.mul(7.3), seed.mul(3.1).sub(U.time.mul(0.05)))));
      const fogf = exp(U.fogDens.negate().mul(distance(wp, U.camPos)).mul(0.5));
      const out = vec4(0).toVar();
      If(kind.lessThan(0.5), () => {                       // soft additive glow
        const a = exp(r2.mul(-4.5)).mul(smoothstep(0.7, 1.0, r2).oneMinus());
        out.assign(vec4(pcol.rgb.mul(a.mul(pcol.a).mul(fogf)), 0));
      }).ElseIf(kind.lessThan(1.5), () => {                // smoke puff, lit by the sky
        const a = sat(r2.oneMinus().mul(n.r.mul(1.3).add(0.35)).sub(0.25)).mul(pcol.a);
        const lit = U.ambSky.mul(1.3).add(U.sunCol.mul(0.35)).mul(pcol.rgb);
        out.assign(vec4(mix(lit, SH.fogColor(), SH.fogAmount()).mul(a), a));
      }).ElseIf(kind.lessThan(2.5), () => {                // flame tongue: a teardrop that sways and is eaten away from the top by rising noise
        const y = q.y.mul(0.5).add(0.5), tm = U.time.mul(1.7).add(seed.mul(31.0));
        const turb = smoothstep(0.06, 0.30, ps.w);          // candles burn steadily, hearth fires lick and tear
        const nA = noiseL(vec2(q.x.mul(0.10).add(seed), y.mul(0.13).sub(tm.mul(0.25)))).g;
        const nB = noiseL(vec2(q.x.mul(0.21).add(seed.mul(2.0)), y.mul(0.27).sub(tm.mul(0.50)))).r;
        const nC = noiseL(vec2(q.x.mul(0.47).add(seed.mul(3.0)), y.mul(0.60).sub(tm.mul(1.05)))).b;
        const x = q.x.add(nA.sub(0.5).mul(mix(0.35, 1.5, turb)).mul(y).mul(y.add(0.25)));
        const rad = pow(sat(y.oneMinus()), 0.6).mul(smoothstep(0.0, 0.22, y).mul(0.5).add(0.5)).mul(mix(0.36, 0.56, turb));
        const d = abs(x).div(max(rad, 0.02)), near = sat(float(1.5).sub(d));     // noise may push tongues a little past the outline, never far from it
        const heat = sat(d.oneMinus()).mul(float(1.2).sub(y.mul(0.5)))
          .add(nB.sub(0.5).mul(y).mul(mix(0.4, 2.1, turb)).mul(near)).add(nC.sub(0.5).mul(y.mul(0.8).add(0.2)).mul(mix(0.1, 1.0, turb)).mul(near))
          .sub(y.mul(y).mul(mix(2.6, 0.34, turb))).mul(smoothstep(0.0, 0.05, y));
        const a = smoothstep(0.06, 0.42, heat), core = smoothstep(0.58, 1.08, heat);
        const fc = mix(mix(vec3(1.0, 0.10, 0.01), vec3(1.0, 0.46, 0.08), smoothstep(0.10, 0.50, heat)), vec3(1.0, 0.86, 0.58), core).toVar();
        fc.addAssign(vec3(0.10, 0.22, 0.75).mul(smoothstep(0.30, 0.02, y).mul(sat(d.oneMinus())).mul(turb.oneMinus()).mul(0.7)));   // the blue foot of a candle flame
        out.assign(vec4(fc.mul(a.mul(core.mul(0.8).add(0.36))).mul(pcol.a.mul(mix(1.9, 1.0, turb))).mul(pcol.rgb), 0));
      }).Else(() => {                                      // firefly / ember
        out.assign(vec4(pcol.rgb.mul(exp(r2.mul(-7.0)).mul(pcol.a).mul(fogf)), 0));
      });
      return out;
    })();
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 2000; mesh.name = 'particles';
    scene.add(mesh);
    Object.assign(Particles, { mesh, buffer: ib, capacity: max_ });
    return mesh;
  };
  Particles.update = function () {
    const mesh = Particles.mesh; if (!mesh) return;
    const n = Math.min(R.partCount | 0, Particles.capacity);
    mesh.geometry.instanceCount = n; mesh.visible = n > 0;
    if (n > 0) { const b = Particles.buffer; b.clearUpdateRanges(); b.addUpdateRange(0, n * 12); b.needsUpdate = true; }
  };
})();


// ---- 49_chars.js ----
// ───────────────────────── villagers as glTF characters: modular skinned bodies, shared animation clips, world lighting ─────────────────────────
// Asset-agnostic: everything about a character set lives in one config (Chars.define). To move to another set, put its files
// under chars/ and write a config; nothing below the configs needs to change.
//
//   await Chars.load('quaternius', progress)   load bodies, textures and clips of a set (once)
//   const h = Chars.spawn(def)                 def: an entry of NPC_DEFS; the villager is added to Chars.group
//   Chars.update(h, state, dt)                 state: { pos, yaw, anim, scale, zone, light, visible, look: [yaw, pitch], talking, seatHeight }
//   Chars.attach(h, 'handR', object3D)         parent a prop to a named bone
//   Chars.remove(h)
//
// Game conventions kept: feet at pos, yaw 0 faces -Z and grows clockwise seen from above, animation names as in 77_npc.js.
const Chars = (() => {
  const { vec3, vec4, float, uniform, texture, uv, positionWorld, normalWorld, materialColor, normalMap } = TSL;
  const SETS = {};
  const C = { group: new THREE.Group(), set: null, cfg: null, list: [], ready: false, normalMaps: true };
  C.group.name = 'villagers';

  // ── character sets ──
  // dir, clips        folder, and the one GLB that holds every clip (its tracks address joints by name)
  // bodies            name -> GLB holding every part of that body as separate meshes on one skeleton
  // textures          key -> file (colour) or { file, data: true } (normal maps and other non-colour data)
  // materials         glTF material name -> { map: key | { body: key }, normal: key, rough, kind: 'skin' | 'hair', oneSided }
  // faces             +1 if the models face +Z (the glTF convention), -1 if they face -Z like the game
  // scale             model scale that makes an adult 1.72 m tall, the height the village was built for
  // bones             the rig's names for the joints the game talks to
  // anims             game animation -> clip name, or a list to pick from per villager; 'sit+talk' plays when a seated villager talks
  // once, rate        clips that must not loop; optional playback rate per game animation
  // look(def)         -> { body, parts: [mesh names], maps: { material: texture key }, tint: { material | 'skin' | 'hair': [r,g,b] } } for one villager
  C.define = (name, cfg) => { SETS[name] = cfg; };

  // Quaternius: Universal Base Characters + Modular Character Outfits - Fantasy (free tiers), clips from the Mesh2Motion library. All CC0.
  // The files are built by tools/chars.mjs and tools/chars_tex.py; chars/PROVENANCE.md says where everything came from.
  {
    const lin = c => c.map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    // multipliers over the pack's one mid-tone skin texture and its grey hair texture
    const SKIN_T = { fair: [1.36, 1.42, 1.50], rosy: [1.40, 1.34, 1.36], tan: [1.08, 1.08, 1.08], brown: [0.72, 0.68, 0.66], deep: [0.46, 0.42, 0.40] };
    const HAIR_C = { black: [0.13, 0.11, 0.10], brown: [0.32, 0.20, 0.12], auburn: [0.52, 0.24, 0.12], blond: [0.80, 0.64, 0.34], grey: [0.62, 0.61, 0.60], white: [0.90, 0.89, 0.86], red: [0.66, 0.26, 0.10] };
    const hairTint = n => { const c = lin(HAIR_C[n] || HAIR_C.brown), g = (c[0] + c[1] + c[2]) / 3; return c.map(v => Math.min((v * 0.75 + g * 0.25) / 0.27 * 0.8, 2.2)); };
    const P = ['Peasant_Body', 'Peasant_Arms', 'Peasant_Legs', 'Peasant_Feet'], R = ['Ranger_Body', 'Ranger_Arms', 'Ranger_Legs', 'Ranger_Feet'], FACE = ['HeadSkin', 'Eyes', 'Brows'];
    // who wears what. Outfit pieces: P peasant, R ranger; maps pick the pack's alternative colourways; tints stay muted and natural.
    const LOOKS = {
      hale:   { body: 'male',   parts: [...R, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Pauldrons', 'Hair_SimpleParted', 'Hair_Beard'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.95, 0.9, 0.88] } },
      ivo:    { body: 'male',   parts: [...R, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Body_Belt_2', 'Ranger_Pauldrons', 'Hair_Buzzed'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.78, 0.86, 1.05] } },
      greta:  { body: 'female', parts: [...P, 'Hair_Buns'], tint: { MI_Peasant: [0.92, 1.05, 0.88] } },
      brandt: { body: 'male',   parts: [...P, 'Hair_Buzzed', 'Hair_Beard'], maps: { MI_Peasant: 'peasant2' }, tint: { MI_Peasant: [1.15, 1.0, 0.9] } },
      tobin:  { body: 'male',   parts: [...P, 'Hair_SimpleParted'], tint: { MI_Peasant: [1.1, 1.0, 0.8] } },
      marta:  { body: 'female', parts: ['Peasant_Body', 'Peasant_Arms', 'Ranger_Legs', 'Ranger_Feet', 'Hair_Long'], maps: { MI_Peasant: 'peasant2', MI_Ranger: 'ranger3' }, tint: { MI_Peasant: [1.35, 0.85, 0.95] } },
      aldous: { body: 'male',   parts: [...R, 'Ranger_Head_Hood', 'Ranger_Body_Belt_1'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [1.0, 0.88, 0.74] } },
      maren:  { body: 'female', parts: [...R, 'Ranger_Head_Hood'], tint: { MI_Ranger: [0.80, 0.64, 0.82] } },
      osric:  { body: 'male',   parts: [...P, 'Hair_Buzzed', 'Hair_Beard'], tint: { MI_Peasant: [1.25, 1.2, 1.1] } },
      edda:   { body: 'female', parts: [...P, 'Hair_Long'], tint: { MI_Peasant: [1.15, 1.0, 0.72] } },
      finn:   { body: 'male',   parts: ['Peasant_Body', 'Peasant_Arms', 'Ranger_Legs', 'Ranger_Feet', 'Hair_SimpleParted', 'Hair_Beard'], tint: { MI_Peasant: [0.72, 0.9, 1.08], MI_Ranger: [0.8, 0.8, 0.8] } },
      lark:   { body: 'male',   parts: [...R, 'Ranger_Body_Belt_2', 'Hair_Long'], tint: { MI_Ranger: [0.74, 0.76, 0.86] } },
      wren:   { body: 'female', parts: [...R, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Head_Hood'], tint: { MI_Ranger: [0.86, 0.74, 0.62] } },
      rowan:  { body: 'male',   parts: [...R, 'Ranger_Body_Belt_1', 'Hair_Long', 'Hair_Beard'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.86, 0.8, 1.05] } },
      pip:    { body: 'male',   parts: [...P, 'Hair_Long'], tint: { MI_Peasant: [1.3, 0.9, 0.82] } },      // a child: the plain tunic, not a scaled-down woman's bodice
      hilda:  { body: 'female', parts: [...P, 'Hair_Buns'], maps: { MI_Peasant: 'peasant2' }, tint: { MI_Peasant: [0.85, 1.05, 1.5] } },
      bram:   { body: 'male',   parts: ['Peasant_Body', 'Peasant_Arms', 'Peasant_Legs', 'Ranger_Feet', 'Hair_SimpleParted'], tint: { MI_Peasant: [1.0, 1.05, 0.82], MI_Ranger: [0.9, 0.85, 0.8] } },
    };
    C.define('quaternius', {
      dir: 'chars/', clips: 'q_clips.glb', bodies: { male: 'q_male.glb', female: 'q_female.glb' },
      textures: { peasant: 'q_peasant.webp', peasant2: 'q_peasant2.webp', peasantN: { file: 'q_peasant_n.webp', data: true }, ranger: 'q_ranger.webp', ranger3: 'q_ranger3.webp', rangerN: { file: 'q_ranger_n.webp', data: true },
        skinM: 'q_skin_m.webp', skinF: 'q_skin_f.webp', headM: 'q_head_m.webp', headF: 'q_head_f.webp', hair1: 'q_hair1.webp', hair2: 'q_hair2.webp', eye: 'q_eye.webp' },
      materials: {
        MI_Peasant: { map: 'peasant', normal: 'peasantN', rough: 0.86 }, MI_Ranger: { map: 'ranger', normal: 'rangerN', rough: 0.8 },
        MI_Regular_Male: { map: 'skinM', kind: 'skin', rough: 0.62, oneSided: true }, MI_Regular_Female: { map: 'skinF', kind: 'skin', rough: 0.62, oneSided: true },
        MI_Skin_Head: { map: { male: 'headM', female: 'headF' }, kind: 'skin', rough: 0.62, oneSided: true },
        MI_Hair_1: { map: 'hair1', kind: 'hair', rough: 0.7 }, MI_Hair_2: { map: 'hair2', kind: 'hair', rough: 0.7 }, MI_Eyes: { map: 'eye', rough: 0.35, oneSided: true },
      },
      faces: 1, scale: 1.72 / 1.80,
      bones: { hips: 'pelvis', head: 'Head', neck: 'neck_01', handR: 'hand_r', handL: 'hand_l', footR: 'foot_r', footL: 'foot_l' },
      anims: {
        idle: ['idle-a', 'idle-foldarms', 'idle-a'], walk: ['walk', 'walk-relaxed'], run: 'jog', sit: 'sitting-idle', 'sit+talk': 'sitting-talking', talk: 'idle-talking',
        hammer: 'hammering', lute: 'guitar-playing', pray: 'pray', guard: 'polearm-idle', fish: 'idle-lantern', work: 'farm-harvest', sweep: 'shovel-dig', lie: 'sleeping', cheer: 'clapping',
      },
      once: ['greeting', 'head-nod', 'interact', 'pick-up', 'open-door', 'kneel', 'sword-attack', 'sword-regular-a', 'sword-regular-b', 'sword-regular-combo', 'weapon-draw', 'hit-chest', 'hit-head', 'death-a', 'death-b', 'jump-start', 'jump-land', 'dodge-back', 'bow-pull', 'bow-release'],
      rate: { hammer: 0.9 },
      look(def) {
        const women = { greta: 1, marta: 1, maren: 1, edda: 1, wren: 1, pip: 1, hilda: 1 };
        const l = LOOKS[def.id] || { body: women[def.id] || def.female ? 'female' : 'male', parts: [...P, 'Hair_SimpleParted'], tint: { MI_Peasant: (def.top || [0.5, 0.45, 0.4]).map(v => 0.6 + v) } };
        const tint = Object.assign({ skin: SKIN_T[def.skin || 'fair'], hair: hairTint(def.hair) }, l.tint);
        return { body: l.body, parts: FACE.concat(l.parts), maps: l.maps || {}, tint };
      },
    });
  }

  // ── loading ──
  C.load = async function (setName, progress) {
    const cfg = SETS[setName]; if (!cfg) throw new Error('unknown character set ' + setName);
    const bodyNames = Object.keys(cfg.bodies), texKeys = Object.keys(cfg.textures || {}), total = bodyNames.length + texKeys.length + 1; let done = 0;
    const tick = () => { if (progress) progress(++done / total); };
    const GL = new T3X.GLTFLoader(), TL = new THREE.TextureLoader();
    const get = async f => { const g = await GL.loadAsync(cfg.dir + f); tick(); return g; };
    const tex = async k => {
      const d = cfg.textures[k], t = await TL.loadAsync(cfg.dir + (d.file || d));
      t.flipY = false; t.colorSpace = d.data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.needsUpdate = true; tick(); return [k, t];
    };
    const [clipFile, bodyFiles, texList] = await Promise.all([get(cfg.clips), Promise.all(bodyNames.map(n => get(cfg.bodies[n]))), Promise.all(texKeys.map(tex))]);
    const S = { name: setName, cfg, clips: {}, bodies: {}, tex: Object.fromEntries(texList), measure: {}, fitted: new Map(), geo: new Map() };
    for (const c of clipFile.animations) S.clips[c.name] = c;
    S.src = restPose(clipFile.scene);
    bodyNames.forEach((n, i) => {
      const scene = bodyFiles[i].scene; scene.updateMatrixWorld(true);
      for (const c of bodyFiles[i].animations || []) if (!S.clips[c.name]) S.clips[c.name] = c;       // a body file may bring its own clips
      const B = { scene, rest: restPose(scene), parts: {}, skel: null, armature: null };
      scene.traverse(o => {
        if (!o.isSkinnedMesh) return;
        if (!B.skel) { B.skel = o.skeleton; B.bindMatrix = o.bindMatrix.clone(); }
        const g = o.parent, part = g && g !== scene && !g.isBone && g.children.length && g.children.every(c => c.isSkinnedMesh) ? g.name : o.name;   // a mesh with several materials loads as a group
        (B.parts[part] = B.parts[part] || []).push(o);
      });
      if (!B.skel) throw new Error(cfg.bodies[n] + ' has no skinned mesh');
      let a = B.skel.bones[0]; while (a.parent && a.parent !== scene) a = a.parent; B.armature = a;
      const hs = S.src.pos[cfg.bones.hips], ht = B.rest.pos[cfg.bones.hips]; B.hipsRatio = hs && ht && hs.length() > 1e-4 ? ht.length() / hs.length() : 1;
      S.bodies[n] = B;
    });
    for (const key of Object.keys(cfg.anims)) for (const cn of [].concat(cfg.anims[key])) if (!S.clips[cn]) console.warn('character set ' + setName + ': no clip "' + cn + '" for ' + key);
    C.set = S; C.cfg = cfg; C.ready = true;
    return S;
  };
  // rest pose of a skeleton: per node name its parent, local rotation, local position and world rotation
  function restPose(scene) {
    const R = { order: [], parent: {}, q: {}, pos: {}, w: {} };
    scene.traverse(o => {
      if (o === scene || o.isMesh || !o.name || R.q[o.name]) return;
      R.order.push(o.name); R.parent[o.name] = o.parent && o.parent !== scene ? o.parent.name : null; R.q[o.name] = o.quaternion.clone(); R.pos[o.name] = o.position.clone();
      const pw = R.parent[o.name] && R.w[R.parent[o.name]]; R.w[o.name] = pw ? pw.clone().multiply(o.quaternion) : o.quaternion.clone();
    });
    return R;
  }
  // A clip stores joint rotations for the skeleton it was made on. Bodies with slightly different rest poses (every Quaternius body has
  // its own) would bend wrongly if they played it as is, so each body gets a fitted copy: every joint turns by the same amount in
  // world space as on the source skeleton, starting from the body's own rest pose. Hip travel is scaled to the body's leg length.
  function clipFor(S, body, name) {
    const src = S.clips[name]; if (!src) return null;
    const key = body + '/' + name; let out = S.fitted.get(key); if (out) return out;
    const A = S.src, B = S.bodies[body].rest, rot = {}, tracks = []; let times = null;
    for (const t of src.tracks) { const dot = t.name.lastIndexOf('.'), bone = t.name.slice(0, dot), prop = t.name.slice(dot + 1); if (prop === 'quaternion' && A.q[bone] && B.q[bone]) { rot[bone] = t; if (!times || t.times.length > times.length) times = t.times; } }
    if (!times) { S.fitted.set(key, src); return src; }
    const n = times.length, vals = {}, Ws = {}, D = {}, Ws0i = {}, Wt0i = {}, q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), I = new THREE.Quaternion();
    for (const b of Object.keys(rot)) vals[b] = new Float32Array(n * 4);
    for (const b of A.order) { Ws0i[b] = A.w[b].clone().invert(); Ws[b] = new THREE.Quaternion(); D[b] = new THREE.Quaternion(); }
    for (const b of B.order) Wt0i[b] = B.w[b].clone().invert();
    for (let k = 0; k < n; k++) {
      for (const b of A.order) {
        const tr = rot[b], p = A.parent[b];
        if (tr) { const kk = Math.min(k, tr.times.length - 1) * 4; q.set(tr.values[kk], tr.values[kk + 1], tr.values[kk + 2], tr.values[kk + 3]); } else q.copy(A.q[b]);
        Ws[b].copy(p ? Ws[p] : I).multiply(q); D[b].copy(Ws[b]).multiply(Ws0i[b]);
        if (!tr) continue;
        const pt = B.parent[b];       // local = inv(parent rest world) * inv(parent turn) * turn * rest world
        q2.copy(pt ? Wt0i[pt] : I); if (pt && D[pt]) q2.multiply(q.copy(D[pt]).invert()); q2.multiply(D[b]).multiply(B.w[b]).normalize();
        const v = vals[b]; v[k * 4] = q2.x; v[k * 4 + 1] = q2.y; v[k * 4 + 2] = q2.z; v[k * 4 + 3] = q2.w;
      }
    }
    for (const b of Object.keys(rot)) { const m = rot[b].times.length; tracks.push(new THREE.QuaternionKeyframeTrack(b + '.quaternion', rot[b].times, m === n ? vals[b] : vals[b].slice(0, m * 4))); }
    const r = S.bodies[body].hipsRatio;
    for (const t of src.tracks) if (t.name === S.cfg.bones.hips + '.position') { const v = t.values.slice(); for (let i = 0; i < v.length; i++) v[i] *= r; tracks.push(new THREE.VectorKeyframeTrack(t.name, t.times, v)); }
    out = new THREE.AnimationClip(name, src.duration, tracks); S.fitted.set(key, out);
    return out;
  }

  // ── geometry: the chosen parts of a body, merged per material so a villager costs a handful of draws ──
  const ATTR = [['position', 3], ['normal', 3], ['uv', 2], ['skinIndex', 4], ['skinWeight', 4]];
  function mergedGeometry(S, body, parts, matName) {
    const key = body + '|' + matName + '|' + parts.join(','); let g = S.geo.get(key); if (g !== undefined) return g;
    const src = []; for (const p of parts) for (const m of S.bodies[body].parts[p] || []) if (m.material.name === matName) src.push(m.geometry);
    if (!src.length) { S.geo.set(key, null); return null; }
    let nv = 0, ni = 0; for (const s of src) { nv += s.attributes.position.count; ni += s.index ? s.index.count : s.attributes.position.count; }
    g = new THREE.BufferGeometry(); const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    for (const [name, size] of ATTR) {
      const arr = name === 'skinIndex' ? new Uint16Array(nv * size) : new Float32Array(nv * size); let o = 0;
      for (const s of src) { const a = s.attributes[name], c = s.attributes.position.count; for (let v = 0; v < c; v++) for (let k = 0; k < size; k++) arr[o++] = a ? a.getComponent(v, k) : 0; }
      g.setAttribute(name, new THREE.BufferAttribute(arr, size));
    }
    let io = 0, base = 0; for (const s of src) { const c = s.attributes.position.count; if (s.index) for (let i = 0; i < s.index.count; i++) idx[io++] = s.index.getX(i) + base; else for (let i = 0; i < c; i++) idx[io++] = i + base; base += c; }
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.6);
    S.geo.set(key, g); return g;
  }

  // ── material: the pack's colour maps, lit like the rest of the world (sun from the scene light; sky, bounce and hearths through emissive) ──
  function makeMaterial(S, H, matName, look) {
    const md = S.cfg.materials[matName] || {}, m = new THREE.MeshStandardNodeMaterial(); m.name = matName;
    let key = (look.maps && look.maps[matName]) || md.map; if (key && typeof key === 'object') key = key[H.body];
    const map = key ? S.tex[key] : null, tint = look.tint && (look.tint[matName] || (md.kind && look.tint[md.kind]));
    if (tint) m.color.setRGB(tint[0], tint[1], tint[2]);
    m.roughness = md.rough === undefined ? 0.85 : md.rough; m.metalness = 0; m.side = md.oneSided ? THREE.FrontSide : THREE.DoubleSide;
    const albedo = (map ? texture(map, uv()).rgb : vec3(1, 1, 1)).mul(materialColor);
    m.colorNode = vec4(albedo, 1);
    if (C.normalMaps && md.normal && S.tex[md.normal]) m.normalNode = normalMap(texture(S.tex[md.normal], uv()));
    const N = normalWorld.normalize();
    m.emissiveNode = albedo.mul(SH.hemi(N, H.uLight, H.uZone).add(SH.pointLights(positionWorld, N, H.uZone, float(0.25))));
    return m;
  }

  // ── spawning ──
  const cloneBones = o => { const c = o.clone(false); for (const ch of o.children) if (ch.isBone) c.add(cloneBones(ch)); return c; };
  C.spawn = function (def) {
    const S = C.set; if (!S) throw new Error('Chars.load first');
    const cfg = S.cfg, look = cfg.look ? cfg.look(def) : {}, body = S.bodies[look.body] ? look.body : Object.keys(S.bodies)[0], B = S.bodies[body];
    const root = cloneBones(B.armature), byName = {}; root.traverse(o => { byName[o.name] = o; });
    const skeleton = new THREE.Skeleton(B.skel.bones.map(b => byName[b.name]), B.skel.boneInverses);
    const H = { def, set: S, body, root, pivot: new THREE.Group(), skeleton, uZone: uniform(0), uLight: uniform(1), bones: {}, actions: {}, cur: null, curName: '', seed: 0, mats: [], meshes: [] };
    for (let i = 0, id = String(def.id || C.list.length); i < id.length; i++) H.seed = (H.seed * 31 + id.charCodeAt(i)) >>> 0;
    const parts = (look.parts || Object.keys(B.parts)).filter(p => B.parts[p]).sort(), names = new Set();
    for (const p of parts) for (const m of B.parts[p]) names.add(m.material.name);
    for (const mn of names) {
      const g = mergedGeometry(S, body, parts, mn); if (!g) continue;
      const mat = makeMaterial(S, H, mn, look), mesh = new THREE.SkinnedMesh(g, mat);
      mesh.name = mn; mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); mesh.bind(skeleton, B.bindMatrix);
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); mesh.frustumCulled = true;      // a fixed sphere: each pass (camera, shadow maps) culls villagers itself
      H.mats.push(mat); H.meshes.push(mesh);
    }
    for (const k of Object.keys(cfg.bones)) H.bones[k] = byName[cfg.bones[k]] || null;
    H.mixer = new THREE.AnimationMixer(root);
    H.pivot.add(root); H.pivot.name = 'villager:' + (def.id || ''); root.scale.setScalar(cfg.scale || 1);
    C.group.add(H.pivot); C.list.push(H);
    return H;
  };
  C.remove = function (H) { H.mixer.stopAllAction(); C.group.remove(H.pivot); for (const m of H.mats) m.dispose(); H.skeleton.dispose(); const i = C.list.indexOf(H); if (i >= 0) C.list.splice(i, 1); };
  C.attach = function (H, bone, obj) { const b = H.bones[bone] || H.root.getObjectByName(bone); if (b) b.add(obj); return !!b; };

  // ── animation ──
  function action(H, clipName) {
    let a = H.actions[clipName];
    if (a === undefined) {
      const clip = clipFor(H.set, H.body, clipName);
      a = H.actions[clipName] = clip ? H.mixer.clipAction(clip) : null;
      if (a && H.set.cfg.once && H.set.cfg.once.includes(clipName)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    }
    return a;
  }
  function clipNameFor(H, key) {
    const c = H.set.cfg.anims[key] !== undefined ? H.set.cfg.anims[key] : H.set.cfg.anims.idle;
    return Array.isArray(c) ? c[H.seed % c.length] : c;
  }
  const FADE = 0.25;
  function play(H, key) {
    const name = clipNameFor(H, key); if (name === H.curName) return;
    const next = action(H, name); if (!next) return;
    next.reset(); next.setEffectiveWeight(1); next.setEffectiveTimeScale((H.set.cfg.rate && H.set.cfg.rate[key]) || 1);
    if (H.cur) { H.cur.fadeOut(FADE); next.fadeIn(FADE); }
    else next.time = (H.seed % 97) / 97 * next.getClip().duration;      // villagers do not all start in step
    next.play(); H.cur = next; H.curName = name; H.curKey = key;
  }
  // where a clip puts the body, measured once per body and clip by posing a bare skeleton with it: hip height (for seats) and the lying axis (for beds)
  function measure(H, key) {
    const name = clipNameFor(H, key), id = H.body + '/' + name; let m = H.set.measure[id]; if (m) return m;
    const clip = clipFor(H.set, H.body, name);
    m = H.set.measure[id] = { hips: 0.9, hx: 0, hz: 0, ang: 0, cx: 0, cz: 0 };
    if (!clip) return m;
    const tmp = cloneBones(H.set.bodies[H.body].armature), mx = new THREE.AnimationMixer(tmp);
    mx.clipAction(clip).play(); mx.setTime(0); tmp.updateMatrixWorld(true);
    const bn = H.set.cfg.bones, g = n => { const o = tmp.getObjectByName(bn[n]); return o ? o.getWorldPosition(new THREE.Vector3()) : null; };
    const hips = g('hips'), head = g('head'), fl = g('footL'), fr = g('footR');
    if (hips) { m.hips = hips.y; m.hx = hips.x; m.hz = hips.z; }
    if (head && fl && fr) { const fx = (fl.x + fr.x) / 2, fz = (fl.z + fr.z) / 2; m.ang = Math.atan2(head.x - fx, head.z - fz); m.cx = (head.x + fx) / 2; m.cz = (head.z + fz) / 2; }
    mx.stopAllAction(); mx.uncacheRoot(tmp);
    return m;
  }
  // ground speed a walking or running clip was animated for, in model units per second: twice the distance one foot covers
  // front to back, per cycle. Lets the clip be played at the rate that matches how fast the villager really moves.
  function gait(H, key) {
    const name = clipNameFor(H, key), id = H.body + '/gait/' + name; let v = H.set.measure[id]; if (v !== undefined) return v;
    const clip = clipFor(H.set, H.body, name); v = 0;
    if (clip && clip.duration > 0.05) {
      const tmp = cloneBones(H.set.bodies[H.body].armature), mx = new THREE.AnimationMixer(tmp), foot = tmp.getObjectByName(H.set.cfg.bones.footL), P = new THREE.Vector3();
      mx.clipAction(clip).play(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      if (foot) for (let i = 0; i < 24; i++) { mx.setTime(clip.duration * i / 24); tmp.updateMatrixWorld(true); foot.getWorldPosition(P); x0 = Math.min(x0, P.x); x1 = Math.max(x1, P.x); z0 = Math.min(z0, P.z); z1 = Math.max(z1, P.z); }
      if (foot) v = 2 * Math.max(x1 - x0, z1 - z0) / clip.duration;
      mx.stopAllAction(); mx.uncacheRoot(tmp);
    }
    return H.set.measure[id] = v;
  }
  // turn a bone by a rotation given in the villager's own space (after the clip has posed it)
  const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _e = new THREE.Euler();
  function turnBone(H, bone, yaw, pitch) {
    if (!bone) return;
    _p.identity(); for (let o = bone.parent; o && o !== H.root; o = o.parent) _p.premultiply(o.quaternion);
    _pi.copy(_p).invert(); _e.set(pitch, yaw, 0, 'YXZ'); _q.setFromEuler(_e);
    bone.quaternion.premultiply(_p).premultiply(_q).premultiply(_pi);
  }

  // ── per frame ──
  C.update = function (H, st, dt) {
    const cfg = H.set.cfg, pv = H.pivot;
    pv.visible = st.visible !== false; if (!pv.visible) return;
    const base = st.anim || 'idle', seated = base === 'sit', lying = base === 'lie';
    const key = st.talking ? (lying ? 'lie' : seated ? (cfg.anims['sit+talk'] ? 'sit+talk' : 'sit') : 'talk') : base;
    play(H, key);
    const s = st.scale || 1, k = (cfg.scale || 1) * s;
    if (H.cur && (key === 'walk' || key === 'run')) { const g = gait(H, key) * k, rate = (cfg.rate && cfg.rate[key]) || 1; H.cur.setEffectiveTimeScale(st.speed > 0 && g > 0.2 ? Math.min(Math.max(st.speed / g, 0.6), 1.8) : rate); }
    H.mixer.update(dt);
    const p = st.pos, yaw = st.yaw || 0, face = cfg.faces === -1 ? 0 : Math.PI;
    H.root.scale.setScalar(k);
    if (lying) {
      const m = measure(H, 'lie'), th = Math.PI - yaw - m.ang, c = Math.cos(th), sn = Math.sin(th);      // head toward the spot's heading, body centred on it
      pv.rotation.y = th; pv.position.set(p[0] - (m.cx * c + m.cz * sn) * k, p[1] + 0.02, p[2] - (-m.cx * sn + m.cz * c) * k);
    } else {
      const th = face - yaw; let x = p[0], y = p[1], z = p[2];
      if (seated) {      // the hips go where the old villagers had theirs: over the spot, just above the seat (sitting clips lean the body back from its origin)
        const m = measure(H, 'sit'), c = Math.cos(th), sn = Math.sin(th);
        y += (st.seatHeight || 0.46) + 0.09 * s - m.hips * k; x -= (m.hx * c + m.hz * sn) * k; z -= (-m.hx * sn + m.hz * c) * k;
      }
      pv.rotation.y = th; pv.position.set(x, y, z);
    }
    if (st.cast !== undefined && st.cast !== H.cast) { H.cast = st.cast; for (const m of H.meshes) m.castShadow = st.cast; }
    H.uZone.value = st.zone || 0; H.uLight.value = st.light === undefined ? 1 : st.light;
    // Head look. The mixer only rewrites a joint when its animated value changed, so a turn added last frame may still be in the
    // joint: take it out again before adding this frame's.
    const lk = st.look, nb = H.bones.neck, hb = H.bones.head, L = H.lookState || (H.lookState = [nb, hb].map(() => ({ base: new THREE.Quaternion(), mine: new THREE.Quaternion(), on: false })));
    [nb, hb].forEach((b, i) => { if (!b) return; const e = L[i]; if (e.on && b.quaternion.equals(e.mine)) b.quaternion.copy(e.base); else e.base.copy(b.quaternion); e.on = false; });
    if (lk && !lying && (Math.abs(lk[0]) > 0.01 || Math.abs(lk[1]) > 0.01)) {
      const sg = cfg.faces === -1 ? -1 : 1;
      turnBone(H, nb, lk[0] * 0.35, lk[1] * 0.35 * sg); turnBone(H, hb, lk[0] * 0.65, lk[1] * 0.65 * sg);
      [nb, hb].forEach((b, i) => { if (b) { L[i].mine.copy(b.quaternion); L[i].on = true; } });
    }
  };
  return C;
})();


// ---- 50_env.js ----
// ───────────────────────── time of day, sky colours, light ─────────────────────────
const Env = { hour: 7.9, dayLength: 1200, paused: false, cover: 0.38, mist: 0.07 };      // dayLength: real seconds per in-game day
const ENV = {
  keyDir: [0, 1, 0], keyCol: [3, 3, 3], sunDir: [0, 1, 0], moonDir: [0, 1, 0], ambSky: [0, 0, 0], ambGnd: [0, 0, 0],
  fogCol: [0, 0, 0], fogSun: [0, 0, 0], zenith: [0, 0, 0], horizon: [0, 0, 0], windDir: [0.8, 0.6], windStrength: 1,
  exposure: 0.6, shadowStrength: 1, night: 0, day: 1, cloud: 0.45, fogDensity: 0.001, stars: 0, aurora: 0, moonBright: 0, sunDisc: 0, windowGlow: 0,
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function updateEnv(time, indoor) {
  const e = ENV, th = (Env.hour - 6) / 12 * PI, maxEl = 0.62;      // a northern autumn sun: it never climbs high, so shadows stay long
  const sun = v3.norm([Math.cos(th), Math.sin(th) * Math.sin(maxEl), Math.sin(th) * Math.cos(maxEl) + 0.12]);
  const moon = v3.norm([-sun[0] * 0.9 + 0.25, -sun[1] + 0.12, -sun[2] * 0.8 + 0.3]);
  e.sunDir = sun; e.moonDir = moon;
  const sy = sun[1];
  const day = smooth(-0.10, 0.14, sy), night = 1 - smooth(-0.22, -0.02, sy);
  const golden = Math.exp(-(sy * sy) / 0.06);                 // peaks at the horizon
  e.day = day; e.night = night;
  const sunI = smooth(-0.015, 0.11, sy), moonI = smooth(0.02, 0.2, moon[1]) * smooth(-0.04, -0.12, sy);
  const sunCol = mix3([1.0, 0.42, 0.14], [1.0, 0.925, 0.79], smooth(0.0, 0.42, sy));
  if (sunI > 0.001 || moonI <= 0) { e.keyDir = sun[1] > 0.02 ? sun : v3.norm([sun[0], 0.02, sun[2]]); e.keyCol = v3.scale(sunCol, 3.7 * sunI); }
  else { e.keyDir = moon; e.keyCol = v3.scale([0.50, 0.64, 1.0], 0.20 * moonI); }
  e.shadowStrength = sunI > 0.001 ? smooth(0.0, 0.25, sunI) : smooth(0.0, 0.3, moonI) * 0.9;
  // sky
  const zDay = [0.115, 0.28, 0.72], hDay = [0.52, 0.68, 0.90], zSet = [0.10, 0.15, 0.36], hSet = [0.95, 0.50, 0.24], zNight = [0.0035, 0.007, 0.020], hNight = [0.010, 0.019, 0.040];
  let z = mix3(zNight, zSet, smooth(-0.24, 0.0, sy)), h = mix3(hNight, hSet, smooth(-0.20, 0.02, sy));
  z = mix3(z, zDay, smooth(0.0, 0.30, sy)); h = mix3(h, hDay, smooth(0.04, 0.34, sy));
  e.zenith = z; e.horizon = h;
  e.fogSun = v3.scale(sunCol, (0.22 + 0.75 * golden) * smooth(-0.12, 0.04, sy));
  e.sunDisc = 26 * smooth(-0.03, 0.05, sy);
  e.ambSky = v3.add(v3.add(v3.scale(mix3(z, h, 0.45), 1.0), v3.scale(sunCol, 0.07 * sunI)), [0.004, 0.006, 0.012]);
  e.ambGnd = v3.add(v3.scale(mix3([0.20, 0.17, 0.12], [0.30, 0.20, 0.14], golden), (0.10 + 0.55 * day)), [0.002, 0.003, 0.006]);
  const mist = Math.exp(-Math.pow((Env.hour - 6.3) / 1.3, 2)) * 0.9 + Math.exp(-Math.pow((Env.hour - 19.6) / 1.5, 2)) * 0.2;
  e.fogCol = mix3(mix3(h, z, 0.42), [0.5 * (h[0] + h[1]), 0.5 * (h[0] + h[1]), 0.5 * (h[1] + h[2])], 0.25);
  e.fogDensity = 0.00115 * (1 + mist * 1.3 + golden * 0.5) + 0.0005 * night;
  e.stars = night; e.aurora = night * (0.55 + 0.45 * Math.sin(time * 0.05));
  e.moonBright = smooth(-0.02, -0.14, sy) * 1.4;
  e.cloud = 0.44 + 0.16 * Math.sin(time * 0.011 + 1.3);
  e.windStrength = 0.75 + 0.4 * Math.sin(time * 0.07) + 0.2 * Math.sin(time * 0.23);
  e.windowGlow = smooth(0.62, 0.22, day);
  const outExp = lerp(lerp(0.56, 0.84, golden), 3.0, night);
  e.exposure = lerp(outExp, lerp(1.05, 1.25, night), indoor || 0);
  // weather: a light overcast with mist that gathers over the valley around dawn (Env.cover / Env.mist set the base amounts)
  if (typeof Sky !== 'undefined' && Sky.applyWeather) { Sky.setWeather(Env.cover, Env.mist + 0.24 * Math.exp(-Math.pow((Env.hour - 6.6) / 1.5, 2))); Sky.applyWeather(e); }      // overcast and mist reshape the light, see 45_sky.js
  return e;
}


// ---- 55_layout.js ----
// ───────────────────────── Brackenfell: where everything is ─────────────────────────
// x = east, z = south, y = up. A site's "front" (its door wall) faces heading `yaw` (0 = north, clockwise).
const LAKE = { x: 10, z: 122, r: 34, y: -1.6 };
const SITES = [
  { id: 'inn', name: 'The Honeyed Hart', x: 0, z: -22, yaw: PI, w: 15, d: 9.6 },
  { id: 'smithy', name: 'Brandt’s Forge', x: -23, z: -13, yaw: PI / 2, w: 9.5, d: 7, doorPos: 3.0, bare: [[-5.0, -7.1, 1.8, -3.4]] },
  { id: 'store', name: 'Quill’s Sundries', x: 23, z: -8.5, yaw: -PI / 2, w: 8.4, d: 6.6, doorPos: -1.9 },
  { id: 'elder', name: 'Rowan’s Cottage', x: -18, z: 20, yaw: PI * 0.25, w: 7.2, d: 5.6, doorPos: 0.9 },
  { id: 'herbalist', name: 'Maren’s Cottage', x: 18, z: 22, yaw: -PI * 0.25, w: 6.6, d: 5.6, doorPos: -0.9 },
  { id: 'guardhouse', name: 'Warden’s Lodge', x: -41, z: -15.5, yaw: PI, w: 7.2, d: 5.6, doorPos: 0.9 },
  { id: 'weaver', name: 'Riverside Cottage', x: 38, z: 11, yaw: 0, w: 7.6, d: 6, doorPos: 0.9 },
  { id: 'chapel', name: 'Chapel of the Dawn', x: -6, z: -75, yaw: -PI / 2, w: 14, d: 8, doorWall: 'left', doorPos: 0, pad: 4.4, porch: 3.4, bare: [[-10.9, -2.4, -6.9, 2.4]] },
  { id: 'mill', name: 'Dunn’s Mill', x: 66.6, z: 26, yaw: PI / 2, w: 7.4, d: 6.4, doorWall: 'left', doorPos: -0.6 },
  { id: 'farm', name: 'Fairweather Farm', x: 98, z: -22, yaw: PI * 0.85, w: 8, d: 6, doorPos: 1.0 },
  { id: 'barn', name: 'Barn', x: 113, z: -3, yaw: -PI / 2, w: 9, d: 7.5, pad: 2 },
  { id: 'hunter', name: 'Wren’s Cabin', x: -72, z: 44, yaw: PI / 2, w: 6.2, d: 5.2, doorPos: 0.8 },
  { id: 'fisher', name: 'Fisher’s Hut', x: -9, z: 82, yaw: PI * 0.62, w: 5.2, d: 4.6, doorPos: 0.6 },
  { id: 'tower', name: 'Old Watchtower', x: 26, z: -124, yaw: PI * 0.9, w: 9, d: 9, pad: 3 },
];
const SITE = {}; for (const s of SITES) SITE[s.id] = s;
const siteToWorld = (s, lx, lz) => { const c = Math.cos(s.yaw), sn = Math.sin(s.yaw); return [s.x + lx * c - lz * sn, s.z + lx * sn + lz * c]; };
const worldToSite = (s, x, z) => { const c = Math.cos(s.yaw), sn = Math.sin(s.yaw), dx = x - s.x, dz = z - s.z; return [dx * c + dz * sn, -dx * sn + dz * c]; };

const RIVER_PTS = [[70, -330], [64, -250], [58, -190], [47, -150], [52, -100], [60, -55], [59, -20], [58, 2], [60, 28], [53, 58], [38, 82], [25, 98], [18, 106]];
const BRIDGE = { x: 58, z: 2, len: 15, w: 4.2 };       // spans east-west
const FIELDS = [{ x0: 82, z0: 10, x1: 104, z1: 30 }, { x0: 107, z0: 12, x1: 126, z1: 36 }, { x0: 84, z0: 34, x1: 103, z1: 50 }];
const ROADS = [
  { id: 'main', w: 3.4, pts: [[-170, 4], [-128, -7], [-95, -7], [-62, -5], [-34, -3.5], [-13, -1], [13, 0], [36, 1], [50, 2], [66, 2], [78, 0], [98, -9], [124, -13], [165, -18]] },
  { id: 'north', w: 2.5, pts: [[-10, -8], [-13.5, -22], [-14.5, -38], [-11, -52], [-6.5, -60], [-6, -64.2]] },
  { id: 'crag', w: 1.5, pts: [[-6.5, -60], [3, -64], [11, -77], [14, -93], [15, -106], [19, -116], [24, -119.5]] },
  { id: 'south', w: 2.5, pts: [[0, 11], [-1.5, 30], [1.5, 50], [3.5, 68], [5, 80], [6.6, 87.5]] },
  { id: 'mill', w: 1.7, pts: [[66.5, 2.6], [67.2, 10], [66.8, 20.6]] },
  { id: 'farm', w: 1.9, pts: [[97, -8.6], [99, -14], [100.2, -17.4]] },
  { id: 'barn', w: 1.9, pts: [[101, -10], [106, -5], [107.6, -3]] },
  { id: 'hunter', w: 1.3, pts: [[-62, -4.5], [-63, 10], [-67, 28], [-68.5, 40], [-67.6, 44]] },
  { id: 'fisher', w: 1.3, pts: [[3.5, 70], [-1, 77], [-5.4, 82.2]] },
];
const WORLD_RADIUS = 136;       // how far the player may wander from the square
const SQUARE = { x: 0, z: -2, rx: 15.5, rz: 14 };
// a point `dist` metres outside a site's main door, in site-local coordinates
function siteDoorLocal(s, dist) {
  const wall = s.doorWall || 'front', p = s.doorPos || 0, e = dist + (s.porch || 0);
  return wall === 'front' ? [p, -s.d / 2 - e] : wall === 'back' ? [p, s.d / 2 + e] : wall === 'left' ? [-s.w / 2 - e, p] : [s.w / 2 + e, p];
}


// ---- 60_terrain.js ----
// ───────────────────────── terrain: height field, ground mesh, splat map, water ─────────────────────────
const World = {
  packs: [], lights: [], skinned: [], skinCount: 0, instGroups: [], instPack: null, skinPack: null,
  camZone: 0, indoor: 0, lakeY: LAKE.y, grassOn: true,
  colliders: [], floors: [], interact: [], zones: [], emitters: [], places: [],
};
class Poly {
  constructor(pts) {
    this.p = pts; const n = pts.length; this.cum = new Float32Array(n);
    for (let i = 1; i < n; i++) this.cum[i] = this.cum[i - 1] + hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    this.len = this.cum[n - 1]; this.boxes = [];
    for (let i = 0; i < n - 1; i += 8) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; const e = Math.min(i + 8, n - 1);
      for (let k = i; k <= e; k++) { x0 = Math.min(x0, pts[k][0]); x1 = Math.max(x1, pts[k][0]); z0 = Math.min(z0, pts[k][1]); z1 = Math.max(z1, pts[k][1]); }
      this.boxes.push([x0, z0, x1, z1, i, e]);
    }
  }
  // distance to the line (capped at max); this.at = arclength of the closest point, or -1
  dist(x, z, max) {
    let best = max * max, at = -1; const p = this.p;
    for (const b of this.boxes) {
      if (x < b[0] - max || x > b[2] + max || z < b[1] - max || z > b[3] + max) continue;
      for (let i = b[4]; i < b[5]; i++) {
        const ax = p[i][0], az = p[i][1], bx = p[i + 1][0] - ax, bz = p[i + 1][1] - az, l2 = bx * bx + bz * bz;
        const t = l2 ? sat(((x - ax) * bx + (z - az) * bz) / l2) : 0, dx = x - ax - bx * t, dz = z - az - bz * t, dd = dx * dx + dz * dz;
        if (dd < best) { best = dd; at = this.cum[i] + t * Math.sqrt(l2); }
      }
    }
    this.at = at; return at < 0 ? max : Math.sqrt(best);
  }
  point(s) {
    s = clamp(s, 0, this.len); const c = this.cum; let i = 0, hi = c.length - 2;
    while (i < hi) { const m = (i + hi + 1) >> 1; if (c[m] <= s) i = m; else hi = m - 1; }
    const a = this.p[i], b = this.p[i + 1], l = c[i + 1] - c[i] || 1, t = (s - c[i]) / l;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / l, (b[1] - a[1]) / l];   // x, z, tangent
  }
}
const River = new Poly(catmull(RIVER_PTS, 3));
const Roads = ROADS.map(r => Object.assign({}, r, { line: new Poly(catmull(r.pts, 1.5)) }));
// water surface height at arclength `at` along the river (flows from index 0 down to the lake)
const riverY = at => { const L = River.len - at; return LAKE.y + 0.02 + 0.0062 * Math.min(L, 150) + 0.05 * Math.max(L - 150, 0); };
const lakeR = (x, z) => LAKE.r + 5 * fbm(x / 19, z / 19, 2, 55);

function terrainBase(x, z) {
  const r = hyp(x, z);
  let h = 2.2 * fbm(x / 55, z / 55, 4, 7) + 5 * fbm(x / 170 + 3.1, z / 170 - 1.7, 3, 19);
  h *= lerp(0.2, 1, smooth(30, 150, r));
  const hills = smooth(118, 340, r);
  if (hills > 0) h += hills * (17 + 17 * fbm(x / 150, z / 150, 4, 41) + 14 * hills);
  const mt = smooth(270, 1500, r);
  if (mt > 0) {
    const dirF = lerp(0.3, 1, smooth(-0.9, 0.5, (-z + 0.35 * x) / (r + 1)));       // tallest to the north, a low pass to the south-west
    h += Math.pow(mt, 1.2) * dirF * (90 + 640 * ridged(x / 980 + 0.7, z / 980 - 0.4, 5, 77)) + mt * 40 * fbm(x / 260, z / 260, 3, 5);
  }
  h += 6.5 * Math.exp(-((x + 8) * (x + 8) + (z + 73) * (z + 73)) / (2 * 23 * 23));                                  // chapel rise
  const dc2 = (x - 26) * (x - 26) + (z + 124) * (z + 124);
  if (dc2 < 9000) h += 21 * Math.exp(-dc2 / (2 * 21 * 21)) * (0.86 + 0.3 * fbm(x / 13, z / 13, 3, 99));               // watchtower crag
  h -= 2.6 * Math.exp(-((x - LAKE.x) * (x - LAKE.x) + (z - LAKE.z) * (z - LAKE.z)) / (2 * 62 * 62));                   // the land dips toward the lake
  return h;
}
function terrainH(x, z) {
  let h = terrainBase(x, z);
  if (Math.abs(x) < 160 && Math.abs(z) < 170) {
    // village square
    const sq = hyp((x - SQUARE.x) / (SQUARE.rx + 3), (z - SQUARE.z) / (SQUARE.rz + 3));
    if (sq < 2) h = lerp(h, 0, 1 - smooth(1, 1.9, sq));
    // building pads
    for (const s of SITES) {
      if (Math.abs(x - s.x) > 26 || Math.abs(z - s.z) > 26) continue;
      const l = worldToSite(s, x, z), m = s.pad || 1.1;
      const dx = Math.max(Math.abs(l[0]) - s.w / 2 - m, 0), dz = Math.max(Math.abs(l[1]) - s.d / 2 - m, 0), dd = hyp(dx, dz);
      if (dd < 6) h = lerp(h, s.y, 1 - smooth(0, 6, dd));
    }
  }
  // river: level banks, then a channel
  const ext = 8 * smooth(125, 230, hyp(x, z));            // far from the village the channel widens so coarse terrain still shows it
  const d = River.dist(x, z, 14 + ext);
  if (d < 14 + ext) {
    const wy = riverY(River.at);
    h = lerp(h, wy + 0.75, smooth(14 + ext, 5.5 + ext, d));
    h -= 1.95 * smooth(4.4 + ext, 1.6 + ext * 0.5, d);
  }
  // lake bowl
  const dl = hyp(x - LAKE.x, z - LAKE.z);
  if (dl < LAKE.r + 30) {
    const rl = lakeR(x, z);
    const hb = dl < rl ? LAKE.y - 3.2 * (1 - (dl / rl) * (dl / rl)) : LAKE.y + (dl - rl) * 0.2;
    h = Math.min(h, lerp(hb, h, smooth(0, 15, dl - rl)));
  }
  return h;
}
// 32-bit float -> 16-bit half float
const f2h = (() => { const f = new Float32Array(1), u = new Uint32Array(f.buffer); return v => { f[0] = v; const x = u[0], s = (x >> 16) & 0x8000; let e = ((x >> 23) & 0xff) - 112, m = x & 0x7fffff; if (e <= 0) { if (e < -10) return s; m = (m | 0x800000) >> (1 - e); return s | ((m + 0x1000) >> 13); } if (e >= 31) return s | 0x7c00; return s | (e << 10) + ((m + 0x1000) >> 13); }; })();

const Terrain = {
  N: K.heightN, cell: K.terrainCell, half: K.terrainHalf, h: null,
  // ground height: exact match of the level-0 mesh triangles inside the village area
  y(x, z) {
    const N = this.N, fx = (x + this.half) / this.cell, fz = (z + this.half) / this.cell;
    if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return terrainH(x, z);
    const ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz, h = this.h, o = iz * N + ix;
    const h00 = h[o], h10 = h[o + 1], h01 = h[o + N], h11 = h[o + N + 1];
    return tx > tz ? h00 + (h10 - h00) * tx + (h11 - h10) * tz : h00 + (h11 - h01) * tx + (h01 - h00) * tz;
  },
  normal(x, z) { const e = 0.75, a = this.y(x - e, z), b = this.y(x + e, z), c = this.y(x, z - e), d = this.y(x, z + e); return v3.norm([a - b, 2 * e, c - d]); },
  // splat lookup (0..1): r dirt, g cobble, b field, a bare
  splat(x, z, ch) { const R = K.splatRes, px = Math.floor((x + this.half) / (2 * this.half) * R), pz = Math.floor((z + this.half) / (2 * this.half) * R); if (px < 0 || pz < 0 || px >= R || pz >= R) return 0; return this.splatData[(pz * R + px) * 4 + ch] / 255; },
};
World.groundY = (x, z) => Terrain.y(x, z);

function buildTerrain() {
  // site heights from the untouched land
  for (const s of SITES) {
    let acc = terrainBase(s.x, s.z), n = 1;
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = siteToWorld(s, c[0] * s.w / 2, c[1] * s.d / 2); acc += terrainBase(p[0], p[1]); n++; }
    s.y = Math.round(acc / n * 20) / 20;
    if (s.id === 'tower') s.y = terrainBase(s.x, s.z) - 0.6;
    const d = River.dist(s.x, s.z, 14); if (d < 14) s.y = riverY(River.at) + 0.78;
    if (hyp(s.x - SQUARE.x, s.z - SQUARE.z) < 30) s.y = lerp(s.y, 0, 0.7);
  }
  const levels = [{ cell: 1.5, half: 144, hole: 0, tile: 32 }, { cell: 6, half: 432, hole: 144, tile: 48 }, { cell: 24, half: 1440, hole: 432, tile: 40 }, { cell: 96, half: 4800, hole: 1440, tile: 50 }];
  const pack = new MeshPack(); pack.shadow = true;
  let prev = null;
  for (let li = levels.length - 1; li >= 0; li--) {            // coarse first so fine borders can be stitched to them
    const L = levels[li], n = Math.round(2 * L.half / L.cell), W = n + 1, hgt = new Float32Array(W * W);
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) hgt[j * W + i] = terrainH(-L.half + i * L.cell, -L.half + j * L.cell);
    L.n = n; L.h = hgt;
    if (prev) {       // snap border vertices onto the coarser level's edges
      const ratio = Math.round(prev.cell / L.cell), cW = prev.n + 1, c0 = Math.round((prev.half - L.half) / prev.cell);
      const ch = (ci, cj) => prev.h[cj * cW + ci];
      for (let k = 0; k <= n; k++) {
        const q = Math.floor(k / ratio), t = k / ratio - q, q1 = Math.min(q + 1, n / ratio), cE = c0 + n / ratio;
        hgt[k] = lerp(ch(c0 + q, c0), ch(c0 + q1, c0), t); hgt[n * W + k] = lerp(ch(c0 + q, cE), ch(c0 + q1, cE), t);
        hgt[k * W] = lerp(ch(c0, c0 + q), ch(c0, c0 + q1), t); hgt[k * W + n] = lerp(ch(cE, c0 + q), ch(cE, c0 + q1), t);
      }
    }
    const holeC = Math.round((L.half - L.hole) / L.cell);       // cells from the edge to the hole
    for (let tj = 0; tj < n; tj += L.tile) for (let ti = 0; ti < n; ti += L.tile) {
      const m = new Mesh(2048), ids = new Map();
      const vid = (i, j) => {
        const key = j * W + i; let v = ids.get(key); if (v !== undefined) return v;
        const il = Math.max(i - 1, 0), ir = Math.min(i + 1, n), ju = Math.max(j - 1, 0), jd = Math.min(j + 1, n);
        const nx = (hgt[j * W + il] - hgt[j * W + ir]) / ((ir - il) * L.cell), nz = (hgt[ju * W + i] - hgt[jd * W + i]) / ((jd - ju) * L.cell);
        v = m.vert(-L.half + i * L.cell, hgt[key], -L.half + j * L.cell, nx, 1, nz, 0, 0); ids.set(key, v); return v;
      };
      for (let j = tj; j < Math.min(tj + L.tile, n); j++) for (let i = ti; i < Math.min(ti + L.tile, n); i++) {
        if (L.hole && i >= holeC && i < n - holeC && j >= holeC && j < n - holeC) continue;
        const a = vid(i, j), b = vid(i, j + 1), c = vid(i + 1, j + 1), d = vid(i + 1, j);
        m.tri(a, b, c); m.tri(a, c, d);
      }
      if (m.ni) pack.add(m, { kind: 'terrain', noShadow: true });
    }
    prev = L;
  }
  Terrain.h = levels[0].h;
  pack.upload('terrain'); World.packs.push(pack);
  // height texture for the grass shader
  const N = Terrain.N, hh = new Uint16Array(N * N);
  for (let i = 0; i < N * N; i++) hh[i] = f2h(Terrain.h[i]);
  G.heightTex = gfxDataTex(hh, N, N, THREE.RedFormat, THREE.HalfFloatType);
}

// roads, square, fields and bare ground painted with Canvas2D, then used by the ground shader, the grass and footsteps
function buildSplat() {
  const Rz = K.splatRes, half = Terrain.half, sc = Rz / (2 * half);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = Rz; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#000'; x.fillRect(0, 0, Rz, Rz); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round'; return x; };
  const A = mk(), B = mk();
  const P = (x, z) => [(x + half) * sc, (z + half) * sc];
  const stroke = (ctx, pts, w, col, soft) => {
    for (const [extra, a] of [[soft * 2, 0.22], [soft, 0.33], [0, 0.45]]) {
      ctx.strokeStyle = col(a); ctx.lineWidth = (w + extra) * sc; ctx.beginPath();
      pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
    }
  };
  const red = a => `rgb(${Math.round(a * 255)},0,0)`, grn = a => `rgb(0,${Math.round(a * 255)},0)`, blu = a => `rgb(0,0,${Math.round(a * 255)})`;
  for (const r of Roads) stroke(A, r.line.p, r.w, red, 0.8);
  // short paths from every door to the nearest road
  for (const s of SITES) {
    if (s.id === 'tower' || s.id === 'barn') continue;
    const dl = siteDoorLocal(s, 1.3), d0 = siteDoorLocal(s, 0), dp = siteToWorld(s, dl[0], dl[1]); let best = null, bd = 1e9;
    for (const r of Roads) { const d = r.line.dist(dp[0], dp[1], 40); if (d < bd) { bd = d; best = r.line.point(r.line.at); } }
    if (best) stroke(A, [siteToWorld(s, d0[0], d0[1]), dp, [best[0], best[1]]], 1.5, red, 0.7);
  }
  // cobbled square (+ inn forecourt, bridge approaches)
  const ell = (ctx, x, z, rx, rz, col) => { for (const [e, a] of [[1.6, 0.22], [0.8, 0.33], [0, 0.45]]) { ctx.fillStyle = col(a); const q = P(x, z); ctx.beginPath(); ctx.ellipse(q[0], q[1], (rx + e) * sc, (rz + e) * sc, 0, 0, TAU); ctx.fill(); } };
  ell(A, SQUARE.x, SQUARE.z, SQUARE.rx, SQUARE.rz, grn);
  stroke(A, [[BRIDGE.x - BRIDGE.len / 2 - 5, BRIDGE.z], [BRIDGE.x + BRIDGE.len / 2 + 5, BRIDGE.z]], BRIDGE.w, grn, 0.6);
  stroke(A, [[-6, -63.6], [-6, -68]], 3.6, grn, 0.6);
  for (const f of FIELDS) { A.fillStyle = blu(1); const a = P(f.x0, f.z0), b = P(f.x1, f.z1); A.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
  // bare ground: under buildings, river bed, lake
  for (const s of SITES) {
    if (s.id === 'tower') continue;
    const m = 0.5, pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(c => siteToWorld(s, c[0] * (s.w / 2 + m), c[1] * (s.d / 2 + m)));
    B.fillStyle = red(1); B.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) B.lineTo(q[0], q[1]); else B.moveTo(q[0], q[1]); }); B.closePath(); B.fill();
    stroke(B, pts.concat([pts[0]]), 0.6, red, 0.6);
    for (const b of s.bare || []) { const q = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]].map(c => siteToWorld(s, c[0], c[1])); B.fillStyle = red(1); B.beginPath(); q.forEach((p, i) => { const w = P(p[0], p[1]); if (i) B.lineTo(w[0], w[1]); else B.moveTo(w[0], w[1]); }); B.closePath(); B.fill(); }
  }
  ell(B, SITE.tower.x, SITE.tower.z, 4.6, 4.6, red);
  stroke(B, River.p, 9.4, red, 1.2);
  ell(B, LAKE.x, LAKE.z, LAKE.r + 4, LAKE.r + 4, red);
  const da = A.getImageData(0, 0, Rz, Rz).data, db = B.getImageData(0, 0, Rz, Rz).data, out = new Uint8Array(Rz * Rz * 4);
  for (let i = 0; i < Rz * Rz; i++) { out[i * 4] = da[i * 4]; out[i * 4 + 1] = da[i * 4 + 1]; out[i * 4 + 2] = da[i * 4 + 2]; out[i * 4 + 3] = db[i * 4]; }
  Terrain.splatData = out;
  G.splatTex = gfxDataTex(out, Rz, Rz, THREE.RGBAFormat, THREE.UnsignedByteType);
}

// second ground mask, painted once everything is placed: r shade under trees, g wet ground, b contact shade around solid things, a worn turf
function buildSplat2() {
  const Rz = K.splatRes, half = Terrain.half, sc = Rz / (2 * half);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = Rz; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#000'; x.fillRect(0, 0, Rz, Rz); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round'; return x; };
  const A = mk(), B = mk(), R = rng(4411);
  const P = (x, z) => [(x + half) * sc, (z + half) * sc];
  const ch = ['255,0,0', '0,255,0', '0,0,255'];
  // soft round stamp into one colour channel
  const blob = (ctx, c, x, z, rad, a, core) => {
    if (Math.abs(x) > half + rad || Math.abs(z) > half + rad) return;
    const q = P(x, z), g = ctx.createRadialGradient(q[0], q[1], rad * sc * (core || 0), q[0], q[1], rad * sc);
    g.addColorStop(0, `rgba(${ch[c]},${a})`); g.addColorStop(1, `rgba(${ch[c]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], rad * sc, 0, TAU); ctx.fill();
  };
  const line = (ctx, c, pts, w, a) => { ctx.strokeStyle = `rgba(${ch[c]},${a})`; ctx.lineWidth = w * sc; ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); };
  const V = World.vegInst || {};
  for (const [kind, rad, a] of [['oak', 7.0, 0.95], ['birch', 2.9, 0.6], ['pine', 2.7, 0.7]]) for (const t of V[kind] || []) blob(A, 0, t[0], t[2], rad * t[3], a, 0.25);
  for (const t of V.bush || []) blob(A, 0, t[0], t[2], 1.2 * t[3], 0.5, 0.2);
  // wet: river banks, lake shore, and scattered low spots along the roads
  for (const [w, a] of [[15, 0.25], [11.5, 0.35], [9, 0.4]]) line(A, 1, River.p, w, a);
  for (const [e, a] of [[5.5, 0.25], [3.5, 0.35], [2, 0.4]]) { const q = P(LAKE.x, LAKE.z); A.fillStyle = `rgba(${ch[1]},${a})`; A.beginPath(); A.arc(q[0], q[1], (LAKE.r + e) * sc, 0, TAU); A.fill(); }
  for (const rd of Roads) for (let d = 4; d < rd.line.len - 4; d += 3 + R() * 9) {
    const p = rd.line.point(d), o = R.s() * rd.w * 0.42; if (hyp(p[0] - SQUARE.x, p[1] - SQUARE.z) < 14) continue;
    blob(A, 1, p[0] - p[3] * o, p[1] + p[2] * o, 0.7 + R() * 1.2, 0.9, 0.3);
  }
  // contact shade and trampled earth around anything solid that stands on the ground
  for (const c of World.colliders) {
    if (Math.abs(c.x) > half || Math.abs(c.z) > half) continue;
    if (c.y0 > Terrain.y(c.x, c.z) + 0.7) continue;
    if (c.r !== undefined) { blob(B, 2, c.x, c.z, c.r + 0.9, 0.85, c.r / (c.r + 0.9) * 0.7); blob(B, 0, c.x, c.z, c.r + 0.5, 0.35, 0.3); }
    else {
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(k => [c.x + c.ax * k[0] * c.hx + c.bx * k[1] * c.hz, c.z + c.az * k[0] * c.hx + c.bz * k[1] * c.hz]);
      for (const [w, a] of [[2.2, 0.16], [1.3, 0.24], [0.6, 0.34]]) line(B, 2, pts, w, a);
      line(B, 0, pts, 1.0, 0.22);
    }
  }
  for (const s of SITES) {
    if (s.id === 'tower') continue;
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(c => siteToWorld(s, c[0] * s.w / 2, c[1] * s.d / 2));
    for (const [w, a] of [[3.4, 0.2], [2.0, 0.3], [0.9, 0.4]]) line(B, 2, pts, w, a);
    const dl = siteDoorLocal(s, 1.2), dp = siteToWorld(s, dl[0], dl[1]); blob(B, 0, dp[0], dp[1], 2.6, 0.8, 0.3);
  }
  blob(B, 0, SQUARE.x, SQUARE.z, Math.max(SQUARE.rx, SQUARE.rz) + 6, 0.5, 0.75);
  const da = A.getImageData(0, 0, Rz, Rz).data, db = B.getImageData(0, 0, Rz, Rz).data, out = new Uint8Array(Rz * Rz * 4);
  for (let i = 0; i < Rz * Rz; i++) { out[i * 4] = da[i * 4]; out[i * 4 + 1] = da[i * 4 + 1]; out[i * 4 + 2] = db[i * 4 + 2]; out[i * 4 + 3] = db[i * 4]; }
  G.splat2Tex = gfxDataTex(out, Rz, Rz, THREE.RGBAFormat, THREE.UnsignedByteType);
}

function buildWater() {
  const m = new Mesh(4096);
  m.mat(MAT.PLAIN, [1, 1, 1]);
  // river ribbon: 5 vertices across, flow direction stored in uv
  const step = 2.5, offs = [-6, -3, 0, 3, 6], rows = Math.floor((River.len - 6) / step);
  let start = 0; for (let k = 0; k <= rows; k++) { const p = River.point(k * step); if (hyp(p[0], p[1]) < 520) { start = k; break; } }
  const ring = [];
  for (let k = start; k <= rows; k++) {
    const s = k * step, p = River.point(s), wy = riverY(s), wide = 1 + 1.3 * smooth(125, 230, hyp(p[0], p[1])), nx = -p[3] * wide, nz = p[2] * wide, row = [];
    const endFade = sat((River.len - 6 - s) / 10);
    for (const o of offs) {
      const x = p[0] + nx * o, z = p[1] + nz * o, depth = sat((wy - Terrain.y(x, z)) / 0.9) * endFade;
      m.ao = depth; row.push(m.vert(x, wy, z, 0, 1, 0, p[2] * 1.0, p[3] * 1.0));
    }
    ring.push(row);
  }
  for (let k = 0; k < ring.length - 1; k++) for (let i = 0; i < offs.length - 1; i++) { const a = ring[k][i], b = ring[k + 1][i], c = ring[k + 1][i + 1], d = ring[k][i + 1]; m.tri(a, c, b); m.tri(a, d, c); }
  const riverItem = { kind: 'water', noShadow: true };
  const pack = new MeshPack(); pack.shadow = false;
  pack.add(m, riverItem);
  // lake sheet
  const lm = new Mesh(4096); lm.mat(MAT.PLAIN, [1, 1, 1]);
  const cs = 2.5, ext = LAKE.r + 12, n = Math.ceil(2 * ext / cs), ids = new Map();
  const lv = (i, j) => { const key = j * 4096 + i; let v = ids.get(key); if (v !== undefined) return v; const x = LAKE.x - ext + i * cs, z = LAKE.z - ext + j * cs; lm.ao = sat((LAKE.y - Terrain.y(x, z)) / 0.9); v = lm.vert(x, LAKE.y, z, 0, 1, 0, 0.25, 0.1); ids.set(key, v); return v; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = LAKE.x - ext + i * cs, z = LAKE.z - ext + j * cs;
    if (Math.min(terrainH(x, z), terrainH(x + cs, z), terrainH(x, z + cs), terrainH(x + cs, z + cs)) > LAKE.y + 0.05) continue;
    const a = lv(i, j), b = lv(i, j + 1), c = lv(i + 1, j + 1), d = lv(i + 1, j); lm.tri(a, b, c); lm.tri(a, c, d);
  }
  pack.add(lm, { kind: 'water', noShadow: true });
  pack.upload('water'); World.packs.push(pack);
}


// ---- 70_props.js ----
// ───────────────────────── world registry helpers + prop library ─────────────────────────
const COL = {
  wood: [0.96, 0.90, 0.83], woodDark: [0.68, 0.61, 0.55], woodPale: [1, 0.98, 0.92], timber: [0.82, 0.77, 0.72], timberDark: [0.62, 0.58, 0.55],
  iron: [0.72, 0.72, 0.76], steel: [1, 1, 1.02], bronze: [1.0, 0.80, 0.45], black: [0.22, 0.21, 0.2],
  linen: [0.92, 0.89, 0.80], wool: [0.78, 0.72, 0.62], red: [0.70, 0.17, 0.13], blue: [0.20, 0.32, 0.60], green: [0.24, 0.46, 0.22], gold: [0.92, 0.72, 0.22],
  purple: [0.42, 0.22, 0.50], clay: [0.74, 0.40, 0.26], wax: [0.95, 0.90, 0.75], hay: [1, 0.95, 0.8], leather: [0.45, 0.28, 0.16], fur: [0.42, 0.32, 0.24],
  bread: [0.62, 0.44, 0.24], cheese: [0.74, 0.62, 0.30], apple: [0.52, 0.13, 0.10], cabbage: [0.34, 0.46, 0.25], glass: [0.35, 0.55, 0.40], parchment: [0.90, 0.82, 0.62],
};
// colliders / lights / emitters are registered in world space using the mesh's current matrix
function addBoxCollider(m, x0, z0, x1, z1, y0, y1) {
  const M = m.m, c = m4.tp(M, [(x0 + x1) / 2, y0, (z0 + z1) / 2]), sx = hyp(M[0], M[2]) || 1, sz = hyp(M[8], M[10]) || 1;
  World.colliders.push({ x: c[0], z: c[2], hx: Math.abs(x1 - x0) / 2 * sx, hz: Math.abs(z1 - z0) / 2 * sz, ax: M[0] / sx, az: M[2] / sx, bx: M[8] / sz, bz: M[10] / sz, y0: c[1], y1: c[1] + (y1 - y0) });
}
function addCircleCollider(m, x, z, r, y0, y1) { const c = m4.tp(m.m, [x, y0, z]); World.colliders.push({ x: c[0], z: c[2], r, y0: c[1], y1: c[1] + (y1 - y0) }); }
const flick = (t, s) => 0.86 + 0.09 * Math.sin(t * 11.3 + s * 7.1) + 0.07 * Math.sin(t * 23.7 + s * 3.3) + 0.05 * Math.sin(t * 5.1 + s);
const LIGHT_KINDS = {
  fire: (l, e) => flick(e.time, l.seed),
  candle: (l, e) => e.windowGlow * (0.92 + 0.08 * Math.sin(e.time * 9 + l.seed * 5)),
  lantern: (l, e) => e.windowGlow * (0.94 + 0.06 * Math.sin(e.time * 7 + l.seed * 3)),
  daylight: (l, e) => e.day * 0.9 + 0.03,
  bonfire: (l, e) => (World.bonfire ? 1 : 0) * flick(e.time, l.seed),
};
function addLight(p, r, c, zone, kind) { const l = { p, r, c, zone: zone | 0, seed: World.lights.length * 1.37, kind }; const f = LIGHT_KINDS[kind]; l.power = e => f(l, e); World.lights.push(l); return l; }
const wp = (m, x, y, z) => m4.tp(m.m, [x, y, z]);
// emissive geometry (fire glow, candle wax tips ...): strength in HDR units
const emit = (m, k, fn) => { const a = m.m2, b = m.m3; m.m2 = a | 2; m.m3 = clamp(Math.round(k * 16), 1, 255); fn(); m.m2 = a; m.m3 = b; };
const at = (m, x, y, z, rot, fn) => { m.push().T(x, y, z); if (rot) m.RY(rot); fn(); m.pop(); };

const Props = {
  table(m, len, wid, h) {
    h = h || 0.76; m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, h - 0.06, -wid / 2, len / 2, h, wid / 2);
    m.mat(MAT.TIMBER, COL.wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * (len / 2 - 0.13), 0, sz * (wid / 2 - 0.11), 0.09, h - 0.06, 0.09, 12);
    m.box(-len / 2 + 0.13, 0.22, -0.03, len / 2 - 0.13, 0.30, 0.03);
    addBoxCollider(m, -len / 2, -wid / 2, len / 2, wid / 2, 0, h);
  },
  bench(m, len, noCol) {
    m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, 0.41, -0.16, len / 2, 0.46, 0.16);
    m.mat(MAT.TIMBER, COL.wood); for (const sx of [-1, 1]) m.cbox(sx * (len / 2 - 0.18), 0, 0, 0.06, 0.41, 0.28, 12);
    if (!noCol) addBoxCollider(m, -len / 2, -0.16, len / 2, 0.16, 0, 0.46);
  },
  stool(m) { m.mat(MAT.PLANKS, COL.wood); m.cyl(0, 0.40, 0, 0.17, 0.17, 0.05, 10, 3); m.mat(MAT.TIMBER, COL.wood); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; m.beam([Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15], [Math.cos(a) * 0.09, 0.4, Math.sin(a) * 0.09], 0.045, 0.045); } },
  chair(m) {
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.22, 0.42, -0.22, 0.22, 0.46, 0.22);
    m.mat(MAT.TIMBER, COL.wood);
    for (const sx of [-1, 1]) { m.cbox(sx * 0.19, 0, -0.19, 0.045, 0.42, 0.045, 12); m.cbox(sx * 0.19, 0, 0.19, 0.045, 1.0, 0.045, 4); }
    m.box(-0.19, 0.78, 0.17, 0.19, 0.95, 0.20); m.box(-0.19, 0.58, 0.175, 0.19, 0.66, 0.195);
  },
  // bed: head at -z
  bed(m, w, blanket, fur) {
    w = w || 1.0; const L = 2.0;
    m.mat(MAT.TIMBER, COL.woodDark);
    for (const sx of [-1, 1]) { m.cbox(sx * (w / 2), 0, -L / 2, 0.1, 1.0, 0.1, 4); m.cbox(sx * (w / 2), 0, L / 2, 0.1, 0.62, 0.1, 4); }
    m.mat(MAT.PLANKS, COL.woodDark);
    m.box(-w / 2, 0.45, -L / 2 - 0.03, w / 2, 0.95, -L / 2 + 0.03); m.box(-w / 2, 0.3, L / 2 - 0.03, w / 2, 0.56, L / 2 + 0.03);
    for (const sx of [-1, 1]) m.box(sx * w / 2 - 0.025, 0.22, -L / 2, sx * w / 2 + 0.025, 0.42, L / 2);
    m.mat(MAT.CLOTH, COL.linen); m.box(-w / 2 + 0.03, 0.30, -L / 2 + 0.04, w / 2 - 0.03, 0.50, L / 2 - 0.04, 4);
    m.ball(0, 0.56, -L / 2 + 0.28, w * 0.36, 0.07, 0.16, 8, 4);
    m.mat(MAT.CLOTH, blanket || COL.red); m.box(-w / 2 - 0.01, 0.34, -L / 2 + 0.6, w / 2 + 0.01, 0.53, L / 2 - 0.03, 4);
    if (fur) { m.mat(MAT.CLOTH, COL.fur, 0.6); m.box(-w / 2 + 0.06, 0.53, L / 2 - 0.8, w / 2 - 0.06, 0.56, L / 2 - 0.1, 4); }
    addBoxCollider(m, -w / 2, -L / 2, w / 2, L / 2, 0, 0.6);
  },
  chest(m, w) {
    w = w || 0.85; const d = 0.5, lh = 0.16, n = 6;
    m.mat(MAT.PLANKS, COL.woodDark); m.box(-w / 2, 0, -d / 2, w / 2, 0.42, d / 2);
    m.grid(1, n, (i, j) => { const a = j / n * PI; return m.vert((i ? 1 : -1) * w / 2, 0.42 + Math.sin(a) * lh, -Math.cos(a) * d / 2, 0, Math.sin(a) + 0.2, -Math.cos(a), i * w / m.tile, j / n * 0.8 / m.tile); });
    for (const sx of [-1, 1]) { const pts = []; for (let j = 0; j <= n; j++) { const a = j / n * PI; pts.push([sx * w / 2, 0.42 + Math.sin(a) * lh, -Math.cos(a) * d / 2]); } if (sx < 0) pts.reverse(); m.poly(pts); }
    m.mat(MAT.METAL, COL.iron);
    for (const sx of [-0.3, 0.3]) { m.box(sx * w - 0.03, 0, -d / 2 - 0.008, sx * w + 0.03, 0.43, -d / 2); m.box(sx * w - 0.03, 0, d / 2, sx * w + 0.03, 0.43, d / 2 + 0.008); }
    m.box(-0.05, 0.30, -d / 2 - 0.02, 0.05, 0.42, -d / 2);
    addBoxCollider(m, -w / 2, -d / 2, w / 2, d / 2, 0, 0.6);
  },
  barrel(m, r, h, noCol) {
    r = r || 0.33; h = h || 0.9;
    m.mat(MAT.PLANKS, COL.wood, 0.5); m.lathe([[r * 0.84, 0], [r * 0.97, h * 0.25], [r, h * 0.5], [r * 0.97, h * 0.75], [r * 0.84, h]], 12, 0);
    m.disc(0, h - 0.04, 0, r * 0.83, 12, 1);
    m.mat(MAT.METAL, COL.iron); for (const t of [0.12, 0.38, 0.62, 0.88]) { const rr = r * (0.84 + 0.16 * Math.sin(t * PI)) + 0.006; m.lathe([[rr, h * t - 0.025], [rr, h * t + 0.025]], 12, 0); }
    if (!noCol) addCircleCollider(m, 0, 0, r, 0, h);
  },
  keg(m, r, len) { m.push().T(0, r + 0.12, 0).RZ(PI / 2).T(-0, -len / 2, 0); Props.barrel(m, r, len, true); m.disc(0, 0.04, 0, r * 0.83, 12, -1); m.pop();
    m.mat(MAT.TIMBER, COL.wood); for (const s of [-1, 1]) { m.box(s * len * 0.3 - 0.04, 0, -r * 0.8, s * len * 0.3 + 0.04, 0.16, r * 0.8); } },
  crate(m, s, noCol) {
    s = s || 0.6; m.mat(MAT.PLANKS, COL.wood, 0.6); m.box(-s / 2, 0, -s / 2, s / 2, s, s / 2);
    m.mat(MAT.TIMBER, COL.wood); const e = 0.035, o = 0.012;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * (s / 2), 0, sz * (s / 2), e * 2, s + o, e * 2);
    for (const y of [0, s - e]) { m.box(-s / 2 - o, y, -s / 2 - o, s / 2 + o, y + e, -s / 2 + e); m.box(-s / 2 - o, y, s / 2 - e, s / 2 + o, y + e, s / 2 + o); m.box(-s / 2 - o, y, -s / 2, -s / 2 + e, y + e, s / 2); m.box(s / 2 - e, y, -s / 2, s / 2 + o, y + e, s / 2); }
    if (!noCol) addBoxCollider(m, -s / 2, -s / 2, s / 2, s / 2, 0, s);
  },
  sack(m, s, col) { s = s || 0.3; m.mat(MAT.CLOTH, col || COL.wool, 0.6); m.ball(0, s * 0.85, 0, s, s * 0.9, s * 0.8, 8, 6); m.cyl(0, s * 1.6, 0, s * 0.22, s * 0.3, s * 0.3, 6, 2); },
  pot(m, s, col) { s = s || 0.14; m.mat(MAT.PLAIN, col || COL.clay); m.lathe([[s * 0.5, 0], [s, s * 0.7], [s * 0.9, s * 1.5], [s * 0.55, s * 1.9], [s * 0.7, s * 2.1]], 8, 1); },
  jug(m, col) { m.mat(MAT.PLAIN, col || COL.clay); m.lathe([[0.05, 0], [0.085, 0.08], [0.07, 0.18], [0.035, 0.23], [0.045, 0.27]], 8, 1); m.mat(MAT.PLAIN, col || COL.clay); m.beam([0.07, 0.19, 0], [0.11, 0.13, 0], 0.02, 0.02); m.beam([0.11, 0.13, 0], [0.08, 0.07, 0], 0.02, 0.02); },
  bottle(m, col) { m.mat(MAT.PLAIN, col || COL.glass); m.lathe([[0.035, 0], [0.04, 0.02], [0.04, 0.14], [0.014, 0.20], [0.014, 0.27]], 7, 3); },
  mug(m) { m.mat(MAT.PLANKS, COL.wood, 0.3); m.lathe([[0.045, 0], [0.05, 0.12]], 8, 1); m.mat(MAT.PLAIN, [0.3, 0.2, 0.1]); m.disc(0, 0.10, 0, 0.044, 8, 1); m.mat(MAT.METAL, COL.iron); m.lathe([[0.052, 0.09], [0.052, 0.105]], 8, 0); },
  plate(m, col) { m.mat(MAT.PLAIN, col || [0.72, 0.60, 0.42]); m.lathe([[0.07, 0], [0.12, 0.018]], 10, 1); m.disc(0, 0.004, 0, 0.07, 10, 1); },
  bowl(m, col) { m.mat(MAT.PLAIN, col || [0.60, 0.42, 0.26]); m.lathe([[0.04, 0], [0.09, 0.05], [0.10, 0.07]], 9, 1); m.disc(0, 0.045, 0, 0.085, 9, 1); },
  loaf(m) { m.mat(MAT.PLAIN, COL.bread); m.ball(0, 0.045, 0, 0.13, 0.055, 0.08, 8, 5); },
  cheese(m) { m.mat(MAT.PLAIN, COL.cheese); m.cyl(0, 0, 0, 0.12, 0.12, 0.07, 10, 2); },
  apple(m, col) { m.mat(MAT.PLAIN, col || COL.apple); m.ball(0, 0.04, 0, 0.04, 0.04, 0.04, 6, 4); },
  cabbage(m) { m.mat(MAT.PLAIN, COL.cabbage); m.ball(0, 0.09, 0, 0.1, 0.09, 0.1, 7, 5); },
  book(m, col, w) { m.mat(MAT.CLOTH, col || COL.red, 0.5); m.box(-0.09, 0, -0.12, 0.09, w || 0.04, 0.12); m.mat(MAT.PLAIN, COL.parchment); m.box(-0.082, 0.004, -0.115, 0.088, (w || 0.04) - 0.004, 0.118, 4 | 8 | 1); },
  // candle with flame + light. returns nothing; registers emitter
  candle(m, ctx, tall) {
    const h = tall ? 0.22 : 0.10; m.mat(MAT.METAL, COL.bronze); m.lathe([[0.045, 0], [0.012, 0.02], [0.012, 0.035], [0.03, 0.045]], 7, 0);
    m.mat(MAT.PLAIN, COL.wax); m.cyl(0, 0.04, 0, 0.014, 0.012, h, 6, 2);
    const p = wp(m, 0, 0.04 + h + 0.03, 0);
    World.emitters.push({ type: 'candle', p, zone: ctx.zone, always: !!ctx.always });
    if (ctx.candleLight !== false) addLight(wp(m, 0, 0.04 + h + 0.12, 0), 4.2, [1.5, 0.95, 0.42], ctx.zone, 'candle');
  },
  // hanging iron lantern (origin at the hook)
  lantern(m, ctx, kind) {
    m.mat(MAT.METAL, COL.black); m.box(-0.008, -0.16, -0.008, 0.008, 0, 0.008);
    m.lathe([[0.02, -0.19], [0.085, -0.22]], 4, 0); m.lathe([[0.085, -0.44], [0.06, -0.46]], 4, 1);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, x = Math.cos(a) * 0.082, z = Math.sin(a) * 0.082; m.box(x - 0.007, -0.44, z - 0.007, x + 0.007, -0.22, z + 0.007); }
    const p = wp(m, 0, -0.34, 0);
    World.emitters.push({ type: 'lantern', p, zone: ctx.zone });
    addLight(p, ctx.zone ? 6.5 : 9, ctx.zone ? [2.3, 1.35, 0.55] : [3.4, 1.9, 0.75], ctx.zone, kind || 'lantern');
  },
  // open shelf unit against a wall (back at +z), filled by cb(level, y)
  shelf(m, len, h, levels, depth, fill) {
    depth = depth || 0.32; m.mat(MAT.PLANKS, COL.wood);
    for (const sx of [-1, 1]) m.box(sx * len / 2 - 0.025, 0, -depth / 2, sx * len / 2 + 0.025, h, depth / 2);
    for (let i = 0; i <= levels; i++) { const y = 0.08 + (h - 0.12) * i / levels; m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, y, -depth / 2, len / 2, y + 0.03, depth / 2); if (fill && i < levels) fill(i, y + 0.03); }
    m.mat(MAT.PLANKS, COL.woodDark); m.box(-len / 2, 0, depth / 2 - 0.02, len / 2, h, depth / 2);
    addBoxCollider(m, -len / 2, -depth / 2, len / 2, depth / 2, 0, h);
  },
  // random tableware along a strip
  clutter(m, R, x0, x1, y, z, kinds, n, ctx) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + 0.5) / n) + R.s() * 0.05, k = R.pick(kinds);
      at(m, x, y, z + R.s() * 0.05, R() * TAU, () => {
        if (k === 'mug') Props.mug(m); else if (k === 'plate') { Props.plate(m); if (R() < 0.6) at(m, 0, 0.01, 0, 0, () => R() < 0.5 ? Props.apple(m) : Props.loaf(m)); }
        else if (k === 'bowl') Props.bowl(m); else if (k === 'loaf') Props.loaf(m); else if (k === 'cheese') Props.cheese(m); else if (k === 'jug') Props.jug(m);
        else if (k === 'bottle') Props.bottle(m, R.pick([COL.glass, [0.45, 0.25, 0.12], [0.2, 0.3, 0.5]])); else if (k === 'pot') Props.pot(m, 0.07 + R() * 0.05, R.pick([COL.clay, [0.55, 0.5, 0.42], [0.3, 0.4, 0.5]]));
        else if (k === 'book') Props.book(m, R.pick([COL.red, COL.blue, COL.green, COL.leather, COL.purple]), 0.03 + R() * 0.03);
        else if (k === 'candle' && ctx) Props.candle(m, ctx, R() < 0.5); else if (k === 'apple') Props.apple(m, R() < 0.5 ? COL.apple : [0.6, 0.7, 0.2]); else if (k === 'cabbage') Props.cabbage(m);
      });
    }
  },
  rug(m, w, l, col) { m.mat(MAT.STRIPES, col || COL.red, 0.6); m.quad([-w / 2, 0.015, -l / 2], [-w / 2, 0.015, l / 2], [w / 2, 0.015, l / 2], [w / 2, 0.015, -l / 2], 0, 0, w / 0.6, l / 0.6); },
  cauldron(m, r) { r = r || 0.24; m.mat(MAT.METAL, COL.black); m.lathe([[r * 0.5, 0], [r * 0.95, r * 0.4], [r, r * 0.9], [r * 0.86, r * 1.25], [r * 0.92, r * 1.32]], 10, 1); m.mat(MAT.PLAIN, [0.35, 0.3, 0.18]); m.disc(0, r * 1.1, 0, r * 0.88, 10, 1); },
  logs(m, n, len, r) { m.mat(MAT.BARK, [1, 1, 1], 0.5); for (let i = 0; i < n; i++) { m.push().T(0, r + 0.01, (i - (n - 1) / 2) * r * 2.05).RZ(PI / 2).T(0, -len / 2, 0); m.cyl(0, 0, 0, r, r * 0.95, len, 7, 0); m.mat(MAT.PLAIN, [0.78, 0.62, 0.42]); m.disc(0, len, 0, r * 0.95, 7, 1); m.disc(0, 0, 0, r, 7, -1); m.mat(MAT.BARK, [1, 1, 1], 0.5); m.pop(); } },
  woodpile(m, cols, rows, len) { const r = 0.09; for (let j = 0; j < rows; j++) { m.push().T(0, j * r * 1.85, (j % 2) * r * 0.5); Props.logs(m, cols - (j % 2), len, r); m.pop(); } addBoxCollider(m, -len / 2, -cols * r, len / 2, cols * r, 0, rows * r * 1.9); },
  haybale(m) { m.mat(MAT.THATCH, COL.hay, 0.5); m.push().T(0, 0.45, 0).RZ(PI / 2).T(0, -0.5, 0); m.cyl(0, 0, 0, 0.45, 0.45, 1.0, 12, 3); m.pop(); addBoxCollider(m, -0.5, -0.45, 0.5, 0.45, 0, 0.9); },
  haystack(m, r) { m.mat(MAT.THATCH, COL.hay, 0.8); m.lathe([[r, 0], [r * 1.02, r * 0.5], [r * 0.8, r * 1.1], [r * 0.3, r * 1.6], [0.02, r * 1.8]], 12, 0); addCircleCollider(m, 0, 0, r * 0.9, 0, r * 1.5); },
  wheel(m, r, w) {       // lies in the XY plane, axle along z
    m.mat(MAT.TIMBER, COL.woodDark); m.push().RX(PI / 2).T(0, -w / 2, 0);
    m.lathe([[r - 0.07, 0], [r, 0], [r, w], [r - 0.07, w], [r - 0.07, 0]], 14, 0); m.cyl(0, -0.02, 0, 0.09, 0.09, w + 0.04, 8, 3);
    m.pop(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; m.beam([Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0], [Math.cos(a) * (r - 0.06), Math.sin(a) * (r - 0.06), 0], 0.045, 0.045); }
    m.mat(MAT.METAL, COL.iron); m.push().RX(PI / 2).T(0, -w / 2 - 0.004, 0); m.lathe([[r + 0.006, 0], [r + 0.006, w + 0.008]], 14, 0); m.pop();
  },
  cart(m, hay) {
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.75, 0.62, -1.2, 0.75, 0.70, 1.2);
    for (const sx of [-1, 1]) m.box(sx * 0.75 - 0.03, 0.70, -1.2, sx * 0.75 + 0.03, 1.08, 1.2);
    m.box(-0.75, 0.70, 1.17, 0.75, 1.08, 1.23); m.box(-0.75, 0.70, -1.23, 0.75, 0.95, -1.17);
    m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.9, 0.52, -0.05, 0.9, 0.62, 0.05);
    for (const sx of [-1, 1]) { m.beam([sx * 0.45, 0.6, -1.2], [sx * 0.42, 0.42, -2.9], 0.07, 0.07); at(m, sx * 0.92, 0.57, 0, PI / 2, () => Props.wheel(m, 0.57, 0.09)); }
    if (hay) { m.mat(MAT.THATCH, COL.hay, 0.8); m.ball(0, 0.95, 0, 0.7, 0.5, 1.1, 10, 6); }
    addBoxCollider(m, -0.95, -1.25, 0.95, 1.25, 0, 1.1);
  },
  fencePost(m, h) { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.1, h + 0.3, 0.1, 4); },
  gravestone(m, R) {
    const h = 0.55 + R() * 0.4, w = 0.42 + R() * 0.16; m.push().RZ(R.s() * 0.08).RX(R.s() * 0.1);
    m.mat(MAT.ROCK, [0.95, 0.95, 0.95], 0.5); m.box(-w / 2, -0.2, -0.06, w / 2, h, 0.06);
    if (R() < 0.6) { m.push().T(0, h, 0).RX(PI / 2).T(0, -0.06, 0); m.cyl(0, 0, 0, w / 2, w / 2, 0.12, 8, 3); m.pop(); } else { m.box(-w / 2 - 0.05, h, -0.07, w / 2 + 0.05, h + 0.09, 0.07); }
    m.pop();
  },
  anvil(m) {
    m.mat(MAT.BARK, [0.8, 0.75, 0.7], 0.7); m.cyl(0, 0, 0, 0.3, 0.27, 0.5, 9, 2);
    m.mat(MAT.METAL, [0.85, 0.85, 0.9]); m.box(-0.16, 0.5, -0.1, 0.16, 0.56, 0.1); m.box(-0.09, 0.56, -0.06, 0.09, 0.68, 0.06); m.box(-0.26, 0.68, -0.085, 0.22, 0.80, 0.085);
    m.push().T(-0.26, 0.74, 0).RZ(PI / 2); m.lathe([[0.06, 0], [0.012, 0.22]], 7, 0); m.pop();
    addCircleCollider(m, 0, 0, 0.32, 0, 0.8);
  },
  hammer(m) { m.mat(MAT.TIMBER, COL.wood); m.box(-0.015, 0, -0.015, 0.015, 0.32, 0.015); m.mat(MAT.METAL, COL.iron); m.box(-0.06, 0.29, -0.03, 0.06, 0.35, 0.03); },
  sword(m) { m.mat(MAT.METAL, COL.steel); m.box(-0.022, 0.16, -0.004, 0.022, 0.92, 0.004); m.poly([[-0.022, 0.92, 0], [0.022, 0.92, 0], [0, 1.0, 0]]); m.poly([[0.022, 0.92, 0], [-0.022, 0.92, 0], [0, 1.0, 0]]); m.mat(MAT.METAL, COL.bronze); m.box(-0.09, 0.14, -0.012, 0.09, 0.165, 0.012); m.mat(MAT.PLAIN, COL.leather); m.box(-0.014, 0, -0.014, 0.014, 0.14, 0.014); },
  shield(m, col) { m.push().RX(PI / 2); m.mat(MAT.PLANKS, col || COL.red, 0.5); m.cyl(0, 0, 0, 0.33, 0.33, 0.03, 12, 3); m.mat(MAT.METAL, COL.iron); m.lathe([[0.335, -0.004], [0.335, 0.034]], 12, 0); m.ball(0, 0.035, 0, 0.07, 0.04, 0.07, 8, 4); m.pop(); },
  signPost(m, n) { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.11, 2.6, 0.11, 4); m.mat(MAT.PLANKS, COL.wood); for (let i = 0; i < n; i++) { m.push().T(0, 2.05 - i * 0.26, 0).RY(i * 1.9 + 0.4); m.box(0.02, 0, -0.015, 0.85, 0.18, 0.015); m.poly([[0.85, 0.18, 0.015], [0.85, 0, 0.015], [0.98, 0.09, 0.015]]); m.poly([[0.85, 0, -0.015], [0.85, 0.18, -0.015], [0.98, 0.09, -0.015]]); m.pop(); } addCircleCollider(m, 0, 0, 0.12, 0, 2.3); },
  // street lantern on a post with a bracket
  lampPost(m, ctx) {
    m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, -0.3, 0, 0.13, 3.3, 0.13, 4); m.beam([0, 2.85, 0], [0.62, 2.85, 0], 0.08, 0.08); m.beam([0, 2.35, 0], [0.42, 2.82, 0], 0.06, 0.06);
    at(m, 0.55, 2.81, 0, 0, () => Props.lantern(m, ctx)); addCircleCollider(m, 0, 0, 0.14, 0, 3);
  },
  // market stall with striped awning; goods callback places wares on the counter (y = 0.8)
  stall(m, col, goods) {
    const w = 2.6, d = 1.5;
    m.mat(MAT.TIMBER, COL.timber);
    for (const sx of [-1, 1]) { m.cbox(sx * w / 2, 0, -d / 2, 0.09, 2.05, 0.09, 4); m.cbox(sx * w / 2, 0, d / 2, 0.09, 2.5, 0.09, 4); m.beam([sx * w / 2, 2.02, -d / 2], [sx * w / 2, 2.47, d / 2], 0.06, 0.07); }
    m.beam([-w / 2, 2.02, -d / 2], [w / 2, 2.02, -d / 2], 0.06, 0.07); m.beam([-w / 2, 2.47, d / 2], [w / 2, 2.47, d / 2], 0.06, 0.07);
    m.mat(MAT.PLANKS, COL.wood); m.box(-w / 2, 0.74, -d / 2, w / 2, 0.80, d / 2 - 0.3); m.box(-w / 2, 0.1, -d / 2 + 0.02, w / 2, 0.74, -d / 2 + 0.05);
    m.mat(MAT.STRIPES, col, 0.9); const e = 0.3;
    m.quad2([-w / 2 - e, 2.56, d / 2 + 0.12], [-w / 2 - e, 1.98, -d / 2 - e], [w / 2 + e, 1.98, -d / 2 - e], [w / 2 + e, 2.56, d / 2 + 0.12], 0, 0, (w + 2 * e) / 0.9, 2.2);
    m.quad2([-w / 2 - e, 1.98, -d / 2 - e], [-w / 2 - e, 1.78, -d / 2 - e - 0.02], [w / 2 + e, 1.78, -d / 2 - e - 0.02], [w / 2 + e, 1.98, -d / 2 - e], 0, 0, (w + 2 * e) / 0.9, 0.3);
    if (goods) goods(0.80);
    addBoxCollider(m, -w / 2, -d / 2, w / 2, d / 2 - 0.3, 0, 1);
  },
  well(m) {
    m.mat(MAT.STONE, [1, 1, 1], 0.7); m.lathe([[1.0, -0.4], [1.0, 0.85], [0.92, 0.9], [0.72, 0.9], [0.72, -0.4]], 14, 0);
    m.mat(MAT.PLAIN, [0.05, 0.09, 0.10]); m.disc(0, 0.15, 0, 0.72, 14, 1);
    m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) m.cbox(sx * 0.95, 0.6, 0, 0.14, 2.0, 0.14); m.beam([-0.95, 1.9, 0], [0.95, 1.9, 0], 0.1, 0.1);
    m.push().T(0, 1.9, 0).RZ(PI / 2).T(0, -0.6, 0); m.mat(MAT.TIMBER, COL.wood); m.cyl(0, 0, 0, 0.09, 0.09, 1.2, 8, 3); m.pop();
    m.mat(MAT.CLOTH, [0.6, 0.5, 0.35], 0.3); m.box(-0.012, 1.0, -0.012, 0.012, 1.85, 0.012);
    at(m, 0, 0.78, 0, 0, () => { m.mat(MAT.PLANKS, COL.wood, 0.4); m.lathe([[0.12, 0], [0.15, 0.24]], 9, 1); });
    // little shingled roof
    m.mat(MAT.SHINGLE, [0.85, 0.75, 0.65], 0.6);
    m.quad2([1.25, 3.05, 0], [1.25, 2.5, -0.8], [-1.25, 2.5, -0.8], [-1.25, 3.05, 0], 0, 0, 2.5 / 1.2, 1 / 1.2);
    m.quad2([-1.25, 3.05, 0], [-1.25, 2.5, 0.8], [1.25, 2.5, 0.8], [1.25, 3.05, 0], 0, 0, 2.5 / 1.2, 1 / 1.2);
    m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) { m.beam([sx * 0.95, 2.55, -0.7], [sx * 0.95, 3.0, 0], 0.07, 0.08); m.beam([sx * 0.95, 2.55, 0.7], [sx * 0.95, 3.0, 0], 0.07, 0.08); m.beam([sx * 0.95, 2.52, -0.72], [sx * 0.95, 2.52, 0.72], 0.07, 0.08); }
    addCircleCollider(m, 0, 0, 1.05, 0, 1.2);
  },
};


// ---- 71_house.js ----
// ───────────────────────── house generator: shell, timber frame, roof, openings, interior hooks ─────────────────────────
const WALLS = {
  front: { n: [0, 0, -1], u: [-1, 0, 0], start: (w, d) => [w / 2, 0, -d / 2], len: (w, d) => w, toU: (p, w, d) => w / 2 - p },
  back: { n: [0, 0, 1], u: [1, 0, 0], start: (w, d) => [-w / 2, 0, d / 2], len: (w, d) => w, toU: (p, w, d) => p + w / 2 },
  left: { n: [-1, 0, 0], u: [0, 0, 1], start: (w, d) => [-w / 2, 0, -d / 2], len: (w, d) => d, toU: (p, w, d) => p + d / 2 },
  right: { n: [1, 0, 0], u: [0, 0, -1], start: (w, d) => [w / 2, 0, d / 2], len: (w, d) => d, toU: (p, w, d) => d / 2 - p },
};
World.doors = []; World.spots = {}; World.houses = {};
const INT_AO = 0.30;       // sky visibility of interior surfaces
function addFloor(m, x0, z0, x1, z1, y, y2, axis) {
  const M = m.m, c = m4.tp(M, [(x0 + x1) / 2, y, (z0 + z1) / 2]), sx = hyp(M[0], M[2]) || 1, sz = hyp(M[8], M[10]) || 1;
  const f = { x: c[0], z: c[2], hx: Math.abs(x1 - x0) / 2, hz: Math.abs(z1 - z0) / 2, ax: M[0] / sx, az: M[2] / sx, bx: M[8] / sz, bz: M[10] / sz, y: c[1] };
  if (y2 !== undefined) { f.y2 = c[1] + (y2 - y); f.axis = axis; }        // ramp: y at -h .. y2 at +h along local x ('x') or z ('z')
  World.floors.push(f); return f;
}
function siteMatrix(site, y) { const M = m4.create(); m4.translate(M, site.x, y, site.z); m4.rotY(M, -site.yaw); return M; }

function buildHouse(site, spec) {
  const kit = typeof kitWanted === 'function' && kitWanted(site, spec);      // kit-built shell (71_kithouse.js) or the procedural one below
  if (kit) spec = kitSpec(site, spec);
  const w = site.w, d = site.d, H = spec.H || 2.6, t = 0.3, P = (spec.pitch || 48) * PI / 180, tanP = Math.tan(P), hd = d / 2;
  const floorY = site.y + 0.32, zone = World.zones.length + 1, R = rng(site.x * 131 + site.z * 17 + 5);
  const Ms = siteMatrix(site, floorY);
  const ext = new Mesh(4096), int = new Mesh(4096), glow = new Mesh(256);
  for (const m of [ext, int, glow]) { m.m = Ms.slice(); m.dirty = true; m.seed = (site.x * 977 + site.z * 31) | 0; }
  const ridgeY = H + hd * tanP, roofY = z => H + (hd - Math.abs(z)) * tanP;
  const zinfo = { id: zone, site, y0: floorY - 0.7, y1: floorY + ridgeY + 1.5, hw: w / 2, hd };
  World.zones.push(zinfo);
  const inner = () => { ext.m1 = zone; ext.ao = INT_AO; }, outer = () => { ext.m1 = 0; ext.ao = 1; };
  int.m1 = zone; int.ao = INT_AO;
  const walls = spec.walls || 'timber', stoneH = walls === 'half' ? (spec.stoneH || 1.05) : 0;
  const plaster = spec.plaster || [1, 1, 1], timberC = spec.timber || COL.timberDark;
  const outerMat = v => { if (walls === 'stone' || v < stoneH) ext.mat(MAT.STONE, spec.stoneCol || [1, 1, 1]); else if (walls === 'log') ext.mat(MAT.TIMBER, [0.9, 0.84, 0.78], 1.6); else ext.mat(MAT.PLASTER, plaster); };
  const innerMat = () => { if (walls === 'stone') ext.mat(MAT.STONE, [0.95, 0.93, 0.9]); else if (walls === 'log') ext.mat(MAT.TIMBER, [0.95, 0.88, 0.8], 1.6); else ext.mat(MAT.PLASTER, [0.97, 0.93, 0.86]); };
  const openings = { front: [], back: [], left: [], right: [] };
  for (const o of spec.doors || []) openings[o.wall].push({ door: true, pos: o.pos || 0, w: o.w || 1.05, v0: 0, v1: o.h || 2.05, def: o });
  for (const o of spec.windows || []) openings[o.wall].push({ pos: o.pos, w: o.w || 0.9, v0: o.sill === undefined ? 1.0 : o.sill, v1: (o.sill === undefined ? 1.0 : o.sill) + (o.h || 1.0), def: o });
  const aoOut = v => v > H - 0.7 ? lerp(1, 0.55, (v - (H - 0.7)) / 0.7) : v < 0.45 ? lerp(0.7, 1, v / 0.45) : 1;
  const doorList = [];

  for (const wn of ['front', 'back', 'left', 'right']) {
    const W = WALLS[wn], L = W.len(w, d), gable = wn === 'left' || wn === 'right', Hin = gable ? H : H + t * tanP;
    const wb = m4.create(); m4.basis(wb, W.u, [0, 1, 0], W.n, W.start(w, d));
    for (const m of [ext, int, glow]) { m.push(); m4.mul(m.m, m.m, wb); m.dirty = true; }
    const ops = openings[wn].map(o => Object.assign(o, { u0: W.toU(o.pos, w, d) - o.w / 2, u1: W.toU(o.pos, w, d) + o.w / 2 })).sort((a, b) => a.u0 - b.u0);
    const inOp = (u, v) => ops.some(o => u > o.u0 && u < o.u1 && v > o.v0 && v < o.v1);
    const ub = [0, t, L - t, L], vb = [0, 0.45, H - 0.7, H]; if (stoneH) vb.push(stoneH);
    for (const o of ops) { ub.push(o.u0, o.u1); vb.push(o.v0, o.v1); }
    const us = [...new Set(ub.map(x => +x.toFixed(4)))].sort((a, b) => a - b), vs = [...new Set(vb.map(x => +x.toFixed(4)))].filter(v => v >= 0 && v <= H).sort((a, b) => a - b);
    // outer + inner faces
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < vs.length - 1; j++) {
      const u0 = us[i], u1 = us[i + 1], v0 = vs[j], v1 = vs[j + 1];
      if (inOp((u0 + u1) / 2, (v0 + v1) / 2)) continue;
      outer(); outerMat((v0 + v1) / 2); ext.grad = [aoOut(v1), aoOut(v0)];
      ext.quad([u0, v1, 0], [u0, v0, 0], [u1, v0, 0], [u1, v1, 0], u0 / ext.tile, (H - v1) / ext.tile, u1 / ext.tile, (H - v0) / ext.tile);
      if (u0 >= t - 0.001 && u1 <= L - t + 0.001) {
        const top = (j === vs.length - 2) ? Hin : v1;
        inner(); innerMat(); ext.grad = [v1 > H - 0.4 ? 0.8 : 1, v0 < 0.3 ? 0.78 : 1];
        ext.quad([u1, top, -t], [u1, v0, -t], [u0, v0, -t], [u0, top, -t], u1 / ext.tile, (H - top) / ext.tile, u0 / ext.tile, (H - v0) / ext.tile);
      }
    }
    ext.grad = null;
    if (gable) {          // gable triangles
      const ay = H + L / 2 * tanP;
      outer(); outerMat(H + 1); if (walls === 'half' || walls === 'timber') ext.mat(MAT.PLASTER, plaster);
      ext.poly([[0, H, 0], [L, H, 0], [L / 2, ay, 0]]);
      inner(); innerMat(); ext.poly([[L - t * 0.2, H, -t], [t * 0.2, H, -t], [L / 2, ay, -t]]);
      if (walls !== 'stone' && walls !== 'log') {     // decorative truss
        outer(); ext.mat(MAT.TIMBER, timberC);
        ext.box(L / 2 - 0.08, H, 0, L / 2 + 0.08, ay - 0.25, 0.035, 16);
        const cy = H + (ay - H) * 0.45, cx = (cy - H) / tanP; ext.box(cx, cy - 0.07, 0, L - cx, cy + 0.07, 0.035, 16);
        for (const s of [-1, 1]) ext.beam([L / 2 + s * (L / 2 - 0.5), H + 0.08, 0.018], [L / 2 + s * 0.1, cy - 0.05, 0.018], 0.035, 0.13);
      }
    }
    // openings: reveals, frames, shutters, panes
    for (const o of ops) {
      const { u0, u1, v0, v1 } = o;
      outer(); ext.ao = 0.75; if (walls === 'stone') ext.mat(MAT.STONE, [0.9, 0.9, 0.9]); else ext.mat(MAT.TIMBER, timberC);
      ext.quad([u0, v1, 0], [u0, v0, 0], [u0, v0, -t], [u0, v1, -t]); ext.quad([u1, v1, -t], [u1, v0, -t], [u1, v0, 0], [u1, v1, 0]);
      ext.quad([u0, v1, 0], [u0, v1, -t], [u1, v1, -t], [u1, v1, 0]);
      if (!o.door) ext.quad([u0, v0, -t], [u0, v0, 0], [u1, v0, 0], [u1, v0, -t]);
      ext.ao = 1; ext.mat(MAT.TIMBER, timberC);
      if (o.door) {
        // frame + lintel + stone steps outside
        ext.box(u0 - 0.13, 0, 0, u0, v1 + 0.14, 0.05, 16); ext.box(u1, 0, 0, u1 + 0.13, v1 + 0.14, 0.05, 16); ext.box(u0, v1, 0, u1, v1 + 0.14, 0.05, 16);
        ext.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); ext.box(u0 - 0.35, -0.5, 0, u1 + 0.35, -0.02, 0.5); ext.box(u0 - 0.2, -0.5, 0.5, u1 + 0.2, -0.17, 0.95);
        addFloor(ext, u0 - 0.35, -t, u1 + 0.35, 0.5, -0.01); addFloor(ext, u0 - 0.2, 0.5, u1 + 0.2, 0.95, -0.17);
        inner(); if (spec.floor === 'stone') ext.mat(MAT.COBBLE, [1, 1, 1], 1.4); else ext.mat(MAT.PLANKS, COL.woodDark);
        ext.quad([u0, 0.02, -t], [u0, 0.02, 0], [u1, 0.02, 0], [u1, 0.02, -t]);
        const hinge = m4.tp(ext.m, [u0 + 0.02, 0, -t / 2]), dirU = m4.td(ext.m, [1, 0, 0]);
        const dd = { site, zone, hinge, yaw: Math.atan2(dirU[0], -dirU[2]) - PI / 2, w: o.w - 0.04, h: v1 - 0.03, open: 0, c: m4.tp(ext.m, [(u0 + u1) / 2, 1, -t / 2]), out: m4.tp(ext.m, [(u0 + u1) / 2, -0.3, 1.6]), ins: m4.tp(ext.m, [(u0 + u1) / 2, 0, -t - 1.0]), baseM: m4.mul(m4.create(), ext.m, m4.translate(m4.create(), u0 + 0.02, 0, -t / 2)) };
        if (!o.def.noLeaf) World.doors.push(dd); doorList.push(dd);
        if (o.def.lamp !== false) at(ext, u1 + 0.55, v1 + 0.25, 0.02, 0, () => { ext.mat(MAT.METAL, COL.black); ext.beam([0, 0.1, 0], [0, 0.1, 0.36], 0.03, 0.03); at(ext, 0, 0.1, 0.34, 0, () => Props.lantern(ext, { zone: 0 })); });
      } else {
        const z = -t * 0.45, uc = (u0 + u1) / 2;
        ext.box(u0, v0, z - 0.03, u0 + 0.05, v1, z + 0.03); ext.box(u1 - 0.05, v0, z - 0.03, u1, v1, z + 0.03); ext.box(u0, v1 - 0.05, z - 0.03, u1, v1, z + 0.03); ext.box(u0, v0, z - 0.03, u1, v0 + 0.05, z + 0.03);
        ext.box(uc - 0.02, v0, z - 0.02, uc + 0.02, v1, z + 0.02); ext.box(u0, v0 + (v1 - v0) * 0.56 - 0.02, z - 0.02, u1, v0 + (v1 - v0) * 0.56 + 0.02, z + 0.02);
        if (walls === 'stone') { ext.mat(MAT.STONE, [0.85, 0.85, 0.85], 0.8); ext.box(u0 - 0.1, v0 - 0.1, 0, u1 + 0.1, v0, 0.08, 16); }
        else {
          ext.box(u0 - 0.1, v0 - 0.09, 0, u1 + 0.1, v0, 0.09, 16); ext.box(u0 - 0.11, v0, 0, u0, v1 + 0.11, 0.045, 16); ext.box(u1, v0, 0, u1 + 0.11, v1 + 0.11, 0.045, 16); ext.box(u0, v1, 0, u1, v1 + 0.11, 0.045, 16);
          if (o.def.shutters !== false) { const sw = (u1 - u0) / 2; ext.mat(MAT.PLANKS, spec.shutter || [0.45, 0.55, 0.42], 0.5);
            for (const [a, b] of [[u0 - 0.11 - sw, u0 - 0.11], [u1 + 0.11, u1 + 0.11 + sw]]) { ext.box(a, v0, 0.01, b, v1, 0.05, 16); ext.mat(MAT.TIMBER, timberC); ext.box(a, v0 + 0.12, 0.05, b, v0 + 0.2, 0.065, 16); ext.box(a, v1 - 0.2, 0.05, b, v1 - 0.12, 0.065, 16); ext.mat(MAT.PLANKS, spec.shutter || [0.45, 0.55, 0.42], 0.5); } }
        }
        glow.mat(MAT.PLAIN, o.def.glass || [1.0, 0.66, 0.30]); glow.m3 = 34;
        glow.quad([u0, v1, z - 0.04], [u0, v0, z - 0.04], [u1, v0, z - 0.04], [u1, v1, z - 0.04], 0, 0, (u1 - u0) / 0.9, (v1 - v0) / 0.9);
        addLight(m4.tp(ext.m, [uc, (v0 + v1) / 2 + 0.1, -t - 0.7]), 5.6, [1.5, 1.42, 1.28], zone, 'daylight');
      }
    }
    // timber frame on the outside face
    if (walls === 'timber' || walls === 'half') {
      outer(); ext.mat(MAT.TIMBER, timberC);
      const z1 = 0.035, posts = [0.09, L - 0.09], solid = [];
      let cur = 0; for (const o of ops) { if (o.door || true) { solid.push([cur, o.u0, o]); cur = o.u1; } } solid.push([cur, L, null]);
      for (const o of ops) if (o.door) { /* door frame already there */ } else { posts.push(o.u0 - 0.17, o.u1 + 0.17); }
      const sorted = posts.filter(p => p > 0 && p < L).sort((a, b) => a - b), all = [];
      for (let i = 0; i < sorted.length; i++) { all.push(sorted[i]); if (i < sorted.length - 1) { const gap = sorted[i + 1] - sorted[i]; const blocked = ops.some(o => o.u0 < sorted[i + 1] && o.u1 > sorted[i]); if (!blocked && gap > 2.1) { const n = Math.ceil(gap / 1.7); for (let k = 1; k < n; k++) all.push(sorted[i] + gap * k / n); } } }
      for (const p of all) { if (ops.some(o => p > o.u0 - 0.05 && p < o.u1 + 0.05)) continue; ext.box(p - 0.08, stoneH, 0, p + 0.08, H, z1, 16 | 4); }
      ext.box(0, H - 0.17, 0, L, H, z1 + 0.005, 16);
      const rail = (v, skipWin) => { let a = 0; const cuts = ops.filter(o => o.door || (skipWin && v > o.v0 - 0.01 && v < o.v1)).sort((x, y) => x.u0 - y.u0); for (const o of cuts) { if (o.u0 - a > 0.2) ext.box(a, v, 0, o.u0, v + 0.14, z1, 16); a = o.u1; } if (L - a > 0.2) ext.box(a, v, 0, L, v + 0.14, z1, 16); };
      rail(stoneH, false);
      if (H - stoneH > 2.0) rail(Math.max(stoneH + 0.75, 0.86), true);
      // corner braces
      const mid = Math.max(stoneH + 0.75, 0.86), a2 = all.filter(p => p > 0.3 && p < L - 0.3);
      if (a2.length && !ops.some(o => o.u0 < a2[0])) ext.beam([0.17, stoneH + 0.14, 0.018], [a2[0] - 0.08, mid, 0.018], 0.035, 0.12);
      if (a2.length && !ops.some(o => o.u1 > a2[a2.length - 1])) ext.beam([L - 0.17, stoneH + 0.14, 0.018], [a2[a2.length - 1] + 0.08, mid, 0.018], 0.035, 0.12);
      // interior posts
      inner(); ext.mat(MAT.TIMBER, timberC);
      for (const p of all) { if (p < t + 0.1 || p > L - t - 0.1 || ops.some(o => p > o.u0 - 0.05 && p < o.u1 + 0.05)) continue; ext.box(p - 0.07, 0, -t - 0.04, p + 0.07, Hin, -t, 32); }
    }
    // collision: solid spans (windows block, doors don't)
    { let a = 0; const cuts = ops.filter(o => o.door); for (const o of cuts) { if (o.u0 - a > 0.02) addBoxCollider(ext, a, -t, o.u0, 0, 0, H + 3); a = o.u1; } if (L - a > 0.02) addBoxCollider(ext, a, -t, L, 0, 0, H + 3); }
    for (const m of [ext, int, glow]) m.pop();
  }
  // ── floor, plinth ──
  inner(); if (spec.floor === 'stone') ext.mat(MAT.COBBLE, [1, 1, 1], 1.4); else ext.mat(MAT.PLANKS, COL.woodDark);
  ext.quad([-w / 2 + t, 0.02, -hd + t], [-w / 2 + t, 0.02, hd - t], [w / 2 - t, 0.02, hd - t], [w / 2 - t, 0.02, -hd + t], 0, 0, (w - 2 * t) / ext.tile, (d - 2 * t) / ext.tile);
  outer(); ext.mat(MAT.STONE, [0.92, 0.92, 0.92]); ext.grad = [1, 0.6]; ext.box(-w / 2 - 0.07, -1.7, -hd - 0.07, w / 2 + 0.07, 0, hd + 0.07, 4); ext.grad = null;
  addFloor(ext, -w / 2, -hd, w / 2, hd, 0.02);
  // ── roof ──
  const thatch = (spec.roof || 'thatch') === 'thatch', rt = thatch ? 0.30 : 0.10, ov = spec.overhang || 0.55, og = 0.4, X = w / 2 + og;
  const eY = H - ov * tanP, sl = (hd + ov) / Math.cos(P), rc = spec.roofCol || (thatch ? [1, 1, 1] : [0.9, 0.85, 0.8]), rl = thatch ? MAT.THATCH : MAT.SHINGLE;
  outer(); ext.mat(rl, rc);
  ext.quad([X, ridgeY + rt, 0], [X, eY + rt, -(hd + ov)], [-X, eY + rt, -(hd + ov)], [-X, ridgeY + rt, 0], 0, 0, 2 * X / ext.tile, sl / ext.tile);
  ext.quad([-X, ridgeY + rt, 0], [-X, eY + rt, hd + ov], [X, eY + rt, hd + ov], [X, ridgeY + rt, 0], 0.37, 0, 0.37 + 2 * X / ext.tile, sl / ext.tile);
  // edges
  ext.mat(rl, v3.scale(rc, 0.72)); ext.ao = 0.8;
  ext.quad([X, eY + rt, -(hd + ov)], [X, eY, -(hd + ov)], [-X, eY, -(hd + ov)], [-X, eY + rt, -(hd + ov)], 0, 0, 2 * X / ext.tile, 0.12);
  ext.quad([-X, eY + rt, hd + ov], [-X, eY, hd + ov], [X, eY, hd + ov], [X, eY + rt, hd + ov], 0, 0, 2 * X / ext.tile, 0.12);
  for (const s of [-1, 1]) {
    ext.poly(s > 0 ? [[X, eY, -(hd + ov)], [X, eY + rt, -(hd + ov)], [X, ridgeY + rt, 0], [X, ridgeY, 0]] : [[-X, eY + rt, -(hd + ov)], [-X, eY, -(hd + ov)], [-X, ridgeY, 0], [-X, ridgeY + rt, 0]]);
    ext.poly(s > 0 ? [[X, eY + rt, hd + ov], [X, eY, hd + ov], [X, ridgeY, 0], [X, ridgeY + rt, 0]] : [[-X, eY, hd + ov], [-X, eY + rt, hd + ov], [-X, ridgeY + rt, 0], [-X, ridgeY, 0]]);
  }
  ext.ao = 1;
  if (thatch) { ext.mat(MAT.THATCH, v3.scale(rc, 0.85)); ext.push().T(-X - 0.03, ridgeY + rt - 0.07, 0).RZ(-PI / 2); ext.lathe([[0.24, 0], [0.24, 2 * X + 0.06]], 8, 3); ext.pop(); }
  else { ext.mat(MAT.TIMBER, timberC); ext.box(-X - 0.02, ridgeY + rt - 0.03, -0.09, X + 0.02, ridgeY + rt + 0.06, 0.09);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ext.beam([sx * (X + 0.02), eY + rt * 0.5, sz * (hd + ov)], [sx * (X + 0.02), ridgeY + rt * 0.5, 0], 0.05, 0.2); }
  // undersides: eaves + gable overhangs outside, the rest inside
  ext.mat(MAT.PLANKS, COL.woodDark); ext.ao = 0.5;
  for (const s of [-1, 1]) {
    const q = (x0, x1, z0, z1) => { const a = [x0, roofY(z0), s * z0], b = [x0, roofY(z1), s * z1], c = [x1, roofY(z1), s * z1], e = [x1, roofY(z0), s * z0]; if (s < 0) ext.quad(a, b, c, e); else ext.quad(e, c, b, a); };
    outer(); ext.ao = 0.5; q(-X, X, hd - t, hd + ov); q(-X, -w / 2 + t, 0, hd - t); q(w / 2 - t, X, 0, hd - t);
    if (!spec.ceiling) { inner(); ext.ao = INT_AO * 0.9; q(-w / 2 + t, w / 2 - t, 0, hd - t); }
  }
  // ── interior roof timbers ──
  int.mat(MAT.TIMBER, timberC);
  if (spec.ceiling) {
    inner(); ext.mat(MAT.PLANKS, COL.wood); ext.ao = INT_AO * 0.85;
    ext.quad([-w / 2 + t, H, hd - t], [-w / 2 + t, H, -hd + t], [w / 2 - t, H, -hd + t], [w / 2 - t, H, hd - t]);
    for (let x = -w / 2 + t + 0.6; x < w / 2 - t; x += 1.2) int.box(x - 0.07, H - 0.16, -hd + t, x + 0.07, H, hd - t, 8);
  } else {
    const nb = Math.max(1, Math.round((w - 2 * t) / 2.5)), xs = []; for (let i = 1; i <= nb; i++) xs.push(-w / 2 + t + (w - 2 * t) * i / (nb + 1));
    for (const x of xs) {
      if (!(spec.noTie && spec.noTie(x))) { int.box(x - 0.09, H - 0.2, -hd + t, x + 0.09, H, hd - t); int.box(x - 0.07, H, -0.07, x + 0.07, ridgeY - 0.2, 0.07, 4); }
      for (const s of [-1, 1]) int.beam([x, roofY(hd - t) - 0.10, s * (hd - t - 0.02)], [x, ridgeY - 0.12, s * 0.02], 0.1, 0.14);
    }
    for (let i = 0; i <= nb; i++) { const x = lerp(-w / 2 + t + 0.15, w / 2 - t - 0.15, (i + 0.5) / (nb + 1)); for (const s of [-1, 1]) int.beam([x, roofY(hd - t) - 0.08, s * (hd - t - 0.02)], [x, ridgeY - 0.10, s * 0.02], 0.07, 0.1); }
    int.box(-w / 2 + t, ridgeY - 0.24, -0.07, w / 2 - t, ridgeY - 0.1, 0.07);
    for (const s of [-1, 1]) { const z = s * (hd - t) * 0.5; int.box(-w / 2 + t, roofY(z) - 0.2, z - 0.06, w / 2 - t, roofY(z) - 0.08, z + 0.06); }
  }
  ext.ao = 1; ext.m1 = 0;
  const ctx = {
    site, zone, w, d, H, t, hd, ext, int, glow, R, floorY, ridgeY, roofY, spec, doors: doorList, kit, Ms, openings, tanP,
    world: (x, y, z) => m4.tp(Ms, [x, y, z]),
    spot(name, x, z, yawLocal, y, extra) { const p = m4.tp(Ms, [x, y || 0.02, z]); World.spots[site.id + '.' + name] = Object.assign({ p, yaw: site.yaw + (yawLocal || 0), zone, site: site.id }, extra || {}); },
    // hearth against a wall. frame: origin on the inner wall face, +x into the room. (x, z) = house-local position, rot = RY angle
    fireplace(x, z, rot, opt) {
      opt = opt || {}; const wid = opt.w || 1.9, dep = 0.8, m = int;
      m.push().T(x, 0, z).RY(rot);
      m.mat(MAT.STONE, [0.95, 0.93, 0.9], 0.8);
      m.box(0, 0, -wid / 2, dep, 1.15, -wid / 2 + 0.38); m.box(0, 0, wid / 2 - 0.38, dep, 1.15, wid / 2);
      m.box(0, 1.15, -wid / 2, dep, 1.5, wid / 2); m.box(0, 0, -wid / 2 + 0.38, 0.14, 1.15, wid / 2 - 0.38, 1 | 4 | 8);
      m.box(0, 0, -wid / 2 - 0.15, dep + 0.4, 0.07, wid / 2 + 0.15, 4);
      const lz = m4.tp(m4.mul(m4.create(), m4.rotY(m4.translate(m4.create(), x, 0, z), rot), m4.create()), [dep * 0.5, 0, 0])[2];
      const top = roofY(lz);
      m.box(0, 1.5, -wid / 2 + 0.25, dep - 0.15, spec.ceiling ? H : top - 0.03, wid / 2 - 0.25, 8);
      m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.0, 1.5, -wid / 2 - 0.1, dep + 0.12, 1.6, wid / 2 + 0.1);
      m.mat(MAT.PLAIN, [0.07, 0.06, 0.06]); m.quad([0.145, 1.15, wid / 2 - 0.38], [0.145, 0.07, wid / 2 - 0.38], [0.145, 0.07, -wid / 2 + 0.38], [0.145, 1.15, -wid / 2 + 0.38]);
      at(m, dep * 0.55, 0.07, 0, PI / 2, () => Props.logs(m, 3, 0.55, 0.06));
      emit(m, 1.3, () => { m.mat(MAT.PLAIN, [1, 0.35, 0.08]); m.box(dep * 0.25, 0.07, -0.28, dep * 0.85, 0.10, 0.28, 4); });
      const fp = wp(m, dep * 0.55, 0.2, 0);
      World.emitters.push({ type: 'fire', p: fp, size: opt.size || 0.5, zone });
      addLight(wp(m, dep + 0.7, 0.85, 0), opt.r || 9.5, opt.c || [3.4, 1.75, 0.62], zone, 'fire');
      if (opt.cauldron) { at(m, dep * 0.55, 0.42, 0, 0, () => Props.cauldron(m, 0.2)); m.mat(MAT.METAL, COL.black); m.box(dep * 0.55 - 0.01, 0.7, -0.01, dep * 0.55 + 0.01, 1.15, 0.01); }
      addBoxCollider(m, 0, -wid / 2 - 0.1, dep + 0.25, wid / 2 + 0.1, 0, 2);
      // chimney stack above the roof
      const sp = wp(m, dep * 0.5 - 0.02, 0, 0); m.pop();
      const l = worldToSite(site, sp[0], sp[2]);
      if (kit) { kitChimney(ctx, l[0], l[1]); ctx.fire = fp; return; }
      outer(); ext.mat(MAT.STONE, [0.95, 0.93, 0.9], 0.8);
      const y0 = roofY(l[1]) - 0.5, y1 = Math.max(ridgeY + 0.9, roofY(l[1]) + 1.5);
      ext.cbox(l[0], y0, l[1], 0.85, y1 - y0, 0.85, 4); ext.cbox(l[0], y1, l[1], 1.02, 0.14, 1.02);
      ext.mat(MAT.PLAIN, [0.05, 0.05, 0.05]); ext.cbox(l[0], y1 + 0.14, l[1], 0.5, 0.01, 0.5, 4);
      World.emitters.push({ type: 'smoke', p: m4.tp(Ms, [l[0], y1 + 0.2, l[1]]), zone: 0 });
      ctx.fire = fp;
    },
    solid(x0, z0, x1, z1, h) { addBoxCollider(int, x0, z0, x1, z1, 0, h || 1); },
    interact(x, y, z, o) { const it = Object.assign({ p: m4.tp(Ms, [x, y, z]), r: 2.0, zone }, o); World.interact.push(it); return it; },
  };
  if (kit) kitShell(ctx);
  if (spec.interior) spec.interior(ctx);
  if (kit) kitDress(ctx);
  int.grad = null;
  World.houses[site.id] = { site, zone, ctx, floorY, door: doorList[0] };
  return { ext, int, glow, ctx };
}


// ---- 71_kithouse.js ----
// ───────────────────────── houses assembled from the village kit, furnished from the props kit ─────────────────────────
// buildHouse() still lays out every building (zones, colliders, floors, doors, window light, seats, hearths); in kit style its
// generated shell is thrown away here and replaced by kit modules: 2 m wall panels scaled to the wall runs, with door and window
// panels exactly where the building's openings are, corner posts, a tiled roof that fits, timber gables, chimneys, and on some
// buildings a second storey with a balcony. Props.* calls made while furnishing are swapped for kit props at the same place.
const HOUSE_STYLE = (TEST && TEST.house) || 'kit';        // 'kit' | 'legacy' (the generated houses)
const KIT_STYLE = {
  inn: { ground: 'stone', pitch: 50, vines: 4, banner: true, round: true, dormers: [-4.2, 4.2] },
  smithy: { ground: 'stone', vines: 1 },
  store: { ground: 'plaster', up: 1, balcony: 'front', vines: 2 },
  elder: { ground: 'stone', up: 1, vines: 3 },
  herbalist: { ground: 'plaster', vines: 4, round: true },
  guardhouse: { ground: 'stone', up: 1, balcony: 'front' },
  weaver: { ground: 'plaster', up: 1, vines: 2 },
  chapel: { ground: 'stone', pitch: 56, thin: true, banner: true },
  mill: { ground: 'stone', up: 1, vines: 2 },
  farm: { ground: 'plaster', vines: 2 },
  hunter: { ground: 'stone', vines: 1 },
  fisher: { ground: 'plaster' },
};
World.kitExt = {}; World.kitInt = {}; World.kitYard = null; World.kitGroups = [];
const kitReady = () => HOUSE_STYLE === 'kit' && typeof Kit !== 'undefined' && !!Kit.ready;
function kitWanted(site, spec) { return kitReady() && !!KIT_STYLE[site.id]; }
async function kitBoot(progress) {
  if (HOUSE_STYLE !== 'kit' || typeof Kit === 'undefined') return;
  try { await Kit.load(progress, { packs: Kit.PACKS.filter(p => /village|props|scan/.test(p.glb)) }); for (const n of ['rock_moss_set_01', 'rock_moss_set_02']) if (Kit.defs[n]) Kit.defs[n].gain = 1.3; }       // scanned rocks photograph dark; lift them a little
  catch (e) { console.warn('kits unavailable, building the generated houses instead: ' + (e && e.message || e)); G.kitNote = String(e && e.message || e); }
}
// the building's spec adjusted to what the kit panels can do: 3 m storeys, kit door and window sizes, no slit windows
function kitSpec(site, spec) {
  const st = KIT_STYLE[site.id], s = Object.assign({}, spec, { kitStyle: st });
  s.H = Math.max(spec.H || 2.6, 3.0); s.pitch = st.pitch || 52;
  const sy = s.H / 3;
  s.doors = (spec.doors || []).map(o => { const sx = clamp((o.w || 1.05) / 1.08, 1.0, 1.4); return Object.assign({}, o, { w: 1.1 * sx, h: 2.12 * sy, ksx: sx, lamp: false, kLamp: o.lamp !== false }); });
  s.windows = (spec.windows || []).filter(o => (o.sill === undefined ? 1 : o.sill) < 2.0).map(o => Object.assign({}, o, { w: 1.2, sill: 0.95 * sy, h: 1.55 * sy, kwin: st.thin || (o.w || 0.9) < 0.85 ? 'thin' : st.round ? 'round' : 'wide' }));
  if (st.up) s.ceiling = true;
  return s;
}
const KH = (() => {
  const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _l = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  // base * translate * rotateY * scale
  const xf = (base, x, y, z, s, ry) => { const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s; _l.compose(_p.set(x, y, z), _q.setFromAxisAngle(Y, ry || 0), _s.set(sv[0], sv[1], sv[2])); return new THREE.Matrix4().multiplyMatrices(base, _l); };
  return { V, xf };
})();

function kitShell(c) {
  const { site, spec, w, d, H, t, hd, ext, glow, zone, Ms, openings, tanP } = c, st = spec.kitStyle, sy = H / 3, stone = st.ground === 'stone';
  // drop the generated shell; everything it registered in the world (colliders, floors, doors, window light) stays
  ext.nv = 0; ext.ni = 0; ext.min = [1e9, 1e9, 1e9]; ext.max = [-1e9, -1e9, -1e9]; glow.nv = 0; glow.ni = 0;
  const b = Kit.batch({ name: 'kit-' + site.id, cell: 4096 }); World.kitExt[site.id] = { batch: b, site, Ms, w, hd, top: H + (st.up ? 3 : 0), rise: hd * tanP };
  const MS = new THREE.Matrix4().fromArray(Ms), R = rng(site.x * 71 + site.z * 13 + 3);
  const OUT = { zone: 0, skyVis: 1, inZone: zone, inSkyVis: INT_AO }, EXT = { zone: 0, skyVis: 1 }, UP = { zone: 0, skyVis: 1, inZone: 0, inSkyVis: 0.12 };
  const frames = {}, wbs = {};
  for (const wn in WALLS) { const W = WALLS[wn], s0 = W.start(w, d); frames[wn] = new THREE.Matrix4().makeBasis(KH.V(W.u), KH.V([0, 1, 0]), KH.V(W.n)).setPosition(s0[0], s0[1], s0[2]).premultiply(MS); wbs[wn] = m4.basis(m4.create(), W.u, [0, 1, 0], W.n, s0); }
  const add = (F, name, x, y, z, s, o, ry) => b.add(name, KH.xf(F, x, y, z, s, ry), o || OUT);
  const Ytop = H + (st.up ? 3 : 0);
  Object.assign(c, { kb: b, kMS: MS, kYtop: Ytop, kFrames: frames, kR: R });
  const G = stone ? 'Wall_UnevenBrick' : 'Wall_Plaster';
  const filler = (F, a, e, y, ys, isStone, endL, endR, o) => {
    const g = e - a; if (g < 0.05) return;
    const n = Math.max(1, Math.round(g / 2)), m = g / n;
    for (let k = 0; k < n; k++) {
      const sx = m / 2; let name;
      if (isStone) name = 'Wall_UnevenBrick_Straight';
      else if (sx < 0.6) name = 'Wall_Plaster_Straight_Base';
      else if (k === 0 && endL) name = 'Wall_Plaster_Straight_L'; else if (k === n - 1 && endR) name = 'Wall_Plaster_Straight_R';
      else name = (k % 2) ? 'Wall_Plaster_Straight_Base' : 'Wall_Plaster_Straight';
      add(F, name, a + (k + 0.5) * m, y, 0, [sx, ys, 1], o);
    }
  };
  const WIN = {
    thin: ['_Window_Thin_Round', 'Window_Thin_Round1', 'WindowShutters_Thin_Round_Open'],
    round: ['_Window_Wide_Round', 'Window_Wide_Round1', 'WindowShutters_Wide_Round_Open'],
    wide: ['_Window_Wide_Flat', 'Window_Wide_Flat1', 'WindowShutters_Wide_Flat_Open'],
  };
  c.kDoorLamps = [];
  for (const wn of ['front', 'back', 'left', 'right']) {
    const F = frames[wn], L = WALLS[wn].len(w, d);
    // ── ground storey: door and window panels where the openings are, plain panels scaled to fill between them ──
    const slots = openings[wn].map(o => ({ o, c: (o.u0 + o.u1) / 2, hw: o.door ? (o.def.ksx || 1) : 1 })).sort((a, e) => a.c - e.c);
    for (const s of slots) s.hw = Math.min(s.hw, s.c, L - s.c);
    for (let i = 0; i < slots.length - 1; i++) { const a = slots[i], n = slots[i + 1], gap = n.c - a.c, sum = a.hw + n.hw; if (sum > gap) { a.hw *= gap / sum; n.hw *= gap / sum; } }
    let cur = 0;
    for (const s of slots) {
      const o = s.o, sx = s.hw, S = [sx, sy, 1];
      if (!o.door && sx < 0.5) continue;                      // no room for a window panel: the wall stays solid there
      filler(F, cur, s.c - sx, 0, sy, stone, cur === 0, false);
      if (o.door) {
        add(F, G + '_Door_Flat', s.c, 0, 0, S); add(F, 'DoorFrame_Flat_WoodDark', s.c, 0, 0, S, EXT);
        if (o.def.kLamp) { const side = s.c + sx + 1.0 < L ? 1 : -1; c.kDoorLamps.push({ F, wn, u: s.c + side * (sx + 0.42), v: 1.5 * sy }); }
      } else {
        const k = WIN[o.def.kwin] || WIN.wide;
        add(F, G + k[0], s.c, 0, 0, S); add(F, k[1], s.c, 0, 0, S);
        if (o.def.shutters !== false && sx > 0.9 && s.c - 1.3 > 0 && s.c + 1.3 < L) add(F, k[2], s.c, 0, 0, S, EXT);
      }
      cur = s.c + sx;
    }
    filler(F, cur, L, 0, sy, stone, cur === 0, true);
    add(F, 'Corner_Exterior_Wood', 0, 0, 0, [1.25, sy, 1.25], EXT);
    // ── upper storey: timber and plaster, windows on alternate panels, a balcony over the door on some ──
    if (st.up) {
      const n = Math.max(1, Math.round(L / 2)), m = L / n, sx = m / 2, S = [sx, 1, 1], mid = n >> 1;
      for (let k = 0; k < n; k++) {
        const uc = (k + 0.5) * m;
        if (st.balcony === wn && n >= 3 && k === mid) {
          add(F, 'Wall_Plaster_Door_Flat', uc, H, 0, S, UP); add(F, 'DoorFrame_Flat_WoodDark', uc, H, 0, S, EXT); add(F, 'Door_1_Flat', uc - 0.54 * sx, H, -0.05, S, EXT);
          add(F, 'Balcony_Simple_Corner', uc + sx, H, 0, S, EXT); add(F, 'Balcony_Simple_Corner', uc - sx, H, 0, [-sx, 1, 1], EXT);
          add(F, 'Floor_WoodDark_Half3', uc - sx, H, 1, S, EXT); add(F, 'Floor_WoodDark_Half3', uc + sx, H, 1, S, EXT);
          for (const sg of [-1, 1]) add(F, 'Roof_Support2', uc + sg * 1.7 * sx, H - 0.74, 0.02, 1, EXT);
        } else if (n > 1 && k === 0) add(F, 'Wall_Plaster_Straight_L', uc, H, 0, S, UP);
        else if (n > 1 && k === n - 1) add(F, 'Wall_Plaster_Straight_R', uc, H, 0, S, UP);
        else if (n <= 3 || (k + (wn === 'front' || wn === 'back' ? 0 : 1)) % 2 === 1) {
          const r = R();
          if (r < 0.4) { add(F, 'Wall_Plaster_Window_Wide_Flat2', uc, H, 0, S, UP); add(F, 'Window_Wide_Flat1', uc, H, 0, S, UP); }
          else if (r < 0.75) { add(F, 'Wall_Plaster_Window_Wide_Flat', uc, H, 0, S, UP); add(F, 'Window_Wide_Flat1', uc, H, 0, S, UP); if (uc > 1.4 && uc < L - 1.4) add(F, 'WindowShutters_Wide_Flat_Open', uc, H, 0, S, EXT); }
          else { add(F, 'Wall_Plaster_Window_Thin_Round', uc, H, 0, S, UP); add(F, 'Window_Thin_Round1', uc, H, 0, S, UP); add(F, 'WindowShutters_Thin_Round_Closed', uc, H, 0, S, EXT); }
        } else add(F, 'Wall_Plaster_Straight', uc, H, 0, S, UP);
      }
      add(F, 'Corner_Exterior_Wood', 0, H, 0, [1.25, 1, 1.25], EXT);
    }
    // ── gable ends carry the timber triangle of the roof ──
    if (wn === 'left' || wn === 'right') { const span = d <= 5 ? 4 : d <= 7.2 ? 6 : 8, ridge = Kit.info('Roof_RoundTiles_' + span + 'x8').max[1]; add(F, 'Roof_Front_Brick' + span, L / 2, Ytop, 0, [d / span, hd * tanP / ridge, 1], { zone: 0, skyVis: 1, inZone: st.up ? 0 : zone, inSkyVis: INT_AO }); }
  }
  // ── roof: the kit roof nearest in size, turned so its ridge runs along the building and scaled to the footprint and pitch ──
  {
    const span = d <= 5 ? 4 : d <= 7.2 ? 6 : 8, lens = span === 4 ? [4, 6, 8] : span === 6 ? [4, 6, 8, 10, 12, 14] : [8, 10, 12];
    let len = lens[0]; for (const l of lens) if (Math.abs(Math.log(w / l)) < Math.abs(Math.log(w / len))) len = l;
    const name = 'Roof_RoundTiles_' + span + 'x' + len, ridge = Kit.info(name).max[1];
    const RF = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)).setPosition(0, Ytop, 0).premultiply(MS);
    b.add(name, KH.xf(RF, 0, 0, 0, [d / span, hd * tanP / ridge, w / len]), { zone: 0, skyVis: 1, inZone: st.up ? 0 : zone, inSkyVis: 0.2 });
  }
  // ── floor tiles (in the outdoor batch, so the room is not a hole when its furniture is hidden by distance) ──
  {
    const nx = Math.max(1, Math.round(w / 2)), nz = Math.max(1, Math.round(d / 2)), sx = (w - 0.3) / (2 * nx), sz = (d - 0.3) / (2 * nz), tile = spec.floor === 'stone' ? 'Floor_UnevenBrick' : 'Floor_WoodDark';
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.add(tile, KH.xf(MS, (i - (nx - 1) / 2) * 2 * sx, 0.012, (j - (nz - 1) / 2) * 2 * sz, [sx, 1, sz]), { zone, skyVis: INT_AO, cast: false });
  }
  // ── generated parts that still make sense: stone plinth down to the ground, door steps, ceiling or roof lining ──
  const inner = () => { ext.m1 = zone; ext.ao = INT_AO; }, outer = () => { ext.m1 = 0; ext.ao = 1; };
  outer(); ext.mat(MAT.STONE, [0.92, 0.92, 0.92]); ext.grad = [1, 0.6]; ext.box(-w / 2 - 0.07, -1.7, -hd - 0.07, w / 2 + 0.07, 0, hd + 0.07, 4); ext.grad = null;
  for (const wn in WALLS) for (const o of openings[wn]) if (o.door) {
    ext.push(); m4.mul(ext.m, ext.m, wbs[wn]); ext.dirty = true;
    outer(); ext.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); ext.box(o.u0 - 0.35, -0.5, 0, o.u1 + 0.35, -0.02, 0.5); ext.box(o.u0 - 0.2, -0.5, 0.5, o.u1 + 0.2, -0.17, 0.95);
    ext.pop();
  }
  const e = 0.16;          // the kit walls are thinner than the generated ones: reach to their inner face
  if (spec.ceiling) {
    inner(); ext.mat(MAT.PLANKS, COL.wood); ext.ao = INT_AO * 0.85;
    ext.quad([-w / 2 + e, H, hd - e], [-w / 2 + e, H, -hd + e], [w / 2 - e, H, -hd + e], [w / 2 - e, H, hd - e]);
    if (st.up) { outer(); ext.ao = 0.15; ext.mat(MAT.PLANKS, COL.woodDark); ext.quad([-w / 2 + e, H + 0.05, -hd + e], [-w / 2 + e, H + 0.05, hd - e], [w / 2 - e, H + 0.05, hd - e], [w / 2 - e, H + 0.05, -hd + e]); }
  } else {
    const roofY = c.roofY;
    ext.mat(MAT.PLANKS, COL.woodDark);
    for (const s of [-1, 1]) {
      const q = (x0, x1, z0, z1) => { const a = [x0, roofY(z0) - 0.04, s * z0], p = [x0, roofY(z1) - 0.04, s * z1], r = [x1, roofY(z1) - 0.04, s * z1], f = [x1, roofY(z0) - 0.04, s * z0]; if (s < 0) ext.quad(a, p, r, f); else ext.quad(f, r, p, a); };
      inner(); ext.ao = INT_AO * 0.9; q(-w / 2 + e, w / 2 - e, 0, hd - e);
    }
    for (const wn of ['left', 'right']) {
      ext.push(); m4.mul(ext.m, ext.m, wbs[wn]); ext.dirty = true;
      inner(); ext.mat(MAT.PLASTER, [0.97, 0.93, 0.86]); ext.poly([[d - 0.05, H, -e - 0.02], [0.05, H, -e - 0.02], [d / 2, H + d / 2 * tanP, -e - 0.02]]);
      ext.pop();
    }
  }
  c.kCol0 = World.colliders.length;
  // lanterns by the doors
  for (const l of c.kDoorLamps) {
    add(l.F, 'Lantern_Wall', l.u, l.v, 0.03, 0.8, { zone: 0, skyVis: 1, lit: 1 });
    const lp = Kit.lights('Lantern_Wall')[0] || [0, 0.53, 0.76], v = new THREE.Vector3(lp[0] * 0.8, lp[1] * 0.8, lp[2] * 0.8).applyMatrix4(KH.xf(l.F, l.u, l.v, 0.03)), p = [v.x, v.y, v.z];
    World.emitters.push({ type: 'lantern', p, zone: 0 }); addLight(p, 9, [3.4, 1.9, 0.75], 0, 'lantern');
  }
  outer(); ext.grad = null;
}
// a kit chimney above a hearth at house-local (lx, lz), rising clear of the ridge
function kitChimney(c, lx, lz) {
  const ridge = c.kYtop + c.hd * c.tanP, base = c.kYtop + (c.hd - Math.abs(lz)) * c.tanP - 1.0, hgt = Math.max(3.18, ridge + 1.1 - base);
  c.kb.add('Prop_Chimney', KH.xf(c.kMS, lx, base, lz, [1.1, hgt / 3.18, 1.1]), { zone: 0, skyVis: 1 });
  World.emitters.push({ type: 'smoke', p: m4.tp(c.Ms, [lx, base + hgt + 0.2, lz]), zone: 0 });
}

// ── furnishing: Props.* calls land here while kits are loaded and are answered with kit pieces at the same spot ──
const KITP = { rnd: rng(4242), lc: {} };
// only the first few small flames in a room cast light: the renderer lights a view with its eight strongest lights, and hearths must stay among them
const kitLightOk = (zone, cap) => { const n = KITP.lc[zone] = (KITP.lc[zone] || 0) + 1; return n <= cap; };
function kitIntBatch(zone) {
  let k = World.kitInt[zone];
  if (!k) { const zi = World.zones[zone - 1]; k = World.kitInt[zone] = { batch: Kit.batch({ name: 'kitint-' + (zi ? zi.site.id : zone), cell: 4096 }), site: zi ? zi.site : null }; }
  return k.batch;
}
// ── scanned stand-ins ──
// A painted kit piece is answered with a photo-scanned model of the same kind when the scan pack is loaded. The scan is fitted to the box the painted
// piece would have filled (so colliders, seats and wall spacing still hold) and stands on the same floor line. Per entry: n = scanned model(s),
// fit = 'box' (stretch to the box, within lo..hi), 'contain' (uniform, as big as fits), 'xz' (uniform on the footprint, height within 25%),
// one = outdoors only the first model is used (fewer materials, fewer draw calls), k = extra per-axis factor, mul = extra scale, y = lift in metres, ry = turn in radians (a quarter turn swaps the footprint), tint = colour factor, skip = draw nothing.
const SCANR = {
  Table_Large: { n: ['woodentable_01'], fit: 'box', tint: [0.85, 0.72, 0.6] },
  Bench: { n: ['woodentable_01'], fit: 'box', tint: [0.9, 0.8, 0.7] },
  Stool: { n: ['painted_wooden_stool'], fit: 'contain', tint: [0.5, 0.4, 0.31] },
  Chair_1: { n: ['painted_wooden_chair_01'], fit: 'contain', tint: [0.36, 0.29, 0.22] },
  Bed_Twin1: { n: ['gothicbed_01'], fit: 'xz' }, Bed_Twin2: { n: ['gothicbed_01'], fit: 'xz' },
  Chest_Wood__Base: { n: ['treasure_chest'], fit: 'box', lo: 0.8, hi: 1.3, box: [1, 1.2, 1] }, Chest_Wood__Lid: { skip: true },
  Barrel: { n: ['wine_barrel_01', 'wooden_barrels_01_a'], fit: 'xz', one: 1 },
  Crate_Wooden: { n: ['wooden_crate_01'], fit: 'contain', k: [1, 1.75, 1.45] }, Prop_Crate: { n: ['wooden_crate_01'], fit: 'contain', k: [1, 1.75, 1.45] },
  Vase_2: { n: ['ceramic_vase_02', 'ceramic_pot'], fit: 'contain', one: 1 }, Vase_4: { n: ['ceramic_vase_04'], fit: 'contain' }, Bottle_1: { n: ['ceramic_vase_04'], fit: 'contain' },
  Table_Plate: { n: ['carved_wooden_plate'], fit: 'contain' },
  Candle_1: { n: ['wooden_candlestick'], fit: 'contain', mul: 1.25 }, Candle_2: { n: ['wooden_candlestick'], fit: 'contain' },
  CandleStick_Triple: { n: ['brass_candleholders_c'], fit: 'contain', mul: 0.75 },
  Bucket_Wooden_1: { n: ['wooden_bucket_01', 'wooden_bucket_02'], fit: 'contain', mul: 1.1, one: 1 },
  Bookcase_2: { n: ['wooden_bookshelf_worn'], fit: 'box', lo: 0.7, hi: 1.3 }, Cabinet: { n: ['painted_wooden_cabinet'], fit: 'box', lo: 0.7, hi: 1.3, tint: [0.7, 0.6, 0.5] },
  Nightstand_Shelf: { n: ['painted_wooden_shelves'], fit: 'box', lo: 0.7, hi: 1.4, tint: [0.8, 0.75, 0.7] },
  Workbench: { n: ['painted_wooden_table'], fit: 'box', lo: 0.7, hi: 1.3, tint: [0.6, 0.5, 0.42] },
  Pickaxe_Bronze: { n: ['picke_dirty_01'], fit: 'contain' }, Axe_Bronze: { n: ['wooden_axe_03'], fit: 'contain', ry: PI / 2 },
};
const SCAN_FLAT = { wooden_axe_03: 1, rusted_spade_01: 1, kite_shield: 1, cross_pein_hammer: 1, picke_dirty_01: 1 };
// top of a crate of nominal size s (things stacked on crates are placed with this)
const crateTop = s => (scanOn() ? 0.71 : 1) * s;
const scanOn = () => kitReady() && !!Kit.pieces.wine_barrel_01 && !(TEST && TEST.scan === 0);
const _sm = new THREE.Matrix4(), _sv = new THREE.Vector3(), _sq = new THREE.Quaternion(), _su = new THREE.Vector3(0, 1, 0);
// where a painted piece placed at (x, y, z) with scale s and turn ry ends up: { name, M, tint }, the scan stand-in if there is one
function kplace(m, name, x, y, z, s, ry) {
  const base = new THREE.Matrix4().fromArray(m.m), E = scanOn() ? SCANR[name] : null, P = Kit.pieces[name];
  if (!E || !P) { if (scanOn() && SCAN_FLAT[name]) { const q = Kit.pieces[name]; if (q) return { name, M: KH.xf(base, x, y + (q.max[1] - q.min[1]) * 0.5 * (typeof s === 'number' ? s : s[1]), z, s, ry) }; } return { name, M: KH.xf(base, x, y, z, s, ry) }; }
  if (E.skip) return null;
  const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s, W = [P.max[0] - P.min[0], P.max[1] - P.min[1], P.max[2] - P.min[2]];
  const tw = Math.abs(W[0] * sv[0]) * (E.box ? E.box[0] : 1), th = Math.abs(W[1] * sv[1]) * (E.box ? E.box[1] : 1), td = Math.abs(W[2] * sv[2]) * (E.box ? E.box[2] : 1);
  const tcx = (P.min[0] + P.max[0]) / 2 * sv[0], tcz = (P.min[2] + P.max[2]) / 2 * sv[2], tby = P.min[1] * sv[1];
  const sn = E.n[E.n.length > 1 && !(E.one && !(m.m1 | 0)) ? Math.floor(KITP.rnd() * E.n.length) : 0], Q = Kit.pieces[sn]; if (!Q) return { name, M: KH.xf(base, x, y, z, s, ry) };
  const quarter = Math.abs(Math.sin(E.ry || 0)) > 0.9, sw = quarter ? Q.max[2] - Q.min[2] : Q.max[0] - Q.min[0], sh = Q.max[1] - Q.min[1], sd = quarter ? Q.max[0] - Q.min[0] : Q.max[2] - Q.min[2];
  const mul = E.mul || 1, k = E.k || [1, 1, 1]; let f;
  if (E.fit === 'box') { const lo = E.lo || 0.5, hi = E.hi || 2.2, c = v => Math.min(hi, Math.max(lo, v)); f = [c(tw / sw), c(th / sh), c(td / sd)]; }
  else if (E.fit === 'xz') { const u = Math.min(tw / sw, td / sd); f = [u, Math.min(u * 1.25, Math.max(u * 0.8, th / sh)), u]; }
  else { const u = Math.min(tw / sw, th / sh, td / sd); f = [u, u, u]; }
  f = [f[0] * mul * k[0], f[1] * mul * k[1], f[2] * mul * k[2]];
  const L = KH.xf(base, x, y, z, 1, ry);
  const cx = (Q.min[0] + Q.max[0]) / 2, cz = (Q.min[2] + Q.max[2]) / 2;
  _sm.compose(_sv.set(tcx, tby + (E.y || 0), tcz), _sq.setFromAxisAngle(_su, E.ry || 0), new THREE.Vector3(f[0], f[1], f[2]));
  const loc = new THREE.Matrix4().makeTranslation(-cx, -Q.min[1], -cz);
  return { name: sn, M: new THREE.Matrix4().multiplyMatrices(L, _sm).multiply(loc), tint: E.tint };
}
function kadd(m, P, extra) {
  const zone = m.m1 | 0;
  let B; if (zone) B = kitIntBatch(zone); else { if (!World.kitYard) World.kitYard = Kit.batch({ name: 'kit-yard', cell: 40 }); B = World.kitYard; }
  const o = Object.assign({ zone, skyVis: zone ? INT_AO : 1, cast: !zone }, extra || {}); if (P.tint && !o.tint) o.tint = P.tint;
  B.add(P.name, P.M, o);
}
// place a kit piece relative to the mesh's current transform (the same frame the generated prop would be drawn in)
function kp(m, name, x, y, z, s, ry, extra) { const P = kplace(m, name, x, y, z, s, ry); if (P) kadd(m, P, extra); }
// a light-source piece: the piece itself with glowing wax, one flame per candle tip, one point light for the whole piece
function kitLit(m, name, x, y, z, s, ry, o) {
  const zone = m.m1 | 0, P = kplace(m, name, x, y, z, s, ry), M = P.M, pts = Kit.lights(P.name), v = new THREE.Vector3(), c = [0, 0, 0];
  kadd(m, P, { lit: 1 });
  for (const p of pts) { v.set(p[0], p[1], p[2]).applyMatrix4(M); c[0] += v.x / pts.length; c[1] += v.y / pts.length; c[2] += v.z / pts.length; World.emitters.push(o.flame === 'torch' ? { type: 'torch', p: [v.x, v.y, v.z], zone, size: o.size } : { type: 'candle', p: [v.x, v.y + 0.02, v.z], zone, always: !!o.always }); }
  if (!pts.length) { v.set(0, 0.2, 0).applyMatrix4(M); c[0] = v.x; c[1] = v.y; c[2] = v.z; }
  if (o.cap === undefined || kitLightOk(zone, o.cap)) addLight([c[0], c[1] + 0.1, c[2]], o.r || 5, o.c || [1.9, 1.15, 0.5], zone, o.kind || 'candle');
}
(function kitPropsInstall() {
  const wrap = (name, fn) => { const orig = Props[name]; Props[name] = function () { return kitReady() ? fn.apply(Props, arguments) : orig.apply(Props, arguments); }; };
  wrap('table', (m, len, wid, h) => {
    h = h || 0.76; kp(m, 'Table_Large', 0, 0, 0, [len / 2.85, h / 0.81, wid / 1.1]); addBoxCollider(m, -len / 2, -wid / 2, len / 2, wid / 2, 0, h);
    if ((m.m1 | 0) && len >= 1.4 && KITP.rnd() < 0.65) kitLit(m, 'CandleStick_Triple', len * 0.18, h, 0.03, 1, KITP.rnd() * 3, { r: 5.0, c: [1.9, 1.15, 0.5], kind: 'candle', flame: 'candle', cap: 3 });
  });
  wrap('bench', (m, len, noCol) => { kp(m, 'Bench', 0, 0, 0, [len / 2.78, 0.46 / 0.52, 0.66]); if (!noCol) addBoxCollider(m, -len / 2, -0.16, len / 2, 0.16, 0, 0.46); });
  wrap('stool', m => kp(m, 'Stool', 0, 0, 0, [0.8, 0.45 / 0.58, 0.8]));
  wrap('chair', m => kp(m, 'Chair_1', 0, 0, 0, [0.85, 0.9, 0.85], KITP.chairRy));
  wrap('bed', (m, w) => { w = w || 1.0; kp(m, KITP.rnd() < 0.5 ? 'Bed_Twin1' : 'Bed_Twin2', 0, 0, 0, [(w + 0.14) / 1.88, 0.74, 2.08 / 2.41], KITP.bedRy); addBoxCollider(m, -w / 2, -1, w / 2, 1, 0, 0.6); });
  wrap('chest', (m, w) => { w = w || 0.85; const s = w / 1.2; kp(m, 'Chest_Wood__Base', 0, 0.01, 0, s, KITP.chestRy); kp(m, 'Chest_Wood__Lid', 0, 0.01, 0, s, KITP.chestRy); addBoxCollider(m, -w / 2, -0.25, w / 2, 0.25, 0, 0.6); });
  wrap('barrel', (m, r, h, noCol) => { r = r || 0.33; h = h || 0.9; kp(m, 'Barrel', 0, 0, 0, [r / 0.35, h / 0.9, r / 0.35], KITP.rnd() * 6); if (!noCol) addCircleCollider(m, 0, 0, r, 0, h); });
  wrap('keg', (m, r, len) => { const s = (2 * r + 0.3) / 1.25; kp(m, 'Barrel_Holder', 0, 0, 0, [len / 1.15, s, s]); });
  wrap('crate', (m, s, noCol) => { s = s || 0.6; const k = s / 0.88; if (m.m1 | 0) kp(m, 'Crate_Wooden', 0, 0.05 * k, 0, k); else kp(m, 'Prop_Crate', 0, 0, 0, s / 1.07); if (!noCol) addBoxCollider(m, -s / 2, -s / 2, s / 2, s / 2, 0, s); });
  wrap('sack', (m, s) => { s = s || 0.3; kp(m, 'Bag', 0, 0, 0, 1.9 * s / 0.8, KITP.rnd() * 6); });
  wrap('pot', (m, s) => { s = s || 0.14; kp(m, KITP.rnd() < 0.5 ? 'Vase_4' : 'Vase_2', 0, 0, 0, 2.1 * s / 0.5); });
  wrap('jug', m => kp(m, 'Vase_4', 0, 0, 0, 0.56));
  wrap('bottle', m => { const r = KITP.rnd(); kp(m, r < 0.6 ? 'Bottle_1' : r < 0.8 ? 'Potion_2' : 'Potion_4', 0, 0, 0, r < 0.6 ? 0.75 : 0.9); });
  wrap('mug', m => kp(m, 'Mug', 0, 0.006, 0, 0.7, KITP.rnd() * 6));
  wrap('plate', m => kp(m, 'Table_Plate', 0, 0.003, 0, 0.75));
  wrap('book', (m, col, w) => kp(m, 'Book_5', 0, 0.026, 0, [0.85, (w || 0.04) / 0.06, 0.85], 0, col ? { tint: [0.55 + col[0] * 0.6, 0.55 + col[1] * 0.6, 0.55 + col[2] * 0.6] } : null));
  wrap('candle', (m, ctx, tall) => {
    const P = kplace(m, tall ? 'Candle_2' : 'Candle_1', 0, 0, 0, 1, 0), lp = Kit.lights(P.name)[0] || [0, tall ? 0.27 : 0.15, 0], v = new THREE.Vector3(lp[0], lp[1], lp[2]).applyMatrix4(P.M);
    kadd(m, P, { lit: 1 });
    World.emitters.push({ type: 'candle', p: [v.x, v.y + 0.02, v.z], zone: ctx.zone, always: !!ctx.always });
    if (ctx.candleLight !== false && kitLightOk(ctx.zone | 0, 2)) addLight([v.x, v.y + 0.1, v.z], 4.6, [1.6, 1.0, 0.44], ctx.zone, 'candle');
  });
  wrap('cauldron', (m, r) => { r = r || 0.24; kp(m, 'Cauldron', 0, 0, 0, 2.1 * r / 0.99); });
  wrap('anvil', m => { kp(m, 'Anvil_Log', 0, 0, 0, 0.78); addCircleCollider(m, 0, 0, 0.32, 0, 0.8); });
  wrap('sword', m => kp(m, 'Sword_Bronze', 0, 0.2, 0, 0.9));
  wrap('shield', m => kp(m, 'Shield_Wooden', 0, 0, 0, 1.08));
  // food, tableware and lamps that exist only as scans: the generated prop stays when the scan pack is not loaded
  const swrap = (name, fn) => { const prev = Props[name]; Props[name] = function () { return scanOn() ? fn.apply(Props, arguments) : prev.apply(Props, arguments); }; };
  let nApple = 0; const apple0 = Props.apple;
  swrap('apple', (m, col) => { if (++nApple % 3) return apple0.call(Props, m, col); kp(m, 'food_apple_01', 0, 0, 0, 0.8, KITP.rnd() * 6); });
  swrap('loaf', m => kp(m, 'hamburger_buns_a', 0, 0, 0, 1.7, KITP.rnd() * 6));
  swrap('bowl', m => kp(m, 'wooden_bowl_01', 0, 0, 0, 0.7, KITP.rnd() * 6));
  const lantern0 = Props.lantern;
  Props.lantern = function (m, ctx, kind) {      // hanging lamp, origin at the hook: scanned indoors only (every outdoor lamp would add two draw calls)
    if (!scanOn() || !ctx.zone) return lantern0.call(Props, m, ctx, kind);
    const name = 'wooden_lantern_01', P = kplace(m, name, 0, 0, 0, 0.8, 0); P.M.multiply(new THREE.Matrix4().makeTranslation(0, -Kit.info(name).size[1], 0));
    kadd(m, P, { lit: 1 });
    const lp = Kit.lights(name)[0] || [0, 0.17, 0], v = new THREE.Vector3(lp[0], lp[1] - Kit.info(name).size[1], lp[2]).applyMatrix4(new THREE.Matrix4().fromArray(m.m).multiply(KH.xf(new THREE.Matrix4(), 0, 0, 0, 0.8, 0))), p = [v.x, v.y, v.z];
    World.emitters.push({ type: 'lantern', p, zone: ctx.zone });
    addLight(p, ctx.zone ? 6.5 : 9, ctx.zone ? [2.3, 1.35, 0.55] : [3.4, 1.9, 0.75], ctx.zone, kind || 'lantern');
  };
})();
KITP.chairRy = PI; KITP.bedRy = 0; KITP.chestRy = PI;       // which way each kit piece faces relative to the generated prop it stands in for

// extra dressing per building, once its own interior has been laid out
// Floor pieces go against free wall, wall pieces hang where no window or tall furniture is in the way.
// footprint along the wall, depth, tall, scale, [light]
const KIT_ITEM = {
  Bookcase_2: [1.46, 0.43, 1, 0.9], Cabinet: [1.36, 0.38, 0, 1], Nightstand_Shelf: [0.7, 0.4, 0, 0.9], Workbench: [2.02, 1.02, 0, 0.95], WeaponStand: [1.39, 0.98, 0, 0.85],
  Dummy: [0.8, 0.6, 0, 0.95], Barrel: [0.7, 0.7, 0, 1], Barrel_Apples: [0.7, 0.7, 0, 1], Crate_Wooden: [0.86, 0.9, 0, 0.8], Bag: [0.66, 0.54, 0, 0.9], Bucket_Wooden_1: [0.43, 0.4, 0, 1],
  Vase_2: [0.69, 0.69, 0, 0.8], FarmCrate_Apple: [0.71, 0.45, 0, 1], FarmCrate_Carrot: [0.71, 0.57, 0, 1], CandleStick_Stand: [0.6, 0.6, 0, 0.95, 1], BookStand: [0.51, 0.51, 0, 1],
  Whetstone: [1.14, 0.9, 0, 0.8], Barrel_Holder: [1.36, 0.74, 0, 0.9],
  // scan-only floor pieces (footprint is the model's own)
  spinning_wheel_01: [0.55, 1.05, 0, 1], wooden_ladder: [0.98, 0.52, 0, 1], treasure_chest: [0.97, 0.54, 0, 1], wicker_basket_02: [0.4, 0.3, 0, 1.2], rock_moss_set_02_g: [0.9, 0.7, 0, 0.7],
};
const KIT_WALL = {            // width, height of the pivot above the floor, stand-off from the wall
  Torch_Metal: [0.5, 1.85, 0.01], Shelf_Simple: [1.2, 1.55, 0.01], Shelf_Arch: [1.25, 1.8, 0.01], Shelf_Small_Bottles: [1.15, 1.5, 0.01], Peg_Rack: [1.2, 1.75, 0.01],
  Shield_Wooden: [0.7, 1.9, 0.01], kite_shield: [0.6, 1.75, 0.04, 0.7], rusted_spade_01: [0.3, 1.6, 0.03, 1], cross_pein_hammer: [0.3, 1.6, 0.03, 1.2], Banner_1_Cloth: [0.85, 2.7, 0.05], Banner_2_Cloth: [0.85, 2.6, 0.05], Axe_Bronze: [0.4, 1.75, 0.04], Pickaxe_Bronze: [0.85, 1.8, 0.08], Sword_Bronze: [0.35, 1.5, 0.04],
};
const KIT_DRESS = {
  inn: { floor: ['CandleStick_Stand', 'Barrel_Holder', 'Cabinet', 'Barrel', 'Crate_Wooden', 'Bag', 'Barrel'], wall: ['Torch_Metal', 'Banner_1_Cloth', 'Shield_Wooden', 'Torch_Metal', 'Banner_1_Cloth', 'Peg_Rack', 'Shelf_Simple', 'Torch_Metal'] },
  smithy: { floor: ['Workbench', 'WeaponStand', 'Barrel', 'Whetstone', 'Crate_Wooden', 'Bucket_Wooden_1'], wall: ['Torch_Metal', 'Peg_Rack', 'Pickaxe_Bronze', 'Axe_Bronze', 'cross_pein_hammer', 'kite_shield', 'Torch_Metal'] },
  store: { floor: ['Cabinet', 'Bookcase_2', 'Crate_Wooden', 'FarmCrate_Apple', 'Barrel', 'FarmCrate_Carrot', 'Bag', 'Vase_2', 'Nightstand_Shelf', 'Barrel_Apples'], wall: ['Shelf_Small_Bottles', 'Torch_Metal', 'Shelf_Simple', 'Shelf_Arch', 'Torch_Metal', 'Peg_Rack'] },
  elder: { floor: ['Bookcase_2', 'BookStand', 'Bookcase_2', 'CandleStick_Stand', 'treasure_chest', 'Cabinet', 'Nightstand_Shelf'], wall: ['Shelf_Arch', 'Torch_Metal', 'Banner_1_Cloth', 'Shelf_Simple'] },
  herbalist: { floor: ['Cabinet', 'Nightstand_Shelf', 'Vase_2', 'Bucket_Wooden_1', 'Bag', 'Crate_Wooden'], wall: ['Shelf_Small_Bottles', 'Torch_Metal', 'Shelf_Simple', 'Shelf_Arch'] },
  guardhouse: { floor: ['WeaponStand', 'Dummy', 'Barrel', 'Crate_Wooden', 'Nightstand_Shelf', 'treasure_chest'], wall: ['kite_shield', 'Torch_Metal', 'Peg_Rack', 'Banner_1_Cloth', 'Sword_Bronze', 'Torch_Metal', 'kite_shield'] },
  weaver: { floor: ['spinning_wheel_01', 'Cabinet', 'wicker_basket_02', 'Nightstand_Shelf', 'Bag', 'Crate_Wooden', 'Vase_2'], wall: ['Shelf_Simple', 'Torch_Metal', 'Banner_1_Cloth', 'Peg_Rack'] },
  mill: { floor: ['Bag', 'Barrel', 'Bag', 'wooden_ladder', 'Crate_Wooden', 'Bag', 'Bucket_Wooden_1', 'Nightstand_Shelf'], wall: ['Torch_Metal', 'Peg_Rack', 'Shelf_Simple'] },
  farm: { floor: ['FarmCrate_Apple', 'Barrel_Apples', 'wooden_ladder', 'FarmCrate_Carrot', 'Bag', 'Cabinet', 'Bucket_Wooden_1', 'wicker_basket_02'], wall: ['Shelf_Simple', 'Torch_Metal', 'rusted_spade_01', 'Peg_Rack'] },
  hunter: { floor: ['Crate_Wooden', 'Barrel', 'Bag', 'WeaponStand', 'treasure_chest'], wall: ['Torch_Metal', 'Peg_Rack', 'Axe_Bronze', 'kite_shield', 'rusted_spade_01'] },
  fisher: { floor: ['Barrel', 'Bucket_Wooden_1', 'wicker_basket_02', 'Crate_Wooden'], wall: ['Torch_Metal', 'Peg_Rack'] },
  chapel: { floor: ['CandleStick_Stand', 'CandleStick_Stand', 'BookStand', 'CandleStick_Stand', 'CandleStick_Stand'], wall: ['Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal'] },
};
// extra dressing per building, once its own interior has been laid out
function kitDress(c) {
  const { site, w, d, H, hd, zone, spec } = c, id = site.id, st = spec.kitStyle, R = c.kR, dress = KIT_DRESS[id] || {}, e = 0.21, sy = H / 3;
  const X0 = -w / 2 + e, X1 = w / 2 - e, Z0 = -hd + e, Z1 = hd - e, m = { m: c.Ms, m1: zone, ao: INT_AO }, EXT = { zone: 0, skyVis: 1 };
  // is this patch of floor (house-local) taken by something the house has already registered?
  const blocked = (x, z, r) => {
    const p = m4.tp(c.Ms, [x, 0, z]);
    for (let i = c.kCol0; i < World.colliders.length; i++) {
      const k = World.colliders[i]; if (k.y0 > p[1] + 2.2) continue;
      if (k.r !== undefined) { if (hyp(k.x - p[0], k.z - p[2]) < k.r + r) return true; continue; }
      const dx = p[0] - k.x, dz = p[2] - k.z; if (Math.abs(dx * k.ax + dz * k.az) < k.hx + r && Math.abs(dx * k.bx + dz * k.bz) < k.hz + r) return true;
    }
    for (const dd of c.doors) if (hyp(dd.ins[0] - p[0], dd.ins[2] - p[2]) < 1.25 + r) return true;
    for (const k in World.spots) { const s = World.spots[k]; if (s.site === id && Math.abs(s.p[1] - p[1]) < 1.5 && hyp(s.p[0] - p[0], s.p[2] - p[2]) < 0.6 + r) return true; }
    return false;
  };
  const sides = [
    { wn: 'back', len: X1 - X0, at: (u, o) => [X0 + u, Z1 - o], ry: PI, lo: X0 }, { wn: 'left', len: Z1 - Z0, at: (u, o) => [X0 + o, Z0 + u], ry: PI / 2, lo: Z0 },
    { wn: 'right', len: Z1 - Z0, at: (u, o) => [X1 - o, Z0 + u], ry: -PI / 2, lo: Z0 }, { wn: 'front', len: X1 - X0, at: (u, o) => [X0 + u, Z0 + o], ry: 0, lo: X0 }];
  const nearOpening = (sd, u, half, doorsOnly) => c.openings[sd.wn].some(o => (!doorsOnly || o.door) && Math.abs((o.def.pos || 0) - sd.lo - u) < half + (o.door ? 1.0 : 0.75));
  const tall = [];           // [side, u, half] of tall furniture, so nothing is hung behind it
  // ── floor pieces along the walls ──
  const queue = (dress.floor || []).filter(n => Kit.pieces[n]); let guard = 0;
  for (let si = 0; si < 8 && queue.length; si++) {
    const sd = sides[(si + (R() * 4 | 0)) % 4];
    for (let u = 0.5; u < sd.len - 0.5 && queue.length && guard++ < 400; u += 0.3) {
      const name = queue[0], it = KIT_ITEM[name]; if (!it) { queue.shift(); continue; }
      const sc = it[3], wid = it[0] * sc, dep = it[1] * sc, half = wid / 2;
      if (u - half < 0.12 || u + half > sd.len - 0.12 || nearOpening(sd, u, half, !it[2])) continue;
      const p = sd.at(u, dep / 2 + 0.03), pa = sd.at(u - half * 0.7, dep / 2 + 0.03), pb = sd.at(u + half * 0.7, dep / 2 + 0.03), r = Math.min(dep, wid) * 0.5;
      if (blocked(p[0], p[1], r) || blocked(pa[0], pa[1], r) || blocked(pb[0], pb[1], r)) continue;
      const ry = sd.ry + (it[2] || wid > 1 ? 0 : R.s() * 0.5), y = 0.02 + (name === 'Crate_Wooden' ? 0.05 * sc : 0);
      if (it[4]) kitLit(m, name, p[0], y, p[1], sc, ry, { r: 6.5, c: [2.3, 1.4, 0.6], kind: 'candle' }); else kp(m, name, p[0], y, p[1], sc, ry);
      const fm = { m: m4.mul(m4.create(), c.Ms, m4.rotY(m4.translate(m4.create(), p[0], 0, p[1]), -sd.ry)) };
      if (wid > 0.55) addBoxCollider(fm, -half, -dep / 2, half, dep / 2, 0, it[2] ? 2.2 : 0.9);
      if (it[2]) tall.push([sd, u, half]);
      queue.shift(); u += wid + 0.1 + R() * 0.5;
    }
  }
  // ── things on the walls ──
  const hung = []; let torches = 0;
  const wq = (dress.wall || []).filter(n => Kit.pieces[n]);
  for (let si = 0; si < 8 && wq.length; si++) {
    const sd = sides[(si + 1 + (R() * 4 | 0)) % 4];
    for (let u = 0.8 + R() * 0.6; u < sd.len - 0.7 && wq.length; u += 0.45) {
      const name = wq[0], it = KIT_WALL[name]; if (!it) { wq.shift(); continue; }
      const half = it[0] / 2, y = Math.min(it[1] * (name.startsWith('Banner') ? sy : 1), H - 0.3);
      if (nearOpening(sd, u, half, false) || tall.some(t => t[0] === sd && Math.abs(t[1] - u) < t[2] + half + 0.1) || hung.some(t => t[0] === sd && Math.abs(t[1] - u) < t[2] + half + 0.5)) continue;
      const p = sd.at(u, it[2]);
      if (blocked(sd.at(u, 0.3)[0], sd.at(u, 0.3)[1], 0.12) && y < 2.4) continue;           // a hearth or stair is in front of this stretch of wall
      if (name === 'Torch_Metal') { kitLit(m, name, p[0], y, p[1], 1, sd.ry, { r: 6.2, c: [2.5, 1.45, 0.55], kind: 'fire', flame: 'torch', size: 0.14 }); torches++; }
      else kp(m, name, p[0], y, p[1], it[3] || 1, sd.ry);
      if (name === 'Shelf_Simple') {
        const q = sd.at(u - 0.28, 0.19), q2 = sd.at(u + 0.26, 0.19), pickOn = list => { const l = list.filter(e => Kit.pieces[e[0]]); return l.length ? R.pick(l) : null; };
        const a = pickOn([['SmallBottles_1', 1], ['Book_Stack_1', 1], ['Potion_2', 1], ['ceramic_vase_04', 0.6], ['wooden_bowl_01', 0.8], ['food_pears_asian_01', 1], ['ceramic_pot', 0.5]]);
        const b2 = pickOn([['Book_Stack_2', 0.7], ['Bottle_1', 0.7], ['Vase_4', 0.7], ['brass_goblets', 0.7], ['wooden_candlestick', 0.8], ['carved_wooden_plate', 0.9], ['yellow_onion', 1]]);
        if (a) kp(m, a[0], q[0], y + 0.11, q[1], a[1], sd.ry); if (b2) kp(m, b2[0], q2[0], y + 0.11, q2[1], b2[1], sd.ry + 0.4);
      }
      hung.push([sd, u, half]); wq.shift(); u += it[0] + 1.2 + R() * 1.2;
    }
  }
  if (id === 'chapel') for (const x of [-w * 0.2, w * 0.2]) kitLit(m, 'Chandelier', x, H + 0.9, 0, 1.1, 0, { r: 10, c: [3.0, 1.9, 0.85], kind: 'candle', always: true });
  // ── outside: vines up the walls, a banner by the door ──
  for (let i = 0; i < (st.vines || 0); i++) {
    const wn = R.pick(['back', 'left', 'right', 'front', 'back']), L = WALLS[wn].len(w, d), u = 0.9 + R() * (L - 1.8), up = !!st.up && R() < 0.6;
    if (!up && c.openings[wn].some(o => Math.abs((o.u0 + o.u1) / 2 - u) < 1.5)) continue;
    if (up && st.balcony === wn && Math.abs(u - L / 2) < 2.6) continue;
    c.kb.add(R.pick(['Prop_Vine1', 'Prop_Vine2', 'Prop_Vine1', 'Prop_Vine4']), KH.xf(c.kFrames[wn], u, up ? H + 2.45 : H * 0.84, 0.1, [1.2, up ? 1.2 : Math.min(1.2, H * 0.84 / 2.2), 1]), EXT);
  }
  if (st.dormers) for (const x of st.dormers) { const z = -hd * 0.5, y = c.kYtop + hd * 0.5 * c.tanP - 0.35; c.kb.add('Roof_Dormer_RoundTile', KH.xf(c.kMS, x, y, z, 1.25, PI), { zone: 0, skyVis: 1 }); }
  if (st.banner) { const dw = spec.doors[0].wall, o = c.openings[dw].find(q => q.door), L = WALLS[dw].len(w, d); if (o) for (const sg of [-1, 1]) { const u = (o.u0 + o.u1) / 2 + sg * 2.3; if (u > 0.6 && u < L - 0.6) c.kb.add(sg < 0 ? 'Banner_1' : 'Banner_2', KH.xf(c.kFrames[dw], u, Math.min(3.1 * sy, H + 0.5), 0.12, 1, -PI / 2), EXT); } }
}

// ── scanned ground dressing: rocks, stumps, a trunk, ferns and weeds beside the houses and around the lake shore (instanced, a few hundred in all) ──
function kitScatter() {
  if (!scanOn() || (TEST && TEST.scatter === 0)) return null;
  const R = rng(9091), gy = (x, z) => (Math.abs(x) < 143 && Math.abs(z) < 143) ? Terrain.y(x, z) : terrainH(x, z), B = Kit.batch({ name: 'scan-scatter' });
  const lists = {}, add = (key, name, x, z, s, sink, ry) => { const y = gy(x, z); (lists[key] = lists[key] || {})[name] = lists[key][name] || []; lists[key][name].push(Kit.matrix({ p: [x, y - sink * s, z], ry: ry === undefined ? R() * TAU : ry, s })); return y; };
  const clear = (x, z, pad) => {
    for (const s of SITES) { const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad + (s.porch || 0) + 0.5 && Math.abs(l[1]) < s.d / 2 + pad + 0.5) return false; }
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + pad) < r.w / 2 + pad) return false;
    for (const f of FIELDS) if (x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad) return false;
    if (River.dist(x, z, 7 + pad) < 6.5 + pad) return false;
    if (hyp((x - SQUARE.x) / (SQUARE.rx + 1), (z - SQUARE.z) / (SQUARE.rz + 1)) < 1) return false;
    const dk = World.spots['dock.end']; if (dk && hyp(x - dk.p[0], z - dk.p[2]) < 7) return false;
    for (const c of World.colliders) { if (c.r !== undefined ? hyp(x - c.x, z - c.z) < c.r + pad : (Math.abs(x - c.x) < c.hx + pad + 0.3 && Math.abs(z - c.z) < c.hz + pad + 0.3)) return false; }
    return true;
  };
  const rocks = ['rock_moss_set_02_g', 'rock_moss_set_02_c', 'rock_moss_set_02_a', 'rock_moss_set_01_e'], rockSize = n => Math.max(...Kit.info(n).size);
  const rock = (key, x, z, k) => {       // k: 0 pebble .. 1 boulder
    const n = R.pick(key === 'h' ? rocks.slice(0, 2) : rocks), s = (0.12 + 0.5 * k * k) * (1 + R() * 0.5) / Math.max(0.5, rockSize(n)) * 2.2;
    add(key, n, x, z, s, 0.08 * Kit.info(n).size[1], undefined);
    if (rockSize(n) * s > 0.9 && hyp(x, z) < WORLD_RADIUS + 5) World.colliders.push({ x, z, r: rockSize(n) * s * 0.36, y0: gy(x, z) - 1, y1: gy(x, z) + 0.8 });
  };
  // beside the houses: a few at the foot of the walls, away from the doors
  for (const s of SITES) {
    if (!HOUSES[s.id] || s.id === 'barn') continue;
    const dl = siteDoorLocal(s, 0); let n = 0;
    for (let t = 0; t < 40 && n < 7; t++) {
      const side = R.i(0, 3), u = R.s() * 0.5, off = 0.9 + R() * 1.6;
      const [lx, lz] = side === 0 ? [u * s.w, -s.d / 2 - off] : side === 1 ? [u * s.w, s.d / 2 + off] : side === 2 ? [-s.w / 2 - off, u * s.d] : [s.w / 2 + off, u * s.d];
      if (hyp(lx - dl[0], lz - dl[1]) < 3.2) continue;
      const p = siteToWorld(s, lx, lz); if (!clear(p[0], p[1], 0.5) || Math.abs(gy(p[0], p[1]) - s.y) > 0.5) continue;
      const r = R();
      if (r < 0.34) add('h', 'fern_02_a', p[0], p[1], 0.5 + R() * 0.4, 0.04); else if (r < 0.58) add('h', 'weed_plant_02_a', p[0], p[1], 1.2 + R() * 0.8, 0.02);
      else rock('h', p[0], p[1], R() * 0.6);
      n++;
    }
  }
  // the lake shore: reeds of weeds and fern at the water's edge, rocks half in the shallows, a fallen trunk or two, stumps
  const LK = 'l';
  for (let i = 0, n = 0; i < 400 && n < 78; i++) {
    const a = R() * TAU, r0 = lakeR(LAKE.x + Math.cos(a) * LAKE.r, LAKE.z + Math.sin(a) * LAKE.r), off = -0.8 + Math.pow(R(), 1.3) * 7;
    const x = LAKE.x + Math.cos(a) * (r0 + off), z = LAKE.z + Math.sin(a) * (r0 + off), y = gy(x, z);
    if (y < LAKE.y - 0.35 || y > LAKE.y + 3 || !clear(x, z, 0.4)) continue;
    const q = R();
    if (off < 1.5 && q < 0.5) rock(LK, x, z, 0.2 + R() * 0.8); else if (q < 0.55) add(LK, 'fern_02_a', x, z, 0.55 + R() * 0.5, 0.04); else if (q < 0.8) add(LK, 'weed_plant_02_a', x, z, 1.3 + R() * 0.9, 0.02);
    else if (q < 0.9) rock(LK, x, z, R() * 0.5); else if (q < 0.95) add(LK, 'dead_tree_trunk', x, z, 0.8 + R() * 0.4, 0.05, a + PI / 2 + R.s() * 0.6); else add(LK, 'tree_stump_01', x, z, 0.4 + R() * 0.25, 0.06);
    n++;
  }
  for (const key in lists) for (const name in lists[key]) B.addInstanced(name, lists[key][name], { cell: key === 'h' ? 80 : 60, maxDist: key === 'h' ? 70 : 80, cast: false });
  return B;
}

// ── scene: build the batches once the scene exists, hide interiors that are far away ──
function kitAttach() {
  if (!kitReady() || !SC.scene) return;
  const addG = (g, info) => { g.traverse(o => { if (o.isMesh && info.interior) { o.layers.set(1); o.castShadow = false; } }); SC.scene.add(g); World.kitGroups.push(Object.assign({ g }, info)); };
  // The modelled houses do not draw into the sun-shadow maps: tiled roofs and window frames would triple their cost. One plain
  // box-and-prism stand-in per house casts the shadow instead, all in a single mesh the camera does not see (it writes nothing).
  const tri = [], V = (M, x, y, z) => { const p = m4.tp(M, [x, y, z]); tri.push(p[0], p[1], p[2]); }, Q = (M, a, b2, c2, d2) => { for (const q of [a, b2, c2, a, c2, d2]) V(M, q[0], q[1], q[2]); };
  for (const id in World.kitExt) {
    let k = World.kitExt[id]; if (!k.batch.count) continue;
    const g = k.batch.build(); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); addG(g, { site: k.site });
    const M = k.Ms, x = k.w / 2 + 0.3, xw = k.w / 2 - 0.12, z = k.hd + 0.4, y = k.top, r = y + k.rise + 0.4 * k.rise / k.hd - 0.25; k = Object.assign({}, k, { hd: k.hd - 0.12 });
    Q(M, [-xw, -1, -k.hd], [xw, -1, -k.hd], [xw, y, -k.hd], [-xw, y, -k.hd]); Q(M, [-xw, -1, k.hd], [xw, -1, k.hd], [xw, y, k.hd], [-xw, y, k.hd]);
    Q(M, [-xw, -1, -k.hd], [-xw, -1, k.hd], [-xw, y, k.hd], [-xw, y, -k.hd]); Q(M, [xw, -1, -k.hd], [xw, -1, k.hd], [xw, y, k.hd], [xw, y, -k.hd]);
    Q(M, [-x, y - 0.55, -z], [x, y - 0.55, -z], [x, r, 0], [-x, r, 0]); Q(M, [-x, y - 0.55, z], [x, y - 0.55, z], [x, r, 0], [-x, r, 0]);
    for (const sx of [-xw, xw]) { V(M, sx, y - 0.2, -k.hd); V(M, sx, y - 0.2, k.hd); V(M, sx, r - 0.2, 0); }
  }
  if (tri.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri), 3));
    const mat = new THREE.MeshBasicNodeMaterial(); mat.side = THREE.DoubleSide; mat.colorWrite = false; mat.depthWrite = false; mat.depthTest = false; mat.fog = false;
    const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = -5; mesh.name = 'kit-shadow-proxy'; SC.scene.add(mesh);
  }
  try { const sb = kitScatter(); if (sb) addG(sb.build(), { scatter: true }); } catch (e) { console.warn('scan scatter skipped: ' + (e && e.message || e)); }
  for (const z in World.kitInt) { const k = World.kitInt[z]; if (k.batch.count) addG(k.batch.build(), { site: k.site, interior: true }); }
  if (World.kitYard && World.kitYard.count) { const g = World.kitYard.build(); g.traverse(o => { if (o.isMesh) o.layers.set(1); }); addG(g, { yard: true }); }
  const inner = sceneUpdate;
  sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    // furniture only shows through an open door or a window, so it is drawn for the nearest buildings alone
    for (const k of World.kitGroups) {
      if (k.interior && k.site) k.g.visible = hyp(k.site.x - camPos[0], k.site.z - camPos[2]) < 9 + Math.max(k.site.w, k.site.d) * 0.5;
      else if (k.yard) for (const o of k.g.children) { const bs = o.geometry && o.geometry.boundingSphere; if (bs) o.visible = hyp(bs.center.x - camPos[0], bs.center.z - camPos[2]) < 58 + bs.radius; }
    }
    if (Kit.update) Kit.update(camPos);
  };
}


// ---- 72_buildings.js ----
// ───────────────────────── building specs and furnished interiors ─────────────────────────
const bounds = c => ({ x0: -c.w / 2 + c.t, x1: c.w / 2 - c.t, z0: -c.hd + c.t, z1: c.hd - c.t });
function bedAt(c, name, x, z, rot, w, blanket, fur) {
  at(c.int, x, 0.02, z, rot, () => Props.bed(c.int, w || 1.0, blanket, fur));
  c.spot(name, x, z, -rot, 0.58, { lie: true });
}
function seat(c, name, x, z, h) { c.spot(name, x, z, h, 0.02, { sit: 0.46 }); }
function chestAt(c, x, z, rot, loot, id) { at(c.int, x, 0.02, z, rot, () => Props.chest(c.int)); c.interact(x, 0.5, z, { kind: 'chest', id: c.site.id + '.' + (id || 'chest'), loot, r: 1.8 }); }
function tableSet(c, x, z, rot, len, wid, items, n, seats) {
  const m = c.int;
  at(m, x, 0.02, z, rot, () => { Props.table(m, len, wid); Props.clutter(m, c.R, -len / 2 + 0.25, len / 2 - 0.25, 0.76, 0, items || ['mug', 'plate', 'bowl', 'candle', 'loaf'], n || 3, c);
    if (seats === 'bench') { at(m, 0, 0, -wid / 2 - 0.32, 0, () => Props.bench(m, len * 0.9)); at(m, 0, 0, wid / 2 + 0.32, 0, () => Props.bench(m, len * 0.9)); }
    else if (seats === 'stools') { at(m, -len / 4, 0, -wid / 2 - 0.3, 0, () => Props.stool(m)); at(m, len / 4, 0, wid / 2 + 0.3, 0, () => Props.stool(m)); }
    else if (seats === 'chairs') { at(m, -len / 4, 0, -wid / 2 - 0.32, PI, () => Props.chair(m)); at(m, len / 4, 0, wid / 2 + 0.32, 0, () => Props.chair(m)); } });
}
const ropeCoil = m => { m.mat(MAT.CLOTH, [0.78, 0.62, 0.38], 0.3); m.lathe([[0.10, 0], [0.16, 0.015], [0.165, 0.07], [0.10, 0.085], [0.10, 0]], 10, 0); };
const clothBolt = (m, col) => { m.mat(MAT.CLOTH, col, 0.5); m.push().RZ(PI / 2).T(0.07, -0.3, 0); m.cyl(0, 0, 0, 0.07, 0.07, 0.6, 8, 3); m.pop(); };
const herbs = (m, R) => { m.mat(MAT.PLAIN, R.pick([[0.35, 0.5, 0.25], [0.55, 0.5, 0.25], [0.5, 0.35, 0.5], [0.4, 0.45, 0.2]])); m.lathe([[0.01, -0.34], [0.07, -0.26], [0.035, -0.06], [0.012, 0]], 6, 0); };
const pelt = (m, w, h) => { m.mat(MAT.CLOTH, COL.fur, 0.5); m.quad([-w / 2, h, 0], [-w / 2 * 0.8, 0, 0], [w / 2 * 0.8, 0, 0], [w / 2, h, 0]); };
const antlers = m => { m.mat(MAT.PLAIN, [0.85, 0.78, 0.62]); for (const s of [-1, 1]) { m.tube([[s * 0.03, 0, 0], [s * 0.16, 0.12, 0.05], [s * 0.3, 0.3, 0.06], [s * 0.36, 0.5, 0.02]], [0.022, 0.018, 0.014, 0.006], 5); m.tube([[s * 0.16, 0.12, 0.05], [s * 0.2, 0.26, 0.16]], [0.014, 0.005], 5); m.tube([[s * 0.3, 0.3, 0.06], [s * 0.42, 0.4, 0.14]], [0.012, 0.004], 5); } m.mat(MAT.PLANKS, COL.woodDark, 0.4); m.box(-0.1, -0.1, -0.02, 0.1, 0.08, 0); };

function cottageInterior(c, o) {
  o = o || {}; const m = c.int, R = c.R, B = bounds(c);
  c.fireplace(B.x0, o.fz || 0, 0, { w: 1.7, cauldron: o.cauldron });
  bedAt(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, o.blanket, o.fur);
  if (o.bed2) bedAt(c, 'bed2', B.x1 - 1.9, B.z1 - 1.08, PI, 1.0, o.blanket2 || COL.blue);
  chestAt(c, B.x1 - 0.45, B.z1 - 2.5, PI / 2, o.loot || [['gold', 4 + R.i(0, 6)]]);
  tableSet(c, o.tx === undefined ? -0.5 : o.tx, o.tz === undefined ? 0.35 : o.tz, 0, 1.5, 0.8, o.tableItems, 3, o.seats || 'stools');
  at(m, o.tx === undefined ? -0.5 : o.tx, 0.02, o.tz === undefined ? 0.35 : o.tz, 0.2, () => Props.rug(m, 2.2, 1.6, o.rug || COL.red));
  if (!o.noShelf) at(m, o.sx === undefined ? -0.3 : o.sx, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 1.6, 1.8, 3, 0.32, (i, y) => Props.clutter(m, R, -0.65, 0.65, y, 0, o.shelfItems || ['pot', 'jug', 'bowl', 'book', 'bottle', 'cheese'], 4)));
  at(m, B.x0 + 0.5, 0.02, B.z0 + 0.5, 0, () => Props.barrel(m)); at(m, B.x0 + 1.15, 0.02, B.z0 + 0.42, 0.5, () => Props.sack(m, 0.26));
  at(m, B.x0 + 0.45, 1.6, (o.fz || 0) - 0.7, 0, () => Props.candle(m, c)); at(m, B.x0 + 0.45, 1.6, (o.fz || 0) + 0.7, 0, () => Props.pot(m, 0.08));
  c.spot('home', 0.6, -0.9, o.homeYaw || 0);
  seat(c, 'sit', (o.tx === undefined ? -0.5 : o.tx) - 0.375, (o.tz === undefined ? 0.35 : o.tz) - 0.7, PI);
}

const HOUSES = {
  inn: {
    H: 3.6, walls: 'half', stoneH: 1.2, roof: 'shingle', roofCol: [0.72, 0.66, 0.62], pitch: 48, plaster: [1, 0.97, 0.9],
    doors: [{ wall: 'front', pos: 0, w: 1.3, h: 2.15 }],
    windows: [{ wall: 'front', pos: -5.4, w: 1.1 }, { wall: 'front', pos: -2.9, w: 1.1 }, { wall: 'front', pos: 2.9, w: 1.1 }, { wall: 'front', pos: 5.4, w: 1.1 }, { wall: 'back', pos: -4.8, w: 1.1 },
      { wall: 'right', pos: -1.7, sill: 2.95, h: 0.55, w: 0.8, shutters: false }, { wall: 'right', pos: 1.7, sill: 2.95, h: 0.55, w: 0.8, shutters: false }, { wall: 'right', pos: -2.6, w: 0.9 }],
    shutter: [0.5, 0.2, 0.16], noTie: x => x > 2.0,
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c), LY = 2.6, LX = 2.4;
      c.fireplace(B.x0, 0, 0, { w: 2.7, size: 0.8, r: 14, c: [4.6, 2.3, 0.8] });
      at(m, B.x0 + 0.68, 2.3, 0, PI / 2, () => { Props.shield(m, COL.red); at(m, 0, -0.45, 0.02, 0, () => { m.push().RZ(0.6); Props.sword(m); m.pop(); m.push().RZ(-0.6); Props.sword(m); m.pop(); }); });
      at(m, -5.0, 0.02, -1.3, PI / 2, () => Props.chair(m)); at(m, -5.0, 0.02, 1.3, PI / 2, () => Props.chair(m));
      seat(c, 'fire1', -5.0, -1.3, -PI / 2); seat(c, 'fire2', -5.0, 1.3, -PI / 2);
      at(m, -4.4, 0.02, 0, 0, () => Props.rug(m, 2.0, 3.0, [0.55, 0.18, 0.14]));
      const items = ['mug', 'mug', 'plate', 'bowl', 'candle', 'loaf', 'jug', 'cheese'];
      tableSet(c, -1.9, -2.3, 0, 3.0, 0.85, items, 6, 'bench'); tableSet(c, -1.9, 1.5, 0, 3.0, 0.85, items, 6, 'bench'); tableSet(c, 1.1, -2.9, 0, 1.8, 0.8, items, 3, 'bench');
      seat(c, 's1', -2.8, -3.05, PI); seat(c, 's2', -1.2, -1.55, 0); seat(c, 's3', -2.6, 0.75, PI); seat(c, 's4', -1.0, 2.25, 0); seat(c, 's5', -0.4, -3.05, PI); seat(c, 's6', 1.1, -2.15, 0);
      c.spot('bard', -4.2, 2.9, PI / 2); c.spot('stand1', 0.8, 0.2, -PI / 2); c.spot('stand2', -0.2, -0.3, PI * 0.8);
      // stairs along the back wall up to the loft
      const sx0 = -2.2, sz0 = 3.05, sz1 = 4.05, n = 13;
      m.mat(MAT.TIMBER, COL.timber);
      for (const z of [sz0 + 0.04, sz1 - 0.04]) m.beam([sx0, 0.02, z], [LX, LY - 0.05, z], 0.07, 0.24);
      m.mat(MAT.PLANKS, COL.wood);
      for (let i = 0; i < n; i++) { const x = lerp(sx0, LX, (i + 0.5) / n), y = LY * (i + 1) / n; m.box(x - 0.2, y - 0.045, sz0, x + 0.2, y, sz1); }
      addFloor(m, sx0, sz0, LX, sz1, 0.02, LY + 0.02, 'x');
      m.mat(MAT.TIMBER, COL.timber); m.beam([sx0, 0.95, sz0 + 0.03], [LX, LY + 0.95, sz0 + 0.03], 0.06, 0.07);
      for (let i = 0; i <= 4; i++) { const k = i / 4, x = lerp(sx0, LX, k), y = LY * k; m.box(x - 0.035, y, sz0, x + 0.035, y + 0.95, sz0 + 0.07); }
      // loft floor with joists, railing
      m.mat(MAT.PLANKS, COL.wood); m.box(LX, LY - 0.07, B.z0, B.x1, LY + 0.02, B.z1);
      m.mat(MAT.TIMBER, COL.timber); m.box(LX - 0.1, LY - 0.26, B.z0, LX + 0.1, LY - 0.07, B.z1);
      for (let x = LX + 1.1; x < B.x1; x += 1.15) m.box(x - 0.07, LY - 0.24, B.z0, x + 0.07, LY - 0.07, B.z1, 8);
      for (const z of [-2.2, 2.4]) m.cbox(LX, 0.02, z, 0.18, LY - 0.28, 0.18, 12);
      addFloor(m, LX, B.z0, B.x1, B.z1, LY + 0.03);
      m.box(LX - 0.03, LY + 0.92, B.z0 + 0.5, LX + 0.03, LY + 1.0, sz0 - 0.08); m.box(LX - 0.025, LY + 0.45, B.z0 + 0.5, LX + 0.025, LY + 0.51, sz0 - 0.08);
      for (let z = B.z0 + 0.5; z <= sz0 - 0.05; z += 1.03) m.cbox(LX, LY, z, 0.07, 1.0, 0.07, 4);
      addBoxCollider(m, LX - 0.08, B.z0, LX + 0.08, sz0 - 0.05, LY, LY + 1.1);
      addBoxCollider(m, LX, B.z0, B.x1, -3.95, LY, LY + 2.2); addBoxCollider(m, LX, 4.02, B.x1, B.z1, LY, LY + 2.2);
      // guest loft
      m.push().T(0, LY, 0);
      at(m, 6.15, 0.02, -2.0, -PI / 2, () => Props.bed(m, 1.0, COL.green)); at(m, 6.15, 0.02, 1.4, -PI / 2, () => Props.bed(m, 1.0, COL.blue));
      at(m, 6.75, 0.02, -0.3, PI / 2, () => Props.chest(m)); at(m, 4.2, 0.02, -3.2, 0, () => { Props.table(m, 1.0, 0.6); at(m, 0, 0.76, 0, 0, () => Props.candle(m, c, true)); at(m, 0.3, 0.76, 0.05, 0.4, () => Props.book(m, COL.blue)); });
      at(m, 4.6, 0.02, -0.3, 0, () => Props.rug(m, 1.8, 2.6, COL.blue)); at(m, 4.2, 0.02, -2.55, 0, () => Props.stool(m));
      m.pop();
      c.spot('guestbed', 6.15, -2.0, PI / 2, LY + 0.58, { lie: true }); c.spot('bed2', 6.15, 1.4, PI / 2, LY + 0.58, { lie: true });
      c.spot('stairs0', sx0 - 0.5, 3.55, PI / 2); c.spot('stairs1', LX + 0.5, 3.55, PI / 2, LY + 0.03);
      c.interact(6.15, LY + 0.6, -2.0, { kind: 'bed', id: 'inn.bed', r: 1.9 });
      c.interact(6.75, LY + 0.5, -0.3, { kind: 'chest', id: 'inn.chest', loot: [['gold', 6], ['apple', 1]], r: 1.7 });
      c.interact(4.5, LY + 0.9, -3.2, { kind: 'read', id: 'inn.note', title: 'A note on the table', text: 'Traveller — the bed by the window is yours for as long as you stay. Breakfast when the cock crows, ale when the sun sets. — G.', r: 1.5 });
      // bar under the loft
      m.mat(MAT.PLANKS, COL.woodDark); m.box(3.1, 0.02, 0.9, 6.5, 1.02, 1.45); m.mat(MAT.PLANKS, COL.wood); m.box(3.0, 1.02, 0.8, 6.6, 1.09, 1.55);
      addBoxCollider(m, 3.0, 0.8, 6.6, 1.55, 0, 1.1);
      at(m, 4.8, 1.09, 1.18, 0, () => Props.clutter(m, R, -1.5, 1.5, 0, 0, ['mug', 'mug', 'jug', 'bottle', 'candle', 'mug', 'plate'], 7, c));
      for (const x of [3.7, 4.9, 6.1]) { m.mat(MAT.PLANKS, COL.woodDark); m.box(x - 0.5, 0.02, 3.55, x + 0.5, 0.6, 4.4); at(m, x, 0.6, 3.98, PI / 2, () => Props.keg(m, 0.36, 0.85)); }
      addBoxCollider(m, 3.2, 3.5, 6.6, 4.45, 0, 1.5);
      at(m, B.x1 - 0.17, 0.02, 2.5, PI / 2, () => Props.shelf(m, 1.7, 1.9, 3, 0.3, (i, y) => Props.clutter(m, R, -0.7, 0.7, y, 0, ['bottle', 'mug', 'jug', 'bottle', 'pot'], 5)));
      c.spot('bar', 4.8, 2.5, 0); c.spot('barfront', 4.6, 0.25, PI);
      for (const [x, z] of [[6.55, -3.9], [5.75, -4.0], [6.6, -3.1]]) at(m, x, 0.02, z, 0, () => Props.barrel(m));
      at(m, -0.6, 0.02, 3.6, 0.3, () => Props.crate(m, 0.6)); at(m, -1.5, 0.02, 3.8, 0, () => Props.barrel(m, 0.3, 0.8));
      at(m, 0, 0.02, -3.4, 0, () => Props.rug(m, 1.6, 1.4, [0.35, 0.3, 0.2]));
      // wheel chandelier over the hall
      at(m, -2.0, 4.3, -0.3, 0, () => {
        m.mat(MAT.METAL, COL.black); m.box(-0.012, 0, -0.012, 0.012, c.ridgeY - 4.5, 0.012);
        m.mat(MAT.TIMBER, COL.woodDark); m.lathe([[0.72, -0.05], [0.8, -0.05], [0.8, 0.05], [0.72, 0.05], [0.72, -0.05]], 14, 0);
        for (let i = 0; i < 4; i++) m.beam([0, 0, 0], [Math.cos(i * PI / 2) * 0.74, 0, Math.sin(i * PI / 2) * 0.74], 0.05, 0.05);
        for (let i = 0; i < 6; i++) at(m, Math.cos(i * TAU / 6) * 0.76, 0.05, Math.sin(i * TAU / 6) * 0.76, 0, () => Props.candle(m, { zone: c.zone, candleLight: false }));
        addLight(wp(m, 0, -0.3, 0), 9, [3.0, 1.9, 0.85], c.zone, 'candle');
      });
      at(m, B.x0 + 0.8, 1.6, 0.9, 0, () => Props.candle(m, c, true)); at(m, B.x0 + 0.8, 1.6, -0.9, 0, () => Props.jug(m));
    },
  },
  smithy: {
    H: 2.7, walls: 'half', stoneH: 1.45, roof: 'shingle', roofCol: [0.62, 0.58, 0.56], plaster: [0.96, 0.92, 0.86],
    doors: [{ wall: 'front', pos: 3.0 }],
    windows: [{ wall: 'front', pos: 0.85, w: 0.8, shutters: false }, { wall: 'back', pos: -2.6 }, { wall: 'back', pos: 2.4 }, { wall: 'right', pos: 0.2 }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c), e = c.ext, hd = c.hd;
      c.fireplace(B.x0, 0.4, 0, { w: 1.7 });
      bedAt(c, 'bed', -1.7, B.z1 - 0.62, PI / 2, 1.0, [0.45, 0.3, 0.2], true);
      tableSet(c, 0.4, -0.9, 0, 1.3, 0.75, ['mug', 'plate', 'loaf', 'candle'], 3, 'stools');
      at(m, 2.5, 0.02, B.z1 - 0.42, 0, () => { Props.table(m, 2.2, 0.75, 0.86); for (let i = 0; i < 3; i++) at(m, -0.7 + i * 0.5, 0.86, R.s() * 0.1, 0, () => { m.push().RZ(PI / 2).RX(R() * 3); Props.hammer(m); m.pop(); }); m.mat(MAT.METAL, COL.iron); m.box(0.6, 0.86, -0.15, 0.95, 0.92, 0.15); m.box(0.7, 0.92, -0.1, 0.85, 1.02, 0.1); });
      at(m, B.x1 - 0.06, 1.05, -1.0, 0, () => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.03, 0, -1.1, 0.02, 1.1, 1.1); for (let i = 0; i < 4; i++) at(m, -0.06, 0.05, -0.75 + i * 0.5, PI / 2, () => Props.sword(m)); });
      at(m, 1.2, 1.5, B.z0 + 0.04, 0, () => Props.shield(m, COL.blue)); at(m, 2.0, 1.5, B.z0 + 0.04, 0, () => Props.shield(m, [0.6, 0.5, 0.2]));
      chestAt(c, 0.5, B.z1 - 0.4, 0, [['gold', 8]]);
      at(m, B.x1 - 0.5, 0.02, 2.4, 0, () => { Props.barrel(m, 0.3, 0.8); for (let i = 0; i < 3; i++) at(m, R.s() * 0.12, 0.3, R.s() * 0.12, R() * 3, () => { m.push().RZ(R.s() * 0.2); Props.sword(m); m.pop(); }); });
      c.spot('home', 0.9, 0.5, 0); seat(c, 'sit', 0.075, -1.6, PI);
      // ── lean-to forge porch on the front ──
      const z0 = -hd - 3.5, px0 = -4.9, px1 = 1.7, fy = -0.14;
      e.m1 = 0; e.ao = 1;
      e.mat(MAT.COBBLE, [1, 1, 1], 1.3); e.box(px0, -0.9, z0, px1, fy, -hd);
      addFloor(e, px0, z0, px1, -hd, fy);
      e.mat(MAT.TIMBER, COL.timberDark);
      for (const x of [px0 + 0.15, -1.6, px1 - 0.15]) { e.cbox(x, fy, z0 + 0.2, 0.18, 2.3, 0.18, 12); addBoxCollider(e, x - 0.1, z0 + 0.1, x + 0.1, z0 + 0.3, fy, 2.4); e.beam([x, 1.75, z0 + 0.2], [x + (x > 0 ? -0.5 : 0.5), 2.12, z0 + 0.2], 0.08, 0.08); }
      e.box(px0, 2.12, z0 + 0.1, px1, 2.3, z0 + 0.3);
      for (let x = px0 + 0.2; x <= px1; x += 1.05) e.beam([x, 2.72, -hd], [x, 2.24, z0 - 0.25], 0.08, 0.12);
      e.mat(MAT.SHINGLE, [0.62, 0.58, 0.56]);
      e.quad([px1 + 0.2, 2.86, -hd], [px1 + 0.2, 2.34, z0 - 0.35], [px0 - 0.2, 2.34, z0 - 0.35], [px0 - 0.2, 2.86, -hd], 0, 0, (px1 - px0 + 0.4) / 2, 3.9 / 2);
      e.mat(MAT.PLANKS, COL.woodDark); e.ao = 0.5; e.quad([px0 - 0.2, 2.83, -hd], [px0 - 0.2, 2.31, z0 - 0.35], [px1 + 0.2, 2.31, z0 - 0.35], [px1 + 0.2, 2.83, -hd]); e.ao = 1;
      // forge hearth + hood
      e.mat(MAT.STONE, [0.9, 0.88, 0.85], 0.8); e.box(-4.6, fy, -hd - 1.45, -2.9, 0.85, -hd - 0.05);
      e.box(-4.6, 0.85, -hd - 0.35, -2.9, 2.1, -hd - 0.05); e.box(-4.6, 1.7, -hd - 1.3, -2.9, 2.1, -hd - 0.35); e.cbox(-3.75, 2.1, -hd - 0.5, 0.8, 2.3, 0.75);
      e.cbox(-3.75, 4.4, -hd - 0.5, 0.95, 0.13, 0.9);
      emit(e, 1.8, () => { e.mat(MAT.PLAIN, [1, 0.38, 0.08]); e.box(-4.4, 0.85, -hd - 1.3, -3.1, 0.9, -hd - 0.4, 4); });
      const fp = wp(e, -3.75, 1.02, -hd - 0.85);
      World.emitters.push({ type: 'fire', p: fp, size: 0.42, zone: 0 }); World.emitters.push({ type: 'smoke', p: wp(e, -3.75, 4.6, -hd - 0.5), zone: 0 });
      addLight(wp(e, -3.6, 1.5, -hd - 1.9), 8.5, [3.6, 1.7, 0.55], 0, 'fire');
      addBoxCollider(e, -4.6, -hd - 1.45, -2.9, -hd, fy, 2.2);
      at(e, -2.45, fy, -hd - 0.75, 0, () => { e.mat(MAT.PLANKS, COL.wood, 0.5); e.poly([[0, 0.55, -0.3], [0, 0.55, 0.3], [0.9, 0.75, 0.05], [0.9, 0.75, -0.05]]); e.box(0, 0.5, -0.3, 0.05, 1.0, 0.3); e.mat(MAT.PLAIN, COL.leather); e.poly([[0, 1.0, 0.3], [0, 1.0, -0.3], [0.9, 0.8, -0.05], [0.9, 0.8, 0.05]]); e.poly([[0, 0.55, 0.3], [0, 1.0, 0.3], [0.9, 0.8, 0.05], [0.9, 0.75, 0.05]]); e.poly([[0, 1.0, -0.3], [0, 0.55, -0.3], [0.9, 0.75, -0.05], [0.9, 0.8, -0.05]]); e.mat(MAT.TIMBER, COL.timber); e.cbox(0.2, 0, 0, 0.5, 0.5, 0.5); });
      at(e, -1.75, fy, -hd - 2.0, 0.3, () => Props.anvil(e));
      c.spot('anvil', -1.75, -hd - 2.75, PI, fy); c.spot('forge', -3.6, -hd - 2.1, PI, fy);
      at(e, -0.1, fy, -hd - 0.55, 0, () => { e.mat(MAT.PLANKS, COL.woodDark, 0.6); e.box(-0.7, 0, -0.3, 0.7, 0.55, 0.3); e.mat(MAT.PLAIN, [0.06, 0.1, 0.12]); e.quad([-0.63, 0.5, -0.24], [-0.63, 0.5, 0.24], [0.63, 0.5, 0.24], [0.63, 0.5, -0.24]); addBoxCollider(e, -0.7, -0.3, 0.7, 0.3, 0, 0.6); });
      at(e, 0.9, fy, -hd - 2.5, 0, () => { e.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) { e.beam([s * 0.3, 0, -0.25], [s * 0.3, 0.7, 0], 0.06, 0.06); e.beam([s * 0.3, 0, 0.25], [s * 0.3, 0.7, 0], 0.06, 0.06); } e.mat(MAT.ROCK, [0.9, 0.9, 0.9], 0.3); e.push().T(0, 0.7, 0).RZ(PI / 2).T(0, -0.07, 0); e.cyl(0, 0, 0, 0.36, 0.36, 0.14, 14, 3); e.pop(); addCircleCollider(e, 0, 0, 0.4, 0, 1); });
      at(e, -0.9, 1.75, -hd - 0.03, 0, () => { e.mat(MAT.PLANKS, COL.woodDark); e.box(-0.8, 0, -0.03, 0.8, 0.12, 0); for (let i = 0; i < 4; i++) at(e, -0.6 + i * 0.4, -0.3, -0.05, 0, () => Props.hammer(e)); });
      at(e, 1.2, fy, -hd - 0.5, 0, () => Props.crate(e, 0.7)); at(e, 1.2, fy + crateTop(0.7), -hd - 0.5, 0, () => { e.mat(MAT.METAL, COL.iron); for (let i = 0; i < 4; i++) e.box(-0.25 + (i % 2) * 0.06, i * 0.05, -0.2, 0.25 + (i % 2) * 0.06, i * 0.05 + 0.045, -0.08 + (i % 2) * 0.2); });
      at(e, -4.4, fy, -hd - 2.6, 0, () => Props.barrel(e)); at(e, -4.3, fy, -hd - 3.25, 0, () => Props.sack(e, 0.3, [0.2, 0.2, 0.2]));
      // hanging sign
      at(e, 3.9, 2.55, -hd, 0, () => { e.mat(MAT.METAL, COL.black); e.beam([0, 0, 0], [0, 0, -0.95], 0.035, 0.035); e.mat(MAT.PLANKS, COL.woodDark, 0.5); e.box(-0.02, -0.62, -0.9, 0.02, -0.08, -0.2); e.mat(MAT.METAL, COL.steel); for (const s of [-1, 1]) { e.box(s * 0.021 - 0.004, -0.36, -0.72, s * 0.021 + 0.004, -0.28, -0.36); e.box(s * 0.021 - 0.004, -0.50, -0.62, s * 0.021 + 0.004, -0.36, -0.48); e.box(s * 0.021 - 0.004, -0.55, -0.70, s * 0.021 + 0.004, -0.50, -0.40); } });
    },
  },
  store: {
    H: 2.6, walls: 'timber', roof: 'shingle', roofCol: [0.82, 0.62, 0.5], ceiling: true, plaster: [1, 0.95, 0.82], shutter: [0.25, 0.38, 0.55],
    doors: [{ wall: 'front', pos: -1.9 }],
    windows: [{ wall: 'front', pos: 1.3, w: 1.5, shutters: false }, { wall: 'left', pos: 0.3 }, { wall: 'right', pos: -0.6 }, { wall: 'back', pos: -2.9, w: 0.7 }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c);
      m.mat(MAT.PLANKS, COL.woodDark); m.box(-1.2, 0.02, 0.3, 3.4, 0.98, 0.85); m.mat(MAT.PLANKS, COL.wood); m.box(-1.3, 0.98, 0.2, 3.5, 1.05, 0.95);
      addBoxCollider(m, -1.3, 0.2, 3.5, 0.95, 0, 1.1);
      at(m, 1.1, 1.05, 0.58, 0, () => { Props.clutter(m, R, -2.0, 2.0, 0, 0, ['candle', 'cheese', 'book', 'bottle', 'pot', 'loaf', 'jug'], 7, c); });
      at(m, -0.6, 1.05, 0.55, 0.4, () => ropeCoil(m)); at(m, -0.6, 1.14, 0.55, 1.1, () => ropeCoil(m));
      c.interact(-0.6, 1.2, 0.55, { kind: 'shopitem', id: 'rope', r: 1.6 });
      at(m, 2.9, 1.05, 0.55, 0, () => { m.mat(MAT.METAL, COL.bronze); m.box(-0.012, 0, -0.012, 0.012, 0.32, 0.012); m.box(-0.22, 0.30, -0.01, 0.22, 0.32, 0.01); for (const s of [-1, 1]) { m.box(s * 0.2 - 0.004, 0.14, -0.004, s * 0.2 + 0.004, 0.3, 0.004); m.lathe([[0.02, 0.10], [0.09, 0.14]], 8, 1); m.push().T(s * 0.2, 0, 0); m.lathe([[0.02, 0.10], [0.09, 0.14]], 8, 1); m.pop(); } });
      const goods = ['pot', 'bottle', 'jug', 'book', 'cheese', 'bowl', 'pot', 'bottle'];
      at(m, -0.7, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 2.4, 2.1, 4, 0.32, (i, y) => Props.clutter(m, R, -1.05, 1.05, y, 0, goods, 6)));
      at(m, 2.25, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 2.6, 2.1, 4, 0.32, (i, y) => { if (i < 2) for (let k = 0; k < 4; k++) at(m, -0.9 + k * 0.6, y, 0, PI / 2, () => clothBolt(m, R.pick([COL.red, COL.blue, COL.green, COL.linen, COL.gold, COL.purple]))); else Props.clutter(m, R, -1.1, 1.1, y, 0, goods, 6); }));
      at(m, B.x1 - 0.17, 0.02, -1.6, PI / 2, () => Props.shelf(m, 2.0, 2.0, 4, 0.32, (i, y) => Props.clutter(m, R, -0.85, 0.85, y, 0, ['loaf', 'cheese', 'apple', 'cabbage', 'pot', 'jug'], 5)));
      for (const [x, z] of [[3.3, -2.5], [2.5, -2.55]]) at(m, x, 0.02, z, 0, () => { Props.barrel(m); for (let i = 0; i < 7; i++) at(m, R.s() * 0.18, 0.86, R.s() * 0.18, 0, () => Props.apple(m, x > 3 ? COL.apple : [0.62, 0.7, 0.22])); });
      at(m, 0.5, 0.02, -2.5, 0.2, () => Props.crate(m, 0.65)); at(m, 0.45, 0.02 + crateTop(0.65), -2.5, 0.6, () => { for (let i = 0; i < 4; i++) at(m, (i % 2) * 0.24 - 0.12, 0, (i >> 1) * 0.24 - 0.12, 0, () => Props.cabbage(m)); });
      at(m, -3.3, 0.02, -0.6, 0, () => Props.sack(m, 0.33)); at(m, -3.35, 0.02, 0.1, 0.7, () => Props.sack(m, 0.3, [0.85, 0.82, 0.74])); at(m, -3.2, 0.02, -1.3, 0, () => Props.crate(m, 0.55));
      at(m, B.x0 + 0.03, 1.5, -1.9, PI / 2, () => { m.push().RZ(PI / 2); ropeCoil(m); m.pop(); });
      bedAt(c, 'bed', -3.1, 2.0, PI, 1.0, COL.purple);
      at(m, 0.2, c.H, -1.4, 0, () => Props.lantern(m, c));
      at(m, 0, 0.02, -1.6, 0, () => Props.rug(m, 2.4, 1.6, COL.green));
      c.spot('counter', 1.2, 1.7, 0); c.spot('front', 1.0, -0.6, PI);
    },
  },
  elder: {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [1, 1, 0.94], shutter: [0.42, 0.52, 0.36],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.7 }, { wall: 'back', pos: -1.3 }, { wall: 'right', pos: -0.9 }],
    interior(c) {
      cottageInterior(c, { blanket: [0.5, 0.42, 0.3], shelfItems: ['book', 'book', 'book', 'pot', 'candle', 'book'], rug: COL.blue, seats: 'chairs', tableItems: ['book', 'candle', 'mug', 'book'] });
      const m = c.int, B = bounds(c);
      at(m, 1.4, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 1.2, 1.9, 4, 0.3, (i, y) => { for (let k = 0; k < 6; k++) at(m, -0.42 + k * 0.17, y + 0.12, 0, 0, () => { m.push().RZ(PI / 2).RY(PI / 2); Props.book(m, c.R.pick([COL.red, COL.blue, COL.green, COL.leather, COL.purple]), 0.035 + c.R() * 0.02); m.pop(); }); }));
      c.interact(-0.5, 0.9, 0.35, { kind: 'read', id: 'elder.book', title: 'Rowan’s chronicle', text: 'Year of the long frost. The beacon on the crag has stood dark since my grandfather’s day, yet the valley endures. We kept the Dawn bell ringing through every winter but this one.', r: 1.6 });
    },
  },
  herbalist: {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [0.98, 0.95, 0.85], shutter: [0.5, 0.36, 0.5], roofCol: [0.95, 0.98, 0.9],
    doors: [{ wall: 'front', pos: -0.9 }], windows: [{ wall: 'front', pos: 1.5 }, { wall: 'back', pos: 1.2 }, { wall: 'right', pos: 0.6 }],
    interior(c) {
      cottageInterior(c, { cauldron: true, blanket: COL.purple, shelfItems: ['bottle', 'pot', 'bottle', 'jug', 'bowl', 'bottle'], rug: COL.green, tableItems: ['bowl', 'bottle', 'candle', 'pot'], sx: -0.9 });
      const m = c.int, B = bounds(c);
      for (let x = B.x0 + 1.2; x < B.x1 - 0.4; x += 0.42) at(m, x, c.H - 0.2, c.R.s() * 0.3 + (Math.round(x * 3) % 2 ? 1.1 : -1.3), 0, () => herbs(m, c.R));
      at(m, 1.3, 0.02, B.z0 + 0.4, PI, () => { Props.table(m, 1.4, 0.6, 0.85); Props.clutter(m, c.R, -0.5, 0.5, 0.85, 0, ['bowl', 'bottle', 'pot', 'bottle'], 4); });
    },
  },
  guardhouse: {
    H: 2.5, walls: 'half', stoneH: 1.0, roof: 'shingle', roofCol: [0.7, 0.66, 0.62],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.7 }, { wall: 'back', pos: -1.2 }, { wall: 'right', pos: -0.8 }],
    interior(c) {
      cottageInterior(c, { bed2: true, blanket: [0.45, 0.2, 0.18], blanket2: [0.45, 0.2, 0.18], tableItems: ['mug', 'plate', 'candle', 'loaf'], noShelf: true });
      const m = c.int, B = bounds(c);
      at(m, -0.4, 0.02, B.z1 - 0.1, 0, () => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.8, 0.3, -0.04, 0.8, 0.42, 0.04); m.box(-0.8, 1.5, -0.04, 0.8, 1.6, 0.04); for (let i = 0; i < 4; i++) at(m, -0.55 + i * 0.37, 0.36, -0.08, 0, () => Props.sword(m)); });
      at(m, 1.3, 1.6, B.z0 + 0.04, 0, () => Props.shield(m, [0.55, 0.15, 0.12])); at(m, 2.2, 1.6, B.z0 + 0.04, 0, () => Props.shield(m, [0.55, 0.15, 0.12]));
    },
  },
  weaver: {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [1, 0.92, 0.86], shutter: [0.3, 0.42, 0.55],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.8 }, { wall: 'back', pos: -1.3 }, { wall: 'back', pos: 1.4 }, { wall: 'right', pos: -0.8 }],
    interior(c) {
      cottageInterior(c, { blanket: COL.blue, bed2: true, blanket2: [0.7, 0.4, 0.4], tx: -1.3, tz: 1.2, noShelf: true });
      const m = c.int, B = bounds(c);
      at(m, 1.2, 0.02, -1.6, 0.25, () => {       // loom
        m.mat(MAT.TIMBER, COL.wood); for (const s of [-1, 1]) { m.cbox(s * 0.7, 0, -0.4, 0.08, 1.7, 0.08, 4); m.cbox(s * 0.7, 0, 0.4, 0.08, 1.0, 0.08, 4); m.beam([s * 0.7, 0.95, 0.4], [s * 0.7, 0.95, -0.4], 0.06, 0.06); }
        m.beam([-0.7, 1.65, -0.4], [0.7, 1.65, -0.4], 0.07, 0.07); m.beam([-0.7, 0.4, -0.4], [0.7, 0.4, -0.4], 0.07, 0.07); m.beam([-0.7, 0.95, 0.4], [0.7, 0.95, 0.4], 0.07, 0.07);
        m.mat(MAT.STRIPES, COL.red, 0.5); m.quad2([-0.6, 1.62, -0.38], [-0.6, 0.97, 0.38], [0.6, 0.97, 0.38], [0.6, 1.62, -0.38]);
        addBoxCollider(m, -0.75, -0.45, 0.75, 0.45, 0, 1.7);
      });
      at(m, 2.7, 0.02, -2.0, 0, () => Props.sack(m, 0.3, [0.92, 0.9, 0.85])); at(m, 2.1, 0.02, -2.3, 0, () => Props.sack(m, 0.26, [0.92, 0.9, 0.85]));
      at(m, 0.6, 0.02, B.z1 - 0.2, 0, () => { Props.table(m, 1.3, 0.4, 0.8); for (let k = 0; k < 3; k++) at(m, -0.4 + k * 0.4, 0.8, 0, PI / 2, () => clothBolt(m, [COL.red, COL.gold, COL.green][k])); });
    },
  },
  farm: {
    H: 2.5, walls: 'timber', roof: 'thatch', plaster: [1, 0.96, 0.84], shutter: [0.5, 0.25, 0.2],
    doors: [{ wall: 'front', pos: 1.0 }], windows: [{ wall: 'front', pos: -1.9 }, { wall: 'back', pos: -1.5 }, { wall: 'back', pos: 1.7 }, { wall: 'right', pos: -1.0 }],
    interior(c) {
      cottageInterior(c, { cauldron: true, bed2: true, blanket: COL.gold, blanket2: COL.green, tableItems: ['loaf', 'cheese', 'bowl', 'mug', 'apple'], seats: 'bench', tx: -0.9, tz: 0.3 });
      const m = c.int, B = bounds(c);
      for (let i = 0; i < 5; i++) at(m, B.x0 + 1.6 + i * 0.5, c.H - 0.2, -1.4, 0, () => herbs(m, c.R));
      at(m, B.x0 + 0.5, 0.02, B.z1 - 0.5, 0, () => Props.sack(m, 0.34)); at(m, B.x0 + 1.2, 0.02, B.z1 - 0.45, 0, () => Props.crate(m, 0.55));
    },
  },
  hunter: {
    H: 2.3, walls: 'log', roof: 'thatch', roofCol: [0.85, 0.85, 0.8],
    doors: [{ wall: 'front', pos: 0.8 }], windows: [{ wall: 'front', pos: -1.4, w: 0.7, h: 0.8 }, { wall: 'back', pos: 0.3, w: 0.7, h: 0.8 }],
    interior(c) {
      cottageInterior(c, { fur: true, blanket: [0.4, 0.3, 0.2], noShelf: true, tableItems: ['mug', 'bowl', 'candle'], rug: [0.5, 0.4, 0.3] });
      const m = c.int, B = bounds(c);
      at(m, -0.6, 1.3, B.z1 - 0.02, PI, () => pelt(m, 1.1, 0.9)); at(m, 1.0, 1.25, B.z1 - 0.02, PI, () => pelt(m, 0.8, 0.7));
      at(m, B.x0 + 0.68, 1.85, 0, PI / 2, () => antlers(m));
      at(m, -1.8, 0.02, B.z0 + 0.1, 0, () => { m.mat(MAT.TIMBER, COL.wood); m.tube([[0, 0.3, 0], [0.1, 0.95, 0.03], [0, 1.6, 0]], 0.014, 5); m.mat(MAT.CLOTH, COL.linen, 0.3); m.box(-0.004, 0.3, -0.004, 0.004, 1.6, 0.004); });
    },
  },
  fisher: {
    H: 2.2, walls: 'timber', roof: 'thatch', plaster: [0.94, 0.94, 0.9], shutter: [0.3, 0.45, 0.5], roofCol: [0.9, 0.9, 0.85],
    doors: [{ wall: 'front', pos: 0.6 }], windows: [{ wall: 'front', pos: -1.2, w: 0.7 }, { wall: 'right', pos: 0, w: 0.7 }],
    interior(c) {
      const m = c.int, B = bounds(c);
      c.fireplace(B.x0, 0, 0, { w: 1.5 });
      bedAt(c, 'bed', B.x1 - 0.6, B.z1 - 1.05, PI, 0.95, [0.3, 0.42, 0.5]);
      tableSet(c, -0.3, 0.9, 0, 1.0, 0.65, ['bowl', 'mug', 'candle'], 2, 'stools');
      at(m, B.x0 + 0.45, 0.02, B.z0 + 0.45, 0, () => Props.barrel(m)); at(m, 1.2, 0.02, B.z0 + 0.4, 0, () => Props.crate(m, 0.5));
      chestAt(c, 0.6, B.z1 - 0.32, 0, [['gold', 5]]);
      c.spot('home', 0.3, -0.6, 0);
    },
  },
  chapel: {
    H: 4.4, walls: 'stone', roof: 'shingle', roofCol: [0.55, 0.62, 0.74], pitch: 54, floor: 'stone', overhang: 0.4,
    doors: [{ wall: 'left', pos: 0, w: 1.5, h: 2.5, lamp: false }],
    windows: [-3.8, -1.0, 1.8, 4.6].flatMap((x, i) => [{ wall: 'front', pos: x, w: 0.7, h: 2.3, sill: 1.3, glass: [[0.35, 0.55, 1.0], [1.0, 0.42, 0.3], [0.95, 0.8, 0.3], [0.4, 0.85, 0.5]][i] }, { wall: 'back', pos: x, w: 0.7, h: 2.3, sill: 1.3, glass: [[1.0, 0.42, 0.3], [0.35, 0.55, 1.0], [0.4, 0.85, 0.5], [0.95, 0.8, 0.3]][i] }]).concat([{ wall: 'right', pos: 0, w: 1.1, h: 1.5, sill: 2.5, glass: [1.0, 0.82, 0.35] }]),
    interior(c) {
      const m = c.int, B = bounds(c), e = c.ext;
      // pews
      for (const x of [-4.4, -2.9, -1.4, 0.1, 1.6]) for (const s of [-1, 1]) at(m, x, 0.02, s * 2.0, PI / 2, () => { Props.bench(m, 2.5); m.mat(MAT.PLANKS, COL.woodDark); m.box(-1.25, 0.46, 0.13, 1.25, 0.95, 0.17); });
      seat(c, 'pew1', -1.4, -1.6, PI / 2); seat(c, 'pew2', 0.1, 1.7, PI / 2);
      at(m, 0, 0.022, 0, PI / 2, () => Props.rug(m, 1.1, 9.5, [0.55, 0.14, 0.12]));
      // dais, altar, sun emblem
      m.mat(MAT.COBBLE, [1, 1, 1], 1.4); m.box(4.3, 0.02, B.z0, B.x1, 0.2, B.z1); addFloor(m, 4.3, B.z0, B.x1, B.z1, 0.21); addFloor(m, 4.0, B.z0, 4.3, B.z1, 0.11);
      m.mat(MAT.STONE, [1, 1, 1], 0.7); m.box(5.3, 0.2, -1.0, 6.1, 1.15, 1.0); addBoxCollider(m, 5.3, -1.0, 6.1, 1.0, 0.2, 1.3);
      m.mat(MAT.CLOTH, COL.linen); m.box(5.26, 1.15, -1.1, 6.14, 1.18, 1.1); m.mat(MAT.CLOTH, COL.gold); m.box(5.25, 0.75, -0.35, 5.3, 1.18, 0.35);
      for (const s of [-1, 1]) at(m, 5.7, 1.18, s * 0.75, 0, () => { m.mat(MAT.METAL, COL.bronze); m.lathe([[0.09, 0], [0.02, 0.05], [0.02, 0.4], [0.05, 0.45]], 8, 0); at(m, 0, 0.42, 0, 0, () => Props.candle(m, { zone: c.zone, candleLight: false, always: true }, true)); });
      at(m, B.x1 - 0.05, 2.0, 0, 0, () => { m.mat(MAT.METAL, COL.gold); m.push().RZ(PI / 2); m.cyl(0, 0, 0, 0.42, 0.42, 0.05, 16, 3); m.pop(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; m.beam([-0.03, Math.sin(a) * 0.5, Math.cos(a) * 0.5], [-0.03, Math.sin(a) * (i % 2 ? 0.75 : 0.95), Math.cos(a) * (i % 2 ? 0.75 : 0.95)], 0.05, 0.03); } });
      addLight(wp(m, 4.9, 1.9, 0), 8, [2.6, 1.8, 0.9], c.zone, 'fire');
      at(m, 3.7, 0.02, -1.9, -PI / 2, () => { m.mat(MAT.TIMBER, COL.woodDark); m.cbox(0, 0, 0, 0.12, 1.05, 0.12); m.push().T(0, 1.05, 0).RX(0.5); m.box(-0.3, 0, -0.2, 0.3, 0.04, 0.2); at(m, 0, 0.04, 0, 0, () => Props.book(m, COL.red, 0.06)); m.pop(); });
      c.interact(3.7, 1.2, -1.9, { kind: 'read', id: 'chapel.book', title: 'Book of the Dawn', text: 'When the night is longest, ring the bell and light the fire, that those lost upon the fells may find their way home.', r: 1.7 });
      for (const [x, z] of [[-5.9, -3.1], [-5.9, 3.1], [3.6, -3.2], [3.6, 3.2]]) at(m, x, 0.02, z, 0, () => { m.mat(MAT.METAL, COL.black); m.lathe([[0.16, 0], [0.02, 0.06], [0.02, 1.25], [0.12, 1.3]], 7, 0); at(m, 0, 1.3, 0, 0, () => Props.candle(m, { zone: c.zone, candleLight: false, always: true }, true)); addLight(wp(m, 0, 1.75, 0), 5, [1.5, 0.95, 0.42], c.zone, 'fire'); });
      c.spot('altar', 4.6, 0, -PI / 2, 0.21); c.spot('nave', -2.0, 0, PI / 2);
      // ── bell tower porch outside the entrance ──
      const x0 = -c.w / 2 - 3.3, x1 = -c.w / 2, zh = 1.75, pr = 0.75, top = 10.4;
      e.m1 = 0; e.ao = 1; e.mat(MAT.STONE, [1, 1, 1]);
      for (const [px, pz] of [[x0, -zh], [x0, zh - pr], [x1 - pr, -zh], [x1 - pr, zh - pr]]) { e.grad = [1, 0.7]; e.box(px, -1.4, pz, px + pr, 2.9, pz + pr); e.grad = null; e.box(px, 2.9, pz, px + pr, top, pz + pr); addBoxCollider(e, px, pz, px + pr, pz + pr, -0.4, 4); }
      const panel = (y0, y1) => { e.box(x0 + pr, y0, -zh + 0.1, x1 - pr, y1, -zh + 0.6); e.box(x0 + pr, y0, zh - 0.6, x1 - pr, y1, zh - 0.1); e.box(x0 + 0.1, y0, -zh + pr, x0 + 0.6, y1, zh - pr); e.box(x1 - 0.6, y0, -zh + pr, x1 - 0.1, y1, zh - pr); };
      panel(2.9, 7.2); panel(9.3, top);
      e.mat(MAT.STONE, [0.85, 0.85, 0.85], 0.8); e.box(x0 - 0.12, 7.2, -zh - 0.12, x1 + 0.12, 7.38, zh + 0.12); e.box(x0 - 0.12, top, -zh - 0.12, x1 + 0.12, top + 0.16, zh + 0.12);
      e.mat(MAT.COBBLE, [1, 1, 1], 1.4); e.box(x0, -1.4, -zh, x1, 0.0, zh); e.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); e.box(x0 - 0.5, -1.4, -zh - 0.5, x1, -0.16, zh + 0.5);
      addFloor(e, x0, -zh, x1 + 0.3, zh, 0.0); addFloor(e, x0 - 0.5, -zh - 0.5, x1, zh + 0.5, -0.16);
      e.mat(MAT.PLANKS, COL.woodDark); e.ao = 0.4; e.quad([x0 + 0.6, 7.2, zh - 0.6], [x0 + 0.6, 7.2, -zh + 0.6], [x1 - 0.6, 7.2, -zh + 0.6], [x1 - 0.6, 7.2, zh - 0.6]); e.ao = 1;
      const cx = (x0 + x1) / 2, ap = top + 3.4, o = 0.3;
      e.mat(MAT.SHINGLE, [0.55, 0.62, 0.74]);
      e.poly([[x0 - o, top + 0.16, -zh - o], [x0 - o, top + 0.16, zh + o], [cx, ap, 0]]); e.poly([[x1 + o, top + 0.16, zh + o], [x1 + o, top + 0.16, -zh - o], [cx, ap, 0]]);
      e.poly([[x1 + o, top + 0.16, -zh - o], [x0 - o, top + 0.16, -zh - o], [cx, ap, 0]]); e.poly([[x0 - o, top + 0.16, zh + o], [x1 + o, top + 0.16, zh + o], [cx, ap, 0]]);
      e.mat(MAT.METAL, COL.gold); e.box(cx - 0.02, ap - 0.1, -0.02, cx + 0.02, ap + 0.7, 0.02); e.push().T(cx, ap + 0.95, 0).RZ(PI / 2).T(0, -0.02, 0); e.cyl(0, 0, 0, 0.26, 0.26, 0.04, 12, 3); e.pop();
      e.mat(MAT.TIMBER, COL.timberDark); e.box(x0 + 0.5, 8.95, -0.09, x1 - 0.5, 9.13, 0.09);
      e.mat(MAT.METAL, COL.bronze); e.push().T(cx, 8.0, 0); e.lathe([[0.48, 0], [0.42, 0.06], [0.33, 0.3], [0.27, 0.62], [0.17, 0.85], [0.03, 0.93]], 12, 0); e.mat(MAT.METAL, COL.black); e.box(-0.02, -0.12, -0.02, 0.02, 0.6, 0.02); e.ball(0, -0.12, 0, 0.07); e.pop();
      e.mat(MAT.CLOTH, [0.75, 0.62, 0.4], 0.3); e.box(cx + 0.7, 1.2, -0.012, cx + 0.724, 8.0, 0.012);
      World.bell = { p: wp(e, cx, 8.3, 0) };
      World.interact.push({ p: wp(e, cx + 0.7, 1.4, 0), r: 1.9, zone: 0, kind: 'bell', id: 'bell' });
      at(e, x0 + 0.02, 2.6, -zh - 0.02, 0, () => Props.lantern(e, { zone: 0 }));
    },
  },
  mill: {
    H: 3.0, walls: 'half', stoneH: 1.5, roof: 'shingle', roofCol: [0.74, 0.66, 0.58], plaster: [1, 0.97, 0.88],
    doors: [{ wall: 'left', pos: -0.6 }], windows: [{ wall: 'front', pos: -1.6 }, { wall: 'front', pos: 1.6 }, { wall: 'left', pos: 1.7, w: 0.7 }, { wall: 'right', pos: 0 }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c);
      // hurst frame with the stones; gearing below (pit wheel is part of the turning water wheel)
      const hx = 0, hz = 1.0, py = 1.25;
      m.mat(MAT.TIMBER, COL.timber);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(hx + sx * 0.95, 0.02, hz + sz * 0.85, 0.16, py, 0.16, 12);
      m.mat(MAT.PLANKS, COL.wood); m.box(hx - 1.1, py, hz - 1.0, hx + 1.1, py + 0.08, hz + 1.0);
      m.mat(MAT.ROCK, [0.95, 0.95, 0.95], 0.4); m.cyl(hx, py + 0.08, hz, 0.62, 0.62, 0.22, 16, 3); m.cyl(hx, py + 0.32, hz, 0.6, 0.6, 0.2, 16, 3);
      m.mat(MAT.TIMBER, COL.woodDark); m.cyl(hx, 0.3, hz, 0.07, 0.07, py + 0.25, 8, 0);
      m.cyl(hx, 0.92, hz, 0.34, 0.34, 0.1, 12, 3); for (let i = 0; i < 10; i++) { const a = i * TAU / 10; m.cbox(hx + Math.cos(a) * 0.3, 0.80, hz + Math.sin(a) * 0.3, 0.04, 0.34, 0.04); }
      m.mat(MAT.PLANKS, COL.wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(hx + sx * 0.5, py + 0.08, hz + sz * 0.5, 0.06, 1.25, 0.06, 12);
      m.push().T(hx, 0, hz); m.mat(MAT.PLANKS, COL.wood); m.lathe([[0.12, py + 0.72], [0.52, py + 1.32]], 4, 0); m.pop();
      addBoxCollider(m, hx - 1.1, hz - 1.0, hx + 1.1, hz + 1.0, 0, 2);
      m.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) m.beam([hx - 1.9, 0.02, hz - 0.6 + s * 0.22], [hx - 1.15, py + 0.05, hz - 0.6 + s * 0.22], 0.05, 0.07); for (let i = 1; i < 5; i++) m.box(hx - 1.9 + i * 0.15 - 0.02, i * 0.25, hz - 0.84, hx - 1.9 + i * 0.15 + 0.02, i * 0.25 + 0.03, hz - 0.36);
      for (const [x, z, s2] of [[-2.9, -2.2, 0.36], [-2.3, -2.4, 0.33], [-2.75, -1.5, 0.3], [2.8, -2.3, 0.36], [2.2, -2.5, 0.3], [2.9, -1.6, 0.32], [2.9, 2.3, 0.34]]) at(m, x, 0.02, z, R() * 3, () => Props.sack(m, s2, R() < 0.5 ? [0.93, 0.91, 0.86] : COL.wool));
      at(m, -2.55, 0.74, -2.2, 0.3, () => Props.sack(m, 0.3, [0.93, 0.91, 0.86]));
      bedAt(c, 'bed', B.x0 + 1.05, B.z1 - 0.6, PI / 2, 0.95, COL.wool);
      at(m, 2.6, 0.02, 0.6, PI / 2, () => { Props.table(m, 1.0, 0.6); Props.clutter(m, R, -0.3, 0.3, 0.76, 0, ['mug', 'loaf', 'candle'], 3, c); });
      at(m, 0.2, c.H - 0.2, -1.6, 0, () => Props.lantern(m, c));
      at(m, 1.6, 0.02, -2.5, 0, () => Props.crate(m, 0.6)); at(m, -0.6, 0.02, -2.5, 0, () => Props.barrel(m));
      c.spot('work', -1.2, -1.2, PI * 0.8); c.spot('home', 1.9, 0.6, PI / 2);
    },
  },
  barn: {
    H: 3.2, walls: 'log', roof: 'thatch', roofCol: [0.9, 0.86, 0.78], pitch: 46,
    doors: [{ wall: 'front', pos: 0, w: 3.4, h: 2.9, noLeaf: true, lamp: false }], windows: [{ wall: 'back', pos: 0, w: 0.8, h: 0.7, sill: 1.9, shutters: false }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c);
      at(m, -2.9, 0.02, 2.2, 0, () => Props.haystack(m, 1.15)); at(m, -3.1, 0.02, -0.2, 0.4, () => Props.haybale(m)); at(m, -3.0, 0.02, -1.4, 1.9, () => Props.haybale(m)); at(m, -3.05, 0.9, -0.8, 1.2, () => Props.haybale(m));
      at(m, 1.6, 0.02, 1.3, 0.25, () => Props.cart(m, true));
      m.mat(MAT.PLANKS, COL.woodDark); for (const z of [-0.6, 1.2]) { m.box(2.6, 0.02, z - 0.04, B.x1, 1.25, z + 0.04); addBoxCollider(m, 2.6, z - 0.06, B.x1, z + 0.06, 0, 1.3); }
      at(m, 3.5, 0.02, -2.6, 0, () => Props.barrel(m)); at(m, 2.9, 0.02, -2.9, 0, () => Props.sack(m, 0.33)); at(m, 3.6, 0.02, 0.3, 0, () => Props.crate(m, 0.6));
      m.mat(MAT.TIMBER, COL.wood); m.beam([B.x0 + 0.15, 0.02, -2.4], [B.x0 + 0.1, 2.1, -2.9], 0.035, 0.035); for (let i = 0; i < 3; i++) m.beam([B.x0 + 0.1, 2.1, -2.9], [B.x0 + 0.12 + (i - 1) * 0.08, 2.5, -3.0], 0.02, 0.02);
      at(m, 0, c.H - 0.2, 0, 0, () => Props.lantern(m, c));
      c.spot('work', 0.4, -1.5, 0);
    },
  },
};
for (const id of ['elder', 'herbalist', 'guardhouse', 'weaver', 'farm', 'hunter', 'fisher', 'smithy', 'store', 'inn']) { const s = SITE[id], h = HOUSES[id]; if (s.doorPos !== undefined) h.doors[0].pos = s.doorPos; }


// ---- 73_village.js ----
// ───────────────────────── the village: houses, square, bridge, ruin, fences, dock ─────────────────────────
const headingTo = (x, z, tx, tz) => Math.atan2(tx - x, -(tz - z));
World.pickups = [];
function buildVillage() {
  const pack = new MeshPack(); pack.shadow = true;
  const buckets = new Map(), R = rng(777), OUT = { zone: 0 };
  const bucket = (x, z) => { const k = Math.floor(x / 40) + ',' + Math.floor(z / 40); let m = buckets.get(k); if (!m) { m = new Mesh(2048); m.seed = buckets.size * 7919 + 13; buckets.set(k, m); } return m; };
  // place something on the ground. rot is a heading: the prop's local -Z ends up facing that way
  const put = (x, z, yaw, fn, dy) => { const m = bucket(x, z); m.push().T(x, Terrain.y(x, z) + (dy || 0), z); if (yaw) m.RY(-yaw); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; fn(m); m.pop(); };
  const spot = (name, x, z, yaw, extra) => { World.spots[name] = Object.assign({ p: [x, Terrain.y(x, z), z], yaw: yaw || 0, zone: 0 }, extra || {}); };

  for (const site of SITES) {
    const spec = HOUSES[site.id]; if (!spec) continue;
    const h = buildHouse(site, spec);
    if (h.ext.ni) pack.add(h.ext, { kind: 'opaque' }); if (h.int.ni) pack.add(h.int, { kind: 'opaque', maxDist: 46, nearOnly: true }); if (h.glow.ni) pack.add(h.glow, { kind: 'glow', noShadow: true });
    const dl = siteDoorLocal(site, 0), dw = siteToWorld(site, dl[0], dl[1]);
    World.places.push({ id: site.id, name: site.name, x: dw[0], z: dw[1], r: Math.max(site.w, site.d) * 0.5 + 5 });
  }

  // ── fences and low walls ──
  const fence = (pts, o) => {
    o = o || {}; const hgt = o.h || 1.05;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = hyp(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 2.2));
      for (let k = 0; k < n; k++) {
        const x0 = lerp(a[0], b[0], k / n), z0 = lerp(a[1], b[1], k / n), x1 = lerp(a[0], b[0], (k + 1) / n), z1 = lerp(a[1], b[1], (k + 1) / n);
        const y0 = Terrain.y(x0, z0), y1 = Terrain.y(x1, z1), m = bucket((x0 + x1) / 2, (z0 + z1) / 2);
        m.m1 = 0; m.ao = 1;
        if (o.stone) {
          m.push().T((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).RY(-Math.atan2(z1 - z0, x1 - x0)); const l = hyp(x1 - x0, z1 - z0) / 2 + 0.05;
          m.mat(MAT.STONE, [0.95, 0.95, 0.95], 0.8); m.grad = [1, 0.65]; m.box(-l, -0.7, -0.24, l, 0.85, 0.24, 4); m.grad = null; m.mat(MAT.STONE, [0.8, 0.8, 0.8], 0.6); m.box(-l, 0.85, -0.29, l, 0.95, 0.29);
          addBoxCollider(m, -l, -0.25, l, 0.25, -0.3, 1.2); m.pop();
        } else {
          m.mat(MAT.TIMBER, COL.timber);
          m.push().T(x0, y0, z0); m.cbox(0, -0.4, 0, 0.11, hgt + 0.4, 0.11, 4); m.pop();
          if (k === n - 1 && i === pts.length - 2) { m.push().T(x1, y1, z1); m.cbox(0, -0.4, 0, 0.11, hgt + 0.4, 0.11, 4); m.pop(); }
          for (const hh of [0.42, 0.86]) m.beam([x0, y0 + hh * hgt / 1.05, z0], [x1, y1 + hh * hgt / 1.05, z1], 0.045, 0.1);
          m.push().T((x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2).RY(-Math.atan2(z1 - z0, x1 - x0)); const l = hyp(x1 - x0, z1 - z0) / 2;
          addBoxCollider(m, -l, -0.07, l, 0.07, -0.2, 1.2); m.pop();
        }
      }
    }
  };
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]];

  // ── the square ──
  put(6.2, -8.6, 0.3, m => Props.well(m));
  const OAK = World.oakPos = [-7.6, 6.4];
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3; put(OAK[0] + Math.cos(a) * 1.75, OAK[1] + Math.sin(a) * 1.75, a + PI / 2, m => Props.bench(m, 1.75, true)); }
  { const m = bucket(OAK[0], OAK[1]); m.push().T(OAK[0], Terrain.y(OAK[0], OAK[1]), OAK[1]); addCircleCollider(m, 0, 0, 2.0, 0, 0.5); m.pop(); }
  spot('square.bench', OAK[0] + 1.75, OAK[1] + 0.55, PI / 2 + 0.2, { sit: 0.46 }); spot('square.bench2', OAK[0] - 0.1, OAK[1] - 1.8, 0.1, { sit: 0.46 });
  const stalls = [[10.2, 4.6, COL.red, 0], [5.6, 9.4, COL.blue, 1], [-11.6, -5.8, COL.green, 2]];
  for (const [x, z, col, kind] of stalls) {
    const yaw = headingTo(x, z, 0, -1.5);
    put(x, z, yaw, m => Props.stall(m, col, y => {
      if (kind === 0) { for (const [cx, kindG] of [[-0.85, 'apple'], [0, 'cabbage'], [0.85, 'apple']]) at(m, cx, y, -0.3, 0, () => { m.mat(MAT.PLANKS, COL.wood, 0.5); m.box(-0.36, 0, -0.26, 0.36, 0.14, 0.26, 8); for (let i = 0; i < 12; i++) at(m, (i % 4) * 0.17 - 0.26, 0.12, Math.floor(i / 4) * 0.16 - 0.16, 0, () => kindG === 'apple' ? Props.apple(m, cx < 0 ? COL.apple : [0.62, 0.72, 0.22]) : Props.cabbage(m)); }); }
      else if (kind === 1) Props.clutter(m, R, -1.1, 1.1, y, -0.25, ['loaf', 'cheese', 'loaf', 'cheese', 'jug', 'loaf'], 7);
      else { Props.clutter(m, R, -1.1, 0.2, y, -0.25, ['pot', 'pot', 'jug', 'bowl', 'pot'], 5); for (let k = 0; k < 3; k++) at(m, 0.55 + k * 0.22, y, -0.3, PI / 2, () => clothBolt(m, [COL.red, COL.gold, COL.blue][k])); }
    }));
    const b = [x - Math.sin(yaw) * 1.05, z + Math.cos(yaw) * 1.05];
    spot('stall' + kind, b[0], b[1], yaw); spot('stallfront' + kind, x + Math.sin(yaw) * 1.7, z - Math.cos(yaw) * 1.7, yaw + PI);
  }
  put(11.8, 6.3, 0.4, m => Props.barrel(m)); put(12.2, 5.2, 0, m => Props.crate(m, 0.6)); put(4.0, 10.6, 0.2, m => Props.crate(m, 0.55)); put(-12.9, -4.2, 0, m => Props.barrel(m));
  put(-11.2, 9.0, 2.2, m => Props.cart(m, true));
  // festival fire pit (lit at the end of the story)
  World.bonfirePos = [-2.6, -7.4];
  put(-2.6, -7.4, 0, m => {
    m.mat(MAT.ROCK, [0.9, 0.9, 0.9], 0.4); for (let i = 0; i < 11; i++) { const a = i * TAU / 11; m.ball(Math.cos(a) * 1.15, 0.1, Math.sin(a) * 1.15, 0.24 + R() * 0.08, 0.17, 0.2, 6, 4); }
    m.mat(MAT.BARK, [1, 1, 1], 0.6); for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + 0.2; m.tube([[Math.cos(a) * 0.85, 0.02, Math.sin(a) * 0.85], [Math.cos(a) * 0.1, 1.55 + R() * 0.3, Math.sin(a) * 0.1]], [0.085, 0.06], 6, true); }
    m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); m.disc(0, 0.03, 0, 1.0, 10, 1);
    addCircleCollider(m, 0, 0, 1.2, 0, 1.2);
    World.emitters.push({ type: 'bonfire', p: wp(m, 0, 0.5, 0), size: 1.5, zone: 0 }); addLight(wp(m, 0, 1.8, 0), 20, [7, 3.5, 1.2], 0, 'bonfire');
  });
  // notice board by the inn
  put(3.6, -15.4, PI, m => {
    m.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) m.cbox(s * 0.8, -0.3, 0, 0.1, 2.5, 0.1, 4);
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.8, 0.95, -0.03, 0.8, 1.95, 0.03); m.mat(MAT.SHINGLE, [0.8, 0.7, 0.6], 0.5); m.quad2([-1.0, 2.25, -0.3], [-1.0, 2.1, 0.12], [1.0, 2.1, 0.12], [1.0, 2.25, -0.3]);
    m.mat(MAT.PLAIN, COL.parchment); for (const [px, py, pw, ph] of [[-0.55, 1.35, 0.34, 0.42], [-0.1, 1.2, 0.3, 0.36], [0.35, 1.4, 0.36, 0.44], [0.1, 1.62, 0.22, 0.26]]) m.box(px, py, -0.04, px + pw, py + ph, -0.03);
    addBoxCollider(m, -0.85, -0.08, 0.85, 0.08, 0, 2);
    World.interact.push({ p: wp(m, 0, 1.4, -0.3), r: 2.0, zone: 0, kind: 'read', id: 'board', title: 'Village notices', text: 'WANTED: steady hands at Fairweather Farm.  •  LOST: one smith’s hammer, last seen with a certain apprentice.  •  Frostcap gatherers — see Maren.  •  The Dawn bell wants a new rope.' });
  });
  for (const [x, z] of [[-3.6, -16.3], [3.2, -16.5]]) put(x, z, PI, m => Props.bench(m, 1.8));
  put(-6.8, -16.4, 0, m => Props.barrel(m)); put(-6.2, -15.9, 0.6, m => Props.barrel(m, 0.3, 0.75)); put(6.9, -16.3, 0.3, m => Props.crate(m, 0.7));
  put(19.2, -5.2, 0, m => Props.barrel(m)); put(19.0, -6.1, 0.4, m => Props.crate(m, 0.55)); put(19.1, -11.4, 0, m => Props.sack(m, 0.32));
  // lamps and signposts
  for (const [x, z, a] of [[-13.2, -9.8, 0.8], [13.6, -10.2, -0.8], [-14.2, 5.2, 2.2], [13.2, 8.4, -2.4], [-31, -6.6, 0], [-50, -8.2, 0], [34, 3.4, PI], [47.5, -0.4, 0], [-12.2, -33, 1.6], [-8.6, -58.5, 1.2], [1.2, 30, -1.5], [4.4, 56, -1.5], [69, 0.2, 0], [86, -2.2, 0.2], [-63.5, 2, 1.5], [3.3, 78, -1.4], [70.2, 16, -1.6]]) put(x, z, a, m => Props.lampPost(m, OUT));
  put(14.6, 2.4, 0.4, m => Props.signPost(m, 3)); put(-58.5, -8.4, -0.3, m => Props.signPost(m, 2)); put(-8.9, -61.5, 0, m => Props.signPost(m, 2));

  // ── west gate ──
  put(-62, -5.2, PI / 2, m => {
    m.mat(MAT.TIMBER, COL.timberDark);
    for (const s of [-1, 1]) { m.cbox(s * 2.9, -0.6, 0, 0.36, 5.3, 0.36, 4); addCircleCollider(m, s * 2.9, 0, 0.24, 0, 4); m.beam([s * 2.9, 3.4, 0], [s * 1.9, 4.35, 0], 0.16, 0.16); at(m, s * 2.6, 2.9, -0.24, 0, () => Props.lantern(m, OUT)); }
    m.box(-3.5, 4.35, -0.18, 3.5, 4.7, 0.18); m.box(-3.2, 4.7, -0.12, 3.2, 4.85, 0.12);
    m.mat(MAT.PLANKS, COL.wood); m.box(-1.0, 3.5, -0.035, 1.0, 4.2, 0.035);
    m.mat(MAT.PLAIN, [0.2, 0.42, 0.2]); for (const zf of [-0.04, 0.04]) for (let i = 0; i < 4; i++) { const y = 3.6 + i * 0.13, w2 = 0.3 - i * 0.065; const pts = [[-w2, y, zf], [w2, y, zf], [0, y + 0.22, zf]]; m.poly(zf < 0 ? pts.reverse() : pts); }
    for (const s of [-1, 1]) { m.mat(MAT.STRIPES, COL.red, 0.5); m.quad2([s * 2.35 - 0.35, 4.3, 0.02], [s * 2.35 - 0.35, 2.7, 0.02], [s * 2.35 + 0.35, 2.7, 0.02], [s * 2.35 + 0.35, 4.3, 0.02], 0, 0, 1.2, 2.4); }
  });
  for (const s of [-1, 1]) for (let i = 0; i < 16; i++) {
    const z = -5.2 + s * (3.4 + i * 0.36), x = -62 + Math.sin(i * 0.4) * 0.12 - i * i * 0.012;
    put(x, z, R() * 3, m => { const h = 2.7 + R() * 0.5 - i * 0.05; m.mat(MAT.BARK, [0.9, 0.85, 0.8], 0.6); m.grad = [1, 0.6]; m.lathe([[0.17, -0.5], [0.16, h - 0.3], [0.02, h]], 7, 0); m.grad = null; });
    if (i % 4 === 0) { const m = bucket(x, z); m.push().T(x, Terrain.y(x, z), z); addBoxCollider(m, -0.2, -0.2, 0.2, 1.3, 0, 2.5); m.pop(); }
  }
  spot('gate.post', -60.4, -7.6, -PI / 2 + 0.3); spot('gate.post2', -60.2, -2.9, -PI / 2 - 0.2);
  World.places.push({ id: 'gate', name: 'Brackenfell Gate', x: -62, z: -5.2, r: 7 });
  World.places.push({ id: 'square', name: 'Market Square', x: 0, z: -2, r: 9 });

  // ── stone bridge ──
  {
    const bx = BRIDGE.x, bz = BRIDGE.z, hl = BRIDGE.len / 2, hw = BRIDGE.w / 2, n = 12, m = bucket(bx, bz);
    const y0 = Terrain.y(bx - hl, bz), y1 = Terrain.y(bx + hl, bz), wy = riverY(River.dist(bx, bz, 20) < 20 ? River.at : 0);
    const deckY = x => lerp(y0, y1, (x - bx + hl) / BRIDGE.len) + 1.05 * (1 - Math.pow((x - bx) / hl, 2));
    const archY = x => { const k = (x - bx) / 5.4; return Math.abs(k) < 1 ? wy - 0.1 + 2.25 * Math.sqrt(1 - k * k) : -9; };
    m.m1 = 0; m.ao = 1; m.grad = null;
    for (let i = 0; i < n; i++) {
      const xa = bx - hl + BRIDGE.len * i / n, xb = bx - hl + BRIDGE.len * (i + 1) / n, ya = deckY(xa), yb = deckY(xb);
      m.mat(MAT.COBBLE, [1, 1, 1]); m.quad([xa, ya, bz - hw], [xa, ya, bz + hw], [xb, yb, bz + hw], [xb, yb, bz - hw], xa / 2.5, 0, xb / 2.5, BRIDGE.w / 2.5);
      m.push().T((xa + xb) / 2, 0, bz); addFloor(m, -(xb - xa) / 2, -hw, (xb - xa) / 2, hw, ya, yb, 'x'); m.pop();
      const aa = Math.max(archY(xa), Math.min(y0, y1) - 2.5), ab = Math.max(archY(xb), Math.min(y0, y1) - 2.5);
      for (const s of [-1, 1]) {
        const zo = bz + s * (hw + 0.4), zi = bz + s * hw, top = 0.85;
        m.mat(MAT.STONE, [1, 1, 1]);
        const o1 = [xa, ya + top, zo], o2 = [xa, aa, zo], o3 = [xb, ab, zo], o4 = [xb, yb + top, zo];
        if (s > 0) m.quad(o1, o2, o3, o4, xa / 2, 0, xb / 2, (ya + top - aa) / 2); else m.quad(o4, o3, o2, o1, xb / 2, 0, xa / 2, (ya + top - aa) / 2);
        const i1 = [xa, ya + top, zi], i2 = [xa, ya, zi], i3 = [xb, yb, zi], i4 = [xb, yb + top, zi];
        if (s > 0) m.quad(i4, i3, i2, i1); else m.quad(i1, i2, i3, i4);
        m.mat(MAT.STONE, [0.85, 0.85, 0.85], 0.7); const c1 = [xa, ya + top, zi], c2 = [xa, ya + top, zo], c3 = [xb, yb + top, zo], c4 = [xb, yb + top, zi];
        if (s > 0) m.quad(c1, c2, c3, c4); else m.quad(c2, c1, c4, c3);
      }
      if (archY(xa) > -8 || archY(xb) > -8) { m.mat(MAT.STONE, [0.8, 0.8, 0.8]); m.ao = 0.5; m.quad([xa, aa, bz + hw + 0.4], [xa, aa, bz - hw - 0.4], [xb, ab, bz - hw - 0.4], [xb, ab, bz + hw + 0.4]); m.ao = 1; }
    }
    for (const s of [-1, 1]) { m.push().T(bx, 0, bz + s * (hw + 0.2)); addBoxCollider(m, -hl - 0.4, -0.22, hl + 0.4, 0.22, Math.min(y0, y1) - 1, Math.max(y0, y1) + 2.6); m.pop(); for (const e of [-1, 1]) { const x = bx + e * (hl + 0.25), y = e < 0 ? y0 : y1; m.mat(MAT.STONE, [0.95, 0.95, 0.95]); m.box(x - 0.36, y - 1.2, bz + s * (hw + 0.2) - 0.36, x + 0.36, y + 1.25, bz + s * (hw + 0.2) + 0.36); m.mat(MAT.STONE, [0.8, 0.8, 0.8], 0.6); m.box(x - 0.43, y + 1.25, bz + s * (hw + 0.2) - 0.43, x + 0.43, y + 1.38, bz + s * (hw + 0.2) + 0.43); } }
    World.places.push({ id: 'bridge', name: 'Stonewater Bridge', x: bx, z: bz, r: 8 });
  }

  // ── old watchtower on the crag ──
  {
    const T = SITE.tower, ty = T.y, doorA = 1.95;
    const m = bucket(T.x, T.z); m.m1 = 0; m.ao = 1;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU, da = Math.abs(angDiff(a, doorA)); if (da < 0.3) continue;
      let h = 0.9 + 5.6 * Math.pow(Math.max(0, Math.cos(a + 1.35)), 1.3) + R() * 1.1; if (da < 0.75) h = Math.max(h, 2.4);
      m.push().T(T.x + Math.cos(a) * 4.4, ty, T.z + Math.sin(a) * 4.4).RY(-a - PI / 2);
      m.mat(MAT.STONE, [0.92, 0.92, 0.9]); m.grad = [1, 0.7]; m.box(-1.02, -2.5, -0.4, 1.02, h, 0.4, 4); m.grad = null;
      if (h > 1.6) { m.box(-1.02 + R() * 0.5, h, -0.4, -0.1 + R() * 0.4, h + 0.3 + R() * 0.5, 0.4, 4); }
      if (h > 4) { m.mat(MAT.PLAIN, [0.02, 0.02, 0.03]); m.quad([0.2, 3.9, -0.41], [0.2, 3.0, -0.41], [-0.2, 3.0, -0.41], [-0.2, 3.9, -0.41]); }
      addBoxCollider(m, -1.02, -0.4, 1.02, 0.4, -0.5, h + 1); m.pop();
    }
    m.push().T(T.x, ty, T.z);
    m.mat(MAT.COBBLE, [0.9, 0.9, 0.9], 1.2); m.disc(0, 0.04, 0, 4.1, 16, 1); addFloor(m, -4.1, -4.1, 4.1, 4.1, 0.04);
    m.mat(MAT.ROCK, [0.9, 0.9, 0.9], 0.4); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; m.ball(-0.9 + Math.cos(a) * 0.55, 0.12, 0.4 + Math.sin(a) * 0.55, 0.16, 0.12, 0.14, 6, 4); }
    at(m, -0.9, 0.05, 0.4, 0.5, () => Props.logs(m, 3, 0.6, 0.055));
    World.emitters.push({ type: 'fire', p: wp(m, -0.9, 0.22, 0.4), size: 0.38, zone: 0 }); addLight(wp(m, -0.9, 0.9, 0.4), 8, [3.0, 1.5, 0.52], 0, 'fire');
    at(m, 0.8, 0.04, -1.6, 0.4, () => { m.mat(MAT.CLOTH, [0.45, 0.3, 0.22], 0.6); m.box(-0.4, 0, -0.95, 0.4, 0.07, 0.95); m.mat(MAT.CLOTH, COL.wool, 0.6); m.push().T(0, 0.1, -0.8).RZ(PI / 2).T(0, -0.35, 0); m.cyl(0, 0, 0, 0.1, 0.1, 0.7, 8, 3); m.pop(); });
    at(m, -2.3, 0.04, -0.3, 1.2, () => { m.mat(MAT.BARK, [1, 1, 1], 0.6); m.push().T(0, 0.2, 0).RZ(PI / 2).T(0, -0.7, 0); m.cyl(0, 0, 0, 0.2, 0.19, 1.4, 8, 3); m.pop(); });
    at(m, 1.9, 0.04, 2.2, -0.7, () => Props.chest(m)); World.interact.push({ p: wp(m, 1.9, 0.5, 2.2), r: 1.8, zone: 0, kind: 'chest', id: 'tower.chest', loot: [['gold', 18], ['apple', 2]] });
    World.spots['tower.fire'] = { p: wp(m, 0.3, 0.04, 1.4), yaw: -2.2, zone: 0 };
    World.pickupSpot = World.pickupSpot || {}; World.pickupSpot.hammer = wp(m, -2.0, 0.42, -0.25);
    m.pop();
    for (let i = 0; i < 9; i++) { const a = R() * TAU, r = 5.5 + R() * 4; put(T.x + Math.cos(a) * r, T.z + Math.sin(a) * r, R() * 3, mm => { mm.push().RZ(R.s() * 0.4).RX(R.s() * 0.4); mm.mat(MAT.STONE, [0.9, 0.9, 0.88], 0.6); const s = 0.3 + R() * 0.35; mm.box(-s, -0.1, -s * 0.6, s, s * 0.9, s * 0.6); mm.pop(); }); }
    World.places.push({ id: 'tower', name: 'The Old Watchtower', x: T.x, z: T.z, r: 9 });
  }

  // ── lake: dock, boat, drying rack ──
  {
    const a = [6.8, 88.2], b = [9.6, 103.5], yaw = headingTo(a[0], a[1], b[0], b[1]), L = hyp(b[0] - a[0], b[1] - a[1]), dy = LAKE.y + 0.5;
    const m = bucket(a[0], a[1]); m.m1 = 0; m.ao = 1;
    m.push().T(a[0], dy, a[1]).RY(-yaw);       // local -Z runs out along the dock
    m.mat(MAT.PLANKS, COL.wood); for (let i = 0; i < Math.floor(L / 0.32); i++) m.box(-0.85 + R.s() * 0.03, -0.05, -i * 0.32 - 0.29, 0.85 + R.s() * 0.03, 0, -i * 0.32);
    m.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) { m.box(s * 0.7 - 0.06, -0.2, -L, s * 0.7 + 0.06, -0.05, 0); for (let z = -0.4; z > -L; z -= 2.6) { m.grad = [1, 0.5]; m.cbox(s * 0.86, -3.2, z, 0.17, 3.2 + (Math.round(-z) % 2 ? 0.9 : 0.25), 0.17, 4); m.grad = null; } }
    addFloor(m, -0.85, -L, 0.85, 0, 0); addFloor(m, -0.85, 0, 0.85, 2.2, 0, Terrain.y(a[0] - Math.sin(yaw) * 2.2, a[1] + Math.cos(yaw) * 2.2) - dy, 'z');
    m.mat(MAT.PLANKS, COL.wood); m.quad([-0.85, 0, 0], [-0.85, Terrain.y(a[0] - Math.sin(yaw) * 2.2, a[1] + Math.cos(yaw) * 2.2) - dy, 2.2], [0.85, Terrain.y(a[0] - Math.sin(yaw) * 2.2, a[1] + Math.cos(yaw) * 2.2) - dy, 2.2], [0.85, 0, 0]);
    at(m, 0.5, 0, -L + 1.2, 0, () => Props.barrel(m, 0.28, 0.7)); at(m, -0.5, 0, -L + 3.8, 0.3, () => Props.crate(m, 0.5));
    const end = wp(m, 0, 0, -L + 0.7); World.spots['dock.end'] = { p: end, yaw, zone: 0 };
    // rowing boat moored beside the dock
    m.push().T(1.9, -0.66, -L + 3.0).RY(0.12);
    m.mat(MAT.PLANKS, COL.woodDark, 0.6);
    const hull = (u, v) => { const x = v * 0.62 * (1 - Math.pow(Math.abs(u), 2.4)), y = 0.5 * (v * v) + 0.12 * u * u * (u > 0 ? 1 : 0.6), z = u * 1.9; return [x, y, z]; };
    m.grid(10, 8, (i, j) => { const u = i / 10 * 2 - 1, v = j / 8 * 2 - 1, p = hull(u, v); return m.vert(p[0], p[1], p[2], v, -1.2, 0, i * 0.3, j * 0.2); });
    m.grid(10, 8, (i, j) => { const u = i / 10 * 2 - 1, v = -(j / 8 * 2 - 1), p = hull(u, v); return m.vert(p[0] * 0.96, p[1] + 0.03, p[2] * 0.98, -v, 1.2, 0, i * 0.3, j * 0.2); });
    m.mat(MAT.PLANKS, COL.wood, 0.6); for (const z of [-0.8, 0.5]) m.box(-0.5, 0.3, z - 0.12, 0.5, 0.33, z + 0.12);
    m.pop(); m.pop();
    put(-4.2, 86.2, 0.6, mm => { mm.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) { mm.beam([s * 1.1, -0.2, -0.3], [s * 1.1, 1.7, 0], 0.07, 0.07); mm.beam([s * 1.1, -0.2, 0.3], [s * 1.1, 1.7, 0], 0.07, 0.07); } mm.beam([-1.3, 1.7, 0], [1.3, 1.7, 0], 0.06, 0.06); for (let i = 0; i < 7; i++) { mm.mat(MAT.METAL, [0.8, 0.85, 0.9]); mm.push().T(-0.9 + i * 0.3, 1.35, 0); mm.ball(0, 0, 0, 0.035, 0.2, 0.08, 6, 5); mm.pop(); } });
    put(-5.6, 84.6, 0, mm => Props.barrel(mm)); put(-3.0, 83.8, 0.5, mm => Props.crate(mm, 0.5));
    World.places.push({ id: 'lake', name: 'Mirrormere', x: 7, z: 90, r: 9 });
  }

  // ── farm: fields, coop, scarecrow, hay ──
  for (const f of FIELDS) { const p = rect(f.x0 - 0.8, f.z0 - 0.8, f.x1 + 0.8, f.z1 + 0.8); fence([p[0], [lerp(p[0][0], p[1][0], 0.38), p[0][1]]]); fence([[lerp(p[0][0], p[1][0], 0.52), p[0][1]], p[1], p[2], p[3], p[4]]); }
  put(93, 20, 0.4, m => { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.08, 2.2, 0.08, 4); m.beam([-0.75, 1.5, 0], [0.75, 1.5, 0], 0.06, 0.06); m.mat(MAT.CLOTH, [0.5, 0.36, 0.22], 0.5); m.box(-0.22, 0.85, -0.1, 0.22, 1.55, 0.1); for (const s of [-1, 1]) m.box(s * 0.22, 1.38, -0.07, s * 0.72, 1.56, 0.07); m.mat(MAT.CLOTH, COL.wool, 0.4); m.ball(0, 1.76, 0, 0.16, 0.18, 0.16, 8, 6); m.mat(MAT.THATCH, COL.hay, 0.4); m.lathe([[0.34, 1.9], [0.14, 1.94], [0.12, 2.08], [0.02, 2.14]], 9, 0); });
  put(116, 24, 0, m => Props.haystack(m, 1.3)); put(110, 42, 0, m => Props.haystack(m, 1.1)); put(90, 44, 1, m => Props.haybale(m)); put(108.5, 8.5, 0.5, m => Props.haybale(m));
  put(104.5, -17.5, 0.9, m => {      // chicken coop
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.9, 0.3, -0.7, 0.9, 1.2, 0.7); m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * 0.8, -0.2, sz * 0.6, 0.08, 0.5, 0.08);
    m.mat(MAT.THATCH, COL.hay, 0.6); m.quad2([-1.05, 1.75, 0], [-1.05, 1.15, -0.9], [1.05, 1.15, -0.9], [1.05, 1.75, 0]); m.quad2([1.05, 1.75, 0], [1.05, 1.15, 0.9], [-1.05, 1.15, 0.9], [-1.05, 1.75, 0]);
    m.mat(MAT.PLANKS, COL.wood); m.poly([[-0.9, 1.2, -0.7], [-0.9, 1.2, 0.7], [-0.9, 1.72, 0]]); m.poly([[0.9, 1.2, 0.7], [0.9, 1.2, -0.7], [0.9, 1.72, 0]]);
    m.mat(MAT.PLAIN, [0.05, 0.04, 0.04]); m.quad([-0.2, 0.75, -0.71], [-0.2, 0.3, -0.71], [0.2, 0.3, -0.71], [0.2, 0.75, -0.71]); m.mat(MAT.PLANKS, COL.wood); m.quad2([-0.2, 0.3, -0.7], [-0.2, 0.0, -1.35], [0.2, 0.0, -1.35], [0.2, 0.3, -0.7]);
    addBoxCollider(m, -0.9, -0.7, 0.9, 0.7, 0, 1.5);
  });
  World.coop = [104.5, -17.5];
  fence(rect(101.5, -21, 108.5, -13.5).slice(0, 4)); put(102.6, -9.6, 0.2, m => Props.cart(m, false));
  put(95.2, -17, 1.2, m => Props.woodpile(m, 5, 4, 0.7)); put(93.6, -19.8, 0, m => Props.barrel(m));
  spot('farm.field', 93, 16, 2.4); spot('farm.field2', 112, 20, -1.0); spot('farm.yard', 101, -15.5, 1.0); spot('barn.front', 108.2, -3, PI / 2);
  World.places.push({ id: 'fields', name: 'Fairweather Fields', x: 96, z: 22, r: 16 });

  // ── cottage yards ──
  const H = SITE.herbalist, hg = [[2.2, 3.4], [7.2, 3.4], [7.2, -2.4], [3.6, -2.4]].map(p => siteToWorld(H, p[0] + H.w / 2 - 2.6, p[1]));
  fence(hg, { h: 0.9 });
  for (let i = 0; i < 3; i++) for (let k = 0; k < 5; k++) { const p = siteToWorld(H, H.w / 2 + 0.7 + k * 0.85, -1.6 + i * 1.5); (World.gardenPlants = World.gardenPlants || []).push([p[0], p[1], i]); }
  { const p = siteToWorld(H, H.w / 2 + 2.4, 1.0); spot('herbalist.garden', p[0], p[1], H.yaw + PI / 2); }
  for (const [lx, lz] of [[-H.w / 2 - 1.2, 1.2], [-H.w / 2 - 1.9, 0.3]]) { const p = siteToWorld(H, lx, lz); put(p[0], p[1], 0, m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.35, 0, -0.35, 0.35, 0.3, 0.35); m.mat(MAT.THATCH, COL.hay, 0.4); m.lathe([[0.3, 0.3], [0.32, 0.5], [0.24, 0.75], [0.08, 0.9]], 10, 0); addCircleCollider(m, 0, 0, 0.36, 0, 0.9); }); }
  { const E = SITE.elder, p = siteToWorld(E, -E.w / 2 - 0.9, 0.4); put(p[0], p[1], E.yaw + PI / 2, m => Props.woodpile(m, 6, 5, 0.6)); const q = siteToWorld(E, 2.6, -E.d / 2 - 0.5); put(q[0], q[1], E.yaw, m => Props.bench(m, 1.5)); spot('elder.porch', q[0] + Math.sin(E.yaw) * 0.05, q[1] - Math.cos(E.yaw) * 0.05, E.yaw, { sit: 0.46 }); }
  { const W2 = SITE.weaver, a = siteToWorld(W2, -W2.w / 2 - 0.6, -W2.d / 2 - 2.6), b = siteToWorld(W2, -W2.w / 2 - 5.2, -W2.d / 2 - 1.2);
    for (const p of [a, b]) put(p[0], p[1], 0, m => { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.09, 2.2, 0.09, 4); });
    const ya = Terrain.y(a[0], a[1]) + 1.85, yb = Terrain.y(b[0], b[1]) + 1.85, m = bucket(a[0], a[1]); m.m1 = 0; m.ao = 1;
    m.mat(MAT.CLOTH, [0.7, 0.6, 0.4], 0.3); m.beam([a[0], ya, a[1]], [b[0], yb, b[1]], 0.02, 0.02);
    for (let i = 0; i < 5; i++) { const k0 = 0.1 + i * 0.17, k1 = k0 + 0.11, c = [COL.linen, COL.red, COL.blue, COL.linen, COL.gold][i], hgt = 0.6 + (i % 2) * 0.35; m.mat(MAT.CLOTH, c, 0.6); const p0 = [lerp(a[0], b[0], k0), lerp(ya, yb, k0), lerp(a[1], b[1], k0)], p1 = [lerp(a[0], b[0], k1), lerp(ya, yb, k1), lerp(a[1], b[1], k1)]; m.quad2(p0, [p0[0], p0[1] - hgt, p0[2]], [p1[0], p1[1] - hgt, p1[2]], p1); } }
  { const G = SITE.guardhouse, p = siteToWorld(G, -G.w / 2 - 1.0, 0.5); put(p[0], p[1], 0.3, m => { m.push().T(0, 1.15, 0).RX(PI / 2).T(0, -0.07, 0); m.mat(MAT.THATCH, COL.hay, 0.5); m.cyl(0, 0, 0, 0.45, 0.45, 0.14, 14, 3); m.mat(MAT.PLAIN, COL.red); m.disc(0, 0.145, 0, 0.3, 12, 1); m.mat(MAT.PLAIN, COL.linen); m.disc(0, 0.15, 0, 0.2, 12, 1); m.mat(MAT.PLAIN, COL.red); m.disc(0, 0.155, 0, 0.09, 10, 1); m.pop(); m.mat(MAT.TIMBER, COL.timber); for (const [bx, bz] of [[-0.4, -0.05], [0.4, -0.05], [0, 0.7]]) m.beam([bx, -0.1, bz], [0, 1.15, -0.02], 0.06, 0.06); }); }
  { const Hn = SITE.hunter, p = siteToWorld(Hn, Hn.w / 2 + 1.6, -1.0); put(p[0], p[1], Hn.yaw, m => { m.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) m.cbox(s * 0.9, -0.3, 0, 0.08, 2.0, 0.08, 4); m.beam([-0.9, 1.65, 0], [0.9, 1.65, 0], 0.06, 0.06); at(m, -0.4, 0.6, 0, 0, () => { pelt(m, 0.8, 1.0); m.push().RY(PI); pelt(m, 0.8, 1.0); m.pop(); }); at(m, 0.45, 0.75, 0, 0, () => { pelt(m, 0.6, 0.85); m.push().RY(PI); pelt(m, 0.6, 0.85); m.pop(); }); });
    const q = siteToWorld(Hn, -1.4, -Hn.d / 2 - 2.4); put(q[0], q[1], 0, m => { m.mat(MAT.BARK, [1, 1, 1], 0.6); m.cyl(0, 0, 0, 0.32, 0.3, 0.5, 9, 2); m.mat(MAT.TIMBER, COL.wood); m.beam([0.05, 0.5, 0], [0.4, 1.05, 0.1], 0.03, 0.03); m.mat(MAT.METAL, COL.iron); m.box(-0.02, 0.45, -0.08, 0.12, 0.62, 0.1); });
    const w3 = siteToWorld(Hn, -Hn.w / 2 - 0.8, 0); put(w3[0], w3[1], Hn.yaw + PI / 2, m => Props.woodpile(m, 6, 5, 0.6)); spot('hunter.yard', q[0] + 1.2, q[1] + 0.3, Hn.yaw + 2.2); }
  // chapel yard
  { const C = SITE.chapel, yd = pts => pts.map(p => siteToWorld(C, p[0], p[1])); fence(yd([[-7.5, -4.4], [-7.5, -9]]), { stone: true }); fence(yd([[-7.5, -11], [-7.5, -17], [8, -17], [8, -4.4]]), { stone: true });
    for (let i = 0; i < 13; i++) { const p = siteToWorld(C, -6.5 + (i % 5) * 3.1 + R.s() * 0.5, -7.6 - Math.floor(i / 5) * 3.3 + R.s() * 0.4); put(p[0], p[1], C.yaw + PI / 2 + R.s() * 0.2, m => Props.gravestone(m, R)); }
    World.places.push({ id: 'graves', name: 'The Quiet Yard', x: siteToWorld(C, 0, -11)[0], z: siteToWorld(C, 0, -11)[1], r: 7 }); }
  // mill surroundings
  { const M = SITE.mill; for (const [lx, lz, s] of [[-M.w / 2 - 1.2, -2.2, 0.34], [-M.w / 2 - 1.9, -1.6, 0.3], [-M.w / 2 - 1.3, -1.4, 0.28]]) { const p = siteToWorld(M, lx, lz); put(p[0], p[1], R() * 3, m => Props.sack(m, s, [0.9, 0.88, 0.8])); }
    const p = siteToWorld(M, -M.w / 2 - 2.2, 1.4); put(p[0], p[1], 1.0, m => Props.cart(m, false)); const q = siteToWorld(M, -M.w / 2 - 1.5, -0.2); spot('mill.door', q[0], q[1], M.yaw - PI / 2); }

  // ── dynamic objects: door leaves, mill wheel, pickups ──
  const skin = new MeshPack();
  const leaf = new Mesh(512);
  leaf.mat(MAT.PLANKS, COL.woodDark, 0.6); leaf.ao = 0.8; leaf.box(0, 0.02, -0.03, 1, 1, 0.03);
  leaf.mat(MAT.METAL, COL.black); for (const y of [0.18, 0.82]) { leaf.box(0, y - 0.03, -0.04, 0.82, y + 0.03, -0.03, 32); leaf.box(0, y - 0.03, 0.03, 0.82, y + 0.03, 0.04, 16); }
  leaf.box(0.86, 0.48, -0.07, 0.9, 0.54, 0.07);
  const leafItem = skin.add(leaf);
  for (const d of World.doors) { d.obj = addSkinned(leafItem, { c: d.c, r: 1.6, zone: 0 }); d.S = m4.scale(m4.create(), d.w, d.h, 1); }
  // mill wheel (+ the pit gear inside on the same axle). local: axle along +z, wheel in the xy plane
  { const M = SITE.mill, wm = new Mesh(2048), r = 2.2, wz0 = 0.25, wz1 = 1.35;
    wm.mat(MAT.TIMBER, [0.7, 0.66, 0.6]); wm.ao = 0.9;
    for (const z of [wz0, wz1]) { wm.push().T(0, 0, z).RX(PI / 2).T(0, -0.06, 0); wm.lathe([[r - 0.22, 0], [r, 0], [r, 0.12], [r - 0.22, 0.12], [r - 0.22, 0]], 20, 0); wm.pop(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; wm.beam([Math.cos(a) * 0.2, Math.sin(a) * 0.2, z], [Math.cos(a) * (r - 0.15), Math.sin(a) * (r - 0.15), z], 0.1, 0.1); } }
    wm.mat(MAT.PLANKS, [0.72, 0.68, 0.62], 0.6); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; wm.push().RZ(a).T(r - 0.25, 0, 0); wm.box(-0.22, -0.03, wz0, 0.3, 0.03, wz1); wm.pop(); }
    wm.mat(MAT.TIMBER, COL.woodDark); wm.push().RX(PI / 2).T(0, -2.0, 0); wm.cyl(0, 0, 0, 0.16, 0.16, 3.5, 10, 3); wm.pop();
    wm.m1 = 0; const pz = -1.8; wm.push().T(0, 0, pz).RX(PI / 2).T(0, -0.05, 0); wm.cyl(0, 0, 0, 0.5, 0.5, 0.1, 14, 3); wm.pop(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; wm.box(Math.cos(a) * 0.46 - 0.03, Math.sin(a) * 0.46 - 0.03, pz - 0.2, Math.cos(a) * 0.46 + 0.03, Math.sin(a) * 0.46 + 0.03, pz + 0.05); }
    const base = siteMatrix(M, M.y + 0.32); m4.translate(base, 0, 0.62, M.d / 2);
    World.millWheel = { obj: addSkinned(skin.add(wm), { c: m4.tp(base, [0, 0, 0.8]), r: 3.2, zone: 0 }), base, angle: 0 };
    World.millPos = m4.tp(base, [0, 0, 0.8]);
  }
  World.skinPack = skin; World.skinItems = { leaf: leafItem };

  // ── dressing: the stuff that piles up against the walls of a lived-in house ──
  {
    const Rd = rng(4242);
    const free = (x, z, rad) => {
      for (const rd of Roads) if (rd.line.dist(x, z, 4) < rd.w / 2 + 1.0) return false;
      if (hyp(x - SQUARE.x, z - SQUARE.z) < Math.max(SQUARE.rx, SQUARE.rz) + 1) return false;
      for (const c of World.colliders) {
        if (c.r !== undefined) { if (hyp(x - c.x, z - c.z) < c.r + rad) return false; continue; }
        if (Math.max(c.hx, c.hz) > 1.6) continue;                               // walls: the pile is meant to lean on those
        const dx = (x - c.x) * c.ax + (z - c.z) * c.az, dz = (x - c.x) * c.bx + (z - c.z) * c.bz;
        if (hyp(Math.max(Math.abs(dx) - c.hx, 0), Math.max(Math.abs(dz) - c.hz, 0)) < rad) return false;
      }
      return true;
    };
    const piles = {
      barrels: (m) => { Props.barrel(m); if (Rd() < 0.6) at(m, 0.74, 0, 0.1, 0, () => Props.barrel(m, 0.28, 0.72)); },
      crates: (m) => { Props.crate(m, 0.62); if (Rd() < 0.7) at(m, 0.05, crateTop(0.62), 0.03, 0.4, () => Props.crate(m, 0.44, true)); if (Rd() < 0.5) at(m, 0.72, 0, 0.05, 0.2, () => Props.crate(m, 0.5)); },
      wood: (m) => Props.woodpile(m, 6, 3 + (Rd() < 0.5 ? 1 : 0), 0.85),
      sacks: (m) => { Props.sack(m, 0.32); at(m, 0.55, 0, 0.12, 0, () => Props.sack(m, 0.27, COL.linen)); if (Rd() < 0.5) at(m, 0.25, 0, 0.5, 0, () => Props.sack(m, 0.25)); },
      pots: (m) => { Props.pot(m, 0.2); at(m, 0.5, 0, 0.1, 0, () => Props.pot(m, 0.15, COL.wool)); },
      hay: (m) => Props.haybale(m),
      // scanned yard dressing: a bucket and a basket by the door, a chopping stump (only offered when the scan pack is loaded)
      buckets: (m) => { kp(m, 'wooden_bucket_01', 0, 0, 0, 1, Rd() * 6); kp(m, 'wooden_bucket_01', 0.5, 0, 0.15, 0.8, Rd() * 6); if (Rd() < 0.6) kp(m, 'wicker_basket_02', -0.45, 0, 0.3, 1.1, Rd() * 6); },
      stump: (m) => { kp(m, 'tree_stump_01', 0, -0.03, 0, 0.55, Rd() * 6); addCircleCollider(m, 0, 0, 0.35, 0, 0.3); },
    };
    for (const s of SITES) {
      if (!HOUSES[s.id]) continue;
      const kinds = (s.id === 'farm' || s.id === 'barn' || s.id === 'mill') ? ['hay', 'wood', 'barrels', 'sacks', 'crates'] : s.id === 'chapel' ? ['pots'] : ['wood', 'barrels', 'crates', 'sacks', 'pots', 'wood'];
      if (typeof scanOn === 'function' && scanOn() && s.id !== 'chapel') kinds.push('buckets', 'stump');
      const dl = siteDoorLocal(s, 0), n = s.id === 'chapel' ? 1 : 3 + Rd.i(0, 1);
      for (let k = 0, tries = 0; k < n && tries < 30; tries++) {
        const side = Rd.i(0, 3), t = Rd.s() * 0.42, off = 0.62;
        // wall midpoints in house space, with the heading that looks out from the wall
        const [lx, lz, out] = side === 0 ? [t * s.w, -s.d / 2 - off, PI] : side === 1 ? [t * s.w, s.d / 2 + off, 0] : side === 2 ? [-s.w / 2 - off, t * s.d, -PI / 2] : [s.w / 2 + off, t * s.d, PI / 2];
        if (hyp(lx - dl[0], lz - dl[1]) < 3.0) continue;
        if ((s.bare || []).some(b => lx > b[0] - 0.6 && lx < b[2] + 0.6 && lz > b[1] - 0.6 && lz < b[3] + 0.6)) continue;
        const p = siteToWorld(s, lx, lz);
        if (!free(p[0], p[1], 1.0) || Math.abs(Terrain.y(p[0], p[1]) - s.y) > 0.45) continue;
        const kind = Rd.pick(kinds);
        put(p[0], p[1], s.yaw + out + PI / 2, piles[kind]); k++;
      }
    }
  }

  // a wagon or two parked beside the busier houses (kit style only)
  if (typeof kitReady === 'function' && kitReady()) for (const [id, lx, lz, yaw] of [['inn', -11.8, 1.5, 0.25], ['store', 0.5, 6.4, 1.45], ['smithy', 1.5, 7.2, 1.7], ['elder', 0, 6.0, 1.5]]) {
    const s = SITE[id], p = siteToWorld(s, lx, lz); let ok = Math.abs(Terrain.y(p[0], p[1]) - s.y) < 0.6;
    for (const rd of Roads) if (rd.line.dist(p[0], p[1], 5) < rd.w / 2 + 2.2) ok = false;
    for (const c of World.colliders) if (hyp(p[0] - c.x, p[1] - c.z) < (c.r !== undefined ? c.r : Math.max(c.hx, c.hz)) + 2.3) ok = false;
    if (ok) put(p[0], p[1], s.yaw + yaw, m => { kp(m, 'Prop_Wagon', 0, 0, 1.14, 1); addBoxCollider(m, -1.0, -2.0, 1.0, 2.0, 0, 1.3); });
  }

  // ground-contact shading for loose props, then pack everything
  for (const m of buckets.values()) {
    for (let i = 0; i < m.nv; i++) { if (m.u8[i * 32 + 29] !== 0 || m.u8[i * 32 + 27] < 250) continue; const y = m.f[i * 8 + 1] - Terrain.y(m.f[i * 8], m.f[i * 8 + 2]); if (y < 0.45) m.u8[i * 32 + 27] = Math.round(255 * lerp(0.62, 1, sat(y / 0.45))); }
    if (m.ni) pack.add(m, { kind: 'opaque' });
  }
  World.villagePack = pack;
  World.packs.push(pack);
}
// register a skinned / hinged object; returns the object (bone matrices live in R.boneData at slot*256)
function addSkinned(item, o) {
  const obj = Object.assign({ first: item.first, count: item.count, base: item.base, slot: World.skinned.length, visible: true, c: [0, 0, 0], r: 2, zone: 0, light: 1 }, o);
  World.skinned.push(obj); World.skinCount = World.skinned.length;
  const bd = R.boneData, k = obj.slot * 256; for (let b = 0; b < 16; b++) { bd.fill(0, k + b * 16, k + b * 16 + 16); bd[k + b * 16] = bd[k + b * 16 + 5] = bd[k + b * 16 + 10] = bd[k + b * 16 + 15] = 1; }
  bd[k + 240] = obj.zone; bd[k + 241] = obj.light;
  return obj;
}


// ---- 74_vegetation.js ----
// ───────────────────────── trees, bushes and boulders (instanced) ─────────────────────────
function buildVegetation() {
  const R = rng(9001), pack = new MeshPack();
  // leaf card helper: quad at centre c spanned by half-vectors a (u) and b (v), blob normal n
  const card = (m, c, a, b, n, u0, v0, u1, v1, ao0, ao1, w0, w1) => {
    const P = (su, sv) => [c[0] + a[0] * su + b[0] * sv, c[1] + a[1] * su + b[1] * sv, c[2] + a[2] * su + b[2] * sv];
    const p0 = P(-1, -1), p1 = P(1, -1), p2 = P(1, 1), p3 = P(-1, 1);
    m.wind = w0; const i0 = m.vert(p0[0], p0[1], p0[2], n[0], n[1], n[2], u0, v0, ao0), i1 = m.vert(p1[0], p1[1], p1[2], n[0], n[1], n[2], u1, v0, ao0);
    m.wind = w1; const i2 = m.vert(p2[0], p2[1], p2[2], n[0], n[1], n[2], u1, v1, ao1), i3 = m.vert(p3[0], p3[1], p3[2], n[0], n[1], n[2], u0, v1, ao1);
    m.tri(i0, i1, i2); m.tri(i0, i2, i3);
  };
  // ── pine ──
  const pineT = new Mesh(256), pineL = new Mesh(4096), pineF = new Mesh(64);
  pineT.m3 = 1; pineT.mat(MAT.BARK, [0.92, 0.86, 0.8]); pineT.ao = 0.8; pineT.grad = null;
  pineT.lathe([[0.30, -0.6], [0.22, 0.6], [0.18, 3], [0.11, 6.5], [0.05, 9.4], [0.015, 11.2]], 7, 0);
  pineL.m3 = 1; pineL.mat(MAT.PINE, [1, 1, 1]);
  const tiers = 13;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1), y = 1.7 + 8.9 * t, len = lerp(3.0, 0.6, Math.pow(t, 0.8)), k = t > 0.8 ? 4 : t > 0.4 ? 5 : 6, droop = lerp(0.46, 0.06, t), a0 = R() * TAU;
    for (let j = 0; j < k; j++) {
      const a = a0 + j * TAU / k + R.s() * 0.25, dx = Math.cos(a), dz = Math.sin(a), l2 = len * (0.85 + R() * 0.3);
      const out = [dx, 0, dz], side = [-dz, 0, dx], shade = lerp(0.72, 1.0, t) * (0.9 + R() * 0.2);
      pineL.col([shade, shade, shade]);
      for (let s = 0; s < 2; s++) {            // two segments so the bough can droop
        const f0 = s * 0.5, f1 = f0 + 0.5;
        const c0 = [dx * l2 * f0, y + l2 * (0.10 * Math.sin(f0 * PI) - droop * f0 * f0), dz * l2 * f0], c1 = [dx * l2 * f1, y + l2 * (0.10 * Math.sin(f1 * PI) - droop * f1 * f1), dz * l2 * f1];
        const mid = v3.scale(v3.add(c0, c1), 0.5), hv = v3.scale(v3.sub(c1, c0), 0.5), hw = l2 * 0.36;
        const n = v3.norm([dx * 0.55, 0.75, dz * 0.55]);
        card(pineL, mid, v3.scale(side, hw), hv, n, 0, f0, 1, f1, lerp(0.45, 0.85, f0) * lerp(0.75, 1, t), lerp(0.45, 0.85, f1) * lerp(0.75, 1, t) + 0.12, 0.15 + f0 * 0.8, 0.15 + f1 * 0.8);
        card(pineL, v3.add(mid, [0, -hw * 0.22, 0]), [0, hw * 0.62, 0], hv, v3.norm([dx * 0.4 + side[0] * 0.5, 0.6, dz * 0.4 + side[2] * 0.5]), 0, f0, 1, f1, lerp(0.4, 0.8, f0) * lerp(0.75, 1, t), lerp(0.4, 0.8, f1) * lerp(0.75, 1, t) + 0.1, 0.15 + f0 * 0.8, 0.15 + f1 * 0.8);
      }
    }
  }
  pineL.col([1, 1, 1]); for (let j = 0; j < 3; j++) { const a = j * TAU / 3; card(pineL, [0, 10.9, 0], [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], [0, 0.75, 0], [Math.cos(a + 1.57) * 0.5, 0.8, Math.sin(a + 1.57) * 0.5], 0, 0.25, 1, 1, 0.9, 1, 0.5, 1); }
  pineF.m3 = 2; pineF.mat(MAT.IMPOSTOR, [1, 1, 1]);
  for (let j = 0; j < 2; j++) { const ax = j ? [0, 0, 1] : [1, 0, 0], W = 2.9;
    const v = (s, yy, vv, ao) => pineF.vert(ax[0] * s * W, yy, ax[2] * s * W, ax[0] * s * 0.75, 0.55, ax[2] * s * 0.75, s * 0.5 + 0.5, vv, ao);
    const a = v(-1, 11.5, 0, 1), b = v(-1, -0.4, 1, 0.55), c = v(1, -0.4, 1, 0.55), d = v(1, 11.5, 0, 1); pineF.tri(a, b, c); pineF.tri(a, c, d); }
  // ── birch (and a far version) ──
  const leafBlob = (m, R2, cx, cy, cz, rx, ry, rz, n, size, col, windBase) => {
    for (let i = 0; i < n; i++) {
      let px, py, pz; do { px = R2.s(); py = R2.s(); pz = R2.s(); } while (px * px + py * py + pz * pz > 1);
      const c = [cx + px * rx, cy + py * ry, cz + pz * rz], nn = v3.norm([px * 1.0, py * 0.9 + 0.35, pz * 1.0]);
      const a1 = R2() * TAU, tilt = R2.s() * 0.9, s = size * (0.75 + R2() * 0.5);
      const a = [Math.cos(a1) * s, Math.sin(tilt) * s * 0.5, Math.sin(a1) * s], up = [-Math.sin(a1) * Math.sin(tilt) * s * 0.4, Math.cos(tilt) * s, Math.cos(a1) * Math.sin(tilt) * s * 0.4];
      const sh = 0.8 + R2() * 0.3; m.col([col[0] * sh, col[1] * sh, col[2] * sh]);
      const ao = clamp(0.62 + 0.38 * (py * 0.6 + 0.5) + 0.15 * hyp(px, pz), 0.4, 1);
      card(m, c, a, up, nn, 0, 0, 1, 1, ao, ao, windBase, windBase + 0.3);
    }
  };
  const birchT = new Mesh(512), birchL = new Mesh(2048), birchF = new Mesh(128);
  birchT.m3 = 1; birchT.mat(MAT.BIRCH, [1, 1, 1]); birchT.ao = 0.9;
  birchT.tube([[0, -0.5, 0], [0.06, 1.6, 0.02], [-0.05, 3.6, 0.1], [0.08, 5.6, 0.02], [0.0, 7.4, -0.05]], [0.19, 0.16, 0.12, 0.08, 0.035], 7);
  for (const [y, a] of [[3.8, 0.4], [4.7, 2.6], [5.5, 4.5], [6.2, 1.5]]) birchT.tube([[0, y, 0.05], [Math.cos(a) * 0.8, y + 1.0, Math.sin(a) * 0.8], [Math.cos(a) * 1.5, y + 1.9, Math.sin(a) * 1.5]], [0.07, 0.045, 0.015], 5);
  birchL.m3 = 1; birchL.mat(MAT.LEAVES, [1, 1, 1]);
  leafBlob(birchL, rng(31), 0, 6.9, 0, 2.3, 2.5, 2.3, 26, 1.0, [0.98, 0.80, 0.22], 0.5);
  birchF.m3 = 2;
  for (let j = 0; j < 2; j++) { const ax = j ? [0, 0, 1] : [1, 0, 0];
    birchF.mat(MAT.LEAVES, [0.98, 0.80, 0.22]); const v = (s, yy, vv) => birchF.vert(ax[0] * s * 2.7, yy, ax[2] * s * 2.7, ax[0] * s * 0.75, 0.55, ax[2] * s * 0.75, s * 0.5 + 0.5, vv, 0.9);
    let a = v(-1, 9.7, 0), b = v(-1, 4.1, 1), c = v(1, 4.1, 1), d = v(1, 9.7, 0); birchF.tri(a, b, c); birchF.tri(a, c, d);
    birchF.mat(MAT.BIRCH, [1, 1, 1]); const t = (s, yy, vv) => birchF.vert(ax[0] * s * 0.14, yy, ax[2] * s * 0.14, ax[0] * s, 0.3, ax[2] * s, s * 0.14 + 0.5, vv, 0.9);
    a = t(-1, 5.5, 0); b = t(-1, -0.4, 5.9); c = t(1, -0.4, 5.9); d = t(1, 5.5, 0); birchF.tri(a, b, c); birchF.tri(a, c, d); }
  // ── big oak ──
  const oakT = new Mesh(1024), oakL = new Mesh(4096);
  oakT.mat(MAT.BARK, [0.85, 0.8, 0.75], 1.5); oakT.ao = 0.75;
  oakT.tube([[0, -0.6, 0], [0.05, 1.2, 0], [-0.08, 2.6, 0.06], [0.05, 4.0, 0]], [0.75, 0.52, 0.46, 0.38], 10);
  const limbs = [[0.3, 4.6, 6.0], [1.5, 4.2, 5.5], [2.8, 4.9, 6.2], [4.0, 4.4, 5.4], [5.2, 4.8, 5.8], [0.9, 2.2, 7.8]];
  for (const [a, rr, yy] of limbs) oakT.tube([[0, 3.4, 0], [Math.cos(a) * rr * 0.35, 4.6, Math.sin(a) * rr * 0.35], [Math.cos(a) * rr * 0.75, yy - 0.5, Math.sin(a) * rr * 0.75], [Math.cos(a) * rr, yy, Math.sin(a) * rr]], [0.3, 0.2, 0.12, 0.04], 6);
  oakL.mat(MAT.LEAVES, [1, 1, 1]);
  const oR = rng(77);
  for (const [a, rr, yy] of limbs) leafBlob(oakL, oR, Math.cos(a) * rr * 0.85, yy + 0.4, Math.sin(a) * rr * 0.85, 2.3, 1.5, 2.3, 11, 1.25, [0.42, 0.56, 0.20], 0.4);
  leafBlob(oakL, oR, 0, 8.3, 0, 3.4, 1.7, 3.4, 16, 1.3, [0.46, 0.60, 0.22], 0.5);
  // ── bush ──
  const bushL = new Mesh(512); bushL.mat(MAT.LEAVES, [1, 1, 1]);
  leafBlob(bushL, rng(5), 0, 0.55, 0, 0.75, 0.5, 0.75, 9, 0.62, [0.40, 0.55, 0.22], 0.3);
  // ── boulders ──
  const rockM = [1, 2, 3].map(seed => {
    const m = new Mesh(256), nu = 9, nv = 6; m.mat(MAT.ROCK, [1, 1, 1], 0.7);
    const rad = (a, b) => 1 + 0.32 * gnoise(Math.cos(a) * Math.sin(b) * 1.6 + seed * 7.1, Math.cos(b) * 1.6 + Math.sin(a) * Math.sin(b) * 1.6, seed) + 0.12 * gnoise(Math.cos(a) * Math.sin(b) * 4 + 3, Math.sin(a) * Math.sin(b) * 4 + Math.cos(b) * 4, seed + 9);
    const pos = (i, j) => { const a = -(i % nu) / nu * TAU, b = clamp(j / nv, 0.001, 0.999) * PI, r = rad(a, b); return [Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.62, Math.sin(b) * Math.sin(a) * r * 0.85]; };
    m.grid(nu, nv, (i, j) => { const p = pos(i, j), pa = pos(i + 1, j), pb = pos(i, Math.min(j + 1, nv)), pc = pos(i + nu - 1, j), pd = pos(i, Math.max(j - 1, 0));
      let n = v3.cross(v3.sub(pb, pd), v3.sub(pa, pc)); if (v3.dot(n, p) < 0) n = v3.scale(n, -1); n = v3.norm(v3.add(v3.norm(n), v3.scale(v3.norm(p), 0.6)));
      return m.vert(p[0], p[1], p[2], n[0], n[1], n[2], i / nu * 3, j / nv * 1.5, lerp(0.55, 1, sat(p[1] * 1.2 + 0.6))); });
    return m;
  });
  const I = { pineT: pack.add(pineT), pineL: pack.add(pineL), pineF: pack.add(pineF), birchT: pack.add(birchT), birchL: pack.add(birchL), birchF: pack.add(birchF), oakT: pack.add(oakT), oakL: pack.add(oakL), bush: pack.add(bushL), rocks: rockM.map(m => pack.add(m)) };
  pack.upload('veg'); World.instPack = pack;

  // ── placement ──
  const inst = { pine: [], birch: [], oak: [], bush: [], rock0: [], rock1: [], rock2: [] };
  const blocked = (x, z, pad) => {
    for (const s of SITES) { const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad + (s.porch || 0) + 2 && Math.abs(l[1]) < s.d / 2 + pad + 2) return true; }
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + pad) < r.w / 2 + pad) return true;
    for (const f of FIELDS) if (x > f.x0 - pad - 1 && x < f.x1 + pad + 1 && z > f.z0 - pad - 1 && z < f.z1 + pad + 1) return true;
    if (River.dist(x, z, 7 + pad) < 6.5 + pad) return true;
    if (hyp(x - LAKE.x, z - LAKE.z) < lakeR(x, z) + 2 + pad) return true;
    if (hyp((x - SQUARE.x) / (SQUARE.rx + 2), (z - SQUARE.z) / (SQUARE.rz + 2)) < 1) return true;
    return false;
  };
  const gy = (x, z) => (Math.abs(x) < 143 && Math.abs(z) < 143) ? Terrain.y(x, z) : terrainH(x, z);
  const addTree = (kind, x, z, scale) => {
    const y = gy(x, z);
    inst[kind].push([x, y - 0.05, z, scale, R() * TAU, R(), R(), 0]);
    if (hyp(x, z) < WORLD_RADIUS + 8) World.colliders.push({ x, z, r: (kind === 'oak' ? 0.7 : kind === 'pine' ? 0.27 : 0.2) * scale, y0: y - 1, y1: y + 6 });
  };
  addTree('oak', World.oakPos[0], World.oakPos[1], 1.0);
  { const p = siteToWorld(SITE.chapel, 5.5, -13.5); addTree('oak', p[0], p[1], 0.85); }
  addTree('oak', 88, -30, 0.9);
  for (const [k, x, z, s] of [['birch', -29, 9, 1], ['birch', 31, -17, 1.1], ['birch', -31, -27, 0.95], ['birch', 13, -33, 1.05], ['birch', 28, 25, 1], ['birch', -9, 35, 0.9], ['birch', 45, -9, 1.1], ['birch', -47, 7, 1], ['pine', -20, -33, 1.1], ['pine', 9, -36, 1.25], ['pine', -34, 31, 1.0], ['birch', 47, 20, 1.0], ['birch', 50, 34, 0.9], ['birch', 66, 40, 1.05], ['birch', 30, 70, 1], ['birch', -22, 60, 1.1], ['pine', 40, -40, 1.2], ['birch', 74, -12, 1], ['birch', -6, -44, 0.95]]) if (!blocked(x, z, 0.5)) addTree(k, x, z, s);
  const cell = 7.5, ext = 430;
  for (let gz = -ext; gz < ext; gz += cell) for (let gx = -ext; gx < ext; gx += cell) {
    const x = gx + R() * cell, z = gz + R() * cell, r = hyp(x, z);
    if (r < 56 || r > ext) continue;
    let dens = (0.10 + 0.62 * smooth(62, 135, r)) * smooth(-0.35, 0.15, fbm(x / 70 + 5, z / 70, 3, 23) + 0.25 * smooth(100, 180, r));
    const farm = smooth(60, 110, x) * smooth(60, -10, Math.abs(z)); dens *= 1 - 0.85 * farm;
    if (R() > dens) continue;
    if (r < 160 && blocked(x, z, 1.5)) continue;
    const y = gy(x, z); if (y > 205 || y < LAKE.y + 0.3) continue;
    const e = 2.5, sl = Math.max(Math.abs(gy(x + e, z) - y), Math.abs(gy(x, z + e) - y)) / e; if (sl > 0.85) continue;
    const birchP = r < 150 ? 0.34 : 0.07;
    if (R() < birchP) addTree('birch', x, z, 0.8 + R() * 0.45); else addTree('pine', x, z, (0.75 + R() * 0.7) * (y > 150 ? 0.75 : 1));
  }
  // bushes and boulders
  for (let i = 0; i < 520; i++) {
    const a = R() * TAU, r = 26 + Math.pow(R(), 0.7) * 125, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 0.3)) continue;
    inst.bush.push([x, Terrain.y(x, z) - 0.05, z, 0.5 + R() * 0.65, R() * TAU, R(), R(), 0]);
  }
  for (const s of SITES) { if (!HOUSES[s.id] || s.id === 'barn') continue; for (let k = 0; k < 5; k++) { const side = R() < 0.5 ? -1 : 1, lx = R.s() * s.w * 0.45, p = siteToWorld(s, lx, side * (s.d / 2 + 0.8)); const dl = siteDoorLocal(s, 0); if (hyp(lx - dl[0], side * (s.d / 2) - dl[1]) < 1.8 || s.id === 'smithy' && side < 0) continue; inst.bush.push([p[0], Terrain.y(p[0], p[1]) - 0.05, p[1], 0.45 + R() * 0.4, R() * TAU, R(), R(), 0]); } }
  for (const g of World.gardenPlants || []) inst.bush.push([g[0], Terrain.y(g[0], g[1]) - 0.02, g[1], 0.42 + R() * 0.15, R() * TAU, g[2] * 0.45, R(), 0]);
  const addRock = (x, z, s) => { const y = gy(x, z), k = R.i(0, 2); inst['rock' + k].push([x, y - 0.22 * s, z, s, R() * TAU, R(), 0, 0]); if (s > 0.8 && hyp(x, z) < WORLD_RADIUS + 5) World.colliders.push({ x, z, r: 0.78 * s, y0: y - 1, y1: y + 0.9 * s }); };
  for (let i = 0; i < 420; i++) {
    const a = R() * TAU, r = 30 + R() * 210, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (r < 160 && blocked(x, z, 1.0)) continue;
    addRock(x, z, 0.25 + Math.pow(R(), 2.2) * 2.0);
  }
  for (let s = 20; s < River.len - 30; s += 4.5) { const p = River.point(s); if (hyp(p[0], p[1]) > 200) continue; for (const side of [-1, 1]) { if (R() < 0.6) continue; const o = 4.6 + R() * 2.2, x = p[0] - p[3] * o * side, z = p[1] + p[2] * o * side; if (Math.abs(x - BRIDGE.x) < 10 && Math.abs(z - BRIDGE.z) < 5) continue; if (SITES.some(st => { const l = worldToSite(st, x, z); return Math.abs(l[0]) < st.w / 2 + 2.5 && Math.abs(l[1]) < st.d / 2 + 2.5; })) continue; addRock(x, z, 0.3 + R() * 0.8); } }
  for (let i = 0; i < 40; i++) { const a = R() * TAU, r = 7 + R() * 16, x = SITE.tower.x + Math.cos(a) * r, z = SITE.tower.z + Math.sin(a) * r; if (Roads[2].line.dist(x, z, 3) < 2.5) continue; addRock(x, z, 0.4 + R() * 1.6); }

  World.vegInst = inst;
  // ── bucket instances into cells, upload, register draw groups ──
  const mkGroups = (arr, defs, CS) => {
    if (!arr.length) return;
    CS = CS || 48;
    const cells = new Map();
    for (const it of arr) { const k = Math.floor(it[0] / CS) + ',' + Math.floor(it[2] / CS); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(it); }
    const data = new Float32Array(arr.length * 8), list = []; let n = 0;
    for (const c of cells.values()) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let q = 0; q < c.length; q++) { const it = c[q]; data.set(it, (n + q) * 8); x0 = Math.min(x0, it[0]); x1 = Math.max(x1, it[0]); y0 = Math.min(y0, it[1]); y1 = Math.max(y1, it[1] + 12 * it[3]); z0 = Math.min(z0, it[2]); z1 = Math.max(z1, it[2]); }
      list.push({ first: n, count: c.length, c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], r: 0.5 * hyp(x1 - x0, y1 - y0, z1 - z0) + 7 }); n += c.length;
    }
    const ibuf = data;
    for (const g of defs) World.instGroups.push(Object.assign({ ibuf, cells: list, first: g.item.first, count: g.item.count, base: g.item.base, shadow: true }, g));
  };
  mkGroups(inst.pine, [{ item: I.pineT, kind: 'opaque', lod: 1 }, { item: I.pineL, kind: 'leaf', lod: 1 }], 48);
  mkGroups(inst.pine, [{ item: I.pineF, kind: 'leaf', lod: 2, nearOnly: false }], 130);
  mkGroups(inst.birch, [{ item: I.birchT, kind: 'opaque', lod: 1 }, { item: I.birchL, kind: 'leaf', lod: 1 }], 48);
  mkGroups(inst.birch, [{ item: I.birchF, kind: 'leaf', lod: 2 }], 130);
  mkGroups(inst.oak, [{ item: I.oakT, kind: 'opaque', lod: 0 }, { item: I.oakL, kind: 'leaf', lod: 0 }], 400);
  mkGroups(inst.bush, [{ item: I.bush, kind: 'leaf', lod: 0, maxDist: 80, shadow: false }], 80);
  for (let k = 0; k < 3; k++) mkGroups(inst['rock' + k], [{ item: I.rocks[k], kind: 'opaque', lod: 0, maxDist: 170, nearOnly: true }], 110);
  World.treeCount = inst.pine.length + inst.birch.length;
}


// ---- 75_particles.js ----
// ───────────────────────── billboards: flames, glows, smoke, embers, fireflies ─────────────────────────
const FX = { smoke: [], embers: [], flies: [], motes: [], acc: 0, glows: [] };
function fxInit() {
  const R = rng(55);
  for (let i = 0; i < 46; i++) FX.flies.push({ o: [R.s() * 22, 0.4 + R() * 1.8, R.s() * 22], ph: R() * 100, sp: 0.3 + R() * 0.5 });
  for (let i = 0; i < 36; i++) FX.motes.push({ o: [R.s() * 9, R() * 4, R.s() * 9], ph: R() * 100 });
  World.emitters.forEach((e, i) => { e.seed = (i * 0.618) % 1; e.t = e.seed * 3; });
}
function fxUpdate(dt, time, env, cam) {
  const d = R.partData, max = R.partMax; let n = 0;
  const put = (x, y, z, size, r, g, b, a, rot, kind, aspect, seed) => { if (n >= max) return; const o = n++ * 12; d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = size; d[o + 4] = r; d[o + 5] = g; d[o + 6] = b; d[o + 7] = a; d[o + 8] = rot; d[o + 9] = kind; d[o + 10] = aspect; d[o + 11] = seed; };
  const lit = env.windowGlow, wx = env.windDir[0] * env.windStrength, wz = env.windDir[1] * env.windStrength;
  for (const e of World.emitters) {
    const dx = e.p[0] - cam[0], dy = e.p[1] - cam[1], dz = e.p[2] - cam[2], dist = hyp(dx, dy, dz);
    if (e.type === 'fire' || e.type === 'bonfire') {
      if (e.type === 'bonfire' && !World.bonfire) continue;
      if (dist > 110) continue;
      const s = e.size, fl = flick(time, e.seed * 9);
      for (let k = 0; k < (e.type === 'bonfire' ? 5 : 3); k++) { const a = k * 2.4 + e.seed * 6, r = s * (k ? 0.24 : 0); put(e.p[0] + Math.cos(a) * r, e.p[1] + s * (0.5 + (k % 2) * 0.1), e.p[2] + Math.sin(a) * r, s * (k ? 0.62 : 0.85), 1, 1, 1, 0.9 * fl, 0, 2, 1.2, e.seed + k * 0.37); }
      put(e.p[0], e.p[1] + s * 0.5, e.p[2], s * 2.6, 1.0, 0.42, 0.12, 0.13 * fl, 0, 0, 1, e.seed);
      if (dist < 45) { e.t += dt; const rate = e.type === 'bonfire' ? 0.035 : 0.16; while (e.t > rate) { e.t -= rate; if (FX.embers.length < 150) FX.embers.push({ p: [e.p[0] + (Math.random() - 0.5) * s * 0.6, e.p[1] + s * 0.4, e.p[2] + (Math.random() - 0.5) * s * 0.6], v: [(Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 1.4 * (s > 1 ? 2 : 1), (Math.random() - 0.5) * 0.5], life: 0, max: 0.7 + Math.random() * 1.1 * (s > 1 ? 2 : 1), ph: Math.random() * 9 }); } }
    } else if (e.type === 'smoke') {
      if (dist > 150) continue;
      e.t += dt; while (e.t > 0.42) { e.t -= 0.42; if (FX.smoke.length < 230) FX.smoke.push({ p: [e.p[0], e.p[1], e.p[2]], life: 0, max: 5.5 + Math.random() * 2, seed: Math.random(), rot: Math.random() * 6 }); }
    } else if (e.type === 'candle') {
      if ((lit < 0.05 && !e.always) || dist > 40) continue;
      const k = e.always ? 1 : lit;
      put(e.p[0], e.p[1], e.p[2], 0.05, 1, 1, 1, 0.9 * k, 0, 2, 1.7, e.seed); put(e.p[0], e.p[1] + 0.01, e.p[2], 0.2, 1.0, 0.6, 0.22, 0.5 * k, 0, 0, 1, e.seed);
    } else if (e.type === 'torch') {             // wall torches and standing candelabra: always burning
      if (dist > 55) continue;
      const fl = flick(time, e.seed * 9), sz = e.size || 0.16;
      put(e.p[0], e.p[1] + sz * 0.45, e.p[2], sz, 1, 1, 1, 0.9 * fl, 0, 2, 1.5, e.seed); put(e.p[0], e.p[1] + sz * 0.4, e.p[2], sz * 4.2, 1.0, 0.5, 0.16, 0.2 * fl, 0, 0, 1, e.seed);
    } else if (e.type === 'lantern') {
      if (lit < 0.05 || dist > 170) continue;
      put(e.p[0], e.p[1], e.p[2], 0.11, 1.0, 0.75, 0.35, 3.0 * lit, 0, 0, 1, e.seed); put(e.p[0], e.p[1], e.p[2], 0.75 + dist * 0.012, 1.0, 0.55, 0.2, 0.26 * lit, 0, 0, 1, e.seed);
    } else if (e.type === 'herb') {
      if (e.gone || dist > 60) continue;
      put(e.p[0], e.p[1] + 0.12, e.p[2], 0.34, 0.55, 0.85, 1.0, 0.16 + 0.10 * Math.sin(time * 2 + e.seed * 20) + env.night * 0.25, 0, 0, 1, e.seed);
    }
  }
  // chimney smoke drifts with the wind and thins out
  for (let i = FX.smoke.length - 1; i >= 0; i--) {
    const s = FX.smoke[i]; s.life += dt; if (s.life > s.max) { FX.smoke[i] = FX.smoke[FX.smoke.length - 1]; FX.smoke.pop(); continue; }
    const k = s.life / s.max; s.p[0] += (wx * 0.9 * k + Math.sin(s.seed * 20 + s.life) * 0.08) * dt; s.p[1] += (1.15 - k * 0.5) * dt; s.p[2] += (wz * 0.9 * k) * dt;
    put(s.p[0], s.p[1], s.p[2], 0.35 + k * 2.3, 0.62, 0.60, 0.58, Math.min(k * 6, 1) * (1 - k) * 0.5, s.rot + s.life * 0.2, 1, 1, s.seed);
  }
  for (let i = FX.embers.length - 1; i >= 0; i--) {
    const s = FX.embers[i]; s.life += dt; if (s.life > s.max) { FX.embers[i] = FX.embers[FX.embers.length - 1]; FX.embers.pop(); continue; }
    s.p[0] += (s.v[0] + Math.sin(s.ph + s.life * 7) * 0.4) * dt; s.p[1] += s.v[1] * dt; s.p[2] += (s.v[2] + Math.cos(s.ph + s.life * 6) * 0.4) * dt;
    put(s.p[0], s.p[1], s.p[2], 0.035, 1.0, 0.5, 0.12, 2.6 * (1 - s.life / s.max), 0, 3, 1, 0);
  }
  // fireflies after dusk, drifting specks of dust by day (both wrap around the camera)
  if (env.night > 0.05 && !World.indoor) for (const f of FX.flies) {
    const x = cam[0] + ((f.o[0] - cam[0]) % 44 + 66) % 44 - 22 + Math.sin(time * f.sp + f.ph) * 1.5, z = cam[2] + ((f.o[2] - cam[2]) % 44 + 66) % 44 - 22 + Math.cos(time * f.sp * 0.8 + f.ph) * 1.5;
    const b = Math.max(0, Math.sin(time * 1.3 + f.ph * 3)) * env.night;
    if (b > 0.02) put(x, World.groundY(x, z) + f.o[1] + Math.sin(time * 0.7 + f.ph) * 0.3, z, 0.07, 0.75, 1.0, 0.35, 2.2 * b, 0, 3, 1, 0);
  }
  if (env.day > 0.3) for (const f of FX.motes) {
    const x = cam[0] + ((f.o[0] - cam[0] + time * 0.15) % 18 + 27) % 18 - 9, y = cam[1] - 1.2 + ((f.o[1] + time * 0.05) % 4), z = cam[2] + ((f.o[2] - cam[2]) % 18 + 27) % 18 - 9 + Math.sin(time * 0.3 + f.ph) * 0.4;
    put(x, y, z, 0.022, 1.0, 0.95, 0.8, 0.5 * env.day * (0.5 + 0.5 * Math.sin(time + f.ph)), 0, 3, 1, 0);
  }
  R.partCount = n;
}


// ---- 76_characters.js ----
// ───────────────────────── villagers: procedural skinned bodies + pose engine ─────────────────────────
// model space: feet at y=0, facing -Z, +X is the character's right. bones: 0 pelvis 1 chest 2 head 3/4 left arm 5/6 right arm 7/8 left leg 9/10 right leg
const BJ = [[0, 0.96, 0], [0, 1.12, 0], [0, 1.50, 0], [-0.20, 1.42, 0], [-0.235, 1.13, 0], [0.20, 1.42, 0], [0.235, 1.13, 0], [-0.095, 0.93, 0], [-0.10, 0.50, 0], [0.095, 0.93, 0], [0.10, 0.50, 0]];
const BP = [-1, 0, 1, 1, 3, 1, 5, 0, 7, 0, 9];
const SKIN = { fair: [0.95, 0.76, 0.62], rosy: [0.94, 0.70, 0.58], tan: [0.84, 0.62, 0.45], brown: [0.60, 0.41, 0.29], deep: [0.40, 0.27, 0.20] };
const HAIR = { black: [0.13, 0.11, 0.10], brown: [0.32, 0.20, 0.12], auburn: [0.52, 0.24, 0.12], blond: [0.80, 0.64, 0.34], grey: [0.62, 0.61, 0.60], white: [0.90, 0.89, 0.86], red: [0.66, 0.26, 0.10] };

function buildCharacter(def) {
  const m = new Mesh(2048); m.ao = 1;
  const B = (b0, b1, w) => { m.m1 = b0; m.m2 = b1 === undefined ? b0 : b1; m.m3 = Math.round((w || 0) * 255); };
  // stack of horizontal elliptical rings (top to bottom): [y, cx, cz, rx, rz, b0, b1, w]
  const stack = (rs, n, capTop, capBot) => {
    const N = rs.length;
    m.grid(n, N - 1, (i, j) => {
      const r = rs[j], a = -i / n * TAU, c = Math.cos(a), s = Math.sin(a), up = rs[Math.max(j - 1, 0)], dn = rs[Math.min(j + 1, N - 1)];
      const ny = ((dn[3] + dn[4]) - (up[3] + up[4])) * 0.5 / Math.max(up[0] - dn[0], 0.01);
      B(r[5], r[6], r[7]);
      return m.vert(r[1] + c * r[3], r[0], r[2] + s * r[4], c / r[3], ny / ((r[3] + r[4]) * 0.5), s / r[4], i / n * 1.2, (rs[0][0] - r[0]) * 2.5);
    });
    for (const [on, r, dir] of [[capTop, rs[0], 1], [capBot, rs[N - 1], -1]]) if (on) { B(r[5], r[6], r[7]); const c0 = m.vert(r[1], r[0], r[2], 0, dir, 0, 0, 0); const ring = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; ring.push(m.vert(r[1] + Math.cos(a) * r[3], r[0], r[2] + Math.sin(a) * r[4], 0, dir, 0, 0, 0)); } for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; if (dir > 0) m.tri(c0, b, a); else m.tri(c0, a, b); } }
  };
  const skin = SKIN[def.skin || 'fair'], hair = HAIR[def.hair || 'brown'], top = def.top || [0.5, 0.4, 0.3], legs = def.legs || [0.35, 0.28, 0.22], boots = def.boots || [0.28, 0.18, 0.12];
  const fat = def.build || 1, dress = !!def.dress;
  // legs + boots
  for (const sx of [-1, 1]) {
    const th = sx < 0 ? 7 : 9, sh = sx < 0 ? 8 : 10, x = sx * 0.097;
    m.mat(MAT.CLOTH, legs, 0.6);
    stack([[0.96, x, 0, 0.088 * fat, 0.092 * fat, th, 0, 0.5], [0.80, x, 0, 0.082 * fat, 0.086 * fat, th, th, 0], [0.52, x + sx * 0.003, 0, 0.062, 0.066, th, sh, 0.5], [0.46, x + sx * 0.003, 0.004, 0.058, 0.062, sh, sh, 0], [0.33, x + sx * 0.003, 0.008, 0.055, 0.06, sh, sh, 0]], 8, false, false);
    m.mat(MAT.PLAIN, boots);
    stack([[0.37, x + sx * 0.003, 0.008, 0.064, 0.068, sh, sh, 0], [0.30, x + sx * 0.003, 0.008, 0.066, 0.07, sh, sh, 0], [0.10, x + sx * 0.003, 0.004, 0.055, 0.064, sh, sh, 0], [0.0, x + sx * 0.003, 0, 0.056, 0.066, sh, sh, 0]], 8, true, true);
    B(sh); m.ball(x + sx * 0.003, 0.045, -0.085, 0.052, 0.045, 0.115, 8, 5);
  }
  // torso
  m.mat(MAT.CLOTH, top, 0.6);
  stack([[1.475, 0, 0, 0.062, 0.06, 1, 1, 0], [1.445, 0, 0, 0.175 * fat, 0.098 * fat, 1, 1, 0], [1.36, 0, -0.004, 0.2 * fat, 0.118 * fat, 1, 1, 0], [1.24, 0, -0.006, 0.186 * fat, 0.118 * fat, 1, 1, 0], [1.12, 0, -0.004, 0.166 * fat, 0.108 * fat, 1, 0, 0.5], [1.02, 0, 0, 0.17 * fat, 0.11 * fat, 0, 0, 0], [0.93, 0, 0, 0.178 * fat, 0.118 * fat, 0, 0, 0]], 12, true, false);
  // tunic skirt or long dress
  m.mat(MAT.CLOTH, def.skirt || top, 0.6);
  if (dress) stack([[1.03, 0, 0, 0.172 * fat, 0.112 * fat, 0, 0, 0], [0.86, 0, 0, 0.21 * fat, 0.16 * fat, 0, 0, 0], [0.5, 0, 0.01, 0.255 * fat, 0.215 * fat, 0, 0, 0], [0.13, 0, 0.015, 0.30 * fat, 0.26 * fat, 0, 0, 0]], 12, false, false);
  else stack([[1.03, 0, 0, 0.172 * fat, 0.112 * fat, 0, 0, 0], [0.86, 0, 0, 0.205 * fat, 0.15 * fat, 0, 0, 0], [0.66, 0, 0, 0.228 * fat, 0.172 * fat, 0, 0, 0]], 12, false, false);
  { const hy = dress ? 0.13 : 0.66, hx = (dress ? 0.30 : 0.228) * fat, hz = (dress ? 0.26 : 0.172) * fat; m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); B(0); const c0 = m.vert(0, hy + 0.02, 0, 0, -1, 0, 0, 0); const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.push(m.vert(Math.cos(a) * hx, hy, Math.sin(a) * hz, 0, -1, 0, 0, 0)); } for (let i = 0; i < 12; i++) m.tri(c0, ring[i], ring[(i + 1) % 12]); }
  // belt
  m.mat(MAT.PLAIN, def.belt || [0.25, 0.15, 0.09]); stack([[1.085, 0, -0.002, 0.172 * fat, 0.116 * fat, 0, 1, 0.3], [1.035, 0, 0, 0.178 * fat, 0.12 * fat, 0, 0, 0]], 12, false, false);
  B(0); m.mat(MAT.METAL, COL.bronze); m.box(-0.022, 1.04, -0.128 * fat, 0.022, 1.08, -0.118 * fat);
  // arms
  for (const sx of [-1, 1]) {
    const ua = sx < 0 ? 3 : 5, fa = sx < 0 ? 4 : 6;
    m.mat(MAT.CLOTH, def.sleeves || top, 0.6);
    B(ua, 1, 0.45); m.ball(sx * 0.2 * fat, 1.425, 0, 0.072, 0.07, 0.075, 8, 5);
    const short = def.shortSleeves;
    stack([[1.45, sx * 0.205 * fat, 0, 0.06, 0.062, ua, 1, 0.4], [1.30, sx * 0.218 * fat, 0, 0.054, 0.056, ua, ua, 0], [1.16, sx * 0.232 * fat, 0, 0.048, 0.05, ua, fa, 0.5], [1.10, sx * 0.236 * fat, 0, 0.046, 0.048, fa, fa, 0]].concat(short ? [] : [[0.90, sx * 0.248 * fat, 0, 0.04, 0.042, fa, fa, 0]]), 8, false, false);
    m.mat(MAT.PLAIN, skin);
    if (short) stack([[1.10, sx * 0.236 * fat, 0, 0.042, 0.044, fa, fa, 0], [0.89, sx * 0.248 * fat, 0, 0.034, 0.036, fa, fa, 0]], 8, false, false);
    B(fa); m.ball(sx * 0.25 * fat, 0.835, -0.005, 0.034, 0.062, 0.044, 7, 5);
  }
  // neck + head
  m.mat(MAT.PLAIN, skin);
  stack([[1.56, 0, 0.004, 0.05, 0.052, 2, 2, 0], [1.50, 0, 0.002, 0.052, 0.054, 2, 1, 0.5], [1.45, 0, 0, 0.056, 0.056, 1, 1, 0]], 8, false, false);
  B(2); m.ball(0, 1.628, -0.004, 0.098, 0.122, 0.108, 12, 9);
  m.ball(0, 1.612, -0.108, 0.014, 0.024, 0.02, 6, 4); for (const sx of [-1, 1]) m.ball(sx * 0.099, 1.632, 0.004, 0.012, 0.026, 0.018, 5, 4);
  m.mat(MAT.PLAIN, [0.10, 0.08, 0.07]); for (const sx of [-1, 1]) m.ball(sx * 0.037, 1.648, -0.092, 0.013, 0.014, 0.011, 6, 4);
  m.mat(MAT.PLAIN, [0.55, 0.26, 0.22]); m.box(-0.022, 1.562, -0.104, 0.022, 1.57, -0.094);
  m.mat(MAT.PLAIN, hair); for (const sx of [-1, 1]) m.box(sx * 0.037 - 0.02, 1.672, -0.103, sx * 0.037 + 0.02, 1.68, -0.092);
  const hs = def.hairStyle || 'short';
  if (hs !== 'bald') { m.ball(0, 1.672, 0.014, 0.105, 0.09, 0.112, 10, 6); m.ball(0, 1.615, 0.046, 0.101, 0.105, 0.086, 10, 6); }
  else m.ball(0, 1.62, 0.05, 0.1, 0.06, 0.07, 8, 5);
  if (hs === 'long') stack([[1.60, 0, 0.07, 0.095, 0.06, 2, 2, 0], [1.46, 0, 0.09, 0.105, 0.05, 2, 1, 0.6], [1.30, 0, 0.105, 0.09, 0.035, 1, 1, 0]], 8, false, true);
  if (hs === 'bun') m.ball(0, 1.71, 0.085, 0.052, 0.05, 0.052, 7, 5);
  if (hs === 'braid') stack([[1.58, 0, 0.1, 0.035, 0.035, 2, 2, 0], [1.42, 0, 0.125, 0.03, 0.03, 1, 1, 0], [1.2, 0, 0.13, 0.022, 0.022, 1, 1, 0]], 6, false, true);
  B(2);
  if (def.beard) { m.ball(0, 1.555, -0.062, 0.072, 0.062, 0.058, 8, 5); if (def.beard > 1) stack([[1.55, 0, -0.07, 0.06, 0.042, 2, 2, 0], [1.44, 0, -0.085, 0.05, 0.035, 2, 1, 0.5], [1.32, 0, -0.095, 0.018, 0.014, 1, 1, 0]], 7, false, true); }
  const hat = def.hat; B(2);
  if (hat === 'straw') { m.mat(MAT.THATCH, COL.hay, 0.3); m.lathe([[0.25, 1.705], [0.11, 1.715], [0.105, 1.80], [0.05, 1.83], [0.0, 1.835]], 12, 0); m.lathe([[0.11, 1.70], [0.25, 1.70]], 12, 0); }
  if (hat === 'cap' || hat === 'feather') { m.mat(MAT.CLOTH, def.hatCol || COL.red, 0.5); m.ball(0.005, 1.725, 0.012, 0.116, 0.058, 0.124, 10, 5); if (hat === 'feather') { m.mat(MAT.PLAIN, [0.92, 0.9, 0.85]); m.quad2([0.09, 1.93, 0.1], [0.085, 1.74, 0.02], [0.105, 1.74, -0.03], [0.13, 1.93, 0.05]); } }
  if (hat === 'helmet') { m.mat(MAT.METAL, COL.steel); m.lathe([[0.128, 1.655], [0.122, 1.72], [0.09, 1.775], [0.0, 1.80]], 12, 0); m.lathe([[0.18, 1.64], [0.128, 1.662]], 12, 0); m.lathe([[0.128, 1.655], [0.18, 1.635]], 12, 0); }
  if (hat === 'hood') { m.mat(MAT.CLOTH, def.cloak || top, 0.6); m.ball(0, 1.64, 0.04, 0.128, 0.142, 0.128, 10, 7); stack([[1.52, 0, 0.03, 0.12, 0.10, 2, 1, 0.5], [1.43, 0, 0.01, 0.2 * fat, 0.125 * fat, 1, 1, 0]], 10, false, false); }
  if (hat === 'kerchief') { m.mat(MAT.CLOTH, def.hatCol || COL.linen, 0.5); m.ball(0, 1.675, 0.02, 0.11, 0.095, 0.118, 10, 6); }
  // apron / tabard, cloak
  if (def.apron) { m.mat(MAT.CLOTH, def.apron, 0.6); const z = -0.128 * fat, rows = [[1.37, 0.115, 1, 1, 0, z + 0.006], [1.10, 0.15, 1, 0, 0.5, z - 0.002], [0.60, 0.17, 0, 0, 0, -0.178 * fat]]; let pa, pb; rows.forEach((r, k) => { B(r[2], r[3], r[4]); const a = m.vert(-r[1], r[0], r[5], 0, 0.1, -1, 0, k), b = m.vert(r[1], r[0], r[5], 0, 0.1, -1, 0.6, k); if (k) { m.tri(pa, b, a); m.tri(pa, pb, b); } pa = a; pb = b; }); }
  if (def.cloakBack) { m.mat(MAT.CLOTH, def.cloak || [0.3, 0.3, 0.32], 0.7); const rows = [[1.47, 0.17, 1, 1, 0, 0.105], [1.12, 0.215, 1, 0, 0.5, 0.135], [0.55, 0.25, 0, 0, 0, 0.19]]; let pa, pb, qa, qb; rows.forEach((r, k) => { B(r[2], r[3], r[4]); const a = m.vert(-r[1] * fat, r[0], r[5] * fat, 0, 0.1, 1, 0, k), b = m.vert(r[1] * fat, r[0], r[5] * fat, 0, 0.1, 1, 0.6, k), c = m.vert(-r[1] * fat, r[0], r[5] * fat - 0.005, 0, 0, -1, 0, k), e = m.vert(r[1] * fat, r[0], r[5] * fat - 0.005, 0, 0, -1, 0.6, k); if (k) { m.tri(pa, a, b); m.tri(pa, b, pb); m.tri(qa, e, c); m.tri(qa, qb, e); } pa = a; pb = b; qa = c; qb = e; }); }
  // hand-held things (bind pose: right hand at x=+0.25, y=0.83)
  const prop = def.prop;
  if (prop === 'spear') { B(6); m.mat(MAT.TIMBER, COL.wood); m.tube([[0.275, 0.02, -0.05], [0.275, 2.02, -0.05]], 0.016, 6); m.mat(MAT.METAL, COL.steel); m.push().T(0.275, 2.02, -0.05); m.lathe([[0.035, 0], [0.0, 0.26]], 4, 1); m.pop(); }
  if (prop === 'hammer') { B(6); m.mat(MAT.TIMBER, COL.wood); m.box(0.238, 0.815, -0.30, 0.262, 0.84, 0.04); m.mat(MAT.METAL, COL.iron); m.box(0.215, 0.79, -0.36, 0.285, 0.865, -0.28); }
  if (prop === 'staff') { B(6); m.mat(MAT.TIMBER, COL.woodDark); m.tube([[0.275, 0.02, -0.07], [0.27, 0.9, -0.07], [0.28, 1.62, -0.06]], [0.018, 0.02, 0.024], 6, true); }
  if (prop === 'rod') { B(6); m.mat(MAT.TIMBER, COL.wood); m.tube([[0.25, 0.80, 0.08], [0.25, 0.98, -0.5], [0.25, 1.5, -1.9]], [0.012, 0.009, 0.004], 5); m.mat(MAT.PLAIN, [0.8, 0.8, 0.8]); m.box(0.2495, 0.3, -1.902, 0.2505, 1.5, -1.9); }
  if (prop === 'lute') { B(1); m.mat(MAT.PLANKS, [0.9, 0.7, 0.45], 0.4); m.ball(0.06, 1.13, -0.165, 0.125, 0.165, 0.05, 9, 6); m.mat(MAT.TIMBER, COL.woodDark); m.beam([0.0, 1.22, -0.17], [-0.3, 1.42, -0.15], 0.035, 0.022); m.mat(MAT.PLAIN, [0.1, 0.08, 0.07]); m.ball(0.06, 1.14, -0.214, 0.04, 0.04, 0.004, 8, 4); }
  if (prop === 'broom') { B(6); m.mat(MAT.TIMBER, COL.wood); m.tube([[0.26, 1.35, 0.1], [0.26, 0.3, -0.38]], 0.015, 5); m.mat(MAT.THATCH, COL.hay, 0.3); m.push().T(0.26, 0.3, -0.38).RX(-0.42); m.lathe([[0.09, -0.3], [0.025, 0]], 7, 0); m.pop(); }
  if (def.sword) { B(0); m.mat(MAT.PLAIN, COL.leather); m.beam([-0.2 * fat, 1.02, 0.0], [-0.24 * fat, 0.42, 0.14], 0.035, 0.03); m.mat(MAT.METAL, COL.bronze); m.box(-0.23 * fat, 1.0, -0.035, -0.16 * fat, 1.02, 0.035); m.mat(MAT.PLAIN, COL.leather); m.box(-0.205 * fat, 1.02, -0.012, -0.185 * fat, 1.14, 0.012); }
  return m;
}
// small animals share the same skinning path. chicken: bones 0 body, 1 head, 2 left leg, 3 right leg
function buildChicken(col) {
  const m = new Mesh(512), B = b => { m.m1 = b; m.m2 = b; m.m3 = 0; };
  B(0); m.mat(MAT.PLAIN, col); m.ball(0, 0.21, 0.01, 0.085, 0.085, 0.13, 9, 6); m.ball(0, 0.27, 0.13, 0.05, 0.08, 0.06, 7, 5); m.ball(0, 0.24, -0.02, 0.092, 0.06, 0.1, 8, 5);
  B(1); m.ball(0, 0.335, -0.115, 0.042, 0.06, 0.042, 7, 5); m.ball(0, 0.39, -0.135, 0.036, 0.036, 0.04, 7, 5);
  m.mat(MAT.PLAIN, [0.9, 0.6, 0.15]); m.push().T(0, 0.385, -0.17).RX(-PI / 2); m.lathe([[0.014, 0], [0, 0.04]], 5, 0); m.pop();
  m.mat(MAT.PLAIN, [0.8, 0.12, 0.1]); m.ball(0, 0.43, -0.13, 0.008, 0.02, 0.028, 5, 4); m.ball(0, 0.36, -0.165, 0.008, 0.016, 0.01, 5, 4);
  m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); for (const s of [-1, 1]) m.ball(s * 0.03, 0.398, -0.15, 0.006, 0.006, 0.006, 4, 3);
  m.mat(MAT.PLAIN, [0.85, 0.6, 0.2]); for (const s of [-1, 1]) { B(s < 0 ? 2 : 3); m.box(s * 0.04 - 0.006, 0, -0.006, s * 0.04 + 0.006, 0.15, 0.006); m.box(s * 0.04 - 0.02, 0, -0.045, s * 0.04 + 0.02, 0.008, 0.012); }
  return m;
}

// ── pose engine ──
const POSE = { ang: new Float32Array(33), root: m4.create(), W: [], S: m4.create(), T: m4.create() };
for (let i = 0; i < 11; i++) POSE.W.push(m4.create());
// writes the 11 skinning matrices for an articulated villager into the bone buffer
function poseWrite(slot, root, ang) {
  const W = POSE.W, T = POSE.T, bd = R.boneData;
  for (let b = 0; b < 11; b++) {
    const p = BP[b], J = BJ[b], w = W[b];
    if (p < 0) { m4.copy(w, root); m4.translate(w, J[0], J[1], J[2]); }
    else { const Pj = BJ[p]; m4.copy(w, W[p]); m4.translate(w, J[0] - Pj[0], J[1] - Pj[1], J[2] - Pj[2]); }
    const ax = ang[b * 3], ay = ang[b * 3 + 1], az = ang[b * 3 + 2];
    if (ay) m4.rotY(w, ay); if (ax) m4.rotX(w, ax); if (az) m4.rotZ(w, az);
    m4.copy(T, w); m4.translate(T, -J[0], -J[1], -J[2]);
    bd.set(T, slot * 256 + b * 16);
  }
}
// fill joint angles for an animation; returns vertical root offset
function poseAngles(a, anim, t, speed, look) {
  a.fill(0); let dy = 0;
  const s = Math.sin, c = Math.cos, breathe = s(t * 1.4) * 0.012;
  a[3] = breathe; a[11] = -0.06; a[17] = 0.06; a[12] = 0.12; a[18] = 0.12;        // relaxed arms
  a[7] = look ? look[0] : 0; a[6] = look ? look[1] : 0;
  if (anim === 'walk' || anim === 'run') {
    const A = anim === 'run' ? 0.85 : 0.52, ph = t, sw = s(ph), kn = anim === 'run' ? 1.5 : 1.0;
    a[21] = A * sw; a[27] = -A * sw; a[24] = -kn * Math.max(0, c(ph)) - 0.05; a[30] = -kn * Math.max(0, -c(ph)) - 0.05;
    a[9] = -A * 0.75 * sw; a[15] = A * 0.75 * sw; a[12] = 0.2 + (anim === 'run' ? 0.9 : 0.2 * Math.max(0, -sw)); a[18] = 0.2 + (anim === 'run' ? 0.9 : 0.2 * Math.max(0, sw));
    a[4] = 0.07 * sw; a[1] = -0.05 * sw; a[3] = anim === 'run' ? -0.16 : -0.03; a[7] += -0.04 * sw;
    dy = -0.02 + 0.028 * Math.abs(c(ph));
  } else if (anim === 'sit') {
    a[21] = a[27] = 1.5; a[24] = a[30] = -1.5; a[9] = a[15] = 0.38; a[12] = a[18] = 0.75; a[3] = -0.04 + breathe; a[11] = -0.12; a[17] = 0.12;
  } else if (anim === 'talk') {
    a[15] = 0.35 + 0.15 * s(t * 2.1); a[18] = 1.05 + 0.35 * s(t * 3.3); a[17] = 0.18; a[9] = 0.1; a[12] = 0.5 + 0.2 * s(t * 1.7 + 1); a[6] += 0.05 * s(t * 2.6); a[3] = -0.03 + breathe;
  } else if (anim === 'hammer') {
    const k = (t * 0.9) % 1, up = k < 0.55 ? smooth(0, 0.55, k) : 1 - smooth(0.55, 0.7, k);
    a[15] = 0.5 + 1.5 * up; a[18] = 0.5 + 1.0 * up; a[3] = -0.28 + 0.14 * up; a[9] = 0.5; a[12] = 0.7; a[6] = 0.2; a[0] = 0;
  } else if (anim === 'lute') {
    a[9] = 0.75; a[12] = 1.25; a[11] = -0.45; a[15] = 0.45; a[18] = 1.5 + 0.12 * s(t * 9); a[17] = -0.25; a[4] = 0.06 * s(t * 1.3); a[6] += 0.08 * s(t * 0.9);
  } else if (anim === 'pray') {
    a[9] = a[15] = 0.7; a[12] = a[18] = 1.6; a[11] = 0.35; a[17] = -0.35; a[6] = 0.3; a[3] = -0.08;
  } else if (anim === 'guard') {
    a[15] = 0.28; a[18] = 0.5; a[17] = 0.08; a[3] = breathe * 0.5;
  } else if (anim === 'fish') {
    a[15] = 0.55 + 0.04 * s(t * 0.8); a[18] = 0.7; a[9] = 0.4; a[12] = 0.9; a[11] = 0.25; a[3] = -0.06;
  } else if (anim === 'work') {       // bending to tend plants / sacks
    const k = 0.5 + 0.5 * s(t * 1.1);
    a[3] = -0.25 - 0.45 * k; a[9] = a[15] = 0.5 + 0.7 * k; a[12] = a[18] = 0.4 + 0.3 * s(t * 2.2); a[6] = 0.3 * k; a[21] = a[27] = 0.25 * k; a[24] = a[30] = -0.4 * k; dy = -0.05 * k;
  } else if (anim === 'sweep') {
    a[9] = 0.5; a[15] = 0.7 + 0.25 * s(t * 2.4); a[12] = 0.9; a[18] = 0.6; a[4] = 0.25 * s(t * 2.4); a[3] = -0.15; a[17] = -0.2;
  } else if (anim === 'lie') {
    a[11] = -0.1; a[17] = 0.1; a[6] = -0.1;
  } else if (anim === 'cheer') {
    a[9] = a[15] = 2.6 + 0.3 * s(t * 5); a[11] = -0.3; a[17] = 0.3; a[12] = a[18] = 0.4; dy = 0.03 * Math.abs(s(t * 5));
  }
  return dy;
}


// ---- 77_npc.js ----
// ───────────────────────── villagers: who they are, where they walk, what they do ─────────────────────────
// schedule rows: [fromHour, spot, animation]   (wander: list of spots visited in turn)
const NPC_DEFS = [
  { id: 'hale', name: 'Warden Hale', skin: 'tan', hair: 'brown', beard: 1, hat: 'helmet', top: [0.42, 0.40, 0.38], apron: [0.55, 0.15, 0.13], legs: [0.25, 0.22, 0.2], prop: 'spear', sword: true, build: 1.08,
    sched: [[6, 'gate.post', 'guard'], [19.5, 'inn.s5', 'sit'], [22.5, 'guardhouse.bed', 'lie']] },
  { id: 'greta', name: 'Greta Barleybrook', skin: 'rosy', hair: 'auburn', hairStyle: 'bun', dress: true, top: [0.34, 0.46, 0.30], apron: COL.linen, build: 1.1, shortSleeves: true,
    sched: [[5.5, 'inn.bar', 'idle'], [23.5, 'inn.bed2', 'lie']] },
  { id: 'brandt', name: 'Brandt Ironhand', skin: 'tan', hair: 'black', hairStyle: 'bald', beard: 1, top: [0.36, 0.30, 0.27], apron: [0.36, 0.22, 0.13], legs: [0.28, 0.24, 0.2], build: 1.18, shortSleeves: true, prop: 'hammer',
    sched: [[6.5, 'smithy.anvil', 'hammer'], [12, 'smithy.forge', 'work'], [13, 'smithy.anvil', 'hammer'], [19, 'inn.s1', 'sit'], [22, 'smithy.bed', 'lie']] },
  { id: 'tobin', name: 'Tobin', scale: 0.74, skin: 'fair', hair: 'blond', top: [0.55, 0.45, 0.25], legs: [0.3, 0.25, 0.2], run: true,
    sched: [[7, ['square.bench2', 'stallfront0', 'smithy.forge', 'stallfront1', 'gate.post2', 'square.bench2'], 'idle'], [19.5, 'smithy.sit', 'sit'], [21.5, 'smithy.home', 'idle']] },
  { id: 'marta', name: 'Marta Quill', skin: 'brown', hair: 'black', hairStyle: 'braid', dress: true, top: [0.52, 0.20, 0.30], hat: 'kerchief', hatCol: [0.9, 0.82, 0.6], belt: [0.7, 0.55, 0.2],
    sched: [[7, 'store.counter', 'idle'], [20, 'inn.s3', 'sit'], [22, 'store.bed', 'lie']] },
  { id: 'aldous', name: 'Brother Aldous', skin: 'fair', hair: 'grey', hairStyle: 'bald', dress: true, top: [0.80, 0.76, 0.64], belt: [0.45, 0.3, 0.2], cloakBack: true, cloak: [0.42, 0.30, 0.22], hat: 'hood',
    sched: [[5, 'chapel.altar', 'pray'], [9, 'chapel.nave', 'idle'], [12, 'chapel.altar', 'pray'], [14, 'chapel.nave', 'idle'], [18, 'chapel.altar', 'pray']] },
  { id: 'maren', name: 'Old Maren', skin: 'fair', hair: 'white', dress: true, top: [0.36, 0.30, 0.42], hat: 'hood', cloak: [0.28, 0.38, 0.28], cloakBack: true, scale: 0.93,
    sched: [[7, 'herbalist.garden', 'work'], [12, 'herbalist.home', 'idle'], [14, 'herbalist.garden', 'work'], [18.5, 'herbalist.sit', 'sit'], [21, 'herbalist.bed', 'lie']] },
  { id: 'osric', name: 'Osric Dunn', skin: 'fair', hair: 'brown', beard: 1, hat: 'cap', hatCol: [0.9, 0.88, 0.8], top: [0.84, 0.81, 0.74], apron: [0.92, 0.9, 0.84], legs: [0.5, 0.45, 0.38], build: 1.15,
    sched: [[6, 'mill.work', 'work'], [10, 'mill.door', 'idle'], [13, 'mill.work', 'work'], [19, 'inn.s2', 'sit'], [22, 'mill.bed', 'lie']] },
  { id: 'edda', name: 'Edda Fairweather', skin: 'tan', hair: 'blond', hairStyle: 'braid', hat: 'straw', dress: true, top: [0.56, 0.44, 0.24], apron: [0.36, 0.46, 0.58], shortSleeves: true,
    sched: [[6, 'farm.field', 'work'], [10, 'farm.yard', 'idle'], [12, 'farm.field2', 'work'], [17, 'farm.yard', 'sweep'], [19.5, 'farm.sit', 'sit'], [21.5, 'farm.bed', 'lie']], prop: null },
  { id: 'finn', name: 'Finn Reedwater', skin: 'tan', hair: 'grey', beard: 1, hat: 'cap', hatCol: [0.24, 0.36, 0.5], top: [0.30, 0.42, 0.50], legs: [0.3, 0.28, 0.24], prop: 'rod',
    sched: [[5.5, 'dock.end', 'fish'], [19, 'inn.s4', 'sit'], [22, 'fisher.bed', 'lie']] },
  { id: 'lark', name: 'Lark', skin: 'fair', hair: 'red', hairStyle: 'long', hat: 'feather', hatCol: [0.2, 0.45, 0.3], top: [0.22, 0.48, 0.44], skirt: [0.22, 0.48, 0.44], legs: [0.52, 0.2, 0.2], prop: 'lute', belt: [0.75, 0.6, 0.2],
    sched: [[9, 'square.bard', 'lute'], [13, 'inn.bard', 'lute'], [15, 'square.bard', 'lute'], [18.5, 'inn.bard', 'lute'], [24.5, 'inn.fire2', 'sit']] },
  { id: 'wren', name: 'Wren', skin: 'brown', hair: 'black', hairStyle: 'braid', hat: 'hood', cloak: [0.24, 0.32, 0.2], cloakBack: true, top: [0.34, 0.38, 0.24], legs: [0.32, 0.25, 0.18],
    sched: [[6, 'hunter.yard', 'work'], [11, 'hunter.home', 'idle'], [13, 'hunter.yard', 'idle'], [20, 'hunter.sit', 'sit'], [22, 'hunter.bed', 'lie']] },
  { id: 'rowan', name: 'Elder Rowan', skin: 'fair', hair: 'white', hairStyle: 'long', beard: 2, dress: true, top: [0.40, 0.34, 0.52], belt: [0.7, 0.6, 0.3], prop: 'staff', scale: 0.97,
    sched: [[8, 'square.bench', 'sit'], [14, 'elder.porch', 'sit'], [19.5, 'elder.sit', 'sit'], [21.5, 'elder.bed', 'lie']] },
  { id: 'pip', name: 'Pip', scale: 0.66, skin: 'rosy', hair: 'brown', hairStyle: 'braid', dress: true, top: [0.72, 0.36, 0.30], run: true,
    sched: [[7.5, ['stallfront2', 'square.well', 'stallfront1', 'square.bench2', 'stallfront0', 'square.well'], 'idle'], [19, 'weaver.home', 'idle'], [20.5, 'weaver.bed2', 'lie']] },
  { id: 'ivo', name: 'Guardsman Ivo', skin: 'deep', hair: 'black', hat: 'helmet', top: [0.42, 0.40, 0.38], apron: [0.2, 0.3, 0.5], legs: [0.25, 0.22, 0.2], prop: 'spear', sword: true,
    sched: [[6, ['gate.post2', 'square.well', 'bridge.west', 'square.well'], 'guard'], [21, 'gate.post2', 'guard']] },
  { id: 'hilda', name: 'Hilda Weaver', skin: 'rosy', hair: 'brown', hairStyle: 'bun', dress: true, top: [0.26, 0.38, 0.60], apron: [0.9, 0.86, 0.76],
    sched: [[8, 'stall2', 'idle'], [18.5, 'weaver.home', 'idle'], [20, 'weaver.sit', 'sit'], [21.5, 'weaver.bed', 'lie']] },
  { id: 'bram', name: 'Bram', skin: 'tan', hair: 'auburn', hat: 'straw', top: [0.5, 0.52, 0.34], legs: [0.36, 0.3, 0.22], shortSleeves: true,
    sched: [[7.5, 'stall0', 'idle'], [18, 'barn.work', 'work'], [19.5, 'inn.stand1', 'idle'], [22, 'farm.bed2', 'lie']] },
];
const NPCS = [], NPC = {};
const Nav = { nodes: [], adj: [], spot: {} };
function navBuild() {
  const N = Nav.nodes, A = Nav.adj;
  const add = (x, y, z) => { N.push([x, y, z]); A.push([]); return N.length - 1; };
  const link = (a, b) => { if (a === b || a < 0 || b < 0) return; const d = hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]); if (!A[a].some(e => e[0] === b)) { A[a].push([b, d]); A[b].push([a, d]); } };
  const roadNodes = [];
  for (const r of Roads) {
    let prev = -1; const n = Math.max(2, Math.round(r.line.len / 5));
    for (let i = 0; i <= n; i++) { const p = r.line.point(r.line.len * i / n); if (hyp(p[0], p[1]) > WORLD_RADIUS + 20) { prev = -1; continue; } const k = add(p[0], World.groundY(p[0], p[1]), p[1]); roadNodes.push(k); link(prev, k); prev = k; }
  }
  const nearest = (x, z, list, max) => { let b = -1, bd = max * max; for (const k of list) { const d = (N[k][0] - x) * (N[k][0] - x) + (N[k][2] - z) * (N[k][2] - z); if (d < bd) { bd = d; b = k; } } return b; };
  // join roads where they meet
  for (const k of roadNodes) for (const j of roadNodes) if (j > k + 1 && hyp(N[k][0] - N[j][0], N[k][2] - N[j][2]) < 3.2) link(k, j);
  // a few stepping stones across the open square
  const sq = [[0, -2], [-6, -4], [6, -3], [0, -10], [0, 6], [-9, 2], [9, 3], [0, -15.5]].map(p => add(p[0], World.groundY(p[0], p[1]), p[1]));
  for (const a of sq) { for (const b of sq) if (a < b && hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]) < 11) link(a, b); link(a, nearest(N[a][0], N[a][2], roadNodes, 9)); }
  const outside = roadNodes.concat(sq);
  const doorNode = {};
  for (const id in World.houses) {
    const h = World.houses[id], d = h.door; if (!d) continue;
    const o = add(d.out[0], World.groundAt(d.out[0], d.out[2], d.out[1] + 1), d.out[2]), i = add(d.ins[0], h.floorY + 0.02, d.ins[2]);
    link(o, i); link(o, nearest(d.out[0], d.out[2], outside, 40)); doorNode[id] = { o, i }; outside.push(o);
  }
  for (const name in World.spots) {
    const s = World.spots[name], k = add(s.p[0], s.p[1], s.p[2]); Nav.spot[name] = k;
    if (s.zone && s.site && doorNode[s.site]) link(k, doorNode[s.site].i); else link(k, nearest(s.p[0], s.p[2], outside, 60));
  }
  // the inn's loft is reached by its stairs
  const S = Nav.spot; if (S['inn.stairs0'] !== undefined) { for (const n of ['inn.guestbed', 'inn.bed2']) { const k = S[n]; A[k].length = 0; for (const a of A) for (let i = a.length - 1; i >= 0; i--) if (a[i][0] === k) a.splice(i, 1); link(k, S['inn.stairs1']); }
    const k1 = S['inn.stairs1']; A[k1].length = 0; for (const a of A) for (let i = a.length - 1; i >= 0; i--) if (a[i][0] === k1) a.splice(i, 1); link(k1, S['inn.stairs0']); for (const n of ['inn.guestbed', 'inn.bed2']) link(S[n], k1); }
}
function navPath(a, b) {
  const N = Nav.nodes, A = Nav.adj, n = N.length, dist = new Float32Array(n).fill(1e9), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  dist[a] = 0;
  for (; ;) {
    let u = -1, bd = 1e9; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
    if (u < 0 || u === b) break; done[u] = 1;
    for (const e of A[u]) { const nd = bd + e[1]; if (nd < dist[e[0]]) { dist[e[0]] = nd; prev[e[0]] = u; } }
  }
  if (dist[b] >= 1e9) return null;
  const path = []; for (let k = b; k >= 0; k = prev[k]) path.push(k); return path.reverse();
}

function buildNPCs() {
  const s = (n, x, z, yaw, e) => { World.spots[n] = Object.assign({ p: [x, World.groundY(x, z), z], yaw: yaw || 0, zone: 0 }, e || {}); };
  s('square.bard', 2.6, -5.2, PI); s('square.well', 4.2, -6.4, 0.9); s('bridge.west', 48.5, 2, PI / 2);
  // a few more indoor seats derived from each cottage's table
  for (const id of ['herbalist', 'weaver', 'farm', 'hunter', 'elder']) { const sp = World.spots[id + '.sit']; if (!sp) console.warn('no seat', id); }
  for (const def of NPC_DEFS) {
    const mesh = buildCharacter(def), item = World.skinPack.add(mesh);
    const npc = { def, id: def.id, name: def.name, scale: def.scale || 1, pos: [0, 0, 0], yaw: 0, anim: 'idle', t: Math.random() * 10, path: null, pi: 0, at: null, goal: null, wander: 0, dwell: 0, talking: false, look: [0, 0], ang: new Float32Array(33) };
    npc.obj = addSkinned(item, { r: 1.4, zone: 0, npc: true });
    if (G.chars) { try { npc.ch = Chars.spawn(def); npc.ch.pivot.traverse(o => { o.layers.set(1); }); npc.obj.hasChar = true; } catch (e) { console.warn('villager ' + def.id + ': ' + (e && e.message || e)); npc.ch = null; } }
    NPCS.push(npc); NPC[def.id] = npc;
  }
  // chickens
  World.chickens = [];
  const cm = [buildChicken([0.92, 0.9, 0.85]), buildChicken([0.62, 0.36, 0.2]), buildChicken([0.25, 0.22, 0.2])].map(m => World.skinPack.add(m));
  const homes = [[World.coop[0] + 1.5, World.coop[1] + 2], [World.coop[0] - 1, World.coop[1] + 3], [World.coop[0] + 2.5, World.coop[1] + 0.5], [World.coop[0] + 0.5, World.coop[1] + 4.2], [100.5, -13.5], [-13, 13.5], [-15.5, 15], [13.5, 17]];
  homes.forEach((h, i) => World.chickens.push({ home: h, pos: [h[0], 0, h[1]], yaw: i * 1.7, st: 'idle', t: i, tt: 1 + i * 0.3, obj: addSkinned(cm[i % 3], { r: 0.5, zone: 0 }), ph: i * 2.1 }));
  // things to pick up
  const hm = new Mesh(128); hm.push().RZ(PI / 2 - 0.25).RY(0.4); Props.hammer(hm); hm.pop();
  const herb = new Mesh(256);
  herb.mat(MAT.PLAIN, [0.3, 0.5, 0.28]); herb.tube([[0, 0, 0], [0.02, 0.12, 0.01], [0, 0.22, 0]], 0.012, 5);
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4; herb.quad2([Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16], [Math.cos(a + 0.5) * 0.05, 0.02, Math.sin(a + 0.5) * 0.05], [0, 0.03, 0], [Math.cos(a - 0.5) * 0.05, 0.02, Math.sin(a - 0.5) * 0.05]); }
  herb.mat(MAT.PLAIN, [0.72, 0.88, 1.0]); herb.lathe([[0.008, 0.2], [0.07, 0.235], [0.075, 0.25], [0.0, 0.29]], 7, 0); herb.mat(MAT.PLAIN, [0.9, 0.95, 1.0]); herb.lathe([[0.075, 0.25], [0.008, 0.2]], 7, 0);
  const hmItem = World.skinPack.add(hm), herbItem = World.skinPack.add(herb);
  const pick = (id, item, p, label, itemId, glow) => { const obj = addSkinned(item, { c: p, r: 0.6, zone: 0 }); R.boneData.set(m4.translate(m4.create(), p[0], p[1], p[2]), obj.slot * 256); const it = { kind: 'pickup', id, item: itemId, p: [p[0], p[1] + 0.2, p[2]], r: 1.9, zone: 0, obj, label }; World.interact.push(it); World.pickups.push(it); if (glow) { it.em = { type: 'herb', p, zone: 0 }; World.emitters.push(it.em); } };
  pick('hammer', hmItem, World.pickupSpot.hammer, 'Take the hammer', 'hammer');
  [[-3.5, 93.5], [-57, -47], [45, -57], [5.5, -91], [84, -42], [-46, 63], [12, -98], [-30, 40]].forEach((p, i) => pick('frostcap' + i, herbItem, [p[0], World.groundY(p[0], p[1]), p[1]], 'Pick frostcap', 'frostcap', true));
}

// place every villager where the clock says they should be
function npcSnapAll() { for (const n of NPCS) { const row = npcRow(n), sp = Array.isArray(row[1]) ? row[1][0] : row[1]; npcArrive(n, sp, row[2]); n.goal = sp; } }
function npcRow(n) {
  const sc = n.override || n.def.sched; let h = Env.hour; if (h < sc[0][0]) h += 24;
  let row = sc[sc.length - 1]; for (const r of sc) if (r[0] <= h) row = r;
  return row;
}
function npcArrive(n, spotName, anim) {
  const sp = World.spots[spotName]; if (!sp) { console.warn('missing spot', spotName); return; }
  n.pos = sp.p.slice(); n.yaw = sp.yaw; n.at = spotName; n.path = null; n.spot = sp;
  n.anim = sp.lie ? 'lie' : sp.sit ? 'sit' : (anim === 'sit' || anim === 'lie') ? 'idle' : anim;
}
function npcUpdate(dt, playerPos) {
  for (const n of NPCS) {
    n.t += dt;
    const dPlayer = hyp(n.pos[0] - playerPos[0], n.pos[2] - playerPos[2]);
    if (!n.talking) {
      const row = npcRow(n);
      let target = row[1];
      if (Array.isArray(target)) {            // wandering between a few spots
        if (n.wRow !== row) { n.wRow = row; n.wIdx = Math.max(0, target.indexOf(n.at)); }
        if (!n.path && n.at === target[n.wIdx]) { if (n.dwell > 0) n.dwell -= dt; else n.wIdx = (n.wIdx + 1) % target.length; }
        target = target[n.wIdx];
      }
      if (n.goal !== target) {
        const wasAt = !n.path && !!n.at;
        const from = n.path ? n.path[Math.min(n.pi, n.path.length - 1)] : Nav.spot[n.at], to = Nav.spot[target];
        const path = from !== undefined && to !== undefined ? navPath(from, to) : null;
        n.goal = target; n.rowAnim = row[2];
        if (path && path.length > 1) { n.path = path; n.pi = wasAt ? 1 : 0; n.at = null; }
        else npcArrive(n, target, row[2]);
      }
      if (n.path) {
        const run = n.def.run, sp = (run ? 2.7 : 1.35) * (0.9 + n.scale * 0.1), N2 = Nav.nodes[n.path[n.pi]];
        const dx = N2[0] - n.pos[0], dz = N2[2] - n.pos[2], d = hyp(dx, dz);
        const blocked = dPlayer < 0.75 && (playerPos[0] - n.pos[0]) * dx + (playerPos[2] - n.pos[2]) * dz > 0;
        if (d < 0.18) { n.pi++; if (n.pi >= n.path.length) { npcArrive(n, n.goal, n.rowAnim); n.dwell = Array.isArray(row[1]) ? 3 + Math.random() * 7 : 0; } }
        else if (!blocked) {
          const st = Math.min(d, sp * dt); n.pos[0] += dx / d * st; n.pos[2] += dz / d * st;
          const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 0.6); n.pos[1] += clamp(gy - n.pos[1], -3 * dt, 3 * dt); if (Math.abs(gy - n.pos[1]) > 1.2) n.pos[1] = gy;
          n.yaw += angDiff(Math.atan2(dx, -dz), n.yaw) * Math.min(1, dt * 8);
          n.anim = run ? 'run' : 'walk'; n.t += dt * (run ? 7.5 : 5.2) * (1 / n.scale) - dt;
        } else n.anim = 'idle';
      }
    }
    // head follows the player when close
    let lx = 0, ly = 0;
    if (dPlayer < 5.5 && n.anim !== 'lie' && n.anim !== 'hammer' && n.anim !== 'work') { const a = angDiff(Math.atan2(playerPos[0] - n.pos[0], -(playerPos[2] - n.pos[2])), n.yaw); if (Math.abs(a) < 1.9) { lx = clamp(-a, -1.1, 1.1); ly = clamp((n.pos[1] + 1.6 * n.scale - playerPos[1] - 1.6) * 0.25, -0.3, 0.3); } }
    n.look[0] += (lx - n.look[0]) * Math.min(1, dt * 5); n.look[1] += (ly - n.look[1]) * Math.min(1, dt * 5);
    // pose
    const anim = n.talking ? (n.anim === 'sit' || n.anim === 'lie' ? n.anim : 'talk') : n.anim;
    const dy = poseAngles(n.ang, anim, n.t, 1, n.look), root = POSE.root, s = n.scale;
    m4.ident(root); m4.translate(root, n.pos[0], n.pos[1], n.pos[2]);
    if (anim === 'lie') { m4.rotY(root, -(n.yaw + PI)); m4.translate(root, 0, 0.12 * s, -0.9 * s); m4.rotX(root, PI / 2); }
    else { m4.rotY(root, -n.yaw); m4.translate(root, 0, dy * s + (anim === 'sit' ? ((n.spot && n.spot.sit) || 0.46) + 0.09 - 0.96 * s : 0), 0); }
    m4.scale(root, s, s, s);
    poseWrite(n.obj.slot, root, n.ang);
    const o = n.obj; o.c = [n.pos[0], n.pos[1] + 0.9, n.pos[2]]; o.visible = dPlayer < 170 && !n.ch;
    const zn = World.zoneAt(n.pos[0], n.pos[1] + 0.5, n.pos[2]); R.boneData[o.slot * 256 + 240] = zn; R.boneData[o.slot * 256 + 241] = zn ? 0.34 : 1;
    if (n.ch) Chars.update(n.ch, { pos: n.pos, yaw: n.yaw, anim: n.anim, scale: s, zone: zn, light: zn ? 0.34 : 1, visible: dPlayer < 95, cast: dPlayer < 32, look: n.look, talking: n.talking, seatHeight: n.spot && n.spot.sit, speed: n.anim === 'run' ? 2.7 * (0.9 + s * 0.1) : n.anim === 'walk' ? 1.35 * (0.9 + s * 0.1) : 0 }, dt);
  }
  // chickens potter about and scatter when approached
  for (const c of World.chickens) {
    c.t += dt; const dp = hyp(c.pos[0] - playerPos[0], c.pos[2] - playerPos[2]);
    if (dp < 2.2 && c.st !== 'flee') { c.st = 'flee'; c.tt = 1.2; c.yaw = Math.atan2(c.pos[0] - playerPos[0], -(c.pos[2] - playerPos[2])) + (Math.random() - 0.5); c.cluck = true; }
    c.tt -= dt;
    if (c.tt <= 0) { const far = hyp(c.pos[0] - c.home[0], c.pos[2] - c.home[1]) > 4; c.st = Math.random() < 0.45 ? 'walk' : Math.random() < 0.6 ? 'peck' : 'idle'; c.tt = 1 + Math.random() * 2.5; if (c.st === 'walk') c.yaw = far ? Math.atan2(c.home[0] - c.pos[0], -(c.home[1] - c.pos[2])) : Math.random() * TAU; }
    const sp = c.st === 'flee' ? 3.2 : c.st === 'walk' ? 0.6 : 0;
    if (sp) { const nx = c.pos[0] + Math.sin(c.yaw) * sp * dt, nz = c.pos[2] - Math.cos(c.yaw) * sp * dt; if (!World.blockedAt(nx, nz, 0.15)) { c.pos[0] = nx; c.pos[2] = nz; } else c.yaw += 1.5; }
    c.pos[1] = World.groundY(c.pos[0], c.pos[2]);
    const bd = R.boneData, k = c.obj.slot * 256, root = POSE.root, T = POSE.T;
    m4.ident(root); m4.translate(root, c.pos[0], c.pos[1] + (sp ? Math.abs(Math.sin(c.t * 14)) * 0.015 : 0), c.pos[2]); m4.rotY(root, -c.yaw); m4.scale(root, 1.25, 1.25, 1.25);
    bd.set(root, k);
    const peck = c.st === 'peck' ? Math.max(0, Math.sin(c.t * 7)) * 1.1 : sp ? Math.sin(c.t * 14) * 0.12 : Math.sin(c.t * 2 + c.ph) * 0.1;
    m4.copy(T, root); m4.translate(T, 0, 0.24, -0.05); m4.rotX(T, -peck); m4.translate(T, 0, -0.24, 0.05); bd.set(T, k + 16);
    for (const [b, s2] of [[2, 1], [3, -1]]) { m4.copy(T, root); m4.translate(T, 0, 0.15, 0); m4.rotX(T, sp ? Math.sin(c.t * 14) * 0.7 * s2 : 0); m4.translate(T, 0, -0.15, 0); bd.set(T, k + b * 16); }
    c.obj.c = [c.pos[0], c.pos[1] + 0.2, c.pos[2]]; c.obj.visible = dp < 90;
  }
}


// ---- 78_player.js ----
// ───────────────────────── collision, walkable surfaces, the player, input ─────────────────────────
const Col = { grid: new Map(), cell: 4, dyn: [] };
function colBuild() {
  Col.grid.clear();
  for (const c of World.colliders) {
    const r = c.r !== undefined ? c.r : hyp(c.hx, c.hz), cs = Col.cell;
    for (let gz = Math.floor((c.z - r) / cs); gz <= Math.floor((c.z + r) / cs); gz++) for (let gx = Math.floor((c.x - r) / cs); gx <= Math.floor((c.x + r) / cs); gx++) {
      const k = gx * 4096 + gz; let l = Col.grid.get(k); if (!l) Col.grid.set(k, l = []); l.push(c);
    }
  }
}
// push a circle out of one collider; returns true if it moved
function colPush(p, r, c) {
  const dx = p[0] - c.x, dz = p[2] - c.z;
  if (c.r !== undefined) {
    const rr = r + c.r, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) return false;
    const d = Math.sqrt(d2) || 0.001, k = (rr - d) / d; p[0] += dx * k; p[2] += dz * k; return true;
  }
  const lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz;
  if (Math.abs(lx) > c.hx + r || Math.abs(lz) > c.hz + r) return false;
  const qx = clamp(lx, -c.hx, c.hx), qz = clamp(lz, -c.hz, c.hz); let ox = lx - qx, oz = lz - qz;
  const d2 = ox * ox + oz * oz;
  if (d2 > r * r) return false;
  let px, pz;
  if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; px = ox * k; pz = oz * k; }
  else { const ex = c.hx - Math.abs(lx) + r, ez = c.hz - Math.abs(lz) + r; if (ex < ez) { px = ex * (lx < 0 ? -1 : 1); pz = 0; } else { px = 0; pz = ez * (lz < 0 ? -1 : 1); } }
  p[0] += px * c.ax + pz * c.bx; p[2] += px * c.az + pz * c.bz; return true;
}
function colResolve(p, r, feet, head) {
  let hit = false; const cs = Col.cell;
  for (let it = 0; it < 3; it++) {
    let moved = false; const gx0 = Math.floor((p[0] - r) / cs), gx1 = Math.floor((p[0] + r) / cs), gz0 = Math.floor((p[2] - r) / cs), gz1 = Math.floor((p[2] + r) / cs);
    for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
      const l = Col.grid.get(gx * 4096 + gz); if (!l) continue;
      for (const c of l) { if (c.off || head < c.y0 || feet + 0.32 > c.y1) continue; if (colPush(p, r, c)) moved = true; }
    }
    for (const c of Col.dyn) { if (head < c.y0 || feet + 0.32 > c.y1) continue; if (colPush(p, r, c)) moved = true; }
    if (!moved) break; hit = true;
  }
  return hit;
}
World.blockedAt = (x, z, r) => { const l = Col.grid.get(Math.floor(x / Col.cell) * 4096 + Math.floor(z / Col.cell)); if (!l) return false; const p = [x, 0, z]; for (const c of l) if (colPush(p, r, c)) return true; return false; };
// highest walkable surface at (x,z) that is not above maxY (terrain is always a candidate)
World.groundAt = (x, z, maxY) => {
  let best = Terrain.y(x, z);
  for (const f of World.floors) {
    const dx = x - f.x, dz = z - f.z; if (Math.abs(dx) > f.hx + f.hz || Math.abs(dz) > f.hx + f.hz) continue;
    const lx = dx * f.ax + dz * f.az, lz = dx * f.bx + dz * f.bz;
    if (Math.abs(lx) > f.hx || Math.abs(lz) > f.hz) continue;
    const y = f.y2 === undefined ? f.y : lerp(f.y, f.y2, ((f.axis === 'x' ? lx / f.hx : lz / f.hz) + 1) / 2);
    if (y <= maxY && y > best) best = y;
  }
  return best;
};
World.zoneAt = (x, y, z) => { for (const zn of World.zones) { if (Math.abs(x - zn.site.x) > 12 || Math.abs(z - zn.site.z) > 12) continue; const l = worldToSite(zn.site, x, z); if (Math.abs(l[0]) < zn.hw && Math.abs(l[1]) < zn.hd && y > zn.y0 && y < zn.y1) return zn.id; } return 0; };
World.waterAt = (x, z) => { if (hyp(x - LAKE.x, z - LAKE.z) < LAKE.r + 8 && Terrain.y(x, z) < LAKE.y) return LAKE.y; const d = River.dist(x, z, 6); if (d < 6) { const wy = riverY(River.at); if (Terrain.y(x, z) < wy) return wy; } return -999; };

const Player = { pos: [-84, 0, -6.5], vel: [0, 0, 0], yaw: 1.45, pitch: 0.02, eye: 1.66, r: 0.32, onGround: true, bob: 0, bobAmt: 0, step: 0, speed: 0, inWater: 0, surface: 'grass', locked: false, warned: 0 };
const Input = { keys: {}, mx: 0, mz: 0, run: false, lookX: 0, lookY: 0, joy: null, look: null, sens: 1, invertY: false, interact: false, touch: false };

function playerUpdate(dt) {
  const P = Player, I = Input;
  // look
  if (!P.locked) {
    P.yaw += I.lookX; P.pitch = clamp(P.pitch - I.lookY * (I.invertY ? -1 : 1), -1.45, 1.45);
  }
  I.lookX = 0; I.lookY = 0;
  // desired move
  let mx = 0, mz = 0, run = false;
  if (!P.locked) {
    const k = I.keys;
    mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0); mz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    run = !!(k.ShiftLeft || k.ShiftRight);
    if (I.joy) { mx += I.joy.x; mz += -I.joy.y; if (hyp(I.joy.x, I.joy.y) > 0.93) run = true; }
    const l = hyp(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  }
  const feet = P.pos[1], water = World.waterAt(P.pos[0], P.pos[2]), depth = water - feet;
  P.inWater = depth > 0.15 ? depth : 0;
  const maxSp = (run ? 5.4 : 2.9) * (depth > 0.45 ? 0.55 : 1);
  const fx = Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = Math.sin(P.yaw);
  const tx = (fx * mz + rx * mx) * maxSp, tz = (fz * mz + rz * mx) * maxSp, acc = Math.min(1, dt * (P.onGround ? 11 : 2.5));
  P.vel[0] += (tx - P.vel[0]) * acc; P.vel[2] += (tz - P.vel[2]) * acc;
  const sp = hyp(P.vel[0], P.vel[2]); P.speed = sp;
  // integrate in small steps so thin walls can't be tunnelled
  const steps = Math.max(1, Math.ceil(sp * dt / 0.2)), sdt = dt / steps;
  for (let i = 0; i < steps; i++) {
    const nx = P.pos[0] + P.vel[0] * sdt, nz = P.pos[2] + P.vel[2] * sdt, np = [nx, P.pos[1], nz];
    colResolve(np, P.r, P.pos[1], P.pos[1] + 1.75);
    // stay inside the valley and out of deep water
    const rr = hyp(np[0], np[2]);
    if (rr > WORLD_RADIUS) { np[0] *= WORLD_RADIUS / rr; np[2] *= WORLD_RADIUS / rr; if (P.warned <= 0) { P.warned = 8; if (typeof toast === 'function') toast('The wilds beyond Brackenfell are no place to wander alone.'); } }
    const w2 = World.waterAt(np[0], np[2]);
    if (w2 > -900 && w2 - World.groundAt(np[0], np[2], P.pos[1] + 0.6) > 1.12 && w2 - P.pos[1] > 0.9) { np[0] = P.pos[0]; np[2] = P.pos[2]; P.vel[0] *= 0.3; P.vel[2] *= 0.3; }
    P.pos[0] = np[0]; P.pos[2] = np[2];
  }
  P.warned -= dt;
  // ground / gravity
  const gy = World.groundAt(P.pos[0], P.pos[2], P.pos[1] + 0.58);
  if (P.pos[1] > gy + 0.12) { P.vel[1] -= 20 * dt; P.pos[1] += P.vel[1] * dt; P.onGround = false; if (P.pos[1] <= gy) { P.pos[1] = gy; P.onGround = true; if (P.vel[1] < -5 && typeof Audio2 !== 'undefined') Audio2.thud(); P.vel[1] = 0; } }
  else { P.pos[1] += (gy - P.pos[1]) * Math.min(1, dt * 16); P.vel[1] = 0; P.onGround = true; }
  // zone, surface
  const zone = World.zoneAt(P.pos[0], P.pos[1] + 1.0, P.pos[2]);
  World.camZone = zone; World.indoor += ((zone ? 1 : 0) - World.indoor) * Math.min(1, dt * 3.5);
  P.surface = zone ? (World.zones[zone - 1].site.id === 'chapel' ? 'stone' : 'wood') : P.inWater ? 'water' : (P.pos[1] > Terrain.y(P.pos[0], P.pos[2]) + 0.12 ? 'wood' : Terrain.splat(P.pos[0], P.pos[2], 1) > 0.4 ? 'stone' : Terrain.splat(P.pos[0], P.pos[2], 0) > 0.4 ? 'dirt' : 'grass');
  // head bob + footsteps
  const moving = sp > 0.4 && P.onGround; P.bobAmt += ((moving ? 1 : 0) - P.bobAmt) * Math.min(1, dt * 8);
  if (moving) { const prev = P.step; P.step += sp * dt * (sp > 4 ? 0.42 : 0.56); if (Math.floor(prev) !== Math.floor(P.step) && typeof Audio2 !== 'undefined') Audio2.step(P.surface, sp > 4); }
  P.bob = Math.sin(P.step * TAU) * 0.028 * P.bobAmt;
  const cam = R.cam; cam.pos[0] = P.pos[0]; cam.pos[1] = P.pos[1] + P.eye + P.bob - Math.min(P.inWater, 0) * 0; cam.pos[2] = P.pos[2]; cam.yaw = P.yaw + Math.cos(P.step * PI) * 0.0025 * P.bobAmt; cam.pitch = P.pitch;
}

function inputInit(canvas, layer) {
  const I = Input;
  addEventListener('keydown', e => { if (e.repeat) return; I.keys[e.code] = true; if (typeof onKey === 'function') onKey(e); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault(); });
  addEventListener('keyup', e => { I.keys[e.code] = false; });
  addEventListener('blur', () => { I.keys = {}; I.joy = null; I.look = null; });
  document.addEventListener('pointerlockchange', () => { I.plock = document.pointerLockElement === canvas; if (!I.plock && typeof onPointerUnlock === 'function') onPointerUnlock(); });
  addEventListener('mousemove', e => { if (I.plock) { I.lookX += e.movementX * 0.0022 * I.sens; I.lookY += e.movementY * 0.0022 * I.sens; } });
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  const down = e => {
    if (e.pointerType === 'mouse') { if (!I.plock && game.playing && !Player.locked) { I.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; if (canvas.requestPointerLock) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { } } } return; }
    I.touch = true; e.preventDefault();
    if (!game.playing || Player.locked) return;
    const left = e.clientX < innerWidth * 0.42;
    if (left && !I.joyT) { I.joyT = { id: e.pointerId, x: e.clientX, y: e.clientY }; I.joy = { x: 0, y: 0 }; stick.style.display = 'block'; stick.style.left = e.clientX + 'px'; stick.style.top = e.clientY + 'px'; knob.style.transform = 'translate(-50%,-50%)'; }
    else if (!I.look) I.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const move = e => {
    if (I.joyT && e.pointerId === I.joyT.id) { const R0 = 54; let dx = (e.clientX - I.joyT.x) / R0, dy = (e.clientY - I.joyT.y) / R0; const l = hyp(dx, dy); if (l > 1) { dx /= l; dy /= l; } I.joy = { x: Math.abs(dx) < 0.1 ? 0 : dx, y: Math.abs(dy) < 0.1 ? 0 : dy }; knob.style.transform = `translate(calc(-50% + ${dx * R0}px), calc(-50% + ${dy * R0}px))`; }
    else if (I.look && e.pointerId === I.look.id) { I.lookX += (e.clientX - I.look.x) * 0.0052 * I.sens; I.lookY += (e.clientY - I.look.y) * 0.0052 * I.sens; I.look.x = e.clientX; I.look.y = e.clientY; }
    else if (I.drag && e.pointerId === I.drag.id && !I.plock) { I.lookX += (e.clientX - I.drag.x) * 0.004 * I.sens; I.lookY += (e.clientY - I.drag.y) * 0.004 * I.sens; I.drag.x = e.clientX; I.drag.y = e.clientY; }
  };
  const up = e => { if (I.joyT && e.pointerId === I.joyT.id) { I.joyT = null; I.joy = null; stick.style.display = 'none'; } if (I.look && e.pointerId === I.look.id) I.look = null; if (I.drag && e.pointerId === I.drag.id) I.drag = null; };
  layer.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  layer.addEventListener('contextmenu', e => e.preventDefault());
  for (const ev of ['touchstart', 'touchmove', 'gesturestart']) layer.addEventListener(ev, e => e.preventDefault(), { passive: false });
}


// ---- 80_game.js ----
// ───────────────────────── story: state, quests, dialogue, things you can do ─────────────────────────
const S = { gold: 6, items: {}, q: {}, flags: {}, opened: {}, picked: {} };
const ITEMS = {
  malt: ['Sack of malt', 'Osric’s malted barley, bound for the Honeyed Hart.'],
  hammer: ['Cross-peen hammer', 'Brandt’s favourite. The handle is worn smooth.'],
  frostcap: ['Frostcap', 'A pale blue flower that glows faintly at dusk.'],
  rope: ['Hemp rope', 'Thirty feet, well laid. Strong enough for a bell.'],
  ale: ['Honeyed ale', 'Greta’s recipe. Warms more than the hands.'],
  knife: ['Traveller’s knife', 'Forged by Brandt as thanks. Keen and plain.'],
  tonic: ['Maren’s tonic', 'Keeps the mountain chill from your bones.'],
  apple: ['Apple', 'Crisp, from the valley orchards.'],
  bread: ['Rye loaf', 'Still a little warm.'],
};
const QUESTS = {
  welcome: { name: 'A Stranger at the Gate', stages: ['Speak to the guard at the gate', 'Find Greta at the Honeyed Hart, the inn on the square'] },
  ale: { name: 'Ale for the Hart', stages: ['Fetch the malt from Osric at the mill, east over the bridge', 'Carry the malt back to Greta'] },
  hammer: { name: 'The Smith’s Hammer', stages: ['Ask the boy Tobin about the hammer', 'Search the Old Watchtower on the northern crag', 'Return the hammer to Brandt'] },
  herbs: { name: 'Frostcaps for Maren', stages: ['Gather five frostcaps around the valley', 'Bring the frostcaps to Maren'] },
  bell: { name: 'The Silent Bell', stages: ['Buy a rope from Marta at Quill’s Sundries', 'Take the rope to Brother Aldous at the chapel', 'Ring the bell under the chapel tower'] },
  fire: { name: 'The Harvest Fire', stages: ['Speak with Elder Rowan', 'Light the fire pit in the square'] },
};
const QORDER = ['welcome', 'ale', 'hammer', 'herbs', 'bell', 'fire'];
const qAt = id => { const q = S.q[id]; return !q ? -1 : q.done ? 99 : q.stage; };
const has = (id, n) => (S.items[id] || 0) >= (n || 1);
function give(id, n) { S.items[id] = (S.items[id] || 0) + (n || 1); if (S.items[id] <= 0) delete S.items[id]; }
function gold(n) { S.gold += n; if (n > 0) { toast('+' + n + ' gold'); Audio2.coin(); } uiPurse(); }
function qStart(id, stage) { if (S.q[id]) return; S.q[id] = { stage: stage || 0, done: false, t: Date.now() }; banner('Quest begun', QUESTS[id].name); Audio2.quest(0); uiObjective(); save(); }
function qStage(id, n) { const q = S.q[id]; if (!q || q.done || q.stage >= n) return; q.stage = n; q.t = Date.now(); toast('<b>' + QUESTS[id].name + '</b> ' + QUESTS[id].stages[n]); Audio2.quest(1); uiObjective(); save(); }
function qDone(id) { const q = S.q[id]; if (!q || q.done) return; q.done = true; banner('Quest complete', QUESTS[id].name); Audio2.quest(2); uiObjective(); save(); }
const frostN = () => S.items.frostcap || 0;
const allHelped = () => ['ale', 'hammer', 'herbs', 'bell'].every(id => qAt(id) === 99);
// where the compass should point for each active quest
function questTarget(id) {
  const st = qAt(id), npc = n => NPC[n] && NPC[n].pos;
  if (id === 'welcome') return st === 0 ? npc('hale') : npc('greta');
  if (id === 'ale') return st === 0 ? npc('osric') : npc('greta');
  if (id === 'hammer') return st === 0 ? npc('tobin') : st === 1 ? [SITE.tower.x, 0, SITE.tower.z] : npc('brandt');
  if (id === 'herbs') { if (st === 1) return npc('maren'); let best = null, bd = 1e9; for (const p of World.pickups) { if (p.item !== 'frostcap' || p.gone) continue; const d = hyp(p.p[0] - Player.pos[0], p.p[2] - Player.pos[2]); if (d < bd) { bd = d; best = p.p; } } return best; }
  if (id === 'bell') return st === 0 ? npc('marta') : st === 1 ? npc('aldous') : World.bell.p;
  if (id === 'fire') return st === 0 ? npc('rowan') : [World.bonfirePos[0], 0, World.bonfirePos[1]];
  return null;
}

// ── dialogue. each villager returns { t: text, o: [[label, next, isQuest]] }; next is a function returning another node, or null to end ──
const bye = ['Farewell.', null];
const node = (t, o) => ({ t, o: o && o.length ? o : [bye] });
const TALK = {
  hale() {
    if (qAt('welcome') <= 0) { if (qAt('welcome') < 0) qStart('welcome'); return node('Hold there, traveller. Brackenfell is a quiet place and I mean to keep it so. But you have the look of the road on you: tired, and honest enough. Greta at the Honeyed Hart keeps a bed for folk like you. Straight down this road to the square. It’s the tall house with the lantern.', [['Thank you. I’ll find her.', () => { qStage('welcome', 1); return null; }, 1], ['What is this place?', () => { qStage('welcome', 1); return TALK.haleAbout(); }]]); }
    if (qAt('fire') === 99) return node('You lit the harvest fire. I never thought to see it burn again. You’re one of us now, whether you like it or not.');
    return node('Road’s quiet. Just how I like it.', [['Tell me about Brackenfell.', TALK.haleAbout], ['What’s the ruin on the hill?', () => node('The old watchtower, up the crag to the north-east. It held a beacon once. Burned out before my grandfather’s day. Children dare each other up there, though they swear to me they don’t.')], bye]);
  },
  haleAbout: () => node('Last village before the Greyspine passes. Sixty souls, one inn, one forge, and a chapel bell that no longer rings. Mind the river. The Stonewater is colder than she looks, and she doesn’t give back what she takes.'),
  greta() {
    if (qAt('ale') < 0) {
      if (qAt('welcome') < 0) qStart('welcome', 1);
      return node('Well now, a new face! Hale sent you? Then you’re welcome under this roof. There’s a bed up the stairs, by the window. It’s yours while you stay. But I’ll ask a kindness in return. Osric at the mill owes me a sack of malt, and I can’t brew on promises. Fetch it for me?', [['I’ll fetch your malt.', () => { qDone('welcome'); S.flags.bed = 1; qStart('ale'); return node('You’re a treasure. Over the bridge east of the square, then follow the river downstream. You’ll hear the wheel before you see it.'); }, 1]]);
    }
    if (qAt('ale') === 0) return node('The mill is over the bridge east of the square, then down the river. Osric will know what I’m owed.', TALK.gretaMenu());
    if (qAt('ale') === 1 && has('malt')) return node('That’s the malt! Oh, bless you. There’ll be ale by week’s end. Here, for your trouble, and a bottle of the last batch.', [['Glad to help.', () => { give('malt', -1); give('ale'); gold(25); qDone('ale'); return node('If you’ve a mind to stay useful: Brandt has been storming about since his hammer went missing, old Maren is short of frostcaps, and Brother Aldous frets over that silent bell of his. And the Elder likes company, out under the oak.'); }, 1]]);
    return node(qAt('fire') === 99 ? 'The whole village in my hall, and the fire lit in the square. I could weep. Sit, drink!' : 'What can I get you, love?', TALK.gretaMenu());
  },
  gretaMenu: () => [['A mug of honeyed ale. (2 gold)', () => { if (S.gold < 2) return node('It’s two gold, love, and your purse is light. Help a few folk around the village and come back.'); gold(-2); S.flags.warm = 1; Audio2.drink(); return node('Warm, and sweet with heather honey. The room feels friendlier already.'); }], ['Tell me about the inn.', () => node('Three generations of Barleybrooks have kept this hearth. The beams came down from the beacon forest, and the recipe for the ale came from my gran, who took it from a traveller in trade for a night’s lodging. So you see, I’ve a soft spot for strangers.')], ['Where can I rest?', () => node(S.flags.bed ? 'Up the stairs at the back, the bed by the window. Sleep as late as you like.' : 'Do me one small favour first and there’s a bed in it for you.')], bye],
  osric() {
    if (qAt('ale') === 0) return node('Greta’s malt! I’d clean forgot, what with the wheel groaning all week. Here, take it, and tell her the next sack is on me. I’d carry it myself, but the stones won’t dress themselves.', [['I’ll see she gets it.', () => { give('malt'); toast('Received: Sack of malt'); qStage('ale', 1); return null; }, 1]]);
    return node('Mind the dust. A mill is no place for a naked flame, or a fool.', [['How does the mill work?', () => node('The Stonewater turns my wheel, the wheel turns the stones, and the stones feed the valley. Simple as bread. Listen: you can hear her running true.')], bye]);
  },
  brandt() {
    const st = qAt('hammer');
    if (st < 0) return node('Unless you’ve come to tell me where my hammer is, I’ve work to do. My best cross-peen, gone from the bench three days back. And that boy Tobin can’t look me in the eye.', [['I’ll find your hammer.', () => { qStart('hammer'); return node('Hm. Start with the boy. He’s always underfoot in the square, when he should be at the bellows.'); }, 1], bye]);
    if (has('hammer')) return node('That’s her! Where was she? The watchtower? I’ll tan his... no. No, I was a boy once, and that tower was a castle then too. Take this. I made it for no one in particular, and it seems that was you.', [['Thank you, Brandt.', () => { give('hammer', -1); give('knife'); gold(30); qDone('hammer'); return null; }, 1]]);
    if (st === 99) return node('She rings true again. Hear that? That’s the sound of a village with a working forge.', [['Tell me about your work.', TALK.brandtAbout], bye]);
    return node(st === 0 ? 'Find the boy. Tobin. Fair hair, guilty face.' : 'The watchtower, he said? Up the crag past the chapel. Mind your footing.', [['Tell me about your work.', TALK.brandtAbout], bye]);
  },
  brandtAbout: () => node('Iron from the Greyspine, charcoal from the pine, water from the Stonewater. Everything in this valley was made within sight of it. That’s rarer than you’d think.'),
  tobin() {
    if (qAt('hammer') === 0) return node('The hammer? I, um. I only borrowed it! I was playing knights up at the old watchtower, and then it got dark, and I ran, and... I left it by the fire ring. Please don’t tell him it was me.', [['Your secret’s safe. Mostly.', () => { qStage('hammer', 1); return null; }, 1]]);
    return node(qAt('hammer') === 99 ? 'He wasn’t even cross! Well. He was a bit cross.' : 'Bet you can’t beat me to the well!', [['What do you want to be, Tobin?', () => node('A smith, like Brandt. I’m going to forge a sword as tall as Warden Hale. Taller!')], bye]);
  },
  maren() {
    const st = qAt('herbs');
    if (st < 0) return node('Hm. Young eyes. Good. The frost came early and my stores are thin. I need frostcaps: pale blue, and they glow a little at dusk. They grow where it is cold and quiet. By the lake, at the forest’s edge, near old stones. Bring me five.', [['I’ll look for them.', () => { qStart('herbs'); if (frostN() >= 5) qStage('herbs', 1); return null; }, 1], bye]);
    if (st !== 99 && frostN() >= 5) return node('Five, and not one bruised! You have gentle hands. Take this tonic. It will keep the mountain chill from your bones.', [['Thank you, Maren.', () => { give('frostcap', -5); give('tonic'); gold(25); qDone('herbs'); return null; }, 1]]);
    if (st === 0) return node('You have ' + frostN() + ' of five. Keep looking where it is cold and quiet.', [bye]);
    return node('Sixty winters in this valley. I have buried more secrets in that garden than turnips.', [['What are frostcaps for?', () => node('Fevers, mostly. And grief, a little, though I don’t tell them that’s what’s in the tea.')], bye]);
  },
  aldous() {
    const st = qAt('bell');
    if (st < 0) return node('The peace of the Dawn upon you. Forgive the quiet. Our bell rope rotted through at midsummer, and I have neither the coin nor the knees to replace it. A village without its bell is a body without a voice.', [['I’ll find you a rope.', () => { qStart('bell'); if (has('rope')) qStage('bell', 1); return node('Would you? Marta keeps good hemp at her shop on the square. The Dawn remembers a kindness.'); }, 1], bye]);
    if (st <= 1 && has('rope')) return node('Hemp, and well laid! Give me one moment in the tower... there. It is done. Would you ring it? It ought to be a friend who rings it first.', [['I’d be honoured.', () => { give('rope', -1); if (st === 0) qStage('bell', 1); qStage('bell', 2); return null; }, 1]]);
    if (st === 0) return node('Marta keeps good hemp rope at her shop on the square, east side.', [bye]);
    if (st === 2) return node('The rope hangs under the tower, by the door. Pull, and let the valley hear.', [bye]);
    return node('Listen. The valley has its voice again.', [['What is the Dawn?', () => node('Only that the night ends. Every night, without fail. We find that worth a small stone house and a bell.')], bye]);
  },
  marta() {
    return node('Quill’s Sundries. If I don’t have it, you don’t need it.', [['Hemp rope. (15 gold)', () => TALK.buy('rope', 15, 'Thirty feet of the best. Don’t hang anything you can’t lift.'), qAt('bell') === 0 && !has('rope')], ['A rye loaf. (3 gold)', () => TALK.buy('bread', 3, 'Baked this morning. Mostly.')], ['An apple. (1 gold)', () => TALK.buy('apple', 1, 'From Edda’s trees. Sweetest in the valley.')], ['Any news?', () => node('I trade with the lowland caravans twice a year. The rest of the time I trade in gossip, and the price is always fair.')], bye]);
  },
  buy(id, cost, line) { if (S.gold < cost) return node('That’s ' + cost + ' gold, dear, and you have ' + S.gold + '. Greta or Brandt might have paying work.'); gold(-cost); give(id); toast('Bought: ' + ITEMS[id][0]); if (id === 'rope' && qAt('bell') === 0) qStage('bell', 1); save(); return node(line, [['Something else.', TALK.marta], bye]); },
  rowan() {
    if (qAt('fire') === 99) return node('Brackenfell remembers its friends. Stay as long as you like. Stay for good, if the road will let you.');
    if (qAt('fire') >= 0 || allHelped()) {
      if (qAt('fire') < 0) qStart('fire');
      return node('The inn has its ale, the forge its hammer, Maren her remedies, and the bell its voice. Do you know how long it has been since Brackenfell was whole? We used to light a fire in the square at harvest’s end, and the whole valley would come. Light it tonight. You have earned the tinder.', [['I will light it.', () => { qStage('fire', 1); return null; }, 1]]);
    }
    const left = [['ale', 'Greta needs her malt'], ['hammer', 'Brandt has lost his hammer'], ['herbs', 'Maren wants frostcaps'], ['bell', 'the Dawn bell is silent']].filter(x => qAt(x[0]) !== 99).map(x => x[1]);
    return node('Sit a while. An old man’s stories are all the entertainment this square can afford.', [['Tell me a story.', () => node('Before the bell there was the beacon on the crag, and before the beacon, only the stars. We have always found some way to say: here we are. Come and find us.')], ['How can I help the village?', () => node(qAt('welcome') < 99 && qAt('ale') < 0 ? 'Begin with Greta at the inn. Everything in Brackenfell begins there.' : 'There are troubles enough: ' + left.join(', ') + '. Mend those, and come back to me.')], bye]);
  },
  edda: () => node('Wheat’s in, mostly. Chickens are out, always.', [['Is this your farm?', () => node('Fairweather land, five generations. The soil is thin and the summers short, but the bread tastes of it. If you see Bram dawdling at the market, tell him the barn won’t sweep itself.')], bye]),
  finn: () => node('Shh. You’ll scare the char.', [['Any luck today?', () => node('Mirrormere gives what she gives. She’s deep in the middle, mind. Deeper than the watchtower is tall, they say. Oh, and there’s one of Maren’s blue flowers on the shore yonder, if you’re collecting.')], bye]),
  lark: () => node('A song for the traveller? I know nine. Seven of them are sad.', [['Play something.', () => { Audio2.luteRequest = 12; return node('This one’s called “The Road Goes Ever Up.” It isn’t about anything. The good ones never are.'); }], ['What brought you here?', () => node('I came for one night, two winters ago. Greta’s ale is a kind of gravity.')], bye]),
  wren: () => node('You walk loud.', [['Seen any frostcaps?', () => node('Forest edge, north-west of the gate. Another on the rocks above the river, north of the bridge. And one past my cabin, where the ground stays cold. Don’t trample them.')], ['What do you hunt?', () => node('Hare. Grouse. Silence, mostly.')], bye]),
  pip: () => node('Have you seen a chicken? Not for any reason.', [['What are you up to?', () => node('My mum sells cloth and says I have to stay where she can see me. So I’m going to be a knight. Or a chicken farmer. I haven’t decided.')], bye]),
  ivo: () => node('Patrol’s quiet. Keep to the roads after dark, friend.', [['How old is the bridge?', () => node('Stonewater Bridge? Older than the village. Older than the chapel. Whoever built it meant for something to be on the other side.')], bye]),
  hilda: () => node('Wool from the high pastures, dyed with Maren’s roots. Feel that. Go on.', [['It’s lovely work.', () => node('It keeps us fed. And if my Pip offers to sell you a chicken, it isn’t hers.')], bye]),
  bram: () => node('Apples! Cabbages! Oh. Sorry. Habit.', [['An apple, please. (1 gold)', () => { if (S.gold < 1) return node('Not a coin? Go on, then. Don’t tell Edda.', [['Thanks, Bram.', () => { give('apple'); toast('Received: Apple'); return null; }]]); gold(-1); give('apple'); toast('Bought: Apple'); return node('Best in the valley. Only in the valley, mind, but still.'); }], bye]),
};

// ── interactions ──
function interactLabel(it) {
  if (it.npc) { const w = it.npc.name.split(' '); return 'Talk to ' + (['Old', 'Brother', 'Elder', 'Warden', 'Guardsman'].includes(w[0]) ? w[1] : w[0]); }
  if (it.kind === 'chest') return S.opened[it.id] ? null : 'Open chest';
  if (it.kind === 'pickup') return it.gone ? null : it.label;
  if (it.kind === 'read') return 'Read';
  if (it.kind === 'bed') return 'Sleep';
  if (it.kind === 'bell') return qAt('bell') >= 2 ? 'Ring the bell' : null;
  if (it.kind === 'shopitem') return 'Hemp rope';
  if (it.kind === 'bonfire') return qAt('fire') === 1 ? 'Light the harvest fire' : null;
  return null;
}
function interactUse(it) {
  if (it.npc) { if (it.npc.anim === 'lie') return toast(it.npc.name + ' is fast asleep.'); return startTalk(it.npc); }
  if (it.kind === 'chest') {
    S.opened[it.id] = 1; Audio2.chest();
    const got = []; for (const [id, n] of it.loot || []) { if (id === 'gold') { S.gold += n; got.push(n + ' gold'); } else { give(id, n); got.push((n > 1 ? n + ' × ' : '') + ITEMS[id][0]); } }
    toast('Found: ' + got.join(', ')); uiPurse(); save();
  } else if (it.kind === 'pickup') {
    it.gone = true; it.obj.visible = false; if (it.em) it.em.gone = true; S.picked[it.id] = 1; give(it.item); Audio2.pickup();
    if (it.item === 'frostcap') { toast('Frostcap gathered (' + Math.min(frostN(), 5) + ' of 5)'); if (qAt('herbs') === 0 && frostN() >= 5) qStage('herbs', 1); }
    else { toast('Taken: ' + ITEMS[it.item][0]); if (it.item === 'hammer') { if (qAt('hammer') < 0) qStart('hammer', 2); else qStage('hammer', 2); } }
    save();
  } else if (it.kind === 'read') openReader(it.title, it.text);
  else if (it.kind === 'bed') {
    if (!S.flags.bed) return toast('This bed isn’t yours. Greta at the bar lets rooms.');
    fadeDo(() => { Env.hour = 7; World.festival = false; for (const n of NPCS) n.override = null; npcSnapAll(); toast('You wake rested. A new morning in Brackenfell.'); save(); });
  } else if (it.kind === 'bell') { Audio2.bell(1); World.bellSwing = 3; if (qAt('bell') === 2) { qDone('bell'); S.flags.bell = 1; toast('The Dawn bell rings out over the valley.'); } }
  else if (it.kind === 'shopitem') toast('Marta: “Fifteen gold, dear. Ask me at the counter.”');
  else if (it.kind === 'bonfire') lightHarvestFire();
}
function lightHarvestFire() {
  fadeDo(() => {
    Env.hour = 19.55; World.bonfire = true; S.flags.fire = 1; World.festival = true;
    NPCS.forEach((n, i) => { const sp = 'fire.' + i; if (!World.spots[sp]) return; n.override = [[0, sp, n.id === 'lark' ? 'lute' : (i % 3 === 0 ? 'cheer' : 'idle')]]; npcArrive(n, sp, n.override[0][2]); n.goal = sp; });
    Player.pos[0] = World.bonfirePos[0] + 1.5; Player.pos[2] = World.bonfirePos[1] + 8.5; Player.yaw = -0.17; Player.pitch = 0.05;
    qDone('fire'); Audio2.luteRequest = 60;
    setTimeout(() => banner('Brackenfell', 'You are home'), 2600);
  });
}
function festivalSpots() {
  const b = World.bonfirePos;
  NPC_DEFS.forEach((d, i) => { const a = i / NPC_DEFS.length * TAU + 0.2, r = 4.3 + (i % 3) * 0.9, x = b[0] + Math.cos(a) * r, z = b[1] + Math.sin(a) * r; World.spots['fire.' + i] = { p: [x, World.groundY(x, z), z], yaw: headingTo(x, z, b[0], b[1]), zone: 0 }; });
  World.interact.push({ p: [b[0], World.groundY(b[0], b[1]) + 0.8, b[1]], r: 3.0, zone: 0, kind: 'bonfire', id: 'bonfire' });
}
// ── saving (a convenience only: one browser, may be unavailable) ──
function save() { try { localStorage.setItem('brackenfell.v1', JSON.stringify({ S, hour: Env.hour, pos: Player.pos, yaw: Player.yaw })); } catch (e) { } }
function loadSave() { try { const j = JSON.parse(localStorage.getItem('brackenfell.v1') || 'null'); return j && j.S ? j : null; } catch (e) { return null; } }
function applySave(j) {
  Object.assign(S, j.S); Env.hour = j.hour || 9.5; if (j.pos) { Player.pos = j.pos; Player.yaw = j.yaw || 0; }
  for (const p of World.pickups) if (S.picked[p.id]) { p.gone = true; p.obj.visible = false; if (p.em) p.em.gone = true; }
  if (S.flags.fire) World.bonfire = true;
}
function clearSave() { try { localStorage.removeItem('brackenfell.v1'); } catch (e) { } }


// ---- 85_ui.js ----
// ───────────────────────── HUD, dialogue, journal ─────────────────────────
const $ = id => document.getElementById(id);
const UI = { talk: null, menu: false, reader: false, prompt: null, compass: [], seen: {}, placeT: 0, lastYaw: 9, lastObj: '' };
function toast(html) { const d = document.createElement('div'); d.innerHTML = html; $('toasts').appendChild(d); setTimeout(() => d.remove(), 5300); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
function banner(small, big) { const p = $('place'); p.innerHTML = '<small>' + small + '</small>' + big; p.classList.add('on'); clearTimeout(UI.placeT); UI.placeT = setTimeout(() => p.classList.remove('on'), 3800); }
function fadeDo(fn) { const f = $('fade'); f.classList.add('on'); Player.locked = true; setTimeout(() => { fn(); setTimeout(() => { f.classList.remove('on'); Player.locked = uiBusy(); }, 350); }, 950); }
const uiBusy = () => !!(UI.talk || UI.menu || UI.reader);
function uiPurse() { $('purse').textContent = S.gold + ' gold'; }
function uiObjective() {
  let h = ''; const act = QORDER.filter(id => S.q[id] && !S.q[id].done).sort((a, b) => S.q[b].t - S.q[a].t).slice(0, 3);
  for (const id of act) { let st = QUESTS[id].stages[S.q[id].stage]; if (id === 'herbs' && S.q[id].stage === 0) st += ' (' + Math.min(frostN(), 5) + ' of 5)'; h += '<div><b>' + QUESTS[id].name + '</b>' + st + '</div>'; }
  if (h !== UI.lastObj) { $('objective').innerHTML = h; UI.lastObj = h; }
}
function releaseLook() { if (document.pointerLockElement) document.exitPointerLock(); Input.joy = null; Input.joyT = null; Input.look = null; $('stick').style.display = 'none'; }
// ── dialogue ──
function startTalk(npc) {
  UI.talk = npc; npc.talking = true; Player.locked = true; releaseLook();
  npc.yawBefore = npc.yaw; if (npc.anim !== 'sit' && npc.anim !== 'lie') npc.yaw = headingTo(npc.pos[0], npc.pos[2], Player.pos[0], Player.pos[2]);
  $('dname').textContent = npc.name; $('dialog').hidden = false; $('act').hidden = true;
  showNode((TALK[npc.id] || (() => node('...')))()); Audio2.ui();
}
function showNode(n) {
  if (!n) return endTalk();
  $('dtext').textContent = n.t; const box = $('dopts'); box.textContent = '';
  n.o.forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o[0]; if (o[2]) b.className = 'quest'; b.onclick = () => { Audio2.ui(); showNode(o[1] ? o[1]() : null); }; box.appendChild(b); if (i === 0 && !Input.touch) setTimeout(() => b.focus(), 30); });
}
function endTalk() { const n = UI.talk; if (n) { n.talking = false; if (n.path) n.yaw = n.yawBefore; } UI.talk = null; $('dialog').hidden = true; Player.locked = uiBusy(); uiObjective(); }
function openReader(title, text) { UI.reader = true; Player.locked = true; releaseLook(); $('rtitle').textContent = title; $('rtext').textContent = text; $('reader').hidden = false; Audio2.page(); }
function closeReader() { UI.reader = false; $('reader').hidden = true; Player.locked = uiBusy(); }
// ── journal / pack / settings ──
function openMenu(tab) {
  UI.menu = true; Player.locked = true; releaseLook(); $('menu').hidden = false; showTab(tab || 'journal'); Audio2.page();
  let h = ''; for (const id of QORDER) { const q = S.q[id]; if (!q) continue; h += '<h3>' + QUESTS[id].name + '</h3>'; QUESTS[id].stages.forEach((s, i) => { if (i < q.stage || q.done) h += '<p class="done">' + s + '</p>'; else if (i === q.stage) h += '<p>' + s + (id === 'herbs' && i === 0 ? ' (' + Math.min(frostN(), 5) + ' of 5)' : '') + '</p>'; }); }
  $('tab-journal').innerHTML = h || '<p class="empty">Nothing yet. Speak with the guard at the gate.</p>';
  let p = '<div class="items"><div><b>' + S.gold + ' gold</b><span>Coin of the valley.</span></div>'; for (const id in S.items) p += '<div><b>' + ITEMS[id][0] + (S.items[id] > 1 ? ' × ' + S.items[id] : '') + '</b><span>' + ITEMS[id][1] + '</span></div>';
  $('tab-pack').innerHTML = p + '</div>'; $('setTime').value = Env.hour;
  const inf = G.gpuName || ''; $('diag').textContent = 'Build 6 \u00b7 ' + G.backend + (G.gfxWhy ? ' (' + G.gfxWhy.slice(0, 90) + ')' : '') + (G.chars ? '' : ' \u00b7 old villagers') + ' \u00b7 textures ' + (G.pack || '?') + (G.packNote ? ' (' + G.packNote.slice(0, 60) + ')' : '') + (inf ? ' (' + inf + ')' : '') + ' \u00b7 ' + G.w + ' \u00d7 ' + G.h + ' at ' + Math.round(R.scale * 100) + '% \u00b7 detail ' + game.tier + (Perf.T > 20 ? ' \u00b7 browser cap ' + Math.round(1000 / Perf.T) + ' fps' : '') + (G.errors.length ? ' \u00b7 ' + G.errors.length + ' warnings: ' + G.errors[0].slice(0, 160) : '');
}
function showTab(t) { for (const b of $('tabs').querySelectorAll('[data-tab]')) { const on = b.dataset.tab === t; b.classList.toggle('on', on); $('tab-' + b.dataset.tab).hidden = !on; } }
function closeMenu() { UI.menu = false; $('menu').hidden = true; Player.locked = uiBusy(); saveSettings(); }
function saveSettings() { try { localStorage.setItem('brackenfell.set', JSON.stringify({ q: game.qualitySetting, sens: Input.sens, vol: Audio2.vol, music: Audio2.musicVol, inv: Input.invertY, fps: game.showFps, flow: Env.dayLength })); } catch (e) { } }
function loadSettings() { try { const j = JSON.parse(localStorage.getItem('brackenfell.set') || 'null'); if (!j) return; if (j.q) game.qualitySetting = j.q; Input.sens = j.sens || 1; Audio2.vol = j.vol === undefined ? 0.8 : j.vol; Audio2.musicVol = j.music === undefined ? 0.6 : j.music; Input.invertY = !!j.inv; game.showFps = !!j.fps; if (j.flow !== undefined) Env.dayLength = j.flow; } catch (e) { } }
function uiInit() {
  const tr = $('ctrack');
  for (const [l, a, minor] of [['N', 0], ['NE', 45, 1], ['E', 90], ['SE', 135, 1], ['S', 180], ['SW', 225, 1], ['W', 270], ['NW', 315, 1]]) { const s = document.createElement('span'); s.textContent = l; if (minor) s.className = 'minor'; tr.appendChild(s); UI.compass.push({ el: s, a: a * PI / 180 }); }
  UI.marks = []; for (let i = 0; i < 4; i++) { const m = document.createElement('span'); m.className = 'mark'; const d = document.createElement('span'); d.className = 'dist'; tr.appendChild(m); tr.appendChild(d); UI.marks.push({ el: m, d }); }
  $('act').addEventListener('click', e => { e.preventDefault(); if (UI.prompt && !Player.locked) interactUse(UI.prompt); });
  $('menuBtn').addEventListener('click', () => openMenu()); $('mclose').addEventListener('click', closeMenu); $('rclose').addEventListener('click', closeReader);
  for (const b of $('tabs').querySelectorAll('[data-tab]')) b.addEventListener('click', () => showTab(b.dataset.tab));
  $('setQuality').value = game.qualitySetting; $('setSens').value = Input.sens; $('setVol').value = Audio2.vol; $('setMusic').value = Audio2.musicVol; $('setInvert').checked = Input.invertY; $('setFps').checked = game.showFps; $('setFlow').value = String(Env.dayLength);
  $('setQuality').addEventListener('change', e => { game.qualitySetting = e.target.value; game.applyQuality(); });
  $('setGfx').value = G.backend === 'WebGPU' ? 'webgpu' : 'webgl'; $('setGfx').addEventListener('change', e => { saveSettings(); try { if (game.playing) save(); } catch (er) { } gfxPrefer(e.target.value); });
  $('setSens').addEventListener('input', e => { Input.sens = +e.target.value; });
  $('setVol').addEventListener('input', e => { Audio2.vol = +e.target.value; });
  $('setMusic').addEventListener('input', e => { Audio2.musicVol = +e.target.value; });
  $('setTime').addEventListener('input', e => { Env.hour = +e.target.value % 24; });
  $('setTime').addEventListener('change', () => npcSnapAll());
  $('setFlow').addEventListener('change', e => { Env.dayLength = +e.target.value; });
  $('setInvert').addEventListener('change', e => { Input.invertY = e.target.checked; });
  $('setFps').addEventListener('change', e => { game.showFps = e.target.checked; $('fps').hidden = !game.showFps; });
  $('resetBtn').addEventListener('click', () => { clearSave(); location.reload(); });
  $('fps').hidden = !game.showFps;
}
function onKey(e) {
  if (!game.playing) return;
  const c = e.code;
  if (UI.talk) { if (c === 'Escape') endTalk(); const n = +e.key; if (n >= 1 && n <= 9) { const b = $('dopts').children[n - 1]; if (b) b.click(); } return; }
  if (UI.reader) { if (c === 'Escape' || c === 'KeyE' || c === 'Enter') closeReader(); return; }
  if (UI.menu) { if (c === 'Escape' || c === 'Tab' || c === 'KeyJ') closeMenu(); return; }
  if (c === 'KeyE' || c === 'KeyF' || c === 'Enter') { if (UI.prompt) interactUse(UI.prompt); }
  else if (c === 'Tab' || c === 'KeyJ') openMenu('journal'); else if (c === 'KeyI') openMenu('pack');
}
function onPointerUnlock() { if (game.playing && !uiBusy() && !Input.touch && !TEST) openMenu('settings'); }
// per-frame HUD: prompt, compass, clock, place names
function uiFrame(dt) {
  const P = Player;
  // nearest thing to use, in front of the player
  let best = null, bs = -1e9; const fx = Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch), ex = P.pos[0], ey = P.pos[1] + P.eye, ez = P.pos[2];
  if (!P.locked) {
    const test = (it, p, r) => { const dx = p[0] - ex, dy = p[1] - ey, dz = p[2] - ez, d = hyp(dx, dy, dz); if (d > r) return; const dot = (dx * fx + dy * fy + dz * fz) / (d || 1); if (dot < 0.35 && d > 0.9) return; const sc = dot * 2 - d * 0.35; if (sc > bs && interactLabel(it)) { bs = sc; best = it; } };
    for (const it of World.interact) { if (it.zone !== undefined && it.zone !== World.camZone && it.zone !== 0 && World.camZone !== 0) continue; test(it, it.p, it.r || 2); }
    for (const n of NPCS) { if (!n.io) n.io = { npc: n }; if (hyp(n.pos[0] - ex, n.pos[2] - ez) < 3.2) test(n.io, [n.pos[0], n.pos[1] + (n.anim === 'lie' ? 0.3 : n.anim === 'sit' ? 1.0 : 1.35 * n.scale), n.pos[2]], 2.9); }
  }
  if (best !== UI.prompt) { UI.prompt = best; const a = $('act'); a.hidden = !best; if (best) { $('actLabel').textContent = interactLabel(best); $('actKey').textContent = Input.touch ? '•' : 'E'; } }
  // compass
  if (Math.abs(P.yaw - UI.lastYaw) > 0.002 || (R.frame & 15) === 0) {
    UI.lastYaw = P.yaw; const W = $('compass').clientWidth || 300, span = 1.9;
    for (const c of UI.compass) { const d = angDiff(c.a, P.yaw); c.el.style.display = Math.abs(d) < span / 2 ? '' : 'none'; c.el.style.left = (50 + d / span * 100) + '%'; }
    let k = 0;
    for (const id of QORDER) { if (!S.q[id] || S.q[id].done || k >= UI.marks.length) continue; const t = questTarget(id); if (!t) continue; const m = UI.marks[k++], d = clamp(angDiff(headingTo(ex, ez, t[0], t[2]), P.yaw), -span * 0.44, span * 0.44), dist = hyp(t[0] - ex, t[2] - ez); m.el.style.display = ''; m.d.style.display = ''; m.el.style.left = m.d.style.left = (50 + d / span * 100) + '%'; m.d.textContent = dist < 4 ? '' : Math.round(dist) + ' m'; }
    for (; k < UI.marks.length; k++) { UI.marks[k].el.style.display = 'none'; UI.marks[k].d.style.display = 'none'; }
  }
  if ((R.frame & 31) === 0) { const h = Math.floor(Env.hour), m = Math.floor((Env.hour - h) * 60 / 10) * 10; const part = Env.hour < 5 ? 'Night' : Env.hour < 8 ? 'Dawn' : Env.hour < 12 ? 'Morning' : Env.hour < 17 ? 'Afternoon' : Env.hour < 20.5 ? 'Dusk' : 'Night'; $('clock').textContent = part + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); uiObjective();
    for (const pl of World.places) { if (UI.seen[pl.id] || hyp(pl.x - ex, pl.z - ez) > pl.r) continue; UI.seen[pl.id] = 1; if (game.clock > 4) banner('Discovered', pl.name); break; } }
}


// ---- 88_audio.js ----
// ───────────────────────── sound: everything is synthesised with Web Audio ─────────────────────────
const Audio2 = {
  ctx: null, vol: 0.8, musicVol: 0.6, luteRequest: 0, t: { bird: 2, cricket: 0, crackle: 0, pad: 1, lute: 0, owl: 20 }, luteStep: 0, chord: 0, hammerK: 0, lastHour: -1,
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const c = this.ctx = new AC(), o = this;
      o.master = c.createGain(); o.master.gain.value = 0;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; o.master.connect(comp); comp.connect(c.destination);
      o.sfx = c.createGain(); o.sfx.connect(o.master); o.music = c.createGain(); o.music.connect(o.master);
      // shared noise + a synthetic hall for the bell and the music
      const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; o.noise = nb;
      const ir = c.createBuffer(2, c.sampleRate * 2.6, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }
      o.rev = c.createConvolver(); o.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = 0.55; o.rev.connect(rg); rg.connect(o.master);
      // continuous beds: wind, water, fire, crickets
      const bed = (type, f, q) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(o.sfx); s.start(); return { g, fl }; };
      o.wind = bed('bandpass', 420, 0.5); o.water = bed('bandpass', 1100, 0.7); o.fire = bed('lowpass', 420, 0.6);
      const cr = c.createOscillator(); cr.frequency.value = 4300; const cg = c.createGain(); cg.gain.value = 0; const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 31; const lg = c.createGain(); lg.gain.value = 0; lfo.connect(lg); lg.connect(cg.gain); cr.connect(cg); cg.connect(o.sfx); cr.start(); lfo.start(); o.crick = lg;
    } catch (e) { this.ctx = null; }
  },
  // enveloped oscillator
  tone(f, dur, vol, type, dest, f2, delay, attack) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + (attack || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, vol, type, f, q, dest, delay, f2) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0), s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q || 0.7;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 1.5, dur + 0.05);
  },
  pluck(f, vol, delay, long) { const d = long || 0.9; this.tone(f, d, vol, 'triangle', this.lutebus, null, delay, 0.004); this.tone(f * 2.003, d * 0.5, vol * 0.35, 'sine', this.lutebus, null, delay, 0.003); this.tone(f * 3.01, d * 0.22, vol * 0.18, 'sine', this.lutebus, null, delay, 0.002); },
  step(surface, run) {
    if (!this.ctx) return; const v = run ? 0.16 : 0.10, j = 0.85 + Math.random() * 0.3;
    if (surface === 'wood') { this.burst(0.09, v * 1.3, 'lowpass', 420 * j, 1.2); this.burst(0.03, v * 0.5, 'bandpass', 1900 * j, 2); }
    else if (surface === 'stone') { this.burst(0.05, v * 0.9, 'bandpass', 2300 * j, 1.5); this.burst(0.08, v * 0.7, 'lowpass', 500, 1); }
    else if (surface === 'water') { this.burst(0.22, v * 1.2, 'bandpass', 1400 * j, 0.8, null, 0, 600); }
    else if (surface === 'dirt') { this.burst(0.07, v, 'lowpass', 1300 * j, 0.8); }
    else { this.burst(0.11, v * 0.9, 'bandpass', 3200 * j, 0.6); this.burst(0.06, v * 0.6, 'lowpass', 600, 0.8); }
  },
  thud() { this.burst(0.18, 0.3, 'lowpass', 260, 1); },
  ui() { this.tone(880, 0.06, 0.04, 'triangle'); },
  page() { this.burst(0.16, 0.06, 'highpass', 2500, 0.5); },
  coin() { this.tone(2400, 0.12, 0.05, 'sine'); this.tone(3200, 0.2, 0.04, 'sine', null, null, 0.05); },
  pickup() { this.tone(520, 0.12, 0.07, 'triangle', null, 780); this.tone(1040, 0.18, 0.04, 'sine', null, null, 0.07); },
  chest() { this.burst(0.25, 0.1, 'bandpass', 500, 2, null, 0, 900); this.tone(140, 0.3, 0.08, 'sawtooth', null, 190); },
  drink() { for (let i = 0; i < 3; i++) this.tone(300 + i * 60, 0.09, 0.05, 'sine', null, 200, i * 0.16); },
  door(vol) { if (!this.ctx) return; this.tone(95, 0.42, 0.045 * vol, 'sawtooth', null, 150); this.burst(0.3, 0.02 * vol, 'bandpass', 700, 4, null, 0, 1200); },
  cluck(vol) { this.tone(700, 0.07, 0.06 * vol, 'square', null, 420); this.tone(760, 0.09, 0.05 * vol, 'square', null, 400, 0.12); },
  clang(vol) { if (!this.ctx) return; for (const [f, d] of [[1870, 0.35], [2790, 0.28], [4150, 0.2], [5630, 0.12]]) this.tone(f * (0.99 + Math.random() * 0.02), d, 0.05 * vol, 'sine'); this.burst(0.03, 0.12 * vol, 'highpass', 3000, 0.5); },
  quest(k) { const n = k === 0 ? [293.7, 440, 587.3] : k === 1 ? [440, 587.3] : [293.7, 370, 440, 587.3, 740]; n.forEach((f, i) => { this.tone(f, 1.6, 0.07, 'triangle', this.rev, null, i * 0.13, 0.01); this.tone(f, 0.5, 0.05, 'sine', null, null, i * 0.13); }); },
  bell(vol) { if (!this.ctx) return; const f0 = 196; for (const [m, d, a] of [[0.5, 7, 0.25], [1, 6, 0.5], [1.19, 4.5, 0.3], [1.5, 3.8, 0.25], [2, 3.2, 0.3], [2.51, 2.4, 0.16], [3.01, 1.8, 0.12], [4.1, 1.2, 0.08]]) { this.tone(f0 * m, d, 0.16 * a * vol, 'sine', this.rev, null, 0, 0.004); this.tone(f0 * m, d * 0.7, 0.10 * a * vol, 'sine', null, null, 0, 0.004); } this.burst(0.05, 0.1 * vol, 'bandpass', 2600, 1); },
  // called every frame with the listener's surroundings
  update(dt, st) {
    const c = this.ctx; if (!c || c.state !== 'running') return; const o = this, now = c.currentTime, T = o.t;
    o.master.gain.setTargetAtTime(st.playing ? o.vol : o.vol * 0.5, now, 0.3);
    const out = 1 - st.indoor;
    o.wind.g.gain.setTargetAtTime((0.035 + 0.05 * st.wind + st.height * 0.05) * (0.25 + 0.75 * out), now, 0.6); o.wind.fl.frequency.setTargetAtTime(300 + 300 * st.wind - 120 * st.indoor, now, 0.8);
    o.water.g.gain.setTargetAtTime(0.15 * st.water * (0.3 + 0.7 * out), now, 0.4);
    o.fire.g.gain.setTargetAtTime(0.16 * st.fire, now, 0.3);
    o.crick.gain.setTargetAtTime(0.012 * st.night * out, now, 1);
    T.crackle -= dt; if (st.fire > 0.05 && T.crackle <= 0) { T.crackle = 0.04 + Math.random() * 0.35; o.burst(0.02 + Math.random() * 0.04, 0.12 * st.fire * Math.random(), 'highpass', 1500 + Math.random() * 3000, 0.7); }
    T.bird -= dt; if (T.bird <= 0) { T.bird = 1.5 + Math.random() * 6; if (st.day > 0.4 && out > 0.3) { const f = 2400 + Math.random() * 2600, n = 2 + Math.floor(Math.random() * 5), v = 0.022 * out * (0.4 + Math.random() * 0.6); for (let i = 0; i < n; i++) o.tone(f * (1 + (Math.random() - 0.5) * 0.25), 0.07 + Math.random() * 0.07, v, 'sine', null, f * (0.8 + Math.random() * 0.5), i * (0.09 + Math.random() * 0.05)); } }
    T.owl -= dt; if (T.owl <= 0) { T.owl = 18 + Math.random() * 30; if (st.night > 0.7 && out > 0.5) { o.tone(410, 0.5, 0.03, 'sine', o.rev, 380, 0, 0.08); o.tone(360, 0.8, 0.035, 'sine', o.rev, 330, 0.7, 0.1); } }
    // the smith's hammer, the bell on the hour
    if (st.hammer >= 0) { const k = (st.hammer * 0.9) % 1; if (o.hammerK < 0.66 && k >= 0.66 && st.hammerDist < 60) o.clang(clamp(1.3 - st.hammerDist / 45, 0.05, 1) * (st.indoor ? 0.4 : 1)); o.hammerK = k; }
    const hr = Math.floor(st.hour); if (hr !== o.lastHour) { if (o.lastHour >= 0 && st.bellOn && (hr === 6 || hr === 12 || hr === 18)) o.bell(clamp(1.1 - st.bellDist / 160, 0.15, 0.8)); o.lastHour = hr; }
    // music: a soft drone of slow chords outdoors, and Lark's lute wherever Lark is
    if (!o.lutebus) { o.lutebus = c.createGain(); o.lutelp = c.createBiquadFilter(); o.lutelp.type = 'lowpass'; o.lutebus.connect(o.lutelp); o.lutelp.connect(o.music); const s = c.createGain(); s.gain.value = 0.5; o.lutelp.connect(s); s.connect(o.rev); o.padbus = c.createGain(); o.padbus.connect(o.rev); const pd = c.createGain(); pd.gain.value = 0.35; o.padbus.connect(pd); pd.connect(o.music); }
    o.music.gain.setTargetAtTime(o.musicVol, now, 0.3);
    o.luteRequest = Math.max(0, o.luteRequest - dt);
    const playing = st.lute || o.luteRequest > 0, lv = playing ? clamp(1.25 - st.luteDist / 26, 0, 1) * (st.luteWall ? 0.45 : 1) : 0;
    o.lutebus.gain.setTargetAtTime(lv * 0.9, now, 0.4); o.lutelp.frequency.setTargetAtTime(st.luteWall ? 900 : 5200, now, 0.4);
    T.lute -= dt;
    if (playing && lv > 0.02 && T.lute <= 0) {
      const scale = [146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440], mel = [7, 9, 10, 9, 7, 6, 4, 6, 7, 11, 10, 9, 7, 6, 7, -1, 4, 6, 7, 6, 4, 3, 2, 3, 4, 7, 6, 4, 3, 2, 0, -1], bass = [0, 0, 3, 3, 4, 4, 0, 0];
      const i = o.luteStep++ % mel.length, beat = 0.27; T.lute = beat;
      if (mel[i] >= 0) o.pluck(scale[mel[i]], 0.10, 0.02 + Math.random() * 0.012, 1.1);
      if (i % 4 === 0) o.pluck(scale[bass[(i / 4) % 8]] / 2, 0.11, 0.02, 1.6); else if (i % 4 === 2) o.pluck(scale[bass[Math.floor(i / 4) % 8] + 4] / 2, 0.05, 0.02, 0.9);
    }
    T.pad -= dt;
    if (T.pad <= 0) {
      T.pad = 9 + Math.random() * 5; const chords = [[146.83, 220, 349.23], [130.81, 196, 329.63], [116.54, 174.61, 293.66], [174.61, 261.63, 349.23], [146.83, 220, 293.66], [110, 164.81, 261.63]], ch = chords[o.chord++ % chords.length];
      const v = 0.05 * out * (playing && lv > 0.2 ? 0 : 1) * (st.playing ? 1 : 1.4) * (0.6 + 0.4 * st.night);
      if (v > 0.004) ch.forEach((f, k) => { for (const det of [0.997, 1.003]) { const os = c.createOscillator(), g = c.createGain(); os.type = k === 0 ? 'triangle' : 'sine'; os.frequency.value = f * det * (st.night > 0.5 && k === 2 ? 2 : 1); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(v / (k + 1.2), now + 4.5); g.gain.linearRampToValueAtTime(0.0001, now + 13); os.connect(g); g.connect(o.padbus); os.start(now); os.stop(now + 13.2); } });
    }
  },
};


// ---- 99_main.js ----
// ───────────────────────── boot, main loop, adaptive quality ─────────────────────────
const game = { time: 0, clock: 0, playing: false, qualitySetting: 'auto', showFps: false, tier: 'high', ready: false };
window.__game = game;
window.__gpuErrors = () => G.errors;
const Perf = { ft: 16.7, T: 16.7, hold: 3, ceil: 1, ceilT: 0, lowT: 0, acc: 0, n: 0, fps: 60, probeN: 0, probeBuf: [], probeAt: -99, fastT: 0, capT: 0, first: 0 };
const coarse = () => (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 520;

function resize() {
  const c = G.canvas, pr = Math.min(window.devicePixelRatio || 1, R.q.pr);
  gfxResize(Math.round(c.clientWidth * pr), Math.round(c.clientHeight * pr));
}
game.applyQuality = async () => {
  let tier = game.qualitySetting;
  if (tier === 'auto') tier = game.autoTier || (coarse() ? 'medium' : 'high');
  if (tier === game.tier && R.P) return;
  game.tier = tier; R.busy = true;
  try { await setQuality(tier); } catch (e) { console.warn('quality', tier, e); G.errors.push('quality ' + tier + ': ' + (e && e.message)); if (tier !== 'low') { game.tier = 'low'; game.autoTier = 'low'; await setQuality('low'); } else throw e; }
  resize(); R.busy = false;
};
// Browsers sometimes hold a page to 30 callbacks a second (Low Power Mode, a warm phone, an embedded frame nobody has
// touched yet). Lowering detail cannot buy that back, so before giving anything up we time a few callbacks with no drawing.
function cadenceProbe() { const P = Perf; P.probeN = 7; P.probeBuf.length = 0; P.probeAt = game.time; }
function cadenceDone() {
  const P = Perf, b = P.probeBuf.slice(2).sort((x, y) => x - y), c = b[b.length >> 1];
  P.T = c < 19 ? 16.7 : Math.min(c, 50); P.ft = P.T; P.hold = 1; P.fastT = 0;
}
// keep the frame rate by trading resolution first, then detail
function perfUpdate(dtMs, dt) {
  const P = Perf; P.ft += (dtMs - P.ft) * 0.06; P.acc += dtMs; P.n++;
  if (P.acc > 500) {
    P.fps = Math.round(1000 * P.n / P.acc); P.acc = 0; P.n = 0;
    if (game.showFps) $('fps').textContent = P.fps + ' fps' + (P.T > 20 ? ' (browser cap)' : '') + '  ' + Math.round(R.scale * 100) + '%  ' + game.tier + '\n' + Math.round(R.stats.tris / 1000) + 'k tris  ' + R.stats.draws + ' draws';
    if (G.errors.length && !game.errSaid) { game.errSaid = true; const m = 'This device reported a graphics error, so the valley may not draw correctly: ' + G.errors[0].slice(0, 260); const n = $('gpuNote'); n.textContent = m; n.hidden = false; if (game.playing) toast(m.slice(0, 190)); }
  }
  if ((TEST && !TEST.loop) || R.busy || document.hidden || !game.playing) return;
  if (P.first > 0) { P.first -= dt; if (P.first <= 0) cadenceProbe(); return; }
  const T = P.T, r = P.ft / T;
  // callbacks arriving faster than the target: the cap has gone
  if (r < 0.8) { P.fastT += dt; if (P.fastT > 1) { P.T = 16.7; P.fastT = 0; P.hold = Math.max(P.hold, 1); } } else P.fastT = 0;
  if (T > 20) {
    P.capT += dt;
    if (P.capT > 6 && !P.capSaid) { P.capSaid = true; toast('The browser is holding this page to ' + Math.round(1000 / T) + ' frames a second. Low Power Mode, a warm phone or an embedded view will do that.'); }
    if (game.time - P.probeAt > (uiBusy() ? 15 : 45)) { cadenceProbe(); return; }
  } else P.capT = 0;
  // a phone that holds full resolution with ease gets one try at the next tier up
  if (game.qualitySetting === 'auto') {
    if (game.tier === 'medium' && !P.triedHigh) { P.goodT = (R.scale >= 1 && r < 1.04) ? (P.goodT || 0) + dt : 0; if (P.goodT > 9) { P.triedHigh = true; P.probeT = 14; game.autoTier = 'high'; game.applyQuality(); } }
    else if (P.probeT > 0) { P.probeT -= dt; if (R.scale < 0.86) { P.probeT = 0; game.autoTier = 'medium'; R.scale = 1; P.hold = 3; game.applyQuality(); } }
  }
  P.hold -= dt; P.ceilT -= dt;
  if (P.hold > 0) return;
  if (r > 1.6 && !P.raised && game.time - P.probeAt > 12) { cadenceProbe(); return; }      // looks like half rate: rule out a cap first
  const q = x => Math.round(clamp(x, 0.5, 1) * 20) / 20;
  if (r > 1.10) {
    if (P.raised) {            // the last step up was one too many: return to what worked, and wait longer each time before trying again
      P.fails = Math.min((P.fails || 0) + 1, 4); R.scale = q(R.scale - 0.05); P.ceil = R.scale; P.ceilT = 40 * (1 << (P.fails - 1)); P.hold = 1.4; P.raised = false;
    } else if (R.scale > 0.5) { R.scale = q(R.scale - (r > 1.26 ? 0.1 : 0.05)); P.hold = r > 1.26 ? 0.9 : 1.4; }
    else P.hold = 0.5;
  }
  else if (r < 1.04 && R.scale < 1 && (P.ceilT <= 0 || R.scale + 0.05 <= P.ceil + 1e-6)) { R.scale = q(R.scale + 0.05); P.hold = 2.2; P.raised = true; }
  else { P.hold = 0.5; if (r < 1.04) P.raised = false; }
  // out of resolution to give: drop a detail tier (auto only). High detail is not worth keeping below 70% resolution.
  const hi = game.tier === 'high';
  if (R.scale <= (hi ? 0.7 : 0.55) + 1e-6 && (hi || r > 1.17)) P.lowT += 1; else P.lowT = Math.max(0, P.lowT - 0.5);
  if (P.lowT > 5 && game.qualitySetting === 'auto' && game.tier !== 'low') { P.lowT = 0; game.autoTier = hi ? 'medium' : 'low'; R.scale = hi ? 0.9 : 0.8; P.hold = 4; P.raised = false; P.triedHigh = true; game.applyQuality(); toast('Detail lowered to keep things smooth.'); }
}
function updateDynamics(dt, chars) {
  const bd = R.boneData, tmp = POSE.S, pp = Player.pos;
  for (const d of World.doors) {
    let near = false;
    for (const c of chars) if (Math.abs(c[0] - d.c[0]) < 2.5 && Math.abs(c[2] - d.c[2]) < 2.5 && Math.abs(c[1] - d.c[1] + 1) < 2.2 && hyp(c[0] - d.c[0], c[2] - d.c[2]) < 2.3) { near = true; break; }
    if (near && d.open === 0 && game.playing) { const dd = hyp(pp[0] - d.c[0], pp[2] - d.c[2]); if (dd < 14) Audio2.door(clamp(1.2 - dd / 12, 0.1, 1)); }
    d.open = clamp(d.open + (near ? dt : -dt) * 2.4, 0, 1);
    if (d.open === d.last) continue; d.last = d.open;
    m4.copy(tmp, d.baseM); m4.rotY(tmp, smooth(0, 1, d.open) * 1.85); m4.mul(tmp, tmp, d.S); bd.set(tmp, d.obj.slot * 256);
  }
  const w = World.millWheel; if (w) { w.angle += dt * 0.5; m4.copy(tmp, w.base); m4.rotZ(tmp, w.angle); bd.set(tmp, w.obj.slot * 256); }
}
function attractCamera(t) {
  const a = t * 0.03 + 2.45, r = 64 + 10 * Math.sin(t * 0.021), cx = 2, cz = -8, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, y = Math.max(Terrain.y(x, z) + 6, 19 + 5 * Math.sin(t * 0.017));
  R.cam.pos = [x, y, z]; R.cam.yaw = headingTo(x, z, cx, cz); R.cam.pitch = -Math.atan2(y - 4, r) * 0.72;
  World.camZone = 0; World.indoor += (0 - World.indoor) * 0.1;
}
function audioState() {
  const p = R.cam.pos, st = game.ast || (game.ast = { fire: 0, water: 0 });
  st.playing = game.playing; st.indoor = World.indoor; st.wind = ENV.windStrength; st.night = ENV.night; st.day = ENV.day; st.hour = Env.hour; st.height = sat((p[1] - 3) / 25);
  if ((R.frame & 7) === 0) {
    let f = 0; for (const e of World.emitters) { if (e.type !== 'fire' && !(e.type === 'bonfire' && World.bonfire)) continue; const d = hyp(e.p[0] - p[0], e.p[1] - p[1], e.p[2] - p[2]); f = Math.max(f, sat(1 - d / (e.type === 'bonfire' ? 22 : 8)) * (e.zone === World.camZone || e.zone === 0 ? 1 : 0.35)); } st.fire = f;
    const wd = River.dist(p[0], p[2], 30), ld = hyp(p[0] - LAKE.x, p[2] - LAKE.z) - LAKE.r, md = World.millPos ? hyp(p[0] - World.millPos[0], p[2] - World.millPos[2]) : 99;
    st.water = Math.max(sat(1 - wd / 26) * 0.8, sat(1 - ld / 20) * 0.35, sat(1 - md / 18));
  }
  const b = NPC.brandt; st.hammer = b && b.anim === 'hammer' && !b.talking ? b.t : -1; st.hammerDist = b ? hyp(b.pos[0] - p[0], b.pos[2] - p[2]) : 999;
  const l = NPC.lark; st.lute = !!(l && l.anim === 'lute' && !l.talking); st.luteDist = l ? hyp(l.pos[0] - p[0], l.pos[2] - p[2]) : 999; st.luteWall = !!l && World.zoneAt(l.pos[0], l.pos[1] + 1, l.pos[2]) !== World.camZone;
  st.bellOn = !!S.flags.bell; st.bellDist = World.bell ? hyp(World.bell.p[0] - p[0], World.bell.p[2] - p[2]) : 999;
  for (const c of World.chickens) if (c.cluck) { c.cluck = false; Audio2.cluck(clamp(1.2 - hyp(c.pos[0] - p[0], c.pos[2] - p[2]) / 8, 0, 1)); }
  return st;
}
function tick(dt) {
  game.time += dt;
  if (game.playing) game.clock += dt;
  if (Env.dayLength > 0 && !UI.menu && game.playing) Env.hour = (Env.hour + dt * 24 / Env.dayLength) % 24;
  // villagers are obstacles too
  Col.dyn.length = 0; const pp = Player.pos, chars = [pp];
  for (const n of NPCS) { chars.push(n.pos); if (n.anim !== 'lie' && Math.abs(n.pos[0] - pp[0]) < 4 && Math.abs(n.pos[2] - pp[2]) < 4) Col.dyn.push({ x: n.pos[0], z: n.pos[2], r: 0.27 * n.scale, y0: n.pos[1] - 0.3, y1: n.pos[1] + 1.7 }); }
  if (game.playing) playerUpdate(dt); else attractCamera(game.time);
  npcUpdate(dt, game.playing ? pp : R.cam.pos);
  updateDynamics(dt, chars);
  World.bonfire = !!S.flags.fire && (Env.hour > 19 || Env.hour < 2);
  if (World.festival && Env.hour > 23.4 && Env.hour < 23.9) { World.festival = false; for (const n of NPCS) n.override = null; }
  const env = updateEnv(game.time, World.indoor); env.time = game.time;
  fxUpdate(dt, game.time, env, R.cam.pos);
  if (game.playing) uiFrame(dt);
  Audio2.update(dt, audioState());
  return env;
}
let lastT = 0;
function frame(tms) {
  requestAnimationFrame(frame);
  if (G.lost) return;
  const dtMs = Math.min(tms - lastT, 100); lastT = tms;
  if (dtMs <= 0 || document.hidden) return;
  if (Perf.probeN > 0) { Perf.probeBuf.push(dtMs); if (--Perf.probeN === 0) cadenceDone(); return; }
  try {
    const env = tick(dtMs / 1000);
    perfUpdate(dtMs, dtMs / 1000);
    if (!R.busy) renderFrame(game.time, env);
  } catch (e) { if (!game.crashed) { game.crashed = true; console.error(e); G.errors.push(String(e && e.stack || e)); } }
  // WebGPU that reports errors (or throws) in its first seconds of drawing will not get better: switch this device to WebGL 2
  if (!G.gfxChecked) { if (!G.tDraw) G.tDraw = tms; if (G.errors.length) { G.gfxChecked = true; gfxFallback(G.errors[0]); } else if (tms - G.tDraw > 12000) G.gfxChecked = true; }
}
function onDeviceLost() {
  $('title').classList.remove('gone'); $('startRow').hidden = true; $('bar').hidden = true; $('loadText').textContent = 'The graphics device was lost. Reloading to return to Brackenfell.';
  if (TEST) return;
  try { if (game.playing && typeof save === 'function') save(); } catch (e) { }
  let n = 1; try { n = (+sessionStorage.getItem('brackenfell.lost') || 0) + 1; sessionStorage.setItem('brackenfell.lost', String(n)); } catch (e) { }
  // lost while starting up, or for the second time: this device and WebGPU do not get along, so come back on WebGL 2
  if ((performance.now() - (G.t0 || 0) < 30000 || n >= 2) && gfxFallback('graphics device lost')) return;
  if (n > 3) { $('loadText').textContent = 'The graphics device keeps being lost. Reload the page to try again.'; return; }
  const again = () => { if (!document.hidden) location.reload(); };
  if (document.hidden) document.addEventListener('visibilitychange', again); else setTimeout(again, 1200);
}
function startGame(cont) {
  Audio2.start();
  const sv = cont && loadSave(); if (sv) applySave(sv); else { clearSave(); }
  npcSnapAll(); uiPurse(); uiObjective();
  game.playing = true; Perf.first = 0.45; Perf.ft = Perf.T = 16.7; Perf.hold = 3; R.scale = 1; $('title').classList.add('gone'); $('hud').hidden = false; Player.pos[1] = World.groundAt(Player.pos[0], Player.pos[2], Player.pos[1] + 50);
  if (!Input.touch && !coarse() && !TEST) { try { const p = G.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  setTimeout(() => { banner('The Greyspine Valley', 'Brackenfell'); }, 900);
  if (!sv) setTimeout(() => { if (qAt('welcome') < 0) qStart('welcome'); }, 5200);
}
(async function boot() {
  const load = (t, f) => { $('loadText').textContent = t; $('barFill').style.width = Math.round(f * 100) + '%'; return new Promise(r => setTimeout(r, TEST ? 0 : 30)); };
  let t0 = performance.now(); const laps = game.laps = {}, lap = n => { const t = performance.now(); laps[n] = Math.round(t - t0); t0 = t; };
  try {
    loadSettings();
    const canvas = $('view');
    try { await gfxInit(canvas); }
    catch (e) { $('bar').hidden = true; $('loadText').textContent = 'Brackenfell could not start 3D graphics in this browser. Try a current Chrome, Edge or Safari.'; console.warn(e); G.errors.push(String(e && e.stack || e)); window.__ready = true; return; }
    gfxResize(G.canvas.clientWidth, G.canvas.clientHeight);
    await load('Mixing lime, straw and river stone', 0.06);
    const lowMem = (navigator.deviceMemory || 8) <= 3;
    $('loadText').textContent = 'Unpacking stone, timber and thatch (about 35 MB the first time)';
    await loadNoise();
    await loadPack(lowMem, f => { $('barFill').style.width = Math.round(6 + f * 32) + '%'; }); lap('pack');
    SH.init();
    // animated villagers; if their files cannot be loaded the old hand-built bodies stand in
    $('loadText').textContent = 'Dressing the villagers';
    if (typeof Chars !== 'undefined' && !(TEST && TEST.oldBodies)) { try { await Chars.load('quaternius', f => { $('barFill').style.width = Math.round(38 + f * 4) + '%'; }); G.chars = true; } catch (e) { console.warn('villager models unavailable: ' + (e && e.message || e)); G.charsNote = String(e && e.message || e); } }
    lap('chars');
    if (typeof kitBoot === 'function') await kitBoot(f => { $('loadText').textContent = 'Carting in beams, barrels and roof tiles'; $('barFill').style.width = Math.round(38 + f * 2) + '%'; });
    renderInit();
    await load('Raising the Greyspine', 0.4); buildTerrain(); buildSplat(); buildWater(); lap('terrain');
    await load('Framing timber, laying thatch', 0.55); buildVillage(); lap('village');
    await load('Waking the villagers', 0.68); buildNPCs(); festivalSpots(); lap('npcs');
    await load('Planting pine and birch', 0.76); buildVegetation(); lap('veg');
    World.villagePack.upload('village'); World.skinPack.upload('skin');
    buildSplat2(); colBuild(); navBuild(); fxInit(); lap('nav');
    await load('Lighting the lanterns', 0.88);
    if (TEST && TEST.quality) game.qualitySetting = TEST.quality;
    await game.applyQuality(); lap('pipelines');
    if (typeof kitAttach === 'function') kitAttach();
    if (TEST && TEST.hour !== undefined) Env.hour = TEST.hour;
    npcSnapAll(); uiInit(); inputInit(G.canvas, $('touch'));
    addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 250));
    document.addEventListener('visibilitychange', () => { if (Audio2.ctx) { if (document.hidden) Audio2.ctx.suspend(); else if (game.playing) Audio2.ctx.resume(); } lastT = performance.now(); });
    $('barFill').style.width = '100%'; $('loadText').textContent = ''; $('bar').hidden = true; $('startRow').hidden = false;
    $('hint').textContent = coarse() ? 'Drag on the left to walk, on the right to look. Push the stick all the way to run. Doors open as you walk up to them. Turn your phone sideways for a wider view.' : 'W A S D to walk, mouse to look, Shift to run, E to interact, Tab for your journal. Doors open as you walk up to them.';
    if (loadSave()) $('contBtn').hidden = false;
    $('startBtn').addEventListener('click', () => startGame(false)); $('contBtn').addEventListener('click', () => startGame(true));
    game.ready = true;
    // ── test hooks ──
    game.info = () => ({ tris: World.packs.map(p => p.tris | 0), veg: World.instPack.tris | 0, trees: World.treeCount, lights: World.lights.length, colliders: World.colliders.length, floors: World.floors.length, skinned: World.skinCount, emitters: World.emitters.length, nav: Nav.nodes.length, laps });
        game.step = (n, dt) => { let env; for (let i = 0; i < (n || 1); i++) env = tick(dt || 1 / 30); return env; };
    game.draw = async () => { const env = updateEnv(game.time, World.indoor); env.time = game.time; renderFrame(game.time, env); await gfxCapture(() => renderFrame(game.time, env)); return R.stats; };
    game.tp = (x, z, yawDeg, pitchDeg, y) => { Player.pos = [x, y === undefined ? World.groundAt(x, z, 1e9) : y, z]; Player.vel = [0, 0, 0]; if (yawDeg !== undefined) Player.yaw = yawDeg * PI / 180; Player.pitch = (pitchDeg || 0) * PI / 180; World.indoor = World.zoneAt(x, Player.pos[1] + 1, z) ? 1 : 0; };
    game.shot = async (x, y, z, yaw, pitch, hour) => {
      if (hour !== undefined) { Env.hour = hour; npcSnapAll(); }
      game.playing = false; const save = attractCamera; R.cam.pos = [x, y === null ? Terrain.y(x, z) + 1.65 : y, z]; R.cam.yaw = yaw * PI / 180; R.cam.pitch = (pitch || 0) * PI / 180;
      World.camZone = World.zoneAt(x, R.cam.pos[1], z); World.indoor = World.camZone ? 1 : 0;
      game.time += 0.4; npcUpdate(0.4, R.cam.pos); updateDynamics(0.4, [R.cam.pos].concat(NPCS.map(n => n.pos)));
      const env = updateEnv(game.time, World.indoor); env.time = game.time; World.bonfire = !!S.flags.fire && (Env.hour > 19 || Env.hour < 2);
      fxUpdate(0.4, game.time, env, R.cam.pos); fxUpdate(0.4, game.time, env, R.cam.pos);
      renderFrame(game.time, env); await gfxCapture(() => renderFrame(game.time, env));
      return R.stats;
    };
    if (TEST && !TEST.title) $('title').classList.add('gone');
    if (TEST && TEST.play) startGame(false);
    if (!TEST || TEST.loop) requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
    window.__ready = true;
  } catch (e) {
    console.error(e && e.stack || e);
    // shader and pipeline messages arrive a moment later; show them too so a screenshot of this screen says what failed
    if (gfxFallback('start-up failed: ' + (e && e.message || e))) return;
    const show = () => { $('bar').hidden = true; $('loadText').textContent = 'Something went wrong while building the village: ' + (e && e.message || e) + (G.errors.length ? ' [' + G.errors.slice(0, 2).join(' | ').slice(0, 420) + ']' : ''); };
    show(); setTimeout(show, 900); setTimeout(() => { G.errors.push(String(e && e.stack || e)); }, 1000); window.__ready = true;
  }
})();

