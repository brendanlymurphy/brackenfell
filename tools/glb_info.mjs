// Prints what a GLB is made of: bytes of textures and of geometry, extensions, texture sizes.   usage: node tools/glb_info.mjs file.glb ...
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready; const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
import fs from 'node:fs';
for (const f of process.argv.slice(2)) { const doc = await io.read(f), root = doc.getRoot(); let tex = 0, dims = {}; for (const t of root.listTextures()) { const im = t.getImage(); tex += im ? im.byteLength : 0; const s = t.getSize(); const k = (s ? s.join('x') : '?') + ' ' + t.getMimeType().split('/')[1]; dims[k] = (dims[k] || 0) + 1; }
  let geo = 0; const seen = new Set(); for (const a of root.listAccessors()) { if (!seen.has(a)) { seen.add(a); geo += a.getArray().byteLength; } }
  console.log(f.split('/').pop(), 'file', (fs.statSync(f).size / 1048576).toFixed(2), 'MB | textures', (tex / 1048576).toFixed(2), '| accessors', (geo / 1048576).toFixed(2), '| ext', root.listExtensionsUsed().map(e => e.extensionName.replace(/^(KHR|EXT)_/, '')).join(','), '|', JSON.stringify(dims)); }
