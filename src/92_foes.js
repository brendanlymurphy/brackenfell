// ───────────────────────── outlaws: two camps outside the village, and the people in them ─────────────────────────
// Bodies and motion come from the villager system (Chars); this file adds a look for outlaws, the fighting clips, the camps
// themselves (built with the same mesh builder and scanned textures as the village) and a small state machine per outlaw:
// idle at camp -> notice -> chase -> circle -> attack (with a wind-up you can read) -> stagger / flee / return -> dead.
const Foes = (() => {
  const CAMPS = [
    { id: 'pines', label: 'the camp in the pines', x: -96, z: -44, yaw: 0.6, n: 3, leader: { name: 'Outlaw Brute', hp: 84, dmg: 14, scale: 1.09 } },
    { id: 'crag', label: 'the camp below the watchtower', x: -6, z: -100, yaw: 2.5, n: 3, leader: { name: 'Garrick One-Ear', hp: 112, dmg: 17, scale: 1.07, chief: true } },
  ];
  const R4 = ['Ranger_Body', 'Ranger_Arms', 'Ranger_Legs', 'Ranger_Feet'];
  const LOOKS = [
    { body: 'male', parts: [...R4, 'Ranger_Head_Hood'], tint: { MI_Ranger: [0.52, 0.47, 0.42] }, skin: 'tan', hair: 'black' },
    { body: 'male', parts: [...R4, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Hair_Buzzed', 'Hair_Beard'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.5, 0.42, 0.38] }, skin: 'fair', hair: 'brown' },
    { body: 'female', parts: [...R4, 'Ranger_Head_Hood', 'Ranger_Arms_Bracer'], tint: { MI_Ranger: [0.58, 0.48, 0.46] }, skin: 'rosy', hair: 'auburn' },
    { body: 'male', parts: ['Peasant_Body', 'Peasant_Arms', 'Ranger_Legs', 'Ranger_Feet', 'Hair_Long', 'Hair_Beard'], maps: { MI_Peasant: 'peasant2' }, tint: { MI_Peasant: [0.5, 0.44, 0.4], MI_Ranger: [0.5, 0.45, 0.4] }, skin: 'brown', hair: 'black' },
  ];
  const LEADER = { body: 'male', parts: [...R4, 'Ranger_Arms_Bracer', 'Ranger_Body_Belt_1', 'Ranger_Body_Belt_2', 'Ranger_Pauldrons', 'Hair_Buzzed', 'Hair_Beard'], maps: { MI_Ranger: 'ranger3' }, tint: { MI_Ranger: [0.78, 0.36, 0.3] }, skin: 'tan', hair: 'red' };
  const ANIMS = { 'c-idle': 'one-hand-weapon-idle', 'c-walk': 'walk', 'c-run': 'jog', 'c-sprint': 'sprint', 'c-left': 'strafe-left', 'c-right': 'strafe-right', 'c-back': 'walk-backwards',
    'c-atk1': 'sword-regular-a', 'c-atk2': 'sword-regular-b', 'c-atk3': 'sword-attack', 'c-block': 'sword-block', 'c-hit': 'hit-chest', 'c-hit2': 'hit-head', 'c-die': 'death-a', 'c-die2': 'death-b', 'c-sit': 'sit-ground-idle', 'c-stand': 'idle-foldarms' };
  const F = { list: [], camps: CAMPS, target: null, ready: false, failed: false, attackers: 0, hitFrac: {}, res: { n: 0, blocked: false, p: [0, 0, 0] }, st: { pos: null, yaw: 0, anim: '', scale: 1, zone: 0, light: 1, visible: true, look: [0, 0] } };
  const VILLAGE_R = 64, LEASH = 44, inVillage = (x, z) => hyp(x - SQUARE.x, z - SQUARE.z) < VILLAGE_R;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ── camps ──
  function buildCamps() {
    const pack = new MeshPack(); pack.shadow = true;
    for (const c of CAMPS) {
      const m = new Mesh(4096), ca = Math.cos(c.yaw), sa = Math.sin(c.yaw);
      const W = (lx, lz) => { const x = c.x + lx * ca - lz * sa, z = c.z + lx * sa + lz * ca; return [x, Terrain.y(x, z), z]; };
      const put = (lx, lz, rot, fn) => { const p = W(lx, lz); m.push().T(p[0], p[1], p[2]).RY(-(c.yaw + (rot || 0))); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; fn(m); m.pop(); return p; };
      // fire: a ring of stones, charred logs leaning together
      const fp = put(0, 0, 0, mm => {
        mm.mat(MAT.ROCK, [0.8, 0.8, 0.82], 0.5); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 0.62 + (i % 3) * 0.04; mm.ball(Math.cos(a) * r, 0.07, Math.sin(a) * r, 0.14 + (i % 2) * 0.04, 0.11, 0.13, 6, 4); }
        mm.mat(MAT.BARK, [0.35, 0.3, 0.28], 0.5); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; mm.beam([Math.cos(a) * 0.42, 0.02, Math.sin(a) * 0.42], [Math.cos(a + 2.6) * 0.06, 0.52, Math.sin(a + 2.6) * 0.06], 0.09, 0.09); }
      });
      World.emitters.push({ type: 'fire', p: [fp[0], fp[1] + 0.2, fp[2]], size: 0.6, zone: 0, seed: (World.emitters.length * 0.618) % 1, t: 0 });
      addLight([fp[0], fp[1] + 1.0, fp[2]], 12, [3.6, 1.8, 0.62], 0, 'fire');
      World.emitters.push({ type: 'smoke', p: [fp[0], fp[1] + 1.0, fp[2]], zone: 0, seed: 0.37, t: 0 });
      // two tents: a ridge pole on crossed sticks, drab cloth to the ground, a bedroll inside
      const tent = (lx, lz, rot, col) => put(lx, lz, rot, mm => {
        const L = 1.35, H = 1.45, Wd = 1.15;
        mm.mat(MAT.TIMBER, COL.timberDark); mm.beam([0, H, -L], [0, H, L], 0.07, 0.07);
        for (const s of [-1, 1]) for (const e of [-1, 1]) mm.beam([e * Wd * 0.9, -0.1, s * L], [-e * 0.12, H + 0.16, s * L], 0.055, 0.055);
        mm.mat(MAT.CLOTH, col, 0.5);
        for (const e of [-1, 1]) mm.quad2([0, H, -L], [e * Wd, 0.02, -L - 0.08], [e * Wd, 0.02, L + 0.08], [0, H, L]);
        mm.poly([[0, H, L], [-Wd, 0.02, L + 0.08], [Wd, 0.02, L + 0.08]]); mm.poly([[0, H, L], [Wd, 0.02, L + 0.08], [-Wd, 0.02, L + 0.08]]);
        mm.mat(MAT.CLOTH, COL.fur, 0.6); mm.box(-0.32, 0.02, -0.9, 0.32, 0.1, 0.9); mm.mat(MAT.CLOTH, COL.wool, 0.6); mm.box(-0.3, 0.1, 0.55, 0.3, 0.19, 0.88);
        addBoxCollider(mm, -Wd * 0.8, -L, Wd * 0.8, L, 0, 1.3);
      });
      tent(-4.1, 1.2, PI / 2 + 0.25, [0.42, 0.38, 0.3]); tent(3.6, 2.6, -PI / 2 - 0.4, [0.36, 0.34, 0.3]);
      // logs to sit on
      for (const [lx, lz, rot] of [[0, -1.9, 0.1], [-1.9, 0.4, 1.4], [1.7, 0.9, -1.1]]) put(lx, lz, rot, mm => { mm.mat(MAT.BARK, [0.8, 0.75, 0.7], 0.6); mm.push().T(-0.85, 0.2, 0).RZ(-PI / 2); mm.cyl(0, 0, 0, 0.2, 0.19, 1.7, 9, 3); mm.pop(); });
      // stores: crates, barrels, sacks, and a strongbox
      put(-1.6, 4.4, 0.3, mm => Props.crate(mm, 0.7)); put(-0.8, 4.7, -0.2, mm => Props.crate(mm, 0.55)); put(-1.5, 4.5, 0.3, mm => { mm.T(0, 0.7, 0); Props.crate(mm, 0.45, true); });
      put(0.4, 4.6, 0, mm => Props.barrel(mm)); put(1.2, 4.2, 0, mm => Props.barrel(mm)); put(0.9, 5.0, 0.5, mm => Props.sack(mm, 0.32)); put(1.7, 4.9, 1.2, mm => Props.sack(mm, 0.26, [0.6, 0.52, 0.4]));
      put(-2.4, -3.0, 0.9, mm => Props.woodpile(mm, 4, 3, 0.8));
      const cp = put(-3.3, 2.7, PI / 2 + 0.25, mm => Props.chest(mm));
      World.interact.push({ p: [cp[0], cp[1] + 0.5, cp[2]], r: 1.9, zone: 0, kind: 'chest', id: 'camp.' + c.id, loot: c.id === 'pines' ? [['gold', 28], ['potion', 1], ['bread', 2]] : [['gold', 46], ['potion', 2], ['leather', 1]] });
      // a pole with a rag on it, so the camp can be seen from the road
      put(5.4, -2.2, 0, mm => { mm.mat(MAT.TIMBER, COL.timberDark); mm.cbox(0, -0.3, 0, 0.09, 4.3, 0.09, 4); mm.mat(MAT.CLOTH, [0.5, 0.12, 0.1], 0.5); mm.quad2([0.05, 3.9, 0], [0.05, 2.9, 0.02], [0.75, 3.0, 0.06], [0.85, 3.8, 0.02]); addCircleCollider(mm, 0, 0, 0.12, 0, 4); });
      if (c.id === 'crag') put(6.0, 3.6, 2.1, mm => Props.cart(mm, false));
      pack.add(m, { kind: 'opaque' });
      World.places.push({ id: 'camp.' + c.id, name: c.id === 'pines' ? 'Outlaw Camp' : 'Garrick’s Camp', x: c.x, z: c.z, r: 13 });
      // where the outlaws wait
      c.spots = [[1.6, -1.2, 'sit'], [-1.5, -0.9, 'sit'], [0.9, 2.0, 'sit'], [-0.4, 3.2, 'stand']].map(([lx, lz, kind]) => { const p = W(lx, lz); return { p, kind, yaw: headingTo(p[0], p[2], fp[0], fp[2]) }; });
      const wv = SQUARE.x - c.x, wz = SQUARE.z - c.z, wl = hyp(wv, wz); c.watch = { p: [c.x + wv / wl * 7.5, 0, c.z + wz / wl * 7.5], kind: 'guard', yaw: Math.atan2(wv, -wz) }; c.watch.p[1] = Terrain.y(c.watch.p[0], c.watch.p[2]);
    }
    pack.upload('camps');
    for (const it of pack.items) {
      const g = new THREE.BufferGeometry(); for (const k in pack.attr) if (k !== 'wind') g.setAttribute(k, pack.attr[k]);
      g.setIndex(pack.index); g.setDrawRange(it.first, it.count); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(it.c[0], it.c[1], it.c[2]), it.r);
      const mesh = new THREE.Mesh(g, SC.mats.static); mesh.matrixAutoUpdate = false; mesh.castShadow = mesh.receiveShadow = true; SC.scene.add(mesh);
    }
    colBuild();
  }

  // ── people ──
  function prepareChars() {
    const cfg = Chars.cfg; Object.assign(cfg.anims, ANIMS);
    for (const n of ['sword-block']) if (cfg.once && cfg.once.includes(n)) cfg.once.splice(cfg.once.indexOf(n), 1);
    if (cfg.foeLooks) cfg.lookFoe = true;       // sets that bring their own outlaws (cfg.foeLooks) already answer def.foe in look()
    if (!cfg.lookFoe) { const orig = cfg.look; cfg.lookFoe = true; cfg.look = def => { if (!def.foe) return orig(def); const b = orig({ id: '\u0000', skin: def.foe.skin, hair: def.foe.hair }); return { body: def.foe.body, parts: ['HeadSkin', 'Eyes', 'Brows'].concat(def.foe.parts), maps: def.foe.maps || {}, tint: Object.assign({ skin: b.tint.skin, hair: b.tint.hair }, def.foe.tint) }; }; }
    // when in each attack clip the sword hand is furthest forward: that is the moment the blow lands
    try {
      const body = Chars.set.bodies.male || Chars.set.bodies[(cfg.foeLooks ? cfg.foeLooks.list[0] : { body: Object.keys(Chars.set.bodies)[0] }).body], rig = T3X.SkeletonUtils.clone(body.armature), mx = new THREE.AnimationMixer(rig), hand = rig.getObjectByName(cfg.bones.handR), hips = rig.getObjectByName(cfg.bones.hips), a = new THREE.Vector3(), b = new THREE.Vector3();
      for (const key of ['c-atk1', 'c-atk2', 'c-atk3']) {
        const clip = Chars.set.clips[ANIMS[key]]; if (!clip || !hand || !hips) continue;
        const act = mx.clipAction(clip); act.play(); let best = -1e9, bt = 0.45;
        for (let i = 3; i <= 17; i++) { const t = i / 20; mx.setTime(t * clip.duration); rig.updateMatrixWorld(true); hand.getWorldPosition(a); hips.getWorldPosition(b); const reach = (a.z - b.z) * (cfg.faces === -1 ? -1 : 1) + (a.y - b.y) * 0.15; if (reach > best) { best = reach; bt = t; } }
        act.stop(); F.hitFrac[key] = { frac: clamp(bt - 0.04, 0.2, 0.75), dur: clip.duration };
      }
      mx.stopAllAction(); mx.uncacheRoot(rig);
    } catch (e) { console.warn('foes: could not time the attack clips', e); }
  }
  function spawnAll() {
    prepareChars();
    const r = RPG.st();
    for (const c of CAMPS) {
      for (let i = 0; i <= c.n; i++) {
        const lead = i === c.n ? c.leader : null, id = c.id + '.' + i, look = Chars.cfg.foeLooks ? (lead ? Chars.cfg.foeLooks.leader : Chars.cfg.foeLooks.list[(i + (c.id === 'crag' ? 2 : 0)) % Chars.cfg.foeLooks.list.length]) : lead ? LEADER : LOOKS[(i + (c.id === 'crag' ? 2 : 0)) % LOOKS.length];
        const sp = i === 0 ? c.watch : c.spots[(i - 1) % c.spots.length];
        const f = { id, camp: c, name: lead ? lead.name : 'Outlaw', leader: !!lead, chief: !!(lead && lead.chief), maxHp: lead ? lead.hp : 38, dmg: lead ? lead.dmg : 8, scale: lead ? lead.scale : 0.97 + (i % 3) * 0.03,
          spot: sp, pos: sp.p.slice(), yaw: sp.yaw, hp: 0, state: 'idle', t: 0, cd: rnd(0.4, 1.4), strafe: i % 2 ? 1 : -1, strafeT: 0, anim: 'c-idle', alive: true, token: false, kv: [0, 0], acc: 0, looted: false, fleeDone: false, hits: 0, atk: null, vis: true, alert: 0 };
        f.hp = f.maxHp; f.stagger = d => stagger(f, d, true);
        f.h = Chars.spawn({ id: 'foe.' + id, foe: look });
        const sw = new THREE.Mesh(RPG.swordGeo(lead ? 0.72 : 0.58, lead ? 1.0 : 0.75), RPG.litMat(f.h.uZone, f.h.uLight, 0.45)); sw.castShadow = true; sw.frustumCulled = false; sw.layers.set(1);
        const grip = Chars.cfg.grip || F.grip; sw.rotation.set(grip[0], grip[1], grip[2]); sw.position.set(grip[3], grip[4], grip[5]); sw.scale.setScalar(1 / ((Chars.cfg.scale || 1) * f.scale)); Chars.attach(f.h, 'handR', sw); f.sword = sw;
        if (r.dead[id] !== undefined) { if (!f.chief && r.day - r.dead[id] >= 3) delete r.dead[id]; else { f.alive = false; f.state = 'gone'; f.hp = 0; f.h.pivot.visible = false; } }
        F.list.push(f);
      }
    }
    if (!Chars.group.parent) SC.scene.add(Chars.group);
    F.ready = true; campState();
  }
  F.grip = [PI / 2, 0, 0, 0, 0.02, 0.03];       // how a sword sits in the rig's right hand: rotation xyz, offset xyz (hand space)
  F.init = function () {
    buildCamps();
    F.loading = (Chars.ready ? Promise.resolve() : Chars.load(G.charSet || 'quaternius')).then(() => Chars.cfg.lazy && Chars.cfg.foeLooks ? Chars.ensure(Chars.cfg.foeLooks.list.map(l => l.body).concat(Chars.cfg.foeLooks.leader.body)) : 0).then(spawnAll).catch(e => { F.failed = true; console.warn('outlaws could not be loaded: ' + (e && e.message || e)); });
  };
  // everyone goes home and forgets (after the player dies, or sleeps)
  F.calm = function (heal) { for (const f of F.list) { if (!f.alive) continue; release(f); f.state = 'idle'; f.t = 0; f.pos = f.spot.p.slice(); f.yaw = f.spot.yaw; f.alert = 0; if (heal) f.hp = f.maxHp; } };
  function campState() {
    const r = RPG.st(); r.cleared = r.cleared || {};
    for (const c of CAMPS) { const left = F.list.filter(f => f.camp === c && f.alive).length; c.left = left; if (!left && F.ready) { if (r.cleared[c.id] === undefined) { r.cleared[c.id] = r.day; if (typeof onCampCleared === 'function') onCampCleared(c.id); } } else delete r.cleared[c.id]; }
  }
  F.alive = id => F.list.filter(f => f.alive && (!id || f.camp.id === id));
  F.nearest = function (pos, id) { let best = null, bd = 1e9; for (const f of F.list) { if (!f.alive || (id && f.camp.id !== id)) continue; const d = hyp(f.pos[0] - pos[0], f.pos[2] - pos[2]); if (d < bd) { bd = d; best = f; } } return best; };

  // ── being hit ──
  const release = f => { if (f.token) { f.token = false; F.attackers = Math.max(0, F.attackers - 1); } };
  function stagger(f, dur, hard) { if (!f.alive) return; release(f); f.state = 'stagger'; f.t = 0; f.stagT = dur; f.anim = hard || Math.random() < 0.5 ? 'c-hit2' : 'c-hit'; f.h.curName = ''; }
  function rouse(f, delay) { if (f.alive && (f.state === 'idle' || f.state === 'return')) { f.state = 'notice'; f.t = -(delay || 0); } f.alert = 12; }
  function alarm(camp, from) { let first = true; for (const f of F.list) if (f.camp === camp && f.alive && (f.state === 'idle' || f.state === 'return') && hyp(f.pos[0] - from[0], f.pos[2] - from[2]) < 34) { rouse(f, first ? 0 : rnd(0.15, 0.8)); first = false; } }
  function die(f) {
    const r = RPG.st(); release(f); f.alive = false; f.hp = 0; f.state = 'dead'; f.t = 0; f.anim = Math.random() < 0.5 ? 'c-die' : 'c-die2'; f.h.curName = '';
    r.kills++; r.dead[f.id] = r.day; Audio2.shout(f.leader);
    const loot = [['gold', Math.round(f.leader ? rnd(22, 34) : rnd(4, 12))]];
    if (Math.random() < 0.45) loot.push([Math.random() < 0.5 ? 'bread' : 'apple', 1]); if (Math.random() < (f.leader ? 1 : 0.18)) loot.push(['potion', 1]);
    if (f.chief) { loot.push(['steelsword', 1]); if (!has('tools') && qAt('tools') !== 99) loot.push(['tools', 1]); } else if (f.leader) loot.push(['ironsword', 1]); else if (Math.random() < 0.1) loot.push(['buckler', 1]);
    f.lootIt = { kind: 'loot', id: 'loot.' + f.id, p: [f.pos[0], f.pos[1] + 0.35, f.pos[2]], r: 2.1, zone: 0, name: f.name, loot, foe: f }; World.interact.push(f.lootIt);
    campState(); if (typeof onFoeKilled === 'function') onFoeKilled(f); save();
  }
  function hurt(f, dmg, heavy, from) {
    const dx = f.pos[0] - from[0], dz = f.pos[2] - from[2], l = hyp(dx, dz) || 1;
    alarm(f.camp, f.pos); f.alert = 14;
    // a leader who sees it coming gets steel in the way
    if (f.leader && !heavy && (f.state === 'circle' || f.state === 'chase') && Math.random() < 0.38) { f.state = 'guard'; f.t = 0; f.anim = 'c-block'; f.hp -= dmg * 0.15; f.kv[0] = dx / l * 1.2; f.kv[1] = dz / l * 1.2; if (f.hp <= 0) die(f); return true; }
    f.hp -= dmg; f.hits++; f.kv[0] = dx / l * (heavy ? 4.6 : 2.2); f.kv[1] = dz / l * (heavy ? 4.6 : 2.2);
    if (f.hp <= 0) { die(f); return false; }
    if (!f.leader || heavy || f.hits % 3 === 0 || f.state !== 'attack') stagger(f, heavy ? 0.8 : 0.42, heavy);
    if (!f.leader && !f.fleeDone && f.hp < f.maxHp * 0.28 && F.alive(f.camp.id).length > 1) { f.fleeDone = true; f.fleeNext = true; }
    return false;
  }
  // the player's blade sweeps: pos and heading of the swing, reach, half-angle of the arc
  F.sweep = function (pos, yaw, reach, arc, dmg, heavy) {
    const res = F.res; res.n = 0; res.blocked = false;
    for (const f of F.list) {
      if (!f.alive || !f.vis) continue;
      const dx = f.pos[0] - pos[0], dz = f.pos[2] - pos[2], d = hyp(dx, dz);
      if (d > reach + 0.35 || Math.abs(f.pos[1] - pos[1]) > 1.7) continue;
      if (d > 0.9 && Math.abs(angDiff(Math.atan2(dx, -dz), yaw)) > arc) continue;
      const k = d > 0.01 ? Math.max(0, d - 0.3) / d : 0;
      if (!res.n) { res.p[0] = pos[0] + dx * k; res.p[1] = f.pos[1] + 1.15 * f.scale; res.p[2] = pos[2] + dz * k; }
      if (hurt(f, dmg, heavy, pos)) res.blocked = true;
      res.n++;
    }
    return res;
  };

  // ── per frame ──
  const turn = (f, to, rate, dt) => { f.yaw += clamp(angDiff(to, f.yaw), -rate * dt, rate * dt); };
  function step(f, vx, vz, dt) {
    const p = f.pos, ox = p[0], oz = p[2];
    p[0] += (vx + f.kv[0]) * dt; p[2] += (vz + f.kv[1]) * dt; f.kv[0] *= Math.max(0, 1 - dt * 7); f.kv[1] *= Math.max(0, 1 - dt * 7);
    colResolve(p, 0.3, p[1], p[1] + 1.7);
    if (World.waterAt(p[0], p[2]) - Terrain.y(p[0], p[2]) > 0.5 || hyp(p[0], p[2]) > WORLD_RADIUS + 6) { p[0] = ox; p[2] = oz; }
    for (const g of F.list) { if (g === f || !g.alive) continue; const dx = p[0] - g.pos[0], dz = p[2] - g.pos[2], d2 = dx * dx + dz * dz; if (d2 < 0.49 && d2 > 1e-6) { const d = Math.sqrt(d2), k = (0.7 - d) / d * 0.5; p[0] += dx * k; p[2] += dz * k; } }
    p[1] = Terrain.y(p[0], p[2]);
  }
  function think(f, dt, P, d, live) {
    const toP = Math.atan2(P[0] - f.pos[0], -(P[2] - f.pos[2])), home = f.spot.p, dHome = hyp(f.pos[0] - home[0], f.pos[2] - home[2]), camp = f.camp;
    const lost = !live || inVillage(P[0], P[2]) || hyp(f.pos[0] - camp.x, f.pos[2] - camp.z) > LEASH;
    f.t += dt; f.cd -= dt; f.alert -= dt;
    switch (f.state) {
      case 'idle': {
        f.anim = f.spot.kind === 'sit' ? 'c-sit' : f.spot.kind === 'guard' ? 'c-idle' : 'c-stand'; turn(f, f.spot.yaw, 3, dt);
        const facing = Math.abs(angDiff(toP, f.yaw)) < 1.2, see = (f.spot.kind === 'guard' ? 19 : 14) + (Player.speed > 4 ? 6 : 0) - (facing ? 0 : 5);
        if (live && d < see && !inVillage(P[0], P[2]) && Math.abs(P[1] - f.pos[1]) < 6) { alarm(camp, f.pos); Audio2.shout(f.leader); if (!F.warned) { F.warned = true; toast('Outlaws! They have seen you.'); } }
        break; }
      case 'notice': f.anim = 'c-idle'; if (f.t > 0) turn(f, toP, 6, dt); if (f.t > 0.45) { f.state = 'chase'; f.t = 0; } break;
      case 'chase': {
        if (lost) { f.state = 'return'; f.t = 0; break; }
        turn(f, toP, 7, dt); const sp = f.leader ? 3.9 : 4.5; f.anim = 'c-run'; step(f, Math.sin(f.yaw) * sp, -Math.cos(f.yaw) * sp, dt);
        if (d < 3.0) { f.state = 'circle'; f.t = 0; f.strafeT = rnd(0.8, 2); }
        break; }
      case 'circle': {
        if (lost) { release(f); f.state = 'return'; f.t = 0; break; }
        if (f.fleeNext) { f.fleeNext = false; release(f); f.state = 'flee'; f.t = 0; break; }
        if (d > 5) { release(f); f.state = 'chase'; f.t = 0; break; }
        if (!f.token && f.cd <= 0 && F.attackers < 2 && d < 4.2) { f.token = true; F.attackers++; }
        turn(f, toP, 6, dt); f.strafeT -= dt; if (f.strafeT <= 0) { f.strafe = -f.strafe; f.strafeT = rnd(0.9, 2.4); }
        const want = f.token ? 1.85 : 3.3, rad = clamp((d - want) * 2.2, -1.5, 2.0), tan = (f.token ? 0.7 : 1.25) * f.strafe;
        const fx = Math.sin(f.yaw), fz = -Math.cos(f.yaw); step(f, fx * rad - fz * tan, fz * rad + fx * tan, dt);
        f.anim = Math.abs(rad) > 0.9 ? (rad > 0 ? 'c-walk' : 'c-back') : tan > 0 ? 'c-right' : 'c-left';
        if (f.token && d < 2.45 && f.cd <= 0) {
          const key = f.leader && Math.random() < 0.4 ? 'c-atk3' : Math.random() < 0.5 ? 'c-atk1' : 'c-atk2', hf = F.hitFrac[key] || { frac: 0.45, dur: 1.1 };
          const rate = Math.min(1.15, hf.frac * hf.dur / (f.leader ? 0.56 : 0.46));       // slow the clip if needed so the wind-up can be read
          f.state = 'attack'; f.t = 0; f.anim = key; f.h.curName = ''; f.atk = { hitT: hf.frac * hf.dur / rate, end: hf.dur * 0.9 / rate, rate, done: false, heavy: key === 'c-atk3' };
        }
        break; }
      case 'attack': {
        const a = f.atk; if (!a.done) { turn(f, toP, 2.6, dt); if (d > 1.5) step(f, Math.sin(f.yaw) * 1.5, -Math.cos(f.yaw) * 1.5, dt); else step(f, 0, 0, dt); } else step(f, 0, 0, dt);
        if (!a.done && f.t >= a.hitT) { a.done = true; if (live && d < 2.4 && Math.abs(angDiff(toP, f.yaw)) < 0.95 && Math.abs(P[1] - f.pos[1]) < 1.6) { RPG.damage(f.dmg * (a.heavy ? 1.35 : 1), f); } else Audio2.swing(false); }
        if (f.t >= a.end) { release(f); f.state = 'circle'; f.t = 0; f.cd = f.leader ? rnd(0.7, 1.5) : rnd(1.4, 2.8); }
        break; }
      case 'guard': f.anim = 'c-block'; turn(f, toP, 6, dt); step(f, 0, 0, dt); if (f.t > 0.5) { f.state = 'circle'; f.t = 0; f.cd = Math.min(f.cd, 0.25); } break;
      case 'stagger': step(f, 0, 0, dt); if (f.t > f.stagT) { f.state = 'circle'; f.t = 0; f.cd = Math.max(f.cd, 0.35); } break;
      case 'flee': {
        const away = Math.atan2(f.pos[0] - P[0], -(f.pos[2] - P[2])); turn(f, away, 7, dt); f.anim = 'c-sprint'; step(f, Math.sin(f.yaw) * 4.9, -Math.cos(f.yaw) * 4.9, dt);
        if (f.t > 3.6 || hyp(f.pos[0] - camp.x, f.pos[2] - camp.z) > LEASH - 4) { f.state = d < 9 && live ? 'chase' : 'return'; f.t = 0; }
        break; }
      case 'return': {
        const th = Math.atan2(home[0] - f.pos[0], -(home[2] - f.pos[2])); turn(f, th, 5, dt); f.anim = 'c-run'; step(f, Math.sin(f.yaw) * 3.4, -Math.cos(f.yaw) * 3.4, dt);
        f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.08 * dt);
        if (dHome < 0.5) { f.state = 'idle'; f.t = 0; f.fleeDone = false; }
        else if (live && d < 7 && !inVillage(P[0], P[2]) && hyp(f.pos[0] - camp.x, f.pos[2] - camp.z) < LEASH - 8 && f.t > 1.5) { f.state = 'chase'; f.t = 0; }
        break; }
    }
  }
  F.update = function (dt, rdt) {
    if (!F.ready) return;
    const P = game.playing ? Player.pos : R.cam.pos, live = game.playing && !RPG.dead, st = F.st, r = RPG.st();
    let target = null, tb = 0.55, fight = null;
    for (const f of F.list) {
      if (f.state === 'gone') continue;
      const d = hyp(f.pos[0] - P[0], f.pos[2] - P[2]);
      f.vis = d < 135;
      if (!f.vis) { if (f.h.pivot.visible) f.h.pivot.visible = false; if (f.alive && f.state !== 'idle') { f.acc += dt; if (f.acc > 0.25) { think(f, f.acc, P, d, live); f.acc = 0; } } continue; }
      // far away, think and pose less often
      f.acc += dt; const every = d > 90 ? 0.2 : d > 48 ? 0.09 : 0; if (f.acc < every) continue; const fdt = f.acc; f.acc = 0;
      if (f.alive) {
        think(f, fdt, P, d, live);
        if (f.state !== 'idle' && f.state !== 'return') { fight = f; RPG.combatT = Math.min(RPG.combatT, d < 14 ? 0 : 5); }
        // keep bodies apart
        if (live && d < 0.72 && d > 0.01 && Math.abs(P[1] - f.pos[1]) < 1.5) { const k = (0.72 - d) / d, dx = f.pos[0] - P[0], dz = f.pos[2] - P[2]; f.pos[0] += dx * k * 0.7; f.pos[2] += dz * k * 0.7; Player.pos[0] -= dx * k * 0.3; Player.pos[2] -= dz * k * 0.3; }
        if (live && d < 9 && (f.state !== 'idle' || d < 5)) { const a = Math.abs(angDiff(Math.atan2(f.pos[0] - P[0], -(f.pos[2] - P[2])), Player.yaw)); const sc = a + d * 0.03; if (sc < tb) { tb = sc; target = f; } }
      } else {
        f.t += fdt;
        if (f.state === 'dead' && (f.t > (f.looted ? 40 : 300)) && d > 30) { f.state = 'gone'; f.h.pivot.visible = false; if (f.lootIt) { const i = World.interact.indexOf(f.lootIt); if (i >= 0) World.interact.splice(i, 1); } continue; }
      }
      st.pos = f.pos; st.yaw = f.yaw; st.anim = f.anim; st.scale = f.scale; st.zone = 0; st.light = 1; st.visible = true;
      st.look[0] = 0; st.look[1] = 0;
      Chars.update(f.h, st, fdt * (f.state === 'attack' && f.atk ? f.atk.rate : 1));
    }
    F.target = target;
    // villagers nearby stop and stare at a fight
    if (fight) for (const n of NPCS) { if (n.anim === 'lie' || n.talking) continue; if (hyp(n.pos[0] - fight.pos[0], n.pos[2] - fight.pos[2]) < 26) { n.alarm = 1.2; n.alarmAt = fight.pos; } }
    for (const n of NPCS) if (n.alarm > 0) { n.alarm -= rdt; if (n.anim === 'walk' || n.anim === 'run') n.anim = 'idle'; if (n.anim === 'idle' || n.anim === 'guard') n.yaw += angDiff(Math.atan2(n.alarmAt[0] - n.pos[0], -(n.alarmAt[2] - n.pos[2])), n.yaw) * Math.min(1, rdt * 5); }
    // an emptied camp fills again after a few days, while you are far away
    if ((R.frame & 255) === 0) for (const f of F.list) if (f.state === 'gone' && !f.chief && r.dead[f.id] !== undefined && r.day - r.dead[f.id] >= 3 && hyp(f.camp.x - P[0], f.camp.z - P[2]) > 100) {
      delete r.dead[f.id]; f.alive = true; f.hp = f.maxHp; f.state = 'idle'; f.t = 0; f.pos = f.spot.p.slice(); f.yaw = f.spot.yaw; f.looted = false; f.fleeDone = false; f.h.curName = ''; campState();
    }
  };
  return F;
})();
