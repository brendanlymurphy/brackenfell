// [audit] enter every cell by game.enter and take one picture from just inside the door. usage: node test/audit/run.mjs --size 640x400 --dir shots/audit --json shots/audit/interiors.json test/audit/interiors.js
const out = [];
for (const c of Cells.list) { try { game.enter(c.id); game.step(6, 1 / 30); Env.hour = 13; game.step(2, 1 / 30); game.draw(); await __snap('i/' + c.id); const here = NPCS.filter(n => { const k = Cells.at(n.pos[0], n.pos[1], n.pos[2]); return k && k.id === c.id; }).map(n => n.name + ':' + n.anim); out.push({ id: c.id, people: here }); game.leave(); game.step(2, 1 / 30); } catch (e) { out.push({ id: c.id, err: String(e).slice(0, 200) }); } }
return out;
