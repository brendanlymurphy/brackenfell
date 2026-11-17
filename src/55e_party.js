// [fx3] Party rule for rows of houses. Footprint gap under 0.6 m: one wall (the roofs butt it, see infRoofGen). 0.6 to 1.6 m: not allowed, a slot with sky in it and no use. The planner leaves these when a
// row placement skips a few decimetres; here the house on the lower-numbered side widens into the slot (the plan is built later from the site's w, so enterable houses follow) and the pair becomes a party wall.
// 1.6 m or more is a ginnel and stays. What cannot be closed by widening (the two are not side by side) is listed in INF.slots for the report.
(function () {
  INF.slots = [];
  const sites = () => INF.houses.map(h => [h, SITE[h.id] || h]);
  const yawD = (a, b) => { let d = Math.abs(((a - b) % Math.PI + Math.PI) % Math.PI); return Math.min(d, Math.PI - d); };
  for (let pass = 0; pass < 2; pass++) {
    const L = sites();
    for (let i = 0; i < L.length; i++) for (let j = 0; j < L.length; j++) {
      if (i === j) continue; const [hA, A] = L[i], [hB, B] = L[j];
      if (Math.abs(A.x - B.x) > 14 || Math.abs(A.z - B.z) > 14 || hA.id > hB.id) continue;
      if (yawD(A.yaw || 0, B.yaw || 0) > 0.06) continue;
      const c = Math.cos(A.yaw || 0), s = Math.sin(A.yaw || 0), dx = B.x - A.x, dz = B.z - A.z, lx = dx * c + dz * s, lz = -dx * s + dz * c, gap = Math.abs(lx) - (A.w + B.w) / 2;
      if (gap < 0.6 || gap >= 1.6 || Math.abs(lz) > (A.d + B.d) / 2 - 0.8) continue;
      const grow = gap - 0.06, sg = lx > 0 ? 1 : -1;
      for (const o of hA === A ? [A] : [A, hA]) { o.w += grow; o.x += c * sg * grow / 2; o.z += s * sg * grow / 2; }
      A.party = (A.party || 0) + 1; hA.party = A.party;
    }
  }
  const L = sites(); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const A = L[i][1], B = L[j][1]; if (Math.abs(A.x - B.x) > 14 || Math.abs(A.z - B.z) > 14) continue;
    const rc = q => { const c = Math.cos(q.yaw || 0), n = Math.sin(q.yaw || 0); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [q.x + a * q.w / 2 * c - b * q.d / 2 * n, q.z + a * q.w / 2 * n + b * q.d / 2 * c]); };
    const PA = rc(A), PB = rc(B); let m = 1e9; for (const [P, Q] of [[PA, PB], [PB, PA]]) for (const p of P) for (let k = 0; k < 4; k++) { const a = Q[k], b = Q[(k + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)); }
    if (m >= 0.6 && m < 1.6) INF.slots.push([L[i][0].id, L[j][0].id, +m.toFixed(2)]);
  }
  // what widening cannot close: the one that is not enterable goes (a gap house with nobody in it), otherwise the pair is reported
  for (const sl of INF.slots.slice()) { const hs = [INF.byId[sl[0]], INF.byId[sl[1]]]; if (!hs[0] || !hs[1]) continue; const gone = hs.find(h => !h.enter && !h.cell); if (!gone) continue;
    for (const arr of [INF.houses, SITES]) { const k = arr.findIndex(o => o.id === gone.id); if (k >= 0) arr.splice(k, 1); } delete INF.byId[gone.id]; delete SITE[gone.id]; INF.slots.splice(INF.slots.indexOf(sl), 1); INF.removedSlot = (INF.removedSlot || []).concat(gone.id); }
  // a lane's mouth is never inside a house: an empty house on a Wharfside lane point goes, an enterable one shortens the lane by whole points until it ends 1 m clear of it
  for (const rd of ROADS.filter(r => /^wharf\./.test(r.id))) {
    const inside = (x, z, pad) => SITES.find(o => { if (!o.w || o.id === 'tower') return false; const l = worldToSite(o, x, z); return Math.abs(l[0]) < o.w / 2 + pad && Math.abs(l[1]) < o.d / 2 + pad; });
    for (let k = 0; k < rd.pts.length; k++) for (const t of [0, 0.5]) { const a = rd.pts[k], b = rd.pts[k + 1] || a, o = inside(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.9); if (!o) continue; const h = INF.byId[o.id]; if (h && !h.enter && !h.cell) { for (const arr of [INF.houses, SITES]) { const i = arr.findIndex(q => q.id === o.id); if (i >= 0) arr.splice(i, 1); } delete INF.byId[o.id]; delete SITE[o.id]; INF.removedSlot = (INF.removedSlot || []).concat(o.id); } }
    while (rd.pts.length > 2 && inside(rd.pts[rd.pts.length - 1][0], rd.pts[rd.pts.length - 1][1], 1.0)) rd.pts.pop();
    while (rd.pts.length > 2 && inside(rd.pts[0][0], rd.pts[0][1], 1.0)) rd.pts.shift();
  }
  INF.count = INF.houses.length;
})();
