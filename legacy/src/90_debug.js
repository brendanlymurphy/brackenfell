// ───────────────────────── debug views (test harness only) ─────────────────────────
async function debugTextures(first, cols, rows, rep) {
  const d = G.device;
  const mod = shaderModule(/* wgsl */`
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VSOut; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * vec2f(0.5, -0.5) + 0.5; return o;
}
@group(0) @binding(0) var ta: texture_2d_array<f32>;
@group(0) @binding(1) var tn: texture_2d_array<f32>;
@group(0) @binding(2) var s: sampler;
@group(0) @binding(3) var<uniform> u: vec4f;
@fragment fn fs(i: VSOut) -> @location(0) vec4f {
  let cols = u.x; let rows = u.y;
  let g = i.uv * vec2f(cols, rows);
  let cell = floor(g); let f = fract(g);
  let layer = i32(cell.y * cols + cell.x + u.z);
  let uv = f * u.w;
  let a = textureSampleLevel(ta, s, uv, layer, 0.0);
  let nt = textureSampleLevel(tn, s, uv, layer, 0.0);
  var n = vec3f(nt.xy * 2.0 - 1.0, 0.0); n.z = sqrt(max(1.0 - dot(n.xy, n.xy), 0.0));
  let L = normalize(vec3f(-0.5, -0.6, 0.55));
  let lit = max(dot(n, L), 0.0) * 1.3 + 0.25 * nt.z;
  var c = a.rgb * lit;
  if (true) { c = mix(vec3f(0.9, 0.2, 0.9) * (0.5 + 0.5 * step(0.5, fract((f.x + f.y) * 8.0))), c, a.a); }
  if (f.x < 0.01 || f.y < 0.01) { c = vec3f(0.0); }
  return vec4f(pow(c, vec3f(1.0 / 2.2)), 1.0);
}`, 'dbgtex');
  const pipe = d.createRenderPipeline({ layout: 'auto', vertex: { module: mod, entryPoint: 'vs' }, fragment: { module: mod, entryPoint: 'fs', targets: [{ format: G.fmt }] } });
  const ub = d.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  d.queue.writeBuffer(ub, 0, new Float32Array([cols || 4, rows || 2, first || 0, rep || 1.5]));
  const smp = d.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear', addressModeU: 'repeat', addressModeV: 'repeat' });
  const bg = d.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: G.albedoArr.createView() }, { binding: 1, resource: G.normalArr.createView() }, { binding: 2, resource: smp }, { binding: 3, resource: { buffer: ub } }] });
  const enc = d.createCommandEncoder();
  const p = enc.beginRenderPass({ colorAttachments: [{ view: backbufferView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] });
  p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); p.end();
  d.queue.submit([enc.finish()]);
  if (TEST) await gpuCapture();
}
