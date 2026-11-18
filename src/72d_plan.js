// ───────────────────────── plans: interiors laid out like an architect, then dressed like a set decorator ─────────────────────────
// A cell's interior is a PLAN, not a hollowed-out shell. Per level (cellar -1, ground 0, upper 1) there are rooms (rectangles on a 0.5 m grid, canonical frame:
// the entrance on the -z side), doorways between them, stairs between levels and windows on the walls that are outside walls in the plan. From that the
// walls (kit panels, 0.4 m thick, centred on the room edges), floors, ceilings, stairwell openings, colliders and the navigation graph follow. Furniture is placed
// by rules (footprints, wall bands, clear zones) and recorded; planValidate() checks the records (no overlaps, nothing in doors or on stairs, nothing floating,
// every room reachable). The canonical frame is turned and moved onto the cell's door by one matrix (T), so a door on any side works.
// Lengths are metres. Wall sides: 'n' = the z0 edge, 's' = z1, 'w' = x0, 'e' = x1 (room-relative: the wall a room has at that side).
const PLAN_ON = !(TEST && TEST.plans === 0);
const PW = { T: 0.4, IN: 0.2, SLAB: 0.25, DOOR: 1.1 };
const rectOf = (cx, cz, w, d) => ({ x0: cx - w / 2, z0: cz - d / 2, x1: cx + w / 2, z1: cz + d / 2 });
const rOv = (a, b, g) => { g = g || 0; return a.x0 < b.x1 - g && a.x1 > b.x0 + g && a.z0 < b.z1 - g && a.z1 > b.z0 + g; };
const rIn = (r, o) => r.x0 >= o.x0 - 1e-6 && r.x1 <= o.x1 + 1e-6 && r.z0 >= o.z0 - 1e-6 && r.z1 <= o.z1 + 1e-6;
const rGrow = (r, g) => ({ x0: r.x0 - g, z0: r.z0 - g, x1: r.x1 + g, z1: r.z1 + g });
const SIDES = { n: { ax: 'x', dz: -1 }, s: { ax: 'x', dz: 1 }, w: { ax: 'z', dx: -1 }, e: { ax: 'z', dx: 1 } };
const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
// rotation (about y, as in at()) that puts an item's back (local -z when back = -1, +z when back = +1) against the wall on this side of its room
const rotBack = (side, back) => ({ n: 0, s: PI, w: PI / 2, e: -PI / 2 }[side] + (back > 0 ? PI : 0));

function planNew(c, T) {
  const P = { c, zone: c.zone, R: c.R, T, id: c.site.id, lv: {}, rooms: {}, doors: [], stairs: [], walls: [], windows: [], items: [], wallItems: [], clear: [], holes: [], spots: {}, lights: 0, err: [], lightIn: {}, lights0: World.lights.length };
  P.MS = new THREE.Matrix4().fromArray(T);
  P.w2 = (x, y, z) => m4.tp(T, [x, y, z]);                      // canonical -> world
  P.yaw = c.planYaw || 0;                                     // canonical yaw -> world yaw: add this
  P.occ = (k, r, kind, id, extra) => pOcc(P, k, r, kind, id, extra);
  return P;
}
// a level: k (-1, 0, 1), y = floor height above the entrance floor, H = clear height to the ceiling slab
function pLevel(P, k, y, H, o) { P.lv[k] = Object.assign({ k, y, H, rooms: [], items: [] }, o || {}); return P.lv[k]; }
function pRoom(P, k, id, kind, x0, z0, x1, z1, o) {
  const r = Object.assign({ id, kind, k, x0, z0, x1, z1, floor: 'wood', win: true, doors: [] }, o || {}), L = P.lv[k];
  if ([x0, z0, x1, z1].some(v => Math.abs(v * 2 - Math.round(v * 2)) > 1e-6)) P.err.push('room ' + id + ' off the 0.5 m grid');
  r.in = { x0: x0 + PW.IN, z0: z0 + PW.IN, x1: x1 - PW.IN, z1: z1 - PW.IN };
  L.rooms.push(r); P.rooms[id] = r; return r;
}
// a doorway on the wall between rooms a and b (b = null: outside) at the point (x, z) on their shared edge; w = clear width
function pDoor(P, a, b, x, z, o) { const d = Object.assign({ a, b, x, z, w: PW.DOOR, k: P.rooms[a].k, frame: true }, o || {}); P.doors.push(d); return d; }

// ── layout: walls from room edges, windows, clear zones, stairwell holes ──
function pLayout(P) {
  for (const k in P.lv) {
    const L = P.lv[k], lines = {};
    const unit = (ax, c, i) => { const key = ax + c, a = lines[key] || (lines[key] = { ax, c, u: new Map() }); let u = a.u.get(i); if (!u) a.u.set(i, u = {}); return u; };
    for (const r of L.rooms) {
      for (let i = r.z0 * 2; i < r.z1 * 2; i++) { unit('z', r.x0, i).plus = r; unit('z', r.x1, i).minus = r; }       // walls running along z at x = x0 / x1
      for (let i = r.x0 * 2; i < r.x1 * 2; i++) { unit('x', r.z0, i).plus = r; unit('x', r.z1, i).minus = r; }       // walls running along x at z = z0 / z1
    }
    for (const key in lines) {
      const ln = lines[key], idx = [...ln.u.keys()].sort((a, b) => a - b); let cur = null;
      const prio = r => r.kind === 'hall' || r.kind === 'common' || r.kind === 'nave' || r.kind === 'shop' || r.kind === 'corridor' ? 0 : 1;
      for (const i of idx) {
        const u = ln.u.get(i), ext = !(u.plus && u.minus), ns = ext ? (u.plus ? -1 : 1) : (prio(u.minus) <= prio(u.plus) ? -1 : 1);       // n points to the empty side (outside) / the lesser room
        if (cur && cur.b === i / 2 && cur.ext === ext && cur.ns === ns && cur.cellar === (L.k < 0)) { cur.b = (i + 1) / 2; if (u.plus) cur.rooms.add(u.plus.id); if (u.minus) cur.rooms.add(u.minus.id); continue; }
        cur = { k: L.k, ax: ln.ax, c: ln.c, a: i / 2, b: (i + 1) / 2, ext, ns, cellar: L.k < 0, rooms: new Set([u.plus && u.plus.id, u.minus && u.minus.id].filter(Boolean)), open: [] };
        P.walls.push(cur);
      }
    }
  }
  // doorways -> openings on the wall that carries them
  for (const d of P.doors) {
    const wl = P.walls.find(w => w.k === d.k && (w.ax === 'x' ? Math.abs(w.c - d.z) < 0.01 && d.x > w.a - 1e-6 && d.x < w.b + 1e-6 : Math.abs(w.c - d.x) < 0.01 && d.z > w.a - 1e-6 && d.z < w.b + 1e-6) && (d.b === null ? w.ext : (w.rooms.has(d.a) && w.rooms.has(d.b))));
    if (!wl) { P.err.push('door ' + d.a + '/' + d.b + ' at ' + d.x + ',' + d.z + ' is on no wall'); continue; }
    d.wall = wl; d.pos = wl.ax === 'x' ? d.x : d.z; wl.open.push({ type: 'door', pos: d.pos, hw: d.w / 2, d });
    d.side = wl.ax === 'x' ? 'x' : 'z';
    for (const id of [d.a, d.b]) if (id) P.rooms[id].doors.push(d);
  }
  // windows on outside walls (levels at or above the ground; the cellar gets high slits only)
  const WIN0 = ['Wide_Flat', 'Thin_Round', 'Wide_Round'];
  /* [inout] P.wins: the windows the shell shows, and no others: [{ k, face: 'front'|'back'|'left'|'right', pos, kind }], pos in the plan's own x (front, back) or z (left, right) */
  if (P.wins) for (const w of P.wins) {
    const face = wl => wl.ax === 'x' ? (wl.ns < 0 ? 'front' : 'back') : (wl.ns < 0 ? 'left' : 'right');
    const wl = P.walls.find(q => q.ext && q.k === w.k && face(q) === w.face && w.pos - 0.8 >= q.a - 1e-6 && w.pos + 0.8 <= q.b + 1e-6);
    if (!wl) { P.err.push('window ' + w.face + ' L' + w.k + ' at ' + w.pos + ' is on no outside wall'); continue; }
    if (wl.open.some(o => Math.abs(o.pos - w.pos) < o.hw + 0.95)) { let np = null; for (const dp of [0.25, -0.25, 0.5, -0.5, 0.6, -0.6]) { const q = w.pos + dp; if (q - 0.8 >= wl.a - 1e-6 && q + 0.8 <= wl.b + 1e-6 && !wl.open.some(o => Math.abs(o.pos - q) < o.hw + 0.95)) { np = q; break; } } if (np === null) { (P.winClash = P.winClash || []).push(w); continue; } w.pos = np; }      /* [inout] two windows the shell draws close: the second moves along the wall up to 0.6 m (the outside draws them 1.5 m apart, the plan needs 1.75) */      /* two openings the shell draws too close to stand at both: one inside, the clash reported (test/inout.js) */
    const room = [...wl.rooms].map(id => P.rooms[id]).find(r => wl.ax === 'x' ? w.pos >= r.x0 && w.pos <= r.x1 : w.pos >= r.z0 && w.pos <= r.z1);
    const gl = room && room.glass ? room.glass[P.windows.length % room.glass.length] : null; wl.open.push({ type: 'win', pos: w.pos, hw: 0.8, kind: w.kind || 'Wide_Flat', glass: gl }); P.windows.push({ wall: wl, pos: w.pos, kind: w.kind || 'Wide_Flat', k: wl.k, room });
  }
  for (const wl of P.walls) {
    if (P.wins || !wl.ext || wl.k < 0) continue;
    for (const rid of wl.rooms) {
      const room = P.rooms[rid]; if (!room || room.win === false || (room.skipWin && room.skipWin.includes(wl.ax + wl.c))) continue;       /* [c3] skipWin: ['x9'] leaves that wall without windows (a bed corner) */
      const lo = Math.max(wl.a, wl.ax === 'x' ? room.x0 : room.z0), hi = Math.min(wl.b, wl.ax === 'x' ? room.x1 : room.z1), L = hi - lo;
      if (L < 2.8) continue;
      const n = Math.max(1, Math.floor(L / 3.0)), pitch = L / n;
      for (let i = 0; i < n; i++) {
        const p = Math.round((lo + pitch * (i + 0.5)) * 2) / 2;
        if (wl.open.some(o => Math.abs(o.pos - p) < o.hw + 1.45) || p - 0.8 < lo + 0.3 || p + 0.8 > hi - 0.3) continue;
        const WIN = room.winKinds || WIN0, kind = WIN[Math.abs(Math.round(wl.c * 3 + p * 7)) % WIN.length], o = { type: 'win', pos: p, hw: 0.8, kind, glass: room.glass ? room.glass[P.windows.length % room.glass.length] : null };
        wl.open.push(o); P.windows.push({ wall: wl, pos: p, kind, k: wl.k, room });
      }
    }
  }
  // the stairs: holes in the level above and clear zones at both ends
  for (const s of P.stairs) pStairGeom(P, s);
  // the way people need: clear zones round every doorway (both sides) and between the doors of a room
  for (const d of P.doors) {
    const wl = d.wall; if (!wl) continue;
    const z = wl.ax === 'x' ? { x0: d.x - 0.75, x1: d.x + 0.75, z0: d.z - 0.95, z1: d.z + 0.95 } : { x0: d.x - 0.95, x1: d.x + 0.95, z0: d.z - 0.75, z1: d.z + 0.75 };
    P.clear.push(Object.assign(z, { k: d.k, kind: 'door', ref: d }));
  }
  for (const id in P.rooms) {
    const r = P.rooms[id], cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, pts = r.doors.filter(d => d.wall).map(d => d.wall.ax === 'x' ? [d.x, d.z + (cz > d.z ? 1 : -1) * Math.min(1.9, Math.abs(cz - d.z))] : [d.x + (cx > d.x ? 1 : -1) * Math.min(1.9, Math.abs(cx - d.x)), d.z]);
    for (const s of P.stairs) { if (s.k0 === r.k && rOv(s.low, rGrow(r, 0.1))) { const q = s.lowPt.slice(); q.stair = 1; pts.push(q); } if (s.k1 === r.k && rOv(s.high, rGrow(r, 0.1))) { const q = s.highPt.slice(); q.stair = 1; pts.push(q); } }
    r.pts = pts;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j]; if (a.stair && b.stair) continue; const x0 = Math.min(a[0], b[0]) - 0.45, x1 = Math.max(a[0], b[0]) + 0.45, z0 = Math.min(a[1], b[1]) - 0.45, z1 = Math.max(a[1], b[1]) + 0.45;
      // an L or diagonal path: the bend is at whichever end lies nearer the middle of the room
      const dx = Math.abs(a[0] - b[0]), dz = Math.abs(a[1] - b[1]);
      if (dx < 0.01 || dz < 0.01) P.clear.push({ x0, x1, z0, z1, k: r.k, kind: 'path', room: r });
      else {
        const zc = Math.abs(a[1] - cz) < Math.abs(b[1] - cz) ? a[1] : b[1], q = (x0_, x1_, z0_, z1_) => P.clear.push({ x0: x0_, x1: x1_, z0: z0_, z1: z1_, k: r.k, kind: 'path', room: r });
        q(Math.min(a[0], b[0]) - 0.45, Math.max(a[0], b[0]) + 0.45, zc - 0.45, zc + 0.45); q(a[0] - 0.45, a[0] + 0.45, Math.min(a[1], zc) - 0.45, Math.max(a[1], zc) + 0.45); q(b[0] - 0.45, b[0] + 0.45, Math.min(b[1], zc) - 0.45, Math.max(b[1], zc) + 0.45);
      }
    }
  }
}

// ── stairs ──
// s: { id, k0, k1, axis: 'x'|'z', dir: +1|-1, x, z (centre of the low end), width, name }: climbs from level k0 to k1 along the axis in the given direction
function pStair(P, s) {
  const a = P.lv[s.k0], b = P.lv[s.k1]; s.rise = b.y - a.y; s.width = s.width || 1.0; s.n = Math.ceil(s.rise / 0.19); s.tread = s.tread || 0.27; s.run = s.n * s.tread;
  P.stairs.push(s); return s;
}
function pStairGeom(P, s) {
  const hw = s.width / 2 + 0.05, ax = s.axis, d = s.dir, p0 = ax === 'x' ? s.x : s.z, p1 = p0 + d * s.run, lat = ax === 'x' ? s.z : s.x;
  const rect = (a, b, la, lb) => ax === 'x' ? { x0: Math.min(a, b), x1: Math.max(a, b), z0: la, z1: lb } : { x0: la, x1: lb, z0: Math.min(a, b), z1: Math.max(a, b) };
  s.p0 = p0; s.p1 = p1; s.lat = lat; s.hw = hw;
  s.low = rect(p0, p1, lat - hw, lat + hw); s.high = s.low;
  s.hole = rect(p0 - d * (0.8 + (s.holeX || 0)), p1, lat - hw - 0.1, lat + hw + 0.1);      /* [inout] holeX: a longer well over the foot of a steep stair, so a jump down it clears the slab */        // the opening in the slab of the level above: the whole run
  s.lowPt = ax === 'x' ? [p0 - d * 0.7, lat] : [lat, p0 - d * 0.7];       // where one stands to start up
  s.highPt = ax === 'x' ? [p1 + d * 0.8, lat] : [lat, p1 + d * 0.8];      // where one stands when arrived
  P.holes.push({ k: s.k1, r: s.hole, stair: s });
  P.clear.push(Object.assign(rect(p0 - d * 1.3, p0, lat - hw - 0.1, lat + hw + 0.1), { k: s.k0, kind: 'stair' }), Object.assign(rect(p1, p1 + d * 1.3, lat - hw - 0.1, lat + hw + 0.1), { k: s.k1, kind: 'stair' }));
  P.occ(s.k0, rect(p0, p1, lat - hw - 0.08, lat + hw + 0.08), 'stair', s.id);            // the steps and stringers on the lower level
  P.occ(s.k1, s.hole, 'hole', s.id);            // and the opening above them
}

// ── occupancy and placement ──
const P_SOLID = { floor: 1, stair: 1, hole: 1, hearth: 1, post: 1 };
function pOcc(P, k, r, kind, id, extra) { const it = Object.assign({ k, x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1, kind, id }, extra || {}); P.items.push(it); return it; }
// can a rectangle (with a height) stand here? inside the room, off every other solid thing, out of the clear zones (door approaches, paths, stair ends) and, when tall, out of the way of windows
function pFit(P, room, r, o) {
  o = o || {}; const k = room.k, h = o.h || 0.5;
  if (!rIn(r, room.in)) return false;
  for (const it of P.items) if (it.k === k && P_SOLID[it.kind] && rOv(r, it, 0.015)) return false;
  if (!o.noClear) for (const z of P.clear) if (z.k === k && rOv(r, z, 0.01) && !(o.allow && o.allow.includes(z.kind))) return false;
  if (h > 0.85 && !o.lowOk) for (const w of P.windows) if (w.k === k && w.room === room) { const z = pWinZone(w); if (rOv(r, z, 0.01)) return false; }
  return true;
}
// [fin] a 0.9 m way (0.45 m clear of every solid item, 0.3 m of the walls) from the room's first door to the other doors, the stair feet, the hearth front and every seat of the room.
// pFlood floods the room's floor on a 0.2 m grid with the extra rectangles standing in it; pGuardOk says a new solid item cuts none of them off that were reachable before.
function pFlood(P, room, extra) {
  const a = room.in, k = room.k, HW = 0.45, st = 0.2, nx = Math.ceil((a.x1 - a.x0) / st) + 1, nz = Math.ceil((a.z1 - a.z0) / st) + 1;
  const ds = P.doors.filter(d => d.k === k && (d.a === room.id || d.b === room.id)).map(d => [Math.min(a.x1 - 0.3, Math.max(a.x0 + 0.3, d.x)), Math.min(a.z1 - 0.3, Math.max(a.z0 + 0.3, d.z))]);
  const tg = ds.slice(1).map(p => [p[0], p[1], 0.5]);
  for (const s of P.stairs) { const pt = s.k0 === k && rOv(s.low, rGrow(a, 0.1)) ? s.lowPt : s.k1 === k && rOv(s.high, rGrow(a, 0.1)) ? s.highPt : null; if (pt) tg.push([pt[0], pt[1], 1.2]); }
  const hh = P.hall && P.hall.room === room && P.hall.hh; if (hh && hh.front) tg.push([hh.front[0], hh.front[1], 0.5]);
  for (const n in P.spots) { const sp = P.spots[n]; if (sp.k === k && (sp.sit || /^(sit|seat\d)$/.test(n)) && sp.x > a.x0 && sp.x < a.x1 && sp.z > a.z0 && sp.z < a.z1) tg.push([sp.x, sp.z, 0.85]); }
  if (!ds.length) return { tg, hit: tg.map(() => true) };
  const obs = P.items.filter(i => i.k === k && P_SOLID[i.kind] && (i.kind !== 'floor' || i.h === undefined || i.h > 0.25)).concat(extra || []);
  const free = (x, z) => { if (x < a.x0 + 0.45 || x > a.x1 - 0.45 || z < a.z0 + 0.45 || z > a.z1 - 0.45) return false; for (const o of obs) { const dx = Math.max(o.x0 - x, 0, x - o.x1), dz = Math.max(o.z0 - z, 0, z - o.z1); if (dx * dx + dz * dz < HW * HW) return false; } return true; };
  const seen = new Uint8Array(nx * nz), q = [];
  const put = (i, j) => { if (i < 0 || j < 0 || i >= nx || j >= nz || seen[i * nz + j]) return; if (!free(a.x0 + i * st, a.z0 + j * st)) return; seen[i * nz + j] = 1; q.push(i, j); };
  { const i0 = Math.round((ds[0][0] - a.x0) / st), j0 = Math.round((ds[0][1] - a.z0) / st); for (let r = 0; r <= 4; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) put(i0 + di, j0 + dj); }
  for (let h = 0; h < q.length; h += 2) { const i = q[h], j = q[h + 1]; put(i + 1, j); put(i - 1, j); put(i, j + 1); put(i, j - 1); }
  const near = (x, z, r) => { const n = Math.ceil(r / st), i0 = Math.round((x - a.x0) / st), j0 = Math.round((z - a.z0) / st); for (let di = -n; di <= n; di++) for (let dj = -n; dj <= n; dj++) { const i = i0 + di, j = j0 + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && seen[i * nz + j] && Math.hypot(di, dj) * st <= r) return true; } return false; };
  return { tg, hit: tg.map(t => near(t[0], t[1], t[2])) };
}
function pGuardOk(P, room, r) {
  if (P._noGuard) return true;
  const key = room.id + '|' + P.items.length + '|' + Object.keys(P.spots).length + '|' + P.doors.length + '|' + P.stairs.length;
  if (!P._gb || P._gb.key !== key) P._gb = { key, f: pFlood(P, room, null) };
  const af = pFlood(P, room, [r]);
  for (let i = 0; i < P._gb.f.hit.length; i++) if (P._gb.f.hit[i] && !af.hit[i]) return false;
  return true;
}
// the floor in front of a window that tall furniture must leave free
function pWinZone(w) {
  const wl = w.wall, ns = wl.ns, depth = 0.55, hw = 0.95;
  return wl.ax === 'x' ? { x0: w.pos - hw, x1: w.pos + hw, z0: ns < 0 ? wl.c - 0.2 : wl.c - 0.2 - depth, z1: ns < 0 ? wl.c + 0.2 + depth : wl.c + 0.2 } : { x0: ns < 0 ? wl.c - 0.2 : wl.c - 0.2 - depth, x1: ns < 0 ? wl.c + 0.2 + depth : wl.c + 0.2, z0: w.pos - hw, z1: w.pos + hw };
}
// the footprint of a w x d item (w along x, d along z before turning) turned by rot (a multiple of PI/2)
function pFoot(cx, cz, w, d, rot) { const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot)); return rectOf(cx, cz, w * c + d * s, w * s + d * c); }          // [fx2] honest for any turn: a crate turned 0.4 rad is wider than its square
// [fx2] MEASURED PLACEMENT. An item is drawn first and measured (every vertex it made and every kit piece's box, in the plan's frame); only then is it kept.
// Its recorded footprint is what it really occupies (not the w x d its caller guessed). When the measured thing pokes through its room's walls, through a solid
// that is already there, into a doorway or stair clearance, or (when tall) across a window, it is undone (mesh, kit pieces, colliders, lights, emitters) and the
// caller tries the next place. So no generator can put a footprint lie into the world: a flaw of this kind disappears from all interiors at once.
let P_REC = null;
const pRecBegin = defer => (P_REC = { parts: [], defer: !!defer, pend: [], c0: World.colliders.length });
const pRecEnd = (rc, m, t0) => { if (!rc) return; rc.t0 = t0; rc.t1 = m.ni; P_REC = null; };
const P_ROUND = /^(Barrel|wine_barrel|wooden_barrels|Vase|ceramic|Cauldron|Stool|painted_wooden_stool|Candle|CandleStick|brass_candle|wooden_candlestick|Bucket|wooden_bucket|Mug|Anvil)/;
function pToLocal(P) { if (P._tl) return P._tl; const T = P.T, ax = [T[0], T[1], T[2]], ay = [T[4], T[5], T[6]], az = [T[8], T[9], T[10]], o = [T[12], T[13], T[14]]; return P._tl = (x, y, z) => { const dx = x - o[0], dy = y - o[1], dz = z - o[2]; return [dx * ax[0] + dy * ax[1] + dz * ax[2], dx * ay[0] + dy * ay[1] + dz * ay[2], dx * az[0] + dy * az[1] + dz * az[2]]; }; }
// the box (plan frame) of what was drawn since rec began: { min, max } or null
function pMeasure(P, m, rc) {
  const to = pToLocal(P), min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9], g = p => { for (let k = 0; k < 3; k++) { if (p[k] < min[k]) min[k] = p[k]; if (p[k] > max[k]) max[k] = p[k]; } }; let any = false;
  const f = m.f, idx = m.idx, seen = new Set();
  for (let i = rc.t0; i < rc.t1; i++) { const v = idx[i]; if (seen.has(v)) continue; seen.add(v); g(to(f[v * 8], f[v * 8 + 1], f[v * 8 + 2])); any = true; }
  for (const pt of rc.parts) {
    const pc = Kit.pieces[pt.name]; if (!pc) continue; const M = pt.M;
    if (P_ROUND.test(pt.name)) { const e = M.elements, ex = Math.hypot(e[0], e[1], e[2]) * (pc.max[0] - pc.min[0]), ez = Math.hypot(e[8], e[9], e[10]) * (pc.max[2] - pc.min[2]), r = Math.max(ex, ez) / 2, h = Math.hypot(e[4], e[5], e[6]) * (pc.max[1] - pc.min[1]) / 2, v = new THREE.Vector3((pc.min[0] + pc.max[0]) / 2, (pc.min[1] + pc.max[1]) / 2, (pc.min[2] + pc.max[2]) / 2).applyMatrix4(M), w = to(v.x, v.y, v.z); g([w[0] - r, w[1] - h, w[2] - r]); g([w[0] + r, w[1] + h, w[2] + r]); any = true; continue; }
    const q = Kit.box(pt.name, M); if (!q) continue; for (let i = 0; i < 8; i++) g(to(i & 1 ? q.max[0] : q.min[0], i & 2 ? q.max[1] : q.min[1], i & 4 ? q.max[2] : q.min[2])); any = true;
  }
  const res = any ? { min, max } : null;
  if (res && rc.c0 !== undefined) {          // [fx2] the colliders the draw added: where a person is stopped must not lie in a wall either
    const cmin = [1e9, 1e9], cmax = [-1e9, -1e9]; let nc = 0;
    for (let i = rc.c0; i < World.colliders.length; i++) {
      const c = World.colliders[i]; if (!isFinite(c.x) || (c.y1 - c.y0) < 0.2) continue; nc++;
      const pts = c.r !== undefined ? [[c.r, 0, 0], [-c.r, 0, 0], [0, 0, c.r], [0, 0, -c.r]] : [[c.hx, 0, c.hz], [-c.hx, 0, c.hz], [c.hx, 0, -c.hz], [-c.hx, 0, -c.hz]];
      for (const q of pts) { const w = c.r !== undefined ? [c.x + q[0], c.y0, c.z + q[2]] : [c.x + q[0] * c.ax + q[2] * c.bx, c.y0, c.z + q[0] * c.az + q[2] * c.bz], l = to(w[0], w[1], w[2]); if (l[0] < cmin[0]) cmin[0] = l[0]; if (l[0] > cmax[0]) cmax[0] = l[0]; if (l[2] < cmin[1]) cmin[1] = l[2]; if (l[2] > cmax[1]) cmax[1] = l[2]; }
    }
    if (nc) res.cb = { min: cmin, max: cmax };
  }
  return res;
}
// everything an undone draw must give back
function pSnap(P, m) { const W = World; return { nv: m.nv, ni: m.ni, own: (m.own || []).length, col: W.colliders.length, flr: W.floors.length, lit: W.lights.length, emi: W.emitters.length, ixn: W.interact.length, lc: Object.assign({}, KITP.lc), seed: m.seed, st: m.st.length, mm: m.m.slice() }; }
// [fx2] a draw that pushes and never pops would shift everything drawn after it (a floor item 0.15 m up): put the transform back and say which draw it was
function pBase(P, m) { if (!P.base) P.base = { st: m.st.length, mm: m.m.slice() }; else if (m.st.length !== P.base.st || m.m[12] !== P.base.mm[12] || m.m[13] !== P.base.mm[13] || m.m[14] !== P.base.mm[14]) { (P.leaks = P.leaks || []).push('between draws'); m.st.length = P.base.st; m.m = P.base.mm.slice(); m.dirty = true; } }
function pFixStack(P, m, sn, name) { if (m.st.length !== sn.st || m.m[13] !== sn.mm[13] || m.m[12] !== sn.mm[12] || m.m[14] !== sn.mm[14]) { (P.leaks = P.leaks || []).push(name); m.st.length = sn.st; m.m = sn.mm.slice(); m.dirty = true; } }
function pUndo(P, m, sn) { const W = World; m.nv = sn.nv; m.ni = sn.ni; if (m.own) m.own.length = sn.own; W.colliders.length = sn.col; W.floors.length = sn.flr; W.lights.length = sn.lit; W.emitters.length = sn.emi; W.interact.length = sn.ixn; KITP.lc = sn.lc; }
function pCommitKit(m, rc) { const z = m.m1; for (const [mm, pp, ex] of rc.pend) kaddNow(mm, pp, ex); m.m1 = z; rc.pend.length = 0; }

// [fx2] faces nobody can see: the bottom of a thing standing on the floor, the top of a thing against the ceiling and the back of a thing against a wall lie on the plane they touch (within 12 mm)
// and face into it. They are only coplanar duplicates of the wall, floor and ceiling (z-fighting in motion, wasted triangles). Dropped from the index list after the plan is drawn; the
// ranges that the plan recorded move with the compaction.
function pCullHidden(P, m) {
  if (TEST && TEST.nocull) return 0;
  const to = pToLocal(P), f = m.f, idx = m.idx, ni = m.ni, drop = new Uint8Array(Math.ceil(ni / 3)), E = 0.012; let n = 0;
  const recs = []; for (const it of P.items) if (it.rec && it.kind !== 'rug') recs.push([it.rec, P.rooms[it.room]]); for (const w of P.wallItems) if (w.rec) recs.push([w.rec, P.rooms[w.room]]);
  for (const [rc, room] of recs) {
    if (!room) continue; const a = room.in, L = P.lv[room.k], y0 = L.y, y1 = L.y + L.H;
    for (let i = rc.t0; i + 2 < rc.t1; i += 3) {
      const v = [0, 1, 2].map(j => { const k = idx[i + j]; return to(f[k * 8], f[k * 8 + 1], f[k * 8 + 2]); }), u = [v[1][0] - v[0][0], v[1][1] - v[0][1], v[1][2] - v[0][2]], w = [v[2][0] - v[0][0], v[2][1] - v[0][1], v[2][2] - v[0][2]];
      let nx = u[1] * w[2] - u[2] * w[1], ny = u[2] * w[0] - u[0] * w[2], nz = u[0] * w[1] - u[1] * w[0]; const nl = Math.hypot(nx, ny, nz); if (nl < 1e-9) continue; nx /= nl; ny /= nl; nz /= nl;
      const all = (ax, c) => v[0][ax] > c - E && v[0][ax] < c + E && v[1][ax] > c - E && v[1][ax] < c + E && v[2][ax] > c - E && v[2][ax] < c + E;
      let hid = false;
      if (ny < -0.95 && all(1, y0 + 0.02)) hid = true; else if (ny < -0.95 && all(1, y0)) hid = true; else if (ny > 0.95 && all(1, y1)) hid = true;
      else if (nx < -0.95 && all(0, a.x0)) hid = true; else if (nx > 0.95 && all(0, a.x1)) hid = true; else if (nz < -0.95 && all(2, a.z0)) hid = true; else if (nz > 0.95 && all(2, a.z1)) hid = true;
      if (hid) { drop[i / 3] = 1; n++; }
    }
  }
  if (!n) return 0;
  const map = new Int32Array(ni + 1); let w = 0;
  for (let i = 0; i < ni; i += 3) { map[i] = w; if (!drop[i / 3]) { idx[w++] = idx[i]; idx[w++] = idx[i + 1]; idx[w++] = idx[i + 2]; } }
  map[ni] = w; const mp = i => map[Math.min(i, ni)];
  for (const [rc] of recs) { rc.t0 = mp(rc.t0); rc.t1 = mp(rc.t1); }
  if (m.own) for (const o of m.own) { o[0] = mp(o[0]); o[1] = mp(o[1]); }
  m.ni = w; P.culled = n; return n;
}
// does the measured box b (plan frame, level k) sit on the floor of room without going through anything? returns '' or why not
function pBoxOK(P, room, b, o, flat) {
  const k = room.k, a = room.in, L = P.lv[k], tol = 0.02;
  if (b.min[0] < a.x0 - tol || b.max[0] > a.x1 + tol || b.min[2] < a.z0 - tol || b.max[2] > a.z1 + tol) return 'wall';
  if (b.cb && (b.cb.min[0] < a.x0 - 0.04 || b.cb.max[0] > a.x1 + 0.04 || b.cb.min[1] < a.z0 - 0.04 || b.cb.max[1] > a.z1 + 0.04)) return 'wall collider';
  if (b.max[1] > L.y + L.H + 0.02 && !o.tall) return 'ceiling';
  if (flat) { for (const it of P.items) if (it.k === k && it.kind === 'rug') { const ib = it.bx ? { x0: it.bx.min[0], x1: it.bx.max[0], z0: it.bx.min[2], z1: it.bx.max[2] } : it; if (Math.min(b.max[0], ib.x1) - Math.max(b.min[0], ib.x0) > -0.4 && Math.min(b.max[2], ib.z1) - Math.max(b.min[2], ib.z0) > -0.4) return 'rug ' + it.id; } return ''; }          // [fx2] two rugs do not lie on each other
  const r = { x0: b.min[0], x1: b.max[0], z0: b.min[2], z1: b.max[2] }, lifted = (o.lift || 0) > 0.1;
  for (const nm in P.spots) { const sp = P.spots[nm]; if (sp.k === k && /^counter/.test(nm) && sp.x > r.x0 - 0.05 && sp.x < r.x1 + 0.05 && sp.z > r.z0 - 0.05 && sp.z < r.z1 + 0.05) return 'stands on spot ' + nm; }          // [fx2] a keeper's place is not given to a bench
  if (!lifted) for (const it of P.items) {
    if (it.k !== k || !P_SOLID[it.kind]) continue; const ib = it.bx;
    if (ib && it.kind !== 'stair' && it.kind !== 'hole') { const ox = Math.min(b.max[0], ib.max[0]) - Math.max(b.min[0], ib.min[0]), oz = Math.min(b.max[2], ib.max[2]) - Math.max(b.min[2], ib.min[2]), oy = Math.min(b.max[1], ib.max[1]) - Math.max(b.min[1], ib.min[1]); if (ox > 0.02 && oz > 0.02 && !(o.allow && o.allow.includes(it.kind))) return 'item ' + it.id; }
    if (ib && ib.cb && b.cb && it.kind === 'floor' && !(o.allow && o.allow.includes(it.kind)) && Math.min(b.cb.max[0], ib.cb.max[0]) - Math.max(b.cb.min[0], ib.cb.min[0]) > 0.06 && Math.min(b.cb.max[1], ib.cb.max[1]) - Math.max(b.cb.min[1], ib.cb.min[1]) > 0.06) return 'collider ' + it.id;   // [fx2] where people are stopped
    else if (rOv(r, it, 0.02) && !(it.kind === 'hearth' && o.allow && o.allow.includes('hearth'))) return 'item ' + it.id;
  }
  for (const q of P.wallItems) if (q.k === k && q.bx) { const ib = q.bx; if (Math.min(b.max[0], ib.max[0]) - Math.max(b.min[0], ib.min[0]) > 0.03 && Math.min(b.max[2], ib.max[2]) - Math.max(b.min[2], ib.min[2]) > 0.03 && Math.min(b.max[1], ib.max[1]) - Math.max(b.min[1], ib.min[1]) > 0.03) return 'hung ' + q.id; }
  if (!o.noClear) for (const z of P.clear) if (z.k === k && rOv(r, z, 0.01) && !(o.allow && o.allow.includes(z.kind))) return 'clear ' + z.kind;
  if (b.max[1] - L.y > 1.0 && !o.lowOk && (o.h || 1) > 0.85) for (const w of P.windows) if (w.k === k && w.room === room && rOv(r, pWinZone(w), 0.01)) return 'window';
  return '';
}
// put an item: it is drawn with draw(m) at (cx, cz) turned by rot, on the level's floor (or at y = lift above it), measured, and recorded. Returns the record or null when it does not fit.
// o._hon: shared by the candidates of one search (pFree, pWallSlot): the first measurement gives the others their real footprint before anything is drawn.
function pPut(P, room, name, cx, cz, rot, w, d, h, draw, o) {
  o = o || {}; let r = pFoot(cx, cz, w, d, rot); if (TEST && TEST.nomeasure) o = Object.assign({}, o, { nomeasure: true, _hon: null });
  const hon = o._hon; if (hon && hon.rel) r = { x0: Math.min(r.x0, cx + hon.rel.x0), x1: Math.max(r.x1, cx + hon.rel.x1), z0: Math.min(r.z0, cz + hon.rel.z0), z1: Math.max(r.z1, cz + hon.rel.z1) };
  if (!pFit(P, room, r, Object.assign({ h }, o))) return null;
  if (h > 0.3 && !o.flat && !o.noGuard && !pGuardOk(P, room, r)) { P.guarded = (P.guarded || 0) + 1; return null; }      /* [fin] nothing tall goes where it would cut a door, stair foot, hearth front or seat off */
  if (hon && hon.rel && pBoxOK(P, room, { min: [r.x0, P.lv[room.k].y + 0.1, r.z0], max: [r.x1, P.lv[room.k].y + h, r.z1] }, o, o.flat)) return null;
  const L = P.lv[room.k], m = P.c.int; pBase(P, m); const sn = pSnap(P, m), t0 = m.ni, rc = pRecBegin(true), flat = !!o.flat;
  at(m, cx, L.y + 0.02 + (o.lift || 0), cz, rot, () => draw(m)); pRecEnd(rc, m, t0); pFixStack(P, m, sn, name);
  const b = pMeasure(P, m, rc);
  if (b) {
    const why = o.nomeasure ? '' : pBoxOK(P, room, b, o, flat);
    if (hon) hon.rel = { x0: Math.min(hon.rel ? hon.rel.x0 : 0, b.min[0] - cx), x1: Math.max(hon.rel ? hon.rel.x1 : 0, b.max[0] - cx), z0: Math.min(hon.rel ? hon.rel.z0 : 0, b.min[2] - cz), z1: Math.max(hon.rel ? hon.rel.z1 : 0, b.max[2] - cz) };
    if (why) { pUndo(P, m, sn); P.refused = (P.refused || 0) + 1; (P.refusedWhy = P.refusedWhy || []).push(name + ' @' + cx.toFixed(2) + ',' + cz.toFixed(2) + ' box ' + b.min.map(v => v.toFixed(2)) + ' / ' + b.max.map(v => v.toFixed(2)) + ' ' + why.split(' ')[0] + (why.indexOf(' ') > 0 ? ' ' + why.slice(why.indexOf(' ') + 1) : '')); return null; }
    r = { x0: Math.max(b.min[0], room.in.x0), x1: Math.min(b.max[0], room.in.x1), z0: Math.max(b.min[2], room.in.z0), z1: Math.min(b.max[2], room.in.z1) };          // the recorded footprint is what it really occupies
  }
  pCommitKit(m, rc); (m.own = m.own || []).push([t0, m.ni, name]);
  const it = pOcc(P, room.k, r, o.flat ? 'rug' : 'floor', name, { h, hh: b ? Math.max(h, b.max[1] - L.y) : h, bx: b || null, room: room.id, rot, cx, cz, w, d, y0: L.y + (o.lift || 0), lift: o.lift || 0, top: o.surface ? h : 0, back: o.back, allow: o.allow }); it.rec = rc; rc.t1 = m.ni;
  if (o.flat) it.kind = 'rug'; return it;
}
// along a wall of the room, w wide (along the wall) and d deep; o.at: 'start' | 'end' | 'mid' | a coordinate along the wall to be near. Tries every 0.25 m.
function pWallSlot(P, room, side, w, d, o) {
  o = o || {}; const a = room.in, hor = side === 'n' || side === 's', rel = o._hon && o._hon.rel, pts = [];
  // [fx2] once one candidate has been drawn and measured, the slots are flush for what it really occupies: its depth against the wall, its extent along it inside the room
  let lo = (hor ? a.x0 : a.z0) + w / 2, hi = (hor ? a.x1 : a.z1) - w / 2;
  if (rel) { lo = hor ? a.x0 - rel.x0 : a.z0 - rel.z0; hi = hor ? a.x1 - rel.x1 : a.z1 - rel.z1; }
  for (let t = lo; t <= hi + 1e-6; t += 0.25) pts.push(t);
  if (hi > lo && Math.abs(pts[pts.length - 1] - hi) > 1e-3) pts.push(hi);      /* [inout] the far end of the wall too: a 25 cm step can pass over the one place that fits */
  const want = o.at === 'end' ? hi : o.at === 'mid' || o.at === undefined ? (lo + hi) / 2 : o.at === 'start' ? lo : o.at;
  pts.sort((p, q) => Math.abs(p - want) - Math.abs(q - want));
  let nth = o.nth || 0;
  for (const t of pts) {
    let cz = side === 'n' ? a.z0 + d / 2 : side === 's' ? a.z1 - d / 2 : t, cx = side === 'w' ? a.x0 + d / 2 : side === 'e' ? a.x1 - d / 2 : t;
    if (rel) { if (side === 'n') cz = a.z0 - rel.z0 + 0.003; else if (side === 's') cz = a.z1 - rel.z1 - 0.003; else if (side === 'w') cx = a.x0 - rel.x0 + 0.003; else cx = a.x1 - rel.x1 - 0.003; }
    const px = hor ? t : cx, pz = hor ? cz : t, r = rel ? { x0: px + rel.x0, x1: px + rel.x1, z0: pz + rel.z0, z1: pz + rel.z1 } : hor ? rectOf(px, pz, w, d) : rectOf(px, pz, d, w);
    if (pFit(P, room, r, o) && nth-- <= 0) return { cx: px, cz: pz, rect: r };
  }
  return null;
}
// an item with its back to a wall (back = -1: its local -z is the back, as a bed's head; +1: its +z, as a shelf's)
const HON_C = {};
function pAgainst(P, room, side, name, w, d, h, back, draw, o) {
  o = Object.assign({ h, _hon: {} }, o || {});
  for (let n = 0; n < 14; n++) {          // [fx2] the first free slot that the measured thing really fits
    const s = pWallSlot(P, room, side, w, d, Object.assign({}, o, { nth: n })); if (!s) return null;
    const it = pPut(P, room, name, s.cx, s.cz, rotBack(side, back), w, d, h, draw, Object.assign({}, o, { back: side })); if (it) return it;
  }
  return null;
}
// anywhere free in the room: tries the centre, then rings round it (o.near = [x, z] to start from), o.step 0.25
function pFree(P, room, name, w, d, h, rot, draw, o) {
  o = Object.assign({ _hon: {} }, o || {}); const a = room.in, c0 = o.near || [(a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2], pts = [];
  for (let x = a.x0 + 0.3; x <= a.x1 - 0.3; x += 0.25) for (let z = a.z0 + 0.3; z <= a.z1 - 0.3 - (o.keeper ? o.keeper + 0.35 - 0.3 : 0); z += 0.25) pts.push([x, z]);   // [fx2] o.keeper: room behind a counter for the keeper
  pts.sort((p, q) => Math.hypot(p[0] - c0[0], p[1] - c0[1]) - Math.hypot(q[0] - c0[0], q[1] - c0[1]));
  for (const p of pts) { const it = pPut(P, room, name, p[0], p[1], rot, w, d, h, draw, o); if (it) return it; }
  return null;
}
// something hung on a wall: a band [y0, y1] and a span along the wall, kept off windows, doorways and other hung things, and clear of tall furniture against that wall
function pHang(P, room, side, u, w, y0, y1, draw, name, o) {
  o = o || {}; const a = room.in, L = P.lv[room.k], hor = side === 'n' || side === 's';
  const wl = P.walls.find(q => q.k === room.k && (hor ? q.ax === 'x' : q.ax === 'z') && Math.abs(q.c - (side === 'n' ? room.z0 : side === 's' ? room.z1 : side === 'w' ? room.x0 : room.x1)) < 0.01 && u > q.a && u < q.b);
  if (!wl) return null;
  const rec = { k: room.k, wall: wl, u0: u - w / 2, u1: u + w / 2, y0, y1, id: name, room: room.id, side };
  if (rec.u0 < (hor ? a.x0 : a.z0) - 1e-6 || rec.u1 > (hor ? a.x1 : a.z1) + 1e-6) return null;
  for (const op of wl.open) { const hw = op.type === 'door' ? op.hw + 0.1 : 0.9; if (rec.u0 < op.pos + hw && rec.u1 > op.pos - hw && (op.type === 'door' || (y1 > 0.85 && y0 < 2.4))) return null; }
  for (const q of P.wallItems) if (q.k === rec.k && q.wall === wl && q.side === side && rec.u0 < q.u1 + 0.05 && rec.u1 > q.u0 - 0.05 && rec.y0 < q.y1 + 0.05 && rec.y1 > q.y0 - 0.05) return null;
  for (const it of P.items) if (it.k === room.k && (it.kind === 'floor' || it.kind === 'hearth') && it.back === side && (it.hh || it.h || 1) > y0 - L.y + 0.02) { const s = hor ? [it.x0, it.x1] : [it.z0, it.z1]; if (rec.u0 < s[1] && rec.u1 > s[0]) return null; }
  const m = P.c.int, p = hor ? [u, side === 'n' ? a.z0 : a.z1] : [side === 'w' ? a.x0 : a.x1, u];
  const rot = rotBack(side, +1);
  pBase(P, m); const sn = pSnap(P, m), rc = pRecBegin(true), t0 = m.ni; at(m, p[0], L.y + (o.pivot !== undefined ? o.pivot : y0), p[1], rot, () => draw(m, y1 - y0)); pRecEnd(rc, m, t0); pFixStack(P, m, sn, name);
  const b = pMeasure(P, m, rc);
  if (b) {          // [fx2] measured: through a door or window, another hung thing, furniture, the ceiling or down to the floor undoes it
    const iu = hor ? 0 : 2, u0 = b.min[iu], u1 = b.max[iu], by0 = b.min[1] - L.y, by1 = b.max[1] - L.y; let why = '';
    if (u0 < (hor ? a.x0 : a.z0) - 0.02 || u1 > (hor ? a.x1 : a.z1) + 0.02) why = 'room';
    if (!why) for (const op of wl.open) { const hw = op.type === 'door' ? op.hw + 0.05 : 0.85; if (u0 < op.pos + hw && u1 > op.pos - hw && (op.type === 'door' ? by0 < 2.15 : by1 > 0.85 && by0 < 2.4)) { why = op.type; break; } }
    if (!why) for (const q of P.wallItems) if (q.wall === wl && q.side !== side && q.bx && [0, 1, 2].every(ax => Math.min(b.max[ax], q.bx.max[ax]) - Math.max(b.min[ax], q.bx.min[ax]) > 0.01)) { why = 'back to back ' + q.id; break; }   // [fx2] two things hung on both faces of one wall do not meet inside it
    if (!why) for (const q of P.wallItems) if (q.k === room.k && q.bx && q.wall !== wl && [0, 1, 2].every(ax => Math.min(b.max[ax], q.bx.max[ax]) - Math.max(b.min[ax], q.bx.min[ax]) > 0.01)) { why = 'hangs through ' + q.id; break; }   // [fx2] two hung things at a corner
    if (!why && by1 > L.H + 0.01) why = 'ceiling';
    if (!why && by0 < 0.3 && y0 > 0.5 && !o.toFloor) why = 'floor';
    if (!why) for (const q of P.wallItems) if (q.k === rec.k && q.wall === wl && q.side === side) { const qu0 = q.bu0 === undefined ? q.u0 : q.bu0, qu1 = q.bu1 === undefined ? q.u1 : q.bu1, qy0 = q.by0 === undefined ? q.y0 : q.by0, qy1 = q.by1 === undefined ? q.y1 : q.by1; if (u0 < qu1 - 0.03 && u1 > qu0 + 0.03 && by0 < qy1 - 0.03 && by1 > qy0 + 0.03) { why = 'hung ' + q.id; break; } }
    if (!why) for (const it of P.items) { if (it.k !== room.k || !(it.kind === 'floor' || it.kind === 'hearth') || !it.bx) { if (it.k === room.k && it.kind === 'hearth' && !it.bx && it.back === side && rec.u0 < (hor ? it.x1 : it.z1) && rec.u1 > (hor ? it.x0 : it.z0) && by0 < L.H) { why = 'hearth'; break; } continue; } const ib = it.bx; if (Math.min(b.max[0], ib.max[0]) - Math.max(b.min[0], ib.min[0]) > 0.03 && Math.min(b.max[2], ib.max[2]) - Math.max(b.min[2], ib.min[2]) > 0.03 && Math.min(b.max[1], ib.max[1]) - Math.max(b.min[1], ib.min[1]) > 0.03) { why = 'item ' + it.id; break; } }
    if (why) { pUndo(P, m, sn); P.refused = (P.refused || 0) + 1; return null; }
    rec.bu0 = u0; rec.bu1 = u1; rec.by0 = by0; rec.by1 = by1; rec.bx = b;
  }
  pCommitKit(m, rc); rec.rec = rc; rc.t1 = m.ni;
  P.wallItems.push(rec); return rec;
}
const pCentre = r => [(r.in.x0 + r.in.x1) / 2, (r.in.z0 + r.in.z1) / 2];
const pRoomAt = (P, k, x, z) => { for (const id in P.rooms) { const r = P.rooms[id]; if (r.k === k && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r; } return null; };

// [fx2] a person's standing spot must not lie inside a solid: counters, chairs, cabinets and wall shelves are found by their real footprints. A spot that does is moved to the nearest free floor
// (searched outward in 0.1 m rings, at most 1.1 m, the same room, off stairwells and doorways); sleeping and sitting spots are left to their furniture.
function pSpotsClear(P) {
  const R_ = 0.3, solid = P.items.filter(i => (i.kind === 'floor' || i.kind === 'hearth' || i.kind === 'stair') && (i.h === undefined || i.h > 0.3 || i.kind !== 'floor'));
  const busy = (k, x, z) => { for (const it of solid) if (it.k === k && x > it.x0 - R_ && x < it.x1 + R_ && z > it.z0 - R_ && z < it.z1 + R_) return it; for (const h of P.holes) if (h.k === k && x > h.r.x0 - 0.2 && x < h.r.x1 + 0.2 && z > h.r.z0 - 0.2 && z < h.r.z1 + 0.2) return h; return null; };
  P.spotMoves = [];
  for (const nm in P.spots) {
    const sp = P.spots[nm], W = World.spots[P.id + '.' + nm]; if (!W || W.sit || W.lie) continue;
    let room = pRoomAt(P, sp.k, sp.x, sp.z); if (!room) for (const id in P.rooms) { const q = P.rooms[id], a = q.in; if (q.k === sp.k && sp.x > a.x0 - 0.45 && sp.x < a.x1 + 0.45 && sp.z > a.z0 - 0.45 && sp.z < a.z1 + 0.45) { room = q; break; } }
    if (!room || !busy(sp.k, sp.x, sp.z)) continue;
    const a = room.in; let best = null;
        for (const wi of [0.3, 0.22]) for (let r = 0.1; r <= 1.1 && !best; r += 0.1) { let bd = 1e9; for (let q = 0; q < 24; q++) { const ang = q / 24 * TAU, x = sp.x + Math.cos(ang) * r, z = sp.z + Math.sin(ang) * r; if (x < a.x0 + wi || x > a.x1 - wi || z < a.z0 + wi || z > a.z1 - wi || busy(sp.k, x, z)) continue; const d = r + (W.face ? 0 : 0); if (d < bd) { bd = d; best = [x, z]; } } }
    if (!best) continue; P.spotMoves.push(nm + ' ' + sp.x.toFixed(2) + ',' + sp.z.toFixed(2) + ' -> ' + best[0].toFixed(2) + ',' + best[1].toFixed(2));
    const p = P.w2(best[0], 0, best[1]); sp.x = best[0]; sp.z = best[1]; sp.p = [p[0], W.p[1], p[2]]; W.p = sp.p.slice();
  }
}
// ── registration of the things the village looks for: spots, interact points, lights ──
function pSpot(P, name, x, z, yaw, o) {
  o = o || {}; const k = o.k === undefined ? 0 : o.k, L = P.lv[k], y = (o.y === undefined ? 0.02 : o.y) + L.y;
  const p = P.w2(x, y, z); World.spots[P.id + '.' + name] = Object.assign({ p, yaw: yaw + P.yaw, zone: P.zone, site: P.id, k, room: (pRoomAt(P, k, x, z) || {}).id }, o.extra || {});
  P.spots[name] = { x, z, k, yaw, p };
  if (name === 'counter') { const zc = { x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3, k, kind: 'path' }; if (!P.items.some(i => i.k === k && P_SOLID[i.kind] && rOv(i, zc))) P.clear.push(zc); }   // [fx2] the keeper's standing room stays free
}
function pInteract(P, x, y, z, o, k) { const L = P.lv[k || 0]; const it = Object.assign({ p: P.w2(x, y + L.y, z), r: 2.0, zone: P.zone }, o); World.interact.push(it); return it; }
function pLight(P, x, y, z, r, col, kind, k) { const L = P.lv[k || 0], rm = pRoomAt(P, k || 0, x, z); if (rm) P.lightIn[rm.id] = 1; P.lights++; return addLight(P.w2(x, y + L.y, z), r, col, P.zone, kind); }

// ── geometry: floors, ceilings, walls (kit panels), stairs ──
function rSub(r, h) {         // r minus the rectangle h: up to four rectangles
  if (!rOv(r, h)) return [r];
  const out = [], ix0 = Math.max(r.x0, h.x0), ix1 = Math.min(r.x1, h.x1);
  if (h.z0 > r.z0) out.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: h.z0 }); if (h.z1 < r.z1) out.push({ x0: r.x0, x1: r.x1, z0: h.z1, z1: r.z1 });
  if (h.x0 > r.x0) out.push({ x0: r.x0, x1: h.x0, z0: Math.max(r.z0, h.z0), z1: Math.min(r.z1, h.z1) }); if (h.x1 < r.x1) out.push({ x0: h.x1, x1: r.x1, z0: Math.max(r.z0, h.z0), z1: Math.min(r.z1, h.z1) });
  return out.filter(q => q.x1 - q.x0 > 0.01 && q.z1 - q.z0 > 0.01);
}
const rSubAll = (r, holes) => holes.reduce((acc, h) => acc.flatMap(q => rSub(q, h)), [r]);
function pBuild(P) {
  const c = P.c, m = c.int, B = kitIntBatch(P.zone), zone = P.zone, MS = P.MS, IN = { zone, skyVis: INT_AO, inZone: zone, inSkyVis: INT_AO }, FL = { zone, skyVis: INT_AO, cast: false };
  m.m1 = zone; m.ao = INT_AO;
  for (const k in P.lv) {
    const L = P.lv[k], holes = P.holes.filter(h => h.k === L.k).map(h => h.r), above = P.holes.filter(h => h.k === L.k + 1).map(h => h.r);
    for (const r of L.rooms) {
      const FLr = r.ftint ? Object.assign({}, FL, { tint: r.ftint }) : FL;      // [c5] room.ftint: rushes on earth, scrubbed boards, dark flags
      const tile = r.floor === 'stone' ? 'Floor_UnevenBrick' : r.floor === 'cobble' ? 'Floor_UnevenBrick' : 'Floor_WoodDark';
      for (const q of rSubAll({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 }, holes)) {
        const nx = Math.max(1, Math.round((q.x1 - q.x0) / 2)), nz = Math.max(1, Math.round((q.z1 - q.z0) / 2)), sx = (q.x1 - q.x0) / (2 * nx), sz = (q.z1 - q.z0) / (2 * nz);
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) B.add(tile, KH.xf(MS, q.x0 + (i + 0.5) * 2 * sx, L.y + 0.012, q.z0 + (j + 0.5) * 2 * sz, [sx, 1, sz]), FLr);
        addFloor(m, q.x0, q.z0, q.x1, q.z1, L.y + 0.02);
      }
      // ceiling slab underside + beams (not over a stairwell)
      const yc = L.y + L.H; m.m1 = zone; m.ao = INT_AO * 0.9; m.mat(r.floor === 'stone' ? MAT.STONE : MAT.PLANKS, r.floor === 'stone' ? [0.8, 0.78, 0.74] : COL.woodDark);
      for (const q of rSubAll({ x0: r.x0 + PW.IN, z0: r.z0 + PW.IN, x1: r.x1 - PW.IN, z1: r.z1 - PW.IN }, above)) m.quad([q.x0, yc, q.z1], [q.x0, yc, q.z0], [q.x1, yc, q.z0], [q.x1, yc, q.z1], 0, 0, (q.x1 - q.x0) / m.tile, (q.z1 - q.z0) / m.tile);
      m.mat(MAT.TIMBER, COL.timberDark); const wide = r.beamDir === 'x' ? true : r.beamDir === 'z' ? false : (r.x1 - r.x0) >= (r.z1 - r.z0), span = wide ? r.z1 - r.z0 : r.x1 - r.x0, len = wide ? r.x1 - r.x0 : r.z1 - r.z0, nb = Math.max(1, Math.round(len / (r.beamSp || 1.7))), bh = r.beamH || 0.2, bw = r.beamW || 0.08;      // [c5] room.beamDir / beamSp / beamH / beamW: the ceiling differs room to room
      if (L.H > 2.2) for (let i = 0; i < nb; i++) {
        const t = (wide ? r.x0 : r.z0) + len * (i + 0.5) / nb, bq = wide ? { x0: t - bw, x1: t + bw, z0: r.z0 + 0.2, z1: r.z1 - 0.2 } : { x0: r.x0 + 0.2, x1: r.x1 - 0.2, z0: t - bw, z1: t + bw };
        if (above.some(h => rOv(bq, h))) continue; m.box(bq.x0, yc - bh, bq.z0, bq.x1, yc, bq.z1, 8);
      }
    }
  }
  for (const wl of P.walls) pWallEmit(P, wl, B, IN);
  for (const s of P.stairs) pStairEmit(P, s);
}
// [fin] what an open street door shows from inside: a glass quad just beyond the threshold, drawn with the window-pane material, so from the room side it reads the
// town's cube map (56b_viewcube.js) along the line of sight: the street at the hour of the day, dark with the lamps at night. Local frame of a door piece: x -0.58..0.58, y 0..2.2, z +0.14 (outside), facing out.
function pDoorView() {
  if (Kit.pieces.DoorView) return 'DoorView';
  
  const X = 0.58, H = 2.2, Z = 0.14;
  Kit.pieces.DoorView = { name: 'DoorView', prims: [{ mat: 'MI_DoorViewGlass', pos: new Float32Array([-X, 0, Z, X, 0, Z, X, H, Z, -X, H, Z]), nrm: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), uv: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), col: null, idx: Uint32Array.from([0, 1, 2, 0, 2, 3]), n: 4 }], min: [-X, 0, Z], max: [X, H, Z], pack: 'gen' };
  return 'DoorView';
}
function pWallEmit(P, wl, B, IN) {
  const L = P.lv[wl.k], H = L.H, sy = H / 3.12, ns = wl.ns, hor = wl.ax === 'x', m = P.c.int;
  const stone = wl.cellar || P.rooms[[...wl.rooms][0]].floor === 'stone' || P.rooms[[...wl.rooms][0]].walls === 'stone', G = stone ? 'Wall_UnevenBrick' : 'Wall_Plaster';
  const fwd = hor ? (ns > 0) : (ns < 0);                       // does u run along +axis?
  const a = wl.a - PW.IN, b = wl.b + PW.IN, len = b - a, sOf = p => fwd ? p - a : b - p;
  const origin = fwd ? a : b, perp = wl.c + 0.11 * ns, O = hor ? [origin, perp] : [perp, origin];
  const nv = hor ? [0, 0, ns] : [ns, 0, 0];          // outward normal; u = up x n = (nz, 0, -nx)
  const F = new THREE.Matrix4().makeBasis(KH.V([nv[2], 0, -nv[0]]), KH.V([0, 1, 0]), KH.V(nv)).setPosition(O[0], L.y, O[1]).premultiply(P.MS);
  const rt = P.rooms[[...wl.rooms][0]].tint, INW = wl.cellar ? Object.assign({}, IN, { tint: [0.42, 0.38, 0.35] }) : rt ? Object.assign({}, IN, { tint: rt }) : IN;          // [c4] room.tint: soot          // cellar walls: damp, darker stone
  const add = (name, uc, s, o) => B.add(name, KH.xf(F, uc, 0, 0, s), o || INW);
  const spans = wl.open.map(o => ({ o, s: sOf(o.pos), w: o.type === 'door' ? (o.d.w >= 1.2 ? 2.0 * o.d.w / PW.DOOR : 2.0) : 2.0 })).sort((p, q) => p.s - q.s);
  let cur = 0;
  const fill = (e) => {
    const g = e - cur; if (g < 0.05) { cur = Math.max(cur, e); return; }
    const n = Math.max(1, Math.round(g / 2)), mm = g / n;
    for (let i = 0; i < n; i++) { const sx = mm / 2, nm = stone ? 'Wall_UnevenBrick_Straight' : sx < 0.6 ? 'Wall_Plaster_Straight_Base' : (i % 2 ? 'Wall_Plaster_Straight_Base' : 'Wall_Plaster_Straight'); add(nm, cur + (i + 0.5) * mm, [sx, sy, 1]); }
    cur = e;
  };
  for (const sp of spans) {
    const s0 = sp.s - sp.w / 2, s1 = sp.s + sp.w / 2;
    if (s0 < -0.02 || s1 > len + 0.02) P.err.push('opening at ' + sp.o.pos + ' on wall ' + wl.ax + wl.c + ' sticks out of its wall');
    fill(Math.max(cur, s0));
    const S = [sp.w / 2, sy, 1];
    if (sp.o.type === 'door' && sp.o.d.open) {          // [c5] an open back door: no leaf, a bright yard beyond it (door.open = true), the collider still closes it
      add('DoorFrame_Flat_WoodDark', sp.s, S);
      const q = sp.o.pos, hw = sp.o.hw, z0 = wl.c + ns * 0.45, z1 = wl.c + ns * 0.5, zl = Math.min(z0, z1), zh = Math.max(z0, z1), y0 = L.y, X = hor ? [q - hw - 0.15, zl, q + hw + 0.15, zh] : [zl, q - hw - 0.15, zh, q + hw + 0.15];
      m.m1 = P.zone; m.ao = INT_AO;
      const bx = (ya, yb) => m.box(X[0], ya, X[1], X[2], yb, X[3], 4);
      emit(m, 1.15, () => { m.mat(MAT.PLAIN, [0.55, 0.66, 0.38]); bx(y0, y0 + 0.9); m.mat(MAT.PLAIN, [0.78, 0.88, 0.96]); bx(y0 + 0.9, y0 + 2.2); });
      pLight(P, hor ? q : wl.c - ns * 0.9, 1.5 * sy, hor ? wl.c - ns * 0.9 : q, 5.2, [1.7, 1.62, 1.4], 'daylight', wl.k);
    }
    else if (sp.o.type === 'door') { add(G + '_Door_Flat', sp.s, S); add('DoorFrame_Flat_WoodDark', sp.s, S); if (sp.o.d.b === null && !sp.o.d.upper && !sp.o.d.cellarDoor) { const dv = pDoorView(); if (dv) { add(dv, sp.s, S); const px = hor ? sp.o.pos : wl.c - ns * 0.9, pz = hor ? wl.c - ns * 0.9 : sp.o.pos; pLight(P, px, 0.5, pz, 3.0, [2.2, 1.85, 1.35], 'daylight', wl.k); } } if (sp.o.d.upper && Kit.pieces.Door_1_Flat) B.add('Door_1_Flat', KH.xf(F, sp.s - 0.54 * S[0], 0, -0.05, S), INW); if (sp.o.d.cellarDoor && Kit.pieces.Door_1_Flat) B.add('Door_1_Flat', KH.xf(F, sp.s - 0.54 * S[0], 0, -0.05, S, -1.35), INW);      /* [inout] the Hart's cellar door, a real leaf standing open into the passage */   /* [inout] the leaf of a balcony door: the shell hangs the same one outside (71_kithouse.js) */ }
    else {
      const tbl = { Wide_Flat: ['_Window_Wide_Flat', 'Window_Wide_Flat1'], Thin_Round: ['_Window_Thin_Round', 'Window_Thin_Round1'], Wide_Round: ['_Window_Wide_Round', 'Window_Wide_Round1'] }[sp.o.kind] || ['_Window_Wide_Flat', 'Window_Wide_Flat1'];
      const st = sp.o.glass && Kit.pieces[tbl[1] + '_Stained'];
      add(G + tbl[0], sp.s, S); add(st ? tbl[1] + '_Stained' : tbl[1], sp.s, S, st ? Object.assign({}, IN, { tint: sp.o.glass }) : undefined);
      // the light the window lets in, a little inside it
      const px = hor ? sp.o.pos : wl.c - ns * 0.8, pz = hor ? wl.c - ns * 0.8 : sp.o.pos; pLight(P, px, 1.7 * sy, pz, 5.6, sp.o.glass ? sp.o.glass.map(v => 0.35 + v * 1.1) : [1.5, 1.42, 1.28], 'daylight', wl.k);
      if (sp.o.glass) { const fx = hor ? sp.o.pos : wl.c - ns * 2.1, fz = hor ? wl.c - ns * 2.1 : sp.o.pos; pLight(P, fx, 0.5, fz, 3.4, sp.o.glass.map(v => v * 3.2), 'daylight', wl.k); }          // the coloured pool the window throws on the floor by day
    }
    cur = Math.max(cur, s1);
  }
  fill(len);
  // collision: the wall is solid except in doorways (a window is wall); the street door is closed (the portal is the way)
  const cuts = wl.open.filter(o => o.type === 'door' && o.d.b !== null).map(o => [o.pos - o.hw, o.pos + o.hw]).sort((p, q) => p[0] - q[0]);
  let at0 = a; const y0 = L.y, y1 = L.y + H + 0.1;
  for (const [c0, c1] of cuts.concat([[b, b]])) { if (c0 - at0 > 0.02) { if (hor) addBoxCollider(m, at0, wl.c - 0.2, c0, wl.c + 0.2, y0, y1); else addBoxCollider(m, wl.c - 0.2, at0, wl.c + 0.2, c0, y0, y1); } at0 = c1; }
}
function pStairEmit(P, s) {
  const m = P.c.int, a = P.lv[s.k0], b = P.lv[s.k1], ax = s.axis, d = s.dir, hw = s.width / 2, r = s.rise / s.n, y0 = a.y + 0.02;
  const R4 = (p0, p1, l0, l1) => ax === 'x' ? [Math.min(p0, p1), Math.min(l0, l1), Math.max(p0, p1), Math.max(l0, l1)] : [Math.min(l0, l1), Math.min(p0, p1), Math.max(l0, l1), Math.max(p0, p1)];
  m.m1 = P.zone; m.ao = INT_AO;
  for (let i = 0; i < s.n; i++) {
    const q = R4(s.p0 + d * i * s.tread, s.p0 + d * (i + 1) * s.tread, s.lat - hw, s.lat + hw), top = y0 + (i + 1) * r - 0.02;
    m.mat(MAT.PLANKS, COL.wood); m.box(q[0], y0, q[1], q[2], top, q[3], 4 | 8); m.mat(MAT.PLANKS, COL.woodDark, 0.8); m.box(q[0] - 0.012, top - 0.05, q[1] - 0.012, q[2] + 0.012, top + 0.008, q[3] + 0.012, 4);          // the tread plate overhangs the block by 1 cm (nothing coplanar)
  }
  // side boards and a handrail up the open side
  m.mat(MAT.TIMBER, COL.timberDark);
  for (const sg of [-1, 1]) {
    const l = s.lat + sg * (hw + 0.035), top = b.y + 0.02;
    for (let i = 0; i < s.n; i += 1) { const q = R4(s.p0 + d * i * s.tread, s.p0 + d * (i + 1) * s.tread, l - 0.03, l + 0.03); m.box(q[0], y0, q[1], q[2], y0 + (i + 1) * r + 0.05, q[3], 4); }
    // handrail: a sloping beam on posts
    const tE = Math.max(0.05, 1 - 1.07 / Math.max(s.rise, 1.2)), yA = 0.95 + y0 + 0.4 * r, yB = 0.95 + top - 0.4 * r, pE = s.p0 + d * s.run * tE;      // [fin] the climber's rail stops 1.07 m of rise short of the floor above: there the opening's own balustrade (below) takes over, so two guard systems never stand in one well
    const pa = ax === 'x' ? [s.p0, yA, l] : [l, yA, s.p0], pb = ax === 'x' ? [pE, yA + (yB - yA) * tE, l] : [l, yA + (yB - yA) * tE, pE];
    m.beam(pa, pb, 0.05, 0.06);
    for (let i = 0; i <= s.n; i += 3) { if (i / s.n > tE) break; const t = Math.min(i, s.n) / s.n, p = s.p0 + d * s.run * t, y = lerp(y0, top, t) + 0.1, q = ax === 'x' ? [p, l] : [l, p]; m.box(q[0] - 0.03, y, q[1] - 0.03, q[0] + 0.03, y + 0.95 + 0.4 * r * (1 - 2 * t) + 0.02, q[1] + 0.03); }
  }
  // [fin] the opening in the upper floor, done properly: the floor shows its thickness (a trimmer 0.1 x 0.22 m on all four sides, boards ending on it), and the open sides are guarded:
  // a balustrade (newels 0.1 m square with caps, a handrail at 0.9 m, balusters at 0.12 m) for an upper stairwell, a coaming and a propped plank hatch for a poor cellar. The arrival end stays open.
  { const yf = b.y, hh = s.hole, tw = 0.1, B = (p0_, p1_, l0_, l1_, ya, yb) => { const q = R4(p0_, p1_, l0_, l1_); m.box(q[0], ya, q[1], q[2], yb, q[3]); };
    const F = s.p0 - d * 0.8, E = s.p1, pl = Math.min(F, E), ph = Math.max(F, E), lw = s.hw + 0.1, cellar = a.y < P.lv[0].y - 0.5, hatch = cellar && /^in\./.test(P.id);
    m.m1 = P.zone; m.ao = INT_AO; m.mat(MAT.TIMBER, COL.timber);
    for (const sg of [-1, 1]) B(pl - tw, ph + tw, s.lat + sg * lw, s.lat + sg * (lw + tw), yf - 0.22, yf + 0.028);
    B(F - d * tw, F, s.lat - lw, s.lat + lw, yf - 0.22, yf + 0.028);
    B(E, E + d * tw, s.lat - lw, s.lat + lw, yf - 0.22, yf + 0.028);
    const post = (p_, l_) => { B(p_ - 0.05, p_ + 0.05, l_ - 0.05, l_ + 0.05, yf + 0.028, yf + 1.0); B(p_ - 0.07, p_ + 0.07, l_ - 0.07, l_ + 0.07, yf + 1.0, yf + 1.04); };
    const rail = (pa, la, pb, lb) => {
      const n = Math.max(1, Math.round(Math.hypot(pb - pa, lb - la) / 0.12));
      post(pa, la); post(pb, lb);
      B(Math.min(pa, pb) - 0.03, Math.max(pa, pb) + 0.03, Math.min(la, lb) - 0.03, Math.max(la, lb) + 0.03, yf + 0.88, yf + 0.94);
      B(Math.min(pa, pb) - 0.02, Math.max(pa, pb) + 0.02, Math.min(la, lb) - 0.02, Math.max(la, lb) + 0.02, yf + 0.1, yf + 0.15);
      for (let i = 1; i < n; i++) { const t = i / n, p_ = pa + (pb - pa) * t, l_ = la + (lb - la) * t; B(p_ - 0.018, p_ + 0.018, l_ - 0.018, l_ + 0.018, yf + 0.15, yf + 0.88); }
    };
    if (!hatch) { const fe = F - d * (tw + 0.04); for (const sg of [-1, 1]) rail(fe, s.lat + sg * (lw + tw + 0.04), E, s.lat + sg * (lw + tw + 0.04)); rail(fe, s.lat - (lw + tw + 0.04), fe, s.lat + (lw + tw + 0.04)); }
    else {
      for (const sg of [-1, 1]) B(F, E, s.lat + sg * lw - (sg < 0 ? 0 : 0.06), s.lat + sg * lw + (sg < 0 ? 0.06 : 0), yf + 0.028, yf + 0.11);
      B(F - d * 0.06, F, s.lat - lw, s.lat + lw, yf + 0.028, yf + 0.11);
      const pf = F - d * 0.1;
      m.mat(MAT.PLANKS, COL.wood, 0.5); B(pf - 0.025, pf + 0.025, s.lat - 0.46, s.lat + 0.46, yf + 0.11, yf + 0.97);
      m.mat(MAT.TIMBER, COL.timberDark); for (const yb of [0.3, 0.75]) B(pf - 0.025 - d * 0.03, pf + 0.025 - d * 0.03, s.lat - 0.46, s.lat + 0.46, yf + yb, yf + yb + 0.09);
      m.mat(MAT.METAL, [0.17, 0.155, 0.14]); for (const sg of [-1, 1]) B(pf - 0.03, pf + 0.03, s.lat + sg * 0.3 - 0.03, s.lat + sg * 0.3 + 0.03, yf + 0.14, yf + 0.3); B(pf + d * 0.03, pf + d * 0.045, s.lat - 0.04, s.lat + 0.04, yf + 0.82, yf + 0.9);
    }
    m.mat(MAT.TIMBER, COL.timberDark);
  }
  // the walkable ramp and the sides that keep a player on it (and out from under it)
  const lo = ax === 'x' ? [Math.min(s.p0, s.p1), s.lat - hw - 0.05, Math.max(s.p0, s.p1), s.lat + hw + 0.05] : [s.lat - hw - 0.05, Math.min(s.p0, s.p1), s.lat + hw + 0.05, Math.max(s.p0, s.p1)];
  const yA = a.y + 0.02 + 0.5 * r, yB = b.y + 0.02 - 0.5 * r, lowFirst = d > 0;
  addFloor(m, lo[0], lo[1], lo[2], lo[3], lowFirst ? yA : yB, lowFirst ? yB : yA, ax);
  for (const sg of [-1, 1]) { const l = s.lat + sg * (hw + 0.09), q = R4(s.p0, s.p1, l - 0.06, l + 0.06); addBoxCollider(m, q[0], q[1], q[2], q[3], a.y, b.y + 1.1); }
  { const q = R4(s.p0 - d * 0.0, s.p0 - d * 0.08, s.lat - hw - 0.15, s.lat + hw + 0.15); addBoxCollider(m, q[0], q[1], q[2], q[3], b.y + 0.5, b.y + 1.1); }       // the open end of the stairwell on the upper floor, where a person would walk in
  { const q = R4(s.p1 - d * 0.02, s.p1 + d * 0.06, s.lat - hw, s.lat + hw); addBoxCollider(m, q[0], q[1], q[2], q[3], a.y, b.y - 0.6); }
  // [c3] the space under the steps is solid (nobody walks in from the low end and stands where the treads are at head height): one box per 0.4 m, its top 0.12 m below the tread's low edge
  for (let i = 1; i * 0.4 < s.run - 0.3; i++) { const s0 = i * 0.4, top = a.y + (b.y - a.y) * (s0 / s.run) - 0.12; if (top < a.y + 0.1) continue; const q = R4(s.p0 + d * s0, s.p0 + d * (s0 + 0.4), s.lat - hw, s.lat + hw); addBoxCollider(m, q[0], q[1], q[2], q[3], a.y, top); }          // the solid end of the steps: no walking in under the landing
  // the stairs are a navigation link
  pSpot(P, s.name + '0', s.lowPt[0], s.lowPt[1], 0, { k: s.k0 }); pSpot(P, s.name + '1', s.highPt[0], s.highPt[1], 0, { k: s.k1 });
  World.stairs.push({ id: P.id + '.' + s.name, site: P.id, bottom: P.id + '.' + s.name + '0', top: P.id + '.' + s.name + '1', via: [], width: s.width, slope: s.rise / s.run, plan: true, k0: s.k0, k1: s.k1 });
}

// ── navigation: room hubs, doorways, stairs ──
// Called from navBuild (77_npc.js) for every planned house. Walls are never crossed: spots join their room's hub, hubs join through doorways, levels through stairs.
function planNav(P, add, link, doorNode) {
  const hub = {}, N = Nav.nodes, L0 = P.lv[0];
  // [c4] a walk between two points of one level never crosses a stairwell opening (the floor is not there: a walker fell to the level below) or the steps of a stair:
  // such a link is bent round the blocking rectangle through the nearest clear corner
  const blockers = k => P.holes.filter(h => h.k === k).map(h => h.r).concat(P.items.filter(i => i.k === k && i.kind === 'stair'));
  const hit = (k, a, b) => { const bl = blockers(k), n = Math.max(2, Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 0.15)); for (let i = 0; i <= n; i++) { const x = lerp(a[0], b[0], i / n), z = lerp(a[1], b[1], i / n); for (const r of bl) if (x > r.x0 + 0.02 && x < r.x1 - 0.02 && z > r.z0 + 0.02 && z < r.z1 - 0.02) return true; } return false; };
  // [fin] villagers walk the free floor: per level a grid (0.2 m) of points where a person of 0.3 m radius fits (inside a room, clear of every solid item, stairwell and stair, doorways open), a way is the shortest run on that grid pulled straight where the line stays free
  const gridOf = {};
  const navGrid = (k, HW) => {
    const gk = k + ':' + HW; if (gridOf[gk]) return gridOf[gk];
    const rooms = Object.values(P.rooms).filter(r => r.k === k), st = 0.2;
    const obs = P.items.filter(i => i.k === k && P_SOLID[i.kind] && i.kind !== 'rug' && (i.kind !== 'floor' || i.h === undefined || i.h > 0.25)).concat(P.holes.filter(h => h.k === k).map(h => h.r));
    const dp = P.doors.filter(d => d.k === k);
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const r of rooms) { x0 = Math.min(x0, r.in.x0); z0 = Math.min(z0, r.in.z0); x1 = Math.max(x1, r.in.x1); z1 = Math.max(z1, r.in.z1); }
    const nx = Math.max(1, Math.ceil((x1 - x0) / st) + 1), nz = Math.max(1, Math.ceil((z1 - z0) / st) + 1);
    const hw = HW;
    const free = (x, z) => {
      let ok = false; for (const d of dp) if (Math.abs(x - d.x) < 0.5 && Math.abs(z - d.z) < 0.5) { ok = true; break; }
      if (!ok) for (const r of rooms) if (x > r.in.x0 + 0.25 && x < r.in.x1 - 0.25 && z > r.in.z0 + 0.25 && z < r.in.z1 - 0.25) { ok = true; break; }
      if (!ok) return false;
      for (const o of obs) { const dx = Math.max(o.x0 - x, 0, x - o.x1), dz = Math.max(o.z0 - z, 0, z - o.z1); if (dx * dx + dz * dz < hw * hw) return false; }
      return true;
    };
    const g = new Uint8Array(nx * nz); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) g[i * nz + j] = free(x0 + i * st, z0 + j * st) ? 1 : 0;
    return gridOf[gk] = { x0, z0, nx, nz, st, g, free };
  };
  const route = (k, pa, pb) => { for (const hw of [0.3, 0.2, 0.1]) { const w = route1(k, pa, pb, hw); if (w) return w; } return null; };
  const route1 = (k, pa, pb, hw) => {
    const G = navGrid(k, hw), clear = (u, v) => { const n = Math.max(1, Math.ceil(Math.hypot(u[0] - v[0], u[1] - v[1]) / 0.1)); for (let i = 0; i <= n; i++) { const x = lerp(u[0], v[0], i / n), z = lerp(u[1], v[1], i / n); if (Math.hypot(x - pa[0], z - pa[1]) < 0.7 || Math.hypot(x - pb[0], z - pb[1]) < 0.7) continue; if (!G.free(x, z)) return false; } return true; };
    if (clear(pa, pb)) return [];
    const cell = p => [Math.round((p[0] - G.x0) / G.st), Math.round((p[1] - G.z0) / G.st)];
    const snap = p => { const c = cell(p); let best = null; for (let r = 0; r <= 8; r++) { for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = c[0] + di, j = c[1] + dj; if (i < 0 || j < 0 || i >= G.nx || j >= G.nz || !G.g[i * G.nz + j]) continue; const d = Math.hypot(di, dj); if (!best || d < best.d) best = { i, j, d }; } if (best && r >= Math.ceil(best.d)) break; } return best; };
    const sa = snap(pa), sb = snap(pb); if (!sa || !sb) return null;
    const prev = new Int32Array(G.nx * G.nz).fill(-2), q = [sa.i * G.nz + sa.j]; prev[q[0]] = -1; const goal = sb.i * G.nz + sb.j;
    for (let h = 0; h < q.length && prev[goal] === -2; h++) { const c = q[h], i = (c / G.nz) | 0, j = c - i * G.nz; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= G.nx || b >= G.nz) continue; const n = a * G.nz + b; if (prev[n] !== -2 || !G.g[n]) continue; prev[n] = c; q.push(n); } }
    if (prev[goal] === -2) return null;
    const cells = []; for (let c = goal; c !== -1; c = prev[c]) { const i = (c / G.nz) | 0; cells.push([G.x0 + i * G.st, G.z0 + (c - i * G.nz) * G.st]); } cells.reverse();
    const pts = [pa].concat(cells, [pb]), out = []; let at = 0;
    while (at < pts.length - 1) { let nxt = at + 1; for (let m = pts.length - 1; m > at + 1; m--) if (clear(pts[at], pts[m])) { nxt = m; break; } if (nxt < pts.length - 1) out.push(pts[nxt]); at = nxt; }
    return out;
  };
  const linkSafe = (k, na, pa, nb, pb) => {
    const L = P.lv[k], way = route(k, pa, pb); if (!way) { link(na, nb); return; }
    let cur = na; for (const w of way) { const n = add(...P.w2(w[0], L.y + 0.02, w[1])); link(cur, n); cur = n; } link(cur, nb);
  };
  const hubAt = {};
  for (const id in P.rooms) {
    const r = P.rooms[id], L = P.lv[r.k]; let p = pCentre(r); { const G = navGrid(r.k, 0.3); if (!G.free(p[0], p[1])) { let best = null; for (let x = r.in.x0 + 0.4; x < r.in.x1 - 0.3; x += 0.2) for (let z = r.in.z0 + 0.4; z < r.in.z1 - 0.3; z += 0.2) if (G.free(x, z) && (!best || Math.hypot(x - p[0], z - p[1]) < best.d)) best = { x, z, d: Math.hypot(x - p[0], z - p[1]) }; if (best) p = [best.x, best.z]; } }
    hubAt[id] = p; hub[id] = add(...P.w2(p[0], L.y + 0.02, p[1]));
  }
  for (const d of P.doors) {
    const L = P.lv[d.k], k = add(...P.w2(d.x, L.y + 0.02, d.z));
    if (d.b === null && d.upper) { linkSafe(d.k, k, [d.x, d.z], hub[d.a], hubAt[d.a]); }   /* [inout] a balcony door is not a way in from the street */
    else if (d.b === null) { const dn = doorNode[P.id]; if (dn) { link(dn.i, k); linkSafe(d.k, k, [d.x, d.z], hub[d.a], hubAt[d.a]); } }
    else { linkSafe(d.k, hub[d.a], hubAt[d.a], k, [d.x, d.z]); linkSafe(d.k, k, [d.x, d.z], hub[d.b], hubAt[d.b]); }
  }
  const stairSpot = new Set(); for (const s of P.stairs) { stairSpot.add(s.name + '0'); stairSpot.add(s.name + '1'); }
  for (const name in P.spots) { if (stairSpot.has(name)) continue; const sp = P.spots[name], k = Nav.spot[P.id + '.' + name]; if (k === undefined) continue; const r = pRoomAt(P, sp.k, sp.x, sp.z); if (r) linkSafe(sp.k, k, [sp.x, sp.z], hub[r.id], hubAt[r.id]); }
  for (const s of P.stairs) {
    const a = Nav.spot[P.id + '.' + s.name + '0'], b = Nav.spot[P.id + '.' + s.name + '1']; if (a === undefined || b === undefined) continue;
    const ra = pRoomAt(P, s.k0, s.lowPt[0], s.lowPt[1]), rb = pRoomAt(P, s.k1, s.highPt[0], s.highPt[1]);
    link(a, b);
    // a walker leaves a stair by stepping aside first (never straight across the stairwell)
    const side = (pt, r, k) => { if (!r) return null; const c = pCentre(r), sg = s.axis === 'x' ? (c[1] > s.lat ? 1 : -1) : (c[0] > s.lat ? 1 : -1), off = s.hw + 0.95, L = P.lv[k], q = s.axis === 'x' ? [pt[0], pt[1] + sg * off] : [pt[0] + sg * off, pt[1]]; return { n: add(...P.w2(q[0], L.y + 0.02, q[1])), q }; };
    const wa = side(s.lowPt, ra, s.k0), wb = side(s.highPt, rb, s.k1);
    if (wa) { link(a, wa.n); linkSafe(s.k0, wa.n, wa.q, hub[ra.id], hubAt[ra.id]); } if (wb) { link(b, wb.n); linkSafe(s.k1, wb.n, wb.q, hub[rb.id], hubAt[rb.id]); }
  }
  P.hub = hub;
}

// ── validation of a built plan: returns the list of violations (empty = a sound interior) ──
function planValidate(P) {
  const out = P.err.map(e => 'plan: ' + e), flat = it => it.kind === 'rug';
  const items = P.items.filter(i => P_SOLID[i.kind] && !flat(i));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i], b = items[j]; if (a.k === b.k && rOv(a, b, 0.02) && !(a.kind === 'stair' && b.kind === 'hole') && !(a.kind === 'hole' && b.kind === 'stair')) out.push('overlap ' + a.id + ' x ' + b.id + ' (level ' + a.k + ')'); }
  for (const a of items) {
    if (a.kind === 'floor') {
      const room = P.rooms[a.room]; if (!room || !rIn(a, room.in)) out.push(a.id + ' is not inside its room');
      for (const z of P.clear) if (z.k === a.k && rOv(a, z, 0.02) && !(a.allow && a.allow.includes(z.kind))) out.push(a.id + ' stands in a ' + z.kind + ' clearance');      /* [inout] an item placed where it was allowed (a stool on a room's way, checked by the way flood) */
      if ((a.h || 0) > 0.85) for (const w of P.windows) if (w.k === a.k && w.room === room && rOv(a, pWinZone(w), 0.02)) out.push(a.id + ' stands in front of a window');
      for (const h of P.holes) if (h.k === a.k && rOv(a, h.r, 0.01)) out.push(a.id + ' stands in a stairwell');
      if (Math.abs((a.y0 || 0) - (P.lv[a.k].y + (a.lift || 0))) > 0.001) out.push(a.id + ' is not on the floor');
    }
  }
  for (let i = 0; i < P.wallItems.length; i++) {
    const a = P.wallItems[i], wl = a.wall;
    for (const op of wl.open) { const hw = op.type === 'door' ? op.hw : 0.8; if (a.u0 < op.pos + hw && a.u1 > op.pos - hw && (op.type === 'door' || (a.y1 > 0.85 && a.y0 < 2.4))) out.push(a.id + ' hangs over a ' + op.type); }
    for (let j = i + 1; j < P.wallItems.length; j++) { const b = P.wallItems[j]; if (b.wall === wl && b.side === a.side && a.u0 < b.u1 && a.u1 > b.u0 && a.y0 < b.y1 && a.y1 > b.y0) out.push(a.id + ' overlaps ' + b.id + ' on a wall'); }
  }
  for (const s of P.stairs) {
    const ra = pRoomAt(P, s.k0, s.lowPt[0], s.lowPt[1]), rb = pRoomAt(P, s.k1, s.highPt[0], s.highPt[1]);
    if (!ra) out.push('stair ' + s.name + ' starts outside every room'); if (!rb) out.push('stair ' + s.name + ' arrives outside every room');
    if (ra && !rIn(rectOf(s.lowPt[0], s.lowPt[1], 0.6, 0.6), ra.in)) out.push('stair ' + s.name + ' starts against a wall');
    if (rb && !rIn(rectOf(s.highPt[0], s.highPt[1], 0.6, 0.6), rb.in)) out.push('stair ' + s.name + ' arrives against a wall');
    for (const it of P.items) if (it.kind === 'floor' && it.k === s.k1 && rOv(it, rectOf(s.highPt[0], s.highPt[1], 0.8, 0.8))) out.push(it.id + ' blocks the top of ' + s.name);
    if (s.low && s.hole && (s.k1 - s.k0) !== 1) out.push('stair ' + s.name + ' skips a level');
    // [c3] headroom: the opening in the slab above must cover the whole run (the head of someone jumping on any tread stays clear of the slab) and every tread needs 2.1 m + a jump of clearance below the slab edge it passes under
    if (s.hole && s.low && !(s.hole.x0 <= s.low.x0 + 1e-6 && s.hole.x1 >= s.low.x1 - 1e-6 && s.hole.z0 <= s.low.z0 + 1e-6 && s.hole.z1 >= s.low.z1 - 1e-6)) out.push('stair ' + s.name + ': the opening above does not cover the run (headroom)');
    { const Lk = P.lv[s.k1], La = P.lv[s.k0]; if (Lk && La && s.run / s.n < 0.18) out.push('stair ' + s.name + ': tread too short'); if (Lk && Lk.y - La.y - (La.H || 0) > 0.6) out.push('stair ' + s.name + ': slab thicker than expected'); }
  }
  // every room reachable from the street door: doorways and stairs as edges
  const seen = new Set(), todo = [];
  for (const d of P.doors) if (d.b === null && !d.upper) { seen.add(d.a); todo.push(d.a); }
  while (todo.length) {
    const id = todo.pop();
    for (const d of P.rooms[id].doors) { const o = d.a === id ? d.b : d.a; if (o && !seen.has(o)) { seen.add(o); todo.push(o); } }
    for (const l of (P.ladders || [])) { const ra = pRoomAt(P, l.k0, l.a[0], l.a[1]), rb = pRoomAt(P, l.k1, l.b[0], l.b[1]); if (ra && rb) for (const [p, q] of [[ra, rb], [rb, ra]]) if (p.id === id && !seen.has(q.id)) { seen.add(q.id); todo.push(q.id); } }      /* [inout] a ladder to a loft */
    for (const s of P.stairs) { const ra = pRoomAt(P, s.k0, s.lowPt[0], s.lowPt[1]), rb = pRoomAt(P, s.k1, s.highPt[0], s.highPt[1]); if (ra && rb) { if (ra.id === id && !seen.has(rb.id)) { seen.add(rb.id); todo.push(rb.id); } if (rb.id === id && !seen.has(ra.id)) { seen.add(ra.id); todo.push(ra.id); } } }
  }
  for (const id in P.rooms) if (!seen.has(id)) out.push('room ' + id + ' cannot be reached from the street door');
  for (const id in P.rooms) { const r = P.rooms[id]; if (r.kind === 'closet' || r.kind === 'corridor') continue; if (!r.doors.length && !P.stairs.length) out.push('room ' + id + ' has no door'); }
  for (const id in P.rooms) { const r = P.rooms[id]; if (r.k === 0 && r.kind === 'corridor' && Math.min(r.x1 - r.x0, r.z1 - r.z0) < 1.5) out.push('corridor ' + id + ' is narrower than 1.1 m clear'); }
  // [c4] sleepers: every resident scheduled to lie down in this building has a bed anchor of their own (a spot that lies), in a room reachable from the street door
  { const own = {}; for (const d of NPC_DEFS) for (const r of d.sched) { if (r[2] !== 'lie') continue; for (const sp of [].concat(r[1])) if (typeof sp === 'string' && sp.startsWith(P.id + '.')) {
      const w = World.spots[sp]; if (!w || !w.lie) out.push(d.id + ' sleeps at ' + sp + ' which is not a bed anchor'); else { if (own[sp] && own[sp] !== d.id) out.push(d.id + ' and ' + own[sp] + ' share the bed ' + sp); own[sp] = d.id; const rm = pRoomAt(P, w.k || 0, ...(() => { const q = P.spots[sp.slice(P.id.length + 1)]; return q ? [q.x, q.z] : [0, 0]; })()); if (rm && !seen.has(rm.id)) out.push(sp + ' is in an unreachable room'); } } } }
  // lit: every room has a window, a hearth, a candle or a lamp
  for (const id in P.rooms) { const r = P.rooms[id]; if (!P.lightIn || !P.lightIn[id]) out.push('room ' + id + ' has no visible light source'); }
  return out;
}

// [inout] test/inout.js compares the drawn shell with the plan: with --opt audit=1 the openings every generated wall was built from are kept (73d_infill.js infWalls is wrapped, not changed)
if (TEST && TEST.audit) { const _iw = infWalls; infWalls = function (B, MS, o) { try { (window.__AUDIT_SHELL = window.__AUDIT_SHELL || []).push({ M: MS.clone(), w: o.w, d: o.d, fl: o.fl, H: o.H || 3, lo: !!o.lo, jetty: o.jetty || 0, plan: JSON.parse(JSON.stringify(o.plan || [])) }); } catch (e) { } return _iw.apply(this, arguments); }; }

// ───────────────────────── [inout] the shell as the plan sees it ─────────────────────────
// Inside and outside are the same building: a plan takes its windows, its upper doors and its balcony from what the shell really shows. kitShell (71_kithouse.js) is
// wrapped, not changed: while it lays a building's village shell every piece it places is noted, and shellOpenings() reads the window, door and balcony pieces back
// in the house's own frame (front wall at -z; `u` = metres from the middle of the house on the front and back, from the front wall on the sides).
const SHELL_REC = {};
{ const _ks = kitShell; kitShell = function (c) {
  if (typeof infKitWalls === 'function' && !infKitWalls.__inout) { const _iw = infKitWalls; infKitWalls = function (cc, b, MS, frames, zone, sy, R, pass) { const r = _iw.apply(this, arguments); return r; }; infKitWalls.__inout = 1;
    const _w = infWalls; infWalls = function (B, MS, o) { if (SHELL_CUR && SHELL_CUR.pass !== 'int' && o && o.plan) SHELL_GEN[SHELL_CUR.id] = { w: o.w, d: o.d, fl: o.fl, H: o.H || 3, plan: JSON.parse(JSON.stringify(o.plan)) }; return _w.apply(this, arguments); }; }
  SHELL_CUR = { id: c.site.id, pass: 'ext' };
  const kb = Kit.batch, rec = SHELL_REC[c.site.id] = [];
  Kit.batch = function (o) { const B = kb.call(Kit, o), ad = B.add; B.add = function (name, xf, oo) { if (!(oo && oo.zone) && /^Window_|^Door_\d|^DoorFrame_|^Balcony_|^Floor_|^gen_(dress|dormer|cross|fbox)_/.test(name)) rec.push({ name, M: Kit.matrix(xf).clone() }); return ad.apply(this, arguments); }; return B; };
  try { return _ks.apply(this, arguments); } finally { Kit.batch = kb; SHELL_CUR = null; } }; }
let SHELL_CUR = null; const SHELL_GEN = {};      /* [inout] the openings a generated wall (73d_infill.js infWalls) was built from, by house */
// every window, door, balcony and floor piece placed out of doors, wherever it is drawn (the alley's facades are drawn by 73b_alley.js, not by kitShell)
const SHELL_ALL = [];
if (typeof Kit !== 'undefined' && Kit.batch && !Kit.batch.__inoutAll) { const kb0 = Kit.batch; Kit.batch = function (o) { const B = kb0.call(Kit, o), ad = B.add; B.add = function (name, xf, oo) { if (!(oo && oo.zone) && /^Window_|^Door_\d|^DoorFrame_|^Balcony_|^Floor_WoodDark_Half|^gen_(dress|dormer|cross|fbox)_/.test(name)) SHELL_ALL.push({ name, M: Kit.matrix(xf).clone() }); return ad.apply(this, arguments); }; return B; }; Kit.batch.__inoutAll = 1; }
function shellOpenings(c) {
  { const A = typeof ALLEY_SHOPS !== 'undefined' && ALLEY_SHOPS.find(q => q.id === c.site.id && q.layout); if (A) return alleyOpenings(A, c); }
  let rec = SHELL_REC[c.site.id] || [];      /* (a footprint search over every placed piece caught the next house's windows: the alley, which needed it, has its own rule) */
  if (false && !rec.some(r => !/^gen_/.test(r.name))) { const st = c.xsite || c.site, hw = c.w / 2 + 1.3, hd = c.d / 2 + 1.3; rec = rec.concat(SHELL_ALL.filter(r => { const e = r.M.elements, l = worldToSite(st, e[12], e[14]); return Math.abs(l[0]) < hw && Math.abs(l[1]) < hd && Math.abs(e[13] - (c.xFloorY !== undefined ? c.xFloorY : st.y || 0)) < 14; })); }
  const inv = new THREE.Matrix4().fromArray(c.Mx).invert(), v = new THREE.Vector3(), w = c.w, d = c.d, H = c.H, raw = [];
  const glass = [];      /* windows drawn in generated pieces (an end wall's face, a dormer, a gable): each upright glass quad, as a box */
  const Mw = new THREE.Matrix4().fromArray(c.Mx), cw = new THREE.Vector3(0, 0, 0).applyMatrix4(Mw), mine = new Set(rec);
  const genAll = rec.filter(r => /^gen_/.test(r.name)).concat(SHELL_ALL.filter(r => /^gen_/.test(r.name) && !mine.has(r) && Math.hypot(r.M.elements[12] - cw.x, r.M.elements[14] - cw.z) < 40).map(r => Object.assign({ far: true }, r)));      /* [inout] windows given to blank walls after the shell was laid (Build 86): read off every generated piece, kept when on this house's own walls */
  for (const r of genAll) { const p = Kit.pieces[r.name]; if (!p) continue;
    for (const q of p.prims) { if (!/Glass/.test(q.mat && (q.mat.name || q.mat))) continue; const ps = q.pos, ix = q.idx; if (!ps || !ix) continue;
      for (let i = 0; i + 5 < ix.length; i += 6) { let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (const vi of [ix[i], ix[i + 1], ix[i + 2], ix[i + 5]]) { v.set(ps[vi * 3], ps[vi * 3 + 1], ps[vi * 3 + 2]).applyMatrix4(r.M).applyMatrix4(inv); mn = [Math.min(mn[0], v.x), Math.min(mn[1], v.y), Math.min(mn[2], v.z)]; mx = [Math.max(mx[0], v.x), Math.max(mx[1], v.y), Math.max(mx[2], v.z)]; }
        if (mx[1] - mn[1] > 0.3 && (!r.far || (Math.abs((mn[0] + mx[0]) / 2) < w / 2 + 0.35 && Math.abs((mn[2] + mx[2]) / 2) < d / 2 + 0.35 && Math.min(Math.abs(Math.abs((mn[0] + mx[0]) / 2) - w / 2), Math.abs(Math.abs((mn[2] + mx[2]) / 2) - d / 2)) < 0.35 && (mn[1] + mx[1]) / 2 > -0.5 && (mn[1] + mx[1]) / 2 < H + 9))) glass.push({ name: 'Window_gen', mn, mx }); } } }
  for (const r of rec.filter(q => !/^gen_/.test(q.name)).concat(glass)) {
    const p = r.mn ? { min: [0, 0, 0], max: [0, 0, 0] } : Kit.pieces[r.name]; if (!p) continue; let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    if (r.mn) { mn = r.mn; mx = r.mx; } else for (let i = 0; i < 8; i++) { v.set(i & 1 ? p.max[0] : p.min[0], i & 2 ? p.max[1] : p.min[1], i & 4 ? p.max[2] : p.min[2]).applyMatrix4(r.M).applyMatrix4(inv); mn = [Math.min(mn[0], v.x), Math.min(mn[1], v.y), Math.min(mn[2], v.z)]; mx = [Math.max(mx[0], v.x), Math.max(mx[1], v.y), Math.max(mx[2], v.z)]; }
    const x = (mn[0] + mx[0]) / 2, z = (mn[2] + mx[2]) / 2, ds = { front: Math.abs(z + d / 2), back: Math.abs(z - d / 2), left: Math.abs(x + w / 2), right: Math.abs(x - w / 2) }; let wall = 'front'; for (const k in ds) if (ds[k] < ds[wall]) wall = k;
    const kind = /^Window_/.test(r.name) ? 'win' : /^Balcony_/.test(r.name) ? 'balc' : /^Floor_/.test(r.name) ? 'floor' : 'door', fb = wall === 'front' || wall === 'back';
    raw.push({ name: r.name, y1: mx[1], kind, wall, u: fb ? x : z + d / 2, u0: fb ? mn[0] : mn[2] + d / 2, u1: fb ? mx[0] : mx[2] + d / 2, y: (mn[1] + mx[1]) / 2, y0: mn[1], out: fb ? Math.max(Math.abs(mn[2]), Math.abs(mx[2])) - d / 2 : Math.max(Math.abs(mn[0]), Math.abs(mx[0])) - w / 2, win: /Thin_Round/.test(r.name) ? 'Thin_Round' : /Wide_Round/.test(r.name) ? 'Wide_Round' : 'Wide_Flat' });
  }
  { const g = SHELL_GEN[c.site.id]; if (g) for (let k = 0; k < g.plan.length; k++) for (const wn of ['front', 'back', 'left', 'right']) for (const o of ((g.plan[k] || {})[wn] || [])) {      /* the generated walls' own openings */
      const uc = (o.u0 + o.u1) / 2, fb = wn === 'front' || wn === 'back', u = wn === 'front' ? g.w / 2 - uc : wn === 'back' ? -g.w / 2 + uc : wn === 'left' ? uc : g.d - uc, y0 = k * g.H + o.v0, y1 = k * g.H + o.v1;
      raw.push({ name: o.door ? 'DoorFrame_gen' : 'Window_gen', kind: o.door ? 'door' : 'win', wall: wn, u, u0: u - (o.u1 - o.u0) / 2, u1: u + (o.u1 - o.u0) / 2, y: (y0 + y1) / 2, y0, y1, out: 0, win: (o.u1 - o.u0) < 0.8 ? 'Thin_Round' : 'Wide_Flat' }); } }
  const out = [];      // frame and leaf, the two corners of one balcony: one thing
  for (const f of raw) { const m = out.find(g => g.kind === f.kind && g.wall === f.wall && Math.abs(g.u - f.u) < (f.kind === 'balc' || f.kind === 'floor' ? 2.6 : 0.7) && Math.abs(g.y - f.y) < 1.2); if (m) { if (f.kind === 'balc' || f.kind === 'floor') { m.y1 = Math.max(m.y1, f.y1); m.u0 = Math.min(m.u0, f.u0); m.u1 = Math.max(m.u1, f.u1); m.u = (m.u0 + m.u1) / 2; m.out = Math.max(m.out, f.out); } else if (/^DoorFrame/.test(f.name || '')) m.u = f.u; m.y0 = Math.min(m.y0, f.y0); } else out.push(f); }
  { const M = new THREE.Matrix4().fromArray(c.Mx), nrm = { front: [0, -1], back: [0, 1], left: [-1, 0], right: [1, 0] };      /* a window or door that opens into the house standing against this wall is not one */
    for (const f of out) { const fb = f.wall === 'front' || f.wall === 'back', n = nrm[f.wall], lx = fb ? f.u : n[0] * (w / 2 + 0.5), lz = fb ? n[1] * (d / 2 + 0.5) : f.u - d / 2; v.set(lx, 1, lz).applyMatrix4(M);
      for (const st of Object.values(typeof SITE !== 'undefined' ? SITE : {})) { if (!st || st.x === undefined || st.yaw === undefined || st === c.site || st === c.xsite || !st.w || st.id === c.site.id) continue; const l = worldToSite(st, v.x, v.z); if (Math.abs(l[0]) < st.w / 2 - 0.05 && Math.abs(l[1]) < st.d / 2 - 0.05) { f.blocked = st.id; break; } } } }
  for (const f of out) f.lv = f.kind === 'win' ? (f.y < H ? 0 : 1 + Math.floor((f.y - H) / 3)) : (f.y0 < 1.6 ? 0 : Math.max(1, Math.round((f.y0 - H) / 3) + 1));
  return out;
}
// the shell's windows as the plan's own (P.wins), the plan's ground floor being the rectangle box = { x0, z0, x1, z1 } and the shell w x d: places scale with the walls.
// keep(f, pos) may move or drop one (return a number, or false). Call before pLayout.
function pShellWins(P, c, box, keep) {
  const sx = (box.x1 - box.x0) / c.w, sz = (box.z1 - box.z0) / c.d, cx = (box.x0 + box.x1) / 2; P.wins = []; P.shell = { box, sx, sz, cx, list: shellOpenings(c) };
  P.shell.pos = f => f.wall === 'front' || f.wall === 'back' ? cx + f.u * sx : box.z0 + f.u * sz;
  const turn = pShellTurn(P, c, box);      /* [inout] a plan turned against its shell (the mill: its door on the shell's side wall) */
  for (const f0 of P.shell.list) { if (f0.kind !== 'win' || !P.lv[f0.lv]) continue; if (f0.blocked) { (P.blockedWins = P.blockedWins || []).push(f0); continue; } const f = turn ? turn(f0) : f0; let pos = Math.round((turn ? f.pos : P.shell.pos(f)) * 4) / 4; pos = pWinSnap(P, f, pos); if (keep) { const r = keep(f, pos); if (r === false) continue; if (typeof r === 'number') pos = r; } P.wins.push({ k: f.lv, face: f.wall, pos, kind: f.win }); }
  return P.shell;
}
// An upper door the shell shows (f, from shellOpenings) becomes a door of the room behind it: call before pLayout. pBalconies() after it makes the way through: the
// door inside leads out onto the shell's own balcony in the town and back (as the street door does), and the balcony gets a floor to stand on and rails that hold.
function pUpperDoor(P, room, f, pos) {
  const fb = f.wall === 'front' || f.wall === 'back', x = fb ? pos : (f.wall === 'left' ? room.x0 : room.x1), z = fb ? (f.wall === 'front' ? room.z0 : room.z1) : pos;
  const d = pDoor(P, room.id, null, x, z, { upper: true, shell: f }); return d;
}
function pBalconies(P, c) {
  const id = c.site.id, cid = c.cell ? c.cell.id : id, yawTo = (a, b) => Math.atan2(b[0] - a[0], -(b[2] - a[2])), mm = { m: c.Mx };
  for (const d of P.doors) {
    if (!d.upper || !d.wall) continue; const f = d.shell, L = P.lv[d.k], wl = d.wall, hor = wl.ax === 'x', inn = -wl.ns;
    const nrm = { front: [0, -1], back: [0, 1], left: [-1, 0], right: [1, 0] }[f.wall], fb = f.wall === 'front' || f.wall === 'back', half = fb ? c.d / 2 : c.w / 2;
    const fl = (P.shell ? P.shell.list : shellOpenings(c)).find(g => g.kind === 'floor' && g.wall === f.wall && g.lv === f.lv && f.u > g.u0 - 0.3 && f.u < g.u1 + 0.3) || (P.shell ? P.shell.list : []).find(g => g.kind === 'balc' && g.wall === f.wall);
    if (!fl) { P.err.push('upper door on the ' + f.wall + ' has no balcony outside'); continue; }
    const yT = fl.kind === 'floor' ? fl.y1 : c.H + 0.06, wo = fl.wallOff || 0, out = Math.max(wo + 0.8, fl.out), loc = (u, o) => fb ? [u, nrm[1] * (half + o)] : [nrm[0] * (half + o), u - c.d / 2];      /* wallOff: an upper storey that juts over the street (the alley) */
    const st = loc(f.u, wo + Math.min(0.6, (out - wo) * 0.55)), dc = loc(f.u, wo + 0.05), wS = m4.tp(c.Mx, [st[0], yT, st[1]]), wD = m4.tp(c.Mx, [dc[0], yT, dc[1]]);
    // the balcony out of doors: a floor and three rails
    const a = loc(fl.u0, wo), b = loc(fl.u1, out); addFloor(mm, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), yT);
    const rail = (p, q) => addBoxCollider(mm, Math.min(p[0], q[0]) - 0.06, Math.min(p[1], q[1]) - 0.06, Math.max(p[0], q[0]) + 0.06, Math.max(p[1], q[1]) + 0.06, yT - 0.1, yT + 1.15);
    rail(loc(fl.u0, out), loc(fl.u1, out)); rail(loc(fl.u0, wo + 0.1), loc(fl.u0, out)); rail(loc(fl.u1, wo + 0.1), loc(fl.u1, out));
    // the two ends of the way through
    const ix = hor ? d.x : d.x + inn * 0.9, iz = hor ? d.z + inn * 0.9 : d.z, pin = P.w2(ix, L.y + 0.03, iz), pdr = P.w2(d.x, L.y + 0.03, d.z);
    const outD = { p: wS, yaw: yawTo(wD, wS), cell: null, name: 'The balcony of ' + c.site.name }, inD = { p: pin, yaw: yawTo(pdr, pin), cell: cid, name: c.site.name };
    World.interact.push({ kind: 'portal', id: 'door.' + cid + '.balcony.out', p: [pdr[0], pdr[1] + 1.1, pdr[2]], r: 1.9, zone: P.zone, cell: cid, label: 'Step out onto the balcony', dest: outD, side: 'in' });
    World.interact.push({ kind: 'portal', id: 'door.' + cid + '.balcony.in', p: [wD[0], wD[1] + 1.1, wD[2]], r: 1.7, zone: 0, cell: cid, label: 'Go in', dest: inD, side: 'out' });
    d.balcony = { out: outD, in: inD, floor: fl };
  }
}

// [fin] light by household: called by planBuild after pLightCut (request to the interiors session, docs/FINISH.md). A cottage keeps its hearth and one rushlight, low and amber; a tradesman's lights are a little stronger; the merchant, the inn and the great houses keep full strength and the warmest colour. Daylight stand-ins are left alone.
function pLightTone(P) {
  const id = P.id, tier = /^(in|hunter|fisher|farm)\b/.test(id) ? 0 : /^(inn|elder|high\.|store|chapel)/.test(id) ? 2 : 1, K = [[0.72, 0.8], [0.9, 0.95], [1, 1.05]][tier];
  for (const l of World.lights) { if (l.zone !== P.zone || l.kind === 'daylight' || l.kind === 'dual' || !l.c) continue; l.r *= K[0]; l.c = [l.c[0] * K[1], l.c[1] * K[1] * (tier === 0 ? 0.92 : 1), l.c[2] * K[1] * (tier === 0 ? 0.8 : 1)]; if (tier === 0 && l.kind === 'fire' && l.r < 9 && P.hearths && P.hearths.length) l.r *= 0.9; }
  P.lightTier = tier;
}

// [inout] the plan's ground rectangle for a shell: W x D on the 0.5 m grid, as near 1.5 times the shell's area as the grid allows without passing it, the shell's own
// proportion, and laid so that the street door (plan x = 0) stands where the shell has it. Returns { x0, z0, x1, z1, W, D, sx, sz }.
function pFitBox(c, o) {
  o = o || {}; const cap = (o.cap || 1.5) * c.w * c.d, k = Math.sqrt(o.cap || 1.5); let best = null;
  for (let W = Math.max(4, Math.floor(c.w * k * 2 + 1) / 2); W >= c.w; W -= 0.5) for (let D = Math.max(4, Math.floor(c.d * k * 2 + 1) / 2); D >= c.d; D -= 0.5) { if (W * D > cap + 1e-6) continue; const sc = W * D - 40 * Math.abs(W / D - c.w / c.d); if (!best || sc > best.sc) best = { W, D, sc }; }
  const W = o.W || best.W, D = o.D || best.D, door = shellOpenings(c).find(f => f.kind === 'door' && f.lv === 0 && f.wall === 'front'), du = door ? door.u : (c.site.doorPos || 0);
  const x0 = Math.round((-W / 2 - du * W / c.w) * 2) / 2; return { x0, z0: 0, x1: x0 + W, z1: D, W, D, sx: W / c.w, sz: D / c.d };
}
// [inout] a kit piece by name as a piece of furniture (docs/ROOMS.md names them): its footprint is its own box; back to a wall (o.side, sides in order of preference,
// o.at along it) or free on the floor near o.near; o.turn turns the piece about its own middle (PI where its front is its -z), o.sc scales it, o.top = [[piece, x, z, sc, ry]..] stands things on it
function pPiece(P, room, name, o) {
  o = o || {}; const p = Kit.pieces[name]; if (!p) { (P.missing = P.missing || []).push(name); return null; }
  const sc = o.sc || 1, turn = o.turn || 0, q = Math.abs(Math.sin(turn)) > 0.7, bw = (p.max[0] - p.min[0]) * sc, bd = (p.max[2] - p.min[2]) * sc, w = q ? bd : bw, d = q ? bw : bd, h = (p.max[1] - p.min[1]) * sc, cx = (p.min[0] + p.max[0]) / 2 * sc, cz = (p.min[2] + p.max[2]) / 2 * sc;
  const draw = m => { at(m, 0, 0, 0, turn, () => { if (o.lit) kitLit(m, name, -cx, -p.min[1] * sc, -cz, sc, 0, { r: o.lit === true ? 5.5 : o.lit, c: [2.2, 1.35, 0.6], kind: 'candle' }); else kp(m, name, -cx, -p.min[1] * sc, -cz, sc, 0); }); for (const t of (o.top || [])) { const tp = Kit.pieces[t[0]]; if (!tp) continue; const ts = t[3] || 1; if (t[5]) kitLit(m, t[0], t[1], h - tp.min[1] * ts, t[2], ts, t[4] || 0, { r: 5.5, c: [2.2, 1.35, 0.6], kind: 'candle' }); else kp(m, t[0], t[1], h - tp.min[1] * ts, t[2], ts, t[4] || 0); } if (h > 0.3 && !o.soft) addBoxCollider(m, -w / 2, -d / 2, w / 2, d / 2, 0, Math.min(h, 2)); };
  const id = P.id + '.' + (o.id || name) + '_' + P.items.length, opt = Object.assign({ lowOk: h <= 0.6 }, o.opt || {}); if (h > 0.85) opt.lowOk = false;      /* the validator's height for a thing in front of a window */ if (o.at !== undefined) opt.at = o.at;
  let r = null; for (const sd of [].concat(o.side || [])) { r = pAgainst(P, room, sd, id, w, d, h, -1, draw, opt); if (r) break; }
  if (!r && (o.near || !o.side)) r = pFree(P, room, id, w, d, h, o.rot || 0, draw, Object.assign({ near: o.near || pCentre(room) }, opt));
  if (!r) (P.unplaced = P.unplaced || []).push(room.id + ':' + name); else if (o.lit || (o.top || []).some(t => t[5])) P.lightIn[room.id] = 1;
  return r;
}
// [inout] a window keeps clear of the room's corners and of a partition that meets the outside wall: moved along the wall into the room it falls in, at most 1 m
// [inout] when the plan's front is not the shell's front: returns f -> { ...f, wall (the plan's face), pos (along the plan's wall, scaled onto box) }, else null
function pShellTurn(P, c, box) {
  if (!P.w2 || !c.Ms) return null; const iM = new THREE.Matrix4().fromArray(c.Ms).invert(), g = (x, z) => { const w = P.w2(x, 0, z), v = new THREE.Vector3(w[0], w[1], w[2]).applyMatrix4(iM); return [v.x, v.z]; };
  const O = g(0, 0), X = g(1, 0).map((v, i) => v - O[i]), Z = g(0, 1).map((v, i) => v - O[i]); if (Math.abs(X[0]) > 0.7) return null;
  const toP = (sx, sz) => [(sx - O[0]) * X[0] + (sz - O[1]) * X[1], (sx - O[0]) * Z[0] + (sz - O[1]) * Z[1]], w = c.w, d = c.d;
  const cs = [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].map(q => toP(q[0], q[1])), px0 = Math.min(...cs.map(q => q[0])), px1 = Math.max(...cs.map(q => q[0])), pz0 = Math.min(...cs.map(q => q[1])), pz1 = Math.max(...cs.map(q => q[1]));
  return f => { const fb = f.wall === 'front' || f.wall === 'back', s = fb ? [f.u, (f.wall === 'front' ? -1 : 1) * d / 2] : [(f.wall === 'left' ? -1 : 1) * w / 2, f.u - d / 2], p = toP(s[0], s[1]);
    const n = { front: [0, -1], back: [0, 1], left: [-1, 0], right: [1, 0] }[f.wall], nx = n[0] * X[0] + n[1] * X[1], nz = n[0] * Z[0] + n[1] * Z[1], wall = Math.abs(nx) > Math.abs(nz) ? (nx < 0 ? 'left' : 'right') : (nz < 0 ? 'front' : 'back');
    const pfb = wall === 'front' || wall === 'back', pos = pfb ? box.x0 + (p[0] - px0) / (px1 - px0) * (box.x1 - box.x0) : box.z0 + (p[1] - pz0) / (pz1 - pz0) * (box.z1 - box.z0);
    return Object.assign({}, f, { wall, pos }); };
}
function pWinSnap(P, f, pos) {
  const fb = f.wall === 'front' || f.wall === 'back', rs = Object.values(P.rooms).filter(r => r.k === f.lv && (fb ? (f.wall === 'front' ? Math.abs(r.z0 - P.shell.box.z0) < 0.6 : Math.abs(r.z1 - P.shell.box.z1) < 0.6) : (f.wall === 'left' ? Math.abs(r.x0 - P.shell.box.x0) < 0.6 : Math.abs(r.x1 - P.shell.box.x1) < 0.6)));
  const lo = r => fb ? r.x0 : r.z0, hi = r => fb ? r.x1 : r.z1, r = rs.find(q => pos >= lo(q) && pos <= hi(q)) || rs.sort((a, b) => Math.min(Math.abs(pos - lo(a)), Math.abs(pos - hi(a))) - Math.min(Math.abs(pos - lo(b)), Math.abs(pos - hi(b))))[0]; if (!r) return pos;
  const a = lo(r) + 1.15, b = hi(r) - 1.15; if (a > b) return Math.round((lo(r) + hi(r)) * 2) / 4; const q = Math.min(b, Math.max(a, pos)); return Math.abs(q - pos) <= 0.55 ? Math.round(q * 4) / 4 : pos;      /* at most half a metre: further and the window inside is not the window outside */
}
// [inout] an alley shop's front as 73b_alley.js draws it (the facade is drawn after the plans are built, so it is read from the same rule): the ground storey's bays
// from `layout` (W window, D door), each upper storey a window on every other bay, a balcony door in the middle bay of the first floor where `balcony` is set
function alleyOpenings(a, c) {
  const w = a.w, n = Math.round(w / 2), H = 3, out = [];
  for (let k = 0; k < (a.floors || 2); k++) for (let i = 0; i < n; i++) {
    const uc = i * 2 + 1, x = w / 2 - uc, ch = a.layout[Math.min(i, a.layout.length - 1)];
    if (k === 0) out.push(ch === 'D' ? { kind: 'door', wall: 'front', u: x, u0: x - 0.55, u1: x + 0.55, y: 1.1, y0: 0, y1: 2.2, lv: 0, out: 0, name: 'DoorFrame_alley' } : { kind: 'win', wall: 'front', u: x, u0: x - 0.6, u1: x + 0.6, y: 1.7, y0: 1.0, y1: 2.4, lv: 0, out: 0, win: 'Wide_Flat', name: 'Window_alley' });
    else if (a.balcony && k === 1 && i === (n >> 1)) { out.push({ kind: 'door', wall: 'front', u: x, u0: x - 0.55, u1: x + 0.55, y: k * H + 1.1, y0: k * H, y1: k * H + 2.2, lv: 1, out: 0, name: 'DoorFrame_alley' }); out.push({ kind: 'floor', wall: 'front', u: x, u0: x - 2.1, u1: x + 2.1, y: k * H, y0: k * H - 0.14, y1: k * H + 0.04, lv: 1, out: 1.6, wallOff: 0.5, name: 'gen_balc' }); }
    else if ((i + k) % 2 === 0) out.push({ kind: 'win', wall: 'front', u: x, u0: x - 0.6, u1: x + 0.6, y: k * H + 1.7, y0: k * H + 1.0, y1: k * H + 2.4, lv: k, out: 0, win: 'Wide_Flat', name: 'Window_alley' });
  }
  return out;
}

// [inout] a ladder through a trap door from level k0 to the loft above (k0 + 1): against the wall `side` ('w' or 'e') of the room below, `z` along that wall.
// Drawn by inoutLadder / inoutTrap (71b_storeys.js); the opening is a hole in the loft's floor; climbed by a prompt at either end (a portal inside the cell).
function pLadder(P, k0, side, z) {
  const L0 = P.lv[k0], L1 = P.lv[k0 + 1], below = Object.values(P.rooms).find(r => r.k === k0 && z > r.z0 && z < r.z1 && (side === 'w' ? true : true)); if (!L0 || !L1 || !below) return null;
  const sg = side === 'w' ? 1 : -1, xw = side === 'w' ? below.in.x0 : below.in.x1, h = L1.y - L0.y, lean = h / Math.tan(75 * PI / 180), tw = 0.9, td = 0.8;
  const trap = side === 'w' ? { x0: xw, x1: xw + tw, z0: z - td / 2, z1: z + td / 2 } : { x0: xw - tw, x1: xw, z0: z - td / 2, z1: z + td / 2 };
  const foot = xw + sg * (0.12 + lean), a = [xw + sg * (lean + 0.75), z], b = [xw + sg * (tw + 0.6), z];
  const lr = { x0: Math.min(xw, foot + sg * 0.1) - 0.05, x1: Math.max(xw, foot + sg * 0.1) + 0.05, z0: z - 0.4, z1: z + 0.4 }, above = pRoomAt(P, k0 + 1, b[0], b[1]);
  if (!above || !pRoomAt(P, k0, a[0], a[1]) || z - 0.6 < below.in.z0 || z + 0.6 > below.in.z1) return null;
  if (P.items.some(it => (it.k === k0 && rOv(it, lr)) || (it.k === k0 + 1 && rOv(it, rGrow(trap, 0.3))))) return null;      /* not over a stair well, not into furniture or a stack */
  if (P.clear.some(q => q.k === k0 && q.kind !== 'stair' && rOv(q, lr))) return null;      /* not across a doorway */
  P.holes.push({ k: k0 + 1, r: trap }); P.occ(k0 + 1, trap, 'hole', P.id + '.trap');
  P.occ(k0, { x0: Math.min(xw, foot + sg * 0.1), x1: Math.max(xw, foot + sg * 0.1), z0: z - 0.35, z1: z + 0.35 }, 'stair', P.id + '.ladder');
  P.clear.push({ x0: Math.min(a[0], foot) - 0.4, x1: Math.max(a[0], foot) + 0.4, z0: z - 0.5, z1: z + 0.5, k: k0, kind: 'stair' }, { x0: Math.min(b[0], trap.x0) - 0.1, x1: Math.max(b[0], trap.x1) + 0.4, z0: z - 0.6, z1: z + 0.6, k: k0 + 1, kind: 'stair' });
  const m = P.c.int; m.m1 = P.zone; m.ao = INT_AO;
  at(m, foot, L0.y + 0.02, z, side === 'w' ? 0 : PI, () => inoutLadder(m, h + 0.02));
  at(m, side === 'w' ? xw : xw, L1.y + 0.02, z, side === 'w' ? 0 : PI, () => inoutTrap(m, tw, td));
  const yaw = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), cid = P.c.cell ? P.c.cell.id : P.id, nm = P.c.site.name;
  const up = { p: P.w2(b[0], L1.y + 0.03, b[1]), yaw: P.yaw + (side === 'w' ? -PI / 2 : PI / 2), cell: cid, name: nm }, dn = { p: P.w2(a[0], L0.y + 0.03, a[1]), yaw: P.yaw + (side === 'w' ? -PI / 2 : PI / 2), cell: cid, name: nm };
  const pf = P.w2(foot, L0.y + 1.2, z), pt = P.w2(xw + sg * 0.45, L1.y + 0.6, z);
  World.interact.push({ kind: 'portal', id: 'ladder.' + cid + '.up', p: pf, r: 1.5, zone: P.zone, cell: cid, label: 'Climb the ladder', dest: up, side: 'in', ladder: true });
  World.interact.push({ kind: 'portal', id: 'ladder.' + cid + '.down', p: pt, r: 1.5, zone: P.zone, cell: cid, label: 'Climb down', dest: dn, side: 'in', ladder: true });
  const l = { k0, k1: k0 + 1, a, b, trap, side, z }; (P.ladders = P.ladders || []).push(l); return l;
}
// [inout] where a body of 0.9 m can walk from the street door (the interiors test asks the same): returns reach(k, x, z, r) = a walkable place within r of (x, z) on level k.
// Benches, stools and chests below 0.52 m are sat on or stepped round, not walls; stairs join their levels at their foot and head.
function pReach(P) {
  const st = 0.15, grid = new Map(), seen = new Set(), q = [], key = (k, i, j) => k * 1e8 + (i + 5000) * 1e4 + (j + 5000);
  const free = (k, x, z) => { const kk = 'f' + key(k, Math.floor(x / 0.05), Math.floor(z / 0.05));      /* a 5 cm cache, as the test's */ if (grid.has(kk)) return grid.get(kk);
    let ok = Object.values(P.rooms).some(r => r.k === k && x > r.in.x0 && x < r.in.x1 && z > r.in.z0 && z < r.in.z1) || P.doors.some(d => d.k === k && d.wall && (d.wall.ax === 'x' ? Math.abs(x - d.x) < d.w / 2 && Math.abs(z - d.z) < 0.35 : Math.abs(z - d.z) < d.w / 2 && Math.abs(x - d.x) < 0.35));
    if (ok) for (const it of P.items) if (it.k === k && !/^(rug|flat|hang|wall|clear|light|hole)$/.test(it.kind || '') && x > it.x0 && x < it.x1 && z > it.z0 && z < it.z1 && !(it.h !== undefined && it.h < 0.52 && it.kind !== 'stair')) { ok = false; break; }
    if (ok) for (const h of P.holes) if (h.k === k && x > h.r.x0 && x < h.r.x1 && z > h.r.z0 && z < h.r.z1) { ok = false; break; }
    grid.set(kk, ok); return ok; };
  const wide = (k, x, z) => { for (const [dx, dz] of [[0, 0], [0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) if (!free(k, x + dx, z + dz)) return false; return true; };
  const push = (k, x, z) => { const kk = key(k, Math.round(x / st), Math.round(z / st)); if (seen.has(kk) || !wide(k, x, z)) return; seen.add(kk); q.push([k, x, z]); };
  const pushNear = (k, x, z) => { for (const [dx, dz] of [[0, 0], [0, -0.15], [0, 0.15], [-0.15, 0], [0.15, 0], [0, -0.3], [0, 0.3], [-0.3, 0], [0.3, 0]]) push(k, x + dx, z + dz); };      /* [inout] a stair end 2 cm too near a wall for the 0.42 m probe still leads on */
  const e = P.doors.find(d => d.b === null && !d.upper); if (e) push(0, e.x, e.z + 0.9);
  for (let n = 0; n < q.length && n < 80000; n++) { const [k, x, z] = q[n]; for (const [dx, dz] of [[st, 0], [-st, 0], [0, st], [0, -st]]) push(k, x + dx, z + dz);
    for (const s of P.stairs) { if (s.k0 === k && Math.hypot(x - s.lowPt[0], z - s.lowPt[1]) < 0.4) pushNear(s.k1, s.highPt[0], s.highPt[1]); if (s.k1 === k && Math.hypot(x - s.highPt[0], z - s.highPt[1]) < 0.4) pushNear(s.k0, s.lowPt[0], s.lowPt[1]); } }
  return (k, x, z, r) => { r = r || 0.3; for (let dx = -r; dx <= r + 0.01; dx += st) for (let dz = -r; dz <= r + 0.01; dz += st) if (seen.has(key(k, Math.round((x + dx) / st), Math.round((z + dz) / st)))) return true; return false; };
}
// [inout] the floor below a stair's head stays clear of anything that rises through it (a fire's stack, a pier): call after pLayout, before the hearths
function pKeepStairHeads(P) { for (const q of P.stairs) { const x0 = Math.min(q.p1, q.p1 + q.dir * 1.4), x1 = Math.max(q.p1, q.p1 + q.dir * 1.4); P.clear.push(q.axis === 'x' ? { x0, x1, z0: q.lat - 0.6, z1: q.lat + 0.6, k: q.k0, kind: 'stair' } : { x0: q.lat - 0.6, x1: q.lat + 0.6, z0: x0, z1: x1, k: q.k0, kind: 'stair' }); } }
