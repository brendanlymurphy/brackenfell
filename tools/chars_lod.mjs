// Adds a low-detail copy of every mesh to a character GLB, on the same skeleton and sharing the same materials (so no texture is stored twice).
// The copies are extra skinned meshes named "<mesh>@lod"; 49_chars.js keeps them apart from the full parts and switches by distance.
// usage: node tools/chars_lod.mjs [--tris 2200] <file.glb> [more.glb ...]       (rewrites the files in place; safe to run again)
// Needs the devDependencies of package.json (@gltf-transform, meshoptimizer).
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptSimplifier.ready; await MeshoptDecoder.ready;
const args = process.argv.slice(2); let budget = 2200; const files = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--tris') budget = +args[++i]; else files.push(args[i]); }
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP, EXTMeshoptCompression]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
// what a mesh is, from its material (the MakeHuman bodies carry extras.kind; the Quaternius ones are told by name)
const kindOf = (mat, name) => {
  const k = mat.getExtras() && mat.getExtras().kind; if (k) return k;
  const n = (mat.getName() + ' ' + name);
  return /eye/i.test(n) ? 'eye' : /brow/i.test(n) ? 'brow' : /hair|beard/i.test(n) ? 'hair' : /skin|head|regular/i.test(n) ? 'body' : 'cloth';
};
// shares of the budget: the body (head, hands, anything not under cloth) keeps the biggest part so a face still reads
const SHARE = { body: 0.50, hair: 0.14, cloth: 0.36 }, EYE_TRIS = 60;
for (const file of files) {
  const doc = await io.read(file), root = doc.getRoot();
  for (const n of root.listNodes()) if (/@lod$/.test(n.getName())) n.dispose();         // run again from scratch
  for (const m of root.listMeshes()) if (/@lod$/.test(m.getName())) { for (const p of m.listPrimitives()) p.dispose(); m.dispose(); }
  const items = [];
  for (const node of root.listNodes()) {
    const mesh = node.getMesh(); if (!mesh || !node.getSkin()) continue;
    for (const prim of mesh.listPrimitives()) items.push({ node, mesh, prim, kind: kindOf(prim.getMaterial(), mesh.getName()), n: prim.getIndices().getCount() / 3 });
  }
  const rest = budget - items.filter(x => x.kind === 'eye').length * EYE_TRIS, sums = {};
  for (const x of items) if (SHARE[x.kind] !== undefined) sums[x.kind] = (sums[x.kind] || 0) + Math.sqrt(x.n);
  let total = 0; const log = [];
  for (const x of items) {
    if (x.kind === 'brow' || x.kind === 'lash') continue;                       // 1 to 2 pixels at the distance this is used
    const target = x.kind === 'eye' ? EYE_TRIS : Math.max(80, rest * SHARE[x.kind] * Math.sqrt(x.n) / sums[x.kind]);
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
    let [out] = target >= x.n ? [idx] : MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, att, 9, W, null, Math.round(target) * 3, 0.5, []);
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
    const lm = doc.createMesh(x.mesh.getName() + '@lod').addPrimitive(np), ln = doc.createNode(x.node.getName() + '@lod').setMesh(lm).setSkin(x.node.getSkin());
    const par = x.node.listParents().find(p => p.propertyType === 'Node' || p.propertyType === 'Scene'); par.addChild(ln);
    total += out.length / 3; log.push(x.mesh.getName() + ':' + x.kind + ':' + Math.round(x.n) + '>' + out.length / 3);
  }
  for (const a of root.listAccessors()) if (a.listParents().every(p => p.propertyType === 'Root')) a.dispose();       // what a previous run left behind
  const before = fs.statSync(file).size; await io.write(file, doc);
  console.log(file.split('/').pop(), 'lod tris', Math.round(total), (before / 1024 | 0) + 'KB >', (fs.statSync(file).size / 1024 | 0) + 'KB', log.join(' '));
}
