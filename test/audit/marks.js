// [audit] Where each quest's compass mark points, from where the player stands at each stage: the real target, the mark's target, and the angle between them.
// usage: node test/audit/run.mjs --json shots/audit/marks.json test/audit/marks.js
const out = [], br = (a, b) => Math.round(((Math.atan2(b[0] - a[0], -(b[2] - a[2])) * 180 / Math.PI) + 360) % 360);
const at = (cell, p) => { if (World.cell) game.leave(); game.step(2, 1 / 30); if (cell) { game.enter(cell); game.step(3, 1 / 30); } if (p) Cells.teleport({ p, yaw: 0 }); game.step(2, 1 / 30); return Player.pos.slice(); };
const C = [['main', 7, 'inn', null, 'in the Hart'], ['main', 7, null, [0, 0.2, -4], 'in the square'], ['main', 8, null, [0, 0.2, -4], 'in the square'], ['main', 8, 'inn', null, 'in the Hart'], ['main', 9, null, [0, 0.2, -4], 'in the square'], ['crypt', 0, 'chapel', null, 'in the chapel'], ['crypt', 1, 'chapel', null, 'in the chapel'], ['crypt', 2, 'chapel', null, 'in the chapel'], ['main', 2, 'chapel', null, 'in the chapel'], ['main', 1, null, [0, 0.2, -4], 'in the square']];
for (const [q, stage, cell, p, where] of C) {
  S.q[q] = { stage, done: false, t: Date.now() }; const me = at(cell, p); let real = null; try { real = questTarget(q); } catch (e) { }
  const mark = real ? Cells.mapTarget(real) : null;
  out.push({ quest: q, stage, objective: (QUESTS[q].stages[stage] || '').toString().slice(0, 80), where, player: me.map(v => +v.toFixed(1)), target: real ? real.map(v => +(+v).toFixed(1)) : null, mark: mark ? mark.map(v => +(+v).toFixed(1)) : null, markIsExitDoor: !!(World.cell && mark && World.cell.door && mark === World.cell.door.c), bearingToMark: mark ? br(me, mark) : null, distToMark: mark ? +Math.hypot(mark[0] - me[0], mark[2] - me[2]).toFixed(0) : null });
}
return out;
