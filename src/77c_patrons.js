// ───────────────────────── regulars of the Honeyed Hart: evening guests who fill the common room (inn.s6..s12) ─────────────────────────
// [logic] By day the four of working age have a morning's work (the field, the barn, the mill's carting, the yard) and the afternoon in town; the youth and the two old ones idle, as they would; from the evening bell they are at their table; they sleep in the infill cottages.
// [cast] the seven regulars (Wat Cooper, Tilda Fenn ... people with no house, no kin and no lines) are gone: the Hart's evening seats inn.s6 to s12 are taken by
// people of the table (77e_households.js, CAST_HART), who walk there from their own doors and home again to their own beds.

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
