// Overlap finder: things through things, over the whole world and every built cell (cells are at remote origins, so one list holds all).
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --do "$(cat test/overlap.js)"   (add  window.__ovTop = 40  to list more; window.__ovCells = true to enter every cell first)
// 1. collider x collider: two solids that interpenetrate by more than MINPEN on both axes and share height (SAT on the oriented boxes; circles as boxes)
// 2. a door's approach point (0.9 m in front, both sides) inside a solid; 3. a named spot inside a solid; 4. a stair's foot or head inside a solid.
// Output: counts by kind and a ranked list, each with a game.shot call that looks at it.
const MINPEN = 0.12, MINH = 0.25, TOP = window.__ovTop || 25;
const box = c => c.r !== undefined ? { x: c.x, z: c.z, hx: c.r, hz: c.r, ax: 1, az: 0, bx: 0, bz: 1, y0: c.y0, y1: c.y1, circle: 1 } : c;
const CS = World.colliders.filter(c => isFinite(c.x) && isFinite(c.z) && (c.y1 - c.y0) > 0.05).map(box);
// a spatial hash of the colliders
const cell = 4, H = new Map(), key = (i, j) => i * 100003 + j;
CS.forEach((c, n) => { const r = Math.hypot(c.hx, c.hz); for (let i = Math.floor((c.x - r) / cell); i <= Math.floor((c.x + r) / cell); i++) for (let j = Math.floor((c.z - r) / cell); j <= Math.floor((c.z + r) / cell); j++) { const k = key(i, j); (H.get(k) || H.set(k, []).get(k)).push(n); } });
const axes = c => [[c.ax, c.az], [c.bx, c.bz]];
const proj = (c, d) => { const cx = c.x * d[0] + c.z * d[1], r = c.hx * Math.abs(c.ax * d[0] + c.az * d[1]) + c.hz * Math.abs(c.bx * d[0] + c.bz * d[1]); return [cx - r, cx + r]; };
const pen = (a, b) => { let m = 1e9; for (const d of axes(a).concat(axes(b))) { const p = proj(a, d), q = proj(b, d), o = Math.min(p[1], q[1]) - Math.max(p[0], q[0]); if (o <= 0) return 0; m = Math.min(m, o); } return m; };
const out = [], seen = new Set();
CS.forEach((a, n) => {
  const r = Math.hypot(a.hx, a.hz);
  for (let i = Math.floor((a.x - r) / cell); i <= Math.floor((a.x + r) / cell); i++) for (let j = Math.floor((a.z - r) / cell); j <= Math.floor((a.z + r) / cell); j++) for (const m of H.get(key(i, j)) || []) {
    if (m <= n) continue; const id = n * 100000 + m; if (seen.has(id)) continue; seen.add(id);
    const b = CS[m], oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); if (oy < MINH) continue;
    if (a.y1 - a.y0 > 2.4 && b.y1 - b.y0 > 2.4) continue;       // two walls meeting: a corner or a T joint overlaps by a wall thickness by design
    // one contains the other entirely (a compound prop's parts, a floor slab and its rim): not a defect
    const p = pen(a, b); if (p < MINPEN) continue;
    const vol = Math.min(a.hx * a.hz, b.hx * b.hz) * 4;
    if (p > Math.min(a.hx, a.hz, b.hx, b.hz) * 1.9 && (Math.min(a.hx * a.hz, b.hx * b.hz) < 0.02)) continue;       // a post inside a wall
    const small = Math.max(a.hx, a.hz, b.hx, b.hz) < 1.0 && oy < 0.75 && p < 0.6;       // a chair tucked under a table, a stool by a hearth: furniture meets furniture
    out.push({ kind: small ? 'tucked' : 'solid', score: small ? 0 : p * Math.min(oy, 3), at: [(a.x + b.x) / 2, (Math.max(a.y0, b.y0) + Math.min(a.y1, b.y1)) / 2, (a.z + b.z) / 2], d: 'pen ' + p.toFixed(2) + ' h ' + oy.toFixed(2) + ' a ' + a.hx.toFixed(2) + 'x' + a.hz.toFixed(2) + ' b ' + b.hx.toFixed(2) + 'x' + b.hz.toFixed(2) });
  }
});
const inSolid = (x, y, z, pad) => { for (const n of H.get(key(Math.floor(x / cell), Math.floor(z / cell))) || []) { const c = CS[n]; if (y < c.y0 + 0.1 || y > c.y1 - 0.1) continue; const dx = x - c.x, dz = z - c.z, u = dx * c.ax + dz * c.az, v = dx * c.bx + dz * c.bz; if (Math.abs(u) < c.hx + pad && Math.abs(v) < c.hz + pad && (c.y1 - c.y0) > 0.3) return c; } return null; };
let nd = 0;
for (const d of World.doors) {
  if (!d.c) continue; const dir = [Math.sin(d.yaw || 0), Math.cos(d.yaw || 0)], y = d.c[1] - (d.h || 2) / 2 + 0.5; let blocked = 0, free = 0;
  // a door has a building behind it: it is blocked on the street side only when BOTH sides are inside solids at 0.9 m (the house's own footprint counts for one side), or the outer side holds a low prop (under 2.2 m)
  for (const s of [-1, 1]) { const x = d.c[0] + dir[0] * 0.9 * s, z = d.c[2] + dir[1] * 0.9 * s; const c = inSolid(x, y, z, 0); if (!c) free++; else if (c.y1 - c.y0 < 2.4) blocked++; }
  if (blocked) { out.push({ kind: 'door', score: 3, at: [d.c[0], d.c[1], d.c[2]], d: 'door ' + (d.site && d.site.id || d.cell || '?') + ' ' + (d.side || '') + ' approach holds a low solid' }); nd++; }
}
for (const k in World.spots) { const s = World.spots[k]; if (!s.p) continue; const c = inSolid(s.p[0], s.p[1] + 0.5, s.p[2], -0.35); if (c) out.push({ kind: 'spot', score: 2, at: s.p, d: 'spot ' + k + ' inside a solid' }); }
for (const st of World.stairs || []) for (const w of ['bottom', 'top']) { const sp = World.spots[st[w]]; if (!sp || !sp.p) continue; const c = inSolid(sp.p[0], sp.p[1] + 0.6, sp.p[2], 0); if (c) out.push({ kind: 'stair', score: 4, at: sp.p, d: 'stair ' + st.id + ' ' + w + ' inside a solid' }); }
out.sort((a, b) => b.score - a.score);
// the number that must only fall: solid pairs (not tucked furniture) with penetration >= 0.35 m, plus blocked doors, spots and stairs inside solids
const severe = out.filter(o => o.kind !== 'tucked' && (o.kind !== 'solid' || +o.d.match(/pen ([0-9.]+)/)[1] >= 0.35)).length;
const count = {}; out.forEach(o => count[o.kind] = (count[o.kind] || 0) + 1);
return JSON.stringify({ colliders: CS.length, severe, count, total: out.length, top: out.slice(0, TOP).map(o => o.d + ' | game.shot(' + (o.at[0] - 2.5).toFixed(1) + ',null,' + (o.at[2] - 2.5).toFixed(1) + ',135,-12,13)  at ' + o.at.map(v => v.toFixed(1)).join(',')) }, null, 1);
