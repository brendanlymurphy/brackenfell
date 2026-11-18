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

  // [fx3] a wall of more than 12 m2 that faces a street, a lane or a yard has an opening: where the spec gives it none, a window at a hash-chosen place (the room behind follows the shell). A wall with a house within 1.6 m of it is a party wall and is left.
  const inBox = (o, x, z) => { if (!o.w) return false; const l = worldToSite(o, x, z); return Math.abs(l[0]) < o.w / 2 + 0.05 && Math.abs(l[1]) < o.d / 2 + 0.05; };
  for (const st of SITES) { const h = HOUSES[st.id]; if (!h || !st.w || st.id === 'tower' || st.id === 'barn' || st.id === 'mill') continue;
    const up = (KIT_STYLE[st.id] && KIT_STYLE[st.id].up) || (h.up ? 1 : 0), eave = 3 * (up ? 2 : 1); h.windows = h.windows || [];
    for (const wn of ['back', 'left', 'right']) {
      const L = wn === 'back' ? st.w : st.d; if (L * eave <= 12 || h.windows.some(o => o.wall === wn) || (h.doors || []).some(o => o.wall === wn)) continue;
      const nrm = WALLS[wn].n, off = wn === 'back' ? st.d / 2 : st.w / 2, probe = [0, 1].map(k => { const t = (k ? 0.3 : -0.3) * L, lx = wn === 'back' ? t : nrm[0] * (off + 1.6), lz = wn === 'back' ? off + 1.6 : t; return siteToWorld(st, lx, lz); });
      if (probe.some(q => SITES.some(o => o !== st && inBox(o, q[0], q[1])))) continue;
      const hh = idSeed(st.id + wn), pos = (((hh % 1000) / 1000) - 0.5) * Math.min(L - 2.4, L * 0.5); h.windows.push({ wall: wn, pos: +pos.toFixed(2), w: 0.9 });
    }
  }
})();

// [fx2] ── roof of every shell: covering, pitch, tone, sag and eaves, by district and by building (docs/TOWNPLAN.md section 3) ──
// The generated roof used one texture (weathered wood shingle) at one pitch whatever the spec said ('thatch' was never drawn). Now: stone slate in the Market Place and Chapelgate,
// thatch in Westgate and Wharfside, wood shingle at the river; each building takes its own pitch, tone, ridge sag and overhang out of its district's range, by a hash of its id.
const SHELL_TONES = {      // [fx2] roofs must read as different coverings from above: cut slate (cool dark blue-grey), stone slate (pale, lichened), thatch (warm grey-brown), shingle (silvered wood); tints above 1 lift the dark scanned albedos
  slate: [[0.9, 0.98, 1.15], [0.78, 0.86, 1.02], [1.0, 1.05, 1.18], [0.84, 0.92, 1.1]],      // [fx3] lighter: the first set read near-black from above
  tile: [[1.0, 0.72, 0.6], [0.88, 0.62, 0.52], [1.08, 0.8, 0.64], [0.8, 0.58, 0.5]],
  stoneslate: [[1.5, 1.5, 1.36], [1.3, 1.32, 1.2], [1.62, 1.55, 1.38], [1.4, 1.42, 1.3]],
  thatch: [[1.7, 1.42, 0.98], [1.5, 1.26, 0.88], [1.85, 1.58, 1.08]],
  shingle: [[1.3, 1.27, 1.2], [1.12, 1.1, 1.04], [1.42, 1.38, 1.3]],
};
const SHELL_FORMS = {      // chance per house of each added form; the districts that read as crowded and working get the most
  wharfside: { outshut: 0.5, stair: 0.4, stack: 0.35, rack: 0.5, vent: 0.14 },
};
function shellDistrict(x, z) {
  if (z < -42) return 'chapelgate'; if (z > 34) return 'wharfside'; if (x > 56) return 'riverside'; if (x < -50) return 'westgate'; return 'market';
}
const LIME = { cream: [0.513, 0.486, 0.414], grey: [0.468, 0.468, 0.441], ochre: [0.504, 0.423, 0.297], pink: [0.486, 0.414, 0.369], sage: [0.432, 0.459, 0.405], bone: [0.513, 0.495, 0.441], dun: [0.29, 0.262, 0.205] };      // limewash is never white: dirty, at most about 0.8
const SHELL_WALL = {      // [chance of limewash over the planks, chance of a stone ground floor, limewash tones, plank tone]
  market: [0.6, 0.75, ['cream', 'grey', 'ochre', 'pink', 'bone', 'sage'], [1, 1, 1]],
  chapelgate: [0.5, 0.95, ['grey', 'dun', 'bone', 'grey'], [0.8, 0.78, 0.76]],
  wharfside: [0.0, 0.2, [], [0.62, 0.6, 0.58]],
  riverside: [0.1, 0.4, ['grey', 'dun'], [0.66, 0.62, 0.58]],
  westgate: [0.85, 0.3, ['dun', 'cream', 'ochre', 'bone'], [1, 1, 1]],
};
const SHELL_DIST = {      // kind, pitches (degrees), sag (m), eaves overhang (m)
  market: { kind: 'slate', mix: [['slate', 0.55], ['tile', 0.28], ['stoneslate', 0.17]], pitch: [54, 58, 61, 56, 52, 60], sag: [0.04, 0.1], ov: [0.45, 0.7] },
  chapelgate: { kind: 'slate', mix: [['stoneslate', 0.62], ['slate', 0.2], ['thatch', 0.18]], pitch: [46, 49, 52, 47], sag: [0.05, 0.12], ov: [0.4, 0.6] },
  wharfside: { kind: 'thatch', alt: 'shingle', mix: [['thatch', 0.55], ['shingle', 0.33], ['stoneslate', 0.12]], pitch: [40, 43, 46, 44], sag: [0.06, 0.14], ov: [0.5, 0.75] },
  riverside: { kind: 'shingle', mix: [['shingle', 0.5], ['thatch', 0.24], ['tile', 0.26]], pitch: [44, 48, 51], sag: [0.03, 0.09], ov: [0.45, 0.65] },
  westgate: { kind: 'thatch', mix: [['thatch', 0.58], ['stoneslate', 0.27], ['shingle', 0.15]], pitch: [42, 45, 48, 44], sag: [0.05, 0.14], ov: [0.5, 0.8] },
};
const SHELL = {         // per-building overrides (kind, pitch, tone index, sag, ov, lime: tone name or false, wall: plank tone, ground)
  chapel: { kind: 'slate', pitch: 56, tone: 0, sag: 0.05, ov: 0.45, ground: 'stone', wall: [1, 1, 1] },
  // Market Place: each front its own (shop alley kept as the floor of detail; they differ in tone and structure)
  inn: { kind: 'slate', pitch: 57, tone: 2, sag: 0.1, ov: 0.65, lime: 'cream', ground: 'stone', dormers: 2, dormerU: [-5.6, 5.4], cross: [{ u: -0.3, w: 5.4 }] },
  smithy: { kind: 'slate', pitch: 50, tone: 5, sag: 0.06, ov: 0.5, wall: [0.66, 0.64, 0.62], ground: 'stone', soot: true, cart: true },
  store: { kind: 'slate', pitch: 60, tone: 3, sag: 0.09, ov: 0.55, lime: 'ochre', ground: 'stone', dormers: 1 },
  elder: { lime: 'grey', ground: 'stone', pitch: 55, face: true },
  'in.114': { forms: { stair: 1, outshut: 0, stack: 0, rack: 0.7, vent: 0 }, kind: 'thatch', tone: 1 }, 'in.127': { forms: { vent: 1, stack: 1, outshut: 0, stair: 0, rack: 0 }, kind: 'shingle', tone: 1, wall: [0.5, 0.48, 0.46] },
  'in.04': { face: true }, 'in.10': { face: true }, 'in.40': { face: true }, 'in.41': { face: true }, 'in.42': { face: true },
  herbalist: { lime: 'pink', ground: 'plaster', pitch: 53, face: true },
  weaver: { wall: [0.85, 0.82, 0.78], ground: 'plaster', pitch: 58 },
  draper: { lime: 'dun', ground: 'plaster', pitch: 56 },
  // [fx3] Wharfside, one treatment per house (docs/PEOPLE.md: who lives there and what they can afford): tarred boards, wide silvered boards with a patched panel, limewash, a stone ground storey, daub between posts
  'in.111': { wall: [0.46, 0.43, 0.4], treat: 'tar', ground: 'plaster' }, 'in.113': { wall: [1.3, 1.2, 1.05], treat: 'wide', ground: 'plaster' }, 'in.115': { lime: 'cream', treat: 'lime', ground: 'plaster' },
  'in.20': { wall: [0.74, 0.72, 0.68], ground: 'stone' }, 'in.23': { lime: 'ochre', treat: 'wattle', frame: 1, ground: 'plaster' }, 'in.34': { lime: 'grey', treat: 'lime', ground: 'plaster' },
  'in.36': { wall: [1.2, 1.12, 1.0], ground: 'stone', stoneMat: 'MI_Rubble_Wall', treat: 'wide' }, 'in.37': { lime: 'dun', treat: 'wattle', frame: 2, ground: 'plaster' }, 'in.38': { wall: [1.4, 1.42, 1.44], treat: 'wide', ground: 'plaster' },
  'in.51': { lime: 'bone', ground: 'stone' }, 'in.60': { wall: [0.42, 0.4, 0.38], treat: 'tar', ground: 'plaster' },
  'shop.n2': { wall: [1, 1, 1], pitch: 61 }, 'shop.s0': { lime: 'dun', pitch: 57 }, 'shop.s1': { wall: [0.78, 0.76, 0.74], ground: 'stone', pitch: 53 },
};
const _shellMemo = {};
function shellStyle(site, spec) {
  if (_shellMemo[site.id]) return _shellMemo[site.id];
  const dn = shellDistrict(site.x, site.z), D = SHELL_DIST[dn], R = rng((Math.round(site.x * 13) * 7919 + Math.round(site.z * 17) * 104729 + 1) | 0), O = SHELL[site.id] || {};
  // [fx3] a dominant covering and one or two minority ones per district, picked by the house's own hash (wealth and age show in which)
  let kind = O.kind; if (!kind) { const q = R(); kind = D.kind; if (D.mix) { let a = 0; for (const [k, pr] of D.mix) { a += pr; if (q < a) { kind = k; break; } } } else if (D.alt && q < 0.4) kind = D.alt; }
  if (kind === 'slate' && dn === 'chapelgate') kind = 'stoneslate';
  const RK = { slate: [INF_SL, 3.6, 0.14], stoneslate: [INF_SL, 4.0, 0.14], thatch: [INF_TH, 1.6, 0.36], shingle: [INF_S, 1.25, 0.1], tile: [INF_S, 2.0, 0.12] }[kind] || [INF_S, 1.25, 0.1], tones = SHELL_TONES[kind], r = (a, b) => a + (b - a) * R();
  const out = { dist: dn, kind, pitch: O.pitch || D.pitch[(R() * D.pitch.length) | 0], tint: tones[(O.tone !== undefined ? O.tone : (R() * tones.length) | 0) % tones.length], sag: O.sag !== undefined ? O.sag : r(D.sag[0], D.sag[1]), ov: O.ov || r(D.ov[0], D.ov[1]) };
  out.mat = RK[0]; out.ts = RK[1]; out.thick = RK[2]; out.thatch = kind === 'thatch'; out.patch = R();
  out.tint = out.tint.map(v => Math.min(2, v * (0.94 + R() * 0.1)));
  const W = SHELL_WALL[dn], jit = v => Math.min(O.wall ? 1.45 : 1, v * (0.96 + R() * 0.08));
  const limeName = O.lime !== undefined ? O.lime : O.wall ? false : (W[2].length && R() < W[0] ? W[2][(R() * W[2].length) | 0] : false), plank = O.wall || W[3];
  out.treat = O.treat; out.dormers = O.dormers; out.dormerU = O.dormerU; out.cross = O.cross; out.forms = O.forms; out.face = O.face || (typeof WHARF !== 'undefined' && WHARF.houses.some(h => h[0] === site.id));      // [fx2] houses of the re-sited lower town show a real face on their free side walls
   out.jetty = O.jetty !== undefined ? O.jetty : (dn === 'market' || dn === 'chapelgate' || dn === 'riverside') && R() < 0.6 ? 0.34 + R() * 0.2 : 0; out.frame = O.frame !== undefined ? O.frame : (R() * 3) | 0; out.chimSize = 0.38 + R() * 0.24; out.chimUp = R() * 0.9; out.soot = O.soot; out.cart = O.cart;
  const SK = dn === 'market' ? ['grey', 'warm', 'dark', 'warm'] : ['grey', 'warm', 'dark', 'rubble', 'rubble'], sk = SK[(R() * SK.length) | 0]; out.stoneTint = { grey: [0.82, 0.84, 0.86], warm: [1, 0.86, 0.68], dark: [0.6, 0.6, 0.58], rubble: [1, 0.96, 0.9] }[sk].map(v => v * (0.95 + R() * 0.1)); out.stoneMat = O.stoneMat || (sk === 'rubble' ? 'MI_Rubble_Wall' : undefined);
  out.lime = !!limeName; out.wallTint = (limeName ? LIME[limeName] : plank).map(jit); out.ground = O.ground || (R() < W[1] ? 'stone' : 'plaster');
  return _shellMemo[site.id] = out;
}

// [fx2] ── what a front is made of besides its panels: door hood, down pipe and water butt, a lean-to, dormers, rain streaks, flaked patches, soot over the lamp ──
// Generated in the wall's own frame (u along the wall, y up, z outward) and added to the shell's batch; outside only.
function shellDress(c, b, frames, MS, o) {
  const { w, d, H, Ytop, tanP, st, site, SSt, openings, lift } = o, R = rng(Math.round(site.x * 31 + site.z * 57) + 9), EXT = { zone: 0, skyVis: 1 }, up = st.up || (site.infill && false), fl = Ytop > H + 0.5 ? 2 : 1;
  const wt = SSt.wallTint || [0.8, 0.77, 0.7], dk = (k) => wt.map(v => v * k), limed = !!SSt.lime || (!st.timber && st.ground !== 'stone'), gLimed = limed && !site.infill, Lm = Kit.defs.MI_Plaster ? 'MI_Plaster' : INF_T, WOOD = [0.2, 0.16, 0.13];
  const octa = (g2, x, y0, z, r, h, col) => { for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = (i + 1) * Math.PI / 4, p0 = [x + Math.cos(a0) * r, 0, z + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, 0, z + Math.sin(a1) * r]; g2.quad(W_, [p0[0], y0, p0[2]], [p1[0], y0, p1[2]], [p1[0], y0 + h, p1[2]], [p0[0], y0 + h, p0[2]], col, GPU.wood); } g2.quad(W_, [x - r * 0.7, y0 + h, z - r * 0.7], [x + r * 0.7, y0 + h, z - r * 0.7], [x + r * 0.7, y0 + h, z + r * 0.7], [x - r * 0.7, y0 + h, z + r * 0.7], [0.08, 0.1, 0.12], GPU.wood, [0, 1, 0]); };
  const g_pipe = (g6, u) => g6.beam(W_, [u, 0.3, 0.1], [u, Ytop - 0.05, 0.1], 0.04, [0.16, 0.15, 0.15]);
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
    const nS = 3 + (R() * 3 | 0); if (!(site.infill && fl < 2)) for (let i = 0; i < nS; i++) { const u = 0.4 + R() * (Lf - 0.8), len = 0.7 + R() * 1.4, wd = 0.05 + R() * 0.12; if ((openings[front] || []).some(q => u + wd > q.u0 - 0.2 && u < q.u1 + 0.2)) continue; g.quad(Lm, [u, Ytop - len, 0.014], [u + wd, Ytop - len, 0.014], [u + wd, Ytop - 0.02, 0.014], [u, Ytop - 0.02, 0.014], dk(0.72), [0, 0, 0.1, 0.1], [0, 0, 1]); }
    /* [fx3] the flat grey wet-below-the-sill patch and the bare-daub patches are gone: they floated as untextured shapes over stone and beams, with no fixing to the wall */
    if (gLimed) g.quad(Lm, [0, -0.2, 0.014], [Lf, -0.2, 0.014], [Lf, 0.42, 0.014], [0, 0.42, 0.014], dk(0.55), [0, 0, 0.1, 0.1], [0, 0, 1]);      // damp at the foot
    if (gLimed) for (const lp of (c.kDoorLamps || [])) if (lp.wn === 'front') g.quad(Lm, [lp.u - 0.2, lp.v + 0.15, 0.015], [lp.u + 0.2, lp.v + 0.15, 0.015], [lp.u + 0.1, lp.v + 0.9, 0.015], [lp.u - 0.1, lp.v + 0.9, 0.015], dk(0.4), [0, 0, 0.1, 0.1], [0, 0, 1]);      // soot above the lamp
    any = true; }
  if (any) put(front, g);
  // [fx3] a cellar the inside shows must be seen outside: a plank hatch in a timber coaming, or a barred grating let into the ground at the foot of the wall, on a free stretch of a side or the back
  { const CEL = { inn: 'hatch', elder: 'grate', chapel: 'grate', draper: 'hatch', 'in.33': 'grate', 'in.37': 'hatch' }[site.id];
    if (CEL && !(TEST && TEST.nocel)) {
      const others = SITES.filter(s5 => s5 !== site && s5.w), probe = (wn, u, z) => { const Wd = WALLS[wn], s0 = Wd.start(w, d), q = siteToWorld(site, s0[0] + Wd.u[0] * u + Wd.n[0] * z, s0[2] + Wd.u[2] * u + Wd.n[2] * z); return !others.some(o => { const l = worldToSite(o, q[0], q[1]); return Math.abs(l[0]) < o.w / 2 + 0.6 && Math.abs(l[1]) < o.d / 2 + 0.6; }); };
      let pick = null;
      for (const wn of ['back', 'right', 'left']) { const Lw = L(wn), exC = (openings[wn] || []).map(q => [q.u0, q.u1]); if (Lw < 3.2) continue;
        for (let u = Lw * 0.3, t = 0; t < 40 && !pick; t++, u += (t % 2 ? 1 : -1) * t * 0.2) { if (u < 1.0 || u > Lw - 1.0) continue; if (exC.some(q => u + 0.95 > q[0] - 0.3 && u - 0.95 < q[1] + 0.3)) continue; if (probe(wn, u, 1.3) && probe(wn, u - 0.9, 0.9) && probe(wn, u + 0.9, 0.9)) pick = { wn, u }; }
        if (pick) break; }
      if (pick) { const gc = GP(), ST = [0.46, 0.43, 0.39], M_ = 'MI_WoodTrim', u = pick.u;
        if (CEL === 'hatch') { const DK = [0.45, 0.4, 0.34]; gc.box(M_, u - 0.95, 0, 0.02, u + 0.95, 0.2, 0.16, DK); gc.box(M_, u - 0.95, 0, 0.16, u - 0.83, 0.2, 1.05, DK); gc.box(M_, u + 0.83, 0, 0.16, u + 0.95, 0.2, 1.05, DK);
          for (const sg of [-1, 1]) for (const k of [-0.3, -0.1, 0.1, 0.3]) gc.beam(M_, [u + sg * 0.41 + k, 0.2, 1.0], [u + sg * 0.41 + k, 1.0, 0.17], 0.095, [0.52, 0.47, 0.41]);
          gc.box(M_, u - 0.06, 0.55, 0.2, u + 0.06, 0.6, 0.3, [0.12, 0.11, 0.1]); }
        else { const z0 = 0.18, z1 = 0.98, a0 = u - 0.55, a1 = u + 0.55, kb = (x0, z0_, x1, z1_) => gc.box(INF_B, x0, -0.06, z0_, x1, 0.1, z1_, ST, [0, 0, 0.3, 0.2]);
          kb(a0 - 0.12, z0 - 0.12, a1 + 0.12, z0); kb(a0 - 0.12, z1, a1 + 0.12, z1 + 0.12); kb(a0 - 0.12, z0, a0, z1); kb(a1, z0, a1 + 0.12, z1);
          gc.quad(W_, [a0, -0.2, z0], [a1, -0.2, z0], [a1, -0.2, z1], [a0, -0.2, z1], [0.02, 0.02, 0.02], GPU.wood, [0, 1, 0]);
          for (let i = 0; i <= 8; i++) gc.beam(W_, [a0 + 0.02 + i * (a1 - a0 - 0.04) / 8, 0.05, z0], [a0 + 0.02 + i * (a1 - a0 - 0.04) / 8, 0.05, z1], 0.022, [0.12, 0.11, 0.1]);
          for (const zz of [(z0 + z1) / 2]) gc.beam(W_, [a0, 0.05, zz], [a1, 0.05, zz], 0.022, [0.12, 0.11, 0.1]); }
        b.add(gc.make('gen_cellar_' + (_gn++)), KH.xf(frames[pick.wn], 0, 0, 0, 1, 0), EXT); } } }
  // a smith's wall: soot over the forge side and under the eaves; a cart shed against a side wall
  if (SSt.soot) { const gs = GP(); for (const wn of ['front', 'left', 'right']) { const Lw = L(wn), gsw = GP(); for (let i = 0; i < 4; i++) { const u = 0.5 + R() * (Lw - 1.6), wd = 0.9 + R() * 1.3, h0 = Ytop - 0.15 - R() * 1.8; gsw.quad(Lm, [u, h0, 0.016], [u + wd, h0 + R() * 0.2, 0.016], [u + wd * 0.8, Ytop - 0.02, 0.016], [u + 0.1, Ytop - 0.02, 0.016], [0.16, 0.15, 0.14], [0, 0, 0.1, 0.1], [0, 0, 1]); } put(wn, gsw); } }
  if (SSt.cart) { const wn = 'right', Lw = L(wn), g4 = GP(), a = 0.3, e = Lw - 0.3, dd = 2.8, h0 = 2.6, h1 = 2.0; g4.quad(W_, [a, h0, 0], [e, h0, 0], [e, h1, dd], [a, h1, dd], [0.26, 0.21, 0.17], GPU.wood, [0, 1, 0.5]); g4.quad(W_, [a, h0 - 0.05, 0], [e, h0 - 0.05, 0], [e, h1 - 0.05, dd], [a, h1 - 0.05, dd], [0.14, 0.11, 0.09], GPU.wood, [0, -1, -0.5]);
    for (const u of [a + 0.05, (a + e) / 2, e - 0.05]) g4.beam(W_, [u, 0, dd - 0.08], [u, h1, dd - 0.08], 0.08, WOOD);
    const cx = (a + e) / 2; g4.box(W_, cx - 0.9, 0.55, 1.0, cx + 0.9, 0.7, 2.2, [0.9, 0.7, 0.5]); for (const sx of [-1, 1]) octa(g4, cx + sx * 0.95, 0.0, 1.6, 0.5, 0.06, [0.8, 0.6, 0.45]); g4.beam(W_, [cx - 0.9, 0.62, 1.6], [cx - 2.0, 0.3, 1.6], 0.05, WOOD);      // a cart under it, shafts to the ground
    put(wn, g4); }
  // a lean-to against a side wall that has no neighbour
  for (const wn of ['left', 'right']) if (R() < 0.22 && !(typeof infNeighbour === 'function' && infNeighbour(site, wn === 'right') > 0) && L(wn) > 4) {
    const g2 = GP(), a = 0.4, e = L(wn) - 0.4, dd = 1.9, h0 = 2.35, h1 = 1.85;
    g2.quad(W_, [a, h0, 0], [e, h0, 0], [e, h1, dd], [a, h1, dd], [0.3, 0.25, 0.2], GPU.wood, [0, 1, 0.5]); g2.quad(W_, [a, h0 - 0.05, 0], [e, h0 - 0.05, 0], [e, h1 - 0.05, dd], [a, h1 - 0.05, dd], [0.15, 0.12, 0.1], GPU.wood, [0, -1, -0.5]);
    for (const u of [a + 0.05, e - 0.05, (a + e) / 2]) g2.beam(W_, [u, 0, dd - 0.08], [u, h1, dd - 0.08], 0.06, WOOD);
    g2.box(W_, a, 0, 0.05, e, 0.5, 0.4, [0.3, 0.24, 0.17]);      // a woodpile under it
    put(wn, g2); }
  // a real face for a blank end that stands on a street or a lane: window with sill and shutters, an upper window, a hood, a bracket sign
  if (SSt.face) for (const wn of ['left', 'right', 'back']) {
    if (wn !== 'back' && typeof infNeighbour === 'function' && infNeighbour(site, wn === 'right') > 0) continue;
    const g3 = GP(), Lw = L(wn), SC = [[0.3, 0.38, 0.28], [0.42, 0.2, 0.16], [0.22, 0.3, 0.4], [0.36, 0.31, 0.22]], sc = SC[(R() * 4) | 0], win = (cu, y0, hw, hh) => {
      g3.quad('MI_WindowGlass', [cu - hw, y0, 0.012], [cu + hw, y0, 0.012], [cu + hw, y0 + hh, 0.012], [cu - hw, y0 + hh, 0.012], [0.45, 0.5, 0.55], [0, 0, 1, 1], [0, 0, 1]);
      g3.box(W_, cu - hw - 0.07, y0 - 0.08, 0.0, cu + hw + 0.07, y0, 0.16, [0.46, 0.44, 0.4]); g3.box(W_, cu - hw - 0.06, y0 + hh, 0.0, cu + hw + 0.06, y0 + hh + 0.1, 0.07, WOOD);
      g3.box(W_, cu - hw - 0.06, y0, 0.0, cu - hw, y0 + hh, 0.07, WOOD); g3.box(W_, cu + hw, y0, 0.0, cu + hw + 0.06, y0 + hh, 0.07, WOOD); g3.box(W_, cu - 0.025, y0, 0.0, cu + 0.025, y0 + hh, 0.05, WOOD);
      g3.box(W_, cu - hw - 0.52, y0, 0.03, cu - hw - 0.07, y0 + hh, 0.07, sc); g3.box(W_, cu + hw + 0.07, y0, 0.03, cu + hw + 0.52, y0 + hh, 0.07, sc); };
    const exC = (openings[wn] || []).map(q => (q.u0 + q.u1) / 2), okC = c0 => exC.every(e => Math.abs(e - c0) > 1.9);      // [fx3] the face never stands beside a window the wall already has (a spec window, the M1 one, a planned one): it moves to a clear place or is left out
    let cu = Lw * (0.35 + R() * 0.3); if (!okC(cu)) { let best = null; for (let t = 0.9; t < Lw - 0.9; t += 0.3) if (okC(t) && (best === null || Math.abs(t - cu) < Math.abs(best - cu))) best = t; cu = best; }
    if (cu !== null) win(cu, 1.0, 0.45, 1.15);
    const upC = wn === 'back' ? Array.from({ length: Math.max(2, Math.round(w / 2)) }, (_, i) => (i + 0.5) * w / Math.max(2, Math.round(w / 2))).filter((_, i) => i % 2 === 1) : [Lw * 0.5];
    if (fl > 1 && upC.every(e => Math.abs(e - Lw * 0.5) > 1.9)) win(Lw * 0.5, H + 0.95, 0.42, 1.1);
    if (cu === null) cu = Lw * 0.5;
    if (R() < 0.6) { const bx0 = cu < Lw / 2 ? cu + 1.4 : cu - 1.4; g3.beam(W_, [bx0, 2.45, 0.02], [bx0, 2.45, 0.9], 0.04, WOOD); g3.quad(W_, [bx0 - 0.28, 1.65, 0.8], [bx0 + 0.28, 1.65, 0.8], [bx0 + 0.28, 2.3, 0.8], [bx0 - 0.28, 2.3, 0.8], [0.34, 0.24, 0.14], GPU.wood, [1, 0, 0]); }      // a trade board on a bracket
    put(wn, g3); }
  // [fx2] silhouette: a house is not one box. Per district, a catslide outshut, an outside stair to a loft door with a hoist, a gable chimney stack, a drying rack, a smoke louvre (all outside the footprint; near weight, small parts)
  if (SHELL_FORMS[SSt.dist] && site.id !== 'inn') {
    const FM = Object.assign({}, SHELL_FORMS[SSt.dist], SSt.forms || {}), RF = rng(Math.round(site.x * 53 + site.z * 29) + 77), others = SITES.filter(s5 => s5 !== site && s5.w && s5.id !== 'tower');
    const free = (wn, u0, u1, zd) => { const Wd = WALLS[wn], s0 = Wd.start(w, d); for (let i = 0; i <= 4; i++) for (let j = 0; j <= 3; j++) { const u = u0 + (u1 - u0) * i / 4, z = 0.3 + (zd - 0.3) * j / 3, lx = s0[0] + Wd.u[0] * u + Wd.n[0] * z, lz = s0[2] + Wd.u[2] * u + Wd.n[2] * z, wp = siteToWorld(site, lx, lz); for (const s5 of others) { const dx = wp[0] - s5.x, dz = wp[1] - s5.z, cc = Math.cos(s5.yaw), sn = Math.sin(s5.yaw), uu = dx * cc + dz * sn, vv = -dx * sn + dz * cc; if (Math.abs(uu) < s5.w / 2 + 0.3 && Math.abs(vv) < s5.d / 2 + 0.3) return false; } } return true; };
    const wallCol = SSt.wallTint || [0.62, 0.6, 0.58], yRidge = Ytop + d / 2 * tanP, used = {};
    const tri2 = (g5, m5, A, B, C, col) => { g5.tri(m5, A, B, C, col, [0, 0, 1.6, 1.6], [0, 0, 0]); };
    // 1: catslide outshut on the back (or a side) under a low roof of the same covering
    if (RF() < FM.outshut) for (const wn of ['back', RF() < 0.5 ? 'left' : 'right']) {
      const Lw = L(wn), len = Math.min(Lw - 0.8, Lw * (0.55 + RF() * 0.25)), a = wn === 'back' ? 0.2 + RF() * (Lw - len - 0.4) : Lw * 0.15, zd = 1.5 + RF() * 0.5, yA = Math.min(H - 0.15, 2.3), yB = 1.35 + RF() * 0.2;
      if (len < 2 || (wn !== 'back' && infNeighbour && infNeighbour(site, wn === 'right') > 0) || !free(wn, a, a + len, zd + 0.5)) continue;
      const go = GP(), RM = SSt.mat, th = SSt.thatch ? 0.3 : 0.1, wc = wallCol.map(v => v * 0.9);
      go.quad(INF_T, [a, 0, zd], [a + len, 0, zd], [a + len, yB, zd], [a, yB, zd], wc, [0, 0, len / 1.4, yB / 1.4], [0, 0, 1]);      // the outer wall
      for (const [u, nm] of [[a, -1], [a + len, 1]]) { go.tri(INF_T, [u, 0, 0], [u, 0, zd], [u, yB, zd], wc, [0, 0, 1, 1], [nm, 0, 0]); go.tri(INF_T, [u, 0, 0], [u, yB, zd], [u, yA, 0], wc, [0, 0, 1, 1], [nm, 0, 0]); }
      const rz = zd + 0.4, ry = yB - 0.12, ra = a - 0.25, rb = a + len + 0.25, nrm = [0, 0.75, 0.66];
      go.quad(RM, [ra, yA + 0.05, -0.0], [rb, yA + 0.05, -0.0], [rb, ry, rz], [ra, ry, rz], SSt.tint, [0, 0, (rb - ra) / SSt.ts, Math.hypot(rz, yA - ry) / SSt.ts], nrm);
      go.quad(RM, [rb, ry, rz], [ra, ry, rz], [ra, ry - th, rz], [rb, ry - th, rz], SSt.tint.map(v => v * 0.7), [0, 0, (rb - ra) / SSt.ts, 0.1], [0, -0.3, 1]);
      go.quad(W_, [ra, ry - th, rz], [rb, ry - th, rz], [rb, yA - 0.02, 0.0], [ra, yA - 0.02, 0.0], [0.17, 0.14, 0.11], GPU.wood, [0, -1, 0]);      // the soffit
      const du = a + len * (0.25 + RF() * 0.4); go.box(W_, du - 0.45, 0, zd - 0.01, du + 0.45, 1.15, zd + 0.1, [0.2, 0.17, 0.14]); go.box(W_, du - 0.5, 1.15, zd - 0.01, du + 0.5, 1.25, zd + 0.14, [0.28, 0.23, 0.19]);      // a plank door in the outer wall
      put(wn, go); used.outshut = wn; break; }
    // 2: an outside stair to a loft door in a gable end, a hoist beam over it
    if (RF() < FM.stair) for (const wn of ['left', 'right']) {
      const Lw = L(wn); if (Lw < 4.6 || used.outshut === wn || (infNeighbour && infNeighbour(site, wn === 'right') > 0) || !free(wn, 0.1, Lw - 0.1, 1.2)) continue;
      const g6 = GP(), n = 8, run = 0.23, rise = 2.3 / n, cu = Lw / 2, dirS = RF() < 0.5 ? -1 : 1, u0 = cu - dirS * (n * run + 0.3);
      for (let i = 0; i < n; i++) { const ua = u0 + dirS * i * run, ub = ua + dirS * run; g6.box(W_, Math.min(ua, ub), 0, 0.02, Math.max(ua, ub), rise * (i + 1), 0.85, [0.42, 0.37, 0.32]); }
      g6.box(W_, cu - 0.55, 2.2, 0.02, cu + 0.55, 2.3, 0.9, [0.4, 0.34, 0.28]);      // landing
      g6.beam(W_, [u0, 0.9, 0.84], [cu - dirS * 0.5, 3.2, 0.84], 0.05, WOOD); for (const u of [u0, cu - dirS * 0.5]) g6.beam(W_, [u, 0, 0.84], [u, u === u0 ? 0.95 : 3.2, 0.84], 0.06, WOOD);
      g6.box(W_, cu - 0.42, 2.3, 0.0, cu + 0.42, 3.55, 0.06, [0.16, 0.13, 0.11]); g6.box(W_, cu - 0.5, 3.55, 0.0, cu + 0.5, 3.65, 0.12, [0.26, 0.21, 0.17]);      // the loft door
      if (RF() < 0.7) { const hy = Math.min(yRidge - 0.5, 4.6); g6.beam(W_, [cu, hy, 0.0], [cu, hy, 1.25], 0.09, [0.24, 0.2, 0.16]); g6.beam(W_, [cu, hy, 0.15], [cu, hy - 0.5, 0.9], 0.05, [0.22, 0.18, 0.14]); g6.beam(W_, [cu, hy - 0.05, 1.18], [cu, hy - 1.7, 1.18], 0.015, [0.5, 0.45, 0.35]); g6.box(W_, cu - 0.05, hy - 1.9, 1.13, cu + 0.05, hy - 1.7, 1.23, [0.3, 0.3, 0.3]); }      // the hoist: a beam, a brace, a rope and a hook
      put(wn, g6); used.stair = wn; break; }
    // 3: a big stone stack outside a gable end
    if (RF() < FM.stack && !(TEST && TEST.nostack)) for (const wn of ['left', 'right']) {
      const Lw = L(wn); if (used.stair === wn || used.outshut === wn || (infNeighbour && infNeighbour(site, wn === 'right') > 0) || !free(wn, Lw * 0.5 - 0.6, Lw * 0.5 + 0.6, 0.9)) continue;
      const g7 = GP(), cu = Lw * (0.4 + RF() * 0.2), top = yRidge + 0.55, sc = (SSt.stoneTint || [0.8, 0.8, 0.8]).map((v, i) => v * 0.42 * [1, 0.95, 0.88][i]), uvS = [0, 0, 0.5, 1.4];      // [fx2] weathered stone, texture at stone scale (the stretched default read as a pale strip)
      g7.box(INF_B, cu - 0.5, -0.3, -0.02, cu + 0.5, 1.1, 0.75, sc, uvS); g7.box(INF_B, cu - 0.44, 1.1, -0.02, cu + 0.44, Ytop + 0.2, 0.66, sc, uvS); g7.box(INF_B, cu - 0.34, Ytop + 0.2, -0.02, cu + 0.34, top - 0.5, 0.5, sc, uvS); g7.box(INF_B, cu - 0.34, top - 0.5, -0.02, cu + 0.34, top, 0.5, sc.map(v => v * 0.55), uvS); g7.box(INF_B, cu - 0.44, top, -0.06, cu + 0.44, top + 0.1, 0.56, sc.map(v => v * 0.8), [0, 0, 0.3, 0.3]);      // a stack with set-offs and a sooted flue under a coping slab
      g7.box(INF_B, cu - 0.2, top + 0.1, 0.06, cu + 0.2, top + 0.34, 0.4, sc.map(v => v * 0.45), [0, 0, 0.2, 0.2]); g7.box(INF_B, cu - 0.12, top + 0.1, 0.14, cu + 0.12, top + 0.34, 0.32, [0.03, 0.03, 0.03], [0, 0, 0.1, 0.1]);      // the pot and its dark mouth
      put(wn, g7); used.stack = wn; break; }
    // 4: a drying rack for nets in the front yard, away from the door
    if (RF() < FM.rack && !(TEST && TEST.norack)) { const Lf2 = L(front), uc = dc > Lf2 / 2 ? 0.5 : Lf2 - 2.9, ok = free(front, uc, uc + 2.4, 1.9); if (ok) { const g8 = GP(), WD = [0.3, 0.24, 0.18], NT = [0.3, 0.26, 0.19];
      const pole = (A, B, r, c) => { const d3 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], dl = Math.hypot(d3[0], d3[1], d3[2]) || 1, f = d3.map(v => v / dl), ref = Math.abs(f[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = [f[1] * ref[2] - f[2] * ref[1], f[2] * ref[0] - f[0] * ref[2], f[0] * ref[1] - f[1] * ref[0]], l1 = Math.hypot(...e1), u1 = e1.map(v => v / l1 * r), e2 = [f[1] * u1[2] - f[2] * u1[1], f[2] * u1[0] - f[0] * u1[2], f[0] * u1[1] - f[1] * u1[0]], l2 = Math.hypot(...e2), u2 = e2.map(v => v / l2 * r);
        for (let i = 0; i < 5; i++) { const a0 = i / 5 * TAU, a1 = (i + 1) / 5 * TAU, o0 = [u1[0] * Math.cos(a0) + u2[0] * Math.sin(a0), u1[1] * Math.cos(a0) + u2[1] * Math.sin(a0), u1[2] * Math.cos(a0) + u2[2] * Math.sin(a0)], o1 = [u1[0] * Math.cos(a1) + u2[0] * Math.sin(a1), u1[1] * Math.cos(a1) + u2[1] * Math.sin(a1), u1[2] * Math.cos(a1) + u2[2] * Math.sin(a1)]; g8.quad(W_, [A[0] + o0[0], A[1] + o0[1], A[2] + o0[2]], [A[0] + o1[0], A[1] + o1[1], A[2] + o1[2]], [B[0] + o1[0], B[1] + o1[1], B[2] + o1[2]], [B[0] + o0[0], B[1] + o0[1], B[2] + o0[2]], c, GPU.wood); } };
      for (const u of [uc, uc + 2.4]) pole([u, 0, 1.6], [u, 2.0, 1.6], 0.045, WD); pole([uc - 0.1, 1.97, 1.6], [uc + 2.5, 1.97, 1.6], 0.035, WD); pole([uc - 0.1, 1.3, 1.6], [uc + 2.5, 1.3, 1.6], 0.028, WD);
      for (let i = 0; i < 6; i++) { const u = uc + 0.15 + i * 0.4, len = 0.55 + ((i * 7) % 5) * 0.1; g8.beam(W_, [u, 1.95, 1.6], [u + 0.02, 1.95 - len, 1.62], 0.011, NT); }
      g8.beam(W_, [uc + 0.1, 1.5, 1.62], [uc + 2.3, 1.45, 1.62], 0.008, NT);
      for (let i = 0; i < 4; i++) g8.box(W_, uc + 0.3 + i * 0.6, 1.9, 1.57, uc + 0.37 + i * 0.6, 1.97, 1.63, [0.42, 0.36, 0.25]);
      put(front, g8); } }
    // 5: a smoke louvre on the ridge
    if (RF() < FM.vent) { const gv = GP(), uu = Lf * (0.35 + RF() * 0.3); gv.box(W_, uu - 0.4, yRidge - 0.05, -d / 2 - 0.22, uu + 0.4, yRidge + 0.5, -d / 2 + 0.22, [0.22, 0.18, 0.14]); for (let k2 = 0; k2 < 3; k2++) gv.box(W_, uu - 0.45, yRidge + 0.05 + k2 * 0.15, -d / 2 - 0.27, uu + 0.45, yRidge + 0.09 + k2 * 0.15, -d / 2 + 0.27, [0.3, 0.25, 0.2]); gv.box(W_, uu - 0.5, yRidge + 0.5, -d / 2 - 0.3, uu + 0.5, yRidge + 0.58, -d / 2 + 0.3, [0.26, 0.21, 0.17]); put(front, gv); }
  }
  // [fx2] the back of a working inn: kitchen door under a pentice, a cellar hatch, a privy lean-to, stacked casks, small barred windows high up; the ends get high windows, a down pipe and a wood stack
  if (site.id === 'inn') {
    const CK = [0.34, 0.26, 0.18], BD = [0.62, 0.45, 0.3], hiWin = (g5, cu, y0) => { g5.quad(W_, [cu - 0.22, y0, 0.03], [cu + 0.22, y0, 0.03], [cu + 0.22, y0 + 0.36, 0.03], [cu - 0.22, y0 + 0.36, 0.03], [0.06, 0.068, 0.078], GPU.wood, [0, 0, 1]); g5.box(W_, cu - 0.3, y0 - 0.07, 0, cu + 0.3, y0, 0.14, [0.46, 0.44, 0.4]); g5.box(W_, cu - 0.28, y0 + 0.36, 0, cu + 0.28, y0 + 0.43, 0.09, WOOD); for (const f of [-0.12, 0, 0.12]) g5.box(W_, cu + f - 0.012, y0, 0.03, cu + f + 0.012, y0 + 0.36, 0.05, [0.2, 0.19, 0.18]); };
    { const wn = 'back', Lw = L(wn), gb = GP(), ku = Lw * 0.3, hu = Lw * 0.6, pu = Lw - 2.3;
      gb.box(W_, ku - 0.5, 0, 0.0, ku + 0.5, 2.05, 0.1, BD); for (const sg of [-1, 1]) gb.box(W_, ku + sg * 0.5 - (sg < 0 ? 0.12 : 0), 0, -0.0, ku + sg * 0.5 + (sg > 0 ? 0.12 : 0), 2.15, 0.14, WOOD); gb.box(W_, ku - 0.62, 2.05, 0, ku + 0.62, 2.2, 0.16, WOOD); gb.box(W_, ku - 0.6, 0, 0, ku + 0.6, 0.08, 0.7, [0.4, 0.38, 0.35]);      // the kitchen door and its step
      gb.quad(W_, [ku - 0.85, 2.5, 0.02], [ku + 0.85, 2.5, 0.02], [ku + 0.85, 2.15, 1.0], [ku - 0.85, 2.15, 1.0], [0.28, 0.23, 0.18], GPU.wood, [0, 1, 0.4]); gb.quad(W_, [ku - 0.85, 2.47, 0.02], [ku + 0.85, 2.47, 0.02], [ku + 0.85, 2.12, 1.0], [ku - 0.85, 2.12, 1.0], [0.15, 0.12, 0.1], GPU.wood, [0, -1, -0.4]); for (const sg of [-1, 1]) gb.beam(W_, [ku + sg * 0.78, 1.9, 0.03], [ku + sg * 0.78, 2.45, 0.95], 0.04, WOOD);      // the pentice
      gb.quad(W_, [hu - 0.65, 0.92, 0.02], [hu + 0.65, 0.92, 0.02], [hu + 0.65, 0.22, 1.2], [hu - 0.65, 0.22, 1.2], [0.58, 0.42, 0.28], GPU.wood, [0, 1, 0.7], true); gb.beam(W_, [hu, 0.93, 0.03], [hu, 0.23, 1.2], 0.05, WOOD); for (const sg of [-1, 1]) { gb.quad(W_, [hu + sg * 0.65, 0.92, 0.02], [hu + sg * 0.65, 0.22, 1.2], [hu + sg * 0.65, 0.0, 1.2], [hu + sg * 0.65, 0.0, 0.02], [0.4, 0.38, 0.35], GPU.wood, [sg, 0, 0], true); }      // the cellar hatch: two flaps on a slope with stone cheeks
      gb.box(W_, pu, 0, 0, pu + 1.3, 2.05, 1.15, [0.3, 0.24, 0.17]); gb.quad(W_, [pu - 0.1, 2.3, -0.02], [pu + 1.4, 2.3, -0.02], [pu + 1.4, 1.95, 1.3], [pu - 0.1, 1.95, 1.3], [0.2, 0.16, 0.12], GPU.wood, [0, 1, 0.4]); gb.quad(W_, [pu + 0.3, 0.05, 1.165], [pu + 0.95, 0.05, 1.165], [pu + 0.95, 1.7, 1.165], [pu + 0.3, 1.7, 1.165], [0.12, 0.1, 0.08], GPU.wood, [0, 0, 1]);      // the privy: a boarded lean-to with a plank door
      const cu0 = Lw * 0.8 - 0.2; octa(gb, cu0, 0, 0.5, 0.34, 0.8, CK); octa(gb, cu0 + 0.72, 0, 0.5, 0.34, 0.8, CK); octa(gb, cu0 + 0.36, 0.8, 0.5, 0.34, 0.8, CK); octa(gb, cu0 + 0.2, 0, 1.3, 0.34, 0.8, [0.3, 0.23, 0.16]);      // stacked casks
      for (const f of [0.1, 0.46, 0.86]) if (Math.abs(Lw * f - ku) > 1.1 && Math.abs(Lw * f - hu) > 1.2 && Lw * f < pu - 0.5) hiWin(gb, Lw * f, 2.15);
      put(wn, gb); }
    for (const wn of ['left', 'right']) { const Lw = L(wn), gs = GP(); for (const f of [0.22, 0.55, 0.85]) hiWin(gs, Lw * f, 2.1); g_pipe(gs, Lw * 0.04); gs.box(W_, Lw * 0.62, 0, 0.05, Lw * 0.62 + 1.6, 0.55, 0.45, [0.3, 0.24, 0.17]); octa(gs, Lw * 0.62 + 2.3, 0, 0.45, 0.34, 0.8, CK); put(wn, gs); }
  }
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
  'shop.s0': { awning: 'counter' }, 'shop.s1': {}, 'shop.s2': { lime: 'grey', ground: 'stone', awning: 'pentice' }, draper: { tone: 'dun' },
};
