// ───────────────────────── trade props and trade recipes for ordinary houses and shops [c5] ─────────────────────────
// Floor props are drawn with their back at local -z and their face at +z (as the oven, the vats and the benches of 72k_houses.js expect); every one is a few dozen to
// a few hundred triangles. HPR lists them by name: [w, d, h, factory(P, room), options]. HT is one recipe per trade: the focal piece first (on the wall facing the door),
// then what the trade owns along the walls and in the middle, then its wares on shelves. Recipes only place; the family decides which room is the work room.
const TP = {};
const hDull = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
TP.oven = (P, room, lit) => m => {
  const H = P.lv[room.k].H;
  m.mat(MAT.STONE, [0.9, 0.84, 0.78], 0.8);
  m.box(-0.95, 0, -0.65, 0.95, 0.4, 0.65); m.box(-0.95, 0.4, -0.65, -0.32, 0.98, 0.65); m.box(0.32, 0.4, -0.65, 0.95, 0.98, 0.65); m.box(-0.32, 0.86, -0.65, 0.32, 0.98, 0.65);
  m.ball(0, 0.98, -0.05, 0.9, 0.55, 0.62, 10, 5); m.box(-0.24, 1.3, -0.64, 0.24, H - 0.03, -0.32);
  m.mat(MAT.PLAIN, [0.05, 0.04, 0.04]); m.box(-0.32, 0.4, -0.55, 0.32, 0.86, -0.5);
  m.mat(MAT.METAL, COL.black); m.box(-0.42, 0.0, 0.64, 0.42, 0.07, 0.8);
  if (lit !== false) {
    emit(m, 1.5, () => { m.mat(MAT.PLAIN, [1, 0.42, 0.1]); m.box(-0.28, 0.4, -0.45, 0.28, 0.45, 0.5); });
    World.emitters.push({ type: 'fire', p: wp(m, 0, 0.55, 0.1), size: 0.3, zone: P.zone });
    addLight(wp(m, 0, 0.95, 1.2), 9.5, [3.1, 1.5, 0.52], P.zone, 'fire'); P.lightIn[room.id] = 1;
  } else { m.mat(MAT.METAL, COL.black); m.box(-0.3, 0.42, 0.62, 0.3, 0.84, 0.67); }
  addBoxCollider(m, -0.95, -0.65, 0.95, 0.8, 0, 2);
};
TP.vat = (col, r, h) => m => {
  r = r || 0.55; h = h || 0.72; m.mat(MAT.PLANKS, COL.woodDark, 0.5);
  { const w = COL.woodDark, dk = col.map(v => v * 0.5), mix = (u, k) => [w[0] + (dk[0] - w[0]) * u, w[1] + (dk[1] - w[1]) * u, w[2] + (dk[2] - w[2]) * u];      // [fin] the staves darkened by the dye up to the splash line: stained from 0.3 m below the surface, solid above the liquid
    latheG(m, [[r * 0.9, 0], [r, h * 0.45], [r * 0.97, h - 0.32], [r * 0.965, h - 0.2], [r * 0.962, h - 0.09], [r * 0.96, h - 0.06], [r * 0.96, h], [r * 0.9, h]], 18, 0, (k, t, a) => k < 2 ? w : k === 2 ? mix(0.15, 0) : k === 3 ? mix(0.45, 0) : k === 4 ? mix(0.8, 0) : k === 5 ? mix(0.9, 0) : [w[0] * 1.12, w[1] * 1.12, w[2] * 1.12]); }
  m.mat(MAT.PLAIN, col.map(v => v * 0.55)); m.disc(0, h - 0.09, 0, r * 0.9, 18, 1);      // [fin] the dye itself, in its own colour (it was a black disc), a darker meniscus where it climbs the staves and a pale scum ring
  m.mat(MAT.PLAIN, col.map(v => v * 0.45)); m.lathe([[r * 0.9, h - 0.09], [r * 0.955, h - 0.075]], 18, 0);
  m.mat(MAT.PLAIN, col.map(v => Math.min(1, v * 0.85 + 0.07))); m.lathe([[r * 0.7, h - 0.088], [r * 0.82, h - 0.088]], 18, 1);
  m.mat(MAT.PLANKS, COL.wood); m.lathe([[r * 0.96, h - 0.015], [r * 1.02, h - 0.015], [r * 1.02, h + 0.02], [r * 0.9, h + 0.02]], 18, 0);
  m.mat(MAT.METAL, COL.iron); for (const t of [0.15, 0.55, 0.93]) { const rr = r * (0.9 + 0.1 * Math.sin(t * PI * 0.9)) + 0.008; m.lathe([[rr, h * t - 0.02], [rr, h * t + 0.02]], 12, 0); }
  m.mat(MAT.TIMBER, COL.wood); m.beam([r * 0.5, h + 0.55, 0.05], [r * 0.1, h - 0.15, 0], 0.035, 0.035);
  addCircleCollider(m, 0, 0, r, 0, h);
};
TP.hideRack = R => m => {
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-0.7, 0.7]) m.box(sx - 0.04, 0, -0.04, sx + 0.04, 1.75, 0.04); m.box(-0.74, 1.7, -0.05, 0.74, 1.76, 0.05); m.box(-0.7, 0.15, -0.04, 0.7, 0.2, 0.04);
  const cols = [[0.42, 0.28, 0.17], [0.55, 0.42, 0.28], [0.34, 0.24, 0.16], [0.6, 0.5, 0.36]];
  for (let i = 0; i < 3; i++) { const x = -0.45 + i * 0.45; m.mat(MAT.CLOTH, R.pick(cols), 0.5); m.box(x - 0.2, 0.25 + R() * 0.1, 0.0, x + 0.2, 1.7, 0.035); m.ball(x, 0.25, 0.02, 0.19, 0.06, 0.03, 6, 3); }
  addBoxCollider(m, -0.74, -0.1, 0.74, 0.12, 0, 1.8);
};
TP.potterWheel = m => {
  m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.4, 0, -0.35, 0.4, 0.55, 0.35); m.box(-0.45, 0.52, -0.4, 0.45, 0.58, 0.4);
  m.mat(MAT.TIMBER, COL.wood); m.cyl(0, 0.58, 0, 0.3, 0.3, 0.05, 12, 3); m.mat(MAT.PLAIN, [0.55, 0.42, 0.32]); m.lathe([[0.01, 0.63], [0.1, 0.66], [0.13, 0.75], [0.07, 0.85], [0.03, 0.88]], 9, 1);
  m.mat(MAT.PLANKS, COL.wood); m.cyl(0, 0.0, 0.45, 0.3, 0.3, 0.06, 10, 3);
  addBoxCollider(m, -0.45, -0.4, 0.45, 0.8, 0, 0.9);
};
TP.saddle = m => {
  m.mat(MAT.PLANKS, COL.woodDark); for (const sx of [-0.35, 0.35]) { m.beam([sx, 0, -0.25], [sx * 0.8, 0.75, 0], 0.05, 0.05); m.beam([sx, 0, 0.25], [sx * 0.8, 0.75, 0], 0.05, 0.05); }
  m.box(-0.45, 0.72, -0.04, 0.45, 0.78, 0.04); m.mat(MAT.CLOTH, COL.leather, 0.5); m.ball(0, 0.88, 0, 0.22, 0.1, 0.36, 8, 4); m.ball(0, 0.95, -0.28, 0.12, 0.1, 0.07, 6, 3); m.ball(0, 0.94, 0.3, 0.14, 0.1, 0.07, 6, 3);
  m.mat(MAT.METAL, COL.iron); for (const sx of [-1, 1]) m.box(sx * 0.27 - 0.012, 0.52, 0.0, sx * 0.27 + 0.012, 0.8, 0.02);
  addBoxCollider(m, -0.5, -0.3, 0.5, 0.3, 0, 1.0);
};
TP.stones = R => m => {
  const g = [[0.62, 0.6, 0.56], [0.7, 0.68, 0.62], [0.55, 0.54, 0.5]];
  for (const [x, y, z, w, h, d] of [[-0.45, 0, 0, 0.6, 0.3, 0.45], [0.2, 0, 0.02, 0.62, 0.3, 0.45], [-0.2, 0.3, 0.0, 0.64, 0.28, 0.42], [0.5, 0.3, -0.02, 0.4, 0.26, 0.4]]) { m.mat(MAT.STONE, R.pick(g), 0.7); m.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2); }
  addBoxCollider(m, -0.8, -0.25, 0.75, 0.25, 0, 0.6);
};
TP.planks = R => m => {
  m.mat(MAT.PLANKS, COL.wood, 0.6); for (let i = 0; i < 6; i++) m.box(-0.8 - R() * 0.05, i * 0.05, -0.2 + (i % 2) * 0.02, 0.8 + R() * 0.05, i * 0.05 + 0.045, 0.2 + (i % 2) * 0.02);
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-0.55, 0.0, 0.55]) m.box(sx - 0.03, 0.3, -0.22, sx + 0.03, 0.34, 0.22);
  addBoxCollider(m, -0.85, -0.25, 0.85, 0.25, 0, 0.4);
};
TP.sawhorse = m => { m.mat(MAT.TIMBER, COL.wood); m.box(-0.5, 0.7, -0.04, 0.5, 0.78, 0.04); for (const sx of [-0.42, 0.42]) { m.beam([sx, 0, -0.22], [sx, 0.74, 0], 0.045, 0.045); m.beam([sx, 0, 0.22], [sx, 0.74, 0], 0.045, 0.045); } m.mat(MAT.PLANKS, COL.wood); m.box(-0.35, 0.78, -0.07, 0.3, 0.84, 0.07); addBoxCollider(m, -0.55, -0.25, 0.55, 0.25, 0, 0.8); };
TP.leanWheels = m => {
  m.mat(MAT.TIMBER, COL.woodDark); at(m, -0.35, 0.58, -0.25, 0.1, () => { m.push().RX(-0.18); Props.wheel(m, 0.58, 0.09); m.pop(); }); at(m, 0.38, 0.54, -0.22, -0.12, () => { m.push().RX(-0.2); Props.wheel(m, 0.54, 0.09); m.pop(); });
  m.box(-0.9, 0, -0.0, 0.9, 0.04, 0.3);
  addBoxCollider(m, -0.95, -0.3, 0.95, 0.35, 0, 1.0);
};
TP.baskets = R => m => {
  for (const [x, z, r, h] of [[-0.35, 0, 0.26, 0.38], [0.1, 0.05, 0.3, 0.45], [0.5, -0.04, 0.22, 0.3], [-0.05, 0.1, 0.18, 0.55]]) {
    m.mat(MAT.THATCH, R.pick([[0.72, 0.6, 0.4], [0.6, 0.5, 0.34], [0.78, 0.68, 0.46]]), 0.5); at(m, x, 0, z, 0, () => m.lathe([[r * 0.7, 0], [r, h * 0.5], [r * 1.05, h]], 9, 1));
  }
  addBoxCollider(m, -0.7, -0.35, 0.8, 0.35, 0, 0.6);
};
TP.willow = m => { m.mat(MAT.THATCH, [0.62, 0.5, 0.3], 0.5); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = 0.1 * Math.sqrt(i % 3); m.beam([Math.cos(a) * rr, 0, Math.sin(a) * rr], [Math.cos(a) * rr + 0.08, 1.4, Math.sin(a) * rr - 0.1], 0.025, 0.025); } m.mat(MAT.CLOTH, [0.4, 0.3, 0.2], 0.5); m.cyl(0.02, 0.55, -0.04, 0.12, 0.12, 0.03, 8, 1); addBoxCollider(m, -0.2, -0.25, 0.25, 0.2, 0, 1.4); };
TP.staves = R => m => {
  m.mat(MAT.PLANKS, COL.wood, 0.6); for (let i = 0; i < 12; i++) { const x = -0.4 + i * 0.07; m.beam([x, 0, 0.18], [x + R.s() * 0.02, 1.5, -0.1 + (i % 2) * 0.02], 0.055, 0.025); }
  m.mat(MAT.METAL, COL.iron); m.lathe([[0.4, 0.5], [0.4, 0.53]], 10, 0);
  addBoxCollider(m, -0.45, -0.15, 0.45, 0.22, 0, 1.5);
};
TP.hoopRack = m => { m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.5, 0, -0.04, -0.46, 1.3, 0.04); m.box(0.46, 0, -0.04, 0.5, 1.3, 0.04); m.box(-0.5, 1.26, -0.05, 0.5, 1.32, 0.05); m.mat(MAT.METAL, COL.iron); for (let i = 0; i < 5; i++) m.lathe([[0.32 - i * 0.03, 1.22 - i * 0.15], [0.32 - i * 0.03, 1.25 - i * 0.15]], 10, 0); addBoxCollider(m, -0.5, -0.06, 0.5, 0.06, 0, 1.3); };
TP.fleeces = R => m => { for (const [x, y, z, r] of [[-0.3, 0, 0, 0.34], [0.2, 0, 0.05, 0.36], [-0.05, 0.22, 0, 0.3], [0.5, 0.0, -0.05, 0.28]]) { m.mat(MAT.CLOTH, R.pick([[0.86, 0.82, 0.72], [0.78, 0.72, 0.62], [0.7, 0.66, 0.58]]), 0.5); m.ball(x, y + r * 0.45, z, r, r * 0.5, r * 0.85, 7, 4); } addBoxCollider(m, -0.7, -0.35, 0.8, 0.35, 0, 0.6); };
TP.hurdle = m => { m.mat(MAT.TIMBER, COL.wood); for (let i = 0; i < 8; i++) m.box(-0.8 + i * 0.22 - 0.02, 0, -0.02, -0.8 + i * 0.22 + 0.02, 1.0, 0.02); for (const y of [0.25, 0.5, 0.75]) m.box(-0.82, y, -0.03, 0.82, y + 0.04, 0.03); addBoxCollider(m, -0.85, -0.12, 0.85, 0.12, 0, 1.0); };
TP.block = m => { m.mat(MAT.TIMBER, COL.woodDark); m.cyl(0, 0, 0, 0.3, 0.32, 0.8, 9, 3); m.mat(MAT.PLAIN, [0.5, 0.3, 0.26]); m.box(-0.18, 0.8, -0.1, 0.1, 0.815, 0.12); m.mat(MAT.METAL, [0.7, 0.7, 0.74]); m.box(0.0, 0.8, -0.2, 0.3, 0.9, -0.17); m.mat(MAT.TIMBER, COL.wood); m.box(0.0, 0.82, -0.18, 0.28, 0.86, -0.14); addCircleCollider(m, 0, 0, 0.32, 0, 0.85); };
TP.cutTable = (len, col) => m => {
  Props.table(m, len, 0.95, 0.88); m.mat(MAT.CLOTH, col, 0.5); m.box(-len * 0.3, 0.88, -0.35, len * 0.05, 0.9, 0.35); m.mat(MAT.CLOTH, hDull(col, 0.7), 0.5); m.box(len * 0.12, 0.88, -0.2, len * 0.35, 0.9, 0.3);
  m.mat(MAT.METAL, [0.75, 0.75, 0.8]); for (const sg of [-1, 1]) m.beam([len * 0.4, 0.9, sg * 0.03], [len * 0.4 + 0.2, 0.91, sg * 0.1], 0.02, 0.01);
  m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(-len * 0.45, 0.88, 0.2, -len * 0.4, 0.92, 0.3);
};
TP.dipRack = m => {
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-0.7, 0.7]) m.box(sx - 0.04, 0, -0.04, sx + 0.04, 1.45, 0.04); m.box(-0.74, 1.4, -0.04, 0.74, 1.46, 0.04); m.box(-0.74, 0.9, -0.03, 0.74, 0.94, 0.03);
  m.mat(MAT.PLAIN, COL.wax); for (let i = 0; i < 12; i++) { const x = -0.62 + i * 0.113; m.cyl(x, 1.0, 0, 0.016, 0.02, 0.42, 5, 2); }
  at(m, 0, 0, 0.5, 0, () => { m.mat(MAT.PLANKS, COL.woodDark, 0.5); m.lathe([[0.32, 0], [0.36, 0.2], [0.34, 0.45]], 10, 0); m.mat(MAT.PLAIN, [0.8, 0.74, 0.55]); m.disc(0, 0.4, 0, 0.32, 10, 1); });
  addBoxCollider(m, -0.75, -0.1, 0.75, 0.9, 0, 1.4);
};
TP.carcassBar = (len, R) => m => {
  m.mat(MAT.METAL, [0.2, 0.19, 0.19]); m.box(-len / 2, -0.4, -0.015, len / 2, -0.37, 0.015);
  const n = Math.max(2, Math.round(len / 0.6));
  for (let i = 0; i < n; i++) { const x = -len / 2 + 0.3 + i * (len - 0.6) / Math.max(1, n - 1); m.mat(MAT.METAL, COL.black); m.box(x - 0.006, -0.52, -0.006, x + 0.006, -0.37, 0.006); m.mat(MAT.THATCH, R.pick([[0.45, 0.3, 0.24], [0.4, 0.27, 0.21], [0.5, 0.35, 0.27]]), 0.4); m.ball(x, -0.74, 0, 0.09, 0.22, 0.07, 7, 5); }
};
TP.hideBar = (len, R) => m => {
  m.mat(MAT.METAL, [0.2, 0.19, 0.19]); m.box(-len / 2, -0.4, -0.015, len / 2, -0.37, 0.015);
  for (let i = 0; i < 4; i++) { const x = -len / 2 + 0.25 + i * (len - 0.5) / 3, h = 0.7 + R() * 0.25; m.mat(MAT.CLOTH, R.pick([[0.36, 0.27, 0.18], [0.3, 0.24, 0.17], [0.42, 0.32, 0.22]]), 0.45); m.box(x - 0.2, -0.37 - h, -0.012, x + 0.2, -0.37, 0.012); }
};
TP.sausages = (len, R) => m => { m.mat(MAT.METAL, COL.black); m.box(-len / 2, -0.04, -0.012, len / 2, -0.015, 0.012); for (let i = 0; i < Math.round(len / 0.12); i++) { const x = -len / 2 + 0.08 + i * 0.12; m.mat(MAT.PLAIN, R.pick([[0.42, 0.22, 0.17], [0.5, 0.3, 0.22]])); m.ball(x, -0.2, 0, 0.035, 0.18, 0.035, 5, 4); } };
TP.arrows = R => (m, hh) => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.35, -0.95, -0.03, 0.35, 0.0, 0); for (let i = 0; i < 9; i++) { const x = -0.28 + i * 0.07; m.mat(MAT.TIMBER, COL.wood); m.box(x - 0.007, -0.9, -0.05, x + 0.007, -0.05, -0.036); m.mat(MAT.PLAIN, R.pick([[0.75, 0.74, 0.7], [0.5, 0.2, 0.15], [0.7, 0.66, 0.5]])); m.box(x - 0.02, -0.28, -0.06, x + 0.02, -0.05, -0.04); } };
TP.bows = R => (m, hh) => { m.mat(MAT.TIMBER, COL.wood); for (let i = 0; i < 3; i++) { const y = -0.2 - i * 0.28; m.tube([[-0.55, y, -0.06], [-0.2, y - 0.07, -0.08], [0.2, y - 0.07, -0.08], [0.55, y, -0.06]], [0.018, 0.026, 0.026, 0.018], 5); m.mat(MAT.CLOTH, [0.7, 0.66, 0.5], 0.4); m.box(-0.55, y - 0.001, -0.065, 0.55, y + 0.001, -0.059); m.mat(MAT.TIMBER, COL.wood); } };
TP.lasts = (R) => m => {   // a bench of cobbler's lasts and leather
  Props.table(m, 1.5, 0.7, 0.8);
  for (const [x, z, a] of [[-0.5, -0.1, 0.3], [-0.2, 0.12, -0.5], [0.3, -0.05, 1.0]]) at(m, x, 0.8, z, a, () => { m.mat(MAT.TIMBER, COL.wood); m.ball(0, 0.04, 0, 0.12, 0.05, 0.05, 6, 3); m.ball(0.1, 0.05, 0, 0.05, 0.06, 0.05, 5, 3); });
  m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(0.4, 0.8, -0.2, 0.7, 0.84, 0.15); m.mat(MAT.METAL, [0.7, 0.7, 0.74]); m.box(-0.1, 0.8, -0.28, 0.04, 0.82, -0.22);
};
TP.anvilSmall = m => { Props.anvil(m); };
TP.brazier = m => { m.mat(MAT.METAL, COL.black); m.lathe([[0.1, 0.5], [0.28, 0.75], [0.3, 0.8]], 9, 1); for (const a of [0, 2.1, 4.2]) m.beam([Math.cos(a) * 0.1, 0.55, Math.sin(a) * 0.1], [Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28], 0.03, 0.03); emit(m, 1.1, () => { m.mat(MAT.PLAIN, [1, 0.4, 0.1]); m.cyl(0, 0.76, 0, 0.22, 0.22, 0.03, 8, 1); }); addBoxCollider(m, -0.32, -0.32, 0.32, 0.32, 0, 0.85); };
TP.tun = m => { TP.vat([0.55, 0.45, 0.25], 0.8, 0.95)(m); m.mat(MAT.PLANKS, COL.wood); m.box(-0.14, 1.0, -0.8, 0.14, 1.06, 0.8); };
TP.ropeCoils = R => m => { for (const [x, y, r] of [[-0.4, 0, 0.3], [0.2, 0, 0.34], [-0.1, 0.17, 0.26]]) { m.mat(MAT.CLOTH, R.pick([[0.62, 0.52, 0.34], [0.7, 0.62, 0.44]]), 0.5); m.lathe([[r * 0.35, y], [r, y + 0.03], [r, y + 0.16], [r * 0.4, y + 0.17]], 10, 1); } addBoxCollider(m, -0.75, -0.4, 0.55, 0.4, 0, 0.35); };
TP.lectern = m => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.04, 0, -0.04, 0.04, 1.0, 0.04); m.box(-0.2, 0, -0.2, 0.2, 0.05, 0.2); m.push().T(0, 1.0, 0).RX(0.5); m.box(-0.28, 0, -0.2, 0.28, 0.04, 0.2); m.mat(MAT.PLAIN, COL.parchment); m.box(-0.22, 0.04, -0.17, -0.01, 0.055, 0.16); m.box(0.01, 0.04, -0.17, 0.22, 0.055, 0.16); m.pop(); addBoxCollider(m, -0.25, -0.25, 0.25, 0.25, 0, 1.2); };
TP.clayBin = m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.45, 0, -0.3, 0.45, 0.5, 0.3); m.mat(MAT.PLAIN, [0.55, 0.42, 0.32]); m.box(-0.4, 0.45, -0.25, 0.4, 0.52, 0.25); addBoxCollider(m, -0.45, -0.3, 0.45, 0.3, 0, 0.5); };
TP.strongbox = m => { Props.chest(m, 0.9); m.mat(MAT.METAL, COL.iron); m.box(-0.45, 0.2, -0.26, 0.45, 0.24, -0.248); };
// the wares library gets a few more (muted): shoes, a boot, a knife, a pan
Object.assign(PD.ware, {
  shoe: (m, R) => { m.mat(MAT.CLOTH, R.pick([COL.leather, [0.32, 0.22, 0.15], [0.5, 0.38, 0.26]]), 0.5); m.box(-0.1, 0, -0.04, 0.09, 0.03, 0.04); m.ball(-0.05, 0.05, 0, 0.07, 0.05, 0.045, 6, 3); m.ball(0.05, 0.03, 0, 0.06, 0.03, 0.04, 6, 3); },
  boot: (m, R) => { m.mat(MAT.CLOTH, R.pick([COL.leather, [0.3, 0.2, 0.14]]), 0.5); m.box(-0.045, 0, -0.04, 0.05, 0.03, 0.04); m.cyl(-0.05, 0.0, 0, 0.045, 0.05, 0.28, 6, 2); m.ball(0.05, 0.04, 0, 0.07, 0.04, 0.04, 6, 3); },
  knife: (m, R) => { m.mat(MAT.METAL, [0.7, 0.7, 0.74]); m.box(-0.12, 0.005, -0.012, 0.06, 0.012, 0.012); m.mat(MAT.TIMBER, COL.wood); m.box(0.06, 0.003, -0.015, 0.15, 0.02, 0.015); },
  pan: (m, R) => { m.mat(MAT.METAL, [0.22, 0.2, 0.19]); m.lathe([[0.02, 0], [0.12, 0.02], [0.13, 0.06]], 9, 1); m.box(0.12, 0.04, -0.012, 0.3, 0.055, 0.012); },
  kettle: (m, R) => { m.mat(MAT.METAL, R.pick([[0.3, 0.2, 0.14], [0.2, 0.19, 0.18]])); m.lathe([[0.04, 0], [0.12, 0.04], [0.11, 0.12], [0.05, 0.16], [0.03, 0.17]], 9, 1); m.box(0.1, 0.07, -0.01, 0.17, 0.1, 0.01); },
  yarn: (m, R) => { m.mat(MAT.CLOTH, R.pick([[0.6, 0.5, 0.36], [0.4, 0.42, 0.3], [0.5, 0.36, 0.3], [0.7, 0.66, 0.56]]), 0.5); m.ball(0, 0.05, 0, 0.07, 0.06, 0.07, 6, 4); },
  glove: (m, R) => { m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(-0.05, 0, -0.04, 0.05, 0.015, 0.06); },
});
Object.assign(WARE_W, { shoe: 0.22, boot: 0.2, knife: 0.3, pan: 0.32, kettle: 0.3, yarn: 0.16, glove: 0.14 });
Object.assign(PD.WARES, {
  shoes: ['shoe', 'boot', 'shoe', 'boot', 'shoe', 'box', 'glove'], cutlery: ['knife', 'knife', 'tools', 'knife', 'box', 'tools'], tin: ['pan', 'kettle', 'pot', 'pan', 'kettle', 'lantern', 'pot'],
  larder: ['cheese', 'loaf', 'jar', 'sack', 'bowl', 'ham', 'jar', 'cheese'], bread: ['loaf', 'loaf', 'bowl', 'loaf', 'cheese', 'loaf'], candlery: ['candles', 'candles', 'box', 'candles', 'lantern', 'jar'], yarns: ['yarn', 'spools', 'yarn', 'folded', 'yarn'], pots: ['pot', 'jar', 'bowl', 'pot', 'jar', 'pot', 'kettle'],
});

// floor props by name: [w, d, h, factory(P, room, R) -> draw(m)]
// [fx2] a hand cart for a yard: the body 1.5 x 2.4 m on two wheels, the shafts lowered to the ground 1.1 m beyond (the street cart's shafts reach 1.7 m and drew 1.5 m through the yard wall)
TP.cart = m => {
  m.push().T(0, 0, 0.525); m.mat(MAT.PLANKS, COL.wood); m.box(-0.75, 0.62, -1.2, 0.75, 0.70, 1.2);
  for (const sx of [-1, 1]) m.box(sx * 0.75 - 0.03, 0.70, -1.2, sx * 0.75 + 0.03, 1.08, 1.2);
  m.box(-0.75, 0.70, 1.17, 0.75, 1.08, 1.23); m.box(-0.75, 0.70, -1.23, 0.75, 0.95, -1.17);
  m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.9, 0.52, -0.05, 0.9, 0.62, 0.05);
  for (const sx of [-1, 1]) { m.beam([sx * 0.45, 0.6, -1.2], [sx * 0.42, 0.05, -2.3], 0.07, 0.07); at(m, sx * 0.92, 0.57, 0, PI / 2, () => Props.wheel(m, 0.57, 0.09)); }
  addBoxCollider(m, -1.0, -2.4, 1.0, 1.25, 0, 1.1); m.pop();
};
const HPR = {
  oven: [2.0, 1.5, 2.2, (P, rm) => TP.oven(P, rm, true)], kiln: [2.0, 1.5, 2.2, (P, rm) => TP.oven(P, rm, false)],
  vat: [1.3, 1.3, 0.75, (P, rm, R, o) => TP.vat((o && o.col) || [0.3, 0.38, 0.5])], tun: [1.8, 1.8, 1.1, () => TP.tun],
  hides: [1.6, 0.4, 1.8, (P, rm, R) => TP.hideRack(R)], wheel: [0.9, 1.0, 0.9, () => TP.potterWheel], saddle: [1.1, 0.7, 1.0, () => TP.saddle], stones: [1.7, 0.6, 0.65, (P, rm, R) => TP.stones(R)],
  planks: [1.8, 0.6, 0.45, (P, rm, R) => TP.planks(R)], horse: [1.2, 0.6, 0.85, () => TP.sawhorse], wheels: [2.0, 0.7, 1.15, () => TP.leanWheels], baskets: [1.6, 0.8, 0.6, (P, rm, R) => TP.baskets(R)],
  willow: [0.6, 0.6, 1.4, () => TP.willow], staves: [1.0, 0.5, 1.55, (P, rm, R) => TP.staves(R)], hoops: [1.1, 0.2, 1.3, () => TP.hoopRack], fleeces: [1.6, 0.8, 0.6, (P, rm, R) => TP.fleeces(R)],
  hurdle: [1.8, 0.3, 1.0, () => TP.hurdle], block: [0.7, 0.7, 0.9, () => TP.block], dip: [1.6, 1.2, 1.5, () => TP.dipRack], lasts: [1.6, 0.8, 0.85, (P, rm, R) => TP.lasts(R)],
  brazier: [0.7, 0.7, 0.85, () => TP.brazier], ropes: [1.5, 0.9, 0.4, (P, rm, R) => TP.ropeCoils(R)], lectern: [0.6, 0.6, 1.2, () => TP.lectern], clay: [1.0, 0.7, 0.55, () => TP.clayBin],
  strongbox: [1.0, 0.6, 0.65, () => TP.strongbox], anvil: [0.8, 0.5, 0.9, () => TP.anvilSmall], still: [1.5, 0.9, 1.4, () => PD.still],
  bench: [2.1, 1.1, 1.0, () => m => kp(m, 'Workbench', 0, 0, 0, 0.95, 0)], spinning: [0.6, 1.1, 1.05, () => m => kp(m, 'spinning_wheel_01', 0, 0, 0, 1, 0)], dummy: [0.8, 0.7, 1.9, () => m => kp(m, 'Dummy', 0, 0, 0, 0.95, 0)],
  cask: [1.0, 0.95, 0.95, () => PD.cask(0.9, 0.34)], sacks: [0.9, 0.6, 0.6, (P, rm, R) => PD.sacks(R)], stack: [0.9, 0.5, 0.75, (P, rm, R) => PD.stack(R)], crates: [1.5, 0.8, 1.15, (P, rm, R) => PD.cratePile(R)],
  barrel: [0.7, 0.7, 0.9, () => pdBarrel(0.33, 0.9)], bucket: [0.5, 0.5, 0.5, () => m => kp(m, 'Bucket_Wooden_1', 0, 0, 0, 1, 0)], cart: [2.05, 3.7, 1.15, () => TP.cart],
  appleCrate: [0.8, 0.5, 0.5, () => m => kp(m, 'FarmCrate_Apple', 0, 0, 0, 1, 0)], applesBrl: [0.7, 0.7, 0.9, () => m => kp(m, 'Barrel_Apples', 0, 0, 0, 1, 0)],
};
// ───────── one memorable object per house [c5]: floor pieces (HPR) and wall pieces (HMEMO.wall) ─────────
const MWOOD = [0.36, 0.26, 0.17];
TP.cradle = m => { m.mat(MAT.PLANKS, [0.42, 0.3, 0.2]); m.box(-0.4, 0.1, -0.22, 0.4, 0.14, 0.22); for (const sx of [-1, 1]) { m.box(sx * 0.4 - 0.02, 0.14, -0.22, sx * 0.4 + 0.02, 0.5, 0.22); m.box(sx * 0.4 - 0.03, 0.0, -0.3, sx * 0.4 + 0.03, 0.06, 0.3); } m.box(-0.4, 0.14, -0.24, 0.4, 0.4, -0.2); m.box(-0.4, 0.14, 0.2, 0.4, 0.3, 0.24); m.mat(MAT.CLOTH, [0.72, 0.68, 0.58], 0.5); m.box(-0.36, 0.14, -0.19, 0.36, 0.24, 0.19); m.mat(MAT.CLOTH, [0.45, 0.4, 0.34], 0.5); m.ball(-0.2, 0.26, 0, 0.12, 0.07, 0.1, 6, 4); addBoxCollider(m, -0.45, -0.3, 0.45, 0.3, 0, 0.5); };
TP.shipModel = m => { m.mat(MAT.PLANKS, COL.woodDark); for (const [x, z] of [[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]]) m.box(x - 0.03, 0, z - 0.03, x + 0.03, 0.78, z + 0.03); m.box(-0.55, 0.78, -0.3, 0.55, 0.82, 0.3); kp(m, 'ship_pinnace', 0, 0.82, 0, 0.027, PI / 2); addBoxCollider(m, -0.55, -0.3, 0.55, 0.3, 0, 0.85); };      // [c5] the scanned pinnace on a trestle
TP.paintedChest = m => { m.mat(MAT.PLANKS, [0.3, 0.38, 0.4]); m.box(-0.5, 0.0, -0.27, 0.5, 0.45, 0.27); m.ball(0, 0.45, 0, 0.5, 0.14, 0.27, 8, 3); m.mat(MAT.CLOTH, [0.5, 0.22, 0.17], 0.5); for (const x of [-0.38, 0.38]) m.box(x - 0.04, 0.0, -0.28, x + 0.04, 0.5, 0.28); m.mat(MAT.CLOTH, [0.68, 0.58, 0.32], 0.5); m.box(-0.2, 0.14, 0.268, 0.2, 0.32, 0.275); m.mat(MAT.METAL, COL.iron); m.box(-0.03, 0.3, 0.27, 0.03, 0.38, 0.285); addBoxCollider(m, -0.5, -0.28, 0.5, 0.28, 0, 0.55); };
TP.harp = m => { m.mat(MAT.PLANKS, [0.4, 0.28, 0.17]); m.box(-0.22, 0, -0.18, 0.22, 0.04, 0.18); m.tube([[-0.1, 0.04, 0], [-0.12, 0.6, 0], [-0.04, 1.1, 0], [0.12, 1.25, 0]], [0.03, 0.025, 0.025, 0.02], 5); m.box(0.12, 0.2, -0.015, 0.16, 1.22, 0.015); m.mat(MAT.CLOTH, [0.78, 0.74, 0.6], 0.3); for (let i = 0; i < 9; i++) { const t = i / 8; m.box(-0.095 + t * 0.2 - 0.002, 0.2 + t * 0.0, -0.002, -0.095 + t * 0.2 + 0.002, 0.62 + t * 0.58, 0.002); } addBoxCollider(m, -0.25, -0.2, 0.25, 0.2, 0, 1.3); };
TP.birdcage = m => { m.mat(MAT.METAL, COL.iron); m.cyl(0, 0, 0, 0.12, 0.12, 0.04, 8, 2); m.cyl(0, 0, 0, 0.015, 0.015, 1.3, 5, 1); m.box(-0.2, 1.28, -0.012, 0.2, 1.3, 0.012); at(m, 0, 1.34, 0, 0, () => { m.mat(MAT.METAL, [0.3, 0.26, 0.2]); m.cyl(0, 0, 0, 0.2, 0.2, 0.025, 10, 2); m.cyl(0, 0.3, 0, 0.2, 0.2, 0.025, 10, 2); m.lathe([[0.2, 0.3], [0.1, 0.38], [0.01, 0.46]], 10, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; m.cyl(Math.cos(a) * 0.19, 0.02, Math.sin(a) * 0.19, 0.006, 0.006, 0.29, 4, 1); } m.mat(MAT.CLOTH, [0.6, 0.5, 0.2], 0.4); m.ball(0, 0.1, 0, 0.05, 0.04, 0.035, 6, 4); m.mat(MAT.CLOTH, [0.45, 0.42, 0.3], 0.4); m.ball(0.06, 0.22, 0.02, 0.04, 0.035, 0.03, 6, 4); }); addCircleCollider(m, 0, 0, 0.2, 0, 1.0); };
TP.longClock = m => { m.mat(MAT.PLANKS, [0.3, 0.2, 0.13]); m.box(-0.22, 0, -0.16, 0.22, 0.28, 0.16); m.box(-0.16, 0.28, -0.12, 0.16, 1.45, 0.12); m.box(-0.22, 1.45, -0.16, 0.22, 1.9, 0.16); m.ball(0, 1.9, 0, 0.22, 0.12, 0.16, 8, 3); m.mat(MAT.PLAIN, [0.8, 0.76, 0.64]); m.disc(0, 1.67, 0.162, 0.15, 12, 2); m.mat(MAT.METAL, COL.black); m.box(-0.006, 1.67, 0.165, 0.006, 1.78, 0.168); m.box(0.0, 1.664, 0.165, 0.08, 1.676, 0.168); m.mat(MAT.METAL, [0.55, 0.45, 0.2]); m.cyl(0, 0.5, 0.1, 0.045, 0.045, 0.02, 8, 2); m.box(-0.004, 0.52, 0.11, 0.004, 1.3, 0.114); addBoxCollider(m, -0.24, -0.18, 0.24, 0.18, 0, 1.95); };
TP.loomFrame = m => { m.mat(MAT.TIMBER, COL.wood); for (const sx of [-1, 1]) { m.box(sx * 0.6 - 0.04, 0, -0.35, sx * 0.6 + 0.04, 1.6, -0.27); m.box(sx * 0.6 - 0.04, 0, 0.27, sx * 0.6 + 0.04, 1.6, 0.35); m.box(sx * 0.6 - 0.03, 0.5, -0.35, sx * 0.6 + 0.03, 0.56, 0.35); } m.box(-0.62, 1.5, -0.35, 0.62, 1.58, -0.27); m.box(-0.62, 0.3, 0.27, 0.62, 0.36, 0.35); m.mat(MAT.CLOTH, [0.7, 0.66, 0.55], 0.3); for (let i = 0; i < 20; i++) { const x = -0.5 + i * 0.055; m.box(x - 0.002, 0.4, -0.31, x + 0.002, 1.5, -0.3); } m.mat(MAT.CLOTH, [0.36, 0.3, 0.4], 0.5); m.box(-0.52, 0.4, -0.305, 0.52, 0.8, -0.295); addBoxCollider(m, -0.65, -0.37, 0.65, 0.37, 0, 1.6); };
TP.mirrorStand = m => { m.mat(MAT.PLANKS, [0.34, 0.24, 0.16]); m.box(-0.3, 0, -0.1, 0.3, 0.05, 0.1); m.box(-0.28, 0.05, -0.02, -0.24, 1.6, 0.02); m.box(0.24, 0.05, -0.02, 0.28, 1.6, 0.02); m.box(-0.28, 1.56, -0.02, 0.28, 1.6, 0.02); m.mat(MAT.METAL, [0.5, 0.54, 0.55]); m.box(-0.24, 0.3, -0.004, 0.24, 1.56, 0.004); addBoxCollider(m, -0.32, -0.12, 0.32, 0.12, 0, 1.6); };

TP.anchor = m => { m.mat(MAT.METAL, [0.22, 0.2, 0.19]); m.box(-0.04, 0, -0.04, 0.04, 1.5, 0.04); m.box(-0.3, 1.3, -0.03, 0.3, 1.38, 0.03); m.tube([[-0.5, 0.35, 0], [-0.4, 0.08, 0], [0, 0.02, 0], [0.4, 0.08, 0], [0.5, 0.35, 0]], [0.03, 0.04, 0.04, 0.04, 0.03], 6); m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.45, 0, -0.2, 0.45, 0.06, 0.2); addBoxCollider(m, -0.5, -0.22, 0.5, 0.22, 0, 1.5); };
TP.skeps = m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.7, 0.55, -0.22, 0.7, 0.6, 0.22); for (const x of [-0.65, 0.65]) m.box(x - 0.03, 0, -0.18, x + 0.03, 0.55, 0.18); for (const x of [-0.42, 0, 0.42]) { m.mat(MAT.THATCH, [0.72, 0.6, 0.36], 0.4); at(m, x, 0, 0, 0, () => m.lathe([[0.2, 0.6], [0.2, 0.7], [0.15, 0.84], [0.07, 0.92], [0.01, 0.95]], 9, 0)); } addBoxCollider(m, -0.72, -0.24, 0.72, 0.24, 0, 0.62); };
TP.cheesePress = m => { m.mat(MAT.TIMBER, COL.wood); for (const sx of [-1, 1]) m.box(sx * 0.3 - 0.05, 0, -0.1, sx * 0.3 + 0.05, 1.2, 0.1); m.box(-0.35, 1.1, -0.1, 0.35, 1.2, 0.1); m.cyl(0, 0.5, 0, 0.03, 0.03, 0.75, 5, 2); m.box(-0.3, 1.25, -0.03, 0.3, 1.3, 0.03); m.mat(MAT.PLANKS, COL.woodDark); m.cyl(0, 0, 0, 0.25, 0.25, 0.3, 10, 2); m.mat(MAT.CLOTH, [0.78, 0.72, 0.52], 0.4); m.cyl(0, 0.3, 0, 0.21, 0.21, 0.12, 10, 2); addBoxCollider(m, -0.38, -0.25, 0.38, 0.25, 0, 1.3); };
TP.scales = m => { m.mat(MAT.METAL, [0.3, 0.26, 0.2]); m.box(-0.03, 0, -0.03, 0.03, 1.25, 0.03); m.box(-0.25, 0, -0.25, 0.25, 0.04, 0.25); m.box(-0.5, 1.22, -0.015, 0.5, 1.26, 0.015); for (const sx of [-1, 1]) { m.box(sx * 0.48 - 0.004, 0.72, -0.004, sx * 0.48 + 0.004, 1.22, 0.004); m.disc(sx * 0.48, 0.72, 0, 0.14, 10, 2); } addBoxCollider(m, -0.3, -0.3, 0.3, 0.3, 0, 1.3); };

TP.bustPlinth = m => { m.mat(MAT.STONE, [0.7, 0.68, 0.64]); m.box(-0.22, 0, -0.22, 0.22, 0.9, 0.22); m.box(-0.27, 0.9, -0.27, 0.27, 0.95, 0.27); kp(m, 'marble_bust_01', 0, 0.95, 0, 1.3, 0); addBoxCollider(m, -0.28, -0.28, 0.28, 0.28, 0, 1.65); };
TP.chessTable = m => { kp(m, 'round_wooden_table_01', 0, 0, 0, 0.7, 0); kp(m, 'chess_set', 0, 0.7, 0, 1.3, 0); kp(m, 'folding_wooden_stool', 0, 0, 0.62, 0.8, PI); kp(m, 'folding_wooden_stool', 0, 0, -0.62, 0.8, 0); addBoxCollider(m, -0.5, -0.85, 0.5, 0.85, 0, 0.75); };
TP.rocker = m => { kp(m, 'rockingchair_01', 0, 0, 0, 1.0, 0); addBoxCollider(m, -0.36, -0.42, 0.36, 0.42, 0, 0.9); };
TP.mantelCase = m => { kp(m, 'classicnightstand_01', 0, 0, 0, 1.2, 0); kp(m, 'mantel_clock_01', 0, 0.84, 0, 1.6, 0); addBoxCollider(m, -0.35, -0.27, 0.35, 0.27, 0, 1.0); };
TP.cabinetBig = m => { kp(m, 'gothiccabinet_01', 0, 0, 0, 0.75, 0); kp(m, 'carved_wooden_elephant', 0.3, 1.77, 0, 3.0, 0.4); addBoxCollider(m, -0.65, -0.43, 0.65, 0.43, 0, 1.8); };
TP.compassTable = m => { kp(m, 'round_wooden_table_01', 0, 0, 0, 0.5, 0); kp(m, 'seadogs_compass', 0, 0.5, 0, 2.2, 0.6); kp(m, 'brass_pan_01', -0.15, 0.5, 0.1, 0.9, 1.0); addBoxCollider(m, -0.35, -0.35, 0.35, 0.35, 0, 0.75); };
Object.assign(HPR, {
  m_bust: [0.6, 0.6, 1.7, () => TP.bustPlinth], m_chess: [1.1, 1.8, 0.8, () => TP.chessTable], m_rocker: [0.8, 0.9, 0.95, () => TP.rocker], m_mantel: [0.7, 0.55, 1.0, () => TP.mantelCase], m_bigcab: [1.4, 0.9, 1.8, () => TP.cabinetBig], m_compass: [0.8, 0.8, 0.8, () => TP.compassTable],
  m_anchor: [1.0, 0.45, 1.5, () => TP.anchor], m_skeps: [1.5, 0.5, 0.95, () => TP.skeps], m_press: [0.8, 0.55, 1.3, () => TP.cheesePress], m_scales: [0.6, 0.6, 1.3, () => TP.scales],
  m_cradle: [0.9, 0.6, 0.55, () => TP.cradle], m_ship: [0.9, 0.6, 1.3, () => TP.shipModel], m_chest: [1.0, 0.56, 0.6, () => TP.paintedChest], m_harp: [0.5, 0.4, 1.3, () => TP.harp],
  m_cage: [0.5, 0.5, 1.8, () => TP.birdcage], m_clock: [0.5, 0.36, 1.95, () => TP.longClock], m_loom: [1.3, 0.76, 1.6, () => TP.loomFrame], m_mirror: [0.62, 0.3, 1.6, () => TP.mirrorStand],
});
const HMEMO = {
  floor: ['m_bust', 'm_chess', 'm_rocker', 'm_mantel', 'm_bigcab', 'm_compass', 'm_anchor', 'm_skeps', 'm_press', 'm_scales', 'm_cradle', 'm_ship', 'm_chest', 'm_harp', 'm_cage', 'm_clock', 'm_loom', 'm_mirror'],
  wall: [
    { id: 'bullhead', w: 0.9, y0: 1.3, y1: 2.0, fn: R => (m, hh) => { m.mat(MAT.PLANKS, [0.34, 0.24, 0.16]); m.box(-0.28, -0.7, -0.03, 0.28, 0, 0); kp(m, 'bull_head', 0, -0.62, -0.03, 1.4, PI); } },
    { id: 'horsehead', w: 0.9, y0: 1.3, y1: 2.0, fn: R => (m, hh) => { m.mat(MAT.PLANKS, [0.34, 0.24, 0.16]); m.box(-0.28, -0.7, -0.03, 0.28, 0, 0); kp(m, 'horse_head', 0, -0.62, -0.03, 1.5, PI); } },
    { id: 'mirror', w: 0.8, y0: 1.2, y1: 2.0, fn: R => (m, hh) => { kp(m, 'ornate_mirror_01', 0, -0.8, -0.015, 1.05, PI); } },
    { id: 'pike', w: 1.5, y0: 1.2, y1: 1.9, fn: R => (m, hh) => { m.mat(MAT.PLANKS, [0.34, 0.24, 0.16]); m.box(-0.75, -0.7, -0.03, 0.75, 0, 0); m.mat(MAT.THATCH, [0.5, 0.52, 0.5], 0.4); m.ball(0, -0.35, -0.08, 0.62, 0.11, 0.05, 10, 6); m.mat(MAT.THATCH, [0.34, 0.36, 0.34], 0.4); m.ball(0.0, -0.27, -0.1, 0.55, 0.04, 0.03, 8, 4); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.ball(0.55, -0.33, -0.13, 0.025, 0.025, 0.02, 4, 3); m.mat(MAT.THATCH, [0.42, 0.4, 0.34], 0.4); m.box(-0.75, -0.42, -0.1, -0.58, -0.28, -0.07); } },
    { id: 'clocks', w: 1.8, y0: 0.9, y1: 2.1, fn: R => (m, hh) => { m.mat(MAT.PLANKS, [0.3, 0.22, 0.15]); m.box(-0.9, -1.2, -0.03, 0.9, 0, 0); for (const [x, y, r] of [[-0.5, -0.35, 0.22], [0.05, -0.28, 0.17], [0.55, -0.4, 0.25], [-0.3, -0.85, 0.16], [0.25, -0.88, 0.2], [0.7, -0.95, 0.12]]) { m.mat(MAT.METAL, [0.5, 0.42, 0.22]); m.disc(x, y, -0.04, r, 12, 2); m.mat(MAT.PLAIN, [0.78, 0.74, 0.62]); m.disc(x, y, -0.045, r * 0.85, 12, 2); m.mat(MAT.METAL, COL.black); m.box(x - 0.004, y, -0.05, x + 0.004, y + r * 0.7, -0.052); m.box(x, y - 0.004, -0.05, x + r * 0.5, y + 0.004, -0.052); } } },
    { id: 'antlers', w: 1.2, y0: 1.5, y1: 2.1, fn: R => (m, hh) => { m.mat(MAT.PLANKS, [0.34, 0.24, 0.16]); m.box(-0.2, -0.5, -0.03, 0.2, 0, 0); m.mat(MAT.THATCH, [0.7, 0.64, 0.5], 0.4); for (const sx of [-1, 1]) { m.tube([[sx * 0.08, -0.15, -0.06], [sx * 0.3, -0.12, -0.14], [sx * 0.46, -0.02, -0.2], [sx * 0.55, 0.2, -0.24]], [0.03, 0.025, 0.02, 0.01], 5); m.tube([[sx * 0.3, -0.12, -0.14], [sx * 0.36, 0.1, -0.2], [sx * 0.34, 0.3, -0.22]], [0.02, 0.012, 0.006], 4); } } },
  ],
};
const HMEMO_USED = {};
// ───────── everyday furniture variety [c5]: every house gets a different mix of scanned tables, cabinets, seats and small things ─────────
const vk = (m, n, x, y, z, sc, ry) => kp(m, n, x, y, z, sc, ry || 0);
TP.vRound = m => { vk(m, 'round_wooden_table_01', 0, 0, 0, 0.78); vk(m, 'wooden_bowl_01', 0.1, 0.78, 0.05, 0.9); vk(m, 'brass_goblets', -0.2, 0.78, -0.12, 0.7, 0.5); vk(m, 'folding_wooden_stool', 0, 0, 0.72, 0.8, PI); vk(m, 'folding_wooden_stool', 0.05, 0, -0.72, 0.8, 0.3); addBoxCollider(m, -0.55, -0.55, 0.55, 0.55, 0, 0.8); };
TP.vPTable = m => { vk(m, 'painted_wooden_table', 0, 0, 0, 0.8); vk(m, 'carved_wooden_plate', -0.4, 0.77, 0.1, 1.0); vk(m, 'wooden_candlestick', 0.5, 0.77, -0.1, 1.0); vk(m, 'painted_wooden_stool', -0.5, 0, 0.7, 0.8, 0.4); vk(m, 'painted_wooden_stool', 0.45, 0, -0.7, 0.8, 2.6); addBoxCollider(m, -0.97, -0.46, 0.97, 0.46, 0, 0.8); };
TP.vTrestle = m => { vk(m, 'woodentable_01', 0, 0, 0, 1.2); vk(m, 'food_pears_asian_01', -0.5, 0.66, 0, 1.6); vk(m, 'wicker_basket_02', 0.4, 0.66, 0.05, 1.1); vk(m, 'painted_wooden_chair_01', 1.35, 0, 0, 0.85, -PI / 2); addBoxCollider(m, -1.1, -0.4, 1.1, 0.4, 0, 0.7); };
TP.vSmall = m => { vk(m, 'wooden_table_02', 0, 0, 0, 1.0); vk(m, 'wooden_candlestick', 0.2, 0.8, 0, 1.0); vk(m, 'ceramic_vase_04', -0.25, 0.8, 0.05, 1.0); vk(m, 'painted_wooden_chair_01', 0, 0, 0.62, 0.85, PI); addBoxCollider(m, -0.58, -0.38, 0.58, 0.38, 0, 0.82); };
TP.vPCab = m => { vk(m, 'painted_wooden_cabinet', 0, 0, 0, 0.95); vk(m, 'ceramic_vase_02', -0.3, 1.12, 0, 1.0); vk(m, 'wooden_bowl_01', 0.25, 1.12, 0, 0.9); addBoxCollider(m, -0.58, -0.3, 0.58, 0.3, 0, 1.15); };
TP.vGCab = m => { vk(m, 'gothiccabinet_01', 0, 0, 0, 0.72); addBoxCollider(m, -0.62, -0.42, 0.62, 0.42, 0, 1.7); };
TP.vShelf = m => { vk(m, 'painted_wooden_shelves', -0.3, 0, 0, 1.25); vk(m, 'painted_wooden_shelves', 0.35, 0, 0, 1.25, 0); vk(m, 'ceramic_pot', -0.3, 1.4, 0, 0.5); vk(m, 'wooden_lantern_01', 0.35, 1.4, 0, 0.8); addBoxCollider(m, -0.65, -0.25, 0.65, 0.25, 0, 1.45); };
TP.vBooks = m => { vk(m, 'wooden_bookshelf_worn', 0, 0, 0, 1.0); addBoxCollider(m, -0.7, -0.3, 0.7, 0.3, 0, 2.05); };
TP.vNight = m => { vk(m, 'classicnightstand_01', 0, 0, 0, 1.0); vk(m, 'wooden_candlestick', 0.0, 0.7, 0, 1.0); addBoxCollider(m, -0.3, -0.23, 0.3, 0.23, 0, 0.72); };
TP.vBaskets = m => { vk(m, 'wicker_basket_02', -0.2, 0, 0, 1.4); vk(m, 'wicker_basket_02', 0.25, 0, 0.1, 1.2, 1.0); vk(m, 'yellow_onion', -0.2, 0.28, 0, 2.0); vk(m, 'wooden_bucket_02', 0, 0, -0.45, 0.8); addBoxCollider(m, -0.45, -0.7, 0.45, 0.3, 0, 0.45); };
TP.vVases = m => { vk(m, 'painted_wooden_stool', 0, 0, 0, 1.0); vk(m, 'ceramic_vase_04', -0.05, 0.58, 0, 1.4); vk(m, 'ceramic_vase_02', 0.08, 0.58, 0.04, 1.2); addBoxCollider(m, -0.22, -0.22, 0.22, 0.22, 0, 0.6); };
TP.vPots = m => { vk(m, 'folding_wooden_stool', 0, 0, 0, 1.0); vk(m, 'ceramic_pot', 0, 0.44, 0, 0.6); vk(m, 'brass_pan_01', 0.45, 0, 0.1, 1.2, 0.4); addBoxCollider(m, -0.28, -0.28, 0.28, 0.28, 0, 0.5); };
TP.vChairs = m => { vk(m, 'painted_wooden_chair_01', -0.3, 0, 0, 0.9, PI); vk(m, 'painted_wooden_chair_01', 0.3, 0, 0, 0.9, PI + 0.3); addBoxCollider(m, -0.55, -0.3, 0.55, 0.3, 0, 0.9); };
Object.assign(HPR, {
  v_round: [1.5, 1.7, 0.8, () => TP.vRound], v_ptable: [2.0, 1.7, 0.8, () => TP.vPTable], v_trestle: [2.6, 1.0, 0.7, () => TP.vTrestle], v_small: [1.2, 1.3, 0.82, () => TP.vSmall],
  v_pcab: [1.2, 0.6, 1.2, () => TP.vPCab], v_gcab: [1.3, 0.85, 1.75, () => TP.vGCab], v_shelf: [1.4, 0.5, 1.5, () => TP.vShelf], v_books: [1.45, 0.65, 2.1, () => TP.vBooks],
  v_night: [0.6, 0.5, 0.75, () => TP.vNight], v_baskets: [1.0, 1.0, 0.5, () => TP.vBaskets], v_vases: [0.5, 0.5, 0.65, () => TP.vVases], v_pots: [1.1, 0.6, 0.5, () => TP.vPots], v_chairs: [1.2, 0.6, 0.95, () => TP.vChairs],
});
const HV = {
  table: ['v_round', 'v_ptable', 'v_trestle', 'v_small', 'v_round', 'v_trestle'],
  store: ['v_pcab', 'v_gcab', 'v_shelf', 'v_pcab', 'v_books', 'v_gcab'],
  small: ['m_rocker', 'v_baskets', 'v_vases', 'v_pots', 'v_chairs', 'v_vases', 'v_baskets', 'v_pots'],
};
function hVariety(P, F) {
  const rooms = Object.values(P.rooms), main = (P.hall && P.hall.room) || rooms.find(r => r.kind === 'hall') || rooms[0], hv = (k, n) => (hHash(P.id + '|v' + k) * n) | 0;
  const rich = F.wealth > 0 || ['scribe', 'merchant', 'bookseller', 'elder'].includes(F.trade), pick = (pool, k) => { let n = pool[hv(k, pool.length)]; if (n === 'v_books' && !rich) n = 'v_gcab'; return n; };
  const side = (k) => ['w', 'e', 'n', 's'].sort((a, b) => hHash(P.id + a + k) - hHash(P.id + b + k));
  const t = pick(HV.table, 't'), s = pick(HV.store, 's'), x = pick(HV.small, 'x');
  const got = [];
  const cand = [main].concat(rooms.filter(r => r !== main && r.k === 0 && (r.kind === 'hall' || r.kind === 'study') && r.id !== 'corridor' && r.kind !== 'yard')).filter(Boolean);
  const put = (n, k, free) => { for (const r of cand) if (hPlace(P, r, n, { sides: side(k), free })) { got.push(n); return true; } return false; };
  if (hHash(P.id + '|vt') < 0.6) put(t, 't', true);
  put(s, 's', true); put(x, 'x', true);
  for (const r of rooms) if (r.kind === 'bedroom' && r.k === 0 || r.kind === 'bedroom') { const b = P.firstBed && P.firstBed.room === r ? P.firstBed : null; if (b && hHash(P.id + r.id + 'n') < 0.7 && hPlace(P, r, 'v_night', { sides: ['w', 'e', 'n', 's'], near: [b.cx, b.cz], free: true })) got.push('v_night'); break; }
  P.variety = got;
}

function hMemo(P, F) {          // one object no other house has, in the first room if it will go there (the next in the list when it will not)
  const e = P.doors.find(d => d.b === null); if (!e) return; const room = P.rooms[e.a]; if (!room) return;
  const all = HMEMO.floor.length + HMEMO.wall.length;
  for (let t = 0; t < all; t++) {
    const k = (F.memo + t * 3) % all; if (HMEMO_USED[k] && t < all - 1) continue;
    if (k >= HMEMO.floor.length) { const w = HMEMO.wall[k - HMEMO.floor.length]; for (const sd of ['s', 'w', 'e', 'n']) { const [a, b] = hWallRange(room, sd); for (let u = (a + b) / 2, i = 0; i < 12; i++, u = (a + b) / 2 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.7) if (u > a + w.w / 2 && u < b - w.w / 2 && pHang(P, room, sd, u, w.w, w.y0, w.y1, w.fn(P.R), P.id + '.memo_' + w.id, { pivot: w.y1 })) { P.memo = w.id; HMEMO_USED[k] = 1; return; } }
    } else if (hPlace(P, room, HMEMO.floor[k], { sides: ['s', 'w', 'e', 'n'], free: true })) { P.memo = HMEMO.floor[k]; HMEMO_USED[k] = 1; return; }
  }
}
// put a floor prop by name against one of the room's walls (sides in order of preference), at a coordinate along the wall, back to the wall; falls back to open floor near `near`
function hPlace(P, room, name, o) {
  o = o || {}; const e = HPR[name]; if (!e) return null; const R = P.R, draw = e[3](P, room, R, o), h = e[2], id = P.id + '.' + name + (P.items.length);
  const opt = Object.assign({ lowOk: h <= 0.85, noClear: false }, o.opt || {});
  for (const sd of o.sides || ['s', 'w', 'e', 'n']) {
    const ats = o.at !== undefined ? [].concat(o.at) : [undefined];
    for (const at_ of ats) { const r = pAgainst(P, room, sd, id, e[0], e[1], h, -1, draw, Object.assign({}, opt, at_ === undefined ? {} : { at: at_ })); if (r) return r; }
  }
  if (o.free !== false && !(h >= 1.5 && /^v_/.test(name))) return pFree(P, room, id, e[0], e[1], h, o.rot || 0, draw, Object.assign({ near: o.near }, opt));      /* [fin] a tall cabinet or bookcase never stands alone in the middle of a room with its back to the hearth */
  return null;
}
// a hanging bar of drying things over the room's open floor (not over the hearth or a stairwell)
function hCeil(P, room, x, z, draw, rot) { return pCeil(P, room, x, z, draw, rot); }
// wall boards: a run of a given ware pool on shelves floor to ceiling along a side
function hShelves(P, room, side, u0, u1, pool, id, lv) { return pShelfRun(P, room, side, u0, u1, null, { id: id || 'w', lv: lv || 4, mixed: pool }); }
const hWallRange = (room, side) => (side === 'n' || side === 's') ? [room.in.x0 + 0.1, room.in.x1 - 0.1] : [room.in.z0 + 0.1, room.in.z1 - 0.1];
// shelves along both side walls and the far wall wherever the walls are free
function hShelfWalls(P, room, pool, o) {
  o = o || {}; let n = 0;
  for (const sd of o.sides || ['w', 'e', 's']) { const [a, b] = hWallRange(room, sd); n += pShelfRun(P, room, sd, a, b, null, { id: o.id || 'ws', lv: o.lv || 4, mixed: pool }); }
  return n;
}
const pAnyHang = (P, room, kinds, o) => { let n = 0; for (const sd of ['n', 'w', 'e', 's']) { const [a, b] = hWallRange(room, sd); for (let u = a + 0.8; u < b - 0.6 && n < (o && o.max || 6); u += 1.7) { const k = kinds[n % kinds.length]; const ok = k.fn ? pHang(P, room, sd, u, k.w, k.y0, k.y1, k.fn, P.id + '.' + k.id + n, { pivot: k.pivot }) : null; if (ok) { n++; u += k.w; } } } return n; };

// ───────── trade recipes: (P, c, room, F) ─────────
// focal first; every recipe records P.focal (the piece the room is about) so the tests and screenshots can check it faces the door
const HT = {};
const cnt = (P, room, F, len, kinds, nm) => {
  const R = P.R, c = P.c, near = F.counterAt || [-0.6 * F.sx, room.z0 + (room.z1 - room.z0) * 0.62];
  const t = pFree(P, room, P.id + '.counter', len, 0.8, 1.0, 0, pdCounter(len, c, kinds, 8), { near, surface: true, noClear: false, lowOk: false, keeper: 0.85 });
  if (t) { pSpot(P, 'counter', t.cx + 0.4, t.cz + 0.85, PI, { k: room.k }); pSpot(P, 'front', t.cx + 0.4, t.cz - 0.85, 0, { k: room.k }); P.counter = t; } return t;
};
const hFocalAt = (P, room, name, F, o) => { const r = hPlace(P, room, name, Object.assign({ sides: ['s'], at: [F.fx === undefined ? 0 : F.fx, -F.sx * 2.2, F.sx * 2.2, -F.sx * 3.2] }, o || {})); if (r && !P.focal) P.focal = { name, x: r.cx, z: r.cz }; return r; };
const hFlourWalls = (P, room, F, pool) => hShelfWalls(P, room, pool || PD.WARES.store, { id: 'ws' });
HT.baker = (P, c, room, F) => {
  hFocalAt(P, room, 'oven', F); cnt(P, room, F, 3.6, ['loaf', 'loaf', 'loaf', 'bowl', 'cheese', 'plate'], 'baker');
  hShelfWalls(P, room, PD.WARES.bread, { sides: ['w', 'e'] }); hPlace(P, room, 'sacks', { sides: ['s', 'w'], at: [-F.sx * 3.2] }); hPlace(P, room, 'sacks', { sides: ['e', 'w'] }); hPlace(P, room, 'stack', { sides: ['e', 'w', 's'] });
  hPlace(P, room, 'barrel', { sides: ['w', 'e'] });
};
HT.apothecary = (P, c, room, F) => {
  hFocalAt(P, room, 'still', F); hShelfWalls(P, room, PD.WARES.drugs, { id: 'wd', lv: 5 }); cnt(P, room, F, 3.2, ['bottle', 'jug', 'bowl', 'candle'], 'apo');
  PD.rack(P, room, -F.sx * 1.4, room.z0 + 2.0, 1.8, 0, ['herb', 'herb', 'garlic']); PD.rack(P, room, F.sx * 1.4, room.z0 + 2.4, 1.6, 0, ['herb', 'garlic', 'herb']); hPlace(P, room, 'sacks', { sides: ['w', 'e'] });
};
HT.cutler = (P, c, room, F) => {
  hFocalAt(P, room, 'anvil', F, { at: [F.sx * 1.2, -F.sx * 1.4] }); cnt(P, room, F, 3.2, ['jug', 'bowl', 'plate'], 'cutler');
  const R = P.R; pHang(P, room, 's', -F.sx * 2.6, 1.6, 1.0, 2.0, PD.bladeWall(R, 1.6), P.id + '.blades', { pivot: 2.0 }); pHang(P, room, 's', F.sx * 2.6, 1.8, 1.0, 2.1, PD.toolRack(R, 1.8, ['shears', 'knife', 'file', 'hammer', 'saw', 'shears']), P.id + '.tools', { pivot: 2.05 });
  hShelfWalls(P, room, PD.WARES.cutlery, { sides: ['w', 'e'], id: 'wc' }); hPlace(P, room, 'bench', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
HT.grocer = (P, c, room, F) => {
  cnt(P, room, F, 3.8, ['cheese', 'apple', 'cabbage', 'loaf', 'bowl', 'jug'], 'grocer'); hShelfWalls(P, room, PD.WARES.larder, { id: 'wl', lv: 4 });
  hPlace(P, room, 'applesBrl', { sides: ['s', 'w'], at: [-F.sx * 2.4] }); hPlace(P, room, 'appleCrate', { sides: ['s', 'e'], at: [F.sx * 2.6] }); hPlace(P, room, 'sacks', { sides: ['s', 'e', 'w'] }); hPlace(P, room, 'sacks', { sides: ['w', 'e'] });
  hPlace(P, room, 'crates', { sides: ['e', 'w'] }); PD.rack(P, room, 0, room.z0 + 3.0, 2.2, 0, ['ham', 'herb', 'garlic', 'ham']); PD.rack(P, room, F.sx * 2.2, room.z0 + 2.2, 1.6, 0, ['garlic', 'herb', 'ham']);
  P.focal = P.focal || (P.counter ? { name: 'counter', x: P.counter.cx, z: P.counter.cz } : null);
};
HT.bookseller = (P, c, room, F) => {
  const R = P.R; for (const sd of ['s', 'w', 'e']) { const [a, b] = hWallRange(room, sd); pShelfRun(P, room, sd, a, b, null, { id: 'bk' + sd, books: true, lv: 5 }); }
  P.focal = { name: 'books', x: 0, z: room.in.z1 }; hPlace(P, room, 'lectern', { sides: ['s', 'w'], at: [F.sx * 1.5], free: true, near: [F.sx * 1.5, room.z1 - 2] });
  pFree(P, room, P.id + '.desk', 1.8, 0.85, 0.8, 0, pdTable(1.8, 0.85, ['book', 'candle', 'book', 'mug', 'book'], 5, c), { near: [-F.sx * 1.5, room.z0 + 3.5], surface: true });
  hPlace(P, room, 'strongbox', { sides: ['w', 'e'] });
};
HT.tinker = (P, c, room, F) => {
  hFocalAt(P, room, 'bench', F); hPlace(P, room, 'brazier', { sides: ['s', 'w', 'e'], at: [F.sx * 2.6] }); hPlace(P, room, 'anvil', { sides: ['s', 'e', 'w'], at: [-F.sx * 2.8] });
  for (const x of [-F.sx * 1.6, F.sx * 1.0, -F.sx * 0.4]) PD.rack(P, room, x, room.z0 + 2.6 + (x > 0 ? 0.6 : 0), 1.8, 0, ['pot', 'pot', 'herb', 'pot']); cnt(P, room, F, 3.0, ['jug', 'bowl', 'pot'], 'tinker');
  hShelfWalls(P, room, PD.WARES.tin, { sides: ['w', 'e'], id: 'wt' }); hPlace(P, room, 'crates', { sides: ['e', 'w'] });
};
HT.cobbler = (P, c, room, F) => {
  hFocalAt(P, room, 'lasts', F); cnt(P, room, F, 3.0, ['plate', 'bowl', 'jug'], 'cobbler'); hShelfWalls(P, room, PD.WARES.shoes, { id: 'wsh', lv: 5 });
  PD.rack(P, room, -F.sx * 1.4, room.z0 + 2.4, 1.6, 0, ['pot', 'herb']); hPlace(P, room, 'hides', { sides: ['e', 'w', 's'] }); hPlace(P, room, 'sacks', { sides: ['w', 'e'] }); hPlace(P, room, 'bucket', { sides: ['s', 'w'] });
};
HT.chandler = (P, c, room, F) => {
  hFocalAt(P, room, 'dip', F); cnt(P, room, F, 3.2, ['candle', 'bowl', 'jug', 'candle'], 'chandler'); hShelfWalls(P, room, PD.WARES.candlery, { id: 'wcn', lv: 5 });
  for (const x of [-F.sx * 1.8, F.sx * 0.2]) PD.rack(P, room, x, room.z0 + 2.7, 1.8, 0, ['herb', 'garlic']); hPlace(P, room, 'barrel', { sides: ['w', 'e'] }); hPlace(P, room, 'crates', { sides: ['e', 'w'] });
};
HT.tailor = (P, c, room, F) => {
  P.focal = null; const t = pFree(P, room, P.id + '.cuttable', 2.3, 1.0, 0.9, 0, TP.cutTable(2.2, [0.36, 0.42, 0.5]), { near: [F.sx * 1.2, room.z0 + 4.4], surface: true }); if (t) P.focal = { name: 'cuttable', x: t.cx, z: t.cz };
  hPlace(P, room, 'dummy', { sides: ['s'], at: [F.sx * 2.8, -F.sx * 2.8] }); cnt(P, room, F, 3.0, ['bowl', 'plate'], 'tailor'); hShelfWalls(P, room, PD.WARES.cloth, { id: 'wcl', lv: 5 });
  hPlace(P, room, 'spinning', { sides: ['w', 'e'] }); hPlace(P, room, 'baskets', { sides: ['e', 'w'] });
};
HT.butcher = (P, c, room, F) => {
  const R = P.R; hFocalAt(P, room, 'block', F, { at: [F.sx * 0.8, -F.sx * 1.8] }); cnt(P, room, F, 3.4, ['plate', 'bowl', 'cheese'], 'butcher');
  for (const x of [-2.6, 0.2, 2.8]) hCeil(P, room, x * F.sx, room.z0 + 5.0, TP.carcassBar(1.6, R)); hCeil(P, room, -F.sx * 1.8, room.z0 + 2.6, TP.sausages(1.6, R)); hCeil(P, room, F.sx * 1.4, room.z0 + 2.4, TP.sausages(1.4, R));
  hPlace(P, room, 'barrel', { sides: ['s', 'w'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] }); hShelfWalls(P, room, ['pot', 'bowl', 'jar', 'knife', 'tools', 'jar'], { sides: ['w', 'e'], id: 'wb', lv: 3 }); hPlace(P, room, 'bucket', { sides: ['s', 'e'] });
};
HT.potter = (P, c, room, F) => {
  hFocalAt(P, room, 'wheel', F, { at: [F.sx * 0.6, -F.sx * 1.2] }); hPlace(P, room, 'kiln', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'clay', { sides: ['s', 'w', 'e'], at: [F.sx * 3.0, -F.sx * 3.0] }); hShelfWalls(P, room, PD.WARES.pots, { id: 'wp', lv: 5 });
  if (F.shop) cnt(P, room, F, 3.0, ['pot', 'bowl', 'jug', 'pot'], 'potter'); hPlace(P, room, 'sacks', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
HT.cooper = (P, c, room, F) => {
  hFocalAt(P, room, 'bench', F, { at: [F.sx * 0.4, -F.sx * 2.6] }); hPlace(P, room, 'staves', { sides: ['s', 'w', 'e'], at: [F.sx * 3.2, -F.sx * 3.4] }); hPlace(P, room, 'hoops', { sides: ['w', 'e', 's'] });
  for (let i = 0; i < 3; i++) hPlace(P, room, 'cask', { sides: ['e', 'w', 's'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] }); hPlace(P, room, 'barrel', { sides: ['w', 'e'] }); hPlace(P, room, 'stack', { sides: ['w', 'e'] });
  pAnyHang(P, room, [{ id: 'cb', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['saw', 'hammer', 'chisel', 'file', 'saw']) }]);
};
HT.tanner = (P, c, room, F) => {
  const cols = [[0.34, 0.26, 0.17], [0.28, 0.34, 0.2], [0.45, 0.34, 0.2]];
  hFocalAt(P, room, 'vat', F, { col: cols[0], at: [-F.sx * 1.6] }); hFocalAt(P, room, 'vat', F, { col: cols[1], at: [F.sx * 0.2] }); hFocalAt(P, room, 'vat', F, { col: cols[2], at: [F.sx * 2.0] });
  hPlace(P, room, 'hides', { sides: ['w', 'e'] }); hPlace(P, room, 'hides', { sides: ['e', 'w'] }); hPlace(P, room, 'bench', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['w', 'e'] }); hPlace(P, room, 'bucket', { sides: ['s', 'e'] });
  hCeil(P, room, 0, room.z0 + 3.0, TP.hideBar(2.0, P.R));
};
HT.dyer = (P, c, room, F) => {
  const cols = [[0.22, 0.3, 0.46], [0.5, 0.22, 0.18], [0.62, 0.5, 0.2]];
  hFocalAt(P, room, 'vat', F, { col: cols[0], at: [F.sx * 1.8] }); hFocalAt(P, room, 'vat', F, { col: cols[1], at: [-F.sx * 0.1] }); hFocalAt(P, room, 'vat', F, { col: cols[2], at: [-F.sx * 2.1] });
  for (const [x, z, col] of [[-3.3, 3.6, [0.22, 0.27, 0.36]], [3.0, 4.2, [0.42, 0.24, 0.2]], [-1.0, 5.0, [0.45, 0.39, 0.25]]]) hCeil(P, room, x * F.sx, room.z0 + z, (mm) => { mm.mat(MAT.TIMBER, COL.woodDark); mm.box(-0.5, -0.1, -0.02, 0.5, -0.06, 0.02); mm.mat(MAT.CLOTH, col.map(v => v * 0.8), 0.5); mm.box(-0.45, -1.0, -0.02, 0.45, -0.1, 0.02); });
  hPlace(P, room, 'barrel', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] }); hPlace(P, room, 'sacks', { sides: ['w', 'e'] }); hShelfWalls(P, room, PD.WARES.cloth, { sides: ['w', 'e'], id: 'wdy', lv: 4 });
};
HT.carpenter = (P, c, room, F) => {
  hFocalAt(P, room, 'bench', F, { at: [F.sx * 0.4, -F.sx * 2.6] }); hPlace(P, room, 'planks', { sides: ['w', 'e'] }); hPlace(P, room, 'horse', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'planks', { sides: ['e', 'w'] });
  pAnyHang(P, room, [{ id: 'ct', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['saw', 'chisel', 'file', 'hammer', 'saw', 'chisel']) }], { max: 3 }); hPlace(P, room, 'stack', { sides: ['w', 'e'] }); hPlace(P, room, 'sacks', { sides: ['e', 'w'] });
  pFree(P, room, P.id + '.wip', 0.85, 0.5, 0.58, 0.4, pdChest, { near: [F.sx * 2, room.z0 + 3], lowOk: true });
};
HT.mason = (P, c, room, F) => {
  hFocalAt(P, room, 'stones', F, { at: [F.sx * 0.4, -F.sx * 2.4] }); hPlace(P, room, 'stones', { sides: ['w', 'e'] }); hPlace(P, room, 'horse', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] }); hPlace(P, room, 'bench', { sides: ['w', 'e'] });
  pAnyHang(P, room, [{ id: 'mt', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['chisel', 'hammer', 'chisel', 'file', 'sledge']) }], { max: 3 }); hPlace(P, room, 'sacks', { sides: ['e', 'w'] }); hPlace(P, room, 'crates', { sides: ['w', 'e'] });
};
HT.saddler = (P, c, room, F) => {
  hFocalAt(P, room, 'saddle', F, { at: [F.sx * 0.2, -F.sx * 2.0] }); hPlace(P, room, 'bench', { sides: ['w', 'e'] }); hPlace(P, room, 'hides', { sides: ['s', 'e', 'w'], at: [F.sx * 3.0] }); hPlace(P, room, 'hides', { sides: ['e', 'w'] });
  pAnyHang(P, room, [{ id: 'sd', w: 1.6, y0: 1.0, y1: 2.0, pivot: 1.95, fn: PD.hooks(P.R, 1.6) }, { id: 'sdt', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['shears', 'punch', 'knife', 'file']) }], { max: 4 }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
HT.ropemaker = (P, c, room, F) => {
  hFocalAt(P, room, 'ropes', F, { at: [F.sx * 0.5, -F.sx * 2.2] }); hPlace(P, room, 'ropes', { sides: ['w', 'e'] }); hPlace(P, room, 'bench', { sides: ['w', 'e'] }); hPlace(P, room, 'sacks', { sides: ['e', 'w'] }); hPlace(P, room, 'willow', { sides: ['w', 'e'] });
  for (let i = 0; i < 4; i++) hCeil(P, room, (-2.4 + i * 1.6) * F.sx, room.z0 + 3.0 + (i % 2) * 1.4, (mm) => { mm.mat(MAT.METAL, COL.black); mm.box(-0.5, -0.05, -0.012, 0.5, -0.02, 0.012); mm.mat(MAT.CLOTH, [0.62, 0.52, 0.34], 0.5); for (let k = 0; k < 4; k++) mm.cyl(-0.36 + k * 0.24, -1.2, 0, 0.03, 0.03, 1.15, 5, 1); });
  hShelfWalls(P, room, PD.WARES.hard, { sides: ['w', 'e'], id: 'wr', lv: 3 });
};
HT.wheelwright = (P, c, room, F) => {
  hFocalAt(P, room, 'wheels', F, { at: [F.sx * 0.4, -F.sx * 2.4] }); hPlace(P, room, 'bench', { sides: ['w', 'e'] }); hPlace(P, room, 'wheels', { sides: ['w', 'e'] }); hPlace(P, room, 'planks', { sides: ['e', 'w'] }); hPlace(P, room, 'horse', { sides: ['w', 'e'] });
  pAnyHang(P, room, [{ id: 'wt', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['saw', 'hammer', 'chisel', 'sledge', 'file']) }], { max: 3 }); hPlace(P, room, 'stack', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
HT.brewer = (P, c, room, F) => {
  hFocalAt(P, room, 'tun', F, { at: [F.sx * 0.4, -F.sx * 2.6] }); hPlace(P, room, 'cask', { sides: ['w', 'e'] }); hPlace(P, room, 'cask', { sides: ['e', 'w'] }); hPlace(P, room, 'cask', { sides: ['w', 'e'] }); hPlace(P, room, 'sacks', { sides: ['e', 'w'] }); hPlace(P, room, 'sacks', { sides: ['w', 'e'] });
  hPlace(P, room, 'barrel', { sides: ['s', 'e', 'w'] }); hPlace(P, room, 'stack', { sides: ['w', 'e'] }); hShelfWalls(P, room, ['jug', 'bowl', 'bottle', 'jar', 'tools'], { sides: ['w', 'e'], id: 'wbr', lv: 3 });
};
HT.fletcher = (P, c, room, F) => {
  hFocalAt(P, room, 'bench', F, { at: [F.sx * 0.4, -F.sx * 2.6] }); hPlace(P, room, 'dummy', { sides: ['s', 'w', 'e'], at: [-F.sx * 2.8] }); hPlace(P, room, 'staves', { sides: ['w', 'e'] });
  pAnyHang(P, room, [{ id: 'fa', w: 0.7, y0: 1.0, y1: 2.0, pivot: 2.0, fn: TP.arrows(P.R) }, { id: 'fb', w: 1.1, y0: 1.0, y1: 2.1, pivot: 2.0, fn: TP.bows(P.R) }, { id: 'fa2', w: 0.7, y0: 1.0, y1: 2.0, pivot: 2.0, fn: TP.arrows(P.R) }], { max: 6 });
  hPlace(P, room, 'crates', { sides: ['e', 'w'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
HT.glover = (P, c, room, F) => {
  P.focal = null; const t = pFree(P, room, P.id + '.cuttable', 2.3, 1.0, 0.9, 0, TP.cutTable(2.2, [0.46, 0.34, 0.22]), { near: [F.sx * 1.2, room.z0 + 4.2], surface: true }); if (t) P.focal = { name: 'cuttable', x: t.cx, z: t.cz };
  hPlace(P, room, 'hides', { sides: ['s', 'w', 'e'] }); hPlace(P, room, 'hides', { sides: ['e', 'w'] }); hShelfWalls(P, room, ['glove', 'shoe', 'box', 'glove', 'folded'], { sides: ['w', 'e'], id: 'wg', lv: 4 }); hPlace(P, room, 'bench', { sides: ['w', 'e'] });
};
HT.scribe = (P, c, room, F) => {
  for (const sd of ['s', 'w', 'e']) { const [a, b] = hWallRange(room, sd); pShelfRun(P, room, sd, a, b, null, { id: 'sb' + sd, books: true, lv: 5 }); }
  P.focal = { name: 'books', x: 0, z: room.in.z1 }; pFree(P, room, P.id + '.desk', 1.8, 0.85, 0.8, 0, pdTable(1.8, 0.85, ['book', 'candle', 'book', 'mug', 'book'], 5, c), { near: [-F.sx * 1.2, room.z0 + 4], surface: true }); hPlace(P, room, 'lectern', { sides: ['w', 'e'] }); hPlace(P, room, 'strongbox', { sides: ['e', 'w'] });
};
HT.merchant = (P, c, room, F) => {
  P.focal = null; const t = pFree(P, room, P.id + '.counting', 2.2, 1.0, 0.9, 0, m => { Props.table(m, 2.2, 0.95, 0.9); Props.clutter(m, P.R, -0.9, 0.9, 0.9, 0, ['book', 'candle', 'book', 'bowl', 'mug'], 5, c); at(m, 0.5, 0.9, 0, 0.2, () => PD.ware.box(m, P.R)); }, { near: [-F.sx * 1.2, room.z0 + 4], surface: true }); if (t) P.focal = { name: 'counting', x: t.cx, z: t.cz };
  hPlace(P, room, 'strongbox', { sides: ['s', 'w', 'e'], at: [F.sx * 2.2] }); hPlace(P, room, 'strongbox', { sides: ['e', 'w'] }); hShelfWalls(P, room, PD.WARES.cloth.concat(['box', 'rope', 'candles']), { id: 'wm', sides: ['w', 'e', 's'] });
  hPlace(P, room, 'crates', { sides: ['w', 'e'] }); hPlace(P, room, 'sacks', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
// household trades: no workshop, but the tools of the household's work stand about the room
HT.widow = (P, c, room, F) => { hPlace(P, room, 'spinning', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'baskets', { sides: ['w', 'e'] }); hShelfWalls(P, room, PD.WARES.yarns, { sides: ['w', 'e'], id: 'wy', lv: 3 }); hPlace(P, room, 'bucket', { sides: ['w', 'e', 's'] }); };
HT.shepherd = (P, c, room, F) => { hPlace(P, room, 'fleeces', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'hurdle', { sides: ['w', 'e'] }); hPlace(P, room, 'bucket', { sides: ['s', 'w', 'e'] }); hShelfWalls(P, room, ['cheese', 'bowl', 'jug', 'cheese', 'loaf'], { sides: ['w', 'e'], id: 'wsp', lv: 3 }); hPlace(P, room, 'sacks', { sides: ['e', 'w'] }); };
HT.woodcutter = (P, c, room, F) => { hPlace(P, room, 'stack', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'stack', { sides: ['e', 'w'] }); hPlace(P, room, 'block', { sides: ['s', 'w', 'e'] }); hPlace(P, room, 'horse', { sides: ['w', 'e'] }); pAnyHang(P, room, [{ id: 'wcx', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['saw', 'hammer', 'sledge', 'saw']) }], { max: 2 }); };
HT.basketmaker = (P, c, room, F) => { hPlace(P, room, 'baskets', { sides: ['s', 'w', 'e'] }); hPlace(P, room, 'baskets', { sides: ['w', 'e'] }); hPlace(P, room, 'willow', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'willow', { sides: ['e', 'w'] }); hPlace(P, room, 'bench', { sides: ['w', 'e'] }); };

// ───────── the working buildings: weaver, draper, mill, hunter, fisher, farm [c5] ─────────
TP.millstones = m => { m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.95, 0, -0.95, 0.95, 0.12, 0.95); for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) m.box(x - 0.06, 0.12, z - 0.06, x + 0.06, 0.95, z + 0.06); m.box(-0.95, 0.9, -0.95, 0.95, 0.96, 0.95);
  m.mat(MAT.STONE, [0.62, 0.6, 0.56]); m.cyl(0, 0.12, 0, 0.78, 0.78, 0.2, 14, 2); m.cyl(0, 0.34, 0, 0.74, 0.74, 0.18, 14, 2); m.mat(MAT.PLANKS, [0.42, 0.3, 0.2]); m.lathe([[0.82, 0.52], [0.84, 0.82], [0.8, 0.9]], 14, 0);
  m.mat(MAT.PLANKS, COL.wood); m.beam([0.0, 1.9, 0.0], [0.0, 1.05, 0.0], 0.05, 0.38); m.box(-0.3, 1.95, -0.3, 0.3, 2.0, 0.3); m.mat(MAT.CLOTH, [0.72, 0.68, 0.56], 0.4); m.box(0.5, 0.0, 0.82, 0.9, 0.2, 0.98); addBoxCollider(m, -0.95, -0.95, 0.95, 0.95, 0, 1.0); };
TP.shaft = m => { m.mat(MAT.TIMBER, COL.woodDark); m.cyl(0, 1.55, -0.1, 0.13, 0.13, 0.01, 8, 2); m.box(-0.14, 1.4, -0.3, 0.14, 1.7, 0.3); m.mat(MAT.PLANKS, [0.4, 0.28, 0.17]); m.cyl(0, 1.55, 0.2, 0.42, 0.42, 0.12, 12, 2); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; m.box(Math.cos(a) * 0.46 - 0.03, 1.55 + Math.sin(a) * 0.46 - 0.04, 0.14, Math.cos(a) * 0.46 + 0.03, 1.55 + Math.sin(a) * 0.46 + 0.04, 0.26); } m.mat(MAT.TIMBER, COL.wood); m.box(-0.12, 0.0, -0.1, 0.12, 1.4, 0.1); };
TP.net = (w, R) => (m, hh) => { m.mat(MAT.TIMBER, COL.woodDark); m.box(-w / 2, -0.04, -0.04, w / 2, 0, 0); m.mat(MAT.CLOTH, [0.46, 0.4, 0.28], 0.5); const nx = Math.round(w / 0.1), ny = 12; for (let i = 0; i <= nx; i++) m.box(-w / 2 + i * w / nx - 0.003, -1.15 - (i % 3) * 0.06, -0.035, -w / 2 + i * w / nx + 0.003, -0.04, -0.03); for (let j = 1; j < ny; j++) m.box(-w / 2, -0.04 - j * 0.09, -0.035, w / 2, -0.036 - j * 0.09, -0.03); for (let i = 0; i < 4; i++) { m.mat(MAT.WOODDARK || MAT.TIMBER, COL.wood); m.ball(-w / 2 + 0.2 + i * (w - 0.4) / 3, -0.5 - R() * 0.4, -0.05, 0.035, 0.035, 0.03, 5, 3); } };
TP.fishBar = (len, R) => m => { m.mat(MAT.METAL, [0.2, 0.19, 0.19]); m.box(-len / 2, -0.4, -0.015, len / 2, -0.37, 0.015); const n = Math.round(len / 0.28); for (let i = 0; i < n; i++) { const x = -len / 2 + 0.18 + i * (len - 0.36) / Math.max(1, n - 1); m.mat(MAT.CLOTH, [0.2, 0.19, 0.18], 0.4); m.box(x - 0.003, -0.5, -0.003, x + 0.003, -0.37, 0.003); m.mat(MAT.THATCH, R.pick([[0.45, 0.43, 0.36], [0.4, 0.4, 0.36]]), 0.4); m.ball(x, -0.68, 0, 0.035, 0.17, 0.02, 6, 4); } };
TP.rods = m => { m.mat(MAT.TIMBER, COL.wood); for (let i = 0; i < 4; i++) m.beam([-0.3 + i * 0.2, 0.0, 0.05], [-0.15 + i * 0.2, 2.1, 0.12], 0.013, 0.006); m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.4, 0.0, -0.05, 0.4, 0.06, 0.2); };
TP.furFrame = (R) => m => { m.mat(MAT.TIMBER, COL.wood); for (const sx of [-1, 1]) m.box(sx * 0.5 - 0.03, 0, -0.05, sx * 0.5 + 0.03, 1.5, 0.05); m.box(-0.5, 1.45, -0.05, 0.5, 1.5, 0.05); m.box(-0.5, 0.2, -0.05, 0.5, 0.25, 0.05); m.mat(MAT.CLOTH, R.pick([[0.36, 0.27, 0.19], [0.3, 0.26, 0.22], [0.4, 0.32, 0.22]]), 0.45); m.box(-0.44, 0.28, -0.015, 0.44, 1.42, 0.015); m.mat(MAT.CLOTH, [0.34, 0.28, 0.2], 0.4); for (let i = 0; i < 6; i++) m.box(-0.5, 0.3 + i * 0.2, -0.03, -0.44, 0.31 + i * 0.2, 0.03); addBoxCollider(m, -0.55, -0.1, 0.55, 0.1, 0, 1.5); };
Object.assign(HPR, { millstones: [2.0, 2.0, 2.0, () => TP.millstones], shaft: [0.5, 1.0, 1.9, () => TP.shaft], rods: [0.9, 0.3, 2.1, () => TP.rods], furframe: [1.2, 0.3, 1.5, (P, rm, R) => TP.furFrame(R)] });
HT.weaver = (P, c, room, F) => {
  hFocalAt(P, room, 'm_loom', F, { at: [F.sx * 0.2, -F.sx * 2.6] }); hPlace(P, room, 'm_loom', { sides: ['w', 'e'] }); hPlace(P, room, 'spinning', { sides: ['w', 'e', 's'] }); hPlace(P, room, 'spinning', { sides: ['e', 'w'] });
  hPlace(P, room, 'vat', { col: [0.2, 0.26, 0.4], sides: ['w', 'e'] }); hShelfWalls(P, room, PD.WARES.cloth.concat(PD.WARES.yarns || []), { sides: ['w', 'e', 's'], id: 'wv', lv: 5 }); hPlace(P, room, 'baskets', { sides: ['w', 'e'] });
  hCeil(P, room, F.X(-1.2), room.z0 + 4.2, TP.fishBar(0.1, P.R)); P.hall = P.hall || null;
};
HT.draper = (P, c, room, F) => {
  cnt(P, room, F, 4.2, ['folded', 'bolt', 'spools', 'folded'], 'draper'); hShelfWalls(P, room, PD.WARES.cloth, { sides: ['w', 'e', 's'], id: 'wd', lv: 6 }); hPlace(P, room, 'cuttable', { sides: ['w', 'e'] }); hPlace(P, room, 'dip', { sides: ['w', 'e'] });
  pAnyHang(P, room, [{ id: 'dr', w: 1.4, y0: 0.9, y1: 2.0, pivot: 2.0, fn: PD.tapestry(P.R, 1.4, 1.1) }], { max: 2 }); hPlace(P, room, 'm_mirror', { sides: ['w', 'e', 's'] });
};
HT.miller = (P, c, room, F) => {
  hFocalAt(P, room, 'millstones', F, { at: [F.sx * 0.5, -F.sx * 2.5] }); hPlace(P, room, 'shaft', { sides: ['w', 'e'] }); for (let i = 0; i < 4; i++) hPlace(P, room, 'sacks', { sides: ['w', 'e', 's'] });
  hCeil(P, room, F.X(-0.3), room.z0 + 3.2, TP.ropeCoils ? (m => { m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.5, -0.1, -0.05, 0.5, -0.04, 0.05); m.mat(MAT.CLOTH, [0.55, 0.45, 0.3], 0.4); m.cyl(0, -1.2, 0, 0.012, 0.012, 1.1, 4, 1); m.mat(MAT.METAL, COL.iron); m.box(-0.06, -1.3, -0.06, 0.06, -1.2, 0.06); }) : null); hPlace(P, room, 'cart', { sides: ['w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['e', 'w'] });
};
HT.hunter = (P, c, room, F) => {
  hPlace(P, room, 'furframe', { sides: ['w', 'e'], free: false }); hPlace(P, room, 'furframe', { sides: ['e', 'w'], free: false }); hPlace(P, room, 'fleeces', { sides: ['w', 'e'] }); hPlace(P, room, 'brazier', { sides: ['e', 'w'] });
  hCeil(P, room, F.X(1.2), room.z0 + 3.0, TP.sausages(1.4, P.R)); pAnyHang(P, room, [{ id: 'hb', w: 1.2, y0: 0.9, y1: 1.9, pivot: 1.9, fn: TP.bows(P.R) }], { max: 2 }); hPlace(P, room, 'bucket', { sides: ['s', 'w', 'e'] });
};
HT.fisher = (P, c, room, F) => {
  pAnyHang(P, room, [{ id: 'nt', w: 2.0, y0: 0.7, y1: 2.0, pivot: 2.0, fn: TP.net(2.0, P.R) }], { max: 3 }); hPlace(P, room, 'rods', { sides: ['s', 'w', 'e'] }); hPlace(P, room, 'barrel', { sides: ['w', 'e'] }); hPlace(P, room, 'baskets', { sides: ['w', 'e', 's'] });
  hCeil(P, room, F.X(1.2), room.z0 + 3.0, TP.fishBar(1.8, P.R)); hPlace(P, room, 'ropes', { sides: ['w', 'e'] }); hPlace(P, room, 'bucket', { sides: ['s', 'w', 'e'] });
};
HT.farmer = (P, c, room, F) => {
  hPlace(P, room, 'm_press', { sides: ['s', 'w', 'e'] }); hPlace(P, room, 'sacks', { sides: ['w', 'e'] }); hPlace(P, room, 'appleCrate', { sides: ['w', 'e'] }); hPlace(P, room, 'applesBrl', { sides: ['e', 'w'] }); hShelfWalls(P, room, ['cheese', 'jug', 'loaf', 'bowl', 'cheese'], { sides: ['w', 'e'], id: 'wf', lv: 3 });
  pAnyHang(P, room, [{ id: 'ft', w: 1.8, y0: 1.0, y1: 2.1, pivot: 2.05, fn: PD.toolRack(P.R, 1.8, ['saw', 'hammer', 'file', 'chisel']) }], { max: 2 });
};
HT.household = (P, c, room, F) => { hPlace(P, room, 'spinning', { sides: ['w', 'e'] }); hPlace(P, room, 'bucket', { sides: ['w', 'e', 's'] }); };
