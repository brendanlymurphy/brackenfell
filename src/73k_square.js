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
    for (const [x, z, a, b] of [[-11.5, -0.1, 0.5, 0.34], [-5.0, 1.3, 0.42, 0.3], [6.0, 2.3, 0.5, 0.3], [12.6, 2.9, 0.4, 0.28], [0.6, 7.4, 0.36, 0.26]]) flat(m, x, z, a, b, gy(x, z) + 0.022, [0.15, 0.17, 0.19], MAT.PLAIN, rr() * 3);
    // straw and dung where the carts stand and the horses were
    for (let i = 0; i < 26; i++) { const x = (rr() - 0.5) * 22 + 2, z = -5 + (rr() - 0.5) * 14; if (Math.hypot(x - sq.x, z - sq.z) > 12 || KEEP.onRoad(x, z)) continue; m.mat(MAT.THATCH, [0.7 + rr() * 0.12, 0.6, 0.3], 0.5); const y = gy(x, z) + 0.02, a = rr() * 6; m.beam([x, y, z], [x + Math.cos(a) * (0.25 + rr() * 0.3), y + 0.01, z + Math.sin(a) * (0.25 + rr() * 0.3)], 0.025, 0.012); }
    for (const [x, z] of [[-6.8, -9.4], [3.6, -11.2], [10.2, 0.6], [-10.5, 2.2]]) { m.mat(MAT.MUD, [0.3, 0.22, 0.14], 0.5); for (let i = 0; i < 3; i++) m.ball(x + (rr() - 0.5) * 0.4, gy(x, z) + 0.03, z + (rr() - 0.5) * 0.4, 0.09, 0.05, 0.09, 6, 4); }
    // a drain with a channel to the south lane
    const dx = 0.75, dz = 4.4, dy = gy(dx, dz); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.4); m.box(dx - 0.28, dy + 0.005, dz - 0.28, dx + 0.28, dy + 0.03, dz + 0.28); m.mat(MAT.PLAIN, [0.02, 0.02, 0.02]); for (let i = 0; i < 4; i++) m.box(dx - 0.22 + i * 0.15, dy + 0.031, dz - 0.22, dx - 0.18 + i * 0.15, dy + 0.034, dz + 0.22);
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
  { const s = SITE['shop.s0']; if (s) { let p = null; for (const [lx, o] of [[1.4, 0.85], [-1.4, 0.85], [1.4, 1.5], [-1.4, 1.5], [0, 1.9]]) { const q = siteToWorld(s, lx, -s.d / 2 - o); if (okAt(q[0], q[1], 0.7)) { p = q; break; } }
    if (p) { const g = gy(p[0], p[1]), m = M(p[0], p[1]); m.push().T(p[0], g, p[1]).RY(-s.yaw); m.mat(MAT.TIMBER, dark, 0.5); for (const x of [-0.55, 0.55]) for (const z of [-0.22, 0.22]) m.cbox(x, 0, z, 0.06, 1.35, 0.06, 0);
      m.mat(MAT.PLANKS, wood, 0.5); for (const y of [0.45, 0.85, 1.25]) m.box(-0.58, y, -0.25, 0.58, y + 0.03, 0.25);
      m.mat(MAT.THATCH, [0.78, 0.55, 0.28], 0.5); for (const y of [0.48, 0.88]) for (let i = 0; i < 5; i++) m.ball(-0.42 + i * 0.21, y + 0.06, (i % 2 ? 0.08 : -0.08), 0.085, 0.055, 0.085, 8, 4);
      m.mat(MAT.CLOTH, [0.8, 0.77, 0.68], 0.5); m.box(-0.5, 1.28, -0.2, 0.5, 1.292, 0.2); m.pop(); addBoxCollider(m, p[0] - 0.6, p[1] - 0.35, p[0] + 0.6, p[1] + 0.35, g, g + 1.35); K.place('bakerrack', 'The Baker’s Rack', p[0], p[1], 2); } } }

  // ── a centre of gravity: a stepped market cross between the bonfire and the well, a pillory, a horse trough, a handcart ──
  { const cx = 1.4, cz = -4.6, g = gy(cx, cz), m = M(cx, cz); let ok = okAt(cx, cz, 1.9);
    if (ok) { m.mat(MAT.STONE, [0.84, 0.81, 0.75], 0.7);
      for (let i = 0; i < 3; i++) { const r = 1.5 - i * 0.38; m.box(cx - r, g - 0.1, cz - r, cx + r, g + 0.17 * (i + 1), cz + r); }
      m.mat(MAT.STONE, [0.9, 0.87, 0.81], 0.7); m.cbox(cx, g + 0.5, cz, 0.5, 0.35, 0.5, 0); m.cbox(cx, g + 0.85, cz, 0.34, 2.5, 0.34, 0); m.cbox(cx, g + 3.3, cz, 0.5, 0.18, 0.5, 0);
      m.mat(MAT.STONE, [0.82, 0.79, 0.73], 0.7); m.cbox(cx, g + 3.48, cz, 0.12, 0.62, 0.12, 0); m.box(cx - 0.3, g + 3.78, cz - 0.06, cx + 0.3, g + 3.9, cz + 0.06);
      addBoxCollider(m, cx - 1.5, cz - 1.5, cx + 1.5, cz + 1.5, g - 0.1, g + 0.5); K.place('marketcross', 'The Market Cross', cx, cz, 4);
      K.read(cx, g + 1.1, cz + 1.9, 2.2, 'cross.note', 'The market cross', 'Worn at the top step by three hundred years of sitting. A tally of weights is cut into the pillar, and under it, newer and shallower, someone has scratched: PRICES FIXED BY THE REEVE, GRUMBLED BY ALL.'); } }
  { const px = -4.9, pz = -2.4, g = gy(px, pz), m = M(px, pz);                   // the pillory: two posts and a bored beam on a plank step
    if (okAt(px, pz, 1.0)) { m.mat(MAT.PLANKS, [0.5, 0.42, 0.34], 0.5); m.box(px - 0.9, g, pz - 0.5, px + 0.9, g + 0.14, pz + 0.5); m.mat(MAT.TIMBER, dark, 0.5); for (const x of [-0.65, 0.65]) m.cbox(px + x, g + 0.14, pz, 0.14, 1.75, 0.14, 0);
      m.box(px - 0.8, g + 1.0, pz - 0.05, px + 0.8, g + 1.09, pz + 0.05); m.box(px - 0.8, g + 1.2, pz - 0.05, px + 0.8, g + 1.29, pz + 0.05); m.mat(MAT.PLAIN, [0.03, 0.03, 0.03]); for (const x of [-0.3, 0.3]) m.cyl(px + x, g + 1.1, pz, 0.09, 0.09, 0.1, 8, 2);
      addBoxCollider(m, px - 0.9, pz - 0.5, px + 0.9, pz + 0.5, g, g + 1.8); K.place('pillory', 'The Pillory', px, pz, 2); } }
  { const tx = 5.2, tz = -1.0, g = gy(tx, tz), m = M(tx, tz);                    // a horse trough in stone, half full
    if (okAt(tx, tz, 1.3)) { m.mat(MAT.STONE, [0.78, 0.75, 0.7], 0.7); m.box(tx - 1.1, g, tz - 0.38, tx + 1.1, g + 0.55, tz + 0.38); m.mat(MAT.PLAIN, [0.05, 0.07, 0.09]); m.box(tx - 0.95, g + 0.46, tz - 0.25, tx + 0.95, g + 0.5, tz + 0.25); m.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.7); m.box(tx - 1.1, g + 0.55, tz - 0.38, tx + 1.1, g + 0.6, tz - 0.3);
      addBoxCollider(m, tx - 1.15, tz - 0.42, tx + 1.15, tz + 0.42, g, g + 0.6); } }
  { const hx = -1.6, hz = 1.8, m = M(hx, hz); if (okAt(hx, hz, 1.3)) { m.push().T(hx, gy(hx, hz), hz).RY(0.7); if (Props.cart) Props.cart(m, true); m.pop(); } }
  // ── silhouettes: the store's awning and goods, the smithy's open forge shed with its glow, the inn's great hanging sign, the elder's carved door and steps ──
  const W3 = (s, lx, y, lz) => { const p = siteToWorld(s, lx, lz); return [p[0], y, p[1]]; };
  { const s = SITE.store; if (s) { const y = s.y, z0 = -s.d / 2, o = 1.5, m = M(s.x, s.z), a = [W3(s, -s.w / 2 + 0.4, y + 2.75, z0), W3(s, 0, y + 2.75, z0), W3(s, s.w / 2 - 0.4, y + 2.75, z0)], b = [W3(s, -s.w / 2 + 0.4, y + 2.2, z0 - o), W3(s, 0, y + 2.1, z0 - o), W3(s, s.w / 2 - 0.4, y + 2.2, z0 - o)];
      m.mat(MAT.CLOTH, [0.6, 0.55, 0.45], 0.8); m.quad2(a[0], b[0], b[1], a[1]); m.quad2(a[1], b[1], b[2], a[2]); m.mat(MAT.CLOTH, AWN.madder, 0.8); m.quad2(b[0], W3(s, -s.w / 2 + 0.4, y + 1.95, z0 - o - 0.02), W3(s, 0, y + 1.85, z0 - o - 0.02), b[1]); m.quad2(b[1], W3(s, 0, y + 1.85, z0 - o - 0.02), W3(s, s.w / 2 - 0.4, y + 1.95, z0 - o - 0.02), b[2]);
      for (const lx of [-s.w / 2 + 0.4, s.w / 2 - 0.4]) { const p = siteToWorld(s, lx, z0 - o + 0.05); if (okAt(p[0], p[1], 0.3)) K.post(p[0], p[1], gy(p[0], p[1]) - 0.2, y + 2.2, 0.12); }
      // goods on a trestle under it, off the door's strip
      const du = s.doorPos || 0, lx = du > 0 ? -s.w / 2 + 1.5 : s.w / 2 - 1.5, tp = siteToWorld(s, lx, z0 - 0.7);
      if (okAt(tp[0], tp[1], 0.9)) { const g = gy(tp[0], tp[1]); m.push().T(tp[0], g, tp[1]).RY(-s.yaw); m.mat(MAT.PLANKS, wood, 0.5); m.box(-0.7, 0.72, -0.3, 0.7, 0.77, 0.3); for (const x of [-0.6, 0.6]) m.box(x - 0.04, 0, -0.25, x + 0.04, 0.72, 0.25);
        m.mat(MAT.CLOTH, [0.55, 0.5, 0.4], 0.5); for (let i = 0; i < 3; i++) m.ball(-0.4 + i * 0.4, 0.88, 0, 0.17, 0.13, 0.17, 8, 5); m.pop(); addBoxCollider(m, tp[0] - 0.75, tp[1] - 0.75, tp[0] + 0.75, tp[1] + 0.75, g, g + 0.8); } } }
  { const s = SITE.smithy; if (s) { const du = s.doorPos || 0, side = du > 0 ? -1 : 1, lx0 = side * 1.0, lx1 = side * 4.2, z0 = -s.d / 2, o = 2.3, y = s.y, g0 = gy(s.x, s.z), m = M(s.x, s.z);
      const pts = [W3(s, lx0, y + 3.0, z0), W3(s, lx1, y + 3.0, z0), W3(s, lx1, y + 2.35, z0 - o), W3(s, lx0, y + 2.35, z0 - o)];
      const pc = pts.map(p => [p[0], p[2]]); if (pc.every(p => okAt(p[0], p[1], 0.3))) {
        m.mat(MAT.SHINGLE, [0.5, 0.45, 0.4], 0.6); m.quad2(pts[0], pts[1], pts[2], pts[3]); m.mat(MAT.PLANKS, [0.4, 0.34, 0.28], 0.5);
        for (const [lx, lz] of [[lx0, z0 - o + 0.1], [lx1, z0 - o + 0.1]]) { const p = siteToWorld(s, lx, lz); K.post(p[0], p[1], gy(p[0], p[1]) - 0.2, y + 2.4, 0.16); }
        const an = siteToWorld(s, (lx0 + lx1) / 2, z0 - 1.1), ag = gy(an[0], an[1]);                     // anvil on a stump, a forge hearth against the wall with a glow
        m.push().T(an[0], ag, an[1]).RY(-s.yaw); m.mat(MAT.BARK, [0.4, 0.34, 0.28], 0.5); m.cyl(0, 0, 0, 0.3, 0.3, 0.55, 8, 2); m.mat(MAT.METAL, [0.2, 0.2, 0.21], 0.4); m.box(-0.28, 0.55, -0.1, 0.28, 0.72, 0.1); m.box(-0.12, 0.5, -0.07, 0.12, 0.55, 0.07); m.pop(); addCircleCollider(m, an[0], an[1], 0.4, ag, ag + 0.75);
        const hp = siteToWorld(s, (lx0 + lx1) / 2 + side * 0.9, z0 - 0.35), hg = gy(hp[0], hp[1]); m.push().T(hp[0], hg, hp[1]).RY(-s.yaw); m.mat(MAT.STONE, [0.5, 0.48, 0.45], 0.7); m.box(-0.55, 0, -0.35, 0.55, 0.85, 0.35); m.mat(MAT.PLAIN, [0.9, 0.35, 0.08]); m.box(-0.4, 0.85, -0.25, 0.4, 0.88, 0.25); m.pop();
        addBoxCollider(m, hp[0] - 0.6, hp[1] - 0.6, hp[0] + 0.6, hp[1] + 0.6, hg, hg + 0.9); World.emitters.push({ type: 'torch', p: [hp[0], hg + 1.05, hp[1]], zone: 0, size: 0.28 }); addLight([hp[0], hg + 1.2, hp[1]], 11, [3.2, 1.4, 0.4], 0, 'lantern');
        World.emitters.push({ type: 'smoke', p: [hp[0], y + 2.9, hp[1]], zone: 0, thin: true }); K.place('forgeshed', 'The Open Forge', an[0], an[1], 4); } } }
  { const s = SITE.inn; if (s) { const du = s.doorPos || 0, lx = du + 3.0, z0 = -s.d / 2, y = s.y + 2.9, m = M(s.x, s.z), a = W3(s, lx, y, z0 - 0.05), b = W3(s, lx, y, z0 - 1.55);
      m.mat(MAT.TIMBER, dark, 0.5); m.beam(a, b, 0.09, 0.12); m.beam(W3(s, lx, y - 0.7, z0 - 0.05), W3(s, lx, y - 0.1, z0 - 1.2), 0.06, 0.08);
      for (const dz of [-1.0, -1.5]) { const p = W3(s, lx, y, z0 + dz); m.mat(MAT.METAL, [0.2, 0.2, 0.2], 0.4); m.beam([p[0], y - 0.02, p[2]], [p[0], y - 0.28, p[2]], 0.02, 0.02); }
      const q = (dz, yy) => W3(s, lx, yy, z0 + dz); m.mat(MAT.PLANKS, [0.3, 0.38, 0.3], 0.5); m.quad2(q(-1.0, y - 0.28), q(-1.0, y - 1.12), q(-1.52, y - 1.12), q(-1.52, y - 0.28)); m.mat(MAT.PLAIN, [0.62, 0.5, 0.24]); m.quad2(q(-1.11, y - 0.5), q(-1.11, y - 0.92), q(-1.41, y - 0.92), q(-1.41, y - 0.5));
      K.place('hartsign', 'The Honeyed Hart’s Sign', s.x, s.z, 2); } }
  { const s = SITE.elder; if (s) { const du = s.doorPos || 0, z0 = -s.d / 2, y = s.y, m = M(s.x, s.z), c = (lx, lz) => W3(s, lx, y, lz);
      { const sp = siteToWorld(s, du, z0 - 0.45); m.push().T(sp[0], gy(sp[0], sp[1]), sp[1]).RY(-s.yaw); m.mat(MAT.STONE, [0.82, 0.79, 0.73], 0.7); for (let i = 0; i < 3; i++) m.box(-1.0 + i * 0.1, -0.1, -0.35 + i * 0.3 - 0.35, 1.0 - i * 0.1, 0.16 * (3 - i) - 0.1, -0.35 + i * 0.3 + 0.0 + 0.35 - 0.0); m.pop(); }
      m.mat(MAT.TIMBER, dark, 0.5); for (const sx of [-1, 1]) { const p = siteToWorld(s, du + sx * 0.78, z0 - 0.12); K.post(p[0], p[1], y - 0.1, y + 2.5, 0.2, true); }
      const l0 = W3(s, du - 0.88, y + 2.35, z0 - 0.12), l1 = W3(s, du + 0.88, y + 2.35, z0 - 0.12); m.beam(l0, l1, 0.2, 0.22); m.mat(MAT.TIMBER, [0.62, 0.5, 0.38], 0.5); m.beam(W3(s, du, y + 2.6, z0 - 0.14), W3(s, du, y + 2.62, z0 - 0.14), 0.5, 0.26); m.beam(W3(s, du - 0.5, y + 2.52, z0 - 0.14), W3(s, du + 0.5, y + 2.52, z0 - 0.14), 0.12, 0.08); } }
  lvLift(touch, 0.3);
}
