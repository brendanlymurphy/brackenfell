// ───────────────────────── wares, tools and trade props for the designed plans [c4] ─────────────────────────
// Cheap merged geometry (boxes, a few lathes) in the same frames as 72g_dress.js: a hung thing has its back at z = 0 and stands out toward -z (drawn from y = 0 downward,
// pivot = its top); a floor thing is centred on its footprint with the back at local -z (back 0 / -1) or +z (back +1) as the caller says; a ceiling thing hangs from y = 0.
const WS = { steel: [0.95, 0.96, 1.0], dark: [0.5, 0.5, 0.54], coal: [0.05, 0.05, 0.05] };
const HAMM = (m, w, h, d) => { m.mat(MAT.METAL, [0.55, 0.55, 0.6]); m.box(-w / 2, -h, -0.085, w / 2, 0, -0.035); };
// one tool hung by its head from a peg (flat against the board)
PD.hangTool = (m, kind, R) => {
  switch (kind) {
    case 'hammer': HAMM(m, 0.14, 0.07); m.mat(MAT.TIMBER, COL.wood); m.box(-0.014, -0.46, -0.075, 0.014, -0.07, -0.045); break;
    case 'sledge': HAMM(m, 0.18, 0.11); m.mat(MAT.TIMBER, COL.wood); m.box(-0.018, -0.7, -0.078, 0.018, -0.11, -0.042); break;
    case 'tongs': m.mat(MAT.METAL, WS.dark); for (const sg of [-1, 1]) m.beam([sg * 0.012, -0.08, -0.06], [sg * 0.05, -0.62, -0.06], 0.02, 0.012); m.box(-0.025, -0.1, -0.075, 0.025, -0.07, -0.045); break;
    case 'chisel': m.mat(MAT.TIMBER, COL.wood); m.box(-0.014, -0.16, -0.07, 0.014, -0.02, -0.05); m.mat(MAT.METAL, WS.steel); m.box(-0.011, -0.36, -0.066, 0.011, -0.16, -0.054); break;
    case 'file': m.mat(MAT.TIMBER, COL.wood); m.box(-0.014, -0.14, -0.07, 0.014, -0.02, -0.05); m.mat(MAT.METAL, [0.45, 0.45, 0.48]); m.box(-0.018, -0.5, -0.066, 0.018, -0.14, -0.056); break;
    case 'punch': m.mat(MAT.METAL, WS.dark); m.box(-0.012, -0.3, -0.066, 0.012, -0.02, -0.054); m.box(-0.02, -0.04, -0.07, 0.02, -0.02, -0.05); break;
    case 'saw': m.mat(MAT.METAL, WS.steel); m.box(-0.05, -0.55, -0.062, 0.05, -0.08, -0.056); m.mat(MAT.TIMBER, COL.wood); m.box(-0.045, -0.08, -0.07, 0.045, 0.0, -0.05); break;
    case 'shears': m.mat(MAT.METAL, WS.steel); for (const sg of [-1, 1]) m.beam([sg * 0.01, -0.1, -0.06], [sg * 0.07, -0.36, -0.06], 0.025, 0.01); m.mat(MAT.TIMBER, COL.leather); m.box(-0.04, -0.12, -0.07, 0.04, -0.06, -0.05); break;
    default: m.mat(MAT.METAL, WS.dark); m.box(-0.02, -0.3, -0.066, 0.02, 0, -0.054);
  }
};
// a board of tools on pegs, full: hammers, tongs, chisels, files and punches in rows
PD.toolRack = (R, w, kinds) => (m, hh) => {
  kinds = kinds || ['hammer', 'tongs', 'chisel', 'file', 'punch', 'tongs', 'sledge', 'hammer', 'chisel', 'shears', 'saw'];
  m.mat(MAT.PLANKS, COL.wood); m.box(-w / 2, -0.95, -0.035, w / 2, 0.0, 0); m.mat(MAT.PLANKS, COL.wood); m.box(-w / 2 - 0.03, -0.075, -0.075, w / 2 + 0.03, -0.01, -0.035);
  const n = Math.max(3, Math.floor(w / 0.17));
  for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * w / n; m.mat(MAT.METAL, COL.black); m.box(x - 0.01, -0.095, -0.075, x + 0.01, -0.075, -0.03); at(m, x, -0.09, 0.0, 0, () => PD.hangTool(m, R.pick(kinds), R)); }
};
// horseshoes on a rail: a rail with two rows of shoes and a few nails
PD.horseshoes = (R, w) => (m, hh) => {
  m.mat(MAT.PLANKS, [0.8, 0.72, 0.62]); m.box(-w / 2, -0.5, -0.03, w / 2, 0.0, 0);
  const n = Math.max(3, Math.floor(w / 0.2));
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n + R.s() * 0.01, y = -0.14 - row * 0.2;
    m.mat(MAT.METAL, [0.6, 0.58, 0.56]); at(m, x, y, 0, R.s() * 0.25, () => { m.box(-0.06, -0.02, -0.05, 0.06, 0, -0.035); m.box(-0.06, -0.1, -0.05, -0.04, -0.02, -0.035); m.box(0.04, -0.1, -0.05, 0.06, -0.02, -0.035); });
  }
};
// finished blades hung flat on a board: swords, daggers, an axe head, a spear head; the glint is the steel
PD.bladeWall = (R, w) => (m, hh) => {
  m.mat(MAT.PLANKS, [0.8, 0.72, 0.62]); m.box(-w / 2, -1.0, -0.035, w / 2, 0.0, 0);
  const rows = 3, kinds = ['sword', 'dagger', 'axe', 'sword', 'spear'];
  for (let r = 0; r < rows; r++) {
    const y = -0.2 - r * 0.3, k = kinds[(r + ((R() * 5) | 0)) % 5], L = Math.min(w - 0.12, k === 'dagger' ? 0.4 : k === 'spear' ? 0.9 : 0.85), x0 = -L / 2;
    m.mat(MAT.METAL, COL.black); for (const sx of [-0.7, 0.3]) m.box(x0 + L / 2 + sx * L * 0.4 - 0.01, y - 0.03, -0.08, x0 + L / 2 + sx * L * 0.4 + 0.01, y + 0.03, -0.035);
    if (k === 'axe') { m.mat(MAT.TIMBER, COL.wood); m.box(x0, y - 0.015, -0.075, x0 + L, y + 0.015, -0.05); m.mat(MAT.METAL, WS.steel); m.box(x0 + L * 0.7, y - 0.12, -0.08, x0 + L * 0.82, y + 0.1, -0.058); m.box(x0 + L * 0.82, y - 0.14, -0.078, x0 + L * 0.86, y + 0.12, -0.06); }
    else if (k === 'spear') { m.mat(MAT.TIMBER, COL.wood); m.box(x0, y - 0.012, -0.075, x0 + L, y + 0.012, -0.055); m.mat(MAT.METAL, WS.steel); m.box(x0 + L - 0.02, y - 0.04, -0.075, x0 + L + 0.18, y + 0.04, -0.062); }
    else { const bl = L - 0.2; m.mat(MAT.METAL, WS.steel); m.box(x0 + 0.2, y - 0.022, -0.075, x0 + 0.2 + bl, y + 0.022, -0.065); m.box(x0 + 0.2 + bl, y - 0.012, -0.072, x0 + 0.2 + bl + 0.04, y + 0.012, -0.068); m.mat(MAT.METAL, COL.bronze); m.box(x0 + 0.17, y - 0.07, -0.082, x0 + 0.2, y + 0.07, -0.06); m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(x0 + 0.04, y - 0.016, -0.078, x0 + 0.17, y + 0.016, -0.06); m.mat(MAT.METAL, COL.bronze); m.ball(x0 + 0.02, y, -0.07, 0.025, 0.025, 0.02, 5, 3); }
  }
};
// a standing rack of iron bars leaning in a frame
PD.ironStand = R => m => {
  m.mat(MAT.TIMBER, COL.woodDark);
  for (const sx of [-0.5, 0.5]) { m.box(sx - 0.035, 0, -0.22, sx + 0.035, 0.08, 0.22); for (const sz of [-0.2, 0.2]) m.box(sx - 0.03, 0, sz - 0.03, sx + 0.03, 1.0, sz + 0.03); }
  for (const sz of [-0.2, 0.2]) m.box(-0.52, 0.5, sz - 0.02, 0.52, 0.55, sz + 0.02);
  m.mat(MAT.METAL, [0.3, 0.3, 0.33]);
  for (let i = 0; i < 10; i++) { const x = -0.42 + i * 0.093, z = -0.1 + (i % 3) * 0.1; m.push().T(x, 0.08, z).RZ(R.s() * 0.05).RX(R.s() * 0.05); m.box(-0.013, 0, -0.013, 0.013, 1.0 + R() * 0.25, 0.013); m.pop(); }
  addBoxCollider(m, -0.55, -0.25, 0.55, 0.25, 0, 1.3);
};
// a heap of coal against a wall, with a few lumps spilled
PD.coalHeap = R => m => {
  m.mat(MAT.PLAIN, WS.coal); m.ball(0, 0.28, 0, 0.62, 0.3, 0.42, 8, 5); m.ball(-0.28, 0.2, 0.1, 0.32, 0.2, 0.3, 7, 4); m.ball(0.3, 0.18, -0.05, 0.3, 0.18, 0.26, 7, 4);
  for (let i = 0; i < 6; i++) { m.mat(MAT.PLAIN, [0.07, 0.07, 0.08]); m.ball(R.s() * 0.7, 0.03, 0.3 + R() * 0.2, 0.05, 0.03, 0.05, 4, 3); }
  addBoxCollider(m, -0.7, -0.45, 0.7, 0.45, 0, 0.5);
};
// the smith's bench: a thick top, a vise, hammers, tongs and a heap of nails on it; a stretcher shelf below with a pail
PD.smithBench = len => m => {
  const h = 0.88; m.mat(MAT.PLANKS, COL.woodDark); m.box(-len / 2, h - 0.08, -0.36, len / 2, h, 0.36); m.mat(MAT.TIMBER, COL.wood);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box(sx * (len / 2 - 0.12) - 0.045, 0, sz * 0.28 - 0.045, sx * (len / 2 - 0.12) + 0.045, h - 0.08, sz * 0.28 + 0.045);
  m.mat(MAT.PLANKS, COL.wood); m.box(-len / 2 + 0.1, 0.3, -0.3, len / 2 - 0.1, 0.35, 0.3);
  m.mat(MAT.METAL, WS.dark); m.box(-len / 2 + 0.2, h, -0.14, -len / 2 + 0.38, h + 0.16, 0.04); m.box(-len / 2 + 0.2, h + 0.1, 0.04, -len / 2 + 0.38, h + 0.14, 0.2); m.box(-len / 2 + 0.28, h + 0.05, 0.2, -len / 2 + 0.3, h + 0.07, 0.34);
  at(m, -0.1, h, 0.05, 0.4, () => { m.mat(MAT.TIMBER, COL.wood); m.box(-0.012, 0.012, -0.012, 0.012, 0.3, 0.012); m.mat(MAT.METAL, [0.3, 0.3, 0.33]); m.box(-0.06, 0, -0.03, 0.0, 0.07, 0.03); m.push().RZ(PI / 2); m.pop(); });
  at(m, 0.35, h, -0.12, 1.2, () => { m.mat(MAT.METAL, WS.dark); for (const sg of [-1, 1]) m.beam([0, 0.01, sg * 0.01], [0.4, 0.01, sg * 0.05], 0.02, 0.012); });
  at(m, len / 2 - 0.4, h, 0.1, 0, () => { m.mat(MAT.METAL, [0.15, 0.14, 0.14]); for (let i = 0; i < 7; i++) m.box(-0.1 + i * 0.03, 0, -0.04 + (i % 2) * 0.05, -0.085 + i * 0.03, 0.015, -0.035 + (i % 2) * 0.05); m.mat(MAT.METAL, WS.steel); m.box(-0.02, 0, 0.12, 0.02, 0.012, 0.3); });
  at(m, -0.5, 0.35, 0.1, 0, () => { m.mat(MAT.PLANKS, COL.wood); m.cyl(0, 0, 0, 0.14, 0.17, 0.26, 8, 1); m.mat(MAT.METAL, COL.black); m.cyl(0, 0.22, 0, 0.15, 0.15, 0.015, 8, 0); });
  addBoxCollider(m, -len / 2, -0.36, len / 2, 0.36, 0, h);
};
// a grindstone in a water trough with a crank
PD.grindstone = m => {
  m.mat(MAT.TIMBER, COL.woodDark); for (const sx of [-0.2, 0.2]) { m.box(sx - 0.03, 0, -0.3, sx + 0.03, 0.66, -0.24); m.box(sx - 0.03, 0, 0.24, sx + 0.03, 0.66, 0.3); }
  m.mat(MAT.PLANKS, COL.wood); m.box(-0.28, 0, -0.26, 0.28, 0.2, 0.26); m.mat(MAT.PLAIN, [0.08, 0.14, 0.2]); m.quad([-0.22, 0.19, -0.2], [-0.22, 0.19, 0.2], [0.22, 0.19, 0.2], [0.22, 0.19, -0.2]);
  m.mat(MAT.STONE, [0.85, 0.82, 0.78], 0.8); m.push().T(0, 0.38, 0).RZ(PI / 2); m.cyl(0, -0.12, 0, 0.3, 0.3, 0.24, 14, 2); m.pop();
  m.mat(MAT.METAL, COL.black); m.box(-0.3, 0.37, -0.01, 0.3, 0.39, 0.01); m.box(0.3, 0.3, -0.01, 0.4, 0.45, 0.01); m.mat(MAT.TIMBER, COL.wood); m.box(0.37, 0.3, -0.01, 0.4, 0.3 + 0.01, 0.1);
  addBoxCollider(m, -0.4, -0.3, 0.4, 0.3, 0, 0.68);
};
// chains hanging from a beam: a long chain with a hook and a pair of tongs, and a short one with a pulley block
PD.chainHang = (len, R) => m => {
  m.mat(MAT.METAL, [0.18, 0.17, 0.17]); m.box(-0.03, -0.04, -0.03, 0.03, 0, 0.03);
  const n = Math.floor(len / 0.055); for (let i = 0; i < n; i++) { const y = -0.04 - i * 0.055; if (i % 2) m.box(-0.011, y - 0.062, -0.004, 0.011, y, 0.004); else m.box(-0.004, y - 0.062, -0.011, 0.004, y, 0.011); }
  const y = -0.04 - n * 0.055; m.box(-0.013, y - 0.08, -0.007, 0.013, y, 0.007); m.box(-0.045, y - 0.1, -0.007, 0.0, y - 0.08, 0.007); m.box(-0.045, y - 0.16, -0.007, -0.03, y - 0.08, 0.007);
};
// a hung lantern is Props.lantern; here, a hanging pot-hook bar with a few things on it for a forge or a kitchen
PD.hookBar = (len, R, kinds) => m => {
  m.mat(MAT.METAL, [0.2, 0.19, 0.19]); m.box(-len / 2, -0.5, -0.012, len / 2, -0.47, 0.012); for (const sx of [-1, 1]) m.box(sx * len * 0.45 - 0.006, -0.5, -0.006, sx * len * 0.45 + 0.006, 0, 0.006);
  const n = Math.max(3, Math.round(len / 0.3));
  for (let i = 0; i < n; i++) { const x = -len / 2 + 0.15 + i * (len - 0.3) / (n - 1), k = R.pick(kinds || ['tongs', 'hammer', 'chain', 'ladle']); m.mat(MAT.METAL, COL.black); m.box(x - 0.006, -0.47, -0.006, x + 0.006, -0.6, 0.006);
    if (k === 'tongs') for (const sg of [-1, 1]) m.beam([x + sg * 0.01, -0.6, 0], [x + sg * 0.05, -1.05, 0], 0.02, 0.012); else if (k === 'hammer') { m.box(x - 0.07, -0.68, -0.03, x + 0.07, -0.6, 0.03); m.mat(MAT.TIMBER, COL.wood); m.box(x - 0.014, -1.05, -0.014, x + 0.014, -0.68, 0.014); } else if (k === 'ladle') { m.cyl(x, -0.95, 0, 0.06, 0.05, 0.08, 7, 1); m.box(x - 0.008, -0.95, -0.008, x + 0.008, -0.6, 0.008); } else { for (let j = 0; j < 7; j++) { const y = -0.6 - j * 0.055; if (j % 2) m.box(x - 0.011, y - 0.06, -0.004, x + 0.011, y, 0.004); else m.box(x - 0.004, y - 0.06, -0.011, x + 0.004, y, 0.011); } } }
};
// ceiling-hung things: no floor, no clear zones; kept out of stairwells and off the hearth
function pCeil(P, room, x, z, draw, rot) {
  const L = P.lv[room.k], r = rectOf(x, z, 0.9, 0.9);
  if (!rIn(r, room.in) || P.holes.some(h => (h.k === room.k || h.k === room.k + 1) && rOv(r, h.r, 0.05))) return false;
  for (const it of P.items) if (it.k === room.k && it.kind === 'hearth' && rOv(r, it)) return false;
  const m = P.c.int; m.m1 = P.zone; m.ao = INT_AO; at(m, x, L.y + L.H - 0.02, z, rot || 0, () => draw(m)); return true;
}

// ── general wares: varied small goods for shelves and tables (kept a few dozen triangles each) ──
const GL = [[0.3, 0.4, 0.33], [0.4, 0.3, 0.2], [0.3, 0.34, 0.4], [0.5, 0.46, 0.38], [0.34, 0.24, 0.25]];      // [c5] muted glass and clay, not primary colours
PD.ware = {
  rope: (m, R) => { m.mat(MAT.CLOTH, [0.62, 0.52, 0.34], 0.5); m.lathe([[0.05, 0], [0.12, 0.005], [0.14, 0.04], [0.13, 0.09], [0.06, 0.1], [0.05, 0.05]], 9, 1); },
  lantern: (m, R) => { m.mat(MAT.METAL, COL.black); m.box(-0.055, 0, -0.055, 0.055, 0.015, 0.055); m.box(-0.06, 0.2, -0.06, 0.06, 0.225, 0.06); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box(sx * 0.05 - 0.005, 0.015, sz * 0.05 - 0.005, sx * 0.05 + 0.005, 0.2, sz * 0.05 + 0.005); m.box(-0.02, 0.225, -0.005, 0.02, 0.27, 0.005); emit(m, 0.6, () => { m.mat(MAT.PLAIN, [1, 0.7, 0.3]); m.box(-0.035, 0.03, -0.035, 0.035, 0.12, 0.035, 4 | 8); }); },
  flask: (m, R) => { m.mat(MAT.PLAIN, R.pick(GL)); m.lathe([[0.01, 0], [0.07, 0.02], [0.085, 0.08], [0.05, 0.14], [0.022, 0.2], [0.024, 0.24]], 8, 1); m.mat(MAT.PLANKS, COL.wood); m.cyl(0, 0.235, 0, 0.022, 0.022, 0.03, 6, 2); },
  tall: (m, R) => { m.mat(MAT.PLAIN, R.pick(GL)); m.lathe([[0.01, 0], [0.04, 0.01], [0.042, 0.2], [0.02, 0.27], [0.02, 0.32]], 8, 1); m.mat(MAT.PLANKS, COL.woodDark); m.cyl(0, 0.315, 0, 0.02, 0.02, 0.035, 6, 2); },
  jar: (m, R) => { m.mat(MAT.PLAIN, R.pick([COL.clay, [0.5, 0.42, 0.3], [0.3, 0.3, 0.32], [0.62, 0.55, 0.4]])); m.lathe([[0.01, 0], [0.075, 0.01], [0.09, 0.08], [0.07, 0.15], [0.05, 0.17]], 8, 1); m.mat(MAT.CLOTH, [0.6, 0.55, 0.42], 0.5); m.cyl(0, 0.17, 0, 0.055, 0.055, 0.025, 7, 2); },
  demijohn: (m, R) => { m.mat(MAT.THATCH, [0.75, 0.62, 0.4], 0.5); m.lathe([[0.01, 0], [0.1, 0.02], [0.13, 0.12], [0.1, 0.24], [0.04, 0.3], [0.035, 0.36]], 9, 1); m.mat(MAT.PLANKS, COL.woodDark); m.cyl(0, 0.35, 0, 0.035, 0.035, 0.04, 6, 2); },
  bolt: (m, R) => { { const q = R.pick([DYE.red, DYE.blue, DYE.green, DYE.yellow, DYE.cream, DYE.grey, DYE.brown]), v = 0.88 + R.s() * 0.24; m.mat(MAT.CLOTH, [q[0] * v, q[1] * v, q[2] * v], 0.5); }; m.push().T(0, 0.075, 0).RX(PI / 2); m.lathe([[0.075, -0.15], [0.075, 0.15]], 8, 2); m.pop(); },
  folded: (m, R) => { let y = 0; for (let i = 0; i < 4; i++) { m.mat(MAT.CLOTH, R.pick([DYE.red, DYE.blue, DYE.green, DYE.purple, [0.7, 0.62, 0.45], [0.55, 0.5, 0.42]]), 0.5); m.box(-0.14, y, -0.1, 0.14 - R() * 0.02, y + 0.035, 0.1); y += 0.035; } },
  sack: (m, R) => Props.sack(m, 0.13 + R() * 0.05, R.pick([[0.7, 0.62, 0.45], [0.6, 0.55, 0.42], [0.5, 0.45, 0.32]])),
  box: (m, R) => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.12, 0, -0.08, 0.12, 0.1, 0.08); m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.125, 0.1, -0.085, 0.125, 0.115, 0.085); m.mat(MAT.METAL, COL.black); m.box(-0.01, 0.07, 0.078, 0.01, 0.105, 0.088); },
  candles: (m, R) => { m.mat(MAT.PLAIN, COL.wax); for (let i = 0; i < 5; i++) m.cyl(-0.06 + i * 0.03, 0, R.s() * 0.02, 0.011, 0.011, 0.2 + R() * 0.05, 5, 2); m.mat(MAT.CLOTH, COL.leather, 0.5); m.box(-0.08, 0.06, -0.025, 0.08, 0.075, 0.03); },
  spools: (m, R) => { for (let i = 0; i < 3; i++) { m.mat(MAT.CLOTH, R.pick([DYE.red, DYE.blue, DYE.green, [0.7, 0.62, 0.45]]), 0.5); m.cyl(-0.1 + i * 0.1, 0, R.s() * 0.03, 0.04, 0.04, 0.1, 7, 2); m.mat(MAT.PLANKS, COL.woodDark); m.cyl(-0.1 + i * 0.1, -0.005, R.s() * 0.03, 0.05, 0.05, 0.01, 7, 2); m.cyl(-0.1 + i * 0.1, 0.1, R.s() * 0.03, 0.05, 0.05, 0.01, 7, 2); } },
  tools: (m, R) => { m.mat(MAT.TIMBER, COL.wood); m.box(-0.2, 0.01, -0.02, 0.1, 0.03, 0.02); m.mat(MAT.METAL, WS.steel); m.box(0.1, 0.005, -0.04, 0.2, 0.035, 0.04); m.box(-0.18, 0.04, 0.05, 0.12, 0.06, 0.07); m.mat(MAT.TIMBER, COL.wood); m.box(-0.18, 0.06, 0.05, -0.08, 0.075, 0.07); },
  cheese: (m, R) => Props.cheese(m), loaf: (m, R) => Props.loaf(m), bowl: (m, R) => Props.bowl(m), pot: (m, R) => Props.pot(m, 0.08 + R() * 0.04, R.pick([COL.clay, [0.55, 0.5, 0.42], [0.3, 0.4, 0.5]])),
  ham: (m, R) => { m.mat(MAT.PLAIN, [0.5, 0.26, 0.2]); m.ball(0, 0.08, 0, 0.1, 0.08, 0.1, 6, 4); m.mat(MAT.CLOTH, [0.6, 0.55, 0.42], 0.5); m.box(-0.012, 0.15, -0.012, 0.012, 0.2, 0.012); },
};
PD.WARES = {
  store: ['rope', 'lantern', 'flask', 'tall', 'jar', 'demijohn', 'folded', 'sack', 'box', 'candles', 'tools', 'cheese', 'loaf', 'pot', 'bowl', 'ham', 'bolt'],
  cloth: ['bolt', 'folded', 'bolt', 'spools', 'folded', 'bolt', 'box', 'spools'],
  drugs: ['flask', 'tall', 'jar', 'jar', 'flask', 'demijohn', 'tall', 'candles', 'box'],
  hard: ['tools', 'rope', 'lantern', 'box', 'jar', 'candles', 'rope', 'sack'],
};
const WARE_W = { rope: 0.28, lantern: 0.14, flask: 0.2, tall: 0.11, jar: 0.2, demijohn: 0.28, bolt: 0.17, folded: 0.3, sack: 0.3, box: 0.27, candles: 0.2, spools: 0.34, tools: 0.45, cheese: 0.26, loaf: 0.3, bowl: 0.2, pot: 0.25, ham: 0.24 };
// a shelf fill: a varied row of wares from a pool; 2 or 3 of a kind together now and then, never the same kind three shelves in a row
PD.mixed = (c, len, pool) => { pool = pool || PD.WARES.store; let last = -1; return (i, y) => {
  const m = c.int, R = c.R; let x = -len / 2 + 0.1 + R() * 0.06;
  while (x < len / 2 - 0.2) {
    if (R() < 0.08) { x += 0.14; continue; }
    let k = (R() * pool.length) | 0; if (k === last) k = (k + 1 + ((R() * (pool.length - 1)) | 0)) % pool.length; last = k; const nm = pool[k], w = WARE_W[nm] || 0.25, cnt = (nm === 'flask' || nm === 'tall' || nm === 'jar' || nm === 'candles' || nm === 'bolt') ? 1 + ((R() * 3) | 0) : 1;
    for (let j = 0; j < cnt && x + w < len / 2 - 0.08; j++) { at(m, x + w / 2, y, R.s() * 0.03, nm === 'bolt' || nm === 'folded' ? 0 : R() * 6, () => PD.ware[nm](m, R)); x += w * 0.92; }
    x += 0.05 + R() * 0.05;
  } }; };
// a stack of crates and a barrel-top sack: varied floor pile for stock rooms
PD.cratePile = R => m => {
  Props.crate(m, 0.6, true); at(m, 0.62, 0, 0.03, 0.2, () => Props.crate(m, 0.55, true)); at(m, 0.28, 0.6, 0, R.s() * 0.4, () => Props.crate(m, 0.5, true));
  at(m, -0.1, 0.6, 0.0, 0, () => PD.ware.rope(m, R)); at(m, 0.64, 0.55, 0.05, 0.6, () => PD.ware.box(m, R));
  addBoxCollider(m, -0.35, -0.32, 0.95, 0.35, 0, 1.15);
};
PD.sackPile = R => m => {
  const cols = [[0.7, 0.62, 0.45], [0.6, 0.55, 0.42], [0.5, 0.45, 0.32], [0.62, 0.5, 0.36]];
  for (const [x, z, s, y] of [[-0.3, 0.0, 0.24, 0], [0.12, 0.02, 0.26, 0], [0.45, -0.02, 0.22, 0], [-0.1, 0.0, 0.2, 0.34], [0.28, 0.0, 0.2, 0.36]]) { m.mat(MAT.CLOTH, R.pick(cols), 0.5); m.ball(x, y + s * 0.9, z, s * 0.85, s, s * 0.8, 6, 4); m.mat(MAT.CLOTH, [0.45, 0.38, 0.26], 0.5); m.cyl(x, y + s * 1.75, z, 0.03, 0.05, 0.05, 5, 2); }
  addBoxCollider(m, -0.6, -0.3, 0.7, 0.3, 0, 0.75);
};
PD.bottleCrate = R => m => {
  m.mat(MAT.PLANKS, COL.wood); m.box(-0.35, 0, -0.25, 0.35, 0.3, -0.22); m.box(-0.35, 0, 0.22, 0.35, 0.3, 0.25); m.box(-0.35, 0, -0.25, -0.32, 0.3, 0.25); m.box(0.32, 0, -0.25, 0.35, 0.3, 0.25); m.box(-0.33, 0, -0.22, 0.33, 0.04, 0.22);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) at(m, -0.2 + i * 0.2, 0.04, -0.11 + j * 0.22, R() * 6, () => (R() < 0.5 ? PD.ware.flask(m, R) : PD.ware.tall(m, R)));
  addBoxCollider(m, -0.36, -0.26, 0.36, 0.26, 0, 0.5);
};
PD.ropeBasket = R => m => { m.mat(MAT.THATCH, [0.7, 0.58, 0.38], 0.5); m.lathe([[0.2, 0], [0.3, 0.1], [0.32, 0.4], [0.3, 0.42]], 9, 1); at(m, 0, 0.38, 0, 0, () => PD.ware.rope(m, R)); at(m, 0.05, 0.46, 0.02, 1, () => PD.ware.rope(m, R)); addBoxCollider(m, -0.32, -0.32, 0.32, 0.32, 0, 0.5); };
// a standing floor lantern / lamp on a post for a trade room (glow only)
PD.lampPost = m => { m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.04, 0, -0.04, 0.04, 1.3, 0.04); m.box(-0.15, 0, -0.15, 0.15, 0.05, 0.15); at(m, 0, 1.3, 0, 0, () => PD.ware.lantern(m, { pick: a => a[0] })); addBoxCollider(m, -0.15, -0.15, 0.15, 0.15, 0, 1.4); };

// a high shelf of crucibles, jugs and ironware for a tall room, and the helper that hangs a run of them where no window is
PD.highShelf = (R, w) => (m, hh) => {
  m.mat(MAT.PLANKS, COL.woodDark); m.box(-w / 2, -0.04, -0.3, w / 2, 0, 0); m.mat(MAT.METAL, COL.black); for (const sx of [-0.4, 0.4]) m.box(sx * w - 0.02, -0.25, -0.28, sx * w + 0.02, -0.04, -0.24);
  let x = -w / 2 + 0.15; const pool = ['pot', 'jar', 'flask', 'rope', 'tools', 'jar', 'demijohn', 'lantern'];
  while (x < w / 2 - 0.2) { const k = R.pick(pool), ww = WARE_W[k] || 0.25; at(m, x + ww / 2, 0, -0.14, R() * 6, () => PD.ware[k](m, R)); x += ww + 0.06; }
};
function pHigh(P, room, side, y, w, draw, name) {
  const hor = side === 'n' || side === 's', a = room.in, edge = side === 'n' ? room.z0 : side === 's' ? room.z1 : side === 'w' ? room.x0 : room.x1; let n = 0;
  const wins = P.windows.filter(q => q.room === room && (q.wall.ax === 'x') === hor && Math.abs(q.wall.c - edge) < 0.01).map(q => q.pos);
  for (let u = (hor ? a.x0 : a.z0) + w / 2 + 0.1; u + w / 2 < (hor ? a.x1 : a.z1); u += w + 0.15) {
    if (wins.some(p => Math.abs(p - u) < 0.95 + w / 2)) continue;
    if (pHang(P, room, side, u, w, y, y + 0.5, draw(w), name + side + n, { pivot: y })) n++;
  }
  return n;
}
