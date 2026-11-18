// Adds a low-detail copy of every mesh to a character GLB, on the same skeleton and sharing the same materials (so no texture is stored twice).
// The copies are extra skinned meshes named "<mesh>@lod"; 49_chars.js keeps them apart from the full parts and switches by distance.
// usage: node tools/chars_lod.mjs [--tris 2200] [--level lod] <file.glb> [more.glb ...]       (rewrites the files in place; safe to run again)
// Levels the game knows (49_chars.js): mid (about 4600 triangles, a few metres away), lod (2200, across a street), far (700, far off and for shadows):
//   node tools/chars_lod.mjs --level mid --tris 4600 chars/real/[fmo]_*.glb; node tools/chars_lod.mjs --level lod --tris 2200 ...; node tools/chars_lod.mjs --level far --tris 700 ...
// Needs the devDependencies of package.json (@gltf-transform, meshoptimizer).
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptSimplifier.ready; await MeshoptDecoder.ready;
const args = process.argv.slice(2); let budget = 2200, level = 'lod'; const files = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--tris') budget = +args[++i]; else if (args[i] === '--level') level = args[++i]; else files.push(args[i]); }
const SUF = '@' + level, isCopy = n => /@(lod|mid|far)$/.test(n), isMine = n => n.endsWith(SUF);
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP, EXTMeshoptCompression]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
// what a mesh is, from its material (the MakeHuman bodies carry extras.kind; the Quaternius ones are told by name)
const kindOf = (mat, name) => {
  if (/teeth|tongue/i.test(name)) return 'mouth';          // morph.py: only the two close weights have them
  if (/^w_/.test(name)) return 'wear';          // wardrobe pieces (tools/humans/garb.py): a villager wears about 700 triangles of them at full weight
  const k = mat.getExtras() && mat.getExtras().kind; if (k) return k;
  const n = (mat.getName() + ' ' + name);
  return /eye/i.test(n) ? 'eye' : /brow/i.test(n) ? 'brow' : /hair|beard/i.test(n) ? 'hair' : /skin|head|regular/i.test(n) ? 'body' : 'cloth';
};
// shares of the budget: the body (head, hands, anything not under cloth) keeps the biggest part so a face still reads
const SHARE = level === 'mid' ? { body: 0.46, hair: 0.22, cloth: 0.32 } : { body: 0.50, hair: 0.14, cloth: 0.36 }, EYE_TRIS = level === 'far' ? 0 : level === 'mid' ? 120 : 60;       // close up, hair is what gives a thin copy away
for (const file of files) {
  const doc = await io.read(file), root = doc.getRoot();
  for (const n of root.listNodes()) if (isMine(n.getName())) n.dispose();         // run again from scratch
  for (const m of root.listMeshes()) if (isMine(m.getName())) { for (const p of m.listPrimitives()) p.dispose(); m.dispose(); }
  const items = [];
  for (const node of root.listNodes()) {
    const mesh = node.getMesh(); if (!mesh || !node.getSkin() || isCopy(node.getName())) continue;
    for (const prim of mesh.listPrimitives()) items.push({ node, mesh, prim, kind: kindOf(prim.getMaterial(), mesh.getName()), n: prim.getIndices().getCount() / 3 });
  }
  const MOUTH_N = level === 'mid' ? items.filter(x => x.kind === 'mouth').reduce((a, x) => a + x.n, 0) : 0, WEAR_RATIO = level === 'mid' ? 0.34 : level === 'lod' ? 0.28 : 0.10, WEAR_MAX = Math.round(700 * WEAR_RATIO), rest = budget - items.filter(x => x.kind === 'eye').length * EYE_TRIS - (items.some(x => x.kind === 'wear') ? WEAR_MAX : 0) - MOUTH_N - items.filter(x => /^w_(kirtle|sleeve)/.test(x.mesh.getName())).reduce((a, x) => a + x.n * WEAR_RATIO, 0), sums = {};
  for (const x of items) if (SHARE[x.kind] !== undefined) sums[x.kind] = (sums[x.kind] || 0) + Math.sqrt(x.n);
  let total = 0; const log = [];
  for (const x of items) {
    if ((x.kind === 'brow' || x.kind === 'lash') && level !== 'mid') continue;                       // 1 to 2 pixels at the distance this is used
    if (x.kind === 'eye' && !EYE_TRIS) continue;
    if (x.kind === 'mouth' && level !== 'mid') continue;
    if (x.kind === 'wear' && level === 'far' && !/^w_(kirtle|sleeve)/.test(x.mesh.getName())) continue;                       // 700-triangle copies are seen beyond 26 m: no garments of their own (the silhouette is the body's)
    if (x.kind === 'wear' && level !== 'mid' && /^w_(belt|pouch|cuff|straps)/.test(x.mesh.getName()) && !(level === 'mid' && /^w_(belt|straps)/.test(x.mesh.getName()))) continue;               // belts, pouches, cuffs and straps are a few pixels beyond mid distance
    const target = x.kind === 'eye' ? EYE_TRIS : x.kind === 'wear' ? Math.max(12, x.n * WEAR_RATIO) : x.kind === 'mouth' ? x.n : SHARE[x.kind] === undefined ? x.n : Math.max(level === 'far' ? 30 : 80, rest * SHARE[x.kind] * Math.sqrt(x.n) / sums[x.kind]);
    const prim = x.prim, ia = prim.getIndices(), idx = Uint32Array.from(ia.getArray()), pa = prim.getAttribute('POSITION'), nv = pa.getCount();
    const pos = new Float32Array(nv * 3), nrm = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0'), wt = prim.getAttribute('WEIGHTS_0'), e = [0, 0, 0, 0];
    const att = new Float32Array(nv * 9);              // normal (3), uv (2), skin weights (4)
    for (let i = 0; i < nv; i++) {
      pa.getElement(i, e); pos.set(e.slice(0, 3), i * 3);
      if (nrm) { nrm.getElement(i, e); att.set(e.slice(0, 3), i * 9); }
      if (uv) { uv.getElement(i, e); att.set(e.slice(0, 2), i * 9 + 3); }
      if (wt) { wt.getElement(i, e); att.set(e, i * 9 + 5); }
    }
    const W = x.kind === 'hair' ? [0.2, 0.2, 0.2, 0.5, 0.5, 0.3, 0.3, 0.3, 0.3] : [0.5, 0.5, 0.5, 1, 1, 0.6, 0.6, 0.6, 0.6];
    let [out] = target >= x.n ? [idx] : MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, att, 9, W, null, Math.round(target) * 3, 0.5, /^w_(kirtle|sleeve)/.test(x.mesh.getName()) ? ['LockBorder'] : []);
    // a new primitive with only the vertices that are left
    const remap = new Map(), keep = []; for (const v of out) if (!remap.has(v)) { remap.set(v, keep.length); keep.push(v); }
    const np = doc.createPrimitive().setMaterial(prim.getMaterial()).setMode(prim.getMode());
    for (const sem of prim.listSemantics()) {
      const a = prim.getAttribute(sem), arr = a.getArray(), es = a.getElementSize(), na = new arr.constructor(keep.length * es);
      keep.forEach((v, j) => { for (let k = 0; k < es; k++) na[j * es + k] = arr[v * es + k]; });
      let acc = doc.createAccessor().setType(a.getType()).setArray(na).setNormalized(a.getNormalized()).setBuffer(a.getBuffer());
      if (sem === 'JOINTS_0') acc.setArray(Uint8Array.from(na));          // fewer than 256 joints: a byte each
      if (sem === 'WEIGHTS_0') {                                             // bytes that still add up to exactly 255
        const f = a.getNormalized() ? 1 : 255, wb = new Uint8Array(na.length), sc = a.getNormalized() ? 1 / (arr.constructor === Uint16Array ? 65535 : arr.constructor === Uint8Array ? 255 : 1) : 1;
        for (let j = 0; j < keep.length; j++) { let sum = 0, big = 0; for (let k = 0; k < 4; k++) { const b = Math.round(na[j * 4 + k] * sc * 255); wb[j * 4 + k] = b; sum += b; if (b > wb[j * 4 + big]) big = k; } wb[j * 4 + big] += 255 - sum; }
        acc.setArray(wb).setNormalized(true);
      }
      np.setAttribute(sem, acc);
    }
    const ni = nv > 65535 || keep.length > 65535 ? new Uint32Array(out.length) : new Uint16Array(out.length); out.forEach((v, j) => { ni[j] = remap.get(v); });
    np.setIndices(doc.createAccessor().setType('SCALAR').setArray(ni).setBuffer(ia.getBuffer()));
    const lm = doc.createMesh(x.mesh.getName() + SUF).addPrimitive(np), ln = doc.createNode(x.node.getName() + SUF).setMesh(lm).setSkin(x.node.getSkin());
    const par = x.node.listParents().find(p => p.propertyType === 'Node' || p.propertyType === 'Scene'); par.addChild(ln);
    total += out.length / 3; log.push(x.mesh.getName() + ':' + x.kind + ':' + Math.round(x.n) + '>' + out.length / 3);
  }
  for (const a of root.listAccessors()) if (a.listParents().every(p => p.propertyType === 'Root')) a.dispose();       // what a previous run left behind
  const before = fs.statSync(file).size; await io.write(file, doc);
  console.log(file.split('/').pop(), level + ' tris', Math.round(total), (before / 1024 | 0) + 'KB >', (fs.statSync(file).size / 1024 | 0) + 'KB', log.join(' '));
}
