// Budget: yard props, dressing and the alley are culled nearer on Medium (the town is dense; beyond ~24 m they are small and cost a draw call each)
QUALITY.low.houseFar = 18; QUALITY.low.yardRange = 24; QUALITY.medium.yardRange = 24; QUALITY.medium.houseFar = 22; QUALITY.medium.yardCast = false;
// ───────────────────────── infill houses: dark timber walls, grey shingle roofs, built from the village kit ─────────────────────────
// Sites come from 55b_infill.js. Six of them are enterable (HOUSES specs in 72c_infill.js, shell by kitShell); the rest are shells only, assembled here
// in the same way as the market alley (2 m wall panels scaled to the wall, kit window and door modules, jettied upper storeys, kit roof turned to a ridge
// that suits the street). All of it goes into ONE batch (one draw per material) which is hidden when the camera is far away or indoors and does not
// cast into the sun-shadow maps: one prism stand-in per house does that.
const ROOFS = [];       // every generated roof (for test/town.js: slope sample points against the neighbours' volumes)
const INFS = { batch: null, proxies: [], shells: [], lan: null, built: false, box: [1e9, 1e9, -1e9, -1e9], nChim: 0 };
const INF_T = 'MI_Plaster_Planks', INF_S = 'MI_Shingle_Roof';
function infBatch() {
  if (!INFS.batch && kitReady()) { const b = INFS.batch = Kit.batch({ name: 'infill', cell: 48, off: 2040, far: true }), add = b.add; b.add = (n, x, o) => { if (!Kit.far[n] && /^gen_/.test(n)) Kit.far[n] = []; return add(n, x, Object.assign({ cast: false }, o || {})); }; }       // one mesh per material per 48 m block; each block has a light copy (walls, roof, chimney) for beyond houseFar metres; small generated pieces have none       // nothing in the batch casts: one mesh per material, not two
  return INFS.batch;
}

// the two material variants: a plank cladding and a shingle roof (texture sets from tools/gen_timber_tex.py, 512 px)
async function infillMaterials() {
  if (typeof Kit === 'undefined' || !Kit.ready || !Kit.defs.MI_Plaster || !Kit.defs.MI_RoundTiles) return;
  const load = (url, kind) => new Promise(res => new THREE.TextureLoader().load(url, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = 4; t.colorSpace = kind === 'data' ? THREE.NoColorSpace : THREE.SRGBColorSpace; gfxTex(t, kind).then(res, () => res(t)); }, undefined, () => res(null)));
  const mk = async (name, base, set, over) => {
    const [a, n, o] = await Promise.all([load('kits/skin/' + set + '_a.webp', 'color'), load('kits/skin/' + set + '_n.webp', 'data'), load('kits/skin/' + set + '_orm.webp', 'data')]);
    if (!a) return false;
    Kit.defs[name] = Object.assign({}, Kit.defs[base], { name, map: a, normalMap: n || Kit.defs[base].normalMap, orm: o || Kit.defs[base].orm, aoInOrm: true, color: [1, 1, 1], uvScale: [1, 1], gain: 1, sat: 1 }, over || {});
    return true;
  };
  const ok1 = await mk(INF_T, 'MI_Plaster', 'MI_Planks', { gain: 1.0, nScale: 1.0, moss: 0, uvScale: [2.2, 2.2] });      // Build 42: grain was a metre wide on a 2 m panel
  const ok2 = await mk(INF_S, 'MI_RoundTiles', 'MI_Shingle', { gain: 1.2, nScale: 1.0, moss: 0.6 });
  if (Kit.defs.MI_UnevenBrick) Kit.defs[INF_B] = Object.assign({}, Kit.defs.MI_UnevenBrick, { name: INF_B, doubleSided: true });
  if (Kit.defs[INF_T]) Kit.defs[INF_T].doubleSided = true;
  INFS.mats = ok1 && ok2 && !!Kit.defs[INF_B];
}
// a copy of a kit piece with its plaster / tiles replaced by the plank / shingle variants
function infSwap(name, from, to, tag) {
  if (!INFS.mats) return name; const nn = tag + name, p = Kit.pieces[name]; if (!p) return name;
  if (!Kit.pieces[nn]) Kit.pieces[nn] = Object.assign({}, p, { name: nn, prims: p.prims.map(q => q.mat === from ? Object.assign({}, q, { mat: to }) : q) });
  return nn;
}
const infT = name => infSwap(name, 'MI_Plaster', INF_T, 'T_');
const infR = name => infSwap(name, 'MI_RoundTiles', INF_S, 'S_');
const infTimber = name => /^(Wall_Plaster|Roof_Front_Brick)/.test(name) ? infT(name) : name;

// ── generated walls ──
// Plank (or stone) cladding as flat quads with holes where the doors and windows are, then reveals, a pane, frames, sills and lintels for each opening, corner posts,
// bay posts and belt rails. About 700 triangles for a two-storey house, in 4 materials (the kit's 2 m panels with their window pieces cost 3-4 thousand).
// o: w d fl H stone tint jetty R lo; plan[k][wall] = [{ u0, u1, v0, v1, door, shutter }] (u along the wall as WALLS defines it, v above the storey's floor);
// skip[wall] = storeys of a neighbour against that side wall (those storeys get no wall); optsOf(k) = batch options for storey k
const INF_B = 'MI_Stone_DS';
function infWalls(B, MS, o) {
  const w = o.w, d = o.d, fl = o.fl, H = o.H || 3, sh = o.jetty ? 0.5 : 0, lo = !!o.lo, DK = [0.17, 0.14, 0.11], SC = [[0.3, 0.38, 0.28], [0.42, 0.2, 0.16], [0.22, 0.3, 0.4], [0.36, 0.31, 0.22]];
  const R = o.R || rng(3);
  for (let k = 0; k < fl; k++) {
    const g = GP(), yb = k === 0 ? -0.35 : k * H, yt = (k + 1) * H, off = k > 0 ? sh : 0, stone = k === 0 && o.stone, mat = stone ? INF_B : INF_T, ts = stone ? 2.2 : 1.25, col = stone ? [0.95, 0.95, 0.95] : (o.tint || [1, 1, 1]);
    for (const wn of ['front', 'back', 'left', 'right']) {
      const W = WALLS[wn], L = W.len(w, d), s0 = W.start(w, d);
      if ((wn === 'left' || wn === 'right') && k < ((o.skip && o.skip[wn]) || 0)) continue;
      const P = (u, y, dep) => [s0[0] + W.u[0] * u - W.n[0] * (dep || 0), y, s0[2] + W.u[2] * u - W.n[2] * (dep || 0) - off];       // dep: metres into the wall
      const nCell = Math.max(1, Math.round(L / 2)), cw = L / nCell, wOff = R() * 7, hs = 0.82 + R() * 0.4, wScale = ts * hs;       // Build 33: panels the width of a bay get their own texture offset and a little colour, and the foot of the wall is darker (weathering)
      const BAND = [[-1, 0.62], [0.35, 0.74], [0.75, 0.86], [1.15, 0.95], [1.9, 1.0]];
      const q = (m2, ua, ub, ya, yb, dep, c2, uv, both) => {
        if (ub - ua < 0.015 || yb - ya < 0.015) return;
        if (m2 === INF_T && !uv && dep === 0) {
          for (let ci = Math.max(0, Math.floor(ua / cw + 1e-6)); ci < nCell && ci * cw < ub - 1e-6; ci++) {
            const u0 = Math.max(ua, ci * cw), u1 = Math.min(ub, (ci + 1) * cw); if (u1 - u0 < 0.015) continue;
            const hh = ((ci * 7919 + wn.length * 31 + (k + 1) * 977 + Math.floor(wOff * 100)) % 101) / 101, ou = hh * 5.3 + wOff, ov = hh * 3.1, cm = 0.92 + 0.16 * ((hh * 13) % 1);
            const edges = [ya]; for (const [yy] of BAND) if (yy > ya + 0.02 && yy < yb - 0.02) edges.push(yy); edges.push(yb);
            for (let e = 0; e + 1 < edges.length; e++) {
              const y0 = edges[e], y1 = edges[e + 1], ym = (y0 + y1) / 2; let bk = 1; for (const [yy, kk] of BAND) if (ym >= yy) bk = kk;
              const cc = [c2[0] * bk * cm, c2[1] * bk * cm, c2[2] * bk * cm];
              g.quad(m2, P(u0, y0, dep), P(u1, y0, dep), P(u1, y1, dep), P(u0, y1, dep), cc, [u0 / wScale + ou, y0 / wScale + ov, u1 / wScale + ou, y1 / wScale + ov], both);
            }
          }
          return;
        }
        g.quad(m2, P(ua, ya, dep), P(ub, ya, dep), P(ub, yb, dep), P(ua, yb, dep), c2, uv || [ua / ts, ya / ts, ub / ts, yb / ts], both);
      };
      const bx = (ua, ub, ya, yb, d0, d1, c2) => { if (d1 >= 0) d1 += 0.012; /* c2: trim boards stand 1.2 cm proud of the wall's back too: their faces were coplanar with the cladding and flickered from inside a cell */ const a = P(ua, ya, d0), b = P(ub, yb, d1); g.box(W_, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), c2); };
      const ops = ((o.plan[k] && o.plan[k][wn]) || []).slice().sort((a, b2) => a.u0 - b2.u0), fy = k * H;
      let cur = 0;
      for (const p of ops) { q(mat, cur, p.u0, yb, yt, 0, col); q(mat, p.u0, p.u1, yb, fy + p.v0, 0, col); q(mat, p.u0, p.u1, fy + p.v1, yt, 0, col); cur = p.u1; }
      q(mat, cur, L, yb, yt, 0, col);
      for (const p of ops) {
        const y0 = fy + p.v0, y1 = fy + p.v1, dep = 0.18;
        for (const [ua, ub, ya, yb2] of [[p.u0, p.u0, y0, y1], [p.u1, p.u1, y0, y1]]) g.quad(mat, P(ua, ya, 0), P(ua, ya, dep), P(ub, yb2, dep), P(ub, yb2, 0), col, [0, 0, 0.2, 1], true);       // jambs
        g.quad(mat, P(p.u0, y1, 0), P(p.u1, y1, 0), P(p.u1, y1, dep), P(p.u0, y1, dep), col, [0, 0, 1, 0.2], true);
        if (!p.door) g.quad(mat, P(p.u0, y0, 0), P(p.u1, y0, 0), P(p.u1, y0, dep), P(p.u0, y0, dep), col, [0, 0, 1, 0.2], true);
        if (p.door) {
          // Build 33: a plank door of real boards (solid boxes: the old single quad faced the wrong way for the single-sided wood material and showed the dark inside), iron straps, a ring handle, a threshold
          { const nb = Math.max(4, Math.round((p.u1 - p.u0) / 0.2)), bw = (p.u1 - p.u0) / nb, dc = [[0.5, 0.37, 0.25], [0.44, 0.33, 0.22], [0.55, 0.41, 0.28], [0.47, 0.35, 0.24]], IR = [0.2, 0.19, 0.18];
            for (let i = 0; i < nb; i++) bx(p.u0 + i * bw + 0.005, p.u0 + (i + 1) * bw - 0.005, y0 + 0.02, y1 - 0.02, 0.08, 0.13, dc[(i * 7 + (R() * 4 | 0)) % 4]);
            if (!lo) { for (const yy of [0.42, 1.58]) { bx(p.u0 + 0.02, p.u1 - 0.02, y0 + yy, y0 + yy + 0.1, 0.045, 0.08, IR); bx(p.u0 + 0.02, p.u0 + 0.2, y0 + yy - 0.02, y0 + yy + 0.12, 0.03, 0.045, IR); }
              bx(p.u1 - 0.24, p.u1 - 0.17, y0 + 0.98, y0 + 1.12, 0.02, 0.045, IR); bx(p.u1 - 0.2, p.u1 - 0.1, y0 + 0.95, y0 + 0.98, 0.02, 0.045, IR);
              bx(p.u0 - 0.12, p.u1 + 0.12, y0, y0 + 0.07, 0.0, 0.2, [0.4, 0.38, 0.35]); }       // the sill
          }
          bx(p.u0 - 0.1, p.u0, y0, y1 + 0.1, -0.06, 0.0, [0.3, 0.23, 0.17]); bx(p.u1, p.u1 + 0.1, y0, y1 + 0.1, -0.06, 0.0, [0.3, 0.23, 0.17]); bx(p.u0 - 0.1, p.u1 + 0.1, y1, y1 + 0.12, -0.08, 0.0, [0.3, 0.23, 0.17]);
          if (k === 0) bx(p.u0 - 0.15, p.u1 + 0.15, -0.35, 0.1, -0.35, 0.0, [0.5, 0.48, 0.45]);          // a stone step
        } else if (lo) {
          g.quad('MI_WindowGlass', P(p.u0, y0, 0.05), P(p.u1, y0, 0.05), P(p.u1, y1, 0.05), P(p.u0, y1, 0.05), [1, 1, 1], [0, 0, 1, 1], false);
        } else {
          g.quad('MI_WindowGlass', P(p.u0, y0, 0.16), P(p.u1, y0, 0.16), P(p.u1, y1, 0.16), P(p.u0, y1, 0.16), [1, 1, 1], [0, 0, 1, 1], false);
          const uc = (p.u0 + p.u1) / 2; q(W_, uc - 0.02, uc + 0.02, y0, y1, 0.1, DK, GPU.wood, true); q(W_, p.u0, p.u1, (y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02, 0.1, DK, GPU.wood, true);
          bx(p.u0 - 0.07, p.u0, y0 - 0.05, y1 + 0.05, -0.04, 0.0, DK); bx(p.u1, p.u1 + 0.07, y0 - 0.05, y1 + 0.05, -0.04, 0.0, DK);
          bx(p.u0 - 0.1, p.u1 + 0.1, y0 - 0.08, y0 + 0.02, -0.11, 0.0, [0.28, 0.24, 0.21]); bx(p.u0 - 0.08, p.u1 + 0.08, y1, y1 + 0.1, -0.06, 0.0, DK);
          if (p.shutter) { const sc = SC[(R() * SC.length) | 0]; bx(p.u0 - 0.56, p.u0 - 0.07, y0, y1, -0.05, -0.01, sc); bx(p.u1 + 0.07, p.u1 + 0.56, y0, y1, -0.05, -0.01, sc); }
        }
      }
      if (!lo) {
        if (wn === 'front' || wn === 'back') { const n = Math.max(1, Math.round(L / 2)); for (let i = 1; i < n; i++) { const u = i * L / n; if (!ops.some(p => u > p.u0 - 0.15 && u < p.u1 + 0.15)) bx(u - 0.07, u + 0.07, yb, yt, -0.05, 0.0, DK); } }
        if (k < fl - 1) bx(0, L, yt - 0.07, yt + 0.07, -0.06, 0.0, DK);
        if (k === 0 && !stone) bx(0, L, -0.35, 0.12, -0.04, 0.0, [0.3, 0.28, 0.26]);                // a stone plinth under the planks
      }
    }
    // corner posts
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(W_, sx * w / 2 - 0.09 - (sx > 0 ? 0.0 : 0.0), yb, sz * d / 2 - off - 0.09, sx * w / 2 + 0.09, yt, sz * d / 2 - off + 0.09, DK);
    { const nm = g.make('gen_walls_' + (_gn++)), gf = GP();           // the far copy: four plain wall faces
      for (const wn of ['front', 'back', 'left', 'right']) {
        if ((wn === 'left' || wn === 'right') && k < ((o.skip && o.skip[wn]) || 0)) continue;
        const W = WALLS[wn], L = W.len(w, d), s0 = W.start(w, d), Q = (u, y) => [s0[0] + W.u[0] * u, y, s0[2] + W.u[2] * u - off];
        gf.quad(mat, Q(0, yb), Q(L, yb), Q(L, yt), Q(0, yt), col, [0, 0, L / ts, (yt - yb) / ts], W.n);
      }
      const fn = gf.make('gen_wallsF_' + (_gn++)); Kit.far[nm] = Kit.pieces[fn].prims; delete Kit.pieces[fn];
      B.add(nm, MS, o.optsOf ? o.optsOf(k) : { zone: 0, skyVis: 1, cast: false }); }
  }
}
// A generated shingle roof, one outward face per surface (every kit material draws both sides itself: two faces on one plane fight for depth).
// Two pieces: the slopes and plank gables (they take the room's zone on their underside), and the slab's thickness at the eaves and rakes, the soffits under the overhang and the ridge cap
// (outdoors on every face). o: w d (footprint), top (wall top y), tanP, ridgeX (ridge along the width), zc (roof centre offset along z), ov (eaves), gov (rake overhang at an exposed gable),
// nl / nr: a neighbour stands against that gable end (rake overhang 4 cm, so the roof never reaches into the next house), tint, thick (slab thickness)
function infRoofGen(B, MS, o) {
  const g = GP(), g2 = GP(), gf = GP(), w = o.w, d = o.d, tanP = o.tanP, ridgeX = o.ridgeX !== false, len = ridgeX ? w : d, span = ridgeX ? d : w, ov = o.ov === undefined ? 0.5 : o.ov, zc = o.zc || 0, top = o.top, T = o.thick || 0.1;
  const lift = o.lift || 0, gov = o.gov === undefined ? 0.2 : o.gov, hs = span / 2, yR = top + lift + hs * tanP, yE = top + lift - ov * tanP, a0 = -len / 2 - (o.nl ? 0.04 : gov), a1 = len / 2 + (o.nr ? 0.04 : gov), ve = hs + ov;
  const P = (u, v, y) => ridgeX ? [u, y, zc + v] : [v, y, zc + u];
  const col = o.tint || [1, 1, 1], slopeLen = hypot2(ve, yR - yE), dark = col.map(v => v * 0.7), wood = [0.24, 0.2, 0.17];
  const OUTV = (u, v, y) => ridgeX ? [u, y, v] : [v, y, u];            // a direction in the roof's own frame -> the house frame
  const planes = G => {
    for (const s of [-1, 1]) {
      const A = P(a0, s * ve, yE), Bp = P(a1, s * ve, yE), C = P(a1, 0, yR), D = P(a0, 0, yR), up = [0, 1, 0];
      G.quad(INF_S, A, Bp, C, D, col, [0, 0, (a1 - a0) / 1.25, slopeLen / 1.25], up);
    }
    for (const [u, sg] of [[-len / 2, -1], [len / 2, 1]]) {
      const uo = u + sg * 0.015;          // Build 33: the gable plane stands 1.5 cm proud of the wall below (their top beams were coplanar)
      const A = P(uo, -hs, top), Bp = P(uo, hs, top), C = P(uo, 0, yR - T * 0.5);
      G.tri(INF_T, A, Bp, C, col, [0, 0, span / 1.6, (yR - top) / 1.6], OUTV(sg, 0, 0));
    }
  };
  planes(g); planes(gf);
  // thickness: the shingle edge at each eave and rake, a soffit under the overhang, a ridge cap
  for (const s of [-1, 1]) {
    { const A = P(a0, s * ve, yE), Bp = P(a1, s * ve, yE), A2 = P(a0, s * ve, yE - T), B2 = P(a1, s * ve, yE - T); g2.quad(INF_S, A, Bp, B2, A2, dark, [0, 0, (a1 - a0) / 1.25, 0.1], OUTV(0, s, -0.4)); }
    for (const [u, sg, nb] of [[a0, -1, o.nl], [a1, 1, o.nr]]) {
      const A = P(u, 0, yR), Bp = P(u, s * ve, yE), B2 = P(u, s * ve, yE - T), A2 = P(u, 0, yR - T);
      g2.quad(INF_S, A, Bp, B2, A2, dark, [0, 0, slopeLen / 1.25, 0.1], OUTV(sg, 0, 0));
    }
    // soffit under the eave: from the wall line out to the tip
    { const A = P(a0, s * hs, top + lift - T), Bp = P(a1, s * hs, top + lift - T), C = P(a1, s * ve, yE - T), D = P(a0, s * ve, yE - T); g2.quad(W_, A, Bp, C, D, wood, GPU.wood, [0, -1, 0]); }
    // soffit under the rake overhang
    for (const [u, un, ex] of [[-len / 2, a0, !o.nl], [len / 2, a1, !o.nr]]) if (ex) { const A = P(u, 0, yR - T), Bp = P(un, 0, yR - T), C = P(un, s * ve, yE - T), D = P(u, s * hs, top + lift - T); g2.quad(W_, A, Bp, C, D, wood, GPU.wood, [0, -1, 0]); }
  }
  { const A = P(a0, 0, yR + 0.05), Bp = P(a1, 0, yR + 0.05); g2.beam(W_, A, Bp, 0.13, [0.26, 0.22, 0.19]); }
  ROOFS.push({ M: Array.from(MS.elements || MS), w, d, top, tanP, ridgeX, zc, ov, lift, T, a0, a1, hs, ve, yR, yE });
  const name = g.make('gen_roof_' + (_gn++)), name2 = g2.make('gen_roofe_' + (_gn++)), fn = gf.make('gen_roofF_' + (_gn++));
  Kit.far[name] = Kit.pieces[fn].prims; delete Kit.pieces[fn]; Kit.far[name2] = [];
  B.add(name, MS, { zone: 0, skyVis: 1, cast: false, inZone: o.inZone || 0, inSkyVis: o.inSky === undefined ? 0.2 : o.inSky });
  B.add(name2, MS, { zone: 0, skyVis: 1, cast: false });
}
// a chimney stack that rises out of the roof: it starts below the slope (so no gap shows from any side), a lead flashing collar sits on the slope and a capped flue ends it.
// o: x z (house frame), top, tanP, hs (half span), ridgeX, zc. Returns the height of the flue.
function infChimney(B, MS, o) {
  const g = GP(), gf = GP(), ridgeX = o.ridgeX !== false, v = ridgeX ? o.z - (o.zc || 0) : o.x, yS = o.top + (o.lift || 0) + (o.hs - Math.abs(v)) * o.tanP, yR = o.top + (o.lift || 0) + o.hs * o.tanP, yT = Math.max(yR + 0.95, yS + 1.5), sw = o.size || 0.46;
  const st = [0.5, 0.47, 0.43], lead = [0.3, 0.3, 0.32], cap = [0.4, 0.38, 0.35], x = o.x, z = o.z, y0 = yS - 0.35 - sw * o.tanP * 1.1;
  const uvS = [0, 0, 0.5, 1.2];
  const stack = G => { G.box(INF_B, x - sw, y0, z - sw, x + sw, yT, z + sw, st, uvS); };
  stack(g); stack(gf);
  g.box(INF_B, x - sw - 0.1, yS - 0.03 - sw * o.tanP, z - sw - 0.1, x + sw + 0.1, yS + 0.1 + sw * o.tanP, z + sw + 0.1, lead, [0, 0, 0.3, 0.3]);      // flashing collar
  g.box(INF_B, x - sw - 0.08, yT, z - sw - 0.08, x + sw + 0.08, yT + 0.1, z + sw + 0.08, cap, [0, 0, 0.3, 0.3]);
  g.quad(W_, [x - sw * 0.55, yT + 0.101, z + sw * 0.55], [x + sw * 0.55, yT + 0.101, z + sw * 0.55], [x + sw * 0.55, yT + 0.101, z - sw * 0.55], [x - sw * 0.55, yT + 0.101, z - sw * 0.55], [0.03, 0.03, 0.03], GPU.wood, [0, 1, 0]);
  const name = g.make('gen_chim_' + (_gn++)), fn = gf.make('gen_chimF_' + (_gn++)); Kit.far[name] = Kit.pieces[fn].prims; delete Kit.pieces[fn];
  B.add(name, MS, { zone: 0, skyVis: 1, cast: false });
  return yT + 0.1;
}
const hypot2 = Math.hypot;

// a plain plank door with two iron straps (about 40 triangles) instead of the kit's 300-triangle door
function infDoor() {
  if (INFS.door) return INFS.door; const g = GP(), c = [0.3, 0.22, 0.16], f = [0.14, 0.13, 0.12];
  g.box(W_, -0.46, 0, -0.07, 0.46, 2.04, 0.0, c); g.box(W_, -0.46, 0.45, 0.0, 0.46, 0.55, 0.02, f); g.box(W_, -0.46, 1.5, 0.0, 0.46, 1.6, 0.02, f); g.box(W_, 0.3, 1.0, 0.0, 0.36, 1.12, 0.04, f);
  return INFS.door = g.make('gen_door_' + (_gn++));
}
// storeys of whatever stands against a house's side (0: nothing)
function infNeighbour(h, east) {
  const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), lx = (east ? 1 : -1) * (h.w / 2 + 0.3), x = h.x + lx * c, z = h.z + lx * sn;
  for (const o of INF.houses) { if (o === h) continue; const l = worldToSite(o, x, z); if (Math.abs(l[0]) < o.w / 2 && Math.abs(l[1]) < o.d / 2) return o.floors; }
  for (const s of SITES) { if (s.infill || !s.w) continue; const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + 0.1 && Math.abs(l[1]) < s.d / 2 + 0.1) return 2; }
  return 0;
}

// ── districts (Build 42): five quarters a player can tell apart at a glance. Per-district parameters only (colour, storeys, pitch, ground floor, jetty, roof tone), so the batch count stays flat. ──
const INF_DISTRICTS = {
  merchants: { name: 'Merchants’ Row',   tint: [0.93, 0.9, 0.84],  roof: [0.4, 0.43, 0.5], fl: [2, 3], pitch: [32, 36], stone: true,  jetty: false },
  fishers:   { name: 'The Net Lofts',    tint: [0.4, 0.38, 0.37],  roof: [0.3, 0.28, 0.26],  fl: [1, 1], pitch: [26, 30], stone: false, jetty: false },
  cottages:  { name: 'The Thatches',     tint: [1, 0.96, 0.86],    roof: [0.86, 0.68, 0.36],   fl: [1, 1], pitch: [50, 56], stone: false, jetty: false, alt: [[0.98, 0.86, 0.64], [0.95, 0.93, 0.88]] },
  dyers:     { name: 'The Dyers’ Bank',  tint: [0.66, 0.62, 0.64], roof: [0.66, 0.5, 0.4],   fl: [1, 2], pitch: [36, 42], stone: false, jetty: false, alt: [[0.56, 0.6, 0.7], [0.72, 0.54, 0.48]] },
  poor:      { name: 'The Warren',       tint: [0.56, 0.5, 0.45],  roof: [0.5, 0.46, 0.42], fl: [2, 3], pitch: [50, 58], stone: false, jetty: true,  patch: true },
};
function infDistrictOf(h) {
  const dsq = Math.hypot(h.x - SQUARE.x, h.z - SQUARE.z);
  if (h.block === 'north-west') return 'poor';
  if (h.z > 42 && h.x > -34 && h.x < 38) return 'fishers';
  if (h.block === 'east-bank' || (h.x > 33 && h.z > 12 && h.z < 46)) return 'dyers';
  if (h.block === 'west' || h.x < -44 || dsq > 62) return 'cottages';
  if (dsq < 34) return 'merchants';
  return null;
}
function infDistricts() {
  const by = {}, R = rng(8800);
  for (const h of INF.houses) { const k = infDistrictOf(h); if (!k) continue; h.dist = k; (by[k] = by[k] || []).push(h); }
  for (const k in by) {
    const D = INF_DISTRICTS[k], hs = by[k].filter(h => !h.enter).sort((a, b) => b.w * b.d - a.w * a.d), land = new Set(hs.slice(0, 2));
    for (const h of hs) {
      h.fl0 = h.floors; h.floors = D.fl[0] + (R() * (D.fl[1] - D.fl[0] + 1) | 0); if (h.floors === 3 && h.w < 5.6) h.floors = 2;
      h.pitch = D.pitch[0] + (R() * (D.pitch[1] - D.pitch[0] + 1) | 0); h.stone = D.stone; h.jetty = D.jetty || (k === 'dyers' && R() < 0.3);
      if (land.has(h)) { h.landmark = true; h.floors = Math.min(k === 'merchants' ? 4 : 3, h.floors + 1); if (k === 'cottages' || k === 'fishers') h.floors = Math.min(2, h.floors); }
    }
    if (by[k].length) { const c = by[k].reduce((a, h) => [a[0] + h.x / by[k].length, a[1] + h.z / by[k].length], [0, 0]); World.places.push({ id: 'dist.' + k, name: D.name, x: c[0], z: c[1], r: 14, minor: true }); }
  }
  INFS.districts = Object.fromEntries(Object.entries(by).map(([k, a]) => [k, a.length]));
}

function buildInfill() {
  if (!kitReady() || !INF.houses.length || (TEST && TEST.infill === 0)) return;
  infBatch();
  infDistricts();
  for (const h of INF.houses) {
    const site = SITE[h.id]; if (!site) continue;
    const c = Math.cos(h.yaw), sn = Math.sin(h.yaw);
    INFS.box[0] = Math.min(INFS.box[0], h.x - 12); INFS.box[1] = Math.min(INFS.box[1], h.z - 12); INFS.box[2] = Math.max(INFS.box[2], h.x + 12); INFS.box[3] = Math.max(INFS.box[3], h.z + 12);
    if (h.enter) continue;                      // enterable houses: buildHouse + kitShell (same batch)
    World.colliders.push({ x: site.x, z: site.z, hx: h.w / 2, hz: h.d / 2, ax: c, az: sn, bx: -sn, bz: c, y0: site.y - 1, y1: site.y + 14 });
    INFS.shells.push(h);
  }
}

// one shell. lo: the simple version for low quality (plain walls and roof)
function infShell(B, h, lo) {
  const site = SITE[h.id], R = rng(h.x * 37 + h.z * 11 + 5), V = KH.V, up = [0, 1, 0], w = h.w, d = h.d, fl = h.floors, H = 3, tanP = Math.tan(h.pitch * PI / 180);
  const OUT = { zone: 0, skyVis: 1, cast: false }, EXT = OUT, MS = new THREE.Matrix4().fromArray(siteMatrix(site, site.y + 0.02));
  const tn = 0.8 + R() * 0.28, DD = h.dist ? INF_DISTRICTS[h.dist] : null, dbase = DD ? (DD.alt && R() < 0.5 ? DD.alt[(R() * DD.alt.length) | 0] : DD.tint) : null, dv = 0.92 + R() * 0.14;
  const tint = DD ? [dbase[0] * dv, dbase[1] * dv, dbase[2] * dv * (0.97 + R() * 0.06)].map(v => Math.min(1, v)) : [tn, tn * (0.96 + R() * 0.08), tn * (0.92 + R() * 0.1)];
  const jetty = !lo && fl >= 2 && h.jetty, sh = jetty ? 0.5 : 0;
  const frames = k => { const o = {}, s2 = k > 0 ? sh : 0; for (const wn in WALLS) { const W = WALLS[wn], s0 = W.start(w, d); o[wn] = new THREE.Matrix4().makeBasis(V(W.u), V(up), V(W.n)).setPosition(s0[0], k * H, s0[2] - s2).premultiply(MS); } return o; };
  const add = (name, F, x, y, z, s, ry, o) => { s = s === undefined ? 1 : s; o = o || OUT; if (Array.isArray(s) && (Math.abs(s[0] - 1) > 0.02 || Math.abs(s[1] - 1) > 0.02)) o = Object.assign({}, o, { uvs: [Math.abs(s[0]), s[1]] }); B.add(name, KH.xf(F, x, y, z, s, ry || 0), o); };
  const wallT = Object.assign({}, OUT, { tint });
  const stone = h.stone;
  const nbW = !lo || true ? infNeighbour(h, false) : 0, nbE = infNeighbour(h, true), gableFront = h.gable;
  const doorBay = h.doorBay === undefined ? ((Math.round(w / 2) >> 1) + (h.doorSide || 0)) : h.doorBay;
  // ── storeys: a plan of doors and windows, then the generated walls ──
  const plan = [], nF = Math.max(1, Math.round(w / 2)), mF = w / nF;
  for (let k = 0; k < fl; k++) {
    const pl = plan[k] = { front: [], back: [], left: [], right: [] }, win = (c, hwid) => ({ u0: c - hwid, u1: c + hwid, v0: 0.95, v1: 2.1, shutter: R() < 0.3 });
    for (let i = 0; i < nF; i++) {
      const c = (i + 0.5) * mF;
      if (k === 0) { if (i === Math.min(doorBay, nF - 1)) pl.front.push({ u0: c - 0.52, u1: c + 0.52, v0: 0, v1: 2.12, door: true }); else if (!lo && (nF < 3 || i % 2 === 0 || R() < 0.4)) pl.front.push(win(c, 0.5)); }
      else if (h.stairs && k === 1 && i === (h.stairs > 0 ? nF - 1 : 0)) pl.front.push({ u0: c - 0.52, u1: c + 0.52, v0: 0, v1: 2.12, door: true });
      else if (!lo && (i + k) % 2 === (h.par || 0)) pl.front.push(win(c, 0.5));
      if (!lo && k > 0 && i % 2 === 1 && R() < 0.35) pl.back.push(win(c, 0.5));
      if (!lo && k === 0 && R() < 0.2) pl.back.push(win(c, 0.5));
    }
    if (!lo) for (const wn of ['left', 'right']) if (R() < 0.3) pl[wn].push(win(d / 2, 0.45));
  }
  infWalls(B, MS, { w, d, fl, H, stone, tint, jetty, R, lo, plan, skip: { left: nbW, right: nbE } });
  const F0 = frames(0);
  if (jetty) for (let k = 1; k < fl; k++) {       // the overhanging storey rests on a deep joist beam along the front, with brackets under it
    const g = GP(); g.box(W_, -w / 2, -0.3, -d / 2 - 0.62, w / 2, 0.02, -d / 2 + 0.1, [0.42, 0.37, 0.33]); g.box(W_, -w / 2 - 0.05, -0.34, -d / 2 - 0.58, w / 2 + 0.05, -0.28, -d / 2 - 0.3, [0.36, 0.32, 0.29]);
    for (let i = 0; i < nF; i++) { const x = -w / 2 + (i + 0.5) * mF; g.beam(W_, [x, -0.7, -d / 2 - 0.5], [x, -0.3, -d / 2 + 0.02], 0.1, [0.34, 0.3, 0.27]); }
    B.add(g.make('gen_joist_' + (_gn++)), KH.xf(MS, 0, k * H, 0, 1, 0), OUT);
  }
  // ── roof: generated shingles; ridge parallel to the street (eaves to the street) or gable to the street ──
  const Ytop = fl * H, rx = !gableFront, zc = -sh, rise = (rx ? d : w) / 2 * tanP;
  infRoofGen(B, MS, { w, d, top: Ytop, tanP, ridgeX: rx, zc, ov: 0.5, nl: rx && nbW > 0, nr: rx && nbE > 0, tint: DD ? DD.roof.map(v => Math.min(1, v * (DD.patch ? 0.8 + R() * 0.3 : 0.94 + R() * 0.1))) : [0.95 + R() * 0.1, 0.95 + R() * 0.1, 0.95 + R() * 0.1] });
  if (!lo) {
    if (h.chimney) {          // a chimney that rises through the roof (stack, flashing, cap)
      const cx = rx ? (h.chimney > 0 ? 1 : -1) * w * 0.28 : 0, cz = rx ? zc : d * 0.2 * (h.chimney > 0 ? 1 : -1) + zc * 0, top = infChimney(B, MS, { x: cx, z: cz, top: Ytop, tanP, hs: (rx ? d : w) / 2, ridgeX: rx, zc: rx ? zc : 0 });
      if (INFS.nChim++ % 3 === 0) World.emitters.push({ type: 'smoke', p: new THREE.Vector3(cx, top + 0.2, cz).applyMatrix4(MS).toArray(), zone: 0, thin: true });
    }
    // front: flower boxes under upper windows, a lantern by the door, a sheltering gallery with an outside stair on some
    const Ff = F0.front, nF = Math.max(1, Math.round(w / 2)), mF = w / nF;
    if (fl > 1 && h.boxes) for (let i = 0; i < nF; i++) if ((i + 1) % 2 === (h.par || 0)) B.add(R.pick(INFS.fb || (INFS.fb = [0, 1, 2].map(q => genFlowerBox(1.25, rng(90 + q))))), KH.xf(frames(1).front, (i + 0.5) * mF, 0.93, 0.26, 1, 0), OUT);
    const [lf, lg] = INFS.lan || (INFS.lan = AL.lan || (AL.lan = genBracketLantern())), du = (Math.min(doorBay, nF - 1) + 0.5) * mF + (doorBay >= nF / 2 ? -1.0 : 1.0);
    if (du > 0.3 && du < w - 0.3) { B.add(lf, KH.xf(Ff, du, 2.15, 0.1, 1, 0), OUT); B.add(lg, KH.xf(Ff, du, 2.15, 0.1, 1, 0), { zone: 0, skyVis: 1, cast: false, glow: 1.1 }); }
    if (h.stairs && fl >= 2) {
      const sg = h.stairs, g = GP(), col = [0.34, 0.29, 0.25], zf = -d / 2, x0 = -w / 2 + 0.1, x1 = w / 2 - 0.1, dep = 1.0;
      g.box(W_, x0, H - 0.14, zf - dep, x1, H - 0.02, zf, col);                                       // gallery floor
      for (let i = 0; i <= Math.round((x1 - x0) / 1.1); i++) { const x = x0 + i * (x1 - x0) / Math.round((x1 - x0) / 1.1); g.box(W_, x - 0.04, H, zf - dep, x + 0.04, H + 0.95, zf - dep + 0.08, col); }
      g.box(W_, x0, H + 0.92, zf - dep - 0.02, x1, H + 1.0, zf - dep + 0.1, col);
      // the stair: climbs along the gallery's front edge, from the far end toward the door
      const n = 12, run = 3.6, sa = sg > 0 ? x1 : x0, sd = sg > 0 ? -1 : 1;   // sg > 0: the door is at the west end (local x -), the stair starts at the east end and climbs west
      for (let s = 0; s < n; s++) { const xa = sa + sd * s * run / n, xb = sa + sd * (s + 1) * run / n; g.box(W_, Math.min(xa, xb), (s + 1) * H / n - 0.09, zf - dep - 0.95, Math.max(xa, xb), (s + 1) * H / n, zf - dep, [0.4, 0.34, 0.29]); }
      g.beam(W_, [sa, 0.1, zf - dep - 0.98], [sa + sd * run, H - 0.05, zf - dep - 0.98], 0.05, col);
      g.beam(W_, [sa, 1.05, zf - dep - 0.98], [sa + sd * run, H + 1.0, zf - dep - 0.98], 0.04, col);
      B.add(g.make('gen_stair_' + (_gn++)), KH.xf(MS, 0, 0, 0, 1, 0), OUT);
      const q = siteToWorld(site, sa + sd * run / 2, zf - dep - 0.5), c = Math.cos(site.yaw), sn = Math.sin(site.yaw);
      World.colliders.push({ x: q[0], z: q[1], hx: run / 2 + 0.1, hz: 0.55, ax: c, az: sn, bx: -sn, bz: c, y0: site.y - 1, y1: site.y + 2.6 });
    }
  }
  const ok = { Ms: siteMatrix(site, site.y + 0.02), w, d, top: Ytop, rise, rx, zc, sh };
  INFS.proxies.push(ok);
}

// scene: build the shells for the quality tier, then the batch (enterable houses added theirs through kitShell), a shadow stand-in per house
function infillAttach() {
  if (!INFS.batch || !SC.scene || INFS.built) return; INFS.built = true;
  const B = INFS.batch, lowQ = (R.qName === 'low');
  for (const h of INFS.shells) { try { infShell(B, h, lowQ && h.tier === 1); } catch (e) { console.warn('infill shell ' + h.id + ': ' + (e && e.message || e)); } }
  if (!lowQ) {       // pennant ropes across the lanes, between houses that face each other
    const hs = INF.houses, used = new Set(), cols = [[0.62, 0.24, 0.17], [0.72, 0.56, 0.24], [0.24, 0.36, 0.3], [0.58, 0.52, 0.4], [0.5, 0.2, 0.2]], I = new THREE.Matrix4(), rr = rng(606); let nr = 0;
    const front = h => { const p = siteToWorld(h, (rr() - 0.5) * h.w * 0.3, -h.d / 2 - (h.jetty ? 0.58 : 0.14)); return [p[0], site0(h) + (h.floors >= 2 ? 3.75 : 2.9), p[1]]; };
    const site0 = h => SITE[h.id].y;
    for (const a of hs) for (const b of hs) {
      if (nr >= 8 || a.id >= b.id || used.has(a.id) || used.has(b.id)) continue;
      const fa = [Math.sin(a.yaw), -Math.cos(a.yaw)], fb = [Math.sin(b.yaw), -Math.cos(b.yaw)], dx = b.x - a.x, dz = b.z - a.z, dist = hyp(dx, dz);
      if (fa[0] * fb[0] + fa[1] * fb[1] > -0.9 || dist < 6.5 || dist > 12.5) continue;
      if (Math.abs(dx * fa[0] + dz * fa[1]) < dist * 0.9) continue;
      const pa = front(a), pb = front(b); if (Math.abs(pa[1] - pb[1]) > 1.2) continue;
      B.add(genBunting(pa, pb, rr, cols, 11), I, { zone: 0, skyVis: 1, cast: false }); used.add(a.id); used.add(b.id); nr++;
    }
  }
  if (!B.count) return;
  { const st = {}; for (const x of B.items || []) { const k = x.prim.mat; st[k] = st[k] || [0, 0]; st[k][0] += x.prim.idx.length / 3; st[k][1]++; } INFS.stat = st; }
  const g = B.build(); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); SC.scene.add(g);
  World.kitGroups.push({ g, ext: true, infill: true, site: { x: (INFS.box[0] + INFS.box[2]) / 2, z: (INFS.box[1] + INFS.box[3]) / 2, w: INFS.box[2] - INFS.box[0], d: INFS.box[3] - INFS.box[1] } });
  const tri = [], Vv = (M, x, y, z) => { const p = m4.tp(M, [x, y, z]); tri.push(p[0], p[1], p[2]); }, Q = (M, a, b2, c2, d2) => { for (const q of [a, b2, c2, a, c2, d2]) Vv(M, q[0], q[1], q[2]); };
  for (const p of INFS.proxies) {
    const M = p.Ms, xw = p.w / 2 - 0.1, z0 = -p.d / 2 - 0.55, z1 = p.d / 2 - 0.1, y = p.top, r = y + p.rise;
    Q(M, [-xw, -1, z0], [xw, -1, z0], [xw, y, z0], [-xw, y, z0]); Q(M, [xw, -1, z1], [-xw, -1, z1], [-xw, y, z1], [xw, y, z1]); Q(M, [-xw, -1, z1], [-xw, -1, z0], [-xw, y, z0], [-xw, y, z1]); Q(M, [xw, -1, z0], [xw, -1, z1], [xw, y, z1], [xw, y, z0]);
    if (p.rx) { const zc = (z0 + z1) / 2 - 0.25, xe = p.w / 2 + 0.05; Q(M, [-xe, y - 0.25, z0 - 0.3], [xe, y - 0.25, z0 - 0.3], [xe, r, zc], [-xe, r, zc]); Q(M, [xe, y - 0.25, z1 + 0.3], [-xe, y - 0.25, z1 + 0.3], [-xe, r, zc], [xe, r, zc]); }
    else { const x = p.w / 2 + 0.3; Q(M, [-x, y - 0.25, z0 - 0.3], [-x, y - 0.25, z1 + 0.3], [0, r, z1 + 0.3], [0, r, z0 - 0.3]); Q(M, [x, y - 0.25, z1 + 0.3], [x, y - 0.25, z0 - 0.3], [0, r, z0 - 0.3], [0, r, z1 + 0.3]); }
  }
  if (tri.length) {
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri), 3));
    const mat = new THREE.MeshBasicNodeMaterial(); mat.side = THREE.DoubleSide; mat.colorWrite = false; mat.depthWrite = false; mat.depthTest = false; mat.fog = false;
    const mesh = new THREE.Mesh(gg, mat); mesh.castShadow = true; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = -5; mesh.name = 'infill-shadow-proxy'; SC.scene.add(mesh);
  }
  const inner = sceneUpdate;
  sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    for (const k of World.kitGroups) if (k.infill) { const b = INFS.box, dx = Math.max(0, b[0] - camPos[0], camPos[0] - b[2]), dz = Math.max(0, b[1] - camPos[2], camPos[2] - b[3]); k.g.visible = !World.deepIn && hyp(dx, dz) < q.yardRange * 2.6 + 30; }
  };
}

// the walls of an enterable infill house (called from kitShell): the plan comes from the building's own openings, the upper storey is laid out like a shell's
function infKitWalls(c, b, MS, frames, zone, sy, R, pass) {      // pass: 'ext' / 'int' in a cell (the village shell / the room), else both in one
  const { site, spec, w, d, H, openings } = c, st = spec.kitStyle, fl = st.up ? 2 : 1, plan = [];
  plan[0] = { front: [], back: [], left: [], right: [] };
  for (const wn of ['front', 'back', 'left', 'right']) {
    const L = WALLS[wn].len(w, d);
    for (const o of openings[wn]) {
      const cu = (o.u0 + o.u1) / 2, hw = o.door ? Math.min(0.55 * Math.max(1, o.def.ksx || 1), cu, L - cu) : Math.min(0.55, cu, L - cu);
      if (hw < 0.3) continue;
      plan[0][wn].push({ u0: cu - hw, u1: cu + hw, v0: o.door ? 0 : (o.def.sill || 0.95), v1: o.door ? (o.def.h || 2.12) : (o.def.sill || 0.95) + (o.def.h || 1.55), door: !!o.door, shutter: !o.door && hw > 0.5 && R() < 0.35 });
      if (o.door && o.def.kLamp && pass !== 'int') { const side = cu + hw + 1.0 < L ? 1 : -1; c.kDoorLamps.push({ F: frames[wn], wn, u: cu + side * (hw + 0.42), v: 1.5 * sy }); }
    }
  }
  if (fl > 1) { plan[1] = { front: [], back: [], left: [], right: [] }; const nF = Math.max(2, Math.round(w / 2)), mF = w / nF; for (let i = 0; i < nF; i++) { const cu = (i + 0.5) * mF; if (i % 2 === 0) plan[1].front.push({ u0: cu - 0.5, u1: cu + 0.5, v0: 0.95, v1: 2.1, shutter: R() < 0.4 }); if (i % 2 === 1) plan[1].back.push({ u0: cu - 0.5, u1: cu + 0.5, v0: 0.95, v1: 2.1 }); } plan[1].left.push({ u0: d / 2 - 0.45, u1: d / 2 + 0.45, v0: 0.95, v1: 2.1 }); plan[1].right.push({ u0: d / 2 - 0.45, u1: d / 2 + 0.45, v0: 0.95, v1: 2.1 }); }
  const tn = 0.85 + R() * 0.25;
  infWalls(b, MS, { w, d, fl, H: 3, stone: st.ground === 'stone', tint: [tn, tn * 0.98, tn * 0.95], jetty: false, R, plan, skip: {}, optsOf: pass === 'int' ? (() => ({ zone, skyVis: INT_AO, cast: false, inZone: zone, inSkyVis: INT_AO })) : pass === 'ext' ? (() => ({ zone: 0, skyVis: 1, cast: false, inZone: 0, inSkyVis: 0.12 })) : (k => k === 0 ? { zone: 0, skyVis: 1, cast: false, inZone: zone, inSkyVis: INT_AO } : { zone: 0, skyVis: 1, cast: false, inZone: 0, inSkyVis: 0.12 }) });
}
