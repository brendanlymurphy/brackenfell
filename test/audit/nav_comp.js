// [audit] the nav graph's connected parts, and which part the start and each quest mark's nearest node fall in
const N = Nav.nodes, A = Nav.adj, comp = new Array(N.length).fill(-1); let c = 0; const size = [];
const to = e => typeof e === 'number' ? e : e.to !== undefined ? e.to : e[0];
for (let i = 0; i < N.length; i++) { if (comp[i] >= 0 || !A[i] || !A[i].length) continue; const q = [i]; comp[i] = c; let n = 0; while (q.length) { const x = q.pop(); n++; for (const e of A[x]) { const k = to(e); if (comp[k] < 0) { comp[k] = c; q.push(k); } } } size.push(n); c++; }
// directed? check symmetric
let asym = 0; for (let i = 0; i < N.length; i++) for (const e of A[i] || []) if (!(A[to(e)] || []).some(f => to(f) === i)) asym++;
const nearest = (x, z) => { let b = -1, bd = 1e9; for (let i = 0; i < N.length; i++) { if (!A[i] || !A[i].length || N[i][1] < -100) continue; const d = Math.hypot(N[i][0] - x, N[i][2] - z); if (d < bd) { bd = d; b = i; } } return [b, +bd.toFixed(1), comp[b]]; };
const marks = []; for (const id of QORDER) { const q = QUESTS[id]; if (!q || !q.stages) continue; for (let s = 0; s < q.stages.length; s++) { S.q = {}; S.q[id] = { stage: s, done: false }; let t = null; try { t = questTarget(id); } catch (e) { } const m = t ? Cells.mapTarget(t) : null; marks.push([id + s, m ? m.map(v => +v.toFixed(1)) : null, m ? nearest(m[0], m[2]) : null]); } }
return { nodes: N.length, comps: size.length, sizes: size.slice().sort((a, b) => b - a).slice(0, 12), asym, start: [Player.pos.map(v => +v.toFixed(1)), nearest(Player.pos[0], Player.pos[2])], marks: marks.map(m => JSON.stringify(m)) };
