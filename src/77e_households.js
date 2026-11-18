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
// ── The cast (docs/PEOPLE.md, as data in 54_cast.js) ──
// [cast] Until Build 77 the ordinary houses were filled by a generator: a first name and a surname drawn by hash, one of four days, no lines ("..."). The owner
// called it fake life. Now every person in a house is one of the sixty in the accepted table: a name, an age, a household, a bed of their own, a trade and a
// place to do it, and what they say (82d_cast.js). Nothing here is drawn by chance except the cut of a tunic. The seven Hart regulars and the yard hands are
// gone with the generator: their seats and yards belong to people of the table.
const CAST_BODY = { OM: ['m_elder'], M: ['m_farmer', 'm_fisher', 'm_hunter'], YM: ['m_youth'], B: ['m_boy'], OW: ['f_elder'], W: ['f_farmer', 'f_weaver', 'f_herbalist'], YW: ['f_maid'], G: ['f_child'] };
// who is where at the hours the table fixes (section 7): the well at dawn, school, the Hart in the evening
const CAST_WELL = ['avice', 'hester', 'kat', 'winifred', 'ysolt', 'gillian', 'ellen', 'felice', 'amice', 'ned'], CAST_SCHOOL = ['ned', 'amice', 'will', 'tom', 'lettice'];
const CAST_HART = ['stephen', 'silas', 'miles', 'jasper', 'diggory', 'jocelyn', 'peter', 'humphrey', 'laurence', 'bridget'];
// the few who sweep (the audit counted 57 of 80 with a broom in their day): the widow's step, the Reeve's house after the wedding, a shop floor at closing
// calls paid at a fixed hour, where the table's passing scenes (section 6; 82e_scenes.js) need two people in one place: [from, place, until]
const CAST_VISIT = { giles: [8.8, 'shop.s0.fire1', 9.5], elinor: [9.8, 'shop.s2.fire1', 10.5], miles: [10.8, 'smithy.fire1', 11.5], petronel: [11.8, 'shop.n2.fire1', 12.5], goda: [19.3, 'inn.fire1', 20.05], stephen: [19.8, 'gate.post2', 20.5] };
const CAST_STAY = { wenn: 1, odo: 1, lambert: 1 };          // the very old who keep to their own door: Wenn at the boatyard with the keys, Odo nearly blind, Lambert on his step
const CAST_HOST = { diggory: 1, randal: 1 };          // at their own bench when a scene comes to them (the tinker at ten, the boatwright at three)
const CAST_FIRST = { draper: 'sabina' };          // who has the counter where the table says so against the order of the rows (Anselm is in the back room)
const CAST_SWEEP = { mercy: 1, basilia: 1, ursel: 1, hester: 1 };
// work that is done out of doors, by trade: [morning place, afternoon place] (places of the town that exist; '' = at home)
const CAST_OUT = { warin: ['gate.post2', 'hunter.yard'], davy: ['hunter.yard', 'gate.post2'], jasper: ['in.11.yard', 'in.46.yard'], peter: ['dock.end', 'wharf.view'], tamsin: ['in.32.yard', 'in.89.yard', 'in.48.yard'], silas: ['', 'belltower.bottom'], gilbert: ['', 'passage.lane'], ysolt: ['', 'gallery.bottom'],
  idony: ['in.12.yard', 'in.47.yard'], giles: ['', 'in.88.yard'], felice: ['', 'in.18.yard'], gillian: ['', 'in.41.yard'], kat: ['', 'in.81.yard'], wilmot: ['', 'in.42.yard'] };
// [cast] the yards of Build 72 behind houses that are only shells (73m_plots.js) are worked by the person of the table whose trade is that yard's: the beekeeper has
// the hives, the woodcutter the woodyards, the dyer and her boy the dye yard, the old woman who keeps hens the hen run. A child's task after school:
const CAST_TASK = { ned: 'in.06.yard', tom: 'in.42.yard', amice: 'in.75.yard', will: 'dock.end' };
function householdDefs() {
  yardSpots();
  const S_ = World.spots, has = sp => !!S_[sp], H = (id, k) => hHash(id + '|' + k), J = (id, k, a) => (H(id, k) - 0.5) * 2 * a;
  const beds = {}, nth = {};          // beds handed out per house; a person's place in the household (0 = the first named)
  const bedOf = (home, id) => { const all = ['bed', 'bed2', 'bed3', 'bed4'].map(b => home + '.' + b).filter(b => has(b) && S_[b].lie && !CAST_TAKEN.has(b)); const k = beds[home] = (beds[home] || 0); beds[home]++; return all[k] || null; };
  // beds the story people sleep in are theirs
  const CAST_TAKEN = new Set(); for (const d of NPC_DEFS) for (const r of d.sched) if (r[2] === 'lie' && typeof r[1] === 'string') CAST_TAKEN.add(r[1]);
  const seatsOf = b => ['sit', 'seat1', 'seat2', 'seat3'].map(n => b + '.' + n).filter(sp => has(sp) && S_[sp].sit);
  let hart = 0, maker = 0; const HART_SEATS = ['inn.s6', 'inn.s7', 'inn.s8', 'inn.s9', 'inn.s10', 'inn.s11', 'inn.s12', 'inn.barfront', 'inn.fire2', 'inn.stand2'].filter(has);
  const SCHOOL = ['in.40.seat1', 'in.40.seat2', 'in.40.seat3', 'in.40.sit', 'in.40.fire1'].filter(has), WELL = ['square.well', 'square.well', 'square.well', 'square.well'];          // one place asked for by several: each is given the next free standing place round it (npcClaim)
  const MARKET = ['stallfront0', 'stallfront1', 'stallfront2', 'dstall0', 'dstall1', 'dstall2', 'dstall3', 'dstall4', 'alley.stall0', 'alley.stall1', 'alley.n', 'alley.s'].filter(has);
  const PLAY = ['square.bench2', 'alley.s', 'gallery.top', 'terrace.view', 'north.top', 'east.top', 'alley.n', 'passage.mid'].filter(has);
  // every yard of a house of the table is somebody's for an hour of the day: one of the people of that house or shop, before it opens (after it shuts for those at the well at dawn)
  const yardBy = {}; for (const sp in S_) { const b = S_[sp].yardOf; if (!b || !sp.endsWith('.yard') || Object.values(CAST_TASK).includes(sp)) continue; const c = CAST.filter(q => (q.home === b || q.work === b) && q.age >= 15 && q.id !== 'godwin' && !CAST_OUT[q.id]); const free = c.filter(q => !yardBy[q.id]); if (free.length) yardBy[(free.find(q => q.work === b && q.home !== b) || free[free.length - 1]).id] = sp; }
  for (const p of CAST) {
    const home = p.home, work = p.work || home; if (!World.houses[home] || !World.houses[home].plan) { console.warn('cast: ' + p.name + ' has no house ' + home); continue; }
    const k = nth[home] = (nth[home] === undefined ? 0 : nth[home] + 1), bed = bedOf(home, p.id); if (!bed) console.warn('cast: no bed for ' + p.name + ' in ' + home);
    const fem = /W|G/.test(p.voice), child = p.age < 15, old = p.age >= 70, id = p.id;
    const at = (b, n) => has(b + '.' + n) ? b + '.' + n : b + '.home', seats = seatsOf(home), seat = seats.length ? seats[k % seats.length] : null, meal = seat || at(home, k === 0 ? 'sit' : 'fire1'), sitA = seat ? 'sit' : 'idle';          /* a shop or a workshop has no seat of its own yet (its plan gives none): the meal is taken standing by the table or the hearth */
    // the place of one's work: the counter for whoever keeps one, the bench ('work') for the maker, the yard for the second pair of hands, else the floor of the house
    const keeps = /counter|stall|shop|grocer|draper$|chandler|apothecary|cutler|butcher|block|bookstall/i.test(p.trade) && has(work + '.counter');
    const yard = has(home + '.yard') ? home + '.yard' : null, bench = has(work + '.work') ? work + '.work' : null;
    const first = (CAST_FIRST[work] ? CAST_FIRST[work] === id : CAST.find(q => (q.work || q.home) === work) === p);          // the first named at a workplace has its counter or bench; the next works beside (the yard, the floor)
    const spot = keeps && first ? work + '.counter' : first && bench ? bench : keeps ? at(work, 'sit') : (work === home && yard && !first ? yard : (bench && !first ? at(work, 'home') : bench || (first && has(work + '.counter') ? work + '.counter' : at(work, 'home'))));
    const wAnim = spot.endsWith('.counter') ? 'idle' : keeps && !first ? 'work' : CAST_SWEEP[id] ? 'sweep' : 'work';
    const wake = (old ? 6.9 : 6.1) + H(id, 'w') * 0.6, up = (child ? 20.3 : old ? 20.9 : 21.6) + H(id, 'u') * 0.8, noon = 12.1 + J(id, 'n', 0.25), out = CAST_OUT[id];
    let day;
    if (id === 'godwin') day = [[2.5, at(home, 'work'), 'work'], [9.2, meal, sitA], [10, bed, 'lie'], [14, at(home, 'counter'), 'idle'], [17.5, yard || meal, yard ? 'work' : sitA]];          // the baker bakes at night and sleeps from ten to two
    else if (child) { const sc = CAST_SCHOOL.indexOf(id), pl = PLAY[(H(id, 'p') * PLAY.length) | 0], pl2 = PLAY[((H(id, 'p') * PLAY.length | 0) + 3) % PLAY.length];
      day = [[wake + 0.5, meal, sitA]].concat(CAST_WELL.includes(id) ? [[7.0, WELL[k % WELL.length], 'idle']] : [], sc >= 0 && SCHOOL.length ? [[8.9, SCHOOL[sc % SCHOOL.length], S_[SCHOOL[sc % SCHOOL.length]].sit ? 'sit' : 'idle']] : [], [[noon, meal, sitA], [13.2, id === 'lettice' ? at('shop.s1', 'counter') : (has(CAST_TASK[id]) ? CAST_TASK[id] : yard || at(work === home ? home : work, 'work')), id === 'lettice' ? 'idle' : 'work'], [15.6 + J(id, 'a', 0.3), [pl, pl2, pl], 'idle'], [18.3, meal, sitA]]); }
    else if (old && !out && !keeps && !(first && bench)) day = [[wake + 0.8, meal, sitA], [9.5 + J(id, 'm', 0.4), spot === at(home, 'home') ? meal : spot, spot === at(home, 'home') ? sitA : 'work'], [noon, meal, sitA], (CAST_STAY[id] ? [13.4, bench && !first ? at(work, 'fire1') : meal, bench && !first ? 'idle' : sitA] : [13.4, (H(id, 'o') < 0.5 ? 'square.bench' : 'square.bench2'), 'sit']), [16 + J(id, 'e', 0.4), meal, sitA]];
    else { const a0 = wake + 0.7, well = CAST_WELL.includes(id) ? [[6.6 + (CAST_WELL.indexOf(id) % 4) * 0.33, WELL[CAST_WELL.indexOf(id) % WELL.length], 'idle']] : [];
      const am = out && out[0] ? [a0 + (well.length ? 1.6 : 0), out[0], 'work'] : [well.length ? 8.3 : a0, spot, wAnim], pm = out && out[1] ? [13.2 + J(id, 'a', 0.2), out[1], /bench|view|lane/.test(out[1]) ? 'idle' : 'work'] : [13.1 + J(id, 'a', 0.2), spot, wAnim];
      const town = !home.startsWith('high.'), shape = !keeps && (k === 0 || first) && !out && !CAST_HOST[id] ? (maker++ % 4) : -1, mk = q => MARKET[(H(id, q) * MARKET.length) | 0];          /* Highfold is an hour's walk from the market: its people keep to their own yard. Three shapes of a craftsman's day, dealt in turn, so no four have the same one */
      const shop = town && ((!keeps && !out && k > 0) || shape === 1) ? [[9.8 + J(id, 'm', 0.15), mk('mk'), 'idle']] : [], late = !town ? (k === 0 ? [[15.2, meal, sitA], [16.6, spot, wAnim]] : [[16.3, at(home, 'fire1'), 'idle']]) : shape === 0 ? [[16.8 + J(id, 'e', 0.15), mk('ev'), 'idle']] : shape === 2 ? [[15.6, (maker % 2 ? 'square.bench' : 'square.bench2'), 'sit'], [16.9, spot, wAnim]] : shape === 3 ? [[13.9, ['terrace.view', 'wharf.view', 'bridge.west', 'gallery.top'].filter(has)[maker % 4] || mk('wk'), 'idle'], [15.1, spot, wAnim]] : [];          /* the fourth shape: an hour's air after dinner, at one of the town's views */
      if (out && out[2] && has(out[2])) late.push([16.6, out[2], 'work']);
      day = well.concat([am], shop, shop.length ? [[11.3 + J(id, 'b', 0.2), spot, wAnim]] : [], [[noon, meal, sitA], pm], late, [[18.1 + J(id, 'h', 0.2), meal, sitA]]); }
    if (yardBy[id] && !day.some(r => r[1] === yardBy[id])) day.push(CAST_WELL.includes(id) ? [16.9, yardBy[id], 'work'] : [6.9, yardBy[id], 'work'], CAST_WELL.includes(id) ? [18.1, meal, sitA] : [8.05, spot, wAnim]);
    let eve = CAST_HART.includes(id) && HART_SEATS[hart] ? [[19.1 + (hart % 5) * 0.12, HART_SEATS[hart], S_[HART_SEATS[hart++]].sit ? 'sit' : 'idle']] : [[19.2 + J(id, 'v', 0.2), meal, sitA]];
    const vis = CAST_VISIT[id]; let rows = day.concat(id === 'godwin' ? [] : eve).sort((a, b) => a[0] - b[0]);
    if (vis && has(vis[1])) { const before = rows.filter(r => r[0] <= vis[0]).pop() || [0, meal, sitA]; rows = rows.filter(r => r[0] <= vis[0] || r[0] >= vis[2]).concat([[vis[0], vis[1], 'idle'], [vis[2], before[1], before[2]]]); const ev = rows.filter(r => eve.includes(r) || (r[0] >= 19 && r[0] < 22)); day = rows.filter(r => !ev.includes(r)); eve.length = 0; for (const r of ev.length ? ev : [[19.2, meal, sitA]]) eve.push(r); }
    const sched = (id === 'godwin' ? [] : [[wake, meal, sitA]]).concat(day, id === 'godwin' ? [[19, meal, sitA], [20, bed || meal, bed ? 'lie' : sitA]] : eve.concat([[eve.slice().sort((a, b) => a[0] - b[0]).pop()[1].startsWith('inn.') ? 22 + H(id, 'l') * 0.4 : up, bed || meal, bed ? 'lie' : sitA]])).filter(r => r && r[1]).sort((a, b) => a[0] - b[0]);
    const tn = HH_TINT[(H(id, 't') * 8) | 0], bodies = CAST_BODY[p.voice] || CAST_BODY.M, body = bodies[(H(id, 'b') * bodies.length) | 0];
    NPC_DEFS.push({ id, name: p.name, body, cast: p, tint: { tunic: tn, robe: tn, skirt: HH_TINT[(H(id, 'q') * 8) | 0], pants: [1.1, 1.0, 0.9] }, skin: HH_SKIN[(H(id, 'k') * 6) | 0], hair: p.age >= 55 ? (p.age >= 68 ? 'white' : 'grey') : HH_HAIR[(H(id, 'h') * 7) | 0],
      top: [0.4, 0.36, 0.3], legs: [0.3, 0.26, 0.22], female: fem, dress: fem, scale: child ? Math.min(0.8, 0.53 + p.age * 0.018) : p.voice === 'YM' && p.age < 17 ? 0.9 : undefined, run: child || undefined, sched, house: home, bed });
  }
}
