// [ch4] One sheet per animal kind for the coordinator: 0.6 m, 3 m, 6 m (6 m with a villager beside it for scale), from the side and the front, at noon and at dusk,
// and its pen seen from 4 m. The animal stands still for the pictures (state idle), on the ground of its first pen.
// usage: node test/audit/run.mjs --size 480x320 --dir shots/animals --opt kind=hen test/audit/animal_sheet.js
const st0 = document.createElement('style'); st0.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st0);
Env.dayLength = 0; if (Cells.cur) game.leave(); for (let i = 0; i < 80 && !ANI.ready; i++) await new Promise(r => setTimeout(r, 200));
const kind = (window.__TEST__ || {}).kind || 'hen', V3 = THREE.Vector3, out = { kind };
// --opt at=x,z,yaw stands the animal there for the pictures only (a kind with no pen in the town yet)
if ((window.__TEST__ || {}).at && ANI.kinds[kind].still) { const [x, z, yaw] = String(window.__TEST__.at).split(',').map(Number); animalAddStill(kind, [x, World.groundAt(x, z, 50), z, yaw || 0]); out.placedForTest = true; }
const list = ANI.list.filter(a => a.kind === kind); out.count = list.length;
// the most open pen: the one whose yard centre has the fewest blocked points on rings at 1, 3 and 6 m
const openness = B => { const cx = B.still ? B.x : B.pen[0] + Math.sin(B.pen[3]) * B.K.off, cz = B.still ? B.z : B.pen[2] - Math.cos(B.pen[3]) * B.K.off; let n = 0; for (const r of [0.6, 1, 3, 6]) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; if (!World.blockedAt(cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.2)) n++; } return n; };
const A = list.slice().sort((p, q) => openness(q) - openness(p))[0]; out.pen = A && A.pen.map(v => +v.toFixed(1));
if (!A) return 'no ' + kind;
const pen = A.pen, cx = A.still ? A.x : pen[0] + Math.sin(pen[3]) * A.K.off, cz = A.still ? A.z : pen[2] - Math.cos(pen[3]) * A.K.off;
if (!A.still) { A.x = cx; A.z = cz; A.yaw = 0; A.state = 'idle'; A.t = 99; } else { A.t = 1e9; A.pose = (window.__TEST__ || {}).pose || A.pose; }
const def = NPC_DEFS.find(d => d.id === 'idony') || NPC_DEFS[0], H = Chars.spawn(def), hs = { pos: [cx + 0.7, World.groundAt(cx + 0.7, cz, pen[1] + 1), cz], yaw: 0, anim: 'idle', scale: 1, zone: 0, light: 1, visible: false, cast: true, look: [0, 0], talking: false };
const step = (h, villager) => { Env.hour = h; hs.visible = !!villager; for (let i = 0; i < 4; i++) { animalsUpdate(1 / 30, [A.x, 0, A.z]); Chars.update(H, hs, 1 / 30); } H.pivot.visible = !!villager; };
const gy = World.groundAt(cx, cz, pen[1] + 1), aim = new V3(cx, gy + (A.still ? 0.9 : 0.2), cz);
const shotAt = async (tag, d, az, h, villager, dy) => { const a = (A.yaw + az) , px = aim.x + Math.sin(a) * d, pz = aim.z + Math.cos(a) * d, py = aim.y + (dy === undefined ? Math.max(0.12, d * 0.25) : dy); step(h, villager);
  const P = villager ? aim.clone().add(new V3(0.35, 0.55, 0)) : aim; for (let i = 0; i < 2; i++) { step(h, villager); game.shot(px, py, pz, Math.atan2(P.x - px, -(P.z - pz)) * 180 / Math.PI, -Math.atan2(py - P.y, Math.hypot(P.x - px, P.z - pz)) * 180 / Math.PI, h); } await __snap(kind + '/' + tag); };
for (const [hn, h] of [['noon', 12.5], ['dusk', 19.6]]) {
  await shotAt(hn + '_0.6_side', 0.6, Math.PI / 2, h, false); await shotAt(hn + '_0.6_front', 0.6, 0, h, false);
  await shotAt(hn + '_3_side', 3, Math.PI / 2, h, false); await shotAt(hn + '_3_front', 3, 0, h, false);
  await shotAt(hn + '_6_side', 6, Math.PI / 2, h, true, 1.4); await shotAt(hn + '_6_front', 6, 0, h, true, 1.4); }
{ const px = A.still ? cx + 4 : pen[0] + Math.sin(pen[3]) * (A.K.off + 4), pz = A.still ? cz + 1 : pen[2] - Math.cos(pen[3]) * (A.K.off + 4); for (const B of list.filter(b => b.pen === pen)) { B.state = 'idle'; B.t = 99; } step(12.5, false); for (let i = 0; i < 2; i++) { step(12.5, false); game.shot(px, gy + 1.6, pz, Math.atan2(pen[0] - px, -(pen[2] - pz)) * 180 / Math.PI, -14, 12.5); } await __snap(kind + '/pen'); }
out.tris = A.near ? A.near.geometry.index.count / 3 : 0; out.farTris = A.far ? A.far.geometry.index.count / 3 : 0; out.height = +(new THREE.Box3().setFromObject(A.near || A.meshes[A.pose]).getSize(new V3()).y).toFixed(2);
Chars.remove(H); st0.remove(); return out;
