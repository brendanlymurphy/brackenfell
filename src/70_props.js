// ───────────────────────── world registry helpers + prop library ─────────────────────────
const COL = {
  wood: [0.96, 0.90, 0.83], woodDark: [0.68, 0.61, 0.55], woodPale: [1, 0.98, 0.92], timber: [0.82, 0.77, 0.72], timberDark: [0.62, 0.58, 0.55],
  iron: [0.72, 0.72, 0.76], steel: [1, 1, 1.02], bronze: [1.0, 0.80, 0.45], black: [0.22, 0.21, 0.2],
  linen: [0.92, 0.89, 0.80], wool: [0.78, 0.72, 0.62], red: [0.70, 0.17, 0.13], blue: [0.20, 0.32, 0.60], green: [0.24, 0.46, 0.22], gold: [0.92, 0.72, 0.22],
  purple: [0.42, 0.22, 0.50], clay: [0.74, 0.40, 0.26], wax: [0.95, 0.90, 0.75], hay: [1, 0.95, 0.8], leather: [0.45, 0.28, 0.16], fur: [0.42, 0.32, 0.24],
  bread: [0.62, 0.44, 0.24], cheese: [0.74, 0.62, 0.30], apple: [0.52, 0.13, 0.10], cabbage: [0.34, 0.46, 0.25], glass: [0.35, 0.55, 0.40], parchment: [0.90, 0.82, 0.62],
};
// [c5] medieval dyes: madder, woad, weld, walnut, a little dull green; low saturation (cloth, rugs, blankets)
const DYE = { red: [0.46, 0.23, 0.17], blue: [0.31, 0.38, 0.46], green: [0.34, 0.40, 0.25], purple: [0.38, 0.28, 0.30], yellow: [0.62, 0.52, 0.26], cream: [0.72, 0.67, 0.56], grey: [0.48, 0.46, 0.43], brown: [0.36, 0.27, 0.19] };
// colliders / lights / emitters are registered in world space using the mesh's current matrix
function addBoxCollider(m, x0, z0, x1, z1, y0, y1) {
  const M = m.m, c = m4.tp(M, [(x0 + x1) / 2, y0, (z0 + z1) / 2]), sx = hyp(M[0], M[2]) || 1, sz = hyp(M[8], M[10]) || 1;
  World.colliders.push({ x: c[0], z: c[2], hx: Math.abs(x1 - x0) / 2 * sx, hz: Math.abs(z1 - z0) / 2 * sz, ax: M[0] / sx, az: M[2] / sx, bx: M[8] / sz, bz: M[10] / sz, y0: c[1], y1: c[1] + (y1 - y0) });
}
function addCircleCollider(m, x, z, r, y0, y1) { const c = m4.tp(m.m, [x, y0, z]); World.colliders.push({ x: c[0], z: c[2], r, y0: c[1], y1: c[1] + (y1 - y0) }); }
const flick = (t, s) => 0.86 + 0.09 * Math.sin(t * 11.3 + s * 7.1) + 0.07 * Math.sin(t * 23.7 + s * 3.3) + 0.05 * Math.sin(t * 5.1 + s);
const LIGHT_KINDS = {
  fire: (l, e) => flick(e.time, l.seed),
  candle: (l, e) => e.windowGlow * (0.92 + 0.08 * Math.sin(e.time * 9 + l.seed * 5)),
  lantern: (l, e) => e.windowGlow * (0.94 + 0.06 * Math.sin(e.time * 7 + l.seed * 3)),
  daylight: (l, e) => e.day * 0.9 + 0.03,
  bonfire: (l, e) => (World.bonfire ? 1 : 0) * flick(e.time, l.seed),
};
function addLight(p, r, c, zone, kind) { const l = { p, r, c, zone: zone | 0, seed: World.lights.length * 1.37, kind }; const f = LIGHT_KINDS[kind]; l.power = e => f(l, e); World.lights.push(l); return l; }
const wp = (m, x, y, z) => m4.tp(m.m, [x, y, z]);
// emissive geometry (fire glow, candle wax tips ...): strength in HDR units
const emit = (m, k, fn) => { const a = m.m2, b = m.m3; m.m2 = a | 2; m.m3 = clamp(Math.round(k * 16), 1, 255); fn(); m.m2 = a; m.m3 = b; };
const at = (m, x, y, z, rot, fn) => { m.push().T(x, y, z); if (rot) m.RY(rot); fn(); m.pop(); };

const Props = {
  table(m, len, wid, h) {
    h = h || 0.76; m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, h - 0.06, -wid / 2, len / 2, h, wid / 2);
    m.mat(MAT.TIMBER, COL.wood);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * (len / 2 - 0.13), 0, sz * (wid / 2 - 0.11), 0.09, h - 0.06, 0.09, 12);
    m.box(-len / 2 + 0.13, 0.22, -0.03, len / 2 - 0.13, 0.30, 0.03);
    addBoxCollider(m, -len / 2, -wid / 2, len / 2, wid / 2, 0, h);
  },
  bench(m, len, noCol) {
    m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, 0.41, -0.16, len / 2, 0.46, 0.16);
    m.mat(MAT.TIMBER, COL.wood); for (const sx of [-1, 1]) m.cbox(sx * (len / 2 - 0.18), 0, 0, 0.06, 0.41, 0.28, 12);
    if (!noCol) addBoxCollider(m, -len / 2, -0.16, len / 2, 0.16, 0, 0.46);
  },
  stool(m) { m.mat(MAT.PLANKS, COL.wood); m.cyl(0, 0.40, 0, 0.17, 0.17, 0.05, 10, 3); m.mat(MAT.TIMBER, COL.wood); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; m.beam([Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15], [Math.cos(a) * 0.09, 0.4, Math.sin(a) * 0.09], 0.045, 0.045); } },
  chair(m) {
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.22, 0.42, -0.22, 0.22, 0.46, 0.22);
    m.mat(MAT.TIMBER, COL.wood);
    for (const sx of [-1, 1]) { m.cbox(sx * 0.19, 0, -0.19, 0.045, 0.42, 0.045, 12); m.cbox(sx * 0.19, 0, 0.19, 0.045, 1.0, 0.045, 4); }
    m.box(-0.19, 0.78, 0.17, 0.19, 0.95, 0.20); m.box(-0.19, 0.58, 0.175, 0.19, 0.66, 0.195);
  },
  // bed: head at -z
  bed(m, w, blanket, fur) {
    w = w || 1.0; const L = 2.0;
    m.mat(MAT.TIMBER, COL.woodDark);
    for (const sx of [-1, 1]) { m.cbox(sx * (w / 2), 0, -L / 2, 0.1, 1.0, 0.1, 4); m.cbox(sx * (w / 2), 0, L / 2, 0.1, 0.62, 0.1, 4); }
    m.mat(MAT.PLANKS, COL.woodDark);
    m.box(-w / 2, 0.45, -L / 2 - 0.03, w / 2, 0.95, -L / 2 + 0.03); m.box(-w / 2, 0.3, L / 2 - 0.03, w / 2, 0.56, L / 2 + 0.03);
    for (const sx of [-1, 1]) m.box(sx * w / 2 - 0.025, 0.22, -L / 2, sx * w / 2 + 0.025, 0.42, L / 2);
    m.mat(MAT.CLOTH, COL.linen); m.box(-w / 2 + 0.03, 0.30, -L / 2 + 0.04, w / 2 - 0.03, 0.50, L / 2 - 0.04, 4);
    m.ball(0, 0.56, -L / 2 + 0.28, w * 0.36, 0.07, 0.16, 8, 4);
    m.mat(MAT.CLOTH, blanket || COL.red); m.box(-w / 2 - 0.01, 0.34, -L / 2 + 0.6, w / 2 + 0.01, 0.53, L / 2 - 0.03, 4);
    if (fur) { m.mat(MAT.CLOTH, COL.fur, 0.6); m.box(-w / 2 + 0.06, 0.53, L / 2 - 0.8, w / 2 - 0.06, 0.56, L / 2 - 0.1, 4); }
    addBoxCollider(m, -w / 2, -L / 2, w / 2, L / 2, 0, 0.6);
  },
  chest(m, w) {
    w = w || 0.85; const d = 0.5, lh = 0.16, n = 6;
    m.mat(MAT.PLANKS, COL.woodDark); m.box(-w / 2, 0, -d / 2, w / 2, 0.42, d / 2);
    m.grid(1, n, (i, j) => { const a = j / n * PI; return m.vert((i ? 1 : -1) * w / 2, 0.42 + Math.sin(a) * lh, -Math.cos(a) * d / 2, 0, Math.sin(a) + 0.2, -Math.cos(a), i * w / m.tile, j / n * 0.8 / m.tile); });
    for (const sx of [-1, 1]) { const pts = []; for (let j = 0; j <= n; j++) { const a = j / n * PI; pts.push([sx * w / 2, 0.42 + Math.sin(a) * lh, -Math.cos(a) * d / 2]); } if (sx < 0) pts.reverse(); m.poly(pts); }
    m.mat(MAT.METAL, COL.iron);
    for (const sx of [-0.3, 0.3]) { m.box(sx * w - 0.03, 0, -d / 2 - 0.008, sx * w + 0.03, 0.43, -d / 2); m.box(sx * w - 0.03, 0, d / 2, sx * w + 0.03, 0.43, d / 2 + 0.008); }
    m.box(-0.05, 0.30, -d / 2 - 0.02, 0.05, 0.42, -d / 2);
    addBoxCollider(m, -w / 2, -d / 2, w / 2, d / 2, 0, 0.6);
  },
  barrel(m, r, h, noCol) {
    r = r || 0.33; h = h || 0.9;
    m.mat(MAT.PLANKS, COL.wood, 0.5); m.lathe([[r * 0.84, 0], [r * 0.97, h * 0.25], [r, h * 0.5], [r * 0.97, h * 0.75], [r * 0.84, h]], 12, 0);
    m.disc(0, h - 0.04, 0, r * 0.83, 12, 1);
    m.mat(MAT.METAL, COL.iron); for (const t of [0.12, 0.38, 0.62, 0.88]) { const rr = r * (0.84 + 0.16 * Math.sin(t * PI)) + 0.006; m.lathe([[rr, h * t - 0.025], [rr, h * t + 0.025]], 12, 0); }
    if (!noCol) addCircleCollider(m, 0, 0, r, 0, h);
  },
  keg(m, r, len) { m.push().T(0, r + 0.12, 0).RZ(PI / 2).T(-0, -len / 2, 0); Props.barrel(m, r, len, true); m.disc(0, 0.04, 0, r * 0.83, 12, -1); m.pop();
    m.mat(MAT.TIMBER, COL.wood); for (const s of [-1, 1]) { m.box(s * len * 0.3 - 0.04, 0, -r * 0.8, s * len * 0.3 + 0.04, 0.16, r * 0.8); } },
  crate(m, s, noCol) {
    s = s || 0.6; m.mat(MAT.PLANKS, COL.wood, 0.6); m.box(-s / 2, 0, -s / 2, s / 2, s, s / 2);
    m.mat(MAT.TIMBER, COL.wood); const e = 0.035, o = 0.012;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * (s / 2), 0, sz * (s / 2), e * 2, s + o, e * 2);
    for (const y of [0, s - e]) { m.box(-s / 2 - o, y, -s / 2 - o, s / 2 + o, y + e, -s / 2 + e); m.box(-s / 2 - o, y, s / 2 - e, s / 2 + o, y + e, s / 2 + o); m.box(-s / 2 - o, y, -s / 2, -s / 2 + e, y + e, s / 2); m.box(s / 2 - e, y, -s / 2, s / 2 + o, y + e, s / 2); }
    if (!noCol) addBoxCollider(m, -s / 2, -s / 2, s / 2, s / 2, 0, s);
  },
  sack(m, s, col) { s = s || 0.3; m.mat(MAT.CLOTH, col || COL.wool, 0.6); m.ball(0, s * 0.85, 0, s, s * 0.9, s * 0.8, 8, 6); m.cyl(0, s * 1.6, 0, s * 0.22, s * 0.3, s * 0.3, 6, 2); },
  pot(m, s, col) { s = s || 0.14; m.mat(MAT.PLAIN, col || COL.clay); m.lathe([[s * 0.5, 0], [s, s * 0.7], [s * 0.9, s * 1.5], [s * 0.55, s * 1.9], [s * 0.7, s * 2.1]], 8, 1); },
  jug(m, col) { m.mat(MAT.PLAIN, col || COL.clay); m.lathe([[0.05, 0], [0.085, 0.08], [0.07, 0.18], [0.035, 0.23], [0.045, 0.27]], 8, 1); m.mat(MAT.PLAIN, col || COL.clay); m.beam([0.07, 0.19, 0], [0.11, 0.13, 0], 0.02, 0.02); m.beam([0.11, 0.13, 0], [0.08, 0.07, 0], 0.02, 0.02); },
  bottle(m, col) { m.mat(MAT.PLAIN, col || COL.glass); m.lathe([[0.035, 0], [0.04, 0.02], [0.04, 0.14], [0.014, 0.20], [0.014, 0.27]], 7, 3); },
  mug(m) { m.mat(MAT.PLANKS, COL.wood, 0.3); m.lathe([[0.045, 0], [0.05, 0.12]], 8, 1); m.mat(MAT.PLAIN, [0.3, 0.2, 0.1]); m.disc(0, 0.10, 0, 0.044, 8, 1); m.mat(MAT.METAL, COL.iron); m.lathe([[0.052, 0.09], [0.052, 0.105]], 8, 0); },
  plate(m, col) { m.mat(MAT.PLAIN, col || [0.72, 0.60, 0.42]); m.lathe([[0.07, 0], [0.12, 0.018]], 10, 1); m.disc(0, 0.004, 0, 0.07, 10, 1); },
  bowl(m, col) { m.mat(MAT.PLAIN, col || [0.60, 0.42, 0.26]); m.lathe([[0.04, 0], [0.09, 0.05], [0.10, 0.07]], 9, 1); m.disc(0, 0.045, 0, 0.085, 9, 1); },
  loaf(m) { m.mat(MAT.PLAIN, COL.bread); m.ball(0, 0.045, 0, 0.13, 0.055, 0.08, 8, 5); },
  cheese(m) { m.mat(MAT.PLAIN, COL.cheese); m.cyl(0, 0, 0, 0.12, 0.12, 0.07, 10, 2); },
  apple(m, col) { m.mat(MAT.PLAIN, col || COL.apple); m.ball(0, 0.04, 0, 0.04, 0.04, 0.04, 6, 4); },
  cabbage(m) { m.mat(MAT.PLAIN, COL.cabbage); m.ball(0, 0.09, 0, 0.1, 0.09, 0.1, 7, 5); },
  book(m, col, w) { m.mat(MAT.CLOTH, col || COL.red, 0.5); m.box(-0.09, 0, -0.12, 0.09, w || 0.04, 0.12); m.mat(MAT.PLAIN, COL.parchment); m.box(-0.082, 0.004, -0.115, 0.088, (w || 0.04) - 0.004, 0.118, 4 | 8 | 1); },
  // candle with flame + light. returns nothing; registers emitter
  candle(m, ctx, tall) {
    const h = tall ? 0.22 : 0.10; m.mat(MAT.METAL, COL.bronze); m.lathe([[0.045, 0], [0.012, 0.02], [0.012, 0.035], [0.03, 0.045]], 7, 0);
    m.mat(MAT.PLAIN, COL.wax); m.cyl(0, 0.04, 0, 0.014, 0.012, h, 6, 2);
    const p = wp(m, 0, 0.04 + h + 0.03, 0);
    World.emitters.push({ type: 'candle', p, zone: ctx.zone, always: !!ctx.always });
    if (ctx.candleLight !== false) addLight(wp(m, 0, 0.04 + h + 0.12, 0), 4.2, [1.5, 0.95, 0.42], ctx.zone, 'candle');
  },
  // hanging iron lantern (origin at the hook)
  lantern(m, ctx, kind) {
    m.mat(MAT.METAL, COL.black); m.box(-0.008, -0.16, -0.008, 0.008, 0, 0.008);
    m.lathe([[0.02, -0.19], [0.085, -0.22]], 4, 0); m.lathe([[0.085, -0.44], [0.06, -0.46]], 4, 1);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, x = Math.cos(a) * 0.082, z = Math.sin(a) * 0.082; m.box(x - 0.007, -0.44, z - 0.007, x + 0.007, -0.22, z + 0.007); }
    const p = wp(m, 0, -0.34, 0);
    World.emitters.push({ type: 'lantern', p, zone: ctx.zone });
    addLight(p, ctx.zone ? 6.5 : 9, ctx.zone ? [2.3, 1.35, 0.55] : [3.4, 1.9, 0.75], ctx.zone, kind || 'lantern');
  },
  // open shelf unit against a wall (back at +z), filled by cb(level, y)
  shelf(m, len, h, levels, depth, fill) {
    depth = depth || 0.32; m.mat(MAT.PLANKS, COL.wood);
    for (const sx of [-1, 1]) m.box(sx * len / 2 - 0.025, 0, -depth / 2, sx * len / 2 + 0.025, h, depth / 2);
    for (let i = 0; i <= levels; i++) { const y = 0.08 + (h - 0.12) * i / levels; m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2 + 0.025, y, -depth / 2 + 0.004, len / 2 - 0.025, y + 0.03, depth / 2 - 0.022); if (fill && i < levels) fill(i, y + 0.03); }
    m.mat(MAT.PLANKS, COL.woodDark); m.box(-len / 2 + 0.025, 0.01, depth / 2 - 0.02, len / 2 - 0.025, h - 0.005, depth / 2);
    addBoxCollider(m, -len / 2, -depth / 2, len / 2, depth / 2, 0, h);
  },
  // random tableware along a strip
  clutter(m, R, x0, x1, y, z, kinds, n, ctx) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + 0.5) / n) + R.s() * 0.05, k = R.pick(kinds);
      at(m, x, y, z + R.s() * 0.05, R() * TAU, () => {
        if (k === 'mug') Props.mug(m); else if (k === 'plate') { Props.plate(m); if (R() < 0.6) at(m, 0, 0.01, 0, 0, () => R() < 0.5 ? Props.apple(m) : Props.loaf(m)); }
        else if (k === 'bowl') Props.bowl(m); else if (k === 'loaf') Props.loaf(m); else if (k === 'cheese') Props.cheese(m); else if (k === 'jug') Props.jug(m);
        else if (k === 'bottle') Props.bottle(m, R.pick([COL.glass, [0.45, 0.25, 0.12], [0.2, 0.3, 0.5]])); else if (k === 'pot') Props.pot(m, 0.07 + R() * 0.05, R.pick([COL.clay, [0.55, 0.5, 0.42], [0.3, 0.4, 0.5]]));
        else if (k === 'book') Props.book(m, R.pick([COL.red, COL.blue, COL.green, COL.leather, COL.purple]), 0.03 + R() * 0.03);
        else if (k === 'candle' && ctx) Props.candle(m, ctx, R() < 0.5); else if (k === 'apple') Props.apple(m, R() < 0.5 ? COL.apple : [0.6, 0.7, 0.2]); else if (k === 'cabbage') Props.cabbage(m);
      });
    }
  },
  // woven rug: a darker border, a field of the main colour, a lighter band down the middle and a fringe at both ends
  rug(m, w, l, col) {
    const c = col || COL.red, RL = ((m.rugN = (m.rugN || 0) + 1) % 5) * 0.011, lay = (i, x0, z0, x1, z1, k, y0) => { const y = y0 + RL;          // each rug in a mesh lies a centimetre above the one before (two coplanar rugs flicker)
       m.mat(MAT.CLOTH, [c[0] * k[0], c[1] * k[1], c[2] * k[2]], 0.6); m.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0], 0, 0, (x1 - x0) / 0.6, (z1 - z0) / 0.6); };
    const b = Math.min(0.12, w * 0.09);
    lay(0, -w / 2, -l / 2, w / 2, l / 2, [0.3, 0.27, 0.26], 0.012);
    lay(1, -w / 2 + b, -l / 2 + b, w / 2 - b, l / 2 - b, [0.52, 0.42, 0.38], 0.016);
    if (w > 0.9 && l > 1.2) { lay(2, -w * 0.12, -l / 2 + b * 2, w * 0.12, l / 2 - b * 2, [0.78, 0.62, 0.45], 0.02); lay(3, -w * 0.05, -l / 2 + b * 3, w * 0.05, l / 2 - b * 3, [0.4, 0.3, 0.26], 0.024); }
    for (const sz of [-1, 1]) lay(4, -w / 2 + b * 1.4, sz * (l / 2 - b * 1.4) - 0.015, w / 2 - b * 1.4, sz * (l / 2 - b * 1.4) + 0.015, [0.85, 0.72, 0.52], 0.022);
  },
  cauldron(m, r) { r = r || 0.24; m.mat(MAT.METAL, COL.black); m.lathe([[r * 0.5, 0], [r * 0.95, r * 0.4], [r, r * 0.9], [r * 0.86, r * 1.25], [r * 0.92, r * 1.32]], 10, 1); m.mat(MAT.PLAIN, [0.35, 0.3, 0.18]); m.disc(0, r * 1.1, 0, r * 0.88, 10, 1); },
  logs(m, n, len, r) { m.mat(MAT.BARK, [1, 1, 1], 0.5); for (let i = 0; i < n; i++) { m.push().T(0, r + 0.01, (i - (n - 1) / 2) * r * 2.05).RZ(PI / 2).T(0, -len / 2, 0); m.cyl(0, 0, 0, r, r * 0.95, len, 7, 0); m.mat(MAT.PLAIN, [0.78, 0.62, 0.42]); m.disc(0, len, 0, r * 0.95, 7, 1); m.disc(0, 0, 0, r, 7, -1); m.mat(MAT.BARK, [1, 1, 1], 0.5); m.pop(); } },
  woodpile(m, cols, rows, len) { const r = 0.09; for (let j = 0; j < rows; j++) { m.push().T(0, j * r * 1.85, (j % 2) * r * 0.5); Props.logs(m, cols - (j % 2), len, r); m.pop(); } addBoxCollider(m, -len / 2, -cols * r, len / 2, cols * r, 0, rows * r * 1.9); },
  haybale(m) { m.mat(MAT.THATCH, COL.hay, 0.5); m.push().T(0, 0.45, 0).RZ(PI / 2).T(0, -0.5, 0); m.cyl(0, 0, 0, 0.45, 0.45, 1.0, 12, 3); m.pop(); addBoxCollider(m, -0.5, -0.45, 0.5, 0.45, 0, 0.9); },
  haystack(m, r) { m.mat(MAT.THATCH, COL.hay, 0.8); m.lathe([[r, 0], [r * 1.02, r * 0.5], [r * 0.8, r * 1.1], [r * 0.3, r * 1.6], [0.02, r * 1.8]], 12, 0); addCircleCollider(m, 0, 0, r * 0.9, 0, r * 1.5); },
  wheel(m, r, w) {       // lies in the XY plane, axle along z
    m.mat(MAT.TIMBER, COL.woodDark); m.push().RX(PI / 2).T(0, -w / 2, 0);
    m.lathe([[r - 0.07, 0], [r, 0], [r, w], [r - 0.07, w], [r - 0.07, 0]], 14, 0); m.cyl(0, -0.02, 0, 0.09, 0.09, w + 0.04, 8, 3);
    m.pop(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; m.beam([Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0], [Math.cos(a) * (r - 0.06), Math.sin(a) * (r - 0.06), 0], 0.045, 0.045); }
    m.mat(MAT.METAL, COL.iron); m.push().RX(PI / 2).T(0, -w / 2 - 0.004, 0); m.lathe([[r + 0.006, 0], [r + 0.006, w + 0.008]], 14, 0); m.pop();
  },
  cart(m, hay) {
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.75, 0.62, -1.2, 0.75, 0.70, 1.2);
    for (const sx of [-1, 1]) m.box(sx * 0.75 - 0.03, 0.70, -1.2, sx * 0.75 + 0.03, 1.08, 1.2);
    m.box(-0.75, 0.70, 1.17, 0.75, 1.08, 1.23); m.box(-0.75, 0.70, -1.23, 0.75, 0.95, -1.17);
    m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.9, 0.52, -0.05, 0.9, 0.62, 0.05);
    for (const sx of [-1, 1]) { m.beam([sx * 0.45, 0.6, -1.2], [sx * 0.42, 0.42, -2.9], 0.07, 0.07); at(m, sx * 0.92, 0.57, 0, PI / 2, () => Props.wheel(m, 0.57, 0.09)); }
    if (hay) Props.hayLoad(m, 0.68, 1.12, 0.78, 0.36);
    addBoxCollider(m, -0.95, -1.25, 0.95, 1.25, 0, 1.1);
  },
  // [fx1] a load of loose hay: a shallow mound of overlapping lumps (not one ball) with straw stalks sticking out, in dry golden straw, not the thatch tile's green
  hayLoad(m, hw, hl, y0, hh) {
    const R = rng(Math.round(hw * 977 + hl * 131)), straw = [0.92, 0.76, 0.46];
    m.mat(MAT.THATCH, straw, 0.8);
    for (let i = 0; i < 7; i++) { const u = (i / 6) * 2 - 1, x = u * 0.2 * hw + R.s() * 0.18, z = u * hl * 0.8 + R.s() * 0.12, rx = hw * (0.55 + R() * 0.25), rz = hl * 0.3 + R() * 0.12, ry = hh * (0.55 + 0.4 * (1 - Math.abs(u))); m.ball(x, y0 + ry * 0.35, z, rx, ry, rz, 8, 4); }
    m.mat(MAT.THATCH, [1.0, 0.86, 0.52], 0.6);
    for (let i = 0; i < 26; i++) { const x = R.s() * hw * 0.9, z = R.s() * hl * 0.95, h0 = y0 + hh * (0.5 + R() * 0.45) * (1 - 0.5 * Math.abs(z) / hl); m.beam([x, h0, z], [x + R.s() * 0.22, h0 + 0.06 + R() * 0.16, z + R.s() * 0.22], 0.012, 0.01); }
  },
  // [fx1] a hanging cloth banner, origin at the top centre, hanging down -y, facing +-z: a rod and two cords, the cloth in strips that wave a little (not one flat slab), a darker hem, a swallow-tail
  banner(m, w, h, col, seed) {
    const n = 5, dw = w / n, R = rng(7 + (seed || 0) * 31), f = i => Math.sin(i * 1.7 + (seed || 0)) * 0.03 + R.s() * 0.008;
    m.mat(MAT.TIMBER, COL.timberDark, 0.6); m.box(-w / 2 - 0.07, 0, -0.025, w / 2 + 0.07, 0.05, 0.025, 0);
    for (const sx of [-1, 1]) m.box(sx * (w / 2 - 0.05) - 0.006, 0.05, -0.006, sx * (w / 2 - 0.05) + 0.006, 0.16, 0.006, 0);
    m.mat(MAT.CLOTH, col, 0.5);
    for (let i = 0; i < n; i++) { const x0 = -w / 2 + i * dw, x1 = x0 + dw, tail = h * (i % 2 ? 0.88 : 0.97) * (0.9 + 0.1 * Math.abs(i - n / 2 + 0.5) / (n / 2)); m.quad2([x0, 0, f(i)], [x0, -tail, f(i + 0.5) * 1.6], [x1, -tail, f(i + 1.5) * 1.6], [x1, 0, f(i + 1)], 0, 0, 0.3, 1); }
    m.mat(MAT.CLOTH, col.map(v => v * 0.55), 0.5); m.quad2([-w / 2, -0.04, 0.012], [-w / 2, -0.04 - 0.07, 0.016], [w / 2, -0.04 - 0.07, 0.016], [w / 2, -0.04, 0.012], 0, 0, 1, 0.1);
  },
  fencePost(m, h) { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.1, h + 0.3, 0.1, 4); },
  gravestone(m, R) {
    const h = 0.55 + R() * 0.4, w = 0.42 + R() * 0.16; m.push().RZ(R.s() * 0.08).RX(R.s() * 0.1);
    m.mat(MAT.ROCK, [0.95, 0.95, 0.95], 0.5); m.box(-w / 2, -0.2, -0.06, w / 2, h, 0.06);
    if (R() < 0.6) { m.push().T(0, h, 0).RX(PI / 2).T(0, -0.06, 0); m.cyl(0, 0, 0, w / 2, w / 2, 0.12, 8, 3); m.pop(); } else { m.box(-w / 2 - 0.05, h, -0.07, w / 2 + 0.05, h + 0.09, 0.07); }
    m.pop();
  },
  anvil(m) {
    m.mat(MAT.BARK, [0.8, 0.75, 0.7], 0.7); m.cyl(0, 0, 0, 0.3, 0.27, 0.5, 9, 2);
    m.mat(MAT.METAL, [0.85, 0.85, 0.9]); m.box(-0.16, 0.5, -0.1, 0.16, 0.56, 0.1); m.box(-0.09, 0.56, -0.06, 0.09, 0.68, 0.06); m.box(-0.26, 0.68, -0.085, 0.22, 0.80, 0.085);
    m.push().T(-0.26, 0.74, 0).RZ(PI / 2); m.lathe([[0.06, 0], [0.012, 0.22]], 7, 0); m.pop();
    addCircleCollider(m, 0, 0, 0.32, 0, 0.8);
  },
  hammer(m) { m.mat(MAT.TIMBER, COL.wood); m.box(-0.015, 0, -0.015, 0.015, 0.32, 0.015); m.mat(MAT.METAL, COL.iron); m.box(-0.06, 0.29, -0.03, 0.06, 0.35, 0.03); },
  sword(m) { m.mat(MAT.METAL, COL.steel); m.box(-0.022, 0.16, -0.004, 0.022, 0.92, 0.004); m.poly([[-0.022, 0.92, 0], [0.022, 0.92, 0], [0, 1.0, 0]]); m.poly([[0.022, 0.92, 0], [-0.022, 0.92, 0], [0, 1.0, 0]]); m.mat(MAT.METAL, COL.bronze); m.box(-0.09, 0.14, -0.012, 0.09, 0.165, 0.012); m.mat(MAT.PLAIN, COL.leather); m.box(-0.014, 0, -0.014, 0.014, 0.14, 0.014); },
  shield(m, col) { m.push().RX(PI / 2); m.mat(MAT.PLANKS, col || COL.red, 0.5); m.cyl(0, 0, 0, 0.33, 0.33, 0.03, 12, 3); m.mat(MAT.METAL, COL.iron); m.lathe([[0.335, -0.004], [0.335, 0.034]], 12, 0); m.ball(0, 0.035, 0, 0.07, 0.04, 0.07, 8, 4); m.pop(); },
  signPost(m, n) { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.11, 2.6, 0.11, 4); m.mat(MAT.PLANKS, COL.wood); for (let i = 0; i < n; i++) { m.push().T(0, 2.05 - i * 0.26, 0).RY(i * 1.9 + 0.4); m.box(0.02, 0, -0.015, 0.85, 0.18, 0.015); m.poly([[0.85, 0.18, 0.015], [0.85, 0, 0.015], [0.98, 0.09, 0.015]]); m.poly([[0.85, 0, -0.015], [0.85, 0.18, -0.015], [0.98, 0.09, -0.015]]); m.pop(); } addCircleCollider(m, 0, 0, 0.12, 0, 2.3); },
  // street lantern on a post with a bracket
  lampPost(m, ctx) {
    m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, -0.3, 0, 0.13, 3.3, 0.13, 4); m.beam([0, 2.85, 0], [0.62, 2.85, 0], 0.08, 0.08); m.beam([0, 2.35, 0], [0.42, 2.82, 0], 0.06, 0.06);
    at(m, 0.55, 2.81, 0, 0, () => Props.lantern(m, ctx)); addCircleCollider(m, 0, 0, 0.14, 0, 3);
  },
  // market stall with striped awning; goods callback places wares on the counter (y = 0.8)
  stall(m, col, goods) {
    const w = 2.6, d = 1.5;
    m.mat(MAT.TIMBER, COL.timber);
    for (const sx of [-1, 1]) { m.cbox(sx * w / 2, 0, -d / 2, 0.09, 2.05, 0.09, 4); m.cbox(sx * w / 2, 0, d / 2, 0.09, 2.5, 0.09, 4); m.beam([sx * w / 2, 2.02, -d / 2], [sx * w / 2, 2.47, d / 2], 0.06, 0.07); }
    m.beam([-w / 2, 2.02, -d / 2], [w / 2, 2.02, -d / 2], 0.06, 0.07); m.beam([-w / 2, 2.47, d / 2], [w / 2, 2.47, d / 2], 0.06, 0.07);
    m.mat(MAT.PLANKS, COL.wood); m.box(-w / 2, 0.74, -d / 2, w / 2, 0.80, d / 2 - 0.3); m.box(-w / 2, 0.1, -d / 2 + 0.02, w / 2, 0.74, -d / 2 + 0.05);
    m.mat(MAT.CLOTH, col, 0.9); const e = 0.3;      // Build 42: faded canvas, sagging between the poles, with a patch; one stall is plain cloth
    { const sg = 0.1, xm = 0; m.quad2([-w / 2 - e, 2.56, d / 2 + 0.12], [-w / 2 - e, 1.98, -d / 2 - e], [xm, 1.98 - sg, -d / 2 - e], [xm, 2.56 - sg, d / 2 + 0.12], 0, 0, (w / 2 + e) / 0.9, 2.2);
      m.quad2([xm, 2.56 - sg, d / 2 + 0.12], [xm, 1.98 - sg, -d / 2 - e], [w / 2 + e, 1.98, -d / 2 - e], [w / 2 + e, 2.56, d / 2 + 0.12], 0, 0, (w / 2 + e) / 0.9, 2.2);
      m.mat(MAT.CLOTH, [col[0] * 0.8 + 0.12, col[1] * 0.8 + 0.1, col[2] * 0.8 + 0.06], 0.4); m.quad2([0.35, 2.43 - sg, 0.2], [0.35, 2.14 - sg, -0.35], [0.75, 2.14 - sg, -0.35], [0.75, 2.43 - sg, 0.2]); m.mat(MAT.CLOTH, col, 0.9); }
    m.quad2([-w / 2 - e, 1.98, -d / 2 - e], [-w / 2 - e, 1.78, -d / 2 - e - 0.02], [w / 2 + e, 1.78, -d / 2 - e - 0.02], [w / 2 + e, 1.98, -d / 2 - e], 0, 0, (w + 2 * e) / 0.9, 0.3);
    if (goods) goods(0.80);
    addBoxCollider(m, -w / 2, -d / 2, w / 2, d / 2 - 0.3, 0, 1);
  },
  well(m) {
    m.mat(MAT.STONE, [1, 1, 1], 0.7); m.lathe([[1.0, -0.4], [1.0, 0.85], [0.92, 0.9], [0.72, 0.9], [0.72, -0.4]], 14, 0);
    m.mat(MAT.PLAIN, [0.05, 0.09, 0.10]); m.disc(0, 0.15, 0, 0.72, 14, 1);
    m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) m.cbox(sx * 0.95, 0.6, 0, 0.14, 2.0, 0.14); m.beam([-0.95, 1.9, 0], [0.95, 1.9, 0], 0.1, 0.1);
    m.push().T(0, 1.9, 0).RZ(PI / 2).T(0, -0.6, 0); m.mat(MAT.TIMBER, COL.wood); m.cyl(0, 0, 0, 0.09, 0.09, 1.2, 8, 3); m.pop();
    m.mat(MAT.CLOTH, [0.6, 0.5, 0.35], 0.3); m.box(-0.012, 1.0, -0.012, 0.012, 1.85, 0.012);
    at(m, 0, 0.78, 0, 0, () => { m.mat(MAT.PLANKS, COL.wood, 0.4); m.lathe([[0.12, 0], [0.15, 0.24]], 9, 1); });
    // little shingled roof
    m.mat(MAT.SHINGLE, [0.85, 0.75, 0.65], 0.6);
    m.quad2([1.25, 3.05, 0], [1.25, 2.5, -0.8], [-1.25, 2.5, -0.8], [-1.25, 3.05, 0], 0, 0, 2.5 / 1.2, 1 / 1.2);
    m.quad2([-1.25, 3.05, 0], [-1.25, 2.5, 0.8], [1.25, 2.5, 0.8], [1.25, 3.05, 0], 0, 0, 2.5 / 1.2, 1 / 1.2);
    m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) { m.beam([sx * 0.95, 2.55, -0.7], [sx * 0.95, 3.0, 0], 0.07, 0.08); m.beam([sx * 0.95, 2.55, 0.7], [sx * 0.95, 3.0, 0], 0.07, 0.08); m.beam([sx * 0.95, 2.52, -0.72], [sx * 0.95, 2.52, 0.72], 0.07, 0.08); }
    addCircleCollider(m, 0, 0, 1.05, 0, 1.2);
  },
};
