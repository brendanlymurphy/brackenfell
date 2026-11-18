// ───────────────────────── the town in levels, part 2: the lower ward, the Wharf (Build 33) ─────────────────────────
// The ground at the lake end of the south road is already the lowest in the village (about 2 m under the square, 0.3 to 0.6 m under the lake's own level: the shore is mud),
// so it cannot be dug deeper without flooding. The Wharf is built instead as a stone quay raised from that mud: a deck level with the square's cobbles, reached by a flight of
// steps from the south road, with a second flight down to a water-level landing between moored boats and a boardwalk out over the water, and boat-house doors under the deck.
function buildWharf(bucket, fence, R) {
  if (TEST && TEST.levels === 0) return;
  const WD = 0.0, X0 = 9.0, X1 = 20.0, Z0 = 75.0, Z1 = 82.5, LY = LAKE.y, LAND = LY + 0.55, BASE = -3.3;
  const touch = new Map();
  const M = (x, z) => { const m = bucket(x, z); if (!touch.has(m)) touch.set(m, m.nv); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; return m; };
  const sc = v => [1.0 * v, 0.97 * v, 0.92 * v];
  const col = (x0, z0, x1, z1, y0, y1) => addBoxCollider(M((x0 + x1) / 2, (z0 + z1) / 2), x0, z0, x1, z1, y0, y1);
  const flo = (x0, z0, x1, z1, y, y2, axis) => { const f = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, ax: 1, az: 0, bx: 0, bz: 1, y }; if (y2 !== undefined) { f.y2 = y2; f.axis = axis; } World.floors.push(f); };
  const gA = 0.5 * (Terrain.y(6.3, 77.6) + Terrain.y(6.3, 79.6));
  // the quay: one block from the mud to the deck, with a kerb on its lake sides, a gap in the south kerb for the steps to the water
  { const m = M(14, 79); m.mat(MAT.STONE, sc(0.9), 0.7); m.box(X0, BASE, Z0, X1, WD, Z1, 4);
    m.mat(MAT.COBBLE, [0.78, 0.76, 0.72], 0.45); m.quad2([X0, WD + 0.01, Z0], [X0, WD + 0.01, Z1], [X1, WD + 0.01, Z1], [X1, WD + 0.01, Z0]);
    m.mat(MAT.STONE, sc(1), 0.6);
    for (const [a, b, c, d] of [[X0, Z1 - 0.35, 12.5, Z1], [15.5, Z1 - 0.35, X1, Z1], [X1 - 0.35, Z0, X1, Z1 - 0.35]]) { m.box(a, WD, b, c, WD + 0.45, d, 4); col(a, b, c, d, BASE, WD + 0.5); }
    col(X0, Z0, X1, Z1, BASE, WD - 0.04);
    lvFloor(X0, Z0, X1, Z1, WD);
    // boat-house doors in the north face (the road side): a stone arch, a dark recess, plank doors with straps
    for (const x of [11.6, 16.4]) { const g = Terrain.y(x, Z0 - 0.2), zf = Z0 - 0.03;
      m.mat(MAT.STONE, sc(1), 0.6); m.box(x - 0.95, g + 1.55, Z0 - 0.12, x + 0.95, g + 1.8, Z0, 4); m.box(x - 0.95, g, Z0 - 0.12, x - 0.7, g + 1.55, Z0, 4); m.box(x + 0.7, g, Z0 - 0.12, x + 0.95, g + 1.55, Z0, 4);
      m.mat(MAT.PLANKS, [0.62, 0.5, 0.38], 0.5); m.box(x - 0.7, g, zf - 0.02, x + 0.7, g + 1.55, zf, 4 | 8 | 32);          // [fx1] the road-side face is -z: skipping it (16) left the straps floating on bare stone
      m.mat(MAT.PLAIN, [0.09, 0.08, 0.07]); m.box(x - 0.7, g + 0.4, zf - 0.04, x + 0.7, g + 0.5, zf - 0.015, 4 | 8 | 32); m.box(x - 0.7, g + 1.1, zf - 0.04, x + 0.7, g + 1.2, zf - 0.015, 4 | 8 | 32); }
  }
  // flight up from the south road (west face): 2 m wide, cheeks as beams
  { const n = Math.max(2, Math.round((WD - gA) / 0.19)), xa = 6.3, z0 = 77.6, z1 = 79.6, m = M(7.5, 78.6);
    for (let i = 0; i < n; i++) { const a = xa + (X0 - xa) * i / n, b = xa + (X0 - xa) * (i + 1) / n, top = gA + (WD - gA) * (i + 1) / n; m.mat(MAT.STONE, i % 2 ? sc(0.9) : sc(0.97), 0.5); m.box(a, top - 0.22, z0, b, top, z1, 4 | 16 | 32 | 2); }
    lvFloor(xa, z0, X0, z1, gA, WD, 'x');
    for (const [a, b] of [[z0 - 0.35, z0], [z1, z1 + 0.35]]) { m.mat(MAT.STONE, sc(0.88), 0.7); m.beam([xa, gA + 0.3, (a + b) / 2], [X0, WD + 0.3, (a + b) / 2], 0.35, 1.1); col(xa, a, X0, b, gA - 0.8, WD + 0.9); }
    const lx = 6.0, lz = 77.0, y = Terrain.y(lx, lz); const ml = M(lx, lz); ml.push().T(lx, y, lz); ml.mat(MAT.TIMBER, COL.timberDark); ml.cbox(0, 0, 0, 0.14, 2.2, 0.14, 4); ml.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); ml.cbox(0, 2.2, 0, 0.3, 0.34, 0.3, 4); ml.pop();
    World.emitters.push({ type: 'lantern', p: [lx, y + 2.4, lz], zone: 0, halo: 0.5 });
  }
  // [fx3] a second flight up from the north (road) side, 2.7 m wide between the two boat-house doors, in line with the bier: a walker coming from the road towards the bier meets the quay's north face, and the only other way up was round at the west end
  { const x0 = 12.65, x1 = 15.35, gN = Terrain.y(14, Z0 - 2.3), zn = Z0 - 2.3, n = Math.max(2, Math.round((WD - gN) / 0.19)), m = M(14, Z0 - 1.1);
    for (let i = 0; i < n; i++) { const a = zn + (Z0 - zn) * i / n, b = zn + (Z0 - zn) * (i + 1) / n, top = gN + (WD - gN) * (i + 1) / n; m.mat(MAT.STONE, i % 2 ? sc(0.9) : sc(0.97), 0.5); m.box(x0, top - 0.22, a, x1, top, b, 4 | 8 * 0 | 32); }
    lvFloor(x0, zn, x1, Z0, gN, WD, 'z');
    for (const [a, b] of [[x0 - 0.35, x0], [x1, x1 + 0.35]]) { m.mat(MAT.STONE, sc(0.88), 0.7); m.beam([(a + b) / 2, gN + 0.3, zn], [(a + b) / 2, WD + 0.3, Z0], 0.35, 1.1); col(a, zn, b, Z0, gN - 0.8, WD + 0.9); }
  }
  // steps down to the water landing (south face), then the landing and a boardwalk out over the water
  { const x0 = 12.5, x1 = 15.5, zs = Z1, ze = Z1 + 1.9, n = Math.round((WD - LAND) / 0.19), m = M(14, 83.5);
    for (let i = 0; i < n; i++) { const a = zs + (ze - zs) * i / n, b = zs + (ze - zs) * (i + 1) / n, top = WD + (LAND - WD) * (i + 1) / n; m.mat(MAT.STONE, i % 2 ? sc(0.9) : sc(0.97), 0.5); m.box(x0, BASE, a, x1, top, b, 4 | 16 | (i ? 0 : 0)); }
    m.mat(MAT.STONE, sc(0.95), 0.6); m.box(x0, BASE, ze, x1, LAND, ze + 1.6, 4); m.mat(MAT.COBBLE, [0.7, 0.68, 0.64], 0.45); m.quad2([x0, LAND + 0.01, ze], [x0, LAND + 0.01, ze + 1.6], [x1, LAND + 0.01, ze + 1.6], [x1, LAND + 0.01, ze]);
    lvFloor(x0, zs, x1, ze, WD, LAND, 'z'); lvFloor(x0, ze, x1, ze + 1.6, LAND);
    for (const z of [ze + 1.3]) for (const x of [x0 + 0.15, x1 - 0.15]) { m.mat(MAT.TIMBER, COL.timberDark, 0.5); m.cbox(x, LAND, z, 0.16, 1.1, 0.16, 4); addCircleCollider(m, x, z, 0.12, LAND, LAND + 1.1); }
    // boardwalk straight out over the water from the landing
    bwWalk(bucket, [[14, ze + 1.9], [14, ze + 8.6]], { w: 1.6, rails: [1, 1], seg: 1.8, ramp: 0, piles: true, deckY: () => LAND });
  }
  // two rowing boats moored to the quay wall and the landing
  const boat = (x, z, yaw, s) => { const m = M(x, z); m.push().T(x, LY - 0.16, z).RY(-yaw); m.mat(MAT.PLANKS, COL.woodDark, 0.6);
    const hull = (u, v) => [v * 0.62 * s * (1 - Math.pow(Math.abs(u), 2.4)), 0.5 * (v * v) + 0.12 * u * u * (u > 0 ? 1 : 0.6), u * 1.9 * s];
    m.grid(10, 8, (i, j) => { const u = i / 10 * 2 - 1, v = j / 8 * 2 - 1, p = hull(u, v); return m.vert(p[0], p[1], p[2], v, -1.2, 0, i * 0.3, j * 0.2); });
    m.grid(10, 8, (i, j) => { const u = i / 10 * 2 - 1, v = -(j / 8 * 2 - 1), p = hull(u, v); return m.vert(p[0] * 0.96, p[1] + 0.03, p[2] * 0.98, -v, 1.2, 0, i * 0.3, j * 0.2); });
    m.mat(MAT.PLANKS, COL.wood, 0.6); for (const zz of [-0.8, 0.5]) m.box(-0.5 * s, 0.3, zz * s - 0.12, 0.5 * s, 0.33, zz * s + 0.12, 4);
    m.pop(); };
  boat(17.9, 84.0, 0.1, 1.0); boat(10.8, 85.6, -0.2, 0.9);
  // bollards, barrels, a lantern post and a board with the boatwright's notice and the tide tally
  for (const x of [10.5, 14.0, 18.5]) { const m = M(x, Z1 - 0.7); m.push().T(x, WD, Z1 - 0.7); m.mat(MAT.TIMBER, COL.timberDark, 0.5); m.cyl(0, 0, 0, 0.14, 0.12, 0.42, 8, 2); m.mat(MAT.METAL, [0.1, 0.09, 0.08]); m.cyl(0, 0.42, 0, 0.17, 0.17, 0.05, 8, 2); addCircleCollider(m, 0, 0, 0.17, 0, 0.45); m.pop(); }
  for (const [x, z, k] of [[18.6, 77.2, 0], [19.1, 78.2, 1], [17.6, 77.0, 2]]) { const m = M(x, z); m.push().T(x, WD, z); if (k === 0) Props.barrel(m, 0.3, 0.78); else if (k === 1) Props.crate(m, 0.55); else Props.sack(m, 0.34); m.pop(); }
  { const lx = X1 - 0.5, lz = Z0 + 0.6, m = M(lx, lz); m.push().T(lx, WD, lz); m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, 0, 0, 0.14, 2.4, 0.14, 4); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.cbox(0, 2.4, 0, 0.3, 0.34, 0.3, 4); addCircleCollider(m, 0, 0, 0.14, 0, 2.4); m.pop();
    World.emitters.push({ type: 'lantern', p: [lx, WD + 2.6, lz], zone: 0, halo: 0.5 }); }
  { const bx = 13.6, bz = Z0 + 0.5, m = M(bx, bz); m.push().T(bx, WD, bz); m.mat(MAT.TIMBER, COL.timberDark, 0.5); for (const s of [-1, 1]) { m.cbox(s * 0.7, 0, 0, 0.12, 1.9, 0.12, 4); addCircleCollider(m, s * 0.7, 0, 0.1, 0, 1.9); }
    m.mat(MAT.PLANKS, [0.62, 0.52, 0.4], 0.5); m.box(-0.8, 1.0, -0.05, 0.8, 1.75, 0.05, 4); m.mat(MAT.PLAIN, [0.72, 0.68, 0.58]); m.quad2([-0.5, 1.2, 0.055], [-0.5, 1.62, 0.055], [0.1, 1.62, 0.055], [0.1, 1.2, 0.055]); m.pop();
    World.interact.push({ p: [bx, WD + 1.4, bz + 0.5], r: 2.4, zone: 0, kind: 'read', id: 'wharf.tally', title: 'The boatwright’s board', text: 'BOATS MENDED, PITCHED AND HIRED BY THE HOUR. The doors under the quay are the boat-houses: knock first, the keys are with Old Wenn. Scratched below: the lake stood this high in the Long Frost, and not a hand higher since.' }); }
  lvLift(touch, 1.0);
  World.places.push({ id: 'wharf', name: 'The Wharf', x: 14, z: 80, r: 11 });
  World.spots['wharf.view'] = { p: [14, WD, 80], yaw: Math.PI, zone: 0 };
}
