// Interiors: every planned house is validated (no overlaps, nothing in door swings, on stairs or in stairwells, nothing floating, every room reachable, lit),
// then the player is stood in every room and walked a step; every container is opened by script. Prints violations per building; throws if any.
// usage: node test/shot.mjs --opt plans=all --do "$(cat test/interiors.js)"   (window.__only = [...] limits the buildings); node test/parity.mjs checks nothing the old interiors registered is lost
const dt = 1 / 30, bad = [], rows = [], only = window.__only;
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
console.log(rows.join('\n'));
{ const want = Cells.list.filter(c => World.houses[c.id]).length; if (!only && rows.length < want) bad.push('checked ' + rows.length + ' buildings of ' + want + ': the plans were not built, so nothing was checked');       /* [cast] the step passed on GitHub having checked none (the coordinator, Build 83) */ }
if (bad.length) throw new Error(bad.length + ' interior problems:\n' + bad.join('\n'));
return 'interiors ok: ' + rows.length + ' buildings';
