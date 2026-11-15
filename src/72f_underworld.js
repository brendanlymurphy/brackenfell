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
const pdAltar = m => { m.mat(MAT.STONE, [0.85, 0.83, 0.79], 0.8); m.box(-1.1, 0, -0.45, 1.1, 0.95, 0.45); m.mat(MAT.CLOTH, COL.red, 0.5); m.box(-0.95, 0.95, -0.4, 0.95, 0.97, 0.4); for (const sx of [-0.7, 0.7]) at(m, sx, 0.97, 0, 0, () => Props.candle(m, null, true)); };

PLANS.chapel = (P, c, info) => {
  const R = P.R, need = P.need;
  P.dims = { W: 14, D: 12 };
  pLevel(P, -1, -(H_CELLAR + PW.SLAB), H_CELLAR); pLevel(P, 0, 0, H_GROUND + 0.6);
  // nave (west, long) and the sacristy (east, with the stair to the crypt)
  pRoom(P, 0, 'nave', 'nave', -5, 0, 5, 12); pRoom(P, 0, 'sacristy', 'sacristy', 5, 0, 9, 7);
  pDoor(P, 'nave', null, 0, 0); pDoor(P, 'nave', 'sacristy', 5, 3.5);
  // crypt: the stair arrives in the east vault; a gate leads west under the nave; a second gate-less arch to the ossuary
  pRoom(P, -1, 'vault', 'cellar', 5, 0, 9, 7, { floor: 'stone', win: false }); pRoom(P, -1, 'crypt', 'cellar', -5, 0, 5, 12, { floor: 'stone', win: false });
  pDoor(P, 'vault', 'crypt', 5, 3.5, { gate: true });
  pStair(P, { id: 'stCrypt', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: 1, x: 8.05, z: 1.3, width: 1.0, tread: 0.22 });
  pLayout(P);
  const nave = P.rooms.nave, sac = P.rooms.sacristy, vault = P.rooms.vault, crypt = P.rooms.crypt;
  // nave: the altar against the far wall, pews facing it, candles
  const al = pAgainst(P, nave, 's', P.id + '.altar', 2.2, 0.9, 1.0, +1, pdAltar, {});
  if (al) { pSpot(P, 'altar', al.cx, al.cz - 1.1, 0, { k: 0 }); P.lightIn.nave = 1; }
  let row = 0; for (const z of [4.0, 5.6, 7.2]) for (const x of [-2.6, 2.6]) { pPut(P, nave, P.id + '.pew' + row++, x, z, 0, 3.4, 0.45, 0.9, pdBench(3.4), {}); }
  pSpot(P, 'nave', 0, 3.0, PI, { k: 0 });
  for (const sx of [-1, 1]) pAgainst(P, nave, sx < 0 ? 'w' : 'e', P.id + '.shelfn' + sx, 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, null), { at: 9 });
  const bk = pFree(P, nave, P.id + '.lectern', 0.5, 0.5, 1.1, 0, m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.2, 0, -0.2, 0.2, 1.0, 0.2); m.mat(MAT.CLOTH, COL.red, 0.5); m.box(-0.28, 1.0, -0.22, 0.28, 1.05, 0.22); }, { near: [-3.2, 10.4] });
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
  // the crypt: the vault is a landing, behind the gate the tombs
  pTorch(P, vault, 'n', 7.5, 1.7, 6.5) || pTorch(P, vault, 's', 7.5, 1.7, 6.5);
  pFree(P, vault, P.id + '.vbarrel', 0.9, 0.9, 0.9, 0, m => Props.barrel(m, 0.33, 0.9), { near: [5.7, 5.5] });
  let tn = 0; for (const z of [2.5, 5.0, 7.5, 10.0]) for (const x of [-3.2, 3.2]) { if (pPut(P, crypt, P.id + '.tomb' + tn++, x, z, PI / 2, 2.2, 0.95, 0.75, pdTomb(2.2), {})) { } }
  const rel = pAgainst(P, crypt, 'w', P.id + '.relic', 0.85, 0.5, 0.6, +1, pdChest, { lowOk: true, at: 6 });
  if (rel) pInteract(P, rel.cx, 0.5, rel.cz, { kind: 'chest', id: 'chapel.relic', loot: [['gold', 40], ['potion', 2]], r: 1.8 }, -1);
  for (const [sd, u] of [['n', -2], ['n', 2], ['s', -2], ['s', 2], ['w', 3], ['w', 9], ['e', 3], ['e', 9]]) pTorch(P, crypt, sd, u, 1.7, 8.5);
  const g = P.doors.find(d => d.gate); if (g) P.gate = pGate(P, g, 'chapel.gate', 'cryptkey', 'Iron gate');
  pPier; // no hearth in a chapel
};
