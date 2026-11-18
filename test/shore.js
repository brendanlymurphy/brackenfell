// The town is entered by its gates only. A 0.4 m flood fill of what a walker can stand on, from the game's start (outside the west palisade), with the town's gates (west, north, east) walled off, must not reach the inside of the town
// (the green, the square, the wharf); lake bed deeper than 0.3 m is water, not a way. Anything it reaches is a way in round the palisade: along the shore, over a low bank, through a gap. usage: node test/shot.mjs --opt webgl=1 --opt quality=low --do "$(cat test/shore.js)"  prints "shore PASS" or "shore FAIL".
const par = new Map(), STEP = 0.4, R0 = 140, S = [-84, -6.5], seen = new Map(), key = (i, j) => (i + 4096) * 8192 + (j + 4096), q = [];
const freeAt = (x, y, z) => { const p = [x, y, z]; colResolve(p, 0.32, y, y + 1.75); return Math.hypot(p[0] - x, p[2] - z) < 0.03; };
const GATES = (World.openings || []).filter(o => /^(westgate|towngate)/.test(o.kind)), gate = (x, z) => GATES.some(o => Math.hypot(x - o.x, z - o.z) < 4.5);
const y0 = World.groundAt(S[0], S[1], 8); seen.set(key(0, 0), y0); q.push([0, 0, y0]); const hit = [];
const INSIDE = [['the green', -37, 54], ['the square', 0, -2], ['the wharf quay', 14, 79], ['Chapelgate', -30, -30], ['the east cluster', 40, -25]];
let first = {};
while (q.length) { const [i, j, y] = q.pop(), x = S[0] + i * STEP, z = S[1] + j * STEP;
  for (const [nm, ix, iz] of INSIDE) if (!first[nm] && Math.hypot(x - ix, z - iz) < 1.2) first[nm] = [x, z].map(v => +v.toFixed(1));
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj, nx = S[0] + a * STEP, nz = S[1] + b * STEP; if (Math.hypot(nx - S[0], nz - S[1]) > R0 || gate(nx, nz)) continue; const k = key(a, b); if (seen.has(k)) continue; const ny = World.groundAt(nx, nz, y + 1.0); if (!isFinite(ny) || Math.abs(ny - y) > 0.35 || (Terrain.y(nx, nz) < LAKE.y - 0.3 && Math.hypot(nx - LAKE.x, nz - LAKE.z) < 120)) { seen.set(k, null); continue; } seen.set(k, ny); if (freeAt(nx, ny, nz)) q.push([a, b, ny]); par.set(k, key(i, j)); } }
const reached = Object.keys(first);
if (window.__shorePath) { }
let route = ''; if (reached.length) { let k = key(Math.round((first['the green'][0] - S[0]) / STEP), Math.round((first['the green'][1] - S[1]) / STEP)), n = 0; const pts = []; while (k !== undefined && n++ < 4000) { const i = Math.floor(k / 8192) - 4096, j = (k % 8192) - 4096; pts.push([S[0] + i * STEP, S[1] + j * STEP]); k = par.get(k); } route = pts.filter((p, t) => t % 40 === 0).map(p => p.map(v => v.toFixed(0)).join(',')).join(' > '); }
return (reached.length ? 'shore FAIL ' + reached.length : 'shore PASS') + ' ' + JSON.stringify({ reached: first, flood: seen.size, route });
