// ───────────────────────── the chapel and what lies under it; later: the tunnel and the dungeon ─────────────────────────
// pGate: a locked iron-bound door in a doorway of a plan. A leaf in World.doors that opens by itself once the key has turned (S.opened[id]), a collider while shut and an interact point.
function pGate(P, d, id, key, label) {
  const L = P.lv[d.k], m = P.c.int, vert = d.wall.ax === 'z';          // vert: the wall runs along z (x = const)
  const hw = d.w / 2 - 0.02, hinge = vert ? [d.x, L.y, d.z - hw] : [d.x - hw, L.y, d.z];
  const ux = vert ? [0, 0, 1] : [1, 0, 0], uz = vert ? [-1, 0, 0] : [0, 0, -1].map(v => -v);
  const C = m4.create(); m4.basis(C, ux, [0, 1, 0], uz, hinge); const base = m4.mul(m4.create(), P.T, C);
  const cw = P.w2(d.x, L.y + 1, d.z), hp = P.w2(hinge[0], hinge[1], hinge[2]);
  const leaf = { site: P.c.site, zone: P.zone, side: 'in', cell: P.c.cell.id, hinge: hp, yaw: 0, w: d.w - 0.04, h: 2.2, open: 0, c: cw, out: cw, ins: cw, sill: cw, baseM: base, gate: id, internal: true };
  World.doors.push(leaf);
  const q = vert ? [d.x - 0.12, d.z - d.w / 2, d.x + 0.12, d.z + d.w / 2] : [d.x - d.w / 2, d.z - 0.12, d.x + d.w / 2, d.z + 0.12];
  let col = null; if (!S || !S.opened || !S.opened[id]) { addBoxCollider(m, q[0], q[1], q[2], q[3], L.y, L.y + 2.4); col = World.colliders[World.colliders.length - 1]; }
  const it = pInteract(P, d.x, 1.1, d.z, { kind: 'gate', id, key, label, r: 2.3, col }, d.k); return it;
}
// the sarcophagus: a stone chest with a lid slightly askew
const pdTomb = (len) => m => { m.mat(MAT.STONE, [0.78, 0.76, 0.72], 0.8); m.box(-len / 2, 0, -0.42, len / 2, 0.5, 0.42); m.box(-len / 2 - 0.05, 0.5, -0.47, len / 2 + 0.05, 0.66, 0.47); m.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.8); m.box(-len / 2 + 0.2, 0.66, -0.12, len / 2 - 0.2, 0.74, 0.12); };
const pdAltar = c => m => {
  m.mat(MAT.STONE, [0.82, 0.8, 0.76], 0.8); m.box(-1.45, 0, -0.5, 1.45, 0.95, 0.5); m.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.8); m.box(-1.6, 0.95, -0.56, 1.6, 1.07, 0.56);
  m.mat(MAT.CLOTH, [0.24, 0.06, 0.06], 0.5); m.box(-1.25, 0.28, -0.585, 1.25, 1.065, -0.55); m.box(-1.2, 1.07, -0.4, 1.2, 1.085, 0.4);          // the frontal hanging from the slab, a runner on top
  m.mat(MAT.METAL, COL.bronze); m.box(-1.25, 0.28, -0.59, 1.25, 0.31, -0.55); m.box(-1.25, 0.92, -0.59, 1.25, 0.95, -0.55);
  for (const sx of [-1.25, 1.25]) at(m, sx, 1.085, 0, 0, () => { m.mat(MAT.METAL, COL.bronze); m.cyl(0, 0, 0, 0.09, 0.05, 0.05, 8, 2); m.cyl(0, 0.05, 0, 0.03, 0.03, 0.45, 6, 2); Props.candle(m, c, true); });
  for (const sx of [-0.55, 0.55]) at(m, sx, 1.085, 0.05, 0, () => Props.candle(m, { zone: c.zone, candleLight: false }, false));
  addBoxCollider(m, -1.6, -0.56, 1.6, 0.56, 0, 1.1);
};
const pdPew = len => m => {            // backs to the door (local -z), a kneeler at the foot of the back for the row behind, panelled ends
  m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, 0.44, -0.12, len / 2, 0.49, 0.4); m.box(-len / 2, 0.5, -0.22, len / 2, 0.98, -0.16); m.mat(MAT.PLANKS, COL.woodDark); m.box(-len / 2, 0.92, -0.25, len / 2, 1.0, -0.13); m.box(-len / 2, 0.2, -0.22, len / 2, 0.44, -0.16);
  m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2, 0, -0.45, len / 2, 0.1, -0.2); m.box(-len / 2, 0.1, -0.44, len / 2, 0.14, -0.2);
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-1, 1]) { m.box(sx * len / 2 - 0.04, 0, -0.26, sx * len / 2 + 0.04, 1.05, 0.42); m.box(sx * len / 2 - 0.04, 0, -0.5, sx * len / 2 + 0.04, 0.18, -0.26); }
  addBoxCollider(m, -len / 2, -0.5, len / 2, 0.42, 0, 0.5);
};


PLANS.chapel = (P, c, info) => {
  const R = P.R, need = P.need;
  P.dims = { W: 14, D: 12 };
  pLevel(P, -1, -(H_CELLAR + PW.SLAB), H_CELLAR); pLevel(P, 0, 0, H_GROUND + 0.6);
  // nave (west, long) and the sacristy (east, with the stair to the crypt)
  const GL = [[0.09, 0.14, 0.34], [0.34, 0.07, 0.08], [0.36, 0.22, 0.06], [0.07, 0.22, 0.12]]       /* deep jewel colours: sapphire, ruby, amber, emerald */, WK = ['Thin_Round', 'Wide_Round'];
  pRoom(P, 0, 'nave', 'nave', -5, 0, 5, 12, { floor: 'stone', winKinds: WK, glass: GL }); pRoom(P, 0, 'sacristy', 'sacristy', 5, 0, 9, 7, { floor: 'stone' }); pRoom(P, 0, 'tower', 'tower', -9, 0, -5, 5, { win: false, floor: 'stone' });
  pDoor(P, 'nave', null, 0, 0); pDoor(P, 'nave', 'sacristy', 5, 3.5); pDoor(P, 'nave', 'tower', -5, 2.5);
  // crypt: the stair arrives in the east vault; a gate leads west under the nave; a second gate-less arch to the ossuary
  pRoom(P, -1, 'vault', 'cellar', 5, 0, 9, 7, { floor: 'stone', win: false }); pRoom(P, -1, 'crypt', 'cellar', -5, 0, 5, 12, { floor: 'stone', win: false });
  pDoor(P, 'vault', 'crypt', 5, 3.5, { gate: true });
  pStair(P, { id: 'stCrypt', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: 1, x: 8.05, z: 1.3, width: 1.0, tread: 0.22 });
  pLayout(P);
  const nave = P.rooms.nave, sac = P.rooms.sacristy, vault = P.rooms.vault, crypt = P.rooms.crypt;
  // nave: the altar on a step against the far wall, a cross and candles, rows of pews with a central aisle, the font by the door
  { const m = P.c.int, L0 = P.lv[0]; m.m1 = P.zone; m.ao = INT_AO;
    pPut(P, nave, P.id + '.step', 0, 11.0, 0, 6.0, 1.7, 0.14, mm => { mm.mat(MAT.STONE, [0.78, 0.76, 0.72], 0.8); mm.box(-3, 0, -0.85, 3, 0.14, 0.85); }, { flat: true, noClear: true });
    addFloor(m, -3, 10.15, 3, 11.85, L0.y + 0.16);
    const al = pPut(P, nave, P.id + '.altar', 0, 11.2, 0, 3.2, 1.12, 0.84, pdAltar(c), { lift: 0.14, back: 's', lowOk: true });
    if (al) { pSpot(P, 'altar', 0, 9.3, 0, { k: 0 }); P.lightIn.nave = 1;
      at(m, 0, L0.y + 1.3, 11.62, 0, () => { m.mat(MAT.METAL, COL.bronze); m.box(-0.05, 0, -0.04, 0.05, 1.5, 0.04); m.box(-0.32, 0.95, -0.04, 0.32, 1.05, 0.04); m.mat(MAT.STONE, [0.6, 0.58, 0.54], 0.8); m.box(-0.14, -0.06, -0.12, 0.14, 0.0, 0.12); }); } }
  let row = 0; for (const z of [2.9, 4.15, 5.4, 6.65, 7.9, 9.15]) for (const x of [-2.5, 2.5]) { const pw = pPut(P, nave, P.id + '.pew' + row++, x, z, 0, 3.0, 1.0, 1.05, pdPew(3.0), {}); if (pw && row <= 2) pSit(P, 'pew' + row, x, z + 0.15, PI, 0); }
  { const f = pAgainst(P, nave, 'n', P.id + '.font', 0.7, 0.7, 0.95, 0, m => { m.mat(MAT.STONE, [0.8, 0.78, 0.74], 0.8); m.cyl(0, 0, 0, 0.16, 0.14, 0.8, 10, 3); m.cyl(0, 0.8, 0, 0.36, 0.2, 0.18, 12, 3); m.mat(MAT.PLAIN, [0.15, 0.25, 0.4]); m.disc(0, 0.95, 0, 0.3, 12, 1); }, { at: nave.in.x1 - 1.0 }); }
  pAgainst(P, nave, 'w', P.id + '.statuebase', 0.8, 0.8, 1.2, 0, m => { m.mat(MAT.STONE, [0.8, 0.78, 0.74], 0.8); m.box(-0.4, 0, -0.4, 0.4, 0.5, 0.4); m.mat(MAT.STONE, [0.72, 0.7, 0.66], 0.8); m.box(-0.14, 0.5, -0.1, 0.14, 1.5, 0.1); m.ball(0, 1.62, 0, 0.14); }, { at: 9.5, noClear: false });
  pSpot(P, 'nave', 0, 3.4, PI, { k: 0 });
  for (const sx of [-1, 1]) pAgainst(P, nave, sx < 0 ? 'w' : 'e', P.id + '.shelfn' + sx, 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, PD.books(c, 1.6)), { at: 9 });
  const bk = pFree(P, nave, P.id + '.lectern', 0.5, 0.5, 1.1, 0, m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.2, 0, -0.2, 0.2, 1.0, 0.2); m.mat(MAT.CLOTH, [0.24, 0.07, 0.06], 0.5); m.box(-0.28, 1.0, -0.22, 0.28, 1.05, 0.22); }, { near: [-3.2, 10.4] });
  if (bk) pInteract(P, bk.cx, 1.1, bk.cz, Object.assign({ kind: 'read', id: 'chapel.book', r: 1.7 }, READS['chapel.book']), 0);
  pLamp(P, nave, 0, 3.0); pLamp(P, nave, 0, 8.0);
  if (Kit.pieces.Chandelier) for (const z of [3.0, 8.0]) { const L0 = P.lv[0]; at(P.c.int, 0, 0, z, 0, () => kitLit(P.c.int, 'Chandelier', 0, L0.H - 0.1, 0, 0.55, 0, { r: 10, c: [3.0, 1.9, 0.85], kind: 'candle', always: true })); }
  pWalls(P, nave, ['Banner_1_Cloth', 'Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal', 'paint', 'Banner_1_Cloth']);
  pKitFloor(P, nave, 'w', 'CandleStick_Stand', { n: 'a', at: 10 }); pKitFloor(P, nave, 'e', 'CandleStick_Stand', { n: 'b', at: 10 });
  const e = P.doors.find(d => d.b === null); if (e) { pSconce(P, nave, 'n', e.x + 1.4); pSconce(P, nave, 'n', e.x - 1.4); }
  // sacristy: a vestment chest with the crypt key, a table, shelves
  const ch = pAgainst(P, sac, 's', P.id + '.sacristy', 0.85, 0.5, 0.6, +1, pdChest, { lowOk: true, at: 'start' }) || pAgainst(P, sac, 'n', P.id + '.sacristy', 0.85, 0.5, 0.6, +1, pdChest, { lowOk: true, at: 'start' });
  if (ch) pInteract(P, ch.cx, 0.5, ch.cz, { kind: 'chest', id: 'chapel.sacristy', loot: [['cryptkey', 1], ['gold', 3]], r: 1.8 }, 0);
  pFree(P, sac, P.id + '.sactable', 1.4, 0.7, 0.8, 0, pdTable(1.4, 0.7, ['candle', 'book', 'mug'], 3, c), { near: [6.5, 5.4], surface: true });
  pAgainst(P, sac, 'n', P.id + '.sacshelf', 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, stockFill(c, ['book', 'candle', 'jug'])), {}) || pAgainst(P, sac, 'w', P.id + '.sacshelf', 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, null), {});
  pLamp(P, sac, 7, 3.2);
  // the bell tower: a stone chamber west of the nave with the bell high above and the rope hanging down its middle
  { const tw = P.rooms.tower, m = P.c.int, L0 = P.lv[0], cx = -7, cz = 2.5;
    m.m1 = P.zone; m.ao = INT_AO;
    at(m, cx, L0.y + 0.02, cz, 0, () => {
      m.mat(MAT.TIMBER, COL.timberDark); m.box(-1.5, 2.55, -0.09, 1.5, 2.73, 0.09);
      m.mat(MAT.METAL, COL.bronze); m.push().T(0, 2.0, 0); m.lathe([[0.48, 0], [0.42, 0.06], [0.33, 0.3], [0.27, 0.62], [0.17, 0.85], [0.03, 0.93]], 12, 0); m.mat(MAT.METAL, COL.black); m.box(-0.02, -0.12, -0.02, 0.02, 0.6, 0.02); m.ball(0, -0.12, 0, 0.07); m.pop();
      m.mat(MAT.CLOTH, [0.75, 0.62, 0.4], 0.3); m.box(0.7 - 0.012, 0.9, -0.012, 0.7 + 0.012, 2.0, 0.012);
    });
    World.bell = { p: P.w2(cx, L0.y + 2.4, cz) };
    pInteract(P, cx + 0.7, 1.4, cz, { kind: 'bell', id: 'bell', r: 1.9 }, 0);
    pLamp(P, tw, -7, 3.5); pTorch(P, tw, 'w', 2.5, 1.7, 6.5);
    P.occ(0, { x0: cx + 0.55, x1: cx + 0.85, z0: cz - 0.15, z1: cz + 0.15 }, 'floor', P.id + '.rope', { h: 1.0, room: 'tower', y0: L0.y });
  }
  // the crypt: the vault is a landing, behind the gate the tombs
  pTorch(P, vault, 'n', 7.5, 1.7, 6.5) || pTorch(P, vault, 's', 7.5, 1.7, 6.5);
  pFree(P, vault, P.id + '.vbarrel', 0.9, 0.9, 0.9, 0, m => Props.barrel(m, 0.33, 0.9), { near: [5.7, 5.5] });
  let tn = 0; for (const z of [2.5, 5.0, 7.5, 10.0]) for (const x of [-3.2, 3.2]) { if (pPut(P, crypt, P.id + '.tomb' + tn++, x, z, PI / 2, 2.2, 0.95, 0.75, pdTomb(2.2), {})) { } }
  const rel = pAgainst(P, crypt, 'w', P.id + '.relic', 0.85, 0.5, 0.6, +1, pdChest, { lowOk: true, at: 6 });
  if (rel) pInteract(P, rel.cx, 0.5, rel.cz, { kind: 'chest', id: 'chapel.relic', loot: [['gold', 40], ['potion', 2]], r: 1.8 }, -1);
  for (const [sd, u] of [['n', -2], ['n', 2], ['s', -2], ['s', 2], ['w', 3], ['w', 9], ['e', 3], ['e', 9]]) pTorch(P, crypt, sd, u, 1.7, 8.5);
  const g = P.doors.find(d => d.gate); if (g) P.gate = pGate(P, g, 'chapel.gate', 'cryptkey', 'Iron gate');
  /* the density pass (D): shrines, hangings, niches and cupboards on every free wall run, tomb-side furnishings in the crypt */
  PD.dense(P, nave, { pool: ['shrine', 'tapestry', 'hooks', 'tapestry', 'niche', 'bench'], corners: true, corner: ['stack', 'broom', 'sacks'], mid: { kinds: ['rug'], max: 1, min: 1.6 } });
  PD.dense(P, sac, { pool: ['cupboard', 'books', 'cabinet', 'hooks', 'paint', 'shelf'], corner: ['broom', 'sacks', 'stack'], mid: { kinds: ['table', 'rug'], max: 2 } });
  PD.dense(P, P.rooms.tower, { pool: ['hooks', 'cask', 'cupboard', 'shelf'], corner: ['stack', 'sacks', 'broom'], mid: { kinds: ['sacks'], max: 1 } });
  PD.dense(P, crypt, { pool: ['niche', 'niche', 'niche'], corner: ['cask', 'sacks'], middle: false });
  PD.dense(P, vault, { pool: ['cask', 'sacks', 'niche', 'shelf'], corner: ['cask', 'sacks', 'stack'], mid: { kinds: ['casks', 'sacks'], max: 2, min: 0.8 } });
  pPier; // no hearth in a chapel
};
