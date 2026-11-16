// Foot sliding: follows every villager that is walking for a few seconds and measures how fast a foot moves over the ground while it is planted
// (the lowest fifth of its height range; measured at the ball of the foot, which stays down longest). 0 = planted feet stay put. Run: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/feet.js)"
Env.hour = window.__hr || 8.2; npcSnapAll(); const dt = 1 / 30, T = {}, P = new THREE.Vector3();
for (let i = 0; i < 30 * 14; i++) {
  game.step(1, dt);
  for (const n of NPCS) { if (!n.ch || !n.ch.pivot.visible) continue; const walking = n.ch.curName === 'walk' || n.anim === 'walk';
    for (const f of ['footL', 'footR']) { const b = n.ch.skeleton.bones.find(q => q.name === (f === 'footL' ? 'ball_l' : 'ball_r')) || n.ch.bones[f]; if (!b) continue; b.getWorldPosition(P); const k = n.id + f, t = T[k] || (T[k] = { s: [], last: null });
      if (walking && t.last) t.s.push([P.y - n.pos[1], Math.hypot(P.x - t.last[0], P.z - t.last[2]) / dt, n.speedNow || 0]); t.last = walking ? [P.x, P.y, P.z] : null; } }
}
const out = [];
for (const k in T) { const s = T[k].s; if (s.length < 60) continue; const ys = s.map(v => v[0]).sort((a, b) => a - b), lo = ys[0], hi = ys[ys.length - 1], cut = lo + (hi - lo) * 0.2, st = s.filter(v => v[0] <= cut).map(v => v[1]);
  const mean = st.reduce((a, b) => a + b, 0) / st.length, all = s.reduce((a, b) => a + b[1], 0) / s.length; out.push([k, 'planted ' + mean.toFixed(2) + ' m/s', 'mean ' + all.toFixed(2), 'n ' + s.length, 'rate ' + (NPCS.find(n => k.startsWith(n.id)).ch.cur ? NPCS.find(n => k.startsWith(n.id)).ch.cur.getEffectiveTimeScale().toFixed(2) : '?')].join(' ')); }
const vals = out.map(o => +o.split(' ')[2]); return { walkers: out.length, meanSlide: vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3) : null, worst: out.sort((a, b) => +b.split(' ')[2] - +a.split(' ')[2]).slice(0, 8) };
