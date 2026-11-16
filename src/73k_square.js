// ───────────────────────── the square as a finished place (Build 42) ─────────────────────────
// Additive: a stone plinth under every wall that faces the square, ground that has been lived on (worn patches, puddles, straw, dung, a drain and its channel, a worn rim
// round the well), and a few things tied to a person: the smith's quench trough, the baker's cooling rack, a mounting block and a hitching rail at the inn.
// It all goes through the KEEP rule and into the village cell buckets (a few hundred triangles in all).
function buildSquare(bucket) {
  if (TEST && TEST.levels === 0) return;
  const touch = new Map(), K = rtKit(bucket, touch), { M, box, beam, col, dark, wood, gy } = K, rr = rng(9091), sq = SQUARE;
  const okAt = (x, z, r) => !KEEP.hit(x, z, r) && !World.blockedAt(x, z, r * 0.6);
  // ── plinths: the face of each building toward the square gets a stone course 0.3 m high that stands 6 cm proud ──
  for (const id of ['inn', 'smithy', 'store', 'elder', 'herbalist', 'draper']) {
    const s = SITE[id]; if (!s) continue; let best = null;
    for (const f of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const lx = f[0] * (s.w / 2), lz = f[1] * (s.d / 2), p = siteToWorld(s, lx, lz), q = siteToWorld(s, lx * 1.1 + f[0], lz * 1.1 + f[1]), toC = (sq.x - p[0]) * (q[0] - p[0]) + (sq.z - p[1]) * (q[1] - p[1]);
      if (!best || toC > best.t) best = { t: toC, f };
    }
    const f = best.f, a = f[0] ? s.d : s.w, pts = [-1, 1].map(k => siteToWorld(s, f[0] ? f[0] * (s.w / 2 + 0.04) : k * (a / 2 + 0.05), f[0] ? k * (a / 2 + 0.05) : f[1] * (s.d / 2 + 0.04)));
    const y0 = Math.min(gy(pts[0][0], pts[0][1]), gy(pts[1][0], pts[1][1])) - 0.15, m = M((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
    m.mat(MAT.STONE, [0.78, 0.75, 0.7], 0.7); m.beam([pts[0][0], y0 + 0.24, pts[0][1]], [pts[1][0], y0 + 0.24, pts[1][1]], 0.16, 0.54);
    m.mat(MAT.STONE, [0.86, 0.83, 0.78], 0.7); m.beam([pts[0][0], y0 + 0.5, pts[0][1]], [pts[1][0], y0 + 0.5, pts[1][1]], 0.2, 0.05);       // the drip course on top
  }
  // ── ground that has been walked on ──
  const flat = (m, x, z, rx, rz, y, c, mat, ry) => { m.mat(mat === undefined ? MAT.MUD : mat, c, 0.5); m.push().T(x, y, z).RY(ry || 0); m.ball(0, 0, 0, rx, 0.012, rz, 12, 3); m.pop(); };
  { const m = M(0, -2);
    // puddles: small and dark, with no lighter disc inside (the big ones read as a plate lying on the cobbles)
    for (const [x, z, a, b] of [[-3.4, -9.6, 0.42, 0.3], [2.8, 0.8, 0.5, 0.3], [-7.5, 1.4, 0.34, 0.26], [9.5, -5.8, 0.4, 0.28], [1.2, -12.2, 0.3, 0.22]]) flat(m, x, z, a, b, gy(x, z) + 0.022, [0.07, 0.09, 0.11], MAT.PLAIN, rr() * 3);
    // straw and dung where the carts stand and the horses were
    for (let i = 0; i < 26; i++) { const x = (rr() - 0.5) * 22 + 2, z = -5 + (rr() - 0.5) * 14; if (Math.hypot(x - sq.x, z - sq.z) > 12 || KEEP.onRoad(x, z)) continue; m.mat(MAT.THATCH, [0.7 + rr() * 0.12, 0.6, 0.3], 0.5); const y = gy(x, z) + 0.02, a = rr() * 6; m.beam([x, y, z], [x + Math.cos(a) * (0.25 + rr() * 0.3), y + 0.01, z + Math.sin(a) * (0.25 + rr() * 0.3)], 0.025, 0.012); }
    for (const [x, z] of [[-6.8, -9.4], [3.6, -11.2], [10.2, 0.6], [-10.5, 2.2]]) { m.mat(MAT.MUD, [0.3, 0.22, 0.14], 0.5); for (let i = 0; i < 3; i++) m.ball(x + (rr() - 0.5) * 0.4, gy(x, z) + 0.03, z + (rr() - 0.5) * 0.4, 0.09, 0.05, 0.09, 6, 4); }
    // a drain with a channel to the south lane
    const dx = -1.4, dz = 4.6, dy = gy(dx, dz); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.4); m.box(dx - 0.28, dy + 0.005, dz - 0.28, dx + 0.28, dy + 0.03, dz + 0.28); m.mat(MAT.PLAIN, [0.02, 0.02, 0.02]); for (let i = 0; i < 4; i++) m.box(dx - 0.22 + i * 0.15, dy + 0.031, dz - 0.22, dx - 0.18 + i * 0.15, dy + 0.034, dz + 0.22);
    m.mat(MAT.STONE, [0.42, 0.4, 0.38], 0.6); for (let i = 0; i < 6; i++) { const x = dx - 0.2 + i * 0.01, z = dz + 0.3 + i * 0.85; m.box(x - 0.09, gy(x, z) + 0.005, z, x + 0.09, gy(x, z) + 0.028, z + 0.85); }
    // the well's rim, trodden dark and wet
    m.mat(MAT.PLAIN, [0.1, 0.12, 0.14]); m.push().T(6.2, gy(6.2, -8.6) + 0.024, -7.3); m.ball(0, 0, 0, 0.6, 0.01, 0.35, 10, 3); m.pop(); }
  // ── the inn: a mounting block by the door and a hitching rail ──
  { const s = SITE.inn; if (s) { const dp = s.doorPos || 0;
    const mb = siteToWorld(s, dp + 2.6, -s.d / 2 - 0.55), hr = siteToWorld(s, dp - 3.6, -s.d / 2 - 1.5), hr2 = siteToWorld(s, dp - 5.6, -s.d / 2 - 1.5);
    if (okAt(mb[0], mb[1], 0.7)) { const g = gy(mb[0], mb[1]), m = M(mb[0], mb[1]); m.mat(MAT.STONE, [0.84, 0.8, 0.74], 0.7); m.push().T(mb[0], g, mb[1]).RY(-s.yaw); m.box(-0.45, -0.1, -0.3, 0.45, 0.22, 0.3); m.box(-0.45, 0.22, -0.3, 0.0, 0.44, 0.3); m.pop(); addBoxCollider(m, mb[0] - 0.5, mb[1] - 0.5, mb[0] + 0.5, mb[1] + 0.5, g - 0.1, g + 0.44); }
    if (okAt(hr[0], hr[1], 0.8) && okAt(hr2[0], hr2[1], 0.8)) { const g = gy(hr[0], hr[1]); for (const [p, k] of [[hr, 0], [hr2, 1]]) K.post(p[0], p[1], g - 0.2, g + 1.1, 0.14); beam([hr[0], g + 0.95, hr[1]], [hr2[0], g + 0.95, hr2[1]], 0.1, 0.1); beam([hr[0], g + 0.55, hr[1]], [hr2[0], g + 0.55, hr2[1]], 0.08, 0.08); } } }
  // ── the smith's quench trough, in the lee of the forge mouth ──
  { const s = SITE.smithy; if (s) { const p = siteToWorld(s, -2.2, -s.d / 2 - 1.15);
    if (okAt(p[0], p[1], 0.9)) { const g = gy(p[0], p[1]), m = M(p[0], p[1]); m.push().T(p[0], g, p[1]).RY(-s.yaw); m.mat(MAT.PLANKS, [0.42, 0.34, 0.27], 0.5); m.box(-0.75, 0, -0.3, 0.75, 0.62, 0.3); m.mat(MAT.PLAIN, [0.04, 0.06, 0.08]); m.box(-0.66, 0.56, -0.22, 0.66, 0.605, 0.22); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.4); for (const x of [-0.5, 0.5]) m.box(x - 0.025, 0, -0.31, x + 0.025, 0.62, 0.31); m.pop(); addBoxCollider(m, p[0] - 0.8, p[1] - 0.8, p[0] + 0.8, p[1] + 0.8, g, g + 0.62);
      World.emitters.push({ type: 'smoke', p: [p[0], g + 0.7, p[1]], zone: 0, thin: true }); K.place('quench', 'The Quench Trough', p[0], p[1], 2); } } }
  // ── the baker's cooling rack, on the pavement outside the oven door ──
  { const s = SITE['shop.s0']; if (s) { const p = siteToWorld(s, 1.4, -s.d / 2 - 0.85);
    if (okAt(p[0], p[1], 0.8)) { const g = gy(p[0], p[1]), m = M(p[0], p[1]); m.push().T(p[0], g, p[1]).RY(-s.yaw); m.mat(MAT.TIMBER, dark, 0.5); for (const x of [-0.55, 0.55]) for (const z of [-0.22, 0.22]) m.cbox(x, 0, z, 0.06, 1.35, 0.06, 0);
      m.mat(MAT.PLANKS, wood, 0.5); for (const y of [0.45, 0.85, 1.25]) m.box(-0.58, y, -0.25, 0.58, y + 0.03, 0.25);
      m.mat(MAT.THATCH, [0.78, 0.55, 0.28], 0.5); for (const y of [0.48, 0.88]) for (let i = 0; i < 5; i++) m.ball(-0.42 + i * 0.21, y + 0.06, (i % 2 ? 0.08 : -0.08), 0.085, 0.055, 0.085, 8, 4);
      m.mat(MAT.CLOTH, [0.8, 0.77, 0.68], 0.5); m.box(-0.5, 1.28, -0.2, 0.5, 1.292, 0.2); m.pop(); addBoxCollider(m, p[0] - 0.6, p[1] - 0.35, p[0] + 0.6, p[1] + 0.35, g, g + 1.35); K.place('bakerrack', 'The Baker’s Rack', p[0], p[1], 2); } } }
  lvLift(touch, 0.3);
}
