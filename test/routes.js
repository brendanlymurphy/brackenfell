// Walks every route in World.routes (73h_routes.js, 73i_walls.js) with the scripted player, up and back down: through each way point in turn, walking, and a sprint pass.
// Fails (throws) when the player gets stuck, falls more than 0.7 m under the way point's height, or ends far from the last point.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/routes.js)"      (window.__routeOnly = 'id' for one)
const dt = 1 / 30, fails = [], rows = [], only = window.__routeOnly;
const fix = () => { const r = RPG.st(); r.sta = 100; r.hp = 100; RPG.dead = false; };
function put(p) { __game.tp(p[0], p[2], 0, 0, p[1]); Input.keys = {}; Input.joy = null; Player.vel = [0, 0, 0]; Player.camY = Player.pos[1]; fix(); __game.step(2, dt); Player.pos[1] = p[1]; }
function walk(id, pts, sprint) {
  put(pts[0]); const tag = id + (sprint ? ' sprint' : ' walk') + ' ' + (pts[0][1] < pts[pts.length - 1][1] ? 'up' : 'down'); let f = 0, bad = null;
  for (let k = 1; k < pts.length && !bad; k++) {
    const g = pts[k]; let win = [];
    for (let i = 0; i < 420; i++, f++) {
      const P = Player, dx = g[0] - P.pos[0], dz = g[2] - P.pos[2], d = Math.hypot(dx, dz);
      if (d < 0.5) break;
      Input.keys = { KeyW: true }; if (sprint) Input.keys.ShiftLeft = true; P.yaw = Math.atan2(dx, -dz); fix(); __game.step(1, dt);
      if (P.pos[1] < Math.min(g[1], pts[k - 1][1]) - 0.7) { bad = 'fell to y ' + P.pos[1].toFixed(2) + ' near ' + P.pos[0].toFixed(1) + ',' + P.pos[2].toFixed(1) + ' going to point ' + k; break; }
      win.push(d); if (win.length > 40) { if (win[0] - d < 0.2) { bad = 'stuck at ' + P.pos.map(q => +q.toFixed(2)).join(',') + ' going to point ' + k + ' (' + g.join(',') + ')'; break; } win.shift(); }
      if (i === 419) bad = 'never arrived at point ' + k;
    }
  }
  const e = pts[pts.length - 1]; if (!bad && Math.abs(Player.pos[1] - e[1]) > 0.8) bad = 'ended at y ' + Player.pos[1].toFixed(2) + ' not ' + e[1].toFixed(2);
  Input.keys = {}; if (bad) fails.push(tag + ': ' + bad); rows.push({ t: tag, f, ok: !bad });
}
for (const r of World.routes) { if (only && r.id !== only) continue; walk(r.id, r.pts, false); walk(r.id, r.pts.slice().reverse(), false); walk(r.id, r.pts, true); }
const summary = { routes: World.routes.map(r => r.id), runs: rows.length, ok: rows.filter(r => r.ok).length, fails: fails.slice(0, 8) };
if (!only && rows.length < 3) fails.push('only ' + rows.length + ' route runs were made');       /* [cast] never pass on nothing */
if (fails.length) throw new Error('ROUTES FAIL ' + JSON.stringify(summary));
return 'routes PASS ' + JSON.stringify(summary);
