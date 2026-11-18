// Lawn inside the edge, per district: the share of open ground (not under a building, not water) whose splat is neither road dirt, cobble, field nor bare earth (TOWNPLAN: no lawn in town).
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/lawn.js)"      (window.__lawnPts = 1 lists the lawn sample points)
const POLY = [[-30, -58.7], [-33, -58.5], [-47, -56], [-58, -49], [-63, -38], [-65, -26], [-64, -19.5], [-62, -15], [-62, -8.15], [-62, -2.25], [-62, 5], [-63.5, 9.5], [-65, 16], [-63, 30], [-59, 44], [-52, 56], [-44, 66], [-37, 72.5], [-32, 76.5], [30, 78], [72.7, 70], [72.7, -46.5], [72.7, -57], [52, -60], [30, -60.5], [8, -58.7]];
const inPoly = (x, z) => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const [xi, zi] = POLY[i], [xj, zj] = POLY[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const district = (x, z) => z < -22 ? 'Chapelgate' : z > 36 ? 'Wharfside' : x > 38 ? 'Riverside' : x < -40 ? 'Westgate' : 'Market';
const built = (x, z) => { for (const s of SITES) { if (!s.w || s.id === 'tower') continue; const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + 0.5 && Math.abs(l[1]) < s.d / 2 + 0.5) return true; } return false; };
const tot = {}, lawn = {}, pts = [];
for (let x = -66; x <= 73; x += 1.5) for (let z = -61; z <= 79; z += 1.5) {
  if (!inPoly(x, z)) continue; if (Terrain.y(x, z) < LAKE.y + 0.1) continue; if (Math.abs(River.dist(x, z, 12)) < 5) continue; { let bd = 1e9, bx = 0; for (const q of River.p) { const d = Math.hypot(q[0] - x, q[1] - z); if (d < bd) { bd = d; bx = q[0]; } } if (x > bx + 3) continue; }      // west of the river only if (built(x, z)) continue; if (placeW(x, z, 0.01) >= 1) continue;
  if ((World.places || []).some(q => q.r !== undefined ? Math.hypot(x - q.x, z - q.z) < q.r : (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1))) continue;      // an orchard, the green, the drying green: places with a use are not lawn
  const d = district(x, z); tot[d] = (tot[d] || 0) + 1; tot.All = (tot.All || 0) + 1;
  if (Terrain.splat(x, z, 0) < 0.3 && Terrain.splat(x, z, 1) < 0.3 && Terrain.splat(x, z, 2) < 0.3 && Terrain.splat(x, z, 3) < 0.3) { lawn[d] = (lawn[d] || 0) + 1; lawn.All = (lawn.All || 0) + 1; if (window.__lawnPts) pts.push([x, z]); }
}
const out = {}; for (const k in tot) out[k] = (100 * (lawn[k] || 0) / tot[k]).toFixed(1) + '% of ' + tot[k]; return JSON.stringify(window.__lawnPts ? { out, pts } : out);
