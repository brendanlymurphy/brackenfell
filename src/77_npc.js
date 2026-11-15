// ───────────────────────── villagers: who they are, where they walk, what they do ─────────────────────────
// schedule rows: [fromHour, spot, animation]   (wander: list of spots visited in turn)
const NPC_DEFS = [
  { id: 'hale', name: 'Warden Hale', skin: 'tan', hair: 'brown', beard: 1, hat: 'helmet', top: [0.42, 0.40, 0.38], apron: [0.55, 0.15, 0.13], legs: [0.25, 0.22, 0.2], prop: 'spear', sword: true, build: 1.08,
    sched: [[6, 'gate.post', 'guard'], [19.5, 'inn.s5', 'sit'], [22.5, 'guardhouse.bed', 'lie']] },
  { id: 'greta', name: 'Greta Barleybrook', skin: 'rosy', hair: 'auburn', hairStyle: 'bun', dress: true, top: [0.34, 0.46, 0.30], apron: COL.linen, build: 1.1, shortSleeves: true,
    sched: [[5.5, 'inn.bar', 'idle'], [23.5, 'inn.bed2', 'lie']] },
  { id: 'brandt', name: 'Brandt Ironhand', skin: 'tan', hair: 'black', hairStyle: 'bald', beard: 1, top: [0.36, 0.30, 0.27], apron: [0.36, 0.22, 0.13], legs: [0.28, 0.24, 0.2], build: 1.18, shortSleeves: true, prop: 'hammer',
    sched: [[6.5, 'smithy.anvil', 'hammer'], [12, 'smithy.forge', 'work'], [13, 'smithy.anvil', 'hammer'], [19, 'inn.s1', 'sit'], [22, 'smithy.bed', 'lie']] },
  { id: 'tobin', name: 'Tobin', scale: 0.74, skin: 'fair', hair: 'blond', top: [0.55, 0.45, 0.25], legs: [0.3, 0.25, 0.2], run: true,
    sched: [[7, ['square.bench2', 'stallfront0', 'smithy.forge', 'stallfront1', 'gate.post2', 'square.bench2'], 'idle'], [19.5, 'smithy.sit', 'sit'], [21.5, 'smithy.home', 'idle']] },
  { id: 'marta', name: 'Marta Quill', skin: 'brown', hair: 'black', hairStyle: 'braid', dress: true, top: [0.52, 0.20, 0.30], hat: 'kerchief', hatCol: [0.9, 0.82, 0.6], belt: [0.7, 0.55, 0.2],
    sched: [[7, 'store.counter', 'idle'], [20, 'inn.s3', 'sit'], [22, 'store.bed', 'lie']] },
  { id: 'aldous', name: 'Brother Aldous', skin: 'fair', hair: 'grey', hairStyle: 'bald', dress: true, top: [0.80, 0.76, 0.64], belt: [0.45, 0.3, 0.2], cloakBack: true, cloak: [0.42, 0.30, 0.22], hat: 'hood',
    sched: [[5, 'chapel.altar', 'pray'], [9, 'chapel.nave', 'idle'], [12, 'chapel.altar', 'pray'], [14, 'chapel.nave', 'idle'], [18, 'chapel.altar', 'pray']] },
  { id: 'maren', name: 'Old Maren', skin: 'fair', hair: 'white', dress: true, top: [0.36, 0.30, 0.42], hat: 'hood', cloak: [0.28, 0.38, 0.28], cloakBack: true, scale: 0.93,
    sched: [[7, 'herbalist.garden', 'work'], [12, 'herbalist.home', 'idle'], [14, 'herbalist.garden', 'work'], [18.5, 'herbalist.sit', 'sit'], [21, 'herbalist.bed', 'lie']] },
  { id: 'osric', name: 'Osric Dunn', skin: 'fair', hair: 'brown', beard: 1, hat: 'cap', hatCol: [0.9, 0.88, 0.8], top: [0.84, 0.81, 0.74], apron: [0.92, 0.9, 0.84], legs: [0.5, 0.45, 0.38], build: 1.15,
    sched: [[6, 'mill.work', 'work'], [10, 'mill.door', 'idle'], [13, 'mill.work', 'work'], [19, 'inn.s2', 'sit'], [22, 'mill.bed', 'lie']] },
  { id: 'edda', name: 'Edda Fairweather', skin: 'tan', hair: 'blond', hairStyle: 'braid', hat: 'straw', dress: true, top: [0.56, 0.44, 0.24], apron: [0.36, 0.46, 0.58], shortSleeves: true,
    sched: [[6, 'farm.field', 'work'], [10, 'farm.yard', 'idle'], [12, 'farm.field2', 'work'], [17, 'farm.yard', 'sweep'], [19.5, 'farm.sit', 'sit'], [21.5, 'farm.bed', 'lie']], prop: null },
  { id: 'finn', name: 'Finn Reedwater', skin: 'tan', hair: 'grey', beard: 1, hat: 'cap', hatCol: [0.24, 0.36, 0.5], top: [0.30, 0.42, 0.50], legs: [0.3, 0.28, 0.24], prop: 'rod',
    sched: [[5.5, 'dock.end', 'fish'], [19, 'inn.s4', 'sit'], [22, 'fisher.bed', 'lie']] },
  { id: 'lark', name: 'Lark', skin: 'fair', hair: 'red', hairStyle: 'long', hat: 'feather', hatCol: [0.2, 0.45, 0.3], top: [0.22, 0.48, 0.44], skirt: [0.22, 0.48, 0.44], legs: [0.52, 0.2, 0.2], prop: 'lute', belt: [0.75, 0.6, 0.2],
    sched: [[9, 'square.bard', 'lute'], [13, 'inn.bard', 'lute'], [15, 'square.bard', 'lute'], [18.5, 'inn.bard', 'lute'], [24.5, 'inn.fire2', 'sit']] },
  { id: 'wren', name: 'Wren', skin: 'brown', hair: 'black', hairStyle: 'braid', hat: 'hood', cloak: [0.24, 0.32, 0.2], cloakBack: true, top: [0.34, 0.38, 0.24], legs: [0.32, 0.25, 0.18],
    sched: [[6, 'hunter.yard', 'work'], [11, 'hunter.home', 'idle'], [13, 'hunter.yard', 'idle'], [20, 'hunter.sit', 'sit'], [22, 'hunter.bed', 'lie']] },
  { id: 'rowan', name: 'Elder Rowan', skin: 'fair', hair: 'white', hairStyle: 'long', beard: 2, dress: true, top: [0.40, 0.34, 0.52], belt: [0.7, 0.6, 0.3], prop: 'staff', scale: 0.97,
    sched: [[8, 'square.bench', 'sit'], [14, 'elder.porch', 'sit'], [19.5, 'elder.sit', 'sit'], [21.5, 'elder.bed', 'lie']] },
  { id: 'pip', name: 'Pip', scale: 0.66, skin: 'rosy', hair: 'brown', hairStyle: 'braid', dress: true, top: [0.72, 0.36, 0.30], run: true,
    sched: [[7.5, ['stallfront2', 'square.well', 'stallfront1', 'square.bench2', 'stallfront0', 'square.well'], 'idle'], [19, 'weaver.home', 'idle'], [20.5, 'weaver.bed2', 'lie']] },
  { id: 'ivo', name: 'Guardsman Ivo', skin: 'deep', hair: 'black', hat: 'helmet', top: [0.42, 0.40, 0.38], apron: [0.2, 0.3, 0.5], legs: [0.25, 0.22, 0.2], prop: 'spear', sword: true,
    sched: [[6, ['gate.post2', 'square.well', 'bridge.west', 'square.well'], 'guard'], [21, 'gate.post2', 'guard']] },
  { id: 'hilda', name: 'Hilda Weaver', skin: 'rosy', hair: 'brown', hairStyle: 'bun', dress: true, top: [0.26, 0.38, 0.60], apron: [0.9, 0.86, 0.76],
    sched: [[8, 'stall2', 'idle'], [18.5, 'weaver.home', 'idle'], [20, 'weaver.sit', 'sit'], [21.5, 'weaver.bed', 'lie']] },
  { id: 'bram', name: 'Bram', skin: 'tan', hair: 'auburn', hat: 'straw', top: [0.5, 0.52, 0.34], legs: [0.36, 0.3, 0.22], shortSleeves: true,
    sched: [[7.5, 'stall0', 'idle'], [18, 'barn.work', 'work'], [19.5, 'inn.stand1', 'idle'], [22, 'farm.bed2', 'lie']] },
];
const NPCS = [], NPC = {};
const Nav = { nodes: [], adj: [], spot: {} };
function navBuild() {
  const N = Nav.nodes, A = Nav.adj;
  const add = (x, y, z) => { N.push([x, y, z]); A.push([]); return N.length - 1; };
  const link = (a, b) => { if (a === b || a < 0 || b < 0) return; const d = hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]); if (!A[a].some(e => e[0] === b)) { A[a].push([b, d]); A[b].push([a, d]); } };
  const roadNodes = [];
  for (const r of Roads) {
    let prev = -1; const n = Math.max(2, Math.round(r.line.len / 5));
    for (let i = 0; i <= n; i++) { const p = r.line.point(r.line.len * i / n); if (hyp(p[0], p[1]) > WORLD_RADIUS + 20) { prev = -1; continue; } const k = add(p[0], World.groundY(p[0], p[1]), p[1]); roadNodes.push(k); link(prev, k); prev = k; }
  }
  const nearest = (x, z, list, max) => { let b = -1, bd = max * max; for (const k of list) { const d = (N[k][0] - x) * (N[k][0] - x) + (N[k][2] - z) * (N[k][2] - z); if (d < bd) { bd = d; b = k; } } return b; };
  // join roads where they meet
  for (const k of roadNodes) for (const j of roadNodes) if (j > k + 1 && hyp(N[k][0] - N[j][0], N[k][2] - N[j][2]) < 3.2) link(k, j);
  // a few stepping stones across the open square
  const sq = [[0, -2], [-6, -4], [6, -3], [0, -10], [0, 6], [-9, 2], [9, 3], [0, -15.5]].map(p => add(p[0], World.groundY(p[0], p[1]), p[1]));
  for (const a of sq) { for (const b of sq) if (a < b && hyp(N[a][0] - N[b][0], N[a][2] - N[b][2]) < 11) link(a, b); link(a, nearest(N[a][0], N[a][2], roadNodes, 9)); }
  const outside = roadNodes.concat(sq);
  const doorNode = {};
  for (const id in World.houses) {
    const h = World.houses[id], d = h.door; if (!d) continue;
    const o = add(d.out[0], World.groundAt(d.out[0], d.out[2], d.out[1] + 1), d.out[2]), i = add(d.ins[0], h.floorY + 0.02, d.ins[2]);
    link(o, i); link(o, nearest(d.out[0], d.out[2], outside, 40)); doorNode[id] = { o, i }; outside.push(o);
  }
  for (const name in World.spots) {
    const s = World.spots[name], k = add(s.p[0], s.p[1], s.p[2]); Nav.spot[name] = k;
    if (s.zone && s.site && doorNode[s.site]) link(k, doorNode[s.site].i); else link(k, nearest(s.p[0], s.p[2], outside, 60));
  }
  // the inn's loft is reached by its stairs
  const S = Nav.spot; if (S['inn.stairs0'] !== undefined) { for (const n of ['inn.guestbed', 'inn.bed2']) { const k = S[n]; A[k].length = 0; for (const a of A) for (let i = a.length - 1; i >= 0; i--) if (a[i][0] === k) a.splice(i, 1); link(k, S['inn.stairs1']); }
    const k1 = S['inn.stairs1']; A[k1].length = 0; for (const a of A) for (let i = a.length - 1; i >= 0; i--) if (a[i][0] === k1) a.splice(i, 1); link(k1, S['inn.stairs0']); for (const n of ['inn.guestbed', 'inn.bed2']) link(S[n], k1); }
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
  s('square.bard', 2.6, -5.2, PI); s('square.well', 4.2, -6.4, 0.9); s('bridge.west', 48.5, 2, PI / 2);
  // a few more indoor seats derived from each cottage's table
  for (const id of ['herbalist', 'weaver', 'farm', 'hunter', 'elder']) { const sp = World.spots[id + '.sit']; if (!sp) console.warn('no seat', id); }
  for (const def of NPC_DEFS) {
    const mesh = buildCharacter(def), item = World.skinPack.add(mesh);
    const npc = { def, id: def.id, name: def.name, scale: def.scale || 1, pos: [0, 0, 0], yaw: 0, anim: 'idle', t: Math.random() * 10, path: null, pi: 0, at: null, goal: null, wander: 0, dwell: 0, talking: false, look: [0, 0], ang: new Float32Array(33) };
    npc.obj = addSkinned(item, { r: 1.4, zone: 0, npc: true });
    if (G.chars) { try { npc.ch = Chars.spawn(def); npc.ch.pivot.traverse(o => { o.layers.set(1); }); npc.obj.hasChar = true; } catch (e) { console.warn('villager ' + def.id + ': ' + (e && e.message || e)); npc.ch = null; } }
    NPCS.push(npc); NPC[def.id] = npc;
  }
  // chickens
  World.chickens = [];
  const cm = [buildChicken([0.92, 0.9, 0.85]), buildChicken([0.62, 0.36, 0.2]), buildChicken([0.25, 0.22, 0.2])].map(m => World.skinPack.add(m));
  const homes = [[World.coop[0] + 1.5, World.coop[1] + 2], [World.coop[0] - 1, World.coop[1] + 3], [World.coop[0] + 2.5, World.coop[1] + 0.5], [World.coop[0] + 0.5, World.coop[1] + 4.2], [100.5, -13.5], [-13, 13.5], [-15.5, 15], [13.5, 17]];
  homes.forEach((h, i) => World.chickens.push({ home: h, pos: [h[0], 0, h[1]], yaw: i * 1.7, st: 'idle', t: i, tt: 1 + i * 0.3, obj: addSkinned(cm[i % 3], { r: 0.5, zone: 0, kind: 'chicken' }), ph: i * 2.1 }));
  // things to pick up
  const hm = new Mesh(128); hm.push().RZ(PI / 2 - 0.25).RY(0.4); Props.hammer(hm); hm.pop();
  const herb = new Mesh(256);
  herb.mat(MAT.PLAIN, [0.3, 0.5, 0.28]); herb.tube([[0, 0, 0], [0.02, 0.12, 0.01], [0, 0.22, 0]], 0.012, 5);
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4; herb.quad2([Math.cos(a) * 0.16, 0.07, Math.sin(a) * 0.16], [Math.cos(a + 0.5) * 0.05, 0.02, Math.sin(a + 0.5) * 0.05], [0, 0.03, 0], [Math.cos(a - 0.5) * 0.05, 0.02, Math.sin(a - 0.5) * 0.05]); }
  herb.mat(MAT.PLAIN, [0.72, 0.88, 1.0]); herb.lathe([[0.008, 0.2], [0.07, 0.235], [0.075, 0.25], [0.0, 0.29]], 7, 0); herb.mat(MAT.PLAIN, [0.9, 0.95, 1.0]); herb.lathe([[0.075, 0.25], [0.008, 0.2]], 7, 0);
  const hmItem = World.skinPack.add(hm), herbItem = World.skinPack.add(herb);
  const pick = (id, item, p, label, itemId, glow) => { const obj = addSkinned(item, { c: p, r: 0.6, zone: 0, kind: 'pickup' }); R.boneData.set(m4.translate(m4.create(), p[0], p[1], p[2]), obj.slot * 256); const it = { kind: 'pickup', id, item: itemId, p: [p[0], p[1] + 0.2, p[2]], r: 1.9, zone: 0, obj, label }; World.interact.push(it); World.pickups.push(it); if (glow) { it.em = { type: 'herb', p, zone: 0 }; World.emitters.push(it.em); } };
  pick('hammer', hmItem, World.pickupSpot.hammer, 'Take the hammer', 'hammer');
  [[-3.5, 93.5], [-57, -47], [45, -57], [5.5, -91], [84, -42], [-46, 63], [12, -98], [-30, 40]].forEach((p, i) => pick('frostcap' + i, herbItem, [p[0], World.groundY(p[0], p[1]), p[1]], 'Pick frostcap', 'frostcap', true));
}

// place every villager where the clock says they should be
function npcSnapAll() { for (const n of NPCS) { const row = npcRow(n), sp = Array.isArray(row[1]) ? row[1][0] : row[1]; npcArrive(n, sp, row[2]); n.goal = sp; } }
function npcRow(n) {
  const sc = n.override || n.def.sched; let h = Env.hour; if (h < sc[0][0]) h += 24;
  let row = sc[sc.length - 1]; for (const r of sc) if (r[0] <= h) row = r;
  return row;
}
function npcArrive(n, spotName, anim) {
  const sp = World.spots[spotName]; if (!sp) { console.warn('missing spot', spotName); return; }
  n.pos = sp.p.slice(); n.yaw = sp.yaw; n.at = spotName; n.path = null; n.spot = sp;
  n.anim = sp.lie ? 'lie' : sp.sit ? 'sit' : (anim === 'sit' || anim === 'lie') ? 'idle' : anim;
}
function npcUpdate(dt, playerPos) {
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
        if (d < 0.18) { n.pi++; if (n.pi >= n.path.length) { npcArrive(n, n.goal, n.rowAnim); n.dwell = Array.isArray(row[1]) ? 3 + Math.random() * 7 : 0; } }
        else if (!blocked) {
          const st = Math.min(d, sp * dt); n.pos[0] += dx / d * st; n.pos[2] += dz / d * st;
          const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 0.6); n.pos[1] += clamp(gy - n.pos[1], -3 * dt, 3 * dt); if (Math.abs(gy - n.pos[1]) > 1.2) n.pos[1] = gy;
          n.yaw += angDiff(Math.atan2(dx, -dz), n.yaw) * Math.min(1, dt * 8);
          n.anim = run ? 'run' : 'walk'; n.t += dt * (run ? 7.5 : 5.2) * (1 / n.scale) - dt;
        } else n.anim = 'idle';
      }
    }
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
