// ───────────────────────── designed plans by trade [c3] ─────────────────────────
// One function per building in PLANS (72e_plans.js): its rooms, doors and stairs laid out as an architect would for that trade, then dressed by the placement
// rules. Each is added to PLAN_SHIP at the foot of this file only when it is designed, dressed, lit and validated. Frame: the street door at (0, 0) on the z = 0 wall.
const pdCounter = (len, c, kinds, n) => m => { Props.table(m, len, 0.8, 1.0); Props.clutter(m, c.R, -len / 2 + 0.3, len / 2 - 0.3, 1.0, 0, kinds, n, c); };
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
  pRoom(P, 0, 'shop', 'shop', -7, 0, 7, 7); pRoom(P, 0, 'stock', 'store', -7, 7, 0, 12); pRoom(P, 0, 'keeper', 'hall', 0, 7, 7, 12);
  pRoom(P, 1, 'solar', 'bedroom', 0, 7, 7, 12); pRoom(P, 1, 'attic', 'bedroom', -7, 7, 0, 12);
  pRoom(P, -1, 'cellar', 'cellar', -7, 7, 7, 12, { floor: 'stone', win: false });
  pDoor(P, 'shop', null, 0, 0); pDoor(P, 'shop', 'stock', -3.5, 7); pDoor(P, 'shop', 'keeper', 3.5, 7); pDoor(P, 'solar', 'attic', 0, 11.0);
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: -5.8, z: 8.9, width: 1.0, tread: 0.22 });
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: 1.5, z: 11.0, width: 1.0, tread: 0.22 });
  pLayout(P);
  const shop = P.rooms.shop, stock = P.rooms.stock, keeper = P.rooms.keeper, solar = P.rooms.solar, attic = P.rooms.attic, cellar = P.rooms.cellar;
  // the keeper's hearth first: its stack goes up and down
  const hh = pHearth(P, keeper, 'e', 1.6, { cauldron: true, size: 0.45, at: 8.6 }); P.hall = { room: keeper, hh };
  if (hh) { pPier(P, -1, hh); pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  // the shop floor: the counter runs along the back of the customers' half, closed at its west end; the way to the keeper's door stays open at its east end
  const ct = pPut(P, shop, id + '.counter', -3.5, 4.8, 0, 6.6, 0.8, 1.0, pdCounter(6.6, c, ['jug', 'bowl', 'cheese', 'loaf', 'pot', 'apple', 'bottle', 'candle'], 9), { surface: true, noClear: true });
  if (ct) { pSpot(P, 'counter', ct.cx + 0.4, ct.cz + 0.85, PI, { k: 0 }); pSpot(P, 'front', ct.cx + 0.4, ct.cz - 0.85, 0, { k: 0 }); }
  // behind the counter: a flap of floor, scales and a tall shelf wall; the stockroom door is on this side
  pShelfRun(P, shop, 's', -7, -4.3, ['jug', 'pot', 'bowl', 'bottle'], { id: 'back' }); pShelfRun(P, shop, 's', -2.7, -0.2, ['cheese', 'loaf', 'pot', 'jug'], { id: 'back' }); pShelfRun(P, shop, 's', 0.2, 2.7, ['bottle', 'jug', 'bowl', 'pot'], { id: 'back' }); pShelfRun(P, shop, 's', 4.3, 7, ['pot', 'cheese', 'bowl', 'loaf'], { id: 'back' });
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

// ── ship list: a building is added only when its plan above is designed, dressed, lit and validated ──
PLAN_SHIP.store = 1;
