// Walks from the square to every place in the wilds by scripted keyboard input (no teleport between places), takes every pickup, reads the notes,
// tries the mine door and the strongbox, and runs both quests. Throws (so the harness shows it) if the player gets stuck or falls through the ground.
// usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/wilds.js)"
const dt = 1 / 30, fails = [], log = [];
const fix = () => { const r = RPG.st(); r.sta = 100; r.hp = 100; RPG.dead = false; };
const opt = i => { const b = document.getElementById('dopts').children[i || 0]; if (b) b.click(); };
const talk = (id, ...picks) => { const n = NPC[id]; Player.pos = [n.pos[0] + 1, n.pos[1], n.pos[2]]; startTalk(n); for (const p of picks) opt(p); let g = 0; while (UI.talk && g++ < 6) { const kids = document.getElementById('dopts').children; kids[kids.length - 1].click(); } };
const P = Player;
let frames = 0;
function stand(x, z, yaw) { __game.tp(x, z, (yaw || 0) * 180 / Math.PI, 0, World.groundY(x, z) + 0.05); Input.keys = {}; Input.joy = null; P.vel = [0, 0, 0]; P.camY = P.pos[1]; fix(); __game.step(3, dt); }
// walk to (x, z) within tol metres; fails if no progress for 3 s of game time, or if the player ends up below the ground
function goto(x, z, tol, tag) {
  let still = 0, last = [P.pos[0], P.pos[2]], n = 0, detour = 0, dt0 = 0, tries = 0;
  while (n++ < 4000) {
    const dx = x - P.pos[0], dz = z - P.pos[2], d = Math.hypot(dx, dz); if (d < tol) { Input.keys = {}; return true; }
    P.yaw = Math.atan2(dx, -dz) + (detour > 0 ? dt0 : 0); if (detour > 0) detour--;
    Input.keys = { KeyW: true, ShiftLeft: d > 4 }; fix(); __game.step(1, dt); frames++;
    const gy = World.groundY(P.pos[0], P.pos[2]); if (P.pos[1] < gy - 1.2 && !World.waterAt(P.pos[0], P.pos[2])) { fails.push(tag + ': fell through at ' + P.pos.map(v => +v.toFixed(1)).join(',')); Input.keys = {}; return false; }
    if (n % 30 === 0) { const m = Math.hypot(P.pos[0] - last[0], P.pos[2] - last[1]); still = m < 0.4 ? still + 1 : 0; last = [P.pos[0], P.pos[2]];
      if (still >= 2) { if (++tries > 6) { fails.push(tag + ': stuck at ' + P.pos.map(v => +v.toFixed(1)).join(',') + ' heading for ' + x.toFixed(1) + ',' + z.toFixed(1)); Input.keys = {}; return false; } detour = 45; dt0 = (tries % 2 ? 1 : -1) * (0.9 + 0.3 * tries); still = 0; } }
  }
  fails.push(tag + ': never arrived (' + Math.hypot(x - P.pos[0], z - P.pos[2]).toFixed(1) + ' m short)'); Input.keys = {}; return false;
}
// a route over the nav graph (roads and paths), then the last stretch straight
function route(x, z, tag, tol) {
  const N = Nav.nodes, near = (a, b) => { let bi = 0, bd = 1e9; for (let i = 0; i < N.length; i++) { const d = Math.hypot(N[i][0] - a, N[i][2] - b); if (d < bd) { bd = d; bi = i; } } return bi; };
  const a = near(P.pos[0], P.pos[2]), b = near(x, z), pth = navPath(a, b) || [];
  for (const i of pth) { const q = Array.isArray(i) ? i : N[i]; if (!goto(q[0], q[2], 1.6, tag)) return false; }
  return goto(x, z, tol || 1.2, tag);
}
const interactAt = it => { const q = it.p; if (!route(q[0], q[2], 'to ' + (it.id || it.kind))) { return false; } return true; };
const use = it => { const l = interactLabel(it); if (!l) { fails.push('no label for ' + it.id); return; } if (hyp(P.pos[0] - it.p[0], P.pos[2] - it.p[2]) > it.r + 0.8) fails.push(it.id + ': out of reach'); interactUse(it); if (UI.reader) { log.push('read ' + (it.id || '')); closeReader(); } };
const stuckCheck = () => { if (fails.length) throw new Error(fails.join(' | ')); };

stand(SQUARE.x, SQUARE.z + 4, 0);
const gate0 = World.interact.filter(i => i.wild || /^(sign|note|stone|board|mine|hermit|toll)/.test(i.id || ''));
const order = ['shrine', 'lumber', 'burnt', 'mine', 'hermit', 'stones', 'battle', 'bee', 'hamlet', 'fishing', 'toll', 'blind'];
const reached = {};
for (const id of order) {
  const p = WILDS.P[id]; if (!p) { fails.push('no place ' + id); continue; }
  if (!route(p.x, p.z, 'to ' + id, Math.max(3.5, p.r * 0.5))) { stuckCheck(); }
  reached[id] = true;
  const mine = World.interact.filter(i => hyp(i.p[0] - p.x, i.p[2] - p.z) < p.r + 8 && (i.wild || i.kind === 'read' || i.kind === 'wbox' || i.id === 'mine.door' || i.id === 'toll.box'));
  for (const it of mine) {
    if (it.kind === 'pickup' && it.gone) continue;
    if (!route(it.p[0], it.p[2], id + ' ' + (it.id || it.kind), Math.max(0.9, it.r - 0.7))) { stuckCheck(); }
    if (it.kind === 'wbox' && !has(it.need)) { log.push('box locked without key: ' + interactLabel(it)); }
    use(it);
    if (it.kind === 'wbox') log.push('box ' + (S.opened[it.id] ? 'open' : 'closed'));
  }
}
stuckCheck();
// quests
qStart('herbs'); qDone('herbs'); S.q.welcome = S.q.welcome || { stage: 1, done: false, t: 0 };
talk('maren', 0); log.push('tea ' + qAt('tea'));
talk('maren', 0); log.push('tea after hand-in ' + qAt('tea') + ' bogbean ' + (S.items.bogbean || 0));
talk('rowan', 0, 0); log.push('brother ' + qAt('brother') + ' cap ' + has('corwincap'));
talk('rowan', 0); log.push('brother after hand-in ' + qAt('brother'));
const missing = World.pickups.filter(p => p.wild && !p.gone).map(p => p.id);
if (missing.length) fails.push('pickups not taken: ' + missing.join(','));
const wildN = World.pickups.filter(p => p.wild).length;
const out = { places: Object.keys(reached).length, pickups: wildN, frames, tea: qAt('tea'), brother: qAt('brother'), fails };
if (qAt('tea') !== 99 || qAt('brother') !== 99) fails.push('quests not finished: ' + JSON.stringify(out));
if (fails.length) throw new Error(fails.join(' | '));
return 'PASS ' + JSON.stringify(out) + ' ' + log.join('; ');
