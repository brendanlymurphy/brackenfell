// ── What the sixty say (docs/PEOPLE.md section 5, as data in 54_cast.js) ──
// [cast] Each of the sixty has a greeting, a second greeting once the story has moved (the drowned man is known, the bell rings again, or after either ending),
// and three things the player can ask: who they are, who lives near, and what they would point a stranger at. The lines are spoken text like any other
// (tools/voice/extract.mjs reads them from CAST) and are subtitles until they are recorded.
const CAST_WHEN = { body: () => !!S.flags.sawBody, bell: () => qAt('bell') === 99, end: () => !!S.flags.ending };
const CAST_ASK = { me: 'Who are you?', nb: 'Who lives round here?', pt: 'What should a stranger know?' };
function castTalk(p) {
  const L = p.lines, moved = L.g2 && p.when && CAST_WHEN[p.when] && CAST_WHEN[p.when]();
  const opts = () => Object.keys(CAST_ASK).filter(k => L[k]).map(k => [CAST_ASK[k], () => node(L[k], opts())]).concat([bye]);
  return node(moved ? L.g2 : L.g, opts());
}
for (const p of CAST) TALK[p.id] = () => castTalk(p);
