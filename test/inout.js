// [inout] Is every enterable building the same building inside as outside? One row per building, measured from the running game. Changes nothing.
//   table:   node test/audit/run.mjs --opt audit=1 test/inout.js          (writes docs/INOUT.md and prints the totals)
//   gate:    node test/shot.mjs --opt webgl=1 --opt play=1 --opt audit=1 --do "$(cat test/inout.js)"      (prints `inout PASS` or `inout FAIL n`)
// OUTSIDE is read off what is drawn on the village site (--opt audit=1 keeps the list of placed pieces): kit window, door and balcony pieces by their boxes, the openings
// every generated wall was built from (72d_plan.js keeps what 73d_infill.js infWalls was given), glass quads in dormers, gables and end walls. INSIDE is the plan.
// Rules (coordinator, Build 82): a floor is at most 1.5 times the shell's area; a place along a wall is compared after scaling the plan's wall to the shell's;
// an upper level marked `loft` in the plan (P.lv[k].loft) is the roof space and is not a storey.
// Frame for both: the house's own, front wall at -z, x to the right seen from inside the front door; `along` is metres from the middle of the house (front, back)
// or from the front wall (left, right). Levels: 0 ground, 1.. upper, 'roof' = above the eaves (gable or dormer), -1 cellar.
const r1 = v => Math.round(v * 10) / 10, WN = ['front', 'back', 'left', 'right'];
const K = window.__AUDIT_KIT || [];
if (!K.length) return 'inout FAIL: run with --opt audit=1';
const PANE = [0.06, 0.068, 0.078], LEAF = [0.1, 0.08, 0.06], near3 = (c, i, t) => Math.abs(c[i] - t[0]) < 0.004 && Math.abs(c[i + 1] - t[1]) < 0.004 && Math.abs(c[i + 2] - t[2]) < 0.004;
// quads of a generated piece that are a window pane or a door leaf, in the piece's own frame: [kind, cx, cy, cz, y0, y1, halfwidth]
const quadCache = {};
function genQuads(name) {
  if (quadCache[name]) return quadCache[name];
  const out = [], p = Kit.pieces[name];
  if (p) for (const q of p.prims) {
    const glass = /Glass/.test(q.mat && (q.mat.name || q.mat)), pos = q.pos, col = q.col, idx = q.idx; if (!pos || !idx || !glass) continue;
    for (let i = 0; i + 5 < idx.length; i += 6) {
      const vs = [idx[i], idx[i + 1], idx[i + 2], idx[i + 5]];
      const kind = glass ? 'win' : null; if (!kind) continue;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const v of vs) { x0 = Math.min(x0, pos[v * 3]); x1 = Math.max(x1, pos[v * 3]); y0 = Math.min(y0, pos[v * 3 + 1]); y1 = Math.max(y1, pos[v * 3 + 1]); z0 = Math.min(z0, pos[v * 3 + 2]); z1 = Math.max(z1, pos[v * 3 + 2]); }
      if (y1 - y0 < 0.3) continue;                                    // a pane stands upright
      if (kind === 'door' && y1 - y0 < 1.6) continue;
      out.push([kind, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, y0, y1, Math.hypot(x1 - x0, z1 - z0) / 2]);
    }
  }
  return quadCache[name] = out;
}
const _v = new THREE.Vector3();
const boxOf = (name, M) => { const p = Kit.pieces[name]; if (!p || !p.min) return null; let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < 8; i++) { _v.set(i & 1 ? p.max[0] : p.min[0], i & 2 ? p.max[1] : p.min[1], i & 4 ? p.max[2] : p.min[2]).applyMatrix4(M); mn = [Math.min(mn[0], _v.x), Math.min(mn[1], _v.y), Math.min(mn[2], _v.z)]; mx = [Math.max(mx[0], _v.x), Math.max(mx[1], _v.y), Math.max(mx[2], _v.z)]; } return { mn, mx }; };
const isWin = n => /^Window_/.test(n), isDoor = n => /^Door_\d|^DoorFrame_/.test(n), isBalc = n => /^Balcony_|^gen_balc_/.test(n), isWall = n => /^(T_)?Wall_|^gen_walls_/.test(n), isSign = n => /hatch|grat|cellar|trapdoor/i.test(n);
const houses = Object.values(World.houses).filter(h => h.cell);
const sites = houses.map(h => h.site);
const local = (s, x, z) => { const dx = x - s.x, dz = z - s.z, c = Math.cos(s.yaw), n = Math.sin(s.yaw); return [dx * c + dz * n, -dx * n + dz * c]; };
const depthIn = (s, x, z) => { const [u, v] = local(s, x, z); return Math.min(s.w / 2 - Math.abs(u), s.d / 2 - Math.abs(v)); };      // > 0 inside the footprint
const owner = (x, z) => { let best = null, bd = -0.95; for (const s of sites) { const d = depthIn(s, x, z); if (d > bd) { bd = d; best = s; } } return best; };
// which wall of site s a point on its shell belongs to, and where along it
function onWall(s, x, z) {
  const [u, v] = local(s, x, z), ds = { front: Math.abs(v + s.d / 2), back: Math.abs(v - s.d / 2), left: Math.abs(u + s.w / 2), right: Math.abs(u - s.w / 2) };
  let wn = 'front'; for (const k of WN) if (ds[k] < ds[wn]) wn = k;
  return { wall: wn, along: wn === 'front' || wn === 'back' ? u : v + s.d / 2, off: ds[wn] };
}
const rows = [];
for (const h of houses) {
  const s = h.site, c = h.ctx || {}, sp = h.spec || {}, st = sp.kitStyle || {}, fy = h.xFloorY !== undefined ? h.xFloorY : s.y, H = sp.H || 3;
  // ── outside ──
  const feats = [], signs = []; let eave = 0;
  const push = (kind, x, y, z, y0, y1, hw, src) => { if (owner(x, z) !== s) return; const w = onWall(s, x, z); if (w.off > 1.3) return; const Lw = w.wall === 'front' || w.wall === 'back' ? [-s.w / 2, s.w / 2] : [0, s.d]; if (w.along < Lw[0] - 0.15 || w.along > Lw[1] + 0.15) return;   /* past the corner: the neighbour's wall */ feats.push({ kind, wall: w.wall, along: w.along, y: y - fy, y0: y0 - fy, y1: y1 - fy, hw, src }); };
  for (const k of K) {
    if (k.zone) continue; const e = k.M.elements, [lu, lv] = local(s, e[12], e[14]); if (Math.abs(lu) > s.w / 2 + 4 || Math.abs(lv) > s.d / 2 + 4 || Math.abs(e[13] - fy) > 20) continue;
    const n = k.name;
    if (/^gen_/.test(n)) {
      for (const q of genQuads(n)) { _v.set(q[1], q[2], q[3]).applyMatrix4(k.M); const cx = _v.x, cy = _v.y, cz = _v.z, sc = Math.hypot(e[4], e[5], e[6]); push(q[0], cx, cy, cz, cy - (q[2] - q[4]) * sc, cy + (q[5] - q[2]) * sc, q[6], n.replace(/_\d+$/, '')); }
      if (isWall(n) && owner(e[12], e[14]) === s) { const b = boxOf(n, k.M); if (b) eave = Math.max(eave, b.mx[1] - fy); }
    }
    if (isWin(n) || isDoor(n) || isBalc(n) || isWall(n) && !/^gen_/.test(n) || isSign(n)) {
      const b = boxOf(n, k.M); if (!b) continue; const cx = (b.mn[0] + b.mx[0]) / 2, cz = (b.mn[2] + b.mx[2]) / 2;
      if (isWall(n)) { if (owner(cx, cz) === s) eave = Math.max(eave, b.mx[1] - fy); continue; }
      if (isSign(n)) { if (owner(cx, cz) === s) signs.push(n); continue; }
      push(isWin(n) ? 'win' : isDoor(n) ? 'door' : 'balc', cx, (b.mn[1] + b.mx[1]) / 2, cz, b.mn[1], b.mx[1], Math.hypot(b.mx[0] - b.mn[0], b.mx[2] - b.mn[2]) / 2, n);
    }
  }
  for (const g of (window.__AUDIT_SHELL || [])) {      /* the generated walls of this house: the openings they were built from */
    if (g.lo) continue; const e = g.M.elements; if (Math.abs(e[13] - fy) > 20 || owner(e[12], e[14]) !== s || Math.hypot(e[12] - s.x, e[14] - s.z) > 1.2) continue;
    eave = Math.max(eave, g.fl * g.H + (e[13] - fy));
    for (let k = 0; k < g.plan.length; k++) for (const wn of WN) for (const o of ((g.plan[k] || {})[wn] || [])) {
      const u = (o.u0 + o.u1) / 2, lx = wn === 'front' ? g.w / 2 - u : wn === 'back' ? -g.w / 2 + u : wn === 'left' ? -g.w / 2 : g.w / 2, lz = wn === 'front' ? -g.d / 2 : wn === 'back' ? g.d / 2 : wn === 'left' ? -g.d / 2 + u : g.d / 2 - u;
      _v.set(lx, 0, lz).applyMatrix4(g.M); const yb = e[13] + k * g.H; push(o.door ? 'door' : 'win', _v.x, yb + (o.v0 + o.v1) / 2, _v.z, yb + o.v0, yb + o.v1, (o.u1 - o.u0) / 2, 'wall');
    }
  }
  if (!eave) eave = H + (st.up ? 3 : 0);
  // one thing drawn with several pieces (frame and leaf, glass both sides, two balcony corners) is one thing
  const merged = [];
  for (const f of feats) { const m = merged.find(g => g.kind === f.kind && g.wall === f.wall && Math.abs(g.along - f.along) < (f.kind === 'balc' ? 2.6 : 0.7) && Math.abs(g.y - f.y) < 1.2); if (m) { m.y0 = Math.min(m.y0, f.y0); m.y1 = Math.max(m.y1, f.y1); m.n++; } else merged.push(Object.assign({ n: 1 }, f)); }
  const wallSt = 1 + Math.max(0, Math.floor((eave - H + 0.5) / 3));      // the ground storey is as high as the building's own H (a chapel's 4.5 m wall is one storey), each further 3 m of wall is one more
  const lvOut = f => f.kind === 'win' ? (f.y > eave - 0.2 ? 'roof' : f.y < H ? 0 : Math.min(wallSt - 1, 1 + Math.floor((f.y - H) / 3))) : (f.y0 < 1.6 ? 0 : f.y0 > eave - 0.4 ? 'roof' : Math.max(1, Math.round((f.y0 - H) / 3) + 1));
  for (const f of merged) f.lv = lvOut(f);
  const oWin = merged.filter(f => f.kind === 'win'), oDoor = merged.filter(f => f.kind === 'door'), oBalc = merged.filter(f => f.kind === 'balc');
  const roofWin = oWin.filter(f => f.lv === 'roof').length, shown = wallSt + (roofWin ? 1 : 0);
  const jetty = typeof shellJetty === 'function' ? shellJetty(s, st) : 0;
  // ── inside ──
  const P = c.planDone || c.plan || (h.cell.ctx && (h.cell.ctx.planDone || h.cell.ctx.plan));
  const row = { id: s.id, name: s.name, out: { w: s.w, d: s.d, eave: r1(eave), wallSt, roofWin, shown, jetty: r1(jetty), win: oWin.length, upDoors: oDoor.filter(f => f.lv !== 0), doors0: oDoor.filter(f => f.lv === 0).length, balc: oBalc, signs, list: merged.map(f => [f.kind, f.wall, f.lv, r1(f.along), r1(f.y), f.src, f.n].join(' ')) }, fails: [] };
  if (!P) { row.noPlan = true; row.fails.push('no plan'); rows.push(row); continue; }
  const lvs = Object.values(P.lv).map(l => l.k).sort((a, b) => a - b), lofts = lvs.filter(k => k > 0 && P.lv[k].loft), up = lvs.filter(k => k >= 0 && !P.lv[k].loft), rooms = Object.values(P.rooms), isYard = r => /yard|garden|court/.test(r.kind || '') || r.open === true || r.roof === false;
  const bb = k => { const rs = rooms.filter(r => r.k === k && !isYard(r)); if (!rs.length) return null; const x0 = Math.min(...rs.map(r => r.x0)), x1 = Math.max(...rs.map(r => r.x1)), z0 = Math.min(...rs.map(r => r.z0)), z1 = Math.max(...rs.map(r => r.z1)); return { x0, x1, z0, z1, w: x1 - x0, d: z1 - z0, area: rs.reduce((a, r) => a + (r.x1 - r.x0) * (r.z1 - r.z0), 0) }; };
  const B0 = bb(0) || { x0: 0, x1: 0, z0: 0, z1: 0, w: 0, d: 0, area: 0 }, cx0 = (B0.x0 + B0.x1) / 2;
  const facing = wl => wl.ax === 'x' ? (wl.ns < 0 ? 'front' : 'back') : (wl.ns < 0 ? 'left' : 'right');
  const kx = B0.w ? s.w / B0.w : 1, kz = B0.d ? s.d / B0.d : 1, alongIn = (wl, pos) => wl.ax === 'x' ? (pos - cx0) * kx : (pos - B0.z0) * kz;      /* the plan's wall scaled to the shell's */
  const iWin = P.windows.map(w => ({ wall: facing(w.wall), lv: w.k, along: alongIn(w.wall, w.pos), room: w.room && w.room.id })).filter(w => { const r = P.rooms[w.room]; return !(r && isYard(r)); });
  const iDoor = P.doors.filter(d => d.b === null && d.wall).map(d => ({ wall: facing(d.wall), lv: d.k, along: alongIn(d.wall, d.pos), room: d.a }));
  row.in = { levels: lvs, lofts: lofts.length, up: up.length, cellar: lvs.some(k => k < 0), w: B0.w, d: B0.d, area: r1(B0.area), yards: rooms.filter(isYard).map(r => r.id), win: iWin.length, doors: iDoor, per: lvs.map(k => { const b = bb(k); return b ? [k, b.w, b.d, r1(b.area)] : [k, 0, 0, 0]; }) };
  // ── compare ──
  // 1 storeys
  row.storeys = { out: shown, in: up.length, ok: shown === up.length };
  if (!row.storeys.ok) row.fails.push('storeys');
  // 2 footprint: no floor (cellar included) is more than 1.5 times the shell's area
  const A = s.w * s.d, over = row.in.per.filter(p => p[3] > A * 1.5 + 0.01);
  row.foot = { ratio: Math.round(B0.area / A * 100) / 100, worst: Math.round(Math.max(...row.in.per.map(p => p[3])) / A * 100) / 100, ok: over.length === 0 };
  if (!row.foot.ok) row.fails.push('footprint');
  // 3 upper doors and balconies: a door inside on that level and wall
  const served = f => iDoor.some(d => d.lv === f.lv && d.wall === f.wall);
  const upDoorsBad = row.out.upDoors.filter(f => !served(f)), balcBad = oBalc.filter(f => !served(f)), inUpNoOut = iDoor.filter(d => d.lv > 0 && !row.out.upDoors.some(f => f.lv === d.lv && f.wall === d.wall));
  row.updoor = { out: row.out.upDoors.length, balc: oBalc.length, unserved: upDoorsBad.length, balcUnserved: balcBad.length, inOnly: inUpNoOut.length, ok: !upDoorsBad.length && !balcBad.length && !inUpNoOut.length };
  if (!row.updoor.ok) row.fails.push('upper door');
  // 4 windows: per wall and level, count against count; and how many sit in the same place (0.6 m)
  const keys = new Set(); for (const w of oWin) keys.add(w.wall + '|' + w.lv); for (const w of iWin) keys.add(w.wall + '|' + w.lv);
  let diff = 0, same = 0; const cells = {};
  for (const key of keys) { const [wn, lv] = key.split('|'), o = oWin.filter(w => w.wall === wn && String(w.lv) === lv), i = iWin.filter(w => w.wall === wn && String(w.lv) === lv); diff += Math.abs(o.length - i.length); const used = new Set(); for (const a of o) { const j = i.findIndex((b, n) => !used.has(n) && Math.abs(b.along - a.along) < 0.6); if (j >= 0) { used.add(j); same++; } } cells[key] = [o.length, i.length]; }
  row.windows = { out: oWin.length, in: iWin.length, diff, same, cells, ok: diff === 0 && same === oWin.length };
  if (!row.windows.ok) row.fails.push('windows');
  // 5 cellar: something outside says there is one
  row.cellar = { in: row.in.cellar, sign: signs.length, ok: !row.in.cellar || signs.length > 0 };
  if (!row.cellar.ok) row.fails.push('cellar');
  // ── for the outside worker: where a cellar should show, and (plans already fitted to their shell) rooms with an outside wall and no window in the shell ──
  const sideTxt = (wn, al) => wn + ' wall, ' + (wn === 'front' || wn === 'back' ? (Math.abs(al) < 0.3 ? 'middle' : Math.abs(r1(al)) + ' m from the middle toward the ' + (al > 0 ? 'right' : 'left') + ' wall') : r1(al) + ' m back from the front wall');
  if (row.in.cellar) {
    const cs = rooms.filter(r => r.k < 0), st = (P.stairs || []).find(q => q.k0 < 0 || q.k1 < 0), c0 = { x0: Math.min(...cs.map(r => r.x0)), x1: Math.max(...cs.map(r => r.x1)), z0: Math.min(...cs.map(r => r.z0)), z1: Math.max(...cs.map(r => r.z1)) };
    const touch = { back: Math.abs(c0.z1 - B0.z1) < 0.6, left: Math.abs(c0.x0 - B0.x0) < 0.6, right: Math.abs(c0.x1 - B0.x1) < 0.6, front: Math.abs(c0.z0 - B0.z0) < 0.6 }, wn = ['back', 'left', 'right', 'front'].find(k => touch[k]);
    const mid = wn === 'back' || wn === 'front' ? ((c0.x0 + c0.x1) / 2 - cx0) * kx : ((c0.z0 + c0.z1) / 2 - B0.z0) * kz;
    row.cellarWhere = wn ? sideTxt(wn, mid) + (wn === 'front' ? ': a grating at the foot of the wall' : ': a hatch with two leaves against the wall, or three steps down to a low door') : 'the cellar touches no outside wall of the plan: a grating in the yard or none';
  }
  if (P.blockedWins && P.blockedWins.length) row.blocked = P.blockedWins.map(f => sideTxt(f.wall, f.wall === 'front' || f.wall === 'back' ? f.u : f.u) + ', level ' + f.lv + ': opens into `' + f.blocked + '`');
  if (P.wins) {
    row.needWin = [];
    for (const r of rooms) { if (r.k < 0 || isYard(r) || P.windows.some(w => w.room === r)) continue;
      const wl = P.walls.filter(q => q.ext && q.k === r.k && q.rooms.has(r.id)).map(q => { const lo = Math.max(q.a, q.ax === 'x' ? r.x0 : r.z0), hi = Math.min(q.b, q.ax === 'x' ? r.x1 : r.z1); return { q, lo, hi }; }).filter(o => o.hi - o.lo >= 2.8).sort((a, b) => (facing(a.q) === 'front' ? 1 : 0) - (facing(b.q) === 'front' ? 1 : 0) || (b.hi - b.lo) - (a.hi - a.lo))[0];
      if (wl) row.needWin.push(r.id + ' (level ' + r.k + '): ' + sideTxt(facing(wl.q), alongIn(wl.q, (wl.lo + wl.hi) / 2)));
    }
  }
  rows.push(row);
}
// ── totals and the table ──
const N = rows.length, cnt = f => rows.filter(f).length, sum = f => rows.reduce((a, r) => a + (f(r) || 0), 0), pl = rows.filter(r => !r.noPlan);
const ratios = pl.map(r => r.foot.ratio).sort((a, b) => a - b), med = ratios.length ? ratios[ratios.length >> 1] : 0;
const T = {
  buildings: N, failing: cnt(r => r.fails.length), passing: cnt(r => !r.fails.length),
  storeys: cnt(r => r.storeys && !r.storeys.ok), storeysOutMore: cnt(r => r.storeys && r.storeys.out > r.storeys.in), storeysInMore: cnt(r => r.storeys && r.storeys.in > r.storeys.out),
  footprint: cnt(r => r.foot && !r.foot.ok), ratioMed: med, ratioMax: ratios[ratios.length - 1], ratioMin: ratios[0],
  upDoorsOut: sum(r => r.updoor && r.updoor.out), upDoorsUnserved: sum(r => r.updoor && r.updoor.unserved), balconies: sum(r => r.updoor && r.updoor.balc), balconiesUnserved: sum(r => r.updoor && r.updoor.balcUnserved), upDoorsInOnly: sum(r => r.updoor && r.updoor.inOnly), upDoorBuildings: cnt(r => r.updoor && !r.updoor.ok),
  winOut: sum(r => r.out.win), winIn: sum(r => r.in && r.in.win), winDiff: sum(r => r.windows && r.windows.diff), winSame: sum(r => r.windows && r.windows.same), winBuildings: cnt(r => r.windows && !r.windows.ok),
  cellars: cnt(r => r.in && r.in.cellar), cellarsNoSign: cnt(r => r.cellar && !r.cellar.ok),
};
const cellsTxt = r => WN.map(wn => { const ks = Object.keys(r.windows.cells).filter(k => k.startsWith(wn + '|')).sort(); return ks.length ? wn[0].toUpperCase() + ' ' + ks.map(k => k.split('|')[1] + ':' + r.windows.cells[k].join('/')).join(' ') : null; }).filter(Boolean).join('; ');
const doorTxt = fs => fs.map(f => f.wall + ' L' + f.lv).join(', ');
let md = `# Inside against outside: all ${N} enterable buildings\n\n`;
md += `Written by \`test/inout.js\` (build ${typeof BUILD_NAME !== 'undefined' ? BUILD_NAME : '?'}): \`node test/audit/run.mjs --opt audit=1 test/inout.js\`. Do not edit by hand.\n`;
md += `The outside is read off the drawn shell (window, door and balcony pieces; the openings the generated walls were built from; glass in gables, dormers and end walls); the inside is the plan.\nA floor may be up to 1.5 times the shell's area; places along a wall are compared after scaling the plan's wall to the shell's; a loft under the rafters is not a storey.\n`;
md += `Cannot tell: whether a window that matches by count also looks the same size and style, anything a roof or a neighbour hides, cellar signs drawn into a larger mesh (the inn's hatch).\n\n`;
md += `## Totals\n\n| | |\n|---|---|\n`;
md += `| Buildings / failing at least one of the five checks | ${T.buildings} / **${T.failing}** |\n`;
md += `| 1. Storeys shown outside differ from levels above ground inside | **${T.storeys}** (outside shows more: ${T.storeysOutMore}; inside holds more: ${T.storeysInMore}) |\n`;
md += `| 2. A floor is more than 1.5 times the shell's area | **${T.footprint}** (ground floor area over shell area: least ${T.ratioMin}, median ${T.ratioMed}, worst ${T.ratioMax}) |\n`;
md += `| 3. Upper doors outside / with no door inside on that wall and level | ${T.upDoorsOut} / **${T.upDoorsUnserved}** |\n`;
md += `| ... balconies outside / with no door onto them | ${T.balconies} / **${T.balconiesUnserved}** |\n`;
md += `| ... upper doors inside that open onto nothing outside | **${T.upDoorsInOnly}** |\n`;
md += `| 4. Windows outside / inside | ${T.winOut} / ${T.winIn} |\n`;
md += `| ... difference summed per wall and level / outside windows with an inside window in the same place | **${T.winDiff}** / ${T.winSame} of ${T.winOut} |\n`;
md += `| ... buildings whose windows do not all match | **${T.winBuildings}** |\n`;
md += `| 5. Cellars inside / with nothing outside that shows one | ${T.cellars} / **${T.cellarsNoSign}** |\n\n`;
md += `## Every building\n\nStoreys: walls to the eaves in 3 m storeys, "+r" = windows above the eaves (gable or dormer) counted as one more. Footprint in metres, w x d; plan = the ground floor rooms without yards.\n`;
md += `Windows by wall (F front, B back, L left, R right seen from inside the front door) and level: outside/inside. Fails: s storeys, f footprint, d upper door or balcony, w windows, c cellar.\n\n`;
md += `| id | name | storeys out | levels in | eave m | shell | plan | area x | upper doors out | balconies | upper doors in | unserved | windows out / in | same place | windows by wall and level | cellar | sign | fails |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  if (r.noPlan) { md += `| \`${r.id}\` | ${r.name} | ${r.out.shown} | no plan | ${r.out.eave} | ${r.out.w} x ${r.out.d} | | | | | | | ${r.out.win} / | | | | | no plan |\n`; continue; }
  const fl = r.fails.map(f => ({ storeys: 's', footprint: 'f', 'upper door': 'd', windows: 'w', cellar: 'c' })[f]).join(' ');
  md += `| \`${r.id}\` | ${r.name} | ${r.out.wallSt}${r.out.roofWin ? '+r' : ''} | ${r.in.up}${r.in.lofts ? '+loft' : ''} | ${r.out.eave} | ${r.out.w} x ${r.out.d} | ${r.in.w} x ${r.in.d} | ${r.foot.ratio} | ${doorTxt(r.out.upDoors)} | ${doorTxt(r.out.balc)} | ${doorTxt(r.in.doors.filter(d => d.lv > 0))} | ${r.updoor.unserved + r.updoor.balcUnserved + r.updoor.inOnly || ''} | ${r.windows.out} / ${r.windows.in} | ${r.windows.same} | ${cellsTxt(r)} | ${r.in.cellar ? 'yes' : ''} | ${r.cellar.sign || ''} | ${fl} |\n`;
}
md += `\n## For the outside worker\n\nSides as in \`WALLS\` (71_house.js): front is the door wall, left and right as seen from inside looking out of the front door. Distances are on the shell.\n\n### Cellars: where the outside should show one\n\nFrom the plans as they are today; a plan refitted to its shell may move its cellar, and its row here changes with it.\n\n| id | name | where |\n|---|---|---|\n`;
for (const r of rows) if (r.cellarWhere) md += `| \`${r.id}\` | ${r.name} | ${r.cellarWhere} |\n`;
md += `\n### Rooms with an outside wall and no window in the shell\n\nOnly buildings whose plan already takes its windows from the shell.\n\n| id | name | room: where a window is wanted |\n|---|---|---|\n`;
for (const r of rows) if (r.needWin && r.needWin.length) md += `| \`${r.id}\` | ${r.name} | ${r.needWin.join('; ')} |\n`;
md += `\n### Windows on the shell that open into the house next door (left out inside; remove them outside)\n\n| id | name | where |\n|---|---|---|\n`;
for (const r of rows) if (r.blocked) md += `| \`${r.id}\` | ${r.name} | ${r.blocked.join('; ')} |\n`;
const line = T.failing ? 'inout FAIL ' + T.failing : 'inout PASS';
if (typeof window.__write === 'function') { await window.__write('docs/INOUT.md', md); await window.__write('shots/inout.json', JSON.stringify({ totals: T, rows }, null, 1)); }
console.log('[audit] ' + line + ' ' + JSON.stringify(T));
return line;
