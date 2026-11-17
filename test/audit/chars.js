// [audit] Every villager at 1 m: one picture at 11:00 doing what their day says, and up to three people for every other animation in anyone's day. Also counts people standing in each other.
// usage: node test/audit/run.mjs --size 480x300 --dir shots/audit --json shots/audit/chars.json test/audit/chars.js
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
Env.dayLength = 0; const dt = 1 / 30, out = { shots: [], close: [], anims: {}, props: {} };
const at = h => { Env.hour = h; npcSnapAll(); game.step(8, dt); };
let cur = null; const go = id => { if (cur === id) return; if (cur) { game.leave(); game.step(2, dt); } if (id) { game.enter(id); game.step(4, dt); } cur = id; };
const snapOf = async (n, tag, h) => { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); go(c ? c.id : null); at(h); const fx = Math.sin(n.yaw), fz = -Math.cos(n.yaw), low = n.anim === 'lie' ? 0.75 : n.anim === 'sit' ? 1.15 : 1.5, d = n.anim === 'lie' ? 1.3 : 1.15;
  const side = n.anim === 'lie' ? 0.9 : 0.35, px = n.pos[0] + fx * d - fz * side, pz = n.pos[2] + fz * d + fx * side; const yaw = Math.atan2(n.pos[0] - px, -(n.pos[2] - pz)) * 180 / Math.PI;
  game.shot(px, n.pos[1] + low, pz, yaw, n.anim === 'lie' ? -28 : -6, h); await __snap('chars/' + tag); out.shots.push({ tag, id: n.id, name: n.name, anim: n.anim, at: typeof n.at === 'string' ? n.at : '', cell: c ? c.id : '', prop: n.def.prop || null, hour: h }); };
// people in each other: any two within 0.45 m, any hour
for (let h = 0; h < 24; h++) { at(h + 0.5); for (let i = 0; i < NPCS.length; i++) for (let j = i + 1; j < NPCS.length; j++) { const a = NPCS[i], b = NPCS[j]; if (Math.abs(a.pos[1] - b.pos[1]) < 1 && Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]) < 0.45) out.close.push([h, a.name, b.name, +Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]).toFixed(2), typeof a.at === 'string' ? a.at : '']); } }
for (const n of NPCS) { for (const s of n.def.sched || []) (out.anims[s[2]] = out.anims[s[2]] || []).push([n.id, s[0]]); if (n.def.prop) out.props[n.id] = n.def.prop; }
at(11.0); const order = NPCS.slice().sort((a, b) => { const ca = Cells.at(a.pos[0], a.pos[1], a.pos[2]), cb = Cells.at(b.pos[0], b.pos[1], b.pos[2]); return (ca ? ca.id : '').localeCompare(cb ? cb.id : ''); });
for (const n of order) { at(11.0); await snapOf(n, 'day_' + n.id, 11.0); }
for (const a in out.anims) { if (a === 'idle') continue; const seen = new Set(); let k = 0; for (const [id, h0] of out.anims[a]) { if (seen.has(id) || k >= 3) continue; seen.add(id); k++; const n = NPCS.find(p => p.id === id), h = (h0 + 0.4) % 24; at(h); await snapOf(n, 'anim_' + a + '_' + id, h); } }
go(null); st.remove(); return out;
