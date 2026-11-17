// ───────────────────────── the village: houses, square, bridge, ruin, fences, dock ─────────────────────────
const headingTo = (x, z, tx, tz) => Math.atan2(tx - x, -(tz - z));
World.pickups = [];
// Build 42: faded, patched canvas for awnings (dull madder, ochre, woad, undyed linen), never candy stripes
const AWN = { madder: [0.34, 0.18, 0.15], ochre: [0.4, 0.3, 0.16], woad: [0.17, 0.21, 0.3], linen: [0.42, 0.39, 0.32] };
const VILLAGE_CELL = 80;        // m: the generated props (walls, fences, bridges, wells ...) are merged into one mesh per cell
function buildVillage() {
  const pack = new MeshPack(); pack.shadow = true;
  const buckets = new Map(), R = rng(777), OUT = { zone: 0 };
  const bucket = (x, z) => { const k = Math.floor(x / VILLAGE_CELL) + ',' + Math.floor(z / VILLAGE_CELL); let m = buckets.get(k); if (!m) { m = new Mesh(2048); m.seed = buckets.size * 7919 + 13; buckets.set(k, m); } return m; };
  // place something on the ground. rot is a heading: the prop's local -Z ends up facing that way
  const put = (x, z, yaw, fn, dy) => { const m = bucket(x, z); m.push().T(x, Terrain.y(x, z) + (dy || 0), z); if (yaw) m.RY(-yaw); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; const d = m.st.length; fn(m); if (m.st.length !== d) pushPopWarn(m, 'put'); m.pop(); };
  const putc = (x, z, yaw, fn, dy) => { const q = KEEP.slide(x, z, 0.55); return put(q[0], q[1], yaw, fn, dy); };      // Build 33: small props slide off door approaches and road centre lines
  const spot = (name, x, z, yaw, extra) => { World.spots[name] = Object.assign({ p: [x, Terrain.y(x, z), z], yaw: yaw || 0, zone: 0 }, extra || {}); };

  const houseExt = new Map();
  for (const site of SITES) {
    const spec = HOUSES[site.id]; if (!spec) continue;
    const h = buildHouse(site, spec);
    if (h.ext.ni) { const k = Math.floor(site.x / VILLAGE_CELL) + ',' + Math.floor(site.z / VILLAGE_CELL); let m = houseExt.get(k); if (!m) houseExt.set(k, m = new Mesh(1024)); m.append(h.ext); }      // the buildings' outer shells share one mesh per cell
    if (h.int.ni) pack.add(h.int, { kind: 'opaque', maxDist: site.infill ? 20 : 46, nearOnly: true, cell: h.cell ? h.cell.id : null }); if (h.glow.ni) pack.add(h.glow, { kind: 'glow', noShadow: true });
    if (h.cell && h.cell.decal && h.cell.decal.ni) pack.add(h.cell.decal, { kind: 'decal', cell: h.cell.id, noShadow: true, nearOnly: true });      // [l1] 72m_bake.js
    if (h.cell && h.cell.shaft && h.cell.shaft.ni) pack.add(h.cell.shaft, { kind: 'shaft', cell: h.cell.id, noShadow: true, nearOnly: true });
    const dl = siteDoorLocal(site, 0), dw = siteToWorld(site, dl[0], dl[1]);
    World.places.push({ id: site.id, name: site.name, x: dw[0], z: dw[1], r: Math.max(site.w, site.d) * 0.5 + 5, minor: true });      // minor: on the map, but no banner when you walk past a house
  }

  // ── fences and low walls ──
  const fence = (pts, o) => {
    o = o || {}; const hgt = o.h || 1.05;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = hyp(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 2.2));
      for (let k = 0; k < n; k++) {
        const x0 = lerp(a[0], b[0], k / n), z0 = lerp(a[1], b[1], k / n), x1 = lerp(a[0], b[0], (k + 1) / n), z1 = lerp(a[1], b[1], (k + 1) / n);
        const y0 = Terrain.y(x0, z0), y1 = Terrain.y(x1, z1), m = bucket((x0 + x1) / 2, (z0 + z1) / 2);
        m.m1 = 0; m.ao = 1;
        if (o.stone) {
          m.push().T((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2).RY(-Math.atan2(z1 - z0, x1 - x0)); const l = hyp(x1 - x0, z1 - z0) / 2 + 0.05;
          m.mat(MAT.STONE, [0.95, 0.95, 0.95], 0.8); m.grad = [1, 0.65]; m.box(-l, -0.7, -0.24, l, 0.85, 0.24, 4); m.grad = null; m.mat(MAT.STONE, [0.8, 0.8, 0.8], 0.6); m.box(-l, 0.85, -0.29, l, 0.95, 0.29);
          addBoxCollider(m, -l, -0.25, l, 0.25, -0.3, 1.2); m.pop();
        } else {
          m.mat(MAT.TIMBER, COL.timber);
          m.push().T(x0, y0, z0); m.cbox(0, -0.4, 0, 0.11, hgt + 0.4, 0.11, 4); m.pop();
          if (k === n - 1 && i === pts.length - 2) { m.push().T(x1, y1, z1); m.cbox(0, -0.4, 0, 0.11, hgt + 0.4, 0.11, 4); m.pop(); }
          for (const hh of [0.42, 0.86]) m.beam([x0, y0 + hh * hgt / 1.05, z0], [x1, y1 + hh * hgt / 1.05, z1], 0.045, 0.1);
          m.push().T((x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2).RY(-Math.atan2(z1 - z0, x1 - x0)); const l = hyp(x1 - x0, z1 - z0) / 2;
          addBoxCollider(m, -l, -0.07, l, 0.07, -0.2, 1.2); m.pop();
        }
      }
    }
  };
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]];

  // ── the square ──
  put(6.2, -8.6, 0.3, m => typeof wellRound === 'function' ? wellRound(m) : Props.well(m));
  const OAK = World.oakPos = [-7.6, 6.4];
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3; put(OAK[0] + Math.cos(a) * 1.75, OAK[1] + Math.sin(a) * 1.75, a + PI / 2, m => Props.bench(m, 1.75, true)); }
  { const m = bucket(OAK[0], OAK[1]); m.push().T(OAK[0], Terrain.y(OAK[0], OAK[1]), OAK[1]); addCircleCollider(m, 0, 0, 2.0, 0, 0.24); m.pop(); }      // [fx3] 0.24 high: the root bank is stepped over and no longer counts as a solid through the trunk
  spot('square.bench', OAK[0] + 1.75, OAK[1] + 0.55, PI / 2 + 0.2, { sit: 0.46 }); spot('square.bench2', OAK[0] - 0.1, OAK[1] - 1.8, 0.1, { sit: 0.46 });
  const stalls = [[10.2, 4.6, AWN.madder, 0], [5.6, 9.4, AWN.woad, 1], [-11.6, -5.8, AWN.ochre, 2]];
  for (const [x, z, col, kind] of stalls) {
    const yaw = headingTo(x, z, 0, -1.5);
    put(x, z, yaw, m => Props.stall(m, col, y => {
      if (kind === 0) { for (const [cx, kindG] of [[-0.85, 'apple'], [0, 'cabbage'], [0.85, 'apple']]) at(m, cx, y, -0.3, 0, () => { m.mat(MAT.PLANKS, COL.wood, 0.5); m.box(-0.36, 0, -0.26, 0.36, 0.14, 0.26, 8); for (let i = 0; i < 12; i++) at(m, (i % 4) * 0.17 - 0.26, 0.12, Math.floor(i / 4) * 0.16 - 0.16, 0, () => kindG === 'apple' ? Props.apple(m, cx < 0 ? COL.apple : [0.62, 0.72, 0.22]) : Props.cabbage(m)); }); }
      else if (kind === 1) Props.clutter(m, R, -1.1, 1.1, y, -0.25, ['loaf', 'cheese', 'loaf', 'cheese', 'jug', 'loaf'], 7);
      else { Props.clutter(m, R, -1.1, 0.2, y, -0.25, ['pot', 'pot', 'jug', 'bowl', 'pot'], 5); for (let k = 0; k < 3; k++) at(m, 0.55 + k * 0.22, y, -0.3, PI / 2, () => clothBolt(m, [DYE.red, DYE.yellow, DYE.blue][k])); }
    }));
    const b = [x - Math.sin(yaw) * 1.05, z + Math.cos(yaw) * 1.05];
    spot('stall' + kind, b[0], b[1], yaw); spot('stallfront' + kind, x + Math.sin(yaw) * 1.7, z - Math.cos(yaw) * 1.7, yaw + PI);
  }
  putc(11.8, 6.3, 0.4, m => Props.barrel(m)); putc(12.2, 5.2, 0, m => Props.crate(m, 0.6)); putc(4.0, 10.6, 0.2, m => Props.crate(m, 0.55)); putc(-12.9, -4.2, 0, m => Props.barrel(m));
  putc(-6.4, 11.3, 0.08, m => Props.cart(m, true));      // Build 42: parked against the terrace wall east of the flight (it stood on the steps' first treads)
  // festival fire pit (lit at the end of the story)
  World.bonfirePos = [-2.6, -7.4];
  put(-2.6, -7.4, 0, m => {
    m.mat(MAT.ROCK, [0.9, 0.9, 0.9], 0.4); for (let i = 0; i < 11; i++) { const a = i * TAU / 11; m.ball(Math.cos(a) * 1.15, 0.1, Math.sin(a) * 1.15, 0.24 + R() * 0.08, 0.17, 0.2, 6, 4); }
    m.mat(MAT.BARK, [1, 1, 1], 0.6); for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + 0.2; m.tube([[Math.cos(a) * 0.85, 0.02, Math.sin(a) * 0.85], [Math.cos(a) * 0.1, 1.55 + R() * 0.3, Math.sin(a) * 0.1]], [0.085, 0.06], 6, true); }
    m.mat(MAT.PLAIN, [0.08, 0.07, 0.07]); m.disc(0, 0.03, 0, 1.0, 10, 1);
    addCircleCollider(m, 0, 0, 1.2, 0, 1.2);
    World.emitters.push({ type: 'bonfire', p: wp(m, 0, 0.5, 0), size: 1.5, zone: 0 }); addLight(wp(m, 0, 1.8, 0), 20, [7, 3.5, 1.2], 0, 'bonfire');
  });
  // notice board by the inn
  put(3.6, -15.4, PI, m => {
    m.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) m.cbox(s * 0.8, -0.3, 0, 0.1, 2.5, 0.1, 4);
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.8, 0.95, -0.03, 0.8, 1.95, 0.03); m.mat(MAT.SHINGLE, [0.8, 0.7, 0.6], 0.5); m.quad2([-1.0, 2.25, -0.3], [-1.0, 2.1, 0.12], [1.0, 2.1, 0.12], [1.0, 2.25, -0.3]);
    m.mat(MAT.PLAIN, COL.parchment); for (const [px, py, pw, ph] of [[-0.55, 1.35, 0.34, 0.42], [-0.1, 1.2, 0.3, 0.36], [0.35, 1.4, 0.36, 0.44], [0.1, 1.62, 0.22, 0.26]]) m.box(px, py, -0.04, px + pw, py + ph, -0.03);
    addBoxCollider(m, -0.85, -0.08, 0.85, 0.08, 0, 2);
    World.interact.push({ p: wp(m, 0, 1.4, -0.3), r: 2.0, zone: 0, kind: 'read', id: 'board', title: 'Village notices', text: 'WANTED: steady hands at Fairweather Farm.  •  LOST: one smith’s hammer, last seen with a certain apprentice.  •  Frostcap gatherers — see Maren.  •  The Dawn bell wants a new rope.' });
  });
  for (const [x, z] of [[-3.6, -16.3], [3.2, -16.5]]) putc(x, z, PI, m => Props.bench(m, 1.8));
  putc(-6.8, -16.4, 0, m => Props.barrel(m)); putc(-6.2, -15.9, 0.6, m => Props.barrel(m, 0.3, 0.75)); putc(6.9, -16.3, 0.3, m => Props.crate(m, 0.7));
  putc(19.2, -5.2, 0, m => Props.barrel(m)); putc(18.7, -6.5, 0.4, m => Props.crate(m, 0.55)); putc(19.1, -11.4, 0, m => Props.sack(m, 0.32));
  // lamps and signposts
  for (const [x, z, a] of [[-13.2, -8.3, 0.8], [13.6, -10.2, -0.8], [-14.2, 5.2, 2.2], [13.2, 8.4, -2.4], [-31, -6.6, 0], [-50, -8.2, 0], [34, 3.4, PI], [47.5, -0.4, 0], [-12.2, -33, 1.6], [-8.6, -58.5, 1.2], [1.2, 30, -1.5], [4.4, 56, -1.5], [69, 0.2, 0], [86, -2.2, 0.2], [-63.5, 2, 1.5], [3.3, 78, -1.4], [70.2, 16, -1.6], [-9.5, 3.5, 0.3], [9.2, 4.2, -0.3], [-6.5, -12.2, 0.2]]) putc(x, z, a, m => Props.lampPost(m, OUT));
  putc(14.6, 2.4, 0.4, m => Props.signPost(m, 3)); putc(-58.5, -8.4, -0.3, m => Props.signPost(m, 2)); putc(-8.9, -61.5, 0, m => Props.signPost(m, 2));

  // ── west gate ──
  put(-62, -5.2, PI / 2, m => {
    m.mat(MAT.TIMBER, COL.timberDark);
    for (const s of [-1, 1]) { m.cbox(s * 2.9, -0.6, 0, 0.36, 5.3, 0.36, 4); addCircleCollider(m, s * 2.9, 0, 0.24, 0, 4); m.beam([s * 2.9, 3.4, 0], [s * 1.9, 4.35, 0], 0.16, 0.16); at(m, s * 2.6, 2.9, -0.24, 0, () => Props.lantern(m, OUT)); }
    m.box(-3.5, 4.35, -0.18, 3.5, 4.7, 0.18); m.box(-3.2, 4.7, -0.12, 3.2, 4.85, 0.12);
    m.mat(MAT.PLANKS, COL.wood); m.box(-1.0, 3.5, -0.035, 1.0, 4.2, 0.035);
    m.mat(MAT.PLAIN, [0.2, 0.42, 0.2]); for (const zf of [-0.04, 0.04]) for (let i = 0; i < 4; i++) { const y = 3.6 + i * 0.13, w2 = 0.3 - i * 0.065; const pts = [[-w2, y, zf], [w2, y, zf], [0, y + 0.22, zf]]; m.poly(zf < 0 ? pts.reverse() : pts); }
    for (const s of [-1, 1]) { m.push().T(s * 2.35, 4.3, 0.02); Props.banner(m, 0.62, 1.5, AWN.madder, s); m.pop(); }          // [fx1] a hung banner with folds, a hem and a rod, not a flat red slab
  });
  for (const s of [-1, 1]) for (let i = 0; i < 16; i++) {
    const z = -5.2 + s * (3.4 + i * 0.36), x = -62 + Math.sin(i * 0.4) * 0.12 - i * i * 0.012;
    put(x, z, R() * 3, m => { const h = 2.7 + R() * 0.5 - i * 0.05; m.mat(MAT.BARK, [0.9, 0.85, 0.8], 0.6); m.grad = [1, 0.6]; m.lathe([[0.17, -0.5], [0.16, h - 0.3], [0.02, h]], 7, 0); m.grad = null; });
    if (i % 4 === 0) { const m = bucket(x, z); m.push().T(x, Terrain.y(x, z), z); addBoxCollider(m, -0.2, -0.2, 0.2, 1.3, 0, 2.5); m.pop(); }
  }
  spot('gate.post', -60.4, -7.6, -PI / 2 + 0.3); spot('gate.post2', -60.2, -2.9, -PI / 2 - 0.2);
  World.places.push({ id: 'gate', name: 'Brackenfell Gate', x: -62, z: -5.2, r: 7, minor: true });
  World.places.push({ id: 'square', name: 'Market Square', x: 0, z: -2, r: 9, minor: true });

  // ── stone bridge ──
  {
    const bx = BRIDGE.x, bz = BRIDGE.z, hl = BRIDGE.len / 2, hw = BRIDGE.w / 2, n = 12, m = bucket(bx, bz);
    const y0 = Terrain.y(bx - hl, bz), y1 = Terrain.y(bx + hl, bz), wy = riverY(River.dist(bx, bz, 20) < 20 ? River.at : 0);
    const deckY = x => lerp(y0, y1, (x - bx + hl) / BRIDGE.len) + 1.05 * (1 - Math.pow((x - bx) / hl, 2));
    const archY = x => { const k = (x - bx) / 5.4; return Math.abs(k) < 1 ? wy - 0.1 + 2.25 * Math.sqrt(1 - k * k) : -9; };
    m.m1 = 0; m.ao = 1; m.grad = null;
    for (let i = 0; i < n; i++) {
      const xa = bx - hl + BRIDGE.len * i / n, xb = bx - hl + BRIDGE.len * (i + 1) / n, ya = deckY(xa), yb = deckY(xb);
      m.mat(MAT.COBBLE, [1, 1, 1]); m.quad([xa, ya, bz - hw], [xa, ya, bz + hw], [xb, yb, bz + hw], [xb, yb, bz - hw], xa / 2.5, 0, xb / 2.5, BRIDGE.w / 2.5);
      m.push().T((xa + xb) / 2, 0, bz); addFloor(m, -(xb - xa) / 2, -hw, (xb - xa) / 2, hw, ya, yb, 'x'); m.pop();
      const aa = Math.max(archY(xa), Math.min(y0, y1) - 2.5), ab = Math.max(archY(xb), Math.min(y0, y1) - 2.5);
      for (const s of [-1, 1]) {
        const zo = bz + s * (hw + 0.4), zi = bz + s * hw, top = 0.85;
        m.mat(MAT.STONE, [1, 1, 1]);
        const o1 = [xa, ya + top, zo], o2 = [xa, aa, zo], o3 = [xb, ab, zo], o4 = [xb, yb + top, zo];
        if (s > 0) m.quad(o1, o2, o3, o4, xa / 2, 0, xb / 2, (ya + top - aa) / 2); else m.quad(o4, o3, o2, o1, xb / 2, 0, xa / 2, (ya + top - aa) / 2);
        const i1 = [xa, ya + top, zi], i2 = [xa, ya, zi], i3 = [xb, yb, zi], i4 = [xb, yb + top, zi];
        if (s > 0) m.quad(i4, i3, i2, i1); else m.quad(i1, i2, i3, i4);
        m.mat(MAT.STONE, [0.85, 0.85, 0.85], 0.7); const c1 = [xa, ya + top, zi], c2 = [xa, ya + top, zo], c3 = [xb, yb + top, zo], c4 = [xb, yb + top, zi];
        if (s > 0) m.quad(c1, c2, c3, c4); else m.quad(c2, c1, c4, c3);
      }
      if (archY(xa) > -8 || archY(xb) > -8) { m.mat(MAT.STONE, [0.8, 0.8, 0.8]); m.ao = 0.5; m.quad([xa, aa, bz + hw + 0.4], [xa, aa, bz - hw - 0.4], [xb, ab, bz - hw - 0.4], [xb, ab, bz + hw + 0.4]); m.ao = 1; }
    }
    for (const s of [-1, 1]) { m.push().T(bx, 0, bz + s * (hw + 0.2)); addBoxCollider(m, -hl - 0.4, -0.22, hl + 0.4, 0.22, Math.min(y0, y1) - 1, Math.max(y0, y1) + 2.6); m.pop(); for (const e of [-1, 1]) { const x = bx + e * (hl + 0.25), y = e < 0 ? y0 : y1; m.mat(MAT.STONE, [0.95, 0.95, 0.95]); m.box(x - 0.36, y - 1.2, bz + s * (hw + 0.2) - 0.36, x + 0.36, y + 1.25, bz + s * (hw + 0.2) + 0.36); m.mat(MAT.STONE, [0.8, 0.8, 0.8], 0.6); m.box(x - 0.43, y + 1.25, bz + s * (hw + 0.2) - 0.43, x + 0.43, y + 1.38, bz + s * (hw + 0.2) + 0.43); } }
    World.places.push({ id: 'bridge', name: 'Stonewater Bridge', x: bx, z: bz, r: 8, minor: true });
  }

  // ── old watchtower on the crag ──
  {
    const T = SITE.tower, ty = T.y, doorA = 1.95;
    const m = bucket(T.x, T.z); m.m1 = 0; m.ao = 1;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU, da = Math.abs(angDiff(a, doorA)); if (da < 0.3) continue;
      let h = 0.9 + 5.6 * Math.pow(Math.max(0, Math.cos(a + 1.35)), 1.3) + R() * 1.1; if (da < 0.75) h = Math.max(h, 2.4);
      m.push().T(T.x + Math.cos(a) * 4.4, ty, T.z + Math.sin(a) * 4.4).RY(-a - PI / 2);
      m.mat(MAT.STONE, [0.92, 0.92, 0.9]); m.grad = [1, 0.7]; m.box(-1.02, -2.5, -0.4, 1.02, h, 0.4, 4); m.grad = null;
      if (h > 1.6) { m.box(-1.02 + R() * 0.5, h, -0.4, -0.1 + R() * 0.4, h + 0.3 + R() * 0.5, 0.4, 4); }
      if (h > 4) { m.mat(MAT.PLAIN, [0.02, 0.02, 0.03]); m.quad([0.2, 3.9, -0.41], [0.2, 3.0, -0.41], [-0.2, 3.0, -0.41], [-0.2, 3.9, -0.41]); }
      addBoxCollider(m, -1.02, -0.4, 1.02, 0.4, -0.5, h + 1); m.pop();
    }
    m.push().T(T.x, ty, T.z);
    m.mat(MAT.COBBLE, [0.9, 0.9, 0.9], 1.2); m.disc(0, 0.04, 0, 4.1, 16, 1); addFloor(m, -4.1, -4.1, 4.1, 4.1, 0.04);
    m.mat(MAT.ROCK, [0.9, 0.9, 0.9], 0.4); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; m.ball(-0.9 + Math.cos(a) * 0.55, 0.12, 0.4 + Math.sin(a) * 0.55, 0.16, 0.12, 0.14, 6, 4); }
    at(m, -0.9, 0.05, 0.4, 0.5, () => Props.logs(m, 3, 0.6, 0.055));
    World.emitters.push({ type: 'fire', p: wp(m, -0.9, 0.22, 0.4), size: 0.38, zone: 0 }); addLight(wp(m, -0.9, 0.9, 0.4), 8, [3.0, 1.5, 0.52], 0, 'fire');
    at(m, 0.8, 0.04, -1.6, 0.4, () => { m.mat(MAT.CLOTH, [0.45, 0.3, 0.22], 0.6); m.box(-0.4, 0, -0.95, 0.4, 0.07, 0.95); m.mat(MAT.CLOTH, COL.wool, 0.6); m.push().T(0, 0.1, -0.8).RZ(PI / 2).T(0, -0.35, 0); m.cyl(0, 0, 0, 0.1, 0.1, 0.7, 8, 3); m.pop(); });
    at(m, -2.3, 0.04, -0.3, 1.2, () => { m.mat(MAT.BARK, [1, 1, 1], 0.6); m.push().T(0, 0.2, 0).RZ(PI / 2).T(0, -0.7, 0); m.cyl(0, 0, 0, 0.2, 0.19, 1.4, 8, 3); m.pop(); });
    at(m, 1.9, 0.04, 2.2, -0.7, () => Props.chest(m)); World.interact.push({ p: wp(m, 1.9, 0.5, 2.2), r: 1.8, zone: 0, kind: 'chest', id: 'tower.chest', loot: [['gold', 18], ['apple', 2]] });
    World.spots['tower.fire'] = { p: wp(m, 0.3, 0.04, 1.4), yaw: -2.2, zone: 0 };
    World.pickupSpot = World.pickupSpot || {}; World.pickupSpot.hammer = wp(m, -2.0, 0.42, -0.25);
    m.pop();
    for (let i = 0; i < 9; i++) { const a = R() * TAU, r = 5.5 + R() * 4; put(T.x + Math.cos(a) * r, T.z + Math.sin(a) * r, R() * 3, mm => { mm.push().RZ(R.s() * 0.4).RX(R.s() * 0.4); mm.mat(MAT.STONE, [0.9, 0.9, 0.88], 0.6); const s = 0.3 + R() * 0.35; mm.box(-s, -0.1, -s * 0.6, s, s * 0.9, s * 0.6); mm.pop(); }); }
    World.places.push({ id: 'tower', name: 'The Old Watchtower', x: T.x, z: T.z, r: 9 });
  }

  // ── lake: dock, boat, drying rack ──
  {
    const a = [6.8, 88.2], b = [9.6, 103.5], yaw = headingTo(a[0], a[1], b[0], b[1]), L = hyp(b[0] - a[0], b[1] - a[1]), dy = LAKE.y + 0.5;
    const m = bucket(a[0], a[1]); m.m1 = 0; m.ao = 1;
    m.push().T(a[0], dy, a[1]).RY(-yaw);       // local -Z runs out along the dock
    m.mat(MAT.PLANKS, COL.wood); for (let i = 0; i < Math.floor(L / 0.32); i++) m.box(-0.85 + R.s() * 0.03, -0.05, -i * 0.32 - 0.29, 0.85 + R.s() * 0.03, 0, -i * 0.32);
    m.mat(MAT.TIMBER, COL.timberDark); for (const s of [-1, 1]) { m.box(s * 0.7 - 0.06, -0.2, -L, s * 0.7 + 0.06, -0.05, 0); for (let z = -0.4; z > -L; z -= 2.6) { m.grad = [1, 0.5]; m.cbox(s * 0.86, -3.2, z, 0.17, 3.2 + (Math.round(-z) % 2 ? 0.9 : 0.25), 0.17, 4); m.grad = null; } }
    addFloor(m, -0.85, -L, 0.85, 0, 0); addFloor(m, -0.85, 0, 0.85, 2.2, 0, Terrain.y(a[0] - Math.sin(yaw) * 2.2, a[1] + Math.cos(yaw) * 2.2) - dy, 'z');
    m.mat(MAT.PLANKS, COL.wood); m.quad([-0.85, 0, 0], [-0.85, Terrain.y(a[0] - Math.sin(yaw) * 2.2, a[1] + Math.cos(yaw) * 2.2) - dy, 2.2], [0.85, Terrain.y(a[0] - Math.sin(yaw) * 2.2, a[1] + Math.cos(yaw) * 2.2) - dy, 2.2], [0.85, 0, 0]);
    at(m, 0.5, 0, -L + 1.2, 0, () => Props.barrel(m, 0.28, 0.7)); at(m, -0.5, 0, -L + 3.8, 0.3, () => Props.crate(m, 0.5));
    const end = wp(m, 0, 0, -L + 0.7); World.spots['dock.end'] = { p: end, yaw, zone: 0 };
    // rowing boat moored beside the dock
    m.push().T(1.9, -0.66, -L + 3.0).RY(0.12);
    m.mat(MAT.PLANKS, COL.woodDark, 0.6);
    const hull = (u, v) => { const x = v * 0.62 * (1 - Math.pow(Math.abs(u), 2.4)), y = 0.5 * (v * v) + 0.12 * u * u * (u > 0 ? 1 : 0.6), z = u * 1.9; return [x, y, z]; };
    m.grid(10, 8, (i, j) => { const u = i / 10 * 2 - 1, v = j / 8 * 2 - 1, p = hull(u, v); return m.vert(p[0], p[1], p[2], v, -1.2, 0, i * 0.3, j * 0.2); });
    m.grid(10, 8, (i, j) => { const u = i / 10 * 2 - 1, v = -(j / 8 * 2 - 1), p = hull(u, v); return m.vert(p[0] * 0.96, p[1] + 0.03, p[2] * 0.98, -v, 1.2, 0, i * 0.3, j * 0.2); });
    m.mat(MAT.PLANKS, COL.wood, 0.6); for (const z of [-0.8, 0.5]) m.box(-0.5, 0.3, z - 0.12, 0.5, 0.33, z + 0.12);
    m.pop(); m.pop();
    put(-4.2, 86.2, 0.6, mm => { mm.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) { mm.beam([s * 1.1, -0.2, -0.3], [s * 1.1, 1.7, 0], 0.07, 0.07); mm.beam([s * 1.1, -0.2, 0.3], [s * 1.1, 1.7, 0], 0.07, 0.07); } mm.beam([-1.3, 1.7, 0], [1.3, 1.7, 0], 0.06, 0.06); for (let i = 0; i < 7; i++) { mm.mat(MAT.METAL, [0.8, 0.85, 0.9]); mm.push().T(-0.9 + i * 0.3, 1.35, 0); mm.ball(0, 0, 0, 0.035, 0.2, 0.08, 6, 5); mm.pop(); } });
    { const fs = SITE.fisher, fx = Math.sin(fs.yaw), fz = -Math.cos(fs.yaw), p0 = [fs.x + fx * (fs.d / 2 + 1.8), fs.z + fz * (fs.d / 2 + 1.8)]; let ux = LAKE.x - p0[0], uz = LAKE.z - p0[1]; const ul = hyp(ux, uz); ux /= ul; uz /= ul;
      put(p0[0] + ux * 2.2 - uz * 1.7, p0[1] + uz * 2.2 + ux * 1.7, 0, mm => Props.barrel(mm)); put(p0[0] + ux * 3.4 - uz * 1.9, p0[1] + uz * 3.4 + ux * 1.9, 0.5, mm => Props.crate(mm, 0.5)); }      // beside the pier, not on its line (Build 33)
    World.places.push({ id: 'lake', name: 'Mirrormere', x: 7, z: 90, r: 9 });
  }

  if (typeof buildBoards === 'function') buildBoards(bucket, fence, R);
  if (typeof buildLevels === 'function') buildLevels(bucket, fence, R);      // Build 33: upper ward (73f_levels.js)
  if (typeof buildWharf === 'function') buildWharf(bucket, fence, R);      // Build 33: the lower ward (73g_wharf.js)

  // ── farm: fields, coop, scarecrow, hay ──
  for (const f of FIELDS) { const p = rect(f.x0 - 0.8, f.z0 - 0.8, f.x1 + 0.8, f.z1 + 0.8); fence([p[0], [lerp(p[0][0], p[1][0], 0.38), p[0][1]]]); fence([[lerp(p[0][0], p[1][0], 0.52), p[0][1]], p[1], p[2], p[3], p[4]]); }
  put(93, 20, 0.4, m => { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.08, 2.2, 0.08, 4); m.beam([-0.75, 1.5, 0], [0.75, 1.5, 0], 0.06, 0.06); m.mat(MAT.CLOTH, [0.5, 0.36, 0.22], 0.5); m.box(-0.22, 0.85, -0.1, 0.22, 1.55, 0.1); for (const s of [-1, 1]) m.box(s * 0.22, 1.38, -0.07, s * 0.72, 1.56, 0.07); m.mat(MAT.CLOTH, COL.wool, 0.4); m.ball(0, 1.76, 0, 0.16, 0.18, 0.16, 8, 6); m.mat(MAT.THATCH, COL.hay, 0.4); m.lathe([[0.34, 1.9], [0.14, 1.94], [0.12, 2.08], [0.02, 2.14]], 9, 0); });
  put(116, 24, 0, m => Props.haystack(m, 1.3)); put(110, 42, 0, m => Props.haystack(m, 1.1)); put(90, 44, 1, m => Props.haybale(m)); put(108.5, 8.5, 0.5, m => Props.haybale(m));
  put(104.5, -17.5, 0.9, m => {      // chicken coop
    m.mat(MAT.PLANKS, COL.wood); m.box(-0.9, 0.3, -0.7, 0.9, 1.2, 0.7); m.mat(MAT.TIMBER, COL.timber); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cbox(sx * 0.8, -0.2, sz * 0.6, 0.08, 0.5, 0.08);
    m.mat(MAT.THATCH, COL.hay, 0.6); m.quad2([-1.05, 1.75, 0], [-1.05, 1.15, -0.9], [1.05, 1.15, -0.9], [1.05, 1.75, 0]); m.quad2([1.05, 1.75, 0], [1.05, 1.15, 0.9], [-1.05, 1.15, 0.9], [-1.05, 1.75, 0]);
    m.mat(MAT.PLANKS, COL.wood); m.poly([[-0.9, 1.2, -0.7], [-0.9, 1.2, 0.7], [-0.9, 1.72, 0]]); m.poly([[0.9, 1.2, 0.7], [0.9, 1.2, -0.7], [0.9, 1.72, 0]]);
    m.mat(MAT.PLAIN, [0.05, 0.04, 0.04]); m.quad([-0.2, 0.75, -0.71], [-0.2, 0.3, -0.71], [0.2, 0.3, -0.71], [0.2, 0.75, -0.71]); m.mat(MAT.PLANKS, COL.wood); m.quad2([-0.2, 0.3, -0.7], [-0.2, 0.0, -1.35], [0.2, 0.0, -1.35], [0.2, 0.3, -0.7]);
    addBoxCollider(m, -0.9, -0.7, 0.9, 0.7, 0, 1.5);
  });
  World.coop = [104.5, -17.5];
  fence(rect(101.5, -21, 108.5, -13.5).slice(0, 4)); putc(102.6, -9.6, 0.2, m => Props.cart(m, false));
  putc(95.2, -17, 1.2, m => Props.woodpile(m, 5, 4, 0.7)); putc(93.6, -19.8, 0, m => Props.barrel(m));
  spot('farm.field', 93, 16, 2.4); spot('farm.field2', 112, 20, -1.0); spot('farm.yard', 101, -15.5, 1.0); spot('barn.front', 108.2, -3, PI / 2);
  World.places.push({ id: 'fields', name: 'Fairweather Fields', x: 96, z: 22, r: 16, minor: true });

  // ── cottage yards ──
  const H = SITE.herbalist, hg = [[2.2, 3.4], [7.2, 3.4], [7.2, -2.4], [3.6, -2.4]].map(p => siteToWorld(H, p[0] + H.w / 2 - 2.6, p[1]));
  fence(hg, { h: 0.9 });
  for (let i = 0; i < 3; i++) for (let k = 0; k < 5; k++) { const p = siteToWorld(H, H.w / 2 + 0.7 + k * 0.85, -1.6 + i * 1.5); (World.gardenPlants = World.gardenPlants || []).push([p[0], p[1], i]); }
  { const p = siteToWorld(H, H.w / 2 + 2.4, 1.0); spot('herbalist.garden', p[0], p[1], H.yaw + PI / 2); }
  for (const [lx, lz] of [[-H.w / 2 - 1.2, 1.2], [-H.w / 2 - 1.9, 0.3]]) { const p = siteToWorld(H, lx, lz); put(p[0], p[1], 0, m => { m.mat(MAT.PLANKS, COL.wood); m.box(-0.35, 0, -0.35, 0.35, 0.3, 0.35); m.mat(MAT.THATCH, COL.hay, 0.4); m.lathe([[0.3, 0.3], [0.32, 0.5], [0.24, 0.75], [0.08, 0.9]], 10, 0); addCircleCollider(m, 0, 0, 0.36, 0, 0.9); }); }
  { const E = SITE.elder, p = siteToWorld(E, -E.w / 2 - 0.9, 0.4); putc(p[0], p[1], E.yaw + PI / 2, m => Props.woodpile(m, 6, 5, 0.6)); const q = siteToWorld(E, 2.6, -E.d / 2 - 0.5); putc(q[0], q[1], E.yaw, m => Props.bench(m, 1.5)); spot('elder.porch', q[0] + Math.sin(E.yaw) * 0.05, q[1] - Math.cos(E.yaw) * 0.05, E.yaw, { sit: 0.46 }); }
  { const W2 = SITE.weaver, a = siteToWorld(W2, -W2.w / 2 - 0.6, W2.d / 2 + 2.4), b = siteToWorld(W2, -W2.w / 2 - 5.2, W2.d / 2 + 1.0);
    for (const p of [a, b]) put(p[0], p[1], 0, m => { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.09, 2.2, 0.09, 4); });
    const ya = Terrain.y(a[0], a[1]) + 1.85, yb = Terrain.y(b[0], b[1]) + 1.85, m = bucket(a[0], a[1]); m.m1 = 0; m.ao = 1;
    m.mat(MAT.CLOTH, [0.7, 0.6, 0.4], 0.3); m.beam([a[0], ya, a[1]], [b[0], yb, b[1]], 0.02, 0.02);
    for (let i = 0; i < 5; i++) { const k0 = 0.1 + i * 0.17, k1 = k0 + 0.11, c = [COL.linen, COL.red, COL.blue, COL.linen, COL.gold][i], hgt = 0.6 + (i % 2) * 0.35; m.mat(MAT.CLOTH, c, 0.6); const p0 = [lerp(a[0], b[0], k0), lerp(ya, yb, k0), lerp(a[1], b[1], k0)], p1 = [lerp(a[0], b[0], k1), lerp(ya, yb, k1), lerp(a[1], b[1], k1)]; m.quad2(p0, [p0[0], p0[1] - hgt, p0[2]], [p1[0], p1[1] - hgt, p1[2]], p1); } }
  { const G = SITE.guardhouse, p = siteToWorld(G, -G.w / 2 - 1.0, 0.5); put(p[0], p[1], 0.3, m => { m.push().T(0, 1.15, 0).RX(PI / 2).T(0, -0.07, 0); m.mat(MAT.THATCH, COL.hay, 0.5); m.cyl(0, 0, 0, 0.45, 0.45, 0.14, 14, 3); m.mat(MAT.PLAIN, COL.red); m.disc(0, 0.145, 0, 0.3, 12, 1); m.mat(MAT.PLAIN, COL.linen); m.disc(0, 0.15, 0, 0.2, 12, 1); m.mat(MAT.PLAIN, COL.red); m.disc(0, 0.155, 0, 0.09, 10, 1); m.pop(); m.mat(MAT.TIMBER, COL.timber); for (const [bx, bz] of [[-0.4, -0.05], [0.4, -0.05], [0, 0.7]]) m.beam([bx, -0.1, bz], [0, 1.15, -0.02], 0.06, 0.06); }); }
  { const Hn = SITE.hunter, p = siteToWorld(Hn, Hn.w / 2 + 1.6, -1.0); put(p[0], p[1], Hn.yaw, m => { m.mat(MAT.TIMBER, COL.timber); for (const s of [-1, 1]) m.cbox(s * 0.9, -0.3, 0, 0.08, 2.0, 0.08, 4); m.beam([-0.9, 1.65, 0], [0.9, 1.65, 0], 0.06, 0.06); at(m, -0.4, 0.6, 0, 0, () => { pelt(m, 0.8, 1.0); m.push().RY(PI); pelt(m, 0.8, 1.0); m.pop(); }); at(m, 0.45, 0.75, 0, 0, () => { pelt(m, 0.6, 0.85); m.push().RY(PI); pelt(m, 0.6, 0.85); m.pop(); }); });
    const q = siteToWorld(Hn, -1.4, -Hn.d / 2 - 2.4); put(q[0], q[1], 0, m => { m.mat(MAT.BARK, [1, 1, 1], 0.6); m.cyl(0, 0, 0, 0.32, 0.3, 0.5, 9, 2); m.mat(MAT.TIMBER, COL.wood); m.beam([0.05, 0.5, 0], [0.4, 1.05, 0.1], 0.03, 0.03); m.mat(MAT.METAL, COL.iron); m.box(-0.02, 0.45, -0.08, 0.12, 0.62, 0.1); });
    const w3 = siteToWorld(Hn, -Hn.w / 2 - 0.8, 0); put(w3[0], w3[1], Hn.yaw + PI / 2, m => Props.woodpile(m, 6, 5, 0.6)); spot('hunter.yard', q[0] + 1.2, q[1] + 0.3, Hn.yaw + 2.2); }
  // chapel yard
  { const C = SITE.chapel, yd = pts => pts.map(p => siteToWorld(C, p[0], p[1])); fence(yd([[-7.5, -4.4], [-7.5, -9]]), { stone: true }); fence(yd([[-7.5, -11], [-7.5, -17], [8, -17], [8, -4.4]]), { stone: true });
    for (let i = 0; i < 13; i++) { const p = siteToWorld(C, -6.5 + (i % 5) * 3.1 + R.s() * 0.5, -7.6 - Math.floor(i / 5) * 3.3 + R.s() * 0.4); put(p[0], p[1], C.yaw + PI / 2 + R.s() * 0.2, m => Props.gravestone(m, R)); }
    World.places.push({ id: 'graves', name: 'The Quiet Yard', x: siteToWorld(C, 0, -11)[0], z: siteToWorld(C, 0, -11)[1], r: 7 }); }
  // mill surroundings
  { const M = SITE.mill; for (const [lx, lz, s] of [[-M.w / 2 - 1.2, -2.2, 0.34], [-M.w / 2 - 1.9, -1.6, 0.3], [-M.w / 2 - 1.3, -1.4, 0.28]]) { const p = siteToWorld(M, lx, lz); put(p[0], p[1], R() * 3, m => Props.sack(m, s, [0.9, 0.88, 0.8])); }
    const p = siteToWorld(M, -M.w / 2 - 2.2, 1.4); putc(p[0], p[1], 1.0, m => Props.cart(m, false)); const q = siteToWorld(M, -M.w / 2 - 1.5, -0.2); spot('mill.door', q[0], q[1], M.yaw - PI / 2); }

  // ── dynamic objects: door leaves, mill wheel, pickups ──
  const skin = new MeshPack();
  const leaf = new Mesh(512);
  // [fx1] the one hinged leaf every portal door uses (it read as a black slab in shade): five boards with dark joints, battens, iron straps with studs and a ring, in warm weathered oak
  leaf.ao = 0.92; leaf.mat(MAT.PLAIN, [0.09, 0.07, 0.06]); leaf.box(0, 0.02, -0.02, 1, 1, 0.02, 1 | 2 | 4 | 8);
  for (let i = 0; i < 5; i++) { const k = [0.92, 1.0, 0.86, 0.97, 0.9][i]; leaf.mat(MAT.PLANKS, [1.7 * k, 1.35 * k, 0.98 * k], 0.6); leaf.box(i * 0.2 + 0.005, 0.02, -0.03, (i + 1) * 0.2 - 0.005, 1, 0.03, 1 | 2 | 4 | 8); }
  leaf.mat(MAT.PLANKS, [1.2, 0.95, 0.7], 0.6); for (const y of [0.1, 0.9]) { leaf.box(0.0, y - 0.025, 0.03, 1, y + 0.025, 0.045, 1 | 2 | 8); leaf.box(0.0, y - 0.025, -0.045, 1, y + 0.025, -0.03, 1 | 2 | 8); }
  leaf.mat(MAT.METAL, [0.17, 0.155, 0.14]);   // [fx2] straps read bright blue indoors (sky reflection): dark blackened iron
   for (const y of [0.22, 0.78]) { for (const sz of [-1, 1]) leaf.box(0, y - 0.016, sz > 0 ? 0.045 : -0.05, 0.84, y + 0.016, sz > 0 ? 0.05 : -0.045, sz > 0 ? 16 : 32); for (const k of [0, 2]) for (const sz of [-1, 1]) leaf.box(0.12 + k * 0.2, y - 0.007, sz > 0 ? 0.05 : -0.057, 0.14 + k * 0.2, y + 0.007, sz > 0 ? 0.057 : -0.05, 1 | 2 | 4 | 8 | (sz > 0 ? 16 : 32)); }
  leaf.box(0.86, 0.46, -0.07, 0.9, 0.52, 0.07);
  const leafItem = skin.add(leaf);
  for (const d of World.doors) { d.obj = addSkinned(leafItem, { c: d.c, r: 1.6, zone: d.cell && d.side === 'in' ? d.zone : 0, kind: 'door', cell: d.cell && d.side === 'in' ? d.cell : null }); d.S = m4.scale(m4.create(), d.w, d.h, 1); }
  // mill wheel (+ the pit gear inside on the same axle). local: axle along +z, wheel in the xy plane
  { const M = SITE.mill, wm = new Mesh(2048), r = 2.2, wz0 = 0.25, wz1 = 1.35;
    wm.mat(MAT.TIMBER, [0.7, 0.66, 0.6]); wm.ao = 0.9;
    for (const z of [wz0, wz1]) { wm.push().T(0, 0, z).RX(PI / 2).T(0, -0.06, 0); wm.lathe([[r - 0.22, 0], [r, 0], [r, 0.12], [r - 0.22, 0.12], [r - 0.22, 0]], 20, 0); wm.pop(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; wm.beam([Math.cos(a) * 0.2, Math.sin(a) * 0.2, z], [Math.cos(a) * (r - 0.15), Math.sin(a) * (r - 0.15), z], 0.1, 0.1); } }
    wm.mat(MAT.PLANKS, [0.72, 0.68, 0.62], 0.6); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; wm.push().RZ(a).T(r - 0.25, 0, 0); wm.box(-0.22, -0.03, wz0, 0.3, 0.03, wz1); wm.pop(); }
    wm.mat(MAT.TIMBER, COL.woodDark); wm.push().RX(PI / 2).T(0, -2.0, 0); wm.cyl(0, 0, 0, 0.16, 0.16, 3.5, 10, 3); wm.pop();
    wm.m1 = 0; const pz = -1.8; wm.push().T(0, 0, pz).RX(PI / 2).T(0, -0.05, 0); wm.cyl(0, 0, 0, 0.5, 0.5, 0.1, 14, 3); wm.pop(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; wm.box(Math.cos(a) * 0.46 - 0.03, Math.sin(a) * 0.46 - 0.03, pz - 0.2, Math.cos(a) * 0.46 + 0.03, Math.sin(a) * 0.46 + 0.03, pz + 0.05); }
    const base = siteMatrix(M, M.y + 0.32); m4.translate(base, 0, 0.62, M.d / 2);
    World.millWheel = { obj: addSkinned(skin.add(wm), { c: m4.tp(base, [0, 0, 0.8]), r: 3.2, zone: 0, kind: 'mill' }), base, angle: 0 };
    World.millPos = m4.tp(base, [0, 0, 0.8]);
  }
  World.skinPack = skin; World.skinItems = { leaf: leafItem };

  // ── dressing: the stuff that piles up against the walls of a lived-in house ──
  {
    const Rd = rng(4242);
    const free = (x, z, rad) => {
      for (const rd of Roads) if (rd.line.dist(x, z, 4) < rd.w / 2 + 1.0) return false;
      if (hyp(x - SQUARE.x, z - SQUARE.z) < Math.max(SQUARE.rx, SQUARE.rz) + 1) return false;
      for (const c of World.colliders) {
        if (c.r !== undefined) { if (hyp(x - c.x, z - c.z) < c.r + rad) return false; continue; }
        const dx = (x - c.x) * c.ax + (z - c.z) * c.az, dz = (x - c.x) * c.bx + (z - c.z) * c.bz;
        if (Math.max(c.hx, c.hz) > 1.6) { if (c.y1 - c.y0 > 6 && Math.abs(dx) < c.hx + 0.1 && Math.abs(dz) < c.hz + 0.1) return false; continue; }   // walls: the pile is meant to lean on those, but never from inside a building body ([fx1])
        if (hyp(Math.max(Math.abs(dx) - c.hx, 0), Math.max(Math.abs(dz) - c.hz, 0)) < rad) return false;
      }
      return true;
    };
    const piles = {
      barrels: (m) => { Props.barrel(m); if (Rd() < 0.6) at(m, 0.74, 0, 0.1, 0, () => Props.barrel(m, 0.28, 0.72)); },
      crates: (m) => { Props.crate(m, 0.62); if (Rd() < 0.7) at(m, 0.05, crateTop(0.62), 0.03, 0.4, () => Props.crate(m, 0.44, true)); if (Rd() < 0.5) at(m, 0.72, 0, 0.05, 0.2, () => Props.crate(m, 0.5)); },
      wood: (m) => Props.woodpile(m, 6, 3 + (Rd() < 0.5 ? 1 : 0), 0.85),
      sacks: (m) => { Props.sack(m, 0.32); at(m, 0.55, 0, 0.12, 0, () => Props.sack(m, 0.27, COL.linen)); if (Rd() < 0.5) at(m, 0.25, 0, 0.5, 0, () => Props.sack(m, 0.25)); },
      pots: (m) => { Props.pot(m, 0.2); at(m, 0.5, 0, 0.1, 0, () => Props.pot(m, 0.15, COL.wool)); },
      hay: (m) => Props.haybale(m),
      // scanned yard dressing: a bucket and a basket by the door, a chopping stump (only offered when the scan pack is loaded)
      buckets: (m) => { kp(m, 'wooden_bucket_01', 0, 0, 0, 1, Rd() * 6); kp(m, 'wooden_bucket_01', 0.5, 0, 0.15, 0.8, Rd() * 6); if (Rd() < 0.6) kp(m, 'wicker_basket_02', -0.45, 0, 0.3, 1.1, Rd() * 6); },
      stump: (m) => { kp(m, 'tree_stump_01', 0, -0.03, 0, 0.55, Rd() * 6); addCircleCollider(m, 0, 0, 0.35, 0, 0.3); },
    };
    for (const s of SITES) {
      if (!HOUSES[s.id]) continue;
      const kinds = (s.id === 'farm' || s.id === 'barn' || s.id === 'mill') ? ['hay', 'wood', 'barrels', 'sacks', 'crates'] : s.id === 'chapel' ? ['pots'] : ['wood', 'barrels', 'crates', 'sacks', 'pots', 'wood'];
      if (typeof scanOn === 'function' && scanOn() && s.id !== 'chapel') kinds.push('buckets', 'stump');
      const dl = siteDoorLocal(s, 0), n = s.id === 'chapel' ? 1 : 3 + Rd.i(0, 1);
      for (let k = 0, tries = 0; k < n && tries < 30; tries++) {
        const side = Rd.i(0, 3), t = Rd.s() * 0.42, off = 0.62;
        // wall midpoints in house space, with the heading that looks out from the wall
        const [lx, lz, out] = side === 0 ? [t * s.w, -s.d / 2 - off, PI] : side === 1 ? [t * s.w, s.d / 2 + off, 0] : side === 2 ? [-s.w / 2 - off, t * s.d, -PI / 2] : [s.w / 2 + off, t * s.d, PI / 2];
        if (hyp(lx - dl[0], lz - dl[1]) < 3.0) continue;
        if ((s.bare || []).some(b => lx > b[0] - 0.6 && lx < b[2] + 0.6 && lz > b[1] - 0.6 && lz < b[3] + 0.6)) continue;
        const p = siteToWorld(s, lx, lz);
        if (!free(p[0], p[1], 1.0) || Math.abs(Terrain.y(p[0], p[1]) - s.y) > 0.45) continue;
        { const p2 = siteToWorld(s, lx + (side < 2 ? 0.9 : 0), lz + (side < 2 ? 0 : 0.9)), p3 = siteToWorld(s, lx - (side < 2 ? 0.9 : 0), lz - (side < 2 ? 0 : 0.9)); if (!free(p2[0], p2[1], 0.5) || !free(p3[0], p3[1], 0.5)) continue; }      // [fx3] a pile's second crate or barrel reaches 0.9 m sideways: not into the neighbour's body
        if (SITES.some(o => { if (o === s) return false; const q = (p[0] - o.x) * Math.cos(o.yaw) + (p[1] - o.z) * Math.sin(o.yaw), r = -(p[0] - o.x) * Math.sin(o.yaw) + (p[1] - o.z) * Math.cos(o.yaw); return Math.abs(q) < o.w / 2 + 0.5 && Math.abs(r) < o.d / 2 + 0.5; })) continue;   // [fx1] terraced shops stand 0.3 m apart: a pile in that gap was inside the neighbour
        const kind = Rd.pick(kinds);
        put(p[0], p[1], s.yaw + out + PI / 2, piles[kind]); k++;
      }
    }
  }

  // ── backyards: a fenced vegetable plot behind some cottages, a laundry line behind others ──
  {
    const Rv = rng(5151), okSpot = (x, z, rad, s) => {
      if (Math.abs(Terrain.y(x, z) - s.y) > 0.5) return false;
      for (const rd of Roads) if (rd.line.dist(x, z, 4) < rd.w / 2 + 1.2) return false;
      for (const o of INF.houses) { const l = worldToSite(o, x, z); if (Math.abs(l[0]) < o.w / 2 + rad * 0.6 && Math.abs(l[1]) < o.d / 2 + rad * 0.6) return false; }      // [fx3] the infill houses are not built yet: their footprints are planned, and a bed must not lie under one
      for (const c of World.colliders) { const r = c.r !== undefined ? c.r : Math.max(c.hx, c.hz); if (r > 1.6 && c.r === undefined) continue; if (hyp(x - c.x, z - c.z) < r + rad) return false; }
      return true;
    };
    const veg = [[0, 0.3, 0.12], [0.5, 0.6, 0.2], [0.2, 0.35, 0.3]];
    for (const id of ['elder', 'weaver', 'guardhouse', 'farm', 'hunter', 'mill', 'herbalist']) {
      const s = SITE[id]; if (!s) continue;
      const lx = (id === 'weaver' || id === 'hunter' ? -1 : 1) * s.w * 0.12, lz = s.d / 2 + 2.9, p = siteToWorld(s, lx, lz);
      if (id !== 'herbalist') {
        if (!okSpot(p[0], p[1], 2.4, s)) continue;
        put(p[0], p[1], s.yaw, m => {
          for (let r = 0; r < 3; r++) {
            m.mat(MAT.PLANKS, COL.woodDark, 0.5); m.box(-1.5, 0, r * 0.95 - 0.3, 1.5, 0.2, r * 0.95 - 0.25); m.box(-1.5, 0, r * 0.95 + 0.25, 1.5, 0.2, r * 0.95 + 0.3);
            m.mat(MAT.PLAIN, [0.2, 0.15, 0.1]); m.box(-1.5, 0.02, r * 0.95 - 0.25, 1.5, 0.18, r * 0.95 + 0.25);
            const [g1, g2, g3] = [[0.22, 0.34, 0.14], [0.3, 0.38, 0.17], [0.4, 0.28, 0.2]][r];
            m.mat(MAT.PLAIN, [g1, g2, g3]); for (let i = 0; i < 7; i++) m.ball(-1.2 + i * 0.4 + (r % 2) * 0.1, 0.24, r * 0.95, 0.15 + Rv() * 0.05, 0.12, 0.15, 5, 3);
          }
          addBoxCollider(m, -1.5, -0.35, 1.5, 2.2, 0, 0.3);
        });
        const q = [[-2.2, -0.9], [2.2, -0.9], [2.2, 2.6], [-2.2, 2.6]].map(o => { const c = Math.cos(s.yaw), sn = Math.sin(s.yaw); return [p[0] + o[0] * c + o[1] * sn, p[1] - o[0] * sn + o[1] * c]; });
        fence([q[0], q[1], q[2], q[3], q[0]], { h: 0.8 });
      }
    }
    // laundry lines: two posts, a rope and a few cloths, behind the elder's and guardhouse cottages
    for (const [id, sg] of [['elder', -1], ['guardhouse', 1], ['farm', -1]]) {
      const s = SITE[id]; if (!s) continue;
      const a = siteToWorld(s, sg * (s.w / 2 + 0.6), s.d / 2 + 1.6), b = siteToWorld(s, sg * (s.w / 2 + 4.6), s.d / 2 + 1.0);
      if (!okSpot(a[0], a[1], 0.5, s) || !okSpot(b[0], b[1], 0.5, s)) continue;
      for (const q of [a, b]) put(q[0], q[1], 0, m => { m.mat(MAT.TIMBER, COL.timber); m.cbox(0, -0.3, 0, 0.09, 2.2, 0.09, 4); });
      const ya = Terrain.y(a[0], a[1]) + 1.85, yb = Terrain.y(b[0], b[1]) + 1.85, m = bucket(a[0], a[1]); m.m1 = 0; m.ao = 1;
      m.mat(MAT.CLOTH, [0.7, 0.6, 0.4], 0.3); m.beam([a[0], ya, a[1]], [b[0], yb, b[1]], 0.02, 0.02);
      for (let i = 0; i < 4; i++) {
        const k0 = 0.12 + i * 0.22, k1 = k0 + 0.14, c = [COL.linen, COL.wool, COL.linen, COL.blue][i], hgt = 0.55 + (i % 2) * 0.3; m.mat(MAT.CLOTH, c.map(v => v * 0.8), 0.6);
        const p0 = [lerp(a[0], b[0], k0), lerp(ya, yb, k0), lerp(a[1], b[1], k0)], p1 = [lerp(a[0], b[0], k1), lerp(ya, yb, k1), lerp(a[1], b[1], k1)];
        m.quad2(p0, [p0[0], p0[1] - hgt, p0[2]], [p1[0], p1[1] - hgt, p1[2]], p1);
      }
    }
  }

  // a wagon or two parked beside the busier houses (kit style only)
  if (typeof kitReady === 'function' && kitReady()) for (const [id, lx, lz, yaw] of [['inn', -11.8, 1.5, 0.25], ['store', 0.5, 6.4, 1.45], ['smithy', 1.5, 7.2, 1.7], ['elder', 0, 6.0, 1.5]]) {
    const s = SITE[id], p = siteToWorld(s, lx, lz); let ok = Math.abs(Terrain.y(p[0], p[1]) - s.y) < 0.6;
    for (const rd of Roads) if (rd.line.dist(p[0], p[1], 5) < rd.w / 2 + 2.2) ok = false;
    for (const c of World.colliders) if (hyp(p[0] - c.x, p[1] - c.z) < (c.r !== undefined ? c.r : Math.max(c.hx, c.hz)) + 2.3) ok = false;
    if (ok) put(p[0], p[1], s.yaw + yaw, m => { kp(m, 'Prop_Wagon', 0, 0, 1.14, 1); addBoxCollider(m, -1.0, -2.0, 1.0, 2.0, 0, 1.3); });
  }

  if (typeof buildAlley === 'function') buildAlley();
  if (typeof buildInfill === 'function') buildInfill();
  if (typeof townFinish === 'function') townFinish(bucket);      // Build 42 (73f_levels.js)
  if (typeof buildDress === 'function') buildDress();      // [fx3] after the routes, walls, lanes and square, so loose piles are placed around what is solid and never through it

  // ground-contact shading for loose props, then pack everything
  for (const m of buckets.values()) {
    for (let i = 0; i < m.nv; i++) { if (m.u8[i * 32 + 29] !== 0 || m.u8[i * 32 + 27] < 250) continue; const y = m.f[i * 8 + 1] - Terrain.y(m.f[i * 8], m.f[i * 8 + 2]); if (y < 0.45) m.u8[i * 32 + 27] = Math.round(255 * lerp(0.62, 1, sat(y / 0.45))); }
    if (m.ni) pack.add(m, { kind: 'opaque', maxDist: m.maxDist || 0, noShadow: !!m.noShadow });      // maxDist: Build 42 (73h_routes.js fine cells)
  }
  for (const m of houseExt.values()) pack.add(m, { kind: 'opaque' });
  World.villagePack = pack;
  World.packs.push(pack);
}
// register a skinned / hinged object; returns the object (bone matrices live in R.boneData at slot*256)
function addSkinned(item, o) {
  const obj = Object.assign({ first: item.first, count: item.count, base: item.base, slot: World.skinned.length, visible: true, c: [0, 0, 0], r: 2, zone: 0, light: 1 }, o);
  World.skinned.push(obj); World.skinCount = World.skinned.length;
  if ((obj.slot + 1) * 256 > R.boneData.length) { const nb = new Float32Array(R.boneData.length * 2); nb.set(R.boneData); R.boneData = nb; R.maxSkin *= 2; }      // grow instead of overflowing (96 slots ran out once the wilds and the inn's regulars arrived: two places stopped building)
  const bd = R.boneData, k = obj.slot * 256; for (let b = 0; b < 16; b++) { bd.fill(0, k + b * 16, k + b * 16 + 16); bd[k + b * 16] = bd[k + b * 16 + 5] = bd[k + b * 16 + 10] = bd[k + b * 16 + 15] = 1; }
  bd[k + 240] = obj.zone; bd[k + 241] = obj.light;
  return obj;
}
