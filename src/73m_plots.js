// ───────────────────────── plots: the yards behind every front on the Market Place and the west street (docs/TOWNPLAN.md sections 3 and 4) ─────────────────────────
// Each house on a row owns a burgage: a walled or fenced yard from its back wall to a back lane, sides on the party lines (half way across the gap to the neighbour), a gate in the back wall to the lane.
// plotsCompute() is data only (run by the terrain painter and by the builder, memoised); buildPlots(bucket) makes walls, gates and the trade each household keeps in its yard.
const PLOT_ROWS = [
  { name: 'placeS', ids: ['in.02'], trades: ['washing'] },
  { name: 'placeN', ids: ['inn'], trades: ['stable'] },
  { name: 'westN', ids: ['in.10', 'guardhouse', 'in.41', 'in.40'], trades: ['forge', 'garden', 'cooper', 'pigs'] },
  { name: 'alleyN', ids: ['draper', 'shop.n2', 'shop.n3', 'shop.n4'], trades: ['cooper', 'hens', 'garden', 'woodyard'] },
  { name: 'alleyS', ids: ['shop.s0', 'shop.s1', 'shop.s2'], trades: ['forge', 'washing', 'pigs'] },
  { name: 'placeE', ids: ['store'], trades: ['stable'], axis: 'x' },
  { name: 'chapelW', ids: ['in.12', 'in.13', 'in.45', 'in.32'], trades: ['garden', 'woodyard', 'hens', 'hives'], axis: 'x' },
  { name: 'chapelE', ids: ['in.15', 'in.16', 'in.33'], trades: ['hens', 'garden', 'hives'], axis: 'x' },
  { name: 'eastS', ids: ['in.86', 'in.87', 'in.89'], trades: ['garden', 'hens', 'hives'] },
  { name: 'eastN', ids: ['in.81', 'in.82', 'in.83', 'in.84', 'in.85'], trades: ['garden', 'hens', 'woodyard', 'pigs', 'hives'] },
  { name: 'gateN', ids: ['in.65'], trades: ['garden'] },
  { name: 'gateS', ids: ['in.75'], trades: ['hens'] },
  { name: 'westS', ids: ['in.08', 'in.07', 'in.06'], trades: ['dyer', 'hens', 'woodyard'] }
];
let _PLOTS = null;
function plotsCompute() {
  if (_PLOTS) return _PLOTS;
  _PLOTS = [];
  const byId = id => SITES.find(s => s.id === id), T0 = (typeof TERRACE !== 'undefined' && TERRACE) || null;
  const blocked = (x, z, pad, self) => {
    for (const s of SITES) { if (s === self || !s.w || s.id === 'tower') continue; const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad * 0.3 + (s.porch || 0) && Math.abs(l[1]) < s.d / 2 + pad * 0.3) return true;
      if (s !== self && Math.abs(l[0]) < s.w / 2 + 0.2 && l[1] < -s.d / 2 + 0.01 && l[1] > -s.d / 2 - 3.4) return true; }      /* [fx3] a yard never covers the ground in front of another house's door: 3.4 m clear (BLUEPRINT 2.3) */
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + 1) < r.w / 2 + 0.1) return true;
    if (placeW(x, z, 0.01) >= 1) return true;
    if (x > 4.6 && x < 11.3 && z > 16.4 && z < 21.2) return true;      /* the bell tower's stair (73i_walls.js) */
    if (z > 10.4 && z < 13.6 && x > -37.8 && x < 25) return true;       /* the terrace's south wall and its lean-to */
    if (Math.abs(River.dist(x, z, 12)) < 9) return true;
    return false;
  };
  for (const row of PLOT_ROWS) {
    const hs = row.ids.map(byId).filter(Boolean); if (!hs.length) continue;
    if (row.axis === 'x') {      /* houses whose back faces east or west (their front looks along x): one plot each, no neighbours on the row */
      for (const [hi, s] of hs.entries()) {
        const bx = Math.sin(s.yaw || 0) > 0 ? -1 : 1, xb0 = s.x + bx * (s.d / 2 + 0.12), za = s.z - s.w / 2 - 0.15, zb2 = s.z + s.w / 2 + 0.15; let depth = 0;
        for (let d = 7.0; d >= 2.2 && !depth; d -= 0.4) { let ok = true; for (let z = za + 0.3; z <= zb2 - 0.3 && ok; z += 0.7) for (let k = 0.5; k <= d + 0.3 && ok; k += 0.6) if (blocked(xb0 + bx * (k + 0.2), z, 0.35, s) || _PLOTS.some(q => q.x0 - 0.6 < xb0 + bx * (k + 0.2) && xb0 + bx * (k + 0.2) < q.x1 + 0.6 && q.z0 - 0.6 < z && z < q.z1 + 0.6)) ok = false; if (ok) depth = d; }
        if (depth) _PLOTS.push({ id: s.id, row: row.name, trade: TRADE_OF[s.id] || row.trades[hi % row.trades.length], axis: 'x', bx, x0: Math.min(xb0, xb0 + bx * depth), x1: Math.max(xb0, xb0 + bx * depth), z0: za, z1: zb2, wall: xb0 + bx * depth, bz: 1, house: s });
      }
      continue;
    }
    hs.sort((a, b) => a.x - b.x);
    hs.forEach((s, i) => {
      const back = Math.cos(s.yaw || 0) > 0 ? -1 : 1 * -1 * -1;      // yaw 0 faces north (-z): the back is +z; yaw PI faces south: the back is -z
      const bz = Math.cos(s.yaw || 0) > 0 ? 1 : -1;
      const hw = s.w / 2, prev = hs[i - 1], next = hs[i + 1];
      let xa = prev ? (prev.x + prev.w / 2 + s.x - hw) / 2 : s.x - hw - 0.5, xb = next ? (s.x + hw + next.x - next.w / 2) / 2 : s.x + hw + 0.15;
      const zb = s.z + bz * (s.d / 2 + 0.12);
      let depth = 0;
      for (let shrink = 0; shrink < 6 && !depth; shrink++) {
        for (let d = 7.0; d >= 2.2; d -= 0.4) {
          let ok = true; for (let x = xa + 0.3; x <= xb - 0.3 && ok; x += 0.7) for (let k = 0.5; k <= d + 0.3 && ok; k += 0.6) if (blocked(x, zb + bz * (k + 0.2), 0.35, s)) ok = false;
          if (ok) { depth = d; break; }
        }
        if (!depth && xb - xa > 4.2) { xa += 0.9; xb -= 0.9; }
      }
      if (!depth || xb - xa < 3.4) return;
      _PLOTS.push({ id: s.id, row: row.name, trade: TRADE_OF[s.id] || row.trades[i % row.trades.length], x0: xa, x1: xb, z0: Math.min(zb, zb + bz * depth), z1: Math.max(zb, zb + bz * depth), bz, wall: zb + bz * depth, house: s, first: i === 0, last: i === hs.length - 1 });
    });
  }
  return _PLOTS;
}
/* [fx3] a gate keeps a clear lane: from 0.8 m to 3.4 m inside it, 0.85 m either side, nothing solid. laneFree tests a lane (x,z the gate, dx,dz the way in) against the colliders built since the plots began;
   pickGate returns the position along the wall nearest the wanted one whose lane is free (the trade is built first, then the gate is cut where it can be walked through). */
/* pieces drawn without a collider that stood within 1.3 m of a gate (test/openings.js lists them): a gate is not cut within 1.4 m of one */
const GATE_AVOID = [[-40.6, -51.1], [-33.6, -14.6], [1.3, -60.2], [-29.3, -35.7], [18.4, -16.4], [9.1, 6.3], [-18.1, -15.2], [35.9, 36.8], [-36.8, -18.6], [-9.8, -17.1], [23.5, -45.7], [-40.4, -43.1]];
function laneFree(x, z, dx, dz, c0, noAvoid) {
  const px = -dz, pz = dx;
  if (!noAvoid) for (const a of GATE_AVOID) if (Math.hypot(a[0] - x, a[1] - z) < 1.4) return false;
  for (let i = 0; i < World.colliders.length; i++) { const c = World.colliders[i]; if (!isFinite(c.x) || c.y1 - c.y0 < 0.3) continue; if (Math.abs(c.x - x) > 6 || Math.abs(c.z - z) > 6) continue;
    for (let t = -1.3; t <= 3.5; t += 0.35) for (let a = -0.9; a <= 0.91; a += 0.3) { const wx = x + dx * t + px * a, wz = z + dz * t + pz * a;
      if (t > 0 && i < (c0 || 0)) continue;      /* inside the lane only what the plots built; the 1.3 m in front of the gap counts every collider (a neighbour's wall) */
      if (c.r !== undefined) { if (Math.hypot(wx - c.x, wz - c.z) < c.r + 0.1) return false; } else { const u = (wx - c.x) * c.ax + (wz - c.z) * c.az, v = (wx - c.x) * c.bx + (wz - c.z) * c.bz; if (Math.abs(u) < c.hx + 0.1 && Math.abs(v) < c.hz + 0.1) return false; } } }
  return true;
}
function pickGate(want, lo, hi, at, dx, dz, c0) {
  if (hi < lo) return want; const cands = []; for (let v = lo; v <= hi + 1e-6; v += 0.25) cands.push(v); cands.sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
  for (const v of cands) { const q = at(v); if (laneFree(q[0], q[1], dx, dz, c0)) return v; }
  let best = want, bd = -1; for (const v of cands) { const q = at(v); if (!laneFree(q[0], q[1], dx, dz, c0, true)) continue; const d = Math.min(9, ...GATE_AVOID.map(a => Math.hypot(a[0] - q[0], a[1] - q[1]))); if (d > bd) { bd = d; best = v; } }
  return best;
}
function buildPlots(bucket) {
  if (TEST && TEST.plots === 0) return; World.plotC0 = World.colliders.length;
  { const raw = bucket; bucket = (x, z) => { const m = raw(3e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 400; m.lowDist = 30; m.noShadow = true; return m; }; }      // [fx3] plot walls and the trades kept in the yards sit in 44 m cells of their own, drawn out to 30 m on Low
  const P = plotsCompute(), R = rng(8831), gy = (x, z) => Terrain.y(x, z);
  const W = 0.3, H = 1.1;
  const wcol = (m, x0, z0, x1, z1, y0, y1) => {      /* a wall's collider is left out where a prop already stands in its line (the prop is solid itself): two solids never overlap */
    const c0 = m4.tp(m.m, [x0, y0, z0]), c1 = m4.tp(m.m, [x1, y0, z1]);
    for (const c of World.colliders) { if (c.y0 > y1 || c.y1 < y0) continue; const r = c.r !== undefined ? c.r : Math.max(c.hx, c.hz); if (r > 1.2) continue; const dx = Math.max(Math.min(c0[0], c1[0]) - c.x, 0, c.x - Math.max(c0[0], c1[0])), dz = Math.max(Math.min(c0[2], c1[2]) - c.z, 0, c.z - Math.max(c0[2], c1[2])); if (Math.hypot(dx, dz) < r + 0.05) return; }
    addBoxCollider(m, x0, z0, x1, z1, y0, y1); };
  const stone = (m, ax, az, bx, bz, h, tone) => {      // a low rubble wall segment with a rounded coping
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const cx = (ax + bx) / 2, cz = (az + bz) / 2, ang = Math.atan2(bz - az, bx - ax), g = Math.min(gy(ax, az), gy(bx, bz), gy(cx, cz)) - 0.15;
    m.push().T(cx, g, cz).RY(-ang); m.mat(MAT.STONE, [tone, tone * 0.97, tone * 0.92], 1.4); m.box(-L / 2, -0.7, -W / 2, L / 2, h + 0.15 - 0.06 * R(), W / 2, 4);      /* sunk into the slope: the open bottom stays underground */ if (L > 1.2) for (const e of [-1, 1]) { m.mat(MAT.STONE, [tone * 1.08, tone * 1.04, tone * 0.98], 1.4); m.box(e * (L / 2 - 0.19) - 0.19, 0, -0.2, e * (L / 2 - 0.19) + 0.19, h + 0.3, 0.2, 4); } m.pop();      /* [fx3] a wall ends in a pier, never on a bare cut face (C3) */
    { const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.15, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.15; wcol(m, cx - ex, cz - ez, cx + ex, cz + ez, g, g + h); }
  };
  const fence = (m, ax, az, bx, bz) => {      // posts and two rails
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const n = Math.max(1, Math.round(L / 2.4));
    m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5);
    for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, g = gy(x, z); m.cbox(x, g - 0.1, z, 0.1, 1.2, 0.1, 0); }
    for (const y of [0.7]) for (let i = 0; i < n; i++) { const x0 = ax + (bx - ax) * i / n, z0 = az + (bz - az) * i / n, x1 = ax + (bx - ax) * (i + 1) / n, z1 = az + (bz - az) * (i + 1) / n; m.beam([x0, gy(x0, z0) + y, z0], [x1, gy(x1, z1) + y, z1], 0.05, 0.08); }
    const cx = (ax + bx) / 2, cz = (az + bz) / 2, ang = Math.atan2(bz - az, bx - ax);
    { const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.05, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.05; wcol(m, cx - ex, cz - ez, cx + ex, cz + ez, gy(cx, cz), gy(cx, cz) + 1.0); }
  };
  const slab = (m, ax, az, bx, bz, h, mat, col, th) => {      /* a board fence or a woven hurdle: one solid leaf on the line, posts at the ends */
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const cx = (ax + bx) / 2, cz = (az + bz) / 2, ang = Math.atan2(bz - az, bx - ax), g = Math.min(gy(ax, az), gy(bx, bz), gy(cx, cz)) - 0.05;
    /* [fx3] never a sheet: posts set in the ground every 2.4 m at most, a top rail and a bottom rail pegged to them, and then boards one by one with a gap between (a board fence), or withies woven in and out of stakes (a hurdle) */
    m.push().T(cx, g, cz).RY(-ang); const nP = Math.max(1, Math.ceil(L / 2.4)); m.mat(MAT.TIMBER, [0.26, 0.2, 0.15], 0.5);
    for (let k = 0; k <= nP; k++) { const px = -L / 2 + L * k / nP; m.box(px - 0.065, -0.25, -0.065, px + 0.065, h + 0.12, 0.065, 4); }
    if (mat === MAT.PLANKS) { m.box(-L / 2, h - 0.22, th / 2 + 0.02, L / 2, h - 0.1, th / 2 + 0.07, 0); m.box(-L / 2, 0.22, th / 2 + 0.02, L / 2, 0.34, th / 2 + 0.07, 0);
      const bw = 0.26, gap = 0.05, n = Math.max(2, Math.floor((L - 0.1) / (bw + gap))); for (let k = 0; k < n; k++) { const x = -L / 2 + 0.07 + (k + 0.5) * (L - 0.14) / n, hh = h - 0.04 - ((k * 7 + 3) % 5) * 0.025; m.mat(MAT.PLANKS, [col[0] * (0.92 + ((k * 13) % 7) * 0.025), col[1] * (0.92 + ((k * 5) % 7) * 0.02), col[2]], 1.0); m.box(x - bw / 2, -0.2, -th / 2, x + bw / 2, hh, th / 2, 4); } }
    else { m.mat(MAT.THATCH, [0.5, 0.4, 0.24], 0.6); for (let r = 0; r < 5; r++) { const y = 0.2 + r * (h - 0.35) / 4; m.beam([-L / 2 + 0.05, y, (r % 2 ? 1 : -1) * 0.035], [L / 2 - 0.05, y + 0.03, (r % 2 ? -1 : 1) * 0.035], 0.05, 0.07); }
      m.mat(MAT.TIMBER, [0.34, 0.26, 0.17], 0.5); const nS = Math.max(2, Math.floor(L / 0.32)); for (let k = 0; k <= nS; k++) { const x = -L / 2 + L * k / nS; m.beam([x, -0.1, 0.0], [x, h - 0.02 - (k % 3) * 0.04, 0.0], 0.05, 0.05); } }
    m.pop();
    { const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.08, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.08; wcol(m, cx - ex, cz - ez, cx + ex, cz + ez, g, g + h); }
  };
  const STYLES = ['stone', 'fence', 'board', 'hurdle'];
  const flat = (m, x, z, rx, rz, c, mat, ry, lift) => { m.mat(mat, c, 0.5); m.push().T(x, gy(x, z) + (lift || 0.02), z).RY(ry || 0); m.quad2([-rx, 0, -rz * 0.6], [-rx * 0.6, 0, rz], [rx, 0, rz * 0.7], [rx * 0.7, 0, -rz]); m.pop(); };
  const crate = (m, x, z, w, h, d, col, mat, solidCol) => { const g = gy(x, z); m.mat(mat || MAT.PLANKS, col, 0.5); m.box(x - w / 2, g, z - d / 2, x + w / 2, g + h, z + d / 2, 4); if (solidCol !== false) addBoxCollider(m, x - w / 2, z - d / 2, x + w / 2, z + d / 2, g, g + h); };
  const trade = (p, m, cx, cz, ux, uz, wd, dp) => {      /* ux,uz: along the row (world x or z axis unit); local frame: a = along row from the plot centre, b = away from the house toward the back wall */
    const at = (a, b) => [cx + a * ux + b * 0, cz + b * p.bz];
    const put = (a, b, f) => { const q = at(a, b); f(q[0], q[1]); };
    if (TEST && TEST.trade === 0) return; const kind = p.trade; if (craftTrade(m, p, gy, R, dp)) return;
    if (kind === 'garden') { for (let i = -2; i <= 2; i++) put(i * 0.95, dp * 0.4, (x, z) => { const g = gy(x, z), len = Math.min(dp * 0.6, 2.6); m.mat(MAT.MUD, [0.17, 0.12, 0.08], 0.5); m.box(x - 0.25, g, z - len / 2, x + 0.25, g + 0.18, z + len / 2, 4); World.hedgeClumps = World.hedgeClumps || []; if (i % 2) { for (let k = 0; k < 4; k++) { const cz2 = z - len / 2 + 0.3 + k * (len - 0.6) / 3; World.hedgeClumps.push([x + (R() - 0.5) * 0.08, g + 0.02, cz2, 0.36 + R() * 0.16, R() * 6.28, 0.2 + R() * 0.2, R()]); } } else { m.mat(MAT.TIMBER, [0.32, 0.25, 0.17], 0.5); for (let k = 0; k < 3; k++) m.beam([x - 0.15, g, z - len / 2 + 0.25 + k * 0.7], [x + 0.05, g + 1.5, z - len / 2 + 0.25 + k * 0.55], 0.03, 0.03); for (let k = 0; k < 3; k++) World.hedgeClumps.push([x - 0.02, g + 0.55, z - len / 2 + 0.25 + k * 0.7, 0.3 + R() * 0.1, R() * 6.28, 0.3, R()]); } });
      put(-wd / 2 + 0.6, dp * 0.85, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.cyl(x, g, z, 0.32, 0.28, 0.55, 6, 2); m.mat(MAT.PLAIN, [0.16, 0.2, 0.22]); m.cyl(x, g + 0.5, z, 0.27, 0.27, 0.02, 6, 2); addCircleCollider(m, x, z, 0.32, g, g + 0.55); flat(m, x + 0.6, z + 0.2, 0.5, 0.3, [0.14, 0.11, 0.08], MAT.MUD, 0.4, 0.03); }); }
    else if (kind === 'woodyard') { put(-wd / 4, dp * 0.55, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.34, 0.26, 0.18], 0.5); for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) { const lx = x - 1.0 + r * 0.2 + k * 0.4, ly = g + 0.17 + r * 0.3, lz = z - 0.5 + (R() - 0.5) * 0.06, ln = 0.9 + R() * 0.3; m.mat(MAT.TIMBER, [0.42 + R() * 0.12, 0.32 + R() * 0.06, 0.22], 0.5); m.beam([lx, ly, lz - ln / 2], [lx, ly, lz + ln / 2], 0.3, 0.3); } addBoxCollider(m, x - 1.3, z - 0.55, x + 1.3, z + 0.65, g, g + 1.2); });
      put(wd / 4, dp * 0.4, (x, z) => { const g = gy(x, z); for (let k = 0; k < 7; k++) { const sx = x + (R() - 0.5) * 2.2, sz = z + 0.5 + R() * 1.3; m.mat(MAT.TIMBER, [0.55 + R() * 0.1, 0.44, 0.3], 0.5); m.beam([sx - 0.15, gy(sx, sz) + 0.06, sz], [sx + 0.15, gy(sx, sz) + 0.08, sz + (R() - 0.5) * 0.2], 0.1, 0.12); } m.mat(MAT.TIMBER, [0.4, 0.31, 0.22], 0.5); m.cyl(x, g, z, 0.26, 0.26, 0.5, 5, 2); m.mat(MAT.PLAIN, [0.1, 0.1, 0.1]); m.beam([x + 0.1, g + 0.5, z], [x + 0.4, g + 0.1, z + 0.2], 0.03, 0.05); for (let k = 0; k < 3; k++) flat(m, x + (R() - 0.5) * 1.6, z + (R() - 0.5) * 1.6, 0.14, 0.04, [0.45, 0.34, 0.2], MAT.TIMBER, R() * 3, 0.03); }); }
    else if (kind === 'hives') { for (let i = -1; i <= 1; i++) put(i * 1.3, dp * 0.4, (x, z) => { const g = gy(x, z); m.mat(MAT.STONE, [0.5, 0.47, 0.42], 0.5); m.box(x - 0.3, g, z - 0.3, x + 0.3, g + 0.35, z + 0.3, 4); m.mat(MAT.THATCH, [0.72, 0.58, 0.28], 0.5); m.ball(x, g + 0.6, z, 0.3, 0.26, 0.3, 6, 4); addCircleCollider(m, x, z, 0.3, g, g + 0.8); });
      put(wd / 4, dp * 0.8, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.33, 0.24], 0.5); m.box(x - 0.8, g + 0.38, z - 0.2, x + 0.8, g + 0.44, z + 0.2, 4); m.box(x - 0.7, g, z - 0.15, x - 0.6, g + 0.38, z + 0.15, 4); m.box(x + 0.6, g, z - 0.15, x + 0.7, g + 0.38, z + 0.15, 4); World.hedgeClumps = World.hedgeClumps || []; for (let k = 0; k < 4; k++) World.hedgeClumps.push([x - 1.0 + k * 0.5, g, z + 0.8, 0.3 + R() * 0.12, R() * 6.28, 0.5, R()]); }); }
    else if (kind === 'pigs') { put(0, dp * 0.55, (x, z) => { const g = gy(x, z); flat(m, x, z, 1.4, 1.0, [0.14, 0.1, 0.07], MAT.MUD, 0, 0.03); for (const [a, b] of [[-1.5, -1.1], [1.5, -1.1], [1.5, 1.1], [-1.5, 1.1], [-1.5, -1.1]].slice(0, 4)) { } fence(m, x - 1.6, z - 1.2, x + 1.6, z - 1.2); fence(m, x + 1.6, z - 1.2, x + 1.6, z + 1.2); fence(m, x + 1.6, z + 1.2, x - 1.6, z + 1.2); crate(m, x - 1.0, z + 0.75, 0.9, 0.5, 0.35, [0.32, 0.25, 0.18], MAT.PLANKS, false); m.mat(MAT.PLANKS, [0.38, 0.3, 0.22], 0.5); m.box(x - 1.55, g, z - 1.15, x - 0.6, g + 1.4, z - 1.05, 4); m.box(x - 1.6, g + 1.4, z - 1.2, x - 0.5, g + 1.5, z - 0.2, 4);
        /* no pig is modelled: straw and the churned wallow say pigs live here */ flat(m, x + 0.4, z + 0.2, 0.8, 0.5, [0.5, 0.4, 0.2], MAT.THATCH, 0.4, 0.03); }); }
    else if (kind === 'hens') { put(-wd / 4, dp * 0.5, (x, z) => { const g = gy(x, z); if (typeof animalPen === 'function') animalPen('hen', x, g, z, Math.PI);      /* [ch4] hens live here: 78_animals.js */ m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.box(x - 0.7, g + 0.5, z - 0.5, x + 0.7, g + 1.15, z + 0.5, 4); for (const sx of [-0.6, 0.6]) for (const sz of [-0.4, 0.4]) m.box(x + sx - 0.04, g, z + sz - 0.04, x + sx + 0.04, g + 0.5, z + sz + 0.04, 4); m.mat(MAT.THATCH, [0.55, 0.45, 0.25], 0.5); m.box(x - 0.8, g + 1.15, z - 0.6, x + 0.8, g + 1.25, z + 0.6, 4); addBoxCollider(m, x - 0.8, z - 0.6, x + 0.8, z + 0.6, g, g + 1.2);
      for (let k = 0; k < 4; k++) { const hx = x + (R() - 0.5) * 3, hz = z + 1.2 + R() * 1.2; flat(m, hx, hz, 0.3, 0.2, [0.4, 0.32, 0.18], MAT.THATCH, R() * 3, 0.025); } }); }
    else if (kind === 'washing') { for (const sx of [-1, 1]) put(sx * wd * 0.33, dp * 0.5, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); m.beam([x, g, z], [x, g + 2.0, z], 0.05, 0.05); });
      put(-wd * 0.33, dp * 0.5, (x0, z0) => { const x1 = x0 + wd * 0.66 * ux, z1 = z0; const g0 = gy(x0, z0); m.mat(MAT.PLAIN, [0.7, 0.68, 0.62]); m.beam([x0, g0 + 1.9, z0], [x1, g0 + 1.75, z1], 0.012, 0.012); for (let k = 0; k < 5; k++) { const t = (k + 0.7) / 5.6, cxx = x0 + (x1 - x0) * t, col = [[0.78, 0.75, 0.68], [0.6, 0.56, 0.5], [0.5, 0.48, 0.44], [0.66, 0.5, 0.44], [0.72, 0.7, 0.62]][k]; m.mat(MAT.CLOTH, col, 0.5); m.quad2([cxx - 0.22, g0 + 1.85 - t * 0.15, z0], [cxx - 0.25, g0 + 1.05, z0], [cxx + 0.25, g0 + 1.05, z0], [cxx + 0.22, g0 + 1.85 - t * 0.15, z0]); } });
      put(wd * 0.25, dp * 0.25, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.36, 0.28, 0.2], 0.5); m.cyl(x, g, z, 0.42, 0.36, 0.5, 6, 2); m.mat(MAT.PLAIN, [0.22, 0.26, 0.3]); m.cyl(x, g + 0.46, z, 0.36, 0.36, 0.03, 6, 2); addCircleCollider(m, x, z, 0.42, g, g + 0.5); }); }
    else if (kind === 'cooper') { put(-wd / 4, dp * 0.5, (x, z) => { for (let k = 0; k < 4; k++) { const bx = x + (k % 2) * 0.78, bz = z + ((k / 3) | 0) * 0.78, g = gy(bx, bz); m.mat(MAT.PLANKS, [0.42, 0.32, 0.2], 0.5); m.cyl(bx, g, bz, 0.34, 0.38, 0.8, 6, 2); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.5); m.cyl(bx, g + 0.15, bz, 0.385, 0.385, 0.04, 6, 0); m.cyl(bx, g + 0.62, bz, 0.37, 0.37, 0.04, 6, 0); addCircleCollider(m, bx, bz, 0.36, g, g + 0.8); }
      const sx = x + 2.9, g = gy(sx, z); m.mat(MAT.TIMBER, [0.5, 0.4, 0.26], 0.5); for (let k = 0; k < 7; k++) m.beam([sx - 0.3 + k * 0.1, g, z], [sx + 0.2 + k * 0.1, g + 1.3, z + 0.3], 0.025, 0.04); }); }
    else if (kind === 'dyer') {
      /* [fx3] dull dyes, never flat primaries: woad (grey-blue), madder (brick), weld (old gold); vats with a stained rim and ground, cloth hung in folds with a rolled hem, darker and wetter at the bottom */
      for (let i = 0; i < 3; i++) put(-wd / 3 + i * 1.15, dp * 0.35, (x, z) => { const g = gy(x, z), col = [[0.17, 0.21, 0.28], [0.36, 0.17, 0.13], [0.4, 0.34, 0.15]][i]; m.mat(MAT.PLANKS, [0.3, 0.23, 0.17], 0.5); m.cyl(x, g, z, 0.5, 0.46, 0.7, 7, 2); m.mat(MAT.PLAIN, col.map(v => v * 0.8)); m.cyl(x, g + 0.62, z, 0.44, 0.44, 0.02, 7, 2); m.mat(MAT.METAL, [0.18, 0.17, 0.16], 0.5); m.cyl(x, g + 0.5, z, 0.52, 0.52, 0.04, 7, 0); m.cyl(x, g + 0.12, z, 0.5, 0.5, 0.04, 7, 0); addCircleCollider(m, x, z, 0.5, g, g + 0.7); flat(m, x + 0.1, z + 0.55, 0.8, 0.5, col.map(v => v * 0.45), MAT.MUD, R() * 3, 0.03); flat(m, x - 0.3, z + 1.0, 0.4, 0.25, col.map(v => v * 0.35), MAT.MUD, R() * 3, 0.035); });
      put(0, dp * 0.8, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.3, 0.23, 0.17], 0.5); for (const sx of [-1.5, 1.5]) m.beam([x + sx, g, z], [x + sx, g + 2.0, z], 0.07, 0.07); m.beam([x - 1.5, g + 1.9, z], [x + 1.5, g + 1.9, z], 0.05, 0.05); m.beam([x - 1.5, g + 1.2, z + 0.05], [x + 1.5, g + 1.2, z + 0.05], 0.04, 0.04);
        const cloth = (x0, w, h, col, y0) => { const n = 4; for (let f = 0; f < n; f++) { const xa = x0 + w * f / n, xb = x0 + w * (f + 1) / n, za = z + (f % 2 ? 0.07 : -0.07), zb = z + (f % 2 ? -0.07 : 0.07), hh = h * (0.94 + 0.06 * ((f * 7) % 3) / 2);
            m.mat(MAT.CLOTH, col, 0.5); m.quad2([xa, y0, za], [xa, y0 - hh * 0.55, za], [xb, y0 - hh * 0.55, zb], [xb, y0, zb]); m.mat(MAT.CLOTH, col.map(v => v * 0.68), 0.5); m.quad2([xa, y0 - hh * 0.55, za], [xa, y0 - hh, za], [xb, y0 - hh, zb], [xb, y0 - hh * 0.55, zb]); }
          m.mat(MAT.CLOTH, col.map(v => v * 0.6), 0.5); m.beam([x0, y0, z], [x0 + w, y0, z], 0.05, 0.05); };
        cloth(x - 1.4, 1.2, 1.0, [0.22, 0.27, 0.36], g + 1.88); cloth(x + 0.2, 1.1, 1.15, [0.46, 0.24, 0.19], g + 1.88); cloth(x - 0.1, 0.5, 0.55, [0.5, 0.43, 0.2], g + 1.18); }); }
    else if (kind === 'forge') { put(-wd / 4, dp * 0.4, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); m.cyl(x, g, z, 0.3, 0.28, 0.55, 5, 2); m.mat(MAT.METAL, [0.17, 0.17, 0.18], 0.5); m.box(x - 0.35, g + 0.55, z - 0.12, x + 0.35, g + 0.68, z + 0.12, 4); addCircleCollider(m, x, z, 0.32, g, g + 0.7);
      for (let k = 0; k < 5; k++) { const sx = x + 1.4 + R() * 2, sz = z + (R() - 0.5) * 2; m.mat(MAT.METAL, [0.22 + R() * 0.12, 0.17, 0.14], 0.5); m.ball(sx, gy(sx, sz) + 0.06, sz, 0.12 + R() * 0.2, 0.06, 0.1 + R() * 0.12, 5, 3); } flat(m, x + 0.4, z + 1.3, 0.9, 0.55, [0.06, 0.06, 0.06], MAT.PLAIN, 0.4, 0.03); }); }
    else if (kind === 'stable') { put(-wd / 4, dp * 0.35, (x, z) => { const g = gy(x, z); m.mat(MAT.THATCH, [0.72, 0.6, 0.3], 0.5); m.ball(x, g + 0.7, z, 1.3, 0.8, 1.0, 6, 4); addBoxCollider(m, x - 1.1, z - 0.8, x + 1.1, z + 0.8, g, g + 1.4); m.mat(MAT.PLANKS, [0.34, 0.27, 0.2], 0.5); m.box(x + 2.0, g, z - 0.3, x + 3.2, g + 0.5, z + 0.3, 4); m.mat(MAT.PLAIN, [0.15, 0.2, 0.24]); m.box(x + 2.1, g + 0.42, z - 0.2, x + 3.1, g + 0.5, z + 0.2, 4); addBoxCollider(m, x + 2.0, z - 0.3, x + 3.2, z + 0.3, g, g + 0.5); flat(m, x + 2.6, z + 1.0, 1.0, 0.6, [0.18, 0.13, 0.08], MAT.MUD, 0.3, 0.03); });
      put(wd / 4, dp * 0.7, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.box(x - 1.0, g + 0.45, z - 0.5, x + 1.0, g + 0.7, z + 0.5, 4); for (const sx of [-0.8, 0.8]) m.cyl(x + sx, g, z + 0.6, 0.38, 0.38, 0.1, 6, 2); addBoxCollider(m, x - 1.0, z - 0.55, x + 1.0, z + 0.55, g, g + 0.75); }); }
  };
  for (const p of P) { R.seed(idSeed("plot" + p.id));      // [fx3] seeded from the house: removing another house leaves this plot as it was
    if (p.axis === 'x') {      /* walls on the party lines, a back wall with a gate, the work kept in a lean-to against the house's back (frame of the house) */
      const m = bucket((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2), tone = 0.44 + R() * 0.06, xw = p.wall, xh = p.bx > 0 ? p.x0 : p.x1, zc = (p.z0 + p.z1) / 2, gw = 1.3;
      localTrade(m, p, gy, R, flat, addBoxCollider, addCircleCollider);
      const gz = pickGate(zc + (R() - 0.5) * 2, p.z0 + 1.0, p.z1 - 1.0, v => [xw, v], -p.bx, 0, World.plotC0);
      stone(m, xw, p.z0 + 0.15, xw, gz - gw / 2, H - 0.1, tone); stone(m, xw, gz + gw / 2, xw, p.z1 - 0.15, H - 0.1, tone);
      (World.openings = World.openings || []).push({ kind: 'plotgate', x: xw, z: gz, dx: 1, dz: 0, w: gw });
      for (const zs of [gz - gw / 2, gz + gw / 2]) { m.mat(MAT.STONE, [tone * 1.1, tone * 1.05, tone], 1.4); m.cbox(xw, gy(xw, zs) - 0.1, zs, 0.4, 1.6, 0.4, 0); }
      for (const zs of [p.z0, p.z1]) stone(m, xh, zs, xw - p.bx * 0.15, zs, H * 0.92, tone);
      continue;
    }
    const wd = p.x1 - p.x0, dp = Math.abs(p.wall - (p.bz > 0 ? p.z0 : p.z1)), cx = (p.x0 + p.x1) / 2, zFront = p.bz > 0 ? p.z0 : p.z1, tone = 0.42 + R() * 0.1, styleI = ((Math.abs(p.house.x * 3.1 + p.house.z) | 0) + P.indexOf(p)) % 4;
    const m = bucket(cx, (p.z0 + p.z1) / 2), h = H - 0.15 * R(), style = STYLES[styleI], seg = (m2, ax, az, bx, bz, hh) => style === 'stone' ? stone(m2, ax, az, bx, bz, hh, tone) : style === 'fence' ? fence(m2, ax, az, bx, bz) : style === 'board' ? slab(m2, ax, az, bx, bz, 1.55, MAT.PLANKS, [0.52 + R() * 0.06, 0.42, 0.31], 0.1) : slab(m2, ax, az, bx, bz, 1.15, MAT.THATCH, [0.46, 0.37, 0.2], 0.14);
    const gate = (a, b, gx, gw) => { /* a wall along x from a to b with a gap [gx-gw/2, gx+gw/2] */ };
    if (!(TEST && TEST.plots === 2) && true) trade(p, m, cx, zFront + p.bz * 0.01, 1, 0, wd, dp);
    const zw = p.wall, gw = 1.2, gx = pickGate(cx + (R() - 0.5) * (wd - 2.4), p.x0 + 1.0, p.x1 - 1.0, v => [v, zw], 0, -p.bz, World.plotC0); (World.openings = World.openings || []).push({ kind: 'plotgate', x: gx, z: zw, dx: 0, dz: 1, w: gw });
    seg(m, p.x0 + 0.15, zw, gx - gw / 2, zw, h), seg(m, gx + gw / 2, zw, p.x1 - 0.15, zw, h);
    for (const sx of [gx - gw / 2, gx + gw / 2]) { m.mat(MAT.STONE, [tone * 1.1, tone * 1.05, tone], 1.4); m.cbox(sx, gy(sx, zw) - 0.1, zw, 0.4, 1.6, 0.4, 0); }
    { const gz = zw, g0 = gy(gx, gz); m.mat(MAT.STONE, [0.5, 0.47, 0.42], 1.2); m.box(gx - 0.6, g0 - 0.02, gz - 0.28, gx + 0.6, g0 + 0.1, gz + 0.28, 4);      /* a doorstep worn in the gap */
      m.push().T(gx + gw / 2 - 0.05, g0, gz).RY(p.bz > 0 ? 1.5 : -1.5); m.mat(MAT.PLANKS, [0.33, 0.26, 0.19], 0.8); m.box(-0.95, 0.08, -0.04, 0, 1.2, 0.04, 4); m.mat(MAT.METAL, [0.14, 0.14, 0.14], 0.4); m.box(-0.2, 0.55, -0.06, -0.12, 0.65, 0.06, 4); m.pop(); }
    /* the side party walls, with the house's own side left open where the neighbour is a gap: they run from the house's back wall to the back wall of the plot */
    const zh = zFront;
    for (const sx of [p.x0, p.x1]) {
      if (sx === p.x0 && P.some(q => q !== p && q.row === p.row && Math.abs(q.x1 - p.x0) < 0.06 && Math.abs(q.bz - p.bz) < 1e-6)) continue;      /* a party wall is built once */
      seg(m, sx, zh, sx, zw - p.bz * 0.15, h * 0.92);
    }
    p.gate = [gx, zw];
  }
}

// [fx3] no yard where the back wall meets a road: a lean-to shed against the wall (docs/TOWNPLAN.md: no nobody's land), with the work that is kept in it, so the wall you face from the road has a roof, posts and a door-sized opening in it
function buildStrips(bucket) {
  if (TEST && TEST.plots === 0) return;
  const R = rng(4417), gy = (x, z) => Terrain.y(x, z);
  for (const [id, what] of [['in.11', 'wood'], ['in.76', 'cask'], ['guardhouse', 'tack']]) {
    const s = SITES.find(q => q.id === id); if (!s) continue;
    const c = siteToWorld(s, 0, s.d / 2 + 0.7), g = gy(c[0], c[1]), m = bucket(c[0], c[1]), w = Math.min(s.w - 1.2, 3.4), hw = w / 2;
    m.push().T(c[0], g, c[1]).RY(-s.yaw);
    m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); for (const sx of [-hw, hw]) m.beam([sx, -0.1, 0.65], [sx, 2.0, 0.65], 0.1, 0.1);
    m.beam([-hw, 2.0, 0.65], [hw, 2.0, 0.65], 0.1, 0.1);
    m.mat(MAT.THATCH, [0.5, 0.42, 0.26], 0.5); m.quad2([-hw - 0.15, 2.45, -0.62], [hw + 0.15, 2.45, -0.62], [hw + 0.15, 1.95, 0.8], [-hw - 0.15, 1.95, 0.8]);
    m.mat(MAT.PLANKS, [0.34, 0.27, 0.2], 0.5); m.box(-hw + 0.1, 0, 0.2, hw - 0.1, 0.06, 0.62, 4);
    if (what === 'wood') { m.mat(MAT.TIMBER, [0.42, 0.32, 0.22], 0.5); for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) { const lx = -hw + 0.35 + r * 0.15 + k * 0.4; m.beam([lx, 0.2 + r * 0.28, -0.4], [lx, 0.2 + r * 0.28, 0.5], 0.28, 0.28); } }
    else if (what === 'cask') { for (let k = 0; k < 3; k++) { m.mat(MAT.PLANKS, [0.42, 0.32, 0.2], 0.5); m.cyl(-hw + 0.7 + k * 0.85, 0, 0.1, 0.34, 0.38, 0.8, 6, 2); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.5); m.cyl(-hw + 0.7 + k * 0.85, 0.15, 0.1, 0.385, 0.385, 0.04, 6, 0); } }
    else { m.mat(MAT.TIMBER, [0.36, 0.28, 0.2], 0.5); m.box(-hw + 0.3, 0.45, 0.0, -hw + 1.8, 0.55, 0.45, 4); m.mat(MAT.PLAIN, [0.2, 0.14, 0.1], 0.5); for (let k = 0; k < 3; k++) m.ball(-hw + 0.5 + k * 0.5, 0.6 + 0.2, 0.2, 0.12, 0.22, 0.08, 5, 4); }
    m.pop();
    for (const [lx, lz] of [[-hw, 0.65], [hw, 0.65]]) { const p = siteToWorld(s, lx, s.d / 2 + 0.7 + (lz - 0.7) + 0.0); addCircleCollider(m, p[0], p[1], 0.1, g, g + 2.0); }
  }
}

/* [fx3] trades in a house's own frame (local +z is its back): used by plots whose back faces east or west. Each piece is anchored at a local point, so any facing works. */
function localTrade(m, p, gy, R, flat) {
  const s = p.house, depth = p.axis === 'x' ? p.x1 - p.x0 : 3, hw = s.w / 2, z0 = s.d / 2 + 0.2;
  const at = (lx, lz, f) => { const w = siteToWorld(s, lx, lz), g = gy(w[0], w[1]); m.push().T(w[0], g, w[1]).RY(-s.yaw); f(g, w); m.pop(); };
  const kind = p.trade; if (craftTrade(m, p, gy, R, depth)) return;
  if (kind === 'garden') { for (let i = -2; i <= 2; i++) at(i * 0.9, z0 + depth * 0.45, () => { const len = Math.min(depth * 0.6, 2.4); m.mat(MAT.MUD, [0.17, 0.12, 0.08], 0.5); m.box(-0.25, 0, -len / 2, 0.25, 0.18, len / 2, 4); m.mat(MAT.LEAVES, [0.24 + R() * 0.16, 0.4, 0.13], 0.5); if (i % 2) { for (let k = 0; k < 3; k++) gLeaf(m, 0, 0.18, -len / 2 + 0.3 + k * (len - 0.6) / 2, 0.34, k * 2.1); } else { m.mat(MAT.TIMBER, [0.32, 0.25, 0.17], 0.5); for (let k = 0; k < 3; k++) m.beam([-0.1, 0, -len / 2 + 0.3 + k * 0.7], [0.05, 1.5, -len / 2 + 0.3 + k * 0.7], 0.03, 0.03); } });
    at(hw - 0.6, z0 + 0.5, (g, w) => { m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.cyl(0, 0, 0, 0.32, 0.28, 0.55, 6, 2); addCircleCollider(m, 0, 0, 0.32, 0, 0.55); }); }
  else if (kind === 'woodyard') { at(-hw * 0.4, z0 + depth * 0.4, (g, w) => { for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) { m.mat(MAT.TIMBER, [0.42 + R() * 0.12, 0.32, 0.22], 0.5); m.beam([-1.0 + r * 0.2 + k * 0.4, 0.17 + r * 0.28, -0.45], [-1.0 + r * 0.2 + k * 0.4, 0.17 + r * 0.28, 0.45], 0.28, 0.28); } addBoxCollider(m, -1.3, -0.6, 1.3, 0.6, 0, 1.2); });
    at(hw * 0.4, z0 + depth * 0.3, () => { m.mat(MAT.TIMBER, [0.4, 0.31, 0.22], 0.5); m.cyl(0, 0, 0, 0.26, 0.26, 0.5, 5, 2); for (let k = 0; k < 6; k++) { m.mat(MAT.TIMBER, [0.55, 0.44, 0.3], 0.5); m.beam([-0.15 + (R() - 0.5) * 1.6, 0.06, 0.5 + R() * 1.0], [0.15 + (R() - 0.5) * 1.6, 0.08, 0.6 + R() * 1.0], 0.1, 0.12); } }); }
  else if (kind === 'hens') { at(-hw * 0.3, z0 + depth * 0.4, (g, w) => { if (typeof animalPen === 'function') animalPen('hen', w[0], g, w[1], -s.yaw + Math.PI);      /* [ch4] hens live here: 78_animals.js */ m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.box(-0.7, 0.5, -0.5, 0.7, 1.15, 0.5, 4); for (const sx of [-0.6, 0.6]) for (const sz of [-0.4, 0.4]) m.box(sx - 0.04, 0, sz - 0.04, sx + 0.04, 0.5, sz + 0.04, 4); m.mat(MAT.THATCH, [0.55, 0.45, 0.25], 0.5); m.box(-0.8, 1.15, -0.6, 0.8, 1.25, 0.6, 4); addBoxCollider(m, -0.8, -0.6, 0.8, 0.6, 0, 1.2); for (let k = 0; k < 4; k++) { } }); }
  else { for (let i = -1; i <= 1; i++) at(i * 1.2, z0 + depth * 0.4, (g, w) => { m.mat(MAT.STONE, [0.5, 0.47, 0.42], 0.5); m.box(-0.3, 0, -0.3, 0.3, 0.35, 0.3, 4); m.mat(MAT.THATCH, [0.72, 0.58, 0.28], 0.5); m.ball(0, 0.6, 0, 0.3, 0.26, 0.3, 6, 4); addCircleCollider(m, 0, 0, 0.3, 0, 0.8); }); }
}

// [fx3] Chapelgate: the churchyard is walled in rubble (1.5 m, coped) with a roofed lych gate on the side the path comes from, a flagged path from the gate to the chapel door, and yews; the grave stones stand in long grass (churchyards keep their grass, docs/TOWNPLAN.md)
function buildChurchyard(bucket) {
  if (TEST && TEST.plots === 0) return;
  const C = SITE.chapel; if (!C) return; const R = rng(5090), gy = (x, z) => Terrain.y(x, z), W = (lx, lz) => siteToWorld(C, lx, lz);
  const wall = (m, a, b) => { const A = W(a[0], a[1]), B = W(b[0], b[1]), L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 0.3) return; const cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2, ang = Math.atan2(B[1] - A[1], B[0] - A[0]), g = Math.min(gy(A[0], A[1]), gy(B[0], B[1]), gy(cx, cz)) - 0.2, tone = 0.4 + R() * 0.05;
    m.push().T(cx, g, cz).RY(-ang); m.mat(MAT.STONE, [tone, tone * 0.97, tone * 0.92], 1.4); m.box(-L / 2, 0, -0.27, L / 2, 1.55, 0.27, 4); m.mat(MAT.STONE, [tone * 1.12, tone * 1.08, tone * 1.0], 1.4); m.box(-L / 2 - 0.02, 1.5, -0.33, L / 2 + 0.02, 1.7, 0.33, 4); m.pop();
    const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.27, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.27; addBoxCollider(m, cx - ex, cz - ez, cx + ex, cz + ez, g, g + 1.5); };
  const m0 = bucket(W(0, -10)[0], W(0, -10)[1]);
  wall(m0, [-7.5, -4.4], [-7.5, -8.9]); wall(m0, [-7.5, -11.1], [-7.5, -16.73]); wall(m0, [-7.5, -17], [7.73, -17]); wall(m0, [8, -16.73], [8, -4.4]);
  /* the lych gate: four posts, a gabled roof along the way in, a bench each side, a stone threshold */
  { const o = W(-7.5, -10), g = gy(o[0], o[1]), o2 = W(-6.5, -10); (World.openings = World.openings || []).push({ kind: 'lychgate', x: o[0], z: o[1], dx: o2[0] - o[0], dz: o2[1] - o[1], w: 1.8 }); m0.push().T(o[0], g - 0.05, o[1]).RY(-C.yaw);
    m0.mat(MAT.TIMBER, [0.26, 0.2, 0.15], 0.6); for (const sx of [-0.9, 0.9]) for (const sz of [-1.15, 1.15]) m0.box(sx - 0.1, 0, sz - 0.1, sx + 0.1, 2.5, sz + 0.1, 4);
    for (const sz of [-1.15, 1.15]) m0.box(-1.0, 2.3, sz - 0.07, 1.0, 2.5, sz + 0.07, 4); for (const sx of [-0.9, 0.9]) m0.box(sx - 0.07, 2.3, -1.2, sx + 0.07, 2.5, 1.2, 4);
    m0.mat(MAT.SHINGLE, [0.4, 0.37, 0.32], 0.6); m0.quad2([-1.15, 2.4, -1.45], [-1.15, 2.4, 1.45], [0, 3.25, 1.45], [0, 3.25, -1.45]); m0.quad2([1.15, 2.4, -1.45], [1.15, 2.4, 1.45], [0, 3.25, 1.45], [0, 3.25, -1.45]);
    m0.mat(MAT.PLANKS, [0.34, 0.27, 0.2], 0.6); for (const sz of [-1.0, 1.0]) m0.box(-0.55, 0.42, sz - 0.2, 0.55, 0.5, sz + 0.2, 4);
    m0.mat(MAT.STONE, [0.55, 0.52, 0.47], 1.0); m0.box(-0.8, 0, -0.7, 0.8, 0.12, 0.7, 4); m0.pop();
    for (const sz of [-1.15, 1.15]) { const q = siteToWorld(C, -7.5, -10 + sz); addCircleCollider(m0, q[0], q[1], 0.15, g, g + 2.5); } }
  /* [fx3] yews: dark, dense, rounded masses (two overlapping lobes on a short trunk) at the corners and by the path */
  for (const [lx, lz, sc] of [[-5.5, -5.8, 1.0], [-5.8, -15.5, 1.15], [6.8, -15.8, 0.95], [6.5, -5.8, 1.05], [2.5, -12.5, 0.85]]) { const q = W(lx, lz), g = gy(q[0], q[1]), mm = bucket(q[0], q[1]);
    mm.push().T(q[0], g - 0.1, q[1]).RY(R() * 6.28); mm.mat(MAT.BARK, [0.3, 0.22, 0.17], 1); mm.cyl(0, 0, 0, 0.3 * sc, 0.2 * sc, 1.4 * sc, 6, 0);
    mm.mat(MAT.MOSS, [0.1, 0.16, 0.09], 2.5); mm.ball(0, 1.5 * sc, 0, 1.35 * sc, 1.05 * sc, 1.25 * sc, 9, 6); mm.ball(0.25 * sc, 2.5 * sc, -0.1, 1.0 * sc, 1.1 * sc, 0.95 * sc, 8, 6); mm.ball(-0.4 * sc, 1.1 * sc, 0.5, 0.8 * sc, 0.7 * sc, 0.8 * sc, 7, 5); mm.pop(); addCircleCollider(mm, q[0], q[1], 0.35 * sc, g, g + 2); }
  /* a path of flags from the gate to the chapel door, and one to the west wall's second gap if any */
  { const pts = [[-7.2, -10], [-4.5, -8.6], [-2, -6.8], [0, -5]]; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], n = 3; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, lx = a[0] + (b[0] - a[0]) * t + (R() - 0.5) * 0.15, lz = a[1] + (b[1] - a[1]) * t + (R() - 0.5) * 0.15, w = W(lx, lz), mm = bucket(w[0], w[1]), g = gy(w[0], w[1]); mm.push().T(w[0], g, w[1]).RY(-C.yaw + Math.atan2(b[1] - a[1], b[0] - a[0]) + (R() - 0.5) * 0.1); mm.mat(MAT.STONE, [0.52 + R() * 0.08, 0.5, 0.45], 1.2); mm.box(-0.55, -0.03, -0.45, 0.55, 0.03, 0.45, 4); mm.pop(); } } }
}

// [fx3] Chapel Street's rise: where the road is steepest below the gate, a flight of five broad stone steps on the west half and a cart ramp (the road's own slope, setts) on the east half. The walkable surface under the steps is a ramp floor along the tread line (as the house stairs do, 71b_storeys.js); the treads and their cheek walls are the picture.
function buildChapelRise(bucket) {
  if (TEST && TEST.plots === 0) return;
  const R = rng(3318), x0 = -11.2, x1 = -9.0, zS = -52.0, zN = -56.0, n = 5, gy = (x, z) => Terrain.y(x, z), xm = (x0 + x1) / 2;
  const hS = gy(xm, zS), hN = gy(xm, zN), rise = (hN - hS) / n, m = bucket(xm, (zS + zN) / 2), dz = (zS - zN) / n;
  for (let k = 0; k < n; k++) {
    const za = zS - dz * k, zb = zS - dz * (k + 1), top = hS + (k + 1) * rise - 0.02, tone = 0.46 + R() * 0.06;
    m.mat(MAT.STONE, [tone, tone * 0.97, tone * 0.92], 1.2); m.box(x0, Math.min(gy(x0, zb), gy(x1, zb)) - 0.45, zb, x1, top, za);
    m.mat(MAT.STONE, [tone * 1.1, tone * 1.07, tone * 1.0], 1.2); m.box(x0 - 0.03, top - 0.08, zb - 0.03, x1 + 0.03, top, za, 4);       /* the worn tread */
    for (const cx of [x0 - 0.2, x1 + 0.0]) { m.mat(MAT.STONE, [tone * 0.9, tone * 0.88, tone * 0.84], 1.4); m.box(cx, Math.min(gy(cx, zb), top) - 0.3, zb, cx + 0.2, top + 0.45, za); }       /* cheek walls that step with it */
  }
  addFloor(m, x0, zN, x1, zS, hN + 0.5 * rise, hS + 0.5 * rise, 'z');
  /* a handrail on the west cheek, a lantern bracket at the top */
  m.mat(MAT.TIMBER, [0.26, 0.2, 0.15], 0.5); m.beam([x0 - 0.1, hS + 0.95, zS], [x0 - 0.1, hN + 0.95, zN], 0.05, 0.05); for (const t of [0, 1]) m.box(x0 - 0.15, (t ? hN : hS) - 0.1, (t ? zN : zS) - 0.05, x0 - 0.05, (t ? hN : hS) + 1.0, (t ? zN : zS) + 0.05, 4);
}

// [fx3] the east cluster's lane: a cobbled way between the two rows that wanders and ends at a well; the well stands where the lane's drain would meet the bank
function buildEastLane(bucket) {
  if (TEST && TEST.plots === 0) return;
  const gy = (x, z) => Terrain.y(x, z), wx = 36.2, wz = -44.9, m = bucket(wx, wz), g = gy(wx, wz);
  m.push().T(wx, g, wz).RY(0.3); Props.well(m); m.pop();
  addCircleCollider(m, wx, wz, 1.0, g, g + 1.2);
}

// [fx3] the way from the north gate to the lych gate: a walled side (rubble, 1.1 m) and a hedged side (a dense hedge on a low bank), 3 m apart, the path between worn to earth with a flagged middle
function buildChapelWay(bucket) {
  { const raw = bucket; bucket = (x, z) => { const m = raw(3e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 400; m.lowDist = 36; m.noShadow = true; return m; }; }      // [fx3] 44 m cells of their own, on Low drawn out to 36 m
  if (TEST && TEST.plots === 0) return;
  const R = rng(6161), gy = (x, z) => Terrain.y(x, z), P = [[-6.3, -62.6], [-10.0, -63.4], [-13.6, -64.0], [-16.0, -64.7], [-16.0, -66.5]];
  for (let i = 0; i + 1 < P.length; i++) {
    const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L, ang = Math.atan2(dz, dx);
    for (const sd of i === 3 ? [] : [-1, 1]) { const ax = a[0] + nx * sd * 1.5, az = a[1] + nz * sd * 1.5, cx = ax + dx / 2, cz = az + dz / 2, g = gy(cx, cz) - 0.15, m = bucket(cx, cz);
      m.push().T(cx, g, cz).RY(-ang);
      if (sd < 0) { m.mat(MAT.STONE, [0.4, 0.38, 0.35], 1.4); m.box(-L / 2, 0, -0.25, L / 2, 1.15, 0.25, 4); }
      else { earthBank(m, [cx - Math.cos(ang) * L / 2, cz - Math.sin(ang) * L / 2], [cx + Math.cos(ang) * L / 2, cz + Math.sin(ang) * L / 2], 0.5, 0.35, null, { x: cx, z: cz, ang, y: g });
        World.hedgeClumps = World.hedgeClumps || []; const nC = Math.round(L / 0.85); for (let c = 0; c < nC; c++) { if (R() < 0.12) continue; const u = -L / 2 + (c + 0.5) * L / nC + (R() - 0.5) * 0.3, v = (R() - 0.5) * 0.5, w = [cx + Math.cos(ang) * u - Math.sin(ang) * v, cz + Math.sin(ang) * u + Math.cos(ang) * v]; World.hedgeClumps.push([w[0], gy(w[0], w[1]) + 0.2, w[1], 1.0 + R() * 0.8, R() * 6.28, 0.1 + R() * 0.2, R()]); }
        if (i === 1 && sd > 0) World.hedgeSaplings = [[cx - 0.5, cz - 0.1], [cx + 1.2, cz + 0.3]]; }
      addBoxCollider(m, -L / 2 + 0.45, -0.3, L / 2 - 0.45, 0.3, 0, 1.3);
      m.pop(); }
    for (let k = 0; k < 3; k++) { const t = (k + 0.5) / 3, x = a[0] + dx * t, z = a[1] + dz * t, mm = bucket(x, z), g = gy(x, z); mm.push().T(x, g, z).RY(-ang + (R() - 0.5) * 0.1); mm.mat(MAT.STONE, [0.5 + R() * 0.07, 0.48, 0.43], 1.2); mm.box(-0.5, -0.03, -0.45, 0.5, 0.03, 0.45, 4); mm.pop(); }
  }
}

/* [fx3] a low earth bank as one closed smooth form along a ground line: a rounded ridge (width w each side, height h at the crown) that follows the terrain across and along, its foot buried under the ground on both sides and the ends tapering down into the grass. The terrain's own grass is the skin; no box, no free edge. */
function earthBank(m, a, b, w, h, tint, fr) {
  const tl = (x, y, z) => { if (!fr) return [x, y, z]; const X = x - fr.x, Z = z - fr.z, c = Math.cos(fr.ang), sn = Math.sin(fr.ang); return [X * c + Z * sn, y - fr.y, -X * sn + Z * c]; };
  const gy = (x, z) => Terrain.y(x, z), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 0.2) return;
  const nx = -dz / L, nz = dx / L, ux = dx / L, uz = dz / L, tap = Math.min(0.9, L / 3);
  const offs = [0, tap]; for (let u = tap + 0.8; u < L - tap - 0.3; u += 0.8) offs.push(u); offs.push(L - tap, L);
  const prof = [[-1.45, -0.35], [-1, 0.02], [-0.5, 0.8], [0, 1], [0.5, 0.8], [1, 0.02], [1.45, -0.35]];
  const ring = offs.map((u, i) => { const f = i === 0 || i === offs.length - 1 ? 0 : 1, cx = a[0] + ux * u, cz = a[1] + uz * u, gc = gy(cx, cz);
    return prof.map(([s, hh]) => { const x = cx + nx * s * w, z = cz + nz * s * w, g = gy(x, z); const y = Math.abs(s) >= 1 ? g + hh * (Math.abs(s) > 1 ? 1 : 1) : Math.max(g + 0.02, gc + hh * h * f); return tl(x, Math.abs(s) > 1 ? g - 0.35 : y, z); }); });
  m.mat(MAT.GRASS, tint || [0.55, 0.55, 0.42], 1.0);
  for (let i = 0; i + 1 < ring.length; i++) for (let j = 0; j + 1 < prof.length; j++) { const A = ring[i][j], B = ring[i][j + 1], C = ring[i + 1][j + 1], D = ring[i + 1][j]; m.quad2(A, B, C, D); }
}

/* [fx3] two solids never overlap: every collider the plots, closes, lanes and yards added is cut back wherever an earlier solid already stands on its line (the earlier solid blocks that stretch itself). Runs of 0.3 m or less are dropped; a long wall cut in the middle becomes two. */
function trimPlotColliders(c0) {
  const C = World.colliders, ext = d => d.r !== undefined ? d.r : Math.hypot(d.hx, d.hz);
  const inside = (d, x, z, mg) => { if (d.r !== undefined) return Math.hypot(x - d.x, z - d.z) < d.r + mg; const u = (x - d.x) * d.ax + (z - d.z) * d.az, v = (x - d.x) * d.bx + (z - d.z) * d.bz; return Math.abs(u) < d.hx + mg && Math.abs(v) < d.hz + mg; };
  const extra = [];
  for (let i = c0; i < C.length; i++) { const c = C[i]; if (c.keep || c.r !== undefined || c.hx < 0.2) continue; const rc = Math.hypot(c.hx, c.hz) + 0.3, cand = [];
    for (let q = 0; q < i; q++) { const d = C[q]; if (d.y0 > c.y1 - 0.05 || d.y1 < c.y0 + 0.05 || Math.abs(d.x - c.x) > rc + ext(d) || Math.abs(d.z - c.z) > rc + ext(d)) continue; cand.push(d); }
    if (!cand.length) continue; const mg = c.hz * 0.8, runs = []; let st = null;
    for (let t = -c.hx; t <= c.hx + 0.001; t += 0.1) { const x = c.x + c.ax * t, z = c.z + c.az * t, hit = cand.some(d => inside(d, x, z, mg)); if (!hit && st === null) st = t; if ((hit || t > c.hx - 0.001) && st !== null) { const e = hit ? t - 0.1 : t; if (e - st > 0.3) runs.push([st, e]); st = null; } }
    if (runs.length === 1 && runs[0][0] <= -c.hx + 0.05 && runs[0][1] >= c.hx - 0.05) continue;
    const base = Object.assign({}, c); const mk = ([a, b]) => Object.assign({}, base, { x: base.x + base.ax * (a + b) / 2, z: base.z + base.az * (a + b) / 2, hx: (b - a) / 2 });
    if (!runs.length) { c.hx = 0.01; c.hz = 0.01; c.y1 = c.y0; continue; }
    Object.assign(c, mk(runs[0])); for (let k = 1; k < runs.length; k++) extra.push(mk(runs[k])); }
  for (const e of extra) C.push(e);
}

/* [fx3] the class fix for "a pile, stack, bench or stall landed in a wall because the random sequence shifted": after the world is built, every short box or circle that stands in a wall-like solid (a house wall, a long wall or fence) is cut back to the free runs of its line, or dropped if none is left (the earlier, taller solid wins; nothing is moved). Same OBB test as test/overlap.js. */
function settleSolids() {
  const C = World.colliders, cell = 4, H = new Map(), key = (i, j) => i * 100003 + j, wallish = d => d.y1 - d.y0 >= 2.4 || (d.r === undefined && d.hx >= 1.5);
  C.forEach((d, n) => { if (!isFinite(d.x) || !wallish(d)) return; const r = d.r !== undefined ? d.r : Math.hypot(d.hx, d.hz); for (let i = Math.floor((d.x - r) / cell); i <= Math.floor((d.x + r) / cell); i++) for (let j = Math.floor((d.z - r) / cell); j <= Math.floor((d.z + r) / cell); j++) { const k = key(i, j); (H.get(k) || H.set(k, []).get(k)).push(n); } });
  const inside = (d, x, z, mg) => { if (d.r !== undefined) return Math.hypot(x - d.x, z - d.z) < d.r + mg; const u = (x - d.x) * d.ax + (z - d.z) * d.az, v = (x - d.x) * d.bx + (z - d.z) * d.bz; return Math.abs(u) < d.hx + mg && Math.abs(v) < d.hz + mg; };
  const extra = []; let cut = 0, dropped = 0;
  for (let i = 0; i < C.length; i++) { const c = C[i]; if (!isFinite(c.x) || c.y1 - c.y0 >= 2.4 || Math.abs(c.x) > 190 || Math.abs(c.z) > 260) continue; const circle = c.r !== undefined; if (!circle && (c.hz > 0.8 || c.hx > 3)) continue;
    const rc = circle ? c.r : Math.hypot(c.hx, c.hz), cand = new Set(); for (let a = Math.floor((c.x - rc) / cell); a <= Math.floor((c.x + rc) / cell); a++) for (let b = Math.floor((c.z - rc) / cell); b <= Math.floor((c.z + rc) / cell); b++) for (const n of H.get(key(a, b)) || []) if (n !== i && (C[n].y1 - C[n].y0 >= 2.4 || n < i)) { const d = C[n]; if (d.y0 < c.y1 - 0.25 && d.y1 > c.y0 + 0.25) cand.add(n); }
    if (!cand.size) continue; const L = [...cand].map(n => C[n]);
    if (circle) { if (L.some(d => inside(d, c.x, c.z, c.r - 0.12))) { c.r = 0.01; c.y1 = c.y0; dropped++; } continue; }
    const mg = Math.max(0, c.hz - 0.12), runs = []; let st = null;
    for (let t = -c.hx; t <= c.hx + 0.001; t += 0.1) { const x = c.x + c.ax * t, z = c.z + c.az * t, hit = L.some(d => inside(d, x, z, mg)); if (!hit && st === null) st = t; if ((hit || t > c.hx - 0.001) && st !== null) { const e = hit ? t - 0.1 : t; if (e - st > 0.3) runs.push([st, e]); st = null; } }
    if (runs.length === 1 && runs[0][0] <= -c.hx + 0.05 && runs[0][1] >= c.hx - 0.05) continue;
    const base = Object.assign({}, c), mk = ([a, b]) => Object.assign({}, base, { x: base.x + base.ax * (a + b) / 2, z: base.z + base.az * (a + b) / 2, hx: (b - a) / 2 });
    if (!runs.length) { c.hx = 0.01; c.hz = 0.01; c.y1 = c.y0; dropped++; continue; } cut++;
    Object.assign(c, mk(runs[0])); for (let k = 1; k < runs.length; k++) extra.push(mk(runs[k])); }
  for (const e of extra) C.push(e); World.settled = { cut, dropped };
}

function plotLowTier() { return R.qName === 'low'; }

/* [fx3] Westgate: outside the gate the earth road runs out between hedge rows (a low bank and overlapping shrub clumps, with gaps and field gates) past two closes, a sheep close to the north and a pig close to the south, fenced on their other three sides.
   The shrubs are pushed to World.hedgeClumps and drawn as instanced bushes by buildVegetation; the banks, fences and animals are meshes here. */
function buildWestgate(bucket) {
  { const raw = bucket; bucket = (x, z) => { const m = raw(3e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 400; m.lowDist = 36; m.noShadow = true; return m; }; }      // [fx3] 44 m cells of their own, on Low drawn out to 36 m
  if (TEST && TEST.plots === 0) return;
  const R = rng(7077), gy = (x, z) => Terrain.y(x, z), road = Roads.find(q => q.id === 'main'); if (!road) return;
  const rz = x => { const p = road.line.p; for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return p[p.length - 1][1]; };
  World.hedgeClumps = World.hedgeClumps || [];
  const X0 = -79, X1 = -106, gaps = { '-1': [[-90, -92], [-98.5, -100]], '1': [[-84.4, -86]] };
  for (const sd of [-1, 1]) {
    const inGap = x => (gaps[sd] || []).some(g => x <= g[0] + 0.3 && x >= g[1] - 0.3);
    for (let x = X0; x > X1; x -= 0.85) { if ((gaps[sd] || []).some(g => x <= g[0] && x >= g[1])) continue; const z = rz(x) + sd * (3.5 + Math.sin(x * 0.21) * 0.25 + (R() - 0.5) * 0.3), g = gy(x, z); World.hedgeClumps.push([x + (R() - 0.5) * 0.3, g + 0.2, z, 0.9 + R() * 0.7 + (R() < 0.12 ? 0.5 : 0), R() * 6.28, 0.1 + R() * 0.2, R()]); }
    let x = X0; for (const g of (gaps[sd] || []).slice().sort((a, b) => b[0] - a[0]).concat([[X1, X1]])) { const xa = x, xb = g[0]; if (xa - xb > 0.5) { const za = rz(xa) + sd * 3.5, zb = rz(xb) + sd * 3.5, cx = (xa + xb) / 2, cz = (za + zb) / 2, m = bucket(cx, cz), ang = Math.atan2(zb - za, xb - xa), L = Math.hypot(xb - xa, zb - za), gg = gy(cx, cz);
        m.push().T(cx, 0, cz).RY(-ang); earthBank(m, [cx - Math.cos(ang) * L / 2, cz - Math.sin(ang) * L / 2], [cx + Math.cos(ang) * L / 2, cz + Math.sin(ang) * L / 2], 0.5, 0.4, null, { x: cx, z: cz, ang, y: 0 }); addBoxCollider(m, -L / 2 + 0.1, -0.35, L / 2 - 0.1, 0.35, 0, 1.3); m.pop(); }
      x = g[1]; if (g[0] !== g[1]) { const gx = (g[0] + g[1]) / 2, gz = rz(gx) + sd * 3.5, m = bucket(gx, gz); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); for (const px of [g[0] + 0.15, g[1] - 0.15]) { const pz = rz(px) + sd * 3.5; m.cbox(px, gy(px, pz) - 0.1, pz, 0.16, 1.5, 0.16, 0); } } }
  }
  /* a wattle-and-rail fence round a close: posts and two rails on the three far sides */
  const fence = (pts) => { for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 2.2)), m = bucket((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      m.mat(MAT.TIMBER, [0.32, 0.26, 0.19], 0.5);
      for (let k = 0; k <= n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; m.cbox(x, gy(x, z) - 0.1, z, 0.1, 1.15, 0.1, 0); }
      for (const y of [0.45, 0.9]) for (let k = 0; k < n; k++) { const x0 = a[0] + (b[0] - a[0]) * k / n, z0 = a[1] + (b[1] - a[1]) * k / n, x1 = a[0] + (b[0] - a[0]) * (k + 1) / n, z1 = a[1] + (b[1] - a[1]) * (k + 1) / n; m.beam([x0, gy(x0, z0) + y, z0], [x1, gy(x1, z1) + y, z1], 0.05, 0.08); }
      const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2; m.push().T(cx, 0, cz).RY(-Math.atan2(b[1] - a[1], b[0] - a[0])); addBoxCollider(m, -L / 2 + 0.2, -0.1, L / 2 - 0.2, 0.1, gy(cx, cz), gy(cx, cz) + 1.0); m.pop(); } };
  /* no animals are modelled: a close is a close because of its fence, its trough and straw, and the churned ground */
  const zN = x => rz(x) - 3.5, zS = x => rz(x) + 3.5;
  /* the closes follow the lane and the ground: the road side is the hedge, the ends run square off it, the far side wanders with a slow swing (no ruler rectangles) */
  const closePts = (sd, xa, xb, depth, sw) => { const pts = [[xa, rz(xa) + sd * 4.0]]; for (let x = xa; x >= xb - 0.01; x -= 3) pts.push([x - (x === xa ? 0.8 : 0), rz(x) + sd * (4.0 + depth + sw * Math.sin(x * 0.19 + sd))]); pts.push([xb, rz(xb) + sd * 4.0]); return pts; };
  /* north close: sheep; south close: pigs in the mud */
  fence(closePts(-1, -82, -104, 12, 1.6));
  fence(closePts(1, -82, -104, 9, 1.3));
  { const m = bucket(-92, 4); m.mat(MAT.MUD, [0.15, 0.11, 0.08], 0.5); const gz = x => rz(x) + 5.8, y0 = x => gy(x, gz(x)) + 0.03; m.quad2([-95, y0(-95), gz(-95)], [-95, y0(-95), gz(-95) + 3.4], [-88, y0(-88), gz(-88) + 3.4], [-88, y0(-88), gz(-88)]); }
}

/* [fx3] the west edge of the town: the gate is the only way in. Palisade for the stretch beside the gate, then a bank with a hedge on it and a ditch outside, following the ground north to the north wall and south down the town's flank.
   A road that crosses the line leaves a gap with two gate posts. The ditch is painted by the terrain (WEST_EDGE). */
const WEST_EDGE = { n: [[-62, -8.15], [-62, -15], [-64, -19.5], [-65, -26], [-63, -38], [-58, -49], [-47, -56], [-33, -58.5], [-30, -58.7]], s: [[-62, -2.25], [-62, 5], [-63.5, 9.5], [-65, 16], [-63, 30], [-59, 44], [-52, 56], [-44, 66], [-37, 72.5], [-32, 76.5], [-38, 78.4], [-44, 80.5], [-48, 82]], ne: [[8, -58.7], [30, -60.5], [52, -60], [72.7, -57], [72.7, -46.5]], pal: 2 };
function buildWestEdge(bucket) {
  if (TEST && TEST.plots === 0) return;
  const gy = (x, z) => Terrain.y(x, z), bucket0 = bucket;
  bucket = (x, z) => { const m = bucket0(8e6 + Math.floor(x / 66) * 80, Math.floor(z / 66) * 80); m.maxDist = 1e5; m.lowDist = 22; m.noShadow = true; m.edge = 1; m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; return m; };      // [fx3] 44 m cells of their own, hidden beyond 60 m and out of the shadow pass, like the town walls
  const segX = (p1, p2, p3, p4) => { const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]); if (Math.abs(d) < 1e-9) return false; const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d, u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d; return t > -0.1 && t < 1.1 && u > -0.05 && u < 1.05; };
  const crossRoad = (A, B) => Roads.some(q => q.id !== 'main' && q.line.p.some((pt, i) => i && segX(A, B, q.line.p[i - 1], pt)));
  const roadNear = (A, B) => crossRoad(A, B) || (Math.abs((A[0] + B[0]) / 2 + 62) < 3 && Math.abs((A[1] + B[1]) / 2 + 5.2) < 2.6);
  for (const side of ['n', 's', 'ne']) { const P = WEST_EDGE[side];
    for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.max(1, Math.round(L / 4)); let nx = -dz / L, nz = dx / L; if (nx * (0 - a[0]) + nz * (-6 - a[1]) < 0) { nx = -nx; nz = -nz; }
      /* [fx3] the edge is the same log palisade as the town walls, with the earth thrown up outside it and the ditch beyond (painted by the terrain); a road leaves a gap with two tall gate posts */
      let run = null; const flush = () => { if (run && Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) > 1.5) { const A = [run[0][0] - nx * 0.8, run[0][1] - nz * 0.8], B = [run[1][0] - nx * 0.8, run[1][1] - nz * 0.8], m = bucket((A[0] + B[0]) / 2, (A[1] + B[1]) / 2); earthBank(m, A, B, 0.6, 0.4, [0.5, 0.5, 0.38]); } run = null; };
      for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, A = [a[0] + dx * t0, a[1] + dz * t0], B = [a[0] + dx * t1, a[1] + dz * t1], cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2, m = bucket(cx, cz);
        if (roadNear(A, B)) { flush(); (World.edgeGaps = World.edgeGaps || []).push([+cx.toFixed(1), +cz.toFixed(1)]); for (const e of [A, B]) { const g = gy(e[0], e[1]); m.mat(MAT.BARK, [0.45, 0.39, 0.31], 1.0); m.tube([[e[0], g - 0.3, e[1]], [e[0], g + 2.9, e[1]], [e[0], g + 3.3, e[1]]], [0.22, 0.2, 0.03], 8, true); } continue; }
        const gA = gy(A[0], A[1]), gB = gy(B[0], B[1]); logRow((lv, x, z) => logCell(bucket0, lv, x, z), A, B, t => Math.max(gA + (gB - gA) * t, 0.5) + 2.5, [nx, nz], i * 7 + k);      /* [fx3] over a stream the tops stay level with the banks (the logs stand in the bed: a stake weir with the water running through the gaps), no dip in the line */
        const l = Math.hypot(B[0] - A[0], B[1] - A[1]), an = Math.atan2(B[1] - A[1], B[0] - A[0]), g = Math.min(gA, gB, gy(cx, cz)); m.push().T(cx, g - 0.2, cz).RY(-an); addBoxCollider(m, -l / 2, -0.2, l / 2, 0.2, 0, 2.6); World.colliders[World.colliders.length - 1].keep = 1; m.pop();
        if (!run) run = [A, B]; else run[1] = B; }
      flush(); } }
}

/* [fx3] where the audit's deleted shells stood, each footprint is the neighbour's yard: a low stone wall on four sides with a gate on the old front, the trade of the yard inside (garden, wood, hens, hives, washing), and a fruit tree in the orchards. Decisions per id are in YARDS. */
const YARDS = { 'in.42': ['dyer'], 'in.43': ['garden'], 'in.88': ['woodyard', 'oak'], 'in.18': ['dyer'], 'in.46': ['hives'], 'in.64': ['hens'], 'in.71': ['garden', 'oak'], 'in.73': ['hives'], 'in.97': ['washing', 'oak'], 'in.103': ['fold'], 'in.117': ['woodyard'], 'in.118': ['garden'], 'in.119': ['hens'], 'in.128': ['hives', 'oak'], 'in.130': ['garden', 'oak'], 'in.48': ['hives'], 'in.11': ['woodyard'], 'in.76': ['hens', 'oak'], 'in.47': ['hens', 'oak'] };
function buildYards(bucket) {
  { const raw = bucket; bucket = (x, z) => { const m = raw(3e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 400; m.lowDist = 22; m.noShadow = true; return m; }; }      // [fx3] 44 m cells of their own, on Low drawn out to 36 m
  if (TEST && (TEST.plots === 0 || TEST.yards === 0)) return; if (!PLACE.deletedSites) return;
  const R = rng(3030), gy = (x, z) => Terrain.y(x, z), flat = (m, x, z, rx, rz, c, mat, ry, lift) => { m.mat(mat, c, 0.5); m.push().T(x, gy(x, z) + (lift || 0.02), z).RY(ry || 0); m.quad2([-rx, 0, -rz * 0.6], [-rx * 0.6, 0, rz], [rx, 0, rz * 0.7], [rx * 0.7, 0, -rz]); m.pop(); };
  World.yardTrees = World.yardTrees || [];
  for (const pass of [0, 1]) for (const d of PLACE.deletedSites) { const Y = YARDS[d.id]; if (!Y) continue; const s = { x: d.x, z: d.z, yaw: d.yaw, w: d.w, d: 0.6 }, hw = d.w / 2 + 1.5, hd = d.d / 2 + 1.5, W = (lx, lz) => siteToWorld({ x: d.x, z: d.z, yaw: d.yaw, w: d.w, d: d.d }, lx, lz), c0 = W(0, 0), m = bucket(c0[0], c0[1]);
    if (pass === 0) { const p = { house: s, axis: 'z', trade: Y[0], bz: 1, x0: 0, x1: 0 }; try { localTrade(m, p, gy, R, flat); } catch (e) { }   // every yard's trade first, so the walls stop where a coop or rack stands
      if (Y[1]) { const q = W(hw - 1.2, hd - 1.1); World.yardTrees.push([q[0], q[1], Y[1], 0.55]); } continue; }
    const n0 = World.colliders.length, nearRoad = (x, z) => Roads.some(q => q.line.dist(x, z, 3) < 2.6);
    const seg = (ax, az, bx, bz) => { const A = W(ax, az), B = W(bx, bz), L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 0.2) return; for (let k = 0; k <= 4; k++) if (nearRoad(A[0] + (B[0] - A[0]) * k / 4, A[1] + (B[1] - A[1]) * k / 4)) return;
      /* a yard wall is left out wherever something solid already stands on its line (a house, a neighbour's wall, a prop): two solids never overlap */
      for (let k = 0, n = Math.ceil(L / 0.4); k <= n; k++) { const x = A[0] + (B[0] - A[0]) * k / n, z = A[1] + (B[1] - A[1]) * k / n; for (let q = 0; q < n0; q++) { const c = World.colliders[q]; if (c.y0 > gy(x, z) + 1.1 || c.y1 < gy(x, z) + 0.1) continue; if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + 0.35) return; } else { const u = (x - c.x) * c.ax + (z - c.z) * c.az, v = (x - c.x) * c.bx + (z - c.z) * c.bz; if (Math.abs(u) < c.hx + 0.35 && Math.abs(v) < c.hz + 0.35) return; } } } const cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2, ang = Math.atan2(B[1] - A[1], B[0] - A[0]), g = Math.min(gy(A[0], A[1]), gy(B[0], B[1]), gy(cx, cz)) - 0.12, t = 0.26 + R() * 0.04, tone = 0.46 + R() * 0.06;
      m.push().T(cx, g, cz).RY(-ang); m.mat(MAT.STONE, [tone, tone * 0.97, tone * 0.92], 1.4); m.box(-L / 2, -0.7, -t, L / 2, 1.0 + R() * 0.12, t, 4); m.mat(MAT.STONE, [tone * 1.1, tone * 1.06, tone], 1.4); m.box(-L / 2 - 0.02, 1.0, -t - 0.04, L / 2 + 0.02, 1.12, t + 0.04, 0); addBoxCollider(m, -L / 2 + 0.25, -t, L / 2 - 0.25, t, 0, 1.1); m.pop(); };
    const inw = (() => { const a = W(0, -hd), b = W(0, -hd + 1); return [b[0] - a[0], b[1] - a[1]]; })(), gl = pickGate(0, -hw + 1.2, hw - 1.2, v => W(v, -hd), inw[0], inw[1], World.plotC0 || 0);
    { const gq = W(gl, -hd), g2 = W(gl, -hd - 1); (World.openings = World.openings || []).push({ kind: 'yardgate', x: gq[0], z: gq[1], dx: g2[0] - gq[0], dz: g2[1] - gq[1], w: 1.7 }); }
    const gw = 1.15; seg(-hw, -hd, gl - gw, -hd); seg(gl + gw, -hd, hw, -hd); seg(hw, -hd, hw, hd); seg(hw, hd, -hw, hd); seg(-hw, hd, -hw, -hd);
    for (const sx of [gl - gw, gl + gw]) { const q = W(sx, -hd); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); m.cbox(q[0], gy(q[0], q[1]) - 0.1, q[1], 0.2, 1.5, 0.2, 0); }}
}
