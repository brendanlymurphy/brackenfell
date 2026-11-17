// Adds a light copy of every scanned prop to kits/scan.glb for the Low tier: a sibling node "<name>@low" whose meshes keep about a third of the triangles
// (meshoptimizer's simplifier, attribute-aware, borders kept). On Low the kit loader (src/44_kit.js) uses the light copy in place of the full model: a vase
// on a stall is 600 triangles and a few dozen pixels. Safe to run again (old @low nodes are replaced). Afterwards: node tools/assets_pack.mjs --only kits
// usage: node tools/scan_low.mjs [ratio=0.3] [min triangles to bother=300]
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'; import * as F from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const root = new URL('../', import.meta.url).pathname, ratio = +(process.argv[2] || 0.3), MIN = +(process.argv[3] || 300), pack = process.argv[4] || 'scan', file = root + 'kits/' + pack + '.glb';       // node tools/scan_low.mjs 0.28 300 props  does the kit's own stall props (then assets_pack --only small)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(file), scene = doc.getRoot().listScenes()[0];
for (const n of scene.listChildren()) if (/@low$/.test(n.getName())) { n.traverse(c => { const m = c.getMesh(); if (m) { for (const p of m.listPrimitives()) p.dispose(); m.dispose(); } }); n.dispose(); }
const tris = n => { let t = 0; n.traverse(c => { const m = c.getMesh(); if (m) for (const p of m.listPrimitives()) t += p.getIndices().getCount() / 3; }); return t; };
let made = 0, before = 0, after = 0; const rows = [];
const copy = (src) => { const d = doc.createNode(src.getName()).setTranslation(src.getTranslation()).setRotation(src.getRotation()).setScale(src.getScale()); const m = src.getMesh();
  if (m) { const nm = doc.createMesh(m.getName() + '@low'); for (const p of m.listPrimitives()) { const q = p.clone(); for (const sem of q.listSemantics()) q.setAttribute(sem, q.getAttribute(sem).clone()); q.setIndices(q.getIndices().clone()); F.weldPrimitive(q, {}); F.simplifyPrimitive(q, { simplifier: MeshoptSimplifier, ratio, error: 0.12, lockBorder: false }); nm.addPrimitive(q); } d.setMesh(nm); }
  for (const c of src.listChildren()) d.addChild(copy(c)); return d; };
// only what stands out of doors in numbers (the market's stalls, yards, the wharf): a light copy of all 60 models added 470 KB to a file every tier downloads
const ONLY = pack === 'props' ? /^(FarmCrate_Apple|FarmCrate_Carrot|FarmCrate_Empty|Barrel_Apples|Barrel_Holder|Shelf_Small_Bottles|Crate_Metal|Crate_Wooden|Barrel|Potion_[124]|SmallBottles_1)$/ : /^(woodentable_01|ceramic_vase_0[24]|ceramic_pot|food_apple_01|food_pears_asian_01|hamburger_buns_a|wooden_bucket_0[12]|wooden_bowl_01|carved_wooden_plate|wine_barrel_01|wooden_barrels_01_a|wicker_basket_0\d|treasure_chest)$/;
for (const n of scene.listChildren()) { const t = tris(n); if (t < MIN || !ONLY.test(n.getName()) || /@low$/.test(n.getName())) continue; const low = copy(n); low.setName(n.getName() + '@low'); scene.addChild(low); const t2 = tris(low); made++; before += t; after += t2; rows.push(n.getName() + ' ' + t + ' > ' + t2); }
await doc.transform(F.prune(), F.quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeTexcoord: 12 }));       // the copies as small integers like the models they come from (as floats they add 185 KB to props.glb). This re-quantizes the whole file: every model's points move by less than a tenth of a millimetre
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(file, doc); console.log(rows.join('\n')); console.log(made + ' light copies: ' + before + ' > ' + after + ' triangles');
