// ───────────────────────── the town's walls and the watch tower (Build 42) ─────────────────────────
// d  a timber palisade with a wall walk along the north edge (z -58.7, from the north road west) and the east edge (x 72.7, from the bridge road north and south), a gate tower over
//    each road (a walk-through arch 3.8 m wide, the gate open, torches, a stair up on the town side, a roofed watch platform)
// e  the watch bell tower: an open timber frame with four switchback flights to a roofed platform 10.8 m up, the widest view in the valley
// Built on the helpers of 73h_routes.js (rtKit). Walk deck, palisade and rails follow the ground in 2 m pieces; every deck is a ramped World.floors entry.
function buildWalls(bucket) {
  if (TEST && TEST.levels === 0) return;
  const touch = new Map(), K = rtKit(bucket, touch), { M, col, box, beam, post, stair, dark, wood, gy } = K;
  K.fine = true; K.maxDist = 85; K.noShadow = true;       // the palisades and gate towers are hidden beyond 150 m (their 30 m cells)
  const roadAt = (id, axis, v) => { const L = INF.LN[id].p; for (let i = 0; i < L.length - 1; i++) { const a = L[i], b = L[i + 1], k = axis === 'z' ? 1 : 0, o = axis === 'z' ? 0 : 1; if ((a[k] - v) * (b[k] - v) <= 0 && a[k] !== b[k]) return a[o] + (b[o] - a[o]) * (v - a[k]) / (b[k] - a[k]); } return null; };
  // a wall run. P maps (u along, v across: 0 outside, + inside) to the world; axis 'x' or 'z' is the world axis that u runs along
  const wallRun = (id, axis, c, sgn, u0, u1, ug, o) => {
    const P = axis === 'x' ? (u, v) => [u, c + v * sgn] : (u, v) => [c + v * sgn, u], bx = (mat, col, tile, a0, y0, b0, a1, y1, b1, skip, ao) => { const p = P(a0, b0), q = P(a1, b1); return box(mat, col, tile, p[0], y0, p[1], q[0], y1, q[1], skip, ao); };
    const gnd = u => Math.max(gy(...P(u, 0)), gy(...P(u, 1.9))), N = Math.round((u1 - u0) / 2), Us = [], Ys = [], TW = 3.9, FLAT = (u) => Math.abs(u - ug) <= TW + 0.01;
    for (let i = 0; i <= N; i++) { const u = u0 + (u1 - u0) * i / N; Us.push(u); Ys.push(gnd(u) + 3.1); }
    // the tower's level: flat across it, at the highest ground under it plus 3.3
    let yT = -1e9; for (let u = ug - TW; u <= ug + TW; u += 0.5) yT = Math.max(yT, gnd(u)); yT += 3.3;
    // snap the node nearest each end of the tower to its level, then smooth the rest
    for (let it = 0; it < 4; it++) for (let i = 1; i < N; i++) { if (FLAT(Us[i])) continue; Ys[i] = Math.max(gnd(Us[i]) + 2.7, (Ys[i - 1] + Ys[i] * 2 + Ys[i + 1]) / 4); }
    for (let i = 0; i <= N; i++) if (FLAT(Us[i])) Ys[i] = yT;
    const yAt = u => { for (let i = 0; i < N; i++) if (u <= Us[i + 1] || i === N - 1) return Ys[i] + (Ys[i + 1] - Ys[i]) * clamp((u - Us[i]) / (Us[i + 1] - Us[i]), 0, 1); };
    // segments
    const tips = [];
    for (let i = 0; i < N; i++) {
      const a = Us[i], b = Us[i + 1], ya = Ys[i], yb = Ys[i + 1], lo = Math.min(ya, yb), hi = Math.max(ya, yb), g0 = Math.min(gy(...P(a, 0)), gy(...P(b, 0)), gy(...P(a, 1.5)), gy(...P(b, 1.5)));
      const p0 = P(a, 0.35), p1 = P(b, 1.85), mm = M((P(a, 0)[0] + P(b, 0)[0]) / 2, (P(a, 0)[1] + P(b, 0)[1]) / 2);
      // walk deck: a ramp, planks; the floor entry follows it
      { const q0 = P(a, 0.35), q1 = P(b, 1.85); lvFloor(Math.min(q0[0], q1[0]), Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), Math.max(q0[1], q1[1]), ya, yb, axis);
        const m = M(q0[0], q0[1]), c = P((a + b) / 2, 1.1); m.mat(MAT.PLANKS, wood, 0.55); const L = hyp(b - a, yb - ya);
        // a sloped box: four corners
        const A0 = P(a, 0.35), A1 = P(a, 1.85), B0 = P(b, 0.35), B1 = P(b, 1.85), t = 0.16;
        m.quad2([A0[0], ya, A0[1]], [A1[0], ya, A1[1]], [B1[0], yb, B1[1]], [B0[0], yb, B0[1]]); m.quad2([A0[0], ya - t, A0[1]], [A1[0], ya - t, A1[1]], [B1[0], yb - t, B1[1]], [B0[0], yb - t, B0[1]]);
        m.quad2([A0[0], ya - t, A0[1]], [A0[0], ya, A0[1]], [B0[0], yb, B0[1]], [B0[0], yb - t, B0[1]]); m.quad2([A1[0], ya - t, A1[1]], [A1[0], ya, A1[1]], [B1[0], yb, B1[1]], [B1[0], yb - t, B1[1]]); void c; void L; void p0; void p1; }
      // joist and bearer beams under the deck, a stilt at the inner edge every second piece
      { const s = P(a, 0.4), t = P(b, 0.4), s2 = P(a, 1.8), t2 = P(b, 1.8); K.beam([s[0], ya - 0.28, s[1]], [t[0], yb - 0.28, t[1]], 0.14, 0.18); K.beam([s2[0], ya - 0.28, s2[1]], [t2[0], yb - 0.28, t2[1]], 0.14, 0.18);
        if (i % 2 === 0) { const q = P(a, 1.8); K.post(q[0], q[1], gy(q[0], q[1]) - 0.4, ya - 0.1, 0.2, true); K.beam([q[0], ya - 0.3, q[1]], [P(a, 0.4)[0], ya - 0.3, P(a, 0.4)[1]], 0.1, 0.14); } }
      // the palisade: a plank wall from under the ground to 1.85 m over the deck, stepped to the ground, a coping rail and sharpened stakes
      { const top = hi + 1.85, e0 = P(a, 0), e1 = P(b, 0.36), mlo = Math.min(g0, lo - 3) - 0.8;
        box(MAT.PLANKS, [0.78, 0.7, 0.58], 0.5, e0[0], mlo, e0[1], e1[0], top, e1[1], 4 | 8);
        col(Math.min(e0[0], e1[0]), Math.min(e0[1], e1[1]), Math.max(e0[0], e1[0]), Math.max(e0[1], e1[1]), mlo, top);
        for (let u = a + 0.2; u < b - 0.05; u += 0.5) tips.push([u, top]); }
      // the inner rail, sloped
      { const s = P(a, 1.85), t = P(b, 1.85);
        for (const k of [0.5, 1.0]) K.beam([s[0], ya + k, s[1]], [t[0], yb + k, t[1]], 0.05, 0.06);
        const post0 = P(a, 1.85); K.post(post0[0], post0[1], ya - 0.1, ya + 1.08, 0.1, true);
        if (!(FLAT(a) && FLAT(b)) && !(o.noRail && o.noRail(a, b))) { const c0 = P(a, 1.9), c1 = P(b, 1.95); col(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]), lo - 0.05, hi + 1.15); } }
    }
    // stakes (one mesh, tiny gable prisms)
    { for (const [u, top] of tips) { const p = P(u, 0.0), m = M(p[0], p[1]); m.mat(MAT.TIMBER, [0.7, 0.64, 0.58], 0.5); const q0 = 0, q = P(u, 0.36), r = P(u + 0.22, 0.0), s = P(u + 0.22, 0.36), mid0 = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2], mid1 = [(q[0] + s[0]) / 2, (q[1] + s[1]) / 2], ty = top + 0.3;
        m.quad2([p[0], top, p[1]], [q[0], top, q[1]], [mid1[0], ty, mid1[1]], [mid0[0], ty, mid0[1]]); m.quad2([mid0[0], ty, mid0[1]], [mid1[0], ty, mid1[1]], [s[0], top, s[1]], [r[0], top, r[1]]); } }
    // ── the gate tower ──
    const Y = yT, a0 = ug - TW, a1 = ug - 1.9, b0 = ug + 1.9, b1 = ug + TW, V0 = -0.55, V1 = 3.4, gA = Math.min(gy(...P(ug, -0.2)), gy(...P(ug, 3.2)));
    for (const [s, e] of [[a0, a1], [b0, b1]]) { bx(MAT.STONE, [0.9, 0.87, 0.82], 0.7, s, gA - 1.0, V0, e, Y - 0.16, V1, 4 | 8); { const p = P(s, V0), q = P(e, V1); col(Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1]), gA - 1.0, Y); }
      bx(MAT.STONE, [0.84, 0.82, 0.78], 0.6, s - 0.08, Y - 0.34, V0 - 0.08, e + 0.08, Y - 0.16, V1 + 0.08, 4); }
    bx(MAT.TIMBER, dark, 0.5, a1 - 0.05, Y - 0.62, V0 + 0.15, b0 + 0.05, Y - 0.16, V1 - 0.15, 4);          // the lintel under the deck: the arch is 3.8 m wide and 2.7 m high, the road's width plus a cart's
    for (const v of [V0 + 0.1, V1 - 0.1]) { const p = P(a1 - 0.2, v), q = P(b0 + 0.2, v); K.beam([p[0], Y - 0.4, p[1]], [q[0], Y - 0.4, q[1]], 0.3, 0.46); }
    // deck over the whole tower (v from -0.5 to 3.4), the open gate leaves (hinged back flat on the faces), a plaque
    { const q0 = P(a0, V0), q1 = P(b1, V1); K.deck(Math.min(q0[0], q1[0]), Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), Math.max(q0[1], q1[1]), Y); }
    for (const sd of [-1, 1]) { const u = ug + sd * 1.95; bx(MAT.PLANKS, [0.5, 0.42, 0.34], 0.5, u - 0.05, gA, V0 + 0.2, u + 0.05, gA + 2.55, V0 + 1.6, 0, 1); for (const h of [0.4, 1.2, 2.0]) bx(MAT.PLAIN, [0.1, 0.09, 0.08], 0.5, u - 0.07, gA + h, V0 + 0.2, u + 0.07, gA + h + 0.1, V0 + 1.6, 0, 1); }
    // posts, roof, rails on the platform (open on the stair side and along the wall walk)
    const cps = [[ug - TW + 0.15, V0 + 0.2], [ug + TW - 0.15, V0 + 0.2], [ug - TW + 0.15, V1 - 0.2], [ug + TW - 0.15, V1 - 0.2]];
    for (const [u, v] of cps) { const p = P(u, v); K.post(p[0], p[1], Y, Y + 2.8, 0.22, true); }
    { const ye = Y + 2.8, yr = ye + 1.2, pA = P(ug - TW - 0.5, V0 - 0.6), pB = P(ug + TW + 0.5, V1 + 0.6), m = M((pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2);
      const vm = (V0 + V1) / 2, f = (u, v, y) => { const p = P(u, v); return [p[0], y, p[1]]; };
      m.mat(MAT.SHINGLE, [0.5, 0.45, 0.4], 0.5); m.quad2(f(ug - TW - 0.5, V0 - 0.6, ye), f(ug + TW + 0.5, V0 - 0.6, ye), f(ug + TW + 0.5, vm, yr), f(ug - TW - 0.5, vm, yr)); m.quad2(f(ug - TW - 0.5, vm, yr), f(ug + TW + 0.5, vm, yr), f(ug + TW + 0.5, V1 + 0.6, ye), f(ug - TW - 0.5, V1 + 0.6, ye));
      const e1 = f(ug - TW - 0.5, vm, yr), e2 = f(ug + TW + 0.5, vm, yr); K.beam([e1[0], yr + 0.02, e1[2]], [e2[0], yr + 0.02, e2[2]], 0.16, 0.14);
      for (const u of [ug - TW + 0.15, ug + TW - 0.15]) for (const v of [V0 + 0.2, V1 - 0.2]) { const p = P(u, v); void p; }
      for (const v of [V0 + 0.2, V1 - 0.2]) { const p = P(ug - TW + 0.15, v), q = P(ug + TW - 0.15, v); K.beam([p[0], ye, p[1]], [q[0], ye, q[1]], 0.18, 0.2); }
      for (const u of [ug - TW + 0.15, ug + TW - 0.15]) { const p = P(u, V0 + 0.2), q = P(u, V1 - 0.2); K.beam([p[0], ye, p[1]], [q[0], ye, q[1]], 0.18, 0.2); } }
    { const rl = (u0_, u1_, v) => { const p = P(u0_, v), q = P(u1_, v); for (const k of [0.5, 1.0]) K.beam([p[0], Y + k, p[1]], [q[0], Y + k, q[1]], 0.05, 0.06); const c0 = P(u0_, v - 0.07), c1 = P(u1_, v + 0.07); col(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]), Y - 0.05, Y + 1.15); };
      rl(a0 + 0.3, b1 - 0.3, V0 + 0.2);                                  // the outer rail (the palisade's own line continues on both sides)
      rl(a0 + 0.3, a0 + 2.2, V1 - 0.2);                                  // inner rail on the side away from the stair
      rl(a0 + 0.3, ug - 0.5, V1 - 0.2); }
    // torches on the gate faces and a lantern in the arch
    for (const sd of [-1, 1]) for (const v of [V0 - 0.04, V1 + 0.04]) { const p = P(ug + sd * 1.82, v); World.emitters.push({ type: 'torch', p: [p[0], gA + 2.2, p[1]], zone: 0, size: 0.2 }); const m = M(p[0], p[1]); m.mat(MAT.METAL, [0.14, 0.12, 0.1]); m.box(p[0] - 0.03, gA + 1.9, p[1] - 0.03, p[0] + 0.03, gA + 2.1, p[1] + 0.03); }
    { const p = P(ug, 1.45); K.lantern(p[0], Y - 0.9, p[1], 0.9); K.beam([p[0], Y - 0.62, p[1]], [p[0], Y - 0.9, p[1]], 0.03, 0.03); }
    // the stair up, on the inside beside the wall walk, rising toward the tower
    const sU0 = b1 + 5.2, sU1 = b1, sy0 = Math.min(gy(...P(sU0, 2.7)), gy(...P(sU0 - 0.5, 2.7))), sv0 = 2.0, sv1 = 3.4;
    { const pa = P(sU0, sv0), pb = P(sU1, sv1), pm = P(sU0, 2.7), ps = P(sU1, 2.7); void pa; void pb;
      // the stair is built in world axes: along u
      if (axis === 'x') stair('x', sU0, sy0, sU1, Y, Math.min(P(0, sv0)[1], P(0, sv1)[1]), Math.max(P(0, sv0)[1], P(0, sv1)[1]));
      else stair('z', sU0, sy0, sU1, Y, Math.min(P(0, sv0)[0], P(0, sv1)[0]), Math.max(P(0, sv0)[0], P(0, sv1)[0]));
      K.spot(id + '.bottom', pm[0], sy0, pm[1], 0); K.spot(id + '.top', ps[0], Y, ps[1], 0);
      const pl = P(sU0 + 0.3, 3.9); K.lantern(pl[0], sy0 + 2.3, pl[1]); const m = M(pl[0], pl[1]); m.mat(MAT.TIMBER, dark, 0.5); m.cbox(pl[0], sy0 - 0.2, pl[1], 0.14, 2.5, 0.14, 4); }
    return { P, Y, ug, u0, u1, sU0, sy0, yAt, sgn };
  };
  // ── the north wall: from the north road west, 30 m, its east end beside the road and a short stub east of the gate ──
  const zN = -58.7, xRoad = roadAt('north', 'z', zN + 1.5);
  const NW = wallRun('north', 'x', zN, 1, -30, 8, xRoad === null ? -8.1 : xRoad, {});
  // the wall's two ends: a corner post with a lantern on the west, a bastion stub on the east
  // ── the east wall: x 72.7, from the bridge road north (to z -46) and south (to z 24); the gate over the main road ──
  const xE = 72.7, zRoad = roadAt('main', 'x', xE - 1.5);
  const EW = wallRun('east', 'z', xE, -1, -46, 24, zRoad === null ? 1.2 : zRoad, {});
  // places and routes
  K.place('chapelgate', 'The Chapel Gate', NW.P(NW.ug, 1.4)[0], NW.P(NW.ug, 1.4)[1], 8); K.place('bridgegate', 'The Bridge Gate', EW.P(EW.ug, 1.4)[0], EW.P(EW.ug, 1.4)[1], 8);
  for (const [nm, W, ax] of [['northwall', NW, 'x'], ['eastwall', EW, 'z']]) {
    const P = W.P, st = P(W.sU0 + 0.9, 2.7), pts = [[st[0], W.sy0, st[1]]]; const top = P(W.ug + 4.2, 2.7); pts.push([P(W.sU0 - 0.4, 2.7)[0], W.sy0, P(W.sU0 - 0.4, 2.7)[1]]);
    pts.length = 0; const p0 = P(W.sU0 + 1.0, 2.7); pts.push([p0[0], W.sy0, p0[1]]); const p1 = P(W.sU0 - 1.0, 2.7); pts.push([p1[0], W.sy0 + 0.0, p1[1]]);
    const pt = P(W.ug + 3.4, 2.4); pts.push([pt[0], W.Y, pt[1]]); const pg = P(W.ug, 1.2); pts.push([pg[0], W.Y, pg[1]]); const pw = P(W.ug - 6.5, 1.1); pts.push([pw[0], W.yAt(W.ug - 6.5), pw[1]]); void top; void ax;
    K.route(nm, pts);
  }
  K.fine = false; K.maxDist = 0; K.noShadow = false; buildBell(K, touch);
  lvLift(touch, 0.4);
}
// ── the watch bell tower at (8, 19): four flights of 2.7 m in two lanes, landings alternate east and west ──
function buildBell(K, touch) {
  const { M, col, box, beam, post, stair, dark, wood, gy } = K, X0 = 6.4, X1 = 9.6, ZN0 = 17.6, ZN1 = 18.8, ZS0 = 19.2, ZS1 = 20.4, g = gy(8, 19), R = 2.7;
  const L = [g, g + R, g + 2 * R, g + 3 * R, g + 4 * R], WX0 = 5.1, EX1 = 10.9;
  // flights: F1 north lane west->east (L0->L1), F2 south east->west (L1->L2), F3 north west->east (L2->L3), F4 south east->west (L3->L4)
  stair('x', X0, L[0], X1, L[1], ZN0, ZN1); stair('x', X1, L[1], X0, L[2], ZS0, ZS1); stair('x', X0, L[2], X1, L[3], ZN0, ZN1); stair('x', X1, L[3], X0, L[4], ZS0, ZS1);
  // landings: west at L2 and L4 (the top), east at L1 and L3
  K.deck(WX0, ZN0, X0, ZS1, L[2]); K.deck(X1, ZN0, EX1, ZS1, L[1]); K.deck(X1, ZN0, EX1, ZS1, L[3]);
  // the top platform: west landing, the north lane and the east landing (the south lane is the stairwell)
  K.deck(WX0, ZN0, X0, ZS1, L[4]); K.deck(X0, ZN0 - 0.1, X1, ZN1 + 0.1, L[4]); K.deck(X1, ZN0, EX1, ZS1, L[4]);
  // the frame: four corner posts and mid posts to the roof, ties at every landing, braces
  const top = L[4] + 3.3, cx = [WX0 + 0.1, EX1 - 0.1, (WX0 + EX1) / 2], cz = [ZN0 - 0.1, ZS1 + 0.1];
  for (const x of [WX0 + 0.1, EX1 - 0.1]) for (const z of cz) post(x, z, gy(x, z) - 0.4, top, 0.3);
  post(X0, ZN0 - 0.1, gy(X0, ZN0) - 0.3, L[4] + 1.2, 0.2); post(X1, ZS1 + 0.1, gy(X1, ZS1) - 0.3, L[4] + 1.2, 0.2);
  for (let k = 0; k < 5; k++) for (const z of cz) beam([WX0, L[k] - 0.3, z], [EX1, L[k] - 0.3, z], 0.16, 0.22);
  for (const k of [0, 1, 2, 3]) for (const z of cz) { const x0 = k % 2 ? WX0 : EX1 - 3, x1 = k % 2 ? WX0 + 3 : EX1; beam([x0, L[k] - 0.2, z], [x1, L[k + 1] - 0.2, z], 0.12, 0.14); beam([x0, L[k + 1] - 0.2, z], [x1, L[k] - 0.2, z], 0.1, 0.12); }
  // the cladding (Build 42): a stone foot and weatherboard between the posts, slit windows at each landing, a door on the west: the frame reads as a tower from the square, not as scaffolding
  for (let k = 0; k < 4; k++) {
    const y0 = k === 0 ? g - 0.4 : L[k], y1 = L[k + 1] - 0.12, st = k === 0, mat = st ? MAT.STONE : MAT.PLANKS, c = st ? [0.86, 0.83, 0.78] : [0.8 - 0.02 * k, 0.75 - 0.02 * k, 0.69 - 0.02 * k];          // [fx1] weatherboard like the rest of the village, whole storeys with slit windows (the pale plaster slabs with open bands read as signboards on a scaffold)
    const ya = y0, yb = y1;
    box(mat, c, 0.5, WX0 + 0.02, ya, ZN0 - 0.2, EX1 - 0.02, yb, ZN0 - 0.12, 0); box(mat, c, 0.5, WX0 + 0.02, ya, ZS1 + 0.12, EX1 - 0.02, yb, ZS1 + 0.2, 0);
    box(mat, c, 0.5, EX1 - 0.1, ya, ZN0 - 0.12, EX1 - 0.02, yb, ZS1 + 0.12, 0);
    if (k === 0) { box(mat, c, 0.5, WX0 + 0.02, ya, ZN0 - 0.12, WX0 + 0.1, yb, ZN0 + 0.0, 0); box(mat, c, 0.5, WX0 + 0.02, ya, ZN0 + 1.25, WX0 + 0.1, yb, ZS1 + 0.12, 0); }
    else box(mat, c, 0.5, WX0 + 0.02, ya, ZN0 - 0.12, WX0 + 0.1, yb, ZS1 + 0.12, 0);
    // slit windows: a dark opening with a timber head and sill, three along the long faces, one on the east
    const sa = L[k] + 1.3, sb = L[k] + 1.9, dk = [0.05, 0.045, 0.04], xs = [WX0 + (EX1 - WX0) * 0.2, (WX0 + EX1) / 2, WX0 + (EX1 - WX0) * 0.8], zc = (ZN0 + ZS1) / 2;
    for (const x of xs) for (const [zf, o] of [[ZN0 - 0.2, -1], [ZS1 + 0.2, 1]]) {
      box(MAT.PLAIN, dk, 0.5, x - 0.16, sa, o < 0 ? zf - 0.03 : zf, x + 0.16, sb, o < 0 ? zf : zf + 0.03, 0);
      box(MAT.TIMBER, dark, 0.5, x - 0.24, sb, o < 0 ? zf - 0.06 : zf, x + 0.24, sb + 0.07, o < 0 ? zf : zf + 0.06, 0); box(MAT.TIMBER, dark, 0.5, x - 0.24, sa - 0.07, o < 0 ? zf - 0.06 : zf, x + 0.24, sa, o < 0 ? zf : zf + 0.06, 0);
    }
    box(MAT.PLAIN, dk, 0.5, EX1, sa, zc - 0.16, EX1 + 0.03 - 0.02, sb, zc + 0.16, 0);
  }
  box(MAT.STONE, [0.86, 0.83, 0.78], 0.5, WX0 + 0.02, g + 1.95, ZN0 + 0.0, WX0 + 0.1, g + 2.4, ZN0 + 1.25, 0);
  box(MAT.TIMBER, dark, 0.5, WX0 - 0.1, g + 2.3, ZN0 - 0.28, WX0 + 0.12, g + 2.42, ZS1 + 0.28, 0);     // the lintel course under the first storey
  box(MAT.TIMBER, dark, 0.5, WX0 - 0.35, L[4] + 0.0, ZN0 - 0.5, EX1 + 0.35, L[4] + 0.14, ZS1 + 0.5, 0);   // the bell-chamber floor jetty
  // railings round the top and the landings
  const rl = (a0, a1, c, y, alongZ) => K.rail(a0, a1, c, y, alongZ);
  rl(WX0, EX1, ZN0 - 0.1, L[4]); rl(X1, EX1, ZS1 + 0.1, L[4]); rl(WX0, X0, ZS1 + 0.1, L[4]); rl(ZN0, ZS1, WX0 + 0.1, L[4], true); rl(ZN0, ZS1, EX1 - 0.1, L[4], true);
  for (const k of [1, 2, 3]) { if (k === 2) { rl(ZN0, ZS1, WX0 + 0.1, L[k], true); rl(WX0, X0, ZN0 - 0.1, L[k]); rl(WX0, X0, ZS1 + 0.1, L[k]); } else { rl(ZN0, ZS1, EX1 - 0.1, L[k], true); rl(X1, EX1, ZN0 - 0.1, L[k]); rl(X1, EX1, ZS1 + 0.1, L[k]); } }
  // the hip roof, the bell, a tally board
  { const ye = top, yr = ye + 2.0, x0 = WX0 - 1.2, x1 = EX1 + 1.2, z0 = ZN0 - 1.3, z1 = ZS1 + 1.3, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, m = M(xm, zm); m.mat(MAT.SHINGLE, [0.62, 0.56, 0.5], 0.5);
    m.quad2([x0, ye, z0], [x1, ye, z0], [xm + 0.4, yr, zm], [xm - 0.4, yr, zm]); m.quad2([xm - 0.4, yr, zm], [xm + 0.4, yr, zm], [x1, ye, z1], [x0, ye, z1]);
    m.quad2([x0, ye, z0], [xm - 0.4, yr, zm], [xm - 0.4, yr, zm], [x0, ye, z1]); m.quad2([x1, ye, z0], [x1, ye, z1], [xm + 0.4, yr, zm], [xm + 0.4, yr, zm]);
    m.mat(MAT.TIMBER, dark, 0.5); m.cbox(xm, yr, zm, 0.12, 0.7, 0.12, 4);
    beam([WX0, top - 0.1, zm], [EX1, top - 0.1, zm], 0.2, 0.24);
    m.mat(MAT.METAL, [0.58, 0.42, 0.18], 0.4); m.push().T(xm, top - 1.45, zm); m.lathe([[0.14, 1.0], [0.2, 0.85], [0.34, 0.45], [0.5, 0.0], [0.45, -0.05]], 12, 0); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.ball(0, -0.18, 0, 0.07, 0.07, 0.07, 6, 4); m.pop();
    beam([xm, top - 0.1, zm], [xm, top - 0.45, zm], 0.05, 0.05); }
  K.lantern((WX0 + EX1) / 2 + 0.9, L[4] + 2.3, ZN0 + 0.1, 0.7); K.lantern(WX0 + 0.5, L[2] + 2.2, ZS1 - 0.2); K.lantern(EX1 - 0.5, L[1] + 2.2, ZN0 + 0.2);
  World.emitters.push({ type: 'torch', p: [WX0 + 0.3, L[4] + 1.6, ZN0 + 0.4], zone: 0, size: 0.18 });
  K.read(9.0, L[4] + 0.9, 18.0, 2.4, 'bell.view', 'The Watchman’s Mark', 'A compass rose burnt into the rail, and the watchman’s own notes beside it. NORTH: the chapel hill and the crag, and the old tower on its rock, with a thread of smoke. EAST: the river, the mill wheel turning, the bridge and its new gate. SOUTH: the roofs falling away to Mirrormere and the white of the Wharf. WEST: the road out, the smithy’s smoke, and the pass. At night you can count a dozen windows. By dawn, none.');
  K.read(5.9, L[2] + 0.9, 19.1, 2.3, 'bell.log', 'The watch log, nailed up', 'NIGHT THREE OF THE NEW MOON. FOUR LIGHTS ON THE PASS, NOT TRAVELLERS’. CAT ON THE GALLERY ROOF AGAIN. WHO IS LEAVING THE LOFT KEY UNDER THE POT? RELIEVED AT DAWN BY WREN, WHO SNORES. — signed with a tally of eleven marks.');
  K.pick('whistle2', 'whistle', [10.2, L[3] + 0.04, 19.9], 'Take the whistle', 'whistle', mm => { mm.mat(MAT.PLAIN, [0.85, 0.8, 0.68]); mm.cyl(0, 0.02, 0, 0.012, 0.012, 0.09, 6, 2); });
  K.place('belltower', 'The Watch Bell', 8, 19, 9); K.spot('belltower.top', 6.0, L[4], 19.0, -PI / 2); K.spot('belltower.bottom', 5.6, g, 18.2, PI / 2);
  K.route('belltower', [[5.6, g, 18.2], [6.5, g, 18.2], [9.3, L[1], 18.2], [10.2, L[1], 19.0], [10.2, L[1], 19.8], [9.3, L[1] + 0.3, 19.8], [6.7, L[2], 19.8], [5.8, L[2], 19.0], [5.8, L[2], 18.2], [6.7, L[2], 18.2], [9.3, L[3], 18.2], [10.2, L[3], 19.0], [10.2, L[3], 19.8], [9.3, L[3] + 0.3, 19.8], [6.7, L[4], 19.8], [5.8, L[4], 19.0], [9.0, L[4], 18.0]]);
}
