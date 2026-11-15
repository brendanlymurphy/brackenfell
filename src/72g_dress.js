// ───────────────────────── set dressing shared by the designed plans: things that hang, stand and fill ─────────────────────────
// Everything here draws into the cell's interior mesh (P.c.int) in the plan's canonical frame and records what it occupies through the placement helpers of 72d_plan.js.
const PD = {};
// a bookcase's contents: upright spines of varied colour, height and lean, with gaps
PD.books = (c, len) => (i, y) => { const m = c.int, R = c.R; let x = -len / 2 + 0.06;
  while (x < len / 2 - 0.12) { if (R() < 0.12) { x += 0.1 + R() * 0.15; continue; } const w = 0.05 + R() * 0.09, h = 0.18 + R() * 0.1; m.mat(MAT.CLOTH, R.pick([COL.red, COL.blue, COL.green, COL.leather, COL.purple, [0.3, 0.22, 0.14]]), 0.5); m.box(x, y, -0.11, x + w, y + h, 0.12); m.mat(MAT.PLAIN, COL.parchment); m.box(x + 0.005, y + 0.005, -0.112, x + w - 0.005, y + h - 0.005, -0.1, 0); x += w + 0.004; } };
// shelves filled with rolled bolts of cloth lying end-on, in a few colours
PD.bolts = (c, len, cols) => (i, y) => { const m = c.int, R = c.R; let x = -len / 2 + 0.1; cols = cols || [COL.red, COL.blue, COL.green, COL.purple, [0.7, 0.62, 0.45], [0.55, 0.5, 0.42], [0.25, 0.3, 0.4]];
  while (x < len / 2 - 0.12) { const r = 0.07 + R() * 0.03; m.mat(MAT.CLOTH, R.pick(cols), 0.5); m.push().T(x + r, y + r, -0.02).RX(PI / 2); m.lathe([[r, -0.14], [r, 0.14]], 7, 2); m.pop(); x += r * 2 + 0.01; } };
// sacks and jars on a shelf: a plain row of grain bags and pots, for a store
PD.goods = (c, len) => (i, y) => { const m = c.int, R = c.R; let x = -len / 2 + 0.1;
  while (x < len / 2 - 0.15) { const k = R(), w = 0.12 + R() * 0.1; at(m, x + w / 2, y, R.s() * 0.03, R() * 6, () => { if (k < 0.3) Props.sack(m, 0.12 + R() * 0.04, R.pick([[0.7, 0.62, 0.45], [0.6, 0.55, 0.42], [0.5, 0.45, 0.32]])); else if (k < 0.55) Props.jug(m); else if (k < 0.7) Props.cheese(m); else if (k < 0.85) Props.pot(m, 0.1, R.pick([COL.clay, [0.5, 0.42, 0.3], [0.3, 0.3, 0.32]])); else Props.bottle(m); }); x += w + 0.06; } };
// a rod hung from the ceiling beams on two chains, with hams, herb bundles, pots and onions; its bottom stays above head height
PD.rack = function (P, room, x, z, len, rot, kinds) {
  const L = P.lv[room.k], m = P.c.int, R = P.R, H = Math.min(L.H, 3.4); m.m1 = P.zone; m.ao = INT_AO; kinds = kinds || ['herb', 'ham', 'pot', 'herb', 'garlic', 'pot'];
  at(m, x, L.y + L.H, z, rot, () => {
    m.mat(MAT.TIMBER, COL.timberDark); m.box(-len / 2, -0.6, -0.035, len / 2, -0.54, 0.035);
    m.mat(MAT.METAL, COL.black); for (const sx of [-1, 1]) m.box(sx * len * 0.42 - 0.008, -0.6, -0.008, sx * len * 0.42 + 0.008, 0, 0.008);
    const n = Math.max(3, Math.round(len / 0.38));
    for (let i = 0; i < n; i++) {
      const px = -len / 2 + 0.2 + i * (len - 0.4) / (n - 1), k = R.pick(kinds), j = R.s() * 0.03;
      m.mat(MAT.METAL, COL.black); m.box(px - 0.006, -0.78, -0.006, px + 0.006, -0.6, 0.006);
      if (k === 'herb') { m.mat(MAT.CLOTH, R.pick([[0.3, 0.4, 0.18], [0.42, 0.4, 0.2], [0.5, 0.38, 0.2]]), 0.5); m.cyl(px + j, -1.12, 0, 0.1, 0.02, 0.34, 6, 1); }
      else if (k === 'ham') { m.mat(MAT.PLAIN, [0.5, 0.26, 0.2]); m.ball(px, -1.0, 0, 0.1, 0.17, 0.1, 6, 4); }
      else if (k === 'pot') { m.mat(MAT.METAL, COL.black); m.cyl(px, -1.0, 0, 0.13, 0.16, 0.2, 8, 2); }
      else { m.mat(MAT.PLAIN, [0.78, 0.7, 0.5]); m.ball(px, -0.95, 0, 0.06, 0.08, 0.06, 5, 3); m.ball(px + 0.02, -1.08, 0, 0.06, 0.08, 0.06, 5, 3); }
    }
  });
  P.lightIn[room.id] = P.lightIn[room.id] || 0;
};
// a runner rug along a line (flat, any room): w x len, centred
PD.rug = (P, room, x, z, w, l, col, rot) => pPut(P, room, P.id + '.rug' + (P.items.length), x, z, rot || 0, w, l, 0.02, pdRug(w, l, col || COL.red), { flat: true, noClear: true });
// the landing or gallery of a house: a reading table with chairs by a window, a bookcase, a runner rug, banners
PD.gallery = function (P, room) {
  const c = P.c, R = P.R, a = room.in;
  PD.rug(P, room, (a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2 + 1, 2.0, 5.0, [0.32, 0.2, 0.18], 0);
  for (const sd of ['w', 'n', 's', 'e']) if (pAgainst(P, room, sd, P.id + '.gbooks', 1.8, 0.34, 1.8, +1, pdShelf(1.8, 1.8, 3, PD.books(c, 1.8)), {})) break;
  const t = pFree(P, room, P.id + '.gtable', 1.3, 0.75, 0.78, 0, pdTable(1.3, 0.75, ['book', 'candle', 'mug'], 3, c), { near: [a.x0 + 1.4, a.z1 - 2.2], surface: true });
  if (t) { for (const sg of [-1, 1]) { const ch = pPut(P, room, P.id + '.gchair' + sg, t.cx + sg * 0.1, t.cz + sg * 0.8, sg > 0 ? PI : 0, 0.5, 0.5, 0.95, pdChair, { lowOk: true }); } }
  pFree(P, room, P.id + '.gchest', 0.85, 0.5, 0.58, 0, pdChest, { near: [a.x0 + 0.8, a.z1 - 0.6], lowOk: true });
  PD.rack(P, room, (a.x0 + a.x1) / 2, a.z0 + 4.2, 1.6, PI / 2, ['herb', 'herb', 'garlic']);
};
