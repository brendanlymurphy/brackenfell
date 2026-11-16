// ───────────────────────── vertical routes through the town (Build 42) ─────────────────────────
// Places to climb to, each with a reason to go (a view, a find, a door that opens on something). Everything is boxes and quads merged into the village cells through `bucket`,
// every walkable surface is a World.floors entry (lvFloor, 73f_levels.js), every wall or rail a box collider. `World.routes` lists each walk (way points from the street up to the
// top) for test/routes.js, which walks them with the scripted player.
//   a  the Hart's gallery: outside stair to a first-floor timber gallery along the inn's front and the passage house, doors off it, a view down on the market
//   b  the passage house: a covered passage from the square to a back lane, dark, one lantern at the middle, and a loft store above it that the gallery door opens on
//   c  a roofed timber bridge from the gallery over the north road to a hoist loft with finds
//   d  the north and east palisades with wall walks, gate towers over the roads, a postern (73i_walls.js)
//   e  the watch bell tower (73i_walls.js)
const RT = { n: 0, YG: 3.7 };
World.routes = [];
// quarters of the world that the helpers below draw into; `rtKit` gives the builders their shared helpers (also used by 73i_walls.js)
function rtKit(bucket, touch) {
  const dark = COL.timberDark, wood = [0.62, 0.52, 0.42];
  const M = (x, z) => { const m = bucket(x, z); if (touch && !touch.has(m)) touch.set(m, m.nv); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; return m; };
  const K = { M, dark, wood, gy: (x, z) => Terrain.y(x, z) };
  K.col = (x0, z0, x1, z1, y0, y1) => addBoxCollider(M((x0 + x1) / 2, (z0 + z1) / 2), Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y0, y1);
  K.box = (mat, c, tile, x0, y0, z0, x1, y1, z1, skip, ao) => { const m = M((x0 + x1) / 2, (z0 + z1) / 2); m.mat(mat, c, tile); if (ao !== undefined) m.ao = ao; m.box(Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1), skip || 0); m.ao = 1; return m; };
  K.beam = (p, q, w, h, c) => { const m = M((p[0] + q[0]) / 2, (p[2] + q[2]) / 2); m.mat(MAT.TIMBER, c || dark, 0.5); m.beam(p, q, w, h); };
  K.post = (x, z, y0, y1, w, nocol) => { const m = M(x, z); m.mat(MAT.TIMBER, dark, 0.5); m.cbox(x, y0, z, w || 0.18, y1 - y0, w || 0.18, 0); if (!nocol) addCircleCollider(m, x, z, (w || 0.18) * 0.62, y0, y1); };
  K.deck = (x0, z0, x1, z1, y, c) => { K.box(MAT.PLANKS, c || wood, 0.55, x0, y - 0.16, z0, x1, y, z1, 0); lvFloor(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y); };
  // a rail along x at z (or along z at x when `alongZ`): two beams, a collider, posts every ~1.9 m
  K.rail = (a0, a1, c, y, alongZ, h) => {
    h = h || 1.0; const P = alongZ ? (u, v) => [v, u] : (u, v) => [u, v], n = Math.max(1, Math.round(Math.abs(a1 - a0) / 1.9));
    for (const k of [0.5, h]) { const p = P(a0, c), q = P(a1, c), m = M(p[0], p[1]); m.mat(MAT.TIMBER, dark, 0.5); m.beam([p[0], y + k, p[1]], [q[0], y + k, q[1]], alongZ ? 0.06 : 0.05, alongZ ? 0.05 : 0.07); if (alongZ) { /* flat beam seen from the side */ } }
    for (let i = 0; i <= n; i++) { const u = a0 + (a1 - a0) * i / n, p = P(u, c); K.post(p[0], p[1], y - 0.1, y + h + 0.08, 0.1, true); }
    const p = P(a0, c - 0.07), q = P(a1, c + 0.07); K.col(p[0], p[1], q[0], q[1], y - 0.05, y + h + 0.15);
  };
  // steps along `axis` ('x' or 'z') from a (height ya) to b (height yb), `c0`..`c1` across. Open treads on two stringers, a handrail each side, side colliders. returns the floor entry
  K.stair = (axis, a, ya, b, yb, c0, c1, o) => {
    o = o || {}; const n = Math.max(2, Math.round(Math.abs(yb - ya) / 0.19)), P = axis === 'x' ? (u, v) => [u, v] : (u, v) => [v, u];
    for (let i = 0; i < n; i++) {
      const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n, top = ya + (yb - ya) * (i + 1) / n, p = P(u0, c0), q = P(u1, c1);
      K.box(MAT.PLANKS, i % 2 ? [0.56, 0.47, 0.38] : wood, 0.5, p[0], top - 0.07, p[1], q[0], top, q[1], 0);
    }
    const lo = Math.min(a, b), hi = Math.max(a, b), l = axis === 'x' ? (lo === a ? [ya, yb] : [yb, ya]) : (lo === a ? [ya, yb] : [yb, ya]);
    const p0 = P(lo, c0), p1 = P(hi, c1); const f = lvFloor(Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1]), l[0], l[1], axis);
    for (const c of [c0 - 0.1, c1 + 0.1]) {
      const s = P(a, c), t = P(b, c); K.beam([s[0], ya - 0.12, s[1]], [t[0], yb - 0.12, t[1]], axis === 'x' ? 0.1 : 0.16, axis === 'x' ? 0.16 : 0.1);
      if (!o.noRail) { K.beam([s[0], ya + 0.95, s[1]], [t[0], yb + 0.95, t[1]], 0.06, 0.06); const m = M(s[0], s[1]); void m; }
      const e0 = P(lo, c - 0.1), e1 = P(hi, c + 0.1); K.col(Math.min(e0[0], e1[0]), Math.min(e0[1], e1[1]), Math.max(e0[0], e1[0]), Math.max(e0[1], e1[1]), Math.min(ya, yb) - 0.6, Math.max(ya, yb) + 1.0);
      for (let i = 0; i <= 3; i++) { const u = a + (b - a) * i / 3, q = P(u, c), y = ya + (yb - ya) * i / 3; K.post(q[0], q[1], Math.min(y - 0.12, K.gy(q[0], q[1]) - 0.2), y + 0.98, 0.1, true); }
    }
    return f;
  };
  // a hanging lantern (a real glow and a light), `y` its flame
  K.lantern = (x, y, z, halo) => World.emitters.push({ type: 'lantern', p: [x, y, z], zone: 0, halo: halo || 0.5 });
  K.cat = (m, rot) => {        // a sitting cat, origin under it, facing +z
    m.push().RY(rot || 0); m.mat(MAT.PLAIN, [0.34, 0.27, 0.2]);
    m.ball(0, 0.15, 0, 0.1, 0.15, 0.14, 8, 5); m.ball(0, 0.33, 0.1, 0.075, 0.07, 0.07, 8, 5);
    for (const s of [-1, 1]) m.poly([[s * 0.025, 0.39, 0.09], [s * 0.065, 0.39, 0.1], [s * 0.05, 0.46, 0.1]]), m.poly([[s * 0.065, 0.39, 0.1], [s * 0.025, 0.39, 0.09], [s * 0.05, 0.46, 0.1]]);
    m.tube([[0.05, 0.03, -0.1], [0.14, 0.04, -0.16], [0.18, 0.12, -0.2], [0.16, 0.22, -0.2]], 0.022, 5);
    m.mat(MAT.PLAIN, [0.74, 0.7, 0.62]); m.ball(0, 0.1, 0.1, 0.05, 0.07, 0.04, 6, 4); m.pop();
  };
  K.read = (x, y, z, r, id, title, text) => World.interact.push({ p: [x, y, z], r, zone: 0, kind: 'read', id, title, text });
  K.place = (id, name, x, z, r) => World.places.push({ id, name, x, z, r });
  K.spot = (n, x, y, z, yaw) => { World.spots[n] = { p: [x, y, z], yaw: yaw || 0, zone: 0 }; };
  K.route = (id, pts) => { World.routes.push({ id, pts }); };
  K.roofX = (x0, x1, zHi, yHi, zLo, yLo, c) => { const m = M((x0 + x1) / 2, (zHi + zLo) / 2); m.mat(MAT.SHINGLE, c || [0.56, 0.5, 0.45], 0.5); m.quad2([x0, yHi, zHi], [x1, yHi, zHi], [x1, yLo, zLo], [x0, yLo, zLo]); return m; };
  K.pick = (id, name, p, label, item, mesh) => {
    const mi = wPickMesh(mesh), obj = addSkinned(mi, { c: p, r: 0.6, zone: 0, kind: 'pickup' }); R.boneData.set(m4.translate(m4.create(), p[0], p[1], p[2]), obj.slot * 256);
    const it = { kind: 'pickup', id, item, p: [p[0], p[1] + 0.2, p[2]], r: 1.9, zone: 0, obj, label }; World.interact.push(it); World.pickups.push(it); return it;
  };
  return K;
}
function buildRoutes(bucket) {
  if (TEST && TEST.levels === 0) return;
  const touch = new Map(), K = rtKit(bucket, touch), { M, col, box, beam, post, deck, rail, stair, dark, wood, gy } = K, YG = RT.YG, rr = rng(4242);
  const GX0 = -7.6, GX1 = 14.6, ZW = -17.25, ZF = -15.5;               // the gallery: along the inn front (z -17.25) and the passage house, 1.75 m deep
  const PX0 = 8.2, PX1 = 14.6, PZ1 = -22.4, PM0 = 10.4, PM1 = 12.4;      // the passage house (x PX0..PX1, z PZ1..ZW), passage at x PM0..PM1
  const PLASTER = [0.86, 0.82, 0.74];
  ITEMS.purse = ['Dropped purse', 'A drawstring purse of good wool, heavy with small coin. Someone has been looking for it.', { value: 14 }];
  ITEMS.whistle = ['Bone whistle', 'A watchman’s whistle on a thong, scratched with a tally of nights.', { value: 4 }];

  // ── a: the gallery ──
  deck(GX0, ZW - 0.2, GX1, ZF, YG);
  for (let x = GX0 + 0.35; x < GX1; x += 1.1) beam([x, YG - 0.2, ZW], [x, YG - 0.2, ZF + 0.1], 0.12, 0.2);                 // joists under the deck
  beam([GX0, YG - 0.36, ZF + 0.02], [GX1, YG - 0.36, ZF + 0.02], 0.16, 0.34);                                            // the fascia beam along the front
  { const posts = [-7.3, -4.6, -2.1, 2.1, 4.7, 7.3, 9.4, 13.5];                                                        // none in the inn door's strip (x 0) or the mouth of the passage (x 10.4..12.4)
    for (const x of posts) post(x, ZF - 0.1, gy(x, ZF) - 0.3, YG + 2.55, 0.2);
    for (const x of posts) beam([x - 0.3, YG + 2.05, ZF - 0.1], [x, YG + 2.55, ZF - 0.1], 0.07, 0.1);                       // knee braces
    beam([GX0 - 0.2, YG + 2.55, ZF - 0.1], [GX1 + 0.3, YG + 2.55, ZF - 0.1], 0.18, 0.2);                                  // the wall plate
    K.roofX(GX0 - 0.3, GX1 + 0.4, ZW - 0.1, YG + 3.0, ZF + 0.35, YG + 2.42);
    rail(GX0, GX1 - 1.0, ZF - 0.12, YG);                                                                                    // the stair arrives at the east end: the rail stops short of it
    rail(GX0, GX1, ZW + 0.0, YG, false, 0.0001); }
  // doors off the gallery: two on the inn's front (guest rooms, let by Greta at the bar) and the loft store's, open
  for (const x of [-4.2, 4.3]) { box(MAT.PLANKS, [0.55, 0.45, 0.34], 0.5, x - 0.5, YG, ZW - 0.03, x + 0.5, YG + 2.0, ZW + 0.0, 4 | 8 | 16, 1); box(MAT.PLAIN, [0.1, 0.09, 0.08], 0.5, x - 0.55, YG + 2.0, ZW - 0.05, x + 0.55, YG + 2.1, ZW + 0.0, 4 | 16, 1); box(MAT.PLAIN, [0.1, 0.09, 0.08], 0.5, x + 0.3, YG + 0.95, ZW - 0.045, x + 0.38, YG + 1.05, ZW + 0.0, 4 | 16, 1); }
  K.read(-4.2, YG + 1.1, ZF - 0.5, 2.3, 'gallery.door1', 'A numbered door on the gallery', 'Number 3, scratched in the wood and painted over twice. The latch is down and there is a sleeping sign on the pin: DO NOT KNOCK BEFORE NOON. The rooms are let by Greta at the bar, a few coppers a night, and an extra copper for the quiet ones on this side.');
  K.read(4.3, YG + 1.1, ZF - 0.5, 2.3, 'gallery.door2', 'A second door', 'Number 4. A boot stands outside it, with a stocking stuffed in. Through the keyhole there is a candle, and someone snoring in a way that suggests they paid for the whole week.');
  // furniture on the gallery: a bench for the view, a barrel of rainwater
  { const m = M(1.4, ZW + 0.5); m.push().T(-1.9, YG, ZW + 0.42); Props.bench(m, 1.7); m.pop(); m.push().T(6.2, YG, ZW + 0.42); Props.bench(m, 1.5); m.pop(); m.push().T(7.1, YG, ZW + 0.4); Props.barrel(m, 0.3, 0.75); m.pop(); }
  K.read(6.5, YG + 0.8, ZF - 0.8, 2.6, 'gallery.view', 'From the gallery', 'The whole square is laid out under you: the well and the bonfire ring, striped awnings, a boy dragging a goose by the neck of a sack, Brandt’s smoke over the west roofs, the terrace wall and the oak. From here you can see who is arguing at the bonfire before they have started.');
  // the outside stair: from the grass east of the passage house up to the east end of the gallery (the store’s forecourt is clear, the strip is 17.5..)
  { const x0 = 20.4, yb = gy(x0, -16.4); stair('x', x0, yb, GX1 + 0.05, YG, ZW + 0.1, ZF - 0.1);
    K.spot('gallery.bottom', x0 + 0.8, yb, -16.4, -PI / 2); K.spot('gallery.top', GX1 - 0.9, YG, -16.4, -PI / 2);
    K.lantern(GX1 + 0.45, YG + 1.9, ZF - 0.2); post(GX1 + 0.45, ZF - 0.2, YG, YG + 2.0, 0.1, true); }
  // ── b: the passage house ──
  { const g = gy(11.4, -19.8), Yt = 7.1, Yb = YG - 0.2;
    // ground floor: a stone plinth, limewashed walls and timber frame either side of the passage
    for (const [a, b] of [[PX0, PM0], [PM1, PX1]]) { box(MAT.STONE, [0.9, 0.88, 0.84], 0.7, a, g - 0.6, PZ1, b, g + 1.0, ZW, 4 | 8); box(MAT.PLASTER, PLASTER, 0.6, a, g + 1.0, PZ1, b, Yb, ZW, 4); col(a, PZ1, b, ZW, g - 0.6, Yb); }
    for (const x of [PX0 + 0.05, PM0 - 0.05, PM1 + 0.05, PX1 - 0.05]) beam([x, g + 1.0, ZW - 0.05], [x, Yb, ZW - 0.05], 0.16, 0.14);
    beam([PX0, g + 2.3, ZW - 0.05], [PM0, g + 2.3, ZW - 0.05], 0.14, 0.14); beam([PM1, g + 2.3, ZW - 0.05], [PX1, g + 2.3, ZW - 0.05], 0.14, 0.14);
    // passage lining: planks, a cobbled floor, a beamed ceiling, all dark (ao) so it reads as a dim tunnel by day
    { const m = M(11.4, -19.8); m.ao = 0.38; m.mat(MAT.PLANKS, [0.5, 0.42, 0.34], 0.5); m.quad2([PM0 + 0.02, g, ZW], [PM0 + 0.02, g, PZ1], [PM0 + 0.02, 2.9, PZ1], [PM0 + 0.02, 2.9, ZW]); m.quad2([PM1 - 0.02, g, ZW], [PM1 - 0.02, g, PZ1], [PM1 - 0.02, 2.9, PZ1], [PM1 - 0.02, 2.9, ZW]);
      m.mat(MAT.PLANKS, [0.4, 0.34, 0.28], 0.5); m.quad2([PM0, 2.9, ZW], [PM0, 2.9, PZ1], [PM1, 2.9, PZ1], [PM1, 2.9, ZW]); m.ao = 0.55; m.mat(MAT.COBBLE, [0.7, 0.68, 0.64], 0.45); m.quad2([PM0, g + 0.03, ZW], [PM0, g + 0.03, PZ1], [PM1, g + 0.03, PZ1], [PM1, g + 0.03, ZW]); m.ao = 1; }
    box(MAT.PLANKS, [0.42, 0.36, 0.3], 0.5, PM0, 2.9, PZ1, PM1, Yb, ZW, 0, 0.5);                                           // the slab over the passage (its top is the loft store's floor)
    for (let z = ZW - 0.5; z > PZ1; z -= 1.3) beam([PM0, 2.8, z], [PM1, 2.8, z], 0.2, 0.2, [0.42, 0.38, 0.35]);
    // lintel beams at both mouths
    for (const z of [ZW - 0.04, PZ1 + 0.04]) { beam([PM0 - 0.1, 2.95, z], [PM1 + 0.1, 2.95, z], 0.26, 0.3); post(PM0 - 0.1, z, g, 3.0, 0.24, true); post(PM1 + 0.1, z, g, 3.0, 0.24, true); }
    // things in the passage: a barrel and a crate against the west wall, a handcart wheel; the lantern at the middle
    { const m = M(11.4, -19.8); m.push().T(PM0 + 0.45, g, -19.0); Props.barrel(m, 0.3, 0.8); m.pop(); m.push().T(PM1 - 0.45, g, -20.9).RY(0.3); Props.crate(m, 0.6); m.pop(); m.push().T(PM1 - 0.5, g, -18.2); Props.sack(m, 0.3); m.pop(); }
    beam([11.4, 2.9, -19.8], [11.4, 2.45, -19.8], 0.04, 0.04); box(MAT.PLAIN, [0.1, 0.09, 0.08], 0.5, 11.28, 2.1, -19.92, 11.52, 2.45, -19.68, 0, 1);
    K.lantern(11.4, 2.28, -19.8, 0.8); addLight([11.4, 2.3, -19.8], 6.5, [3.0, 1.7, 0.6], 0, 'lantern');
    K.read(PM0 + 0.7, 1.5, -21.3, 2.0, 'passage.note', 'A note nailed in the passage', 'IF YOU ARE CARRYING A LADDER, A CASK OR A BAD MOOD, DO NOT COME THROUGH BETWEEN VESPERS AND SUPPER. THE LANTERN GOES OUT WHEN THE BOY FORGETS IT. NO PISSING. — the Landlord. (Under it, in pencil: “there is a loft over the passage with a door off the gallery, and the key is under the third pot.”)');
    // the loft store: the upper floor is a room (walls 0.22), the door off the gallery is open, a boarded one beside it, a hoist door in the back
    const ew = 0.22;
    box(MAT.PLASTER, PLASTER, 0.6, PX0, Yb, ZW - ew, PX0 + 0.7, Yt, ZW, 4 | 8, 1);                                         // south wall: the open door gap at x 8.9..10.0
    box(MAT.PLASTER, PLASTER, 0.6, PX0 + 0.7 + 1.1, Yb, ZW - ew, PX1, Yt, ZW, 4 | 8, 1); box(MAT.PLASTER, PLASTER, 0.6, PX0 + 0.7, YG + 2.15, ZW - ew, PX0 + 0.7 + 1.1, Yt, ZW, 4 | 8, 1);
    col(PX0, ZW - ew, PX0 + 0.7, ZW, YG, Yt); col(PX0 + 1.8, ZW - ew, PX1, ZW, YG, Yt);
    box(MAT.PLASTER, PLASTER, 0.6, PX0, Yb, PZ1, PX1, Yt, PZ1 + ew, 4 | 8, 1); col(PX0, PZ1, PX1, PZ1 + ew, YG, Yt);
    box(MAT.PLASTER, PLASTER, 0.6, PX0, Yb, PZ1 + ew, PX0 + ew, Yt, ZW - ew, 4 | 8, 1); col(PX0, PZ1, PX0 + ew, ZW, YG, Yt);
    box(MAT.PLASTER, PLASTER, 0.6, PX1 - ew, Yb, PZ1 + ew, PX1, Yt, ZW - ew, 4 | 8, 1); col(PX1 - ew, PZ1, PX1, ZW, YG, Yt);
    deck(PX0 + ew, PZ1 + ew, PX1 - ew, ZW - ew + 0.02, YG, [0.5, 0.42, 0.34]);                                           // the room's floor (the gallery deck meets it at the door sill)
    // timber frame on the outside of the front and a door frame; the door itself is open (dark inside), a boarded one at the east end
    for (const x of [PX0 + 0.05, PX0 + 3.0, PX1 - 0.05]) beam([x, Yb, ZW - 0.05], [x, Yt, ZW - 0.05], 0.14, 0.14);
    beam([PX0, YG + 1.5, ZW - 0.05], [PX1, YG + 1.5, ZW - 0.05], 0.12, 0.12); beam([PX0, Yt - 0.05, ZW - 0.05], [PX1, Yt - 0.05, ZW - 0.05], 0.18, 0.18);
    box(MAT.TIMBER, dark, 0.5, PX0 + 0.62, YG, ZW - 0.06, PX0 + 0.72, YG + 2.2, ZW + 0.04, 4 | 8, 1); box(MAT.TIMBER, dark, 0.5, PX0 + 1.78, YG, ZW - 0.06, PX0 + 1.88, YG + 2.2, ZW + 0.04, 4 | 8, 1); box(MAT.TIMBER, dark, 0.5, PX0 + 0.62, YG + 2.15, ZW - 0.06, PX0 + 1.88, YG + 2.27, ZW + 0.04, 4, 1);
    box(MAT.PLANKS, [0.5, 0.4, 0.3], 0.5, 13.0, YG, ZW - 0.03, 14.0, YG + 2.0, ZW + 0.0, 4 | 8 | 16, 1); for (const y of [0.4, 1.0, 1.6]) beam([12.9, YG + y, ZW - 0.07], [14.1, YG + y + 0.25, ZW - 0.07], 0.1, 0.03);
    K.read(13.5, YG + 1.1, ZF - 0.5, 2.2, 'gallery.boarded', 'A boarded door', 'Planks nailed across it in an X, and a chalk circle on the middle one. The landlord’s hand: “WASP NEST. ASK NO ONE.” You can hear a drone in there that might be wasps or might be a very patient fiddler.');
    // inside: barrels, crates, sacks, a bench, a lantern at the middle, a note
    { const m = M(11.4, -19.8), yy = YG + 0.02;
      for (const [x, z, k] of [[9.0, -21.6, 0], [9.7, -21.7, 0], [14.0, -21.6, 1], [13.3, -21.8, 2], [9.0, -18.2, 0], [14.1, -18.0, 2]]) { m.push().T(x, yy, z); if (k === 0) Props.barrel(m, 0.3, 0.8); else if (k === 1) Props.crate(m, 0.6); else Props.sack(m, 0.32); m.pop(); }
      m.push().T(11.4, yy, -21.9); Props.bench(m, 1.8); m.pop(); m.push().T(12.6, yy, -19.4).RY(0.4); Props.crate(m, 0.55); m.pop();
      beam([11.4, Yt - 0.3, -19.8], [11.4, YG + 2.35, -19.8], 0.04, 0.04); K.lantern(11.4, YG + 2.2, -19.8, 0.7); addLight([11.4, YG + 2.2, -19.8], 6, [3.0, 1.7, 0.6], 0, 'lantern'); }
    K.read(11.4, YG + 1.0, -21.6, 2.4, 'loft.note', 'A tally on the loft wall', 'Chalked in columns by someone with time to spare: casks in, casks out. The last line reads “one cask short, ask Wenn.” Wenn is the boatwright at the Wharf; the cask is probably in his boat.');
    World.interact.push({ p: [11.4, YG + 0.8, PZ1 + 0.6], r: 1.6, zone: 0, kind: 'read', id: 'loft.hoist', title: 'The hoist door', text: 'Double doors at the back of the loft, barred from inside; the hoist beam sticks out over the back lane. A rope, a hook, and a long drop to a dirt lane lined with water butts.' });
    // roof: gable, ridge along z, overhanging the front (over the gallery roof) and the lane
    const rise = 2.5, xm = (PX0 + PX1) / 2, xl = PX0 - 0.55, xr = PX1 + 0.55, za = PZ1 - 0.5, zb = ZW + 0.18, yr = Yt + rise, m = M(xm, -19.8);
    m.mat(MAT.SHINGLE, [0.56, 0.5, 0.45], 0.5); m.quad2([xl, Yt, za], [xl, Yt, zb], [xm, yr, zb], [xm, yr, za]); m.quad2([xm, yr, za], [xm, yr, zb], [xr, Yt, zb], [xr, Yt, za]);
    m.mat(MAT.TIMBER, dark, 0.6); m.box(xm - 0.08, yr - 0.03, za - 0.04, xm + 0.08, yr + 0.1, zb + 0.04, 4);
    for (const zz of [ZW - 0.02, PZ1 + 0.02]) { const nz = zz < -19.8 ? -1 : 1; m.mat(MAT.PLASTER, PLASTER, 0.6); const a = m.vert(PX0 - 0.1, Yt, zz, 0, 0, nz, 0, 0, 1), b = m.vert(PX1 + 0.1, Yt, zz, 0, 0, nz, 1, 0, 1), c = m.vert(xm, yr - 0.05, zz, 0, 0, nz, 0.5, 1, 1); m.tri(a, b, c); m.tri(a, c, b); }
    K.route('gallery', [[x0g(), gy(x0g(), -16.4), -16.4], [GX1 - 0.9, YG, -16.4], [10.2, YG, -16.4], [9.45, YG, -16.4], [9.45, YG, -18.8], [12.0, YG, -19.8]]);
    K.route('passage', [[11.4, g, -14.2], [11.4, g, -19.8], [11.4, g, -24.2]]);
    K.spot('passage.mid', 11.4, g, -19.8, 0); K.spot('loft.in', 11.4, YG, -19.8, 0);
    K.place('hartgallery', 'The Hart’s Gallery', 3, -16.4, 10); K.place('passage', 'The Hawker’s Passage', 11.4, -19.8, 5);
    // the back lane: dirt, a low wall one side, water butts, a yard at its end
    const lx = 11.4, lz0 = PZ1 - 0.2, lz1 = -31.0; const ml = M(lx, -26); ml.mat(MAT.GRAVEL, [0.74, 0.68, 0.6], 0.5); ml.quad2([lx - 1.2, gy(lx, lz0) + 0.03, lz0], [lx - 1.2, gy(lx, lz1) + 0.03, lz1], [lx + 1.2, gy(lx, lz1) + 0.03, lz1], [lx + 1.2, gy(lx, lz0) + 0.03, lz0]);
    for (const [x, z] of [[lx - 1.3, -24.4], [lx + 1.35, -26.6], [lx - 1.35, -28.5]]) { const m = M(x, z); m.push().T(x, gy(x, z), z); Props.barrel(m, 0.34, 0.9); m.pop(); }
    K.spot('passage.lane', lx, gy(lx, -24.5), -24.5, PI);
  }
  // ── c: the roofed bridge over the north road to the hoist loft ──
  { const BX0 = -14.3, BX1 = GX0, BZ0 = -17.1, BZ1 = -15.6, mz = (BZ0 + BZ1) / 2, LX0 = -17.7, LX1 = BX0, LZ0 = -18.5, LZ1 = -14.2;
    deck(BX0, BZ0, BX1, BZ1, YG); beam([BX0, YG - 0.34, BZ0 + 0.1], [BX1, YG - 0.34, BZ0 + 0.1], 0.14, 0.3); beam([BX0, YG - 0.34, BZ1 - 0.1], [BX1, YG - 0.34, BZ1 - 0.1], 0.14, 0.3);
    for (let x = BX0 + 0.4; x < BX1; x += 1.2) beam([x, YG - 0.2, BZ0], [x, YG - 0.2, BZ1], 0.1, 0.2);
    for (const x of [-9.9, -14.15]) for (const z of [BZ0 + 0.05, BZ1 - 0.05]) post(x, z, gy(x, z) - 0.3, YG, 0.22);                      // legs on the banks, none on the road (it runs at about x -12.2 here)
    for (let x = BX0 + 0.3; x <= BX1 - 0.2; x += 2.2) for (const z of [BZ0 + 0.05, BZ1 - 0.05]) post(x, z, YG, YG + 2.55, 0.15, true);
    for (const z of [BZ0 + 0.05, BZ1 - 0.05]) { box(MAT.PLANKS, [0.5, 0.42, 0.33], 0.5, BX0, YG, z - 0.04, BX1, YG + 1.05, z + 0.04, 4 | 1 | 2, 1); box(MAT.TIMBER, dark, 0.5, BX0, YG + 1.05, z - 0.07, BX1, YG + 1.12, z + 0.07, 1 | 2, 1); beam([BX0, YG + 2.55, z], [BX1, YG + 2.55, z], 0.15, 0.15); }
    col(BX0, BZ0, BX1, BZ0 + 0.1, YG - 0.1, YG + 1.15); col(BX0, BZ1 - 0.1, BX1, BZ1, YG - 0.1, YG + 1.15);
    // gable roof along the bridge (low pitch) and plank gables at the ends
    { const m = M((BX0 + BX1) / 2, mz), ye = YG + 2.55, yr = ye + 0.95, ov = 0.4; m.mat(MAT.SHINGLE, [0.52, 0.47, 0.43], 0.5);
      m.quad2([BX0 - 0.2, ye, BZ0 - ov], [BX1 + 0.2, ye, BZ0 - ov], [BX1 + 0.2, yr, mz], [BX0 - 0.2, yr, mz]); m.quad2([BX0 - 0.2, yr, mz], [BX1 + 0.2, yr, mz], [BX1 + 0.2, ye, BZ1 + ov], [BX0 - 0.2, ye, BZ1 + ov]);
      m.mat(MAT.TIMBER, dark, 0.6); m.box(BX0 - 0.2, yr - 0.03, mz - 0.07, BX1 + 0.2, yr + 0.08, mz + 0.07, 1 | 2); }
    // the loft platform: four posts to the ground, a deck, rails on three sides, a shed roof with a hoist beam, a barrel, a crate, a hay bale, the cat
    deck(LX0, LZ0, LX1, LZ1, YG); for (const [x, z] of [[LX0 + 0.1, LZ0 + 0.1], [LX0 + 0.1, LZ1 - 0.1], [LX1 - 0.12, LZ0 + 0.1], [LX1 - 0.12, LZ1 - 0.1]]) post(x, z, gy(x, z) - 0.3, YG + 2.6, 0.2);
    beam([LX0, YG - 0.34, LZ0 + 0.1], [LX1, YG - 0.34, LZ0 + 0.1], 0.14, 0.3); beam([LX0, YG - 0.34, LZ1 - 0.1], [LX1, YG - 0.34, LZ1 - 0.1], 0.14, 0.3); beam([LX0 + 0.1, YG - 0.34, LZ0], [LX0 + 0.1, YG - 0.34, LZ1], 0.14, 0.3);
    rail(LX0, LX1 - 0.1, LZ0 + 0.1, YG); rail(LX0, LX1 - 0.1, LZ1 - 0.1, YG); rail(LZ0 + 0.1, LZ1 - 0.1, LX0 + 0.1, YG, true);
    K.roofX(LX0 - 0.3, LX1 + 0.2, LZ0 - 0.3, YG + 3.0, LZ1 + 0.3, YG + 2.55, [0.5, 0.45, 0.4]);
    beam([-16.6, YG + 2.7, LZ0 - 0.2], [-16.6, YG + 2.8, LZ0 - 1.5], 0.12, 0.14); beam([-16.6, YG + 2.72, LZ0 - 1.5], [-16.6, YG + 1.6, LZ0 - 1.5], 0.025, 0.025);           // the hoist beam out over the back, with its rope
    { const m = M(-16, -16.3); m.push().T(-16.9, YG, LZ0 + 0.7); Props.barrel(m, 0.3, 0.8); m.pop(); m.push().T(-16.1, YG, LZ1 - 0.6).RY(0.4); Props.crate(m, 0.5); m.pop();
      m.push().T(-16.2, YG, -16.7); m.mat(MAT.THATCH, [0.72, 0.62, 0.38], 0.5); m.box(-0.4, 0, -0.25, 0.4, 0.4, 0.25); addBoxCollider(m, -0.4, -0.25, 0.4, 0.25, 0, 0.4); m.pop();
      m.push().T(-15.2, YG + 1.0, LZ1 - 0.1); K.cat(m, PI * 0.9); m.pop(); }
    K.read(-15.2, YG + 1.4, LZ1 - 0.5, 1.8, 'loft.cat', 'A cat on the rail', 'A grey tom, sitting on the rail as though he built the bridge. He regards you for a long moment, and then looks at the road again, and you get the impression that he has been rated against better tenants than you.');
    K.read(-16.7, YG + 1.1, LZ0 + 0.6, 2.4, 'loft.view', 'The hoist loft', 'From the hoist you can see the back of the smithy and the north road falling away toward the chapel hill, with a line of washing across it that is not the smithy’s. Someone has scratched “J + M” in the post, and under it, in a different hand, “no.”');
    K.pick('purse1', 'purse', [-16.3, YG + 0.42, LZ1 - 0.5], 'Take the purse', 'purse', mm => { mm.mat(MAT.CLOTH, [0.4, 0.3, 0.2], 0.4); mm.ball(0, 0.06, 0, 0.09, 0.08, 0.09, 8, 5); mm.mat(MAT.PLAIN, COL.leather); mm.cyl(0, 0.12, 0, 0.05, 0.05, 0.03, 8, 2); });
    K.pick('whistle1', 'whistle', [-17.15, YG + 0.04, LZ1 - 0.5], 'Take the whistle', 'whistle', mm => { mm.mat(MAT.PLAIN, [0.85, 0.8, 0.68]); mm.cyl(0, 0.02, 0, 0.012, 0.012, 0.09, 6, 2); mm.ball(0, 0.025, 0.045, 0.014, 0.014, 0.014, 5, 4); });
    K.lantern(-14.7, YG + 2.2, LZ1 - 0.2); K.spot('loft.platform', -16.4, YG, -16.4, -PI / 2);
    K.route('bridge', [[GX0 + 0.5, YG, -16.35], [-9.0, YG, -16.35], [-13.4, YG, -16.35], [-16.2, YG, -16.4]]);
    K.place('hoistloft', 'The Hoist Loft', -15.5, -16.4, 5);
  }
  lvLift(touch, 0.4);
  World.routesBuilt = 1;
  function x0g() { return 20.4 + 0.8; }
}
