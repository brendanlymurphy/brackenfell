// [audit] Pairs of villagers who can be seen together and cannot be told apart. For each villager: body model, skin, hair, hat, garment colours
// as the game dresses them; for each hour, where they stand. Pairs = same body and similar dress, within 25 m of each other at some hour.
// Then a face-on picture of each person in the worst pairs. usage: node test/audit/run.mjs --size 480x300 --dir shots/audit --json shots/audit/lookalikes.json test/audit/lookalikes.js
const r2 = v => Math.round(v * 100) / 100, col = c => Array.isArray(c) ? c.map(r2) : (c && typeof c === 'object' && c.r !== undefined ? [r2(c.r), r2(c.g), r2(c.b)] : null);
const L = NPCS.map(n => { const ch = n.ch || {}, d = n.def; let wear = null; try { wear = ch.wearCol ? Array.from(ch.wearCol).slice(0, 24).map(r2) : null; } catch (e) { }
  return { id: n.id, name: n.name, body: typeof ch.body === 'string' ? ch.body : d.body || n.id, skin: d.skin || '', hair: d.hair || '', hairStyle: d.hairStyle || '', hat: d.hat || '', hatCol: col(d.hatCol), top: col(d.top), legs: col(d.legs), tint: d.tint || null, wear, female: !!d.female, age: d.cast ? d.cast.age : null }; });
Env.dayLength = 0; const pos = {};
for (let h = 6; h < 23; h++) { Env.hour = h + 0.5; npcSnapAll(); game.step(3, 1 / 30); for (const n of NPCS) { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); (pos[n.id] = pos[n.id] || []).push([h, c ? c.id : '', r2(n.pos[0]), r2(n.pos[2])]); } }
return { looks: L, pos };
