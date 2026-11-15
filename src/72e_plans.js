// ───────────────────────── the rooms' recipes, the generic house plan and the designed plans ─────────────────────────
// planBuild(c) is called from buildHouse for a cell: it lays out the plan, dresses it, builds it and registers everything the village looks for.
const PLANS = {};          // site id -> (P, c, info) => void : a designed plan (otherwise planHouse's generic one)
const LOOT = { inn: [['gold', 6], ['apple', 1]], store: [['gold', 8]], draper: [['gold', 5]] };
const READS = {
  'inn.note': { title: 'A note on the table', text: 'Traveller — the bed by the window is yours for as long as you stay. Breakfast when the cock crows, ale when the sun sets. — G.' },
  'elder.book': { title: 'Rowan’s chronicle', text: 'Year of the long frost. The beacon on the crag has stood dark since my grandfather’s day, yet the valley endures. We kept the Dawn bell ringing through every winter but this one.' },
  'draper.ledger': { title: 'The draper’s ledger', text: 'Blue wool, six ells, for the miller’s coat. Red linen for the chapel banners, paid in apples. A bolt of green for Lark, who has promised a song instead of coin.' },
  'chapel.book': { title: 'Book of the Dawn', text: 'When the night is longest, ring the bell and light the fire, that those lost upon the fells may find their way home.' },
};
const OUTDOOR_SPOT = /^(garden|yard|field2?|porch|door|stall\d?|front|bard)$/;      // spots a schedule names that are outside the building (the village code makes them)
// the indoor spot names the villagers' schedules want in this building
function planNeeds(id) {
  const want = new Set();
  for (const d of NPC_DEFS) for (const r of d.sched) for (const sp of [].concat(r[1])) if (typeof sp === 'string' && sp.startsWith(id + '.')) { const n = sp.slice(id.length + 1); if (!OUTDOOR_SPOT.test(n) || id === 'inn' && n === 'bard') want.add(n); }
  return want;
}
const dRot = (rot, a) => a + rot;

// ── drawn things ──
const pdTable = (len, wid, items, n, c) => m => { Props.table(m, len, wid); if (items) Props.clutter(m, c.R, -len / 2 + 0.25, len / 2 - 0.25, 0.76, 0, items, n || 3, c); };
const pdChest = m => Props.chest(m), pdChair = m => Props.chair(m), pdStool = m => Props.stool(m), pdBench = len => m => Props.bench(m, len);
const pdBed = (w, blanket, fur) => m => Props.bed(m, w, blanket, fur);
const pdShelf = (len, h, lv, fill) => m => Props.shelf(m, len, h, lv, 0.32, fill);
const pdBarrel = (r, h) => m => Props.barrel(m, r, h), pdCrate = s => m => Props.crate(m, s), pdSack = (s, col) => m => Props.sack(m, s, col);
const pdRug = (w, l, col) => m => Props.rug(m, w, l, col);
const stockFill = (c, kinds) => (i, y) => Props.clutter(P_M(c), c.R, -0.65, 0.65, y, 0, kinds, 4, c);
const P_M = c => c.int;

// a hearth with its back to a wall of the room: breast to the ceiling, fire, light; the stack goes up through the levels above (pier) and down (a cellar pier)
function pHearth(P, room, side, wid, o) {
  o = o || {}; const L = P.lv[room.k], H = L.H, dep = 0.8, m = P.c.int, hor = side === 'n' || side === 's';
  const s = pWallSlot(P, room, side, wid + 0.3, dep + 0.1, Object.assign({ lowOk: false, at: o.at, noClear: false }, o)); if (!s) return null;
  const rot = { w: 0, e: PI, n: -PI / 2, s: PI / 2 }[side], px = hor ? s.cx : (side === 'w' ? room.in.x0 : room.in.x1), pz = hor ? (side === 'n' ? room.in.z0 : room.in.z1) : s.cz;
  m.m1 = P.zone; m.ao = INT_AO;
  at(m, px, L.y + 0.02, pz, rot, () => {
    m.mat(MAT.STONE, [0.95, 0.93, 0.9], 0.8);
    m.box(0, 0, -wid / 2, dep, 1.15, -wid / 2 + 0.38); m.box(0, 0, wid / 2 - 0.38, dep, 1.15, wid / 2); m.box(0, 1.15, -wid / 2, dep, H - 0.02, wid / 2);
    m.box(0, 0, -wid / 2 + 0.38, 0.14, 1.15, wid / 2 - 0.38, 1 | 4 | 8); m.box(0, 0, -wid / 2 - 0.15, dep + 0.35, 0.07, wid / 2 + 0.15, 4);
    m.mat(MAT.TIMBER, COL.woodDark); m.box(0, 1.5, -wid / 2 - 0.1, dep + 0.12, 1.6, wid / 2 + 0.1);          // the mantel beam
    m.mat(MAT.PLAIN, [0.07, 0.06, 0.06]); m.quad([0.145, 1.15, wid / 2 - 0.38], [0.145, 0.07, wid / 2 - 0.38], [0.145, 0.07, -wid / 2 + 0.38], [0.145, 1.15, -wid / 2 + 0.38]);
    at(m, dep * 0.55, 0.07, 0, PI / 2, () => Props.logs(m, 3, 0.55, 0.06));
    emit(m, 1.3, () => { m.mat(MAT.PLAIN, [1, 0.35, 0.08]); m.box(dep * 0.25, 0.07, -0.28, dep * 0.85, 0.10, 0.28, 4); });
    if (o.cauldron) { at(m, dep * 0.55, 0.42, 0, 0, () => Props.cauldron(m, 0.2)); m.mat(MAT.METAL, COL.black); m.box(dep * 0.55 - 0.01, 0.7, -0.01, dep * 0.55 + 0.01, 1.15, 0.01); }
    World.emitters.push({ type: 'fire', p: wp(m, dep * 0.55, 0.2, 0), size: o.size || 0.5, zone: P.zone });
    addLight(wp(m, dep + 0.7, 0.85, 0), o.r || 9.5, o.c || [3.4, 1.75, 0.62], P.zone, 'fire');
    addBoxCollider(m, 0, -wid / 2 - 0.1, dep + 0.25, wid / 2 + 0.1, 0, 2);
  });
  if (o.deco !== false) {          // mantel objects, antlers over the breast, a rug and firewood by the fire
    at(m, px, L.y + 0.02, pz, rot, () => {
      if (typeof kitLit === 'function' && Kit.pieces.CandleStick_Triple) for (const sg of [-1, 1]) kitLit(m, 'CandleStick_Triple', 0.42, 1.6 - 0.02, sg * (wid / 2 - 0.32), 0.8, sg, { cap: 0, kind: 'candle', flame: 'candle' });
      if (Kit.pieces.Vase_4) kp(m, 'Vase_4', 0.42, 1.6, 0, 0.8, 0.4);
      if (Kit.pieces.Mug) kp(m, 'Mug', 0.3, 1.6, 0.3, 0.9, 1);
      if (H > 2.9) at(m, 0.68, Math.min(H - 0.55, 2.85) - 0.02, 0, PI / 2, () => antlers(m));
      at(m, dep + 0.8, 0, 0, 0, () => Props.rug(m, 1.2, wid + 0.6, o.rug || [0.5, 0.32, 0.2]));
      at(m, 0.4, 0, wid / 2 + 0.55, 0, () => Props.woodpile(m, 4, 4, 0.5));
    });
  }
  const fp = s.rect;
  P.occ(room.k, fp, 'hearth', P.id + '.hearth', { h: H, back: side, room: room.id, wid });
  P.clear.push(Object.assign(side === 'n' ? { x0: fp.x0, x1: fp.x1, z0: fp.z1, z1: fp.z1 + 1.0 } : side === 's' ? { x0: fp.x0, x1: fp.x1, z0: fp.z0 - 1.0, z1: fp.z0 } : side === 'w' ? { x0: fp.x1, x1: fp.x1 + 1.0, z0: fp.z0, z1: fp.z1 } : { x0: fp.x0 - 1.0, x1: fp.x0, z0: fp.z0, z1: fp.z1 }, { k: room.k, kind: 'hearth' }));
  P.lightIn[room.id] = 1; P.hearths = (P.hearths || []).concat([{ k: room.k, x: px, z: pz, side, wid, rect: fp }]);
  return { px, pz, side, fp, wid, front: hor ? [px, pz + (side === 'n' ? 1 : -1) * (dep + 0.6)] : [px + (side === 'w' ? 1 : -1) * (dep + 0.6), pz] };
}
// the same stack on another level: a stone pier from floor to ceiling over (or under) the hearth
function pPier(P, k, hearth) {
  const L = P.lv[k]; if (!L) return; const h = hearth, fp = h.fp, m = P.c.int, room = pRoomAt(P, k, (fp.x0 + fp.x1) / 2, (fp.z0 + fp.z1) / 2); if (!room) return;
  m.m1 = P.zone; m.ao = INT_AO; m.mat(MAT.STONE, [0.9, 0.88, 0.85], 0.8); at(m, 0, L.y + 0.02, 0, 0, () => { m.box(fp.x0 + 0.1, 0, fp.z0 + 0.1, fp.x1 - 0.1, L.H - 0.02, fp.z1 - 0.1); addBoxCollider(m, fp.x0 + 0.1, fp.z0 + 0.1, fp.x1 - 0.1, fp.z1 - 0.1, 0, L.H); });
  pOcc(P, k, fp, 'hearth', P.id + '.stack' + k, { h: L.H, back: h.side, room: room.id });
}
// a wall candle bracket by a door or over a bed; lit like any candle
function pSconce(P, room, side, u, y) {
  const rec = pHang(P, room, side, u, 0.3, y || 1.55, (y || 1.55) + 0.3, (m, hh) => { m.mat(MAT.METAL, COL.black); m.box(-0.04, 0, 0.0, 0.04, 0.03, 0.2); m.box(-0.012, -0.12, 0.0, 0.012, 0.03, 0.02); at(m, 0, 0.03, 0.17, 0, () => Props.candle(m, P.c, true)); }, P.id + '.sconce', {}); if (rec) P.lightIn[room.id] = 1; return rec;
}
// a lantern hung from the ceiling beam
function pLamp(P, room, x, z) {
  const L = P.lv[room.k], m = P.c.int; if (!pFit(P, room, rectOf(x, z, 0.4, 0.4), { h: 0.1, lowOk: true, noClear: true, lift: 0 })) { }
  at(m, x, L.y + L.H - 0.1, z, 0, () => { m.mat(MAT.METAL, COL.black); m.box(-0.01, 0, -0.01, 0.01, 0.2, 0.01); at(m, 0, -0.02, 0, 0, () => Props.lantern(m, P.c)); });
  P.lightIn[room.id] = 1; P.lamps = (P.lamps || 0) + 1;
}
// a seat at a table: spot + a visible seat. kinds: 'stool', 'chair', 'bench' handled by the caller; this registers the sitting spot only
const pSit = (P, name, x, z, yaw, k) => pSpot(P, name, x, z, yaw, { k, y: 0.02, extra: { sit: 0.46 } });
const pBedSpot = (P, name, x, z, rot, k) => pSpot(P, name, x, z, -rot, { k, y: 0.58, extra: { lie: true } });

// a torch on a wall (cellars, crypts, dungeons): iron bracket, a flame and a flickering light
function pTorch(P, room, side, u, y, r) {
  const rec = pHang(P, room, side, u, 0.3, y || 1.7, (y || 1.7) + 0.5, (m, hh) => {
    m.mat(MAT.METAL, COL.black); m.box(-0.03, 0, 0.0, 0.03, 0.04, 0.22); m.box(-0.02, -0.02, 0.18, 0.02, 0.32, 0.22);
    m.mat(MAT.TIMBER, COL.woodDark); m.cyl(0, 0.0, 0.26, 0.04, 0.05, 0.4, 6, 2);
    emit(m, 1.4, () => { m.mat(MAT.PLAIN, [1, 0.45, 0.1]); m.cyl(0, 0.4, 0.26, 0.05, 0.015, 0.2, 6, 2); });
    World.emitters.push({ type: 'fire', p: wp(m, 0, 0.52, 0.26), size: 0.28, zone: P.zone });
    addLight(wp(m, 0, 0.55, 0.42), r || 7, [3.0, 1.55, 0.55], P.zone, 'fire');
  }, P.id + '.torch', {}); if (rec) P.lightIn[room.id] = 1; return rec;
}
// the walls of a room as sides, longest first
const pSidesLong = room => (room.x1 - room.x0 >= room.z1 - room.z0 ? ['n', 's', 'w', 'e'] : ['w', 'e', 'n', 's']);
const R0 = (a, b) => a;

// candidate centres in a room, nearest to a point first
function pCands(room, near, step) {
  const a = room.in, c0 = near || [(a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2], pts = []; step = step || 0.25;
  for (let x = a.x0 + 0.3; x <= a.x1 - 0.3 + 1e-6; x += step) for (let z = a.z0 + 0.3; z <= a.z1 - 0.3 + 1e-6; z += step) pts.push([x, z]);
  return pts.sort((p, q) => Math.hypot(p[0] - c0[0], p[1] - c0[1]) - Math.hypot(q[0] - c0[0], q[1] - c0[1]));
}
// a dining table with a bench on each long side: returns { x, z, seats: [[x, z, yaw]] } or null
function pDining(P, room, len, wid, opt) {
  opt = opt || {}; const c = P.c, items = opt.items || ['mug', 'plate', 'bowl', 'candle', 'loaf'], pts = pCands(room, opt.near);
  for (const rot of opt.rots || [0, PI / 2]) {
    const tw = rot ? wid : len, td = rot ? len : wid;
    for (const p of pts) {
      const [tx, tz] = p, tr = rectOf(tx, tz, tw, td);
      if (!pFit(P, room, tr, { h: 0.78 })) continue;
      const bs = [-1, 1].map(sg => rot ? [tx + sg * (wid / 2 + 0.34), tz] : [tx, tz + sg * (wid / 2 + 0.34)]);
      const brs = bs.map(b => rot ? rectOf(b[0], b[1], 0.34, len * 0.9) : rectOf(b[0], b[1], len * 0.9, 0.34));
      if (!brs.every(r => pFit(P, room, r, { h: 0.46 })) || (opt.sideRoom && !brs.every(r => true))) continue;
      const t = pPut(P, room, P.id + '.' + (opt.id || 'table'), tx, tz, 0, tw, td, 0.78, m => { m.push(); if (rot) m.RY(rot); pdTable(len, wid, items, opt.n || 3, c)(m); m.pop(); }, { surface: true });
      if (!t) continue;
      const seats = [];
      bs.forEach((b, i) => { const sg = i ? 1 : -1; pPut(P, room, P.id + '.' + (opt.id || 'table') + 'bench' + i, b[0], b[1], rot ? PI / 2 : 0, len * 0.9, 0.34, 0.46, pdBench(len * 0.9), {}); for (const q of [-0.5, 0.5]) seats.push([rot ? b[0] : tx + q * len * 0.5, rot ? tz + q * len * 0.5 : b[1], rot ? (sg < 0 ? PI / 2 : -PI / 2) : (sg < 0 ? PI : 0)]); });
      return { x: tx, z: tz, rot, seats, t };
    }
  }
  return null;
}

// ───────── dressing by room kind ─────────
// every dresser fills one room: a focal point first (hearth, bed, bar, counter ...), then what belongs with it, then the wall things; clutter thins away from the focus
function dressHall(P, room, o) {
  o = o || {}; const c = P.c, R = P.R, k = room.k;
  const side = o.hearth || 's', hh = o.hh !== undefined ? o.hh : pHearth(P, room, side, o.hw || 1.7, { cauldron: true, at: o.hearthAt });
  P.hall = { room, hh };
  const near = hh ? hh.front.slice() : pCentre(room); near[0] += o.dx || 0; near[1] += o.dz === undefined ? (side === 's' ? -1.8 : 0) : o.dz;
  const dn = pDining(P, room, o.len || 2.0, 0.9, { near, items: o.items, n: 4 });
  if (dn) {
    dn.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], k));
    pPut(P, room, P.id + '.rug', dn.x, dn.z, 0, dn.rot ? 1.6 : 2.2, dn.rot ? 2.2 : 1.6, 0.02, pdRug(dn.rot ? 1.6 : 2.2, dn.rot ? 2.2 : 1.6, o.rug || COL.red), { flat: true, noClear: true });
    pLamp(P, room, dn.x, dn.z);
  }
  if (hh) pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k });
  // storage and a shelf with its wares along the walls that are free
  for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.shelf', 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, stockFill(c, o.shelfItems || ['pot', 'jug', 'bowl', 'cheese', 'bottle'])), { at: o.shelfAt })) break;
  for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.cupboard', 0.9, 0.5, 0.75, +1, pdChest, { lowOk: true })) break;
  const e = P.doors.find(d => d.b === null && d.a === room.id);
  if (e) { const side2 = e.wall.ax === 'x' ? (e.wall.c <= room.z0 + 0.01 ? 'n' : 's') : (e.wall.c <= room.x0 + 0.01 ? 'w' : 'e'); pSconce(P, room, side2, e.wall.ax === 'x' ? e.x + 1.3 : e.z + 1.3) || pSconce(P, room, side2, e.wall.ax === 'x' ? e.x - 1.3 : e.z - 1.3); }
  for (const sd of ['w', 'e', 'n', 's']) if (pBarrelCorner(P, room, sd)) break;
  pKitFloor(P, room, 'w', 'Cabinet', { at: 'end' }) || pKitFloor(P, room, 'n', 'Cabinet', { at: 'end' });
  pWalls(P, room, o.walls || ['Torch_Metal', 'paint', 'Banner_1_Cloth', 'rack', 'paint', 'Peg_Rack']);
}
function pBarrelCorner(P, room, sd) { return pAgainst(P, room, sd, P.id + '.barrel', 0.66, 0.66, 0.9, 0, pdBarrel(0.33, 0.9), { at: 'end' }); }
function dressBedroom(P, room, o) {
  o = o || {}; const k = room.k, R = P.R, beds = o.beds || ['bed'], col = o.blanket || R.pick([COL.red, COL.blue, COL.green, [0.5, 0.42, 0.3], COL.purple]);
  let placed = 0;
  for (const nm of beds) {
    let it = null;
    for (const sd of o.bedSides || ['e', 'w', 'n', 's']) { const s = pWallSlot(P, room, sd, 1.1, 2.1, { h: 0.95, at: o.bedAt }); if (!s) continue; it = pPut(P, room, P.id + '.' + nm, s.cx, s.cz, rotBack(sd, -1), 1.1, 2.1, 0.95, pdBed(1.0, col, !!o.fur), { back: sd }); if (it) { pBedSpot(P, nm, s.cx, s.cz, rotBack(sd, -1), k); if (o.bedInteract && nm === beds[0]) pInteract(P, s.cx, 0.55, s.cz, { kind: 'bed', id: P.id + '.bed', r: 1.9 }, k); placed++; if (nm === beds[0]) P.firstBed = { room, sd, cx: s.cx, cz: s.cz, nm }; break; } }
    if (!it && nm === 'bed') P.err.push('no room for ' + nm + ' in ' + room.id);
  }
  // a chest at the foot of the first bed (or against any free wall)
  let ch = null;
  if (P.firstBed && P.firstBed.room === room) { const b = P.firstBed, foot = { e: [b.cx - 1.4, b.cz], w: [b.cx + 1.4, b.cz], n: [b.cx, b.cz + 1.5], s: [b.cx, b.cz - 1.5] }[b.sd]; const rot = { e: PI / 2, w: -PI / 2, n: 0, s: PI }[b.sd]; ch = pPut(P, room, P.id + '.' + (o.chestId || 'chest'), foot[0], foot[1], rot, 0.85, 0.5, 0.58, pdChest, { lowOk: true }); }
  if (!ch) for (const sd of pSidesLong(room)) if ((ch = pAgainst(P, room, sd, P.id + '.' + (o.chestId || 'chest'), 0.85, 0.5, 0.58, +1, pdChest, { lowOk: true }))) break;
  if (ch && o.chest !== false) pInteract(P, ch.cx, 0.5, ch.cz, { kind: 'chest', id: P.id + '.' + (o.chestId || 'chest'), loot: o.loot || LOOT[P.id] || [['gold', 4 + R.i(0, 6)]], r: 1.8 }, k);
  for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.wardrobe', 1.2, 0.5, 1.8, +1, pdShelf(1.2, 1.8, 2, null), { })) break;
  if (P.firstBed && P.firstBed.room === room) { const b = P.firstBed; pSconce(P, room, b.sd, (b.sd === 'e' || b.sd === 'w') ? b.cz + 1.4 : b.cx + 1.4, 1.5) || pSconce(P, room, b.sd, (b.sd === 'e' || b.sd === 'w') ? b.cz - 1.4 : b.cx - 1.4, 1.5); }
  { const bb = P.firstBed && P.firstBed.room === room ? P.firstBed : null; if (bb) { const rc = { e: [bb.cx - 1.5, bb.cz], w: [bb.cx + 1.5, bb.cz], n: [bb.cx, bb.cz + 1.6], s: [bb.cx, bb.cz - 1.6] }[bb.sd]; pPut(P, room, P.id + '.' + room.id + 'rug', rc[0], rc[1], 0, 1.8, 1.2, 0.02, pdRug(1.8, 1.2, [0.42, 0.26, 0.2]), { flat: true, noClear: true }); } pWalls(P, room, ['paint', 'Banner_1_Cloth', 'rack']); }
  if (o.table) { const bb = P.firstBed && P.firstBed.room === room ? P.firstBed : null; pFree(P, room, P.id + '.' + room.id + 'table', 0.8, 0.5, 0.75, 0, pdTable(0.8, 0.5, ['candle', 'mug', 'book'], 2, P.c), { near: bb ? [bb.cx, bb.cz] : pCentre(room), surface: true }); }
  pLamp(P, room, ...pCentre(room));
}
function dressStore(P, room, o) {
  o = o || {}; const R = P.R;
  let n = 0; for (const sd of pSidesLong(room)) { if (pAgainst(P, room, sd, P.id + '.shelf' + n, 1.8, 0.34, 1.8, +1, pdShelf(1.8, 1.8, 3, stockFill(P.c, o.items || ['pot', 'jug', 'bowl', 'bottle', 'cheese'])), { at: n ? 'end' : 'start' })) n++; if (n >= 2) break; }
  for (let i = 0; i < 3; i++) for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.barrel' + i, 0.66, 0.66, 0.9, 0, pdBarrel(0.33, 0.9), { at: i ? 'end' : 'start' })) break;
  for (let i = 0; i < 3; i++) pFree(P, room, P.id + '.crate' + i, 0.6, 0.6, 0.6, R() * 0.4, pdCrate(0.6), { near: [room.in.x1 - 1, room.in.z1 - 1] });
  for (let i = 0; i < 2; i++) pFree(P, room, P.id + '.sack' + i, 0.5, 0.5, 0.5, R() * 6, pdSack(0.3), { near: [room.in.x0 + 1, room.in.z1 - 1], noClear: false });
  pWalls(P, room, ['Shelf_Small_Bottles', 'Peg_Rack', 'Torch_Metal', 'Shelf_Simple']);
  pLamp(P, room, ...pCentre(room));
}
function dressKitchen(P, room, o) {
  o = o || {}; const c = P.c, R = P.R;
  const hh = o.hh !== undefined ? o.hh : o.hearth ? pHearth(P, room, o.hearth, 1.5, { cauldron: true, size: 0.4 }) : null;
  const w = pFree(P, room, P.id + '.worktable', 1.6, 0.8, 0.9, 0, pdTable(1.6, 0.8, ['bowl', 'loaf', 'jug', 'plate', 'cheese'], 4, c), { near: pCentre(room), surface: true });
  if (w) pSpot(P, 'work', w.cx, w.cz + 0.7, PI, { k: room.k });
  for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.shelf', 1.6, 0.34, 1.8, +1, pdShelf(1.6, 1.8, 3, stockFill(c, ['pot', 'bowl', 'jug', 'cheese', 'loaf'])), {})) break;
  for (let i = 0; i < 2; i++) for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.barrel' + i, 0.66, 0.66, 0.9, 0, pdBarrel(0.33, 0.9), { at: i ? 'end' : 'start' })) break;
  pKitFloor(P, room, 's', 'Cabinet', { at: 'start' }) || pKitFloor(P, room, 'n', 'Cabinet', { at: 'start' });
  pWalls(P, room, ['Peg_Rack', 'Shelf_Simple', 'Torch_Metal', 'rack', 'Shelf_Small_Bottles', 'Peg_Rack']);
  pLamp(P, room, ...pCentre(room));
}
function dressCellar(P, room, o) {
  o = o || {}; const R = P.R; let n = 0;
  if (o.rows) { for (const sd of ['w', 'e']) { const lo = room.in.z0 + 1.2; for (let i = 0; i < o.barrels; i++) pAgainst(P, room, sd, P.id + '.cask' + n++, 0.9, 0.9, 1.0, 0, PD.cask(0.9, 0.34), { at: lo + i * 1.05, lowOk: true }); } }
  else for (const sd of pSidesLong(room)) for (let i = 0; i < (o.barrels || 2); i++) if (pAgainst(P, room, sd, P.id + '.cbarrel' + n++, 0.9, 0.9, 1.0, 0, PD.cask(0.9, 0.32), { at: i ? 'end' : 'start', lowOk: true })) { }
  for (const sd of pSidesLong(room)) if (pAgainst(P, room, sd, P.id + '.cshelf', 1.8, 0.34, 1.8, +1, pdShelf(1.8, 1.8, 3, stockFill(P.c, ['jug', 'bottle', 'pot', 'bowl'])), { at: 'mid' })) break;
  for (let i = 0; i < (o.crates === undefined ? 3 : o.crates); i++) pFree(P, room, P.id + '.ccrate' + i, 0.6, 0.6, 0.6, R() * 0.5, pdCrate(0.6), { near: [room.in.x0 + 1, room.in.z1 - 1] });
  for (let i = 0; i < 3; i++) pFree(P, room, P.id + '.csack' + i, 0.5, 0.5, 0.5, R() * 6, pdSack(0.3), { near: [room.in.x1 - 1, room.in.z0 + 1] });
  let t = 0; for (const sd of ['n', 's', 'w', 'e']) { const s = (room.x1 - room.x0 > 3 ? 0.25 : 0.5); if (pTorch(P, room, sd, (sd === 'n' || sd === 's' ? (room.in.x0 + room.in.x1) / 2 : (room.in.z0 + room.in.z1) / 2) + (t++ % 2 ? 1.2 : -1.2), 1.7, 6.5)) break; }
  if (!P.lightIn[room.id]) pTorch(P, room, 'n', (room.in.x0 + room.in.x1) / 2, 1.7, 6.5) || pTorch(P, room, 's', (room.in.x0 + room.in.x1) / 2, 1.7, 6.5);
}
function dressLanding(P, room) { pLamp(P, room, ...pCentre(room)); for (const sd of ['n', 's', 'w', 'e']) if (pSconce(P, room, sd, sd === 'n' || sd === 's' ? (room.in.x0 + room.in.x1) / 2 : (room.in.z0 + room.in.z1) / 2)) break; }

// ───────── the generic house ─────────
// Canonical frame: the street door in the middle of the z = 0 wall, the house going away in +z. 0.4 m walls on a 0.5 m grid.
//   ground: a hall (hearth on its back wall, stair down to the cellar along the west wall, stair up along the east wall) with a store (west) and a bedroom (east) behind it
//   up:     a loft over the east half (the stairwell, a bed) and two chambers over the west half, round the chimney stack
//   below:  a cellar under the hall and a second vault under the store, joined by a door; the stair arrives in the hall
// kit pieces on the walls and floor, placed by the plan's rules. KIT_ITEM: [w, d, tall, scale, lit]; KIT_WALL: [w, pivot height, stand-off, scale]
function pKitFloor(P, room, side, name, o) {
  const it = KIT_ITEM[name]; if (!it || !Kit.pieces[name]) return null;
  const sc = it[3], w = it[0] * sc, d = it[1] * sc, h = it[2] ? 2.0 : 0.8;
  const draw = it[4] ? m => kitLit(m, name, 0, 0, 0, sc, 0, { r: 6.5, c: [2.3, 1.4, 0.6], kind: 'candle' }) : m => kp(m, name, 0, 0, 0, sc, 0);
  const r = pAgainst(P, room, side, P.id + '.' + name + (o && o.n || ''), w, d, h, -1, draw, Object.assign({ lowOk: !it[2] }, o || {}));
  if (r && it[4]) P.lightIn[room.id] = 1; return r;
}
function pKitWall(P, room, side, u, name, o) {
  const it = KIT_WALL[name]; if (!it || !Kit.pieces[name]) return null;
  const y = Math.min(it[1], P.lv[room.k].H - 0.3), ban = name.startsWith('Banner'), lit = name === 'Torch_Metal';
  const rec = pHang(P, room, side, u, it[0], ban ? Math.max(1.0, y - 1.6) : y - 0.45, y + 0.35, m => {
    if (lit) kitLit(m, name, 0, 0, -it[2], 1, PI, { r: 6.2, c: [2.5, 1.45, 0.55], kind: 'fire', flame: 'torch', size: 0.14 }); else kp(m, name, 0, 0, -it[2], it[3] || 1, PI);
  }, P.id + '.' + name, Object.assign({ pivot: y }, o || {}));
  if (rec && lit) P.lightIn[room.id] = 1; return rec;
}
function pArt(P, room, side, u, kind) {
  const R = P.R, nm = kitGen(kind, R), rack = kind === 'rack';
  return pHang(P, room, side, u, rack ? 1.0 : 0.8, rack ? 1.85 : 1.45, rack ? 2.25 : 2.1, m => kp(m, nm, 0, 0, -0.03, 1, PI), P.id + '.' + kind, { pivot: rack ? 2.05 : 1.6 });
}
// decorate the free stretches of the walls of a room: banners, shields, torches, paintings, racks. u positions are tried along each side.
function pWalls(P, room, list, o) {
  o = o || {}; const a = room.in, R = P.R; let q = 0;
  for (const sd of pSidesLong(room)) {
    const hor = sd === 'n' || sd === 's', lo = hor ? a.x0 : a.z0, hi = hor ? a.x1 : a.z1;
    for (let u = lo + 0.9 + R() * 0.5; u < hi - 0.7 && q < list.length; u += 0.5) {
      const nm = list[q], ok = nm === 'paint' || nm === 'rack' ? pArt(P, room, sd, u, nm) : pKitWall(P, room, sd, u, nm);
      if (ok) { q++; u += (KIT_WALL[nm] ? KIT_WALL[nm][0] : 0.8) + 0.9 + R() * 0.8; }
    }
  }
  return q;
}
const stepTo = (v, a, b) => clamp(Math.round(v), a, b);
const H_GROUND = 2.7, H_UP = 2.4, H_CELLAR = 3.0;
function planHouse(P, c, info) {
  info = info || {};
  const st = c.spec.kitStyle || {}, up = info.up !== undefined ? info.up : !!st.up, need = P.need;
  const W = info.W || stepTo(c.w * 1.35, 8, 11), D = info.D || stepTo(c.d * 1.6, 10, 12), Dh = info.Dh || 7, H0 = info.H0 || H_GROUND, x0 = -W / 2, x1 = W / 2;
  P.dims = { W, D, Dh };
  pLevel(P, -1, -(H_CELLAR + PW.SLAB), H_CELLAR); pLevel(P, 0, 0, H0); if (up) pLevel(P, 1, H0 + PW.SLAB, H_UP);
  const hall = pRoom(P, 0, 'hall', info.inn ? 'common' : 'hall', x0, 0, x1, Dh), store = pRoom(P, 0, 'store', info.inn ? 'kitchen' : 'store', x0, Dh, 0, D), bed0 = pRoom(P, 0, 'bedroom', info.inn ? 'keeper' : 'bedroom', 0, Dh, x1, D);
  pDoor(P, 'hall', null, 0, 0);
  pDoor(P, 'hall', 'store', x0 / 2, Dh); pDoor(P, 'hall', 'bedroom', x1 / 2, Dh);
  // cellar: under the hall (the stair arrives here) and under the store
  const cel = pRoom(P, -1, 'cellar', 'cellar', x0, 0, x1, Dh, { floor: 'stone', win: false }), vault = pRoom(P, -1, 'vault', 'cellar', x0, Dh, 0, D, { floor: 'stone', win: false });
  pDoor(P, 'cellar', 'vault', x0 / 2, Dh);
  // the stairs: cellar -> hall along the west wall (toward +z), hall -> loft along the east wall (toward +z)
  const tr = 0.22;
  const fl = !!info.flank;
  pStair(P, fl ? { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: 1.4, z: 1.0, width: 1.0, tread: tr } : { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: 1, x: x0 + 0.95, z: 1.3, width: 1.0, tread: tr });
  if (up) {
    pStair(P, fl ? { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: -1, x: -1.4, z: 1.0, width: 1.0, tread: tr } : { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: x1 - 0.95, z: 1.3, width: 1.0, tread: tr });
    if (fl) { pRoom(P, 1, 'loft', 'gallery', x0, 0, 0, D); pRoom(P, 1, 'chamber1', 'bedroom', 0, 0, x1, Dh); pRoom(P, 1, 'chamber2', 'bedroom', 0, Dh, x1, D); pDoor(P, 'loft', 'chamber1', 0, 3.5); pDoor(P, 'loft', 'chamber2', 0, Dh + 1.5); }
    else { pRoom(P, 1, 'loft', 'bedroom', 0, 0, x1, D); pRoom(P, 1, 'chamber1', 'bedroom', x0, 0, 0, Dh); pRoom(P, 1, 'chamber2', 'bedroom', x0, Dh, 0, D); pDoor(P, 'loft', 'chamber1', 0, 2.5); pDoor(P, 'loft', 'chamber2', 0, Dh + 1.5); }
  }
  pLayout(P);
  // ground floor
  const hall0 = hall, hh = pHearth(P, hall, 's', info.inn ? 2.4 : 1.7, { cauldron: true, at: 0 });
  P.hall = { room: hall, hh };
  if (need.has('counter')) {
    const t = pFree(P, hall, P.id + '.counter', 2.0, 0.7, 1.0, 0, m => { Props.table(m, 2.0, 0.7); Props.clutter(m, c.R, -0.8, 0.8, 0.76, 0, ['jug', 'bowl', 'cheese', 'loaf'], 3, c); }, { near: [x0 / 2 + 0.2, 2.2], surface: true });
    if (t) pSpot(P, 'counter', t.cx, t.cz + 0.75, PI, { k: 0 });
  }
  if (hh) { pPier(P, -1, hh); if (up) pPier(P, 1, hh); }
  let kh = null;
  if (info.inn) { kh = pHearth(P, store, 'w', 1.6, { cauldron: true, size: 0.4, at: 'mid' }); if (kh) { pPier(P, -1, kh); if (up) pPier(P, 1, kh); } dressInn(P, c, hall, hh); dressKitchen(P, store, { hh: kh }); PD.rack(P, store, -3.5, 10.4, 2.4, 0, ['pot', 'herb', 'ham', 'herb', 'garlic']); } else if (KIT_DRESS[P.id] && info.kind) { dressKind(P, c, hall, hh, info); dressStore(P, store); } else { dressHall(P, hall, { hh }); dressStore(P, store); } dressBedroom(P, bed0, { beds: need.has('bed2') && !up ? ['bed', 'bed2'] : ['bed'], loot: LOOT[P.id], bedSides: info.inn ? ['s', 'e', 'w', 'n'] : undefined, bedAt: info.inn ? 'mid' : undefined });
  dressCellar(P, cel, { barrels: info.inn ? 5 : 1, crates: 2, rows: !!info.inn }); dressCellar(P, vault, { barrels: info.inn ? 6 : 3, rows: !!info.inn });
  if (up) {
    if (info.inn) { dressBedroom(P, P.rooms.chamber1, { beds: ['bed2'], chestId: 'chest2', chest: false, table: true, bedInteract: true }); dressBedroom(P, P.rooms.chamber2, { beds: ['bed3', 'bed4'], chestId: 'chest3', chest: false, table: true }); dressLanding(P, P.rooms.loft); PD.gallery(P, P.rooms.loft); pWalls(P, P.rooms.loft, ['Banner_1_Cloth', 'paint', 'Torch_Metal', 'paint', 'rack'], {}); }
    else { dressBedroom(P, P.rooms.chamber1, { beds: ['bed2'], chestId: 'chest2', chest: false }); dressBedroom(P, P.rooms.chamber2, { beds: [], chest: false }); dressBedroom(P, P.rooms.loft, { beds: ['bed3'], chestId: 'chest3', chest: false }); }
  }
  if (info.inn) {     /* the density pass (D): every wall run, corner and open floor of the inn carries something */
    const rm = P.rooms, dn = (id, o) => rm[id] && PD.dense(P, rm[id], o);
    dn('hall', { pool: ['tapestry', 'hooks', 'cabinet', 'paint', 'shelf', 'cask', 'paint', 'sconce'], corner: ['broom', 'cask', 'stack', 'sacks'], mid: { kinds: ['rug', 'casks'], max: 2 }, racks: 2, rackKinds: ['mug', 'herb', 'pot', 'herb'] });
    dn('store', { pool: ['shelf', 'cupboard', 'hooks', 'cask', 'sacks', 'stack', 'cabinet'], corner: ['broom', 'sacks', 'stack'], mid: { kinds: ['table', 'sacks'], max: 1 }, racks: 1 });
    dn('bed0', { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
    for (const id of ['chamber1', 'chamber2']) dn(id, { pool: ['cupboard', 'hooks', 'paint', 'tapestry', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
    dn('loft', { pool: ['tapestry', 'hooks', 'cabinet', 'paint', 'shelf', 'cupboard'], corner: ['broom', 'cask', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
    for (const id of ['cellar', 'vault']) dn(id, { pool: ['cask', 'shelf', 'sacks', 'stack', 'cask', 'cabinet', 'torch'], corner: ['cask', 'sacks', 'stack', 'broom'], mid: { kinds: ['casks', 'sacks'], max: 2 }, racks: 1, rackKinds: ['ham', 'herb', 'garlic', 'ham'] });
  }
  if (!hh) P.err.push('no hearth fits in the hall');
  for (const id of ['cellar', 'vault']) if (!P.lightIn[id]) pTorch(P, P.rooms[id], 'n', (P.rooms[id].in.x0 + P.rooms[id].in.x1) / 2 + 0.5, 1.7, 6.5) || pTorch(P, P.rooms[id], 's', (P.rooms[id].in.x0 + P.rooms[id].in.x1) / 2 + 0.5, 1.7, 6.5);
}

// Until every building has a designed plan, only those listed here use the plan engine in the published game: the generic plan gives every house the same hall
// (a shop without its counter, a smithy without its forge). ?plans=all or --opt plans=all builds every house from a plan (work in progress).
const PLAN_SHIP = { inn: 1, chapel: 1 };          // designed and dressed plans only (test/parity.mjs checks nothing the old interior offered is lost)
const PLAN_ALL = (TEST && TEST.plans === 'all') || (typeof location !== 'undefined' && /[?&]plans=all\b/.test(location.search));
function planWanted(site, spec) { return PLAN_ON && !(TEST && TEST.plans === 0) && !!site && (!TEST || TEST.cells !== 0) && (PLAN_ALL || !!PLAN_SHIP[site.id]); }

function planBuild(c) {
  const dd = c.doors[0], site = c.site, m = c.int;
  const inw = [dd.ins[0] - dd.sill[0], 0, dd.ins[2] - dd.sill[2]], il = Math.hypot(inw[0], inw[2]) || 1; inw[0] /= il; inw[2] /= il;
  const T = m4.create(); m4.basis(T, [inw[2], 0, -inw[0]], [0, 1, 0], inw, [dd.sill[0], dd.sill[1], dd.sill[2]]);
  m.m = T.slice(); m.dirty = true;
  const P = planNew(c, T); P.yaw = Math.atan2(-inw[0], inw[2]); P.need = planNeeds(P.id); P.R = c.R; c.plan = P;
  const info = PLANS_INFO[P.id] || {};
  (PLANS[P.id] || planHouse)(P, c, info);
  pBuild(P);
  // the zone: round the whole plan, so room AO, sound and light find it
  const W = P.dims ? P.dims.W : 9, D = P.dims ? P.dims.D : 10, zi = c.zoneInfo, ctr = P.w2(0, 0, D / 2);
  zi.site = Object.assign({}, c.site, { x: ctr[0], z: ctr[2], yaw: P.yaw }); zi.hw = W / 2; zi.hd = D / 2; zi.y0 = dd.sill[1] - 3.6; zi.y1 = dd.sill[1] + 7; zi.slope = 0; zi.H = H_GROUND;
  if (P.hearths && P.hearths[0]) { const h = P.hearths[0], hp = P.w2(h.x, 0, h.z); zi.hearth = [hp[0], hp[2], h.wid]; }
  // every spot a schedule wants: when the plan has no such place, the nearest thing it has
  const home = P.spots.home || P.spots.sit || Object.values(P.spots)[0];
  for (const n of new Set([...P.need, 'fire1', 'stand2', 'guestbed', 'barfront', 'front', 'pew1', 'pew2', 'sit', 'bed2', 'home'])) if (!P.spots[n] && home) pSpot(P, n, home.x, home.z, home.yaw, { k: home.k });
  // what the old interior offered to read or buy: a book or note on the nearest table, the rope on the counter
  { const tab = P.items.find(i => i.k === 0 && i.kind === 'floor' && i.top > 0 && /table|counter|bar$|lectern/i.test(i.id)) || P.items.find(i => i.k === 0 && i.kind === 'floor' && i.top > 0), pos = tab ? [tab.cx, tab.top + 0.05, tab.cz] : [home ? home.x : 0, 1.0, home ? home.z : 1];
    for (const id in READS) if (id.startsWith(P.id + '.') && !World.interact.some(i => i.id === id)) pInteract(P, pos[0], pos[1] + 0.2, pos[2], Object.assign({ kind: 'read', id, r: 1.8 }, READS[id]), 0);
    if (P.id === 'store' && !World.interact.some(i => i.id === 'rope')) pInteract(P, pos[0], pos[1] + 0.2, pos[2], { kind: 'shopitem', id: 'rope', r: 1.6 }, 0); }
  { const fy = dd.sill[1]; c.cell.daylightFn = () => Player.pos[1] < fy - 1.0 ? 0 : undefined; }          // below the ground floor no daylight comes in
  c.planDone = P; return P;
}
const PLANS_INFO = { store: { kind: 'shop' }, smithy: { kind: 'smith' }, elder: { kind: 'study' }, guardhouse: { kind: 'guard' },  inn: { inn: true, W: 14, D: 13, Dh: 8, H0: 3.2, up: true, flank: true } };
// the common room: a bar with stocked shelves and kegs behind it, long tables with benches and laid places, a rug by the hearth, banners, shields, sconces, lanterns
function dressInn(P, c, room, hh) {
  const R = P.R, a = room.in; P.hall = { room, hh };
  const bar = pPut(P, room, P.id + '.bar', a.x1 - 1.7, 4.8, PI / 2, 3.8, 0.7, 1.05, m => { Props.table(m, 3.8, 0.7, 1.05); Props.clutter(m, R, -1.7, 1.7, 1.05, 0, ['mug', 'mug', 'bottle', 'jug', 'plate', 'mug'], 7, c); }, { surface: true });
  if (bar) { pSpot(P, 'bar', bar.cx + 0.95, bar.cz, -PI / 2, { k: 0 }); pSpot(P, 'stand1', bar.cx - 0.8, bar.cz - 0.9, PI / 2, { k: 0 }); P.bar = bar;
    pHang(P, room, 'e', bar.cz, 3.0, 1.45, 2.7, (m) => Props.shelf(m, 3.0, 1.2, 3, 0.3, (i, y) => Props.clutter(m, R, -1.3, 1.3, y, 0, ['bottle', 'bottle', 'mug', 'jug', 'bottle'], 6, c)), P.id + '.backshelf', {});
    for (let i = 0; i < 3; i++) pAgainst(P, room, 'e', P.id + '.keg' + i, 0.9, 0.9, 1.0, 0, PD.cask(0.9, 0.32), { at: bar.cz - 1.4 + i * 1.4, lowOk: true });
    pLamp(P, room, bar.cx + 0.2, bar.cz); }
  let n = 0;
  for (const nr of [[-4.2, 5.0], [-0.5, 5.6], [-4.4, 2.8]]) {
    const dn = pDining(P, room, 2.4, 0.9, { near: nr, id: 'table' + n, n: 4, items: ['mug', 'plate', 'bowl', 'candle', 'loaf', 'mug'] });
    if (dn) { for (const s of dn.seats) pSit(P, 's' + (++n), s[0], s[1], s[2], 0); pLamp(P, room, dn.x, dn.z); n = Math.max(n, 0); }
  }
  if (hh) {
    pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
    const st = pPut(P, room, P.id + '.firestool', hh.front[0] + 1.6, hh.front[1] - 0.2, 0, 0.4, 0.4, 0.46, pdStool, {});
    if (st) pSit(P, 'fire2', st.cx, st.cz, Math.atan2(hh.px - st.cx, -(hh.pz - st.cz)), 0);
    pSpot(P, 'bard', hh.front[0] - 1.7, hh.front[1] - 0.3, Math.atan2(hh.px - hh.front[0] + 1.7, -(hh.pz - hh.front[1])), { k: 0 });
  }
  const e = P.doors.find(d => d.b === null);
  if (e) pPut(P, room, P.id + '.mat', e.x, 2.7, 0, 2.6, 1.6, 0.02, pdRug(2.6, 1.6, [0.35, 0.34, 0.22]), { flat: true, noClear: true });
  for (const nm of ['Cabinet', 'Barrel_Holder']) for (const sd of ['w', 's', 'n']) if (pKitFloor(P, room, sd, nm, { at: nm === 'Cabinet' ? 'end' : 'start' })) break;
  pKitFloor(P, room, 'w', 'CandleStick_Stand', { n: 'a', at: 'mid' }); pKitFloor(P, room, 's', 'CandleStick_Stand', { n: 'b', at: 'start' });
  pWalls(P, room, ['Torch_Metal', 'Banner_1_Cloth', 'Shield_Wooden', 'Banner_1_Cloth', 'Torch_Metal', 'paint', 'Shield_Wooden', 'rack', 'paint', 'Torch_Metal', 'paint']);
  pLamp(P, room, -4.0, 3.6); pLamp(P, room, 0.0, 4.4); pLamp(P, room, -4.2, 6.8);
  if (e) { pSconce(P, room, 'n', e.x + 1.8); pSconce(P, room, 'n', e.x - 1.8); }
}

// a main room designed for its trade: the focal piece first (counter, forge, desk, weapon wall), then the kit pieces its trade owns along the free walls, then the wall things
function dressKind(P, c, room, hh, info) {
  const id = P.id, D = KIT_DRESS[id] || {}, R = P.R, a = room.in, kind = info.kind; P.hall = { room, hh };
  if (hh) pSpot(P, 'home', hh.front[0], hh.front[1], Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
  if (kind === 'shop') {          // a counter across the room with the keeper behind it, wares on every wall
    const t = pFree(P, room, id + '.counter', 2.6, 0.8, 1.0, 0, m => { Props.table(m, 2.6, 0.8, 1.0); Props.clutter(m, R, -1.1, 1.1, 1.0, 0, ['jug', 'bowl', 'cheese', 'loaf', 'pot', 'apple'], 5, c); }, { near: [-1.6, 2.4], surface: true });
    if (t) { pSpot(P, 'counter', t.cx, t.cz + 0.8, PI, { k: 0 }); pSpot(P, 'front', t.cx, t.cz - 0.8, 0, { k: 0 }); }
    for (const sd of ['w', 'e']) for (let i = 0; i < 2; i++) pAgainst(P, room, sd, id + '.ware' + sd + i, 1.8, 0.34, 1.8, +1, pdShelf(1.8, 1.8, 3, stockFill(c, ['pot', 'jug', 'bowl', 'cheese', 'bottle', 'loaf'])), { at: 'mid' === 0 ? 0 : 2.0 + i * 2.2 });
  } else if (kind === 'smith') {          // the forge is the hearth; the anvil in front of it, a quench trough, a bench and weapons
    const an = hh ? pPut(P, room, id + '.anvil', hh.front[0] + 0.9, hh.front[1] - 0.4, 0, 0.7, 0.45, 0.9, m => Props.anvil(m), {}) : null;
    if (an) pSpot(P, 'anvil', an.cx, an.cz - 0.55, 0, { k: 0 }); if (hh) pSpot(P, 'forge', hh.front[0] - 0.9, hh.front[1] - 0.2, Math.atan2(hh.px - hh.front[0], -(hh.pz - hh.front[1])), { k: 0 });
    pFree(P, room, id + '.trough', 1.2, 0.5, 0.6, 0, m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.6, 0, -0.25, 0.6, 0.55, 0.25); m.mat(MAT.PLAIN, [0.12, 0.2, 0.3]); m.quad([-0.55, 0.5, -0.2], [-0.55, 0.5, 0.2], [0.55, 0.5, 0.2], [0.55, 0.5, -0.2]); }, { near: [a.x0 + 1.2, 2.5], lowOk: true });
    pFree(P, room, id + '.coal', 0.6, 0.6, 0.5, 0, m => Props.crate(m, 0.6), { near: [a.x1 - 1, 2] });
  } else if (kind === 'study') {          // a desk with the chronicle, bookcases, a long table
    const dk = pFree(P, room, id + '.desk', 1.6, 0.8, 0.8, 0, pdTable(1.6, 0.8, ['book', 'candle', 'book', 'mug'], 4, c), { near: [a.x0 + 2.0, 3.2], surface: true });
    if (dk) { pSpot(P, 'sit', dk.cx, dk.cz + 0.8, PI, { k: 0 }); pSit(P, 'sit', dk.cx, dk.cz + 0.8, PI, 0); P.deskAt = dk; }
    pDining(P, room, 2.0, 0.9, { near: [a.x1 - 2.5, 3.8], id: 'table', n: 3 });
    for (const sd of ['w', 'e']) pKitFloor(P, room, sd, 'Bookcase_2', { n: sd, at: 'start' });
  } else if (kind === 'guard') {          // weapon stands and a dummy, a table with the watch roster
    pDining(P, room, 2.0, 0.9, { near: [0, 3.6], id: 'table', n: 3 });
    for (const sd of ['w', 'e']) { pKitFloor(P, room, sd, 'WeaponStand', { n: sd, at: 'start' }); pKitFloor(P, room, sd, 'Dummy', { n: sd + 'd', at: 'end' }); }
  }
  for (const nm of D.floor || []) for (const sd of pSidesLong(room)) { if (pKitFloor(P, room, sd, nm, { n: sd + (R() * 99 | 0) })) break; }
  pWalls(P, room, (D.wall || []).concat(['paint', 'Torch_Metal']));
  const e = P.doors.find(d => d.b === null); if (e) pSconce(P, room, 'n', e.x + 1.5) || pSconce(P, room, 'n', e.x - 1.5);
  if (hh) pLamp(P, room, 0, 3.2); else pLamp(P, room, 0, 3.0);
  pFree(P, room, id + '.rug', 2.2, 1.5, 0.02, 0.1, pdRug(2.2, 1.5, [0.4, 0.26, 0.2]), { flat: true, noClear: true, near: [0, 4.2] });
}
