// Walks every staircase in the village (World.stairs) up and down at several angles and speeds and fails loudly (throws) if the player gets stuck,
// falls through, jumps in height, is pushed off the stair or puts a head through a slab. Also walks every door in and out.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/stairs.js)"
// optional: window.__stairsOnly = 'inn.stairs' (one stair), window.__quick = true (fewer variants)
const dt = window.__dt || 1 / 30, fails = [], rows = [], PI2 = Math.PI * 2;
const only = window.__stairsOnly, quick = !!window.__quick;
const sp = n => World.spots[n];
const fix = () => { const r = RPG.st(); r.sta = 100; r.hp = 100; RPG.dead = false; };
function put(x, y, z, yaw) { __game.tp(x, z, yaw * 180 / Math.PI, 0, y); Input.keys = {}; Input.joy = null; Player.vel = [0, 0, 0]; Player.camY = Player.pos[1]; fix(); __game.step(2, dt); Player.pos[1] = y; }
const free = (x, y, z) => { const p = [x, y, z]; return !colResolve(p, Player.r + 0.02, y, y + 1.75) && World.groundAt(x, z, y + 0.6) > y - 0.3 && World.groundAt(x, z, y + 0.6) < y + 0.3; };
// the player's inputs for one frame: head for the target (x, z); style picks how
function steer(style, tx, tz, yawOff, mag) {
  const P = Player, dx = tx - P.pos[0], dz = tz - P.pos[2], l = Math.hypot(dx, dz) || 1, head = Math.atan2(dx, -dz);
  Input.keys = {}; Input.joy = null;
  if (style === 'stick') {      // phone: yaw stays put (turned off the line by yawOff), the stick supplies the rest
    P.yaw = P.yaw0 === undefined ? head + yawOff : P.yaw0; const fx = Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = Math.sin(P.yaw), f = (dx * fx + dz * fz) / l, r = (dx * rx + dz * rz) / l;
    Input.joy = { x: r * mag, y: -f * mag };
  } else {
    P.yaw = head + (style === 'diag' ? yawOff : 0); Input.keys.KeyW = true;
    if (style === 'diag') Input.keys[yawOff > 0 ? 'KeyA' : 'KeyD'] = true;
    if (mag > 1) Input.keys.ShiftLeft = true;
  }
}
// one walk: from (sx, sy, sz) via the entrance way point to the goal spot
function walk(st, up, start, v) {
  const a = sp(up ? st.bottom : st.top), b = sp(up ? st.top : st.bottom), lo = Math.min(a.p[1], b.p[1]), hi = Math.max(a.p[1], b.p[1]);
  put(start[0], start[1], start[2], 0); Player.yaw0 = undefined;
  const tag = st.id + (up ? ' up ' : ' down ') + v.name + ' from ' + start.map(q => +q.toFixed(1)).join(',');
  const trace = []; let phase = 0, prevY = Player.pos[1], prevG = true, win = [], f = 0, pauseT = 0, maxLat = 0, maxDy = 0, jumpT = 0, ok = false, stopped = false;
  const axis = [b.p[0] - a.p[0], b.p[2] - a.p[2]], al = Math.hypot(...axis), ux = axis[0] / al, uz = axis[1] / al;
  for (; f < 480; f++) {
    const P = Player;
    if (phase === 0 && Math.hypot(P.pos[0] - a.p[0], P.pos[2] - a.p[2]) < 0.45) { phase = 1; win = []; }
    const goal = phase === 0 ? a.p : b.p;
    const prog = phase === 0 ? 0 : 1 - Math.hypot(P.pos[0] - b.p[0], P.pos[2] - b.p[2]) / al;
    // stop halfway for a moment
    if (v.pause && phase === 1 && prog > 0.45 && !stopped) { Input.keys = {}; Input.joy = null; pauseT++; if (pauseT > 20) stopped = true; __game.step(1, dt); win = []; continue; }
    steer(v.style, goal[0], goal[2], v.yawOff || 0, v.mag || 1); if (f % 6 === 0) trace.push(f + ':' + P.pos.map(q => +q.toFixed(2)).join(',') + ' v' + P.speed.toFixed(1) + ' ph' + phase);
    if (v.jump && ++jumpT % 14 === 0) RPG.jumpBuf = 0.15;
    fix(); __game.step(1, dt);
    const dy = P.pos[1] - prevY, g = P.onGround;
    if (g && prevG && Math.abs(dy) > 0.42) fails.push(tag + ' frame ' + f + ': height jump ' + dy.toFixed(2) + ' at ' + P.pos.map(q => +q.toFixed(2)).join(','));
    maxDy = Math.max(maxDy, Math.abs(dy)); prevY = P.pos[1]; prevG = g;
    if (P.pos[1] < lo - 0.35 && !(v.jump)) fails.push(tag + ' frame ' + f + ': fell through (y ' + P.pos[1].toFixed(2) + ' < ' + (lo - 0.35).toFixed(2) + ')');
    if (P.pos[1] < lo - 0.35) { fails.push(tag + ': fell through'); break; }
    // on the stair: stay between its sides
    const px = P.pos[0] - a.p[0], pz = P.pos[2] - a.p[2], along = px * ux + pz * uz, lat = Math.abs(-px * uz + pz * ux);
    if (along > 0.4 && along < al - 0.5 && P.pos[1] > lo + 0.5 && P.pos[1] < hi - 0.3) { maxLat = Math.max(maxLat, lat); if (lat > st.width / 2 + 0.15) fails.push(tag + ' frame ' + f + ': off the stair sideways (' + lat.toFixed(2) + ' m from the axis)'); }
    // a head in a slab
    for (const fl of World.floors) { const y = floorHeight(fl, P.pos[0], P.pos[2]); if (y === null) continue; const u = y - 0.12; if (P.pos[1] + 1.5 < u && P.pos[1] + PLAYER_HEAD > u + 0.04) { fails.push(tag + ' frame ' + f + ': head in a floor at y ' + y.toFixed(2) + ' (feet ' + P.pos[1].toFixed(2) + ')'); break; } }
    // stuck: no progress to the goal over 1.2 s while pushing
    const dgoal = Math.hypot(P.pos[0] - goal[0], P.pos[2] - goal[2]) + Math.abs(P.pos[1] - (phase ? b.p[1] : a.p[1])) * 0.5;
    win.push(dgoal); if (win.length > 36) { if (win[0] - dgoal < 0.2 && !(v.jump && win[0] - dgoal > -0.5)) { fails.push(tag + ' frame ' + f + ': stuck at ' + P.pos.map(q => +q.toFixed(2)).join(',') + ' (phase ' + phase + ')'); break; } win.shift(); }
    if (phase === 1 && Math.hypot(P.pos[0] - b.p[0], P.pos[2] - b.p[2]) < 0.6 && Math.abs(P.pos[1] - b.p[1]) < 0.5) { ok = true; break; }
  }
  if (!ok && window.__trace) fails.push('TRACE ' + tag + ' ' + trace.join(' | '));
  if (!ok && !fails.some(s => s.startsWith(tag))) fails.push(tag + ': never arrived (ended at ' + Player.pos.map(q => +q.toFixed(2)).join(',') + ', ' + f + ' frames)');
  Input.keys = {}; Input.joy = null;
  rows.push({ t: tag, f, maxDy: +maxDy.toFixed(2), maxLat: +maxLat.toFixed(2), ok });
}
// across the flank: walk at the side of the stair, from the floor beside it and from the floor above beside the stairwell. The player must be turned away
// (a side wall or rail), never walk in under the steps or fall in.
function flank(st, ux, uz, lo, hi, a, al, side, alongD, level) {
  const nx = -uz * side, nz = ux * side, y = level ? hi : lo, hw = st.width / 2;
  const sx = a.p[0] + ux * alongD + nx * (hw + 1.4), sz = a.p[2] + uz * alongD + nz * (hw + 1.4);
  if (!free(sx, y, sz)) return;
  if (level && st.exitPt && Math.hypot(a.p[0] + ux * alongD - st.exitPt[0], a.p[2] + uz * alongD - st.exitPt[2]) < 1.3) return;       // the open side of the top landing: stepping off the stair there is how one gets on and off
  put(sx, y, sz, 0); const tag = st.id + ' flank ' + (level ? 'high' : 'low') + ' side ' + side + ' at ' + alongD.toFixed(1) + ' m', tx = a.p[0] + ux * alongD, tz = a.p[2] + uz * alongD; let bad = null, f = 0;
  for (; f < 90 && !bad; f++) {
    const P = Player; steer('keys', tx, tz, 0, 1); fix(); __game.step(1, dt);
    const px = P.pos[0] - a.p[0], pz = P.pos[2] - a.p[2], along = px * ux + pz * uz, lat = Math.abs(-px * uz + pz * ux);
    if (lat < hw - 0.15 && along > 0.8 && along < al - 0.9) bad = 'got into the stair from the side (lateral ' + lat.toFixed(2) + ', y ' + P.pos[1].toFixed(2) + ')';
    else if (P.pos[1] < (level ? hi : lo) - 0.5) bad = 'fell (y ' + P.pos[1].toFixed(2) + ')';
  }
  Input.keys = {}; if (bad) fails.push(tag + ': ' + bad); rows.push({ t: tag, f, ok: !bad });
}
// all the ways of walking one way along one stair
const VARIANTS = [
  { name: 'walk', style: 'keys', mag: 1 }, { name: 'sprint', style: 'keys', mag: 2 }, { name: 'diag-left', style: 'diag', yawOff: 0.75, mag: 1 }, { name: 'diag-right-sprint', style: 'diag', yawOff: -0.75, mag: 2 },
  { name: 'stick-half', style: 'stick', yawOff: 0.5, mag: 0.55 }, { name: 'stick-full', style: 'stick', yawOff: -0.6, mag: 1 }, { name: 'jumping', style: 'keys', mag: 1, jump: true }, { name: 'pause', style: 'keys', mag: 1, pause: true },
];
for (const st of World.stairs) {
  if (only && st.id !== only) continue;
  const a = sp(st.bottom), b = sp(st.top); if (!a || !b) { fails.push(st.id + ': spots missing'); continue; }
  const ax = b.p[0] - a.p[0], az = b.p[2] - a.p[2], al = Math.hypot(ax, az), ux = ax / al, uz = az / al, nx = -uz, nz = ux;
  // start points round an end of the stair: eight directions at 1.6 m and 2.4 m, kept when the spot is free and the way from there to the spot is too
  const around = s => { const out = []; for (const r of [1.0, 1.6, 2.4]) for (let k = 0; k < 12; k++) { const an = ux !== undefined ? Math.atan2(uz, ux) + k * Math.PI / 6 : 0, p = [s.p[0] + Math.cos(an) * r, s.p[1], s.p[2] + Math.sin(an) * r]; let ok = free(p[0], p[1], p[2]); for (let q = 1; q < 8 && ok; q++) ok = free(lerp(p[0], s.p[0], q / 8), s.p[1], lerp(p[2], s.p[2], q / 8)); if (ok) out.push(p); } return out; };
  const lows = around(a), highs = around(b);
  if (lows.length < 1 || highs.length < 1) fails.push(st.id + ': too few free start points (' + lows.length + ' below, ' + highs.length + ' above)');
  const vs = quick ? VARIANTS.filter((v, i) => i % 2 === 0) : VARIANTS;
  vs.forEach((v, i) => {
    const lo = lows.length ? lows[(i * 3) % lows.length] : null, hi = highs.length ? highs[(i * 3 + 1) % highs.length] : null;
    if (lo) walk(st, true, lo, v); if (hi) walk(st, false, hi, v);
  });
  for (const side of [-1, 1]) for (const d of [1.8, 2.8, 3.8, 4.6]) for (const level of [0, 1]) if (d < al - 1.0) flank(st, ux, uz, a.p[1], b.p[1], a, al, side, d, level);
  // and straight from the spots themselves, both ways, once more
  walk(st, true, [a.p[0], a.p[1], a.p[2]], VARIANTS[0]); walk(st, false, [b.p[0], b.p[1], b.p[2]], VARIANTS[0]);
}
// every door, in and out
for (const id in World.houses) {
  const h = World.houses[id], d = h.door; if (!d) continue;
  for (const going of [1, 0]) {
    const A = going ? d.out : d.ins, Bp = going ? d.ins : d.out, ya = World.groundAt(A[0], A[2], 1e9) , yb = World.groundAt(Bp[0], Bp[2], A[1] + 1);
    const k = going ? 1.0 : 0.4, far = [A[0] + (A[0] - Bp[0]) * k, 0, A[2] + (A[2] - Bp[2]) * k];
    far[1] = World.groundAt(far[0], far[2], (going ? Terrain.y(far[0], far[2]) : h.floorY) + 0.8);
    put(far[0], far[1], far[2], 0); let ok = false, f = 0;
    for (; f < 240; f++) { World.doors.forEach(q => { if (q.zone === h.zone) q.open = Math.max(q.open, 1); }); steer('keys', Bp[0] + (Bp[0] - A[0]) * 0.8, Bp[2] + (Bp[2] - A[2]) * 0.8, 0, 1); fix(); __game.step(1, dt); if (Math.hypot(Player.pos[0] - Bp[0], Player.pos[2] - Bp[2]) < 0.5) { ok = true; break; } }
    if (!ok) fails.push('door ' + id + (going ? ' in' : ' out') + ': stuck at ' + Player.pos.map(q => +q.toFixed(2)).join(','));
    rows.push({ t: 'door ' + id + (going ? ' in' : ' out'), f, ok });
  }
}
Input.keys = {}; Input.joy = null;
const summary = { stairs: World.stairs.map(s => s.id), runs: rows.length, ok: rows.filter(r => r.ok).length, maxDy: Math.max(...rows.map(r => r.maxDy || 0)), fails: fails.slice(0, 6).map(q => q.slice(0, 160)), nfails: fails.length };
if (fails.length && window.__trace) return { summary, fails };
if (fails.length) throw new Error('STAIRS FAIL ' + JSON.stringify(summary));
return 'stairs PASS ' + JSON.stringify(summary);
