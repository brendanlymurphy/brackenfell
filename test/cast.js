// The cast holds (docs/PEOPLE.md -> src/54_cast.js -> the game): every one of the sixty is in the town with the name of the table; everyone, the 17 story people
// included, sleeps in a real bed of their own in the house the table gives them; nobody answers "..."; every greeting and every answer is the table's line.
const bad = [], dt = 1 / 30; game.step(2, dt);
const STORY = { greta: 'inn', lark: 'inn', brandt: 'smithy', tobin: 'smithy', marta: 'store', rowan: 'elder', maren: 'herbalist', hale: 'guardhouse', ivo: 'guardhouse', hilda: 'weaver', pip: 'weaver', aldous: 'chapel', osric: 'mill', edda: 'farm', wren: 'hunter', finn: 'fisher', bram: 'in.67' };
if (NPCS.length !== CAST.length + 17) bad.push(NPCS.length + ' people in the town, the table has ' + (CAST.length + 17));
const beds = {};
for (const n of NPCS) { const p = CAST.find(q => q.id === n.id), home = p ? p.home : STORY[n.id]; if (!home) { bad.push(n.name + ' (' + n.id + ') is not in the table'); continue; }
  if (p && n.name !== p.name) bad.push(n.id + ' is called ' + n.name + ', the table says ' + p.name);
  const lie = [...new Set(n.def.sched.filter(r => r[2] === 'lie').map(r => r[1]))].filter(b => !(p && p.id === 'godwin' && 0));
  if (!lie.length) { bad.push(n.name + ' never goes to bed'); continue; }
  for (const b of lie) { const sp = World.spots[b]; if (!sp || !sp.lie) bad.push(n.name + ' sleeps at ' + b + ', which is not a bed'); else if (!b.startsWith(home + '.')) bad.push(n.name + ' sleeps at ' + b + ', the table says ' + home); (beds[b] = beds[b] || new Set()).add(n.id); }
  for (const r of n.def.sched) for (const sp of [].concat(r[1])) if (!World.spots[sp]) bad.push(n.name + ' is sent to ' + sp + ', which does not exist');
  if (!TALK[n.id]) { bad.push(n.name + ' has nothing to say'); continue; }
  if (p) { const nd = TALK[n.id](); if (!nd || nd.t !== p.lines.g) bad.push(n.name + ' does not greet with the table\'s line'); const asks = (nd.o || []).filter(o => o[1]); if (asks.length !== ['me', 'nb', 'pt'].filter(k => p.lines[k]).length) bad.push(n.name + ' offers ' + asks.length + ' questions'); for (const o of asks) { const a = o[1](); if (!a || !a.t || a.t === '...' || !Object.values(p.lines).includes(a.t)) bad.push(n.name + ': the answer to "' + o[0] + '" is not a line of the table'); } }
  else { const nd = TALK[n.id](); if (nd && nd.t === '...') bad.push(n.name + ' answers "..."'); } }
for (const b in beds) if (beds[b].size > 1) bad.push([...beds[b]].join(' and ') + ' share the bed ' + b);
for (const p of CAST) if (!NPCS.some(n => n.id === p.id)) bad.push(p.name + ' is in the table and not in the town');
// the second greeting comes when the story has moved
{ const p = CAST.find(q => q.when === 'body' && q.lines.g2), was = S.flags.sawBody; S.flags.sawBody = 1; if (TALK[p.id]().t !== p.lines.g2) bad.push(p.name + ' does not change greeting once the drowned man is known'); S.flags.sawBody = was; }
// [cast] a body for the age (inbox 09:40: "Roger Hask stands on a child's body"; he is drawn as m_hunter, the child at the stalls is Lettice, 14): nobody over 15 on
// a child's body, nobody under 13 on a grown one, 13 to 15 on a youth body at 0.88 to 0.95 (15:45); the body checked is the one drawn, as the table's age and the story's two children say
{ const KID = /^(m_boy|f_child)$/, STORY_AGE = { tobin: 11, pip: 9 }; let nb = 0;
  for (const n of NPCS) { const p = CAST.find(q => q.id === n.id), age = p ? p.age : STORY_AGE[n.id]; if (age === undefined) continue; const body = (n.ch && n.ch.body) || (Chars.set.cfg.look ? Chars.set.cfg.look(n.def).body : n.def.body); nb++;
    if (age > 15 && KID.test(body)) bad.push(n.name + ' (' + age + ') is drawn on a child\'s body, ' + body); if (age < 13 && !KID.test(body)) bad.push(n.name + ' (' + age + ') is drawn on a grown body, ' + body);
    if (age >= 13 && age <= 15) { const sc = n.scale || n.def.scale || 1; if (!/^(m_youth|f_maid)$/.test(body) || sc < 0.88 - 1e-6 || sc > 0.95 + 1e-6) bad.push(n.name + ' (' + age + ') is drawn on ' + body + ' at ' + sc.toFixed(2) + ', not a youth body at 0.88 to 0.95'); } }
  if (nb < CAST.length) bad.push('bodies checked for ' + nb + ' people only'); }
if (bad.length) throw new Error('CAST FAIL ' + bad.length + ': ' + bad.slice(0, 12).join('; '));
return 'cast PASS ' + NPCS.length + ' people (' + CAST.length + ' of the table, 17 of the story), ' + Object.keys(beds).length + ' beds, one sleeper each, in their own houses; nobody answers "..."; every body fits the age';
