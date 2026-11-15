// Builds the phone-sized pack kits/scan.glb and kits/SCAN_CATALOG.json from the per-model GLBs that convert.mjs wrote.
// usage: node tools/scan/slim.mjs <slim.txt> <converted dir> <kits dir>
// Every model: one named top-level node, footprint centred on the origin, resting on y = 0, metres; welded, simplified to the listed
// triangle count, positions and normals quantized, textures re-encoded as WebP at the listed sizes.
import fs from 'node:fs';
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import * as F from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
const [listFile, CONV, KITS] = process.argv.slice(2);
const list = fs.readFileSync(listFile, 'utf8').split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').map(l => l.split(/\s+/));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const trisOf = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const r3 = a => a.map(v => +v.toFixed(3));
const out = new Document(); out.createBuffer(); const scene = out.createScene('scan'); out.getRoot().setDefaultScene(scene);
out.createExtension(EXTTextureWebP).setRequired(true);
const catalog = {}, report = [];
// merge vertices that share position and uv, averaging normals
function weld(doc, prim) {
  const pos = prim.getAttribute('POSITION'), uv = prim.getAttribute('TEXCOORD_0'), nrm = prim.getAttribute('NORMAL'), idx = prim.getIndices();
  const n = pos.getCount(), map = new Map(), remap = new Uint32Array(n), np = [], nu = [], nn = [], p = [0, 0, 0], u = [0, 0], q = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    pos.getElement(i, p); if (uv) uv.getElement(i, u); if (nrm) nrm.getElement(i, q);
    const k = p.map(v => v.toFixed(5)).join(',') + '|' + u[0].toFixed(5) + ',' + u[1].toFixed(5); let j = map.get(k);
    if (j === undefined) { j = np.length / 3; map.set(k, j); np.push(p[0], p[1], p[2]); nu.push(u[0], u[1]); nn.push(0, 0, 0); }
    if (nrm) { nn[j * 3] += q[0]; nn[j * 3 + 1] += q[1]; nn[j * 3 + 2] += q[2]; }
    remap[i] = j;
  }
  const cnt = idx ? idx.getCount() : n, ni = new Uint32Array(cnt);
  for (let i = 0; i < cnt; i++) ni[i] = remap[idx ? idx.getScalar(i) : i];
  for (let j = 0; j < nn.length; j += 3) { const l = Math.hypot(nn[j], nn[j + 1], nn[j + 2]) || 1; nn[j] /= l; nn[j + 1] /= l; nn[j + 2] /= l; }
  const buf = doc.getRoot().listBuffers()[0];
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(np)).setBuffer(buf));
  if (uv) prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(nu)).setBuffer(buf));
  if (nrm) prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nn)).setBuffer(buf));
  prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(ni).setBuffer(buf));
}
for (const [name, srcId, trisS, baseS, nrmS, ormS] of list) {
  const file = `${CONV}/${srcId}.glb`; if (!fs.existsSync(file)) { console.log('missing', file); continue; }
  const doc = await io.read(file), root = doc.getRoot(), sc = root.listScenes()[0];
  const keep = sc.listChildren().find(n => n.getName() === name); if (!keep) { console.log('no node', name, 'in', srcId); continue; }
  const ex = keep.getExtras() || {};
  for (const n of sc.listChildren()) if (n !== keep) n.dispose();
  await doc.transform(F.prune());
  // glass panes of lamps must not be taken for window glass by the kit materials (those are dark mirrors)
  for (const m of root.listMaterials()) if (/glass/i.test(m.getName())) m.setName(m.getName().replace(/glass/i, 'pane'));
  const mesh = keep.getMesh(), target = +trisS, before = mesh.listPrimitives().reduce((s, p) => s + trisOf(p), 0);
  for (const p of mesh.listPrimitives()) weld(doc, p);
  const cat = ex.category, organic = cat === 'rock' || cat === 'ground-cover', steps = organic ? [0.03, 0.08, 0.15] : cat === 'plant' ? [0.012, 0.03] : [0.008, 0.02, 0.05, 0.1];
  const total = () => mesh.listPrimitives().reduce((s, p) => s + trisOf(p), 0), share = new Map(mesh.listPrimitives().map(p => [p, target * trisOf(p) / total()]));
  for (const err of steps) for (const p of mesh.listPrimitives()) {
    const t = share.get(p), c = trisOf(p); if (c <= t * 1.05) continue;
    F.simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: Math.min(1, Math.max(0.01, t / c)), error: err, lockBorder: false });
  }
  // footprint centre to the origin, bottom on y = 0 (offsets are applied to the vertices, so the node keeps an identity transform until quantizing)
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; const v = [0, 0, 0];
  for (const p of mesh.listPrimitives()) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], v[k]); mx[k] = Math.max(mx[k], v[k]); } } }
  const off = [-(mn[0] + mx[0]) / 2, -mn[1], -(mn[2] + mx[2]) / 2];
  F.transformMesh(mesh, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, off[0], off[1], off[2], 1]);
  keep.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
  const lights = (ex.lights || []).map(l => [l[0] + off[0], l[1] + off[1], l[2] + off[2]]).filter((l, i, a) => a.findIndex(m => Math.hypot(m[0] - l[0], m[1] - l[1], m[2] - l[2]) < 0.012) === i).map(l => l.map(x => +x.toFixed(3)));
  // textures
  const sizes = { baseColorTexture: +baseS, normalTexture: +nrmS, metallicRoughnessTexture: +ormS, occlusionTexture: +ormS };
  for (const t of root.listTextures()) {
    const slots = F.listTextureSlots(t), img = t.getImage(); if (!img) continue;
    const isColor = slots.includes('baseColorTexture'), isNormal = slots.includes('normalTexture'), size = isColor ? sizes.baseColorTexture : isNormal ? sizes.normalTexture : sizes.metallicRoughnessTexture;
    const meta = await sharp(img).metadata(), w = Math.min(size, meta.width), h = Math.min(size, meta.height);
    const buf = await sharp(img).resize(w, h, { fit: 'fill' }).webp(isColor ? { quality: 78, alphaQuality: 90, effort: 5 } : isNormal ? { quality: 85, effort: 5 } : { quality: 70, effort: 5 }).toBuffer();
    t.setImage(buf).setMimeType('image/webp').setURI('');
  }
  const map = F.mergeDocuments ? null : null; void map;
  const { mergeDocuments } = F; mergeDocuments(out, doc);
  for (const s of out.getRoot().listScenes()) if (s !== scene) { for (const n of s.listChildren()) scene.addChild(n); s.dispose(); }
  catalog[name] = { kit: 'scan', file: 'scan.glb', source: srcId, category: cat, min: null, max: null, size: null, tris: total(), materials: [...new Set(mesh.listPrimitives().map(p => p.getMaterial().getName()))], alpha: mesh.listPrimitives().some(p => p.getMaterial().getAlphaMode() !== 'OPAQUE') };
  if (lights.length) catalog[name].lights = lights;
  if (ex.metal > 0.3) catalog[name].metal = ex.metal;
  report.push(`${name} ${Math.round(before)}->${total()}`);
}
await out.transform(F.unpartition(), F.dedup(), F.prune());
// quantize last: positions 14 bit, normals 8 bit; uvs stay float so tiling coordinates survive
await out.transform(F.quantize({ pattern: /^(POSITION|NORMAL)$/, quantizePosition: 14, quantizeNormal: 8 }), F.prune());
for (const n of scene.listChildren()) {
  const b = F.getBounds(n), e = catalog[n.getName()]; e.min = r3(b.min); e.max = r3(b.max); e.size = r3([b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]]);
}
await io.write(`${KITS}/scan.glb`, out);
const order = Object.entries(catalog).sort((a, b) => a[1].category.localeCompare(b[1].category) || a[0].localeCompare(b[0]));
fs.writeFileSync(`${KITS}/SCAN_CATALOG.json`, JSON.stringify(Object.fromEntries(order), null, 1));
console.log(report.join('\n')); console.log(Object.keys(catalog).length, 'models', (fs.statSync(`${KITS}/scan.glb`).size / 1e6).toFixed(2), 'MB', out.getRoot().listTextures().length, 'textures');
