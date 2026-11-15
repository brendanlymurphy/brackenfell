// view helpers for interior screenshots: window.__corner(id, sx, sz, hour, pitch, k) stands near local corner (sx,sz) and looks at the opposite side
window.__corner = async (id, sx, sz, hour, pitch, k) => {
  const s = SITE[id], h = World.houses[id], w = s.w, d = s.d, inset = 0.9;
  const a = siteToWorld(s, sx * (w / 2 - inset), sz * (d / 2 - inset)), b = siteToWorld(s, -sx * (w / 2 - inset) * (k === undefined ? 0.2 : k), -sz * (d / 2 - inset) * (k === undefined ? 0.2 : k));
  const y = h.floorY + 1.62, dx = b[0] - a[0], dz = b[1] - a[1];
  return await game.shot(a[0], y, a[1], Math.atan2(dx, -dz) * 180 / Math.PI, pitch || 0, hour);
};
window.__inn = async (hour, which) => {
  const a = World.spots[which ? 'inn.barfront' : 'inn.s1'].p, b = World.spots[which ? 'inn.s4' : 'inn.fire1'].p, dx = b[0] - a[0], dz = b[2] - a[2], y = a[1] + 1.65;
  return await game.shot(a[0], y, a[2], Math.atan2(dx, -dz) * 180 / Math.PI, Math.atan2(b[1] - y, Math.hypot(dx, dz)) * 180 / Math.PI, hour);
};
window.__wall = async (id, lx, dist, hour) => {
  const s = SITE[id], a = siteToWorld(s, lx, -s.d / 2 - dist), b = siteToWorld(s, lx, -s.d / 2), y = Terrain.y(a[0], a[1]) + 1.5, dx = b[0] - a[0], dz = b[1] - a[1];
  return await game.shot(a[0], y, a[1], Math.atan2(dx, -dz) * 180 / Math.PI, -8, hour);
};
return 1;
