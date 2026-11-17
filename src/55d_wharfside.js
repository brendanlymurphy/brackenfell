// ───────────────────────── Wharf Street and Wharfside: the lower town as a street (docs/TOWNPLAN.md sections 2 and 3) ─────────────────────────
// Same houses, moved and turned (ids, cells, households go with them). The south road bends once, at z 55 to 61, so the view down the street from the market closes on a house end-on and then
// opens on the wharf; the houses stand on both sides in rows with party walls and a ginnel or two, fronts on a street 3.2 to 4.4 m wide.
// Data block: WHARF.houses lists [id, x, z, yaw] after the layout (the plots, the terrain painter and the builders read it).
const WHARF = { houses: [], rows: {}, gables: [], poly: null, street: null };
(function wharfLayout() {
  if (typeof TEST !== 'undefined' && TEST && (TEST.wharf === 0 || TEST.infill === 0)) return;
  const road = ROADS.find(r => r.id === 'south'); if (!road || !INF.LN) return;
  // the street: the south road keeps its first stretch (the market's mouth), then bends once and runs down to the wharf stair
  road.pts = [[0, 11], [-1.5, 30], [0.4, 36], [0.9, 48], [1.3, 55], [3.2, 57.8], [4.6, 61.5], [4.8, 70], [5.3, 76], [5.0, 80], [6.6, 87.5]];
  { const p = catmull(road.pts, 1.5), cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + hyp(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); INF.LN.south = Object.assign({ p, cum, len: cum[cum.length - 1] }, { w: road.w }); }
  const L = INF.LN.south, pt = INF.pt, dist = INF.dist;
  const s0 = dist(L, 0.4, 36)[1], sEnd = dist(L, 4.9, 74.5)[1];
  const tan = (s, Ln) => { Ln = Ln || L; const a = pt(Ln, s - 0.6), b = pt(Ln, s + 0.6), dx = b[0] - a[0], dz = b[1] - a[1], l = hyp(dx, dz) || 1; return [dx / l, dz / l]; };
  const sw = s => { const z = pt(L, s)[1]; return z < 52 ? 4.4 - (z - 36) * 0.045 : z < 64 ? 3.6 : 3.9; };      // 4.4 m narrowing to 3.6 at the bend, 3.9 below it
  const placed = [];
  const corners = (x, z, yaw, w, d, m) => { const c = Math.cos(yaw), sn = Math.sin(yaw), out = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]]) { const lx = a * (w / 2 + m), lz = b * (d / 2 + m); out.push([x + lx * c - lz * sn, z + lx * sn + lz * c]); } return out; };
  const inR = (o, px, pz, m) => { const c = Math.cos(o.yaw), sn = Math.sin(o.yaw), dx = px - o.x, dz = pz - o.z, lx = dx * c + dz * sn, lz = -dx * sn + dz * c; return Math.abs(lx) < o.w / 2 + m && Math.abs(lz) < o.d / 2 + m; };
  const hits = (x, z, yaw, w, d, m) => placed.some(o => hyp(o.x - x, o.z - z) < 9 && (corners(x, z, yaw, w, d, 0).some(([px, pz]) => inR(o, px, pz, m)) || corners(o.x, o.z, o.yaw, o.w, o.d, 0).some(([px, pz]) => inR({ x, z, yaw, w, d }, px, pz, m))));
  const move = (id, x, z, yaw) => { const st = SITE[id], h = INF.byId[id]; if (!st) return; st.x = x; st.z = z; st.yaw = yaw; if (h) { h.x = x; h.z = z; h.yaw = yaw; h.placed = true; } placed.push({ x, z, yaw, w: st.w, d: st.d, id }); WHARF.houses.push([id, +x.toFixed(2), +z.toFixed(2), +yaw.toFixed(3)]); };
  // a row: houses one after the other along the street on one side (side -1 west, +1 east), from arc length s to e; gap[id] is the lane left after a house
  const row = (name, side, ids, s, e, gap, Ln, swf) => {
    Ln = Ln || L; swf = swf || sw; WHARF.rows[name] = [];
    for (const id of ids) {
      const st = SITE[id]; if (!st) continue; let ok = false;
      for (let tries = 0; tries < 14 && s + st.w <= e + 0.01 + tries * 0.0; tries++, s += 0.5) {
        const sc = s + st.w / 2, P = pt(Ln, sc), t = tan(sc, Ln), ex = t[1], ez = -t[0], off = side * (swf(sc) / 2 + st.d / 2), x = P[0] + ex * off, z = P[1] + ez * off, nx = -side * ex, nz = -side * ez, yaw = Math.atan2(nx, -nz);
        if (hits(x, z, yaw, st.w, st.d, 0.1)) continue;
        move(id, x, z, yaw); WHARF.rows[name].push(id); s += st.w + ((gap && gap[id]) || 0); ok = true; break;
      }
      if (!ok) continue;
    }
  };
  // the closing house: end-on at the bend, its gable to the street (front looks north up the street), where the view from the market stops
  { const st = SITE['in.38']; if (st) { const w = 7.0, d = 4.4; st.w = w; st.d = d; if (INF.byId['in.38']) { INF.byId['in.38'].w = w; INF.byId['in.38'].d = d; } move('in.38', -2.2, 60.2, 0); WHARF.gables.push('in.38'); } }
  row('west1', -1, ['in.23', 'in.24', 'in.37', 'in.58'], s0 + 1.5, s0 + 19.5, { 'in.24': 1.4 });
  row('west2', -1, ['in.59', 'in.60', 'in.55'], dist(L, 4.6, 63.5)[1], sEnd, { 'in.60': 1.4 });
  row('east', 1, ['in.51', 'in.50', 'in.19', 'in.20', 'in.34', 'in.35', 'in.36', 'in.52'], s0 + 1.0, sEnd, { 'in.19': 1.4, 'in.34': 1.4 });
  // back lanes: two on the west (x -12 and -24), two on the east; each is the back lane of the yards on one side and the front lane of the row on the other
  const mkL = pts => { const p = catmull(pts, 1.5), cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + hyp(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, cum, len: cum[cum.length - 1] }; };
  WHARF.lanes = { w1: mkL([[-12, 35], [-12, 55], [-12.4, 76]]), w2: mkL([[-24, 35], [-24, 55], [-24.4, 76]]), e1: mkL([[15.2, 35], [15.6, 50], [16.6, 60], [17.4, 74]]), e2: mkL([[28, 35], [28, 55], [28.6, 74]]) };
  for (const id in WHARF.lanes) { const ln = WHARF.lanes[id]; ln.w = 2.4; INF.LN['wharf.' + id] = ln; ROADS.push({ id: 'wharf.' + id, w: 2.4, pts: ln.p.filter((q, i) => i % 4 === 0 || i === ln.p.length - 1) }); }
  const lw = () => 2.4;
  row('wA', -1, ['in.55', 'in.107', 'in.37', 'in.109', 'in.111', 'in.114', 'in.113'], 1.5, WHARF.lanes.w1.len - 4, { 'in.109': 1.4 }, WHARF.lanes.w1, lw);
  row('wB', -1, ['in.106', 'in.108', 'in.110', 'in.112', 'in.113'], 1.5, WHARF.lanes.w2.len - 3, { 'in.108': 1.4 }, WHARF.lanes.w2, lw);
  row('eA', 1, ['in.53', 'in.52', 'in.56', 'in.126', 'in.57', 'in.36', 'in.127'], 1.5, WHARF.lanes.e1.len - 3, { 'in.52': 1.4, 'in.126': 1.4 }, WHARF.lanes.e1, lw);
  row('eB', 1, ['in.120', 'in.122', 'in.124', 'in.36', 'in.121', 'in.123', 'in.125'], 1.5, WHARF.lanes.e2.len - 3, { 'in.122': 1.4 }, WHARF.lanes.e2, lw);
  // the lane's end-on closer: in.115 stands across the foot of the west lane, its front looking up it
  { const st = SITE['in.115']; if (st && !placed.some(o => o.id === 'in.115')) { move('in.115', -12.4, 79.3, 0); WHARF.gables.push('in.115'); } }
  // whatever an infill house now stands on (and is not itself placed or enterable) goes: dropped like the Market Place does
  const drop = h => { INF.houses.splice(INF.houses.indexOf(h), 1); delete INF.byId[h.id]; delete SITE[h.id]; const i = SITES.findIndex(q => q.id === h.id); if (i >= 0) SITES.splice(i, 1); };
  for (const h of INF.houses.slice()) {
    if (h.placed || h.enter || placed.some(o => o.id === h.id)) continue;
    const st = SITE[h.id]; if (!st) continue; if (!placed.some(o => hyp(o.x - st.x, o.z - st.z) < 12)) continue;
    const mk = { x: st.x, z: st.z, yaw: st.yaw, w: st.w, d: st.d };
    if (hits(mk.x, mk.z, mk.yaw, mk.w, mk.d, 0.6)) drop(h);
  }
  // the street itself must stay clear: whatever (not placed) still stands within the street's width goes, or stands to the side
  for (const h of INF.houses.slice()) { if (h.placed || h.enter) continue; const st = SITE[h.id]; if (st && st.z > 34 && st.z < 78 && st.x > -34 && st.x < 46 && !placed.some(o => o.id === h.id)) drop(h); }      // what found no place in a row goes: the district is rows and lanes, not houses on lawn
  INF.count = INF.houses.length; WHARF.street = { s0, sEnd, L };
})();
