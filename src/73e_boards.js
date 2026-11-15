// ───────────────────────── boardwalks: raised plank walks with post-and-rail fences, a footbridge, jetties, a round roofed well ─────────────────────────
// Generated meshes (the village's own wood and stone materials) merged into the village cells through the `bucket` of buildVillage. Every walkable
// surface is registered with addFloor like the stone bridge's, every rail with a box collider.
let BW = { walks: 0, tris: 0 };
function bwDeckY(p, hw, lift) { let g = Terrain.y(p[0], p[1]); for (const [dx, dz] of [[hw, 0], [-hw, 0], [0, hw], [0, -hw]]) g = Math.max(g, Terrain.y(p[0] + dx, p[1] + dz)); return g + lift; }
// a walk along a polyline. o: w width, lift above the ground, rails [left, right] (+1: on), deckY(p, i) override, piles: posts down to the ground, ramp: slope the ends down to the ground,
// railOff(i): true where the fence is left open, col tint
function bwWalk(bucket, pts, o) {
  o = Object.assign({}, o || {});
  // never fence across the way to a house door: leave the rail open on any stretch close to a building that can be entered
  { const ro = o.railOff; o.railOff = i => (ro && ro(i)) || (P[i] && SITES.some(st => !st.shell && hyp(st.x - P[i][0], st.z - P[i][1]) < Math.max(st.w, st.d) * 0.5 + 5.5)); }
  const hw = (o.w || 1.5) / 2, lift = o.lift === undefined ? 0.3 : o.lift, rails = o.rails || [1, 1], col = o.col || [0.62, 0.56, 0.5], P = [];
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(hyp(b[0] - a[0], b[1] - a[1]) / (o.seg || 2.4))); for (let k = 0; k < n; k++) P.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
  P.push(pts[pts.length - 1].slice());
  let Y = P.map((p, i) => o.deckY ? o.deckY(p, i, P) : bwDeckY(p, hw, lift));
  if (!o.deckY) for (let it = 0; it < 3; it++) Y = Y.map((y, i) => Math.max(bwDeckY(P[i], hw, 0.12), (Y[Math.max(0, i - 1)] + y * 2 + Y[Math.min(Y.length - 1, i + 1)]) / 4));
  // ramps: one more short run at each end that comes down to the ground
  if (o.ramp) {
    const t0 = [P[0][0] - P[1][0], P[0][1] - P[1][1]], l0 = hyp(t0[0], t0[1]) || 1, t1 = [P[P.length - 1][0] - P[P.length - 2][0], P[P.length - 1][1] - P[P.length - 2][1]], l1 = hyp(t1[0], t1[1]) || 1, rl = o.ramp;
    const a = [P[0][0] + t0[0] / l0 * rl, P[0][1] + t0[1] / l0 * rl], b = [P[P.length - 1][0] + t1[0] / l1 * rl, P[P.length - 1][1] + t1[1] / l1 * rl];
    P.unshift(a); Y.unshift(Terrain.y(a[0], a[1]) + 0.04); P.push(b); Y.push(Terrain.y(b[0], b[1]) + 0.04);
  }
  const first = o.ramp ? 1 : 0, last = o.ramp ? P.length - 2 : P.length - 1;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], ya = Y[i], yb = Y[i + 1], L = hyp(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, l = L / 2 + 0.04, m = bucket(mx, mz), ramp = i < first || i >= last;
    m.m1 = 0; m.ao = 1; m.grad = null; m.push().T(mx, 0, mz).RY(-ang);
    m.mat(MAT.PLANKS, col, 0.55); m.beam([-l, ya - 0.08, 0], [l, yb - 0.08, 0], hw * 2, 0.16);
    addFloor(m, -L / 2, -hw, L / 2, hw, ya, yb, 'x');
    if (!ramp) {
      m.mat(MAT.TIMBER, COL.timberDark);
      for (const s of [-1, 1]) {
        if (!(rails[s > 0 ? 1 : 0]) && !(o.railSide && o.railSide(i, s, P))) continue; if (o.railOff && o.railOff(i)) continue;
        const z = s * (hw - 0.05); m.beam([-l, ya + 0.5, z], [l, yb + 0.5, z], 0.05, 0.1); m.beam([-l, ya + 0.95, z], [l, yb + 0.95, z], 0.06, 0.1);
        addBoxCollider(m, -l, z - 0.07, l, z + 0.07, Math.min(ya, yb) - 0.05, Math.max(ya, yb) + 1.15);
      }
    }
    m.pop();
    // posts at the joint (a): rail posts above the deck, piles below it
    const mp = bucket(a[0], a[1]); mp.m1 = 0; mp.ao = 1; mp.grad = null; mp.push().T(a[0], 0, a[1]).RY(-ang); mp.mat(MAT.TIMBER, COL.timberDark);
    for (const s of [-1, 1]) {
      const z = s * (hw - 0.05), g = Terrain.y(a[0] - Math.sin(ang) * z, a[1] + Math.cos(ang) * z), on = !ramp && (rails[s > 0 ? 1 : 0] || (o.railSide && o.railSide(i, s, P))) && !(o.railOff && o.railOff(i));
      if (on) mp.cbox(0, ya - 0.1, z, 0.11, 1.12, 0.11, 4);
      if (o.piles !== false && ya - g > 0.35) mp.cbox(0, g - 0.35, z, 0.16, ya - g + 0.3, 0.16, 4);
    }
    mp.pop();
    BW.tris += 70;
  }
  // the last post
  { const a = P[P.length - 1], ya = Y[Y.length - 1], ang = Math.atan2(a[1] - P[P.length - 2][1], a[0] - P[P.length - 2][0]), mp = bucket(a[0], a[1]); mp.m1 = 0; mp.ao = 1; mp.grad = null; mp.push().T(a[0], 0, a[1]).RY(-ang); mp.mat(MAT.TIMBER, COL.timberDark);
    for (const s of [-1, 1]) { const z = s * (hw - 0.05), g = Terrain.y(a[0] - Math.sin(ang) * z, a[1] + Math.cos(ang) * z); if (!o.ramp && (rails[s > 0 ? 1 : 0] || (o.railSide && o.railSide(P.length - 1, s, P)))) mp.cbox(0, ya - 0.1, z, 0.11, 1.12, 0.11, 4); if (o.piles !== false && ya - g > 0.35) mp.cbox(0, g - 0.35, z, 0.16, ya - g + 0.3, 0.16, 4); } mp.pop(); }
  BW.walks++;
  return { P, Y };
}
// a round stone well with four posts and a conical shingle roof
function wellRound(m) {
  m.mat(MAT.STONE, [1, 1, 1], 0.7); m.lathe([[1.05, -0.4], [1.05, 0.88], [0.97, 0.95], [0.72, 0.95], [0.72, -0.4]], 16, 0);
  m.mat(MAT.PLAIN, [0.05, 0.09, 0.10]); m.disc(0, 0.15, 0, 0.72, 14, 1);
  m.mat(MAT.TIMBER, COL.timber);
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4, x = Math.cos(a) * 0.98, z = Math.sin(a) * 0.98; m.cbox(x, 0.85, z, 0.15, 1.85, 0.15, 4); }
  for (let k = 0; k < 4; k++) { const a0 = k * PI / 2 + PI / 4, a1 = a0 + PI / 2; m.beam([Math.cos(a0) * 0.98, 2.55, Math.sin(a0) * 0.98], [Math.cos(a1) * 0.98, 2.55, Math.sin(a1) * 0.98], 0.11, 0.14); }
  m.beam([-0.98, 2.0, 0], [0.98, 2.0, 0], 0.09, 0.1);
  m.push().T(0, 2.0, 0).RZ(PI / 2).T(0, -0.7, 0); m.mat(MAT.TIMBER, COL.wood); m.cyl(0, 0, 0, 0.08, 0.08, 1.4, 8, 3); m.pop();
  m.mat(MAT.CLOTH, [0.6, 0.5, 0.35], 0.3); m.box(-0.012, 1.0, -0.012, 0.012, 1.95, 0.012);
  m.push().T(0.0, 0.95, 0); m.mat(MAT.PLANKS, COL.wood, 0.4); m.lathe([[0.13, 0], [0.17, 0.26]], 9, 1); m.pop();
  // cone roof, shingles in dark grey-brown, a little finial
  m.mat(MAT.SHINGLE, [0.6, 0.56, 0.52], 0.6); m.lathe([[1.75, 2.42], [1.62, 2.52], [0.05, 3.75]], 14, 0);
  m.mat(MAT.SHINGLE, [0.5, 0.46, 0.42], 0.6); m.lathe([[1.75, 2.42], [0.05, 3.75]].map(p => [p[0] * 0.98, p[1] - 0.04]), 14, 0);
  m.mat(MAT.TIMBER, COL.timberDark); m.cyl(0, 3.7, 0, 0.05, 0.02, 0.5, 6, 2);
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; m.beam([Math.cos(a) * 0.98, 2.5, Math.sin(a) * 0.98], [0, 3.55, 0], 0.07, 0.08); }
  addCircleCollider(m, 0, 0, 1.1, 0, 1.2);
}

function buildBoards(bucket, fence, R) {
  if (TEST && TEST.boards === 0) return;
  // a point on the river's west bank at height z, `off` metres from its centre line (negative: the east bank)
  const bankPt = (z, off) => { River.dist(55, z, 60); const at = River.at, p = River.point(at), nx = -p[3], nz = p[2], sg = nx < 0 ? 1 : -1; return [p[0] + nx * sg * off, p[1] + nz * sg * off]; };
  const alongBank = (zA, zB, off) => { const pts = [], n = Math.max(1, Math.ceil(Math.abs(zB - zA) / 3)); for (let i = 0; i <= n; i++) pts.push(bankPt(zA + (zB - zA) * i / n, off)); return pts; };
  // ── the river promenade: a raised walk along the west bank behind the alley, post-and-rail on the water side. North run, then (south of the road) a run that carries on over the river as a footbridge to the mill road ──
  bwWalk(bucket, alongBank(-27, -4.2, 7.0), { w: 1.7, lift: 0.34, rails: [1, 0], ramp: 1.3 });
  {
    const pts = alongBank(7.2, 13, 7.0).concat([bankPt(14, 3.5), bankPt(14, 0), bankPt(14, -3.5), bankPt(14, -7.5)]);
    const riverDeck = p => { const d = River.dist(p[0], p[1], 40), wy = riverY(River.at), bank = wy + 0.75 + 0.36; return bank + (d < 7 ? 0.5 * (1 - Math.pow(d / 7, 2)) : 0); };
    bwWalk(bucket, pts, { w: 1.6, rails: [0, 0], ramp: 1.4, deckY: riverDeck, seg: 2.0, railSide: (i, s, P) => River.dist(P[i][0], P[i][1], 40) < 7.4 || s < 0 });
  }
  // dry-stone walls: the back-yard wall behind the promenade (with a gap for the lane), and wing walls at the footbridge's west end
  { const w1 = alongBank(-27, -12, 9.6); fence(w1, { stone: true }); }
  // ── the fisher's pier: a short pier on piles straight out from the cabin's door side into the water. Planks only where there is water or mud under them; rails only on the water side. ──
  {
    const fs = SITES.find(q => q.id === 'fisher');
    if (fs) {
      const fx = Math.sin(fs.yaw), fz = -Math.cos(fs.yaw), p0 = [fs.x + fx * (fs.d / 2 + 1.8), fs.z + fz * (fs.d / 2 + 1.8)];
      let ux = LAKE.x - p0[0], uz = LAKE.z - p0[1]; const ul = hyp(ux, uz); ux /= ul; uz /= ul;
      // the shore: first point from the door heading for the lake that is under the wet line
      let t = 0; while (t < 40 && hyp(p0[0] + ux * t - LAKE.x, p0[1] + uz * t - LAKE.z) > LAKE.r - 0.3) t += 0.25;
      const q = [p0[0] + ux * t, p0[1] + uz * t], A = [p0[0], p0[1]], B = [q[0] + ux * 6.5, q[1] + uz * 6.5];
      const wet = P => hyp(P[0] - LAKE.x, P[1] - LAKE.z) < LAKE.r + 0.2;
      const r = bwWalk(bucket, [A, B], { w: 1.3, rails: [0, 0], seg: 1.8, ramp: 0.0, piles: true, deckY: p => Math.max(LAKE.y + 0.55, Terrain.y(p[0], p[1]) + 0.4), railSide: (i, s2, P) => wet(P[i]) && wet(P[Math.min(P.length - 1, i + 1)]) && hyp(P[i][0] - q[0], P[i][1] - q[1]) > 0.3, railOff: () => false });
      BW.fisher = { p0, q, A, B, u: [ux, uz] };
      // two mooring posts at the head and a lantern post on the landward side of the head (on the deck's edge, not in open water)
      const m = bucket(B[0], B[1]); m.m1 = 0; m.ao = 1; m.grad = null; m.mat(MAT.TIMBER, COL.timberDark);
      for (const sx of [-1, 1]) m.cbox(B[0] - uz * sx * 0.85, LAKE.y - 1.0, B[1] + ux * sx * 0.85, 0.16, 2.0, 0.16, 4);
    }
  }
}
