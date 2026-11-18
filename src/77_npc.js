// ───────────────────────── villagers: who they are, where they walk, what they do ─────────────────────────
// schedule rows: [fromHour, spot, animation]   (wander: list of spots visited in turn)
const NPC_DEFS = [
  { id: 'hale', name: 'Warden Hale', skin: 'tan', hair: 'brown', beard: 1, hat: 'helmet', top: [0.42, 0.40, 0.38], apron: [0.55, 0.15, 0.13], legs: [0.25, 0.22, 0.2], prop: 'spear', sword: true, build: 1.08,
    sched: [[6, 'gate.post', 'guard'], [20.4, 'inn.s5', 'sit'], [22.5, 'guardhouse.bed', 'lie']] },       // [cast] he keeps the gate until Ivo has had his supper (the guardhouse stood empty at eight)
  { id: 'greta', name: 'Greta Barleybrook', skin: 'rosy', hair: 'auburn', hairStyle: 'bun', dress: true, top: [0.34, 0.46, 0.30], apron: COL.linen, build: 1.1, shortSleeves: true,
    sched: [[5.5, 'inn.work', 'work'], [7.5, 'inn.bar', 'idle'], [14.2, 'inn.cellar0', 'work'], [15, 'inn.bar', 'idle'], [23.5, 'inn.bed2', 'lie']] },       // [logic] the kitchen before opening, the cellar in the slack of the afternoon, the bar the rest of the day
  { id: 'brandt', name: 'Brandt Ironhand', skin: 'tan', hair: 'black', hairStyle: 'bald', beard: 1, top: [0.36, 0.30, 0.27], apron: [0.36, 0.22, 0.13], legs: [0.28, 0.24, 0.2], build: 1.18, shortSleeves: true, prop: 'hammer',
    sched: [[6.5, 'smithy.anvil', 'hammer'], [12, 'smithy.forge', 'work'], [13, 'smithy.anvil', 'hammer'], [19, 'inn.s1', 'sit'], [22, 'smithy.bed', 'lie']] },
  { id: 'tobin', name: 'Tobin', scale: 0.74, skin: 'fair', hair: 'blond', top: [0.55, 0.45, 0.25], legs: [0.3, 0.25, 0.2], run: true,
    sched: [[7, ['square.bench2', 'stallfront0', 'alley.stall1', 'smithy.forge', 'alley.n', 'stallfront1', 'gate.post2', 'alley.s', 'square.bench2'], 'idle'], [19.5, 'smithy.sit', 'sit'], [21.5, 'smithy.bed2', 'lie']] },       // [cast] his own bed in the forge loft (he stood by the door all night)
  { id: 'marta', name: 'Marta Quill', skin: 'brown', hair: 'black', hairStyle: 'braid', dress: true, top: [0.52, 0.20, 0.30], hat: 'kerchief', hatCol: [0.9, 0.82, 0.6], belt: [0.7, 0.55, 0.2],
    sched: [[6.4, 'store.cellar0', 'work'], [7.5, 'store.counter', 'idle'], [18.2, 'store.home', 'idle'], [20.6, 'inn.s3', 'sit'], [22.2, 'store.bed', 'lie']] },       /* [cast] the shop shut, she is at home until her hour at the Hart (the tour found Quill's empty at eight) */       // [logic] stock from the cellar before opening
  { id: 'aldous', name: 'Brother Aldous', skin: 'fair', hair: 'grey', hairStyle: 'bald', dress: true, top: [0.80, 0.76, 0.64], belt: [0.45, 0.3, 0.2], cloakBack: true, cloak: [0.42, 0.30, 0.22], hat: 'hood',
    sched: [[5, 'chapel.altar', 'pray'], [9, 'chapel.nave', 'idle'], [12, 'chapel.altar', 'pray'], [14, 'chapel.nave', 'idle'], [18, 'chapel.altar', 'pray'], [21, 'chapel.bed', 'lie']] },       // [cast] a cot in the sacristy: he prayed round the clock
  { id: 'maren', name: 'Old Maren', skin: 'fair', hair: 'white', dress: true, top: [0.36, 0.30, 0.42], hat: 'hood', cloak: [0.28, 0.38, 0.28], cloakBack: true, scale: 0.93,
    sched: [[7, 'herbalist.garden', 'work'], [12, 'herbalist.sit', 'sit'], [14, 'herbalist.garden', 'work'], [18.5, 'herbalist.sit', 'sit'], [21, 'herbalist.bed', 'lie']] },
  { id: 'osric', name: 'Osric Dunn', skin: 'fair', hair: 'brown', beard: 1, hat: 'cap', hatCol: [0.9, 0.88, 0.8], top: [0.84, 0.81, 0.74], apron: [0.92, 0.9, 0.84], legs: [0.5, 0.45, 0.38], build: 1.15,
    sched: [[6, 'mill.work', 'work'], [10, 'mill.door', 'idle'], [12, 'mill.sit', 'sit'], [13, 'mill.work', 'work'], [18.6, 'mill.sit', 'sit'], [20.4, 'inn.s2', 'sit'], [22.3, 'mill.bed', 'lie']] },       // [cast] the tour found the mill empty at noon and at eight: he eats at home, and comes to the Hart after supper
  { id: 'edda', name: 'Edda Fairweather', skin: 'tan', hair: 'blond', hairStyle: 'braid', hat: 'straw', dress: true, top: [0.56, 0.44, 0.24], apron: [0.36, 0.46, 0.58], shortSleeves: true,
    sched: [[6, 'farm.field', 'work'], [10, 'farm.yard', 'idle'], [12, 'farm.field2', 'work'], [17, 'farm.yard', 'sweep'], [19.5, 'farm.sit', 'sit'], [21.5, 'farm.bed', 'lie']], prop: null },
  { id: 'finn', name: 'Finn Reedwater', skin: 'tan', hair: 'grey', beard: 1, hat: 'cap', hatCol: [0.24, 0.36, 0.5], top: [0.30, 0.42, 0.50], legs: [0.3, 0.28, 0.24], prop: 'rod',
    sched: [[5.5, 'dock.end', 'fish'], [19, 'inn.s4', 'sit'], [22, 'fisher.bed', 'lie']] },
  { id: 'lark', name: 'Lark', skin: 'fair', hair: 'red', hairStyle: 'long', hat: 'feather', hatCol: [0.2, 0.45, 0.3], top: [0.22, 0.48, 0.44], skirt: [0.22, 0.48, 0.44], legs: [0.52, 0.2, 0.2], prop: 'lute', belt: [0.75, 0.6, 0.2],
    sched: [[9, 'square.bard', 'lute'], [13, 'inn.bard', 'lute'], [15, 'square.bard', 'lute'], [18.5, 'inn.bard', 'lute'], [23.4, 'inn.fire2', 'sit'], [24.6, 'inn.bed3', 'lie']] },       // [logic] a bard sleeps too: a guest bed at the Hart (he stood by the fire all night)
  { id: 'wren', name: 'Wren', skin: 'brown', hair: 'black', hairStyle: 'braid', hat: 'hood', cloak: [0.24, 0.32, 0.2], cloakBack: true, top: [0.34, 0.38, 0.24], legs: [0.32, 0.25, 0.18],
    sched: [[6, 'hunter.yard', 'work'], [11, 'hunter.sit', 'sit'], [13, 'hunter.yard', 'work'], [20, 'hunter.sit', 'sit'], [22, 'hunter.bed', 'lie']] },
  { id: 'rowan', name: 'Elder Rowan', skin: 'fair', hair: 'white', hairStyle: 'long', beard: 2, dress: true, top: [0.40, 0.34, 0.52], belt: [0.7, 0.6, 0.3], prop: 'staff', scale: 0.97,
    sched: [[8, 'square.bench', 'sit'], [14, 'elder.porch', 'sit'], [19.5, 'elder.sit', 'sit'], [21.5, 'elder.bed', 'lie']] },
  { id: 'pip', name: 'Pip', scale: 0.66, skin: 'rosy', hair: 'brown', hairStyle: 'braid', dress: true, top: [0.72, 0.36, 0.30], run: true,
    sched: [[7.5, ['stallfront2', 'square.well', 'alley.stall0', 'stallfront1', 'alley.n', 'square.bench2', 'stallfront0', 'alley.s', 'square.well'], 'idle'], [19, 'weaver.home', 'idle'], [20.5, 'weaver.bed2', 'lie']] },
  { id: 'ivo', name: 'Guardsman Ivo', skin: 'deep', hair: 'black', hat: 'helmet', top: [0.42, 0.40, 0.38], apron: [0.2, 0.3, 0.5], legs: [0.25, 0.22, 0.2], prop: 'spear', sword: true,
    sched: [[6.3, 'guardhouse.bed2', 'lie'], [11.8, 'guardhouse.sit', 'sit'], [13.5, ['gate.post2', 'square.well', 'bridge.west', 'square.well'], 'guard'], [19.0, 'guardhouse.sit', 'sit'], [20.3, 'gate.post', 'guard']] },       // [cast] up for his dinner at noon and his supper in the guardhouse before the night watch (the tour: asleep at noon, the guardhouse empty at eight)       // [logic] the night watch: he takes the gate when Hale goes to the Hart, keeps it till Hale is back at six, and sleeps the morning (he never slept, and the gate stood empty from half past seven)
  { id: 'hilda', name: 'Hilda Weaver', skin: 'rosy', hair: 'brown', hairStyle: 'bun', dress: true, top: [0.26, 0.38, 0.60], apron: [0.9, 0.86, 0.76],
    sched: [[8, 'weaver.work', 'work'], [12.5, 'alley.stall0', 'idle'], [14, 'weaver.work', 'work'], [18.5, 'weaver.home', 'idle'],       /* [cast] at her own loom: Sabina Lindqvist keeps the draper's counter */ [20, 'weaver.sit', 'sit'], [21.5, 'weaver.bed', 'lie']] },
  { id: 'bram', name: 'Bram', skin: 'tan', hair: 'auburn', hat: 'straw', top: [0.5, 0.52, 0.34], legs: [0.36, 0.3, 0.22], shortSleeves: true,
    sched: [[6.2, 'farm.field', 'work'], [7.5, 'stall0', 'idle'], [18, 'barn.work', 'work'], [19.5, 'inn.stand1', 'idle'], [22, 'in.67.bed', 'lie']] },       // [cast] he sleeps in Bram's House and walks out to the farm at dawn
];
const NPCS = [], NPC = {};
const Nav = { nodes: [], adj: [], spot: {}, portal: {} };        // portal[a] = b: stepping from node a to b crosses a door between two spaces (an instant move)
function navBuild() {
  const N = Nav.nodes, A = Nav.adj;
  const add = (x, y, z) => { N.push([x, y, z]); A.push([]); return N.length - 1; };
  const link = (a, b) => { if (a === b || a < 0 || b < 0) return; const d = hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]); if (!A[a].some(e => e[0] === b)) { A[a].push([b, d]); A[b].push([a, d]); } };
  const roadNodes = [], roadEnds = [];       /* [coord] roadEnds: first and last node of each road */
  for (const r of Roads) {
    let prev = -1; const n = Math.max(2, Math.round(r.line.len / 5)), k0 = N.length;
    for (let i = 0; i <= n; i++) { const p = r.line.point(r.line.len * i / n); if (hyp(p[0], p[1]) > WORLD_RADIUS + 20) { prev = -1; continue; } const k = add(p[0], World.groundY(p[0], p[1]), p[1]); roadNodes.push(k); link(prev, k); prev = k; }
    if (N.length > k0) roadEnds.push([k0, N.length - 1]);
  }
  const nearest = (x, z, list, max) => { let b = -1, bd = max * max; for (const k of list) { const d = (N[k][0] - x) * (N[k][0] - x) + (N[k][2] - z) * (N[k][2] - z); if (d < bd) { bd = d; b = k; } } return b; };
  // join roads where they meet
  for (const k of roadNodes) for (const j of roadNodes) if (j > k + 1 && hyp(N[k][0] - N[j][0], N[k][2] - N[j][2]) < 3.2) link(k, j);
  // a few stepping stones across the open square
  const sq = [[0, -2], [-6, -4], [6, -3], [0, -10], [0, 6], [-9, 2], [9, 3], [0, -15.5]].map(p => add(p[0], World.groundY(p[0], p[1]), p[1]));
  for (const a of sq) { for (const b of sq) if (a < b && hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]) < 11) link(a, b); link(a, nearest(N[a][0], N[a][2], roadNodes, 9)); }
  const outside = roadNodes.concat(sq); const streetNodes = outside.slice();
  /* [coord] Build 72: a road that stops short of the place (the north road now ends in a ginnel 6 m from the nearest stepping stone) was joined to nothing,
     so everyone bound for it walked 500 m round by the hills. Each road end joins the nearest node that is not its own road, within 12 m. */
  const blocked = (a, b) => { const n = Math.ceil(hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]) / 0.3); for (let i = 1; i < n; i++) { const t = i / n, x = N[a][0] + (N[b][0] - N[a][0]) * t, z = N[a][2] + (N[b][2] - N[a][2]) * t, y = World.groundY(x, z);
    for (const c of World.colliders) { if (c.y0 > y + 1.2 || c.y1 < y + 0.4) continue; const dx = x - c.x, dz = z - c.z; if (c.r !== undefined) { if (dx * dx + dz * dz < c.r * c.r) return true; } else if (Math.abs(dx * c.ax + dz * c.az) < c.hx && Math.abs(dx * c.bx + dz * c.bz) < c.hz) return true; } } return false; };       /* a wall or a house between two nodes */
  const steep = (a, b) => { const L = hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]), n = Math.ceil(L / 0.5); let py = N[a][1]; for (let i = 1; i <= n; i++) { const t = i / n, y = World.groundAt(N[a][0] + (N[b][0] - N[a][0]) * t, N[a][2] + (N[b][2] - N[a][2]) * t, py + 1.0); if (Math.abs(y - py) > 0.45) return true; py = y; } return false; };       /* a rise of more than 0.45 m in half a metre: a bank or a wall foot, not a way */
  for (const [k0, k1] of roadEnds) for (const e of [k0, k1]) { const cand = outside.filter(k => (k < k0 || k > k1) && hyp(N[k][0] - N[e][0], N[k][2] - N[e][2]) < 12 && !blocked(e, k)), j = nearest(N[e][0], N[e][2], cand, 12); if (j >= 0) link(e, j); }
  const doorNode = {};
  for (const id in World.houses) {
    const h = World.houses[id], d = h.door; if (!d) continue;
    const x = h.xdoor || d, o = add(x.out[0], World.groundAt(x.out[0], x.out[2], x.out[1] + 1), x.out[2]), i = add(d.ins[0], h.floorY + 0.02, d.ins[2]);
    if (h.cell) {         // the door is a portal: outside node o -> threshold ot (village) ~ threshold it (cell) -> inside node i
      const ot = add(x.c[0], World.groundAt(x.c[0], x.c[2], x.c[1] + 1), x.c[2]), it = add(d.c[0], h.floorY + 0.02, d.c[2]);
      link(o, ot); link(it, i); A[ot].push([it, 1.2]); A[it].push([ot, 1.2]); Nav.portal[ot] = it; Nav.portal[it] = ot; doorNode[id] = { o, i, ot, it };
    } else { link(o, i); doorNode[id] = { o, i }; }
    /* [cull] a door step joins the nearest node it can walk to, not the nearest through whatever stands between (a cottage outside the north wall was
       joined to a lane inside it, through the gap at the wall's end where the bank is too steep to climb); the nearest of all only if none is open */
    { const cand = outside.filter(k => hyp(N[k][0] - x.out[0], N[k][2] - x.out[2]) < 40).sort((p, q) => hyp(N[p][0] - x.out[0], N[p][2] - x.out[2]) - hyp(N[q][0] - x.out[0], N[q][2] - x.out[2])); let j = -1; for (const k of cand.slice(0, 6)) if (!blocked(o, k) && !steep(o, k)) { j = k; break; } if (j >= 0) link(o, j); else { const f = nearest(x.out[0], x.out[2], outside, 40); if (f >= 0 && !A[o].some(e => e[0] === f)) { const d = hyp(N[o][0] - N[f][0], N[o][2] - N[f][2]) * 8; A[o].push([f, d]); A[f].push([o, d]); } }       /* no open way found: still joined, so the house can be reached, but at eight times the length, so nobody passing through takes it */ outside.push(o); }
  }
  const openSpots = [];
  for (const name in World.spots) {
    const s = World.spots[name], k = add(s.p[0], s.p[1], s.p[2]); Nav.spot[name] = k;
    if (s.zone && s.site && World.houses[s.site] && World.houses[s.site].plan) continue;         // planned interiors join their rooms (planNav)
    /* [cull] a yard is walled and is reached through its own house: its place is joined to the room inside the front door by a step that is not walked
       (the interior is elsewhere), so a resident goes in at the door and is next seen in the yard, and nobody cuts through a yard wall to reach it */
    /* [cull] ... and behind a house that is only a shell (no interior to walk through) the yard is joined to a point at the house's front door in the same
       way: whoever works there goes to that door and is next seen in the yard */
    if (s.yardOf && !(doorNode[s.yardOf] && Nav.portal[doorNode[s.yardOf].it] !== undefined) && s.front) { const f = add(s.front[0], World.groundY(s.front[0], s.front[1]), s.front[1]), cand = streetNodes.filter(q => hyp(N[q][0] - N[f][0], N[q][2] - N[f][2]) < 40).sort((a, b) => hyp(N[a][0] - N[f][0], N[a][2] - N[f][2]) - hyp(N[b][0] - N[f][0], N[b][2] - N[f][2])); let j = -1; for (const q of cand.slice(0, 6)) if (!blocked(f, q)) { j = q; break; } link(f, j >= 0 ? j : nearest(N[f][0], N[f][2], streetNodes, 60)); const fb = add(N[f][0], N[f][1], N[f][2]); link(f, fb); A[fb].push([k, 1.2]); A[k].push([fb, 1.2]); Nav.portal[fb] = k; Nav.portal[k] = fb; continue; }
    if (s.yardOf && doorNode[s.yardOf] && Nav.portal[doorNode[s.yardOf].it] !== undefined) { const d = doorNode[s.yardOf], ib = add(N[d.i][0], N[d.i][1], N[d.i][2]); link(d.i, ib); A[ib].push([k, 1.2]); A[k].push([ib, 1.2]); Nav.portal[ib] = k; Nav.portal[k] = ib; continue; }
    if (s.zone && s.site && doorNode[s.site]) link(k, doorNode[s.site].i); else { link(k, nearest(s.p[0], s.p[2], outside, 60)); if (!s.zone) openSpots.push(k); }
  }
  /* [cull] A place out of doors was joined to the one nearest node only, whichever side of a house row that lay: the Hawker's Passage (6 m from the Market Place)
     hung off the north road, and 350 pairs of places were more than 2.5 times the straight line apart on foot (130 m to cross 13). Each such place also joins
     up to three more nodes within 14 m that it can walk to in a straight line: nothing solid between, and no step in the ground higher than a kerb. */
  { const clearWay = (a, b, mg) => { mg = mg || 0.33;       /* 0.33: room for a person (the player is 0.32 wide); a lane's own chain is tested at 0.22, since it is a lane whatever stands along it */ const A0 = N[a], B0 = N[b], L = hyp(A0[0] - B0[0], A0[2] - B0[2]), n = Math.ceil(L / 0.3); if (Math.abs(A0[1] - B0[1]) > 1.6) return false; let py = A0[1];
      for (let i = 1; i < n; i++) { const t = i / n, x = A0[0] + (B0[0] - A0[0]) * t, z = A0[2] + (B0[2] - A0[2]) * t, y = World.groundAt(x, z, py + 1.0); if (Math.abs(y - py) > 0.12 ||       /* as a walker finds the ground (1 m up), and no steeper than a ramp: 0.3 let a link climb the terrace's edge */ (World.waterAt && World.waterAt(x, z) > y + 0.2)) return false; py = y;
        const l = Col.grid.get(Math.floor(x / Col.cell) * 4096 + Math.floor(z / Col.cell)); if (l) for (const c of l) { if (c.off || c.y0 > y + 1.5 || c.y1 < y + 0.3) continue; const dx = x - c.x, dz = z - c.z; if (c.r !== undefined) { if (dx * dx + dz * dz < (c.r + mg) * (c.r + mg)) return false; } else if (Math.abs(dx * c.ax + dz * c.az) < c.hx + mg && Math.abs(dx * c.bx + dz * c.bz) < c.hz + mg) return false; } }
      return Math.abs(B0[1] - py) < 0.4; };
    // lanes that are routes on the ground (the Hawker's Passage) are ways for villagers too: their points become nodes in a chain, joined to what they can reach
    const nSpot0 = openSpots.length;
    for (const rt of World.routes || []) { if (!rt.pts || rt.pts.some(q => Math.abs(q[1] - World.groundY(q[0], q[2])) > 0.5)) continue; let prev = -1; for (const q of rt.pts) { const k = add(q[0], World.groundY(q[0], q[2]), q[2]); if (prev >= 0 && clearWay(prev, k, 0.22)) link(prev, k); prev = k; openSpots.push(k); } }
    const lane = openSpots.slice(nSpot0), pool = streetNodes.concat(lane, openSpots.slice(0, nSpot0));       /* streets, the square, lanes and other places: never a house's door step (a way from a lane to a door step ran through the gap at the end of the north wall) */
    // a wall walk, a gallery or a tower stair keeps the one way up it was given: joined to the street below, it sent walkers along the top of the north wall
    // (the wall stands on a bank, so its walk is 'on the ground' by height alone: anything within 1.5 m of a raised route's points is left out too)
    const raised = []; for (const rt of World.routes || []) if (rt.pts) for (const q of rt.pts) if (Math.abs(q[1] - World.groundY(q[0], q[2])) > 0.5) raised.push(q);       /* the raised points themselves: a gallery's foot is in the street */
    const onGround = k => Math.abs(N[k][1] - World.groundY(N[k][0], N[k][2])) < 0.5 && !raised.some(q => Math.abs(q[0] - N[k][0]) < 1.5 && Math.abs(q[2] - N[k][2]) < 1.5 && Math.abs(q[1] - N[k][1]) < 1.5);
    for (const k of openSpots) { if (!onGround(k)) continue; const near = []; for (const j of pool) { if (j === k || A[k].some(e => e[0] === j) || !onGround(j)) continue; const d = hyp(N[j][0] - N[k][0], N[j][2] - N[k][2]); if (d < 14) near.push([d, j]); } near.sort((a, b) => a[0] - b[0]); let got = 0; for (const [, j] of near) { if (got >= 5) break; if (clearWay(k, j)) { link(k, j); got++; } } }
    // nothing is left cut off: whatever cannot be reached from the first road node after all this (a lane's points joined only to each other) joins the
    // nearest node outside, as every place always did
    { const seen = new Uint8Array(N.length), st = [outside[0]]; seen[outside[0]] = 1; const flood = () => { while (st.length) { const a = st.pop(); for (const e of A[a]) if (!seen[e[0]]) { seen[e[0]] = 1; st.push(e[0]); } } }; flood();
      for (const k of openSpots) if (!seen[k]) { const j = nearest(N[k][0], N[k][2], streetNodes, 60); if (j >= 0) { link(k, j); seen[k] = 1; st.push(k); flood(); } } } }
  for (const id in World.houses) { const h = World.houses[id]; if (h.plan) planNav(h.plan, add, link, doorNode); }
  // upper floors are reached by their stairs only: bottom -> top -> (round the stairwell) -> the rooms above; nothing upstairs links straight to the door
  const unlink = k => { A[k].length = 0; for (const a of A) for (let i = a.length - 1; i >= 0; i--) if (a[i][0] === k) a.splice(i, 1); };
  for (const st of World.stairs) {
    if (st.plan) continue;
    const nb = Nav.spot[st.bottom], nt = Nav.spot[st.top]; if (nb === undefined || nt === undefined) continue;
    const chain = [nb, nt].concat(st.via.map(n => Nav.spot[n]).filter(k => k !== undefined)), fy = World.houses[st.site].floorY;
    for (const k of chain.slice(1)) unlink(k);
    for (let i = 1; i < chain.length; i++) link(chain[i - 1], chain[i]);
    const hub = chain[chain.length - 1];
    for (const name in World.spots) { const sp = World.spots[name]; if (sp.site !== st.site || sp.p[1] < fy + 1.5) continue; const k = Nav.spot[name]; if (chain.includes(k)) continue; unlink(k); link(k, hub); }
  }
}
function navPath(a, b) {
  const N = Nav.nodes, A = Nav.adj, n = N.length, dist = new Float32Array(n).fill(1e9), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  dist[a] = 0;
  for (; ;) {
    let u = -1, bd = 1e9; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
    if (u < 0 || u === b) break; done[u] = 1;
    for (const e of A[u]) { const nd = bd + e[1]; if (nd < dist[e[0]]) { dist[e[0]] = nd; prev[e[0]] = u; } }
  }
  if (dist[b] >= 1e9) return null;
  const path = []; for (let k = b; k >= 0; k = prev[k]) path.push(k); return path.reverse();
}

function buildNPCs() {
  const s = (n, x, z, yaw, e) => { World.spots[n] = Object.assign({ p: [x, World.groundY(x, z), z], yaw: yaw || 0, zone: 0 }, e || {}); };
  s('square.bard', 2.6, -5.2, PI); s('square.well', 4.2, -6.4, 0.9); s('square.drain', 1.55, 4.5, -PI / 2);       /* [cull] the drain in the Market Place (73k_square.js, at 0.75, 4.4): where a pail is emptied */ s('bridge.west', 48.5, 2, PI / 2);
  // a few more indoor seats derived from each cottage's table
  for (const id of ['herbalist', 'weaver', 'farm', 'hunter', 'elder']) { const sp = World.spots[id + '.sit']; if (!sp) console.warn('no seat', id); }
  if (typeof householdDefs === 'function') householdDefs();          // [c5] the people of the ordinary houses (77e_households.js)
  for (const def of NPC_DEFS) {
    const mesh = buildCharacter(def), item = World.skinPack.add(mesh);
    const npc = { def, id: def.id, name: def.name, scale: def.scale || 1, pos: [0, 0, 0], yaw: 0, anim: 'idle', t: Math.random() * 10, path: null, pi: 0, at: null, goal: null, wander: 0, dwell: 0, talking: false, look: [0, 0], ang: new Float32Array(33) };
    npc.obj = addSkinned(item, { r: 1.4, zone: 0, npc: true });
    if (G.chars) { try { npc.ch = Chars.spawn(def); npc.ch.pivot.traverse(o => { o.layers.set(1); }); npc.obj.hasChar = true; if (typeof npcHandProp === 'function') npcHandProp(npc); /* lute, hammer, spear, mug ... (77d_handprops.js) */ } catch (e) { console.warn('villager ' + def.id + ': ' + (e && e.message || e)); npc.ch = null; npc.obj.hasChar = true; /* [ch1] the old code-built body is never shown beside the realistic set */ } }
    NPCS.push(npc); NPC[def.id] = npc;
  }
  if (G.chars && typeof Chars !== 'undefined' && Chars.audit) { const bad = Chars.audit(NPC_DEFS); if (bad.length) console.warn('[ch1] villagers without a full body: ' + bad.join('; ')); }      // [ch1] nobody is ever the fallback body
  // chickens
  World.chickens = [];
  const cm = [buildChicken([0.92, 0.9, 0.85]), buildChicken([0.62, 0.36, 0.2]), buildChicken([0.25, 0.22, 0.2])].map(m => World.skinPack.add(m));
  const homes = [[World.coop[0] + 1.5, World.coop[1] + 2], [World.coop[0] - 1, World.coop[1] + 3], [World.coop[0] + 2.5, World.coop[1] + 0.5], [World.coop[0] + 0.5, World.coop[1] + 4.2], [100.5, -13.5], [-13, 13.5], [-15.5, 15], [13.5, 17]];
  homes.forEach((h, i) => World.chickens.push({ home: h, pos: [h[0], 0, h[1]], yaw: i * 1.7, st: 'idle', t: i, tt: 1 + i * 0.3, obj: addSkinned(cm[i % 3], { r: 0.5, zone: 0, kind: 'chicken' }), ph: i * 2.1 }));
  if (typeof ambSpots === 'function') { ambSpots(); buildAmbient(); }       // unnamed street people (77b_ambient.js)
  // things to pick up
  const hm = new Mesh(128); hm.push().RZ(PI / 2 - 0.25).RY(0.4); Props.hammer(hm); hm.pop();
  const herb = new Mesh(256);
  herb.mat(MAT.PLAIN, [0.3, 0.5, 0.28]); herb.tube([[0, 0, 0], [0.02, 0.12, 0.01], [0, 0.22, 0]], 0.012, 5);
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4; herb.quad2([Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16], [Math.cos(a + 0.5) * 0.05, 0.02, Math.sin(a + 0.5) * 0.05], [0, 0.03, 0], [Math.cos(a - 0.5) * 0.05, 0.02, Math.sin(a - 0.5) * 0.05]); }
  herb.mat(MAT.PLAIN, [0.72, 0.88, 1.0]); herb.lathe([[0.008, 0.2], [0.07, 0.235], [0.075, 0.25], [0.0, 0.29]], 7, 0); herb.mat(MAT.PLAIN, [0.9, 0.95, 1.0]); herb.lathe([[0.075, 0.25], [0.008, 0.2]], 7, 0);
  const hmItem = World.skinPack.add(hm), herbItem = World.skinPack.add(herb);
  const pick = (id, item, p, label, itemId, glow) => { const obj = addSkinned(item, { c: p, r: 0.6, zone: 0, kind: 'pickup' }); R.boneData.set(m4.translate(m4.create(), p[0], p[1], p[2]), obj.slot * 256); const it = { kind: 'pickup', id, item: itemId, p: [p[0], p[1] + 0.2, p[2]], r: 1.9, zone: 0, obj, label }; World.interact.push(it); World.pickups.push(it); if (glow) { it.em = { type: 'herb', p, zone: 0 }; World.emitters.push(it.em); } };
  pick('hammer', hmItem, World.pickupSpot.hammer, 'Take the hammer', 'hammer');
  [[-3.5, 93.5], [-70.3, -17.5] /* [cast] Wren's 'forest edge, north-west of the gate' (recorded): it was at (-57, -47), due north and behind the palisade */, [45, -57], [5.5, -91], [84, -42], [-46, 63], [12, -98], [-30, 40]].forEach((p, i) => pick('frostcap' + i, herbItem, [p[0], World.groundY(p[0], p[1]), p[1]], 'Pick frostcap', 'frostcap', true));
}

// place every villager where the clock says they should be
function npcSnapAll() { if (typeof npcClaimReset === 'function') npcClaimReset(); for (const n of NPCS) { const row = npcRow(n), sp0 = Array.isArray(row[1]) ? row[1][0] : row[1], sp = typeof npcClaim === 'function' ? npcClaim(n, sp0) : sp0; npcArrive(n, sp, row[2]); n.goal = sp; } }
function npcRow(n) {
  const sc = n.override || (n.def.schedIf && n.def.schedIf()) || n.def.sched; let h = Env.hour; if (h < sc[0][0]) h += 24;       /* [cast] schedIf: a day that depends on the story (the chapel at dawn once the bell rings) */
  let row = sc[sc.length - 1]; for (const r of sc) if (r[0] <= h) row = r;
  if (!n.override && npcRaining() && NPC_IDLE[row[2]] && npcOutdoors(row[1])) { const sh = npcShelter(n); if (sh) return sh; }
  return row;
}
// [logic] rain: whoever is out of doors with nothing that must be done there (a bench, a chat at the well, a walk, the lute at the cross) goes under their
// own roof until it stops; people at work (the field, the forge, the watch, the nets) stay. On above 0.4 of rain, off below 0.1, so a shower's edge does not send people in and out.
const NPC_IDLE = { idle: 1, sit: 1, lute: 1, sweep: 1 };
let _npcRain = false;
function npcRaining() { const r = typeof Env !== 'undefined' ? (Env.rain || 0) : 0; if (r > 0.4) _npcRain = true; else if (r < 0.1) _npcRain = false; return _npcRain; }
function npcOutdoors(spot) { const nm = Array.isArray(spot) ? spot[0] : spot, sp = World.spots[nm]; return !!sp && typeof Cells !== 'undefined' && Cells.spaceOf(sp.p) === 0; }
function npcShelter(n) {
  if (n._shelter !== undefined) return n._shelter;
  let best = null; for (const r of n.def.sched) { if (Array.isArray(r[1]) || r[2] === 'lie' || npcOutdoors(r[1]) || !World.spots[r[1]] || World.spots[r[1]].lie) continue; if (!best || (r[2] === 'sit' && best[2] !== 'sit')) best = r; }
  return (n._shelter = best ? [0, best[1], best[2] === 'lute' ? 'lute' : best[2] === 'sit' ? 'sit' : 'idle'] : null);
}
function npcArrive(n, spotName, anim) {
  const sp = World.spots[spotName]; if (!sp) { console.warn('missing spot', spotName); return; }
  n.pos = sp.p.slice(); n.yaw = sp.yaw; n.at = spotName; n.path = null; n.spot = sp;
  n.anim = sp.lie ? 'lie' : sp.sit ? 'sit' : (anim === 'sit' || anim === 'lie') ? 'idle' : anim;
}
// [apart] Nobody walks through anybody. After everyone has moved: any walker within 0.6 m of another body in the same space is moved off it, sideways for
// choice, at walking pace; two walkers share the move, a person standing, sitting or lying is never moved. Bodies that are exactly together (two people stepping
// through one door at once) part along a direction fixed by their order. Named villagers, the Hart's regulars, residents and passers-by alike.
const NPC_APART = 0.6;
function npcKeepApart(dt) {
  const L = NPCS.slice(); if (typeof AMB !== 'undefined' && AMB.list) for (const a of AMB.list) if (a.state !== 'home' && a.state !== 'away') L.push(a);
  const n = L.length, mv = Math.min(0.2, 1.6 * dt);
  for (let i = 0; i < n; i++) { const a = L[i]; if (a.pushed > 0) a.pushed -= dt; }
  for (let i = 0; i < n; i++) { const a = L[i], ax = a.pos[0], az = a.pos[2], aw = !!a.path;
    for (let j = i + 1; j < n; j++) { const b = L[j], bw = !!b.path; if (!aw && !bw) continue; let dx = b.pos[0] - ax; if (dx > NPC_APART || dx < -NPC_APART) continue; let dz = b.pos[2] - az; if (dz > NPC_APART || dz < -NPC_APART || Math.abs(b.pos[1] - a.pos[1]) > 1.2) continue;
      let d = Math.hypot(dx, dz); if (d >= NPC_APART) continue; if (d < 0.02) { const g = (i * 2.399 + j) % 6.283; dx = Math.cos(g); dz = Math.sin(g); d = 1; } else { dx /= d; dz /= d; }
      // sideways to the walker's own way where that also parts them, so two in a lane pass and do not push each other back along it
      const side = w => { const fx = Math.sin(w.yaw), fz = -Math.cos(w.yaw), s = (-fz) * dx + fx * dz >= 0 ? 1 : -1; return [(-fz * s) * 0.7 + dx * 0.3, (fx * s) * 0.7 + dz * 0.3]; };
      const go = (w, x, z) => { const nx = w.pos[0] + x, nz = w.pos[2] + z, g = World.groundAt(nx, nz, w.pos[1] + 1.0); if (Math.abs(g - w.pos[1]) > 0.6) return; w.pos[0] = nx; w.pos[2] = nz; w.pushed = 0.5; };          /* only onto floor at the walker's own level: never off a gallery, a stair or the edge of a room */
      if (aw && bw) { const pa = side(a), pb = side(b); go(a, -pa[0] * mv * 0.5, -pa[1] * mv * 0.5); go(b, pb[0] * mv * 0.5, pb[1] * mv * 0.5); }
      else if (aw) { const pa = side(a); go(a, -pa[0] * mv, -pa[1] * mv); }
      else { const pb = side(b); go(b, pb[0] * mv, pb[1] * mv); } } }
}
function npcBehindRoofs(n) { if (typeof SC === 'undefined' || !SC.occ || !SC.occAt || World.cell || (TEST && (TEST.sceneocc === 0 || TEST.kitocc === 0))) return false; const q = SC.occAt, d = hyp(n.pos[0] - q[0], n.pos[2] - q[2]); if (d < ((typeof R !== 'undefined' && R.q && R.q.villagerCast) || 32) + 3) return false; const u = n._occU || (n._occU = { x: 0, z: 0, r: 1.1, y1: 0 }); u.x = n.pos[0]; u.z = n.pos[2]; u.y1 = n.pos[1] + 2.3; return SC.occ(u, d, 0.85); }
function npcUpdate(dt, playerPos) {
  const pc = Cells.spaceOf(playerPos);
  for (const n of NPCS) {
    n.t += dt;
    const dPlayer = hyp(n.pos[0] - playerPos[0], n.pos[2] - playerPos[2]);
    if (!n.talking) {
      const row = npcRow(n);
      let target = row[1];
      if (Array.isArray(target)) {            // wandering between a few spots
        if (n.wRow !== row) { n.wRow = row; n.wIdx = Math.max(0, target.indexOf(n.at)); }
        if (!n.path && n.at === target[n.wIdx]) { if (n.dwell > 0) n.dwell -= dt; else n.wIdx = (n.wIdx + 1) % target.length; }
        target = target[n.wIdx];
      }
      if (typeof npcClaim === 'function') target = npcClaim(n, target);          // anchors are claimed: nobody stands in another's place (77c_patrons.js)
      if (n.goal !== target) {
        const wasAt = !n.path && !!n.at;
        const from = n.path ? n.path[Math.min(n.pi, n.path.length - 1)] : Nav.spot[n.at], to = Nav.spot[target];
        const path = from !== undefined && to !== undefined ? navPath(from, to) : null;
        n.goal = target; n.rowAnim = row[2];
        if (path && path.length > 1) { n.path = path; n.pi = wasAt ? 1 : 0; n.at = null; }
        else npcArrive(n, target, row[2]);
      }
      if (n.path) {
        const run = n.def.run, sp = (run ? 2.7 : 1.35) * (0.9 + n.scale * 0.1), N2 = Nav.nodes[n.path[n.pi]];
        const dx = N2[0] - n.pos[0], dz = N2[2] - n.pos[2], d = hyp(dx, dz);
        const blocked = dPlayer < 0.75 && (playerPos[0] - n.pos[0]) * dx + (playerPos[2] - n.pos[2]) * dz > 0;
        if (d < 0.18 || (n.pushed > 0 && d < 0.75 && n.pi < n.path.length - 1)) { const k = n.path[n.pi], k2 = n.path[n.pi + 1];       /* someone stands on the way point: near enough counts, or the walker would circle them for ever */ if (k2 !== undefined && Nav.portal[k] === k2) { n.pos = Nav.nodes[k2].slice(); n.pi++; n.portalT = 0.4; } n.pi++; if (n.pi >= n.path.length) { npcArrive(n, n.goal, n.rowAnim); n.dwell = Array.isArray(row[1]) ? 3 + Math.random() * 7 : 0; } }
        else if (!blocked) {
          const st = Math.min(d, sp * dt); n.pos[0] += dx / d * st; n.pos[2] += dz / d * st;
          const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 1.0); if (gy > -1e8) /* [cast] no floor under this step (a stair well crossed in one long step when the night is skipped, a nudge past a floor's edge): keep the height, the way goes on to a node that has one. Marta fell out of the Hart to minus a billion and could not be spoken to (bug 29) */ n.pos[1] += clamp(gy - n.pos[1], -3 * dt, 3 * dt);       /* [logic] looks 1.0 m up, not 0.6: a ledge 0.7 to 0.9 m high (the terrace edge by the herb garden, the dock's lip) was not seen, and people waded through it for a second */ if (gy > -1e8 && (gy - n.pos[1] > 0.45 || n.pos[1] - gy > 1.2)) n.pos[1] = gy;       /* [logic] a rise higher than any stair (the 0.9 m terrace edge by the herb garden) is stepped onto at once: climbing it at 3 m/s left the walker inside it for a third of a second */
          n.yaw += angDiff(Math.atan2(dx, -dz), n.yaw) * Math.min(1, dt * 8);
          n.anim = run ? 'run' : 'walk'; n.t += dt * (run ? 7.5 : 5.2) * (1 / n.scale) - dt;
        } else n.anim = 'idle';
      }
    }
    // not in the player's space (another cell, or the village while the player is in one): position only, no pose, no drawing
    /* [cull] ... or out of doors and wholly behind the roofs, further off than a villager's shadow is drawn (so no shadow of theirs can be in sight either):
       the same roofline that hides houses and ground (42_scene.js), asked with the same margin. Four of twenty in the Market Place view. */
    if (pc !== Cells.spaceOf(n.pos) || (pc === 0 && npcBehindRoofs(n))) { n.obj.visible = false; if (n.ch && !n.hid) { n.hid = true; n.ch.pivot.visible = false; } continue; }
    n.hid = false;
    /* [cull] what a villager holds is drawn only as far as it can be made out: a mug or a flute to 20 m, a spear, staff or lute to 55 m. Each is a draw call,
       and the alley view on Low had nine of them between 25 and 91 m away (a mug at 37 m is two pixels) */
    const down = n.anim === 'sit' || n.anim === 'lie';          /* [cast] C08: at table and in bed the spear, staff, rod or hammer is put by (Hale drank at the Hart with a spear across his knees). The hat is part of the body's mesh: taking it off needs a body from the characters worker; `down` is the state to key it on */
    if (n.props) for (const m of n.props) m.visible = dPlayer < (/mug|flute/.test(m.name) ? 20 : 55) && !(down && /spear|staff|rod|hammer/.test(m.name));
    // head follows the player when close
    let lx = 0, ly = 0;
    if (dPlayer < 5.5 && n.anim !== 'lie' && n.anim !== 'hammer' && n.anim !== 'work') { const a = angDiff(Math.atan2(playerPos[0] - n.pos[0], -(playerPos[2] - n.pos[2])), n.yaw); if (Math.abs(a) < 1.9) { lx = clamp(-a, -1.1, 1.1); ly = clamp((n.pos[1] + 1.6 * n.scale - playerPos[1] - 1.6) * 0.25, -0.3, 0.3); } }
    n.look[0] += (lx - n.look[0]) * Math.min(1, dt * 5); n.look[1] += (ly - n.look[1]) * Math.min(1, dt * 5);
    // pose
    const anim = n.talking ? (n.anim === 'sit' || n.anim === 'lie' ? n.anim : 'talk') : n.anim;
    const dy = poseAngles(n.ang, anim, n.t, 1, n.look), root = POSE.root, s = n.scale;
    m4.ident(root); m4.translate(root, n.pos[0], n.pos[1], n.pos[2]);
    if (anim === 'lie') { m4.rotY(root, -(n.yaw + PI)); m4.translate(root, 0, 0.12 * s, -0.9 * s); m4.rotX(root, PI / 2); }
    else { m4.rotY(root, -n.yaw); m4.translate(root, 0, dy * s + (anim === 'sit' ? ((n.spot && n.spot.sit) || 0.46) + 0.09 - 0.96 * s : 0), 0); }
    m4.scale(root, s, s, s);
    poseWrite(n.obj.slot, root, n.ang);
    const o = n.obj; o.c = [n.pos[0], n.pos[1] + 0.9, n.pos[2]]; o.visible = dPlayer < 170 && !n.ch;
    const zn = World.zoneAt(n.pos[0], n.pos[1] + 0.5, n.pos[2]); R.boneData[o.slot * 256 + 240] = zn; R.boneData[o.slot * 256 + 241] = zn ? 0.34 : 1;
    if (n.ch) Chars.update(n.ch, { pos: n.pos, yaw: n.yaw, anim: n.anim, scale: s, zone: zn, light: zn ? 0.34 : 1, visible: dPlayer < 95, cast: dPlayer < R.q.villagerCast, look: n.look, talking: n.talking, seatHeight: n.spot && n.spot.sit, speed: n.anim === 'run' ? 2.7 * (0.9 + s * 0.1) : n.anim === 'walk' ? 1.35 * (0.9 + s * 0.1) : 0 }, dt);
  }
  if (typeof ambUpdate === 'function') ambUpdate(dt, playerPos);
  npcKeepApart(dt);
  // chickens potter about and scatter when approached
  for (const c of World.chickens) {
    c.t += dt; const dp = hyp(c.pos[0] - playerPos[0], c.pos[2] - playerPos[2]);
    if (dp < 2.2 && c.st !== 'flee') { c.st = 'flee'; c.tt = 1.2; c.yaw = Math.atan2(c.pos[0] - playerPos[0], -(c.pos[2] - playerPos[2])) + (Math.random() - 0.5); c.cluck = true; }
    c.tt -= dt;
    if (c.tt <= 0) { const far = hyp(c.pos[0] - c.home[0], c.pos[2] - c.home[1]) > 4; c.st = Math.random() < 0.45 ? 'walk' : Math.random() < 0.6 ? 'peck' : 'idle'; c.tt = 1 + Math.random() * 2.5; if (c.st === 'walk') c.yaw = far ? Math.atan2(c.home[0] - c.pos[0], -(c.home[1] - c.pos[2])) : Math.random() * TAU; }
    const sp = c.st === 'flee' ? 3.2 : c.st === 'walk' ? 0.6 : 0;
    if (sp) { const nx = c.pos[0] + Math.sin(c.yaw) * sp * dt, nz = c.pos[2] - Math.cos(c.yaw) * sp * dt; if (!World.blockedAt(nx, nz, 0.15)) { c.pos[0] = nx; c.pos[2] = nz; } else c.yaw += 1.5; }
    c.pos[1] = World.groundY(c.pos[0], c.pos[2]);
    const bd = R.boneData, k = c.obj.slot * 256, root = POSE.root, T = POSE.T;
    m4.ident(root); m4.translate(root, c.pos[0], c.pos[1] + (sp ? Math.abs(Math.sin(c.t * 14)) * 0.015 : 0), c.pos[2]); m4.rotY(root, -c.yaw); m4.scale(root, 1.25, 1.25, 1.25);
    bd.set(root, k);
    const peck = c.st === 'peck' ? Math.max(0, Math.sin(c.t * 7)) * 1.1 : sp ? Math.sin(c.t * 14) * 0.12 : Math.sin(c.t * 2 + c.ph) * 0.1;
    m4.copy(T, root); m4.translate(T, 0, 0.24, -0.05); m4.rotX(T, -peck); m4.translate(T, 0, -0.24, 0.05); bd.set(T, k + 16);
    for (const [b, s2] of [[2, 1], [3, -1]]) { m4.copy(T, root); m4.translate(T, 0, 0.15, 0); m4.rotX(T, sp ? Math.sin(c.t * 14) * 0.7 * s2 : 0); m4.translate(T, 0, -0.15, 0); bd.set(T, k + b * 16); }
    c.obj.c = [c.pos[0], c.pos[1] + 0.2, c.pos[2]]; c.obj.visible = dp < 90;
  }
}
