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
  m.m1 = P.zone; m.ao = INT_AO; const rc = pRecBegin(false), t0 = m.ni;
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
  pRecEnd(rc, m, t0);
  // [fx2] the firewood beside the hearth is a real thing on the floor: it needs its own place (inside the room, off every other item) and is recorded so nothing is put through it
  let wp_ok = false; { const cs = Math.cos(rot), sn = Math.sin(rot), lx = 0.4, lz = wid / 2 + 0.55, wx = px + lx * cs + lz * sn, wz = pz - lx * sn + lz * cs, wr = pFoot(wx, wz, 0.5, 0.72, rot), a_ = room.in;
    if (o.deco !== false && wr.x0 >= a_.x0 - 0.01 && wr.x1 <= a_.x1 + 0.01 && wr.z0 >= a_.z0 - 0.01 && wr.z1 <= a_.z1 + 0.01 && pFit(P, room, wr, { h: 0.7, lowOk: true })) { wp_ok = true; P.occ(room.k, wr, 'floor', P.id + '.hlogs' + P.items.length, { h: 0.7, hh: 0.7, room: room.id, back: side }); } }
  if (o.deco !== false) {          // mantel objects, antlers over the breast, a rug and firewood by the fire
    at(m, px, L.y + 0.02, pz, rot, () => {
      if (typeof kitLit === 'function' && Kit.pieces.CandleStick_Triple) for (const sg of [-1, 1]) kitLit(m, 'CandleStick_Triple', 0.42, 1.6 - 0.02, sg * (wid / 2 - 0.32), 0.8, sg, { cap: 0, kind: 'candle', flame: 'candle' });
      if (Kit.pieces.Vase_4) kp(m, 'Vase_4', 0.42, 1.6, 0, 0.8, 0.4);
      if (Kit.pieces.Mug) kp(m, 'Mug', 0.3, 1.6, 0.3, 0.9, 1);
      if (H > 2.9) at(m, 0.68, Math.min(H - 0.55, 2.85) - 0.02, 0, PI / 2, () => antlers(m));
      at(m, dep + 0.8, 0, 0, 0, () => Props.rug(m, 1.2, wid + 0.6, o.rug || [0.5, 0.32, 0.2]));
      if (wp_ok) at(m, 0.4, 0, wid / 2 + 0.55, 0, () => Props.woodpile(m, 4, 4, 0.5));
    });
  }
  const fp = s.rect;
  P.occ(room.k, fp, 'hearth', P.id + '.hearth', { h: H, back: side, room: room.id, wid, rec: rc });
  P.clear.push(Object.assign(side === 'n' ? { x0: fp.x0, x1: fp.x1, z0: fp.z1, z1: fp.z1 + 1.0 } : side === 's' ? { x0: fp.x0, x1: fp.x1, z0: fp.z0 - 1.0, z1: fp.z0 } : side === 'w' ? { x0: fp.x1, x1: fp.x1 + 1.0, z0: fp.z0, z1: fp.z1 } : { x0: fp.x0 - 1.0, x1: fp.x0, z0: fp.z0, z1: fp.z1 }, { k: room.k, kind: 'hearth' }));
  P.lightIn[room.id] = 1; P.hearths = (P.hearths || []).concat([{ k: room.k, x: px, z: pz, side, wid, rect: fp }]);
  return { px, pz, side, fp, wid, front: hor ? [px, pz + (side === 'n' ? 1 : -1) * (dep + 0.6)] : [px + (side === 'w' ? 1 : -1) * (dep + 0.6), pz] };
}
// [fx3] a partition wall runs through an upper-floor pier: the pier's collider stops at the wall's faces instead of overlapping its thickness
function pierTrim(o) {
  const i = World.colliders.indexOf(o); if (i < 0) return;
  for (const w of World.colliders) {
    if (w === o || w.r !== undefined || w.y1 - w.y0 < 2 || w.y0 > o.y1 - 0.5 || w.y1 < o.y0 + 0.5 || Math.hypot(w.x - o.x, w.z - o.z) > 8) continue;
    const thinA = w.hx < w.hz, thin = thinA ? [w.ax, w.az, w.hx] : [w.bx, w.bz, w.hz], lng = thinA ? [w.bx, w.bz, w.hz] : [w.ax, w.az, w.hx]; if (thin[2] > 0.3) continue;
    const ax = Math.abs(thin[0] * o.ax + thin[1] * o.az) > 0.99 ? 'a' : Math.abs(thin[0] * o.bx + thin[1] * o.bz) > 0.99 ? 'b' : null; if (!ax) continue;
    const ux = ax === 'a' ? o.ax : o.bx, uz = ax === 'a' ? o.az : o.bz, h = ax === 'a' ? o.hx : o.hz, pc = o.x * ux + o.z * uz, wc = w.x * ux + w.z * uz, t = thin[2];
    const vx = ax === 'a' ? o.bx : o.ax, vz = ax === 'a' ? o.bz : o.az, hv = ax === 'a' ? o.hz : o.hx, pv = o.x * vx + o.z * vz, wv = w.x * vx + w.z * vz;
    if (wc - t > pc + h - 0.02 || wc + t < pc - h + 0.02 || wv - lng[2] > pv + hv - 0.02 || wv + lng[2] < pv - hv + 0.02) continue;
    const lo = [pc - h, wc - t], hi = [wc + t, pc + h], out = [];
    for (const r of [lo, hi]) if (r[1] - r[0] > 0.04) { const d = (r[0] + r[1]) / 2 - pc; out.push(Object.assign({}, o, { x: o.x + ux * d, z: o.z + uz * d, [ax === 'a' ? 'hx' : 'hz']: (r[1] - r[0]) / 2 })); }
    World.colliders.splice(i, 1, ...out); return;
  }
}
// the same stack on another level: a stone pier from floor to ceiling over (or under) the hearth
function pPier(P, k, hearth) {
  const L = P.lv[k]; if (!L) return; const h = hearth, fp = h.fp, m = P.c.int, room = pRoomAt(P, k, (fp.x0 + fp.x1) / 2, (fp.z0 + fp.z1) / 2); if (!room) return;
  m.m1 = P.zone; m.ao = INT_AO; m.mat(MAT.STONE, [0.9, 0.88, 0.85], 0.8); at(m, 0, L.y + 0.02, 0, 0, () => { m.box(fp.x0 + 0.1, 0, fp.z0 + 0.1, fp.x1 - 0.1, L.H - 0.02, fp.z1 - 0.1); addBoxCollider(m, fp.x0 + 0.1, fp.z0 + 0.1, fp.x1 - 0.1, fp.z1 - 0.1, 0, L.H); (P.pierCols = P.pierCols || []).push(World.colliders[World.colliders.length - 1]); });
  pOcc(P, k, fp, 'hearth', P.id + '.stack' + k, { h: L.H, back: h.side, room: room.id });
}
// a wall candle bracket by a door or over a bed; lit like any candle
function pSconce(P, room, side, u, y) {
  const rec = pHang(P, room, side, u, 0.3, y || 1.55, (y || 1.55) + 0.3, (m, hh) => { m.mat(MAT.METAL, COL.black); m.box(-0.035, -0.1, 0.0, 0.035, 0.12, 0.012); m.box(-0.01, 0.0, 0.0, 0.01, 0.025, 0.19); m.box(-0.008, -0.07, 0.0, 0.008, 0.0, 0.1); m.cyl(0, 0.025, 0.19, 0.05, 0.04, 0.014, 10, 2); at(m, 0, 0.04, 0.19, 0, () => Props.candle(m, P.c, true)); }, P.id + '.sconce', {}); if (rec) P.lightIn[room.id] = 1; return rec;
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
// [fin] the seat side of a bench: a 0.9 m wide strip along its outer side, or a 0.9 m deep strip past either end, must stand free of solid items (inside the room)
function pLaneOk(P, room, b, sg, rot, bl) {
  const lw = 0.9, bd = 0.23, o = { h: 0.5, noClear: true }, side = rot ? rectOf(b[0] + sg * (bd + lw / 2), b[1], lw, bl) : rectOf(b[0], b[1] + sg * (bd + lw / 2), bl, lw);
  if (pFit(P, room, side, o)) return true;
  for (const e of [-1, 1]) { const en = rot ? rectOf(b[0], b[1] + e * (bl / 2 + lw / 2), 1.2, lw) : rectOf(b[0] + e * (bl / 2 + lw / 2), b[1], lw, 1.2); if (pFit(P, room, en, o)) return true; }
  return false;
}
// [fin] with the extra rectangles standing in the room, a 0.9 m wide way (0.45 m clear of every solid item, 0.3 m of the walls) must still run from the room's doors to every seat given, the hearth front and each stair foot in the room
function pConnOk(P, room, extra, seats) {
  const a = room.in, k = room.k, HW = 0.45, st = 0.15, nx = Math.ceil((a.x1 - a.x0) / st) + 1, nz = Math.ceil((a.z1 - a.z0) / st) + 1;
  const seeds = []; for (const d of P.doors) if (d.k === k && (d.a === room.id || d.b === room.id)) seeds.push([Math.min(a.x1 - 0.3, Math.max(a.x0 + 0.3, d.x)), Math.min(a.z1 - 0.3, Math.max(a.z0 + 0.3, d.z))]);
  if (!seeds.length) return true;
  const obs = P.items.filter(i => i.k === k && P_SOLID[i.kind] && (i.kind !== 'floor' || i.h === undefined || i.h > 0.25)).concat(extra);
  const free = (x, z) => { if (x < a.x0 + 0.45 || x > a.x1 - 0.45 || z < a.z0 + 0.45 || z > a.z1 - 0.45) return false; for (const o of obs) { const dx = Math.max(o.x0 - x, 0, x - o.x1), dz = Math.max(o.z0 - z, 0, z - o.z1); if (dx * dx + dz * dz < HW * HW) return false; } return true; };
  const seen = new Uint8Array(nx * nz), q = [];
  const put = (i, j) => { if (i < 0 || j < 0 || i >= nx || j >= nz || seen[i * nz + j]) return; if (!free(a.x0 + i * st, a.z0 + j * st)) return; seen[i * nz + j] = 1; q.push(i, j); };
  for (const [sx, sz] of seeds) { const i0 = Math.round((sx - a.x0) / st), j0 = Math.round((sz - a.z0) / st); for (let r = 0; r <= 7; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) put(i0 + di, j0 + dj); }
  if (!q.length) return true;
  for (let h = 0; h < q.length; h += 2) { const i = q[h], j = q[h + 1]; put(i + 1, j); put(i - 1, j); put(i, j + 1); put(i, j - 1); }
  const near = (x, z, r) => { const n = Math.ceil(r / st); const i0 = Math.round((x - a.x0) / st), j0 = Math.round((z - a.z0) / st); for (let di = -n; di <= n; di++) for (let dj = -n; dj <= n; dj++) { const i = i0 + di, j = j0 + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && seen[i * nz + j] && Math.hypot(di, dj) * st <= r) return true; } return false; };
  for (const s of seats) if (!near(s[0], s[1], 0.85)) return false;
  const hh = P.hall && P.hall.room === room && P.hall.hh; if (hh && hh.front && !near(hh.front[0], hh.front[1], 0.5)) return false;
  for (const s of P.stairs) { const pt = s.k0 === k && rOv(s.low, rGrow(a, 0.1)) ? s.lowPt : s.k1 === k && rOv(s.high, rGrow(a, 0.1)) ? s.highPt : null; if (pt && !near(pt[0], pt[1], 1.2)) return false; }
  return true;
}
// [fin] every household house ends with four seats with distinct spots (sit, seat1, seat2, seat3): wall benches with a 0.9 m way first, stools next, and as a last resort a bench without the way
function pEnsureSeats(P) {
  const nm = ['sit', 'seat1', 'seat2', 'seat3'], miss = () => nm.filter(n => !(World.spots[P.id + '.' + n] && World.spots[P.id + '.' + n].sit));
  if (!P.hall || !P.hall.room || !miss().length) return; const hid = P.id; if (!(/^(in|shop|high)\./.test(hid) || ['weaver', 'mill', 'farm', 'hunter', 'fisher', 'draper', 'herbalist'].includes(hid))) return;
  const room = P.hall.room, k = room.k, bench = (strict) => { for (const sd of ['e', 'w', 'n', 's']) { if (miss().length < 2) return; const sn = pSnap(P, P.c.int), n0 = P.items.length, bn = pAgainst(P, room, sd, P.id + '.seatbench' + P.items.length, 1.3, 0.42, 0.46, +1, pdBench(1.3), {}); if (!bn) continue; const yw = { n: PI, s: 0, w: PI / 2, e: -PI / 2 }[sd], al = sd === 'n' || sd === 's', sp = [-0.33, 0.33].map(q => [bn.cx + (al ? q : 0), bn.cz + (al ? 0 : q), yw]); if (strict && !pConnOk(P, room, [], sp)) { pUndo(P, P.c.int, sn); P.items.length = n0; continue; } const m2 = miss(); sp.forEach((q, i) => pSit(P, m2[i], q[0], q[1], q[2], k)); } };
  bench(true);
  if (miss().length) { const hf = P.hall.hh && P.hall.hh.front ? P.hall.hh.front : pCentre(room); for (const [x, z] of pCands(room, [hf[0], hf[1] - 1.0], 0.2)) { if (!miss().length) break; const it = pPut(P, room, P.id + '.seatstool' + P.items.length, x, z, 0, 0.42, 0.42, 0.46, m => Props.stool(m), {}); if (it) { const sp = [it.cx, it.cz, Math.atan2(hf[0] - it.cx, -(hf[1] - it.cz))]; if (pConnOk(P, room, [], [[sp[0], sp[1]]])) pSit(P, miss()[0], sp[0], sp[1], sp[2], k); else pSit(P, miss()[0], sp[0], sp[1], sp[2], k); } } }
  if (miss().length) bench(false);
}
// a dining table with a bench on each long side: returns { x, z, seats: [[x, z, yaw]] } or null
function pDining(P, room, len, wid, opt) {
  opt = opt || {}; if (opt.strictOnly || opt.loose) return pDin(P, room, len, wid, opt);
  return pDin(P, room, len, wid, opt) || pDin(P, room, len, wid, Object.assign({}, opt, { loose: true }));      /* [fin] a table with a 0.9 m way round it when there is one, else as before */
}
function pDin(P, room, len, wid, opt) {
  opt = opt || {}; const c = P.c, items = opt.items || ['mug', 'plate', 'bowl', 'candle', 'loaf'], pts = pCands(room, opt.near);
  for (const rot of opt.rots || [0, PI / 2]) {
    const tw = rot ? wid : len, td = rot ? len : wid;
    for (const p of pts) {
      const [tx, tz] = p, tr = rectOf(tx, tz, tw, td);
      if (!pFit(P, room, tr, { h: 0.78 })) continue;
      const bs = [-1, 1].map(sg => rot ? [tx + sg * (wid / 2 + 0.34), tz] : [tx, tz + sg * (wid / 2 + 0.34)]);
      const brs = bs.map(b => rot ? rectOf(b[0], b[1], 0.46, len * 0.9) : rectOf(b[0], b[1], len * 0.9, 0.46));
      if (!brs.every(r => pFit(P, room, r, { h: 0.46 })) || (opt.sideRoom && !brs.every(r => true))) continue;
      if (!opt.loose && !bs.every((b, i) => pLaneOk(P, room, b, i ? 1 : -1, rot, len * 0.9))) continue;      /* [fin] a 0.9 m way to every seat: beside the bench or past one end */
      { const sp = []; bs.forEach((b, i) => { for (const q of [-0.5, 0.5]) sp.push(rot ? [b[0], tz + q * len * 0.5] : [tx + q * len * 0.5, b[1]]); }); if (!opt.loose && !pConnOk(P, room, [tr, ...brs], sp)) continue; }      /* [fin] the table never cuts a seat, the hearth or a stair off */
      const t = pPut(P, room, P.id + '.' + (opt.id || 'table'), tx, tz, 0, tw, td, 0.78, m => { m.push(); if (rot) m.RY(rot); pdTable(len, wid, items, opt.n || 3, c)(m); m.pop(); }, { surface: true });
      if (!t) continue;
      const seats = [];
      bs.forEach((b, i) => { const sg = i ? 1 : -1; pPut(P, room, P.id + '.' + (opt.id || 'table') + 'bench' + i, b[0], b[1], rot ? PI / 2 : 0, len * 0.9, 0.46, 0.46, pdBench(len * 0.9), {}); for (const q of [-0.5, 0.5]) seats.push([rot ? b[0] : tx + q * len * 0.5, rot ? tz + q * len * 0.5 : b[1], rot ? (sg < 0 ? PI / 2 : -PI / 2) : (sg < 0 ? PI : 0)]); });
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
  let dn = pDining(P, room, o.len || 2.0, 0.9, { near, items: o.items, n: 4, strictOnly: true });
  // [cast] the back room of a shop and the floor of a workshop are small: the table for four did not fit and the household ate standing (no seat anchors).
  // A smaller table then, and failing that a bench against a wall: somewhere for the people of the house to sit to their meal.
  if (!dn) dn = pDining(P, room, 1.3, 0.75, { near, items: (o.items || []).slice(0, 3), n: 2, strictOnly: true }) || pDining(P, room, 1.0, 0.7, { near, items: (o.items || []).slice(0, 2), n: 2, strictOnly: true });
  if (!dn && o.alt) { const al = o.alt, nr = pCentre(al); dn = pDining(P, al, 1.8, 0.85, { near: nr, id: 'meal', n: 3, items: o.items, strictOnly: true }) || pDining(P, al, 1.3, 0.75, { near: nr, id: 'meal', n: 2, items: (o.items || []).slice(0, 3), strictOnly: true }); if (dn) { dn.seats.forEach((st, i) => pSit(P, i ? 'seat' + i : 'sit', st[0], st[1], st[2], al.k)); pLamp(P, al, dn.x, dn.z); dn = null; o = Object.assign({}, o, { _alt: 1 }); } }      /* [fin] a back room too tight for a table with a 0.9 m way round it: the household eats in the shop */
  if (!dn && !o._alt) {      /* [fin] a bench against a wall: the first side that leaves a 0.9 m way to both seats; when none does, the first side that takes it */
    let first = null;
    for (const sd of ['e', 'w', 'n', 's']) { const sn = pSnap(P, P.c.int), n0 = P.items.length, bn = pAgainst(P, room, sd, P.id + '.mealbench', 1.3, 0.42, 0.46, +1, pdBench(1.3), {}); if (!bn) continue; const yw = { n: PI, s: 0, w: PI / 2, e: -PI / 2 }[sd], al = sd === 'n' || sd === 's', sp = [-0.33, 0.33].map(q => [bn.cx + (al ? q : 0), bn.cz + (al ? 0 : q), yw]);
      if (pConnOk(P, room, [], sp) || (!first && sd === 's')) { sp.forEach((q, i) => pSit(P, i ? 'seat' + i : 'sit', q[0], q[1], q[2], k)); first = 1; break; }
      pUndo(P, P.c.int, sn); P.items.length = n0; if (!first) first = { sd }; }
    if (first && first !== 1) { const sd = first.sd, bn = pAgainst(P, room, sd, P.id + '.mealbench', 1.3, 0.42, 0.46, +1, pdBench(1.3), {}); if (bn) { const yw = { n: PI, s: 0, w: PI / 2, e: -PI / 2 }[sd], al = sd === 'n' || sd === 's'; [-0.33, 0.33].forEach((q, i) => pSit(P, i ? 'seat' + i : 'sit', bn.cx + (al ? q : 0), bn.cz + (al ? 0 : q), yw, k)); } }
  }
  if (!dn && !o._alt && !P.spots.sit) dn = pDining(P, room, 1.3, 0.75, { near, items: (o.items || []).slice(0, 3), n: 2, loose: true }) || pDining(P, room, 1.0, 0.7, { near, items: (o.items || []).slice(0, 2), n: 2, loose: true });      /* [fin] last resort: a household with no seat at all */
  if (dn) {
    dn.seats.forEach((s, i) => pSit(P, i ? 'seat' + i : 'sit', s[0], s[1], s[2], k));
    pPut(P, room, P.id + '.rug', dn.x, dn.z, 0, dn.rot ? 1.6 : 2.2, dn.rot ? 2.2 : 1.6, 0.02, pdRug(dn.rot ? 1.6 : 2.2, dn.rot ? 2.2 : 1.6, o.rug || DYE.red), { flat: true, noClear: true });
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
  pWalls(P, room, o.walls || ['Torch_Metal', 'paint', 'paint', 'rack', 'paint', 'Peg_Rack']);
}
function pBarrelCorner(P, room, sd) { return pAgainst(P, room, sd, P.id + '.barrel', 0.66, 0.66, 0.9, 0, pdBarrel(0.33, 0.9), { at: 'end' }); }
// [cast] a bed for a sleeper the plan had no bed for: against a wall of one of the rooms given, a full bed first, then a narrow one, then a cot; under a window only when no blank wall has room
function castBedIn(P, rooms, nm, name, col, fur, at) {
  for (const room of rooms) { if (!room) continue; for (const low of [false, true]) for (const [w, d] of [[1.06, 2.1], [0.9, 1.9], [0.8, 1.7]]) for (const sd of ['e', 'w', 'n', 's']) { const it = pAgainst(P, room, sd, name, w, d, 0.95, -1, pdBed(w - 0.16, col, fur), Object.assign(low ? { lowOk: true } : {}, at !== undefined ? { at } : {}));       /* a blank wall first; then low under a window (coordinator, Build 83: a bed may stand under a window) */ if (it) { pBedSpot(P, nm, it.cx, it.cz, rotBack(sd, -1), room.k); return it; } } }
  return null;
}
function dressBedroom(P, room, o) {
  o = o || {}; const k = room.k, R = P.R, beds = o.beds || ['bed'], col = o.blanket || R.pick([DYE.red, DYE.blue, DYE.green, [0.5, 0.42, 0.3], DYE.purple]);
  let placed = 0;
  for (const nm of beds) {
    let it = null;
    for (const bh of [o.bedH || 0.95, 0.7]) { if (it) break; for (const sd of o.bedSides || ['e', 'w', 'n', 's']) { it = pAgainst(P, room, sd, P.id + '.' + nm, 1.06, 2.1, bh, -1, pdBed(0.9, col, !!o.fur), { at: o.bedAt }); const s = it ? { cx: it.cx, cz: it.cz } : null; if (it) { pBedSpot(P, nm, s.cx, s.cz, rotBack(sd, -1), k); if (o.bedInteract && nm === beds[0]) pInteract(P, s.cx, 0.55, s.cz, { kind: 'bed', id: P.id + '.bed', r: 1.9 }, k); placed++; if (nm === beds[0]) P.firstBed = { room, sd, cx: s.cx, cz: s.cz, nm }; break; } } }
    /* [fin] beds go against a wall only: the second try uses a low bed (0.7 m) so a bed may stand under a window; the free-standing fallback is gone */
    if (!it && typeof castSleepers === 'function' && castSleepers(P.id) > Object.keys(P.spots).filter(q => /^bed\d*$/.test(q) && P.spots[q].lie).length) { it = castBedIn(P, [room].concat(o.bedRooms || []), nm, P.id + '.' + nm, col, !!o.fur, o.bed2At); if (it) placed++; else P.err.push('no wall for the bed ' + nm + ' of a sleeper of ' + P.id); }       /* [cast] a sleeper of this house still has no bed: a narrower one, then a cot, against whichever wall has room, in this room or the next the plan names. Never free in the room (coordinator, Build 81) */
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
  for (let i = 0; i < 2; i++) pFree(P, room, P.id + '.sack' + i, 0.62, 0.62, 0.5, R() * 6, pdSack(0.3), { near: [room.in.x0 + 1, room.in.z1 - 1], noClear: false });
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
  for (let i = 0; i < 3; i++) pFree(P, room, P.id + '.csack' + i, 0.62, 0.62, 0.5, R() * 6, pdSack(0.3), { near: [room.in.x1 - 1, room.in.z0 + 1] });
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
  const draw = it[4] ? m => kitLit(m, name, 0, 0, 0, sc, 0, { r: 6.5, c: [2.3, 1.4, 0.6], kind: 'candle' }) : m => kp(m, name, 0, name === 'Crate_Wooden' ? 0.04 : 0, 0, sc, 0);
  const r = pAgainst(P, room, side, P.id + '.' + name + (o && o.n || ''), w, d, h, -1, draw, Object.assign({ lowOk: !it[2] }, o || {}));
  if (r && it[4]) P.lightIn[room.id] = 1; return r;
}
function pKitWall(P, room, side, u, name, o) {
  const it = KIT_WALL[name]; if (!it || !Kit.pieces[name]) return null;
  if (name.startsWith('Banner') && !/^(inn|elder|chapel|guardhouse|draper|store)$/.test(P.id)) return null;          // [fx2] heraldic cloth only where there is something to declare
  const y = Math.min(it[1], P.lv[room.k].H - 0.3), ban = name.startsWith('Banner'), lit = name === 'Torch_Metal';
  const rec = pHang(P, room, side, u, it[0], ban ? Math.max(1.0, y - 1.6) : y - 0.45, y + 0.35, m => {
    if (lit) kitLit(m, name, 0, 0, -it[2], 1, PI, { r: 6.2, c: [2.5, 1.45, 0.55], kind: 'fire', flame: 'torch', size: 0.14 }); else kp(m, name, 0, 0, -it[2], it[3] || 1, PI);
  }, P.id + '.' + name, Object.assign({ pivot: y }, o || {}));
  if (rec && lit) P.lightIn[room.id] = 1; return rec;
}
function pArt(P, room, side, u, kind) {
  if (kind === 'paint' && !PD.paintOK(P)) return null;          // [fx2] pictures only where someone owns pictures
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
  const cw = !!info.cellarway, hall = pRoom(P, 0, 'hall', info.inn ? 'common' : 'hall', x0, 0, x1, cw ? Dh - 2.5 : Dh), store = pRoom(P, 0, 'store', info.inn ? 'kitchen' : 'store', x0, Dh, 0, D), bed0 = pRoom(P, 0, 'bedroom', info.inn ? 'keeper' : 'bedroom', 0, Dh, x1, D);
  pDoor(P, 'hall', null, 0, 0);
  if (cw) {      /* [inout] the Hart: the owner found nothing that read as a cellar door. Now a door in the back wall of the common room opens on the passage behind it (the cross passage of an inn), and the cellar stair goes down from there; the kitchen and the keeper's room open off the same passage */
    pRoom(P, 0, 'passage', 'corridor', x0, Dh - 2.5, x1, Dh, { win: false, floor: 'stone' });      /* 2.5 m: the stair well along its back wall leaves a way past it to the keeper's door */
    pDoor(P, 'hall', 'passage', x0 / 2, Dh - 2.5, { cellarDoor: true }); pDoor(P, 'passage', 'store', x0 / 2, Dh); pDoor(P, 'passage', 'bedroom', x1 - 0.9, Dh);
  } else { pDoor(P, 'hall', 'store', x0 / 2, Dh); pDoor(P, 'hall', 'bedroom', x1 / 2, Dh); }
  // cellar: under the hall (the stair arrives here) and under the store
  const cel = pRoom(P, -1, 'cellar', 'cellar', x0, 0, x1, Dh, { floor: 'stone', win: false }), vault = pRoom(P, -1, 'vault', 'cellar', x0, Dh, 0, D, { floor: 'stone', win: false });
  pDoor(P, 'cellar', 'vault', x0 / 2, Dh);
  // the stairs: cellar -> hall along the west wall (toward +z), hall -> loft along the east wall (toward +z)
  const tr = 0.22;
  const fl = !!info.flank;
  pStair(P, cw ? { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: -1, x: 1.4, z: Dh - 0.75, width: 1.0, tread: tr }      /* its head by the cellar door: the well does not stand across the way to it */ : fl ? { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'x', dir: 1, x: 1.4, z: 1.0, width: 1.0, tread: tr } : { id: 'stCellar', name: 'cellar', k0: -1, k1: 0, axis: 'z', dir: 1, x: x0 + 0.95, z: 1.3, width: 1.0, tread: tr });
  if (up) {
    pStair(P, fl ? { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'x', dir: -1, x: -1.4, z: 1.0, width: 1.0, tread: tr } : { id: 'stUp', name: 'up', k0: 0, k1: 1, axis: 'z', dir: 1, x: x1 - 0.95, z: 1.3, width: 1.0, tread: tr });
    if (fl) { pRoom(P, 1, 'loft', 'gallery', x0, 0, 0, D); pRoom(P, 1, 'chamber1', 'bedroom', 0, 0, x1, Dh); pRoom(P, 1, 'chamber2', 'bedroom', 0, Dh, x1, D); pDoor(P, 'loft', 'chamber1', 0, 3.5); pDoor(P, 'loft', 'chamber2', 0, Dh + 1.5); }
    else { pRoom(P, 1, 'loft', 'bedroom', 0, 0, x1, D); pRoom(P, 1, 'chamber1', 'bedroom', x0, 0, 0, Dh); pRoom(P, 1, 'chamber2', 'bedroom', x0, Dh, 0, D); pDoor(P, 'loft', 'chamber1', 0, 2.5); pDoor(P, 'loft', 'chamber2', 0, Dh + 1.5); }
  }
  if (info.shellWins && typeof pShellWins === 'function') pShellWins(P, c, { x0, z0: 0, x1, z1: D });      /* [inout] the windows the shell shows, and no others */
  pLayout(P);
  if (cw) pLamp(P, P.rooms.passage, x1 - 2.0, Dh - 1.0);      /* [inout] the passage behind the common room: one lantern */
  if (info.inn) P.clear.push({ x0: x1 - 3.0, x1: x1, z0: Dh - 2.4, z1: Dh, k: -1, kind: 'path' });      /* [inout] the corner of the Hart's cellar where the bricked arch opens (94d_act2.js door.tunnel.in): nothing stands in front of it */
  // ground floor
  const hall0 = hall, hh = pHearth(P, hall, 's', info.inn ? 2.4 : 1.7, { cauldron: true, at: 0 });
  P.hall = { room: hall, hh };
  if (need.has('counter')) {
    const t = pFree(P, hall, P.id + '.counter', 2.0, 0.7, 1.0, 0, m => { Props.table(m, 2.0, 0.7); Props.clutter(m, c.R, -0.8, 0.8, 0.76, 0, ['jug', 'bowl', 'cheese', 'loaf'], 3, c); }, { near: [x0 / 2 + 0.2, 2.2], surface: true, keeper: 0.75 });
    if (t) pSpot(P, 'counter', t.cx, t.cz + 0.75, PI, { k: 0 });
  }
  if (hh) { pPier(P, -1, hh); if (up) pPier(P, 1, hh); }
  let kh = null;
  if (info.inn) { kh = pHearth(P, store, 'w', 1.6, { cauldron: true, size: 0.4, at: 'mid' }); if (kh) { pPier(P, -1, kh); if (up) pPier(P, 1, kh); } dressInn(P, c, hall, hh); dressKitchen(P, store, { hh: kh }); PD.rack(P, store, -3.5, 10.4, 2.4, 0, ['pot', 'herb', 'ham', 'herb', 'garlic']); } else if (KIT_DRESS[P.id] && info.kind) { dressKind(P, c, hall, hh, info); dressStore(P, store); } else { dressHall(P, hall, { hh }); dressStore(P, store); } dressBedroom(P, bed0, { beds: need.has('bed2') && !up ? ['bed', 'bed2'] : ['bed'], loot: LOOT[P.id], bedSides: info.inn ? ['s', 'e', 'w', 'n'] : undefined, bedAt: info.inn ? 'mid' : undefined });
  if (info.inn) {      /* [fin] HART CELLAR: the east wall of the cellar keeps a 1.5 m x 1.5 m floor free of casks, crates and shelves in front of the fresh-brick patch (story secret 'wall', 94d doorway); the world position is published for them */
    const zc = (cel.in.z0 + cel.in.z1) / 2, x1 = cel.in.x1, y0 = P.lv[-1] ? P.lv[-1].y : -2.52;
    P.clear.push({ x0: x1 - 1.5, x1: x1, z0: zc - 0.75, z1: zc + 0.75, k: -1, kind: 'secret', room: cel });
    const wp = P.w2(x1, y0, zc); World.hartWall = { p: [wp[0], wp[1], wp[2]], inW: P.w2(x1 - 1.2, y0, zc) };
    { const m = P.c.int; m.m1 = P.zone; m.ao = INT_AO; m.mat(MAT.PLAIN, [0.004, 0.004, 0.004], 1); const xq = x1 - 0.02; m.quad([xq, y0 + 0.02, zc + 0.5], [xq, y0 + 1.92, zc + 0.5], [xq, y0 + 1.92, zc - 0.5], [xq, y0 + 0.02, zc - 0.5]); }      /* the dark behind the brick patch (97d door): drawn with the room so it is as dark as the room's own black, covered by the patch until the bricks are out */
  }
  dressCellar(P, cel, { barrels: info.inn ? 5 : 1, crates: 2, rows: !!info.inn }); dressCellar(P, vault, { barrels: info.inn ? 6 : 3, rows: !!info.inn });
  if (up) {
    if (info.inn) { dressBedroom(P, P.rooms.chamber1, { beds: ['bed2'], chestId: 'chest2', chest: false, table: true, bedInteract: true }); dressBedroom(P, P.rooms.chamber2, { beds: ['bed3', 'bed4'], chestId: 'chest3', chest: false, table: true }); dressLanding(P, P.rooms.loft); PD.gallery(P, P.rooms.loft); pWalls(P, P.rooms.loft, ['Banner_1_Cloth', 'paint', 'Torch_Metal', 'paint', 'rack'], {}); }
    else { dressBedroom(P, P.rooms.chamber1, { beds: ['bed2'], chestId: 'chest2', chest: false }); dressBedroom(P, P.rooms.chamber2, { beds: [], chest: false }); dressBedroom(P, P.rooms.loft, { beds: ['bed3'], chestId: 'chest3', chest: false }); }
  }
  if (info.inn) {     /* the density pass (D): every wall run, corner and open floor of the inn carries something */
    const rm = P.rooms, dn = (id, o) => rm[id] && PD.dense(P, rm[id], o);
    dn('hall', { pool: ['tapestry', 'hooks', 'cabinet', 'paint', 'shelf', 'cask', 'paint', 'sconce'], corner: ['broom', 'cask', 'stack', 'sacks'], mid: { kinds: ['rug', 'casks'], max: 2 }, racks: 2, rackKinds: ['mug', 'herb', 'pot', 'herb'] });
    dn('store', { pool: ['shelf', 'cupboard', 'hooks', 'cask', 'sacks', 'stack', 'cabinet'], corner: ['broom', 'sacks', 'stack'], mid: { kinds: ['table', 'sacks'], max: 1 }, racks: 1 });
    dn(bed0.id, { pool: ['cupboard', 'hooks', 'tapestry', 'paint', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug'], max: 1 } });
    for (const id of ['chamber1', 'chamber2']) dn(id, { pool: ['cupboard', 'hooks', 'paint', 'tapestry', 'cabinet'], corner: ['broom', 'sacks'], mid: { kinds: ['rug', 'sacks'], max: 2 } });
    dn('loft', { pool: ['tapestry', 'hooks', 'cabinet', 'paint', 'shelf', 'cupboard'], corner: ['broom', 'cask', 'sacks'], mid: { kinds: ['rug', 'casks', 'sacks'], max: 3, min: 0.9 } });
    for (const id of ['cellar', 'vault']) dn(id, { pool: ['cask', 'shelf', 'sacks', 'stack', 'cask', 'cabinet', 'torch'], corner: ['cask', 'sacks', 'stack', 'broom'], mid: { kinds: ['casks', 'sacks', 'casks'], max: 4, min: 0.8 }, racks: 1, rackKinds: ['ham', 'herb', 'garlic', 'ham'] });
  }
  if (!hh) P.err.push('no hearth fits in the hall');
  for (const id of ['cellar', 'vault']) if (!P.lightIn[id]) pTorch(P, P.rooms[id], 'n', (P.rooms[id].in.x0 + P.rooms[id].in.x1) / 2 + 0.5, 1.7, 6.5) || pTorch(P, P.rooms[id], 's', (P.rooms[id].in.x0 + P.rooms[id].in.x1) / 2 + 0.5, 1.7, 6.5);
}

// Until every building has a designed plan, only those listed here use the plan engine in the published game: the generic plan gives every house the same hall
// (a shop without its counter, a smithy without its forge). ?plans=all or --opt plans=all builds every house from a plan (work in progress).
const PLAN_SHIP = { inn: 1, chapel: 1 };          // designed and dressed plans only (test/parity.mjs checks nothing the old interior offered is lost)
const PLAN_ALL = (TEST && TEST.plans === 'all') || (typeof location !== 'undefined' && /[?&]plans=all\b/.test(location.search));
function planWanted(site, spec) { return PLAN_ON && !(TEST && TEST.plans === 0) && !!site && (!TEST || TEST.cells !== 0) && (PLAN_ALL || !!PLAN_SHIP[site.id]); }


// ── the light budget (the engine lights a view with 6 points, 4 on low): at most TWO real lights per room, a hearth and one that serves night (lantern, torch, candle) and day (window)
// alike; every other candle, sconce and lamp keeps its emissive flame and glow sprite and is not in World.lights. [c3]
LIGHT_KINDS.dual = (l, e) => {
  const a = l.D.power(e), b = l.N.power(e), t = a + b, w = t > 1e-6 ? a / t : 0;
  for (let i = 0; i < 3; i++) l.c[i] = l.N.c[i] + (l.D.c[i] - l.N.c[i]) * w;
  return Math.max(a, b);
};
function pLightCut(P) {
  if (TEST && TEST.lightcut === 0) return;
  const T = P.T, ax = [T[0], T[1], T[2]], ay = [T[4], T[5], T[6]], az = [T[8], T[9], T[10]], o = [T[12], T[13], T[14]];
  const loc = p => { const d = [p[0] - o[0], p[1] - o[1], p[2] - o[2]]; return [d[0] * ax[0] + d[1] * ax[1] + d[2] * ax[2], d[0] * ay[0] + d[1] * ay[1] + d[2] * ay[2], d[0] * az[0] + d[1] * az[1] + d[2] * az[2]]; };
  const mine = World.lights.slice(P.lights0).filter(l => l.zone === P.zone), by = {}, keep = new Set(), made = [];
  for (const l of mine) {
    const q = loc(l.p); let k = Math.min(...Object.keys(P.lv).map(Number)); for (const kk in P.lv) if (P.lv[kk].y <= q[1] + 0.35 && P.lv[kk].y >= P.lv[k].y) k = +kk;
    let room = pRoomAt(P, k, q[0], q[2]);
    if (!room) { let bd = 1e9; for (const id in P.rooms) { const r = P.rooms[id]; if (r.k !== k) continue; const dx = Math.max(r.x0 - q[0], 0, q[0] - r.x1), dz = Math.max(r.z0 - q[2], 0, q[2] - r.z1), d = dx * dx + dz * dz; if (d < bd) { bd = d; room = r; } } }
    (by[room ? room.id : '-'] = by[room ? room.id : '-'] || []).push({ l, q, room });
  }
  P.lightCut = { before: mine.length, rooms: {} };
  for (const id in by) {
    const L = by[id], hearth = L.filter(x => x.l.kind === 'fire' && x.l.r >= 9).sort((a, b) => b.l.r - a.l.r)[0];
    const nights = L.filter(x => x !== hearth && x.l.kind !== 'daylight' && !(x.l.kind === 'fire' && x.l.r >= 9)), days = L.filter(x => x.l.kind === 'daylight');
    const rm = P.rooms[id], cx = rm ? (rm.x0 + rm.x1) / 2 : 0, cz = rm ? (rm.z0 + rm.z1) / 2 : 0, dc = x => Math.hypot(x.q[0] - cx, x.q[2] - cz);
    nights.sort((a, b) => (b.l.kind === 'lantern') - (a.l.kind === 'lantern') || (b.l.kind === 'fire') - (a.l.kind === 'fire') || b.l.r - a.l.r || dc(a) - dc(b));
    days.sort((a, b) => b.l.r - a.l.r || dc(a) - dc(b));
    const N = nights[0] && nights[0].l, D = days[0] && days[0].l;
    if (hearth) keep.add(hearth.l);
    if (N && D) { const big = !hearth && days.length >= 3 ? 1.5 : 1, d = Object.assign({}, N, { kind: 'dual', N: Object.assign({}, N, { c: N.c.map(v => v * big) }), D: Object.assign({}, D, { c: D.c.map(v => v * big) }), c: N.c.slice(), r: Math.max(N.r, D.r) * big }); /* many windows, no hearth (a shop): one stronger light */ const f = LIGHT_KINDS.dual; d.power = e => f(d, e); made.push(d); keep.add(d); }
    else if (N) { keep.add(N); if (!hearth && nights.length > 1) { const far = nights.slice(1).sort((a, b) => Math.hypot(b.q[0] - nights[0].q[0], b.q[2] - nights[0].q[2]) - Math.hypot(a.q[0] - nights[0].q[0], a.q[2] - nights[0].q[2]))[0]; if (far && Math.hypot(far.q[0] - nights[0].q[0], far.q[2] - nights[0].q[2]) > 4) keep.add(far.l); } }       // a cellar or crypt has no window: its two torches stand apart
    else if (D) keep.add(D);
    if (!hearth && !D && L.length > 3) for (const x of keep) if (L.some(y => y.l === x)) { x.r = Math.max(x.r, 8) * 1.55; x.c = x.c.map(v => v * 1.9); }          // a cellar or crypt that had a torch on every wall: the two that remain are stronger
    P.lightCut.rooms[id] = (hearth ? 1 : 0) + (N || D ? 1 : 0) + (N && !D && !hearth && keep.size ? 0 : 0);
  }
  for (let i = World.lights.length - 1; i >= P.lights0; i--) { const l = World.lights[i]; if (l.zone === P.zone && !keep.has(l)) World.lights.splice(i, 1); }
  for (const d of made) World.lights.push(d);
  P.lightCut.after = World.lights.filter(l => l.zone === P.zone).length;
}
function planBuild(c) {
  const dd = c.doors[0], site = c.site, m = c.int;
  const inw = [dd.ins[0] - dd.sill[0], 0, dd.ins[2] - dd.sill[2]], il = Math.hypot(inw[0], inw[2]) || 1; inw[0] /= il; inw[2] /= il;
  const T = m4.create(); m4.basis(T, [inw[2], 0, -inw[0]], [0, 1, 0], inw, [dd.sill[0], dd.sill[1], dd.sill[2]]);
  m.m = T.slice(); m.dirty = true;
  const P = planNew(c, T); P.yaw = Math.atan2(-inw[0], inw[2]); P.need = planNeeds(P.id); P.R = c.R; c.plan = P;
  const info = PLANS_INFO[P.id] || {};
  (PLANS[P.id] || planHouse)(P, c, info);
  pBuild(P); (P.pierCols || []).forEach(pierTrim);      // [fx3] the walls exist now
  // the zone: round the whole plan, so room AO, sound and light find it
  const W = P.dims ? P.dims.W : 9, D = P.dims ? P.dims.D : 10, zi = c.zoneInfo, ctr = P.w2(0, 0, D / 2);
  zi.site = Object.assign({}, c.site, { x: ctr[0], z: ctr[2], yaw: P.yaw }); zi.hw = W / 2; zi.hd = D / 2; zi.y0 = dd.sill[1] - 3.6; zi.y1 = dd.sill[1] + 7; zi.slope = 0; zi.H = H_GROUND;
  if (P.hearths && P.hearths[0]) { const h = P.hearths[0], hp = P.w2(h.x, 0, h.z); zi.hearth = [hp[0], hp[2], h.wid]; }
  if (P.c && P.c.int) pBase(P, P.c.int);          // [fx2] nothing drawn after the plan starts from a leaked transform
  // [inout] no second fill: every house is refitted and furnished room by room (no filler; the top-up stood a cabinet in a stair well)
  pSpotsClear(P);          // [fx2] nobody stands inside a counter, chair or cabinet
  pCullHidden(P, P.c.int);   // [fx2] faces against the wall, floor and ceiling that nobody sees
  pEnsure(P);      /* [inout] the invariants the schedules rely on: work, fire1 beside home, enough seats */
  // every spot a schedule wants: when the plan has no such place, the nearest thing it has
  const home = P.spots.home || P.spots.sit || Object.values(P.spots)[0];
  P.fallbacks = [];      /* [fin] spots the plan could not place: the interiors test lists them with the house id */
  for (const n of new Set([...P.need, 'fire1', 'stand2', 'guestbed', 'barfront', 'front', 'pew1', 'pew2', 'sit', 'bed2', 'home'])) if (!P.spots[n] && home) { pSpot(P, n, home.x, home.z, home.yaw, { k: home.k }); P.fallbacks.push(n + ([...P.need].includes(n) ? '*' : '')); }
  // what the old interior offered to read or buy: a book or note on the nearest table, the rope on the counter
  { const tab = P.items.find(i => i.k === 0 && i.kind === 'floor' && i.top > 0 && /table|counter|bar$|lectern/i.test(i.id)) || P.items.find(i => i.k === 0 && i.kind === 'floor' && i.top > 0), pos = tab ? [tab.cx, tab.top + 0.05, tab.cz] : [home ? home.x : 0, 1.0, home ? home.z : 1];
    for (const id in READS) if (id.startsWith(P.id + '.') && !World.interact.some(i => i.id === id)) pInteract(P, pos[0], pos[1] + 0.2, pos[2], Object.assign({ kind: 'read', id, r: 1.8 }, READS[id]), 0);
    if (P.id === 'store' && !World.interact.some(i => i.id === 'rope')) pInteract(P, pos[0], pos[1] + 0.2, pos[2], { kind: 'shopitem', id: 'rope', r: 1.6 }, 0); }
  { const fy = dd.sill[1]; c.cell.daylightFn = () => Player.pos[1] < fy - 1.0 ? 0 : undefined; }          // below the ground floor no daylight comes in
  pLightCut(P);
  if (typeof Bake !== 'undefined') Bake.interior(P);          // [l1] 72m_bake.js: contact pools under furniture, window data for the window light
  c.planDone = P; return P;
}
const PLANS_INFO = { store: { kind: 'shop' }, smithy: { kind: 'smith' }, elder: { kind: 'study' }, guardhouse: { kind: 'guard' },  inn: { inn: true, W: 14, D: 13, Dh: 8, H0: 3.2, up: true, flank: true, shellWins: true, cellarway: true } };
// the common room: a bar with stocked shelves and kegs behind it, long tables with benches and laid places, a rug by the hearth, banners, shields, sconces, lanterns
function dressInn(P, c, room, hh) {
  const R = P.R, a = room.in; P.hall = { room, hh };
  { const sc = P.stairs.find(q => q.id === 'stCellar'); if (sc && sc.highPt) P.clear.push({ x0: sc.highPt[0] - 0.65, x1: sc.highPt[0] + 0.65, z0: sc.highPt[1] - 0.6, z1: sc.highPt[1] + 3.6, k: 0, kind: 'path', room }); }      /* [fin] the way to the cellar stair head stays free 3.6 m out from it (the stairs test walks in from there) */
  { const sc = P.stairs.find(q => q.id === 'stCellar'); if (sc) {      /* [fin] the way down reads as a cellar stair from across the room: a lantern on a bracket at the stair head and a board with a chalked barrel mark beside it */
    const hx = sc.highPt ? sc.highPt[0] : a.x1 - 1.0, ux = Math.min(a.x1 - 0.6, Math.max(a.x0 + 0.6, hx));
    for (const du of [0, -0.4, 0.4, -0.8, 0.8, -1.2, 1.2]) if (pTorch(P, room, 'n', ux + du, 1.95, 7.5)) break;
    for (const du of [-1.15, -1.6, 0.9, -2.0, 1.3, -0.6, 0.5]) if (pHang(P, room, 'n', Math.min(a.x1 - 0.4, Math.max(a.x0 + 0.4, ux + du)), 0.6, 1.5, 2.05, m => { m.mat(MAT.METAL, COL.black); m.box(-0.2, 0.52, 0.0, 0.2, 0.55, 0.12); m.box(-0.2, 0.2, 0.0, -0.17, 0.55, 0.04); m.box(0.17, 0.2, 0.0, 0.2, 0.55, 0.04); m.mat(MAT.PLANKS, COL.woodDark); m.box(-0.26, 0.0, 0.04, 0.26, 0.36, 0.07); m.mat(MAT.PLAIN, [0.9, 0.86, 0.78]); m.box(-0.18, 0.165, 0.07, 0.18, 0.195, 0.078); m.box(-0.015, 0.04, 0.07, 0.015, 0.32, 0.078); m.box(-0.14, 0.06, 0.07, 0.14, 0.09, 0.078); m.box(-0.14, 0.27, 0.07, 0.14, 0.30, 0.078); }, P.id + '.cellarboard', {})) break;
  } }
  let bar = null;
  for (const [bl, bz] of [[3.8, 4.8], [3.0, 4.2], [2.4, 4.0]]) { const bz2 = Math.min(bz, a.z1 - bl / 2 - 0.3); bar = pPut(P, room, P.id + '.bar', a.x1 - 1.7, bz2, PI / 2, bl, 0.7, 1.05, m => { Props.table(m, bl, 0.7, 1.05); Props.clutter(m, R, -bl / 2 + 0.2, bl / 2 - 0.2, 1.05, 0, ['mug', 'mug', 'bottle', 'jug', 'plate', 'mug'], 7, c); }, { surface: true }); if (bar) break; }          // [fin] a shorter counter where the windows leave no 3.8 m run; [inout] the common room is 2 m shallower now the passage runs behind it
  if (bar) { pSpot(P, 'bar', bar.cx + 0.95, bar.cz, -PI / 2, { k: 0 }); pSpot(P, 'stand1', bar.cx - 0.8, bar.cz - 0.9, PI / 2, { k: 0 }); pSpot(P, 'stand2', bar.cx - 0.8, bar.cz + 0.6, PI / 2, { k: 0 });      /* [inout] the second drinker at the bar, not at the hearth */ P.bar = bar;
    pHang(P, room, 'e', bar.cz, 3.0, 1.45, 2.7, (m) => Props.shelf(m, 3.0, 1.2, 3, 0.3, (i, y) => Props.clutter(m, R, -1.3, 1.3, y, 0, ['bottle', 'bottle', 'mug', 'jug', 'bottle'], 6, c)), P.id + '.backshelf', {});
    for (let i = 0; i < 2; i++) { const kz = bar.cz - 0.6 + i * 1.2, win = P.windows.some(w => w.k === 0 && w.wall.ax === 'z' && Math.abs(w.wall.c - room.x1) < 0.01 && Math.abs(w.pos - kz) < 1.3); if (!win) pPut(P, room, P.id + '.keg' + i, a.x1 - 0.5, kz, 0, 0.9, 0.9, 1.0, PD.cask(0.9, 0.32), { lowOk: true }); else pAgainst(P, room, 's', P.id + '.keg' + i, 0.9, 0.9, 1.0, 0, PD.cask(0.9, 0.32), { at: a.x1 - 0.6 - i * 1.0, lowOk: true }); }          // [fin] two kegs behind the counter; [inout] against the passage wall where the shell has a window
    pLamp(P, room, bar.cx + 0.2, bar.cz); }
  let n = 0;
  let nTab = 0; for (const nr of [[-4.2, 3.65], [1.6, 3.65], [-4.6, 6.7], [-2.0, 6.2], [2.5, 6.6], [-0.5, 6.0], [3.4, 6.7]]) { if (nTab >= 3) break;          // [fin] two rows clear of the stairs and the cellar hole, the third by the west wall: the old spots left 0.2 m between the benches of two tables and no way to four of the seats
    const dn = pDining(P, room, 2.4, 0.9, { near: nr, id: 'table' + n, n: 4, items: ['mug', 'plate', 'bowl', 'candle', 'loaf', 'mug'], strictOnly: true });
    if (dn) { nTab++; for (const s of dn.seats) pSit(P, 's' + (++n), s[0], s[1], s[2], 0); pLamp(P, room, dn.x, dn.z); n = Math.max(n, 0); }
  }
  if (nTab < 3) for (const nr of [[-2.0, 6.2], [3.0, 6.4], [-4.4, 6.6], [0.5, 6.2]]) { const dn = pDining(P, room, 1.6, 0.8, { near: nr, id: 'table' + n, n: 3, items: ['mug', 'plate', 'bowl', 'candle'], strictOnly: true }); if (dn) { nTab++; for (const s of dn.seats) pSit(P, 's' + (++n), s[0], s[1], s[2], 0); pLamp(P, room, dn.x, dn.z); break; } }
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
    const t = pFree(P, room, id + '.counter', 2.6, 0.8, 1.0, 0, m => { Props.table(m, 2.6, 0.8, 1.0); Props.clutter(m, R, -1.1, 1.1, 1.0, 0, ['jug', 'bowl', 'cheese', 'loaf', 'pot', 'apple'], 5, c); }, { near: [-1.6, 2.4], surface: true, keeper: 0.8 });
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

// [inout] what every lived-in house keeps (coordinator, 2026-11-18; checked by test/interiors.js): a `work` place of its own, `fire1` beside `home` and not on it,
// and max(4, household) seats at distinct places. Added only where the plan has not made them; a stool is a real kit stool, sat on.
function pEnsure(P) {
  const sleepers = typeof castSleepers === 'function' ? castSleepers(P.id) : 0, house = /^(in|shop|high)\./.test(P.id) || ['weaver', 'mill', 'farm', 'hunter', 'fisher', 'draper', 'herbalist'].includes(P.id); if (!sleepers && !house) return;      /* a shop nobody sleeps in still seats four (the inspector's rule) */
  const ground = Object.values(P.rooms).filter(r => r.k === 0 && r.kind !== 'yard' && r.kind !== 'corridor').sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0));
  const main = (P.hall && P.hall.room && P.hall.room.k === 0) ? P.hall.room : ground[0]; if (!main) return;
  const hh = P.hall && P.hall.hh, rooms = [main].concat(ground.filter(r => r !== main), Object.values(P.rooms).filter(r => r.k === 1 && r.kind !== 'corridor'));      /* seats upstairs too when the ground floor is full (a stool by the bed in a loft) */
  const freeAt = (room, x, z, w) => pFit(P, room, rectOf(x, z, w, w), { h: 1.8, lowOk: true, noClear: true }) && !P.clear.some(q => q.k === room.k && (q.kind === 'stair' || q.kind === 'door') && rOv(rectOf(x, z, w, w), q, 0.01));      /* a person may stand on a path, not in a doorway or at a stair's end */
  if (!P.spots.home) for (const [x, z] of pCands(main, pCentre(main))) if (freeAt(main, x, z, 0.7)) { pSpot(P, 'home', x, z, 0, { k: main.k }); break; }      /* a house with no fire (the chapel): its people's place is the middle of its main room */
  const home = P.spots.home;
  const faceTo = (x, z, t) => Math.atan2(t[0] - x, -(t[1] - z));
  if (!P.spots.work) { const room = home ? (pRoomAt(P, home.k || 0, home.x, home.z) || main) : main, c0 = pCentre(room); for (const [x, z] of pCands(room, home ? [home.x + 1.2, home.z] : c0)) if ((!home || Math.hypot(x - home.x, z - home.z) >= 1.0) && freeAt(room, x, z, 0.7)) { pSpot(P, 'work', x, z, faceTo(x, z, c0), { k: room.k }); break; } }
  if (home && (!P.spots.fire1 || Math.hypot(P.spots.fire1.x - home.x, P.spots.fire1.z - home.z) < 0.5)) { const room = pRoomAt(P, home.k || 0, home.x, home.z) || main, tgt = hh ? [hh.px, hh.pz] : [home.x, home.z];
    let done = false; for (const r of [0.9, 1.2, 1.6, 2.0, 2.6, 3.2]) { for (let a = 0; a < 16 && !done; a++) { const x = home.x + Math.cos(a * PI / 8) * r, z = home.z + Math.sin(a * PI / 8) * r; const rm = pRoomAt(P, room.k, x, z); if (rm && freeAt(rm, x, z, 0.5)) { pSpot(P, 'fire1', x, z, faceTo(x, z, tgt), { k: room.k }); done = true; } } if (done) break; } }
  const seats = () => { const out = []; for (const n in P.spots) if (/^(sit|seat\d+)$/.test(n)) { const s = P.spots[n]; if (!out.some(o => (o.k || 0) === (s.k || 0) && Math.hypot(o.x - s.x, o.z - s.z) < 0.4)) out.push(s); } return out; };
  // a seat no 0.9 m way reaches (a bench between a table and a wall) is not one: its name goes to a stool where a way reaches
  let reach = pReach(P); const gone = []; for (const nm of Object.keys(P.spots)) if (/^(sit|seat\d+)$/.test(nm)) { const s = P.spots[nm]; if (!reach(s.k || 0, s.x, s.z, 0.65)) { gone.push(nm); delete P.spots[nm]; } }
  if (typeof pFlood === 'function') for (const room of Object.values(P.rooms)) { const f = pFlood(P, room, null); f.tg.forEach((t, i) => { if (f.hit[i] || t[2] !== 0.85) return; for (const nm of Object.keys(P.spots)) { const s = P.spots[nm]; if (/^(sit|seat\d+)$/.test(nm) && Math.abs(s.x - t[0]) < 1e-6 && Math.abs(s.z - t[1]) < 1e-6) { gone.push(nm); delete P.spots[nm]; } } }); }      /* and none the inspector's room check finds cut off */
  const want = Math.max(4, sleepers); let n = 1, guard = 0;
  const stoolDraw = m => kp(m, 'painted_wooden_stool', 0, 0, 0, 1, 0);
  while (seats().length < want && guard++ < 14) {
    let placed = null;
    for (const room of rooms) { if (placed) break; const tbl = P.items.find(it => it.k === room.k && /table|meal|long|desk/.test(it.id || '') && it.x0 >= room.x0 - 0.1 && it.x1 <= room.x1 + 0.1 && it.z0 >= room.z0 - 0.1 && it.z1 <= room.z1 + 0.1), near = tbl ? [(tbl.x0 + tbl.x1) / 2, (tbl.z0 + tbl.z1) / 2] : home && pRoomAt(P, 0, home.x, home.z) === room ? [home.x, home.z] : pCentre(room);
      const cut0 = typeof pFlood === 'function' ? pFlood(P, room, null).hit.filter(h => !h).length : 0;
      for (const [x, z] of pCands(room, near)) { if (Math.hypot(x - near[0], z - near[1]) > 6) break; if (!reach(room.k, x, z, 0.65) || seats().some(o => Math.hypot(o.x - x, o.z - z) < 0.45)) continue;
        if (typeof pFlood === 'function') { P.spots.__probe = { x, z, k: room.k, sit: 0.46 }; const f = pFlood(P, room, [{ x0: x - 0.21, x1: x + 0.21, z0: z - 0.21, z1: z + 0.21 }]), pi = f.tg.findIndex(t => Math.abs(t[0] - x) < 1e-6 && Math.abs(t[1] - z) < 1e-6); delete P.spots.__probe; if (pi < 0 || !f.hit[pi] || f.hit.filter(h => !h).length > cut0) continue; }      /* the inspector's way check (pFlood): the stool is reached and cuts no other way */
        const it = pPut(P, room, P.id + '.seatstool' + P.items.length, x, z, 0, 0.42, 0.42, 0.46, stoolDraw, { lowOk: true, allow: ['path'], noGuard: true });      /* on a room's way across only where the way check above says nothing is cut */ if (it) { placed = { it, near, room }; break; } } }
    if (!placed) break;
    const nm = gone.length ? gone.shift() : (() => { if (!P.spots.sit) return 'sit'; while (P.spots['seat' + n]) n++; return 'seat' + n; })();
    pSit(P, nm, placed.it.cx, placed.it.cz, faceTo(placed.it.cx, placed.it.cz, placed.near), placed.room.k); reach = pReach(P);
  }
}
