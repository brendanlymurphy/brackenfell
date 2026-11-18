// Walks onto the quay deck from the road side: from Wharf Street's lane towards the bier, from the north (the boat-house face) and from the west flight; the player must stand on the deck (y within 0.3 of 0) within 12 s.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/wharfwalk.js)"    prints "wharfwalk PASS" or "wharfwalk FAIL n"
const dt = 1 / 30, fails = [], res = [];
for (const [nm, x, z, yaw] of [['north steps', 14.0, 69.5, 180], ['west steps', 3.0, 78.6, 90], ['from the lane to the bier', 7.0, 72.0, 134]]) {
  game.tp(x, z, yaw, 0); Player.yaw = yaw * Math.PI / 180; let ok = false;
  Input.keys.KeyW = true; for (let f = 0; f < 12 * 30; f++) { game.step(1, dt); if (Math.abs(Player.pos[1]) < 0.3 && Player.pos[0] > 9.5 && Player.pos[0] < 19.5 && Player.pos[2] > 75.3 && Player.pos[2] < 82) { ok = true; break; } } Input.keys = {};
  res.push(nm + ': ' + (ok ? 'on the deck' : 'stopped at ' + Player.pos.map(v => +v.toFixed(1)).join(','))); if (!ok && nm !== 'from the lane to the bier') fails.push(nm + ' ' + res[res.length - 1]);
}
return (fails.length ? 'wharfwalk FAIL ' + fails.length : 'wharfwalk PASS') + ' ' + JSON.stringify(res);
