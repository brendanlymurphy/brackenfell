// ───────────────────────── building specs and furnished interiors ─────────────────────────
const bounds = c => ({ x0: -c.w / 2 + c.t, x1: c.w / 2 - c.t, z0: -c.hd + c.t, z1: c.hd - c.t });
function bedAt(c, name, x, z, rot, w, blanket, fur) {
  at(c.int, x, 0.02, z, rot, () => Props.bed(c.int, w || 1.0, blanket, fur));
  c.spot(name, x, z, -rot, 0.58, { lie: true });
}
function seat(c, name, x, z, h) { c.spot(name, x, z, h, 0.02, { sit: 0.46 }); }
function chestAt(c, x, z, rot, loot, id) { at(c.int, x, 0.02, z, rot, () => Props.chest(c.int)); c.interact(x, 0.5, z, { kind: 'chest', id: c.site.id + '.' + (id || 'chest'), loot, r: 1.8 }); }
function tableSet(c, x, z, rot, len, wid, items, n, seats) {
  const m = c.int;
  at(m, x, 0.02, z, rot, () => { Props.table(m, len, wid); Props.clutter(m, c.R, -len / 2 + 0.25, len / 2 - 0.25, 0.76, 0, items || ['mug', 'plate', 'bowl', 'candle', 'loaf'], n || 3, c);
    if (seats === 'bench') { at(m, 0, 0, -wid / 2 - 0.32, 0, () => Props.bench(m, len * 0.9)); at(m, 0, 0, wid / 2 + 0.32, 0, () => Props.bench(m, len * 0.9)); }
    else if (seats === 'stools') { at(m, -len / 4, 0, -wid / 2 - 0.3, 0, () => Props.stool(m)); at(m, len / 4, 0, wid / 2 + 0.3, 0, () => Props.stool(m)); }
    else if (seats === 'chairs') { at(m, -len / 4, 0, -wid / 2 - 0.32, PI, () => Props.chair(m)); at(m, len / 4, 0, wid / 2 + 0.32, 0, () => Props.chair(m)); } });
}
const ropeCoil = m => { m.mat(MAT.CLOTH, [0.78, 0.62, 0.38], 0.3); m.lathe([[0.10, 0], [0.16, 0.015], [0.165, 0.07], [0.10, 0.085], [0.10, 0]], 10, 0); };
const clothBolt = (m, col) => { m.mat(MAT.CLOTH, col, 0.5); m.push().RZ(PI / 2).T(0.07, -0.3, 0); m.cyl(0, 0, 0, 0.07, 0.07, 0.6, 8, 3); m.pop(); };
const herbs = (m, R) => { m.mat(MAT.PLAIN, R.pick([[0.35, 0.5, 0.25], [0.55, 0.5, 0.25], [0.5, 0.35, 0.5], [0.4, 0.45, 0.2]])); m.lathe([[0.01, -0.34], [0.07, -0.26], [0.035, -0.06], [0.012, 0]], 6, 0); };
const pelt = (m, w, h) => { m.mat(MAT.CLOTH, COL.fur, 0.5); m.quad([-w / 2, h, 0], [-w / 2 * 0.8, 0, 0], [w / 2 * 0.8, 0, 0], [w / 2, h, 0]); };
const antlers = m => { m.mat(MAT.PLAIN, [0.85, 0.78, 0.62]); for (const s of [-1, 1]) { m.tube([[s * 0.03, 0, 0], [s * 0.16, 0.12, 0.05], [s * 0.3, 0.3, 0.06], [s * 0.36, 0.5, 0.02]], [0.022, 0.018, 0.014, 0.006], 5); m.tube([[s * 0.16, 0.12, 0.05], [s * 0.2, 0.26, 0.16]], [0.014, 0.005], 5); m.tube([[s * 0.3, 0.3, 0.06], [s * 0.42, 0.4, 0.14]], [0.012, 0.004], 5); } m.mat(MAT.PLANKS, COL.woodDark, 0.4); m.box(-0.1, -0.1, -0.02, 0.1, 0.08, 0); };

function cottageInterior(c, o) {
  o = o || {}; const m = c.int, R = c.R, B = bounds(c);
  c.fireplace(B.x0, o.fz || 0, 0, { w: 1.7, cauldron: o.cauldron });
  bedAt(c, 'bed', B.x1 - 0.62, B.z1 - 1.08, PI, 1.0, o.blanket, o.fur);
  if (o.bed2) bedAt(c, 'bed2', B.x1 - 1.9, B.z1 - 1.08, PI, 1.0, o.blanket2 || COL.blue);
  chestAt(c, B.x1 - 0.45, B.z1 - 2.5, PI / 2, o.loot || [['gold', 4 + R.i(0, 6)]]);
  tableSet(c, o.tx === undefined ? -0.5 : o.tx, o.tz === undefined ? 0.35 : o.tz, 0, 1.5, 0.8, o.tableItems, 3, o.seats || 'stools');
  at(m, o.tx === undefined ? -0.5 : o.tx, 0.02, o.tz === undefined ? 0.35 : o.tz, 0.2, () => Props.rug(m, 2.2, 1.6, o.rug || COL.red));
  if (!o.noShelf) at(m, o.sx === undefined ? -0.3 : o.sx, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 1.6, 1.8, 3, 0.32, (i, y) => Props.clutter(m, R, -0.65, 0.65, y, 0, o.shelfItems || ['pot', 'jug', 'bowl', 'book', 'bottle', 'cheese'], 4)));
  at(m, B.x0 + 0.5, 0.02, B.z0 + 0.5, 0, () => Props.barrel(m)); at(m, B.x0 + 1.15, 0.02, B.z0 + 0.42, 0.5, () => Props.sack(m, 0.26));
  at(m, B.x0 + 0.45, 1.6, (o.fz || 0) - 0.7, 0, () => Props.candle(m, c)); at(m, B.x0 + 0.45, 1.6, (o.fz || 0) + 0.7, 0, () => Props.pot(m, 0.08));
  c.spot('home', 0.6, -0.9, o.homeYaw || 0);
  seat(c, 'sit', (o.tx === undefined ? -0.5 : o.tx) - 0.375, (o.tz === undefined ? 0.35 : o.tz) - 0.7, PI);
}

const HOUSES = {
  inn: {
    H: 3.6, walls: 'half', stoneH: 1.2, roof: 'shingle', roofCol: [0.72, 0.66, 0.62], pitch: 48, plaster: [1, 0.97, 0.9],
    doors: [{ wall: 'front', pos: 0, w: 1.3, h: 2.15 }],
    windows: [{ wall: 'front', pos: -5.4, w: 1.1 }, { wall: 'front', pos: -2.9, w: 1.1 }, { wall: 'front', pos: 2.9, w: 1.1 }, { wall: 'front', pos: 5.4, w: 1.1 }, { wall: 'back', pos: -4.8, w: 1.1 },
      { wall: 'right', pos: -1.7, sill: 2.95, h: 0.55, w: 0.8, shutters: false }, { wall: 'right', pos: 1.7, sill: 2.95, h: 0.55, w: 0.8, shutters: false }, { wall: 'right', pos: -2.6, w: 0.9 }],
    shutter: [0.5, 0.2, 0.16], noTie: x => x > 2.0,
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c), LY = 2.6, LX = 2.4;
      c.fireplace(B.x0, 0, 0, { w: 2.7, size: 0.8, r: 14, c: [4.6, 2.3, 0.8] });
      at(m, B.x0 + 0.68, 2.3, 0, PI / 2, () => { Props.shield(m, COL.red); at(m, 0, -0.45, 0.02, 0, () => { m.push().RZ(0.6); Props.sword(m); m.pop(); m.push().RZ(-0.6); Props.sword(m); m.pop(); }); });
      at(m, -5.0, 0.02, -1.3, PI / 2, () => Props.chair(m)); at(m, -5.0, 0.02, 1.3, PI / 2, () => Props.chair(m));
      seat(c, 'fire1', -5.0, -1.3, -PI / 2); seat(c, 'fire2', -5.0, 1.3, -PI / 2);
      at(m, -4.4, 0.02, 0, 0, () => Props.rug(m, 2.0, 3.0, [0.55, 0.18, 0.14]));
      const items = ['mug', 'mug', 'plate', 'bowl', 'candle', 'loaf', 'jug', 'cheese'];
      tableSet(c, -1.9, -2.3, 0, 3.0, 0.85, items, 6, 'bench'); tableSet(c, -1.9, 1.5, 0, 3.0, 0.85, items, 6, 'bench'); tableSet(c, 1.1, -2.9, 0, 1.8, 0.8, items, 3, 'bench');
      seat(c, 's1', -2.8, -3.05, PI); seat(c, 's2', -1.2, -1.55, 0); seat(c, 's3', -2.6, 0.75, PI); seat(c, 's4', -1.0, 2.25, 0); seat(c, 's5', -0.4, -3.05, PI); seat(c, 's6', 1.1, -2.15, 0);
      c.spot('bard', -4.2, 2.9, PI / 2); c.spot('stand1', 0.8, 0.2, -PI / 2); c.spot('stand2', -0.2, -0.3, PI * 0.8);
      // stairs along the back wall up to the loft
      const sx0 = -2.2, sz0 = 3.05, sz1 = 4.05, n = 13;
      m.mat(MAT.TIMBER, COL.timber);
      for (const z of [sz0 + 0.04, sz1 - 0.04]) m.beam([sx0, 0.02, z], [LX, LY - 0.05, z], 0.07, 0.24);
      m.mat(MAT.PLANKS, COL.wood);
      for (let i = 0; i < n; i++) { const x = lerp(sx0, LX, (i + 0.5) / n), y = LY * (i + 1) / n; m.box(x - 0.2, y - 0.045, sz0, x + 0.2, y, sz1); }
      addFloor(m, sx0, sz0, LX, sz1, 0.02, LY + 0.02, 'x');
      m.mat(MAT.TIMBER, COL.timber); m.beam([sx0, 0.95, sz0 + 0.03], [LX, LY + 0.95, sz0 + 0.03], 0.06, 0.07);
      for (let i = 0; i <= 4; i++) { const k = i / 4, x = lerp(sx0, LX, k), y = LY * k; m.box(x - 0.035, y, sz0, x + 0.035, y + 0.95, sz0 + 0.07); }
      // loft floor with joists, railing
      m.mat(MAT.PLANKS, COL.wood); m.box(LX, LY - 0.07, B.z0, B.x1, LY + 0.02, B.z1);
      m.mat(MAT.TIMBER, COL.timber); m.box(LX - 0.1, LY - 0.26, B.z0, LX + 0.1, LY - 0.07, B.z1);
      for (let x = LX + 1.1; x < B.x1; x += 1.15) m.box(x - 0.07, LY - 0.24, B.z0, x + 0.07, LY - 0.07, B.z1, 8);
      for (const z of [-2.2, 2.4]) m.cbox(LX, 0.02, z, 0.18, LY - 0.28, 0.18, 12);
      addFloor(m, LX, B.z0, B.x1, B.z1, LY + 0.03);
      m.box(LX - 0.03, LY + 0.92, B.z0 + 0.5, LX + 0.03, LY + 1.0, sz0 - 0.08); m.box(LX - 0.025, LY + 0.45, B.z0 + 0.5, LX + 0.025, LY + 0.51, sz0 - 0.08);
      for (let z = B.z0 + 0.5; z <= sz0 - 0.05; z += 1.03) m.cbox(LX, LY, z, 0.07, 1.0, 0.07, 4);
      addBoxCollider(m, LX - 0.08, B.z0, LX + 0.08, sz0 - 0.05, LY, LY + 1.1);
      addBoxCollider(m, LX, B.z0, B.x1, -3.95, LY, LY + 2.2); addBoxCollider(m, LX, 4.02, B.x1, B.z1, LY, LY + 2.2);
      // guest loft
      m.push().T(0, LY, 0);
      at(m, 6.15, 0.02, -2.0, -PI / 2, () => Props.bed(m, 1.0, COL.green)); at(m, 6.15, 0.02, 1.4, -PI / 2, () => Props.bed(m, 1.0, COL.blue));
      at(m, 6.75, 0.02, -0.3, PI / 2, () => Props.chest(m)); at(m, 4.2, 0.02, -3.2, 0, () => { Props.table(m, 1.0, 0.6); at(m, 0, 0.76, 0, 0, () => Props.candle(m, c, true)); at(m, 0.3, 0.76, 0.05, 0.4, () => Props.book(m, COL.blue)); });
      at(m, 4.6, 0.02, -0.3, 0, () => Props.rug(m, 1.8, 2.6, COL.blue)); at(m, 4.2, 0.02, -2.55, 0, () => Props.stool(m));
      m.pop();
      c.spot('guestbed', 6.15, -2.0, PI / 2, LY + 0.58, { lie: true }); c.spot('bed2', 6.15, 1.4, PI / 2, LY + 0.58, { lie: true });
      c.spot('stairs0', sx0 - 0.5, 3.55, PI / 2); c.spot('stairs1', LX + 0.5, 3.55, PI / 2, LY + 0.03);
      c.interact(6.15, LY + 0.6, -2.0, { kind: 'bed', id: 'inn.bed', r: 1.9 });
      c.interact(6.75, LY + 0.5, -0.3, { kind: 'chest', id: 'inn.chest', loot: [['gold', 6], ['apple', 1]], r: 1.7 });
      c.interact(4.5, LY + 0.9, -3.2, { kind: 'read', id: 'inn.note', title: 'A note on the table', text: 'Traveller — the bed by the window is yours for as long as you stay. Breakfast when the cock crows, ale when the sun sets. — G.', r: 1.5 });
      // bar under the loft
      m.mat(MAT.PLANKS, COL.woodDark); m.box(3.1, 0.02, 0.9, 6.5, 1.02, 1.45); m.mat(MAT.PLANKS, COL.wood); m.box(3.0, 1.02, 0.8, 6.6, 1.09, 1.55);
      addBoxCollider(m, 3.0, 0.8, 6.6, 1.55, 0, 1.1);
      at(m, 4.8, 1.09, 1.18, 0, () => Props.clutter(m, R, -1.5, 1.5, 0, 0, ['mug', 'mug', 'jug', 'bottle', 'candle', 'mug', 'plate'], 7, c));
      for (const x of [3.7, 4.9, 6.1]) { m.mat(MAT.PLANKS, COL.woodDark); m.box(x - 0.5, 0.02, 3.55, x + 0.5, 0.6, 4.4); at(m, x, 0.6, 3.98, PI / 2, () => Props.keg(m, 0.36, 0.85)); }
      addBoxCollider(m, 3.2, 3.5, 6.6, 4.45, 0, 1.5);
      at(m, B.x1 - 0.17, 0.02, 2.5, PI / 2, () => Props.shelf(m, 1.7, 1.9, 3, 0.3, (i, y) => Props.clutter(m, R, -0.7, 0.7, y, 0, ['bottle', 'mug', 'jug', 'bottle', 'pot'], 5)));
      c.spot('bar', 4.8, 2.5, 0); c.spot('barfront', 4.6, 0.25, PI);
      for (const [x, z] of [[6.55, -3.9], [5.75, -4.0], [6.6, -3.1]]) at(m, x, 0.02, z, 0, () => Props.barrel(m));
      at(m, -0.6, 0.02, 3.6, 0.3, () => Props.crate(m, 0.6)); at(m, -1.5, 0.02, 3.8, 0, () => Props.barrel(m, 0.3, 0.8));
      at(m, 0, 0.02, -3.4, 0, () => Props.rug(m, 1.6, 1.4, [0.35, 0.3, 0.2]));
      // wheel chandelier over the hall
      at(m, -2.0, 4.3, -0.3, 0, () => {
        m.mat(MAT.METAL, COL.black); m.box(-0.012, 0, -0.012, 0.012, c.ridgeY - 4.5, 0.012);
        m.mat(MAT.TIMBER, COL.woodDark); m.lathe([[0.72, -0.05], [0.8, -0.05], [0.8, 0.05], [0.72, 0.05], [0.72, -0.05]], 14, 0);
        for (let i = 0; i < 4; i++) m.beam([0, 0, 0], [Math.cos(i * PI / 2) * 0.74, 0, Math.sin(i * PI / 2) * 0.74], 0.05, 0.05);
        for (let i = 0; i < 6; i++) at(m, Math.cos(i * TAU / 6) * 0.76, 0.05, Math.sin(i * TAU / 6) * 0.76, 0, () => Props.candle(m, { zone: c.zone, candleLight: false }));
        addLight(wp(m, 0, -0.3, 0), 9, [3.0, 1.9, 0.85], c.zone, 'candle');
      });
      at(m, B.x0 + 0.8, 1.6, 0.9, 0, () => Props.candle(m, c, true)); at(m, B.x0 + 0.8, 1.6, -0.9, 0, () => Props.jug(m));
    },
  },
  smithy: {
    H: 2.7, walls: 'half', stoneH: 1.45, roof: 'shingle', roofCol: [0.62, 0.58, 0.56], plaster: [0.96, 0.92, 0.86],
    doors: [{ wall: 'front', pos: 3.0 }],
    windows: [{ wall: 'front', pos: 0.85, w: 0.8, shutters: false }, { wall: 'back', pos: -2.6 }, { wall: 'back', pos: 2.4 }, { wall: 'right', pos: 0.2 }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c), e = c.ext, hd = c.hd;
      c.fireplace(B.x0, 0.4, 0, { w: 1.7 });
      bedAt(c, 'bed', -1.7, B.z1 - 0.62, PI / 2, 1.0, [0.45, 0.3, 0.2], true);
      tableSet(c, 0.4, -0.9, 0, 1.3, 0.75, ['mug', 'plate', 'loaf', 'candle'], 3, 'stools');
      at(m, 2.5, 0.02, B.z1 - 0.42, 0, () => { Props.table(m, 2.2, 0.75, 0.86); for (let i = 0; i < 3; i++) at(m, -0.7 + i * 0.5, 0.86, R.s() * 0.1, 0, () => { m.push().RZ(PI / 2).RX(R() * 3); Props.hammer(m); m.pop(); }); m.mat(MAT.METAL, COL.iron); m.box(0.6, 0.86, -0.15, 0.95, 0.92, 0.15); m.box(0.7, 0.92, -0.1, 0.85, 1.02, 0.1); });
      at(m, B.x1 - 0.06, 1.05, -1.0, 0, () => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.03, 0, -1.1, 0.02, 1.1, 1.1); for (let i = 0; i < 4; i++) at(m, -0.06, 0.05, -0.75 + i * 0.5, PI / 2, () => Props.sword(m)); });
      at(m, 1.2, 1.5, B.z0 + 0.04, 0, () => Props.shield(m, COL.blue)); at(m, 2.0, 1.5, B.z0 + 0.04, 0, () => Props.shield(m, [0.6, 0.5, 0.2]));
      chestAt(c, 0.5, B.z1 - 0.4, 0, [['gold', 8]]);
      at(m, B.x1 - 0.5, 0.02, 2.4, 0, () => { Props.barrel(m, 0.3, 0.8); for (let i = 0; i < 3; i++) at(m, R.s() * 0.12, 0.3, R.s() * 0.12, R() * 3, () => { m.push().RZ(R.s() * 0.2); Props.sword(m); m.pop(); }); });
      c.spot('home', 0.9, 0.5, 0); seat(c, 'sit', 0.075, -1.6, PI);
      // ── lean-to forge porch on the front ──
      const z0 = -hd - 3.5, px0 = -4.9, px1 = 1.7, fy = -0.14;
      e.m1 = 0; e.ao = 1;
      e.mat(MAT.COBBLE, [1, 1, 1], 1.3); e.box(px0, -0.9, z0, px1, fy, -hd);
      addFloor(e, px0, z0, px1, -hd, fy);
      e.mat(MAT.TIMBER, COL.timberDark);
      for (const x of [px0 + 0.15, -1.6, px1 - 0.15]) { e.cbox(x, fy, z0 + 0.2, 0.18, 2.3, 0.18, 12); addBoxCollider(e, x - 0.1, z0 + 0.1, x + 0.1, z0 + 0.3, fy, 2.4); e.beam([x, 1.75, z0 + 0.2], [x + (x > 0 ? -0.5 : 0.5), 2.12, z0 + 0.2], 0.08, 0.08); }
      e.box(px0, 2.12, z0 + 0.1, px1, 2.3, z0 + 0.3);
      for (let x = px0 + 0.2; x <= px1; x += 1.05) e.beam([x, 2.72, -hd], [x, 2.24, z0 - 0.25], 0.08, 0.12);
      e.mat(MAT.SHINGLE, [0.62, 0.58, 0.56]);
      e.quad([px1 + 0.2, 2.86, -hd], [px1 + 0.2, 2.34, z0 - 0.35], [px0 - 0.2, 2.34, z0 - 0.35], [px0 - 0.2, 2.86, -hd], 0, 0, (px1 - px0 + 0.4) / 2, 3.9 / 2);
      e.mat(MAT.PLANKS, COL.woodDark); e.ao = 0.5; e.quad([px0 - 0.2, 2.83, -hd], [px0 - 0.2, 2.31, z0 - 0.35], [px1 + 0.2, 2.31, z0 - 0.35], [px1 + 0.2, 2.83, -hd]); e.ao = 1;
      // forge hearth + hood
      e.mat(MAT.STONE, [0.9, 0.88, 0.85], 0.8); e.box(-4.6, fy, -hd - 1.45, -2.9, 0.85, -hd - 0.05);
      e.box(-4.6, 0.85, -hd - 0.35, -2.9, 2.1, -hd - 0.05); e.box(-4.6, 1.7, -hd - 1.3, -2.9, 2.1, -hd - 0.35); e.cbox(-3.75, 2.1, -hd - 0.5, 0.8, 2.3, 0.75);
      e.cbox(-3.75, 4.4, -hd - 0.5, 0.95, 0.13, 0.9);
      emit(e, 1.8, () => { e.mat(MAT.PLAIN, [1, 0.38, 0.08]); e.box(-4.4, 0.85, -hd - 1.3, -3.1, 0.9, -hd - 0.4, 4); });
      const fp = wp(e, -3.75, 1.02, -hd - 0.85);
      World.emitters.push({ type: 'fire', p: fp, size: 0.42, zone: 0 }); World.emitters.push({ type: 'smoke', p: wp(e, -3.75, 4.6, -hd - 0.5), zone: 0 });
      addLight(wp(e, -3.6, 1.5, -hd - 1.9), 8.5, [3.6, 1.7, 0.55], 0, 'fire');
      addBoxCollider(e, -4.6, -hd - 1.45, -2.9, -hd, fy, 2.2);
      at(e, -2.45, fy, -hd - 0.75, 0, () => { e.mat(MAT.PLANKS, COL.wood, 0.5); e.poly([[0, 0.55, -0.3], [0, 0.55, 0.3], [0.9, 0.75, 0.05], [0.9, 0.75, -0.05]]); e.box(0, 0.5, -0.3, 0.05, 1.0, 0.3); e.mat(MAT.PLAIN, COL.leather); e.poly([[0, 1.0, 0.3], [0, 1.0, -0.3], [0.9, 0.8, -0.05], [0.9, 0.8, 0.05]]); e.poly([[0, 0.55, 0.3], [0, 1.0, 0.3], [0.9, 0.8, 0.05], [0.9, 0.75, 0.05]]); e.poly([[0, 1.0, -0.3], [0, 0.55, -0.3], [0.9, 0.75, -0.05], [0.9, 0.8, -0.05]]); e.mat(MAT.TIMBER, COL.timber); e.cbox(0.2, 0, 0, 0.5, 0.5, 0.5); });
      at(e, -1.75, fy, -hd - 2.0, 0.3, () => Props.anvil(e));
      c.spot('anvil', -1.75, -hd - 2.75, PI, fy); c.spot('forge', -3.6, -hd - 2.1, PI, fy);
      at(e, -0.1, fy, -hd - 0.55, 0, () => { e.mat(MAT.PLANKS, COL.woodDark, 0.6); e.box(-0.7, 0, -0.3, 0.7, 0.55, 0.3); e.mat(MAT.PLAIN, [0.06, 0.1, 0.12]); e.quad([-0.63, 0.5, -0.24], [-0.63, 0.5, 0.24], [0.63, 0.5, 0.24], [0.63, 0.5, -0.24]); addBoxCollider(e, -0.7, -0.3, 0.7, 0.3, 0, 0.6); });
      at(e, 0.9, fy, -hd - 2.5, 0, () => { e.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) { e.beam([s * 0.3, 0, -0.25], [s * 0.3, 0.7, 0], 0.06, 0.06); e.beam([s * 0.3, 0, 0.25], [s * 0.3, 0.7, 0], 0.06, 0.06); } e.mat(MAT.ROCK, [0.9, 0.9, 0.9], 0.3); e.push().T(0, 0.7, 0).RZ(PI / 2).T(0, -0.07, 0); e.cyl(0, 0, 0, 0.36, 0.36, 0.14, 14, 3); e.pop(); addCircleCollider(e, 0, 0, 0.4, 0, 1); });
      at(e, -0.9, 1.75, -hd - 0.03, 0, () => { e.mat(MAT.PLANKS, COL.woodDark); e.box(-0.8, 0, -0.03, 0.8, 0.12, 0); for (let i = 0; i < 4; i++) at(e, -0.6 + i * 0.4, -0.3, -0.05, 0, () => Props.hammer(e)); });
      at(e, 1.2, fy, -hd - 0.5, 0, () => Props.crate(e, 0.7)); at(e, 1.2, fy + crateTop(0.7), -hd - 0.5, 0, () => { e.mat(MAT.METAL, COL.iron); for (let i = 0; i < 4; i++) e.box(-0.25 + (i % 2) * 0.06, i * 0.05, -0.2, 0.25 + (i % 2) * 0.06, i * 0.05 + 0.045, -0.08 + (i % 2) * 0.2); });
      at(e, -4.4, fy, -hd - 2.6, 0, () => Props.barrel(e)); at(e, -4.3, fy, -hd - 3.25, 0, () => Props.sack(e, 0.3, [0.2, 0.2, 0.2]));
      // hanging sign
      at(e, 3.9, 2.55, -hd, 0, () => { e.mat(MAT.METAL, COL.black); e.beam([0, 0, 0], [0, 0, -0.95], 0.035, 0.035); e.mat(MAT.PLANKS, COL.woodDark, 0.5); e.box(-0.02, -0.62, -0.9, 0.02, -0.08, -0.2); e.mat(MAT.METAL, COL.steel); for (const s of [-1, 1]) { e.box(s * 0.021 - 0.004, -0.36, -0.72, s * 0.021 + 0.004, -0.28, -0.36); e.box(s * 0.021 - 0.004, -0.50, -0.62, s * 0.021 + 0.004, -0.36, -0.48); e.box(s * 0.021 - 0.004, -0.55, -0.70, s * 0.021 + 0.004, -0.50, -0.40); } });
    },
  },
  store: {
    H: 2.6, walls: 'timber', roof: 'shingle', roofCol: [0.82, 0.62, 0.5], ceiling: true, plaster: [1, 0.95, 0.82], shutter: [0.25, 0.38, 0.55],
    doors: [{ wall: 'front', pos: -1.9 }],
    windows: [{ wall: 'front', pos: 1.3, w: 1.5, shutters: false }, { wall: 'left', pos: 0.3 }, { wall: 'right', pos: -0.6 }, { wall: 'back', pos: -2.9, w: 0.7 }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c);
      m.mat(MAT.PLANKS, COL.woodDark); m.box(-1.2, 0.02, 0.3, 3.4, 0.98, 0.85); m.mat(MAT.PLANKS, COL.wood); m.box(-1.3, 0.98, 0.2, 3.5, 1.05, 0.95);
      addBoxCollider(m, -1.3, 0.2, 3.5, 0.95, 0, 1.1);
      at(m, 1.1, 1.05, 0.58, 0, () => { Props.clutter(m, R, -2.0, 2.0, 0, 0, ['candle', 'cheese', 'book', 'bottle', 'pot', 'loaf', 'jug'], 7, c); });
      at(m, -0.6, 1.05, 0.55, 0.4, () => ropeCoil(m)); at(m, -0.6, 1.14, 0.55, 1.1, () => ropeCoil(m));
      c.interact(-0.6, 1.2, 0.55, { kind: 'shopitem', id: 'rope', r: 1.6 });
      at(m, 2.9, 1.05, 0.55, 0, () => { m.mat(MAT.METAL, COL.bronze); m.box(-0.012, 0, -0.012, 0.012, 0.32, 0.012); m.box(-0.22, 0.30, -0.01, 0.22, 0.32, 0.01); for (const s of [-1, 1]) { m.box(s * 0.2 - 0.004, 0.14, -0.004, s * 0.2 + 0.004, 0.3, 0.004); m.lathe([[0.02, 0.10], [0.09, 0.14]], 8, 1); m.push().T(s * 0.2, 0, 0); m.lathe([[0.02, 0.10], [0.09, 0.14]], 8, 1); m.pop(); } });
      const goods = ['pot', 'bottle', 'jug', 'book', 'cheese', 'bowl', 'pot', 'bottle'];
      at(m, -0.7, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 2.4, 2.1, 4, 0.32, (i, y) => Props.clutter(m, R, -1.05, 1.05, y, 0, goods, 6)));
      at(m, 2.25, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 2.6, 2.1, 4, 0.32, (i, y) => { if (i < 2) for (let k = 0; k < 4; k++) at(m, -0.9 + k * 0.6, y, 0, PI / 2, () => clothBolt(m, R.pick([COL.red, COL.blue, COL.green, COL.linen, COL.gold, COL.purple]))); else Props.clutter(m, R, -1.1, 1.1, y, 0, goods, 6); }));
      at(m, B.x1 - 0.17, 0.02, -1.6, PI / 2, () => Props.shelf(m, 2.0, 2.0, 4, 0.32, (i, y) => Props.clutter(m, R, -0.85, 0.85, y, 0, ['loaf', 'cheese', 'apple', 'cabbage', 'pot', 'jug'], 5)));
      for (const [x, z] of [[3.3, -2.5], [2.5, -2.55]]) at(m, x, 0.02, z, 0, () => { Props.barrel(m); for (let i = 0; i < 7; i++) at(m, R.s() * 0.18, 0.86, R.s() * 0.18, 0, () => Props.apple(m, x > 3 ? COL.apple : [0.62, 0.7, 0.22])); });
      at(m, 0.5, 0.02, -2.5, 0.2, () => Props.crate(m, 0.65)); at(m, 0.45, 0.02 + crateTop(0.65), -2.5, 0.6, () => { for (let i = 0; i < 4; i++) at(m, (i % 2) * 0.24 - 0.12, 0, (i >> 1) * 0.24 - 0.12, 0, () => Props.cabbage(m)); });
      at(m, -3.3, 0.02, -0.6, 0, () => Props.sack(m, 0.33)); at(m, -3.35, 0.02, 0.1, 0.7, () => Props.sack(m, 0.3, [0.85, 0.82, 0.74])); at(m, -3.2, 0.02, -1.3, 0, () => Props.crate(m, 0.55));
      at(m, B.x0 + 0.03, 1.5, -1.9, PI / 2, () => { m.push().RZ(PI / 2); ropeCoil(m); m.pop(); });
      bedAt(c, 'bed', -3.1, 2.0, PI, 1.0, COL.purple);
      at(m, 0.2, c.H, -1.4, 0, () => Props.lantern(m, c));
      at(m, 0, 0.02, -1.6, 0, () => Props.rug(m, 2.4, 1.6, COL.green));
      c.spot('counter', 1.2, 1.7, 0); c.spot('front', 1.0, -0.6, PI);
    },
  },
  elder: {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [1, 1, 0.94], shutter: [0.42, 0.52, 0.36],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.7 }, { wall: 'back', pos: -1.3 }, { wall: 'right', pos: -0.9 }],
    interior(c) {
      cottageInterior(c, { blanket: [0.5, 0.42, 0.3], shelfItems: ['book', 'book', 'book', 'pot', 'candle', 'book'], rug: COL.blue, seats: 'chairs', tableItems: ['book', 'candle', 'mug', 'book'] });
      const m = c.int, B = bounds(c);
      at(m, 1.4, 0.02, B.z1 - 0.17, 0, () => Props.shelf(m, 1.2, 1.9, 4, 0.3, (i, y) => { for (let k = 0; k < 6; k++) at(m, -0.42 + k * 0.17, y + 0.12, 0, 0, () => { m.push().RZ(PI / 2).RY(PI / 2); Props.book(m, c.R.pick([COL.red, COL.blue, COL.green, COL.leather, COL.purple]), 0.035 + c.R() * 0.02); m.pop(); }); }));
      c.interact(-0.5, 0.9, 0.35, { kind: 'read', id: 'elder.book', title: 'Rowan’s chronicle', text: 'Year of the long frost. The beacon on the crag has stood dark since my grandfather’s day, yet the valley endures. We kept the Dawn bell ringing through every winter but this one.', r: 1.6 });
    },
  },
  herbalist: {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [0.98, 0.95, 0.85], shutter: [0.5, 0.36, 0.5], roofCol: [0.95, 0.98, 0.9],
    doors: [{ wall: 'front', pos: -0.9 }], windows: [{ wall: 'front', pos: 1.5 }, { wall: 'back', pos: 1.2 }, { wall: 'right', pos: 0.6 }],
    interior(c) {
      cottageInterior(c, { cauldron: true, blanket: COL.purple, shelfItems: ['bottle', 'pot', 'bottle', 'jug', 'bowl', 'bottle'], rug: COL.green, tableItems: ['bowl', 'bottle', 'candle', 'pot'], sx: -0.9 });
      const m = c.int, B = bounds(c);
      for (let x = B.x0 + 1.2; x < B.x1 - 0.4; x += 0.42) at(m, x, c.H - 0.2, c.R.s() * 0.3 + (Math.round(x * 3) % 2 ? 1.1 : -1.3), 0, () => herbs(m, c.R));
      at(m, 1.3, 0.02, B.z0 + 0.4, PI, () => { Props.table(m, 1.4, 0.6, 0.85); Props.clutter(m, c.R, -0.5, 0.5, 0.85, 0, ['bowl', 'bottle', 'pot', 'bottle'], 4); });
    },
  },
  guardhouse: {
    H: 2.5, walls: 'half', stoneH: 1.0, roof: 'shingle', roofCol: [0.7, 0.66, 0.62],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.7 }, { wall: 'back', pos: -1.2 }, { wall: 'right', pos: -0.8 }],
    interior(c) {
      cottageInterior(c, { bed2: true, blanket: [0.45, 0.2, 0.18], blanket2: [0.45, 0.2, 0.18], tableItems: ['mug', 'plate', 'candle', 'loaf'], noShelf: true });
      const m = c.int, B = bounds(c);
      at(m, -0.4, 0.02, B.z1 - 0.1, 0, () => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.8, 0.3, -0.04, 0.8, 0.42, 0.04); m.box(-0.8, 1.5, -0.04, 0.8, 1.6, 0.04); for (let i = 0; i < 4; i++) at(m, -0.55 + i * 0.37, 0.36, -0.08, 0, () => Props.sword(m)); });
      at(m, 1.3, 1.6, B.z0 + 0.04, 0, () => Props.shield(m, [0.55, 0.15, 0.12])); at(m, 2.2, 1.6, B.z0 + 0.04, 0, () => Props.shield(m, [0.55, 0.15, 0.12]));
    },
  },
  weaver: {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [1, 0.92, 0.86], shutter: [0.3, 0.42, 0.55],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.8 }, { wall: 'back', pos: -1.3 }, { wall: 'back', pos: 1.4 }, { wall: 'right', pos: -0.8 }],
    interior(c) {
      cottageInterior(c, { blanket: COL.blue, bed2: true, blanket2: [0.7, 0.4, 0.4], tx: -1.3, tz: 1.2, noShelf: true });
      const m = c.int, B = bounds(c);
      at(m, 1.2, 0.02, -1.6, 0.25, () => {       // loom
        m.mat(MAT.TIMBER, COL.wood); for (const s of [-1, 1]) { m.cbox(s * 0.7, 0, -0.4, 0.08, 1.7, 0.08, 4); m.cbox(s * 0.7, 0, 0.4, 0.08, 1.0, 0.08, 4); m.beam([s * 0.7, 0.95, 0.4], [s * 0.7, 0.95, -0.4], 0.06, 0.06); }
        m.beam([-0.7, 1.65, -0.4], [0.7, 1.65, -0.4], 0.07, 0.07); m.beam([-0.7, 0.4, -0.4], [0.7, 0.4, -0.4], 0.07, 0.07); m.beam([-0.7, 0.95, 0.4], [0.7, 0.95, 0.4], 0.07, 0.07);
        m.mat(MAT.STRIPES, COL.red, 0.5); m.quad2([-0.6, 1.62, -0.38], [-0.6, 0.97, 0.38], [0.6, 0.97, 0.38], [0.6, 1.62, -0.38]);
        addBoxCollider(m, -0.75, -0.45, 0.75, 0.45, 0, 1.7);
      });
      at(m, 2.7, 0.02, -2.0, 0, () => Props.sack(m, 0.3, [0.92, 0.9, 0.85])); at(m, 2.1, 0.02, -2.3, 0, () => Props.sack(m, 0.26, [0.92, 0.9, 0.85]));
      at(m, 0.6, 0.02, B.z1 - 0.2, 0, () => { Props.table(m, 1.3, 0.4, 0.8); for (let k = 0; k < 3; k++) at(m, -0.4 + k * 0.4, 0.8, 0, PI / 2, () => clothBolt(m, [COL.red, COL.gold, COL.green][k])); });
    },
  },
  farm: {
    H: 2.5, walls: 'timber', roof: 'thatch', plaster: [1, 0.96, 0.84], shutter: [0.5, 0.25, 0.2],
    doors: [{ wall: 'front', pos: 1.0 }], windows: [{ wall: 'front', pos: -1.9 }, { wall: 'back', pos: -1.5 }, { wall: 'back', pos: 1.7 }, { wall: 'right', pos: -1.0 }],
    interior(c) {
      cottageInterior(c, { cauldron: true, bed2: true, blanket: COL.gold, blanket2: COL.green, tableItems: ['loaf', 'cheese', 'bowl', 'mug', 'apple'], seats: 'bench', tx: -0.9, tz: 0.3 });
      const m = c.int, B = bounds(c);
      for (let i = 0; i < 5; i++) at(m, B.x0 + 1.6 + i * 0.5, c.H - 0.2, -1.4, 0, () => herbs(m, c.R));
      at(m, B.x0 + 0.5, 0.02, B.z1 - 0.5, 0, () => Props.sack(m, 0.34)); at(m, B.x0 + 1.2, 0.02, B.z1 - 0.45, 0, () => Props.crate(m, 0.55));
    },
  },
  hunter: {
    H: 2.3, walls: 'log', roof: 'thatch', roofCol: [0.85, 0.85, 0.8],
    doors: [{ wall: 'front', pos: 0.8 }], windows: [{ wall: 'front', pos: -1.4, w: 0.7, h: 0.8 }, { wall: 'back', pos: 0.3, w: 0.7, h: 0.8 }],
    interior(c) {
      cottageInterior(c, { fur: true, blanket: [0.4, 0.3, 0.2], noShelf: true, tableItems: ['mug', 'bowl', 'candle'], rug: [0.5, 0.4, 0.3] });
      const m = c.int, B = bounds(c);
      at(m, -0.6, 1.3, B.z1 - 0.02, PI, () => pelt(m, 1.1, 0.9)); at(m, 1.0, 1.25, B.z1 - 0.02, PI, () => pelt(m, 0.8, 0.7));
      at(m, B.x0 + 0.68, 1.85, 0, PI / 2, () => antlers(m));
      at(m, -1.8, 0.02, B.z0 + 0.1, 0, () => { m.mat(MAT.TIMBER, COL.wood); m.tube([[0, 0.3, 0], [0.1, 0.95, 0.03], [0, 1.6, 0]], 0.014, 5); m.mat(MAT.CLOTH, COL.linen, 0.3); m.box(-0.004, 0.3, -0.004, 0.004, 1.6, 0.004); });
    },
  },
  fisher: {
    H: 2.2, walls: 'timber', roof: 'thatch', plaster: [0.94, 0.94, 0.9], shutter: [0.3, 0.45, 0.5], roofCol: [0.9, 0.9, 0.85],
    doors: [{ wall: 'front', pos: 0.6 }], windows: [{ wall: 'front', pos: -1.2, w: 0.7 }, { wall: 'right', pos: 0, w: 0.7 }],
    interior(c) {
      const m = c.int, B = bounds(c);
      c.fireplace(B.x0, 0, 0, { w: 1.5 });
      bedAt(c, 'bed', B.x1 - 0.6, B.z1 - 1.05, PI, 0.95, [0.3, 0.42, 0.5]);
      tableSet(c, -0.3, 0.9, 0, 1.0, 0.65, ['bowl', 'mug', 'candle'], 2, 'stools');
      at(m, B.x0 + 0.45, 0.02, B.z0 + 0.45, 0, () => Props.barrel(m)); at(m, 1.2, 0.02, B.z0 + 0.4, 0, () => Props.crate(m, 0.5));
      chestAt(c, 0.6, B.z1 - 0.32, 0, [['gold', 5]]);
      c.spot('home', 0.3, -0.6, 0);
    },
  },
  chapel: {
    H: 4.4, walls: 'stone', roof: 'shingle', roofCol: [0.55, 0.62, 0.74], pitch: 54, floor: 'stone', overhang: 0.4,
    doors: [{ wall: 'left', pos: 0, w: 1.5, h: 2.5, lamp: false }],
    windows: [-3.8, -1.0, 1.8, 4.6].flatMap((x, i) => [{ wall: 'front', pos: x, w: 0.7, h: 2.3, sill: 1.3, glass: [[0.35, 0.55, 1.0], [1.0, 0.42, 0.3], [0.95, 0.8, 0.3], [0.4, 0.85, 0.5]][i] }, { wall: 'back', pos: x, w: 0.7, h: 2.3, sill: 1.3, glass: [[1.0, 0.42, 0.3], [0.35, 0.55, 1.0], [0.4, 0.85, 0.5], [0.95, 0.8, 0.3]][i] }]).concat([{ wall: 'right', pos: 0, w: 1.1, h: 1.5, sill: 2.5, glass: [1.0, 0.82, 0.35] }]),
    interior(c) {
      const m = c.int, B = bounds(c), e = c.ext;
      // pews
      for (const x of [-4.4, -2.9, -1.4, 0.1, 1.6]) for (const s of [-1, 1]) at(m, x, 0.02, s * 2.0, PI / 2, () => { Props.bench(m, 2.5); m.mat(MAT.PLANKS, COL.woodDark); m.box(-1.25, 0.46, 0.13, 1.25, 0.95, 0.17); });
      seat(c, 'pew1', -1.4, -1.6, PI / 2); seat(c, 'pew2', 0.1, 1.7, PI / 2);
      at(m, 0, 0.022, 0, PI / 2, () => Props.rug(m, 1.1, 9.5, [0.55, 0.14, 0.12]));
      // dais, altar, sun emblem
      m.mat(MAT.COBBLE, [1, 1, 1], 1.4); m.box(4.3, 0.02, B.z0, B.x1, 0.2, B.z1); addFloor(m, 4.3, B.z0, B.x1, B.z1, 0.21); addFloor(m, 4.0, B.z0, 4.3, B.z1, 0.11);
      m.mat(MAT.STONE, [1, 1, 1], 0.7); m.box(5.3, 0.2, -1.0, 6.1, 1.15, 1.0); addBoxCollider(m, 5.3, -1.0, 6.1, 1.0, 0.2, 1.3);
      m.mat(MAT.CLOTH, COL.linen); m.box(5.26, 1.15, -1.1, 6.14, 1.18, 1.1); m.mat(MAT.CLOTH, COL.gold); m.box(5.25, 0.75, -0.35, 5.3, 1.18, 0.35);
      for (const s of [-1, 1]) at(m, 5.7, 1.18, s * 0.75, 0, () => { m.mat(MAT.METAL, COL.bronze); m.lathe([[0.09, 0], [0.02, 0.05], [0.02, 0.4], [0.05, 0.45]], 8, 0); at(m, 0, 0.42, 0, 0, () => Props.candle(m, { zone: c.zone, candleLight: false, always: true }, true)); });
      at(m, B.x1 - 0.05, 2.0, 0, 0, () => { m.mat(MAT.METAL, COL.gold); m.push().RZ(PI / 2); m.cyl(0, 0, 0, 0.42, 0.42, 0.05, 16, 3); m.pop(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; m.beam([-0.03, Math.sin(a) * 0.5, Math.cos(a) * 0.5], [-0.03, Math.sin(a) * (i % 2 ? 0.75 : 0.95), Math.cos(a) * (i % 2 ? 0.75 : 0.95)], 0.05, 0.03); } });
      addLight(wp(m, 4.9, 1.9, 0), 8, [2.6, 1.8, 0.9], c.zone, 'fire');
      at(m, 3.7, 0.02, -1.9, -PI / 2, () => { m.mat(MAT.TIMBER, COL.woodDark); m.cbox(0, 0, 0, 0.12, 1.05, 0.12); m.push().T(0, 1.05, 0).RX(0.5); m.box(-0.3, 0, -0.2, 0.3, 0.04, 0.2); at(m, 0, 0.04, 0, 0, () => Props.book(m, COL.red, 0.06)); m.pop(); });
      c.interact(3.7, 1.2, -1.9, { kind: 'read', id: 'chapel.book', title: 'Book of the Dawn', text: 'When the night is longest, ring the bell and light the fire, that those lost upon the fells may find their way home.', r: 1.7 });
      for (const [x, z] of [[-5.9, -3.1], [-5.9, 3.1], [3.6, -3.2], [3.6, 3.2]]) at(m, x, 0.02, z, 0, () => { m.mat(MAT.METAL, COL.black); m.lathe([[0.16, 0], [0.02, 0.06], [0.02, 1.25], [0.12, 1.3]], 7, 0); at(m, 0, 1.3, 0, 0, () => Props.candle(m, { zone: c.zone, candleLight: false, always: true }, true)); addLight(wp(m, 0, 1.75, 0), 5, [1.5, 0.95, 0.42], c.zone, 'fire'); });
      c.spot('altar', 4.6, 0, -PI / 2, 0.21); c.spot('nave', -2.0, 0, PI / 2);
      // ── bell tower porch outside the entrance ──
      const x0 = -c.w / 2 - 3.3, x1 = -c.w / 2, zh = 1.75, pr = 0.75, top = 10.4;
      e.m1 = 0; e.ao = 1; e.mat(MAT.STONE, [1, 1, 1]);
      for (const [px, pz] of [[x0, -zh], [x0, zh - pr], [x1 - pr, -zh], [x1 - pr, zh - pr]]) { e.grad = [1, 0.7]; e.box(px, -1.4, pz, px + pr, 2.9, pz + pr); e.grad = null; e.box(px, 2.9, pz, px + pr, top, pz + pr); addBoxCollider(e, px, pz, px + pr, pz + pr, -0.4, 4); }
      const panel = (y0, y1) => { e.box(x0 + pr, y0, -zh + 0.1, x1 - pr, y1, -zh + 0.6); e.box(x0 + pr, y0, zh - 0.6, x1 - pr, y1, zh - 0.1); e.box(x0 + 0.1, y0, -zh + pr, x0 + 0.6, y1, zh - pr); e.box(x1 - 0.6, y0, -zh + pr, x1 - 0.1, y1, zh - pr); };
      panel(2.9, 7.2); panel(9.3, top);
      e.mat(MAT.STONE, [0.85, 0.85, 0.85], 0.8); e.box(x0 - 0.12, 7.2, -zh - 0.12, x1 + 0.12, 7.38, zh + 0.12); e.box(x0 - 0.12, top, -zh - 0.12, x1 + 0.12, top + 0.16, zh + 0.12);
      e.mat(MAT.COBBLE, [1, 1, 1], 1.4); e.box(x0, -1.4, -zh, x1, 0.0, zh); e.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); e.box(x0 - 0.5, -1.4, -zh - 0.5, x1, -0.16, zh + 0.5);
      addFloor(e, x0, -zh, x1 + 0.3, zh, 0.0); addFloor(e, x0 - 0.5, -zh - 0.5, x1, zh + 0.5, -0.16);
      e.mat(MAT.PLANKS, COL.woodDark); e.ao = 0.4; e.quad([x0 + 0.6, 7.2, zh - 0.6], [x0 + 0.6, 7.2, -zh + 0.6], [x1 - 0.6, 7.2, -zh + 0.6], [x1 - 0.6, 7.2, zh - 0.6]); e.ao = 1;
      const cx = (x0 + x1) / 2, ap = top + 3.4, o = 0.3;
      e.mat(MAT.SHINGLE, [0.55, 0.62, 0.74]);
      e.poly([[x0 - o, top + 0.16, -zh - o], [x0 - o, top + 0.16, zh + o], [cx, ap, 0]]); e.poly([[x1 + o, top + 0.16, zh + o], [x1 + o, top + 0.16, -zh - o], [cx, ap, 0]]);
      e.poly([[x1 + o, top + 0.16, -zh - o], [x0 - o, top + 0.16, -zh - o], [cx, ap, 0]]); e.poly([[x0 - o, top + 0.16, zh + o], [x1 + o, top + 0.16, zh + o], [cx, ap, 0]]);
      e.mat(MAT.METAL, COL.gold); e.box(cx - 0.02, ap - 0.1, -0.02, cx + 0.02, ap + 0.7, 0.02); e.push().T(cx, ap + 0.95, 0).RZ(PI / 2).T(0, -0.02, 0); e.cyl(0, 0, 0, 0.26, 0.26, 0.04, 12, 3); e.pop();
      e.mat(MAT.TIMBER, COL.timberDark); e.box(x0 + 0.5, 8.95, -0.09, x1 - 0.5, 9.13, 0.09);
      e.mat(MAT.METAL, COL.bronze); e.push().T(cx, 8.0, 0); e.lathe([[0.48, 0], [0.42, 0.06], [0.33, 0.3], [0.27, 0.62], [0.17, 0.85], [0.03, 0.93]], 12, 0); e.mat(MAT.METAL, COL.black); e.box(-0.02, -0.12, -0.02, 0.02, 0.6, 0.02); e.ball(0, -0.12, 0, 0.07); e.pop();
      e.mat(MAT.CLOTH, [0.75, 0.62, 0.4], 0.3); e.box(cx + 0.7, 1.2, -0.012, cx + 0.724, 8.0, 0.012);
      World.bell = { p: wp(e, cx, 8.3, 0) };
      World.interact.push({ p: wp(e, cx + 0.7, 1.4, 0), r: 1.9, zone: 0, kind: 'bell', id: 'bell' });
      at(e, x0 + 0.02, 2.6, -zh - 0.02, 0, () => Props.lantern(e, { zone: 0 }));
    },
  },
  mill: {
    H: 3.0, walls: 'half', stoneH: 1.5, roof: 'shingle', roofCol: [0.74, 0.66, 0.58], plaster: [1, 0.97, 0.88],
    doors: [{ wall: 'left', pos: -0.6 }], windows: [{ wall: 'front', pos: -1.6 }, { wall: 'front', pos: 1.6 }, { wall: 'left', pos: 1.7, w: 0.7 }, { wall: 'right', pos: 0 }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c);
      // hurst frame with the stones; gearing below (pit wheel is part of the turning water wheel)
      const hx = 0, hz = 1.0, py = 1.25;
      m.mat(MAT.TIMBER, COL.timber);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(hx + sx * 0.95, 0.02, hz + sz * 0.85, 0.16, py, 0.16, 12);
      m.mat(MAT.PLANKS, COL.wood); m.box(hx - 1.1, py, hz - 1.0, hx + 1.1, py + 0.08, hz + 1.0);
      m.mat(MAT.ROCK, [0.95, 0.95, 0.95], 0.4); m.cyl(hx, py + 0.08, hz, 0.62, 0.62, 0.22, 16, 3); m.cyl(hx, py + 0.32, hz, 0.6, 0.6, 0.2, 16, 3);
      m.mat(MAT.TIMBER, COL.woodDark); m.cyl(hx, 0.3, hz, 0.07, 0.07, py + 0.25, 8, 0);
      m.cyl(hx, 0.92, hz, 0.34, 0.34, 0.1, 12, 3); for (let i = 0; i < 10; i++) { const a = i * TAU / 10; m.cbox(hx + Math.cos(a) * 0.3, 0.80, hz + Math.sin(a) * 0.3, 0.04, 0.34, 0.04); }
      m.mat(MAT.PLANKS, COL.wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(hx + sx * 0.5, py + 0.08, hz + sz * 0.5, 0.06, 1.25, 0.06, 12);
      m.push().T(hx, 0, hz); m.mat(MAT.PLANKS, COL.wood); m.lathe([[0.12, py + 0.72], [0.52, py + 1.32]], 4, 0); m.pop();
      addBoxCollider(m, hx - 1.1, hz - 1.0, hx + 1.1, hz + 1.0, 0, 2);
      m.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) m.beam([hx - 1.9, 0.02, hz - 0.6 + s * 0.22], [hx - 1.15, py + 0.05, hz - 0.6 + s * 0.22], 0.05, 0.07); for (let i = 1; i < 5; i++) m.box(hx - 1.9 + i * 0.15 - 0.02, i * 0.25, hz - 0.84, hx - 1.9 + i * 0.15 + 0.02, i * 0.25 + 0.03, hz - 0.36);
      for (const [x, z, s2] of [[-2.9, -2.2, 0.36], [-2.3, -2.4, 0.33], [-2.75, -1.5, 0.3], [2.8, -2.3, 0.36], [2.2, -2.5, 0.3], [2.9, -1.6, 0.32], [2.9, 2.3, 0.34]]) at(m, x, 0.02, z, R() * 3, () => Props.sack(m, s2, R() < 0.5 ? [0.93, 0.91, 0.86] : COL.wool));
      at(m, -2.55, 0.74, -2.2, 0.3, () => Props.sack(m, 0.3, [0.93, 0.91, 0.86]));
      bedAt(c, 'bed', B.x0 + 1.05, B.z1 - 0.6, PI / 2, 0.95, COL.wool);
      at(m, 2.6, 0.02, 0.6, PI / 2, () => { Props.table(m, 1.0, 0.6); Props.clutter(m, R, -0.3, 0.3, 0.76, 0, ['mug', 'loaf', 'candle'], 3, c); });
      at(m, 0.2, c.H - 0.2, -1.6, 0, () => Props.lantern(m, c));
      at(m, 1.6, 0.02, -2.5, 0, () => Props.crate(m, 0.6)); at(m, -0.6, 0.02, -2.5, 0, () => Props.barrel(m));
      c.spot('work', -1.2, -1.2, PI * 0.8); c.spot('home', 1.9, 0.6, PI / 2);
    },
  },
  barn: {
    H: 3.2, walls: 'log', roof: 'thatch', roofCol: [0.9, 0.86, 0.78], pitch: 46,
    doors: [{ wall: 'front', pos: 0, w: 3.4, h: 2.9, noLeaf: true, lamp: false }], windows: [{ wall: 'back', pos: 0, w: 0.8, h: 0.7, sill: 1.9, shutters: false }],
    interior(c) {
      const m = c.int, R = c.R, B = bounds(c);
      at(m, -2.9, 0.02, 2.2, 0, () => Props.haystack(m, 1.15)); at(m, -3.1, 0.02, -0.2, 0.4, () => Props.haybale(m)); at(m, -3.0, 0.02, -1.4, 1.9, () => Props.haybale(m)); at(m, -3.05, 0.9, -0.8, 1.2, () => Props.haybale(m));
      at(m, 1.6, 0.02, 1.3, 0.25, () => Props.cart(m, true));
      m.mat(MAT.PLANKS, COL.woodDark); for (const z of [-0.6, 1.2]) { m.box(2.6, 0.02, z - 0.04, B.x1, 1.25, z + 0.04); addBoxCollider(m, 2.6, z - 0.06, B.x1, z + 0.06, 0, 1.3); }
      at(m, 3.5, 0.02, -2.6, 0, () => Props.barrel(m)); at(m, 2.9, 0.02, -2.9, 0, () => Props.sack(m, 0.33)); at(m, 3.6, 0.02, 0.3, 0, () => Props.crate(m, 0.6));
      m.mat(MAT.TIMBER, COL.wood); m.beam([B.x0 + 0.15, 0.02, -2.4], [B.x0 + 0.1, 2.1, -2.9], 0.035, 0.035); for (let i = 0; i < 3; i++) m.beam([B.x0 + 0.1, 2.1, -2.9], [B.x0 + 0.12 + (i - 1) * 0.08, 2.5, -3.0], 0.02, 0.02);
      at(m, 0, c.H - 0.2, 0, 0, () => Props.lantern(m, c));
      c.spot('work', 0.4, -1.5, 0);
    },
  },
};
for (const id of ['elder', 'herbalist', 'guardhouse', 'weaver', 'farm', 'hunter', 'fisher', 'smithy', 'store', 'inn']) { const s = SITE[id], h = HOUSES[id]; if (s.doorPos !== undefined) h.doors[0].pos = s.doorPos; }
