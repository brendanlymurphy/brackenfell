// ───────────────────────── the wilds: where the places outside the village are, the paths that lead to them, and what the land does there ─────────────────────────
// Data and small pure functions only (loaded before the terrain). Builders are in 79_wilds.js, people and animals in 79b_life.js, quests in 81_wilds_story.js.
// Twelve places stand between 78 m and 172 m from the square. Every one has a worn footpath to the next (they are added to ROADS, so the splat map, the
// tree placement, the nav graph and the ground shader treat them like the village roads), a clearing in the forest, and a small patch of terrain of its own.
const WILDS = { places: [], P: {}, pads: [], bumps: [], cliffs: [], groves: [], dense: [], flowers: [], paths: [], bridges: [], on: !(typeof TEST !== 'undefined' && TEST && TEST.wilds === 0) };
(function wildsLayout() {
  const place = (id, name, x, z, yaw, r, o) => { const p = Object.assign({ id, name, x, z, yaw, r, disc: r + 4 }, o || {}); WILDS.places.push(p); WILDS.P[id] = p; return p; };
  // ── the places (x east, z south; yaw: heading of the place's front, 0 = north, clockwise) ──
  place('shrine', 'Wayside Shrine', -112, -7, 0, 9, { disc: 12 });
  place('lumber', 'Hob’s Lumber Camp', -140, -60, 0, 15);
  place('blind', 'The Hunter’s Blind', -120, 62, 0, 9, { disc: 14 });
  place('burnt', 'The Burnt Cottage', -108, -108, 0, 10);
  place('mine', 'The Old Mine', -70, -150, 2.47, 12, { disc: 16 });          // yaw: the portal looks south-east (local +z runs into the hill)
  place('hermit', 'The Hermit’s Pool', 30, -168, 0, 14, { disc: 18 });
  place('stones', 'The Standing Stones', 112, -118, 0, 14, { disc: 20 });
  place('battle', 'The Old Battlefield', 150, -52, 0, 20, { disc: 24 });
  place('bee', 'The Bee Meadow', 34, -70, 0, 12, { disc: 16 });
  place('hamlet', 'Highfold', 116, 104, 0, 26, { disc: 32 });
  place('fishing', 'The Far Shore', 30, 160, 0, 12, { disc: 16 });
  place('toll', 'The Toll Ford', -160, 1, 0, 10, { disc: 14 });

  // ── paths (id, width, points). Each begins on an existing road or at the end of another path. ──
  const path = (id, w, pts) => { ROADS.push({ id: 'p.' + id, w, pts, path: true }); WILDS.paths.push(id); };
  path('lumber', 1.3, [[-110, -8], [-115, -22], [-125, -40], [-136, -54]]);
  path('burnt', 1.2, [[-139, -66], [-134, -80], [-122, -96], [-114, -102], [-100, -101]]);
  path('mine', 1.2, [[-100, -101], [-96, -116], [-88, -130], [-80, -141], [-74, -146]]);
  path('tower', 1.3, [[-66, -142], [-50, -138], [-32, -133], [-10, -127], [12, -120], [19, -116]]);
  path('hermit', 1.2, [[-32, -133], [-24, -147], [-8, -159], [8, -166], [22, -168], [30, -163], [37, -158]]);
  path('bridge', 1.2, [[37, -158], [39, -154], [41, -150], [56, -150], [68, -143], [86, -132], [102, -123], [110, -115]]);
  path('stones', 1.3, [[110, -115], [112, -111], [122, -97], [134, -81], [145, -66], [150, -58]]);
  path('battle', 1.4, [[150, -46], [146, -34], [138, -24], [128, -15], [124, -13]]);
  path('hamlet', 1.4, [[78, 0], [74.5, 14], [76, 30], [78, 52], [87, 68], [100, 84], [110, 96], [116, 102]]);
  path('fishing', 1.3, [[118, 114], [100, 130], [78, 144], [54, 153], [36, 158]]);
  path('lakeside', 1.2, [[24, 160], [4, 166], [-22, 156], [-40, 134], [-40, 110], [-27, 93], [-8, 83]]);
  path('bee', 1.2, [[11, -77.5], [20, -74], [29, -71.5]]);
  path('blind', 1.2, [[-67, 28], [-82, 34], [-98, 46], [-113, 59]]);
  // every path ends exactly on the road (or path) it springs from, so that the nav graph (nodes 3 m apart join) and the splat painting have no gaps
  { const segNear = (x, z, skip) => { let best = null, bd = 1e9; for (const r of ROADS) { if (r === skip) continue; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], bx = b[0] - a[0], bz = b[1] - a[1], l2 = bx * bx + bz * bz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * bx + (z - a[1]) * bz) / l2)), px = a[0] + bx * t, pz = a[1] + bz * t, d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = [px, pz]; } } } return [best, bd]; };
    for (const r of ROADS) { if (!r.path) continue;
      for (const end of [0, 1]) { const q = end ? r.pts[r.pts.length - 1] : r.pts[0], [b, d] = segNear(q[0], q[1], r); if (b && d > 0.3 && d < 24 && !(r.id === 'p.hermit' && end) && !(r.id === 'p.stones' && end) && !(r.id === 'p.battle' && end) && !(r.id === 'p.lumber' && end) && !(r.id === 'p.bee' && end)) { if (end) r.pts.push([b[0], b[1]]); else r.pts.unshift([b[0], b[1]]); } } } }
  // navBuild joins roads where their nodes meet, but never the last node of one road to the first of the next in the list: keep paths that spring from each other apart in ROADS
  { const ord = ['lumber', 'hamlet', 'burnt', 'fishing', 'mine', 'bee', 'tower', 'blind', 'hermit', 'stones', 'bridge', 'battle', 'lakeside'], i0 = ROADS.findIndex(r => r.path), ps = ROADS.splice(i0).sort((a, b) => ord.indexOf(a.id.slice(2)) - ord.indexOf(b.id.slice(2))); ROADS.push(...ps); }
  // (the Toll Ford stands on the main road itself; the shrine at the turn of the lumber path)

  // ── Highfold: four timber houses and a barn on a hillside green. high.a and high.c are marked `enter` so the cell system can give them interiors later;
  //    until then they are shells (79_wilds.js builds them with the infill machinery of 73d_infill.js, in a batch of their own that is hidden beyond 120 m) ──
  WILDS.houses = [];
  const house = (id, name, x, z, yaw, w, d, o) => {
    const n = Math.max(1, Math.round(w / 2)), doorBay = (o && o.doorBay) || 0, h = Object.assign({ id, name, x, z, yaw, w, d, floors: 1, pitch: 44, wild: true, doorBay, boxes: true, par: 0 }, o || {});
    const st = { id, name, x, z, yaw, w, d, doorPos: w / 2 - (doorBay + 0.5) * (w / n), pad: 1.6, wild: true, enter: !!h.enter }; SITES.push(st); SITE[id] = st; WILDS.houses.push(h); return h;
  };
  house('high.a', 'Highfold: the Reeve’s House', 104, 100, PI / 2, 6.4, 5.2, { floors: 2, pitch: 42, enter: true, chimney: 1, jetty: true });
  house('high.b', 'Highfold: Thatcher’s House', 118, 90, PI, 7, 5.4, { floors: 1, pitch: 46, chimney: -1, stone: true });
  house('high.c', 'Highfold: the Shepherd’s House', 124, 113, -PI / 2, 6, 5, { floors: 2, pitch: 40, enter: true, chimney: 1 });
  house('high.barn', 'Highfold: Barn', 99, 114, 0, 9, 10.5, { floors: 1, pitch: 36, barn: true, stone: false, boxes: false });
  // ── fields at Highfold (the village fences every FIELDS entry) ──
  FIELDS.push({ x0: 126, z0: 80, x1: 144, z1: 96 }, { x0: 134, z0: 98, x1: 152, z1: 114 });

  // ── terrain of their own: hills, cliffs, flattened yards ──
  WILDS.bumps.push({ x: 112, z: -118, h: 8.5, s: 15, flat: 6.5, flat2: 12 });                      // the hill under the stones
  WILDS.bumps.push({ x: 150, z: -34, h: 1.6, s: 5.5 }, { x: 160, z: -62, h: 1.4, s: 6 }, { x: 142, z: -70, h: 1.2, s: 5 });      // barrows
  // cliffs: (dx, dz) points into the hill; g height, ramp: starts rising `at` metres in and takes `ramp` to rise, w0 / w1 half width fade, d0 / d1 depth fade
  WILDS.cliffs.push({ id: 'mine', x: -70, z: -150, dx: -0.62, dz: -0.78, g: 13, at: 3, ramp: 5.5, w0: 13, w1: 25, d0: 22, d1: 38, pad: 8 });
  WILDS.cliffs.push({ id: 'fall', x: 20, z: -179, dx: 0, dz: -1, g: 8.5, at: 2.5, ramp: 5, w0: 9, w1: 19, d0: 8, d1: 20, pad: 4 });
  // flattened yards: [x, z, radius, blend]
  WILDS.pads.push([-140, -60, 8, 7], [-108, -108, 9, 6], [-120, 62, 5, 5], [34, -70, 6, 6], [30, 160, 6, 6], [38, -166, 5, 5], [-160, -3, 6, 6], [-112, -7, 4, 4]);
  // the pool under the fall, and the toll-ford brook (water bodies; the meshes are built in 79_wilds.js)
  WILDS.pool = { x: 20, z: -172.5, r: 4.6, dig: 1.35 };
  WILDS.brook = { pts: [[-171, -60], [-164, -32], [-160, -8], [-159.4, 1.6], [-161, 14], [-166, 38], [-175, 66]], w: 1.9, bank: 3.6 };

  // ── forest: clearings round each place, denser stands, birch groves ──
  WILDS.groves.push({ x: -150, z: 98, r: 10, n: 18 }, { x: 52, z: -88, r: 10, n: 16 }, { x: 70, z: 128, r: 10, n: 14 }, { x: 126, z: 128, r: 9, n: 14 }, { x: 160, z: -86, r: 10, n: 16 });
  WILDS.dense.push({ x: -118, z: 60, r: 42, k: 1.25 }, { x: -50, z: 120, r: 30, k: 1.0 });
  // (flower meadow, orchard rows and fields are drawn by 79_wilds.js)
})();

// how much forest may stand at (x, z): 0 inside a place's clearing, rising to the normal density 9 m outside it, more in the dense stands
function wildsDens(x, z) {
  if (!WILDS.on) return 1;
  let k = 1;
  for (const p of WILDS.places) { const d = hyp(x - p.x, z - p.z); if (d < p.r + p.disc * 0.0 + 12) k = Math.min(k, smooth(p.r, p.r + 10, d)); }
  for (const g of WILDS.dense) { const d = hyp(x - g.x, z - g.z); if (d < g.r) k *= 1 + (g.k - 1) * smooth(g.r, g.r * 0.4, d); }
  return k;
}
// true while (x, z) is within `pad` of something the wilds placed that nothing may grow on (a place's yard)
const wildsBlocked = (x, z, pad) => { if (!WILDS.on) return false; for (const p of WILDS.places) if (hyp(x - p.x, z - p.z) < p.r + (pad || 0)) return true; return false; };

// ground height: called from terrainH after the village pads and before the river. h = the height so far
const _wc = {};
function wildsBase(key, x, z) { return _wc[key] !== undefined ? _wc[key] : (_wc[key] = terrainBase(x, z)); }
function wildsH(x, z, h) {
  if (!WILDS.on) return h;
  if (Math.abs(x) < 60 && Math.abs(z) < 60) return h;
  for (const p of WILDS.pads) {
    const d = hyp(x - p[0], z - p[1]); if (d > p[2] + p[3]) continue;
    h = lerp(h, wildsBase('pad' + p[0] + ',' + p[1], p[0], p[1]), 1 - smooth(p[2], p[2] + p[3], d));
  }
  for (const b of WILDS.bumps) {
    const dx = x - b.x, dz = z - b.z, d2 = dx * dx + dz * dz; if (d2 > 9 * b.s * b.s) continue;
    h += b.h * Math.exp(-d2 / (2 * b.s * b.s));
    if (b.flat) h = lerp(h, wildsBase('hill' + b.x, b.x, b.z) + b.h * 0.96, 1 - smooth(b.flat, b.flat2, Math.sqrt(d2)));
  }
  for (const c of WILDS.cliffs) {
    const dx = x - c.x, dz = z - c.z; if (Math.abs(dx) > 50 || Math.abs(dz) > 50) continue;
    const lz = dx * c.dx + dz * c.dz, lx = dx * -c.dz + dz * c.dx, y0 = wildsBase('cl' + c.id, c.x, c.z);
    if (lz > -12 && lz < 1 + c.at && Math.abs(lx) < c.pad + 8) h = lerp(h, y0, (1 - smooth(0, 8, Math.max(Math.abs(lx) - c.pad, 0) + Math.max(-lz - 2, 0))) * (1 - smooth(c.at - 1, c.at + 1.5, lz)));
    const g = c.g * smooth(c.at, c.at + c.ramp, lz) * (1 - smooth(c.w0, c.w1, Math.abs(lx))) * (1 - smooth(c.d0, c.d1, lz));
    if (g > 0) h = Math.max(h, y0 + g * (0.94 + 0.12 * Math.sin(lx * 0.43 + lz * 0.31)));
  }
  if (WILDS.pool) {
    const q = WILDS.pool, d = hyp(x - q.x, z - q.z);
    if (d < q.r + 5) h = Math.min(h, lerp(wildsBase('pool', q.x, q.z) - q.dig - 0.5 * (1 - (d / q.r) * (d / q.r)), h, smooth(q.r - 0.5, q.r + 4.5, d)));
  }
  if (WILDS.brook && x < -140 && x > -195) {
    const b = WILDS.brookLine || (WILDS.brookLine = new Poly(catmull(WILDS.brook.pts, 2))), d = b.dist(x, z, WILDS.brook.bank + 6);
    if (d < WILDS.brook.bank + 6) {
      const at = b.at, yw = wildsBrookY(at), cr = ford(x, z), bed = yw - 0.45 + (cr ? 0.25 * cr : 0);
      h = lerp(h, Math.min(h, yw + 0.5), smooth(WILDS.brook.bank + 6, WILDS.brook.bank, d));
      h = Math.min(h, lerp(bed, h, smooth(WILDS.brook.w * 0.7, WILDS.brook.bank, d)));
    }
  }
  return h;
}
// the toll ford: the road bed lifts to a gravel bar where the main road crosses the brook (1 on the bar, 0 away from it)
function ford(x, z) { return 1 - smooth(1.5, 5.5, hyp(x - (-159.5), z - 1.4)); }
// brook surface height along its length: the ground beside it, never rising downstream
function wildsBrookY(at) {
  if (!WILDS._by) {
    const b = WILDS.brookLine, n = Math.ceil(b.len / 3) + 1, ys = [];
    let y = 1e9; for (let i = 0; i < n; i++) { const p = b.point(i * 3); y = Math.min(y, terrainBase(p[0], p[1]) - 0.5); ys.push(y); }
    WILDS._by = ys;
  }
  const f = Math.min(Math.max(at, 0) / 3, WILDS._by.length - 1.001), i = f | 0; return WILDS._by[i] + (WILDS._by[i + 1] - WILDS._by[i]) * (f - i);
}
