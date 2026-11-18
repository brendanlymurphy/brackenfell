// [audit] Lying and talk poses. Run with --opt cellnight=10 so cells are lit at night without moving the clock (the switch exists in 56_cells.js).
// usage: node test/audit/run.mjs --opt cellnight=10 --size 640x400 --dir shots/audit --json shots/audit/poses2.json test/audit/poses2.js
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas):not(#dialog) { visibility: hidden !important; }'; document.head.appendChild(st);
Env.dayLength = 0; const dt = 1 / 30, out = { lie: [], talk: [] };
let cur = null; const go = id => { if (cur === id) return; if (cur) { game.leave(); game.step(2, dt); } if (id) { game.enter(id); game.step(4, dt); } cur = id; };
// lying: everyone asleep at 02:30, from above the foot of the bed and from the side
Env.hour = 2.5; npcSnapAll(); game.step(8, dt);
const sleepers = NPCS.filter(n => n.anim === 'lie'); out.asleep = sleepers.length; out.notAsleep = NPCS.filter(n => n.anim !== 'lie').map(n => n.name + ':' + n.anim);
const pick = sleepers.filter((n, i) => i % Math.ceil(sleepers.length / 18) === 0).slice(0, 18);
for (const n of pick) { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(c ? c.id : null); Env.hour = 2.5; npcSnapAll(); game.step(6, dt); const fx = Math.sin(n.yaw), fz = -Math.cos(n.yaw), px = n.pos[0] - fz * 1.5 + fx * 0.3, pz = n.pos[2] + fx * 1.5 + fz * 0.3;
  game.shot(px, n.pos[1] + 1.5, pz, Math.atan2(n.pos[0] - px, -(n.pos[2] - pz)) * 180 / Math.PI, -42, 2.5); await __snap('poses2/lie_' + n.id);
  const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 1); out.lie.push({ id: n.id, name: n.name, cell: c ? c.id : '', at: typeof n.at === 'string' ? n.at : '', aboveFloor: +(n.pos[1] - gy).toFixed(2), sharesBedWith: sleepers.filter(m => m !== n && Math.hypot(m.pos[0] - n.pos[0], m.pos[2] - n.pos[2]) < 0.9 && Math.abs(m.pos[1] - n.pos[1]) < 1).map(m => m.name) }); }
out.bedShare = (() => { const r = []; for (let i = 0; i < sleepers.length; i++) for (let j = i + 1; j < sleepers.length; j++) { const a = sleepers[i], b = sleepers[j], d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]); if (d < 0.9 && Math.abs(a.pos[1] - b.pos[1]) < 1) r.push([a.name, b.name, +d.toFixed(2)]); } return r; })();
// talking: the player stands 1.1 m in front, the picture is the player's own view
const ids = ['hale', 'greta', 'brandt', 'maren', 'marta', 'rowan', 'pip', 'tilly', 'lambert', 'godwin', 'sabina', 'odo'];
for (const id of ids) { const n = NPCS.find(p => p.id === id); if (!n) continue; Env.hour = 10.5; npcSnapAll(); game.step(8, dt); const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(c ? c.id : null); Env.hour = 10.5; npcSnapAll(); game.step(6, dt);
  const fx = Math.sin(n.yaw), fz = -Math.cos(n.yaw), px = n.pos[0] + fx * 1.15, pz = n.pos[2] + fz * 1.15, yaw = Math.atan2(n.pos[0] - px, -(n.pos[2] - pz));
  try { Cells.teleport({ p: [px, n.pos[1], pz], yaw }); } catch (e) { } game.step(3, dt); startTalk(n); game.step(30, dt);
  game.shot(Player.pos[0], Player.pos[1] + 1.6, Player.pos[2], Math.atan2(n.pos[0] - Player.pos[0], -(n.pos[2] - Player.pos[2])) * 180 / Math.PI, -3, 10.5); await __snap('poses2/talk_' + id);
  out.talk.push({ id, name: n.name, anim: n.anim, text: (document.getElementById('dialog') || {}).innerText ? document.getElementById('dialog').innerText.replace(/\n+/g, ' / ').slice(0, 140) : '', playerDist: +Math.hypot(n.pos[0] - Player.pos[0], n.pos[2] - Player.pos[2]).toFixed(2) }); if (typeof endTalk === 'function') endTalk(); game.step(2, dt); }
go(null); st.remove(); return out;
