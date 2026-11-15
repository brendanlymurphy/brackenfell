// ───────────────────────── the enterable infill houses: generic cottage interiors, each furnished a little differently ─────────────────────────
// Sites are chosen in 55b_infill.js (INF.enterIds); the shell is kit-built (71_kithouse.js, shared 'infill' batch, plank walls and shingle roof).
(function infillSpecs() {
  const VARIANTS = [
    { opt: { blanket: [0.45, 0.3, 0.2], shelfItems: ['jug', 'bowl', 'pot', 'bowl', 'cheese', 'jug'], rug: [0.45, 0.3, 0.2], tableItems: ['bowl', 'loaf', 'mug', 'cheese'], seats: 'stools' }, up: 0, ground: 'plaster' },
    { opt: { fur: true, blanket: [0.38, 0.3, 0.22], noShelf: true, tableItems: ['mug', 'bowl', 'candle'], rug: [0.5, 0.4, 0.3], bed2: true, blanket2: [0.4, 0.3, 0.25] }, up: 1, ground: 'stone' },
    { opt: { blanket: COL.green, shelfItems: ['pot', 'pot', 'jug', 'bowl', 'pot', 'jug'], rug: COL.green, tableItems: ['pot', 'bowl', 'jug'], seats: 'chairs' }, up: 0, ground: 'plaster' },
    { opt: { blanket: [0.5, 0.42, 0.3], shelfItems: ['book', 'candle', 'book', 'bottle', 'book', 'mug'], rug: COL.blue, tableItems: ['candle', 'book', 'mug', 'plate'], seats: 'chairs', cauldron: true }, up: 1, ground: 'plaster' },
    { opt: { blanket: COL.red, noShelf: true, tableItems: ['loaf', 'mug', 'plate', 'apple'], rug: COL.red, bed2: true, blanket2: COL.blue, seats: 'bench', tx: -0.9, tz: 0.3 }, up: 0, ground: 'stone' },
    { opt: { blanket: COL.purple, shelfItems: ['bottle', 'bowl', 'jug', 'pot', 'bottle', 'bowl'], rug: COL.purple, tableItems: ['bowl', 'bottle', 'candle', 'jug'], cauldron: true }, up: 1, ground: 'plaster' },
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
