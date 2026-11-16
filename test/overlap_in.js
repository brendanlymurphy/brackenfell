// Overlap finder for INTERIORS [fx2]: every planned cell, geometry measured from what the items actually drew (not their footprint records).
// usage: node test/shot.mjs --opt webgl=1 --opt ovl=1 --opt quality=low --do "$(cat test/overlap_in.js)"
//        window.__ovOnly = ['inn','store']   limits the cells;   window.__ovTop = 40  lists the worst;   window.__ovJson = 1 prints one json row per cell
// The recorded things (src/72d_plan.js pRecBegin: --opt ovl=1) are: floor items (mesh index range + kit pieces), hung things, hearths.
// Everything is compared in the plan's canonical frame (axis aligned: the plan turns by quarter turns only).
// kinds: wall (an item pokes into or through a wall or out of its room), item (two solids interpenetrate), hang (a hung thing through furniture or a window or door),
//        door (an item in a door's swing / clearance), stair (an item on, under or at the end of a stair), spot (a standing person's body in a solid, a sitter in a table),
//        rug (two flat things on one floor), air (an item that floats: its lowest point is above its floor by more than 0.1 m and it is not meant to be lifted)
const ROUND = /^(Barrel|wine_barrel|wooden_barrels|Vase|ceramic|Cauldron|Stool|painted_wooden_stool|Candle|CandleStick|brass_candle|wooden_candlestick|Bucket|wooden_bucket|Mug|Anvil)/;
const ONLY = window.__ovOnly, TOP = window.__ovTop || 30, PEN = 0.04;
const out = {}, rows = [];
const inv = T => { const ax = [T[0], T[1], T[2]], ay = [T[4], T[5], T[6]], az = [T[8], T[9], T[10]], o = [T[12], T[13], T[14]]; return (x, y, z) => { const d = [x - o[0], y - o[1], z - o[2]]; return [d[0] * ax[0] + d[1] * ax[1] + d[2] * ax[2], d[0] * ay[0] + d[1] * ay[1] + d[2] * ay[2], d[0] * az[0] + d[1] * az[1] + d[2] * az[2]]; }; };
const grow = (b, p) => { for (let k = 0; k < 3; k++) { if (p[k] < b.min[k]) b.min[k] = p[k]; if (p[k] > b.max[k]) b.max[k] = p[k]; } };
const newBox = () => ({ min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] });
const ov = (a, b, k) => Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]);
for (const c of Cells.list) {
  if (ONLY && !ONLY.includes(c.id)) continue;
  const ctx = c.ctx, P = ctx && (ctx.planDone || ctx.plan); if (!P || !P.items) { rows.push({ id: c.id, plan: 0 }); continue; }
  const to = inv(P.T), m = ctx.int, cnt = { wall: 0, item: 0, hang: 0, door: 0, stair: 0, spot: 0, rug: 0, air: 0 }, det = [];
  const note = (kind, s, w) => { cnt[kind]++; det.push({ kind, s, w: w || 1 }); };
  // actual boxes (canonical) of everything recorded
  const boxOf = rec => {
    if (!rec) return null; const b = newBox(); let any = false;
    for (let i = rec.t0; i < rec.t1; i++) { const v = m.idx[i]; const p = to(m.f[v * 8], m.f[v * 8 + 1], m.f[v * 8 + 2]); grow(b, p); any = true; }
    for (const pt of rec.parts) {
      const pc = Kit.pieces[pt.name]; if (!pc) continue;
      if (ROUND.test(pt.name)) { const e = pt.M.elements, ex = Math.hypot(e[0], e[1], e[2]) * (pc.max[0] - pc.min[0]), ez = Math.hypot(e[8], e[9], e[10]) * (pc.max[2] - pc.min[2]), r = Math.max(ex, ez) / 2, cx = (pc.min[0] + pc.max[0]) / 2, cy = (pc.min[1] + pc.max[1]) / 2, cz = (pc.min[2] + pc.max[2]) / 2, V = new THREE.Vector3(cx, cy, cz).applyMatrix4(pt.M), h = Math.hypot(e[4], e[5], e[6]) * (pc.max[1] - pc.min[1]) / 2, w = to(V.x, V.y, V.z); grow(b, [w[0] - r, w[1] - h, w[2] - r]); grow(b, [w[0] + r, w[1] + h, w[2] + r]); any = true; continue; }
      const q = Kit.box(pt.name, pt.M); if (!q) continue; for (let i = 0; i < 8; i++) grow(b, to(i & 1 ? q.max[0] : q.min[0], i & 2 ? q.max[1] : q.min[1], i & 4 ? q.max[2] : q.min[2])); any = true;
    }
    return any ? b : null;
  };
  const items = P.items.filter(i => i.rec && (i.kind === 'floor' || i.kind === 'hearth' || i.kind === 'rug')).map(i => ({ i, b: boxOf(i.rec) })).filter(x => x.b);
  const hung = P.wallItems.filter(w => w.rec).map(w => ({ w, b: boxOf(w.rec) })).filter(x => x.b);
  const level = k => P.lv[k];
  // 0. footprint honesty: how far the drawn geometry sticks out of the rectangle the item recorded (the rectangle is what every clearance rule uses)
  for (const { i, b } of items) { if (i.kind === 'rug') continue; const o = Math.max(i.x0 - b.min[0], b.max[0] - i.x1, i.z0 - b.min[2], b.max[2] - i.z1); if (o > 0.04) { const t = i.id.replace(/^[^.]*(\.[^.]*)?\./, '').replace(/^[a-z]?\d+/, '').replace(/\d+/g, '#'), T = (window.__ovOver = window.__ovOver || {}); (T[t] = T[t] || { n: 0, max: 0, ex: i.id + ' ' + c.id }); T[t].n++; if (o > T[t].max) { T[t].max = +o.toFixed(2); T[t].ex = c.id + ' ' + i.id + ' rect ' + (i.x1 - i.x0).toFixed(2) + 'x' + (i.z1 - i.z0).toFixed(2) + ' drawn ' + (b.max[0] - b.min[0]).toFixed(2) + 'x' + (b.max[2] - b.min[2]).toFixed(2); } } }
  // 1. wall: outside its room's inner rectangle (walls are 0.4 thick, the room's inner face is 0.2 inside the room edge)
  for (const { i, b } of items) {
    const room = P.rooms[i.room]; if (!room || i.kind === 'rug') continue; const a = room.in, tol = 0.03;
    const out_ = Math.max(a.x0 - b.min[0], b.max[0] - a.x1, a.z0 - b.min[2], b.max[2] - a.z1);
    if (out_ > tol && !/stack|hearth/.test(i.id)) note('wall', i.id + ' pokes ' + out_.toFixed(2) + ' m past its room (room ' + i.room + ')', out_);
    const L = level(i.k), top = L.y + L.H; if (b.max[1] > top + 0.02 && !/stack|hearth/.test(i.id)) note('wall', i.id + ' pokes ' + (b.max[1] - top).toFixed(2) + ' m through the ceiling', b.max[1] - top);
    if (b.min[1] < L.y - 0.02 && i.lift === 0) note('wall', i.id + ' sinks ' + (L.y - b.min[1]).toFixed(2) + ' m into the floor', L.y - b.min[1]);
    if (b.min[1] > L.y + 0.12 && !i.lift && /floor/.test(i.kind)) note('air', i.id + ' floats ' + (b.min[1] - L.y).toFixed(2) + ' m', b.min[1] - L.y);
  }
  // 2. item x item (solids); a lift means "on" another thing: skip pairs where one stands on the other
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
    const A = items[a], B = items[b]; if (A.i.k !== B.i.k) continue;
    const flat = A.i.kind === 'rug' || B.i.kind === 'rug';
    const ox = ov(A.b, B.b, 0), oy = ov(A.b, B.b, 1), oz = ov(A.b, B.b, 2); if (ox < PEN || oz < PEN || oy < PEN) continue;
    if (flat) { if (A.i.kind === 'rug' && B.i.kind === 'rug') note('rug', A.i.id + ' x ' + B.i.id + ' (two rugs overlap ' + ox.toFixed(2) + 'x' + oz.toFixed(2) + ')', Math.min(ox, oz)); else if ((A.i.kind === 'rug' ? B : A).i.kind === 'floor' && Math.min(ox, oz) > 0.15 && (A.i.kind === 'rug' ? B : A).b.min[1] < P.lv[A.i.k].y + 0.05 && /(bed|chest|table|counter|shelf|cabinet)/i.test((A.i.kind === 'rug' ? B : A).i.id) && false) note('rug', '', 1); continue; }
    if ((A.i.lift || 0) > 0.1 || (B.i.lift || 0) > 0.1) continue;
    note('item', A.i.id + ' x ' + B.i.id + ' interpenetrate ' + Math.min(ox, oz, oy).toFixed(2) + ' m (' + ox.toFixed(2) + 'x' + oz.toFixed(2) + 'x' + oy.toFixed(2) + ')', Math.min(ox, oz, oy));
  }
  // 3. hung things: through furniture (by real boxes), through a window or door, through each other
  for (const { w, b } of hung) {
    const L = level(w.k);
    for (const { i, b: ib } of items) { if (i.k !== w.k || i.kind === 'rug') continue; const ox = ov(b, ib, 0), oz = ov(b, ib, 2), oy = ov(b, ib, 1); if (ox > PEN && oz > PEN && oy > PEN && !/stack|hearth/.test(i.id)) note('hang', w.id + ' hangs through ' + i.id + ' (' + ox.toFixed(2) + 'x' + oz.toFixed(2) + 'x' + oy.toFixed(2) + ')', Math.min(ox, oz, oy)); }
    for (const op of w.wall.open) { const hw = op.type === 'door' ? op.hw : 0.8; const u0 = w.wall.ax === 'x' ? b.min[0] : b.min[2], u1 = w.wall.ax === 'x' ? b.max[0] : b.max[2]; if (u0 < op.pos + hw - 0.02 && u1 > op.pos - hw + 0.02 && (op.type === 'door' ? b.min[1] - L.y < 2.1 : b.max[1] - L.y > 0.85 && b.min[1] - L.y < 2.4)) note('hang', w.id + ' hangs over a ' + op.type + ' at ' + op.pos.toFixed(1), 1); }
    const top = L.y + L.H; if (b.max[1] > top + 0.03) note('hang', w.id + ' pokes through the ceiling ' + (b.max[1] - top).toFixed(2), b.max[1] - top);
    if (b.min[1] < L.y + 0.4 && w.y0 > 0.5 && !/rack|banner/i.test(w.id)) note('hang', w.id + ' reaches the floor (min y ' + (b.min[1] - L.y).toFixed(2) + ') though hung at ' + w.y0.toFixed(2), 1);
  }
  for (let a = 0; a < hung.length; a++) for (let b = a + 1; b < hung.length; b++) { const A = hung[a], B = hung[b]; if (A.w.k !== B.w.k) continue; const ox = ov(A.b, B.b, 0), oz = ov(A.b, B.b, 2), oy = ov(A.b, B.b, 1); if (ox > 0.06 && oz > 0.06 && oy > 0.06) note('hang', A.w.id + ' x ' + B.w.id + ' hung through each other', Math.min(ox, oz, oy)); }
  // 4. doors: the clear zone and the door's own opening (swing) against real boxes
  for (const z of P.clear) {
    if (z.kind !== 'door' && z.kind !== 'stair') continue;
    for (const { i, b } of items) { if (i.k !== z.k || i.kind === 'rug' || b.max[1] - P.lv[i.k].y < 0.3) continue; const ox = Math.min(b.max[0], z.x1) - Math.max(b.min[0], z.x0), oz = Math.min(b.max[2], z.z1) - Math.max(b.min[2], z.z0); if (ox > PEN && oz > PEN && !/stack/.test(i.id)) note(z.kind === 'door' ? 'door' : 'stair', i.id + ' stands in a ' + z.kind + ' clearance (' + ox.toFixed(2) + 'x' + oz.toFixed(2) + ')', Math.min(ox, oz)); }
  }
  for (const s of P.stairs) for (const { i, b } of items) { if (i.k !== s.k0 || i.kind === 'rug') continue; const r = s.low, ox = Math.min(b.max[0], r.x1) - Math.max(b.min[0], r.x0), oz = Math.min(b.max[2], r.z1) - Math.max(b.min[2], r.z0); if (ox > PEN && oz > PEN) note('stair', i.id + ' stands on/under stair ' + s.name + ' (' + ox.toFixed(2) + 'x' + oz.toFixed(2) + ')', Math.min(ox, oz)); }
  // 5. people: a standing spot (a body 0.5 m wide, 1.7 m tall) in a solid; a sitter in a table; a sleeper's bed against walls
  for (const nm in P.spots) {
    const sp = P.spots[nm], W = World.spots[P.id + '.' + nm]; if (!W || !sp) continue; const L = level(sp.k), x = sp.x, z = sp.z, sit = W.sit, lie = W.lie, r = lie ? 0.3 : 0.25;
    for (const { i, b } of items) {
      if (i.k !== sp.k || i.kind === 'rug' || /stack/.test(i.id)) continue; const h = b.max[1] - L.y; if (h < 0.3) continue;
      const ox = Math.min(b.max[0], x + r) - Math.max(b.min[0], x - r), oz = Math.min(b.max[2], z + r) - Math.max(b.min[2], z - r); if (ox <= 0.03 || oz <= 0.03) continue;
      if (lie) { if (/bed|cot|pallet|bunk|hay/i.test(i.id)) continue; note('spot', nm + ' (sleeper) lies inside ' + i.id, Math.min(ox, oz)); continue; }
      if (sit) { if (/bench|chair|stool|seat|pew|bed|log/i.test(i.id)) continue; if (b.max[1] - L.y > sit + 0.12 && b.max[1] - L.y < 1.4) note('spot', nm + ' (sitter) sits inside ' + i.id + ' (top ' + h.toFixed(2) + ')', Math.min(ox, oz)); continue; }
      if (/rug|mat/i.test(i.id)) continue; note('spot', nm + ' (standing) is inside ' + i.id + ' (' + ox.toFixed(2) + 'x' + oz.toFixed(2) + ', top ' + h.toFixed(2) + ')', Math.min(ox, oz));
    }
  }
  const total = Object.values(cnt).reduce((a, b) => a + b, 0); out[c.id] = cnt; rows.push({ id: c.id, items: items.length, hung: hung.length, total, cnt });
  for (const d of det) d.cell = c.id; (out.__det = out.__det || []).push(...det);
}
const det = (out.__det || []).sort((a, b) => b.w - a.w), tot = {};
for (const r of rows) if (r.cnt) for (const k in r.cnt) tot[k] = (tot[k] || 0) + r.cnt[k];
const res = { totals: tot, all: rows.reduce((a, r) => a + (r.total || 0), 0), cells: rows.map(r => r.id + ': ' + (r.plan === 0 ? 'no plan' : r.total + ' (' + Object.entries(r.cnt).filter(e => e[1]).map(e => e[0] + ' ' + e[1]).join(', ') + ') of ' + r.items + ' items, ' + r.hung + ' hung')) };
res.over = Object.entries(window.__ovOver || {}).sort((a, b) => b[1].n - a[1].n).map(e => e[0] + ' x' + e[1].n + ' max ' + e[1].max + ' ' + e[1].ex);
if (window.__ovDetAll) res.detail = (out.__det || []).map(d => d.cell + ': ' + d.kind + ': ' + d.s); else res.top = det.slice(0, TOP).map(d => d.cell + ': ' + d.kind + ': ' + d.s);
return JSON.stringify(res, null, 1);
