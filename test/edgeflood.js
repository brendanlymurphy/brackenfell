// Edge flood test: with the three gates shut, can a body walk from outside the west gate into the Market Place? (docs/BLUEPRINT.md rule 4.2)
// Same idea as test/audit/rules.py: colliders between 0.45 and 1.5 m above the ground block (body radius 0.3 added), deep water blocks (ground under lake level - 0.9), the three gate passages are shut.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --do "$(cat test/edgeflood.js)"     -> "edge PASS" or "edge FAIL" with the path the flood took (every 6 m), so the hole can be found.
const LO = -150, RES = 0.5, N = 600, G = (x, z) => Terrain.y(x, z), lake = LAKE.y, blocked = new Uint8Array(N * N);
const cellOf = (x, z) => [Math.min(N - 1, Math.max(0, Math.floor((x - LO) / RES))), Math.min(N - 1, Math.max(0, Math.floor((z - LO) / RES)))];
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (G(LO + (i + 0.5) * RES, LO + (j + 0.5) * RES) < lake - 0.9) blocked[j * N + i] = 1;
const fillBox = (c, m) => { const hx = (c.r !== undefined ? c.r : c.hx) + m, hz = (c.r !== undefined ? c.r : c.hz) + m, R = Math.hypot(hx, hz), [i0, j0] = cellOf(c.x - R, c.z - R), [i1, j1] = cellOf(c.x + R, c.z + R);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = LO + (i + 0.5) * RES, z = LO + (j + 0.5) * RES; let ok; if (c.r !== undefined) ok = Math.hypot(x - c.x, z - c.z) < hx; else { const u = (x - c.x) * c.ax + (z - c.z) * c.az, v = (x - c.x) * c.bx + (z - c.z) * c.bz; ok = Math.abs(u) < hx && Math.abs(v) < hz; } if (ok) blocked[j * N + i] = 1; } };
for (const c of World.colliders) { if (!isFinite(c.x) || Math.abs(c.x) > 145 || Math.abs(c.z) > 145) continue; const g = G(c.x, c.z); if (c.y1 < g + 0.45 || c.y0 > g + 1.5) continue; fillBox(c, 0.3); }
const gates = [[-62, -5.2, 3.0, 3.0], [-8.2, -58.0, 2.4, 2.4], [72.2, 1.6, 2.4, 2.4]];
for (const [x, z, rx, rz] of gates) { const [i0, j0] = cellOf(x - rx, z - rz), [i1, j1] = cellOf(x + rx, z + rz); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blocked[j * N + i] = 1; }
const start = (() => { let [i, j] = cellOf(-100, -8); for (let r = 0; r < 20; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (!blocked[(j + dj) * N + i + di]) return [i + di, j + dj]; return [i, j]; })();
const par = new Int32Array(N * N).fill(-2), q = [start[1] * N + start[0]]; par[q[0]] = -1; let hit = -1;
const tgt = cellOf(0, -6);
for (let h = 0; h < q.length && hit < 0; h++) { const c = q[h], i = c % N, j = (c - i) / N; if (Math.abs(i - tgt[0]) <= 6 && Math.abs(j - tgt[1]) <= 6) { hit = c; break; }
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N) continue; const k = b * N + a; if (blocked[k] || par[k] !== -2) continue; par[k] = c; q.push(k); } }
if (hit < 0) return 'edge PASS (flooded ' + q.length + ' cells of the outside, the square is not among them)';
const path = []; for (let c = hit, n = 0; c >= 0; c = par[c], n++) if (n % 12 === 0) { const i = c % N, j = (c - i) / N; path.push([+(LO + (i + 0.5) * RES).toFixed(1), +(LO + (j + 0.5) * RES).toFixed(1)]); }
return 'edge FAIL, the outside reaches the square; path (every 6 m, from the square outward): ' + JSON.stringify(path.slice(0, 60));
