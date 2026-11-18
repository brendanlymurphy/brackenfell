// ── What has been said to you (conversation memory) ──
// [cast] Until now nothing remembered a conversation: a greeting was said again at every meeting, and the only memory (a villager's last line, kept on the
// villager and lost on reload) served the remarks. Now every line shown in the dialogue is noted against its speaker in the save (S.heard: a short hash per
// line), so a first greeting is said once, a second greeting once when the story has moved, and after that people have a word in passing. Loaded before the
// files that use it (82b_interact.js, 82d_cast.js); the noting itself is hung on showNode once the interface exists (85b_memory.js).
const Memory = {
  key(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); },
  of(id) { if (!S.heard || typeof S.heard !== 'object' || Array.isArray(S.heard)) S.heard = {}; const m = S.heard[id]; return m && typeof m === 'object' ? m : (S.heard[id] = {}); },
  heard(id, t) { return !!(t && Memory.of(id)[Memory.key(t)]); },
  hear(id, t) { if (t) Memory.of(id)[Memory.key(t)] = 1; },
  met(id) { return Object.keys(Memory.of(id)).length > 0; },
};
// Where a speech is made. Hale's first speech sent the traveller "straight down this road to the square" to find the inn, also when he was sitting in the inn
// of an evening (owner, Build 76). A speech that gives directions is given by place: at the gate the recorded line; in the Hart, and anywhere else, a line that
// is true there. These are new lines (text until recorded); the recorded one is untouched. They begin as the old one does: 82_story.js knows the speech by that.
const HALE_FIRST = {
  inn: ['hale', 'Hold there, traveller. No, sit, I am off the gate till morning. Brackenfell is a quiet place and I mean to keep it so. But you have the look of the road on you: tired, and honest enough. Greta keeps a bed for folk like you. That is her, behind the bar.'],
  town: ['hale', 'Hold there, traveller. Brackenfell is a quiet place and I mean to keep it so. But you have the look of the road on you: tired, and honest enough. Greta at the Honeyed Hart keeps a bed for folk like you. It is the tall house with the lantern, on the square.'],
};
{ const base = TALK.hale; TALK.hale = function () { const n = base.apply(this, arguments), h = typeof NPC !== 'undefined' && NPC.hale;
    if (n && h && /^Hold there, traveller\. Brackenfell is a quiet place/.test(n.t)) { const c = typeof Cells !== 'undefined' && Cells.at ? Cells.at(h.pos[0], h.pos[1], h.pos[2]) : null, cid = c && c.id, atGate = !cid && Math.hypot(h.pos[0] + 60, h.pos[2] + 6) < 14; if (cid === 'inn') n.t = HALE_FIRST.inn[1]; else if (!atGate) n.t = HALE_FIRST.town[1]; }
    return n; }; }
