// [audit] second set of cited pictures: barriers, floors against ground, close-ups. usage: node test/audit/run.mjs --size 960x540 test/audit/key_shots2.js
const V = [
 ['bar_churchyard', -30, 9, -68, 60, -25, 13], ['bar_riverside', 52, 9, -6, -70, -28, 13], ['bar_westgate', -50, 9, -14, 70, -28, 13], ['bar_chapel_east', 22, 9, -26, 40, -28, 13],
 ['ground_inn_back', 0, 9, -36, 180, -30, 13], ['ground_in77', 16, 6, -62, -60, -22, 13], ['ground_shells_north', -14, 8, -12, 200, -25, 13],
 ['close_shell_door', -5.5, null, 78, 0, 0, 13], ['close_wharf_house', 14, null, 74, -60, 4, 13], ['close_west_house', -46, null, 14, 20, 4, 13], ['plots_east', 40, 22, -30, 150, -40, 13], ['pots', -30, null, -48, 200, -8, 13],
];
const out = [];
for (const v of V) { game.shot(v[1], v[2], v[3], v[4], v[5], v[6]); await __snap(v[0]); out.push(v[0]); }
// people outdoors by hour, inside the town (|x| < 62, -84 < z < 90)
Env.dayLength = 0; const by = {};
for (let h = 0; h < 24; h++) { Env.hour = h + 0.5; npcSnapAll(); game.step(3, 1 / 30); let outd = 0, sq = 0, inn = 0, home = 0; for (const n of NPCS) { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); if (c) { if (c.id === 'inn') inn++; else home++; } else { outd++; if (Math.hypot(n.pos[0], n.pos[2] + 2) < 22) sq++; } } by[h] = { outdoors: outd, inSquare: sq, inInn: inn, inOtherBuildings: home }; }
return { shots: out, peopleByHour: by };
