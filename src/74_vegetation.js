// ───────────────────────── trees, bushes and boulders (instanced) ─────────────────────────
// cell sizes (m) of the instanced groups: one draw per model per cell, so bigger cells mean fewer draws and coarser culling
const PINE_DROOP_TIERS = 0.15;     // fraction of the pine's height below which a bough has two segments (was 1: all of them)
const FAR_TREE_CELL = 400, ROCK_CELL = 110, ROCK_SEGS = [9, 6];      // boulder: segments round and from top to bottom (108 triangles; 8 x 5 is 80 but a big boulder seen up close shows its facets)
function buildVegetation() {
  const R = rng(9001), pack = new MeshPack();
  // leaf card helper: quad at centre c spanned by half-vectors a (u) and b (v), blob normal n
  const card = (m, c, a, b, n, u0, v0, u1, v1, ao0, ao1, w0, w1) => {
    const P = (su, sv) => [c[0] + a[0] * su + b[0] * sv, c[1] + a[1] * su + b[1] * sv, c[2] + a[2] * su + b[2] * sv];
    const p0 = P(-1, -1), p1 = P(1, -1), p2 = P(1, 1), p3 = P(-1, 1);
    m.wind = w0; const i0 = m.vert(p0[0], p0[1], p0[2], n[0], n[1], n[2], u0, v0, ao0), i1 = m.vert(p1[0], p1[1], p1[2], n[0], n[1], n[2], u1, v0, ao0);
    m.wind = w1; const i2 = m.vert(p2[0], p2[1], p2[2], n[0], n[1], n[2], u1, v1, ao1), i3 = m.vert(p3[0], p3[1], p3[2], n[0], n[1], n[2], u0, v1, ao1);
    m.tri(i0, i1, i2); m.tri(i0, i2, i3);
  };
  // ── pine ──
  const pineT = new Mesh(256), pineL = new Mesh(4096), pineF = new Mesh(64);
  pineT.m3 = 1; pineT.mat(MAT.BARK, [0.92, 0.86, 0.8]); pineT.ao = 0.8; pineT.grad = null;
  pineT.lathe([[0.30, -0.6], [0.22, 0.6], [0.18, 3], [0.11, 6.5], [0.05, 9.4], [0.015, 11.2]], 7, 0);
  pineL.m3 = 1; pineL.mat(MAT.PINE, [1, 1, 1]);
  const tiers = 13;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1), y = 1.7 + 8.9 * t, len = lerp(3.0, 0.6, Math.pow(t, 0.8)), k = t > 0.8 ? 4 : t > 0.4 ? 5 : 6, droop = lerp(0.46, 0.06, t), a0 = R() * TAU;
    for (let j = 0; j < k; j++) {
      const a = a0 + j * TAU / k + R.s() * 0.25, dx = Math.cos(a), dz = Math.sin(a), l2 = len * (0.85 + R() * 0.3);
      const out = [dx, 0, dz], side = [-dz, 0, dx], shade = lerp(0.72, 1.0, t) * (0.9 + R() * 0.2);
      pineL.col([shade, shade, shade]);
      const segs = t < PINE_DROOP_TIERS ? 2 : 1;       // the lower boughs get two segments so they can droop; the upper ones are one (this changes no random number drawn)
      for (let s = 0; s < segs; s++) {
        const f0 = s / segs, f1 = f0 + 1 / segs;
        const c0 = [dx * l2 * f0, y + l2 * (0.10 * Math.sin(f0 * PI) - droop * f0 * f0), dz * l2 * f0], c1 = [dx * l2 * f1, y + l2 * (0.10 * Math.sin(f1 * PI) - droop * f1 * f1), dz * l2 * f1];
        const mid = v3.scale(v3.add(c0, c1), 0.5), hv = v3.scale(v3.sub(c1, c0), 0.5), hw = l2 * 0.36;
        const n = v3.norm([dx * 0.55, 0.75, dz * 0.55]);
        card(pineL, mid, v3.scale(side, hw), hv, n, 0, f0, 1, f1, lerp(0.45, 0.85, f0) * lerp(0.75, 1, t), lerp(0.45, 0.85, f1) * lerp(0.75, 1, t) + 0.12, 0.15 + f0 * 0.8, 0.15 + f1 * 0.8);
        card(pineL, v3.add(mid, [0, -hw * 0.22, 0]), [0, hw * 0.62, 0], hv, v3.norm([dx * 0.4 + side[0] * 0.5, 0.6, dz * 0.4 + side[2] * 0.5]), 0, f0, 1, f1, lerp(0.4, 0.8, f0) * lerp(0.75, 1, t), lerp(0.4, 0.8, f1) * lerp(0.75, 1, t) + 0.1, 0.15 + f0 * 0.8, 0.15 + f1 * 0.8);
      }
    }
  }
  pineL.col([1, 1, 1]); for (let j = 0; j < 3; j++) { const a = j * TAU / 3; card(pineL, [0, 10.9, 0], [Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42], [0, 0.75, 0], [Math.cos(a + 1.57) * 0.5, 0.8, Math.sin(a + 1.57) * 0.5], 0, 0.25, 1, 1, 0.9, 1, 0.5, 1); }
  pineF.m3 = 2; pineF.mat(MAT.IMPOSTOR, [1, 1, 1]);
  for (let j = 0; j < 2; j++) { const ax = j ? [0, 0, 1] : [1, 0, 0], W = 2.9;
    const v = (s, yy, vv, ao) => pineF.vert(ax[0] * s * W, yy, ax[2] * s * W, ax[0] * s * 0.75, 0.55, ax[2] * s * 0.75, s * 0.5 + 0.5, vv, ao);
    const a = v(-1, 11.5, 0, 1), b = v(-1, -0.4, 1, 0.55), c = v(1, -0.4, 1, 0.55), d = v(1, 11.5, 0, 1); pineF.tri(a, b, c); pineF.tri(a, c, d); }
  // ── birch (and a far version) ──
  const leafBlob = (m, R2, cx, cy, cz, rx, ry, rz, n, size, col, windBase) => {
    for (let i = 0; i < n; i++) {
      let px, py, pz; do { px = R2.s(); py = R2.s(); pz = R2.s(); } while (px * px + py * py + pz * pz > 1);
      const c = [cx + px * rx, cy + py * ry, cz + pz * rz], nn = v3.norm([px * 1.0, py * 0.9 + 0.35, pz * 1.0]);
      const a1 = R2() * TAU, tilt = R2.s() * 0.9, s = size * (0.75 + R2() * 0.5);
      const a = [Math.cos(a1) * s, Math.sin(tilt) * s * 0.5, Math.sin(a1) * s], up = [-Math.sin(a1) * Math.sin(tilt) * s * 0.4, Math.cos(tilt) * s, Math.cos(a1) * Math.sin(tilt) * s * 0.4];
      const sh = 0.8 + R2() * 0.3; m.col([col[0] * sh, col[1] * sh, col[2] * sh]);
      const ao = clamp(0.62 + 0.38 * (py * 0.6 + 0.5) + 0.15 * hyp(px, pz), 0.4, 1);
      card(m, c, a, up, nn, 0, 0, 1, 1, ao, ao, windBase, windBase + 0.3);
    }
  };
  const birchT = new Mesh(512), birchL = new Mesh(2048), birchF = new Mesh(128);
  birchT.m3 = 1; birchT.mat(MAT.BIRCH, [1, 1, 1]); birchT.ao = 0.9;
  birchT.tube([[0, -0.5, 0], [0.06, 1.6, 0.02], [-0.05, 3.6, 0.1], [0.08, 5.6, 0.02], [0.0, 7.4, -0.05]], [0.19, 0.16, 0.12, 0.08, 0.035], 7);
  for (const [y, a] of [[3.8, 0.4], [4.7, 2.6], [5.5, 4.5], [6.2, 1.5]]) birchT.tube([[0, y, 0.05], [Math.cos(a) * 0.8, y + 1.0, Math.sin(a) * 0.8], [Math.cos(a) * 1.5, y + 1.9, Math.sin(a) * 1.5]], [0.07, 0.045, 0.015], 5);
  birchL.m3 = 1; birchL.mat(MAT.LEAVES, [1, 1, 1]);
  leafBlob(birchL, rng(31), 0, 6.9, 0, 2.3, 2.5, 2.3, 26, 1.0, [0.98, 0.80, 0.22], 0.5);
  birchF.m3 = 2;
  for (let j = 0; j < 2; j++) { const ax = j ? [0, 0, 1] : [1, 0, 0];
    birchF.mat(MAT.LEAVES, [0.98, 0.80, 0.22]); const v = (s, yy, vv) => birchF.vert(ax[0] * s * 2.7, yy, ax[2] * s * 2.7, ax[0] * s * 0.75, 0.55, ax[2] * s * 0.75, s * 0.5 + 0.5, vv, 0.9);
    let a = v(-1, 9.7, 0), b = v(-1, 4.1, 1), c = v(1, 4.1, 1), d = v(1, 9.7, 0); birchF.tri(a, b, c); birchF.tri(a, c, d);
    birchF.mat(MAT.BIRCH, [1, 1, 1]); const t = (s, yy, vv) => birchF.vert(ax[0] * s * 0.14, yy, ax[2] * s * 0.14, ax[0] * s, 0.3, ax[2] * s, s * 0.14 + 0.5, vv, 0.9);
    a = t(-1, 5.5, 0); b = t(-1, -0.4, 5.9); c = t(1, -0.4, 5.9); d = t(1, 5.5, 0); birchF.tri(a, b, c); birchF.tri(a, c, d); }
  // ── big oak ──
  const oakT = new Mesh(1024), oakL = new Mesh(4096);
  oakT.mat(MAT.BARK, [0.85, 0.8, 0.75], 1.5); oakT.ao = 0.75;
  oakT.tube([[0, -0.6, 0], [0.05, 1.2, 0], [-0.08, 2.6, 0.06], [0.05, 4.0, 0]], [0.75, 0.52, 0.46, 0.38], 10);
  const limbs = [[0.3, 4.6, 6.0], [1.5, 4.2, 5.5], [2.8, 4.9, 6.2], [4.0, 4.4, 5.4], [5.2, 4.8, 5.8], [0.9, 2.2, 7.8]];
  for (const [a, rr, yy] of limbs) oakT.tube([[0, 3.4, 0], [Math.cos(a) * rr * 0.35, 4.6, Math.sin(a) * rr * 0.35], [Math.cos(a) * rr * 0.75, yy - 0.5, Math.sin(a) * rr * 0.75], [Math.cos(a) * rr, yy, Math.sin(a) * rr]], [0.3, 0.2, 0.12, 0.04], 6);
  oakL.mat(MAT.LEAVES, [1, 1, 1]);
  const oR = rng(77);
  for (const [a, rr, yy] of limbs) leafBlob(oakL, oR, Math.cos(a) * rr * 0.85, yy + 0.4, Math.sin(a) * rr * 0.85, 2.3, 1.5, 2.3, 11, 1.25, [0.42, 0.56, 0.20], 0.4);
  leafBlob(oakL, oR, 0, 8.3, 0, 3.4, 1.7, 3.4, 16, 1.3, [0.46, 0.60, 0.22], 0.5);
  // ── bush ──
  const bushL = new Mesh(512); bushL.mat(MAT.LEAVES, [1, 1, 1]);
  leafBlob(bushL, rng(5), 0, 0.55, 0, 0.75, 0.5, 0.75, 9, 0.62, [0.40, 0.55, 0.22], 0.3);
  /* [fx3] a hedge clump: an irregular dark inner mass of few larger leaves and bare twigs, then many small cards (4-7 cm after scale) in uneven layers, light at the top only where it is thin, the foot left open so stems show */
  const hedgeL = new Mesh(2048); hedgeL.mat(MAT.LEAVES, [1, 1, 1]);
  { const hr = rng(8); leafBlob(hedgeL, hr, 0, 0.5, 0, 0.4, 0.32, 0.38, 6, 0.15, [0.17, 0.26, 0.10], 0.15);
    leafBlob(hedgeL, hr, 0.05, 0.56, -0.03, 0.52, 0.4, 0.48, 30, 0.085, [0.34, 0.5, 0.18], 0.3);
    leafBlob(hedgeL, hr, -0.1, 0.8, 0.05, 0.3, 0.2, 0.28, 6, 0.07, [0.42, 0.56, 0.22], 0.35); }
  // ── boulders ──
  // one boulder shape (vertex lod 3: the instance shader squashes it differently for every boulder), so boulders are one draw per cell, not three
  const rockAll = new Mesh(256);
  const rockM = [1].map((seed, kk) => {
    const m = rockAll, nu = ROCK_SEGS[0], nv = ROCK_SEGS[1]; m.mat(MAT.ROCK, [1, 1, 1], 0.7); m.m3 = 3 + kk;
    const rad = (a, b) => 1 + 0.32 * gnoise(Math.cos(a) * Math.sin(b) * 1.6 + seed * 7.1, Math.cos(b) * 1.6 + Math.sin(a) * Math.sin(b) * 1.6, seed) + 0.12 * gnoise(Math.cos(a) * Math.sin(b) * 4 + 3, Math.sin(a) * Math.sin(b) * 4 + Math.cos(b) * 4, seed + 9);
    const pos = (i, j) => { const a = -(i % nu) / nu * TAU, b = clamp(j / nv, 0.001, 0.999) * PI, r = rad(a, b); return [Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.62, Math.sin(b) * Math.sin(a) * r * 0.85]; };
    m.grid(nu, nv, (i, j) => { const p = pos(i, j), pa = pos(i + 1, j), pb = pos(i, Math.min(j + 1, nv)), pc = pos(i + nu - 1, j), pd = pos(i, Math.max(j - 1, 0));
      let n = v3.cross(v3.sub(pb, pd), v3.sub(pa, pc)); if (v3.dot(n, p) < 0) n = v3.scale(n, -1); n = v3.norm(v3.add(v3.norm(n), v3.scale(v3.norm(p), 0.6)));
      return m.vert(p[0], p[1], p[2], n[0], n[1], n[2], i / nu * 3, j / nv * 1.5, lerp(0.55, 1, sat(p[1] * 1.2 + 0.6))); });
    return m;
  });
  const I = { pineT: pack.add(pineT), pineL: pack.add(pineL), pineF: pack.add(pineF), birchT: pack.add(birchT), birchL: pack.add(birchL), birchF: pack.add(birchF), oakT: pack.add(oakT), oakL: pack.add(oakL), bush: pack.add(bushL), hedge: pack.add(hedgeL), rocks: pack.add(rockAll) };
  pack.upload('veg'); World.instPack = pack;

  // ── placement ──
  const inst = { pine: [], birch: [], oak: [], bush: [], hedge: [], rock: [] };
  const blocked = (x, z, pad) => {
    for (const s of SITES) { const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad + (s.porch || 0) + 2 && Math.abs(l[1]) < s.d / 2 + pad + 2) return true; }
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + pad) < r.w / 2 + pad) return true;
    for (const f of FIELDS) if (x > f.x0 - pad - 1 && x < f.x1 + pad + 1 && z > f.z0 - pad - 1 && z < f.z1 + pad + 1) return true;
    if (River.dist(x, z, 7 + pad) < 6.5 + pad) return true;
    if (hyp(x - LAKE.x, z - LAKE.z) < lakeR(x, z) + 2 + pad) return true;
    if (hyp((x - SQUARE.x) / (SQUARE.rx + 2), (z - SQUARE.z) / (SQUARE.rz + 2)) < 1) return true;
    if (typeof wildsBlocked === 'function' && wildsBlocked(x, z, pad)) return true;
    if (typeof wharfBlocked === 'function' && wharfBlocked(x, z, pad)) return true;
    return false;
  };
  const gy = (x, z) => Terrain.y(x, z);
  const addTree = (kind, x, z, scale) => {
    for (const c of World.colliders) if (c.r > 0.6 && c.y1 - c.y0 < 3 && Math.hypot(x - c.x, z - c.z) < c.r + (kind === 'oak' ? 0.7 : 0.3) * scale) return;      // [fx3] never a trunk through a boulder
    const y = gy(x, z);
    inst[kind].push([x, y - 0.05, z, scale, R() * TAU, R(), R(), 0]);
    if (hyp(x, z) < WORLD_RADIUS + 8) World.colliders.push({ x, z, r: (kind === 'oak' ? 0.7 : kind === 'pine' ? 0.27 : 0.2) * scale, y0: y - 1, y1: y + 6 });
  };
  addTree('oak', World.oakPos[0], World.oakPos[1], 1.0);
  { const p = siteToWorld(SITE.chapel, 5.5, -13.5); addTree('oak', p[0], p[1], 0.85); }
  addTree('oak', 88, -30, 0.9);
  for (const [k, x, z, s] of [['birch', -29, 9, 1], ['birch', 31, -17, 1.1], ['birch', -31, -27, 0.95], ['birch', 13, -33, 1.05], ['birch', 28, 25, 1], ['birch', -9, 35, 0.9], ['birch', 45, -9, 1.1], ['birch', -47, 7, 1], ['pine', -20, -33, 1.1], ['pine', 9, -36, 1.25], ['pine', -34, 31, 1.0], ['birch', 47, 20, 1.0], ['birch', 50, 34, 0.9], ['birch', 66, 40, 1.05], ['birch', 30, 70, 1], ['birch', -22, 60, 1.1], ['pine', 40, -40, 1.2], ['birch', 74, -12, 1], ['birch', -6, -44, 0.95]]) if (!blocked(x, z, 0.5)) addTree(k, x, z, s);
  // autumn birches standing in the courts behind the infill houses
  if (typeof INF !== 'undefined') { let nb = 0; for (const h of INF.houses) { if (nb >= 8 || R() > 0.38) continue; const lx = R.s() * h.w * 0.3, p = siteToWorld(h, lx, h.d / 2 + 2.1 + R() * 0.6); if (hyp(p[0] - SQUARE.x, p[1] - SQUARE.z) < 22 || blocked(p[0], p[1], 1.9)) continue; addTree('birch', p[0], p[1], 0.78 + R() * 0.3); nb++; } }
  const cell = 7.5, ext = 430;
  for (let gz = -ext; gz < ext; gz += cell) for (let gx = -ext; gx < ext; gx += cell) {
    const x = gx + R() * cell, z = gz + R() * cell, r = hyp(x, z);
    if (r < 56 || r > ext) continue;
    let dens = (0.10 + 0.62 * smooth(62, 135, r)) * smooth(-0.35, 0.15, fbm(x / 70 + 5, z / 70, 3, 23) + 0.25 * smooth(100, 180, r));
    const farm = smooth(60, 110, x) * smooth(60, -10, Math.abs(z)); dens *= 1 - 0.85 * farm;
    if (typeof wildsDens === 'function') dens *= wildsDens(x, z);
    if (R() > dens) continue;
    if (r < 200 && blocked(x, z, 1.5)) continue;
    const y = gy(x, z); if (y > 205 || y < LAKE.y + 0.3) continue;
    const e = 2.5, sl = Math.max(Math.abs(gy(x + e, z) - y), Math.abs(gy(x, z + e) - y)) / e; if (sl > 0.85) continue;
    const birchP = r < 150 ? 0.34 : 0.07;
    if (R() < birchP) addTree('birch', x, z, 0.8 + R() * 0.45); else addTree('pine', x, z, (0.75 + R() * 0.7) * (y > 150 ? 0.75 : 1));
  }
  // bushes and boulders
  for (let i = 0; i < 700; i++) {
    const a = R() * TAU, r = 26 + Math.pow(R(), 0.7) * 160, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 0.3) || placeW(x, z, 2.5) > 0) continue;
    inst.bush.push([x, Terrain.y(x, z) - 0.05, z, 0.5 + R() * 0.65, R() * TAU, R(), R(), 0]);
  }
  for (const s of SITES) { if (!HOUSES[s.id] || s.id === 'barn') continue; for (let k = 0; k < 5; k++) { const side = R() < 0.5 ? -1 : 1, lx = R.s() * s.w * 0.45, p = siteToWorld(s, lx, side * (s.d / 2 + 0.8)); const dl = siteDoorLocal(s, 0); if (placeW(p[0], p[1], 2.5) > 0 || hyp(lx - dl[0], side * (s.d / 2) - dl[1]) < 1.8 || s.id === 'smithy' && side < 0) continue; inst.bush.push([p[0], Terrain.y(p[0], p[1]) - 0.05, p[1], 0.45 + R() * 0.4, R() * TAU, R(), R(), 0]); } }
  for (const g of World.hedgeBushes || []) { const h = Math.abs(Math.sin(g[0] * 12.9898 + g[1] * 78.233)) % 1; if (h < 0.22) continue; inst.bush.push([g[0], Terrain.y(g[0], g[1]) - 0.05, g[1], g[2] * 1.12, h * TAU, h, (h * 7) % 1, 0]); }      /* [fx3] a fifth fewer clumps, each a little bigger: the hedge still has no gaps a person can see, the Low triangle budget gets back its share */
  for (const t of (World.orchardTrees || []).filter((q, i) => i % 2 === 0)) { const h = Math.abs(Math.sin(t[0] * 12.9898 + t[1] * 78.233)) % 1, y = gy(t[0], t[1]); inst.birch.push([t[0], y - 0.05, t[1], t[2], h * TAU, h, (h * 7) % 1, 0]); World.colliders.push({ x: t[0], z: t[1], r: 0.2 * t[2], y0: y - 1, y1: y + 6 }); }
  for (const t of World.wharfTrees || []) { const h = Math.abs(Math.sin(t[0] * 12.9898 + t[1] * 78.233)) % 1, y = gy(t[0], t[1]); inst[t[2]].push([t[0], y - 0.05, t[1], t[3], h * TAU, h, (h * 7) % 1, 0]);      /* [fx3] Low draws half the Wharfside trees (colliders stay) */ World.colliders.push({ x: t[0], z: t[1], r: (t[2] === 'oak' ? 0.7 : 0.2) * t[3], y0: y - 1, y1: y + 6 }); }
  for (const g of World.wharfPlants || []) { const h = Math.abs(Math.sin(g[0] * 12.9898 + g[1] * 78.233)) % 1; if (h < 0.45) continue; inst.bush.push([g[0], Terrain.y(g[0], g[1]) - 0.02, g[1], 0.42 + h * 0.15, h * TAU, g[2] * 0.45, (h * 7) % 1, 0]); }
  for (const g of World.gardenPlants || []) if (placeW(g[0], g[1], 2.5) <= 0) inst.bush.push([g[0], Terrain.y(g[0], g[1]) - 0.02, g[1], 0.42 + R() * 0.15, R() * TAU, g[2] * 0.45, R(), 0]);
  const colHit = (x, z, r) => { for (const c of World.colliders) { if (c.r !== undefined) { if (Math.hypot(x - c.x, z - c.z) < c.r + r * 0.7) return true; continue; } const dx = (x - c.x) * c.ax + (z - c.z) * c.az, dz = (x - c.x) * c.bx + (z - c.z) * c.bz; if (Math.hypot(Math.max(Math.abs(dx) - c.hx, 0), Math.max(Math.abs(dz) - c.hz, 0)) < r * 0.7) return true; } return false; };   // [fx1] a boulder never settles on a wall, a post or a building laid down before it
  const addRock = (x, z, s) => { if (s > 0.6 && colHit(x, z, 0.78 * s)) return; const y = gy(x, z); inst.rock.push([x, y - 0.22 * s, z, s, R() * TAU, R(), R(), 0]); if (s > 0.8 && hyp(x, z) < WORLD_RADIUS + 5) World.colliders.push({ x, z, r: 0.78 * s, y0: y - 1, y1: y + 0.9 * s }); };
  for (let i = 0; i < 420; i++) {
    const a = R() * TAU, r = 30 + R() * 210, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (r < 200 && blocked(x, z, 1.0)) continue;
    addRock(x, z, 0.25 + Math.pow(R(), 2.2) * 2.0);
  }
  for (let s = 20; s < River.len - 30; s += 4.5) { const p = River.point(s); if (hyp(p[0], p[1]) > 200) continue; for (const side of [-1, 1]) { if (R() < 0.6) continue; const o = 4.6 + R() * 2.2, x = p[0] - p[3] * o * side, z = p[1] + p[2] * o * side; if (Math.abs(x - BRIDGE.x) < 10 && Math.abs(z - BRIDGE.z) < 5) continue; if (Roads.some(r => r.path && r.line.dist(x, z, 3) < 2.6)) continue; /* Build 33: nothing on a wilds path or footbridge approach */ if (SITES.some(st => { const l = worldToSite(st, x, z); return Math.abs(l[0]) < st.w / 2 + 2.5 && Math.abs(l[1]) < st.d / 2 + 2.5; })) continue; addRock(x, z, 0.3 + R() * 0.8); } }
  for (let i = 0; i < 40; i++) { const a = R() * TAU, r = 7 + R() * 16, x = SITE.tower.x + Math.cos(a) * r, z = SITE.tower.z + Math.sin(a) * r; if (Roads[2].line.dist(x, z, 3) < 2.5) continue; addRock(x, z, 0.4 + R() * 1.6); }
  for (const [k, x, z, s] of LV.trees) addTree(k, x, z, s);          // Build 33: the oak in the terrace garden (73f_levels.js)
  World.vegInst = inst;
  // ── bucket instances into cells, upload, register draw groups ──
  const mkGroups = (arr, defs, CS) => {
    if (!arr.length) return;
    CS = CS || 48;
    const cells = new Map();
    for (const it of arr) { const k = Math.floor(it[0] / CS) + ',' + Math.floor(it[2] / CS); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(it); }
    const data = new Float32Array(arr.length * 8), list = []; let n = 0;
    for (const c of cells.values()) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let q = 0; q < c.length; q++) { const it = c[q]; data.set(it, (n + q) * 8); x0 = Math.min(x0, it[0]); x1 = Math.max(x1, it[0]); y0 = Math.min(y0, it[1]); y1 = Math.max(y1, it[1] + 12 * it[3]); z0 = Math.min(z0, it[2]); z1 = Math.max(z1, it[2]); }
      list.push({ first: n, count: c.length, c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], r: 0.5 * hyp(x1 - x0, y1 - y0, z1 - z0) + 7 }); n += c.length;
    }
    const ibuf = data;
    for (const g of defs) World.instGroups.push(Object.assign({ ibuf, cells: list, first: g.item.first, count: g.item.count, base: g.item.base, shadow: true }, g));
  };
  // conifers and birches: the scanned trees (74b_trees.js) take the planted positions; the generated ones only stand in if those files failed to load
  if (typeof Trees !== 'undefined' && Trees.ready) Trees.plant(inst);
  else {
    mkGroups(inst.pine, [{ item: I.pineT, kind: 'opaque', lod: 1 }, { item: I.pineL, kind: 'leaf', lod: 1 }], 48);
    mkGroups(inst.pine, [{ item: I.pineF, kind: 'leaf', lod: 2, nearOnly: false }], FAR_TREE_CELL);
    mkGroups(inst.birch, [{ item: I.birchT, kind: 'opaque', lod: 1 }, { item: I.birchL, kind: 'leaf', lod: 1 }], 48);
    mkGroups(inst.birch, [{ item: I.birchF, kind: 'leaf', lod: 2 }], FAR_TREE_CELL);
  }
  mkGroups(inst.oak, [{ item: I.oakT, kind: 'opaque', lod: 0 }, { item: I.oakL, kind: 'leaf', lod: 0 }], 400);
  /* [fx3] Chapelgate approach: old trees along the hedged way from the north gate to the lych gate, and yews in the churchyard (dark conifers kept small) */
  for (const [x, z, k, sc] of [[-11.5, -62.6, 'oak', 0.8], [-3.4, -66.2, 'oak', 0.75], [-12.3, -70.4, 'birch', 1.0]]) if (!blocked(x, z, 0.5)) addTree(k, x, z, sc);
  for (const [x, z, k, sc] of World.yardTrees || []) addTree(k, x, z, sc);      /* [fx3] fruit trees in the yards where deleted shells stood */
  /* [fx3] the hedge along the way to the lych gate: overlapping clumps of uneven size on a low bank, with a few saplings grown out of it */
  for (const h of World.hedgeClumps || []) inst.hedge.push([h[0], h[1], h[2], h[3], h[4], h[5], h[6], 0]);
  for (const [x, z] of World.hedgeSaplings || []) addTree('birch', x, z, 0.32);
  mkGroups(inst.bush, [{ item: I.bush, kind: 'leaf', lod: 0, maxDist: 80, shadow: false }], 80);
  mkGroups(inst.hedge, [{ item: I.hedge, kind: 'leaf', lod: 0, maxDist: 70, shadow: false }], 70);
  mkGroups(inst.rock, [{ item: I.rocks, kind: 'opaque', lod: 0, maxDist: 170, nearOnly: true }], ROCK_CELL);
  World.treeCount = inst.pine.length + inst.birch.length;
  World.treePos = { pine: inst.pine, birch: inst.birch, oak: inst.oak };      // [ui] read by the map (86_map.js)
}
