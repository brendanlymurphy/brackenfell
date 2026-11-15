// Scripted walk through the real game checking what Snd would play at each stop. Run:
//   node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/audio_game.js)"
// Logs the active beds (intended gains), fires, voices and music at each stop, and asserts sensible values. Needs a running or suspended AudioContext (headless Chrome has one).
const out = [], fails = []; const dt = 1 / 30, K = Snd, G = K.G;
const ok = (c, m) => { out.push((c ? 'pass ' : 'FAIL ') + m); if (!c) fails.push(m); };
game.step(2, dt); Env.dayLength = 0; await Foes.loading;
const names = []; const p0 = K.play; K.play = function (n) { names.push(n); return p0.apply(this, arguments); };
const spot = n => World.spots[n].p;
let maxV = 0;
const run = n => { for (let i = 0; i < n; i++) { game.step(1, dt); maxV = Math.max(maxV, K.vN); } };
const beds = () => { const o = {}; for (const k in K.beds) { const b = K.beds[k]; if (Array.isArray(b)) b.forEach((x, i) => { if (x.lvl > 0.002) o[k + i] = +x.lvl.toFixed(3); }); else if (b.lvl > 0.002) o[k] = +b.lvl.toFixed(3); } return o; };
const at = (label, x, z, hour, y) => { Env.hour = hour; npcSnapAll(); game.tp(x, z, 0, 0, y); run(45); const b = beds(); out.push(label + ' [' + G.zid + '/' + G.space + ' indoor ' + G.indoor.toFixed(2) + ' hour ' + hour + '] beds ' + JSON.stringify(b) + ' fires ' + G.fires.filter(f => f.on).length + ' riverD ' + G.riverD.toFixed(0) + ' forest ' + G.forest.toFixed(2) + ' nSq ' + G.nSquare + ' nInn ' + G.nInn + ' voices ' + K.vN); return b; };
ok(!!K.ctx, 'AudioContext exists (' + (K.ctx && K.ctx.state) + ')');
// 1. the square at noon
const sq = at('square noon', 6, -2, 12); ok((sq.crowd || 0) > 0.05, 'town murmur in the square by day');
const sqN = at('square night', 6, -2, 23.5); ok((sqN.crowd || 0) < (sq.crowd || 0) * 0.7, 'murmur thins at night (' + (sqN.crowd || 0) + ' vs ' + sq.crowd + ')');
// 2. into the inn in the evening
const inn = at('inn bar, evening', ...[spot('inn.bar')[0], spot('inn.bar')[2]], 20.5, spot('inn.bar')[1]);
ok(G.space === 'hall', 'inn is the hall reverb space'); ok((inn.river || 0) < 0.06, 'river is shut out of the inn'); ok((inn.inn || 0) > 0.02 || G.nInn < 2, 'inn murmur with ' + G.nInn + ' people');
ok(G.fires.some(f => f.on), 'a hearth fire is tracked indoors');
// 3. the river and the lake
const rp = River.p[Math.floor(River.p.length * 0.45)]; const rv = at('river bank', rp[0] + 3, rp[1] + 3, 11);
ok((rv.river || 0) > 0.1, 'river loud at the bank (' + rv.river + ')');
const lk = at('lake shore', LAKE.x, LAKE.z - LAKE.r - 2, 11); ok((lk.lake || 0) > 0.05, 'lake lapping at the shore');
// 4. the forest
let tr = null, best = -1; for (const t of World.vegInst.pine) { const r = Math.hypot(t[0], t[2]); if (r < 80 || r > 140) continue; let n = 0; for (const u of World.vegInst.pine) if (Math.abs(u[0] - t[0]) < 15 && Math.abs(u[2] - t[2]) < 15) n++; if (n > best) { best = n; tr = t; } } const fo = at('forest', tr[0] + 3, tr[2] + 3, 12); ok((fo.leaves || 0) > 0.02, 'leaf hiss in the forest (' + fo.leaves + ')'); ok(G.forest > 0.3, 'forest density read from the trees (' + G.forest.toFixed(2) + ')');
// 5. footsteps change with the surface
const surf = {}; const walk = (label, x, z, y) => { names.length = 0; game.tp(x, z, 90, 0, y); Input.keys.KeyW = true; run(110); Input.keys.KeyW = false; run(10); const s = names.filter(n => n.startsWith('fs.')); surf[label] = s.length ? s[s.length - 1] : 'none'; out.push('walk ' + label + ' -> ' + s.length + ' steps, last ' + surf[label]); return s.length; };
Env.hour = 12; const sqc = walk('square', 0, -2); walk('field', 105, -40); walk('inn floor', spot('inn.bar')[0] - 2, spot('inn.bar')[2], spot('inn.bar')[1]); walk('shallows', LAKE.x, LAKE.z - LAKE.r + 1.5);
ok(sqc > 3, 'player footsteps are triggered by the stride (' + sqc + ')'); ok(new Set(Object.values(surf)).size >= 3, 'footsteps differ by surface: ' + JSON.stringify(surf));
// 6. a door
names.length = 0; const d = World.doors[0]; game.tp(d.out[0], d.out[2], 0); Player.pos[1] = World.groundAt(d.out[0], d.out[2], 1e9); d.open = 0; d._so = 0; run(2); d.open = 0.5; run(2); ok(names.includes('door.open'), 'door opening is heard');
// 7. the fight
const camp = Foes.camps[0]; game.tp(camp.x + 9, camp.z + 6, 0); Env.hour = 17.5; run(10); let cue = ''; for (let i = 0; i < 240 && cue !== 'combat'; i++) { run(1); cue = K.music.cueName; Foes.list.forEach(f => { if (f.alive && f.state === 'idle') f.state = 'notice'; }); }
out.push('fight: music cue ' + cue + ', foes ' + Foes.list.filter(f => f.alive && f.state !== 'idle').length + ' awake'); ok(cue === 'combat' || cue === 'tension', 'music turns to tension or combat when enemies notice you (' + cue + ')');
// 8. music ducks under dialogue
run(5); K.busLevels(); const loud = K.dbg.music; UI.talk = NPC.greta; run(8); K.busLevels(); const duck = K.dbg.music; UI.talk = null; ok(duck < loud * 0.6, 'music ducks under dialogue (' + loud.toFixed(2) + ' -> ' + duck.toFixed(2) + ')');
ok(maxV <= 40, 'voice count stays under the limit (max ' + maxV + ')'); ok(K.err === 0, 'no engine errors ' + K.errMsg.slice(0, 200));
out.push(fails.length ? 'FAILED: ' + fails.length : 'AUDIO GAME TEST PASSED');
return out.join('\n');
