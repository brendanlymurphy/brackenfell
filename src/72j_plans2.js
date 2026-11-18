// ───────────────────────── designed plans, second set [c4]: guardhouse, herbalist ─────────────────────────
// Same frame and rules as 72h_trades.js. Each is added to PLAN_SHIP at the foot of this file only when designed, dressed, lit, validated and looked at.
// ── props ──
PD.spearRack = R => m => {
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-0.55, 0.55]) m.box(sx - 0.04, 0, -0.18, sx + 0.04, 0.12, 0.18); for (const z of [-0.12, 0.12]) { m.box(-0.58, 0.45, z - 0.02, 0.58, 0.5, z + 0.02); m.box(-0.58, 1.1, z - 0.02, 0.58, 1.15, z + 0.02); }
  for (let i = 0; i < 7; i++) { const x = -0.5 + i * 0.167, z = (i % 2 ? 0.08 : -0.08); m.push().T(x, 0.1, z).RZ(R.s() * 0.04); m.mat(MAT.TIMBER, COL.wood); m.box(-0.013, 0, -0.013, 0.013, 1.9, 0.013); m.mat(MAT.METAL, [0.9, 0.9, 0.95]); m.box(-0.025, 1.9, -0.006, 0.025, 2.1, 0.006); m.pop(); }
  addBoxCollider(m, -0.6, -0.2, 0.6, 0.2, 0, 2.1);
};
PD.bars = len => m => {         // [fin] a run of round iron bars, 25 mm across at 0.12 m centres, in a frame of flat iron straps (posts, a rail at the foot, the middle and the head), with a lock plate and a hasp at the gate
  m.mat(MAT.METAL, [0.2, 0.19, 0.18]);
  const n = Math.max(1, Math.round(len / 0.12)), st = len / n;
  for (const y of [0.1, 1.3, 2.4]) m.box(-len / 2, y, -0.025, len / 2, y + 0.07, 0.025);
  for (const x of [-len / 2, len / 2]) m.box(x - 0.04, 0, -0.04, x + 0.04, 2.47, 0.04);
  for (let i = 1; i < n; i++) { const x = -len / 2 + i * st; m.cyl(x, 0.0, 0, 0.0125, 0.0125, 2.4, 6, 1); }
  const gx = -len / 2 + Math.round(n * 0.5) * st;
  m.box(gx - 0.07, 1.0, -0.045, gx + 0.07, 1.22, 0.045); m.mat(MAT.METAL, [0.1, 0.095, 0.09]); m.box(gx - 0.012, 1.08, 0.04, gx + 0.012, 1.14, 0.065); m.box(gx - 0.05, 1.12, 0.045, gx + 0.05, 1.16, 0.075);
  addBoxCollider(m, -len / 2, -0.06, len / 2, 0.06, 0, 2.5);
};
PD.still = m => {         // a copper still on a brick furnace with a worm coil
  m.mat(MAT.STONE, [0.9, 0.85, 0.8]); m.box(-0.4, 0, -0.35, 0.4, 0.55, 0.35); m.mat(MAT.PLAIN, [0.08, 0.06, 0.05]); m.box(-0.18, 0.5, 0.34, 0.18, 0.62, 0.36, 4);
  m.mat(MAT.METAL, [1.0, 0.62, 0.38]); m.lathe([[0.05, 0.55], [0.3, 0.62], [0.34, 0.85], [0.22, 1.1], [0.1, 1.28], [0.07, 1.4]], 10, 1);
  m.push().T(0.5, 0, 0); m.lathe([[0.2, 0.35], [0.22, 0.7], [0.2, 1.05], [0.17, 1.15]], 9, 1); m.pop(); m.beam([0.07, 1.4, 0], [0.44, 1.1, 0], 0.05, 0.05);
  m.mat(MAT.PLANKS, COL.wood); m.box(0.7, 0.0, -0.1, 1.0, 0.3, 0.1); m.mat(MAT.PLAIN, COL.glass); m.cyl(0.85, 0.3, 0, 0.07, 0.07, 0.2, 7, 1);
  addBoxCollider(m, -0.45, -0.4, 1.05, 0.4, 0, 1.4);
};
PD.planter = R => m => {
  m.mat(MAT.PLANKS, COL.wood); m.box(-0.5, 0, -0.2, 0.5, 0.3, 0.2); m.mat(MAT.SOIL, [0.6, 0.5, 0.4]); m.box(-0.46, 0.27, -0.16, 0.46, 0.31, 0.16, 4);
  for (let i = 0; i < 9; i++) { m.mat(MAT.CLOTH, R.pick([[0.26, 0.42, 0.18], [0.35, 0.5, 0.2], [0.45, 0.4, 0.22], [0.5, 0.3, 0.45]]), 0.5); m.ball(-0.4 + i * 0.1, 0.45 + R() * 0.15, R.s() * 0.1, 0.07, 0.12 + R() * 0.08, 0.07, 5, 4); }
  addBoxCollider(m, -0.5, -0.2, 0.5, 0.2, 0, 0.5);
};
PD.apothecaryTable = len => m => {         // workbench of jars, a mortar, scales, a candle-less ledger and little drying bundles
  Props.table(m, len, 0.8, 0.9); const h = 0.9, R = { s: () => 0.01 };
  at(m, -len / 2 + 0.3, h, 0, 0, () => { m.mat(MAT.PLAIN, [0.55, 0.5, 0.45]); m.lathe([[0.06, 0], [0.1, 0.02], [0.11, 0.1], [0.12, 0.12]], 9, 1); m.mat(MAT.TIMBER, COL.wood); m.cyl(0.14, 0, 0.0, 0.015, 0.015, 0.2, 5, 2); });
  for (let i = 0; i < 4; i++) at(m, -len / 2 + 0.9 + i * 0.28, h, 0.15 - (i % 2) * 0.3, i, () => PD.ware[i % 2 ? 'jar' : 'flask'](m, { pick: a => a[i % a.length] }));
  at(m, len / 2 - 0.4, h, 0, 0.3, () => { m.mat(MAT.METAL, COL.bronze); m.box(-0.015, 0, -0.015, 0.015, 0.3, 0.015); m.box(-0.2, 0.29, -0.01, 0.2, 0.305, 0.01); for (const sx of [-0.19, 0.19]) m.lathe([[0.0, 0.18], [0.07, 0.185], [0.075, 0.195]], 8, 1); });
  m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(len / 2 - 1.0, h, -0.1, len / 2 - 0.7, h + 0.04, 0.1);
};
// a doorway's worth of herbs hung to dry: many bundles on short rods across the ceiling (no light)
PD.dryRow = (R, len) => PD.rack;

// ── the guardhouse: the guard room first (a long table, the weapon wall facing the door, the hearth), the armoury and the cells behind, bunks upstairs ──
//    ground  guard room (12 x 6)  |  cells (west) + armoury (east) behind        up: barracks over the whole footprint
PLANS.guardhouse = (P, c, info) => {      /* [inout] the shell: 7.2 x 5.6 m, two storeys, a balcony over the door; 8.5 x 7 inside. Hale and Ivo: the watch was four once */
  const R = P.R, id = P.id, B = pFitBox(c), X0 = B.x0, X1 = B.x1, D = B.D, Zp = 4, Xc = X0 + 4, H0 = 2.8; P.dims = { W: B.W, D, Dh: Zp };
  pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  pRoom(P, 0, 'guard', 'hall', X0, 0, X1, Zp, { floor: 'stone' }); pRoom(P, 0, 'cells', 'store', X0, Zp, Xc, D, { floor: 'stone', tint: [0.7, 0.66, 0.62] }); pRoom(P, 0, 'armoury', 'store', Xc, Zp, X1, D, { floor: 'stone' });
  pRoom(P, 1, 'barracks', 'bedroom', X0, 0, X1, D);
  pDoor(P, 'guard', null, 0, 0); pDoor(P, 'guard', 'cells', X0 + 0.9, Zp); pDoor(P, 'guard', 'armoury', X1 - 1.6, Zp);
  const SHL = pShellWins(P, c, B);
  const bd = SHL.list.find(f => f.kind === 'door' && f.lv === 1); if (bd) pUpperDoor(P, P.rooms.barracks, bd, Math.round(SHL.pos(bd) * 4) / 4);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: X0 + 1.7, z: Zp - 0.65, width: 0.9, tread: 0.22 });
  pLayout(P); pKeepStairHeads(P); pBalconies(P, c);
  const guard = P.rooms.guard, cells = P.rooms.cells, arm = P.rooms.armoury, bar = P.rooms.barracks;
  // the guard room: the fire on the gable wall, the table with the roster, a weapon stand, two cloaks on the pegs, Hugh Alder's arrows still tied
  let hh = null; for (const [sd, a] of [['e', 1.9], ['e', 2.4], ['w', 1.6]]) if ((hh = pHearth(P, guard, sd, 1.5, { cauldron: true, size: 0.45, at: a }))) break;
  P.hall = { room: guard, hh }; if (hh) { pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  const tb = pDining(P, guard, 1.8, 0.85, { near: [X0 + 2.3, 1.6], id: 'table', n: 2, items: ['mug', 'book', 'candle'], rots: [0] });
  if (tb) { tb.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0)); }
  pPiece(P, guard, 'WeaponStand', { side: ['n', 'e'], at: X1 - 1.4 }); pKitWall(P, guard, 'n', X0 + 1.2, 'Peg_Rack');
  pFree(P, guard, id + '.arrows', 0.5, 0.4, 0.9, 0, m2 => { m2.mat(MAT.TIMBER, COL.wood); for (let k = 0; k < 2; k++) { m2.cyl(-0.12 + k * 0.24, 0, 0, 0.07, 0.07, 0.85, 7, 1); m2.mat(MAT.CLOTH, [0.6, 0.55, 0.45], 0.5); m2.cyl(-0.12 + k * 0.24, 0.6, 0, 0.08, 0.08, 0.06, 7, 1); m2.mat(MAT.TIMBER, COL.wood); } }, { near: [X1 - 1.0, 3.2], lowOk: true });
  pPiece(P, guard, 'wooden_lantern_01', { near: [tb ? tb.x + 0.6 : X0 + 3, tb ? tb.z : 1.6], lit: 6, soft: true, opt: { lowOk: true, surface: false } });
  { const e = P.doors.find(d => d.b === null); if (e) pPut(P, guard, id + '.mat', e.x, 1.1, 0, 2.0, 1.3, 0.02, pdRug(2.0, 1.3, [0.28, 0.22, 0.2]), { flat: true, noClear: true }); }
  // the cell: bars across it with the gate, a plank bed, the bucket; old tallies scratched on the wall
  pPut(P, cells, id + '.bars', (X0 + Xc) / 2, Zp + 1.1, 0, Xc - X0 - 0.4, 0.14, 0.84, PD.bars(Xc - X0 - 0.6), { lowOk: true, noClear: true, allow: ['path', 'door'] });
  pAgainst(P, cells, 's', id + '.pallet', 1.9, 0.8, 0.45, 0, m2 => { m2.mat(MAT.PLANKS, COL.woodDark); m2.box(-0.95, 0, -0.4, 0.95, 0.4, 0.4); m2.mat(MAT.CLOTH, [0.4, 0.34, 0.26], 0.5); m2.box(-0.6, 0.4, -0.3, 0.3, 0.45, 0.3); }, { at: X0 + 1.4, lowOk: true });
  pPiece(P, cells, 'wooden_bucket_01', { side: ['e', 's'], at: D - 0.5 }); pTorch(P, cells, 'n', X0 + 2.6, 1.7, 5) || pTorch(P, cells, 'e', Zp + 0.6, 1.7, 5);
  // the armoury: two stands, shields, a crate of arrows; the first Warden's kettle hat on a shelf
  pPiece(P, arm, 'WeaponStand', { side: ['s'], at: Xc + 1.0, id: 'stand2' }); pPiece(P, arm, 'Crate_Wooden', { side: ['e', 's'], at: D - 0.6 });
  for (const [nm, u] of [['Shield_Wooden', Zp + 1.0], ['kite_shield', Zp + 2.0]]) pKitWall(P, arm, 'e', u, nm);
  pPiece(P, arm, 'Shelf_Small_Bottles', { side: ['w'], at: Zp + 1.6 }) ; pTorch(P, arm, 'n', X1 - 1.0, 1.7, 5) || pLamp(P, arm, Xc + 2, Zp + 1.5);
  // the barracks over it all: two beds in use, two chests, the straw dummy in the corner, Ivo's letter by his bed
  dressBedroom(P, bar, { beds: castBeds(P.id, ['bed', 'bed2']), loot: [['gold', 6]], bedInteract: true, table: true });
  pPiece(P, bar, 'treasure_chest', { side: ['s', 'w'], id: 'chestH' }); pPiece(P, bar, 'Dummy', { side: ['s', 'e', 'w'] }); pPiece(P, bar, 'wooden_candlestick', { near: [X1 - 2.2, D - 1.5], lit: 4, soft: true, opt: { lowOk: true } });
  if (!hh) P.err.push('no hearth fits in the guard room');
};

// ── the herbalist's: a low shop hung with drying herbs, a counter of jars, the still and the workbench beyond, her bedchamber, the physic garden's door ──
//    ground  shop (10 x 6)  |  workroom (west) + bedchamber with a hearth (east)
PLANS.herbalist = (P, c, info) => {      /* [inout] the shell: 6.6 x 5.6 m, one storey; 8.5 x 6.5 inside: the front room where she sells, the stillroom and her chamber behind */
  const R = P.R, id = P.id, B = pFitBox(c), X0 = B.x0, X1 = B.x1, D = B.D, Zp = 3, Xs = X0 + 4; P.dims = { W: B.W, D, Dh: Zp };
  pLevel(P, 0, 0, 2.7);
  pRoom(P, 0, 'shop', 'shop', X0, 0, X1, Zp, { floor: 'stone' }); pRoom(P, 0, 'workroom', 'store', X0, Zp, Xs, D, { floor: 'stone' }); pRoom(P, 0, 'chamber', 'hall', Xs, Zp, X1, D);
  pDoor(P, 'shop', null, 0, 0); pDoor(P, 'shop', 'workroom', X0 + 1.4, Zp); pDoor(P, 'workroom', 'chamber', Xs, Zp + 0.9);
  pShellWins(P, c, B);
  pLayout(P);
  const shop = P.rooms.shop, wk = P.rooms.workroom, ch = P.rooms.chamber;
  // the front room: the long table with pestle and bowls she serves across, bottle shelves, herbs from the beams, two stools for those who wait
  const ct = pPut(P, shop, id + '.counter', X1 - 2.0, 2.4, 0, 2.6, 0.8, 0.84, PD.apothecaryTable(2.6), { surface: true, noClear: true, lowOk: true, h: 0.84 });
  if (ct) { pSpot(P, 'home', ct.cx + 0.6, ct.cz + 0.65, PI, { k: 0 }); pSpot(P, 'counter', ct.cx, ct.cz + 0.65, PI, { k: 0 }); pSpot(P, 'front', ct.cx, ct.cz - 0.9, 0, { k: 0 }); }
  pPiece(P, shop, 'Shelf_Small_Bottles', { side: ['w', 'n'], at: 1.6, id: 'jars1' }); pPiece(P, shop, 'Shelf_Small_Bottles', { side: ['n', 'e'], at: X0 + 1.6, id: 'jars2' });
  for (let i = 0; i < 2; i++) pPiece(P, shop, 'painted_wooden_stool', { side: ['n'], at: X1 - 0.8 - i * 0.6, id: 'stool' + i });
  for (const x of [X0 + 1.4, 0.6, X1 - 2.0]) PD.rack(P, shop, x, 1.5, 1.6, 0, ['herb', 'herb', 'garlic', 'herb']);
  pPiece(P, shop, 'wooden_candlestick', { near: [ct ? ct.cx - 1.0 : X1 - 3, 2.4], opt: { lowOk: true, surface: false }, soft: true, lit: 4 });
  { const e = P.doors.find(d => d.b === null); if (e) pPut(P, shop, id + '.mat', e.x, 1.1, 0, 1.8, 1.2, 0.02, pdRug(1.8, 1.2, [0.25, 0.3, 0.2]), { flat: true, noClear: true }); }
  // the stillroom: her fire with the pot on it, the still, the work table where she laid out the drowned man's things, the honey crock
  let hh = null; for (const [sd, a] of [['s', X0 + 1.4], ['w', 5.2], ['s', X0 + 2.4]]) if ((hh = pHearth(P, wk, sd, 1.3, { cauldron: true, size: 0.4, at: a }))) break; P.hall = { room: wk, hh };
  pAgainst(P, wk, 's', id + '.still', 1.3, 0.8, 1.4, 0, PD.still, { at: Xs - 1.0, lowOk: true }) || pAgainst(P, wk, 'n', id + '.still', 1.3, 0.8, 1.4, 0, PD.still, { at: Xs - 1.0, lowOk: true });
  pFree(P, wk, id + '.workbench', 1.1, 0.7, 0.8, 0, pdTable(1.1, 0.7, ['bowl', 'jar', 'bottle'], 3, c), { near: [X0 + 2.6, 4.6], surface: true });
  pPiece(P, wk, 'wooden_bucket_02', { near: [Xs - 0.7, 4.2], sc: 0.8 });
  // her chamber: the bed, the rocker turned to the fire, the chest with the child's shoe
  let lh = null; for (const [sd, a] of [['n', X1 - 1.1], ['e', 4.0], ['e', 5.4]]) if ((lh = pHearth(P, ch, sd, 1.2, { cauldron: false, size: 0.35, at: a }))) break;      /* the fire first: the bed goes where it leaves room */
  dressBedroom(P, ch, { beds: castBeds(P.id, ['bed']), loot: [['gold', 5]], bedInteract: true, table: false });
  if (lh) { const rk = pPiece(P, ch, 'rockingchair_01', { near: [lh.front[0] - 0.3, lh.front[1]], turn: PI / 2, id: 'rocker', soft: true });      /* she sits in it: no collider */ if (rk) pSit(P, 'sit', rk.cx, rk.cz, PI / 2, 0); }
  if (!lh || !P.spots.sit) { const sk = pPiece(P, wk, 'painted_wooden_stool', { near: hh ? [hh.front[0], hh.front[1]] : pCentre(wk), id: 'firestool', soft: true }); if (sk) pSit(P, 'sit', sk.cx, sk.cz, 0, 0); }
  if (!hh) P.err.push('no hearth fits in the stillroom');
};

PLAN_SHIP.guardhouse = 1; PLAN_SHIP.herbalist = 1;
