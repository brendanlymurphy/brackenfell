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
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + 1) < r.w / 2 + 0.5) return true;
    if (hyp(x - LAKE.x, z - LAKE.z) < LAKE.r + 1.5) return true;
    if (typeof River !== 'undefined' && Math.abs(River.dist(x, z, 12)) < 7) return true;
    return false;
  };
  const R = rng(5521); let k = 0;
  for (const [id] of WHARF.houses) {
    const s = SITE[id]; if (!s || WHARF.gables.includes(id) || (WHARF.yard || []).includes(id)) continue;
    const nx = Math.sin(s.yaw), nz = -Math.cos(s.yaw), ux = Math.cos(s.yaw), uz = Math.sin(s.yaw), bx = -nx, bz = -nz;      // front normal; along the front; the back
    const hw = s.w / 2 + 0.25; let depth = 0;
    for (let d = 5.6; d >= 2.0; d -= 0.4) { let ok = true; for (let a = -hw + 0.3; a <= hw - 0.3 && ok; a += 0.8) for (let b = 0.4; b <= d + 0.8 && ok; b += 0.6) { const x = s.x + bx * (s.d / 2 + b) + ux * a, z = s.z + bz * (s.d / 2 + b) + uz * a; if (blocked(x, z, s, 0.5)) ok = false; } if (ok) { depth = d; break; } }
    if (depth < 2.0) continue;
    _WPLOTS.push({ id, s, ux, uz, bx, bz, hw, depth, ox: s.x + bx * (s.d / 2 + 0.1), oz: s.z + bz * (s.d / 2 + 0.1), trade: TR[(k++ + (R() * 3 | 0)) % TR.length] });
  }
  return _WPLOTS;
}
// ground: trodden earth round every house of the district and its yard, the street as mud, a stony margin at the water
function wharfPaint(A, B, H) {
  if (typeof WHARF === 'undefined' || !WHARF.houses.length) return;
  const { P, stroke, red, grn, ell } = H, sc = H.sc;
  const poly = (ctx, pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); };
  const rect = (x, z, yaw, w, d) => { const c = Math.cos(yaw), sn = Math.sin(yaw); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [x + a * w / 2 * c - b * d / 2 * sn, z + a * w / 2 * sn + b * d / 2 * c]); };
  for (const s of SITES) if (wharfDistrict(s)) {
    for (const [e, al] of [[3.6, 0.3], [2.6, 0.5], [1.6, 0.8]]) poly(A, rect(s.x, s.z, s.yaw, s.w + 2 * e, s.d + 2 * e), red(al));
    poly(B, rect(s.x, s.z, s.yaw, s.w + 5.2, s.d + 5.2), red(0.85));
  }
  for (const p of wharfPlots()) { const yaw = Math.atan2(p.uz, p.ux), cx = p.ox + p.bx * p.depth / 2, cz = p.oz + p.bz * p.depth / 2; poly(A, rect(cx, cz, yaw, p.hw * 2 + 0.6, p.depth + 0.6), red(0.9)); poly(B, rect(cx, cz, yaw, p.hw * 2 + 1.6, p.depth + 1.4), red(1)); }
  { const C = wharfCloses(); for (const pl of C.paths) { stroke(A, pl, 1.7, red, 1.0); stroke(B, pl, 2.4, red, 0.9); } for (const q of C.soil) { poly(A, q, red(0.55)); poly(B, q, red(0.6)); } }
  {   // the staircase of the pad's outline is broken up: ragged blobs of earth thrown out round every house and yard rectangle, thinning into the grass
    const RR = rng(3355), blob = (x, z) => { const r = 0.55 + RR() * 0.7; ell(A, x, z, r, r * (0.7 + RR() * 0.5), red); if (RR() < 0.5) ell(B, x, z, r + 0.5, r + 0.3, red); };
    const edge = (q) => { for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length], L = hyp(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.8); for (let k = 0; k < n; k++) { const t = k / n, ox = (RR() - 0.5) * 1.6, oz = (RR() - 0.5) * 1.6; if (RR() < 0.8) blob(a[0] + (b[0] - a[0]) * t + ox, a[1] + (b[1] - a[1]) * t + oz); } } };
    for (const s of SITES) if (wharfDistrict(s)) edge(rect(s.x, s.z, s.yaw, s.w + 3.6, s.d + 3.6));
    for (const p of wharfPlots()) { const yaw = Math.atan2(p.uz, p.ux), cx = p.ox + p.bx * p.depth / 2, cz = p.oz + p.bz * p.depth / 2; edge(rect(cx, cz, yaw, p.hw * 2 + 0.6, p.depth + 0.6)); }
    if (WHARF.street) { const L = WHARF.street.L, pts = L.p.filter(q => q[1] > 32); for (let i = 0; i < pts.length; i += 2) for (const sg of [-1, 1]) if (RR() < 0.85) { const a = pts[Math.min(i + 1, pts.length - 1)], b = pts[i], dx = a[0] - b[0], dz = a[1] - b[1], l = hyp(dx, dz) || 1, o = sg * (2.6 + RR() * 1.1); blob(b[0] - dz / l * o, b[1] + dx / l * o); } }
    const E = WHARF.edge; if (E) stroke(B, E.map(q => [q[0] + 0.7, q[1]]), 1.4, grn, 0.9);      // the ditch: wet ground along the hedge
  }
  {   // shingle: the yard's lower half and the shore strip are pale pebbles, thinning into turf (the cobble channel at low strength)
    const RS = rng(5151), sp = wharfShore(1.5);
    for (let i = 0; i < sp.length; i++) { const [x, z] = sp[i]; for (let k = 0; k < 2; k++) if (RS() < 0.7) { const ox = (RS() - 0.5) * 3.2, oz = (RS() - 0.5) * 2.4, r = 1.4 + RS() * 1.6; ell(A, x + ox, z + oz - 1.2, r, r * 0.7, grn); } }
  }
  if (WHARF.street) { const L = WHARF.street.L, pts = L.p.filter(q => q[1] > 32); stroke(A, pts, 4.4, red, 1.4); stroke(B, pts, 5.2, red, 1.2); }
}
// the yard behind each house: low fence on the back and the party lines; one trade of the poor
function buildWharfPlots(bucket) {
  if (TEST && TEST.plots === 0) return;
  let lowSkip = true; { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 46; m.lowDist = 110; return m; }; }      // [fx3] on Low the small dressing is built into a scratch mesh that is never drawn (colliders stay, so Low and Medium play the same)      // small dressing lives in cells of its own with a draw distance
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
        wNet(m, [p0[0], g0 + 1.97, p0[1]], [p1[0], g0 + 1.97, p1[1]], 1.05, R); }
      put(0.2, dp * 0.25, (x, z) => flat(m, x, z, 1.0, 0.6, [0.2, 0.19, 0.15], MAT.CLOTH, R() * 3));
    } else if (p.trade === 'boat') {
      put(0, dp * 0.5, (x, z) => { const g = gy(x, z), ang = Math.atan2(p.uz, p.ux); wharfHull(m, x, z, g + 0.45, ang, 3.5, 0.72, 0.6, false); m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5);
        for (const sg of [-1, 1]) { const q = at(sg * 0.9, dp * 0.5 - 0.0); m.beam([q[0], g, q[1] - 0.3], [q[0], g + 0.5, q[1] - 0.3], 0.06, 0.06); m.beam([q[0], g, q[1] + 0.3], [q[0], g + 0.5, q[1] + 0.3], 0.06, 0.06); }
        addBoxCollider(m, x - 1.5, z - 0.7, x + 1.5, z + 0.7, g, g + 1.0); });
    } else if (p.trade === 'barrels') {
      for (let i = 0; i < 4; i++) put(-1.2 + (i % 2) * 0.8, dp * 0.35 + ((i / 2) | 0) * 0.8, (x, z) => { const g = gy(x, z); m.mat(MAT.PLANKS, [0.3, 0.23, 0.15], 0.5); m.cyl(x, g, z, 0.32, 0.36, 0.8, 6, 2); m.mat(MAT.METAL, [0.18, 0.18, 0.18], 0.5); m.cyl(x, g + 0.15, z, 0.365, 0.365, 0.04, 6, 0); m.cyl(x, g + 0.6, z, 0.355, 0.355, 0.04, 6, 0); ; });
      { const { p0, p1 } = along(0.6, 2.0, dp * 0.7), g0 = gy(p0[0], p0[1]); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const q of [p0, p1]) m.beam([q[0], g0, q[1]], [q[0], g0 + 1.6, q[1]], 0.05, 0.05); m.beam([p0[0], g0 + 1.55, p0[1]], [p1[0], g0 + 1.55, p1[1]], 0.04, 0.04);
        for (let i = 0; i < 8; i++) { const t = (i + 0.5) / 8, x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t; wFish(m, x, g0 + 1.52, z, p1[0] - p0[0], p1[1] - p0[1], 0.34 + (i % 3) * 0.04); } }
    } else if (p.trade === 'woodpile') {
      put(0, dp * 0.55, (x, z) => { const g = gy(x, z), ang = Math.atan2(p.uz, p.ux); m.mat(MAT.TIMBER, [0.32, 0.25, 0.17], 0.5); m.push().T(x, g, z).RY(-ang); for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) { const lr = 0.085 + R() * 0.02, bl = 0.62 + R() * 0.12; m.mat(MAT.TIMBER, [0.3 + R() * 0.07, 0.24 + R() * 0.05, 0.17 + R() * 0.03], 0.5); m.push().T(-1.1 + r * 0.1 + k * 0.4, 0.1 + r * 0.17, (R() - 0.5) * 0.06).RX(Math.PI / 2); m.cyl(0, -bl / 2, 0, lr, lr * 0.94, bl, 6, 2); m.pop(); } for (const sx of [-1.35, 1.35]) { m.mat(MAT.TIMBER, [0.22, 0.17, 0.12], 0.5); m.beam([sx, 0, -0.38], [sx, 0.85, -0.38], 0.04, 0.04); m.beam([sx, 0, 0.38], [sx, 0.85, 0.38], 0.04, 0.04); } m.pop(); addBoxCollider(m, x - 1.4, z - 0.45, x + 1.4, z + 0.45, g, g + 0.8); });
    } else if (p.trade === 'pig') {
      put(0, dp * 0.55, (x, z) => { const g = gy(x, z); flat(m, x, z, 1.5, 1.1, [0.14, 0.1, 0.07], MAT.MUD, 0); m.mat(MAT.THATCH, [0.52, 0.44, 0.26], 0.5); for (let k = 0; k < 26; k++) { const a = R() * 6.28, r = R() * 1.2, sx = x + Math.cos(a) * r * 0.9, sz = z + Math.sin(a) * r * 0.6, sa = R() * 6.28, sl = 0.25 + R() * 0.25; m.beam([sx, g + 0.04, sz], [sx + Math.cos(sa) * sl, g + 0.05 + R() * 0.04, sz + Math.sin(sa) * sl], 0.008, 0.006); } m.mat(MAT.PLANKS, [0.3, 0.24, 0.17], 0.5); m.push().T(x - 0.9, g, z + 0.5).RY(0.3); m.box(-0.45, 0.16, -0.12, 0.45, 0.2, 0.12); m.box(-0.45, 0.2, -0.14, 0.45, 0.34, -0.1); m.box(-0.45, 0.2, 0.1, 0.45, 0.34, 0.14); m.box(-0.47, 0.2, -0.14, -0.43, 0.34, 0.14); m.box(0.43, 0.2, -0.14, 0.47, 0.34, 0.14); m.mat(MAT.TIMBER, [0.22, 0.17, 0.12], 0.5); for (const sx of [-0.35, 0.35]) m.box(sx - 0.03, 0, -0.1, sx + 0.03, 0.17, 0.1); m.pop(); });
    } else if (p.trade === 'washing') {
      { const { p0, p1 } = along(-1.7, 1.7, dp * 0.5), g0 = gy(p0[0], p0[1]); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const q of [p0, p1]) m.beam([q[0], g0, q[1]], [q[0], g0 + 1.95, q[1]], 0.05, 0.05); m.mat(MAT.PLAIN, [0.6, 0.58, 0.52]); m.beam([p0[0], g0 + 1.9, p0[1]], [p1[0], g0 + 1.78, p1[1]], 0.012, 0.012);
        for (let k = 0; k < 5; k++) { const t = (k + 0.6) / 5.4, x = p0[0] + (p1[0] - p0[0]) * t, z = p0[1] + (p1[1] - p0[1]) * t, y = g0 + 1.86 - 0.1 * t; m.mat(MAT.CLOTH, k % 2 ? [0.7, 0.67, 0.6] : [0.76, 0.73, 0.66], 0.5); m.quad2([x - 0.25, y, z], [x + 0.25, y, z], [x + 0.22, y - 0.75 - (k % 3) * 0.1, z], [x - 0.22, y - 0.75 - (k % 3) * 0.1, z]); m.quad2([x + 0.25, y, z], [x - 0.25, y, z], [x - 0.22, y - 0.75 - (k % 3) * 0.1, z], [x + 0.22, y - 0.75 - (k % 3) * 0.1, z]); } }
    } else if (p.trade === 'smoke') {
      put(0, dp * 0.55, (x, z) => { const g = gy(x, z); const ang = Math.atan2(p.uz, p.ux); m.push().T(x, g, z).RY(-ang); m.mat(MAT.STONE, [0.3, 0.28, 0.25], 0.5); m.box(-0.9, -0.2, -0.9, 0.9, 0.25, 0.9); m.mat(MAT.PLANKS, [0.28, 0.23, 0.17], 0.5); for (let k = 0; k < 8; k++) { const o = -0.8 + k * 0.2; m.box(o, 0.25, -0.8, o + 0.19, 1.75, -0.74); m.box(o, 0.25, 0.74, o + 0.19, 1.75, 0.8); m.box(-0.8, 0.25, o, -0.74, 1.75, o + 0.19); m.box(0.74, 0.25, o, 0.8, 1.75, o + 0.19); }
        m.mat(MAT.TIMBER, [0.2, 0.16, 0.11], 0.5); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box(sx * 0.8 - 0.05, 0.2, sz * 0.8 - 0.05, sx * 0.8 + 0.05, 1.82, sz * 0.8 + 0.05); m.box(-0.5, 0.25, -0.84, 0.5, 1.4, -0.8); m.mat(MAT.TIMBER, [0.15, 0.12, 0.09], 0.5); m.box(-0.48, 0.25, -0.86, -0.4, 1.4, -0.8); m.box(0.4, 0.25, -0.86, 0.48, 1.4, -0.8); m.box(-0.48, 1.4, -0.86, 0.48, 1.47, -0.8); m.box(-0.1, 0.8, -0.89, 0.1, 0.88, -0.86);
        m.mat(MAT.THATCH, [0.4, 0.34, 0.2], 0.5); m.push().T(0, 1.75, 0).RY(Math.PI / 4); m.cyl(0, 0, 0, 1.5, 0.09, 0.78, 4, 0); m.cyl(0, -0.03, 0, 1.5, 1.45, 0.06, 4, 1); m.pop(); m.mat(MAT.TIMBER, [0.2, 0.16, 0.11], 0.5); m.box(-0.14, 2.45, -0.14, 0.14, 2.7, 0.14); m.box(-0.2, 2.7, -0.2, 0.2, 2.76, 0.2); m.pop(); addBoxCollider(m, x - 0.85, z - 0.85, x + 0.85, z + 0.85, g, g + 2.2); });
    }
  }
}
// the open boat shed on the wharf yard: four posts, a lean thatch roof, a hull on trestles under it, ropes and an oar rack; it faces the yard
function buildWharfYard(bucket) {
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0) || typeof WHARF === 'undefined' || !WHARF.houses.length) return;
  { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 46; m.lowDist = 110; return m; }; }      // [fx3] on Low the small dressing is built into a scratch mesh that is never drawn (colliders stay, so Low and Medium play the same)      // small dressing lives in cells of its own with a draw distance
  const gy = (x, z) => Terrain.y(x, z), cx = -2.6, cz = 77.2, m = bucket(cx, cz), R = rng(3131), g = gy(cx, cz), W2 = 2.4, D2 = 1.9;
  m.mat(MAT.TIMBER, [0.26, 0.2, 0.15], 0.5);
  for (const [a, b, hh] of [[-W2, -D2, 2.8], [W2, -D2, 2.8], [-W2, D2, 2.1], [W2, D2, 2.1]]) { m.beam([cx + a, g - 0.1, cz + b], [cx + a, g + hh, cz + b], 0.12, 0.12); addCircleCollider(m, cx + a, cz + b, 0.14, g, g + hh); }
  m.beam([cx - W2, g + 2.8, cz - D2], [cx + W2, g + 2.8, cz - D2], 0.1, 0.1); m.beam([cx - W2, g + 2.1, cz + D2], [cx + W2, g + 2.1, cz + D2], 0.1, 0.1);
  { const T = [[cx - W2 - 0.4, g + 2.95, cz - D2 - 0.4], [cx + W2 + 0.4, g + 2.95, cz - D2 - 0.4], [cx + W2 + 0.4, g + 2.2, cz + D2 + 0.5], [cx - W2 - 0.4, g + 2.2, cz + D2 + 0.5]], Bm = T.map(q => [q[0], q[1] - 0.17, q[2]]);      // a thatched roof with thickness: top, underside of boards, four closed edges
    m.mat(MAT.THATCH, [0.42, 0.36, 0.22], 0.5); m.quad2(T[0], T[1], T[2], T[3]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; m.quad2(T[i], T[j], Bm[j], Bm[i]); }
    m.mat(MAT.PLANKS, [0.3, 0.24, 0.17], 0.5); m.quad2(Bm[3], Bm[2], Bm[1], Bm[0]); }
  wharfHull(m, cx, cz + 0.1, g + 0.58, 0, 4.1, 0.82, 0.62, false);
  m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5); for (const a of [-1.2, 1.2]) { m.beam([cx + a, g, cz - 0.4], [cx + a, g + 0.5, cz - 0.4], 0.07, 0.07); m.beam([cx + a, g, cz + 0.6], [cx + a, g + 0.5, cz + 0.6], 0.07, 0.07); }
  addBoxCollider(m, cx - 2.2, cz - 0.8, cx + 2.2, cz + 1.0, g, g + 1.5);
  for (let i = 0; i < 5; i++) m.beam([cx - W2 + 0.2 + i * 0.12, g + 2.6, cz - D2 + 0.1], [cx - W2 + 0.2 + i * 0.12 - 0.1, g + 0.3, cz - D2 + 0.4], 0.03, 0.03);      // oars
}

// ───── the closes: garden closes, orchard and drying green between the street's east row and Bank Lane, a small yard on the shore wedge ─────
// coordinates are (a, b): a along Bank Lane from its north end, b out to the west of its centre line
let _WCLOSES = null;
function wharfCloses() {
  if (_WCLOSES) return _WCLOSES;
  const C = _WCLOSES = { soil: [], fences: [], hedges: [], beds: [], trees: [], paths: [], poles: [], racks: [], green: null, wedge: null, boats: [] };
  const Ln = typeof WHARF !== 'undefined' && WHARF.lanes && WHARF.lanes.bank; if (!Ln || !INF || !INF.pt) return C;
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0 || TEST.closes === 0)) return C;
  const pt = INF.pt, R = rng(9091), len = Ln.len;
  const LP = (a, b) => { const P = pt(Ln, a), Q = pt(Ln, a + 1), dx = Q[0] - P[0], dz = Q[1] - P[1], l = hyp(dx, dz) || 1, t = [dx / l, dz / l]; return [P[0] - t[1] * b, P[1] + t[0] * b]; };
  const line = (a0, b0, a1, b1, n, w) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n; o.push(LP(a0 + (a1 - a0) * t, b0 + (b1 - b0) * t + (i > 0 && i < n ? (R() - 0.5) * (w || 0) : 0))); } return o; };
  const aG = INF.dist(Ln, 38.5, 49.5)[1];
  const BW = 12.8, bE = 20.5, a0 = 3.5, a1 = len - 5;
  // north closes (fenced) and a south close (fenced) and the orchard (hedged)
  const cuts = [a0, a0 + (aG - 2 - a0) / 2, aG - 2, aG + 2, aG + 10.5, a1];
  const edge = (A0, B0, A1, B1, kind) => { (kind === 'h' ? C.hedges : C.fences).push(line(A0, B0, A1, B1, Math.max(2, Math.round(Math.abs(A1 - A0 + B1 - B0) / 2.6)), kind === 'h' ? 0.5 : 0.25)); };
  for (let i = 0; i < 5; i++) {
    const A0 = cuts[i], A1 = cuts[i + 1]; if (i === 2) continue; const bW = 4.8;
    const orch = i === 4, kind = orch ? 'h' : 'f';
    edge(A0, bE, A1, bE + (R() - 0.5) * 0.6, 'h');
    edge(A0, bW, A0, bE, kind); if (i === 4 || i === 1 || i === 3 || i === 0) edge(A1, bW, A1, bE, kind);
    edge(A0, bW, A1, bW, 'f');
    if (!orch) C.soil.push([LP(A0, bW), LP(A1, bW), LP(A1, bE), LP(A0, bE)]);
    if (!orch) { const nb = Math.floor((bE - bW - 1.6) / 1.5); for (let r = 0; r < nb; r++) { const b = bW + 1.2 + r * 1.5; C.beds.push([LP(A0 + 0.7, b), LP(A1 - 0.7, b + 0.7)]); } }
    else for (let a = A0 + 2.2; a < A1 - 1; a += 6.0) for (let b = bW + 2.4; b < bE - 1.0; b += 5.2) C.trees.push([...LP(a + (R() - 0.5) * 0.8, b + (R() - 0.5) * 0.8), 0.75 + R() * 0.2]);
  }
  for (let a = a0 + 1; a < a1; a += 11) if (Math.abs(a - aG) > 3) C.trees.push([...LP(a + (R() - 0.5), bE + 5.6 + (R() - 0.5) * 1.2), 0.7 + R() * 0.2]);
  // the paths: along the back of the closes, and across to the street's east row by the ginnel
  C.paths.push(line(a0 - 2, bE + 2.4, a1 + 2, bE + 2.4, 8, 0.6));
  const g0 = LP(aG, 5.0), g1 = LP(aG, bE + 2.4), st = [9.6, 49.8];
  C.paths.push([g0, LP(aG, 9), LP(aG, bE), g1, [(g1[0] + st[0]) / 2 + 0.4, (g1[1] + st[1]) / 2 - 0.5], st]);
  // the drying green where the two paths meet: net poles in lines, a rack, a pole for the washing
  { const gx = g1[0] + (st[0] - g1[0]) * 0.45 - 0.5, gz = g1[1] + (st[1] - g1[1]) * 0.45; C.green = { x: gx, z: gz, r: 4.6 };
    for (const sg of [-1, 1]) C.poles.push([gx + sg * 2.8, gz - 2.2, gx + sg * 2.8 + 0.3, gz + 2.4]);
    C.racks.push([gx - 1.5, gz + 3.3, gx + 1.8, gz + 3.0]); }
  // the wedge by the shore, east of the wharf: a net-mending yard with an upturned boat, racks, a hedge on the river side
  { const cx = 31.6, cz = 80.4, c = Math.cos(0.5), sn = Math.sin(0.5), W = (a, b) => [cx + a * c - b * sn, cz + a * sn + b * c]; C.wedge = { x: cx, z: cz };
    C.soil.push([W(-4.4, -3.6), W(4.4, -3.6), W(4.4, 3.6), W(-4.4, 3.6)]); C.hedges.push([W(-5.4, 4.6), W(0, 4.8), W(5.4, 4.4)], [W(5.4, -4), W(5.6, 0), W(5.4, 4.4)]); C.fences.push([W(-5.4, -4.4), W(-5.4, 0), W(-5.2, 4.6)]);
    C.racks.push([...W(-3.5, 2.4), ...W(0.5, 2.6)], [...W(-3.5, -3), ...W(0, -3.1)]); C.boats.push([...W(2.2, -0.4), 0.45]); }
  // the street's east side, where the removed shells stood: garden closes and a small orchard behind a hedge, each a plot of a household that stays, with a path to the street
  if (WHARF.street) { const SL = WHARF.street.L, enter = WHARF.houses.map(h => h[0]).filter(id => INF.byId[id] && INF.byId[id].enter).map(id => SITE[id]).filter(Boolean);
    const LS = (a, b) => { const P = pt(SL, a), Q = pt(SL, a + 1), dx = Q[0] - P[0], dz = Q[1] - P[1], l = hyp(dx, dz) || 1, t = [dx / l, dz / l]; return [P[0] + t[1] * b, P[1] - t[0] * b]; };      // b > 0 out to the east of Wharf Street
    const sA = WHARF.street.s0 + 12, sB = WHARF.street.sEnd - 4; let kk = 0;
    for (let a = sA; a + 8 <= sB; a += 9.5, kk++) {
      const b0 = 3.9, b1 = b0 + 6.6 + (kk % 2) * 1.6, A0 = a, A1 = a + 8.2, cen = LS((A0 + A1) / 2, (b0 + b1) / 2);
      if (enter.some(st => hyp(st.x - cen[0], st.z - cen[1]) < (st.w + st.d) / 4 + 6.2)) continue;
      const ln = (a0, c0, a1, c1, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n; o.push(LS(a0 + (a1 - a0) * t, c0 + (c1 - c0) * t)); } return o; };
      const orch = kk % 3 === 2;
      C.hedges.push(ln(A0, b1, A1, b1, 3)); C.fences.push(ln(A0, b0, A1, b0, 3), ln(A0, b0, A0, b1, 2), ln(A1, b0, A1, b1, 2));
      C.soil.push([LS(A0, b0), LS(A1, b0), LS(A1, b1), LS(A0, b1)]);
      if (orch) { for (const [ta, tb] of [[2.2, 2.4], [5.8, 2.4], [4.0, 5.2]]) C.trees.push([...LS(A0 + ta, b0 + tb), 0.75]); }
      else for (let r = 0; r < 4; r++) { const bb = b0 + 1.0 + r * 1.35; C.beds.push([LS(A0 + 0.7, bb), LS(A1 - 0.7, bb + 0.7)]); }
      C.paths.push([LS(A0 + 4.1, 0.6), LS(A0 + 4.1, b0 + 0.4)]);
    } }
  // the wharf yard's open ground: a boat drawn up, one upturned on trestles, two drying racks, a winch, barrels and pots, rope
  C.racks.push([-9.2, 70.4, -5.4, 70.1], [-17.4, 71.0, -13.8, 71.3]); C.boats.push([-3.6, 73.7, 0.18, 'up0'], [-1.6, 70.4, -0.1, 'trestle']);
  C.winch = [1.9, 74.4]; C.barrels = [[3.1, 72.0], [3.7, 72.6], [3.2, 73.0], [-7.0, 76.4], [-6.4, 77.0]]; C.coil = [[0.4, 75.6], [-6.5, 74.0]];
  // where the landing steps go down to the river from Bank Lane's east side (the first has the wash place); the river bank behind them is nobody's house, it is the lane's own
  C.landStarts = [[9.5, -4.5], [27, -4.5], [40, -4.5]].map(([a, b]) => LP(Math.min(a, len - 3), b));
  // the river side of Bank Lane (no house stands there any more): net poles of the fishing households, boats drawn up, an osier bed for the basketmaker (in.51)
  C.poles.push([...LP(23, -8.8), ...LP(26.4, -8.9)], [...LP(44, -8.4), ...LP(47, -8.5)]);
  C.boats.push([...LP(6.5, -7.2), Math.atan2(...(() => { const a = LP(5, -7.2), b = LP(8, -7.2); return [b[1] - a[1], b[0] - a[0]]; })()), 'up0'], [...LP(41, -8.0), 0.4, 'trestle']);
  C.osier = []; for (let r = 0; r < 4; r++) for (let a = 12; a < 19.5; a += 0.9) C.osier.push([...LP(a + (r % 2) * 0.45, -9.8 - r * 1.15), 0.5 + ((a * 3 + r) % 3) * 0.06]);
  // trees, each by hand with its reason (a few, not a scatter); positions come from named anchors and are dropped if a house, a road or a prop stands there
  C.wtrees = []; {
    const free = (x, z, r) => !SITES.some(st => { if (!st.w || st.id === 'tower') return false; const l = worldToSite(st, x, z); return Math.abs(l[0]) < st.w / 2 + r && Math.abs(l[1]) < st.d / 2 + r; }) && !ROADS.some(rd => { const ln = INF.LN[rd.id] || null; return ln && INF.dist(ln, x, z)[0] < rd.w / 2 + r; });
    const add = (x, z, kind, sc, why) => { if (free(x, z, 2.2)) C.wtrees.push([x, z, kind, sc, why]); };
    // the one old tree the drying green was left round, an oak not yet full grown
    if (C.green) add(C.green.x + 0.3, C.green.z - 0.4, 'oak', 0.5, 'old oak the drying green was left round');
    // alders leaning over the river bank behind the Bank Lane houses, spaced between the landing steps
    if (typeof River !== 'undefined' && River.p) { const want = [[56, 47], [53, 66]]; for (const [wx, wz] of want) { let best = null, bd = 1e9; for (const q of River.p) { const d = hyp(q[0] - wx, q[1] - wz); if (d < bd) { bd = d; best = q; } } if (best) add(best[0] - 5.2, best[1] + 0.5, 'birch', 0.78, 'alder on the river bank'); } }
    // willows on the lake shore west of the wharf yard, where the shingle ends
    for (const x of [-15.5, -12.0]) { const sp = wharfShore(2.2).find(q => Math.abs(q[0] - x) < 1); if (sp) add(sp[0], sp[1], 'birch', 0.85, 'willow leaning over the lake shore'); }
    // an elder grown out of a yard corner of the west lane, and one by the ditch
    C.elders = [[-27.5, 52.8, 'elder grown from a yard corner by the ditch'], [-30.2, 64.4, 'elder in the hedge line']].filter(e => free(e[0], e[1], 1.2));
    // saplings and ivy at fence feet: small bushes every so often along the closes' fences
    C.saplings = []; for (const pl of C.fences) for (let i = 0; i + 1 < pl.length; i += 2) if (((pl[i][0] * 7 + pl[i][1] * 3) | 0) % 3 === 0) C.saplings.push([pl[i][0] + 0.25, pl[i][1] + 0.2, 0.45]);
  }
  // the edge: a hedge and a fence line that bends, west and north; the last yards of the west lane's houses run out to it between cross fences
  { const E = WHARF.edge; if (E) {
      const cat = catmull(E, 1.2);
      for (let i = 0; i + 2 < cat.length; i += 2) { const seg = [cat[i], cat[i + 1], cat[i + 2]]; if (Math.floor(i / 10) % 3 === 1) C.fences.push(seg); else { seg.dense = true; C.hedges.push(seg); } }
      const hitE = (ox, oz, dx, dz) => { let best = null; for (let i = 0; i + 1 < cat.length; i++) { const [ax, az] = cat[i], [bx, bz] = cat[i + 1], ex = bx - ax, ez = bz - az, den = dx * ez - dz * ex; if (Math.abs(den) < 1e-6) continue; const t = ((ax - ox) * ez - (az - oz) * ex) / den, u = ((ax - ox) * dz - (az - oz) * dx) / den; if (t > 0.5 && u >= 0 && u <= 1 && (best === null || t < best)) best = t; } return best; };
      for (const id of (WHARF.rows.w1w || [])) { const st = SITE[id], nx = Math.sin(st.yaw), nz = -Math.cos(st.yaw), bx = -nx, bz = -nz, ux = Math.cos(st.yaw), uz = Math.sin(st.yaw), hw = st.w / 2 + 0.25;
        for (const sg of [-1, 1]) { const ox = st.x + bx * (st.d / 2 + 5.4) + ux * hw * sg, oz = st.z + bz * (st.d / 2 + 5.4) + uz * hw * sg, t = hitE(ox, oz, bx, bz); if (t && t < 22) C.fences.push([[ox, oz], [ox + bx * t, oz + bz * t]]); }
        const ox = st.x + bx * (st.d / 2 + 5.4), oz = st.z + bz * (st.d / 2 + 5.4), t = hitE(ox, oz, bx, bz); if (t && t < 22) C.soil.push([[ox - ux * hw, oz - uz * hw], [ox + ux * hw, oz + uz * hw], [ox + ux * hw + bx * t, oz + uz * hw + bz * t], [ox - ux * hw + bx * t, oz - uz * hw + bz * t]]); }
  } }
  return C;
}
// vegetation asks: keep random trees out of the closes
function wharfBlocked(x, z, pad) { return !!(typeof WHARF !== 'undefined' && WHARF.houses.length && x > 12 - pad && x < 46 + pad && z > 34 - pad && z < 92 + pad); }
function buildWharfCloses(bucket) {
  const C = wharfCloses(); if (!C.fences.length) return;
  let lowSkip = false; { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 46; m.lowDist = 110; return m; }; }      // small dressing lives in cells of its own with a draw distance
  const gy = (x, z) => Terrain.y(x, z), R = rng(4141), h = 1.0;
  const nearHouse = (x, z) => SITES.some(st => { if (!st.w || st.id === 'tower') return false; const l = worldToSite(st, x, z); return Math.abs(l[0]) < st.w / 2 + 1.3 && Math.abs(l[1]) < st.d / 2 + 1.3; });
  World.hedgeBushes = World.hedgeBushes || []; World.orchardTrees = World.orchardTrees || [];
  for (const pl of C.hedges) for (let i = 0; i + 1 < pl.length; i++) { const [ax, az] = pl[i], [bx, bz] = pl[i + 1], L = hyp(bx - ax, bz - az), n = Math.max(1, Math.round(L / (pl.dense ? 2.4 : 3.6))); for (let k = 0; k < n; k++) World.hedgeBushes.push([ax + (bx - ax) * k / n + (R() - 0.5) * 0.2, az + (bz - az) * k / n + (R() - 0.5) * 0.2, 1.45 + R() * 0.3]); }
  for (const t of C.trees) World.orchardTrees.push(t);
  World.wharfTrees = (C.wtrees || []).slice(); for (const q of C.osier || []) World.hedgeBushes.push(q); for (const e of C.elders || []) World.hedgeBushes.push([e[0], e[1], 1.7], [e[0] + 0.7, e[1] + 0.4, 1.4]); for (const q of C.saplings || []) World.hedgeBushes.push(q);
  for (const pl of C.fences) {
    const [mx, mz] = pl[(pl.length / 2) | 0], m = bucket(mx, mz);
    for (let i = 0; i + 1 < pl.length; i++) {
      const [ax, az] = pl[i], [bx, bz] = pl[i + 1], L = hyp(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.6)); m.mat(MAT.TIMBER, [0.27, 0.22, 0.17], 0.5);
      for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n; m.cbox(x, gy(x, z) - 0.1, z, 0.09, h + 0.1 + (R() - 0.5) * 0.25, 0.09, 0); }
      for (const y of [0.38, h - 0.2]) for (let k = 0; k < n; k++) { const x0 = ax + (bx - ax) * k / n, z0 = az + (bz - az) * k / n, x1 = ax + (bx - ax) * (k + 1) / n, z1 = az + (bz - az) * (k + 1) / n; m.beam([x0, gy(x0, z0) + y, z0], [x1, gy(x1, z1) + y + (R() - 0.5) * 0.08, z1], 0.045, 0.04); }
      for (let k = 0; k <= Math.ceil(L / 0.5); k++) { const t = k / Math.ceil(L / 0.5), x = ax + (bx - ax) * t, z = az + (bz - az) * t; if (!nearHouse(x, z) && !World.colliders.some(o => o.r && Math.abs(o.x - x) < 0.32 && Math.abs(o.z - z) < 0.32)) addCircleCollider(m, x, z, 0.14, gy(x, z), gy(x, z) + h); }
    }
  }
  lowSkip = true;
  for (const [p, q] of C.beds) { const cx = (p[0] + q[0]) / 2, cz = (p[1] + q[1]) / 2, m = bucket(cx, cz), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), w = hyp(q[0] - p[0], q[1] - p[1]) / 2; m.mat(MAT.SOIL, [0.34, 0.27, 0.2], 0.5); m.push().T(cx, gy(cx, cz) + 0.04, cz).RY(-ang); m.quad2([-w, 0, -0.32], [w, 0, -0.32], [w, 0, 0.32], [-w, 0, 0.32]); m.pop(); for (let a = -w + 0.3; a < w - 0.2; a += 2.0) (World.wharfPlants = World.wharfPlants || []).push([cx + Math.cos(ang) * a, cz + Math.sin(ang) * a, (a * 7 | 0) & 1]); }
  const post = (m, x, z, hh) => { const g = gy(x, z); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); m.beam([x, g - 0.1, z], [x, g + hh, z], 0.07, 0.07); };
  for (const [x0, z0, x1, z1] of C.poles) { const m = bucket(x0, z0); post(m, x0, z0, 2.3); post(m, x1, z1, 2.3); const g0 = gy(x0, z0); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); m.beam([x0, g0 + 2.2, z0], [x1, g0 + 2.2, z1], 0.045, 0.045);
    wNet(m, [x0, g0 + 2.17, z0], [x1, g0 + 2.17, z1], 1.15, R);
    addCircleCollider(m, x0, z0, 0.12, g0, g0 + 2.2); addCircleCollider(m, x1, z1, 0.12, gy(x1, z1), gy(x1, z1) + 2.2); }
  for (const [x0, z0, x1, z1] of C.racks) { const m = bucket(x0, z0); post(m, x0, z0, 1.5); post(m, x1, z1, 1.5); const g0 = gy(x0, z0); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const y of [1.45, 0.95]) m.beam([x0, g0 + y, z0], [x1, g0 + y, z1], 0.04, 0.04);
    for (let k = 0; k < 8; k++) { const t = (k + 0.5) / 8, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; wFish(m, x, g0 + 1.42, z, x1 - x0, z1 - z0, 0.36 + (k % 3) * 0.04); } addCircleCollider(m, x0, z0, 0.12, g0, g0 + 1.5); addCircleCollider(m, x1, z1, 0.12, gy(x1, z1), gy(x1, z1) + 1.5); }
  for (const [x, z, ang, kind] of C.boats) { const m = bucket(x, z), g = gy(x, z), c = Math.cos(ang), sn = Math.sin(ang), L = kind === 'up0' ? 2.2 : 1.6, up = kind === 'trestle';
    const at = (a, b) => [x + a * c - b * sn, z + a * sn + b * c];
    wharfHull(m, x, z, g + (up ? 0.95 : 0.16), ang, L * 2.05, 0.74, 0.62, up);
    m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5);
    if (up) for (const a of [-0.9, 0.9]) for (const sg of [-1, 1]) { const q = at(a, 0.45 * sg), r = at(a, 0); m.beam([q[0], gy(q[0], q[1]), q[1]], [r[0], g + 0.7, r[1]], 0.05, 0.05); }
    else for (const a of [-0.8, 0.9]) { const q = at(a, -0.9), r = at(a, 0.9); m.beam([q[0], g + 0.06, q[1]], [r[0], g + 0.06, r[1]], 0.07, 0.07); }
    for (const a of [-1, 0, 1]) addCircleCollider(m, ...at(a * 0.9, 0), 0.6, g, g + 0.9); }
  if (C.winch) { const [x, z] = C.winch, m = bucket(x, z), g = gy(x, z); m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); m.cyl(x, g, z, 0.2, 0.17, 1.0, 8, 2); for (const a of [0, Math.PI / 2]) m.beam([x - Math.cos(a) * 0.9, g + 0.85, z - Math.sin(a) * 0.9], [x + Math.cos(a) * 0.9, g + 0.85, z + Math.sin(a) * 0.9], 0.04, 0.04); m.mat(MAT.CLOTH, [0.66, 0.56, 0.40], 0.5); m.cyl(x, g + 0.25, z, 0.26, 0.26, 0.35, 8, 1); addCircleCollider(m, x, z, 0.35, g, g + 1.0); }
  for (const [x, z] of C.barrels || []) { const m = bucket(x, z), g = gy(x, z); m.mat(MAT.PLANKS, [0.44, 0.34, 0.22], 0.5); m.cyl(x, g, z, 0.3, 0.34, 0.8, 6, 2); m.mat(MAT.METAL, [0.18, 0.18, 0.18], 0.5); m.cyl(x, g + 0.2, z, 0.35, 0.35, 0.05, 6, 1); if (!nearHouse(x, z)) addCircleCollider(m, x, z, 0.3, g, g + 0.8); }
  for (const [x, z] of C.coil || []) { const m = bucket(x, z), g = gy(x, z); m.mat(MAT.CLOTH, [0.68, 0.58, 0.40], 0.5); m.cyl(x, g, z, 0.4, 0.4, 0.14, 8, 1); m.cyl(x, g + 0.14, z, 0.3, 0.3, 0.1, 8, 1); }
}

function wharfLow() { return R.qName === 'low'; }

// points along the shore of the lake (inland by `inl` metres) between the west end of the yard and the quay, and a bank strip east
function wharfShore(inl) {
  const o = []; inl = inl || 0;
  for (let x = -16; x <= 5; x += 1.5) { let z = 62; while (z < 96 && Terrain.y(x, z) > -1.42) z += 0.4; o.push([x, z - inl]); }
  return o;
}
// the second ground mask: mud (wet ground) in Wharf Street, trodden lanes a little drier, a wet bank behind Bank Lane's river-side houses, a muddy yard
function wharfSplat2(blob, line, A, B, R) {
  if (typeof WHARF === 'undefined' || !WHARF.houses.length || (TEST && TEST.wharf === 0)) return;
  const S = WHARF.street; if (S) { const pts = S.L.p.filter(q => q[1] > 36); line(A, 1, pts, 3.4, 0.5); line(A, 1, pts, 2.0, 0.35); for (let i = 0; i < pts.length; i += 2) blob(A, 1, pts[i][0] + (R() - 0.5) * 3, pts[i][1] + (R() - 0.5) * 2, 1 + R() * 1.4, 0.8, 0.3); }
  for (const id in WHARF.lanes) { const ln = WHARF.lanes[id]; line(A, 1, ln.p, 1.4, 0.3); for (let d = 2; d < ln.len; d += 3 + R() * 4) { const p = INF.pt(ln, d); blob(A, 1, p[0] + (R() - 0.5), p[1] + (R() - 0.5), 0.7 + R(), 0.6, 0.3); } }
  const bk = WHARF.lanes.bank; if (bk) for (let d = 2; d < bk.len; d += 2.2) { const P = INF.pt(bk, d), Q = INF.pt(bk, d + 1), dx = Q[0] - P[0], dz = Q[1] - P[1], l = hyp(dx, dz) || 1; blob(A, 1, P[0] + dz / l * 9 + (R() - 0.5), P[1] + -dx / l * 9 + (R() - 0.5), 1.4 + R(), 0.7, 0.3); }
  for (const [x, z] of wharfShore(3)) blob(A, 1, x, z, 2.4, 0.7, 0.3);
}

// a boardwalk where it is wet: along the shore of the wharf yard (planks laid across, on low piles), stepping down to the shingle at its ends
function buildWharfBoards(bucket) {
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0) || typeof WHARF === 'undefined' || !WHARF.houses.length) return;
  { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 46; m.lowDist = 110; return m; }; }      // small dressing lives in cells of its own with a draw distance
  const gy = (x, z) => Terrain.y(x, z), R = rng(6262), pts = wharfShore(1.2).filter(q => q[0] < -7).map((q, i, a) => [q[0], [-2, -1, 0, 1, 2].reduce((t, d) => t + a[Math.max(0, Math.min(a.length - 1, i + d))][1], 0) / 5]), m = bucket(pts[4][0], pts[4][1]);
  const w = 0.65;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L = hyp(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux, n = Math.max(1, Math.round(L / 0.26));
    for (let k = 0; k < n; k++) { if (R() < 0.04) continue; const t = (k + 0.5) / n, x = ax + dx * t, z = az + dz * t, y = gy(x, z) + 0.13 + (R() - 0.5) * 0.015, hl = 0.11 + R() * 0.02, wj = w + (R() - 0.5) * 0.12;
      m.mat(MAT.PLANKS, [0.42 + R() * 0.08, 0.37 + R() * 0.06, 0.3], 0.5); m.box(x - ux * hl - nx * wj, y, z - uz * hl - nz * wj, x + ux * hl + nx * wj, y + 0.05, z + uz * hl + nz * wj); }
    m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5); for (const sg of [-1, 1]) { const x = ax + nx * w * 0.8 * sg, z = az + nz * w * 0.8 * sg; m.beam([x, gy(x, z) - 0.1, z], [x, gy(x, z) + 0.12, z], 0.05, 0.05); }
  }
}

// a split fish hung by the tail from a rail: a flat body in two quads and a forked tail, silver gone to brown (nothing living is built from balls)
function wFish(m, x, y, z, ux, uz, len, col) {
  const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul; const L = len || 0.38, w = L * 0.11, P = (a, h) => [x + ux * a, y - h, z + uz * a];
  m.mat(MAT.CLOTH, col || [0.4, 0.4, 0.38], 0.5);
  m.quad2(P(-w * 0.5, 0), P(-w * 0.2, L * 0.2), P(w * 0.2, L * 0.2), P(w * 0.5, 0));
  m.quad2(P(-w * 0.2, L * 0.2), P(-w, L * 0.45), P(w, L * 0.45), P(w * 0.2, L * 0.2));
  m.quad2(P(-w, L * 0.45), P(-w * 0.15, L), P(w * 0.15, L), P(w, L * 0.45));
  m.mat(MAT.CLOTH, [0.22, 0.2, 0.18], 0.5); m.quad2(P(-w * 0.8, -0.1), P(-w * 0.3, 0), P(w * 0.4, 0), P(w * 0.8, -0.1));
}
// a fishing net hung from a line: thin strands and cross cords with open meshes between them (a sheet of cloth read as a board), irregular at the hem, sagging
function wNet(m, A, B, drop, R) {
  const rr = R || (() => 0.5), L = Math.hypot(B[0] - A[0], B[2] - A[2]), n = Math.max(3, Math.ceil(L / 0.13)), pts = [];
  m.mat(MAT.CLOTH, [0.55, 0.5, 0.38], 0.5);
  for (let i = 0; i <= n; i++) { const t = i / n, x = A[0] + (B[0] - A[0]) * t, z = A[2] + (B[2] - A[2]) * t, y0 = A[1] + (B[1] - A[1]) * t, hem = drop * (0.72 + 0.28 * rr()) * (1 - 0.12 * Math.sin(t * Math.PI)), zz = 0.05 * Math.sin(t * 9 + rr());
    pts.push([x, y0, z, hem]); m.beam([x, y0, z], [x + (B[2] - A[2]) / L * zz, y0 - hem, z - (B[0] - A[0]) / L * zz], 0.007, 0.007); }
  for (const f of [0.22, 0.45, 0.68, 0.9]) for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1]; if (a[3] * f > Math.min(a[3], b[3]) * 0.96) continue; m.beam([a[0], a[1] - a[3] * f, a[2]], [b[0], b[1] - b[3] * f, b[2]], 0.006, 0.006); }
}
// a heap of net or a coil of rope: loose folds of cloth lying at different tilts, and a few turns of rope on top
function wNetHeap(m, x, y, z, r, R) {
  const rr = R || (() => 0.5);
  m.mat(MAT.CLOTH, [0.60, 0.54, 0.40], 0.5);
  for (let k = 0; k < 7; k++) { const a = rr() * 6.28, c = Math.cos(a), sn = Math.sin(a), ox = (rr() - 0.5) * r * 0.9, oz = (rr() - 0.5) * r * 0.9, h = y + 0.05 + k * r * 0.1, t = (rr() - 0.5) * 0.35, q = r * (0.55 + rr() * 0.4);
    m.quad2([x + ox - c * q, h, z + oz - sn * q], [x + ox + c * q, h + t, z + oz + sn * q], [x + ox + c * q - sn * q * 0.7, h + 0.06, z + oz + sn * q + c * q * 0.7], [x + ox - c * q - sn * q * 0.7, h + 0.04 + t, z + oz - sn * q + c * q * 0.7]); }
  m.mat(MAT.TIMBER, [0.38, 0.32, 0.22], 0.5);
  for (let k = 0; k < 10; k++) { const a0 = k / 10 * 6.28, a1 = (k + 1) / 10 * 6.28, q = r * 0.42; m.beam([x + Math.cos(a0) * q, y + r * 0.62, z + Math.sin(a0) * q], [x + Math.cos(a1) * q, y + r * 0.62, z + Math.sin(a1) * q], 0.018, 0.018); }
}
// a bundle of twigs or herbs standing from a point: a fan of thin stems
function wTuft(m, x, y, z, h, n, col, R) {
  const rr = R || (() => 0.5); m.mat(MAT.THATCH, col, 0.5);
  for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rr(), t = 0.14 + rr() * 0.16; m.beam([x, y, z], [x + Math.cos(a) * t, y + h * (0.8 + rr() * 0.3), z + Math.sin(a) * t], 0.012, 0.006); }
}
// a clinker rowing boat built as a boat is: a keel, a stem and a sternpost, lapped strakes lofted over 15 stations, ribs and a gunwale, thwarts and a floor; `up` turns it keel to the sky
function wharfHull(m, x, z, y0, ang, len, beam, depth, up) {
  const c = Math.cos(ang), sn = Math.sin(ang), N = 14, S = 5, sg = up ? -1 : 1, st = [];
  const P = (a, b, h) => [x + a * c - b * sn, y0 + sg * h, z + a * sn + b * c];
  for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1, at = Math.abs(t), w = beam * Math.pow(Math.max(0.0, 1 - Math.pow(at, 2.3)), 0.62) + 0.015, sheer = depth * (0.78 + 0.34 * at * at) + 0.05 * at * at * at * at; st.push({ a: t * len / 2, w, sheer, k: 0.06 * (1 - at * at) }); }
  const f = (q, kk, side) => { const u = kk / S, h = q.k + (q.sheer - q.k) * u, wd = q.w * (0.16 + 0.84 * Math.pow(u, 0.8)); return P(q.a, side * wd, h); };
  for (let k = 0; k < S; k++) {
    m.mat(MAT.PLANKS, k % 2 ? [0.32, 0.26, 0.19] : [0.27, 0.22, 0.16], 0.5);
    for (let i = 0; i < N; i++) for (const side of [-1, 1]) {
      const a0 = f(st[i], k, side), a1 = f(st[i + 1], k, side), b1 = f(st[i + 1], k + 1, side), b0 = f(st[i], k + 1, side), lap = 0.012 * sg;
      m.quad2(a0, a1, [b1[0], b1[1], b1[2]], b0);
      m.mat(MAT.TIMBER, [0.2, 0.16, 0.11], 0.5); m.beam([b0[0], b0[1] + lap, b0[2]], [b1[0], b1[1] + lap, b1[2]], 0.012, 0.012); m.mat(MAT.PLANKS, k % 2 ? [0.32, 0.26, 0.19] : [0.27, 0.22, 0.16], 0.5);
    }
  }
  m.mat(MAT.TIMBER, [0.18, 0.14, 0.1], 0.5);
  for (let i = 0; i < N; i++) { m.beam(P(st[i].a, 0, 0), P(st[i + 1].a, 0, 0), 0.035, 0.03); for (const side of [-1, 1]) m.beam(P(st[i].a, side * st[i].w, st[i].sheer), P(st[i + 1].a, side * st[i + 1].w, st[i + 1].sheer), 0.025, 0.018); }
  const e0 = st[0], e1 = st[N];
  m.beam(P(e0.a, 0, 0.0), P(e0.a - 0.05, 0, e0.sheer + 0.18), 0.03, 0.025); m.beam(P(e1.a, 0, 0.0), P(e1.a + 0.05, 0, e1.sheer + 0.16), 0.03, 0.025);
  for (let i = 1; i < N; i += 2) { const q = st[i]; for (const side of [-1, 1]) m.beam(P(q.a, side * q.w * 0.18, q.k + 0.02), P(q.a, side * q.w * 0.97, q.sheer * 0.96), 0.014, 0.01); }
  if (!up) {
    for (const t of [-0.45, 0.02, 0.48]) { const q = st[Math.round((t + 1) / 2 * N)]; m.beam(P(q.a, -q.w * 0.98, q.sheer * 0.8), P(q.a, q.w * 0.98, q.sheer * 0.8), 0.05, 0.016); }
    m.mat(MAT.PLANKS, [0.36, 0.3, 0.22], 0.5); for (let i = 3; i < N - 2; i += 2) { const q = st[i], q2 = st[i + 1]; m.quad2(P(q.a, -q.w * 0.12, q.k + 0.03), P(q2.a, -q2.w * 0.12, q2.k + 0.03), P(q2.a, q2.w * 0.12, q2.k + 0.03), P(q.a, q.w * 0.12, q.k + 0.03)); }
  }
}

// landing steps down to the river behind the Bank Lane houses on its east side, and a wash place (a stone slab, a board, tubs, a pole of washing) behind the first of them
function buildWharfLandings(bucket) {
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0) || typeof WHARF === 'undefined' || !WHARF.houses.length || typeof River === 'undefined' || !River.p) return;
  { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = 46; m.lowDist = 110; return m; }; }
  const gy = (x, z) => Terrain.y(x, z), R = rng(8080);
  const near = (x, z) => { let best = null, bd = 1e9; for (const q of River.p) { const d = hyp(q[0] - x, q[1] - z); if (d < bd) { bd = d; best = q; } } return [best, bd]; };
  let k = 0;
  for (const [sx, sz] of wharfCloses().landStarts || []) {
    const nx = 0, nz = 0;
    const [rq, rd] = near(sx, sz); if (!rq || rd > 28) continue;
    let dx = rq[0] - sx, dz = rq[1] - sz; const dl = hyp(dx, dz); dx /= dl; dz /= dl;
    // walk toward the river until the ground is at the water (or 9 m)
    let t = 1.2, y0 = gy(sx, sz); while (t < 14 && gy(sx + dx * t, sz + dz * t) > -1.4 && near(sx + dx * t, sz + dz * t)[1] > 3.2) t += 0.4;
    const ex = sx + dx * t, ez = sz + dz * t, m = bucket(ex, ez), nstep = 4;
    const ux = -dz, uz = dx;
    m.mat(MAT.STONE, [0.34, 0.32, 0.29], 0.5);
    for (let i = 0; i < nstep; i++) { const px = ex - dx * (nstep - i) * 0.42, pz = ez - dz * (nstep - i) * 0.42, top = gy(ex, ez) + 0.12 + (nstep - 1 - i) * 0.16 + (k === 0 ? 0 : 0);
      m.push().T(px, 0, pz).RY(-Math.atan2(dz, dx)); m.box(-0.2, top - 0.5, -0.7, 0.2, top, 0.7); m.pop(); }
    m.mat(MAT.TIMBER, [0.24, 0.19, 0.14], 0.5); for (const s2 of [-1, 1]) { const px = ex - dx * 0.6 + ux * 0.8 * s2, pz = ez - dz * 0.6 + uz * 0.8 * s2; m.beam([px, gy(px, pz) - 0.1, pz], [px, gy(px, pz) + 0.9, pz], 0.05, 0.05); }
    if (k === 0) {   // the wash place beside the steps
      const wx = ex - dx * 2.4 - ux * 2.0, wz = ez - dz * 2.4 - uz * 2.0, g = gy(wx, wz), a = Math.atan2(dz, dx);
      m.mat(MAT.STONE, [0.38, 0.36, 0.32], 0.5); m.push().T(wx, g + 0.04, wz).RY(-a); m.box(-1.1, 0, -0.8, 1.1, 0.08, 0.8); m.pop();
      m.mat(MAT.PLANKS, [0.4, 0.33, 0.24], 0.5); m.push().T(wx + dx * 0.5, g + 0.1, wz + dz * 0.5).RY(-a); m.box(-0.05, 0, -0.5, 0.45, 0.3, 0.5); m.pop();
      for (const [ox, oz] of [[-0.6, 0.4], [-0.5, -0.5]]) { const tx = wx + ux * oz + dx * ox, tz = wz + uz * oz + dz * ox; m.mat(MAT.PLANKS, [0.44, 0.34, 0.22], 0.5); m.cyl(tx, g + 0.05, tz, 0.3, 0.28, 0.4, 7, 1); }
      const p0 = [wx - dx * 1.5 + ux * 1.3, wz - dz * 1.5 + uz * 1.3], p1 = [p0[0] - ux * 2.6, p0[1] - uz * 2.6];
      m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const q of [p0, p1]) m.beam([q[0], gy(q[0], q[1]) - 0.1, q[1]], [q[0], gy(q[0], q[1]) + 1.9, q[1]], 0.05, 0.05); const gg = gy(p0[0], p0[1]); m.beam([p0[0], gg + 1.85, p0[1]], [p1[0], gg + 1.85, p1[1]], 0.04, 0.04);
      m.mat(MAT.CLOTH, [0.80, 0.76, 0.64], 0.5); for (let i = 0; i < 3; i++) { const t0 = 0.12 + i * 0.3, q0 = [p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0], q1 = [p0[0] + (p1[0] - p0[0]) * (t0 + 0.2), p0[1] + (p1[1] - p0[1]) * (t0 + 0.2)]; m.quad2([q0[0], gg + 1.82, q0[1]], [q1[0], gg + 1.82, q1[1]], [q1[0], gg + 0.9 + R() * 0.2, q1[1]], [q0[0], gg + 0.9 + R() * 0.2, q0[1]]); }
    }
    k++;
  }
}

// ───── the working buildings of the quarter: not houses, nobody sleeps in them; each stands open so what is inside can be seen, and each belongs to a household that stands next to it ─────
// kind: 'smoke' (walled on three sides, hams on racks over a hearth), 'loft' (open frame, a plank deck above with nets, a hoist), 'fish' (roof on posts, drying rails with fish), 'nets' (roof on posts, nets hung to dry)
// ang: direction of the shed's width axis; the front (open) side is local +z
function wharfWorks() {
  if (typeof WHARF === 'undefined' || !WHARF.houses.length || (TEST && TEST.wharf === 0)) return [];
  const bk = WHARF.lanes && WHARF.lanes.bank, o = [];
  o.push({ id: 'smokehouse', kind: 'smoke', x: 12.3, z: 71.6, ang: Math.PI / 2, w: 3.4, d: 3.0, h: 2.5, owner: 'in.111 (the butcher smokes hams and bacon)' });        // front to the west, toward the street
  o.push({ id: 'netloft', kind: 'loft', x: -9.6, z: 73.8, ang: 0, w: 3.6, d: 3.4, h: 4.1, owner: 'in.38 and in.34 (the fishing households keep their nets up there)' });       // front to the south, onto the yard
  if (bk) for (const [a, kind, who] of [[17.5, 'fish', 'in.60 (fish dried on the bank)'], [34.5, 'nets', 'in.34 (nets hung to dry)']]) { const P = INF.pt(bk, a), Q = INF.pt(bk, a + 1), dx = Q[0] - P[0], dz = Q[1] - P[1], l = hyp(dx, dz) || 1, tx = dx / l, tz = dz / l; o.push({ id: 'shed.' + kind + a, kind, x: P[0] + tz * 5.6, z: P[1] - tx * 5.6, ang: Math.atan2(tz, tx) * 1 + 0, w: 5.0, d: 2.6, h: 2.3, owner: who, faceLane: true }); }
  return o;
}
function buildWharfWorks(bucket) {
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0) || typeof WHARF === 'undefined' || !WHARF.houses.length) return;
  { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = wharfLow() ? 60 : 130; return m; }; }
  const gy = (x, z) => Terrain.y(x, z), R = rng(1717);
  for (const S of wharfWorks()) {
    const { x, z, w, d, h } = S, ang = S.ang, c = Math.cos(ang), sn = Math.sin(ang), g = gy(x, z), m = bucket(x, z), W = (a, b) => [x + a * c - b * sn, z + a * sn + b * c];
    const hw = w / 2, hd = d / 2, rear = S.kind === 'loft' ? h + 0.3 : h + 0.45, front = h;
    const post = (a, b, hh) => { m.mat(MAT.TIMBER, [0.3, 0.24, 0.17], 0.5); m.push().T(x, 0, z).RY(-ang); m.box(a - 0.1, g - 0.15, b - 0.1, a + 0.1, g + hh, b + 0.1); m.pop(); const q = W(a, b); addCircleCollider(m, q[0], q[1], 0.16, g, g + hh); };
    const L = (fn) => { m.push().T(x, 0, z).RY(-ang); fn(); m.pop(); };
    post(-hw, -hd, rear); post(hw, -hd, rear); post(-hw, hd, front); post(hw, hd, front);
    if (S.kind === 'loft') { post(0, -hd, rear); post(0, hd, front); }
    // the roof: a mono-pitch with thickness (top, closed edges, boards under it)
    { const T = [[-hw - 0.45, rear + 0.1, -hd - 0.4], [hw + 0.45, rear + 0.1, -hd - 0.4], [hw + 0.45, front + 0.1, hd + 0.5], [-hw - 0.45, front + 0.1, hd + 0.5]], Bm = T.map(q => [q[0], q[1] - 0.18, q[2]]);
      m.mat(S.kind === 'smoke' || S.kind === 'loft' ? MAT.SHINGLE : MAT.THATCH, S.kind === 'smoke' ? [0.4, 0.36, 0.32] : [0.42, 0.36, 0.22], 0.5);
      L(() => { m.quad2(T[0], T[1], T[2], T[3]); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; m.quad2(T[i], T[j], Bm[j], Bm[i]); } m.mat(MAT.PLANKS, [0.34, 0.27, 0.19], 0.5); m.quad2(Bm[3], Bm[2], Bm[1], Bm[0]); }); }
    // rails / ties between the posts
    m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5);
    L(() => { for (const [a0, b0, a1, b1, y] of [[-hw, -hd, hw, -hd, rear - 0.3], [-hw, hd, hw, hd, front - 0.3], [-hw, -hd, -hw, hd, (rear + front) / 2 - 0.3], [hw, -hd, hw, hd, (rear + front) / 2 - 0.3]]) m.box(Math.min(a0, a1) - 0.07, g + y - 0.05, Math.min(b0, b1) - 0.07, Math.max(a0, a1) + 0.07, g + y + 0.07, Math.max(b0, b1) + 0.07); });
    const wall = (a0, b0, a1, b1, y1) => L(() => { m.mat(MAT.PLANKS, [0.36, 0.29, 0.21], 0.5); const t = 0.05; m.box(Math.min(a0, a1) - t, g, Math.min(b0, b1) - t, Math.max(a0, a1) + t, g + y1, Math.max(b0, b1) + t); });
    if (S.kind === 'smoke') {
      wall(-hw, -hd, hw, -hd, rear - 0.3); wall(-hw, -hd, -hw, hd, (rear + front) / 2 - 0.3); wall(hw, -hd, hw, hd, (rear + front) / 2 - 0.3);       // three closed walls, thick, finished at the corners
      L(() => { m.mat(MAT.STONE, [0.3, 0.28, 0.25], 0.5); m.box(-0.7, g, -0.5, 0.7, g + 0.22, 0.5); m.mat(MAT.PLAIN, [0.1, 0.08, 0.07]); m.box(-0.5, g + 0.2, -0.3, 0.5, g + 0.24, 0.3);
        m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const y of [1.55, 1.95]) m.box(-hw + 0.2, g + y, -0.55, hw - 0.2, g + y + 0.06, -0.49); m.mat(MAT.LEATHER || MAT.CLOTH, [0.60, 0.32, 0.20], 0.5);
        for (let i = 0; i < 7; i++) { const a = -hw + 0.5 + i * (w - 1.0) / 6; const hy = g + 1.5 + (i % 2) * 0.4; m.mat(MAT.TIMBER, [0.3, 0.26, 0.2], 0.5); m.beam([a, hy + 0.5, -0.52], [a, hy + 0.22, -0.52], 0.008, 0.008); m.mat(MAT.LEATHER || MAT.CLOTH, [0.3 + (i % 3) * 0.03, 0.17, 0.1], 0.5); m.cyl(a, hy - 0.2, -0.52, 0.045, 0.13, 0.42, 7, 2); m.cyl(a, hy - 0.3, -0.52, 0.13, 0.04, 0.12, 7, 1); m.cyl(a, hy + 0.2, -0.52, 0.03, 0.045, 0.1, 6, 1); } });
      World.emitters.push({ type: 'smoke', p: [x, g + rear + 0.35, z], zone: 0 });
    } else if (S.kind === 'loft') {
      L(() => { m.mat(MAT.PLANKS, [0.38, 0.3, 0.21], 0.5); m.box(-hw, g + 2.25, -hd, hw, g + 2.4, hd);                                  // the deck: a real floor with thickness
        m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (let i = -1; i <= 1; i++) m.box(-hw, g + 2.05, i * hd * 0.8 - 0.05, hw, g + 2.25, i * hd * 0.8 + 0.05);       // joists
        m.mat(MAT.CLOTH, [0.60, 0.54, 0.40], 0.5); wNetHeap(m, -0.8, g + 2.4, -0.6, 0.8, R); wNetHeap(m, 0.9, g + 2.4, -0.2, 0.65, R);       // heaped nets up there
        m.mat(MAT.TIMBER, [0.3, 0.24, 0.17], 0.5); m.box(-0.06, g + 3.6, hd, 0.06, g + 3.7, hd + 1.2); m.box(-0.02, g + 2.3, hd + 1.1, 0.02, g + 3.6, hd + 1.14);        // the hoist beam and its rope
        for (let i = 0; i < 6; i++) m.box(hw - 0.15 + 0.0, g + 0.3 + i * 0.35, hd - 0.5, hw - 0.05, g + 0.36 + i * 0.35, hd - 0.1);      // ladder rungs against the post
        m.mat(MAT.CLOTH, [0.56, 0.50, 0.38], 0.5); for (let i = 0; i < 3; i++) wNet(m, [-hw + 0.5 + i * 1.1, g + 2.1, -hd + 0.1], [-hw + 1.3 + i * 1.1, g + 2.1, -hd + 0.1], 1.3, R); });       // nets hung under the deck
    } else if (S.kind === 'fish') {
      L(() => { m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); for (const y of [1.25, 1.65]) m.box(-hw + 0.1, g + y, -0.15, hw - 0.1, g + y + 0.05, -0.1);
        for (let i = 0; i < 12; i++) { const a = -hw + 0.4 + i * (w - 0.8) / 11; wFish(m, a, g + 1.62 - (i % 2) * 0.4, -0.12, 1, 0, 0.36 + (i % 3) * 0.04); }
        m.mat(MAT.PLANKS, [0.42, 0.33, 0.22], 0.5); m.cyl(hw - 0.6, g, hd - 0.5, 0.3, 0.27, 0.45, 7, 1); });
    } else if (S.kind === 'nets') {
      L(() => { m.mat(MAT.TIMBER, [0.28, 0.22, 0.16], 0.5); m.box(-hw + 0.1, g + 1.9, -0.1, hw - 0.1, g + 1.96, -0.04); m.mat(MAT.CLOTH, [0.56, 0.50, 0.38], 0.5);
        for (let i = 0; i < 3; i++) { const a0 = -hw + 0.3 + i * 1.5, a1 = a0 + 1.3; wNet(m, [a0, g + 1.9, -0.07], [a1, g + 1.9, -0.07], 1.35, R); }
        m.mat(MAT.PLAIN, [0.55, 0.5, 0.38]); for (let i = 0; i < 6; i++) m.cyl(-hw + 0.5 + i * 0.35, g, hd - 0.5, 0.08, 0.08, 0.1, 6, 1); });      // floats in a row
    }
  }
}

// [fx3] The Wharfside houses, finished one by one from docs/PEOPLE.md: a plinth (stone or tar), corner posts and a wall plate that can be seen, a front wall that differs from its neighbours
// (limewash, tar, a patched panel or battens), a hood or a bench or a lantern at the door, the trade's things on the ground beside it and a trodden path to the lane. Everything is drawn in the
// house's own frame (x right, z back, the front wall at -d/2), so a house that is removed or moved takes its dressing with it. Small boxes only: about 700 triangles a house.
const WHOUSE = {
  'in.111': { tone: [0.16, 0.13, 0.11], plinth: 'tar', posts: [0.2, 0.15, 0.1], panel: 'none', hood: 1, trade: 'butcher' },
  'in.113': { tone: [0.5, 0.48, 0.44], plinth: 'stone', posts: [0.26, 0.2, 0.14], panel: 'none', hood: 0, trade: 'boatwright' },
  'in.115': { tone: [0.46, 0.44, 0.4], plinth: 'stone', posts: [0.3, 0.22, 0.15], panel: 'none', hood: 1, trade: 'brewer' },
  'in.20': { tone: [0.13, 0.11, 0.09], plinth: 'tar', posts: [0.12, 0.1, 0.08], panel: 'none', hood: 0, trade: 'chandler' },
  'in.23': { tone: [0.42, 0.4, 0.37], plinth: 'stone', posts: [0.22, 0.18, 0.14], panel: 'none', hood: 0, trade: 'locked' },
  'in.34': { tone: [0.15, 0.13, 0.1], plinth: 'tar', posts: [0.32, 0.25, 0.17], panel: 'none', hood: 0, trade: 'herbs' },
  'in.36': { tone: [0.55, 0.53, 0.5], plinth: 'stone', posts: [0.34, 0.28, 0.2], panel: 'none', hood: 1, trade: 'mason' },
  'in.37': { tone: [0.14, 0.12, 0.1], plinth: 'tar', posts: [0.22, 0.17, 0.12], panel: 'none', hood: 1, trade: 'cutler' },
  'in.38': { tone: [0.18, 0.15, 0.12], plinth: 'tar', posts: [0.28, 0.2, 0.13], panel: 'none', hood: 0, trade: 'boatman' },
  'in.51': { tone: [0.44, 0.4, 0.34], plinth: 'stone', posts: [0.36, 0.3, 0.2], panel: 'none', hood: 0, trade: 'basket' },
  'in.60': { tone: [0.15, 0.13, 0.11], plinth: 'tar', posts: [0.24, 0.19, 0.14], panel: 'none', hood: 0, trade: 'nets' }
};
function buildWharfHouses(bucket) {
  if (TEST && (TEST.wharf === 0 || TEST.plots === 0 || TEST.wharfh === 0)) return;
  { const raw = bucket; bucket = (x, z) => { const m = raw(2e6 + Math.floor(x / 44) * 80, Math.floor(z / 44) * 80); m.maxDist = Math.max(m.maxDist || 0, 55); return m; }; }
  for (const s of SITES) {
    const sp = WHOUSE[s.id]; if (!sp || !s.w) continue;
    const R = rng(idSeed('wh' + s.id)), w = s.w, d = s.d, up = KIT_STYLE[s.id] && KIT_STYLE[s.id].up, eave = up ? 6 : 3, dp = s.doorPos !== undefined ? s.doorPos : 0.9, g0 = Terrain.y(s.x, s.z), m = bucket(s.x, s.z);
    const wy = (lx, lz) => { const q = siteToWorld(s, lx, lz); return Terrain.y(q[0], q[1]) - g0; };
    const fz = -d / 2, os = dp > 0 ? -1 : 1, xo = os * w * 0.27;
    m.push().T(s.x, g0, s.z).RY(-s.yaw);
    const bx = (x0, y0, z0, x1, y1, z1, mat, col) => { m.mat(mat, col, 0.5); m.box(x0, y0, z0, x1, y1, z1); };      // closed boxes: no open edge anywhere (test/geom.js)
    const col = (lx, lz, r, h) => addCircleCollider(m, lx, lz, r, wy(lx, lz) - 0.2, wy(lx, lz) - 0.2 + h + 0.2);
    // the plinth: stone courses or a tarred sill, round the front and both sides
    const pc = sp.plinth === 'tar' ? [0.1, 0.09, 0.08] : sp.tone, pm = sp.plinth === 'tar' ? MAT.PLAIN : MAT.STONE;
    for (let i = 0; i < 6; i++) { const a = -w / 2 + w * i / 6, b = -w / 2 + w * (i + 1) / 6; bx(a - 0.01, -0.35 + wy((a + b) / 2, fz), fz - 0.07, b + 0.01, 0.42 + wy((a + b) / 2, fz) * 0.5, fz + 0.04, pm, [pc[0] * (0.92 + R() * 0.16), pc[1], pc[2]]); }
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const a = -d / 2 + d * i / 4, b = -d / 2 + d * (i + 1) / 4, h = wy(sx * w / 2, (a + b) / 2); bx(sx * w / 2 - 0.07, -0.35 + h, a - 0.01, sx * w / 2 + 0.07, 0.42 + h * 0.5, b + 0.01, pm, pc); }
    // corner posts and the wall plate under the eaves
    const pcl = sp.posts; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const h = wy(sx * w / 2, sz * d / 2); bx(sx * w / 2 - 0.1 - (sx < 0 ? 0.02 : -0.02) * 0, h - 0.3, sz * d / 2 - 0.1, sx * w / 2 + 0.1, eave - 0.08, sz * d / 2 + 0.1, MAT.TIMBER, pcl, 4); }
    bx(-w / 2 - 0.08, eave - 0.3, fz - 0.1, w / 2 + 0.08, eave - 0.14, fz + 0.04, MAT.TIMBER, [pcl[0] * 0.85, pcl[1] * 0.85, pcl[2] * 0.85]); bx(-w / 2 - 0.08, eave - 0.3, d / 2 - 0.04, w / 2 + 0.08, eave - 0.14, d / 2 + 0.1, MAT.TIMBER, [pcl[0] * 0.85, pcl[1] * 0.85, pcl[2] * 0.85]);
    if (up) bx(-w / 2 - 0.08, 3 - 0.1, fz - 0.07, w / 2 + 0.08, 3 + 0.05, fz + 0.04, MAT.TIMBER, [pcl[0] * 0.9, pcl[1] * 0.9, pcl[2] * 0.9]);
    // the front wall's own treatment
    const pz = fz - 0.025;
    if (sp.panel === 'lime') { for (let k = 0; k < 2; k++) { const lx = xo + (k ? 0.9 : -0.6) * os, h = 1.4 + R() * 0.8, y0 = 0.4 + R() * 0.5; bx(lx - 0.7, y0 + wy(lx, fz), pz, lx + 0.7, y0 + h, fz, MAT.PLAIN, [0.62, 0.6, 0.54], 4); } }
    else if (sp.panel === 'tar') bx(-w / 2 + 0.15, 0.4 + wy(0, fz), pz, w / 2 - 0.15, 1.15, fz, MAT.PLAIN, [0.07, 0.065, 0.06], 4);
    else if (sp.panel === 'patch') { const lx = xo + os * 0.3; bx(lx - 0.5, 0.9 + wy(lx, fz), pz, lx + 0.5, 2.0, fz, MAT.PLANKS, [0.45, 0.36, 0.26], 4); for (let k = 0; k < 4; k++) bx(lx - 0.5 + k * 0.25, 0.9 + wy(lx, fz), pz - 0.01, lx - 0.46 + k * 0.25, 2.0, fz, MAT.TIMBER, [0.2, 0.15, 0.1], 4); }
    else if (sp.panel === 'batten') { for (let lx = -w / 2 + 0.6; lx < w / 2 - 0.4; lx += 0.6) if (Math.abs(lx - dp) > 0.9) bx(lx - 0.03, 0.45 + wy(lx, fz), pz, lx + 0.03, eave - 0.45, fz, MAT.TIMBER, [0.26, 0.2, 0.14], 4); }
    // the door: a latch, a threshold stone and, on some, a pent hood on two brackets or a bench beside it
    bx(dp - 0.62, -0.1 + wy(dp, fz - 0.3), fz - 0.62, dp + 0.62, 0.1 + wy(dp, fz - 0.3), fz - 0.04, MAT.STONE, [0.5, 0.48, 0.44]);
    bx(dp + os * 0.38, 1.0, fz - 0.06, dp + os * 0.46, 1.12, fz - 0.01, MAT.METAL, [0.1, 0.1, 0.1]);
    if (sp.hood) { const y = 2.35; for (const sx of [-1, 1]) m.mat(MAT.TIMBER, [0.2, 0.15, 0.1], 0.5), m.beam([dp + sx * 0.75, y - 0.5, fz - 0.02], [dp + sx * 0.75, y, fz - 0.6], 0.07, 0.07); bx(dp - 0.9, y, fz - 0.75, dp + 0.9, y + 0.07, fz, MAT.PLANKS, [0.3, 0.24, 0.17]); bx(dp - 0.9, y + 0.07, fz - 0.78, dp + 0.9, y + 0.1, fz - 0.7, MAT.TIMBER, [0.18, 0.14, 0.1]); }
    else if (R() < 0.7) { const lx = dp + os * 1.3; bx(lx - 0.6, 0.42 + wy(lx, fz), fz - 0.4, lx + 0.6, 0.5 + wy(lx, fz), fz - 0.08, MAT.PLANKS, [0.34, 0.27, 0.2]); for (const sx of [-1, 1]) bx(lx + sx * 0.5 - 0.04, wy(lx, fz), fz - 0.36, lx + sx * 0.5 + 0.04, 0.42 + wy(lx, fz), fz - 0.12, MAT.TIMBER, [0.2, 0.15, 0.1]); }
    // the path: a trodden strip from the door to the lane
    m.mat(MAT.MUD, [0.2, 0.15, 0.1], 0.5); { const y = wy(dp, fz - 1.5) + 0.03, sw = R() * 0.5 - 0.25; m.quad2([dp - 0.55, y, fz - 0.05], [dp - 0.7 + sw, y, fz - 3.2], [dp + 0.7 + sw, y, fz - 3.2], [dp + 0.55, y, fz - 0.05]); }
    // the trade
    const at = (lx, lz) => wy(lx, lz), T = sp.trade, sx0 = xo, sz0 = fz - 0.6;
    if (T === 'butcher') { bx(sx0 - 0.5, 0.0, fz - 1.0, sx0 + 0.5, 0.6, fz - 0.4, MAT.TIMBER, [0.3, 0.2, 0.14]); m.mat(MAT.PLANKS, [0.55, 0.45, 0.35], 0.5); m.cyl(sx0 + os * 1.1, at(sx0, sz0), sz0, 0.3, 0.28, 0.6, 7, 2); bx(sx0 - 1.3, 2.25, fz - 0.9, sx0 + 1.3, 2.32, fz, MAT.PLANKS, [0.3, 0.24, 0.17]); for (let k = 0; k < 4; k++) { const hx = sx0 - 0.9 + k * 0.6; m.mat(MAT.TIMBER, [0.2, 0.15, 0.1], 0.5); m.beam([hx, 2.25, fz - 0.45], [hx, 1.95, fz - 0.45], 0.01, 0.01); m.mat(MAT.PLAIN, [0.24, 0.12, 0.09], 0.5); m.cyl(hx, 1.45, fz - 0.45, 0.04, 0.12, 0.5, 7, 2); m.cyl(hx, 1.33, fz - 0.45, 0.12, 0.035, 0.14, 7, 1); m.cyl(hx, 1.95, fz - 0.45, 0.03, 0.04, 0.1, 6, 1); } col(sx0, fz - 0.7, 0.5, 0.6); }
    else if (T === 'boatwright') { const y0 = wy(w / 2 + 3, 0); for (const k of [-1, 1]) bx(w / 2 + 2.2, 0, k * 1.1 - 0.12, w / 2 + 2.4, 0.5 + y0 * 0, k * 1.1 + 0.12, MAT.TIMBER, [0.25, 0.19, 0.13]); m.push().T(w / 2 + 2.3, 0.5 + wy(w / 2 + 2.3, 0), 0); wharfHull(m, 0, 0, 0, Math.PI / 2, 3.6, 0.8, 0.5, true); m.pop(); for (let k = 0; k < 4; k++) bx(-w / 2 - 1.5, k * 0.07, -1.0, -w / 2 - 0.3, 0.07 + k * 0.07, -0.5, MAT.PLANKS, [0.45 - k * 0.02, 0.36, 0.26]); col(w / 2 + 2.3, 0, 1.2, 1.0); }
    else if (T === 'brewer') { m.mat(MAT.TIMBER, [0.3, 0.22, 0.14], 0.5); m.beam([dp + os * 1.6, wy(dp, fz), fz - 0.9], [dp + os * 1.6, 3.2, fz - 0.9], 0.07, 0.07); wTuft(m, dp + os * 1.6, 3.0 + wy(dp, fz), fz - 0.9, 0.5, 14, [0.2, 0.3, 0.12], R); for (let k = 0; k < 3; k++) { m.mat(MAT.PLANKS, [0.4, 0.3, 0.2], 0.5); m.cyl(xo + (k % 2) * 0.62 * os - 0.1 * os, at(xo, sz0), fz - 0.55 - (k >> 1) * 0.1, 0.3, 0.28, 0.65, 8, 2); } col(xo, fz - 0.55, 0.65, 0.7); }
    else if (T === 'chandler') { for (let k = 0; k < 3; k++) { m.mat(MAT.PLAIN, [0.34 - k * 0.04, 0.28, 0.2], 0.5); m.cyl(xo + k * 0.5 * os, at(xo, sz0), fz - 0.55, 0.28, 0.26, 0.12 + k * 0.05, 9, 2); } m.mat(MAT.PLANKS, [0.12, 0.1, 0.08], 0.5); m.cyl(xo - 0.8 * os, at(xo, sz0), fz - 0.6, 0.3, 0.28, 0.7, 8, 2); bx(dp + os * 1.7, 2.1, fz - 0.55, dp + os * 2.4, 2.9, fz - 0.5, MAT.PLANKS, [0.36, 0.3, 0.22]); m.mat(MAT.TIMBER, [0.2, 0.15, 0.1], 0.5); m.beam([dp + os * 1.5, 2.9, fz - 0.02], [dp + os * 1.5, 2.9, fz - 0.6], 0.05, 0.05); col(xo - 0.8 * os, fz - 0.6, 0.35, 0.7); }
    else if (T === 'locked') { for (const k of [0, 1]) bx(dp - 0.6, 0.5 + k * 1.0, fz - 0.07, dp + 0.6, 0.62 + k * 1.0, fz - 0.03, MAT.PLANKS, [0.26, 0.2, 0.14]); m.beam([dp - 0.55, 0.4, fz - 0.07], [dp + 0.55, 1.9, fz - 0.07], 0.12, 0.03); m.mat(MAT.PLANKS, [0.32, 0.25, 0.18], 0.5); m.cyl(dp + os * 1.1, at(dp, fz), fz - 0.4, 0.2, 0.18, 0.3, 7, 1); }
    else if (T === 'herbs') { for (let k = 0; k < 3; k++) { m.mat(MAT.PLAIN, [0.5, 0.3, 0.2], 0.5); m.cyl(xo + (k - 1) * 0.35 * os, at(xo, sz0) + 0.42, fz - 0.34, 0.1, 0.08, 0.14, 7, 2); wTuft(m, xo + (k - 1) * 0.35 * os, 0.54 + at(xo, sz0), fz - 0.34, 0.26, 9, [0.16, 0.28, 0.1], R); } bx(xo - 0.7, 0.4 + at(xo, fz), fz - 0.45, xo + 0.7, 0.46 + at(xo, fz), fz - 0.2, MAT.PLANKS, [0.32, 0.25, 0.18]); for (let k = 0; k < 4; k++) { m.mat(MAT.THATCH, [0.3, 0.32, 0.14], 0.5); m.beam([dp + os * 0.9 + k * 0.18 * os, 2.15, fz - 0.05], [dp + os * 0.9 + k * 0.18 * os, 1.95, fz - 0.05], 0.05, 0.05); } }
    else if (T === 'mason') { for (let k = 0; k < 5; k++) bx(xo - 0.6 + (k % 3) * 0.55, (k / 3 | 0) * 0.34, fz - 1.1 + (k % 2) * 0.1, xo - 0.1 + (k % 3) * 0.55, 0.34 + (k / 3 | 0) * 0.34, fz - 0.55, MAT.STONE, [0.5 - k * 0.02, 0.48, 0.44]); bx(xo + os * 1.3 - 0.35, 0, fz - 1.0, xo + os * 1.3 + 0.35, 1.0, fz - 0.88, MAT.STONE, [0.56, 0.54, 0.5]); bx(xo + os * 1.3 - 0.3, 1.0, fz - 1.0, xo + os * 1.3 + 0.3, 1.2, fz - 0.88, MAT.STONE, [0.5, 0.48, 0.44]); col(xo, fz - 0.8, 0.8, 0.7); }
    else if (T === 'cutler') { bx(dp + os * 1.2 - 0.5, 0, fz - 0.7, dp + os * 1.2 + 0.5, 0.06, fz - 0.4, MAT.TIMBER, [0.22, 0.17, 0.12]); for (const k of [-1, 1]) bx(dp + os * 1.2 + k * 0.4 - 0.04, 0, fz - 0.62, dp + os * 1.2 + k * 0.4 + 0.04, 0.95, fz - 0.5, MAT.TIMBER, [0.22, 0.17, 0.12]); m.push().T(dp + os * 1.2, 0.8 + wy(dp, fz), fz - 0.56).RZ(Math.PI / 2); m.mat(MAT.STONE, [0.46, 0.44, 0.4], 0.5); m.cyl(0, -0.05, 0, 0.32, 0.32, 0.1, 12, 2); m.pop(); col(dp + os * 1.2, fz - 0.56, 0.5, 1.0); }
    else if (T === 'boatman') { for (let k = 0; k < 3; k++) { m.mat(MAT.TIMBER, [0.4, 0.32, 0.22], 0.5); m.beam([dp + os * (1.3 + k * 0.22), 0.0 + wy(dp, fz), fz - 0.42 - k * 0.02], [dp + os * (1.5 + k * 0.22), 2.1, fz - 0.06], 0.07, 0.04); } m.mat(MAT.PLANKS, [0.3, 0.26, 0.2], 0.5); for (let k = 0; k < 2; k++) m.cyl(xo + k * 0.5 * os, at(xo, sz0), fz - 0.55, 0.22, 0.18, 0.4, 8, 1); }
    else if (T === 'basket') { for (let k = 0; k < 6; k++) { m.mat(MAT.THATCH, [0.52, 0.46, 0.24], 0.5); m.beam([xo + (k - 3) * 0.14, 0.05 + at(xo, fz), fz - 0.3], [xo + (k - 3) * 0.14 + 0.05, 1.7, fz - 0.06], 0.1, 0.1); } for (let k = 0; k < 3; k++) { m.mat(MAT.THATCH, [0.46, 0.4, 0.2], 0.5); m.cyl(xo + os * (1.2 + (k % 2) * 0.5), at(xo, sz0), fz - 0.55, 0.3, 0.26, 0.28 + (k >> 1) * 0.28, 9, 1); } }
    else if (T === 'nets') { for (const sx of [-1, 1]) { m.mat(MAT.TIMBER, [0.3, 0.24, 0.17], 0.5); m.beam([xo + sx * 1.1, at(xo, fz), fz - 1.3], [xo + sx * 1.1, 2.4, fz - 1.3], 0.08, 0.08); } wNet(m, [xo - 1.1, 2.3, fz - 1.3], [xo + 1.1, 2.3, fz - 1.3], 1.3, R); for (let k = 0; k < 6; k++) { m.mat(MAT.TIMBER, [0.5, 0.42, 0.3], 0.5); m.cyl(xo - 0.9 + k * 0.36, 2.2, fz - 1.3, 0.045, 0.04, 0.1, 6, 2); } wNetHeap(m, dp + os * 1.5, at(dp, fz), fz - 0.6, 0.6, R); col(xo + 1.1, fz - 1.3, 0.1, 2.4); col(xo - 1.1, fz - 1.3, 0.1, 2.4); }
    m.pop();
  }
}
