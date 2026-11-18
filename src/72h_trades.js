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
  const SHL = pShellWins(P, c, { x0: X0, z0: 0, x1: X1, z1: D }, (f, pos) => f.wall === 'back' && f.lv === 1 ? pos - 0.5 : pos);      /* the loft's back window stands clear of the stair well */
  const bd = SHL.list.find(f => f.kind === 'door' && f.lv === 1); if (bd) pUpperDoor(P, P.rooms.parlour, bd, Math.round(SHL.pos(bd) * 4) / 4);
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: -1.2, z: 4.2, width: 1.0, tread: 0.2 });
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: 2.2, z: 7.15, width: 1.0, tread: 0.22 });
  pLayout(P); pBalconies(P, c);
  const shop = P.rooms.shop, stock = P.rooms.stock, keeper = P.rooms.keeper, solar = P.rooms.solar, attic = P.rooms.attic, parlour = P.rooms.parlour, cellar = P.rooms.cellar;
  // the keeper's hearth first: its stack goes up through the loft and down into the cellar
  const hh = pHearth(P, keeper, 'e', 1.0, { cauldron: true, size: 0.4, at: 5.85 }); P.hall = { room: keeper, hh };
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
  PD.dense(P, solar, { pool: ['hooks', 'tapestry', 'sconce'], corner: ['broom'], mid: { kinds: ['rug'], max: 1 } });
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
PLANS.smithy = (P, c, info) => {      /* [inout] the shell on the Market Place: 9.5 x 7 m, one storey; 12 x 8 inside, the sleeping loft under the rafters over the family's end */
  const R = P.R, id = P.id, B = pFitBox(c, { W: 12, D: 8 }), X0 = B.x0, X1 = B.x1, D = B.D, Xp = X0 + 5, Zp = 5.5; P.dims = { W: B.W, D, Dh: Zp };
  pLevel(P, 0, 0, 3.0); pLevel(P, 1, 3.0 + PW.SLAB, 2.2, { loft: true });
  pRoom(P, 0, 'forge', 'hall', Xp, 0, X1, Zp, { floor: 'stone', tint: [0.62, 0.56, 0.5] }); pRoom(P, 0, 'living', 'hall', X0, 0, Xp, D); pRoom(P, 0, 'coalstore', 'store', Xp, Zp, X1, D, { floor: 'stone' });
  pRoom(P, 1, 'loft', 'bedroom', X0, 0, Xp, D);
  pDoor(P, 'forge', null, 0, 0); pDoor(P, 'forge', 'living', Xp, 4.3); pDoor(P, 'forge', 'coalstore', Xp + 1.2, Zp);
  pShellWins(P, c, B);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: X0 + 0.85, z: 1.2, width: 0.9, tread: 0.2 });
  pLayout(P);
  const forge = P.rooms.forge, living = P.rooms.living, cs = P.rooms.coalstore, loft = P.rooms.loft, m = c.int;
  // the forge stands on the far wall straight ahead of the street door: the first thing seen is its glow, the anvil before it and the smith between them
  const hh = pHearth(P, forge, 's', 2.6, { size: 0.8, at: -0.8, r: 11, c: [4.0, 1.9, 0.6], deco: false }); P.hall = { room: forge, hh };
  if (hh) {
    const fx = hh.px, fz = hh.front[1], face = Math.atan2(hh.px - fx, -(hh.pz - fz));
    pSpot(P, 'home', fx + 1.7, fz - 0.4, face, { k: 0 });
    const an = pPut(P, forge, id + '.anvil', fx - 0.25, fz - 0.5, 0, 0.7, 0.5, 0.9, mm => Props.anvil(mm), { allow: ['hearth'] });
    if (an) { pSpot(P, 'anvil', an.cx + 0.15, an.cz + 0.75, 0, { k: 0 }); }
    pSpot(P, 'forge', fx + 1.0, fz - 0.2, PI / 2 + 0.3, { k: 0 });
    at(m, hh.px, 0.02, hh.pz, PI / 2, () => {
      emit(m, 1.6, () => { m.mat(MAT.PLAIN, [1, 0.5, 0.12]); m.box(0.2, 0.1, -0.5, 0.6, 0.125, 0.5, 4); m.box(0.25, 0.125, -0.12, 0.55, 0.14, 0.12, 4); });
      m.mat(MAT.METAL, [0.3, 0.3, 0.33]); m.box(0.28, 0.12, -0.04, 0.44, 0.15, 0.04); m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); m.ball(0.3, 0.07, -0.35, 0.18, 0.07, 0.14, 6, 3); m.ball(0.32, 0.07, 0.38, 0.16, 0.06, 0.14, 6, 3);
    });
    World.emitters.push({ type: 'smoke', p: [...P.w2(hh.px, P.lv[0].H - 0.2, hh.pz - 0.1)], zone: P.zone, indoor: true });
    pPut(P, forge, id + '.bellows', hh.px + 1.75, hh.pz - 0.5, 0, 0.9, 0.6, 0.9, mm => { at(mm, 0, 0, 0, PI, () => pdBellows(mm)); }, { lowOk: true, allow: ['hearth'], back: 's' });
    pPut(P, forge, id + '.trough', fx - 2.0, fz - 0.9, 0, 1.4, 0.6, 0.6, pdTrough, { lowOk: true, allow: ['hearth'] });
  }
  // the wall to the family's room: the tool board over the bench; the street wall: iron by the door, horseshoes; the end wall: the grindstone and the finished tools under the window
  pAgainst(P, forge, 'w', id + '.bench', 1.8, 0.7, 0.84, +1, mm => { at(mm, 0, 0, 0, PI, () => PD.smithBench(1.8)(mm)); }, { at: 1.6, lowOk: true });
  pHang(P, forge, 'w', 1.6, 1.8, 1.2, 2.2, PD.toolRack(R, 1.8), id + '.tools1', { pivot: 2.15 });
  pAgainst(P, forge, 'n', id + '.iron', 1.1, 0.5, 1.3, 0, PD.ironStand(R), { at: -1.45 });
  pHang(P, forge, 'n', 1.25, 1.0, 1.2, 1.9, PD.horseshoes(R, 1.0), id + '.shoes', { pivot: 1.85 });
  pPiece(P, forge, 'Whetstone', { side: 'e', at: 1.0 }); pPiece(P, forge, 'WeaponStand', { side: 'e', at: 2.5 }); pPiece(P, forge, 'wooden_bucket_01', { near: [-1.9, 3.4], sc: 1.2 });
  pWalls(P, forge, ['Peg_Rack', 'Torch_Metal']);
  pCeil(P, forge, -0.6, 3.4, PD.chainHang(0.9, R)); pCeil(P, forge, -3.0, 2.4, PD.hookBar(1.6, R));
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, forge, id + '.mat', e.x, 1.2, 0, 2.0, 1.3, 0.02, pdRug(2.0, 1.3, [0.25, 0.2, 0.17]), { flat: true, noClear: true });
  // the family's room: the fire backs onto the coal store, the table for two before it, the stair to the loft along the gable wall
  const lh = pHearth(P, living, 'e', 1.4, { cauldron: true, size: 0.4, at: 6.6 }); if (lh) pPier(P, 1, lh);
  const lt = pDining(P, living, 1.6, 0.8, { near: [X0 + 2.9, 6.5], id: 'meal', n: 2, items: ['bowl', 'bowl', 'loaf'] }); if (lt) lt.seats.forEach((st, i) => pSit(P, i ? 'seat' + i : 'sit', st[0], st[1], st[2], 0));
  if (lt) pSpot(P, 'work', lt.x !== undefined ? lt.x : X0 + 2.9, 5.4, PI, { k: 0 });
  pPiece(P, living, 'painted_wooden_shelves', { side: ['s', 'n'], at: X0 + 3.6, sc: 1.5, top: [['wooden_candlestick', 0, 0, 1, 0, true]] });
  pPiece(P, living, 'painted_wooden_cabinet', { side: ['n'], at: X0 + 3.4 });
  pKitWall(P, living, 'n', X0 + 2.0, 'Peg_Rack');
  // the loft: Brandt's bed, the boy's by the stack, one chest between them
  dressBedroom(P, loft, { bedH: 0.85, beds: castBeds(P.id, ['bed']), bedRooms: [P.rooms.living, P.rooms.forge, P.rooms.coalstore], loot: [['gold', 8]], bedInteract: true });
  pPiece(P, loft, 'painted_wooden_stool', { near: [X0 + 3.4, 6.2], top: [['wooden_candlestick', 0, 0, 1, 0, true]] }); pKitWall(P, loft, 's', X0 + 2.6, 'Peg_Rack');
  // the store behind the forge: charcoal, bar iron, the spade
  pFree(P, cs, id + '.cscoal', 1.4, 0.9, 0.6, 0, PD.coalHeap(R), { near: [X1 - 1.4, 7.0], lowOk: true }); pTorch(P, cs, 'n', Xp + 3.2, 1.6, 4.5) || pTorch(P, cs, 'e', 6.7, 1.6, 4.5);      /* the validator wants a light; ROOMS.md says none: one torch at the door, no more */
  for (let i = 0; i < 3; i++) pPiece(P, cs, 'Bag', { side: 's', at: Xp + 3.2 + i * 0.75, id: 'bag' + i });
  pPiece(P, cs, 'Crate_Wooden', { side: 's', at: Xp + 1.0 }); for (let i = 0; i < 2; i++) pFree(P, cs, id + '.csiron' + i, 1.0, 0.4, 0.3, 0, pdIron, { near: [Xp + 2.2, 6.2], lowOk: true });
  if (!hh) P.err.push('no forge fits');
};

// ── the elder's hall: a long, high hall with a great fireplace on the east wall, a high table on a dais at the far end, a long table down the middle, trophies and banners; the study to the west; a stair hall with the way up to the bedchamber and down to the strongroom ──
PLANS.elder = (P, c, info) => {      /* [inout] the shell: 7.2 x 5.6 m, two storeys over a strongroom; 9 x 6.5 inside. Rowan lives alone in what was his father's manor hall */
  const R = P.R, id = P.id, B = pFitBox(c), X0 = B.x0, X1 = B.x1, D = B.D, Xs = X0 + 3, H0 = 2.75; P.dims = { W: B.W, D, Dh: D };
  pLevel(P, -1, -(2.3 + PW.SLAB), 2.3); pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  pRoom(P, 0, 'study', 'study', X0, 0, Xs, D); pRoom(P, 0, 'hall', 'hall', Xs, 0, X1, D, { floor: 'stone' });
  pRoom(P, 1, 'chamber', 'bedroom', X0, 0, Xs, D); pRoom(P, 1, 'solar', 'bedroom', Xs, 0, X1, D);
  pRoom(P, -1, 'strongroom', 'cellar', X0, 0, Xs, D, { floor: 'stone', win: false });
  pDoor(P, 'hall', null, 0, 0); pDoor(P, 'hall', 'study', Xs, 1.6); pDoor(P, 'solar', 'chamber', Xs, 1.6);
  pShellWins(P, c, B);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: -1, x: X1 - 1.3, z: D - 0.75, width: 0.9, tread: 0.18 });
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: -1, x: X0 + 0.75, z: D - 1.4, width: 0.9, tread: 0.2 });
  pLayout(P);
  const hall = P.rooms.hall, study = P.rooms.study, ch = P.rooms.chamber, solar = P.rooms.solar, sr = P.rooms.strongroom;
  // the hall: the fire on the gable wall, his father's buckler over it; the long table with the Elder's chair at its head; the empty bread baskets by the door
  let hh = null; for (const [sd, at_] of [['e', 4.3], ['e', 4.6], ['w', 3.6], ['w', 4.4]]) if ((hh = pHearth(P, hall, sd, 1.6, { cauldron: false, size: 0.6, at: at_, r: 10, c: [3.6, 1.8, 0.65], rug: [0.4, 0.14, 0.12] }))) break; P.hall = { room: hall, hh }; if (hh) { pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); pKitWall(P, hall, hh.side, hh.pz - 1.5, 'Shield_Wooden') || pKitWall(P, hall, hh.side, hh.pz + 1.5, 'Shield_Wooden'); }      /* his father's buckler beside the chimney breast */
  const dn = pDining(P, hall, 2.2, 0.9, { near: [Xs + 2.4, 2.7], id: 'long', n: 5, items: ['plate', 'mug', 'candle', 'loaf', 'jug'], rots: [PI / 2] });
  if (dn) { dn.seats.forEach((st, i) => pSit(P, i ? 'seat' + i : 'sit2', st[0], st[1], st[2], 0)); pPiece(P, hall, 'painted_wooden_chair_01', { near: [dn.x, dn.z + 1.55], turn: PI, id: 'elderchair' }); pSit(P, 'sit', dn.x, dn.z + 1.55, PI, 0); }
  for (let i = 0; i < 3; i++) pPiece(P, hall, 'wicker_basket_02', { side: ['n', 'e'], at: X1 - 0.5 - i * 0.6, sc: 1.6, soft: true, id: 'breadbasket' + i });
  pPiece(P, hall, 'painted_wooden_cabinet', { side: ['n', 'w'], at: Xs + 1.3, id: 'sideboard', top: [['brass_candleholders_c', -0.3, 0, 1, 0, true], ['brass_candleholders_c', 0.3, 0, 1, 0, true]] });
  pKitWall(P, hall, 'w', 4.6, 'Peg_Rack'); pPiece(P, hall, 'wooden_bucket_02', { near: [Xs + 0.6, 4.3], sc: 0.7, id: 'boots', soft: true });
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, hall, id + '.mat', e.x, 1.2, 0, 2.2, 1.4, 0.02, pdRug(2.2, 1.4, [0.3, 0.12, 0.1]), { flat: true, noClear: true });
  // the study: the desk with the levy roll open, the worn bookcase, the lectern
  const dk = pFree(P, study, id + '.desk', 1.6, 0.8, 0.8, PI / 2, pdTable(1.6, 0.8, ['book', 'candle', 'book', 'mug'], 4, c), { near: [X0 + 1.9, 2.0], surface: true });
  if (dk) { pSpot(P, 'desk', dk.cx - 0.8, dk.cz, PI / 2, { k: 0 }); pSpot(P, 'study', dk.cx - 0.8, dk.cz, PI / 2, { k: 0 }); pSpot(P, 'book', dk.cx - 0.8, dk.cz, PI / 2, { k: 0 }); }
  pPiece(P, study, 'wooden_bookshelf_worn', { side: ['n', 's', 'e'], sc: 0.9 }); pPiece(P, study, 'BookStand', { near: [X0 + 2.2, 0.8] }); pPiece(P, study, 'CandleStick_Stand', { near: [X0 + 2.4, 3.6], lit: 6 });
  // upstairs: his chamber (one pillow slept on), the solar nobody uses, the rocker turned to the window that looks at Pell House
  dressBedroom(P, ch, { beds: ['bed'], loot: [['gold', 10]], bedInteract: true, table: false, fur: true, chest: false });
  pPiece(P, ch, 'classicnightstand_01', { side: ['e', 'w'], top: [['wooden_candlestick', 0, 0, 1, 0, true]] }); pPiece(P, ch, 'gothiccabinet_01', { side: ['n', 's', 'w'], sc: 0.75 });
  pPiece(P, solar, 'rockingchair_01', { near: [X1 - 1.2, 1.0], turn: PI }); pPiece(P, solar, 'painted_wooden_table', { near: [Xs + 3.0, 3.6], sc: 0.8, soft: false });
  // the strongroom: the town's silver and the founders' agreement, ledgers, twelve tokens on a nail and one nail empty
  const sb = pAgainst(P, sr, 'e', id + '.strongbox', 1.1, 0.6, 0.8, +1, pdChest, { lowOk: true, at: 3.0 }); if (sb) pInteract(P, sb.cx, 0.5, sb.cz, { kind: 'chest', id: 'elder.strongbox', loot: [['gold', 30], ['potion', 1]], r: 1.8 }, -1);
  pPiece(P, sr, 'treasure_chest', { side: ['n', 'e'], at: X0 + 2.0 }); pPiece(P, sr, 'painted_wooden_shelves', { side: ['e', 'n'], sc: 1.5, at: 1.2 });
  pTorch(P, sr, 's', X0 + 1.9, 1.7, 6) || pTorch(P, sr, 'n', X0 + 1.9, 1.7, 6);
  if (!hh) P.err.push('no fireplace fits');
};

// ── ship list: a building is added only when its plan above is designed, dressed, lit and validated ──
PLAN_SHIP.store = 1; PLAN_SHIP.elder = 1; PLAN_SHIP.smithy = 1;      // smithy [c4]: forge faces the entry, hall dressed
