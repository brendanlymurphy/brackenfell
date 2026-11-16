// ───────────────────────── the town in levels (Build 33) ─────────────────────────
// 1. The upper ward: a terrace LV.up.h above the market square under the elder's hall (ground shaped in 60_terrain.js, rectangle in 55_layout.js).
//    Retaining walls of mortared stone stand just outside its edge (coping, buttresses, weep holes, moss at the foot), a covered flight of steps climbs from the
//    square, a ramped lane climbs along the south wall from the south road. On top: paving, a fountain, a garden with a tree, three outbuildings, a lookout corner.
// Everything is boxes and quads merged into the village cells through `bucket`; every walkable surface is a World.floors entry, every wall a box collider.
const LVL = { n: 0 };
// Build 42: the stone of the terrace and the Wharf, on the sides that the sun does not reach, read near-black (a vertical face takes only the horizon's ambient). Tilting the normals of
// vertical stone faces upward by `k` lets them take more of the sky's light; the sun still sees them as before on the lit side. `touch` maps each bucket mesh to its vertex count before the builder began.
function lvLift(touch, k) {
  for (const [m, n0] of touch) for (let i = n0; i < m.nv; i++) {
    const b = i * 32; if (m.u8[b + 28] !== MAT.STONE) continue; const ny = m.i8[b + 13]; if (Math.abs(ny) > 40) continue;
    let x = m.i8[b + 12], y = ny + k * 127, z = m.i8[b + 14]; const l = 127 / Math.hypot(x, y, z); m.i8[b + 12] = Math.round(x * l); m.i8[b + 13] = Math.round(y * l); m.i8[b + 14] = Math.round(z * l);
  }
}
function lvFloor(x0, z0, x1, z1, y, y2, axis) {
  const f = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: Math.abs(x1 - x0) / 2, hz: Math.abs(z1 - z0) / 2, ax: 1, az: 0, bx: 0, bz: 1, y };
  if (y2 !== undefined) { f.y2 = y2; f.axis = axis; } World.floors.push(f); return f;
}
function buildLevels(bucket, fence, R) {
  if (TEST && TEST.levels === 0) return;
  const rr = rng(3317), T = LV.up, H = T.h, wt = T.slope, TOP = H + 0.1;
  const touch = new Map();
  const M = (x, z) => { const m = bucket(x, z); if (!touch.has(m)) touch.set(m, m.nv); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; return m; };
  const sc = v => [1.0 * v, 0.97 * v, 0.92 * v];
  const gmin = (x0, z0, x1, z1) => { let g = 1e9; for (let i = 0; i <= 6; i++) g = Math.min(g, Terrain.y(x0 + (x1 - x0) * i / 6, z0 + (z1 - z0) * i / 6)); return g; };
  const col = (x0, z0, x1, z1, y0, y1) => { addBoxCollider(M((x0 + x1) / 2, (z0 + z1) / 2), x0, z0, x1, z1, y0, y1); };
  const stoneBox = (x0, y0, z0, x1, y1, z1, c, skip, tile) => { const m = M((x0 + x1) / 2, (z0 + z1) / 2); m.mat(MAT.STONE, c || sc(1), tile || 0.7); m.box(x0, y0, z0, x1, y1, z1, skip || 0); };

  // ── a retaining wall run. ax 0: runs along x, outer face at z = vo, inner face at vi; ax 1: runs along z, faces at x = vo and vi ──
  const sw = s => (s & 12) | (s & 1 ? 16 : 0) | (s & 2 ? 32 : 0) | (s & 16 ? 1 : 0) | (s & 32 ? 2 : 0);
  const wallRun = (ax, u0, u1, vo, vi, parapet, buttress) => {
    const os = Math.sign(vo - vi), v0 = Math.min(vo, vi), v1 = Math.max(vo, vi), mid = (u0 + u1) / 2;
    const P = ax ? (u, v) => [v, u] : (u, v) => [u, v], mm = M(...P(mid, vo));
    const bx = (a, y0, b, c, y1, d, skip) => { if (ax) mm.box(b, y0, a, d, y1, c, sw(skip || 0)); else mm.box(a, y0, b, c, y1, d, skip || 0); };
    let base = 1e9; for (let i = 0; i <= 8; i++) { const u = u0 + (u1 - u0) * i / 8, p = P(u, vo + os * 0.4); base = Math.min(base, Terrain.y(p[0], p[1])); } base -= 0.7;
    mm.mat(ax === 0 && os < 0 ? MAT.PLASTER : MAT.STONE, ax === 0 && os < 0 ? [1.0, 0.96, 0.88] : sc(0.9 + rr() * 0.08), 0.7); bx(u0, base, v0, u1, TOP, v1, 4 | 8);      // Build 42: the north face (never in the sun) is limewashed rubble, it was near-black
    mm.mat(MAT.STONE, sc(1), 0.6);
    if (parapet) { bx(u0, TOP, v0 + 0.12, u1, H + 0.95, v1 - 0.12, 4 | 8); bx(u0 - 0.05, H + 0.95, v0 - 0.02, u1 + 0.05, H + 1.07, v1 + 0.02, 4); }
    else bx(u0 - 0.04, TOP, v0 - 0.1, u1 + 0.04, H + 0.2, v1 + 0.1, 4);
    { const a = P(u0, v0), b = P(u1, v1); col(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), base, H + (parapet ? 1.1 : 0.2)); }
    const n = Math.max(1, Math.round((u1 - u0) / 5)), step = (u1 - u0) / n, inner = os > 0 ? 16 : 32;
    if (buttress) for (let i = 0; i <= n; i++) {
      const u = u0 + i * step; if (u < u0 + 0.5 || u > u1 - 0.5) continue; const vb = vo + os * 0.5;
      mm.mat(MAT.STONE, sc(0.95), 0.6);
      bx(u - 0.3, base, Math.min(vo, vb), u + 0.3, H - 0.45, Math.max(vo, vb), 4 | 8 | inner);
      bx(u - 0.3, H - 0.45, Math.min(vo, vb - os * 0.15), u + 0.3, H - 0.3, Math.max(vo, vb - os * 0.15) + 0.0001, 4 | inner);
      { const a = P(u - 0.3, Math.min(vo, vb)), b = P(u + 0.3, Math.max(vo, vb)); col(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), base, H - 0.3); }
    }
    for (let i = 0; i < n; i++) {
      const u = u0 + (i + 0.5) * step, pp = P(u, vo + os * 0.2), g = Terrain.y(pp[0], pp[1]), vf = vo + os * 0.012;
      const q = [[u - 0.08, g + 0.7], [u + 0.08, g + 0.7], [u + 0.08, g + 0.86], [u - 0.08, g + 0.86]].map(([a, y]) => { const p = P(a, vf); return [p[0], y, p[1]]; });
      mm.mat(MAT.PLAIN, [0.05, 0.05, 0.05]); mm.quad2(q[0], q[1], q[2], q[3]);
      if (rr() < 0.85) { const w = 1.0 + rr() * 1.6, a = u - w / 2 + (rr() - 0.5) * step * 0.5;
        mm.mat(MAT.MOSS, [0.3, 0.4, 0.2], 0.5); bx(a, g - 0.05, Math.min(vo, vo + os * 0.03), a + w, g + 0.3 + rr() * 0.3, Math.max(vo, vo + os * 0.03), 4 | 8 | inner); }
    }
  };
  const gapA = [-13.5, -10.1];                                                         // the flight from the square
  wallRun(0, -36.8, gapA[0], T.z0 - wt, T.z0, true, true); wallRun(0, gapA[1], T.x1 + wt, T.z0 - wt, T.z0, true, true);     // north, over the market
  wallRun(1, T.z0 - wt, T.z1 + wt, T.x1 + wt, T.x1, true, true);                                                      // east
  wallRun(1, T.z0, T.z1 + wt, -36.8, -36.0, true, true);                                                              // west
  wallRun(0, -34.0, T.x1, T.z1 + wt, T.z1, false, true);                                                              // south: the lane runs along its foot

  // ── the flight from the market square: 2.8 m wide, steps are a top and a riser, cheeks are two beams, an arch with a roof where it arrives ──
  { const x0 = gapA[0] + 0.3, x1 = gapA[1] - 0.3, zA = 7.0, zB = T.z0 + 0.5, yA = Terrain.y(-11.8, zA), cw = 0.35, n = Math.max(2, Math.round((H - yA) / 0.19)), m = M(-11.8, 10);
    for (let i = 0; i < n; i++) {
      const za = zA + (zB - zA) * i / n, zb = zA + (zB - zA) * (i + 1) / n, top = yA + (H - yA) * (i + 1) / n;
      m.mat(MAT.STONE, i % 2 ? sc(0.9) : sc(0.97), 0.5); m.box(x0, top - 0.22, za, x1, top, zb, 4 | 1 | 2 | 32);
    }
    lvFloor(x0, zA, x1, zB, yA, H, 'z');
    for (const [a, b] of [[x0 - cw, x0], [x1, x1 + cw]]) { m.mat(MAT.STONE, sc(0.88), 0.7); m.beam([(a + b) / 2, yA + 0.3, zA], [(a + b) / 2, H + 0.3, zB], cw, 1.1); col(a, zA, b, zB, yA - 0.8, H + 0.9); }
    const pz0 = T.z0 + 0.1, pz1 = T.z0 + 0.7, ym = H + 2.7;
    for (const [a, b] of [[gapA[0] - 0.4, gapA[0] + 0.1], [gapA[1] - 0.1, gapA[1] + 0.4]]) { stoneBox(a, H, pz0, b, ym, pz1, sc(0.95), 4 | 8, 0.6); col(a, pz0, b, pz1, H, ym); }
    const ma = M(-11.8, T.z0 + 0.4); ma.mat(MAT.TIMBER, COL.timberDark, 0.6); ma.box(gapA[0] - 0.55, ym, pz0 - 0.1, gapA[1] + 0.55, ym + 0.3, pz1 + 0.1, 4);
    const xl = gapA[0] - 0.9, xr = gapA[1] + 0.9, xm = (xl + xr) / 2, za = pz0 - 0.9, zb = pz1 + 1.2, ye = ym + 0.3, yr = ye + 1.0;
    ma.mat(MAT.SHINGLE, [0.62, 0.56, 0.5], 0.5); ma.quad2([xl, ye, za], [xl, ye, zb], [xm, yr, zb], [xm, yr, za]); ma.quad2([xm, yr, za], [xm, yr, zb], [xr, ye, zb], [xr, ye, za]);
    ma.mat(MAT.TIMBER, COL.timberDark, 0.6); ma.box(xm - 0.07, yr - 0.02, za - 0.04, xm + 0.07, yr + 0.1, zb + 0.04, 4);
    for (const zz of [za + 0.02, zb - 0.02]) { const nz = zz < pz0 ? -1 : 1; ma.mat(MAT.PLASTER, [0.8, 0.76, 0.7], 0.5); const a = ma.vert(xl + 0.3, ye, zz, 0, 0, nz, 0, 0, 1), b = ma.vert(xr - 0.3, ye, zz, 0, 0, nz, 1, 0, 1), c = ma.vert(xm, yr - 0.05, zz, 0, 0, nz, 0.5, 1, 1); ma.tri(a, b, c); ma.tri(a, c, b); }
    for (const x of [gapA[0] - 0.1, gapA[1] - 0.4]) { const mb = M(x, zA); mb.push().T(x + 0.25, yA, zA - 0.1); mb.mat(MAT.TIMBER, COL.timberDark); mb.cbox(0, 0, 0, 0.14, 1.9, 0.14, 4); mb.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); mb.cbox(0, 1.9, 0, 0.3, 0.34, 0.3, 4); mb.pop();
      World.emitters.push({ type: 'lantern', p: [x + 0.25, yA + 2.1, zA - 0.1], zone: 0, halo: 0.5 }); }
    World.emitters.push({ type: 'lantern', p: [-11.8, ym - 0.2, pz1 + 0.3], zone: 0, halo: 0.5 });
  }

  // ── the ramped lane: from the south road (x -3.2) west along the terrace's south wall, rising to a landing at the terrace's south-west corner ──
  { const lz0 = T.z1 + wt, lz1 = 34.4, xE = -3.2, xW = -34.0, yE = Terrain.y(xE, (lz0 + lz1) / 2), n = 22, mm = M(-18, 33);
    lvFloor(xW, lz0, xE, lz1, H, yE, 'x');
    for (let i = 0; i < n; i++) {
      const xa = xW + (xE - xW) * i / n, xb = xW + (xE - xW) * (i + 1) / n, ya = H + (yE - H) * i / n, yb = H + (yE - H) * (i + 1) / n, base = gmin(xa, lz1 + 0.3, xb, lz1 + 0.3) - 0.5;
      mm.mat(MAT.COBBLE, [0.85, 0.82, 0.78], 0.5); mm.quad2([xa, ya, lz0], [xa, ya, lz1], [xb, yb, lz1], [xb, yb, lz0]);
      mm.mat(MAT.STONE, i % 2 ? sc(0.9) : sc(0.97), 0.7); { const ym = Math.min(ya, yb) - 0.02; mm.quad2([xa, base, lz1 + 0.3], [xa, ym, lz1 + 0.3], [xb, ym, lz1 + 0.3], [xb, base, lz1 + 0.3]); }
      mm.mat(MAT.STONE, sc(1), 0.6); mm.box(xa, Math.min(ya, yb) - 0.02, lz1 - 0.1, xb, Math.max(ya, yb) + 0.95, lz1 + 0.3, 4 | 1 | 2);
    }
    col(xW, lz1 - 0.1, xE, lz1 + 0.3, Math.min(yE, H) - 1.2, H + 1.0);
    const lb = gmin(-36.8, T.z1, -34, lz1) - 0.6;
    stoneBox(-36.8, lb, T.z1 + wt, -34.0, H, lz1 + 0.3, sc(0.95), 4 | 16, 0.7);
    lvFloor(-36.0, T.z1 - 0.3, -34.0, lz1, H);
    stoneBox(-36.8, H, T.z1 + wt, -36.3, H + 0.95, lz1 - 0.1, sc(1), 4 | 16 | 32, 0.6); stoneBox(-36.8, H, lz1 - 0.1, -34.0, H + 0.95, lz1 + 0.3, sc(1), 4 | 2, 0.6);
    col(-36.8, T.z1 + wt, -36.3, lz1 + 0.3, lb, H + 1.1); col(-36.8, lz1 - 0.1, -34.0, lz1 + 0.3, lb, H + 1.1);
    const m = M(xE, lz0), y = Terrain.y(xE + 0.6, lz1 + 0.8); m.push().T(xE + 0.6, y, lz1 + 0.8); m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, 0, 0, 0.14, 2.2, 0.14, 4); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.cbox(0, 2.2, 0, 0.3, 0.34, 0.3, 4); m.pop();
    World.emitters.push({ type: 'lantern', p: [xE + 0.6, y + 2.4, lz1 + 0.8], zone: 0, halo: 0.5 });
  }

  // ── on the terrace ──
  const putT = (x, z, yaw, fn) => { const m = M(x, z); m.push().T(x, H, z); if (yaw) m.RY(-yaw); fn(m); m.pop(); };
  const pave = (x0, z0, x1, z1, mat, c, tile) => { const m = M((x0 + x1) / 2, (z0 + z1) / 2); m.mat(mat, c, tile); m.quad2([x0, H + 0.025, z0], [x0, H + 0.025, z1], [x1, H + 0.025, z1], [x1, H + 0.025, z0]); };
  const CB = [0.8, 0.78, 0.74], GR = [0.62, 0.58, 0.52];
  pave(-14.0, T.z0 + 0.1, -9.6, 16.2, MAT.COBBLE, CB, 0.45); pave(-12.8, 16.2, -10.8, 22.4, MAT.COBBLE, CB, 0.45);
  pave(-15.9, 17.6, -12.8, 19.9, MAT.COBBLE, CB, 0.45); pave(-10.8, 20.6, -7.2, 22.5, MAT.COBBLE, CB, 0.45);
  pave(-35.6, T.z0 + 0.1, -14.0, T.z0 + 3.0, MAT.GRAVEL, GR, 0.5);
  { const fx = -26.2, fz = 19.4, m = M(fx, fz); m.push().T(fx, H, fz); m.mat(MAT.GRAVEL, GR, 0.5); m.disc(0, 0.02, 0, 2.5, 14, 1);
    m.mat(MAT.STONE, sc(1), 0.7); m.lathe([[1.15, -0.1], [1.15, 0.7], [1.04, 0.8], [0.82, 0.8], [0.82, 0.4]], 14, 0);
    m.mat(MAT.PLAIN, [0.15, 0.2, 0.22]); m.disc(0, 0.56, 0, 0.84, 18, 1);
    m.mat(MAT.STONE, sc(0.95), 0.6); m.lathe([[0.2, 0.4], [0.17, 1.2], [0.3, 1.32], [0.1, 1.38]], 10, 0);
    addCircleCollider(m, 0, 0, 1.2, 0, 0.8); m.pop(); }
  for (let i = 0; i < 3; i++) { const bx0 = -35.0, bx1 = -30.2, bz0 = 22.0 + i * 1.7, bz1 = bz0 + 1.05, m = M(-32.6, bz0);
    m.mat(MAT.SOIL, [0.8, 0.72, 0.65], 0.5); m.box(bx0 + 0.06, H, bz0 + 0.06, bx1 - 0.06, H + 0.27, bz1 - 0.06, 4);
    m.mat(MAT.PLANKS, [0.9, 0.82, 0.72], 0.5); m.box(bx0, H, bz0, bx1, H + 0.3, bz0 + 0.06, 4); m.box(bx0, H, bz1 - 0.06, bx1, H + 0.3, bz1, 4); m.box(bx0, H, bz0 + 0.06, bx0 + 0.06, H + 0.3, bz1 - 0.06, 4); m.box(bx1 - 0.06, H, bz0 + 0.06, bx1, H + 0.3, bz1 - 0.06, 4);
    col(bx0, bz0, bx1, bz1, H - 0.3, H + 0.32);
    for (let k = 0; k < 3; k++) { m.push().T(bx0 + 0.8 + k * 1.6, H + 0.22, bz0 + 0.5 + (k % 2) * 0.08); Props.cabbage(m); m.pop(); }
    if (i === 1) { m.mat(MAT.TIMBER, COL.timberDark, 0.5); for (let k = 0; k < 3; k++) m.beam([bx0 + 1.2 + k * 1.2, H + 0.25, bz0 + 0.5], [bx0 + 1.5 + k * 1.2, H + 1.8, bz0 + 0.5], 0.05, 0.05); } }
  for (const [x, z, yaw] of [[-27.0, 23.2, 0], [-24.2, 25.7, PI / 2]]) putT(x, z, yaw, m => Props.bench(m, 1.8));        // under the oak (LV.trees, 74_vegetation.js)
  for (const x of [-30, -21.5]) putT(x, T.z0 + 1.0, 0, m => Props.bench(m, 1.8));
  putT(-26, T.z0 + 0.6, 0, m => Props.lampPost(m, { zone: 0 }));
  { const px = -23.5, pz = T.z0 + 0.55;
    putT(px, pz, 0, m => { m.mat(MAT.STONE, sc(1), 0.6); m.box(-0.45, 0.0, -0.18, 0.45, 0.12, 0.18); m.box(-0.35, 0.12, -0.12, 0.35, 0.85, 0.12, 4); m.mat(MAT.PLAIN, [0.12, 0.1, 0.08]); m.quad2([-0.25, 0.4, 0.125], [-0.25, 0.75, 0.125], [0.25, 0.75, 0.125], [0.25, 0.4, 0.125]); });
    World.interact.push({ p: [px, H + 0.7, pz + 0.3], r: 2.2, zone: 0, kind: 'read', id: 'terrace.plaque', title: 'A plaque on the terrace wall', text: 'RAISED IN THE YEAR OF THE LONG FROST, WHEN THE MARKET FLOODED. From here the elder could see the square, the alley and the bridge, and know the river before it came. — The Wardens of Brackenfell' });
  }
  // outbuildings: stone walls, gable roofs, plank doors on the upper level. door = outward normal of the face that has it
  const hut = (x0, z0, x1, z1, door, h, c) => {
    const m = M((x0 + x1) / 2, (z0 + z1) / 2), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, alongX = (x1 - x0) >= (z1 - z0), ov = 0.35, rise = 0.95, ye = H + h, yr = ye + rise;
    m.mat(MAT.STONE, c || sc(0.95), 0.8); m.box(x0, H, z0, x1, ye, z1, 4 | 8); col(x0, z0, x1, z1, H, ye + 0.6);
    m.mat(MAT.SHINGLE, [0.56, 0.5, 0.45], 0.5);
    if (alongX) { m.quad2([x0 - ov, ye, z0 - ov], [x1 + ov, ye, z0 - ov], [x1 + ov, yr, cz], [x0 - ov, yr, cz]); m.quad2([x0 - ov, yr, cz], [x1 + ov, yr, cz], [x1 + ov, ye, z1 + ov], [x0 - ov, ye, z1 + ov]); }
    else { m.quad2([x0 - ov, ye, z0 - ov], [x0 - ov, ye, z1 + ov], [cx, yr, z1 + ov], [cx, yr, z0 - ov]); m.quad2([cx, yr, z0 - ov], [cx, yr, z1 + ov], [x1 + ov, ye, z1 + ov], [x1 + ov, ye, z0 - ov]); }
    m.mat(MAT.STONE, c || sc(0.95), 0.8);
    for (const s of [-1, 1]) { const e = alongX ? (s < 0 ? x0 : x1) + s * 0.002 : (s < 0 ? z0 : z1) + s * 0.002;
      const A = alongX ? [e, ye, z0] : [x0, ye, e], B = alongX ? [e, ye, z1] : [x1, ye, e], C = alongX ? [e, yr, cz] : [cx, yr, e], nx = alongX ? s : 0, nz = alongX ? 0 : s;
      const a = m.vert(A[0], A[1], A[2], nx, 0, nz, 0, 0, 1), b = m.vert(B[0], B[1], B[2], nx, 0, nz, 1, 0, 1), d = m.vert(C[0], C[1], C[2], nx, 0, nz, 0.5, 1, 1); m.tri(a, b, d); m.tri(a, d, b); }
    const dx = door[0], dz = door[1], px = dx > 0 ? x1 : dx < 0 ? x0 : cx, pz = dz > 0 ? z1 : dz < 0 ? z0 : cz;
    m.push().T(px + dx * 0.03, H, pz + dz * 0.03); if (dx) m.RY(PI / 2);
    m.mat(MAT.PLANKS, [0.78, 0.66, 0.52], 0.5); m.box(-0.5, 0.0, -0.03, 0.5, 1.9, 0.03, 4 | 8);
    m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.box(-0.5, 0.35, 0.02, 0.5, 0.45, 0.045, 4 | 8 | 16); m.box(-0.5, 1.4, 0.02, 0.5, 1.5, 0.045, 4 | 8 | 16); m.box(0.34, 0.95, 0.02, 0.4, 1.05, 0.06, 4 | 8 | 16);
    m.mat(MAT.STONE, sc(1), 0.6); m.box(-0.65, 0, 0.03, 0.65, 0.1, 0.4, 4); m.pop();
  };
  hut(-35.8, 17.0, -32.0, 20.6, [1, 0], 2.3);                    // tool shed on the west side, door to the garden
  hut(-30.5, 28.0, -25.5, 30.6, [0, -1], 2.5, sc(0.88));          // the cistern house, door to the terrace
  { const x0 = -17.5, x1 = -12.5, z0 = 28.6, z1 = 30.8, m = M(-15, 29.7);          // a woodstore: open-fronted lean-to, a stack of logs under it
    m.mat(MAT.STONE, sc(0.9), 0.8); m.box(x0, H, z1 - 0.25, x1, H + 2.1, z1, 4 | 8); col(x0, z1 - 0.25, x1, z1, H, H + 2.2);
    m.mat(MAT.TIMBER, COL.timberDark, 0.6); for (const x of [x0 + 0.1, x1 - 0.1]) { m.cbox(x, H, z0 + 0.1, 0.16, 2.5, 0.16, 4); col(x - 0.08, z0 + 0.02, x + 0.08, z0 + 0.18, H, H + 2.5); }
    m.beam([x0, H + 2.5, z0 + 0.1], [x1, H + 2.5, z0 + 0.1], 0.14, 0.14);
    m.mat(MAT.SHINGLE, [0.52, 0.47, 0.43], 0.5); m.quad2([x0 - 0.3, H + 2.55, z0 - 0.3], [x1 + 0.3, H + 2.55, z0 - 0.3], [x1 + 0.3, H + 2.15, z1 + 0.1], [x0 - 0.3, H + 2.15, z1 + 0.1]);
    m.push().T(-15, H, 29.9); Props.woodpile(m, 5, 5, 3.4); m.pop(); }
  { const lx = -7.1, lz = T.z0 + 0.9, m = M(lx, lz);                                    // the lookout corner: a spyglass on a tripod and a flag, over the market
    m.push().T(lx, H, lz); m.mat(MAT.TIMBER, COL.timberDark, 0.5);
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.4; m.beam([Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5], [0, 1.25, 0], 0.045, 0.045); }
    m.mat(MAT.METAL, [0.62, 0.46, 0.2], 0.4); m.beam([-0.45, 1.18, 0.35], [0.5, 1.42, -0.3], 0.1, 0.1); m.beam([0.5, 1.42, -0.3], [0.62, 1.46, -0.38], 0.14, 0.14);
    addCircleCollider(m, 0, 0, 0.5, 0, 1.4); m.pop();
    m.push().T(T.x1 - 0.6, H, T.z0 + 0.7); m.mat(MAT.TIMBER, COL.timberDark, 0.5); m.cbox(0, 0, 0, 0.11, 4.2, 0.11, 4); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.ball(0, 4.25, 0, 0.09, 0.09, 0.09, 6, 4);
    m.mat(MAT.CLOTH, [0.5, 0.13, 0.1], 0.5); m.quad2([0.05, 4.1, 0], [0.05, 3.45, 0], [1.1, 3.55, 0.15], [1.1, 4.05, 0.15]); addCircleCollider(m, 0, 0, 0.12, 0, 4); m.pop();
    World.interact.push({ p: [lx, H + 1.3, lz + 0.2], r: 2.4, zone: 0, kind: 'read', id: 'terrace.glass', title: 'A brass spyglass on a tripod', text: 'You put your eye to the glass. The whole market is laid out like a pinned map: the notice board, the well, the baker’s awning, a boy chasing a goose. Someone has scratched a tally of floods on the tripod leg. There are nine marks.' });
  }
  lvLift(touch, 1.0);
  World.places.push({ id: 'uward', name: 'Rowan’s Terrace', x: -21, z: 21, r: 13 });
  World.spots['terrace.view'] = { p: [-20, H, T.z0 + 1.4], yaw: 0, zone: 0 };
  World.levelsBuilt = (World.levelsBuilt || 0) + 1;
}

// Build 42: small fixes that need every builder to have run (called at the end of buildVillage)
function townFinish(bucket) {
  if (typeof buildRoutes === 'function') buildRoutes(bucket);      // Build 42: galleries, passage, bridge (73h_routes.js)
  if (typeof buildWalls === 'function') buildWalls(bucket);        // Build 42: palisades, gates, bell tower (73i_walls.js)
  // the chimney of in.04 stands 4 m below the terrace's north edge, where the camera looks straight at its smoke: the full-size puffs (1 m across) stack into a tall white sheet there.
  // A thin emitter (smaller, fainter, shorter-lived puffs, see 75_particles.js) makes it a wisp like the other infill chimneys.
  for (const e of World.emitters) if (e.type === 'smoke' && Math.abs(e.p[0] + 19.5) < 0.8 && Math.abs(e.p[2] - 4.1) < 0.8 && e.p[1] > 8) { e.thin = true; e.p[1] += 0.05; }
}
