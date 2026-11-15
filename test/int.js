window.__in = async (id, lx, lz, yawLocalDeg, pitch, hour) => { const s = SITE[id], p = siteToWorld(s, lx, lz), y = World.houses[id].floorY + 1.6; return await __game.shot(p[0], y, p[1], (s.yaw * 180 / Math.PI) + yawLocalDeg, pitch || 0, hour); };
return 1;
