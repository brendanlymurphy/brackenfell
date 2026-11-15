// ───────────────────────── villagers: procedural skinned bodies + pose engine ─────────────────────────
// model space: feet at y=0, facing -Z, +X is the character's right. bones: 0 pelvis 1 chest 2 head 3/4 left arm 5/6 right arm 7/8 left leg 9/10 right leg
const BJ = [[0, 0.96, 0], [0, 1.12, 0], [0, 1.50, 0], [-0.20, 1.42, 0], [-0.235, 1.13, 0], [0.20, 1.42, 0], [0.235, 1.13, 0], [-0.095, 0.93, 0], [-0.10, 0.50, 0], [0.095, 0.93, 0], [0.10, 0.50, 0]];
const BP = [-1, 0, 1, 1, 3, 1, 5, 0, 7, 0, 9];
const SKIN = { fair: [0.95, 0.76, 0.62], rosy: [0.94, 0.70, 0.58], tan: [0.84, 0.62, 0.45], brown: [0.60, 0.41, 0.29], deep: [0.40, 0.27, 0.20] };
const HAIR = { black: [0.13, 0.11, 0.10], brown: [0.32, 0.20, 0.12], auburn: [0.52, 0.24, 0.12], blond: [0.80, 0.64, 0.34], grey: [0.62, 0.61, 0.60], white: [0.90, 0.89, 0.86], red: [0.66, 0.26, 0.10] };

function buildCharacter(def) {
  const m = new Mesh(2048); m.ao = 1;
  const B = (b0, b1, w) => { m.m1 = b0; m.m2 = b1 === undefined ? b0 : b1; m.m3 = Math.round((w || 0) * 255); };
  // stack of horizontal elliptical rings (top to bottom): [y, cx, cz, rx, rz, b0, b1, w]
  const stack = (rs, n, capTop, capBot) => {
    const N = rs.length;
    m.grid(n, N - 1, (i, j) => {
      const r = rs[j], a = -i / n * TAU, c = Math.cos(a), s = Math.sin(a), up = rs[Math.max(j - 1, 0)], dn = rs[Math.min(j + 1, N - 1)];
      const ny = ((dn[3] + dn[4]) - (up[3] + up[4])) * 0.5 / Math.max(up[0] - dn[0], 0.01);
      B(r[5], r[6], r[7]);
      return m.vert(r[1] + c * r[3], r[0], r[2] + s * r[4], c / r[3], ny / ((r[3] + r[4]) * 0.5), s / r[4], i / n * 1.2, (rs[0][0] - r[0]) * 2.5);
    });
    for (const [on, r, dir] of [[capTop, rs[0], 1], [capBot, rs[N - 1], -1]]) if (on) { B(r[5], r[6], r[7]); const c0 = m.vert(r[1], r[0], r[2], 0, dir, 0, 0, 0); const ring = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; ring.push(m.vert(r[1] + Math.cos(a) * r[3], r[0], r[2] + Math.sin(a) * r[4], 0, dir, 0, 0, 0)); } for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; if (dir > 0) m.tri(c0, b, a); else m.tri(c0, a, b); } }
  };
  const skin = SKIN[def.skin || 'fair'], hair = HAIR[def.hair || 'brown'], top = def.top || [0.5, 0.4, 0.3], legs = def.legs || [0.35, 0.28, 0.22], boots = def.boots || [0.28, 0.18, 0.12];
  const fat = def.build || 1, dress = !!def.dress;
  // legs + boots
  for (const sx of [-1, 1]) {
    const th = sx < 0 ? 7 : 9, sh = sx < 0 ? 8 : 10, x = sx * 0.097;
    m.mat(MAT.CLOTH, legs, 0.6);
    stack([[0.96, x, 0, 0.088 * fat, 0.092 * fat, th, 0, 0.5], [0.80, x, 0, 0.082 * fat, 0.086 * fat, th, th, 0], [0.52, x + sx * 0.003, 0, 0.062, 0.066, th, sh, 0.5], [0.46, x + sx * 0.003, 0.004, 0.058, 0.062, sh, sh, 0], [0.33, x + sx * 0.003, 0.008, 0.055, 0.06, sh, sh, 0]], 8, false, false);
    m.mat(MAT.PLAIN, boots);
    stack([[0.37, x + sx * 0.003, 0.008, 0.064, 0.068, sh, sh, 0], [0.30, x + sx * 0.003, 0.008, 0.066, 0.07, sh, sh, 0], [0.10, x + sx * 0.003, 0.004, 0.055, 0.064, sh, sh, 0], [0.0, x + sx * 0.003, 0, 0.056, 0.066, sh, sh, 0]], 8, true, true);
    B(sh); m.ball(x + sx * 0.003, 0.045, -0.085, 0.052, 0.045, 0.115, 8, 5);
  }
  // torso
  m.mat(MAT.CLOTH, top, 0.6);
  stack([[1.475, 0, 0, 0.062, 0.06, 1, 1, 0], [1.445, 0, 0, 0.175 * fat, 0.098 * fat, 1, 1, 0], [1.36, 0, -0.004, 0.2 * fat, 0.118 * fat, 1, 1, 0], [1.24, 0, -0.006, 0.186 * fat, 0.118 * fat, 1, 1, 0], [1.12, 0, -0.004, 0.166 * fat, 0.108 * fat, 1, 0, 0.5], [1.02, 0, 0, 0.17 * fat, 0.11 * fat, 0, 0, 0], [0.93, 0, 0, 0.178 * fat, 0.118 * fat, 0, 0, 0]], 12, true, false);
  // tunic skirt or long dress
  m.mat(MAT.CLOTH, def.skirt || top, 0.6);
  if (dress) stack([[1.03, 0, 0, 0.172 * fat, 0.112 * fat, 0, 0, 0], [0.86, 0, 0, 0.21 * fat, 0.16 * fat, 0, 0, 0], [0.5, 0, 0.01, 0.255 * fat, 0.215 * fat, 0, 0, 0], [0.13, 0, 0.015, 0.30 * fat, 0.26 * fat, 0, 0, 0]], 12, false, false);
  else stack([[1.03, 0, 0, 0.172 * fat, 0.112 * fat, 0, 0, 0], [0.86, 0, 0, 0.205 * fat, 0.15 * fat, 0, 0, 0], [0.66, 0, 0, 0.228 * fat, 0.172 * fat, 0, 0, 0]], 12, false, false);
  { const hy = dress ? 0.13 : 0.66, hx = (dress ? 0.30 : 0.228) * fat, hz = (dress ? 0.26 : 0.172) * fat; m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); B(0); const c0 = m.vert(0, hy + 0.02, 0, 0, -1, 0, 0, 0); const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.push(m.vert(Math.cos(a) * hx, hy, Math.sin(a) * hz, 0, -1, 0, 0, 0)); } for (let i = 0; i < 12; i++) m.tri(c0, ring[i], ring[(i + 1) % 12]); }
  // belt
  m.mat(MAT.PLAIN, def.belt || [0.25, 0.15, 0.09]); stack([[1.085, 0, -0.002, 0.172 * fat, 0.116 * fat, 0, 1, 0.3], [1.035, 0, 0, 0.178 * fat, 0.12 * fat, 0, 0, 0]], 12, false, false);
  B(0); m.mat(MAT.METAL, COL.bronze); m.box(-0.022, 1.04, -0.128 * fat, 0.022, 1.08, -0.118 * fat);
  // arms
  for (const sx of [-1, 1]) {
    const ua = sx < 0 ? 3 : 5, fa = sx < 0 ? 4 : 6;
    m.mat(MAT.CLOTH, def.sleeves || top, 0.6);
    B(ua, 1, 0.45); m.ball(sx * 0.2 * fat, 1.425, 0, 0.072, 0.07, 0.075, 8, 5);
    const short = def.shortSleeves;
    stack([[1.45, sx * 0.205 * fat, 0, 0.06, 0.062, ua, 1, 0.4], [1.30, sx * 0.218 * fat, 0, 0.054, 0.056, ua, ua, 0], [1.16, sx * 0.232 * fat, 0, 0.048, 0.05, ua, fa, 0.5], [1.10, sx * 0.236 * fat, 0, 0.046, 0.048, fa, fa, 0]].concat(short ? [] : [[0.90, sx * 0.248 * fat, 0, 0.04, 0.042, fa, fa, 0]]), 8, false, false);
    m.mat(MAT.PLAIN, skin);
    if (short) stack([[1.10, sx * 0.236 * fat, 0, 0.042, 0.044, fa, fa, 0], [0.89, sx * 0.248 * fat, 0, 0.034, 0.036, fa, fa, 0]], 8, false, false);
    B(fa); m.ball(sx * 0.25 * fat, 0.835, -0.005, 0.034, 0.062, 0.044, 7, 5);
  }
  // neck + head
  m.mat(MAT.PLAIN, skin);
  stack([[1.56, 0, 0.004, 0.05, 0.052, 2, 2, 0], [1.50, 0, 0.002, 0.052, 0.054, 2, 1, 0.5], [1.45, 0, 0, 0.056, 0.056, 1, 1, 0]], 8, false, false);
  B(2); m.ball(0, 1.628, -0.004, 0.098, 0.122, 0.108, 12, 9);
  m.ball(0, 1.612, -0.108, 0.014, 0.024, 0.02, 6, 4); for (const sx of [-1, 1]) m.ball(sx * 0.099, 1.632, 0.004, 0.012, 0.026, 0.018, 5, 4);
  m.mat(MAT.PLAIN, [0.10, 0.08, 0.07]); for (const sx of [-1, 1]) m.ball(sx * 0.037, 1.648, -0.092, 0.013, 0.014, 0.011, 6, 4);
  m.mat(MAT.PLAIN, [0.55, 0.26, 0.22]); m.box(-0.022, 1.562, -0.104, 0.022, 1.57, -0.094);
  m.mat(MAT.PLAIN, hair); for (const sx of [-1, 1]) m.box(sx * 0.037 - 0.02, 1.672, -0.103, sx * 0.037 + 0.02, 1.68, -0.092);
  const hs = def.hairStyle || 'short';
  if (hs !== 'bald') { m.ball(0, 1.672, 0.014, 0.105, 0.09, 0.112, 10, 6); m.ball(0, 1.615, 0.046, 0.101, 0.105, 0.086, 10, 6); }
  else m.ball(0, 1.62, 0.05, 0.1, 0.06, 0.07, 8, 5);
  if (hs === 'long') stack([[1.60, 0, 0.07, 0.095, 0.06, 2, 2, 0], [1.46, 0, 0.09, 0.105, 0.05, 2, 1, 0.6], [1.30, 0, 0.105, 0.09, 0.035, 1, 1, 0]], 8, false, true);
  if (hs === 'bun') m.ball(0, 1.71, 0.085, 0.052, 0.05, 0.052, 7, 5);
  if (hs === 'braid') stack([[1.58, 0, 0.1, 0.035, 0.035, 2, 2, 0], [1.42, 0, 0.125, 0.03, 0.03, 1, 1, 0], [1.2, 0, 0.13, 0.022, 0.022, 1, 1, 0]], 6, false, true);
  B(2);
  if (def.beard) { m.ball(0, 1.555, -0.062, 0.072, 0.062, 0.058, 8, 5); if (def.beard > 1) stack([[1.55, 0, -0.07, 0.06, 0.042, 2, 2, 0], [1.44, 0, -0.085, 0.05, 0.035, 2, 1, 0.5], [1.32, 0, -0.095, 0.018, 0.014, 1, 1, 0]], 7, false, true); }
  const hat = def.hat; B(2);
  if (hat === 'straw') { m.mat(MAT.THATCH, COL.hay, 0.3); m.lathe([[0.25, 1.705], [0.11, 1.715], [0.105, 1.80], [0.05, 1.83], [0.0, 1.835]], 12, 0); m.lathe([[0.11, 1.70], [0.25, 1.70]], 12, 0); }
  if (hat === 'cap' || hat === 'feather') { m.mat(MAT.CLOTH, def.hatCol || COL.red, 0.5); m.ball(0.005, 1.725, 0.012, 0.116, 0.058, 0.124, 10, 5); if (hat === 'feather') { m.mat(MAT.PLAIN, [0.92, 0.9, 0.85]); m.quad2([0.09, 1.93, 0.1], [0.085, 1.74, 0.02], [0.105, 1.74, -0.03], [0.13, 1.93, 0.05]); } }
  if (hat === 'helmet') { m.mat(MAT.METAL, COL.steel); m.lathe([[0.128, 1.655], [0.122, 1.72], [0.09, 1.775], [0.0, 1.80]], 12, 0); m.lathe([[0.18, 1.64], [0.128, 1.662]], 12, 0); m.lathe([[0.128, 1.655], [0.18, 1.635]], 12, 0); }
  if (hat === 'hood') { m.mat(MAT.CLOTH, def.cloak || top, 0.6); m.ball(0, 1.64, 0.04, 0.128, 0.142, 0.128, 10, 7); stack([[1.52, 0, 0.03, 0.12, 0.10, 2, 1, 0.5], [1.43, 0, 0.01, 0.2 * fat, 0.125 * fat, 1, 1, 0]], 10, false, false); }
  if (hat === 'kerchief') { m.mat(MAT.CLOTH, def.hatCol || COL.linen, 0.5); m.ball(0, 1.675, 0.02, 0.11, 0.095, 0.118, 10, 6); }
  // apron / tabard, cloak
  if (def.apron) { m.mat(MAT.CLOTH, def.apron, 0.6); const z = -0.128 * fat, rows = [[1.37, 0.115, 1, 1, 0, z + 0.006], [1.10, 0.15, 1, 0, 0.5, z - 0.002], [0.60, 0.17, 0, 0, 0, -0.178 * fat]]; let pa, pb; rows.forEach((r, k) => { B(r[2], r[3], r[4]); const a = m.vert(-r[1], r[0], r[5], 0, 0.1, -1, 0, k), b = m.vert(r[1], r[0], r[5], 0, 0.1, -1, 0.6, k); if (k) { m.tri(pa, b, a); m.tri(pa, pb, b); } pa = a; pb = b; }); }
  if (def.cloakBack) { m.mat(MAT.CLOTH, def.cloak || [0.3, 0.3, 0.32], 0.7); const rows = [[1.47, 0.17, 1, 1, 0, 0.105], [1.12, 0.215, 1, 0, 0.5, 0.135], [0.55, 0.25, 0, 0, 0, 0.19]]; let pa, pb, qa, qb; rows.forEach((r, k) => { B(r[2], r[3], r[4]); const a = m.vert(-r[1] * fat, r[0], r[5] * fat, 0, 0.1, 1, 0, k), b = m.vert(r[1] * fat, r[0], r[5] * fat, 0, 0.1, 1, 0.6, k), c = m.vert(-r[1] * fat, r[0], r[5] * fat - 0.005, 0, 0, -1, 0, k), e = m.vert(r[1] * fat, r[0], r[5] * fat - 0.005, 0, 0, -1, 0.6, k); if (k) { m.tri(pa, a, b); m.tri(pa, b, pb); m.tri(qa, e, c); m.tri(qa, qb, e); } pa = a; pb = b; qa = c; qb = e; }); }
  // hand-held things (bind pose: right hand at x=+0.25, y=0.83)
  const prop = def.prop;
  if (prop === 'spear') { B(6); m.mat(MAT.TIMBER, COL.wood); m.tube([[0.275, 0.02, -0.05], [0.275, 2.02, -0.05]], 0.016, 6); m.mat(MAT.METAL, COL.steel); m.push().T(0.275, 2.02, -0.05); m.lathe([[0.035, 0], [0.0, 0.26]], 4, 1); m.pop(); }
  if (prop === 'hammer') { B(6); m.mat(MAT.TIMBER, COL.wood); m.box(0.238, 0.815, -0.30, 0.262, 0.84, 0.04); m.mat(MAT.METAL, COL.iron); m.box(0.215, 0.79, -0.36, 0.285, 0.865, -0.28); }
  if (prop === 'staff') { B(6); m.mat(MAT.TIMBER, COL.woodDark); m.tube([[0.275, 0.02, -0.07], [0.27, 0.9, -0.07], [0.28, 1.62, -0.06]], [0.018, 0.02, 0.024], 6, true); }
  if (prop === 'rod') { B(6); m.mat(MAT.TIMBER, COL.wood); m.tube([[0.25, 0.80, 0.08], [0.25, 0.98, -0.5], [0.25, 1.5, -1.9]], [0.012, 0.009, 0.004], 5); m.mat(MAT.PLAIN, [0.8, 0.8, 0.8]); m.box(0.2495, 0.3, -1.902, 0.2505, 1.5, -1.9); }
  if (prop === 'lute') { B(1); m.mat(MAT.PLANKS, [0.9, 0.7, 0.45], 0.4); m.ball(0.06, 1.13, -0.165, 0.125, 0.165, 0.05, 9, 6); m.mat(MAT.TIMBER, COL.woodDark); m.beam([0.0, 1.22, -0.17], [-0.3, 1.42, -0.15], 0.035, 0.022); m.mat(MAT.PLAIN, [0.1, 0.08, 0.07]); m.ball(0.06, 1.14, -0.214, 0.04, 0.04, 0.004, 8, 4); }
  if (prop === 'broom') { B(6); m.mat(MAT.TIMBER, COL.wood); m.tube([[0.26, 1.35, 0.1], [0.26, 0.3, -0.38]], 0.015, 5); m.mat(MAT.THATCH, COL.hay, 0.3); m.push().T(0.26, 0.3, -0.38).RX(-0.42); m.lathe([[0.09, -0.3], [0.025, 0]], 7, 0); m.pop(); }
  if (def.sword) { B(0); m.mat(MAT.PLAIN, COL.leather); m.beam([-0.2 * fat, 1.02, 0.0], [-0.24 * fat, 0.42, 0.14], 0.035, 0.03); m.mat(MAT.METAL, COL.bronze); m.box(-0.23 * fat, 1.0, -0.035, -0.16 * fat, 1.02, 0.035); m.mat(MAT.PLAIN, COL.leather); m.box(-0.205 * fat, 1.02, -0.012, -0.185 * fat, 1.14, 0.012); }
  return m;
}
// small animals share the same skinning path. chicken: bones 0 body, 1 head, 2 left leg, 3 right leg
function buildChicken(col) {
  const m = new Mesh(512), B = b => { m.m1 = b; m.m2 = b; m.m3 = 0; };
  B(0); m.mat(MAT.PLAIN, col); m.ball(0, 0.21, 0.01, 0.085, 0.085, 0.13, 9, 6); m.ball(0, 0.27, 0.13, 0.05, 0.08, 0.06, 7, 5); m.ball(0, 0.24, -0.02, 0.092, 0.06, 0.1, 8, 5);
  B(1); m.ball(0, 0.335, -0.115, 0.042, 0.06, 0.042, 7, 5); m.ball(0, 0.39, -0.135, 0.036, 0.036, 0.04, 7, 5);
  m.mat(MAT.PLAIN, [0.9, 0.6, 0.15]); m.push().T(0, 0.385, -0.17).RX(-PI / 2); m.lathe([[0.014, 0], [0, 0.04]], 5, 0); m.pop();
  m.mat(MAT.PLAIN, [0.8, 0.12, 0.1]); m.ball(0, 0.43, -0.13, 0.008, 0.02, 0.028, 5, 4); m.ball(0, 0.36, -0.165, 0.008, 0.016, 0.01, 5, 4);
  m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); for (const s of [-1, 1]) m.ball(s * 0.03, 0.398, -0.15, 0.006, 0.006, 0.006, 4, 3);
  m.mat(MAT.PLAIN, [0.85, 0.6, 0.2]); for (const s of [-1, 1]) { B(s < 0 ? 2 : 3); m.box(s * 0.04 - 0.006, 0, -0.006, s * 0.04 + 0.006, 0.15, 0.006); m.box(s * 0.04 - 0.02, 0, -0.045, s * 0.04 + 0.02, 0.008, 0.012); }
  return m;
}

// ── pose engine ──
const POSE = { ang: new Float32Array(33), root: m4.create(), W: [], S: m4.create(), T: m4.create() };
for (let i = 0; i < 11; i++) POSE.W.push(m4.create());
// writes the 11 skinning matrices for an articulated villager into the bone buffer
function poseWrite(slot, root, ang) {
  const W = POSE.W, T = POSE.T, bd = R.boneData;
  for (let b = 0; b < 11; b++) {
    const p = BP[b], J = BJ[b], w = W[b];
    if (p < 0) { m4.copy(w, root); m4.translate(w, J[0], J[1], J[2]); }
    else { const Pj = BJ[p]; m4.copy(w, W[p]); m4.translate(w, J[0] - Pj[0], J[1] - Pj[1], J[2] - Pj[2]); }
    const ax = ang[b * 3], ay = ang[b * 3 + 1], az = ang[b * 3 + 2];
    if (ay) m4.rotY(w, ay); if (ax) m4.rotX(w, ax); if (az) m4.rotZ(w, az);
    m4.copy(T, w); m4.translate(T, -J[0], -J[1], -J[2]);
    bd.set(T, slot * 256 + b * 16);
  }
}
// fill joint angles for an animation; returns vertical root offset
function poseAngles(a, anim, t, speed, look) {
  a.fill(0); let dy = 0;
  const s = Math.sin, c = Math.cos, breathe = s(t * 1.4) * 0.012;
  a[3] = breathe; a[11] = -0.06; a[17] = 0.06; a[12] = 0.12; a[18] = 0.12;        // relaxed arms
  a[7] = look ? look[0] : 0; a[6] = look ? look[1] : 0;
  if (anim === 'walk' || anim === 'run') {
    const A = anim === 'run' ? 0.85 : 0.52, ph = t, sw = s(ph), kn = anim === 'run' ? 1.5 : 1.0;
    a[21] = A * sw; a[27] = -A * sw; a[24] = -kn * Math.max(0, c(ph)) - 0.05; a[30] = -kn * Math.max(0, -c(ph)) - 0.05;
    a[9] = -A * 0.75 * sw; a[15] = A * 0.75 * sw; a[12] = 0.2 + (anim === 'run' ? 0.9 : 0.2 * Math.max(0, -sw)); a[18] = 0.2 + (anim === 'run' ? 0.9 : 0.2 * Math.max(0, sw));
    a[4] = 0.07 * sw; a[1] = -0.05 * sw; a[3] = anim === 'run' ? -0.16 : -0.03; a[7] += -0.04 * sw;
    dy = -0.02 + 0.028 * Math.abs(c(ph));
  } else if (anim === 'sit') {
    a[21] = a[27] = 1.5; a[24] = a[30] = -1.5; a[9] = a[15] = 0.38; a[12] = a[18] = 0.75; a[3] = -0.04 + breathe; a[11] = -0.12; a[17] = 0.12;
  } else if (anim === 'talk') {
    a[15] = 0.35 + 0.15 * s(t * 2.1); a[18] = 1.05 + 0.35 * s(t * 3.3); a[17] = 0.18; a[9] = 0.1; a[12] = 0.5 + 0.2 * s(t * 1.7 + 1); a[6] += 0.05 * s(t * 2.6); a[3] = -0.03 + breathe;
  } else if (anim === 'hammer') {
    const k = (t * 0.9) % 1, up = k < 0.55 ? smooth(0, 0.55, k) : 1 - smooth(0.55, 0.7, k);
    a[15] = 0.5 + 1.5 * up; a[18] = 0.5 + 1.0 * up; a[3] = -0.28 + 0.14 * up; a[9] = 0.5; a[12] = 0.7; a[6] = 0.2; a[0] = 0;
  } else if (anim === 'lute') {
    a[9] = 0.75; a[12] = 1.25; a[11] = -0.45; a[15] = 0.45; a[18] = 1.5 + 0.12 * s(t * 9); a[17] = -0.25; a[4] = 0.06 * s(t * 1.3); a[6] += 0.08 * s(t * 0.9);
  } else if (anim === 'pray') {
    a[9] = a[15] = 0.7; a[12] = a[18] = 1.6; a[11] = 0.35; a[17] = -0.35; a[6] = 0.3; a[3] = -0.08;
  } else if (anim === 'guard') {
    a[15] = 0.28; a[18] = 0.5; a[17] = 0.08; a[3] = breathe * 0.5;
  } else if (anim === 'fish') {
    a[15] = 0.55 + 0.04 * s(t * 0.8); a[18] = 0.7; a[9] = 0.4; a[12] = 0.9; a[11] = 0.25; a[3] = -0.06;
  } else if (anim === 'work') {       // bending to tend plants / sacks
    const k = 0.5 + 0.5 * s(t * 1.1);
    a[3] = -0.25 - 0.45 * k; a[9] = a[15] = 0.5 + 0.7 * k; a[12] = a[18] = 0.4 + 0.3 * s(t * 2.2); a[6] = 0.3 * k; a[21] = a[27] = 0.25 * k; a[24] = a[30] = -0.4 * k; dy = -0.05 * k;
  } else if (anim === 'sweep') {
    a[9] = 0.5; a[15] = 0.7 + 0.25 * s(t * 2.4); a[12] = 0.9; a[18] = 0.6; a[4] = 0.25 * s(t * 2.4); a[3] = -0.15; a[17] = -0.2;
  } else if (anim === 'lie') {
    a[11] = -0.1; a[17] = 0.1; a[6] = -0.1;
  } else if (anim === 'cheer') {
    a[9] = a[15] = 2.6 + 0.3 * s(t * 5); a[11] = -0.3; a[17] = 0.3; a[12] = a[18] = 0.4; dy = 0.03 * Math.abs(s(t * 5));
  }
  return dy;
}
