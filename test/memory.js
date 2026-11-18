// Conversation memory (src/82a_memory.js, 85b_memory.js, 82d_cast.js): what a person has said to you is kept in the save.
// A first greeting once; after it a word in passing; the second greeting once when the story has moved; the same after a save and a reload of the state.
// Hale's first speech gives the way to the inn from where he stands: the recorded line at the gate, another in the Hart. A remark comes only before a line already heard.
const bad = [], dt = 1 / 30; Env.dayLength = 0; Env.hour = 10; npcSnapAll(); game.step(3, dt);
const talk = id => { const n = NPCS.find(q => q.id === id); startTalk(n); const t = document.getElementById('dtext').textContent; endTalk(); return t; };
const p = CAST.find(q => q.when === 'body' && q.lines.g2 && q.lines.b1 && q.lines.b2), L = p.lines, was = S.flags.sawBody; delete S.flags.sawBody;
const t1 = talk(p.id), t2 = talk(p.id), t3 = talk(p.id);
if (t1 !== L.g) bad.push(p.name + ' did not greet a stranger with the first greeting'); if (t2 === L.g || t3 === L.g) bad.push(p.name + ' said the first greeting again'); if (![L.b1, L.b2].includes(t2)) bad.push(p.name + ': the second meeting is not a word in passing (' + t2.slice(0, 40) + ')');
S.flags.sawBody = 1; const t4 = talk(p.id), t5 = talk(p.id); if (t4 !== L.g2) bad.push(p.name + ' did not give the second greeting once the drowned man was known'); if (t5 === L.g2 || t5 === L.g) bad.push(p.name + ' repeated a greeting');
// through a save: the state as written and read back
{ const j = JSON.parse(JSON.stringify({ S })); const keep = S.heard; delete S.heard; Object.assign(S, saneSave(j).S); if (!S.heard || !Memory.heard(p.id, L.g)) bad.push('what was said is not in the save'); const t6 = talk(p.id); if (t6 === L.g || t6 === L.g2) bad.push(p.name + ' greeted afresh after a reload'); if (!keep) bad.push('nothing was noted'); }
// someone met only after the story has moved gives the second greeting, and never the first after it
{ const q = CAST.find(x => x.when === 'body' && x.id !== p.id && x.lines.g2); const a = talk(q.id), b = talk(q.id); if (a !== q.lines.g2) bad.push(q.name + ', first met after the body was known, did not give the second greeting'); if (b === q.lines.g) bad.push(q.name + ' went back to the first greeting'); }
if (was) S.flags.sawBody = was; else delete S.flags.sawBody;
// the three questions are answered with the table's lines
{ const n = TALK[p.id](); const ans = n.o.filter(o => o[1]).map(o => o[1]().t); for (const k of ['me', 'nb', 'pt']) if (!ans.includes(L[k])) bad.push(p.name + ' does not answer "' + k + '"'); }
// Hale's first speech, by place
{ const st = S.q.welcome; delete S.q.welcome; const REC = 'Straight down this road to the square';
  Env.hour = 10; npcSnapAll(); game.step(3, dt); const g = TALK.hale().t; if (!g.includes(REC)) bad.push('Hale at the gate does not give the recorded speech: ' + g.slice(0, 60));
  delete S.q.welcome; Env.hour = 20.5; npcSnapAll(); game.step(3, dt); const c = Cells.at(NPC.hale.pos[0], NPC.hale.pos[1], NPC.hale.pos[2]); const i = TALK.hale().t;
  if (!c || c.id !== 'inn') bad.push('Hale is not in the Hart at half past eight (the check needs him there)'); else { if (i.includes(REC)) bad.push('Hale, sitting in the Hart, sends the traveller down the road to find the Hart'); if (!/^Hold there/.test(i)) bad.push('Hale\'s speech in the Hart does not begin as the story expects'); }
  if (st) S.q.welcome = st; else delete S.q.welcome; }
if (bad.length) throw new Error('MEMORY FAIL ' + bad.length + ': ' + bad.join('; '));
return 'memory PASS first greeting once, then a word in passing; second greeting once when the story moves; kept through a save; Hale gives the way from where he is';
