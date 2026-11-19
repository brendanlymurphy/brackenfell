// Houses are somebody's (src/82f_owners.js; AUDIT A13, BLUEPRINT 7.1): a home is barred from ten till six and a shop outside its hours, unless one of its people
// knows you; by day whoever is at home has a word for you as you come in, once a day; at night they tell you to go and you are put out; a bed in somebody's
// house cannot be slept in; the Hart and the chapel are open at all hours.
const bad = [], dt = 1 / 30, heard = []; Env.dayLength = 0; Weather.set('fair'); const _t = toast; toast = function (h) { heard.push(String(h)); return _t.apply(this, arguments); };
const at = h => { Env.hour = h; npcSnapAll(); game.step(3, dt); }, lock = id => Cells.lockMsg(Cells.by[id].portalOut), run = s => { for (let i = 0; i < s * 30; i++) game.step(1, dt); };
delete S.items.lockpick; S.heard = {};
at(12); for (const id of ['draper', 'weaver', 'shop.s1', 'farm', 'inn', 'chapel']) if (lock(id)) bad.push(id + ' is locked at noon: ' + lock(id));
at(23); for (const id of ['draper', 'farm', 'fisher', 'elder', 'weaver']) if (!lock(id)) bad.push(id + ' is open to a stranger at eleven at night'); for (const id of ['inn', 'chapel']) if (lock(id)) bad.push('the ' + id + ' is shut at eleven at night');
at(19); if (!lock('shop.s1')) bad.push('the Bookstall is open at seven in the evening'); if (lock('draper')) bad.push('the Draper\'s is barred at seven in the evening');
// [cast] the slice (82f_owners.js): a house outside it is locked to the player at every hour, with no word of whose it is
at(12); for (const id of ['in.02', 'in.10', 'shop.s0']) if (lock(id) !== SLICE.MSG) bad.push(id + ' is outside the slice and says ' + JSON.stringify(lock(id)) + ' at noon');
let houses = 0; for (const c of Cells.list) if (c.portalOut && OWN.owned(c.id)) { houses++; if (typeof c.portalOut.lock !== 'function') bad.push(c.id + ' has people and no lock on its door'); }
// a friend: someone of the house has told you who they are
at(23); { const p = CAST.find(q => q.id === 'anselm'); Memory.hear('anselm', p.lines.me); if (lock('draper')) bad.push('the Draper\'s is barred to someone Anselm has introduced himself to'); S.heard = {}; }
// by day: a word as you come in, once
at(12.4); heard.length = 0; game.enter('draper'); run(4); const day1 = heard.filter(x => /^<b>\w+<\/b>: “/.test(x));
if (day1.length !== 1) bad.push('coming into the Draper\'s at noon: ' + day1.length + ' greetings'); else { const who = /^<b>(\w+)/.exec(day1[0])[1].toLowerCase(), p = CAST.find(q => q.id === who); if (!p || p.home !== 'draper' && p.work !== 'draper') bad.push('greeted in the Draper\'s by ' + who); else if (![p.lines.b1, p.lines.b2].some(l => day1[0].includes(l))) bad.push(who + '\'s greeting is not a line of the table'); }
game.leave(); run(1); heard.length = 0; game.enter('draper'); run(4); if (heard.some(x => /^<b>\w+<\/b>: “/.test(x))) bad.push('greeted twice in one day in the Draper\'s'); game.leave(); run(1);
// at night, inside: told to go, then put out
at(23.5); heard.length = 0; game.enter('draper'); run(4); const nt = heard.filter(x => /^<b>\w+<\/b>: “/.test(x)); { const ok = nt.length === 1 && CAST.some(p => p.home === 'draper' && p.lines.nt && nt[0].includes(p.lines.nt)); if (!ok) bad.push('in the Draper\'s at half past eleven: no challenge in the owner\'s own words (' + nt.length + ' lines)'); }
for (let i = 0; i < 40 && World.cell; i++) { run(1); await new Promise(r => setTimeout(r, 120)); } if (World.cell) bad.push('still in the Draper\'s house a long while after being told to go');
// beds
at(12); S.flags.bed = 1; game.enter('draper'); run(1); { const bed = World.interact.find(i => i.kind === 'bed' && i.id === 'draper.bed'); if (!bed) bad.push('no bed to try in the Draper\'s'); else { const h0 = Env.hour; heard.length = 0; interactUse(bed); run(2); if (Math.abs(Env.hour - h0) > 0.2) bad.push('slept in the draper\'s bed'); if (!heard.some(x => /’s bed/.test(x))) bad.push('no word on whose bed it is'); } } game.leave(); run(1);
if (houses < 40) bad.push('only ' + houses + ' houses with people were found: the cast did not load');
toast = _t; delete S.flags.bed; S.heard = {}; S.own = {};
if (bad.length) throw new Error('OWNERS FAIL ' + bad.length + ': ' + bad.join('; '));
return 'owners PASS ' + houses + ' houses with people: barred at night and shops outside their hours unless you are known there; a word on coming in by day, once; told to go at night and put out; nobody\'s bed is yours; the Hart and the chapel always open';
