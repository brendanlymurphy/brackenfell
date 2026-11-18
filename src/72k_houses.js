// ───────────────────────── layout families for ordinary houses and shops [c5] ─────────────────────────
// A house is not one plan with the furniture moved: its family is chosen from its trade, its wealth, its footprint and a per-site seed, and the family fixes the rooms, the
// stairs, the hearth, the ceiling height and the finishes. Six families: cottage (one room and a loft over its back part), hallchamber (an open hall, the chamber and a
// pantry behind, a solar over them), crosspassage (a through passage with the hall on one side, the service rooms and parlour on the other, a landing bridging the
// passage upstairs), shopfront (the shop with its counter, a living room behind, rooms above, a cellar when the keeper can afford one), workshop (the work room with
// its trade, the living room beside the roofed yard behind, a loft) and merchant (a tall hall, a counting room, a stair hall with a stair up and a stair down).
// The frame is the plan engine's: the street door at (0, 0) in the z = 0 wall, the house going away in +z. F.sx = +/-1 mirrors a layout about x = 0.
const HFAM = {}, HDESC = {};          // HDESC[site id] = { trade, fam, wealth } overrides (alley shops, Highfold); every other house is described by its name
const HNAMES = [[/cooper/i, 'cooper'], [/tanner/i, 'tanner'], [/potter/i, 'potter'], [/widow/i, 'widow'], [/fletcher/i, 'fletcher'], [/dyer/i, 'dyer'], [/wheelwright/i, 'wheelwright'], [/carpenter/i, 'carpenter'], [/mason/i, 'mason'], [/saddler/i, 'saddler'],
  [/rope/i, 'ropemaker'], [/basket/i, 'basketmaker'], [/shepherd/i, 'shepherd'], [/wood ?cutter/i, 'woodcutter'], [/glover/i, 'glover'], [/brewer/i, 'brewer'], [/scribe/i, 'scribe'], [/merchant/i, 'merchant'], [/cobbler/i, 'cobbler'], [/chandler/i, 'chandler'],
  [/tailor/i, 'tailor'], [/butcher/i, 'butcher'], [/baker/i, 'baker'], [/grocer/i, 'grocer'], [/cutler/i, 'cutler'], [/tinker/i, 'tinker'], [/apothecar/i, 'apothecary'], [/book/i, 'bookseller']];
// family and wealth (0 poor .. 2 rich) by trade
const HTRADES = {
  cooper: { fam: 'workshop', w: 1 }, tanner: { fam: 'workshop', w: 0, stone: 1 }, potter: { fam: 'workshop', w: 1, stone: 1 }, widow: { fam: 'cottage', w: 0 }, fletcher: { fam: 'hallchamber', w: 1 }, dyer: { fam: 'workshop', w: 1, stone: 1 },
  wheelwright: { fam: 'workshop', w: 1 }, carpenter: { fam: 'workshop', w: 1 }, mason: { fam: 'workshop', w: 1, stone: 1 }, saddler: { fam: 'workshop', w: 1 }, ropemaker: { fam: 'workshop', w: 0 }, basketmaker: { fam: 'cottage', w: 0 }, shepherd: { fam: 'cottage', w: 0 },
  woodcutter: { fam: 'cottage', w: 0 }, glover: { fam: 'shopfront', w: 1 }, brewer: { fam: 'crosspassage', w: 1 }, scribe: { fam: 'hallchamber', w: 2 }, merchant: { fam: 'merchant', w: 2 }, cobbler: { fam: 'shopfront', w: 0 }, chandler: { fam: 'shopfront', w: 1 },
  tailor: { fam: 'shopfront', w: 1 }, butcher: { fam: 'shopfront', w: 1, stone: 1 }, baker: { fam: 'shopfront', w: 1 }, grocer: { fam: 'shopfront', w: 1 }, cutler: { fam: 'shopfront', w: 1 }, tinker: { fam: 'shopfront', w: 0 }, apothecary: { fam: 'shopfront', w: 1 }, bookseller: { fam: 'shopfront', w: 2 },
  household: { w: 1 },
};
const H_TINTS = [[1, 1, 1], [1.0, 0.93, 0.78], [0.88, 0.95, 0.86], [1.0, 0.86, 0.8], [0.84, 0.82, 0.8], [0.95, 0.9, 0.72], [0.9, 0.9, 1.0]];          // whitewash, ochre, sage, rose, grey, straw, lime-blue
const H_RUGS = [[0.5, 0.2, 0.16], [0.3, 0.22, 0.16], [0.24, 0.32, 0.2], [0.3, 0.31, 0.4], [0.45, 0.32, 0.14], [0.38, 0.24, 0.28]];
const hHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d), h = Math.imul(h ^ (h >>> 12), 0x297a2d39), ((h ^ (h >>> 15)) >>> 0) / 4294967296); };
const stRun = (rise, tread) => Math.ceil(rise / 0.19) * tread;
const ceil2 = v => Math.ceil(v * 2 - 1e-9) / 2;
function hCtx(P, c) {
  const site = c.site.real || c.site, id = P.id, nm = (site.name || ''), D0 = HDESC[id] || {}, R = rng((hHash(id) * 1e9) | 0);
  let trade = D0.trade; if (!trade) for (const [re, t] of HNAMES) if (re.test(nm)) { trade = t; break; } trade = trade || 'household';
  const T = HTRADES[trade] || HTRADES.household, wealth = D0.wealth !== undefined ? D0.wealth : T.w, area = (c.w || 6) * (c.d || 5);
  let fam = (TEST && TEST.fam) || D0.fam || T.fam; if (!fam) fam = area < 30 ? 'cottage' : R.pick(['hallchamber', 'crosspassage', 'hallchamber']);
  for (let i = 0; i < 6; i++) R();
  const F = { id, R, sx: hHash(id + 'mirror') < 0.5 ? 1 : -1, trade, wealth, fam, T, tint: R.pick(H_TINTS), tint2: R.pick(H_TINTS), rug: R.pick(H_RUGS), blanket: R.pick([DYE.red, DYE.blue, DYE.green, [0.5, 0.42, 0.3], DYE.purple, [0.42, 0.32, 0.2]]), shop: HFAM_SHOP[fam] || false };
  F.H0 = [2.5, 2.7, 2.9][clamp(wealth, 0, 2)] + (R() < 0.4 ? 0.1 : 0); F.stone0 = !!T.stone || (wealth === 0 && R() < 0.5);
  F.winKinds = R.pick([['Wide_Flat'], ['Wide_Flat', 'Wide_Round'], ['Thin_Round', 'Wide_Flat'], ['Wide_Round']]);
  F.X = x => F.sx * x; F.S = s => F.sx > 0 ? s : ({ w: 'e', e: 'w' }[s] || s);
  F.rm = (k, rid, kind, x0, z0, x1, z1, o) => pRoom(P, k, rid, kind, F.sx > 0 ? x0 : -x1, z0, F.sx > 0 ? x1 : -x0, z1, Object.assign({ winKinds: F.winKinds }, o || {}));
  F.memo = hMemoIdx(id); F.beamDir = R.pick(['x', 'z', 'x', 'z', undefined]); F.beamSp = R.pick([1.1, 1.5, 2.0, 2.6, 3.2]); F.beamH = R.pick([0.16, 0.24, 0.34]); F.beamW = F.beamH > 0.3 ? 0.14 : 0.08;
  // finishes: the wall the door faces and the floor differ house to house (stone, timber boarding, plaster, ochre wattle; flags, boards, earth, slate)
  F.wallKind = R.pick(F.stone0 ? ['stone', 'stone', 'timber', 'plaster'] : wealth > 1 ? ['plaster', 'timber', 'plaster', 'stone'] : ['plaster', 'timber', 'wattle', 'stone', 'plaster']); F.floorKind = F.stone0 ? R.pick(['flags', 'earth', 'slate', 'flags']) : wealth > 1 ? R.pick(['boards', 'boards', 'slate']) : R.pick(['boards', 'earth', 'boards']);
  F.fin = (k, o) => {
    const u = { floor: 'wood', tint: F.tint2 }; if (k !== 0) return Object.assign(u, o || {});
    const bm = { beamDir: F.beamDir, beamSp: F.beamSp, beamH: F.beamH, beamW: F.beamW };
    const w = { stone: { walls: 'stone', tint: [0.92, 0.9, 0.86] }, timber: { tint: [0.5, 0.38, 0.27] }, wattle: { tint: [0.86, 0.74, 0.5] }, plaster: { tint: F.tint } }[F.wallKind], f = { flags: { floor: 'stone' }, earth: { floor: 'stone', ftint: [0.5, 0.4, 0.28] }, slate: { floor: 'stone', ftint: [0.62, 0.68, 0.74] }, boards: { floor: 'wood', ftint: wealth > 1 ? [1.0, 0.9, 0.78] : undefined } }[F.floorKind];
    const r = Object.assign({}, w, f, bm, o || {}); if (o && o.floor && o.floor !== (f && f.floor)) delete r.ftint; return r;
  };
  F.door = (a, b, x, z, o) => { const d = pDoor(P, a, b, F.X(x), z, o); if (b === null && P.rooms[a]) P.clear.push({ x0: F.X(x) - 0.8, x1: F.X(x) + 0.8, z0: z, z1: z + 2.6, k: P.rooms[a].k, kind: 'path', room: P.rooms[a] }); return d; };      // [c5] nothing stands in the first 2.6 m inside the street door
  return F;
}
const HFAM_SHOP = { shopfront: true };
let HMEMO_IDS = [];          // every enterable house, in a fixed scattered order: its rank picks its one memorable object (72l_hobjects.js)
const hMemoIdx = id => Math.max(0, HMEMO_IDS.indexOf(id));
const hRugs = (P, room, F, n) => { for (let i = 0; i < (n || 1); i++) { const e = PD.emptiest(P, room); if (e.r > 1.0) PD.rug(P, room, e.x, e.z, Math.min(2.2, e.r * 1.5), Math.min(3.0, e.r * 2.0), F.rug, P.R() < 0.5 ? 0 : PI / 2); } };
const hPool = (kind, F) => ({
  hall: F.wealth > 1 ? ['tapestry', 'paint', 'cabinet', 'hooks', 'sconce', 'shelf', 'tapestry'] : ['hooks', 'cabinet', 'paint', 'tapestry', 'sconce', 'shelf', 'cask'], bedroom: ['cupboard', 'hooks', 'tapestry', 'paint', 'cabinet', 'sconce'],
  store: ['shelf', 'hooks', 'sacks', 'cask', 'torch', 'cabinet'], cellar: ['cask', 'shelf', 'sacks', 'stack', 'torch'], corridor: ['hooks', 'paint', 'sconce', 'tapestry'], yard: ['stack', 'sacks', 'cask'],
}[kind] || ['hooks', 'cabinet', 'paint', 'sconce']);
// the density pass and the light for every room of a finished layout
function hEntryTorch(P, F) {          // [c5] one visible warm source in the first view at night: a torch or a sconce on the wall facing the door, beside the focal piece
  const e = P.doors.find(d => d.b === null); if (!e) return; const room = P.rooms[e.a]; if (!room || P.torchDone) return;
  for (const u of [F.X(-2.2), F.X(2.2), F.X(-3.2), F.X(3.2), F.X(-1.4), F.X(1.4)]) if ((F.memo % 2 ? pSconce(P, room, 's', u, 1.6) || pTorch(P, room, 's', u, 1.65, 6) : pTorch(P, room, 's', u, 1.65, 6) || pSconce(P, room, 's', u, 1.6))) { P.torchDone = 1; return; }
  for (const sd of ['w', 'e']) for (const z of [room.z0 + 3, room.z0 + 4, room.z0 + 2]) if (pTorch(P, room, sd, z, 1.65, 6)) { P.torchDone = 1; return; }
}
function hFinish(P, c, F) {
  hMemo(P, F); hVariety(P, F); hEntryTorch(P, F);
  if (!P.spots.work && P.focal) { const e0 = P.doors.find(d => d.b === null), rm0 = e0 && P.rooms[e0.a], fx = P.focal.x, fz = P.focal.z;          // [c5] where the worker stands: in the first room, in front of the trade's focal piece
    if (rm0) for (const [x, z] of pCands(rm0, [fx, fz - 1.1])) { if (Math.hypot(x - fx, z - fz) > 3.2) break; if (pFit(P, rm0, rectOf(x, z, 0.7, 0.7), { h: 1.8, lowOk: true })) { pSpot(P, 'work', x, z, Math.atan2(fx - x, -(fz - z)), { k: rm0.k }); break; } } }
  for (const id in P.rooms) {
    const r = P.rooms[id], k = r.kind === 'cellar' ? 'cellar' : r.kind === 'bedroom' ? 'bedroom' : r.kind === 'store' ? 'store' : r.kind === 'corridor' ? 'corridor' : r.kind === 'yard' ? 'yard' : 'hall';
    PD.dense(P, r, { pool: hPool(k, F), corner: k === 'cellar' ? ['cask', 'sacks', 'stack'] : ['broom', 'sacks', 'stack', 'cask'], mid: { kinds: k === 'cellar' || k === 'store' ? ['casks', 'sacks'] : ['rug'], max: k === 'corridor' ? 0 : 1, min: 0.9 }, middle: k !== 'corridor', racks: k === 'cellar' ? 1 : 0, rackKinds: ['ham', 'herb', 'garlic', 'ham'] });
    if (k !== 'cellar' && !P.lightIn[id]) pLamp(P, r, ...pCentre(r));
    if (k === 'cellar' && !P.lightIn[id]) pTorch(P, r, 'n', (r.in.x0 + r.in.x1) / 2 + 0.5, 1.7, 6.5) || pTorch(P, r, 's', (r.in.x0 + r.in.x1) / 2 + 0.5, 1.7, 6.5);
  }
  if (!P.hall) P.err.push('no hearth fits');
}
// something in every cellar: a chest of the household's savings
function hCellarChest(P, room, F) {
  const L = P.lv[room.k]; let ch = null;
  for (const sd of pSidesLong(room)) if ((ch = pAgainst(P, room, sd, P.id + '.cellarchest', 0.85, 0.5, 0.58, +1, pdChest, { lowOk: true, at: 'end' }))) break;
  if (!ch) ch = pFree(P, room, P.id + '.cellarchest', 0.85, 0.5, 0.58, 0.3, pdChest, { lowOk: true });
  if (!ch) for (const sd of pSidesLong(room)) if ((ch = pAgainst(P, room, sd, P.id + '.cellarchest', 0.85, 0.5, 0.58, +1, pdChest, { lowOk: true, at: 'end', noGuard: true }))) break;      /* [inout] a narrow cellar: the stair's own clear zones are kept, the way-guard is not asked */
  if (ch) pInteract(P, ch.cx, 0.5, ch.cz, { kind: 'chest', id: P.id + '.cellarchest', loot: [['gold', 3 + F.wealth * 4 + P.R.i(0, 4)]].concat(F.wealth > 0 ? [['apple', 1]] : []), r: 1.8 }, room.k);
  else P.err.push('no room for the cellar chest');
  return ch;
}
const hLoot = F => [['gold', 2 + F.wealth * 3 + F.R.i(0, 4)]];
const hHearthTry = (P, room, sides, wid, o) => { for (const [sd, at] of sides) { const hh = pHearth(P, room, sd, wid, Object.assign({ at }, o || {})); if (hh) return hh; } return null; };

// ── cottage: one room, a loft over its back part ──
const H_LOWOK = new Set(['widow', 'shepherd', 'woodcutter', 'household', 'basketmaker']);
HFAM.cottage = (P, c, F) => {
  const kind = hHash(P.id + '|vol'), tall = kind < 0.3, low = !tall && kind < 0.6 && F.wealth === 0 && H_LOWOK.has(F.trade);
  if (tall) return HFAM.cottageTall(P, c, F);
  const R = F.R, sx = F.sx, W = R.pick([6, 7, 7, 8]), D = R.pick([8, 8.5, 9]), H0 = low ? 2.2 : Math.min(F.H0, 2.7), run = stRun(H0 + PW.SLAB, 0.2), p0 = D - run - 1.5, zl = Math.floor((p0 - 0.8) * 2) / 2;
  P.dims = { W, D, Dh: zl }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  const rm = F.rm(0, 'room', 'hall', -W / 2, 0, W / 2, D, F.fin(0)), loft = F.rm(1, 'loft', 'bedroom', -W / 2, zl, W / 2, D, F.fin(1));
  F.door('room', null, 0, 0);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: F.X(W / 2 - 0.95), z: p0, width: 0.9, tread: 0.2 });
  pLayout(P);
  const back = R() < 0.85, order = back ? [['s', F.X(-1.3)], [F.S('w'), D * 0.45]] : [[F.S('w'), D * 0.45], ['s', F.X(-1.3)]];
  const hh = hHearthTry(P, rm, order, 1.7, { cauldron: true }); if (hh) pPier(P, 1, hh);
  P.hall = { room: rm, hh };
  dressHall(P, rm, { hh, rug: F.rug, items: ['bowl', 'loaf', 'mug', 'cheese'], shelfItems: ['jug', 'bowl', 'pot', 'cheese'], len: 1.8 });
  hTrade(P, c, rm, F);
  dressBedroom(P, loft, { bedH: 0.85, beds: castBeds(P.id, F.wealth > 0 ? ['bed', 'bed2'] : ['bed']) /* [cast] a bed for every sleeper */, blanket: F.blanket, loot: hLoot(F), bedInteract: true, fur: F.wealth === 0 });
  hFinish(P, c, F);
};
// ── a tall cottage: one room open to the rafters, no loft, the bed in the corner by the hearth [c5] ──
HFAM.cottageTall = (P, c, F) => {
  const R = F.R, W = R.pick([6, 7, 8]), D = R.pick([7, 7.5, 8]), H0 = R.pick([3.4, 3.7, 4.0]);
  P.dims = { W, D, Dh: D }; pLevel(P, 0, 0, H0);
  const rm = F.rm(0, 'room', 'hall', -W / 2, 0, W / 2, D, F.fin(0, { beamDir: 'x', beamSp: 2.2, beamH: 0.36, beamW: 0.15 }));
  F.door('room', null, 0, 0);
  pLayout(P);
  const hh = hHearthTry(P, rm, [['s', F.X(-1.3)], [F.S('w'), D * 0.5], [F.S('e'), D * 0.5]], 1.9, { cauldron: true, size: 0.55 });
  P.hall = { room: rm, hh };
  dressBedroom(P, rm, { beds: castBeds(P.id, ['bed']) /* [cast] a bed for every sleeper */, blanket: F.blanket, loot: hLoot(F), bedInteract: true, fur: F.wealth === 0 });
  dressHall(P, rm, { hh, rug: F.rug, items: ['bowl', 'loaf', 'mug', 'cheese'], shelfItems: ['jug', 'bowl', 'pot', 'cheese'], len: 1.8 });
  hTrade(P, c, rm, F);
  hFinish(P, c, F);
};
// ── hall and chamber: the open hall with its hearth on a side wall, the chamber (stair to the solar) and the pantry behind it ──
HFAM.hallchamber = (P, c, F) => {
  const R = F.R, W = R.pick([8, 9]), Dh = R.pick([6, 6.5]), H0 = Math.min(F.H0, 2.9), run = stRun(H0 + PW.SLAB, 0.2), D = Dh + ceil2(run + 2.6), cw = 4.5, xs = W / 2 - cw;
  P.dims = { W, D, Dh }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  const hall = F.rm(0, 'hall', 'hall', -W / 2, 0, W / 2, Dh, F.fin(0)), pantry = F.rm(0, 'pantry', 'store', -W / 2, Dh, xs, D, { floor: 'stone', win: true }), chamber = F.rm(0, 'chamber', 'bedroom', xs, Dh, W / 2, D, F.fin(0, { floor: 'wood', tint: F.tint2 }));
  const solar = F.rm(1, 'solar', 'bedroom', -W / 2, Dh, W / 2, D, F.fin(1));
  F.door('hall', null, 0, 0); F.door('hall', 'pantry', (-W / 2 + xs) / 2, Dh); F.door('hall', 'chamber', xs + 1.3, Dh);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: F.X(W / 2 - 0.95), z: Dh + 1.25, width: 0.9, tread: 0.2 });
  pLayout(P);
  const hz = R.pick([2.8, 3.2, 3.6]), hh = hHearthTry(P, hall, [[F.S(R() < 0.5 ? 'w' : 'e'), hz], [F.S('w'), hz + 0.6], [F.S('e'), hz + 0.6]], 1.8, { cauldron: true, size: 0.5 }); if (hh) pPier(P, 1, hh);
  P.hall = { room: hall, hh };
  dressHall(P, hall, { hh, rug: F.rug, items: ['mug', 'plate', 'bowl', 'loaf', 'candle'], len: 2.4, walls: F.wealth > 1 ? ['paint', 'paint', 'Shield_Wooden', 'paint', 'Torch_Metal'] : undefined });
  hTrade(P, c, hall, F);
  dressBedroom(P, chamber, { beds: ['bed'], blanket: F.blanket, loot: hLoot(F), bedInteract: true, fur: F.wealth > 0 });
  dressStore(P, pantry, { items: ['jar', 'jug', 'cheese', 'bowl'] }); PD.rack(P, pantry, (pantry.x0 + pantry.x1) / 2, Dh + 1.8, 1.6, 0, ['ham', 'herb', 'garlic', 'ham']);
  dressBedroom(P, solar, { beds: ['bed2', 'bed3'], chestId: 'chest2', chest: true, blanket: F.blanket, table: F.wealth > 0, loot: [['gold', 2 + F.wealth * 3]] });
  hFinish(P, c, F);
};
// ── cross-passage: a passage from the street door to a barred back door; the hall (hearth in the gable, stair up) on one side, buttery and parlour on the other ──
HFAM.crosspassage = (P, c, F) => {
  const R = F.R, W = 12, Dh = 6.5, H0 = Math.min(F.H0, 2.9), run = stRun(H0 + PW.SLAB, 0.2), D = Math.max(11, Dh + ceil2(1.25 + run + 1.4)), px = 5;
  P.dims = { W, D, Dh }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  const hall = F.rm(0, 'hall', 'hall', -6, 0, -1, Dh, F.fin(0)), service = F.rm(0, 'service', 'store', -6, Dh, -1, D, F.fin(0, { floor: 'stone', tint: [0.8, 0.76, 0.72] })), pass = F.rm(0, 'passage', 'corridor', -1, 0, 1, D, F.fin(0, { win: false }));
  const butt = F.rm(0, 'buttery', 'store', 1, 0, 6, 3.5, { floor: 'stone', tint: [0.8, 0.76, 0.72] }), parlour = F.rm(0, 'parlour', 'hall', 1, 3.5, 6, D, F.fin(0, { floor: 'wood', tint: F.tint2 }));
  const solar = F.rm(1, 'solar', 'bedroom', 1, 3.5, 6, D, F.fin(1)), landing = F.rm(1, 'landing', 'corridor', -1, 0, 1, D, F.fin(1, { win: false })), chamber = F.rm(1, 'chamber', 'bedroom', -6, 0, -1, D, F.fin(1));
  F.door('passage', null, 0, 0); F.door('passage', null, 0, D, { open: true }); F.door('passage', 'hall', -1, 2.4); F.door('hall', 'service', -3.5, Dh); F.door('passage', 'buttery', 1, 1.7); F.door('passage', 'parlour', 1, D - 3.0);
  F.door('solar', 'landing', 1, 7.0); F.door('landing', 'chamber', -1, 7.0);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: F.X(px - 0.55), z: 3.5 + 1.25, width: 0.9, tread: 0.2 });
  pLayout(P);
  const hh = hHearthTry(P, hall, [[F.S('w'), 3.4], [F.S('w'), 3.0], ['s', F.X(-3.5)]], 1.9, { cauldron: true, size: 0.5 }); if (hh) { pPier(P, 1, hh); }
  P.hall = { room: hall, hh };
  dressHall(P, hall, { hh, rug: F.rug, items: ['mug', 'plate', 'bowl', 'loaf'], len: 2.2 }); hTrade(P, c, hall, F);
  dressKitchen(P, service, {}); dressStore(P, butt, { items: ['jug', 'cheese', 'bottle', 'jar'] });
  dressHall(P, parlour, { hh: null, rug: F.rug, items: ['book', 'candle', 'mug', 'plate'], len: 1.8 });
  dressBedroom(P, chamber, { beds: ['bed', 'bed2'], blanket: F.blanket, loot: hLoot(F), bedInteract: true, fur: F.wealth > 0 });
  dressBedroom(P, solar, { beds: ['bed3'], chestId: 'chest2', chest: true, blanket: F.blanket, loot: [['gold', 2 + F.wealth * 3]] });
  pLamp(P, pass, 0, Dh); pLamp(P, landing, 0, 3.0);
  hFinish(P, c, F);
};
// ── shop front: the shop with its counter across it, the keeper's living room behind (hearth, stair up, a cellar stair when the keeper can afford one), two rooms above ──
HFAM.shopfront = (P, c, F) => {
  const narrow = F.R() < 0.4, R = F.R, W = narrow ? 6 : 8, Dh = narrow ? 8 : 6, H0 = Math.min(F.H0, 2.7), run = stRun(H0 + PW.SLAB, 0.2), D = Dh + ceil2(run + 2.6), cellar = F.wealth > 0 || F.trade === 'butcher' || R() < 0.4;      // [c5] one in three shops is long and narrow
  P.dims = { W, D, Dh }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP); if (cellar) pLevel(P, -1, -(2.6 + PW.SLAB), 2.6);
  const shop = F.rm(0, 'shop', 'shop', -W / 2, 0, W / 2, Dh, F.fin(0, { floor: F.trade === 'butcher' || F.trade === 'baker' ? 'stone' : F.stone0 ? 'stone' : 'wood' })), back = F.rm(0, 'back', 'hall', -W / 2, Dh, W / 2, D, F.fin(0, { floor: 'wood', tint: F.tint2 }));
  const upf = F.rm(1, 'upfront', 'bedroom', -W / 2, 0, W / 2, Dh, F.fin(1)), upb = F.rm(1, 'upback', 'bedroom', -W / 2, Dh, W / 2, D, F.fin(1));
  if (cellar) F.rm(-1, 'cellar', 'cellar', -W / 2, Dh, W / 2, D, { floor: 'stone', win: false });
  F.door('shop', null, 0, 0); F.door('shop', 'back', 1.5, Dh); F.door('upfront', 'upback', -1.5, Dh);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: F.X(W / 2 - 0.95), z: Dh + 1.25, width: 0.9, tread: 0.2 });
  if (cellar) pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: 1, x: F.X(-(W / 2 - 0.95)), z: Dh + 1.25, width: 0.9, tread: 0.2 });
  pLayout(P);
  const hh = pHearth(P, back, 's', 1.6, { cauldron: true, at: F.X(-(W / 2 - 0.95)) > 0 ? -0.9 : 0.3, size: 0.45 });      /* [fin] the hearth leans away from the cellar stair so one arriving from below can walk out */ if (hh) { pPier(P, 1, hh); if (cellar) pPier(P, -1, hh); }
  P.hall = { room: back, hh }; if (hh) pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
  hTrade(P, c, shop, F); if (!P.counter) for (const ln of [2.6, 2.0, 1.6]) if (cnt(P, shop, F, ln, ['bottle', 'jar', 'bowl', 'candle'], 'k')) break;          // [c5] every shop has a counter for its keeper to stand behind
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, shop, P.id + '.mat', e.x, 1.4, 0, 2.2, 1.4, 0.02, pdRug(2.2, 1.4, F.rug), { flat: true, noClear: true });
  pLamp(P, shop, F.X(-2.4), 2.0); pLamp(P, shop, F.X(2.4), 2.0);
  dressHall(P, back, { hh, rug: F.rug, items: ['mug', 'plate', 'bowl', 'loaf'], len: 1.8, alt: shop });      /* [fin] */
  dressBedroom(P, upb, { beds: ['bed'], blanket: F.blanket, loot: hLoot(F), bedInteract: true, table: true, fur: F.wealth > 0 });
  dressBedroom(P, upf, { beds: castBeds(P.id, F.wealth > 0 ? ['bed2'] : [], 1) /* [cast] a bed for every sleeper */, chestId: 'chest2', chest: true, blanket: F.blanket, loot: [['gold', 2 + F.wealth * 3]] }); pStock(P, upf, { sacks: 2, crates: 1, near: pCentre(upf) });
  if (cellar) { const cel = P.rooms.cellar; dressCellar(P, cel, { barrels: 3, crates: 2, rows: false }); hCellarChest(P, cel, F); }
  hFinish(P, c, F);
};
// ── workshop: the work room at the front (the trade's focal piece faces the door), the family's living room beside the roofed yard behind, a loft over the living room ──
HFAM.workshop = (P, c, F) => {
  const R = F.R, W = 10, Dh = 6.5, H0 = Math.min(F.H0, 2.7), run = stRun(H0 + PW.SLAB, 0.2), D = Dh + ceil2(run + 2.6);
  P.dims = { W, D, Dh }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  const L = hHash(P.id + '|L') < 0.4, wfl = { floor: F.T.stone || F.wealth === 0 ? 'stone' : 'wood' };          // [c5] an L-shaped work room: the front strip and a leg behind it on one side, the yard's notch open air
  const work = F.rm(0, 'work', 'hall', -5, 0, 5, L ? 3.5 : Dh, F.fin(0, wfl)), leg = L ? F.rm(0, 'leg', 'hall', -5, 3.5, -0.5, Dh, F.fin(0, wfl)) : null, living = F.rm(0, 'living', 'hall', -5, Dh, -0.5, D, F.fin(0, { floor: 'wood', tint: F.tint2 })), yard = F.rm(0, 'yard', 'yard', -0.5, Dh, 5, D, { floor: 'cobble', tint: [0.8, 0.77, 0.72] });
  const loft = F.rm(1, 'loft', 'bedroom', -5, Dh, -0.5, D, F.fin(1));
  F.door('work', null, 0, 0);
  if (L) { F.door('work', 'leg', -2.75, 3.5, { w: 2.2 }); F.door('leg', 'living', -2.75 + R.pick([-0.5, 0.5]), Dh); F.door('living', 'yard', -0.5, Dh + 2.2); }
  else { F.door('work', 'living', -2.75 + R.pick([-0.5, 0.5]), Dh); F.door('work', 'yard', 2.25 + R.pick([-0.5, 0, 0.5, 1]), Dh); }      // [c5] the openings in different places
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: F.X(-5 + 0.95), z: Dh + 1.25, width: 0.9, tread: 0.2 });
  pLayout(P);
  hTrade(P, c, work, F); P.hall = { room: work, hh: null }; const e = P.doors.find(d => d.b === null); if (e) pPut(P, work, P.id + '.mat', e.x, 1.4, 0, 2.2, 1.4, 0.02, pdRug(2.2, 1.4, F.rug), { flat: true, noClear: true });
  pLamp(P, work, F.X(-2.6), L ? 1.6 : 2.4); pLamp(P, work, F.X(2.6), L ? 1.6 : 2.4);
  if (leg) { dressHall(P, leg, { hh: null, rug: F.rug, items: ['bowl', 'mug', 'candle'], len: 1.8 }); for (const [nm, sd] of [['stack', 'w'], ['sacks', 'n'], ['cask', 'w'], ['bucket', 'n']]) hPlace(P, leg, nm, { sides: [sd, 'n', 'w'] }); pLamp(P, leg, F.X(-2.75), 5.4); }
  const lh = hHearthTry(P, living, [[F.S('e'), D - 2.6], [F.S('e'), D - 3.6]], 1.7, { cauldron: true, size: 0.45 }); if (lh) pPier(P, 1, lh); P.hall = { room: living, hh: lh };
  dressHall(P, living, { hh: lh, rug: F.rug, items: ['bowl', 'loaf', 'mug', 'cheese'], len: 1.8 });
  dressBedroom(P, loft, { bedH: 0.85, beds: castBeds(P.id, F.wealth > 0 ? ['bed', 'bed2'] : ['bed']) /* [cast] a bed for every sleeper */, blanket: F.blanket, loot: hLoot(F), bedInteract: true, table: true });
  for (const [nm, sd] of [['stack', 'n'], ['cask', 's'], ['bucket', 'n'], ['sacks', 'e'], ['barrel', 'w'], ['cart', 'e']]) hPlace(P, yard, nm, { sides: [sd, 'n', 's', 'e', 'w'] });
  hFinish(P, c, F);
};
// ── merchant's house: a tall hall, the counting room, a stair hall with the stair up to the chamber and solar and the stair down to a cellar of wine and strongboxes ──
HFAM.merchant = (P, c, F) => {
  const R = F.R, W = 10, Dh = 6, D = 12, H0 = clamp(F.H0 + 0.1, 2.7, 2.9);
  P.dims = { W, D, Dh }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP); pLevel(P, -1, -(2.6 + PW.SLAB), 2.6);
  const hall = F.rm(0, 'hall', 'hall', -5, 0, 5, Dh, F.fin(0, { floor: 'wood', tint: F.tint })), count = F.rm(0, 'counting', 'study', -5, Dh, 0, D, F.fin(0, { floor: 'wood', tint: F.tint2 })), sh = F.rm(0, 'stairhall', 'corridor', 0, Dh, 5, D, F.fin(0, { floor: 'wood' }));
  const chamber = F.rm(1, 'chamber', 'bedroom', 0, Dh, 5, D, F.fin(1)), solar = F.rm(1, 'solar', 'bedroom', -5, Dh, 0, D, F.fin(1)); F.rm(-1, 'cellar', 'cellar', -5, Dh, 5, D, { floor: 'stone', win: false });
  F.door('hall', null, 0, 0); F.door('hall', 'counting', -2.5, Dh); F.door('hall', 'stairhall', 2.5, Dh); F.door('chamber', 'solar', 0, 9);
  const tr = Math.min(0.2, (D - 1.25 - Dh - 1.3) / Math.ceil((H0 + PW.SLAB) / 0.19));
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: -1, x: F.X(1.4), z: D - 1.25, width: 0.9, tread: tr });
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: 1, x: F.X(3.8), z: Dh + 1.25, width: 0.9, tread: 0.2 });
  pLayout(P);
  const hh = hHearthTry(P, hall, [[F.S('w'), 3.0], [F.S('e'), 3.0], [F.S('w'), 3.6]], 2.2, { cauldron: false, size: 0.7, r: 10.5, c: [3.6, 1.8, 0.65], rug: [0.4, 0.14, 0.12] }); P.hall = { room: hall, hh };
  dressHall(P, hall, { hh, rug: F.rug, items: ['mug', 'plate', 'bowl', 'candle', 'loaf', 'jug'], len: 2.6, walls: ['paint', 'paint', 'Shield_Wooden', 'paint', 'Torch_Metal'] });
  hTrade(P, c, count, F);
  dressStore(P, sh, { items: ['jar', 'bottle'] }); dressBedroom(P, chamber, { beds: ['bed'], blanket: F.blanket, loot: [['gold', 8 + R.i(0, 6)]], bedInteract: true, fur: true, table: true }); dressBedroom(P, solar, { beds: ['bed2'], chestId: 'chest2', chest: true, blanket: F.blanket, table: true });
  const cel = P.rooms.cellar; dressCellar(P, cel, { barrels: 4, crates: 2, rows: true }); hCellarChest(P, cel, F);
  hFinish(P, c, F);
};
// ── the dispatcher: the recipe of the household's trade goes into the family's work room ──
function hTrade(P, c, room, F) { const T = HT[F.trade]; if (T) { F.counterAt = [F.X(-0.8), room.z0 + (room.z1 - room.z0) * 0.62]; try { T(P, c, room, F); } catch (e) { P.err.push('trade ' + F.trade + ': ' + (e && e.message || e)); } } }
function hBuild(P, c, info) { const F = hCtx(P, c); P.fam = F; HFAM[F.fam](P, c, F); }
// the sites that ship from a family plan: the enterable infill houses, Highfold's two houses and (72m_alleyshops.js) the alley shops
for (const id of (typeof INF !== 'undefined' && INF.enterIds || [])) { PLANS[id] = hBuild; PLAN_SHIP[id] = 1; }
for (const id of ['high.a', 'high.c']) if (typeof SITE !== 'undefined' && SITE[id]) { PLANS[id] = hBuild; PLAN_SHIP[id] = 1; }
HDESC['high.a'] = { trade: 'shepherd', fam: 'cottage', wealth: 0 }; HDESC['high.c'] = { trade: 'woodcutter', fam: 'hallchamber', wealth: 0 };

// ── the market alley's six shop fronts (73b_alley.js draws the facade; its door leaf is the portal of a cell built here) [c5] ──
if (typeof HOUSES !== 'undefined' && typeof ALLEY_SHOPS !== 'undefined') {
  const AT = { 'shop.n2': 'apothecary', 'shop.n3': 'cutler', 'shop.n4': 'grocer', 'shop.s0': 'baker', 'shop.s1': 'bookseller', 'shop.s2': 'tinker' };
  for (const a of ALLEY_SHOPS) if (a.layout && AT[a.id]) {
    const st = SITE[a.id], t = AT[a.id];
    HOUSES[a.id] = { H: 2.6, walls: 'timber', roof: 'thatch', doors: [{ wall: 'front', pos: st.doorPos, lamp: false }], windows: [], interior() {} };
    KIT_STYLE[a.id] = { ground: 'plaster', up: 0, timber: true, shingle: true };
    HDESC[a.id] = { trade: t, fam: 'shopfront', wealth: 1 }; PLANS[a.id] = hBuild; PLAN_SHIP[a.id] = 1;
  }
}

{ const ids = (typeof INF !== 'undefined' && INF.enterIds || []).concat(['high.a', 'high.c'], typeof ALLEY_SHOPS !== 'undefined' ? ALLEY_SHOPS.filter(a => a.layout).map(a => a.id) : []); const first = ['in.02', 'in.04', 'in.07', 'in.13', 'in.21', 'in.23', 'high.a', 'high.c', 'shop.n2', 'shop.n3', 'shop.n4', 'shop.s0', 'shop.s1', 'shop.s2'], sc = a => hHash(a + '|memo'); HMEMO_IDS = first.filter(a => ids.includes(a)).sort((a, b) => sc(a) - sc(b)).concat(ids.filter(a => !first.includes(a)).sort((a, b) => sc(a) - sc(b))); }

// ── the working buildings (weaver, draper, mill, hunter, fisher, farm) go through the same engine: a trade each [c5] ──
{
  const WK = { weaver: { trade: 'weaver', fam: 'workshop', wealth: 1 }, draper: { trade: 'draper', fam: 'shopfront', wealth: 2 }, mill: { trade: 'miller', fam: 'workshop', wealth: 1 }, hunter: { trade: 'hunter', fam: 'cottage', wealth: 0 }, fisher: { trade: 'fisher', fam: 'cottage', wealth: 0 }, farm: { trade: 'farmer', fam: 'crosspassage', wealth: 1 } };
  for (const id in WK) if (typeof SITE !== 'undefined' && SITE[id] && HOUSES[id]) { HDESC[id] = WK[id]; PLANS[id] = hBuild; PLAN_SHIP[id] = 1; }
}

// ───────── [inout] the Market Place's working houses refitted to their shells (one and a half times the shell's floor, its windows, its doors) ─────────
// They keep their trade set (HT, 72l_hobjects.js) and are dressed room by room from docs/ROOMS.md; no filler (hFinish is not called).
const hInout = (P, c, desc) => { HDESC[P.id] = Object.assign({}, HDESC[P.id] || {}, desc); const F = hCtx(P, c); P.fam = F; return F; };
// Riverside Cottage: Hilda and Pip. 7.6 x 6 m, two storeys: the loom room across the front, the kitchen behind, upstairs their beds and the wool store
PLANS.weaver = (P, c, info) => {
  const F = hInout(P, c, { trade: 'weaver', fam: 'workshop', wealth: 1 }), id = P.id, B = pFitBox(c), X0 = B.x0, X1 = B.x1, D = B.D, Zp = 4, H0 = 2.75; P.dims = { W: B.W, D, Dh: Zp };
  pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  pRoom(P, 0, 'work', 'hall', X0, 0, X1, Zp, F.fin(0, { floor: 'wood' })); pRoom(P, 0, 'living', 'hall', X0, Zp, X1, D, F.fin(0, { floor: 'stone', tint: F.tint2 }));
  pRoom(P, 1, 'woolstore', 'store', X0, 0, X1, Zp, F.fin(1)); pRoom(P, 1, 'loft', 'bedroom', X0, Zp, X1, D, F.fin(1));
  pDoor(P, 'work', null, 0, 0); pDoor(P, 'work', 'living', X1 - 2.6, Zp); pDoor(P, 'loft', 'woolstore', X1 - 2.6, Zp);
  pShellWins(P, c, B);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: X0 + 1.5, z: D - 0.65, width: 0.9, tread: 0.19 });
  pLayout(P); pKeepStairHeads(P);
  const work = P.rooms.work, living = P.rooms.living, ws = P.rooms.woolstore, loft = P.rooms.loft;
  hTrade(P, c, work, F); pPiece(P, work, 'wooden_lantern_01', { side: ['n', 's'], lit: 6, soft: true, opt: { lowOk: true } });
  for (let i = 0; i < 3; i++) pPiece(P, work, 'wicker_basket_02', { side: ['s', 'n'], at: X0 + 0.6 + i * 0.5, sc: 1.6, soft: true, id: 'yarn' + i });
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, work, id + '.mat', e.x, 1.1, 0, 1.8, 1.2, 0.02, pdRug(1.8, 1.2, F.rug), { flat: true, noClear: true });
  // the kitchen: the fire on the gable, the table with two stools, Pip's slate
  let hh = null; for (const [sd, a] of [['e', Zp + 1.7], ['e', Zp + 2.0], ['s', X1 - 1.4], ['w', Zp + 1.5]]) if ((hh = pHearth(P, living, sd, 1.3, { cauldron: true, size: 0.45, at: a }))) break;
  P.hall = { room: living, hh }; if (hh) { pPier(P, 1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  const dn = pDining(P, living, 1.4, 0.75, { near: [X1 - 3.3, Zp + 1.4], id: 'meal', n: 2, items: ['bowl', 'bowl', 'loaf'] }); if (dn) dn.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0));
  pPiece(P, living, 'painted_wooden_cabinet', { side: ['n', 's'], at: X0 + 1.0 });
  // upstairs: the wool and the cloth waiting for Lindqvist; Hilda's bed and Pip's, one chest, a man's hat on the peg nobody mentions
  pStock(P, ws, { sacks: 3, near: [X0 + 1.5, 2.0] }); pPiece(P, ws, 'painted_wooden_table', { near: [X1 - 2.2, 2.0], sc: 0.75, top: [] });
  dressBedroom(P, loft, { beds: castBeds(P.id, ['bed', 'bed2']), bedRooms: [ws], blanket: F.blanket, loot: hLoot(F), bedInteract: true, chest: true });
  pKitWall(P, loft, 'n', X1 - 3.0, 'Peg_Rack'); pPiece(P, loft, 'wooden_candlestick', { near: [X1 - 2.0, D - 1.2], lit: 4, soft: true, opt: { lowOk: true } });
  if (!hh) P.err.push('no hearth fits in the kitchen');
};
// Lindqvist's Draper: Anselm and Sabina. 6.4 x 5.6 m, two storeys, a cellar, the balcony over the shop door: the shop, the back room; Sabina's room with the balcony door, Anselm's behind
PLANS.draper = (P, c, info) => {
  const F = hInout(P, c, { trade: 'draper', fam: 'shopfront', wealth: 2 }), id = P.id, B = pFitBox(c), X0 = B.x0, X1 = B.x1, D = B.D, Zp = 3.5, H0 = 2.75; P.dims = { W: B.W, D, Dh: Zp };
  pLevel(P, -1, -(2.4 + PW.SLAB), 2.4); pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP);
  pRoom(P, 0, 'shop', 'shop', X0, 0, X1, Zp, F.fin(0, { floor: 'wood' })); pRoom(P, 0, 'back', 'hall', X0, Zp, X1, D, F.fin(0, { floor: 'wood', tint: F.tint2 }));
  pRoom(P, 1, 'upfront', 'bedroom', X0, 0, X1, Zp, F.fin(1)); pRoom(P, 1, 'upback', 'bedroom', X0, Zp, X1, D, F.fin(1));
  pRoom(P, -1, 'cellar', 'cellar', X0, Zp, X1, D, { floor: 'stone', win: false });
  pDoor(P, 'shop', null, 0, 0); pDoor(P, 'shop', 'back', X1 - 1.0, Zp); pDoor(P, 'upfront', 'upback', X1 - 1.0, Zp);
  const SHL = pShellWins(P, c, B);
  const bd = SHL.list.find(f => f.kind === 'door' && f.lv === 1); if (bd) pUpperDoor(P, P.rooms.upfront, bd, Math.round(SHL.pos(bd) * 4) / 4);
  pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: 1, x: X0 + 1.45, z: D - 0.6, width: 0.9, tread: 0.18, holeX: 0.5 });
  pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: X0 + 1.45, z: Zp + 0.65, width: 0.9, tread: 0.2 });      /* 1.2 m clear at both ends */
  pLayout(P); pKeepStairHeads(P); pBalconies(P, c);
  const shop = P.rooms.shop, back = P.rooms.back, uf = P.rooms.upfront, ub = P.rooms.upback, cel = P.rooms.cellar;
  hTrade(P, c, shop, F); if (!P.counter) for (const ln of [3.0, 2.4, 1.8]) if (cnt(P, shop, F, ln, ['folded', 'bolt', 'spools'], 'draper')) break;
  if (!P.spots.counter && P.counter) { const ct = P.counter; pSpot(P, 'counter', ct.cx, ct.cz + 0.8, PI, { k: 0 }); }
  if (!P.spots.ledger) { const ct = P.counter; pInteract(P, ct ? ct.cx : 0, 1.0, ct ? ct.cz : 2.0, { kind: 'read', id: 'draper.ledger', title: 'The draper’s ledger' }, 0); }
  for (const x of [X0 + 1.4, X1 - 1.4]) pPiece(P, shop, 'brass_candleholders_c', { near: [x, Zp - 0.5], lit: 5, soft: true, opt: { lowOk: true } });
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, shop, id + '.mat', e.x, 1.1, 0, 1.8, 1.2, 0.02, pdRug(1.8, 1.2, F.rug), { flat: true, noClear: true });
  // the back room: the fire, the table and two chairs, the cabinet with the accounts, the CandleStick_Stand
  let hh = null; for (const [sd, a] of [['e', Zp + 1.6], ['e', Zp + 1.2], ['e', Zp + 0.9], ['e', Zp + 2.0], ['s', X1 - 0.9], ['w', Zp + 1.5]]) for (const wd of [1.3, 1.1]) if (!hh && (hh = pHearth(P, back, sd, wd, { cauldron: true, size: 0.4, at: a, allow: sd === 's' ? ['path'] : undefined }))) break;      /* against the back wall the fire may stand beside the room's way across */
  P.hall = { room: back, hh }; if (hh) { pPier(P, 1, hh); pPier(P, -1, hh); pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 }); }
  const dn = pDining(P, back, 1.2, 0.75, { near: [X1 - 2.4, Zp + 1.5], id: 'meal', n: 2 }); if (dn) dn.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0));
  pPiece(P, back, 'CandleStick_Stand', { near: [X1 - 0.6, D - 0.6], lit: 6, sc: 0.8 });
  // upstairs: Sabina's room over the shop (the dress form, the door onto the balcony), Anselm's behind (the rocker at the window)
  dressBedroom(P, uf, { beds: ['bed2'], chestId: 'chest2', chest: false, blanket: F.blanket, table: false }); pPiece(P, uf, 'Dummy', { side: ['w', 'e'] }); pPiece(P, uf, 'classicnightstand_01', { side: ['w', 'e', 'n'], top: [['wooden_candlestick', 0, 0, 1, 0, true]] });
  dressBedroom(P, ub, { beds: ['bed'], blanket: F.blanket, loot: LOOT.draper, bedInteract: true, chest: true }); pPiece(P, ub, 'rockingchair_01', { side: ['e', 'w'], turn: PI });
  pPiece(P, ub, 'wooden_candlestick', { near: [X1 - 1.4, D - 1.0], lit: 4, soft: true, opt: { lowOk: true } });
  // the cellar: wool in crates among cedar shavings, one cask
  for (let i = 0; i < 4; i++) pPiece(P, cel, 'Crate_Wooden', { side: ['s', 'e'], at: X1 - 0.6 - i * 0.95, id: 'wool' + i }); pPiece(P, cel, 'wine_barrel_01', { side: ['e', 's'] });
  pTorch(P, cel, 'n', X1 - 1.2, 1.6, 5) || pTorch(P, cel, 'e', Zp + 1.5, 1.6, 5);
  if (!hh) P.err.push('no hearth fits in the back room');
};

// ───────── [inout] the compact house: one plan for every family house refitted to its shell ─────────
// The six families above were drawn 8 to 12 m across whatever the shell; refitted, a house is about 8 x 7 (one and a half times its shell). At that size the
// families come down to one sound arrangement, varied by trade: the front room across the street front (the work room, the shop or the hall), the stair along its
// back wall, two rooms behind (the store or pantry, and the kitchen or chamber with the fire); upstairs the rooms the shell shows (two storeys: a front and a back
// chamber; one storey: a loft under the rafters); a cellar only where the back room is wide enough for its stair. Room names are the families' own, so the cast,
// the schedules and docs/ROOMS.md still find them. Dressed with kit pieces by name and the trade's set; no filler.
const INOUT_FIT = new Set();          // the houses that use it (district by district)
// [inout] the side of a stair that the front door looks at is the first thing seen on coming in: its tall end is an under-stair cupboard (a ledged plank door,
// strap hinges, a latch), with a peg rail beside it where the stair is high enough to stand under. Drawn on the stair's side, nothing on the floor.
function hUnderStair(P, q) {
  if (!q || q.open || q.axis !== 'x' || q.k0 !== 0 || !q.run) return; const L = P.lv[0], m = P.c.int, d = q.dir, zf = q.lat - q.hw - 0.005;
  const hAt = x => q.rise * Math.max(0, Math.min(1, (x - q.p0) * d / q.run)), dc = q.p1 - d * 0.55;
  if (hAt(dc - d * 0.4) < 1.95) return;
  pBase(P, m);
  at(m, dc, L.y + 0.02, zf, 0, () => {
    m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.41, 0, -0.05, -0.35, 1.93, 0); m.box(0.35, 0, -0.05, 0.41, 1.93, 0); m.box(-0.41, 1.87, -0.05, 0.41, 1.93, 0);
    m.mat(MAT.PLANKS, COL.wood); for (let i = 0; i < 5; i++) m.box(-0.35 + i * 0.14 + 0.003, 0.01, -0.035, -0.35 + (i + 1) * 0.14 - 0.003, 1.86, -0.008);
    m.box(-0.33, 0.28, -0.055, 0.33, 0.38, -0.035); m.box(-0.33, 1.46, -0.055, 0.33, 1.56, -0.035); m.beam([-0.27, 0.38, -0.045], [0.27, 1.46, -0.045], 0.07, 0.02);
    m.mat(MAT.METAL, COL.black); for (const y of [0.31, 1.49]) m.box(-0.37, y, -0.062, -0.02, y + 0.045, -0.055); m.box(0.22, 0.93, -0.068, 0.3, 1.01, -0.055); m.box(0.25, 0.86, -0.075, 0.27, 0.93, -0.068);
  });
  const rc = dc - d * 1.0; if (hAt(rc - d * 0.45) < 1.62) return;
  at(m, rc, L.y + 0.02, zf, 0, () => {
    m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.42, 1.48, -0.03, 0.42, 1.57, 0); for (const px of [-0.28, 0, 0.28]) m.box(px - 0.015, 1.51, -0.12, px + 0.015, 1.54, -0.03);
    if (Kit.pieces.Bag) kp(m, 'Bag', -0.28, 0.98, -0.13, 0.85, 0);
  });
}
function hCompact(P, c, F) {
  const small = c.w * c.d < 30, sW = Math.max(6, Math.ceil(c.w * 1.05 * 2) / 2),      /* 6 m: a stair with 1.2 m clear at both ends */ B = small ? pFitBox(c, { W: sW, D: Math.max(4, Math.floor(c.w * c.d * 1.5 / sW * 2) / 2) }) : pFitBox(c), X0 = B.x0, X1 = B.x1, W = B.W, D = B.D, id = P.id, R = F.R, st = c.spec.kitStyle || {}, fam = F.fam;      /* a small shell: a floor 5.5 m wide so a straight stair fits along its back wall */
  const two = !!st.up || shellOpenings(c).some(f => f.lv >= 1 && f.kind !== 'floor'), three = shellOpenings(c).some(f => f.lv >= 2 && f.kind === 'win' && !f.blocked) && two;      /* a third storey the shell shows on a one-room house: a loft under the roof, by a ladder (inbox, Build 85) */      /* the alley's facades draw their upper storeys themselves: the shell's openings say how many there are */
  const H0 = W < 6.5 ? 2.6 : clamp(F.H0, 2.6, 2.8), nSt = Math.ceil((H0 + PW.SLAB) / 0.19), single = D < 6;
  // the partitions keep clear of the shell's windows: a wall never meets the outside wall in the middle of a window (the window would have to move off its place)
  const SO = shellOpenings(c).filter(f => f.kind === 'win' && !f.blocked), sx = W / c.w, sz = D / c.d, cxB = (X0 + X1) / 2;
  const sideZ = SO.filter(f => f.wall === 'left' || f.wall === 'right').map(f => f.u * sz), backX = SO.filter(f => f.wall === 'back' || f.wall === 'front').map(f => cxB + f.u * sx);
  const clearOf = (v, list) => list.reduce((m, q) => Math.min(m, Math.abs(q - v)), 9);
  let Zp = single ? D : clamp(Math.round(D * 0.55 * 2) / 2, 3.5, D - 2.5);
  const shopC = fam === 'shopfront', cellarC = !single && (shopC || fam === 'merchant') && (F.wealth > 0 || F.trade === 'butcher') && W >= 8.5, zMin = D >= (cellarC ? 6.5 : 6) ? 4.0 : 3.5, zMax = Math.max(zMin, D - (D >= 6.5 || cellarC ? 2.5 : 2.0));      /* a cellar stair needs its back room 2.5 m deep */      /* [inout] Job 1: a front room 4 m deep where the rooms behind keep 2 m: the door sees 3.5 m of floor before the partition */
  if (!single) { let best = Zp, bs = -1e9; for (let z = 3.5; z <= zMax + 1e-6; z += 0.5) { const cw = clearOf(z, sideZ), sc = (cw >= 0.9 ? 100 + (z >= zMin ? 50 : 0) : cw * 10) - Math.abs(z - D * 0.55); if (sc > bs) { bs = sc; best = z; } } Zp = best; }      /* first clear of the side windows, then 4 m deep for the view from the door */
  const shop = fam === 'shopfront', work = fam === 'workshop' || fam === 'crosspassage', hall = !shop && !work, cellarOK = !single && (shop || fam === 'merchant') && (F.wealth > 0 || F.trade === 'butcher') && W >= 8.5;
  const mir = hHash(id + '|cmir') < 0.5, M = x => mir ? X0 + X1 - x : x, rr = (a, b) => [Math.min(M(a), M(b)), Math.max(M(a), M(b))];      /* house by house the arrangement is mirrored: the stair, the store and the kitchen change sides */
  const split = [0.45, 0.5, 0.55][(hHash(id + '|csplit') * 3) | 0], mirX = x => mir ? X0 + X1 - x : x;
  let Xs = cellarOK ? X0 + 6 : X0 + Math.max(3, Math.min(W - 3, Math.round(W * split * 2) / 2));
  if (!cellarOK && W >= 6) { let best = Xs, bs = -1; for (let x = X0 + 3; x <= X1 - 3 + 1e-6; x += 0.5) { const sc = Math.min(clearOf(mirX(x), backX), 1.2) * 10 - Math.abs(x - Xs); if (sc > bs) { bs = sc; best = x; } } Xs = best; }
  P.dims = { W, D, Dh: Zp }; pLevel(P, 0, 0, H0); pLevel(P, 1, H0 + PW.SLAB, H_UP, two ? {} : { loft: true }); if (cellarOK) pLevel(P, -1, -(2.4 + PW.SLAB), 2.4);
  const nm = shop ? ['shop', 'back', 'store'] : work ? ['work', 'living', 'store'] : single ? ['room'] : ['hall', 'chamber', 'pantry'];
  /* [inout] Job 1 (inbox 11:30): the street door looks into the room. Where the house is deep enough the plan runs lengthwise: the main room the door opens into
     goes the whole depth, the small rooms stand beside it on the wider side, and the stair climbs an open string along that partition away from the door, so the
     view from the door is 5 m or more of floor to the hearth, the table or the counter. Else the old plan, its stair opened up (a string and a rail, no boards below). */
  const wL = 0 - X0, wR = X1 - 0, sg = wL >= wR ? -1 : 1, wide = Math.max(wL, wR), tL = clamp(Math.floor((D - 3.0 - 0.2) / nSt * 100) / 100, 0.18, 0.23), zLow = 1.5;
  let XsL = null; if (!cellarOK && !three && D >= zLow + nSt * 0.18 + 1.6) for (const a of [2.0, 2.5, 3.0]) { const x = sg * a; if (wide - a >= 1.9 && clearOf(x, backX) >= 0.9) { XsL = x; break; } }
  P.lwWhy = XsL !== null ? '' : Zp < 4 && !single ? 'a side window where a 4 m front room would end (' + sideZ.map(v => v.toFixed(1)).join(',') + ')' : cellarOK ? 'cellar' : three ? 'loft ladder' : D < zLow + nSt * 0.18 + 1.6 ? 'depth ' + D : wide < 3.9 ? 'width ' + wide : 'windows ' + backX.map(v => v.toFixed(1)).join(',');
  const lw = XsL !== null; P.layout = lw ? 'lengthwise' : 'across';
  let front, left = null, right = null, up1, up2 = null;
  if (lw) {
    const a = sg < 0 ? [X0, XsL] : [XsL, X1], mR = sg < 0 ? [XsL, X1] : [X0, XsL], sideOne = D < 4.8;
    let Zs = Math.round(D / 2 * 2) / 2; if (!sideOne) { let bs = -1; for (let z = 2.5; z <= D - 2.5 + 1e-6; z += 0.5) { const sc = Math.min(clearOf(z, sideZ), 1.2) * 10 - Math.abs(z - D / 2); if (sc > bs) { bs = sc; Zs = z; } } }
    Zp = D; P.dims = { W, D, Dh: D };
    front = pRoom(P, 0, nm[0], shop ? 'shop' : 'hall', mR[0], 0, mR[1], D, F.fin(0, shop && (F.trade === 'butcher' || F.trade === 'baker') ? { floor: 'stone' } : {}));
    if (sideOne) left = pRoom(P, 0, nm[2], 'store', a[0], 0, a[1], D, { floor: 'stone', win: true });
    else { left = pRoom(P, 0, nm[2], 'store', a[0], 0, a[1], Zs, { floor: 'stone', win: true }); right = pRoom(P, 0, nm[1], hall ? 'bedroom' : 'hall', a[0], Zs, a[1], D, F.fin(0, { floor: 'wood', tint: F.tint2 })); }
    if (two) { up1 = pRoom(P, 1, shop ? 'upfront' : 'solar', 'bedroom', mR[0], 0, mR[1], D, F.fin(1)); up2 = pRoom(P, 1, shop ? 'upback' : 'loft', 'bedroom', a[0], 0, a[1], D, F.fin(1)); }
    else up1 = pRoom(P, 1, 'loft', 'bedroom', X0, 0, X1, D, F.fin(1));
    const zHigh = zLow + nSt * tL;
    pDoor(P, front.id, null, 0, 0); P.clear.push({ x0: -0.8, x1: 0.8, z0: 0, z1: 2.4, k: 0, kind: 'path', room: front });
    pDoor(P, front.id, left.id, XsL, 0.8);
    if (right) { const zb = Math.max(Zs + 0.7, zHigh + 0.7); if (zb <= D - 0.6) pDoor(P, front.id, right.id, XsL, Math.round(zb * 4) / 4); else pDoor(P, left.id, right.id, (a[0] + a[1]) / 2, Zs); }
    if (up2) pDoor(P, up1.id, up2.id, XsL, Math.round(Math.max(zHigh + 0.9, D - 0.9) * 4) / 4);
    const SHL = pShellWins(P, c, B), bd = SHL.list.find(f => f.kind === 'door' && f.lv === 1); if (bd && P.lv[1]) { const pos = Math.round(SHL.pos(bd) * 4) / 4, rU = [up1, up2].find(r => r && pos > r.x0 + 0.6 && pos < r.x1 - 0.6) || up1; pUpperDoor(P, rU, bd, pos); }
    pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: XsL - sg * 0.56, z: zLow, width: 0.9, tread: tL, holeX: 0.5, open: true });
  } else {
    front = pRoom(P, 0, nm[0], shop ? 'shop' : 'hall', X0, 0, X1, Zp, F.fin(0, shop && (F.trade === 'butcher' || F.trade === 'baker') ? { floor: 'stone' } : {}));
    if (!single) { const a = rr(X0, Xs), b = rr(Xs, X1); left = pRoom(P, 0, nm[2], 'store', a[0], Zp, a[1], D, { floor: 'stone', win: true }); right = pRoom(P, 0, nm[1], hall ? 'bedroom' : 'hall', b[0], Zp, b[1], D, F.fin(0, { floor: 'wood', tint: F.tint2 })); }
    if (two && !single && D - Zp >= 2.5) { up1 = pRoom(P, 1, shop ? 'upfront' : 'solar', 'bedroom', X0, 0, X1, Zp, F.fin(1)); up2 = pRoom(P, 1, shop ? 'upback' : 'loft', 'bedroom', X0, Zp, X1, D, F.fin(1)); }      /* [inout] one room upstairs where a back room would be under 2.5 m deep */
    else up1 = pRoom(P, 1, two ? 'chamber' : 'loft', 'bedroom', X0, 0, X1, D, F.fin(1));
    if (three) { pLevel(P, 2, P.lv[1].y + H_UP + PW.SLAB, 2.4, { loft: true }); pRoom(P, 2, up1.id === 'loft' || (up2 && up2.id === 'loft') ? 'garret' : 'loft', 'store', X0, 0, X1, D, F.fin(1)); }
    if (cellarOK) { const a = rr(X0, Xs); pRoom(P, -1, 'cellar', 'cellar', a[0], Zp, a[1], D, { floor: 'stone', win: false }); }
    pDoor(P, front.id, null, 0, 0); P.clear.push({ x0: -0.8, x1: 0.8, z0: 0, z1: 2.4, k: 0, kind: 'path', room: front });
    const sRun = wide >= 0.8 + nSt * 0.18 + 0.3, xN = sg < 0 ? X1 - 0.8 : X0 + 0.8;      /* [inout] Job 1: the stair starts beside the door line and climbs to the wider side wall: nothing across the view */
    if (!single && !sRun) { pDoor(P, front.id, left.id, M(X0 + 0.8), Zp); pDoor(P, front.id, right.id, M(X1 - 0.8), Zp); }
    else if (!single) { const xc = sg * 0.2, inR = (r, x) => x > r.x0 + 0.5 && x < r.x1 - 0.5, done = [];
      for (const r of [left, right]) { const x = inR(r, xc) ? xc : inR(r, xN) ? xN : null; if (x !== null) { pDoor(P, front.id, r.id, x, Zp); done.push(r); } }
      if (done.length === 1) pDoor(P, left.id, right.id, Math.abs(left.x1 - right.x0) < 0.01 ? left.x1 : left.x0, Math.round((Zp + D) / 2 * 2) / 2); }      /* a back room behind the stair is reached through the other */
    if (up2) pDoor(P, up1.id, up2.id, sRun ? xN : M(X1 - 0.8), Zp);
    const SHL = pShellWins(P, c, B), bd = SHL.list.find(f => f.kind === 'door' && f.lv === 1); if (bd && P.lv[1]) pUpperDoor(P, up1, bd, Math.round(SHL.pos(bd) * 4) / 4);      /* an upper door the shell shows opens from the front room upstairs */
    const lat = single ? D - 0.6 : Zp - 0.6, p0 = X0 + 1.45,      /* 1.2 m clear at the foot */ tread = clamp(Math.floor((X1 - 1.45 - p0) / nSt * 100) / 100, 0.18, 0.23);      /* and at the head */      /* a longer stair where it fits: its well is then long enough to jump down */      /* narrow houses get a steeper stair, as they had */
    if (sRun) pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: sg, x: sg * 0.8, z: lat, width: 0.9, tread: clamp(Math.floor((wide - 0.8 - 0.3) / nSt * 100) / 100, 0.18, 0.23), holeX: 0, exit: -1 });
    else pStair(P, { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: mir ? -1 : 1, x: M(p0), z: lat, width: 0.9, tread, holeX: 0.5 });
    if (cellarOK) pStair(P, { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: mir ? -1 : 1, x: M(X0 + 1.45), z: D - 0.6, width: 0.9, tread: 0.2, holeX: 0.5 });      /* [inout] a well long enough to jump down */
    { const q = P.stairs.find(q => q.id === 'stUp'); if (q) q.open = true; }
  }
  pLayout(P); pBalconies(P, c); hUnderStair(P, P.stairs.find(q => q.id === 'stUp'));
  let lad = null; if (three) { for (const sdL of mir ? ['e', 'w'] : ['w', 'e']) for (const z of [1.2, 1.6, D - 1.6, D / 2]) if (!lad) lad = pLadder(P, 1, sdL, z); if (!lad) P.err.push('no ladder to the loft'); }
  for (const q of P.stairs) { const h = q.high || q.low, x0 = Math.min(q.p1, q.p1 + q.dir * 1.4), x1 = Math.max(q.p1, q.p1 + q.dir * 1.4); P.clear.push(q.axis === 'x' ? { x0, x1, z0: q.lat - 0.6, z1: q.lat + 0.6, k: q.k0, kind: 'stair' } : { x0: q.lat - 0.6, x1: q.lat + 0.6, z0: x0, z1: x1, k: q.k0, kind: 'stair' }); }      /* the floor below a stair head stays clear of a fire: its chimney stack would stand at the top of the stair */
  // the fire: in the kitchen or the chamber behind, else in the front room's end wall
  const fireRoom = single ? front : hall ? front : right; let hh = null;
  { const rooms = [...new Set([fireRoom, right, front, left].filter(Boolean))], cand = [];
    for (const rm of rooms) for (const sd of ['e', 'w', 's']) for (const t of [0.5, 0.3, 0.7]) cand.push([rm, sd, sd === 's' ? rm.x0 + (rm.x1 - rm.x0) * t : rm.z0 + (rm.z1 - rm.z0) * t]);
    /* the chimney stack goes up through the floor above: a fire whose stack would leave a pocket of that floor reachable only by a squeeze (under 0.9 m) is not taken (rooms_people: "a way crosses stack1") */
    const stackOK = () => { const hz = P.hearths[P.hearths.length - 1], tmp = [1, 2].filter(k => P.lv[k] && !P.lv[k].loft).map(k => ({ id: P.id + '.stack' + k, kind: 'hearth', k, x0: hz.rect.x0, z0: hz.rect.z0, x1: hz.rect.x1, z1: hz.rect.z1, h: 2.4 })); P.items.push(...tmp); const reach = pReach(P), ok = stackOK1(reach); P.items.length -= tmp.length; return ok; };
    const stackOK1 = reach => { for (const it of P.items) { if (it.kind !== 'hearth' || !/\.stack[12]$/.test(it.id)) continue; if (P.items.some(o => o !== it && o.k === it.k && (o.kind === 'floor' || o.kind === 'stair' || o.kind === 'post') && rOv(o, it, 0.02)) || P.clear.some(q => q.k === it.k && q.kind === 'stair' && rOv(q, it, 0.02))) return false;      /* [inout] nor through a ladder or a stair above */ const k = +it.id.slice(-1), cx = (it.x0 + it.x1) / 2, cz = (it.z0 + it.z1) / 2, rm = pRoomAt(P, k, cx, cz); if (!rm || P.lv[k].loft) continue;
      for (const [x, z] of [[it.x0 - 0.75, cz], [it.x1 + 0.75, cz], [cx, it.z0 - 0.75], [cx, it.z1 + 0.75]]) { if (x < rm.in.x0 + 0.35 || x > rm.in.x1 - 0.35 || z < rm.in.z0 + 0.35 || z > rm.in.z1 - 0.35) continue; if (P.holes.some(h => h.k === k && x > h.r.x0 - 0.3 && x < h.r.x1 + 0.3 && z > h.r.z0 - 0.3 && z < h.r.z1 + 0.3)) continue; if (!reach(k, x, z, 0.45)) return false; } } return true; };
    for (const [rm, sd, a] of cand) for (const wd of [1.4, 1.1]) { if (hh) break; const sn = pSnap(P, P.c.int), n0 = P.items.length, c0 = P.clear.length, hs = P.hearths, pc = (P.pierCols || []).length, li = Object.assign({}, P.lightIn); hh = pHearth(P, rm, sd, wd, { cauldron: true, size: 0.42, at: a }); if (hh && !stackOK()) { pUndo(P, P.c.int, sn); P.items.length = n0; P.clear.length = c0; P.hearths = hs; if (P.pierCols) P.pierCols.length = pc; P.lightIn = li; hh = null; } }
    const ovUp = () => { const hz = P.hearths[P.hearths.length - 1]; return [1, 2].some(k => P.lv[k] && (P.items.some(o => o.k === k && (o.kind === 'floor' || o.kind === 'stair' || o.kind === 'post') && rOv(o, hz.rect, 0.02)) || P.clear.some(q => q.k === k && q.kind === 'stair' && rOv(q, hz.rect, 0.02)))); };
    if (!hh) for (const [rm, sd, a] of cand) for (const wd of [1.4, 1.1]) { if (hh) break; const sn = pSnap(P, P.c.int), n0 = P.items.length, c0 = P.clear.length, hs = P.hearths, pc = (P.pierCols || []).length, li = Object.assign({}, P.lightIn); hh = pHearth(P, rm, sd, wd, { cauldron: true, size: 0.42, at: a }); if (hh && ovUp()) { pUndo(P, P.c.int, sn); P.items.length = n0; P.clear.length = c0; P.hearths = hs; if (P.pierCols) P.pierCols.length = pc; P.lightIn = li; hh = null; } } }      /* else as before, but never with its stack through a ladder or a stair above */
  if (hh) { pPier(P, 1, hh); if (cellarOK) pPier(P, -1, hh); }
  P.hall = { room: hh ? pRoomAt(P, 0, hh.front[0], hh.front[1]) || front : front, hh };
  if (hh) { const dx = hh.front[0] - hh.px, dz = hh.front[1] - hh.pz, l = Math.hypot(dx, dz) || 1; let hx = hh.front[0] + dx / l * 0.5, hz = hh.front[1] + dz / l * 0.5; { let rm0 = pRoomAt(P, 0, hx, hz) || front; const ar = r => (r.x1 - r.x0) * (r.z1 - r.z0); if (ar(rm0) < 14 && ar(front) > ar(rm0)) { rm0 = front; const cc = pCentre(front); hx = cc[0]; hz = cc[1]; } let ok = false; const places = (x0, z0) => { const pl = []; for (let x = x0 - 2; x <= x0 + 2; x += 0.35) for (let z = z0 - 2; z <= z0 + 2; z += 0.35) { const dd = Math.hypot(x - x0, z - z0); if (dd > 2 || dd < 0.6) continue; const rm = pRoomAt(P, 0, x, z); if (!rm || !pFit(P, rm, rectOf(x, z, 0.6, 0.6), { h: 1.8, lowOk: true, noClear: true })) continue; if (!pl.some(q => Math.hypot(q[0] - x, q[1] - z) < 0.7)) pl.push([x, z]); } return pl.length; };
        let bestN = -1, tried = 0; for (const rmC of [rm0, front].filter((r, i, a) => r && a.indexOf(r) === i)) for (const [x, z] of pCands(rmC, rmC === rm0 ? [hx, hz] : pCentre(rmC))) { if (tried > 60) break; if (!pFit(P, rmC, rectOf(x, z, 1.7, 1.7), { h: 1.8, lowOk: true })) continue; tried++; const n = Math.min(places(x, z), 5); if (n > bestN) { bestN = n; ok = [x, z]; } if (n >= 5) break; } if (ok) { hx = ok[0]; hz = ok[1]; } }      /* [inout] the household's place: four or more to stand round it (the interiors test), nearest the fire first */      /* a small kitchen: the household's place is the front room */      /* where the household works and waits: open floor round it, so three of them have a place each (77c_patrons.js claims a ring round a spot) */ const rm = pRoomAt(P, 0, hx, hz) || front, cc = pCentre(rm), far = Math.hypot(cc[0] - hx, cc[1] - hz) > 1.2; pSpot(P, 'home', hx, hz, far ? Math.atan2(cc[0] - hx, -(cc[1] - hz)) : 0, { k: 0 }); }      /* a step back from the fire, turned to the room: not with the face in the chimney breast */
  // the trade in the front room, its counter if it sells; where the worker stands
  if (!hall) { hTrade(P, c, front, F); if (shop && !P.counter) for (const ln of [2.4, 2.0, 1.6]) if (cnt(P, front, F, ln, ['bottle', 'jar', 'bowl', 'candle'], 'k')) break; }
  if (!P.spots.work && P.focal) { const fx = P.focal.x, fz = P.focal.z; for (const [x, z] of pCands(front, [fx, fz - 1.1])) { if (Math.hypot(x - fx, z - fz) > 3.2) break; if (pFit(P, front, rectOf(x, z, 0.7, 0.7), { h: 1.8, lowOk: true })) { pSpot(P, 'work', x, z, Math.atan2(fx - x, -(fz - z)), { k: 0 }); break; } } }
  const e = P.doors.find(d => d.b === null); if (e) pPut(P, front, id + '.mat', e.x, 1.1, 0, 1.8, 1.2, 0.02, pdRug(1.8, 1.2, F.rug), { flat: true, noClear: true });
  // where they eat: the table by the fire
  const eat = P.hall.room, dn = pDining(P, eat, 1.4, 0.75, { near: hh ? [hh.front[0] + (hh.front[0] > (eat.x0 + eat.x1) / 2 ? -1.2 : 1.2), hh.front[1]] : pCentre(eat), id: 'meal', n: 2, items: ['bowl', 'mug', 'loaf'] });
  if (dn) dn.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], 0));
  if (!P.spots.sit) { const sk = pPiece(P, eat, 'painted_wooden_stool', { near: hh ? hh.front : pCentre(eat), id: 'stool', soft: true }); if (sk) pSit(P, 'sit', sk.cx, sk.cz, 0, 0); }
  if (hh && !P.spots.fire1) { const sp = P.spots.home, fr = sp ? pToLocal(P)(...sp.p) : null; if (fr) for (const [dx, dz] of [[0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]]) { const x = fr[0] + dx, z = fr[2] + dz; if (pRoomAt(P, 0, x, z) && pFit(P, pRoomAt(P, 0, x, z), rectOf(x, z, 0.6, 0.6), { h: 1.8, lowOk: true })) { pSpot(P, 'fire1', x, z, Math.atan2(hh.px - x, -(hh.pz - z)), { k: 0 }); break; } } }      /* a second place by the fire, not the same one */
  const spec = typeof ROOMS_SPEC !== 'undefined' && ROOMS_SPEC[id];      /* docs/ROOMS.md names this house's things: placed after the beds (hRooms) */
  const lite = F.wealth >= 2 ? 'brass_candleholders_c' : 'wooden_candlestick';
  if (!spec) pPiece(P, eat, 'painted_wooden_cabinet', { side: ['n', 's', 'w', 'e'], top: F.wealth > 0 ? [[lite, 0.3, 0, 1, 0, true]] : [] });
  if (!spec && F.wealth === 0) pPiece(P, eat, 'wooden_candlestick', { near: dn ? [dn.x, dn.z] : pCentre(eat), lit: 3.5, soft: true, opt: { lowOk: true } });
  // the store or pantry: shelves and what is kept
  if (!spec && left && left !== eat && !cellarOK) { pPiece(P, left, 'painted_wooden_shelves', { side: ['w', 's', 'n'], sc: 1.5, top: [['ceramic_pot', 0, 0, 0.6, 0]] }); pPiece(P, left, 'Barrel', { side: ['s', 'w'] }); pStock(P, left, { sacks: work || shop ? 2 : 1, near: pCentre(left) }); }
  if (!spec && right && right !== eat && hall) pPiece(P, right, 'classicnightstand_01', { side: ['e', 's', 'w'], top: [['wooden_candlestick', 0, 0, 1, 0, true]] });
  // beds: one per sleeper, upstairs first; the chamber below in a hall house
  const bedRooms = [up1, up2, hall ? right : null].filter(Boolean), first = up2 || up1;
  dressBedroom(P, first, { beds: castBeds(P.id, ['bed']), bedRooms: bedRooms.filter(r => r !== first), blanket: F.blanket, loot: hLoot(F), bedInteract: true, fur: F.wealth > 0, table: F.wealth > 0, chest: true });
  if (!World.interact.some(i => i.id === P.id + '.chest')) for (const r of [first].concat(bedRooms, [right, left, front])) { if (!r) continue; const ch = pPiece(P, r, 'treasure_chest', { side: ['s', 'n', 'e', 'w'], id: 'chest' }) || pPiece(P, r, 'treasure_chest', { near: pCentre(r), id: 'chest' }); if (ch) { pInteract(P, ch.cx, 0.5, ch.cz, { kind: 'chest', id: P.id + '.chest', loot: hLoot(F), r: 1.8 }, r.k); break; } }      /* the household's chest, wherever the bed corner left no room for it */
  if (cellarOK && P.rooms.cellar) hCellarChest(P, P.rooms.cellar, F);      /* [inout] the chest first: the cellar's row of the table fills the rest */
  if (spec) hRooms(P, c, F);
  for (const r of bedRooms) if (!spec && r !== first) pPiece(P, r, 'wooden_candlestick', { near: pCentre(r), lit: 3.5, soft: true, opt: { lowOk: true } });
  const lo2 = Object.values(P.rooms).find(r => r.k === 2); if (three && lo2) { const lo = lo2; pStock(P, lo, { sacks: 3, crates: 2, near: [(lo.x0 + lo.x1) / 2 + (mir ? -1 : 1), (lo.z0 + lo.z1) / 2] }); pPiece(P, lo, 'treasure_chest', { side: ['s', 'n'] }); pPiece(P, lo, 'wooden_lantern_01', { near: [(lo.x0 + lo.x1) / 2, lo.z1 - 0.8], lit: 4.5, soft: true, opt: { lowOk: true } }); }      /* what the shop keeps under its roof */
  if (cellarOK) { const cel = P.rooms.cellar; if (!World.interact.some(i => i.id === P.id + '.cellarchest')) hCellarChest(P, cel, F); dressCellar(P, cel, { barrels: 1, crates: 1, rows: false }); }      /* the chest first: it is what the cellar is for */
  hMemo(P, F);
  for (const r of Object.values(P.rooms)) if (!P.lightIn[r.id]) pLamp(P, r, ...pCentre(r));      /* a room no window or candle lights gets one lantern (the validator asks for a light in every room) */
  if (!hh && !small) P.err.push('no hearth fits');      /* a one-room shop on a 4 m front has no fire of its own (a brazier, the baker's oven next door) */
}
{ const _hb = hBuild; hBuild = function (P, c, info) { if (!INOUT_FIT.has(P.id)) return _hb(P, c, info); const F = hCtx(P, c); P.fam = F; hCompact(P, c, F); }; for (const id in PLANS) if (PLANS[id] === _hb) PLANS[id] = hBuild; }
// the Market Place's infill houses
for (const id of ['in.02', 'in.04', 'in.07', 'in.08', 'in.10', 'in.12', 'in.13', 'in.15', 'in.21', 'in.40', 'in.44', 'in.74', 'in.90', 'in.94', 'in.116']) INOUT_FIT.add(id);
// the six alley shops: shop below, chamber above (their third storey waits for a corner stair: docs/reports/THREE.md)
for (const id of ['shop.n2', 'shop.n3', 'shop.n4', 'shop.s0', 'shop.s1', 'shop.s2']) INOUT_FIT.add(id);
// Chapelgate
for (const id of ['in.33', 'in.45', 'in.66', 'in.67', 'in.70', 'in.77', 'in.82']) INOUT_FIT.add(id);
// Wharfside and Highfold
for (const id of ['in.20', 'in.23', 'in.34', 'in.36', 'in.37', 'in.38', 'in.51', 'in.60', 'in.111', 'in.113', 'in.115', 'hunter', 'fisher', 'high.a', 'high.c']) INOUT_FIT.add(id);
// Riverside and Westgate
for (const id of ['mill', 'farm', 'in.65', 'in.75', 'in.93']) INOUT_FIT.add(id);

// ───────── [inout] furnishing from docs/ROOMS.md (src/72n_rooms.js, made by tools/rooms_data.mjs) ─────────
// The rooms the plan made are matched to the rows of the table by name (the families' names are kept for that), then by what they are; each row's kit
// pieces are placed in its room: tall ones with their backs to a wall, things that hang on a wall hung, small ones by a wall; then the row's light.
// What the plan already places from the same row is not doubled: beds (dressBedroom), the household chest, the fire's cauldron, the counter, one table where
// the household eats, and the stools (the seats pass makes them). Names with no kit piece are kept on P.missing for the report.
const ROOM_SKIP = { gothicbed_01: 1, Cauldron: 1, gen_counter: 1, folding_wooden_stool: 1, painted_wooden_stool: 1, Chandelier: 1 };
const ROOM_TABLES = { woodentable_01: 1, painted_wooden_table: 1, wooden_table_02: 1 };
const ROOM_LIT = { wooden_candlestick: 3.5, brass_candleholders_c: 4.5, CandleStick_Stand: 6, wooden_lantern_01: 5 };
function hRoomFor(P, name) {
  if (P.rooms[name] && P.rooms[name].k >= 0) return P.rooms[name];
  const by = (k, kinds) => Object.values(P.rooms).find(r => r.k === k && kinds.includes(r.kind));
  return { leg: P.rooms.work || P.rooms.shop, room: P.rooms.room || P.rooms.hall, living: P.rooms.back || P.rooms.chamber, kitchen: P.rooms.back || P.rooms.living, solar: P.rooms.upfront || P.rooms.loft, upfront: P.rooms.solar || P.rooms.chamber, upback: P.rooms.loft, loft: by(1, ['bedroom']) || by(2, ['store']), chamber: by(1, ['bedroom']), pantry: P.rooms.store, store: P.rooms.pantry || P.rooms.store, back: P.rooms.living || P.rooms.chamber, hall: P.rooms.work || P.rooms.shop || P.rooms.room }[name] || null;
}
// [inout] Job 2 (inbox 13:55): the join between the plan's rooms and the table's is explicit. Each plan room takes the table's room of its own name, else one of the
// same use (ROOM_ALIAS, in order), and the table's rooms the plan has no room for (the lean-to `leg`, the `yard`) go to the room of their use. A room nothing in the
// table reaches gets the household's ordinary things for its use (ROOM_DEFAULT). P.roomJoin says which, room by room; test/interiors.js fails a room with neither.
const ROOM_ALIAS = { shop: ['shop', 'work', 'leg', 'hall', 'room'], work: ['work', 'shop', 'leg', 'hall', 'room'], hall: ['hall', 'room', 'living', 'work', 'shop'], room: ['room', 'hall', 'living', 'work', 'shop'],
  living: ['living', 'back', 'kitchen', 'service', 'parlour', 'chamber', 'hall'], back: ['back', 'living', 'kitchen', 'service', 'parlour', 'hall'], chamber0: ['chamber', 'bedroom', 'living', 'back', 'parlour'],
  store: ['store', 'pantry', 'buttery', 'stock', 'yard', 'service', 'coalstore'], pantry: ['pantry', 'store', 'buttery', 'stock', 'yard', 'service'], cellar: ['cellar', 'vault'],
  upfront: ['upfront', 'solar', 'chamber', 'bedroom', 'counting', 'study', 'landing'], solar: ['solar', 'upfront', 'chamber', 'bedroom', 'counting', 'landing'], chamber1: ['chamber', 'solar', 'upfront', 'bedroom', 'upback', 'loft'],
  upback: ['upback', 'loft', 'chamber', 'attic', 'bedroom'], loft: ['loft', 'upback', 'attic', 'chamber'], garret: ['loft', 'attic', 'upback'] };
const ROOM_DEFAULT = { store: [['Barrel', 2], ['Bag', 2], ['Shelf_Simple', 1], ['wooden_bucket_01', 1], ['Crate_Wooden', 1]], cellar: [['Barrel', 3], ['Crate_Wooden', 2], ['Bag', 1]],
  loft: [['treasure_chest', 1], ['wicker_basket_02', 2], ['Bag', 2], ['Crate_Wooden', 1]], bedroom: [['treasure_chest', 1], ['wicker_basket_02', 1], ['Shelf_Simple', 1]],
  hall: [['Shelf_Simple', 1], ['wooden_bucket_01', 1], ['wicker_basket_02', 1]], shop: [['Crate_Wooden', 1], ['Shelf_Simple', 1], ['Bag', 1]], corridor: [['Peg_Rack', 1]] };
function hRoomUse(r) { const k = r.id === 'chamber' ? 'chamber' + (r.k > 0 ? 1 : 0) : r.id; return ROOM_ALIAS[k] ? k : r.k < 0 ? 'cellar' : r.kind === 'store' ? 'store' : r.kind === 'shop' ? 'shop' : r.kind === 'hall' ? 'hall' : r.k >= 2 ? 'garret' : r.k === 1 ? 'upback' : 'living'; }
function hRoomsByName(P, c, F) {      /* the join by name (Build 87): kept until the explicit join passes the gate */
  const S = typeof ROOMS_SPEC !== 'undefined' && ROOMS_SPEC[P.id]; if (!S) return false;
  const placed = [];
  for (const rn in S.rooms) {
    const spec = S.rooms[rn], room = hRoomFor(P, rn); if (!room || room.kind === 'yard') continue;
    let tableSkip = !!P.items.find(it => it.k === room.k && /\.(meal|table|long)/.test(it.id || '') && it.x0 >= room.x0 - 0.1 && it.x1 <= room.x1 + 0.1 && it.z0 >= room.z0 - 0.1 && it.z1 <= room.z1 + 0.1);
    for (const [nm, n0] of spec.furn) {
      if (ROOM_SKIP[nm]) continue; let n = Math.min(n0, 4);
      if (ROOM_TABLES[nm] && tableSkip) { tableSkip = false; n--; }
      if (nm === 'treasure_chest' && World.interact.some(i => i.id === P.id + '.chest')) n--;
      for (let i = 0; i < n; i++) {
        if (!Kit.pieces[nm]) { (P.missing = P.missing || []).push(nm); break; }
        let it = null;
        if (KIT_WALL[nm]) { const sides = ['n', 's', 'e', 'w']; for (const sd of sides) { const [a, b] = sd === 'n' || sd === 's' ? [room.in.x0, room.in.x1] : [room.in.z0, room.in.z1]; for (let u = a + 0.8; u < b - 0.6 && !it; u += 0.6) it = pKitWall(P, room, sd, u, nm); if (it) break; } }
        else { const p = Kit.pieces[nm], tall = (p.max[1] - p.min[1]) * (nm === 'painted_wooden_shelves' ? 1.5 : 1) > 0.85; it = pPiece(P, room, nm, { side: ['n', 's', 'e', 'w'], id: nm + i, sc: nm === 'painted_wooden_shelves' ? 1.5 : 1, opt: tall ? { lowOk: false } : { lowOk: true } }) || (ROOM_TABLES[nm] ? pPiece(P, room, nm, { near: pCentre(room), id: nm + i }) : null);      /* a table may stand free */ }
        if (it) placed.push(rn + ':' + nm); else (P.unplaced = P.unplaced || []).push(rn + ':' + nm);
      }
    }
    for (const [nm, n] of spec.light) for (let i = 0; i < Math.min(n, 3); i++) {
      if (nm === 'Torch_Metal') { for (const sd of ['n', 's', 'e', 'w']) if (pTorch(P, room, sd, sd === 'n' || sd === 's' ? (room.in.x0 + room.in.x1) / 2 + i : (room.in.z0 + room.in.z1) / 2 + i, 1.7, 6)) break; continue; }
      if (!Kit.pieces[nm]) continue;
      pPiece(P, room, nm, { side: nm === 'CandleStick_Stand' ? ['n', 's', 'e', 'w'] : undefined, near: pCentre(room), id: 'light' + i, lit: ROOM_LIT[nm] || 4, soft: nm !== 'CandleStick_Stand', opt: { lowOk: nm !== 'CandleStick_Stand' && nm !== 'wooden_lantern_01' } });
    }
  }
  P.roomsSpec = placed.length; return true;
}
const ROOM_JOIN = false;      /* [inout] Job 2: the explicit join, switched on when its furnishing passes the gate */
function hRooms(P, c, F) {
  if (!ROOM_JOIN) return hRoomsByName(P, c, F);
  const S = typeof ROOMS_SPEC !== 'undefined' && ROOMS_SPEC[P.id]; if (!S) return false;
  const placed = [], used = new Set(), join = P.roomJoin = {}, rooms = Object.values(P.rooms).filter(r => r.kind !== 'yard');
  const take = (r, rn) => { used.add(rn); (join[r.id] = join[r.id] || []).push('spec:' + rn); };
  for (const r of rooms) if (S.rooms[r.id] && !used.has(r.id)) take(r, r.id);
  for (const r of rooms) if (!join[r.id]) { const rn = (ROOM_ALIAS[hRoomUse(r)] || []).find(n => S.rooms[n] && !used.has(n)); if (rn) take(r, rn); }
  for (const rn in S.rooms) if (!used.has(rn)) { const r = rooms.find(q => (ROOM_ALIAS[hRoomUse(q)] || []).includes(rn) && q.k >= 0) || (rn === 'yard' || rn === 'leg' ? rooms.find(q => q.k === 0 && /store|pantry|work|shop/.test(q.id)) : null); if (r) take(r, rn); }
  for (const r of rooms) if (!join[r.id]) join[r.id] = ['default:' + (r.k < 0 ? 'cellar' : r.kind === 'corridor' ? 'corridor' : r.kind === 'store' ? 'store' : r.k >= 1 ? (/loft|garret|upback/.test(r.id) ? 'loft' : 'bedroom') : r.kind === 'shop' ? 'shop' : 'hall')];
  for (const room of rooms) for (const src of join[room.id]) {
    const [how, rn] = src.split(':'), spec = how === 'spec' ? S.rooms[rn] : { furn: ROOM_DEFAULT[rn] || [], light: [] };
    let tableSkip = !!P.items.find(it => it.k === room.k && /\.(meal|table|long)/.test(it.id || '') && it.x0 >= room.x0 - 0.1 && it.x1 <= room.x1 + 0.1 && it.z0 >= room.z0 - 0.1 && it.z1 <= room.z1 + 0.1);
    for (const [nm, n0] of spec.furn) {
      if (ROOM_SKIP[nm]) continue; let n = Math.min(n0, 4);
      if (ROOM_TABLES[nm] && tableSkip) { tableSkip = false; n--; }
      if (nm === 'treasure_chest' && World.interact.some(i => i.id === P.id + '.chest')) n--;
      for (let i = 0; i < n; i++) {
        if (!Kit.pieces[nm]) { (P.missing = P.missing || []).push(nm); break; }
        let it = null;
        if (KIT_WALL[nm]) { const sides = ['n', 's', 'e', 'w']; for (const sd of sides) { const [a, b] = sd === 'n' || sd === 's' ? [room.in.x0, room.in.x1] : [room.in.z0, room.in.z1]; for (let u = a + 0.8; u < b - 0.6 && !it; u += 0.6) it = pKitWall(P, room, sd, u, nm); if (it) break; } }
        else { const p = Kit.pieces[nm], tall = (p.max[1] - p.min[1]) * (nm === 'painted_wooden_shelves' ? 1.5 : 1) > 0.85; it = pPiece(P, room, nm, { side: ['n', 's', 'e', 'w'], id: nm + room.id + i, sc: nm === 'painted_wooden_shelves' ? 1.5 : 1, opt: tall ? { lowOk: false } : { lowOk: true } }) || (ROOM_TABLES[nm] ? pPiece(P, room, nm, { near: pCentre(room), id: nm + room.id + i }) : null);      /* a table may stand free */ }
        if (it) placed.push(room.id + ':' + nm); else (P.unplaced = P.unplaced || []).push(room.id + ':' + nm);
      }
    }
    for (const [nm, n] of spec.light) for (let i = 0; i < Math.min(n, 3); i++) {
      if (nm === 'Torch_Metal') { for (const sd of ['n', 's', 'e', 'w']) if (pTorch(P, room, sd, sd === 'n' || sd === 's' ? (room.in.x0 + room.in.x1) / 2 + i : (room.in.z0 + room.in.z1) / 2 + i, 1.7, 6)) break; continue; }
      if (!Kit.pieces[nm]) continue;
      pPiece(P, room, nm, { side: nm === 'CandleStick_Stand' ? ['n', 's', 'e', 'w'] : undefined, near: pCentre(room), id: 'light' + room.id + i, lit: ROOM_LIT[nm] || 4, soft: nm !== 'CandleStick_Stand', opt: { lowOk: nm !== 'CandleStick_Stand' && nm !== 'wooden_lantern_01' } });
    }
  }
  P.roomsSpec = placed.length; return true;
}
