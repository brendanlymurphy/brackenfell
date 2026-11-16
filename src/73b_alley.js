// ───────────────────────── the market alley: kit-built shop fronts, signs, awnings, wares, bunting ─────────────────────────
// Two rows of narrow shops stand 5.5 m back from the main road between the store and the bridge (sites in 55_layout.js). Every shop is
// assembled here from the village kit exactly like the houses (2 m wall panels, window and door modules, round-tile roof, timber gable) with
// upper storeys that overhang the street. Signs, awnings, flower boxes, lanterns and bunting are small generated pieces that reuse the kit's
// own wood and cloth materials, so the whole alley is one batch: one draw call per material, nothing in the sun-shadow maps (a prism stand-in
// per shop casts the shadow instead), and the whole group is hidden when the camera is far away or indoors.

// ── a tiny mesh builder for pieces that do not exist in the kit (quads and boxes, vertex colours, UVs inside a flat region of a kit texture) ──
const GPU = {
  wood: [0.02, 0.07, 0.62, 0.27],             // dark plank band of MI_WoodTrim
  cloth: [0.3, 0.27, 0.55, 0.45],             // pale cloth of MI_Trim_Cloth (takes the vertex colour well)
  glyph: { swords: [0.04, 0.69, 0.16, 0.83], potion: [0.25, 0.69, 0.4, 0.83], herbs: [0.44, 0.69, 0.59, 0.83], anvil: [0.02, 0.86, 0.2, 0.98], mugs: [0.24, 0.86, 0.41, 0.98], axes: [0.45, 0.86, 0.6, 0.98], crest: [0.03, 0.54, 0.36, 0.68], chevron: [0.4, 0.54, 0.6, 0.68] },
};
function GP() {
  const prims = {}, pr = mat => prims[mat] || (prims[mat] = { mat, pos: [], nrm: [], uv: [], col: [], idx: [] });
  const quad = (mat, a, b, c, d, col, uv, both) => {
    const p = pr(mat), u = uv || GPU.wood, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(v => v / l);
    const emit = (vs, uvs, nn) => { const b0 = p.pos.length / 3; vs.forEach((v, i) => { p.pos.push(v[0], v[1], v[2]); p.nrm.push(nn[0], nn[1], nn[2]); p.uv.push(uvs[i][0], uvs[i][1]); p.col.push(col[0], col[1], col[2]); }); p.idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3); };
    const uvs = [[u[0], u[1]], [u[2], u[1]], [u[2], u[3]], [u[0], u[3]]];
    // both may be an outward direction: one face only, wound to face that way (kit materials draw both sides themselves; two coincident faces fight for depth and one side goes dark)
    if (Array.isArray(both)) { if (n[0] * both[0] + n[1] * both[1] + n[2] * both[2] < 0) emit([d, c, b, a], [uvs[3], uvs[2], uvs[1], uvs[0]], [-n[0], -n[1], -n[2]]); else emit([a, b, c, d], uvs, n); return; }
    emit([a, b, c, d], uvs, n);
    // both === true used to add a second, reversed face; every kit material draws both sides itself, so the pair was coincident (z-fighting) and doubled the triangles: one face now
  };
  const tri = (mat, a, b, c, col, uv, both) => quad(mat, a, b, c, c, col, uv, both);
  const box = (mat, x0, y0, z0, x1, y1, z1, col, uv) => {
    col = col || [1, 1, 1];
    quad(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, uv); quad(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, uv);
    quad(mat, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, uv); quad(mat, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, uv);
    quad(mat, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, uv); quad(mat, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, uv);
  };
  const beam = (mat, a, b, t, col) => {       // a thin square beam between two points
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; let s = Math.abs(d[1]) / L > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const f = d.map(v => v / L), x = [f[1] * s[2] - f[2] * s[1], f[2] * s[0] - f[0] * s[2], f[0] * s[1] - f[1] * s[0]], xl = Math.hypot(x[0], x[1], x[2]) || 1, xn = x.map(v => v * t / xl);
    const y = [f[1] * xn[2] - f[2] * xn[1], f[2] * xn[0] - f[0] * xn[2], f[0] * xn[1] - f[1] * xn[0]], yl = Math.hypot(y[0], y[1], y[2]) || 1, yn = y.map(v => v * t / yl);
    const c = (i, j, k) => [(i ? b : a)[0] + xn[0] * j + yn[0] * k, (i ? b : a)[1] + xn[1] * j + yn[1] * k, (i ? b : a)[2] + xn[2] * j + yn[2] * k];
    const q = (p0, p1, p2, p3) => quad(mat, p0, p1, p2, p3, col || [1, 1, 1], GPU.wood);
    q(c(0, -1, -1), c(0, 1, -1), c(1, 1, -1), c(1, -1, -1)); q(c(0, 1, 1), c(0, -1, 1), c(1, -1, 1), c(1, 1, 1)); q(c(0, -1, 1), c(0, -1, -1), c(1, -1, -1), c(1, -1, 1)); q(c(0, 1, -1), c(0, 1, 1), c(1, 1, 1), c(1, 1, -1));
  };
  const make = name => {
    const out = [], min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
    for (const k in prims) { const p = prims[k]; if (!p.idx.length) continue; for (let i = 0; i < p.pos.length; i++) { const a = i % 3; if (p.pos[i] < min[a]) min[a] = p.pos[i]; if (p.pos[i] > max[a]) max[a] = p.pos[i]; } out.push({ mat: p.mat, pos: Float32Array.from(p.pos), nrm: Float32Array.from(p.nrm), uv: Float32Array.from(p.uv), col: Float32Array.from(p.col), idx: Uint32Array.from(p.idx), n: p.pos.length / 3 }); }
    Kit.pieces[name] = { name, prims: out, min, max, pack: 'gen' }; return name;
  };
  return { quad, tri, box, beam, make, _prim: pr };
}
const W_ = 'MI_WoodTrim', C_ = 'MI_Trim_Cloth', DARKW = [0.62, 0.55, 0.5];

// ── generated pieces (origin where they attach to the wall: x along the wall, y up, z out into the street) ──
let _gn = 0;
function genAwning(w, c1, c2, drop) {
  c1 = c1.map(v => v * 0.74); c2 = c2.map(v => v * 0.7);          // [fx1] cloth that has hung in the weather for years: the stripes read as candy at full dye
  const g = GP(), n = Math.max(2, Math.round(w / 0.3)), sw = (w - 0.1) / n, out = 1.45, dy = drop || 0.62;
  for (let i = 0; i < n; i++) {
    const x0 = -w / 2 + 0.05 + i * sw, x1 = x0 + sw, c = i % 2 ? c2 : c1;
    g.quad(C_, [x0, 0, 0], [x1, 0, 0], [x1, -dy, out], [x0, -dy, out], c, GPU.cloth, true);                    // the sloping cloth
    g.quad(C_, [x0, -dy, out], [x1, -dy, out], [x1, -dy - 0.2, out + 0.03], [x0, -dy - 0.2, out + 0.03], c.map(v => v * 0.86), GPU.cloth, true);    // valance (grimier)
    g.tri(C_, [x0, -dy - 0.2, out + 0.03], [x1, -dy - 0.2, out + 0.03], [(x0 + x1) / 2, -dy - 0.32, out + 0.04], c, GPU.cloth, true);     // scalloped hem
  }
  g.box(W_, -w / 2, -dy - 0.02, out - 0.02, w / 2, -dy + 0.04, out + 0.05, DARKW);
  for (const s of [-1, 1]) g.beam(W_, [s * (w / 2 - 0.08), 0.02, 0.02], [s * (w / 2 - 0.08), -dy, out], 0.025, DARKW);
  return g.make('gen_awn_' + (_gn++));
}
function genSign(glyph, tint) {
  const g = GP();
  g.box(W_, -0.035, -0.04, 0, 0.035, 0.04, 1.08, DARKW);                              // arm
  g.beam(W_, [0, -0.5, 0.02], [0, -0.04, 0.62], 0.025, DARKW);                        // brace
  g.box(W_, -0.03, -0.045, 1.03, 0.03, 0.2, 1.09, DARKW);                              // end finial
  for (const z of [0.52, 0.98]) g.beam(W_, [0, -0.04, z], [0, -0.26, z], 0.008, [0.25, 0.22, 0.2]);
  g.box(W_, -0.035, -0.82, 0.42, 0.035, -0.26, 1.08, [0.5, 0.42, 0.34]);                // the board
  const gl = GPU.glyph[glyph] || GPU.glyph.crest;
  for (const s of [-1, 1]) {
    const x = s * 0.0365, a = [x, -0.78, 0.46], b = [x, -0.78, 1.04], c = [x, -0.3, 1.04], d = [x, -0.3, 0.46];
    if (s > 0) g.quad(C_, b, a, d, c, tint, gl); else g.quad(C_, a, b, c, d, tint, gl);
  }
  return g.make('gen_sign_' + (_gn++));
}
function genFlowerBox(w, R) {
  const g = GP(); g.box(W_, -w / 2, -0.2, 0, w / 2, 0.02, 0.26, [0.7, 0.62, 0.55]);
  const cols = [[0.85, 0.25, 0.3], [0.95, 0.8, 0.3], [0.9, 0.9, 0.85], [0.6, 0.35, 0.7], [0.9, 0.5, 0.25]];
  for (let i = 0; i < Math.round(w * 3.5); i++) {
    const x = -w / 2 + 0.07 + (w - 0.14) * (i + R() * 0.6) / Math.round(w * 3.5), z = 0.06 + R() * 0.14, h = 0.12 + R() * 0.16;
    g.box(C_, x - 0.06, 0.02, z - 0.05, x + 0.06, 0.02 + h * 0.6, z + 0.05, [0.2, 0.32, 0.12], GPU.cloth);
    g.box(C_, x - 0.035, 0.02 + h * 0.5, z - 0.035, x + 0.035, 0.02 + h, z + 0.035, R.pick(cols), GPU.cloth);
  }
  return g.make('gen_fbox_' + (_gn++));
}
function genBundle(col, len) {         // a bunch of herbs / onions hung from a string: origin at the hook
  const g = GP(); len = len || 0.4;
  g.beam(W_, [0, 0, 0], [0, -0.1, 0], 0.006, [0.3, 0.25, 0.2]);
  g.quad(C_, [-0.06, -0.1, 0], [0.06, -0.1, 0], [0.11, -0.1 - len, 0.03], [-0.11, -0.1 - len, -0.03], col, GPU.cloth, true);
  g.quad(C_, [0, -0.1, -0.06], [0, -0.1, 0.06], [0.03, -0.1 - len, 0.1], [-0.03, -0.1 - len, -0.1], col.map(v => v * 0.85), GPU.cloth, true);
  return g.make('gen_bun_' + (_gn++));
}
function genBunting(a, b, R, cols, flags) {      // world-space rope with pennants, a sagging between the two points
  const g = GP(), n = flags || 9, sag = Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.05 + 0.1, pt = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const seg = 12; for (let i = 0; i < seg; i++) g.beam(W_, pt(i / seg), pt((i + 1) / seg), 0.012, [0.3, 0.25, 0.2]);
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, p = pt(t), hw = 0.17, c = cols[i % cols.length], q = pt(t - 0.05), r = pt(t + 0.05);
    g.quad(C_, [q[0], q[1] - 0.01, q[2]], [r[0], r[1] - 0.01, r[2]], [p[0] + ux * 0.02, p[1] - 0.4, p[2] + uz * 0.02], [p[0] + ux * 0.02, p[1] - 0.4, p[2] + uz * 0.02], c, GPU.cloth, true);
  }
  return g.make('gen_bunt_' + (_gn++));
}
function genProduce(cols, R) {            // a shallow crate heaped with fruit or vegetables (about 100 triangles)
  const g = GP(); g.box(W_, -0.3, 0, -0.2, 0.3, 0.1, 0.2, [0.6, 0.5, 0.4]);
  for (let i = 0; i < 9; i++) { const x = -0.22 + (i % 3) * 0.22 + R.s() * 0.03, z = -0.12 + Math.floor(i / 3) * 0.12, h = 0.12 + R() * 0.06, c = cols[i % cols.length]; g.box(C_, x - 0.07, 0.08, z - 0.06, x + 0.07, 0.08 + h, z + 0.06, c, GPU.cloth); }
  return g.make('gen_prod_' + (_gn++));
}
function genBracketLantern() {          // wall bracket + small lantern, split so only the glass glows
  const f = GP(), gl = GP();
  f.box(W_, -0.02, -0.02, 0, 0.02, 0.02, 0.42, [0.2, 0.19, 0.18]); f.beam(W_, [0, -0.3, 0.0], [0, -0.02, 0.34], 0.015, [0.2, 0.19, 0.18]);
  f.box(W_, -0.1, -0.2, 0.32, 0.1, -0.17, 0.52, [0.2, 0.19, 0.18]); f.box(W_, -0.12, -0.02, 0.3, 0.12, 0.02, 0.54, [0.2, 0.19, 0.18]);
  for (const sx of [-1, 1]) for (const sz of [0.32, 0.52]) f.box(W_, sx * 0.1 - 0.008, -0.2, sz - 0.008, sx * 0.1 + 0.008, 0.0, sz + 0.008, [0.2, 0.19, 0.18]);
  gl.box(C_, -0.085, -0.17, 0.335, 0.085, -0.01, 0.505, [1.0, 0.68, 0.3], GPU.cloth);
  return [f.make('gen_lanf_' + (_gn++)), gl.make('gen_lang_' + (_gn++))];
}
function genStripCloth(w, h, cols) {       // a hanging cloth / banner with vertical stripes: origin at top centre, facing +z
  const g = GP(), n = cols.length, sw = w / n;
  cols.forEach((c, i) => { g.quad(C_, [-w / 2 + i * sw, -h, 0], [-w / 2 + (i + 1) * sw, -h, 0], [-w / 2 + (i + 1) * sw, 0, 0], [-w / 2 + i * sw, 0, 0], c, GPU.cloth, true); });
  g.box(W_, -w / 2 - 0.04, 0, -0.02, w / 2 + 0.04, 0.05, 0.03, DARKW);
  return g.make('gen_cloth_' + (_gn++));
}

// ── the assembler ──
const AL = { shops: [], proxies: [], batch: null, lanterns: 0 };
function buildAlley() {
  if (!kitReady()) return;
  const R = rng(5150), B = Kit.batch({ name: 'alley', cell: 4096, off: 2048, far: true }), B2 = Kit.batch({ name: 'alley-dress', cell: 4096, off: 2048 }); AL.batch = B; AL.batch2 = B2; AL.shops = []; AL.proxies = [];
  const OUT = { zone: 0, skyVis: 1, cast: false }, V = KH.V, up = [0, 1, 0];
  AL.R = R;
  const shopOf = id => ALLEY_SHOPS.find(a => a.id === id);
  const rowShops = row => ALLEY_SHOPS.filter(a => a.row === row);
  const floorsOf = a => a.floors || 2;
  // storeys of the neighbour touching this shop's world-x edge (0 when there is none)
  const neighbourFloors = (a, east) => { const edge = east ? a.x0 + a.w + 0.15 : a.x0 - 0.15; for (const o of rowShops(a.row)) if (o !== a && edge > o.x0 && edge < o.x0 + o.w) return floorsOf(o); return 0; };
  const addP = (M, name, F, x, y, z, s, ry, o) => B.add(typeof infTimber === 'function' && a_.timber ? infTimber(name) : name, KH.xf(F, x, y, z, s, ry), o || OUT);
  let a_ = {};
  for (const a of ALLEY_SHOPS) {
    const site = SITE[a.id]; if (!a.layout) { AL.shops.push({ a, site, house: true }); continue; }
    a_ = a;
    const MS = new THREE.Matrix4().fromArray(siteMatrix(site, site.y + 0.02)), w = a.w, d = a.d, fl = a.floors, H = 3, tanP = Math.tan(a.pitch * PI / 180);
    const frames = (k) => { const o = {}, sh = k > 0 ? 0.5 : 0; for (const wn in WALLS) { const W = WALLS[wn], s0 = W.start(w, d); o[wn] = new THREE.Matrix4().makeBasis(V(W.u), V(up), V(W.n)).setPosition(s0[0], k * H, s0[2] - sh).premultiply(MS); } return o; };
    const F0 = frames(0);
    // ── storeys ──
    const stone = a.kind === 'cutler' || a.kind === 'tinker';
    for (let k = 0; k < fl; k++) {
      const F = frames(k);
      for (const wn of ['front', 'back', 'left', 'right']) {
        const W = WALLS[wn], L = W.len(w, d), n = Math.round(L / 2);
        if (wn === 'left' || wn === 'right') {            // side walls show only above a lower neighbour (or when nothing stands beside them)
          const east = site.yaw === PI ? wn === 'left' : wn === 'right', nb = neighbourFloors(a, east); if (k < nb) continue;
        }
        for (let i = 0; i < n; i++) {
          const uc = i * 2 + 1; let name = null, glass = false, shutter = null, door = false;
          if (wn === 'front') {
            const ch = (a.layout || 'WD')[Math.min(i, a.layout.length - 1)];
            if (k === 0) { if (ch === 'D') { name = 'Wall_Plaster_Door_Flat'; door = true; } else { name = stone ? 'Wall_UnevenBrick_Window_Wide_Flat' : 'Wall_Plaster_Window_Wide_Flat'; glass = true; shutter = 'WindowShutters_Wide_Flat_Open'; } }
            else if (a.balcony && k === 1 && i === (n >> 1)) { name = 'Wall_Plaster_Door_Flat'; door = true; }
            else if ((i + k) % 2 === 0) { name = 'Wall_Plaster_Window_Wide_Flat'; glass = true; shutter = R() < 0.5 ? 'WindowShutters_Wide_Flat_Open' : null; }
            else name = k === fl - 1 && i % 2 ? 'Wall_Plaster_Straight' : 'Wall_Plaster_Straight';
          } else if (wn === 'back') name = k === 0 ? (stone ? 'Wall_UnevenBrick_Straight' : 'Wall_Plaster_Straight_Base') : 'Wall_Plaster_Straight';
          else name = k === 0 ? (stone ? 'Wall_UnevenBrick_Straight' : 'Wall_Plaster_Straight_Base') : 'Wall_Plaster_Straight';
          if (k === 0 && !stone && wn === 'front' && !door && !glass) name = 'Wall_Plaster_Straight_Base';
          addP(MS, name, F[wn], uc, 0, 0, 1, 0);
          if (glass) { addP(MS, 'Window_Wide_Flat1', F[wn], uc, 0, 0, 1, 0); if (shutter && uc > 0.9 && uc < L - 0.9 && !(k === 0)) addP(MS, shutter, F[wn], uc, 0, 0, 1, 0); }
          if (door) { addP(MS, 'DoorFrame_Flat_WoodDark', F[wn], uc, 0, 0, 1, 0); if (!(k === 0 && HOUSES[a.id])) addP(MS, 'Door_1_Flat', F[wn], uc - 0.54, 0, -0.05, 1, 0); }      // [c5] an enterable shop's door leaf is the portal leaf of its cell (72k_houses.js)
        }
        addP(MS, 'Corner_Exterior_Wood', F[wn], 0, 0, 0, [1.25, 1, 1.25]);
      }
      if (k > 0) {      // the floor of the overhanging storey: a deep joist beam along the front, corbels under it, planks on top
        const jy = k * H;
        const g = GP(); g.box(W_, -w / 2, -0.3, -d / 2 - 0.62, w / 2, 0.02, -d / 2 + 0.1, [0.55, 0.48, 0.42]); g.box(W_, -w / 2 - 0.05, -0.34, -d / 2 - 0.58, w / 2 + 0.05, -0.28, -d / 2 - 0.3, [0.5, 0.43, 0.38]); const jn = g.make('gen_joist_' + (_gn++));
        B.add(jn, KH.xf(MS, 0, jy, 0, 1, 0), OUT);
        for (let i = 0; i < w / 2; i++) addP(MS, 'Roof_Support2', F0.front, i * 2 + 0.55, jy - 0.01, 0.03, [1, 1, 0.65]), addP(MS, 'Roof_Support2', F0.front, i * 2 + 1.45, jy - 0.01, 0.03, [1, 1, 0.65]);
      }
    }
    // ── roof: one scheme for the whole terrace: ridge parallel to the street (eaves to the street), each roof exactly as long as its own shop,
    //    no side overhang, so neighbours meet at party walls. The jetty of the upper storeys sits under the front eave. ──
    const Ytop = fl * H, hd = d / 2, rise = hd * tanP, zc = -0.5;
    // the generated shingle roof (73d_infill.js: slab thickness, soffits, ridge cap, one outward face per surface), the same on every house of the town
    infRoofGen(B, MS, { w, d, top: Ytop, tanP, ridgeX: true, zc, ov: 0.5, nl: neighbourFloors(a, site.yaw === PI) > 0, nr: neighbourFloors(a, site.yaw !== PI) > 0, tint: [0.97, 0.97, 0.97] });
    if (a.kind === 'books' || a.kind === 'grocer') {          // a chimney standing on the ridge
      const cx = (a.kind === 'books' ? -1 : 1) * w * 0.25, ct = infChimney(B, MS, { x: cx, z: zc, top: Ytop, tanP, hs: hd, ridgeX: true, zc });
      World.emitters.push({ type: 'smoke', p: new THREE.Vector3(cx, ct + 0.2, zc).applyMatrix4(MS).toArray(), zone: 0 });
    }
    // ── dressing on the front ──
    const Ff = F0.front, Fu = frames(1).front, nF = Math.round(w / 2);
    const cols1 = a.awn[0], cols2 = a.awn[1];
    // awning over the whole shop front, hanging signs, lanterns
    const awn = genAwning(w - 0.2, cols1, cols2, 0.5); addP(MS, awn, Ff, w / 2, 2.72, 0.12);
    const sg = genSign(a.glyph, [1.1, 0.85, 0.45]); addP(MS, sg, Fu, 1.0, 2.35, 0.1, 1, 0);           // projecting from a solid bay of the upper wall, over the street
    // flower boxes under the upper windows
    for (let k = 1; k < fl; k++) for (let i = 0; i < nF; i++) { if ((i + k) % 2 === 0 && !(a.balcony && k === 1 && i === (nF >> 1))) B2.add(genFlowerBox(1.3, R), KH.xf(frames(k).front, i * 2 + 1, 0.93, 0.26, 1, 0), OUT); }
    // balcony over the door
    if (a.balcony && fl > 1) {
      const Fb = frames(1).front, uc = (nF >> 1) * 2 + 1;
      const g = GP(); g.box(W_, -2.1, -0.14, 0.0, 2.1, 0.04, 1.1, [0.5, 0.43, 0.38]); const bn = g.make('gen_balc_' + (_gn++)); addP(MS, bn, Fb, uc, 0, 0.0);
      addP(MS, 'Balcony_Cross_Corner', Fb, uc + 1, 0, 0, 1, 0); addP(MS, 'Balcony_Cross_Corner', Fb, uc - 1, 0, 0, [-1, 1, 1]);
    }
    // wall lanterns beside the door
    const [lf, lg] = AL.lan || (AL.lan = genBracketLantern()), doorI = (a.layout || 'WD').indexOf('D');
    for (const du of [-1.0, 1.0]) { const uc = doorI * 2 + 1 + du; if (uc < 0.3 || uc > w - 0.3) continue; addP(MS, lf, Ff, uc, 2.15, 0.1); addP(MS, lg, Ff, uc, 2.15, 0.1, 1, 0, { zone: 0, skyVis: 1, cast: false, glow: 2.2 });
      const p = new THREE.Vector3(uc, 2.05, 0.42).applyMatrix4(Ff), q = [p.x, p.y, p.z]; World.emitters.push({ type: 'lantern', p: q, zone: 0 }); if (AL.lanterns++ % 2 === 0) addLight(q, 9.5, [3.4, 1.9, 0.75], 0, 'lantern'); break; }
    AL.shops.push({ a, site, MS, F0, w, d, H, fl, Ytop, rise, zc });
    // collision: the shop's footprint, with a little off the front so the doorstep is a stand-in for the sill
    World.colliders.push({ x: site.x, z: site.z, hx: w / 2, hz: d / 2, ax: 1, az: 0, bx: 0, bz: 1, y0: site.y - 1, y1: site.y + 14 });
    // shadow stand-in (prism)
    AL.proxies.push({ Ms: siteMatrix(site, site.y + 0.02), w, d, top: Ytop, rise, rx: true, zc });
  }
  alleyDress(B, B2, R);
}

// ── street dressing: wares on counters and doorsteps, stalls, barrels, crates, bunting across the street ──
function alleyDress(B, B2, R) {
  const OUT = { zone: 0, skyVis: 1, cast: false }, I = new THREE.Matrix4();
  // a piece standing with its bottom centre at (u, y, z) of frame F
  const put = (F, name, u, y, z, s, ry, o) => {
    const P = Kit.pieces[name]; if (!P) return null;
    const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s, cx = (P.min[0] + P.max[0]) / 2, cz = (P.min[2] + P.max[2]) / 2;
    const M = KH.xf(F, u, y, z, 1, ry || 0).multiply(new THREE.Matrix4().makeScale(sv[0], sv[1], sv[2])).multiply(new THREE.Matrix4().makeTranslation(-cx, -P.min[1], -cz));
    B2.add(name, M, Object.assign({}, OUT, o || {})); return M;
  };
  const solid = (x, z, r, h, y0) => World.colliders.push({ x, z, r, y0: y0 - 0.5, y1: y0 + (h || 1) });
  const wpos = (F, u, y, z) => { const v = new THREE.Vector3(u, y, z).applyMatrix4(F); return [v.x, v.y, v.z]; };
  const counterPiece = (() => { const g = GP(); g.box(W_, -0.9, 0.86, 0, 0.9, 0.93, 0.58, [0.55, 0.47, 0.4]); g.box(W_, -0.9, 0.0, 0.0, -0.84, 0.86, 0.5, DARKW); g.box(W_, 0.84, 0.0, 0.0, 0.9, 0.86, 0.5, DARKW); g.box(W_, -0.9, 0.5, 0.52, 0.9, 0.86, 0.58, [0.5, 0.42, 0.36]); return g.make('gen_counter'); })();
  const prods = { '@apple': genProduce([[0.7, 0.15, 0.12], [0.75, 0.6, 0.15]], R), '@carrot': genProduce([[0.85, 0.45, 0.12], [0.8, 0.55, 0.15]], R), '@cabbage': genProduce([[0.4, 0.55, 0.22], [0.5, 0.62, 0.3]], R) }, prod = n => prods[n];
  const goods = {
    apothecary: ['Potion_2', 'SmallBottles_1', 'Potion_4', 'Bottle_1', 'Potion_2', 'ceramic_pot', 'Potion_4'],
    baker: ['hamburger_buns_a', 'wooden_bowl_01', 'hamburger_buns_a', 'carved_wooden_plate', 'hamburger_buns_a', 'Mug'],
    books: ['BookGroup_Medium_1', 'Book_Stack_1', 'BookGroup_Medium_3', 'Scroll_1', 'Book_Stack_2'],
    grocer: ['@apple', '@carrot', 'wicker_basket_02', '@cabbage', 'yellow_onion'],
    cutler: ['Axe_Bronze', 'Bucket_Metal', 'Axe_Bronze'],
    tinker: ['Bucket_Metal', 'Pot_1', 'Bucket_Metal', 'Pot_1'],
  };
  const gscale = { Potion_2: 1.6, Potion_4: 1.6, Potion_1: 1.6, SmallBottles_1: 1.6, Bottle_1: 1.3, hamburger_buns_a: 2.2, wooden_bowl_01: 1.1, carved_wooden_plate: 1.1, Mug: 1.3, Scroll_1: 1.4, yellow_onion: 2.0, food_pears_asian_01: 2.0, ceramic_pot: 0.6, Sword_Bronze: 0.6, Axe_Bronze: 0.7, Shield_Wooden: 0.8, Whetstone: 0.35, wicker_basket_02: 1.5, Chain_Coil: 0.5, Rope_1: 0.8, Pot_1: 0.7, Bucket_Metal: 0.6, Book_Stack_1: 1.3, Book_Stack_2: 1.3, BookGroup_Medium_1: 0.9, BookGroup_Medium_3: 0.9 };
  const outside = {
    apothecary: [['Barrel', 0.9], ['Vase_2', 1.0]], baker: [['Barrel', 0.9], ['Bag', 0.9]],
    books: [['Barrel', 0.8], ['Bag', 0.7]], grocer: [['@apple', 1.0], ['Bag', 0.9], ['@carrot', 1.0]],
    cutler: [['Barrel', 0.9], ['Bucket_Metal', 1.0]], tinker: [['Bucket_Metal', 1.0], ['Barrel', 0.9]],
  };
  const hang = { apothecary: [[0.3, 0.45, 0.25], [0.55, 0.3, 0.6], [0.7, 0.6, 0.25]], baker: [[0.75, 0.55, 0.3]], books: [[0.5, 0.4, 0.3]], grocer: [[0.8, 0.6, 0.2], [0.55, 0.15, 0.12], [0.3, 0.5, 0.2]], cutler: [[0.45, 0.45, 0.48]], tinker: [[0.4, 0.4, 0.42]] };
  for (const sh of AL.shops) {
    if (sh.house) continue;
    const a = sh.a, F = sh.F0.front, w = sh.w, kind = a.kind, layout = a.layout, list = goods[kind] || goods.baker;
    // counters under the shop windows, the wares laid out on them
    let gi = 0;
    for (let i = 0; i < Math.round(w / 2); i++) {
      if ((layout || 'WD')[Math.min(i, layout.length - 1)] !== 'W') continue;
      const u = i * 2 + 1; put(F, counterPiece, u, 0, 0.42, 1, 0);
      for (let k = 0; k < 3; k++) { let n = list[gi++ % list.length]; const sc = gscale[n] || 1; if (n[0] === '@') n = prod(n); put(F, n, u - 0.55 + k * 0.55, 0.93, 0.74 + R.s() * 0.05, sc, R() * 6.28); }
    }
    // goods piled on the doorstep and against the wall
    const di = layout.indexOf('D'), du = di * 2 + 1, side = du > w / 2 ? -1 : 1, outs = outside[kind] || [];
    outs.forEach(([n, sc], k) => {
      const u = du + side * (1.25 + k * 0.62) * (k % 2 ? -1 : 1) * (k > 1 ? 1 : 1), uu = Math.max(0.4, Math.min(w - 0.4, u)), z = 0.55 + (k % 2) * 0.35, p = wpos(F, uu, 0, z);
      if (Math.abs(uu - du) < 1.0) return;          // Build 33: nothing on the doorstep line (the clamped one landed beside the door)
      if (n[0] === '@') n = prod(n); put(F, n, uu, 0, z, sc, R() * 6.28); if (/Barrel|Crate|Chest|Cauldron|Weapon/.test(n)) solid(p[0], p[2], 0.4 * sc, 0.9, p[1]);
    });
    // hanging goods along the awning rail
    const cols = hang[kind] || hang.baker, nb = Math.round(w * 1.6);
    for (let i = 0; i < nb; i++) { const u = 0.35 + (w - 0.7) * (i + 0.5) / nb; put(F, genBundle(cols[i % cols.length], 0.28), u, 2.18 + 0, 1.52, 1, 0); }
  }
  // ── the weaver-side stalls, the middle of the street stays clear ──
  const stalls = [[36.6, 5.1, '@carrot'], [40.8, 5.1, 'Pot_1']];
  stalls.forEach(([x0, z0, kind], k) => {
    const [x, z] = KEEP.slide(x0, z0, 1.3);          // Build 33: off any door approach
    const y = Terrain.y(x, z), F = KH.xf(I, x, y, z, 1, PI); put(F, 'Stall_Empty', 0, 0, 0, 1.15, 0);
    World.colliders.push({ x, z, hx: 1.1, hz: 0.55, ax: 1, az: 0, bx: 0, bz: 1, y0: y - 0.5, y1: y + 2.6 });
    for (let i = 0; i < 3; i++) put(F, kind[0] === '@' ? prod(kind) : kind, -0.6 + i * 0.6, 0.96, 0.0, kind === 'Pot_1' ? 0.7 : 1.0, i);
    World.spots['alley.stall' + k] = { p: [x, y, z - 1.35], yaw: PI, zone: 0 };
  });
  // crates and barrels on the corners, a wagon pulled in beside the south row
  const lump = (x, z, list) => { if (KEEP.hit(x, z, 1.2)) return; const y = Terrain.y(x, z), F = KH.xf(I, x, y, z, 1, 0); list.forEach(([n, dx, dz, s, ry], k) => { put(F, n, dx, 0, dz, s, ry); if (/Barrel|Crate/.test(n)) solid(x + dx, z + dz, 0.4 * s, 0.9, y); }); };
  lump(28.2, -3.9, [['Barrel', 0, 0, 0.9, 0], ['Barrel', 0.7, 0.2, 0.8, 1], ['Crate_Wooden', 0.3, 0.9, 0.8, 0.4]]);
  lump(35.2, 4.7, [['Crate_Wooden', 0, 0, 0.8, 0.2], ['Bag', 0.7, 0.1, 0.9, 1]]);
  lump(47.2, 5.2, [['Barrel', 0, 0, 1, 0], ['Bag', 0.8, 0.1, 0.9, 0.3], ['Bag', 1.4, -0.2, 0.8, 2]]);
  if (!KEEP.hit(45.6, 4.2, 1.6)) { const x = 45.6, z = 4.2, y = Terrain.y(x, z); put(KH.xf(I, x, y, z, 1, 0.5), 'Prop_Wagon', 0, 0, 0, 0.8, 0); World.colliders.push({ x, z, hx: 0.8, hz: 1.7, ax: Math.cos(0.5), az: Math.sin(0.5), bx: -Math.sin(0.5), bz: Math.cos(0.5), y0: y - 0.5, y1: y + 1.4 }); }
  // ── bunting across the street ──
  const shopAt = id => AL.shops.find(s => s.a.id === id);
  const pt = (id, wx, y) => { const s = shopAt(id); if (!s) return null; if (s.house) { const si = SITE[id], z = si.z + (si.yaw === PI ? 1 : -1) * (si.d / 2 + 0.12); return [wx, si.y + y, z]; } const sgn = s.site.yaw === PI ? -1 : 1; return wpos(s.MS, (wx - s.site.x) * sgn, y, -s.d / 2 - 0.55); };
  const flags = [[0.5, 0.27, 0.23], [0.64, 0.58, 0.44], [0.3, 0.36, 0.46], [0.58, 0.44, 0.24], [0.34, 0.4, 0.3]];      // Build 42: faded
  for (const [i1, x1, y1, i2, x2, y2] of [['shop.n3', 42.2, 5.2, 'shop.s2', 45.2, 5.4], ['shop.n4', 48.0, 6.4, 'shop.s2', 47.4, 5.0], ['draper', 31.6, 5.4, 'shop.s1', 30.8, 6.2], ['shop.n2', 38.0, 6.6, 'shop.s1', 33.0, 6.4]]) {
    const A_ = pt(i1, x1, y1), B_ = pt(i2, x2, y2); if (!A_ || !B_) continue;
    B.add(genBunting(A_, B_, R, flags, 12), I, OUT);
  }
  // ── places for villagers to stand ──
  World.spots['alley.n'] = { p: [38.2, Terrain.y(38.2, -2.2), -2.2], yaw: 0, zone: 0 }; World.spots['alley.s'] = { p: [30.8, Terrain.y(30.8, 3.6), 3.6], yaw: PI, zone: 0 };
}

// ── small generated wall dressing for the interiors (paintings, herb racks): the same kit wood and cloth, so no new textures ──
const KGEN = {};
function kitGen(kind, R) {
  const key = kind + (kind === 'paint' ? R.i(0, 11) : '');          // [fx1] twelve muted pictures, not the same sky-and-field in every house
  if (KGEN[key]) return KGEN[key];
  const g = GP();
  if (kind === 'paint') {
    const t = +key.slice(5), W = [0.8, 0.55, 0.62, 0.86, 0.6, 0.5, 0.7, 0.88, 0.62, 0.5, 0.9, 0.56][t], H = [0.5, 0.7, 0.55, 0.5, 0.5, 0.62, 0.5, 0.52, 0.5, 0.7, 0.5, 0.72][t], w = W, h = H;
    const frame = [[0.5, 0.42, 0.34], [0.3, 0.23, 0.17], [0.46, 0.38, 0.22], [0.26, 0.2, 0.15]][t % 4];
    g.box(W_, -w / 2 - 0.05, -h / 2 - 0.05, 0, w / 2 + 0.05, h / 2 + 0.05, 0.04, frame);
    g.box(W_, -w / 2 - 0.02, -h / 2 - 0.02, 0.0405, w / 2 + 0.02, -h / 2, 0.0415, frame.map(v => v * 0.7));
    let zq = 0; const z = 0.042, Q = (x0, y0, x1, y1, col) => { const zz = z + (zq++) * 0.0012; g.quad(C_, [x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz], col, GPU.cloth); };          // [c3] each layer of the picture a hair in front of the last: overlapping layers at one depth flickered
    const T3 = (a, b, c, col) => { const zz = z + (zq++) * 0.0012; g.tri(C_, [a[0], a[1], zz], [b[0], b[1], zz], [c[0], c[1], zz], col, GPU.cloth); };
    const disc = (cx, cy, rx, ry, col, n) => { n = n || 8; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, zz = z + (zq) * 0.0012; g.tri(C_, [cx, cy, zz], [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry, zz], [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry, zz], col, GPU.cloth); } zq++; };
    const L = h * 0.5;
    if (t === 0) { Q(-w / 2, 0, w / 2, L, [0.45, 0.52, 0.58]); Q(-w / 2, -L, w / 2, 0, [0.3, 0.36, 0.2]); Q(-w / 2, -L, w / 2, -h * 0.15, [0.2, 0.24, 0.14]); T3([-w * 0.4, 0.0], [w * 0.1, 0.0], [-w * 0.15, h * 0.28], [0.3, 0.32, 0.34]); }
    else if (t === 1) { Q(-w / 2, -L, w / 2, L, [0.12, 0.1, 0.08]); disc(0, h * 0.14, w * 0.17, h * 0.15, [0.55, 0.42, 0.34], 8); Q(-w * 0.3, -L, w * 0.3, -h * 0.05, [0.22, 0.17, 0.14]); Q(-w * 0.12, -h * 0.08, w * 0.12, 0, [0.5, 0.4, 0.32]); }
    else if (t === 2) { for (let i = 0; i < 5; i++) Q(-w / 2 + i * w / 5, -L, -w / 2 + (i + 1) * w / 5, L, [[0.42, 0.2, 0.16], [0.55, 0.45, 0.28], [0.25, 0.28, 0.34], [0.55, 0.45, 0.28], [0.42, 0.2, 0.16]][i]); Q(-w / 2, -L * 0.1, w / 2, L * 0.1, [0.3, 0.26, 0.2]); }
    else if (t === 3) { Q(-w / 2, 0.05 * h, w / 2, L, [0.55, 0.58, 0.58]); Q(-w / 2, -L, w / 2, 0.05 * h, [0.28, 0.36, 0.38]); T3([-w / 2, 0.05 * h], [-w * 0.15, 0.05 * h], [-w * 0.35, h * 0.3], [0.2, 0.24, 0.2]); T3([w * 0.05, 0.05 * h], [w / 2, 0.05 * h], [w * 0.32, h * 0.22], [0.24, 0.27, 0.22]); }
    else if (t === 4) { Q(-w / 2, -L, w / 2, L, [0.1, 0.08, 0.06]); Q(-w / 2, -L, w / 2, -h * 0.22, [0.34, 0.24, 0.15]); Q(-w * 0.12, -h * 0.22, w * 0.08, h * 0.05, [0.5, 0.34, 0.2]); Q(-w * 0.05, h * 0.05, w * 0.03, h * 0.16, [0.5, 0.34, 0.2]); disc(w * 0.22, -h * 0.14, w * 0.07, w * 0.07, [0.5, 0.18, 0.12], 6); }
    else if (t === 5) { Q(-w / 2, -L, w / 2, L, [0.3, 0.22, 0.12]); Q(-w * 0.38, -L * 0.8, w * 0.38, L * 0.3, [0.52, 0.18, 0.14]); T3([-w * 0.38, L * 0.3], [w * 0.38, L * 0.3], [0, -L * 0.95], [0.52, 0.18, 0.14]); Q(-w * 0.04, -L * 0.7, w * 0.04, L * 0.2, [0.64, 0.56, 0.34]); Q(-w * 0.2, -h * 0.05, w * 0.2, h * 0.03, [0.64, 0.56, 0.34]); }
    else if (t === 6) { Q(-w / 2, -L, w / 2, L, [0.08, 0.1, 0.16]); disc(w * 0.18, h * 0.16, w * 0.09, w * 0.09, [0.72, 0.7, 0.6], 8); Q(-w / 2, -L, w / 2, -h * 0.28, [0.05, 0.06, 0.07]); T3([-w / 2, -h * 0.28], [-w * 0.2, -h * 0.28], [-w * 0.35, 0.0], [0.05, 0.06, 0.07]); }
    else if (t === 7) { Q(-w / 2, -L, w / 2, L, [0.2, 0.28, 0.16]); for (let i = 0; i < 6; i++) Q(-w / 2 + i * w / 6 + 0.02, -L * 0.2, -w / 2 + i * w / 6 + 0.07, L, [0.1, 0.16, 0.09]); Q(-w / 2, -L, w / 2, -h * 0.2, [0.36, 0.34, 0.2]); Q(w * 0.05, -h * 0.2, w * 0.2, -h * 0.04, [0.55, 0.45, 0.3]); Q(w * 0.17, -h * 0.04, w * 0.22, h * 0.02, [0.55, 0.45, 0.3]); }
    else if (t === 8) { Q(-w / 2, -L, w / 2, L, [0.58, 0.5, 0.34]); for (const [x0, y0, x1, y1] of [[-0.35, -0.3, 0.3, -0.27], [-0.3, 0.0, 0.35, 0.03], [-0.2, 0.2, 0.1, 0.23], [-0.05, -0.35, -0.02, 0.35]]) Q(x0 * w, y0 * h, x1 * w, y1 * h, [0.3, 0.2, 0.12]); disc(w * 0.18, -h * 0.1, w * 0.05, w * 0.05, [0.42, 0.16, 0.12], 6); }
    else if (t === 9) { Q(-w / 2, -L, w / 2, L, [0.5, 0.38, 0.16]); disc(0, h * 0.2, w * 0.28, w * 0.28, [0.62, 0.5, 0.24], 10); disc(0, h * 0.2, w * 0.17, w * 0.17, [0.5, 0.4, 0.3], 8); T3([-w * 0.4, -L], [w * 0.4, -L], [0, h * 0.05], [0.22, 0.18, 0.22]); }
    else if (t === 10) { Q(-w / 2, 0.06 * h, w / 2, L, [0.55, 0.57, 0.52]); Q(-w / 2, -L, w / 2, 0.06 * h, [0.5, 0.42, 0.2]); for (let i = 0; i < 4; i++) T3([-w * 0.35 + i * w * 0.2, -h * 0.05], [-w * 0.27 + i * w * 0.2, -h * 0.05], [-w * 0.31 + i * w * 0.2, h * 0.08], [0.42, 0.33, 0.14]); }
    else { Q(-w / 2, 0.0, w / 2, L, [0.48, 0.52, 0.56]); Q(-w / 2, -L, w / 2, 0.0, [0.3, 0.32, 0.2]); T3([-w / 2, -h * 0.1], [w / 2, -h * 0.1], [w * 0.1, h * 0.12], [0.26, 0.28, 0.18]); Q(-w * 0.04, h * 0.02, w * 0.08, h * 0.3, [0.4, 0.36, 0.3]); T3([-w * 0.06, h * 0.3], [w * 0.1, h * 0.3], [w * 0.02, h * 0.42], [0.3, 0.2, 0.16]); }
  } else {       // a bar with bundles of herbs, onions and dried flowers
    g.box(W_, -0.55, -0.02, 0, 0.55, 0.03, 0.06, DARKW);
    const cols = [[0.3, 0.45, 0.22], [0.5, 0.38, 0.2], [0.55, 0.3, 0.45], [0.7, 0.62, 0.3], [0.3, 0.42, 0.2], [0.6, 0.45, 0.2]];
    for (let i = 0; i < 6; i++) { const x = -0.45 + i * 0.18, len = 0.28 + R() * 0.2, c = cols[i]; g.quad(C_, [x - 0.04, -0.02, 0.06], [x + 0.04, -0.02, 0.06], [x + 0.08, -0.02 - len, 0.08], [x - 0.08, -0.02 - len, 0.08], c, GPU.cloth, true); g.quad(C_, [x, -0.02, 0.02], [x, -0.02, 0.1], [x + 0.02, -0.02 - len, 0.14], [x - 0.02, -0.02 - len, 0.02], c.map(v => v * 0.8), GPU.cloth, true); }
  }
  return KGEN[key] = g.make('gen_' + key + '_' + (_gn++));
}
