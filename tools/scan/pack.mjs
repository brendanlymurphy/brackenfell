// Merges the converted per-model GLBs into themed packs and writes the catalogue.
// usage: node tools/scan/pack.mjs <accepted.txt> <cache dir> <kits dir>
import fs from 'node:fs';
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP, KHRMeshQuantization } from '@gltf-transform/extensions';
import * as F from '@gltf-transform/functions';
const [listFile, CACHE, KITS] = process.argv.slice(2);
const list = fs.readFileSync(listFile, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/));
const EXCLUDE = new Set(fs.readFileSync(new URL('./exclude.txt', import.meta.url), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));
const NATURE = new Set(['rock', 'ground-cover', 'plant', 'tree']);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const packs = { 'scan_props.glb': new Document(), 'scan_nature.glb': new Document() }, catalog = {};
for (const d of Object.values(packs)) { d.createBuffer(); d.getRoot().setDefaultScene(d.createScene('scan')); }
const tris = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const r3 = a => a.map(v => +v.toFixed(3));
for (const [id, cat] of list) {
  const f = `${CACHE}/${id}.glb`; if (!fs.existsSync(f)) { console.log('missing', id); continue; }
  const file = NATURE.has(cat) ? 'scan_nature.glb' : 'scan_props.glb', target = packs[file];
  const src = await io.read(f);
  const map = F.mergeDocuments(target, src);
  const scene = target.getRoot().getDefaultScene();
  for (const s of target.getRoot().listScenes()) if (s !== scene) { for (const n of s.listChildren()) scene.addChild(n); s.dispose(); }
}
for (const [file, doc] of Object.entries(packs)) {
  await doc.transform(F.unpartition(), F.dedup(), F.quantize({ pattern: /^NORMAL$/, quantizeNormal: 8 }), F.prune());
  doc.createExtension(EXTTextureWebP).setRequired(true);
  for (const n of doc.getRoot().getDefaultScene().listChildren()) if (EXCLUDE.has(n.getName())) n.dispose();
  await doc.transform(F.prune());
  for (const n of doc.getRoot().getDefaultScene().listChildren()) {
    const b = F.getBounds(n), mesh = n.getMesh(), ex = n.getExtras() || {};
    const mats = [...new Set(mesh.listPrimitives().map(p => p.getMaterial().getName()))];
    const e = { kit: 'scan', file, source: ex.source, category: ex.category, min: r3(b.min), max: r3(b.max), size: r3([b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]),
      tris: Math.round(mesh.listPrimitives().reduce((s, p) => s + tris(p), 0)), materials: mats, alpha: mesh.listPrimitives().some(p => p.getMaterial().getAlphaMode() !== 'OPAQUE') };
    if (ex.lights && ex.lights.length) e.lights = ex.lights;
    if (ex.metal > 0.3) e.metal = ex.metal;
    if (ex.far) e.far = ex.far;
    if (ex.lodOf) e.lodOf = ex.lodOf;
    catalog[n.getName()] = e;
  }
  await io.write(`${KITS}/${file}`, doc);
  console.log(file, (fs.statSync(`${KITS}/${file}`).size / 1e6).toFixed(1) + ' MB', doc.getRoot().getDefaultScene().listChildren().length, 'models', doc.getRoot().listTextures().length, 'textures');
}
const sorted = Object.fromEntries(Object.entries(catalog).sort((a, b) => a[1].category.localeCompare(b[1].category) || a[0].localeCompare(b[0])));
fs.writeFileSync(`${KITS}/SCAN_CATALOG.json`, JSON.stringify(sorted, null, 1));
const by = {}; for (const e of Object.values(catalog)) by[e.category] = (by[e.category] || 0) + 1;
console.log(Object.keys(catalog).length, 'entries', JSON.stringify(by));
