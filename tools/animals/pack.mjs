// [ch4] Packs one animal for the game: node tools/animals/pack.mjs <raw.glb from Blender> <colour.png> <normal.png|-> <out.glb> [farTris]
// Gives every material the animal's colour (and normal) texture as WebP (1024), merges meshes that share the skin into one, keeps every clip, and adds a light copy
// of the mesh named "<mesh>@far" (meshoptimizer, about farTris triangles) on the same skin for distance. The raw export comes from tools/animals/*.py (Blender).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { prune, dedup, joinPrimitives, weld, resample, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'node:fs';
await MeshoptSimplifier.ready; await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const [src, colP, nrmP, out, farArg, keepArg] = process.argv.slice(2), farTris = +(farArg || 700), keepClips = keepArg ? new Set(keepArg.split(',')) : null;      // keepArg: the clips the game plays, comma-separated
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src), root = doc.getRoot(); doc.createExtension(EXTTextureWebP).setRequired(false);
const tex = async (p, q) => { const b = await sharp(p).resize(1024, 1024, { fit: 'fill' }).webp({ quality: q, effort: 6 }).toBuffer(); return doc.createTexture(p.split('/').pop().replace(/\.\w+$/, '')).setImage(new Uint8Array(b)).setMimeType('image/webp'); };
const col = await tex(colP, 82), nrm = nrmP && nrmP !== '-' ? await tex(nrmP, 90) : null;
for (const m of root.listMaterials()) { m.setBaseColorTexture(col).setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.85).setMetallicFactor(0); if (nrm && !/001$/.test(m.getName())) m.setNormalTexture(nrm); else m.setNormalTexture(null); m.setAlphaMode('OPAQUE'); }
// one material: all parts read the same atlas
const mats = root.listMaterials(), keep = mats.find(m => m.getName() === 'Chicken') || mats[0]; keep.setName('animal');
for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) p.setMaterial(keep);
// one skinned mesh: move every primitive under the first skinned node
const nodes = root.listNodes().filter(n => n.getMesh() && n.getSkin()), main = nodes[0]; main.getMesh().setName('animal');
for (const n of nodes.slice(1)) { for (const p of n.getMesh().listPrimitives()) main.getMesh().addPrimitive(p); n.getMesh().dispose(); n.dispose(); }
{ const mesh = main.getMesh(), prims = mesh.listPrimitives(), KEEP = ['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0'];
  for (const p of prims) { for (const sem of p.listSemantics()) if (!KEEP.includes(sem)) p.setAttribute(sem, null); for (const t of p.listTargets()) p.removeTarget(t);
    for (const sem of KEEP) { const a = p.getAttribute(sem); if (a && sem === 'JOINTS_0' && !(a.getArray() instanceof Uint16Array)) p.setAttribute(sem, doc.createAccessor().setType('VEC4').setArray(Uint16Array.from(a.getArray())).setBuffer(a.getBuffer())); if (a && sem === 'WEIGHTS_0' && !(a.getArray() instanceof Float32Array)) { const arr = a.getArray(), f = new Float32Array(arr.length), sc = a.getNormalized() ? (arr instanceof Uint8Array ? 255 : arr instanceof Uint16Array ? 65535 : 1) : 1; for (let i = 0; i < arr.length; i++) f[i] = arr[i] / sc; p.setAttribute(sem, doc.createAccessor().setType('VEC4').setArray(f).setBuffer(a.getBuffer())); } }
    const ix = p.getIndices(); if (ix && !(ix.getArray() instanceof Uint32Array)) p.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(ix.getArray())).setBuffer(ix.getBuffer())); }
  if (prims.length > 1) { const j = joinPrimitives(prims); for (const p of prims) { mesh.removePrimitive(p); p.dispose(); } mesh.addPrimitive(j); } }
if (keepClips) for (const a of root.listAnimations()) if (!keepClips.has(a.getName())) a.dispose();
await doc.transform(dedup(), prune());
// the far copy
const p0 = main.getMesh().listPrimitives()[0], pos = p0.getAttribute('POSITION'), idx = p0.getIndices().getArray(), n = idx.length / 3;
const P = new Float32Array(pos.getCount() * 3); for (let i = 0; i < pos.getCount(); i++) P.set(pos.getElement(i, []), i * 3);
const [o] = MeshoptSimplifier.simplify(Uint32Array.from(idx), P, 3, Math.min(idx.length, farTris * 3), 0.05, ['LockBorder']);
const fp = p0.clone(); fp.setIndices(doc.createAccessor().setType('SCALAR').setArray(pos.getCount() > 65535 ? Uint32Array.from(o) : Uint16Array.from(o)).setBuffer(p0.getIndices().getBuffer()));
const fm = doc.createMesh('animal@far').addPrimitive(fp), fn = doc.createNode('animal@far').setMesh(fm).setSkin(main.getSkin()); (main.listParents().find(x => x.propertyType === 'Node' || x.propertyType === 'Scene')).addChild(fn);
await doc.transform(prune(), resample({ tolerance: 1e-3 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));      // fewer keys where a joint barely moves; geometry and keys compressed (the game's loader has the decoder)
await io.write(out, doc);
console.log(out, (fs.statSync(out).size / 1024 | 0) + ' KB', 'tris', n, 'far', o.length / 3, 'clips', root.listAnimations().map(a => a.getName()).join(','));
