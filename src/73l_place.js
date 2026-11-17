// ───────────────────────── the Market Place's ground furniture (docs/TOWNPLAN.md section 4) ─────────────────────────
// Flagstones at every door that opens on the place: an apron of 6 to 9 irregular slabs, laid in two courses out from the sill, a little proud of the cobbles and worn at the front edge.
// Merged into the village cells through `bucket`; nothing here is solid (a slab is 4 cm high).
function buildPlaceFlags(bucket) {
  if (TEST && TEST.flags === 0) return;
  const R = rng(6403);
  for (const s of SITES) {
    if (!s.w || s.id === 'tower' || s.id === 'barn') continue;
    const dl = siteDoorLocal(s, 0), d0 = siteToWorld(s, dl[0], dl[1]), d1 = siteToWorld(s, ...(() => { const w = s.doorWall || 'front'; return w === 'front' ? [dl[0], dl[1] - 1] : w === 'back' ? [dl[0], dl[1] + 1] : w === 'left' ? [dl[0] - 1, dl[1]] : [dl[0] + 1, dl[1]]; })());
    if (placeW(d1[0], d1[1], 0.01) < 1) continue;                     // the door's apron lies inside the place's outline
    const ox = d1[0] - d0[0], oz = d1[1] - d0[1], ang = Math.atan2(oz, ox), m = bucket(d0[0], d0[1]);
    const w = 2.0 + R() * 0.7, depth = 1.5 + R() * 0.3, nz = 2, nx = 2;
    m.m1 = 0; m.m2 = 0; m.ao = 1; m.grad = null;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const du = 0.05 + (i + 0.5) * depth / nx + (R() - 0.5) * 0.12, dv = (j + 0.5 - nz / 2) * w / nz + (R() - 0.5) * 0.14, cx = d0[0] + ox * du - oz * dv, cz = d0[1] + oz * du + ox * dv;
      const hu = depth / nx / 2 - 0.02 - R() * 0.05, hv = w / nz / 2 - 0.02 - R() * 0.05, g = Terrain.y(cx, cz), tone = 0.52 + R() * 0.16, front = i === nx - 1 ? 0.92 : 1;
      m.push().T(cx, g, cz).RY(-ang + (R() - 0.5) * 0.06);
      m.mat(MAT.STONE, [tone * front, tone * 0.98 * front, tone * 0.94 * front], 1.2); m.box(-hu, -0.03, -hv, hu, 0.035, hv, 4);
      m.pop();
    }
  }
}

// [fx3] what makes the place's ground look used, as things you can point at: a drain channel with kerb stones and a few cover slabs, patches of trodden dirt and straw round every stall, cart and the well, and along the wall feet
function buildPlaceWear(bucket) {
  if (TEST && TEST.wear === 0) return;
  const R = rng(7712), gy = (x, z) => Terrain.y(x, z), flat = (m, x, z, rx, rz, c, mat, ry, lift) => { m.mat(mat, c, 0.5); m.push().T(x, gy(x, z) + (lift || 0.016), z).RY(ry); m.quad2([-rx, 0, -rz * 0.6], [-rx * 0.6, 0, rz], [rx, 0, rz * 0.7], [rx * 0.7, 0, -rz]); m.pop(); };
  const dr = [[-19.4, -0.5], [-10, 0.4], [-3, 1.1], [3, 1.7], [10, 2.3], [20.2, 3.4]], br = [[2.8, 1.6], [0.9, 5.5], [0.3, 9], [0.2, 14], [0.2, 22]];
  for (const pl of [dr, br]) for (let i = 0; i + 1 < pl.length; i++) {
    const a = pl[i], b = pl[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 1.6)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, cx = a[0] + (b[0] - a[0]) * (t0 + t1) / 2, cz = a[1] + (b[1] - a[1]) * (t0 + t1) / 2, hl = L / n / 2 + 0.03, g = gy(cx, cz), m = bucket(cx, cz);
      if (placeW(cx, cz, 0.01) < 1 && pl === dr) continue;
      const cover = R() < 0.18;
      m.push().T(cx, g, cz).RY(-ang);
      m.mat(MAT.PLAIN, [0.045, 0.05, 0.05], 0.5); m.box(-hl, 0.004, -0.16, hl, 0.012, 0.16, 4);
      m.mat(MAT.STONE, [0.34 + R() * 0.08, 0.32 + R() * 0.06, 0.29], 1.2); for (const sg of [-1, 1]) m.box(-hl, 0, sg * 0.2 - 0.07, hl, 0.04, sg * 0.2 + 0.07, 4);
      if (cover) { m.mat(MAT.STONE, [0.46, 0.43, 0.39], 1.2); m.box(-0.34, 0.0, -0.27, 0.34, 0.05, 0.27, 4); }
      m.pop();
    }
  }
  const spots = []; for (const c of World.colliders) { if (c.y0 > gy(c.x, c.z) + 0.7 || c.y1 - c.y0 > 3.2 || placeW(c.x, c.z, 0.01) < 1) continue; const rad = c.r !== undefined ? c.r : Math.max(c.hx, c.hz); if (rad > 2.2 || rad < 0.12) continue; spots.push([c.x, c.z, rad]); }
  let n = 0; for (const [x, z, rad] of spots) { if (n++ > 40) break; const m = bucket(x, z);
    for (let i = 0; i < 1; i++) { const a = R() * TAU, d = rad + 0.25 + R() * 0.5; flat(m, x + Math.cos(a) * d, z + Math.sin(a) * d, 0.45 + R() * 0.5, 0.3 + R() * 0.3, [0.2 + R() * 0.05, 0.15, 0.1], MAT.MUD, R() * 3); }
    for (let i = 0; i < 2; i++) { const a = R() * TAU, d = rad + 0.1 + R() * 0.8; flat(m, x + Math.cos(a) * d, z + Math.sin(a) * d, 0.25 + R() * 0.25, 0.08 + R() * 0.08, [0.66 + R() * 0.1, 0.52, 0.25], MAT.THATCH, R() * 3, 0.022); }
  }
  const well = [6.2, -7.3]; { const m = bucket(well[0], well[1]); for (let i = 0; i < 5; i++) { const a = i * 1.26 + R(), d = 1.1 + R() * 0.8; flat(m, well[0] + Math.cos(a) * d, well[1] + Math.sin(a) * d, 0.5 + R() * 0.4, 0.3, [0.13, 0.12, 0.11], MAT.PLAIN, R() * 3, 0.014); } }
  for (const s of SITES) { if (!s.w || s.id === 'tower' || s.id === 'barn') continue; const dl = siteDoorLocal(s, 0), d1 = siteToWorld(s, dl[0], dl[1] - 1); if (placeW(d1[0], d1[1], 0.01) < 1 && placeW(...siteToWorld(s, dl[0], dl[1] + 1), 0.01) < 1) continue;
    for (const sd of [-1, 1]) for (let u = -s.w / 2 + 0.8; u < s.w / 2 - 0.5; u += 1.6 + R() * 1.6) for (const zz of [-1, 1]) { const w = siteToWorld(s, u, zz * (s.d / 2 + 0.3 + R() * 0.15)); if (placeW(w[0], w[1], 0.01) < 1 || sd > 0) continue; const m = bucket(w[0], w[1]); if (R() < 0.7) flat(m, w[0], w[1], 0.5 + R() * 0.4, 0.2 + R() * 0.15, [0.19, 0.145, 0.1], MAT.MUD, -s.yaw + R() * 0.3); if (R() < 0.35) flat(m, w[0], w[1], 0.28, 0.08, [0.62, 0.5, 0.24], MAT.THATCH, R() * 3, 0.022); }
  }
}
