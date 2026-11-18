// [audit] the slice (inbox 16:45 UTC 18 Nov) at eye height every 5 m along the villagers' paths, both ways, by day and by night: the square to the
// north gate and the chapel, the west gate to the square, the alley to Quill's, the Hart's front, a ring round the square. Pictures segN_iii_{f,b}_{d,n}.jpg
// and shots/audit/slice/points.json. usage: node test/audit/run.mjs --size 960x540 --opt play=1 --dir shots/audit/slice test/audit/slicewalk.js
const N = Nav.nodes, A = Nav.adj, to = e => typeof e === 'number' ? e : e[0], cost = (a, e) => typeof e === 'number' ? Math.hypot(N[e][0] - N[a][0], N[e][2] - N[a][2]) : e[1];
const near = (x, z) => { let b = -1, bd = 1e9; for (let i = 0; i < N.length; i++) { if (!A[i] || !A[i].length || N[i][1] < -100) continue; const d = Math.hypot(N[i][0] - x, N[i][2] - z); if (d < bd) { bd = d; b = i; } } return b; };
const path = (a, b) => { const D = new Map([[a, 0]]), prev = new Map([[a, -1]]), done = new Set(), q = [[0, a]]; while (q.length) { let bi = 0; for (let i = 1; i < q.length; i++) if (q[i][0] < q[bi][0]) bi = i; const [d, c] = q.splice(bi, 1)[0]; if (done.has(c)) continue; done.add(c); if (c === b) break; for (const e of A[c]) { const k = to(e); if (N[k][1] < -100) continue; const nd = d + cost(c, e); if (!D.has(k) || nd < D.get(k)) { D.set(k, nd); prev.set(k, c); q.push([nd, k]); } } } const r = []; for (let c = b; c !== -1 && c !== undefined; c = prev.get(c)) r.unshift(c); return r; };
// north gate: the nav node nearest the wall line z -58.7 within 12 m of x 0
let ng = -1, ngd = 1e9; for (let i = 0; i < N.length; i++) { if (!A[i] || !A[i].length) continue; const q = N[i]; if (Math.abs(q[0]) < 14 && N[i][1] > -100) { const d = Math.abs(q[2] + 58.7) + Math.abs(q[0]) * 0.05; if (d < ngd) { ngd = d; ng = i; } } }
const W = { square: [-2.6, -9.5], chapel: [-6, -66.4], westOut: [-70, -5], westGate: [-60.3, -5.2], store: [18.1, -6.6], inn: [0, -15.6], ngate: [N[ng][0], N[ng][2]], nOut: [N[ng][0], N[ng][2] - 12] };
const SEG = [['ngate', 'square', 'ngate'], ['chapel', 'ngate', 'chapel'], ['nout', 'nOut', 'ngate'], ['west', 'westOut', 'square'], ['alley', 'square', 'store'], ['hart', 'square', 'inn'], ['ring', null, null]];
const out = { W, segs: [] };
for (const [name, a, b] of SEG) {
  let pts = [];
  if (name === 'ring') { for (let k = 0; k < 12; k++) { const t = k / 12 * 2 * Math.PI; pts.push([-2.6 + Math.cos(t) * 11, 0, -9.5 + Math.sin(t) * 11]); } }
  else { const p = path(near(W[a][0], W[a][1]), near(W[b][0], W[b][1])); const poly = p.map(i => N[i]); let acc = 0; pts.push(poly[0]); for (let i = 1; i < poly.length; i++) { const s = poly[i - 1], e = poly[i], L = Math.hypot(e[0] - s[0], e[2] - s[2]); let u = 5 - acc; while (u <= L) { const t = u / L; pts.push([s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t, s[2] + (e[2] - s[2]) * t]); u += 5; } acc = (acc + L) % 5; } pts.push(poly[poly.length - 1]); }
  const seg = { name, pts: [] };
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)]; let yaw = name === 'ring' ? (Math.atan2(-2.6 - p[0], -(-9.5 - p[2])) * 180 / Math.PI) : Math.atan2((q[0] - o[0]), -(q[2] - o[2])) * 180 / Math.PI;
    const gy = World.groundAt ? World.groundAt(p[0], p[2], p[1] + 1.5) : p[1], y = (isFinite(gy) ? gy : p[1]) + 1.6;
    for (const [h, hn] of [[13, 'd'], [22, 'n']]) for (const [dy, dn] of (name === 'ring' ? [[0, 'f'], [180, 'b']] : [[0, 'f'], [180, 'b']])) { const nm = name + '_' + String(i).padStart(3, '0') + '_' + dn + '_' + hn; game.shot(p[0], y, p[2], yaw + dy, -4, h); await __snap(nm); }
    seg.pts.push([i, +p[0].toFixed(1), +y.toFixed(1), +p[2].toFixed(1), Math.round(yaw)]); }
  out.segs.push(seg); }
await __write('shots/audit/slice/points.json', JSON.stringify(out));
return out.segs.map(s => s.name + ' ' + s.pts.length).join(', ') + ' | ngate ' + W.ngate.map(v => v.toFixed(1));
