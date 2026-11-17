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
const SHELL_DIST = {      // kind, pitches (degrees), sag (m), eaves overhang (m)
  market: { kind: 'slate', pitch: [54, 58, 61, 56, 52, 60], sag: [0.04, 0.1], ov: [0.45, 0.7] },
  chapelgate: { kind: 'slate', pitch: [46, 49, 52, 47], sag: [0.05, 0.12], ov: [0.4, 0.6] },
  wharfside: { kind: 'thatch', alt: 'shingle', pitch: [40, 43, 46, 44], sag: [0.06, 0.14], ov: [0.5, 0.75] },
  riverside: { kind: 'shingle', pitch: [44, 48, 51], sag: [0.03, 0.09], ov: [0.45, 0.65] },
  westgate: { kind: 'thatch', pitch: [42, 45, 48, 44], sag: [0.05, 0.14], ov: [0.5, 0.8] },
};
const SHELL = {         // per-building overrides (kind, pitch, tone index, sag, ov)
  inn: { kind: 'slate', pitch: 57, tone: 2, sag: 0.1, ov: 0.65 },
  smithy: { kind: 'slate', pitch: 50, tone: 5, sag: 0.06, ov: 0.5 },
  store: { kind: 'slate', pitch: 60, tone: 3, sag: 0.09, ov: 0.55 },
  chapel: { kind: 'slate', pitch: 56, tone: 0, sag: 0.05, ov: 0.45 },
};
const _shellMemo = {};
function shellStyle(site, spec) {
  if (_shellMemo[site.id]) return _shellMemo[site.id];
  const dn = shellDistrict(site.x, site.z), D = SHELL_DIST[dn], R = rng((Math.round(site.x * 13) * 7919 + Math.round(site.z * 17) * 104729 + 1) | 0), O = SHELL[site.id] || {};
  const kind = O.kind || (D.alt && R() < 0.4 ? D.alt : D.kind), tones = SHELL_TONES[kind], r = (a, b) => a + (b - a) * R();
  const out = { dist: dn, kind, pitch: O.pitch || D.pitch[(R() * D.pitch.length) | 0], tint: tones[(O.tone !== undefined ? O.tone : (R() * tones.length) | 0) % tones.length], sag: O.sag !== undefined ? O.sag : r(D.sag[0], D.sag[1]), ov: O.ov || r(D.ov[0], D.ov[1]) };
  const slab = kind === 'slate' && R() < 0.45;      // roof_slates_02: small irregular weathered slabs; roof_slates_03: grey cut slate
  out.mat = kind === 'slate' ? (slab ? INF_SS : INF_SL) : kind === 'thatch' ? INF_TH : INF_S; out.ts = kind === 'slate' ? (slab ? 4.0 : 3.6) : kind === 'thatch' ? 1.6 : 1.25;      // a course of slates shows about 18-20 cm out.thick = kind === 'thatch' ? 0.36 : kind === 'slate' ? 0.14 : 0.1; out.thatch = kind === 'thatch';
  out.tint = out.tint.map(v => Math.min(1, v * (0.94 + R() * 0.1)));
  return _shellMemo[site.id] = out;
}
