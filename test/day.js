const out = { bad: [], walk: {}, arrive: {} };
Env.hour = 5; npcSnapAll(); Env.dayLength = 720;
__game.tp(0, 0, 0);
let maxWalk = {};
for (let i = 0; i < 7400; i++) {
  __game.step(1, 0.1);
  if (i % 50 === 0) for (const n of NPCS) {
    if (!isFinite(n.pos[0] + n.pos[1] + n.pos[2] + n.yaw)) out.bad.push(n.id + '@' + Env.hour.toFixed(1));
    if (n.path) out.walk[n.id] = (out.walk[n.id] || 0) + 1;
    const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 1.0);
    if (n.anim !== 'lie' && n.anim !== 'sit' && Math.abs(gy - n.pos[1]) > 0.7) { const k = n.id + ':' + n.at + ':' + (gy - n.pos[1]).toFixed(1); if (!out.bad.includes(k) && out.bad.length < 25) out.bad.push(k); }
  }
}
out.hour = +Env.hour.toFixed(2);
out.where = NPCS.map(n => n.id + '=' + (n.at || 'walking') + '/' + n.anim).join(' ');
return out;
