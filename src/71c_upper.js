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
