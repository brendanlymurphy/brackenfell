// Every hinged door leaf, watched for two minutes of game time at 10 h and 21 h, with the player in the Market Place and on the Hart's gallery: no leaf may flap.
// A leaf flaps when it changes open/shut more than three times in ten seconds, or reverses its swing more than four times in that time.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/doors.js)"     returns { flaps, table } and prints "doors PASS" or "doors FAIL n"
const dt = 1 / 30, flaps = [], table = [];
const spots = { market: [2, -3], gallery: [3, -16.4] };
for (const hour of [10, 21]) for (const where of ['market', 'gallery']) {
  Env.dayLength = 0; Env.hour = hour; const [x, z] = spots[where]; game.tp(x, z, 0); if (typeof npcSnapAll === 'function') npcSnapAll(); game.step(2, dt);
  const n = World.doors.length, prev = World.doors.map(d => d.open), dirs = World.doors.map(() => 0), ev = World.doors.map(() => []), rev = World.doors.map(() => []);
  const frames = Math.round(120 / dt);
  for (let f = 0; f < frames; f++) {
    game.step(1, dt); const t = f * dt;
    for (let i = 0; i < n; i++) { const o = World.doors[i].open, p = prev[i]; if (o !== p) { const s = o > p ? 1 : -1; if (dirs[i] && s !== dirs[i]) rev[i].push(t); dirs[i] = s; } if ((o > 0.5) !== (p > 0.5)) ev[i].push(t); prev[i] = o; }
  }
  const win = (a) => { let m = 0; for (let i = 0; i < a.length; i++) { let c = 0; for (let j = i; j < a.length && a[j] - a[i] < 10; j++) c++; if (c > m) m = c; } return m; };
  let bad = 0;
  for (let i = 0; i < n; i++) { const d = World.doors[i], e = win(ev[i]), r = win(rev[i]); if (e > 3 || r > 4) { bad++; flaps.push(hour + 'h ' + where + ': door at ' + d.c.map(v => +v.toFixed(1)).join(',') + ' (' + (d.site && d.site.id || d.site || '?') + ') changed state ' + e + ' times and reversed ' + r + ' times in ten seconds'); } }
  table.push(hour + 'h ' + where + ': ' + n + ' leaves, ' + bad + ' flapping');
}
// walking pass: the player moves (by position, 1.6 m/s) up the Hart's outside stair and along the gallery and back, then paces the 2.3 m edge of the inn door; same flap rule
{
  const rt = (World.routes || []).find(r => r.name === 'gallery' || r.id === 'gallery'), pts = rt ? rt.pts : [[3, 0, -16.4], [10, 3.5, -16.4]];
  const seg = []; let L = 0; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[2] - a[2]); seg.push([a, b, l, L]); L += l; }
  const at = u => { u = ((u % (2 * L)) + 2 * L) % (2 * L); if (u > L) u = 2 * L - u; for (const [a, b, l, s0] of seg) if (u <= s0 + l + 1e-6) { const t = l ? (u - s0) / l : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; } return pts[pts.length - 1]; };
  for (const hour of [10, 21]) for (const mode of ['gallery', 'edge']) {
    Env.dayLength = 0; Env.hour = hour; game.tp(2, -3, 0); if (typeof npcSnapAll === 'function') npcSnapAll(); game.step(2, dt);
    const n = World.doors.length, prev = World.doors.map(d => d.open), dirs = World.doors.map(() => 0), ev = World.doors.map(() => []), rev = World.doors.map(() => []), frames = Math.round(60 / dt), door = World.doors.find(d => Math.abs(d.c[0]) < 1.5 && Math.abs(d.c[2] + 17.4) < 1.5);
    for (let f = 0; f < frames; f++) {
      const t = f * dt;
      if (mode === 'gallery') { const p = at(t * 1.6); Player.pos[0] = p[0]; Player.pos[1] = p[1]; Player.pos[2] = p[2]; }
      else if (door) { const r = 2.4 + 0.15 * Math.sin(t * 1.3); Player.pos[0] = door.c[0] + r * 0.7; Player.pos[1] = door.c[1] - 1 + 0.02; Player.pos[2] = door.c[2] + r * 0.7; }
      game.step(1, dt);
      for (let i = 0; i < n; i++) { const o = World.doors[i].open, p = prev[i]; if (o !== p) { const sg = o > p ? 1 : -1; if (dirs[i] && sg !== dirs[i]) rev[i].push(t); dirs[i] = sg; } if ((o > 0.5) !== (p > 0.5)) ev[i].push(t); prev[i] = o; }
    }
    const win = a => { let m = 0; for (let i = 0; i < a.length; i++) { let c = 0; for (let j = i; j < a.length && a[j] - a[i] < 10; j++) c++; if (c > m) m = c; } return m; };
    let bad = 0; for (let i = 0; i < n; i++) { const d = World.doors[i], e = win(ev[i]), r = win(rev[i]); if (e > 3 || r > 4) { bad++; flaps.push(hour + 'h walk-' + mode + ': door at ' + d.c.map(v => +v.toFixed(1)).join(',') + ' changed state ' + e + ' times and reversed ' + r + ' times in ten seconds'); } }
    table.push(hour + 'h walk-' + mode + ': ' + n + ' leaves, ' + bad + ' flapping');
  }
}
console.log(flaps.length ? 'doors FAIL ' + flaps.length : 'doors PASS');
return { flaps, table };
