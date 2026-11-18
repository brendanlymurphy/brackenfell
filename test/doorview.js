// [inout] What the street door looks at (inbox 11:30, Job 1). For every planned house: from the street door, 0.3 m inside, at eye height (1.6 m), a fan of rays
// 30 degrees either side of straight in, every 2 degrees. A ray stops at the first full-height thing: a wall (a doorway lets it through, a window does not), a
// piece of furniture 1.7 m high or more, a hearth's breast, a closed stair. An open stair (treads on strings, a rail) does not stop it. The house passes when every
// ray in the middle 20 degrees runs 3.5 m or more. Prints one line per failing house (nearest distance, what stopped it, the layout) and `doorview FAIL n` or PASS.
// usage: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/doorview.js)"
const EYE = 1.6, NEED = 3.5, out = [], bad = [];
for (const id of Object.keys(World.houses).sort()) {
  const P = World.houses[id].plan; if (!P || !P.lv || !P.lv[0]) continue;
  const d = P.doors.find(q => q.b === null && !q.upper && q.k === 0); if (!d || !d.wall) continue;
  const inn = -(d.wall.ns || -1), o = d.wall.ax === 'x' ? [d.x, d.z + inn * 0.3] : [d.x + inn * 0.3, d.z], ang0 = d.wall.ax === 'x' ? (inn > 0 ? 0 : Math.PI) : (inn > 0 ? Math.PI / 2 : -Math.PI / 2);
  const segs = [];
  for (const w of P.walls) { if (w.k !== 0) continue; const ops = (w.open || []).filter(q => q.type === 'door').map(q => [q.pos - q.hw, q.pos + q.hw]);
    let a = w.a; for (const [u0, u1] of ops.sort((p, q) => p[0] - q[0])) { if (u0 > a) segs.push([w.ax, w.c, a, u0, 'wall']); a = Math.max(a, u1); } if (w.b > a) segs.push([w.ax, w.c, a, w.b, 'wall']); }
  const boxes = P.items.filter(i => i.k === 0 && ((i.kind === 'floor' && (i.h || 0) >= 1.7) || i.kind === 'hearth' || (i.kind === 'stair' && !(P.stairs.find(s => s.id === i.id) || {}).open)) && !(i.kind === 'hole'));
  const hit = (dx, dz) => { let best = 99, what = '';
    for (const [ax, c, a, b, nm] of segs) { if (ax === 'x') { if (Math.abs(dz) < 1e-9) continue; const t = (c - o[1]) / dz, x = o[0] + dx * t; if (t > 0.05 && x >= a && x <= b && t < best) { best = t; what = nm; } } else { if (Math.abs(dx) < 1e-9) continue; const t = (c - o[0]) / dx, z = o[1] + dz * t; if (t > 0.05 && z >= a && z <= b && t < best) { best = t; what = nm; } } }
    for (const it of boxes) { let t0 = 0, t1 = 99; for (const [p, q, lo, hi] of [[o[0], dx, it.x0, it.x1], [o[1], dz, it.z0, it.z1]]) { if (Math.abs(q) < 1e-9) { if (p < lo || p > hi) { t0 = 99; break; } continue; } let ta = (lo - p) / q, tb = (hi - p) / q; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); } if (t0 <= t1 && t0 < best && t0 > 0.05) { best = t0; what = it.id.replace(id + '.', '') + '(' + it.kind + ')'; } }
    return [best, what]; };
  let near = 99, by = '', ang = 0;
  for (let deg = -30; deg <= 30; deg += 2) { const a = ang0 + deg * Math.PI / 180, [t, w] = hit(Math.sin(a), Math.cos(a)); if (Math.abs(deg) <= 10 && t < near) { near = t; by = w; ang = deg; } }
  const ok = near >= NEED; out.push([id, near, by, ang, P.layout || '']); if (!ok) bad.push(id + ': ' + near.toFixed(2) + ' m to ' + by + ' at ' + ang + ' deg' + (P.layout ? ' (' + P.layout + (P.lwWhy ? ', not lengthwise: ' + P.lwWhy : '') + ')' : ''));
}
console.log('doorview: ' + out.length + ' houses, ' + bad.length + ' see a full-height thing nearer than ' + NEED + ' m in the middle 20 degrees'); for (const b of bad) console.log('  ' + b);
window.__doorview = out;
return bad.length ? 'doorview FAIL ' + bad.length : 'doorview PASS';
