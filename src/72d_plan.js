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
  const WIN = ['Wide_Flat', 'Thin_Round', 'Wide_Round'];
  for (const wl of P.walls) {
    if (!wl.ext || wl.k < 0) continue;
    for (const rid of wl.rooms) {
      const room = P.rooms[rid]; if (!room || room.win === false) continue;
      const lo = Math.max(wl.a, wl.ax === 'x' ? room.x0 : room.z0), hi = Math.min(wl.b, wl.ax === 'x' ? room.x1 : room.z1), L = hi - lo;
      if (L < 2.8) continue;
      const n = Math.max(1, Math.floor(L / 3.0)), pitch = L / n;
      for (let i = 0; i < n; i++) {
        const p = Math.round((lo + pitch * (i + 0.5)) * 2) / 2;
        if (wl.open.some(o => Math.abs(o.pos - p) < o.hw + 1.45) || p - 0.8 < lo + 0.3 || p + 0.8 > hi - 0.3) continue;
        const kind = WIN[Math.abs(Math.round(wl.c * 3 + p * 7)) % 3], o = { type: 'win', pos: p, hw: 0.8, kind };
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
    for (const s of P.stairs) { if (s.k0 === r.k && rOv(s.low, rGrow(r, 0.1))) pts.push(s.lowPt); if (s.k1 === r.k && rOv(s.high, rGrow(r, 0.1))) pts.push(s.highPt); }
    r.pts = pts;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], x0 = Math.min(a[0], b[0]) - 0.45, x1 = Math.max(a[0], b[0]) + 0.45, z0 = Math.min(a[1], b[1]) - 0.45, z1 = Math.max(a[1], b[1]) + 0.45;
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
  s.hole = rect(p0, p1 + d * 0.0, lat - hw, lat + hw);        // the opening in the slab of the level above: the whole run
  s.lowPt = ax === 'x' ? [p0 - d * 0.7, lat] : [lat, p0 - d * 0.7];       // where one stands to start up
  s.highPt = ax === 'x' ? [p1 + d * 0.8, lat] : [lat, p1 + d * 0.8];      // where one stands when arrived
  P.holes.push({ k: s.k1, r: s.hole, stair: s });
  P.clear.push(Object.assign(rect(p0 - d * 1.3, p0, lat - hw - 0.1, lat + hw + 0.1), { k: s.k0, kind: 'stair' }), Object.assign(rect(p1, p1 + d * 1.3, lat - hw - 0.1, lat + hw + 0.1), { k: s.k1, kind: 'stair' }));
  P.occ(s.k0, rect(p0, p1, lat - hw - 0.08, lat + hw + 0.08), 'stair', s.id);            // the steps and stringers on the lower level
  P.occ(s.k1, rect(p0, p1, lat - hw - 0.08, lat + hw + 0.08), 'hole', s.id);            // and the opening above them
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
// the floor in front of a window that tall furniture must leave free
function pWinZone(w) {
  const wl = w.wall, ns = wl.ns, depth = 0.55, hw = 0.95;
  return wl.ax === 'x' ? { x0: w.pos - hw, x1: w.pos + hw, z0: ns < 0 ? wl.c - 0.2 : wl.c - 0.2 - depth, z1: ns < 0 ? wl.c + 0.2 + depth : wl.c + 0.2 } : { x0: ns < 0 ? wl.c - 0.2 : wl.c - 0.2 - depth, x1: ns < 0 ? wl.c + 0.2 + depth : wl.c + 0.2, z0: w.pos - hw, z1: w.pos + hw };
}
// the footprint of a w x d item (w along x, d along z before turning) turned by rot (a multiple of PI/2)
function pFoot(cx, cz, w, d, rot) { const q = Math.abs(Math.round(rot / (PI / 2))) & 1; return q ? rectOf(cx, cz, d, w) : rectOf(cx, cz, w, d); }
// put an item: it is drawn with draw(m) at (cx, cz) turned by rot, on the level's floor (or at y = lift above it), and recorded. Returns the record or null when it does not fit.
function pPut(P, room, name, cx, cz, rot, w, d, h, draw, o) {
  o = o || {}; const r = pFoot(cx, cz, w, d, rot);
  if (!pFit(P, room, r, Object.assign({ h }, o))) return null;
  const L = P.lv[room.k], m = P.c.int; at(m, cx, L.y + 0.02 + (o.lift || 0), cz, rot, () => draw(m));
  const it = pOcc(P, room.k, r, o.flat ? 'rug' : 'floor', name, { h, room: room.id, rot, cx, cz, w, d, y0: L.y + (o.lift || 0), top: o.surface ? h : 0, back: o.back });
  if (o.flat) it.kind = 'rug'; return it;
}
// along a wall of the room, w wide (along the wall) and d deep; o.at: 'start' | 'end' | 'mid' | a coordinate along the wall to be near. Tries every 0.25 m.
function pWallSlot(P, room, side, w, d, o) {
  o = o || {}; const a = room.in, hor = side === 'n' || side === 's', lo = (hor ? a.x0 : a.z0) + w / 2, hi = (hor ? a.x1 : a.z1) - w / 2, pts = [];
  for (let t = lo; t <= hi + 1e-6; t += 0.25) pts.push(t);
  const want = o.at === 'end' ? hi : o.at === 'mid' || o.at === undefined ? (lo + hi) / 2 : o.at === 'start' ? lo : o.at;
  pts.sort((p, q) => Math.abs(p - want) - Math.abs(q - want));
  for (const t of pts) {
    const cz = side === 'n' ? a.z0 + d / 2 : side === 's' ? a.z1 - d / 2 : t, cx = side === 'w' ? a.x0 + d / 2 : side === 'e' ? a.x1 - d / 2 : t;
    const px = hor ? t : cx, pz = hor ? cz : t, r = hor ? rectOf(px, pz, w, d) : rectOf(px, pz, d, w);
    if (pFit(P, room, r, o)) return { cx: px, cz: pz, rect: r };
  }
  return null;
}
// an item with its back to a wall (back = -1: its local -z is the back, as a bed's head; +1: its +z, as a shelf's)
function pAgainst(P, room, side, name, w, d, h, back, draw, o) {
  o = Object.assign({ h }, o || {}); const s = pWallSlot(P, room, side, w, d, o); if (!s) return null;
  return pPut(P, room, name, s.cx, s.cz, rotBack(side, back), w, d, h, draw, Object.assign({}, o, { back: side }));
}
// anywhere free in the room: tries the centre, then rings round it (o.near = [x, z] to start from), o.step 0.25
function pFree(P, room, name, w, d, h, rot, draw, o) {
  o = o || {}; const a = room.in, c0 = o.near || [(a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2], pts = [];
  for (let x = a.x0 + 0.3; x <= a.x1 - 0.3; x += 0.25) for (let z = a.z0 + 0.3; z <= a.z1 - 0.3; z += 0.25) pts.push([x, z]);
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
  for (const it of P.items) if (it.k === room.k && (it.kind === 'floor' || it.kind === 'hearth') && it.back === side && (it.h || 1) > y0 - L.y + 0.02) { const s = hor ? [it.x0, it.x1] : [it.z0, it.z1]; if (rec.u0 < s[1] && rec.u1 > s[0]) return null; }
  const m = P.c.int, p = hor ? [u, side === 'n' ? a.z0 : a.z1] : [side === 'w' ? a.x0 : a.x1, u];
  const rot = rotBack(side, +1);
  at(m, p[0], L.y + y0, p[1], rot, () => draw(m, y1 - y0));
  P.wallItems.push(rec); return rec;
}
const pCentre = r => [(r.in.x0 + r.in.x1) / 2, (r.in.z0 + r.in.z1) / 2];
const pRoomAt = (P, k, x, z) => { for (const id in P.rooms) { const r = P.rooms[id]; if (r.k === k && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r; } return null; };

// ── registration of the things the village looks for: spots, interact points, lights ──
function pSpot(P, name, x, z, yaw, o) {
  o = o || {}; const k = o.k === undefined ? 0 : o.k, L = P.lv[k], y = (o.y === undefined ? 0.02 : o.y) + L.y;
  const p = P.w2(x, y, z); World.spots[P.id + '.' + name] = Object.assign({ p, yaw: yaw + P.yaw, zone: P.zone, site: P.id, k, room: (pRoomAt(P, k, x, z) || {}).id }, o.extra || {});
  P.spots[name] = { x, z, k, yaw, p };
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
      const tile = r.floor === 'stone' ? 'Floor_UnevenBrick' : r.floor === 'cobble' ? 'Floor_UnevenBrick' : 'Floor_WoodDark';
      for (const q of rSubAll({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 }, holes)) {
        const nx = Math.max(1, Math.round((q.x1 - q.x0) / 2)), nz = Math.max(1, Math.round((q.z1 - q.z0) / 2)), sx = (q.x1 - q.x0) / (2 * nx), sz = (q.z1 - q.z0) / (2 * nz);
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) B.add(tile, KH.xf(MS, q.x0 + (i + 0.5) * 2 * sx, L.y + 0.012, q.z0 + (j + 0.5) * 2 * sz, [sx, 1, sz]), FL);
        addFloor(m, q.x0, q.z0, q.x1, q.z1, L.y + 0.02);
      }
      // ceiling slab underside + beams (not over a stairwell)
      const yc = L.y + L.H; m.m1 = zone; m.ao = INT_AO * 0.9; m.mat(r.floor === 'stone' ? MAT.STONE : MAT.PLANKS, r.floor === 'stone' ? [0.8, 0.78, 0.74] : COL.woodDark);
      for (const q of rSubAll({ x0: r.x0 + PW.IN, z0: r.z0 + PW.IN, x1: r.x1 - PW.IN, z1: r.z1 - PW.IN }, above)) m.quad([q.x0, yc, q.z1], [q.x0, yc, q.z0], [q.x1, yc, q.z0], [q.x1, yc, q.z1], 0, 0, (q.x1 - q.x0) / m.tile, (q.z1 - q.z0) / m.tile);
      m.mat(MAT.TIMBER, COL.timberDark); const wide = (r.x1 - r.x0) >= (r.z1 - r.z0), span = wide ? r.z1 - r.z0 : r.x1 - r.x0, len = wide ? r.x1 - r.x0 : r.z1 - r.z0, nb = Math.max(1, Math.round(len / 1.7));
      if (L.H > 2.2) for (let i = 0; i < nb; i++) {
        const t = (wide ? r.x0 : r.z0) + len * (i + 0.5) / nb, bq = wide ? { x0: t - 0.08, x1: t + 0.08, z0: r.z0 + 0.2, z1: r.z1 - 0.2 } : { x0: r.x0 + 0.2, x1: r.x1 - 0.2, z0: t - 0.08, z1: t + 0.08 };
        if (above.some(h => rOv(bq, h))) continue; m.box(bq.x0, yc - 0.2, bq.z0, bq.x1, yc, bq.z1, 8);
      }
    }
  }
  for (const wl of P.walls) pWallEmit(P, wl, B, IN);
  for (const s of P.stairs) pStairEmit(P, s);
}
function pWallEmit(P, wl, B, IN) {
  const L = P.lv[wl.k], H = L.H, sy = H / 3.12, ns = wl.ns, hor = wl.ax === 'x', m = P.c.int;
  const stone = wl.cellar || P.rooms[[...wl.rooms][0]].floor === 'stone' || P.rooms[[...wl.rooms][0]].walls === 'stone', G = stone ? 'Wall_UnevenBrick' : 'Wall_Plaster';
  const fwd = hor ? (ns > 0) : (ns < 0);                       // does u run along +axis?
  const a = wl.a - PW.IN, b = wl.b + PW.IN, len = b - a, sOf = p => fwd ? p - a : b - p;
  const origin = fwd ? a : b, perp = wl.c + 0.11 * ns, O = hor ? [origin, perp] : [perp, origin];
  const nv = hor ? [0, 0, ns] : [ns, 0, 0];          // outward normal; u = up x n = (nz, 0, -nx)
  const F = new THREE.Matrix4().makeBasis(KH.V([nv[2], 0, -nv[0]]), KH.V([0, 1, 0]), KH.V(nv)).setPosition(O[0], L.y, O[1]).premultiply(P.MS);
  const add = (name, uc, s, o) => B.add(name, KH.xf(F, uc, 0, 0, s), o || IN);
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
    if (sp.o.type === 'door') { add(G + '_Door_Flat', sp.s, S); add('DoorFrame_Flat_WoodDark', sp.s, S); }
    else {
      const tbl = { Wide_Flat: ['_Window_Wide_Flat', 'Window_Wide_Flat1'], Thin_Round: ['_Window_Thin_Round', 'Window_Thin_Round1'], Wide_Round: ['_Window_Wide_Round', 'Window_Wide_Round1'] }[sp.o.kind] || ['_Window_Wide_Flat', 'Window_Wide_Flat1'];
      add(G + tbl[0], sp.s, S); add(tbl[1], sp.s, S);
      // the light the window lets in, a little inside it
      const px = hor ? sp.o.pos : wl.c - ns * 0.8, pz = hor ? wl.c - ns * 0.8 : sp.o.pos; pLight(P, px, 1.7 * sy, pz, 5.6, [1.5, 1.42, 1.28], 'daylight', wl.k);
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
    m.mat(MAT.PLANKS, COL.wood); m.box(q[0], y0, q[1], q[2], top, q[3], 4); m.mat(MAT.PLANKS, COL.woodDark, 0.8); m.box(q[0], top - 0.05, q[1], q[2], top, q[3], 4 | (ax === 'x' ? (d > 0 ? 0 : 0) : 0));
  }
  // side boards and a handrail up the open side
  m.mat(MAT.TIMBER, COL.timberDark);
  for (const sg of [-1, 1]) {
    const l = s.lat + sg * (hw + 0.035), top = b.y + 0.02;
    for (let i = 0; i < s.n; i += 1) { const q = R4(s.p0 + d * i * s.tread, s.p0 + d * (i + 1) * s.tread, l - 0.03, l + 0.03); m.box(q[0], y0, q[1], q[2], y0 + (i + 1) * r + 0.05, q[3], 4); }
    // handrail: a sloping beam on posts
    const pa = ax === 'x' ? [s.p0, 0.95 + y0 + 0.4 * r, l] : [l, 0.95 + y0 + 0.4 * r, s.p0], pb = ax === 'x' ? [s.p1, 0.95 + top - 0.4 * r, l] : [l, 0.95 + top - 0.4 * r, s.p1];
    m.beam(pa, pb, 0.05, 0.06);
    for (let i = 0; i <= s.n; i += 3) { const t = Math.min(i, s.n) / s.n, p = s.p0 + d * s.run * t, y = lerp(y0, top, t) + 0.1, q = ax === 'x' ? [p, l] : [l, p]; m.box(q[0] - 0.03, y, q[1] - 0.03, q[0] + 0.03, y + 0.95 + 0.4 * r * (1 - 2 * t) + 0.02, q[1] + 0.03); }
  }
  // the walkable ramp and the sides that keep a player on it (and out from under it)
  const lo = ax === 'x' ? [Math.min(s.p0, s.p1), s.lat - hw - 0.05, Math.max(s.p0, s.p1), s.lat + hw + 0.05] : [s.lat - hw - 0.05, Math.min(s.p0, s.p1), s.lat + hw + 0.05, Math.max(s.p0, s.p1)];
  const yA = a.y + 0.02 + 0.5 * r, yB = b.y + 0.02 - 0.5 * r, lowFirst = d > 0;
  addFloor(m, lo[0], lo[1], lo[2], lo[3], lowFirst ? yA : yB, lowFirst ? yB : yA, ax);
  for (const sg of [-1, 1]) { const l = s.lat + sg * (hw + 0.09), q = R4(s.p0, s.p1, l - 0.06, l + 0.06); addBoxCollider(m, q[0], q[1], q[2], q[3], a.y, b.y + 1.1); }
  { const q = R4(s.p0 - d * 0.0, s.p0 - d * 0.08, s.lat - hw - 0.15, s.lat + hw + 0.15); addBoxCollider(m, q[0], q[1], q[2], q[3], b.y + 0.5, b.y + 1.1); }       // the open end of the stairwell on the upper floor, where a person would walk in
  { const q = R4(s.p1 - d * 0.02, s.p1 + d * 0.06, s.lat - hw, s.lat + hw); addBoxCollider(m, q[0], q[1], q[2], q[3], a.y, b.y - 0.6); }          // the solid end of the steps: no walking in under the landing
  // the stairs are a navigation link
  pSpot(P, s.name + '0', s.lowPt[0], s.lowPt[1], 0, { k: s.k0 }); pSpot(P, s.name + '1', s.highPt[0], s.highPt[1], 0, { k: s.k1 });
  World.stairs.push({ id: P.id + '.' + s.name, site: P.id, bottom: P.id + '.' + s.name + '0', top: P.id + '.' + s.name + '1', via: [], width: s.width, slope: s.rise / s.run, plan: true, k0: s.k0, k1: s.k1 });
}

// ── navigation: room hubs, doorways, stairs ──
// Called from navBuild (77_npc.js) for every planned house. Walls are never crossed: spots join their room's hub, hubs join through doorways, levels through stairs.
function planNav(P, add, link, doorNode) {
  const hub = {}, N = Nav.nodes, L0 = P.lv[0];
  for (const id in P.rooms) { const r = P.rooms[id], p = pCentre(r), L = P.lv[r.k]; hub[id] = add(...P.w2(p[0], L.y + 0.02, p[1])); }
  for (const d of P.doors) {
    const L = P.lv[d.k], k = add(...P.w2(d.x, L.y + 0.02, d.z));
    if (d.b === null) { const dn = doorNode[P.id]; if (dn) { link(dn.i, k); link(k, hub[d.a]); } }
    else { link(hub[d.a], k); link(k, hub[d.b]); }
  }
  const stairSpot = new Set(); for (const s of P.stairs) { stairSpot.add(s.name + '0'); stairSpot.add(s.name + '1'); }
  for (const name in P.spots) { if (stairSpot.has(name)) continue; const sp = P.spots[name], k = Nav.spot[P.id + '.' + name]; if (k === undefined) continue; const r = pRoomAt(P, sp.k, sp.x, sp.z); if (r) link(k, hub[r.id]); }
  for (const s of P.stairs) {
    const a = Nav.spot[P.id + '.' + s.name + '0'], b = Nav.spot[P.id + '.' + s.name + '1']; if (a === undefined || b === undefined) continue;
    const ra = pRoomAt(P, s.k0, s.lowPt[0], s.lowPt[1]), rb = pRoomAt(P, s.k1, s.highPt[0], s.highPt[1]);
    link(a, b); if (ra) link(a, hub[ra.id]); if (rb) link(b, hub[rb.id]);
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
      for (const z of P.clear) if (z.k === a.k && rOv(a, z, 0.02)) out.push(a.id + ' stands in a ' + z.kind + ' clearance');
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
  }
  // every room reachable from the street door: doorways and stairs as edges
  const seen = new Set(), todo = [];
  for (const d of P.doors) if (d.b === null) { seen.add(d.a); todo.push(d.a); }
  while (todo.length) {
    const id = todo.pop();
    for (const d of P.rooms[id].doors) { const o = d.a === id ? d.b : d.a; if (o && !seen.has(o)) { seen.add(o); todo.push(o); } }
    for (const s of P.stairs) { const ra = pRoomAt(P, s.k0, s.lowPt[0], s.lowPt[1]), rb = pRoomAt(P, s.k1, s.highPt[0], s.highPt[1]); if (ra && rb) { if (ra.id === id && !seen.has(rb.id)) { seen.add(rb.id); todo.push(rb.id); } if (rb.id === id && !seen.has(ra.id)) { seen.add(ra.id); todo.push(ra.id); } } }
  }
  for (const id in P.rooms) if (!seen.has(id)) out.push('room ' + id + ' cannot be reached from the street door');
  for (const id in P.rooms) { const r = P.rooms[id]; if (r.kind === 'closet' || r.kind === 'corridor') continue; if (!r.doors.length && !P.stairs.length) out.push('room ' + id + ' has no door'); }
  for (const id in P.rooms) { const r = P.rooms[id]; if (r.k === 0 && r.kind === 'corridor' && Math.min(r.x1 - r.x0, r.z1 - r.z0) < 1.5) out.push('corridor ' + id + ' is narrower than 1.1 m clear'); }
  // lit: every room has a window, a hearth, a candle or a lamp
  for (const id in P.rooms) { const r = P.rooms[id]; if (!P.lightIn || !P.lightIn[id]) out.push('room ' + id + ' has no visible light source'); }
  return out;
}
