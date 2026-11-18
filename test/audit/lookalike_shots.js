// [audit] a face-on picture of each person in the given look-alike pairs, at an hour they are together (window.__PAIRS = [[idA, idB, hour], ...])
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
Env.dayLength = 0; let cur = null; const go = id => { if (cur === id) return; if (cur) { game.leave(); game.step(2, 1 / 30); } if (id) { game.enter(id); game.step(4, 1 / 30); } cur = id; };
let i = 0; for (const [a, b, h] of window.__PAIRS) { i++; for (const id of [a, b]) { Env.hour = h + 0.5; npcSnapAll(); game.step(6, 1 / 30); const n = NPCS.find(p => p.id === id), c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(c ? c.id : null); Env.hour = h + 0.5; npcSnapAll(); game.step(6, 1 / 30);
  const fx = Math.sin(n.yaw), fz = -Math.cos(n.yaw), up = n.anim === 'sit' ? 1.15 : 1.55, px = n.pos[0] + fx * 1.3, pz = n.pos[2] + fz * 1.3; game.shot(px, n.pos[1] + up, pz, Math.atan2(n.pos[0] - px, -(n.pos[2] - pz)) * 180 / Math.PI, -4, 13); await __snap('lookalike/' + String(i).padStart(2, '0') + '_' + id); } }
go(null); return i;
