// ───────────────────────── Wharf Street and Wharfside: ground, plots and yard (docs/TOWNPLAN.md section 3) ─────────────────────────
// Layout lives in 55d_wharfside.js (WHARF). Here: the ground paint (trodden earth and mud, no lawn between the houses), each house's crowded poor yard behind it (nets, upturned boats,
// fish barrels, wood, a pig, undyed washing, a smoke rack) with its low fence, and the open boat shed on the wharf yard. Everything is merged into the village cells through `bucket`.
function wharfDistrict(s) { return s && s.w && s.id !== 'tower' && s.id !== 'barn' && s.z > 33 && s.z < 92 && s.x > -46 && s.x < 48 && !/^(hunter|fisher|high)/.test(s.id); }
let _WPLOTS = null;
function wharfPlots() {
  if (_WPLOTS) return _WPLOTS; _WPLOTS = [];
  if (typeof WHARF === 'undefined' || !WHARF.houses.length) return _WPLOTS;
  const TR = ['nets', 'boat', 'barrels', 'woodpile', 'pig', 'washing', 'smoke', 'nets', 'barrels', 'boat'];
  const blocked = (x, z, self, pad) => {
    for (const s of SITES) { if (s === self || !s.w || s.id === 'tower') continue; const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad && Math.abs(l[1]) < s.d / 2 + pad) return true; }
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + 1) < r.w / 2 + 1.0) return true;
    if (hyp(x - LAKE.x, z - LAKE.z) < LAKE.r + 1.5) return true;
    if (typeof River !== 'undefined' && Math.abs(River.dist(x, z, 12)) < 7) return true;
    return false;
  };
  const R = rng(5521); let k = 0;
  for (const [id] of WHARF.houses) {
    const s = SITE[id]; if (!s) continue;
    const nx = Math.sin(s.yaw), nz = -Math.cos(s.yaw), ux = Math.cos(s.yaw), uz = Math.sin(s.yaw), bx = -nx, bz = -nz;      // front normal; along the front; the back
    const hw = s.w / 2 + 0.25; let depth = 0;
    for (let d = 5.6; d >= 2.0; d -= 0.4) { let ok = true; for (let a = -hw + 0.3; a <= hw - 0.3 && ok; a += 0.8) for (let b = 0.4; b <= d + 1.3 && ok; b += 0.6) { const x = s.x + bx * (s.d / 2 + b) + ux * a, z = s.z + bz * (s.d / 2 + b) + uz * a; if (blocked(x, z, s, 0.9)) ok = false; } if (ok) { depth = d; break; } }
    if (depth < 2.0) continue;
    _WPLOTS.push({ id, s, ux, uz, bx, bz, hw, depth, ox: s.x + bx * (s.d / 2 + 0.1), oz: s.z + bz * (s.d / 2 + 0.1), trade: TR[(k++ + (R() * 3 | 0)) % TR.length] });
  }
  return _WPLOTS;
}
// ground: trodden earth round every house of the district and its yard, the street as mud, a stony margin at the water
function wharfPaint(A, B, H) {
  if (typeof WHARF === 'undefined' || !WHARF.houses.length) return;
  const { P, stroke, red, grn } = H, sc = H.sc;
  const poly = (ctx, pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); };
  const rect = (x, z, yaw, w, d) => { const c = Math.cos(yaw), sn = Math.sin(yaw); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + a * w / 2 * c - b * d / 2 * sn, z + a * w / 2 * sn + b * d / 2 * c]); };
  for (const s of SITES) if (wharfDistrict(s)) {
    for (const [e, al] of [[3.6, 0.3], [2.6, 0.5], [1.6, 0.8]]) poly(A, rect(s.x, s.z, s.yaw, s.w + 2 * e, s.d + 2 * e), red(al));
    poly(B, rect(s.x, s.z, s.yaw, s.w + 5.2, s.d + 5.2), red(0.85));
  }
  for (const p of wharfPlots()) { const yaw = Math.atan2(p.uz, p.ux), cx = p.ox + p.bx * p.depth / 2, cz = p.oz + p.bz * p.depth / 2; poly(A, rect(cx, cz, yaw, p.hw * 2 + 0.6, p.depth + 0.6), red(0.9)); poly(B, rect(cx, cz, yaw, p.hw * 2 + 1.6, p.depth + 1.4), red(1)); }
  if (WHARF.street) { const L = WHARF.street.L, pts = L.p.filter(q => q[1] > 32); stroke(A, pts, 4.4, red, 1.4); stroke(B, pts, 5.2, red, 1.2); }
}
// the yard behind each house: low fence on the back and the party lines; one trade of the poor
function buildWharfPlots(bucket) {
  if (TEST && TEST.plots === 0) return;
  const PL = wharfPlots(), R = rng(7733), gy = (x, z) => Terrain.y(x, z);
  const fence = (m, ax, az, bx, bz, h) => {
    const L = Math.hypot(bx - ax, bz - az); if (L < 0.3) return; const n = Math.max(1, Math.round(L / 1.5)); m.mat(MAT.TIMBER, [0.26, 0.21, 0.16], 0.5);
    for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; m.cbox(x, gy(x, z) - 0.1, z, 0.09, h + 0.1 + (R() - 0.5) * 0.2, 0.09, 0); }
    for (const y of [0.4, h - 0.15]) for (let i = 0; i < n; i++) { const x0 = ax + (bx - ax) * i / n, z0 = az + (bz - az) * i / n, x1 = ax + (bx - ax) * (i + 1) / n, z1 = az + (bz - az) * (i + 1) / n; m.beam([x0, gy(x0, z0) + y, z0], [x1, gy(x1, z1) + y + (R() - 0.5) * 0.06, z1], 0.05, 0.07); }
    for (let i = 0; i <= Math.ceil(L / 0.45); i++) { const t = i / Math.ceil(L / 0.45), x = ax + (bx - ax) * t, z = az + (bz - az) * t; addCircleCollider(m, x, z, 0.14, gy(x, z), gy(x, z) + h); }      // a run of small circles: an oblique fence does not become one big box
  };
  const flat = (m, x, z, rx, rz, c, mat, ry) => { m.mat(mat, c, 0.5); m.push().T(x, gy(x, z) + 0.025, z).RY(ry || 0); m.quad2([-rx, 0, -rz * 0.6], [-rx * 0.6, 0, rz], [rx, 0, rz * 0.7], [rx * 0.7, 0, -rz]); m.pop(); };
  for (const p of PL) {
    const at = (a, b) => [p.ox + p.ux * a + p.bx * b, p.oz + p.uz * a + p.bz * b], m = bucket(...at(0, p.depth / 2)), h = 0.95;
    const corner = (a, b) => at(a, b);
    // fence: the back, and the sides (open where the neighbour's yard is within a metre: a ginnel or a shared line is left, not walled twice)
    { const a0 = corner(-p.hw, p.depth), a1 = corner(p.hw, p.depth); fence(m, a0[0], a0[1], a1[0], a1[1], h);
      }
    const dp = p.depth, put = (a, b, f) => { const q = at(a, b); f(q[0], q[1]); };
    const along = (a0, a1, b) => ({ p0: at(a0, b), p1: at(a1, b) });
    if (p.trade === 'nets') {
      for (const sg of [-1, 1]) put(sg * 1.5, dp * 0.55, (x, z) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); m.beam([x, g, z], [x, g + 2.1, z], 0.07, 0.07); });
      { const { p0, p1 } = along(-1.5, 1.5, dp * 0.55), g0 = gy(p0[0], p0[1]); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); m.beam([p0[0], g0 + 2.0, p0[1]], [p1[0], g0 + 2.0, p1[1]], 0.05, 0.05);
        m.mat(MAT.CLOTH, [0.26, 0.24, 0.19], 0.5); m.quad2([p0[0], g0 + 1.95, p0[1]], [p1[0], g0 + 1.95, p1[1]], [p1[0] - 0.1, g0 + 0.9, p1[1] + 0.12], [p0[0] + 0.1, g0 + 0.9, p0[1] + 0.12]); m.quad2([p0[0] + 0.1, g0 + 0.9, p0[1] + 0.12], [p1[0] - 0.1, g0 + 0.9, p1[1] + 0.12], [p1[0], g0 + 1.95, p1[1]], [p0[0], g0 + 1.95, p0[1]]); }
      put(0.2, dp * 0.25, (x, z) => flat(m, x, z, 1.0, 0.6, [0.2, 0.19, 0.15], MAT.CLOTH, R() * 3));
    } else if (p.trade === 'boat') {
      put(0, dp * 0.5, (x, z) => { const g = gy(x, z), ang = Math.atan2(p.uz, p.ux); m.mat(MAT.PLANKS, [0.17, 0.14, 0.11], 0.5); m.push().T(x, g + 0.55, z).RY(-ang); m.ball(0, 0, 0, 1.7, 0.55, 0.72, 8, 5); m.pop(); m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5);
        for (const sg of [-1, 1]) { const q = at(sg * 0.9, dp * 0.5 - 0.0); m.beam([q[0], g, q[1] - 0.3], [q[0], g + 0.5, q[1] - 0.3], 0.06, 0.06); m.beam([q[0], g, q[1] + 0.3], [q[0], g + 0.5, q[1] + 0.3], 0.06, 0.06); }
        addBoxCollider(m, x - 1.5, z - 0.7, x + 1.5, z + 0.7, g, g + 1.0); });
    } else if (p.trade === 'barrels') {
      for (let i = 0; i < 4; i++) put(-1.2 + (i % 2) * 0.8, dp * 0.35 + ((i / 2) | 0) * 0.8, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.3, 0.23, 0.15], 0.5); m.cyl(x, g, z, 0.32, 0.36, 0.8, 6, 2); m.mat(MAT.METAL, [0.18, 0.18, 0.18], 0.5); m.cyl(x, g + 0.15, z, 0.365, 0.365, 0.04, 6, 0); m.cyl(x, g + 0.6, z, 0.355, 0.355, 0.04, 6, 0); addCircleCollider(m, x, z, 0.36, g, g + 0.8); });
      { const { p0, p1 } = along(0.6, 2.0, dp * 0.7), g0 = gy(p0[0], p0[1]); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const q of [p0, p1]) m.beam([q[0], g0, q[1]], [q[0], g0 + 1.6, q[1]], 0.05, 0.05); m.beam([p0[0], g0 + 1.55, p0[1]], [p1[0], g0 + 1.55, p1[1]], 0.04, 0.04);
        m.mat(MAT.PLAIN, [0.5, 0.52, 0.5]); for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6, x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t; m.box(x - 0.03, g0 + 1.0, z - 0.02, x + 0.03, g0 + 1.52, z + 0.02); } }
    } else if (p.trade === 'woodpile') {
      put(0, dp * 0.55, (x, z) => { const g = gy(x, z), ang = Math.atan2(p.uz, p.ux); m.mat(MAT.TIMBER, [0.32, 0.25, 0.17], 0.5); m.push().T(x, g, z).RY(-ang); for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) m.box(-1.3 + r * 0.22 + k * 0.45, r * 0.19, -0.35 + (R() - 0.5) * 0.05, -1.3 + r * 0.22 + k * 0.45 + 0.4, r * 0.19 + 0.17, 0.35); m.pop(); addBoxCollider(m, x - 1.4, z - 0.45, x + 1.4, z + 0.45, g, g + 0.8); });
    } else if (p.trade === 'pig') {
      put(0, dp * 0.55, (x, z) => { const g = gy(x, z); flat(m, x, z, 1.5, 1.1, [0.14, 0.1, 0.07], MAT.MUD, 0); m.mat(MAT.PLAIN, [0.68, 0.5, 0.48]); m.ball(x + 0.3, g + 0.28, z + 0.1, 0.42, 0.26, 0.24, 7, 5); m.ball(x + 0.75, g + 0.3, z + 0.1, 0.18, 0.16, 0.16, 6, 4); });
    } else if (p.trade === 'washing') {
      { const { p0, p1 } = along(-1.7, 1.7, dp * 0.5), g0 = gy(p0[0], p0[1]); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const q of [p0, p1]) m.beam([q[0], g0, q[1]], [q[0], g0 + 1.95, q[1]], 0.05, 0.05); m.mat(MAT.PLAIN, [0.6, 0.58, 0.52]); m.beam([p0[0], g0 + 1.9, p0[1]], [p1[0], g0 + 1.78, p1[1]], 0.012, 0.012);
        for (let k = 0; k < 5; k++) { const t = (k + 0.6) / 5.4, x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t, y = g0 + 1.86 - 0.1 * t; m.mat(MAT.CLOTH, k % 2 ? [0.7, 0.67, 0.6] : [0.76, 0.73, 0.66], 0.5); m.quad2([x - 0.25, y, z], [x + 0.25, y, z], [x + 0.22, y - 0.75 - (k % 3) * 0.1, z], [x - 0.22, y - 0.75 - (k % 3) * 0.1, z]); m.quad2([x + 0.25, y, z], [x - 0.25, y, z], [x - 0.22, y - 0.75 - (k % 3) * 0.1, z], [x + 0.22, y - 0.75 - (k % 3) * 0.1, z]); } }
    } else if (p.trade === 'smoke') {
      put(0, dp * 0.55, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.13, 0.11, 0.09], 0.5); m.box(x - 0.8, g, z - 0.8, x + 0.8, g + 1.8, z + 0.8); m.mat(MAT.THATCH, [0.4, 0.34, 0.2], 0.5); m.ball(x, g + 2.1, z, 1.15, 0.55, 1.15, 6, 4); m.mat(MAT.PLAIN, [0.04, 0.04, 0.04]); m.box(x - 0.3, g + 0.0, z + 0.8, x + 0.3, g + 1.2, z + 0.84); addBoxCollider(m, x - 0.85, z - 0.85, x + 0.85, z + 0.85, g, g + 2.2); });
    }
  }
}
// the open boat shed on the wharf yard: four posts, a lean thatch roof, a hull on trestles under it, ropes and an oar rack; it faces the yard
function buildWharfYard(bucket) {
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0) || typeof WHARF === 'undefined' || !WHARF.houses.length) return;
  const gy = (x, z) => Terrain.y(x, z), cx = -2.6, cz = 77.2, m = bucket(cx, cz), R = rng(3131), g = gy(cx, cz), W2 = 2.4, D2 = 1.9;
  m.mat(MAT.TIMBER, [0.26, 0.2, 0.15], 0.5);
  for (const [a, b, hh] of [[-W2, -D2, 2.8], [W2, -D2, 2.8], [-W2, D2, 2.1], [W2, D2, 2.1]]) { m.beam([cx + a, g - 0.1, cz + b], [cx + a, g + hh, cz + b], 0.12, 0.12); addCircleCollider(m, cx + a, cz + b, 0.14, g, g + hh); }
  m.beam([cx - W2, g + 2.8, cz - D2], [cx + W2, g + 2.8, cz - D2], 0.1, 0.1); m.beam([cx - W2, g + 2.1, cz + D2], [cx + W2, g + 2.1, cz + D2], 0.1, 0.1);
  m.mat(MAT.THATCH, [0.42, 0.36, 0.22], 0.5); m.quad2([cx - W2 - 0.4, g + 2.95, cz - D2 - 0.4], [cx + W2 + 0.4, g + 2.95, cz - D2 - 0.4], [cx + W2 + 0.4, g + 2.2, cz + D2 + 0.5], [cx - W2 - 0.4, g + 2.2, cz + D2 + 0.5]);
  m.mat(MAT.PLANKS, [0.12, 0.1, 0.08], 0.5); m.push().T(cx, g + 0.8, cz + 0.1); m.ball(0, 0, 0, 2.1, 0.62, 0.8, 8, 5); m.pop();
  m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5); for (const a of [-1.2, 1.2]) { m.beam([cx + a, g, cz - 0.4], [cx + a, g + 0.5, cz - 0.4], 0.07, 0.07); m.beam([cx + a, g, cz + 0.6], [cx + a, g + 0.5, cz + 0.6], 0.07, 0.07); }
  addBoxCollider(m, cx - 2.2, cz - 0.8, cx + 2.2, cz + 1.0, g, g + 1.5);
  for (let i = 0; i < 5; i++) m.beam([cx - W2 + 0.2 + i * 0.12, g + 2.6, cz - D2 + 0.1], [cx - W2 + 0.2 + i * 0.12 - 0.1, g + 0.3, cz - D2 + 0.4], 0.03, 0.03);      // oars
}
