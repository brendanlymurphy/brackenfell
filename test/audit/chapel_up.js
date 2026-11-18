// [audit] the chapel from all round, looking up (the owner saw a stretched spike and a hanging timber there): 16 views on a ring 9 to 14 m out, eye height, pitched up 12 and 28 degrees
const h = World.houses.chapel.site, c = [h.x, h.z], out = { house: { x: h.x, z: h.z, w: h.w, d: h.d, yaw: h.yaw } };
for (let k = 0; k < 16; k++) { const a = k / 16 * 2 * Math.PI, r = 9 + (k % 2) * 5, x = c[0] + Math.sin(a) * r, z = c[1] - Math.cos(a) * r; const g = World.groundAt ? World.groundAt(x, z, 30) : Terrain.y(x, z); const yaw = Math.atan2(c[0] - x, -(c[1] - z)) * 180 / Math.PI;
  for (const p of [12, 28]) { game.shot(x, g + 1.6, z, yaw, p, 13); await __snap('chup_' + String(k).padStart(2, '0') + '_' + p); } }
return out;
