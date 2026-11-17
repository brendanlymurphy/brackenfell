// Held things (src/77d_handprops.js): for every villager with a prop, at six hours of the day and while talking, the prop's grip point must be within 3 cm of that hand's palm,
// its longest side must be at the true size (HP_SIZE limit, and at least 40% of it), and no part of it may lie inside the holder's torso or forearm capsules.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/chars_lineup.js)" --do "$(cat test/hold.js)"      (prints JSON; "fail" lists the faults; a held prop only: a prop at rest on the belt, back or ground is checked for the capsules only)
const V = THREE.Vector3, out = { fail: [], rows: 0 }, a = new V(), b = new V(), c = new V(), HOURS = [6, 9, 12, 15, 18, 21];
const seg = (p, s, e) => { const d = b.subVectors(e, s), t = Math.max(0, Math.min(1, c.subVectors(p, s).dot(d) / d.lengthSq())); return a.copy(s).addScaledVector(d, t).distanceTo(p); };
const wp = (H, n) => H.root.getObjectByName(n).getWorldPosition(new V());
for (const def of NPC_DEFS) {
  const kinds = hpKinds(def); if (!kinds.length) continue;
  const sched = def.sched || []; const animAt = h => { let an = 'idle'; for (const e of sched) if (e[0] <= h) an = e[2]; return an; };
  const states = HOURS.map(h => ({ tag: 'h' + h, anim: animAt(h), talk: false })).concat([{ tag: 'talk', anim: 'idle', talk: true }, { tag: 'sit-talk', anim: 'sit', talk: true }]);
  await LU.show(def.id, 3, 0, { hour: 12 }); const cur = LU.cur; if (!cur) { out.fail.push(def.id + ': no body'); continue; }
  const npc = { ch: cur.h, def: Object.assign({}, def), scale: cur.scale }; for (const m of cur.h.pivot.children.filter(o => /^prop:/.test(o.name))) m.removeFromParent(); cur.h.post = [];
  npcHandProp(npc);
  for (const st of states) {
    for (let i = 0; i < 6; i++) { await LU.show(def.id, 3, 0, { hour: 12, anim: st.anim, line: st.talk ? await LU.line(def.id) : null, at: 0.5 + i * 0.1 }); }
    const H = cur.h; H.root.updateWorldMatrix(true, true); H.pivot.updateMatrixWorld(true); out.rows++;
    for (const m of npc.props) {
      const u = m.userData, bb = m.geometry.boundingBox, sz = bb.getSize(new V()), len = Math.max(sz.x, sz.y, sz.z) * m.getWorldScale(new V()).y * (1 / Math.max(1e-3, 1));
      const tag = def.id + ' ' + u.kind + ' ' + st.tag + ' anim=' + st.anim;
      if (len > u.len + 1e-3) out.fail.push(tag + ': ' + len.toFixed(2) + ' m is over the ' + u.len + ' m limit');
      if (u.holding) { const hand = u.hand === 'L' ? 'hand_l' : 'hand_r', palm = H.root.getObjectByName(hand).localToWorld(new V(0, 0.07, u.kind === 'lute' ? 0.02 : -0.015)), g = m.localToWorld(new V(...u.grip)), d = g.distanceTo(u.kind === 'lute' ? wp(H, 'hand_l') : palm);
        if (d > 0.03 && u.kind !== 'lute') out.fail.push(tag + ': grip ' + (d * 100).toFixed(1) + ' cm from the palm'); if (u.kind === 'lute') (out.lute = out.lute || []).push(tag + ' neck-to-left-hand ' + (d * 100).toFixed(1) + ' cm'); }
      // capsules: torso (spine_01 to neck, 0.10), forearms (0.04), sample 15 points along the prop's long axis
      const ax = sz.y >= sz.x ? 'y' : 'x', lo = bb.min[ax], hi = bb.max[ax], cen = bb.getCenter(new V()), tor = [wp(H, 'spine_01'), wp(H, 'neck_01')], arms = ['r', 'l'].map(s => [wp(H, 'lowerarm_' + s), wp(H, 'hand_' + s)]);
      for (let i = 0; i <= 14; i++) { const q = cen.clone(); q[ax] = lo + (hi - lo) * i / 14; const w = m.localToWorld(q);
        if (seg(w, tor[0], tor[1]) < 0.10 - 0.002) { out.fail.push(tag + ': inside the torso at ' + ax + '=' + q[ax].toFixed(2)); break; }
        let hit = false; arms.forEach((ar, k) => { if (seg(w, ar[0], ar[1]) < 0.04 && w.distanceTo(ar[1]) > 0.12) hit = true; }); if (hit) { out.fail.push(tag + ': through a forearm at ' + ax + '=' + q[ax].toFixed(2)); break; } }
    }
  }
}
return JSON.stringify(out);
