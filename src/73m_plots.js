// ───────────────────────── plots: the yards behind every front on the Market Place and the west street (docs/TOWNPLAN.md sections 3 and 4) ─────────────────────────
// Each house on a row owns a burgage: a walled or fenced yard from its back wall to a back lane, sides on the party lines (half way across the gap to the neighbour), a gate in the back wall to the lane.
// plotsCompute() is data only (run by the terrain painter and by the builder, memoised); buildPlots(bucket) makes walls, gates and the trade each household keeps in its yard.
const PLOT_ROWS = [
  { name: 'placeS', ids: ['in.18', 'in.48', 'in.02'], trades: ['garden', 'hives', 'washing'] },
  { name: 'placeN', ids: ['in.11', 'in.76', 'inn', 'in.47'], trades: ['woodyard', 'pigs', 'stable', 'hens'] },
  { name: 'westN', ids: ['in.10', 'guardhouse', 'in.41', 'in.40'], trades: ['forge', 'garden', 'cooper', 'pigs'] },
  { name: 'alleyN', ids: ['draper', 'shop.n2', 'shop.n3', 'shop.n4'], trades: ['cooper', 'hens', 'garden', 'woodyard'] },
  { name: 'alleyS', ids: ['shop.s0', 'shop.s1', 'shop.s2'], trades: ['forge', 'washing', 'pigs'] },
  { name: 'placeE', ids: ['store'], trades: ['stable'], axis: 'x' },
  { name: 'westS', ids: ['in.08', 'in.07', 'in.06', 'in.42'], trades: ['dyer', 'hens', 'woodyard', 'washing'] }
];
let _PLOTS = null;
function plotsCompute() {
  if (_PLOTS) return _PLOTS;
  _PLOTS = [];
  const byId = id => SITES.find(s => s.id === id), T0 = (typeof TERRACE !== 'undefined' && TERRACE) || null;
  const blocked = (x, z, pad, self) => {
    for (const s of SITES) { if (s === self || !s.w || s.id === 'tower') continue; const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad * 0.3 + (s.porch || 0) && Math.abs(l[1]) < s.d / 2 + pad * 0.3) return true; }
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
      for (const s of hs) {
        const bx = Math.sin(s.yaw || 0) > 0 ? -1 : 1, xb0 = s.x + bx * (s.d / 2 + 0.12), za = s.z - s.w / 2 - 0.15, zb2 = s.z + s.w / 2 + 0.15; let depth = 0;
        for (let d = 7.0; d >= 2.2 && !depth; d -= 0.4) { let ok = true; for (let z = za + 0.3; z <= zb2 - 0.3 && ok; z += 0.7) for (let k = 0.5; k <= d + 0.3 && ok; k += 0.6) if (blocked(xb0 + bx * (k + 0.2), z, 0.35, s)) ok = false; if (ok) depth = d; }
        if (depth) _PLOTS.push({ id: s.id, row: row.name, trade: row.trades[0], axis: 'x', bx, x0: Math.min(xb0, xb0 + bx * depth), x1: Math.max(xb0, xb0 + bx * depth), z0: za, z1: zb2, wall: xb0 + bx * depth, bz: 1, house: s });
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
      _PLOTS.push({ id: s.id, row: row.name, trade: row.trades[i % row.trades.length], x0: xa, x1: xb, z0: Math.min(zb, zb + bz * depth), z1: Math.max(zb, zb + bz * depth), bz, wall: zb + bz * depth, house: s, first: i === 0, last: i === hs.length - 1 });
    });
  }
  return _PLOTS;
}
function buildPlots(bucket) {
  if (TEST && TEST.plots === 0) return;
  const P = plotsCompute(), R = rng(8831), gy = (x, z) => Terrain.y(x, z);
  const W = 0.3, H = 1.1;
  const stone = (m, ax, az, bx, bz, h, tone) => {      // a low rubble wall segment with a rounded coping
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const cx = (ax + bx) / 2, cz = (az + bz) / 2, ang = Math.atan2(bz - az, bx - ax), g = Math.min(gy(ax, az), gy(bx, bz), gy(cx, cz)) - 0.15;
    m.push().T(cx, g, cz).RY(-ang); m.mat(MAT.STONE, [tone, tone * 0.97, tone * 0.92], 1.4); m.box(-L / 2, 0, -W / 2, L / 2, h + 0.15 - 0.06 * R(), W / 2); m.mat(MAT.STONE, [tone * 1.1, tone * 1.06, tone], 1.4); m.box(-L / 2 - 0.02, h + 0.05, -W / 2 - 0.04, L / 2 + 0.02, h + 0.17, W / 2 + 0.04); m.pop();
    { const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.15, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.15; addBoxCollider(m, cx - ex, cz - ez, cx + ex, cz + ez, g, g + h); }
  };
  const fence = (m, ax, az, bx, bz) => {      // posts and two rails
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const n = Math.max(1, Math.round(L / 2.4));
    m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5);
    for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n, g = gy(x, z); m.cbox(x, g - 0.1, z, 0.1, 1.2, 0.1, 0); }
    for (const y of [0.4, 0.85]) for (let i = 0; i < n; i++) { const x0 = ax + (bx - ax) * i / n, z0 = az + (bz - az) * i / n, x1 = ax + (bx - ax) * (i + 1) / n, z1 = az + (bz - az) * (i + 1) / n; m.beam([x0, gy(x0, z0) + y, z0], [x1, gy(x1, z1) + y, z1], 0.05, 0.08); }
    const cx = (ax + bx) / 2, cz = (az + bz) / 2, ang = Math.atan2(bz - az, bx - ax);
    { const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.05, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.05; addBoxCollider(m, cx - ex, cz - ez, cx + ex, cz + ez, gy(cx, cz), gy(cx, cz) + 1.0); }
  };
  const slab = (m, ax, az, bx, bz, h, mat, col, th) => {      /* a board fence or a woven hurdle: one solid leaf on the line, posts at the ends */
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.2) return; const cx = (ax + bx) / 2, cz = (az + bz) / 2, ang = Math.atan2(bz - az, bx - ax), g = Math.min(gy(ax, az), gy(bx, bz), gy(cx, cz)) - 0.05;
    m.push().T(cx, g, cz).RY(-ang); m.mat(mat, col, 1.0); m.box(-L / 2, 0, -th / 2, L / 2, h, th / 2); m.mat(MAT.TIMBER, [0.26, 0.2, 0.15], 0.5); for (let k = 0; k <= Math.max(1, Math.round(L / 3.0)); k++) { const px = -L / 2 + L * k / Math.max(1, Math.round(L / 3.0)); m.box(px - 0.06, -0.1, -th / 2 - 0.03, px + 0.06, h + 0.15, th / 2 + 0.03); } m.pop();
    { const ex = Math.abs(Math.cos(ang)) * L / 2 + Math.abs(Math.sin(ang)) * 0.08, ez = Math.abs(Math.sin(ang)) * L / 2 + Math.abs(Math.cos(ang)) * 0.08; addBoxCollider(m, cx - ex, cz - ez, cx + ex, cz + ez, g, g + h); }
  };
  const STYLES = ['stone', 'fence', 'board', 'hurdle'];
  const flat = (m, x, z, rx, rz, c, mat, ry, lift) => { m.mat(mat, c, 0.5); m.push().T(x, gy(x, z) + (lift || 0.02), z).RY(ry || 0); m.quad2([-rx, 0, -rz * 0.6], [-rx * 0.6, 0, rz], [rx, 0, rz * 0.7], [rx * 0.7, 0, -rz]); m.pop(); };
  const crate = (m, x, z, w, h, d, col, mat, solidCol) => { const g = gy(x, z); m.mat(mat || MAT.PLANKS, col, 0.5); m.box(x - w / 2, g, z - d / 2, x + w / 2, g + h, z + d / 2); if (solidCol !== false) addBoxCollider(m, x - w / 2, z - d / 2, x + w / 2, z + d / 2, g, g + h); };
  const trade = (p, m, cx, cz, ux, uz, wd, dp) => {      /* ux,uz: along the row (world x or z axis unit); local frame: a = along row from the plot centre, b = away from the house toward the back wall */
    const at = (a, b) => [cx + a * ux + b * 0, cz + b * p.bz];
    const put = (a, b, f) => { const q = at(a, b); f(q[0], q[1]); };
    const kind = p.trade;
    if (kind === 'garden') { for (let i = -2; i <= 2; i++) put(i * 0.95, dp * 0.4, (x, z) => { const g = gy(x, z), len = Math.min(dp * 0.6, 2.6); m.mat(MAT.MUD, [0.17, 0.12, 0.08], 0.5); m.box(x - 0.25, g, z - len / 2, x + 0.25, g + 0.18, z + len / 2); m.mat(MAT.LEAVES, [0.24 + R() * 0.16, 0.38 + R() * 0.12, 0.13], 0.5); if (i % 2) { for (let k = 0; k < 4; k++) m.ball(x, g + 0.3, z - len / 2 + 0.3 + k * (len - 0.6) / 3, 0.2, 0.12, 0.18, 4, 3); } else { m.mat(MAT.TIMBER, [0.32, 0.25, 0.17], 0.5); for (let k = 0; k < 3; k++) m.beam([x - 0.15, g, z - len / 2 + 0.25 + k * 0.7], [x + 0.05, g + 1.5, z - len / 2 + 0.25 + k * 0.55], 0.03, 0.03); m.mat(MAT.LEAVES, [0.28, 0.42, 0.14], 0.5); for (let k = 0; k < 3; k++) m.ball(x - 0.05, g + 0.8, z - len / 2 + 0.25 + k * 0.7, 0.09, 0.5, 0.09, 4, 3); } });
      put(-wd / 2 + 0.6, dp * 0.85, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.cyl(x, g, z, 0.32, 0.28, 0.55, 6, 2); m.mat(MAT.PLAIN, [0.16, 0.2, 0.22]); m.cyl(x, g + 0.5, z, 0.27, 0.27, 0.02, 6, 2); addCircleCollider(m, x, z, 0.32, g, g + 0.55); flat(m, x + 0.6, z + 0.2, 0.5, 0.3, [0.14, 0.11, 0.08], MAT.MUD, 0.4, 0.03); }); }
    else if (kind === 'woodyard') { put(-wd / 4, dp * 0.55, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.34, 0.26, 0.18], 0.5); for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) { const lx = x - 1.0 + r * 0.2 + k * 0.4, ly = g + 0.17 + r * 0.3, lz = z - 0.5 + (R() - 0.5) * 0.06, ln = 0.9 + R() * 0.3; m.mat(MAT.TIMBER, [0.42 + R() * 0.12, 0.32 + R() * 0.06, 0.22], 0.5); m.beam([lx, ly, lz - ln / 2], [lx, ly, lz + ln / 2], 0.3, 0.3); } addBoxCollider(m, x - 1.3, z - 0.55, x + 1.3, z + 0.65, g, g + 1.2); });
      put(wd / 4, dp * 0.4, (x, z) => { const g = gy(x, z); for (let k = 0; k < 7; k++) { const sx = x + (R() - 0.5) * 2.2, sz = z + 0.5 + R() * 1.3; m.mat(MAT.TIMBER, [0.55 + R() * 0.1, 0.44, 0.3], 0.5); m.beam([sx - 0.15, gy(sx, sz) + 0.06, sz], [sx + 0.15, gy(sx, sz) + 0.08, sz + (R() - 0.5) * 0.2], 0.1, 0.12); } m.mat(MAT.TIMBER, [0.4, 0.31, 0.22], 0.5); m.cyl(x, g, z, 0.26, 0.26, 0.5, 5, 2); m.mat(MAT.PLAIN, [0.1, 0.1, 0.1]); m.beam([x + 0.1, g + 0.5, z], [x + 0.4, g + 0.1, z + 0.2], 0.03, 0.05); for (let k = 0; k < 3; k++) flat(m, x + (R() - 0.5) * 1.6, z + (R() - 0.5) * 1.6, 0.14, 0.04, [0.45, 0.34, 0.2], MAT.TIMBER, R() * 3, 0.03); }); }
    else if (kind === 'hives') { for (let i = -1; i <= 1; i++) put(i * 1.3, dp * 0.4, (x, z) => { const g = gy(x, z); m.mat(MAT.STONE, [0.5, 0.47, 0.42], 0.5); m.box(x - 0.3, g, z - 0.3, x + 0.3, g + 0.35, z + 0.3); m.mat(MAT.THATCH, [0.72, 0.58, 0.28], 0.5); m.ball(x, g + 0.6, z, 0.3, 0.26, 0.3, 6, 4); addCircleCollider(m, x, z, 0.3, g, g + 0.8); });
      put(wd / 4, dp * 0.8, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.33, 0.24], 0.5); m.box(x - 0.8, g + 0.38, z - 0.2, x + 0.8, g + 0.44, z + 0.2); m.box(x - 0.7, g, z - 0.15, x - 0.6, g + 0.38, z + 0.15); m.box(x + 0.6, g, z - 0.15, x + 0.7, g + 0.38, z + 0.15); m.mat(MAT.LEAVES, [0.4, 0.5, 0.2], 0.5); for (let k = 0; k < 5; k++) m.ball(x - 1.2 + k * 0.28, g + 0.18, z + 0.8, 0.14, 0.18, 0.14, 4, 3); }); }
    else if (kind === 'pigs') { put(0, dp * 0.55, (x, z) => { const g = gy(x, z); flat(m, x, z, 1.4, 1.0, [0.14, 0.1, 0.07], MAT.MUD, 0, 0.03); for (const [a, b] of [[-1.5, -1.1], [1.5, -1.1], [1.5, 1.1], [-1.5, 1.1], [-1.5, -1.1]].slice(0, 4)) { } fence(m, x - 1.6, z - 1.2, x + 1.6, z - 1.2); fence(m, x + 1.6, z - 1.2, x + 1.6, z + 1.2); fence(m, x + 1.6, z + 1.2, x - 1.6, z + 1.2); crate(m, x - 1.0, z + 0.75, 0.9, 0.5, 0.35, [0.32, 0.25, 0.18], MAT.PLANKS, false); m.mat(MAT.PLANKS, [0.38, 0.3, 0.22], 0.5); m.box(x - 1.55, g, z - 1.15, x - 0.6, g + 1.4, z - 1.05); m.box(x - 1.6, g + 1.4, z - 1.2, x - 0.5, g + 1.5, z - 0.2);
        m.mat(MAT.PLAIN, [0.72, 0.52, 0.5]); m.ball(x + 0.4, g + 0.28, z + 0.2, 0.42, 0.26, 0.24, 7, 5); m.ball(x + 0.85, g + 0.3, z + 0.2, 0.18, 0.16, 0.16, 6, 4); }); }
    else if (kind === 'hens') { put(-wd / 4, dp * 0.5, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.box(x - 0.7, g + 0.5, z - 0.5, x + 0.7, g + 1.15, z + 0.5); for (const sx of [-0.6, 0.6]) for (const sz of [-0.4, 0.4]) m.box(x + sx - 0.04, g, z + sz - 0.04, x + sx + 0.04, g + 0.5, z + sz + 0.04); m.mat(MAT.THATCH, [0.55, 0.45, 0.25], 0.5); m.box(x - 0.8, g + 1.15, z - 0.6, x + 0.8, g + 1.25, z + 0.6); addBoxCollider(m, x - 0.8, z - 0.6, x + 0.8, z + 0.6, g, g + 1.2);
      for (let k = 0; k < 4; k++) { const hx = x + (R() - 0.5) * 3, hz = z + 1.2 + R() * 1.2; m.mat(MAT.PLAIN, k % 2 ? [0.6, 0.3, 0.14] : [0.85, 0.82, 0.74]); m.ball(hx, gy(hx, hz) + 0.2, hz, 0.12, 0.14, 0.18, 5, 4); flat(m, hx, hz, 0.3, 0.2, [0.4, 0.32, 0.18], MAT.THATCH, R() * 3, 0.025); } }); }
    else if (kind === 'washing') { for (const sx of [-1, 1]) put(sx * wd * 0.33, dp * 0.5, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); m.beam([x, g, z], [x, g + 2.0, z], 0.05, 0.05); });
      put(-wd * 0.33, dp * 0.5, (x0, z0) => { const x1 = x0 + wd * 0.66 * ux, z1 = z0; const g0 = gy(x0, z0); m.mat(MAT.PLAIN, [0.7, 0.68, 0.62]); m.beam([x0, g0 + 1.9, z0], [x1, g0 + 1.75, z1], 0.012, 0.012); for (let k = 0; k < 5; k++) { const t = (k + 0.7) / 5.6, cxx = x0 + (x1 - x0) * t, col = [[0.78, 0.75, 0.68], [0.6, 0.56, 0.5], [0.5, 0.48, 0.44], [0.66, 0.5, 0.44], [0.72, 0.7, 0.62]][k]; m.mat(MAT.CLOTH, col, 0.5); m.quad2([cxx - 0.22, g0 + 1.85 - t * 0.15, z0], [cxx - 0.25, g0 + 1.05, z0], [cxx + 0.25, g0 + 1.05, z0], [cxx + 0.22, g0 + 1.85 - t * 0.15, z0]); } });
      put(wd * 0.25, dp * 0.25, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.36, 0.28, 0.2], 0.5); m.cyl(x, g, z, 0.42, 0.36, 0.5, 6, 2); m.mat(MAT.PLAIN, [0.22, 0.26, 0.3]); m.cyl(x, g + 0.46, z, 0.36, 0.36, 0.03, 6, 2); addCircleCollider(m, x, z, 0.42, g, g + 0.5); }); }
    else if (kind === 'cooper') { put(-wd / 4, dp * 0.5, (x, z) => { for (let k = 0; k < 4; k++) { const bx = x + (k % 2) * 0.78, bz = z + ((k / 3) | 0) * 0.78, g = gy(bx, bz); m.mat(MAT.PLANKS, [0.42, 0.32, 0.2], 0.5); m.cyl(bx, g, bz, 0.34, 0.38, 0.8, 6, 2); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.5); m.cyl(bx, g + 0.15, bz, 0.385, 0.385, 0.04, 6, 0); m.cyl(bx, g + 0.62, bz, 0.37, 0.37, 0.04, 6, 0); addCircleCollider(m, bx, bz, 0.36, g, g + 0.8); }
      const sx = x + 2.9, g = gy(sx, z); m.mat(MAT.TIMBER, [0.5, 0.4, 0.26], 0.5); for (let k = 0; k < 7; k++) m.beam([sx - 0.3 + k * 0.1, g, z], [sx + 0.2 + k * 0.1, g + 1.3, z + 0.3], 0.025, 0.04); }); }
    else if (kind === 'dyer') { for (let i = 0; i < 3; i++) put(-wd / 3 + i * 1.15, dp * 0.35, (x, z) => { const g = gy(x, z), col = [[0.15, 0.25, 0.55], [0.6, 0.2, 0.15], [0.55, 0.45, 0.12]][i]; m.mat(MAT.PLANKS, [0.36, 0.28, 0.2], 0.5); m.cyl(x, g, z, 0.5, 0.46, 0.7, 6, 2); m.mat(MAT.PLAIN, col); m.cyl(x, g + 0.66, z, 0.44, 0.44, 0.02, 6, 2); addCircleCollider(m, x, z, 0.5, g, g + 0.7); flat(m, x + 0.3, z + 0.6, 0.35, 0.25, col.map(v => v * 0.5), MAT.MUD, R() * 3, 0.03); });
      put(0, dp * 0.8, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.32, 0.25, 0.18], 0.5); for (const sx of [-1.4, 1.4]) m.beam([x + sx, g, z], [x + sx, g + 1.9, z], 0.05, 0.05); m.beam([x - 1.4, g + 1.8, z], [x + 1.4, g + 1.8, z], 0.04, 0.04); m.mat(MAT.CLOTH, [0.34, 0.38, 0.5], 0.5); m.quad2([x - 1.2, g + 1.78, z], [x - 1.2, g + 0.9, z], [x - 0.3, g + 0.9, z], [x - 0.3, g + 1.78, z]); m.mat(MAT.CLOTH, [0.55, 0.34, 0.28], 0.5); m.quad2([x + 0.3, g + 1.78, z], [x + 0.3, g + 1.0, z], [x + 1.2, g + 1.0, z], [x + 1.2, g + 1.78, z]); }); }
    else if (kind === 'forge') { put(-wd / 4, dp * 0.4, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); m.cyl(x, g, z, 0.3, 0.28, 0.55, 5, 2); m.mat(MAT.METAL, [0.17, 0.17, 0.18], 0.5); m.box(x - 0.35, g + 0.55, z - 0.12, x + 0.35, g + 0.68, z + 0.12); addCircleCollider(m, x, z, 0.32, g, g + 0.7);
      for (let k = 0; k < 5; k++) { const sx = x + 1.4 + R() * 2, sz = z + (R() - 0.5) * 2; m.mat(MAT.METAL, [0.22 + R() * 0.12, 0.17, 0.14], 0.5); m.ball(sx, gy(sx, sz) + 0.06, sz, 0.12 + R() * 0.2, 0.06, 0.1 + R() * 0.12, 5, 3); } flat(m, x + 0.4, z + 1.3, 0.9, 0.55, [0.06, 0.06, 0.06], MAT.PLAIN, 0.4, 0.03); }); }
    else if (kind === 'stable') { put(-wd / 4, dp * 0.35, (x, z) => { const g = gy(x, z); m.mat(MAT.THATCH, [0.72, 0.6, 0.3], 0.5); m.ball(x, g + 0.7, z, 1.3, 0.8, 1.0, 6, 4); addBoxCollider(m, x - 1.1, z - 0.8, x + 1.1, z + 0.8, g, g + 1.4); m.mat(MAT.PLANKS, [0.34, 0.27, 0.2], 0.5); m.box(x + 2.0, g, z - 0.3, x + 3.2, g + 0.5, z + 0.3); m.mat(MAT.PLAIN, [0.15, 0.2, 0.24]); m.box(x + 2.1, g + 0.42, z - 0.2, x + 3.1, g + 0.5, z + 0.2); addBoxCollider(m, x + 2.0, z - 0.3, x + 3.2, z + 0.3, g, g + 0.5); flat(m, x + 2.6, z + 1.0, 1.0, 0.6, [0.18, 0.13, 0.08], MAT.MUD, 0.3, 0.03); });
      put(wd / 4, dp * 0.7, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.box(x - 1.0, g + 0.45, z - 0.5, x + 1.0, g + 0.7, z + 0.5); for (const sx of [-0.8, 0.8]) m.cyl(x + sx, g, z + 0.6, 0.38, 0.38, 0.1, 6, 2); addBoxCollider(m, x - 1.0, z - 0.55, x + 1.0, z + 0.55, g, g + 0.75); }); }
  };
  for (const p of P) {
    if (p.axis === 'x') {      /* walls on the party lines, a back wall with a gate, the work kept in a lean-to against the house's back (frame of the house) */
      const m = bucket((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2), tone = 0.44 + R() * 0.06, xw = p.wall, xh = p.bx > 0 ? p.x0 : p.x1, zc = (p.z0 + p.z1) / 2, gz = zc + (R() - 0.5) * 2, gw = 1.3;
      stone(m, xw, p.z0 + 0.15, xw, gz - gw / 2, H - 0.1, tone); stone(m, xw, gz + gw / 2, xw, p.z1 - 0.15, H - 0.1, tone);
      for (const zs of [gz - gw / 2, gz + gw / 2]) { m.mat(MAT.STONE, [tone * 1.1, tone * 1.05, tone], 1.4); m.cbox(xw, gy(xw, zs) - 0.1, zs, 0.4, 1.6, 0.4, 0); }
      for (const zs of [p.z0, p.z1]) stone(m, xh, zs, xw - p.bx * 0.15, zs, H * 0.92, tone);
      const s = p.house, c = siteToWorld(s, 0, s.d / 2 + 0.2), g = gy(c[0], c[1]); m.push().T(c[0], g, c[1]).RY(-s.yaw);
      m.mat(MAT.PLANKS, [0.4, 0.31, 0.22], 0.5); m.box(-1.4, 0.45, 1.2, 1.4, 0.7, 2.0); for (const sx of [-1.2, 1.2]) m.cyl(sx, 0, 1.6, 0.36, 0.4, 0.45, 6, 2); m.mat(MAT.THATCH, [0.7, 0.58, 0.3], 0.5); m.ball(0, 0.7, 3.2, 1.3, 0.8, 1.0, 6, 4); m.pop();
      continue;
    }
    const wd = p.x1 - p.x0, dp = Math.abs(p.wall - (p.bz > 0 ? p.z0 : p.z1)), cx = (p.x0 + p.x1) / 2, zFront = p.bz > 0 ? p.z0 : p.z1, tone = 0.42 + R() * 0.1, styleI = ((Math.abs(p.house.x * 3.1 + p.house.z) | 0) + P.indexOf(p)) % 4;
    const m = bucket(cx, (p.z0 + p.z1) / 2), h = H - 0.15 * R(), style = STYLES[styleI], seg = (m2, ax, az, bx, bz, hh) => style === 'stone' ? stone(m2, ax, az, bx, bz, hh, tone) : style === 'fence' ? fence(m2, ax, az, bx, bz) : style === 'board' ? slab(m2, ax, az, bx, bz, 1.55, MAT.PLANKS, [0.52 + R() * 0.06, 0.42, 0.31], 0.1) : slab(m2, ax, az, bx, bz, 1.15, MAT.THATCH, [0.46, 0.37, 0.2], 0.14);
    const gate = (a, b, gx, gw) => { /* a wall along x from a to b with a gap [gx-gw/2, gx+gw/2] */ };
    const zw = p.wall, gx = cx + (R() - 0.5) * (wd - 2.4), gw = 1.2;
    seg(m, p.x0 + 0.15, zw, gx - gw / 2, zw, h), seg(m, gx + gw / 2, zw, p.x1 - 0.15, zw, h);
    for (const sx of [gx - gw / 2, gx + gw / 2]) { m.mat(MAT.STONE, [tone * 1.1, tone * 1.05, tone], 1.4); m.cbox(sx, gy(sx, zw) - 0.1, zw, 0.4, 1.6, 0.4, 0); }
    { const gz = zw, g0 = gy(gx, gz); m.mat(MAT.STONE, [0.5, 0.47, 0.42], 1.2); m.box(gx - 0.6, g0 - 0.02, gz - 0.28, gx + 0.6, g0 + 0.1, gz + 0.28);      /* a doorstep worn in the gap */
      m.push().T(gx + gw / 2 - 0.05, g0, gz).RY(p.bz > 0 ? 1.0 : -1.0); m.mat(MAT.PLANKS, [0.33, 0.26, 0.19], 0.8); m.box(-0.95, 0.08, -0.04, 0, 1.2, 0.04); m.mat(MAT.METAL, [0.14, 0.14, 0.14], 0.4); m.box(-0.2, 0.55, -0.06, -0.12, 0.65, 0.06); m.box(-0.95, 0.35, -0.06, -0.3, 0.4, 0.06); m.box(-0.95, 0.9, -0.06, -0.3, 0.95, 0.06); m.pop(); }
    /* the side party walls, with the house's own side left open where the neighbour is a gap: they run from the house's back wall to the back wall of the plot */
    const zh = zFront;
    for (const sx of [p.x0, p.x1]) {
      if (sx === p.x0 && P.some(q => q !== p && q.row === p.row && Math.abs(q.x1 - p.x0) < 0.06 && Math.abs(q.bz - p.bz) < 1e-6)) continue;      /* a party wall is built once */
      seg(m, sx, zh, sx, zw - p.bz * 0.15, h * 0.92);
    }
    if (!(TEST && TEST.plots === 2)) trade(p, m, cx, zFront + p.bz * 0.01, 1, 0, wd, dp);
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
    m.mat(MAT.PLANKS, [0.34, 0.27, 0.2], 0.5); m.box(-hw + 0.1, 0, 0.2, hw - 0.1, 0.06, 0.62);
    if (what === 'wood') { m.mat(MAT.TIMBER, [0.42, 0.32, 0.22], 0.5); for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) { const lx = -hw + 0.35 + r * 0.15 + k * 0.4; m.beam([lx, 0.2 + r * 0.28, -0.4], [lx, 0.2 + r * 0.28, 0.5], 0.28, 0.28); } }
    else if (what === 'cask') { for (let k = 0; k < 3; k++) { m.mat(MAT.PLANKS, [0.42, 0.32, 0.2], 0.5); m.cyl(-hw + 0.7 + k * 0.85, 0, 0.1, 0.34, 0.38, 0.8, 6, 2); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.5); m.cyl(-hw + 0.7 + k * 0.85, 0.15, 0.1, 0.385, 0.385, 0.04, 6, 0); } }
    else { m.mat(MAT.TIMBER, [0.36, 0.28, 0.2], 0.5); m.box(-hw + 0.3, 0.45, 0.0, -hw + 1.8, 0.55, 0.45); m.mat(MAT.PLAIN, [0.2, 0.14, 0.1], 0.5); for (let k = 0; k < 3; k++) m.ball(-hw + 0.5 + k * 0.5, 0.6 + 0.2, 0.2, 0.12, 0.22, 0.08, 5, 4); }
    m.pop();
    for (const [lx, lz] of [[-hw, 0.65], [hw, 0.65]]) { const p = siteToWorld(s, lx, s.d / 2 + 0.7 + (lz - 0.7) + 0.0); addCircleCollider(m, p[0], p[1], 0.1, g, g + 2.0); }
  }
}
