// Per-piece triangle budgets for the shipped kit packs. Run after tools/kits.mjs (or on its own: it rewrites the GLBs in place and only ever
// reduces a piece that is above its budget, so running it twice changes nothing).
// usage: node tools/kits_budget.mjs [tools/kit_budget.json] [kits/village.glb kits/props.glb ...]
//   kit_budget.json: { "<piece name>": maxTriangles, ... }   (a piece is one top-level node of a pack)
// Simplification is meshoptimizer's, aware of normals and UVs; borders are locked for pieces made of cut-out cards (ferns, weeds) so they keep their outline; solid pieces may shrink at open edges.
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP } from '@gltf-transform/extensions';
import { MeshoptSimplifier } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptSimplifier.ready;
const args = process.argv.slice(2), root = new URL('../', import.meta.url).pathname;
const budgetFile = args[0] && args[0].endsWith('.json') ? args.shift() : root + 'tools/kit_budget.json';
const files = args.length ? args : ['village', 'props', 'nature', 'scan'].map(n => root + 'kits/' + n + '.glb').filter(f => fs.existsSync(f));
const BUDGET = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP]);
const trisOf = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const CARDS = /fern|weed|grass|plant|leaf|leaves|flower|vine|clover/i;      // pieces made of cut-out cards keep their borders
function simplify(doc, prim, target, lock) {
  const ia = prim.getIndices(); if (!ia) return false;
  const idx = Uint32Array.from(ia.getArray()), pa = prim.getAttribute('POSITION'), nv = pa.getCount();
  const nrm = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0'), col = prim.getAttribute('COLOR_0');
  const pos = new Float32Array(nv * 3), att = new Float32Array(nv * 8), e = [0, 0, 0, 0];
  for (let i = 0; i < nv; i++) {
    pa.getElement(i, e); pos.set(e.slice(0, 3), i * 3);
    if (nrm) { nrm.getElement(i, e); att.set(e.slice(0, 3), i * 8); }
    if (uv) { uv.getElement(i, e); att.set(e.slice(0, 2), i * 8 + 3); }
    if (col) { col.getElement(i, e); att.set(e.slice(0, 3), i * 8 + 5); }
  }
  const W = [0.6, 0.6, 0.6, 1.2, 1.2, 0.3, 0.3, 0.3];
  let out = idx;
  for (const [err, W2] of [[0.1, W], [0.3, W], [1, W], [1, W.map(w => w * 0.15)]]) { [out] = MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, att, 8, W2, null, Math.max(12, Math.round(target)) * 3, err, lock ? ['LockBorder'] : []); if (out.length <= Math.max(12, Math.round(target)) * 3 * 1.15) break; }      // a stubborn piece gets a looser error limit
  if (out.length >= idx.length) return false;
  const remap = new Map(), keep = []; for (const v of out) if (!remap.has(v)) { remap.set(v, keep.length); keep.push(v); }
  for (const sem of prim.listSemantics()) {
    const a = prim.getAttribute(sem), arr = a.getArray(), es = a.getElementSize(), na = new arr.constructor(keep.length * es);
    keep.forEach((v, j) => { for (let k = 0; k < es; k++) na[j * es + k] = arr[v * es + k]; });
    const acc = doc.createAccessor().setType(a.getType()).setArray(na).setNormalized(a.getNormalized()).setBuffer(a.getBuffer());
    prim.setAttribute(sem, acc);
  }
  const ni = keep.length > 65535 ? new Uint32Array(out.length) : new Uint16Array(out.length); out.forEach((v, j) => { ni[j] = remap.get(v); });
  prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(ni).setBuffer(ia.getBuffer()));
  return true;
}
for (const file of files) {
  const doc = await io.read(file), r = doc.getRoot(), done = new Set(); let changed = 0, saved = 0; const log = [];
  for (const node of r.listScenes()[0].listChildren()) {
    const budget = BUDGET[node.getName()]; if (!budget) continue;
    const meshes = []; node.traverse(n => { if (n.getMesh() && !meshes.includes(n.getMesh())) meshes.push(n.getMesh()); });
    const prims = meshes.flatMap(m => m.listPrimitives()), total = prims.reduce((s, p) => s + trisOf(p), 0);
    if (total <= budget * 1.05) continue;
    const k = budget / total; let after = 0;
    for (const p of prims) { if (!done.has(p)) { done.add(p); simplify(doc, p, trisOf(p) * k, CARDS.test(node.getName()) || CARDS.test((p.getMaterial() && p.getMaterial().getName()) || '')); } after += trisOf(p); }
    changed++; saved += total - after; log.push(node.getName() + ' ' + Math.round(total) + '>' + Math.round(after));
  }
  for (const a of r.listAccessors()) if (a.listParents().every(p => p.propertyType === 'Root')) a.dispose();
  if (changed) { const before = fs.statSync(file).size; await io.write(file, doc); console.log(file.split('/').pop(), changed + ' pieces, -' + Math.round(saved) + ' tris, ' + (before / 1024 | 0) + 'KB > ' + (fs.statSync(file).size / 1024 | 0) + 'KB\n  ' + log.join(', ')); }
  else console.log(file.split('/').pop(), 'unchanged');
}
