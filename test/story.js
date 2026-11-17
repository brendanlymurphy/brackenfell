// The main story, played start to end by script (Act 1: "Dry Lungs"), then the same steps in a different order on a second save.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/story.js)"
const sleep = ms => new Promise(r => setTimeout(r, ms)), dt = 1 / 30, fails = [], log = [];
const fx = (c, m) => { if (!c) fails.push(m); };
const opt = i => { const b = document.getElementById('dopts').children[i || 0]; if (b) b.click(); };
const talk = (id, ...picks) => { const n = NPC[id]; Player.pos = [n.pos[0] + 1, n.pos[1], n.pos[2]]; startTalk(n); for (const p of picks) opt(p); let g = 0; while (UI.talk && g++ < 8) { const kids = document.getElementById('dopts').children; kids[kids.length - 1].click(); } };
const use = id => { const it = World.interact.find(i => i.id === id); if (!it) { fails.push('no interact ' + id); return null; } const l = interactLabel(it); if (!l) fails.push('no label ' + id); interactUse(it); if (UI.reader) closeReader(); return it; };
const idle = async () => { for (let i = 0; i < 400 && Cells.busy; i++) await sleep(50); game.step(2, dt); };
Env.dayLength = 0; Env.hour = 10; game.step(2, dt);
// ── Act 1, in the intended order ──
fx(qAt('main') < 0, 'main quest started before the player did anything');
talk('hale', 0); fx(qAt('main') === 0, 'Hale did not start the story (' + qAt('main') + ')');
{ const it = World.interact.find(i => i.id === 'wharf.body'); fx(it && hyp(it.p[0] - 14.6, it.p[2] - 79.2) < 1, 'no body on the wharf'); }
use('wharf.body'); fx(has('tally'), 'no tally token from the body'); fx(qAt('main') === 1, 'stage after the body ' + qAt('main'));
fx(questTarget('main') && Math.abs(questTarget('main')[0] - NPC.maren.pos[0]) < 1, 'objective marker does not point at Maren');
talk('maren', 0, 0, 0); fx(S.flags.pell && qAt('main') === 2, 'Maren did not name the miner (stage ' + qAt('main') + ')');
{ const h = World.houses.chapel; const t = questTarget('main'); fx(t && Math.abs(t[0] - h.site.x) < 1, 'marker not at the chapel'); }
use('chapel.sacristy'); fx(has('cryptkey'), 'no crypt key'); use('chapel.gate'); fx(S.opened['chapel.gate'], 'crypt gate stayed shut'); use('chapel.relic');
fx(has('minekey') && has('lantern') && has('ledger'), 'the reliquary did not give the mine key, lantern and ledger: ' + JSON.stringify(S.items));
fx(qAt('main') === 3, 'stage after the key ' + qAt('main'));
log.push('act1 up to the mine door ok, stage ' + qAt('main'));
// ── the quest line on the journal: the main story is listed first and in one line ──
{ uiObjective(); const first = document.querySelector('#objective div'); fx(first && /Quiet Under/.test(first.textContent), 'journal does not list the main story first: ' + (first && first.textContent)); }
// ── out of order: a second life where the key comes before the body ──
{ const keep = JSON.stringify([S.flags, S.items, S.q, S.opened]); S.flags = { bed: 1 }; S.items = {}; S.q = {}; S.opened = {};
  give('minekey'); give('lantern'); mainStart(); fx(qAt('main') === 0, 'late start: first objective is ' + qAt('main'));
  use('wharf.body'); fx(qAt('main') === 1, 'out of order: body stage ' + qAt('main')); talk('maren', 0, 0, 0); fx(qAt('main') === 3, 'out of order: Maren should move the story to the mine (' + qAt('main') + ')');
  const [f, i, q, o] = JSON.parse(keep); S.flags = f; S.items = i; S.q = q; S.opened = o; }
// ── the Old Mine, by script: the door wants the key; the key opens it; down to the journal; the chest wants the Foreman's key; out by the cleft and back; the journal to Hale ──
{ const P0 = WILDS.P.mine, door = World.interact.find(i => i.id === 'door.mine.in'); fx(door && door.kind === 'portal', 'the mine door is not a portal');
  const A = siteToWorld(P0, 0, -0.5); game.tp(A[0], A[1], 0, 0); game.step(2, dt); fx(!World.cell, 'not outside at the mine');
  { const k = S.items.minekey; delete S.items.minekey; const f = S.flags.mineOpen; delete S.flags.mineOpen; fx(Cells.lockMsg(door), 'the barred door opened without the key'); S.items.minekey = k; S.flags.mineOpen = f; }
  fx(!Cells.lockMsg(door), 'the key did not open the door'); fx(S.flags.mineOpen, 'mineOpen not set'); Cells.use(door); await sleep(300); await idle(); fx(World.cell && World.cell.id === 'mine', 'did not go down into the mine');
  fx(qAt('main') === 4, 'stage in the mine ' + qAt('main')); fx(has('lantern'), 'no lantern'); log.push('mine entered by the door, stage ' + qAt('main'));
  const mc = Cells.by.mine, O = mc.origin, FY = mc.floorY, at = (x, z, y) => { Cells.teleport({ p: [O[0] + x, FY + (y || 0.1), O[2] + z], yaw: 0, cell: 'mine' }); game.step(3, dt); };
  fx(questTarget('main') && hyp(questTarget('main')[0] - (O[0] - 9.4), questTarget('main')[2] - (O[2] + 66.2)) < 3, 'marker in the mine is not at the journal');
  // the chest: shut to a man without the Foreman's key
  at(-12.2, 54); { const ch = World.interact.find(i => i.id === 'mine.chest'); interactUse(ch); fx(!S.opened['mine.chest'], 'the strongbox opened without the key'); give('foremankey'); interactUse(ch); fx(S.opened['mine.chest'] && has('silverthread'), 'the strongbox gave no Silverthread'); fx(ITEMS.silverthread[2].dmg > ITEMS.steelsword[2].dmg, 'Silverthread is not better than the best sword'); log.push('strongbox -> Silverthread'); }
  at(-9.4, 65.6); use('mine.journal'); fx(has('journal') && S.flags.corwin, 'no journal'); fx(qAt('main') === 5, 'stage after the journal ' + qAt('main')); log.push('journal taken, stage ' + qAt('main'));
  // the second way out comes out above the Hermit's Pool, and goes back in
  at(-33.5, 60, 3.5); { const ex = World.interact.find(i => i.id === 'door.mine.cleft'); Cells.use(ex); await sleep(300); await idle(); fx(!World.cell && hyp(Player.pos[0] - 27.5, Player.pos[2] + 180.8) < 4, 'the cleft did not come out above the pool: ' + Player.pos.map(v => +v.toFixed(1)));
    fx(Player.pos[1] > 3.9, 'above the pool is not high up (' + Player.pos[1].toFixed(1) + ')'); const back = World.interact.find(i => i.id === 'door.mine.cleft.in'); fx(hyp(back.p[0] - Player.pos[0], back.p[2] - Player.pos[2]) < 4, 'no way back into the cleft ' + back.p.map(v => +v.toFixed(1)) + ' vs ' + Player.pos.map(v => +v.toFixed(1))); Cells.use(back); await sleep(300); await idle(); fx(World.cell && World.cell.id === 'mine', 'the cleft did not lead back in'); log.push('cleft out and in'); }
  at(0, 2.6); { const out = World.interact.find(i => i.id === 'door.mine.out'); Cells.use(out); await sleep(300); await idle(); fx(!World.cell && hyp(Player.pos[0] - A[0], Player.pos[2] - A[1]) < 3, 'the main door did not lead out ' + Player.pos.map(v => +v.toFixed(1))); }
  talk('hale', 0, 0); fx(S.flags.act1, 'Hale did not close Act 1'); fx(qAt('main') === 6, 'stage after Hale ' + qAt('main')); log.push('journal to Hale: act 1 done'); }

// ── Acts 2 and 3: Rowan tells it, the Hart's wall, the smugglers' tunnel, the Bread Cave, both endings ──
{ const O2 = Cells.by.mine.origin, FY2 = Cells.by.mine.floorY, at2 = async (x, z, yaw) => { Cells.teleport({ p: [O2[0] + x, FY2 + 0.1, O2[2] + z], yaw: (yaw || 0) * Math.PI / 180, cell: 'mine' }); await sleep(250); await idle(); };
  Foes.calm(true); S.flags.act1 = 1; talk('rowan', 0); fx(S.flags.rowanAsked, 'Rowan: first visit did not set rowanAsked'); fx(!S.flags.act2, 'Rowan told it all on the first visit');
  { const n = TALK.rowan(); fx(/Tomorrow/.test(n.t) && !S.flags.act2, 'Rowan tells the rest on the same day he said "not today"'); fx(/tomorrow/.test(questLine('main')), 'the journal does not say to come back tomorrow: ' + questLine('main')); RPG.st().day = (RPG.st().day || 0) + 1; }
  talk('rowan', 0, 0, 0); fx(S.flags.act2, 'Rowan did not start Act 2'); fx(qAt('main') === 7, 'stage after Rowan ' + qAt('main')); log.push('act 2: Rowan told it');
  { const t = questTarget('main'); fx(t && hyp(t[0], t[2] + 17) < 8, 'marker at stage 7 not at the Hart ' + t); }
  const wall = World.interact.find(i => i.id === 'sec.wall'); fx(wall, 'no wall secret'); interactUse(wall); if (UI.reader) closeReader(); fx(S.opened['sec.wall'] && S.flags.sec_wall, 'wall did not open once Rowan had spoken');
  const tin = World.interact.find(i => i.id === 'door.tunnel.in'); fx(interactLabel(tin), 'no label on the smugglers’ door after the wall is open'); Cells.use(tin); await sleep(300); await idle(); fx(World.cell && World.cell.id === 'mine', 'the tunnel door did not lead into the mine cell (' + (World.cell && World.cell.id) + ')');
  fx(hyp(Player.pos[0] - (O2[0] + 63), Player.pos[2] - (O2[2] - 30)) < 3, 'arrival not at the tunnel mouth ' + Player.pos.map(v => +v.toFixed(1))); game.step(3, dt); fx(S.flags.tunnel && qAt('main') === 8, 'tunnel not entered (' + qAt('main') + ')'); log.push('through the Hart wall, stage ' + qAt('main'));
  await at2(63, -30, -90); Player.yaw = -Math.PI / 2; for (let i = 0; i < 1600 && Player.pos[0] > O2[0] - 36; i++) { Input.keys.KeyW = true; game.step(1, dt); } Input.keys = {}; const wx = Player.pos[0] - O2[0]; fx(wx < -35, 'the tunnel could not be walked to the cave: stopped at x ' + wx.toFixed(1) + ' z ' + (Player.pos[2] - O2[2]).toFixed(1)); log.push('tunnel walked to x ' + wx.toFixed(0));
  game.step(3, dt); fx(S.flags.cave && qAt('main') === 9, 'cave not reached (' + qAt('main') + ', flag ' + S.flags.cave + ', x ' + (Player.pos[0] - O2[0]).toFixed(1) + ', A2 ' + A2.built + ')');
  await at2(-69, -30, -90); { const out = World.interact.find(i => i.id === 'door.cave.out'); Cells.use(out); await sleep(300); await idle(); fx(!World.cell && hyp(Player.pos[0] + 46, Player.pos[2] - 122) < 6, 'the cave did not come out on the west shore ' + Player.pos.map(v => +v.toFixed(1))); const cin = World.interact.find(i => i.id === 'door.cave.in'); fx(cin && hyp(cin.p[0] - Player.pos[0], cin.p[2] - Player.pos[2]) < 5, 'no way back into the cave from the shore'); Cells.use(cin); await sleep(300); await idle(); fx(World.cell && World.cell.id === 'mine' && Player.pos[0] - O2[0] < -60, 'the shore door did not lead into the cave: ' + (World.cell && World.cell.id) + ' ' + Player.pos.map(v => +v.toFixed(1)) + ' want x ' + (O2[0] + 128)); log.push('shore both ways'); }
  for (const kind of ['bread', 'rest']) {
    S.flags.ending = 0; A2.shown = ''; S.items.bread = 3; S.q.main = { stage: 9, done: false, t: 0 }; mainSync(); await at2(-52, -27, 0); const slab = World.interact.find(i => i.kind === 'slab'); fx(interactLabel(slab), 'no slab label'); interactUse(slab); fx(UI.talk && UI.talk.id === 'hollow', 'the slab did not open a dialogue'); const n = TALK.hollow(); fx(n.o.length >= 3, 'the choice has fewer than two options');
    const g0 = S.gold; const o = n.o.find(o => kind === 'bread' ? /Leave the bread/.test(o[0]) : /names/.test(o[0])); o[1](); if (UI.reader) closeReader(); fx(S.flags.ending === kind, 'ending not set: ' + kind); game.step(3, dt);
    fx(qAt('main') === 99, 'main quest not finished after ' + kind + ' (' + qAt('main') + ')'); if (kind === 'bread') { fx(S.gold === g0 + 150 && (S.items.bread || 0) === 0, 'bread ending pay/cost'); fx(A2.candles.every(c => c.always) && A2.loaves.visible, 'the Wharf does not show the bread ending'); fx(!A2.cairn.visible, 'cairn shown in the bread ending'); }
    else { fx(has('silverbar') && S.items.silverbar >= 5, 'rest ending gave no silver'); fx(A2.cairn.visible && A2.lant.every(l => l.always) && !A2.loaves.visible && A2.candles.every(c => !c.always), 'the village does not show the rest ending'); fx(Cells.by.mine.portalOut.lock() === null, 'the mine door is not open after the rest ending'); fx(Foes.list.filter(f => f.camp && f.camp.cell === 'mine').every(f => f.state === 'gone'), 'the dead are not at rest'); }
    log.push('ending ' + kind + ' ok'); }
  S.flags.ending = 'bread'; { const n = TALK.rowan(); fx(/count stays kept/.test(n.t), 'Rowan does not speak of the bread ending'); } S.flags.ending = 'rest'; { const n = TALK.rowan(); fx(/asleep/.test(n.t), 'Rowan does not speak of the rest ending'); }
}

if (fails.length) throw new Error('STORY FAIL ' + JSON.stringify(fails));
return 'story PASS ' + JSON.stringify(log);
