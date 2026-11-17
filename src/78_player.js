// ───────────────────────── collision, walkable surfaces, the player, input ─────────────────────────
const Col = { grid: new Map(), cell: 4, dyn: [] };
function colBuild() {
  Col.grid.clear();
  for (const c of World.colliders) {
    const r = c.r !== undefined ? c.r : hyp(c.hx, c.hz), cs = Col.cell;
    for (let gz = Math.floor((c.z - r) / cs); gz <= Math.floor((c.z + r) / cs); gz++) for (let gx = Math.floor((c.x - r) / cs); gx <= Math.floor((c.x + r) / cs); gx++) {
      const k = gx * 4096 + gz; let l = Col.grid.get(k); if (!l) Col.grid.set(k, l = []); l.push(c);
    }
  }
}
// push a circle out of one collider; returns true if it moved
function colPush(p, r, c) {
  const dx = p[0] - c.x, dz = p[2] - c.z;
  if (c.r !== undefined) {
    const rr = r + c.r, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) return false;
    const d = Math.sqrt(d2) || 0.001, k = (rr - d) / d; p[0] += dx * k; p[2] += dz * k; return true;
  }
  const lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz;
  if (Math.abs(lx) > c.hx + r || Math.abs(lz) > c.hz + r) return false;
  const qx = clamp(lx, -c.hx, c.hx), qz = clamp(lz, -c.hz, c.hz); let ox = lx - qx, oz = lz - qz;
  const d2 = ox * ox + oz * oz;
  if (d2 > r * r) return false;
  let px, pz;
  if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; px = ox * k; pz = oz * k; }
  else { const ex = c.hx - Math.abs(lx) + r, ez = c.hz - Math.abs(lz) + r; if (ex < ez) { px = ex * (lx < 0 ? -1 : 1); pz = 0; } else { px = 0; pz = ez * (lz < 0 ? -1 : 1); } }
  p[0] += px * c.ax + pz * c.bx; p[2] += px * c.az + pz * c.bz; return true;
}
function colResolve(p, r, feet, head) {
  let hit = false; const cs = Col.cell;
  for (let it = 0; it < 3; it++) {
    let moved = false; const gx0 = Math.floor((p[0] - r) / cs), gx1 = Math.floor((p[0] + r) / cs), gz0 = Math.floor((p[2] - r) / cs), gz1 = Math.floor((p[2] + r) / cs);
    for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) {
      const l = Col.grid.get(gx * 4096 + gz); if (!l) continue;
      for (const c of l) { if (c.off || head < c.y0 || feet + 0.32 > c.y1) continue; if (colPush(p, r, c)) moved = true; }
    }
    for (const c of Col.dyn) { if (head < c.y0 || feet + 0.32 > c.y1) continue; if (colPush(p, r, c)) moved = true; }
    if (!moved) break; hit = true;
  }
  return hit;
}
World.blockedAt = (x, z, r) => { const l = Col.grid.get(Math.floor(x / Col.cell) * 4096 + Math.floor(z / Col.cell)); if (!l) return false; const p = [x, 0, z]; for (const c of l) if (colPush(p, r, c)) return true; return false; };
// Is there something solid between the eye and a thing? (the prompt asks: a chest in the next room was offered through the wall)
// Walks the line in 0.12 m steps from 0.3 m in front of the eye to 1.3 m short of the thing (a thing set into or just behind a wall, like the loose bricks in the Hart cellar, is still offered). A collider the thing itself stands in or against
// (the wall a door is set in, the cupboard a jar lies in) does not count, nor does anything lower or higher than the line where it passes.
World.sightBlocked = (ex, ey, ez, tx, ty, tz) => {
  const dx = tx - ex, dy = ty - ey, dz = tz - ez, L = Math.hypot(dx, dy, dz); if (L < 1.7) return false; const cs = Col.cell;
  for (let t = 0.3; t < L - 1.3; t += 0.12) {
    const x = ex + dx / L * t, y = ey + dy / L * t, z = ez + dz / L * t, l = Col.grid.get(Math.floor(x / cs) * 4096 + Math.floor(z / cs)); if (!l) continue;
    for (const c of l) {
      if (c.off || y < c.y0 || y > c.y1) continue; const qx = x - c.x, qz = z - c.z, m = 0.05;
      if (c.r !== undefined) { if (qx * qx + qz * qz >= (c.r - m) * (c.r - m)) continue; if (Math.hypot(tx - c.x, tz - c.z) < c.r + 0.55) continue; return true; }
      const lx = qx * c.ax + qz * c.az, lz = qx * c.bx + qz * c.bz; if (Math.abs(lx) >= c.hx - m || Math.abs(lz) >= c.hz - m) continue;
      const ux = (tx - c.x) * c.ax + (tz - c.z) * c.az, uz = (tx - c.x) * c.bx + (tz - c.z) * c.bz; if (Math.abs(ux) < c.hx + 0.55 && Math.abs(uz) < c.hz + 0.55) continue;
      return true;
    }
  }
  return false;
};
// the height of floor f at (x,z), or null when (x,z) is not over it
function floorHeight(f, x, z) {
  const dx = x - f.x, dz = z - f.z; if (Math.abs(dx) > f.hx + f.hz || Math.abs(dz) > f.hx + f.hz) return null;
  const lx = dx * f.ax + dz * f.az, lz = dx * f.bx + dz * f.bz;
  if (Math.abs(lx) > f.hx || Math.abs(lz) > f.hz) return null;
  return f.y2 === undefined ? f.y : lerp(f.y, f.y2, ((f.axis === 'x' ? lx / f.hx : lz / f.hz) + 1) / 2);
}
// highest walkable surface at (x,z) that is not above maxY (terrain is always a candidate)
World.groundAt = (x, z, maxY) => {
  let best = (CELLS_ON && Cells.inRegion(x)) ? -1e9 : Terrain.y(x, z);          // cells have no terrain: below them is nothing (the rescue in playerUpdate)
  for (const f of World.floors) { const y = floorHeight(f, x, z); if (y !== null && y <= maxY && y > best) best = y; }
  return best;
};
// the underside of the lowest slab, stair or floor that a head rising from y0 to y1 at (x,z) would run into (slabs are 0.12 thick), or null
World.ceilingAt = (x, z, y0, y1) => {
  let best = null;
  for (const f of World.floors) { const y = floorHeight(f, x, z); if (y === null) continue; const u = y - 0.12; if (u >= y0 - 0.02 && u <= y1 && (best === null || u < best)) best = u; }
  return best;
};
World.zoneAt = (x, y, z) => { for (const zn of World.zones) { if (Math.abs(x - zn.site.x) > 12 || Math.abs(z - zn.site.z) > 12) continue; const l = worldToSite(zn.site, x, z); if (Math.abs(l[0]) < zn.hw && Math.abs(l[1]) < zn.hd && y > zn.y0 && y < zn.y1) return zn.id; } return 0; };
World.waterAt = (x, z) => { if (hyp(x - LAKE.x, z - LAKE.z) < LAKE.r + 8 && Terrain.y(x, z) < LAKE.y) return LAKE.y; const d = River.dist(x, z, 6); if (d < 6) { const wy = riverY(River.at); if (Terrain.y(x, z) < wy) return wy; } return -999; };

const Player = { pos: [-84, 0, -6.5], vel: [0, 0, 0], yaw: 1.45, pitch: 0.02, eye: 1.66, r: 0.32, onGround: true, bob: 0, bobAmt: 0, step: 0, speed: 0, inWater: 0, surface: 'grass', locked: false, warned: 0, coyote: 0, dip: 0, camY: 0 };
const PLAYER_HEAD = 1.8;       // m: the head's height for ceilings (colliders use 1.75)
const Input = { keys: {}, mx: 0, mz: 0, run: false, lookX: 0, lookY: 0, joy: null, look: null, sens: 1, invertY: false, interact: false, touch: false };

function playerUpdate(dt) {
  const P = Player, I = Input;
  // look
  if (!P.locked) {
    P.yaw += I.lookX; P.pitch = clamp(P.pitch - I.lookY * (I.invertY ? -1 : 1), -1.45, 1.45);
  }
  I.lookX = 0; I.lookY = 0;
  // desired move
  let mx = 0, mz = 0, run = false;
  if (!P.locked) {
    const k = I.keys;
    mx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0); mz = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    run = !!(k.ShiftLeft || k.ShiftRight);
    if (I.joy) { mx += I.joy.x; mz += -I.joy.y; if (hyp(I.joy.x, I.joy.y) > 0.93) run = true; }
    const l = hyp(mx, mz); if (l > 1) { mx /= l; mz /= l; }
  }
  const feet = P.pos[1], water = World.waterAt(P.pos[0], P.pos[2]), depth = water - feet;
  P.inWater = depth > 0.15 ? depth : 0;
  // wading slows you, chest-deep water more so, and nobody sprints through it
  const wade = depth > 0.9 ? 0.42 : depth > 0.45 ? 0.55 : depth > 0.15 ? 0.8 : 1;
  if (depth > 0.45) run = false;
  // stamina, jumping, dodging and combat stance live in 90_rpg.js; it answers { run, speed, jump, ov: [vx, vz] | null }
  const rp = typeof RPG !== 'undefined' && !P.locked ? RPG.move(dt, run, mx, mz, depth) : null;
  if (rp) run = rp.run;
  const maxSp = (run ? 5.4 : 2.9) * wade * (rp ? rp.speed : 1);
  const fx = Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = Math.sin(P.yaw);
  let tx = (fx * mz + rx * mx) * maxSp, tz = (fz * mz + rz * mx) * maxSp, acc = Math.min(1, dt * (P.onGround ? 11 : 2.5));
  if (rp && rp.ov) { tx = rp.ov[0]; tz = rp.ov[1]; acc = Math.min(1, dt * 30); }
  P.vel[0] += (tx - P.vel[0]) * acc; P.vel[2] += (tz - P.vel[2]) * acc;
  const sp = hyp(P.vel[0], P.vel[2]); P.speed = sp;
  // integrate in small steps so thin walls can't be tunnelled
  const steps = Math.max(1, Math.ceil(sp * dt / 0.2)), sdt = dt / steps, px0 = P.pos[0], pz0 = P.pos[2];
  for (let i = 0; i < steps; i++) {
    const nx = P.pos[0] + P.vel[0] * sdt, nz = P.pos[2] + P.vel[2] * sdt, np = [nx, P.pos[1], nz];
    colResolve(np, P.r, P.pos[1], P.pos[1] + 1.75);
    // stay inside the valley and out of deep water
    const rr = hyp(np[0], np[2]);
    if (rr > WORLD_RADIUS && !(CELLS_ON && Cells.inRegion(np[0]))) { np[0] *= WORLD_RADIUS / rr; np[2] *= WORLD_RADIUS / rr; if (P.warned <= 0) { P.warned = 8; if (typeof toast === 'function') toast('The wilds beyond Brackenfell are no place to wander alone.'); } }
    const w2 = World.waterAt(np[0], np[2]);
    if (w2 > -900 && w2 - World.groundAt(np[0], np[2], P.pos[1] + 0.6) > 1.12 && w2 - P.pos[1] > 0.9) { np[0] = P.pos[0]; np[2] = P.pos[2]; P.vel[0] *= 0.3; P.vel[2] *= 0.3; }
    P.pos[0] = np[0]; P.pos[2] = np[2];
  }
  // a wall, rail or piece of furniture takes the part of the velocity that pushes into it, so the player keeps sliding along it and the footsteps stop when it is stuck
  { const got = hyp(P.pos[0] - px0, P.pos[2] - pz0), want = sp * dt; if (want > 1e-4 && got < want * 0.7) { P.vel[0] = (P.pos[0] - px0) / dt; P.vel[2] = (P.pos[2] - pz0) / dt; P.speed = got / dt; } }
  P.warned -= dt;
  // ground / gravity. On the ground the feet follow the surface exactly (ramps, stairs and drops of up to STEP_DOWN are walked, not fallen); the camera smooths the steps.
  const wasGround = P.onGround, STEP_DOWN = 0.62;
  const gy = World.groundAt(P.pos[0], P.pos[2], P.pos[1] + 0.6);
  // a jump is allowed for a moment after walking off an edge (coyote time)
  if (rp && rp.jump && (P.onGround || P.coyote > 0) && depth < 0.9) { P.vel[1] = 6.4 * (depth > 0.45 ? 0.7 : 1); P.onGround = false; P.coyote = 0; RPG.jumped(); }
  if (P.vel[1] > 0 || P.pos[1] > gy + (wasGround && P.vel[1] <= 0 ? STEP_DOWN : 0.05)) {
    P.vel[1] -= 20 * dt; let ny = P.pos[1] + P.vel[1] * dt; P.onGround = false; P.coyote = Math.max(0, P.coyote - dt);
    if (P.vel[1] > 0) {      // a rising head stops under a slab, a stair or a loft instead of passing through it
      const cu = World.ceilingAt(P.pos[0], P.pos[2], P.pos[1] + PLAYER_HEAD, ny + PLAYER_HEAD);
      if (cu !== null) { ny = Math.min(ny, Math.max(P.pos[1], cu - PLAYER_HEAD)); P.vel[1] = Math.min(P.vel[1], 0); }
    }
    P.pos[1] = ny;
    if (P.vel[1] <= 0 && P.pos[1] <= gy) {
      P.pos[1] = gy; P.onGround = true; P.dip = Math.min(0.16, -P.vel[1] * 0.014);
      if (P.vel[1] < -5 && typeof Audio2 !== 'undefined') Audio2.thud();
      if (typeof RPG !== 'undefined') RPG.landed(-P.vel[1], depth);
      P.vel[1] = 0;
    }
  } else { P.pos[1] = gy; P.vel[1] = 0; P.onGround = true; P.coyote = 0.12; }
  // camera height: smoothed while walking (steps, stairs, door sills), rigid in the air
  if (!P.onGround || Math.abs(P.camY - P.pos[1]) > 1.3) P.camY = P.pos[1]; else P.camY += (P.pos[1] - P.camY) * Math.min(1, dt * 14);
  P.dip += (0 - P.dip) * Math.min(1, dt * 9);
  // zone, surface
  const zone = World.zoneAt(P.pos[0], P.pos[1] + 1.0, P.pos[2]);
  if (CELLS_ON) { Cells.sync(P.pos); if (P.pos[1] < CELL.y - 30 && Cells.cur) Cells.rescue(); }
  World.camZone = zone; World.indoor = World.cell ? 1 : World.indoor + ((zone ? 1 : 0) - World.indoor) * Math.min(1, dt * 3.5);
  P.surface = zone ? (World.zones[zone - 1].site.id === 'chapel' ? 'stone' : 'wood') : P.inWater ? 'water' : (P.pos[1] > Terrain.y(P.pos[0], P.pos[2]) + 0.12 ? 'wood' : Terrain.splat(P.pos[0], P.pos[2], 1) > 0.4 ? 'stone' : Terrain.splat(P.pos[0], P.pos[2], 0) > 0.4 ? 'dirt' : 'grass');
  // head bob + footsteps
  const moving = P.speed > 0.4 && P.onGround; P.bobAmt += ((moving ? 1 : 0) - P.bobAmt) * Math.min(1, dt * 8);
  if (moving) { const prev = P.step; P.step += P.speed * dt * (P.speed > 4 ? 0.42 : 0.56); if (Math.floor(prev) !== Math.floor(P.step) && typeof Audio2 !== 'undefined') Audio2.step(P.surface, P.speed > 4); }
  P.bob = Math.sin(P.step * TAU) * 0.028 * P.bobAmt;
  const cam = R.cam; cam.pos[0] = P.pos[0]; cam.pos[1] = P.camY + P.eye + P.bob - P.dip; cam.pos[2] = P.pos[2]; cam.yaw = P.yaw + Math.cos(P.step * PI) * 0.0025 * P.bobAmt; cam.pitch = P.pitch;
}

function inputInit(canvas, layer) {
  const I = Input;
  addEventListener('keydown', e => { if (e.repeat) return; I.keys[e.code] = true; if (typeof onKey === 'function') onKey(e); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault(); });
  addEventListener('keyup', e => { I.keys[e.code] = false; });
  addEventListener('blur', () => { I.keys = {}; I.joy = null; I.look = null; });
  document.addEventListener('pointerlockchange', () => { I.plock = document.pointerLockElement === canvas; if (!I.plock && typeof onPointerUnlock === 'function') onPointerUnlock(); });
  addEventListener('mousemove', e => { if (I.plock) { I.lookX += e.movementX * 0.0022 * I.sens; I.lookY += e.movementY * 0.0022 * I.sens; } });
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  const down = e => {
    if (e.pointerType === 'mouse') { if (!I.plock && game.playing && !Player.locked) { I.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; if (canvas.requestPointerLock) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { } } } return; }
    I.touch = true; e.preventDefault();
    if (!game.playing || Player.locked) return;
    const left = e.clientX < innerWidth * 0.42;
    if (left && !I.joyT) { I.joyT = { id: e.pointerId, x: e.clientX, y: e.clientY }; I.joy = { x: 0, y: 0 }; stick.style.display = 'block'; stick.style.left = e.clientX + 'px'; stick.style.top = e.clientY + 'px'; knob.style.transform = 'translate(-50%,-50%)'; }
    else if (!I.look) I.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const move = e => {
    if (I.joyT && e.pointerId === I.joyT.id) { const R0 = 54; let dx = (e.clientX - I.joyT.x) / R0, dy = (e.clientY - I.joyT.y) / R0; const l = hyp(dx, dy); if (l > 1) { dx /= l; dy /= l; } I.joy = { x: Math.abs(dx) < 0.1 ? 0 : dx, y: Math.abs(dy) < 0.1 ? 0 : dy }; knob.style.transform = `translate(calc(-50% + ${dx * R0}px), calc(-50% + ${dy * R0}px))`; }
    else if (I.look && e.pointerId === I.look.id) { I.lookX += (e.clientX - I.look.x) * 0.0052 * I.sens; I.lookY += (e.clientY - I.look.y) * 0.0052 * I.sens; I.look.x = e.clientX; I.look.y = e.clientY; }
    else if (I.drag && e.pointerId === I.drag.id && !I.plock) { I.lookX += (e.clientX - I.drag.x) * 0.004 * I.sens; I.lookY += (e.clientY - I.drag.y) * 0.004 * I.sens; I.drag.x = e.clientX; I.drag.y = e.clientY; }
  };
  const up = e => { if (I.joyT && e.pointerId === I.joyT.id) { I.joyT = null; I.joy = null; stick.style.display = 'none'; } if (I.look && e.pointerId === I.look.id) I.look = null; if (I.drag && e.pointerId === I.drag.id) I.drag = null; };
  layer.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  layer.addEventListener('contextmenu', e => e.preventDefault());
  for (const ev of ['touchstart', 'touchmove', 'gesturestart']) layer.addEventListener(ev, e => e.preventDefault(), { passive: false });
}
