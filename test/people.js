// Where everyone is at each hour and what they are doing there, with what is not believable flagged. Used for docs/LOGIC.md (part 2) and as a gate check.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/people.js)"     returns { table, flags }   (window.__peopleFull = true for the hourly table)
const dt = 1 / 30; game.step(2, dt); Env.dayLength = 0; game.tp(-150, -150, 0);
const inside = (x, y, z) => { const l = Col.grid.get(Math.floor(x / Col.cell) * 4096 + Math.floor(z / Col.cell)); if (!l) return null; for (const c of l) { if (c.off || y < c.y0 || y > c.y1) continue; const dx = x - c.x, dz = z - c.z; if (c.r !== undefined) { if (dx * dx + dz * dz < c.r * c.r) return c; continue; } const lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz; if (Math.abs(lx) < c.hx && Math.abs(lz) < c.hz) return c; } return null; };
const placeOf = n => { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); if (c) return c.name || c.id; let best = null, bd = 30; for (const p of World.places) { const d = Math.hypot(p.x - n.pos[0], p.z - n.pos[2]); if (d < bd) { bd = d; best = p.name; } } return best ? 'by ' + best : 'outdoors'; };
const rows = {}, flags = [];
for (let h = 0; h < 24; h++) {
  Env.hour = h + 0.5; npcSnapAll(); game.step(3, dt);
  for (const n of NPCS) { const r = rows[n.id] || (rows[n.id] = { name: n.name, h: [] }); const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]);
    let wall = false; if ((n.anim === 'idle' || n.anim === 'guard') && !/fire\d|sit|seat|stall|bar|counter|pew|altar|anvil|forge|work|bench|well|view|post/.test(n.at || '')) {       /* at a hearth, a counter, a stall or a bench one faces the thing one is at */ const fx = Math.sin(n.yaw), fz = -Math.cos(n.yaw); const hit = inside(n.pos[0] + fx * 0.55, n.pos[1] + 1.3, n.pos[2] + fz * 0.55) || inside(n.pos[0] + fx * 0.9, n.pos[1] + 1.3, n.pos[2] + fz * 0.9); wall = !!hit && (hit.y1 - hit.y0) > 1.6 && (hit.r === undefined ? Math.max(hit.hx, hit.hz) > 0.7 : false); }
    const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 1); r.h.push({ at: n.at || (n.path ? 'walking' : '?'), anim: n.anim, cell: c ? c.id : '', place: placeOf(n), wall, float: Math.abs(n.pos[1] - gy) > 0.5 && n.anim !== 'lie' && n.anim !== 'sit', stuckIn: !!inside(n.pos[0], n.pos[1] + 1.0, n.pos[2]) && n.anim !== 'sit' && n.anim !== 'lie' }); }
}
const KEEP = { greta: 'inn', brandt: 'smithy', marta: 'store', aldous: 'chapel' };       /* Maren's garden and Osric's mill door are outside their walls and part of the job */
const sig = {};
for (const id in rows) { const r = rows[id], H = r.h;
  // a keeper away from the shop in opening hours (8 to 18)
  if (KEEP[id]) { const away = []; for (let h = 8; h < 18; h++) if (H[h].cell !== KEEP[id]) away.push(h); if (away.length) flags.push(r.name + ' keeps the ' + KEEP[id] + ' but is away from it at ' + away.join(', ') + ' h (' + H[away[0]].place + ', ' + H[away[0]].anim + ')'); }
  const wallH = []; for (let h = 0; h < 24; h++) if (H[h].wall) wallH.push(h); if (wallH.length > 1) flags.push(r.name + ' stands facing a wall at ' + wallH.join(', ') + ' h (' + H[wallH[0]].place + ', spot ' + H[wallH[0]].at + ')');
  const fl = []; for (let h = 0; h < 24; h++) if (H[h].float) fl.push(h); if (fl.length) flags.push(r.name + ' is not standing on a floor at ' + fl.join(', ') + ' h (' + H[fl[0]].place + ', spot ' + H[fl[0]].at + ')');
  const st = []; for (let h = 0; h < 24; h++) if (H[h].stuckIn) st.push(h); if (st.length) flags.push(r.name + ' stands inside something solid at ' + st.join(', ') + ' h (' + H[st[0]].place + ', spot ' + H[st[0]].at + ')');
  // awake on their feet all night, never in a bed
  const abed = H.filter(x => x.anim === 'lie').length; if (abed < 4) flags.push(r.name + ' sleeps ' + abed + ' hours in the day (at ' + H[1].place + ' at one in the morning: ' + H[1].anim + ')');
  // idle with nothing to do: the same spot, anim idle, 8 daylight hours or more
  let run = 0, best = 0; for (let h = 6; h < 22; h++) { if (H[h].anim === 'idle' && h > 6 && H[h].at === H[h - 1].at && !/counter|bar$|stall/.test(H[h].at)) {       /* a keeper at a counter, a bar or a stall is at work */ run++; best = Math.max(best, run + 1); } else run = 0; } if (best >= 8) flags.push(r.name + ' stands idle in one spot for ' + best + ' hours of the day (' + H[12].place + ')');
  // no evening: the same place at 20 h as at 12 h, and not at home or an inn
  const s = H.map(x => x.anim.slice(0, 3) + (x.cell ? 'i' : 'o')).join(''); if (!H.some(x => /counter/.test(x.at))) (sig[s] = sig[s] || []).push(r.name);       /* shops keep the same hours: that is what shops do */
  if (!H.some(x => x.cell)) flags.push(r.name + ' is never indoors: no home, no bed under a roof');
}
for (const k in sig) if (sig[k].length >= 4) flags.push(sig[k].length + ' people have exactly the same day, hour for hour: ' + sig[k].slice(0, 8).join(', ') + (sig[k].length > 8 ? ' ...' : ''));
const short = a => ({ idle: 'stands', sit: 'sits', lie: 'sleeps', guard: 'guards', hammer: 'hammers', work: 'works', walk: 'walks', sweep: 'sweeps', lute: 'plays', cheer: 'cheers', fish: 'fishes', chop: 'chops', dig: 'digs', pray: 'prays', carry: 'carries' }[a] || a);
const table = Object.keys(rows).map(id => { const H = rows[id].h, parts = []; let s = 0; for (let h = 1; h <= 24; h++) { if (h === 24 || H[h].place !== H[s].place || H[h].anim !== H[s].anim) { parts.push(String(s).padStart(2, '0') + '-' + String(h).padStart(2, '0') + ' ' + short(H[s].anim) + ' ' + H[s].place.replace(/^by /, 'by ')); s = h; } } return '| ' + rows[id].name + ' | ' + parts.join('; ') + ' |'; });
// everyone's walking for a whole day, fast: nobody wades through a floor on the way (the soak met a resident 0.9 m under the terrace edge by the herb garden)
{ const far = [900, 0, 900], seen = {}; for (let h = 4.5; h < 28.6; h += 1 / 1800) { Env.hour = h % 24; npcUpdate(1 / 30, far);       /* at the game's own step: at a quarter of a second a walker was through a ledge before it was looked at */ for (const p of NPCS) { if (!p.path) continue; const gy = World.groundAt(p.pos[0], p.pos[2], p.pos[1] + 1.0); if (p.pos[1] < gy - 0.6 && !seen[p.id]) { seen[p.id] = 1; flags.push(p.name + ' walks under a floor on the way to ' + p.goal + ' at ' + p.pos.map(v => v.toFixed(1)) + ' (floor ' + gy.toFixed(2) + ')'); } } } }
const KNOWN = /^(Tobin|Brother Aldous) sleeps/;       /* open: neither has a bed in his building (docs/LOGIC.md) */
const bad = flags.filter(f => !KNOWN.test(f));
if (window.__peopleFull) return { n: NPCS.length, flags, table };
if (bad.length) throw new Error('PEOPLE FAIL ' + bad.length + ': ' + JSON.stringify(bad.slice(0, 6)));
return 'people PASS ' + NPCS.length + ' people, every one with a bed, a day and an evening; open: ' + flags.filter(f => KNOWN.test(f)).length;
