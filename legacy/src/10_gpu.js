// ───────────────────────── WebGPU device, canvas, helpers ─────────────────────────
const TEST = (typeof window !== 'undefined' && window.__TEST__) || null;
const G = { device: null, ctx: null, canvas: null, fmt: 'bgra8unorm', errors: [], w: 1, h: 1, lost: false };

async function gpuInit(canvas) {
  if (!navigator.gpu) throw new Error('nogpu');
  let adapter = null;
  try { adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }); } catch (e) { }
  if (!adapter) adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('noadapter');
  // compressed textures keep the scanned surfaces small in memory on phones; ask for them only where they exist
  const want = ['texture-compression-astc'].filter(f => adapter.features.has(f) && !(TEST && TEST.noAstc));
  let device;
  try { device = await adapter.requestDevice({ requiredFeatures: want }); } catch (e) { device = await adapter.requestDevice(); }
  G.astc = device.features.has('texture-compression-astc');
  G.device = device; G.adapter = adapter; G.canvas = canvas;
  device.lost.then(info => { G.lost = true; if (typeof onDeviceLost === 'function') onDeviceLost(info); });
  device.addEventListener('uncapturederror', e => {
    const msg = (e.error && e.error.message) || String(e.error);
    if (G.errors.length < 40) G.errors.push(msg);
    console.error('[gpu]', msg);
  });
  if (TEST) { G.fmt = 'rgba8unorm'; G.ctx2d = canvas.getContext('2d'); }
  else {
    G.fmt = navigator.gpu.getPreferredCanvasFormat();
    G.ctx = canvas.getContext('webgpu');
    if (!G.ctx) throw new Error('nocontext');
    G.ctx.configure({ device, format: G.fmt, alphaMode: 'opaque' });
  }
}
function gpuResize(w, h) {
  w = Math.max(16, w | 0); h = Math.max(16, h | 0);
  if (G.canvas.width !== w || G.canvas.height !== h) { G.canvas.width = w; G.canvas.height = h; }
  G.w = w; G.h = h;
  if (TEST) {
    if (G.testTex) G.testTex.destroy();
    G.testTex = G.device.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
  }
}
const backbufferView = () => TEST ? G.testTex.createView() : G.ctx.getCurrentTexture().createView();
// test-mode: read the offscreen backbuffer and paint it on the visible 2D canvas
async function gpuCapture() {
  const d = G.device, w = G.w, h = G.h, bpr = Math.ceil(w * 4 / 256) * 256;
  const buf = d.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const enc = d.createCommandEncoder();
  enc.copyTextureToBuffer({ texture: G.testTex }, { buffer: buf, bytesPerRow: bpr }, [w, h]);
  d.queue.submit([enc.finish()]);
  await buf.mapAsync(GPUMapMode.READ);
  const src = new Uint8Array(buf.getMappedRange()), img = G.ctx2d.createImageData(w, h);
  for (let y = 0; y < h; y++) img.data.set(src.subarray(y * bpr, y * bpr + w * 4), y * w * 4);
  buf.unmap(); buf.destroy();
  G.ctx2d.putImageData(img, 0, 0);
}
function shaderModule(code, label) {
  const m = G.device.createShaderModule({ code, label });
  if (m.getCompilationInfo) m.getCompilationInfo().then(info => {
    for (const msg of info.messages) if (msg.type === 'error') {
      const line = (code.split('\n')[msg.lineNum - 1] || '').trim();
      const s = `[wgsl ${label}:${msg.lineNum}] ${msg.message} :: ${line}`;
      if (G.errors.length < 40) G.errors.push(s);
      console.error(s);
    }
  }).catch(() => { });
  return m;
}
function makeBuffer(data, usage, label) {
  const size = Math.max(16, Math.ceil(data.byteLength / 4) * 4);
  const b = G.device.createBuffer({ size, usage: usage | GPUBufferUsage.COPY_DST, label });
  G.device.queue.writeBuffer(b, 0, data.buffer, data.byteOffset, data.byteLength);
  return b;
}
const U = () => GPUBufferUsage, T = () => GPUTextureUsage;
