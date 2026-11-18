// Counts the house walls of more than 12 m2 that have no window or door in the spec (the walls a person walks past and finds bare boards). Run: node test/ev.mjs "$(cat test/blankwalls.js)"
const out = []; let walls = 0;
for (const s of SITES) { if (!s.w || s.id === 'tower' || s.id === 'barn') continue; const h = HOUSES[s.id]; if (!h) continue;
  const up = (typeof KIT_STYLE !== 'undefined' && KIT_STYLE[s.id] && KIT_STYLE[s.id].up) || (h.up ? 1 : 0), eave = 3 * (up ? 2 : 1);
  for (const wn of ['front', 'back', 'left', 'right']) { const L = wn === 'front' || wn === 'back' ? s.w : s.d, area = L * eave; if (area <= 12) continue; walls++;
    const has = (h.windows || []).some(o => o.wall === wn) || (h.doors || []).some(o => o.wall === wn); if (!has) out.push(s.id + '.' + wn + ' ' + Math.round(area)); } }
return { walls, blank: out.length, list: out.slice(0, 80) };
