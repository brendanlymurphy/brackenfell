// ───────────────────────── the enterable infill houses: generic cottage interiors, each furnished a little differently ─────────────────────────
// Sites are chosen in 55b_infill.js (INF.enterIds); the shell is kit-built (71_kithouse.js, shared 'infill' batch, plank walls and shingle roof).
// every roof of the town is the generated shingle roof (one texel density, one overhang, one ridge cap): the three buildings that still used the stretched kit roof tiles join it
for (const id of ['inn', 'smithy', 'chapel']) if (KIT_STYLE[id]) KIT_STYLE[id].shingle = true;
(function infillSpecs() {
  const VARIANTS = [
    { opt: { blanket: [0.45, 0.3, 0.2], shelfItems: ['jug', 'bowl', 'pot', 'bowl', 'cheese', 'jug'], rug: [0.45, 0.3, 0.2], tableItems: ['bowl', 'loaf', 'mug', 'cheese'], seats: 'stools' }, up: 0, ground: 'plaster' },
    { opt: { fur: true, blanket: [0.38, 0.3, 0.22], noShelf: true, tableItems: ['mug', 'bowl', 'candle'], rug: [0.5, 0.4, 0.3], bed2: true, blanket2: [0.4, 0.3, 0.25] }, up: 1, ground: 'stone' },
    { opt: { blanket: DYE.green, shelfItems: ['pot', 'pot', 'jug', 'bowl', 'pot', 'jug'], rug: DYE.green, tableItems: ['pot', 'bowl', 'jug'], seats: 'chairs' }, up: 0, ground: 'plaster' },
    { opt: { blanket: [0.5, 0.42, 0.3], shelfItems: ['book', 'candle', 'book', 'bottle', 'book', 'mug'], rug: DYE.blue, tableItems: ['candle', 'book', 'mug', 'plate'], seats: 'chairs', cauldron: true }, up: 1, ground: 'plaster' },
    { opt: { blanket: DYE.red, noShelf: true, tableItems: ['loaf', 'mug', 'plate', 'apple'], rug: DYE.red, bed2: true, blanket2: DYE.blue, seats: 'bench', tx: -0.9, tz: 0.3 }, up: 0, ground: 'stone' },
    { opt: { blanket: DYE.purple, shelfItems: ['bottle', 'bowl', 'jug', 'pot', 'bottle', 'bowl'], rug: DYE.purple, tableItems: ['bowl', 'bottle', 'candle', 'jug'], cauldron: true }, up: 1, ground: 'plaster' },
  ];
  (INF.enterIds || []).forEach((id, i) => {
    const h = INF.byId[id], v = VARIANTS[i % VARIANTS.length], dp = [0.9, -0.9, 0.9, -0.9, 0.9, -0.9][i % 6], ww = h.w;
    const win = dp > 0 ? -1.7 : 1.6;
    HOUSES[id] = {
      H: 2.4, walls: 'timber', roof: 'thatch', plaster: [1, 0.95, 0.88], shutter: [0.36, 0.42, 0.34],
      doors: [{ wall: 'front', pos: dp }], windows: [{ wall: 'front', pos: win }, { wall: 'back', pos: -1.3 }, { wall: 'back', pos: 1.4 }, { wall: 'right', pos: -0.9 }].filter(o => o.wall !== 'front' || Math.abs(o.pos) < ww / 2 - 1.0),
      interior(c) { cottageInterior(c, Object.assign({}, v.opt)); },
    };
    SITE[id].doorPos = dp; HOUSES[id].doors[0].pos = dp;
    KIT_STYLE[id] = { ground: v.ground, up: v.up, timber: true, shingle: true, vines: i % 3, balcony: v.up && ww >= 6 && i % 2 ? 'front' : undefined };
  });
})();

// [fx2] ── roof of every shell: covering, pitch, tone, sag and eaves, by district and by building (docs/TOWNPLAN.md section 3) ──
// The generated roof used one texture (weathered wood shingle) at one pitch whatever the spec said ('thatch' was never drawn). Now: stone slate in the Market Place and Chapelgate,
// thatch in Westgate and Wharfside, wood shingle at the river; each building takes its own pitch, tone, ridge sag and overhang out of its district's range, by a hash of its id.
const SHELL_TONES = {      // narrow bands: variety comes from pitch, height, ridge line and form first, colour last
  slate: [[0.74, 0.74, 0.75], [0.66, 0.66, 0.67], [0.78, 0.75, 0.7], [0.62, 0.62, 0.64]],
  thatch: [[1, 1, 1], [0.8, 0.78, 0.74], [0.9, 0.88, 0.82]],
  shingle: [[1, 1, 1], [0.72, 0.68, 0.64], [0.86, 0.86, 0.86]],
};
function shellDistrict(x, z) {
  if (z < -42) return 'chapelgate'; if (z > 34) return 'wharfside'; if (x > 56) return 'riverside'; if (x < -50) return 'westgate'; return 'market';
}
const LIME = { cream: [0.57, 0.54, 0.46], grey: [0.52, 0.52, 0.49], ochre: [0.56, 0.47, 0.33], pink: [0.54, 0.46, 0.41], sage: [0.48, 0.51, 0.45], bone: [0.57, 0.55, 0.49], dun: [0.49, 0.45, 0.38] };      // limewash is never white: dirty, at most about 0.8
const SHELL_WALL = {      // [chance of limewash over the planks, chance of a stone ground floor, limewash tones, plank tone]
  market: [0.6, 0.75, ['cream', 'grey', 'ochre', 'pink', 'bone', 'sage'], [1, 1, 1]],
  chapelgate: [0.5, 0.95, ['grey', 'dun', 'bone', 'grey'], [0.8, 0.78, 0.76]],
  wharfside: [0.0, 0.2, [], [0.62, 0.6, 0.58]],
  riverside: [0.1, 0.4, ['grey', 'dun'], [0.66, 0.62, 0.58]],
  westgate: [0.85, 0.3, ['dun', 'cream', 'ochre', 'bone'], [1, 1, 1]],
};
const SHELL_DIST = {      // kind, pitches (degrees), sag (m), eaves overhang (m)
  market: { kind: 'slate', pitch: [54, 58, 61, 56, 52, 60], sag: [0.04, 0.1], ov: [0.45, 0.7] },
  chapelgate: { kind: 'slate', pitch: [46, 49, 52, 47], sag: [0.05, 0.12], ov: [0.4, 0.6] },
  wharfside: { kind: 'thatch', alt: 'shingle', pitch: [40, 43, 46, 44], sag: [0.06, 0.14], ov: [0.5, 0.75] },
  riverside: { kind: 'shingle', pitch: [44, 48, 51], sag: [0.03, 0.09], ov: [0.45, 0.65] },
  westgate: { kind: 'thatch', pitch: [42, 45, 48, 44], sag: [0.05, 0.14], ov: [0.5, 0.8] },
};
const SHELL = {         // per-building overrides (kind, pitch, tone index, sag, ov, lime: tone name or false, wall: plank tone, ground)
  chapel: { kind: 'slate', pitch: 56, tone: 0, sag: 0.05, ov: 0.45, ground: 'stone', wall: [1, 1, 1] },
  // Market Place: each front its own (shop alley kept as the floor of detail; they differ in tone and structure)
  inn: { kind: 'slate', pitch: 57, tone: 2, sag: 0.1, ov: 0.65, lime: 'cream', ground: 'stone', dormers: 2, dormerU: [-5.6, 5.4], cross: [{ u: -0.3, w: 5.4 }] },
  smithy: { kind: 'slate', pitch: 50, tone: 5, sag: 0.06, ov: 0.5, wall: [0.66, 0.64, 0.62], ground: 'stone' },
  store: { kind: 'slate', pitch: 60, tone: 3, sag: 0.09, ov: 0.55, lime: 'ochre', ground: 'stone', dormers: 1 },
  elder: { lime: 'grey', ground: 'stone', pitch: 55, face: true },
  'in.04': { face: true }, 'in.10': { face: true }, 'in.40': { face: true }, 'in.41': { face: true }, 'in.42': { face: true },
  herbalist: { lime: 'pink', ground: 'plaster', pitch: 53, face: true },
  weaver: { wall: [0.85, 0.82, 0.78], ground: 'plaster', pitch: 58 },
  draper: { lime: 'bone', ground: 'plaster', pitch: 56 },
  'shop.n2': { wall: [1, 1, 1], pitch: 61 }, 'shop.s0': { lime: 'dun', pitch: 57 }, 'shop.s1': { wall: [0.78, 0.76, 0.74], ground: 'stone', pitch: 53 },
};
const _shellMemo = {};
function shellStyle(site, spec) {
  if (_shellMemo[site.id]) return _shellMemo[site.id];
  const dn = shellDistrict(site.x, site.z), D = SHELL_DIST[dn], R = rng((Math.round(site.x * 13) * 7919 + Math.round(site.z * 17) * 104729 + 1) | 0), O = SHELL[site.id] || {};
  const kind = O.kind || (D.alt && R() < 0.4 ? D.alt : D.kind), tones = SHELL_TONES[kind], r = (a, b) => a + (b - a) * R();
  const out = { dist: dn, kind, pitch: O.pitch || D.pitch[(R() * D.pitch.length) | 0], tint: tones[(O.tone !== undefined ? O.tone : (R() * tones.length) | 0) % tones.length], sag: O.sag !== undefined ? O.sag : r(D.sag[0], D.sag[1]), ov: O.ov || r(D.ov[0], D.ov[1]) };
  const slab = false;      // draw budget: the Market Place shows one slate material; the slabs (roof_slates_02) are Chapelgate's      // roof_slates_02: small irregular weathered slabs; roof_slates_03: grey cut slate
  out.mat = kind === 'slate' ? (slab ? INF_SS : INF_SL) : kind === 'thatch' ? INF_TH : INF_S; out.ts = kind === 'slate' ? (slab ? 4.0 : 3.6) : kind === 'thatch' ? 1.6 : 1.25;      // a course of slates shows about 18-20 cm out.thick = kind === 'thatch' ? 0.36 : kind === 'slate' ? 0.14 : 0.1; out.thatch = kind === 'thatch';
  out.tint = out.tint.map(v => Math.min(1, v * (0.94 + R() * 0.1)));
  const W = SHELL_WALL[dn], jit = v => Math.min(1, v * (0.96 + R() * 0.08));
  const limeName = O.lime !== undefined ? O.lime : O.wall ? false : (W[2].length && R() < W[0] ? W[2][(R() * W[2].length) | 0] : false), plank = O.wall || W[3];
  out.dormers = O.dormers; out.dormerU = O.dormerU; out.cross = O.cross; out.face = O.face; out.jetty = O.jetty !== undefined ? O.jetty : (dn === 'market' || dn === 'chapelgate' || dn === 'riverside') && R() < 0.6 ? 0.34 + R() * 0.2 : 0; out.frame = (R() * 3) | 0;
  const SK = dn === 'market' ? ['grey', 'warm', 'dark', 'warm'] : ['grey', 'warm', 'dark', 'rubble', 'rubble'], sk = SK[(R() * SK.length) | 0]; out.stoneTint = { grey: [0.82, 0.84, 0.86], warm: [1, 0.86, 0.68], dark: [0.6, 0.6, 0.58], rubble: [1, 0.96, 0.9] }[sk].map(v => v * (0.95 + R() * 0.1)); out.stoneMat = sk === 'rubble' ? 'MI_Rubble_Wall' : undefined;
  out.lime = !!limeName; out.wallTint = (limeName ? LIME[limeName] : plank).map(jit); out.ground = O.ground || (R() < W[1] ? 'stone' : 'plaster');
  return _shellMemo[site.id] = out;
}

// [fx2] ── what a front is made of besides its panels: door hood, down pipe and water butt, a lean-to, dormers, rain streaks, flaked patches, soot over the lamp ──
// Generated in the wall's own frame (u along the wall, y up, z outward) and added to the shell's batch; outside only.
function shellDress(c, b, frames, MS, o) {
  const { w, d, H, Ytop, tanP, st, site, SSt, openings, lift } = o, R = rng(Math.round(site.x * 31 + site.z * 57) + 9), EXT = { zone: 0, skyVis: 1 }, up = st.up || (site.infill && false), fl = Ytop > H + 0.5 ? 2 : 1;
  const wt = SSt.wallTint || [0.8, 0.77, 0.7], dk = (k) => wt.map(v => v * k), limed = !!SSt.lime || (!st.timber && st.ground !== 'stone'), gLimed = limed && !site.infill, Lm = Kit.defs.MI_Plaster ? 'MI_Plaster' : INF_T, WOOD = [0.2, 0.16, 0.13];
  const octa = (g2, x, y0, z, r, h, col) => { for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = (i + 1) * Math.PI / 4, p0 = [x + Math.cos(a0) * r, 0, z + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, 0, z + Math.sin(a1) * r]; g2.quad(W_, [p0[0], y0, p0[2]], [p1[0], y0, p1[2]], [p1[0], y0 + h, p1[2]], [p0[0], y0 + h, p0[2]], col, GPU.wood); } g2.quad(W_, [x - r * 0.7, y0 + h, z - r * 0.7], [x + r * 0.7, y0 + h, z - r * 0.7], [x + r * 0.7, y0 + h, z + r * 0.7], [x - r * 0.7, y0 + h, z + r * 0.7], [0.08, 0.1, 0.12], GPU.wood, [0, 1, 0]); };
  const put = (wn, g2, nm) => b.add(g2.make('gen_dress_' + (_gn++)), KH.xf(frames[wn], 0, 0, 0, 1, 0), EXT);
  const L = wn => WALLS[wn].len(w, d), doors = wn => (openings[wn] || []).filter(q => q.door), wins = wn => (openings[wn] || []).filter(q => !q.door);
  const front = 'front', Lf = L(front), df = doors(front)[0], dc = df ? (df.u0 + df.u1) / 2 : Lf / 2, dw = df ? (df.u1 - df.u0) : 1.1;
  const g = GP(); let any = false;
  // a hood over the front door: a pent of boards on two brackets
  if (df && R() < 0.55) { const hw = dw / 2 + 0.3; g.quad(W_, [dc - hw, 2.62, 0.02], [dc + hw, 2.62, 0.02], [dc + hw, 2.3, 0.85], [dc - hw, 2.3, 0.85], [0.26, 0.21, 0.17], GPU.wood, [0, 1, 0.3]); g.quad(W_, [dc - hw, 2.6, 0.02], [dc + hw, 2.6, 0.02], [dc + hw, 2.28, 0.83], [dc - hw, 2.28, 0.83], [0.17, 0.14, 0.11], GPU.wood, [0, -1, -0.3]);
    for (const sg of [-1, 1]) g.beam(W_, [dc + sg * (hw - 0.08), 2.0, 0.02], [dc + sg * (hw - 0.08), 2.52, 0.8], 0.04, WOOD); any = true; }
  // a down pipe and a water butt at the front corner
  if (R() < 0.4) { const cu = (R() < 0.5 ? 0.35 : Lf - 0.35); g.beam(W_, [cu, 0.55, 0.1], [cu, Ytop - 0.05, 0.1], 0.04, [0.16, 0.15, 0.15]); octa(g, cu, 0, 0.42, 0.32, 0.75, [0.3, 0.23, 0.17]); any = true; }
  // rain streaks under the eaves and a damp foot on limewashed walls; flaked patches where the wash has come off the daub
  if (limed) {
    const nS = 3 + (R() * 3 | 0); if (!(site.infill && fl < 2)) for (let i = 0; i < nS; i++) { const u = 0.4 + R() * (Lf - 0.8), len = 0.7 + R() * 1.4, wd = 0.05 + R() * 0.12; g.quad(Lm, [u, Ytop - len, 0.014], [u + wd, Ytop - len * 0.9, 0.014], [u + wd * 1.4, Ytop - 0.02, 0.014], [u - wd * 0.2, Ytop - 0.02, 0.014], dk(0.55), [0, 0, 0.1, 0.1], [0, 0, 1]); }
    if (fl > 1) for (const q of wins(front)) { const cu = (q.u0 + q.u1) / 2; g.quad(Lm, [cu - 0.3, H + 0.2, 0.014], [cu + 0.3, H + 0.2, 0.014], [cu + 0.2, H + 0.9, 0.014], [cu - 0.2, H + 0.9, 0.014], dk(0.82), [0, 0, 0.1, 0.1], [0, 0, 1]); }       // wet below the upper sills
    for (let i = 0; i < (site.infill && fl < 2 ? 0 : 1 + (R() * 2 | 0)); i++) { let u = R() * (Lf - 1), tries = 0; while (tries++ < 8 && (openings[front] || []).some(q => u + 0.9 > q.u0 - 0.3 && u < q.u1 + 0.3)) u = R() * (Lf - 1); if (tries > 8) continue; const y = site.infill ? H + 0.2 + R() * 1.6 : R() < 0.6 ? 0.1 + R() * 0.6 : 0.8 + R() * 1.8, pw = 0.3 + R() * 0.7, ph = 0.2 + R() * 0.45; g.quad(Lm, [u, y, 0.016], [u + pw, y + R() * 0.08, 0.016], [u + pw * 0.8, y + ph, 0.016], [u + 0.1, y + ph * 0.9, 0.016], [0.22, 0.17, 0.12], [0, 0, 0.1, 0.1], [0, 0, 1]); }       // bare daub
    if (gLimed) g.quad(Lm, [0, -0.2, 0.014], [Lf, -0.2, 0.014], [Lf, 0.42, 0.014], [0, 0.42, 0.014], dk(0.55), [0, 0, 0.1, 0.1], [0, 0, 1]);      // damp at the foot
    if (gLimed) for (const lp of (c.kDoorLamps || [])) if (lp.wn === 'front') g.quad(Lm, [lp.u - 0.2, lp.v + 0.15, 0.015], [lp.u + 0.2, lp.v + 0.15, 0.015], [lp.u + 0.1, lp.v + 0.9, 0.015], [lp.u - 0.1, lp.v + 0.9, 0.015], dk(0.4), [0, 0, 0.1, 0.1], [0, 0, 1]);      // soot above the lamp
    any = true; }
  if (any) put(front, g);
  // a lean-to against a side wall that has no neighbour
  for (const wn of ['left', 'right']) if (R() < 0.22 && !(typeof infNeighbour === 'function' && infNeighbour(site, wn === 'right') > 0) && L(wn) > 4) {
    const g2 = GP(), a = 0.4, e = L(wn) - 0.4, dd = 1.9, h0 = 2.35, h1 = 1.85;
    g2.quad(W_, [a, h0, 0], [e, h0, 0], [e, h1, dd], [a, h1, dd], [0.3, 0.25, 0.2], GPU.wood, [0, 1, 0.5]); g2.quad(W_, [a, h0 - 0.05, 0], [e, h0 - 0.05, 0], [e, h1 - 0.05, dd], [a, h1 - 0.05, dd], [0.15, 0.12, 0.1], GPU.wood, [0, -1, -0.5]);
    for (const u of [a + 0.05, e - 0.05, (a + e) / 2]) g2.beam(W_, [u, 0, dd - 0.08], [u, h1, dd - 0.08], 0.06, WOOD);
    g2.box(W_, a, 0, 0.05, e, 0.5, 0.4, [0.3, 0.24, 0.17]);      // a woodpile under it
    put(wn, g2); }
  // a real face for a blank end that stands on a street or a lane: window with sill and shutters, an upper window, a hood, a bracket sign
  if (SSt.face) for (const wn of ['left', 'right']) {
    if (typeof infNeighbour === 'function' && infNeighbour(site, wn === 'right') > 0) continue;
    const g3 = GP(), Lw = L(wn), SC = [[0.3, 0.38, 0.28], [0.42, 0.2, 0.16], [0.22, 0.3, 0.4], [0.36, 0.31, 0.22]], sc = SC[(R() * 4) | 0], win = (cu, y0, hw, hh) => {
      g3.quad('MI_WindowGlass', [cu - hw, y0, 0.012], [cu + hw, y0, 0.012], [cu + hw, y0 + hh, 0.012], [cu - hw, y0 + hh, 0.012], [0.45, 0.5, 0.55], [0, 0, 1, 1], [0, 0, 1]);
      g3.box(W_, cu - hw - 0.07, y0 - 0.08, 0.0, cu + hw + 0.07, y0, 0.16, [0.46, 0.44, 0.4]); g3.box(W_, cu - hw - 0.06, y0 + hh, 0.0, cu + hw + 0.06, y0 + hh + 0.1, 0.07, WOOD);
      g3.box(W_, cu - hw - 0.06, y0, 0.0, cu - hw, y0 + hh, 0.07, WOOD); g3.box(W_, cu + hw, y0, 0.0, cu + hw + 0.06, y0 + hh, 0.07, WOOD); g3.box(W_, cu - 0.025, y0, 0.0, cu + 0.025, y0 + hh, 0.05, WOOD);
      g3.box(W_, cu - hw - 0.52, y0, 0.03, cu - hw - 0.07, y0 + hh, 0.07, sc); g3.box(W_, cu + hw + 0.07, y0, 0.03, cu + hw + 0.52, y0 + hh, 0.07, sc); };
    const cu = Lw * (0.35 + R() * 0.3); win(cu, 1.0, 0.45, 1.15); if (fl > 1) win(Lw * 0.5, H + 0.95, 0.42, 1.1);
    if (R() < 0.6) { const bx0 = cu < Lw / 2 ? cu + 1.4 : cu - 1.4; g3.beam(W_, [bx0, 2.45, 0.02], [bx0, 2.45, 0.9], 0.04, WOOD); g3.quad(W_, [bx0 - 0.28, 1.65, 0.8], [bx0 + 0.28, 1.65, 0.8], [bx0 + 0.28, 2.3, 0.8], [bx0 - 0.28, 2.3, 0.8], [0.34, 0.24, 0.14], GPU.wood, [1, 0, 0]); }      // a trade board on a bracket
    put(wn, g3); }
  // a cross gable on the front slope: a tall gable face at the eaves line breaking it, its two roof planes meeting the main slope along the valleys
  for (const cg of (SSt.cross || [])) { const gg = GP(), ov = SSt.ov || 0.5, zf = -d / 2 - ov, yE = Ytop + lift - ov * tanP, gw = cg.w, u0 = cg.u, Ya = yE + gw / 2 * tanP, A = [u0, Ya, zf], E1 = [u0 - gw / 2, yE, zf], E2 = [u0 + gw / 2, yE, zf], Bk = [u0, Ya, zf + gw / 2], cc = wt.map(v => Math.min(0.85, v * 0.92));
    gg.tri(Lm, E1, E2, A, cc, [0, 0, 2.2, 2], [0, 0, -1]);                                    // the face
    gg.tri(SSt.mat || INF_S, E1, A, Bk, SSt.tint || [1, 1, 1], [0, 0, 2, 2], [-1, 1, 0]); gg.tri(SSt.mat || INF_S, A, E2, Bk, SSt.tint || [1, 1, 1], [0, 0, 2, 2], [1, 1, 0]);      // the roof planes
    gg.beam(W_, E1, A, 0.06, [0.2, 0.17, 0.14]); gg.beam(W_, A, E2, 0.06, [0.2, 0.17, 0.14]); gg.beam(W_, [u0 - gw * 0.3, yE + 0.05, zf - 0.02], [u0 + gw * 0.3, yE + 0.05, zf - 0.02], 0.08, WOOD); gg.beam(W_, [u0, yE + 0.05, zf - 0.02], [u0, Ya - 0.15, zf - 0.02], 0.06, WOOD);      // barge boards, sole beam, king post
    gg.box(W_, u0 - 0.6, yE + 0.55, zf - 0.04, u0 + 0.6, yE + 0.62, zf, [0.46, 0.44, 0.4]); gg.quad('MI_WindowGlass', [u0 - 0.5, yE + 0.62, zf - 0.015], [u0 + 0.5, yE + 0.62, zf - 0.015], [u0 + 0.5, yE + 1.5, zf - 0.015], [u0 - 0.5, yE + 1.5, zf - 0.015], [0.4, 0.45, 0.5], [0, 0, 1, 1], [0, 0, -1]);
    gg.box(W_, u0 - 0.56, yE + 0.62, zf - 0.06, u0 - 0.5, yE + 1.56, zf, WOOD); gg.box(W_, u0 + 0.5, yE + 0.62, zf - 0.06, u0 + 0.56, yE + 1.56, zf, WOOD); gg.box(W_, u0 - 0.56, yE + 1.5, zf - 0.06, u0 + 0.56, yE + 1.58, zf, WOOD);
    b.add(gg.make('gen_cross_' + (_gn++)), MS, EXT); }
  // dormers on the front slope of the roomier roofs
  const nD = SSt.dormers !== undefined ? SSt.dormers : fl > 1 && w >= 6.5 ? (w >= 11 ? 3 : R() < 0.4 ? 1 : 0) : 0;
  if (nD) { const gd = GP(), hs = d / 2, vf = -hs * 0.5, y0 = Ytop + lift + (hs - Math.abs(vf)) * tanP, fh = 0.95, hw = 0.55, rise = 0.5, Ld = (fh + rise) / tanP;
    for (let i = 0; i < nD; i++) { const u = SSt.dormerU ? SSt.dormerU[i] : nD === 1 ? (R() < 0.5 ? -1 : 1) * w * 0.2 : (i - (nD - 1) / 2) * w * 0.27, wc = wt.map(v => Math.min(0.85, v * 0.9));
      gd.quad(Lm, [u - hw, y0 - 0.05, vf], [u + hw, y0 - 0.05, vf], [u + hw, y0 + fh, vf], [u - hw, y0 + fh, vf], wc, [0, 0, 0.8, 0.7], [0, 0, -1]);      // the face
      gd.quad('MI_WindowGlass', [u - 0.3, y0 + 0.2, vf - 0.012], [u + 0.3, y0 + 0.2, vf - 0.012], [u + 0.3, y0 + fh - 0.12, vf - 0.012], [u - 0.3, y0 + fh - 0.12, vf - 0.012], [0.5, 0.55, 0.6], [0, 0, 1, 1], [0, 0, -1]);
      gd.box(W_, u - 0.36, y0 + 0.14, vf - 0.05, u + 0.36, y0 + 0.2, vf - 0.0, WOOD); gd.box(W_, u - 0.36, y0 + fh - 0.12, vf - 0.05, u + 0.36, y0 + fh - 0.06, vf, WOOD); gd.box(W_, u - 0.36, y0 + 0.14, vf - 0.05, u - 0.3, y0 + fh - 0.06, vf, WOOD); gd.box(W_, u + 0.3, y0 + 0.14, vf - 0.05, u + 0.36, y0 + fh - 0.06, vf, WOOD);
      const rf = [u, y0 + fh + rise, vf - 0.12], rb = [u, y0 + fh + rise, vf + Ld];
      for (const sg of [-1, 1]) { gd.quad(SSt.mat || INF_S, [u + sg * (hw + 0.14), y0 + fh - 0.02, vf - 0.14], [u + sg * (hw + 0.14), y0 + fh - 0.02, vf + Ld], rb, rf, SSt.tint || [1, 1, 1], [0, 0, 0.8, 0.8], [sg, 1, 0]); gd.tri(Lm, [u + sg * hw, y0 + fh, vf + 0.001], [u + sg * hw, y0 - 0.1, vf + Ld], [u + sg * hw, y0 + fh, vf + Ld], wc, [0, 0, 0.5, 0.5], [sg, 0, 0]); }
      gd.tri(Lm, [u - hw, y0 + fh, vf], [u + hw, y0 + fh, vf], [u, y0 + fh + rise, vf], wc, [0, 0, 0.5, 0.5], [0, 0, -1]); }
    b.add(gd.make('gen_dormer_' + (_gn++)), MS, EXT); }
}

function shellJetty(site, st) { const S = shellStyle(site, null); return site.infill && st.up ? S.jetty || 0 : 0; }      // [fx2] metres the upper storey of an infill house projects over the street (shell only)

// [fx2] the alley's six shops, each a different build (73b_alley.js reads this): all stone with an arch front, tarred board, pale limewash over a stone ground floor; awnings of three kinds
const ALLEY_LOOK = {
  'shop.n2': { tar: true, awning: 'pentice' }, 'shop.n3': { allstone: true, ground: 'stone', awning: 'counter' }, 'shop.n4': { lime: 'bone', ground: 'stone' },
  'shop.s0': { awning: 'counter' }, 'shop.s1': {}, 'shop.s2': { lime: 'grey', ground: 'stone', awning: 'pentice' },
};
