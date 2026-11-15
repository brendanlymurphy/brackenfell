// ───────────────────────── story: state, quests, dialogue, things you can do ─────────────────────────
const S = { gold: 6, items: {}, q: {}, flags: {}, opened: {}, picked: {} };
const ITEMS = {
  malt: ['Sack of malt', 'Osric’s malted barley, bound for the Honeyed Hart.'],
  hammer: ['Cross-peen hammer', 'Brandt’s favourite. The handle is worn smooth.'],
  frostcap: ['Frostcap', 'A pale blue flower that glows faintly at dusk.'],
  rope: ['Hemp rope', 'Thirty feet, well laid. Strong enough for a bell.'],
  ale: ['Honeyed ale', 'Greta’s recipe. Warms more than the hands.'],
  knife: ['Traveller’s knife', 'Forged by Brandt as thanks. Keen and plain.'],
  tonic: ['Maren’s tonic', 'Keeps the mountain chill from your bones.'],
  apple: ['Apple', 'Crisp, from the valley orchards.'],
  bread: ['Rye loaf', 'Still a little warm.'],
};
// What things do (93_inventory.js reads the third field): food heals, blades cut, shields and jerkins protect.
// value = what the smith pays for it, cost = what it sells for, blade = [length, brightness, half-width] of the sword in view.
Object.assign(ITEMS, {
  shortsword: ['Worn shortsword', 'Notched, but it holds an edge. It came up the road with you.', { slot: 'weapon', dmg: 10, blade: [0.60, 0.85], value: 8 }],
  ironsword: ['Iron arming sword', 'Brandt’s plain, honest work.', { slot: 'weapon', dmg: 15, blade: [0.70, 1.0], value: 30, cost: 70 }],
  steelsword: ['Garrick’s blade', 'Good steel, taken from a man who deserved it less than you.', { slot: 'weapon', dmg: 21, blade: [0.78, 1.25, 0.028], value: 70 }],
  buckler: ['Oak buckler', 'Small, round, and better than an arm.', { slot: 'shield', value: 14, cost: 38 }],
  leather: ['Leather jerkin', 'Boiled hide over wool. Turns a glancing blow.', { slot: 'armor', armor: 0.25, value: 22, cost: 55 }],
  potion: ['Red tonic', 'Maren’s strongest. Knits a wound in a breath.', { heal: 60, value: 9, cost: 24 }],
  tools: ['Brandt’s tongs and files', 'A smith’s bench tools, rolled in oilcloth.'],
});
ITEMS.apple[2] = { heal: 8 }; ITEMS.bread[2] = { heal: 18, value: 1 }; ITEMS.ale[2] = { heal: 10, sta: 60, value: 1 }; ITEMS.tonic[2] = { heal: 45 };
ITEMS.knife[2] = { slot: 'weapon', dmg: 7, speed: 1.3, reach: -0.45, blade: [0.26, 1.1] };
const QUESTS = {
  welcome: { name: 'A Stranger at the Gate', stages: ['Speak to the guard at the gate', 'Find Greta at the Honeyed Hart, the inn on the square'] },
  ale: { name: 'Ale for the Hart', stages: ['Fetch the malt from Osric at the mill, east over the bridge', 'Carry the malt back to Greta'] },
  hammer: { name: 'The Smith’s Hammer', stages: ['Ask the boy Tobin about the hammer', 'Search the Old Watchtower on the northern crag', 'Return the hammer to Brandt'] },
  herbs: { name: 'Frostcaps for Maren', stages: ['Gather five frostcaps around the valley', 'Bring the frostcaps to Maren'] },
  bell: { name: 'The Silent Bell', stages: ['Buy a rope from Marta at Quill’s Sundries', 'Take the rope to Brother Aldous at the chapel', 'Ring the bell under the chapel tower'] },
  fire: { name: 'The Harvest Fire', stages: ['Speak with Elder Rowan', 'Light the fire pit in the square'] },
  camp: { name: 'Smoke in the Pines', stages: ['Drive the outlaws from their camp in the pines, north-west of the gate', 'Tell Elder Rowan the camp is empty'] },
  tools: { name: 'Tongs and Temper', stages: ['Find Garrick One-Ear, camped west of the watchtower path', 'Bring Brandt his tools'] },
  bounty: { name: 'Bounty: Outlaws', stages: ['Put down five outlaws', 'Collect the bounty from Warden Hale'] },
};
const QORDER = ['welcome', 'ale', 'hammer', 'herbs', 'bell', 'fire', 'camp', 'tools', 'bounty'];
const BOUNTY_N = 5;
const qAt = id => { const q = S.q[id]; return !q ? -1 : q.done ? 99 : q.stage; };
const has = (id, n) => (S.items[id] || 0) >= (n || 1);
function give(id, n) { S.items[id] = (S.items[id] || 0) + (n || 1); if (S.items[id] <= 0) delete S.items[id]; }
function gold(n) { S.gold += n; if (n > 0) { toast('+' + n + ' gold'); Audio2.coin(); } uiPurse(); }
function qStart(id, stage) { if (S.q[id]) return; S.q[id] = { stage: stage || 0, done: false, t: Date.now() }; banner('Quest begun', QUESTS[id].name); Audio2.quest(0); uiObjective(); save(); }
function qStage(id, n) { const q = S.q[id]; if (!q || q.done || q.stage >= n) return; q.stage = n; q.t = Date.now(); toast('<b>' + QUESTS[id].name + '</b> ' + QUESTS[id].stages[n]); Audio2.quest(1); uiObjective(); save(); }
function qDone(id) { const q = S.q[id]; if (!q || q.done) return; q.done = true; banner('Quest complete', QUESTS[id].name); Audio2.quest(2); uiObjective(); save(); }
const frostN = () => S.items.frostcap || 0;
const allHelped = () => ['ale', 'hammer', 'herbs', 'bell'].every(id => qAt(id) === 99);
// where the compass should point for each active quest
function questTarget(id) {
  const st = qAt(id), npc = n => NPC[n] && NPC[n].pos;
  if (id === 'welcome') return st === 0 ? npc('hale') : npc('greta');
  if (id === 'ale') return st === 0 ? npc('osric') : npc('greta');
  if (id === 'hammer') return st === 0 ? npc('tobin') : st === 1 ? [SITE.tower.x, 0, SITE.tower.z] : npc('brandt');
  if (id === 'herbs') { if (st === 1) return npc('maren'); let best = null, bd = 1e9; for (const p of World.pickups) { if (p.item !== 'frostcap' || p.gone) continue; const d = hyp(p.p[0] - Player.pos[0], p.p[2] - Player.pos[2]); if (d < bd) { bd = d; best = p.p; } } return best; }
  if (id === 'bell') return st === 0 ? npc('marta') : st === 1 ? npc('aldous') : World.bell.p;
  if (id === 'fire') return st === 0 ? npc('rowan') : [World.bonfirePos[0], 0, World.bonfirePos[1]];
  const camp = cid => { const c = Foes.camps.find(k => k.id === cid); return [c.x, 0, c.z]; };
  if (id === 'camp') return st === 0 ? camp('pines') : npc('rowan');
  if (id === 'tools') return st === 0 ? camp('crag') : npc('brandt');
  if (id === 'bounty') { if (st === 1) return npc('hale'); const f = Foes.nearest(Player.pos); return f ? f.pos : null; }
  return null;
}

// ── dialogue. each villager returns { t: text, o: [[label, next, isQuest]] }; next is a function returning another node, or null to end ──
const bye = ['Farewell.', null];
const node = (t, o) => ({ t, o: o && o.length ? o : [bye] });
const TALK = {
  hale() {
    if (qAt('welcome') <= 0) { if (qAt('welcome') < 0) qStart('welcome'); return node('Hold there, traveller. Brackenfell is a quiet place and I mean to keep it so. But you have the look of the road on you: tired, and honest enough. Greta at the Honeyed Hart keeps a bed for folk like you. Straight down this road to the square. It’s the tall house with the lantern.', [['Thank you. I’ll find her.', () => { qStage('welcome', 1); return null; }, 1], ['What is this place?', () => { qStage('welcome', 1); return TALK.haleAbout(); }]]); }
    if (qAt('fire') === 99) return node('You lit the harvest fire. I never thought to see it burn again. You’re one of us now, whether you like it or not.');
    return node('Road’s quiet. Just how I like it.', [['Tell me about Brackenfell.', TALK.haleAbout], ['What’s the ruin on the hill?', () => node('The old watchtower, up the crag to the north-east. It held a beacon once. Burned out before my grandfather’s day. Children dare each other up there, though they swear to me they don’t.')], bye]);
  },
  haleAbout: () => node('Last village before the Greyspine passes. Sixty souls, one inn, one forge, and a chapel bell that no longer rings. Mind the river. The Stonewater is colder than she looks, and she doesn’t give back what she takes.'),
  greta() {
    if (qAt('ale') < 0) {
      if (qAt('welcome') < 0) qStart('welcome', 1);
      return node('Well now, a new face! Hale sent you? Then you’re welcome under this roof. There’s a bed up the stairs, by the window. It’s yours while you stay. But I’ll ask a kindness in return. Osric at the mill owes me a sack of malt, and I can’t brew on promises. Fetch it for me?', [['I’ll fetch your malt.', () => { qDone('welcome'); S.flags.bed = 1; qStart('ale'); return node('You’re a treasure. Over the bridge east of the square, then follow the river downstream. You’ll hear the wheel before you see it.'); }, 1]]);
    }
    if (qAt('ale') === 0) return node('The mill is over the bridge east of the square, then down the river. Osric will know what I’m owed.', TALK.gretaMenu());
    if (qAt('ale') === 1 && has('malt')) return node('That’s the malt! Oh, bless you. There’ll be ale by week’s end. Here, for your trouble, and a bottle of the last batch.', [['Glad to help.', () => { give('malt', -1); give('ale'); gold(25); qDone('ale'); return node('If you’ve a mind to stay useful: Brandt has been storming about since his hammer went missing, old Maren is short of frostcaps, and Brother Aldous frets over that silent bell of his. And the Elder likes company, out under the oak.'); }, 1]]);
    return node(qAt('fire') === 99 ? 'The whole village in my hall, and the fire lit in the square. I could weep. Sit, drink!' : 'What can I get you, love?', TALK.gretaMenu());
  },
  gretaMenu: () => [['A mug of honeyed ale. (2 gold)', () => { if (S.gold < 2) return node('It’s two gold, love, and your purse is light. Help a few folk around the village and come back.'); gold(-2); S.flags.warm = 1; Audio2.drink(); return node('Warm, and sweet with heather honey. The room feels friendlier already.'); }], ['Tell me about the inn.', () => node('Three generations of Barleybrooks have kept this hearth. The beams came down from the beacon forest, and the recipe for the ale came from my gran, who took it from a traveller in trade for a night’s lodging. So you see, I’ve a soft spot for strangers.')], ['Where can I rest?', () => node(S.flags.bed ? 'Up the stairs at the back, the bed by the window. Sleep as late as you like.' : 'Do me one small favour first and there’s a bed in it for you.')], bye],
  osric() {
    if (qAt('ale') === 0) return node('Greta’s malt! I’d clean forgot, what with the wheel groaning all week. Here, take it, and tell her the next sack is on me. I’d carry it myself, but the stones won’t dress themselves.', [['I’ll see she gets it.', () => { give('malt'); toast('Received: Sack of malt'); qStage('ale', 1); return null; }, 1]]);
    return node('Mind the dust. A mill is no place for a naked flame, or a fool.', [['How does the mill work?', () => node('The Stonewater turns my wheel, the wheel turns the stones, and the stones feed the valley. Simple as bread. Listen: you can hear her running true.')], bye]);
  },
  brandt() {
    const st = qAt('hammer');
    if (st < 0) return node('Unless you’ve come to tell me where my hammer is, I’ve work to do. My best cross-peen, gone from the bench three days back. And that boy Tobin can’t look me in the eye.', [['I’ll find your hammer.', () => { qStart('hammer'); return node('Hm. Start with the boy. He’s always underfoot in the square, when he should be at the bellows.'); }, 1], bye]);
    if (has('hammer')) return node('That’s her! Where was she? The watchtower? I’ll tan his... no. No, I was a boy once, and that tower was a castle then too. Take this. I made it for no one in particular, and it seems that was you.', [['Thank you, Brandt.', () => { give('hammer', -1); give('knife'); gold(30); qDone('hammer'); return null; }, 1]]);
    if (st === 99) return node('She rings true again. Hear that? That’s the sound of a village with a working forge.', [['Tell me about your work.', TALK.brandtAbout], bye]);
    return node(st === 0 ? 'Find the boy. Tobin. Fair hair, guilty face.' : 'The watchtower, he said? Up the crag past the chapel. Mind your footing.', [['Tell me about your work.', TALK.brandtAbout], bye]);
  },
  brandtAbout: () => node('Iron from the Greyspine, charcoal from the pine, water from the Stonewater. Everything in this valley was made within sight of it. That’s rarer than you’d think.'),
  tobin() {
    if (qAt('hammer') === 0) return node('The hammer? I, um. I only borrowed it! I was playing knights up at the old watchtower, and then it got dark, and I ran, and... I left it by the fire ring. Please don’t tell him it was me.', [['Your secret’s safe. Mostly.', () => { qStage('hammer', 1); return null; }, 1]]);
    return node(qAt('hammer') === 99 ? 'He wasn’t even cross! Well. He was a bit cross.' : 'Bet you can’t beat me to the well!', [['What do you want to be, Tobin?', () => node('A smith, like Brandt. I’m going to forge a sword as tall as Warden Hale. Taller!')], bye]);
  },
  maren() {
    const st = qAt('herbs');
    if (st < 0) return node('Hm. Young eyes. Good. The frost came early and my stores are thin. I need frostcaps: pale blue, and they glow a little at dusk. They grow where it is cold and quiet. By the lake, at the forest’s edge, near old stones. Bring me five.', [['I’ll look for them.', () => { qStart('herbs'); if (frostN() >= 5) qStage('herbs', 1); return null; }, 1], bye]);
    if (st !== 99 && frostN() >= 5) return node('Five, and not one bruised! You have gentle hands. Take this tonic. It will keep the mountain chill from your bones.', [['Thank you, Maren.', () => { give('frostcap', -5); give('tonic'); gold(25); qDone('herbs'); return null; }, 1]]);
    if (st === 0) return node('You have ' + frostN() + ' of five. Keep looking where it is cold and quiet.', [bye]);
    return node('Sixty winters in this valley. I have buried more secrets in that garden than turnips.', [['What are frostcaps for?', () => node('Fevers, mostly. And grief, a little, though I don’t tell them that’s what’s in the tea.')], bye]);
  },
  aldous() {
    const st = qAt('bell');
    if (st < 0) return node('The peace of the Dawn upon you. Forgive the quiet. Our bell rope rotted through at midsummer, and I have neither the coin nor the knees to replace it. A village without its bell is a body without a voice.', [['I’ll find you a rope.', () => { qStart('bell'); if (has('rope')) qStage('bell', 1); return node('Would you? Marta keeps good hemp at her shop on the square. The Dawn remembers a kindness.'); }, 1], bye]);
    if (st <= 1 && has('rope')) return node('Hemp, and well laid! Give me one moment in the tower... there. It is done. Would you ring it? It ought to be a friend who rings it first.', [['I’d be honoured.', () => { give('rope', -1); if (st === 0) qStage('bell', 1); qStage('bell', 2); return null; }, 1]]);
    if (st === 0) return node('Marta keeps good hemp rope at her shop on the square, east side.', [bye]);
    if (st === 2) return node('The rope hangs under the tower, by the door. Pull, and let the valley hear.', [bye]);
    return node('Listen. The valley has its voice again.', [['What is the Dawn?', () => node('Only that the night ends. Every night, without fail. We find that worth a small stone house and a bell.')], bye]);
  },
  marta() {
    return node('Quill’s Sundries. If I don’t have it, you don’t need it.', [['Hemp rope. (15 gold)', () => TALK.buy('rope', 15, 'Thirty feet of the best. Don’t hang anything you can’t lift.'), qAt('bell') === 0 && !has('rope')], ['A rye loaf. (3 gold)', () => TALK.buy('bread', 3, 'Baked this morning. Mostly.')], ['An apple. (1 gold)', () => TALK.buy('apple', 1, 'From Edda’s trees. Sweetest in the valley.')], ['Any news?', () => node('I trade with the lowland caravans twice a year. The rest of the time I trade in gossip, and the price is always fair.')], bye]);
  },
  buy(id, cost, line) { if (S.gold < cost) return node('That’s ' + cost + ' gold, dear, and you have ' + S.gold + '. Greta or Brandt might have paying work.'); gold(-cost); give(id); toast('Bought: ' + ITEMS[id][0]); if (id === 'rope' && qAt('bell') === 0) qStage('bell', 1); save(); return node(line, [['Something else.', TALK.marta], bye]); },
  rowan() {
    if (qAt('fire') === 99) return node('Brackenfell remembers its friends. Stay as long as you like. Stay for good, if the road will let you.');
    if (qAt('fire') >= 0 || allHelped()) {
      if (qAt('fire') < 0) qStart('fire');
      return node('The inn has its ale, the forge its hammer, Maren her remedies, and the bell its voice. Do you know how long it has been since Brackenfell was whole? We used to light a fire in the square at harvest’s end, and the whole valley would come. Light it tonight. You have earned the tinder.', [['I will light it.', () => { qStage('fire', 1); return null; }, 1]]);
    }
    const left = [['ale', 'Greta needs her malt'], ['hammer', 'Brandt has lost his hammer'], ['herbs', 'Maren wants frostcaps'], ['bell', 'the Dawn bell is silent']].filter(x => qAt(x[0]) !== 99).map(x => x[1]);
    return node('Sit a while. An old man’s stories are all the entertainment this square can afford.', [['Tell me a story.', () => node('Before the bell there was the beacon on the crag, and before the beacon, only the stars. We have always found some way to say: here we are. Come and find us.')], ['How can I help the village?', () => node(qAt('welcome') < 99 && qAt('ale') < 0 ? 'Begin with Greta at the inn. Everything in Brackenfell begins there.' : 'There are troubles enough: ' + left.join(', ') + '. Mend those, and come back to me.')], bye]);
  },
  edda: () => node('Wheat’s in, mostly. Chickens are out, always.', [['Is this your farm?', () => node('Fairweather land, five generations. The soil is thin and the summers short, but the bread tastes of it. If you see Bram dawdling at the market, tell him the barn won’t sweep itself.')], bye]),
  finn: () => node('Shh. You’ll scare the char.', [['Any luck today?', () => node('Mirrormere gives what she gives. She’s deep in the middle, mind. Deeper than the watchtower is tall, they say. Oh, and there’s one of Maren’s blue flowers on the shore yonder, if you’re collecting.')], bye]),
  lark: () => node('A song for the traveller? I know nine. Seven of them are sad.', [['Play something.', () => { Audio2.luteRequest = 12; return node('This one’s called “The Road Goes Ever Up.” It isn’t about anything. The good ones never are.'); }], ['What brought you here?', () => node('I came for one night, two winters ago. Greta’s ale is a kind of gravity.')], bye]),
  wren: () => node('You walk loud.', [['Seen any frostcaps?', () => node('Forest edge, north-west of the gate. Another on the rocks above the river, north of the bridge. And one past my cabin, where the ground stays cold. Don’t trample them.')], ['What do you hunt?', () => node('Hare. Grouse. Silence, mostly.')], bye]),
  pip: () => node('Have you seen a chicken? Not for any reason.', [['What are you up to?', () => node('My mum sells cloth and says I have to stay where she can see me. So I’m going to be a knight. Or a chicken farmer. I haven’t decided.')], bye]),
  ivo: () => node('Patrol’s quiet. Keep to the roads after dark, friend.', [['How old is the bridge?', () => node('Stonewater Bridge? Older than the village. Older than the chapel. Whoever built it meant for something to be on the other side.')], bye]),
  hilda: () => node('Wool from the high pastures, dyed with Maren’s roots. Feel that. Go on.', [['It’s lovely work.', () => node('It keeps us fed. And if my Pip offers to sell you a chicken, it isn’t hers.')], bye]),
  bram: () => node('Apples! Cabbages! Oh. Sorry. Habit.', [['An apple, please. (1 gold)', () => { if (S.gold < 1) return node('Not a coin? Go on, then. Don’t tell Edda.', [['Thanks, Bram.', () => { give('apple'); toast('Received: Apple'); return null; }]]); gold(-1); give('apple'); toast('Bought: Apple'); return node('Best in the valley. Only in the valley, mind, but still.'); }], bye]),
};

// ── outlaw trouble (92_foes.js): extra lines for the elder, the smith, the warden and the herbalist, slotted in before their farewell ──
{
  const base = { rowan: TALK.rowan, brandt: TALK.brandt, hale: TALK.hale, maren: TALK.maren };
  const add = (n, opts) => { const i = n && n.o ? n.o.indexOf(bye) : -1; if (i >= 0) n.o.splice(i, 0, ...opts.filter(Boolean)); return n; };
  TALK.rowan = () => add(base.rowan(), [
    qAt('camp') < 0 && qAt('welcome') === 99 && ['Is the valley safe?', () => node('Safer than most. But there has been smoke in the pines north-west of the gate these three nights, and it is not Wren’s. Outlaws, come down off the passes before the snow. Hale cannot leave the gate, and I am too old to do more than worry. If you carry a blade and know its use, drive them off. Mind the big one.', [['I’ll see to it.', () => { qStart('camp'); if (RPG.st().cleared && RPG.st().cleared.pines !== undefined) qStage('camp', 1); return null; }, 1], ['Not today.', null]])],
    qAt('camp') === 0 && ['About the outlaws…', () => node('North-west of the gate, among the pines. You will see their rag on a pole before they see you, if you are careful. Eat before you go, and do not be too proud to run.')],
    qAt('camp') === 1 && ['The camp in the pines is empty.', () => { gold(60); give('buckler'); toast('Received: ' + ITEMS.buckler[0]); qDone('camp'); return node('Then the children can pick berries at the wood’s edge again. This was my father’s, and it has hung on the wall long enough. Take it, with the village’s thanks.'); }, 1],
  ]);
  TALK.brandt = () => add(base.brandt(), [
    qAt('tools') < 0 && ['Have the outlaws troubled you?', () => node('Troubled me? They had my second-best tongs and a roll of files off the cart at the ford, a week gone. Their chief wears them on his belt like trophies. One ear, red beard. They camp west of the path up to the old watchtower. Bring my tools back and I’ll put a proper sword in your hand, not that kitchen iron.', [['I’ll get them back.', () => { qStart('tools'); if (has('tools')) qStage('tools', 1); return null; }, 1], ['Another time.', null]])],
    has('tools') && qAt('tools') !== 99 && ['I have your tongs and files.', () => { give('tools', -1); give('ironsword'); toast('Received: ' + ITEMS.ironsword[0]); gold(20); if (qAt('tools') < 0) qStart('tools', 1); qDone('tools'); return node('Hah! Not a scratch on them. As promised: an arming sword, drawn out this spring and waiting for a hand. Keep the point low and your feet moving.'); }, 1],
    ['Show me what you have for sale.', () => Inv.shop('brandt')],
    ['I have things to sell.', () => Inv.sell('brandt')],
  ]);
  TALK.hale = () => add(base.hale(), [
    qAt('bounty') < 0 && qAt('welcome') > 0 && ['Any work for a sword?', () => { qStart('bounty'); bountyText(); return node('There’s coin on the board for outlaws, and I’ll pay it myself. Five of them put down and the road is a road again. Two camps: one in the pines north-west of here, one under the old watchtower. Don’t take on more than you can see.'); }, 1],
    qAt('bounty') === 1 && ['I’ve come for the bounty.', () => { gold(45); qDone('bounty'); return node('Five, by my count and yours. Paid in full. You’ve done the valley a turn, and I’ll not forget it.'); }, 1],
  ]);
  TALK.maren = () => add(base.maren(), [['A red tonic. (24 gold)', () => { if (S.gold < 24) return node('Twenty-four, child. Frostcaps do not pick themselves.'); gold(-24); give('potion'); toast('Bought: ' + ITEMS.potion[0]); save(); return node('Drink it when you bleed, not before. It is no use against foolishness.'); }]]);
}
const bountyN = () => Math.min(BOUNTY_N, (S.rpg && S.rpg.bounty) || 0);
function bountyText() { QUESTS.bounty.stages[0] = 'Put down five outlaws (' + bountyN() + ' of ' + BOUNTY_N + ')'; }
// called by 92_foes.js
function onFoeKilled(f) {
  if (qAt('bounty') === 0) { S.rpg.bounty = (S.rpg.bounty || 0) + 1; bountyText(); if (S.rpg.bounty >= BOUNTY_N) qStage('bounty', 1); else toast('<b>Bounty</b> ' + bountyN() + ' of ' + BOUNTY_N + ' outlaws'); uiObjective(); }
}
function onCampCleared(id) {
  toast(id === 'pines' ? 'The camp in the pines is silent.' : 'Garrick’s camp is silent.');
  if (id === 'pines' && qAt('camp') === 0) qStage('camp', 1);
}

// ── interactions ──
function interactLabel(it) {
  if (it.npc) { const w = it.npc.name.split(' '); return 'Talk to ' + (['Old', 'Brother', 'Elder', 'Warden', 'Guardsman'].includes(w[0]) ? w[1] : w[0]); }
  if (it.kind === 'chest') return S.opened[it.id] ? null : 'Open chest';
  if (it.kind === 'loot') return 'Search ' + it.name;
  if (it.kind === 'pickup') return it.gone ? null : it.label;
  if (it.kind === 'read') return 'Read';
  if (it.kind === 'bed') return 'Sleep';
  if (it.kind === 'bell') return qAt('bell') >= 2 ? 'Ring the bell' : null;
  if (it.kind === 'shopitem') return 'Hemp rope';
  if (it.kind === 'bonfire') return qAt('fire') === 1 ? 'Light the harvest fire' : null;
  return null;
}
function interactUse(it) {
  if (it.npc) { if (it.npc.anim === 'lie') return toast(it.npc.name + ' is fast asleep.'); return startTalk(it.npc); }
  if (it.kind === 'chest') {
    S.opened[it.id] = 1; Audio2.chest();
    const got = []; for (const [id, n] of it.loot || []) { if (id === 'gold') { S.gold += n; got.push(n + ' gold'); } else { give(id, n); got.push((n > 1 ? n + ' × ' : '') + ITEMS[id][0]); } }
    toast('Found: ' + got.join(', ')); uiPurse(); save();
  } else if (it.kind === 'loot') {
    const got = []; Audio2.pickup();
    for (const [id, n] of it.loot) { if (id === 'gold') { S.gold += n; got.push(n + ' gold'); } else { give(id, n); got.push((n > 1 ? n + ' × ' : '') + ITEMS[id][0]); } }
    const i = World.interact.indexOf(it); if (i >= 0) World.interact.splice(i, 1); if (it.foe) it.foe.looted = true;
    toast('Taken: ' + got.join(', ')); uiPurse();
    if (has('tools') && qAt('tools') !== 99) { if (qAt('tools') < 0) qStart('tools', 1); else qStage('tools', 1); }
    save();
  } else if (it.kind === 'pickup') {
    it.gone = true; it.obj.visible = false; if (it.em) it.em.gone = true; S.picked[it.id] = 1; give(it.item); Audio2.pickup();
    if (it.item === 'frostcap') { toast('Frostcap gathered (' + Math.min(frostN(), 5) + ' of 5)'); if (qAt('herbs') === 0 && frostN() >= 5) qStage('herbs', 1); }
    else { toast('Taken: ' + ITEMS[it.item][0]); if (it.item === 'hammer') { if (qAt('hammer') < 0) qStart('hammer', 2); else qStage('hammer', 2); } }
    save();
  } else if (it.kind === 'read') {
    openReader(it.title, it.text + (it.id === 'board' ? '\n\nBOUNTY. Outlaws on the passes. Coin paid for five put down. See Warden Hale at the gate.' : ''));
    if (it.id === 'board' && qAt('bounty') < 0 && qAt('welcome') >= 0) { qStart('bounty'); bountyText(); }
  }
  else if (it.kind === 'bed') {
    if (!S.flags.bed) return toast('This bed isn’t yours. Greta at the bar lets rooms.');
    fadeDo(() => { Env.hour = 7; World.festival = false; for (const n of NPCS) n.override = null; npcSnapAll(); const r = RPG.st(); r.hp = RPG.MAXHP; r.sta = RPG.MAXST; Foes.calm(true); toast('You wake rested. A new morning in Brackenfell.'); save(); });
  } else if (it.kind === 'bell') { Audio2.bell(1); World.bellSwing = 3; if (qAt('bell') === 2) { qDone('bell'); S.flags.bell = 1; toast('The Dawn bell rings out over the valley.'); } }
  else if (it.kind === 'shopitem') toast('Marta: “Fifteen gold, dear. Ask me at the counter.”');
  else if (it.kind === 'bonfire') lightHarvestFire();
}
function lightHarvestFire() {
  fadeDo(() => {
    Env.hour = 19.55; World.bonfire = true; S.flags.fire = 1; World.festival = true;
    NPCS.forEach((n, i) => { const sp = 'fire.' + i; if (!World.spots[sp]) return; n.override = [[0, sp, n.id === 'lark' ? 'lute' : (i % 3 === 0 ? 'cheer' : 'idle')]]; npcArrive(n, sp, n.override[0][2]); n.goal = sp; });
    Player.pos[0] = World.bonfirePos[0] + 1.5; Player.pos[2] = World.bonfirePos[1] + 8.5; Player.yaw = -0.17; Player.pitch = 0.05;
    qDone('fire'); Audio2.luteRequest = 60;
    setTimeout(() => banner('Brackenfell', 'You are home'), 2600);
  });
}
function festivalSpots() {
  const b = World.bonfirePos;
  NPC_DEFS.forEach((d, i) => { const a = i / NPC_DEFS.length * TAU + 0.2, r = 4.3 + (i % 3) * 0.9, x = b[0] + Math.cos(a) * r, z = b[1] + Math.sin(a) * r; World.spots['fire.' + i] = { p: [x, World.groundY(x, z), z], yaw: headingTo(x, z, b[0], b[1]), zone: 0 }; });
  World.interact.push({ p: [b[0], World.groundY(b[0], b[1]) + 0.8, b[1]], r: 3.0, zone: 0, kind: 'bonfire', id: 'bonfire' });
}
// ── saving (a convenience only: one browser, may be unavailable) ──
// v 2 adds S.rpg (health, gear, outlaws). Saves without it still load: RPG.st() fills in what is missing.
function save() { try { localStorage.setItem('brackenfell.v1', JSON.stringify({ v: 2, S, hour: Env.hour, pos: Player.pos, yaw: Player.yaw })); } catch (e) { } }
function loadSave() { try { const j = JSON.parse(localStorage.getItem('brackenfell.v1') || 'null'); return j && j.S ? j : null; } catch (e) { return null; } }
function applySave(j) {
  delete S.rpg; Object.assign(S, j.S); Env.hour = j.hour || 9.5; if (j.pos) { Player.pos = j.pos; Player.yaw = j.yaw || 0; }
  for (const p of World.pickups) if (S.picked[p.id]) { p.gone = true; p.obj.visible = false; if (p.em) p.em.gone = true; }
  if (S.flags.fire) World.bonfire = true;
  if (S.rpg && S.rpg.v !== 2) S.rpg = null;
  RPG.st(); bountyText(); if (typeof Combat !== 'undefined') Combat.refresh();
}
function clearSave() { try { localStorage.removeItem('brackenfell.v1'); } catch (e) { } }
