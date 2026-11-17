// Clothes follow the body [ch4, C01]: every body model, dressed in every wardrobe piece it carries, in six poses (stand, sit, bend, sweep, reach, walk).
// Fails on: a vertex bound to the exporter's "neutral_bone" (it stays behind when the body moves: the metre-long white shards); a vertex more than 0.6 m
// from every joint; a triangle edge over 0.9 m. With --opt pics=<ids> it also photographs those villagers (as they are dressed in the game) at 1.15 m from
// the front, the side and behind in each pose, saved as garb/<id>_<pose>_<view>.jpg.
// usage: node test/audit/run.mjs --size 640x400 --dir shots [--opt pics=r2_in12,r_in20,r_in51,r_in94,marta] test/garb.js
const st0 = document.createElement('style'); st0.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st0);
Env.dayLength = 0; if (Cells.cur) game.leave();
const V3 = THREE.Vector3, out = { fail: [], checked: 0, cloaked: 0, housed: 0 }, POSES = { stand: ['idle', 0.2], sit: ['sit', 0.3], bend: ['work', 0.45], sweep: ['sweep', 0.4], reach: ['reach', 0.5], walk: ['walk', 0.25] };
const cfg = Chars.set.cfg; cfg.anims.reach = 'interact';
const sx = 4.2, sz = -2.5, sy = Terrain.y(sx, sz);
const pose = (H, key, scale) => { const [anim, frac] = POSES[key], s = { pos: [sx, sy, sz], yaw: 0, anim, scale: scale || 1, zone: 0, light: 1, visible: true, cast: true, look: [0, 0], talking: false };
  for (let i = 0; i < 6; i++) Chars.update(H, s, 0.1); if (H.cur) { H.cur.paused = false; H.cur.time = H.cur.getClip().duration * frac; H.mixer.update(0); } H.pivot.updateMatrixWorld(true); H.skeleton.update(); return s; };
const check = (H, tag) => { out.checked++; const m = H.meshes[0], g = m.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, ix = g.index.array, bones = H.skeleton.bones, P = [], bp = bones.map(b => b.getWorldPosition(new V3())), inv = m.matrixWorld;
  let neutral = 0, far = 0, long = 0; for (let i = 0; i < pos.count; i++) { const v = new V3(); m.getVertexPosition(i, v); v.applyMatrix4(inv); P.push(v); let nb = false; for (let k = 0; k < 4; k++) if (sw.getComponent(i, k) > 0.02 && bones[si.getComponent(i, k)].name === 'neutral_bone') nb = true; if (nb) neutral++;
    let d = 9; for (const b of bp) d = Math.min(d, b.distanceTo(v)); if (d > 0.6) far++; }
  for (let t = 0; t < ix.length; t += 3) if (Math.max(P[ix[t]].distanceTo(P[ix[t + 1]]), P[ix[t + 1]].distanceTo(P[ix[t + 2]]), P[ix[t + 2]].distanceTo(P[ix[t]])) > 0.9) long++;
  if (neutral || far || long) out.fail.push(tag + ': ' + neutral + ' unweighted, ' + far + ' vertices over 0.6 m from any joint, ' + long + ' triangles with an edge over 0.9 m'); };
// 1. every body in everything it carries
const wears0 = cfg.wears; 
for (const body of Object.keys(Chars.set.bodies)) { if (/^o_/.test(body)) continue; cfg.wears = (look, part) => !/^w_hat_/.test(part) || /cap|kerchief/.test(part);
  const H = Chars.spawn({ id: 'garb.' + body, body, house: 1, sched: [] }); cfg.wears = wears0; for (const k in POSES) { pose(H, k); check(H, body + ' all pieces ' + k); } Chars.remove(H); }
// 2. the people as dressed: nobody unweighted, and how many wear the cloak
for (const def of NPC_DEFS) { const L = cfg.look(def); if (def.house) out.housed++; if (L.wear && L.wear.cloak) { out.cloaked++; (out.cloakIds = out.cloakIds || []).push(def.id + ':' + L.body); } }
// 3. pictures
const ids = String((window.__TEST__ || {}).pics || '').split(',').filter(Boolean);
for (const id of ids) { const n = NPCS.find(p => p.id === id); if (!n) { out.fail.push(id + ': no such villager'); continue; } const H = Chars.spawn(n.def); H.pivot.traverse(o => { o.layers.set(1); });
  for (const k in POSES) { if (k === 'walk') continue; let i = 0; for (const az of [0, 90, 180]) { pose(H, k, n.scale); if (!az) check(H, id + ' ' + k); const a = az * Math.PI / 180, hd = H.bones.head.getWorldPosition(new V3()), low = hd.y - sy + 0.02; H.pivot.traverse(o => { o.layers.set(1); });
      game.shot(sx + Math.sin(a) * 1.25, sy + low, sz - Math.cos(a) * 1.25, (a + Math.PI) * 180 / Math.PI, -14, 13); await __snap('garb/' + id + '_' + k + '_' + ['front', 'side', 'back'][i++]); } }
  Chars.remove(H); }
st0.remove(); return out;
