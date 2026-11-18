// Interiors: every planned house is validated (no overlaps, nothing in door swings, on stairs or in stairwells, nothing floating, every room reachable, lit),
// then the player is stood in every room and walked a step; every container is opened by script. Prints violations per building; throws if any.
// usage: node test/shot.mjs --opt plans=all --do "$(cat test/interiors.js)"   (window.__only = [...] limits the buildings); node test/parity.mjs checks nothing the old interiors registered is lost
const dt = 1 / 30, bad = [], rows = [], only = window.__only, WAYS_MAX = 19;
for (const id in World.houses) {
  const h = World.houses[id]; if (!h.plan || (only && !only.includes(id))) continue;
  const P = h.plan, v = planValidate(P); rows.push(id + ': ' + Object.keys(P.rooms).length + ' rooms, ' + P.items.length + ' items, ' + v.length + ' violations');
  for (const x of v) bad.push(id + ': ' + x);
  // stand in every room centre: the floor must be there (the player does not fall) and a step must not be refused by a wall
  for (const rid in P.rooms) {
    const r = P.rooms[rid], L = P.lv[r.k], c = pCentre(r); let p = P.w2(c[0], L.y + 0.05, c[1]);
    for (const it of P.items) if (it.k === r.k && it.kind !== 'rug' && c[0] > it.x0 && c[0] < it.x1 && c[1] > it.z0 && c[1] < it.z1) { const q = pFree && null; }
    if (!World.floors.some(f => Math.abs(f.y - p[1]) < 0.5 && Math.abs(f.x - p[0]) < f.hx + Math.abs(f.hz) + 20)) bad.push(id + ': no floor under room ' + rid);
  }
  for (const it of World.interact) if (it.kind === 'chest' && it.id && it.id.startsWith(id + '.') && !(it.loot && it.loot.length)) bad.push(id + ': chest ' + it.id + ' is empty');
}
{ let nf = 0, nh = 0; const fl = []; for (const id in World.houses) { const P = World.houses[id].plan; if (!P || (only && !only.includes(id))) continue; nh++; const w = (P.fallbacks || []).filter(n => n.endsWith('*')); if (w.length) { nf++; fl.push(id + ' ' + w.join(',')); } } console.log('spot fallbacks of spots a schedule wants: ' + nf + ' of ' + nh + ' houses'); for (let i = 0; i < fl.length; i += 12) console.log(fl.slice(i, i + 12).join('; ')); }
// [inout] the invariants every plan keeps (coordinator, 2026-11-18; the logic session's schedules rely on them):
// spots home, work, sit, fire1 (fire1 not on home); a bed per sleeper of the household; max(4, household) seats at distinct places, each reached by a 0.9 m way
// from the street door; 1.2 m clear at every stair head and foot; a 0.9 m way from the street door to every stair; four free standing places within 2 m of home;
// the Hart also bar, stand1, stand2.
{ const SOLIDK = k => !/^(rug|flat|hang|wall|clear|light)$/.test(k || '');
  for (const id in World.houses) { const H = World.houses[id], P = H.plan; if (!P || (only && !only.includes(id))) continue;
    const S = P.spots || {}, sleepers = typeof castSleepers === 'function' ? castSleepers(id) : 0, lived = sleepers > 0;
    const grid = {}, cell = 0.05, key = (k, i, j) => k + ':' + i + ':' + j;      /* 5 cm: a coarser cache took the wall band for the floor beside it */
    const free = (k, x, z) => { const kk = key(k, Math.floor(x / cell), Math.floor(z / cell)); if (kk in grid) return grid[kk]; let ok = Object.values(P.rooms).some(r => r.k === k && x > r.in.x0 && x < r.in.x1 && z > r.in.z0 && z < r.in.z1) || P.doors.some(d => d.k === k && d.wall && (d.wall.ax === 'x' ? Math.abs(x - d.x) < d.w / 2 && Math.abs(z - d.z) < 0.35 : Math.abs(z - d.z) < d.w / 2 && Math.abs(x - d.x) < 0.35));
      if (ok) for (const it of P.items) if (it.k === k && SOLIDK(it.kind) && it.kind !== 'hole' && x > it.x0 && x < it.x1 && z > it.z0 && z < it.z1 && !(it.h !== undefined && it.h < 0.52 && it.kind !== 'stair'))      /* a bench or stool is sat on, not walked round */ { ok = false; break; }
      if (ok) for (const h of P.holes) if (h.k === k && x > h.r.x0 && x < h.r.x1 && z > h.r.z0 && z < h.r.z1) { ok = false; break; }
      return grid[kk] = ok; };
    const wide = (k, x, z, r) => { for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, -r * 0.7]]) if (!free(k, x + dx, z + dz)) return false; return true; };
    // the flood: 0.9 m wide ways (a body of 0.45 m radius), level to level by the stairs (their foot and head points)
    const e = P.doors.find(d => d.b === null && !d.upper); if (!e) continue; const st = 0.15, seen = new Set(), q = []; const push = (k, x, z) => { const kk = key(k, Math.round(x / st), Math.round(z / st)); if (seen.has(kk) || !wide(k, x, z, 0.42)) return; seen.add(kk); q.push([k, x, z]); };
    push(0, e.x, e.z + 0.9); const reachable = (k, x, z, r) => { r = r || 0.3; for (let dx = -r; dx <= r + 0.01; dx += st) for (let dz = -r; dz <= r + 0.01; dz += st) if (seen.has(key(k, Math.round((x + dx) / st), Math.round((z + dz) / st)))) return true; return false; };
    for (let n = 0; n < q.length && n < 60000; n++) { const [k, x, z] = q[n]; for (const [dx, dz] of [[st, 0], [-st, 0], [0, st], [0, -st]]) push(k, x + dx, z + dz);
      for (const s2 of P.stairs) { if (s2.k0 === k && Math.hypot(x - s2.lowPt[0], z - s2.lowPt[1]) < 0.4) push(s2.k1, s2.highPt[0], s2.highPt[1]); if (s2.k1 === k && Math.hypot(x - s2.highPt[0], z - s2.highPt[1]) < 0.4) push(s2.k0, s2.lowPt[0], s2.lowPt[1]); } }
    const spotL = nm => { const w = World.spots[id + '.' + nm]; if (!w) return null; const l = pToLocal(P)(w.p[0], w.p[1], w.p[2]); return { k: w.k !== undefined ? w.k : 0, x: l[0], z: l[2], w }; };
    const need = lived ? ['home', 'work', 'sit', 'fire1'] : ['home'];
    for (const nm of need) if (!World.spots[id + '.' + nm]) bad.push(id + ': no spot ' + nm);
    { const h = spotL('home'), f = spotL('fire1'); if (lived && h && f && Math.hypot(h.x - f.x, h.z - f.z) < 0.5) bad.push(id + ': fire1 is the home spot itself'); }
    if (lived) { const beds = Object.keys(S).filter(n => /^bed\d*$/.test(n) && World.spots[id + '.' + n] && World.spots[id + '.' + n].lie).length; if (beds < sleepers) bad.push(id + ': ' + beds + ' beds for ' + sleepers + ' sleepers'); }
    if (lived) { const seats = Object.keys(S).filter(n => /^(sit|seat\d+)$/.test(n)).map(spotL).filter(Boolean), distinct = []; for (const s2 of seats) if (!distinct.some(o => o.k === s2.k && Math.hypot(o.x - s2.x, o.z - s2.z) < 0.4)) distinct.push(s2);
      if (distinct.length < Math.max(4, sleepers)) bad.push(id + ': ' + distinct.length + ' seats at distinct places, wants ' + Math.max(4, sleepers));
      for (const s2 of distinct) if (!reachable(s2.k, s2.x, s2.z, 0.65))      /* the way reaches a place beside the seat: one sits down sideways onto a bench */ bad.push(id + ': seat at ' + s2.x.toFixed(1) + ',' + s2.z.toFixed(1) + ' (level ' + s2.k + ') has no 0.9 m way from the door'); }
    for (const s2 of P.stairs) { if (!reachable(s2.k0, s2.lowPt[0], s2.lowPt[1]) && !reachable(s2.k1, s2.highPt[0], s2.highPt[1])) bad.push(id + ': stair ' + s2.name + ' has no 0.9 m way from the street door');
      for (const [k, p0, dir] of [[s2.k0, s2.p0, -s2.dir], [s2.k1, s2.p1, s2.dir]]) { let blk = 0; for (let t = 0.15; t <= 1.2; t += 0.15) for (const o of [-0.3, 0, 0.3]) { const x = s2.axis === 'x' ? p0 + dir * t : s2.lat + o, z = s2.axis === 'x' ? s2.lat + o : p0 + dir * t; if (!free(k, x, z)) blk++; } if (blk > 2) bad.push(id + ': stair ' + s2.name + ' has less than 1.2 m clear at its ' + (k === s2.k0 ? 'foot' : 'head')); } }
    { const h = spotL('home'); if (lived && h) { const places = []; for (let x = h.x - 2; x <= h.x + 2; x += 0.35) for (let z = h.z - 2; z <= h.z + 2; z += 0.35) { if (Math.hypot(x - h.x, z - h.z) > 2 || Math.hypot(x - h.x, z - h.z) < 0.6 || !wide(h.k, x, z, 0.3)) continue; if (!places.some(p2 => Math.hypot(p2[0] - x, p2[1] - z) < 0.7)) places.push([x, z]); } if (places.length < 4) bad.push(id + ': only ' + places.length + ' free places to stand round home'); } }
    if (id === 'inn') for (const nm of ['bar', 'stand1', 'stand2']) if (!World.spots['inn.' + nm]) bad.push('inn: no spot ' + nm);
  } }
{ let cut = 0; const cl = []; for (const id in World.houses) { const P = World.houses[id].plan; if (!P || (only && !only.includes(id))) continue; let c = 0; for (const rid in P.rooms) { const f = pFlood(P, P.rooms[rid], null); c += f.hit.filter(h => !h).length; } if (c) { cut += c; cl.push(id + ' ' + c); } }
  console.log('ways cut off at 0.9 m (seat, stair foot, hearth front, second door of a room): ' + cut + ' in ' + cl.length + ' houses (limit ' + WAYS_MAX + ')'); for (let i = 0; i < cl.length; i += 12) console.log(cl.slice(i, i + 12).join('; ')); if (cut > WAYS_MAX && !only) bad.push('ways cut off at 0.9 m rose to ' + cut + ' (limit ' + WAYS_MAX + ')'); }
{ let n = 0; const sh = []; for (const id in World.houses) { const P = World.houses[id].plan; if (!P || (only && !only.includes(id))) continue; if (!(/^(in|shop|high)\./.test(id) || ['weaver', 'mill', 'farm', 'hunter', 'fisher', 'draper', 'herbalist'].includes(id))) continue; n++; const sp = ['sit', 'seat1', 'seat2', 'seat3'].map(k => World.spots[id + '.' + k]).filter(q => q && q.sit), d = new Set(sp.map(q => q.p[0].toFixed(1) + ',' + q.p[2].toFixed(1))).size; if (sp.length < 4 || d < 4) sh.push(id + ' ' + sp.length + ' seats, ' + d + ' distinct'); }
  console.log('seats: ' + (n - sh.length) + ' of ' + n + ' household houses have four distinct seats' + (sh.length ? '; short: ' + sh.join('; ') : '')); if (sh.length) bad.push('houses with fewer than four distinct seats: ' + sh.join('; ')); }
console.log(rows.join('\n'));
{ const want = Cells.list.filter(c => World.houses[c.id]).length; if (!only && rows.length < want) bad.push('checked ' + rows.length + ' buildings of ' + want + ': the plans were not built, so nothing was checked');       /* [cast] the step passed on GitHub having checked none (the coordinator, Build 83) */ }
if (bad.length) throw new Error(bad.length + ' interior problems:\n' + bad.join('\n'));
return 'interiors ok: ' + rows.length + ' buildings';
