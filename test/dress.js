// Sameness [ch4] (docs/WARDROBE.md): any two of the cast who live or work together (CAST home, CAST work) differ in hat, hair colour and the colour of their main garment,
// as the game dresses them (Chars.set.cfg.look). Returns pairs that share any of the three, and the town's spread of bodies, hats, hair colours and garment colours.
// usage: node test/audit/run.mjs --size 320x200 --dir shots test/dress.js
const cfg = Chars.set.cfg, L = {}, out = { pairs: 0, same: [], bodies: {}, hats: {}, hairs: {}, wools: {} };
const k = v => JSON.stringify(v === undefined ? null : v);
for (const c of CAST) { const def = NPC_DEFS.find(d => d.id === c.id); if (!def) continue; const l = cfg.look(def), w = l.wear || {}; L[c.id] = { c, body: l.body, hat: w.hat || null, hair: k((l.tint || {}).hair), wool: k((w.col || [])[9]) };
  out.bodies[l.body] = (out.bodies[l.body] || 0) + 1; out.hats[w.hat || 'bare'] = (out.hats[w.hat || 'bare'] || 0) + 1; out.hairs[L[c.id].hair] = (out.hairs[L[c.id].hair] || 0) + 1; out.wools[L[c.id].wool] = (out.wools[L[c.id].wool] || 0) + 1; }
const ids = Object.keys(L); for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const a = L[ids[i]], b = L[ids[j]]; const together = (a.c.home && a.c.home === b.c.home) || (a.c.work && a.c.work === b.c.work); if (!together) continue; out.pairs++;
  const same = ['hat', 'hair', 'wool'].filter(x => a[x] === b[x]); if (same.length) out.same.push(ids[i] + ' & ' + ids[j] + ': same ' + same.join(', ')); }
out.hairs = Object.keys(out.hairs).length + ' colours'; out.wools = Object.keys(out.wools).length + ' colours'; return out;
