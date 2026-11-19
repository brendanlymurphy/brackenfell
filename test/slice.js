// The slice (the owner, 18 Nov 16:45; docs/SLICE.md): only the kept interiors open to the player, everything the game asks of the player lies in them or out of
// doors, and every other house is locked to the player but keeps its people. Derived again from the running game, so that a new quest stage, secret, book or
// trade that points into a locked house fails here.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/slice.js)"
const bad = [], log = [], dt = 1 / 30; Env.dayLength = 0; Weather.set('fair'); if (typeof Foes !== 'undefined') Foes.calm(true);
const keep = [...SLICE.keep], all = Cells.list.map(c => c.id), locked = all.filter(id => SLICE.locked(id));
for (const id of keep) if (!Cells.by[id]) bad.push('the slice keeps ' + id + ', which is not a cell');
if (locked.length < 20) bad.push('only ' + locked.length + ' houses are locked: the slice is not applied');
const cellOf = p => { const c = Cells.at(p[0], p[1] === undefined ? CELL.y : p[1], p[2]); if (c) return c.id; for (const k of Cells.list) if (k.xdoor && Math.hypot(k.xdoor.c[0] - p[0], k.xdoor.c[2] - p[2]) < 1.2) return k.id; return null; };
// 1. what the game asks of the player lies in the slice or out of doors
const q0 = JSON.stringify(S.q), f0 = JSON.stringify(S.flags); let nq = 0;
for (const id of QORDER) for (let st = 0; st < 14; st++) for (const h of [7, 10, 13, 16, 19, 22]) { S.q = JSON.parse(q0); S.q[id] = { stage: st }; Env.hour = h; npcSnapAll(); let t = null; try { t = questTarget(id); } catch (e) { } if (!t) continue; nq++; const c = cellOf(t); if (c && SLICE.locked(c)) bad.push('quest ' + id + ' stage ' + st + ' at ' + h + ' h points into ' + c + ', which is locked'); }
S.q = JSON.parse(q0); S.flags = JSON.parse(f0); Env.hour = 12; npcSnapAll(); game.step(2, dt);
if (nq < 200) bad.push('only ' + nq + ' quest targets were looked at');
for (const s of SEC.list) { const it = World.interact.find(o => o.id === s.id), c = s.cell || (it && cellOf(it.p)); if (c && SLICE.locked(c)) bad.push('the secret ' + s.sec + ' is in ' + c + ', which is locked'); }
for (const who of Object.keys(Inv.stock).concat(['marta', 'greta'])) { const n = NPC[who]; for (const r of n ? n.def.sched : []) for (const sp of [].concat(r[1])) { const p = World.spots[sp], c = p && cellOf(p.p); if (c && SLICE.locked(c) && r[2] !== 'lie') bad.push(n.name + ' trades and works at ' + sp + ', in ' + c + ', which is locked'); } }
const books = World.interact.filter(o => o.kind === 'read' && /^book\./.test(o.id)); for (const b of books) { const c = cellOf(b.p); if (c && SLICE.locked(c)) bad.push(b.id + ' lies in ' + c + ', which is locked'); }
if (books.length < 8) bad.push('only ' + books.length + ' books lie anywhere the player can go');
for (const it of World.interact) { if (it.kind === 'cont' || it.kind === 'loose' || it.kind === 'seat' || it.kind === 'portal' || it.kind === 'bed' || it.kind === 'chest' || it.kind === 'read' && /^book\./.test(it.id) || /^(cont|loose|seat|door)\./.test(it.id || '')) continue; const c = cellOf(it.p); if (c && SLICE.locked(c)) bad.push('the story object ' + it.id + ' (' + it.kind + ') is in ' + c + ', which is locked'); }
log.push(nq + ' quest targets, ' + SEC.list.length + ' secrets, ' + books.length + ' books');
// 2. every door into a locked house refuses, a pick in hand or not, by day and by night, and says so; nothing is offered but "Locked"
const doors = World.interact.filter(o => o.kind === 'portal' && o.side === 'out' && o.dest && SLICE.locked(o.dest.cell));
if (doors.length < locked.length) bad.push(doors.length + ' doors for ' + locked.length + ' locked houses');
{ const heard = [], _t = toast; toast = function (h) { heard.push(String(h)); return _t.apply(this, arguments); }; const picks = S.items.lockpick; S.items.lockpick = 5;
  for (const h of [12, 23]) { Env.hour = h; for (const d of doors) { heard.length = 0; if (interactLabel(d) !== 'Locked') bad.push(d.id + ' is offered as "' + interactLabel(d) + '"'); interactUse(d); for (let i = 0; i < 90 && Cells.busy; i++) game.step(1, dt); if (World.cell) { bad.push(d.id + ' let the player into ' + World.cell.id + ' at ' + h + ' h'); game.leave(); game.step(2, dt); } if (!heard.some(x => /Locked/.test(x))) bad.push(d.id + ' said nothing'); } }
  if (S.items.lockpick !== 5) bad.push('a pick was used on a locked house (' + S.items.lockpick + ' left of 5)'); if (picks === undefined) delete S.items.lockpick; else S.items.lockpick = picks; toast = _t; }
// 3. every kept house opens by its door at noon
Env.hour = 12; for (const id of keep) { const c = Cells.by[id]; if (!c || !c.portalOut) continue; Cells.travel(c.portalOut.dest); for (let i = 0; i < 200 && Cells.busy; i++) { game.step(1, dt); await new Promise(r => setTimeout(r, 10)); } if (!World.cell || World.cell.id !== id) bad.push(id + ' is kept and does not open at noon (' + (Cells.lockMsg(c.portalOut) || 'no message') + ')'); game.leave(); game.step(2, dt); }
for (const id of keep) { const c = Cells.by[id]; if (c && c.portalOut && c.portalOut.lock && c.portalOut.sliceLocked) bad.push(id + ' is kept and its door is locked'); }
// 4. the locked houses keep their people: somebody still sleeps in them and comes and goes
let sleepers = 0; for (const n of NPCS) for (const r of n.def.sched) if (r[2] === 'lie') { const sp = World.spots[r[1]]; if (sp && SLICE.locked(sp.site)) { sleepers++; break; } }
if (sleepers < 20) bad.push('only ' + sleepers + ' people sleep in the locked houses');
if (bad.length) throw new Error('SLICE FAIL ' + bad.length + ': ' + bad.slice(0, 14).join('; ') + ' | ' + log.join(' | '));
return 'slice PASS ' + keep.length + ' interiors open, ' + locked.length + ' locked (' + doors.length + ' doors refuse, a pick in hand, by day and night); ' + log.join(', ') + ' all in the slice or out of doors; ' + sleepers + ' people still live in the locked houses';
