// Sleepers [ch4]: everyone in bed at 02:30, photographed from beside the bed and from above its foot (as test/audit/poses2.js does), and checked:
// in bed, the hat and outer garments are off (uShed 2), a blanket covers them, and no hand is higher than 0.45 m above the lowest point of the body (an arm up in the air).
// usage: node test/audit/run.mjs --opt cellnight=10 --size 640x400 --dir shots [--opt pics=12] test/sleep.js
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
Env.dayLength = 0; const dt = 1 / 30, out = { asleep: 0, fail: [], shown: [] }, V3 = THREE.Vector3, NP = +((window.__TEST__ || {}).pics || 0);
let cur = null; const go = id => { if (cur === id) return; if (cur) { game.leave(); game.step(2, dt); } if (id) { game.enter(id); game.step(4, dt); } cur = id; };
Env.hour = 2.5; npcSnapAll(); game.step(8, dt);
const sl = NPCS.filter(n => n.anim === 'lie'); out.asleep = sl.length; const pick = NP ? sl.filter((n, i) => i % Math.ceil(sl.length / NP) === 0).slice(0, NP) : [];
for (const n of sl) { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(c ? c.id : null); Env.hour = 2.5; npcSnapAll(); game.step(4, dt);
  const fx = Math.sin(n.yaw), fz = -Math.cos(n.yaw), px = n.pos[0] - fz * 1.5 + fx * 0.3, pz = n.pos[2] + fx * 1.5 + fz * 0.3;
  game.shot(px, n.pos[1] + 1.5, pz, Math.atan2(n.pos[0] - px, -(n.pos[2] - pz)) * 180 / Math.PI, -42, 2.5); game.step(4, dt); game.shot(px, n.pos[1] + 1.5, pz, Math.atan2(n.pos[0] - px, -(n.pos[2] - pz)) * 180 / Math.PI, -42, 2.5);
  const H = n.ch; if (!H) continue; H.pivot.updateMatrixWorld(true); const wp = b => H.root.getObjectByName(b).getWorldPosition(new V3());
  const low = Math.min(wp('pelvis').y, wp('head').y, wp('foot_l').y), hands = Math.max(wp('hand_l').y, wp('hand_r').y) - low;
  if (H.uShed.value < 2) out.fail.push(n.id + ': dressed in bed (shed ' + H.uShed.value + ')'); if (!H.blanket) out.fail.push(n.id + ': no blanket'); if (hands > 0.45) out.fail.push(n.id + ': a hand ' + hands.toFixed(2) + ' m above the body');
  if (pick.includes(n)) { game.shot(px, n.pos[1] + 1.5, pz, Math.atan2(n.pos[0] - px, -(n.pos[2] - pz)) * 180 / Math.PI, -42, 2.5); await __snap('sleep/' + n.id); const qx = n.pos[0] - fz * 1.3, qz = n.pos[2] + fx * 1.3; game.shot(qx, n.pos[1] + 0.75, qz, Math.atan2(n.pos[0] - qx, -(n.pos[2] - qz)) * 180 / Math.PI, -14, 2.5); await __snap('sleep/' + n.id + '_side'); if (H.blanket) { H.blanket.visible = false; game.shot(qx, n.pos[1] + 0.75, qz, Math.atan2(n.pos[0] - qx, -(n.pos[2] - qz)) * 180 / Math.PI, -14, 2.5); await __snap('sleep/' + n.id + '_under'); H.blanket.visible = true; } out.shown.push(n.id); } }
go(null); st.remove(); return out;
