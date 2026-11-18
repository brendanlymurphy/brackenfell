// ───────────────────────── set dressing shared by the designed plans: things that hang, stand and fill ─────────────────────────
// Everything here draws into the cell's interior mesh (P.c.int) in the plan's canonical frame and records what it occupies through the placement helpers of 72d_plan.js.
const PD = {};
// a bookcase's contents: upright spines of varied colour, height and lean, with gaps
PD.books = (c, len) => (i, y) => { const m = c.int, R = c.R; let x = -len / 2 + 0.06;
  while (x < len / 2 - 0.12) { if (R() < 0.12) { x += 0.1 + R() * 0.15; continue; } const w = 0.05 + R() * 0.09, h = 0.18 + R() * 0.1; m.mat(MAT.CLOTH, R.pick([DYE.red, DYE.blue, DYE.green, COL.leather, DYE.purple, [0.3, 0.22, 0.14]]), 0.5); m.box(x, y, -0.11, x + w, y + h, 0.12); m.mat(MAT.PLAIN, COL.parchment); m.box(x + 0.005, y + 0.005, -0.112, x + w - 0.005, y + h - 0.005, -0.1, 0); x += w + 0.004; } };
// shelves filled with rolled bolts of cloth lying end-on, in a few colours
PD.bolts = (c, len, cols) => (i, y) => { const m = c.int, R = c.R; let x = -len / 2 + 0.1; cols = cols || [DYE.red, DYE.blue, DYE.green, DYE.yellow, DYE.cream, DYE.grey, DYE.brown];
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
      if (k === 'herb') { const hc = R.pick([[0.3, 0.33, 0.2], [0.36, 0.34, 0.22], [0.38, 0.3, 0.2], [0.3, 0.28, 0.19]]); m.mat(MAT.CLOTH, hc, 0.6); for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283, rr = 0.03 + (q % 2) * 0.015; m.cyl(px + j + Math.cos(a) * rr, -1.06 - (q % 3) * 0.03, Math.sin(a) * rr, 0.012, 0.004, 0.26 + (q % 3) * 0.03, 4, 1); } m.mat(MAT.CLOTH, [0.42, 0.34, 0.22], 0.5); m.cyl(px + j, -0.84, 0, 0.026, 0.026, 0.025, 6, 2); }      // [c5] a bundle of stems tied at the neck, 0.3 m, not a cone
      else if (k === 'ham') { m.mat(MAT.THATCH, [0.42, 0.24, 0.19], 0.4); m.ball(px, -1.0, 0, 0.1, 0.17, 0.1, 6, 4); }
      else if (k === 'pot') { m.mat(MAT.METAL, R.pick([[0.42, 0.28, 0.17], [0.36, 0.3, 0.24], [0.45, 0.33, 0.2]])); at(m, px, 0, 0, 0, () => m.lathe([[0.005, -1.08], [0.06, -1.07], [0.085, -0.98], [0.07, -0.9], [0.075, -0.88]], 8, 0)); }      // [c5] a small copper pot, not a black tub
      else { m.mat(MAT.CLOTH, [0.2, 0.17, 0.12], 0.5); m.cyl(px, -0.5, 0, 0.006, 0.006, 0.5, 4, 1); m.mat(MAT.CLOTH, [0.36, 0.32, 0.24], 0.5); for (let q = 0; q < 5; q++) m.ball(px + (q % 2 ? 0.035 : -0.035), -0.62 - q * 0.075, (q % 3 - 1) * 0.02, 0.04, 0.045, 0.04, 8, 4); }      // [fx2] a string of garlic heads, dull cream, not two bright faceted lumps
    }
  });
  P.lightIn[room.id] = P.lightIn[room.id] || 0;
};
// a runner rug along a line (flat, any room): w x len, centred
PD.rug = (P, room, x, z, w, l, col, rot) => pPut(P, room, P.id + '.rug' + (P.items.length), x, z, rot || 0, w, l, 0.02, pdRug(w, l, col || DYE.red), { flat: true, noClear: true });
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

// ───────── cheap props ─────────
// a cask lying on a wooden cradle (axis along local x, about 250 triangles; the kit's Barrel_Holder is 1560)
PD.cask = (len, r) => m => {
  m.mat(MAT.PLANKS, COL.wood); for (const sx of [-1, 1]) m.box(sx * len * 0.3 - 0.04, 0, -r * 0.75, sx * len * 0.3 + 0.04, 0.2, r * 0.75);
  m.push().T(0, 0.1 + r, 0).RZ(PI / 2); m.mat(MAT.PLANKS, COL.woodDark); m.lathe([[r * 0.78, -len / 2], [r * 0.94, -len / 4], [r, 0], [r * 0.94, len / 4], [r * 0.78, len / 2]], 10, 2);
  m.mat(MAT.METAL, COL.black); for (const y of [-len * 0.34, len * 0.34]) m.cyl(0, y - 0.015, 0, r * 0.9, r * 0.9, 0.03, 10, 0);
  m.mat(MAT.PLANKS, COL.wood); m.cyl(0, len / 2 - 0.005, 0, r * 0.74, r * 0.74, 0.012, 10, 0); m.pop();
  addBoxCollider(m, -len / 2, -r, len / 2, r, 0, r * 2 + 0.1);
};
PD.broom = m => { m.mat(MAT.TIMBER, COL.wood); m.push().RZ(0.09); m.box(-0.012, 0, -0.012, 0.012, 1.45, 0.012); m.mat(MAT.THATCH, COL.hay, 0.5); m.cyl(0, 0, 0, 0.08, 0.035, 0.3, 6, 1); m.pop(); addBoxCollider(m, -0.12, -0.12, 0.12, 0.12, 0, 1.4); };
PD.sacks = (R) => m => { const cols = [[0.46, 0.39, 0.27], [0.4, 0.35, 0.26], [0.5, 0.43, 0.3]]; for (const [x, z, s, y] of [[-0.18, 0, 0.24, 0], [0.2, 0.02, 0.22, 0], [0.0, -0.04, 0.2, 0.3]]) { m.mat(MAT.CLOTH, R.pick(cols), 0.5); m.ball(x, y + s * 0.9, z, s * 0.85, s, s * 0.8, 6, 4); } addBoxCollider(m, -0.4, -0.3, 0.4, 0.3, 0, 0.6); };
PD.stack = (R) => m => { Props.woodpile(m, 3, 4, 0.7); };          // [fx2] 3 columns = 0.55 m deep (5 drew 0.91 m into a 0.5 m slot)
// cloaks, aprons and a hat on pegs over a rail (hung on a wall: see the frame note in PD.fill)
PD.hooks = (R, w) => (m, hh) => {
  m.mat(MAT.PLANKS, COL.wood, 0.5); m.box(-w / 2, 0.0, -0.055, w / 2, 0.09, 0); m.mat(MAT.PLANKS, COL.woodDark, 0.5); m.box(-w / 2 - 0.015, -0.01, -0.065, -w / 2, 0.1, 0.0); m.box(w / 2, -0.01, -0.065, w / 2 + 0.015, 0.1, 0.0); m.box(-w / 2, 0.035, -0.062, w / 2, 0.055, -0.055);
  const n = Math.max(2, Math.floor(w / 0.32)); let cloaks = 0;
  const cols = [[0.2, 0.11, 0.09], [0.12, 0.14, 0.17], [0.27, 0.21, 0.11], [0.3, 0.27, 0.22], [0.15, 0.18, 0.11], [0.22, 0.18, 0.13], [0.14, 0.12, 0.11]];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n; m.mat(MAT.METAL, COL.black); m.box(x - 0.012, -0.02, -0.09, x + 0.012, 0.03, 0);
    const kind = cloaks < 2 && R() < 0.55 ? 'cloak' : R.pick(['hat', 'satchel', 'rope', 'none', 'cloakless']);
    if (kind === 'cloak') {
      cloaks++; const cl = R.pick(cols), l = 0.9 + R() * 0.4, wH = 0.42 + R() * 0.16, nS = 9, ph = R() * 6.3, fz = k_ => 0.02 + 0.07 * (0.5 + 0.5 * Math.sin(k_ * 1.9 + ph));
      for (let q = 0; q < nS; q++) {
        const v = 0.8 + 0.3 * (0.5 + 0.5 * Math.sin((q + 0.5) * 1.9 + ph + 1.2)), l0 = l * (0.94 + 0.06 * Math.sin(q * 2.7 + ph)), l1 = l * (0.94 + 0.06 * Math.sin((q + 1) * 2.7 + ph));
        m.mat(MAT.CLOTH, [cl[0] * v, cl[1] * v, cl[2] * v], 0.5);
        m.quad2([x + (q / nS - 0.5) * 0.16, -0.12, -0.1 - fz(q) * 0.5], [x + (q / nS - 0.5) * wH, -l0, -0.1 - fz(q)], [x + ((q + 1) / nS - 0.5) * wH, -l1, -0.1 - fz(q + 1)], [x + ((q + 1) / nS - 0.5) * 0.16, -0.12, -0.1 - fz(q + 1) * 0.5], 0, 0, 1, 1);
      }
      m.mat(MAT.CLOTH, [cl[0] * 0.7, cl[1] * 0.7, cl[2] * 0.7], 0.5); m.box(x - 0.08, -0.26, -0.2, x + 0.08, -0.04, -0.09);
    } else if (kind === 'hat') {
      { const hc = R.pick(cols); m.mat(MAT.CLOTH, hc, 0.5); m.box(x - 0.16, -0.34, -0.12, x + 0.16, -0.06, -0.1); m.mat(MAT.CLOTH, hc.map(v => v * 0.8), 0.5); m.box(x - 0.08, -0.28, -0.2, x + 0.08, -0.12, -0.12); }
    } else if (kind === 'satchel') {
      m.mat(MAT.PLANKS, [0.36, 0.25, 0.15], 0.5); m.box(x - 0.15, -0.5, -0.17, x + 0.15, -0.28, -0.09); m.box(x - 0.15, -0.34, -0.19, x + 0.15, -0.28, -0.17); m.beam([x - 0.1, -0.02, -0.08], [x - 0.12, -0.34, -0.1], 0.025, 0.012); m.beam([x + 0.1, -0.02, -0.08], [x + 0.12, -0.34, -0.1], 0.025, 0.012);
    } else if (kind === 'rope') {
      m.mat(MAT.CLOTH, [0.34, 0.28, 0.17], 0.5); m.box(x - 0.13, -0.38, -0.17, x + 0.13, -0.1, -0.09); m.mat(MAT.CLOTH, [0.22, 0.18, 0.11], 0.5); m.box(x - 0.05, -0.3, -0.175, x + 0.05, -0.18, -0.165);
    }
  }
};
// a long tapestry on a rod: border, field and a pale device
PD.tapestry = (R, w, h) => (m, hh) => {      /* [inout] AL5: cloth hung from a rod, not a board: pleats that catch the light, a hem, loops over the rod, woven bands that follow the folds */
  m.mat(MAT.METAL, COL.black); m.push().T(0, h + 0.03, -0.075).RZ(PI / 2); m.lathe([[0.012, -w / 2 - 0.07], [0.012, w / 2 + 0.07]], 6, 3); m.pop();
  for (const sx of [-1, 1]) { m.ball(sx * (w / 2 + 0.08), h + 0.03, -0.075, 0.025, 0.025, 0.025, 6, 4); m.box(sx * (w / 2 + 0.03) - 0.008, h + 0.03, -0.11, sx * (w / 2 + 0.03) + 0.008, h + 0.045, -0.04); }
  const c = R.pick([DYE.red, DYE.blue, DYE.green, DYE.purple]), base = [c[0] * 0.62, c[1] * 0.62, c[2] * 0.62], n = Math.max(6, Math.round(w / 0.11)), sw = w / n;
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + i * sw, deep = i % 2 === 0, z0 = deep ? -0.072 : -0.058, sh = deep ? 0.94 : 1.06, drop = (R() - 0.5) * 0.012;
    m.mat(MAT.CLOTH, base.map(v => v * sh), 0.6); m.box(x0, 0.05 + drop, z0 - 0.012, x0 + sw + 0.004, h, z0);
    m.mat(MAT.CLOTH, [0.46 * sh, 0.38 * sh, 0.24 * sh], 0.6); for (const y of [0.12, h - 0.13]) m.box(x0, y, z0 - 0.014, x0 + sw + 0.004, y + 0.03, z0 + 0.001);
    m.mat(MAT.CLOTH, base.map(v => v * 0.8 * sh), 0.6); for (const k of [2, 4]) m.box(x0, h * k / 6, z0 - 0.013, x0 + sw + 0.004, h * k / 6 + 0.022, z0 + 0.001);
    m.mat(MAT.CLOTH, base.map(v => v * 0.68 * sh), 0.6); m.box(x0, drop, z0 - 0.016, x0 + sw + 0.004, 0.05 + drop, z0 + 0.003); }      /* the hem, turned and stitched */
  m.mat(MAT.CLOTH, base.map(v => v * 0.8), 0.6); for (let i = 0; i <= n; i += 2) { const x = -w / 2 + i * sw; m.box(x - 0.012, h - 0.01, -0.09, x + 0.012, h + 0.05, -0.06); }      /* loops over the rod */
};
// a niche in a wall (crypt, nave): dark recess with an arch lintel, a candle that glows without a light, a skull or an urn
PD.niche = (R, urn) => (m, hh) => {
  m.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.8); m.box(-0.34, 0, -0.1, 0.34, 0.06, -0.03); m.box(-0.34, 0.06, -0.1, -0.28, 0.72, -0.03); m.box(0.28, 0.06, -0.1, 0.34, 0.72, -0.03); m.box(-0.34, 0.72, -0.1, 0.34, 0.8, -0.03);
  m.mat(MAT.PLAIN, [0.02, 0.018, 0.015]); m.box(-0.28, 0.06, -0.035, 0.28, 0.72, -0.03);
  if (urn) { m.mat(MAT.PLAIN, [0.45, 0.4, 0.33]); m.lathe([[0.0, 0.06], [0.1, 0.07], [0.13, 0.17], [0.08, 0.3], [0.05, 0.33]], 8, 1); }
  else { m.mat(MAT.PLAIN, [0.8, 0.76, 0.66]); m.ball(0, 0.15, -0.06, 0.085, 0.1, 0.09, 6, 4); }
  m.mat(MAT.PLAIN, COL.wax); m.cyl(0.19, 0.06, -0.07, 0.014, 0.012, 0.1, 5, 2); emit(m, 1.6, () => { m.mat(MAT.PLAIN, [1, 0.7, 0.3]); m.ball(0.19, 0.18, -0.07, 0.014, 0.022, 0.014, 4, 3); });
};
// a small shrine / side altar for the nave walls: stone block, cloth, candles (unlit tips), an icon
PD.shrine = m => {
  m.mat(MAT.STONE, [0.78, 0.76, 0.72], 0.8); m.box(-0.6, 0, -0.25, 0.6, 0.85, 0.25); m.box(-0.66, 0.85, -0.29, 0.66, 0.92, 0.29);
  m.mat(MAT.CLOTH, [0.4, 0.1, 0.1], 0.5); m.box(-0.5, 0.92, -0.2, 0.5, 0.935, 0.2); m.mat(MAT.CLOTH, [0.55, 0.45, 0.2], 0.5); m.box(-0.5, 0.3, -0.295, 0.5, 0.33, -0.25);
  for (const sx of [-0.4, 0.4]) { m.mat(MAT.PLAIN, COL.wax); m.cyl(sx, 0.935, 0, 0.025, 0.022, 0.2, 6, 2); emit(m, 1.6, () => { m.mat(MAT.PLAIN, [1, 0.7, 0.3]); m.ball(sx, 1.16, 0, 0.016, 0.026, 0.016, 4, 3); }); }
  m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.12, 0.945, -0.02, 0.12, 1.3, 0.02); m.mat(MAT.METAL, COL.bronze); m.box(-0.07, 1.05, -0.025, 0.07, 1.09, -0.02); m.box(-0.015, 0.95, -0.025, 0.015, 1.25, -0.02);
  addBoxCollider(m, -0.66, -0.29, 0.66, 0.29, 0, 1.0);
};
PD.cupboard = m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.5, 0, -0.26, 0.5, 1.7, 0.26); m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.47, 0.08, -0.275, -0.01, 1.4, -0.26); m.box(0.01, 0.08, -0.275, 0.47, 1.4, -0.26); m.box(-0.56, 1.7, -0.3, 0.56, 1.76, 0.3); m.mat(MAT.METAL, COL.black); for (const sx of [-0.06, 0.06]) m.box(sx - 0.01, 0.7, -0.285, sx + 0.01, 0.82, -0.275); addBoxCollider(m, -0.56, -0.3, 0.56, 0.3, 0, 1.76); };

// ───────── density ─────────
const PD_DEF = {      // [width, depth] of what a pool entry occupies along / out from the wall
  shelf: [1.5, 0.34], books: [1.8, 0.34], cabinet: [1.36, 0.38], cask: [1.0, 0.95], cupboard: [1.12, 0.6], bench: [1.6, 0.4], sacks: [0.9, 0.6], broom: [0.3, 0.3], stack: [0.8, 0.5], shrine: [1.32, 0.6],
};
// something against a wall near u (not further than tol): returns its width or 0
PD.floorAt = function (P, room, sd, id, w, d, h, draw, u, tol, o) {
  const hk = id.replace(/^[^.]*\./, '').replace(/\d+/g, '') + sd + w.toFixed(2) + d.toFixed(2), hon = {}; if (HON_C[hk]) hon.rel = Object.assign({}, HON_C[hk]);   // [fx2] flush for what this kind really occupies
  const s = pWallSlot(P, room, sd, w, d, Object.assign({ at: u + w / 2, h, _hon: hon }, o || {})); if (!s) return 0;
  const along = (sd === 'n' || sd === 's') ? s.cx : s.cz; if (Math.abs(along - u - w / 2) > tol) return 0;
  const it = pPut(P, room, id, s.cx, s.cz, rotBack(sd, +1), w, d, h, draw, Object.assign({ back: sd, _hon: hon }, o || {})); if (hon.rel) HON_C[hk] = Object.assign({}, hon.rel);
  return it ? w : 0;
};
PD.try = function (P, room, sd, u, kind, R, fill) {
  const c = P.c, n = P.items.length, id = P.id + '.d' + n;
  switch (kind) {
    case 'shelf': return PD.floorAt(P, room, sd, id + 'sh', 1.5, 0.34, 1.8, pdShelf(1.5, 1.8, 3, fill || PD.goods(c, 1.5)), u, 0.3);
    case 'books': return PD.floorAt(P, room, sd, id + 'bk', 1.8, 0.34, 1.8, pdShelf(1.8, 1.8, 3, PD.books(c, 1.8)), u, 0.3);
    // [fin] cabinet: at most one filler to a room, none where a cupboard, press or chest already serves; an empty wall is allowed
    case 'cabinet': { const q = (P.fixt = P.fixt || {}), key = room.id + 'cabinet'; if (TEST && TEST.nocap ? (q[key] || 0) >= 5 : ((q[key] || 0) >= 1 || P.items.some(it => it.k === room.k && it.cx > room.x0 && it.cx < room.x1 && it.cz > room.z0 && it.cz < room.z1 && /cupboard|press|chest|wardrobe|Cabinet/i.test(String(it.id))))) return 0; const w = PD.floorAt(P, room, sd, id + 'cb', 1.36, 0.38, 0.8, m => kp(m, 'Cabinet', 0, 0, 0, 1, PI), u, 0.3, { lowOk: true }); if (w) q[key] = (q[key] || 0) + 1; return w; }
    case 'cupboard': return PD.floorAt(P, room, sd, id + 'cu', 1.12, 0.6, 1.76, PD.cupboard, u, 0.3);
    case 'cask': return PD.floorAt(P, room, sd, id + 'ck', 1.0, 0.95, 0.8, PD.cask(0.9, 0.32), u, 0.3, { lowOk: true });
    case 'bench': return PD.floorAt(P, room, sd, id + 'bn', 1.6, 0.4, 0.46, m => Props.bench(m, 1.6), u, 0.3, { lowOk: true });
    case 'sacks': return PD.floorAt(P, room, sd, id + 'sk', 0.9, 0.6, 0.6, PD.sacks(R), u, 0.3, { lowOk: true });
    case 'broom': return PD.floorAt(P, room, sd, id + 'br', 0.3, 0.3, 1.45, PD.broom, u, 0.3);
    case 'stack': return PD.floorAt(P, room, sd, id + 'ws', 0.8, 0.58, 0.7, PD.stack(R), u, 0.3, { lowOk: true });
    case 'shrine': return PD.floorAt(P, room, sd, id + 'sr', 1.32, 0.6, 1.3, PD.shrine, u, 0.3);
    case 'hooks': { const w = 0.9 + R() * 0.6; return pHang(P, room, sd, u + w / 2, w, 1.0, 1.9, PD.hooks(R, w), id + 'hk', { pivot: 1.75 }) ? w : 0; }
    case 'tapestry': { const w = 1.4 + R() * 0.4; return pHang(P, room, sd, u + w / 2, w, 1.1, 2.4, PD.tapestry(R, w, 1.2), id + 'tp', { pivot: 1.15 }) ? w : 0; }
    case 'niche': return pHang(P, room, sd, u + 0.4, 0.8, 0.5, 1.4, PD.niche(R, R() < 0.5), id + 'ni', { pivot: 0.55 }) ? 0.8 : 0;
    case 'paint': return pArt(P, room, sd, u + 0.4, 'paint') ? 0.9 : 0;
    case 'rack': return pArt(P, room, sd, u + 0.5, 'rack') ? 1.0 : 0;
    case 'sconce': case 'torch': {          // [c3] a bare wall run used to fill with a torch every 0.6 m: a few per room, spaced
      const q = (P.fixt = P.fixt || {}), key = room.id + kind, area = (room.x1 - room.x0) * (room.z1 - room.z0), cap = Math.max(2, Math.min(5, Math.round(area / 22)));
      const last = q[key + 'u'] && q[key + 'u'].find(v => v.sd === sd && Math.abs(v.u - u) < 2.4); if ((q[key] || 0) >= cap || last) return 0;
      const ok = kind === 'sconce' ? pSconce(P, room, sd, u + 0.15) : pTorch(P, room, sd, u + 0.15, 1.7, 7); if (!ok) return 0;
      q[key] = (q[key] || 0) + 1; (q[key + 'u'] = q[key + 'u'] || []).push({ sd, u }); return 0.5; }
    default: if (KIT_ITEM[kind]) return pKitFloor(P, room, sd, kind, { at: u + (KIT_ITEM[kind][0] * KIT_ITEM[kind][3]) / 2, n: 'd' + n }) ? KIT_ITEM[kind][0] * KIT_ITEM[kind][3] : 0;
      if (KIT_WALL[kind]) return pKitWall(P, room, sd, u + KIT_WALL[kind][0] / 2, kind) ? KIT_WALL[kind][0] : 0;
  }
  return 0;
};
// fill the free stretches of every wall of a room from a pool of kinds (cycled from a random start); floor things first at each point, hung things where the floor is taken
PD.fill = function (P, room, pool, o) {
  o = o || {}; const R = P.R, a = room.in; let placed = 0;
  for (const sd of pSidesLong(room)) {
    const hor = sd === 'n' || sd === 's', lo = (hor ? a.x0 : a.z0) + 0.1, hi = (hor ? a.x1 : a.z1) - 0.1; let q = (R() * pool.length) | 0;
    for (let u = lo; u < hi - 0.3;) {
      let got = 0;
      for (let k = 0; k < pool.length && !got; k++) got = PD.try(P, room, sd, u, pool[(q + k) % pool.length], R, o.fill);
      if (got) { u += got + 0.12; q++; placed++; if (o.max && placed >= o.max) return placed; } else u += 0.2;
    }
  }
  return placed;
};
// the corners: a broom, a barrel, sacks or firewood where a corner is free
PD.corners = function (P, room, kinds) {
  const R = P.R; let n = 0;
  for (const sd of ['n', 's', 'w', 'e']) for (const at of ['start', 'end']) {
    const k = R.pick(kinds); const hor = sd === 'n' || sd === 's', a = room.in, u = at === 'start' ? (hor ? a.x0 : a.z0) + 0.3 : (hor ? a.x1 : a.z1) - 0.3;
    if (PD.try(P, room, sd, u, k, R)) n++;
  }
  return n;
};
// the emptiest square of floor in a room: { x, z, r } with r the half-side of the largest clear square (items and doorway clearances count)
PD.emptiest = function (P, room) {
  const a = room.in, solid = P.items.filter(i => i.k === room.k && (P_SOLID[i.kind] || i.kind === 'rug')), clr = P.clear.filter(z => z.k === room.k && z.kind === 'door');
  let best = { r: 0 };
  for (let x = a.x0 + 0.5; x < a.x1 - 0.4; x += 0.5) for (let z = a.z0 + 0.5; z < a.z1 - 0.4; z += 0.5) {
    let r = Math.min(x - a.x0, a.x1 - x, z - a.z0, a.z1 - z);
    for (const it of solid.concat(clr)) { const dx = Math.max(it.x0 - x, 0, x - it.x1), dz = Math.max(it.z0 - z, 0, z - it.z1); r = Math.min(r, Math.max(dx, dz)); if (r <= best.r) break; }
    if (r > best.r) best = { x, z, r };
  }
  return best;
};
// the middle of the room: while a clear square wider than 2.2 m remains, put a table group, a rug with a stool, or a pile there
PD.middle = function (P, room, o) {
  o = o || {}; let n = 0;
  for (let i = 0; i < (o.max || 3); i++) {
    const e = PD.emptiest(P, room); if (e.r < (o.min || 1.1)) break;
    const kind = (o.kinds || ['table', 'rug'])[i % (o.kinds || ['table', 'rug']).length];
    if (kind === 'table') { const dn = pDining(P, room, 1.8, 0.85, { near: [e.x, e.z], id: 'mt' + i, n: 3 }); if (dn) { dn.seats.forEach((s, j) => pSit(P, 'mt' + i + 's' + j, s[0], s[1], s[2], room.k)); pLamp(P, room, dn.x, dn.z); n++; continue; } }
    if (kind === 'casks') { if (pFree(P, room, P.id + '.mc' + i, 0.9, 0.9, 0.8, 0, PD.cask(0.9, 0.32), { near: [e.x, e.z], lowOk: true })) { n++; continue; } }
    if (kind === 'sacks') { if (pFree(P, room, P.id + '.ms' + i, 0.9, 0.6, 0.6, 0, PD.sacks(P.R), { near: [e.x, e.z], lowOk: true })) { n++; continue; } }
    if (PD.rug(P, room, e.x, e.z, Math.min(2.4, e.r * 1.6), Math.min(3.2, e.r * 2.2), P.R.pick([DYE.red, [0.3, 0.22, 0.18], [0.25, 0.3, 0.2], [0.35, 0.28, 0.14]]), P.R() < 0.5 ? 0 : PI / 2)) n++;
    else break;
  }
  return n;
};
// hanging racks over the clear floor (never over a stairwell)
PD.racks = function (P, room, n, kinds) {
  const L = P.lv[room.k], a = room.in; let k = 0;
  for (const p of pCands(room, [(a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2], 0.5)) {
    if (k >= n) break; const w = 1.4, wide = (a.x1 - a.x0) >= (a.z1 - a.z0), r = wide ? rectOf(p[0], p[1], w + 0.4, 0.5) : rectOf(p[0], p[1], 0.5, w + 0.4);
    if (!rIn(r, a) || P.holes.some(h => h.k === room.k + 1 && rOv(r, h.r)) || P.holes.some(h => h.k === room.k && rOv(r, h.r))) continue;
    if (P.racksAt && P.racksAt.some(q => q.k === room.k && Math.hypot(q.x - p[0], q.z - p[1]) < 2.2)) continue;
    PD.rack(P, room, p[0], p[1], w, wide ? 0 : PI / 2, kinds); (P.racksAt = P.racksAt || []).push({ k: room.k, x: p[0], z: p[1] }); k++;
  }
  return k;
};
// the whole density pass for a room
PD.dense = function (P, room, o) {
  o = o || {}; const out = { walls: PD.fill(P, room, o.pool || ['shelf', 'cabinet', 'hooks', 'paint', 'cask', 'sconce'], o), corners: o.corners === false ? 0 : PD.corners(P, room, o.corner || ['broom', 'cask', 'sacks', 'stack']) };
  out.middle = o.middle === false ? 0 : PD.middle(P, room, o.mid); out.racks = o.racks ? PD.racks(P, room, o.racks, o.rackKinds) : 0; return out;
};
// stats for the density test: wall coverage (metres of wall with a floor item against it or a hung item, over the free wall) and the emptiest square
PD.stats = function (P) {
  const rows = {};
  for (const id in P.rooms) {
    const r = P.rooms[id], a = r.in; let free = 0, cov = 0;
    for (const sd of ['n', 's', 'w', 'e']) {
      const hor = sd === 'n' || sd === 's', lo = hor ? a.x0 : a.z0, hi = hor ? a.x1 : a.z1; free += hi - lo;
      const door = r.doors.filter(d => d.wall && (hor ? d.wall.ax === 'x' : d.wall.ax === 'z') && Math.abs(d.wall.c - (sd === 'n' ? r.z0 : sd === 's' ? r.z1 : sd === 'w' ? r.x0 : r.x1)) < 0.01);
      for (const d of door) free -= d.w; const iv = [];
      for (const it of P.items) if (it.k === r.k && it.room === id && it.back === sd) iv.push(hor ? [it.x0, it.x1] : [it.z0, it.z1]);
      for (const w of P.wallItems) if (w.k === r.k && w.room === id && w.side === sd) iv.push([w.u0, w.u1]);
      iv.sort((x, y) => x[0] - y[0]); let end = -1e9; for (const [s, e] of iv) { const s2 = Math.max(s, lo, end), e2 = Math.min(e, hi); if (e2 > s2) cov += e2 - s2; end = Math.max(end, e2); }
    }
    const e = PD.emptiest(P, r); rows[id] = { wall: +(cov / Math.max(free, 1)).toFixed(2), empty: +(2 * e.r).toFixed(1) };
  }
  return rows;
};

// [fx2] top-up: measured placement refuses what really does not fit, so a room can come out thinner than its rule meant. Any room whose walls are less than 58% covered gets a second fill pass
// from a pool that suits it; corners that are still bare get their kind of thing. Nothing here is a new kind of object: every pool entry is one PD.try already knows.
// pictures hang only where someone owns pictures: the elder's hall, the inn, the merchants (store, draper) and now and then a better house; never in a forge, a stable, a barracks or a cellar
PD.paintOK = P => /^(elder|inn|store|draper)$/.test(P.id) || (/^in\.\d+$/.test(P.id) && (+P.id.slice(3)) % 4 === 0) ? P.wallItems.filter(w => /\.paint$/.test(w.id)).length < 3 : false;
// by trade: what a working room of that kind keeps on its walls and floor (names PD.try knows: its own kinds, KIT_ITEM and KIT_WALL pieces)
PD.TRADE = {
  smithy: ['Peg_Rack', 'Axe_Bronze', 'Pickaxe_Bronze', 'Sword_Bronze', 'stack', 'sacks', 'Bucket_Wooden_1', 'Barrel', 'shelf'], guardhouse: ['Shield_Wooden', 'kite_shield', 'Sword_Bronze', 'Torch_Metal', 'WeaponStand', 'Barrel', 'Crate_Wooden', 'Peg_Rack'],
  farm: ['Shelf_Simple', 'Peg_Rack', 'Bag', 'Barrel', 'sacks', 'stack', 'rusted_spade_01', 'wicker_basket_02'], mill: ['Peg_Rack', 'Bag', 'sacks', 'Barrel', 'Crate_Wooden', 'stack'], hunter: ['Peg_Rack', 'Axe_Bronze', 'kite_shield', 'Bag', 'WeaponStand', 'Barrel', 'stack'],
  fisher: ['Peg_Rack', 'Bucket_Wooden_1', 'wicker_basket_02', 'Barrel', 'sacks', 'stack', 'Bag'], weaver: ['shelf', 'hooks', 'Bag', 'stack', 'sacks', 'Shelf_Simple'], herbalist: ['Shelf_Small_Bottles', 'hooks', 'Shelf_Simple', 'wicker_basket_02', 'sacks'],
  chapel: ['Torch_Metal', 'stack', 'cupboard', 'hooks', 'broom'], store: ['shelf', 'cabinet', 'sacks', 'Barrel', 'Crate_Wooden', 'hooks', 'Shelf_Simple'], draper: ['shelf', 'hooks', 'cupboard', 'sacks', 'Shelf_Simple']
};
PD.POOLS = {
  cellar: ['shelf', 'sacks', 'cask', 'stack', 'cabinet', 'torch', 'shelf', 'bench', 'broom', 'cask'], store: ['shelf', 'sacks', 'cask', 'stack', 'cabinet', 'shelf', 'bench', 'broom', 'torch', 'cask'], bedroom: ['cupboard', 'hooks', 'tapestry', 'bench', 'hooks', 'cabinet', 'cask'],
  hall: ['shelf', 'cabinet', 'hooks', 'bench', 'hooks', 'tapestry', 'sacks', 'stack', 'cupboard'], shop: ['shelf', 'cabinet', 'hooks', 'bench', 'hooks', 'tapestry', 'sacks', 'stack'], keeper: ['cupboard', 'hooks', 'bench', 'hooks', 'shelf', 'cabinet'],
  common: ['shelf', 'cabinet', 'hooks', 'bench', 'hooks', 'cask', 'stack'], kitchen: ['shelf', 'cabinet', 'hooks', 'cask', 'sacks', 'stack'], study: ['books', 'bench', 'hooks', 'hooks', 'cabinet'], sacristy: ['cupboard', 'hooks', 'bench', 'hooks', 'shelf'], gallery: ['bench', 'hooks', 'hooks', 'tapestry'], corridor: ['bench', 'shelf', 'hooks', 'torch', 'cask'], loft: ['cupboard', 'shelf', 'sacks', 'bench', 'hooks', 'stack', 'cask']      // [fx2] passages and upper rooms had no pool at all
};
PD.cover = function (P, r) {
  const a = r.in; let free = 0, cov = 0;
  for (const sd of ['n', 's', 'w', 'e']) {
    const hor = sd === 'n' || sd === 's', lo = hor ? a.x0 : a.z0, hi = hor ? a.x1 : a.z1; free += hi - lo;
    const door = r.doors.filter(d => d.wall && (hor ? d.wall.ax === 'x' : d.wall.ax === 'z') && Math.abs(d.wall.c - (sd === 'n' ? r.z0 : sd === 's' ? r.z1 : sd === 'w' ? r.x0 : r.x1)) < 0.01);
    for (const d of door) free -= d.w; const iv = [];
    for (const it of P.items) if (it.k === r.k && it.room === r.id && it.back === sd) iv.push(hor ? [it.x0, it.x1] : [it.z0, it.z1]);
    for (const w of P.wallItems) if (w.k === r.k && w.room === r.id && w.side === sd) iv.push([w.u0, w.u1]);
    iv.sort((x, y) => x[0] - y[0]); let end = -1e9; for (const [s, e] of iv) { const s2 = Math.max(s, lo, end), e2 = Math.min(e, hi); if (e2 > s2) cov += e2 - s2; end = Math.max(end, e2); }
  }
  return cov / Math.max(free, 1);
};
PD.topup = function (P) {
  P.topped = 0;
  for (const id in P.rooms) {
    const r = P.rooms[id], pools = [];
    if (r.k === 0 && PD.TRADE[P.id] && r.kind !== 'bedroom' && r.kind !== 'cellar') pools.push(PD.TRADE[P.id]); if (PD.POOLS[r.kind]) pools.push(PD.POOLS[r.kind]); if (r.k === 1 && r.kind !== 'gallery') pools.push(PD.POOLS.loft);
    for (const pool of pools) for (let pass = 0; pass < 4 && PD.cover(P, r) < 0.64; pass++) { const n = PD.fill(P, r, pool, { max: 6 }); P.topped += n; if (!n) break; }
    if (pools.length && PD.cover(P, r) < 0.64) P.topped += PD.corners(P, r, r.kind === 'cellar' || r.kind === 'store' ? ['cask', 'sacks', 'stack'] : ['broom', 'sacks', 'stack']);
  }
};
