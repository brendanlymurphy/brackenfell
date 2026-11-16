// ───────────────────────── the people who live and work in the ordinary houses and shops [c5] ─────────────────────────
// Called from buildNPCs() once every plan exists. Each family house gets its keeper and, where it has a second free bed and a hearth, a partner: shopkeepers stand behind their
// counter from 8 to 18, everyone else works or minds the house, the household sits at its table from half past seven, and each sleeper has a bed of their own (a spot that lies).
// Ids are 'r_<house>' and 'r2_<house>' (house ids with the dot taken out); the spots are the plan's own ('<house>.counter', '.work', '.home', '.sit', '.seat1', '.bed', '.bed2' ...).
const HH_MALE = ['m_farmer', 'm_fisher', 'm_youth', 'm_elder', 'm_hunter'], HH_FEMALE = ['f_farmer', 'f_weaver', 'f_maid', 'f_elder', 'f_herbalist'];
const HH_MF = ['Hob', 'Wat', 'Piers', 'Jory', 'Alder', 'Cuthbert', 'Gilbert', 'Osmund', 'Tam', 'Ned', 'Rafe', 'Dunstan', 'Aldous', 'Leofric', 'Ivo', 'Sewell'];
const HH_FF = ['Agnes', 'Tilda', 'Maud', 'Nell', 'Edith', 'Joan', 'Mabel', 'Cecily', 'Isolde', 'Hawise', 'Bess', 'Alys', 'Wynne', 'Rosamund', 'Petronel', 'Gunnora'];
const HH_SUR = ['Marsh', 'Fenn', 'Thatcher', 'Holloway', 'Brook', 'Ashby', 'Lowe', 'Peverell', 'Dunmore', 'Gale', 'Sorrel', 'Wick', 'Hollin', 'Ketch', 'Bray', 'Corbin'];
const HH_TINT = [[1.7, 0.85, 0.7], [0.85, 1.05, 1.7], [1.6, 1.25, 0.6], [0.85, 1.4, 0.85], [1.7, 1.55, 1.3], [1.35, 0.9, 1.4], [1.2, 1.2, 1.7], [1.5, 1.0, 0.65]];
const HH_SKIN = ['tan', 'rosy', 'brown', 'fair', 'fair', 'tan'], HH_HAIR = ['brown', 'black', 'blond', 'auburn', 'grey', 'red', 'brown'];
function householdDefs() {
  const used = new Set(), claimed = new Set();
  for (const d of NPC_DEFS) for (const r of d.sched) for (const sp of [].concat(r[1])) if (typeof sp === 'string') { used.add(sp.split('.').slice(0, -1).join('.')); if (r[2] === 'lie') claimed.add(sp); }
  const ids = Object.keys(World.houses).filter(id => { const h = World.houses[id]; return h.plan && h.plan.fam; }).sort();
  for (const id of ids) {
    const P = World.houses[id].plan, F = P.fam, key = id.replace(/\./g, ''), H = s => hHash(id + '|' + s);
    if (used.has(id) && !/^in\.|^high\./.test(id)) continue;                     // the six buildings with their own named people already have them
    const beds = Object.keys(P.spots).filter(k => /^bed\d*$/.test(k) && World.spots[id + '.' + k] && World.spots[id + '.' + k].lie && !claimed.has(id + '.' + k));
    if (!beds.length) continue;
    const has = n => !!(World.spots[id + '.' + n] && P.spots[n]), shop = F.fam === 'shopfront' && has('counter');
    const seats = ['sit', 'seat1', 'seat2', 'seat3'].filter(has), n = Math.min(beds.length, seats.length ? 2 : 1, H('n') < 0.55 && beds.length > 1 ? 2 : 1);
    for (let i = 0; i < n; i++) {
      const fem = i === 0 ? H('g') < 0.45 : true === (H('g') >= 0.45), body = (fem ? HH_FEMALE : HH_MALE)[(H('b' + i) * 5) | 0], first = (fem ? HH_FF : HH_MF)[(H('f' + i) * 16) | 0];
      const sur = i === 0 ? (F.trade === 'household' ? HH_SUR[(H('s') * 16) | 0] : F.trade[0].toUpperCase() + F.trade.slice(1)) : HH_SUR[(H('s') * 16) | 0];
      const tn = HH_TINT[(H('t' + i) * 8) | 0], bed = beds[i], seat = seats[Math.min(i, seats.length - 1)] || 'home', up = 21.5 + H('u' + i) * 1.3, wake = 6.3 + H('w' + i) * 1.0;
      const day = i === 0 ? (shop ? [[8, id + '.counter', 'idle'], [18, id + '.home', 'idle']] : has('work') ? [[wake + 0.7, id + '.work', 'work'], [12.2, id + '.home', 'idle'], [13.2, id + '.work', 'work'], [18, id + '.home', 'idle']] : [[wake + 0.7, id + '.home', 'idle'], [18, id + '.home', 'idle']]) : [[wake + 0.8, id + '.home', 'idle'], [18, id + '.home', 'idle']];
      const sched = [[wake, id + '.home', 'idle']].concat(day, [[19.5 + i * 0.3, id + '.' + seat, 'sit'], [up, id + '.' + bed, 'lie']]).sort((a, b) => a[0] - b[0]);
      NPC_DEFS.push({ id: (i ? 'r2_' : 'r_') + key, name: first + ' ' + sur, body, tint: { tunic: tn, robe: tn, skirt: HH_TINT[(H('q' + i) * 8) | 0], pants: [1.1, 1.0, 0.9] }, skin: HH_SKIN[(H('k' + i) * 6) | 0], hair: HH_HAIR[(H('h' + i) * 7) | 0], top: [0.4, 0.36, 0.3], legs: [0.3, 0.26, 0.22], female: fem, dress: fem, sched, house: id });
      claimed.add(id + '.' + bed);
    }
  }
}
