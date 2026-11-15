// ───────────────────────── the wilds: twelve places outside the village ─────────────────────────
// Layout and terrain are in 55c_wilds.js. Here every place is built twice over: generated meshes (the village's own materials, one mesh per place in a pack of
// its own, hidden beyond 125 m by the scene's maxDist rule and never in the shadow maps) at boot, and kit pieces (scanned rocks and stumps, flowers, boats, the
// hamlet's houses) in batches made once the kit is ready (wildsAttach), hidden as a whole beyond 125 m. Pickups are skinned objects like the frostcaps; readable
// things, doors and boxes are World.interact entries whose behaviour is in 81_wilds_story.js.
const WB = { kit: {}, built: false, attached: false, groups: [], picks: [], tris: 0, water: [], bridges: [], fall: null, byId: {} };
const wy = (x, z) => Terrain.y(x, z);
const wcol = (x, z, r, h, y0) => { const y = wy(x, z); World.colliders.push({ x, z, r, y0: (y0 === undefined ? y : y0) - 0.6, y1: y + (h || 1.6) }); };
// put something on the ground at an offset (lx, lz) from the place's centre, turned `rot` (a heading: 0 faces north, PI/2 east)
function wPut(m, p, lx, lz, rot, fn, dy) {
  const q = siteToWorld(p, lx, lz), y = wy(q[0], q[1]);
  m.push().T(q[0], y + (dy || 0), q[1]).RY(-(p.yaw + (rot || 0))); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0;
  fn(m, q[0], y, q[1]); m.pop(); return [q[0], y, q[1]];
}
// kit pieces to be placed when the kit is ready: name (or a function returning one), world x z, { s, ry, dy, tint, col: collider radius, h }
function wKit(p, name, lx, lz, o) {
  o = o || {}; const q = siteToWorld(p, lx, lz), y = wy(q[0], q[1]);
  (WB.kit[p.id] = WB.kit[p.id] || []).push({ name, x: q[0], y: y + (o.dy || 0), z: q[1], s: o.s === undefined ? 1 : o.s, ry: o.ry === undefined ? 0 : o.ry, rx: o.rx || 0, rz: o.rz || 0, tint: o.tint, inst: !!o.inst, maxDist: o.maxDist, wind: o.wind });
  if (o.col) World.colliders.push({ x: q[0], z: q[1], r: o.col, y0: y - 0.6, y1: y + (o.h || 1.4) });
  return [q[0], y, q[1]];
}
const wRead = (id, title, text, p, r) => World.interact.push({ p, r: r || 2.4, zone: 0, kind: 'read', id, title, text });
// a log lying along local x, resting on the ground: radius r, length len
function wLog(m, len, r, col) {
  m.mat(MAT.BARK, col || [1, 1, 1], 0.5); m.push().T(0, r, 0).RZ(PI / 2).T(0, -len / 2, 0); m.cyl(0, 0, 0, r, r * 0.94, len, 8, 0);
  m.mat(MAT.PLAIN, [0.62, 0.5, 0.34]); m.disc(0, len, 0, r * 0.94, 8, 1); m.disc(0, 0, 0, r, 8, -1); m.pop();
}
// a stack of logs: cols x rows, ends toward +-x, with a stake at each end
function wLogStack(m, cols, rows, len, r, tint) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols - (j % 2); i++) { m.push().T(0, j * r * 1.75, (i - (cols - 1 - (j % 2)) / 2) * r * 2.04); wLog(m, len * (0.95 + ((i * 7 + j * 3) % 5) * 0.025), r, tint); m.pop(); }
  m.mat(MAT.TIMBER, COL.timberDark); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * (len / 2 + 0.12), -0.1, sz * (cols * r * 1.02 + 0.05), 0.1, rows * r * 1.75 + r + 0.2, 0.1, 4);
  addBoxCollider(m, -len / 2, -cols * r * 1.05, len / 2, cols * r * 1.05, 0, rows * r * 1.8 + r);
}
// a tapered standing stone, `h` tall; w wide; leaning `lean` radians
function wStone(m, w, h, lean, tint) {
  m.push().RZ(lean || 0).S(1, 1, 0.62); m.mat(MAT.ROCK, tint || [0.92, 0.92, 0.9], 0.55);
  m.lathe([[w * 0.55, -0.7], [w * 0.5, h * 0.35], [w * 0.42, h * 0.75], [w * 0.26, h * 0.97], [0.05, h * 1.04]], 6, 0); m.pop();
}
// timber post-and-rail fence along a polyline of world points; opens a gap of `gap` metres at the arclengths in o.gaps. Posts every 2.2 m, two rails.
function wFence(m, pts, o) {
  o = o || {}; const hgt = o.h || 1.0; let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = hyp(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 2.2));
    for (let k = 0; k < n; k++) {
      const x0 = lerp(a[0], b[0], k / n), z0 = lerp(a[1], b[1], k / n), x1 = lerp(a[0], b[0], (k + 1) / n), z1 = lerp(a[1], b[1], (k + 1) / n), y0 = wy(x0, z0), y1 = wy(x1, z1), mid = acc + (k + 0.5) * L / n;
      if (o.gaps && o.gaps.some(g => Math.abs(mid - g) < 1.4)) continue;
      m.m1 = 0; m.ao = 1; m.grad = null; m.mat(MAT.TIMBER, o.col || COL.timber);
      m.push().T(x0, y0, z0); m.cbox(0, -0.35, 0, 0.1, hgt + 0.35, 0.1, 4); m.pop();
      if (i === pts.length - 2 && k === n - 1) { m.push().T(x1, y1, z1); m.cbox(0, -0.35, 0, 0.1, hgt + 0.35, 0.1, 4); m.pop(); }
      for (const hh of o.rails || [0.42, 0.84]) m.beam([x0, y0 + hh * hgt, z0], [x1, y1 + hh * hgt, z1], 0.045, 0.1);
      if (o.col2 !== false) { m.push().T((x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2).RY(-Math.atan2(z1 - z0, x1 - x0)); const l = hyp(x1 - x0, z1 - z0) / 2; addBoxCollider(m, -l, -0.07, l, 0.07, -0.2, 1.1); m.pop(); }
    }
    acc += L;
  }
}
// a dry-stone wall: low, grey, mossy
function wWall(m, pts, o) {
  o = o || {}; const hgt = o.h || 0.8;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = hyp(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 1.6));
    for (let k = 0; k < n; k++) {
      const x0 = lerp(a[0], b[0], k / n), z0 = lerp(a[1], b[1], k / n), x1 = lerp(a[0], b[0], (k + 1) / n), z1 = lerp(a[1], b[1], (k + 1) / n), y0 = wy(x0, z0), y1 = wy(x1, z1), mid = (i * 100 + k) * 1.0;
      if (o.gaps && o.gaps.some(g => hyp((x0 + x1) / 2 - g[0], (z0 + z1) / 2 - g[1]) < 1.3)) continue;
      m.m1 = 0; m.ao = 1; m.grad = null; m.push().T((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).RY(-Math.atan2(z1 - z0, x1 - x0)); const l = hyp(x1 - x0, z1 - z0) / 2 + 0.04, hh = hgt * (0.85 + 0.3 * ((mid * 7.3) % 1));
      m.mat(MAT.STONE, [0.9, 0.9, 0.88], 0.8); m.box(-l, -0.5, -0.22, l, hh, 0.22, 4); m.mat(MAT.MOSS, [0.8, 0.85, 0.75], 0.8); m.box(-l * 0.9, hh, -0.2, l * 0.9, hh + 0.06, 0.2);
      addBoxCollider(m, -l, -0.23, l, 0.23, -0.5, hh + 0.1); m.pop();
    }
  }
}
// a hut: walls of a given material, a gable roof along x, an open door in the -z wall (or none), returns nothing; w x d footprint centred on the origin
function wHut(m, w, d, o) {
  o = o || {}; const hh = o.h || 2.3, rise = o.rise || 1.2, wall = o.wall || MAT.PLANKS, wc = o.wc || COL.woodDark, dw = o.door === undefined ? 0.5 : o.door;
  m.mat(MAT.STONE, [0.85, 0.85, 0.82], 0.8); m.box(-w / 2 - 0.05, -0.4, -d / 2 - 0.05, w / 2 + 0.05, 0.35, d / 2 + 0.05, 8);
  m.mat(wall, wc, 0.9);
  m.box(-w / 2, 0.35, d / 2 - 0.12, w / 2, hh, d / 2, 0); m.box(-w / 2, 0.35, -d / 2, -w / 2 + 0.12, hh, d / 2); m.box(w / 2 - 0.12, 0.35, -d / 2, w / 2, hh, d / 2);
  if (dw > 0) { m.box(-w / 2, 0.35, -d / 2, -dw, hh, -d / 2 + 0.12); m.box(dw, 0.35, -d / 2, w / 2, hh, -d / 2 + 0.12); m.box(-dw, 2.0, -d / 2, dw, hh, -d / 2 + 0.12); }
  else m.box(-w / 2, 0.35, -d / 2, w / 2, hh, -d / 2 + 0.12);
  m.mat(MAT.PLANKS, [0.5, 0.42, 0.34]); m.box(-w / 2 + 0.12, 0.3, -d / 2 + 0.12, w / 2 - 0.12, 0.36, d / 2 - 0.12);
  const yR = hh + rise, ov = 0.5, zf = -d / 2 - ov, zb = d / 2 + ov;
  m.mat(o.roof || MAT.THATCH, o.rc || [0.85, 0.78, 0.6], 0.9);
  m.quad2([-w / 2 - 0.3, yR, 0], [-w / 2 - 0.3, hh - 0.2, zf], [w / 2 + 0.3, hh - 0.2, zf], [w / 2 + 0.3, yR, 0]); m.quad2([w / 2 + 0.3, yR, 0], [w / 2 + 0.3, hh - 0.2, zb], [-w / 2 - 0.3, hh - 0.2, zb], [-w / 2 - 0.3, yR, 0]);
  m.mat(wall, wc, 0.9); m.poly([[-w / 2, hh, -d / 2 + 0.1], [w / 2, hh, -d / 2 + 0.1], [0, yR - 0.05, -d / 2 + 0.1]].reverse()); m.poly([[-w / 2, hh, d / 2 - 0.1], [w / 2, hh, d / 2 - 0.1], [0, yR - 0.05, d / 2 - 0.1]]);
  m.mat(MAT.TIMBER, COL.timberDark); m.beam([-w / 2 - 0.3, yR + 0.02, 0], [w / 2 + 0.3, yR + 0.02, 0], 0.12, 0.12);
  addBoxCollider(m, -w / 2, -d / 2, w / 2, d / 2, 0, hh + 0.4);
  if (dw > 0) m.mat(MAT.PLAIN, [0.05, 0.04, 0.035]), m.box(-dw + 0.05, 0.3, -d / 2 + 0.1, dw - 0.05, 2.0, -d / 2 + 0.14);
}
// a cairn of stacked stones, h about 0.9 m
function wCairn(m, R, n) { m.mat(MAT.ROCK, [0.9, 0.9, 0.88], 0.5); let y = 0, r = 0.34; for (let i = 0; i < (n || 4); i++) { m.ball(R.s() * 0.04, y + r * 0.45, R.s() * 0.04, r, r * 0.55, r * 0.9, 7, 4); y += r * 0.72; r *= 0.76; } }
// a plank bridge between two world points, y from the ground at each end (or deckY(p)), rails on both sides, registered as a floor and a pair of rail colliders
function wBridge(m, a, b, o) {
  o = o || {}; const w = o.w || 1.5, L = hyp(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), ya = o.ya === undefined ? wy(a[0], a[1]) + 0.12 : o.ya, yb = o.yb === undefined ? wy(b[0], b[1]) + 0.12 : o.yb, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  m.m1 = 0; m.ao = 1; m.grad = null; m.wind = 0; m.push().T(mx, 0, mz).RY(-ang);
  m.mat(MAT.PLANKS, o.col || [0.62, 0.56, 0.5], 0.55); m.beam([-L / 2, ya - 0.08, 0], [L / 2, yb - 0.08, 0], w, 0.16);
  addFloor(m, -L / 2, -w / 2, L / 2, w / 2, ya, yb, 'x');
  m.mat(MAT.TIMBER, COL.timberDark);
  for (const s of [-1, 1]) {
    m.beam([-L / 2, ya + 0.5, s * (w / 2 - 0.05)], [L / 2, yb + 0.5, s * (w / 2 - 0.05)], 0.05, 0.1); m.beam([-L / 2, ya + 0.95, s * (w / 2 - 0.05)], [L / 2, yb + 0.95, s * (w / 2 - 0.05)], 0.06, 0.1);
    const nP = Math.max(2, Math.round(L / 2) + 1); for (let i = 0; i < nP; i++) { const t = i / (nP - 1), x = lerp(-L / 2, L / 2, t), y = lerp(ya, yb, t); m.cbox(x, y - 0.3, s * (w / 2 - 0.05), 0.11, 1.28, 0.11, 4); }
    addBoxCollider(m, -L / 2, s * (w / 2 - 0.05) - 0.07, L / 2, s * (w / 2 - 0.05) + 0.07, Math.min(ya, yb) - 0.05, Math.max(ya, yb) + 1.15);
  }
  m.pop(); return { L, ang };
}
// a tiny pickup mesh (one per kind): fn draws it around the origin on the ground
function wPickMesh(fn) { const m = new Mesh(256); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; fn(m); return World.skinPack.add(m); }
const PICKMESH = {
  tuft(m, c1, c2, n) { m.mat(MAT.PLAIN, c1); m.tube([[0, 0, 0], [0.02, 0.13, 0.01], [0, 0.24, 0]], 0.012, 5); for (let i = 0; i < (n || 5); i++) { const a = i * TAU / (n || 5); m.quad2([Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17], [Math.cos(a + 0.5) * 0.05, 0.02, Math.sin(a + 0.5) * 0.05], [0, 0.03, 0], [Math.cos(a - 0.5) * 0.05, 0.02, Math.sin(a - 0.5) * 0.05]); } m.mat(MAT.PLAIN, c2); m.ball(0, 0.27, 0, 0.055, 0.05, 0.055, 7, 4); for (let i = 0; i < 3; i++) { const a = i * 2.1; m.ball(Math.cos(a) * 0.09, 0.22 + i * 0.01, Math.sin(a) * 0.09, 0.035, 0.03, 0.035, 6, 4); } },
  mushrooms(m) { for (const [x, z, s] of [[0, 0, 1], [0.12, 0.07, 0.7], [-0.1, 0.09, 0.8]]) { m.mat(MAT.PLAIN, [0.84, 0.78, 0.6]); m.cyl(x, 0, z, 0.025 * s, 0.032 * s, 0.09 * s, 6, 0); m.mat(MAT.PLAIN, [0.9, 0.62, 0.18]); m.ball(x, 0.1 * s, z, 0.07 * s, 0.035 * s, 0.07 * s, 8, 4); } },
  honey(m) { m.mat(MAT.PLANKS, COL.wood, 0.4); m.box(-0.15, 0, -0.11, 0.15, 0.04, 0.11); m.mat(MAT.PLAIN, [0.78, 0.52, 0.12]); m.box(-0.11, 0.04, -0.08, 0.11, 0.1, 0.08); m.mat(MAT.PLAIN, [0.9, 0.7, 0.3]); m.box(-0.1, 0.1, -0.07, 0.1, 0.105, 0.07); },
  axe(m) { m.push().RZ(PI / 2 - 0.2).RY(0.5); m.mat(MAT.TIMBER, COL.wood); m.box(-0.02, 0, -0.02, 0.02, 0.62, 0.02); m.mat(MAT.METAL, [0.55, 0.55, 0.58]); m.box(-0.015, 0.5, -0.02, 0.015, 0.62, 0.1); m.box(-0.012, 0.5, -0.05, 0.012, 0.6, 0.02); m.pop(); },
  sword(m) { m.push().RZ(PI / 2 - 0.1).RY(0.7); m.mat(MAT.METAL, [0.5, 0.36, 0.28]); m.box(-0.022, 0.16, -0.005, 0.022, 0.9, 0.005); m.poly([[-0.022, 0.9, 0], [0.022, 0.9, 0], [0, 0.98, 0]]); m.poly([[0.022, 0.9, 0], [-0.022, 0.9, 0], [0, 0.98, 0]]); m.box(-0.09, 0.14, -0.012, 0.09, 0.165, 0.012); m.mat(MAT.PLAIN, COL.leather); m.box(-0.014, 0, -0.014, 0.014, 0.14, 0.014); m.pop(); },
  coins(m) { m.mat(MAT.METAL, [0.78, 0.6, 0.2]); for (let i = 0; i < 9; i++) { const a = i * 2.3; m.cyl(Math.cos(a) * 0.1 * (i % 3) * 0.6, 0.012 * (i % 4), Math.sin(a) * 0.1 * (i % 3) * 0.6, 0.032, 0.032, 0.008, 8, 3); } },
  key(m) { m.mat(MAT.METAL, [0.2, 0.17, 0.15]); m.push().RX(-PI / 2).T(0, 0, 0.012); m.box(-0.012, 0, -0.012, 0.012, 0.2, 0.012); m.cyl(0, 0.2, 0, 0.05, 0.05, 0.02, 8, 3); m.box(-0.012, 0, -0.012, 0.05, 0.03, 0.012); m.box(-0.012, 0.05, -0.012, 0.04, 0.075, 0.012); m.pop(); },
  fish(m) { m.mat(MAT.PLAIN, [0.5, 0.36, 0.2]); for (const [x, z, a] of [[0, 0, 0], [0.04, 0.12, 0.2]]) { m.push().T(x, 0.03, z).RY(a); m.ball(0, 0, 0, 0.045, 0.035, 0.17, 7, 4); m.poly([[0, 0, 0.16], [0.05, 0.01, 0.26], [-0.05, 0.01, 0.26]]); m.pop(); } },
  cap(m) { m.mat(MAT.CLOTH, [0.34, 0.27, 0.2], 0.4); m.ball(0, 0.05, 0, 0.12, 0.07, 0.12, 9, 4); m.mat(MAT.CLOTH, [0.28, 0.22, 0.17], 0.4); m.cyl(0, 0, 0, 0.125, 0.125, 0.025, 9, 3); },
  apple(m) { m.mat(MAT.PLAIN, [0.5, 0.18, 0.1]); for (const [x, z] of [[0, 0], [0.1, 0.05], [-0.06, 0.1]]) m.ball(x, 0.04, z, 0.045, 0.04, 0.045, 7, 4); },
  bundle(m) { m.mat(MAT.CLOTH, [0.4, 0.36, 0.28], 0.4); m.ball(0, 0.1, 0, 0.14, 0.1, 0.12, 8, 5); m.mat(MAT.PLAIN, COL.leather); m.cyl(0, 0.0, 0, 0.145, 0.145, 0.02, 8, 3); },
};
// pickups: id, world position, label, item id, which mesh, glow colour (blue like the frostcaps) or none
function wPick(id, p3, label, item, mesh, glow) {
  const key = typeof mesh === 'string' ? mesh : mesh.k; WB.pm = WB.pm || {}; const mi = WB.pm[key] || (WB.pm[key] = wPickMesh(typeof mesh === 'string' ? PICKMESH[mesh] : mesh.f));
  const obj = addSkinned(mi, { c: p3, r: 0.6, zone: 0, kind: 'pickup' }); R.boneData.set(m4.translate(m4.create(), p3[0], p3[1], p3[2]), obj.slot * 256);
  const it = { kind: 'pickup', id, item, p: [p3[0], p3[1] + 0.2, p3[2]], r: 1.9, zone: 0, obj, label, wild: true }; World.interact.push(it); World.pickups.push(it);
  if (glow) { it.em = { type: 'herb', p: p3, zone: 0 }; World.emitters.push(it.em); }
  WB.picks.push(it); return it;
}
const wGround = (p, lx, lz) => { const q = siteToWorld(p, lx, lz); return [q[0], wy(q[0], q[1]), q[1]]; };

// ── Highfold's two enterable houses go through the village's own path (HOUSES -> buildHouse -> a cell reached by its door); the other two stay shells ──
if (typeof HOUSES !== 'undefined' && typeof KIT_STYLE !== 'undefined' && WILDS.on) {
  HOUSES['high.a'] = {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [1, 0.93, 0.84], shutter: [0.32, 0.44, 0.34],
    doors: [{ wall: 'front', pos: 0.9 }], windows: [{ wall: 'front', pos: -1.6 }, { wall: 'back', pos: -1.2 }, { wall: 'right', pos: -0.8 }],
    interior(c) { cottageInterior(c, { blanket: COL.green, tableItems: ['mug', 'plate', 'candle', 'loaf'], loot: [['gold', 9]] }); }
  };
  HOUSES['high.c'] = {
    H: 2.4, walls: 'timber', roof: 'thatch', plaster: [0.96, 0.92, 0.82], shutter: [0.5, 0.36, 0.3],
    doors: [{ wall: 'front', pos: -0.9 }], windows: [{ wall: 'front', pos: 1.5 }, { wall: 'back', pos: 1.2 }],
    interior(c) { cottageInterior(c, { blanket: COL.purple, fur: true, tableItems: ['bowl', 'bottle', 'candle', 'pot'], loot: [['gold', 6], ['apple', 2]] }); }
  };
  KIT_STYLE['high.a'] = { timber: true, shingle: true, ground: 'plaster', vines: 2 }; KIT_STYLE['high.c'] = { timber: true, shingle: true, ground: 'plaster', vines: 1 };
  for (const id of ['high.a', 'high.c']) { const st = SITE[id], h = WILDS.houses.find(k => k.id === id); if (st) { st.floors = 1; st.w = h.w = id === 'high.a' ? 6.4 : 6.0; st.d = h.d = id === 'high.a' ? 5.2 : 5.0; h.floors = 1; h.cell = true; } }
}
// ───────────────────────── the builders: one per place ─────────────────────────
const WBUILD = {};
WBUILD.shrine = (p, m, R) => {
  // a small stone shrine under a shingled gable, offerings in the niche, a candle that never quite goes out; a milestone and a leaning signpost at the fork
  wPut(m, p, 3.4, -5.2, PI, mm => {   // QA: moved 3.4 m east, it stood on the lumber path
    mm.mat(MAT.STONE, [0.86, 0.86, 0.82], 0.8); mm.box(-0.95, -0.4, -0.7, 0.95, 0.3, 0.7); mm.box(-0.7, 0.3, -0.5, 0.7, 1.55, 0.5);
    mm.mat(MAT.PLAIN, [0.06, 0.05, 0.045]); mm.box(-0.34, 0.62, -0.52, 0.34, 1.32, -0.45);
    mm.mat(MAT.STONE, [0.7, 0.7, 0.66], 0.8); mm.box(-0.42, 0.6, -0.56, 0.42, 0.66, -0.4); mm.box(-0.42, 1.3, -0.56, 0.42, 1.36, -0.4);
    mm.mat(MAT.SHINGLE, [0.6, 0.56, 0.5], 0.7); mm.quad2([0, 2.15, 0], [-0.95, 1.5, -0.72], [0.95, 1.5, -0.72], [0, 2.15, 0]); mm.quad2([-0.95, 1.5, 0.72], [-0.02, 2.15, 0.02], [0.02, 2.15, 0.02], [0.95, 1.5, 0.72]);
    mm.quad2([-1.0, 1.5, -0.75], [-1.0, 1.5, 0.75], [0, 2.18, 0.75], [0, 2.18, -0.75]); mm.quad2([1.0, 1.5, 0.75], [1.0, 1.5, -0.75], [0, 2.18, -0.75], [0, 2.18, 0.75]);
    mm.mat(MAT.STONE, [0.8, 0.8, 0.77], 0.8); mm.box(-0.05, 2.1, -0.05, 0.05, 2.5, 0.05); mm.box(-0.2, 2.3, -0.05, 0.2, 2.38, 0.05);
    mm.mat(MAT.PLAIN, [0.8, 0.74, 0.55]); mm.cyl(-0.18, 0.66, -0.47, 0.035, 0.03, 0.16, 6, 2); mm.mat(MAT.PLAIN, [0.5, 0.24, 0.2]); mm.cyl(0.14, 0.66, -0.47, 0.05, 0.04, 0.05, 7, 3); mm.mat(MAT.PLAIN, [0.55, 0.62, 0.3]); mm.ball(0.02, 0.7, -0.47, 0.06, 0.04, 0.05, 6, 4);
    addBoxCollider(mm, -0.95, -0.7, 0.95, 0.7, 0, 2.0);
  });
  { const c = wGround(p, 3.4, -5.9); World.emitters.push({ type: 'candle', p: [c[0] - 0.18, c[1] + 0.85, c[2] + 0.0], zone: 0, always: true, seed: 0.41 }); }
  // two flat stones before it to kneel on, a bundle of rags on a dead branch
  for (const [x, z, r] of [[2.9, -3.9, 0.3], [3.95, -3.7, -0.2]]) wPut(m, p, x, z, r, mm => { mm.mat(MAT.STONE, [0.8, 0.8, 0.77], 0.8); mm.cbox(0, 0, 0, 0.7, 0.1, 0.5, 4); });
  wPut(m, p, -4.2, -3.2, 0, mm => { mm.mat(MAT.BARK, [0.5, 0.45, 0.4], 0.6); mm.tube([[0, -0.2, 0], [0.04, 1.4, 0.02], [0.0, 2.4, -0.04]], [0.07, 0.05, 0.02], 6);
    mm.beam([0.02, 1.7, 0], [0.9, 2.3, 0.2], 0.04, 0.04); mm.beam([0.02, 1.2, 0], [-0.8, 1.9, -0.1], 0.04, 0.04); mm.mat(MAT.CLOTH, [0.55, 0.2, 0.16], 0.5); for (const [x, y, c] of [[0.6, 2.2, 0], [0.3, 2.0, 1], [-0.5, 1.75, 2], [-0.7, 1.9, 0]]) { mm.quad2([x, y, 0.02], [x - 0.03, y - 0.34, 0.02], [x + 0.06, y - 0.36, 0.04], [x + 0.08, y, 0.02]); }
    addCircleCollider(mm, 0, 0, 0.14, 0, 2); });
  // milestone and signpost at the foot of the lumber path
  wPut(m, p, 4.6, 2.9, 0.5, mm => { mm.mat(MAT.ROCK, [0.9, 0.9, 0.88], 0.5); mm.box(-0.22, -0.2, -0.12, 0.22, 0.85, 0.12); mm.push().T(0, 0.85, 0).RX(PI / 2).T(0, -0.12, 0); mm.cyl(0, 0, 0, 0.22, 0.22, 0.24, 8, 3); mm.pop(); mm.mat(MAT.PLAIN, [0.1, 0.1, 0.1]); mm.box(-0.12, 0.45, 0.118, 0.12, 0.6, 0.125); addBoxCollider(mm, -0.25, -0.15, 0.25, 0.15, 0, 1.2); });
  const sp = wPut(m, p, -3.4, 2.8, 0.25, mm => { Props.signPost(mm, 3); addCircleCollider(mm, 0, 0, 0.14, 0, 2.5); });
  wRead('sign.shrine', 'A weathered sign', 'Boards nailed one above another, the paint long gone and the letters cut deep:\n\nBRACKENFELL: east, along the road.\nTHE HUNTER’S BLIND, the old mill road and the south shore: ask the road.\nTHE LUMBER CAMP: up the track to the north. Mind the sleds.\nTOLL FORD and the passes beyond: west.\n\nBeneath, in a different hand and fresher: “Do not go in. — C.”', [sp[0], sp[1] + 1.6, sp[2]]);
  for (const [x, z] of [[-2.2, -7.4], [7.0, -7.8], [5.4, -4.2]]) wPut(m, p, x, z, R() * 6, mm => { wCairn(mm, R, 3); });
};

WBUILD.lumber = (p, m, R) => {
  // a clearing in the pines: log stacks, a saw pit, a lean-to, a cart, a fire, stumps all round
  wPut(m, p, -6.5, -4.5, 0.15, mm => wLogStack(mm, 5, 4, 3.2, 0.2));
  wPut(m, p, -6.8, -1.2, -0.1, mm => wLogStack(mm, 4, 3, 3.0, 0.19, [0.9, 0.85, 0.8]));
  wPut(m, p, -1.5, -8.2, 1.57, mm => wLogStack(mm, 5, 3, 3.4, 0.2));
  // saw pit: two trestles bearing a trunk, a dark trench below, a long saw
  wPut(m, p, 4.0, 3.2, 0.35, mm => {
    mm.mat(MAT.PLAIN, [0.09, 0.075, 0.06]); mm.box(-2.0, 0.015, -0.55, 2.0, 0.02, 0.55);
    mm.mat(MAT.TIMBER, COL.timberDark); for (const sx of [-1.4, 1.4]) { mm.beam([sx - 0.35, 0, -0.5], [sx, 1.0, 0], 0.14, 0.14); mm.beam([sx + 0.35, 0, -0.5], [sx, 1.0, 0], 0.14, 0.14); mm.beam([sx - 0.35, 0, 0.5], [sx, 1.0, 0], 0.14, 0.14); mm.beam([sx + 0.35, 0, 0.5], [sx, 1.0, 0], 0.14, 0.14); }
    mm.push().T(0, 1.15, 0); wLog(mm, 4.6, 0.26); mm.pop();
    mm.mat(MAT.METAL, [0.55, 0.55, 0.58]); mm.box(-0.6, 1.25, 0.26, 0.6, 1.62, 0.275); mm.mat(MAT.TIMBER, COL.wood); mm.box(-0.6, 1.62, 0.22, 0.6, 1.66, 0.3);
    addBoxCollider(mm, -2.1, -0.4, 2.1, 0.4, 0, 1.5);
  });
  // the cart with a load of planks
  wPut(m, p, -9.6, 5.8, 1.2, mm => { Props.cart(mm, false); mm.mat(MAT.PLANKS, [0.9, 0.85, 0.78], 0.6); for (let i = 0; i < 4; i++) mm.box(-0.62, 1.08 + i * 0.07, -1.05 + (i % 2) * 0.1, 0.62, 1.15 + i * 0.07, 1.0 - (i % 2) * 0.1); });
  // the lean-to: three walls of split boards, a pitched roof, a bunk, the chopping block with the axe
  wPut(m, p, 8.6, -4.8, -PI / 2, mm => {
    mm.mat(MAT.PLANKS, COL.woodDark, 0.9); mm.box(-1.8, 0, 1.2, 1.8, 2.2, 1.3); mm.box(-1.85, 0, -1.2, -1.75, 1.85, 1.3); mm.box(1.75, 0, -1.2, 1.85, 1.85, 1.3);
    mm.mat(MAT.TIMBER, COL.timberDark); for (const sx of [-1.8, 1.8]) mm.cbox(sx, -0.3, -1.25, 0.14, 2.6, 0.14, 4); mm.cbox(-1.8, -0.3, 1.25, 0.14, 2.7, 0.14, 4); mm.cbox(1.8, -0.3, 1.25, 0.14, 2.7, 0.14, 4);
    mm.mat(MAT.SHINGLE, [0.58, 0.52, 0.46], 0.8); mm.quad2([-2.1, 2.3, 1.45], [-2.1, 1.75, -1.55], [2.1, 1.75, -1.55], [2.1, 2.3, 1.45]);
    mm.mat(MAT.CLOTH, COL.fur, 0.6); mm.box(-1.2, 0.3, 0.2, 0.2, 0.42, 1.15); mm.mat(MAT.CLOTH, COL.wool, 0.6); mm.box(-1.15, 0.42, 0.7, -0.35, 0.52, 1.1);
    mm.mat(MAT.TIMBER, COL.timber); mm.box(-1.25, 0, 0.15, -1.15, 0.3, 0.25); mm.box(0.15, 0, 0.15, 0.25, 0.3, 0.25); mm.box(-1.25, 0, 1.05, -1.15, 0.3, 1.15); mm.box(0.15, 0, 1.05, 0.25, 0.3, 1.15);
    Props.barrel(mm);
    addBoxCollider(mm, -1.9, -1.3, 1.9, 1.35, 0, 2.2);
  });
  wPut(m, p, 5.4, -1.4, 0, mm => { mm.mat(MAT.BARK, [0.95, 0.9, 0.85], 0.6); mm.cyl(0, 0, 0, 0.36, 0.38, 0.58, 10, 0); mm.mat(MAT.PLAIN, [0.7, 0.55, 0.36]); mm.disc(0, 0.58, 0, 0.36, 10, 1); addCircleCollider(mm, 0, 0, 0.4, 0, 0.6); });
  // the fire: a ring of stones, a tripod, a pot
  const fp = wPut(m, p, -2.4, 4.2, 0, mm => {
    mm.mat(MAT.ROCK, [0.8, 0.8, 0.82], 0.5); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; mm.ball(Math.cos(a) * 0.62, 0.07, Math.sin(a) * 0.62, 0.15, 0.11, 0.13, 6, 4); }
    mm.mat(MAT.BARK, [0.3, 0.26, 0.24], 0.5); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.3; mm.beam([Math.cos(a) * 0.38, 0.02, Math.sin(a) * 0.38], [Math.cos(a + 2.4) * 0.06, 0.3, Math.sin(a + 2.4) * 0.06], 0.08, 0.08); }
    mm.mat(MAT.TIMBER, COL.timberDark); for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.5; mm.beam([Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9], [0, 1.55, 0], 0.07, 0.07); }
    mm.mat(MAT.METAL, COL.black); mm.beam([0, 1.5, 0], [0, 0.95, 0], 0.025, 0.025); Props.cauldron(mm, 0.26); mm.pop(); mm.push().T(0, 0.7, 0); Props.cauldron(mm, 0.26);
    addCircleCollider(mm, 0, 0, 0.7, 0, 0.5);
  });
  World.emitters.push({ type: 'fire', p: [fp[0], fp[1] + 0.2, fp[2]], size: 0.55, zone: 0, seed: 0.23, t: 0 }); addLight([fp[0], fp[1] + 1.0, fp[2]], 12, [3.4, 1.7, 0.6], 0, 'fire'); World.emitters.push({ type: 'smoke', p: [fp[0], fp[1] + 1.3, fp[2]], zone: 0, seed: 0.5, t: 0 });
  // sitting logs and a few split billets
  for (const [x, z, r] of [[-2.4, 6.6, 0.1], [-4.7, 4.4, 1.5], [-0.3, 3.8, -1.2]]) wPut(m, p, x, z, r, mm => wLog(mm, 1.5, 0.19));
  for (let i = 0; i < 14; i++) { const a = R() * TAU, r = 3 + R() * 8; wPut(m, p, Math.cos(a) * r, Math.sin(a) * r, R() * 6, mm => { mm.mat(MAT.PLAIN, [0.72, 0.56, 0.36]); mm.cbox(0, 0, 0, 0.12 + R() * 0.1, 0.1, 0.07, 4); }); }
  // a felled pine lying across the clearing's edge, branches lopped
  wPut(m, p, 13.0, -9.0, 0.5, mm => { mm.push().T(0, 0.4, 0); wLog(mm, 8, 0.38); mm.pop(); mm.mat(MAT.BARK, [0.9, 0.85, 0.8], 0.5); for (let i = 0; i < 4; i++) mm.beam([-3 + i * 1.7, 0.7, 0], [-3 + i * 1.7 + 0.3, 1.1, (i % 2 ? 0.5 : -0.5)], 0.06, 0.06); addBoxCollider(mm, -4, -0.4, 4, 0.4, 0, 0.9); });
  // stumps: scanned, all round the clearing
  for (let i = 0; i < 16; i++) { const a = R() * TAU, r = 9 + R() * 8; wKit(p, i % 2 ? 'tree_stump_01' : 'tree_stump_02', Math.cos(a) * r, Math.sin(a) * r, { s: 0.7 + R() * 0.6, ry: R() * TAU, col: 0.5, h: 0.5, dy: -0.04 }); }
  wKit(p, 'dead_tree_trunk', 11, 2, { s: 1.2, ry: 0.4, dy: -0.02 }); wKit(p, 'dead_tree_trunk', -10, -9, { s: 1.0, ry: 2.2 });
  for (let i = 0; i < 7; i++) { const a = R() * TAU, r = 5 + R() * 9; wKit(p, 'dry_branches_medium_01_a', Math.cos(a) * r, Math.sin(a) * r, { s: 1 + R() * 0.5, ry: R() * TAU }); }
  const cb = wGround(p, 5.4, -1.4); wPick('wc.axe', [cb[0] + 0.05, cb[1] + 0.6, cb[2]], 'Take the axe', 'woodaxe', 'axe');
  p.npc = { stand: [wGround(p, 3.6, -1.6)], yaw: -2.0 };
};

WBUILD.blind = (p, m, R) => {
  // the hunter's blind: a thatched screen of poles and brush with a slit to watch through; a deer stand on stilts with a ramp up to it; a salt lick in the meadow
  wPut(m, p, 0, 0, PI, mm => {
    mm.mat(MAT.TIMBER, COL.timberDark); for (const x of [-1.5, -0.5, 0.5, 1.5]) mm.cbox(x, -0.3, 0.0, 0.1, 2.2, 0.1, 4); for (const x of [-1.5, 1.5]) mm.cbox(x, -0.3, 1.2, 0.1, 1.9, 0.1, 4);
    mm.mat(MAT.THATCH, [0.7, 0.62, 0.45], 0.7); mm.box(-1.6, 0.1, -0.05, 1.6, 1.2, 0.07); mm.box(-1.6, 1.5, -0.05, 1.6, 2.0, 0.07); mm.box(-1.6, 1.2, -0.05, -0.2, 1.5, 0.07); mm.box(0.2, 1.2, -0.05, 1.6, 1.5, 0.07);
    mm.box(-1.6, 0.1, 1.15, -1.5, 1.7, 1.25); mm.box(1.5, 0.1, 1.15, 1.6, 1.7, 1.25);
    mm.mat(MAT.THATCH, [0.62, 0.55, 0.38], 0.8); mm.quad2([-1.8, 2.15, -0.3], [-1.8, 1.85, 1.5], [1.8, 1.85, 1.5], [1.8, 2.15, -0.3]);
    mm.mat(MAT.PLANKS, COL.wood); mm.box(-1.0, 0.0, 0.5, 0.9, 0.4, 0.9);
    addBoxCollider(mm, -1.7, -0.2, 1.7, 0.3, 0, 2.0); addBoxCollider(mm, -1.7, 0.2, -1.4, 1.3, 0, 1.8); addBoxCollider(mm, 1.4, 0.2, 1.7, 1.3, 0, 1.8);
  });
  wPut(m, p, 9.0, -6.5, 0, mm => {
    const Hh = 3.1;
    mm.mat(MAT.TIMBER, COL.timberDark); for (const [x, z] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]]) mm.beam([x * 1.25, -0.3, z * 1.25], [x * 0.9, Hh + 0.2, z * 0.9], 0.15, 0.15);
    mm.mat(MAT.PLANKS, COL.wood, 0.7); mm.box(-1.05, Hh - 0.12, -1.05, 1.05, Hh, 1.05);
    for (const [x0, z0, x1, z1] of [[-1.05, -1.05, 1.05, -0.97], [-1.05, 0.97, 1.05, 1.05], [-1.05, -1.05, -0.97, 1.05]]) { mm.mat(MAT.PLANKS, COL.woodDark, 0.7); mm.box(x0, Hh, z0, x1, Hh + 0.9, z1); }
    mm.mat(MAT.TIMBER, COL.timberDark); mm.box(0.97, Hh + 0.85, -1.05, 1.05, Hh + 0.95, -0.2);
    mm.mat(MAT.SHINGLE, [0.55, 0.5, 0.44], 0.8); mm.quad2([-1.2, Hh + 1.75, -1.0], [-1.2, Hh + 1.4, 1.2], [1.2, Hh + 1.4, 1.2], [1.2, Hh + 1.75, -1.0]);
    mm.mat(MAT.TIMBER, COL.timberDark); for (const [x, z] of [[-1.0, -0.95], [1.0, -0.95], [-1.0, 0.95], [1.0, 0.95]]) mm.cbox(x, Hh, z, 0.07, 1.6, 0.07, 4);
    // the ramp on the east side: 6.4 m long, to the platform
    mm.mat(MAT.PLANKS, COL.wood, 0.5); mm.beam([1.05, Hh - 0.06, 0], [7.4, 0.12, 0], 1.1, 0.12);
    mm.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) { mm.beam([1.05, Hh + 0.9, s * 0.52], [7.4, 1.0, s * 0.52], 0.05, 0.08); for (const t of [0.2, 0.6, 1.0]) mm.cbox(lerp(1.05, 7.4, t), lerp(Hh, 0.1, t) - 0.1, s * 0.52, 0.08, 1.0, 0.08, 4); }
    addFloor(mm, -1.0, -1.0, 1.0, 1.0, Hh); addFloor(mm, 1.0, -0.55, 7.4, 0.55, Hh, 0.12, 'x');
    for (const [x0, z0, x1, z1] of [[-1.05, -1.05, 1.05, -0.97], [-1.05, 0.97, 1.05, 1.05], [-1.05, -1.05, -0.97, 1.05]]) addBoxCollider(mm, x0, z0, x1, z1, Hh, Hh + 1.0);
    for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) addCircleCollider(mm, x * 1.1, z * 1.1, 0.2, 0, 1.4);
  });
  wPut(m, p, -7, -12, 0.4, mm => { mm.mat(MAT.ROCK, [0.95, 0.95, 0.92], 0.5); mm.ball(0, 0.15, 0, 0.55, 0.28, 0.4, 8, 4); mm.mat(MAT.PLAIN, [0.88, 0.85, 0.78]); mm.ball(0, 0.36, 0, 0.3, 0.05, 0.22, 7, 3); addCircleCollider(mm, 0, 0, 0.5, 0, 0.5); });
  // a cold fire ring and a skinning rack
  wPut(m, p, -4.5, 3.5, 0, mm => { mm.mat(MAT.ROCK, [0.8, 0.8, 0.82], 0.5); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mm.ball(Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5, 0.13, 0.1, 0.12, 6, 4); } mm.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); mm.disc(0, 0.03, 0, 0.42, 9, 1); });
  wPut(m, p, 3.2, 4.8, 0.5, mm => { mm.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) mm.beam([s * 0.9, 0, -0.3], [s * 0.7, 1.7, 0], 0.07, 0.07), mm.beam([s * 0.9, 0, 0.3], [s * 0.7, 1.7, 0], 0.07, 0.07); mm.beam([-0.75, 1.65, 0], [0.75, 1.65, 0], 0.06, 0.06); mm.mat(MAT.CLOTH, COL.fur, 0.6); mm.quad2([-0.5, 1.62, 0], [-0.55, 0.75, 0.02], [-0.1, 0.7, 0.02], [-0.1, 1.62, 0]); mm.quad2([0.1, 1.62, 0], [0.05, 0.8, 0.02], [0.55, 0.78, 0.02], [0.5, 1.62, 0]); addBoxCollider(mm, -0.9, -0.3, 0.9, 0.3, 0, 1.7); });
  for (const [x, z, r] of [[2, 6.5, 0], [-2.4, 7.6, 1.4], [6, 8.5, 2.2], [-6.5, 8.0, 0.6]]) wKit(p, 'Mushroom_Common', x, z, { s: 1.4 + R() * 0.8, ry: R() * 6 });
  for (let i = 0; i < 18; i++) { const a = R() * TAU, r = 4 + R() * 12; wKit(p, 'Fern_1', Math.cos(a) * r, Math.sin(a) * r, { s: 0.9 + R() * 0.7, ry: R() * TAU, inst: true, maxDist: 70 }); }
  for (const [x, z] of [[1.6, 7.0], [-3, 9.2]]) { const c = wGround(p, x, z); wPick('bl.m' + (x > 0 ? 1 : 2), c, 'Pick chanterelles', 'chanterelle', 'mushrooms'); }
};

WBUILD.burnt = (p, m, R) => {
  // the shell of a cottage: charred sill beams, jagged stubs of wall, a standing chimney, fallen rafters, drifts of ash and rubble
  const CH = [0.34, 0.31, 0.29], CH2 = [0.44, 0.39, 0.34];
  wPut(m, p, 0, 0, 0.3, mm => {
    const w = 6.0, d = 4.6;
    mm.mat(MAT.STONE, [0.62, 0.6, 0.57], 0.8); mm.box(-w / 2 - 0.1, -0.5, -d / 2 - 0.1, w / 2 + 0.1, 0.18, d / 2 + 0.1, 8);
    mm.mat(MAT.TIMBER, CH); const jag = (x0, z0, x1, z1, n, hmax) => { for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, hh = 0.35 + hmax * (0.35 + 0.65 * ((i * 53 + 17) % 7) / 7); mm.box(lerp(x0, x1, t0) - 0.01, 0.18, lerp(z0, z1, t0) - 0.01, lerp(x0, x1, t1) + 0.01, hh, lerp(z0, z1, t1) + 0.01 + 0.1, 0); } };
    mm.mat(MAT.PLANKS, CH, 0.8); jag(-w / 2, d / 2 - 0.12, w / 2, d / 2 - 0.12, 8, 1.4); jag(-w / 2, -d / 2, -w / 2, d / 2, 6, 1.1);
    mm.mat(MAT.PLANKS, CH2, 0.8); mm.box(-w / 2, 0.18, -d / 2, -1.2, 0.9, -d / 2 + 0.12); mm.box(1.4, 0.18, -d / 2, w / 2, 1.5, -d / 2 + 0.12);
    mm.mat(MAT.TIMBER, CH); for (const [x, z, hh] of [[-w / 2, -d / 2, 2.5], [-w / 2, d / 2, 2.0], [w / 2, -d / 2, 1.2], [w / 2, d / 2, 2.8]]) mm.cbox(x, 0.1, z, 0.2, hh, 0.2, 4);
    mm.box(-1.3, 0.18, -d / 2 - 0.04, -1.1, 2.3, -d / 2 + 0.2); mm.box(0.9, 0.18, -d / 2 - 0.04, 1.1, 2.1, -d / 2 + 0.2); mm.beam([-1.3, 2.28, -d / 2 + 0.05], [1.1, 2.12, -d / 2 + 0.05], 0.2, 0.18);
    // the chimney: a tapering stack of stone with a hearth
    mm.mat(MAT.STONE, [0.5, 0.48, 0.46], 0.7); mm.box(w / 2 - 0.9, 0.18, d / 2 - 1.1, w / 2 + 0.3, 3.2, d / 2 + 0.3, 0); mm.box(w / 2 - 0.7, 3.2, d / 2 - 0.9, w / 2 + 0.1, 4.2, d / 2 + 0.1, 0);
    mm.mat(MAT.PLAIN, [0.03, 0.025, 0.02]); mm.box(w / 2 - 0.72, 0.2, d / 2 - 1.12, w / 2 - 0.1, 1.1, d / 2 - 1.04);
    // fallen rafters, the ridge beam on its side
    mm.mat(MAT.TIMBER, CH2); for (const [x0, z0, y0, x1, z1, y1] of [[-2.8, -1.6, 0.2, -0.4, 0.4, 1.4], [-1.0, -1.7, 0.25, 1.6, 0.6, 1.2], [2.2, -1.9, 0.2, 0.2, 1.4, 1.0], [-2.9, 1.2, 0.2, 0.3, 1.9, 0.9], [-1.8, -0.3, 0.2, 2.6, -0.1, 0.3]]) mm.beam([x0, y0, z0], [x1, y1, z1], 0.13, 0.17);
    // ash and rubble
    mm.mat(MAT.PLAIN, [0.12, 0.11, 0.1]); for (let i = 0; i < 9; i++) mm.ball((R() - 0.5) * 4.6, 0.12, (R() - 0.5) * 3.2, 0.4 + R() * 0.7, 0.12, 0.35 + R() * 0.5, 7, 3);
    mm.mat(MAT.STONE, [0.5, 0.48, 0.45], 0.6); for (let i = 0; i < 7; i++) mm.ball((R() - 0.5) * 5.2, 0.15, (R() - 0.5) * 4, 0.16 + R() * 0.12, 0.11, 0.14 + R() * 0.1, 6, 3);
    addBoxCollider(mm, -w / 2, d / 2 - 0.2, w / 2, d / 2 + 0.05, 0, 1.4); addBoxCollider(mm, -w / 2 - 0.1, -d / 2, -w / 2 + 0.15, d / 2, 0, 1.1); addBoxCollider(mm, w / 2 - 0.9, d / 2 - 1.1, w / 2 + 0.3, d / 2 + 0.3, 0, 3.4);
    for (const [x, z] of [[-w / 2, -d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [w / 2, d / 2]]) addCircleCollider(mm, x, z, 0.2, 0, 2);
  });
  // a charred barrel and crate by the back wall, a blackened wagon wheel
  wPut(m, p, 3.6, 3.6, 0, mm => { mm.mat(MAT.BARK, [0.2, 0.17, 0.15], 0.6); mm.cyl(0, 0, 0, 0.32, 0.34, 0.86, 10, 2); mm.mat(MAT.METAL, [0.12, 0.1, 0.09]); for (const y of [0.15, 0.7]) mm.lathe([[0.345, y], [0.345, y + 0.04]], 10, 0); addCircleCollider(mm, 0, 0, 0.35, 0, 0.9); });
  wPut(m, p, -3.4, 3.2, 0.9, mm => { mm.push().RX(0.0); mm.mat(MAT.TIMBER, [0.18, 0.15, 0.13]); mm.push().RX(-PI / 2).T(0, -0.02, 0.0); mm.lathe([[0.55, 0], [0.55, 0.08], [0.46, 0.08], [0.46, 0]], 12, 0); mm.pop(); for (let i = 0; i < 6; i++) { const a = i * PI / 3; mm.beam([0, 0.05, 0], [Math.cos(a) * 0.5, 0.05, Math.sin(a) * 0.5], 0.05, 0.05); } mm.pop(); });
  // the garden has gone to nettles and a pear tree, black on one side
  wKit(p, 'weed_plant_02_a', -4.6, -3.8, { s: 3, ry: 0.4 });
  const hk = wGround(p, 3.5, 1.1); wPick('bn.key', [hk[0], hk[1] + 0.22, hk[2]], 'Search the ashes', 'ashkey', 'key');
  wRead('note.burnt', 'A scorched board', 'Nailed to the one post still standing, the lettering half burnt away:\n\n“… HERE LIVED ADDA THE RUSHWORKER, whose roof fell in on Candlemas night. If any of hers return, tell them the key she kept for her brother’s strongbox is where she always kept it: in the hearth, under the third stone.”', wGround(p, -2.4, -2.9).map((v, i) => i === 1 ? v + 1.4 : v));
  World.emitters.push({ type: 'smoke', p: wGround(p, 3.4, 2.7).map((v, i) => i === 1 ? v + 4.3 : v), zone: 0, seed: 0.77, t: 0, thin: true });
};

WBUILD.mine = (p, m, R) => {
  // an adit driven into the cliff, timbered, its door boarded shut; ore cart on rails, a lamp post, a notice, spoil heaps
  const Z = 3.05;       // the portal stands at the cliff's foot (local +z runs into the hill)
  wPut(m, p, 0, 0, 0, mm => {
    mm.mat(MAT.PLAIN, [0.02, 0.018, 0.016]); mm.box(-1.15, 0, Z + 0.1, 1.15, 2.4, Z + 1.7);
    mm.mat(MAT.TIMBER, COL.timberDark); for (const sx of [-1.35, 1.35]) { mm.cbox(sx, -0.3, Z, 0.34, 3.0, 0.34, 4); addBoxCollider(mm, sx - 0.2, Z - 0.2, sx + 0.2, Z + 0.2, 0, 3); }
    mm.box(-1.75, 2.65, Z - 0.18, 1.75, 3.0, Z + 0.2); for (const s of [-1, 1]) mm.beam([s * 1.35, 2.2, Z - 0.18], [s * 0.7, 2.7, Z - 0.18], 0.16, 0.16);
    mm.mat(MAT.TIMBER, COL.timber); mm.cbox(0, 3.0, Z + 0.35, 3.0, 0.22, 0.3, 4);
    // boards nailed across the opening, some askew
    mm.mat(MAT.PLANKS, [0.75, 0.68, 0.6], 0.6); for (let i = 0; i < 6; i++) { const y = 0.3 + i * 0.38, sl = (i % 3 - 1) * 0.05; mm.beam([-1.2, y - sl, Z - 0.2], [1.2, y + sl, Z - 0.2], 0.2, 0.05); }
    mm.beam([-1.15, 0.35, Z - 0.26], [1.1, 2.4, Z - 0.26], 0.18, 0.04); mm.beam([1.1, 0.4, Z - 0.26], [-1.1, 2.3, Z - 0.26], 0.18, 0.04);
    mm.mat(MAT.METAL, COL.black); for (const [x, y] of [[-0.9, 0.75], [0.9, 1.1], [0.1, 1.6], [-0.5, 2.0]]) mm.cbox(x, y, Z - 0.3, 0.07, 0.07, 0.03, 4);
    addBoxCollider(mm, -1.4, Z - 0.3, 1.4, Z - 0.1, 0, 2.8);
    // rails running out, a cart half loaded with stone, sleepers
    mm.mat(MAT.TIMBER, COL.timberDark); for (let z = Z - 0.2; z > -8; z -= 0.8) mm.box(-0.7, 0, z - 0.06, 0.7, 0.06, z + 0.06);
    mm.mat(MAT.METAL, [0.34, 0.28, 0.24]); for (const sx of [-0.45, 0.45]) mm.box(sx - 0.03, 0.06, -8, sx + 0.03, 0.1, Z - 0.2);
    mm.push().T(0, 0.12, -3.6).RY(0.04); mm.mat(MAT.PLANKS, [0.55, 0.43, 0.32], 0.6); mm.box(-0.55, 0.28, -0.8, 0.55, 0.34, 0.8); for (const sx of [-1, 1]) mm.box(sx * 0.55 - 0.03, 0.3, -0.8, sx * 0.55 + 0.03, 0.95, 0.8); for (const sz of [-1, 1]) mm.box(-0.55, 0.3, sz * 0.8 - 0.03, 0.55, 0.9, sz * 0.8 + 0.03);
    mm.mat(MAT.METAL, [0.3, 0.27, 0.25]); for (const sx of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) { mm.push().T(sx, 0.2, sz).RZ(PI / 2); mm.cyl(0, -0.03, 0, 0.18, 0.18, 0.06, 10, 3); mm.pop(); }
    mm.mat(MAT.ROCK, [0.75, 0.74, 0.72], 0.5); for (let i = 0; i < 8; i++) mm.ball((R() - 0.5) * 0.7, 0.9 + R() * 0.12, (R() - 0.5) * 1.2, 0.2 + R() * 0.12, 0.15, 0.2, 6, 3);
    addBoxCollider(mm, -0.6, -0.85, 0.6, 0.85, 0, 1.0); mm.pop();
    // spoil: a fan of broken rock running out of the mouth
    mm.mat(MAT.ROCK, [0.8, 0.79, 0.77], 0.5); for (let i = 0; i < 26; i++) { const a = -PI / 2 + (R() - 0.5) * 2.0, r = 3 + R() * 7; mm.ball(Math.cos(a) * r * 0.6 - 3.5 * (R() < 0.5 ? 1 : -1) * R(), 0.1, -Math.abs(Math.sin(a)) * r + 1.5, 0.28 + R() * 0.55, 0.16 + R() * 0.2, 0.28 + R() * 0.5, 6, 4); }
  });
  // lamp post by the door, an old pickaxe against the wall of rock, a warning board on two posts
  wPut(m, p, 2.7, 1.5, PI, mm => { mm.mat(MAT.TIMBER, COL.timberDark); mm.cbox(0, -0.3, 0, 0.12, 2.7, 0.12, 4); mm.beam([0, 2.3, 0], [0, 2.3, -0.7], 0.07, 0.07); mm.push().T(0, 2.05, -0.65); Props.lantern(mm, { zone: 0 }); mm.pop(); addCircleCollider(mm, 0, 0, 0.14, 0, 2.5); });
  const sg = wPut(m, p, -3.6, -1.6, 0.3, mm => { mm.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) mm.cbox(s * 0.75, -0.3, 0, 0.1, 2.0, 0.1, 4); mm.mat(MAT.PLANKS, [0.7, 0.62, 0.5], 0.6); mm.box(-0.8, 1.0, -0.04, 0.8, 1.75, 0.04); mm.mat(MAT.PLAIN, [0.2, 0.08, 0.06]); mm.box(-0.5, 1.5, -0.05, 0.5, 1.58, -0.04); mm.box(-0.45, 1.25, -0.05, 0.4, 1.31, -0.04); mm.box(-0.5, 1.1, -0.05, 0.1, 1.15, -0.04); addBoxCollider(mm, -0.85, -0.1, 0.85, 0.1, 0, 1.9); });
  wRead('note.mine', 'A warning board', 'KEEP OUT. The lower gallery flooded and the roof is working.\nBy order of the Warden of Brackenfell, in the year of the second frost.\n\nBelow, scratched with a nail:\n“Corwin went in after the silver. I told him. — your brother Hob.”', [sg[0], sg[1] + 1.4, sg[2]]);
  wKit(p, 'picke_dirty_01', 2.9, 0.4, { s: 1.0, rz: 0.22, ry: 1.0, dy: 0.0 });
  const door = wGround(p, 0, 1.4); World.interact.push({ p: [door[0], door[1] + 1.2, door[2]], r: 3.0, zone: 0, kind: 'door', id: 'mine.door', name: 'the old mine door', shut: true, msg: 'Barred from the far side. Iron and oak: you will not shift it.' });
  const cp = wGround(p, -1.9, 0.1); wPick('mine.cap', [cp[0], cp[1] + 0.02, cp[2]], 'Take the cap', 'corwincap', 'cap');
  wPlaceBoulders(p, m, R, 16, 5, 11);
};
// loose boulders scattered round a place (scanned rocks, with colliders on the big ones)
function wPlaceBoulders(p, m, R, n, r0, r1, big) {
  const names = ['rock_moss_set_02_g', 'rock_moss_set_02_c', 'rock_moss_set_02_a', 'rock_moss_set_01_e'];
  for (let i = 0; i < n; i++) { const a = R() * TAU, r = r0 + R() * (r1 - r0), s = 0.5 + R() * 1.1; wKit(p, R.pick(names), Math.cos(a) * r, Math.sin(a) * r, { s, ry: R() * TAU, dy: -0.12 * s, col: s > 0.85 ? 0.7 * s : 0, h: 0.9 }); }
}

WBUILD.hermit = (p, m, R) => {
  // a turf-and-stone hut by the pool: a gable of thatch, a smoking chimney, a bench, a bed of herbs, a drying rack, firewood and a strongbox
  const hut = wPut(m, p, 7.2, 3.0, 0.5, mm => {
    wHut(mm, 4.4, 3.6, { h: 2.2, rise: 1.15, wall: MAT.STONE, wc: [0.78, 0.76, 0.72], roof: MAT.THATCH, rc: [0.9, 0.85, 0.7], door: 0.5 });
    mm.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.7); mm.box(1.4, 0.3, 1.3, 2.2, 3.4, 2.0); mm.box(1.5, 3.4, 1.4, 2.1, 3.8, 1.9);
    mm.mat(MAT.PLANKS, COL.wood, 0.5); mm.box(-1.9, 0.3, -2.05, -0.8, 1.45, -1.97); mm.mat(MAT.PLAIN, [0.05, 0.04, 0.03]); mm.box(-1.7, 0.7, -2.0, -1.0, 1.3, -1.96);
  });
  World.emitters.push({ type: 'smoke', p: [hut[0] + Math.cos(0.5) * 1.8 - Math.sin(0.5) * 1.65, hut[1] + 4.1, hut[2] + Math.sin(0.5) * 1.8 + Math.cos(0.5) * 1.65], zone: 0, seed: 0.13, t: 0 });
  wPut(m, p, 3.2, 5.7, 0.2, mm => { mm.mat(MAT.PLANKS, COL.wood, 0.5); mm.box(-0.8, 0.38, -0.18, 0.8, 0.45, 0.18); for (const s of [-1, 1]) mm.box(s * 0.65 - 0.05, 0, -0.15, s * 0.65 + 0.05, 0.38, 0.15); addBoxCollider(mm, -0.85, -0.2, 0.85, 0.2, 0, 0.5); });
  // a drying rack and the herb bed
  wPut(m, p, 9.6, 8.0, 0, mm => { mm.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) mm.cbox(s * 1.1, -0.3, 0, 0.08, 2.0, 0.08, 4); mm.beam([-1.15, 1.7, 0], [1.15, 1.7, 0], 0.05, 0.05); mm.mat(MAT.PLAIN, [0.42, 0.4, 0.22]); for (let i = 0; i < 7; i++) { const x = -0.95 + i * 0.32; mm.cyl(x, 1.05, 0, 0.025, 0.07, 0.65, 5, 0); } addBoxCollider(mm, -1.2, -0.1, 1.2, 0.1, 0, 1.8); });
  wPut(m, p, 4.4, 9.0, 0.1, mm => { mm.mat(MAT.SOIL, [0.8, 0.78, 0.75], 0.8); mm.box(-1.4, 0, -0.5, 1.4, 0.16, 0.5); mm.mat(MAT.TIMBER, COL.timber); mm.box(-1.45, 0, -0.55, 1.45, 0.2, -0.5); mm.box(-1.45, 0, 0.5, 1.45, 0.2, 0.55); for (let i = 0; i < 12; i++) { mm.mat(MAT.PLAIN, i % 3 ? [0.28, 0.42, 0.2] : [0.7, 0.62, 0.8]); mm.ball(-1.2 + i * 0.22, 0.28, ((i * 5) % 3 - 1) * 0.22, 0.1, 0.13, 0.1, 5, 3); } addBoxCollider(mm, -1.45, -0.55, 1.45, 0.55, 0, 0.3); });
  wPut(m, p, 12.2, 2.5, 1.1, mm => wLogStack(mm, 4, 3, 1.4, 0.13));
  wPut(m, p, 5.2, 0.4, 0, mm => { mm.mat(MAT.BARK, [0.95, 0.9, 0.85], 0.6); mm.cyl(0, 0, 0, 0.3, 0.32, 0.5, 9, 0); mm.mat(MAT.PLAIN, [0.7, 0.55, 0.36]); mm.disc(0, 0.5, 0, 0.3, 9, 1); mm.mat(MAT.PLAIN, [0.5, 0.18, 0.12]); mm.cyl(0.02, 0.5, 0.02, 0.07, 0.06, 0.12, 8, 2); addCircleCollider(mm, 0, 0, 0.34, 0, 0.5); });
  // the strongbox, at the back of the hut's yard; it wants a key
  const bp = wPut(m, p, 10.4, -0.2, -0.5, mm => { mm.mat(MAT.PLANKS, [0.45, 0.34, 0.24], 0.5); mm.box(-0.42, 0, -0.26, 0.42, 0.4, 0.26); mm.mat(MAT.TIMBER, [0.3, 0.23, 0.17]); mm.box(-0.44, 0.4, -0.28, 0.44, 0.5, 0.28); mm.mat(MAT.METAL, [0.2, 0.19, 0.18]); for (const x of [-0.28, 0.28]) mm.box(x - 0.025, 0, -0.275, x + 0.025, 0.5, 0.275); mm.box(-0.05, 0.28, -0.29, 0.05, 0.4, -0.26); addBoxCollider(mm, -0.45, -0.3, 0.45, 0.3, 0, 0.5); });
  World.interact.push({ p: [bp[0], bp[1] + 0.5, bp[2]], r: 2.0, zone: 0, kind: 'wbox', id: 'hermit.box', need: 'ashkey', loot: [['gold', 55], ['potion', 1], ['leather', 1]], label: 'Strongbox' });
  const np = wGround(p, 5.4, 4.6); wRead('note.hermit', 'A note on the door', 'Pinned to the doorpost with a thorn, in a careful, spidery hand:\n\n“Gone to gather bogbean at the pool, back by dusk. If you are the one who is owed the silver: it is not in the mine. It never was. Corwin knew, and that is why he went down. Leave the kettle where it is. — E.”', [np[0], np[1] + 1.4, np[2]]);
  const bg = wGround(p, -6.8, 3.4); wPick('hm.bog', [bg[0], bg[1] + 0.0, bg[2]], 'Pick bogbean', 'bogbean', { k: 'bogbean', f: mm => PICKMESH.tuft(mm, [0.3, 0.46, 0.28], [0.95, 0.95, 0.98], 5) }, true);
  for (let i = 0; i < 6; i++) { const a = 2.6 + i * 0.62 + R() * 0.3, r = 5.6 + R() * 0.8, c = wGround(p, -10 + Math.cos(a) * r, -4.5 + Math.sin(a) * r); wKit(p, 'rock_moss_set_02_g', c[0] - p.x, c[2] - p.z, { s: 0.5 + R() * 0.8, ry: R() * 6, dy: -0.08 }); }
  for (let i = 0; i < 9; i++) { const a = R() * TAU, r = 5.2 + R() * 2.4; wKit(p, 'Fern_1', -10 + Math.cos(a) * r, -4.5 + Math.sin(a) * r, { s: 1.2 + R() * 0.9, ry: R() * TAU, inst: true, maxDist: 80 }); }
  // the fall's rock: scanned boulders along the lip and down both sides of the face, dark and half buried, ferns on the ledges
  { const c = WILDS.cliffs.find(k => k.id === 'fall'), L = (lx, lz) => [c.x + lx - p.x, c.z + c.dz * lz - p.z], rn = ['rock_moss_set_02_g', 'rock_moss_set_02_c', 'rock_moss_set_02_a', 'rock_moss_set_01_e', 'Rock_Medium_1', 'Rock_Medium_2'];
    for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, lz = c.at + 0.5 + R() * (c.ramp + 1.5), lx = side * (1.5 + R() * 3.2 + (lz > c.at + c.ramp - 1 ? 0 : 0.8)), q = L(lx, lz), sc = 0.7 + R() * 1.3; wKit(p, R.pick(rn), q[0], q[1], { s: sc, ry: R() * TAU, dy: -0.18 * sc, tint: [0.62, 0.64, 0.66] }); }
    for (let i = 0; i < 6; i++) { const q = L((i - 2.5) * 0.55, c.at + c.ramp - 0.2 + R() * 0.5); wKit(p, R.pick(rn), q[0], q[1], { s: 0.55 + R() * 0.4, ry: R() * TAU, dy: -0.12, tint: [0.55, 0.58, 0.6] }); }           // the lip
    for (let i = 0; i < 4; i++) { const a = -0.4 + i * 0.9, q = [20 + Math.cos(a + PI) * 4.9 - p.x, -172.5 + Math.sin(a + PI) * 4.9 - p.z]; wKit(p, R.pick(rn), q[0], q[1], { s: 0.5 + R() * 0.5, ry: R() * TAU, dy: -0.15 }); }
    for (let i = 0; i < 34; i++) { const q = L(R.s() * 9, c.at - 2 + R() * (c.ramp + 7)); wKit(p, 'Fern_1', q[0], q[1], { s: 1.0 + R() * 1.0, ry: R() * TAU, inst: true, maxDist: 70 }); }
    for (let i = 0; i < 22; i++) { const q = L(R.s() * 10, c.at + 2 + R() * (c.ramp + 6)); wKit(p, 'Grass_Wispy_Tall', q[0], q[1], { s: 1.0 + R() * 0.8, ry: R() * TAU, inst: true, maxDist: 60 }); } }
  p.npc = null;
};

WBUILD.stones = (p, m, R) => {
  // a ring of nine standing stones and two fallen ones on a bare hilltop, an altar slab with a carving, a cairn, and a hawthorn bent by the wind
  const N = 9, rr = 6.0;
  for (let i = 0; i < N; i++) { const a = i / N * TAU + 0.2, h = 2.9 + 1.7 * ((i * 37 + 11) % 10) / 10; wPut(m, p, Math.cos(a) * rr, Math.sin(a) * rr, a, mm => { wStone(mm, 0.95 + 0.25 * ((i * 13) % 5) / 5, h, (R() - 0.5) * 0.12); addCircleCollider(mm, 0, 0, 0.55, 0, 3); }); }
  for (const [a, r] of [[0.5 + PI, rr + 0.6], [2.5, rr + 0.2]]) wPut(m, p, Math.cos(a) * r, Math.sin(a) * r, a + 1.2, mm => { mm.push().T(0, 0.45, 0).RZ(PI / 2).T(0, -1.3, 0); mm.mat(MAT.ROCK, [0.9, 0.9, 0.88], 0.55); mm.lathe([[0.5, 0], [0.45, 1.4], [0.3, 2.6], [0.05, 2.8]], 6, 0); mm.pop(); addBoxCollider(mm, -1.4, -0.5, 1.4, 0.5, 0, 0.9); });
  const alt = wPut(m, p, 0, 0, 0.2, mm => {
    mm.mat(MAT.ROCK, [0.85, 0.85, 0.82], 0.6); mm.box(-0.9, 0, -0.45, -0.55, 0.55, 0.45); mm.box(0.55, 0, -0.45, 0.9, 0.55, 0.45); mm.box(-1.25, 0.55, -0.7, 1.25, 0.82, 0.7);
    mm.mat(MAT.PLAIN, [0.1, 0.1, 0.09]); for (let i = 0; i < 5; i++) { const x = -0.9 + i * 0.45; mm.box(x, 0.822, -0.5, x + 0.05, 0.828, 0.5); } mm.box(-1.0, 0.822, 0.0, 1.0, 0.828, 0.05); mm.cyl(0, 0.822, 0, 0.3, 0.3, 0.006, 12, 2);
    addBoxCollider(mm, -1.3, -0.75, 1.3, 0.75, 0, 0.85);
  });
  wRead('stone.carved', 'The carved stone', 'A knot of lines, worn nearly smooth, runs round the altar slab: the same shape nine times, once for each stone. At its centre someone has cut a small ring, and beneath it, newer letters:\n\n“THE VALLEY IS OLDER THAN ITS NAMES.”\n\nYou lay a hand on the slab. It is cold, and it is the only cold thing on the hill.', [alt[0], alt[1] + 0.9, alt[2]], 3.2);
  wPut(m, p, 10.5, 6.5, 0.6, mm => wCairn(mm, R, 6));
  const sc = wGround(p, -3.2, 3.6); wPick('st.crop', [sc[0], sc[1], sc[2]], 'Pick stonecrop', 'stonecrop', { k: 'stonecrop', f: mm => PICKMESH.tuft(mm, [0.38, 0.5, 0.34], [0.92, 0.84, 0.3], 6) }, true);
  wKit(p, 'TwistedTree_3', -9.5, -8.5, { s: 0.55, ry: 1.0, col: 0.35, h: 3 });
  wPlaceBoulders(p, m, R, 8, 9, 15);
};

WBUILD.battle = (p, m, R) => {
  // a field where the line broke: spears and stakes leaning where they fell, broken shields, bones, a wrecked wagon, a tattered standard, three barrows
  for (let i = 0; i < 30; i++) {
    const a = R() * TAU, r = 3 + Math.sqrt(R()) * 16, lean = 0.12 + R() * 0.45, dir = R() * TAU;
    wPut(m, p, Math.cos(a) * r, Math.sin(a) * r, 0, mm => {
      mm.push().RY(dir).RZ(lean); mm.mat(MAT.TIMBER, [0.32, 0.26, 0.2]); mm.cbox(0, -0.4, 0, 0.045, 1.9 + R() * 0.7, 0.045, 4);
      if (i % 3) { mm.mat(MAT.METAL, [0.46, 0.32, 0.24]); const y = 1.5 + R() * 0.4; mm.poly([[0, y + 0.45, 0.012], [-0.05, y, 0.012], [0.05, y, 0.012]]); mm.poly([[0.05, y, -0.012], [-0.05, y, -0.012], [0, y + 0.45, -0.012]]); } mm.pop();
    });
  }
  for (let i = 0; i < 16; i++) { const a = R() * TAU, r = 3 + Math.sqrt(R()) * 17; wPut(m, p, Math.cos(a) * r, Math.sin(a) * r, R() * TAU, mm => { mm.push().RX(R.s() * 0.25).RZ(R.s() * 0.2); mm.mat(MAT.PLANKS, [0.55, 0.4, 0.3], 0.5); mm.cyl(0, 0.03, 0, 0.33, 0.33, 0.04, 10, 3); mm.mat(MAT.METAL, [0.38, 0.3, 0.26]); mm.ball(0, 0.07, 0, 0.07, 0.04, 0.07, 6, 3); if (i % 2) { mm.mat(MAT.PLAIN, [0.5, 0.15, 0.12]); mm.box(-0.3, 0.07, -0.03, 0.3, 0.075, 0.03); } mm.pop(); }); }
  for (let i = 0; i < 6; i++) { const a = R() * TAU, r = 3 + R() * 14; wPut(m, p, Math.cos(a) * r, Math.sin(a) * r, R() * TAU, mm => { mm.mat(MAT.PLAIN, [0.78, 0.74, 0.62]); mm.ball(0, 0.08, 0, 0.1, 0.09, 0.11, 7, 4); mm.mat(MAT.PLAIN, [0.1, 0.09, 0.08]); mm.ball(-0.035, 0.1, -0.08, 0.025, 0.03, 0.01, 4, 3); mm.ball(0.035, 0.1, -0.08, 0.025, 0.03, 0.01, 4, 3); mm.mat(MAT.PLAIN, [0.76, 0.72, 0.6]); for (let k = 0; k < 5; k++) { mm.push().T((k - 2) * 0.12, 0.02, 0.3 + (k % 2) * 0.1).RZ(PI / 2 + R.s() * 0.4).RY(R() * 3); mm.cyl(0, -0.2, 0, 0.018, 0.022, 0.4, 5, 0); mm.pop(); } }); }
  wPut(m, p, -6, 5, 0.9, mm => { mm.push().RZ(0.28).T(0, 0.0, 0); Props.cart(mm, false); mm.pop(); });
  wPut(m, p, 7, -4, 0, mm => { mm.mat(MAT.TIMBER, [0.28, 0.23, 0.18]); mm.push().RZ(0.1); mm.cbox(0, -0.4, 0, 0.1, 4.4, 0.1, 4); mm.mat(MAT.CLOTH, [0.34, 0.12, 0.1], 0.6); mm.quad2([0.04, 4.1, 0], [0.04, 3.2, 0.02], [1.2, 3.35, 0.15], [1.35, 4.0, 0.05]); mm.quad2([0.04, 3.3, 0.02], [0.2, 2.5, 0.03], [0.9, 2.7, 0.12], [1.1, 3.35, 0.1]); mm.pop(); addCircleCollider(mm, 0, 0, 0.14, 0, 3); });
  wRead('note.battle', 'A rotted standard', 'The cloth is too far gone to say whose it was. Pinned beneath the staff with a nail, a strip of leather, scratched with a point:\n\nHERE THE GREYSPINE LEVY STOOD, AND HERE THEY STAYED.\nThe valley folk bury what they find. They never find all of it.', wGround(p, 7, -4).map((v, i) => i === 1 ? v + 1.3 : v), 3.0);
  const sw = wGround(p, 1.0, -9.5); wPick('bf.sword', [sw[0], sw[1] + 0.05, sw[2]], 'Take the old sword', 'oldsword', 'sword');
  const cn = wGround(p, -7.4, 6.2); wPick('bf.coins', [cn[0], cn[1] + 0.02, cn[2]], 'Take the coins', 'oldcoins', 'coins');
  for (let i = 0; i < 6; i++) { const a = R() * TAU, r = 6 + R() * 14; wKit(p, 'weed_plant_02_a', Math.cos(a) * r, Math.sin(a) * r, { s: 2 + R() * 1.5, ry: R() * 6, inst: true, maxDist: 60 }); }
};

WBUILD.bee = (p, m, R) => {
  // skeps on benches inside a ring of low wattle fence, wooden hives on legs, a lean-to for the smoker and the barrels
  const ring = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * (TAU - 0.5) + PI + 0.55 - 0.01 * 0, r = 7.4; ring.push([p.x + Math.cos(a) * r, p.z + Math.sin(a) * r]); }
  wFence(m, ring, { h: 0.9, col: [0.62, 0.55, 0.44], rails: [0.4, 0.72] });
  for (const [x, z, rot] of [[-2.6, -2.2, 0], [0.4, -3.2, 0.2], [3.0, -2.0, -0.2]]) wPut(m, p, x, z, rot, mm => {
    mm.mat(MAT.PLANKS, COL.wood, 0.5); mm.box(-1.0, 0.5, -0.3, 1.0, 0.56, 0.3); for (const s of [-1, 1]) mm.box(s * 0.9 - 0.05, 0, -0.25, s * 0.9 + 0.05, 0.5, 0.25);
    mm.mat(MAT.THATCH, [0.95, 0.85, 0.55], 0.6); for (let i = 0; i < 3; i++) { const x = -0.65 + i * 0.65; mm.lathe([[0.27, 0.56], [0.3, 0.7], [0.22, 0.9], [0.1, 1.02], [0.005, 1.06]], 9, 0); mm.push().T(x, 0, 0); mm.pop(); }
    addBoxCollider(mm, -1.05, -0.32, 1.05, 0.32, 0, 1.0);
  });
  // (the three skeps above are drawn at the bench centre; repeat per bench position with offsets)
  for (const [x, z, rot] of [[-2.6, -2.2, 0], [0.4, -3.2, 0.2], [3.0, -2.0, -0.2]]) for (const dx of [-0.65, 0, 0.65]) wPut(m, p, x, z, rot, mm => { mm.mat(MAT.THATCH, [0.95, 0.85, 0.55], 0.6); mm.push().T(dx, 0, 0); mm.lathe([[0.27, 0.56], [0.3, 0.7], [0.22, 0.92], [0.1, 1.04], [0.005, 1.08]], 9, 0); mm.mat(MAT.PLAIN, [0.1, 0.07, 0.04]); mm.ball(0, 0.62, -0.28, 0.05, 0.04, 0.02, 5, 3); mm.pop(); });
  for (const [x, z, rot] of [[-4.6, 1.2, 0.4], [4.8, 1.4, -0.5]]) wPut(m, p, x, z, rot, mm => { mm.mat(MAT.PLANKS, [0.88, 0.84, 0.76], 0.5); for (const s of [-1, 1]) for (const t of [-1, 1]) mm.cbox(s * 0.28, 0, t * 0.28, 0.06, 0.55, 0.06, 4); mm.box(-0.36, 0.55, -0.36, 0.36, 1.15, 0.36); mm.mat(MAT.SHINGLE, [0.6, 0.55, 0.5], 0.5); mm.quad2([-0.45, 1.15, -0.45], [-0.45, 1.15, 0.45], [0, 1.4, 0.45], [0, 1.4, -0.45]); mm.quad2([0.45, 1.15, 0.45], [0.45, 1.15, -0.45], [0, 1.4, -0.45], [0, 1.4, 0.45]); mm.mat(MAT.PLAIN, [0.1, 0.08, 0.05]); mm.box(-0.1, 0.62, -0.37, 0.1, 0.7, -0.36); addBoxCollider(mm, -0.4, -0.4, 0.4, 0.4, 0, 1.3); });
  wPut(m, p, 0.6, 4.6, PI, mm => { wHut(mm, 3.0, 2.2, { h: 2.1, rise: 0.8, wall: MAT.PLANKS, wc: COL.woodDark, roof: MAT.THATCH, door: 0.55 }); mm.push().T(1.9, 0, -0.6); Props.barrel(mm); mm.pop(); });
  wPut(m, p, -2.2, 3.6, 0, mm => { Props.barrel(mm, 0.28, 0.7); });
  const hb = wGround(p, 0.6, -2.0); wPick('bee.honey', [hb[0], hb[1] + 0.58, hb[2]], 'Take the honeycomb', 'honeycomb', 'honey');
  const sw = wGround(p, -5.4, 5.6); wPick('bee.sunwort', [sw[0], sw[1], sw[2]], 'Pick sunwort', 'sunwort', { k: 'sunwort', f: mm => PICKMESH.tuft(mm, [0.34, 0.5, 0.26], [0.98, 0.84, 0.2], 6) }, true);
  for (let i = 0; i < 70; i++) { const a = R() * TAU, r = 1.5 + Math.sqrt(R()) * 12; wKit(p, R.pick(['Flower_3_Group', 'Flower_4_Group', 'Flower_3_Single', 'Flower_4_Single', 'Clover_1']), Math.cos(a) * r, Math.sin(a) * r, { s: 1.0 + R() * 0.8, ry: R() * TAU, inst: true, maxDist: 55 }); }
};

// QA: the drying net is a mesh of threads. dNet (73c_dress.js) was one flat grey-green sheet that read as a white board from a distance
function wNet() {
  const key = 'wd_net'; if (Kit.pieces[key]) return key;
  const g = GP(), c = [0.26, 0.28, 0.22], W = 'MI_WoodTrim', C = 'MI_Trim_Cloth';
  g.beam(W, [-1.0, 1.5, 0], [1.0, 1.5, 0], 0.014, [0.3, 0.25, 0.2]);
  for (const x of [-1.0, 1.0]) g.box(W, x - 0.04, 0, -0.04, x + 0.04, 1.6, 0.04, [0.3, 0.25, 0.2], GPU.wood);
  for (let i = 0; i <= 8; i++) { const x = -0.95 + i * 0.2375, y1 = 0.55 + 0.04 * ((i * 7) % 3); g.beam(C, [x, 1.5, 0.01], [x * 0.98, y1, 0.07], 0.007, c); }
  for (let j = 1; j <= 5; j++) { const y = 1.5 - j * 0.17; g.beam(C, [-0.95 + 0.04 * j * 0.3, y, 0.012 + 0.012 * j], [0.95 - 0.04 * j * 0.3, y, 0.012 + 0.012 * j], 0.006, c); }
  return g.make(key);
}
WBUILD.fishing = (p, m, R) => {
  // beached clinker boats, a drying rack hung with nets, a smoking rack over a small fire, a low shelter, barrels and baskets, a jetty into the lake
  wKit(p, () => dBoat(rng(5)), -3.5, -3.0, { s: 1.5, ry: 0.35, col: 0.9, h: 0.5, dy: 0.6 }); wKit(p, () => dBoat(rng(5)), 2.2, -5.4, { s: 1.35, ry: -0.2, rz: 0.05, col: 0.85, h: 0.5, dy: 0.6 });
  wKit(p, () => wNet(), 5.2, 0.8, { s: 1.5, ry: 0.4, col: 0.4, h: 1.6 }); wKit(p, () => wNet(), 7.4, -0.6, { s: 1.5, ry: -0.2, col: 0.4, h: 1.6 });
  wPut(m, p, 3.6, 4.0, 0.3, mm => { wHut(mm, 3.4, 2.6, { h: 1.9, rise: 0.8, wall: MAT.PLANKS, wc: [0.66, 0.6, 0.52], roof: MAT.THATCH, door: 0.6 }); });
  const fp = wPut(m, p, -2.2, 4.2, 0, mm => {
    mm.mat(MAT.ROCK, [0.8, 0.8, 0.82], 0.5); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mm.ball(Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5, 0.13, 0.1, 0.12, 6, 4); }
    mm.mat(MAT.BARK, [0.3, 0.26, 0.24], 0.5); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.3; mm.beam([Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3], [Math.cos(a + 2.4) * 0.05, 0.25, Math.sin(a + 2.4) * 0.05], 0.07, 0.07); }
    mm.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) { mm.beam([s * 0.9, 0, -0.5], [s * 0.85, 1.3, -0.45], 0.07, 0.07); mm.beam([s * 0.9, 0, 0.5], [s * 0.85, 1.3, 0.45], 0.07, 0.07); } mm.beam([-0.9, 1.3, 0], [0.9, 1.3, 0], 0.05, 0.05);
    mm.mat(MAT.PLAIN, [0.55, 0.38, 0.2]); for (let i = 0; i < 5; i++) { const x = -0.65 + i * 0.32; mm.push().T(x, 1.28, 0); mm.ball(0, -0.3, 0, 0.045, 0.3, 0.025, 6, 4); mm.pop(); }
    addCircleCollider(mm, 0, 0, 0.8, 0, 1.3);
  });
  World.emitters.push({ type: 'fire', p: [fp[0], fp[1] + 0.15, fp[2]], size: 0.4, zone: 0, seed: 0.88, t: 0 }); World.emitters.push({ type: 'smoke', p: [fp[0], fp[1] + 1.2, fp[2]], zone: 0, seed: 0.31, t: 0 });
  for (const [x, z, r] of [[6.4, 3.4, 0], [7.0, 4.2, 0.6]]) wPut(m, p, x, z, r, mm => { Props.barrel(mm); });
  wPut(m, p, 6.3, 5.3, 0, mm => { Props.crate(mm, 0.6); });
  // the jetty: five metres of planking and two mooring posts, toward the lake's middle
  const dir = [LAKE.x - p.x, LAKE.z - p.z], dl = hyp(dir[0], dir[1]), ux = dir[0] / dl, uz = dir[1] / dl; let s0 = 0;
  for (let s = 0; s < 60; s += 0.25) { if (wy(p.x + ux * s, p.z + uz * s) < LAKE.y + 0.35) { s0 = s; break; } }
  if (s0 > 0) {
    const a = [p.x + ux * (s0 - 2.8), p.z + uz * (s0 - 2.8)], b = [p.x + ux * (s0 + 5.2), p.z + uz * (s0 + 5.2)];
    bwWalk(() => m, [a, b], { w: 1.3, rails: [0, 0], seg: 2.0, deckY: q => Math.max(LAKE.y + 0.5, wy(q[0], q[1]) + 0.25), railSide: () => false });
    m.m1 = 0; m.ao = 1; m.grad = null; m.mat(MAT.TIMBER, COL.timberDark); for (const sx of [-1, 1]) m.cbox(b[0] + Math.cos(Math.atan2(uz, ux) + PI / 2) * sx * 0.78, LAKE.y - 1.2, b[1] + Math.sin(Math.atan2(uz, ux) + PI / 2) * sx * 0.78, 0.2, 2.2, 0.2, 4);
    p.jetty = { end: [b[0] - ux * 0.6, LAKE.y + 0.5, b[1] - uz * 0.6], dir: Math.atan2(ux, -uz) };
  }
  const fh = wGround(p, 6.7, 3.8); wPick('fs.fish', [fh[0], fh[1] + 0.9, fh[2]], 'Take the smoked fish', 'smokedfish', 'fish');
  for (let i = 0; i < 5; i++) { const a = R() * TAU, r = 2.5 + R() * 9; wKit(p, 'wooden_bucket_02', Math.cos(a) * r * 0.6 + 4, Math.sin(a) * r * 0.6 - 1, { s: 1.2, ry: R() * 6 }); if (i > 1) break; }
};

WBUILD.toll = (p, m, R) => {
  // the road crosses a brook by a ford; beside it a plank footbridge, stepping stones, and a guard post with a toll bar (kept raised); a brazier, a notice, a strongbox of tolls
  wPut(m, p, 7.2, -4.4, -PI / 2, mm => {
    wHut(mm, 3.8, 3.0, { h: 2.3, rise: 1.0, wall: MAT.STONE, wc: [0.8, 0.78, 0.74], roof: MAT.SHINGLE, rc: [1.1, 1.05, 1.0], door: 0.5 });
    mm.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.7); mm.box(-1.0, 0.3, 1.2, -0.2, 3.3, 1.9); mm.mat(MAT.PLAIN, [0.07, 0.06, 0.05]); mm.box(0.9, 0.9, -1.55, 1.5, 1.6, -1.5);
  });
  // the toll bar: a post each side of the road, the pole propped upright against the north post so that the road stays open
  for (const [x, z] of [[-3.4, -4.8], [3.2, 4.8]]) { const q = wGround(p, x, z); m.push().T(q[0], q[1], q[2]); m.m1 = 0; m.ao = 1; m.mat(MAT.TIMBER, COL.timberDark); m.cbox(0, -0.3, 0, 0.22, 1.9, 0.22, 4); addCircleCollider(m, 0, 0, 0.22, 0, 1.6); m.pop(); }
  wPut(m, p, -3.4, -4.8, 0, mm => { mm.mat(MAT.PLANKS, [0.85, 0.78, 0.68], 0.5); mm.beam([0.1, 0.9, 0.0], [0.65, 4.0, 0.1], 0.12, 0.12); mm.mat(MAT.PLAIN, [0.8, 0.78, 0.74]); for (const y of [1.8, 2.7]) mm.beam([0.28 + (y - 0.9) * 0.17, y, 0.0], [0.38 + (y - 0.9) * 0.17, y + 0.5, 0.0], 0.14, 0.14); });
  const nb = wPut(m, p, -5.8, -3.6, 0.4, mm => { mm.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) mm.cbox(s * 0.8, -0.3, 0, 0.1, 2.2, 0.1, 4); mm.mat(MAT.PLANKS, COL.wood); mm.box(-0.8, 0.95, -0.03, 0.8, 1.95, 0.03); mm.mat(MAT.PLAIN, COL.parchment); mm.box(-0.5, 1.4, -0.04, 0.2, 1.8, -0.03); mm.box(0.3, 1.25, -0.04, 0.65, 1.7, -0.03); addBoxCollider(mm, -0.85, -0.08, 0.85, 0.08, 0, 2.0); });
  wRead('board.toll', 'Notice of tolls', 'BY THE WARDEN’S LEAVE, at the Ford of the Greyspine Road:\n\nA walker: nothing.\nA cart, laden: two pennies.\nA flock, by the score: one lamb.\nOutlaws and those who aid them: the rope.\n\nThe guard is away at the wedding at Highfold. Leave the bar as you find it, and do not trouble the box.', [nb[0], nb[1] + 1.4, nb[2]]);
  const br = wPut(m, p, 1.6, 3.2, 0, mm => { mm.mat(MAT.METAL, COL.black); mm.cyl(0, 0.5, 0, 0.3, 0.38, 0.16, 8, 1); mm.mat(MAT.TIMBER, COL.timberDark); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; mm.beam([Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4], [Math.cos(a) * 0.2, 0.55, Math.sin(a) * 0.2], 0.05, 0.05); } mm.mat(MAT.PLAIN, [0.1, 0.07, 0.05]); mm.disc(0, 0.64, 0, 0.28, 8, 1); addCircleCollider(mm, 0, 0, 0.4, 0, 0.9); });
  World.emitters.push({ type: 'torch', p: [br[0], br[1] + 0.85, br[2]], size: 0.28, zone: 0, seed: 0.62 }); addLight([br[0], br[1] + 1.2, br[2]], 10, [3.0, 1.5, 0.5], 0, 'fire');
  // the footbridge across the brook, north of the ford, and stepping stones south of it
  { const bx = WILDS.brook.pts, c = (WILDS.brookLine || (WILDS.brookLine = new Poly(catmull(WILDS.brook.pts, 2)))); c.dist(-159.5, -6, 20); const q = c.point(c.at), nx = -q[3], nz = q[2];
    const a = [q[0] - nx * 4.6, q[1] - nz * 4.6], b = [q[0] + nx * 4.6, q[1] + nz * 4.6], top = Math.max(wy(a[0], a[1]), wy(b[0], b[1])) + 0.15;
    wBridge(m, a, b, { w: 1.4, ya: top, yb: top }); WB.bridge = { a, b }; }
  for (let i = 0; i < 6; i++) { const q = WILDS.brookLine.point(WILDS.brookLine.len * 0.62), z = q[1] - 2 + i * 0.9 * 0, x = q[0] - 2.3 + i * 0.92 + (i % 2) * 0.1, zz = q[1] + (i % 2 ? 0.22 : -0.22); const y = wBrookSurface(x, zz) + 0.1;
    m.m1 = 0; m.ao = 1; m.grad = null; m.mat(MAT.ROCK, [0.85, 0.85, 0.82], 0.5); m.push().T(x, 0, zz); m.cyl(0, y - 0.5, 0, 0.38, 0.34, 0.5, 8, 2); addFloor(m, -0.36, -0.36, 0.36, 0.36, y); m.pop(); }
  const tb = wGround(p, 9.0, -1.4); World.interact.push({ p: [tb[0], tb[1] + 0.45, tb[2]], r: 2.0, zone: 0, kind: 'chest', id: 'toll.box', loot: [['gold', 14]] });
  wPut(m, p, 9.0, -1.4, PI / 2, mm => { Props.chest(mm); });
};
// the brook's surface at a point (or the ground when there is none)
function wBrookSurface(x, z) { for (const k of WILDS.brooks) { const b = k.line; if (!b || x < k.x0 || x > k.x1 || z < k.z0 || z > k.z1) continue; b.dist(x, z, 6); if (b.at >= 0) return wildsBrookY(b.at, k); } return wy(x, z); }

// ───────────────────────── Highfold: the hamlet's yard dressing (the houses are kit shells, in wildsAttach) ─────────────────────────
WBUILD.hamlet = (p, m, R) => {
  // dry-stone walls round the green, haystacks, a cart, a well, a woodpile at each door, an orchard of birches
  wWall(m, [[96, 94], [108, 92], [112, 88]], { h: 0.85 }); wWall(m, [[112, 108], [121, 104]], { h: 0.8, gaps: [[116, 106]] });
  for (const [x, z, r] of [[133, 118, 1.3], [137, 120, 1.1]]) wPut(m, p, x - p.x, z - p.z, 0, mm => Props.haystack(mm, r));
  wPut(m, p, -5.6, 10.2, 1.0, mm => { Props.cart(mm, true); });
  wPut(m, p, 1.4, 1.5, 0, mm => { // a well with a pitched roof
    mm.mat(MAT.STONE, [0.85, 0.85, 0.8], 0.7); mm.lathe([[0.95, -0.3], [0.95, 0.85], [0.82, 0.92], [0.6, 0.92], [0.6, -0.3]], 12, 0);
    mm.mat(MAT.PLAIN, [0.04, 0.07, 0.08]); mm.disc(0, 0.2, 0, 0.6, 10, 1); mm.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) mm.cbox(s * 0.85, 0.8, 0, 0.12, 1.3, 0.12, 4); mm.beam([-0.9, 2.05, 0], [0.9, 2.05, 0], 0.11, 0.11);
    mm.mat(MAT.SHINGLE, [0.58, 0.52, 0.46], 0.6); mm.quad2([-1.1, 2.3, 0], [-1.1, 1.95, -0.8], [1.1, 1.95, -0.8], [1.1, 2.3, 0]); mm.quad2([1.1, 2.3, 0], [1.1, 1.95, 0.8], [-1.1, 1.95, 0.8], [-1.1, 2.3, 0]); addCircleCollider(mm, 0, 0, 1.0, 0, 1.2);
  });
  for (const h of WILDS.houses) { const q = siteToWorld(h, h.w / 2 + 0.9, -h.d / 2 + 1.2); m.push().T(q[0], wy(q[0], q[1]), q[1]).RY(-h.yaw); m.m1 = 0; m.ao = 1; m.grad = null; Props.woodpile(m, 3, 3, 1.1); m.pop(); }
  for (const [id, msg] of [['high.b', 'Bolted. Nobody is home: they are all at the wedding.'], ['high.barn', 'The barn door is chained. Sheep bleat behind it.']]) { const h = SITE[id]; if (!h) continue; const q = siteToWorld(h, h.doorPos === undefined ? 0 : h.doorPos, -h.d / 2 - 0.9); World.interact.push({ p: [q[0], wy(q[0], q[1]) + 1.2, q[1]], r: 2.2, zone: 0, kind: 'door', id: id + '.door', shut: true, msg }); }
  // the apple pickups hang under the orchard birches
  for (const [x, z] of [[129, 123], [125, 126]]) { const c = [x, wy(x, z), z]; wPick("hf.apple" + (x > 127 ? 2 : 1), c, 'Gather apples', 'apple', 'apple'); }
};


// ───────────────────────── wayfinding: signposts where a path leaves the road, cairns along it, milestones, the footbridge over the Stonewater ─────────────────────────
const WSIGN = {
  lumber: ['Lumber camp, north-west', 'Back to the Shrine of the Turn'], burnt: ['The burnt cottage', 'Lumber camp'], mine: ['The old mine: barred', 'Burnt cottage'],
  tower: ['The Old Watchtower, east', 'Mine road, west'], hermit: ['Hermit’s Fall, north-east', 'Watchtower path'], bridge: ['Footbridge over the Stonewater', 'Hermit’s Fall'],
  stones: ['The Standing Stones, on the hill', 'Footbridge'], battle: ['Greyspine Field: graves, take care', 'The road home'], hamlet: ['Highfold, up the hill', 'Brackenfell'],
  fishing: ['The south shore and the boats', 'Highfold'], lakeside: ['Lake path', 'Fishing hamlet'], bee: ['Bee meadow, the skeps', 'Watch Road'], blind: ['Hunter’s blind', 'Brackenfell']
};
WBUILD.__net = (p, mk, R) => {
  for (const id of WILDS.paths) {
    const rd = Roads.find(r => r.id === 'p.' + id); if (!rd) continue; const L = rd.line, lab = WSIGN[id] || [id, ''];
    const q0 = L.point(1.2), nx = -q0[3], nz = q0[2], sx = q0[0] + nx * 1.7, sz = q0[1] + nz * 1.7;
    if (!['lakeside'].includes(id)) {
      const y = wy(sx, sz), m = mk(sx, sz); m.push().T(sx, y, sz).RY(R() * 0.6 - 0.3); m.m1 = 0; m.ao = 1; m.grad = null; Props.signPost(m, 2); addCircleCollider(m, 0, 0, 0.14, 0, 2.5); m.pop();
      wRead('sign.' + id, 'Signpost', lab.filter(Boolean).join('\n'), [sx, y + 1.7, sz], 2.6);
    }
    for (let d = 28 + R() * 14; d < L.len - 10; d += 38 + R() * 14) { const q = L.point(d), o = (R() < 0.5 ? 1 : -1) * (1.5 + R() * 0.8), x = q[0] - q[3] * o, z = q[1] + q[2] * o, m = mk(x, z); m.push().T(x, wy(x, z), z); m.m1 = 0; m.ao = 1; m.grad = null; wCairn(m, R, 3 + (R() * 3 | 0)); m.pop(); }
  }
  // milestones along the main roads out of the square
  for (const [x, z, a] of [[-92, 1.2, 0], [-148, 3.6, 0], [96, -4, PI]]) { const y = wy(x, z), m = mk(x, z); m.push().T(x, y, z).RY(a); m.m1 = 0; m.ao = 1; m.grad = null; m.mat(MAT.ROCK, [0.9, 0.9, 0.88], 0.5); m.box(-0.22, -0.2, -0.12, 0.22, 0.85, 0.12); m.cyl(0, 0.85, 0, 0.22, 0.2, 0.0, 8, 0); m.mat(MAT.PLAIN, [0.1, 0.1, 0.1]); m.box(-0.12, 0.45, 0.118, 0.12, 0.6, 0.125); addBoxCollider(m, -0.25, -0.15, 0.25, 0.15, 0, 1.2); m.pop(); }
  // footbridge over the river where the Hermit's path crosses it
  { const r0 = River.dist(47, -150, 20), at = River.at, q = River.point(at), nx = -q[3], nz = q[2], hs = 6.4;
    const a = [q[0] - nx * hs, q[1] - nz * hs], b = [q[0] + nx * hs, q[1] + nz * hs]; const ya = wy(a[0], a[1]) + 0.12, yb = wy(b[0], b[1]) + 0.12, mid = Math.max(ya, yb) + 0.1;
    wBridge(mk(q[0], q[1]), a, b, { w: 1.6, ya: Math.max(ya, yb), yb: Math.max(ya, yb) }); WB.river = { a, b, y: Math.max(ya, yb) }; }
};

// ───────────────────────── build ─────────────────────────
function buildWilds() {
  if (!WILDS.on || WB.built || (TEST && TEST.wb === 0)) return; WB.built = true;
  const pack = new MeshPack(); pack.shadow = false;
  for (const p of WILDS.places) {
    const fn = WBUILD[p.id]; if (!fn) continue;
    const m = new Mesh(4096); m.seed = (p.x * 7 + p.z * 13) | 0; const R = rng((p.x * 131 + p.z * 17) | 0);
    try { fn(p, m, R); } catch (e) { console.warn('wilds ' + p.id + ': ' + (e && e.stack || e)); }
    if (m.ni) { pack.add(m, { kind: 'opaque', maxDist: 125, noShadow: true }); WB.tris += m.ni / 3; }
    World.places.push({ id: 'wild.' + p.id, name: p.name, x: p.x, z: p.z, r: p.disc });
  }
  { const cells = new Map(), mk = (x, z) => { const k = Math.floor(x / 60) * 1000 + Math.floor(z / 60); let m = cells.get(k); if (!m) cells.set(k, m = new Mesh(2048)); return m; };
    try { WBUILD.__net({ x: 0, z: 0, yaw: 0 }, mk, rng(4242)); } catch (e) { console.warn('wilds net: ' + (e && e.stack || e)); }
    for (const m of cells.values()) if (m.ni) { pack.add(m, { kind: 'opaque', maxDist: 110, noShadow: true }); WB.tris += m.ni / 3; } }
  // water: the pool under the fall, the brook at the toll ford, the fall itself
  const wp2 = new MeshPack(); wp2.shadow = false;
  const wm = new Mesh(4096); wm.mat(MAT.PLAIN, [1, 1, 1]);
  const patch = (cx, cz, hx, hz, cs, yAt, flow) => { const nx = Math.ceil(2 * hx / cs), nz = Math.ceil(2 * hz / cs), ids = new Map(); const v = (i, j) => { const k = j * 4096 + i; let q = ids.get(k); if (q !== undefined) return q; const x = cx - hx + i * cs, z = cz - hz + j * cs, y = yAt(x, z); wm.ao = sat((y - Terrain.y(x, z)) / 0.9); q = wm.vert(x, y, z, 0, 1, 0, flow[0], flow[1]); ids.set(k, q); return q; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = cx - hx + i * cs, z = cz - hz + j * cs; if (Math.min(wy(x, z), wy(x + cs, z), wy(x, z + cs), wy(x + cs, z + cs)) > yAt(x, z) + 0.05) continue; { const y1 = yAt(x, z), y2 = yAt(x + cs, z), y3 = yAt(x, z + cs), y4 = yAt(x + cs, z + cs); if (Math.max(y1, y2, y3, y4) - Math.min(y1, y2, y3, y4) > 0.45) continue; }  /* QA: no near-vertical water panes where the brook surface steps */ const a = v(i, j), b = v(i, j + 1), c = v(i + 1, j + 1), d = v(i + 1, j); wm.tri(a, b, c); wm.tri(a, c, d); } };
  if (WILDS.pool) { const q = WILDS.pool, yw = wildsBase('pool', q.x, q.z) - 0.35; q.y = yw; patch(q.x, q.z, q.r + 5, q.r + 5, 1.0, () => yw, [0.2, 0.1]); }
  for (const k of WILDS.brooks) { const b = k.line || (k.line = new Poly(catmull(k.pts, 2))); for (let s = 0; s < b.len; s += 6) { const q = b.point(s); patch(q[0], q[1], 5.5, 5.5, 1.0, (x, z) => wBrookSurface(x, z), [-q[3] * 0.6, q[2] * 0.6]); } }
  WB.waterTris = 0;
  if (wm.ni) { wp2.add(wm, { kind: 'water', noShadow: true, maxDist: 130 }); WB.waterTris += wm.ni / 3; }
  // the fall: a ribbon hugging the face of the cliff from the lip to the pool
  const fm = new Mesh(512); fm.mat(MAT.PLAIN, [1, 1, 1]);
  { const c = WILDS.cliffs.find(k => k.id === 'fall'), pts = []; const ux = c.dx, uz = c.dz, sx = -uz, sz = ux;
    for (let k = 0; k <= 12; k++) { const lz = c.at + 0.2 + c.ramp * 1.15 * k / 12, x = c.x + ux * lz, z = c.z + uz * lz; pts.push([x, z, wy(x, z)]); }
    const lipY = pts[pts.length - 1][2]; WB.fall = { x: c.x + ux * (c.at + 1.5), z: c.z + uz * (c.at + 1.5), top: lipY, bottom: wildsBase('pool', 0, 0), ux, uz, pts };
    const hw = 0.9; let prev = null;
    for (let k = 0; k < pts.length; k++) { const q = pts[k], off = 0.22, x = q[0] - ux * 0.0 - ux * 0, y = q[2] + off * (1 - k / pts.length * 0.5); const l = fm.vert(q[0] - sx * hw, y, q[1] - sz * hw, -ux, 0.4, -uz, 0, k * 0.3, 0), r = fm.vert(q[0] + sx * hw, y, q[1] + sz * hw, -ux, 0.4, -uz, 0, k * 0.3, 0); fm.ao = 0.85; if (prev) { fm.tri(prev[0], prev[1], r); fm.tri(prev[0], r, l); } prev = [l, r]; }
  }
  // (the fall itself is drawn by particles, 79b_life.js: a solid sheet read as a white board)
  pack.upload('wilds'); World.packs.push(pack);
  wp2.upload('wilds-water'); World.packs.push(wp2);
  const wrap = World.waterAt; World.waterAt = (x, z) => {
    if (WILDS.pool && Math.abs(x - WILDS.pool.x) < 12 && Math.abs(z - WILDS.pool.z) < 12 && hyp(x - WILDS.pool.x, z - WILDS.pool.z) < WILDS.pool.r + 3 && Terrain.y(x, z) < WILDS.pool.y) return WILDS.pool.y;
    for (const k of WILDS.brooks) { if (x < k.x0 || x > k.x1 || z < k.z0 || z > k.z1) continue; const b = k.line, d = b.dist(x, z, 5); if (d < 5) { const y = wildsBrookY(b.at, k); if (Terrain.y(x, z) < y) return y; } }
    return wrap(x, z);
  };
  if (typeof wildsLifeBuild === 'function') wildsLifeBuild();
}

// the kit half: batches made when the kit and the quality tier are known (and again if the tier changes). Each place is hidden beyond 125 m.
function wildsKitBuild() {
  const q = R.q; if (!q || !kitReady()) return;
  for (const k of WB.groups) { SC.scene.remove(k.g); k.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  WB.groups = []; WB.builtFor = R.qName; const low = !q.scatter, I = new THREE.Matrix4();
  for (const p of WILDS.places) {
    const list = WB.kit[p.id], houses = p.id === 'hamlet' ? WILDS.houses : null; if (!list && !houses) continue;
    const B = Kit.batch({ name: 'wild-' + p.id, cell: 4096, off: 2048, far: !!houses }), add = B.add; B.add = (n, x, o) => add(n, x, Object.assign({ cast: false }, o || {}));
    const insts = {};
    for (const k of list || []) {
      const name = typeof k.name === 'function' ? k.name() : k.name; if (!Kit.pieces[name]) continue;
      if (low && (k.inst || /Flower|Clover|Fern|weed|Mushroom|branches/.test(name))) continue;
      const M = Kit.matrix({ p: [k.x, k.y, k.z], r: [k.rx, k.ry, k.rz], s: k.s });
      if (k.inst) { const key = name + '|' + (k.maxDist || 0); (insts[key] = insts[key] || { name, maxDist: k.maxDist, mats: [] }).mats.push(M); } else B.add(name, M, k.tint ? { tint: k.tint } : undefined);
    }
    for (const it of Object.values(insts)) B.addInstanced(it.name, it.mats, { cell: 64, maxDist: it.maxDist || 70, cast: false });
    if (houses) for (const h of houses) { if (h.cell && Cells.by[h.id]) continue; try { if (h.barn) wBarn(B, h, low); else infShell(B, h, low); } catch (e) { console.warn('hamlet house ' + h.id + ': ' + (e && e.stack || e)); } }
    if (!B.count && !Object.keys(insts).length) continue;
    const g = B.build(); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); SC.scene.add(g);
    let t = 0; g.traverse(o => { if (o.isMesh) t += o.geometry.index.count / 3 * (o.isInstancedMesh ? o.count : 1); });
    WB.groups.push({ g, p, tris: t });
  }
}
function wBarn(B, h, lo) { infShell(B, Object.assign({}, h, { floors: 1, jetty: false, chimney: 0, stairs: 0, boxes: false }), lo); }
function wildsAttach() {
  if (!WILDS.on || WB.attached || !SC.scene || !kitReady()) return; WB.attached = true;
  wildsKitBuild();
  const inner = sceneUpdate;
  sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    if (WB.builtFor !== R.qName) wildsKitBuild();
    for (const k of WB.groups) k.g.visible = !World.deepIn && hyp(camPos[0] - k.p.x, camPos[2] - k.p.z) < 125 + k.p.r;
  };
}

// ───────────────────────── splat painting (called from buildSplat / buildSplat2 in 60_terrain.js) ─────────────────────────
function wildsSplat(A, B, T) {
  if (!WILDS.on) return; const { ell, stroke, red } = T;
  for (const c of WILDS.cliffs) { const x = c.x + c.dx * (c.at - 2), z = c.z + c.dz * (c.at - 2); ell(B, x, z, 8, 8, a => red(a * 0.55)); }       // bare rock and scree under the cliffs
  ell(B, WILDS.P.burnt.x, WILDS.P.burnt.z, 4.2, 3.4, a => red(a * 0.8));                                                                 // ash
  const st = WILDS.P.stones; ell(B, st.x, st.z, 9, 9, a => red(a * 0.55));                                                  // the hilltop is thin soil
  ell(B, WILDS.P.mine.x, WILDS.P.mine.z, 5, 5, a => red(a * 0.6));
  const lc = WILDS.P.lumber; ell(B, lc.x, lc.z, 7, 6, a => red(a * 0.3));
}
function wildsSplat2(blob, line, A, B) {
  if (!WILDS.on) return;
  if (WILDS.pool) { const q = WILDS.pool; for (const [r, a] of [[q.r + 4, 0.35], [q.r + 2.4, 0.5], [q.r + 1, 0.7]]) blob(A, 1, q.x, q.z, r, a, 0.5); }
  for (const k of WILDS.brooks) line(A, 1, k.line.p, 7, 0.55);
  if (WB.fall) for (const q of WB.fall.pts) blob(A, 1, q[0], q[1], 2.6, 0.85, 0.3);              // the wet dark rock behind the fall
  for (const id of ['lumber', 'fishing', 'bee', 'battle', 'hermit']) { const p = WILDS.P[id]; if (p) blob(B, 2, p.x, p.z, p.r * 0.7, 0.4, 0.3); }
}
