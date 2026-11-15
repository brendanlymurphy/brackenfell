// Converts downloaded Poly Haven models into compact per-model GLBs (cache), ready for pack.mjs.
// usage: node tools/scan/convert.mjs <accepted.txt> <download dir> <cache dir> [ids...]
// needs (outside the repo): @gltf-transform/core, /functions, /extensions, meshoptimizer, sharp
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTTextureWebP } from '@gltf-transform/extensions';
import * as F from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [listFile, SRC, OUT, ...only] = process.argv.slice(2);
const list = fs.readFileSync(listFile, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l[0].startsWith('#')).map(l => l.split(/\s+/));
fs.mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const log = (...a) => console.log(...a);
// where the flame sits on lamps that have no modelled flame: [x, y, z] as fractions of the bounding box
const LIGHT_AT = { Lantern_01: [0.5, 0.47, 0.5], wooden_lantern_01: [0.5, 0.33, 0.5], wooden_candlestick: [0.5, 1.04, 0.5], stone_fire_pit: [0.5, 0.75, 0.5] };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const diagOf = b => Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
const trisOf = prim => (prim.getIndices() ? prim.getIndices().getCount() : prim.getAttribute('POSITION').getCount()) / 3;

// triangle budget for one object of a category with a given bounding diagonal (metres)
function budget(cat, diag) {
  const k = Math.sqrt(clamp(diag, 0.05, 6));
  switch (cat) {
    case 'prop-small': case 'food': return clamp(Math.round(2100 * k), 400, 1500);
    case 'tool': return clamp(Math.round(1300 * k), 500, 1500);
    case 'weapon': return clamp(Math.round(3000 * k), 1200, 3000);      // weapons are seen up close in the hand
    case 'container': return clamp(Math.round(1500 * k), 500, 2000);
    case 'light-source': return clamp(Math.round(2400 * k), 600, 2000);
    case 'prop-furniture': return clamp(Math.round(2000 * k), 1200, 3000);
    case 'decor': return clamp(Math.round(2400 * k), 800, 3000);
    case 'structure': return clamp(Math.round(2200 * k), 2000, 6000);
    case 'rock': return clamp(Math.round(1100 * k), 250, 2500);
    case 'ground-cover': return clamp(Math.round(1100 * k), 300, 2000);
    case 'plant': return clamp(Math.round(1500 * k), 300, 1500);
    default: return 1500;
  }
}
// PNG/JPG alpha map -> combined RGBA with the colour image
async function withAlpha(colorBuf, alphaBuf) {
  const c = sharp(colorBuf).removeAlpha(), meta = await c.metadata();
  const a = await sharp(alphaBuf).resize(meta.width, meta.height).greyscale().raw().toBuffer();
  return c.joinChannel(a, { raw: { width: meta.width, height: meta.height, channels: 1 } }).png().toBuffer();
}
function alphaMapFor(id, files, matName, uri) {
  const keys = Object.keys(files).filter(k => /alpha|opacity/i.test(k) && !/glass/i.test(k));
  if (!keys.length) return null;
  const m = /_([a-z0-9]+)_diff_/i.exec(uri.replace(id + '_', '_'));       // e.g. twigs, leaves, bristles
  const part = m ? m[1].toLowerCase() : '';
  let key = keys.find(k => part && k.toLowerCase().startsWith(part.replace(/s$/, ''))) || (keys.length === 1 ? keys[0] : keys.find(k => /^alpha$|^opacity$/i.test(k)));
  if (!key) return null;
  return key;
}
// merges vertices that share position and uv (scans often carry needless splits from tiny normal differences); normals are averaged
function weldPosUV(doc, prim) {
  const pos = prim.getAttribute('POSITION'), uv = prim.getAttribute('TEXCOORD_0'), nrm = prim.getAttribute('NORMAL'), idx = prim.getIndices();
  if (!pos || !uv) return;
  const P = pos.getArray(), Uv = uv.getArray(), N = nrm ? nrm.getArray() : null, n = pos.getCount(), us = uv.getElementSize();
  const map = new Map(), remap = new Uint32Array(n), np = [], nu = [], nn = [];
  for (let i = 0; i < n; i++) {
    const k = P[i * 3] + ',' + P[i * 3 + 1] + ',' + P[i * 3 + 2] + '|' + Uv[i * us] + ',' + Uv[i * us + 1];
    let j = map.get(k);
    if (j === undefined) { j = np.length / 3; map.set(k, j); np.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); nu.push(Uv[i * us], Uv[i * us + 1]); nn.push(0, 0, 0); }
    if (N) { nn[j * 3] += N[i * 3]; nn[j * 3 + 1] += N[i * 3 + 1]; nn[j * 3 + 2] += N[i * 3 + 2]; }
    remap[i] = j;
  }
  const cnt = idx ? idx.getCount() : n, ni = new Uint32Array(cnt);
  for (let i = 0; i < cnt; i++) ni[i] = remap[idx ? idx.getScalar(i) : i];
  for (let j = 0; j < nn.length; j += 3) { const l = Math.hypot(nn[j], nn[j + 1], nn[j + 2]) || 1; nn[j] /= l; nn[j + 1] /= l; nn[j + 2] /= l; }
  const buf = doc.getRoot().listBuffers()[0];
  prim.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(np)).setBuffer(buf));
  prim.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(nu)).setBuffer(buf));
  if (N) prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nn)).setBuffer(buf));
  prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(ni).setBuffer(buf));
}
// connected components of a primitive -> centroids (used for flames)
function componentCentroids(prim) {
  const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), n = pos.getCount(), par = new Int32Array(n).map((_, i) => i);
  const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  // weld by position first so shared corners connect
  const key = new Map(), rep = new Int32Array(n), p = [0, 0, 0];
  for (let i = 0; i < n; i++) { pos.getElement(i, p); const k = p.map(v => Math.round(v * 1e4)).join(','); if (!key.has(k)) key.set(k, i); rep[i] = key.get(k); }
  const cnt = idx ? idx.getCount() : n, at = i => rep[idx ? idx.getScalar(i) : i];
  for (let i = 0; i < cnt; i += 3) { const a = find(at(i)), b = find(at(i + 1)), c = find(at(i + 2)); par[b] = a; par[c] = a; }
  const acc = new Map();
  for (let i = 0; i < n; i++) { const r = find(rep[i]); pos.getElement(i, p); let a = acc.get(r); if (!a) acc.set(r, a = [0, 0, 0, 0, -1e9, 1e9]); a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++; a[4] = Math.max(a[4], p[1]); a[5] = Math.min(a[5], p[1]); }
  return [...acc.values()].filter(a => a[3] >= 3).map(a => [a[0] / a[3], (a[4] + a[5]) / 2, a[2] / a[3]]);
}

async function convert(id, cat) {
  const dir = `${SRC}/${id}`, files = JSON.parse(fs.readFileSync(`${dir}/files.json`, 'utf8'));
  const doc = await io.read(`${dir}/${id}.gltf`), root = doc.getRoot();
  for (const a of root.listAnimations()) a.dispose(); for (const s of root.listSkins()) s.dispose(); for (const c of root.listCameras()) c.dispose();
  // ── materials: plain metal-rough PBR, alpha where the model needs it ──
  const flameMats = new Set();
  for (const m of root.listMaterials()) {
    const name = m.getName();
    for (const e of m.listExtensions()) m.setExtension(e.extensionName, null);
    const tex = m.getBaseColorTexture();
    if (/flame/i.test(name)) { flameMats.add(m); continue; }
    if (/glass/i.test(name)) { m.setAlphaMode('BLEND').setBaseColorTexture(null).setBaseColorFactor([0.75, 0.8, 0.78, 0.22]).setMetallicFactor(0).setRoughnessFactor(0.12).setMetallicRoughnessTexture(null).setNormalTexture(null); continue; }
    const uri = tex ? (tex.getURI() || '') : '';
    const wantsAlpha = m.getAlphaMode() !== 'OPAQUE' || /twig|leaves|bristle/i.test(name);
    if (tex && wantsAlpha) {
      const key = alphaMapFor(id, files, name, uri), mapFile = key && fs.readdirSync(`${dir}/maps`).find(f => f.startsWith(key + '.'));
      if (mapFile) {
        const a = fs.readFileSync(`${dir}/maps/${mapFile}`);
        const nt = doc.createTexture(name + '_rgba').setImage(await withAlpha(tex.getImage(), a)).setMimeType('image/png');
        m.setBaseColorTexture(nt); m.setAlphaMode('MASK').setAlphaCutoff(0.5).setDoubleSided(true);
      } else { log('  no alpha map for', name); m.setAlphaMode('OPAQUE'); }
    } else m.setAlphaMode('OPAQUE');
    const mr = m.getMetallicRoughnessTexture();
    if (mr && /_arm_/i.test(mr.getURI() || '') && !m.getOcclusionTexture()) m.setOcclusionTexture(mr);
  }
  for (const e of root.listExtensionsUsed()) if (e.extensionName !== 'KHR_texture_transform') e.dispose();
  // is this a metal object? (blue channel of the ORM map) Level code needs to know, because bare metal is black without reflections
  let metal = 0;
  for (const m of root.listMaterials()) { const t = m.getMetallicRoughnessTexture(); if (t && t.getImage() && m.getMetallicFactor() > 0.5) { const st = await sharp(t.getImage()).stats(); metal = Math.max(metal, +(st.channels[2].mean / 255).toFixed(2)); } }
  // ── bake node transforms, then group root nodes into objects (things that touch belong together) ──
  await doc.transform(F.flatten());
  const nodes = root.listNodes().filter(n => n.getMesh());
  for (const n of nodes) F.clearNodeTransform(n);
  const lights = [];
  for (const n of nodes) for (const p of n.getMesh().listPrimitives()) if (flameMats.has(p.getMaterial())) { lights.push(...componentCentroids(p)); p.dispose(); }
  const items = nodes.filter(n => n.getMesh().listPrimitives().length).map(n => ({ n, b: F.getBounds(n) }));
  const par = items.map((_, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
  const touch = (a, b) => { const e = 0.012; for (let k = 0; k < 3; k++) if (a.min[k] - e > b.max[k] || b.min[k] - e > a.max[k]) return false; return true; };
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (touch(items[i].b, items[j].b)) par[find(j)] = find(i);
  const groups = new Map(); items.forEach((it, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(it); });
  let objs = [...groups.values()].map(g => {
    const b = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }; for (const it of g) for (let k = 0; k < 3; k++) { b.min[k] = Math.min(b.min[k], it.b.min[k]); b.max[k] = Math.max(b.max[k], it.b.max[k]); }
    return { g, b, diag: diagOf(b) };
  }).sort((a, b) => b.diag - a.diag);
  if (objs.length > 8) { for (const o of objs.slice(8)) for (const it of o.g) it.n.dispose(); objs = objs.slice(0, 8); }
  const scene = root.listScenes()[0], out = [], base = id.toLowerCase();
  objs.forEach((o, oi) => {
    // join primitives per material into one mesh
    const byMat = new Map();
    for (const it of o.g) for (const p of it.n.getMesh().listPrimitives()) { if (p.getMode() !== 4) continue; const k = p.getMaterial(); if (!byMat.has(k)) byMat.set(k, []); byMat.get(k).push(p); }
    const mesh = doc.createMesh(base);
    for (const prims of byMat.values()) {
      for (const p of prims) for (const s of p.listSemantics()) if (!['POSITION', 'NORMAL', 'TEXCOORD_0'].includes(s)) p.setAttribute(s, null);
      for (const p of prims) for (const t of p.listTargets()) p.removeTarget(t);
      mesh.addPrimitive(prims.length > 1 ? F.joinPrimitives(prims) : prims[0].clone());
    }
    const single = objs.length === 1, name = single ? base : base + '_' + String.fromCharCode(97 + oi);
    const node = doc.createNode(name).setMesh(mesh); scene.addChild(node);
    // set members get their own pivot: centre of the footprint, resting on y = 0
    const off = single ? [0, 0, 0] : [-(o.b.min[0] + o.b.max[0]) / 2, -o.b.min[1], -(o.b.min[2] + o.b.max[2]) / 2];
    if (!single) F.transformMesh(mesh, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, off[0], off[1], off[2], 1]);
    const inside = lights.filter(l => l[0] >= o.b.min[0] - 0.05 && l[0] <= o.b.max[0] + 0.05 && l[2] >= o.b.min[2] - 0.05 && l[2] <= o.b.max[2] + 0.05).map(l => [l[0] + off[0], l[1] + off[1], l[2] + off[2]].map(v => +v.toFixed(3)));
    // simplify
    const before = mesh.listPrimitives().reduce((s, p) => s + trisOf(p), 0), bud = budget(cat, o.diag);
    // Simplify in two steps of growing allowed error (fraction of the object's size). Scanned rock forgives a lot;
    // furniture and pots have inner walls that poke through if pushed too far, so those stop early and keep more triangles.
    const organic = cat === 'rock' || cat === 'ground-cover' || cat === 'structure', steps = organic ? [0.03, 0.12] : cat === 'plant' ? [0.012, 0.03] : [0.006, 0.016];
    // every primitive gets its share of the budget, so parts that cannot shrink (alpha cards) do not starve the rest
    const share = new Map(mesh.listPrimitives().map(p => [p, bud * trisOf(p) / before]));
    for (const err of steps) {
      const cur = mesh.listPrimitives().reduce((s, p) => s + trisOf(p), 0);
      if (cur <= bud * (err === steps[0] ? 2.6 : 1.25)) break;        // already light enough: leave the artist's mesh alone
      for (const p of mesh.listPrimitives()) {
        const t = share.get(p), c = trisOf(p); if (c <= t * 1.25) continue;
        weldPosUV(doc, p); F.simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: clamp(t / c, 0.002, 1), error: err, lockBorder: false });
      }
    }
    const after = mesh.listPrimitives().reduce((s, p) => s + trisOf(p), 0);
    if (LIGHT_AT[id] && !inside.length) { const f = LIGHT_AT[id]; inside.push([0, 1, 2].map(k => +(o.b.min[k] + f[k] * (o.b.max[k] - o.b.min[k]) + off[k]).toFixed(3))); }
    node.setExtras({ source: id, category: cat, lights: inside, diag: +o.diag.toFixed(3), metal });
    out.push(`${name} ${Math.round(before)}->${Math.round(after)} (budget ${bud}, ${o.diag.toFixed(2)} m)`);
  });
  for (const it of items) it.n.dispose();
  await doc.transform(F.prune({ keepAttributes: false, keepLeaves: false }));
  // ── textures: WebP, sized by how big the thing is ──
  doc.createExtension(EXTTextureWebP).setRequired(true);
  const maxDiag = Math.max(...objs.map(o => o.diag)), large = maxDiag >= 1.0 || cat === 'structure' || cat === 'prop-furniture';
  const hiNormal = cat === 'structure' || (cat === 'rock' && maxDiag >= 2.5);
  for (const t of root.listTextures()) {
    const slots = F.listTextureSlots(t), img = t.getImage(); if (!img) continue;
    const isColor = slots.includes('baseColorTexture'), isNormal = slots.includes('normalTexture');
    const size = isColor ? (large ? 1024 : 512) : isNormal ? (hiNormal ? 1024 : 512) : (large ? 512 : 256);
    const meta = await sharp(img).metadata(), w = Math.min(size, meta.width), h = Math.min(size, meta.height);
    const buf = await sharp(img).resize(w, h, { fit: 'fill' }).webp(isColor ? { quality: 80, alphaQuality: 92, effort: 5 } : isNormal ? { quality: 88, effort: 5 } : { quality: 72, effort: 5 }).toBuffer();
    t.setImage(buf).setMimeType('image/webp').setURI('');
  }
  await doc.transform(F.dedup(), F.prune());
  await io.write(`${OUT}/${id}.glb`, doc);
  log(id, '[' + cat + ']', (fs.statSync(`${OUT}/${id}.glb`).size / 1024).toFixed(0) + ' KB |', out.join(' | '));
}
for (const [id, cat] of list) {
  if (only.length && !only.includes(id)) continue;
  if (cat === 'tree') continue;                    // trees are built by trees.mjs
  try { await convert(id, cat); } catch (e) { log('FAIL', id, e.stack.split('\n').slice(0, 3).join(' / ')); }
}
