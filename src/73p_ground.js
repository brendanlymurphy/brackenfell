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
    { id: 'drying.sw', kind: 'drying green', earth: 1, x0: -29, z0: 44, x1: -18, z1: 50 }
  ],
  beds: [      // [x0, z0, x1, z1, bed axis]: strips 2.4 m of bed and 0.6 m of path across the short side
    [-58, 58, -44, 74, 'x'], [-30, 56, -8, 75, 'x'], [14, 58, 38, 76, 'x'], [36, -43, 52, -7, 'x'], [40, 14, 52, 75, 'x']
  ]
};
const _grSoil = (x, z) => !!(GROUND.soil && GROUND.soil.has((Math.round(x) + 400) * 2000 + Math.round(z) + 400));
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
      for (const p of GROUND.places) { if (p.earth) continue; if (p.r !== undefined ? Math.hypot(x - p.x, z - p.z) < p.r - 0.8 + _grVn(x * 1.7 + 11, z * 1.7) * 2.2 + _grVn(x * 4.3, z * 4.3 + 7) * 0.8 : (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1)) { keep = true; break; } }
      if (keep) { for (const p of GROUND.places) if (p.kind === 'orchard' && x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) { const n = _grVn(x * 0.9, z * 0.9); if (n < 0.34) da[k] = Math.max(da[k], 150); } continue; }
      let bed = null; for (const b of GROUND.beds) if (inR(x, z, [b[0], b[1], b[2], b[3]])) { bed = b; break; }
      if (bed) { const u = (z - bed[1]) / 3.0, f = u - Math.floor(u); if (f < 0.8 && x > bed[0] + 0.6 && x < bed[2] - 0.6 && z > bed[1] + 0.6 && z < bed[3] - 0.6) { if (fade) { db[k] = Math.max(db[k], 235); (GROUND.soil || (GROUND.soil = new Set())).add((Math.round(x) + 400) * 2000 + Math.round(z) + 400); } }      /* beds are bare tilled soil (the 'bare' mask); the field mask would stand wheat on them */ else da[k] = Math.max(da[k], 215 * (fade ? 1 : 0.3)); continue; }
      const n = _grVn(x * 0.7, z * 0.7); da[k] = Math.max(da[k], fade ? (n < 0.14 ? 120 : 175 + n * 70) : 90);      // trodden earth with a few tufts left
    }
  }
}
function buildGround(bucket) {
  if (TEST && TEST.plots === 0) return; const R = rng(7771), gy = (x, z) => Terrain.y(x, z);
  World.places = GROUND.places; World.yardTrees = World.yardTrees || [];
  /* [fx3] allotments: the painted soil gets ridges 8 cm high with a dark trough, board edging, bean poles with vines, rows of greens, a spade, a bucket and a water butt (kit pieces only) */
  if (GROUND.soil && typeof kplace === 'function') {
    const raw = bucket, bk = (x, z) => { const m = raw(4e6 + Math.floor(x / 30) * 80, Math.floor(z / 30) * 80); m.maxDist = 60; m.lowDist = 24; m.noShadow = true; return m; };
    const K = (m, n, x, y, z, sc, ry, tilt) => { if (typeof scanOn !== 'function' || !kitReady()) return; const P = kplace(m, n, x, y, z, sc, ry); if (!P) return;  if (tilt) P.M.multiply(new THREE.Matrix4().makeRotationX(tilt)); kadd(m, P, /^Prop_Vine/.test(n) ? { cast: false } : undefined); };
    const RIDGE = [0.3, 0.22, 0.15], TOP = [0.38, 0.29, 0.2], TROUGH = [0.13, 0.095, 0.07], BOARD = [0.5, 0.42, 0.31];
    for (const b of GROUND.beds) {
      for (let zs = b[1] + 0.6; zs + 2.4 < b[3] - 0.3; zs += 3.0) {
        const H = _grGn(Math.round(b[0]), Math.round(zs)), planted = H < 0.6, kind = H < 0.2 ? 'beans' : H < 0.4 ? 'greens' : 'greens2';
        for (let x = b[0] + 0.6; x + 1.5 <= b[2] - 0.6; x += 1.5) {
          if (!(_grSoil(x, zs + 0.3) && _grSoil(x + 1.5, zs + 0.3) && _grSoil(x, zs + 2.1) && _grSoil(x + 1.5, zs + 2.1) && _grSoil(x + 0.75, zs + 1.2))) continue;
          const m = bk(x, zs); World._allot = (World._allot || 0) + 1;
          for (let r = 0; r < 4; r++) {
            const zr = zs + 0.3 + r * 0.6, ya = gy(x, zr), yb = gy(x + 1.5, zr), w = 0.27, h = 0.08;
            m.mat(MAT.MUD, RIDGE, 0.5); m.quad2([x, ya, zr - w], [x, ya + h, zr], [x + 1.5, yb + h, zr], [x + 1.5, yb, zr - w]);
            m.mat(MAT.MUD, TOP, 0.5); m.quad2([x, ya + h, zr], [x, ya, zr + w], [x + 1.5, yb, zr + w], [x + 1.5, yb + h, zr]);
            if (r < 3) { m.mat(MAT.MUD, TROUGH, 0.5); const zt = zr + 0.3; m.quad2([x, gy(x, zt) + 0.015, zt - 0.06], [x, gy(x, zt) + 0.015, zt + 0.06], [x + 1.5, gy(x + 1.5, zt) + 0.015, zt + 0.06], [x + 1.5, gy(x + 1.5, zt) + 0.015, zt - 0.06]); }
          }
          m.mat(MAT.TIMBER, BOARD, 0.5); for (const zz of [zs - 0.04, zs + 2.44]) m.beam([x, gy(x, zz) + 0.05, zz], [x + 1.5, gy(x + 1.5, zz) + 0.05, zz], 0.03, 0.1);
          if (!planted) continue;
          if (kind === 'beans') { if (Math.round((x - b[0]) / 1.5) % 2 === 0) { const cz = zs + 1.2, cy = gy(x + 0.75, cz); m.mat(MAT.TIMBER, [0.5, 0.4, 0.28], 0.5); for (let q = 0; q < 3; q++) { const a = q * 2.09 + 0.4; m.beam([x + 0.75 + Math.cos(a) * 0.45, cy, cz + Math.sin(a) * 0.45], [x + 0.75, cy + 1.9, cz], 0.018, 0.018); }
            for (let q = 0; q < 3; q++) K(m, 'Prop_Vine2', x + 0.75, cy + 0.3, cz, 0.55 - q * 0.03, _grGn(x, zs) * 6 + q * 2.09, -0.85); } }
          else for (const zr of [zs + 0.3, zs + 0.9, zs + 1.5, zs + 2.1]) for (let q = 0; q < 3; q++) { const px = x + 0.25 + q * 0.5, pz = zr + (_grGn(px * 9, zr * 9) - 0.5) * 0.08, sc = (kind === 'greens' ? 0.5 : 0.36) * (0.7 + _grGn(px * 5, pz * 5) * 0.7), a = _grGn(px, pz) * 6; K(m, 'Prop_Vine4', px, gy(px, pz) + 0.05, pz, sc, a, -0.95); K(m, 'Prop_Vine4', px, gy(px, pz) + 0.05, pz, sc * 0.9, a + 3.14, -0.95); }
        }
      }
      for (let zs = b[1] + 0.6; zs + 2.4 < b[3] - 0.3; zs += 3.0) { const x = b[0] + 0.25, z = zs + 2.7; if (!_grSoil(x + 1, zs + 1.2)) continue; const m = bk(x, z), y = gy(x, z); K(m, 'rusted_spade_01', b[0] + 1.2, gy(b[0] + 1.2, zs + 2.2) - 0.35, zs + 2.2, 1, 0.5, 0.12); K(m, 'wooden_bucket_01', x, y, z, 1, 1.1); K(m, 'wicker_basket_02', x + 0.6, gy(x + 0.6, z), z + 0.2, 1.3, 2.4); K(m, 'wooden_barrels_01_a', x - 0.6, gy(x - 0.6, z - 0.2), z - 0.2, 1, 0); addCircleCollider(m, x - 0.6, z - 0.2, 0.35, y, y + 0.9); break; }
    }
  }
  for (const p of GROUND.places) {
    if (p.kind === 'orchard') {      /* [fx3] loose rows 5.5 to 7 m apart, never a grid: each tree jittered, a few gaps, one dead stump, a ladder and a basket under one tree */
      const dx = 6.2, dz = 6.0, T = []; let row = 0, stump = null;
      for (let z = p.z0 + 3; z < p.z1 - 1.5; z += dz + (R() - 0.5) * 1.4, row++) for (let x = p.x0 + 2.8 + (row % 2) * 2.4; x < p.x1 - 1.5; x += dx + (R() - 0.5) * 1.6) {
        const tx = x + (R() - 0.5) * 2.2, tz = z + (R() - 0.5) * 2.4;
        if (R() < 0.16) { if (!stump && R() < 0.5) stump = [tx, tz]; continue; }
        T.push([tx, tz]); World.yardTrees.push([tx, tz, 'oak', 0.6 + R() * 0.2]); }
      const m = bucket(p.x0 + 4, p.z0 + 4), K = (n, x, y, z, sc, ry, tilt) => { if (typeof kplace !== 'function' || typeof scanOn !== 'function' || !scanOn()) return; const P = kplace(m, n, x, y, z, sc, ry); if (!P) return; if (tilt) P.M.multiply(new THREE.Matrix4().makeRotationX(tilt)); kadd(m, P); };
      if (stump) K('tree_stump_01', stump[0], gy(stump[0], stump[1]) - 0.04, stump[1], 0.55, R() * 6);
      const t = T[Math.min(T.length - 1, 4)]; if (t) {
        const lx = t[0] + 0.55, lz = t[1] + 0.35; K('wooden_ladder', lx, gy(lx, lz), lz, 1.7, Math.atan2(-0.55, -0.35) + Math.PI, -0.22);
        K('wicker_basket_02', t[0] - 0.7, gy(t[0] - 0.7, t[1] + 0.9), t[1] + 0.9, 1.5, 0.8);
        for (let k = 0; k < 6; k++) { const a = R() * 6.28, r = 0.6 + R() * 1.2, ax = t[0] + Math.cos(a) * r, az = t[1] + Math.sin(a) * r; K('food_apple_01', ax, gy(ax, az), az, 1.5, R() * 6); } }
      for (let k = 0; k < 14; k++) { const x = p.x0 + 2 + R() * (p.x1 - p.x0 - 4), z = p.z0 + 2 + R() * (p.z1 - p.z0 - 4); K('weed_plant_02_a', x, gy(x, z), z, 1.6 + R() * 1.0, R() * 6); } }
    else if (p.kind === 'green') {
      World.yardTrees.push([p.x, p.z, 'oak', 0.9]);
      for (const [a, y] of [[0.5, 0.2], [3.6, 0.2]]) { const x = p.x + Math.cos(a) * 2.3, z = p.z + Math.sin(a) * 2.3, m = bucket(x, z); m.push().T(x, gy(x, z), z).RY(-(a + Math.PI / 2)); Props.bench(m, 1.7); m.pop(); }
      const sx = p.x + Math.cos(0.5) * 2.3 + 0.1, sz = p.z + Math.sin(0.5) * 2.3 + 1.0; World.spots['green.bench'] = { p: [sx, gy(sx, sz), sz], yaw: Math.atan2(p.x - sx, -(p.z - sz)), zone: 0, sit: true };
    } else if (p.kind === 'drying green') {      /* [fx3] washing: the rope sags between the props; shirts, a sheet folded over the line, hose, a smock, small cloths: different widths and lengths, none white */
      const m = bucket((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2), cx = (p.x0 + p.x1) / 2, xa = p.x0 + 0.8, xb = p.x1 - 0.8, TIMc = [0.42, 0.34, 0.25];
      const COL = [[0.62, 0.58, 0.48], [0.5, 0.42, 0.33], [0.36, 0.42, 0.5], [0.56, 0.5, 0.4], [0.46, 0.34, 0.28], [0.4, 0.44, 0.36], [0.6, 0.55, 0.5], [0.3, 0.34, 0.42]];
      for (const z of [p.z0 + 2.0, p.z0 + 4.0]) {
        m.mat(MAT.TIMBER, TIMc, 0.5); for (const x of [xa, cx, xb]) { const g = gy(x, z); m.beam([x, g - 0.1, z], [x, g + 2.05, z], 0.07, 0.07); addCircleCollider(m, x, z, 0.1, g, g + 2); m.beam([x - 0.18, g + 1.95, z], [x + 0.18, g + 2.05, z], 0.05, 0.05); }
        const ry = x => { const s0 = x < cx, a = s0 ? xa : cx, b = s0 ? cx : xb, u = (x - a) / (b - a); return gy(x, z) + 1.94 - 0.3 * Math.sin(Math.PI * Math.min(1, Math.max(0, u))); };
        m.mat(MAT.PLAIN, [0.5, 0.44, 0.34], 0.5); for (let k = 0; k < 20; k++) { const x0 = xa + (xb - xa) * k / 20, x1 = xa + (xb - xa) * (k + 1) / 20; m.beam([x0, ry(x0), z], [x1, ry(x1), z], 0.02, 0.02); }
        const lo = (x, y, w, len, c, sway) => { m.mat(MAT.CLOTH, c, 0.5); const yt0 = ry(x), yt1 = ry(x + w); m.quad2([x, yt0, z + 0.01], [x + sway * 0.3, yt0 - len * 0.95, z + 0.04], [x + w + sway, yt1 - len, z - 0.03], [x + w, yt1, z - 0.01]); };
        let x = p.x0 + 1.3; let kind = 0;
        while (x < xb - 0.9) {
          const c = COL[Math.floor(R() * COL.length)], t = Math.floor(R() * 5), sw = (R() - 0.5) * 0.12;
          if (t === 0) { const w = 0.5 + R() * 0.1; lo(x, 0, w, 0.85 + R() * 0.15, c, sw); lo(x - 0.34, 0, 0.3, 0.55, c, sw * 2); lo(x + w + 0.04, 0, 0.3, 0.5, c, -sw * 2); x += w + 0.5; }      // shirt with sleeves
          else if (t === 1) { const w = 1.0 + R() * 0.2; lo(x, 0, w, 0.95, c, sw); lo(x + 0.04, 0, w - 0.08, 0.7, [c[0] * 0.92, c[1] * 0.92, c[2] * 0.92], -sw); x += w + 0.3; }      // a sheet folded over the line, the far half shorter
          else if (t === 2) { lo(x, 0, 0.14, 0.95, c, sw); lo(x + 0.3, 0, 0.14, 0.9, c, -sw); lo(x, 0, 0.44, 0.1, c, 0); x += 0.8; }      // hose
          else if (t === 3) { const w = 0.62; m.mat(MAT.CLOTH, c, 0.5); const yt0 = ry(x), yt1 = ry(x + w); m.quad2([x, yt0, z + 0.01], [x - 0.1, yt0 - 1.08, z + 0.04], [x + w + 0.1 + sw, yt1 - 1.1, z - 0.03], [x + w, yt1, z - 0.01]); x += w + 0.45; }      // smock, wider at the hem
          else { const w = 0.35 + R() * 0.2; lo(x, 0, w, 0.32 + R() * 0.15, c, sw); x += w + 0.25; }      // small cloth
        }
      }
    }
  }
}
