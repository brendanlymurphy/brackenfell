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
console.log(flaps.length ? 'doors FAIL ' + flaps.length : 'doors PASS');
return { flaps, table };
