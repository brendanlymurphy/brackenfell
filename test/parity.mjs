// Parity: everything the legacy interior of a building registered (interact ids, spots, pickups, bell, door ids) must exist in its planned replacement.
// usage: node test/parity.mjs   (runs the page twice: --opt plans=0 and --opt plans=all, then diffs per building)
import { execFileSync } from 'node:child_process';
const js = `const by = {}; const zs = id => { const z = World.zones[id - 1]; return z && z.site ? (z.site.real ? z.site.real.id : z.site.id) : 'outdoors'; };
for (const it of World.interact) { const b = it.zone ? zs(it.zone) : 'outdoors'; (by[b] = by[b] || {}).i = by[b].i || []; by[b].i.push((it.kind || '') + ':' + (it.id || '')); }
for (const k in World.spots) { const s = World.spots[k], b = s.site || 'outdoors'; (by[b] = by[b] || {}).s = by[b].s || []; by[b].s.push(k); }
return JSON.stringify({ by, bell: !!World.bell });`;
const run = opt => { const o = execFileSync('node', ['test/shot.mjs', '--opt', opt, '--do', js], { encoding: 'utf8', timeout: 400000 }); const m = o.match(/-> "(.*)" \d+ms/s); return JSON.parse(JSON.parse('"' + m[1] + '"')); };
const A = run('plans=0'), B = run('plans=all'); let bad = 0;
for (const b in A.by) { if (b === 'outdoors') continue; const ia = new Set(A.by[b].i || []), ib = new Set((B.by[b] || {}).i || []), sa = new Set(A.by[b].s || []), sb = new Set((B.by[b] || {}).s || []);
  const mi = [...ia].filter(x => !ib.has(x)), ms = [...sa].filter(x => !sb.has(x) && !/\.(up|cellar|stairs[UV]?)\d?$/.test(x));
  if (mi.length || ms.length) { bad++; console.log(b + ': missing interacts [' + mi.join(', ') + '] spots [' + ms.join(', ') + ']'); } }
if (!A.bell || !B.bell) { bad++; console.log('World.bell missing'); }
console.log(bad ? bad + ' buildings lose something' : 'parity ok'); process.exit(bad ? 1 : 0);
