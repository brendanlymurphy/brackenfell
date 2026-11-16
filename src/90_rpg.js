// ───────────────────────── the adventurer: health, stamina, sprint / jump / dodge, HUD, death and respawn ─────────────────────────
// Everything a small action RPG adds on top of the village walk lives in 90_rpg.js (this file), 91_combat.js (the sword in view),
// 92_foes.js (outlaws and their camps) and 93_inventory.js (gear, food, the smith's trade). The rest of the game talks to it through
// RPG.move / RPG.jumped / RPG.landed (from playerUpdate) and RPG.tick (from the main loop, after particles are laid out).
// State that must survive a save sits in S.rpg, so the existing save system carries it.
const RPG = {
  MAXHP: 100, MAXST: 100,
  in: { atk: false, block: false, jump: false, dodge: false },          // held buttons: mouse, keys, touch buttons or a test script
  prev: { jump: false, dodge: false }, jumpBuf: 0, dodgeT: 0, dodgeCd: 0, dodgeDir: [0, 0], lastMove: [0, 0], iframes: 0,
  stDelay: 0, hurtT: 99, combatT: 99, flash: 0, shake: 0, kick: [0, 0], hitStop: 0, exhausted: false,
  dead: false, deadT: 0, inited: false, out: { run: false, speed: 1, jump: false, ov: null }, ov: [0, 0], fx: [], hud: {}, wasPlaying: false,
};
// sounds: Audio2.swing / hitFlesh / clash / hurt / hop / eat / shout / fall are in the sound engine now (88_audio.js, 88b_sfx.js)

// saved state, with defaults filled in for a new game or an older save
RPG.st = function () {
  let r = S.rpg;
  if (!r || r.v !== 2) {
    const fresh = !r;
    r = S.rpg = Object.assign({ hp: RPG.MAXHP, sta: RPG.MAXST, eq: { weapon: 'shortsword', shield: null, armor: null }, kills: 0, day: 0, dead: {}, hour: Env.hour }, r || {}); r.v = 2;
    if (fresh && !has('shortsword')) give('shortsword');
  }
  return r;
};
RPG.meta = id => (ITEMS[id] && ITEMS[id][2]) || {};

// ── called from playerUpdate ──
RPG.move = function (dt, run, mx, mz, depth) {
  const r = RPG.st(), o = RPG.out, P = Player, moving = hyp(mx, mz) > 0.2;
  RPG.lastMove[0] = mx; RPG.lastMove[1] = mz;
  const sprint = run && moving && !RPG.exhausted && r.sta > 0 && !Combat.busy();
  if (sprint && P.onGround) { r.sta = Math.max(0, r.sta - 10 * dt); RPG.stDelay = 0.7; if (r.sta <= 0) { RPG.exhausted = true; toast('You are out of breath.'); } }
  if (RPG.exhausted && r.sta > 30) RPG.exhausted = false;
  o.run = sprint; o.speed = Combat.speed();
  o.jump = false;
  if (RPG.jumpBuf > 0) { RPG.jumpBuf -= dt; if ((P.onGround || P.coyote > 0) && r.sta >= 5) { o.jump = true; RPG.jumpBuf = 0; } }
  o.ov = null;
  if (RPG.dodgeT > 0) { RPG.dodgeT -= dt; RPG.ov[0] = RPG.dodgeDir[0] * 8.4; RPG.ov[1] = RPG.dodgeDir[1] * 8.4; o.ov = RPG.ov; }
  return o;
};
RPG.jumped = function () { const r = RPG.st(); r.sta = Math.max(0, r.sta - 5); RPG.stDelay = Math.max(RPG.stDelay, 0.5); Audio2.hop(); };
RPG.landed = function (v, depth) { if (v > 11.5 && depth < 0.3) RPG.damage((v - 11.5) * 7, null, 'fall'); };
RPG.tryDodge = function () {
  const r = RPG.st(), P = Player;
  if (RPG.dodgeCd > 0 || r.sta < 16 || !P.onGround || P.locked || RPG.dead) return false;
  let mx = RPG.lastMove[0], mz = RPG.lastMove[1]; if (hyp(mx, mz) < 0.3) { mx = 0; mz = -1; }
  const l = hyp(mx, mz), fx = Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = Math.sin(P.yaw);
  RPG.dodgeDir[0] = (fx * mz + rx * mx) / l; RPG.dodgeDir[1] = (fz * mz + rz * mx) / l;
  RPG.dodgeT = 0.24; RPG.dodgeCd = 0.7; RPG.iframes = 0.3; r.sta -= 16; RPG.stDelay = 0.9; Audio2.swing(false); Combat.interrupt();
  return true;
};

// ── damage, death, healing ──
RPG.damage = function (n, from, kind) {
  const r = RPG.st();
  if (RPG.dead || !game.playing || n <= 0) return 0;
  if (kind !== 'fall') { if (RPG.iframes > 0) return 0; n = Combat.defend(n, from); if (n <= 0) return 0; n *= 1 - (RPG.meta(r.eq.armor).armor || 0); }
  r.hp -= n; RPG.hurtT = 0; RPG.combatT = 0; RPG.flash = Math.min(1, 0.4 + n / 35); RPG.shake = Math.min(1, 0.35 + n / 30);
  Audio2.hurt();
  if (r.hp <= 0) { r.hp = 0; RPG.die(kind === 'fall' ? 'The fall broke you.' : 'You were cut down.'); }
  return n;
};
RPG.heal = function (n) { const r = RPG.st(); r.hp = Math.min(RPG.MAXHP, r.hp + n); };
RPG.die = function (why) {
  if (RPG.dead) return;
  RPG.dead = true; RPG.deadT = 0; Player.locked = true; Combat.interrupt(); Audio2.fall();
  if (typeof releaseLook === 'function') releaseLook();
  const d = $('deadMsg'); d.querySelector('b').textContent = why; d.style.opacity = 0; d.hidden = false;
  setTimeout(() => fadeDo(RPG.respawn), TEST ? 300 : 2400);
};
RPG.respawn = function () {
  const r = RPG.st(), bed = World.interact.find(i => i.id === 'inn.bed'), P = Player;
  const lost = Math.min(25, Math.floor(S.gold * 0.2)); S.gold -= lost; uiPurse();
  if (S.flags.bed && bed) { P.pos = [bed.p[0] + 0.9, bed.p[1] - 0.5, bed.p[2]]; P.pos[1] = World.groundAt(P.pos[0], P.pos[2], bed.p[1] + 0.4); }
  else { P.pos = [-84, 0, -6.5]; P.pos[1] = World.groundAt(P.pos[0], P.pos[2], 50); P.yaw = 1.45; }
  P.vel = [0, 0, 0]; P.pitch = 0; r.hp = RPG.MAXHP; r.sta = RPG.MAXST; RPG.dead = false; RPG.hud.deadMsg.style.opacity = 0; RPG.flash = 0; RPG.shake = 0; RPG.iframes = 2;
  Env.hour = 7; World.festival = false; for (const n of NPCS) n.override = null; npcSnapAll();
  if (typeof Foes !== 'undefined') Foes.calm(true);
  $('deadMsg').hidden = true;
  toast(S.flags.bed ? 'You wake in your bed at the Honeyed Hart, bruised' + (lost ? ' and ' + lost + ' gold lighter.' : '.') : 'You come to by the road, bruised' + (lost ? ' and ' + lost + ' gold lighter.' : '.'));
  save();
};

// ── transient sparks and puffs, appended to the particle buffer each frame ──
RPG.spark = function (p, n, col, speed, kind, size, life) {
  for (let i = 0; i < n && RPG.fx.length < 90; i++) {
    const a = Math.random() * TAU, e = Math.random() * 1.6 - 0.3, s = (speed || 3) * (0.4 + Math.random() * 0.8);
    RPG.fx.push({ p: [p[0], p[1], p[2]], v: [Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 0.6, Math.sin(a) * Math.cos(e) * s], life: 0, max: (life || 0.35) * (0.6 + Math.random() * 0.8), kind: kind === undefined ? 3 : kind, size: size || 0.03, col: col || [1, 0.75, 0.3], seed: Math.random() });
  }
};
RPG.fxWrite = function (dt) {
  const d = R.partData, max = R.partMax, fx = RPG.fx; let n = R.partCount;
  for (let i = fx.length - 1; i >= 0; i--) {
    const s = fx[i]; s.life += dt; if (s.life > s.max) { fx[i] = fx[fx.length - 1]; fx.pop(); continue; }
    const k = s.life / s.max, smoke = s.kind === 1;
    s.p[0] += s.v[0] * dt; s.p[1] += s.v[1] * dt; s.p[2] += s.v[2] * dt; s.v[1] -= (smoke ? -0.4 : 9) * dt; if (smoke) { s.v[0] *= 1 - 2 * dt; s.v[2] *= 1 - 2 * dt; }
    if (n >= max) continue;
    const o = n++ * 12; d[o] = s.p[0]; d[o + 1] = s.p[1]; d[o + 2] = s.p[2]; d[o + 3] = smoke ? s.size * (1 + k * 2.5) : s.size;
    d[o + 4] = s.col[0]; d[o + 5] = s.col[1]; d[o + 6] = s.col[2]; d[o + 7] = smoke ? (1 - k) * 0.5 : 3.2 * (1 - k); d[o + 8] = s.seed * 6; d[o + 9] = s.kind; d[o + 10] = 1; d[o + 11] = s.seed;
  }
  R.partCount = n;
};

// ── geometry and material helpers for small hand-built things (weapons, hands) ──
// parts: [geometry, Matrix4, [r, g, b] linear, [metal, roughness]?]; returns one geometry with 'color' and 'mr' attributes
RPG.merge = function (parts) {
  let n = 0; const gs = parts.map(([g, m, c, mr]) => { const t = g.index ? g.toNonIndexed() : g.clone(); if (m) t.applyMatrix4(m); g.dispose(); n += t.attributes.position.count; return [t, c, mr || [0, 0.8]]; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), mrA = new Float32Array(n * 2); let o = 0;
  for (const [t, c, mr] of gs) { const k = t.attributes.position.count; pos.set(t.attributes.position.array, o * 3); nor.set(t.attributes.normal.array, o * 3); for (let i = 0; i < k; i++) { col.set(c, (o + i) * 3); mrA.set(mr, (o + i) * 2); } o += k; t.dispose(); }
  const g = new THREE.BufferGeometry(), BA = THREE.BufferAttribute;
  g.setAttribute('position', new BA(pos, 3)); g.setAttribute('normal', new BA(nor, 3)); g.setAttribute('color', new BA(col, 3)); g.setAttribute('mr', new BA(mrA, 2)); g.computeBoundingSphere();
  return g;
};
// vertex-coloured surface lit like the rest of the world: sun from the scene light, sky and hearths through emissive
RPG.litMat = function (uZone, uLight, rough) {
  const { attribute, float, positionWorld, normalWorld } = TSL;
  const m = new THREE.MeshStandardNodeMaterial(); m.roughness = rough === undefined ? 0.5 : rough; m.metalness = 0;
  const albedo = attribute('color', 'vec3'), N = normalWorld.normalize();
  m.colorNode = albedo; m.emissiveNode = albedo.mul(SH.hemi(N, uLight, uZone).add(SH.pointLights(positionWorld, N, uZone, float(0.25))));
  return m;
};
// Weapons, gloves and sleeves: as litMat, plus per-vertex metal and roughness ('mr'). Steel mirrors the sky above and the ground below
// (there is no environment map), takes the sun's highlight from the scene light and glints in firelight; leather and cloth get a grain.
RPG.gearMat = function (uZone, uLight) {
  const { attribute, float, vec2, vec3, positionWorld, positionLocal, normalWorld, texture, mix, reflect, normalize, dot, pow, max, abs, smoothstep, step } = TSL, U = SH.U;
  const m = new THREE.MeshStandardNodeMaterial();
  const col = attribute('color', 'vec3'), mr = attribute('mr', 'vec2'), metal = mr.x, pl = positionLocal;
  const N = normalWorld.normalize(), V = normalize(U.camPos.sub(positionWorld)), Rf = reflect(V.negate(), N);
  // grain: long streaks down a blade (the marks of the grindstone), a fine mottle on leather and cloth
  const g = texture(G.noiseTex, vec2(pl.x.mul(mix(55.0, 130.0, metal)).add(pl.z.mul(41.0)), pl.y.mul(mix(55.0, 2.2, metal)).add(pl.z.mul(23.0)))).r.sub(0.5);
  const albedo = col.mul(g.mul(mix(0.8, 0.25, metal)).add(1));
  const rough = SH.sat(mr.y.add(g.mul(0.25)));
  const sky = SH.skyBase(vec3(Rf.x, abs(Rf.y).mul(0.6).add(0.02), Rf.z)), open = step(uZone, 0.5);
  // worn steel is a poor mirror: it shows the sky's brightness more than its colour
  const skyG = mix(vec3(dot(sky, vec3(0.2126, 0.7152, 0.0722))), sky, 0.3).mul(0.8);
  const outEnv = mix(U.ambGnd.mul(1.5), skyG, smoothstep(-0.25, 0.2, Rf.y));
  const env = mix(SH.hemi(Rf, uLight, uZone).mul(1.3), outEnv.mul(uLight), open).mul(mix(1.0, 0.55, rough));
  const glint = SH.pointLights(positionWorld, Rf, uZone, float(0.0)).mul(1.6).add(SH.pointLights(positionWorld, N, uZone, float(0.25)).mul(0.35));
  const dull = SH.hemi(N, uLight, uZone).add(SH.pointLights(positionWorld, N, uZone, float(0.25)));
  const fres = pow(SH.sat(float(1).sub(dot(N, V))), 4);
  m.colorNode = albedo; m.metalnessNode = metal; m.roughnessNode = rough;
  m.emissiveNode = mix(albedo.mul(dull).add(env.mul(fres.mul(0.05))), albedo.mul(env.add(glint)).mul(fres.mul(0.5).add(0.75)), metal);
  return m;
};
const _M4 = () => new THREE.Matrix4();
RPG.xf = (x, y, z, rx, ry, rz, sx, sy, sz) => _M4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz));
// places a shape built along +y so that it runs from a to b (centred between them); sx, sz scale its cross-section
RPG.aim = (a, b, sx, sz) => { const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A).normalize();
  return _M4().compose(A.add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d), new THREE.Vector3(sx || 1, 1, sz || sx || 1)); };
// flat-faced skin over a row of closed rings (each a list of [x, y, z], all the same length); the ends are closed with fans
RPG.loft = function (rings) {
  const P = [], n = rings[0].length, cen = r => { const c = [0, 0, 0]; for (const p of r) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; } return c; };
  const tri = (a, b, c, inside) => {       // wound so that it faces away from `inside`
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-18) return;
    if (nx * (a[0] - inside[0]) + ny * (a[1] - inside[1]) + nz * (a[2] - inside[2]) < 0) P.push(...a, ...c, ...b); else P.push(...a, ...b, ...c);
  };
  for (let k = 0; k + 1 < rings.length; k++) { const A = rings[k], B = rings[k + 1], ca = cen(A), cb = cen(B), mid = [(ca[0] + cb[0]) / 2, (ca[1] + cb[1]) / 2, (ca[2] + cb[2]) / 2];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(A[i], A[j], B[j], mid); tri(A[i], B[j], B[i], mid); } }
  for (const [r, o] of [[rings[0], rings[1]], [rings[rings.length - 1], rings[rings.length - 2]]]) { const c = cen(r), inn = cen(o); for (let i = 0; i < n; i++) tri(c, r[i], r[(i + 1) % n], inn); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.computeVertexNormals();
  return g;
};
// An arming sword: grip at the origin, blade along +y with its flats facing +z and -z. len = blade length, tone = how bright the steel
// is (below 0.7 it is pitted and brown), wide = half the blade's width at the guard. The blade is a flattened hexagon with a fuller
// (the groove down the middle) over the first two thirds, tapering to a point; a straight crossguard, a corded grip, a wheel pommel.
RPG.swordGeo = function (len, tone, wide) {
  const T = THREE, w0 = wide || 0.026, t0 = 0.0036, y0 = 0.094, L = len + 0.09, rust = sat((0.75 - tone) * 3.3);
  const k = 0.42 + 0.26 * Math.min(tone, 1.3), st = mix3([0.60 * k / 0.68, 0.61 * k / 0.68, 0.64 * k / 0.68], [0.20, 0.13, 0.085], rust), fit = mix3([0.30, 0.29, 0.28], [0.15, 0.11, 0.08], rust);
  const steel = [1, lerp(0.30, 0.72, rust)], iron = [1, lerp(0.48, 0.75, rust)];
  const ring = (y, w, t, f) => [[w, y, 0], [w * 0.40, y, t], [w * 0.17, y, t * (1 - f)], [-w * 0.17, y, t * (1 - f)], [-w * 0.40, y, t], [-w, y, 0], [-w * 0.40, y, -t], [-w * 0.17, y, -t * (1 - f)], [w * 0.17, y, -t * (1 - f)], [w * 0.40, y, -t]];
  const short = len < 0.35, F = short ? 0 : 0.62;        // a knife has no fuller
  const blade = RPG.loft([ring(y0, w0 * 0.96, t0, F), ring(y0 + L * 0.03, w0, t0, F), ring(y0 + L * 0.58, w0 * 0.80, t0 * 0.84, F), ring(y0 + L * 0.66, w0 * 0.77, t0 * 0.80, 0), ring(y0 + L * 0.88, w0 * 0.60, t0 * 0.62, 0), ring(y0 + L * 0.965, w0 * 0.36, t0 * 0.45, 0), ring(y0 + L, 0.0006, 0.0005, 0)]);
  const gripPts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; gripPts.push(new T.Vector2(0.0142 + 0.0024 * Math.sin(u * PI) + (i % 2 ? 0.0013 : 0), -0.075 + u * 0.15)); }
  const gl = 0.2 * (short ? 0.5 : 1) / 2;                 // half the guard's span
  return RPG.merge([
    [blade, null, st, steel],
    [new T.LatheGeometry(gripPts, 10), RPG.xf(0, 0, 0, 0, 0, 0, 1, 1, 0.84), [0.050, 0.030, 0.019], [0, 0.7]],
    [new T.CylinderGeometry(0.0195, 0.0195, 0.006, 10), RPG.xf(0, 0.072, 0, 0, 0, 0, 1, 1, 0.84), fit, iron],
    [new T.CylinderGeometry(0.0185, 0.0185, 0.006, 10), RPG.xf(0, -0.072, 0, 0, 0, 0, 1, 1, 0.84), fit, iron],
    // crossguard: a block the blade sits in, and two arms that thin toward flared ends
    [new T.BoxGeometry(0.036, 0.021, 0.027), RPG.xf(0, 0.0855, 0), fit, iron],
    [new T.CylinderGeometry(0.0068, 0.0098, gl, 8), RPG.xf(gl / 2 + 0.012, 0.0855, 0, 0, 0, -PI / 2, 1, 1, 1.25), fit, iron],
    [new T.CylinderGeometry(0.0068, 0.0098, gl, 8), RPG.xf(-gl / 2 - 0.012, 0.0855, 0, 0, 0, PI / 2, 1, 1, 1.25), fit, iron],
    [new T.SphereGeometry(0.0098, 8, 6), RPG.xf(gl + 0.012, 0.0855, 0, 0, 0, 0, 0.8, 1, 1.2), fit, iron],
    [new T.SphereGeometry(0.0098, 8, 6), RPG.xf(-gl - 0.012, 0.0855, 0, 0, 0, 0, 0.8, 1, 1.2), fit, iron],
    // wheel pommel: a disc on edge with a raised boss on each face, and the peened end of the tang
    [new T.CylinderGeometry(0.0235, 0.0235, 0.014, 14), RPG.xf(0, -0.097, 0, PI / 2, 0, 0), fit, iron],
    [new T.CylinderGeometry(0.0150, 0.0205, 0.005, 14), RPG.xf(0, -0.097, 0.0095, PI / 2, 0, 0), fit, iron],
    [new T.CylinderGeometry(0.0205, 0.0150, 0.005, 14), RPG.xf(0, -0.097, -0.0095, PI / 2, 0, 0), fit, iron],
    [new T.CylinderGeometry(0.005, 0.006, 0.006, 6), RPG.xf(0, -0.123, 0), fit, iron],
  ]);
};
// A gloved right fist closed round a grip that runs along y through the origin: back of the hand on +x, knuckles toward -z, wrist toward +z.
RPG.WRIST = [0.027, -0.012, 0.060];
RPG.fistGeo = function () {
  const T = THREE, lea = [0.052, 0.034, 0.023], dark = [0.036, 0.023, 0.016], soft = [0, 0.78], parts = [];
  parts.push([new T.SphereGeometry(1, 12, 9), RPG.xf(0.029, -0.002, 0.012, 0, 0.12, 0, 0.0185, 0.045, 0.043), lea, soft]);       // back of the hand
  const ys = [0.031, 0.0095, -0.012, -0.0325], Rr = [0.0262, 0.0274, 0.0268, 0.0246], tb = [0.0106, 0.0111, 0.0107, 0.0096];
  for (let i = 0; i < 4; i++) {
    const R_ = Rr[i], t = tb[i], y = ys[i], a0 = PI * 0.75, a1 = a0 + PI * 1.02;
    parts.push([new T.TorusGeometry(R_, t, 7, 9, PI * 1.02), RPG.xf(0, y, 0, PI / 2, 0, a0), i % 2 ? dark : lea, soft]);
    parts.push([new T.SphereGeometry(t * 1.16, 8, 6), RPG.xf(Math.cos(a1) * R_ * 1.04, y, Math.sin(a1) * R_ * 1.04), lea, soft]);      // knuckle
    parts.push([new T.SphereGeometry(t * 0.98, 8, 6), RPG.xf(Math.cos(a0) * R_, y, Math.sin(a0) * R_), dark, soft]);                  // fingertip
  }
  parts.push([new T.CapsuleGeometry(0.0112, 0.034, 4, 8), RPG.aim([0.021, 0.036, 0.031], [-0.019, 0.047, 0.015]), lea, soft]);       // thumb, laid over the forefinger
  parts.push([new T.SphereGeometry(1, 10, 8), RPG.xf(0.021, 0.010, 0.036, 0, 0, 0, 0.021, 0.027, 0.021), lea, soft]);                 // ball of the thumb
  parts.push([new T.SphereGeometry(1, 10, 8), RPG.xf(0.012, -0.024, 0.034, 0, 0, 0, 0.022, 0.022, 0.022), dark, soft]);               // heel of the palm
  const W = RPG.WRIST; parts.push([new T.SphereGeometry(1, 10, 8), RPG.xf(W[0], W[1], W[2], 0, 0, 0, 0.029, 0.026, 0.028), lea, soft]);
  return RPG.merge(parts);
};
// Forearm from the wrist (origin) back along +z: the glove's flared cuff with a stitched rim, then a padded wool sleeve.
RPG.forearmGeo = function () {
  const T = THREE, V = (r, y) => new T.Vector2(r, y), up = RPG.xf(0, 0, 0, PI / 2, 0, 0, 1.1, 1, 0.94);
  const sleeve = [V(0.033, 0.07)]; for (let i = 0; i <= 12; i++) { const u = i / 12; sleeve.push(V(0.037 + 0.016 * u + (i % 3 === 1 ? 0.0028 : 0), 0.09 + u * 0.50)); }
  return RPG.merge([
    [new T.LatheGeometry([V(0.026, -0.02), V(0.0295, 0.0), V(0.031, 0.03), V(0.036, 0.065), V(0.0445, 0.105)], 12), up, [0.046, 0.030, 0.021], [0, 0.74]],
    [new T.TorusGeometry(0.0445, 0.0034, 5, 14), RPG.xf(0, 0, 0.105, 0, 0, 0, 1.1, 0.94, 1), [0.075, 0.052, 0.034], [0, 0.7]],
    [new T.LatheGeometry(sleeve, 12), up, [0.050, 0.049, 0.044], [0, 0.95]],
  ]);
};
RPG.shieldGeo = function () {
  const T = THREE;
  return RPG.merge([
    [new T.CylinderGeometry(0.30, 0.30, 0.03, 16), RPG.xf(0, 0, 0, PI / 2, 0, 0), [0.20, 0.07, 0.045]],
    [new T.CylinderGeometry(0.315, 0.315, 0.018, 16), RPG.xf(0, 0, 0, PI / 2, 0, 0), [0.14, 0.14, 0.15]],
    [new T.SphereGeometry(0.075, 10, 6), RPG.xf(0, 0, -0.02, 0, 0, 0, 1, 1, 0.55), [0.2, 0.2, 0.22]],
  ]);
};

// ── HUD ──
RPG.hudInit = function () {
  const H = RPG.hud; for (const id of ['rpg', 'vitals', 'hpFill', 'stFill', 'foe', 'foeName', 'foeFill', 'hurt', 'rpgTouch', 'deadMsg']) H[id] = $(id);
  const hold = (id, key) => {
    const b = $(id); if (!b) return;
    const down = e => { e.preventDefault(); e.stopPropagation(); Input.touch = true; RPG.in[key] = true; try { b.setPointerCapture(e.pointerId); } catch (err) { } b.classList.add('on'); };
    const up = e => { RPG.in[key] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  };
  hold('tAtk', 'atk'); hold('tBlock', 'block'); hold('tJump', 'jump'); hold('tDodge', 'dodge');
  const eat = $('tEat'); if (eat) { eat.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Input.touch = true; if (!Player.locked && !RPG.dead) Inv.quick(); }); eat.addEventListener('contextmenu', e => e.preventDefault()); }
  addEventListener('keydown', e => { if (e.code === 'KeyH' && !e.repeat && game.playing && !Player.locked && !RPG.dead) Inv.quick(); });
  // mouse: left attacks, right blocks, while the pointer is captured by the view
  addEventListener('mousedown', e => { if (!Input.plock || Player.locked) return; if (e.button === 0) RPG.in.atk = true; else if (e.button === 2) RPG.in.block = true; });
  addEventListener('mouseup', e => { if (e.button === 0) RPG.in.atk = false; else if (e.button === 2) RPG.in.block = false; });
  addEventListener('contextmenu', e => { if (Input.plock) e.preventDefault(); });
  addEventListener('blur', () => { RPG.in.atk = RPG.in.block = RPG.in.jump = RPG.in.dodge = false; });
};
RPG.hudFrame = function (dt) {
  const H = RPG.hud, r = RPG.st(), hp = r.hp / RPG.MAXHP, st = r.sta / RPG.MAXST;
  if (Math.abs(hp - H.hpV) > 0.004 || H.hpV === undefined) { H.hpV = hp; H.hpFill.style.transform = 'scaleX(' + hp.toFixed(3) + ')'; }
  if (Math.abs(st - H.stV) > 0.004 || H.stV === undefined) { H.stV = st; H.stFill.style.transform = 'scaleX(' + st.toFixed(3) + ')'; H.stFill.parentNode.classList.toggle('low', RPG.exhausted); }
  // the bars rest when there is nothing to tell
  const show = hp < 0.995 || st < 0.995 || RPG.combatT < 6; H.showT = show ? 0 : (H.showT || 0) + dt;
  const vis = H.showT < 2.5; if (vis !== H.vis) { H.vis = vis; H.vitals.classList.toggle('rest', !vis); }
  RPG.flash = Math.max(0, RPG.flash - dt * 1.6); const low = hp < 0.3 ? (0.3 - hp) * 1.6 * (0.75 + 0.25 * Math.sin(game.time * 5)) : 0, f = Math.max(RPG.flash, low);
  if (Math.abs(f - (H.flashV || 0)) > 0.01) { H.flashV = f; H.hurt.style.opacity = f.toFixed(2); }
  const touch = Input.touch || (typeof coarse === 'function' && coarse()); if (touch !== H.touch) { H.touch = touch; H.rpgTouch.hidden = !touch; document.body.classList.toggle('touch', touch); }
  // the foe you are facing
  const t = typeof Foes !== 'undefined' ? Foes.target : null;
  if (t !== H.foeT) { H.foeT = t; H.foe.hidden = !t; if (t) H.foeName.textContent = t.name; }
  if (t) { const v = Math.max(0, t.hp / t.maxHp); if (v !== H.foeV) { H.foeV = v; H.foeFill.style.transform = 'scaleX(' + v.toFixed(3) + ')'; } }
};

// ── per frame, from the main loop ──
RPG.tick = function (dt) {
  if (!SC.scene) return;
  if (!RPG.inited) { RPG.inited = true; RPG.hudInit(); Combat.init(); Foes.init(); }
  const r = RPG.st(), playing = game.playing, I = RPG.in, k = Input.keys;
  if (playing && typeof ixTick === 'function') ixTick(dt);
  if (playing && typeof mineTick === 'function') mineTick(dt);       // [q1] 82b_interact.js: sitting, the watch
  if (playing !== RPG.wasPlaying) { RPG.wasPlaying = playing; RPG.hud.rpg.hidden = !playing; }
  // days pass (outlaws drift back to an emptied camp after a few)
  if (Env.hour < r.hour - 12) r.day++; r.hour = Env.hour;
  const slow = RPG.hitStop > 0 ? 0.06 : 1; RPG.hitStop -= dt;
  if (playing) {
    // buttons: edges of held states
    const jump = !!(k.Space || I.jump), dodge = !!(k.KeyQ || k.ControlLeft || k.AltLeft || I.dodge);
    if (!Player.locked && !RPG.dead) {
      if (jump && !RPG.prev.jump) RPG.jumpBuf = 0.14;
      if (dodge && !RPG.prev.dodge) RPG.tryDodge();
    }
    RPG.prev.jump = jump; RPG.prev.dodge = dodge;
    RPG.dodgeCd -= dt; RPG.iframes -= dt; RPG.hurtT += dt; RPG.combatT += dt;
    // stamina returns after a breath; health mends slowly once the fight is well behind you
    RPG.stDelay -= dt;
    if (RPG.stDelay <= 0 && !RPG.dead) r.sta = Math.min(RPG.MAXST, r.sta + (Combat.blocking() ? 7 : 22) * dt);
    if (RPG.hurtT > 7 && RPG.combatT > 7 && r.hp > 0 && r.hp < RPG.MAXHP) r.hp = Math.min(RPG.MAXHP, r.hp + 1.4 * dt);
    Combat.update(dt * slow, dt);
  }
  Foes.update(UI.menu || UI.reader ? 0 : dt * slow, dt);        // the journal is a pause: nobody swings while you read it
  // camera: recoil from blows given and taken, and the slump of a fall
  const cam = R.cam, K = RPG.kick;
  if (playing) {
    K[0] += (0 - K[0]) * Math.min(1, dt * 11); K[1] += (0 - K[1]) * Math.min(1, dt * 11); RPG.shake = Math.max(0, RPG.shake - dt * 2.6);
    const sh = RPG.shake * RPG.shake * 0.05, t = game.time * 47;
    const rm = typeof Feel !== 'undefined' && Feel.reduce ? 0 : 1;      // [ui] Settings > Reduce motion silences camera kick
    cam.yaw += (K[0] + Math.sin(t) * sh) * rm; cam.pitch += (K[1] + Math.cos(t * 1.31) * sh) * rm;
    if (RPG.dead) { RPG.deadT += dt; const d = smooth(0, 1.1, RPG.deadT); RPG.hud.deadMsg.style.opacity = smooth(0.5, 1.6, RPG.deadT).toFixed(2); cam.pos[1] -= d * 1.25; cam.pitch += d * 0.5; cam.yaw += d * 0.35; }
    RPG.hudFrame(dt);
  }
  Combat.place();
  RPG.fxWrite(dt);
};
// test hook: one object with everything a script wants to look at
RPG.info = function () { const r = RPG.st(); return { hp: +r.hp.toFixed(1), sta: +r.sta.toFixed(1), eq: r.eq, kills: r.kills, gold: S.gold, dead: RPG.dead, foes: typeof Foes !== 'undefined' ? Foes.list.map(f => f.id + ':' + f.state + ':' + Math.round(f.hp)) : [] }; };
