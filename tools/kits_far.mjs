// Adds a far version to every piece of a kit pack (default kits/village.glb): a sibling node "<piece>@far" holding a much lighter copy of the meshes.
// Kit.batch (src/44_kit.js) puts the far copies in separate meshes that are drawn instead of the full ones beyond QUALITY.houseFar metres, so a house, an
// alley front or any future building gets its far version without anyone building it. Safe to run again (old @far nodes are replaced).
// usage: node tools/kits_far.mjs [kits/village.glb ...]
//   per material: plaster and glass stay; roof tiles and timber lose most of their triangles; metal, cloth and vine decoration is left out;
//   whole pieces that are only trim (shutters, balconies, roof supports, overhangs, stairs, lamps, props, flowers) have no far copy at all.
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP } from '@gltf-transform/extensions';
import { MeshoptSimplifier } from 'meshoptimizer';
import * as THREE from 'three';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';
await MeshoptSimplifier.ready;
const root = new URL('../', import.meta.url).pathname;
const files = process.argv.slice(2).length ? process.argv.slice(2) : [root + 'kits/village.glb'];
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP]);
const DROP_PIECE = /Shutter|Balcony|Roof_Support|Overhang|Stair|Lantern|Prop_|Flower|Vine|Torch|Sign|Banner/;
const KEEP = /Plaster|WindowGlass/, DROP_MAT = /Metal|Cloth|Vine|Furniture|Glass_?Frame/;        // glass is kept whole (a few triangles), these never show from afar
const ratio = (mat, piece) => /RoundTiles/.test(mat) ? 0.06 : /WoodTrim/.test(mat) ? (/^Roof/.test(piece) ? 0.08 : 0.3) : 0.25;
const trisOf = p => p.getIndices().getCount() / 3;
function simplified(doc, prim, target, lock) {
  const ia = prim.getIndices(), idx = Uint32Array.from(ia.getArray()), pa = prim.getAttribute('POSITION'), nv = pa.getCount(), nrm = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0');
  const pos = new Float32Array(nv * 3), att = new Float32Array(nv * 8), e = [0, 0, 0, 0];
  for (let i = 0; i < nv; i++) { pa.getElement(i, e); pos.set(e.slice(0, 3), i * 3); if (nrm) { nrm.getElement(i, e); att.set(e.slice(0, 3), i * 8); } if (uv) { uv.getElement(i, e); att.set(e.slice(0, 2), i * 8 + 3); } }
  target = Math.min(target, idx.length / 3);
  let out = idx;
  for (const err of [0.2, 1]) { [out] = MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, att, 8, [0.3, 0.3, 0.3, 1, 1, 0, 0, 0], null, Math.min(Math.max(6, Math.round(target)), idx.length / 3) * 3, err, lock ? ['LockBorder'] : []); if (out.length <= Math.max(6, Math.round(target)) * 3 * 1.3) break; }
  if (out.length > Math.max(6, Math.round(target)) * 3 * 1.3) [out] = MeshoptSimplifier.simplify(idx, pos, 3, Math.min(Math.max(6, Math.round(target)), idx.length / 3) * 3, 1, lock ? ['LockBorder'] : []);      // still stuck on UV seams: positions only
  if (!out.length) return null;
  const remap = new Map(), keep = []; for (const v of out) if (!remap.has(v)) { remap.set(v, keep.length); keep.push(v); }
  const np = doc.createPrimitive().setMaterial(prim.getMaterial()).setMode(prim.getMode());
  for (const sem of prim.listSemantics()) {
    const a = prim.getAttribute(sem), arr = a.getArray(), es = a.getElementSize(), na = new arr.constructor(keep.length * es);
    keep.forEach((v, j) => { for (let k = 0; k < es; k++) na[j * es + k] = arr[v * es + k]; });
    np.setAttribute(sem, doc.createAccessor().setType(a.getType()).setArray(na).setNormalized(a.getNormalized()).setBuffer(a.getBuffer()));
  }
  const ni = keep.length > 65535 ? new Uint32Array(out.length) : new Uint16Array(out.length); out.forEach((v, j) => { ni[j] = remap.get(v); });
  np.setIndices(doc.createAccessor().setType('SCALAR').setArray(ni).setBuffer(ia.getBuffer()));
  return np;
}
// Roof tiles are hundreds of separate little bodies that no simplifier can merge: the far roof is the convex hull of the tiles (a gable roof is convex),
// reduced, with texture coordinates fitted to the original ones by least squares (the roof maps are linear in position).
function hullPrim(doc, prim, target) {
  const pa = prim.getAttribute('POSITION'), uv = prim.getAttribute('TEXCOORD_0'), nv = pa.getCount(), e = [0, 0, 0], q = [0, 0], pts = [], P = [];
  for (let i = 0; i < nv; i++) { pa.getElement(i, e); pts.push(new THREE.Vector3(e[0], e[1], e[2])); }
  // u = a . p + b by normal equations over all vertices
  const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], bu = [0, 0, 0, 0], bv = [0, 0, 0, 0];
  for (let i = 0; i < nv; i++) { uv.getElement(i, q); const r = [pts[i].x, pts[i].y, pts[i].z, 1]; for (let a = 0; a < 4; a++) { for (let b = 0; b < 4; b++) A[a][b] += r[a] * r[b]; bu[a] += r[a] * q[0]; bv[a] += r[a] * q[1]; } }
  const solve = (M, y) => { const n = 4, m = M.map((r, i) => [...r, y[i] + 0]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r; [m[c], m[p]] = [m[p], m[c]]; const d = m[c][c] || 1e-9; for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c] / d; for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k]; } } return m.map((r, i) => r[n] / (r[i] || 1e-9)); };
  const cu = solve(A, bu), cv = solve(A, bv), hull = new ConvexHull().setFromPoints(pts);
  // hull faces -> an indexed triangle list, welded by position, then reduced
  const vi = new Map(), pos = [], idx = [];
  for (const f of hull.faces) { let ed = f.edge; const ids = []; do { const p = ed.head().point, k = p.x.toFixed(4) + ',' + p.y.toFixed(4) + ',' + p.z.toFixed(4); let j = vi.get(k); if (j === undefined) { j = pos.length / 3; vi.set(k, j); pos.push(p.x, p.y, p.z); } ids.push(j); ed = ed.next; } while (ed !== f.edge); for (let k = 1; k < ids.length - 1; k++) idx.push(ids[0], ids[k], ids[k + 1]); }
  let ind = Uint32Array.from(idx); const P32 = Float32Array.from(pos);
  if (ind.length / 3 > target) [ind] = MeshoptSimplifier.simplify(ind, P32, 3, Math.max(8, Math.round(target)) * 3, 1, []);
  // flat-shaded vertices with fitted UVs; keep only the faces that look up or sideways (the underside of a roof is never seen from outside)
  const O = [], N = [], U = [], I = [];
  for (let t = 0; t < ind.length; t += 3) {
    const a = [0, 1, 2].map(k => new THREE.Vector3(P32[ind[t + k] * 3], P32[ind[t + k] * 3 + 1], P32[ind[t + k] * 3 + 2])), n = new THREE.Vector3().subVectors(a[1], a[0]).cross(new THREE.Vector3().subVectors(a[2], a[0])).normalize();
    if (n.y < -0.5) continue;
    for (const v of a) { I.push(O.length / 3); O.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); U.push(cu[0] * v.x + cu[1] * v.y + cu[2] * v.z + cu[3], cv[0] * v.x + cv[1] * v.y + cv[2] * v.z + cv[3]); }
  }
  const buf = prim.getAttribute('POSITION').getBuffer(), np = doc.createPrimitive().setMaterial(prim.getMaterial());
  np.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(Float32Array.from(O)).setBuffer(buf)).setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(Float32Array.from(N)).setBuffer(buf)).setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(Float32Array.from(U)).setBuffer(buf));
  np.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint16Array.from(I)).setBuffer(buf));
  return np;
}
for (const file of files) {
  const doc = await io.read(file), r = doc.getRoot(), scene = r.listScenes()[0];
  for (const n of scene.listChildren()) if (/@far$/.test(n.getName())) { const m = n.getMesh(); if (m) { for (const p of m.listPrimitives()) p.dispose(); m.dispose(); } n.dispose(); }
  let nPieces = 0, from = 0, to = 0;
  for (const node of scene.listChildren().slice()) {
    const mesh = node.getMesh(), name = node.getName(); if (!mesh || DROP_PIECE.test(name)) continue;
    const prims = [];
    for (const p of mesh.listPrimitives()) {
      const mat = p.getMaterial().getName(), n = trisOf(p); from += n;
      if (DROP_MAT.test(mat) && !KEEP.test(mat)) continue;
      if (/^Window/.test(name) && !/WindowGlass/.test(mat)) continue;       // a window is its glass; the frame goes
      if (/RoundTiles/.test(mat) && /^Roof/.test(name) && p.getAttribute('TEXCOORD_0')) { const hp = hullPrim(doc, p, 24); if (hp) { prims.push(hp); to += trisOf(hp); } continue; }
      if (/WoodTrim/.test(mat) && /^Roof/.test(name)) continue;       // rafters and eaves: not seen from afar
      const np = KEEP.test(mat) || n <= 8 ? simplified(doc, p, n, false) : simplified(doc, p, Math.max(8, n * ratio(mat, name)), /^Wall|^Corner|^Floor/.test(name) && /Brick|Plaster/.test(mat));
      if (np) { prims.push(np); to += trisOf(np); }
    }
    if (!prims.length) continue;
    const fm = doc.createMesh(name + '@far'); prims.forEach(p => fm.addPrimitive(p));
    const fn = doc.createNode(name + '@far').setMesh(fm).setTranslation(node.getTranslation()).setRotation(node.getRotation()).setScale(node.getScale());
    scene.addChild(fn); nPieces++;
  }
  for (const a of r.listAccessors()) if (a.listParents().every(p => p.propertyType === 'Root')) a.dispose();
  await io.write(file, doc);
  console.log(file.split('/').pop(), nPieces + ' far pieces, triangles ' + Math.round(from) + ' > ' + Math.round(to) + ' (whole kit, each piece once)');
}
