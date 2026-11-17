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
    const w = 2.0 + R() * 0.7, depth = 1.5 + R() * 0.3, nz = 3, nx = 2;
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
