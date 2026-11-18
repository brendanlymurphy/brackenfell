// The walk camera: out of doors, what a player walking the slice sees (the room camera's partner, test/roomviews.mjs).
// Along every lane of the slice (the walking graph between the west gate, the square, the alley, the Hart's door, the north gate and the chapel door,
// plus the square's perimeter and both diagonals) a station every 5 m; at each station four frames: along the way, back along it, and one to each side;
// eye height 1.6 m, level, 800x450. A station with anything within 0.5 m of the lens is stepped aside (sideways, up to 2 m) and the label says so.
// Runs detached and resumes: frames already on disk are skipped, a browser session renders at most BATCH frames and is then replaced.
//   node test/walkviews.mjs [--build NAME] [--out /home/claude/shots/walk] [--hours 13,21] [--batch 40] [--index-only] [--limit N]
//   python3 test/walkviews_sheet.py <out>/<build>      (12 frames per sheet, labelled)
// The index (<out>/<build>/index.json): one entry per frame: name, hour, x, y, z, yaw, station, kind, leg, stepped (metres moved aside, or 0).
import fs from 'node:fs';
import path from 'node:path';
import { open } from './qa/harness.mjs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BUILD = arg('--build', 'dev'), OUT = path.join(arg('--out', '/home/claude/shots/walk'), BUILD), HOURS = arg('--hours', '13,21').split(',').map(Number), BATCH = +arg('--batch', 40), LIMIT = +arg('--limit', 0), W = 800, H = 450;
fs.mkdirSync(OUT, { recursive: true });
const IDX = path.join(OUT, 'index.json');

const planJS = `
  const N = Nav.nodes, ground = k => Math.abs(N[k][1] - World.groundY(N[k][0], N[k][2])) < 0.5 && N[k][2] > -200 && N[k][2] < 200 && Math.abs(N[k][0]) < 200;
  const gates = (World.openings || []).filter(o => /towngate/.test(o.kind)).map(o => [o.x, o.z, o.kind]);
  const near = (x, z) => { let b = -1, bd = 1e9; for (let k = 0; k < N.length; k++) { if (!ground(k)) continue; const d = (N[k][0] - x) ** 2 + (N[k][2] - z) ** 2; if (d < bd) { bd = d; b = k; } } return b; };
  const door = id => { const d = World.doors.find(w => w.cell === id && w.side === 'out'); return d ? [d.c[0], d.c[2]] : null; };
  const west = gates.filter(g => g[0] < -40).sort((a, b) => a[0] - b[0])[0], north = gates.filter(g => g[1] < -40 && Math.abs(g[0]) < 60)[0] || gates.sort((a, b) => a[1] - b[1])[0];
  const P = { westgate: west ? west.slice(0, 2) : [(World.spots['gate.post'].p[0] + World.spots['gate.post2'].p[0]) / 2 + 1, (World.spots['gate.post'].p[2] + World.spots['gate.post2'].p[2]) / 2], square: [0, -2], alleyS: World.spots['alley.s'].p.filter((v, i) => i !== 1), alleyN: World.spots['alley.n'].p.filter((v, i) => i !== 1), hart: door('inn'), northgate: north && north.slice(0, 2), chapel: door('chapel') };
  const legs = [['westgate', 'square'], ['square', 'alleyS'], ['alleyS', 'alleyN'], ['square', 'hart'], ['square', 'northgate'], ['northgate', 'chapel']];
  const out = { points: P, legs: [] };
  for (const [a, b] of legs) { if (!P[a] || !P[b]) { out.legs.push({ leg: a + '-' + b, missing: true }); continue; } const p = navPath(near(P[a][0], P[a][1]), near(P[b][0], P[b][1])); out.legs.push({ leg: a + '-' + b, pts: p ? [P[a]].concat(p.map(k => [N[k][0], N[k][2]])).concat([P[b]]) : null }); }
  const S = SQUARE, per = [[S.x - S.rx, S.z - S.rz], [S.x + S.rx, S.z - S.rz], [S.x + S.rx, S.z + S.rz], [S.x - S.rx, S.z + S.rz]];
  for (let i = 0; i < 4; i++) out.legs.push({ leg: 'square-perimeter-' + i, pts: [per[i], per[(i + 1) % 4]] });
  out.legs.push({ leg: 'square-diag-0', pts: [per[0], per[2]] }, { leg: 'square-diag-1', pts: [per[1], per[3]] });
  return JSON.stringify(out);`;

const stationsFrom = plan => {
  const st = []; const seen = [];
  for (const L of plan.legs) {
    if (!L.pts) { console.log('leg without a path:', L.leg); continue; }
    const pts = L.pts; let acc = 0, next = 0, i = 0;
    const segs = []; for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); if (d > 0.01) segs.push([pts[k - 1], pts[k], d]); }
    const total = segs.reduce((s, q) => s + q[2], 0);
    for (let s = 0; s <= total + 1e-6; s += 5) {
      let r = s, q = 0; while (q < segs.length - 1 && r > segs[q][2]) { r -= segs[q][2]; q++; } const [a, b, d] = segs[q], t = Math.min(1, r / d);
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, hd = Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180 / Math.PI;
      if (seen.some(p => Math.hypot(p[0] - x, p[1] - z) < 2.5)) continue; seen.push([x, z]);
      st.push({ leg: L.leg, x, z, hd });
    }
  }
  return st;
};

let index;
if (fs.existsSync(IDX)) index = JSON.parse(fs.readFileSync(IDX, 'utf8'));
else {
  const s = await open({ webgl: 1, quality: 'low', play: 1 }, [W, H]);
  const plan = JSON.parse(await s.run(planJS)); await s.close();
  const st = stationsFrom(plan), frames = [];
  st.forEach((p, i) => {
    for (const [kind, dy] of [['along', 0], ['back', 180], ['left', -90], ['right', 90]]) for (const hour of HOURS) {
      const yaw = ((Math.round(p.hd + dy) % 360) + 360) % 360;
      frames.push({ name: `s${String(i).padStart(3, '0')}_${kind}_${hour}`, hour, x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw, station: i, kind, leg: p.leg });
    }
  });
  index = { build: BUILD, points: plan.points, stations: st.length, frames };
  fs.writeFileSync(IDX, JSON.stringify(index, null, 1)); console.log('index', st.length, 'stations', frames.length, 'frames');
}
if (process.argv.includes('--index-only')) process.exit(0);

let todo = index.frames.filter(f => !fs.existsSync(path.join(OUT, f.name + '.jpg')));
if (LIMIT) todo = todo.slice(0, LIMIT);
console.log(todo.length, 'frames to do');
while (todo.length) {
  const batch = todo.splice(0, BATCH);
  const s = await open({ webgl: 1, quality: 'low', play: 1 }, [W, H]);
  for (const f of batch) {
    const r = JSON.parse(await s.run(`
      const x0 = ${f.x}, z0 = ${f.z}, yaw = ${f.yaw}, hour = ${f.hour}; const clear = (x, z) => !World.blockedAt(x, z, 0.5);
      let x = x0, z = z0, moved = 0;
      if (!clear(x, z)) { const rx = Math.cos(yaw * Math.PI / 180), rz = Math.sin(yaw * Math.PI / 180); outer: for (let d = 0.25; d <= 2; d += 0.25) for (const sg of [1, -1]) { const nx = x0 + sg * rx * d, nz = z0 + sg * rz * d; if (clear(nx, nz)) { x = nx; z = nz; moved = d; break outer; } } }
      const y = Terrain.y(x, z) + 1.6; await __game.shot(x, y, z, yaw, 0, hour); const A = await QA.draw(); return JSON.stringify({ j: QA.jpeg(A), x, z, y, moved, blocked: !clear(x, z) });`));
    fs.writeFileSync(path.join(OUT, f.name + '.jpg'), Buffer.from(r.j, 'base64'));
    f.x2 = +r.x.toFixed(2); f.z2 = +r.z.toFixed(2); f.y = +r.y.toFixed(2); f.stepped = r.moved; f.stillBlocked = r.blocked;
  }
  await s.close();
  // keep what was learned in the index (positions actually used, steps aside)
  for (const f of batch) { const g = index.frames.find(q => q.name === f.name); if (g) Object.assign(g, f); }
  fs.writeFileSync(IDX, JSON.stringify(index, null, 1)); console.log('batch done,', todo.length, 'left');
}
console.log('walkviews done');
