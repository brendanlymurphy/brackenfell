// [ch4] prints the meshes, triangles, extents, materials, clips and textures of a GLB: node tools/animals/info.mjs file.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]); const r = doc.getRoot();
for (const n of r.listNodes()) { const m = n.getMesh(); if (!m) continue; let t = 0, mn = [9, 9, 9], mx = [-9, -9, -9]; const mats = []; for (const p of m.listPrimitives()) { t += p.getIndices().getCount() / 3; const a = p.getAttribute('POSITION'); a.getMin([]).forEach((v, i) => mn[i] = Math.min(mn[i], v)); a.getMax([]).forEach((v, i) => mx[i] = Math.max(mx[i], v)); mats.push(p.getMaterial() && p.getMaterial().getName() + (p.getMaterial().getAlphaMode() !== 'OPAQUE' ? '(' + p.getMaterial().getAlphaMode() + ')' : '')); }
  console.log(n.getName(), 'tris', t, 'min', mn.map(v => v.toFixed(2)).join(','), 'max', mx.map(v => v.toFixed(2)).join(','), mats.join(' '), n.getSkin() ? 'skinned' : ''); }
console.log('clips', r.listAnimations().map(a => a.getName()).join(' ') || '-'); console.log('textures', r.listTextures().map(t => t.getName() + ' ' + (t.getSize() || []).join('x')).join(', '));
