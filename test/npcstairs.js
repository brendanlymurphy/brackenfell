// Villagers who sleep upstairs must get there and back by the stairs: from the stair's foot to every upstairs spot and from there to the front door,
// stepping the village's own npcUpdate. Fails (throws) if one never arrives, dips through the floor, or is not on the upper floor at the end.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/npcstairs.js)"
const out = [], fails = [];
const n = NPCS[0];
function run(from, to, minY, maxY) {
  npcClaimReset();          // [c4] the walker is not a resident: a sleeper already in the bed (Rowan until 8:00) must not turn the bed into a ring of standing places
  n.path = null; n.talking = false; npcArrive(n, from, 'idle'); n.goal = from; n.override = [[0, to, 'idle']];
  let t = 0, lo = 1e9, hi = -1e9;
  for (; t < 120 && (n.path || n.goal !== to || n.at !== to); t += 0.1) { npcUpdate(0.1, [9999, 0, 9999]); lo = Math.min(lo, n.pos[1]); hi = Math.max(hi, n.pos[1]); if (n.goal === to && n.at === to) break; }
  const sp = World.spots[to], ok = n.at === to && Math.abs(n.pos[1] - sp.p[1]) < 0.3;
  out.push(from + ' -> ' + to + ' ' + t.toFixed(0) + 's y ' + lo.toFixed(2) + '..' + hi.toFixed(2) + (ok ? '' : ' FAIL'));
  if (!ok) fails.push(from + ' -> ' + to + ' ended at ' + n.pos.map(v => +v.toFixed(2)) + ' (at ' + n.at + ', wanted y ' + sp.p[1].toFixed(2) + ')');
  else if (lo < Math.min(World.spots[from].p[1], sp.p[1]) - 0.35) fails.push(from + ' -> ' + to + ' dipped to y ' + lo.toFixed(2));
}
for (const st of World.stairs) {
  const fy = World.houses[st.site].floorY;
  for (const name in World.spots) {
    const sp = World.spots[name]; if (name.includes('#') || sp.site !== st.site || sp.p[1] < fy + 1.5 || name === st.top || st.via.includes(name)) continue;
    run(st.bottom, name); run(name, st.bottom);
  }
}
if (fails.length) throw new Error('NPCSTAIRS FAIL ' + JSON.stringify(fails));
return 'npcstairs PASS ' + out.length + ' walks: ' + out.slice(0, 6).join(' | ');
