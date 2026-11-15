// Step 4 of the tree builder: takes <bake dir>/<name>/tree.gltf (trunk + cards) and writes the compact model into the cache for pack.mjs.
// usage: node tools/scan/trees.mjs <bake dir> <cache dir> <name> [<name> ...]
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import * as F from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
const [BAKE, OUT, ...names] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); await MeshoptSimplifier.ready;
const trisOf = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
for (const name of names) {
  const doc = await io.read(`${BAKE}/${name}/tree.gltf`), root = doc.getRoot(), ex = root.getExtras ? (root.getExtras() || {}) : {};
  const meta = JSON.parse(fs.readFileSync(`${BAKE}/${name}/tree.gltf`, 'utf8')).extras || {};
  const report = [];
  for (const node of root.listNodes()) {
    const far = node.getName().endsWith('_far'), mesh = node.getMesh();
    const wood = mesh.listPrimitives().filter(p => p.getMaterial().getAlphaMode() === 'OPAQUE'), total = wood.reduce((s, p) => s + trisOf(p), 0), bud = far ? 140 : 1800;
    for (const p of wood) {
      const t = Math.max(far ? 24 : 120, bud * trisOf(p) / Math.max(total, 1));
      if (far && trisOf(p) / total < 0.12) { mesh.removePrimitive(p); continue; }        // twigs and dead branches vanish at a distance
      for (const err of [0.02, 0.08, 0.3]) { const c = trisOf(p); if (c <= t * 1.2) break; F.weldPrimitive(p, { overwrite: true }); F.simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: Math.max(t / c, 0.001), error: err, lockBorder: false }); }
    }
    node.setExtras({ source: meta.source, category: 'tree', lights: [], diag: +(meta.height || 0).toFixed(2), height: +(meta.height || 0).toFixed(2), crownRadius: +(meta.crownRadius || 0).toFixed(2), ...(far ? { lodOf: node.getName().slice(0, -4) } : { far: node.getName() + '_far' }) });
    report.push(`${node.getName()} ${Math.round(mesh.listPrimitives().reduce((s, p) => s + trisOf(p), 0))} tris`);
  }
  doc.createExtension(EXTTextureWebP).setRequired(true);
  for (const t of root.listTextures()) {
    const slots = F.listTextureSlots(t), img = t.getImage(); if (!img) continue;
    const atlas = (t.getURI() || '').includes('atlas'), color = slots.includes('baseColorTexture');
    const size = atlas ? 4096 : 512, meta2 = await sharp(img).metadata(), w = Math.min(size, meta2.width);
    t.setImage(await sharp(img).resize(w, w, { fit: 'fill' }).webp(atlas ? { quality: 78, alphaQuality: 80, effort: 5 } : color ? { quality: 78, effort: 5 } : { quality: 84, effort: 5 }).toBuffer()).setMimeType('image/webp').setURI('');
  }
  await doc.transform(F.dedup(), F.prune());
  await io.write(`${OUT}/${name}.glb`, doc);
  console.log(name, (fs.statSync(`${OUT}/${name}.glb`).size / 1024).toFixed(0) + ' KB |', report.join(' | '));
}
