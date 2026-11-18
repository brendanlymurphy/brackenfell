// [inout] proof pictures of a refitted house: the front from the street, each level from where one arrives (street door, stair head), the view out of an upper door.
// usage: node test/audit/run.mjs --size 800x500 --dir docs/proof/inout --q 70 --opt webgl=1 test/inout_proof.js   with window.__proofIds = ['smithy', ...] set by a first script, or edit IDS
const IDS = window.__proofIds || ['inn', 'smithy', 'elder', 'herbalist', 'guardhouse', 'weaver', 'draper'], shot = async (n, x, y, z, yaw, pitch) => { game.shot(x, y, z, yaw, pitch, 13); await __snap(n); };
const out = {};
for (const id of IDS) {
  const h = World.houses[id], P = h && h.plan; if (!P) continue; const s = h.site, made = [];
  // the front: on the front wall's normal, 8 m out (nearer if something is in the way), looking at the middle of the wall
  { const fx = Math.sin(s.yaw), fz = -Math.cos(s.yaw), tx = s.x + fx * s.d / 2, tz = s.z + fz * s.d / 2; let best = 8;
    for (const dd of [8, 6.5, 5, 10]) { const px = tx + fx * dd, pz = tz + fz * dd; if (!World.colliders.some(c => c.y0 < 1.5 && c.y1 > 0.8 && (c.r !== undefined ? Math.hypot(px - c.x, pz - c.z) < c.r + 0.4 : Math.abs(px - c.x) < (c.hx || 0) + 0.4 && Math.abs(pz - c.z) < (c.hz || 0) + 0.4))) { best = dd; break; } }
    const px = tx + fx * best, pz = tz + fz * best; await shot(id + '/front', px, null, pz, Math.atan2(tx - px, -(tz - pz)) * 180 / Math.PI, 10); made.push('front'); }
  game.enter(id); game.step(10, 1 / 30);
  const look = (k, x, z, yawPlan, nm, pitch) => { const L = P.lv[k], p = P.w2(x, L.y, z); return shot(id + '/' + nm, p[0], p[1] + 1.6, p[2], yawPlan + (P.yaw || 0) * 180 / Math.PI, pitch === undefined ? -6 : pitch); };
  for (const k of Object.keys(P.lv).map(Number).sort((a, b) => a - b)) {
    let at = null, toward = null;
    if (k === 0) { const e = P.doors.find(d => d.b === null && !d.upper); at = [e.x, e.z + 0.5]; }
    else { const st = P.stairs.find(q => q.k1 === k) || P.stairs.find(q => q.k0 === k); if (!st) continue; at = st.k1 === k ? st.highPt : st.lowPt; }
    const rs = Object.values(P.rooms).filter(r => r.k === k), bx = [Math.min(...rs.map(r => r.x0)), Math.min(...rs.map(r => r.z0)), Math.max(...rs.map(r => r.x1)), Math.max(...rs.map(r => r.z1))];
    toward = [(bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2]; if (Math.hypot(toward[0] - at[0], toward[1] - at[1]) < 1) toward = [bx[0] + 0.5, bx[3] - 0.5];
    const yaw = Math.atan2(toward[0] - at[0], -(toward[1] - at[1])) * 180 / Math.PI;
    await look(k, at[0], at[1], yaw, 'level' + k, k < 0 ? -10 : -6); made.push('level' + k);
  }
  for (const d of P.doors.filter(d => d.upper && d.balcony)) { const o = d.balcony.out; Cells.teleport(o); game.step(4, 1 / 30); await shot(id + '/out_of_the_upper_door', o.p[0], o.p[1] + 1.6, o.p[2], o.yaw * 180 / Math.PI, -10); made.push('out_of_the_upper_door'); }
  game.leave && game.leave(); out[id] = made;
}
return out;
