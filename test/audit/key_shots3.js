// [audit] pictures of the worst entries of docs/GEOMETRY.md (its own shot calls) for audit item 11. usage: node test/audit/run.mjs --size 960x540 test/audit/key_shots3.js
const V = [['geo_stretch_barn', 116, 7.1, -4.2, 315, -12], ['geo_stretch_shingle', 10.9, 15.7, 20.2, 315, -12], ['geo_sheet_passage', 14.4, 9.1, -14.3, 315, -12], ['geo_sheet_terrace', -8.8, 7.9, 15.7, 315, -12], ['geo_open_churchyard', -19.7, 7.6, -72.1, 315, -12], ['geo_open_terrace', -12, 4.6, 33.8, 315, -12], ['geo_open_barn', 112.3, 4.2, -1.7, 315, -12], ['geo_stretch_awning', -9.2, 3.2, -1.6, 315, -12]];
for (const v of V) { game.shot(v[1], v[2], v[3], v[4], v[5], 13); await __snap(v[0]); }
return V.map(v => v[0]);
