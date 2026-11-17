// ───────────────────────── the world answers: containers, loose things, letters, ownership, locks, seats ─────────────────────────
// One generic rule for each, driven by data tables, over what the plan engine already recorded (Cells.list[].ctx.planDone.items): no per-object code.
//   containers  every recorded chest, cupboard, barrel, sack, crate or shelf becomes a thing you can open; its contents come from IX.LOOT by the household's trade
//               (and wealth), rolled from the object's id so a given barrel always holds the same; opened ones are saved in S.opened
//   loose       a few things (food, coin, candles, books) lie on the tables of each interior as small skinned objects: taking one hides it for good (S.taken)
//   letters     IX.BOOKS: read as often as you like; reading is saved (S.read) and feeds the inn's rumours and the story
//   ownership   everything in a village interior belongs to someone; taking it in front of an awake person is theft (crime, a fine, or the cell in the guardhouse)
//   locks       IX.LOCKS: a door or chest that wants a key or a pick; a pick may snap
//   seats       any recorded chair, stool, bench or pew can be sat on
Object.assign(ITEMS, {
  candle: ['Tallow candle', 'Smells of mutton. Better than the dark.', { value: 1 }],
  cheese: ['Hard cheese', 'A wedge, rind and all.', { heal: 14, value: 1 }],
  flint: ['Flint and steel', 'Every house has one and none has two.', { value: 2 }],
  pewter: ['Pewter cup', 'Dented, with someone’s initials on the foot.', { value: 6 }],
  thread: ['Spool of thread', 'Linen thread on a bobbin of birch.', { value: 2 }],
  nails: ['Handful of nails', 'Hand-forged and a little crooked.', { value: 2 }],
  herbs: ['Dried herbs', 'Tied in a bundle and smelling of summer.', { value: 3, heal: 6 }],
  silverring: ['Plain silver ring', 'A wedding ring, or the copy of one.', { value: 14 }],
  lockpick: ['Lockpick', 'A bent length of spring steel in a leather wrap. It will not last for ever.', { value: 4 }],
  stew: ['Bowl of stew', 'Mutton, barley and a heel of bread.', { heal: 40, value: 0 }],
});
const IX = { cont: [], loose: [], reads: {}, seat: [], pick: {}, sit: null, built: false, witnessed: 0, stats: { cont: 0, loose: 0, seat: 0, books: 0 } };
// loot tables: [item, weight, min, max]; gold is multiplied by the household's wealth
IX.LOOT = {
  inn: [['bread', 3], ['apple', 2], ['ale', 2], ['cheese', 2], ['gold', 3, 1, 6], ['candle', 2], ['pewter', 1], ['stew', 0.5]],
  store: [['rope', 0.6], ['candle', 3], ['thread', 2], ['gold', 3, 2, 8], ['nails', 2], ['flint', 2], ['cheese', 1]],
  smith: [['nails', 3], ['gold', 2, 2, 9], ['flint', 2], ['pewter', 1], ['tools', 0.15]],
  herb: [['herbs', 4], ['frostcap', 1.5], ['tonic', 0.6], ['gold', 2, 1, 5], ['candle', 1]],
  guard: [['gold', 3, 2, 9], ['bread', 2], ['lockpick', 0.6], ['flint', 1], ['cheese', 1]],
  chapel: [['candle', 4], ['gold', 2, 1, 4], ['bread', 1]],
  elder: [['gold', 3, 3, 12], ['candle', 2], ['silverring', 0.5], ['pewter', 1]],
  home: [['bread', 3], ['apple', 2], ['cheese', 2], ['thread', 2], ['candle', 2], ['gold', 3, 1, 5], ['flint', 1], ['silverring', 0.25], ['lockpick', 0.15], ['herbs', 1]],
};
IX.TRADE = { inn: 'inn', store: 'store', smithy: 'smith', herbalist: 'herb', guardhouse: 'guard', chapel: 'chapel', elder: 'elder' };
// container kinds: first match on the recorded id wins. [pattern, label, verb, locked share, loot multiplier]
IX.KINDS = [
  [/strongbox|chest|trunk|footlocker|srchest|cellarchest/, 'chest', 'Open the chest', 0.35, 1.3],
  [/wardrobe|cupboard|cabinet|dresser|press/, 'cupboard', 'Look in the cupboard', 0.08, 1],
  [/barrel|cask|keg|waterbrl/, 'barrel', 'Search the barrel', 0, 0.6],
  [/sack/, 'sacks', 'Search the sacks', 0, 0.6],
  [/crate|apile|cspile|hamper|basket/, 'crate', 'Search the crates', 0, 0.8],
  [/shelf|ware|books|backshelf/, 'shelf', 'Look along the shelf', 0, 0.7],
];
IX.SEAT = /chair|stool|bench|pew|seat|sbench/;
// letters and books. tags say where they may lie. 'feeds' sets a flag the rumours and the story read.
IX.BOOKS = [
  ['mill', 'A miller’s tally', 'MILL, THIS QUARTER.\nGround for the Hart: 40 sacks. Flour gone from the loft: 46.\nOsric says the Elder takes the difference at first light, and pays in coin with the wrong king’s face on it.\nThe sums do not close and I have stopped asking.', ['store', 'home', 'elder'], 'bread'],
  ['love', 'A letter, folded small', 'Wren,\nI’ll be at the stile when the bell would ring, if it rang. Bring nothing. Bring yourself.\nYours, and no one else’s,\nT.', ['home'], null],
  ['recipe', 'Greta’s ale', 'HEATHER ALE. Three parts malt, one of oats, honey from the high skeps. Steep till the kitchen smells of a good argument. Never boil. Never hurry. Never let Bram near it.', ['inn', 'home'], null],
  ['warn', 'A note under a candlestick', 'Do not walk the shore path after the new moon. The cave is not for us. We leave it what it is owed and we do not look.\nR.', ['home', 'elder'], 'cave'],
  ['gossip', 'A page of gossip', 'Hilda says Brandt has not paid for last winter’s cloth. Brandt says Hilda’s thumb is on the scale. Ask Marta, who knows both and tells each the other’s side.', ['inn', 'store'], null],
  ['drawing', 'A child’s drawing', 'A man with a lamp for a head, standing in water. Underneath, in a careful hand: THE MAN WHO DOES NOT SPEAK. Underneath that, smaller: do not tell mum.', ['home'], 'hollow'],
  ['pickheads', 'The smith’s order book', 'Forty pick-heads, drawn and tempered, for the Old Mine, the Elder’s father paying. Delivered and the carter never came for the bill. Brandt has kept the dies, for no reason he would say.', ['smith'], 'mine'],
  ['roster', 'The gate roster', 'GATE: Hale, Ivo. Dawn watch changes on the last day of each month. Hale takes it himself, always, and says it is the cold air he likes.', ['guard'], null],
  ['burial', 'The burial register', 'The last page: “Dunstan Pell, miner. Buried.” There is a stone. Beneath, in pencil, in the Sexton’s hand: there is no one in it.', ['chapel'], 'pell'],
  ['invoice', 'Marta’s invoice', 'To the Elder: candles, three gross, tallow. “For the cave.” Paid in silver. Whose cave? Do not ask. Do not write it down.', ['store', 'elder'], 'cave'],
  ['tobin', 'A scrawled note', 'I only borrowed the hammer. If you find this, B., it is by the fire ring at the tower. I am sorry. Do not tell my mum I was up there. There were lights.', ['smith', 'home'], null],
  ['herbs', 'Maren’s margin note', 'Frostcap steeped three nights quiets a hungry thing, so the old women say. I have never tried it on a man. I have thought about it.', ['herb'], 'frostcap'],
  ['will', 'A will, unsigned', 'To my sister the loom, to my brother the dog, to the Elder nothing, for he has had enough of everyone’s. If I do not wake, bury me with my face to the lake.', ['home', 'elder'], null],
  ['assay', 'A merchant’s letter', 'To the keeper of the Hart: the silver you sent to be assayed is purer than anything the Crown mints. We will buy as much as you can bring. We would very much like to know where you get it.', ['inn', 'store', 'elder'], 'silver'],
  ['fisher', 'Finn’s log', 'Third night this week: lights under the water off the north shore. Not boats. They go out when the bell would ring.', ['home', 'inn'], 'cave'],
  ['prayer', 'A prayer card', 'Dawn, who ends the night: keep the ones below who cannot climb. Keep the ones above who will not look down. Keep the bread.', ['chapel', 'home'], 'bread'],
  ['pip', 'Pip’s list', 'THINGS I KNOW. 1. Hale cries on the last day of the month. 2. The Elder talks to the lake. 3. There is a door in the Hart’s cellar that is not a cellar door.', ['home', 'inn'], 'cellar'],
  ['debt', 'A scrap with a smudge', 'Greta, I owe you three and six. Will pay when the silver’s in. — D. Pell.', ['inn', 'home'], 'pell'],
  ['cave', 'A map, drawn on a flour sack', 'THE BREAD CAVE. North shore, past the reeds, under the grey rock. Three knocks on the stone and set the pail down. Do not wait.', ['elder', 'home'], 'cave'],
  ['bounty', 'A notice', 'WANTED: the thief called the Magpie, who takes only silver and only after dark. Last seen on the weavers’ lane. Five gold from the Warden.', ['guard', 'inn', 'store'], 'magpie'],
];
IX.READ = {};
// ── helpers ──
const ixHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const ixRng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
function ixRoll(table, rnd, mult, wealth) {
  const out = [], n = rnd() < 0.22 ? 0 : 1 + (rnd() < 0.4 ? 1 : 0) + (mult > 1 && rnd() < 0.6 ? 1 : 0), tot = table.reduce((a, r) => a + r[1], 0);
  for (let i = 0; i < n; i++) { let w = rnd() * tot, row = table[0]; for (const r of table) { w -= r[1]; if (w <= 0) { row = r; break; } } const q = row[0] === 'gold' ? Math.max(1, Math.round((row[2] + rnd() * (row[3] - row[2])) * mult * (wealth || 1))) : 1; out.push([row[0], q]); }
  return out;
}
function ixTrade(c) { const id = c.id, d = typeof HDESC !== 'undefined' ? HDESC[id] : null; if (IX.TRADE[id]) return IX.TRADE[id]; if (d && d.trade && IX.LOOT[IX.TRADE[d.trade] || d.trade]) return IX.TRADE[d.trade] || d.trade; return 'home'; }
const ixWealth = c => { const d = typeof HDESC !== 'undefined' ? HDESC[c.id] : null; return d && d.wealth ? 0.7 + d.wealth * 0.5 : 1; };
const ixSpace = p => (typeof Cells !== 'undefined' && CELLS_ON) ? Cells.spaceOf(p) : 0;
const ixGot = list => list.map(([id, n]) => id === 'gold' ? n + ' gold' : (n > 1 ? n + ' × ' : '') + ITEMS[id][0]);
function ixGive(list) { for (const [id, n] of list) { if (id === 'gold') { S.gold += n; } else give(id, n); } uiPurse(); }

// ── small skinned meshes for things that lie about (made once per kind; wPickMesh is 79_wilds.js) ──
const IXMESH = {
  book(m) { m.push().RY(0.4); m.mat(MAT.CLOTH, [0.34, 0.16, 0.12], 0.4); m.box(-0.11, 0, -0.08, 0.11, 0.045, 0.08); m.mat(MAT.PLAIN, [0.82, 0.78, 0.66]); m.box(-0.1, 0.006, -0.075, 0.1, 0.039, 0.085); m.pop(); },
  letter(m) { m.push().RY(-0.3); m.mat(MAT.PLAIN, [0.84, 0.8, 0.68]); m.box(-0.09, 0, -0.06, 0.09, 0.006, 0.06); m.mat(MAT.PLAIN, [0.5, 0.1, 0.08]); m.cyl(0.03, 0.006, 0, 0.022, 0.022, 0.006, 7, 2); m.pop(); },
  candle(m) { m.mat(MAT.PLAIN, [0.86, 0.8, 0.62]); m.cyl(0, 0, 0, 0.02, 0.02, 0.17, 7, 2); m.mat(MAT.PLAIN, [0.1, 0.08, 0.06]); m.cyl(0, 0.17, 0, 0.003, 0.003, 0.02, 4, 2); },
  loaf(m) { m.mat(MAT.PLAIN, [0.62, 0.44, 0.22]); m.ball(0, 0.05, 0, 0.14, 0.06, 0.08, 9, 5); },
  cheese(m) { m.mat(MAT.PLAIN, [0.86, 0.72, 0.32]); m.poly([[-0.09, 0, -0.07], [0.09, 0, -0.07], [0.09, 0, 0.07]].reverse()); m.box(-0.07, 0, -0.05, 0.07, 0.07, 0.05); },
  mug(m) { m.mat(MAT.PLAIN, [0.46, 0.4, 0.34]); m.cyl(0, 0, 0, 0.05, 0.045, 0.11, 9, 3); },
  coins(m) { PICKMESH.coins(m); },
  apple(m) { PICKMESH.apple(m); },
  ring(m) { m.mat(MAT.METAL, [0.78, 0.78, 0.8]); m.cyl(0, 0, 0, 0.016, 0.016, 0.01, 8, 3); },
  tool(m) { m.mat(MAT.METAL, [0.5, 0.5, 0.52]); m.box(-0.09, 0, -0.012, 0.09, 0.014, 0.012); m.mat(MAT.TIMBER, COL.wood); m.box(0.0, 0, -0.016, 0.1, 0.02, 0.016); },
};
IX.MESHOF = { book: 'book', letter: 'letter', candle: 'candle', bread: 'loaf', cheese: 'cheese', apple: 'apple', gold: 'coins', pewter: 'mug', silverring: 'ring', nails: 'tool', flint: 'tool' };
IX.mesh = kind => { IX._pm = IX._pm || {}; return IX._pm[kind] || (IX._pm[kind] = wPickMesh(IXMESH[kind])); };

// ── the scan: every planned interior ──
function ixScan() {
  if (IX.built) return; IX.built = true;
  const used = new Set();
  for (const c of Cells.list) {
    const P = c.ctx && (c.ctx.planDone || c.ctx.plan); if (!P || !P.items || !P.w2) continue;
    const trade = ixTrade(c), wealth = ixWealth(c), table = IX.LOOT[trade] || IX.LOOT.home, owner = c.id, name = c.name;
    const surf = [];
    for (const it of P.items) {
      if (it.kind !== 'floor' && it.kind !== 'rug') continue; const id = String(it.id || '');
      if (it.kind === 'floor') {
        const L = P.lv[it.k] || P.lv[0], y0 = it.y0 !== undefined ? it.y0 : L.y;
        if (IX.SEAT.test(id) && it.h <= 1.1) { const p = P.w2(it.cx, y0 + (it.h || 0.45), it.cz); const s = { kind: 'seat', id: 'seat.' + id, p, r: 1.8, zone: P.zone, cell: c.id, yaw: (it.rot || 0) + P.yaw, h: it.h || 0.45 }; IX.seat.push(s); World.interact.push(s); IX.stats.seat++; continue; }
        const k = IX.KINDS.find(k => k[0].test(id)); if (k && !used.has(id)) { used.add(id); const rnd = ixRng(ixHash(id)); const p = P.w2(it.cx, y0 + Math.min(it.h || 0.6, 1.2) * 0.7, it.cz);
          const o = { kind: 'cont', id: 'cont.' + id, ck: k[1], verb: k[2], p, r: 1.9, zone: P.zone, cell: c.id, owner, ownerName: name, locked: rnd() < k[3] * (trade === 'guard' || trade === 'elder' ? 1.5 : 1), loot: ixRoll(table, rnd, k[4], wealth) };
          IX.cont.push(o); World.interact.push(o); IX.stats.cont++; }
        if (it.top > 0.5 && it.w && it.d) surf.push({ it, y: y0 + it.top });
      }
    }
    // loose things on the tables and counters: at most four per interior, one of them a letter or book when the pool has one for this trade
    const rnd = ixRng(ixHash('loose.' + c.id)); const slots = surf.sort(() => rnd() - 0.5).slice(0, 4); let n = 0;
    const pool = IX.BOOKS.filter(b => b[3].includes(trade === 'smith' ? 'smith' : trade === 'herb' ? 'herb' : trade === 'chapel' ? 'chapel' : trade === 'guard' ? 'guard' : trade === 'inn' ? 'inn' : trade === 'store' ? 'store' : trade === 'elder' ? 'elder' : 'home'));
    for (const sl of slots) {
      const it = sl.it, lx = it.cx + (rnd() - 0.5) * Math.max(0.2, it.w * 0.5), lz = it.cz + (rnd() - 0.5) * Math.max(0.2, it.d * 0.5), p = P.w2(lx, sl.y + 0.01, lz);
      const id = 'loose.' + c.id + '.' + (n++);
      let rec;
      if (n === 1 && pool.length) { const b = pool[(ixHash(c.id) >>> 3) % pool.length]; if (!IX.READ[b[0]] || rnd() < 0.2) { IX.READ[b[0]] = id; rec = { kind: 'read', mesh: rnd() < 0.5 ? 'book' : 'letter', id: 'book.' + b[0], book: b, title: b[1], text: b[2], feeds: b[4] }; IX.stats.books++; } }
      if (!rec) { const row = IX.PUT[(rnd() * IX.PUT.length) | 0]; rec = { kind: 'loose', mesh: row[0], item: row[1], qty: row[2] ? 1 + ((rnd() * row[2]) | 0) : 1, id }; }
      const mi = IX.mesh(rec.mesh), obj = addSkinned(mi, { c: p, r: 0.5, zone: P.zone, kind: 'pickup', cell: c.id });
      R.boneData.set(m4.translate(m4.create(), p[0], p[1], p[2]), obj.slot * 256);
      const o = Object.assign(rec, { p: [p[0], p[1] + 0.12, p[2]], r: 1.7, zone: P.zone, cell: c.id, obj, owner, ownerName: name, lid: id });
      o.kind0 = rec.kind; o.kind = rec.kind === 'read' ? 'read' : 'loose'; if (rec.kind === 'read') { o.kind = 'read'; o.title = rec.title; o.text = rec.text; o.bookId = rec.id; }
      IX.loose.push(o); World.interact.push(o); IX.stats.loose++;
    }
  }
  ixApplyLocks();
}
IX.PUT = [['loaf', 'bread'], ['apple', 'apple'], ['candle', 'candle', 2], ['cheese', 'cheese'], ['coins', 'gold', 4], ['mug', 'pewter'], ['loaf', 'bread'], ['candle', 'candle'], ['coins', 'gold', 3], ['tool', 'nails']];

// ── what happens ──
function ixOwned(it) { return !!it.owner; }
// someone awake, near, in the same space as the player
function ixWitness(extra) {
  const sp = ixSpace(Player.pos); let best = null, bd = 1e9;
  for (const n of NPCS) { if (n.anim === 'lie' || n.anim === 'sleep' || ixSpace(n.pos) !== sp) continue; const d = hyp(n.pos[0] - Player.pos[0], n.pos[2] - Player.pos[2]); if (d < (extra || (sp ? 9 : 16)) && d < bd) { bd = d; best = n; } }
  return best;
}
function ixTheft(it, value) {
  const w = ixWitness(); if (!w) return false;
  const fine = Math.max(6, Math.round(value * 2 + 6)); const c = S.crime = S.crime || { fine: 0, by: w.id, at: RPG.st().day, n: 0 }; c.fine += fine; c.n++; c.by = w.id; c.pending = true; c.t = 5;
  toast('<b>' + w.name + '</b>: “Oi! Put that back! Guards!”'); Audio2.shout(false); w.alarm = 2; w.alarmAt = Player.pos.slice();
  return true;
}
const ixValue = list => list.reduce((a, [id, n]) => a + (id === 'gold' ? n : ((RPG.meta(id).value || 1) * n)), 0);
function ixStolen(list) { S.stolen = S.stolen || {}; for (const [id, n] of list) if (id !== 'gold') S.stolen[id] = (S.stolen[id] || 0) + n; }
// the pick: a lock wants a key (S.items[key]) or a lockpick, which may snap
function ixLockTry(lk) {          // null when it opens, else the message
  if (lk.key && has(lk.key)) return null;
  if (has('lockpick')) { if (Math.random() < (lk.hard || 0.62)) { if (Math.random() < 0.3) { give('lockpick', -1); toast('The pick snaps as the lock gives.'); } return null; } give('lockpick', -1); return 'The pick snaps in the lock.'; }
  return lk.msg || 'Locked. You would need a key, or a steady hand and a pick.';
}
IX.LOCKS = {};          // cell id -> { key, msg, hard, when() } : a door that wants a key, a pick, or an hour (town secrets fill this)
function ixApplyLocks() {
  for (const id in IX.LOCKS) { const c = Cells.by[id], lk = IX.LOCKS[id]; if (!c || !c.portalOut) continue;
    c.portalOut.lock = () => { S.unlocked = S.unlocked || {}; if (S.unlocked['door.' + id]) return null; if (lk.when && !lk.when()) return lk.whenMsg || lk.msg; const m = ixLockTry(lk); if (m) return m; S.unlocked['door.' + id] = 1; toast('The lock gives.'); save(); return null; }; }
}
function ixTakeLoose(it) {
  if (it.kind0 === 'read') return;
  const list = [[it.item, it.qty || 1]]; const stolen = ixOwned(it) && ixTheft(it, ixValue(list));
  ixGive(list); if (ixOwned(it)) ixStolen(list);
  S.taken = S.taken || {}; S.taken[it.lid] = 1; it.gone = true; it.obj.visible = false; Audio2.pickup(); toast('Taken: ' + ixGot(list).join(', ') + (stolen ? '' : ''));
  if (it.item === 'gold') Audio2.coin();
  save();
}
function ixOpenCont(it) {
  if (S.opened[it.id]) return toast('Empty.');
  if (it.locked && !(S.unlocked && S.unlocked[it.id])) { { const m = ixLockTry({ key: it.key, msg: 'Locked. A small, well-oiled lock: someone cares what is in here.' }); if (m) return toast(m); } S.unlocked = S.unlocked || {}; S.unlocked[it.id] = 1; }
  S.opened[it.id] = 1; Audio2.chest();
  const list = it.loot || []; if (!list.length) { toast(it.ck === 'barrel' ? 'Nothing but damp stave and a smell of apples.' : 'Nothing. Dust, and a moth.'); save(); return; }
  const stolen = ixOwned(it) && ixTheft(it, ixValue(list)); ixGive(list); if (ixOwned(it)) ixStolen(list); toast('Taken: ' + ixGot(list).join(', ')); save();
}
function ixRead(it) {
  S.read = S.read || {}; const first = !S.read[it.bookId]; S.read[it.bookId] = 1; openReader(it.title, it.text);
  if (it.feeds) { S.flags['hear_' + it.feeds] = 1; }
  if (first) { S.notes = S.notes || []; S.notes.push(it.bookId); }
}
function ixSit(it) {
  if (IX.sit) return ixStand();
  IX.sit = { x: it.p[0], z: it.p[2], y: it.p[1], eye0: Player.eye, yaw: Player.yaw }; Player.pos[0] = it.p[0]; Player.pos[2] = it.p[2]; Player.vel = [0, 0, 0]; Player.eye = Math.max(1.05, Player.eye - (0.5 + (it.h < 0.4 ? 0.1 : 0)));
  toast('You sit. Any move stands you up.'); Audio2.pickup('wood');
}
function ixStand() { if (!IX.sit) return; Player.eye = IX.sit.eye0; IX.sit = null; }
// per frame (called from RPG.tick): sitting, the crime timer, the guard arriving, the jail door
function ixTick(dt) {
  if (IX.sit) { const k = Input.keys, mv = k.KeyW || k.KeyA || k.KeyS || k.KeyD || k.ArrowUp || k.ArrowDown || (Input.joy && Input.joy.active !== false && (Math.abs(Input.mx) + Math.abs(Input.mz) > 0.2)); if (mv || Player.locked && !UI.talk) ixStand(); else { Player.pos[0] = IX.sit.x; Player.pos[2] = IX.sit.z; Player.vel[0] = Player.vel[2] = 0; } }
  const c = S.crime; if (c && c.pending && game.playing && !uiBusy() && !Cells.busy && !RPG.dead) { c.t -= dt; if (c.t <= 0) ixGuardComes(); }
  if (S.jail && !World.cell) S.jail = 0;
}
function ixGuard() { const g = ['hale', 'ivo'].map(id => NPC[id]).filter(Boolean).sort((a, b) => hyp(a.pos[0] - Player.pos[0], a.pos[2] - Player.pos[2]) - hyp(b.pos[0] - Player.pos[0], b.pos[2] - Player.pos[2])); return g[0]; }
function ixGuardComes() {
  const c = S.crime; if (!c || !c.pending) return; c.pending = false; const g = ixGuard(); if (!g) return;
  fadeDo(() => { const a = Player.yaw, x = Player.pos[0] + Math.sin(a) * 1.4, z = Player.pos[2] - Math.cos(a) * 1.4; g.pos = [x, Player.pos[1], z]; g.path = null; g.yaw = headingTo(x, z, Player.pos[0], Player.pos[2]); g.anim = 'idle'; setTimeout(() => startTalk(g), 400); });
}
IX.crimeNode = function (g) {
  const c = S.crime, fine = c.fine, held = Object.keys(S.stolen || {}).filter(id => has(id));
  const done = () => { S.crime = null; S.stolen = {}; Audio2.ui(); };
  const opts = [];
  if (held.length) opts.push(['Hand it back.', () => { for (const id of held) give(id, -Math.min(S.items[id], S.stolen[id] || 1)); S.crime = null; S.stolen = {}; save(); return node('Good. That’s the end of it. This time.'); }]);
  opts.push(['Pay the fine. (' + fine + ' gold)', () => { if (S.gold < fine) return node('You haven’t the coin. Then it’s the cell. Come on.', [['Lead on.', () => IX.jail(g), 1]]); gold(-fine); done(); save(); return node('Paid. Keep your hands in your pockets in future.'); }]);
  opts.push(['Go quietly.', () => IX.jail(g), 1]);
  return node('Hold. That’s theft, in front of a witness, and I’ll not have it in my town. The fine is ' + fine + ' gold, or you hand it back, or you sleep in the cell and think about it.', opts);
};
// the cell door is a thing to use only while you are held. It was made when you were put in, so a reload inside the cell (a phone dropping the tab)
// left you locked in with no door to call the guard from: it is also made when a save is loaded (IX.restore).
IX.jailDoorMake = function () { const c = Cells.by.guardhouse, P = c && c.ctx && (c.ctx.planDone || c.ctx.plan); if (!P || IX.jailDoor) return IX.jailDoor; const w = P.w2(-3.0, 1.1, 8.1); IX.jailDoor = { kind: 'jaildoor', id: 'jail.door', p: w, r: 3.0, zone: P.zone }; World.interact.push(IX.jailDoor); return IX.jailDoor; };
IX.jail = function (g) {
  const c = Cells.by.guardhouse, P = c && c.ctx && (c.ctx.planDone || c.ctx.plan); if (!P) { gold(-Math.min(S.gold, S.crime ? S.crime.fine : 0)); S.crime = null; return node('There’s no cell to hold you. Go on, then.'); }
  setTimeout(() => endTalk && UI.talk && endTalk(), 0);
  fadeDo(() => {
    for (const id in S.stolen || {}) if (has(id)) give(id, -Math.min(S.items[id], S.stolen[id])); S.crime = null; S.stolen = {}; S.jail = 1; Env.hour = 6.5; const r = RPG.st(); r.hp = RPG.MAXHP;
    const q = P.w2(-3.0, 0.02, 9.6); Cells.teleport({ p: q, yaw: PI }); IX.jailDoorMake();
    toast('You wake on straw. The door is locked.'); save();
  });
  return null;
};
IX.release = function (how) { const c = Cells.by.guardhouse; if (!c) return; S.jail = 0; fadeDo(() => { Cells.teleport(c.leave); if (how === 'pick') { S.crime = { fine: 10, pending: false, by: 'hale' }; toast('You slip out while the watch is at breakfast. They will remember.'); } else toast('Hale lets you out at first light. “Don’t make me do that twice.”'); save(); }); };

// ── wiring into the story layer ──
const _il2 = interactLabel, _iu2 = interactUse;
interactLabel = function (it) {
  if (it.kind === 'cont') return S.opened[it.id] ? 'Empty' : (it.locked && !(S.unlocked && S.unlocked[it.id]) ? 'Open the locked ' + (it.ck === 'chest' ? 'chest' : 'cupboard') : it.verb);
  if (it.kind === 'loose') return it.gone ? null : 'Take ' + (it.item === 'gold' ? 'the coins' : ITEMS[it.item][0].toLowerCase());
  if (it.kind === 'seat') return IX.sit ? 'Stand up' : 'Sit down';
  if (it.kind === 'jaildoor') return S.jail ? (has('lockpick') ? 'Pick the lock' : 'Call for the guard') : null;
  if (it.bookId) return 'Read the ' + it.title.replace(/^A /, '').toLowerCase();
  return _il2(it);
};
interactUse = function (it) {
  if (it.kind === 'cont') return ixOpenCont(it);
  if (it.kind === 'loose') return ixTakeLoose(it);
  if (it.kind === 'seat') return ixSit(it);
  if (it.kind === 'jaildoor') { if (has('lockpick') && Math.random() < 0.7) { give('lockpick', -1); return IX.release('pick'); } if (has('lockpick')) { give('lockpick', -1); return toast('The pick snaps.'); } return IX.release('wait'); }
  if (it.bookId) return ixRead(it);
  return _iu2(it);
};
for (const id of ['hale', 'ivo']) { const base = TALK[id] || (() => node('Move along.')); TALK[id] = function () { if (S.crime && S.crime.pending === false && S.crime.fine > 0 && !S.jail) { const n = IX.crimeNode(NPC[id]); return n; } return base.call(this); }; }
const _as2 = applySave; applySave = function (j) { _as2(j); IX.restore(); };
IX.restore = function () { for (const o of IX.loose) if (S.taken && S.taken[o.lid]) { o.gone = true; o.obj.visible = false; } IX.sit = null; if (S.jail) IX.jailDoorMake(); };
// ── the inn: a bed for the night and a bowl of stew (eating restores; sleeping restores) ──
{ const base = TALK.greta;
  const stew = () => { if (S.gold < 3) return node('Three gold, love. Your purse says otherwise.'); gold(-3); RPG.heal(40); Audio2.eat(); toast('The stew is hot and thick: +40 health'); return node('Eat it while it’s hot. I don’t do cold.'); };
  const room = () => { if (S.gold < 4) return node('Four gold, love, and I’ll not haggle with a purse that light.'); gold(-4); S.flags.rent = RPG.st().day; save(); return node('Up the stairs, the bed by the window. Sleep till you’re done.'); };
  TALK.greta = function () { const n = base.call(this); if (n && n.o && qAt('ale') >= 0) { const i = n.o.indexOf(bye), add = [['A bowl of stew. (3 gold)', stew]]; if (!S.flags.bed) add.push(['A bed for the night. (4 gold)', room]); n.o.splice(i < 0 ? n.o.length : i, 0, ...add); } return n; }; }

// ── what people say about what you carry, what you did and the hour (a line before their own, at most once in a while) ──
IX.SAY = [
  ['*', () => S.crime && S.crime.fine > 0, 'I heard about the business with the shop. Keep your hands to yourself.'],
  ['*', () => Env.hour >= 22 || Env.hour < 4.5, 'You’re about late. Mind the dark.'],
  ['*', () => S.gold >= 120, 'You’re jingling, friend. Mind the lanes after dusk.'],
  ['*', () => S.flags.mineOpen && !S.flags.corwin, 'They say the old mine door is open. Folk are talking.'],
  ['hale', () => RPG.meta(RPG.st().eq.weapon).dmg >= 21, 'That’s a fine blade. Don’t draw it in my square.'],
  ['brandt', () => RPG.st().eq.weapon === 'ironsword', 'Good. It sits well in your hand. My work.'],
  ['brandt', () => RPG.st().eq.weapon === 'silverpick', 'Where did you get that? That’s my dies, fifty years back. Old Mine steel.'],
  ['maren', () => RPG.st().hp < RPG.MAXHP * 0.4, 'You’re bleeding on my floor. Sit.'],
  ['greta', () => has('lantern') && qAt('main') >= 3 && qAt('main') < 5, 'Off down a hole, love? I’ll keep the bed made.'],
  ['marta', () => has('lockpick'), 'Odd thing to carry. I’ll not ask.'],
  ['aldous', () => S.flags.pell && qAt('main') < 5, 'The Dawn keep you. You look as though you have seen the dead.'],
  ['finn', () => S.flags.sawBody && qAt('main') < 5, 'Still thinking about that man, aren’t you. So am I.'],
  ['ivo', () => has('lantern'), 'A lantern by day. Either you’re lost, or you’re going somewhere I’d not.'],
];
for (const id of Object.keys(TALK)) { if (typeof TALK[id] !== 'function' || id.startsWith('hale') && id !== 'hale' || ['buy', 'gretaMenu', 'brandtAbout'].includes(id)) continue; const base = TALK[id];
  TALK[id] = function () { const n = base.apply(this, arguments); const npc = NPC[id]; if (n && npc && game.playing) { const now = Env.hour + (RPG.st().day || 0) * 24; if (!(npc._said > now - 0.5)) { const row = IX.SAY.find(r => (r[0] === '*' || r[0] === id) && r[1]()); if (row) { npc._said = now; n.t = row[2] + '\n\n' + n.t; } } } return n; }; }
