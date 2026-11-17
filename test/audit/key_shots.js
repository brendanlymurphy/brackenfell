// [audit] the pictures the report cites. usage: node test/audit/run.mjs --size 960x540 test/audit/key_shots.js
const V = [
 ['edge_west_gate', -74, null, -8, 90, 2, 13], ['edge_west_above', -80, 28, -8, 90, -28, 13], ['edge_north_above', 0, 34, -32, 0, -38, 13], ['edge_south_above', 0, 32, 118, 0, -24, 13], ['edge_east_above', 80, 30, 0, -90, -28, 13],
 ['street_wharf_south', 2, null, 44, 180, 0, 13], ['street_wharf_mid', 2, null, 60, 180, 0, 13], ['street_main_from_bridge', 58, null, 1, -90, 0, 13], ['street_main_from_west', -52, null, -9, 90, 0, 13], ['street_chapel_north', -1, null, -30, 0, 0, 13], ['street_chapel_top', -8, null, -52, 0, 0, 13],
 ['inn_passage', 11.4, null, -12.2, 0, 0, 13], ['herbalist_door', 24, null, 16, 135, 0, 13], ['highfold', 112, null, 100, 20, 0, 13], ['barn', 104, null, -3, 90, 0, 13],
 ['wharf_lawn_above', 0, 26, 95, 0, -35, 13], ['west_lawn_above', -75, 26, 30, 70, -30, 13], ['square_noon', 0, null, 6, 0, 0, 12], ['square_night', 0, null, 6, 0, 0, 21.5], ['upper_ward', -30, 14, 34, 50, -25, 13], ['chapelgate_above', -30, 30, -20, -20, -35, 13],
];
const out = [];
for (const v of V) { const r = game.shot(v[1], v[2], v[3], v[4], v[5], v[6]); await __snap(v[0]); out.push([v[0], r.draws, r.tris]); }
// what a resident says: walk into the baker's and press talk
game.enter('in.10'); game.step(6, 1 / 30); const n = NPCS.find(p => p.id === 'r_in10'); if (n) { startTalk(n); game.step(3, 1 / 30); game.draw(); await __snap('talk_resident'); out.push(['talk', document.getElementById('dialog') ? document.getElementById('dialog').innerText.slice(0, 200) : '']); }
return out;
