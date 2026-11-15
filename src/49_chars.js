// ───────────────────────── villagers as glTF characters: modular skinned bodies, shared animation clips, world lighting ─────────────────────────
// Asset-agnostic: everything about a character set lives in one config (Chars.define). To move to another set, put its files
// under chars/ and write a config; nothing below the configs needs to change.
//
//   await Chars.load('real', progress)         load bodies, textures and clips of a set (once); 'real' = MakeHuman people, 'quaternius' = the stylized set
//   await Chars.ensure(['o_brute'])            load bodies a set keeps back (cfg.lazy) until they are needed
//   const h = Chars.spawn(def)                 def: an entry of NPC_DEFS; the villager is added to Chars.group
//   Chars.update(h, state, dt)                 state: { pos, yaw, anim, scale, zone, light, visible, look: [yaw, pitch], talking, seatHeight }
//   Chars.attach(h, 'handR', object3D)         parent a prop to a named bone
//   Chars.remove(h)
//
// Game conventions kept: feet at pos, yaw 0 faces -Z and grows clockwise seen from above, animation names as in 77_npc.js.
const Chars = (() => {
  const { vec3, vec4, float, uniform, texture, uv, positionWorld, normalWorld, materialColor, normalMap } = TSL;
  const SETS = {};
  const C = { group: new THREE.Group(), set: null, cfg: null, list: [], ready: false, normalMaps: true };
  C.group.name = 'villagers';

  // ── character sets ──
  // dir, clips        folder, and the one GLB that holds every clip (its tracks address joints by name)
  // bodies            name -> GLB holding every part of that body as separate meshes on one skeleton
  // textures          key -> file (colour) or { file, data: true } (normal maps and other non-colour data)
  // materials         glTF material name -> { map: key | { body: key }, normal: key, rough, kind: 'skin' | 'hair', oneSided }
  // faces             +1 if the models face +Z (the glTF convention), -1 if they face -Z like the game
  // scale             model scale that makes an adult 1.72 m tall, the height the village was built for
// lazy              bodies not fetched by load() but by ensure() (the outlaws)
// matOf(material)   material description for sets whose GLBs carry their own textures: { kind, part, rough, oneSided, alpha, gltf: true }
// look() may also return fit: an extra scale for that body (children are built at their own height and stood up to adult size, then scaled by the villager)
  // bones             the rig's names for the joints the game talks to
  // anims             game animation -> clip name, or a list to pick from per villager; 'sit+talk' plays when a seated villager talks
  // once, rate        clips that must not loop; optional playback rate per game animation
  // look(def)         -> { body, parts: [mesh names], maps: { material: texture key }, tint: { material | 'skin' | 'hair': [r,g,b] } } for one villager
  C.define = (name, cfg) => { SETS[name] = cfg; };

  // Quaternius: Universal Base Characters + Modular Character Outfits - Fantasy (free tiers), clips from the Mesh2Motion library. All CC0.
  // The files are built by tools/chars.mjs and tools/chars_tex.py; chars/PROVENANCE.md says where everything came from.
  {
    const lin = c => c.map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    // multipliers over the pack's one mid-tone skin texture and its grey hair texture
    const SKIN_T = { fair: [1.36, 1.42, 1.50], rosy: [1.40, 1.34, 1.36], tan: [1.08, 1.08, 1.08], brown: [0.72, 0.68, 0.66], deep: [0.46, 0.42, 0.40] };
    const HAIR_C = { black: [0.13, 0.11, 0.10], brown: [0.32, 0.20, 0.12], auburn: [0.52, 0.24, 0.12], blond: [0.80, 0.64, 0.34], grey: [0.62, 0.61, 0.60], white: [0.90, 0.89, 0.86], red: [0.66, 0.26, 0.10] };
    const hairTint = n => { const c = lin(HAIR_C[n] || HAIR_C.brown), g = (c[0] + c[1] + c[2]) / 3; return c.map(v => Math.min((v * 0.75 + g * 0.25) / 0.27 * 0.8, 2.2)); };
    const P = ['Peasant_Body', 'Peasant_Arms', 'Peasant_Legs', 'Peasant_Feet'], R = ['Ranger_Body', 'Ranger_Arms', 'Ranger_Legs', 'Ranger_Feet'], FACE = ['HeadSkin', 'Eyes', 'Brows'];
    // who wears what. Outfit pieces: P peasant, R ranger; maps pick the pack's alternative colourways; tints stay muted and natural.
    const LOOKS = {
      hale:   { body: 'male',   parts: [...R, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Pauldrons', 'Hair_SimpleParted', 'Hair_Beard'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.95, 0.9, 0.88] } },
      ivo:    { body: 'male',   parts: [...R, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Body_Belt_2', 'Ranger_Pauldrons', 'Hair_Buzzed'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.78, 0.86, 1.05] } },
      greta:  { body: 'female', parts: [...P, 'Hair_Buns'], tint: { MI_Peasant: [0.92, 1.05, 0.88] } },
      brandt: { body: 'male',   parts: [...P, 'Hair_Buzzed', 'Hair_Beard'], maps: { MI_Peasant: 'peasant2' }, tint: { MI_Peasant: [1.15, 1.0, 0.9] } },
      tobin:  { body: 'male',   parts: [...P, 'Hair_SimpleParted'], tint: { MI_Peasant: [1.1, 1.0, 0.8] } },
      marta:  { body: 'female', parts: ['Peasant_Body', 'Peasant_Arms', 'Ranger_Legs', 'Ranger_Feet', 'Hair_Long'], maps: { MI_Peasant: 'peasant2', MI_Ranger: 'ranger3' }, tint: { MI_Peasant: [1.35, 0.85, 0.95] } },
      aldous: { body: 'male',   parts: [...R, 'Ranger_Head_Hood', 'Ranger_Body_Belt_1'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [1.0, 0.88, 0.74] } },
      maren:  { body: 'female', parts: [...R, 'Ranger_Head_Hood'], tint: { MI_Ranger: [0.80, 0.64, 0.82] } },
      osric:  { body: 'male',   parts: [...P, 'Hair_Buzzed', 'Hair_Beard'], tint: { MI_Peasant: [1.25, 1.2, 1.1] } },
      edda:   { body: 'female', parts: [...P, 'Hair_Long'], tint: { MI_Peasant: [1.15, 1.0, 0.72] } },
      finn:   { body: 'male',   parts: ['Peasant_Body', 'Peasant_Arms', 'Ranger_Legs', 'Ranger_Feet', 'Hair_SimpleParted', 'Hair_Beard'], tint: { MI_Peasant: [0.72, 0.9, 1.08], MI_Ranger: [0.8, 0.8, 0.8] } },
      lark:   { body: 'male',   parts: [...R, 'Ranger_Body_Belt_2', 'Hair_Long'], tint: { MI_Ranger: [0.74, 0.76, 0.86] } },
      wren:   { body: 'female', parts: [...R, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Head_Hood'], tint: { MI_Ranger: [0.86, 0.74, 0.62] } },
      rowan:  { body: 'male',   parts: [...R, 'Ranger_Body_Belt_1', 'Hair_Long', 'Hair_Beard'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.86, 0.8, 1.05] } },
      pip:    { body: 'male',   parts: [...P, 'Hair_Long'], tint: { MI_Peasant: [1.3, 0.9, 0.82] } },      // a child: the plain tunic, not a scaled-down woman's bodice
      hilda:  { body: 'female', parts: [...P, 'Hair_Buns'], maps: { MI_Peasant: 'peasant2' }, tint: { MI_Peasant: [0.85, 1.05, 1.5] } },
      bram:   { body: 'male',   parts: ['Peasant_Body', 'Peasant_Arms', 'Peasant_Legs', 'Ranger_Feet', 'Hair_SimpleParted'], tint: { MI_Peasant: [1.0, 1.05, 0.82], MI_Ranger: [0.9, 0.85, 0.8] } },
    };
    C.define('quaternius', {
      dir: 'chars/', clips: 'q_clips.glb', bodies: { male: 'q_male.glb', female: 'q_female.glb' },
      textures: { peasant: 'q_peasant.webp', peasant2: 'q_peasant2.webp', peasantN: { file: 'q_peasant_n.webp', data: true }, ranger: 'q_ranger.webp', ranger3: 'q_ranger3.webp', rangerN: { file: 'q_ranger_n.webp', data: true },
        skinM: 'q_skin_m.webp', skinF: 'q_skin_f.webp', headM: 'q_head_m.webp', headF: 'q_head_f.webp', hair1: 'q_hair1.webp', hair2: 'q_hair2.webp', eye: 'q_eye.webp' },
      materials: {
        MI_Peasant: { map: 'peasant', normal: 'peasantN', rough: 0.86 }, MI_Ranger: { map: 'ranger', normal: 'rangerN', rough: 0.8 },
        MI_Regular_Male: { map: 'skinM', kind: 'skin', rough: 0.62, oneSided: true }, MI_Regular_Female: { map: 'skinF', kind: 'skin', rough: 0.62, oneSided: true },
        MI_Skin_Head: { map: { male: 'headM', female: 'headF' }, kind: 'skin', rough: 0.62, oneSided: true },
        MI_Hair_1: { map: 'hair1', kind: 'hair', rough: 0.7 }, MI_Hair_2: { map: 'hair2', kind: 'hair', rough: 0.7 }, MI_Eyes: { map: 'eye', rough: 0.35, oneSided: true },
      },
      faces: 1, scale: 1.72 / 1.80,
      bones: { hips: 'pelvis', head: 'Head', neck: 'neck_01', handR: 'hand_r', handL: 'hand_l', footR: 'foot_r', footL: 'foot_l' },
      anims: {
        idle: ['idle-a', 'idle-foldarms', 'idle-a'], walk: ['walk', 'walk-relaxed'], run: 'jog', sit: 'sitting-idle', 'sit+talk': 'sitting-talking', talk: 'idle-talking',
        hammer: 'hammering', lute: 'guitar-playing', pray: 'pray', guard: 'polearm-idle', fish: 'idle-lantern', work: 'farm-harvest', sweep: 'shovel-dig', lie: 'sleeping', cheer: 'clapping',
      },
      once: ['greeting', 'head-nod', 'interact', 'pick-up', 'open-door', 'kneel', 'sword-attack', 'sword-regular-a', 'sword-regular-b', 'sword-regular-combo', 'weapon-draw', 'hit-chest', 'hit-head', 'death-a', 'death-b', 'jump-start', 'jump-land', 'dodge-back', 'bow-pull', 'bow-release'],
      rate: { hammer: 0.9 },
      look(def) {
        const women = { greta: 1, marta: 1, maren: 1, edda: 1, wren: 1, pip: 1, hilda: 1 };
        const l = LOOKS[def.id] || { body: women[def.id] || def.female ? 'female' : 'male', parts: [...P, 'Hair_SimpleParted'], tint: { MI_Peasant: (def.top || [0.5, 0.45, 0.4]).map(v => 0.6 + v) } };
        const tint = Object.assign({ skin: SKIN_T[def.skin || 'fair'], hair: hairTint(def.hair) }, l.tint);
        return { body: l.body, parts: FACE.concat(l.parts), maps: l.maps || {}, tint };
      },
    });
  }

  // Real: people built with Blender and MakeHuman (MPFB2), one GLB per person (mesh, textures, 53-joint rig; no clips) plus one clips.glb
  // retargeted from the Quaternius clips onto the MakeHuman game rig. Built by tools/humans/; chars/real/PROVENANCE.md has the sources, all CC0.
  // Every body has its own proportions, rest pose and textures, so a body is one villager (a few look-alikes are tinted apart at run time).
  {
    const BODY = { hale: 'm_guard', greta: 'f_maid', brandt: 'm_smith', tobin: 'm_boy', marta: 'f_herbalist', aldous: 'm_monk', maren: 'f_elder', osric: 'm_innkeeper', edda: 'f_farmer',
      finn: 'm_fisher', lark: 'm_youth', wren: 'f_girl', rowan: 'm_elder', pip: 'f_child', ivo: 'm_hunter', hilda: 'f_weaver', bram: 'm_farmer' };
    const NAT = { m_boy: 1.293, f_child: 1.213 };      // height of the children as built; a child is stood up to 1.72 m so the villager's own scale (0.74, 0.66) brings it to the height the village expects
    const FIT = { m_boy: 1.72 / NAT.m_boy, f_child: 1.72 / NAT.f_child, f_elder: 1 / 0.93, m_elder: 1 / 0.97 };
    const TINT = {      // light touches on top of the colours baked into each body, to keep neighbours apart
      hale: { tunic: [0.92, 0.92, 0.98] }, ivo: { tunic: [0.8, 0.88, 1.1], pants: [0.8, 0.8, 0.85] }, bram: { tunic: [1.05, 1.0, 0.9] }, hilda: { robe: [0.95, 0.95, 1.1] },
    };
    const FOES = [{ body: 'o_hood_m' }, { body: 'o_brute' }, { body: 'o_hood_f' }, { body: 'o_rogue' }], FOE_LEADER = { body: 'o_brute', tint: { tunic: [1.35, 0.7, 0.6], pants: [0.9, 0.8, 0.8] } };
    const SKIN_T = { light: [0.88, 0.82, 0.78], m_hunter: [1, 1, 1], f_herbalist: [1, 1, 1], o_rogue: [1, 1, 1] };      // the stock light skins are very bright under a sun-lit sky
    const PART = [[/tunic|bodice|dress/, 'tunic'], [/robe/, 'robe'], [/hood|helmet/, 'head'], [/pants/, 'pants'], [/boots/, 'boots'], [/skirt/, 'skirt']];
    const names = Object.values(BODY).concat(FOES.map(f => f.body));
    const bodies = {}; for (const n of new Set(names)) bodies[n] = n + '.glb';
    const ANIMS = { idle: ['idle-a', 'idle-foldarms', 'idle-a'], walk: ['walk', 'walk-relaxed'], run: 'jog', sit: 'sitting-idle', 'sit+talk': 'sitting-talking', talk: 'idle-talking',
      hammer: 'hammering', lute: 'guitar-playing', pray: 'pray', guard: 'polearm-idle', fish: 'idle-lantern', work: 'farm-harvest', sweep: 'shovel-dig', lie: 'sleeping', cheer: 'clapping',
      pickup: 'pick-up', jump: 'jump-air', block: 'sword-block', hit: 'hit-chest', die: 'death-a' };
    C.define('real', {
      dir: 'chars/real/', clips: 'clips.glb', bodies, lazy: FOES.map(f => f.body), foeLooks: { list: FOES, leader: FOE_LEADER }, textures: {}, materials: {},
      matOf(m) {
        const k = m.userData && m.userData.kind, n = m.name || '';
        if (k === 'body') return { kind: 'skin', gltf: true, rough: 0.72, oneSided: true, warm: [1.0, 0.9, 0.86] };
        if (k === 'hair') return { kind: 'hair', gltf: true, rough: 0.6, alpha: 0.18 };
        if (k === 'brow') return { kind: 'brow', gltf: true, rough: 0.8, alpha: 0.4 };
        if (k === 'eye') return { kind: 'eye', gltf: true, rough: 0.3, oneSided: true };
        const part = (PART.find(p => p[0].test(n)) || [0, 'cloth'])[1];
        return { kind: 'cloth', part, gltf: true, rough: 0.88 };
      },
      faces: 1, scale: 1,
      bones: { hips: 'pelvis', head: 'head', neck: 'neck_01', handR: 'hand_r', handL: 'hand_l', footR: 'foot_r', footL: 'foot_l' },
      anims: ANIMS, once: SETS.quaternius.once.slice(), rate: { hammer: 0.9 }, maxRate: 2.6,
      grip: [1.384, 0.06, -0.916, 0.023, 0.024, 0.014],       // the Quaternius grip carried over by the hand's finger, across and palm axes (tools/humans/README notes)
      look(def) {
        if (def.foe) return { body: def.foe.body, tint: Object.assign({ skin: SKIN_T[def.foe.body] || SKIN_T.light }, def.foe.tint) };
        const body = BODY[def.id] || (def.female ? 'f_farmer' : 'm_farmer');
        return { body, fit: FIT[body] || 1, tint: Object.assign({ skin: SKIN_T[body] || SKIN_T.light }, TINT[def.id]) };
      },
    });
  }

  // ── loading ──
  C.load = async function (setName, progress) {
    const cfg = SETS[setName]; if (!cfg) throw new Error('unknown character set ' + setName);
    const bodyNames = Object.keys(cfg.bodies).filter(n => !(cfg.lazy || []).includes(n)), texKeys = Object.keys(cfg.textures || {}), total = bodyNames.length + texKeys.length + 1; let done = 0;
    const tick = () => { if (progress) progress(++done / total); };
    const TL = new THREE.TextureLoader();
    const get = async f => { const g = await GL().loadAsync(cfg.dir + f); tick(); return g; };
    const tex = async k => {
      const d = cfg.textures[k], t = await TL.loadAsync(cfg.dir + (d.file || d));
      t.flipY = false; t.colorSpace = d.data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.needsUpdate = true; tick(); return [k, t];
    };
    const [clipFile, bodyFiles, texList] = await Promise.all([get(cfg.clips), Promise.all(bodyNames.map(n => get(cfg.bodies[n]))), Promise.all(texKeys.map(tex))]);
    const S = { name: setName, cfg, clips: {}, bodies: {}, tex: Object.fromEntries(texList), measure: {}, fitted: new Map(), geo: new Map() };
    for (const c of clipFile.animations) S.clips[c.name] = c;
    S.src = restPose(clipFile.scene);
    bodyNames.forEach((n, i) => addBody(S, n, bodyFiles[i]));
    for (const key of Object.keys(cfg.anims)) for (const cn of [].concat(cfg.anims[key])) if (!S.clips[cn]) console.warn('character set ' + setName + ': no clip "' + cn + '" for ' + key);
    C.set = S; C.cfg = cfg; C.ready = true; C.name = setName;
    return S;
  };
  const GL = () => GL.l || (GL.l = new T3X.GLTFLoader());
  C.ensure = async function (names) {
    const S = C.set; if (!S) throw new Error('Chars.load first');
    const need = [...new Set(names)].filter(n => !S.bodies[n] && S.cfg.bodies[n]);
    const files = await Promise.all(need.map(n => GL().loadAsync(S.cfg.dir + S.cfg.bodies[n])));
    need.forEach((n, i) => addBody(S, n, files[i]));
  };
  function addBody(S, n, gltf) {
    const cfg = S.cfg, scene = gltf.scene; scene.updateMatrixWorld(true);
    for (const c of gltf.animations || []) if (!S.clips[c.name]) S.clips[c.name] = c;       // a body file may bring its own clips
    const B = { scene, rest: restPose(scene), parts: {}, skel: null, armature: null };
    scene.traverse(o => {
      if (!o.isSkinnedMesh) return;
      if (!B.skel) { B.skel = o.skeleton; B.bindMatrix = o.bindMatrix.clone(); }
      const g = o.parent, part = g && g !== scene && !g.isBone && g.children.length && g.children.every(c => c.isSkinnedMesh) ? g.name : o.name;   // a mesh with several materials loads as a group
      (B.parts[part] = B.parts[part] || []).push(o);
    });
    if (!B.skel) throw new Error(cfg.bodies[n] + ' has no skinned mesh');
    let a = B.skel.bones[0]; while (a.parent && a.parent !== scene) a = a.parent; B.armature = a;
    const hs = S.src.pos[cfg.bones.hips], ht = B.rest.pos[cfg.bones.hips]; B.hipsRatio = hs && ht && hs.length() > 1e-4 ? ht.length() / hs.length() : 1;
    S.bodies[n] = B;
  }
  // rest pose of a skeleton: per node name its parent, local rotation, local position and world rotation
  function restPose(scene) {
    const R = { order: [], parent: {}, q: {}, pos: {}, w: {} };
    scene.traverse(o => {
      if (o === scene || o.isMesh || !o.name || R.q[o.name]) return;
      R.order.push(o.name); R.parent[o.name] = o.parent && o.parent !== scene ? o.parent.name : null; R.q[o.name] = o.quaternion.clone(); R.pos[o.name] = o.position.clone();
      const pw = R.parent[o.name] && R.w[R.parent[o.name]]; R.w[o.name] = pw ? pw.clone().multiply(o.quaternion) : o.quaternion.clone();
    });
    return R;
  }
  // A clip stores joint rotations for the skeleton it was made on. Bodies with slightly different rest poses (every Quaternius body has
  // its own) would bend wrongly if they played it as is, so each body gets a fitted copy: every joint turns by the same amount in
  // world space as on the source skeleton, starting from the body's own rest pose. Hip travel is scaled to the body's leg length.
  function clipFor(S, body, name) {
    const src = S.clips[name]; if (!src) return null;
    const key = body + '/' + name; let out = S.fitted.get(key); if (out) return out;
    const A = S.src, B = S.bodies[body].rest, rot = {}, tracks = []; let times = null;
    for (const t of src.tracks) { const dot = t.name.lastIndexOf('.'), bone = t.name.slice(0, dot), prop = t.name.slice(dot + 1); if (prop === 'quaternion' && A.q[bone] && B.q[bone]) { rot[bone] = t; if (!times || t.times.length > times.length) times = t.times; } }
    if (!times) { S.fitted.set(key, src); return src; }
    const n = times.length, vals = {}, Ws = {}, D = {}, Ws0i = {}, Wt0i = {}, q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), I = new THREE.Quaternion();
    for (const b of Object.keys(rot)) vals[b] = new Float32Array(n * 4);
    for (const b of A.order) { Ws0i[b] = A.w[b].clone().invert(); Ws[b] = new THREE.Quaternion(); D[b] = new THREE.Quaternion(); }
    for (const b of B.order) Wt0i[b] = B.w[b].clone().invert();
    for (let k = 0; k < n; k++) {
      for (const b of A.order) {
        const tr = rot[b], p = A.parent[b];
        if (tr) { const kk = Math.min(k, tr.times.length - 1) * 4; q.set(tr.values[kk], tr.values[kk + 1], tr.values[kk + 2], tr.values[kk + 3]); } else q.copy(A.q[b]);
        Ws[b].copy(p ? Ws[p] : I).multiply(q); D[b].copy(Ws[b]).multiply(Ws0i[b]);
        if (!tr) continue;
        const pt = B.parent[b];       // local = inv(parent rest world) * inv(parent turn) * turn * rest world
        q2.copy(pt ? Wt0i[pt] : I); if (pt && D[pt]) q2.multiply(q.copy(D[pt]).invert()); q2.multiply(D[b]).multiply(B.w[b]).normalize();
        const v = vals[b]; v[k * 4] = q2.x; v[k * 4 + 1] = q2.y; v[k * 4 + 2] = q2.z; v[k * 4 + 3] = q2.w;
      }
    }
    for (const b of Object.keys(rot)) { const m = rot[b].times.length; tracks.push(new THREE.QuaternionKeyframeTrack(b + '.quaternion', rot[b].times, m === n ? vals[b] : vals[b].slice(0, m * 4))); }
    const r = S.bodies[body].hipsRatio;
    for (const t of src.tracks) if (t.name === S.cfg.bones.hips + '.position') { const v = t.values.slice(); for (let i = 0; i < v.length; i++) v[i] *= r; tracks.push(new THREE.VectorKeyframeTrack(t.name, t.times, v)); }
    out = new THREE.AnimationClip(name, src.duration, tracks); S.fitted.set(key, out);
    return out;
  }

  // ── geometry: the chosen parts of a body, merged per material so a villager costs a handful of draws ──
  const ATTR = [['position', 3], ['normal', 3], ['uv', 2], ['skinIndex', 4], ['skinWeight', 4]];
  function mergedGeometry(S, body, parts, matName) {
    const key = body + '|' + matName + '|' + parts.join(','); let g = S.geo.get(key); if (g !== undefined) return g;
    const src = []; for (const p of parts) for (const m of S.bodies[body].parts[p] || []) if (m.material.name === matName) src.push(m.geometry);
    if (!src.length) { S.geo.set(key, null); return null; }
    let nv = 0, ni = 0; for (const s of src) { nv += s.attributes.position.count; ni += s.index ? s.index.count : s.attributes.position.count; }
    g = new THREE.BufferGeometry(); const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    for (const [name, size] of ATTR) {
      const arr = name === 'skinIndex' ? new Uint16Array(nv * size) : new Float32Array(nv * size); let o = 0;
      for (const s of src) { const a = s.attributes[name], c = s.attributes.position.count; for (let v = 0; v < c; v++) for (let k = 0; k < size; k++) arr[o++] = a ? a.getComponent(v, k) : 0; }
      g.setAttribute(name, new THREE.BufferAttribute(arr, size));
    }
    let io = 0, base = 0; for (const s of src) { const c = s.attributes.position.count; if (s.index) for (let i = 0; i < s.index.count; i++) idx[io++] = s.index.getX(i) + base; else for (let i = 0; i < c; i++) idx[io++] = i + base; base += c; }
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.6);
    S.geo.set(key, g); return g;
  }

  // ── material: the pack's colour maps, lit like the rest of the world (sun from the scene light; sky, bounce and hearths through emissive) ──
  function makeMaterial(S, H, matName, look, src) {
    const md = S.cfg.materials[matName] || (S.cfg.matOf && src && S.cfg.matOf(src)) || {}, m = new THREE.MeshStandardNodeMaterial(); m.name = matName;
    let key = (look.maps && look.maps[matName]) || md.map; if (key && typeof key === 'object') key = key[H.body];
    const map = key ? S.tex[key] : (md.gltf && src && src.map) || null, tint = look.tint && (look.tint[matName] || (md.part && look.tint[md.part]) || (md.kind && look.tint[md.kind]));
    if (tint) m.color.setRGB(tint[0], tint[1], tint[2]);
    m.roughness = md.rough === undefined ? 0.85 : md.rough; m.metalness = 0; m.side = md.oneSided ? THREE.FrontSide : THREE.DoubleSide;
    const tx = map ? texture(map, uv()) : null, albedo = (tx ? tx.rgb : vec3(1, 1, 1)).mul(materialColor);
    m.colorNode = md.alpha && tx ? vec4(albedo, tx.a) : vec4(albedo, 1);
    if (md.alpha && tx) m.alphaTest = md.alpha;
    if (C.normalMaps && md.normal && S.tex[md.normal]) m.normalNode = normalMap(texture(S.tex[md.normal], uv()));
    const N = normalWorld.normalize();
    let lit = SH.hemi(N, H.uLight, H.uZone).add(SH.pointLights(positionWorld, N, H.uZone, float(0.25)));
    if (md.warm) lit = lit.mul(vec3(...md.warm));       // skin keeps a little red in the shade, as light scattered under it does
    m.emissiveNode = albedo.mul(lit);
    return m;
  }

  // ── spawning ──
  const cloneBones = o => { const c = o.clone(false); for (const ch of o.children) if (ch.isBone) c.add(cloneBones(ch)); return c; };
  C.spawn = function (def) {
    const S = C.set; if (!S) throw new Error('Chars.load first');
    const cfg = S.cfg, look = cfg.look ? cfg.look(def) : {}, body = S.bodies[look.body] ? look.body : Object.keys(S.bodies)[0], B = S.bodies[body];
    const root = cloneBones(B.armature), byName = {}; root.traverse(o => { byName[o.name] = o; });
    const skeleton = new THREE.Skeleton(B.skel.bones.map(b => byName[b.name]), B.skel.boneInverses);
    const H = { def, set: S, body, root, pivot: new THREE.Group(), skeleton, uZone: uniform(0), uLight: uniform(1), bones: {}, actions: {}, cur: null, curName: '', seed: 0, mats: [], meshes: [] };
    for (let i = 0, id = String(def.id || C.list.length); i < id.length; i++) H.seed = (H.seed * 31 + id.charCodeAt(i)) >>> 0;
    const parts = (look.parts || Object.keys(B.parts)).filter(p => B.parts[p]).sort(), names = new Set();
    for (const p of parts) for (const m of B.parts[p]) names.add(m.material.name);
    H.fit = look.fit || 1;
    for (const mn of names) {
      const g = mergedGeometry(S, body, parts, mn); if (!g) continue;
      let src = null; for (const p of parts) for (const m of B.parts[p]) if (!src && m.material.name === mn) src = m.material;
      const mat = makeMaterial(S, H, mn, look, src), mesh = new THREE.SkinnedMesh(g, mat);
      mesh.name = mn; mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); mesh.bind(skeleton, B.bindMatrix);
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); mesh.frustumCulled = true;      // a fixed sphere: each pass (camera, shadow maps) culls villagers itself
      H.mats.push(mat); H.meshes.push(mesh);
    }
    for (const k of Object.keys(cfg.bones)) H.bones[k] = byName[cfg.bones[k]] || null;
    H.mixer = new THREE.AnimationMixer(root);
    H.pivot.add(root); H.pivot.name = 'villager:' + (def.id || ''); root.scale.setScalar(cfg.scale || 1);
    C.group.add(H.pivot); C.list.push(H);
    return H;
  };
  C.remove = function (H) { H.mixer.stopAllAction(); C.group.remove(H.pivot); for (const m of H.mats) m.dispose(); H.skeleton.dispose(); const i = C.list.indexOf(H); if (i >= 0) C.list.splice(i, 1); };
  C.attach = function (H, bone, obj) { const b = H.bones[bone] || H.root.getObjectByName(bone); if (b) b.add(obj); return !!b; };

  // ── animation ──
  function action(H, clipName) {
    let a = H.actions[clipName];
    if (a === undefined) {
      const clip = clipFor(H.set, H.body, clipName);
      a = H.actions[clipName] = clip ? H.mixer.clipAction(clip) : null;
      if (a && H.set.cfg.once && H.set.cfg.once.includes(clipName)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    }
    return a;
  }
  function clipNameFor(H, key) {
    const c = H.set.cfg.anims[key] !== undefined ? H.set.cfg.anims[key] : H.set.cfg.anims.idle;
    return Array.isArray(c) ? c[H.seed % c.length] : c;
  }
  const FADE = 0.25;
  function play(H, key) {
    const name = clipNameFor(H, key); if (name === H.curName) return;
    const next = action(H, name); if (!next) return;
    next.reset(); next.setEffectiveWeight(1); next.setEffectiveTimeScale((H.set.cfg.rate && H.set.cfg.rate[key]) || 1);
    if (H.cur) { H.cur.fadeOut(FADE); next.fadeIn(FADE); }
    else next.time = (H.seed % 97) / 97 * next.getClip().duration;      // villagers do not all start in step
    next.play(); H.cur = next; H.curName = name; H.curKey = key;
  }
  // where a clip puts the body, measured once per body and clip by posing a bare skeleton with it: hip height (for seats) and the lying axis (for beds)
  function measure(H, key) {
    const name = clipNameFor(H, key), id = H.body + '/' + name; let m = H.set.measure[id]; if (m) return m;
    const clip = clipFor(H.set, H.body, name);
    m = H.set.measure[id] = { hips: 0.9, hx: 0, hz: 0, ang: 0, cx: 0, cz: 0 };
    if (!clip) return m;
    const tmp = cloneBones(H.set.bodies[H.body].armature), mx = new THREE.AnimationMixer(tmp);
    mx.clipAction(clip).play(); mx.setTime(0); tmp.updateMatrixWorld(true);
    const bn = H.set.cfg.bones, g = n => { const o = tmp.getObjectByName(bn[n]); return o ? o.getWorldPosition(new THREE.Vector3()) : null; };
    const hips = g('hips'), head = g('head'), fl = g('footL'), fr = g('footR');
    if (hips) { m.hips = hips.y; m.hx = hips.x; m.hz = hips.z; }
    if (head && fl && fr) { const fx = (fl.x + fr.x) / 2, fz = (fl.z + fr.z) / 2; m.ang = Math.atan2(head.x - fx, head.z - fz); m.cx = (head.x + fx) / 2; m.cz = (head.z + fz) / 2; }
    mx.stopAllAction(); mx.uncacheRoot(tmp);
    return m;
  }
  // ground speed a walking or running clip was animated for, in model units per second: twice the distance one foot covers
  // front to back, per cycle. Lets the clip be played at the rate that matches how fast the villager really moves.
  function gait(H, key) {
    const name = clipNameFor(H, key), id = H.body + '/gait/' + name; let v = H.set.measure[id]; if (v !== undefined) return v;
    const clip = clipFor(H.set, H.body, name); v = 0;
    if (clip && clip.duration > 0.05) {
      const tmp = cloneBones(H.set.bodies[H.body].armature), mx = new THREE.AnimationMixer(tmp), foot = tmp.getObjectByName(H.set.cfg.bones.footL), P = new THREE.Vector3();
      mx.clipAction(clip).play(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      if (foot) for (let i = 0; i < 24; i++) { mx.setTime(clip.duration * i / 24); tmp.updateMatrixWorld(true); foot.getWorldPosition(P); x0 = Math.min(x0, P.x); x1 = Math.max(x1, P.x); z0 = Math.min(z0, P.z); z1 = Math.max(z1, P.z); }
      if (foot) v = 2 * Math.max(x1 - x0, z1 - z0) / clip.duration;
      mx.stopAllAction(); mx.uncacheRoot(tmp);
    }
    return H.set.measure[id] = v;
  }
  // turn a bone by a rotation given in the villager's own space (after the clip has posed it)
  const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _e = new THREE.Euler();
  function turnBone(H, bone, yaw, pitch) {
    if (!bone) return;
    _p.identity(); for (let o = bone.parent; o && o !== H.root; o = o.parent) _p.premultiply(o.quaternion);
    _pi.copy(_p).invert(); _e.set(pitch, yaw, 0, 'YXZ'); _q.setFromEuler(_e);
    bone.quaternion.premultiply(_p).premultiply(_q).premultiply(_pi);
  }

  // ── per frame ──
  C.update = function (H, st, dt) {
    const cfg = H.set.cfg, pv = H.pivot;
    pv.visible = st.visible !== false; if (!pv.visible) return;
    const base = st.anim || 'idle', seated = base === 'sit', lying = base === 'lie';
    const key = st.talking ? (lying ? 'lie' : seated ? (cfg.anims['sit+talk'] ? 'sit+talk' : 'sit') : 'talk') : base;
    play(H, key);
    const s = st.scale || 1, k = (cfg.scale || 1) * s * H.fit;
    if (H.cur && (key === 'walk' || key === 'run')) { const g = gait(H, key) * k, rate = (cfg.rate && cfg.rate[key]) || 1; H.cur.setEffectiveTimeScale(st.speed > 0 && g > 0.2 ? Math.min(Math.max(st.speed / g, 0.6), cfg.maxRate || 1.8) : rate); }
    H.mixer.update(dt);
    const p = st.pos, yaw = st.yaw || 0, face = cfg.faces === -1 ? 0 : Math.PI;
    H.root.scale.setScalar(k);
    if (lying) {
      const m = measure(H, 'lie'), th = Math.PI - yaw - m.ang, c = Math.cos(th), sn = Math.sin(th);      // head toward the spot's heading, body centred on it
      pv.rotation.y = th; pv.position.set(p[0] - (m.cx * c + m.cz * sn) * k, p[1] + 0.02, p[2] - (-m.cx * sn + m.cz * c) * k);
    } else {
      const th = face - yaw; let x = p[0], y = p[1], z = p[2];
      if (seated) {      // the hips go where the old villagers had theirs: over the spot, just above the seat (sitting clips lean the body back from its origin)
        const m = measure(H, 'sit'), c = Math.cos(th), sn = Math.sin(th);
        y += (st.seatHeight || 0.46) + 0.09 * s - m.hips * k; x -= (m.hx * c + m.hz * sn) * k; z -= (-m.hx * sn + m.hz * c) * k;
      }
      pv.rotation.y = th; pv.position.set(x, y, z);
    }
    if (st.cast !== undefined && st.cast !== H.cast) { H.cast = st.cast; for (const m of H.meshes) m.castShadow = st.cast; }
    H.uZone.value = st.zone || 0; H.uLight.value = st.light === undefined ? 1 : st.light;
    // Head look. The mixer only rewrites a joint when its animated value changed, so a turn added last frame may still be in the
    // joint: take it out again before adding this frame's.
    const lk = st.look, nb = H.bones.neck, hb = H.bones.head, L = H.lookState || (H.lookState = [nb, hb].map(() => ({ base: new THREE.Quaternion(), mine: new THREE.Quaternion(), on: false })));
    [nb, hb].forEach((b, i) => { if (!b) return; const e = L[i]; if (e.on && b.quaternion.equals(e.mine)) b.quaternion.copy(e.base); else e.base.copy(b.quaternion); e.on = false; });
    if (lk && !lying && (Math.abs(lk[0]) > 0.01 || Math.abs(lk[1]) > 0.01)) {
      const sg = cfg.faces === -1 ? -1 : 1;
      turnBone(H, nb, lk[0] * 0.35, lk[1] * 0.35 * sg); turnBone(H, hb, lk[0] * 0.65, lk[1] * 0.65 * sg);
      [nb, hb].forEach((b, i) => { if (b) { L[i].mine.copy(b.quaternion); L[i].on = true; } });
    }
  };
  return C;
})();
