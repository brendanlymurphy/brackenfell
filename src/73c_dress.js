// ───────────────────────── outdoor dressing: goods, clutter and wall furniture for the alley, the square and the house fronts ─────────────────────────
// Everything here is generated from boxes, prisms and quads (20 to 200 triangles a prop) with the kit's own wood and cloth materials, so
// a hundred props cost a handful of draw calls: they are merged per material per 24 m cell into two batches. `core` is drawn on every
// quality tier; `extra` only where q.scatter is on (medium and up). Nothing here casts into the sun-shadow maps.
const DRS = { core: null, extra: null, placed: [], n: 0, groups: [] };
const DRW = 'MI_WoodTrim', DRC = 'MI_Trim_Cloth';
const DRU = { wood: [0.02, 0.07, 0.62, 0.27], cloth: [0.3, 0.27, 0.55, 0.45] };
// muted palettes (linear-ish tints: the kit materials are already warm and fairly bright)
const DRCOL = {
  wood: [[0.44, 0.34, 0.24], [0.38, 0.30, 0.23], [0.48, 0.38, 0.27], [0.32, 0.26, 0.2], [0.42, 0.36, 0.29]],
  cloth: [[0.46, 0.27, 0.2], [0.5, 0.4, 0.22], [0.24, 0.28, 0.36], [0.5, 0.44, 0.34], [0.28, 0.32, 0.22], [0.36, 0.28, 0.2], [0.34, 0.2, 0.24], [0.44, 0.4, 0.32]].map(c => c.map(v => v * 0.2)),       // [fin] madder, weld, woad, undyed linen, dull green, walnut, a plum, a grey wool; the cloth material still brightens these about 2x
  sack: [[0.26, 0.22, 0.16], [0.22, 0.19, 0.14], [0.28, 0.24, 0.18], [0.19, 0.16, 0.12]],
  straw: [[0.46, 0.36, 0.16], [0.42, 0.34, 0.16], [0.5, 0.4, 0.18]],
  iron: [0.24, 0.22, 0.21],
  clay: [[0.62, 0.38, 0.24], [0.55, 0.34, 0.22], [0.50, 0.40, 0.30], [0.66, 0.46, 0.30]],
};
const dscale = (c, k) => c.map(v => Math.min(1, v * k));
for (const k of ['wood']) DRCOL[k] = DRCOL[k].map(c => c.map(v => Math.min(1, v * 1.7)));      // Build 33: barrels and crates read black beside dark plank walls
DRCOL.sack = DRCOL.sack.map(c => c.map(v => v * 0.6));      // ...and the sacks white

// ── small solids: every function returns a piece name (cached by key), built around the origin, bottom at y = 0 ──
function dPrism(g, mat, uv, x, y, z, r0, r1, h, n, col, capCol, a0, sx, sz) {
  sx = sx || 1; sz = sz || 1; a0 = a0 || 0;
  const P = (i, r, yy) => { const a = a0 + i / n * TAU; return [x + Math.cos(a) * r * sx, yy, z + Math.sin(a) * r * sz]; };
  for (let i = 0; i < n; i++) {
    const b0 = P(i, r0, y), b1 = P(i + 1, r0, y), t0 = P(i, r1, y + h), t1 = P(i + 1, r1, y + h);
    g.quad(mat, b1, b0, t0, t1, col, uv);
    if (capCol) { const c = [x, y + h, z]; g.tri(mat, c, t1, t0, capCol, uv); }
  }
}
function dBarrel(R, k) {
  const key = 'dr_barrel' + k; if (Kit.pieces[key]) return key;
  const g = GP(), r = 0.29 + R() * 0.05, h = 0.78 + R() * 0.14, n = 10, wc = R.pick(DRCOL.wood), ys = [0, 0.22, 0.5, 0.78, 1], rs = [0.86, 0.97, 1, 0.97, 0.86];
  for (let j = 0; j < 4; j++) dPrism(g, DRW, DRU.wood, 0, ys[j] * h, 0, r * rs[j], r * rs[j + 1], (ys[j + 1] - ys[j]) * h, n, wc, j === 3 ? dscale(wc, 0.8) : null);
  for (const yy of [0.1, 0.5, 0.9]) { const j = yy < 0.22 ? 0 : yy < 0.5 ? 1 : yy < 0.78 ? 2 : 3, rr = r * (rs[j] + (rs[j + 1] - rs[j]) * ((yy - ys[j]) / (ys[j + 1] - ys[j]))) + 0.012; dPrism(g, DRW, DRU.wood, 0, yy * h - 0.025, 0, rr, rr, 0.05, n, DRCOL.iron); }
  return g.make(key);
}
function dCrate(R, k) {
  const key = 'dr_crate' + k; if (Kit.pieces[key]) return key;
  const g = GP(), w = 0.5 + R() * 0.22, h = 0.38 + R() * 0.16, d = 0.38 + R() * 0.16, wc = R.pick(DRCOL.wood), dk = dscale(wc, 0.7);
  g.box(DRW, -w / 2, 0.02, -d / 2, w / 2, h, d / 2, wc, DRU.wood);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(DRW, sx * w / 2 - 0.03, 0, sz * d / 2 - 0.03, sx * w / 2 + 0.03, h + 0.015, sz * d / 2 + 0.03, dk, DRU.wood);
  g.box(DRW, -w / 2 - 0.012, h * 0.45, -d / 2 - 0.012, w / 2 + 0.012, h * 0.55, d / 2 + 0.012, dk, DRU.wood);
  return g.make(key);
}
function dSack(R, k) {
  const key = 'dr_sack' + k; if (Kit.pieces[key]) return key;
  const g = GP(), w = 0.24 + R() * 0.07, h = 0.5 + R() * 0.16, n = 8, c = R.pick(DRCOL.sack), ys = [0, 0.3, 0.64, 0.86, 1], rs = [0.62, 0.95, 0.82, 0.4, 0.14];
  const jit = []; for (let i = 0; i < n * 5; i++) jit.push(0.9 + R() * 0.2);
  const P = (i, j) => { const a = i / n * TAU + j * 0.2, r = w * rs[j] * jit[(i % n) * 5 + j] * (j === 0 ? 1 : 1); return [Math.cos(a) * r * 1.2, ys[j] * h + (j === 4 ? 0.04 : 0), Math.sin(a) * r * 0.9]; };
  for (let j = 0; j < 4; j++) for (let i = 0; i < n; i++) g.quad(DRC, P(i + 1, j), P(i, j), P(i, j + 1), P(i + 1, j + 1), dscale(c, 0.92 + (i % 2) * 0.08), DRU.cloth);
  for (let i = 0; i < n; i++) g.tri(DRC, [0, h + 0.07, 0], P(i + 1, 4), P(i, 4), c, DRU.cloth);
  dPrism(g, DRC, DRU.cloth, 0, h * 0.84, 0, w * 0.4, w * 0.38, 0.03, 6, [0.3, 0.26, 0.2]);
  return g.make(key);
}
function dBale(R, k) {
  const key = 'dr_bale' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.straw), w = 0.85, h = 0.44, d = 0.42;
  g.box(DRC, -w / 2, 0.01, -d / 2, w / 2, h, d / 2, c, DRU.cloth);
  for (const x of [-0.22, 0.22]) g.box(DRW, x - 0.012, 0, -d / 2 - 0.01, x + 0.012, h + 0.01, d / 2 + 0.01, [0.3, 0.26, 0.2], DRU.wood);
  for (let i = 0; i < 7; i++) { const x = -0.4 + R() * 0.8, y = 0.08 + R() * 0.3, z = R() < 0.5 ? -d / 2 : d / 2, s = z < 0 ? -1 : 1; g.quad(DRC, [x - 0.01, y, z], [x + 0.01, y, z], [x + 0.06 * R.s(), y + 0.02 - R() * 0.12, z + s * (0.07 + R() * 0.06)], [x + 0.04, y - 0.1, z + s * 0.1], dscale(c, 1.1), DRU.cloth, true); }
  return g.make(key);
}
function dBasket(R, k) {
  const key = 'dr_basket' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = [0.55, 0.42, 0.24], r = 0.17 + R() * 0.05, h = 0.18 + R() * 0.08;
  dPrism(g, DRW, DRU.wood, 0, 0, 0, r * 0.8, r, h, 8, c, null);
  dPrism(g, DRW, DRU.wood, 0, h - 0.015, 0, r + 0.008, r + 0.008, 0.03, 8, dscale(c, 0.75));
  const fill = R.pick([[[0.62, 0.2, 0.14], [0.7, 0.55, 0.16]], [[0.8, 0.45, 0.14], [0.72, 0.5, 0.18]], [[0.4, 0.5, 0.2], [0.5, 0.58, 0.26]], [[0.7, 0.62, 0.46], [0.6, 0.52, 0.38]]]);
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + R(), rr = i ? r * 0.5 : 0, x = Math.cos(a) * rr, z = Math.sin(a) * rr, s = 0.055 + R() * 0.02; g.box(DRC, x - s, h - 0.04, z - s, x + s, h + 0.045 + R() * 0.03, z + s, fill[i % 2], DRU.cloth); }
  return g.make(key);
}
function dPot(R, k) {
  const key = 'dr_pot' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.clay), r = 0.12 + R() * 0.09, h = r * (1.2 + R() * 0.8), ys = [0, 0.3, 0.65, 0.9, 1], rs = [0.55, 0.95, 1, 0.65, 0.7];
  for (let j = 0; j < 4; j++) dPrism(g, DRW, DRU.wood, 0, ys[j] * h, 0, r * rs[j], r * rs[j + 1], (ys[j + 1] - ys[j]) * h, 8, c, null);
  dPrism(g, DRW, DRU.wood, 0, h * 0.995, 0, r * 0.7, r * 0.5, 0.01, 8, [0.12, 0.09, 0.07], [0.1, 0.08, 0.06]);
  return g.make(key);
}
function dBucket(R, k) {
  const key = 'dr_bucket' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.wood), r = 0.16 + R() * 0.04, h = 0.28 + R() * 0.08;
  dPrism(g, DRW, DRU.wood, 0, 0, 0, r * 0.82, r, h, 9, c, null);
  for (const yy of [0.18, 0.78]) dPrism(g, DRW, DRU.wood, 0, h * yy, 0, r * (0.82 + 0.18 * yy) + 0.008, r * (0.82 + 0.18 * yy) + 0.008, 0.025, 9, DRCOL.iron);
  dPrism(g, DRW, DRU.wood, 0, h * 0.985, 0, r * 0.97, r * 0.97, 0.01, 9, [0.1, 0.13, 0.14], [0.1, 0.13, 0.14]);
  g.beam(DRW, [-r, h, 0], [0, h + r * 1.05, 0], 0.008, DRCOL.iron); g.beam(DRW, [0, h + r * 1.05, 0], [r, h, 0], 0.008, DRCOL.iron);
  return g.make(key);
}
function dLogPile(R, k) {      // split firewood stacked against a wall: rows of logs, ends toward the viewer (+z)
  const key = 'dr_logs' + k; if (Kit.pieces[key]) return key;
  const g = GP(), r = 0.07, len = 0.55, c0 = R.pick(DRCOL.wood);
  const rr = (k % 3) + 3;
  for (let j = 0; j < rr; j++) for (let i = 0; i < rr + 2 - j; i++) dLog2(g, (i - (rr + 1 - j) / 2) * r * 2.05 + R.s() * 0.008, r + j * r * 1.8, R.s() * 0.02, len, r * (0.9 + R() * 0.2), dscale(c0, 0.85 + R() * 0.3));
  return g.make(key);
}
function dLog2(g, x, y, z, len, r, col) {      // log along Z, 6-sided
  const n = 6, q = (a, zz) => [x + Math.cos(a) * r, y + Math.sin(a) * r, z + zz];
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; g.quad(DRW, q(a1, -len / 2), q(a1, len / 2), q(a0, len / 2), q(a0, -len / 2), col, DRU.wood); }
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; g.tri(DRW, [x, y, z + len / 2], q(a1, len / 2), q(a0, len / 2), dscale(col, 1.2), DRU.wood); }
}
function dLadder(R, k, h) {      // wall piece: origin at the wall, +z out; leans against the wall with its foot 0.5 m out
  const key = 'dr_ladder' + k; if (Kit.pieces[key]) return key;
  const g = GP(), H = h || 2.6, foot = 0.55 + R() * 0.15, top = 0.07, c = dscale(R.pick(DRCOL.wood), 1.0), n = Math.floor(H / 0.32);
  const ly = H * 0.985, zf = foot;
  for (const x of [-0.24, 0.24]) g.beam(DRW, [x, 0, zf], [x, ly, top], 0.022, c);
  for (let i = 1; i <= n; i++) { const t = i / (n + 0.4), y = ly * t, z = zf + (top - zf) * t; g.beam(DRW, [-0.24, y, z], [0.24, y, z], 0.014, dscale(c, 0.85)); }
  return g.make(key);
}
function dHandcart(R, k) {
  const key = 'dr_cart' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.wood), dk = dscale(c, 0.75), bw = 0.72, bl = 1.05;
  g.box(DRW, -bw / 2, 0.42, -bl / 2, bw / 2, 0.47, bl / 2, c, DRU.wood);                     // bed
  g.box(DRW, -bw / 2 - 0.03, 0.47, -bl / 2, -bw / 2, 0.72, bl / 2, dk, DRU.wood); g.box(DRW, bw / 2, 0.47, -bl / 2, bw / 2 + 0.03, 0.72, bl / 2, dk, DRU.wood);
  g.box(DRW, -bw / 2, 0.47, -bl / 2, bw / 2, 0.7, -bl / 2 + 0.03, dk, DRU.wood);
  for (const s of [-1, 1]) {       // wheel: tyre ring, hub, spokes
    const x = s * (bw / 2 + 0.08), r = 0.33, n = 10; for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU; for (const [dx, col] of [[-0.03, DRCOL.iron], [0.03, DRCOL.iron]]) { }
      const p = (aa, rr, dx) => [x + dx, r + Math.sin(aa) * rr, 0.08 + Math.cos(aa) * rr]; g.quad(DRW, p(b, r, -0.03), p(a, r, -0.03), p(a, r, 0.03), p(b, r, 0.03), DRCOL.iron, DRU.wood); g.quad(DRW, p(a, r - 0.045, -0.03), p(b, r - 0.045, -0.03), p(b, r - 0.045, 0.03), p(a, r - 0.045, 0.03), dk, DRU.wood); if (i % 2 === 0) g.beam(DRW, [x, r, 0.08], [x, r + Math.sin(a) * (r - 0.04), 0.08 + Math.cos(a) * (r - 0.04)], 0.012, dk); }
  }
  g.beam(DRW, [-0.45, 0.33, 0.08], [0.45, 0.33, 0.08], 0.018, dk);
  for (const s of [-1, 1]) { g.beam(DRW, [s * 0.3, 0.45, bl / 2 - 0.1], [s * 0.34, 0.66, bl / 2 + 0.75], 0.025, c); }
  g.beam(DRW, [-0.3, 0.45, -bl / 2 + 0.1], [-0.3, 0.0, -bl / 2 - 0.08], 0.02, dk); g.beam(DRW, [0.3, 0.45, -bl / 2 + 0.1], [0.3, 0.0, -bl / 2 - 0.08], 0.02, dk);
  return g.make(key);
}
function dTrough(R, k) {
  const key = 'dr_trough' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.wood), L = 1.7 + R() * 0.5, w = 0.5, h = 0.5, t = 0.05;
  g.box(DRW, -L / 2, 0.18, -w / 2, L / 2, h, -w / 2 + t, c, DRU.wood); g.box(DRW, -L / 2, 0.18, w / 2 - t, L / 2, h, w / 2, c, DRU.wood);
  g.box(DRW, -L / 2, 0.18, -w / 2, -L / 2 + t, h, w / 2, dscale(c, 0.85), DRU.wood); g.box(DRW, L / 2 - t, 0.18, -w / 2, L / 2, h, w / 2, dscale(c, 0.85), DRU.wood);
  g.box(DRW, -L / 2 + t, 0.18, -w / 2 + t, L / 2 - t, 0.22, w / 2 - t, dscale(c, 0.6), DRU.wood);
  g.quad(DRC, [-L / 2 + t, h - 0.1, w / 2 - t], [L / 2 - t, h - 0.1, w / 2 - t], [L / 2 - t, h - 0.1, -w / 2 + t], [-L / 2 + t, h - 0.1, -w / 2 + t], [0.16, 0.2, 0.2], DRU.cloth);
  for (const x of [-L * 0.38, L * 0.38]) g.box(DRW, x - 0.04, 0, -w / 2 - 0.02, x + 0.04, 0.2, w / 2 + 0.02, dscale(c, 0.7), DRU.wood);
  return g.make(key);
}
function dBench(R, k) {
  const key = 'dr_bench' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.wood), L = 1.5 + R() * 0.4, h = 0.46;
  g.box(DRW, -L / 2, h - 0.05, -0.15, L / 2, h, 0.15, c, DRU.wood);
  for (const x of [-L * 0.4, L * 0.4]) { g.box(DRW, x - 0.04, 0, -0.12, x + 0.04, h - 0.05, 0.12, dscale(c, 0.75), DRU.wood); }
  return g.make(key);
}
function dNoticePost(R) {
  const key = 'dr_notice'; if (Kit.pieces[key]) return key;
  const g = GP(), c = [0.45, 0.37, 0.3];
  g.box(DRW, -0.05, 0, -0.05, 0.05, 2.0, 0.05, c, DRU.wood); g.box(DRW, -0.3, 1.35, 0.05, 0.3, 1.85, 0.08, dscale(c, 1.1), DRU.wood);
  g.quad(DRW, [-0.34, 1.9, 0.0], [0.34, 1.9, 0.0], [0.3, 1.82, 0.16], [-0.3, 1.82, 0.16], dscale(c, 0.7), DRU.wood, true);
  for (const [x, y, w, h] of [[-0.22, 1.55, 0.16, 0.2], [0.02, 1.45, 0.14, 0.24], [0.1, 1.68, 0.15, 0.13], [-0.18, 1.4, 0.1, 0.12]]) g.quad(DRC, [x, y, 0.09], [x + w, y, 0.09], [x + w, y + h, 0.09], [x, y + h, 0.09], [0.78, 0.72, 0.58], DRU.cloth);
  return g.make(key);
}
function dBolts(R, k) {      // rolls of cloth lying in a stack on a counter
  const key = 'dr_bolts' + k; if (Kit.pieces[key]) return key;
  const g = GP(), r = 0.075;
  const row = (n, y, x0) => { for (let i = 0; i < n; i++) { const c = R.pick(DRCOL.cloth); dLogCloth(g, x0 + i * r * 2.05, y, 0, 0.5, r, c); } };
  row(3, r, -r * 2.05); row(2, r * 2.7, -r * 1.0); row(1, r * 4.4, 0);
  { const c = R.pick(DRCOL.cloth); g.quad(DRC, [-r * 2.2, r * 1.8, 0.24], [r * 2.4, r * 1.8, 0.24], [r * 2.5, 0.0, 0.46], [-r * 2.1, 0.0, 0.48], dscale(c, 0.95), DRU.cloth, true); }       // a length unrolled and let fall over the counter edge
  return g.make(key);
}
function dLogCloth(g, x, y, z, len, r, col) {
  const n = 7, q = (a, zz) => [x + Math.cos(a) * r, y + Math.sin(a) * r, z + zz];
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, wv = 0.88 + 0.16 * ((i * 7 + Math.round(x * 50)) % 3) / 2; g.quad(DRC, q(a1, -len / 2), q(a1, len / 2), q(a0, len / 2), q(a0, -len / 2), dscale(col, wv), DRU.cloth); }
  for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; g.tri(DRC, [x, y, z + len / 2], q(a1, len / 2), q(a0, len / 2), dscale(col, 0.78), DRU.cloth); g.tri(DRC, [x, y, z - len / 2], q(a0, -len / 2), q(a1, -len / 2), dscale(col, 0.78), DRU.cloth); }
}
function dLoaves(R, k) {      // a board of bread: loaves, rolls and a cheese wheel
  const key = 'dr_loaves' + k; if (Kit.pieces[key]) return key;
  const g = GP();
  g.box(DRW, -0.38, 0, -0.2, 0.38, 0.025, 0.2, [0.5, 0.4, 0.3], DRU.wood);
  for (let i = 0; i < 5; i++) { const x = -0.32 + (i % 3) * 0.24 + R.s() * 0.02, z = -0.09 + Math.floor(i / 3) * 0.19, L = 0.1 + R() * 0.03, c = [0.66 + R() * 0.08, 0.46 + R() * 0.06, 0.24]; g.box(DRC, x - L, 0.025, z - 0.045, x + L, 0.075, z + 0.045, c, DRU.cloth); g.box(DRC, x - L + 0.02, 0.075, z - 0.035, x + L - 0.02, 0.098, z + 0.035, dscale(c, 1.06), DRU.cloth); }
  if (k % 2) dPrism(g, DRC, DRU.cloth, 0.28, 0.025, 0.12, 0.09, 0.09, 0.06, 8, [0.56, 0.46, 0.26], [0.6, 0.5, 0.3]);
  return g.make(key);
}
function dHangMeat(R, k) {      // a pole of hams and sausage ropes (origin at the pole's centre, hanging down)
  const key = 'dr_meat' + k; if (Kit.pieces[key]) return key;
  const g = GP();
  g.box(DRW, -0.55, -0.02, -0.02, 0.55, 0.02, 0.02, [0.35, 0.3, 0.25], DRU.wood);
  for (let i = 0; i < 4; i++) { const x = -0.42 + i * 0.28 + R.s() * 0.03, L = 0.26 + R() * 0.1, c = R.pick([[0.52, 0.24, 0.18], [0.46, 0.2, 0.16], [0.58, 0.32, 0.22]]);
    g.beam(DRW, [x, -0.02, 0], [x, -0.1, 0], 0.004, [0.3, 0.26, 0.2]);
    g.quad(DRC, [x - 0.03, -0.1, 0], [x + 0.03, -0.1, 0], [x + 0.07, -0.1 - L * 0.55, 0.03], [x - 0.07, -0.1 - L * 0.55, -0.03], c, DRU.cloth, true);
    g.quad(DRC, [x - 0.07, -0.1 - L * 0.55, -0.03], [x + 0.07, -0.1 - L * 0.55, 0.03], [x + 0.02, -0.1 - L, 0.0], [x - 0.02, -0.1 - L, 0.0], dscale(c, 0.85), DRU.cloth, true); }
  return g.make(key);
}
function dHangFish(R, k) {
  const key = 'dr_fish' + k; if (Kit.pieces[key]) return key;
  const g = GP();
  g.box(DRW, -0.5, -0.02, -0.02, 0.5, 0.02, 0.02, [0.35, 0.3, 0.25], DRU.wood);
  for (let i = 0; i < 6; i++) { const x = -0.42 + i * 0.17 + R.s() * 0.02, L = 0.2 + R() * 0.08, c = R.pick([[0.55, 0.58, 0.6], [0.45, 0.5, 0.52], [0.6, 0.55, 0.48]]);
    g.quad(DRC, [x, -0.04, 0], [x + 0.001, -0.04, 0], [x + 0.045, -0.04 - L * 0.6, 0.0], [x - 0.045, -0.04 - L * 0.6, 0.0], c, DRU.cloth, true);
    g.tri(DRC, [x - 0.045, -0.04 - L * 0.6, 0], [x + 0.045, -0.04 - L * 0.6, 0], [x, -0.04 - L, 0], dscale(c, 0.8), DRU.cloth, true); }
  return g.make(key);
}
function dLaundry(a, b, R, cols) {      // world-space line with cloths: a, b are world points; cloths hang from the line
  const g = GP(), n = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.7)), sag = 0.12;
  const pt = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  for (let i = 0; i < 6; i++) g.beam(DRW, pt(i / 6), pt((i + 1) / 6), 0.006, [0.4, 0.34, 0.26]);
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.15 + R() * 0.1) / n, t1 = (i + 0.85 - R() * 0.1) / n, p0 = pt(t0), p1 = pt(t1), hgt = 0.45 + R() * 0.55, c = R.pick(cols), w = hgt > 0.8 ? 0.5 : 1;
    const sway = R.s() * 0.05;
    g.quad(DRC, [p0[0], p0[1] - 0.01, p0[2]], [p1[0], p1[1] - 0.01, p1[2]], [p1[0] + sway - uz * 0.04, p1[1] - hgt, p1[2] + ux * 0.04], [p0[0] + sway + uz * 0.04, p0[1] - hgt * (0.9 + R() * 0.1), p0[2] - ux * 0.04], c, DRU.cloth, true);
  }
  return g.make('dr_laundry' + (DRS.n++));
}
function dTuftPiece(R, k, tall) {      // a tuft of weeds: crossed blades
  const key = 'dr_tuft' + k + (tall ? 't' : ''); if (Kit.pieces[key]) return key;
  const g = GP(), n = tall ? 7 : 5, c = R.pick([[0.3, 0.38, 0.16], [0.36, 0.42, 0.2], [0.42, 0.4, 0.2], [0.28, 0.34, 0.15]]);
  for (let i = 0; i < n; i++) { const a = R() * TAU, h = (tall ? 0.3 : 0.16) + R() * (tall ? 0.22 : 0.12), lean = 0.1 + R() * 0.12, w = 0.016, cx = Math.cos(a), cz = Math.sin(a), x0 = R.s() * 0.04, z0 = R.s() * 0.04;
    g.tri(DRC, [x0 - cz * w, 0, z0 + cx * w], [x0 + cz * w, 0, z0 - cx * w], [x0 + cx * lean, h, z0 + cz * lean], dscale(c, 0.8 + R() * 0.4), DRU.cloth, true); }
  return g.make(key);
}
function dLeafPiece(R, k) {      // a drift of fallen leaves: flat flecks
  const key = 'dr_leaves' + k; if (Kit.pieces[key]) return key;
  const g = GP(), cols = [[0.45, 0.3, 0.14], [0.52, 0.38, 0.16], [0.36, 0.24, 0.12], [0.5, 0.26, 0.12], [0.42, 0.38, 0.16]];
  for (let i = 0; i < 16; i++) { const rr = Math.pow(R(), 0.8) * 0.5, a = R() * TAU, x = Math.cos(a) * rr, z = Math.sin(a) * rr, s = 0.035 + R() * 0.03, t = R() * TAU, y = 0.006 + R() * 0.012;
    g.quad(DRC, [x + Math.cos(t) * s, y, z + Math.sin(t) * s], [x - Math.sin(t) * s * 0.6, y + 0.01, z + Math.cos(t) * s * 0.6], [x - Math.cos(t) * s, y, z - Math.sin(t) * s], [x + Math.sin(t) * s * 0.6, y + 0.005, z - Math.cos(t) * s * 0.6], R.pick(cols), DRU.cloth, true); }
  return g.make(key);
}
function dStrawPiece(R, k) {      // straw scattered on the ground: thin crossing blades
  const key = 'dr_straw' + k; if (Kit.pieces[key]) return key;
  const g = GP();
  for (let i = 0; i < 22; i++) { const rr = Math.pow(R(), 0.7) * 0.55, a = R() * TAU, x = Math.cos(a) * rr, z = Math.sin(a) * rr, t = R() * TAU, L = 0.1 + R() * 0.14, y = 0.004 + R() * 0.02, c = R.pick(DRCOL.straw);
    g.quad(DRC, [x, y, z], [x + Math.cos(t) * L, y + 0.01, z + Math.sin(t) * L], [x + Math.cos(t) * L - Math.sin(t) * 0.012, y + 0.01, z + Math.sin(t) * L + Math.cos(t) * 0.012], [x - Math.sin(t) * 0.012, y, z + Math.cos(t) * 0.012], dscale(c, 0.9 + R() * 0.3), DRU.cloth, true); }
  return g.make(key);
}
function dChips(R, k) {      // wood chips and a few bark pieces
  const key = 'dr_chips' + k; if (Kit.pieces[key]) return key;
  const g = GP();
  for (let i = 0; i < 14; i++) { const rr = Math.pow(R(), 0.8) * 0.5, a = R() * TAU, x = Math.cos(a) * rr, z = Math.sin(a) * rr, t = R() * TAU, s = 0.02 + R() * 0.03, y = 0.008 + R() * 0.012, c = dscale(R.pick(DRCOL.wood), 1.05 + R() * 0.15);
    g.quad(DRW, [x + Math.cos(t) * s * 1.6, y, z + Math.sin(t) * s * 1.6], [x - Math.sin(t) * s * 0.5, y + 0.01, z + Math.cos(t) * s * 0.5], [x - Math.cos(t) * s * 1.6, y, z - Math.sin(t) * s * 1.6], [x + Math.sin(t) * s * 0.5, y, z - Math.cos(t) * s * 0.5], c, DRU.wood, true); }
  return g.make(key);
}
function dStone(R, k) {      // a pebble or small flat stone, 8 triangles
  const key = 'dr_stone' + k; if (Kit.pieces[key]) return key;
  const g = GP(), s = 0.05 + R() * 0.07, h = s * (0.4 + R() * 0.5), c = [0.45 + R() * 0.1, 0.44 + R() * 0.08, 0.4 + R() * 0.06], n = 5, a0 = R() * TAU;
  const P = (i, r, y) => { const a = a0 + i / n * TAU; return [Math.cos(a) * r * (1 + (i % 2) * 0.25), y, Math.sin(a) * r * (0.8 + (i % 3) * 0.12)]; };
  for (let i = 0; i < n; i++) { g.quad(DRW, P(i + 1, s, 0), P(i, s, 0), P(i, s * 0.7, h * 0.7), P(i + 1, s * 0.7, h * 0.7), c, DRU.wood); g.tri(DRW, [0, h, 0], P(i + 1, s * 0.7, h * 0.7), P(i, s * 0.7, h * 0.7), dscale(c, 1.1), DRU.wood); }
  return g.make(key);
}
function dManure(R, k) {
  const key = 'dr_manure' + k; if (Kit.pieces[key]) return key;
  const g = GP();
  for (let i = 0; i < 4; i++) { const x = R.s() * 0.18, z = R.s() * 0.18, s = 0.06 + R() * 0.05, c = [0.22 + R() * 0.06, 0.17 + R() * 0.04, 0.1]; dPrism(g, DRW, DRU.wood, x, 0, z, s, s * 0.6, s * 0.7, 6, c, dscale(c, 0.9)); }
  return g.make(key);
}
function dBroom(R, k) {      // leaning against a wall: wall piece (origin at the wall, +z out)
  const key = 'dr_broom' + k; if (Kit.pieces[key]) return key;
  const g = GP(), L = 1.5, lean = 0.28;
  g.beam(DRW, [0, 0.0, 0.1 + lean], [0, L, 0.06], 0.012, [0.42, 0.34, 0.24]);
  for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 0.02, c = dscale(R.pick(DRCOL.straw), 0.9); g.tri(DRC, [x - 0.01, 0.38, 0.1 + lean * 0.75], [x + 0.01, 0.38, 0.1 + lean * 0.75], [x * 2.2, 0.0, 0.1 + lean + 0.02], c, DRU.cloth, true); }
  g.box(DRW, -0.03, 0.36, 0.1 + lean * 0.75 - 0.03, 0.03, 0.42, 0.1 + lean * 0.75 + 0.03, [0.3, 0.26, 0.2], DRU.wood);
  return g.make(key);
}
function dToolRack(R, k) {      // wall piece: a rail on the wall with a spade, a hoe, a rake hanging from it
  const key = 'dr_tools' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = [0.4, 0.33, 0.26], iron = DRCOL.iron;
  g.box(DRW, -0.6, 1.55, 0.0, 0.6, 1.6, 0.05, c, DRU.wood);
  let x = -0.45;
  for (const t of ['spade', 'hoe', 'rake', 'scythe'].slice(0, 3 + (k % 2))) {
    g.beam(DRW, [x, 0.55, 0.07], [x, 1.58, 0.07], 0.012, [0.46, 0.38, 0.28]);
    if (t === 'spade') g.box(DRW, x - 0.09, 0.4, 0.06, x + 0.09, 0.62, 0.08, iron, DRU.wood);
    else if (t === 'hoe') g.box(DRW, x - 0.01, 0.5, 0.06, x + 0.14, 0.56, 0.08, iron, DRU.wood);
    else if (t === 'rake') { g.box(DRW, x - 0.12, 0.52, 0.06, x + 0.12, 0.56, 0.08, iron, DRU.wood); for (let i = 0; i < 5; i++) g.box(DRW, x - 0.11 + i * 0.055, 0.44, 0.06, x - 0.1 + i * 0.055, 0.52, 0.075, iron, DRU.wood); }
    else { g.beam(DRW, [x, 0.55, 0.07], [x + 0.5, 0.45, 0.07], 0.006, iron); }
    x += 0.28;
  }
  return g.make(key);
}
function dFlowerPot(R, k) {
  const key = 'dr_fpot' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.clay), r = 0.12 + R() * 0.04, h = 0.2;
  dPrism(g, DRW, DRU.wood, 0, 0, 0, r * 0.65, r, h, 8, c, [0.18, 0.12, 0.08]);
  const fl = R.pick([[0.7, 0.28, 0.3], [0.85, 0.75, 0.3], [0.8, 0.78, 0.72], [0.55, 0.35, 0.62], [0.82, 0.5, 0.25]]);
  for (let i = 0; i < 5; i++) { const a = i * 1.26, rr = r * 0.4, x = Math.cos(a) * rr, z = Math.sin(a) * rr, hh = 0.14 + R() * 0.12; g.box(DRC, x - 0.03, h, z - 0.03, x + 0.03, h + hh * 0.7, z + 0.03, [0.26, 0.34, 0.14], DRU.cloth); g.box(DRC, x - 0.045, h + hh * 0.6, z - 0.045, x + 0.045, h + hh, z + 0.045, fl, DRU.cloth); }
  return g.make(key);
}
function dFence(R, k) {      // 2 m of split-rail yard fence
  const key = 'dr_fence' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = R.pick(DRCOL.wood);
  for (const x of [-1, 0, 1]) g.box(DRW, x - 0.045, -0.15, -0.045, x + 0.045, 0.95 - R() * 0.1, 0.045, dscale(c, 0.8), DRU.wood);
  for (const y of [0.4, 0.78]) g.beam(DRW, [-1, y + R.s() * 0.02, 0.06], [1, y + R.s() * 0.02, 0.06], 0.03, c);
  return g.make(key);
}
function dStall(kind, R, cols) {      // a market stall: four posts, a counter, a striped canopy, and its goods (origin at the middle of the counter's ground line, front toward +z)
  const key = 'dr_stall' + (DRS.n++);
  const g = GP(), w = 2.4, d = 1.4, c = DRCOL.wood[1], dk = dscale(c, 0.75);
  for (const sx of [-1, 1]) { g.box(DRW, sx * w / 2 - 0.04, 0, -d / 2 - 0.04, sx * w / 2 + 0.04, 2.15, -d / 2 + 0.04, dk, DRU.wood); g.box(DRW, sx * w / 2 - 0.04, 0, d / 2 - 0.04, sx * w / 2 + 0.04, 1.8, d / 2 + 0.04, dk, DRU.wood); }
  g.box(DRW, -w / 2, 0.82, -d / 2 + 0.05, w / 2, 0.87, d / 2, c, DRU.wood); g.box(DRW, -w / 2, 0.1, d / 2 - 0.06, w / 2, 0.82, d / 2 - 0.02, dscale(c, 0.9), DRU.wood);
  g.box(DRW, -w / 2, 0.15, -d / 2 + 0.05, w / 2, 0.19, d / 2 - 0.08, dscale(c, 0.8), DRU.wood);
  g.box(DRW, -w / 2 - 0.02, 2.1, -d / 2 - 0.03, w / 2 + 0.02, 2.17, -d / 2 + 0.04, dk, DRU.wood);
  const n = 8, sw = (w + 0.5) / n, y0 = 2.14, y1 = 1.78, z0 = -d / 2 - 0.15, z1 = d / 2 + 0.3;       // canopy slopes down toward the front (+z)
  for (let i = 0; i < n; i++) { const x0 = -w / 2 - 0.25 + i * sw, x1 = x0 + sw, c1 = i % 2 ? cols[1] : cols[0]; g.quad(DRC, [x0, y0 + 0.2, z0], [x1, y0 + 0.2, z0], [x1, y1, z1], [x0, y1, z1], c1, DRU.cloth, true); g.quad(DRC, [x0, y1, z1], [x1, y1, z1], [x1, y1 - 0.16, z1 + 0.02], [x0, y1 - 0.16, z1 + 0.02], c1, DRU.cloth, true); }
  const goods = {
    greens: () => { const ks = [[[0.5, 0.3, 0.14], [0.5, 0.48, 0.2], [0.44, 0.26, 0.12]], [[0.56, 0.36, 0.14], [0.48, 0.34, 0.16]], [[0.3, 0.4, 0.2], [0.36, 0.44, 0.22], [0.26, 0.34, 0.18]]]; for (let i = 0; i < 3; i++) putPart(g, genProduce(ks[i], R), -0.78 + i * 0.78, 0.87, -0.1, 1.0, R.s() * 0.2); putPart(g, dBasket(R, 'g' + DRS.n), 0.95, 0, 0.45, 1.1, 0); putPart(g, dSack(R, 'a' + DRS.n), -1.0, 0, 0.55, 1.0, 0); putPart(g, dSack(R, 'b' + DRS.n), -0.72, 0, 0.62, 0.9, 1); },
    bread: () => { for (let i = 0; i < 3; i++) putPart(g, dLoaves(R, i), -0.75 + i * 0.75, 0.87, -0.1, 1.0, R.s() * 0.15); putPart(g, dBasket(R, 'p' + DRS.n), 0.9, 0.87, 0.3, 1.0, 0); putPart(g, dPot(R, 'j' + DRS.n), -1.05, 0.87, 0.35, 0.9, 0); putPart(g, dSack(R, 'c' + DRS.n), 1.05, 0, 0.55, 1.1, 0.4); },
    cloth: () => { for (let i = 0; i < 3; i++) putPart(g, dBolts(R, i), -0.75 + i * 0.75, 0.87, -0.12, 1.0, R.s() * 0.1 + PI / 2 * 0); for (let i = 0; i < 4; i++) { const c = R.pick(DRCOL.cloth), x = -0.9 + i * 0.6, L = 0.6 + R() * 0.4; g.quad(DRC, [x, 2.05, -d / 2 + 0.12], [x + 0.4, 2.05, -d / 2 + 0.12], [x + 0.42, 2.05 - L, -d / 2 + 0.13], [x + 0.02, 2.05 - L * (0.9 + R() * 0.1), -d / 2 + 0.13], c, DRU.cloth, true); } },
    pots: () => { for (let i = 0; i < 6; i++) putPart(g, dPot(R, 's' + DRS.n + i), -0.9 + i * 0.36, 0.87, -0.15 + (i % 2) * 0.28, 0.8 + R() * 0.4, 0); for (let i = 0; i < 3; i++) putPart(g, dPot(R, 'f' + DRS.n + i), -1.0 + i * 0.5, 0, 0.62 + R() * 0.1, 1.5 + R() * 0.5, 0); putPart(g, dBucket(R, 'q' + DRS.n), 1.05, 0, 0.6, 1.0, 0); },
    fish: () => { putPart(g, dHangFish(R, 0), -0.55, 2.0, -d / 2 + 0.15, 1.0, 0); putPart(g, dHangFish(R, 1), 0.55, 2.0, -d / 2 + 0.15, 1.0, 0); for (let i = 0; i < 4; i++) { const x = -0.9 + i * 0.6, c = R.pick([[0.55, 0.58, 0.6], [0.46, 0.5, 0.52]]); g.box(DRC, x - 0.2, 0.87, -0.12, x + 0.2, 0.93, 0.12, c, DRU.cloth); g.box(DRC, x - 0.18, 0.93, -0.1, x + 0.1, 0.96, 0.08, dscale(c, 1.15), DRU.cloth); } putPart(g, dBucket(R, 'w' + DRS.n), 1.05, 0, 0.55, 1.1, 0); putPart(g, dBarrel(R, 'f' + DRS.n), -1.1, 0, 0.6, 0.9, 0); },
    meat: () => { putPart(g, dHangMeat(R, 0), -0.5, 2.05, -d / 2 + 0.2, 1.0, 0); putPart(g, dHangMeat(R, 1), 0.55, 2.05, -d / 2 + 0.2, 1.0, 0); for (let i = 0; i < 3; i++) g.box(DRC, -0.7 + i * 0.6, 0.87, -0.08, -0.35 + i * 0.6, 0.95, 0.12, R.pick([[0.55, 0.24, 0.2], [0.5, 0.3, 0.24]]), DRU.cloth); putPart(g, dCrate(R, 'm' + DRS.n), 1.05, 0, 0.5, 1.0, 0.3); },
  }[kind]; goods();
  return g.make(key);
}
// copy one generated piece's geometry into another builder, transformed (so a stall is one piece)
function putPart(g, name, x, y, z, s, ry) {
  const P = Kit.pieces[name]; if (!P) return; const c = Math.cos(ry || 0), sn = Math.sin(ry || 0);
  for (const pr of P.prims) {
    const p = g._prim(pr.mat), b0 = p.pos.length / 3;
    for (let i = 0; i < pr.n; i++) { const px = pr.pos[i * 3] * s, py = pr.pos[i * 3 + 1] * s, pz = pr.pos[i * 3 + 2] * s, nx = pr.nrm[i * 3], nz = pr.nrm[i * 3 + 2]; p.pos.push(x + px * c + pz * sn, y + py, z - px * sn + pz * c); p.nrm.push(nx * c + nz * sn, pr.nrm[i * 3 + 1], -nx * sn + nz * c); p.uv.push(pr.uv[i * 2], pr.uv[i * 2 + 1]); p.col.push(pr.col[i * 3], pr.col[i * 3 + 1], pr.col[i * 3 + 2]); }
    for (let i = 0; i < pr.idx.length; i++) p.idx.push(pr.idx[i] + b0);
  }
}


function dShrine(R) {
  const key = 'dr_shrine'; if (Kit.pieces[key]) return key;
  const g = GP(), st = [0.42, 0.41, 0.38], wd = [0.36, 0.29, 0.22];
  g.box(DRW, -0.35, 0, -0.3, 0.35, 0.18, 0.3, st, DRU.wood); g.box(DRW, -0.26, 0.18, -0.2, 0.26, 0.95, 0.2, dscale(st, 1.08), DRU.wood);
  g.box(DRW, -0.17, 0.62, 0.2, 0.17, 0.82, 0.215, [0.08, 0.07, 0.06], DRU.wood);                       // the niche
  g.quad(DRC, [-0.12, 0.64, 0.21], [0.12, 0.64, 0.21], [0.12, 0.7, 0.21], [-0.12, 0.7, 0.21], [0.85, 0.6, 0.3], DRU.cloth);
  g.quad(DRW, [-0.4, 0.93, 0.28], [0.4, 0.93, 0.28], [0.4, 1.12, 0], [-0.4, 1.12, 0], wd, DRU.wood, true); g.quad(DRW, [0.4, 0.93, -0.28], [-0.4, 0.93, -0.28], [-0.4, 1.12, 0], [0.4, 1.12, 0], wd, DRU.wood, true);
  g.box(DRW, -0.012, 1.1, -0.012, 0.012, 1.3, 0.012, wd, DRU.wood); g.box(DRW, -0.07, 1.2, -0.012, 0.07, 1.23, 0.012, wd, DRU.wood);
  return g.make(key);
}
function dMilestone(R, k) {
  const key = 'dr_mile' + k; if (Kit.pieces[key]) return key;
  const g = GP(), c = [0.44 + R() * 0.05, 0.43, 0.4];
  g.box(DRW, -0.17, -0.1, -0.1, 0.17, 0.5 + R() * 0.12, 0.1, c, DRU.wood); g.quad(DRW, [-0.17, 0.62, 0.1], [0.17, 0.62, 0.1], [0.17, 0.62, -0.1], [-0.17, 0.62, -0.1], dscale(c, 1.1), DRU.wood);
  return g.make(key);
}
function dBoat(R) {
  const key = 'dr_boat'; if (Kit.pieces[key]) return key;
  const g = GP(), c = [0.5, 0.43, 0.35], L = 1.7, W = 0.62, H = 0.42;          // [fx1] weathered grey-brown with strakes and a gunwale (it was one black plank-less hull)
  const P = (u, v, y) => [v * W * (1 - 0.65 * Math.pow(Math.abs(u), 2.2)), y, u * L];
  const N = 8; for (let i = 0; i < N; i++) { const u0 = i / N * 2 - 1, u1 = (i + 1) / N * 2 - 1;
    for (const s of [-1, 1]) { const a = P(u0, s, H * (0.45 + 0.55 * u0 * u0)), b = P(u1, s, H * (0.45 + 0.55 * u1 * u1)), c0 = P(u0, s * 0.45, 0.04), c1 = P(u1, s * 0.45, 0.04); if (s > 0) g.quad(DRW, c0, c1, b, a, c, DRU.wood, true); else g.quad(DRW, c1, c0, a, b, c, DRU.wood, true); }
    g.quad(DRW, P(u0, 0.45, 0.04), P(u1, 0.45, 0.04), P(u1, -0.45, 0.04), P(u0, -0.45, 0.04), dscale(c, 0.8), DRU.wood, true); }
  for (const s of [-1, 1]) for (const f of [0.34, 0.67, 1.0]) for (let i = 0; i < N; i++) { const u0 = i / N * 2 - 1, u1 = (i + 1) / N * 2 - 1, q = u => P(u, s * (0.45 + 0.55 * f) * 1.012, 0.04 + (H * (0.45 + 0.55 * u * u) - 0.04) * f); g.beam(DRW, q(u0), q(u1), f === 1 ? 0.022 : 0.012, f === 1 ? dscale(c, 0.8) : dscale(c, 0.55)); }
  for (const z of [-0.6, 0.35]) g.box(DRW, -0.5 * W, H * 0.62, z - 0.07, 0.5 * W, H * 0.67, z + 0.07, dscale(c, 1.2), DRU.wood);
  return g.make(key);
}
function dNet(R) {      // Build 33: a diamond-mesh net of thin cords and knots (see-through), hung from a rail between two posts with a catenary sag and a billow
  const key = 'dr_net'; if (Kit.pieces[key]) return key;
  const g = GP(), cord = [0.14, 0.13, 0.1], knot = [0.1, 0.09, 0.07], W = 1.0, Hn = 1.05, mx = 0.1, my = 0.1, top = 1.55;
  const S = (X, Y) => { const k = Y / Hn, e = 1 - (X / W) * (X / W); return [X * (1 - 0.06 * k), top - Y + 0.12 * e * k * k * 0 - 0.1 * e * k, 0.05 + 0.1 * Math.sin(Math.PI * Math.min(1, k * 0.9)) * e + 0.02 * Math.sin(X * 9 + k * 5)]; };
  const nodes = new Map(), nodeAt = (i, j) => { const k = i + ',' + j; let n = nodes.get(k); if (!n) nodes.set(k, n = S(i * mx, j * my)); return n; };
  const ni = Math.round(W / mx), nj = Math.round(Hn / my), seg = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, px = -dy / l * 0.007, py = dx / l * 0.007; g.quad(DRC, [a[0] + px, a[1] + py, a[2]], [a[0] - px, a[1] - py, a[2]], [b[0] - px, b[1] - py, b[2]], [b[0] + px, b[1] + py, b[2]], cord, DRU.cloth, true); };
  for (let i = -ni; i <= ni; i++) for (let j = 0; j <= nj; j++) {
    if ((i + j) % 2) continue; const a = nodeAt(i, j);
    for (const dj of [1, -1]) { const i2 = i + 1, j2 = j + dj; if (i2 > ni || j2 < 0 || j2 > nj) continue; seg(a, nodeAt(i2, j2)); }
    if (j > 0 && j < nj) { const q = 0.016; g.quad(DRC, [a[0] - q, a[1], a[2] + 0.004], [a[0], a[1] - q, a[2] + 0.004], [a[0] + q, a[1], a[2] + 0.004], [a[0], a[1] + q, a[2] + 0.004], knot, DRU.cloth, true); }
  }
  g.beam(DRW, [-W - 0.05, top, 0.05], [W + 0.05, top, 0.05], 0.014, [0.3, 0.25, 0.2]);
  for (let i = -ni; i <= ni; i += 2) { const p = nodeAt(i + ((i + 0) % 2 ? 1 : 0), 0); g.beam(DRW, [p[0], top, 0.05], [p[0], top - 0.03, p[2]], 0.004, cord); }
  for (const x of [-W - 0.05, W + 0.05]) g.box(DRW, x - 0.04, 0, 0.01, x + 0.04, top + 0.1, 0.09, [0.3, 0.25, 0.2], DRU.wood);
  return g.make(key);
}

// ───────────────────────── placement ─────────────────────────
function dmat(name, x, y, z, s, ry, rx, rz) {
  const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s;
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0, 'YXZ')), new THREE.Vector3(sv[0], sv[1], sv[2]));
}
const dpH = n => (Kit.pieces[n] ? Kit.pieces[n].max[1] : 0.5);
function buildDress() {
  if (!kitReady() || (TEST && TEST.dress === 0)) return;
  const R = rng(8801), OUT = { zone: 0, skyVis: 1, cast: false };
  DRS.items = []; DRS.placed = []; DRS.wet = []; DRS.worn = []; DRS.n = 0; DRS.lights = 0;
  const ADD = (name, M, o, tier) => DRS.items.push({ name, M, o: o || OUT, tier, x: M.elements[12], z: M.elements[14] });
  const DCNT = World.dressCount = { fpot: 0, vine: 0 };
  const add = (name, x, y, z, s, ry, ex, o, rx, rz) => (/fpot/.test(name) && DCNT.fpot++, /Vine/.test(name) && DCNT.vine++, ADD(name, dmat(name, x, y, z, s, ry, rx, rz), o ? Object.assign({}, OUT, o) : OUT, o && o.es ? 0 : 1));
  const gy = (x, z) => Terrain.y(x, z);
  const V = (fn, n) => Array.from({ length: n }, (_, i) => fn(R, i));
  const barrels = V(dBarrel, 4), crates = V(dCrate, 5), sacks = V(dSack, 4), baskets = V(dBasket, 3), buckets = V(dBucket, 3), pots = V(dPot, 4), bales = V(dBale, 2), logs = V(dLogPile, 4), fpots = V(dFlowerPot, 4), benches = V(dBench, 2),
    carts = V(dHandcart, 2), troughs = V(dTrough, 2), ladders = V(dLadder, 3), brooms = V(dBroom, 2), tools = V(dToolRack, 2), fences = V(dFence, 3);
  const pick = a => a[Math.floor(R() * a.length)];
  const solid = (x, z, r, h) => World.colliders.push({ x, z, r, y0: gy(x, z) - 0.5, y1: gy(x, z) + (h || 0.9), stk: TEST && TEST.colstack === 2 ? 'solid ' + new Error().stack.split('\n').slice(2, 4).join(' < ') : undefined });
  // [fx1] a row of barrels or crates is a long thin box, not a circle as wide as its length (the circles reached into the house walls beside them)
  const solidRow = (x, z, dx, dz, half, hw, h) => World.colliders.push({ x, z, hx: half, hz: hw, ax: dx, az: dz, bx: -dz, bz: dx, y0: gy(x, z) - 0.5, y1: gy(x, z) + h, stk: TEST && TEST.colstack === 2 ? 'solidRow ' + new Error().stack.split('\n').slice(2, 4).join(' < ') : undefined });
  const spotsOut = Object.values(World.spots).filter(s => !s.zone);
  const stones = [[0, -2], [-6, -4], [6, -3], [0, -10], [0, 6], [-9, 2], [9, 3], [0, -15.5]];
  const inAlley = (x, z) => x > ALLEY.x0 - 3 && x < ALLEY.x1 + 3 && Math.abs(z - roadZ(x)) < 8;
  const routeNear = (x, z, r) => {
    for (const rt of World.routes || []) for (let i = 0; i < rt.pts.length - 1; i++) {
      const a = rt.pts[i], b = rt.pts[i + 1], bx = b[0] - a[0], bz = b[2] - a[2], l2 = bx * bx + bz * bz, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * bx + (z - a[2]) * bz) / l2)) : 0;
      if (hyp(x - a[0] - bx * t, z - a[2] - bz * t) < r) return true;
    }
    return false;
  };
  // may a prop of radius r stand here?
  const ok = (x, z, r, o) => {
    o = o || {};
    if (hyp(x, z) > WORLD_RADIUS + 8) return false;
    if (KEEP.hit(x, z, r * 1.45)) return false;          // Build 33
    if (z > 10.9 - r * 0.5 && z < 13.4 + r * 0.5 && x > -37.5 - r && x < 25) return false;      /* [fx3] the terrace's south wall and its lean-to stand here: nothing is dressed into the wall */
    if (routeNear(x, z, r + 0.7)) return false;          // [fx3] a walk the route tests make (galleries, lanes, the dead yard) stays clear: never in a door's approach strip or on a road's centre line
    for (const p of DRS.placed) if (hyp(x - p[0], z - p[1]) < r + p[2]) return false;
    const al = inAlley(x, z);
    if (al) { if (Math.abs(z - roadZ(x)) < 1.8 + r * 0.5) return false; }
    else for (const rd of Roads) if (rd.line.dist(x, z, 4) < rd.w / 2 + r * 0.7 + 0.35) return false;
    const sq = hyp((x - SQUARE.x) / SQUARE.rx, (z - SQUARE.z) / SQUARE.rz) < 1.05;
    if (sq && !o.square) return false;
    if (sq) for (const p of stones) if (hyp(x - p[0], z - p[1]) < 1.6 + r) return false;
    for (const s of spotsOut) if (hyp(x - s.p[0], z - s.p[2]) < r + 0.9) return false;
    for (const s of SITES) { const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + 0.12 && Math.abs(l[1]) < s.d / 2 + 0.12) return false; }
    for (const s of SITES) if (/^high\./.test(s.id) && hyp(x - s.x, z - s.z) < 9) return false;      // [fx3] the hamlet's own yard props are built later (79_wilds.js): dress leaves that yard alone
    { let nb = 0; for (const s of SITES) { const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + 0.85 && Math.abs(l[1]) < s.d / 2 + 0.85 && ++nb > 1) return false; } }      // [fx3] nothing is stood in a gap under 1.6 m between two houses
    for (const h in World.houses) { const d = World.houses[h].door; if (d && hyp(x - d.out[0], z - d.out[2]) < r + 1.5) return false; }
    for (const f of FIELDS) if (x > f.x0 - 1 && x < f.x1 + 1 && z > f.z0 - 1 && z < f.z1 + 1) return false;
    if (River.dist(x, z, 7 + r) < 4.5 + r) return false;
    if (hyp(x - LAKE.x, z - LAKE.z) < LAKE.r + 2) return false;
    for (const c of World.colliders) {
      if (c.r !== undefined) { if (hyp(x - c.x, z - c.z) < c.r + r) return false; continue; }
      const dx = (x - c.x) * c.ax + (z - c.z) * c.az, dz = (x - c.x) * c.bx + (z - c.z) * c.bz, big = Math.max(c.hx, c.hz) > 1.6;
      if (hyp(Math.max(Math.abs(dx) - c.hx, 0), Math.max(Math.abs(dz) - c.hz, 0)) < (big ? 0.55 : r)) return false;       // [fx1] 0.12 let a 2.9 m row of barrels sit half inside a house wall
    }
    if (o.flat !== undefined && Math.abs(gy(x, z) - o.flat) > 0.5) return false;
    return true;
  };
  const claim = (x, z, r) => DRS.placed.push([x, z, r]);
  // a point on a wall of a site: u along the wall, out metres from it; ry makes a piece's +z point away from the wall
  const wallAt = (s, face, u, out) => {
    let lx, lz, rl;
    if (face === 'front') { lx = u; lz = -s.d / 2 - out; rl = PI; } else if (face === 'back') { lx = u; lz = s.d / 2 + out; rl = 0; } else if (face === 'left') { lx = -s.w / 2 - out; lz = u; rl = -PI / 2; } else { lx = s.w / 2 + out; lz = u; rl = PI / 2; }
    const p = siteToWorld(s, lx, lz); return { x: p[0], z: p[1], ry: rl - s.yaw, lx, lz };
  };
  const wallLen = (s, face) => face === 'front' || face === 'back' ? s.w : s.d;
  // [fx3] a pile's footprint must not push into anything already solid (the overlap finder: crates through counters, barrels through crates)
  const rowClear = (x, z, dx, dz, half, hw, h) => {
    const y = gy(x, z), A = { x, z, hx: half, hz: hw, ax: dx, az: dz, bx: -dz, bz: dx };
    for (const t of [-1, -0.5, 0, 0.5, 1]) if (routeNear(x + dx * half * t, z + dz * half * t, hw + 0.7)) return false;
    for (const c of World.colliders) {
      if (!isFinite(c.x) || Math.abs(c.x - x) > 6 || Math.abs(c.z - z) > 6 || c.y1 < y - 0.1 || c.y0 > y + h) continue;
      const B = c.r !== undefined ? { x: c.x, z: c.z, hx: c.r, hz: c.r, ax: 1, az: 0, bx: 0, bz: 1 } : c; let m = 1e9;
      for (const d of [[A.ax, A.az], [A.bx, A.bz], [B.ax, B.az], [B.bx, B.bz]]) {
        const pr = (o) => { const cx = o.x * d[0] + o.z * d[1], r = o.hx * Math.abs(o.ax * d[0] + o.az * d[1]) + o.hz * Math.abs(o.bx * d[0] + o.bz * d[1]); return [cx - r, cx + r]; };
        const u = pr(A), v = pr(B), ov = Math.min(u[1], v[1]) - Math.max(u[0], v[0]); if (ov < m) m = ov;
      }
      if (m > 0.05 && !(c.y1 - c.y0 > 2.4 && m < 0.1)) return false;
    }
    return true;
  };
  // ── piles ──
  const barrelPile = (x, z, ry, ex) => {
    const n = R.i(2, 4), dx = Math.cos(ry), dz = -Math.sin(ry), y = gy(x, z); let top = 0;
    if (!rowClear(x, z, dx, dz, n * 0.33 + 0.12, 0.46, 1.5)) return;
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.66; add(pick(barrels), x + dx * o + R.s() * 0.03, y, z + dz * o + R.s() * 0.03, 0.95 + R() * 0.15, R() * TAU, ex); top = i; }
    if (n >= 2 && R() < 0.7) add(pick(barrels), x + R.s() * 0.05, y + 0.78, z + R.s() * 0.05, 0.9, R() * TAU, ex);
    if (R() < 0.5) add(pick(buckets), x + dx * 0.95 + 0.1, y, z + dz * 0.95, 1, R() * TAU, ex);
    solidRow(x, z, dx, dz, n * 0.33 + 0.12, 0.46, 1.5); claim(x, z, 0.4 + n * 0.3);
  };
  const crateTop = (n, y) => y + dpH(n);
  const cratePile = (x, z, ry, ex) => {
    const y = gy(x, z), dx = Math.cos(ry), dz = -Math.sin(ry), k = R.i(1, 3);
    if (!rowClear(x, z, dx, dz, (k + 1) * 0.31 + 0.15, 0.5, 1.3)) return;
    const cs = [];
    for (let i = 0; i < k + 1; i++) { const n = pick(crates), o = (i - k / 2) * 0.62; add(n, x + dx * o, y, z + dz * o, 1, ry + R.s() * 0.2, ex); cs.push([n, o]); }
    if (R() < 0.8) { const n = pick(crates), o = cs[0][1] + 0.3; add(n, x + dx * o, crateTop(cs[0][0], y) - 0.02, z + dz * o, 0.92, ry + R.s() * 0.4, ex); if (R() < 0.45) add(pick(crates), x + dx * (o + 0.05), crateTop(n, crateTop(cs[0][0], y)) - 0.03, z + dz * (o + 0.05), 0.75, ry + R.s() * 0.6, ex); }
    if (R() < 0.5) add(pick(sacks), x + dx * (k / 2 * 0.62 + 0.5), y, z + dz * (k / 2 * 0.62 + 0.5), 1, R() * TAU, ex);
    solidRow(x, z, dx, dz, (k + 1) * 0.31 + 0.15, 0.5, 1.3); claim(x, z, 0.5 + k * 0.3);
  };
  const sackPile = (x, z, ry, ex) => {
    const y = gy(x, z), n = R.i(2, 4);
    for (let i = 0; i < n; i++) add(pick(sacks), x + R.s() * 0.35, y, z + R.s() * 0.3, 0.9 + R() * 0.3, R() * TAU, ex, null, 0, R.s() * 0.15);
    if (n > 2) add(pick(sacks), x, y + 0.28, z, 0.85, R() * TAU, ex, null, 0.4, 0);
    claim(x, z, 0.7);
  };
  const stallGoods = (x, z, ry, y) => { };
  // ── what each kind of site gathers around its walls ──
  const kinds = {
    inn: ['barrels', 'barrels', 'bench', 'trough', 'cart', 'crates', 'logs', 'bucket', 'basket'],
    smithy: ['crates', 'logs', 'tools', 'trough', 'bucket', 'barrels', 'ladder'],
    store: ['crates', 'sacks', 'basket', 'barrels', 'broom', 'crates', 'sacks'],
    house: ['logs', 'tools', 'bucket', 'bench', 'ladder', 'broom', 'fpot', 'fpot', 'basket', 'barrels', 'sacks'],
    farm: ['hay', 'sacks', 'cart', 'trough', 'logs', 'bucket', 'hay', 'tools', 'barrels', 'ladder'],
    chapel: ['fpot', 'bench', 'fpot', 'bucket'],
    shop: ['ladder', 'broom', 'crates', 'barrels', 'fpot', 'bucket', 'sacks'],
  };
  const kindOf = s => s.id === 'inn' ? 'inn' : s.id === 'smithy' ? 'smithy' : s.id === 'store' ? 'store' : /^(farm|barn|mill)$/.test(s.id) ? 'farm' : s.id === 'chapel' ? 'chapel' : s.id === 'tower' ? null : /^(shop\.|draper)/.test(s.id) ? 'shop' : 'house';
  for (const s of SITES) {
    R.seed(idSeed('dress' + s.id)); const kind = kindOf(s); if (!kind) continue;
    const alley = kind === 'shop', n = alley ? 7 : kind === 'chapel' ? 3 : s.infill ? 3 + R.i(0, 1) : 5 + R.i(0, 2), list = kinds[kind];
    let placed = 0;
    for (let tries = 0; tries < 220 && placed < n; tries++) {
      const t = pick(list), face = R() < (alley ? 0.8 : 0.4) ? 'front' : R() < 0.5 ? 'back' : R() < 0.5 ? 'left' : 'right';
      if (alley && face !== 'front') continue;
      const L = wallLen(s, face), u0 = (R() - 0.5) * (L - 0.9), lowWall = alley || t === 'cart' || t === 'trough' || t === 'bench';
      const out = t === 'cart' ? 1.5 + R() * 0.4 : t === 'trough' ? 0.55 : t === 'bench' ? 0.4 : t === 'barrels' ? 0.5 + R() * 0.2 : t === 'crates' ? 0.55 : t === 'hay' ? 0.4 : t === 'logs' ? 0.34 : t === 'sacks' ? 0.5 : t === 'ladder' || t === 'broom' || t === 'tools' ? 0.02 : 0.45 + R() * 0.3;
      const w = wallAt(s, face, u0, out), r = t === 'cart' ? 1.0 : t === 'barrels' || t === 'crates' ? 1.05 : t === 'trough' ? 1.0 : t === 'hay' ? 0.7 : t === 'logs' ? 0.55 : 0.4;
      const wm = t === 'ladder' || t === 'broom' || t === 'tools', w2 = wm ? wallAt(s, face, u0, 0.45) : w;
      if (!ok(w2.x, w2.z, r * (wm ? 0.9 : alley ? 0.7 : 1), { flat: s.y })) continue;
      const y = gy(w.x, w.z), ex = placed > 2 && R() < 0.5, along = w.ry + PI / 2;        // direction along the wall as a heading
      // a heading `ry` (piece +z toward it) -> the along-wall axis for piles
      if (t === 'barrels') barrelPile(w.x, w.z, w.ry, ex);
      else if (t === 'crates') cratePile(w.x, w.z, w.ry, ex);
      else if (t === 'sacks') sackPile(w.x, w.z, w.ry, ex);
      else if (t === 'logs') { add(pick(logs), w.x, y, w.z, 1, w.ry + PI, ex); claim(w.x, w.z, 0.55); if (R() < 0.7) add(dChips(R, R.i(0, 2)), w.x + Math.sin(w.ry) * 0.7, y, w.z + Math.cos(w.ry) * 0.7, 1, R() * TAU, true); }
      else if (t === 'bucket') { add(pick(buckets), w.x, y, w.z, 1, R() * TAU, ex); if (R() < 0.5) add(pick(buckets), w.x + 0.34, y, w.z + 0.1, 0.9, R() * TAU, ex); claim(w.x, w.z, 0.4); }
      else if (t === 'basket') { add(pick(baskets), w.x, y, w.z, 1.1, R() * TAU, ex); claim(w.x, w.z, 0.3); }
      else if (t === 'fpot') { const keepPot = R() < 0.34; if (keepPot) for (let i = 0; i < R.i(1, 3); i++) add(pick(fpots), w.x + Math.cos(w.ry) * i * 0.34, y, w.z - Math.sin(w.ry) * i * 0.34, 1, R() * TAU, ex); if (keepPot) claim(w.x, w.z, 0.5); }
      else if (t === 'hay') { DRS.worn.push([w.x, w.z, 2.2, 0.7]); add(pick(bales), w.x, y, w.z, 1, w.ry + PI / 2 + R.s() * 0.15, ex); if (R() < 0.6) add(pick(bales), w.x + R.s() * 0.1, y + 0.43, w.z, 0.95, w.ry + PI / 2 + R.s() * 0.4, ex); add(dStrawPiece(R, R.i(0, 2)), w.x + Math.sin(w.ry) * 0.8, y, w.z + Math.cos(w.ry) * 0.8, 1.3, R() * TAU, true); solid(w.x, w.z, 0.55, 0.9); claim(w.x, w.z, 0.7); }
      else if (t === 'bench') { DRS.worn.push([w.x, w.z, 1.5, 0.6]); add(pick(benches), w.x, y, w.z, 1, w.ry + PI / 2, ex); claim(w.x, w.z, 0.9); }
      else if (t === 'cart') { DRS.worn.push([w.x, w.z, 1.8, 0.6]); add(pick(carts), w.x, y, w.z, 1, w.ry + PI / 2 + R.s() * 0.5, ex); solid(w.x, w.z, 0.7, 0.8); claim(w.x, w.z, 1.0); if (R() < 0.6) add(pick(sacks), w.x, y + 0.45, w.z, 0.9, R() * TAU, ex); }
      else if (t === 'trough') { DRS.wet.push([w.x, w.z, 1.7, 0.9]); DRS.worn.push([w.x, w.z, 2.2, 0.5]); add(pick(troughs), w.x, y, w.z, 1, w.ry + PI / 2, ex); solid(w.x, w.z, 0.95, 0.5); claim(w.x, w.z, 1.1); }
      else if (t === 'ladder') { add(pick(ladders), w.x, y, w.z, 1, w.ry, false); claim(w.x, w.z, 0.4); }
      else if (t === 'broom') { add(pick(brooms), w.x, y, w.z, 1, w.ry, ex); claim(w.x, w.z, 0.3); }
      else if (t === 'tools') { add(pick(tools), w.x, y, w.z, 1, w.ry, ex); claim(w.x, w.z, 0.2); }
      placed++;
    }
    (DRS.cnt = DRS.cnt || {})[s.id] = placed;
  }
  R.seed(8801);
  // ── market stalls: the square's rim and the alley's middle band, each stocked ──
  const stallKinds = ['greens', 'bread', 'cloth', 'pots', 'fish', 'meat'], stallCols = [[[0.28, 0.14, 0.12], [0.4, 0.37, 0.3]], [[0.13, 0.17, 0.24], [0.4, 0.37, 0.3]], [[0.18, 0.22, 0.13], [0.39, 0.36, 0.29]], [[0.31, 0.23, 0.12], [0.4, 0.37, 0.29]], [[0.23, 0.16, 0.15], [0.39, 0.36, 0.3]]];      // Build 42: faded madder, woad, moss, ochre on undyed linen (the canopy material brightens these about 1.6x)
  DRS.stalls = [];
  const placeStall = (x, z, face, kind) => {          // face: heading toward which the stall opens
    const y = gy(x, z), name = dStall(kind, R, (sc => (R() < 0.4 ? [sc[0], sc[0]] : sc).map(c => c.map(v => v * 0.34)))(R.pick(stallCols))), ry = face;
    add(name, x, y, z, 1.1, ry, false, DRS.stalls.length < 3 ? { es: true } : null);
    const fx = Math.sin(ry), fz = Math.cos(ry);
    claim(x, z, 1.6);
    World.colliders.push({ x, z, hx: 1.3, hz: 0.55, ax: Math.cos(ry), az: -Math.sin(ry), bx: Math.sin(ry), bz: Math.cos(ry), y0: y - 0.5, y1: y + 1.0, shade: true });
    const k = DRS.stalls.length; DRS.stalls.push({ x, z, kind });
    World.spots['dstall' + k] = { p: [x + fx * 1.5, gy(x + fx * 1.5, z + fz * 1.5), z + fz * 1.5], yaw: ry + PI, zone: 0 };
    if (R() < 0.8) { const sx = x - Math.cos(ry) * 1.8, sz = z + Math.sin(ry) * 1.8; if (ok(sx, sz, 0.6, { square: true })) { add(pick(R() < 0.5 ? barrels : crates), sx, gy(sx, sz), sz, 1, R() * TAU, false); solid(sx, sz, 0.4, 0.9); claim(sx, sz, 0.5); } }
  };
  { let placedS = 0;      // [fx3] the place's stalls stand in two rows facing the cart way, in front of the north and south fronts, not scattered at random; each has fallback spots in its row
    for (const [cands, ry] of [[[[-14.2, -12.4], [-13.0, -11.2], [-15.5, -10.6]], 0], [[[-6.4, -12.0], [-7.6, -11.0], [-5.0, -11.6]], 0], [[[6.6, -12.4], [7.8, -11.6], [5.6, -12.0]], 0], [[[14.0, -12.0], [12.2, -12.4], [15.4, -10.8]], 0], [[[-6.0, 5.2], [-7.2, 4.8], [-4.9, 5.4]], PI], [[[12.6, 5.0], [10.4, 5.6], [14.2, 4.6]], PI]]) {
      for (const [x, z] of cands) { if (!ok(x, z, 1.1, { square: true })) continue; placeStall(x, z, ry, stallKinds[(placedS + 1) % stallKinds.length]); placedS++; break; } } }
  // alley: stalls and carts set into the middle band, nearer the shop fronts, leaving the walking line free
  for (const [x, rowS, kind] of [[26.5, -1, 'greens'], [33.5, -1, 'fish'], [38.2, 1, 'meat'], [45.0, -1, 'pots']]) {
    const z = roadZ(x) + rowS * 3.6, ry = rowS < 0 ? 0 : PI;
    if (!ok(x, z, 1.7, { alley: true })) { continue; } placeStall(x, z, ry, kind);
  }
  for (let k = 0; k < 10; k++) {
    const x = ALLEY.x0 - 1 + R() * (ALLEY.x1 - ALLEY.x0 + 2), row = R() < 0.5 ? -1 : 1, z = roadZ(x) + row * (2.9 + R() * 0.9), t = pick(['cart', 'trough', 'hay', 'bench', 'barrels', 'crates', 'sacks', 'cart']);
    if (!ok(x, z, 1.0)) continue;
    const y = gy(x, z), ry = R() * TAU, hd = row < 0 ? PI / 2 : -PI / 2 + R.s() * 0.3;
    if (t === 'cart') { add(pick(carts), x, y, z, 1, hd + R.s() * 0.5, false); solid(x, z, 0.7, 0.8); add(pick(sacks), x, y + 0.45, z, 0.9, R() * TAU, false); claim(x, z, 1.1); }
    else if (t === 'trough') { DRS.wet.push([x, z, 1.7, 0.9]); add(pick(troughs), x, y, z, 1, hd, false); solid(x, z, 0.95, 0.5); claim(x, z, 1.1); }
    else if (t === 'hay') { DRS.worn.push([x, z, 2.2, 0.7]); add(pick(bales), x, y, z, 1, ry, false); add(pick(bales), x + 0.6, y, z + 0.1, 1, ry + 1.2, false); solid(x, z, 0.8, 0.9); claim(x, z, 0.9); }
    else if (t === 'bench') { DRS.worn.push([x, z, 1.5, 0.6]); add(pick(benches), x, y, z, 1, hd, false); claim(x, z, 0.9); }
    else if (t === 'barrels') barrelPile(x, z, hd, false); else if (t === 'crates') cratePile(x, z, hd, false); else sackPile(x, z, 0, false);
  }
  { const Rw = rng(3131);
    for (let i = 0; i < 34; i++) { const x = ALLEY.x0 - 2 + Rw() * (ALLEY.x1 - ALLEY.x0 + 4), z = roadZ(x) + Rw.s() * 5.2; DRS.wet.push([x, z, 0.7 + Rw() * 1.1, 0.5 + Rw() * 0.5]); }
    for (let i = 0; i < 12; i++) { const a = Rw() * TAU, r = Rw() * 0.9; DRS.wet.push([SQUARE.x + Math.cos(a) * SQUARE.rx * r, SQUARE.z + Math.sin(a) * SQUARE.rz * r, 0.9 + Rw() * 1.3, 0.4 + Rw() * 0.5]); }
    DRS.wet.push([6.2, -8.6, 2.3, 0.9]); if (World.coop) { DRS.wet.push([World.coop[0], World.coop[1] + 1.5, 3.2, 0.9], [World.coop[0] - 2, World.coop[1] + 4, 2.4, 0.8]); DRS.worn.push([World.coop[0], World.coop[1] + 1.5, 4.5, 0.8]); } }
  // a notice post at the alley's mouth
  { const x = ALLEY.x0 - 1.5, z = roadZ(x) - 2.4; if (ok(x, z, 0.6)) { add(dNoticePost(R), x, gy(x, z), z, 1.1, 0.2, false, { es: true }); solid(x, z, 0.25, 2); claim(x, z, 0.6); } }

  // ── yards and the village edge: split-rail fences at the sides of cottages, a roadside shrine, milestones, fish racks and a boat by the fisher ──
  for (const id of ['elder', 'guardhouse', 'weaver', 'hunter', 'farm', 'mill', 'herbalist']) {
    const s = SITE[id]; if (!s) continue;
    const face = R() < 0.5 ? 'left' : 'right', len = wallLen(s, face);
    for (let u = -len / 2 + 0.6, k = 0; u < len / 2 + 2.2; u += 2.0, k++) {
      const w = wallAt(s, face, u, 3.4); if (!ok(w.x, w.z, 0.55, { flat: s.y })) continue;
      add(pick(fences), w.x, gy(w.x, w.z), w.z, 1, w.ry); claim(w.x, w.z, 0.5);
      if (k % 3 === 1 && R() < 0.5) { add(pick(buckets), w.x + Math.sin(w.ry + PI / 2) * 0.5, gy(w.x, w.z), w.z + Math.cos(w.ry + PI / 2) * 0.5, 1, R() * TAU); }
    }
  }
  { const rd = Roads[0], shr = [[0.14, 1], [0.8, -1]];
    shr.forEach(([f, sd], i) => { const p = rd.line.point(rd.line.len * f), x = p[0] - p[3] * sd * (rd.w / 2 + 1.4), z = p[1] + p[2] * sd * (rd.w / 2 + 1.4); if (i === 0 && ok(x, z, 0.6)) { add(dShrine(R), x, gy(x, z), z, 1.2, Math.atan2(p[3] * sd, -p[2] * sd) + PI / 2); solid(x, z, 0.4, 1.1); claim(x, z, 0.8); } });
    for (const f of [0.08, 0.3, 0.55, 0.9]) for (const sd of [1]) { const p = rd.line.point(rd.line.len * f), x = p[0] - p[3] * sd * (rd.w / 2 + 0.7), z = p[1] + p[2] * sd * (rd.w / 2 + 0.7); if (ok(x, z, 0.4)) { add(dMilestone(R, R.i(0, 1)), x, gy(x, z), z, 1, R() * 0.4 + Math.atan2(-p[3], p[2])); claim(x, z, 0.4); } } }
  { const s = SITE.fisher;
    if (s) { const a = wallAt(s, 'back', 0.6, 2.4), b = wallAt(s, 'back', -1.4, 2.0); if (ok(a.x, a.z, 0.9, { flat: s.y })) { add(dNet(R), a.x, gy(a.x, a.z), a.z, 1, a.ry + PI / 2 * 0); claim(a.x, a.z, 1.0); }
      if (ok(b.x, b.z, 0.9, { flat: s.y })) { add(dHangFish(R, 2), b.x, gy(b.x, b.z) + 1.4, b.z, 1, b.ry); } }
    // the fisher's corner: a boat pulled up on the bank beside the pier, nets on racks, barrels and crates by the cabin's door side
    { const F = BW.fisher;
      if (F && s) { const [ux, uz] = F.u, px = -uz, pz = ux, yawU = Math.atan2(ux, -uz);
        const at = (a, b, f) => [F.q[0] + ux * a + px * b, F.q[1] + uz * a + pz * b];
        const bp = at(-1.2, 3.6); if (ok(bp[0], bp[1], 1.3)) { add(dBoat(R), bp[0], gy(bp[0], bp[1]) - 0.05, bp[1], 1.25, yawU + PI / 2 + 0.15); solid(bp[0], bp[1], 1.0, 0.5); claim(bp[0], bp[1], 1.4); }
        const np = at(-2.6, -2.6); if (ok(np[0], np[1], 0.9)) { add(dNet(R), np[0], gy(np[0], np[1]), np[1], 1, yawU); claim(np[0], np[1], 1.0); }
        const np2 = at(-3.6, 1.8); if (ok(np2[0], np2[1], 0.9)) { add(dNet(R), np2[0], gy(np2[0], np2[1]), np2[1], 1, yawU + 0.4); claim(np2[0], np2[1], 1.0); }
        for (const [a, b] of [[-2.2, -1.3], [-2.0, -0.8], [-3.0, -1.6]]) { const bb = at(a, b); if (ok(bb[0], bb[1], 0.5)) { add(dBarrel(R), bb[0], gy(bb[0], bb[1]), bb[1], 1, R() * TAU); solid(bb[0], bb[1], 0.4, 0.9); claim(bb[0], bb[1], 0.5); } } } }
    for (let t = 0; t < (BW.fisher ? 0 : 40); t++) { const ang = 4.2 + R() * 0.7, d = LAKE.r + 0.2 + R() * 2.5, x = LAKE.x + Math.cos(ang) * d, z = LAKE.z + Math.sin(ang) * d, y = gy(x, z); if (y > LAKE.y + 0.15 && y < LAKE.y + 1.2 && hyp(x - 6.8, z - 88.2) > 5) { add(dBoat(R), x, y - 0.05, z, 1.2, ang + PI / 2 + R.s() * 0.3); solid(x, z, 1.0, 0.5); break; } } }
  // ── wall furniture: hanging signs, bracket lanterns, vines, laundry lines ──
  const MSof = s => new THREE.Matrix4().fromArray(siteMatrix(s, s.y));
  const glyphs = { inn: 'mugs', smithy: 'anvil', store: 'crest', herbalist: 'herbs', weaver: 'crest', elder: 'crest' };
  const [lf, lg] = AL.lan || (AL.lan = genBracketLantern());
  const wallOf = s => s.doorWall || 'front';
  for (const s of SITES) {
    R.seed(idSeed('dressB' + s.id)); const kind = kindOf(s); if (!kind || kind === 'shop' && !s.facade) continue;
    const face = wallOf(s), L = wallLen(s, face), dl = siteDoorLocal(s, 0), du = (face === 'front' || face === 'back') ? dl[0] : dl[1];
    const tint = [0.36, 0.44, 0.3];
    // vines: a few strands on random walls, away from the door
    for (let i = 0, nv = kind === 'inn' ? 4 : 2 + R.i(0, 2); i < nv; i++) {
      const f = pick(['front', 'back', 'left', 'right']), u = (R() - 0.5) * (wallLen(s, f) - 1.6); if (f === face && Math.abs(u - du) < 1.9) continue;
      const w = wallAt(s, f, u, 0.06), y = s.y + 2.5 + R() * 0.4; if (kind === 'shop' || i % 2) continue;
      add(pick(['Prop_Vine1', 'Prop_Vine2', 'Prop_Vine4', 'Prop_Vine1']), w.x, y, w.z, [0.62, 0.6 + R() * 0.2, 0.6], w.ry, i % 2 === 0, { tint: [tint[0] * (0.9 + R() * 0.2), tint[1], tint[2]] });
    }
    if (kind === 'chapel' || kind === 'farm' && s.id === 'barn') continue;
    // bracket lantern and sign beside the door
    const side = R() < 0.5 ? -1 : 1, w = wallAt(s, face, du + side * 1.15, 0.0), yL = s.y + 2.05 + R() * 0.45;
    const q = new THREE.Vector3(Math.sin(w.ry) * 0.38, 0, Math.cos(w.ry) * 0.38);
    const M = dmat(lf, w.x, yL, w.z, 1, w.ry); ADD(lf, M, OUT, 0); ADD(lg, M, Object.assign({}, OUT, { glow: 4.4 }), 0);
    const lp = [w.x + q.x, yL - 0.1, w.z + q.z]; World.emitters.push({ type: 'lantern', p: lp, zone: 0, halo: s.infill ? 0.4 : 0.7 }); if (DRS.lights++ < 5 && World.lights.length < 40) addLight(lp, 9, [3.0, 1.7, 0.7], 0, 'lantern');
    if (glyphs[s.id] || kind === 'inn') { const w2 = wallAt(s, face, du - side * 1.3, 0.0), sg = genSign(glyphs[s.id] || 'crest', [1.0, 0.8, 0.45]); add(sg, w2.x, s.y + 2.45 + R() * 0.3, w2.z, 1, w2.ry, false); }
  }
  R.seed(8802);
  // laundry between upper windows of some alley shops, and a few cottages
  for (const sh of AL.shops) {
    if (sh.house || !sh.a || sh.fl < 2 || R() < 0.45) continue;
    const s = sh.site, y = s.y + 3 * 1 + 2.55, a = wallAt(s, 'front', -sh.w / 2 + 0.55, 0.65), b = wallAt(s, 'front', sh.w / 2 - 0.55, 0.65);
    const cols = [[0.72, 0.68, 0.58], [0.5, 0.4, 0.3], [0.38, 0.42, 0.52], [0.68, 0.6, 0.5], [0.52, 0.28, 0.24]];
    ADD(dLaundry([a.x, y, a.z], [b.x, y - 0.15, b.z], R, cols), new THREE.Matrix4(), OUT, 0);
  }
}

// ── scene: batches are made when the quality tier is known (and again if it changes): the town (square + alley) is one cell with three meshes
//    at most; the outskirts are 64 m cells hidden beyond the yard range. Low keeps only the essentials (tier 0). ──
function dressBuild() {
  const q = R.q; if (!q || !DRS.items) return;
  for (const k of DRS.groups) { SC.scene.remove(k.g); k.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  DRS.groups = []; DRS.builtFor = R.qName;
  const low = !q.scatter, town = Kit.batch({ name: 'dress-town', cell: 40, off: 2048 }), out = Kit.batch({ name: 'dress-out', cell: 64, off: 20 });
  const inTown = (x, z) => x > -22 && x < 58 && z > -30 && z < 30;
  for (const it of DRS.items) { if (low && it.tier > 0) continue; (inTown(it.x, it.z) ? town : out).add(it.name, it.M, it.o); }
  const mk = (B, isTown) => { if (!B.count) return; const g = B.build(); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); SC.scene.add(g); let t = 0; g.traverse(o => { if (o.isMesh) t += o.geometry.index.count / 3; }); DRS.groups.push({ g, town: isTown, tris: t, meshes: g.children.length }); };
  if (!low) mk(out, false); mk(town, true);
}
function dressAttach() {
  if (!DRS.items || !SC.scene) return;
  dressBuild();
  const inner = sceneUpdate;
  sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    if (DRS.builtFor !== R.qName) dressBuild();
    const range = q.yardRange * 1.1 + 4, hide = World.deepIn;
    for (const k of DRS.groups) {
      if (hide) { k.g.visible = false; continue; }
      k.g.visible = true; for (const o of k.g.children) { const bs = o.geometry && o.geometry.boundingSphere; if (bs) o.visible = hyp(bs.center.x - camPos[0], bs.center.z - camPos[2]) < range + bs.radius; }
    }
  };
}

// painted into the second ground mask by buildSplat2: g = wet / damp (darkens, mud on grass), a = worn turf
function splat2Dress(blob, A, B) {
  for (const w of DRS.wet || []) blob(A, 1, w[0], w[1], w[2], w[3], 0.25);
  for (const w of DRS.worn || []) blob(B, 0, w[0], w[1], w[2], w[3], 0.3);
  if (typeof INF !== 'undefined') for (const h of INF.houses) {        // worn turf at each infill door, a damp strip along the street front
    const dp = SITE[h.id].doorPos || 0, p = siteToWorld(h, dp, -h.d / 2 - 1.0), q = siteToWorld(h, 0, -h.d / 2 - 0.7);
    blob(B, 0, p[0], p[1], 1.9, 0.75, 0.3); blob(A, 1, q[0], q[1], Math.max(2, h.w * 0.45), 0.28, 0.25);
  }
}
