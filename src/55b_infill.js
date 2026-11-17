// ───────────────────────── infill: new houses in the gaps, so the square and the main roads read as continuous street fronts ─────────────────────────
// Nothing that already exists moves: every candidate is tested against the existing sites, the roads, the door-to-road paths, the square, the river, the lake and the fields.
// Each accepted house becomes a SITES entry (terrain pad, bare ground under it, a painted path from its door). `enter` houses also get a HOUSES spec (72c_infill.js).
const INF = { houses: [], byId: {}, enterIds: [], N: 0 };
// [fx3] the Market Place: an irregular room whose walls are the fronts round it (inn and passage house north, smithy and the west row, store and shop alley east, the south row, the terrace's retaining wall to the south-west)
const PLACE = { poly: [[-19.6, -17.3], [-7.6, -17.3], [14.7, -17.3], [20.3, -16.4], [20.3, -3.8], [24.0, -3.8], [24.0, 5.6], [20.3, 5.6], [20.3, 8.2], [2.5, 8.2], [2.5, 12.6], [-1.6, 12.6], [-1.6, 12.7], [-19.6, 12.7]] };
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
    // blocks: districts filled with rows that face each other across 2.3 m lanes (front rows: yaw 0 looks north, yaw PI looks south), a cross-lane now and then, back-to-back pairs 1.8 m apart (the eaves overhang 0.5 m each).
    // A district is a rectangle [x0, z0, x1, z1] with a cap; free() leaves the roads, the square, the existing houses and the door paths alone, so cross streets appear where roads run.
    const RB = rng(9091);
    const districts = INF.districts = [
      { id: 'north-west', r: [-46, -66, -17, -12], cap: 16 }, { id: 'north-east', r: [-11, -62, 32, -31], cap: 14 }, { id: 'west', r: [-62, -12, -27, 34], cap: 16 },
      { id: 'south-west', r: [-33, 14, -4, 72], cap: 14 }, { id: 'south-east', r: [6, 14, 34, 72], cap: 14 }, { id: 'east-bank', r: [31, 7, 46, 40], cap: 6 },
    ];
    for (const D of districts) {
      let placed = 0; const [x0, z0, x1, z1] = D.r; D.n = 0;
      for (let row = 0, z = z0 + 3; z < z1 && placed < D.cap; row++) {
        const pair = row % 2, d = RB.pick([4.6, 5.0, 5.4]), yaw = pair ? PI : 0;
        let x = x0 + RB() * 3, k = 0;
        while (x < x1 && placed < D.cap) {
          const w = RB.pick([4.4, 5, 5.6, 6.2, 7]);
          if (RB() < 0.1) { x += 2.6; continue; }                                  // a gap: a yard or a cross-lane
          if (free(x + w / 2, z + d / 2, yaw, w, d, { sq: 2.5, road: 1.0 })) { add(x + w / 2, z + d / 2, yaw, w, d, { floors: RB.pick([1, 2, 2, 3]), pitch: 38 + (RB() * 14 | 0), tier: 1, second: true, block: D.id }); placed++; D.n++; x += w + (k++ % 3 === 2 ? 2.3 : 0.1); }
          else x += 1.0;
        }
        z += d + (pair ? 1.8 : 2.3);                                               // the lane after a front pair's first row, a narrow back yard after its second
      }
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
  // ── 5b. levels (Build 33): the terrace under the elder's hall and the lane that climbs to it. Infill houses (never the enterable ones) that straddle its walls, stand on the lane or the stairs are deleted ──
  { const h21 = INF.byId['in.21'], s21 = SITE['in.21']; if (h21 && s21) { h21.x = s21.x = -9; h21.z = s21.z = 24.5; h21.yaw = s21.yaw = 0; } }       // the enterable Dyer's House stands in the terrace yard, its door to the north (the market view)
  { const u = LV.up, inRectP = (x, z, m) => x > u.x0 - m && x < u.x1 + m && z > u.z0 - m && z < u.z1 + m, keepOut = [[-38, 31.2, -2.6, 36.2], [-14.6, 6.4, -9.6, 14.2]];
    for (const h of INF.houses.slice()) {
      if (h.enter) continue; const pts = rectPts(h.x, h.z, h.yaw, h.w + 1.0, h.d + 1.0, 1.5); let inside = 0, near = 0, out = 0;
      for (const [px, pz] of pts) { if (inRectP(px, pz, -0.4)) inside++; else if (inRectP(px, pz, 2.6)) near++; else out++; }
      const stairs = pts.some(([px, pz]) => keepOut.some(k => px > k[0] && px < k[2] && pz > k[1] && pz < k[3]));
      if (stairs || near > 0 || (inside > 0 && out + near > 0)) drop(h);
    }
  }
  { const h5 = INF.byId['in.05']; if (h5 && !h5.enter) drop(h5); }      // Build 42: the passage house and the Hart's gallery stand where in.05 was (73h_routes.js)
  for (const id of ['in.01', 'in.09']) { const h = INF.byId[id]; if (h && !h.enter) drop(h); }      // Build 42: fewer, better: two repeats that crowd the square's corners (the square pass)
  // ── 6. forecourts (Build 33): every original building keeps 9 m of open ground in front of its door, every one of the first 25 infill houses faces 9 m of street, and enterable doors stay reachable.
  // Houses that stand in a forecourt are nudged back, moved along their street, or deleted (the six enterable ones are only ever moved). test/layout.mjs checks the result in node.
  INF.fore = { len: 9, wid: 3.2, skip: ['tower', 'barn', 'mill', 'farm', 'hunter', 'fisher'] };
  const clearDist = (s, wid, max) => {        // how far straight out from the door the way is free of other buildings (a strip `wid` wide)
    const wall = s.doorWall || 'front', dl = siteDoorLocal(s, 0), others = SITES.filter(o => o !== s && o.w && hyp(o.x - s.x, o.z - s.z) < 22 + max);
    for (let a = 0.4; a <= max; a += 0.2) for (const b of [0, -wid / 2, wid / 2]) {
      const e = a + (s.porch || 0), l = wall === 'front' ? [dl[0] + b, -s.d / 2 - e] : wall === 'back' ? [dl[0] + b, s.d / 2 + e] : wall === 'left' ? [-s.w / 2 - e, dl[1] + b] : [s.w / 2 + e, dl[1] + b], w = siteToWorld(s, l[0], l[1]);
      for (const o of others) if (inRect(o, w[0], w[1], 0.1)) return [a, o];
    }
    return [max, null];
  };
  INF.clearDist = clearDist;
  const nudge = (h, dx, dz) => {
    if (h.id === 'in.21') return false;          // (it stands in the terrace yard: 5b)                // move an infill house by (dx, dz) in its own frame if the spot is free (its own footprint ignored)
    const st = SITE[h.id], c = Math.cos(h.yaw), sn = Math.sin(h.yaw), nx = h.x + dx * c - dz * sn, nz = h.z + dx * sn + dz * c, ox = st.x, oz = st.z; st.x = 1e5;
    const ok = free(nx, nz, h.yaw, h.w, h.d, { sq: 1.2 }); st.x = ox;
    if (ok) { h.x = st.x = nx; h.z = st.z = nz; } return ok;
  };
  const nearest = (s, fn) => { let best = null; for (const r of [1, 2, 3, 4, 5, 6, 7, 8]) for (let dx = -r; dx <= r; dx += 0.5) for (let dz = -1; dz <= 3; dz += 1) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r && dz !== 3 && dz !== -1) continue; if (fn(dx, dz)) return [dx, dz]; } return best; };
  const F = INF.fore, byDist = (a, b) => a - b;
  // (a) originals first: whatever infill house stands in the way is moved aside (enterable) or deleted
  for (const s of SITES.slice()) {
    if (s.infill || F.skip.includes(s.id)) continue;
    for (let guard = 0; guard < 12; guard++) {
      const [d, o] = clearDist(s, F.wid, F.len + 0.4); if (d >= F.len + 0.3 || !o || !o.infill) break;
      const h = INF.byId[o.id]; if (!h) break;
      if (h.enter) {            // slide it along its street to the nearest free place that opens the forecourt
        const old = [h.x, h.z], st = SITE[h.id]; let done = false;
        for (let r = 1; r <= 9 && !done; r += 0.5) for (const dx of [-r, r]) for (const dz of [0, 1, 2]) { if (nudge(h, dx, dz)) { if (clearDist(s, F.wid, F.len + 0.4)[0] >= F.len + 0.3 && clearDist(st, 1.6, 3)[0] >= 3) { done = true; break; } h.x = st.x = old[0]; h.z = st.z = old[1]; } }
        if (!done) break;
      } else drop(h);
    }
  }
  // (b) the first 25 infill houses: at least 9 m between their door and the next wall (a street is 2.5 m of that). Nudge back (both sides share it), else delete the one that is not enterable
  for (let pass = 0; pass < 3; pass++) for (const h of INF.houses.filter(h => +h.id.slice(3) <= 25)) {
    const st = SITE[h.id]; if (!st || h.id === 'in.21') continue;
    for (let guard = 0; guard < 4; guard++) {
      const [d, o] = clearDist(st, 2.4, F.len + 0.4); if (d >= F.len + 0.3 || !o) break;
      const need = F.len + 0.3 - d, other = o.infill ? INF.byId[o.id] : null;
      if (nudge(h, 0, need + 0.05)) continue;                                       // back by the whole shortfall (+z is behind the front)
      if (other && nudge(other, 0, need + 0.05) ) continue;
      let moved = false; for (const k of [0.8, 0.6, 0.4, 0.2]) { if (nudge(h, 0, k * need)) { moved = true; break; } }
      if (moved && other && nudge(other, 0, (1 - 0.4) * need)) continue;
      if (!h.enter) drop(h); else if (other && !other.enter) drop(other); break;
    }
  }
  for (const h of INF.houses.filter(h => +h.id.slice(3) <= 25 && !h.enter)) if (clearDist(SITE[h.id], 2.4, F.len + 0.4)[0] < F.len + 0.3) drop(h);       // whatever could not be nudged goes
  INF.enterIds = INF.houses.filter(h => h.enter).map(h => h.id);
  // [c5] thirty more enterable houses, spread over the lanes (farthest point first): only the flag and the household name are set here; 72c_infill.js gives each a door and a cell, 72k_houses.js a plan by the name
  if (!(TEST && TEST.moreEnter === 0)) {
    const NAMES = ['Wheelwright’s House', 'Carpenter’s House', 'Mason’s House', 'Saddler’s House', 'Ropemaker’s House', 'Basketmaker’s House', 'Shepherd’s House', 'Woodcutter’s House', 'Glover’s House', 'Brewer’s House', 'Scribe’s House', 'Merchant’s House', 'Cobbler’s House', 'Chandler’s House', 'Tailor’s House', 'Butcher’s House', 'Baker’s House', 'Grocer’s House', 'Cutler’s House', 'Tinker’s House', 'Ferrin’s House', 'Marsh House', 'Thorne House', 'Wren Cottage', 'Garrick’s House', 'Pell House', 'Hobb’s Cottage', 'Tamsin’s House', 'Bram’s House', 'Alder House'];
    const cand = INF.houses.filter(h => !h.enter && hyp(h.x - 29.8, h.z + 60.6) > 7 && h.w >= 4.6 && h.d >= 4.4 && SITE[h.id] && clearDist(SITE[h.id], 1.6, 3.0)[0] >= 3.0), chosen = INF.houses.filter(h => h.enter);
    const more = []; while (more.length < NAMES.length && cand.length > more.length) {
      let best = null, bd = -1; for (const h of cand) { if (more.includes(h)) continue; const d = Math.min(...chosen.concat(more).map(c => hyp(c.x - h.x, c.z - h.z)), 99); if (d > bd) { bd = d; best = h; } }
      more.push(best);
    }
    more.forEach((h, i) => { h.enter = true; h.name = NAMES[i]; SITE[h.id].name = h.name; });
    INF.enterIds = INF.houses.filter(h => h.enter).map(h => h.id);
  }
  // [fx3] the Market Place (docs/TOWNPLAN.md section 4): the houses round it are brought onto its lines, front walls on the room's edge, ginnels between. Same houses, moved and turned: ids, cells and households go with them.
  // Each entry: id, x, z of the centre and the yaw of the front (PI faces south, 0 north, PI/2 east, -PI/2 west).
  PLACE.houses = [
    ['in.11', -17.7, -19.75, PI], ['in.76', -10.1, -19.55, PI],             // north-west row: front on z -17.25, a 1.6 m ginnel between, the inn's west wall to the right
    ['in.47', 18.0, -19.45, PI],                                              // north-east: east of the passage house, beside the gallery stair
    ['in.04', -22.4, 4.0, PI / 2],                                            // west side, south of the main street's mouth: front on x -19.5, as the smithy's is
    ['in.02', 16.5, 10.8, 0], ['in.48', 9.6, 10.8, 0], ['in.18', 4.6, 10.8, 0],   // south row, front on z 8.2, east of Wharf Street's mouth: a cart gate to the shop row    // main street west of the place: a 6 m street, fronts on z about -6.2 (north) and -0.4 (south), party walls
    ['in.10', -29.3, -8.6, PI], ['guardhouse', -36.0, -9.6, PI], ['in.41', -43.0, -10.3, PI], ['in.40', -48.9, -10.0, PI],
    ['in.86', 11.7, -40.5, 0], ['in.87', 17.8, -40.9, 0], ['in.88', 24.2, -40.4, 0], ['in.89', 33.8, -40.8, 0],       /* the east cluster: the lane between the two rows widened to 3 m and made to wander (rows nudged +-0.4 m), ending at the well at its east end */
    ['in.81', 2.2, -49.3, PI], ['in.82', 8.0, -48.8, PI], ['in.83', 15.7, -49.2, PI], ['in.84', 23.0, -48.9, PI], ['in.85', 29.7, -49.1, PI],
    ['in.08', -28.3, 3.2, 0], ['in.07', -34.0, 2.2, 0], ['in.06', -39.1, 1.7, 0], ['in.42', -44.6, 1.9, 0],
  ];
  for (const [id, x, z, yaw] of PLACE.houses) {
    const h = INF.byId[id] || { placedOnly: true }, st = SITE[id]; if (!st) continue;
    h.x = st.x = x; h.z = st.z = z; h.yaw = st.yaw = yaw; h.placed = true;
  }
  /* [fx3] gables to the street: these houses are turned so the short wall is the front and the ridge runs away from the street (w and d swapped; the front line stays where it was, the house grows backwards) */
  PLACE.gabled = [];
  for (const id of ['in.08', 'in.116', 'in.15']) {
    const h = INF.byId[id], st = SITE[id]; if (!h || !st || !(h.w > h.d)) continue;
    const grow = (h.w - h.d) / 2, bx = -Math.sin(h.yaw + PI) * 0, ux = Math.sin(h.yaw), uz = -Math.cos(h.yaw);      /* heading yaw 0 = north (-z): the front looks along (ux,uz), the back is the opposite */
    const nw = h.d, nd = h.w; h.x = st.x = h.x - ux * grow; h.z = st.z = h.z - uz * grow; h.w = st.w = nw; h.d = st.d = nd; PLACE.gabled.push(id);
  }
  for (const h of INF.houses.slice()) {      // whatever the moved houses now stand on (and is not itself placed or enterable) goes
    if (h.placed || h.enter) continue;
    for (const q of PLACE.houses) { const o = INF.byId[q[0]] || SITE[q[0]]; if (!o) continue; if (hyp(o.x - h.x, o.z - h.z) > 14) continue; const hit = rectPts(h.x, h.z, h.yaw, h.w, h.d, 1.5).some(([px, pz]) => inRect(o, px, pz, 0.3)) || rectPts(o.x, o.z, o.yaw, o.w, o.d, 1.5).some(([px, pz]) => inRect(h, px, pz, 0.3)); if (hit) { drop(h); break; } }
  }
  INF.count = INF.houses.length;
})();

// ───────────────────────── keep-clear rule (Build 33) ─────────────────────────
// No prop, stall, pile or collider may stand in a door's approach strip (1.2 m wide, 2.5 m long, from the wall) or within 1 m of a road's centre line. Builders ask
// KEEP.hit(x, z, r) before placing (r: the radius the thing occupies) or KEEP.slide(x, z, r) for a nearby clear spot. The strips are built on first use, when every site exists.
const KEEP = {
  strips: null, W: 0.6, LEN: 2.5, ROAD: 1.0,
  build() {
    this.strips = [];
    for (const s of SITES) {
      if (!s.w) continue; const wall = s.doorWall || 'front', dl = siteDoorLocal(s, 0), u = (wall === 'front' || wall === 'back') ? dl[0] : dl[1];
      this.strips.push({ s, wall, u, len: this.LEN + (s.porch || 0) });
    }
  },
  inStrip(x, z, r) {
    if (!this.strips) this.build();
    for (const t of this.strips) {
      const s = t.s; if (Math.abs(x - s.x) > 14 || Math.abs(z - s.z) > 14) continue;
      const l = worldToSite(s, x, z); let lat, out;
      if (t.wall === 'front') { lat = l[0] - t.u; out = -l[1] - s.d / 2; } else if (t.wall === 'back') { lat = l[0] - t.u; out = l[1] - s.d / 2; } else if (t.wall === 'left') { lat = l[1] - t.u; out = -l[0] - s.w / 2; } else { lat = l[1] - t.u; out = l[0] - s.w / 2; }
      if (Math.abs(lat) < this.W + r && out > -0.2 - r * 0.5 && out < t.len + r) return s.id;
    }
    return null;
  },
  onRoad(x, z, r) {
    if (typeof INF === 'undefined' || !INF.LN) return null;
    for (const id in INF.LN) { const L = INF.LN[id]; if (id === 'crag' || id === 'hunter' || id === 'fisher') { if (INF.dist(L, x, z)[0] < this.ROAD * 0.5 + r * 0.5) return id; continue; } if (INF.dist(L, x, z)[0] < this.ROAD + r * 0.6) return id; }
    return null;
  },
  hit(x, z, r) { r = r || 0.3; return this.inStrip(x, z, r) || this.onRoad(x, z, r) || null; },
  slide(x, z, r) {        // the nearest clear spot to (x, z) within 3 m (sideways along the strip or the road first), or the point itself when it is already clear or nothing is
    if (!this.hit(x, z, r)) return [x, z];
    for (let d = 0.35; d <= 3.2; d += 0.35) for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (!this.hit(px, pz, r)) return [px, pz]; }
    return [x, z];
  },
};
