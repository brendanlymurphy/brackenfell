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
if (window.__storyMine) { const r = await window.__storyMine(); log.push(r); }
if (fails.length) throw new Error('STORY FAIL ' + JSON.stringify(fails));
return 'story PASS ' + JSON.stringify(log);
