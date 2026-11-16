// ───────────────────────── the main story, Act 1: "Dry Lungs" (docs/STORY.md) ─────────────────────────
// Loaded after 81_wilds_story.js and wraps what it wraps (questTarget, interactLabel, interactUse, TALK). Every fact is a flag or an item, so the steps can be done
// in any order: the objective shown is simply the first fact still missing (mainSync). Old saves load unchanged: every flag is keyed by its own name.
Object.assign(ITEMS, {
  tally: ['Miner’s tally token', 'Brass, stamped OM 14. It was round a drowned man’s neck on a bootlace.'],
  minekey: ['Sexton’s mine key', 'Long, black and heavier than it looks. The bow is cut with a pick and a bell.'],
  lantern: ['Miner’s lantern', 'Horn panes, a stub of wick and a tin of oil. Down there it is the difference between a path and a wall.', { value: 8, cost: 12 }],
  ledger: ['Sexton’s ledger', 'A thin book bound in sealskin. The last pages are in two hands.'],
  journal: ['Corwin’s journal', 'Water-stained, pages stuck together at the corners. The writing gets smaller towards the end.'],
});
QUESTS.main = { name: 'The Quiet Under Brackenfell', stages: [
  'Go to the wharf: a man has been found on the shingle',
  'Show Old Maren the miner’s tally token',
  'Find the Sexton’s mine key in the crypt under the chapel',
  'Unlock the Old Mine in the south-west cliffs and go down',
  'Find Corwin in the deep workings',
  'Take Corwin’s journal to Warden Hale',
  'Ask Elder Rowan what has been left at the lake',
] };
QORDER.unshift('main');
const BODY = [14.6, 0, 79.2];
const MAIN_FACTS = () => [!!S.flags.sawBody, !!S.flags.pell, has('minekey') || !!S.flags.mineOpen, !!S.flags.mineOpen, has('journal') || !!S.flags.corwin, !!S.flags.act1];
let _mainBusy = false;
function mainSync() {
  if (_mainBusy || qAt('main') < 0 || qAt('main') === 99) return; _mainBusy = true;
  try { const f = MAIN_FACTS(); let i = f.indexOf(false); if (i < 0) i = f.length; if (S.flags.act1 && i >= 6) i = 6; qStage('main', i); } finally { _mainBusy = false; }
}
const _uiObj = uiObjective; uiObjective = function () { mainSync(); return _uiObj(); };
function mainStart(stage) { if (qAt('main') < 0) { qStart('main', stage || 0); } mainSync(); }

// ── map and compass ──
const _qt82 = questTarget;
questTarget = function (id) {
  if (id !== 'main') return _qt82(id);
  const st = qAt('main'), npc = n => NPC[n] && NPC[n].pos;
  if (st === 0) return BODY.slice();
  if (st === 1) return npc('maren');
  if (st === 2) { const h = World.houses.chapel; return h ? [h.site.x, 0, h.site.z] : null; }
  if (st === 3) { const m = WILDS.P.mine; return [m.x, 0, m.z]; }
  if (st === 4) return (typeof MINE !== 'undefined' && MINE.built) ? MINE.target() : [WILDS.P.mine.x, 0, WILDS.P.mine.z];
  if (st === 5) return npc('hale');
  if (st === 6) return npc('rowan');
  return null;
};

// ── the man on the wharf ──
function storyBuild() {
  const pack = new MeshPack(); pack.shadow = false;
  const m = new Mesh(2048); m.seed = 4711;
  const x = BODY[0], z = BODY[2];
  m.push().T(x, BODY[1], z).RY(0.12); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0;
  // a bier of two trestles and boards, mud still on it
  m.mat(MAT.TIMBER, COL.timberDark); for (const sx of [-0.7, 0.7]) { m.beam([sx - 0.3, 0, -0.34], [sx, 0.6, 0], 0.08, 0.08); m.beam([sx + 0.3, 0, -0.34], [sx, 0.6, 0], 0.08, 0.08); m.beam([sx - 0.3, 0, 0.34], [sx, 0.6, 0], 0.08, 0.08); m.beam([sx + 0.3, 0, 0.34], [sx, 0.6, 0], 0.08, 0.08); }
  m.mat(MAT.PLANKS, [0.5, 0.42, 0.34], 0.5); m.box(-1.15, 0.6, -0.34, 1.15, 0.66, 0.34, 4);
  // the shape under the sailcloth: head, shoulders, long thin legs, the boots left bare
  m.mat(MAT.CLOTH, [0.7, 0.68, 0.6], 0.6);
  m.ball(0.9, 0.79, 0, 0.14, 0.11, 0.12, 10, 6); m.ball(0.48, 0.77, 0, 0.36, 0.13, 0.27, 12, 6); m.ball(-0.06, 0.74, 0, 0.3, 0.09, 0.2, 10, 6); m.ball(-0.58, 0.72, 0.0, 0.42, 0.075, 0.17, 10, 5);
  m.box(-0.25, 0.66, -0.3, 0.95, 0.74, -0.27, 0); m.box(-0.25, 0.66, 0.27, 0.95, 0.74, 0.3, 0);
  m.mat(MAT.CLOTH, [0.62, 0.6, 0.52], 0.6); m.box(-1.0, 0.66, -0.2, -0.82, 0.69, 0.2, 0);
  m.mat(MAT.PLAIN, [0.09, 0.07, 0.06]); for (const s of [-1, 1]) { m.push().T(-1.12, 0.72, s * 0.1).RZ(0.18); m.cyl(0, 0, 0, 0.055, 0.07, 0.24, 7, 3); m.pop(); m.box(-1.2, 0.66, s * 0.1 - 0.05, -1.0, 0.76, s * 0.1 + 0.05, 0); }
  // a wet dark patch of the quay and a bucket
  m.mat(MAT.PLAIN, [0.07, 0.065, 0.06]); m.quad2([-1.6, 0.012, -0.9], [-1.6, 0.012, 0.9], [1.6, 0.012, 0.9], [1.6, 0.012, -0.9]);
  m.push().T(1.5, 0.0, 0.7); m.mat(MAT.PLANKS, COL.wood, 0.5); m.cyl(0, 0, 0, 0.17, 0.2, 0.3, 9, 1); m.pop();
  addBoxCollider(m, -1.2, -0.4, 1.2, 0.4, 0, 1.0); m.pop();
  pack.add(m, { kind: 'opaque', maxDist: 80, noShadow: true }); pack.upload('story'); World.packs.push(pack);
  World.emitters.push({ type: 'candle', p: [x - 1.5, 0.5, z - 0.5], zone: 0, always: true, seed: 0.77 });
  World.interact.push({ p: [x, 0.9, z], r: 2.6, zone: 0, kind: 'read', id: 'wharf.body', title: 'The drowned man', text: 'Sailcloth over him; Finn’s doing. A man of fifty, thin as a rake.\n\nNo water has been in him. His palms are scarred white across, pick-work. There is silver in his back teeth, a bright vein of it, as though he had bitten rock.\n\nRound his neck on a bootlace: a brass tally stamped OM 14. In his fist, folded small in oilcloth:\n\n“TELL ROWAN THE BREAD DID NOT COME.”' });
  if (typeof ixScan === 'function') { try { ixScan(); } catch (e) { console.warn('interact: ' + (e && e.stack || e)); } }
}
// the sailcloth hides nothing from a man who looks: the first reading takes the token and starts the thread (a stranger who never met Hale still gets the quest)
const _il82 = interactLabel, _iu82 = interactUse;
interactLabel = function (it) {
  if (it.id === 'wharf.body') return 'Examine the body';
  return _il82(it);
};
interactUse = function (it) {
  const relicFirst = it.id === 'chapel.relic' && !S.opened[it.id];
  _iu82(it);
  if (it.id === 'wharf.body') { S.flags.sawBody = 1; if (!has('tally') && !S.flags.tallyGiven) { S.flags.tallyGiven = 1; give('tally'); toast('Taken: ' + ITEMS.tally[0]); } mainStart(); save(); }
  if (relicFirst && S.opened[it.id]) {
    give('minekey'); if (!has('lantern')) give('lantern'); give('ledger'); toast('Found: ' + ITEMS.minekey[0] + ', ' + ITEMS.lantern[0] + ', ' + ITEMS.ledger[0]);
    setTimeout(() => openReader('The Sexton’s ledger', LEDGER_TEXT), 350); mainSync(); save();
  }
};
const LEDGER_TEXT = 'Each dawn: the bell, then one loaf and one pail of water to the cave on the shore, by the cellar way. Four loaves if the frost is hard.\n\nThe Quiet takes what is left on the table. It has not yet taken what is given.\n\nR. says the Warden is never to be told.\n\n— in a different, later hand —\n\nThe Warden knows. He has always known. He bars the door and does not ask what he is barring.\n\nThe key goes in the reliquary with the Sexton, so that no one who loves him can ever be asked for it.';

// ── people ──
const addOpt = (id, fn, first) => { const base = TALK[id]; TALK[id] = function () { const n = base.call(this); const o = fn(n); if (o && n && n.o) { const i = n.o.indexOf(bye); if (first) n.o.unshift(o); else n.o.splice(i < 0 ? n.o.length : i, 0, o); } return n; }; };
const _hale82 = TALK.hale;
TALK.hale = function () {
  if (has('journal') && !S.flags.act1) return TALK.haleJournal();
  const n = _hale82();
  if (n && /^Hold there/.test(n.t)) { const o = n.o.slice(); n.o = [['You look like a man with something on his mind.', () => node('Finn pulled a man out of the lake at first light. He’s on a bier at the wharf, south end of the town. Go and look, if you’ve the stomach, before the gossips make a story of him.', o)]].concat(o); mainStart(); }       // his greeting keeps its recorded words (a changed line would lose its voice); the wharf is a question you can ask, and the journal points there
  return n;
};
TALK.haleJournal = () => node('That’s Corwin’s hand. Alive, then, or he was. Let me see.\n\nBread. Fifty years of bread, in a cave on the shore. I barred that door and told myself it was to keep them out.', [['What did you know?', () => node('That something went wrong below, before I wore this helmet. That Rowan went out to the shore every dawn and never said why. I didn’t ask. A man can keep a gate for thirty years that way.', [['What now?', () => { S.flags.act1 = 1; mainSync(); toast('<b>Act one ends.</b> The way on is under the Honeyed Hart.'); save(); return node('Not here. Rowan knows the way to the lake cave; he’s walked it with a pail more mornings than I’ve slept. Go and ask him, and don’t let him tell you it’s nothing.'); }, 1]])], ['Keep it. I’ll find Rowan.', () => { S.flags.act1 = 1; mainSync(); save(); return null; }, 1]]);
const marenPell = () => node('Brass, and a number. OM fourteen: the Old Mine, Dunstan Pell. He dug under Corwin, a good while back.', [['He wasn’t drowned.', marenDry]]);
const marenDry = () => node('No. Dry as a bone inside and thin as a rake: he walked a long way on nothing, in the dark. That’s no lake’s work.', [['Where did he come from?', marenDoor, 1]]);
const marenDoor = () => { S.flags.pell = 1; S.flags.sawBody = 1; mainStart(); mainSync(); save(); return node('The door in the south-west cliffs. Hale barred it, but the Sexton kept the key, and old Sextons keep everything. Look in the crypt under the chapel.'); };
addOpt('maren', n => has('tally') && !S.flags.pell ? ['I found this on a dead man at the wharf.', marenPell, 1] : null, true);
addOpt('aldous', n => qAt('main') >= 1 && !has('minekey') && !S.flags.mineOpen ? ['The Sexton’s key. Where is it kept?', () => node('There’s a vestment chest in the sacristy that I’ve never had the heart to open. The Sexton’s things are in it. The crypt gate under the nave has a lock to match.')] : null);
addOpt('finn', n => ['The man you found.', () => node('First light, face down in the reeds. The lake gives drowned men back swollen. This one was thin as a rake and dry as kindling. Whatever he was, he walked to the water; he didn’t fall in.')]);
addOpt('pip', n => ['What’s the crowd at the wharf?', () => node('A man under a sheet! Hale said not to look. I looked. He’s got silver in his teeth.')]);
const _marta82 = TALK.marta;
TALK.marta = function () { const n = _marta82(); if (n && n.o) { const i = n.o.indexOf(bye); n.o.splice(i < 0 ? n.o.length : i, 0, ['A miner’s lantern. (12 gold)', () => { if (has('lantern')) return node('You’ve one already, dear. Don’t be greedy with light.'); return TALK.buy('lantern', 12, 'Fill it before you go and mind the oil. Where you’re going, you’ll want it.'); }]); } return n; };
const _rowan82 = TALK.rowan;
TALK.rowan = function () {
  if (S.flags.act1 && !S.flags.rowanAsked) return node('Sit down, you’re making me tired. ... Hale has read it, then. I thought he might. I thought it would be me they came for one day.\n\nThe cave on the lake shore. The cellar of the Hart. I’ll tell you the rest, but not on my feet, and not today.', [['I’ll be back.', () => { S.flags.rowanAsked = 1; save(); return null; }, 1]]);
  return _rowan82();
};
