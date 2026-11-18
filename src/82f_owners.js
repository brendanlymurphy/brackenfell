// ── Houses are somebody's (A13, BLUEPRINT 7.1) ──
// [cast] Until now nothing happened when you walked into a house: doors never locked, nobody looked up, and once Greta had let you a room you could sleep in
// any of the town's beds with its owner in it. Now every house of the table has its people (54_cast.js; the story's seventeen by CAST_STORY_HOME):
//   by day     whoever is at home has a word for you as you come in (their own line, once a day);
//   at night   a house is barred from ten till six, a shop from six in the evening till eight, unless one of its people knows you (has told you who they are);
//              a pick may still open it, and then whoever is at home tells you to go (their own `nt` line) and after a short while you are put out at the door;
//   beds       a bed in somebody's house is theirs: you sleep at the Hart.
// Open to all at all hours: the Hart and the chapel. Left alone: the guardhouse (the cell is the Warden's business), houses with a lock of their own (Widow Hale's).
const OWN = { of: {}, pub: { inn: 1, chapel: 1, guardhouse: 1 }, cell: null, t: 0, said: false, acc: 0 };
for (const p of CAST) (OWN.of[p.home] = OWN.of[p.home] || []).push(p.id);
for (const id in CAST_STORY_HOME) (OWN.of[CAST_STORY_HOME[id]] = OWN.of[CAST_STORY_HOME[id]] || []).push(id);
OWN.name = id => { const n = typeof NPC !== 'undefined' && NPC[id]; return n ? n.name : id; };
OWN.shop = id => /^shop\./.test(id) || id === 'store';                       // a lock-up shop: nobody sleeps there (Marta does, over hers: the shop below is shut all the same)
OWN.keepers = id => (OWN.of[id] || []).concat(CAST.filter(p => p.work === id && p.home !== id).map(p => p.id));
OWN.night = id => { const h = Env.hour; return OWN.shop(id) ? (h >= 18 || h < 8) : (h >= 22 || h < 6); };
OWN.friend = id => OWN.keepers(id).some(k => { const p = CAST.find(q => q.id === k); return p ? Memory.heard(k, p.lines.me) : Object.keys(Memory.of(k)).length >= 3; });
OWN.owned = id => !OWN.pub[id] && OWN.keepers(id).length > 0;
// the doors
function ownApplyLocks() {
  for (const c of Cells.list || Object.values(Cells.by)) { if (!c || !c.portalOut || c.portalOut.lock || !OWN.owned(c.id)) continue;          // a door with a lock of its own keeps it
    c.portalOut.lock = () => { if (!OWN.night(c.id) || OWN.friend(c.id)) return null; const who = OWN.keepers(c.id)[0];
      return ixLockTry({ hard: 0.5, msg: OWN.shop(c.id) ? 'Shut. ' + OWN.name(who) + ' opens at eight.' : 'Barred for the night. This is ' + OWN.name(who) + '’s door.' }); }; }
}
// a bed in somebody's house
{ const _use = interactUse; interactUse = function (it) { const c = World.cell; if (it && it.kind === 'bed' && c && OWN.owned(c.id)) { const who = (OWN.of[c.id] || OWN.keepers(c.id))[0]; toast('This is ' + OWN.name(who) + '’s bed. Greta at the Hart lets rooms.'); return; } return _use.apply(this, arguments); }; }
// coming in: a word by day, a challenge at night
OWN.tick = function (dt) {
  if (!game.playing) return; const c = World.cell || null, id = c && c.id;
  if (id !== OWN.cell) { OWN.cell = id; OWN.t = 0; OWN.said = false; }
  if (!id || !OWN.owned(id) || UI.talk || Cells.busy) return; OWN.t += dt; if (OWN.t < 1.2) return;
  if (typeof SCENES !== 'undefined' && SCENES.cur && !OWN.said) { OWN.said = true; return; }          // two of the house are in the middle of saying something to each other: they do not break off to greet you
  const here = OWN.keepers(id).map(k => NPC[k]).filter(n => n && Cells.at(n.pos[0], n.pos[1], n.pos[2]) === c), night = OWN.night(id) && !OWN.shop(id) && !OWN.friend(id);
  if (!OWN.said) { OWN.said = true; const day = (RPG.st && RPG.st().day) || 0; if (!S.own || typeof S.own !== 'object') S.own = {};
    if (night) { const n = here.find(x => { const p = CAST.find(q => q.id === x.id); return p && p.lines.nt; }) || here[0]; if (n) { const p = CAST.find(q => q.id === n.id); n.yaw = n.anim === 'lie' || n.anim === 'sit' ? n.yaw : headingTo(n.pos[0], n.pos[2], Player.pos[0], Player.pos[2]); toast(p && p.lines.nt ? '<b>' + SCENES.first(p.name) + '</b>: “' + p.lines.nt + '”' : n.name + ' is awake, and looking at you. This is no hour to be in another’s house.'); OWN.out = OWN.t + 14; } }
    else if (S.own[id] !== day) { const n = here.find(x => x.anim !== 'lie' && CAST.some(q => q.id === x.id)); if (n) { const p = CAST.find(q => q.id === n.id), line = [p.lines.b1, p.lines.b2].filter(Boolean)[day % 2] || p.lines.b1; if (line) { S.own[id] = day; if (n.anim !== 'sit') n.yaw = headingTo(n.pos[0], n.pos[2], Player.pos[0], Player.pos[2]); toast('<b>' + SCENES.first(p.name) + '</b>: “' + line + '”'); } } } }
  if (night && OWN.out && OWN.t > OWN.out && here.length) { OWN.out = 0; toast('You are shown the door.'); fadeDo(() => { const cc = Cells.cur; if (cc) Cells.teleport(cc.leave); }); }
  if (!night) OWN.out = 0;
};
SCENES.first = nm => { const w = nm.split(' '); return w[0] === 'Old' ? w[1] : w[0]; };
{ const _nu = npcUpdate; npcUpdate = function (dt) { const r = _nu.apply(this, arguments); try { OWN.tick(dt); } catch (e) { } return r; }; }
{ const _a = ixApplyLocks; ixApplyLocks = function () { const r = _a.apply(this, arguments); ownApplyLocks(); return r; }; }
