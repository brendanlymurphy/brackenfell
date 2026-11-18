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
  at(m, Math.min(x0 + 2.2, x1 - 1.15), h, 0.05, -0.2, () => { m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(-0.17, 0, -0.12, 0.17, 0.045, 0.12); m.mat(MAT.PLAIN, COL.parchment); m.box(-0.16, 0.01, -0.11, 0.16, 0.04, 0.115, 4 | 8 | 1); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.cyl(0.26, 0, 0.0, 0.03, 0.03, 0.07, 6, 1); });
  m.push().T(0, h, 0.0); { const ca = len > 4 ? x0 + 3.0 : x0 + 0.5, cb = Math.max(ca + 0.3, x1 - (len > 4 ? 1.2 : 1.0)); Props.clutter(m, R, ca, Math.min(cb, x1 - 0.35), 0, 0.0, kinds, len > 4 ? Math.max(4, n - 3) : Math.max(2, Math.round(len)), c); } m.pop();          // [fx2] a short counter's wares stay on the counter
  addBoxCollider(m, x0, -0.45, x1, 0.42, 0, h);
};
const pdShelfTall = (len, h, lv, fill) => m => Props.shelf(m, len, h, lv, 0.34, fill);
// a row of tall shelves along a wall from u0 to u1 (floor to ceiling, stocked with `kinds`); returns how many fitted
function pShelfRun(P, room, side, u0, u1, kinds, o) {
  o = o || {}; const c = P.c, H = Math.min(P.lv[room.k].H - 0.35, 2.7); let n = 0;
  for (let u = u0; u + 1.8 <= u1 + 1e-6; u += 1.9) if (pAgainst(P, room, side, P.id + '.' + (o.id || 'wall') + side + n, 1.8, 0.34, H, +1, pdShelfTall(1.8, H, o.lv || 5, o.bolts ? PD.bolts(c, 1.8, o.cols) : o.books ? PD.books(c, 1.8) : PD.mixed(c, 1.8, o.mixed || PD.WARES.store)), { at: u + 0.9, lowOk: false })) n++;
  return n;
}
// the stair pair every two-storey trade plan needs is declared by hand (the rooms differ); this places loose stock in a room by name
function pStock(P, room, o) {
  o = o || {}; const R = P.R;
  for (let i = 0; i < (o.crates || 0); i++) pFree(P, room, P.id + '.' + room.id + 'crate' + i, 0.6, 0.6, 0.6, R() * 0.5, pdCrate(0.6), { near: o.near || pCentre(room) });
  for (let i = 0; i < (o.sacks || 0); i++) pFree(P, room, P.id + '.' + room.id + 'sack' + i, 0.62, 0.62, 0.5, R() * 6, pdSack(0.3), { near: o.nearS || o.near || pCentre(room) });
  for (let i = 0; i < (o.barrels || 0); i++) pFree(P, room, P.id + '.' + room.id + 'brl' + i, 0.7, 0.7, 0.84, 0, pdBarrel(0.33, 0.9), { near: o.nearB || o.near || pCentre(room), lowOk: true });
}

// ── the store [inout]: the same building as its shell on the Market Place (8.4 x 6.6 m, two storeys, a balcony over the door), one and a half times its floor: 10 x 8 ──
//    ground  the shop across the front (street door and window where the shell has them), the cellar flight behind the counter; behind it a stockroom and the keeper's kitchen with the stair up
//    up      Marta's counting room with the door onto the balcony, her chamber beside it, the stock loft over the back range where the stair arrives
//    below   the cold cellar under the back of the shop and the back range
PLANS.store = (P, c, info) => {
  const R = P.R, id = P.id, X0 = -2.5, X1 = 7.5, D = 8, Zp = 5; P.dims = { W: X1 - X0, D, Dh: Zp };
  pLevel(P, -1, -2.8, 2.55); pLevel(P, 0, 0, 2.75); pLevel(P, 1, 3.0, H_UP);
  pRoom(P, 0, 'shop', 'shop', X0, 0, X1, Zp, { floor: 'stone' }); pRoom(P, 0, 'stock', 'store', X0, Zp, 0.5, D); pRoom(P, 0, 'keeper', 'hall', 0.5, Zp, X1, D);
  pRoom(P, 1, 'parlour', 'hall', X0, 0, 2.5, Zp); pRoom(P, 1, 'solar', 'bedroom', 2.5, 0, X1, Zp); pRoom(P, 1, 'attic', 'store', X0, Zp, X1, D);
  pRoom(P, -1, 'cellar', 'cellar', X0, 3, X1, D, { floor: 'stone', win: false });
  pDoor(P, 'shop', null, 0, 0); pDoor(P, 'shop', 'keeper', 4.5, Zp); pDoor(P, 'stock', 'keeper', 0.5, 6.0); pDoor(P, 'parlour', 'attic', 0, Zp); pDoor(P, 'solar', 'attic', 5.0, Zp);
  // the shell's own openings: every window where the shell has one, and the door over the street door opens onto the balcony
  const SHL = pShellWins(P, c, { x0: X0, z0: 0, x1: X1, z1: D });
  const bd = SHL.list.find(f => f.kind === 'door' && f.lv === 1); if (bd) pUpperDoor(P, P.rooms.parlour, bd, Math.round(SHL.pos(bd) * 4) / 4);
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: -1.2, z: 4.2, width: 1.0, tread: 0.2 });
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: 2.6, z: 7.2, width: 0.9, tread: 0.19 });
  pLayout(P); pBalconies(P, c);
  const shop = P.rooms.shop, stock = P.rooms.stock, keeper = P.rooms.keeper, solar = P.rooms.solar, attic = P.rooms.attic, parlour = P.rooms.parlour, cellar = P.rooms.cellar;
  // the keeper's hearth first: its stack goes up through the loft and down into the cellar
  const hh = pHearth(P, keeper, 'e', 1.1, { cauldron: true, size: 0.4, at: 5.9 }); P.hall = { room: keeper, hh };
  if (hh) { pPier(P, -1, hh); pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  // the shop: the counter faces the street door, the keeper's aisle and the cellar flight behind it, wares up both side walls
  const ct = pPut(P, shop, id + '.counter', 5.0, 1.9, 0, 3.6, 0.8, 0.84, pdCounter(3.6, c, ['jug', 'bowl', 'cheese', 'loaf', 'pot', 'apple', 'bottle', 'candle'], 8), { surface: true, noClear: true, lowOk: true });
  if (ct) { pSpot(P, 'counter', ct.cx + 0.3, ct.cz + 0.8, PI, { k: 0 }); pSpot(P, 'front', ct.cx - 0.3, ct.cz - 0.85, 0, { k: 0 }); }
  pShelfRun(P, shop, 'w', 0.5, 3.2, ['bowl', 'jug', 'pot', 'cheese', 'bottle'], { id: 'side' });
  pShelfRun(P, shop, 's', 5.3, 7.4, ['pot', 'cheese', 'bowl', 'loaf'], { id: 'back' }); pShelfRun(P, shop, 's', 2.2, 3.9, ['bottle', 'jug', 'bowl', 'pot'], { id: 'back' });
  pAgainst(P, shop, 'n', id + '.sbench', 1.6, 0.4, 0.46, 0, pdBench(1.6), { at: 2.0, lowOk: true });
  for (let i = 0; i < 2; i++) pAgainst(P, shop, 'n', id + '.sbarrel' + i, 0.7, 0.7, 0.84, 0, pdBarrel(0.33, 0.9), { at: -1.9 + i * 0.8, lowOk: true });
  pFree(P, shop, id + '.display', 1.6, 0.8, 0.9, 0, m => { Props.table(m, 1.6, 0.8, 0.9); Props.clutter(m, R, -0.6, 0.6, 0.9, 0, ['apple', 'cabbage', 'cheese', 'loaf', 'bowl', 'jug'], 5, c); }, { near: [-1.0, 3.0], surface: true });
  pStock(P, shop, { crates: 2, sacks: 2, near: [6.6, 4.2], nearS: [-1.9, 4.2] });
  PD.rack(P, shop, 5.0, 2.9, 2.4, 0, ['ham', 'herb', 'pot', 'garlic', 'pot', 'herb']); PD.rack(P, shop, -1.0, 2.6, 2.0, PI / 2, ['herb', 'garlic', 'ham', 'pot']);
  PD.dense(P, shop, { pool: ['hooks', 'paint', 'sconce', 'torch'], corner: ['broom', 'sacks', 'cask'], middle: false });
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, shop, id + '.mat', e.x, 1.1, 0, 2.0, 1.4, 0.02, pdRug(2.0, 1.4, [0.35, 0.3, 0.22]), { flat: true, noClear: true });
  pLamp(P, shop, 0.2, 2.4); pLamp(P, shop, 5.0, 2.8);
  // the stockroom: shelves to the ceiling, what came off the last cart
  pShelfRun(P, stock, 'w', 5.3, 7.7, ['pot', 'jug', 'bowl', 'bottle', 'cheese'], { id: 'sr' }); pShelfRun(P, stock, 'n', -2.3, 0.2, ['bottle', 'jug', 'pot', 'bowl'], { id: 'ss' });
  pStock(P, stock, { crates: 2, sacks: 3, barrels: 2, near: [-1.6, 7.2], nearS: [-0.4, 7.3] });
  PD.dense(P, stock, { pool: ['hooks', 'sacks', 'torch'], corner: ['sacks', 'cask'], mid: { kinds: ['sacks'], max: 1 } }); pLamp(P, stock, -1.0, 6.5);
  // the keeper's kitchen: the fire on the end wall, a table between the door and the stair
  const kt = pDining(P, keeper, 1.5, 0.75, { near: [3.2, 5.9], id: 'meal', n: 2 }); if (kt) { kt.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0)); }
  pAgainst(P, keeper, 'n', id + '.kshelf', 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, stockFill(c, ['pot', 'bowl', 'jug', 'cheese', 'loaf'])), { at: 2.0 });
  pWalls(P, keeper, ['Peg_Rack', 'Shelf_Simple', 'Torch_Metal']); pLamp(P, keeper, 3.4, 5.9);
  // upstairs: the counting room over the door (ledgers, the strongbox, the way onto the balcony), Marta's chamber, the stock loft
  const desk = pFree(P, parlour, id + '.desk', 1.5, 0.75, 0.8, 0, pdTable(1.5, 0.75, ['candle', 'jug', 'plate', 'bowl'], 3, c), { near: [-0.9, 2.8], surface: true });
  if (desk) pAgainst(P, parlour, 'w', id + '.pbench', 1.4, 0.4, 0.46, 0, pdBench(1.4), { at: 1.4, lowOk: true });
  pShelfRun(P, parlour, 'e', 1.6, 4.6, [], { id: 'led', books: true });
  PD.dense(P, parlour, { pool: ['cupboard', 'tapestry', 'paint', 'sconce'], corner: ['broom'], mid: { kinds: ['rug'], max: 1 } }); pLamp(P, parlour, 0, 2.6);
  dressBedroom(P, solar, { beds: ['bed'], loot: LOOT.store, bedInteract: true, table: true });
  PD.dense(P, solar, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'sconce'], corner: ['broom'], mid: { kinds: ['rug'], max: 1 } });
  pStock(P, attic, { sacks: 4, crates: 3, barrels: 1, near: [-1.2, 6.4], nearS: [0.6, 5.8] });
  PD.rack(P, attic, -1.0, 6.4, 2.2, 0, ['herb', 'herb', 'garlic']);
  PD.dense(P, attic, { pool: ['hooks', 'shelf', 'sacks'], corner: ['sacks', 'cask'], mid: { kinds: ['sacks', 'casks'], max: 1 } }); pLamp(P, attic, 0.4, 6.0);
  // the cellar: casks, hams, jars, cold shelves; it later carries the way to the smugglers' tunnel
  dressCellar(P, cellar, { barrels: 3, crates: 3, rows: true });
  PD.dense(P, cellar, { pool: ['cask', 'shelf', 'sacks', 'stack', 'torch'], corner: ['cask', 'sacks', 'stack'], mid: { kinds: ['casks', 'sacks'], max: 2, min: 0.8 }, racks: 1, rackKinds: ['ham', 'herb', 'garlic', 'ham'] });
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
  pRoom(P, 0, 'forge', 'hall', -7, 0, 2, 8, { floor: 'stone', tint: [0.62, 0.56, 0.5] }); pRoom(P, 0, 'living', 'hall', 2, 0, 7, 8); pRoom(P, 0, 'coalstore', 'store', -7, 8, 2, 12, { floor: 'stone' });
  pRoom(P, 1, 'loft', 'bedroom', 2, 0, 7, 8);
  pDoor(P, 'forge', null, 0, 0); pDoor(P, 'forge', 'living', 2, 6.5); pDoor(P, 'forge', 'coalstore', -4.5, 8);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: 6.0, z: 1.4, width: 1.0, tread: 0.2 });
  pLayout(P);
  const forge = P.rooms.forge, living = P.rooms.living, cs = P.rooms.coalstore, loft = P.rooms.loft, m = c.int;
  // [c4] the forge stands on the far wall straight ahead of the street door: the first thing seen is its glow, the anvil before it and the smith between them
  const hh = pHearth(P, forge, 's', 2.6, { size: 0.8, at: -0.8, r: 11, c: [4.0, 1.9, 0.6], deco: false }); P.hall = { room: forge, hh };
  if (hh) {
    const fx = hh.px, fz = hh.front[1], face = Math.atan2(hh.px - fx, -(hh.pz - fz));
    pSpot(P, 'home', fx + 1.9, fz - 0.4, face, { k: 0 });
    const an = pPut(P, forge, id + '.anvil', fx - 0.25, fz - 0.5, 0, 0.7, 0.5, 0.9, mm => Props.anvil(mm), { allow: ['hearth'] });
    if (an) { pSpot(P, 'anvil', an.cx + 0.15, an.cz + 0.75, 0, { k: 0 }); }
    pSpot(P, 'forge', fx + 1.0, fz - 0.2, PI / 2 + 0.3, { k: 0 });
    // the forge itself: a billet glowing in the coals, a stone hood already (the breast), smoke going up, the bellows on the right with its handle out
    at(m, hh.px, 0.02, hh.pz, PI / 2, () => {
      emit(m, 1.6, () => { m.mat(MAT.PLAIN, [1, 0.5, 0.12]); m.box(0.2, 0.1, -0.5, 0.6, 0.125, 0.5, 4); m.box(0.25, 0.125, -0.12, 0.55, 0.14, 0.12, 4); });
      m.mat(MAT.METAL, [0.3, 0.3, 0.33]); m.box(0.28, 0.12, -0.04, 0.44, 0.15, 0.04); m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); m.ball(0.3, 0.07, -0.35, 0.18, 0.07, 0.14, 6, 3); m.ball(0.32, 0.07, 0.38, 0.16, 0.06, 0.14, 6, 3);
    });
    World.emitters.push({ type: 'smoke', p: [...P.w2(hh.px, P.lv[0].H - 0.2, hh.pz - 0.1)], zone: P.zone, indoor: true });
    pPut(P, forge, id + '.bellows', hh.px + 1.75, hh.pz - 0.5, 0, 0.9, 0.6, 0.9, mm => { at(mm, 0, 0, 0, PI, () => pdBellows(mm)); }, { lowOk: true, allow: ['hearth'], back: 's' });
    pPut(P, forge, id + '.trough', fx - 2.3, fz - 0.6, 0, 1.4, 0.6, 0.6, pdTrough, { lowOk: true, allow: ['hearth'] });
    pPut(P, forge, id + '.coalheap', fx - 3.0, 7.3, 0, 1.4, 0.9, 0.6, PD.coalHeap(R), { lowOk: true, allow: ['hearth'] });
  }
  if (hh) pPier(P, 1, hh);
  // west wall: the tool board, the grindstone, finished blades, the bench; windows leave their gaps
  pHang(P, forge, 'w', 2.0, 1.8, 1.0, 2.1, PD.toolRack(R, 1.8), id + '.tools1', { pivot: 2.05 }); pHang(P, forge, 'w', 4.1, 1.8, 1.0, 2.1, PD.toolRack(R, 1.8, ['tongs', 'hammer', 'tongs', 'punch', 'sledge', 'tongs']), id + '.tools2', { pivot: 2.05 });
  pAgainst(P, forge, 'w', id + '.bench', 1.8, 0.7, 0.84, +1, mm => { at(mm, 0, 0, 0, PI, () => PD.smithBench(1.8)(mm)); }, { at: 6.2, lowOk: true });
  pAgainst(P, forge, 'w', id + '.grind', 0.8, 0.6, 0.7, 0, PD.grindstone, { at: 2.6, lowOk: true });
  // north wall (the street side): a full board of finished blades, horseshoes, tool boards either side of the door
  pHang(P, forge, 'n', -3.2, 1.6, 1.0, 2.0, PD.bladeWall(R, 1.6), id + '.blades', { pivot: 2.0 }); pHang(P, forge, 'n', -5.2, 1.5, 1.2, 1.7, PD.horseshoes(R, 1.5), id + '.shoes', { pivot: 1.75 });
  pHang(P, forge, 'n', 1.2, 1.4, 1.0, 1.9, PD.toolRack(R, 1.4), id + '.tools3', { pivot: 1.95 }) || pHang(P, forge, 'n', 1.3, 1.0, 1.0, 1.9, PD.horseshoes(R, 1.0), id + '.shoes2', { pivot: 1.75 });
  pAgainst(P, forge, 'n', id + '.iron', 1.1, 0.5, 1.3, 0, PD.ironStand(R), { at: -1.8 }); pAgainst(P, forge, 'n', id + '.iron2', 1.1, 0.5, 1.3, 0, PD.ironStand(R), { at: -6.0 });
  pKitFloor(P, forge, 'e', 'Whetstone', { at: 'start' }); pKitFloor(P, forge, 'w', 'WeaponStand', { n: 'a', at: 'mid' }); pKitFloor(P, forge, 'e', 'WeaponStand', { n: 'b', at: 'end' });
  pAgainst(P, forge, 'e', id + '.waterbrl', 0.7, 0.7, 0.84, 0, pdBarrel(0.33, 0.9), { at: 'end', lowOk: true }); pKitFloor(P, forge, 'e', 'Bucket_Wooden_1', { n: 'q', at: 'end' });
  for (let i = 0; i < 2; i++) pAgainst(P, forge, 's', id + '.coal' + i, 1.0, 0.8, 0.5, 0, pdCoal, { at: i ? 'end' : 'start', lowOk: true });
  pWalls(P, forge, ['Peg_Rack', 'Axe_Bronze', 'Pickaxe_Bronze', 'Sword_Bronze', 'kite_shield', 'Torch_Metal', 'rusted_spade_01']);
  // overhead: chains and a bar of tongs above the work, the rafters black with soot
  pCeil(P, forge, -0.3, 4.0, PD.chainHang(1.3, R)); pCeil(P, forge, -3.0, 3.2, PD.hookBar(1.8, R)); pCeil(P, forge, -4.5, 5.5, PD.chainHang(0.9, R)); pCeil(P, forge, 1.0, 5.5, PD.hookBar(1.2, R, ['tongs', 'ladle', 'chain']));
  for (const sd of ['n', 'e', 'w']) pHigh(P, forge, sd, 2.7, 1.5, w => PD.highShelf(R, w), id + '.hi');
  PD.dense(P, forge, { pool: ['sconce', 'shelf', 'stack', 'sacks'], corner: ['stack', 'sacks', 'broom'], middle: false });
  pLamp(P, forge, -3.5, 2.2); pLamp(P, forge, 0.6, 3.0);
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, forge, id + '.mat', e.x, 1.3, 0, 2.4, 1.4, 0.02, pdRug(2.4, 1.4, [0.25, 0.2, 0.17]), { flat: true, noClear: true });
  // the family's room: hearth, table, shelves, bed corner; the loft above
  const lh = pHearth(P, living, 'e', 1.6, { cauldron: true, size: 0.4, at: 4.5 }); if (lh) pPier(P, 1, lh);
  dressKitchen(P, living, { hh: lh }); const lt = pDining(P, living, 1.8, 0.85, { near: [4.0, 1.2], id: 'meal', n: 3 }); if (lt) lt.seats.forEach((st, i) => pSit(P, i ? 'seat' + i : 'sit', st[0], st[1], st[2], 0));
  PD.dense(P, living, { pool: ['cupboard', 'hooks', 'paint', 'tapestry', 'sconce', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  dressBedroom(P, loft, { beds: castBeds(P.id, ['bed']) /* [cast] Tobin's bed in the forge loft */, loot: [['gold', 8]], bedInteract: true, table: true }); PD.dense(P, loft, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'sconce'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
  // the store behind the forge: coal, iron, billets, crates, a ladder
  for (let i = 0; i < 2; i++) pFree(P, cs, id + '.cscoal' + i, 1.4, 0.9, 0.6, 0, PD.coalHeap(R), { near: [-5.5 + i * 2.2, 9.2], lowOk: true });
  for (let i = 0; i < 3; i++) pFree(P, cs, id + '.csiron' + i, 1.0, 0.4, 0.3, 0, pdIron, { near: [-1.5, 11], lowOk: true });
  pFree(P, cs, id + '.cspile', 1.3, 0.7, 1.1, 0, PD.cratePile(R), { near: [-4, 10.8], lowOk: true }); pStock(P, cs, { crates: 1, sacks: 2, barrels: 2, near: [-2.5, 10.8] }); pShelfRun(P, cs, 's', -7, 2, null, { id: 'cs', lv: 3, mixed: PD.WARES.hard });
  PD.dense(P, cs, { pool: ['hooks', 'rack', 'sacks', 'torch'], corner: ['stack', 'sacks'], mid: { kinds: ['sacks'], max: 1 } }); pLamp(P, cs, -3, 10);
  if (!hh) P.err.push('no forge fits');
};

// ── the elder's hall: a long, high hall with a great fireplace on the east wall, a high table on a dais at the far end, a long table down the middle, trophies and banners; the study to the west; a stair hall with the way up to the bedchamber and down to the strongroom ──
PLANS.elder = (P, c, info) => {
  const R = P.R, id = P.id; P.dims = { W: 14, D: 14, Dh: 9 };
  pLevel(P, -1, -(H_CELLAR + PW.SLAB), H_CELLAR); pLevel(P, 0, 0, 3.8); pLevel(P, 1, 3.8 + PW.SLAB, H_UP);
  pRoom(P, 0, 'hall', 'hall', -7, 0, 7, 9, { floor: 'stone' }); pRoom(P, 0, 'study', 'study', -7, 9, 0, 14); pRoom(P, 0, 'stairhall', 'corridor', 0, 9, 7, 14);
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
PLAN_SHIP.store = 1; PLAN_SHIP.elder = 1; PLAN_SHIP.smithy = 1;      // smithy [c4]: forge faces the entry, hall dressed
