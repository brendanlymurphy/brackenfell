// ───────────────────────── interior dressing additions: contact shadows under furniture (more to come) ─────────────────────────
// Soft dark pads on the floor under every ground-standing kit piece of a room, merged into one transparent mesh per room (one draw call).
const FURN = { blobs: {} };
// the fine group of a room: small objects, drawn on medium and high only (see kitAttach)
World.kitFine = {};
function furnFineBatch(zone) {
  let k = World.kitFine[zone]; if (!k) { const zi = World.zones[zone - 1]; k = World.kitFine[zone] = { batch: Kit.batch({ name: 'kitfine-' + (zi ? zi.site.id : zone), cell: 4096 }), site: zi ? zi.site : null, cell: zi ? zi.cell : null }; }
  return k.batch;
}
function furnBlob(zone, P) {
  const pc = Kit.pieces[P.name], zi = World.zones[zone - 1]; if (!pc || !zi) return;
  const sx = pc.max[0] - pc.min[0], sy = pc.max[1] - pc.min[1], sz = pc.max[2] - pc.min[2]; if (sx * sz < 0.1 || sy < 0.12) return;
  const e = P.M.elements, fy = zi.y0 + 0.7;
  const cx = (pc.min[0] + pc.max[0]) / 2, cz = (pc.min[2] + pc.max[2]) / 2;
  const wx = e[0] * cx + e[4] * pc.min[1] + e[8] * cz + e[12], wy = e[1] * cx + e[5] * pc.min[1] + e[9] * cz + e[13], wz = e[2] * cx + e[6] * pc.min[1] + e[10] * cz + e[14];
  if (wy < fy - 0.3 || wy > fy + 0.45) return;
  const ax = Math.hypot(e[0], e[2]) || 1, az = Math.hypot(e[8], e[10]) || 1, mg = 0.16;
  const hx = sx / 2 * ax + mg, hz = sz / 2 * az + mg, ux = [e[0] / ax, e[2] / ax], uz = [e[8] / az, e[10] / az];
  (FURN.blobs[zone] = FURN.blobs[zone] || []).push([wx, fy + 0.034, wz, hx * ux[0], hx * ux[1], hz * uz[0], hz * uz[1]]);
}
function furnBlobs(zone, group) {
  const L = FURN.blobs[zone]; if (!L || !L.length) return;
  const pos = new Float32Array(L.length * 12), uvs = new Float32Array(L.length * 8), idx = new Uint16Array(L.length * 6);
  L.forEach((b, i) => {
    const c = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
    c.forEach((k, j) => { const o = i * 4 + j; pos[o * 3] = b[0] + k[0] * b[3] + k[1] * b[5]; pos[o * 3 + 1] = b[1]; pos[o * 3 + 2] = b[2] + k[0] * b[4] + k[1] * b[6]; uvs[o * 2] = k[2]; uvs[o * 2 + 1] = k[3]; });
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingBox(); g.computeBoundingSphere();
  if (!FURN.mat) {
    const { vec3, uv, abs, max, smoothstep, float } = TSL, m = FURN.mat = new THREE.MeshBasicNodeMaterial(), d = max(abs(uv().x.sub(0.5)), abs(uv().y.sub(0.5))).mul(2);
    m.colorNode = vec3(0.012, 0.008, 0.006); m.opacityNode = smoothstep(1.0, 0.4, d).mul(0.62); m.transparent = true; m.depthWrite = false; m.fog = false; m.side = THREE.DoubleSide;
    m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  }
  const mesh = new THREE.Mesh(g, FURN.mat); mesh.matrixAutoUpdate = false; mesh.name = 'floor-shadows'; mesh.castShadow = false; mesh.receiveShadow = false; group.add(mesh);
}

// ───────────────────────── structure and furnishing: wainscot, posts, sills, door casings, shelf runs, hangings, corner stacks, laid tables ─────────────────────────
// Called at the start of kitDress(), so everything placed here is known (through colliders) to the generic dressing that follows.
// Boxes are synthetic kit pieces on the scanned trim sheets (MI_WoodTrim, MI_Trim_Cloth), so they merge into the room's batch like any kit piece.
const FURN_ON = !(TEST && TEST.furn === 0);
const FT = { oak: [0.62, 0.5, 0.38], dark: [0.46, 0.36, 0.27], pale: [0.8, 0.68, 0.52] };
function furnPiece(w, h, d, mat, vertical) {
  mat = mat || 'MI_WoodTrim'; const key = 'x2b|' + mat + '|' + [w, h, d].map(v => Math.round(v * 100)).join('_') + (vertical ? 'v' : '');
  if (Kit.pieces[key]) return key;
  if (!Kit.defs[mat]) return null;
  const X = w / 2, Z = d / 2, P = [], N = [], T = [], I = [];
  // each face: 4 corners, normal, extents (a along the face's long axis, b across)
  const face = (c0, c1, c2, c3, n, a, b) => {
    const o = P.length / 3; for (const c of [c0, c1, c2, c3]) P.push(c[0], c[1], c[2]); for (let i = 0; i < 4; i++) N.push(n[0], n[1], n[2]);
    if (mat === 'MI_WoodTrim') { const u = a * 0.5, v0 = 0.05, v1 = 0.05 + Math.min(0.22, b * 0.5); T.push(0, v0, u, v0, u, v1, 0, v1); }
    else { T.push(0.64, 0.08, 0.96, 0.08, 0.96, 0.4, 0.64, 0.4); }
    I.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  const L = Math.max(w, h, d);
  face([-X, h, Z], [-X, 0, Z], [X, 0, Z], [X, h, Z], [0, 0, 1], w >= h ? w : h, w >= h ? h : w);
  face([X, h, -Z], [X, 0, -Z], [-X, 0, -Z], [-X, h, -Z], [0, 0, -1], w >= h ? w : h, w >= h ? h : w);
  face([X, h, Z], [X, 0, Z], [X, 0, -Z], [X, h, -Z], [1, 0, 0], h >= d ? h : d, h >= d ? d : h);
  face([-X, h, -Z], [-X, 0, -Z], [-X, 0, Z], [-X, h, Z], [-1, 0, 0], h >= d ? h : d, h >= d ? d : h);
  face([-X, h, -Z], [-X, h, Z], [X, h, Z], [X, h, -Z], [0, 1, 0], w >= d ? w : d, w >= d ? d : w);
  face([-X, 0, Z], [-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [0, -1, 0], w >= d ? w : d, w >= d ? d : w);
  Kit.pieces[key] = { name: key, prims: [{ mat, pos: new Float32Array(P), nrm: new Float32Array(N), uv: new Float32Array(T), col: null, idx: Uint32Array.from(I), n: P.length / 3 }], min: [-X, 0, -Z], max: [X, h, Z], pack: 'x2' };
  return key;
}
const FPOOL = {
  goods: [['SmallBottles_1', 1.3], ['SmallBottle', 1.6], ['Potion_2', 1], ['Book_Stack_1', 1], ['BookGroup_Small_1', 1], ['wooden_bowl_01', 0.7], ['food_pears_asian_01', 1.3], ['yellow_onion', 1.5], ['Pouch_Large', 1], ['Mug', 1], ['food_apple_01', 1.2]],
  bar: [['SmallBottle', 1.6], ['SmallBottles_1', 1.3], ['Mug', 1], ['Potion_2', 1], ['Chalice', 1], ['SmallBottle', 1.6], ['Mug', 1]],
  books: [['BookGroup_Medium_1', 1], ['BookGroup_Small_2', 1], ['Book_Stack_2', 1], ['BookGroup_Medium_2', 1], ['Scroll_1', 1], ['BookGroup_Small_3', 1], ['Book_Stack_1', 1], ['Candle_1', 1]],
  herbs: [['Potion_1', 1], ['Potion_2', 1], ['SmallBottles_1', 1.3], ['SmallBottle', 1.6], ['Potion_4', 1], ['ceramic_vase_02', 0.7], ['SmallBottles_1', 1.3]],
  tools: [['Bucket_Wooden_1', 0.7], ['Pouch_Large', 1], ['Mug', 1], ['Workbench_Drawers', 1], ['Coin_Pile', 1], ['SmallBottle', 1.6]],
  cloth: [['FOLD', 1], ['FOLD', 1], ['FOLD', 1], ['FOLD', 1], ['Pouch_Large', 1]],
  food: [['hamburger_buns_a', 1.7], ['food_pears_asian_01', 1.3], ['yellow_onion', 1.5], ['wooden_bowl_01', 0.7], ['food_apple_01', 1.2], ['Mug', 1]],
};
const FCOLS = [[0.45, 0.14, 0.12], [0.16, 0.26, 0.45], [0.2, 0.36, 0.2], [0.5, 0.4, 0.2], [0.36, 0.2, 0.4], [0.3, 0.24, 0.18], [0.55, 0.5, 0.42], [0.1, 0.12, 0.14]];
// per room: which structure to add and how much to put in it (counts are upper bounds; free wall and floor decide)
const FURN_ROOMS = {
  inn:       { wain: 1, plate: 1, sills: 1, casing: 1, posts: 0, shelves: 2, pool: 'bar', hang: 4, corners: 2, settings: 1, rugs: 2, candles: 5, cloaks: 2, banners: 2 },
  smithy:    { wain: 0, plate: 1, sills: 1, casing: 1, posts: 0, shelves: 1, pool: 'tools', hang: 6, corners: 3, settings: 0, rugs: 0, candles: 2, cloaks: 1, banners: 0 },
  store:     { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 4, pool: 'goods', hang: 4, corners: 3, settings: 0, rugs: 1, candles: 3, cloaks: 0, banners: 1 },
  elder:     { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 2, pool: 'books', hang: 3, corners: 2, settings: 1, rugs: 2, candles: 4, cloaks: 1, banners: 1 },
  herbalist: { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 3, pool: 'herbs', hang: 3, corners: 2, settings: 1, rugs: 1, candles: 3, cloaks: 0, banners: 0 },
  guardhouse:{ wain: 1, plate: 1, sills: 1, casing: 1, posts: 0, shelves: 1, pool: 'tools', hang: 5, corners: 3, settings: 1, rugs: 1, candles: 2, cloaks: 2, banners: 1 },
  weaver:    { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 3, pool: 'cloth', hang: 3, corners: 2, settings: 1, rugs: 2, candles: 3, cloaks: 1, banners: 2 },
  chapel:    { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 0, pool: 'books', hang: 0, corners: 0, settings: 0, rugs: 0, candles: 8, cloaks: 0, banners: 5 },
  mill:      { wain: 0, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 1, pool: 'tools', hang: 3, corners: 4, settings: 1, rugs: 1, candles: 2, cloaks: 1, banners: 0 },
  farm:      { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 2, pool: 'food', hang: 4, corners: 3, settings: 1, rugs: 2, candles: 2, cloaks: 1, banners: 0 },
  hunter:    { wain: 0, plate: 1, sills: 1, casing: 1, posts: 0, shelves: 1, pool: 'tools', hang: 5, corners: 3, settings: 1, rugs: 2, candles: 2, cloaks: 2, banners: 0 },
  fisher:    { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 1, pool: 'food', hang: 4, corners: 3, settings: 1, rugs: 1, candles: 2, cloaks: 1, banners: 0 },
  draper:    { wain: 1, plate: 1, sills: 1, casing: 1, posts: 1, shelves: 4, pool: 'cloth', hang: 3, corners: 2, settings: 0, rugs: 2, candles: 3, cloaks: 0, banners: 3 },
};
function furnishHouse(c) {
  const id = c.site.id, cfg = FURN_ROOMS[id]; if (!FURN_ON || !cfg || !Kit.defs.MI_WoodTrim) return;
  const { w, d, H, hd, zone, spec } = c, R = rng(c.site.x * 17 + c.site.z * 29 + 7), sy = H / 3, e = 0.21, m = { m: c.Ms, m1: zone, ao: INT_AO };
  const X0 = -w / 2 + e, X1 = w / 2 - e, Z0 = -hd + e, Z1 = hd - e, st = spec.kitStyle, col0 = c.kCol0;
  const sides = [
    { wn: 'back', len: X1 - X0, at: (u, o) => [X0 + u, Z1 - o], ry: PI, lo: X0 }, { wn: 'left', len: Z1 - Z0, at: (u, o) => [X0 + o, Z0 + u], ry: PI / 2, lo: Z0 },
    { wn: 'right', len: Z1 - Z0, at: (u, o) => [X1 - o, Z0 + u], ry: -PI / 2, lo: Z0 }, { wn: 'front', len: X1 - X0, at: (u, o) => [X0 + u, Z0 + o], ry: 0, lo: X0 }];
  const ops = sd => c.openings[sd.wn].map(o => ({ o, uc: (o.def.pos || 0) - sd.lo, hw: (o.door ? (o.def.w || 1.1) : (o.def.w || 1.2)) / 2, door: !!o.door }));
  const blocked = (x, z, r, wallOnly) => {
    const p = m4.tp(c.Ms, [x, 0, z]);
    for (let i = col0; i < World.colliders.length; i++) {
      const k = World.colliders[i]; if (k.y0 > p[1] + 2.2 || (wallOnly && k.y1 - k.y0 < 1.5)) continue;
      if (k.r !== undefined) { if (hyp(k.x - p[0], k.z - p[2]) < k.r + r) return true; continue; }
      const dx = p[0] - k.x, dz = p[2] - k.z; if (Math.abs(dx * k.ax + dz * k.az) < k.hx + r && Math.abs(dx * k.bx + dz * k.bz) < k.hz + r) return true;
    }
    if (wallOnly) return false;
    for (const dd of c.doors) if (hyp(dd.ins[0] - p[0], dd.ins[2] - p[2]) < 1.25 + r) return true;
    for (const k in World.spots) { const s = World.spots[k]; if (s.site === id && Math.abs(s.p[1] - p[1]) < 1.5 && hyp(s.p[0] - p[0], s.p[2] - p[2]) < 0.6 + r) return true; }
    for (const f of World.floors) if (f.y2 !== undefined && Math.abs(f.y - p[1]) < 4 && Math.abs((p[0] - f.x) * f.ax + (p[2] - f.z) * f.az) < f.hx + 0.7 + r && Math.abs((p[0] - f.x) * f.bx + (p[2] - f.z) * f.bz) < f.hz + 0.7 + r) return true;       // stair runs stay clear
    return false;
  };
  const put = (name, x, y, z, s, ry, extra) => { if (Kit.pieces[name]) kp(m, name, x, y, z, s, ry, Object.assign({ fine: true }, extra)); };       // small things go to the room's fine group (medium and high only)
  const putA = (name, x, y, z, s, ry, extra) => { if (Kit.pieces[name]) kp(m, name, x, y, z, s, ry, extra); };
  const timber = (x, y, z, bw, bh, bd, ry, tint, vertical) => { const n = furnPiece(bw, bh, bd, 'MI_WoodTrim', vertical); if (n) kp(m, n, x, y, z, 1, ry || 0, { tint: tint || FT.oak, noBlob: true }); };
  const cloth = (x, y, z, bw, bh, ry, tint) => { const n = furnPiece(bw, bh, 0.03, 'MI_Trim_Cloth'); if (n) kp(m, n, x, y, z, 1, ry || 0, { tint, noBlob: true }); };
  const guard = (sd, u, half, y0, y1) => { const p = sd.at(u, 0.06), fm = { m: m4.mul(m4.create(), c.Ms, m4.rotY(m4.translate(m4.create(), p[0], 0, p[1]), -sd.ry)) }; addBoxCollider(fm, -half, -0.05, half, 0.05, y0, y1); };
  const used = {};      // wall space taken by hangings: side -> [[u, half]]
  const free = (sd, u, half) => !(used[sd.wn] || []).some(t => Math.abs(t[0] - u) < t[1] + half + 0.08);
  const claim = (sd, u, half, y0, y1) => { (used[sd.wn] = used[sd.wn] || []).push([u, half]); guard(sd, u, half, y0 === undefined ? 2.15 : y0, y1 === undefined ? 2.3 : y1); };
  const nearOp = (sd, u, half, doorsOnly) => ops(sd).some(q => (!doorsOnly || q.door) && Math.abs(q.uc - u) < half + q.hw + (q.door ? 0.3 : 0.15));
  const hr = c.hearth, hearthOn = sd => hr && Math.abs(hr.rot) < 0.01 && sd.wn === 'left';
  const hearthSpan = (u, half) => hr && Math.abs(u + sides[1].lo - hr.z) < hr.wid / 2 + half + 0.25;
  const bigH = H;
  // ── wainscot: skirting, panel and a cap rail along every length of wall that has no door, hearth or chimney ──
  if (cfg.wain) for (const sd of sides) {
    const cuts = ops(sd).filter(q => q.door).map(q => [q.uc - q.hw - 0.1, q.uc + q.hw + 0.1]);
    if (hearthOn(sd)) cuts.push([hr.z - hr.wid / 2 - 0.3 - sides[1].lo, hr.z + hr.wid / 2 + 0.3 - sides[1].lo]);
    cuts.sort((a, b) => a[0] - b[0]);
    let a = 0; const runs = [];
    for (const k of cuts.concat([[sd.len, sd.len]])) { if (k[0] - a > 0.3) runs.push([a, Math.min(k[0], sd.len)]); a = Math.max(a, k[1]); }
    for (const [r0, r1] of runs) for (let u = r0; u < r1 - 0.01; u += 2.4) {
      const e1 = Math.min(r1, u + 2.4), mid = (u + e1) / 2, len = e1 - u, p = sd.at(mid, 0.02);
      timber(p[0], 0.0, p[1], len, 0.14, 0.07, sd.ry, FT.dark); timber(...[p[0], 0.14, p[1]], len, 0.74, 0.045, sd.ry, FT.oak); timber(p[0], 0.88, p[1], len, 0.07, 0.085, sd.ry, FT.dark);
    }
  }
  // ── top plate along every wall under the ceiling, posts down to the wainscot (half-timbered rooms) and corner posts ──
  if (cfg.plate) for (const sd of sides) {
    const gab = sd.wn === 'left' || sd.wn === 'right'; if (hearthOn(sd)) continue;
    const p = sd.at(sd.len / 2, 0.02); timber(p[0], H - 0.26, p[1], sd.len, 0.2, 0.1, sd.ry, FT.dark);
    if (cfg.posts) for (let u = 1.0; u < sd.len - 0.6; u += 2.0 + R() * 0.3) {
      if (nearOp(sd, u, 0.1, false) || free(sd, u, 0.1) === false) continue;
      const q = sd.at(u, 0.0); timber(q[0], 0.95, q[1], 0.13, H - 1.2, 0.09, sd.ry, FT.oak, true);
    }
  }
  if (cfg.plate) for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) { if (hr && Math.abs(x - X0) < 0.5 && Math.abs(z - hr.z) < hr.wid / 2 + 0.5) continue; timber(x + (x < 0 ? 0.04 : -0.04), 0, z + (z < 0 ? 0.04 : -0.04), 0.15, H - 0.06, 0.15, 0, FT.dark, true); }
  // ── window sills with a candle or a pot on them; door casings ──
  for (const sd of sides) for (const q of ops(sd)) {
    if (q.door) {
      if (!cfg.casing) continue;
      const dh = (q.o.def.h || 2.12 * sy), p = sd.at(q.uc, 0.03), jx = q.hw + 0.04;
      for (const s of [-1, 1]) { const pj = sd.at(q.uc + s * jx, 0.03); timber(pj[0], 0, pj[1], 0.1, dh + 0.1, 0.07, sd.ry, FT.dark, true); }
      timber(p[0], dh, p[1], q.hw * 2 + 0.28, 0.12, 0.09, sd.ry, FT.dark);
    } else if (cfg.sills) {
      const sill = (q.o.def.sill !== undefined ? q.o.def.sill : 0.95 * sy), p = sd.at(q.uc, 0.1);
      timber(p[0], sill - 0.04, p[1], q.hw * 2 + 0.25, 0.05, 0.2, sd.ry, FT.oak);
      const kind = R(), q2 = sd.at(q.uc + R.s() * q.hw * 0.5, 0.13);
      if (kind < 0.35 && R() < 0.8) put(R.pick(['ceramic_vase_02', 'ceramic_vase_04', 'ceramic_pot']), q2[0], sill + 0.01, q2[1], 0.6, R() * 6);
      else if (kind < 0.7) put(R.pick(['Book_Stack_1', 'BookGroup_Small_1', 'Potion_2']), q2[0], sill + 0.01, q2[1], 1, sd.ry);
    }
  }
  // ── laid tables: a plate, a mug and bread at each seat, a jug, an open book, cheese ──
  if (cfg.settings) for (let i = col0; i < World.colliders.length; i++) {
    const k = World.colliders[i]; if (k.r !== undefined || k.y1 - k.y0 < 0.65 || k.y1 - k.y0 > 0.95 || k.hx < 0.55 || k.hz < 0.32) continue;
    const L = worldToSite(c.site, k.x, k.z), th = Math.atan2(-(-k.ax * Math.sin(c.site.yaw) + k.az * Math.cos(c.site.yaw)), k.ax * Math.cos(c.site.yaw) + k.az * Math.sin(c.site.yaw)), cs = Math.cos(th), sn = Math.sin(th), top = k.y1 - k.y0 + 0.004;
    const loc = (dx, dz) => [L[0] + dx * cs + dz * sn, L[1] - dx * sn + dz * cs];
    const nseat = Math.max(1, Math.floor(k.hx * 2 / 0.9)), zz = k.hz - 0.2;
    for (let s = 0; s < nseat; s++) for (const sg of [-1, 1]) {
      if (R() < 0.35) continue;
      const dx = (s - (nseat - 1) / 2) * (k.hx * 2 - 0.5) / nseat + R.s() * 0.08, p = loc(dx, sg * zz);
      put('Table_Plate', p[0], top, p[1], 0.8, R() * 6); const f = R();
      if (f < 0.5) { const q = loc(dx, sg * zz); put('hamburger_buns_a', q[0], top + 0.03, q[1], 1.5, R() * 6); } else if (f < 0.8) { const q = loc(dx, sg * zz); put('food_pears_asian_01', q[0] + 0.02, top + 0.03, q[1], 1.2, R() * 6); }
      const q2 = loc(dx + 0.2, sg * (zz - 0.05)); put('Mug', q2[0], top, q2[1], 0.8, R() * 6);
    }
    if (k.hx > 0.8) { const j = loc(k.hx * 0.45, 0.17 * (R() < 0.5 ? 1 : -1)); put(R.pick(['Vase_4', 'ceramic_vase_04']), j[0], top, j[1], 0.55, R() * 6); if (id === 'elder' || id === 'inn') { const b = loc(-k.hx * 0.5, R.s() * 0.1); put('Book_7', b[0], top, b[1], 0.9, R() * 6, { tint: R.pick(FCOLS).map(v => v * 1.6 + 0.3) }); } }
  }
  // ── shelf runs with rows of objects; the pool says what each room keeps on them ──
  const pool = (FPOOL[cfg.pool] || FPOOL.goods).filter(q => q[0] === 'FOLD' || Kit.pieces[q[0]]);
  let shelves = cfg.shelves;
  for (let pass = 0; pass < 2 && shelves > 0; pass++) for (const sd of sides.slice().sort(() => R() - 0.5)) {
    if (shelves <= 0) break;
    for (let u = 0.9 + R() * 0.5; u < sd.len - 0.7 && shelves > 0; u += 0.3) {
      if (hearthOn(sd) || nearOp(sd, u, 0.62, false) || !free(sd, u, 0.62)) continue;
      const pf = sd.at(u, 0.3); if (blocked(pf[0], pf[1], 0.25, true)) continue;
      const nb = H > 3.4 ? 4 : 3, ys = []; for (let j = 0; j < nb; j++) ys.push(1.1 + j * 0.5);
      for (const y of ys) { const p = sd.at(u, 0.0); putA('Shelf_Simple', p[0], y, p[1], 1, sd.ry);
        const n = cfg.pool === 'cloth' ? 3 : 3 + (R() * 3 | 0); for (let t = 0; t < n; t++) { const it = R.pick(pool), q = sd.at(u - 0.5 + (t + 0.5) * 1.0 / n + R.s() * 0.03, 0.18); if (it[0] === 'FOLD') { const tc = R.pick(FCOLS).map(v => v * 1.5 + 0.1); for (let k = 0, kh = 2 + (R() * 2 | 0); k < kh; k++) { const pc = furnPiece(0.34, 0.07, 0.24, 'MI_Trim_Cloth'); if (pc) kp(m, pc, q[0], y + 0.11 + k * 0.07, q[1], 1, sd.ry + R.s() * 0.08, { tint: tc.map(v => v * (1 + R.s() * 0.15)), noBlob: true }); } } else put(it[0], q[0], y + 0.11, q[1], it[1], sd.ry + R.s() * 0.6); } }
      claim(sd, u, 0.62, 1.0, 2.2 + 0.2 * nb); shelves--; u += 1.3;
    }
  }
  // ── hangings: peg racks with pans, tools and cloaks; banners and weapons, antlers ──
  let hang = cfg.hang, cloaks = cfg.cloaks, banners = cfg.banners;
  const hangPool = { inn: ['pan', 'pan', 'mug', 'rope'], smithy: ['tong', 'pan', 'tong', 'rope'], store: ['pan', 'rope', 'bag'], guardhouse: ['sword', 'rope', 'pan'], hunter: ['pelt', 'rope', 'pan'], mill: ['rope', 'pan'], farm: ['pan', 'pan', 'rope'], fisher: ['rope', 'pan', 'net'] }[id] || ['pan', 'rope', 'pan'];
  for (let pass = 0; pass < 2 && (hang > 0 || cloaks > 0 || banners > 0); pass++) for (const sd of sides.slice().sort(() => R() - 0.5)) {
    for (let u = 0.8 + R() * 0.8; u < sd.len - 0.7; u += 0.3) {
      if (hearthOn(sd) || nearOp(sd, u, 0.62, false) || !free(sd, u, 0.62)) continue;
      const pf = sd.at(u, 0.3); if (blocked(pf[0], pf[1], 0.2, true)) continue;
      const p = sd.at(u, 0.0);
      if (banners > 0) { banners--; const tc = R.pick(FCOLS); putA(R() < 0.5 ? 'Banner_1_Cloth' : 'Banner_2_Cloth', p[0], Math.min(2.6 * sy, H - 0.2), sd.at(u, 0.05)[1], 1, sd.ry, { tint: tc.map(v => v * 1.8 + 0.1) }); const q = sd.at(u, 0.05); putA('Banner_1_Cloth', q[0], Math.min(2.6 * sy, H - 0.2), q[1], 1, sd.ry, { tint: tc.map(v => v * 1.8 + 0.1) }); claim(sd, u, 0.5); u += 1.2; continue; }
      if (hang > 0 || cloaks > 0) {
        putA('Peg_Rack', p[0], 1.75, p[1], 1, sd.ry);
        for (let t = 0; t < 3; t++) {
          const du = (t - 1) * 0.36, q = sd.at(u + du, 0.07), cl = cloaks > 0 && t === 1; let k = cl ? 'cloak' : R.pick(hangPool);
          if (cl) { cloaks--; cloth(q[0], 1.17, q[1], 0.42, 0.58, sd.ry, R.pick(FCOLS).map(v => v * 1.2)); timber(q[0], 1.73, q[1], 0.12, 0.06, 0.06, sd.ry, FT.dark); }
          else if (k === 'pan') { const M = new THREE.Matrix4().compose(new THREE.Vector3(q[0], 1.66, q[1]), new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, sd.ry, 0, 'YXZ')), new THREE.Vector3(0.6, 0.6, 0.6)); kadd(m, { name: 'Pot_1', M: new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().fromArray(c.Ms), M) }); }
          else if (k === 'rope') put('Rope_2', q[0], 1.7, q[1], 0.55, sd.ry);
          else if (k === 'mug') put('Mug', q[0], 1.62, q[1], 0.9, sd.ry);
          else if (k === 'sword') put('Sword_Bronze', q[0], 1.0, q[1], 0.9, sd.ry);
          else if (k === 'bag') put('Pouch_Large', q[0], 1.6, q[1], 1.3, sd.ry);
          else if (k === 'pelt') cloth(q[0], 1.1, q[1], 0.5, 0.7, sd.ry, [0.7, 0.55, 0.4]);
          else if (k === 'net') cloth(q[0], 1.2, q[1], 0.5, 0.9, sd.ry, [0.5, 0.5, 0.4]);
          else if (k === 'tong') put('cross_pein_hammer', q[0], 1.45, q[1], 1.6, sd.ry);
        }
        hang--; claim(sd, u, 0.62, 1.0, 2.0); u += 1.4;
      }
    }
  }
  // ── corner stacks: crates, barrels and sacks tucked into the corners, never into a walking line ──
  const stacks = {
    inn: [['Barrel', 0, 0.9], ['Barrel', 1, 0.9], ['Crate_Wooden', 2, 0.8]], mill: [['Bag', 0, 0.9], ['Bag', 1, 0.9], ['Barrel', 2, 0.9]],
  };
  let nc = cfg.corners;
  const cornerList = [[X0, Z0, 1, 1], [X1, Z0, -1, 1], [X0, Z1, 1, -1], [X1, Z1, -1, -1]].sort(() => R() - 0.5);
  for (const [cx, cz, sx, sz] of cornerList) {
    if (nc <= 0) break;
    const x = cx + sx * 0.45, z = cz + sz * 0.45; if (blocked(x, z, 0.55) || nearOp(sides[0], 0, 0, false) && false) continue;
    // keep corners next to doors and windows free
    const near = sides.some(sd => ops(sd).some(q => { const p = sd.at(q.uc, 0); return hyp(p[0] - x, p[1] - z) < q.hw + 0.8 && q.door; }));
    if (near) continue;
    const fm = { m: m4.translate(m4.create(), 0, 0, 0) }; fm.m = m4.mul(m4.create(), c.Ms, m4.translate(m4.create(), x, 0, z));
    const kind = R(), ry = R() * 6;
    if (kind < 0.3) { put('Crate_Wooden', x, 0.07, z, 0.8, ry); put('Crate_Wooden', x + R.s() * 0.05, 0.84, z, 0.7, ry + 0.4); addBoxCollider(fm, -0.38, -0.38, 0.38, 0.38, 0, 1.4); }
    else if (kind < 0.55) { put('Barrel', x, 0.0, z, 0.9, ry); put('Barrel', x + sx * 0.62, 0.0, z + sz * 0.12, 0.85, ry + 1); addBoxCollider(fm, -0.4, -0.4, 0.4 + 0.65, 0.4, 0, 0.9); }
    else if (kind < 0.8) { put('Bag', x, 0, z, 0.9, ry); put('Bag', x + sx * 0.4, 0, z + sz * 0.1, 0.85, ry + 1); put('Bag', x + sx * 0.1, 0.5, z + sz * 0.15, 0.7, ry + 2); addBoxCollider(fm, -0.35, -0.35, 0.8, 0.35, 0, 0.9); }
    else { put('wooden_bucket_01', x, 0, z, 1.1, ry); put('wicker_basket_02', x + sx * 0.5, 0, z + sz * 0.05, 1.3, ry); put('dry_branches_medium_01_a', x + sx * 0.1, 0, z + sz * 0.3, 0.7, ry); addBoxCollider(fm, -0.3, -0.3, 0.8, 0.4, 0, 0.6); }
    nc--;
  }

  // ── cloth on the shelves (draper, weaver): stacks of folded bolts instead of crockery ──
  // (handled in the shelf loop through FPOOL.cloth = 'FOLD')
  // ── a chest at the foot of every bed ──
  for (const nm of ['bed', 'bed2', 'guestbed']) {
    const sp = World.spots[id + '.' + nm]; if (!sp || sp.p[1] - m4.tp(c.Ms, [0, 0, 0])[1] > 1.5) continue;
    const L = worldToSite(c.site, sp.p[0], sp.p[2]), rot = -(sp.yaw - c.site.yaw), ax = [Math.sin(rot), Math.cos(rot)];
    for (const sg of [1, -1]) {
      const x = L[0] + ax[0] * sg * 1.5, z = L[1] + ax[1] * sg * 1.5;
      if (x < X0 + 0.5 || x > X1 - 0.5 || z < Z0 + 0.4 || z > Z1 - 0.4 || blocked(x, z, 0.42)) continue;
      const fm = { m: m4.mul(m4.create(), c.Ms, m4.rotY(m4.translate(m4.create(), x, 0, z), -rot)) };
      putA('treasure_chest', x, 0.02, z, 0.85, rot + PI / 2); addBoxCollider(fm, -0.35, -0.22, 0.35, 0.22, 0, 0.5); break;
    }
  }
  // ── layered rugs on free floor, away from the walking line between door and hearth ──
  const palette = [DYE.red, DYE.blue, DYE.green, [0.5, 0.36, 0.2], [0.32, 0.26, 0.2], DYE.purple];
  for (let i = 0, n = cfg.rugs; i < 40 && n > 0; i++) {
    const rw = 1.0 + R() * 0.7, rl = 1.5 + R() * 0.9, x = X0 + 1.0 + R() * (X1 - X0 - 2.0), z = Z0 + 1.0 + R() * (Z1 - Z0 - 2.0);
    if (blocked(x, z, 0.3) || blocked(x + rw * 0.4, z, 0.2) || blocked(x - rw * 0.4, z, 0.2) || blocked(x, z + rl * 0.4, 0.2) || blocked(x, z - rl * 0.4, 0.2)) continue;
    if (hyp(x - (hr ? hr.x + 1.6 : 99), z - (hr ? hr.z : 99)) < 1.5) continue;
    at(c.int, x, 0.03, z, R() * 3, () => Props.rug(c.int, rw, rl, R.pick(palette))); n--;
  }
  // ── drying bundles near the hearth, on the beams ──
  if (['inn', 'store', 'farm', 'fisher', 'elder', 'mill', 'hunter', 'smithy'].includes(id) && hr) {
    const hx = hr.x + 1.4; for (let k = 0; k < 4 + (R() * 3 | 0); k++) { const z = hr.z + (k - 2) * 0.55 + R.s() * 0.1; if (Math.abs(z) < Z1 - 0.4) at(c.int, hx + R.s() * 0.25, H - 0.26, z, 0, () => herbs(c.int, R)); }
  }
  // ── candles that burn: on sills and the mantel, no point light (the cap in kitLit keeps hearths among the lights the renderer picks) ──
  let nCandle = cfg.candles;
  for (const sd of sides) for (const q of ops(sd)) {
    if (q.door || nCandle <= 0 || R() < 0.45) continue;
    const sill = (q.o.def.sill !== undefined ? q.o.def.sill : 0.95 * sy), p = sd.at(q.uc + (R() < 0.5 ? -1 : 1) * q.hw * 0.55, 0.14);
    if (Kit.pieces.wooden_candlestick) { kitLit(m, 'wooden_candlestick', p[0], sill + 0.01, p[1], 1, R() * 6, { cap: 0, kind: 'candle', flame: 'candle' }); nCandle--; }
  }
  if (hr && nCandle > 0 && Kit.pieces.wooden_candlestick) { kitLit(m, 'wooden_candlestick', hr.x + 0.3, 1.52, hr.z + hr.wid * 0.3, 1.1, 0, { cap: 0, kind: 'candle', flame: 'candle' }); nCandle--; }
  // ── room specials ──
  const wallSpot = (len, dep) => { for (let t = 0; t < 80; t++) { const sd = R.pick(sides), u = len / 2 + 0.5 + R() * Math.max(0.01, sd.len - len - 1.0); if (hearthOn(sd) || nearOp(sd, u, len / 2, true) || nearOp(sd, u, len / 2 - 0.3, false)) continue; const p = sd.at(u, dep / 2 + 0.03), a = sd.at(u - len / 2, dep / 2 + 0.03), b = sd.at(u + len / 2, dep / 2 + 0.03); if (blocked(p[0], p[1], dep / 2 + 0.12) || blocked(a[0], a[1], 0.25) || blocked(b[0], b[1], 0.25)) continue; return { sd, u, p }; } return null; };
  const colliderAt = (p, sd, len, dep, h) => { const fm = { m: m4.mul(m4.create(), c.Ms, m4.rotY(m4.translate(m4.create(), p[0], 0, p[1]), -sd.ry)) }; addBoxCollider(fm, -len / 2, -dep / 2, len / 2, dep / 2, 0, h); };
  if (id === 'smithy') {          // a quench trough of boards on legs, full of dark water
    const ws = wallSpot(1.3, 0.55);
    if (ws) {
      const { sd, p } = ws, L = 1.2, D = 0.5, at2 = (du, dd) => sd.at(ws.u + du, 0.03 + D / 2 + dd);
      timber(p[0], 0.3, p[1], L, 0.07, D, sd.ry, FT.dark);
      for (const s of [-1, 1]) { const q = at2(s * (L / 2 - 0.03), 0); timber(q[0], 0.37, q[1], 0.06, 0.3, D, sd.ry, FT.oak); const r2 = at2(0, s * (D / 2 - 0.03)); timber(r2[0], 0.37, r2[1], L, 0.3, 0.06, sd.ry, FT.oak); }
      for (const s of [-1, 1]) for (const t of [-1, 1]) { const q = at2(s * (L / 2 - 0.08), t * (D / 2 - 0.08)); timber(q[0], 0, q[1], 0.09, 0.32, 0.09, sd.ry, FT.dark, true); }
      const wn = furnPiece(L - 0.1, 0.01, D - 0.1, 'MI_Trim_Metal'); if (wn) kp(m, wn, p[0], 0.56, p[1], 1, sd.ry, { tint: [0.05, 0.09, 0.11], noBlob: true });
      colliderAt(p, sd, L, D, 0.7);
    }
  }
  if (id === 'inn') {          // the bar's back wall: three bays of shelves with bottles and mugs, racks of hanging mugs and pans above
    const Zb = Z1 - 0.01;
    for (const x of [3.9, 5.1, 6.3]) {
      for (const y of [1.55, 2.0, 2.45]) { putA('Shelf_Simple', x, y, Zb - 0.3, 1, PI); const n = 5; for (let t = 0; t < n; t++) { const it = R.pick(FPOOL.bar.filter(q => Kit.pieces[q[0]])); put(it[0], x - 0.5 + (t + 0.5) / n, y + 0.11, Zb - 0.17, it[1], PI + R.s() * 0.5); } }
      putA('Peg_Rack', x, 2.85, Zb - 0.02, 1, PI); for (let t = 0; t < 3; t++) put(R() < 0.7 ? 'Mug' : 'Pot_1', x + (t - 1) * 0.36, R() < 0.7 ? 2.72 : 2.7, Zb - 0.08, 0.9, PI);
    }
    put('Barrel', 0.9, 0.02, Zb - 0.4, 0.9, R() * 6); put('Crate_Wooden', 1.5, 0.07, Zb - 0.55, 0.8, 0.2);
  }
  // ── window positions for the dust that hangs in daylight ──
  const zi = World.zones[zone - 1]; zi.windows = [];
  for (const sd of sides) for (const q of ops(sd)) if (!q.door) { const p = sd.at(q.uc, 0.2), wpos = m4.tp(c.Ms, [p[0], (q.o.def.sill !== undefined ? q.o.def.sill : 0.95 * sy) + 0.5, p[1]]), nd = m4.td(c.Ms, [Math.sin(sd.ry), 0, Math.cos(sd.ry)]); zi.windows.push([wpos[0], wpos[1], wpos[2], nd[0], nd[2], q.hw]); }
}

// ── air indoors: dust turning in the window light by day, a faint warm haze under the beams at night ──
(function () {
  const _fx = fxUpdate;
  fxUpdate = function (dt, time, env, cam) {
    _fx.apply(this, arguments);
    const zn = World.camZone | 0; if (!zn || !FURN_ON) return; const zi = World.zones[zn - 1]; if (!zi || !zi.windows) return;
    const d = R.partData; let n = R.partCount; const max = R.partMax;
    const put = (x, y, z, size, r, g, b, a, kind) => { if (n >= max) return; const o = n++ * 12; d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = size; d[o + 4] = r; d[o + 5] = g; d[o + 6] = b; d[o + 7] = a; d[o + 8] = 0; d[o + 9] = kind; d[o + 10] = 1; d[o + 11] = 0.3; };
    if (env.day > 0.25) zi.windows.slice(0, 4).forEach((w, wi) => {
      for (let k = 0; k < 7; k++) {
        const ph = wi * 5.7 + k * 1.93, t = time * (0.05 + (k % 3) * 0.02) + ph, f = (t % 1 + 1) % 1, dist = 0.3 + f * 2.2;
        const x = w[0] + w[3] * dist + Math.sin(time * 0.3 + ph * 3) * 0.25 + (k - 3) * w[5] * 0.28 * (-w[4]), z = w[2] + w[4] * dist + Math.cos(time * 0.27 + ph) * 0.25 + (k - 3) * w[5] * 0.28 * w[3], y = w[1] - 0.3 + Math.sin(ph * 2.1) * 0.5 - f * 0.5 + Math.sin(time * 0.4 + ph) * 0.12;
        put(x, y, z, 0.022, 1.0, 0.92, 0.72, 0.85 * env.day * Math.sin(f * PI) * (0.55 + 0.45 * Math.sin(time * 1.3 + ph * 2)), 3);
      }
    });
    if (zi.site.id === 'inn' && env.windowGlow > 0.3) for (let k = 0; k < 9; k++) {
      const ph = k * 2.39, L = [-5 + (k % 4) * 3.1, 3.0 + (k % 3) * 0.2, -3 + Math.floor(k / 3) * 3], p = siteToWorld(zi.site, L[0], L[2]);
      put(p[0] + Math.sin(time * 0.1 + ph) * 0.5, m4.tp(siteMatrix(zi.site, zi.y0 + 0.7), [0, L[1], 0])[1], p[1], 2.6, 1.0, 0.62, 0.3, 0.032 * env.windowGlow, 0);
    }
    R.partCount = n;
  };
})();
