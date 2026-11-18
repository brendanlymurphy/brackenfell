// ── Passing scenes (docs/PEOPLE.md section 6, as data in 54_cast.js: CAST_SCENES) ──
// [cast] Two real people of the town, at a fixed place and hour, say a few lines to one another; you hear it if you are near, as notices ('<b>Avice</b>: “...”'),
// the way the night meeting behind the chapel is heard (88d_voice.js plays a recording when there is one). Nothing is spawned: the two are there because their
// own days bring them there (77e_households.js: the well at dawn, a call paid at a set hour, supper, the Hart). Each scene once a day. Not played, and why:
// 7 (Hugh and Hale at the butts) has no place: there are no butts in the town yet. 9 is at the gate, not in the Hart: Ivo has the night watch at that hour.
const SCENES = { at: { 1: 7.1, 2: 7.75, 3: 9.0, 4: 10.0, 5: 11.0, 6: 12.0, 8: 19.5, 9: 20.0, 10: 20.5, 11: 18.25, 12: 15.0 }, when: { 11: () => !!S.flags.sawBody }, far: { 3: 9, 4: 9, 6: 9, 10: 14, 12: 9 }, cur: null, t: 0, acc: 0 };
SCENES.id = nm => { const w = nm.split(' '); return (w[0] === 'Old' ? w[1] : w[0]).toLowerCase(); };
SCENES.tick = function (dt) {
  if (!game.playing || UI.talk || typeof NPC === 'undefined') return; const sc = SCENES;
  if (sc.cur) { const c = sc.cur; sc.t += dt; while (c.i < c.lines.length && sc.t >= c.due) { const l = c.lines[c.i++]; toast('<b>' + l[0] + '</b>: “' + l[1] + '”'); c.due += 2.4 + l[1].length * 0.05; } if (c.i >= c.lines.length) sc.cur = null; return; }
  sc.acc += dt; if (sc.acc < 0.5) return; sc.acc = 0;
  const day = (typeof RPG !== 'undefined' && RPG.st && RPG.st().day) || 0, h = Env.hour, P = Player.pos; if (!S.scenes || typeof S.scenes !== 'object') S.scenes = {};
  for (const s of CAST_SCENES) { const t0 = sc.at[s.n]; if (t0 === undefined || h < t0 || h > t0 + 0.4 || S.scenes[s.n] === day || (sc.when[s.n] && !sc.when[s.n]())) continue;
    const who = s.who.split(', ').map(n => NPC[sc.id(n)]); if (who.some(n => !n) || who.some(n => n.path && n.path.length)) continue;          // both there and standing
    const [a, b] = who, d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]); if (d > (sc.far[s.n] || 6) || Math.abs(a.pos[1] - b.pos[1]) > 2.5) continue;
    if (Math.min(Math.hypot(a.pos[0] - P[0], a.pos[2] - P[2]), Math.hypot(b.pos[0] - P[0], b.pos[2] - P[2])) > 9 || Math.abs(a.pos[1] - P[1]) > 3) continue;          // the player in earshot (a room far away is far away: interiors stand apart)
    for (const [x, y] of [[a, b], [b, a]]) if (x.anim !== 'sit' && x.anim !== 'lie' && d > 0.3) x.yaw = headingTo(x.pos[0], x.pos[2], y.pos[0], y.pos[2]);
    S.scenes[s.n] = day; sc.cur = { lines: s.lines, i: 0, due: 0.6 }; sc.t = 0; return; }
};
{ const _nu = npcUpdate; npcUpdate = function (dt) { const r = _nu.apply(this, arguments); try { SCENES.tick(dt); } catch (e) { } return r; }; }
