// ── What the sixty say (docs/PEOPLE.md section 5, as data in 54_cast.js) ──
// [cast] Each of the sixty has a greeting, a second greeting once the story has moved (the drowned man is known, the bell rings again, or after either ending),
// and three things the player can ask: who they are, who lives near, and what they would point a stranger at. What has been said is remembered (82a_memory.js). The lines are spoken text like any other
// (tools/voice/extract.mjs reads them from CAST) and are subtitles until they are recorded.
const CAST_WHEN = { body: () => !!S.flags.sawBody, bell: () => qAt('bell') === 99, end: () => !!S.flags.ending };
const CAST_ASK = { me: 'Who are you?', nb: 'Who lives round here?', pt: 'What should a stranger know?' };
// The greeting is said once. When the story has moved, the second greeting is said once. After that a person you know has a word for you in passing (one of
// their two, turn about by the day), and the three questions stay: they are yours to ask, and an answer you have had is marked so.
function castGreeting(p) {
  const L = p.lines, id = p.id, moved = L.g2 && p.when && CAST_WHEN[p.when] && CAST_WHEN[p.when]();
  if (moved && !Memory.heard(id, L.g2)) return L.g2;
  if (!Memory.heard(id, L.g) && !(moved && Memory.heard(id, L.g2))) return L.g;
  const day = (typeof RPG !== 'undefined' && RPG.st && RPG.st().day) || 0, turn = [L.b1, L.b2].filter(Boolean);
  return turn.length ? turn[(day + p.name.length) % turn.length] : (moved ? L.g2 : L.g);
}
function castTalk(p) {
  const L = p.lines, opts = () => Object.keys(CAST_ASK).filter(k => L[k]).map(k => [CAST_ASK[k], () => node(L[k], opts())]).concat([bye]);
  return node(castGreeting(p), opts());
}
for (const p of CAST) TALK[p.id] = () => castTalk(p);
