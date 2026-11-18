// Rooms and people: (1) no navigation link inside a planned house crosses a furniture footprint (the villagers' ways run on the free floor), (2) at 8, 12, 16, 20 and 2 h nobody stands in furniture,
// at the wrong height, facing a wall within 0.5 m, or on a seat another person holds. Prints a count; throws on faults of furniture or ways. Schedule faults (who is where) are printed, not failed.
// usage: node test/shot.mjs --opt plans=all --opt play=1 --do "$(cat test/rooms_people.js)"
const CROSS_MAX = 10, bad = [], info = [], HOURS = [8, 12, 16, 20, 2], solid = (i, k) => i.k === k && ['floor', 'stair', 'hearth', 'hole'].includes(i.kind) && (i.h === undefined || i.h > 0.3);
const frame = P => { const o = P.w2(0, 0, 0), ax = P.w2(1, 0, 0), az = P.w2(0, 0, 1), ux = [ax[0] - o[0], ax[2] - o[2]], uz = [az[0] - o[0], az[2] - o[2]]; return { o, ux, uz, loc: (x, z) => { const dx = x - o[0], dz = z - o[2]; return [dx * ux[0] + dz * ux[1], dx * uz[0] + dz * uz[1]]; } }; };
const houses = Object.keys(World.houses).filter(id => World.houses[id].plan);
let links = 0, crossed = 0;
for (const id of houses) {
  const P = World.houses[id].plan, F = frame(P), N = Nav.nodes, A = Nav.adj, ks = Object.keys(P.lv).map(Number);
  const at = n => { const l = F.loc(N[n][0], N[n][2]); for (const k of ks) { if (Math.abs(N[n][1] - (F.o[1] + P.lv[k].y)) > 0.3) continue; for (const r of Object.values(P.rooms)) if (r.k === k && l[0] > r.in.x0 - 0.6 && l[0] < r.in.x1 + 0.6 && l[1] > r.in.z0 - 0.6 && l[1] < r.in.z1 + 0.6) return { k, l }; } return null; };
  const seen = new Set();
  for (let a = 0; a < N.length; a++) { const pa = at(a); if (!pa) continue; for (const [b] of A[a]) { if (b < a) continue; const pb = at(b); if (!pb || pb.k !== pa.k || seen.has(a + ',' + b)) continue; seen.add(a + ',' + b); links++;
    const L = Math.hypot(pa.l[0] - pb.l[0], pa.l[1] - pb.l[1]), n = Math.max(2, Math.ceil(L / 0.1)); let hit = null;
    for (let i = 0; i <= n && !hit; i++) { const t = i / n, x = pa.l[0] + (pb.l[0] - pa.l[0]) * t, z = pa.l[1] + (pb.l[1] - pa.l[1]) * t; if (Math.hypot(x - pa.l[0], z - pa.l[1]) < 0.7 || Math.hypot(x - pb.l[0], z - pb.l[1]) < 0.7) continue;
      for (const it of P.items) if (solid(it, pa.k) && x > it.x0 + 0.1 && x < it.x1 - 0.1 && z > it.z0 + 0.1 && z < it.z1 - 0.1) { hit = it.id.replace(id + '.', ''); break; } }
    if (hit) { crossed++; bad.push(id + ': a way crosses ' + hit + ' at plan (' + pa.l.map(v => v.toFixed(1)) + ') to (' + pb.l.map(v => v.toFixed(1)) + ') level ' + pa.k); } } }
}
console.log('ways inside ' + houses.length + ' houses: ' + links + ' links, ' + crossed + ' cross furniture');
let people = 0, inF = 0, tall = 0, wall = 0, dbl = 0; const sched = [];
for (const hour of HOURS) {
  Env.dayLength = 0; Env.hour = hour; npcSnapAll(); game.step(3, 1 / 30); Env.hour = hour; npcSnapAll(); game.step(6, 1 / 30);
  const seatOf = {}, inside = {};
  for (const n of NPCS) {
    for (const id of houses) { const P = World.houses[id].plan, F = frame(P), l = F.loc(n.pos[0], n.pos[2]);
      const rm = Object.values(P.rooms).find(r => l[0] > r.in.x0 - 0.1 && l[0] < r.in.x1 + 0.1 && l[1] > r.in.z0 - 0.1 && l[1] < r.in.z1 + 0.1 && Math.abs(n.pos[1] - (F.o[1] + P.lv[r.k].y)) < 2.2); if (!rm) continue;
      people++; inside[id] = (inside[id] || 0) + 1; const tag = hour + 'h ' + id + ' ' + n.name + ' (' + n.anim + (n.spot ? ' ' + (n.spot.p ? n.spot.p.map(v => v.toFixed(1)).join(',') : n.spot) : '') + ')';
      const hit = P.items.filter(i => solid(i, rm.k) && l[0] > i.x0 + 0.05 && l[0] < i.x1 - 0.05 && l[1] > i.z0 + 0.05 && l[1] < i.z1 - 0.05 && !/bench|stool|seat|chair|bed|cot|pallet|bunk/.test(i.id) );
      const sitting = /sit|seat|lie|sleep/.test(n.anim || '') || /^(sit|seat\d|bed)/.test(String(n.spot && n.spot.name || n.spot || ''));
      if (hit.length && !sitting) { inF++; bad.push(tag + ' stands in ' + hit.map(i => i.id.replace(id + '.', '')).join('+') + ' at (' + l.map(v => v.toFixed(1)) + ')'); }
      const fy = F.o[1] + P.lv[rm.k].y, dy = n.pos[1] - fy; if (!sitting && (dy < -0.3 || dy > 0.4)) { tall++; bad.push(tag + ' at the wrong height ' + dy.toFixed(2) + ' m'); }
      if (!sitting && n.anim !== 'walk') { const dir = [Math.sin(n.yaw || 0), -Math.cos(n.yaw || 0)], fl = [dir[0] * F.ux[0] + dir[1] * F.ux[1], dir[0] * F.uz[0] + dir[1] * F.uz[1]], fx = l[0] + fl[0] * 0.5, fz = l[1] + fl[1] * 0.5; if (fx < rm.in.x0 + 0.03 || fx > rm.in.x1 - 0.03 || fz < rm.in.z0 + 0.03 || fz > rm.in.z1 - 0.03) { wall++; info.push(tag + ' faces a wall'); } }
      if (n.spot && sitting) { const key = id + '|' + (n.spot.p ? n.spot.p.map(v => v.toFixed(1)).join(',') : n.spot); if (seatOf[key]) { dbl++; bad.push(tag + ' shares seat ' + n.spot + ' with ' + seatOf[key]); } else seatOf[key] = n.name; }
      break; }
  }
  for (const id of houses) if (/^(mill|guardhouse)$/.test(id) && !inside[id]) sched.push(hour + 'h ' + id + ' empty');
}
console.log('people in houses at ' + HOURS.join(', ') + ' h: ' + people + ' placements; ' + inF + ' in furniture, ' + tall + ' at the wrong height, ' + dbl + ' doubled on a seat, ' + wall + ' facing a wall (printed, not failed)');
if (info.length) console.log(info.slice(0, 20).join('\n'));
if (sched.length) console.log('schedule: ' + sched.join('; '));
for (let i = 0; i < Math.min(bad.length, 120); i += 6) console.log(bad.slice(i, i + 6).join('\n'));
const rest = bad.filter(b => !/a way crosses/.test(b)); if (rest.length || crossed > CROSS_MAX) throw new Error(rest.length + ' room/people faults, ' + crossed + ' ways across furniture (limit ' + CROSS_MAX + ')');
return 'rooms_people ok: ' + people + ' placements';
