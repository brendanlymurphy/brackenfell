// [ch4] Packs a still (unrigged) animal: node tools/animals/pack_static.mjs <raw.glb> <out.glb>. Every texture to WebP at 1024, cut-out hair (alpha) as MASK at 0.5,
// geometry compressed (meshopt). The raw file holds one mesh per pose ("horse_stand", "horse_graze") and its light copy ("@far"), from tools/animals/horse_export.py.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import { prune, dedup, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp'; import fs from 'node:fs';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const [src, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src), root = doc.getRoot(); doc.createExtension(EXTTextureWebP).setRequired(false);
for (const t of root.listTextures()) { const nrm = /norm/i.test(t.getName()); const b = await sharp(Buffer.from(t.getImage())).resize(1024, 1024, { fit: 'fill' }).webp({ quality: nrm ? 90 : 82, alphaQuality: 90, effort: 6 }).toBuffer(); t.setImage(new Uint8Array(b)).setMimeType('image/webp'); }
for (const m of root.listMaterials()) { m.setMetallicFactor(0).setRoughnessFactor(0.85); if (m.getAlphaMode() !== 'OPAQUE') m.setAlphaMode('MASK').setAlphaCutoff(0.5).setDoubleSided(true); }
await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(out, doc); console.log(out, (fs.statSync(out).size / 1024 | 0) + ' KB');
