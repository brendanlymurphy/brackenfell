// ───────────────────────── designed plans, second set [c4]: guardhouse, herbalist ─────────────────────────
// Same frame and rules as 72h_trades.js. Each is added to PLAN_SHIP at the foot of this file only when designed, dressed, lit, validated and looked at.
// ── props ──
PD.spearRack = R => m => {
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-0.55, 0.55]) m.box(sx - 0.04, 0, -0.18, sx + 0.04, 0.12, 0.18); for (const z of [-0.12, 0.12]) { m.box(-0.58, 0.45, z - 0.02, 0.58, 0.5, z + 0.02); m.box(-0.58, 1.1, z - 0.02, 0.58, 1.15, z + 0.02); }
  for (let i = 0; i < 7; i++) { const x = -0.5 + i * 0.167, z = (i % 2 ? 0.08 : -0.08); m.push().T(x, 0.1, z).RZ(R.s() * 0.04); m.mat(MAT.TIMBER, COL.wood); m.box(-0.013, 0, -0.013, 0.013, 1.9, 0.013); m.mat(MAT.METAL, [0.9, 0.9, 0.95]); m.box(-0.025, 1.9, -0.006, 0.025, 2.1, 0.006); m.pop(); }
  addBoxCollider(m, -0.6, -0.2, 0.6, 0.2, 0, 2.1);
};
PD.bars = len => m => {         // a run of iron bars between rails, floor to ceiling, for a cell
  m.mat(MAT.METAL, [0.45, 0.45, 0.5]); m.box(-len / 2, 0.1, -0.03, len / 2, 0.16, 0.03); m.box(-len / 2, 1.5, -0.03, len / 2, 1.56, 0.03); m.box(-len / 2, 2.4, -0.03, len / 2, 2.46, 0.03);
  const n = Math.floor(len / 0.13); for (let i = 0; i <= n; i++) { const x = -len / 2 + i * len / n; m.box(x - 0.012, 0, -0.012, x + 0.012, 2.46, 0.012); }
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
PLANS.guardhouse = (P, c, info) => {
  const R = P.R, id = P.id; P.dims = { W: 12, D: 11, Dh: 6 };
  pLevel(P, 0, 0, 3.2); pLevel(P, 1, 3.2 + PW.SLAB, H_UP);
  pRoom(P, 0, 'guard', 'hall', -6, 0, 6, 6, { floor: 'stone' }); pRoom(P, 0, 'cells', 'store', -6, 6, 0, 11, { floor: 'stone', tint: [0.7, 0.66, 0.62] }); pRoom(P, 0, 'armoury', 'store', 0, 6, 6, 11, { floor: 'stone' });
  pRoom(P, 1, 'barracks', 'bedroom', -6, 0, 6, 11);
  pDoor(P, 'guard', null, 0, 0); pDoor(P, 'guard', 'cells', -3, 6); pDoor(P, 'guard', 'armoury', 3, 6);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: -5.0, z: 1.8, width: 1.0, tread: 0.22 });
  pLayout(P);
  const guard = P.rooms.guard, cells = P.rooms.cells, arm = P.rooms.armoury, bar = P.rooms.barracks, m = c.int;
  // the hearth on the east wall, banked with logs; the long roster table in the middle with benches; the sergeant's spot at its head
  const hh = pHearth(P, guard, 'e', 1.8, { cauldron: true, size: 0.5, at: 3.0 }); P.hall = { room: guard, hh };
  if (hh) { pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  const tb = pDining(P, guard, 3.0, 0.95, { near: [-0.5, 3.0], id: 'table', n: 5, items: ['mug', 'plate', 'bowl', 'book', 'candle', 'loaf'], rots: [0] });
  if (tb) { tb.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0)); pLamp(P, guard, tb.x, tb.z); }
  // the wall opposite the door: weapon stands either side of the cell and armoury doors, spears, a notice board, shields
  pKitFloor(P, guard, 's', 'WeaponStand', { n: 'a', at: -1.2 }); pKitFloor(P, guard, 's', 'WeaponStand', { n: 'b', at: 1.2 }); pAgainst(P, guard, 's', id + '.spears1', 1.2, 0.4, 2.1, +1, PD.spearRack(R), { at: -5.0 }); pAgainst(P, guard, 's', id + '.spears2', 1.2, 0.4, 2.1, +1, PD.spearRack(R), { at: 5.0 });
  pHang(P, guard, 's', 1.1, 1.4, 1.0, 2.0, PD.bladeWall(R, 1.4), id + '.blades', { pivot: 2.0 }) || pHang(P, guard, 's', -1.1, 1.4, 1.0, 2.0, PD.bladeWall(R, 1.4), id + '.blades', { pivot: 2.0 }); pHang(P, guard, 's', -1.0, 1.3, 1.1, 2.0, PD.bladeWall(R, 1.3), id + '.blades2', { pivot: 2.0 });
  pHang(P, guard, 'n', -3.2, 1.3, 1.1, 2.0, PD.tapestry(R, 1.3, 0.9), id + '.board', { pivot: 2.0 });
  pKitFloor(P, guard, 'w', 'Dummy', { n: 'd', at: 'mid' }); pKitFloor(P, guard, 'n', 'WeaponStand', { n: 'c', at: 4.2 });
  pWalls(P, guard, ['Banner_1_Cloth', 'kite_shield', 'Torch_Metal', 'kite_shield', 'Shield_Wooden', 'Banner_2_Cloth', 'Torch_Metal', 'Axe_Bronze', 'Sword_Bronze']);
  PD.dense(P, guard, { pool: ['sconce', 'cask', 'stack', 'hooks', 'sacks'], corner: ['broom', 'cask', 'stack'], mid: { kinds: ['rug'], max: 1 } });
  { const e = P.doors.find(d => d.b === null); if (e) pPut(P, guard, id + '.mat', e.x, 1.4, 0, 2.6, 1.6, 0.02, pdRug(2.6, 1.6, [0.28, 0.22, 0.2]), { flat: true, noClear: true }); pLamp(P, guard, 0, 2.2); }
  // the cells: the west half is the barred cell (a gate gap kept in the bars), a straw pallet, a bucket, chains on the wall; the guards' strongbox outside it
  pPut(P, cells, id + '.bars', -3.0, 8.4, 0, 5.4, 0.14, 0.84, PD.bars(5.2), { lowOk: true, noClear: true, allow: ['path', 'door'] });
  pAgainst(P, cells, 'w', id + '.pallet', 1.9, 0.9, 0.3, 0, m2 => { m2.mat(MAT.THATCH, COL.hay, 0.5); m2.box(-0.95, 0, -0.4, 0.95, 0.14, 0.4); m2.mat(MAT.CLOTH, [0.4, 0.34, 0.26], 0.5); m2.box(-0.7, 0.14, -0.3, 0.2, 0.19, 0.3); }, { at: 9.5, lowOk: true });
  pKitFloor(P, cells, 'w', 'Bucket_Wooden_1', { n: 'q', at: 'end' }); pKitFloor(P, cells, 's', 'Barrel', { n: 'q2', at: 'start' });
  for (const u of [8.2, 9.8]) pHang(P, cells, 'w', u, 0.5, 0.6, 1.9, PD.chainHang(0.9, R), id + '.cchain' + u, { pivot: 1.9 });
  pPut(P, cells, id + '.strongbox', -1.2, 6.9, 0, 0.9, 0.5, 0.58, pdChest, { lowOk: true });
  PD.dense(P, cells, { pool: ['torch', 'sacks', 'cask'], corner: ['sacks', 'cask'], middle: false }); pTorch(P, cells, 'e', 8.5, 1.7, 7) || pTorch(P, cells, 's', -2.5, 1.7, 7);
  // the armoury: racks of spears and swords, shields on the walls, helmets and crates of arrows
  pShelfRun(P, arm, 's', 0, 6, null, { id: 'ar', lv: 3, mixed: ['tools', 'box', 'jar', 'rope', 'lantern'] });
  for (let i = 0; i < 3; i++) pAgainst(P, arm, i % 2 ? 'e' : 'w', id + '.arms' + i, 1.2, 0.4, 2.1, +1, PD.spearRack(R), { at: 7.4 + i * 1.5 });
  pHang(P, arm, 'e', 8.5, 1.6, 1.0, 2.0, PD.bladeWall(R, 1.6), id + '.ablades', { pivot: 2.0 }); pHang(P, arm, 'w', 8.5, 1.6, 1.0, 2.0, PD.bladeWall(R, 1.6), id + '.ablades2', { pivot: 2.0 });
  pFree(P, arm, id + '.apile', 1.3, 0.7, 1.1, 0, PD.cratePile(R), { near: [3, 9.5], lowOk: true }); pStock(P, arm, { crates: 1, barrels: 1, near: [4.6, 7.2] });
  pWalls(P, arm, ['kite_shield', 'Shield_Wooden', 'Torch_Metal', 'Sword_Bronze', 'Axe_Bronze', 'kite_shield']); PD.dense(P, arm, { pool: ['torch', 'sacks', 'cask'], corner: ['cask', 'sacks'], mid: { kinds: ['sacks'], max: 1 } }); pLamp(P, arm, 3, 8.6);
  // upstairs: the bunks (the night guard's bed is the first), a footlocker each; quarters for the sergeant
  dressBedroom(P, bar, { beds: ['bed', 'bed2', 'bed3', 'bed4'], loot: [['gold', 6]], bedInteract: true, table: true }); PD.dense(P, bar, { pool: ['hooks', 'cupboard', 'paint', 'sconce', 'rack'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  if (!hh) P.err.push('no hearth fits in the guard room');
};

// ── the herbalist's: a low shop hung with drying herbs, a counter of jars, the still and the workbench beyond, her bedchamber, the physic garden's door ──
//    ground  shop (10 x 6)  |  workroom (west) + bedchamber with a hearth (east)
PLANS.herbalist = (P, c, info) => {
  const R = P.R, id = P.id; P.dims = { W: 10, D: 11, Dh: 6 };
  pLevel(P, 0, 0, 2.9);
  pRoom(P, 0, 'shop', 'shop', -5, 0, 5, 6, { floor: 'stone' }); pRoom(P, 0, 'workroom', 'store', -5, 6, 0, 11, { floor: 'stone' }); pRoom(P, 0, 'chamber', 'hall', 0, 6, 5, 11);
  pDoor(P, 'shop', null, 0, 0); pDoor(P, 'shop', 'workroom', -2.5, 6); pDoor(P, 'workroom', 'chamber', 0, 8.5);
  pLayout(P);
  const shop = P.rooms.shop, wk = P.rooms.workroom, ch = P.rooms.chamber;
  // the counter across the shop's far side, the keeper behind it; the hearth with a simmering pot on the east wall
  const ct = pPut(P, shop, id + '.counter', 2.9, 4.8, 0, 3.6, 0.8, 0.84, PD.apothecaryTable(3.6), { surface: true, noClear: true, lowOk: true, h: 0.84 });
  if (ct) { pSpot(P, 'home', ct.cx + 1.0, ct.cz + 0.75, PI, { k: 0 }); pSpot(P, 'counter', ct.cx, ct.cz + 0.9, PI, { k: 0 }); pSpot(P, 'front', ct.cx, ct.cz - 0.9, 0, { k: 0 }); }
  const hh = pHearth(P, shop, 'e', 1.5, { cauldron: true, size: 0.4, at: 2.0 }); P.hall = { room: shop, hh };
  for (const sd of ['w', 'n', 'e']) pShelfRun(P, shop, sd, sd === 'n' ? -4.8 : 0.4, sd === 'n' ? 4.8 : 5.6, null, { id: 'bt', lv: 5, mixed: PD.WARES.drugs });
  for (const x of [-3.2, -1.2, 1.2, 3.2]) PD.rack(P, shop, x, 2.4 + (x > 0 ? 0.4 : 0), 1.8, 0, ['herb', 'herb', 'herb', 'garlic', 'herb']);
  PD.rack(P, shop, -3.2, 4.4, 1.8, 0, ['herb', 'herb', 'garlic']);
  pAgainst(P, shop, 'w', id + '.planter', 1.1, 0.5, 0.6, 0, PD.planter(R), { at: 2.0, lowOk: true }); pAgainst(P, shop, 'n', id + '.planter2', 1.1, 0.5, 0.6, 0, PD.planter(R), { at: 3.4, lowOk: true });
  pWalls(P, shop, ['Shelf_Small_Bottles', 'Torch_Metal', 'Shelf_Small_Bottles', 'Peg_Rack']); PD.dense(P, shop, { pool: ['sconce', 'hooks', 'tapestry', 'cabinet'], corner: ['sacks', 'broom'], middle: false });
  { const e = P.doors.find(d => d.b === null); if (e) pPut(P, shop, id + '.mat', e.x, 1.3, 0, 2.2, 1.4, 0.02, pdRug(2.2, 1.4, [0.25, 0.3, 0.2]), { flat: true, noClear: true }); }
  pLamp(P, shop, -2.0, 2.0); pLamp(P, shop, 1.8, 2.0);
  // the workroom: the still and a long bench, stoppered jars, pots, bundles hanging, sacks of dried leaves
  pAgainst(P, wk, 'n', id + '.still', 1.5, 0.9, 1.4, 0, PD.still, { at: -2.0, lowOk: true });
  pFree(P, wk, id + '.workbench', 2.2, 0.8, 0.9, 0, PD.apothecaryTable(2.2), { near: [-2.6, 8.6], surface: true });
  pShelfRun(P, wk, 'w', 6.2, 10.8, null, { id: 'wk', lv: 4, mixed: PD.WARES.drugs }); pShelfRun(P, wk, 's', -4.8, -0.2, null, { id: 'wks', lv: 4, mixed: PD.WARES.drugs });
  PD.rack(P, wk, -2.6, 8.0, 2.2, 0, ['herb', 'herb', 'garlic', 'herb']); pStock(P, wk, { sacks: 3, crates: 2, barrels: 1, near: [-1, 10] });
  pWalls(P, wk, ['Shelf_Small_Bottles', 'Torch_Metal', 'rusted_spade_01']); PD.dense(P, wk, { pool: ['sconce', 'shelf', 'stack'], corner: ['sacks', 'stack'], mid: { kinds: ['sacks'], max: 1 } }); pLamp(P, wk, -2.4, 8.8);
  // her chamber: a hearth, a table and stools at it, the bed, a chest
  const lh = pHearth(P, ch, 'e', 1.5, { cauldron: true, size: 0.4, at: 8.5 });
  dressBedroom(P, ch, { beds: ['bed'], loot: [['gold', 5]], bedInteract: true, table: true });
  const dn = pDining(P, ch, 1.6, 0.8, { near: [2.0, 9.6], id: 'meal', n: 3 }); if (dn) dn.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0));
  PD.rack(P, ch, 2.5, 8.2, 1.6, PI / 2, ['herb', 'garlic']); PD.dense(P, ch, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'sconce'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  if (!hh) P.err.push('no hearth fits in the shop');
};

PLAN_SHIP.guardhouse = 1; PLAN_SHIP.herbalist = 1;
