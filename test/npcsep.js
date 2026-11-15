// People: no two characters may stand within 0.4 m of each other (inside each other) at any of eight hours. Snaps everyone to the schedule at 3, 7, 9, 12, 15, 18.5, 21 and 23 and checks every pair in the same space.
const hours = [3, 7, 9, 12, 15, 18.5, 21, 23], bad = []; Env.dayLength = 0;
for (const h of hours) {
  Env.hour = h; npcSnapAll();
  for (let i = 0; i < NPCS.length; i++) for (let j = i + 1; j < NPCS.length; j++) {
    const a = NPCS[i], b = NPCS[j]; if (Cells.spaceOf(a.pos) !== Cells.spaceOf(b.pos)) continue;
    const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]), dy = Math.abs(a.pos[1] - b.pos[1]);
    if (d < (window.__min || 0.4) && dy < 1.2) bad.push(h + 'h ' + a.id + ' & ' + b.id + ' ' + d.toFixed(2) + ' m at ' + (a.at || '?') + ' / ' + (b.at || '?'));
  }
}
if (bad.length) throw new Error(bad.length + ' overlapping pairs:\n' + bad.slice(0, 40).join('\n'));
return 'npcsep ok: ' + NPCS.length + ' people at ' + hours.length + ' hours';
