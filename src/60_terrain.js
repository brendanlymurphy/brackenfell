// ───────────────────────── terrain: height field, ground mesh, splat map, water ─────────────────────────
const World = {
  packs: [], lights: [], skinned: [], skinCount: 0, instGroups: [], instPack: null, skinPack: null,
  camZone: 0, indoor: 0, lakeY: LAKE.y, grassOn: true,
  colliders: [], floors: [], interact: [], zones: [], emitters: [], places: [],
};
class Poly {
  constructor(pts) {
    this.p = pts; const n = pts.length; this.cum = new Float32Array(n);
    for (let i = 1; i < n; i++) this.cum[i] = this.cum[i - 1] + hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    this.len = this.cum[n - 1]; this.boxes = [];
    for (let i = 0; i < n - 1; i += 8) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; const e = Math.min(i + 8, n - 1);
      for (let k = i; k <= e; k++) { x0 = Math.min(x0, pts[k][0]); x1 = Math.max(x1, pts[k][0]); z0 = Math.min(z0, pts[k][1]); z1 = Math.max(z1, pts[k][1]); }
      this.boxes.push([x0, z0, x1, z1, i, e]);
    }
  }
  // distance to the line (capped at max); this.at = arclength of the closest point, or -1
  dist(x, z, max) {
    let best = max * max, at = -1; const p = this.p;
    for (const b of this.boxes) {
      if (x < b[0] - max || x > b[2] + max || z < b[1] - max || z > b[3] + max) continue;
      for (let i = b[4]; i < b[5]; i++) {
        const ax = p[i][0], az = p[i][1], bx = p[i + 1][0] - ax, bz = p[i + 1][1] - az, l2 = bx * bx + bz * bz;
        const t = l2 ? sat(((x - ax) * bx + (z - az) * bz) / l2) : 0, dx = x - ax - bx * t, dz = z - az - bz * t, dd = dx * dx + dz * dz;
        if (dd < best) { best = dd; at = this.cum[i] + t * Math.sqrt(l2); }
      }
    }
    this.at = at; return at < 0 ? max : Math.sqrt(best);
  }
  point(s) {
    s = clamp(s, 0, this.len); const c = this.cum; let i = 0, hi = c.length - 2;
    while (i < hi) { const m = (i + hi + 1) >> 1; if (c[m] <= s) i = m; else hi = m - 1; }
    const a = this.p[i], b = this.p[i + 1], l = c[i + 1] - c[i] || 1, t = (s - c[i]) / l;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / l, (b[1] - a[1]) / l];   // x, z, tangent
  }
}
const River = new Poly(catmull(RIVER_PTS, 3));
const Roads = ROADS.map(r => Object.assign({}, r, { line: new Poly(catmull(r.pts, 1.5)) }));
// water surface height at arclength `at` along the river (flows from index 0 down to the lake)
const riverY = at => { const L = River.len - at; return LAKE.y + 0.02 + 0.0062 * Math.min(L, 150) + 0.05 * Math.max(L - 150, 0); };
const lakeR = (x, z) => LAKE.r + 5 * fbm(x / 19, z / 19, 2, 55);

function terrainBase(x, z) {
  const r = hyp(x, z);
  let h = 2.2 * fbm(x / 55, z / 55, 4, 7) + 5 * fbm(x / 170 + 3.1, z / 170 - 1.7, 3, 19);
  h *= lerp(0.2, 1, smooth(30, 150, r));
  const hills = smooth(118, 340, r);
  if (hills > 0) h += hills * (17 + 17 * fbm(x / 150, z / 150, 4, 41) + 14 * hills);
  const mt = smooth(270, 1500, r);
  if (mt > 0) {
    const dirF = lerp(0.3, 1, smooth(-0.9, 0.5, (-z + 0.35 * x) / (r + 1)));       // tallest to the north, a low pass to the south-west
    h += Math.pow(mt, 1.2) * dirF * (90 + 640 * ridged(x / 980 + 0.7, z / 980 - 0.4, 5, 77)) + mt * 40 * fbm(x / 260, z / 260, 3, 5);
  }
  h += 6.5 * Math.exp(-((x + 8) * (x + 8) + (z + 73) * (z + 73)) / (2 * 23 * 23));                                  // chapel rise
  const dc2 = (x - 26) * (x - 26) + (z + 124) * (z + 124);
  if (dc2 < 9000) h += 21 * Math.exp(-dc2 / (2 * 21 * 21)) * (0.86 + 0.3 * fbm(x / 13, z / 13, 3, 99));               // watchtower crag
  h -= 2.6 * Math.exp(-((x - LAKE.x) * (x - LAKE.x) + (z - LAKE.z) * (z - LAKE.z)) / (2 * 62 * 62));                   // the land dips toward the lake
  { const w = LV.upW(x, z); if (w > 0) h = lerp(h, LV.up.h, w); }          // Build 33: the upper ward terrace (55_layout.js LV, 73f_levels.js)
  return h;
}
// [fx3] the Market Place's ground: 1 inside its outline, fading to 0 over `fade` metres outside it (distance to the outline polygon)
function placeW(x, z, fade) {
  const pl = PLACE.poly; let ins = false, best = 1e9;
  for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) {
    const a = pl[i], b = pl[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins;
    const bx = b[0] - a[0], bz = b[1] - a[1], l2 = bx * bx + bz * bz, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * bx + (z - a[1]) * bz) / l2)) : 0, d = Math.hypot(x - a[0] - bx * t, z - a[1] - bz * t); if (d < best) best = d;
  }
  return ins ? 1 : Math.max(0, 1 - best / fade);
}
// the place falls about 0.32 m from the inn to Wharf Street, is crowned along the cart way, and has a drain 6 cm below it
function placeLift(x, z, w) {
  const fall = -0.32 * smooth(-16, 14, z), crown = 0.07 * Math.max(0, 1 - Math.abs(z - (0.8 + 0.12 * x)) / 7), drain = -0.05 * Math.max(0, 1 - Math.abs(z - (1.4 + 0.1 * x)) / 0.45);
  return w * (fall + crown + drain);
}
function terrainH(x, z) {
  let h = terrainBase(x, z);
  if (Math.abs(x) < 210 && Math.abs(z) < 210) {
    // village square
    const sq = hyp((x - SQUARE.x) / (SQUARE.rx + 3), (z - SQUARE.z) / (SQUARE.rz + 3));
    if (sq < 2) h = lerp(h, 0, 1 - smooth(1, 1.9, sq));
    { const pw = placeW(x, z, 7); if (pw > 0) h = lerp(h, 0, pw) + placeLift(x, z, pw); }      // [fx3] the whole place, not an ellipse, is levelled to the datum and then given its fall
    // building pads
    for (const s of SITES) {
      if (Math.abs(x - s.x) > 26 || Math.abs(z - s.z) > 26) continue;
      { const u = LV.up; if (s.x > u.x0 && s.x < u.x1 && s.z > u.z0 && s.z < u.z1 && (x < u.x0 || x > u.x1 || z < u.z0 || z > u.z1)) continue; }          // [fx1] a house on the terrace levels the terrace, not a 6 m heap of ground outside its retaining wall
      const l = worldToSite(s, x, z), m = s.pad || 1.1;
      const dx = Math.max(Math.abs(l[0]) - s.w / 2 - m, 0), dz = Math.max(Math.abs(l[1]) - s.d / 2 - m, 0), dd = hyp(dx, dz);
      if (dd < 6) h = lerp(h, s.y, 1 - smooth(0, 6, dd));
    }
    { const w = LV.upW(x, z); if (w > 0) h = lerp(h, LV.up.h, w); }          // Build 33: the terrace wins over pads that blend in from houses beside it
    // Build 33: neighbouring pads blend over each other for 6 m and the last one won, leaving a porch hanging over a hollow: every site's own footprint and doorstep margin is levelled again
    for (const s of SITES) {
      if (Math.abs(x - s.x) > 14 || Math.abs(z - s.z) > 14) continue;
      { const u = LV.up; if (s.x > u.x0 && s.x < u.x1 && s.z > u.z0 && s.z < u.z1 && (x < u.x0 || x > u.x1 || z < u.z0 || z > u.z1)) continue; }          // [fx1] as above
      const l = worldToSite(s, x, z), m = (s.pad || 1.1) + 0.2 + (s.porch || 0), dx = Math.max(Math.abs(l[0]) - s.w / 2 - m, 0), dz = Math.max(Math.abs(l[1]) - s.d / 2 - m, 0), dd = hyp(dx, dz);
      if (dd < 1.5) h = lerp(h, s.y, 1 - smooth(0, 1.5, dd));
    }
  }
  if (typeof wildsH === 'function') h = wildsH(x, z, h);        // hills, cliffs, yards and the toll-ford brook (55c_wilds.js)
  // river: level banks, then a channel
  const ext = 8 * smooth(125, 230, hyp(x, z));            // far from the village the channel widens so coarse terrain still shows it
  const d = River.dist(x, z, 14 + ext);
  if (d < 14 + ext) {
    const wy = riverY(River.at);
    h = lerp(h, wy + 0.75, smooth(14 + ext, 5.5 + ext, d));
    h -= 1.95 * smooth(4.4 + ext, 1.6 + ext * 0.5, d);
  }
  // lake bowl
  const dl = hyp(x - LAKE.x, z - LAKE.z);
  if (dl < LAKE.r + 30) {
    const rl = lakeR(x, z);
    const hb = dl < rl ? LAKE.y - 3.2 * (1 - (dl / rl) * (dl / rl)) : LAKE.y + (dl - rl) * 0.2;
    h = Math.min(h, lerp(hb, h, smooth(0, 15, dl - rl)));
    /* [coord] Build 74: the shore is dry land. West of the wharf the ground lay 10 cm under the lake's level for 12 m beyond the shoreline, so the lake's
       sheet covered the fisher's hut and its path. Outside the shoreline the ground is at least 0.25 m over the water, rising to 0.6 m within 6 m
       (not in the river's channel, which must still reach the lake). */
    if (dl > rl && d > 6.5 + ext) h = Math.max(h, LAKE.y + 0.25 + 0.35 * Math.min(1, (dl - rl) / 6));
  }
  return h;
}
// 32-bit float -> 16-bit half float
const f2h = (() => { const f = new Float32Array(1), u = new Uint32Array(f.buffer); return v => { f[0] = v; const x = u[0], s = (x >> 16) & 0x8000; let e = ((x >> 23) & 0xff) - 112, m = x & 0x7fffff; if (e <= 0) { if (e < -10) return s; m = (m | 0x800000) >> (1 - e); return s | ((m + 0x1000) >> 13); } if (e >= 31) return s | 0x7c00; return s | (e << 10) + ((m + 0x1000) >> 13); }; })();

const Terrain = {
  N: K.heightN, cell: K.terrainCell, half: K.terrainHalf, h: null,
  // ground height: exact match of the level-0 mesh triangles inside the village area
  y(x, z) {
    const N = this.N, fx = (x + this.half) / this.cell, fz = (z + this.half) / this.cell;
    if (fx < 0 || fz < 0 || fx >= N - 1 || fz >= N - 1) return terrainH(x, z);
    const ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz, h = this.h, o = iz * N + ix;
    const h00 = h[o], h10 = h[o + 1], h01 = h[o + N], h11 = h[o + N + 1];
    return tx > tz ? h00 + (h10 - h00) * tx + (h11 - h10) * tz : h00 + (h11 - h01) * tx + (h01 - h00) * tz;
  },
  normal(x, z) { const e = 0.75, a = this.y(x - e, z), b = this.y(x + e, z), c = this.y(x, z - e), d = this.y(x, z + e); return v3.norm([a - b, 2 * e, c - d]); },
  // splat lookup (0..1): r dirt, g cobble, b field, a bare
  splat(x, z, ch) { const R = K.splatRes, px = Math.floor((x + this.half) / (2 * this.half) * R), pz = Math.floor((z + this.half) / (2 * this.half) * R); if (px < 0 || pz < 0 || px >= R || pz >= R) return 0; return this.splatData[(pz * R + px) * 4 + ch] / 255; },
};
World.groundY = (x, z) => Terrain.y(x, z);

const TERRAIN_FINE = 64;      // was 96; the ground beyond this is drawn with 3 m cells (a 3 m cell at 64 m covers about as many pixels as a 1.5 m cell at 32 m)
const TERRAIN_TILE = [48, 30, 25];      // cells per tile of the three coarse levels (was 48, 40, 50): a tile is culled as a whole, and the big ones were always in view, so smaller tiles draw less
const TERRAIN_FLAT = 0.08, TERRAIN_BLOCK = 8;       // m: how far ground may stray from a plane before a block is split; cells: the biggest block (a power of two; a level whose tile size it does not divide is drawn cell by cell)
// Quadtree over one level's grid: returns { corner: Set of (i * 4096 + j) of every leaf corner, byTile: tile key -> [[i, j, size], ...] }.
function terrainLeaves(L, n, W, hgt, holeC, meshC) {
  const corner = new Set(), byTile = new Map(), tile = L.tile, H = (i, j) => hgt[j * W + i];
  const included = (i0, j0, s) => {      // every cell of the block is drawn (none in the hole, none in the border the fine level leaves to the ring)
    if (L.hole && i0 < n - holeC && i0 + s > holeC && j0 < n - holeC && j0 + s > holeC) return false;
    if (meshC && (i0 < meshC || i0 + s > n - meshC || j0 < meshC || j0 + s > n - meshC)) return false;
    return true;
  };
  const touches = (i0, j0, s) => {       // some cell of the block is drawn
    if (L.hole && i0 >= holeC && i0 + s <= n - holeC && j0 >= holeC && j0 + s <= n - holeC) return false;
    if (meshC && (i0 + s <= meshC || i0 >= n - meshC || j0 + s <= meshC || j0 >= n - meshC)) return false;
    return true;
  };
  const flat = (i0, j0, s) => {
    const h00 = H(i0, j0), h10 = H(i0 + s, j0), h01 = H(i0, j0 + s), h11 = H(i0 + s, j0 + s);
    for (let b = 0; b <= s; b++) for (let a = 0; a <= s; a++) { const u = a / s, v = b / s; if (Math.abs(H(i0 + a, j0 + b) - ((h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v)) > TERRAIN_FLAT) return false; }
    return true;
  };
  const put = (i0, j0, s) => { const k = Math.floor(j0 / tile) * 1000 + Math.floor(i0 / tile); let a = byTile.get(k); if (!a) byTile.set(k, a = []); a.push([i0, j0, s]); for (const [x, y] of [[i0, j0], [i0 + s, j0], [i0, j0 + s], [i0 + s, j0 + s]]) corner.add(x * 4096 + y); };
  const walk = (i0, j0, s) => {
    if (!touches(i0, j0, s)) return;
    if (s > 1 && included(i0, j0, s) && flat(i0, j0, s)) { put(i0, j0, s); return; }
    if (s === 1) { put(i0, j0, 1); return; }
    const h = s / 2; walk(i0, j0, h); walk(i0 + h, j0, h); walk(i0, j0 + h, h); walk(i0 + h, j0 + h, h);
  };
  for (let j = 0; j < n; j += TERRAIN_BLOCK) for (let i = 0; i < n; i += TERRAIN_BLOCK) if (i + TERRAIN_BLOCK <= n && j + TERRAIN_BLOCK <= n) walk(i, j, TERRAIN_BLOCK);
  // tile key: row * 1000 + column, in tiles
  return { corner, byTile: new Map([...byTile].map(([k, v]) => [k, v])) };
}
function buildTerrain() {
  // site heights from the untouched land
  for (const s of SITES) {
    let acc = terrainBase(s.x, s.z), n = 1;
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = siteToWorld(s, c[0] * s.w / 2, c[1] * s.d / 2); acc += terrainBase(p[0], p[1]); n++; }
    s.y = Math.round(acc / n * 20) / 20;
    if (s.id === 'tower') s.y = terrainBase(s.x, s.z) - 0.6;
    const d = River.dist(s.x, s.z, 14); if (d < 14) s.y = riverY(River.at) + 0.78;
    if (hyp(s.x - SQUARE.x, s.z - SQUARE.z) < 30) s.y = lerp(s.y, 0, 0.7);
    { const u = LV.up; if (s.x > u.x0 + 1 && s.x < u.x1 - 1 && s.z > u.z0 + 1 && s.z < u.z1 - 1) s.y = u.h; }          // Build 33: houses on the upper ward terrace stand at its level
  }
  // TERRAIN_FINE: the ground is drawn with 1.5 m cells out to this distance from the centre and with 3 m cells (a quarter of the triangles) from there to the
  // edge of the height grid. Terrain.y still reads the 1.5 m grid. 144 puts the whole grid back on 1.5 m cells.
  const FINE = TERRAIN_FINE, ring = FINE < K.terrainHalf;
  const TH = K.terrainHalf, levels = [{ cell: 1.5, half: TH, hole: 0, tile: 64, mesh: FINE }].concat(ring ? [{ cell: 3, half: TH, hole: FINE, tile: 32 }] : [], [{ cell: 6, half: 432, hole: TH, tile: TERRAIN_TILE[0] }, { cell: 24, half: 1440, hole: 432, tile: TERRAIN_TILE[1] }, { cell: 96, half: 4800, hole: 1440, tile: TERRAIN_TILE[2] }]);
  const pack = new MeshPack(); pack.shadow = true;
  let prev = null;
  for (let li = levels.length - 1; li >= 0; li--) {            // coarse first so fine borders can be stitched to them
    const L = levels[li], n = Math.round(2 * L.half / L.cell), W = n + 1, hgt = new Float32Array(W * W);
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) hgt[j * W + i] = terrainH(-L.half + i * L.cell, -L.half + j * L.cell);
    L.n = n; L.h = hgt;
    if (prev) {       // snap border vertices onto the coarser level's edges
      const ratio = Math.round(prev.cell / L.cell), cW = prev.n + 1, c0 = Math.round((prev.half - L.half) / prev.cell);
      const ch = (ci, cj) => prev.h[cj * cW + ci];
      for (let k = 0; k <= n; k++) {
        const q = Math.floor(k / ratio), t = k / ratio - q, q1 = Math.min(q + 1, n / ratio), cE = c0 + n / ratio;
        hgt[k] = lerp(ch(c0 + q, c0), ch(c0 + q1, c0), t); hgt[n * W + k] = lerp(ch(c0 + q, cE), ch(c0 + q1, cE), t);
        hgt[k * W] = lerp(ch(c0, c0 + q), ch(c0, c0 + q1), t); hgt[k * W + n] = lerp(ch(cE, c0 + q), ch(cE, c0 + q1), t);
      }
    }
    if (L.mesh && ring) {       // the fine level ends at |x| or |z| = L.mesh: its border vertices between ring vertices take the ring's straight edge
      const e0 = Math.round((L.half - L.mesh) / L.cell), e1 = n - e0;
      for (let k = e0; k <= e1; k++) if ((k - e0) & 1) { hgt[e0 * W + k] = (hgt[e0 * W + k - 1] + hgt[e0 * W + k + 1]) / 2; hgt[e1 * W + k] = (hgt[e1 * W + k - 1] + hgt[e1 * W + k + 1]) / 2; hgt[k * W + e0] = (hgt[(k - 1) * W + e0] + hgt[(k + 1) * W + e0]) / 2; hgt[k * W + e1] = (hgt[(k - 1) * W + e1] + hgt[(k + 1) * W + e1]) / 2; }
    }
    const holeC = Math.round((L.half - L.hole) / L.cell);       // cells from the edge to the hole
    const meshC = L.mesh && ring ? Math.round((L.half - L.mesh) / L.cell) : 0;       // cells from the edge that are not drawn at this level
    // Flat ground is drawn with fewer, bigger triangles: aligned blocks of up to TERRAIN_BLOCK cells whose heights stay within TERRAIN_FLAT of a
    // plane become one fan of triangles, and a block's edge keeps the corner of every smaller neighbour so no crack can open (see terrainLeaves).
    const leaves = L.tile % TERRAIN_BLOCK === 0 ? terrainLeaves(L, n, W, hgt, holeC, meshC) : null;
    for (let tj = 0; tj < n; tj += L.tile) for (let ti = 0; ti < n; ti += L.tile) {
      const m = new Mesh(2048), ids = new Map();
      const vid = (i, j) => {
        const key = j * W + i; let v = ids.get(key); if (v !== undefined) return v;
        const il = Math.max(i - 1, 0), ir = Math.min(i + 1, n), ju = Math.max(j - 1, 0), jd = Math.min(j + 1, n);
        const nx = (hgt[j * W + il] - hgt[j * W + ir]) / ((ir - il) * L.cell), nz = (hgt[ju * W + i] - hgt[jd * W + i]) / ((jd - ju) * L.cell);
        v = m.vert(-L.half + i * L.cell, hgt[key], -L.half + j * L.cell, nx, 1, nz, 0, 0); ids.set(key, v); return v;
      };
      if (leaves) for (const lf of leaves.byTile.get((tj / L.tile) * 1000 + ti / L.tile) || []) {
        const [i0, j0, sz] = lf;
        if (sz === 1) { const a = vid(i0, j0), b = vid(i0, j0 + 1), c = vid(i0 + 1, j0 + 1), d = vid(i0 + 1, j0); m.tri(a, b, c); m.tri(a, c, d); continue; }
        const ring2 = [];       // the block's outline, turning the same way as the single cells do, with every corner a neighbour has on its edges
        for (let k = 0; k < sz; k++) if (k === 0 || leaves.corner.has((i0) * 4096 + j0 + k)) ring2.push([i0, j0 + k]);
        for (let k = 0; k < sz; k++) if (k === 0 || leaves.corner.has((i0 + k) * 4096 + j0 + sz)) ring2.push([i0 + k, j0 + sz]);
        for (let k = 0; k < sz; k++) if (k === 0 || leaves.corner.has((i0 + sz) * 4096 + j0 + sz - k)) ring2.push([i0 + sz, j0 + sz - k]);
        for (let k = 0; k < sz; k++) if (k === 0 || leaves.corner.has((i0 + sz - k) * 4096 + j0)) ring2.push([i0 + sz - k, j0]);
        const ctr = vid(i0 + sz / 2, j0 + sz / 2), ids2 = ring2.map(q => vid(q[0], q[1]));
        for (let k = 0; k < ids2.length; k++) m.tri(ids2[k], ids2[(k + 1) % ids2.length], ctr);
      } else for (let j = tj; j < Math.min(tj + L.tile, n); j++) for (let i = ti; i < Math.min(ti + L.tile, n); i++) {
        if (L.hole && i >= holeC && i < n - holeC && j >= holeC && j < n - holeC) continue;
        if (meshC && (i < meshC || i >= n - meshC || j < meshC || j >= n - meshC)) continue;
        const a = vid(i, j), b = vid(i, j + 1), c = vid(i + 1, j + 1), d = vid(i + 1, j);
        m.tri(a, b, c); m.tri(a, c, d);
      }
      if (m.ni) pack.add(m, { kind: 'terrain', noShadow: true });
    }
    prev = L;
  }
  Terrain.h = levels[0].h;
  pack.upload('terrain'); World.packs.push(pack);
  // height texture for the grass shader
  const N = Terrain.N, hh = new Uint16Array(N * N);
  for (let i = 0; i < N * N; i++) hh[i] = f2h(Terrain.h[i]);
  G.heightTex = gfxDataTex(hh, N, N, THREE.RedFormat, THREE.HalfFloatType);
}

// roads, square, fields and bare ground painted with Canvas2D, then used by the ground shader, the grass and footsteps
function buildSplat() {
  const Rz = K.splatRes, half = Terrain.half, sc = Rz / (2 * half);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = Rz; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#000'; x.fillRect(0, 0, Rz, Rz); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round'; return x; };
  const A = mk(), B = mk();
  const P = (x, z) => [(x + half) * sc, (z + half) * sc];
  const stroke = (ctx, pts, w, col, soft) => {
    for (const [extra, a] of [[soft * 2, 0.22], [soft, 0.33], [0, 0.45]]) {
      ctx.strokeStyle = col(a); ctx.lineWidth = (w + extra) * sc; ctx.beginPath();
      pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
    }
  };
  const red = a => `rgb(${Math.round(a * 255)},0,0)`, grn = a => `rgb(0,${Math.round(a * 255)},0)`, blu = a => `rgb(0,0,${Math.round(a * 255)})`;
  for (const r of Roads) stroke(A, r.line.p, r.w, red, 0.8);
  // short paths from every door to the nearest road
  for (const s of SITES) {
    if (s.id === 'tower' || s.id === 'barn') continue;
    const dl = siteDoorLocal(s, 1.3), d0 = siteDoorLocal(s, 0), dp = siteToWorld(s, dl[0], dl[1]); let best = null, bd = 1e9;
    for (const r of Roads) { const d = r.line.dist(dp[0], dp[1], 40); if (d < bd) { bd = d; best = r.line.point(r.line.at); } }
    if (best) stroke(A, [siteToWorld(s, d0[0], d0[1]), dp, [best[0], best[1]]], 1.5, red, 0.7);
  }
  // cobbled square (+ inn forecourt, bridge approaches)
  const ell = (ctx, x, z, rx, rz, col) => { for (const [e, a] of [[1.6, 0.22], [0.8, 0.33], [0, 0.45]]) { ctx.fillStyle = col(a); const q = P(x, z); ctx.beginPath(); ctx.ellipse(q[0], q[1], (rx + e) * sc, (rz + e) * sc, 0, 0, TAU); ctx.fill(); } };
  { const pl = PLACE.poly;      // [fx3] the Market Place is cobbled wall to wall to its own outline; a short soft shoulder where it meets a road
    for (const [e, al] of [[1.6, 0.22], [0.8, 0.33], [0, 0.45]]) { A.fillStyle = A.strokeStyle = grn(al); A.lineJoin = 'round'; A.lineWidth = 2 * e * sc + 1; A.beginPath(); pl.forEach((q, i) => { const c = P(q[0], q[1]); if (i) A.lineTo(c[0], c[1]); else A.moveTo(c[0], c[1]); }); A.closePath(); A.fill(); if (e) A.stroke(); } }
  for (const [id, w, keep] of [['main', 6.4, p => p[0] > -50 && p[0] < -19], ['south', 7.0, p => p[1] > 8 && p[1] < 31], ['north', 4.4, p => p[1] < -16 && p[1] > -66]]) {      // [fx3] the last stretch of each street into the place is a street: cobbled from front to front
    const r = Roads.find(q => q.id === id); if (r) { const pts = r.line.p.filter(keep); if (pts.length > 1) stroke(A, pts, w, grn, 0.9); } }
  /* [fx3] the district: between the fronts, yards and lanes of the Market Place quarter the ground is trodden earth, not lawn; it fades to turf at the edges */
  { const Rd = rng(9955); for (let i = 0; i < 640; i++) { const x = -60 + Rd() * 94, z = -35 + Rd() * 72, rad = 3 + Rd() * 4, q = P(x, z), g = A.createRadialGradient(q[0], q[1], rad * sc * 0.2, q[0], q[1], rad * sc); g.addColorStop(0, 'rgba(255,0,0,0.30)'); g.addColorStop(1, 'rgba(255,0,0,0)'); A.fillStyle = g; A.beginPath(); A.arc(q[0], q[1], rad * sc, 0, TAU); A.fill(); } }
  { const Rd = rng(9957); for (let i = 0; i < 200; i++) { const x = -46 + Rd() * 84, z = -62 + Rd() * 34, rad = 3 + Rd() * 4, q = P(x, z), g = A.createRadialGradient(q[0], q[1], rad * sc * 0.2, q[0], q[1], rad * sc); g.addColorStop(0, 'rgba(255,0,0,0.26)'); g.addColorStop(1, 'rgba(255,0,0,0)'); A.fillStyle = g; A.beginPath(); A.arc(q[0], q[1], rad * sc, 0, TAU); A.fill(); } }      /* Chapelgate: earth lanes between the cottages, not lawn */
  stroke(A, [[-1.5, -45.2], [6, -45.4], [14, -44.6], [22, -45.0], [30, -44.7], [36.5, -44.9]], 3.4, grn, 0.9);      /* the east cluster's lane, cobbled, wandering to the well */
  stroke(A, [[-6.3, -62.6], [-10.0, -63.4], [-13.6, -64.0], [-16.0, -64.7], [-16.0, -66.8]], 2.6, red, 0.85);      /* the worn way to the lych gate */
  /* [fx3] plots: each yard's floor is packed earth (trodden dirt, bare in places), the back lane behind the plots' back walls is a trodden strip with a cobble spine; no lawn inside a burgage */
  if (typeof plotsCompute === 'function') for (const p of plotsCompute()) {
    if (p.axis === 'x') { for (const [al, e] of [[0.55, 0.5], [0.9, 0]]) { A.fillStyle = red(al); const a0 = P(p.x0 - e, p.z0 - e), a1 = P(p.x1 + e, p.z1 + e); A.fillRect(a0[0], a0[1], a1[0] - a0[0], a1[1] - a0[1]); } continue; }
    const lane = p.bz > 0 ? [p.z1 + 0.15, p.z1 + 2.6] : [p.z0 - 2.6, p.z0 - 0.15];
    for (const [al, e] of [[0.55, 0.5], [0.9, 0]]) { A.fillStyle = red(al); const a0 = P(p.x0 - e, p.z0 - e), a1 = P(p.x1 + e, p.z1 + e); A.fillRect(a0[0], a0[1], a1[0] - a0[0], a1[1] - a0[1]); }
    for (const [al, e] of [[0.5, 0.4], [0.9, 0]]) { A.fillStyle = red(al); const a0 = P(p.x0 - 0.3 - e, lane[0] - e), a1 = P(p.x1 + 0.3 + e, lane[1] + e); A.fillRect(a0[0], a0[1], a1[0] - a0[0], a1[1] - a0[1]); }
    A.fillStyle = grn(0.5); { const a0 = P(p.x0 - 0.3, (lane[0] + lane[1]) / 2 - 0.5), a1 = P(p.x1 + 0.3, (lane[0] + lane[1]) / 2 + 0.5); A.fillRect(a0[0], a0[1], a1[0] - a0[0], a1[1] - a0[1]); }
  }
  /* [fx3] a street runs front to front: every house that stands on the last stretch of Wharf Street, the main street's west run or the market alley is paved round its feet (a 1.3 m apron, 2 m in front), so no lawn strip is left against a front */
  { const zone = [['south', p => p[1] > 7 && p[1] < 34], ['main', p => p[0] > -52 && p[0] < -17], ['north', p => p[1] < -18 && p[1] > -64]];
    for (const s of SITES) {
      if (!s.w || s.id === 'tower' || s.id === 'barn') continue;
      let near = false; for (const [id, keep] of zone) { const r = Roads.find(q => q.id === id); if (r && r.line.dist(s.x, s.z, 14) < 9 && keep([s.x, s.z])) near = true; }
      if (!near && !(s.id.startsWith('shop.') && s.x > ALLEY.x0 - 4)) continue;
      const dl = siteDoorLocal(s, 0), fr = Math.abs(dl[1]) > Math.abs(dl[0]) ? Math.sign(dl[1]) : 0;
      const e = 1.3, x0 = -s.w / 2 - e, x1 = s.w / 2 + e, z0 = -s.d / 2 - e - (fr < 0 ? 0.7 : 0), z1 = s.d / 2 + e + (fr > 0 ? 0.7 : 0);
      A.fillStyle = grn(0.9); A.beginPath(); [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach((c, i) => { const w = siteToWorld(s, c[0], c[1]), q = P(w[0], w[1]); if (i) A.lineTo(q[0], q[1]); else A.moveTo(q[0], q[1]); }); A.closePath(); A.fill();
    } }
  stroke(A, [[BRIDGE.x - BRIDGE.len / 2 - 5, BRIDGE.z], [BRIDGE.x + BRIDGE.len / 2 + 5, BRIDGE.z]], BRIDGE.w, grn, 0.6);
  stroke(A, [[-6, -63.6], [-6, -68]], 3.6, grn, 0.6);
  stroke(A, [[ALLEY.x0 - 2, roadZ(ALLEY.x0 - 2)], [36, 1], [ALLEY.x1 + 1, roadZ(ALLEY.x1 + 1)]], 9.6, grn, 0.75);       // the market alley is cobbled from shop front to shop front
  for (const f of FIELDS) { A.fillStyle = blu(1); const a = P(f.x0, f.z0), b = P(f.x1, f.z1); A.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
  // bare ground: under buildings, river bed, lake
  for (const s of SITES) {
    if (s.id === 'tower') continue;
    const m = 0.5, pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(c => siteToWorld(s, c[0] * (s.w / 2 + m), c[1] * (s.d / 2 + m)));
    B.fillStyle = red(1); B.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) B.lineTo(q[0], q[1]); else B.moveTo(q[0], q[1]); }); B.closePath(); B.fill();
    stroke(B, pts.concat([pts[0]]), 0.6, red, 0.6);
    for (const b of s.bare || []) { const q = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]].map(c => siteToWorld(s, c[0], c[1])); B.fillStyle = red(1); B.beginPath(); q.forEach((p, i) => { const w = P(p[0], p[1]); if (i) B.lineTo(w[0], w[1]); else B.moveTo(w[0], w[1]); }); B.closePath(); B.fill(); }
  }
  ell(B, SITE.tower.x, SITE.tower.z, 4.6, 4.6, red);
  stroke(B, River.p, 9.4, red, 1.2);
  ell(B, LAKE.x, LAKE.z, LAKE.r + 4, LAKE.r + 4, red);
  if (typeof wildsSplat === 'function') wildsSplat(A, B, { P, stroke, ell, red, grn, blu });       // (79_wilds.js: footpath cobbles, scree, ash)
  const da = A.getImageData(0, 0, Rz, Rz).data, db = B.getImageData(0, 0, Rz, Rz).data, out = new Uint8Array(Rz * Rz * 4);
  for (let i = 0; i < Rz * Rz; i++) { out[i * 4] = da[i * 4]; out[i * 4 + 1] = da[i * 4 + 1]; out[i * 4 + 2] = da[i * 4 + 2]; out[i * 4 + 3] = db[i * 4]; }
  Terrain.splatData = out;
  G.splatTex = gfxDataTex(out, Rz, Rz, THREE.RGBAFormat, THREE.UnsignedByteType);
}

// second ground mask, painted once everything is placed: r shade under trees, g wet ground, b contact shade around solid things, a worn turf
function buildSplat2() {
  const Rz = K.splatRes, half = Terrain.half, sc = Rz / (2 * half);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = Rz; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#000'; x.fillRect(0, 0, Rz, Rz); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round'; return x; };
  const A = mk(), B = mk(), R = rng(4411);
  const P = (x, z) => [(x + half) * sc, (z + half) * sc];
  const ch = ['255,0,0', '0,255,0', '0,0,255'];
  // soft round stamp into one colour channel
  const blob = (ctx, c, x, z, rad, a, core) => {
    if (Math.abs(x) > half + rad || Math.abs(z) > half + rad) return;
    const q = P(x, z), g = ctx.createRadialGradient(q[0], q[1], rad * sc * (core || 0), q[0], q[1], rad * sc);
    g.addColorStop(0, `rgba(${ch[c]},${a})`); g.addColorStop(1, `rgba(${ch[c]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], rad * sc, 0, TAU); ctx.fill();
  };
  const line = (ctx, c, pts, w, a) => { ctx.strokeStyle = `rgba(${ch[c]},${a})`; ctx.lineWidth = w * sc; ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); };
  const V = World.vegInst || {};
  for (const [kind, rad, a] of [['oak', 7.0, 0.95], ['birch', 2.9, 0.6], ['pine', 2.7, 0.7]]) for (const t of V[kind] || []) blob(A, 0, t[0], t[2], rad * t[3], a, 0.25);
  for (const t of V.bush || []) blob(A, 0, t[0], t[2], 1.2 * t[3], 0.5, 0.2);
  // wet: river banks, lake shore, and scattered low spots along the roads
  for (const [w, a] of [[15, 0.25], [11.5, 0.35], [9, 0.4]]) line(A, 1, River.p, w, a);
  for (const [e, a] of [[5.5, 0.25], [3.5, 0.35], [2, 0.4]]) { const q = P(LAKE.x, LAKE.z); A.fillStyle = `rgba(${ch[1]},${a})`; A.beginPath(); A.arc(q[0], q[1], (LAKE.r + e) * sc, 0, TAU); A.fill(); }
  for (const rd of Roads) for (let d = 4; d < rd.line.len - 4; d += 3 + R() * 9) {
    const p = rd.line.point(d), o = R.s() * rd.w * 0.42; if (hyp(p[0] - SQUARE.x, p[1] - SQUARE.z) < 14) continue;
    blob(A, 1, p[0] - p[3] * o, p[1] + p[2] * o, 0.7 + R() * 1.2, 0.9, 0.3);
  }
  line(A, 1, [[ALLEY.x0 - 2, roadZ(ALLEY.x0 - 2)], [36, 1], [ALLEY.x1 + 1, roadZ(ALLEY.x1 + 1)]], 8, 0.5);      /* [fx3] the alley is the wetter, darker street */
  /* [fx3] the ditch outside the west edge: bare wet earth just outside the bank */
  if (typeof WEST_EDGE !== 'undefined') for (const k of ['n', 's']) { const pts = WEST_EDGE[k].slice(WEST_EDGE.pal).map(p => [p[0] - 1.5, p[1]]); if (pts.length > 1) { line(A, 1, pts, 1.6, 0.7); line(B, 2, pts, 2.2, 0.4); } }
  /* [fx3] Westgate: wheel ruts in the earth road outside the gate, two wet tracks 1.7 m apart and a worn middle */
  { const r = Roads.find(q => q.id === 'main'); if (r) { const pts = r.line.p.filter(p => p[0] < -57 && p[0] > -112); if (pts.length > 1) { for (const o of [-0.85, 0.85]) line(A, 1, pts.map(p => [p[0], p[1] + o]), 0.32, 0.45); line(B, 0, pts, 1.0, 0.5); } } }
  /* [fx3] the Market Place's drain: a wet channel down the middle of the place (the fall runs to z+), a branch down Wharf Street's mouth, and puddle hollows in the low cobbles */
  { const dr = [[-19.4, -0.5], [-10, 0.4], [-3, 1.1], [3, 1.7], [10, 2.3], [20.2, 3.4]], br = [[2.8, 1.6], [0.9, 5.5], [0.3, 9], [0.2, 14], [0.2, 22]];
    for (const pl of [dr, br]) for (const [w, a2] of [[1.8, 0.16], [0.9, 0.30], [0.4, 0.55]]) line(A, 1, pl, w, a2);
    const Rp = rng(5521); for (let i = 0; i < 14; i++) { const x = -17 + Rp() * 36, z = -12 + Rp() * 22; if (placeW(x, z, 0.01) < 1) continue; blob(A, 1, x, z, 0.6 + Rp() * 0.9, 0.42, 0.2); } }
  // contact shade and trampled earth around anything solid that stands on the ground
  for (const c of World.colliders) {
    if (Math.abs(c.x) > half || Math.abs(c.z) > half) continue;
    if (c.y0 > Terrain.y(c.x, c.z) + 0.7) continue;
    if (c.r !== undefined) { blob(B, 2, c.x, c.z, c.r + 0.9, 0.85, c.r / (c.r + 0.9) * 0.7); blob(B, 0, c.x, c.z, c.r + 0.5, 0.35, 0.3); }
    else {
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(k => [c.x + c.ax * k[0] * c.hx + c.bx * k[1] * c.hz, c.z + c.az * k[0] * c.hx + c.bz * k[1] * c.hz]);
      for (const [w, a] of [[2.2, 0.16], [1.3, 0.24], [0.6, 0.34]]) line(B, 2, pts, w, a);
      line(B, 0, pts, 1.0, 0.22);
    }
  }
  for (const s of SITES) {
    if (s.id === 'tower') continue;
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(c => siteToWorld(s, c[0] * s.w / 2, c[1] * s.d / 2));
    for (const [w, a] of [[3.4, 0.2], [2.0, 0.3], [0.9, 0.4]]) line(B, 2, pts, w, a);
    const dl = siteDoorLocal(s, 1.2), dp = siteToWorld(s, dl[0], dl[1]); blob(B, 0, dp[0], dp[1], 2.6, 0.8, 0.3);
  }
  blob(B, 0, SQUARE.x, SQUARE.z, Math.max(SQUARE.rx, SQUARE.rz) + 6, 0.5, 0.75);
  // ── outdoor dressing: damp patches on the cobbles, mud and worn turf around troughs, hay, carts, benches (73c_dress.js; this block is separate from the LOD work) ──
  if (typeof splat2Dress === 'function') splat2Dress(blob, A, B);
  if (typeof wildsSplat2 === 'function') wildsSplat2(blob, line, A, B);       // (79_wilds.js: mud at the pool and brook, trodden ground at the camps)
  const da = A.getImageData(0, 0, Rz, Rz).data, db = B.getImageData(0, 0, Rz, Rz).data, out = new Uint8Array(Rz * Rz * 4);
  for (let i = 0; i < Rz * Rz; i++) { out[i * 4] = da[i * 4]; out[i * 4 + 1] = da[i * 4 + 1]; out[i * 4 + 2] = db[i * 4 + 2]; out[i * 4 + 3] = db[i * 4]; }
  G.splat2Tex = gfxDataTex(out, Rz, Rz, THREE.RGBAFormat, THREE.UnsignedByteType);
}

function buildWater() {
  const m = new Mesh(4096);
  m.mat(MAT.PLAIN, [1, 1, 1]);
  // river ribbon: 5 vertices across, flow direction stored in uv
  const step = 2.5, offs = [-6, -3, 0, 3, 6], rows = Math.floor((River.len - 6) / step);
  let start = 0; for (let k = 0; k <= rows; k++) { const p = River.point(k * step); if (hyp(p[0], p[1]) < 520) { start = k; break; } }
  const ring = [];
  for (let k = start; k <= rows; k++) {
    const s = k * step, p = River.point(s), wy = riverY(s), wide = 1 + 1.3 * smooth(125, 230, hyp(p[0], p[1])), nx = -p[3] * wide, nz = p[2] * wide, row = [];
    const endFade = sat((River.len - 6 - s) / 10);
    for (const o of offs) {
      const x = p[0] + nx * o, z = p[1] + nz * o, depth = sat((wy - Terrain.y(x, z)) / 0.9) * endFade;
      m.ao = depth; row.push(m.vert(x, wy, z, 0, 1, 0, p[2] * 1.0, p[3] * 1.0));
    }
    ring.push(row);
  }
  for (let k = 0; k < ring.length - 1; k++) for (let i = 0; i < offs.length - 1; i++) { const a = ring[k][i], b = ring[k + 1][i], c = ring[k + 1][i + 1], d = ring[k][i + 1]; m.tri(a, c, b); m.tri(a, d, c); }
  const riverItem = { kind: 'water', noShadow: true };
  const pack = new MeshPack(); pack.shadow = false;
  pack.add(m, riverItem);
  // lake sheet
  const lm = new Mesh(4096); lm.mat(MAT.PLAIN, [1, 1, 1]);
  const cs = 2.5, ext = LAKE.r + 12, n = Math.ceil(2 * ext / cs), ids = new Map();
  const lv = (i, j) => { const key = j * 4096 + i; let v = ids.get(key); if (v !== undefined) return v; const x = LAKE.x - ext + i * cs, z = LAKE.z - ext + j * cs; lm.ao = sat((LAKE.y - Terrain.y(x, z)) / 0.9); v = lm.vert(x, LAKE.y, z, 0, 1, 0, 0.25, 0.1); ids.set(key, v); return v; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = LAKE.x - ext + i * cs, z = LAKE.z - ext + j * cs;
    if (Math.min(terrainH(x, z), terrainH(x + cs, z), terrainH(x, z + cs), terrainH(x + cs, z + cs)) > LAKE.y + 0.05) continue;
    const a = lv(i, j), b = lv(i, j + 1), c = lv(i + 1, j + 1), d = lv(i + 1, j); lm.tri(a, b, c); lm.tri(a, c, d);
  }
  pack.add(lm, { kind: 'water', noShadow: true });
  pack.upload('water'); World.packs.push(pack);
}
