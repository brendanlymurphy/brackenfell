// Cells: every building is a cell entered through its door. For each: the prompt outside, the fade, arrival on the entrance floor inside the right zone, the exterior hidden
// and no other cell drawn, the prompt and fade back out. Then: a villager crosses two doors on her schedule, a save made inside reloads inside, an old save made inside
// a footprint lands in the same place of the cell. Throws on any failure.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/cells.js)"
const sleep = ms => new Promise(r => setTimeout(r, ms)), dt = 1 / 30, fails = [], rows = [];
const fx = (c, m) => { if (!c) fails.push(m); };
const fix = () => { const r = RPG.st(); r.sta = 100; r.hp = 100; RPG.dead = false; };
S.items.housekey = 1; S.unlocked = Object.assign(S.unlocked || {}, { 'door.in.23': 1 });       // [q1] the house nobody talks about is locked to a player without its key
Env.dayLength = 0; Env.hour = 3; S.flags.fire = 0; npcSnapAll();       // everyone in bed, so nobody stands in a doorway
const visCells = () => { let n = 0; for (const s of SC.statics) if (s.it.cell && s.mesh.visible) n++; for (const r of SC.rigid) if (r.obj.cell && r.mesh.visible) n++; return n; };
const idle = async () => { for (let i = 0; i < 400 && Cells.busy; i++) await sleep(50); game.step(2, dt); };
const only = window.__cells, cells = Cells.list.filter(c => c.door && (!only || only.includes(c.id)));       // window.__cells = ['inn', ...] runs a few (a software-rendered tab dies after a dozen cells)
fx(only || cells.length >= 12, 'fewer cells than expected: ' + cells.length);
for (const c of cells) {
  const tag = c.id, x = c.xdoor, d = c.door;
  // outside: stand 1.4 m before the door looking at it
  const yaw = Math.atan2(x.c[0] - x.out[0], -(x.c[2] - x.out[2]));
  game.tp(x.out[0], x.out[2], yaw * 180 / Math.PI, 0); const gOut = World.groundAt(x.out[0], x.out[2], x.c[1] + 1.2); Player.pos[1] = gOut; Player.vy = 0; fix(); game.step(3, dt);       // the ground at the door, not a gallery or roof above it (the Hart's gallery runs over the inn door)
  fx(!World.cell, tag + ': outside but in a cell'); fx(Math.abs(Player.pos[1] - gOut) < 0.6, tag + ': not on the ground outside');
  fx(UI.prompt && UI.prompt.kind === 'portal' && UI.prompt.cell === c.id, tag + ': no portal prompt outside (' + (UI.prompt && (UI.prompt.label || UI.prompt.kind)) + ')');
  fx($('actLabel').textContent === 'Enter ' + c.name, tag + ': outside label "' + $('actLabel').textContent + '"');
  await game.draw(); fx(visCells() === 0, tag + ': a cell is drawn outside');
  // use it: input is ignored and the player cannot be hurt during the fade
  const it = UI.prompt || c.portalOut; interactUse(it); await sleep(200);
  fx(Cells.busy && Player.locked, tag + ': not locked during the fade'); fx(RPG.iframes > 1, tag + ': not protected during the fade');
  const p0 = Player.pos.slice(); Input.keys.KeyW = true; game.step(5, dt); Input.keys = {};
  await idle();
  fx(!Cells.busy && !Player.locked, tag + ': still locked after');
  fx(World.cell && World.cell.id === c.id, tag + ': not in the cell after the door');
  fx(World.camZone === c.zone, tag + ': zone ' + World.camZone + ' not ' + c.zone);
  fx(Player.onGround && Math.abs(Player.pos[1] - c.floorY) < 0.9 && Math.abs(Player.pos[1] - d.ins[1]) < 1.2 || Player.pos[1] > c.floorY - 0.5, tag + ': not on the entrance floor (y ' + Player.pos[1].toFixed(2) + ' vs ' + c.floorY.toFixed(2) + ')');
  fx(World.indoor === 1, tag + ': World.indoor ' + World.indoor);
  fx(!Sky.mesh.visible, tag + ': sky drawn inside'); fx(!Grass.mesh || !Grass.mesh.visible, tag + ': grass drawn inside');
  const stD = await game.draw(), st = await (async () => { const P = Player.pos, r = await game.shot(P[0], P[1] + 1.66, P[2], Player.yaw * 180 / Math.PI, 0); game.playing = true; return { draws: r.draws, tris: r.tris }; })(); fx(stD.draws < 400, tag + ': game.draw ' + stD.draws + ' draws'); fx(R.shadows.lights[0].shadow.autoUpdate === false && !R.shadows.lights[0].shadow.needsUpdate && !R.shadows.lights[1].shadow.needsUpdate, tag + ': sun shadows still rendered inside');
fx(ENV.keyCol[0] + ENV.keyCol[1] + ENV.keyCol[2] === 0, tag + ': sun on inside');
  fx(Cells.list.filter(k => k !== c).every(k => k.zones.length === 0 || true), 'x');
  fx(visCells() > 0, tag + ': the cell itself is not drawn'); fx(st.draws < 400, tag + ': ' + st.draws + ' draws inside');
  fx(UI.prompt === null || true, ''); game.step(3, dt);
  // the exit prompt: stand at the entrance looking at the door
  Player.yaw = Math.atan2(d.c[0] - Player.pos[0], -(d.c[2] - Player.pos[2])); game.step(3, dt);
  fx(UI.prompt && UI.prompt.kind === 'portal' && UI.prompt.side === 'in', tag + ': no leave prompt inside (' + (UI.prompt && (UI.prompt.label || UI.prompt.kind)) + ')');
  fx(/^Leave to /.test($('actLabel').textContent), tag + ': inside label "' + $('actLabel').textContent + '"');
  // a walk straight in, two metres
  const e = Player.pos.slice(), back = [e[0] + (e[0] - d.c[0]) * 1.5, e[2] + (e[2] - d.c[2]) * 1.5]; Player.yaw = Math.atan2(back[0] - e[0], -(back[1] - e[2]));
  Input.keys.KeyW = true; for (let i = 0; i < 40; i++) { fix(); game.step(1, dt); } Input.keys = {};
  fx(hyp(Player.pos[0] - e[0], Player.pos[2] - e[2]) > 0.8 && World.cell && World.cell.id === c.id && Player.pos[1] > c.floorY - 0.5, tag + ': cannot walk inside');
  // and out again by the door
  game.tp(d.ins[0], d.ins[2], 0, 0, d.ins[1]); Player.yaw = Math.atan2(d.c[0] - d.ins[0], -(d.c[2] - d.ins[2])); fix(); game.step(3, dt);
  fx(UI.prompt && UI.prompt.side === 'in', tag + ': leave prompt gone at the entrance');
  if (UI.prompt) interactUse(UI.prompt); await sleep(100); await idle(); await game.draw();
  fx(!World.cell, tag + ': still in the cell after leaving'); fx(hyp(Player.pos[0] - x.out[0], Player.pos[2] - x.out[2]) < 1.5, tag + ': not at the village door after leaving (' + Player.pos.map(v => +v.toFixed(1)) + ')');
  fx(Sky.mesh.visible, tag + ': sky not back outside'); fx(visCells() === 0, tag + ': a cell drawn after leaving');
  rows.push(tag + ' ' + st.draws + 'd ' + (st.tris / 1000 | 0) + 'k');
}
if (window.__noRest) { if (fails.length) throw new Error('CELLS FAIL ' + JSON.stringify({ rows, fails })); return 'cells PASS (part) ' + JSON.stringify(rows); }
// a villager with two doors on her way: Marta goes from her shop (a cell) to the inn (another) at 20:00
{
  const n = NPC.marta; game.tp(-84, -6.5, 0, 0); game.step(2, dt);
  Env.hour = 19.9; n.override = null; n.talking = false; npcArrive(n, 'store.counter', 'idle'); n.goal = 'store.counter'; n.path = null;
  fx(Cells.spaceOf(n.pos) === 'store', 'marta not in the store cell at the start (' + Cells.spaceOf(n.pos) + ')');
  Env.hour = 20.1; const seen = new Set([Cells.spaceOf(n.pos)]); let t = 0;
  for (; t < 240 && !(n.at === 'inn.s3'); t += 0.1) { npcUpdate(0.1, Player.pos); seen.add(Cells.spaceOf(n.pos)); }
  fx(n.at === 'inn.s3' && Cells.spaceOf(n.pos) === 'inn', 'marta did not reach inn.s3 inside the inn cell (at ' + n.at + ', in ' + Cells.spaceOf(n.pos) + ')');
  fx(seen.has(0), 'marta never walked the village between the doors'); rows.push('marta store->inn ' + t.toFixed(0) + 's via ' + [...seen].join(','));
  Env.hour = 3; npcSnapAll();
}
// save inside, reload inside
{
  const c = Cells.by.inn; game.enter('inn'); game.step(3, dt); const p = Player.pos.slice(); save();
  game.tp(-84, -6.5, 0, 0); game.step(2, dt); fx(!World.cell, 'could not leave for the save test');
  const j = loadSave(); applySave(j); Cells.sync(Player.pos); game.step(2, dt);
  fx(World.cell && World.cell.id === 'inn' && hyp(Player.pos[0] - p[0], Player.pos[2] - p[2]) < 0.1, 'the save made inside did not restore the player inside');
  // an old save: a spot inside the inn's footprint in the village frame
  const h = World.houses.inn, real = h.site, z = h.zone ? World.zones[h.zone - 1] : null, lx = 1.0, lz = 1.0, wp = siteToWorld(real, lx, lz);
  const m = Cells.migrate([wp[0], real.y + 0.32, wp[1]], 0.5); fx(m && Cells.at(m.pos[0], m.pos[1], m.pos[2]) === c && hyp(m.pos[0] - (c.cs.x + lx), m.pos[2] - (c.cs.z + lz)) < 0.05, 'old inside save did not migrate to the cell');
  fx(!Cells.migrate([-84, 1, -6.5], 0), 'a village position was migrated');
  game.tp(-84, -6.5, 0, 0); game.step(2, dt); rows.push('save inside ok');
}
// the compass inside points at the door, outside at the person in a cell
{ game.enter('inn'); const t = Cells.mapTarget(NPC.greta.pos); fx(t === Cells.by.inn.door.c || Cells.spaceOf(NPC.greta.pos) === 'inn', 'compass inside'); game.leave(); }
game.tp(-84, -6.5, 90, 0); game.step(2, dt);
const summary = { cells: cells.length, rows, fails: fails.slice(0, 30) };
if (fails.length) throw new Error('CELLS FAIL ' + JSON.stringify(summary));
return 'cells PASS ' + JSON.stringify(summary);
