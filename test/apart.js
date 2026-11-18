// Nobody stands in anybody. Every villager, regular and passer-by is run through a whole day at the game's own step (1/30 s; an hour of the day takes a minute
// of walking time), and any two bodies in the same space closer than 0.45 m for more than one second are an overlap. The owner's picture from Build 73: two women
// in exactly one spot by the stalls. usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/apart.js)"   (window.__apartAll = true lists all)
const dt = 1 / 30, far = [900, 0, 900], NEAR = 0.45, HOLD = 1.0, r1 = v => +v.toFixed(1);
Weather.set('fair'); Env.dayLength = 0; if (typeof Foes !== 'undefined') Foes.calm(true);
{ let a = 7; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const amb = typeof AMB !== 'undefined' && AMB.list ? AMB.list : [], who = () => NPCS.map(n => ({ id: n.id, name: n.name, pos: n.pos, anim: n.anim, at: n.at || n.goal, walk: !!n.path })).concat(amb.filter(a => a.state !== 'home' && a.state !== 'away').map(a => ({ id: 'amb:' + a.def.id, name: a.def.name, pos: a.pos, anim: a.anim, at: a.at || a.goal, walk: !!a.path })));
Env.hour = 4.5; npcSnapAll(); const run = new Map(), found = new Map(); let steps = 0, worstD = 9;
for (let h = 4.5; h < 28.6; h += 1 / 1800) { Env.hour = h % 24; npcUpdate(dt, far); steps++;       /* (npcUpdate runs the passers-by too) */
  const L = who(), n = L.length, live = new Set();
  for (let i = 0; i < n; i++) { const a = L[i], ax = a.pos[0], ay = a.pos[1], az = a.pos[2]; for (let j = i + 1; j < n; j++) { const b = L[j], dx = b.pos[0] - ax; if (dx > NEAR || dx < -NEAR) continue; const dz = b.pos[2] - az; if (dz > NEAR || dz < -NEAR || Math.abs(b.pos[1] - ay) > 1.2) continue; const d = Math.hypot(dx, dz); if (d >= NEAR) continue;
      const k = a.id + '|' + b.id; live.add(k); let r = run.get(k); if (!r) run.set(k, r = { t: 0, min: 9, h0: h % 24 }); r.t += dt; if (d < r.min) r.min = d;
      if (r.t > HOLD && !r.counted) { r.counted = true; const f = found.get(k) || { n: 0, secs: 0, min: 9, a: a.name, b: b.name, first: null }; f.n++; if (!f.first) f.first = { h: r1(r.h0), p: a.pos.map(r1), cell: Cells.spaceOf(a.pos) || 'outdoors', what: a.anim + (a.walk ? ' (walking)' : '') + ' at ' + a.at + ' / ' + b.anim + (b.walk ? ' (walking)' : '') + ' at ' + b.at }; found.set(k, f); r.f = f; }
      if (r.f) { r.f.secs += dt; if (d < r.f.min) r.f.min = d; if (d < worstD) worstD = d; } } }
  for (const k of run.keys()) if (!live.has(k)) run.delete(k); }
const rows = [...found.values()].sort((a, b) => b.secs - a.secs), eps = rows.reduce((s, f) => s + f.n, 0), line = f => f.a + ' and ' + f.b + ': ' + f.n + ' times, ' + Math.round(f.secs) + ' s in all, as near as ' + f.min.toFixed(2) + ' m; first at ' + f.first.h + ' h, ' + f.first.cell + ' ' + f.first.p + ' (' + f.first.what + ')';
const where = {}; for (const f of rows) { const k = f.first.cell === 'outdoors' ? 'outdoors' : 'indoors'; where[k] = (where[k] || 0) + 1; }
if (NPCS.length < 60) throw new Error('APART FAIL only ' + NPCS.length + ' villagers: the cast did not load, nothing was checked');       /* [cast] never pass on nothing */
if (window.__apartAll) return JSON.stringify({ people: NPCS.length + amb.length, steps, pairs: rows.length, episodes: eps, where, rows: rows.map(line) });
if (rows.length) throw new Error('APART FAIL ' + rows.length + ' pairs of people stood in one another (' + eps + ' times in the day; ' + JSON.stringify(where) + '): ' + JSON.stringify(rows.slice(0, 8).map(line)));
return 'apart PASS ' + (NPCS.length + amb.length) + ' people, a whole day at 1/30 s (' + steps + ' steps): no two within ' + NEAR + ' m for more than ' + HOLD + ' s';
