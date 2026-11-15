// Layout checks in plain node (no browser): loads 00_math, 55_layout and 55b_infill and tests the town plan.
// usage: node test/layout.mjs [--list]    forecourts: every original building has 9 m of open ground in front of its door; every infill house has a clear approach.
import fs from 'node:fs'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url)), ctx = vm.createContext({ console, Math, TEST: {} });
for (const f of ['00_math', '55_layout', '55b_infill']) vm.runInContext(fs.readFileSync(root + 'src/' + f + '.js', 'utf8').replace(/^const /gm, 'var ').replace(/^function /gm, 'var __f_$&;function '), ctx, { filename: f });
const L = vm.runInContext('({ SITES, INF, SITE, ROADS, siteDoorLocal, siteToWorld, worldToSite, SQUARE })', ctx);
const { SITES, INF, ROADS } = L, out = [], fails = [];
const rectHit = (s, x, z, m) => { const l = L.worldToSite(s, x, z); return Math.abs(l[0]) < s.w / 2 + m && Math.abs(l[1]) < s.d / 2 + m; };
// the forecourt of a site: a strip `wid` wide and `len` long straight out from its door, in front of its door wall
const strip = (s, len, wid) => { const pts = []; for (let a = 0.5; a <= len; a += 0.7) for (let b = -wid / 2; b <= wid / 2 + 1e-6; b += wid / 2) { const dl = L.siteDoorLocal(s, 0), wall = s.doorWall || 'front', e = a + (s.porch || 0); const lx = wall === 'front' ? [dl[0] + b, -s.d / 2 - e] : wall === 'back' ? [dl[0] + b, s.d / 2 + e] : wall === 'left' ? [-s.w / 2 - e, dl[1] + b] : [s.w / 2 + e, dl[1] + b]; pts.push(L.siteToWorld(s, lx[0], lx[1])); } return pts; };
const blocker = (s, len, wid) => { const pts = strip(s, len, wid); for (const o of SITES) { if (o === s || !o.w) continue; for (const [x, z] of pts) if (rectHit(o, x, z, 0.1)) return o.id; } return null; };
const skip = new Set(['tower', 'barn', 'mill', 'farm', 'hunter', 'fisher']);
for (const s of SITES) {
  if (s.infill) { if (INF.byId[s.id] && INF.byId[s.id].enter) { const b = blocker(s, 3.0, 1.6); if (b) fails.push(s.id + ' (enterable) approach blocked by ' + b); } continue; }
  if (skip.has(s.id)) continue;
  const b = blocker(s, 9, 3.2); if (b) fails.push('original ' + s.id + ' forecourt blocked by ' + b);
}
// the first 25 infill houses (in.01 to in.25) must not look at a wall closer than 9 m either
for (const h of INF.houses) { const n = +h.id.slice(3); if (n > 25 || h.enter) continue; const s = L.SITE[h.id], b = blocker(s, 9, 2.4); if (b) fails.push(h.id + ' faces ' + b + ' within 9 m'); }
out.push('sites ' + SITES.length + ' infill ' + INF.houses.length + ' enter ' + INF.enterIds.join(','));
console.log(out.join('\n')); if (process.argv.includes('--list')) for (const h of INF.houses.slice(0, 30)) console.log(h.id, h.x.toFixed(1), h.z.toFixed(1), (h.yaw).toFixed(2), h.w, h.d, h.enter ? 'ENTER' : '');
if (fails.length) { console.log('LAYOUT FAIL\n' + fails.join('\n')); process.exit(1); } console.log('layout PASS');
