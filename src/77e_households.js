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
// [cull] Where a household stands to work in its yard: for each plot (73m_plots.js) the first of a few places behind the house that is clear of what the yard holds,
// facing the trade. Made here, after all the town's dressing: the dressing keeps clear of named places and draws its scatter from one sequence, so a place
// added before it moved a boulder into the bridge's parapet. 77_npc.js joins each yard to its own house.
function yardSpots() {
  if (typeof plotsCompute !== 'function') return; const gy = (x, z) => World.groundY(x, z);
  const free = (x, z) => { const y = gy(x, z); for (const c of World.colliders) { if (c.y0 > y + 1.5 || c.y1 < y + 0.2) continue; const ex = x - c.x, ez = z - c.z; if (c.r !== undefined) { if (ex * ex + ez * ez < (c.r + 0.45) * (c.r + 0.45)) return false; } else if (Math.abs(ex * c.ax + ez * c.az) < c.hx + 0.45 && Math.abs(ex * c.bx + ez * c.bz) < c.hz + 0.45) return false; } return true; };
  for (const p of plotsCompute()) { const cx = (p.x0 + p.x1) / 2, wd = p.x1 - p.x0, dp = p.z1 - p.z0, zFront = p.bz > 0 ? p.z0 : p.z1;
    for (const [a, b] of [[wd * 0.28, 0.9], [-wd * 0.28, 0.9], [0, 0.9], [wd * 0.3, dp * 0.75], [-wd * 0.3, dp * 0.75], [0, dp * 0.8], [wd * 0.3, dp * 0.5], [-wd * 0.3, dp * 0.5]]) { const x = cx + a, z = zFront + p.bz * b; if (x < p.x0 + 0.5 || x > p.x1 - 0.5 || z < p.z0 + 0.4 || z > p.z1 - 0.4 || !free(x, z)) continue;
      const fl = typeof siteDoorLocal === 'function' && p.house && p.house.w ? siteDoorLocal(p.house, 1.0) : null, fw = fl ? siteToWorld(p.house, fl[0], fl[1]) : null;
      World.spots[p.id + '.yard'] = { p: [x, gy(x, z), z], yaw: Math.atan2(cx - x, -(zFront + p.bz * dp * 0.45 - z)), zone: 0, yardOf: p.id, trade: p.trade, front: fw }; break; } }
}
// [cull] The yards nobody used (Build 74 has 26 plots; 15 had no household of their own, most behind houses that are only shells). No new people: the Hart's
// regulars get the yard their name or body fits in place of an hour they spent standing about, and
// what is left goes to the nearest neighbour who keeps house, for one of the hours they swept their own floor.
const YARD_HANDS = [['pat1', 'farm.field2', 'draper.yard'], ['pat2', 'barn.front', 'in.47.yard'], ['pat3', 'alley.stall0', 'in.46.yard'], ['pat4', 'elder.porch', 'in.13.yard'], ['pat5', 'stallfront2', 'in.18.yard'], ['pat6', 'alley.stall1', 'in.42.yard'], ['pat7', 'farm.yard', 'in.11.yard']];
function yardHands() {
  const used = new Set(); for (const d of NPC_DEFS) for (const r of d.sched) for (const sp of [].concat(r[1])) if (/\.yard$/.test(sp)) used.add(sp);
  for (const [id, from, yard, hour] of YARD_HANDS) { const d = NPC_DEFS.find(q => q.id === id); if (!d || !World.spots[yard] || used.has(yard)) continue; const r = d.sched.find(q => q[1] === from && (hour === undefined || q[0] === hour)); if (r) { r[1] = yard; r[2] = 'work'; used.add(yard); } }
  for (const k of Object.keys(World.spots)) { const sp = World.spots[k]; if (!sp.yardOf || used.has(k)) continue; let best = null, bd = 60;
    for (const d of NPC_DEFS) { if (!d.house || !/^r2?_/.test(d.id) || d.sched.some(q => /\.yard$/.test(String(q[1])))) continue; const h = World.spots[d.house + '.home'], hs = SITES.find(q => q.id === d.house); if (!hs) continue; const r = d.sched.find(q => q[0] > 13 && q[0] < 18 && q[1] === d.house + '.home' && q[2] === 'sweep'); if (!r) continue; const dd = hyp(hs.x - sp.p[0], hs.z - sp.p[2]); if (dd < bd) { bd = dd; best = r; } void h; }
    if (best) { best[1] = k; best[2] = 'work'; used.add(k); } }
}
function householdDefs() {
  yardSpots();
  const HH_STALLS = ['stall1', 'stall2'].filter(k => World.spots[k]);       /* [cull] the two market stalls that had no keeper (Bram keeps stall0) */
  const used = new Set(), claimed = new Set();
  for (const d of NPC_DEFS) for (const r of d.sched) for (const sp of [].concat(r[1])) if (typeof sp === 'string') { used.add(sp.split('.').slice(0, -1).join('.')); if (r[2] === 'lie') claimed.add(sp); }
  // Nobody shares a place: who stands where in the town, and when. Pre-filled from the people who already have a day; a visit is given only if the spot is free then.
  const OCC = {}, busy = (sp, a, b) => (OCC[sp] || []).some(o => a < o[1] + 0.25 && b > o[0] - 0.25), take = (sp, a, b) => { (OCC[sp] = OCC[sp] || []).push([a, b]); };
  for (const d of NPC_DEFS) d.sched.forEach((r, k) => { const end = k + 1 < d.sched.length ? d.sched[k + 1][0] : d.sched[0][0] + 24; for (const sp of [].concat(r[1])) if (typeof sp === 'string') { take(sp, r[0], end); if (end > 24) take(sp, r[0] - 24, end - 24); } });
  const visit = (list, a, b, k) => { for (let n = 0; n < list.length; n++) { const sp = list[(k + n) % list.length]; if (World.spots[sp] && !busy(sp, a, b)) { take(sp, a, b); return sp; } } return null; };
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
      // [logic] A day that is somebody's day. Before, everyone without a counter or a bench stood at the '.home' spot from seven to six, facing the wall,
      // and thirteen households had the same day hour for hour. Now: a shopkeeper minds the counter and eats at noon; a tradesman works, eats, works
      // and goes to market before supper; those who keep house have one of four days (sweeping, water from the well, the market, chapel in the
      // morning, a walk to the wharf or the terrace, the hearth before supper), with the hours shifted a little per person; one in five goes to the Hart.
      // (the plan's 'fire1', 'stand2', 'front', 'pew1' ... are only other names for '.home' in an ordinary house, so a day is made of the places a house
      // really has: the floor by the door ('.home'), its seats, its bench or counter, and the town's well, stalls, benches and views)
      const J = (k, a) => (H(k + i) - 0.5) * 2 * a, pick = (k, l) => l[(H(k + i) * l.length) | 0], here = n => id + '.' + n, meal = here(seat), rest = here(seats[(i + 1) % Math.max(1, seats.length)] || seat);
      const MARKET = ['stallfront0', 'stallfront1', 'stallfront2', 'dstall0', 'dstall1', 'dstall2', 'dstall3', 'dstall4', 'alley.stall0', 'alley.stall1', 'alley.n', 'alley.s'], WALKS = ['wharf.view', 'terrace.view', 'bridge.west', 'dock.end', 'square.bench', 'square.bench2', 'passage.lane', 'gallery.top', 'north.top', 'east.top', 'belltower.bottom', 'passage.mid', 'gallery.bottom', 'north.bottom', 'east.bottom'], WELL = ['square.well', 'square.drain', 'square.well#1', 'square.well#2'];
      const sitAnim = seats.length ? 'sit' : 'idle', hk = (H('pk' + i) * 12) | 0;
      // an outing from a to b at one of the places in the list if one is free then; otherwise that time is spent at home (sweeping in the morning, sitting after noon)
      const out = (list, a, b) => { const sp = visit(list, a, b, hk); return sp ? [a, sp, World.spots[sp].sit ? 'sit' : 'idle'] : (H('fb' + i + a.toFixed(1)) < 0.5 ? [a, here('home'), 'sweep'] : [a, rest, sitAnim]); };
      let day;
      if (i === 0 && shop) day = [[8, here('counter'), 'idle'], [12.3 + J('n', 0.3), meal, sitAnim], [13.1 + J('a', 0.2), here('counter'), 'idle'], [18, here('home'), 'sweep']];
      else if (i === 0 && has('work')) { const e = 16.4 + J('e', 0.5); day = [[wake + 0.7, here('work'), 'work'], [12.2 + J('n', 0.3), meal, sitAnim], [13.1 + J('a', 0.2), here('work'), 'work'], out(MARKET, e, e + 1.2), [e + 1.2, here('home'), 'sweep']]; }
      else { const t = (H('day' + i) * 4) | 0, w = 9.2 + J('w', 0.9), m = w + 1.0 + H('m' + i) * 0.8, n = 12.5 + J('n', 0.5), a = 14.4 + J('a', 1.1);
        if (t === 0) day = [[wake + 0.6, here('home'), 'sweep'], out(WELL, w, m), out(MARKET, m, n), [n, meal, sitAnim], [n + 1.1, rest, sitAnim], [15.2 + J('s', 0.5), here('home'), 'sweep'], [17.2 + J('h', 0.3), rest, sitAnim]];
        else if (t === 1) day = [out(WELL, wake + 0.5, 8.6), [8.6, here('home'), 'sweep'], [10.4 + J('r', 0.4), rest, sitAnim], [n, meal, sitAnim], out(MARKET, a, a + 1.6), [a + 1.6, here('home'), 'sweep'], [17.4 + J('h', 0.3), rest, sitAnim]];
        else if (t === 2) day = [[wake + 0.6, rest, sitAnim], out(MARKET, 8.8 + J('m', 0.4), 10.6), [10.6, here('home'), 'sweep'], [n, meal, sitAnim], out(WALKS, a, a + 1.8), [a + 1.8, here('home'), 'sweep'], [17.8 + J('h', 0.3), rest, sitAnim]];
        else day = [[wake + 0.6, here('home'), 'sweep'], [9.8 + J('s', 0.5), rest, sitAnim], out(MARKET, 11.1 + J('m', 0.3), n), [n, meal, sitAnim], out(WALKS, a, a + 1.5), [a + 1.5, here('home'), 'sweep'], [17.5 + J('h', 0.3), rest, sitAnim]]; }
      // [cull] Build 72 gave these houses yards with a trade in each (73m_plots.js) and nobody used them. Whoever keeps the house does its chores in the yard
      // (the first resident always; the second for the first hour if it is washing, a garden or hens), and a household whose yard yields something to
      // sell has one of its people at an empty market stall for the morning. Nothing new: the same people, in the places the plan built for them.
      const yard = World.spots[here('yard')] ? here('yard') : null, yt = yard && World.spots[yard].trade;
      if (yard) { if (i === 0) day = day.map(r => r[1] === here('home') && r[2] === 'sweep' ? [r[0], yard, 'work'] : r); else if (/washing|garden|hens/.test(yt) && day.length && day[0][1] === here('home')) day[0] = [day[0][0], yard, 'work'];
        if (!shop && /hives|garden|hens|pigs|dyer|cooper|woodyard|forge/.test(yt) && HH_STALLS.length) { const st = HH_STALLS.shift(), noon = 12.4 + J('n', 0.3); day = [[7.6 + J('k', 0.2), st, 'idle'], [noon, meal, sitAnim], [noon + 1.0, i === 0 && has('work') ? here('work') : yard, 'work'], [16.2 + J('h', 0.4), yard, 'work'], [17.6 + J('h', 0.3), rest, sitAnim]]; }       /* the morning at the stall with what the yard or the bench makes, the afternoon making it */ }
      const sched = [[wake, here('home'), 'sweep']].concat(day, [[19.5 + i * 0.3 + J('v', 0.2), meal, sitAnim], [up, id + '.' + bed, 'lie']]).sort((a, b) => a[0] - b[0]);
      NPC_DEFS.push({ id: (i ? 'r2_' : 'r_') + key, name: first + ' ' + sur, body, tint: { tunic: tn, robe: tn, skirt: HH_TINT[(H('q' + i) * 8) | 0], pants: [1.1, 1.0, 0.9] }, skin: HH_SKIN[(H('k' + i) * 6) | 0], hair: HH_HAIR[(H('h' + i) * 7) | 0], top: [0.4, 0.36, 0.3], legs: [0.3, 0.26, 0.22], female: fem, dress: fem, sched, house: id });
      claimed.add(id + '.' + bed);
    }
  }
  yardHands();
}
