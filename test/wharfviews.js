// Checked cameras for the eleven Wharfside houses: front at 8 m, back at 8 m, the door at 2.5 m. A view counts only when the camera stands on walkable ground, 1.6 m up, with nothing
// (collider, bush, tree, house) within 1.5 m of the lens in eight directions; it steps sideways and then back until that holds, and the house's door must be in the frame (aimed at it).
const IDS = ['in.111', 'in.113', 'in.115', 'in.20', 'in.23', 'in.34', 'in.36', 'in.37', 'in.38', 'in.51', 'in.60'];
const plants = [].concat(World.hedgeBushes || [], World.wharfPlants || [], World.gardenPlants || []);
const trees = [].concat(World.wharfTrees || [], World.orchardTrees || []);
const dirs = []; for (let i = 0; i < 8; i++) dirs.push([Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
function clear(x, z, gy, k) {
  { const wv = World.waterAt(x, z); if (typeof wv === 'number' && isFinite(wv) && wv > gy - 0.2) return false; }
  for (const [dx, dz] of dirs) for (const r of [0.4 * k, 0.9 * k, 1.5 * k]) {
    const px = x + dx * r, pz = z + dz * r;
    for (const c of World.colliders) {
      if (c.y1 !== undefined && c.y1 < gy + 0.8) continue;
      if (c.r !== undefined) { if (hyp(px - c.x, pz - c.z) < c.r + 0.05) return false; continue; }
      const ex = (px - c.x) * c.ax + (pz - c.z) * c.az, ez = (px - c.x) * c.bx + (pz - c.z) * c.bz; if (Math.abs(ex) < c.hx + 0.05 && Math.abs(ez) < c.hz + 0.05) return false;
    }
    for (const g of plants) if (hyp(px - g[0], pz - g[1]) < 0.5 + (g[2] || 0.6) * 0.8) return false;
    for (const t of trees) if (hyp(px - t[0], pz - t[1]) < 0.6 + (t[3] || t[2] || 1) * 1.4) return false;
    for (const s of SITES) if (s.w) { const l = worldToSite(s, px, pz); if (Math.abs(l[0]) < s.w / 2 + 0.9 && Math.abs(l[1]) < s.d / 2 + 0.9) return false; }
  }
  return true;
}
function los(x, z, gy, tx, tz, self) {      // the line from the lens to the target is open: no other house, tall collider or tree trunk on it
  const L = hyp(tx - x, tz - z), n = Math.floor((L - 0.9) / 0.4);
  for (let i = 1; i <= n; i++) {
    const px = x + (tx - x) * i * 0.4 / L, pz = z + (tz - z) * i * 0.4 / L;
    for (const o of SITES) if (o.w && o !== self) { const l = worldToSite(o, px, pz); if (Math.abs(l[0]) < o.w / 2 + 0.15 && Math.abs(l[1]) < o.d / 2 + 0.15) return false; }
    for (const c of World.colliders) { if (c.y1 !== undefined && c.y1 < gy + 2.0) continue; if (c.y0 !== undefined && c.y0 > gy + 1.6) continue;
      if (c.r !== undefined) { if (hyp(px - c.x, pz - c.z) < c.r) return false; continue; }
      const ex = (px - c.x) * c.ax + (pz - c.z) * c.az, ez = (px - c.x) * c.bx + (pz - c.z) * c.bz; if (Math.abs(ex) < c.hx && Math.abs(ez) < c.hz) { const q = siteToWorld; if (self && Math.abs(worldToSite(self, c.x, c.z)[0]) < self.w / 2 + 0.5 && Math.abs(worldToSite(self, c.x, c.z)[1]) < self.d / 2 + 0.5) continue; return false; } }
    for (const t of trees) if (hyp(px - t[0], pz - t[1]) < 0.5) return false;
  }
  return true;
}
const out = [];
for (const id of IDS) {
  const s = SITE[id]; if (!s) continue;
  const nx = Math.sin(s.yaw), nz = -Math.cos(s.yaw), ux = Math.cos(s.yaw), uz = Math.sin(s.yaw), dp = s.doorPos !== undefined ? s.doorPos : 0.9;
  const door = siteToWorld(s, dp, -s.d / 2), back = siteToWorld(s, 0, s.d / 2), gD = Terrain.y(door[0], door[1]);
  const shoot = (tag, tx, tz, ty, sx, sz, dist, sgn, alsoSwap) => {
    const D = dist > 4 ? [dist, dist - 0.8, dist + 0.8, dist - 1.6, dist + 1.6, dist - 2.4, dist + 2.4] : [dist, dist + 0.4, dist + 0.8, dist - 0.4];
    for (const kk of [1, 0.75, 0.5]) for (const d of D) for (const lat of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8]) {
      const x = tx + sx * d * sgn + (-sz) * lat * 0.8, z = tz + sz * d * sgn + sx * lat * 0.8, gy = Terrain.y(x, z);
      if (!clear(x, z, gy, kk) || !los(x, z, gy, tx, tz, s)) continue;
      const dx = tx - x, dz = tz - z, yaw = Math.atan2(dx, -dz), pitch = Math.atan2(ty - (gy + 1.6), hyp(dx, dz)) * 180 / Math.PI;
      out.push({ n: tag + '.' + id, x: +x.toFixed(2), y: +(gy + 1.6).toFixed(2), z: +z.toFixed(2), yaw: +(yaw * 180 / Math.PI).toFixed(1), pitch: +pitch.toFixed(1), h: [13], dist: +hyp(dx, dz).toFixed(1), lat, k: kk }); return;
    }
    out.push({ n: tag + '.' + id, fail: 1 });
  };
  shoot('f', door[0], door[1], gD + 1.6, nx, nz, 8, 1);
  shoot('b', back[0], back[1], Terrain.y(back[0], back[1]) + 1.8, -nx, -nz, 8, 1);
  shoot('d', door[0], door[1], gD + 1.5, nx, nz, 2.5, 1);
}
return JSON.stringify(out);
