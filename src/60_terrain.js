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
  return h;
}
function terrainH(x, z) {
  let h = terrainBase(x, z);
  if (Math.abs(x) < 160 && Math.abs(z) < 170) {
    // village square
    const sq = hyp((x - SQUARE.x) / (SQUARE.rx + 3), (z - SQUARE.z) / (SQUARE.rz + 3));
    if (sq < 2) h = lerp(h, 0, 1 - smooth(1, 1.9, sq));
    // building pads
    for (const s of SITES) {
      if (Math.abs(x - s.x) > 26 || Math.abs(z - s.z) > 26) continue;
      const l = worldToSite(s, x, z), m = s.pad || 1.1;
      const dx = Math.max(Math.abs(l[0]) - s.w / 2 - m, 0), dz = Math.max(Math.abs(l[1]) - s.d / 2 - m, 0), dd = hyp(dx, dz);
      if (dd < 6) h = lerp(h, s.y, 1 - smooth(0, 6, dd));
    }
  }
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

const TERRAIN_FINE = 96;
function buildTerrain() {
  // site heights from the untouched land
  for (const s of SITES) {
    let acc = terrainBase(s.x, s.z), n = 1;
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = siteToWorld(s, c[0] * s.w / 2, c[1] * s.d / 2); acc += terrainBase(p[0], p[1]); n++; }
    s.y = Math.round(acc / n * 20) / 20;
    if (s.id === 'tower') s.y = terrainBase(s.x, s.z) - 0.6;
    const d = River.dist(s.x, s.z, 14); if (d < 14) s.y = riverY(River.at) + 0.78;
    if (hyp(s.x - SQUARE.x, s.z - SQUARE.z) < 30) s.y = lerp(s.y, 0, 0.7);
  }
  // TERRAIN_FINE: the ground is drawn with 1.5 m cells out to this distance from the centre and with 3 m cells (a quarter of the triangles) from there to the
  // edge of the height grid. Terrain.y still reads the 1.5 m grid. 144 puts the whole grid back on 1.5 m cells.
  const FINE = TERRAIN_FINE, ring = FINE < K.terrainHalf;
  const levels = [{ cell: 1.5, half: 144, hole: 0, tile: 64, mesh: FINE }].concat(ring ? [{ cell: 3, half: 144, hole: FINE, tile: 32 }] : [], [{ cell: 6, half: 432, hole: 144, tile: 48 }, { cell: 24, half: 1440, hole: 432, tile: 40 }, { cell: 96, half: 4800, hole: 1440, tile: 50 }]);
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
    for (let tj = 0; tj < n; tj += L.tile) for (let ti = 0; ti < n; ti += L.tile) {
      const m = new Mesh(2048), ids = new Map();
      const vid = (i, j) => {
        const key = j * W + i; let v = ids.get(key); if (v !== undefined) return v;
        const il = Math.max(i - 1, 0), ir = Math.min(i + 1, n), ju = Math.max(j - 1, 0), jd = Math.min(j + 1, n);
        const nx = (hgt[j * W + il] - hgt[j * W + ir]) / ((ir - il) * L.cell), nz = (hgt[ju * W + i] - hgt[jd * W + i]) / ((jd - ju) * L.cell);
        v = m.vert(-L.half + i * L.cell, hgt[key], -L.half + j * L.cell, nx, 1, nz, 0, 0); ids.set(key, v); return v;
      };
      for (let j = tj; j < Math.min(tj + L.tile, n); j++) for (let i = ti; i < Math.min(ti + L.tile, n); i++) {
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
  ell(A, SQUARE.x, SQUARE.z, SQUARE.rx, SQUARE.rz, grn);
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
