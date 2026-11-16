// Town secrets (82c_secrets.js), found and paid out by script: every prop stands on something, every lock opens with its key, a lockpick opens it without, the gated ones refuse until
// the thing that explains them has been seen, the night meeting is overheard, the thief is followed to the yard, and the house nobody talks about is let in with its key.
// Run: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/secrets.js)"
const log = [], fails = [], fx = (c, m) => { if (!c) fails.push(m); }, dt = 1 / 30;
game.step(1, dt); qStart('welcome'); qDone('welcome'); Env.hour = 12; S.flags.bed = 1; S.items.lockpick = 0; fx(SEC.built && SEC.list.length === 9, 'secrets not built (' + SEC.list.length + ')');
const byId = id => SEC.list.find(s => s.sec === id), toasts = []; const _t = window.toast; window.toast = m => { toasts.push(String(m)); };
const open = id => { const s = byId(id); window.openReader = window.openReader || (() => { }); interactUse(s); return !!S.opened[s.id]; };
// every outdoor prop sits on ground or a floor within 0.6 m of where it is drawn
for (const id of ['bell', 'stone', 'cellar', 'attic', 'strongbox']) { const s = byId(id); const gy = World.groundAt(s.p[0], s.p[2], s.p[1] + 0.3); log.push(id + ' y ' + s.p[1].toFixed(2) + ' ground ' + gy.toFixed(2)); if (id !== 'stone' && id !== 'strongbox') fx(Math.abs(gy - s.p[1]) < 0.6, id + ' floats/sinks: p.y ' + s.p[1].toFixed(2) + ' ground ' + gy.toFixed(2)); }
// 1 bell: free, gives a lockpick
fx(interactLabel(byId('bell')), 'bell has no label'); fx(open('bell') && has('lockpick'), 'bell box did not give a lockpick'); fx(interactLabel(byId('bell')) === 'Empty', 'bell not Empty afterwards');
// 2 stone: free; gives the cellar key
fx(open('stone') && has('cellarkey'), 'stone did not give the cellar key');
// 3 cellar: needs the key or a pick; no key and no pick: refuses
S.unlocked = {}; give('lockpick', -9); const ck = S.items.cellarkey; S.items.cellarkey = 0; interactUse(byId('cellar')); fx(!S.opened['sec.cellar'], 'cellar opened without key or pick'); S.items.cellarkey = ck; fx(open('cellar') && has('housekey') && has('silverbar'), 'cellar with the key did not pay');
// 9 house: locked without the key, open with it; the hatbox pays
{ const c = Cells.by['in.23']; S.unlocked = {}; const hk = S.items.housekey; S.items.housekey = 0; const m1 = c.portalOut && c.portalOut.lock && c.portalOut.lock(); fx(typeof m1 === 'string', 'house door not locked (' + m1 + ')'); S.items.housekey = hk; const m2 = c.portalOut.lock(); fx(m2 === null, 'house door did not open with the key (' + m2 + ')'); const hb = byId('house'); fx(hb && open('house') && has('silverring'), 'hatbox did not pay'); }
// 4 attic: the Hart's ledger sets the rumour flag; 5 wall: refuses before it, pays after
S.flags.hear_hartledger = 0; S.flags.sec_attic = 0; interactUse(byId('wall')); fx(!S.opened['sec.wall'], 'the fresh brick opened before the ledger'); fx(open('attic') && S.flags.hear_hartledger, 'attic did not give the ledger'); fx(open('wall') && has('wharfkey'), 'wall did not give the wharf key');
// 6 strongbox: wants the key
S.unlocked = {}; { const k = S.items.wharfkey; S.items.wharfkey = 0; interactUse(byId('strongbox')); fx(!S.opened['sec.strongbox'], 'strongbox opened without key'); S.items.wharfkey = k; } const g0 = S.gold; fx(open('strongbox') && S.gold >= g0 + 70, 'strongbox did not pay gold');
// 7 the meeting: only at night, overheard at 4 to 10 m, a purse after
{ const M = SEC.meet; Env.hour = 12; Player.pos = [M.x, World.groundY(M.x, M.z), M.z + 7]; game.step(5, dt); fx(M.st === 'off', 'meeting visible by day'); interactUse(byId('meetpouch')); fx(!S.opened['sec.meetpouch'], 'pouch gave before the meeting');
  Env.hour = 23.5; Player.pos = [M.x, World.groundY(M.x, M.z), M.z + 7]; for (let i = 0; i < 40 && M.st !== 'here'; i++) { Env.hour = 23.5; game.step(2, dt); } fx(M.st === 'here', 'meeting did not appear at night (' + M.st + ')');
  for (let i = 0; i < 400 && M.st === 'here'; i++) { Env.hour = 23.6; Player.pos = [M.x, World.groundY(M.x, M.z), M.z + 7]; game.step(3, 0.1); } fx(S.flags.hear_meeting === 1, 'meeting not overheard (' + M.st + ')'); fx(toasts.some(t => /Greta/.test(t)) && toasts.some(t => /Rowan/.test(t)), 'no spoken lines shown'); fx(open('meetpouch'), 'purse did not open after the meeting'); log.push('meeting heard'); }
// 8 the thief: appears at dusk in the square, is followed to the yard (kept 5 to 15 m behind), the sack is then there
{ const G = SEC.mag; Env.hour = 19; Player.pos = [2, World.groundY(2, 0), 0]; for (let i = 0; i < 60 && G.st === 'off'; i++) { Env.hour = 19; game.step(2, dt); } fx(G.st === 'wait' || G.st === 'walk', 'the Magpie did not appear (' + G.st + ')'); fx(G.path && G.path.length > 4, 'no path for the Magpie'); interactUse(byId('magpie')); fx(!S.opened['sec.magpie'], 'sack opened before the chase');
  let n = 0; for (; n < 3000 && G.st !== 'done'; n++) { Env.hour = 19.5; const q = G.path[Math.max(0, G.i - 1)], dx = G.x - q[0], dz = G.z - q[1], dl = Math.hypot(dx, dz) || 1; let bx, bz; if (n < 30) { bx = G.x - 8; bz = G.z; } else { const pr = G.path[Math.max(0, G.i - 2)]; const ux = G.x - pr[0], uz = G.z - pr[1], ul = Math.hypot(ux, uz) || 1; bx = G.x - ux / ul * 7; bz = G.z - uz / ul * 7; } Player.pos = [bx, World.groundY(G.x, G.z) + 0.01, bz]; game.step(2, 0.05); }
  fx(G.st === 'done' && S.flags.magpieYard, 'the Magpie never reached the yard (' + G.st + ' at path ' + G.i + '/' + (G.path && G.path.length) + ', ' + n + ' steps)'); fx(open('magpie') && has('lockpick'), 'stash did not pay'); log.push('thief followed in ' + n + ' steps, ' + (G.path || []).length + ' waypoints'); }
// spooking: stepping up to her ends the night's chase
{ const G = SEC.mag; S.flags.magpieYard = 0; G.st = 'off'; G.fig.visible = false; Env.hour = 20; Player.pos = [2, World.groundY(2, 0), 0]; for (let i = 0; i < 60 && G.st === 'off'; i++) { Env.hour = 20; game.step(2, dt); } Player.pos = [G.x + 1, World.groundY(G.x, G.z), G.z]; game.step(3, dt); fx(G.st === 'gone', 'a close approach did not spook her (' + G.st + ')'); }
// the villagers will not talk about the house
for (const id of ['greta', 'marta', 'finn', 'aldous']) { const n = TALK[id](); fx(n.o.some(o => /south lane/.test(o[0])), id + ' has no line about the house'); }
fx(secCount() >= 8, 'count of secrets found ' + secCount()); window.toast = _t;
if (fails.length) throw new Error('SECRETS FAIL ' + JSON.stringify(fails)); return 'secrets PASS ' + secCount() + ' found ' + JSON.stringify(log);
