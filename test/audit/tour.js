// [ch4] Arm's-length tour: ten villagers at 0.6 m, each doing what they do at 11:00 with what they hold, in daylight in the square (so the light is the same for all):
// face (eye height, 0.6 m), hands (0.55 m, at the hands), hem (0.6 m, at the knees and feet) and the held thing (0.5 m, at it), plus one whole-body picture at 1.6 m.
// usage: node test/audit/run.mjs --size 640x480 --dir docs/proof/chars/tour test/audit/tour.js
const st0 = document.createElement('style'); st0.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st0);
Env.dayLength = 0; if (Cells.cur) game.leave(); const V3 = THREE.Vector3, sx = 4.2, sz = -2.5, sy = Terrain.y(sx, sz), out = [];
const IDS = String((window.__TEST__ || {}).who || 'hale,greta,brandt,marta,lark,stephen,petronel,mercy,odo,jordan').split(',');
for (const id of IDS) { const def = NPC_DEFS.find(d => d.id === id); if (!def) { out.push(id + ' missing'); continue; }
  let anim = 'idle'; for (const r of def.sched || []) if (r[0] <= 11) anim = r[2]; if (anim === 'lie' || anim === 'sit') anim = 'idle';
  const H = Chars.spawn(def), npc = { ch: H, def, id }; npcHandProp(npc); const s = { pos: [sx, sy, sz], yaw: 0, anim, scale: def.scale || 1, zone: 0, light: 1, visible: true, cast: true, look: [0, 0], talking: false };
  for (let i = 0; i < 12; i++) Chars.update(H, s, 0.1);
  const wp = n => H.root.getObjectByName(n).getWorldPosition(new V3()), head = wp('head').add(new V3(0, 0.07, 0)), hands = wp('hand_r').add(wp('hand_l')).multiplyScalar(0.5), hem = wp('calf_l').add(wp('calf_r')).multiplyScalar(0.5).add(new V3(0, -0.15, 0));
  const prop = (npc.props || []).find(m => m.visible && (m.parent && m.parent !== H.pivot.parent)), thing = prop ? prop.localToWorld(prop.geometry.boundingBox.getCenter(new V3())) : null;
  const views = [['body', new V3(sx, sy + 1.0, sz), 1.9, 0], ['face', head, 0.6, 0], ['hands', hands, 0.55, 20], ['hem', hem, 0.6, 12]]; if (thing) views.push(['held', thing, 0.5, 25]);
  for (const [tag, P, d, az] of views) { const a = az * Math.PI / 180, px = P.x + Math.sin(a) * d, pz = P.z - Math.cos(a) * d; for (let i = 0; i < 2; i++) { Chars.update(H, s, 0.016); game.shot(px, P.y, pz, Math.atan2(P.x - px, -(P.z - pz)) * 180 / Math.PI, 0, 11); } await __snap(id + '_' + tag); }
  out.push([id, anim, H.body, prop ? prop.userData.kind : '-']); Chars.remove(H); }
st0.remove(); return out;
