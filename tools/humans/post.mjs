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
for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) p.setAttribute('_OIDX', null);      // generator bookkeeping (morph.py)
await doc.transform(weld());
const tri = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const prims = []; for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) prims.push({ p, k: kind(p.getMaterial().getName()), n: tri(p), name: mesh.getName() });
// small parts keep their triangles; the rest share what is left of the budget, the head-and-hands mesh getting the biggest share
const isMouth = x => /teeth|tongue/i.test(x.name), MOUTH_TRIS = x => /tongue/i.test(x.name) ? 64 : 220;      // teeth and tongue (morph.py): kept small, they only show when the mouth opens
for (const x of prims) if (isMouth(x)) { simplifyPrimitive(x.p, { simplifier: MeshoptSimplifier, ratio: Math.min(1, MOUTH_TRIS(x) / x.n), error: 0.2, lockBorder: false }); x.after = tri(x.p); }
// wardrobe pieces are thin shells: a modest cap each keeps a fully dressed guard under the old figures (a hat or tabard ring has more rings than it needs)
const WEAR_CAP = n => /^w_hat_/.test(n) ? 300 : /^w_tabard/.test(n) ? 110 : /^w_cloak/.test(n) ? 360 : /^w_kirtle/.test(n) ? 640 : /^w_sleeve/.test(n) ? 110 : /^w_apron/.test(n) ? 150 : /^w_belt/.test(n) ? 150 : 1e9;
for (const x of prims) if (/^w_/.test(x.name) && x.n > WEAR_CAP(x.name)) { simplifyPrimitive(x.p, { simplifier: MeshoptSimplifier, ratio: WEAR_CAP(x.name) / x.n, error: 0.05, lockBorder: false }); x.after = tri(x.p); }
const fixed = prims.filter(x => x.k === 'brow' || x.k === 'lash' || x.k === 'eye').reduce((s, x) => s + x.n, 0) + prims.filter(isMouth).reduce((s, x) => s + x.after, 0);
// the head-and-hands mesh gets a fixed share so heavy boots or robes cannot starve the face; clothes split theirs by sqrt(size)
const hasHair = prims.some(x => x.k === 'hair'), share = hasHair ? { body: 0.45, hair: 0.15, cloth: 0.40 } : { body: 0.52, hair: 0, cloth: 0.48 };
if (prims.some(x => /^w_kirtle/.test(x.name))) Object.assign(share, hasHair ? { body: 0.62, hair: 0.22, cloth: 0.16 } : { body: 0.8, hair: 0, cloth: 0.2 });   // boots hide under the kirtle: the share goes to the face and hair
const KIRT = prims.filter(x => /^w_(kirtle|sleeve)/.test(x.name)).reduce((s, x) => s + (x.after || x.n), 0)
for (const x of prims) if (KIRT && x.k === 'cloth' && /boot|shoe/i.test(x.name) && x.n > 900) { simplifyPrimitive(x.p, { simplifier: MeshoptSimplifier, ratio: 900 / x.n, error: 0.05, lockBorder: false }); x.after = tri(x.p); }   // under a long kirtle only the toes show
const WEAR_MAX = 700 + KIRT, rest = budget - fixed - (prims.some(x => /^w_/.test(x.name)) ? WEAR_MAX : 0), sums = {};      // wardrobe pieces (w_*) keep their triangles; a villager wears about 700 of them at once
const isWear = x => /^w_/.test(x.name) || isMouth(x);
for (const x of prims) if (share[x.k] !== undefined && !isWear(x) && !(x.after && KIRT && /boot|shoe/i.test(x.name))) sums[x.k] = (sums[x.k] || 0) + Math.sqrt(x.n);
for (const x of prims) {
  if (share[x.k] === undefined || isWear(x) || (x.after && KIRT && /boot|shoe/i.test(x.name))) continue;
  const target = Math.max(200, rest * share[x.k] * Math.sqrt(x.n) / sums[x.k]), ratio = Math.min(1, target / x.n);
  if (ratio < 0.97) simplifyPrimitive(x.p, { simplifier: MeshoptSimplifier, ratio, error: 0.05, lockBorder: false });
  x.after = tri(x.p);
}
// textures: colour only, WebP, sized by what they cover (the face needs the pixels, boots and hair do not)
const SIZE = { body: 1024, cloth: 512, hair: 512, brow: 128, lash: 128, eye: 256 };
for (const m of root.listMaterials()) { m.setNormalTexture(null).setOcclusionTexture(null).setMetallicRoughnessTexture(null).setEmissiveTexture(null); }
for (const m of root.listMaterials()) {
  const t = m.getBaseColorTexture(); if (!t) continue;
  const k = m.getExtras().kind, name = m.getName(); let size = SIZE[k] || 512;
  if (k === 'cloth' && /robe|tunic|bodice|dress|hood|helmet/i.test(name)) size = 1024;
  const q = k === 'body' ? 78 : 70;
  let img = sharp(Buffer.from(t.getImage())).resize(size, size, { fit: 'fill' });
  if (k === 'hair' || k === 'brow') img = img.ensureAlpha(); else img = img.removeAlpha();
  t.setImage(new Uint8Array(await img.webp({ quality: q, alphaQuality: 90 }).toBuffer())).setMimeType('image/webp');
}
await doc.transform(dedup(), quantize({ pattern: /^(NORMAL|TEXCOORD_.*|COLOR_0)$/, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8 }), prune());
await io.write(dst, doc);
console.log(JSON.stringify({ out: dst.split('/').pop(), tris: Math.round(prims.reduce((s, x) => s + (x.after || x.n), 0)), parts: prims.map(x => x.name + ':' + x.k + ':' + Math.round(x.n) + '>' + Math.round(x.after || x.n)).join(' ') }));
