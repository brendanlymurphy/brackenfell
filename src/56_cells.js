// ───────────────────────── cells: every interior is a space of its own, reached through its door ─────────────────────────
// A cell is built at its own origin in the same world and coordinate system (so colliders, floors, zones, spots, stairs, lights, particles, villagers and
// saves work as they always did), but far below the terrain and 150 m from the next cell: x = CELL.x0 + col * CELL.step, z = row * CELL.step, y = CELL.y.
// The village keeps only the shell of each building (closed doors, solid walls, glowing windows). A door is a portal: outside it reads "Enter <place>",
// inside "Leave to <village>"; using it fades to black, names the place, moves the player to the other side and fades back in (Cells.travel).
// Which cell the player is in follows from where the player stands (Cells.sync); while in one, 43_render.js draws only that cell: no sun, no sun shadows,
// no sky, terrain, grass, trees or outdoor props (see sceneUpdate in 42_scene.js and the cell branches in renderFrame), and the fog is short and dark.
// Villagers cross doors through portal edges of the nav graph (77_npc.js). CELLS_ON = false (test option cells=0) gives back the old seamless houses.
const CELLS_ON = !(TEST && TEST.cells === 0);
// x0: cells sit just outside the playable valley (WORLD_RADIUS 184) and 400 m under it: float32 vertices, the camera and world-space shader maths keep ~0.03-0.1 mm of precision (at x = 3000 a step was 0.24-0.5 mm and surfaces a few mm apart flickered). Builds up to 25 stored positions at x0 = 3000 (CELL_X0_OLD): Cells.migrate moves those.
const CELL_X0_OLD = 3000;
const CELL = { x0: 260, y: -400, step: 150, cols: 8, half: 70 };
const Cells = { list: [], by: {}, cur: null, busy: false, fadeIn: 0.3, fadeOut: 0.3, hold: 0.42 };
// allocate the next free cell. cs is a site-like frame (x, z, y, yaw 0) that interior code uses where it used the site's
Cells.make = function (id, name, extra) {
  const i = Cells.list.length, col = i % CELL.cols, row = (i / CELL.cols) | 0;
  const origin = [CELL.x0 + col * CELL.step, CELL.y, row * CELL.step];
  const site = extra && extra.site;
  const cs = Object.assign({}, site || {}, { id, name, x: origin[0], z: origin[2], y: origin[1], yaw: 0, real: site || null, cellFrame: true });
  const c = Object.assign({ id, name, index: i, origin, cs, zones: [], floorY: origin[1] + 0.32, exit: 'Brackenfell', door: null, xdoor: null, enter: null, leave: null, kind: 'house' }, extra || {});
  Cells.list.push(c); Cells.by[id] = c; return c;
};
// the cell around a point, or null (everything outdoors lives far above and away from the cell grid)
Cells.at = function (x, y, z) {
  if (x < CELL.x0 - CELL.half || y > CELL.y + 150) return null;
  const col = Math.round((x - CELL.x0) / CELL.step), row = Math.round(z / CELL.step);
  if (col < 0 || col >= CELL.cols || row < 0) return null;
  return Cells.list[row * CELL.cols + col] || null;
};
Cells.inRegion = x => x >= CELL.x0 - CELL.half;
Cells.spaceOf = p => { const c = Cells.at(p[0], p[1], p[2]); return c ? c.id : 0; };
Cells.exitName = function (site) { return site.alleyRow ? 'Market Alley' : site.id === 'tower' ? 'the Greyspine Crag' : 'Brackenfell'; };
// the two door interaction points of a house cell: outside "Enter ...", inside "Leave to ..."
Cells.portals = function (cell, site) {
  const d = cell.door, x = cell.xdoor, yawTo = (a, b) => Math.atan2(b[0] - a[0], -(b[2] - a[2]));
  cell.exit = Cells.exitName(site);
  cell.enter = { p: d.ins.slice(), yaw: yawTo(d.c, d.ins), cell: cell.id, name: site.name };
  cell.leave = { p: x.out.slice(), yaw: yawTo(x.c, x.out), cell: null, name: cell.exit };
  cell.portalOut = { kind: 'portal', id: 'door.' + cell.id + '.in', p: [x.c[0], x.c[1] + 0.1, x.c[2]], r: 2.7, zone: 0, cell: cell.id, label: 'Enter ' + site.name, dest: cell.enter, side: 'out' };
  cell.portalIn = { kind: 'portal', id: 'door.' + cell.id + '.out', p: [d.c[0], d.c[1] + 0.1, d.c[2]], r: 2.7, zone: cell.zone, cell: cell.id, label: 'Leave to ' + cell.exit, dest: cell.leave, side: 'in' };
  World.interact.push(cell.portalOut, cell.portalIn);
};
// a door's lock: it.lock() returns a message while the door is shut, or null (none of the village's doors lock yet; 93_ and the dungeons use it)
Cells.lockMsg = it => (typeof it.lock === 'function' ? it.lock() : null);

// ── which cell the player (or camera) is in ──
Cells.sync = function (p) {
  const c = Cells.at(p[0], p[1], p[2]);
  if (c !== Cells.cur) Cells.change(c);
  return c;
};
Cells.change = function (c) {
  const prev = Cells.cur; Cells.cur = World.cell = c;
  World.indoor = c ? 1 : 0;
  if (c && typeof Foes !== 'undefined' && Foes.ready) Foes.breakOff();         // a fight does not follow through a door
  if (!c && prev && typeof R !== 'undefined') R.shadow1Ready = false;            // the wide sun-shadow map was not drawn in there: redraw it at once
  if (typeof Sky !== 'undefined' && Sky.mesh) Sky.mesh.visible = !c;
};
// move the player (instantly) to dest = { p: [x, y, z] feet, yaw }
Cells.teleport = function (dest) {
  const P = Player, p = dest.p;
  P.pos = [p[0], World.groundAt(p[0], p[2], p[1] + 1.2), p[2]]; P.vel = [0, 0, 0]; P.yaw = dest.yaw || 0; P.pitch = 0; P.camY = P.pos[1]; P.onGround = true; P.coyote = 0.12;
  Cells.sync(P.pos); World.camZone = World.zoneAt(P.pos[0], P.pos[1] + 1.0, P.pos[2]);
  R.cam.pos[0] = P.pos[0]; R.cam.pos[1] = P.camY + P.eye; R.cam.pos[2] = P.pos[2]; R.cam.yaw = P.yaw; R.cam.pitch = 0;
  if (typeof Input !== 'undefined') { Input.keys = {}; Input.lookX = Input.lookY = 0; }
};
// the doorway fade: black in about 0.3 s, the place's name for a moment (the cell's materials compile and upload during it), black out again in 0.3 s
Cells.travel = function (dest, done) {
  if (Cells.busy) return false;
  Cells.busy = true; Player.locked = true; if (typeof RPG !== 'undefined') RPG.iframes = Math.max(RPG.iframes || 0, 2.2);
  Audio2.door(1);
  const f = $('portal'), nm = $('portalName'), ms = Cells.fadeIn * 1000;
  f.classList.add('on');
  setTimeout(() => {
    nm.textContent = dest.name || ''; nm.classList.add('on');
    Cells.teleport(dest);
    try { game.step(2, 1 / 30); const env = updateEnv(game.time, World.indoor); env.time = game.time; renderFrame(game.time, env); } catch (e) { console.warn('cell warm-up: ' + (e && e.message || e)); }       // first draw of a cell: shaders and buffers are made here, under the black
    setTimeout(() => {
      nm.classList.remove('on'); f.classList.remove('on');
      setTimeout(() => { Cells.busy = false; Player.locked = uiBusy(); if (done) done(); }, Cells.fadeOut * 1000);
    }, Cells.hold * 1000);
  }, ms);
  return true;
};
// the E key / interact button on a door
Cells.use = function (it) {
  const msg = Cells.lockMsg(it); if (msg) { toast(msg); Audio2.door(0.4); return; }
  Cells.travel(it.dest);
};
// the cell the player is in: the way to the compass's needle and the exit
Cells.mapTarget = function (t) {
  if (!t) return t;
  const here = Cells.cur, there = Cells.at(t[0], t[1] === undefined ? CELL.y : t[1], t[2]);
  if (here === there) return t;
  if (here) return here.door ? here.door.c : null;       // inside, anything outside is "through the door"
  return there && there.xdoor ? there.xdoor.c : t;        // outside, a person in a house is at its door
};
// distance for sounds from something in a cell to the listener, and whether a wall is in the way
Cells.hear = function (pos, from) {
  const a = Cells.at(pos[0], pos[1], pos[2]), b = Cells.cur;
  if (a === b) return { d: hyp(pos[0] - from[0], pos[2] - from[2]), wall: false };
  if (b) return { d: 999, wall: true };
  const x = a && a.xdoor ? a.xdoor.c : pos;
  return { d: hyp(x[0] - from[0], x[2] - from[2]) + 3, wall: true };
};
// frame environment: no sun, a short dark fog, the day's ambient kept (windows and the hour of day still reach the rooms through emissive panes and daylight lights)
const CELL_DAYLIGHT = (typeof TEST !== 'undefined' && TEST && TEST.celllight !== undefined) ? +TEST.celllight : 6;
Cells.env = function (e) {
  const c = Cells.cur; if (!c) return e;
  e.keyCol = [0, 0, 0]; e.shadowStrength = 0; e.fogSun = [0, 0, 0];
  // daylight: with the sun off, rooms lost the light that used to come in by day (midday was darker than night). Windows let the sky in: lift the day's ambient. c.daylight: 0 for a cellar or crypt, default for a room with windows.
  { const dl = c.daylightFn ? c.daylightFn() : c.daylight, k = dl === undefined ? CELL_DAYLIGHT : dl; if (k > 0) { e.ambSky = e.ambSky.map(v => v * (1 + k)); e.ambGnd = e.ambGnd.map(v => v * (1 + k * 0.8)); } else { e.ambSky = e.ambSky.map(v => v * 0.25); e.ambGnd = e.ambGnd.map(v => v * 0.25); } }
  e.fogCol = c.fog || [0.030, 0.025, 0.020]; e.fogDensity = c.fogDensity || 0.022; e.cloud = 0; e.stars = 0; e.aurora = 0; e.sunDisc = 0; e.moonBright = 0;
  return e;
};
// fell out of a cell (a gap in a floor): back to its door
Cells.rescue = function () { const c = Cells.cur; if (c && c.enter) Cells.teleport(c.enter); };
// an old save made inside a building (when interiors stood in the village): the same spot in the same building's cell (cells are built in the building's own frame)
Cells.migrate = function (pos, yaw) {
  if (CELLS_ON && pos[0] > CELL_X0_OLD - CELL.half && pos[1] < CELL.y + 100) return { pos: [pos[0] - CELL_X0_OLD + CELL.x0, pos[1], pos[2]], yaw };          // a save made inside a cell of Build 25 or earlier
  if (!CELLS_ON || Cells.inRegion(pos[0])) return false;
  for (const c of Cells.list) {
    const real = c.cs.real, z = World.zones[c.zones[0] - 1]; if (!real || !z) continue;
    if (Math.abs(pos[0] - real.x) > 14 || Math.abs(pos[2] - real.z) > 14) continue;
    const l = worldToSite(real, pos[0], pos[2]);
    if (Math.abs(l[0]) < z.hw && Math.abs(l[1]) < z.hd && pos[1] > real.y - 0.5 && pos[1] < real.y + (z.y1 - z.y0) + 1) {
      return { pos: [c.cs.x + l[0], c.floorY + Math.max(0, pos[1] - (real.y + 0.32)), c.cs.z + l[1]], yaw: yaw - real.yaw };
    }
  }
  return false;
};
