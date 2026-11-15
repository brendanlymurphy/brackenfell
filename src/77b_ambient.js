// ───────────────────────── ambient villagers: a handful of unnamed people who fill the streets by day ─────────────────────────
// Six people with bodies the village already owns (Chars, 'real' set). They have no dialogue beyond a one-line greeting, walk the existing nav
// graph between the square, the alley stalls, the well and the benches, stand in pairs to talk, browse stalls, and walk home at dusk (they
// disappear at the door). They are skipped on the low tier, fully asleep beyond 50 m (logic at 2 Hz, not drawn) and cost one skinned mesh each.
const AMB = { list: [], ready: false, acc: 0, greeted: 0 };
const AMB_DEFS = [
  { id: 'bram', name: 'a farmhand', home: 'amb.home0' },
  { id: 'hilda', name: 'a weaver', home: 'amb.home1' },
  { id: 'finn', name: 'a fisherman', home: 'amb.home2' },
  { id: 'greta', name: 'a villager', home: 'amb.home0' },
  { id: 'edda', name: 'a farmer’s wife', home: 'amb.home3' },
  { id: 'lark', name: 'a youth', home: 'amb.home1' },
];
// places they like: stall fronts, the well, benches, the alley. Pairs stand opposite one another.
function ambSpots() {
  const s = (n, x, z, yaw) => { World.spots[n] = { p: [x, World.groundY(x, z), z], yaw, zone: 0 }; };
  // two chatting places: pairs of spots 1.1 m apart, facing
  for (const [k, x, z, a] of [[0, 5.0, -5.2, 0.6], [1, 40.5, 3.2, 0.1], [2, -8.5, 0.5, 1.2]]) {
    const dx = Math.cos(a) * 0.55, dz = Math.sin(a) * 0.55;
    s('amb.t' + k + 'a', x - dx, z - dz, Math.atan2(dx, -dz)); s('amb.t' + k + 'b', x + dx, z + dz, Math.atan2(-dx, dz));
  }
  // where each person goes in at dusk: just outside a cottage door
  ['elder', 'weaver', 'guardhouse', 'herbalist'].forEach((id, i) => { const h = World.houses[id], d = h && h.door; if (d) World.spots['amb.home' + i] = { p: [d.out[0], d.out[1], d.out[2]], yaw: 0, zone: 0 }; });
}
function buildAmbient() {
  if (!G.chars || !Chars.ready || (TEST && TEST.amb === 0)) return;
  AMB.list.length = 0;
  AMB_DEFS.forEach((def, i) => {
    let ch = null; try { ch = Chars.spawn({ id: def.id }); ch.pivot.traverse(o => { o.layers.set(1); }); } catch (e) { console.warn('ambient ' + def.id + ': ' + (e && e.message || e)); return; }
    AMB.list.push({ def, i, ch, pos: [0, 0, 0], yaw: 0, anim: 'idle', t: Math.random() * 10, path: null, pi: 0, at: null, goal: null, dwell: 0, state: 'away', next: 0, ang: null, look: [0, 0], seat: null, stops: null, talking: false, speed: 1.1 + Math.random() * 0.25 });
  });
  AMB.ready = AMB.list.length > 0;
}
const ambStops = () => {
  const list = ['square.well', 'square.bench2', 'alley.n', 'alley.s'];
  for (let k = 0; k < 8; k++) if (World.spots['dstall' + k]) list.push('dstall' + k);
  return list.filter(n => Nav.spot[n] !== undefined);
};
function ambGo(a, spot) {
  const from = a.path ? a.path[Math.min(a.pi, a.path.length - 1)] : Nav.spot[a.at], to = Nav.spot[spot];
  if (to === undefined) return false;
  const path = from !== undefined ? navPath(from, to) : null;
  a.goal = spot; if (path && path.length > 1) { a.path = path; a.pi = 1; a.at = null; return true; }
  ambArrive(a, spot); return true;
}
function ambArrive(a, spot) { const sp = World.spots[spot]; a.path = null; a.at = spot; if (sp) { a.pos = sp.p.slice(); a.yaw = sp.yaw; } a.anim = 'idle'; a.dwell = 6 + Math.random() * 14; a.state = 'stand'; }
function ambDecide(a, hr) {
  if (hr >= 18.5 || hr < 7.5) { if (a.state !== 'home' && a.state !== 'away') { if (a.state !== 'going-home') { a.state = 'going-home'; if (!ambGo(a, a.def.home)) a.state = 'away'; } } return; }
  if (a.state === 'away' || a.state === 'home') {         // morning: come out of the door
    const hs = World.spots[a.def.home]; if (!hs) return; a.pos = hs.p.slice(); a.at = a.def.home; a.state = 'stand'; a.dwell = 1 + a.i * 2.3; a.anim = 'idle';
  }
  if (a.state === 'stand' && a.dwell <= 0) {
    const r = Math.random();
    if (r < 0.32) { const k = (a.i >> 1) % 3, side = a.i & 1 ? 'b' : 'a', n = 'amb.t' + k + side; if (Nav.spot[n] !== undefined) { ambGo(a, n); a.state = 'walk'; a.talkAfter = true; return; } }
    const L = ambStops(); if (L.length) { ambGo(a, L[Math.floor(Math.random() * L.length)]); a.state = 'walk'; a.talkAfter = false; }
  }
}
function ambUpdate(dt, playerPos) {
  if (!AMB.ready) return;
  const on = !!(R.q && R.q.scatter) && !World.indoor, hr = Env.hour;
  AMB.acc += dt;
  for (const a of AMB.list) {
    const d = hyp(a.pos[0] - playerPos[0], a.pos[2] - playerPos[2]), far = d > 50;
    let step = dt; if (far) { if (AMB.acc < 0.5) continue; step = AMB.acc; }
    a.t += step; a.dwell -= step;
    ambDecide(a, hr);
    if (a.path) {
      const N2 = Nav.nodes[a.path[a.pi]], dx = N2[0] - a.pos[0], dz = N2[2] - a.pos[2], dd = hyp(dx, dz), blocked = d < 0.8 && (playerPos[0] - a.pos[0]) * dx + (playerPos[2] - a.pos[2]) * dz > 0;
      if (dd < 0.2) { a.pi++; if (a.pi >= a.path.length) { if (a.state === 'going-home') { a.path = null; a.state = 'home'; } else { ambArrive(a, a.goal); if (a.talkAfter) { a.dwell = 14 + Math.random() * 20; a.anim = 'talk'; } } } }
      else if (!blocked) {
        const st = Math.min(dd, a.speed * step); a.pos[0] += dx / dd * st; a.pos[2] += dz / dd * st;
        a.pos[1] += (World.groundAt(a.pos[0], a.pos[2], a.pos[1] + 0.6) - a.pos[1]) * Math.min(1, step * 6);
        a.yaw += angDiff(Math.atan2(dx, -dz), a.yaw) * Math.min(1, step * 8); a.anim = 'walk';
      } else a.anim = 'idle';
    }
    if (a.state === 'stand' && a.anim !== 'talk' && a.anim !== 'idle') a.anim = 'idle';
    if (!on || a.state === 'away' || a.state === 'home' || far) { if (a.ch) Chars.update(a.ch, { pos: a.pos, yaw: a.yaw, anim: a.anim, scale: 1, zone: 0, light: 1, visible: false, cast: false, look: a.look, speed: 0 }, 0.0); continue; }
    // head follows the player when close; a greeting the first time one comes near
    let lx = 0; if (d < 4.5) { const q = angDiff(Math.atan2(playerPos[0] - a.pos[0], -(playerPos[2] - a.pos[2])), a.yaw); if (Math.abs(q) < 1.9) lx = clamp(-q, -1.0, 1.0); }
    a.look[0] += (lx - a.look[0]) * Math.min(1, dt * 5);
    if (d < 2.2 && a.t - (a.greet || -99) > 45 && typeof toast === 'function' && !UI.talk) { a.greet = a.t; if (hr > 7.5 && hr < 18.5) toast(a.def.name.charAt(0).toUpperCase() + a.def.name.slice(1) + ': “' + ['Morning.', 'Fine day.', 'Mind the carts.', 'Good day to you.', 'Well met.'][Math.floor(Math.random() * 5)] + '”'); }
    const zn = World.zoneAt(a.pos[0], a.pos[1] + 0.5, a.pos[2]);
    Chars.update(a.ch, { pos: a.pos, yaw: a.yaw, anim: a.anim, scale: 1, zone: zn, light: zn ? 0.34 : 1, visible: true, cast: d < R.q.villagerCast, look: a.look, talking: a.anim === 'talk', speed: a.anim === 'walk' ? a.speed : 0 }, dt);
  }
  if (AMB.acc >= 0.5) AMB.acc = 0;
}
