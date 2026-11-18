// ───────────────────────── the wilds, as story: items, two small quests, the barred mine door and the strongbox ─────────────────────────
// Loaded after 80_game.js, whose S / ITEMS / QUESTS / TALK it extends. Old saves load unchanged: every new thing is keyed by its own id.
Object.assign(ITEMS, {
  woodaxe: ['Woodcutter’s axe', 'Left on a block at the lumber camp. Heavy in the head, and it bites.', { slot: 'weapon', dmg: 13, speed: 0.85, reach: -0.15, blade: [0.42, 0.9, 0.05], value: 14 }],
  oldsword: ['Rusted levy sword', 'Pitted, but straight. It has been in the ground a long time.', { slot: 'weapon', dmg: 11, blade: [0.62, 0.55], value: 6 }],
  oldcoins: ['Old coins', 'Worn thin, an unfamiliar king. The smith will weigh them.', { value: 18 }],
  chanterelle: ['Chanterelles', 'Apricot-gold and smelling of fruit. Good fried in butter.', { heal: 10, value: 2 }],
  honeycomb: ['Honeycomb', 'Dripping and warm from the skep.', { heal: 22, sta: 40, value: 3 }],
  smokedfish: ['Smoked trout', 'Dark and salty; it keeps for a month.', { heal: 20, value: 2 }],
  ashkey: ['Small iron key', 'Black with soot. It was under the third hearthstone.'],
  corwincap: ['Corwin’s cap', 'Wool, patched twice, with a miner’s candle-stub in the band.'],
  bogbean: ['Bogbean', 'A bitter white-flowered herb from the hermit’s pool.'],
  sunwort: ['Sunwort', 'Yellow heads that follow the day. Maren swears by it.'],
  stonecrop: ['Stonecrop', 'A fleshy little plant from the hilltop stones.'],
});
QUESTS.tea = { name: 'Maren’s Three-Herb Tea', stages: ['Gather bogbean (the pool in the north), sunwort (the bee meadow) and stonecrop (the standing stones)', 'Bring the herbs to Maren'] };
QUESTS.brother = { name: 'What Became of Corwin', stages: ['Find what happened to Corwin: the old mine lies in the north-west cliffs, up past the chapel', 'Bring Corwin’s cap to Elder Rowan'] };
QORDER.push('tea', 'brother');
const TEA = ['bogbean', 'sunwort', 'stonecrop'];
const wildPick = id => World.pickups.find(p => p.item === id && !p.gone);
const _qt = questTarget;
questTarget = function (id) {
  const st = qAt(id);
  if (id === 'tea') { if (st === 1) return NPC.maren && NPC.maren.pos; let best = null, bd = 1e9; for (const t of TEA) { if (has(t)) continue; const p = wildPick(t); if (!p) continue; const d = hyp(p.p[0] - Player.pos[0], p.p[2] - Player.pos[2]); if (d < bd) { bd = d; best = p.p; } } return best; }
  if (id === 'brother') { if (st === 1) return NPC.rowan && NPC.rowan.pos; const m = WILDS.P.mine; return m ? [m.x, 0, m.z] : null; }
  return _qt(id);
};
const _il = interactLabel, _iu = interactUse;
interactLabel = function (it) {
  if (it.kind === 'door' && it.shut) return 'Try the door';
  if (it.kind === 'wbox') return S.opened[it.id] ? null : has(it.need) ? 'Unlock the strongbox' : 'Strongbox (locked)';
  return _il(it);
};
interactUse = function (it) {
  if (it.kind === 'door' && it.shut) { Audio2.chest && Audio2.chest(); return toast(it.msg); }
  if (it.kind === 'wbox') {
    if (S.opened[it.id]) return;
    if (!has(it.need)) return toast('Locked. The keyhole is small and clean; someone oils it.');
    give(it.need, -1); toast('The key turns.'); return _iu(Object.assign({}, it, { kind: 'chest' }));
  }
  _iu(it);
  if (it.kind === 'pickup' && it.wild) {
    if (it.item === 'corwincap' && qAt('brother') === 0) qStage('brother', 1);
    if (qAt('tea') === 0 && TEA.every(t => has(t))) qStage('tea', 1);
  }
  if (it.kind === 'read' && it.id === 'note.mine' && qAt('brother') < 0) toast('Corwin. Elder Rowan may know the name.');
};
const _maren = TALK.maren;
TALK.maren = function () {
  if (qAt('herbs') === 99 && qAt('tea') < 0) return node('Since you are the sort who walks: I have a tea I used to make from three herbs and my knees now refuse. Bogbean from the hermit’s pool, sunwort from the bee meadow, stonecrop from the old stones on the eastern hill. It is the only thing that lets Edda’s widow sleep.', [['I’ll fetch them.', () => { qStart('tea'); if (TEA.every(t => has(t))) qStage('tea', 1); return null; }, 1], bye]);
  if (qAt('tea') >= 0 && qAt('tea') !== 99 && TEA.every(t => has(t))) return node('All three. And the stonecrop still wet. Sit, sit. I will brew it now, and you shall have the first cup.', [['Thank you, Maren.', () => { for (const t of TEA) give(t, -1); give('potion'); gold(40); qDone('tea'); return null; }, 1]]);
  if (qAt('tea') === 0) return node('Bogbean ' + (has('bogbean') ? 'in hand' : 'still wanting') + ', sunwort ' + (has('sunwort') ? 'in hand' : 'still wanting') + ', stonecrop ' + (has('stonecrop') ? 'in hand' : 'still wanting') + '. Take your time. The herbs are not going anywhere.');
  return _maren();
};
const _rowan = TALK.rowan;
TALK.rowan = function () {
  if (qAt('brother') !== 99 && has('corwincap')) return node('Where did you… that is Corwin’s cap. Hob’s brother went down the old mine after silver, a good while back. So. It is the end of a long hope. Thank you for bringing it home rather than leaving it to the damp.', [['I am sorry, Elder.', () => { give('corwincap', -1); gold(60); if (qAt('brother') < 0) qStart('brother', 1); qDone('brother'); return null; }, 1]]);
  const n = _rowan();
  if (qAt('brother') < 0 && qAt('welcome') >= 0 && n && n.o) n.o.unshift(['Do you know of a man called Corwin?', () => node('Corwin the miner. He went into the old workings north-west of here, up under the cliffs past the chapel, after silver; his brother Hob was the last to see him. The Warden barred the door afterwards. If you come across anything of his, I would be glad of it.', [['I’ll look into it.', () => { qStart('brother'); return null; }, 1], bye]), 1]);
  return n;
};
