// [cast] Who sleeps where, counted from the cast (54_cast.js, generated from docs/PEOPLE.md) and the 17 story people, so a house plan can give every sleeper a bed
// of their own (72k_houses.js, 72h_trades.js, 72f_underworld.js ask castBeds). Loaded before the plans.
const CAST_STORY_HOME = { greta: 'inn', lark: 'inn', brandt: 'smithy', tobin: 'smithy', marta: 'store', rowan: 'elder', maren: 'herbalist', hale: 'guardhouse', ivo: 'guardhouse', hilda: 'weaver', pip: 'weaver', aldous: 'chapel', osric: 'mill', edda: 'farm', wren: 'hunter', finn: 'fisher', bram: 'in.67' };
function castSleepers(id) { let n = 0; for (const p of CAST) if (p.home === id) n++; for (const k in CAST_STORY_HOME) if (CAST_STORY_HOME[k] === id) n++; return n; }
// the names of the beds a room is to hold: what the plan would give anyway, and more ('bed2', 'bed3') while the house has more sleepers than beds. `other` = beds the plan puts in its other rooms.
function castBeds(id, list, other) { const out = list.slice(), need = castSleepers(id) - (other || 0); for (const nm of ['bed', 'bed2', 'bed3', 'bed4'].slice(other || 0)) { if (out.length >= need) break; if (!out.includes(nm)) out.push(nm); } return out; }
