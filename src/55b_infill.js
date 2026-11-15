// ───────────────────────── infill: new houses in the gaps, so the square and the main roads read as continuous street fronts ─────────────────────────
// Nothing that already exists moves: every candidate is tested against the existing sites, the roads, the door-to-road paths, the square, the river, the lake and the fields.
// Each accepted house becomes a SITES entry (terrain pad, bare ground under it, a painted path from its door). `enter` houses also get a HOUSES spec (72c_infill.js).
const INF = { houses: [], byId: {}, enterIds: [], N: 0 };
(function infillLayout() {
  if (typeof TEST !== 'undefined' && TEST && TEST.infill === 0) return;
  const R = rng(4242);
  // polylines identical to the road splines
  const mk = pts => { const p = catmull(pts, 1.5), cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + hyp(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, cum, len: cum[cum.length - 1] }; };
  const pt = (L, s) => { s = clamp(s, 0, L.len); let i = 0; while (i < L.p.length - 2 && L.cum[i + 1] <= s) i++; const a = L.p[i], b = L.p[i + 1], l = L.cum[i + 1] - L.cum[i] || 1, t = (s - L.cum[i]) / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const dist = (L, x, z) => { let best = 1e9, at = 0; for (let i = 0; i < L.p.length - 1; i++) { const a = L.p[i], b = L.p[i + 1], bx = b[0] - a[0], bz = b[1] - a[1], l2 = bx * bx + bz * bz, t = l2 ? clamp(((x - a[0]) * bx + (z - a[1]) * bz) / l2, 0, 1) : 0, d = hyp(x - a[0] - bx * t, z - a[1] - bz * t); if (d < best) { best = d; at = L.cum[i] + t * Math.sqrt(l2); } } return [best, at]; };
  const LN = {}; for (const r of ROADS) LN[r.id] = Object.assign(mk(r.pts), { w: r.w });
  const RV = mk(RIVER_PTS);
  INF.LN = LN; INF.pt = pt; INF.dist = dist;
  // a house as a rotated rectangle: corners and a ring of sample points along its outline
  const rectPts = (x, z, yaw, w, d, step) => {
    const c = Math.cos(yaw), sn = Math.sin(yaw), out = [], n = Math.max(2, Math.ceil(w / step)), m = Math.max(2, Math.ceil(d / step));
    const P = (lx, lz) => out.push([x + lx * c - lz * sn, z + lx * sn + lz * c]);
    for (let i = 0; i <= n; i++) { P(-w / 2 + w * i / n, -d / 2); P(-w / 2 + w * i / n, d / 2); }
    for (let j = 1; j < m; j++) { P(-w / 2, -d / 2 + d * j / m); P(w / 2, -d / 2 + d * j / m); }
    P(0, 0); return out;
  };
  const inRect = (s, x, z, m) => { const c = Math.cos(s.yaw), sn = Math.sin(s.yaw), dx = x - s.x, dz = z - s.z, lx = dx * c + dz * sn, lz = -dx * sn + dz * c; return Math.abs(lx) < s.w / 2 + m && Math.abs(lz) < s.d / 2 + m + (s.porch || 0); };
  // the path each existing door uses to reach the nearest road stays clear (a lane's width)
  const corridors = [];
  const roadNear = (x, z) => { let b = null, bd = 1e9; for (const id in LN) { const [d, at] = dist(LN[id], x, z); if (d < bd) { bd = d; b = pt(LN[id], at); } } return b; };
  for (const s of SITES) {
    if (s.id === 'tower' || s.id === 'barn') continue;
    const wall = s.doorWall || 'front', p = s.doorPos || 0, e = 0.6 + (s.porch || 0), dl = wall === 'front' ? [p, -s.d / 2 - e] : wall === 'back' ? [p, s.d / 2 + e] : wall === 'left' ? [-s.w / 2 - e, p] : [s.w / 2 + e, p];
    const a = siteToWorld(s, dl[0], dl[1]), b = roadNear(a[0], a[1]); if (b) corridors.push([a[0], a[1], b[0], b[1]]);
  }
  const segDist = (c, x, z) => { const bx = c[2] - c[0], bz = c[3] - c[1], l2 = bx * bx + bz * bz, t = l2 ? clamp(((x - c[0]) * bx + (z - c[1]) * bz) / l2, 0, 1) : 0; return hyp(x - c[0] - bx * t, z - c[1] - bz * t); };
  const free = (x, z, yaw, w, d, o) => {
    o = o || {};
    const pts = rectPts(x, z, yaw, w, d, 1.0);
    for (const [px, pz] of pts) {
      for (const id in LN) { const L = LN[id]; if (dist(L, px, pz)[0] < L.w / 2 + (o.road === undefined ? 1.5 : o.road)) return false; }
      if (hyp((px - SQUARE.x) / (SQUARE.rx + (o.sq === undefined ? 1.2 : o.sq)), (pz - SQUARE.z) / (SQUARE.rz + (o.sq === undefined ? 1.2 : o.sq))) < 1) return false;
      if (dist(RV, px, pz)[0] < 13) return false;
      if (hyp(px - LAKE.x, pz - LAKE.z) < LAKE.r + 12) return false;
      for (const f of FIELDS) if (px > f.x0 - 3 && px < f.x1 + 3 && pz > f.z0 - 3 && pz < f.z1 + 3) return false;
      for (const s of SITES) if (inRect(s, px, pz, (s.id.startsWith('in.') ? 0.06 : (s.pad || 1.1) + 0.5))) return false;
      for (const c of corridors) if (segDist(c, px, pz) < 1.9) return false;
      if (hyp(px - 26, pz + 124) < 18) return false;                 // the watchtower
      if (hyp(px - (-6), pz - (-75)) < 20) return false;             // the chapel yard
    }
    // and the other way round: nothing of an existing site inside the new rectangle (its centre and corners)
    for (const s of SITES) { if (hyp(s.x - x, s.z - z) > 30) continue; const cs = rectPts(s.x, s.z, s.yaw, s.w + (s.pad || 1) * 2, s.d + (s.pad || 1) * 2, 2.0); for (const [qx, qz] of cs) if (inRect({ x, z, yaw, w, d }, qx, qz, 0.2)) return false; }
    return true;
  };
  INF.free = free;
  let seq = 0;
  const add = (x, z, yaw, w, d, o) => {
    const id = 'in.' + String(++seq).padStart(2, '0');
    const h = Object.assign({ id, x, z, yaw, w, d, floors: 1, pitch: 46, tier: 0 }, o); if (h.floors === 3 && w < 5.6) h.floors = 2;
    INF.houses.push(h); INF.byId[id] = h;
    const st = { id, name: h.name || 'House', x, z, yaw, w, d, doorPos: h.doorPos || 0, pad: 0.6, infill: true }; SITES.push(st); SITE[id] = st;
    return h;
  };
  const WS = [4, 4.4, 5, 5.4, 6, 6.4, 7, 7.6], DS = [4.4, 5, 5.6, 6.2];
  // houses along one side of a road between arclengths s0 and s1. side +1 = to the right of the direction of travel. setback = front wall to the road's centre line
  const frontage = (road, side, p0, p1, o) => {
    o = o || {}; const L = LN[road], setb = o.setback || (L.w / 2 + 2.4); let s = dist(L, p0[0], p0[1])[1]; const s1 = dist(L, p1[0], p1[1])[1]; let n = 0, guard = 0;
    while (s < s1 && guard++ < 120) {
      const w = o.w ? R.pick(o.w) : R.pick(WS), d = o.d ? R.pick(o.d) : R.pick(DS);
      const m = pt(L, s + w / 2), ox = m[3] * side, oz = -m[2] * side;                  // (tz, -tx) * side: to the right of travel when side = +1
      const x = m[0] + ox * (setb + d / 2), z = m[1] + oz * (setb + d / 2), fy = Math.atan2(-ox, oz);     // front (local -z) points back at the road
      if (free(x, z, fy, w, d, o)) {
        add(x, z, fy, w, d, Object.assign({ floors: o.floors ? R.pick(o.floors) : R.pick([1, 2, 2, 2, 3]), pitch: 38 + (R() * 14 | 0), road, tier: o.tier || 0 }, o.attr || {}));
        s += w + (o.gap === undefined ? 0.12 : o.gap) + (n % (o.laneEvery || 4) === (o.laneEvery || 4) - 1 ? 3.4 : 0); n++;
      } else s += 0.8;
    }
    return n;
  };
  const ringPlace = (a, off, w, d, o) => {      // around the square: a house standing off the ellipse at angle a, front facing the middle
    const ex = SQUARE.x + Math.cos(a) * (SQUARE.rx + off), ez = SQUARE.z + Math.sin(a) * (SQUARE.rz + off);
    const nx = Math.cos(a) / SQUARE.rx, nz = Math.sin(a) / SQUARE.rz, nl = hyp(nx, nz), ux = nx / nl, uz = nz / nl;       // outward normal of the ellipse
    const x = ex + ux * d / 2, z = ez + uz * d / 2, y2 = Math.atan2(-ux, uz);                                             // front faces (-ux, -uz)
    if (free(x, z, y2, w, d, o)) return add(x, z, y2, w, d, Object.assign({ floors: R.pick([2, 2, 3]), pitch: 40 + (R() * 12 | 0), ring: true }, o || {}));
    return null;
  };
  INF.frontage = frontage; INF.ringPlace = ringPlace; INF.add = add; INF.R = R;
  // ── 1. the square: houses standing round it, first row (these are the ones the player sees first) ──
  const ringOrder = [];
  for (let k = 0; k < 28; k++) ringOrder.push(k / 28 * TAU);
  for (const a of ringOrder) {
    for (const w of [6.4, 5.6, 5, 4.4]) { if (ringPlace(a, 2.0, w, R.pick([4.6, 5.2, 5.8]), { tier: 0, road: 1.0, sq: 0.7 })) break; }
  }
  // ── 2. along the main road (west of the square, north and south sides), then the north and south roads ──
  // 'main' runs west to east: side -1 = its north side. 'north' runs away from the square (north), side +1 = east. 'south' runs south, side -1 = east
  frontage('main', -1, [-50, -5], [-16, -2], { tier: 0 }); frontage('main', 1, [-50, -5], [-16, -2], { tier: 0 });
  frontage('north', 1, [-10, -10], [-9, -42], { tier: 0 }); frontage('north', -1, [-10, -10], [-9, -42], { tier: 0 });
  frontage('south', 1, [0, 14], [3, 47], { tier: 0 }); frontage('south', -1, [0, 14], [3, 47], { tier: 0 });
  frontage('main', -1, [16, 0], [22, 1], { tier: 0 }); frontage('main', 1, [16, 0], [22, 1], { tier: 0 });
  // ── 3. second rows: courts behind the first, on a lane 3.5 m wide ──
  // (placed by a generic pass below)
  // second row: for every first-row house on the main road, the street, and the ring, try a house on the other side of a lane behind it
  const first = INF.houses.slice();
  for (const h of first) {
    if (R() < 0.62) continue;
    const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), back = 3.5 + 0.0;
    const w = R.pick([4.4, 5, 5.6, 6.4]), d = R.pick([4.6, 5.2, 5.8]);
    const lz = h.d / 2 + back + d / 2, lx = R.s() * 0.8, x = h.x + lx * c - lz * sn, z = h.z + lx * sn + lz * c;
    if (free(x, z, h.yaw, w, d, { sq: 3 })) add(x, z, h.yaw, w, d, { floors: R.pick([1, 2, 2]), pitch: 40 + (R() * 12 | 0), tier: 1, second: true });
  }
  // ── 4. keep about two dozen (second rows go first), choose which are enterable (generic cottage interiors) and finish ──
  const drop = h => { INF.houses.splice(INF.houses.indexOf(h), 1); delete INF.byId[h.id]; delete SITE[h.id]; SITES.splice(SITES.findIndex(q => q.id === h.id), 1); };
  while (INF.houses.length > 25) { const t1 = INF.houses.filter(h => h.tier === 1); drop(t1.length ? t1[t1.length - 1] : INF.houses[INF.houses.length - 1]); }
  { const cand = INF.houses.filter(h => h.tier === 0 && h.floors <= 2 && h.w >= 5 && h.w <= 7.1 && h.d >= 4.9), chosen = [];
    const ring = cand.filter(h => h.ring); if (ring.length) chosen.push(ring[0]);
    while (chosen.length < 6 && cand.length > chosen.length) {            // farthest-point picks, so the enterable houses are spread through the village
      let best = null, bd = -1; for (const h of cand) { if (chosen.includes(h)) continue; const d = Math.min(...chosen.map(c => hyp(c.x - h.x, c.z - h.z)), 99) ; if (d > bd) { bd = d; best = h; } }
      chosen.push(best);
    }
    chosen.forEach((h, i) => { h.enter = true; h.name = ['Cooper’s House', 'Tanner’s House', 'Potter’s House', 'Widow Hale’s House', 'Fletcher’s House', 'Dyer’s House'][i]; INF.enterIds.push(h.id); SITES.find(q => q.id === h.id).name = h.name; }); }
  // ── 5. the dense town: after the first 25 (and the six enterable ones) are fixed, so their ids stay, fill the blocks: the outer streets, then second and third rows on lanes 2.2 to 2.7 m wide ──
  if (!(TEST && TEST.dense === 0)) {
    const base = INF.houses.length;
    frontage('north', 1, [-9, -42], [-6.5, -60], { tier: 0 }); frontage('north', -1, [-9, -42], [-6.5, -60], { tier: 0 });
    frontage('south', 1, [3, 47], [5, 80], { tier: 0 }); frontage('south', -1, [3, 47], [5, 80], { tier: 0 });
    frontage('main', -1, [-62, -5], [-50, -5], { tier: 0 }); frontage('main', 1, [-62, -5], [-50, -5], { tier: 0 });
    for (const h of INF.houses.slice()) {
      if (h.second || R() < 0.15) continue;
      const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), back = 2.2 + R() * 0.5;
      const w = R.pick([4.4, 5, 5.6, 6.4]), d = R.pick([4.6, 5.2, 5.8]), lz = h.d / 2 + back + d / 2, x = h.x + R.s() * 0.8 * c - lz * sn, z = h.z + R.s() * 0.8 * sn + lz * c;
      if (!free(x, z, h.yaw, w, d, { sq: 3 })) continue;
      const h2 = add(x, z, h.yaw, w, d, { floors: R.pick([1, 2, 2, 3]), pitch: 40 + (R() * 12 | 0), tier: 1, second: true });
      if (R() < 0.4) { const w3 = R.pick([4.4, 5, 5.6]), d3 = R.pick([4.4, 5.2]), lz3 = h2.d / 2 + 2.0 + d3 / 2, x3 = h2.x + R.s() * 0.6 * c - lz3 * sn, z3 = h2.z + R.s() * 0.6 * sn + lz3 * c; if (free(x3, z3, h.yaw + PI, w3, d3, { sq: 4 })) add(x3, z3, h.yaw + PI, w3, d3, { floors: R.pick([1, 2]), pitch: 40 + (R() * 12 | 0), tier: 1, second: true }); }
    }
    INF.dense = INF.houses.length - base;
  }
  // per-house features (so the painted door paths know where each door is)
  const nbAt = (h, east) => { const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), lx = (east ? 1 : -1) * (h.w / 2 + 0.3); const x = h.x + lx * c, z = h.z + lx * sn; for (const o of SITES) { if (o === h || !o.w) continue; if (inRect(o, x, z, 0.12)) return 1; } return 0; };
  for (const h of INF.houses) {
    if (h.enter) continue;
    const Rh = rng(h.x * 17 + h.z * 3 + 1), n = Math.max(1, Math.round(h.w / 2));
    h.stone = Rh() < 0.4; h.jetty = h.floors >= 2 && Rh() < 0.55; h.stairs = (!h.jetty && h.floors >= 2 && h.w >= 6 && Rh() < 0.4) ? (Rh() < 0.5 ? 1 : -1) : 0;
    h.boxes = Rh() < 0.7; h.chimney = Rh() < 0.4 ? (Rh() < 0.5 ? 1 : -1) : 0; h.par = Rh() < 0.5 ? 0 : 1;
    h.gable = !nbAt(h, false) && !nbAt(h, true) && h.w <= 7 && Rh() < 0.3;
    h.doorBay = h.stairs ? (h.stairs > 0 ? n - 1 : 0) : (Rh() * n | 0);
    SITE[h.id].doorPos = h.w / 2 - (h.doorBay + 0.5) * (h.w / n);
  }
  INF.enterIds = INF.houses.filter(h => h.enter).map(h => h.id);
  INF.count = INF.houses.length;
})();
