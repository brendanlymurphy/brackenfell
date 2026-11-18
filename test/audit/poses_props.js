// [audit] What chars.js could not show: lying and talk poses in daylight, seats side-on, animals, passers-by and people of the wilds, mugs. usage: node test/audit/run.mjs --size 640x400 --dir shots/audit --json shots/audit/poses.json test/audit/poses_props.js
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
Env.dayLength = 0; const dt = 1 / 30, out = [];
let cur = null; const go = id => { if (cur === id) return; if (cur) { game.leave(); game.step(2, dt); } if (id) { game.enter(id); game.step(4, dt); } cur = id; };
const at = h => { Env.hour = h; npcSnapAll(); game.step(8, dt); };
const look = async (pos, yawOf, tag, o) => { o = o || {}; const c = Cells.at(pos[0], pos[1], pos[2]); go(c ? c.id : null); if (o.h !== undefined) at(o.h); const a = (yawOf || 0) + (o.side || 0), fx = Math.sin(a), fz = -Math.cos(a), d = o.d || 1.2, px = pos[0] + fx * d, pz = pos[2] + fz * d, yaw = Math.atan2(pos[0] - px, -(pos[2] - pz)) * 180 / Math.PI;
  const keep = Env.hour; game.shot(px, pos[1] + (o.eye || 1.45), pz, yaw, o.pitch === undefined ? -8 : o.pitch, o.light === undefined ? keep : o.light); await __snap('poses/' + tag); out.push(tag); if (o.light !== undefined) Env.hour = keep; };
const N = id => NPCS.find(n => n.id === id);
// lying, lit as at midday (the shot's hour is only the light; nobody is stepped between)
for (const id of ['greta', 'brandt', 'hale', 'rowan', 'marta', 'r_in12']) { const n = N(id); if (!n) continue; at(2.5); await look(n.pos, n.yaw, 'lie_' + id, { side: 1.57, d: 1.5, eye: 1.5, pitch: -40, light: 13 }); }
// talking: the talk pose and the face
for (const id of ['hale', 'greta', 'brandt', 'maren', 'pip', 'r_in04']) { const n = N(id); if (!n) continue; at(11); const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(c ? c.id : null); startTalk(n); game.step(24, dt); await look(n.pos, n.yaw, 'talk_' + id, { d: 1.0, eye: 1.55, pitch: -4 }); if (typeof endTalk === 'function') endTalk(); game.step(2, dt); }
// seated, from the side
at(20.5); for (const n of NPCS.filter(p => p.anim === 'sit').slice(0, 6)) await look(n.pos, n.yaw, 'sit_' + n.id, { side: 1.57, d: 1.4, eye: 1.0, pitch: -6, light: 13 });
// mugs and other things in hands at the Hart
at(20.5); for (const n of NPCS.filter(p => { const c = Cells.at(p.pos[0], p.pos[1], p.pos[2]); return c && c.id === 'inn'; }).slice(0, 4)) await look(n.pos, n.yaw, 'hart_' + n.id, { d: 0.9, eye: 1.2, pitch: -14, light: 13 });
// animals
go(null); at(11); let k = 0; for (const c of (World.chickens || []).slice(0, 3)) await look(c.pos, c.yaw, 'hen_' + (k++), { d: 0.9, eye: 0.45, pitch: -18 });
for (const [tag, x, z, yaw] of [['sheep_close', -93, -11, 180], ['sheep_close2', -88, -15, 250], ['pig_close', -94, 1.5, 0], ['pig_close2', -90, 5, 120]]) { game.shot(x, null, z, yaw, -14, 11); await __snap('poses/' + tag); out.push(tag); }
// passers-by and the people of the wilds
k = 0; for (const a of (typeof AMB !== 'undefined' ? AMB.list : []).slice(0, 6)) if (a.pos) await look(a.pos, a.yaw || 0, 'passer_' + (k++), { d: 1.1 });
k = 0; for (const a of (typeof WF !== 'undefined' ? WF.list : []).slice(0, 6)) if (a.pos) await look(a.pos, a.yaw || 0, 'wild_' + (k++), { d: 1.1 });
go(null); st.remove();
return { shots: out, amb: typeof AMB !== 'undefined' ? AMB.list.map(a => [a.id || a.name || '', a.def && a.def.body || a.body || '', a.name || '']) : null, wf: typeof WF !== 'undefined' ? WF.list.map(a => [a.id || '', a.def && a.def.body || a.body || '', a.name || '', a.pos ? a.pos.map(v => Math.round(v)) : null]) : null, hens: (World.chickens || []).length };
