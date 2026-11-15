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

async function gfxInit(canvas) {
  const forceWebGL = !!(TEST && TEST.webgl) || /[?&]webgl\b/.test(location.search);
  const r = new THREE.WebGPURenderer({ canvas, antialias: false, forceWebGL, powerPreference: 'high-performance', reversedDepthBuffer: true });
  await r.init();
  G.renderer = r; G.canvas = canvas;
  G.backend = r.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL 2';
  G.astc = !!r.hasFeature('texture-compression-astc') && !(TEST && TEST.noAstc);
  r.toneMapping = THREE.NoToneMapping;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  r.setPixelRatio(1);
  r.onDeviceLost = info => { G.lost = true; if (typeof onDeviceLost === 'function') onDeviceLost(info); };
  const dev = r.backend.device;
  if (dev && dev.addEventListener) dev.addEventListener('uncapturederror', e => { const msg = (e.error && e.error.message) || String(e.error); if (G.errors.length < 40) G.errors.push(msg); console.error('[gpu]', msg); });
  if (dev && dev.adapterInfo) G.gpuName = [dev.adapterInfo.vendor, dev.adapterInfo.architecture].filter(Boolean).join(' ');
}
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
