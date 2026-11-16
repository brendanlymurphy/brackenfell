// ───────────────────────── lanes worth walking (Build 42) ─────────────────────────
// The dense infill leaves narrow lanes (1.7 to 2.3 m) between facing rows. This finds them, makes three of them distinct (a stepped lane, a lane under washing lines with an upper floor that
// closes the sky, a dead end with a hidden yard and something to take) and puts something at eye level every few metres in all of them (a water butt, a shrine niche, a door with a sign, a cat,
// a barrow). Everything asks KEEP.hit first (nothing in a door's approach strip or on a road's centre line) and is merged into the village cells through `bucket`.
function buildLanes(bucket) {
  if (TEST && TEST.levels === 0) return;
  const touch = new Map(), K = rtKit(bucket, touch), { M, col, box, beam, post, dark, wood, gy } = K, rr = rng(5151); K.fine = true; K.maxDist = 40; K.noShadow = true;
  const hs = INF.houses.filter(h => h.block && Math.abs(Math.sin(h.yaw)) < 0.1), ext = s => ({ x0: s.x - s.w / 2, x1: s.x + s.w / 2, z0: s.z - s.d / 2, z1: s.z + s.d / 2 });
  const lanes = [];
  for (const a of hs) for (const b of hs) {
    if (a === b) continue; const A = ext(a), B = ext(b), gap = B.z0 - A.z1; if (gap < 1.5 || gap > 3.1) continue;
    const x0 = Math.max(A.x0, B.x0) + 0.2, x1 = Math.min(A.x1, B.x1) - 0.2; if (x1 - x0 < 3.2) continue;
    let ok = true; for (const s of SITES) { if (s === SITE[a.id] || s === SITE[b.id] || !s.w) continue; if (Math.abs(Math.sin(s.yaw)) > 0.1 && Math.abs(Math.cos(s.yaw)) > 0.1) continue; const S = ext(s); if (S.x1 > x0 && S.x0 < x1 && S.z1 > A.z1 + 0.05 && S.z0 < B.z0 - 0.05) ok = false; }
    if (ok) lanes.push({ a, b, A, B, x0, x1, zc: (A.z1 + B.z0) / 2, gap, len: x1 - x0, block: a.block, floors: Math.min(a.floors, b.floors), n: 0 });
  }
  INF.lanes = lanes;
  const strip = (l, u0, u1) => { for (let u = u0; u <= u1; u += 0.5) for (const dz of [-0.6, 0, 0.6]) if (KEEP.hit(u, l.zc + dz, 0.4)) return false; return true; };
  const used = new Set(); let role = 0;
  // ── 1. the washing lane with the jettied upper floor: a 2-floor pair at least 4 m long in the densest block (north-east) ──
  const wash = lanes.filter(l => l.floors >= 2 && l.len >= 3.8 && strip(l, l.x0, l.x1)).sort((p, q) => (q.block === 'north-east') - (p.block === 'north-east') || q.len - p.len)[0];
  if (wash) { used.add(wash); const l = wash, g = gy((l.x0 + l.x1) / 2, l.zc), yb = g + 3.4, ys = g + 5.6, xm = (l.x0 + l.x1) / 2;
    // the bridging room: a plastered box across the lane at the upper floor, on two corbels, with a window; the lane under it is a dark covered stretch
    const rx0 = xm - 1.1, rx1 = xm + 1.1, z0 = l.A.z1 - 0.05, z1 = l.B.z0 + 0.05;
    box(MAT.PLASTER, [0.8, 0.76, 0.68], 0.6, rx0, yb, z0, rx1, ys, z1, 0); for (const x of [rx0 - 0.02, rx1 + 0.02, xm]) beam([x, yb, z0], [x, ys, z0 - 0.02], 0.12, 0.1), beam([x, yb, z1], [x, ys, z1 + 0.02], 0.12, 0.1);
    box(MAT.TIMBER, dark, 0.5, rx0 - 0.1, yb - 0.22, z0, rx1 + 0.1, yb, z1, 0, 0.5); for (let z = z0 + 0.3; z < z1; z += 0.55) beam([rx0, yb - 0.1, z], [rx1, yb - 0.1, z], 0.1, 0.12);
    box(MAT.PLAIN, [0.12, 0.1, 0.08], 0.5, xm - 0.4, yb + 0.7, z0 - 0.02, xm + 0.4, yb + 1.6, z0 + 0.02, 0, 1); { const m = M(xm, z0); m.mat(MAT.PLAIN, [0.5, 0.64, 0.74]); m.quad2([xm - 0.32, yb + 0.78, z0 - 0.03], [xm - 0.32, yb + 1.52, z0 - 0.03], [xm + 0.32, yb + 1.52, z0 - 0.03], [xm + 0.32, yb + 0.78, z0 - 0.03]); }
    K.lantern(xm, yb - 0.4, l.zc, 0.6); beam([xm, yb - 0.22, l.zc], [xm, yb - 0.45, l.zc], 0.03, 0.03);
    // washing lines: three, one each side of the room, cloths hanging (the wind sway of cloth layers is 40_shade's SH.hangSway by kit name, so these are plain quads)
    for (const [xa, xb, ya, yc, k] of [[l.x0 + 0.3, rx0 - 0.15, g + 2.9, g + 2.7, 0], [rx1 + 0.15, l.x1 - 0.3, g + 2.8, g + 3.0, 1], [l.x0 + 0.4, rx0 - 0.2, g + 3.15, g + 3.05, 2]]) {
      const m = M((xa + xb) / 2, l.zc); beam([xa, ya, l.A.z1 + 0.02], [xb, yc, l.B.z0 - 0.02], 0.02, 0.02, [0.4, 0.36, 0.3]);
      const n = Math.max(1, Math.floor((xb - xa) / 0.8)); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, px = xa + (xb - xa) * u, pz = l.A.z1 + (l.B.z0 - l.A.z1) * u, py = ya + (yc - ya) * u, w = 0.28 + rr() * 0.12, h = 0.5 + rr() * 0.35, cc = [[0.78, 0.74, 0.66], [0.5, 0.36, 0.3], [0.36, 0.4, 0.5], [0.82, 0.8, 0.72]][(i + k) % 4];
        m.mat(MAT.CLOTH, cc, 0.5); m.quad2([px - w, py, pz], [px - w * 0.9, py - h, pz + 0.04], [px + w * 0.9, py - h, pz + 0.04], [px + w, py, pz]); } }
    K.place('washlane', 'Washing Lane', xm, l.zc, 4); l.role = 'wash'; }
  // ── 2. the dead end with a hidden yard: a lane in the north-east or south-east block that is open to grass at one end ──
  const dead = lanes.filter(l => !used.has(l) && l.len >= 3.6 && strip(l, l.x0, l.x1) && (l.block === 'north-east' || l.block === 'south-east' || l.block === 'south-west')).sort((p, q) => q.len - p.len)[0];
  if (dead) { used.add(dead); const l = dead, g = gy(l.x1 + 2, l.zc), ex = l.x1;
    // the end is shut by a board fence with a gate that stands ajar; beyond it a small yard: fence, well, bench, a hen coop box, something to take
    for (const [za, zb] of [[l.A.z1, l.zc - 0.55], [l.zc + 0.55, l.B.z0]]) { box(MAT.PLANKS, [0.58, 0.48, 0.36], 0.5, ex - 0.1, gy(ex, l.zc) - 0.2, za, ex + 0.08, gy(ex, l.zc) + 2.1, zb, 4 | 8, 1); col(ex - 0.1, za, ex + 0.08, zb, gy(ex, l.zc) - 0.3, gy(ex, l.zc) + 2.2); }
    box(MAT.PLANKS, [0.5, 0.4, 0.3], 0.5, ex + 0.08, gy(ex + 0.5, l.zc) + 0.05, l.zc + 0.55, ex + 0.95, gy(ex + 0.5, l.zc) + 1.95, l.zc + 0.61, 4 | 8, 1);    // the gate leaf, swung open into the yard
    const yx0 = ex + 0.1, yx1 = ex + 5.2, yz0 = l.zc - 3.0, yz1 = l.zc + 3.0, yg = gy(ex + 2.5, l.zc);
    for (const z of [yz0, yz1]) { beam([yx0, yg + 0.55, z], [yx1, yg + 0.55, z], 0.06, 0.1); beam([yx0, yg + 1.05, z], [yx1, yg + 1.05, z], 0.06, 0.1); col(yx0, z - 0.05, yx1, z + 0.05, yg - 0.2, yg + 1.15); for (let x = yx0; x <= yx1; x += 1.7) post(x, z, gy(x, z) - 0.2, gy(x, z) + 1.15, 0.1, true); }
    beam([yx1, yg + 0.55, yz0], [yx1, yg + 0.55, yz1], 0.06, 0.1); beam([yx1, yg + 1.05, yz0], [yx1, yg + 1.05, yz1], 0.06, 0.1); col(yx1 - 0.05, yz0, yx1 + 0.05, yz1, yg - 0.2, yg + 1.15);
    { const m = M(ex + 3, l.zc); m.push().T(ex + 3.6, gy(ex + 3.6, l.zc - 2.2), l.zc - 2.2); Props.barrel(m, 0.34, 0.9); m.pop(); m.push().T(ex + 3.9, gy(ex + 3.9, l.zc + 1.6), l.zc + 1.6).RY(0.6); Props.crate(m, 0.6); m.pop();
      m.push().T(ex + 2.2, gy(ex + 2.2, l.zc + 2.2), l.zc + 2.2).RY(PI / 2); Props.bench(m, 1.6); m.pop(); m.push().T(ex + 2.0, gy(ex + 2.0, l.zc - 2.0), l.zc - 2.0); m.mat(MAT.STONE, [0.9, 0.87, 0.82], 0.7); m.lathe([[0.6, 0], [0.6, 0.62], [0.5, 0.7], [0.36, 0.7], [0.36, 0.3]], 12, 0); m.mat(MAT.PLAIN, [0.1, 0.16, 0.2]); m.disc(0, 0.5, 0, 0.38, 12, 1); addCircleCollider(m, 0, 0, 0.62, 0, 0.7); m.pop(); }
    K.pick('purse2', 'purse', [ex + 4.1, gy(ex + 4.1, l.zc - 0.4) + 0.46, l.zc - 0.4], 'Take the pouch', 'purse', mm => { mm.mat(MAT.CLOTH, [0.3, 0.34, 0.3], 0.4); mm.ball(0, 0.06, 0, 0.08, 0.07, 0.08, 8, 5); });
    K.read(ex + 2.6, yg + 0.9, l.zc + 1.0, 3.0, 'yard.note', 'A hidden yard', 'A yard no wider than a cart, shut in by the backs of four houses and a gate that does not close. Somebody keeps it: the bench is oiled, the well is clear, and there is a stool for a person who comes here to be on their own. Scratched into the well-lip: “NOBODY FINDS THIS ONE. SAY NOTHING.”');
    K.place('hiddenyard', 'The Hidden Yard', ex + 2.5, l.zc, 4); K.route('deadyard', [[l.x0 - 0.6, gy(l.x0, l.zc), l.zc], [ex - 0.5, gy(ex, l.zc), l.zc], [ex + 2.0, yg, l.zc], [ex + 3.6, yg, l.zc - 0.4]]); l.role = 'dead'; }
  // ── 3. the stepped lane: a short flight up, a landing, a flight down, on a lane with no door on it ──
  const step = lanes.filter(l => !used.has(l) && l.len >= 3.6 && strip(l, l.x0, l.x1)).sort((p, q) => (q.block === 'north-west') - (p.block === 'north-west') || q.len - p.len)[0];
  if (step) { used.add(step); const l = step, n = 3, run = 0.5, up = n * 0.19, x0 = l.x0 + 0.1, x1 = l.x1 - 0.1, xa = x0 + n * run, xb = x1 - n * run, z0 = l.A.z1 + 0.1, z1 = l.B.z0 - 0.1, base = Math.max(gy(x0, l.zc), gy(x1, l.zc));
    const m = M((x0 + x1) / 2, l.zc);
    for (let i = 0; i < n; i++) { const y = base + 0.19 * (i + 1); for (const [a, b] of [[x0 + i * run, x0 + (i + 1) * run], [x1 - (i + 1) * run, x1 - i * run]]) { box(MAT.STONE, i % 2 ? [0.78, 0.76, 0.72] : [0.9, 0.87, 0.82], 0.5, a, gy(a, l.zc) - 0.4, z0, b, y, z1, 4 | 8 | 1 | 2 | 16 | 32 | 0); box(MAT.COBBLE, [0.8, 0.78, 0.74], 0.4, a, y - 0.003, z0, b, y, z1, 0); } }
    box(MAT.COBBLE, [0.8, 0.78, 0.74], 0.45, xa, base + up - 0.5, z0, xb, base + up, z1, 0);
    lvFloor(x0, z0, xa, z1, base, base + up, 'x'); lvFloor(xa, z0, xb, z1, base + up); lvFloor(xb, z0, x1, z1, base + up, base, 'x'); void m;
    K.place('steplane', 'The Steps', (x0 + x1) / 2, l.zc, 3); l.role = 'step'; K.route('steplane', [[x0 - 0.8, base, l.zc], [xa + 0.2, base + up, l.zc], [xb - 0.2, base + up, l.zc], [x1 + 0.8, base, l.zc]]); }
  // ── things at eye level in every lane: every ~3.2 m, on alternate walls, the first free kind from a rotating list ──
  const kinds = ['butt', 'sign', 'niche', 'barrow', 'cat', 'butt', 'sign', 'bench'];
  let ki = 0, cats = 0, niches = 0;
  for (const l of lanes) {
    const nth = Math.max(1, Math.floor(l.len / 3.2));
    for (let i = 0; i < nth; i++) {
      const u = l.x0 + (i + 0.5) * l.len / nth, side = (i + (l.x0 | 0)) % 2 ? 1 : -1, kind = kinds[ki++ % kinds.length], wz = side < 0 ? l.A.z1 : l.B.z0, out = -side;   // wall z, direction away from it
      if (l.role === 'step' && u > l.x0 - 1 && u < l.x1 + 1) continue; if (l.role === 'wash' && Math.abs(u - (l.x0 + l.x1) / 2) < 2.6) continue;
      const g = gy(u, wz - out * 0.5);
      if (KEEP.hit(u, wz + out * 0.45, 0.3) || KEEP.hit(u, wz + out * 0.9, 0.2)) continue;
      const m = M(u, wz);
      if (kind === 'butt') { m.push().T(u, g, wz + out * 0.42).RY(rr() * 6); Props.barrel(m, 0.31, 0.88); m.pop(); m.mat(MAT.TIMBER, dark, 0.5); m.beam([u, g + 1.7, wz + out * 0.1], [u, g + 1.0, wz + out * 0.42], 0.05, 0.05);          // a down-pipe from the eaves into it
        m.push().T(u + 0.55, g, wz + out * 0.4); m.mat(MAT.PLANKS, wood, 0.5); m.cbox(0, 0, 0, 0.28, 0.3, 0.28, 0); addCircleCollider(m, 0, 0, 0.2, 0, 0.3); m.pop(); }
      else if (kind === 'sign') { const y = g + 2.05; box(MAT.PLANKS, [0.58, 0.46, 0.32], 0.5, u - 0.32, y, wz + out * 0.06 - 0.01, u + 0.32, y + 0.4, wz + out * 0.1 + 0.01, 0, 1);
        const glyph = [[0.7, 0.2, 0.16], [0.2, 0.3, 0.5], [0.6, 0.5, 0.15], [0.28, 0.4, 0.26]][ki % 4]; m.mat(MAT.PLAIN, glyph); const zz = wz + out * 0.115; m.quad2([u - 0.12, y + 0.08, zz], [u - 0.12, y + 0.32, zz], [u + 0.12, y + 0.32, zz], [u + 0.12, y + 0.08, zz]);
        beam([u - 0.3, y + 0.5, wz + out * 0.02], [u - 0.3, y + 0.4, wz + out * 0.08], 0.03, 0.03); }
      else if (kind === 'niche' && niches < 6) { niches++; const y = g + 1.35; box(MAT.STONE, [0.88, 0.85, 0.8], 0.6, u - 0.3, y, wz + out * 0.0 - 0.04, u + 0.3, y + 0.62, wz + out * 0.13 + 0.04, 0, 1); { const mm = M(u, wz); mm.mat(MAT.PLAIN, [0.07, 0.06, 0.05]); const zz = wz + out * 0.145; mm.quad2([u - 0.2, y + 0.1, zz], [u - 0.2, y + 0.52, zz], [u + 0.2, y + 0.52, zz], [u + 0.2, y + 0.1, zz]); mm.mat(MAT.STONE, [0.7, 0.7, 0.68], 0.5); mm.ball(u, y + 0.28, wz + out * 0.17, 0.05, 0.12, 0.05, 6, 4); }
        World.emitters.push({ type: 'candle', p: [u + 0.12, y + 0.14, wz + out * 0.2], zone: 0, always: true }); }
      else if (kind === 'barrow') { m.push().T(u, g, wz + out * 0.5).RY(side * 0.2); m.mat(MAT.PLANKS, wood, 0.5); m.box(-0.28, 0.28, -0.4, 0.28, 0.5, 0.35); m.mat(MAT.TIMBER, dark, 0.5); m.beam([-0.22, 0.38, 0.35], [-0.2, 0.3, 0.95], 0.05, 0.05); m.beam([0.22, 0.38, 0.35], [0.2, 0.3, 0.95], 0.05, 0.05); m.cyl(0, 0.18, -0.46, 0.18, 0.18, 0.05, 8, 2); addBoxCollider(m, -0.3, -0.5, 0.3, 0.9, 0, 0.5); m.pop(); }
      else if (kind === 'cat' && cats < 4) { cats++; m.push().T(u, g, wz + out * 0.42); Props.barrel(m, 0.3, 0.8); m.pop(); m.push().T(u, g + 0.8, wz + out * 0.42); K.cat(m, out > 0 ? 0 : PI); m.pop(); }
      else if (kind === 'bench' && l.gap > 2.1) { m.push().T(u, g, wz + out * 0.3).RY(PI / 2); Props.bench(m, 1.2); m.pop(); }
      l.n++;
    }
  }
  lvLift(touch, 0.4);
  INF.laneStats = { lanes: lanes.length, roles: lanes.filter(l => l.role).map(l => l.role + '@' + l.x0.toFixed(0) + ',' + l.zc.toFixed(0)), items: lanes.reduce((a, l) => a + l.n, 0) };
}
