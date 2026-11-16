// Shrinks what the game downloads, in place, and writes the small-texture variants phones use. Safe to run again.
//   1. geometry and animation in every GLB under kits/ and chars/real/ is stored with EXT_meshopt_compression (lossless here: the
//      attributes keep the types they have; the game's loaders carry the decoder, T3X.MeshoptDecoder);
//   2. kits/s/<pack>.glb: the same packs with colour and data textures at half size (512), for devices whose texture cap is 512
//      (phones, Low and Medium: see gfxTexInit in src/10_gfx.js); kits/skin/s/*.webp likewise; kits/s/trees.glb with 1024 atlases.
// usage: node tools/assets_pack.mjs [--only kits|chars|small]
// After tools/scan/tree_pack.mjs or tools/chars_lod.mjs or tools/kits*.mjs have rewritten a file, run this again.
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP } from '@gltf-transform/extensions';
import * as F from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null, kb = f => (fs.statSync(f).size / 1024 | 0) + ' KB';
const pack = async (src, dst, texMax, slim) => {
  const before = fs.statSync(src).size, doc = await io.read(src);
  // character bodies: normals, texture coordinates and skin weights as small integers (the game reads them through getComponent, which
  // turns them back into numbers); positions stay as they are, because 49_chars.js merges meshes without their node transforms
  if (slim) await doc.transform(F.quantize({ pattern: /^(NORMAL|TANGENT|TEXCOORD|JOINTS|WEIGHTS)(_\d+)?$/, quantizeNormal: 8, quantizeTexcoord: 12, quantizeWeight: 8 }));
  if (texMax) for (const t of doc.getRoot().listTextures()) { const im = t.getImage(), s = t.getSize(); if (!im || !s || Math.max(s[0], s[1]) <= texMax) continue;
    const k = texMax / Math.max(s[0], s[1]), meta = await sharp(im).metadata(), color = F.listTextureSlots(t).some(x => /baseColor|emissive/.test(x));
    t.setImage(await sharp(im).resize(Math.round(s[0] * k), Math.round(s[1] * k), { fit: 'fill' }).webp(meta.hasAlpha ? { quality: 82, alphaQuality: 88, effort: 6 } : color ? { quality: 80, effort: 6 } : { quality: 86, effort: 6 }).toBuffer()).setMimeType('image/webp'); doc.createExtension(EXTTextureWebP).setRequired(true); }
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });      // byte-level compression only: nothing is re-quantized
  await io.write(dst, doc); console.log(dst, (before / 1024 | 0) + ' KB >', kb(dst));
};
if (!only || only === 'kits') for (const f of fs.readdirSync('kits').filter(f => f.endsWith('.glb'))) await pack('kits/' + f, 'kits/' + f);
if (!only || only === 'chars') for (const f of fs.readdirSync('chars/real').filter(f => f.endsWith('.glb'))) await pack('chars/real/' + f, 'chars/real/' + f, 0, f !== 'clips.glb');
if (!only || only === 'small') {
  fs.mkdirSync('kits/s', { recursive: true }); fs.mkdirSync('kits/skin/s', { recursive: true });
  for (const f of ['village.glb', 'props.glb', 'nature.glb']) await pack('kits/' + f, 'kits/s/' + f, 512);
  await pack('kits/trees.glb', 'kits/s/trees.glb', 1024);
  for (const f of fs.readdirSync('kits/skin').filter(f => /\.(webp|png|jpg)$/.test(f))) {
    const m = await sharp('kits/skin/' + f).metadata(), w = Math.max(4, Math.round(m.width / 2)), h = Math.max(4, Math.round(m.height / 2)), out = 'kits/skin/s/' + f.replace(/\.(png|jpg)$/, '.webp');
    if (Math.max(m.width, m.height) <= 512) { fs.copyFileSync('kits/skin/' + f, 'kits/skin/s/' + f); continue; }
    await sharp('kits/skin/' + f).resize(w, h, { fit: 'fill' }).webp(m.hasAlpha ? { quality: 82, alphaQuality: 88, effort: 6 } : /_n\.|_orm\.|_r\./.test(f) ? { quality: 86, effort: 6 } : { quality: 80, effort: 6 }).toFile(out);
  }
  console.log('kits/skin', (fs.readdirSync('kits/skin').filter(f => /\.(webp|png|jpg)$/.test(f)).reduce((a, f) => a + fs.statSync('kits/skin/' + f).size, 0) / 1048576).toFixed(2) + ' MB > kits/skin/s', (fs.readdirSync('kits/skin/s').reduce((a, f) => a + fs.statSync('kits/skin/s/' + f).size, 0) / 1048576).toFixed(2) + ' MB');
}
