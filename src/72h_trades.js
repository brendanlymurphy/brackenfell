// ───────────────────────── designed plans by trade [c3] ─────────────────────────
// One function per building in PLANS (72e_plans.js): its rooms, doors and stairs laid out as an architect would for that trade, then dressed by the placement
// rules. Each is added to PLAN_SHIP at the foot of this file only when it is designed, dressed, lit and validated. Frame: the street door at (0, 0) on the z = 0 wall.
const pdCounter = (len, c, kinds, n) => m => {          // a closed shop counter: panelled front, overhanging top, a hinged flap at the keeper's end, a balance, a ledger and wares
  const R = c.R, h = 1.0, x0 = -len / 2, x1 = len / 2;
  m.mat(MAT.PLANKS, COL.woodDark); m.box(x0, 0, -0.38, x1, h - 0.06, 0.36); m.mat(MAT.PLANKS, COL.wood);
  for (let x = x0 + 0.15; x < x1 - 0.5; x += 0.78) m.box(x, 0.12, -0.395, x + 0.7, h - 0.16, -0.38);          // panels on the customers' side
  m.mat(MAT.TIMBER, COL.woodDark); m.box(x0 - 0.03, 0, -0.4, x1 + 0.03, 0.1, -0.37); m.box(x0 - 0.05, h - 0.06, -0.45, x1 + 0.05, h, 0.42);          // plinth and the overhanging top
  m.mat(MAT.PLANKS, COL.wood); m.box(x1 - 0.82, h, -0.42, x1 - 0.02, h + 0.03, 0.4);          // the flap, lifted for the keeper
  m.mat(MAT.METAL, COL.bronze); for (const z of [-0.2, 0.2]) m.box(x1 - 0.84, h + 0.01, z - 0.02, x1 - 0.78, h + 0.035, z + 0.02);
  at(m, x0 + 0.9, h, 0.0, 0.3, () => { m.mat(MAT.METAL, COL.bronze); m.box(-0.015, 0, -0.015, 0.015, 0.34, 0.015); m.box(-0.2, 0.33, -0.01, 0.2, 0.345, 0.01); for (const sx of [-0.19, 0.19]) { m.box(sx - 0.003, 0.2, -0.003, sx + 0.003, 0.33, 0.003); m.lathe([[0.0, 0.2], [0.07, 0.205], [0.075, 0.215]], 8, 1); } m.cyl(0, 0, 0, 0.06, 0.05, 0.02, 8, 1); });
  at(m, x0 + 2.2, h, 0.05, -0.2, () => { m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(-0.17, 0, -0.12, 0.17, 0.045, 0.12); m.mat(MAT.PLAIN, COL.parchment); m.box(-0.16, 0.01, -0.11, 0.16, 0.04, 0.115, 4 | 8 | 1); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.cyl(0.26, 0, 0.0, 0.03, 0.03, 0.07, 6, 1); });
  m.push().T(0, h, 0.0); Props.clutter(m, R, x0 + 3.0, x1 - 1.2, 0, 0.0, kinds, Math.max(4, n - 3), c); m.pop();
  addBoxCollider(m, x0, -0.45, x1, 0.42, 0, h);
};
const pdShelfTall = (len, h, lv, fill) => m => Props.shelf(m, len, h, lv, 0.34, fill);
// a row of tall shelves along a wall from u0 to u1 (floor to ceiling, stocked with `kinds`); returns how many fitted
function pShelfRun(P, room, side, u0, u1, kinds, o) {
  o = o || {}; const c = P.c, H = Math.min(P.lv[room.k].H - 0.35, 2.7); let n = 0;
  for (let u = u0; u + 1.8 <= u1 + 1e-6; u += 1.9) if (pAgainst(P, room, side, P.id + '.' + (o.id || 'wall') + side + n, 1.8, 0.34, H, +1, pdShelfTall(1.8, H, o.lv || 5, o.bolts ? PD.bolts(c, 1.8, o.cols) : o.books ? PD.books(c, 1.8) : stockFill(c, kinds)), { at: u + 0.9, lowOk: false })) n++;
  return n;
}
// the stair pair every two-storey trade plan needs is declared by hand (the rooms differ); this places loose stock in a room by name
function pStock(P, room, o) {
  o = o || {}; const R = P.R;
  for (let i = 0; i < (o.crates || 0); i++) pFree(P, room, P.id + '.' + room.id + 'crate' + i, 0.6, 0.6, 0.6, R() * 0.5, pdCrate(0.6), { near: o.near || pCentre(room) });
  for (let i = 0; i < (o.sacks || 0); i++) pFree(P, room, P.id + '.' + room.id + 'sack' + i, 0.5, 0.5, 0.5, R() * 6, pdSack(0.3), { near: o.nearS || o.near || pCentre(room) });
  for (let i = 0; i < (o.barrels || 0); i++) pFree(P, room, P.id + '.' + room.id + 'brl' + i, 0.7, 0.7, 0.84, 0, pdBarrel(0.33, 0.9), { near: o.nearB || o.near || pCentre(room), lowOk: true });
}

// ── the store: a shop floor with a long counter, wares floor to ceiling and hams overhead; the keeper's rooms behind and above; a stockroom with the cellar stair; a cold cellar ──
//    ground  shop (14 x 7) | stock (west) + keeper's room with a hearth (east)        up: the keeper's solar over the hearth room, an attic of stock over the stockroom
//    below   one long cellar under both back rooms, its stair rising in the stockroom
PLANS.store = (P, c, info) => {
  const R = P.R, id = P.id; P.dims = { W: 14, D: 12, Dh: 7 };
  pLevel(P, -1, -(H_CELLAR + PW.SLAB), H_CELLAR); pLevel(P, 0, 0, 3.3); pLevel(P, 1, 3.3 + PW.SLAB, H_UP);
  pRoom(P, 0, 'shop', 'shop', -7, 0, 7, 7, { floor: 'stone' }); pRoom(P, 0, 'stock', 'store', -7, 7, 0, 12); pRoom(P, 0, 'keeper', 'hall', 0, 7, 7, 12);
  pRoom(P, 1, 'solar', 'bedroom', 0, 7, 7, 12); pRoom(P, 1, 'attic', 'bedroom', -7, 7, 0, 12);
  pRoom(P, -1, 'cellar', 'cellar', -7, 7, 7, 12, { floor: 'stone', win: false });
  pDoor(P, 'shop', null, 0, 0); pDoor(P, 'stock', 'keeper', 0, 10.8); pDoor(P, 'shop', 'keeper', 3.5, 7); pDoor(P, 'solar', 'attic', 0, 11.0);
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: -5.8, z: 8.9, width: 1.0, tread: 0.22 });
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: 1.5, z: 11.0, width: 1.0, tread: 0.22 });
  pLayout(P);
  const shop = P.rooms.shop, stock = P.rooms.stock, keeper = P.rooms.keeper, solar = P.rooms.solar, attic = P.rooms.attic, cellar = P.rooms.cellar;
  // the keeper's hearth first: its stack goes up and down
  const hh = pHearth(P, keeper, 'e', 1.6, { cauldron: true, size: 0.45, at: 8.6 }); P.hall = { room: keeper, hh };
  if (hh) { pPier(P, -1, hh); pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  // the shop floor: the counter runs along the back of the customers' half, closed at its west end; the way to the keeper's door stays open at its east end
  const ct = pPut(P, shop, id + '.counter', -3.8, 4.8, 0, 6.0, 0.8, 0.84, pdCounter(6.0, c, ['jug', 'bowl', 'cheese', 'loaf', 'pot', 'apple', 'bottle', 'candle'], 9), { surface: true, noClear: true, lowOk: true });
  if (ct) { pSpot(P, 'counter', ct.cx + 0.4, ct.cz + 0.85, PI, { k: 0 }); pSpot(P, 'front', ct.cx + 0.4, ct.cz - 0.85, 0, { k: 0 }); }
  // behind the counter: a flap of floor, scales and a tall shelf wall; the stockroom door is on this side
  pShelfRun(P, shop, 's', -7, -0.2, ['cheese', 'loaf', 'pot', 'jug'], { id: 'back' }); pShelfRun(P, shop, 's', 0.2, 2.7, ['bottle', 'jug', 'bowl', 'pot'], { id: 'back' }); pShelfRun(P, shop, 's', 4.3, 7, ['pot', 'cheese', 'bowl', 'loaf'], { id: 'back' });
  // the side walls: wares from floor to ceiling, barrels and sacks by the door where goods arrive
  pShelfRun(P, shop, 'w', 0, 4.4, ['bowl', 'jug', 'pot', 'cheese', 'bottle'], { id: 'side' }); pShelfRun(P, shop, 'e', 2.8, 7, ['bottle', 'pot', 'jug', 'loaf'], { id: 'side' });
  for (let i = 0; i < 3; i++) pAgainst(P, shop, 'e', id + '.sbarrel' + i, 0.7, 0.7, 0.84, 0, pdBarrel(0.33, 0.9), { at: 0.8 + i * 0.85, lowOk: true });
  for (let i = 0; i < 2; i++) pAgainst(P, shop, 'n', id + '.ssack' + i, 0.9, 0.6, 0.6, 0, PD.sacks(R), { at: i ? 'end' : 'start', lowOk: true });
  pAgainst(P, shop, 'n', id + '.sbench', 1.6, 0.4, 0.46, 0, pdBench(1.6), { at: -3.0, lowOk: true });
  // display tables with goods in the customers' half, a rug where the door opens
  const dt = pFree(P, shop, id + '.display', 2.0, 0.9, 0.9, 0, m => { Props.table(m, 2.0, 0.9, 0.9); Props.clutter(m, R, -0.8, 0.8, 0.9, 0, ['apple', 'cabbage', 'cheese', 'loaf', 'bowl', 'jug'], 6, c); }, { near: [3.6, 2.6], surface: true });
  pFree(P, shop, id + '.display2', 1.4, 0.8, 0.9, 0, m => { Props.table(m, 1.4, 0.8, 0.9); Props.clutter(m, R, -0.5, 0.5, 0.9, 0, ['bottle', 'pot', 'jug', 'candle'], 4, c); }, { near: [-3.8, 2.0], surface: true });
  pStock(P, shop, { crates: 3, sacks: 2, barrels: 1, near: [5.4, 5.8], nearS: [-6, 2], nearB: [6, 1.5] });
  PD.rack(P, shop, -3.2, 2.6, 2.6, 0, ['ham', 'herb', 'pot', 'garlic', 'pot', 'herb']); PD.rack(P, shop, 3.4, 3.8, 2.2, PI / 2, ['herb', 'garlic', 'ham', 'pot']); PD.rack(P, shop, -3.4, 6.0, 2.4, 0, ['pot', 'pot', 'herb', 'ham']);
  PD.dense(P, shop, { pool: ['hooks', 'cabinet', 'paint', 'sconce', 'tapestry', 'torch'], corner: ['broom', 'sacks', 'cask'], middle: false });
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, shop, id + '.mat', e.x, 1.4, 0, 2.4, 1.6, 0.02, pdRug(2.4, 1.6, [0.35, 0.3, 0.22]), { flat: true, noClear: true });
  pLamp(P, shop, -3.0, 2.8); pLamp(P, shop, 3.0, 2.8); pLamp(P, shop, -3.4, 5.8);
  // the stockroom: floor-to-ceiling shelves, a ladder, crates and sacks, the cellar stair opening under the east end
  pShelfRun(P, stock, 'w', 7.2, 11.8, ['pot', 'jug', 'bowl', 'bottle', 'cheese'], { id: 'sr' }); pShelfRun(P, stock, 's', -7, -3, ['bottle', 'jug', 'pot', 'bowl'], { id: 'ss' });
  pStock(P, stock, { crates: 4, sacks: 4, barrels: 3, near: [-1.5, 10.6], nearS: [-5.5, 8.0] });
  if (Kit.pieces.wooden_ladder) pKitFloor(P, stock, 'w', 'wooden_ladder', { n: 'a', at: 'mid' });
  PD.rack(P, stock, -3.6, 9.4, 2.2, 0, ['ham', 'herb', 'garlic']);
  PD.dense(P, stock, { pool: ['hooks', 'cabinet', 'paint', 'sacks', 'torch'], corner: ['sacks', 'broom', 'cask'], mid: { kinds: ['sacks', 'casks'], max: 1 } }); pLamp(P, stock, -3.5, 9.5);
  // the keeper's room: hearth, worktable, shelves, a settle and a rug; reads (the ledger) stay where the old interior had them
  dressKitchen(P, keeper, { hh });
  PD.dense(P, keeper, { pool: ['cupboard', 'hooks', 'paint', 'tapestry', 'sconce', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  const kt = pDining(P, keeper, 1.8, 0.85, { near: [4.0, 10.8], id: 'meal', n: 3 }); if (kt) { kt.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0)); }
  // upstairs: the keeper's bedroom and the attic
  dressBedroom(P, solar, { beds: ['bed'], loot: LOOT.store, bedInteract: true, table: true });
  PD.dense(P, solar, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'cabinet', 'sconce'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  dressBedroom(P, attic, { beds: ['bed2'], chestId: 'chest2', chest: false }); pStock(P, attic, { sacks: 4, crates: 2, barrels: 1, near: [-3.5, 9.5] });
  PD.rack(P, attic, -3.5, 9.5, 2.4, PI / 2, ['herb', 'herb', 'garlic']);
  PD.dense(P, attic, { pool: ['hooks', 'shelf', 'sacks', 'cupboard'], corner: ['sacks', 'broom', 'cask'], mid: { kinds: ['sacks', 'casks'], max: 2 } });
  // the cellar: casks, hams, jars, cold shelves; it later carries the way to the smugglers' tunnel
  dressCellar(P, cellar, { barrels: 4, crates: 3, rows: true });
  PD.dense(P, cellar, { pool: ['cask', 'shelf', 'sacks', 'stack', 'cabinet', 'torch'], corner: ['cask', 'sacks', 'stack'], mid: { kinds: ['casks', 'sacks'], max: 3, min: 0.8 }, racks: 1, rackKinds: ['ham', 'herb', 'garlic', 'ham'] });
  if (!hh) P.err.push('no hearth fits in the keeper room');
  for (const rid of ['cellar']) if (!P.lightIn[rid]) pTorch(P, P.rooms[rid], 'n', 0.5, 1.7, 6.5) || pTorch(P, P.rooms[rid], 's', 0.5, 1.7, 6.5);
};


// ── the smithy: a tall forge hall that is open to the loft smoke, forge on the west wall with its bellows, anvil, quench trough, grindstone and racks; the family's room beside it with the stair to the sleeping loft; a coal and iron store behind ──
const pdBellows = m => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.3, 0, -0.2, 0.3, 0.1, 0.2); m.mat(MAT.CLOTH, [0.25, 0.17, 0.11], 0.6); m.box(-0.28, 0.1, -0.18, 0.28, 0.42, 0.18); m.mat(MAT.PLANKS, COL.wood); m.box(-0.3, 0.42, -0.2, 0.3, 0.5, 0.2); m.mat(MAT.METAL, COL.black); m.box(-0.03, 0.2, 0.18, 0.03, 0.26, 0.6); m.box(-0.02, 0.5, -0.02, 0.02, 1.0, 0.02); addBoxCollider(m, -0.3, -0.2, 0.3, 0.6, 0, 0.5); };
const pdIron = m => { m.mat(MAT.METAL, [0.2, 0.2, 0.22]); for (let j = 0; j < 4; j++) for (let i = 0; i < 4 - j; i++) m.box(-0.5 + j * 0.06 + i * 0.12, j * 0.05, -0.2, -0.42 + j * 0.06 + i * 0.12, j * 0.05 + 0.05, 0.2); addBoxCollider(m, -0.5, -0.2, 0.5, 0.2, 0, 0.25); };
const pdCoal = m => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.5, 0, -0.4, 0.5, 0.5, -0.36); m.box(-0.5, 0, 0.36, 0.5, 0.5, 0.4); m.box(-0.5, 0, -0.4, -0.46, 0.5, 0.4); m.box(0.46, 0, -0.4, 0.5, 0.5, 0.4); m.mat(MAT.PLAIN, [0.05, 0.05, 0.05]); m.ball(0, 0.35, 0, 0.44, 0.24, 0.34, 7, 4); addBoxCollider(m, -0.5, -0.4, 0.5, 0.4, 0, 0.5); };
const pdTrough = m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.7, 0, -0.3, 0.7, 0.6, 0.3); m.mat(MAT.PLAIN, [0.08, 0.14, 0.2]); m.quad([-0.62, 0.52, -0.22], [-0.62, 0.52, 0.22], [0.62, 0.52, 0.22], [0.62, 0.52, -0.22]); addBoxCollider(m, -0.7, -0.3, 0.7, 0.3, 0, 0.6); };
PLANS.smithy = (P, c, info) => {
  const R = P.R, id = P.id; P.dims = { W: 14, D: 12, Dh: 7 };
  pLevel(P, 0, 0, 4.2); pLevel(P, 1, 4.2 + PW.SLAB, 2.5);
  pRoom(P, 0, 'forge', 'hall', -7, 0, 2, 8, { floor: 'stone' }); pRoom(P, 0, 'living', 'hall', 2, 0, 7, 8); pRoom(P, 0, 'coalstore', 'store', -7, 8, 2, 12, { floor: 'stone' });
  pRoom(P, 1, 'loft', 'bedroom', 2, 0, 7, 8);
  pDoor(P, 'forge', null, 0, 0); pDoor(P, 'forge', 'living', 2, 6.5); pDoor(P, 'forge', 'coalstore', -3.5, 8);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: 6.0, z: 1.4, width: 1.0, tread: 0.2 });
  pLayout(P);
  const forge = P.rooms.forge, living = P.rooms.living, cs = P.rooms.coalstore, loft = P.rooms.loft;
  // the forge on the west wall, big: anvil before it, bellows beside, quench trough, grindstone
  const hh = pHearth(P, forge, 'w', 2.6, { size: 0.8, at: 3.4, r: 11, c: [4.0, 1.9, 0.6], deco: false }); P.hall = { room: forge, hh };
  if (hh) { pSpot(P, 'home', hh.front[0] + 0.6, hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
    const an = pPut(P, forge, id + '.anvil', hh.front[0] + 0.7, hh.front[1], PI / 2, 0.7, 0.45, 0.9, m => Props.anvil(m), {}); if (an) pSpot(P, 'anvil', an.cx + 0.75, an.cz, -PI / 2, { k: 0 });
    pSpot(P, 'forge', hh.front[0] + 0.2, hh.front[1] - 1.2, Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
    pPut(P, forge, id + '.bellows', hh.px + 0.45, hh.pz - 1.75, PI / 2, 0.9, 0.6, 0.9, pdBellows, { lowOk: true, back: 'w' });
    pFree(P, forge, id + '.trough', 1.4, 0.6, 0.6, 0, pdTrough, { near: [hh.front[0] + 0.8, hh.front[1] + 2.2], lowOk: true }); }
  if (hh) pPier(P, 1, hh);
  pKitFloor(P, forge, 'n', 'Whetstone', { at: -5 }) || pKitFloor(P, forge, 's', 'Whetstone', { at: 'start' });
  pKitFloor(P, forge, 'n', 'Workbench', { at: -2.5 }); pKitFloor(P, forge, 's', 'WeaponStand', { n: 'a', at: -5 }); pKitFloor(P, forge, 's', 'WeaponStand', { n: 'b', at: -1 });
  for (let i = 0; i < 3; i++) pAgainst(P, forge, 'n', id + '.coal' + i, 1.0, 0.8, 0.5, 0, pdCoal, { at: 'end', lowOk: true }); pAgainst(P, forge, 's', id + '.iron', 1.0, 0.4, 0.3, 0, pdIron, { at: 'mid', lowOk: true });
  pWalls(P, forge, ['Peg_Rack', 'Axe_Bronze', 'Pickaxe_Bronze', 'cross_pein_hammer', 'Peg_Rack', 'Sword_Bronze', 'kite_shield', 'Peg_Rack', 'Axe_Bronze', 'Torch_Metal']);
  PD.dense(P, forge, { pool: ['hooks', 'rack', 'paint', 'sconce', 'cabinet'], corner: ['stack', 'sacks', 'broom'], mid: { kinds: ['casks'], max: 1 } });
  PD.rack(P, forge, -3.2, 5.0, 2.4, 0, ['pot', 'pot', 'herb']); pLamp(P, forge, -3.0, 2.5); pLamp(P, forge, -3.0, 6.0);
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, forge, id + '.mat', e.x, 1.2, 0, 2.4, 1.4, 0.02, pdRug(2.4, 1.4, [0.25, 0.2, 0.17]), { flat: true, noClear: true });
  // the family's room: hearth, table, shelves, bed corner; the loft above
  const lh = pHearth(P, living, 'e', 1.6, { cauldron: true, size: 0.4, at: 4.5 }); if (lh) pPier(P, 1, lh);
  dressKitchen(P, living, { hh: lh }); const lt = pDining(P, living, 1.8, 0.85, { near: [4.0, 1.2], id: 'meal', n: 3 }); if (lt) lt.seats.forEach((st, i) => pSit(P, i ? 'seat' + i : 'sit', st[0], st[1], st[2], 0));
  PD.dense(P, living, { pool: ['cupboard', 'hooks', 'paint', 'tapestry', 'sconce', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  dressBedroom(P, loft, { beds: ['bed'], loot: [['gold', 8]], bedInteract: true, table: true }); PD.dense(P, loft, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'sconce'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  // the store behind the forge: coal, iron, billets, crates, a ladder
  for (let i = 0; i < 4; i++) pFree(P, cs, id + '.cscoal' + i, 1.0, 0.8, 0.5, R() * 0.3, pdCoal, { near: [-5.5, 9.2], lowOk: true });
  for (let i = 0; i < 3; i++) pFree(P, cs, id + '.csiron' + i, 1.0, 0.4, 0.3, 0, pdIron, { near: [-1.5, 11], lowOk: true });
  pStock(P, cs, { crates: 3, sacks: 2, barrels: 2, near: [-4, 10.8] }); pShelfRun(P, cs, 's', -7, 2, ['pot', 'bottle', 'jug'], { id: 'cs', lv: 3 });
  PD.dense(P, cs, { pool: ['hooks', 'rack', 'sacks', 'torch'], corner: ['stack', 'sacks'], mid: { kinds: ['sacks'], max: 1 } }); pLamp(P, cs, -3, 10);
  if (!hh) P.err.push('no forge fits');
};

// ── the elder's hall: a long, high hall with a great fireplace on the east wall, a high table on a dais at the far end, a long table down the middle, trophies and banners; the study to the west; a stair hall with the way up to the bedchamber and down to the strongroom ──
PLANS.elder = (P, c, info) => {
  const R = P.R, id = P.id; P.dims = { W: 14, D: 14, Dh: 9 };
  pLevel(P, -1, -(H_CELLAR + PW.SLAB), H_CELLAR); pLevel(P, 0, 0, 3.8); pLevel(P, 1, 3.8 + PW.SLAB, H_UP);
  pRoom(P, 0, 'hall', 'hall', -7, 0, 7, 9); pRoom(P, 0, 'study', 'study', -7, 9, 0, 14); pRoom(P, 0, 'stairhall', 'corridor', 0, 9, 7, 14);
  pRoom(P, 1, 'chamber', 'bedroom', 0, 9, 7, 14, { skipWin: ['x9'] }); pRoom(P, 1, 'solar', 'bedroom', -7, 9, 0, 14, { skipWin: ['x9'] });
  pRoom(P, -1, 'strongroom', 'cellar', 0, 9, 7, 14, { floor: 'stone', win: false });
  pDoor(P, 'hall', null, 0, 0); pDoor(P, 'hall', 'stairhall', 3.5, 9); pDoor(P, 'hall', 'study', -3.5, 9); pDoor(P, 'chamber', 'solar', 0, 11.5);
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: 1.3, z: 11.0, width: 1.0, tread: 0.22 });
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: 1.5, z: 13.3, width: 1.0, tread: 0.19 });
  pLayout(P);
  const hall = P.rooms.hall, study = P.rooms.study, sh = P.rooms.stairhall, ch = P.rooms.chamber, solar = P.rooms.solar, sr = P.rooms.strongroom;
  // the great fireplace on the long east wall, the stack goes up beside the chamber
  const hh = pHearth(P, hall, 'e', 2.6, { cauldron: false, size: 0.8, at: 4.2, r: 11, c: [3.8, 1.9, 0.7], rug: [0.4, 0.14, 0.12] }); P.hall = { room: hall, hh };
  if (hh) pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
  // the dais and high table across the far south end
  { const m = c.int, L0 = P.lv[0]; m.m1 = P.zone; m.ao = INT_AO;
    pPut(P, hall, id + '.dais', 0, 7.7, 0, 9.0, 2.1, 0.2, mm => { mm.mat(MAT.PLANKS, COL.woodDark); mm.box(-4.5, 0, -1.05, 4.5, 0.2, 1.05); }, { flat: true, noClear: true });
    addFloor(m, -4.5, 6.65, 4.5, 8.75, L0.y + 0.22); }
  const ht = pPut(P, hall, id + '.hightable', 0, 8.0, 0, 5.2, 0.9, 0.78, m => { Props.table(m, 5.2, 0.9, 0.78); Props.clutter(m, c.R, -2.4, 2.4, 0.78, 0, ['plate', 'mug', 'bowl', 'candle', 'loaf', 'mug', 'jug'], 8, c); }, { surface: true, noClear: true, lift: 0.2 });
  if (ht) { for (let i = 0; i < 4; i++) pPut(P, hall, id + '.hchair' + i, -1.9 + i * 1.27, 8.75, PI, 0.5, 0.5, 0.95, pdChair, { lowOk: true, noClear: true, lift: 0.2 }); pSit(P, 'sit', 0.0, 8.75, PI, 0); pSpot(P, 'dais', 0, 6.7, 0, { k: 0 }); }
  const dn = pDining(P, hall, 3.8, 1.0, { near: [-1.2, 3.6], id: 'long', n: 6, items: ['mug', 'plate', 'bowl', 'candle', 'loaf', 'jug'], rots: [PI / 2] });
  if (dn) { dn.seats.forEach((st, i) => pSit(P, i ? 'seat' + i : 'sit2', st[0], st[1], st[2], 0)); pLamp(P, hall, dn.x, dn.z - 1.2); pLamp(P, hall, dn.x, dn.z + 1.2); }
  pWalls(P, hall, ['Banner_1_Cloth', 'Shield_Wooden', 'Banner_2_Cloth', 'kite_shield', 'Sword_Bronze', 'Banner_1_Cloth', 'Shield_Wooden', 'Torch_Metal', 'Banner_2_Cloth', 'Torch_Metal']);
  for (let i = 0; i < 4; i++) pHang(P, hall, 'w', 2.2 + i * 2.0, 1.0, 1.5, 2.5, m => { m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.4, 0.05, -0.06, 0.4, 0.95, -0.02); at(m, 0, 0.35, -0.04, 0, () => antlers(m)); }, id + '.trophy' + i, { pivot: 1.5 });
  PD.dense(P, hall, { pool: ['tapestry', 'hooks', 'cabinet', 'paint', 'shelf', 'cask', 'sconce', 'rack'], corner: ['broom', 'cask', 'stack'], mid: { kinds: ['rug'], max: 1 } });
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, hall, id + '.mat', e.x, 1.6, 0, 3.0, 1.8, 0.02, pdRug(3.0, 1.8, [0.3, 0.12, 0.1]), { flat: true, noClear: true });
  // the study: desk with the chronicle, bookcases, a globe-sized lectern, a settle
  const dk = pFree(P, study, id + '.desk', 1.8, 0.85, 0.8, 0, pdTable(1.8, 0.85, ['book', 'candle', 'book', 'mug', 'book'], 5, c), { near: [-3.5, 11.5], surface: true });
  if (dk) { pSpot(P, 'desk', dk.cx, dk.cz + 0.85, PI, { k: 0 }); pSpot(P, 'study', dk.cx, dk.cz + 0.85, PI, { k: 0 }); pPut(P, study, id + '.deskchair', dk.cx, dk.cz + 0.8, PI, 0.5, 0.5, 0.95, pdChair, { lowOk: true }); }
  pShelfRun(P, study, 'w', 9.2, 13.8, null, { id: 'bk', books: true, lv: 5 }); pShelfRun(P, study, 's', -6.8, -0.2, null, { id: 'bks', books: true, lv: 5 });
  pKitFloor(P, study, 'n', 'Bookcase_2', { n: 'n', at: 'end' }); pKitFloor(P, study, 'n', 'BookStand', { n: 'bs', at: 'start' }) || pKitFloor(P, study, 's', 'CandleStick_Stand', { n: 's' });
  PD.dense(P, study, { pool: ['books', 'tapestry', 'paint', 'hooks', 'sconce'], corner: ['broom', 'stack'], mid: { kinds: ['rug'], max: 1 } }); pLamp(P, study, -3.5, 11.5);
  // stair hall: lantern, chests, cloaks; the chamber and solar above
  PD.dense(P, sh, { pool: ['hooks', 'cabinet', 'paint', 'sconce', 'tapestry'], corner: ['broom', 'sacks'], middle: false }); pLamp(P, sh, 4.5, 12.2);
  dressBedroom(P, ch, { beds: ['bed'], loot: [['gold', 10]], bedInteract: true, table: true, fur: true }); PD.dense(P, ch, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'sconce', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  dressBedroom(P, solar, { beds: [], chestId: 'chest2', chest: false }); pShelfRun(P, solar, 'w', 9.2, 13.8, null, { id: 'sol', books: true, lv: 4 });
  PD.dense(P, solar, { pool: ['books', 'tapestry', 'paint', 'cabinet', 'sconce'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  // the strongroom below: strongbox, shelves of deeds and plate, locked chests
  const sb = pAgainst(P, sr, 'e', id + '.strongbox', 1.1, 0.6, 0.8, +1, pdChest, { lowOk: true, at: 11.5 }); if (sb) pInteract(P, sb.cx, 0.5, sb.cz, { kind: 'chest', id: 'elder.strongbox', loot: [['gold', 30], ['potion', 1]], r: 1.8 }, -1);
  pShelfRun(P, sr, 's', 0.2, 6.8, ['pot', 'bowl', 'bottle'], { id: 'sr', lv: 3 }); pFree(P, sr, id + '.srchest', 0.85, 0.5, 0.58, 0.4, pdChest, { near: [5.8, 13.2], lowOk: true }); pStock(P, sr, { crates: 3, sacks: 2, barrels: 1, near: [3.5, 12.6] });
  PD.dense(P, sr, { pool: ['shelf', 'cabinet', 'sacks', 'torch'], corner: ['sacks', 'stack'], mid: { kinds: ['sacks'], max: 1, min: 0.8 } });
  for (const rid of ['strongroom']) if (!P.lightIn[rid]) pTorch(P, P.rooms[rid], 'n', 3.5, 1.7, 7) || pTorch(P, P.rooms[rid], 's', 3.5, 1.7, 7);
  if (!hh) P.err.push('no great fireplace fits');
};

// ── ship list: a building is added only when its plan above is designed, dressed, lit and validated ──
PLAN_SHIP.store = 1; PLAN_SHIP.elder = 1;      // smithy held by the coordinator: from the door the forge hall shows a bare wall (the forge is out of view) and the room is sparse; add PLAN_SHIP.smithy = 1 when the forge faces the entry and the hall is dressed
