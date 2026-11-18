// Sparks and smoke stay in their own room. In every interior that has a fire, and outdoors by the bonfire and the torches under galleries: run the particles
// for 20 s and fail if any ember or wisp of indoor smoke is above the underside of what is over its flame (the owner's picture: embers in the room above the hearth).
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/embers.js)"
const bad = [], dt = 1 / 30, r1 = v => +v.toFixed(1); let cells = 0, flames = 0, seen = 0;
const ceilOf = e => { const c = World.ceilingAt(e.p[0], e.p[2], e.p[1] + 0.2, e.p[1] + 14); return c === null ? 1e9 : c; };
const run = (where) => { const fires = World.emitters.filter(e => (e.type === 'fire' || e.type === 'bonfire' || (e.type === 'smoke' && e.indoor)) && (e.cell || null) === (World.cell ? World.cell.id : null)); if (!fires.length) return; flames += fires.length;
  FX.embers.length = 0; FX.smoke.length = 0; let worst = null;
  for (let i = 0; i < 600; i++) { game.time += dt; fxUpdate(dt, game.time, updateEnv(game.time, World.indoor), R.cam.pos);
    for (const s of FX.embers.concat(FX.smoke.filter(q => q.ind))) { seen++; let near = null, nd = 1e9; for (const e of fires) { if (e.p[1] > s.p[1] + 0.3) continue; const d = Math.hypot(e.p[0] - s.p[0], e.p[2] - s.p[2]) + (s.p[1] - e.p[1]) * 0.5; if (d < nd) { nd = d; near = e; } } if (!near) continue;       /* its own flame: the nearest one below it (two hearths stand one over the other on two floors) */ const c = ceilOf(near); if (s.p[1] > c + 0.02 && (!worst || s.p[1] - c > worst.over)) worst = { over: s.p[1] - c, at: s.p.map(r1), flame: near.p.map(r1) }; } }
  if (worst) bad.push(where + ': a spark or wisp ' + worst.over.toFixed(2) + ' m above the ceiling over its flame, at ' + worst.at + ' (flame at ' + worst.flame + ')'); };
World.bonfire = true; Env.dayLength = 0; Env.hour = 21;
const WHICH = (window.__embersCells || 'inn,smithy,store,elder,herbalist,guardhouse,weaver,chapel,mill,farm,hunter,fisher,draper,in.02,in.07,in.40').split(',');       // interiors are built when first entered: the named buildings and three ordinary houses
for (const id of WHICH) { const c = Cells.by[id]; if (!c) continue; game.enter(c.id); game.step(2, dt); if (!World.emitters.some(e => e.cell === c.id && (e.type === 'fire' || (e.type === 'smoke' && e.indoor)))) { game.leave(); continue; } const f = World.emitters.find(e => e.cell === c.id && e.type === 'fire') || World.emitters.find(e => e.cell === c.id); Cells.teleport({ p: [f.p[0] + 1.5, f.p[1], f.p[2]], yaw: 0 }); game.step(2, dt); cells++; run(c.id); }
if (World.cell) game.leave(); game.tp(0, null, -6); game.step(2, dt); run('outdoors');
if (cells < 8) bad.push('only ' + cells + ' interiors with a fire were checked');
if (bad.length) throw new Error('EMBERS FAIL ' + bad.length + ': ' + JSON.stringify(bad.slice(0, 8)));
return 'embers PASS ' + cells + ' interiors with a fire, ' + flames + ' flames, ' + seen + ' particle positions looked at: none above its own ceiling';
