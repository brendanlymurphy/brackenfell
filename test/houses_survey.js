// Survey of every building shell: footprint, storeys, heights, roof, walls, tone, kit style; distinct combinations and neighbours that share one.
// usage: node test/ev.mjs "$(cat test/houses_survey.js)"   -> JSON { rows, distinct, sharedBy, ... }
const r2 = v => Math.round(v * 100) / 100, r1 = v => Math.round(v * 10) / 10;
const rows = [];
for (const h of Object.values(World.houses)) {
  const s = h.spec || {}, st = h.site, ks = s.kitStyle || {}, P = h.cell && h.cell.ctx && (h.cell.ctx.planDone || h.cell.ctx.plan);
  const storeys = P ? Object.keys(P.lv).filter(k => +k >= 0).length : (ks.up ? 2 : 1);
  const H = s.H || 2.6, pitch = s.pitch || 48, ridge = H + st.d / 2 * Math.tan(pitch * Math.PI / 180);
  const roofMat = s.roof || (ks.shingle ? 'shingle' : ks.thatch ? 'thatch' : 'slate-default');
  const plaster = (s.plaster || [1, 1, 1]).map(r2).join('/'), rc = s.roofCol ? s.roofCol.map(r2).join('/') : 'default';
  const sig = [r1(st.w), r1(st.d), H, pitch, s.walls || 'timber', s.stoneH || 0, roofMat, rc, plaster, JSON.stringify(ks)].join('|');
  const sigLoose = [s.walls || 'timber', roofMat, pitch, storeys, rc].join('|');
  rows.push({ id: st.id, x: r1(st.x), z: r1(st.z), yaw: r1(st.yaw * 180 / Math.PI), w: r1(st.w), d: r1(st.d), storeys, eaves: r1(H), ridge: r1(ridge), pitch, roof: roofMat, roofCol: rc, walls: s.walls || 'timber', stoneH: s.stoneH || 0, plaster, timber: s.timber ? s.timber.map(r2).join('/') : 'default', doors: (s.doors || []).length, windows: (s.windows || []).length, kit: !!h.kit, style: ks, sig, sigLoose });
}
const cnt = (k) => { const m = {}; for (const r of rows) m[r[k]] = (m[r[k]] || 0) + 1; return m; };
const distinct = Object.keys(cnt('sig')).length, distinctLoose = Object.keys(cnt('sigLoose')).length;
let shared = 0; const near = [];
for (const a of rows) { const n = rows.filter(b => b !== a && b.sigLoose === a.sigLoose && Math.hypot(a.x - b.x, a.z - b.z) < 25).length; a.sameLooseNear = n; if (n) shared++; near.push(n); }
const sq = rows.filter(r => Math.hypot(r.x - 3, r.z - 3) < 40).map(r => r.id);
return JSON.stringify({ n: rows.length, distinctFull: distinct, distinctLoose, housesWithSameLooseNeighbour25m: shared, roofMat: cnt('roof'), roofCol: cnt('roofCol'), walls: cnt('walls'), pitch: cnt('pitch'), storeys: cnt('storeys'), plaster: cnt('plaster'), nearSquare: sq, rows });
