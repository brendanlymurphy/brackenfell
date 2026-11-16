// ───────────────────────── the town in levels (Build 33) ─────────────────────────
// 1. The upper ward: a terrace LV.up.h above the market square under the elder's hall (ground shaped in 60_terrain.js, rectangle in 55_layout.js), stone retaining walls
//    just outside its edge, a flight of steps from the square, a ramped lane that climbs along the south wall from the south road, a parapet over the market.
// Everything is axis-aligned boxes and quads in the village's own stone and timber layers, merged into the village cells through the `bucket` of buildVillage; every
// walkable surface is a World.floors entry (ramps for flights and lanes), every wall a box collider.
const LVL = { n: 0 };
function lvFloor(x0, z0, x1, z1, y, y2, axis) {
  const f = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: Math.abs(x1 - x0) / 2, hz: Math.abs(z1 - z0) / 2, ax: 1, az: 0, bx: 0, bz: 1, y };
  if (y2 !== undefined) { f.y2 = y2; f.axis = axis; } World.floors.push(f); return f;
}
function buildLevels(bucket, fence, R) {
  if (TEST && TEST.levels === 0) return;
  const OUT = { zone: 0 }, ST = [0.8, 0.78, 0.74], STD = [0.66, 0.64, 0.6], WDK = [0.5, 0.44, 0.4];
  const M = (x, z) => { const m = bucket(x, z); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; return m; };
  const gmin = (x0, z0, x1, z1) => { let g = 1e9; for (let i = 0; i <= 4; i++) g = Math.min(g, Terrain.y(x0 + (x1 - x0) * i / 4, z0 + (z1 - z0) * i / 4)); return g; };
  // a solid block (box + collider). o: mat, col, tile, solid:false (no collider), cy1 (collider top)
  const blk = (x0, z0, x1, z1, y0, y1, o) => {
    o = o || {}; const m = M((x0 + x1) / 2, (z0 + z1) / 2); m.mat(o.mat === undefined ? MAT.STONE : o.mat, o.col || ST, o.tile || 0.8); m.box(x0, y0, z0, x1, y1, z1, o.skip || 0);
    if (o.solid !== false) addBoxCollider(m, x0, z0, x1, z1, y0, o.cy1 === undefined ? y1 : o.cy1); LVL.n += 12;
  };
  // a flight along z (zA to zB, yA to yB) between x0 and x1: solid steps, a ramp floor, cheek walls
  const stairZ = (x0, x1, zA, zB, yA, yB, o) => {
    o = o || {}; const n = Math.max(2, Math.round(Math.abs(yB - yA) / 0.19)), lo = Math.min(yA, yB) - 1.0, hi = Math.max(yA, yB), cw = 0.35;
    for (let i = 0; i < n; i++) {
      const za = zA + (zB - zA) * i / n, zb = zA + (zB - zA) * (i + 1) / n, top = yA + (yB - yA) * (i + 1) / n, y = (yA + (yB - yA) * i / n + top) / 2 - 0.03;
      blk(x0, Math.min(za, zb), x1, Math.max(za, zb), lo, top, { mat: MAT.STONE, col: i % 2 ? ST : STD, solid: false, tile: 0.5 });
    }
    const zl = Math.min(zA, zB), zh = Math.max(zA, zB); lvFloor(x0, zl, x1, zh, zA < zB ? yA : yB, zA < zB ? yB : yA, 'z');
    if (!o.noCheek) for (const [a, b] of [[x0 - cw, x0], [x1, x1 + cw]]) { const mb = M(a, zl); mb.mat(MAT.STONE, STD, 0.7); mb.beam([(a + b) / 2, yA + 0.35, zA], [(a + b) / 2, yB + 0.35, zB], cw, 1.1); const m = mb; addBoxCollider(m, a, zl, b, zh, lo, hi + 1.0); }
  };
  const T = LV.up, H = T.h, wt = T.slope, top = H + 0.1;
  // ── retaining walls: 0.8 m thick, just outside the terrace edge (the ground rises inside them), a coping, a parapet on the open sides ──
  const wall = (x0, z0, x1, z1, parapet) => {
    const long = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = long ? Math.abs(x1 - x0) : Math.abs(z1 - z0), n = Math.max(1, Math.round(L / 3));
    for (let i = 0; i < n; i++) {
      const a = [x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n], b = [x0 + (x1 - x0) * (i + 1) / n, z0 + (z1 - z0) * (i + 1) / n];
      const xa = Math.min(a[0], b[0]), xb = Math.max(a[0], b[0]), za = Math.min(a[1], b[1]), zb = Math.max(a[1], b[1]), base = gmin(xa, za, xb, zb) - 0.7;
      blk(xa, za, xb, zb, base, top, { cy1: top + (parapet ? 1.0 : 0) });
      if (parapet) { const inset = 0.15; if (long) blk(xa, za + inset, xb, zb - inset, top, top + 0.95, { col: STD, solid: false, tile: 0.6 }); else blk(xa + inset, za, xb - inset, zb, top, top + 0.95, { col: STD, solid: false, tile: 0.6 }); }
    }
  };
  const gapA = [-13.5, -10.1];                       // the flight from the square
  wall(-36.8, T.z0 - wt, gapA[0], T.z0, true); wall(gapA[1], T.z0 - wt, T.x1 + wt, T.z0, true);          // north, over the market
  wall(T.x1, T.z0 - wt, T.x1 + wt, T.z1 + wt, true);                                                      // east
  wall(-36.8, T.z0, -36.0, T.z1 + wt, true);                                                              // west
  wall(-34.0, T.z1, T.x1, T.z1 + wt, false);                                                               // south (the lane runs along its foot; the lane has its own parapet)
  // piers at the ends of the north parapet, either side of the flight
  for (const x of [gapA[0] - 0.1, gapA[1] - 0.4]) blk(x, T.z0 - wt, x + 0.5, T.z0, gmin(x, T.z0 - wt, x + 0.5, T.z0) - 0.7, top + 1.25, { col: ST });
  // ── the flight from the market square: 2.8 m wide, 3.4 m of rise ──
  { const zA = 7.0, gA = Terrain.y(-11.8, zA); stairZ(gapA[0] + 0.3, gapA[1] - 0.3, zA, T.z0 + 0.5, gA, H);
    for (const x of [gapA[0] - 0.1, gapA[1] - 0.4]) { const m = M(x, zA); m.push().T(x + 0.25, gA, zA - 0.1); m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, 0, 0, 0.14, 1.9, 0.14, 4); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.cbox(0, 1.9, 0, 0.3, 0.34, 0.3, 4); m.pop();
      World.emitters.push({ type: 'lantern', p: [x + 0.25, gA + 2.1, zA - 0.1], zone: 0, halo: 0.5 }); } }
  // ── the ramped lane: from the south road (x -3.2) west along the terrace's south wall, 31 m long, rising to the terrace corner ──
  { const lz0 = T.z1 + wt, lz1 = 34.4, xE = -3.2, xW = -34.0, yE = Terrain.y(xE, (lz0 + lz1) / 2), n = 31;
    lvFloor(xW, lz0, xE, lz1, H, yE, 'x');
    for (let i = 0; i < n; i++) {
      const xa = xW + (xE - xW) * i / n, xb = xW + (xE - xW) * (i + 1) / n, ya = H + (yE - H) * i / n, yb = H + (yE - H) * (i + 1) / n, ym = (ya + yb) / 2, b0 = gmin(xa, lz0, xb, lz1 + 0.3) - 0.7;
      blk(Math.min(xa, xb), lz0, Math.max(xa, xb), lz1 + 0.3, b0, ym - 0.03, { col: i % 2 ? ST : STD, solid: false });
      blk(Math.min(xa, xb), lz1 - 0.1, Math.max(xa, xb), lz1 + 0.3, ym - 0.03, Math.max(ya, yb) + 0.95, { col: STD, solid: false, tile: 0.6 });
    }
    { const m = M(-18, lz1); addBoxCollider(m, xW, lz1 - 0.1, xE, lz1 + 0.3, Math.min(yE, H) - 0.5, H + 1.2); }
    // the landing at the top: flat stone at the terrace's level, joined to the terrace through a gap in the south wall
    blk(-36.8, T.z1, -34.0, lz1 + 0.3, gmin(-36.8, T.z1, -34, lz1) - 0.7, H, { col: ST, cy1: H, solid: false });
    lvFloor(-36.0, T.z1 - 0.3, -34.0, lz1, H);
    blk(-36.8, T.z1, -36.3, lz1 + 0.3, gmin(-36.8, T.z1, -36.3, lz1 + 0.3) - 0.5, H + 0.95, { col: STD, cy1: H + 1.1 }); blk(-36.8, lz1 - 0.1, -34.0, lz1 + 0.3, gmin(-36.8, lz1 - 0.1, -34.0, lz1 + 0.3) - 0.5, H + 0.95, { col: STD, cy1: H + 1.1 });
    // a lantern post where the lane leaves the road
    { const m = M(xE, lz0); const y = Terrain.y(xE + 0.6, lz1 + 0.8); m.push().T(xE + 0.6, y, lz1 + 0.8); m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, 0, 0, 0.14, 2.2, 0.14, 4); m.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); m.cbox(0, 2.2, 0, 0.3, 0.34, 0.3, 4); m.pop(); World.emitters.push({ type: 'lantern', p: [xE + 0.6, y + 2.4, lz1 + 0.8], zone: 0, halo: 0.5 }); }
  }
  // ── on the terrace: benches under the parapet, a lamp, a plaque, the view ──
  const putT = (x, z, yaw, fn) => { const m = M(x, z); m.push().T(x, H, z); if (yaw) m.RY(-yaw); fn(m); m.pop(); };
  for (const x of [-29, -22, -17.4]) putT(x, T.z0 + 1.0, 0, m => Props.bench(m, 1.8));
  putT(-26, T.z0 + 0.6, 0, m => Props.lampPost(m, OUT));
  { const px = -23.5, pz = T.z0 + 0.55;
    putT(px, pz, 0, m => { m.mat(MAT.STONE, ST, 0.6); m.box(-0.45, 0.0, -0.18, 0.45, 0.12, 0.18); m.box(-0.35, 0.12, -0.12, 0.35, 0.85, 0.12); m.mat(MAT.PLAIN, [0.12, 0.1, 0.08]); m.box(-0.25, 0.4, 0.121, 0.25, 0.75, 0.13); });
    World.interact.push({ p: [px, H + 0.7, pz + 0.3], r: 2.2, zone: 0, kind: 'read', id: 'terrace.plaque', title: 'A plaque on the terrace wall', text: 'RAISED IN THE YEAR OF THE LONG FROST, WHEN THE MARKET FLOODED. From here the elder could see the square, the alley and the bridge, and know the river before it came. — The Wardens of Brackenfell' });
    World.places.push({ id: 'uward', name: 'Rowan’s Terrace', x: -21, z: 21, r: 13 });
    World.spots['terrace.view'] = { p: [-20, H, T.z0 + 1.4], yaw: 0, zone: 0 }; }
  World.levelsBuilt = (World.levelsBuilt || 0) + 1;
}
