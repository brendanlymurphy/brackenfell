// ───────────────────────── upper storeys: stairs, floors with stairwells, lofts, rails ─────────────────────────
// Everything that gives a building a second level lives here (the stair that was glitchy, the floors the facades only pretended to have).
// All coordinates are house-local: x along the width, z along the depth, y up from the ground-floor surface (0.02 above the site's floorY).
//   buildStair(c, o)     a straight stair of kit steps (or boxes without the kit) with a walkable ramp that follows the visible nosings,
//                        side colliders so nothing can be fallen off, handrails, and spots + a World.stairs entry for villagers and tests
//   upperFloor(c, o)     the slab of a second storey with stairwell holes, rails round them, rafters, a roof lining and a light
//   roofClamp(c, ...)   walls of air under a sloping roof where a head would meet the rafters
// The walkable surface is a ramp, not steps: World.floors entries with y2 (see addFloor / World.groundAt in 78_player.js).
World.stairs = [];
const KSTAIR = { name: 'Stair_Interior_Solid', halfW: 0.88, y0: 0.211, slope: 0.7095, topY: 3.028, endZ: 4.352, treads: 14, runStep: 0.3051, riseStep: 0.2165 };
const STAIR_SHIFT = 0.07;        // m: the ramp runs this far below the nosing line, so it splits the difference between a tread's front and back edge
const FLOOR_T = 0.12;            // m: thickness of a storey's slab

// the numbers of a stair that climbs `rise` (relative to the base floor surface) with the kit stair scaled by (width, rise, run)
function stairGeom(rise, H, runScale, widthScale) {
  const sy = rise / KSTAIR.topY, sz = runScale || 1, sw = widthScale || 1, slope = KSTAIR.slope * sy / sz, b = KSTAIR.y0 * sy - STAIR_SHIFT;
  const Z0 = Math.max(-b / slope, -0.34 * sz), Z1 = (rise - b) / slope, ZE = KSTAIR.endZ * sz;
  return { sy, sz, sw, slope, b, Y: Z => b + slope * Z, Z0, Z1, ZE, Zh: Math.max(Z0, (H - 0.02 - 2.0 - b) / slope - 0.45), halfW: KSTAIR.halfW * sw };
}

// o: { name: 'stairs', axis: 'x'|'z', dir: +1|-1 (the way it climbs), lane: centre line, n0: coordinate of the first nosing, rise: top surface minus 0.02,
//      H: height of the slab above (for the head-room of the stairwell), runScale, rails: [-1, 1] (sides with a handrail), spot0/spot1 names }
function buildStair(c, o) {
  const m = c.int, kit = c.kit && typeof Kit !== 'undefined' && Kit.pieces[KSTAIR.name], ax = o.axis, dir = o.dir, lane = o.lane, n0 = o.n0, base = 0.02;
  const G = stairGeom(o.rise, o.H || 99, o.runScale, o.widthScale), hw = G.halfW, name = o.name || 'stairs', top = base + o.rise;
  const P = (Z, l) => ax === 'x' ? [n0 + dir * Z, l] : [l, n0 + dir * Z];
  const rect = (Za, Zb, la, lb) => { const p = P(Za, la), q = P(Zb, lb); return [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])]; };
  // ramp: low coordinate side first
  const ramp = (Za, Zb, ya, yb, flat) => {
    const r = rect(Za, Zb, lane - hw - 0.05, lane + hw + 0.05), lowFirst = dir > 0;       // a hand's breadth wider than the hole so no crack opens at the edge
    if (flat) addFloor(m, r[0], r[1], r[2], r[3], ya); else addFloor(m, r[0], r[1], r[2], r[3], lowFirst ? ya : yb, lowFirst ? yb : ya, ax);
  };
  ramp(G.Z0, G.Z1, base + G.Y(G.Z0), base + G.Y(G.Z1));
  ramp(G.Z1 - 0.03, G.ZE + 0.06, top, top, true);
  // the stair itself
  if (kit) {
    const ry = ax === 'x' ? (dir > 0 ? -PI / 2 : PI / 2) : (dir > 0 ? PI : 0), p = P(0, lane);
    kitIntBatch(c.zone).add(KSTAIR.name, KH.xf(c.kMS, p[0], base, p[1], [G.sw, G.sy, G.sz], ry), { zone: c.zone, skyVis: INT_AO });
  } else {        // no kit: solid steps up the same nosing line
    m.mat(MAT.PLANKS, COL.wood);
    for (let k = 0; k < KSTAIR.treads; k++) {
      const Zn = (0.002 + k * KSTAIR.runStep) * G.sz, Zb = Zn - KSTAIR.runStep * G.sz, y = base + G.sy * (KSTAIR.y0 + k * KSTAIR.riseStep), r = rect(Zb, Zn, lane - hw, lane + hw);
      m.box(r[0], base, r[1], r[2], y, r[3]);
    }
    const r = rect(KSTAIR.treads * KSTAIR.runStep * G.sz - 0.1, G.ZE, lane - hw, lane + hw); m.box(r[0], base, r[1], r[2], top, r[3]);
  }
  // side colliders in short pieces following the slope: the player can neither fall off nor walk in under it
  for (let Za = G.Z0; Za < G.ZE - 0.01; Za += 0.45) {
    const Zb = Math.min(G.ZE, Za + 0.45), yTop = base + Math.min(o.rise, G.Y(Zb)) + 1.5;
    for (const s of [-1, 1]) {
      const r = rect(Za, Zb, lane + s * (hw + 0.04) - 0.06, lane + s * (hw + 0.04) + 0.06), open = s === o.exit && Za >= G.Z1 - 0.5;
      addBoxCollider(m, r[0], r[1], r[2], r[3], base, open ? top - 0.5 : yTop);       // the exit side stays closed to the floor below (the stair is solid there) and open to the one above
    }
  }
  // keep furniture off the approaches (a collider that never stops the player but that kitDress's free-floor test respects)
  for (const [Za, Zb] of [[-1.3, -0.1], [G.ZE, G.ZE + 0.9]]) { const r = rect(Za, Zb, lane - hw, lane + hw); addBoxCollider(m, r[0], r[1], r[2], r[3], -50, -49); }
  // handrails on the open sides, up to where the slab (if any) begins
  const rails = o.rails || [-1, 1], zEnd = o.H ? G.Zh : G.ZE;
  m.mat(MAT.TIMBER, COL.timber);
  for (const s of rails) {
    const l = lane + s * (hw - 0.05), nP = Math.max(1, Math.round((zEnd - 0.0) / 1.1));
    for (let i = 0; i <= nP; i++) { const Z = zEnd * i / nP, p = P(Z, l), y = base + Math.max(0, G.Y(Z)); m.cbox(p[0], y - (i === 0 ? 0 : 0.0), p[1], i === 0 ? 0.11 : 0.06, (i === 0 ? 1.1 : 0.92), i === 0 ? 0.11 : 0.06, 4); }
    const a = P(0, l), b = P(zEnd, l); m.beam([a[0], base + G.Y(0) + 0.92, a[1]], [b[0], base + G.Y(zEnd) + 0.92, b[1]], 0.07, 0.06);
    m.beam([a[0], base + G.Y(0) + 0.45, a[1]], [b[0], base + G.Y(zEnd) + 0.45, b[1]], 0.04, 0.04);
  }
  // villagers' and the test's way points: a step before the first tread, a step past the top
  const heading = ax === 'x' ? (dir > 0 ? PI / 2 : -PI / 2) : (dir > 0 ? PI : 0), B = bounds(c), clampP = p => ax === 'x' ? [clamp(p[0], B.x0 + 0.45, B.x1 - 0.45), p[1]] : [p[0], clamp(p[1], B.z0 + 0.45, B.z1 - 0.45)], pb = clampP(P(-0.7, lane)), pt = clampP(P(G.ZE + 0.75, lane)), n0s = o.spot0 || name + '0', n1s = o.spot1 || name + '1';
  c.spot(n0s, pb[0], pb[1], heading, base);
  c.spot(n1s, pt[0], pt[1], heading, top + 0.01);
  const exitL = o.exit ? P(G.Z1 - 0.2, lane + o.exit * (hw + 0.3)) : null, exitW = exitL ? m4.tp(c.Ms, [exitL[0], top, exitL[1]]) : null;
  World.stairs.push({ exitPt: exitW, id: c.site.id + '.' + name, site: c.site.id, zone: c.zone, bottom: c.site.id + '.' + n0s, top: c.site.id + '.' + n1s, rise: o.rise, width: 2 * hw, upper: o.upper !== false });
  // the stairwell in the slab above and the level rails round it: across the near end, along the sides (the exit side stops short of the top so one can step off)
  const hole = rect(G.Zh, G.ZE, lane - hw, lane + hw), railSegs = [[P(G.Zh, lane - hw - 0.05), P(G.Zh, lane + hw + 0.05)]];
  for (const s of [-1, 1]) railSegs.push([P(G.Zh, lane + s * (hw + 0.05)), P(s === o.exit ? G.Z1 - 0.5 : G.ZE + 0.06, lane + s * (hw + 0.05))]);
  if (o.H) {        // the slab's edge round the stairwell is solid to a head that has risen into its thickness (a jump on the stair, a jump out of the well)
    const Hs = o.H + FLOOR_T, e = [rect(G.Zh - 0.03, G.Zh + 0.03, lane - hw - 0.09, lane + hw + 0.09), rect(G.Zh, G.ZE, lane - hw - 0.06, lane - hw), rect(G.Zh, G.ZE, lane + hw, lane + hw + 0.06)];
    for (const r of e) addBoxCollider(m, r[0], r[1], r[2], r[3], o.H - 0.02, Hs);
  }
  return { hole, rails: railSegs, G, P, rect, lane, hw, top, Hf: top, ax, dir };
}

// a rail along the edge of a stairwell or gallery, local coordinates a -> b, standing on the floor at height y; collider included
function floorRail(c, a, b, y, o) {
  o = o || {}; const m = c.int, len = hyp(b[0] - a[0], b[1] - a[1]); if (len < 0.08) return;
  m.mat(MAT.TIMBER, COL.timber);
  const n = Math.max(1, Math.round(len / 1.1));
  for (let i = 0; i <= n; i++) { const x = lerp(a[0], b[0], i / n), z = lerp(a[1], b[1], i / n); m.cbox(x, y, z, i === 0 || i === n ? 0.1 : 0.06, 1.0, i === 0 || i === n ? 0.1 : 0.06, 4); }
  m.beam([a[0], y + 1.0, a[1]], [b[0], y + 1.0, b[1]], 0.07, 0.06); m.beam([a[0], y + 0.5, a[1]], [b[0], y + 0.5, b[1]], 0.04, 0.04);
  if (o.collide !== false) { const t = 0.08; addBoxCollider(m, Math.min(a[0], b[0]) - t, Math.min(a[1], b[1]) - t, Math.max(a[0], b[0]) + t, Math.max(a[1], b[1]) + t, y + 0.05, y + 1.5); /* from the floor up: a head passing under the slab on the stair must not meet it */ }
}

// the slab of a second storey. holes: local rects [x0, z0, x1, z1] (stairwells); the kit's upper walls, gables and roof are already there.
// Draws floor, underside and the edges of the holes, rails the holes except on `open` sides, hangs rafters and a roof lining, and extends the zone.
function upperFloor(c, o) {
  o = o || {};
  const { w, d, H, hd, zone, ext, int, tanP } = c, e = 0.16, Yu = o.y === undefined ? H : o.y, Hf = Yu + FLOOR_T, A = o.area || [-w / 2 + e, -hd + e, w / 2 - e, hd - e], X0 = A[0], Z0 = A[1], X1 = A[2], Z1 = A[3];
  const holes = (o.holes || []).map(h => [clamp(h[0], X0, X1), clamp(h[1], Z0, Z1), clamp(h[2], X0, X1), clamp(h[3], Z0, Z1)]).filter(h => h[2] - h[0] > 0.1 && h[3] - h[1] > 0.1);
  const xs = [...new Set([X0, X1].concat(holes.flatMap(h => [h[0], h[2]])).map(v => +v.toFixed(3)))].sort((a, b) => a - b), zs = [...new Set([Z0, Z1].concat(holes.flatMap(h => [h[1], h[3]])).map(v => +v.toFixed(3)))].sort((a, b) => a - b);
  const inHole = (x, z) => holes.some(h => x > h[0] && x < h[2] && z > h[1] && z < h[3]);
  ext.m1 = zone; ext.ao = INT_AO * 0.9;
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
    const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1]; if (inHole((x0 + x1) / 2, (z0 + z1) / 2)) continue;
    ext.mat(MAT.PLANKS, COL.woodDark); ext.box(x0, Yu, z0, x1, Hf, z1, 4 | 8);
    ext.quad([x0, Hf, z0], [x0, Hf, z1], [x1, Hf, z1], [x1, Hf, z0], 0, 0, (x1 - x0) / ext.tile, (z1 - z0) / ext.tile);
    ext.mat(MAT.PLANKS, COL.wood); ext.quad([x0, Yu, z1], [x0, Yu, z0], [x1, Yu, z0], [x1, Yu, z1], 0, 0, (x1 - x0) / ext.tile, (z1 - z0) / ext.tile);
    addFloor(ext, x0, z0, x1, z1, Hf);
  }
  // level rails round the holes and along the open edges of a loft: the segments that run along a wall are dropped
  const onWall = (p, q) => (Math.abs(p[0] - X0) < 0.4 && Math.abs(q[0] - X0) < 0.4 && !o.area) || (Math.abs(p[0] - X1) < 0.4 && Math.abs(q[0] - X1) < 0.4 && !o.area) || (Math.abs(p[1] - Z0) < 0.4 && Math.abs(q[1] - Z0) < 0.4 && !o.area) || (Math.abs(p[1] - Z1) < 0.4 && Math.abs(q[1] - Z1) < 0.4 && !o.area);
  for (const [p, q] of o.rails || []) if (!onWall(p, q)) floorRail(c, p, q, Hf);
  // a roof lining and rafters: the room under the roof is part of the house
  if (o.rafters !== false && c.kYtop && !o.area) {
    const Yt = c.kYtop, roofU = z => Yt + (hd - Math.abs(z)) * tanP - 0.04;
    ext.mat(MAT.PLANKS, COL.woodDark); ext.m1 = zone; ext.ao = INT_AO * 0.9;
    for (const s of [-1, 1]) {
      const zE = hd - e, a = [X0, roofU(zE), s * zE], b = [X0, roofU(0), 0], cc = [X1, roofU(0), 0], dd = [X1, roofU(zE), s * zE];
      if (s < 0) ext.quad(a, b, cc, dd); else ext.quad(dd, cc, b, a);
    }
    int.mat(MAT.TIMBER, COL.timberDark);
    const nb = Math.max(2, Math.round((w - 2 * e) / 2.2)), ridge = Yt + hd * tanP;
    for (let i = 1; i <= nb; i++) {
      const x = X0 + (X1 - X0) * i / (nb + 1);
      int.box(x - 0.09, Yt - 0.2, Z0, x + 0.09, Yt, Z1);
      for (const s of [-1, 1]) int.beam([x, roofU(hd - e) - 0.1, s * (hd - e - 0.02)], [x, ridge - 0.14, s * 0.02], 0.1, 0.13);
    }
    int.box(X0, ridge - 0.26, -0.07, X1, ridge - 0.12, 0.07);
  }
  if (!o.area) c.zoneInfo.y1 = Math.max(c.zoneInfo.y1, c.floorY + (c.kYtop || H + 3) + hd * tanP + 1.5);
  ext.ao = 1; ext.m1 = 0;
  if (!o.area) c.upperDone = true;
  c.Hf = Hf;
  return { Hf, X0, X1, Z0, Z1 };
}

// something stands on the upper floor at (x, z) turned by rot: fn() draws it into c.int (Props.* and the colliders see the raised frame)
function upAt(c, x, z, rot, fn) { at(c.int, x, c.Hf, z, rot, fn); }
function upBed(c, name, x, z, rot, w, blanket, fur) { upAt(c, x, z, rot, () => Props.bed(c.int, w || 1.0, blanket, fur)); c.spot(name, x, z, -rot, c.Hf + 0.56, { lie: true }); }
function upChest(c, id, x, z, rot, loot) { upAt(c, x, z, rot, () => Props.chest(c.int)); c.interact(x, c.Hf + 0.5, z, { kind: 'chest', id: c.site.id + '.' + id, loot: loot || [['gold', 3]], r: 1.8 }); }
// a lamp on a hook under the rafters or on the table, and the light that goes with it
function upLantern(c, x, z, y) { at(c.int, x, y === undefined ? c.kYtop - 0.2 : y, z, 0, () => Props.lantern(c.int, c)); }

// head-room under a sloping roof: from the eaves inward, where a head (about 2 m) would meet the lining, a wall of air. x0..x1 along the ridge, yFloor the floor surface (local y).
function roofClamp(c, x0, x1, yFloor, roofBase, need) {
  const { hd, tanP } = c, base = roofBase === undefined ? c.H : roofBase, lim = hd - (yFloor + (need || 2.05) - base) / tanP;       // |z| beyond this: too low
  if (lim >= hd - 0.2) return lim;
  const L = Math.max(lim, 0.4);
  for (const s of [-1, 1]) addBoxCollider(c.int, x0, s > 0 ? L : -hd, x1, s > 0 ? hd : -L, yFloor - 0.1, yFloor + 3);
  return L;
}

// ── the inn: kit stair along the back wall up to a gallery with a rail, two guest rooms off it, a gable window each ──
// Spots (stairs0, stairs1, guestbed, bed2) and interact ids (inn.bed, inn.chest, inn.note) are what the quests and villagers use.
function innGallery(c) {
  const m = c.int, B = bounds(c), LY = 2.6, LX = 2.4, Hf = LY + 0.03, PX = 4.2, ZC = 0.3, sz0 = 2.67;
  c.Hf = Hf;
  const S = buildStair(c, { name: 'stairs', axis: 'x', dir: 1, lane: 3.55, n0: LX - KSTAIR.endZ, rise: Hf - 0.02, rails: [-1], spot0: 'stairs0', spot1: 'stairs1' });
  // gallery floor, edge beam, joists, posts
  m.mat(MAT.PLANKS, COL.wood); m.box(LX, LY - 0.07, B.z0, B.x1, LY + 0.02, B.z1);
  m.mat(MAT.TIMBER, COL.timber); m.box(LX - 0.1, LY - 0.26, B.z0, LX + 0.1, LY - 0.07, B.z1);
  for (let x = LX + 1.1; x < B.x1; x += 1.15) m.box(x - 0.07, LY - 0.24, B.z0, x + 0.07, LY - 0.07, B.z1, 8);
  for (const z of [-2.2, 2.3]) { m.cbox(LX, 0.02, z, 0.18, LY - 0.28, 0.18, 12); addCircleCollider(m, LX, z, 0.12, 0.02, LY); }
  addFloor(m, LX, B.z0, B.x1, B.z1, Hf);
  floorRail(c, [LX + 0.06, B.z0 + 0.12], [LX + 0.06, sz0 - 0.1], Hf);
  // head-room under the eaves
  roofClamp(c, LX, B.x1, Hf);
  // partitions: x = PX with a doorway into each room, z = ZC between them
  const wall = (x0, z0, x1, z1) => {
    m.mat(MAT.PLASTER, [0.97, 0.93, 0.86]); m.box(x0, Hf, z0, x1, Hf + 2.35, z1); m.mat(MAT.TIMBER, COL.timberDark);
    if (x1 - x0 < z1 - z0) { m.box(x0 - 0.02, Hf, z0, x1 + 0.02, Hf + 0.12, z1); m.box(x0 - 0.03, Hf + 2.25, z0, x1 + 0.03, Hf + 2.38, z1); } else { m.box(x0, Hf, z0 - 0.02, x1, Hf + 0.12, z1 + 0.02); m.box(x0, Hf + 2.25, z0 - 0.03, x1, Hf + 2.38, z1 + 0.03); }
    addBoxCollider(m, x0, z0, x1, z1, Hf, Hf + 2.4);
  };
  const dA = [-2.9, -1.9], dB = [1.25, 2.25], t = 0.07;
  wall(PX - t, B.z0, PX + t, dA[0]); wall(PX - t, dA[1], PX + t, dB[0]); wall(PX - t, dB[1], PX + t, B.z1); wall(PX + t, ZC - t, B.x1, ZC + t);
  m.mat(MAT.TIMBER, COL.timberDark); for (const d of [dA, dB]) { m.box(PX - 0.1, Hf, d[0] - 0.08, PX + 0.1, Hf + 2.38, d[0]); m.box(PX - 0.1, Hf, d[1], PX + 0.1, Hf + 2.38, d[1] + 0.08); m.box(PX - 0.1, Hf + 2.0, d[0], PX + 0.1, Hf + 2.38, d[1]); }
  // room A: the player's bed by the window, a chest, the table with the note, a stool
  upAt(c, 6.15, -2.0, -PI / 2, () => Props.bed(c.int, 1.0, COL.green));
  c.spot('guestbed', 6.15, -2.0, PI / 2, Hf + 0.56, { lie: true });
  upChest(c, 'chest', 6.7, -3.85, PI / 2, [['gold', 6], ['apple', 1]]);
  upAt(c, 5.0, -3.9, 0, () => { Props.table(m, 1.0, 0.6); at(m, 0, 0.76, 0, 0, () => Props.candle(m, c, true)); at(m, 0.3, 0.76, 0.05, 0.4, () => Props.book(m, COL.blue)); });
  upAt(c, 5.0, -3.2, 0, () => Props.stool(m));
  upAt(c, 5.5, -1.0, 0.1, () => Props.rug(m, 1.8, 1.2, COL.blue));
  // room B: two beds
  upAt(c, 6.15, 1.5, -PI / 2, () => Props.bed(c.int, 1.0, COL.blue));
  c.spot('bed2', 6.15, 1.5, PI / 2, Hf + 0.56, { lie: true });
  upAt(c, 6.15, 3.15, -PI / 2, () => Props.bed(c.int, 0.9, [0.55, 0.35, 0.2]));
  c.spot('bed3', 6.15, 3.15, PI / 2, Hf + 0.56, { lie: true });
  upAt(c, 4.9, 2.2, 0, () => { Props.table(m, 0.7, 0.5); at(m, 0, 0.76, 0, 0, () => Props.candle(m, c, true)); });
  upAt(c, 5.2, 0.9, 0, () => Props.rug(m, 1.4, 1.0, [0.55, 0.18, 0.14]));
  // the corridor: a rug and a lamp
  upAt(c, 3.3, -0.4, 0, () => Props.rug(m, 1.0, 3.2, [0.35, 0.3, 0.2]));
  for (const z of [-0.7, 3.0]) { m.mat(MAT.METAL, COL.black); m.box(PX - 0.3, Hf + 2.05, z - 0.02, PX - 0.06, Hf + 2.09, z + 0.02); upLantern(c, PX - 0.28, z, Hf + 2.05); }       // lamps on brackets on the partition
  c.interact(6.15, Hf + 0.55, -2.0, { kind: 'bed', id: 'inn.bed', r: 1.9 });
  c.interact(6.7, Hf + 0.45, -3.85, { kind: 'chest', id: 'inn.chest', loot: [['gold', 6], ['apple', 1]], r: 1.7 });
  c.interact(5.0, Hf + 0.9, -3.9, { kind: 'read', id: 'inn.note', title: 'A note on the table', text: 'Traveller — the bed by the window is yours for as long as you stay. Breakfast when the cock crows, ale when the sun sets. — G.', r: 1.5 });
  return S;
}
