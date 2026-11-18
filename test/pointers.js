// Pointers lead to things (src/94f_pointers.js; docs/audit/POINTERS.md): the quest mark inside the chapel points at the chest, the gate and the reliquary in
// turn; stages 8 and 9 of the main quest point at the Hart (or the cave's cleft once the tunnel has been walked), never 1 km off at nothing; the Hart's back
// door and its cellar hatch take you in; the boat-house doors answer a knock; Wren's frostcap is north-west of the west gate and outside it; Tobin's note says
// east, where the stone is.
const bad = [], dt = 1 / 30, heard = []; Env.dayLength = 0; Env.hour = 11; npcSnapAll(); game.step(2, dt); const _t = toast; toast = function (h) { heard.push(String(h)); return _t.apply(this, arguments); };
const near = (a, b, r) => a && b && Math.hypot(a[0] - b[0], a[2] - b[2]) < (r || 0.6), keep = JSON.stringify(S.q), flags = JSON.stringify(S.flags);
// 1. the chapel
game.enter('chapel'); game.step(3, dt); S.q.crypt = { stage: 0 }; const sac = World.interact.find(o => o.id === 'chapel.sacristy'), gate = World.interact.find(o => o.id === 'chapel.gate'), relic = World.interact.find(o => o.id === 'chapel.relic');
if (!near(questTarget('crypt'), sac && sac.p)) bad.push('in the chapel the crypt quest (stage 0) does not point at the sacristy chest');
S.q.crypt = { stage: 1 }; if (!near(questTarget('crypt'), gate && gate.p)) bad.push('in the chapel the crypt quest (stage 1) does not point at the crypt gate');
S.q.crypt = { stage: 2 }; if (!near(questTarget('crypt'), relic && relic.p)) bad.push('in the chapel the crypt quest (stage 2) does not point at the reliquary');
{ const m = Cells.mapTarget(questTarget('crypt')); if (!near(m, relic && relic.p)) bad.push('the compass turns the reliquary into the chapel door'); }
game.leave(); game.step(2, dt);
// 2. stages 8 and 9 out of doors
S.q.main = { stage: 8 }; { const t = questTarget('main'), h = World.houses.inn.site, d = Math.hypot(t[0] - h.x, t[2] - h.z); if (d > 3) bad.push('stage 8 out of doors points ' + Math.round(Math.hypot(t[0], t[2])) + ' m from the square, not at the Hart'); }
S.flags.tunnel = 1; S.q.main = { stage: 9 }; { const t = questTarget('main'), cave = World.interact.find(o => o.id === 'door.cave.in'); if (!near(t, cave && cave.p, 1)) bad.push('stage 9, the tunnel walked, does not point at the cave\'s cleft'); }
// 3. the Hart's back door and hatch
for (const [id, want] of [['door.inn.back', 0], ['door.inn.hatch', -1]]) { const it = World.interact.find(o => o.id === id); if (!it) { bad.push('no ' + id); continue; } if (World.cell) game.leave(); Cells.teleport({ p: [it.p[0], it.p[1] - 1, it.p[2]], yaw: 0 }); game.step(2, dt);
  if (!interactLabel(it)) bad.push(id + ' offers nothing'); Cells.travel(it.dest); for (let i = 0; i < 200 && Cells.busy; i++) { game.step(1, dt); await new Promise(r => setTimeout(r, 15)); } game.step(3, dt);
  const P = World.houses.inn.plan, k = P ? P.lv[want].y : 0, fy = Cells.by.inn.floorY; if (!World.cell || World.cell.id !== 'inn') bad.push(id + ' does not lead into the Hart'); else if (want < 0 && Player.pos[1] > fy - 1.5) bad.push('the cellar hatch lands on the ground floor (feet ' + Player.pos[1].toFixed(1) + ')'); }
if (World.cell) game.leave(); game.step(2, dt);
// 4. the boat-house doors
{ const d = World.interact.find(o => o.id === 'wharf.boathouse0'); if (!d) bad.push('the boat-house doors cannot be knocked on'); else { heard.length = 0; interactUse(d); if (!heard.some(h => /Wenn/.test(h))) bad.push('knocking at the boat-house says nothing of Old Wenn'); } }
// 5. Wren's frostcap
{ const f = World.interact.find(o => o.id === 'frostcap1'), g = World.spots['gate.post'].p; if (!f) bad.push('no frostcap1'); else { const b = (Math.atan2(f.p[0] - g[0], -(f.p[2] - g[2])) * 180 / Math.PI + 360) % 360; if (b < 280 || b > 350) bad.push('Wren\'s frostcap is at bearing ' + b.toFixed(0) + ' from the gate, not north-west'); if (f.p[0] > g[0] - 4) bad.push('Wren\'s frostcap is not outside the west gate'); } }
// 6. Tobin's note
if (!/east of the plaque/.test(JSON.stringify(SECRETS.bell.note))) bad.push('Tobin\'s note does not say east of the plaque');
toast = _t; S.q = JSON.parse(keep); S.flags = JSON.parse(flags);
if (bad.length) throw new Error('POINTERS FAIL ' + bad.length + ': ' + bad.join('; '));
return 'pointers PASS the chapel\'s marks point at the chest, the gate and the reliquary; stages 8 and 9 at the Hart and the cleft; the Hart\'s back door and hatch take you in; the boat-houses answer; the frostcap is north-west of the gate outside it; Tobin\'s note says east';
