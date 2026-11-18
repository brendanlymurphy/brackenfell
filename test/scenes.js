// The passing scenes (src/82e_scenes.js): at each scene's hour its two people are really together at the place their days bring them to, and a player standing
// by hears every line of it, in order, once that day. Scene 7 has no place yet and is not expected.
const bad = [], dt = 1 / 30, heard = []; Env.dayLength = 0; Weather.set('fair'); const _t = toast; toast = function (h) { heard.push(String(h)); return _t.apply(this, arguments); };
S.flags.sawBody = 1; S.scenes = {}; let played = 0;
for (const s of CAST_SCENES) { const t0 = SCENES.at[s.n]; if (t0 === undefined) continue;
  const who = s.who.split(', ').map(n => NPC[SCENES.id(n)]); if (who.some(n => !n)) { bad.push('scene ' + s.n + ': ' + s.who + ' are not both in the town'); continue; }
  Env.hour = t0 - 0.02; npcSnapAll(); game.step(4, dt); const [a, b] = who, d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
  if (d > (SCENES.far[s.n] || 6)) { bad.push('scene ' + s.n + ' (' + s.where + '): ' + a.name + ' (' + a.at + ') and ' + b.name + ' (' + b.at + ') are ' + d.toFixed(0) + ' m apart at the hour'); continue; }
  Cells.teleport({ p: [a.pos[0] + 1.2, a.pos[1], a.pos[2] + 0.6], yaw: 0 }); game.step(2, dt); heard.length = 0; Env.hour = t0 + 0.01;
  for (let i = 0; i < 30 * 45; i++) { game.step(1, dt); Env.hour = t0 + 0.01; }
  const got = heard.filter(x => /^<b>\w+<\/b>: “/.test(x)), want = s.lines.map(l => '<b>' + l[0] + '</b>: “' + l[1] + '”');
  if (got.join('|') !== want.join('|')) bad.push('scene ' + s.n + ' (' + s.where + '): heard ' + got.length + ' of ' + want.length + ' lines' + (got.length ? ', first ' + got[0].slice(0, 50) : '')); else played++;
  heard.length = 0; for (let i = 0; i < 30 * 8; i++) game.step(1, dt); if (heard.some(x => /^<b>\w+<\/b>: “/.test(x))) bad.push('scene ' + s.n + ' played twice in one day'); }
toast = _t; delete S.flags.sawBody; S.scenes = {};
if (bad.length) throw new Error('SCENES FAIL ' + bad.length + ': ' + bad.join('; '));
return 'scenes PASS ' + played + ' of ' + CAST_SCENES.length + ' scenes heard line for line by a player standing by, each once a day (7, the butts, has no place yet)';
