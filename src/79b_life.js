// ───────────────────────── life in the wilds: six people at their work, and things moving in the air ─────────────────────────
// The folk stand where they work (no walking, so no nav cost), are not drawn beyond 50 m, do not exist on the low tier and say one line when you come near.
// Wildlife and weather are particles put through the air system's `put` (75b_air.js): raptors, crows, ducks, fish rings, butterflies, moths, fireflies, mist, leaves.
const WF = { list: [], ready: false, acc: 0 };
const WF_DEFS = [
  { id: 'bram', place: 'lumber', at: [4.4, -3.4], yaw: 0.6, anim: 'work', name: 'a woodcutter', say: ['Mind the sleds, they run on their own.', 'Axe is on the block if you need one. Bring it back.'] },
  { id: 'ivo', place: 'blind', at: [2.6, 2.6], yaw: 2.6, anim: 'idle', name: 'a hunter', say: ['Quiet. The does come at dusk.', 'You walk like a bell. Stand still a while.'] },
  { id: 'hilda', place: 'bee', at: [1.4, 0.2], yaw: 0.3, anim: 'idle', name: 'a beekeeper', say: ['Slow hands, and they will not mind you.', 'The sunwort is for Maren, I expect. Take it.'] },
  { id: 'finn', place: 'fishing', at: [-1.2, 3.6], yaw: 2.9, anim: 'fish', name: 'a fisherman', say: ['Nothing biting. There never is when someone watches.', 'The smoked trout is fair pay for a hand with the nets.'] },
  { id: 'rowan', place: 'hermit', at: [4.2, 7.2], yaw: -0.8, anim: 'idle', name: 'the hermit', say: ['I am not hiding. The valley is simply loud.', 'Take the bogbean if you must. It grows back.'] },
  { id: 'osric', place: 'hamlet', at: [-3.2, 2.4], yaw: 1.2, anim: 'idle', name: 'a shepherd', say: ['Highfold has four doors and one opinion.', 'The wedding is on. Everyone is at the Reeve’s.'] },
];
function wildsLifeBuild() {
  if (!G.chars || !Chars.ready || (TEST && TEST.amb === 0) || (R.q && R.qName === 'low')) return;
  for (const def of WF_DEFS) {
    const p = WILDS.P[def.place]; if (!p) continue; let ch = null;
    try { ch = Chars.spawn({ id: def.id }); ch.pivot.traverse(o => { o.layers.set(1); }); } catch (e) { console.warn('wild folk ' + def.id + ': ' + (e && e.message || e)); continue; }
    const q = siteToWorld(p, def.at[0], def.at[1]); let pos = [q[0], World.groundY(q[0], q[1]), q[1]];
    if (def.place === 'fishing' && p.jetty) pos = [p.jetty.end[0], p.jetty.end[1], p.jetty.end[2]];
    WF.list.push({ def, ch, pos, yaw: def.yaw, look: [0, 0], t: Math.random() * 9, greet: -99, n: 0, shown: true });
  }
  WF.ready = WF.list.length > 0;
}
function wfUpdate(dt, pp) {
  if (!WF.ready) return; const hr = Env.hour, day = hr > 7.5 && hr < 18.5 && !World.indoor, lowTier = !(R.q && R.q.scatter);
  for (const a of WF.list) {
    const d = hyp(a.pos[0] - pp[0], a.pos[2] - pp[2]), on = day && !lowTier && d < 50;
    if (!on) { if (a.shown) { a.shown = false; Chars.update(a.ch, { pos: a.pos, yaw: a.yaw, anim: 'idle', scale: 1, zone: 0, light: 1, visible: false, cast: false, look: a.look, speed: 0 }, 0); } continue; }
    a.shown = true; a.t += dt;
    let lx = 0; if (d < 5) { const q = angDiff(Math.atan2(pp[0] - a.pos[0], -(pp[2] - a.pos[2])), a.yaw); if (Math.abs(q) < 1.9) lx = clamp(-q, -1, 1); }
    a.look[0] += (lx - a.look[0]) * Math.min(1, dt * 5);
    if (d < 2.6 && a.t - a.greet > 60 && !UI.talk && typeof toast === 'function') { a.greet = a.t; toast(a.def.name.charAt(0).toUpperCase() + a.def.name.slice(1) + ': “' + a.def.say[a.n++ % a.def.say.length] + '”'); }
    Chars.update(a.ch, { pos: a.pos, yaw: a.yaw, anim: a.def.anim, scale: 1, zone: 0, light: 1, visible: true, cast: d < R.q.villagerCast, look: a.look, talking: false, speed: 0 }, dt);
  }
}
if (typeof ambUpdate === 'function') { const _au = ambUpdate; ambUpdate = function (dt, pp) { _au(dt, pp); wfUpdate(dt, pp); }; }

// ── in the air ──
const _air = typeof airUpdate === 'function' ? airUpdate : null;
if (_air) airUpdate = function (put, dt, time, env, cam) {
  _air(put, dt, time, env, cam);
  if (!WILDS.on || World.indoor || (TEST && TEST.air === 0)) return;
  const day = env.day, night = env.night, hr = Env.hour, low = !(R.q && R.q.scatter), near = (p, r) => hyp(p.x - cam[0], p.z - cam[2]) < r;
  const P = WILDS.P, wx = env.windDir[0] * env.windStrength, wz = env.windDir[1] * env.windStrength;
  // raptors turning over the stones and the battlefield, crows at the field, ducks and fish rings on the lake, a heron-ish dark bird at the pool
  if (day > 0.2 && !low) {
    for (const [id, n, h, rad, sp] of [['stones', 2, 38, 16, 0.12], ['battle', 1, 30, 20, 0.1]]) { const p = P[id]; if (!p || !near(p, 140)) continue; for (let i = 0; i < n; i++) { const a = time * sp + i * 3.1, fl = Math.sin(time * 1.3 + i * 2) * 0.25; put(p.x + Math.cos(a) * rad, h + Math.sin(time * 0.2 + i) * 3, p.z + Math.sin(a) * rad, 0.7, 0.1, 0.09, 0.08, 0.85 * Math.min(1, day * 2), Math.atan2(-Math.sin(a), Math.cos(a)) + 1.57, 1, 3.4 + fl, i + 7); } }
    const b = P.battle; if (b && near(b, 70)) for (let i = 0; i < 6; i++) { const k = time * 0.5 + i * 1.9, hop = Math.max(0, Math.sin(k * 3)) * 0.08; put(b.x - 3 + Math.cos(i * 2.1) * 9, Terrain.y(b.x - 3 + Math.cos(i * 2.1) * 9, b.z + Math.sin(i * 2.1) * 9) + 0.14 + hop, b.z + Math.sin(i * 2.1) * 9, 0.17, 0.03, 0.03, 0.035, 0.9, 0, 1, 1.5, i); }
    const f = P.fishing; if (f && near(f, 90)) { for (let i = 0; i < 3; i++) { const a = time * 0.03 + i * 2.2, x = LAKE.x + Math.cos(a + 1) * 20 + i * 3, z = LAKE.z - 18 + Math.sin(a * 2 + i) * 6; put(x, LAKE.y + 0.12, z, 0.34, 0.14, 0.12, 0.1, 0.9, 0.5, 1, 3.0, i + 2); put(x + 0.4, LAKE.y + 0.1, z + 0.1, 0.18, 0.1, 0.09, 0.08, 0.9, 0.2, 1, 1.8, i + 5); }
      for (let i = 0; i < 3; i++) { const ph = (time * 0.35 + i * 0.37 + (f.x * 0.01)) % 1, x = f.x + (i - 1) * 3 + Math.sin(i * 4 + 1) * 5, z = f.z - 16 - i * 4; put(x, LAKE.y + 0.04, z, 0.2 + ph * 1.1, 0.7, 0.75, 0.78, 0.5 * (1 - ph), 0, 1, 1.0, i + 11); } }
  }
  // butterflies over the bee meadow and the hamlet's green by day, moths and fireflies at dusk by the pool, the hermit's hut, the meadow and the stones
  if (!low) {
    if (day > 0.4) for (const id of ['bee', 'hamlet']) { const p = P[id]; if (!p || !near(p, 60)) continue; for (let i = 0; i < 7; i++) { const a = time * (0.25 + i * 0.03) + i * 1.7, x = p.x + Math.cos(a) * (3 + i * 0.9) + Math.sin(time * 1.7 + i) * 0.6, z = p.z + Math.sin(a * 1.2) * (3 + i * 0.8), y = Terrain.y(x, z) + 1.0 + Math.sin(time * 2.1 + i * 3) * 0.4, fl = Math.sin(time * 14 + i * 5); put(x, y, z, 0.11, i % 2 ? 0.95 : 0.9, i % 2 ? 0.8 : 0.55, i % 2 ? 0.2 : 0.2, 0.9, time + i, 1, 1.0 + fl * 0.5, i); } }
    const dusk = sat((hr - 17.6) / 1.2) * (hr < 21.5 ? 1 : 0) + night * 0.8;
    if (dusk > 0.05) for (const id of ['hermit', 'bee', 'stones', 'burnt']) { const p = P[id]; if (!p || !near(p, 45)) continue; for (let i = 0; i < 9; i++) { const a = time * 0.2 + i * 2.4, x = p.x + Math.cos(a * 0.8 + i) * (4 + i), z = p.z + Math.sin(a * 0.9 + i * 2) * (4 + i * 0.8), y = Terrain.y(x, z) + 0.9 + Math.sin(time * 0.9 + i * 4) * 0.7, tw = 0.4 + 0.6 * Math.max(0, Math.sin(time * 1.1 + i * 7)); put(x, y, z, 0.05, 0.75, 0.95, 0.4, dusk * tw * 0.9, 0, 3, 1, i + 20); } }
  }
  // the fall: white streaks sliding down the face, spray and a standing cloud at its foot
  if (WB.fall && WILDS.pool && near(WB.fall, 90)) { const f = WB.fall, q = WILDS.pool, n = low ? 4 : 9;
    for (let i = 0; i < n; i++) { const k = (time * 0.55 + i / n) % 1, y = f.top - k * (f.top - q.y), x = f.x + Math.sin(i * 7.1) * 0.7, z = f.z - 0.5 + k * 0.1; put(x, y, z + 0.3, 0.22, 0.92, 0.95, 0.98, 0.35 * (1 - k * 0.4), 0, 1, 2.6, i + 80); }
    for (let i = 0; i < (low ? 3 : 7); i++) { const k = (time * 0.4 + i * 0.19) % 1; put(f.x + Math.sin(i * 3.7) * 1.6, q.y + 0.4 + k * 1.6, f.z - 3.4 + Math.cos(i * 2.9) * 1.3, 1.2 + k * 1.8, 0.9, 0.93, 0.96, 0.22 * (1 - k), i, 1, 1.0, i + 90); } }
  // mist lying on the pool, the brook and the lake shore at dawn and dusk; leaves blown through the lumber camp and the hermit's glade
  const mistK = Math.max(sat(1 - Math.abs(hr - 6.2) / 2.2), sat(1 - Math.abs(hr - 19.2) / 1.8)) * 0.7 + (env.fog ? 0 : 0);
  if (mistK > 0.05 && !low) {
    const q = WILDS.pool; if (q && near(q, 70)) for (let i = 0; i < 10; i++) { const a = i * 0.63 + time * 0.03, r = q.r * (0.3 + 0.9 * ((i * 37) % 10) / 10), x = q.x + Math.cos(a) * r, z = q.z + Math.sin(a) * r; put(x + Math.sin(time * 0.1 + i) * 0.8, q.y + 0.5 + (i % 3) * 0.25, z, 3.2, 0.78, 0.8, 0.82, mistK * 0.13, i, 1, 1.0, i + 30); }
    if (WILDS.brookLine && near({ x: -160, z: 0 }, 70)) for (let i = 0; i < 8; i++) { const s = (i + 0.5) / 8 * WILDS.brookLine.len, p = WILDS.brookLine.point(s); put(p[0] + Math.sin(time * 0.1 + i) * 1.0, wildsBrookY(s) + 0.45, p[1], 2.6, 0.78, 0.8, 0.82, mistK * 0.1, i * 2, 1, 1.0, i + 50); }
    for (let i = 0; i < 6; i++) { const a = i * 1.1 + 0.4, x = LAKE.x + Math.cos(a) * (LAKE.r - 3 + (i % 2) * 6), z = LAKE.z + Math.sin(a) * (LAKE.r - 3 + (i % 2) * 6); if (hyp(x - cam[0], z - cam[2]) < 80) put(x, LAKE.y + 0.5, z, 5, 0.78, 0.8, 0.82, mistK * 0.08, i, 1, 1.0, i + 60); }
  }
  for (const [id, n] of [['lumber', 6], ['hermit', 5]]) { const p = P[id]; if (!p || !near(p, 40) || low) continue; for (let i = 0; i < n; i++) { const k = (time * 0.12 + i / n) % 1, x = p.x - 8 + k * 16 + Math.sin(time * 1.3 + i * 3) * 1.2, z = p.z + Math.sin(i * 2.7) * 7 + Math.cos(time * 0.9 + i) * 0.9, y = Terrain.y(x, z) + 0.4 + Math.abs(Math.sin(time * 2 + i * 5)) * 0.9 + (1 - k) * 0.5; put(x + wx * 0.1, y, z + wz * 0.1, 0.09, i % 2 ? 0.55 : 0.62, i % 2 ? 0.4 : 0.32, 0.12, 0.8, time * 2 + i, 1, 1.0 + Math.sin(time * 5 + i) * 0.4, i + 70); } }
};
