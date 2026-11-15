// Optimises one raw Blender export of a MakeHuman villager for the web.
// usage: node post.mjs <in.glb> <out.glb> [budgetTris]
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, prune, dedup, quantize, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
const [src, dst, budgetArg] = process.argv.slice(2), budget = +(budgetArg || 11000);
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP]);
const doc = await io.read(src), root = doc.getRoot();
const kind = n => /^cloth_/.test(n) ? 'cloth' : /eyebrow/i.test(n) ? 'brow' : /eyelash/i.test(n) ? 'lash' : /low-poly|high-poly|eye/i.test(n) ? 'eye' : /body|skin|^Human$/i.test(n) ? 'body' : /hair|braid|bun|bob|short0|long0|ponytail|afro|messy/i.test(n) ? 'hair' : 'cloth';
for (const m of root.listMaterials()) {
  const k = kind(m.getName()); m.setExtras({ kind: k });
  if (k === 'hair' || k === 'brow' || k === 'lash') { m.setAlphaMode('MASK').setAlphaCutoff(k === 'hair' ? 0.18 : 0.4).setDoubleSided(true); }
  else { m.setAlphaMode('OPAQUE').setDoubleSided(k === 'cloth'); }
  m.setMetallicFactor(0).setRoughnessFactor(k === 'eye' ? 0.25 : k === 'body' ? 0.62 : k === 'hair' ? 0.55 : 0.85);
}
await doc.transform(weld());
const tri = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const prims = []; for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) prims.push({ p, k: kind(p.getMaterial().getName()), n: tri(p), name: mesh.getName() });
// small parts keep their triangles; the rest share what is left of the budget, the head-and-hands mesh getting the biggest share
const fixed = prims.filter(x => x.k === 'brow' || x.k === 'lash' || x.k === 'eye').reduce((s, x) => s + x.n, 0);
// the head-and-hands mesh gets a fixed share so heavy boots or robes cannot starve the face; clothes split theirs by sqrt(size)
const hasHair = prims.some(x => x.k === 'hair'), share = hasHair ? { body: 0.45, hair: 0.15, cloth: 0.40 } : { body: 0.52, hair: 0, cloth: 0.48 };
const rest = budget - fixed, sums = {};
for (const x of prims) if (share[x.k] !== undefined) sums[x.k] = (sums[x.k] || 0) + Math.sqrt(x.n);
for (const x of prims) {
  if (share[x.k] === undefined) continue;
  const target = Math.max(200, rest * share[x.k] * Math.sqrt(x.n) / sums[x.k]), ratio = Math.min(1, target / x.n);
  if (ratio < 0.97) simplifyPrimitive(x.p, { simplifier: MeshoptSimplifier, ratio, error: 0.05, lockBorder: false });
  x.after = tri(x.p);
}
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 80, slots: /baseColor/ }),
  dedup(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), prune());
await io.write(dst, doc);
console.log(JSON.stringify({ out: dst.split('/').pop(), tris: Math.round(prims.reduce((s, x) => s + (x.after || x.n), 0)), parts: prims.map(x => x.name + ':' + x.k + ':' + Math.round(x.n) + '>' + Math.round(x.after || x.n)).join(' ') }));
