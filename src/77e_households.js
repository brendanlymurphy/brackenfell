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
const CAST_WELL = ['avice', 'hester', 'kat', 'winifred', 'ysolt', 'gillian', 'ellen', 'felice', 'amice', 'ned'], WELL_T = { ysolt: 6.45, gillian: 6.6, felice: 6.75, avice: 6.95, hester: 6.95, ned: 7.15, ellen: 7.25, amice: 7.3, kat: 7.55, winifred: 7.55 }, wellT = id => WELL_T[id] || 6.5,          /* [cast] a turn at the well each, twenty minutes long, at set times so the pairs of scenes 1 and 2 meet there and never more than four at once, as the table's 'four spots and a queue' (seven in a ring at once blocked the square) */
  CAST_SCHOOL = ['ned', 'amice', 'will', 'tom', 'lettice'];
const CAST_HART = ['jocelyn', 'bridget', 'stephen', 'silas', 'miles', 'jasper', 'diggory', 'peter', 'humphrey', 'laurence'];          /* the two of scene 10 first: when the Hart has fewer seats the last go without (Build 86) */
// the few who sweep (the audit counted 57 of 80 with a broom in their day): the widow's step, the Reeve's house after the wedding, a shop floor at closing
// calls paid at a fixed hour, where the table's passing scenes (section 6; 82e_scenes.js) need two people in one place: [from, place, until]
const CAST_VISIT = { giles: [8.8, 'shop.s0.fire1', 9.5], elinor: [9.8, 'shop.s2.fire1', 10.5], miles: [10.8, 'smithy.fire1', 11.5], petronel: [11.8, 'shop.n2.fire1', 12.5], goda: [19.3, 'inn.stand1', 20.05], stephen: [[12.1, 'inn.s8', 12.9, 'sit'], [19.3, 'guardhouse.fire1', 20.0]],
  // [cast] the inspector's tour (Build 84): the Hart at noon held only Greta, the chapel only Aldous. Those who live alone take their dinner at the Hart;
  // two of the devout go into the chapel by day. [from, place, until, anim]; a list for more than one call
  jasper: [12.1, 'inn.s6', 12.9, 'sit'], silas: [12.15, 'inn.s7', 12.95, 'sit'], alaric: [12.2, 'inn.s9', 13.0, 'sit'], adda: [12.1, 'inn.s10', 12.9, 'sit'],
  felice: [10.2, 'chapel.nave', 11.0, 'pray'], idony: [15.0, 'chapel.nave', 15.8, 'pray'] };
const CAST_MORN = { lambert: 'in.94.step', wenn: 'wharf.view' };          // ... and where each of them takes the morning air (the audit: 16 people never left their building)
const CAST_EVE = { randal: 'wharf.view', wilmot: 'bridge.west' };          // an hour by the water before supper for two who were otherwise indoors from dawn to dark
// [coordinator, FIRSTTEN 17] until the dead man's tally has been read (S.flags.pell), people of the wharf come and stand by his bier for an hour or two, and Finn,
// who pulled him out, keeps by it through the day; Ivo comes down in the afternoon to keep them back. [from, until, place]
const CAST_BIER = { peter: [9.0, 10.8, 'bier.a'], hester: [10.6, 12.0, 'bier.b'], ellen: [13.4, 15.2, 'bier.a'], mercy: [15.0, 16.8, 'bier.c'], humphrey: [16.6, 17.8, 'bier.b'] }, STORY_BIER = { finn: [9.0, 15.4, 'bier.finn'], ivo: [14.2, 17.2, 'bier.guard'] };
const CAST_BUTTS = { place: null, day: () => (((typeof RPG !== 'undefined' && RPG.st && RPG.st().day) || 0) % 7) === 6 };
function buttsDay(d, w) {
  const sp = CAST_BUTTS.place; if (!sp) return; const sc = d.sched, at = h => { let r = sc[sc.length - 1]; for (const q of sc) if (q[0] <= h) r = q; return r; }, back = at(w[1]);
  const alt = sc.filter(r => r[0] < w[0] || r[0] >= w[1]).concat([[w[0], sp, 'idle'], [w[1], back[1], back[2]]]).sort((a, b) => a[0] - b[0]), prev = d.schedIf;
  d.schedIf = () => (CAST_BUTTS.day() ? alt : null) || (prev ? prev() : null);
}
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
const CAST_OUT = { anselm: ['', 'square.bench2'], jordan: ['high.a.step', ''], kester: ['high.c.step', 'high.a.step'], basilia: ['stall1', ''], warin: ['in.103.yard', 'hunter.yard'], davy: ['hunter.yard', 'in.103.yard'],
  /* [cast] Build 86: the town worker removed the empty shells and redid the yards by docs/YARDS.md, so these are the yards that are left, or the person's own door */
  jasper: ['in.88.yard', 'in.90.step'], peter: ['dock.end', 'wharf.view'], tamsin: ['in.46.yard', 'in.32.yard'], silas: ['', 'belltower.bottom'], gilbert: ['', 'passage.lane'], ysolt: ['', 'in.97.yard'],
  idony: ['in.12.yard', ''], giles: ['', 'in.13.yard'], gillian: ['', 'in.41.yard'], kat: ['', 'in.81.yard'], wilmot: ['', 'in.18.yard'] };
// [cast] the yards of Build 72 behind houses that are only shells (73m_plots.js) are worked by the person of the table whose trade is that yard's: the beekeeper has
// the hives, the woodcutter the woodyards, the dyer and her boy the dye yard, the old woman who keeps hens the hen run. A child's task after school:
const CAST_TASK = { ned: 'in.15.yard', tom: 'in.21.work', amice: 'in.75.yard', will: 'dock.end' };
// [cast] a place to stand made on a building's own plan, when every place it names is taken (all a plan's missing places are made at its 'home'): the free point
// of that floor nearest 'home', inside a room, clear of the plan's furniture, hearths, stairs and stairwells, at least 0.8 m from the places already given. Made with pSpot like the
// plan's own, so the villagers' graph joins it. The plan's file is the interiors session's; this only reads it.
function castStand(b, w, taken) {
  const h = World.houses[b], P = h && h.plan; if (!P || !P.spots || typeof pSpot !== 'function') return null; const hs = P.spots.home || Object.values(P.spots).find(q => !q.lie && !q.sit); if (!hs) return null;
  const k = hs.k || 0, solid = P.items.filter(i => i.k === k && i.kind !== 'rug'), holes = (P.holes || []).filter(q => q.k === k).map(q => q.r), inside = (x, z, r, q) => x > r.x0 - q && x < r.x1 + q && z > r.z0 - q && z < r.z1 + q;
  const cand = []; for (const room of Object.values(P.rooms)) { if (room.k !== k) continue; const ri = room.in || room; const cx = (ri.x0 + ri.x1) / 2, cz = (ri.z0 + ri.z1) / 2; for (let x = ri.x0 + 0.8; x <= ri.x1 - 0.8; x += 0.3) for (let z = ri.z0 + 0.8; z <= ri.z1 - 0.8; z += 0.3) cand.push([x, z, Math.hypot(x - hs.x, z - hs.z), cx, cz]); }
  cand.sort((p, q) => p[2] - q[2]);          /* every free point of the floor, nearest the home place first */
  for (const [x, z, , cx, cz] of cand) { if (solid.some(t => inside(x, z, t, 0.35)) || holes.some(r => inside(x, z, r, 0.4))) continue; const wp = P.w2(x, P.lv[k].y + 0.02, z); if (taken.some(o => Math.hypot(o[0] - wp[0], o[2] - wp[2]) < 0.8 && Math.abs(o[1] - wp[1]) < 1.5)) continue;
    let nm = 'stand3'; for (let n = 3; P.spots[nm]; n++) nm = 'stand' + n; pSpot(P, nm, x, z, Math.abs(cx - x) + Math.abs(cz - z) < 0.2 ? Math.atan2(hs.x - x, -(hs.z - z)) : Math.atan2(cx - x, -(cz - z)), { k });          /* facing the middle of the room, never a wall a step away */ return World.spots[b + '.' + nm] ? b + '.' + nm : null; }
  return null;
}
function householdDefs() {
  yardSpots();
  // [cast] a house is called what the table calls it (docs/PEOPLE.md section 3): in.34 was still "Wren Cottage" (Wren does not live there) and in.15 "Grocer's House".
  // The name the plan was chosen by (site.name) stays; what is shown at the door and on the door's tag is the title.
  for (const id in CAST_PLACES) { const h = World.houses[id], nm = CAST_PLACES[id].name; if (!h || !h.site || !nm) continue; h.site.title = nm; const c = typeof Cells !== 'undefined' && Cells.by[id]; if (c) { c.name = nm; if (c.portalOut) c.portalOut.label = 'Enter ' + nm; if (c.enter) c.enter.name = nm; } }
  // a doorstep: the place just outside one's own door (Lambert Pell on his step, the people of Highfold in front of their houses)
  for (const id of ['in.94', 'high.a', 'high.c', 'in.90', 'in.82']) {          /* and Jasper's axe block, Tamsin's skeps by her door */ const h = World.houses[id], d = h && (h.xdoor || h.door); if (!d || !d.out || !d.c) continue; const dx = d.out[0] - d.c[0], dz = d.out[2] - d.c[2], l = Math.hypot(dx, dz) || 1, x = d.out[0] + dx / l * 0.9 + dz / l * 1.1, z = d.out[2] + dz / l * 0.9 - dx / l * 1.1; World.spots[id + '.step'] = { p: [x, World.groundY(x, z), z], yaw: Math.atan2(dx, -dz), zone: 0 }; }
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
  // [cast] scene 7: the butts behind the guardhouse (built by the town worker, Build 86). Every seventh day Hugh Alder and Warden Hale shoot there from four to five.
  CAST_BUTTS.place = has('guardhouse.yard') ? 'guardhouse.yard' : null;
  for (const id in STORY_BIER) { const d = NPC_DEFS.find(q => q.id === id); if (d) bierDay(d, STORY_BIER[id]); }
  { const d = NPC_DEFS.find(q => q.id === 'hale'); if (d) buttsDay(d, [15.9, 17.0]); }
  /* [cast] no two of a household are given one place to stand (fork-integ, Build 85: the cooper's plan had no bench and two seats, and all three Byrds worked
     and ate at 'in.02.home'; a plan's missing places are made at its 'home', so different names can be one spot). Each standing place a person is given is
     at least 0.8 m from every other already given in that building; if the wanted one is taken, the nearest free place the building has. */
  const given = {}, standAt = (b, want) => { const L = given[b] = given[b] || [], far = q => L.every(o => Math.hypot(o[0] - q.p[0], o[2] - q.p[2]) > 0.8 || Math.abs(o[1] - q.p[1]) > 1.5), w = S_[want];
    if (w && !w.sit && !w.lie && far(w)) { L.push(w.p); return want; } const pool = Object.keys(S_).filter(k => k.startsWith(b + '.') && !k.includes('#') && !S_[k].sit && !S_[k].lie && !S_[k].yardOf && !/\.(up|cellar|down)\d*$|guestbed|pew\d|door|step$|altar|nave|bard|front$/.test(k) && (!w || Math.abs(S_[k].p[1] - w.p[1]) < 1.5)).filter(k => far(S_[k]));          /* not the ends of a stair, a guest bed, a pew: places to stand at */
    if (!pool.length) { const made = castStand(b, w, L); if (made) { L.push(S_[made].p); return made; } return want; } const ref = w ? w.p : S_[pool[0]].p; const PREF = ['fire1', 'stand2', 'home', 'work', 'counter'], rank = k => { const i = PREF.indexOf(k.slice(b.length + 1)); return i < 0 ? PREF.length : i; }; pool.sort((a, c) => rank(a) - rank(c) || Math.hypot(S_[a].p[0] - ref[0], S_[a].p[2] - ref[2]) - Math.hypot(S_[c].p[0] - ref[0], S_[c].p[2] - ref[2])); L.push(S_[pool[0]].p); return pool[0]; };
  for (const p of CAST) {
    const home = p.home, work = p.work || home; if (!World.houses[home] || !World.houses[home].plan) { console.warn('cast: ' + p.name + ' has no house ' + home); continue; }
    const k = nth[home] = (nth[home] === undefined ? 0 : nth[home] + 1), bed = bedOf(home, p.id); if (!bed) console.warn('cast: no bed for ' + p.name + ' in ' + home);
    const fem = /W|G/.test(p.voice), child = p.age < 15, old = p.age >= 70, id = p.id;
    const at = (b, n) => has(b + '.' + n) ? b + '.' + n : b + '.home', seats = seatsOf(home), seat = seats[k] || null,          /* [cast] one seat each: when a house has fewer seats than people (Build 84's plans), the rest eat standing by the hearth, not two on one seat */ meal = seat || standAt(home, at(home, 'fire1')), sitA = seat ? 'sit' : 'idle';          /* a shop or a workshop has no seat of its own yet (its plan gives none): the meal is taken standing by the table or the hearth */
    // the place of one's work: the counter for whoever keeps one, the bench ('work') for the maker, the yard for the second pair of hands, else the floor of the house
    const keeps = /counter|stall|shop|grocer|draper$|chandler|apothecary|cutler|butcher|block|bookstall/i.test(p.trade) && has(work + '.counter');
    const yard = has(home + '.yard') ? home + '.yard' : null, bench = has(work + '.work') ? work + '.work' : null;
    const first = (CAST_FIRST[work] ? CAST_FIRST[work] === id : CAST.find(q => (q.work || q.home) === work) === p);          // the first named at a workplace has its counter or bench; the next works beside (the yard, the floor)
    const spot0 = keeps && first ? work + '.counter' : first && bench ? bench : keeps ? at(work, 'sit') : (work === home && yard && !first ? yard : (bench && !first ? at(work, 'home') : bench || (first && has(work + '.counter') ? work + '.counter' : at(work, 'home'))));
    const spot = standAt(work, spot0);
    const wAnim = spot.endsWith('.counter') ? 'idle' : keeps && !first ? 'work' : CAST_SWEEP[id] ? 'sweep' : 'work';
    const wake = (old ? 6.9 : 6.1) + H(id, 'w') * 0.6, up = (child ? 20.3 : old ? 20.9 : 21.6) + H(id, 'u') * 0.8, sitting = CAST_HOST[id] || CAST_VISIT[id] ? 1 : (hHash(home + '|sitting') * 3) | 0, noon = (child ? Math.max(12.15, [11.55, 12.25, 12.95][sitting]) : [11.55, 12.25, 12.95][sitting]) + J(id, 'n', 0.08), aft = noon + 0.9, out = CAST_OUT[id] && (o => { const ok = o.filter(sp => sp && World.spots[sp]); return o.map(sp => !sp || World.spots[sp] ? sp : (ok[0] || '')); })(CAST_OUT[id]);       /* [coordinator] a yard that has gone with its house (the town worker removes empty shells: in.46 went) falls back to the person's other place, not to a spot that does not exist */
    let day;
    if (id === 'godwin') day = [[1.0, at(home, 'work'), 'work'], [9.2, meal, sitA], [9.7, bed, 'lie'], [15.6, at(home, 'counter'), 'idle'], [16.4, 'square.well', 'idle'], [17.1, yard || at(home, 'counter'), yard ? 'work' : 'idle'], [18.2, meal, sitA]];          // the baker bakes from one in the morning and sleeps from ten till half past three; the evening is his family's (the tour found him in bed at eight)
    else if (child) { const sc = CAST_SCHOOL.indexOf(id), pl = PLAY[(H(id, 'p') * PLAY.length) | 0], pl2 = PLAY[((H(id, 'p') * PLAY.length | 0) + 3) % PLAY.length];
      day = [[wake + 0.5, meal, sitA]].concat(CAST_WELL.includes(id) ? [[wellT(id), WELL[0], 'idle'], [wellT(id) + 0.35, meal, sitA]] : [], sc >= 0 && SCHOOL.length ? [[8.9, SCHOOL[sc % SCHOOL.length], S_[SCHOOL[sc % SCHOOL.length]].sit ? 'sit' : 'idle']] : [], [[noon, meal, sitA], [aft, id === 'lettice' ? at('shop.s1', 'counter') : (has(CAST_TASK[id]) ? CAST_TASK[id] : yard || at(work === home ? home : work, 'work')), id === 'lettice' ? 'idle' : 'work'], [15.6 + J(id, 'a', 0.3), [pl, pl2, pl], 'idle'], [18.3, meal, sitA]]); }
    else if (old && !out && !keeps && !(first && bench)) day = [[wake + 0.8, meal, sitA], (has(CAST_MORN[id]) ? [9.4 + J(id, 'm', 0.3), CAST_MORN[id], 'idle'] : [9.5 + J(id, 'm', 0.4), spot === at(home, 'home') ? meal : spot, spot === at(home, 'home') ? sitA : 'work']), [noon - (has(CAST_MORN[id]) ? 0.5 : 0), meal, sitA], (CAST_STAY[id] ? (id === 'lambert' && has(CAST_MORN[id]) ? [aft + 0.9, CAST_MORN[id], 'idle'] /* he 'sits at the door' (the table) */ : [aft + 0.2, bench && !first ? at(work, 'fire1') : meal, bench && !first ? 'idle' : sitA]) : [aft + 0.2, ['square.bench', 'square.bench2', 'green.bench'].filter(has)[Math.floor(H(id, 'o') * 3) % ['square.bench', 'square.bench2', 'green.bench'].filter(has).length], 'sit']), [16 + J(id, 'e', 0.4), meal, sitA]];
    else { const a0 = wake + 0.7, well = CAST_WELL.includes(id) ? [[wellT(id), WELL[0], 'idle'], [wellT(id) + 0.35, meal, sitA]] : [];
      const am = out && out[0] ? [a0 + (well.length ? 1.6 : 0), out[0], /stall|step/.test(out[0]) ? 'idle' : 'work'] : [well.length ? 8.3 : a0, spot, wAnim], pm = out && out[1] ? [aft + J(id, 'a', 0.1), out[1], /bench|view|lane|step/.test(out[1]) ? 'idle' : 'work'] : [aft + J(id, 'a', 0.1), spot, wAnim];
      const town = !home.startsWith('high.'), shape = !keeps && (k === 0 || first) && !out && !CAST_HOST[id] ? (maker++ % 4) : -1, mk = q => MARKET[(H(id, q) * MARKET.length) | 0];          /* Highfold is an hour's walk from the market: its people keep to their own yard. Three shapes of a craftsman's day, dealt in turn, so no four have the same one */
      const errT = sitting === 0 && shape !== 1 ? aft + 0.2 : 9.8 + J(id, 'm', 0.15);          /* [audit, Build 81] the noon meal is taken in three sittings by household (half past eleven, a quarter past twelve, one o'clock) so the streets do not empty at one stroke; those of the first sitting do their marketing after it */
      const shop = town && (((!keeps || !first) && !out && k > 0) || shape === 1) ? [[errT, mk('mk'), 'idle']] : [], late = !town ? (k === 0 ? [[15.2, meal, sitA], [16.6, spot, wAnim]] : [[16.3, has(home + '.step') ? home + '.step' : at(home, 'fire1'), 'idle'], [17.4, meal, sitA]]) : shape === 0 ? [[16.8 + J(id, 'e', 0.15), mk('ev'), 'idle']] : shape === 2 ? [[15.6, (maker % 2 ? 'square.bench' : 'square.bench2'), 'sit'], [16.9, spot, wAnim]] : shape === 3 ? [[aft + 0.8, ['terrace.view', 'wharf.view', 'bridge.west', 'gallery.top'].filter(has)[maker % 4] || mk('wk'), 'idle'], [aft + 2.0, spot, wAnim]] : [];          /* the fourth shape: an hour's air after dinner, at one of the town's views */
      if (out && out[2] && has(out[2])) late.push([16.6, out[2], 'work']);
      day = well.concat([am], shop, shop.length ? [[errT + 1.4 + J(id, 'b', 0.1), spot, wAnim]] : [], [[noon, meal, sitA], pm], late, keeps && first && town ? [[18.05 + (airN % 3) * 0.1, AIR[airN++ % AIR.length] || mk('air'), 'idle']] : has(CAST_EVE[id]) ? [[18.05, CAST_EVE[id], 'idle']] : [[18.1 + J(id, 'h', 0.2), meal, sitA]]); }          /* whoever keeps a counter all day takes the air when the shop is shut */
    if (yardBy[id] && !day.some(r => r[1] === yardBy[id])) day.push(CAST_WELL.includes(id) ? [16.9, yardBy[id], 'work'] : [6.9, yardBy[id], 'work'], CAST_WELL.includes(id) ? [18.1, meal, sitA] : [8.05, spot, wAnim]);
    let eve = CAST_HART.includes(id) ? (HART_SEATS[hart] ? [[19.1 + (hart % 5) * 0.12, HART_SEATS[hart], S_[HART_SEATS[hart++]].sit ? 'sit' : 'idle']] : [[19.1 + (hart++ % 5) * 0.12, standAt('inn', has('inn.barfront') ? 'inn.barfront' : 'inn.home'), 'idle']]) : [[19.2 + J(id, 'v', 0.2), meal, sitA]];          /* no seat left: standing at the bar (claims give each a place of their own) */
    let rows = day.concat(id === 'godwin' ? [] : eve).sort((a, b) => a[0] - b[0]);
    for (const vis of CAST_VISIT[id] ? (Array.isArray(CAST_VISIT[id][0]) ? CAST_VISIT[id] : [CAST_VISIT[id]]) : []) if (has(vis[1])) { const before = rows.filter(r => r[0] <= vis[0]).pop() || [0, meal, sitA]; rows = rows.filter(r => r[0] <= vis[0] || r[0] >= vis[2]).concat([[vis[0], vis[1], vis[3] || 'idle'], [vis[2], before[1], before[2]]]).sort((a, b) => a[0] - b[0]); const ev = rows.filter(r => eve.includes(r) || (r[0] >= 19 && r[0] < 22)); day = rows.filter(r => !ev.includes(r)); eve.length = 0; for (const r of ev.length ? ev : [[19.2, meal, sitA]]) eve.push(r); }
    const sched = (id === 'godwin' ? [] : [[wake, meal, sitA]]).concat(day, id === 'godwin' ? [[20.2, at(home, 'fire1'), 'idle'], [21.4, meal, sitA]] : eve.concat([[eve.slice().sort((a, b) => a[0] - b[0]).pop()[1].startsWith('inn.') ? 22 + H(id, 'l') * 0.4 : up, bed || meal, bed ? 'lie' : sitA]])).filter(r => r && r[1]).sort((a, b) => a[0] - b[0]);
    const tn = HH_TINT[(H(id, 't') * 8) | 0], bodies = CAST_BODY[p.voice] || CAST_BODY.M, young = p.age >= 13 && p.age <= 15, body = young ? (fem ? 'f_maid' : 'm_youth') : bodies[(H(id, 'b') * bodies.length) | 0];          /* coordinator, 15:45: the child bodies are for under 13; 13 to 15 a youth body at 0.88 to 0.95 (Tom, Lettice, Davy), about 1.5 m */
    NPC_DEFS.push({ id, name: p.name, body, cast: p, tint: { tunic: tn, robe: tn, skirt: HH_TINT[(H(id, 'q') * 8) | 0], pants: [1.1, 1.0, 0.9] }, skin: HH_SKIN[(H(id, 'k') * 6) | 0], hair: p.age >= 55 ? (p.age >= 68 ? 'white' : 'grey') : HH_HAIR[(H(id, 'h') * 7) | 0],
      top: [0.4, 0.36, 0.3], legs: [0.3, 0.26, 0.22], female: fem, dress: fem, scale: young ? 0.88 + (p.age - 13) * 0.035 : child ? Math.min(0.8, 0.53 + p.age * 0.018) : p.voice === 'YM' && p.age < 17 ? 0.9 : undefined, run: (child && !young) || undefined, sched, house: home, bed });
    if (id === 'hugh') buttsDay(NPC_DEFS[NPC_DEFS.length - 1], [15.8, 17.0]);
    if (CAST_BIER[id]) bierDay(NPC_DEFS[NPC_DEFS.length - 1], CAST_BIER[id]);
    // [coordinator, Build 83] a day may depend on the story: once the bell rings again these six are at the chapel at dawn (npcRow asks schedIf before the plain day)
    if (CAST_CHAPEL.includes(id) && has('chapel.nave')) { const dawn = [[5.5 + CAST_CHAPEL.indexOf(id) * 0.04, 'chapel.nave', 'pray']].concat(sched.filter(r => r[0] >= 6.7 || r[0] < 5.4)).sort((a, b) => a[0] - b[0]), d = NPC_DEFS[NPC_DEFS.length - 1]; if (!dawn.some(r => r[0] > 6.6 && r[0] < 7.3)) dawn.push([6.75, meal, sitA]), dawn.sort((a, b) => a[0] - b[0]); d.schedIf = () => (typeof qAt === 'function' && qAt('bell') === 99 ? dawn : null); }
  }
}

// ── One at a time through a door (coordinator, 11:30 and 15:45: Marta and Bridget met in the Hart's doorway at closing, both walking to the one portal) ──
// Their two ways joined at a way point 2 m inside the room and they reached it together from two sides; so the rule is for any way point, a door's threshold
// included. A walker within 1.5 m of the next point of their way stops there, idle, while someone nearer is bound for the same point or has only just left
// it (still within 0.7 m), or, at a door, someone who has come through stands on the threshold. Then they go on, one behind the other. Ties go by place in the
// list; after 3 s a walker goes anyway, so two can never wait on each other.
function npcDoorWait(n, d, dt) {
  const k = n.path[n.pi]; if (d > 1.5 || k === undefined) { n.doorWait = 0; return false; }
  if ((n.doorWait || 0) > 3) { if (d < 0.3) n.doorWait = 0; return false; }
  const K = Nav.nodes[k], portal = Nav.portal[k] !== undefined, me = NPCS.indexOf(n);
  for (let i = 0; i < NPCS.length; i++) { const m = NPCS[i]; if (m === n || Math.abs(m.pos[1] - K[1]) > 1.5) continue; const dm = Math.hypot(m.pos[0] - K[0], m.pos[2] - K[2]); if (dm > 1.6) continue;
    const ahead = m.path && m.path[m.pi] === k && (dm < d - 0.05 || (Math.abs(dm - d) <= 0.05 && i < me)) && (m.doorWait || 0) <= 3;
    const leaving = m.path && m.pi > 0 && m.path[m.pi - 1] === k && dm < 0.7, onIt = portal && !m.path && dm < 0.6;
    if (ahead || leaving || onIt) { n.doorWait = (n.doorWait || 0) + dt; n.anim = 'idle'; return true; } }
  n.doorWait = 0; return false;
}
