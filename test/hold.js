// Held things [ch4] (src/77d_handprops.js): every villager who carries something, at every row of their day and while talking, over ten moments of the animation each.
// A fault is: a prop whose size in the world is not its true size (HP_SIZE, within 3%: a prop must not take a bone's or a pose's scale); a prop shown while its owner lies in bed;
// a held prop whose grip point is more than 5 cm from the palm of the hand that holds it; any point of a prop's long axis inside the holder's torso (spine to neck, 9 cm) or
// through a forearm (3.5 cm, away from the holding hands). Returns { rows, checks, fail: [...] }.
// usage: node test/audit/run.mjs --size 320x200 --dir shots test/hold.js
Env.dayLength = 0; if (Cells.cur) game.leave();
const V = THREE.Vector3, out = { rows: 0, checks: 0, fail: [], people: 0 }, dt = 1 / 30, seen = new Set(), a = new V(), b = new V(), c = new V();
const seg = (p, s, e) => { const d = b.subVectors(e, s), t = Math.max(0, Math.min(1, c.subVectors(p, s).dot(d) / Math.max(1e-9, d.lengthSq()))); return a.copy(s).addScaledVector(d, t).distanceTo(p); };
const fail = m => { if (!seen.has(m)) { seen.add(m); out.fail.push(m); } };
let cur = null; const go = id => { if (cur === id) return; if (cur) { game.leave(); game.step(2, dt); } if (id) { game.enter(id); game.step(4, dt); } cur = id; };
for (const n of NPCS) { if (!n.props || !n.props.length || !n.ch) continue; out.people++;
  const hours = (n.def.sched || []).map(r => [(r[0] + 0.45) % 24, r[2], false]); if (hours.length) hours.push([hours[0][0], hours[0][1], true]);
  for (const [h, an, talk] of hours) { Env.hour = h; npcSnapAll(); game.step(6, dt); const cl = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(cl ? cl.id : null); Env.hour = h; npcSnapAll(); game.step(4, dt);
    game.shot(n.pos[0] + Math.sin(n.yaw) * 1.5, n.pos[1] + 1.4, n.pos[2] - Math.cos(n.yaw) * 1.5, n.yaw * 180 / Math.PI + 180, -8, h); n.talking = talk; out.rows++;
    for (let k = 0; k < 10; k++) { game.step(4, 0.05); n.talking = talk; const H = n.ch; H.pivot.updateMatrixWorld(true); out.checks++;
      const wp = nm => H.root.getObjectByName(nm).getWorldPosition(new V()), tag0 = n.id + ' ' + n.anim + (talk ? '+talk' : '') + ' at ' + h.toFixed(1);
      for (const m of n.props) { const u = m.userData, tag = tag0 + ' ' + u.kind; if (!m.visible) continue; m.updateWorldMatrix(true, false);
        if (n.anim === 'lie') fail(tag + ': shown while lying in bed');
        const bb = m.geometry.boundingBox, sz = bb.getSize(new V()), ws = m.getWorldScale(new V()), long = Math.max(sz.x * ws.x, sz.y * ws.y, sz.z * ws.z);
        if (Math.abs(ws.x - 1) > 0.03 || Math.abs(ws.y - 1) > 0.03 || Math.abs(ws.z - 1) > 0.03) fail(tag + ': drawn at scale ' + ws.toArray().map(v => v.toFixed(2)).join('/') + ', not its true size');
        if (long > HP_SIZE[u.kind] * 1.03 || long < HP_SIZE[u.kind] * 0.4) fail(tag + ': ' + long.toFixed(2) + ' m long, the true size is at most ' + HP_SIZE[u.kind] + ' m');
        if (u.holding && u.kind !== 'lute') { const hb = H.root.getObjectByName(u.hand === 'L' ? 'hand_l' : 'hand_r'), palm = hb.localToWorld(new V(0, 0.07, -0.015)), g = m.localToWorld(new V(...u.grip)); let d = g.distanceTo(palm);
          if (/spear|staff|rod/.test(u.kind)) { const ax = new V(0, 1, 0).transformDirection(m.matrixWorld), o = m.localToWorld(new V(0, 0, 0)); d = palm.clone().sub(o).cross(ax).length(); }      // a pole: the palm is on the shaft, anywhere along it
          if (d > 0.05) fail(tag + ': ' + (d * 100).toFixed(0) + ' cm from the palm that holds it'); }
        const ax = sz.y >= sz.x ? 'y' : 'x', lo = bb.min[ax], hi = bb.max[ax], cen = bb.getCenter(new V()), tor = [wp('spine_01'), wp('neck_01')], arms = ['r', 'l'].map(s => [wp('lowerarm_' + s), wp('hand_' + s)]);
        for (let i = 0; i <= 16; i++) { const q = cen.clone(); q[ax] = lo + (hi - lo) * i / 16; if (u.kind === 'lute') q.z = 0.01; if (u.kind === 'mug') break; const w = m.localToWorld(q);
          if (seg(w, tor[0], tor[1]) < 0.09) { fail(tag + ': inside the torso'); break; }
          if (arms.some(ar => seg(w, ar[0], ar[1]) < 0.035 && w.distanceTo(ar[1]) > 0.13)) { fail(tag + ': through a forearm'); break; } } } }
    n.talking = false; } }
go(null); return out;
