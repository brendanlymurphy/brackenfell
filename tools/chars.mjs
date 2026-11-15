// Builds the shipped character files in chars/ from the downloaded packs (all CC0, see chars/PROVENANCE.md):
//   q_clips.glb    animation clips on the Quaternius universal rig (from the Mesh2Motion library), 15 keys a second, skinned joints only
//   q_male.glb     every male part on ONE skeleton: peasant and ranger outfit pieces, head, eyes, brows, hair, beard
//   q_female.glb   the same for the female body
// Textures are written separately by tools/chars_tex.py; the GLBs carry material names only.
// Needs @gltf-transform/core, /functions, /extensions and meshoptimizer (not project dependencies; run from a folder that has them):
//   node chars.mjs <mesh2motion-app> <Universal Base Characters[Standard]> <Modular Character Outfits - Fantasy[Standard]> <out chars dir>
import fs from 'node:fs';
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import { prune, dedup, weld, quantize, mergeDocuments, compactPrimitive, simplify } from '@gltf-transform/functions';
const [M2M, UBC, OUTFITS, OUT] = [process.argv[2] + '/static/assets/human/', process.argv[3] + '/', process.argv[4] + '/Exports/glTF (Godot-Unreal)/', process.argv[5] + '/'];
await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTMeshoptCompression]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const plain = d => { for (const e of d.getRoot().listExtensionsUsed()) if (e.extensionName === 'EXT_meshopt_compression') e.dispose(); return d; };
// the packs' .gltf files point at textures (some of them missing); geometry is all we want, so read them with the images stripped
async function readNoTex(file) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8')), dir = file.slice(0, file.lastIndexOf('/') + 1), resources = {};
  delete json.images; delete json.textures; delete json.samplers;
  for (const m of json.materials || []) { for (const k of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) delete m[k]; if (m.pbrMetallicRoughness) { delete m.pbrMetallicRoughness.baseColorTexture; delete m.pbrMetallicRoughness.metallicRoughnessTexture; } delete m.extensions; }
  for (const b of json.buffers) resources[b.uri] = new Uint8Array(fs.readFileSync(dir + decodeURIComponent(b.uri)));
  return io.readJSON({ json, resources });
}
const kb = f => (fs.statSync(f).size / 1024 | 0) + ' KB';

// ───────── clips ─────────
// what the villagers do today, then what sword play, bows and a visible player body will need
const CLIPS = ['idle-a', 'idle-subtle', 'idle-foldarms', 'idle-listening', 'idle-talking', 'walk', 'walk-relaxed', 'walk-female', 'walk-carry', 'jog', 'sprint',
  'sitting-idle', 'sitting-talking', 'sitting-writing', 'sit-ground-idle', 'sleeping', 'hammering', 'guitar-playing', 'pray', 'polearm-idle', 'idle-lantern', 'idle-torch',
  'farm-harvest', 'farm-watering', 'shovel-dig', 'chop-wood', 'clapping', 'victory', 'greeting', 'head-nod', 'interact', 'pick-up', 'open-door', 'kneel',
  'one-hand-weapon-idle', 'sword-attack', 'sword-regular-a', 'sword-regular-b', 'sword-regular-combo', 'sword-block', 'weapon-draw', 'defend', 'hit-chest', 'hit-head',
  'death-a', 'death-b', 'jump-start', 'jump-air', 'jump-land', 'dodge-back', 'walk-backwards', 'strafe-left', 'strafe-right', 'bow-pull', 'bow-release'];
const FPS = 15, RENAME = { head: 'Head' };       // Mesh2Motion spells one joint differently from Quaternius
{
  const main = plain(await io.read(M2M + 'skeleton.glb')), root = main.getRoot(), buf = root.listBuffers()[0];
  for (const a of root.listAnimations()) { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); }
  for (const n of root.listNodes()) if (RENAME[n.getName()]) n.setName(RENAME[n.getName()]);
  const byName = new Map(root.listNodes().map(n => [n.getName(), n]));
  const manifest = JSON.parse(fs.readFileSync(process.argv[2] + '/static/assets/manifest.json', 'utf8')).rigs.human.animations, meta = {};
  const lerpKey = (inp, t) => { let i = 0; while (i < inp.length - 2 && inp[i + 1] < t) i++; const span = inp[i + 1] - inp[i]; return [i, span > 1e-9 ? Math.min(1, Math.max(0, (t - inp[i]) / span)) : 0]; };
  for (const name of CLIPS) {
    const d = await io.read(M2M + 'animations/' + name + '.glb'), a = d.getRoot().listAnimations()[0], anim = main.createAnimation(name);
    let dur = 0; for (const s of a.listSamplers()) { const i = s.getInput().getArray(); dur = Math.max(dur, i[i.length - 1]); }
    const n = Math.max(2, Math.round(dur * FPS) + 1), times = new Float32Array(n); for (let k = 0; k < n; k++) times[k] = dur * k / (n - 1);
    const tAcc = main.createAccessor().setType('SCALAR').setArray(times).setBuffer(buf);
    for (const ch of a.listChannels()) {
      const path = ch.getTargetPath(), tn0 = ch.getTargetNode().getName(), tn = RENAME[tn0] || tn0, s = ch.getSampler();
      if (path === 'scale' || !byName.has(tn) || tn.includes('leaf') || tn === 'root' || (path === 'translation' && tn !== 'pelvis')) continue;
      const inp = s.getInput().getArray(), out = s.getOutput().getArray(), w = path === 'rotation' ? 4 : 3, f = new Float32Array(n * w);
      for (let k = 0; k < n; k++) {
        const [i, u] = inp.length > 1 ? lerpKey(inp, times[k]) : [0, 0], j = Math.min(i + 1, inp.length - 1);
        let dot = 0; if (w === 4) for (let c = 0; c < 4; c++) dot += out[i * 4 + c] * out[j * 4 + c];
        const sg = w === 4 && dot < 0 ? -1 : 1; let len = 0;
        for (let c = 0; c < w; c++) { f[k * w + c] = out[i * w + c] * (1 - u) + out[j * w + c] * u * sg; len += f[k * w + c] ** 2; }
        if (w === 4) { len = Math.sqrt(len) || 1; for (let c = 0; c < 4; c++) f[k * 4 + c] /= len; }
      }
      let arr = f; if (w === 4) { arr = new Int16Array(f.length); for (let i = 0; i < f.length; i++) arr[i] = Math.round(f[i] * 32767); }
      const oAcc = main.createAccessor().setType(w === 4 ? 'VEC4' : 'VEC3').setArray(arr).setNormalized(w === 4).setBuffer(buf);
      const ns = main.createAnimationSampler().setInput(tAcc).setOutput(oAcc).setInterpolation('LINEAR');
      anim.addSampler(ns).addChannel(main.createAnimationChannel().setTargetNode(byName.get(tn)).setTargetPath(path).setSampler(ns));
    }
    const m = manifest.find(x => x.file === 'human/animations/' + name + '.glb'); meta[name] = m ? m.loop : true;
  }
  await main.transform(prune());
  await io.write(OUT + 'q_clips.glb', main);
  console.log('q_clips.glb', root.listAnimations().length, 'clips', kb(OUT + 'q_clips.glb'), 'not looping:', Object.keys(meta).filter(k => !meta[k]).join(' '));
}

// ───────── bodies ─────────
const HAIR = UBC + 'Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/', BASE = UBC + 'Base Characters/Godot - UE/';
const BODIES = {
  male: { canon: OUTFITS + 'Outfits/Male_Peasant.gltf', more: [OUTFITS + 'Outfits/Male_Ranger.gltf'], head: BASE + 'Superhero_Male_FullBody.gltf',
    hair: ['Hair_Beard', 'Hair_Buns', 'Hair_Buzzed', 'Hair_Long', 'Hair_SimpleParted'] },
  female: { canon: OUTFITS + 'Outfits/Female_Peasant.gltf', more: [OUTFITS + 'Outfits/Female_Ranger.gltf'], head: BASE + 'Superhero_Female_FullBody.gltf',
    hair: ['Hair_Buns', 'Hair_BuzzedFemale', 'Hair_Long', 'Hair_SimpleParted'] },
};
// uniform part names for both sexes: Peasant_Body, Ranger_Feet, Ranger_Pauldrons, HeadSkin, Eyes, Brows, Hair_Long ...
const partName = n => n.replace(/^(Male|Female)_/, '').replace('Feet_Boots', 'Feet').replace(/Acc_Pauldrons?/, 'Pauldrons').replace('BuzzedFemale', 'Buzzed').replace(/^SuperHero_(Male|Female)$/i, 'HeadSkin').replace(/^Eyebrows.*/, 'Brows');
const mul4 = (a, b) => { const o = new Float64Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let t = 0; for (let k = 0; k < 4; k++) t += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = t; } return o; };
const inv4 = m => {      // affine inverse (column-major)
  const a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10], A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  const o = new Float64Array(16); o[0] = A / det; o[1] = -(b * i - c * h) / det; o[2] = (b * f - c * e) / det; o[4] = B / det; o[5] = (a * i - c * g) / det; o[6] = -(a * f - c * d) / det; o[8] = C / det; o[9] = -(a * h - b * g) / det; o[10] = (a * e - b * d) / det;
  o[12] = -(o[0] * m[12] + o[4] * m[13] + o[8] * m[14]); o[13] = -(o[1] * m[12] + o[5] * m[13] + o[9] * m[14]); o[14] = -(o[2] * m[12] + o[6] * m[13] + o[10] * m[14]); o[15] = 1; return o;
};
const KEEP_ATTR = new Set(['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0']);
for (const [sex, B] of Object.entries(BODIES)) {
  const main = await readNoTex(B.canon), root = main.getRoot(), scene = root.listScenes()[0];
  const canon = new Map(root.listNodes().filter(n => !n.getMesh()).map(n => [n.getName(), n])), arm = canon.get('Armature');
  const mats = new Map(), mat = name => { if (!mats.has(name)) mats.set(name, main.createMaterial(name).setRoughnessFactor(0.85).setMetallicFactor(0).setDoubleSided(name !== 'MI_Skin_Head' && !name.includes('Regular'))); return mats.get(name); };
  // One skin for the whole file. A part made for another body (the ranger pieces, hair, the face) has its own bind pose; its vertices are
  // moved into this body's bind pose here, by skinning them once with (our joint at rest) x (the part's inverse bind matrix).
  const cSkin = root.listNodes().find(n => n.getMesh() && n.getSkin()).getSkin(), cNames = cSkin.listJoints().map(j => j.getName()), cIdx = new Map(cNames.map((n, i) => [n, i]));
  const cIBM = cSkin.getInverseBindMatrices().getArray(), cWorld = cNames.map((n, i) => inv4(cIBM.subarray(i * 16, i * 16 + 16)));
  const rebind = (node) => {
    const skin = node.getSkin(); if (skin === cSkin) return;
    const pj = skin.listJoints().map(j => j.getName()), pI = skin.getInverseBindMatrices().getArray();
    for (const n of pj) if (!cIdx.has(n)) throw new Error('part joint not in the body: ' + n);
    const M = pj.map((n, j) => mul4(cWorld[cIdx.get(n)], pI.subarray(j * 16, j * 16 + 16))), remap = pj.map(n => cIdx.get(n)), buf = root.listBuffers()[0];
    for (const prim of node.getMesh().listPrimitives()) {
      const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'), J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0'), nv = P.getCount();
      const p2 = new Float32Array(nv * 3), n2 = new Float32Array(nv * 3), j2 = new Uint8Array(nv * 4), w2 = new Float32Array(nv * 4), p = [0, 0, 0], n = [0, 0, 0], j4 = [0, 0, 0, 0], w4 = [0, 0, 0, 0], acc = new Float64Array(16);
      for (let v = 0; v < nv; v++) {
        P.getElement(v, p); N.getElement(v, n); J.getElement(v, j4); W.getElement(v, w4); acc.fill(0); let tw = 0;
        for (let c = 0; c < 4; c++) { if (w4[c] <= 0) continue; tw += w4[c]; const m = M[j4[c]]; for (let k = 0; k < 16; k++) acc[k] += m[k] * w4[c]; }
        for (let k = 0; k < 16; k++) acc[k] /= tw || 1;
        p2[v * 3] = acc[0] * p[0] + acc[4] * p[1] + acc[8] * p[2] + acc[12]; p2[v * 3 + 1] = acc[1] * p[0] + acc[5] * p[1] + acc[9] * p[2] + acc[13]; p2[v * 3 + 2] = acc[2] * p[0] + acc[6] * p[1] + acc[10] * p[2] + acc[14];
        const nx = acc[0] * n[0] + acc[4] * n[1] + acc[8] * n[2], ny = acc[1] * n[0] + acc[5] * n[1] + acc[9] * n[2], nz = acc[2] * n[0] + acc[6] * n[1] + acc[10] * n[2], nl = Math.hypot(nx, ny, nz) || 1;
        n2[v * 3] = nx / nl; n2[v * 3 + 1] = ny / nl; n2[v * 3 + 2] = nz / nl;
        for (let c = 0; c < 4; c++) { j2[v * 4 + c] = w4[c] > 0 ? remap[j4[c]] : 0; w2[v * 4 + c] = w4[c] / (tw || 1); }
      }
      const acc3 = (t, a) => main.createAccessor().setType(t).setArray(a).setBuffer(buf);
      prim.setAttribute('POSITION', acc3('VEC3', p2)).setAttribute('NORMAL', acc3('VEC3', n2)).setAttribute('JOINTS_0', acc3('VEC4', j2)).setAttribute('WEIGHTS_0', acc3('VEC4', w2));
    }
    node.setSkin(cSkin);
  };
  const adopt = (node, forceMat) => {       // a skinned mesh node already inside `main`: put it on the body's skin, tidy it, hang it under the armature
    rebind(node);
    const p = node.getParentNode(); if (p) p.removeChild(node); for (const s of root.listScenes()) s.removeChild(node);
    arm.addChild(node); node.setName(partName(node.getName())); node.getMesh().setName(node.getName());
    for (const prim of node.getMesh().listPrimitives()) {
      for (const s of prim.listSemantics()) if (!KEEP_ATTR.has(s)) prim.setAttribute(s, null);
      const old = prim.getMaterial(); prim.setMaterial(mat(forceMat || (old ? old.getName() : 'MI_None')));
    }
    return node;
  };
  const bring = async (file, pick) => {      // merge another file and adopt the skinned meshes `pick` selects
    const src = await readNoTex(file), map = mergeDocuments(main, src), out = [];
    for (const n of src.getRoot().listNodes()) if (n.getMesh() && n.getSkin() && (!pick || pick(n.getName()))) out.push(map.get(n));
    return out;
  };
  for (const n of root.listNodes().filter(n => n.getMesh())) adopt(n);
  // The female peasant arms ship as one piece on the cloth material although the hands are mapped for the skin texture: split the hands off.
  for (const n of root.listNodes().filter(n => n.getMesh() && n.getName() === 'Peasant_Arms' && n.getMesh().listPrimitives().length === 1 && sex === 'female')) {
    const prim = n.getMesh().listPrimitives()[0], J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0'), idx = prim.getIndices().getArray(), nv = J.getCount(), hw = new Float32Array(nv), j4 = [0, 0, 0, 0], w4 = [0, 0, 0, 0];
    const handish = cNames.map(nm => /^(hand|index|middle|ring|pinky|thumb)_/.test(nm));
    for (let v = 0; v < nv; v++) { J.getElement(v, j4); W.getElement(v, w4); let a = 0, t = 0; for (let c = 0; c < 4; c++) { t += w4[c]; if (handish[j4[c]]) a += w4[c]; } hw[v] = t > 0 ? a / t : 0; }
    const cloth = [], skinTris = []; for (let i = 0; i < idx.length; i += 3) ((hw[idx[i]] + hw[idx[i + 1]] + hw[idx[i + 2]]) / 3 > 0.6 ? skinTris : cloth).push(idx[i], idx[i + 1], idx[i + 2]);
    const hands = prim.clone(), buf = root.listBuffers()[0];
    prim.setIndices(main.createAccessor().setType('SCALAR').setArray(new Uint32Array(cloth)).setBuffer(buf)); compactPrimitive(prim);
    hands.setIndices(main.createAccessor().setType('SCALAR').setArray(new Uint32Array(skinTris)).setBuffer(buf)); compactPrimitive(hands);
    hands.setMaterial(mat('MI_Regular_Female')); n.getMesh().addPrimitive(hands);
  }
  for (const f of B.more) for (const n of await bring(f)) adopt(n);
  for (const h of B.hair) for (const n of await bring(HAIR + h + '.gltf')) adopt(n);
  // the face comes from the base body: keep the part skinned to the head and neck, drop the rest of the body
  for (const n of await bring(B.head)) {
    const isBody = /^SuperHero_/i.test(n.getName()); adopt(n, isBody ? 'MI_Skin_Head' : null);
    if (!isBody) continue;
    const names = n.getSkin().listJoints().map(j => j.getName()), headish = new Set(['Head', 'neck_01']);
    for (const prim of n.getMesh().listPrimitives()) {
      const J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0'), P = prim.getAttribute('POSITION'), idx = prim.getIndices().getArray(), nv = P.getCount(), hw = new Float32Array(nv), j4 = [0, 0, 0, 0], w4 = [0, 0, 0, 0];
      for (let v = 0; v < nv; v++) { J.getElement(v, j4); W.getElement(v, w4); let s = 0, t = 0; for (let c = 0; c < 4; c++) { t += w4[c]; if (headish.has(names[j4[c]])) s += w4[c]; } hw[v] = t > 0 ? s / t : 0; }
      const keep = []; for (let i = 0; i < idx.length; i += 3) if (hw[idx[i]] > 0.5 && hw[idx[i + 1]] > 0.5 && hw[idx[i + 2]] > 0.5) keep.push(idx[i], idx[i + 1], idx[i + 2]);
      prim.setIndices(main.createAccessor().setType('SCALAR').setArray(new Uint32Array(keep)).setBuffer(root.listBuffers()[0])); compactPrimitive(prim);
    }
  }
  // everything that came along with the merges and is not ours goes: stray scenes, their armatures, textures, old materials
  for (const s of root.listScenes()) if (s !== scene) s.dispose();
  const ours = new Set(); const walk = n => { ours.add(n); n.listChildren().forEach(walk); }; scene.listChildren().forEach(walk);
  for (const n of root.listNodes()) if (!ours.has(n)) n.dispose();
  for (const m of root.listMaterials()) if (![...mats.values()].includes(m)) m.dispose();
  for (const t of root.listTextures()) t.dispose();
  for (const a of root.listAnimations()) { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); }
  await main.transform(dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH] }), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.3, error: 0.004 }), quantize({ pattern: /^(NORMAL|TEXCOORD_0|WEIGHTS_0)$/, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }), prune({ keepAttributes: true }));
  main.createExtension(KHRMeshQuantization).setRequired(true);
  for (const sk of root.listSkins()) if (sk !== cSkin) sk.dispose();
  // one buffer, so the result is a single .glb
  const bufs = root.listBuffers(); for (const a of root.listAccessors()) a.setBuffer(bufs[0]); for (const b of bufs.slice(1)) b.dispose();
  await io.write(OUT + 'q_' + sex + '.glb', main);
  const parts = root.listNodes().filter(n => n.getMesh()).map(n => n.getName() + ':' + n.getMesh().listPrimitives().reduce((t, p) => t + p.getIndices().getCount() / 3, 0) + '[' + n.getMesh().listPrimitives().map(p => p.getMaterial().getName()).join(',') + ']');
  console.log('q_' + sex + '.glb', kb(OUT + 'q_' + sex + '.glb'), '\n  ' + parts.join('\n  '));
}
