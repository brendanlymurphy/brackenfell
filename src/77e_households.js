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
const CAST_VISIT = { giles: [8.8, 'shop.s0.fire1', 9.5], elinor: [9.8, 'shop.s2.fire1', 10.5], miles: [10.8, 'smithy.fire1', 11.5], petronel: [11.8, 'shop.n2.fire1', 12.5], goda: [19.3, 'inn.stand1', 20.05], stephen: [19.8, 'gate.post2', 20.5] };
const CAST_MORN = { lambert: 'in.94.step', wenn: 'wharf.view' };          // ... and where each of them takes the morning air (the audit: 16 people never left their building)
const CAST_EVE = { randal: 'wharf.view', wilmot: 'bridge.west' };          // an hour by the water before supper for two who were otherwise indoors from dawn to dark
// [coordinator, FIRSTTEN 17] until the dead man's tally has been read (S.flags.pell), people of the wharf come and stand by his bier for an hour or two, and Finn,
// who pulled him out, keeps by it through the day; Ivo comes down in the afternoon to keep them back. [from, until, place]
const CAST_BIER = { peter: [9.0, 10.8, 'bier.a'], hester: [10.6, 12.0, 'bier.b'], ellen: [13.4, 15.2, 'bier.a'], mercy: [15.0, 16.8, 'bier.c'], humphrey: [16.6, 17.8, 'bier.b'] }, STORY_BIER = { finn: [9.0, 15.4, 'bier.finn'], ivo: [14.2, 17.2, 'bier.guard'] };
function bierDay(d, w) {
  if (!World.spots[w[2]]) return; const sc = d.sched, at = h => { let r = sc[sc.length - 1]; for (const q of sc) if (q[0] <= h) r = q; return r; }, back = at(w[1]);
  const alt = sc.filter(r => r[0] < w[0] || r[0] >= w[1]).concat([[w[0], w[2], 'idle'], [w[1], back[1], back[2]]]).sort((a, b) => a[0] - b[0]), prev = d.schedIf;
  d.schedIf = () => (!S.flags.pell && !S.flags.ending ? alt : null) || (prev ? prev() : null);
}
const CAST_CHAPEL = ['idony', 'odo', 'gillian', 'felice', 'silas', 'emmet'];          // at the chapel at dawn, once the bell rings again (section 7)
const CAST_STAY = { wenn: 1, odo: 1, lambert: 1 };          // the very old who keep to their own door: Wenn at the boatyard with the keys, Odo nearly blind, Lambert on his step
const CAST_HOST = { diggory: 1, randal: 1, alaric: 1 };          // at their own bench when a scene comes to them (the tinker at ten, the boatwright at three)
const CAST_FIRST = { draper: 'sabina' };          // who has the counter where the table says so against the order of the rows (Anselm is in the back room)
const CAST_SWEEP = { mercy: 1, basilia: 1, ursel: 1, hester: 1 };
// work that is done out of doors, by trade: [morning place, afternoon place] (places of the town that exist; '' = at home)
const CAST_OUT = { anselm: ['', 'square.bench2'], jordan: ['high.a.step', ''], kester: ['high.c.step', 'high.a.step'], basilia: ['stall1', ''], warin: ['gate.post2', 'hunter.yard'], davy: ['hunter.yard', 'gate.post2'], jasper: ['in.11.yard', 'in.46.yard'], peter: ['dock.end', 'wharf.view'], tamsin: ['in.32.yard', 'in.89.yard', 'in.48.yard'], silas: ['', 'belltower.bottom'], gilbert: ['', 'passage.lane'], ysolt: ['', 'gallery.bottom'],
  idony: ['in.12.yard', 'in.47.yard'], giles: ['', 'in.88.yard'], felice: ['', 'in.18.yard'], gillian: ['', 'in.41.yard'], kat: ['', 'in.81.yard'], wilmot: ['', 'in.42.yard'] };
// [cast] the yards of Build 72 behind houses that are only shells (73m_plots.js) are worked by the person of the table whose trade is that yard's: the beekeeper has
// the hives, the woodcutter the woodyards, the dyer and her boy the dye yard, the old woman who keeps hens the hen run. A child's task after school:
const CAST_TASK = { ned: 'in.15.yard', tom: 'in.21.work', amice: 'in.75.yard', will: 'dock.end' };
function householdDefs() {
  yardSpots();
  // [cast] a house is called what the table calls it (docs/PEOPLE.md section 3): in.34 was still "Wren Cottage" (Wren does not live there) and in.15 "Grocer's House".
  // The name the plan was chosen by (site.name) stays; what is shown at the door and on the door's tag is the title.
  for (const id in CAST_PLACES) { const h = World.houses[id], nm = CAST_PLACES[id].name; if (!h || !h.site || !nm) continue; h.site.title = nm; const c = typeof Cells !== 'undefined' && Cells.by[id]; if (c) { c.name = nm; if (c.portalOut) c.portalOut.label = 'Enter ' + nm; if (c.enter) c.enter.name = nm; } }
  // a doorstep: the place just outside one's own door (Lambert Pell on his step, the people of Highfold in front of their houses)
  for (const id of ['in.94', 'high.a', 'high.c']) { const h = World.houses[id], d = h && (h.xdoor || h.door); if (!d || !d.out || !d.c) continue; const dx = d.out[0] - d.c[0], dz = d.out[2] - d.c[2], l = Math.hypot(dx, dz) || 1, x = d.out[0] + dx / l * 0.9 + dz / l * 1.1, z = d.out[2] + dz / l * 0.9 - dx / l * 1.1; World.spots[id + '.step'] = { p: [x, World.groundY(x, z), z], yaw: Math.atan2(dx, -dz), zone: 0 }; }
  const S_ = World.spots, has = sp => !!S_[sp], H = (id, k) => hHash(id + '|' + k), J = (id, k, a) => (H(id, k) - 0.5) * 2 * a;
  const beds = {}, nth = {};          // beds handed out per house; a person's place in the household (0 = the first named)
  const bedOf = (home, id) => { const all = ['bed', 'bed2', 'bed3', 'bed4'].map(b => home + '.' + b).filter(b => has(b) && S_[b].lie && !CAST_TAKEN.has(b)); const k = beds[home] = (beds[home] || 0); beds[home]++; return all[k] || null; };
  // beds the story people sleep in are theirs
  const CAST_TAKEN = new Set(); for (const d of NPC_DEFS) for (const r of d.sched) if (r[2] === 'lie' && typeof r[1] === 'string') CAST_TAKEN.add(r[1]);
  const seatsOf = b => ['sit', 'seat1', 'seat2', 'seat3'].map(n => b + '.' + n).filter(sp => has(sp) && S_[sp].sit);
  let hart = 0, maker = 0, airN = 0; const AIR = ['terrace.view', 'square.bench', 'gallery.top', 'bridge.west', 'square.bench2', 'north.top', 'east.top', 'passage.mid', 'alley.n'].filter(sp => has(sp) && !Object.values(CAST_EVE).includes(sp));          /* the shopkeepers' hour of air after closing, dealt in turn so no two are sent to one place */ const HART_SEATS = ['inn.s6', 'inn.s7', 'inn.s8', 'inn.s9', 'inn.s10', 'inn.s11', 'inn.s12', 'inn.barfront', 'inn.fire2', 'inn.stand2', 'inn.seat1', 'inn.seat2', 'inn.seat3'].filter(has);          /* [coordinator, Build 86] the refitted Hart has eight table seats, not twelve: the last regulars take the bench by the wall until the tables are back (asked of the interiors session) */
  const SCHOOL = ['in.40.seat1', 'in.40.seat2', 'in.40.seat3', 'in.40.sit', 'in.40.fire1'].filter(has), WELL = ['square.well', 'square.well', 'square.well', 'square.well'];          // one place asked for by several: each is given the next free standing place round it (npcClaim)
  const MARKET = ['stallfront0', 'stallfront1', 'stallfront2', 'dstall0', 'dstall1', 'dstall2', 'dstall3', 'dstall4', 'alley.stall0', 'alley.stall1', 'alley.n', 'alley.s'].filter(has);
  const PLAY = ['square.bench2', 'alley.s', 'gallery.top', 'terrace.view', 'north.top', 'east.top', 'alley.n', 'passage.mid'].filter(has);
  // every yard of a house of the table is somebody's for an hour of the day: one of the people of that house or shop, before it opens (after it shuts for those at the well at dawn)
  const yardBy = {}; for (const sp in S_) { const b = S_[sp].yardOf; if (!b || !sp.endsWith('.yard') || Object.values(CAST_TASK).includes(sp)) continue; const c = CAST.filter(q => (q.home === b || q.work === b) && q.age >= 15 && q.id !== 'godwin' && !CAST_OUT[q.id]); const free = c.filter(q => !yardBy[q.id]); if (free.length) yardBy[(free.find(q => q.work === b && q.home !== b) || free[free.length - 1]).id] = sp; }
  /* [coordinator, Build 83] a yard whose own house has nobody of the table (the Warden's Lodge: Hale and Ivo are story people) goes to the nearest grown neighbour who has no yard, so no yard stands unworked all day */
  { const taken = new Set(Object.values(yardBy)), at = id => { const h = World.houses[id]; return h && h.site ? [h.site.x, h.site.z] : null; };
    for (const sp in S_) { const b = S_[sp].yardOf; if (!b || !sp.endsWith('.yard') || Object.values(CAST_TASK).includes(sp) || taken.has(sp)) continue; const yp = S_[sp].p; let best = null, bd = 1e9;
      for (const q of CAST) { if (q.age < 15 || q.id === 'godwin' || CAST_OUT[q.id] || yardBy[q.id]) continue; const hp = at(q.home); if (!hp) continue; const d = Math.hypot(hp[0] - yp[0], hp[1] - yp[2]); if (d < bd) { bd = d; best = q; } }
      if (best && bd < 60) { yardBy[best.id] = sp; taken.add(sp); } } }
  // [coordinator, FIRSTTEN 17] the drowned man lay alone on the wharf: nobody by the bier. Places round it, facing it, a body's length back from the boards
  if (typeof BODY !== 'undefined') { const B = BODY, ring = [['bier.finn', 1.9, 0.2], ['bier.a', 2.3, 2.1], ['bier.b', 2.4, -2.2], ['bier.c', 2.2, 3.4], ['bier.guard', 2.7, -1.1]];
    for (const [nm, r, a] of ring) { const x = B[0] + Math.sin(a) * r, z = B[2] - Math.cos(a) * r, y = World.groundAt(x, z, 4); if (y < -50) continue; S_[nm] = { p: [x, y, z], yaw: Math.atan2(B[0] - x, -(B[2] - z)), zone: 0 }; } }
  for (const id in STORY_BIER) { const d = NPC_DEFS.find(q => q.id === id); if (d) bierDay(d, STORY_BIER[id]); }
  for (const p of CAST) {
    const home = p.home, work = p.work || home; if (!World.houses[home] || !World.houses[home].plan) { console.warn('cast: ' + p.name + ' has no house ' + home); continue; }
    const k = nth[home] = (nth[home] === undefined ? 0 : nth[home] + 1), bed = bedOf(home, p.id); if (!bed) console.warn('cast: no bed for ' + p.name + ' in ' + home);
    const fem = /W|G/.test(p.voice), child = p.age < 15, old = p.age >= 70, id = p.id;
    const at = (b, n) => has(b + '.' + n) ? b + '.' + n : b + '.home', seats = seatsOf(home), seat = k < seats.length ? seats[k] : null /* [coordinator, Build 84] was seats[k % seats.length]: the Cooper's House has two seats and three Byrds, and Laurence and Joyce sat in one another at every meal; the one over eats standing by the hearth */, meal = seat || at(home, k === 0 ? 'sit' : 'fire1'), sitA = seat ? 'sit' : 'idle';          /* a shop or a workshop has no seat of its own yet (its plan gives none): the meal is taken standing by the table or the hearth */
    // the place of one's work: the counter for whoever keeps one, the bench ('work') for the maker, the yard for the second pair of hands, else the floor of the house
    const keeps = /counter|stall|shop|grocer|draper$|chandler|apothecary|cutler|butcher|block|bookstall/i.test(p.trade) && has(work + '.counter');
    const yard = has(home + '.yard') ? home + '.yard' : null, bench = has(work + '.work') ? work + '.work' : null;
    const first = (CAST_FIRST[work] ? CAST_FIRST[work] === id : CAST.find(q => (q.work || q.home) === work) === p);          // the first named at a workplace has its counter or bench; the next works beside (the yard, the floor)
    const spot = keeps && first ? work + '.counter' : first && bench ? bench : keeps ? at(work, 'sit') : (work === home && yard && !first ? yard : (bench && !first ? at(work, 'home') : bench || (first && has(work + '.counter') ? work + '.counter' : at(work, 'home'))));
    const wAnim = spot.endsWith('.counter') ? 'idle' : keeps && !first ? 'work' : CAST_SWEEP[id] ? 'sweep' : 'work';
    const wake = (old ? 6.9 : 6.1) + H(id, 'w') * 0.6, up = (child ? 20.3 : old ? 20.9 : 21.6) + H(id, 'u') * 0.8, sitting = CAST_HOST[id] || CAST_VISIT[id] ? 1 : (hHash(home + '|sitting') * 3) | 0, noon = (child ? Math.max(12.15, [11.55, 12.25, 12.95][sitting]) : [11.55, 12.25, 12.95][sitting]) + J(id, 'n', 0.08), aft = noon + 0.9, out = CAST_OUT[id] && (o => { const ok = o.filter(sp => sp && World.spots[sp]); return o.map(sp => !sp || World.spots[sp] ? sp : (ok[0] || '')); })(CAST_OUT[id]);       /* [coordinator] a yard that has gone with its house (the town worker removes empty shells: in.46 went) falls back to the person's other place, not to a spot that does not exist */
    let day;
    if (id === 'godwin') day = [[2.5, at(home, 'work'), 'work'], [9.2, meal, sitA], [10, bed, 'lie'], [14, at(home, 'counter'), 'idle'], [16.0, 'square.well', 'idle'], [16.9, at(home, 'counter'), 'idle'], [17.5, yard || meal, yard ? 'work' : sitA]];          // the baker bakes at night and sleeps from ten to two
    else if (child) { const sc = CAST_SCHOOL.indexOf(id), pl = PLAY[(H(id, 'p') * PLAY.length) | 0], pl2 = PLAY[((H(id, 'p') * PLAY.length | 0) + 3) % PLAY.length];
      day = [[wake + 0.5, meal, sitA]].concat(CAST_WELL.includes(id) ? [[7.0, WELL[k % WELL.length], 'idle']] : [], sc >= 0 && SCHOOL.length ? [[8.9, SCHOOL[sc % SCHOOL.length], S_[SCHOOL[sc % SCHOOL.length]].sit ? 'sit' : 'idle']] : [], [[noon, meal, sitA], [aft, id === 'lettice' ? at('shop.s1', 'counter') : (has(CAST_TASK[id]) ? CAST_TASK[id] : yard || at(work === home ? home : work, 'work')), id === 'lettice' ? 'idle' : 'work'], [15.6 + J(id, 'a', 0.3), [pl, pl2, pl], 'idle'], [18.3, meal, sitA]]); }
    else if (old && !out && !keeps && !(first && bench)) day = [[wake + 0.8, meal, sitA], (has(CAST_MORN[id]) ? [9.4 + J(id, 'm', 0.3), CAST_MORN[id], 'idle'] : [9.5 + J(id, 'm', 0.4), spot === at(home, 'home') ? meal : spot, spot === at(home, 'home') ? sitA : 'work']), [noon - (has(CAST_MORN[id]) ? 0.5 : 0), meal, sitA], (CAST_STAY[id] ? [aft + 0.2, bench && !first ? at(work, 'fire1') : meal, bench && !first ? 'idle' : sitA] : [aft + 0.2, (H(id, 'o') < 0.5 ? 'square.bench' : 'square.bench2'), 'sit']), [16 + J(id, 'e', 0.4), meal, sitA]];
    else { const a0 = wake + 0.7, well = CAST_WELL.includes(id) ? [[6.6 + (CAST_WELL.indexOf(id) % 4) * 0.33, WELL[CAST_WELL.indexOf(id) % WELL.length], 'idle']] : [];
      const am = out && out[0] ? [a0 + (well.length ? 1.6 : 0), out[0], /stall|step/.test(out[0]) ? 'idle' : 'work'] : [well.length ? 8.3 : a0, spot, wAnim], pm = out && out[1] ? [aft + J(id, 'a', 0.1), out[1], /bench|view|lane|step/.test(out[1]) ? 'idle' : 'work'] : [aft + J(id, 'a', 0.1), spot, wAnim];
      const town = !home.startsWith('high.'), shape = !keeps && (k === 0 || first) && !out && !CAST_HOST[id] ? (maker++ % 4) : -1, mk = q => MARKET[(H(id, q) * MARKET.length) | 0];          /* Highfold is an hour's walk from the market: its people keep to their own yard. Three shapes of a craftsman's day, dealt in turn, so no four have the same one */
      const errT = sitting === 0 && shape !== 1 ? aft + 0.2 : 9.8 + J(id, 'm', 0.15);          /* [audit, Build 81] the noon meal is taken in three sittings by household (half past eleven, a quarter past twelve, one o'clock) so the streets do not empty at one stroke; those of the first sitting do their marketing after it */
      const shop = town && (((!keeps || !first) && !out && k > 0) || shape === 1) ? [[errT, mk('mk'), 'idle']] : [], late = !town ? (k === 0 ? [[15.2, meal, sitA], [16.6, spot, wAnim]] : [[16.3, has(home + '.step') ? home + '.step' : at(home, 'fire1'), 'idle'], [17.4, meal, sitA]]) : shape === 0 ? [[16.8 + J(id, 'e', 0.15), mk('ev'), 'idle']] : shape === 2 ? [[15.6, (maker % 2 ? 'square.bench' : 'square.bench2'), 'sit'], [16.9, spot, wAnim]] : shape === 3 ? [[aft + 0.8, ['terrace.view', 'wharf.view', 'bridge.west', 'gallery.top'].filter(has)[maker % 4] || mk('wk'), 'idle'], [aft + 2.0, spot, wAnim]] : [];          /* the fourth shape: an hour's air after dinner, at one of the town's views */
      if (out && out[2] && has(out[2])) late.push([16.6, out[2], 'work']);
      day = well.concat([am], shop, shop.length ? [[errT + 1.4 + J(id, 'b', 0.1), spot, wAnim]] : [], [[noon, meal, sitA], pm], late, keeps && first && town ? [[18.05 + (airN % 3) * 0.1, AIR[airN++ % AIR.length] || mk('air'), 'idle']] : has(CAST_EVE[id]) ? [[18.05, CAST_EVE[id], 'idle']] : [[18.1 + J(id, 'h', 0.2), meal, sitA]]); }          /* whoever keeps a counter all day takes the air when the shop is shut */
    if (yardBy[id] && !day.some(r => r[1] === yardBy[id])) day.push(CAST_WELL.includes(id) ? [16.9, yardBy[id], 'work'] : [6.9, yardBy[id], 'work'], CAST_WELL.includes(id) ? [18.1, meal, sitA] : [8.05, spot, wAnim]);
    let eve = CAST_HART.includes(id) && HART_SEATS[hart] ? [[19.1 + (hart % 5) * 0.12, HART_SEATS[hart], S_[HART_SEATS[hart++]].sit ? 'sit' : 'idle']] : [[19.2 + J(id, 'v', 0.2), meal, sitA]];
    const vis = CAST_VISIT[id]; let rows = day.concat(id === 'godwin' ? [] : eve).sort((a, b) => a[0] - b[0]);
    if (vis && has(vis[1])) { const before = rows.filter(r => r[0] <= vis[0]).pop() || [0, meal, sitA]; rows = rows.filter(r => r[0] <= vis[0] || r[0] >= vis[2]).concat([[vis[0], vis[1], 'idle'], [vis[2], before[1], before[2]]]); const ev = rows.filter(r => eve.includes(r) || (r[0] >= 19 && r[0] < 22)); day = rows.filter(r => !ev.includes(r)); eve.length = 0; for (const r of ev.length ? ev : [[19.2, meal, sitA]]) eve.push(r); }
    const sched = (id === 'godwin' ? [] : [[wake, meal, sitA]]).concat(day, id === 'godwin' ? [[19, meal, sitA], [20, bed || meal, bed ? 'lie' : sitA]] : eve.concat([[eve.slice().sort((a, b) => a[0] - b[0]).pop()[1].startsWith('inn.') ? 22 + H(id, 'l') * 0.4 : up, bed || meal, bed ? 'lie' : sitA]])).filter(r => r && r[1]).sort((a, b) => a[0] - b[0]);
    const tn = HH_TINT[(H(id, 't') * 8) | 0], bodies = CAST_BODY[p.voice] || CAST_BODY.M, body = bodies[(H(id, 'b') * bodies.length) | 0];
    NPC_DEFS.push({ id, name: p.name, body, cast: p, tint: { tunic: tn, robe: tn, skirt: HH_TINT[(H(id, 'q') * 8) | 0], pants: [1.1, 1.0, 0.9] }, skin: HH_SKIN[(H(id, 'k') * 6) | 0], hair: p.age >= 55 ? (p.age >= 68 ? 'white' : 'grey') : HH_HAIR[(H(id, 'h') * 7) | 0],
      top: [0.4, 0.36, 0.3], legs: [0.3, 0.26, 0.22], female: fem, dress: fem, scale: child ? Math.min(0.8, 0.53 + p.age * 0.018) : p.voice === 'YM' && p.age < 17 ? 0.9 : undefined, run: child || undefined, sched, house: home, bed });
    if (CAST_BIER[id]) bierDay(NPC_DEFS[NPC_DEFS.length - 1], CAST_BIER[id]);
    // [coordinator, Build 83] a day may depend on the story: once the bell rings again these six are at the chapel at dawn (npcRow asks schedIf before the plain day)
    if (CAST_CHAPEL.includes(id) && has('chapel.nave')) { const dawn = [[5.5 + CAST_CHAPEL.indexOf(id) * 0.04, 'chapel.nave', 'pray']].concat(sched.filter(r => r[0] >= 6.7 || r[0] < 5.4)).sort((a, b) => a[0] - b[0]), d = NPC_DEFS[NPC_DEFS.length - 1]; if (!dawn.some(r => r[0] > 6.6 && r[0] < 7.3)) dawn.push([6.75, meal, sitA]), dawn.sort((a, b) => a[0] - b[0]); d.schedIf = () => (typeof qAt === 'function' && qAt('bell') === 99 ? dawn : null); }
  }
}
