/* [fx3] No lawn inside the edge (docs/TOWNPLAN.md section 2). The audit measured 17 percent of the open ground within the edge as grass: the meadows west of Wharf Street, the strip between the east cluster and the river, the corners of the west edge. Each is now a place with a use:
     orchard      fruit trees in rows with the ground trodden under them (NW corner behind Chapelgate; the north-east corner by the river)
     green        a village green with an oak, two benches, and a worn ring: where the old people sit in the afternoon (spot green.bench)
     drying green posts and lines with linen, on mown turf: Wharfside's washing
     allotment    kitchen-garden strips (tilled soil, beds 2.4 m, paths between) by the river and behind the wharf rows
     earth        everything else open: trodden earth, worn into paths, a few tufts left
   groundFill(da, db, Rz, half) paints this into the terrain's splat map where the ground is still unpainted (called by 60_terrain.js); buildGround(bucket) stands the posts, benches and trees; test/lawn.js measures the result (World.places are exempt: they have a use). */
const GROUND = {
  edge: [[-30, -58.7], [-33, -58.5], [-47, -56], [-58, -49], [-63, -38], [-65, -26], [-64, -19.5], [-62, -15], [-62, -8.15], [-62, -2.25], [-62, 5], [-63.5, 9.5], [-65, 16], [-63, 30], [-59, 44], [-52, 56], [-44, 66], [-37, 72.5], [-32, 76.5], [30, 78], [72.7, 70], [72.7, -46.5], [72.7, -57], [52, -60], [30, -60.5], [8, -58.7]],      // the town's edge as a polygon (the west palisade, the south shore, the east river wall, the north edge)
  places: [
    { id: 'orchard.nw', kind: 'orchard', x0: -63, z0: -55, x1: -48, z1: -26 },
    { id: 'orchard.ne', kind: 'orchard', x0: 36, z0: -59, x1: 52, z1: -45 },
    { id: 'green.sw', kind: 'green', x: -37, z: 54, r: 8 },
    { id: 'drying.sw', kind: 'drying green', x0: -29, z0: 44, x1: -18, z1: 50 }
  ],
  beds: [      // [x0, z0, x1, z1, bed axis]: strips 2.4 m of bed and 0.6 m of path across the short side
    [-58, 58, -44, 74, 'x'], [-30, 56, -8, 75, 'x'], [14, 58, 38, 76, 'x'], [36, -43, 52, -7, 'x'], [40, 14, 52, 75, 'x']
  ]
};
const _grGn = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177 | 0; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };
const _grVn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, s = t => t * t * (3 - 2 * t); const a = _grGn(i, j), b = _grGn(i + 1, j), c = _grGn(i, j + 1), d = _grGn(i + 1, j + 1); return a + (b - a) * s(fx) + (c - a) * s(fz) + (a - b - c + d) * s(fx) * s(fz); };
function groundFill(da, db, Rz, half) {
  const sc = Rz / (2 * half), ZONES = [[-66, 33, -6, 78], [8, 33, 42, 78], [30, 6, 56, 79], [33, -62, 56, -3], [-66, -57, -45, -20]];
  const inR = (x, z, b) => x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3];
  for (const Z of ZONES) {
    const i0 = Math.max(0, Math.floor((Z[0] + half) * sc)), i1 = Math.min(Rz - 1, Math.ceil((Z[2] + half) * sc)), j0 = Math.max(0, Math.floor((Z[1] + half) * sc)), j1 = Math.min(Rz - 1, Math.ceil((Z[3] + half) * sc));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = (j * Rz + i) * 4; if (da[k] > 70 || da[k + 1] > 70 || db[k] > 70) continue;      // already road, cobble or bare: leave it
      const x = i / sc - half, z = j / sc - half; let keep = false;
      let inside = false, dE = 1e9; { const E = GROUND.edge; for (let a = 0, b = E.length - 1; a < E.length; b = a++) { const xa = E[a][0], za = E[a][1], xb = E[b][0], zb = E[b][1]; if ((za > z) !== (zb > z) && x < (xb - xa) * (z - za) / (zb - za) + xa) inside = !inside; const vx = xb - xa, vz = zb - za, t = Math.max(0, Math.min(1, ((x - xa) * vx + (z - za) * vz) / (vx * vx + vz * vz || 1))), d = Math.hypot(x - xa - vx * t, z - za - vz * t); if (d < dE) dE = d; } }
      if (!inside) continue; const wEdge = Math.min(1, dE / 3), fade = _grVn(x * 1.3 + 40, z * 1.3) < wEdge + 0.1;      // soft, ragged fringe where the town meets the turf outside the edge
      for (const p of GROUND.places) { if (p.r !== undefined ? Math.hypot(x - p.x, z - p.z) < p.r : (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1)) { keep = true; break; } }
      if (keep) { for (const p of GROUND.places) if (p.kind === 'orchard' && x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) { const n = _grVn(x * 0.9, z * 0.9); if (n < 0.34) da[k] = Math.max(da[k], 150); } continue; }
      let bed = null; for (const b of GROUND.beds) if (inR(x, z, [b[0], b[1], b[2], b[3]])) { bed = b; break; }
      if (bed) { const u = (z - bed[1]) / 3.0, f = u - Math.floor(u); if (f < 0.8 && x > bed[0] + 0.6 && x < bed[2] - 0.6 && z > bed[1] + 0.6 && z < bed[3] - 0.6) { if (fade) db[k] = Math.max(db[k], 235); }      /* beds are bare tilled soil (the 'bare' mask); the field mask would stand wheat on them */ else da[k] = Math.max(da[k], 215 * (fade ? 1 : 0.3)); continue; }
      const n = _grVn(x * 0.7, z * 0.7); da[k] = Math.max(da[k], fade ? (n < 0.14 ? 120 : 175 + n * 70) : 90);      // trodden earth with a few tufts left
    }
  }
}
function buildGround(bucket) {
  if (TEST && TEST.plots === 0) return; const R = rng(7771), gy = (x, z) => Terrain.y(x, z);
  World.places = GROUND.places; World.yardTrees = World.yardTrees || [];
  for (const p of GROUND.places) {
    if (p.kind === 'orchard') {      /* [fx3] loose rows 5.5 to 7 m apart, never a grid: each tree jittered, a few gaps; the good broadleaf models (birch and oak) at 0.55 to 0.85 so the trunks are short and the crowns round */
      const dx = 6.2, dz = 6.0; let row = 0;
      for (let z = p.z0 + 3; z < p.z1 - 1.5; z += dz + (R() - 0.5) * 1.4, row++) for (let x = p.x0 + 2.8 + (row % 2) * 2.4; x < p.x1 - 1.5; x += dx + (R() - 0.5) * 1.6) {
        if (R() < 0.14) continue; const tx = x + (R() - 0.5) * 2.2, tz = z + (R() - 0.5) * 2.4;
        if (R() < 0.04) continue; World.yardTrees.push([tx, tz, 'oak', 0.6 + R() * 0.2]); } }
    else if (p.kind === 'green') {
      World.yardTrees.push([p.x, p.z, 'oak', 0.9]);
      for (const [a, y] of [[0.5, 0.2], [3.6, 0.2]]) { const x = p.x + Math.cos(a) * 2.3, z = p.z + Math.sin(a) * 2.3, m = bucket(x, z); m.push().T(x, gy(x, z), z).RY(-(a + Math.PI / 2)); Props.bench(m, 1.7); m.pop(); }
      const sx = p.x + Math.cos(0.5) * 2.3 + 0.1, sz = p.z + Math.sin(0.5) * 2.3 + 1.0; World.spots['green.bench'] = { p: [sx, gy(sx, sz), sz], yaw: Math.atan2(p.x - sx, -(p.z - sz)), zone: 0, sit: true };
    } else if (p.kind === 'drying green') {
      const m = bucket((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2); const cx = (p.x0 + p.x1) / 2;
      for (const z of [p.z0 + 2.0, p.z0 + 4.0]) { const g0 = gy(p.x0 + 1, z), g1 = gy(p.x1 - 1, z); m.mat(MAT.TIMBER, [0.3, 0.24, 0.18], 0.5); for (const x of [p.x0 + 0.8, cx, p.x1 - 0.8]) { const g = gy(x, z); m.beam([x, g - 0.1, z], [x, g + 2.0, z], 0.1, 0.1); addCircleCollider(m, x, z, 0.12, g, g + 2); }
        m.mat(MAT.PLAIN, [0.7, 0.68, 0.62], 0.5); m.beam([p.x0 + 0.8, g0 + 1.92, z], [p.x1 - 0.8, g1 + 1.92, z], 0.025, 0.025);
        for (let k = 0; k < 6; k++) { const x = p.x0 + 1.5 + k * 1.5, g = gy(x, z); m.mat(MAT.CLOTH, [[0.74, 0.72, 0.66], [0.6, 0.55, 0.46], [0.7, 0.68, 0.62], [0.5, 0.52, 0.58], [0.72, 0.7, 0.64], [0.62, 0.5, 0.42]][k], 0.5); m.quad2([x, g + 1.9, z + 0.02], [x - 0.02, g + 1.15, z + 0.03], [x + 0.6, g + 1.15, z - 0.03], [x + 0.6, g + 1.9, z - 0.02]); } }
    }
  }
}
