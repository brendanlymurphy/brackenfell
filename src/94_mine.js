// ───────────────────────── the Old Mine: a dungeon of its own, reached through the barred door in the south-west cliffs ─────────────────────────
// A cell (56_cells.js) with no house in it: rock, timber, water, rails, carts and bones. It is built from rectangles of floor (REG) rasterised on a 1 m grid; the walls,
// floor and roof are made from that grid (walls and roof pushed about by a lattice noise so no wall is straight), the colliders from the rectangles. Scanned rock, roots,
// the castle door and the unique weapon come from kits/dungeon.glb once the kit is ready. Light: none but what is carried (the lantern, key L) and what burns on the walls.
// Everything is zone 0 (no room AO), lit by fire lights placed here; the cell's env is overridden to near black (Cells.env wrapper below).
const MINE = { built: false, cell: null, O: null, FY: 0, lamp: { on: false, oil: 0 }, kit: [], lights: [], torches: [], foes: [], pieces: {} };
// ── the plan: rectangles in the cell's frame (x east, z deeper in). fl: floor height above the cell floor; ramp: floor runs y0 -> y1 along an axis from a to b ──
MINE.REG = [
  { id: 'adit',  x0: -2, z0: 0,  x1: 2,  z1: 24, h: 3.1, kind: 'timber' },
  { id: 'tally', x0: -8, z0: 24, x1: 8,  z1: 36, h: 4.4, kind: 'cave' },
  { id: 'niche', x0: -13, z0: 27, x1: -8, z1: 33, h: 3.0, kind: 'cave' },
  { id: 'rampA', x0: 8,  z0: 29, x1: 10, z1: 35, h: 3.4, kind: 'cave', ramp: { ax: 'x', a: 8, b: 10, y0: 0, y1: -0.8 } },
  { id: 'flood', x0: 10, z0: 29, x1: 30, z1: 35, h: 3.4, kind: 'cave', fl: -0.8 },
  { id: 'rampB', x0: 30, z0: 29, x1: 32, z1: 35, h: 3.4, kind: 'cave', ramp: { ax: 'x', a: 30, b: 32, y0: -0.8, y1: 0 } },
  { id: 'sump',  x0: 32, z0: 24, x1: 44, z1: 40, h: 4.2, kind: 'cave' },
  { id: 'north', x0: 36, z0: 40, x1: 40, z1: 48, h: 3.1, kind: 'timber' },
  { id: 'stope', x0: 28, z0: 48, x1: 48, z1: 62, h: 5.6, kind: 'cave' },
  { id: 'duct',  x0: 10, z0: 58, x1: 28, z1: 62, h: 3.2, kind: 'timber' },
  { id: 'deep',  x0: -14, z0: 48, x1: 10, z1: 70, h: 8.0, kind: 'cave' },
  { id: 'exitr', x0: -26, z0: 58, x1: -14, z1: 62, h: 3.4, kind: 'cave', ramp: { ax: 'x', a: -14, b: -26, y0: 0, y1: 3.4 } },
  { id: 'cleft', x0: -38, z0: 54, x1: -26, z1: 66, h: 7.0, kind: 'cave', fl: 3.4 },
];
// where things are (cell frame)
MINE.AT = {
  arrive: [0, 2.6], trap: [0, 14.5], tally: [0, 30], niche: [-10.5, 30], gallery: [20, 32], sump: [38, 32], stope: [38, 55], rubble: [[31.5, 53], [48, 56]], way: [28, 31.5, 53, 56],
  deep: [-2, 60], boss: [-2, 58], station: [-11.5, 66], chest: [-12, 52.5], exitDoor: [-35, 60], cave: { x: 20, z: -172.5 },
};
MINE.SPAWN = [
  { kind: 'delver', x: 3.5, z: 31, yaw: PI }, { kind: 'delver', x: 37, z: 35, yaw: -PI / 2 }, { kind: 'delver', x: 31, z: 59, yaw: PI },
  { kind: 'lurker', x: 26.5, z: 31.5, yaw: PI }, { kind: 'lurker', x: 29.8, z: 54.5, yaw: 0 }, { kind: 'lurker', x: -12.5, z: 60, yaw: PI / 2 },
  { kind: 'foreman', x: -2, z: 60.5, yaw: PI / 2 },
];
const mhash = (a, b, c) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const mnoise = (a, b, c) => mhash(a, b, c) * 2 - 1;
// the grid: occupied 1 m cells -> { reg, fl (floor, cell frame), h }
function mineGrid() {
  const G = new Map(), key = (i, j) => (i + 200) * 1000 + (j + 200);
  const flat = (r, x, z) => { if (!r.ramp) return r.fl || 0; const q = r.ramp, c = q.ax === 'x' ? x : z; return q.y0 + (q.y1 - q.y0) * clamp((c - q.a) / (q.b - q.a), 0, 1); };
  for (const r of MINE.REG) for (let i = r.x0; i < r.x1; i++) for (let j = r.z0; j < r.z1; j++) G.set(key(i, j), { i, j, reg: r });
  const get = (i, j) => G.get(key(i, j)) || null;
  // ceiling at a lattice point: the highest roof of the (up to four) cells that meet there; floor at a point: from the cell's own region
  const hc = (i, j) => { let h = 0; for (const [a, b] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) { const c = get(i + a, j + b); if (c) h = Math.max(h, c.reg.h + flat(c.reg, i, j)); } return h; };
  return { G, get, flat, hc, key };
}
// push a point about: the same displacement wherever the lattice point is used, so the surfaces stay closed
function mdisp(i, j, k, amp) { return [mnoise(i, j, k * 7 + 1) * amp, mnoise(i, j, k * 7 + 2) * amp]; }
// ── the shell: floor, roof, walls, colliders ──
function mineShell(m, O, FY, V) {
  const g = mineGrid(), W = (x, y, z) => [O[0] + x, FY + y, O[2] + z], cells = [...g.G.values()];
  const cave = (a, b) => [[0, 0], [-1, 0], [0, -1], [-1, -1]].some(([p, q]) => { const c = g.get(a + p, b + q); return c && c.reg.kind === 'cave'; });
  const ceilY = (a, b) => g.hc(a, b) + (cave(a, b) ? mnoise(a, b, 9) * 0.42 : 0);
  const amp = (a, b, k) => k === 0 ? 0 : (cave(a, b) ? 0.3 : 0.07) * (k === 3 ? 0.7 : 1);
  const P = (a, b, k, y) => { const d = mdisp(a, b, k, amp(a, b, k)); return W(a + d[0], y, b + d[1]); };
  const T = 3.2, rockCol = (i, j, s) => { const v = (0.80 + mhash(i, j, s) * 0.4) * 1.9; return [0.74 * v, 0.70 * v, 0.66 * v]; };
  m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0;
  const edges = { W: [], E: [], S: [], N: [] };
  for (const c of cells) {
    const { i, j, reg } = c, fl = (a, b) => g.flat(reg, a, b);
    // floor
    m.mat(reg.id === 'flood' || reg.id.startsWith('ramp') ? MAT.MUD : MAT.SOIL, reg.id === 'flood' || reg.id.startsWith('ramp') ? [0.44, 0.41, 0.38] : [0.40 + mhash(i, j, 3) * 0.1, 0.48 + mhash(i, j, 4) * 0.05, 0.50], 0.8);      // [fx2] trodden earth underfoot, rock on the walls
    m.quad(W(i, fl(i, j), j), W(i, fl(i, j + 1), j + 1), W(i + 1, fl(i + 1, j + 1), j + 1), W(i + 1, fl(i + 1, j), j), i / T, j / T, (i + 1) / T, (j + 1) / T);
    // roof
    m.mat(MAT.ROCK, rockCol(i, j, 5).map(v => v * 0.8), 0.7);
    m.quad(P(i, j + 1, 3, ceilY(i, j + 1)), P(i, j, 3, ceilY(i, j)), P(i + 1, j, 3, ceilY(i + 1, j)), P(i + 1, j + 1, 3, ceilY(i + 1, j + 1)), i / T, j / T, (i + 1) / T, (j + 1) / T);
    if (V && V.roof(reg, i, j)) { const q = [P(i, j + 1, 3, ceilY(i, j + 1)), P(i, j, 3, ceilY(i, j)), P(i + 1, j, 3, ceilY(i + 1, j)), P(i + 1, j + 1, 3, ceilY(i + 1, j + 1))], c = [0, 1, 2].map(d => (q[0][d] + q[1][d] + q[2][d] + q[3][d]) / 4), sh = (p, s2) => [c[0] + (p[0] - c[0]) * s2, c[1] + (p[1] - c[1]) * s2 - 0.05, c[2] + (p[2] - c[2]) * s2]; V.mesh.quad(sh(q[0], 0.7), sh(q[1], 0.35), sh(q[2], 0.6), sh(q[3], 0.3), 0, 0, 1, 1); }
    // walls where the neighbour is rock: A left, B right as seen from inside
    const wall = (kind, a0, b0, a1, b1, along) => {
      const nrm = { W: [1, 0, 0], E: [-1, 0, 0], N: [0, 0, -1], S: [0, 0, 1] }[kind];
      m.mat(MAT.ROCK, rockCol(i + a0, j + b0, 1).map((v, d) => v * [0.58, 0.58, 0.58][d]), 0.6);      // [fx2] cut rock at a believable scale, grey-brown
      const lev = (a, b, k) => { const f = fl(a, b) - 0.4, t = ceilY(a, b); return P(a, b, k, f + (t - f) * k / 3); };
      for (let k = 0; k < 3; k++) m.quad(lev(a0, b0, k + 1), lev(a0, b0, k), lev(a1, b1, k), lev(a1, b1, k + 1), (along) / T, k * 1.2 / T, (along + 1) / T, (k + 1) * 1.2 / T);
      edges[kind].push([i, j]);
      {          // [fx2] a straight cut is not a mine: stones heaped at the wall foot and, in the caves, the rock bulging out of the face; nothing reaches past the 0.35 m the colliders already hold back
        const hs = q => mhash(i * 3 + a0, j * 3 + b0, q + kind.charCodeAt(0) * 17), t = 0.15 + hs(1) * 0.7, bp = { W: [i, j + t], E: [i + 1, j + t], S: [i + t, j], N: [i + t, j + 1] }[kind], f0 = fl(i + 0.5, j + 0.5), cv = reg.kind === 'cave';
        const col = k => rockCol(i, j, 40 + k).map(v => v * 0.5);
        if (hs(2) < 0.75) { const n = 1 + (hs(3) * 4 | 0); for (let q = 0; q < n; q++) { const r = 0.1 + hs(4 + q) * 0.26, d = r * (0.4 + hs(8 + q) * 0.8), al = (hs(12 + q) - 0.5) * 0.9; m.mat(MAT.ROCK, col(q), 0.6); m.ball(O[0] + bp[0] + nrm[0] * d + (nrm[0] ? 0 : al), FY + f0 + r * 0.25, O[2] + bp[1] + nrm[2] * d + (nrm[2] ? 0 : al), r * 1.3, r * 0.7, r, 5, 3); } }
        if (cv && hs(20) < 0.5) { const r = 0.45 + hs(21) * 0.35, pr = 0.15 + hs(22) * 0.2; m.mat(MAT.ROCK, col(9), 0.6); m.ball(O[0] + bp[0] + nrm[0] * (pr - r), FY + f0 + 0.6 + hs(23) * 1.8, O[2] + bp[1] + nrm[2] * (pr - r), r, r * 0.8, r, 7, 4); }
      }
      if (V && V.want(reg, i, j, kind)) {      // a vein of silver laid on the wall: a ragged patch, a hand's breadth off the rock
        const k = 1 + ((i * 7 + j * 3 + a0) & 1), q = [lev(a0, b0, k + 1), lev(a0, b0, k), lev(a1, b1, k), lev(a1, b1, k + 1)], c = [0, 1, 2].map(d => (q[0][d] + q[1][d] + q[2][d] + q[3][d]) / 4);
        const sh = (p, s2) => [c[0] + (p[0] - c[0]) * s2 + nrm[0] * 0.05, c[1] + (p[1] - c[1]) * s2, c[2] + (p[2] - c[2]) * s2 + nrm[2] * 0.05];
        V.mesh.quad(sh(q[0], 0.55 + mhash(i, j, 21) * 0.3), sh(q[1], 0.3 + mhash(i, j, 22) * 0.4), sh(q[2], 0.5 + mhash(i, j, 23) * 0.3), sh(q[3], 0.3 + mhash(i, j, 24) * 0.4), 0, 0, 1, 1);
      }
    };
    if (!g.get(i - 1, j)) wall('W', i, j + 1, i, j, j);
    if (!g.get(i + 1, j)) wall('E', i + 1, j, i + 1, j + 1, j);
    if (!g.get(i, j + 1)) wall('N', i + 1, j + 1, i, j + 1, i);
    if (!g.get(i, j - 1)) wall('S', i, j, i + 1, j, i);
  }
  // colliders: runs of wall edges merged into boxes, a metre thick outside the plane and 0.35 into the space
  const run = (list, fixed, mover, mk) => {
    const by = new Map(); for (const e of list) { const f = fixed(e), v = mover(e); (by.get(f) || by.set(f, []).get(f)).push(v); }
    for (const [f, vs] of by) { vs.sort((a, b) => a - b); let s = vs[0], p = vs[0]; for (let q = 1; q <= vs.length; q++) { if (q === vs.length || vs[q] !== p + 1) { mk(f, s, p + 1); s = vs[q]; } p = vs[q]; } }
  };
  const y0 = -3, y1 = 12; m.push();
  const box = (x0, z0, x1, z1) => addBoxCollider(m, O[0] + x0, O[2] + z0, O[0] + x1, O[2] + z1, FY + y0, FY + y1);
  run(edges.W, e => e[0], e => e[1], (f, a, b) => box(f - 1, a, f + 0.35, b));
  run(edges.E, e => e[0] + 1, e => e[1], (f, a, b) => box(f - 0.35, a, f + 1, b));
  run(edges.S, e => e[1], e => e[0], (f, a, b) => box(a, f - 1, b, f + 0.35));
  run(edges.N, e => e[1] + 1, e => e[0], (f, a, b) => box(a, f - 0.35, b, f + 1));
  m.pop();
  // floors you can stand on: one per rectangle (flat or ramp), same height as the drawn floor
  for (const r of MINE.REG) {
    if (r.ramp) addFloor(m, O[0] + r.x0, O[2] + r.z0, O[0] + r.x1, O[2] + r.z1, FY + (r.ramp.ax === 'x' ? (r.ramp.a < r.ramp.b ? r.ramp.y0 : r.ramp.y1) : 0), FY + (r.ramp.ax === 'x' ? (r.ramp.a < r.ramp.b ? r.ramp.y1 : r.ramp.y0) : 0), 'x');
    else addFloor(m, O[0] + r.x0, O[2] + r.z0, O[0] + r.x1, O[2] + r.z1, FY + (r.fl || 0));
  }
  g.edges = edges; return g;
}
// ── the fittings ──
LIGHT_KINDS.mine = (l, e) => 1;
LIGHT_KINDS.hum = (l, e) => 0.82 + 0.18 * Math.sin(e.time * 1.7 + l.seed);
function mineBuild() {
  if (MINE.built || !CELLS_ON) return;
  const cell = Cells.make('mine', 'The Old Mine', { kind: 'dungeon', daylight: 0, fog: [0.010, 0.011, 0.014], fogDensity: 0.055, exit: 'the hillside' });
  const O = cell.origin, FY = cell.floorY; MINE.cell = cell; MINE.O = O; MINE.FY = FY;
  const pack = new MeshPack(); pack.shadow = false;
  const m = new Mesh(1 << 16); m.seed = 9301;
  const gm = new Mesh(2048); gm.m1 = 0; gm.m2 = 0; gm.m3 = 0; gm.ao = 1; gm.grad = null; gm.wind = 0; gm.mat(MAT.PLAIN, [0.55, 0.75, 1.0]);
  const grid = mineShell(m, O, FY, { mesh: gm, want: (r, i, j, k) => (r.id === 'deep' && mhash(i, j, 31) < 0.6) || (r.id === 'stope' && mhash(i, j, 32) < 0.16) || (r.id === 'cleft' && mhash(i, j, 33) < 0.1), roof: (r, i, j) => (r.id === 'deep' && mhash(i, j, 34) < 0.16) || (r.id === 'stope' && mhash(i, j, 35) < 0.05) }); MINE.grid = grid;
  const wpos = (x, y, z) => [O[0] + x, FY + y, O[2] + z];
  const put = (x, z, rot, fn, y) => { m.push().T(O[0] + x, FY + (y || 0), O[2] + z).RY(rot || 0); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0; fn(m); m.pop(); return wpos(x, y || 0, z); };
  const rnd = rng(9301), em = o => { o.cell = 'mine'; o.zone = 0; o.seed = (World.emitters.length * 0.618) % 1; o.t = 0; World.emitters.push(o); return o; };
  // light: a fire on the wall
  const torch = (x, z, rot) => put(x, z, rot, mm => {
    mm.mat(MAT.METAL, COL.black); mm.box(-0.04, 1.62, -0.02, 0.04, 1.7, 0.2); mm.box(-0.03, 1.6, 0.16, 0.03, 1.8, 0.2);
    mm.mat(MAT.TIMBER, COL.timberDark); mm.beam([0, 1.7, 0.1], [0, 2.18, 0.26], 0.07, 0.07); mm.mat(MAT.PLAIN, [0.09, 0.05, 0.03]); mm.cyl(0, 2.16, 0.25, 0.055, 0.04, 0.12, 6, 1);
    const p = wp(mm, 0, 2.3, 0.26); em({ type: 'fire', p, size: 0.3 }); MINE.torches.push(addLight(p, 12, [4.7, 2.5, 0.9], 0, 'fire'));
  });
  // an iron brazier on three legs, for the deep chamber
  const brazier = (x, z) => put(x, z, 0, mm => {
    mm.mat(MAT.METAL, COL.black); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; mm.beam([Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4], [Math.cos(a) * 0.12, 0.85, Math.sin(a) * 0.12], 0.06, 0.06); }
    mm.lathe([[0.12, 0.8], [0.4, 0.98], [0.44, 1.1], [0.38, 1.1]], 9, 0); mm.mat(MAT.PLAIN, [0.1, 0.06, 0.04]); mm.cyl(0, 0.9, 0, 0.36, 0.34, 0.12, 9, 1);
    const p = wp(mm, 0, 1.2, 0); em({ type: 'fire', p, size: 0.55 }); MINE.torches.push(addLight(p, 15, [5.0, 2.6, 1.0], 0, 'fire')); addCircleCollider(mm, 0, 0, 0.42, 0, 1.2);
  });
  // timber sets in the timbered drifts: two posts, a cap, lagging above; rails and sleepers down the middle of the adit and the tally room
  for (const r of MINE.REG.filter(r => r.kind === 'timber')) {
    for (let z = r.z0 + 1.5; z < r.z1 - 0.5; z += 3) put(0, z, 0, mm => {
      const hx = (r.x1 - r.x0) / 2, cx = (r.x0 + r.x1) / 2; mm.mat(MAT.TIMBER, COL.timberDark, 0.8);
      for (const s of [-1, 1]) { mm.cbox(cx + s * (hx - 0.28), -0.3, 0, 0.3, r.h + 0.1, 0.3, 4); if (rnd() < 0.5) mm.beam([cx + s * (hx - 0.28), 0.6, 0.15], [cx + s * (hx - 0.8), 0.1, 0.55], 0.1, 0.1); }
      mm.mat(MAT.TIMBER, COL.timber, 0.8); mm.box(cx - hx + 0.1, r.h - 0.42, -0.17, cx + hx - 0.1, r.h - 0.12, 0.17);
      for (const s of [-1, 1]) mm.beam([cx + s * (hx - 0.28), r.h - 0.5, 0], [cx + s * (hx - 1.1), r.h - 0.12, 0], 0.14, 0.14);
      mm.mat(MAT.PLANKS, [0.5, 0.44, 0.38], 0.7); for (let k = 0; k < 3; k++) mm.box(cx - hx + 0.15, r.h - 0.1, -1.2 + k * 1.0, cx + hx - 0.15, r.h - 0.04, -0.4 + k * 1.0);
    });
  }
  const rails = (z0, z1) => { put(0, 0, 0, mm => {
    mm.mat(MAT.TIMBER, COL.timberDark); for (let z = z0; z < z1; z += 0.85) mm.box(-0.8, 0, z - 0.07, 0.8, 0.07, z + 0.07);
    mm.mat(MAT.METAL, [0.34, 0.27, 0.22]); for (const sx of [-0.5, 0.5]) mm.box(sx - 0.035, 0.07, z0, sx + 0.035, 0.12, z1); }, 0.0); };
  rails(1.5, 34);
  // a cart: planks, iron bands, wheels; load = rock | none | tipped
  const cart = (x, z, rot, load, tip) => put(x, z, rot, mm => {
    if (tip) mm.RZ(tip).T(0, 0.35, 0);
    mm.mat(MAT.PLANKS, [0.5, 0.4, 0.3], 0.6); mm.box(-0.55, 0.28, -0.85, 0.55, 0.34, 0.85); for (const sx of [-1, 1]) mm.box(sx * 0.55 - 0.03, 0.3, -0.85, sx * 0.55 + 0.03, 0.98, 0.85); for (const sz of [-1, 1]) mm.box(-0.55, 0.3, sz * 0.85 - 0.03, 0.55, 0.92, sz * 0.85 + 0.03);
    mm.mat(MAT.METAL, [0.3, 0.26, 0.23]); mm.box(-0.58, 0.88, -0.88, 0.58, 0.94, 0.88, 0); for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) { mm.push().T(sx, 0.2, sz).RZ(PI / 2); mm.cyl(0, -0.03, 0, 0.18, 0.18, 0.06, 10, 3); mm.pop(); }
    if (load === 'rock') { mm.mat(MAT.ROCK, [0.45, 0.43, 0.42], 0.5); for (let i = 0; i < 9; i++) mm.ball((rnd() - 0.5) * 0.7, 0.95 + rnd() * 0.12, (rnd() - 0.5) * 1.2, 0.18 + rnd() * 0.12, 0.14, 0.18, 6, 3); mm.mat(MAT.METAL, [0.62, 0.7, 0.8]); for (let i = 0; i < 3; i++) mm.ball((rnd() - 0.5) * 0.6, 1.02, (rnd() - 0.5) * 1.0, 0.07, 0.05, 0.07, 5, 3); }
    if (!tip) addBoxCollider(mm, -0.6, -0.9, 0.6, 0.9, 0, 1.0);
  });
  cart(0, 9, 0.02, 'rock'); cart(-3.2, 27.5, 1.1, null, 0.8); cart(3.5, 33.2, -0.3, 'rock');
  // bones: a skull, a ribcage, a few long bones
  const bones = (x, z, rot, n) => put(x, z, rot, mm => {
    mm.mat(MAT.PLAIN, [0.72, 0.68, 0.58]); mm.ball(0, 0.07, 0, 0.09, 0.075, 0.1, 8, 5); mm.box(-0.045, 0.0, 0.06, 0.045, 0.045, 0.13, 0);
    for (let i = 0; i < (n || 5); i++) { const a = (i + 1) * 0.45 - 1.2; mm.beam([0.3 + i * 0.08, 0.02, 0.05 + Math.sin(a) * 0.12], [0.3 + i * 0.08 + 0.03, 0.06, 0.05 + Math.sin(a) * 0.3], 0.025, 0.025); mm.beam([0.3 + i * 0.08, 0.02, 0.05 - Math.sin(a) * 0.12], [0.3 + i * 0.08 + 0.03, 0.06, 0.05 - Math.sin(a) * 0.3], 0.025, 0.025); }
    mm.beam([0.1, 0.02, -0.3], [1.0, 0.03, -0.45], 0.04, 0.04); mm.beam([0.0, 0.02, 0.4], [0.7, 0.03, 0.6], 0.035, 0.035);
    mm.mat(MAT.CLOTH, [0.22, 0.18, 0.14], 0.5); mm.ball(0.5, 0.025, 0.05, 0.4, 0.03, 0.22, 8, 3);
  });
  MINE.bones = bones; MINE.put = put; MINE.wpos = wpos; MINE.em = em;
  // ── torches: pools of light with dark between ──
  torch(-1.85, 5, PI / 2); torch(1.85, 18.5, -PI / 2); torch(7.85, 33, -PI / 2); torch(-7.85, 25.4, PI / 2); torch(14, 29.15, 0); torch(27.5, 34.85, PI);
  torch(43.85, 28, -PI / 2); torch(28.15, 50.5, PI / 2); torch(19, 58.15, 0); torch(-2, 47.9, 0, 0);
  for (const [x, z, r] of [[-1.85, 11.5, PI / 2], [20.5, 29.15, 0], [47.85, 55, -PI / 2], [36, 61.85, PI], [12.5, 58.15, 0], [-20, 61.85, PI], [-30, 65.85, PI]]) torch(x, z, r);      // [fx2] a pool of light every 6-7 m along the way, so the unlit walk goes from fire to fire
  brazier(-8, 54); brazier(4, 54); brazier(-8, 66); brazier(4, 66);
  // ── the tally room: a table of tally boards, racks of tools, barrels, a tipped cart; Dunstan's crew drew their pay here ──
  put(-5.2, 34, 0, mm => { mm.mat(MAT.PLANKS, COL.woodDark, 0.6); mm.box(-1.1, 0.7, -0.4, 1.1, 0.78, 0.4); for (const sx of [-1, 1]) for (const sz of [-1, 1]) mm.box(sx * 0.95 - 0.05, 0, sz * 0.3 - 0.05, sx * 0.95 + 0.05, 0.7, sz * 0.3 + 0.05); addBoxCollider(mm, -1.15, -0.45, 1.15, 0.45, 0, 0.8);
    mm.mat(MAT.PLAIN, COL.parchment); mm.box(-0.8, 0.78, -0.2, -0.3, 0.8, 0.2); mm.mat(MAT.PLANKS, [0.45, 0.36, 0.26], 0.4); for (let i = 0; i < 7; i++) mm.box(0.0 + i * 0.1, 0.78, -0.2, 0.04 + i * 0.1, 0.84, 0.15); });
  put(-6.6, 29, PI / 2, mm => { Props.barrel(mm); }); put(-6.7, 30.3, PI / 2 + 0.4, mm => { Props.barrel(mm); }); put(6.8, 26.5, 0, mm => Props.crate(mm, 0.8)); put(6.2, 26.7, 0.4, mm => { mm.T(0, 0.8, 0); Props.crate(mm, 0.55); });
  put(-7.6, 30, PI / 2, mm => { mm.mat(MAT.TIMBER, COL.timberDark); mm.box(-1.0, 0.9, -0.03, 1.0, 1.0, 0.03); mm.box(-1.0, 1.5, -0.03, 1.0, 1.6, 0.03); mm.mat(MAT.METAL, [0.5, 0.5, 0.54]); for (let i = 0; i < 5; i++) { mm.beam([-0.8 + i * 0.4, 0.95, 0.05], [-0.75 + i * 0.4, 1.9, 0.12], 0.03, 0.045); mm.box(-0.85 + i * 0.4, 1.9, 0.06, -0.65 + i * 0.4, 2.0, 0.16); } });
  bones(2.4, 29.5, 0.7, 6); bones(-3.6, 25.5, 2.2, 4);
  // the niche: a bedroll, a cold hearth, an oil flask on the ledge
  put(-10.5, 30, 0, mm => { mm.mat(MAT.CLOTH, [0.32, 0.27, 0.2], 0.5); mm.box(-0.45, 0.02, -0.9, 0.45, 0.12, 0.9); mm.mat(MAT.CLOTH, [0.4, 0.36, 0.28], 0.5); mm.box(-0.35, 0.12, 0.45, 0.35, 0.2, 0.85); mm.mat(MAT.ROCK, [0.3, 0.3, 0.3], 0.5); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; mm.ball(Math.cos(a) * 0.5 + 1.2, 0.05, Math.sin(a) * 0.5 + 0.6, 0.12, 0.08, 0.1, 6, 3); } mm.mat(MAT.PLAIN, [0.06, 0.05, 0.04]); mm.cyl(1.2, 0.0, 0.6, 0.36, 0.36, 0.02, 9, 1); });
  // ── the flooded gallery: a boarded walk along the north wall with a gap, posts, a tilted ladder, a sunk cart ──
  put(0, 0, 0, mm => {
    mm.mat(MAT.PLANKS, [0.72, 0.68, 0.62], 0.5);
    for (const [a, b] of [[10.5, 18], [22, 29.5]]) { for (let x = a; x < b; x += 0.34) { const w = 0.3 + (mhash(x * 10, 3, 4) * 0.04); mm.box(x, -0.07, 33.45 + mnoise(x * 7, 1, 1) * 0.03, x + w, 0.0, 34.9); }
      for (const x of [a + 0.3, (a + b) / 2, b - 0.3]) { mm.mat(MAT.TIMBER, COL.timberDark); mm.cbox(x, -0.9, 33.6, 0.14, 0.9, 0.14, 0); mm.cbox(x, -0.9, 34.8, 0.14, 0.9, 0.14, 0); } mm.mat(MAT.PLANKS, [0.62, 0.55, 0.45], 0.5); mm.box(a, -0.2, 33.4, b, -0.12, 33.5); mm.box(a, -0.2, 34.85, b, -0.12, 34.95); }
    mm.mat(MAT.TIMBER, COL.timberDark); mm.beam([18, 0.0, 33.8], [17.3, -0.9, 33.0], 0.1, 0.06); mm.beam([22, 0.0, 34.2], [22.5, -0.7, 33.4], 0.1, 0.06);     // the broken ends
  });
  for (const [a, b] of [[10.5, 18], [22, 29.5]]) { m.push(); addBoxCollider(m, O[0] + a, O[2] + 33.4, O[0] + b, O[2] + 34.95, FY - 3, FY + 0.9); m.pop(); }
  // the walk is a floor of its own, at the cell floor
  addFloor(m, O[0] + 10.5, O[2] + 33.4, O[0] + 18, O[2] + 34.95, FY); addFloor(m, O[0] + 22, O[2] + 33.4, O[0] + 29.5, O[2] + 34.95, FY);
  // (the rail, the tilted cart under the water)
  put(24, 31, 0.5, mm => { mm.mat(MAT.PLANKS, [0.3, 0.27, 0.22], 0.6); mm.box(-0.55, -0.7, -0.85, 0.55, -0.62, 0.85); for (const sx of [-1, 1]) mm.box(sx * 0.55 - 0.03, -0.65, -0.85, sx * 0.55 + 0.03, -0.1, 0.85); });
  bones(14.5, 30.5, 1.2, 5); bones(26.2, 29.8, 0.2, 3);
  // ── the sump: spoil, a pump, tools left in a heap ──
  put(38, 36, 0.3, mm => { mm.mat(MAT.TIMBER, COL.timberDark); mm.beam([-0.9, 0, 0], [-0.1, 1.9, 0], 0.12, 0.12); mm.beam([0.9, 0, 0], [0.1, 1.9, 0], 0.12, 0.12); mm.box(-0.15, 1.8, -0.15, 0.15, 1.95, 0.15); mm.mat(MAT.METAL, [0.3, 0.27, 0.24]); mm.beam([0, 1.9, 0], [0.6, 1.2, 0.2], 0.04, 0.04); mm.cyl(0.7, 0.0, 0.2, 0.12, 0.12, 1.2, 8, 1); addCircleCollider(mm, 0, 0, 0.9, 0, 2); });
  put(41.2, 30.5, 0, mm => Props.chest(mm)); bones(41.5, 36.5, 2.8, 5);
  // ── the collapsed stope: the roof came down across the route; rubble with a way round on the west side ──
  mine_rubble(m, put, rnd, O, FY);
  // ── the deep chamber: the Foreman's ground ──
  mine_deep(m, put, rnd, O, FY, wpos, em);
  pack.add(m, { kind: 'opaque', cell: 'mine', nearOnly: true, noShadow: true });
  // water: the flooded gallery, a puddle in the sump, the silver pool
  const wm = new Mesh(512); wm.mat(MAT.PLAIN, [0.17, 0.21, 0.235]); wm.ao = 1; wm.m1 = 0; wm.m2 = 0; wm.m3 = 0; wm.grad = null; wm.wind = 0;
  const wq = (x0, z0, x1, z1, y) => wm.quad(wpos(x0, y, z0), wpos(x0, y, z1), wpos(x1, y, z1), wpos(x1, y, z0));
  wq(9, 29, 31, 35, -0.06); wq(36, 25, 42, 30, 0.01); wq(-5, 66, 1, 69, 0.01);
  {          // [fx2] the flooded gallery: a kerb of wet stones along both banks, and the torches laid on the water
    const km = new Mesh(1024); km.m1 = 0; km.m2 = 0; km.m3 = 0; km.ao = 1; km.grad = null; km.wind = 0; km.mat(MAT.ROCK, [0.55, 0.56, 0.58], 0.6);
    for (let x = 10.3; x < 30; x += 0.55) for (const zz of [29.3, 34.75]) { if (zz > 34 && ((x > 10.4 && x < 18.1) || (x > 21.9 && x < 29.6))) continue; const h = mhash(x * 9, zz * 9, 7), r = 0.14 + h * 0.12; km.ball(...wpos(x + h * 0.2, -0.06, zz + (zz < 32 ? 1 : -1) * (h - 0.4) * 0.3), r * 1.3, r * 0.55, r, 6, 3); }
    pack.add(km, { kind: 'opaque', cell: 'mine', noShadow: true, nearOnly: true });
    gm.mat(MAT.PLAIN, [1.1, 0.55, 0.2]);
    for (const [tx, tz] of [[14, 29.4], [20.5, 29.4], [27.5, 34.6]]) { const dz = tz < 32 ? 1 : -1; for (let q = 0; q < 4; q++) { const w = 0.5 - q * 0.1, z0 = tz + dz * (0.7 + q * 0.75); gm.quad(wpos(tx - w / 2, -0.04, z0), wpos(tx - w / 2, -0.04, z0 + dz * 0.3), wpos(tx + w / 2, -0.04, z0 + dz * 0.3), wpos(tx + w / 2, -0.04, z0), 0, 0, 1, 1); } }
    gm.mat(MAT.PLAIN, [0.55, 0.75, 1.0]);
  }
  gm.quad(wpos(-4.6, 0.04, 66.4), wpos(-4.6, 0.04, 68.6), wpos(0.6, 0.04, 68.6), wpos(0.6, 0.04, 66.4), 0, 0, 1, 1);      // the silver pool glows
  pack.add(wm, { kind: 'opaque', cell: 'mine', noShadow: true, nearOnly: true });
  // the veins of silver in the roof and walls of the deep chamber and the stope: emissive, cold
  pack.add(gm, { kind: 'glow', cell: 'mine', noShadow: true, nearOnly: true });
  pack.upload('mine'); World.packs.push(pack); MINE.pack = pack;
  MINE.built = true;
  mine_wire(cell, wpos);
}
function mine_rubble(m, put, rnd, O, FY) {
  // the fall: a wall of broken rock from the east wall to the crawl on the west side, two layers of boulders and a slope of scree, timbers jutting out
  const A = MINE.AT.rubble;
  put(0, 0, 0, mm => {
    mm.mat(MAT.ROCK, [0.62, 0.6, 0.57], 0.5);
    for (let layer = 0; layer < 3; layer++) for (let x = A[0][0] + 0.3 + layer * 0.5; x < A[1][0] + 0.8; x += 1.1) for (let z = A[0][1] + 0.2; z < A[1][1]; z += 1.0) {
      const r = (0.55 + rnd() * 0.55) * (1 - layer * 0.18); if (rnd() < 0.18 + layer * 0.22) continue;
      mm.ball(x + (rnd() - 0.5) * 0.5, 0.35 + layer * 0.7 + rnd() * 0.3, z + (rnd() - 0.5) * 0.5, r, r * (0.7 + rnd() * 0.3), r * (0.8 + rnd() * 0.3), 7, 4);
    }
    mm.mat(MAT.GRAVEL, [0.4, 0.38, 0.36], 0.8); for (let i = 0; i < 40; i++) mm.ball(A[0][0] + rnd() * 16.5, 0.08, A[0][1] - 1.2 - rnd() * 2.6 * (0.4 + rnd()), 0.25 + rnd() * 0.5, 0.12, 0.25 + rnd() * 0.4, 6, 3);
    mm.mat(MAT.TIMBER, COL.timberDark); for (const [x, y, z, x2, y2, z2] of [[36, 2.4, 53.4, 38.2, 3.9, 56.4], [42, 2.9, 53.1, 40.8, 1.5, 51.0], [34, 2.0, 55.6, 33.2, 3.6, 52.6]]) mm.beam([x, y, z], [x2, y2, z2], 0.3, 0.3);
    // the crawl: a leaning beam and a shed of stone at the west wall, so the way round is plainly a way
    mm.beam([28.3, 0, 57.2], [30.8, 2.5, 55.2], 0.28, 0.28); mm.beam([31.3, 0.0, 52.8], [29.2, 2.7, 54.1], 0.24, 0.24);
  });
  m.push(); addBoxCollider(m, O[0] + A[0][0], O[2] + 53.1, O[0] + A[1][0], O[2] + 55.9, FY - 2, FY + 8); m.pop();
}
function mine_deep(m, put, rnd, O, FY, wpos, em) {
  // three stone columns left standing in the Foreman's ground: cover when he charges
  for (const [x, z] of [[-7.5, 58], [3.5, 58], [-2, 63]]) put(x, z, 0, mm => {
    mm.mat(MAT.ROCK, [0.48, 0.45, 0.43], 0.6); mm.lathe([[1.5, -0.4], [1.0, 0.5], [0.85, 2.0], [0.95, 4.0], [0.8, 6.0], [1.3, 8.2]], 10, 0);
    mm.mat(MAT.ROCK, [0.36, 0.34, 0.33], 0.6); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; mm.ball(Math.cos(a) * 1.25, 0.15, Math.sin(a) * 1.25, 0.5, 0.3, 0.5, 6, 3); }
    addCircleCollider(mm, 0, 0, 1.02, -1, 9);
  });
  // the miners' boots, in a row facing the silver pool, with the hats beside them: nobody has moved them in fifty years
  put(0, 65.2, 0, mm => { for (let i = 0; i < 12; i++) { const x = -5.5 + i * 0.62; mm.push().T(x, 0, 0).RY(PI + (mhash(i, 4, 4) - 0.5) * 0.15); mm.mat(MAT.PLAIN, [0.13, 0.095, 0.07]); for (const s of [-1, 1]) { mm.box(s * 0.1 - 0.05, 0, -0.1, s * 0.1 + 0.05, 0.12, 0.12); mm.box(s * 0.1 - 0.045, 0.12, -0.08, s * 0.1 + 0.045, 0.3, 0.05); } mm.pop(); mm.mat(MAT.CLOTH, [0.3, 0.25, 0.19], 0.4); mm.ball(x, 0.05, 0.55, 0.14, 0.06, 0.14, 7, 3); } });
  // bread laid on a slab at the mouth of the chamber: the offering the village stopped sending
  put(8.6, 51.5, 0.2, mm => { mm.mat(MAT.STONE, [0.4, 0.38, 0.36], 0.6); mm.box(-0.9, 0, -0.45, 0.9, 0.7, 0.45); mm.mat(MAT.CLOTH, [0.55, 0.5, 0.42], 0.5); mm.box(-0.7, 0.7, -0.35, 0.7, 0.72, 0.35); mm.mat(MAT.PLAIN, [0.36, 0.27, 0.16]); for (let i = 0; i < 5; i++) mm.ball(-0.5 + i * 0.25, 0.8, (i % 2 - 0.5) * 0.2, 0.11, 0.07, 0.07, 6, 4); mm.mat(MAT.PLAIN, [0.5, 0.52, 0.4]); mm.ball(0.5, 0.78, 0.15, 0.05, 0.04, 0.04, 5, 3); addBoxCollider(mm, -0.95, -0.5, 0.95, 0.5, 0, 0.9); });
  // Corwin's station in the alcove: a bedroll, a lamp gone cold, a table and a chest; a pick leaning on the wall
  put(-11.2, 66.2, 0.3, mm => { mm.mat(MAT.CLOTH, [0.3, 0.26, 0.2], 0.5); mm.box(-0.5, 0.02, -1.0, 0.5, 0.12, 0.9); mm.mat(MAT.PLANKS, COL.woodDark, 0.6); mm.box(1.0, 0.7, -0.5, 2.0, 0.78, 0.5); for (const sx of [1.05, 1.9]) for (const sz of [-0.45, 0.45]) mm.box(sx - 0.04, 0, sz - 0.04, sx + 0.04, 0.7, sz + 0.04); addBoxCollider(mm, 0.98, -0.52, 2.02, 0.52, 0, 0.8);
    mm.mat(MAT.METAL, COL.black); mm.lathe([[0.06, 0.78], [0.08, 0.9], [0.05, 0.98]], 6, 1); mm.mat(MAT.PLAIN, COL.parchment); mm.box(1.5, 0.78, -0.3, 1.8, 0.79, 0.1); });
  put(-12.2, 52.5, PI / 2, mm => Props.chest(mm, 1.1));
  bones(-5, 51, 1, 4); MINE.bones(5.5, 62.5, 2.1, 6); MINE.bones(-11, 58.4, 0.3, 5); MINE.bones(7.5, 67.5, 1.2, 4); MINE.bones(9.5, 60, 0.6, 5);
  // ── the foot of the second way out: a sagging rope ladder of roots and a trickle on the stone ──
  put(-30, 60, 0, mm => { mm.mat(MAT.ROCK, [0.4, 0.4, 0.38], 0.6); for (let i = 0; i < 9; i++) mm.ball(-4 + rnd() * 8, 3.4 + 0.1, -5 + rnd() * 10, 0.3 + rnd() * 0.3, 0.2, 0.3 + rnd() * 0.3, 6, 3); });
}
function bones(x, z, rot, n) { return MINE.bones(x, z, rot, n); }
// ───────────────────────── items ─────────────────────────
Object.assign(ITEMS, {
  oil: ['Lamp oil', 'A stoppered clay flask of whale oil, enough to keep a miner’s lantern burning for ten minutes.', { value: 4, cost: 7 }],
  foremankey: ['The Foreman’s key', 'A short brass key worn bright, on a loop of leather that still smells of tallow smoke. Every shift’s count is scratched on the bow.'],
  silverthread: ['Silverthread', 'A long estoc of grey silver steel drawn from the deep seam. Plain, balanced and a little too light. It hums in the hand when the Hollow are near.', { slot: 'weapon', dmg: 27, blade: [0.92, 1.7, 0.026], value: 160 }],
});
// ───────────────────────── wiring: doors, the lantern, the trap, what you can pick up ─────────────────────────
const MINE_S = () => (S.mine = S.mine || { oil: 0, trap: 0 });
function mine_wire(cell, wpos) {
  const O = MINE.O, FY = MINE.FY, P = WILDS.P.mine;
  // the door on the hill becomes a portal pair (the barred door of 79_wilds.js)
  const di = World.interact.findIndex(i => i.id === 'mine.door'), door = di >= 0 ? World.interact[di] : null; if (di >= 0) World.interact.splice(di, 1);
  const A = siteToWorld(P, 0, -0.5), Dn = siteToWorld(P, 0, 3.0), ay = Terrain.y(A[0], A[1]), yawOut = Math.atan2(Dn[0] - A[0], -(Dn[1] - A[1]));
  const dp = door ? door.p : [A[0], ay + 1.2, A[1]];
  cell.enter = { p: wpos(0, 0.05, 2.6), yaw: PI, cell: 'mine', name: 'The Old Mine' };
  cell.leave = { p: [A[0], ay, A[1]], yaw: yawOut, cell: null, name: 'the hillside' };
  const open = () => { if (S.flags.mineOpen) return true; if (has('minekey')) { S.flags.mineOpen = 1; toast('The Sexton’s key turns with a groan. The bar lifts out of its brackets.'); if (typeof uiObjective === 'function') uiObjective(); save(); return true; } return false; };
  cell.portalOut = { kind: 'portal', id: 'door.mine.in', p: dp, r: 3.0, zone: 0, cell: 'mine', label: 'Enter the Old Mine', dest: cell.enter, side: 'out', lock: () => open() ? null : 'Barred from the far side. Iron and oak: you will not shift it. Somebody, once, kept a key for it.' };
  cell.portalIn = { kind: 'portal', id: 'door.mine.out', p: wpos(0, 1.1, 0.7), r: 2.4, zone: 0, cell: 'mine', label: 'Leave to the hillside', dest: cell.leave, side: 'in' };
  World.interact.push(cell.portalOut, cell.portalIn);
  // the second way out: a cleft in the rock above the Hermit's Pool, found from inside
  const cx = 27.5, cz = -182.6, cy = Terrain.y(cx, cz);       // the rock face beside the fall, above the pool (the valley ends at radius 184: nothing can stand beyond it)
  cell.cleft = { p: [cx, Terrain.y(cx, cz + 1.8), cz + 1.8], yaw: PI, cell: null, name: 'The cliffs above the Hermit’s Pool' };
  const cin = { p: wpos(-33.5, 3.45, 60), yaw: -PI / 2, cell: 'mine', name: 'The Old Mine' };
  World.interact.push({ kind: 'portal', id: 'door.mine.cleft', p: wpos(-36, 4.5, 60), r: 2.6, zone: 0, cell: 'mine', label: 'Climb out by the cleft', dest: cell.cleft, side: 'in' });
  World.interact.push({ kind: 'portal', id: 'door.mine.cleft.in', p: [cx, cy + 0.9, cz + 0.9], r: 2.6, zone: 0, label: 'Squeeze into the cleft', dest: cin, side: 'out' });
  mine_cleftOutside(cx, cz, cy);
  // oil and a few other things on the floor
  const mi = (kind, id, x, y, z, label, item, extra) => {
    const key = 'mp.' + kind; MINE.pm = MINE.pm || {}; const mesh = MINE.pm[key] || (MINE.pm[key] = IX.mesh(kind)); const p3 = wpos(x, y, z);
    const obj = addSkinned(mesh, { c: p3, r: 0.6, zone: 0, kind: 'pickup', cell: 'mine', light: 0.7 }); R.boneData.set(m4.translate(m4.create(), p3[0], p3[1], p3[2]), obj.slot * 256);
    const it = Object.assign({ kind: 'pickup', id, item, p: [p3[0], p3[1] + 0.2, p3[2]], r: 1.9, zone: 0, obj, label, cell: 'mine' }, extra || {}); World.interact.push(it); World.pickups.push(it); return it;
  };
  MINE.mi = mi;
  mi('candle', 'mine.oil.1', -9.2, 0.0, 28.4, 'Take the oil', 'oil'); mi('candle', 'mine.oil.2', 5.4, 0.0, 25.2, 'Take the oil', 'oil'); mi('candle', 'mine.oil.3', 40.6, 0.0, 33.8, 'Take the oil', 'oil'); mi('candle', 'mine.oil.4', -9.6, 0.0, 64.8, 'Take the oil', 'oil');
  mi('loaf', 'mine.bread', 8.4, 0.82, 51.4, 'Take the bread', 'bread');
  MINE.journal = mi('book', 'mine.journal', -9.4, 0.79, 66.2, 'Take Corwin’s journal', 'journal', { journal: true });
  // the Foreman's strongbox
  World.interact.push({ p: wpos(-12.2, 0.5, 52.5), r: 2.2, zone: 0, kind: 'chest', id: 'mine.chest', cell: 'mine', loot: [['silverthread', 1], ['gold', 55], ['oil', 2], ['potion', 1]], foremanLock: true });
  // the trap: cord, slab, three states
  mine_trap(wpos);
  // the lantern's light
  const L = MINE.lamp.light = addLight([0, -9999, 0], 9.5, [2.9, 1.7, 0.7], 0, 'mine'); L.power = e => (World.cell && World.cell.id === "mine") ? (MINE.lamp.on ? 0.92 + 0.08 * Math.sin(e.time * 9.1) : 0.12) : 0;
  // the cold light of the deep, and of the cleft
  for (const [x, y, z, r, c] of [[-2, 4.6, 67, 14, [0.9, 1.5, 2.6]], [-12, 3.2, 56, 10, [0.7, 1.2, 2.2]], [44, 3.0, 58, 9, [0.6, 1.0, 1.8]], [-3, 5, 54, 10, [0.7, 1.2, 2.2]], [-32, 6.8, 60, 12, [0.85, 1.15, 1.35]]]) { const l = addLight(wpos(x, y, z), r, c, 0, 'hum'); MINE.lights.push(l); }
}
function mine_cleftOutside(cx, cz, cy) {
  // a fissure in the cliff above the fall: two leaning slabs, a black slot between, ferns and a trickle
  const pack = new MeshPack(); pack.shadow = false; const m = new Mesh(1024); m.seed = 77; m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0;
  m.push().T(cx, cy, cz);
  m.mat(MAT.PLAIN, [0.015, 0.015, 0.018]); m.box(-0.55, -0.1, -2.2, 0.55, 2.7, -0.2);
  m.mat(MAT.ROCK, [0.52, 0.5, 0.47], 0.6); for (const s of [-1, 1]) { m.push().T(s * 0.95, 0, 0).RZ(-s * 0.1); m.lathe([[1.0, -0.6], [0.8, 0.8], [0.55, 2.2], [0.3, 3.2], [0.04, 3.6]], 7, 0); m.pop(); }
  m.mat(MAT.ROCK, [0.4, 0.38, 0.36], 0.6); m.box(-1.2, 2.55, -0.9, 1.2, 3.1, 0.5); for (let i = 0; i < 10; i++) { const a = (i - 4.5) * 0.45; m.ball(Math.sin(a) * 2.1, 0.2, 0.3 + Math.cos(a) * 0.8, 0.35 + (i % 3) * 0.12, 0.3, 0.35, 6, 3); }
  m.pop();
  addBoxCollider(m, cx - 1.8, cz - 0.4, cx + 1.8, cz + 0.4, cy - 1, cy + 3);      // (the slabs; the slot between them is open)
  pack.add(m, { kind: 'opaque', maxDist: 100, noShadow: true }); pack.upload('mine-cleft'); World.packs.push(pack);
  WB.kit.hermit = WB.kit.hermit || []; for (const [dx, dz, n, s] of [[-1.5, 1.0, 'Fern_1', 1.4], [1.6, 1.2, 'Fern_1', 1.2], [0.2, 1.9, 'weed_plant_02_a', 2.2]]) WB.kit.hermit.push({ name: n, x: cx + dx, y: cy, z: cz + dz, s, ry: dx, rx: 0, rz: 0 });
}
// ── the trap: a cord across the adit at ankle height, a slab on a rope above it. Step over it (jump), cut it, or take the slab on the head ──
function mine_trap(wpos) {
  const [tx, tz] = MINE.AT.trap, O = MINE.O, FY = MINE.FY, pack = new MeshPack(); pack.shadow = false;
  const mk = fn => { const m = new Mesh(512); m.seed = 5; m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0; m.push().T(O[0] + tx, FY, O[2] + tz); fn(m); m.pop(); return m; };
  const posts = mm => { mm.mat(MAT.METAL, COL.black); for (const s of [-1, 1]) { mm.cbox(s * 1.72, 0.12, 0, 0.1, 0.34, 0.1, 4); mm.cbox(s * 1.72, 0.5, 0, 0.16, 0.05, 0.16, 4); } };
  const slab = (mm, y) => { mm.mat(MAT.ROCK, [0.46, 0.44, 0.42], 0.6); mm.box(-1.05, y, -1.0, 1.05, y + 0.45, 1.0); mm.ball(0, y + 0.45, 0, 0.8, 0.2, 0.7, 7, 3); };
  const cordTaut = mm => { mm.mat(MAT.CLOTH, [0.8, 0.74, 0.58], 0.3); mm.beam([-1.72, 0.3, 0], [1.72, 0.3, 0], 0.025, 0.025); mm.beam([1.72, 0.3, 0], [1.72, 1.2, 0.1], 0.02, 0.02); mm.beam([1.72, 1.2, 0.1], [1.1, 2.66, 0.9], 0.02, 0.02); };
  const ropes = mm => { mm.mat(MAT.CLOTH, [0.55, 0.46, 0.33], 0.3); for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]]) mm.beam([x, 2.9, z], [x * 0.3, 3.1, z * 0.3], 0.03, 0.03); mm.mat(MAT.TIMBER, COL.timberDark); mm.beam([-1.9, 3.08, 0], [1.9, 3.08, 0], 0.2, 0.2); };
  const set = mk(mm => { posts(mm); cordTaut(mm); ropes(mm); slab(mm, 2.45); });
  const sprung = mk(mm => { posts(mm); mm.mat(MAT.CLOTH, [0.8, 0.74, 0.58], 0.3); mm.beam([-1.72, 0.3, 0], [-1.0, 0.04, 0.3], 0.025, 0.025); mm.beam([1.72, 0.3, 0], [0.9, 0.04, -0.2], 0.025, 0.025); ropes(mm); slab(mm, 0.0); mm.mat(MAT.ROCK, [0.4, 0.38, 0.36], 0.5); for (let i = 0; i < 7; i++) mm.ball(-1.0 + i * 0.35, 0.1, (i % 2 ? 1 : -1) * 1.15, 0.2, 0.14, 0.2, 5, 3); });
  const cut = mk(mm => { posts(mm); mm.mat(MAT.CLOTH, [0.8, 0.74, 0.58], 0.3); mm.beam([-1.72, 0.3, 0], [-1.3, 0.05, 0.2], 0.025, 0.025); mm.beam([1.72, 0.3, 0], [1.4, 0.06, -0.2], 0.025, 0.025); mm.beam([1.72, 0.3, 0], [1.72, 1.2, 0.1], 0.02, 0.02); ropes(mm); slab(mm, 2.45); });
  MINE.trapItems = [pack.add(set, { kind: 'opaque', cell: 'mine', nearOnly: true, noShadow: true }), pack.add(sprung, { kind: 'opaque', cell: 'mine', nearOnly: true, noShadow: true }), pack.add(cut, { kind: 'opaque', cell: 'mine', nearOnly: true, noShadow: true })];
  pack.upload('mine-trap'); World.packs.push(pack);
  World.interact.push({ kind: 'cord', id: 'mine.cord', p: wpos(tx + 1.6, 0.5, tz), r: 2.0, zone: 0, cell: 'mine' });
  const inner = sceneUpdate; sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    if (!MINE.trapMeshes) { MINE.trapMeshes = MINE.trapItems.map(it => (SC.statics.find(s => s.it === it) || {}).mesh); }
    const st = MINE_S().trap | 0; MINE.trapMeshes.forEach((me, i) => { if (me) me.visible = me.visible && i === st; });
  };
}
// ── the lantern: carried, lit with L, burning oil while the mine is dark; a dry lantern is no light at all ──
function mineLampOn() { return !!(World.cell && World.cell.id === 'mine' && has('lantern') && S.flags.lampOff !== 1 && MINE_S().oil > 0); }
function mineTick(dt) {
  const c = World.cell; if (!MINE.built || !c || c.id !== 'mine') { MINE.lamp.on = false; mineGauge(false); return; }
  mineGauge(has('lantern'));
  const ms = MINE_S();
  if (has('lantern') && S.flags.lampOff !== 1 && ms.oil <= 0) {
    if (has('oil')) { give('oil', -1); ms.oil = 600; toast('You trim the wick and fill the lantern from a flask.'); } else if (!MINE.lamp.warnedDry) { MINE.lamp.warnedDry = true; toast('The lantern is dry. Without oil the dark is complete.'); }
  } else if (ms.oil > 0) MINE.lamp.warnedDry = false;
  const on = mineLampOn(); MINE.lamp.on = on;
  if (on) { ms.oil = Math.max(0, ms.oil - dt); if (ms.oil < 45 && !MINE.lamp.warnedLow) { MINE.lamp.warnedLow = true; toast('The lantern gutters. It wants oil.'); } if (ms.oil > 90) MINE.lamp.warnedLow = false; }
  const L = MINE.lamp.light, P = Player.pos, f = [Math.sin(Player.yaw), 0, -Math.cos(Player.yaw)];
  L.p[0] = P[0] + f[0] * 0.35; L.p[1] = P[1] + 1.35; L.p[2] = P[2] + f[2] * 0.35; const LK = TEST && TEST.lantern === 0 ? 0 : 1; L.r = on ? 15 + 4 * LK : 2.6; L.c[0] = on ? 10.5 + 4.5 * LK : 0.5; L.c[1] = on ? 6.4 + 2.2 * LK : 0.3; L.c[2] = on ? 2.9 + 0.5 * LK : 0.12;      /* coordinator: at 2.9 the lit lantern showed almost nothing on screen (mean pixel 14 of 255); the carried light must make the tunnel readable for ten metres */
  MINE.lamp.dark = !on;
  if (mineTrapCheck) mineTrapCheck();
}
function mineTrapCheck() {
  const ms = MINE_S(); if (ms.trap) return; const O = MINE.O, FY = MINE.FY, P = Player.pos, [tx, tz] = MINE.AT.trap;
  if (Math.abs(P[0] - (O[0] + tx)) < 1.9 && Math.abs(P[2] - (O[2] + tz)) < 0.3 && P[1] < FY + 0.42) {
    ms.trap = 1; Snd.event('hit.wood', [P[0], P[1] + 1, P[2]]); setTimeout(() => Snd.event('hit.metal', [P[0], P[1], P[2]]), 120);
    toast('The cord snaps. A slab of rock comes down on you.'); RPG.damage(24, null, 'fall'); RPG.shake = 1; save();
  }
}
// the lantern key; the cell's dark; the first time through either door the mine counts as open
function mineLamp() { if (!(World.cell && World.cell.id === 'mine' && has('lantern'))) return toast('There is no use for a lantern here.'); S.flags.lampOff = S.flags.lampOff === 1 ? 0 : 1; toast(S.flags.lampOff === 1 ? 'You douse the lantern.' : (MINE_S().oil > 0 ? 'You light the lantern.' : 'The lantern is dry.')); if (typeof Inv !== 'undefined' && Inv.render && UI.inv) Inv.render(); }
document.addEventListener('keydown', e => { if (e.code === 'KeyL' && !e.repeat && game.playing && !Player.locked && World.cell && World.cell.id === 'mine' && has('lantern')) mineLamp(); });
// the oil gauge: a thin amber bar under the objective while the lantern is carried in the mine (a phone has no L key: the inventory's Light/Douse button does the same)
function mineGauge(show) { let g = document.getElementById('oilgauge'); if (!g) { if (!show) return; g = document.createElement('div'); g.id = 'oilgauge'; g.style.cssText = 'position:fixed;left:calc(var(--pl,0px) + 14px);top:62px;width:70px;height:5px;background:rgba(0,0,0,.45);border:1px solid rgba(214,180,110,.35);z-index:5;pointer-events:none'; g.innerHTML = '<i style="display:block;height:100%;background:#d9a441;width:100%"></i>'; document.body.appendChild(g); } g.style.display = show ? '' : 'none'; if (show) { const o = MINE_S().oil, f = g.firstChild; f.style.width = Math.max(0, Math.min(100, o / 6)) + '%'; f.style.background = S.flags.lampOff === 1 ? '#6b5a3a' : (o < 90 ? '#c8502a' : '#d9a441'); } }

const _ce94 = Cells.env;
Cells.env = function (e) { e = _ce94(e); const c = Cells.cur; if (c && c.id === 'mine') { const k = MINE.dbg || 1.6; if (MINE.lamp.on && !MINE.dbg) { e.ambSky = [0.18, 0.13, 0.08]; e.ambGnd = [0.10, 0.075, 0.046]; e.fogDensity = 0.062; } else { e.ambSky = [0.018 * k, 0.020 * k, 0.026 * k]; e.ambGnd = [0.010 * k, 0.011 * k, 0.013 * k]; e.fogDensity = 0.07; } } return e; };      /* the carried lantern is a wide point light (r 19) plus a modest warm ambient that the dark fog swallows with distance: a pool of light with dark beyond it, never a black screen */
const _cc94 = Cells.change;
Cells.change = function (c) { _cc94(c); if (c && c.id === 'mine') { if (!S.flags.mineOpen) { S.flags.mineOpen = 1; if (typeof uiObjective === 'function') uiObjective(); } if (has('lantern') && !MINE_S().oil) MINE_S().oil = 600; } };
const _wa94 = World.waterAt;
World.waterAt = (x, z) => { if (MINE.built && x > MINE.O[0] + 9 && x < MINE.O[0] + 31 && z > MINE.O[2] + 29 && z < MINE.O[2] + 35) return MINE.FY - 0.06; return _wa94(x, z); };
// ── use: cut the cord; the Foreman's chest wants his key; Corwin's journal ──
const _il94 = interactLabel, _iu94 = interactUse;
interactLabel = function (it) {
  if (it.kind === 'cord') return (MINE_S().trap | 0) === 0 ? 'Cut the cord' : null;
  if (it.id === 'mine.chest' && !S.opened[it.id]) return has('foremankey') ? 'Open the Foreman’s strongbox' : 'Strongbox';
  return _il94(it);
};
interactUse = function (it) {
  if (it.kind === 'cord') { MINE_S().trap = 2; Snd.event('hit.metal', it.p); toast('You cut the cord. The slab stays up on its rope.'); save(); return; }
  if (it.foremanLock && !S.opened[it.id] && !has('foremankey')) { Audio2.door(0.4); return toast('Locked. A brass lock, worn bright. The man who counted heads will have the key.'); }
  if (it.journal && !it.gone) { const r = _iu94(it); S.flags.corwin = 1; setTimeout(() => { if (!uiBusy() && !Cells.busy && !RPG.dead) openReader('Corwin’s journal', MINE_JOURNAL); }, 350); if (typeof mainSync === 'function') mainSync(); save(); return r; }
  return _iu94(it);
};
const MINE_JOURNAL = 'Corwin, miner: the last of the old shift left above ground. Third week of the dry.\n\nI came down for the silver and I have found it, and it is singing.\n\nThe seal at the bottom of the adit was never a seal: the sexton’s key turns it from this side. They put bread out on the slab at the mouth of the deep each dawn. Somebody is eating it. Somebody is counting heads in the dark: one, two, three, all the way to eleven. I make it twelve. Twelve boots stood in a row by the water, and the Foreman standing in front of them, patient.\n\nThe bread stopped coming. I heard the rope stop. I have not been hungry. That frightens me more than the dark does.\n\nIf you read this, go back up. Go to the Hart. The cellar has a way down to the lake shore, and the bread went out by that road. Tell Hale. Tell him the bell.\n\nI will go and ask the Foreman for my shift.';
// ── scanned rock, roots and timber (kits/dungeon.glb), placed once the kit is ready ──
const MINE_ROCKS = [['rock_face_02', 1.06, 0.4], ['boulder_01', 0.91, 0.25], ['namaqualand_boulder_03', 1.53, 0.2], ['rock_face_01', 1.91, 0.15]];
function mineKit() {
  if (!MINE.built || MINE.kitDone || typeof kitReady !== 'function' || !kitReady() || !Kit.pieces.rock_face_01) return; MINE.kitDone = true;
  const O = MINE.O, FY = MINE.FY, G = MINE.grid, B = Kit.batch({ name: 'mine', cell: 14 });
  const add = (n, x, y, z, ry, s, rx) => { if (!Kit.pieces[n]) return; B.add(n, Kit.matrix({ p: [O[0] + x, FY + y, O[2] + z], r: [rx || 0, ry || 0, 0], s: s || 1 }), { zone: 0, skyVis: 0.3, cast: false, tint: /^namaqualand/.test(n) ? [0.36, 0.5, 0.62] : /^rock_face/.test(n) ? [0.4, 0.5, 0.58] : [0.5, 0.48, 0.46] }); };      // [fx2] the scanned boulders came out orange: cooler, duller rock
  const NRM = { W: [1, 0, 0], E: [-1, 0, 0], N: [0, 0, -1], S: [0, 0, 1] }, POS = { W: (i, j) => [i, j + 0.5], E: (i, j) => [i + 1, j + 0.5], N: (i, j) => [i + 0.5, j + 1], S: (i, j) => [i + 0.5, j] };
  const pick = h => { let a = 0; for (const r of MINE_ROCKS) { a += r[2]; if (h < a) return r; } return MINE_ROCKS[0]; };
  for (const k of ['W', 'E', 'N', 'S']) for (const [i, j] of G.edges[k]) {
    const h = mhash(i, j, 50 + k.charCodeAt(0)); if (h > 0.4) continue;       // [fx1] 0.14 left the gravel heap bare between a few rocks
    const r = pick(mhash(i, j, 61)), n = NRM[k], p = POS[k](i, j), s = 0.8 + mhash(i, j, 62) * 0.5, hd = r[1] * s, prot = 0.12 + mhash(i, j, 63) * 0.18;
    add(r[0], p[0] + n[0] * (prot - hd), -0.15, p[1] + n[1] * (prot - hd), Math.atan2(n[0], n[2]) + (mhash(i, j, 64) < 0.5 ? 0 : PI) * 0, s);
  }
  // roots hanging from the roof where the ground above is thin
  // (roots hung from the roof read as slabs: left out)
  // the fall across the stope: scanned boulders heaped over the procedural ones
  { const A = MINE.AT.rubble, nm = ['namaqualand_boulder_04', 'namaqualand_boulder_02', 'boulder_01', 'namaqualand_boulder_03'];
    for (let layer = 0; layer < 2; layer++) for (let x = A[0][0] + 0.2; x < A[1][0] - 0.4; x += 2.3 - layer * 0.5) for (let z = A[0][1] + 0.4 + layer * 0.5; z < A[1][1] - 0.3; z += 1.5) add(nm[(Math.round(x * 3 + z) & 3)], x + (mhash(x * 9, z * 9, 80) - 0.5) * 0.6, layer * 0.9 - 0.15, z + (mhash(x * 9, z * 9, 81) - 0.5) * 0.5, mhash(x * 9, z * 9, 82) * TAU, 0.95 + mhash(x * 9, z * 9, 83) * 0.5); }
  // roots along the floor and fallen timber
  for (const [x, z, r] of [[-11, 31.5, 0.4], [42, 36, 1.2], [12, 59.4, 2], [36.5, 44, 0.3]]) add('single_root', x, 0, z, r, 1.0);
  add('dead_tree_trunk_02', 33.4, 0, 51.2, 0.5, 1.0); add('dead_tree_trunk_02', 44.5, 1.1, 54.6, 2.3, 0.9); add('dead_tree_trunk_02', 7.5, 0, 35.2, 1.3, 0.7);
  // the doors: the hillside door's twin standing open at the foot of the adit; a bulkhead leaf folded back at the mouth of the deep
  add('large_castle_door', 1.15, 0, 1.4, -PI / 2 - 0.35, 1.0); add('large_castle_door', 9.7, 0, 58.2, PI / 2, 1.0);
  const g = B.build(); g.traverse(o => { if (o.isMesh) { o.layers.set(1); o.castShadow = false; } }); SC.scene.add(g);
  World.kitGroups = World.kitGroups || []; World.kitGroups.push({ g, interior: true, cell: 'mine' }); MINE.kitCount = B.count;
}
const _wa94b = wildsAttach;
wildsAttach = function () { _wa94b(); try { mineKit(); } catch (e) { console.warn('mine kit: ' + (e && e.stack || e)); } };
// the objective marker: outside, the door; inside, Corwin's station
MINE.target = function () { const P = WILDS.P.mine; if (!(World.cell && World.cell.id === 'mine')) return [P.x, 0, P.z]; const w = MINE.wpos(-9.4, 0.8, 66.2); return [w[0], w[1], w[2]]; };
