// The interaction layer (82b_interact.js), proven headless: containers that open, loose things that can be taken and stay gone, letters, theft and the cell,
// locks and picks, seats, the inn's bed and stew, what people say. usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/interact.js)"
Env.hour = 12;
const sleep = ms => new Promise(r => setTimeout(r, ms)), dt = 1 / 30, fails = [], log = [];
const fx = (c, m) => { if (!c) fails.push(m); };
const idle = async () => { for (let i = 0; i < 400 && Cells.busy; i++) await sleep(50); game.step(2, dt); };
const gcount = () => Object.values(S.items).reduce((a, b) => a + b, 0) + S.gold;
if (typeof OWN !== 'undefined') OWN.off = true;       /* [cast] this tests theft, not trespass: it works inside houses at three in the morning, where the owners would show it the door */
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
  const w = NPC.marta === ixGuard() ? NPC.greta : NPC.marta; w.anim = 'idle'; w.pos = [Player.pos[0] + 2, Player.pos[1], Player.pos[2]]; for (const o of [[2, 0], [-2, 0], [0, 2], [0, -2], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) { w.pos = [Player.pos[0] + o[0], Player.pos[1], Player.pos[2] + o[1]]; if (ixWitness()) break; }       /* [coordinator, Build 84] the witness stands where she can see: 2 m east is behind a shelf in the rebuilt Quill's */
  interactUse(lo2); fx(S.crime && S.crime.pending && S.crime.fine > 0, 'taking in front of someone was not a crime'); fx(has(lo2.item) || lo2.item === 'gold', 'did not get the item');
  S.crime.t = 0; ixTick(0.1); for (let i = 0; i < 900 && !UI.talk; i++) { game.step(6, dt); await sleep(50); } game.step(3, dt);       /* [gate] waits for the guard, up to 45 s of real time on a slow machine (was 10 s: the fade is real time) */
  fx(UI.talk && ['hale', 'ivo'].includes(UI.talk.id), 'the guard did not come to talk (' + (UI.talk && UI.talk.id) + ')');
  const btn = [...document.getElementById('dopts').children].find(b => /Go quietly/.test(b.textContent)); fx(btn, 'no "go quietly" option'); if (btn) btn.click(); for (let i = 0; i < 600 && !(S.jail === 1 && World.cell && World.cell.id === 'guardhouse'); i++) await sleep(50); await sleep(400); await idle();
  fx(S.jail === 1 && World.cell && World.cell.id === 'guardhouse', 'not in the cell (' + (World.cell && World.cell.id) + ')'); fx(!S.crime, 'crime not cleared by the cell');
  const jd = World.interact.find(i => i.id === 'jail.door'); fx(jd && /guard|lock/i.test(interactLabel(jd) || ''), 'no way out of the cell: ' + (jd && interactLabel(jd)));
  if (jd) { S.items.lockpick = 0; delete S.items.lockpick; interactUse(jd); for (let i = 0; i < 600 && !(S.jail === 0 && !World.cell); i++) await sleep(50); await sleep(400); await idle(); fx(!World.cell && S.jail === 0, 'still in the cell after calling the guard'); } log.push('theft -> guard -> cell -> out'); }
// ── a lock on a door ──
{ const c = Cells.list.find(k => k.portalOut && k.id !== 'guardhouse'); IX.LOCKS[c.id] = { msg: 'Barred from inside.' }; ixApplyLocks(); delete S.items.lockpick;
  fx(Cells.lockMsg(c.portalOut) === 'Barred from inside.', 'a locked door opened without a key'); give('lockpick', 12); let opened = false; for (let i = 0; i < 12 && !opened; i++) opened = Cells.lockMsg(c.portalOut) === null; fx(opened, 'a pick never opened the door'); fx(Cells.lockMsg(c.portalOut) === null, 'an opened door shut again'); delete IX.LOCKS[c.id]; delete c.portalOut.lock; delete S.unlocked['door.' + c.id]; log.push('lock ' + c.id); }
// ── a seat ──
{ const s = IX.seat.find(x => x.cell === 'inn') || IX.seat[0]; game.enter(s.cell); await idle(); Player.pos = [s.p[0], s.p[1] - 0.5, s.p[2] + 0.6]; interactUse(s); fx(IX.sit && Player.eye < 1.4, 'did not sit'); game.step(2, dt); fx(Math.abs(Player.pos[0] - s.p[0]) < 0.1, 'not on the seat'); Input.keys.KeyW = true; ixTick(0.03); Input.keys = {}; fx(!IX.sit && Player.eye > 1.6, 'did not stand up when walking'); log.push('sat ' + s.id); }
// ── the inn: stew and a bed ──
{ game.leave && game.leave(); await idle(); S.flags.bed = 0; S.q.ale = { stage: 0, done: false }; S.gold = 40; RPG.st().hp = 30; const n = TALK.greta(), labels = n.o.map(o => o[0]); fx(labels.some(l => /stew/.test(l)) && labels.some(l => /bed for the night/.test(l)), 'no stew or bed on offer: ' + labels.join(' | '));
  n.o.find(o => /stew/.test(o[0]))[1](); fx(RPG.st().hp >= 69, 'stew did not heal'); n.o.find(o => /bed for the night/.test(o[0]))[1](); fx(S.flags.rent === RPG.st().day && S.gold === 33, 'bed not rented (' + S.gold + ')'); S.flags.bed = 1; }
// ── what people say ──
// a remark comes only before a line he has already said to you, never before one you have not heard, and as a paragraph of its own
{ Env.hour = 23; delete NPC.brandt._said; delete NPC.brandt._heard; const n0 = TALK.brandt(); fx(!/about late/.test(n0.t), 'a remark in front of a line not yet heard: ' + n0.t.slice(0, 60)); if (typeof Memory !== 'undefined') Memory.hear('brandt', n0.t);       /* a line counts as heard when it has been shown (82a_memory.js); the test calls TALK directly, so it says so itself */ const n = TALK.brandt(); fx(/^You’re about late\. Mind the dark\.\n\n/.test(n.t), 'no comment at night: ' + n.t.slice(0, 60)); Env.hour = 12; S.gold = 200; delete NPC.maren._said; delete NPC.maren._heard; { const m0 = TALK.maren(); if (typeof Memory !== 'undefined') Memory.hear('maren', m0.t); } const m = TALK.maren(); fx(/jingling/.test(m.t), 'no comment on a full purse'); }
// the crypt gate: shut while locked, and once the key has turned the leaf swings open and stays open (it stayed drawn shut: the player is not counted in the leaves' who-is-near test)
{ const d = World.doors.find(d => d.gate), it = d && World.interact.find(i => i.kind === 'gate' && i.id === d.gate), run = n => { for (let i = 0; i < n; i++) updateDynamics(1 / 30, [[0, -99, 0]]); return d.open; };
  if (!d || !it) fx(false, 'no gate leaf under the chapel'); else { delete S.opened[d.gate]; fx(run(90) === 0, 'a locked gate opens'); give('cryptkey'); interactUse(it); fx(run(90) === 1, 'the gate stays shut after the key has turned: ' + d.open); fx(World.colliders.indexOf(it.col) < 0, 'the unlocked gate still blocks'); const q = [it.p[0], it.p[1] - 1.1, it.p[2]], q0 = q.slice(); colResolve(q, 0.3, q[1], q[1] + 1.75); fx(Math.hypot(q[0] - q0[0], q[2] - q0[2]) < 0.02, 'a body standing in the unlocked gateway is pushed out of it (the collision grid still holds the gate): ' + Math.hypot(q[0] - q0[0], q[2] - q0[2]).toFixed(2) + ' m'); } }
if (fails.length) throw new Error('INTERACT FAIL ' + JSON.stringify(fails));
return 'interact PASS ' + JSON.stringify(log);
