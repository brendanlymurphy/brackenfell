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
  const { vec2, vec3, vec4, float, uniform, texture, uv, positionWorld, normalWorld, materialColor, normalMap, Fn } = TSL;
  const SETS = {};
  const C = { group: new THREE.Group(), set: null, cfg: null, list: [], ready: false, normalMaps: true, merge: !(TEST && TEST.chars === 'split') };   // merge: one mesh and material per villager; false = one per texture (the old way)
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
      hale: { tunic: [0.92, 0.92, 0.98] }, brandt: { boots: [0.34, 0.32, 0.3] }, marta: { boots: [0.34, 0.32, 0.3] },      // these two came with very pale boots
       ivo: { tunic: [0.8, 0.88, 1.1], pants: [0.8, 0.8, 0.85] }, bram: { tunic: [1.05, 1.0, 0.9] }, hilda: { robe: [0.95, 0.95, 1.1] },
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
        if (k === 'hair') return { kind: 'hair', gltf: true, rough: 0.9, alpha: 0.18 };
        if (k === 'brow') return { kind: 'brow', gltf: true, rough: 0.8, alpha: 0.22 };
        if (k === 'eye') return { kind: 'eye', gltf: true, rough: 0.3, oneSided: true };
        const part = (PART.find(p => p[0].test(n)) || [0, 'cloth'])[1];
        return { kind: 'cloth', part, gltf: true, rough: 0.88 };
      },
      texMax(md) { return md.kind === 'skin' ? 512 : md.kind === 'hair' ? 256 : md.kind === 'brow' ? 128 : md.kind === 'eye' ? 128 : /tunic|robe|skirt/.test(md.part) ? 384 : md.part === 'pants' ? 128 : 256; },      // pixel ceiling per texture, on top of gfxTex's tier caps (halved on Low)
      faces: 1, scale: 1,
      // Where things are in the textures every MakeHuman body shares. Skin atlas: u runs down the face (eyes 0.83, nose 0.87, lips 0.905,
      // chin 0.955), v across it (0.517 is the middle). Eye texture: the two irises' centres and radius. Used to open the mouth, blink
      // and move the eyes without any face joints (the rig has none).
      face: { mouth: [0.906, 0.517], lids: [0.482, 0.552], iris: [[0.705, 0.295], [0.29, 0.705]], irisR: 0.118 },
      bones: { hips: 'pelvis', head: 'head', neck: 'neck_01', handR: 'hand_r', handL: 'hand_l', footR: 'foot_r', footL: 'foot_l' },
      anims: ANIMS, once: SETS.quaternius.once.slice(), rate: { hammer: 0.9 }, maxRate: 2.6,
      grip: [1.384, 0.06, -0.916, 0.023, 0.024, 0.014],       // the Quaternius grip carried over by the hand's finger, across and palm axes (tools/humans/README notes)
      look(def) {
        if (def.foe) return { body: def.foe.body, tint: Object.assign({ skin: SKIN_T[def.foe.body] || SKIN_T.light }, def.foe.tint) };
        const body = BODY[def.id] || def.body || (def.female ? 'f_farmer' : 'm_farmer');          // def.body / def.tint: the inn's regulars (77c_patrons.js) wear other people's bodies in other colours
        // Clothes by person: the villager's own colours (NPC_DEFS top / legs, chosen for their trade) dye the tunic, robe or dress and the
        // trousers; headwear and belt come from the same table. People without an entry (inn regulars, passers-by) get muted wool and
        // linen colours and, some of them, a cap, by their id: the better-off wear deeper dyes, a pouch and a buckle.
        let h = 0; for (const ch of String(def.id || body)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const r = k => ((h >>> (k * 5)) % 97) / 97;
        const POOR = [[0.30, 0.25, 0.19], [0.36, 0.33, 0.27], [0.24, 0.23, 0.21], [0.33, 0.27, 0.17], [0.27, 0.29, 0.22]], RICH = [[0.34, 0.10, 0.09], [0.11, 0.17, 0.33], [0.13, 0.25, 0.15], [0.30, 0.20, 0.34], [0.09, 0.09, 0.10]];
        const sq = c => { if (!c) return c; const q = c.map(v => v * v), g = 0.3 * q[0] + 0.6 * q[1] + 0.1 * q[2]; return q.map(v => (g + (v - g) * 0.62) * 0.9); };          // the table's colours are written the way the old bodies used them (squared before use); plant dyes are duller than paint, so they are also pulled toward grey
        const rich = def.wealth !== undefined ? def.wealth : r(0), pal = rich > 0.72 ? RICH : POOR, top = sq(def.top) || (def.tint ? null : pal[Math.floor(r(1) * pal.length)]), legs = sq(def.legs) || [0.10 + r(2) * 0.06, 0.085 + r(2) * 0.05, 0.065 + r(2) * 0.04];
        const isRobe = /monk|elder/.test(body), dye = def.foe ? null : Object.assign({}, top && !isRobe ? { tunic: top, skirt: top } : {}, top && isRobe && def.top ? { robe: top } : {}, { pants: legs });
        const hatT = def.hat === 'hood' ? null : def.hat || (def.foe || def.sched ? null : r(3) < 0.3 ? 'cap' : null), HATC = { straw: [0.42, 0.33, 0.15], helmet: [0.17, 0.175, 0.19], kerchief: [0.62, 0.58, 0.48], cap: pal[Math.floor(r(4) * pal.length)], feather: [0.16, 0.22, 0.14] };
        const acc = { hat: hatT, belt: !isRobe || !!def.belt, pouch: !!def.belt || rich > 0.6, col: [def.hatCol && def.hat !== 'helmet' ? sq(def.hatCol).map(v => v * 0.85) : HATC[hatT] || HATC.cap, def.belt ? sq(def.belt).map(v => v * 0.8) : [0.14, 0.09, 0.055], def.hat === 'helmet' ? HATC.helmet : [0.30, 0.29, 0.27], [0.19, 0.12, 0.07]] };
        return { body, fit: FIT[body] || 1, tint: Object.assign({ skin: SKIN_T[body] || SKIN_T.light }, TINT[def.id], def.tint), dye, acc };
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
      t.flipY = false; t.colorSpace = d.data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.needsUpdate = true; tick(); return [k, await gfxTex(t, d.data ? 'data' : 'color')];
    };
    const [clipFile, bodyFiles, texList] = await Promise.all([get(cfg.clips), Promise.all(bodyNames.map(n => get(cfg.bodies[n]))), Promise.all(texKeys.map(tex))]);
    const S = { name: setName, cfg, clips: {}, bodies: {}, tex: Object.fromEntries(texList), measure: {}, fitted: new Map(), geo: new Map() };
    for (const c of clipFile.animations) S.clips[c.name] = c;
    S.src = restPose(clipFile.scene);
    for (let i = 0; i < bodyNames.length; i++) await addBody(S, bodyNames[i], bodyFiles[i]);
    for (const key of Object.keys(cfg.anims)) for (const cn of [].concat(cfg.anims[key])) if (!S.clips[cn]) console.warn('character set ' + setName + ': no clip "' + cn + '" for ' + key);
    C.set = S; C.cfg = cfg; C.ready = true; C.name = setName;
    return S;
  };
  const GL = () => GL.l || (GL.l = T3X.gltf());
  C.ensure = async function (names) {
    const S = C.set; if (!S) throw new Error('Chars.load first');
    const need = [...new Set(names)].filter(n => !S.bodies[n] && S.cfg.bodies[n]);
    const files = await Promise.all(need.map(n => GL().loadAsync(S.cfg.dir + S.cfg.bodies[n])));
    for (let i = 0; i < need.length; i++) await addBody(S, need[i], files[i]);
  };
  async function addBody(S, n, gltf) {
    const cfg = S.cfg, scene = gltf.scene; scene.updateMatrixWorld(true);
    if (cfg.matOf) {      // textures that came inside the GLB: capped and shared through gfxTex like every other character texture
      const seen = new Set();
      scene.traverse(o => { if (o.isMesh && o.material) seen.add(o.material); });
      for (const m of seen) {
        if (!m.map) continue;
        const md = cfg.matOf(m) || {}; m.map.anisotropy = 4;
        m.map = await gfxTex(m.map, 'color', cfg.texMax ? cfg.texMax(md, m) : 0);
      }
    }
    for (const c of gltf.animations || []) if (!S.clips[c.name]) S.clips[c.name] = c;       // a body file may bring its own clips
    const B = { scene, rest: restPose(scene), parts: {}, lodParts: {}, skel: null, armature: null };
    scene.traverse(o => {
      if (!o.isSkinnedMesh) return;
      if (!B.skel) { B.skel = o.skeleton; B.bindMatrix = o.bindMatrix.clone(); }
      const g = o.parent, part = g && g !== scene && !g.isBone && g.children.length && g.children.every(c => c.isSkinnedMesh) ? g.name : o.name;   // a mesh with several materials loads as a group
      { const lv = /@(lod|mid|far)$/.exec(part); if (lv) { const k = part.slice(0, -4), L = B.lodParts[lv[1]] || (B.lodParts[lv[1]] = {}); (L[k] = L[k] || []).push(o); return; } }      // lighter copies (tools/chars_lod.mjs: mid, lod, far) are kept apart
      (B.parts[part] = B.parts[part] || []).push(o); if (o.material && o.material.userData && o.material.userData.kind === 'body') B.skinName = o.material.name;
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
  // ── things worn on top of a body: headwear and a belt, built here to the body's own measure ──
  // They are part of the villager's one mesh (no extra draw call): each piece hangs on a single joint (head or lower spine) and its
  // texture coordinate u = 3 + slot tells the material which of the villager's four accessory colours to use (0 headwear, 1 belt, 2 metal, 3 pouch).
  // acc: { hat: 'cap' | 'straw' | 'kerchief' | 'helmet' | 'feather', belt: true, pouch: true }
  function accGeometry(S, body, src, acc) {
    const B = S.bodies[body], bones = B.skel.bones, bi = n => bones.findIndex(b => b.name === n), headI = bi(S.cfg.bones.head), spineI = bi('spine_01');
    const P = [], UV = [], SI = [], IX = [], v = (x, y, z, slot, bone) => { P.push(x, y, z); UV.push(3 + slot, 0.5); SI.push(bone); return P.length / 3 - 1; };
    const quad = (a, b, c, d) => IX.push(a, b, c, a, c, d);
    const pts = []; for (const g of src) { const A = g.attributes.position; for (let i = 0; i < A.count; i++) pts.push([A.getX(i), A.getY(i), A.getZ(i)]); }
    const pct = (arr, q) => { arr.sort((a, b) => a - b); return arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * q))] : 0; };
    if (acc.hat && headI >= 0) {
      let top = -1e9; for (const p of pts) if (Math.abs(p[0]) < 0.2) top = Math.max(top, p[1]);
      const sl = pts.filter(p => p[1] > top - 0.13 && p[1] < top - 0.045 && Math.abs(p[0]) < 0.16), cx = sl.reduce((a, p) => a + p[0], 0) / sl.length, cz = sl.reduce((a, p) => a + p[2], 0) / sl.length;
      const rx = pct(sl.map(p => Math.abs(p[0] - cx)), 0.94) + 0.010, rz = pct(sl.map(p => Math.abs(p[2] - cz)), 0.94) + 0.012, t = acc.hat;
      // a dome from a base ring up over the crown; drop(angle) lowers the base (a kerchief hangs lower at the back)
      const dome = (y0, h, kx, kz, slot, drop, segs, rings) => { const rows = [];
        for (let j = 0; j <= rings; j++) { const f = j / rings, ph = f * Math.PI / 2, row = []; for (let i = 0; i < segs; i++) { const th = i / segs * TAU, d = drop ? drop(th) * (1 - f) : 0; row.push(v(cx + Math.cos(th) * rx * kx * Math.cos(ph), y0 - d + (h + d) * Math.sin(ph), cz + Math.sin(th) * rz * kz * Math.cos(ph), slot, headI)); } rows.push(row); }
        for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) quad(rows[j][i], rows[j + 1][i], rows[j + 1][(i + 1) % segs], rows[j][(i + 1) % segs]); };
      const brim = (y, k0, k1, droop, slot, segs) => { const a = [], b = []; for (let i = 0; i < segs; i++) { const th = i / segs * TAU; a.push(v(cx + Math.cos(th) * rx * k0, y, cz + Math.sin(th) * rz * k0, slot, headI)); b.push(v(cx + Math.cos(th) * (rx * k0 + k1), y - droop, cz + Math.sin(th) * (rz * k0 + k1), slot, headI)); }
        for (let i = 0; i < segs; i++) quad(a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]); };
      if (t === 'cap' || t === 'feather') { dome(top - 0.050, 0.068, 1.0, 1.0, 0, th => 0.045 * Math.max(0, -Math.sin(th)) + 0.012 * Math.abs(Math.cos(th)), 10, 3); if (t === 'feather') { const a = v(cx + rx * 0.7, top - 0.02, cz, 2, headI), b = v(cx + rx * 0.9, top - 0.03, cz - 0.02, 2, headI), c = v(cx + rx * 0.75, top + 0.12, cz - 0.07, 2, headI); IX.push(a, b, c); } }
      else if (t === 'straw') { dome(top - 0.048, 0.062, 0.96, 0.96, 0, null, 10, 2); brim(top - 0.046, 0.97, 0.15, 0.03, 0, 12); }
      else if (t === 'helmet') { dome(top - 0.052, 0.074, 1.03, 1.03, 2, th => 0.02 * Math.max(0, -Math.sin(th)), 10, 3); brim(top - 0.050, 1.03, 0.04, 0.018, 2, 12); }
      else if (t === 'kerchief') { dome(top - 0.052, 0.070, 1.02, 1.03, 0, th => 0.10 * Math.max(0, -Math.sin(th)) + 0.045 * Math.abs(Math.cos(th)), 12, 3); }
    }
    if (acc.belt && spineI >= 0) {
      // the waist: lower-spine joint's height at rest; the belt follows the body's outline there, a finger's width outside the clothes
      const m = new THREE.Matrix4().copy(B.skel.boneInverses[spineI]).invert(), yw = m.elements[13] + 0.01, sl = pts.filter(p => Math.abs(p[1] - yw) < 0.03 && Math.abs(p[0]) < 0.24);
      if (sl.length > 12) { const cx = sl.reduce((a, p) => a + p[0], 0) / sl.length, cz = sl.reduce((a, p) => a + p[2], 0) / sl.length, N = 14, rad = new Array(N).fill(0);
        for (const p of sl) { const a = Math.atan2(p[2] - cz, p[0] - cx), k = ((Math.round(a / TAU * N) % N) + N) % N; rad[k] = Math.max(rad[k], Math.hypot(p[0] - cx, p[2] - cz)); }
        const mean = rad.reduce((a, b) => a + b, 0) / N; for (let k = 0; k < N; k++) if (rad[k] < mean * 0.6) rad[k] = Math.max(rad[(k + 1) % N], rad[(k + N - 1) % N], mean * 0.8);
        const sm = rad.map((r, k) => Math.max(r, (rad[(k + 1) % N] + rad[(k + N - 1) % N]) / 2) + 0.007), lo = [], hi = [];
        for (let k = 0; k < N; k++) { const th = k / N * TAU; lo.push(v(cx + Math.cos(th) * sm[k], yw - 0.019, cz + Math.sin(th) * sm[k], 1, spineI)); hi.push(v(cx + Math.cos(th) * sm[k], yw + 0.019, cz + Math.sin(th) * sm[k], 1, spineI)); }
        for (let k = 0; k < N; k++) quad(lo[k], lo[(k + 1) % N], hi[(k + 1) % N], hi[k]);
        const box = (x, y, z, hx, hy, hz, slot) => { const c = []; for (let i = 0; i < 8; i++) c.push(v(x + (i & 1 ? hx : -hx), y + (i & 2 ? hy : -hy), z + (i & 4 ? hz : -hz), slot, spineI)); for (const f of [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]]) quad(c[f[0]], c[f[1]], c[f[2]], c[f[3]]); };
        const kf = Math.round(N / 4), rf = sm[kf]; box(cx, yw, cz + rf + 0.002, 0.013, 0.015, 0.004, 2);                                   // buckle, in front
        if (acc.pouch) { const k = Math.round(N * 0.11), th = k / N * TAU; box(cx + Math.cos(th) * (sm[k] + 0.018), yw - 0.052, cz + Math.sin(th) * (sm[k] + 0.018), 0.032, 0.040, 0.020, 3); } }
    }
    if (!IX.length) return null;
    const n = P.length / 3, g = new THREE.BufferGeometry(), BA = THREE.BufferAttribute, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = SI[i]; sw[i * 4] = 1; }
    g.setAttribute('position', new BA(new Float32Array(P), 3)); g.setAttribute('uv', new BA(new Float32Array(UV), 2)); g.setAttribute('skinIndex', new BA(si, 4)); g.setAttribute('skinWeight', new BA(sw, 4)); g.setIndex(new BA(new Uint16Array(IX), 1)); g.computeVertexNormals();
    return g;
  }
  function mergedGeometry(S, body, parts, matName, names, lod, acc) {
    const key = body + '|' + (matName || '*') + '|' + parts.join(',') + (lod ? '|' + lod : '') + (acc && names ? '|' + (acc.hat || '') + (acc.belt ? 'b' : '') + (acc.pouch ? 'p' : '') : ''); let g = S.geo.get(key); if (g !== undefined) return g;
    const src = [], mids = []; for (const p of parts) for (const m of (lod ? S.bodies[body].lodParts[lod] || {} : S.bodies[body].parts)[p] || []) if (!matName || m.material.name === matName) { src.push(m.geometry); mids.push(names ? names.indexOf(m.material.name) : 0); }
    if (!src.length) { S.geo.set(key, null); return null; }
    // Behind the lips: a small dark card on the head joint, so an opening mouth shows a mouth and not the street behind the head.
    // Its texture coordinate (2, 2) is what the material reads as "inside of the mouth". Only the two close-up weights carry it.
    if (names && (!lod || lod === 'mid') && S.cfg.face) { const B = S.bodies[body], F = S.cfg.face;
      let skinMid = -1, cx = 0, cy = 0, cz = 0, n = 0;
      src.forEach((g, i) => { const U_ = g.attributes.uv, P_ = g.attributes.position; if (!U_ || !B.skinName || names[mids[i]] !== B.skinName) return; skinMid = mids[i];
        for (let v = 0; v < P_.count; v++) if (Math.abs(U_.getX(v) - F.mouth[0]) < 0.006 && Math.abs(U_.getY(v) - F.mouth[1]) < 0.022) { cx += P_.getX(v); cy += P_.getY(v); cz += P_.getZ(v); n++; } });
      const hi = B.skel ? B.skel.bones.findIndex(b => b.name === S.cfg.bones.head) : -1;
      if (n && hi >= 0 && skinMid >= 0) { cx /= n; cy /= n; cz /= n; const w = 0.021, h = 0.017, z = cz - 0.011, y = cy - 0.005, g = new THREE.BufferGeometry(), BA = THREE.BufferAttribute;
        g.setAttribute('position', new BA(new Float32Array([cx - w, y - h, z, cx + w, y - h, z, cx + w, y + h, z, cx - w, y + h, z]), 3)); g.setAttribute('normal', new BA(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
        g.setAttribute('uv', new BA(new Float32Array([2, 2, 2, 2, 2, 2, 2, 2]), 2)); g.setAttribute('skinIndex', new BA(new Uint16Array([hi, 0, 0, 0, hi, 0, 0, 0, hi, 0, 0, 0, hi, 0, 0, 0]), 4)); g.setAttribute('skinWeight', new BA(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]), 4));
        g.setIndex(new BA(new Uint16Array([0, 1, 2, 0, 2, 3]), 1)); src.push(g); mids.push(skinMid); } }
    if (names && acc && (acc.hat || acc.belt) && S.cfg.face) { const B = S.bodies[body], si = names.indexOf(B.skinName); let ag = null; try { ag = si >= 0 ? accGeometry(S, body, src.slice(), acc) : null; } catch (e) { console.warn('accessories for ' + body + ': ' + (e && e.message || e)); } if (ag) { src.push(ag); mids.push(si); } }
    let nv = 0, ni = 0; for (const s of src) { nv += s.attributes.position.count; ni += s.index ? s.index.count : s.attributes.position.count; }
    g = new THREE.BufferGeometry(); const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    for (const [name, size] of ATTR) {
      const arr = name === 'skinIndex' ? new Uint16Array(nv * size) : new Float32Array(nv * size); let o = 0;
      for (const s of src) { const a = s.attributes[name], c = s.attributes.position.count; for (let v = 0; v < c; v++) for (let k = 0; k < size; k++) arr[o++] = a ? a.getComponent(v, k) : 0; }
      g.setAttribute(name, new THREE.BufferAttribute(arr, size));
    }
    if (names) { const mid = new Float32Array(nv); let o = 0; src.forEach((s, i) => { const c = s.attributes.position.count; mid.fill(mids[i], o, o + c); o += c; }); g.setAttribute('mid', new THREE.BufferAttribute(mid, 1)); }
    let io = 0, base = 0; for (const s of src) { const c = s.attributes.position.count; if (s.index) for (let i = 0; i < s.index.count; i++) idx[io++] = s.index.getX(i) + base; else for (let i = 0; i < c; i++) idx[io++] = i + base; base += c; }
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.6);
    S.geo.set(key, g); return g;
  }

  // ── material: the pack's colour maps, lit like the rest of the world (sun from the scene light; sky, bounce and hearths through emissive) ──
  // average brightness of a texture (linear, 0..1), from an 8 x 8 copy: lets a dye keep the cloth's own light and shade
  function meanLum(map) {
    if (map.userData.meanLum) return map.userData.meanLum; let v = 0.3;
    try { const c = meanLum.cv || (meanLum.cv = document.createElement('canvas')); c.width = c.height = 8; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(map.image, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; let a = 0; for (let i = 0; i < 256; i += 4) a += Math.pow((0.3 * d[i] + 0.6 * d[i + 1] + 0.1 * d[i + 2]) / 255, 2.2); v = Math.max(0.03, a / 64); } catch (e) { }
    return map.userData.meanLum = v;
  }
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

  // One material for a whole villager (skin, face, eyes, hair, clothes): a per-vertex 'mid' picks which of the pack's textures, tint and
  // roughness a fragment uses, so the villager is one draw call (and one shadow draw) instead of five or six. Textures keep their own UVs.
  function makeMergedMaterial(S, H, names, look, srcOf) {
    const { attribute, abs, Discard, If, frontFacing, normalView, clamp } = TSL;
    const m = new THREE.MeshStandardNodeMaterial(); m.name = 'villager'; m.side = THREE.DoubleSide; m.metalness = 0;
    const mid = attribute('mid', 'float'), U = uv(), N = normalWorld.normalize();
    let albedo = vec3(0, 0, 0), rough = float(0), nrm = null, nw = float(0), one = float(0), eyeW = float(0), skinW = float(0), hairW = float(0), cut = float(0), alpha = float(1), warm = vec3(0, 0, 0), anyAlpha = false, anyWarm = false, anyEye = false, skinI = -1;
    const F = S.cfg.face || null, UE = F ? U.add(H.uGaze) : U;          // the eye texture is read a little off-centre: that is how the eyes move
    names.forEach((mn, i) => {
      const src = srcOf && srcOf[mn], md = S.cfg.materials[mn] || (S.cfg.matOf && src && S.cfg.matOf(src)) || {}, w = clamp(float(1).sub(abs(mid.sub(i))), 0, 1);
      let key = (look.maps && look.maps[mn]) || md.map; if (key && typeof key === 'object') key = key[H.body];
      const map = key ? S.tex[key] : (md.gltf && src && src.map) || null, tint = look.tint && (look.tint[mn] || (md.part && look.tint[md.part]) || (md.kind && look.tint[md.kind])) || [1, 1, 1];
      const tx = map ? texture(map, md.kind === 'eye' ? UE : U) : null;
      if (md.kind === 'skin') { skinW = skinW.add(w); skinI = i; } if (md.kind === 'hair') hairW = hairW.add(w);
      // dyed cloth: the garment keeps its weave and folds (the texture's light and dark) but takes the villager's own colour
      const dye = md.kind === 'cloth' && look.dye && look.dye[md.part];
      if (dye && tx) { const ml = meanLum(map); albedo = albedo.add(vec3(dye[0], dye[1], dye[2]).mul(TSL.clamp(tx.rgb.dot(vec3(0.3, 0.6, 0.1)).div(ml), 0.35, 1.9)).mul(w)); }
      else albedo = albedo.add((tx ? tx.rgb : vec3(1, 1, 1)).mul(vec3(tint[0], tint[1], tint[2])).mul(w));
      rough = rough.add(w.mul(md.rough === undefined ? 0.85 : md.rough));
      if (md.oneSided) one = one.add(w);
      if (md.kind === 'eye') { eyeW = eyeW.add(w); anyEye = true; }
      if (md.alpha && tx) { anyAlpha = true; alpha = alpha.add(w.mul(tx.a.sub(1))); cut = cut.add(w.mul(md.alpha)); }      // cut-out hair and brows: this fragment's alpha and threshold
      const wm = md.warm || [1, 1, 1]; if (md.warm) anyWarm = true; warm = warm.add(vec3(wm[0], wm[1], wm[2]).mul(w));
      if (C.normalMaps && md.normal && S.tex[md.normal]) { const nm = normalMap(texture(S.tex[md.normal], U)); nrm = nrm ? nrm.add(nm.mul(w)) : nm.mul(w); nw = nw.add(w); }
    });
    const V_ = SH.U.camPos.sub(positionWorld).normalize(), up = F ? H.uHead.mul(vec3(0, 1, 0)).normalize() : vec3(0, 1, 0);
    if (F && anyEye) {
      // Eyes. The stock texture has a pin-point pupil and a flat pale iris, which is what reads as dead. Here: a pupil that opens in the
      // dark, an iris that deepens toward its rim, whites that are not paper white and fall into shadow under the upper lid.
      const r = TSL.min(TSL.distance(UE, vec2(F.iris[0][0], F.iris[0][1])), TSL.distance(UE, vec2(F.iris[1][0], F.iris[1][1]))), iris = float(1).sub(TSL.smoothstep(F.irisR * 0.9, F.irisR * 1.04, r));
      const lum = albedo.dot(vec3(0.3, 0.6, 0.1)), deep = TSL.mix(vec3(lum), albedo, 1.5).mul(TSL.mix(float(1.0), 0.42, TSL.smoothstep(F.irisR * 0.55, F.irisR, r))).mul(0.85);
      let e = TSL.mix(albedo.mul(vec3(0.80, 0.77, 0.74)), deep, iris);
      e = e.mul(TSL.smoothstep(H.uPupil.sub(0.006), H.uPupil.add(0.008), r).mul(0.97).add(0.03));
      e = e.mul(TSL.mix(float(0.42), 1.0, TSL.smoothstep(0.62, 0.05, N.dot(up))));
      albedo = TSL.mix(albedo, e, eyeW);
    }
    let accW = float(0);
    if (F) { const cav = TSL.step(1.5, U.x).mul(TSL.step(U.x, 2.5)); albedo = TSL.mix(albedo, vec3(0.030, 0.008, 0.007), cav);       // the card behind the lips
      // worn pieces (accGeometry): u = 3 + slot picks one of the villager's accessory colours; cloth and leather are matt, metal a little less
      accW = TSL.step(2.5, U.x); const slot = U.x.sub(3), A = H.accCol, ac = TSL.mix(TSL.mix(vec3(A[0][0], A[0][1], A[0][2]), vec3(A[1][0], A[1][1], A[1][2]), TSL.step(0.5, slot)), TSL.mix(vec3(A[2][0], A[2][1], A[2][2]), vec3(A[3][0], A[3][1], A[3][2]), TSL.step(2.5, slot)), TSL.step(1.5, slot));
      const grain = texture(G.noiseTex, positionWorld.xy.mul(9).add(positionWorld.z.mul(7))).r.mul(0.3).add(0.85);
      albedo = TSL.mix(albedo, ac.mul(grain), accW); skinW = skinW.mul(cav.oneMinus()).mul(accW.oneMinus()); one = one.mul(accW.oneMinus());
      rough = TSL.mix(rough, TSL.mix(float(0.92), 0.55, TSL.step(1.5, slot).mul(TSL.step(slot, 2.5))), accW); }
    m.colorNode = Fn(() => { If(frontFacing.not().and(one.greaterThan(0.5)), () => { Discard(); }); if (anyAlpha) If(alpha.lessThan(cut), () => { Discard(); }); return vec4(albedo, 1); })();      // skin and eyes are one-sided, cloth and hair are not
    m.roughnessNode = rough;
    if (nrm) m.normalNode = nrm.add(normalView.mul(float(1).sub(nw))).normalize();
    let lit = SH.hemi(N, H.uLight, H.uZone).add(SH.pointLights(positionWorld, N, H.uZone, float(0.25)));
    if (anyWarm) lit = lit.mul(warm);       // skin keeps a little red in the shade, as light scattered under it does
    let emis = albedo.mul(lit);
    if (F) {
      // skin: where the sun grazes it the light carries on a little way round, reddened (blood under the skin), and the edge facing away from the eye takes a soft sheen
      const day = float(1).sub(TSL.step(0.5, H.uZone)).mul(H.uLight), ndl = N.dot(SH.U.sunDir);
      emis = emis.add(albedo.mul(vec3(1.0, 0.36, 0.22)).mul(SH.U.sunCol).mul(TSL.smoothstep(-0.35, 0.05, ndl).mul(TSL.smoothstep(0.45, 0.05, ndl)).mul(0.11)).mul(day).mul(skinW));
      const rim = TSL.pow(float(1).sub(TSL.max(N.dot(V_), 0)), float(3));
      emis = emis.add(SH.hemi(V_.negate().add(vec3(0, 0.6, 0)).normalize(), H.uLight, H.uZone).mul(rim).mul(skinW.mul(0.10).add(hairW.mul(0.32))).mul(albedo.add(0.04)));       // hair catches the sky along its outline instead of one hard blotch
    }
    if (anyEye) {      // a catch-light: the key light's glint on the wet eye (no specular on the stock eye texture), off indoors where the hemisphere is a lamp-lit room
      const V = SH.U.camPos.sub(positionWorld).normalize(), Hs = SH.U.sunDir.add(V).normalize(), Hs2 = V.add(V.add(vec3(0, 0.8, 0)).normalize()).normalize();      // the key light, and a soft light from above the viewer so a face looking at you always has one
      const day = float(1).sub(H.uZone).mul(H.uLight), glint = TSL.pow(TSL.max(N.dot(Hs), 0), float(130)).mul(0.6).mul(TSL.min(SH.U.sunCol.x.mul(1.4), 1)).add(TSL.pow(TSL.max(N.dot(Hs2), 0), float(24)).mul(0.8)).mul(day).mul(eyeW);
      emis = emis.add(vec3(1, 0.97, 0.9).mul(glint));
    }
    m.emissiveNode = emis;
    if (F && skinI >= 0) {
      // Face motion without face joints: skin vertices are moved by where they are in the skin atlas. The jaw (lower lip to chin) drops
      // with H.uMouth, the upper lip lifts a little, the upper eyelids come down with H.uBlink. Directions are turned by the head joint.
      const { positionLocal, smoothstep } = TSL, sv = clamp(float(1).sub(abs(mid.sub(skinI))), 0, 1).mul(TSL.step(U.x, 1.5));
      m.positionNode = Fn(() => {
        const u = U.x, dv = abs(U.y.sub(F.mouth[1])), p = positionLocal.toVar();
        If(sv.greaterThan(0.5).and(u.greaterThan(0.80)), () => {
          const jaw = smoothstep(F.mouth[0] - 0.0015, F.mouth[0] + 0.004, u).mul(smoothstep(0.995, 0.957, u)).mul(smoothstep(0.105, 0.040, dv));
          const lip = smoothstep(F.mouth[0] - 0.020, F.mouth[0] - 0.009, u).mul(smoothstep(F.mouth[0] - 0.0005, F.mouth[0] - 0.004, u)).mul(smoothstep(0.045, 0.018, dv));
          const de = TSL.min(abs(U.y.sub(F.lids[0])), abs(U.y.sub(F.lids[1]))), lid = smoothstep(0.821, 0.830, u).mul(smoothstep(0.8405, 0.8365, u)).mul(smoothstep(0.034, 0.022, de));
          const off = vec3(0, -0.0135, -0.0035).mul(jaw.mul(H.uMouth)).add(vec3(0, 0.0022, 0).mul(lip.mul(H.uMouth))).add(vec3(0, -0.0105, 0.0022).mul(lid.mul(H.uBlink)));
          p.addAssign(H.uHead.mul(off));
        });
        return p;
      })();
    }
    return m;
  }

  // ── level of detail ──
  // A body file may carry lighter copies of every mesh (tools/chars_lod.mjs: "<mesh>@mid" about 4600 triangles, "@lod" 2200, "@far" 700; same
  // skeleton and materials). The full body (about 10 000) is drawn inside LOD.dist[tier].hi metres, the mid copy to .mid, the low copy to .lo,
  // the far copy beyond. The lightest copy the file has is also what casts the sun shadow, always: while the camera draws another copy it sits
  // on a layer only the near shadow map sees (LOD.shadowLayer), so no body is ever drawn twice at full weight.
  // Far villagers (beyond LOD.slowDist) advance their animation every LOD.slowEvery frames only.
  const LOD = C.LOD = { dist: { low: { hi: 3.5, mid: 7, lo: 16 }, medium: { hi: 4.5, mid: 11, lo: 26 }, high: { hi: 7, mid: 18, lo: 40 } }, hyst: 0.8, shadowLayer: SHADOW_ONLY_LAYER, slowDist: 45, slowEvery: 3, force: TEST && TEST.charlod !== undefined ? TEST.charlod : -1 };    // force: 0 full mesh only, 1 low only, -1 by distance
  function lodMesh(S, H, root, skeleton, B, body, parts, matName, names, mat) {
    if (!B.lodParts) return; const e = { hi: H.meshes[H.meshes.length - 1] }; let any = false;
    for (const lv of ['mid', 'lod', 'far']) {
      if (!B.lodParts[lv]) continue; const g = mergedGeometry(S, body, parts, matName, names, lv, H.acc); if (!g) continue;
      const mesh = new THREE.SkinnedMesh(g, mat); mesh.name = 'villager.' + lv; mesh.receiveShadow = true; mesh.castShadow = false; root.add(mesh); mesh.bind(skeleton, B.bindMatrix);
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); mesh.frustumCulled = true; mesh.visible = false; e[lv] = mesh; any = true;
    }
    if (any) (H.lods = H.lods || []).push(e);
  }
  function lodUpdate(H, d, cast) {
    if (!H.lods) { for (const m of H.meshes) m.castShadow = cast; return; }
    const D = LOD.dist[R.qName] || LOD.dist.medium, h = LOD.hyst, was = H.lodLevel === undefined ? 0 : H.lodLevel, up = k => d > D[k] + (was > ['hi', 'mid', 'lo'].indexOf(k) ? -h : h);
    const level = LOD.force === 1 ? 2 : LOD.force === 0 ? 0 : up('lo') ? 3 : up('mid') ? 2 : up('hi') ? 1 : 0;
    if (level !== H.lodLevel || H.lodCast !== cast) {
      H.lodLevel = level; H.lodCast = cast; H.far = level > 0;
      for (const l of H.lods) {
        if (l.mask === undefined) l.mask = l.hi.layers.mask;           // the layers the game gave this villager
        const cam = [l.hi, l.mid || l.hi, l.lod || l.mid || l.hi, l.far || l.lod || l.mid || l.hi][level], sh = l.far || l.lod || l.mid || l.hi;
        for (const m of [l.hi, l.mid, l.lod, l.far]) if (m) { m.visible = false; m.castShadow = false; }
        cam.visible = true; cam.layers.mask = l.mask;
        if (cast) { if (sh === cam) cam.castShadow = true; else { sh.visible = true; sh.castShadow = true; sh.layers.mask = 1 << LOD.shadowLayer; } }
      }
    }
  }

  // ── spawning ──
  const cloneBones = o => { const c = o.clone(false); for (const ch of o.children) if (ch.isBone) c.add(cloneBones(ch)); return c; };
  C.spawn = function (def) {
    const S = C.set; if (!S) throw new Error('Chars.load first');
    const cfg = S.cfg, look = cfg.look ? cfg.look(def) : {}, body = S.bodies[look.body] ? look.body : Object.keys(S.bodies)[0], B = S.bodies[body];
    const root = cloneBones(B.armature), byName = {}; root.traverse(o => { byName[o.name] = o; });
    const skeleton = new THREE.Skeleton(B.skel.bones.map(b => byName[b.name]), B.skel.boneInverses);
    const H = { def, set: S, body, root, pivot: new THREE.Group(), skeleton, uZone: uniform(0), uLight: uniform(1), uMouth: uniform(0), uBlink: uniform(0), uPupil: uniform(0.05), uGaze: uniform(new THREE.Vector2()), uHead: uniform(new THREE.Matrix3()), bones: {}, actions: {}, cur: null, curName: '', seed: 0, mats: [], meshes: [] };
    for (let i = 0, id = String(def.id || C.list.length); i < id.length; i++) H.seed = (H.seed * 31 + id.charCodeAt(i)) >>> 0;
    const parts = (look.parts || Object.keys(B.parts)).filter(p => B.parts[p]).sort(), names = new Set();
    for (const p of parts) for (const m of B.parts[p]) names.add(m.material.name);
    H.fit = look.fit || 1;
    const nameList = [...names].sort(), srcOf = {};      // the body's own glTF material per name (the 'real' set keeps its textures and kinds there)
    for (const p of parts) for (const m of B.parts[p]) if (!srcOf[m.material.name]) srcOf[m.material.name] = m.material;
    if (C.merge && nameList.length > 1) {
      H.acc = look.acc || null; H.accCol = (look.acc && look.acc.col) || [[0.3, 0.26, 0.2], [0.14, 0.09, 0.055], [0.30, 0.29, 0.27], [0.19, 0.12, 0.07]]; const g = mergedGeometry(S, body, parts, null, nameList, null, H.acc);
      if (g) {
        const mat = makeMergedMaterial(S, H, nameList, look, srcOf), mesh = new THREE.SkinnedMesh(g, mat);
        mesh.name = 'villager'; mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); mesh.bind(skeleton, B.bindMatrix);
        mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); mesh.frustumCulled = true;
        H.mats.push(mat); H.meshes.push(mesh);
        lodMesh(S, H, root, skeleton, B, body, parts, null, nameList, mat);
      }
    } else for (const mn of nameList) {
      const g = mergedGeometry(S, body, parts, mn); if (!g) continue;
      const mat = makeMaterial(S, H, mn, look, srcOf[mn]), mesh = new THREE.SkinnedMesh(g, mat);
      mesh.name = mn; mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); mesh.bind(skeleton, B.bindMatrix);
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); mesh.frustumCulled = true;      // a fixed sphere: each pass (camera, shadow maps) culls villagers itself
      H.mats.push(mat); H.meshes.push(mesh);
      lodMesh(S, H, root, skeleton, B, body, parts, mn, null, mat);
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
  // ground speed a walking or running clip was animated for, in model units per second. Lets the clip be played at the rate that
  // matches how fast the villager really moves.
  function gait(H, key) {
    const name = clipNameFor(H, key), id = H.body + '/gait/' + name; let v = H.set.measure[id]; if (v !== undefined) return v;
    const clip = clipFor(H.set, H.body, name); v = 0;
    if (clip && clip.duration > 0.05) {
      const tmp = cloneBones(H.set.bodies[H.body].armature), mx = new THREE.AnimationMixer(tmp), foot = tmp.getObjectByName(H.set.cfg.bones.footL), P = new THREE.Vector3();
      mx.clipAction(clip).play();
      // While a foot is planted it travels backward under the body at exactly the speed the body is meant to move forward. So: sample the
      // cycle, take the frames where the foot is in the lowest quarter of its height, and use the median speed over the ground there.
      // (The old estimate, twice the foot's front-to-back range per cycle, came out a third too slow for these clips: planted feet slid.)
      if (foot) { const n = 60, pts = []; for (let i = 0; i <= n; i++) { mx.setTime(clip.duration * i / n); tmp.updateMatrixWorld(true); foot.getWorldPosition(P); pts.push([P.x, P.y, P.z]); }
        let lo = 1e9, hi = -1e9; for (const q of pts) { lo = Math.min(lo, q[1]); hi = Math.max(hi, q[1]); }
        const sp = []; for (let i = 0; i < n; i++) if (Math.max(pts[i][1], pts[i + 1][1]) <= lo + (hi - lo) * 0.25) sp.push(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][2] - pts[i][2]) / (clip.duration / n));
        sp.sort((a, b) => a - b); v = sp.length ? sp[sp.length >> 1] : 0; }
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

  // ── faces: mouth from the spoken line's loudness, blinking, eyes that move ──
  const _m4 = new THREE.Matrix4(), _mi = new THREE.Matrix4();
  function faceUpdate(H, st, dt, dcam) {
    const F = H.face || (H.face = { open: 0, blinkT: 1 + (H.seed % 7) * 0.6, blink: 0, gx: 0, gy: 0, tx: 0, ty: 0, sacT: 0.5, hi: H.skeleton.bones.indexOf(H.bones.head) });
    // the head joint's skinning matrix, in the body's own space: turns "down the face" into where down is for this pose (one frame old, which is plenty)
    const hb = H.bones.head; if (hb && F.hi >= 0) { _mi.copy(H.root.matrixWorld).invert(); _m4.multiplyMatrices(_mi, hb.matrixWorld).multiply(H.skeleton.boneInverses[F.hi]); H.uHead.value.setFromMatrix4(_m4); }
    // mouth: the line being spoken has a loudness value every 50 ms (audio/voice/manifest.json); with no sound (a bark, or sound off) a talking villager mumbles
    let tgt = 0; const vx = typeof Snd !== 'undefined' && Snd.vox, cur = vx && vx.cur, id = H.def && H.def.id;
    if (H.mouthTest !== undefined) tgt = H.mouthTest;
    else if (cur && cur.speaker === id && cur.env && cur.env.length) { const t = Snd.now() - cur.t0, i = t / 0.05, e = cur.env, a = e[Math.max(0, Math.min(e.length - 1, Math.floor(i)))] || 0, b = e[Math.max(0, Math.min(e.length - 1, Math.floor(i) + 1))] || 0, v = (a + (b - a) * (i - Math.floor(i))) / 99;
      tgt = t < 0 || t > cur.dur ? 0 : Math.min(1, Math.pow(Math.max(0, v - 0.04) * 2.6, 0.75)); }
    else if (st.talking || (vx && vx.barkH && vx.barkH === cur && cur.speaker === id)) { const t = (typeof game !== 'undefined' ? game.time : 0) + H.seed; tgt = Math.max(0, 0.42 + 0.4 * Math.sin(t * 11.3) * Math.sin(t * 3.9 + 1) + 0.18 * Math.sin(t * 23)); }
    F.open += (tgt - F.open) * Math.min(1, dt * (tgt > F.open ? 26 : 16)); H.uMouth.value = F.open;
    // blink: every few seconds, 0.13 s shut; asleep the eyes stay shut
    F.blinkT -= dt; if (F.blinkT < 0) F.blinkT = 2.2 + ((H.seed * 7.13 + (typeof game !== 'undefined' ? game.time : 0) * 3.1) % 4.2);
    const lying = st.anim === 'lie'; H.uBlink.value = H.blinkTest !== undefined ? H.blinkTest : lying ? 1 : F.blinkT < 0.13 ? Math.sin(F.blinkT / 0.13 * Math.PI) : 0;
    // eyes: small jumps every second or so; talking to the player they come back to the middle (the head is already turned to the player)
    F.sacT -= dt; if (F.sacT < 0) { F.sacT = 0.6 + ((H.seed * 3.7 + F.gx * 91) % 1.9 + 1.9) % 1.9; const k = st.talking ? 0.25 : 1; F.tx = (((H.seed * 12.9 + F.sacT * 78.2) % 2 + 2) % 2 - 1) * 0.011 * k; F.ty = (((H.seed * 5.3 + F.sacT * 37.7) % 2 + 2) % 2 - 1) * 0.005 * k; }
    F.gx += (F.tx - F.gx) * Math.min(1, dt * 30); F.gy += (F.ty - F.gy) * Math.min(1, dt * 30);
    if (H.gazeTest) H.uGaze.value.set(H.gazeTest[0], H.gazeTest[1]); else H.uGaze.value.set(F.gy, F.gx);          // in the eye texture, u runs up and down the eye and v across it
    H.uPupil.value = 0.040 + 0.022 * (typeof ENV !== 'undefined' ? (st.zone ? 0.8 : ENV.night) : 0);
  }
  // ── per frame ──
  C.update = function (H, st, dt) {
    const cfg = H.set.cfg, pv = H.pivot;
    pv.visible = st.visible !== false; if (!pv.visible) return;
    const base = st.anim || 'idle', seated = base === 'sit', lying = base === 'lie';
    const key = st.talking ? (lying ? 'lie' : seated ? (cfg.anims['sit+talk'] ? 'sit+talk' : 'sit') : 'talk') : base;
    play(H, key);
    const s = st.scale || 1, k = (cfg.scale || 1) * s * H.fit;
    // Feet: the clip is played at the rate at which its planted foot moves backward exactly as fast as the villager moves forward. The speed
    // is measured from how far the villager really moved (callers only pass a nominal figure, and people slow down in turns and at doors).
    { const lp = H.lastP, mv = lp && dt > 1e-4 ? Math.hypot(st.pos[0] - lp[0], st.pos[2] - lp[2]) / dt : -1; H.lastP = [st.pos[0], st.pos[1], st.pos[2]];
      if (mv >= 0 && mv < 12) H.realSpeed = H.realSpeed === undefined ? mv : H.realSpeed + (mv - H.realSpeed) * Math.min(1, dt * 8); }
    if (H.cur && (key === 'walk' || key === 'run')) { const g = gait(H, key) * k, rate = (cfg.rate && cfg.rate[key]) || 1, sp = TEST && TEST.feetnominal ? st.speed : (H.realSpeed !== undefined && dt > 0 ? H.realSpeed : st.speed);
      H.cur.setEffectiveTimeScale(sp > 0.05 && g > 0.2 ? Math.min(Math.max(sp / g * ((TEST && TEST.feetk) || 1), 0.25), cfg.maxRate || 1.8) : sp !== undefined && sp <= 0.05 && dt > 0 ? 0.25 : rate); }
    const dcam = hyp(st.pos[0] - R.cam.pos[0], st.pos[1] - R.cam.pos[1], st.pos[2] - R.cam.pos[2]);
    if (dcam > LOD.slowDist && H.seed % LOD.slowEvery !== R.frame % LOD.slowEvery) H.slowDt = (H.slowDt || 0) + dt;      // far away: the pose changes on one frame in a few
    else { H.mixer.update(dt + (H.slowDt || 0)); H.slowDt = 0; }
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
    lodUpdate(H, dcam, st.cast === undefined ? !!H.cast : st.cast); H.cast = st.cast === undefined ? H.cast : st.cast;
    H.uZone.value = st.zone || 0; H.uLight.value = st.light === undefined ? 1 : st.light;
    if (cfg.face && dcam < 14) faceUpdate(H, st, dt, dcam);
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
