// The interaction layer (82b_interact.js), proven headless: containers that open, loose things that can be taken and stay gone, letters, theft and the cell,
// locks and picks, seats, the inn's bed and stew, what people say. usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/interact.js)"
Env.hour = 12;
const sleep = ms => new Promise(r => setTimeout(r, ms)), dt = 1 / 30, fails = [], log = [];
const fx = (c, m) => { if (!c) fails.push(m); };
const idle = async () => { for (let i = 0; i < 400 && Cells.busy; i++) await sleep(50); game.step(2, dt); };
const gcount = () => Object.values(S.items).reduce((a, b) => a + b, 0) + S.gold;
Env.dayLength = 0; Env.hour = 12; S.flags.bed = 1; game.step(2, dt); Env.hour = 3; npcSnapAll(); game.step(1, dt);       // everyone in bed, so nothing so far is theft
log.push('stats ' + JSON.stringify(IX.stats));
fx(IX.stats.cont >= 40, 'few containers: ' + IX.stats.cont); fx(IX.stats.loose >= 15, 'few loose things: ' + IX.stats.loose); fx(IX.stats.seat >= 15, 'few seats: ' + IX.stats.seat); fx(IX.stats.books >= 5, 'few letters: ' + IX.stats.books);
const cells = new Set(IX.cont.map(o => o.cell)); log.push('cells with containers ' + [...cells].join(','));
// ── a container: same contents every time, empty afterwards ──
const __w = ixWitness; ixWitness = () => null;  // nobody about: taking is free
const cont = IX.cont.find(o => o.loot.length && !o.locked && o.cell !== 'inn') || IX.cont.find(o => o.loot.length && !o.locked);
game.enter(cont.cell); await idle(); Player.pos = [cont.p[0], cont.p[1] - 0.9, cont.p[2] + 0.5];
{ const g0 = gcount(), l = interactLabel(cont); fx(l && /Search|Look|Open/.test(l), 'container label ' + l); interactUse(cont); fx(S.opened[cont.id], 'container not marked open'); fx(gcount() > g0, 'container gave nothing (' + JSON.stringify(cont.loot) + ')'); fx(interactLabel(cont) === 'Empty', 'an emptied container does not read Empty (' + interactLabel(cont) + ')'); log.push('opened ' + cont.id + ' ' + JSON.stringify(cont.loot)); }
{ const again = ixRoll(IX.LOOT.home, ixRng(ixHash('x')), 1, 1), again2 = ixRoll(IX.LOOT.home, ixRng(ixHash('x')), 1, 1); fx(JSON.stringify(again) === JSON.stringify(again2), 'loot is not deterministic'); }
// ── a loose thing: taken, gone, still gone after a save and a load ──
const lo = IX.loose.find(o => o.kind === 'loose' && o.item !== 'gold' && o.cell !== 'inn') || IX.loose.find(o => o.kind === 'loose' && o.cell !== 'inn') || IX.loose.find(o => o.kind === 'loose');
game.enter(lo.cell); await idle(); Player.pos = [lo.p[0], lo.p[1] - 0.9, lo.p[2] + 0.4];
{ const g0 = gcount(), vis0 = lo.obj.visible; fx(vis0, 'loose thing not visible before'); interactUse(lo); fx(gcount() > g0 && lo.gone && !lo.obj.visible, 'taking did not take / hide'); fx(interactLabel(lo) === null, 'taken thing still offered'); fx(!S.crime, 'a theft with nobody watching: ' + JSON.stringify(S.crime));
  save(); lo.gone = false; lo.obj.visible = true; applySave(loadSave()); fx(lo.gone && !lo.obj.visible, 'taken thing came back after a load'); log.push('took ' + lo.lid + ' (' + lo.item + ')'); }
// ── a letter ──
const bk = IX.loose.find(o => o.bookId); fx(bk, 'no letters placed');
if (bk) { game.enter(bk.cell); await idle(); Player.pos = [bk.p[0], bk.p[1] - 0.9, bk.p[2] + 0.4]; fx(/^Read/.test(interactLabel(bk)), 'letter label ' + interactLabel(bk)); interactUse(bk); fx(UI.reader && S.read[bk.bookId], 'letter did not open'); closeReader(); interactUse(bk); closeReader(); fx(!bk.gone, 'reading removed the letter'); log.push('read ' + bk.bookId); }
ixWitness = __w;
// ── theft: an awake person sees it; the guard comes; a night in the cell; out through the door ──
{ const lo2 = IX.loose.find(o => o.kind === 'loose' && !o.gone && o.owner); game.enter(lo2.cell); await idle(); Player.pos = [lo2.p[0], lo2.p[1] - 0.9, lo2.p[2] + 0.4];
  const w = NPC.marta === ixGuard() ? NPC.greta : NPC.marta; w.anim = 'idle'; w.pos = [Player.pos[0] + 2, Player.pos[1], Player.pos[2]];
  interactUse(lo2); fx(S.crime && S.crime.pending && S.crime.fine > 0, 'taking in front of someone was not a crime'); fx(has(lo2.item) || lo2.item === 'gold', 'did not get the item');
  S.crime.t = 0; ixTick(0.1); for (let i = 0; i < 200 && !UI.talk; i++) { game.step(6, dt); await sleep(50); } game.step(3, dt);
  fx(UI.talk && ['hale', 'ivo'].includes(UI.talk.id), 'the guard did not come to talk (' + (UI.talk && UI.talk.id) + ')');
  const btn = [...document.getElementById('dopts').children].find(b => /Go quietly/.test(b.textContent)); fx(btn, 'no "go quietly" option'); if (btn) btn.click(); await sleep(1500); await idle();
  fx(S.jail === 1 && World.cell && World.cell.id === 'guardhouse', 'not in the cell (' + (World.cell && World.cell.id) + ')'); fx(!S.crime, 'crime not cleared by the cell');
  const jd = World.interact.find(i => i.id === 'jail.door'); fx(jd && /guard|lock/i.test(interactLabel(jd) || ''), 'no way out of the cell: ' + (jd && interactLabel(jd)));
  if (jd) { S.items.lockpick = 0; delete S.items.lockpick; interactUse(jd); await sleep(1500); await idle(); fx(!World.cell && S.jail === 0, 'still in the cell after calling the guard'); } log.push('theft -> guard -> cell -> out'); }
// ── a lock on a door ──
{ const c = Cells.list.find(k => k.portalOut && k.id !== 'guardhouse'); IX.LOCKS[c.id] = { msg: 'Barred from inside.' }; ixApplyLocks(); delete S.items.lockpick;
  fx(Cells.lockMsg(c.portalOut) === 'Barred from inside.', 'a locked door opened without a key'); give('lockpick', 12); let opened = false; for (let i = 0; i < 12 && !opened; i++) opened = Cells.lockMsg(c.portalOut) === null; fx(opened, 'a pick never opened the door'); fx(Cells.lockMsg(c.portalOut) === null, 'an opened door shut again'); delete IX.LOCKS[c.id]; delete c.portalOut.lock; delete S.unlocked['door.' + c.id]; log.push('lock ' + c.id); }
// ── a seat ──
{ const s = IX.seat.find(x => x.cell === 'inn') || IX.seat[0]; game.enter(s.cell); await idle(); Player.pos = [s.p[0], s.p[1] - 0.5, s.p[2] + 0.6]; interactUse(s); fx(IX.sit && Player.eye < 1.4, 'did not sit'); game.step(2, dt); fx(Math.abs(Player.pos[0] - s.p[0]) < 0.1, 'not on the seat'); Input.keys.KeyW = true; ixTick(0.03); Input.keys = {}; fx(!IX.sit && Player.eye > 1.6, 'did not stand up when walking'); log.push('sat ' + s.id); }
// ── the inn: stew and a bed ──
{ game.leave && game.leave(); await idle(); S.flags.bed = 0; S.q.ale = { stage: 0, done: false }; S.gold = 40; RPG.st().hp = 30; const n = TALK.greta(), labels = n.o.map(o => o[0]); fx(labels.some(l => /stew/.test(l)) && labels.some(l => /bed for the night/.test(l)), 'no stew or bed on offer: ' + labels.join(' | '));
  n.o.find(o => /stew/.test(o[0]))[1](); fx(RPG.st().hp >= 69, 'stew did not heal'); n.o.find(o => /bed for the night/.test(o[0]))[1](); fx(S.flags.rent === RPG.st().day && S.gold === 33, 'bed not rented (' + S.gold + ')'); S.flags.bed = 1; }
// ── what people say ──
{ Env.hour = 23; delete NPC.brandt._said; const n = TALK.brandt(); fx(/late/.test(n.t), 'no comment at night: ' + n.t.slice(0, 60)); Env.hour = 12; S.gold = 200; delete NPC.maren._said; const m = TALK.maren(); fx(/jingling/.test(m.t), 'no comment on a full purse'); }
if (fails.length) throw new Error('INTERACT FAIL ' + JSON.stringify(fails));
return 'interact PASS ' + JSON.stringify(log);
