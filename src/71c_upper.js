// ───────────────────────── upper floors of the village buildings (the structure comes from 71b_storeys.js) ─────────────────────────
// Each UPPER[id](c) runs inside buildHouse after the kit shell and before the ground floor is furnished: it lays the stair along the back wall
// (bottom at the right-hand end, away from the hearth), the slab with its stairwell and rails, and furnishes the room above.
// The spots it adds (bed, bed2, stairs0, stairs1) carry the names the villagers' schedules already use.
const UPPER = {};
const houseStair = (c, o) => { const B = bounds(c); return buildStair(c, Object.assign({ name: 'stairs', axis: 'x', dir: -1, lane: B.z1 - 1.05, n0: B.x1 - 1.25, H: c.H, rise: c.H + FLOOR_T - 0.02, exit: -1 }, o)); };
const houseFloor = (c, S, o) => upperFloor(c, Object.assign({ holes: [S.hole], rails: S.rails }, o));
function upShelf(c, x, z, rot, len, items, h) { const m = c.int; upAt(c, x, z, rot, () => Props.shelf(m, len, h || 1.9, 3, 0.3, (i, y) => Props.clutter(m, c.R, -len / 2 + 0.15, len / 2 - 0.15, y, 0, items || ['pot', 'jug', 'bowl', 'book', 'bottle'], 3))); }
function upTable(c, x, z, rot, len, wid, items, stools) {
  const m = c.int;
  upAt(c, x, z, rot, () => { Props.table(m, len, wid); Props.clutter(m, c.R, -len / 2 + 0.2, len / 2 - 0.2, 0.76, 0, items || ['mug', 'candle', 'book'], 3, c); if (stools) at(m, 0, 0, wid / 2 + 0.3, 0, () => Props.stool(m)); });
}
const upRug = (c, x, z, w, d, col, rot) => upAt(c, x, z, rot || 0, () => Props.rug(c.int, w, d, col));

UPPER.elder = c => {
  const B = bounds(c), S = houseStair(c), Hf = (houseFloor(c, S), c.Hf), m = c.int;
  upBed(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, [0.5, 0.42, 0.3]);
  upChest(c, 'chest', B.x1 - 0.45, 0.2, PI / 2, [['gold', 5]]);
  upTable(c, -0.4, -2.0, 0, 1.5, 0.7, ['book', 'candle', 'book', 'mug'], true);
  upShelf(c, B.x0 + 0.17, -0.9, -PI / 2, 1.6, ['book', 'book', 'candle', 'book']);
  upRug(c, 0.6, -0.5, 2.4, 1.6, COL.blue, 0.1);
  upLantern(c, 0.4, -0.5, Hf + 2.35);
};
UPPER.guardhouse = c => {
  const B = bounds(c), S = houseStair(c), Hf = (houseFloor(c, S), c.Hf), m = c.int;
  upBed(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, [0.45, 0.2, 0.18]);
  upBed(c, 'bed2', B.x1 - 0.62, B.z1 - 3.0, PI, 1.0, [0.45, 0.2, 0.18]);
  upChest(c, 'chest', B.x0 + 0.5, -1.9, 0, [['gold', 6]]);
  upTable(c, -0.6, -1.9, 0, 1.4, 0.7, ['mug', 'plate', 'candle'], true);
  upAt(c, -0.4, B.z0 + 0.1, 0, () => Props.shield(m, [0.55, 0.15, 0.12]));
  upRug(c, 0.4, -0.4, 2.2, 1.5, [0.5, 0.18, 0.14], 0.1);
  upLantern(c, 0.4, -0.4, Hf + 2.35);
};
UPPER.store = c => {
  const B = bounds(c), S = houseStair(c), Hf = (houseFloor(c, S), c.Hf), m = c.int;
  upBed(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, COL.purple);
  upChest(c, 'chest', B.x1 - 0.45, 0.0, PI / 2, [['gold', 8]]);
  // stock room: crates and sacks along the front wall, shelves
  for (const [x, z, r] of [[-3.2, -2.5, 0.2], [-2.45, -2.55, 0.5], [-3.3, -1.7, 0.1]]) upAt(c, x, z, r, () => Props.crate(m, 0.6));
  for (const [x, z, s] of [[2.6, -2.5, 0.33], [3.2, -2.3, 0.3]]) upAt(c, x, z, 0.4, () => Props.sack(m, s));
  upShelf(c, B.x0 + 0.17, 0.0, -PI / 2, 2.0, ['pot', 'jug', 'bowl', 'bottle', 'cheese']);
  upTable(c, 0.8, -2.2, 0, 1.6, 0.7, ['book', 'candle', 'pot'], true);
  upRug(c, 0.4, -0.4, 2.8, 1.8, COL.green, 0.1);
  upLantern(c, 0.4, -0.4, Hf + 2.35);
};
UPPER.weaver = c => {
  const B = bounds(c), S = houseStair(c), Hf = (houseFloor(c, S), c.Hf), m = c.int;
  upBed(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, COL.blue);
  upBed(c, 'bed2', B.x1 - 0.62, B.z1 - 3.0, PI, 1.0, [0.7, 0.4, 0.4]);
  // the spinning corner: bolts on a rack, a table with a basket of wool
  upTable(c, -1.8, -2.2, 0, 1.6, 0.7, ['candle', 'book'], true);
  upAt(c, -3.0, -0.6, PI / 2, () => Props.shelf(m, 1.8, 1.9, 3, 0.3, (i, y) => { for (let k = 0; k < 4; k++) at(m, -0.6 + k * 0.4, y, 0, PI / 2, () => clothBolt(m, c.R.pick([COL.red, COL.blue, COL.green, COL.gold]))); }));
  for (const [x, z] of [[1.4, -2.3], [2.1, -2.5]]) upAt(c, x, z, 0.3, () => Props.sack(m, 0.3, [0.92, 0.9, 0.85]));
  upRug(c, 0.2, -0.5, 2.6, 1.7, COL.red, 0.1);
  upLantern(c, 0.2, -0.5, Hf + 2.35);
};
UPPER.draper = c => {
  const B = bounds(c), S = houseStair(c, { runScale: 0.86 }), Hf = (houseFloor(c, S), c.Hf), m = c.int;
  upBed(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, COL.gold);
  upChest(c, 'chest', B.x1 - 0.45, -0.3, PI / 2, [['gold', 6]]);
  upShelf(c, B.x0 + 0.17, -0.6, -PI / 2, 2.0, ['book', 'pot', 'jug']);
  upTable(c, -0.2, -2.0, 0, 1.6, 0.8, ['candle', 'book'], true);
  upRug(c, 0.3, -0.5, 2.4, 1.6, COL.blue, 0.1);
  upLantern(c, 0.3, -0.5, Hf + 2.35);
};
UPPER.mill = c => {
  const B = bounds(c), S = houseStair(c), Hf = (houseFloor(c, S), c.Hf), m = c.int, hx = 0, hz = -0.6;
  // the hopper above the stones, a grain bin and sacks: this is where the grain is tipped in
  upBed(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 0.95, COL.wool);
  upAt(c, hx, hz, 0, () => {
    m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * 0.75, 0, sz * 0.75, 0.12, 1.1, 0.12, 12);
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.85, 1.1, -0.85, 0.85, 1.18, 0.85);
    m.lathe([[0.2, 1.18], [0.78, 2.0]], 4, 0); m.mat(MAT.PLANKS, COL.woodDark); m.lathe([[0.76, 1.98], [0.82, 2.02], [0.82, 2.1]], 4, 0);
    addBoxCollider(m, -0.9, -0.9, 0.9, 0.9, 0, 2.2);
  });
  for (const [x, z, r] of [[-3.0, -2.4, 0.3], [-2.2, -2.6, 0.6], [-3.1, -1.5, 0.1], [2.8, -2.5, 0.4], [3.2, -1.7, 0.2]]) upAt(c, x, z, r, () => Props.sack(m, 0.34, [0.93, 0.91, 0.86]));
  upAt(c, -1.6, -2.55, 0, () => Props.crate(m, 0.7));
  upAt(c, 1.6, -2.5, 0.3, () => Props.barrel(m));
  upShelf(c, B.x0 + 0.17, -0.5, -PI / 2, 1.6, ['pot', 'jug', 'candle'], 1.8);
  upLantern(c, 0.2, -2.2, Hf + 2.4);
};

// ── gable windows: the plaster of a gable end with holes cut in it, and the kit's open window frames in the holes ──
// wb: the wall's basis (house-local), L: its length, Ytop: where the gable starts, wins: [{ u: position along the wall, sill: height above the gable's foot, s: scale of the kit window }]
function gableFill(c, wb, L, Ytop, wins, placeWin, pass, ext) {
  ext = ext || c.ext; pass = pass || 'both';
  const { zone, tanP, hd } = c, T = 0.25, inset = 0.3, apex = Ytop + hd * tanP - 0.5, col = c.spec.plaster || [1, 0.96, 0.88];
  const P = (u, v, n) => m4.tp(wb, [u, v, n]);
  const hw = 0.6, holes = wins.map(w => (w = Object.assign({ u: L / 2 }, w), { u0: w.u - hw * w.s, u1: w.u + hw * w.s, v0: Ytop + w.sill, v1: Ytop + w.sill + 1.55 * w.s, w })).sort((a, b) => a.u0 - b.u0);
  const left = v => inset + (v - Ytop) / tanP, right = v => L - inset - (v - Ytop) / tanP;       // the fill stops inside the rafters
  const face = (n, flip) => {
    const q = (a, b, cc, d) => flip ? ext.quad(P(a[0], a[1], n), P(d[0], d[1], n), P(cc[0], cc[1], n), P(b[0], b[1], n)) : ext.quad(P(a[0], a[1], n), P(b[0], b[1], n), P(cc[0], cc[1], n), P(d[0], d[1], n));
    // horizontal bands between the window rows, vertical strips beside each hole
    const vs = [Ytop, ...new Set(holes.flatMap(h => [h.v0, h.v1])), apex].sort((a, b) => a - b);
    for (let i = 0; i < vs.length - 1; i++) {
      const va = vs[i], vb = vs[i + 1], vm = (va + vb) / 2, hs = holes.filter(h => vm > h.v0 && vm < h.v1);
      let ua = left(va), ub = left(vb); const segs = []; let cuA = ua, cuB = ub;
      for (const h of hs) { segs.push([cuA, cuB, h.u0, h.u0]); cuA = cuB = h.u1; }
      segs.push([cuA, cuB, right(va), right(vb)]);
      for (const [a0, a1, b0, b1] of segs) { if (b0 - a0 < 0.02 && b1 - a1 < 0.02) continue; if (vb >= apex - 0.001 && Math.abs(b1 - a1) < 0.05) continue; q([a0, va], [b0, va], [b1, vb], [a1, vb]); }
    }
  };
  if (pass !== 'int') { ext.m1 = 0; ext.ao = 1; ext.mat(MAT.PLASTER, col); face(0, false); }
  if (pass !== 'ext') { ext.m1 = zone; ext.ao = INT_AO; ext.mat(MAT.PLASTER, [col[0] * 0.97, col[1] * 0.95, col[2] * 0.9]); face(-T, true); }
  // reveals round each hole, then the frame
  for (const h of holes) {
    if (pass !== 'int') { ext.m1 = 0; ext.ao = 0.8; ext.mat(MAT.TIMBER, c.spec.timber || COL.timber);
    const a = [h.u0, h.v0], b = [h.u1, h.v0], e = [h.u1, h.v1], d = [h.u0, h.v1];
    for (const [p0, p1] of [[a, b], [b, e], [e, d], [d, a]]) ext.quad(P(p0[0], p0[1], 0), P(p1[0], p1[1], 0), P(p1[0], p1[1], -T), P(p0[0], p0[1], -T), 0, 0, 1, 1); }
    ext.ao = 1; ext.m1 = 0; placeWin(kitOpen('Window_Wide_Flat1'), (h.u0 + h.u1) / 2, h.v0 - 0.95 * h.w.s, h.w.s);
  }
  ext.m1 = 0; ext.ao = 1;
}

// ── the sleeping lofts of the single-storey cottages: a floor at the eaves, a steep stair up the end wall, a gable window, head-room clamped under the roof ──
function loftHouse(c, o) {
  const B = bounds(c), Yu = o.Yu || 2.6, lim = c.hd - (Yu + FLOOR_T + 1.9 - c.H) / c.tanP, n0 = B.z1 - 1.05, rs = clamp((n0 + lim - 0.15) / KSTAIR.endZ, 0.42, 0.8), m = c.int;
  c.ceilY = Yu;
  const S = buildStair(c, { name: 'stairs', axis: 'z', dir: -1, lane: B.x1 - 0.74, n0, H: Yu, rise: Yu + FLOOR_T - 0.02, runScale: rs, widthScale: 0.7, exit: -1, exitGap: 1.25, noV: true, limit: [-(lim - 0.55), 1e9] });
  upperFloor(c, { y: Yu, holes: [S.hole], rails: S.rails, ties: false });
  roofClamp(c, B.x0, B.x1, c.Hf, c.H, 1.9);
  const Hf = c.Hf, ez = c.hd - 1.15;       // the beds lie under the eaves, where there is no head-room to waste; the middle strip stays clear
  for (const [k, x, side, bl] of o.beds) upBed(c, k, B.x0 + x, side * ez, PI / 2, 0.95, bl);
  for (const [x, side] of o.stuff || [[1.0, -1]]) upAt(c, B.x0 + x, side * (c.hd - 0.8), 0.3, () => Props.crate(m, 0.55));
  upChest(c, 'chest', B.x0 + o.chest[0], -ez, 0, [['gold', 4]]);
  upRug(c, o.rug === undefined ? -0.3 : o.rug, 0, 1.8, 1.0, o.rugCol || COL.red, 0.1);
  upLantern(c, o.rug === undefined ? -0.3 : o.rug, 0.0, Hf + 2.2);
}
UPPER.hunter = c => loftHouse(c, { beds: [['bed', 1.2, 1, [0.4, 0.3, 0.2]]], chest: [1.0, -1], stuff: [[2.4, 1]], rugCol: [0.5, 0.4, 0.3] });
UPPER.fisher = c => loftHouse(c, { Yu: 2.45, beds: [['bed', 1.1, 1, [0.3, 0.42, 0.5]]], chest: [1.0, -1], stuff: [[2.2, 1]], rug: -0.2, rugCol: [0.3, 0.4, 0.5] });
UPPER.farm = c => loftHouse(c, { beds: [['bed', 1.2, 1, COL.gold], ['bed2', 3.4, 1, COL.green]], chest: [1.2, -1], stuff: [[2.6, -1], [4.0, -1]], rugCol: COL.gold });
UPPER.herbalist = c => loftHouse(c, { beds: [['bed', 1.2, 1, COL.purple]], chest: [1.0, -1], stuff: [[2.6, 1], [2.6, -1]], rugCol: COL.green });
