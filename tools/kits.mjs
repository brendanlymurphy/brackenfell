// Converts the downloaded Quaternius kits into web-ready files under kits/:
//   kits/village.glb, kits/props.glb, kits/nature.glb, kits/dungeon.glb  (every piece = one named top-level node at the origin)
//   kits/CATALOG.json  (bbox, triangles, materials, category, notes per piece)
// usage: node tools/kits.mjs [source dir = /home/claude/ext/kits] [only kit ...]
// Source archives (CC0): see kits/PROVENANCE.md.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { NodeIO, Document } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP } from '@gltf-transform/extensions';
import { mergeDocuments, dedup, prune, weld, quantize, textureCompress, flatten, join, unpartition, simplifyPrimitive, getBounds, clearNodeTransform, clearNodeParent } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';

const SRC = process.argv[2] || '/home/claude/ext/kits', ONLY = process.argv.slice(3);
const ROOT = new URL('../', import.meta.url).pathname, OUT = ROOT + 'kits/';
fs.mkdirSync(OUT, { recursive: true });
const KITS = [
  { id: 'village', gltf: 'medieval_village_megakitstandard/glTF', tex: ['medieval_village_megakitstandard/glTF'] },
  { id: 'props', gltf: 'fantasy_props_megakitstandard/Exports/glTF', tex: ['fantasy_props_megakitstandard/Textures'] },
  { id: 'nature', gltf: 'stylized_nature_megakitstandard/glTF', tex: ['stylized_nature_megakitstandard/glTF'], simplifyAbove: 6000 },
  { id: 'dungeon', gltf: null },      // filled below if the old dungeon pack has glTF files
];
// one process per kit: converting two kits in the same process leaves Node with an unsettled promise and it exits silently
if (!ONLY.length) {
  if (fs.existsSync(OUT + 'CATALOG.json')) fs.rmSync(OUT + 'CATALOG.json');
  for (const k of ['village', 'props', 'nature', 'dungeon']) execFileSync(process.execPath, [new URL(import.meta.url).pathname, SRC, k], { stdio: 'inherit' });
  process.exit(0);
}
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP]);

// ── categories guessed from the piece name ──
function category(kit, n) {
  const L = n.toLowerCase();
  if (kit === 'village') {
    if (L.startsWith('wall_')) return L.includes('door') ? 'wall-door' : L.includes('window') ? 'wall-window' : 'wall';
    if (L.startsWith('corner_')) return 'corner';
    if (L.startsWith('doorframe')) return 'doorframe';
    if (L.startsWith('door_')) return 'door';
    if (L.startsWith('windowshutters')) return 'shutter';
    if (L.startsWith('window_')) return 'window';
    if (L.startsWith('floor_') || L.startsWith('holecover')) return 'floor';
    if (L.startsWith('roof_')) return /roundtiles_\d+x\d+$|roof_tower|roof_2x4/.test(L) ? 'roof' : 'roof-part';
    if (L.startsWith('overhang')) return 'overhang';
    if (L.startsWith('stair')) return L.includes('interior') ? 'stair-interior' : 'stair-exterior';
    if (L.startsWith('balcony')) return 'balcony';
    if (L.includes('vine')) return 'vine';
    if (L.includes('fence')) return 'fence';
    if (L.includes('chimney')) return 'chimney';
    return 'prop-exterior';
  }
  if (kit === 'props') {
    if (/candle|chandelier|lantern|torch/.test(L)) return 'light-source';
    if (/^(bed|bench|bookcase|cabinet|chair|nightstand|shelf|stool|table_large|workbench|bookstand|stall|weaponstand|peg_rack|barrel_holder|dummy|anvil)/.test(L)) return 'prop-furniture';
    if (/^(barrel|crate|farmcrate|chest|bag|bucket|cauldron|cage|pot_|vase|pouch_large)/.test(L)) return 'prop-container';
    if (/^(sword|axe|pickaxe|shield|whetstone)/.test(L)) return 'prop-weapon';
    if (/banner/.test(L)) return 'prop-banner';
    return 'prop-small';
  }
  if (kit === 'nature') {
    if (/tree|pine_/.test(L)) return 'tree';
    if (/^rock_medium/.test(L)) return 'rock';
    if (/pebble|rockpath/.test(L)) return 'rock-small';
    if (/grass/.test(L)) return 'grass';
    if (/bush/.test(L)) return 'bush';
    return 'plant';
  }
  return 'dungeon';
}
// fixed knowledge about the village kit, measured from the files (metres)
function notes(kit, n, size, min, max) {
  const o = {};
  if (kit !== 'village') return o;
  let m;
  if (/^Wall_/.test(n) && size[0] > 1.9) { o.module = [2, 3]; o.pivot = 'bottom centre of the 2 m span; local x -1..1, y 0..3 (trim to 3.12)'; o.front = 'outside face = local +z (stone base, sills, shutters and balconies are on +z); the inside face is at z about -0.1 and the ceiling beam reaches z ' + min[2]; }
  if ((m = /^Roof_RoundTiles_(\d+)x(\d+)$/.exec(n))) { o.fits = [+m[1], +m[2]]; o.ridge = 'along z: the first number is the span across x (gable ends face +z and -z, close them with Roof_Front_Brick<span>), the second the length along z'; o.pivot = 'centre of the footprint at wall-top height (y 0 = top of the walls); eaves hang to y ' + min[1]; }
  if (n === 'Roof_Tower_RoundTiles') { o.fits = [4, 4]; o.pivot = 'centre of a 4x4 m tower footprint at wall-top height'; }
  if (/^Floor_/.test(n) && size[0] >= 2) o.module = [2, 2];
  if (/^Stair_Interior/.test(n)) o.rise = +max[1].toFixed(2);
  if ((m = /^Roof_Front_Brick(\d)/.exec(n))) { o.fits = [+m[1], 0]; o.use = 'timber-and-plaster gable for a roof of this span; place at the roof pivot height on the gable wall line, outside = +z'; }
  if (/^Door_\d/.test(n)) o.pivot = 'hinge edge at x 0, the leaf extends to x +1.07; put it at x -0.54 of a door wall module';
  if (/^(Window_|WindowShutters_|DoorFrame_)/.test(n) && !/Roof/.test(n)) o.pivot = 'same pivot as the wall module it belongs to (bottom centre of the 2 m span)';
  if (/^Balcony_/.test(n)) o.pivot = 'wall module pivot at floor level; the rail stands 1 m out on +z';
  if (n === 'Roof_RoundTiles_8x14') o.warn = 'this piece has no modelled tiles and stretched UVs in the free tier: use 8x12 or two shorter roofs instead';
  return o;
}

function stage(k) {       // one flat temp folder so every image uri resolves
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-' + k.id + '-'));
  for (const f of fs.readdirSync(path.join(SRC, k.gltf))) if (/\.(gltf|bin|png|jpe?g)$/i.test(f)) fs.symlinkSync(path.join(SRC, k.gltf, f), path.join(dir, f));
  for (const t of k.tex) for (const f of fs.readdirSync(path.join(SRC, t))) if (/\.(png|jpe?g)$/i.test(f) && !fs.existsSync(path.join(dir, f))) fs.symlinkSync(path.join(SRC, t, f), path.join(dir, f));
  return dir;
}
// connected parts of a primitive (vertices joined by triangles or sharing a position), each with its bounding box
function components(node, prim) {
  const M = node.getWorldMatrix(), pos = prim.getAttribute('POSITION'), I = prim.getIndices().getArray(), n = pos.getCount(), par = new Int32Array(n).map((_, i) => i), key = new Map(), P = [];
  const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  for (let i = 0; i < n; i++) { const e = pos.getElement(i, []), w = [M[0] * e[0] + M[12], M[5] * e[1] + M[13], M[10] * e[2] + M[14]]; P.push(w); const k = w.map(v => Math.round(v * 500)).join(','); if (key.has(k)) par[find(i)] = find(key.get(k)); else key.set(k, i); }
  for (let i = 0; i < I.length; i += 3) { par[find(I[i])] = find(I[i + 1]); par[find(I[i + 1])] = find(I[i + 2]); }
  const comps = new Map();
  for (let i = 0; i < n; i++) { const r = find(i); let c = comps.get(r); if (!c) comps.set(r, c = { min: [9, 9, 9], max: [-9, -9, -9] }); for (let k = 0; k < 3; k++) { c.min[k] = Math.min(c.min[k], P[i][k]); c.max[k] = Math.max(c.max[k], P[i][k]); } }
  return [...comps.values()];
}
// where the flames go: the top of every candle (a candle-sized part of the wax material), the lantern's cage, the torch basket
function lightsOf(node) {
  const name = node.getName(), out = [], r = v => +v.toFixed(3);
  if (name === 'Torch_Metal') return [[0, 0.4, 0.28]];
  for (const p of node.getMesh().listPrimitives()) {
    const mat = p.getMaterial().getName(), cs = components(node, p);
    if (/Trim_Props/.test(mat)) for (const c of cs) { const dx = c.max[0] - c.min[0], dy = c.max[1] - c.min[1], dz = c.max[2] - c.min[2]; if (dx > 0.03 && dx < 0.13 && dz > 0.03 && dz < 0.13 && dy >= 0.05 && dy < 0.36) out.push([r((c.min[0] + c.max[0]) / 2), r(c.max[1] + 0.03), r((c.min[2] + c.max[2]) / 2)]); }
    if (name === 'Lantern_Wall') { const b = cs.filter(c => c.max[1] < 1.0 && c.min[2] > 0.5); if (b.length) { const lo = Math.min(...b.map(c => c.min[1])), hi = Math.max(...b.map(c => c.max[1])), z0 = Math.min(...b.map(c => c.min[2])), z1 = Math.max(...b.map(c => c.max[2])); out.push([0, r((lo + hi) / 2), r((z0 + z1) / 2)]); } }
  }
  return out.filter((p, i) => !out.slice(0, i).some(q => Math.hypot(p[0] - q[0], p[2] - q[2]) < 0.05 && Math.abs(p[1] - q[1]) < 0.25));
}
const triCount = prim => { const i = prim.getIndices(); return (i ? i.getCount() : prim.getAttribute('POSITION').getCount()) / 3; };

const catalog = fs.existsSync(OUT + 'CATALOG.json') ? JSON.parse(fs.readFileSync(OUT + 'CATALOG.json', 'utf8')) : { kits: {}, pieces: {} };
// the old low-poly dungeon pack: use glTF if it ships any
{ const d = path.join(SRC, 'dungeon'); const found = []; const walk = p => { for (const f of fs.readdirSync(p)) { const q = path.join(p, f); if (fs.statSync(q).isDirectory()) walk(q); else if (/\.(gltf|glb)$/i.test(f)) found.push(q); } }; if (fs.existsSync(d)) walk(d);
  if (found.length) { const dir = path.dirname(found[0]); KITS[3].gltf = path.relative(SRC, dir); KITS[3].tex = [path.relative(SRC, dir)]; } }

for (const k of KITS) {
  if (ONLY.length && !ONLY.includes(k.id)) continue;
  if (!k.gltf) { catalog.kits[k.id] = { note: 'not converted: the old low-poly dungeon pack ships only OBJ / FBX / .blend (48 pieces); it needs an OBJ import step before it can join the packs' }; continue; }
  const dir = stage(k), files = fs.readdirSync(dir).filter(f => /\.gltf$/i.test(f)).sort();
  const doc = new Document(); doc.createBuffer(); const scene = doc.createScene(k.id);
  for (const p of Object.keys(catalog.pieces)) if (catalog.pieces[p].kit === k.id) delete catalog.pieces[p];
  let srcTris = 0, simplified = [];
  for (const f of files) {
    const name = f.replace(/\.gltf$/i, ''), src = await io.read(path.join(dir, f)), root = src.getRoot();
    // static pose only: drop skins and animations (the chest lid stays closed; its parts are exported separately below)
    for (const a of root.listAnimations()) { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); }
    const parts = [];
    for (const n of root.listNodes()) if (n.getSkin()) { n.setSkin(null); parts.push(n); }
    for (const s of root.listSkins()) s.dispose();
    for (const m of root.listMeshes()) for (const p of m.listPrimitives()) for (const s of ['TEXCOORD_1', 'JOINTS_0', 'WEIGHTS_0', 'TANGENT']) if (p.getAttribute(s)) p.setAttribute(s, null);
    // bake the hierarchy: every mesh node becomes a root child with no transform
    for (const n of root.listNodes()) if (n.getMesh()) { clearNodeParent(n); clearNodeTransform(n); }
    for (const n of root.listNodes()) if (!n.getMesh()) n.dispose();
    const meshNodes = root.listNodes().filter(n => n.getMesh());
    if (parts.length > 1) for (const n of meshNodes) n.setName(name + '__' + n.getName().replace(name + '_', ''));   // e.g. Chest_Wood__Base, Chest_Wood__Lid
    else if (meshNodes.length === 1) meshNodes[0].setName(name);
    else meshNodes.forEach((n, i) => n.setName(i ? name + '__' + i : name));
    for (const n of meshNodes) {
      let t = 0; for (const p of n.getMesh().listPrimitives()) t += triCount(p); srcTris += t;
      if (k.simplifyAbove && t > k.simplifyAbove) {      // only solid (bark, rock) surfaces: leaf cards do not survive edge collapse
        await src.transform(weld());
        for (const p of n.getMesh().listPrimitives()) { const mat = p.getMaterial(); if (mat && mat.getAlphaMode() === 'OPAQUE' && triCount(p) > 600) simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.02, lockBorder: false }); }
        let t2 = 0; for (const p of n.getMesh().listPrimitives()) t2 += triCount(p); simplified.push(name + ' ' + t + '->' + t2);
      }
    }
    const map = mergeDocuments(doc, src);
    for (const s of doc.getRoot().listScenes()) if (s !== scene) { for (const c of s.listChildren()) scene.addChild(c); s.dispose(); }
  }
  await doc.transform(unpartition(), dedup(), prune(), weld(),
    quantize({ pattern: /^(POSITION|NORMAL|COLOR)(_\d+)?$/, quantizePosition: 14, quantizeNormal: 8, quantizeColor: 8 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /normal/i, quality: 94, effort: 90 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^(?!.*normal)/i, quality: 86, effort: 90 }),
    prune());
  doc.getRoot().listBuffers().slice(1).forEach(b => b.dispose());
  await io.write(OUT + k.id + '.glb', doc);
  // catalogue
  let tris = 0; const cats = {};
  for (const n of scene.listChildren()) {
    const b = getBounds(n), r = v => v.map(x => +x.toFixed(3)), size = [0, 1, 2].map(i => +(b.max[i] - b.min[i]).toFixed(3));
    let t = 0; const mats = []; for (const p of n.getMesh().listPrimitives()) { t += triCount(p); const m = p.getMaterial(); if (m && !mats.includes(m.getName())) mats.push(m.getName()); }
    const cat = category(k.id, n.getName()); cats[cat] = (cats[cat] || 0) + 1; tris += t;
    const lights = cat === 'light-source' ? lightsOf(n) : [];
    catalog.pieces[n.getName()] = Object.assign({ kit: k.id, category: cat, min: r(b.min), max: r(b.max), size, tris: t, materials: mats }, t > 6000 ? { heavy: true } : {}, lights.length ? { lights } : {}, notes(k.id, n.getName(), size, r(b.min), r(b.max)));
  }
  const bytes = fs.statSync(OUT + k.id + '.glb').size;
  catalog.kits[k.id] = { file: k.id + '.glb', bytes, pieces: scene.listChildren().length, tris, categories: cats, materials: doc.getRoot().listMaterials().map(m => m.getName()), textures: doc.getRoot().listTextures().map(t => t.getName() + ' ' + (t.getSize() || []).join('x') + ' ' + Math.round(t.getImage().byteLength / 1024) + 'KB') };
  console.log(k.id, scene.listChildren().length, 'pieces', srcTris, '->', tris, 'tris', (bytes / 1e6).toFixed(2) + ' MB', JSON.stringify(cats));
  if (simplified.length) console.log('  simplified:', simplified.join(', '));
  fs.rmSync(dir, { recursive: true });
}
catalog.rules = [
  'Units are metres, +y up. Every piece is a top-level node of its pack with the pivot noted below.',
  'Village walls: one module is 2 m wide and 3 m per storey (the trim reaches 3.12 and overlaps the storey above). Pivot = bottom centre of the span. Outside face = local +z. A wall on the +z side of a room needs no turn, -z: ry = PI, +x: ry = PI/2, -x: ry = -PI/2.',
  'Walls are 0.2 m thick with a modelled inner plaster face; give them { zone: 0, skyVis: 1, inZone: n, inSkyVis: 0.3 } so the room side is lit by the room. Doors, door frames, windows and shutters share the pivot of their wall module; door leaves hinge at x 0 (place at x -0.54).',
  'Corners: Corner_Exterior_Wood / _Brick posts go on the footprint corners (ry 0 on +x+z, -PI/2 on -x+z, PI on -x-z, PI/2 on +x-z).',
  'Floors: 2 x 2 m tiles centred on the grid, 0.02 thick. Interior stairs rise 3 m over about 4.6 m along local -z and need a 2 x 4 m well.',
  'Roofs: Roof_RoundTiles_<span>x<length> sits with its pivot at the centre of the footprint at wall-top height; the ridge runs along z, <span> is across x. Spans 4, 6, 8 with lengths 4 to 14. Close each gable with Roof_Front_Brick<span> (a timber-and-plaster triangle despite the name) on the wall line. Roof_Tower_RoundTiles covers a 4 x 4 tower. Roof_RoundTiles_8x14 is broken in the free tier.',
  'Balconies: rail 1 m outside the wall at floor level; use Floor_WoodDark_Half3 tiles for the deck. Overhang_* pieces build a jettied upper storey 1 m (Short) or 2 m (Long) out.',
  'Props: pivot at the bottom centre unless hanging (Chandelier hangs 1.26 m below its pivot; Lantern_Wall and Torch_Metal mount on a wall at their pivot, facing +z). Light positions are in each piece\'s lights list.',
];
fs.writeFileSync(OUT + 'CATALOG.json', JSON.stringify(catalog, null, 1));
console.log('wrote kits/CATALOG.json', Object.keys(catalog.pieces).length, 'pieces');
