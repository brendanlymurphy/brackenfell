// ───────────────────────── reasons to care (q1): gold, tiers, levels with a perk each, the board, rumours, a death that costs ─────────────────────────
// Brandt and Marta buy and sell (dialogue nodes, no boxes). Three tiers of weapon and armour with their numbers shown. XP from kills, secrets and finished quests; a level every so often and
// one perk to choose per level (in the pack). The notice board gives three repeatable jobs. Greta tells rumours that point at what you have not found. Dying costs a quarter of the purse (to 80).
Object.assign(ITEMS, {
  longsword: ['Brandt’s longsword', 'Fullered, a hand longer than the arming sword and balanced to match. His second-best work, he says.', { slot: 'weapon', dmg: 19, blade: [0.76, 1.2, 0.028], value: 60, cost: 150, tier: 2 }],
  silvered: ['Silver-edged blade', 'Brandt folded the mine silver into the edge himself. It sings when it clears the scabbard.', { slot: 'weapon', dmg: 25, blade: [0.80, 1.35, 0.028], value: 120, tier: 3 }],
  brigandine: ['Brigandine', 'Plates riveted inside canvas. Heavier than leather, and it shows in the bruises you do not get.', { slot: 'armor', armor: 0.38, value: 60, cost: 160, tier: 2 }],
  hauberk: ['Mail hauberk', 'Ring on ring, a winter of Brandt’s evenings. Turns half of what lands.', { slot: 'armor', armor: 0.5, value: 120, cost: 320, tier: 3 }],
});
ITEMS.ironsword[2].tier = 1; ITEMS.leather[2].tier = 1;
Inv.stock.brandt = ['ironsword', 'leather', 'buckler', 'longsword', 'brigandine', 'hauberk'];
const _facts81 = Inv.facts; Inv.facts = id => { const f = _facts81.call(Inv, id), t = RPG.meta(id).tier; return t ? 'tier ' + ['', 'I', 'II', 'III'][t] + (f ? ' · ' + f : '') : f; };
// ── levels and perks ──
const ECON = { XPL: [0, 60, 150, 270, 420, 600, 810, 1050], PERKS: [['hardy', 'Hardy', '+15 health'], ['breath', 'Long wind', '+10 stamina, you get your wind back a third quicker'], ['keen', 'Keen edge', 'your blows hit 12% harder'], ['hide', 'Thick hide', 'what lands on you lands 8% lighter'], ['quiet', 'Quiet feet', 'outlaws and the dead notice you from three-quarters the distance'], ['haggle', 'Hard bargainer', 'buy 15% cheaper, sell 15% dearer'], ['forager', 'Forager', 'food and drink restore half as much again']] };
RPG.perk = id => !!(S.rpg && S.rpg.perks && S.rpg.perks[id]);
const econR = () => { const r = RPG.st(); r.xp = r.xp || 0; r.perks = r.perks || {}; r.perkPts = r.perkPts || 0; r.lv = r.lv || 1; return r; };
function econLevel(xp) { let l = 1; for (let i = 1; i < ECON.XPL.length; i++) if (xp >= ECON.XPL[i]) l = i + 1; return l; }
function econApply() { RPG.MAXHP = 100 + (RPG.perk('hardy') ? 15 : 0); RPG.MAXST = 100 + (RPG.perk('breath') ? 10 : 0); }
RPG.xp = function (n) {
  const r = econR(); r.xp += n; const lv = econLevel(r.xp);
  while (r.lv < lv) { r.lv++; r.perkPts = (r.perkPts || 0) + 1; toast('<b>Level ' + r.lv + '</b>: choose a perk in your pack.'); Audio2.ui(); }
};
const _as82d = applySave; applySave = function () { const x = _as82d.apply(this, arguments); try { econApply(); } catch (e) { } return x; };
function econPerkHtml() {
  const r = econR(), next = ECON.XPL[r.lv] || null; let h = '<div class="vit"><span>Level <b>' + r.lv + '</b></span><span>' + (next ? '<b>' + r.xp + '</b> / ' + next + ' xp' : '<b>' + r.xp + '</b> xp') + '</span></div>';
  const mine = ECON.PERKS.filter(p => r.perks[p[0]]), open = ECON.PERKS.filter(p => !r.perks[p[0]]);
  if (mine.length) h += '<div class="gear">' + mine.map(p => '<div><small>Perk</small><b>' + p[1] + '</b><span>' + p[2] + '</span></div>').join('') + '</div>';
  if (r.perkPts > 0) h += '<div class="items">' + open.map(p => '<div><b>' + p[1] + '</b><span>' + p[2] + '</span><button type="button" class="btn small" data-perk="' + p[0] + '">Choose</button></div>').join('') + '</div>';
  return h;
}
function econChoose(id) { const r = econR(); if (r.perkPts < 1 || r.perks[id] || !ECON.PERKS.some(p => p[0] === id)) return false; r.perks[id] = 1; r.perkPts--; econApply(); if (id === 'hardy') RPG.heal(15); toast('<b>' + ECON.PERKS.find(p => p[0] === id)[1] + '</b>: ' + ECON.PERKS.find(p => p[0] === id)[2]); save(); return true; }
// ── what pays XP ──
function econKill(f) { RPG.xp(f.boss ? 150 : f.kind === 'lurker' ? 18 : f.kind === 'delver' ? 14 : f.leader ? 25 : 10); const r = econR(), d = econJob(); if (d && r.job && !r.job.done && d.match(f)) { r.job.n++; if (r.job.n >= d.goal) { r.job.done = true; toast('<b>Notice board</b>: that is the job done. Report to the board in the square.'); } else toast('<b>' + d.title + '</b> ' + r.job.n + ' of ' + d.goal); } }
const _qd82d = qDone; qDone = function (id) { const r = _qd82d.apply(this, arguments); try { RPG.xp(30); } catch (e) { } return r; };
// ── prices ──
Inv.price = id => Math.max(1, Math.round((RPG.meta(id).cost || 0) * (RPG.perk('haggle') ? 0.85 : 1)));
Inv.shop = function (who) {
  const opts = Inv.stock[who].map(id => { const m = RPG.meta(id), pr = Inv.price(id); return [ITEMS[id][0] + ' (' + pr + ' gold): ' + Inv.facts(id), () => {
    if (S.gold < pr) return node('That’s ' + pr + ' gold, and you’ve ' + S.gold + '. The board in the square pays for honest work.', [['Something else.', () => Inv.shop(who)], bye]);
    gold(-pr); give(id); toast('Bought: ' + ITEMS[id][0]); const r = RPG.st(); if (m.slot && (m.slot !== 'weapon' || (RPG.meta(r.eq.weapon).dmg || 0) < m.dmg) && (m.slot !== 'armor' || (RPG.meta(r.eq.armor).armor || 0) < m.armor)) { r.eq[m.slot] = id; Combat.refresh(); } save();
    return node('Sound work, that. Look after it and it will look after you.', [['Something else.', () => Inv.shop(who)], bye]); }]; });
  return node('Iron from the Greyspine, every piece. I don’t haggle.', opts.concat([bye]));
};
Inv.sell = function (who) {
  const r = RPG.st(), opts = [];
  for (const id in S.items) { const m = RPG.meta(id); if (!m.value || (m.slot && r.eq[m.slot] === id && S.items[id] < 2)) continue; const v = Math.round(m.value * (RPG.perk('haggle') ? 1.15 : 1)); opts.push([ITEMS[id][0] + (S.items[id] > 1 ? ' × ' + S.items[id] : '') + ' (' + v + ' gold)', () => { give(id, -1); gold(v); save(); return Inv.sell(who); }]); }
  return node(opts.length ? (who === 'marta' ? 'Let’s have a look, dear.' : 'Let’s see it, then.') : 'You’ve nothing I’d give coin for. Outlaws carry better than they deserve, mind.', opts.slice(0, 8).concat([bye]));
};
// Marta buys what she can sell on, and sells lamp oil; Brandt folds silver into a blade
const _marta82d = TALK.marta; TALK.marta = function () { const n = _marta82d.call(this); if (n && n.o) { const i = n.o.indexOf(bye), at = i < 0 ? n.o.length : i; n.o.splice(at, 0, ['Lamp oil. (7 gold)', () => TALK.buy('oil', 7, 'Whale oil. It stinks and it burns. Don’t spill it near the candles.')], ['I have things to sell.', () => Inv.sell('marta')]); } return n; };
addOpt('brandt', n => has('silverbar') && S.items.silverbar >= 3 ? ['Can you do anything with this silver?', () => node('Grey silver, never stamped. Aye, I can. Three bars and ninety gold, and the edge will outlast the blade. Mind, I’ll want to know where you had it.', [['Forge it. (90 gold, 3 silver bars)', () => { if (S.gold < 90) return node('Ninety gold, and you’ve ' + S.gold + '.'); gold(-90); give('silverbar', -3); give('silvered'); const r = RPG.st(); r.eq.weapon = 'silvered'; Combat.refresh(); toast('Forged: ' + ITEMS.silvered[0]); save(); return node('Done. Don’t draw it in the Hart.'); }], bye])] : null);
// ── the notice board: three jobs, any number of times ──
const ECONJOBS = [
  { id: 'outlaws', title: 'Outlaws on the passes', goal: 4, pay: 35, text: 'WANTED: four outlaws put down on the passes. Thirty-five gold, paid at the board.', match: f => !f.kind },
  { id: 'vermin', title: 'The Old Mine', goal: 3, pay: 50, text: 'WANTED: three of the things that live in the Old Mine put down, delver or lurker. Fifty gold, and the Warden does not ask how.', match: f => f.kind === 'delver' || f.kind === 'lurker' },
  { id: 'oil', title: 'Lamp oil for the watch', goal: 3, pay: 30, text: 'WANTED: three flasks of lamp oil for the gate. Thirty gold. Marta has it.', match: () => false, have: () => has('oil') && S.items.oil >= 3 },
];
const econJob = () => { const r = econR(); return r.job ? ECONJOBS.find(j => j.id === r.job.id) || null : null; };
TALK.board = function () {
  const r = econR(), j = econJob(), opts = [];
  if (j) {
    const ready = r.job.done || (j.have && j.have());
    if (ready) opts.push(['Collect the pay. (' + j.pay + ' gold)', () => { if (j.have) give('oil', -3); gold(j.pay); RPG.xp(20); r.jobsDone = (r.jobsDone || 0) + 1; r.job = null; save(); return node('Paid. The board has fresh ink every few days: come back.'); }, 1]);
    else opts.push(['Where was I up to?', () => node(j.title + ': ' + (j.have ? 'three flasks of lamp oil, you have ' + (S.items.oil || 0) : r.job.n + ' of ' + j.goal) + '.')]);
    opts.push(['Tear the notice down.', () => { r.job = null; save(); return node('The nail is still there.'); }]);
  } else for (const d of ECONJOBS) if (d.id !== 'vermin' || S.flags.mineOpen) opts.push([d.title + ' (' + d.pay + ' gold)', () => { r.job = { id: d.id, n: 0, done: false }; save(); return node(d.text + '\n\nYou take the notice.'); }]);
  if (qAt('bounty') < 0 && qAt('welcome') >= 0) { qStart('bounty'); bountyText(); }
  return node(j ? 'Your notice is still on you.' : (S.flags.mineOpen ? 'Notices, pinned over notices. Three of them are in a clean hand and have not yellowed.' : 'Notices, pinned over notices. Two of them are in a clean hand and have not yellowed.'), opts.concat([bye]));
};
const _iu82d = interactUse; interactUse = function (it) {
  if (it.id === 'board' && it.kind === 'read') { const nm = { id: 'board', name: 'Notice board', pos: it.p.slice(), yaw: 0, anim: 'idle', path: null }; return startTalk(nm); }
  return _iu82d(it);
};
const _il82d = interactLabel; interactLabel = function (it) { if (it.id === 'board' && it.kind === 'read') return 'Read the notice board'; return _il82d(it); };
// ── rumours at the inn ──
const RUMOURS = [
  [() => !secFlag('bell'), 'They say Tobin’s been up the Watch Bell more than the Watch has. A tin box, a lockpick, and a boy who will not say what he saw from the top.'],
  [() => !secFlag('stone'), 'There’s a stone in the terrace wall below the Elder’s plaque with crooked mortar. Folk have stopped noticing it. The Magpie never did.'],
  [() => !secFlag('cellar'), 'The Magpie keeps a cellar on Washing Lane, under a hatch no bigger than a cheese-board. Keeps the key somewhere sillier than a pocket.'],
  [() => !secFlag('strongbox'), 'The old Elder had a strongbox put in the quay when the Wharf was built. Reached from the water. I never knew a man who had the key.'],
  [() => !secFlag('magpie'), 'The Magpie walks at dusk from the square to somewhere west of the weavers, same road each time. Nobody follows her. You’d have to be patient.'],
  [() => !secFlag('house'), 'The shut house on the south lane. Don’t ask Marta. Don’t ask Finn. Ask nobody. Take a key, if you’ve one with a wren on it.'],
  [() => !S.flags.mineOpen, 'The mine door has been barred for fifty years. The Sexton kept the key, and old Sextons keep everything.'],
  [() => S.flags.mineOpen && !has('silverthread') && !S.opened['mine.chest'], 'My grandmother said the Old Mine’s foreman kept a strongbox below and wore the key round his neck. Nobody has been down to ask him.'],
  [() => !S.flags.act1, 'A drowned man on the wharf, dry as bone. The wise folk are keeping their windows shut.'],
  [() => true, 'Hale cries on the last day of the month. Pip told me. Pip tells everybody.', 1],
  [() => true, 'The Elder talks to the lake. Always has. Says it answers.', 1],
];
addOpt('greta', n => ['What’s the talk in the Hart tonight?', () => {
  const r = econR(); r.rum = r.rum || {}; const day = r.day || 0, el = RUMOURS.map((x, i) => [x, i]).filter(([x, i]) => x[0]() && !r.rum[i]); const pick = el.find(([x]) => !x[2]) || el[0];
  if (!pick) return node('Nothing new, love. Same faces, same ale.'); r.rum[pick[1]] = 1; save(); return node(pick[0][1]); }]);
