// ───────────────────────── Wharf Street and Wharfside: the lower town as a street (docs/TOWNPLAN.md sections 2 and 3) ─────────────────────────
// Same houses, moved and turned (ids, cells, households go with them). The south road bends once, at z 55 to 61, so the view down the street from the market closes on a house end-on and then
// opens on the wharf; the houses stand on both sides in rows with party walls and a ginnel or two, fronts on a street 3.2 to 4.4 m wide.
// Data block: WHARF.houses lists [id, x, z, yaw] after the layout (the plots, the terrain painter and the builders read it).
const WHARF = { houses: [], rows: {}, gables: [], poly: null, street: null, lanes: {}, edge: [] };
(function wharfLayout() {
  if (typeof TEST !== 'undefined' && TEST && (TEST.wharf === 0 || TEST.infill === 0)) return;
  const road = ROADS.find(r => r.id === 'south'); if (!road || !INF.LN) return;
  // the street: the south road keeps its first stretch (the market's mouth), then runs in a long S: east round the closing house at z 55 to 62, back west at z 68 to 76, and opens on the wharf yard
  road.pts = [[0, 11], [-1.5, 30], [0.4, 36], [0.5, 46], [1.6, 54], [3.8, 58.4], [6.0, 63], [7.3, 68], [6.4, 73], [5.2, 77], [5.0, 80], [6.6, 87.5]];
  const mkL = pts => { const p = catmull(pts, 1.5), cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + hyp(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, cum, len: cum[cum.length - 1] }; };
  INF.LN.south = Object.assign(mkL(road.pts), { w: road.w });
  const L = INF.LN.south, pt = INF.pt, dist = INF.dist;
  const s0 = dist(L, 0.4, 36)[1], sEnd = dist(L, 5.4, 76)[1];
  const tan = (s, Ln) => { Ln = Ln || L; const a = pt(Ln, s - 0.6), b = pt(Ln, s + 0.6), dx = b[0] - a[0], dz = b[1] - a[1], l = hyp(dx, dz) || 1; return [dx / l, dz / l]; };
  const sw = s => { const z = pt(L, s)[1]; return Math.abs(z - 57) < 4 ? 3.2 : Math.abs(z - 69) < 4 ? 3.3 : (Math.abs(z - 44) < 3 || z > 74) ? 5.0 : 3.9; };      // narrowest at the bends, wide where a lane joins and at the yard
  const placed = [], RJ = rng(6161);
  const corners = (x, z, yaw, w, d, m) => { const c = Math.cos(yaw), sn = Math.sin(yaw), out = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]]) { const lx = a * (w / 2 + m), lz = b * (d / 2 + m); out.push([x + lx * c - lz * sn, z + lx * sn + lz * c]); } return out; };
  const inR = (o, px, pz, m) => { const c = Math.cos(o.yaw), sn = Math.sin(o.yaw), dx = px - o.x, dz = pz - o.z, lx = dx * c + dz * sn, lz = -dx * sn + dz * c; return Math.abs(lx) < o.w / 2 + m && Math.abs(lz) < o.d / 2 + m; };
  const hits = (x, z, yaw, w, d, m) => placed.some(o => hyp(o.x - x, o.z - z) < 10 && (corners(x, z, yaw, w, d, 0).some(([px, pz]) => inR(o, px, pz, m)) || corners(o.x, o.z, o.yaw, o.w, o.d, 0).some(([px, pz]) => inR({ x, z, yaw, w, d }, px, pz, m))));
  const move = (id, x, z, yaw) => { const st = SITE[id], h = INF.byId[id]; if (!st) return; st.x = x; st.z = z; st.yaw = yaw; if (h) { h.x = x; h.z = z; h.yaw = yaw; h.placed = true; } placed.push({ x, z, yaw, w: st.w, d: st.d, id }); WHARF.houses.push([id, +x.toFixed(2), +z.toFixed(2), +yaw.toFixed(3)]); };
  // a row: houses one after the other along a line on one side (side -1 / +1 of its direction), from arc length s to e; gap[id] = a lane or ginnel left after the house; fronts step in and out by up to 0.8 m
  const row = (name, side, ids, s, e, gap, Ln, swf, jit) => {
    Ln = Ln || L; swf = swf || sw; WHARF.rows[name] = [];
    for (const id of ids) {
      const st = SITE[id]; if (!st) continue;
      for (let tries = 0; tries < 16 && s + st.w <= e + 0.01; tries++, s += 0.5) {
        const sc = s + st.w / 2, P = pt(Ln, sc), t = tan(sc, Ln), ex = t[1], ez = -t[0], step = jit ? (RJ() - 0.5) * 1.6 : 0, off = side * (swf(sc) / 2 + st.d / 2 + step), x = P[0] + ex * off, z = P[1] + ez * off, nx = -side * ex, nz = -side * ez, yaw = Math.atan2(nx, -nz);
        if (hits(x, z, yaw, st.w, st.d, 0.1)) continue;
        move(id, x, z, yaw); WHARF.rows[name].push(id); s += st.w + ((gap && gap[id]) || 0); break;
      }
    }
  };
  // end-on: a house across the end of a line (or at a bend), its front looking back up the line, centred on it
  const closer = (id, Ln, s, back) => { const st = SITE[id]; if (!st) return; const P = pt(Ln, s), t = tan(s, Ln), nx = -t[0], nz = -t[1], yaw = Math.atan2(nx, -nz); const x = P[0] - nx * (st.d / 2 + (back || 0)), z = P[1] - nz * (st.d / 2 + (back || 0)); if (!hits(x, z, yaw, st.w, st.d, 0.1)) { move(id, x, z, yaw); WHARF.gables.push(id); } };
  // the first bend: in.38 end-on, front to the north, where the view from the market stops
  { const st = SITE['in.38']; if (st) { st.w = 7.0; st.d = 4.4; if (INF.byId['in.38']) { INF.byId['in.38'].w = 7.0; INF.byId['in.38'].d = 4.4; } move('in.38', -2.4, 60.4, 0); WHARF.gables.push('in.38'); } }
  // lanes: the west lane leaves the street at 20 degrees and bends toward the shore (like a fish bone); the Bank Lane follows the river a plot's depth back from the water
  const lanes = { w1: mkL([[-2.2, 40.5], [-6.3, 51.5], [-11.6, 61.5], [-18.5, 69.5], [-24.5, 78]]) };
  { const RP = [[59, 34], [58, 42], [56.5, 48], [54.5, 54], [52, 60], [49, 66], [45, 72], [41, 78], [36.5, 84]], off = 16.5; lanes.bank = mkL(RP.map(([x, z], i) => [x - off + (i > 5 ? i - 5 : 0) * 0.8, z - (i > 5 ? 0 : 0)])); }
  for (const id in lanes) { const ln = lanes[id]; ln.w = id === 'bank' ? 3.0 : 2.4; WHARF.lanes[id] = ln; INF.LN['wharf.' + id] = ln; if (!(TEST && TEST.nolane)) ROADS.push({ id: 'wharf.' + id, w: ln.w, pts: ln.p.filter((q, i) => i % 4 === 0 || i === ln.p.length - 1) }); }
  const lw = () => 2.4, bw = () => 3.0;
  // street, west side: before the closer, and the lower stretch
  row('swN', -1, ['in.23', 'in.24', 'in.58'], s0 + 1.5, s0 + 17.5, { 'in.24': 1.5 });
  row('swS', -1, ['in.60'], dist(L, 6.0, 64.5)[1], sEnd - 2);
  // street, east side, with a ginnel after in.19
  row('se', 1, ['in.51', 'in.50', 'in.19', 'in.20', 'in.34'], s0 + 1.0, sEnd, { 'in.19': 1.5 });
  // the west lane: a row of four on its west side, a short row of two lower down on its east side, in.115 across its foot
  row('w1w', -1, ['in.55', 'in.107', 'in.37', 'in.109'], 1.0, lanes.w1.len - 9, { 'in.107': 1.5 }, lanes.w1, lw, true);
  row('w1e', 1, ['in.111', 'in.113'], 14, lanes.w1.len - 4, {}, lanes.w1, lw, true);
  closer('in.115', lanes.w1, lanes.w1.len - 1.5, 0.5);
  // the Bank Lane: houses east of it back onto the river (three runs with a wash place between), houses west of it back onto the street's east-side yards; in.36 stands across its foot
  row('bankE1', 1, ['in.53', 'in.52'], 1.0, 14, {}, lanes.bank, bw, true);
  row('bankE2', 1, ['in.56', 'in.126', 'in.57'], 18, lanes.bank.len - 10, { 'in.126': 1.5 }, lanes.bank, bw, true);
  row('bankW', -1, ['in.120', 'in.122', 'in.124', 'in.121'], 3, lanes.bank.len - 8, { 'in.122': 1.5 }, lanes.bank, bw, true);
  closer('in.36', lanes.bank, lanes.bank.len - 1.0, 0.4);
  // the wharf yard: a net loft west of the open ground and a smokehouse east of it (two houses of the old infill given those parts), the fisher's hut and the boat shed round it
  const yard = (id, x, z, yaw) => { const st = SITE[id]; if (st && !hits(x, z, yaw, st.w, st.d, 0.2)) { move(id, x, z, yaw); WHARF.yard = (WHARF.yard || []).concat(id); } };
  yard('in.114', -9.2, 73.4, Math.PI / 2); yard('in.127', 11.2, 71.2, -Math.PI / 2);
  // whatever an infill house now stands on (and is not itself placed or enterable) goes, and what found no place in a line
  const drop = h => { INF.houses.splice(INF.houses.indexOf(h), 1); delete INF.byId[h.id]; delete SITE[h.id]; const i = SITES.findIndex(q => q.id === h.id); if (i >= 0) SITES.splice(i, 1); };
  for (const h of INF.houses.slice()) { if (h.placed || h.enter) continue; const st = SITE[h.id]; if (st && st.z > 34 && st.z < 80 && st.x > -34 && st.x < 48 && !placed.some(o => o.id === h.id)) drop(h); }
  // the edge: west and north a ditch and fence line that bends, the last yards running out to it; east the river bank, south the shore
  WHARF.edge = [[-8, 35], [-17, 40], [-29, 46], [-36, 57], [-37.5, 68], [-35, 77], [-30, 86]];
  INF.count = INF.houses.length; WHARF.street = { s0, sEnd, L };
})();
