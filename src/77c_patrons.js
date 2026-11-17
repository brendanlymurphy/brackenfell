// ───────────────────────── regulars of the Honeyed Hart: evening guests who fill the common room (inn.s6..s12) ─────────────────────────
// [logic] By day the four of working age have a morning's work (the field, the barn, the mill's carting, the yard) and the afternoon in town; the youth and the two old ones idle, as they would; from the evening bell they are at their table; they sleep in the infill cottages.
(function () {
  // id, name, body (49_chars.js 'real' set), skin, hair, tint (multipliers on the colours baked into the body), evening seat, bed, day: [[hour, spot(s), anim] ...]
  const L = [
    ['pat1', 'Wat Cooper', 'm_farmer', 'tan', 'brown', { tunic: [1.55, 0.95, 0.6] }, 'inn.s6', 'in.02.bed', [[7.5, 'farm.field2', 'work'], [11.5, 'stallfront0', 'idle'], [13, 'square.well', 'idle'], [15, 'square.bench', 'sit']]],
    ['pat2', 'Tilda Fenn', 'f_farmer', 'rosy', 'auburn', { tunic: [0.7, 0.85, 1.25], skirt: [1.2, 0.9, 0.8] }, 'inn.s7', 'in.04.bed', [[7.5, 'barn.front', 'work'], [12.5, 'stallfront1', 'idle'], [14.5, 'square.bench2', 'sit'], [16.5, 'elder.porch', 'idle']]],
    ['pat3', 'Hob the Carter', 'm_fisher', 'brown', 'black', { tunic: [1.1, 0.85, 0.7], pants: [0.8, 0.8, 0.8] }, 'inn.s8', 'in.07.bed', [[7.5, 'mill.door', 'work'], [10, 'alley.stall0', 'idle'], [12.5, 'wharf.view', 'idle'], [15.5, 'square.well', 'idle']]],
    ['pat4', 'Sorrel Vane', 'm_youth', 'fair', 'blond', { tunic: [1.35, 0.75, 1.2] }, 'inn.s9', 'in.13.bed', [[7.5, 'elder.porch', 'idle'], [12, 'dstall0', 'idle'], [16, 'square.bench', 'sit']]],
    ['pat5', 'Piers Ashby', 'm_elder', 'tan', 'grey', { tunic: [0.95, 1.0, 1.1] }, 'inn.s10', 'in.21.bed', [[7.5, 'in.21.bed', 'lie'], [10, 'stallfront2', 'idle'], [14.5, 'square.bench2', 'sit']]],
    ['pat6', 'Nell Marsh', 'f_weaver', 'rosy', 'brown', { robe: [0.55, 1.0, 1.3], tunic: [0.6, 1.0, 1.3] }, 'inn.s11', 'in.23.bed', [[7.5, 'square.bench2', 'sit'], [12, 'alley.stall1', 'idle'], [16, 'square.well', 'idle']]],
    ['pat7', 'Jory Thatcher', 'm_hunter', 'brown', 'brown', { tunic: [1.25, 1.15, 0.65] }, 'inn.s12', 'in.04.bed2', [[8, 'farm.yard', 'work'], [10, 'dstall1', 'idle'], [13.5, 'stallfront0', 'idle'], [16.5, 'square.bench', 'sit']]],
  ];
  for (const [id, name, body, skin, hair, tint, seat, bed, day] of L) NPC_DEFS.push({ id, name, body, tint, skin, hair, top: [0.4, 0.36, 0.3], legs: [0.3, 0.26, 0.22], female: /^f_/.test(body), dress: /^f_/.test(body), sched: day.concat([[18.5, seat, 'sit'], [23.5, bed, 'lie']]) });
})();

// ── anchors are claimed (one person to a place) ──
// A schedule names a spot; if another person already holds it, the next free spot beside it (name#1, name#2 ... on a ring 0.85 m round it, never in a wall) is used.
// A taken seat or bed becomes a standing place beside it. The nav graph knows an alias by its parent's node.
const NPC_CLAIMS = {};
function npcClaimReset() { for (const k in NPC_CLAIMS) delete NPC_CLAIMS[k]; for (const n of NPCS) n.claim = null; if (typeof AMB !== 'undefined') for (const a of AMB.list) a.claim = null; }
function npcClaim(n, name) {
  const sp0 = World.spots[name]; if (!sp0 || typeof name !== 'string') return name;
  const base = name.split('#')[0], spB = World.spots[base] || sp0, own = n.claim;
  if (own && (own === base || own.startsWith(base + '#')) && NPC_CLAIMS[own] === n.id) return own;
  const crowded = q => {          // standing people keep 0.7 m apart, whatever their spots are called (seats and beds are laid out by the plans)
    if (q.sit || q.lie) return false;
    for (const o in NPC_CLAIMS) { if (NPC_CLAIMS[o] === n.id) continue; const r = World.spots[o]; if (r && Math.abs(r.p[1] - q.p[1]) < 1.2 && Math.hypot(r.p[0] - q.p[0], r.p[2] - q.p[2]) < 0.7) return true; }
    return false;
  };
  for (let k = 0; k < 20; k++) {       /* [apart] 20 places, in three rings: with nine, a tenth person was given the spot itself and stood in whoever had it */
    const cand = k ? base + '#' + k : base;
    if (NPC_CLAIMS[cand] && NPC_CLAIMS[cand] !== n.id) continue;
    if (k && !World.spots[cand]) {          // a ring of standing places round the spot, none inside a wall
      const a = k * 2.4 + base.length, rr = 0.85 * (1 + (k > 12 ? 1.6 : k > 4 ? 0.8 : 0)), x = spB.p[0] + Math.cos(a) * rr, z = spB.p[2] + Math.sin(a) * rr;
      if (World.blockedAt && World.blockedAt(x, z, 0.3)) continue;
      World.spots[cand] = Object.assign({}, spB, { p: [x, spB.p[1], z] }); delete World.spots[cand].sit; delete World.spots[cand].lie;
      if (Nav.spot[base] !== undefined) Nav.spot[cand] = Nav.spot[base];
    }
    if (crowded(World.spots[cand] || spB)) continue;
    if (own && own !== cand && NPC_CLAIMS[own] === n.id) delete NPC_CLAIMS[own];
    NPC_CLAIMS[cand] = n.id; n.claim = cand; return cand;
  }
  return name;
}
