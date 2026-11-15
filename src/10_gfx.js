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


// ── texture memory: one place that caps decoded texture size and shares identical images ──
// Uncompressed textures cost width x height x 4 x 1.33 bytes of GPU memory (a 1024 map is 5.3 MB), and a phone's Safari tab is killed long before a
// desktop would notice. Every loader of kit, scanned-prop and character textures passes its textures through gfxTex(), before the first upload.
// Colour maps are capped at GFX_TEX.color, normal / ORM maps at GFX_TEX.data (pixels per side). The cap is lower on phones, low-memory devices and
// the Low and Medium tiers; ?texcap=N or --opt texcap=N overrides it. Textures with the same size and content are uploaded once.
const GFX_TEX = { color: 1024, data: 1024, seen: new Map(), shrunk: 0, shared: 0 };
function gfxTexInit(settingTier) {
  const phone = (typeof window !== 'undefined' && window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 520 || (navigator.deviceMemory || 8) <= 3;
  const small = phone || settingTier === 'low' || settingTier === 'medium';
  const o = TEST && TEST.texcap || +((location.search.match(/[?&]texcap=(\d+)/) || [])[1]) || 0;
  const tiny = settingTier === 'low' || (navigator.deviceMemory || 8) <= 3;
  GFX_TEX.color = o || (small ? 512 : 1024); GFX_TEX.data = o || (tiny ? 256 : small ? 512 : 1024);
}
async function gfxTex(t, kind) {
  if (!t || !t.image) return t;
  const im = t.image, w = im.width || im.naturalWidth || 0, h = im.height || im.naturalHeight || 0; if (!w || !h || t.isCompressedTexture || t.isDataTexture) return t;
  const cap = kind === 'data' ? GFX_TEX.data : GFX_TEX.color;
  if (Math.max(w, h) > cap) {
    const k = cap / Math.max(w, h), nw = Math.max(4, Math.round(w * k)), nh = Math.max(4, Math.round(h * k));
    try { const bmp = await createImageBitmap(im, { resizeWidth: nw, resizeHeight: nh, resizeQuality: 'high', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); if (im.close) im.close(); t.image = bmp; t.needsUpdate = true; GFX_TEX.shrunk++; } catch (e) { }
  }
  // identical content under another name (the same image in two GLB files): keep the first texture object
  try {
    const cw = t.image.width, ch = t.image.height, c = gfxTex.cv || (gfxTex.cv = document.createElement('canvas')); c.width = c.height = 8;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(t.image, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data;
    const key = cw + 'x' + ch + '|' + t.colorSpace + '|' + t.wrapS + '|' + t.flipY + '|' + Array.from(d).join(',');
    const prev = GFX_TEX.seen.get(key); if (prev && prev !== t) { GFX_TEX.shared++; return prev; } GFX_TEX.seen.set(key, t);
  } catch (e) { }
  return t;
}

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
  // test hook: record every texture the backend uploads (window.__texLog: Map texture -> { w, h, mb }); ?texlog or --opt texlog=1
  if (TEST && TEST.texlog) { const be = r.backend, ct = be.createTexture.bind(be), log = window.__texLog = new Map(); be.createTexture = function (t, o) { try { const im = t.image || {}, w = (o && o.width) || im.width || (t.mipmaps && t.mipmaps[0] && t.mipmaps[0].width) || 0, h = (o && o.height) || im.height || 0, d = (o && o.depth) || im.depth || 1; let b = w * h * d * 4 * (t.generateMipmaps === false && !(o && o.levels > 1) ? 1 : 1.33); if (t.isCompressedTexture && t.mipmaps) b = t.mipmaps.reduce((a, m) => a + (m.data ? m.data.byteLength : 0), 0) * (t.isCompressedArrayTexture ? 1 : 1); log.set(t, { name: t.name || t.source && t.source.data && (t.source.data.src || '').slice(-40) || t.constructor.name, w, h, d, mb: b / 1048576, comp: !!t.isCompressedTexture }); } catch (e) { } return ct(t, o); }; }
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
