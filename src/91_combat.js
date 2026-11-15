// ───────────────────────── melee in first person: the sword (and shield) in view, swings, blocking, hits ─────────────────────────
// Poses are in camera space (x right, y up, -z into the screen): p = hand position, r = Euler XYZ of a blade that points along +y.
const Combat = (() => {
  const REST = { p: [0.27, -0.31, -0.58], r: [-1.0, 0.2, 0.25] };
  const ATK = [
    { name: 'slash',  W: { p: [0.34, -0.10, -0.50] , r: [0.25, 0.3, -0.75] },  E: { p: [-0.10, -0.38, -0.64], r: [-1.45, 0.0, 1.25] }, wind: 0.11, strike: 0.13, rec: 0.27, hit: 0.45, mul: 1.0,  sta: 8,  arc: 1.05, kick: [-0.035, -0.012] },
    { name: 'back',   W: { p: [-0.20, -0.20, -0.52], r: [-0.75, -0.4, 1.45] }, E: { p: [0.36, -0.34, -0.60], r: [-1.25, 0.3, -1.25] }, wind: 0.10, strike: 0.13, rec: 0.27, hit: 0.45, mul: 1.0,  sta: 8,  arc: 1.05, kick: [0.035, -0.008] },
    { name: 'chop',   W: { p: [0.20, 0.08, -0.48], r: [0.85, 0, -0.12] },      E: { p: [0.06, -0.42, -0.66], r: [-1.75, 0, 0.12] },    wind: 0.13, strike: 0.13, rec: 0.34, hit: 0.5,  mul: 1.35, sta: 10, arc: 0.8,  kick: [0, -0.05] },
  ];
  const HEAVY = { name: 'heavy', W: { p: [0.28, 0.10, -0.46], r: [1.15, 0.2, -0.45] }, E: { p: [-0.02, -0.46, -0.68], r: [-1.85, 0, 0.5] }, charge: 0.27, strike: 0.15, rec: 0.44, hit: 0.5, mul: 2.2, sta: 26, arc: 1.25, kick: [-0.012, -0.085] };
  const BLOCK = { p: [0.04, -0.14, -0.50], r: [-0.25, 0, 1.30] }, BLOCK_S = { p: [0.30, -0.36, -0.55], r: [-1.1, 0.25, 0.2] };
  const SH_REST = { p: [-0.40, -0.52, -0.50], r: [0.3, 0.6, 0.1] }, SH_UP = { p: [-0.10, -0.15, -0.48], r: [0.05, 0.12, 0.04] };
  const C = {
    phase: 'idle', k: 0, t: 0, atk: null, heavy: false, from: { p: [0, 0, 0], r: [0, 0, 0] }, cur: { p: REST.p.slice(), r: REST.r.slice() }, sh: { p: SH_REST.p.slice(), r: SH_REST.r.slice() },
    hitDone: false, queued: false, pressed: false, chainT: 9, blockT: 0, away: 1, idleT: 99, sway: 0, lastYaw: 0, weaponId: '', hasShield: false, swingN: 0,
  };
  const ease = x => x * x * (3 - 2 * x), lerpPose = (o, a, b, k) => { for (let i = 0; i < 3; i++) { o.p[i] = a.p[i] + (b.p[i] - a.p[i]) * k; o.r[i] = a.r[i] + (b.r[i] - a.r[i]) * k; } };
  const grab = () => { for (let i = 0; i < 3; i++) { C.from.p[i] = C.cur.p[i]; C.from.r[i] = C.cur.r[i]; } };
  const speedOf = () => RPG.meta(RPG.st().eq.weapon).speed || 1;

  C.init = function () {
    const T = THREE; C.uZone = TSL.uniform(0); C.uLight = TSL.uniform(1);
    const mat = C.mat = RPG.litMat(C.uZone, C.uLight, 0.42), matSoft = C.matSoft = RPG.litMat(C.uZone, C.uLight, 0.85);
    const vm = C.vm = new T.Group(); vm.matrixAutoUpdate = false; vm.name = 'viewmodel';
    const mk = (g, m) => { const o = new T.Mesh(g, m); o.frustumCulled = false; o.castShadow = false; o.receiveShadow = true; o.layers.set(1); return o; };
    C.hand = new T.Group(); C.blade = mk(RPG.swordGeo(0.64, 1), mat); C.hand.add(C.blade);
    // a fist around the grip and a forearm running back out of view
    const arm = d => RPG.merge([
      [new T.BoxGeometry(0.064, 0.074, 0.078), RPG.xf(0, 0, 0.004), [0.06, 0.04, 0.028]],
      [new T.CylinderGeometry(0.026, 0.033, 0.2, 8), RPG.xf(0.02 * d, -0.07, 0.12, 1.05, 0, 0), [0.06, 0.055, 0.04]],
      [new T.CylinderGeometry(0.036, 0.038, 0.07, 8), RPG.xf(0.01 * d, -0.045, 0.07, 1.05, 0, 0), [0.075, 0.048, 0.03]],
    ]);
    C.hand.add(mk(arm(1), matSoft)); vm.add(C.hand);
    C.shieldG = new T.Group(); C.shieldG.add(mk(RPG.shieldGeo(), matSoft));
    const la = mk(arm(-1), matSoft); la.position.set(0.02, -0.02, 0.07); C.shieldG.add(la); C.shieldG.visible = false; vm.add(C.shieldG);
    SC.scene.add(vm); C.refresh();
  };
  // equipment changed: the blade in view follows the sword you carry
  C.refresh = function () {
    const eq = RPG.st().eq; if (!C.vm) return;
    if (eq.weapon !== C.weaponId) {
      C.weaponId = eq.weapon; const b = RPG.meta(eq.weapon).blade;
      C.blade.visible = !!eq.weapon;
      if (b) { C.blade.geometry.dispose(); C.blade.geometry = RPG.swordGeo(b[0], b[1], b[2]); }
    }
    C.hasShield = !!eq.shield; C.shieldG.visible = C.hasShield;
  };
  C.busy = () => C.phase === 'wind' || C.phase === 'charge' || C.phase === 'strike' || C.phase === 'block';
  C.blocking = () => C.phase === 'block';
  C.speed = () => C.phase === 'block' || C.phase === 'charge' ? 0.5 : C.phase === 'wind' || C.phase === 'strike' ? 0.72 : 1;
  C.interrupt = function () { if (C.phase !== 'idle') { C.phase = 'idle'; C.t = 0; grab(); } C.queued = false; C.pressed = false; };
  const begin = k => { C.k = k; C.atk = ATK[k]; C.heavy = false; C.phase = 'wind'; C.t = 0; C.hitDone = false; C.queued = false; C.idleT = 0; grab(); };
  const strike = heavy => {
    const r = RPG.st(), a = heavy ? HEAVY : C.atk; C.heavy = heavy; C.atk = a;
    C.weak = r.sta < a.sta; r.sta = Math.max(0, r.sta - a.sta); RPG.stDelay = Math.max(RPG.stDelay, heavy ? 1.1 : 0.75);
    C.phase = 'strike'; C.t = 0; C.hitDone = false; grab(); Audio2.swing(heavy); C.swingN++;
  };
  // the blow lands: everything in reach and inside the arc takes it once
  const land = () => {
    const r = RPG.st(), a = C.atk, m = RPG.meta(r.eq.weapon), P = Player;
    const dmg = (m.dmg || 3) * a.mul * (C.weak ? 0.6 : 1), reach = 2.15 + (m.reach || 0) + (C.heavy ? 0.25 : 0);
    const res = Foes.sweep(P.pos, P.yaw, reach, a.arc, dmg, C.heavy);
    if (res.n) {
      RPG.hitStop = C.heavy ? 0.11 : 0.07; RPG.kick[0] += a.kick[0]; RPG.kick[1] += a.kick[1]; RPG.shake = Math.max(RPG.shake, C.heavy ? 0.5 : 0.28); RPG.combatT = 0;
      if (res.blocked) { Audio2.clash(0.8); RPG.spark(res.p, 12, [1, 0.8, 0.4], 3.5, 3, 0.04, 0.3); }
      else { Audio2.hitFlesh(C.heavy); RPG.spark(res.p, C.heavy ? 6 : 4, [0.30, 0.035, 0.025], 1.5, 1, 0.11, 0.55); RPG.spark(res.p, 5, [1, 0.62, 0.28], 2.5, 3, 0.04, 0.26); }
    } else { RPG.kick[0] += a.kick[0] * 0.35; RPG.kick[1] += a.kick[1] * 0.35; }
  };
  // a blow is coming in: the guard takes what it can. Returns the damage that gets through.
  C.defend = function (n, from) {
    if (C.phase !== 'block' || !from) return n;
    const P = Player, a = Math.abs(angDiff(Math.atan2(from.pos[0] - P.pos[0], -(from.pos[2] - P.pos[2])), P.yaw));
    if (a > 1.3) return n;
    const r = RPG.st(), hit = [(P.pos[0] + from.pos[0]) / 2, P.pos[1] + 1.25, (P.pos[2] + from.pos[2]) / 2];
    if (C.blockT < 0.24) {           // caught it early: turned aside, and the attacker reels
      Audio2.clash(1.1); RPG.spark(hit, 12, [1, 0.85, 0.45], 4, 3, 0.03, 0.32); RPG.shake = Math.max(RPG.shake, 0.3); if (from.stagger) from.stagger(1.15); return 0;
    }
    const cost = C.hasShield ? 8 : 13; RPG.stDelay = Math.max(RPG.stDelay, 0.9);
    if (r.sta < cost) { r.sta = 0; C.interrupt(); Audio2.clash(0.7); toast('Your guard breaks.'); return n * 0.7; }
    r.sta -= cost; Audio2.clash(0.7); RPG.spark(hit, 6, [1, 0.8, 0.4], 3, 3, 0.026, 0.25); RPG.shake = Math.max(RPG.shake, 0.4); RPG.kick[1] += 0.02;
    return n * (C.hasShield ? 0.1 : 0.3);
  };

  C.update = function (dt) {
    if (!C.vm) return;
    const I = RPG.in, r = RPG.st(), P = Player, free = !P.locked && !RPG.dead, sp = speedOf();
    const atk = free && I.atk, blk = free && I.block && !!r.eq.weapon;
    const down = atk && !C.pressed, up = !atk && C.pressed; C.pressed = atk;
    C.t += dt; C.chainT += dt; C.idleT += dt; C.blockT += dt;
    if (down || blk) C.idleT = 0;
    let to = REST, k = 1;
    switch (C.phase) {
      case 'idle':
        if (down && r.eq.weapon) begin(C.chainT < 0.7 ? (C.k + 1) % ATK.length : 0);
        else if (blk) { C.phase = 'block'; C.t = 0; C.blockT = 0; grab(); }
        else { k = Math.min(1, C.t / 0.22); }
        break;
      case 'wind': {
        const a = C.atk; to = a.W; k = Math.min(1, C.t / (a.wind / sp));
        if (k >= 1) { if (atk && r.sta >= HEAVY.sta) { C.phase = 'charge'; C.t = 0; grab(); } else strike(false); }
        break; }
      case 'charge':
        to = HEAVY.W; k = Math.min(1, C.t / (HEAVY.charge / sp));
        if (!atk && k < 1) strike(false); else if (k >= 1) strike(true);
        break;
      case 'strike': {
        const a = C.atk; to = a.E; k = Math.min(1, C.t / (a.strike / sp * (C.weak ? 1.4 : 1)));
        if (down) C.queued = true;
        if (!C.hitDone && k >= a.hit) { C.hitDone = true; land(); }
        if (k >= 1) { C.phase = 'rec'; C.t = 0; grab(); C.chainT = 0; }
        break; }
      case 'rec': {
        const a = C.atk, d = a.rec / sp; k = Math.min(1, C.t / d);
        if (down) C.queued = true;
        if (C.queued && !C.heavy && C.t > d * 0.3) { begin((C.k + 1) % ATK.length); to = C.atk.W; k = 0; }
        else if (blk && C.t > d * 0.45) { C.phase = 'block'; C.t = 0; C.blockT = 0; grab(); to = REST; k = 0; }
        else if (k >= 1) { C.phase = 'idle'; C.t = 0; grab(); C.chainT = 0; }
        break; }
      case 'block':
        to = C.hasShield ? BLOCK_S : BLOCK; k = Math.min(1, C.t / 0.1);
        if (!blk) { C.phase = 'idle'; C.t = 0; grab(); to = REST; k = 0; }
        break;
    }
    lerpPose(C.cur, C.from, to, C.phase === 'strike' ? k * k * (3 - 2 * k) * 0.6 + k * 0.4 : ease(k));
    // the shield comes up with the guard
    const shT = C.phase === 'block' && C.hasShield ? SH_UP : SH_REST, q = Math.min(1, dt * 16);
    for (let i = 0; i < 3; i++) { C.sh.p[i] += (shT.p[i] - C.sh.p[i]) * q; C.sh.r[i] += (shT.r[i] - C.sh.r[i]) * q; }
    // the blade rests out of sight when nothing has happened for a while or the hands are busy talking
    const wild = hyp(P.pos[0] - SQUARE.x, P.pos[2] - SQUARE.z) > 66;      // out in the wilds the blade stays in hand
    const away = (C.idleT > 9 && RPG.combatT > 9 && !wild) || P.locked || !r.eq.weapon ? 1 : 0; C.away += (away - C.away) * Math.min(1, dt * (away ? 3.5 : 14));
    const dy = angDiff(P.yaw, C.lastYaw); C.lastYaw = P.yaw; C.sway += (clamp(dy / Math.max(dt, 0.001) * 0.012, -0.05, 0.05) - C.sway) * Math.min(1, dt * 9);
  };
  // put the view model where the camera is (called after the camera has had its last nudge for the frame)
  const _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
  const VS = 1.3;       // poses are authored for a narrow view; pushing them out keeps a wide phone screen from being filled by the hand
  C.place = function () {
    if (!C.vm) return;
    const cam = R.cam, P = Player, show = game.playing && !RPG.dead && C.away < 0.985;
    C.vm.visible = show; if (!show) return;
    _e.set(cam.pitch, -cam.yaw, 0, 'YXZ'); _q.setFromEuler(_e); _v.set(cam.pos[0], cam.pos[1], cam.pos[2]);
    C.vm.matrix.compose(_v, _q, _s); C.vm.matrixWorld.copy(C.vm.matrix); C.vm.matrixWorldNeedsUpdate = false;
    const bob = P.bobAmt, st = P.step * TAU, c = C.cur, drop = C.away * 0.62 + (P.onGround ? 0 : 0.03);
    C.hand.position.set((c.p[0] - C.sway) * VS + Math.sin(st) * 0.007 * bob, (c.p[1] - drop) * VS - Math.abs(Math.cos(st)) * 0.011 * bob + Math.sin(game.time * 1.7) * 0.004, c.p[2] * VS);
    C.hand.rotation.set(c.r[0] + C.away * 0.5, c.r[1], c.r[2] - C.sway * 2);
    C.shieldG.position.set((C.sh.p[0] - C.sway) * VS, (C.sh.p[1] - drop * 0.8) * VS - Math.abs(Math.cos(st)) * 0.009 * bob, C.sh.p[2] * VS); C.shieldG.rotation.set(C.sh.r[0], C.sh.r[1], C.sh.r[2]);
    C.vm.updateMatrixWorld(true);
    C.uZone.value = World.camZone | 0; C.uLight.value = World.camZone ? 0.34 : 1;
  };
  return C;
})();
