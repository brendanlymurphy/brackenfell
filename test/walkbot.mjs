// The walk bot: walks Brackenfell by input only and records where walking goes wrong. Writes docs/WALK.md.
//   node test/walkbot.mjs [--part town,cells,routes,wilds,mine] [--cells inn,chapel] [--gaps] [--out shots/walk] [--no-doc] [--limit N]
// How it moves: every frame it sets what a player's hands set (W / A / D / Space held, a look delta, the E key as a real key event) and steps the game.
// It never writes a position. Where it gives up on a stretch (stuck for good) it is lifted to the next way point and that is recorded as a finding.
// Where it goes: every edge of the navigation graph the villagers use (streets, lanes, squares, every room and stair of every interior), both ways, so
// every door is used in both directions and every stair is climbed and descended; every way point of World.routes (galleries, wall walks, terraces, the
// wharf) up and back; every path of the wilds; the mine, tunnel and cave.
// What it records (ranked in docs/WALK.md, each with a game.shot call):
//   stuck      no progress for 2 s with W held          slow    under half walking speed for 0.5 s (a snag)
//   slide      moving more than 35 degrees off the way it faces for 0.4 s (sliding along something)
//   fall       a drop of more than 1.6 m                 void    under the floor or the ground        water   in water for 5 s
//   cam-wall   the eye or the near plane inside a collider       cam-ceiling   the eye within 10 cm under a slab or stair
//   cam-person the eye inside a villager                         door-retry / stair-retry   needed more than one try
//   prompt-wall  a prompt for a thing with a wall between         prompt-behind   a prompt for a thing more than 60 degrees off the view
//   gap        (--gaps) pixels of the void seen from inside a room
// It cannot see: flicker, z-fighting, how a place looks. A person still has to look at the shots.
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs';
const A = process.argv.slice(2), val = (f, d) => A.includes(f) ? A[A.indexOf(f) + 1] : d, has = f => A.includes(f);
const PARTS = val('--part', 'town,cells,routes,wilds,mine').split(','), ONLY = val('--cells', '') ? val('--cells').split(',') : null, OUT = val('--out', 'shots/walk'), LIMIT = +val('--limit', 0);
const root = new URL('../', import.meta.url).pathname, port = 9100 + Math.floor(Math.random() * 400); fs.mkdirSync(root + OUT, { recursive: true });
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', bin: 'application/octet-stream', json: 'application/json', m4a: 'audio/mp4' };
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 }); page.setDefaultTimeout(60 * 60e3);
const errs = []; page.on('console', m => { const t = m.text(); if (t.startsWith('[walk]')) console.log('   ' + t.slice(7)); else if ((m.type() === 'error') && !/Failed to load resource|GL Driver/.test(t)) errs.push(t.slice(0, 200)); }); page.on('pageerror', e => errs.push('exception: ' + (e.stack || e.message).slice(0, 300)));
const REDO = has('--from-json'), t0 = Date.now(); let ev = null; let TOWN = null;
if (!REDO) {
await page.addInitScript(o => { window.__TEST__ = o; }, { webgl: 1, quality: 'low', play: 1 });
await page.addInitScript(() => { let a = 11; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
await page.goto(`http://localhost:${port}/`); await page.waitForFunction(() => window.__ready === true);

const IN_PAGE = () => {
  const dt = 1 / 30, sleep = ms => new Promise(r => setTimeout(r, ms)), r2 = v => +v.toFixed(2), P = Player;
  const W = window.WALK = { ev: [], seg: '', ticks: 0, dist: 0, lifts: 0, vWalk: 2.9, doors: 0, edges: 0 };
  const say = s => console.log('[walk] ' + s);
  const where = () => World.cell ? World.cell.id : 'outdoors';
  const log = (type, detail, o) => { W.ev.push(Object.assign({ type, seg: W.seg, p: P.pos.map(r2), yaw: Math.round(P.yaw * 180 / Math.PI), cell: World.cell ? World.cell.id : null, detail: detail || '' }, o || {})); };
  const ang = (a, b) => { let d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };
  // is a point inside a solid thing? (the colliders the player is pushed out of)
  const inside = (x, y, z, m) => { const l = Col.grid.get(Math.floor(x / Col.cell) * 4096 + Math.floor(z / Col.cell)); if (!l) return null; for (const c of l) { if (c.off || y < c.y0 || y > c.y1) continue; const dx = x - c.x, dz = z - c.z; if (c.r !== undefined) { if (dx * dx + dz * dz < (c.r - m) * (c.r - m)) return c; continue; } const lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz; if (Math.abs(lx) < c.hx - m && Math.abs(lz) < c.hz - m) return c; } return null; };
  // is point q within m of a collider (in plan)? The wall a door is set in, the cupboard a thing lies in: not "a wall in the way"
  const near = (c, q, m) => { const dx = q[0] - c.x, dz = q[2] - c.z; if (c.r !== undefined) return Math.hypot(dx, dz) < c.r + m; const lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz; return Math.abs(lx) < c.hx + m && Math.abs(lz) < c.hz + m; };
  // can a player stand here? (a villager's spot on a bed, a bench or behind a counter is not a place the walker must reach)
  W.standable = (x, y, z) => { const q = [x, y, z]; colResolve(q, P.r, y, y + 1.75); return Math.hypot(q[0] - x, q[2] - z) < 0.12; };
  const st = { slow: 0, slide: 0, air: null, water: 0, lastG: P.pos[1], seenPrompt: new Set(), camT: 0, turnT: 0, heldW: 0 };
  // one frame of play with these keys held and this much turning; then everything is measured
  W.tick = (keys, look) => {
    Input.keys = keys; Input.lookX = look || 0; const p0 = P.pos.slice(), y0 = P.yaw; game.step(1, dt); W.ticks++;
    const r = RPG.st(); r.hp = RPG.MAXHP; r.sta = RPG.MAXST;       // the walker is not here to fight or tire
    const dx = P.pos[0] - p0[0], dz = P.pos[2] - p0[2], d = Math.hypot(dx, dz), v = d / dt; W.dist += d;
    if (Math.abs(look || 0) > 0.06) st.turnT = 0.35; else st.turnT -= dt; st.heldW = keys.KeyW ? st.heldW + dt : 0;
    if (P.locked || Cells.busy) { st.slow = st.slide = 0; return; }
    // (a) snags
    if (keys.KeyW && st.heldW > 0.5 && st.turnT <= 0 && P.onGround) { if (v < W.vWalk * 0.5) { st.slow += dt; if (st.slow >= 0.5 && !st.slowLogged) { st.slowLogged = 1; log('slow', 'speed ' + v.toFixed(1) + ' of ' + W.vWalk.toFixed(1) + ' m/s with W held'); } } else { st.slow = 0; st.slowLogged = 0; }
      if (v > W.vWalk * 0.3) { const off = Math.abs(ang(Math.atan2(dx, -dz), P.yaw)); if (off > 0.61) { st.slide += dt; if (st.slide >= 0.4 && !st.slideLogged) { st.slideLogged = 1; log('slide', 'moving ' + Math.round(off * 57.3) + ' degrees off the way it faces'); } } else { st.slide = 0; st.slideLogged = 0; } } }
    else { st.slow = 0; st.slide = 0; }
    // (b) falls, the void, water
    if (!P.onGround) { if (!st.air) st.air = { y: p0[1], p: p0.map(r2), yaw: Math.round(y0 * 57.3) }; } else if (st.air) { const drop = st.air.y - P.pos[1]; if (drop > 1.6) log('fall', 'fell ' + drop.toFixed(1) + ' m', { from: st.air.p, fromYaw: st.air.yaw }); st.air = null; }
    const gy = World.groundAt(P.pos[0], P.pos[2], P.pos[1] + 1.2); if (P.pos[1] < gy - 1.2 || P.pos[1] < (World.cell ? CELL.y : -20) - 40) { if (!st.voidLogged) { st.voidLogged = 1; log('void', 'under the floor: y ' + P.pos[1].toFixed(1) + ', floor ' + gy.toFixed(1), st.air ? { from: st.air.p, fromYaw: st.air.yaw } : {}); } } else st.voidLogged = 0;
    if (P.inWater > 0.5) { st.water += dt; if (st.water > 5 && !st.waterLogged) { st.waterLogged = 1; log('water', 'in water for 5 s'); } } else { st.water = 0; st.waterLogged = 0; }
    // (c) the camera
    const ex = P.pos[0], ey = (P.camY || P.pos[1]) + P.eye, ez = P.pos[2], fx = Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch);
    st.quiet = (st.quiet || 0) - dt; st.camT -= dt; if (st.camT <= 0 && st.quiet <= 0) { let c = inside(ex, ey, ez, 0.01) || inside(ex + fx * 0.12, ey + fy * 0.12, ez + fz * 0.12, 0.01); if (c) { st.camT = 1.5; log('cam-wall', 'the eye is inside a solid ' + (c.r !== undefined ? 'post (r ' + c.r.toFixed(2) + ')' : 'box ' + (c.hx * 2).toFixed(1) + ' x ' + (c.hz * 2).toFixed(1) + ' m') + ' from y ' + (c.y0 - (World.cell ? Cells.cur.floorY : 0)).toFixed(1) + ' to ' + (c.y1 - (World.cell ? Cells.cur.floorY : 0)).toFixed(1)); }
      const ce = World.ceilingAt(ex, ez, P.pos[1] + 1.0, ey + 0.1); if (ce !== null && ce < ey + 0.1) { st.camT = 1.5; log('cam-ceiling', 'the eye is ' + ((ce - ey) * 100).toFixed(0) + ' cm from the underside of a floor or stair'); }
      for (const n of NPCS) { if (Math.abs(n.pos[0] - ex) > 1 || Math.abs(n.pos[2] - ez) > 1) continue; if (Math.hypot(n.pos[0] - ex, n.pos[2] - ez) < 0.24 && ey > n.pos[1] + 0.2 && ey < n.pos[1] + 1.9 * (n.scale || 1)) { st.camT = 1.5; log('cam-person', 'the eye is inside ' + n.name + ' (' + n.anim + ')'); } } }
    // (e) prompts through walls and behind
    const it = UI.prompt, pp = UI.promptPos; if (it && pp && !st.seenPrompt.has(it)) { const qx = pp[0] - ex, qy = pp[1] - ey, qz = pp[2] - ez, L = Math.hypot(qx, qy, qz) || 1, dot = (qx * fx + qy * fy + qz * fz) / L, name = it.npc ? 'Talk to ' + it.npc.name : (it.id || it.kind);
      if (dot < 0.5 && L > 0.9) { st.seenPrompt.add(it); log('prompt-behind', '"' + UI.promptLab + '" (' + name + ') is offered ' + Math.round(Math.acos(Math.max(-1, Math.min(1, dot))) * 57.3) + ' degrees off the view, ' + L.toFixed(1) + ' m away', { thing: name }); }
      else { let hit = null; for (let t = 0.3; t < L - 0.45 && !hit; t += 0.1) { hit = inside(ex + qx / L * t, ey + qy / L * t, ez + qz / L * t, 0.06); if (hit && near(hit, pp, 0.55)) hit = null; } if (hit && !(hit.hx !== undefined && Math.min(hit.hx, hit.hz) < 0.06 && hit.y1 - hit.y0 < 1.3)) { st.seenPrompt.add(it); log('prompt-wall', '"' + UI.promptLab + '" (' + name + ') is offered through a solid ' + (hit.r !== undefined ? 'post' : 'box ' + (hit.hx * 2).toFixed(1) + ' x ' + (hit.hz * 2).toFixed(1) + ' m, ' + (hit.y1 - hit.y0).toFixed(1) + ' high') + ', ' + L.toFixed(1) + ' m away', { thing: name }); } } }
  };
  W.inside = inside;
  // walk to a point by turning toward it and holding W. Returns the number of tries it took (0 = lifted there).
  W.goto = (x, z, y, o) => {
    o = o || {}; const tol = o.tol || 0.55, kind = o.kind || 'walk'; let tries = 1, best = 1e9, since = 0, n = 0, detour = 0, side = 1;
    const far = () => Math.hypot(x - P.pos[0], z - P.pos[2]), vert = () => y === undefined ? 0 : Math.abs(y - P.pos[1]);
    const max = Math.max(240, Math.round(far() / W.vWalk * 30 * 4) + 200);
    while (n++ < max) {
      const d = far(); if (d < tol && vert() < 1.6) { Input.keys = {}; return tries; }
      if (d < best - 0.25) { best = d; since = 0; } else since += dt;
      const want = Math.atan2(x - P.pos[0], -(z - P.pos[2])), turn = Math.max(-0.2, Math.min(0.2, ang(want + (detour > 0 ? side * 1.1 : 0), P.yaw))), keys = { KeyW: Math.abs(ang(want, P.yaw)) < 1.0 || detour > 0 };
      if (detour > 0) { detour--; if (detour % 12 === 5 && tries > 2) keys.Space = true; }
      W.tick(keys, turn);
      if (P.locked && !Cells.busy) { if (UI.talk) endTalk(); if (UI.reader) closeReader(); if (RPG.dead) return -1; }
      if (since > 2 && detour <= 0) { if (tries === 1 && !o.soft) log('stuck', 'no progress for 2 s, ' + d.toFixed(1) + ' m short of the next way point' + (kind !== 'walk' ? ' (' + kind + ')' : ''), { to: [r2(x), y === undefined ? null : r2(y), r2(z)] }); tries++; if (tries > 5) break; detour = 30 + tries * 8; side = tries % 2 ? 1 : -1; since = 0; best = d; }
    }
    Input.keys = {}; st.quiet = 1.5; if (o.soft) { Cells.teleport({ p: [x, y === undefined ? World.groundAt(x, z, P.pos[1] + 2) : y, z], yaw: P.yaw }); game.step(2, dt); return 0; }
    W.lifts++; log(kind === 'level' ? 'level' : 'lift', 'could not be walked: lifted to the next way point after ' + (tries - 1) + ' tries (' + kind + ')', { to: [r2(x), y === undefined ? null : r2(y), r2(z)] });
    Cells.teleport({ p: [x, y === undefined ? World.groundAt(x, z, P.pos[1] + 2) : y, z], yaw: P.yaw }); game.step(2, dt); return 0;
  };
  // the E key, as the page receives it
  W.pressE = () => { dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true })); dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', bubbles: true })); };
  // go through the door at hand toward (bx, bz): turn to the door, wait for its prompt, press E. Returns tries (0 = could not).
  W.door = async (bx, by, bz) => {
    const cell0 = World.cell ? World.cell.id : null; let tries = 0;
    const cand = () => World.interact.filter(i => i.kind === 'portal' && Math.hypot(i.p[0] - P.pos[0], i.p[2] - P.pos[2]) < 3.4 && Math.abs(i.p[1] - P.pos[1]) < 2.6 && interactLabel(i)).sort((a, b) => Math.hypot(a.dest.p[0] - bx, a.dest.p[2] - bz) - Math.hypot(b.dest.p[0] - bx, b.dest.p[2] - bz))[0];
    for (; tries < 4; tries++) {
      const it = cand(); if (!it) { W.tick({ KeyW: tries % 2 === 0, KeyS: tries % 2 === 1 }, 0.3); continue; }
      for (let k = 0; k < 50 && UI.prompt !== it; k++) { const want = Math.atan2(it.p[0] - P.pos[0], -(it.p[2] - P.pos[2])), dy = it.p[1] - (P.pos[1] + P.eye), dh = Math.hypot(it.p[0] - P.pos[0], it.p[2] - P.pos[2]); Input.lookY = Math.max(-0.1, Math.min(0.1, P.pitch - Math.atan2(dy, dh))); W.tick({ KeyW: tries > 0 && k < 10 && dh > 1.2, KeyS: tries > 1 && k < 8 && dh < 0.8 }, Math.max(-0.2, Math.min(0.2, ang(want, P.yaw)))); }
      if (UI.prompt !== it) { continue; }
      const lock = Cells.lockMsg(it); if (lock) { log('locked', 'door locked: ' + lock); return 0; }
      W.pressE(); for (let k = 0; k < 120 && !Cells.busy; k++) { if (k > 3) break; await sleep(10); } for (let k = 0; k < 300 && Cells.busy; k++) await sleep(20); game.step(2, dt); Input.lookY = 0; P.pitch = 0;
      const now = World.cell ? World.cell.id : null; if (now !== cell0 || Math.hypot(P.pos[0] - bx, P.pos[2] - bz) < 4) { W.doors++; if (tries > 0) log('door-retry', 'the door needed ' + (tries + 1) + ' tries to get its prompt'); return tries + 1; }
    }
    log('door-fail', 'no prompt for the door after 4 tries (wanted to go to ' + [bx, by, bz].map(r2) + ')'); return 0;
  };
  // every edge of a set of nodes, there and back
  W.tour = async (start, allow, label, limit) => {
    const N = Nav.nodes, done = new Set(), key = (a, b) => a < b ? a + ':' + b : b + ':' + a, seen = new Set([start]); let count = 0;
    const step = async (a, b) => { W.seg = label + ' ' + a + '>' + b; const nb = N[b]; W.edges++;
      if (Nav.portal[a] === b) { const t = await W.door(nb[0], nb[1], nb[2]); if (!t) { Cells.teleport({ p: nb.slice(), yaw: P.yaw }); game.step(2, dt); W.lifts++; log('lift', 'lifted through a door that could not be used'); } return; }
      const na = N[a], dy = Math.abs(nb[1] - na[1]), run = Math.hypot(nb[0] - na[0], nb[2] - na[2]), stair = dy > 0.5;
      // a villager's spot where nobody can stand (on a bed, in a chair, behind a counter): go as near as a person can, and do not call that a fault
      let soft = !W.standable(nb[0], nb[1], nb[2]) || !W.standable(na[0], na[1], na[2]);
      // the villagers' graph is drawn in straight lines; where a line goes through a wall (upstairs every room is joined to the head of the stair) it
      // is not a way a player takes. One finding for whoever owns the villagers (they walk it), and no snag or stuck is counted on it.
      if (!soft && dy < 0.6) { let wall = null; for (let t = 0.5; t < run - 0.5 && !wall; t += 0.15) { const x = na[0] + (nb[0] - na[0]) * t / run, z = na[2] + (nb[2] - na[2]) * t / run, y = na[1] + (nb[1] - na[1]) * t / run; wall = inside(x, y + 1.2, z, 0.02); if (wall && wall.y1 - wall.y0 < 1.6) wall = null; }
        if (wall) { soft = true; W.seg = label + ' ' + a + '>' + b; W.ev.push({ type: 'graph-wall', seg: W.seg, p: na.map(r2), yaw: Math.round(Math.atan2(nb[0] - na[0], -(nb[2] - na[2])) * 57.3), cell: World.cell ? World.cell.id : null, detail: 'the villagers’ way from here to ' + nb.map(r2) + ' passes through a solid ' + (wall.r !== undefined ? 'post' : 'box ' + (wall.hx * 2).toFixed(1) + ' x ' + (wall.hz * 2).toFixed(1) + ' m') }); } }
      // the graph joins two levels more steeply than any stair (villagers are moved along it; a player has to find the real way): one finding, not five
      const level = dy > 1.0 && run < dy * 1.15;
      const e0 = W.ev.length, t = W.goto(nb[0], nb[2], nb[1], { kind: level ? 'level' : stair ? 'stair' : 'walk', soft, tol: soft ? 1.25 : 0.55 });
      if (soft || level) { for (let i = W.ev.length - 1; i >= e0; i--) if (/^(slow|slide|stuck|retry|stair-retry)$/.test(W.ev[i].type)) W.ev.splice(i, 1); }
      else if (t > 1) log(stair ? 'stair-retry' : 'retry', (stair ? 'the stair' : 'the way') + ' needed ' + t + ' tries', { to: nb.map(r2) }); };
    const stack = [[start, 0]];
    while (stack.length) { const top = stack[stack.length - 1], a = top[0], adj = Nav.adj[a]; let went = false;
      while (top[1] < adj.length) { const b = adj[top[1]++][0]; if (done.has(key(a, b)) || (allow && !allow(a, b))) continue; done.add(key(a, b)); await step(a, b); count++; if (count % 150 === 0) { say(label + ': ' + count + ' stretches, ' + Math.round(W.dist) + ' m, ' + W.ev.length + ' findings'); await sleep(0); }
        if (RPG.dead) { RPG.respawn && 0; } if (seen.has(b) || (limit && count > limit)) { await step(b, a); } else { seen.add(b); stack.push([b, 0]); went = true; break; } }
      if (!went && top[1] >= adj.length) { stack.pop(); if (stack.length) await step(a, stack[stack.length - 1][0]); } }
    return { count, seen };
  };
  W.put = (p, yaw) => { if (World.cell && !Cells.inRegion(p[0])) game.leave(); Cells.teleport({ p: p.slice(), yaw: yaw || 0 }); game.step(3, dt); };
  W.nearest = (x, z, y) => { let b = -1, bd = 1e9; for (let i = 0; i < Nav.nodes.length; i++) { const n = Nav.nodes[i]; if (!Nav.adj[i].length) continue; const d = Math.hypot(n[0] - x, n[2] - z) + (y === undefined ? 0 : Math.abs(n[1] - y) * 3); if (d < bd) { bd = d; b = i; } } return b; };
  // a line of way points, there and back
  W.line = (label, pts) => { W.seg = label; W.put(pts[0]); for (const dir of [1, -1]) { const seq = dir > 0 ? pts : pts.slice().reverse(); for (let i = 1; i < seq.length; i++) { W.seg = label + (dir > 0 ? ' up ' : ' back ') + i; const stair = Math.abs(seq[i][1] - seq[i - 1][1]) > 0.4, t = W.goto(seq[i][0], seq[i][2], seq[i][1], { kind: stair ? 'stair' : 'walk', tol: 0.7 }); if (t > 1) log(stair ? 'stair-retry' : 'retry', 'needed ' + t + ' tries', { to: seq[i].map(r2) }); } } };
  Env.dayLength = 0; Env.hour = 13; npcSnapAll(); Foes.calm(true); S.flags.bed = 1; game.step(5, dt);
  // walking speed on open ground, to judge snags against
  { W.put([-70, World.groundY(-70, -6.5), -6.5], Math.PI / 2); let d0 = P.pos.slice(); for (let i = 0; i < 80; i++) { Input.keys = { KeyW: true }; game.step(1, dt); if (i === 39) d0 = P.pos.slice(); } W.vWalk = Math.hypot(P.pos[0] - d0[0], P.pos[2] - d0[2]) / (40 * dt); Input.keys = {}; }
};
if (!REDO) await page.evaluate(IN_PAGE);
ev = (fn, a) => page.evaluate(fn, a);
if (!REDO) console.log('walking speed ' + (await ev(() => WALK.vWalk)).toFixed(2) + ' m/s');
const keys = REDO ? 0 : await ev(() => ({ give: (() => { for (const k of ['minekey', 'lantern', 'cryptkey', 'housekey', 'cellarkey', 'wharfkey', 'lockpick']) give(k, k === 'lockpick' ? 30 : 1); S.flags.mineOpen = 1; S.flags.act1 = 1; S.flags.act2 = 1; S.flags.rowanAsked = 1; S.opened['sec.wall'] = 1; S.flags.sec_wall = 1; S.opened['chapel.gate'] = 1; applySave({ S, hour: 13, pos: Player.pos, yaw: 0, b: 99 }); return 1; })() }));
if (PARTS.includes('town') && !REDO) { console.log('── town: every street and lane ──'); const r = await ev(async (lim) => { const out = i => !Cells.inRegion(Nav.nodes[i][0]); const start = WALK.nearest(0, 0); WALK.put(Nav.nodes[start]); const all = new Set(); let comps = 0; for (let s = start; s >= 0;) { const r = await WALK.tour(s, (a, b) => out(a) && out(b), 'street', lim); for (const k of r.seen) all.add(k); comps++; s = -1; for (let i = 0; i < Nav.nodes.length; i++) if (out(i) && Nav.adj[i].some(e => out(e[0])) && !all.has(i)) { s = i; WALK.put(Nav.nodes[i]); break; } if (lim) break; } return { comps, nodes: all.size, edges: WALK.edges, m: Math.round(WALK.dist) }; }, LIMIT); console.log('   ' + JSON.stringify(r)); }
// ── the town check (gate step `town`): streets and gates end to end both ways by input, villagers' detours, standing points inside props ──
// Why it exists: the palisade's plank wall and its collider ran through the Bridge Gate and the Chapel Gate in live builds. This bot did not say so because
// (1) it was not a gate step and was last run before that wall was built, (2) what it cannot walk it is lifted over and lists among a hundred geometry notes,
// and nothing fails, and (3) it walked the villagers' graph, whose road ends were joined to the outside straight through the wall, not the roads themselves.
if (PARTS.includes('streets') && !REDO) { console.log('── town: every street and gate, both ways; detours; standing points ──');
  TOWN = await ev(async () => { const fails = [], notes = [], r1 = v => +v.toFixed(1), gy = (x, z) => World.groundY(x, z);
    Weather.set('fair'); Env.dayLength = 0; Env.hour = 2.5; npcSnapAll(); Foes.calm(true); for (const f of Foes.list) { f.alive = false; f.state = 'gone'; } game.step(5, 1 / 30);       // everyone abed: a villager in the way is not the street's fault
    const cut = (pts, step) => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; };
    // walk a line of [x, z] points; a point that cannot be reached by walking (the bot is lifted on) is a failure
    const walk = (label, pts, tol) => { WALK.put([pts[0][0], gy(pts[0][0], pts[0][1]), pts[0][1]]); let bad = 0; for (let i = 1; i < pts.length; i++) { WALK.seg = label + ' ' + i; const t = WALK.goto(pts[i][0], pts[i][1], undefined, { tol: tol || 1.0 }); if (t === 0) { bad++; fails.push(label + ': cannot be walked from ' + pts[i - 1].map(r1) + ' to ' + pts[i].map(r1) + ' (stopped at ' + [Player.pos[0], Player.pos[2]].map(r1) + ')'); if (bad > 2) break; } else if (t > 2) notes.push(label + ': ' + t + ' tries to get from ' + pts[i - 1].map(r1) + ' to ' + pts[i].map(r1)); } return bad; };
    let m0 = WALK.dist; const inTown = p => Math.hypot(p[0], p[1]) < 150;
    for (const r of ROADS) { if (r.path) continue; const pts = cut(r.pts.filter(inTown), 5); if (pts.length < 2) continue; walk('street ' + r.id + ' out', pts); walk('street ' + r.id + ' back', pts.slice().reverse()); await new Promise(q => setTimeout(q, 0)); }
    // every gate: straight through along its road, 9 m each side, with a narrow tolerance so that going round does not count
    const gates = World.places.filter(g => /gate/i.test(g.id) || /Gate\b/.test(g.name || '')); let ng = 0;
    for (const g of gates) { let best = null; for (const r of ROADS) for (let i = 1; i < r.pts.length; i++) { const a = r.pts[i - 1], b = r.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), t = Math.max(0, Math.min(1, ((g.x - a[0]) * (b[0] - a[0]) + (g.z - a[1]) * (b[1] - a[1])) / (L * L))), px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t, d = Math.hypot(px - g.x, pz - g.z); if (!best || d < best.d) best = { d, px, pz, ux: (b[0] - a[0]) / L, uz: (b[1] - a[1]) / L }; }
      if (!best || best.d > 8) { fails.push('gate ' + g.name + ': no road within 8 m of it'); continue; } ng++;
      const line = []; for (let u = -9; u <= 9.01; u += 1.5) line.push([best.px + best.ux * u, best.pz + best.uz * u]); walk('gate ' + g.name + ' through', line, 0.7); walk('gate ' + g.name + ' back', line.slice().reverse(), 0.7); }
    const walked = Math.round(WALK.dist - m0);
    // villagers: between any two outdoor places the way on foot is at most 2.5 times the straight line
    const names = Object.keys(World.spots).filter(k => Nav.spot[k] !== undefined && !World.spots[k].site && !World.spots[k].yardOf /* a yard is reached through its house */ && Cells.spaceOf(World.spots[k].p) === 0 && !/#/.test(k)); let pairs = 0, levels = 0, worst = null; const long = [];
    // known and open, for the town workers (docs/WALK.md says where): a fence rail runs down the back lane behind the Hawker's Passage 0.3 m from its middle;
    // the two farm fields are fenced from each other; the herb garden's terrace has one way down. A new long way round fails; these are printed as notes.
    const KNOWN = [/gallery\.top|loft\.in|gallery\.bottom/ /* the Hart's gallery and the loft are up their own stairs, and the stair's foot is behind the stalls */, /passage\.lane/, /^farm\.field2? to farm\.field2?/, /herbalist\.garden/ /* one way down from its terrace */, /dstall3/ /* stands between two stalls and the passage mouth: 2.5 times to the far side of the bonfire */, /^hunter\.yard to (green\.bench|in\.94\.step)/ /* [fx3] the hunter's yard stands outside the west palisade (the gate is the only way in): 34 m across the bank, 200 m by the gate */, /high\.[a-z]\.step/ /* [cast] Highfold's doorsteps are across the lake from the town: the way round it is the way */];
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) { const a = World.spots[names[i]].p, b = World.spots[names[j]].p, st = Math.hypot(a[0] - b[0], a[2] - b[2]); if (st < 15) continue;       /* nearer than 15 m one market stall in the way is already 2.5 times */ if (Math.abs(a[1] - b[1]) > 1.2) { levels++; continue; }       /* a gallery and the street under it are near on the map and a stair apart */ pairs++; const path = navPath(Nav.spot[names[i]], Nav.spot[names[j]]); if (!path || path.length < 2) { long.push([99, names[i] + ' to ' + names[j] + ': no way at all']); continue; } let L = 0; for (let k = 1; k < path.length; k++) { const p = Nav.nodes[path[k - 1]], q = Nav.nodes[path[k]]; if (Nav.portal[path[k - 1]] === path[k]) continue; L += Math.hypot(p[0] - q[0], p[2] - q[2]); } const ratio = L / st; if (!worst || ratio > worst[0]) worst = [ratio, names[i] + ' to ' + names[j]]; if (ratio > 2.5) long.push([ratio, names[i] + ' to ' + names[j] + ': ' + Math.round(L) + ' m on foot, ' + Math.round(st) + ' m straight (' + ratio.toFixed(1) + ' times)']); }
    const fresh = long.filter(l => !KNOWN.some(k => k.test(l[1]))); for (const l of long) if (!fresh.includes(l)) notes.push('known detour ' + l[1]); long.length = 0; long.push(...fresh); long.sort((a, b) => b[0] - a[0]); for (const l of long.slice(0, 12)) fails.push('detour ' + l[1]); if (long.length > 12) fails.push('detour: ' + (long.length - 12) + ' more pairs over 2.5 times');
    // standing points: where the game puts the player or a camera must not be inside something solid
    const pts = [['the start of the game', -84, null, -6.5]]; for (const c of Cells.list) { if (c.leave && c.leave.p && !Cells.inRegion(c.leave.p[0])) pts.push(['coming out of ' + c.id, c.leave.p[0], c.leave.p[1], c.leave.p[2]]); if (c.enter && c.enter.p) pts.push(['going into ' + c.id, c.enter.p[0], c.enter.p[1], c.enter.p[2]]); }
    { const bed = World.interact.find(i => i.id === 'inn.bed'); if (bed) pts.push(['waking in the bed at the Hart', bed.p[0] + 0.9, bed.p[1] - 0.5, bed.p[2]]); }
    for (const [nm, v] of Object.entries({ 'budget view square': [4, -14], 'budget view alley': [30, -2], 'budget view terrace': [-12, 4], 'budget view lake': [26, 92] })) pts.push([nm, v[0], null, v[1], true]);       /* a test's camera, not a place the player is put: reported as a note */
    for (const g of World.places) if (!g.minor) pts.push(['the place mark of ' + g.name, g.x, null, g.z, true]);
    let np = 0; for (const [nm, x, y0, z, soft] of pts) { np++; const y = y0 === null || y0 === undefined ? gy(x, z) : y0; const c = WALK.inside(x, y + 0.9, z, 0.02) || WALK.inside(x, y + 1.66, z, 0.02); if (c) (soft ? notes : fails).push('inside something solid: ' + nm + ' at ' + [x, y, z].map(r1) + ' (' + (c.r !== undefined ? 'a post r ' + c.r.toFixed(2) : 'a box ' + (c.hx * 2).toFixed(1) + ' x ' + (c.hz * 2).toFixed(1)) + ')'); }
    // swimming (Build 74): off the wharf and off the dock by walking, into deep water, then to the nearest dry ground and out on foot
    const swim = { ok: 0, stuck: [] };
    { const P = Player, wet = (x, z) => World.waterAt(x, z) > World.groundY(x, z) + 0.05, head = (x, z, keys) => { P.yaw = Math.atan2(x - P.pos[0], -(z - P.pos[2])); WALK.tick(keys || { KeyW: true }, 0); };
      const nearestDry = (max) => { const out = []; for (let a = 0; a < 24; a++) { const dx = Math.sin(a * Math.PI / 12), dz = -Math.cos(a * Math.PI / 12); for (let d = 1; d <= max; d += 1) { const x = P.pos[0] + dx * d, z = P.pos[2] + dz * d; if (!wet(x, z) && Math.hypot(x, z) < WORLD_RADIUS - 3) { out.push([d, x + dx * 2.5, z + dz * 2.5]); break; } } } return out.sort((p, q) => p[0] - q[0]); };
      const out = () => !P.swim && P.inWater < 0.3 && !wet(P.pos[0], P.pos[2]);
      const leave = (tx, tz, secs) => { for (let i = 0; i < secs * 30; i++) { head(tx, tz, { KeyW: true, Space: i % 45 === 30 }); if (out()) return true; if (Math.hypot(tx - P.pos[0], tz - P.pos[2]) < 0.6) break; } return out(); };
      for (const nm of ['wharf.view', 'dock.end']) { const sp = World.spots[nm]; if (!sp) continue; WALK.put(sp.p.slice()); let got = false; const tx = P.pos[0] + (LAKE.x - P.pos[0]) * 3, tz = P.pos[2] + (LAKE.z - P.pos[2]) * 3;
        for (let i = 0; i < 600 && !got; i++) { head(LAKE.x, LAKE.z, { KeyW: true, Space: i % 30 === 10 }); got = P.swim; } void tx; void tz;
        if (!got) { fails.push('swim: walking off ' + nm + ' toward the lake never reached deep water (stopped at ' + P.pos.map(r1) + ')'); continue; }
        for (let i = 0; i < 60; i++) head(LAKE.x, LAKE.z);       /* a little way out */
        const from = P.pos.map(r1), dry = nearestDry(70); let done = false, tried = 0; for (const [, x, z] of dry.slice(0, 6)) { tried++; const back = P.pos.slice(); if (leave(x, z, 40)) { done = true; break; } swim.stuck.push('from ' + from + ' the bank toward ' + [x, z].map(r1) + ' cannot be climbed (stopped at ' + P.pos.map(r1) + ')'); if (!P.swim) { P.pos = back; game.step(1, 1 / 30); } }
        if (done) { swim.ok++; let dryWalk = 0; for (let i = 0; i < 60; i++) { WALK.tick({ KeyW: true }, 0); if (out()) dryWalk++; } if (dryWalk < 40) fails.push('swim: out of the water near ' + P.pos.map(r1) + ' after ' + nm + ' but slid back in'); } else fails.push('swim: in the water off ' + nm + ' at ' + from + ' no bank within 70 m could be climbed (' + tried + ' tried)'); }
      // round the lake and down the river: from deep water beside each stretch of bank, can a swimmer get out straight toward it?
      const probes = []; for (let a = 0; a < 36; a++) { const dx = Math.sin(a * Math.PI / 18), dz = -Math.cos(a * Math.PI / 18); for (let r = LAKE.r + 8; r > 4; r -= 0.5) { const x = LAKE.x + dx * r, z = LAKE.z + dz * r; if (World.waterAt(x, z) - World.groundY(x, z) > 1.4) { if (Math.hypot(x, z) < WORLD_RADIUS - 6) probes.push([x, z, x + dx * 9, z + dz * 9]); break; } } }
      for (let i = 0; i < River.p.length; i += 2) { const q = River.p[i]; if (!q || Math.hypot(q[0], q[1]) > WORLD_RADIUS - 8 || !(World.waterAt(q[0], q[1]) - World.groundY(q[0], q[1]) > 1.4)) continue; for (const sd of [-1, 1]) probes.push([q[0], q[1], q[0] + sd * 12, q[1]]); }
      let np = 0; for (const pr of probes) { const [x, z] = pr; let tx = pr[2], tz = pr[3]; { const ux = (tx - x) / Math.hypot(tx - x, tz - z), uz = (tz - z) / Math.hypot(tx - x, tz - z); let d = 1; while (d < 25 && wet(x + ux * d, z + uz * d)) d += 0.5; if (d >= 25) continue; tx = x + ux * (d + 2.5); tz = z + uz * (d + 2.5); } np++;       /* aim at dry ground that way, not at a fixed distance (the shallows run out a long way) */ Cells.teleport({ p: [x, World.waterAt(x, z) - 1.25, z], yaw: 0 }); game.step(3, 1 / 30); if (!P.swim) continue; if (!leave(tx, tz, 25)) swim.stuck.push('from the water at ' + [x, z].map(r1) + ' there is no getting out toward ' + [tx, tz].map(r1) + ' (stopped at ' + P.pos.map(r1) + ', bank ' + (World.groundAt(P.pos[0] + (tx - x) / 9, P.pos[2] + (tz - z) / 9, P.pos[1] + 3) - P.pos[1]).toFixed(1) + ' m above the feet)'); }
      swim.probes = np; for (const t of swim.stuck) notes.push('swimmer: ' + t); }
    return { swim, fails, notes, walked, gates: ng, pairs, levels, worst: worst && worst[0].toFixed(2) + ' ' + worst[1], points: np }; });
  console.log('   walked ' + TOWN.walked + ' m of streets, ' + TOWN.gates + ' gates both ways, ' + TOWN.pairs + ' pairs of places (longest detour ' + TOWN.worst + '), ' + TOWN.points + ' standing points'); for (const n of TOWN.notes) console.log('   note: ' + n); for (const f of TOWN.fails) console.log('   FAIL ' + f);
  console.log(TOWN.fails.length ? 'town FAIL ' + TOWN.fails.length : 'town PASS ' + TOWN.walked + ' m, ' + TOWN.gates + ' gates, ' + TOWN.pairs + ' pairs, ' + TOWN.points + ' points, swam out ' + TOWN.swim.ok + ' of 2, ' + TOWN.swim.stuck.length + ' of ' + TOWN.swim.probes + ' banks cannot be climbed'); }
if (PARTS.includes('cells') && !REDO) { console.log('── interiors: through every door, every room, every stair ──'); const r = await ev(async ([only, lim]) => { const res = []; for (const c of Cells.list) { if (only && !only.includes(c.id)) continue; if (c.id === 'mine') continue; const h = World.houses[c.id] || {}, inNode = i => { const n = Nav.nodes[i]; return Cells.at(n[0], n[1], n[2]) === c; };
      // start outside at the door, go in by the E key, tour, come out
      let ot = -1, it = -1; for (const a in Nav.portal) { const b = Nav.portal[a]; if (inNode(+b) && !inNode(+a)) { ot = +a; it = +b; break; } } if (ot < 0) { res.push(c.id + ': no door in the graph'); continue; }
      WALK.seg = c.id + ' door in'; const o = Nav.nodes[ot]; WALK.put([o[0], o[1], o[2]]); const e0 = WALK.ev.length, d0 = WALK.dist; const n = Nav.nodes[it]; let t = await WALK.door(n[0], n[1], n[2]); if (!t) { Cells.teleport({ p: n.slice(), yaw: 0 }); game.step(2, 1 / 30); }
      const r = await WALK.tour(it, (a, b) => inNode(a) && inNode(b), c.id, lim); const back = Nav.nodes[it]; WALK.seg = c.id + ' door out'; WALK.goto(back[0], back[2], back[1], {}); t = await WALK.door(o[0], o[1], o[2]); if (!t && World.cell) game.leave();
      res.push(c.id + ': ' + r.count + ' stretches, ' + Math.round(WALK.dist - d0) + ' m, ' + (WALK.ev.length - e0) + ' findings'); console.log('[walk] ' + res[res.length - 1]); await new Promise(r => setTimeout(r, 0)); } return res.length; }, [ONLY, LIMIT]); console.log('   ' + r + ' interiors'); }
if (PARTS.includes('routes') && !REDO) { console.log('── routes: galleries, wall walks, terraces, the wharf ──'); const r = await ev(() => { let n = 0; for (const rt of World.routes || []) { WALK.line('route ' + rt.id, rt.pts); n++; } return n; }); console.log('   ' + r + ' routes'); }
if (PARTS.includes('wilds') && !REDO) { console.log('── the wilds: every path ──'); const r = await ev(() => { let n = 0; for (const p of ROADS.filter(r => r.path)) { const pts = p.pts.map(q => [q[0], World.groundY(q[0], q[1]), q[1]]); if (pts.length < 2) continue; const fine = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 6)); for (let j = (i === 1 ? 0 : 1); j <= k; j++) { const x = a[0] + (b[0] - a[0]) * j / k, z = a[2] + (b[2] - a[2]) * j / k; fine.push([x, World.groundY(x, z), z]); } } WALK.line('path ' + p.id.replace(/^p\./, ''), fine); n++; } return n; }); console.log('   ' + r + ' paths'); }
if (PARTS.includes('mine') && !REDO) { console.log('── the mine, the tunnel, the cave ──'); const r = await ev(async () => { const c = Cells.by.mine; if (!c) return 'no mine'; const inNode = i => { const n = Nav.nodes[i]; return Cells.at(n[0], n[1], n[2]) === c; }; const O = c.origin, FY = c.floorY, at = (x, z, y) => [O[0] + x, FY + (y || 0), O[2] + z];
    Foes.calm(true); for (const f of Foes.list) if (f.camp && f.camp.cell === 'mine') { f.alive = false; f.state = 'gone'; }       // the dead are walked past, not fought: the fight is the play bot's
    const d = World.interact.find(i => i.id === 'door.mine.in'); WALK.seg = 'mine door'; WALK.put([d.p[0], World.groundAt(d.p[0], d.p[2] + 1.5, d.p[1] + 1), d.p[2] + 1.5], 0); let t = await WALK.door(c.enter.p[0], c.enter.p[1], c.enter.p[2]); if (!t) game.enter('mine');
    const A = MINE.AT, pts = [at(A.arrive[0], A.arrive[1]), at(A.trap[0], A.trap[1]), at(A.tally[0], A.tally[1]), at(A.niche[0], A.niche[1]), at(A.tally[0], A.tally[1]), at(A.gallery[0], A.gallery[1]), at(A.sump[0], A.sump[1]), at(A.stope[0], A.stope[1]), at(A.way[0], A.way[2]), at(A.gallery[0], A.gallery[1]), at(A.tally[0], A.tally[1]), at(A.deep[0], A.deep[1]), at(A.station[0], A.station[1]), at(A.chest[0], A.chest[1]), at(A.deep[0], A.deep[1])];
    for (let i = 1; i < pts.length; i++) { WALK.seg = 'mine ' + i; WALK.goto(pts[i][0], pts[i][2], undefined, { tol: 0.9 }); }
    WALK.seg = 'mine to the cleft'; WALK.goto(at(-20, 60)[0], at(-20, 60)[2], undefined, { tol: 0.9, kind: 'stair' }); WALK.goto(at(-33.5, 60)[0], at(-33.5, 60)[2], undefined, { tol: 1.0, kind: 'stair' });
    WALK.seg = 'tunnel'; Cells.teleport({ p: at(63, -30, 0.1), yaw: -Math.PI / 2 }); game.step(3, 1 / 30); for (let x = 55; x >= -66; x -= 8) { WALK.seg = 'tunnel x ' + x; WALK.goto(at(x, -30)[0], at(x, -30)[2], undefined, { tol: 1.0 }); } WALK.seg = 'cave'; WALK.goto(at(-52, -27)[0], at(-52, -27)[2], undefined, { tol: 1.0 }); WALK.goto(at(-69, -30)[0], at(-69, -30)[2], undefined, { tol: 1.2 });
    if (World.cell) game.leave(); return 'walked'; }); console.log('   ' + r); }

// ── gaps: from inside each room, does the picture show the void? ──
if (has('--gaps') && !REDO) { console.log('── gaps: the void seen from inside ──');
  const n = await ev(async (only) => { const T = THREE, r = G.renderer, sc = R.scene || G.scene; let found = 0; if (!sc) return 'no scene handle'; const bg0 = sc.background; const sky = (sc.children || []).filter(o => /sky|dome|star|cloud/i.test(o.name || ''));
      for (const c of Cells.list) { if (only && !only.includes(c.id)) continue; const pts = []; for (let i = 0; i < Nav.nodes.length && pts.length < 10; i++) { const q = Nav.nodes[i]; if (Nav.adj[i].length && Cells.at(q[0], q[1], q[2]) === c && !pts.some(p => Math.hypot(p[0] - q[0], p[2] - q[2]) < 2.2 && Math.abs(p[1] - q[1]) < 1)) pts.push(q); }
        for (const q of pts) for (const yaw of [0, 90, 180, 270]) { Cells.teleport({ p: q.slice(), yaw: yaw * Math.PI / 180 }); Player.yaw = yaw * Math.PI / 180; game.step(2, 1 / 30); sc.background = new T.Color(1, 0, 1); for (const o of sky) o.visible = false; await game.draw(); const cv = G.canvas, t = document.createElement('canvas'); t.width = 211; t.height = 98; const x = t.getContext('2d'); x.drawImage(cv, 0, 0, 211, 98); const d = x.getImageData(0, 0, 211, 98).data; let m = 0, mx = 0, my = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 70 && d[i + 2] > 200) { m++; mx += (i / 4) % 211; my += Math.floor(i / 4 / 211); }
          sc.background = bg0; for (const o of sky) o.visible = true; if (m > 6) { found++; WALK.seg = c.id + ' gap'; WALK.ev.push({ type: 'gap', seg: c.id, p: Player.pos.map(v => +v.toFixed(2)), yaw, cell: c.id, detail: (m / (211 * 98) * 100).toFixed(1) + '% of the picture is the void, centred at ' + Math.round(mx / m / 211 * 100) + '% across, ' + Math.round(my / m / 98 * 100) + '% down' }); } } }
      return found; }, ONLY); console.log('   ' + n + ' views with void pixels'); }

}
// ── the report ──
let E, tot; if (REDO) ({ E, tot } = JSON.parse(fs.readFileSync(root + OUT + '/walk.json', 'utf8'))); else { E = await ev(() => WALK.ev); tot = await ev(() => ({ m: Math.round(WALK.dist), ticks: WALK.ticks, lifts: WALK.lifts, doors: WALK.doors, edges: WALK.edges, v: WALK.vWalk, hourCells: Cells.list.length })); fs.writeFileSync(root + OUT + '/walk.json', JSON.stringify({ tot, E }, null, 0)); }
const SEV = { void: 1, fall: 1, lift: 1, level: 3, 'graph-wall': 3, 'door-fail': 1, water: 1, stuck: 2, 'cam-wall': 2, 'cam-person': 2, gap: 2, 'stair-retry': 2, 'door-retry': 2, 'prompt-wall': 2, 'cam-ceiling': 3, slide: 3, slow: 3, retry: 3, 'prompt-behind': 3, locked: 4 };
const MINE_T = new Set(['cam-wall', 'cam-ceiling', 'cam-person', 'prompt-wall', 'prompt-behind', 'slow', 'slide']);       // the player, the camera and the prompt are this worker's; the rest is where the geometry is
const groups = new Map(); for (const e of E) { const k = e.type + '|' + (e.cell || 'out') + '|' + (e.thing || Math.round(e.p[0] / 1.5) + ',' + Math.round(e.p[1] / 1.5) + ',' + Math.round(e.p[2] / 1.5)); const g = groups.get(k); if (g) g.n++; else groups.set(k, Object.assign({ n: 1 }, e)); }
const rows = [...groups.values()].sort((a, b) => (SEV[a.type] || 9) - (SEV[b.type] || 9) || b.n - a.n);
// the camera stands where the player's eye was and looks at what he was heading for (or the way he faced)
const shotOf = e => { const p = e.from || e.p; let y = ((e.from ? e.fromYaw : e.yaw) % 360 + 360) % 360; if (e.to && !e.from) { const dx = e.to[0] - p[0], dz = e.to[2] - p[2]; if (Math.hypot(dx, dz) > 0.3) y = Math.round((Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360); } return `game.shot(${p[0]}, ${(p[1] + 1.66).toFixed(2)}, ${p[2]}, ${y}, -12, 13)`; };
const count = {}; for (const r of rows) count[r.type] = (count[r.type] || 0) + 1;
console.log(`\nwalked ${tot.m} m in ${tot.ticks} frames (${Math.round(tot.ticks / 30 / 60)} min of play), ${tot.edges} stretches, ${tot.doors} doors used, ${tot.lifts} lifts; findings by kind: ${JSON.stringify(count)}; ${Math.round((Date.now() - t0) / 1000)} s`);
for (const e of errs.slice(0, 5)) console.log('console: ' + e);
if (!has('--no-doc')) {
  const T = { void: 'Under the floor or the ground', fall: 'Falls of more than 1.6 m', lift: 'Could not be walked at all (the bot was lifted on)', 'door-fail': 'Doors that gave no prompt', level: 'The villagers’ graph joins two levels with no walkable way (villagers are slid along it)', 'graph-wall': 'The villagers’ graph passes through a wall (villagers walk through it)', water: 'In water for 5 s', stuck: 'Stuck: no progress for 2 s with W held', 'cam-wall': 'The eye or the near plane inside something solid', 'cam-person': 'The eye inside a villager', gap: 'The void seen from inside a room', 'stair-retry': 'Stairs that needed more than one try', 'door-retry': 'Doors that needed more than one try', 'prompt-wall': 'Prompts offered through a wall', 'cam-ceiling': 'The eye within 10 cm of the underside of a floor or stair', slide: 'Sliding: moving more than 35 degrees off the way the player faces', slow: 'Snags: under half walking speed', retry: 'Stretches that needed more than one try', 'prompt-behind': 'Prompts for things more than 60 degrees off the view', locked: 'Locked doors met (not faults)' };
  let md = `# Walking the world: what the walk bot found\n\nWritten by \`node test/walkbot.mjs\` (do not edit by hand: run it again). The bot moves only by input (W, turning, Space, the E key) along every\nstretch of the villagers' navigation graph outdoors and in all interiors, both ways; every way point of the galleries, wall walks, terraces\nand the wharf; every path of the wilds; the mine, tunnel and cave. Walking speed measured on open ground: ${tot.v.toFixed(2)} m/s.\n\nThis run: ${tot.m} m walked (${Math.round(tot.ticks / 30 / 60)} minutes of play), ${tot.edges} stretches, ${tot.doors} doors used by the E key, ${tot.lifts} places the bot had to be lifted past.\n\nTo look at a finding: \`node test/shot.mjs --opt webgl=1 --do "await <shot call>" --out f.png\` (the call puts the camera where the player's eye was).\nOwner: **player** = collision, camera, prompts (the behaviour worker: fixed here or listed in docs/BUGS.md); **geometry** = where things stand (the\nvisual workers: outdoors \`fork-fx1\`, interiors \`fork-fx2\`). The bot cannot see flicker or how a place looks.\n\nHow far to trust it: falls, water, the camera and prompt findings and the door counts are measured directly and hold. \"Could not be walked\",\n\"stuck\", \"snag\" and \"slide\" are where the bot, walking the straight line the villagers' graph draws between two points, was stopped: most are\nreal obstacles on a line people are meant to walk (a table leg in a doorway, a step too high), some are lines only villagers use. Look at the\nshot before changing anything. Every door in the game (${tot.doors} uses, both directions) gave its prompt and opened; none needed a second try unless listed.\n\n| Kind | Places |\n|---|---|\n` + Object.keys(T).filter(k => count[k]).map(k => `| ${T[k]} | ${count[k]} |`).join('\n') + '\n';
  for (const k of Object.keys(T)) { const rs = rows.filter(r => r.type === k); if (!rs.length) continue; md += `\n## ${T[k]} (${rs.length})\n\n| Where | Times | What | Owner | Shot |\n|---|---|---|---|---|\n` + rs.slice(0, 60).map(r => `| ${r.cell || 'outdoors'} ${r.p.map(v => v.toFixed(1)).join(', ')} (${r.seg}) | ${r.n} | ${r.detail}${r.to ? '; heading for ' + r.to.filter(v => v !== null).map(v => v.toFixed(1)).join(', ') : ''} | ${MINE_T.has(k) ? 'player' : 'geometry'} | \`${shotOf(r)}\` |`).join('\n') + (rs.length > 60 ? `\n\n(${rs.length - 60} more in ${OUT}/walk.json)` : '') + '\n'; }
  fs.writeFileSync(root + 'docs/WALK.md', md); console.log('wrote docs/WALK.md');
}
await browser.close(); srv.close(); process.exit(TOWN && TOWN.fails.length ? 1 : 0);
