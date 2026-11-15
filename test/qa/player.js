// Player checks (needs --opt play=1): from random walkable spots walk 10 s in 8 directions by scripted keys. Reports: wedged (stuck 2 s and then neither sideways try moves), fell through,
// ended above 1.8 m with no stairs, walked on water deeper than 1.3 m. QA.player(nSpots, secs, seed) -> { defects, stats }
window.QA.player = (nSpots, secs, seed) => {
  nSpots = nSpots || 40; secs = secs || 10; const D = [], P = Player, dt = 1 / 30, stats = { spots: nSpots, runs: 0 };
  let s = (seed || 12345) >>> 0; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const fix = () => { const r = RPG.st(); r.sta = 100; r.hp = 100; RPG.dead = false; RPG.iframes = 5; };
  const push = (k, p, d, extra) => D.push(Object.assign({ k, area: QA.areaAt(p[0], p[2]), x: +p[0].toFixed(1), y: +p[1].toFixed(1), z: +p[2].toFixed(1), d, n: 1 }, extra || {}));
  const spots = []; let g = 0;
  while (spots.length < nSpots && g++ < 6000) {
    const far = spots.length >= Math.ceil(nSpots * 0.6), r = far ? 70 + rnd() * 100 : rnd() * 70, a = rnd() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (World.waterAt(x, z) > -900 || World.blockedAt(x, z, 0.5) || Terrain.y(x, z) > 60) continue; let ok = true; for (const f of World.floors) if (f.y > -100 && Math.abs(f.x - x) < 6 && Math.abs(f.z - z) < 6 && floorHeight(f, x, z) !== null) ok = false; if (!ok) continue; if (Cells.at(x, 0, z)) continue; spots.push([x, z]);
  }
  // a third of the spots sit beside an outdoor collider (where things stick), a few on raised decks
  const cols = World.colliders.filter(c => c.y0 > -100 && c.x < 190 && c.y1 - c.y0 > 0.5 && Math.hypot(c.x, c.z) < 120), decks = World.floors.filter(f => f.y > -100 && f.x < 190 && f.y > Terrain.y(f.x, f.z) + 0.2 && Math.min(f.hx, f.hz) > 0.5);
  const ys = new Map();
  for (let i = 0, k = 0; i < Math.floor(nSpots / 3) && k++ < 4000;) { const c = cols[Math.floor(rnd() * cols.length)], a = rnd() * TAU, e = (c.r !== undefined ? c.r : Math.max(c.hx, c.hz)) + 0.6 + rnd() * 0.8, x = c.x + Math.cos(a) * e, z = c.z + Math.sin(a) * e; if (World.waterAt(x, z) > -900 || World.blockedAt(x, z, 0.4) || Cells.at(x, 0, z)) continue; spots[i++] = [x, z]; }
  for (let i = 0; i < Math.min(6, decks.length); i++) { const f = decks[Math.floor(rnd() * decks.length)]; spots.push([f.x, f.z]); ys.set(f.x + ',' + f.z, f.y + 0.05); }
  const place = (x, z, yaw) => { __game.tp(x, z, yaw * 180 / PI, 0, ys.get(x + ',' + z) !== undefined ? ys.get(x + ',' + z) : Terrain.y(x, z) + 0.05); Input.keys = {}; Input.joy = null; P.vel = [0, 0, 0]; P.camY = P.pos[1]; fix(); __game.step(2, dt); };
  const hold = (n, yaw) => { P.yaw = yaw; Input.keys = { KeyW: true }; for (let i = 0; i < n; i++) { fix(); __game.step(1, dt); } };
  for (const [x, z] of spots) for (let d = 0; d < 8; d++) {
    const yaw = d * PI / 4; place(x, z, yaw); stats.runs++; let last = P.pos.slice(), still = 0, flagged = false;
    for (let t = 0; t < secs * 5; t++) {                                      // 0.2 s per slice
      P.yaw = yaw; Input.keys = { KeyW: true }; for (let i = 0; i < 6; i++) { fix(); __game.step(1, dt); }
      const gy = Terrain.y(P.pos[0], P.pos[2]), wet = World.waterAt(P.pos[0], P.pos[2]);
      if (P.pos[1] < gy - 1.3 && wet < -900) { push('fall', P.pos, 'fell through the ground heading ' + d * 45 + ' deg from ' + x.toFixed(1) + ',' + z.toFixed(1)); flagged = true; break; }
      if (P.pos[1] - gy > 1.8 && !World.floors.some(f => { const h = floorHeight(f, P.pos[0], P.pos[2]); return h !== null && Math.abs(h - P.pos[1]) < 0.3; }) && !World.stairs.some(st => hyp((st.x || 0) - P.pos[0], (st.z || 0) - P.pos[2]) < 8)) { push('climb', P.pos, 'ended ' + (P.pos[1] - gy).toFixed(1) + ' m above the ground with no stairs near, heading ' + d * 45 + ' deg from ' + x.toFixed(1) + ',' + z.toFixed(1)); flagged = true; break; }
      if (wet > -900 && wet - Terrain.y(P.pos[0], P.pos[2]) > 1.3 && P.pos[1] > wet - 0.3) { push('onwater', P.pos, 'stands on water ' + (wet - Terrain.y(P.pos[0], P.pos[2])).toFixed(1) + ' m deep'); flagged = true; break; }
      if (t % 10 === 9) { const m = hyp(P.pos[0] - last[0], P.pos[2] - last[2]); if (m < 0.3) { still++; } else still = 0; last = P.pos.slice();
        if (still >= 1) {                                                      // stuck for 2 s: can it move sideways?
          const p0 = P.pos.slice(); hold(15, yaw + PI / 2); const m1 = hyp(P.pos[0] - p0[0], P.pos[2] - p0[2]); const p1 = P.pos.slice(); hold(15, yaw - PI / 2); const m2 = hyp(P.pos[0] - p1[0], P.pos[2] - p1[2]); hold(15, yaw + PI);
          if (m1 < 0.25 && m2 < 0.25 && hyp(P.pos[0] - p1[0], P.pos[2] - p1[2]) < 0.25) { push('wedged', p0, 'wedged: heading ' + d * 45 + ' deg from ' + x.toFixed(1) + ',' + z.toFixed(1) + ' no way out sideways or back'); flagged = true; } break; } }
    }
    Input.keys = {};
  }
  return { defects: D, stats };
};
