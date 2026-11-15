import fs from 'fs'; import vm from 'vm';
const files = ['00_math.js', '10_gpu.js', '20_texgen.js', '30_shaders.js'];
let src = files.map(f => fs.readFileSync('src/' + f, 'utf8')).join('\n');
src += '\n;globalThis.__out = { scene: WGSL_SCENE, shadow: WGSL_SHADOW, post: WGSL_POST, texgen: WGSL_TEXGEN, ao: WGSL_AO };';
const ctx = { console, navigator: {}, performance, GPUBufferUsage: {}, GPUTextureUsage: {} }; ctx.globalThis = ctx;
vm.createContext(ctx); vm.runInContext(src, ctx);
for (const [k, v] of Object.entries(ctx.__out)) { fs.writeFileSync(`wgsl/${k}.wgsl`, v); console.log(k, v.length, 'chars', v.split('\n').length, 'lines'); }
