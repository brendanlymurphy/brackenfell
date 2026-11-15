// Step 5 of the tree builder: packs the compact trees written by trees.mjs into what the game loads (src/74b_trees.js):
//   kits/trees.glb       per species two nodes, <name> (near) and <name>_far, each with one wood and one foliage primitive
//   kits/trees_far.webp  flat stand-ins for the distance: each species drawn from two sides (software rasteriser below, no GPU needed)
//   kits/TREES.json      sizes, stand-in tiles, average bark colour, triangle counts, source ids
// usage: node tools/scan/tree_pack.mjs <cache dir with <name>.glb> <kits dir> <name> [<name> ...]
import fs from 'node:fs';
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import * as F from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
const [CACHE, KITS, ...names] = process.argv.slice(2);
const ATLAS = +(process.env.TREE_ATLAS || 1024), WOOD_NEAR = +(process.env.TREE_WOOD || 700), WOOD_FAR = 90, TW = 128, THh = 256, SS = 3;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); await MeshoptSimplifier.ready;
const out = new Document(), buf = out.createBuffer(), scene = out.createScene('trees'); out.getRoot().setDefaultScene(scene);
const info = {}, tiles = [];

// one primitive -> plain arrays (indices always present)
const arrays = p => {
  const P = p.getAttribute('POSITION'), N = p.getAttribute('NORMAL'), U = p.getAttribute('TEXCOORD_0'), n = P.getCount();
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(n * 2), e = [];
  for (let i = 0; i < n; i++) { P.getElement(i, e); pos.set(e.slice(0, 3), i * 3); N.getElement(i, e); nrm.set(e.slice(0, 3), i * 3); U.getElement(i, e); uv.set(e.slice(0, 2), i * 2); }
  const I = p.getIndices(), idx = I ? Uint32Array.from(I.getArray()) : Uint32Array.from({ length: n }, (_, i) => i);
  return { pos, nrm, uv, idx, n };
};
const join = list => {
  const n = list.reduce((s, a) => s + a.n, 0), ni = list.reduce((s, a) => s + a.idx.length, 0), o = { pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), uv: new Float32Array(n * 2), idx: new Uint32Array(ni), n };
  let v = 0, k = 0; for (const a of list) { o.pos.set(a.pos, v * 3); o.nrm.set(a.nrm, v * 3); o.uv.set(a.uv, v * 2); for (let i = 0; i < a.idx.length; i++) o.idx[k++] = a.idx[i] + v; v += a.n; }
  return o;
};
// fewer triangles, then only the vertices still in use
const simplify = (a, tris) => {
  let idx = a.idx;
  for (const err of [0.01, 0.05, 0.2, 1]) { if (idx.length / 3 <= tris * 1.15) break; idx = MeshoptSimplifier.simplify(idx, a.pos, 3, tris * 3, err)[0]; }
  if (idx.length / 3 > tris * 1.5 && MeshoptSimplifier.simplifySloppy) idx = MeshoptSimplifier.simplifySloppy(a.idx, a.pos, 3, null, tris * 3, 1)[0];
  const map = new Int32Array(a.n).fill(-1); let n = 0; for (const i of idx) if (map[i] < 0) map[i] = n++;
  const o = { pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), uv: new Float32Array(n * 2), idx: Uint32Array.from(idx, i => map[i]), n };
  for (let i = 0; i < a.n; i++) { const j = map[i]; if (j < 0) continue; o.pos.set(a.pos.subarray(i * 3, i * 3 + 3), j * 3); o.nrm.set(a.nrm.subarray(i * 3, i * 3 + 3), j * 3); o.uv.set(a.uv.subarray(i * 2, i * 2 + 2), j * 2); }
  return o;
};
// Middle-distance foliage: the scan's own far model is about 15 very large cards, which read as giant leaves at 30 m. Instead keep the
// largest clusters of the near model (a cluster = one connected group of triangles) and grow each about its centre so the crown stays full.
const thin = (a, keep, grow) => {
  const par = Int32Array.from({ length: a.n }, (_, i) => i), find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  for (let t = 0; t < a.idx.length; t += 3) { const r = find(a.idx[t]); par[find(a.idx[t + 1])] = r; par[find(a.idx[t + 2])] = r; }
  const cl = new Map(); for (let i = 0; i < a.n; i++) { const r = find(i); let c = cl.get(r); if (!c) cl.set(r, c = { v: [], c: [0, 0, 0], size: 0 }); c.v.push(i); for (let k = 0; k < 3; k++) c.c[k] += a.pos[i * 3 + k]; }
  for (const c of cl.values()) { for (let k = 0; k < 3; k++) c.c[k] /= c.v.length; for (const i of c.v) c.size = Math.max(c.size, Math.hypot(a.pos[i * 3] - c.c[0], a.pos[i * 3 + 1] - c.c[1], a.pos[i * 3 + 2] - c.c[2])); }
  // spread the kept clusters over the height of the crown: sort by height, keep the largest of every few
  const all = [...cl.values()].sort((p, q) => p.c[1] - q.c[1]), step = Math.max(1, Math.round(1 / keep)), kept = new Set();
  for (let i = 0; i < all.length; i += step) kept.add(all.slice(i, i + step).sort((p, q) => q.size - p.size)[0]);
  const map = new Int32Array(a.n).fill(-1); let n = 0; for (const c of kept) for (const i of c.v) map[i] = n++;
  const o = { pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), uv: new Float32Array(n * 2), idx: [], n };
  for (const c of kept) for (const i of c.v) { const j = map[i]; for (let k = 0; k < 3; k++) { o.pos[j * 3 + k] = c.c[k] + (a.pos[i * 3 + k] - c.c[k]) * grow; o.nrm[j * 3 + k] = a.nrm[i * 3 + k]; } o.uv[j * 2] = a.uv[i * 2]; o.uv[j * 2 + 1] = a.uv[i * 2 + 1]; }
  for (let t = 0; t < a.idx.length; t += 3) if (map[a.idx[t]] >= 0) o.idx.push(map[a.idx[t]], map[a.idx[t + 1]], map[a.idx[t + 2]]);
  o.idx = Uint32Array.from(o.idx); return o;
};
const prim = (a, mat) => out.createPrimitive().setMaterial(mat)
  .setAttribute('POSITION', out.createAccessor().setType('VEC3').setArray(a.pos).setBuffer(buf)).setAttribute('NORMAL', out.createAccessor().setType('VEC3').setArray(a.nrm).setBuffer(buf))
  .setAttribute('TEXCOORD_0', out.createAccessor().setType('VEC2').setArray(a.uv).setBuffer(buf)).setIndices(out.createAccessor().setType('SCALAR').setArray(a.n > 65535 ? a.idx : Uint16Array.from(a.idx)).setBuffer(buf));

// ── a small z-buffered rasteriser for the stand-in pictures ──
const raw = async (img, size) => { const r = await sharp(img).resize(size, size, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: r.data, w: r.info.width, h: r.info.height }; };
function draw(tile, a, tex, view, box, alphaTest, shadeY) {
  const { W, H, col, z } = tile, ca = Math.cos(view), sa = Math.sin(view);
  const X = i => a.pos[i * 3] * ca + a.pos[i * 3 + 2] * sa, D = i => -a.pos[i * 3] * sa + a.pos[i * 3 + 2] * ca, Y = i => a.pos[i * 3 + 1];
  const sx = i => (X(i) - box.cx) / box.w * W + W / 2, sy = i => (1 - Y(i) / box.h) * H;
  for (let t = 0; t < a.idx.length; t += 3) {
    const i0 = a.idx[t], i1 = a.idx[t + 1], i2 = a.idx[t + 2], x0 = sx(i0), y0 = sy(i0), x1 = sx(i1), y1 = sy(i1), x2 = sx(i2), y2 = sy(i2);
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (Math.abs(area) < 1e-6) continue;
    const xa = Math.max(0, Math.floor(Math.min(x0, x1, x2))), xb = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2))), ya = Math.max(0, Math.floor(Math.min(y0, y1, y2))), yb = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const px = x + 0.5, py = y + 0.5, w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) / area, w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) / area, w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const d = w0 * D(i0) + w1 * D(i1) + w2 * D(i2), o = y * W + x; if (d <= z[o]) continue;
      let u = w0 * a.uv[i0 * 2] + w1 * a.uv[i1 * 2] + w2 * a.uv[i2 * 2], v = w0 * a.uv[i0 * 2 + 1] + w1 * a.uv[i1 * 2 + 1] + w2 * a.uv[i2 * 2 + 1];
      u -= Math.floor(u); v -= Math.floor(v);
      const q = (Math.min(tex.h - 1, Math.floor(v * tex.h)) * tex.w + Math.min(tex.w - 1, Math.floor(u * tex.w))) * 4;
      if (alphaTest && tex.d[q + 3] < alphaTest) continue;
      const s = shadeY ? 0.72 + 0.28 * Math.min(1, (w0 * Y(i0) + w1 * Y(i1) + w2 * Y(i2)) / box.h * 1.4) : 0.8;      // crowns are darker low down, where less sky reaches
      z[o] = d; col[o * 4] = tex.d[q] * s; col[o * 4 + 1] = tex.d[q + 1] * s; col[o * 4 + 2] = tex.d[q + 2] * s; col[o * 4 + 3] = 255;
    }
  }
}

for (const name of names) {
  const doc = await io.read(`${CACHE}/${name}.glb`), nodes = doc.getRoot().listNodes(), near = nodes.find(n => n.getName() === name), far = nodes.find(n => n.getName() === name + '_far');
  const ex = near.getExtras(), isWood = p => p.getMaterial().getAlphaMode() === 'OPAQUE';
  const woodP = near.getMesh().listPrimitives().filter(isWood).sort((a, b) => arrays(b).idx.length - arrays(a).idx.length);       // the trunk first: its bark is used for all the wood
  const woodAll = join(woodP.map(arrays)), woodNear = simplify(woodAll, WOOD_NEAR), woodFar = simplify(arrays(woodP[0]), WOOD_FAR);
  const leafNear = arrays(near.getMesh().listPrimitives().find(p => !isWood(p))), leafFar = thin(leafNear, +(process.env.TREE_KEEP || 0.25), +(process.env.TREE_GROW || 1.75));
  const atlasImg = near.getMesh().listPrimitives().find(p => !isWood(p)).getMaterial().getBaseColorTexture().getImage(), barkImg = woodP[0].getMaterial().getBaseColorTexture().getImage();
  const atlasWebp = await sharp(atlasImg).resize(ATLAS, ATLAS, { fit: 'fill' }).webp({ quality: 80, alphaQuality: 85, effort: 6 }).toBuffer();
  const barkWebp = await sharp(barkImg).resize(256, 256, { fit: 'fill' }).webp({ quality: 78, effort: 6 }).toBuffer();
  const mWood = out.createMaterial(name + '_wood').setBaseColorTexture(out.createTexture(name + '_bark').setImage(barkWebp).setMimeType('image/webp')).setRoughnessFactor(1).setMetallicFactor(0);
  const mLeaf = out.createMaterial(name + '_foliage').setBaseColorTexture(out.createTexture(name + '_atlas').setImage(atlasWebp).setMimeType('image/webp')).setAlphaMode('MASK').setAlphaCutoff(0.5).setDoubleSided(true).setRoughnessFactor(1).setMetallicFactor(0);
  scene.addChild(out.createNode(name).setMesh(out.createMesh(name).addPrimitive(prim(woodNear, mWood)).addPrimitive(prim(leafNear, mLeaf))));
  scene.addChild(out.createNode(name + '_far').setMesh(out.createMesh(name + '_far').addPrimitive(prim(woodFar, mWood)).addPrimitive(prim(leafFar, mLeaf))));
  // bounds about the trunk's foot, for the stand-in quad and for placing
  let rad = 0, top = 0, cx0 = 1e9, cx1 = -1e9, cz0 = 1e9, cz1 = -1e9;
  for (let i = 0; i < leafNear.n; i++) { const x = leafNear.pos[i * 3], y = leafNear.pos[i * 3 + 1], z = leafNear.pos[i * 3 + 2]; rad = Math.max(rad, Math.hypot(x, z)); top = Math.max(top, y); cx0 = Math.min(cx0, x); cx1 = Math.max(cx1, x); cz0 = Math.min(cz0, z); cz1 = Math.max(cz1, z); }
  const barkRaw = await raw(barkImg, 64), atlasRaw = await raw(atlasImg, 1024); let br = 0, bg = 0, bb = 0; for (let i = 0; i < 64 * 64; i++) { br += barkRaw.d[i * 4]; bg += barkRaw.d[i * 4 + 1]; bb += barkRaw.d[i * 4 + 2]; }
  const halfW = Math.max(-cx0, cx1, -cz0, cz1) * 1.02, H = top * 1.01, myTiles = [];
  for (const view of [0, Math.PI / 2]) {
    const W = TW * SS, Hh = THh * SS, tile = { W, H: Hh, col: new Float32Array(W * Hh * 4), z: new Float32Array(W * Hh).fill(-1e9) }, box = { cx: 0, w: halfW * 2, h: H };
    draw(tile, woodNear, await raw(barkImg, 256), view, box, 0, false); draw(tile, leafNear, atlasRaw, view, box, 90, true);
    // box-filter down; colour is averaged over the covered samples only, so edges do not darken
    const px = new Uint8Array(TW * THh * 4);
    for (let y = 0; y < THh; y++) for (let x = 0; x < TW; x++) { let r = 0, g = 0, b = 0, n = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const o = ((y * SS + j) * W + x * SS + i) * 4; if (tile.col[o + 3]) { r += tile.col[o]; g += tile.col[o + 1]; b += tile.col[o + 2]; n++; } }
      const o = (y * TW + x) * 4; if (n) { px[o] = r / n; px[o + 1] = g / n; px[o + 2] = b / n; } px[o + 3] = Math.round(255 * n / (SS * SS)); }
    // spread colour into the empty pixels around the tree, so filtering and mip levels do not pull in black
    for (let pass = 0; pass < 24; pass++) { const src = px.slice(); for (let y = 0; y < THh; y++) for (let x = 0; x < TW; x++) { const o = (y * TW + x) * 4; if (src[o + 3] || src[o] + src[o + 1] + src[o + 2]) continue; let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= TW || yy >= THh) continue; const q = (yy * TW + xx) * 4; if (src[q + 3] || src[q] + src[q + 1] + src[q + 2]) { r += src[q]; g += src[q + 1]; b += src[q + 2]; n++; } }
      if (n) { px[o] = Math.max(1, r / n); px[o + 1] = Math.max(1, g / n); px[o + 2] = Math.max(1, b / n); } } }
    myTiles.push(tiles.length); tiles.push(px);
  }
  info[name] = { source: ex.source, height: +H.toFixed(2), halfWidth: +halfW.toFixed(2), crownRadius: +rad.toFixed(2), crownBase: +Math.min(...Array.from({ length: leafNear.n }, (_, i) => leafNear.pos[i * 3 + 1])).toFixed(2), tiles: myTiles,
    bark: [br, bg, bb].map(v => +(v / (64 * 64) / 255).toFixed(3)), tris: { wood: woodNear.idx.length / 3, leaves: leafNear.idx.length / 3, woodFar: woodFar.idx.length / 3, leavesFar: leafFar.idx.length / 3 } };
  console.log(name, JSON.stringify(info[name].tris), 'height', info[name].height, 'half width', info[name].halfWidth);
}
out.createExtension(EXTTextureWebP).setRequired(true);
await out.transform(F.quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }), F.prune());
await io.write(`${KITS}/trees.glb`, out);
const AW = TW * tiles.length, sheet = Buffer.alloc(AW * THh * 4);
tiles.forEach((px, t) => { for (let y = 0; y < THh; y++) sheet.set(px.subarray(y * TW * 4, (y + 1) * TW * 4), (y * AW + t * TW) * 4); });
await sharp(sheet, { raw: { width: AW, height: THh, channels: 4 } }).webp({ quality: 86, alphaQuality: 90, effort: 6, exact: true }).toFile(`${KITS}/trees_far.webp`);
fs.writeFileSync(`${KITS}/TREES.json`, JSON.stringify({ tile: [TW, THh], count: tiles.length, atlas: ATLAS, species: info }, null, 1));
console.log('trees.glb', (fs.statSync(`${KITS}/trees.glb`).size / 1024).toFixed(0) + ' KB, trees_far.webp', (fs.statSync(`${KITS}/trees_far.webp`).size / 1024).toFixed(0) + ' KB,', tiles.length, 'tiles');
