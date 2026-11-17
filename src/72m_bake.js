// ───────────────────────── [l1] baked contact: soft dark pools under furniture, window data for the window light ─────────────────────────
// A post-step over the plan engine's output (called from one marked line at the end of planBuild in 72e_plans.js). It reads the plan's records, never
// changes them, and adds two things to the cell:
//   c.cell.decal  one merged mesh of soft dark pools on the floor round everything that stands on it (kind 'decal' in the pack, one draw call per cell);
//   c.cell.wins   the windows in world space, which SH.winSet (40c_light.js) turns into the cell's daylight.
// The pool is a ring: 4 inner vertices (alpha A, under the object) and 4 outer vertices (alpha 0, a margin away), so the shade fades out smoothly.
const Bake = { on: !(typeof TEST !== 'undefined' && TEST && TEST.bake === 0), stats: { pools: 0, wins: 0 } };
Bake.cap = TEST && TEST.bakecap !== undefined ? +TEST.bakecap : 0.95;
Bake.dayU = null;
Bake.mat = function () {
  const { vec4, vec3, attribute, clamp, smoothstep } = TSL;
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  m.fog = false; m.toneMapped = false; m.side = THREE.DoubleSide; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  const a = attribute('tint', 'vec4').a, t = clamp(a.div(0.95), 0, 1); if (!Bake.dayU) Bake.dayU = TSL.uniform(1);
  const nz = TSL.texture(G.noiseTex, TSL.positionWorld.xz.mul(0.31)).level(1), brk = nz.r.mul(0.55).add(nz.g.mul(0.45)).mul(0.75).add(0.4);      // the band breaks up: darker where the noise is high, thin where it is low
  m.colorNode = vec4(TEST && TEST.bakedebug ? vec3(1.0, 0.0, 0.0) : vec3(0.0), t.mul(t).mul(t.mul(0.35).add(0.65)).mul(TEST && TEST.bakedebug ? 1.0 : Bake.dayU.mul(Bake.cap).mul(brk)));
  return m;
};
// light shafts: a few additive quads from each window into the room, by day only (no volumetric pass). Strength Bake.shaftU is set by SH.winSet.
Bake.shaftU = null;
Bake.shaftMat = function () {
  const { vec4, vec3, attribute, uv, uniform, smoothstep, abs, pow } = TSL;
  Bake.shaftU = uniform(0);
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  m.fog = false; m.toneMapped = false; m.side = THREE.DoubleSide;
  const q = uv(), across = smoothstep(0.0, 1.0, TSL.float(1).sub(abs(q.x.mul(2).sub(1)))), along = pow(TSL.float(1).sub(q.y), 1.6).mul(smoothstep(0.0, 0.35, q.y));
  const ta = attribute('tint', 'vec4').a, pk = TSL.mix(TSL.float(14), TSL.float(1), TSL.step(0.75, ta));      // a < 0.75: the floor patch
  m.colorNode = attribute('tint', 'vec4').rgb.mul(across.mul(across)).mul(along).mul(Bake.shaftU).mul(pk);
  return m;
};
// ring pool round a rectangle given by its four world corners in order (a, b, c, d), margin mg (m) along the outward directions
Bake.pool = function (m, y, q, mg, A) {
  const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  m.ao = A; const inner = q.map(p => m.vert(p[0], y, p[1], 0, 1, 0, 0, 0));
  m.ao = 0; const outer = q.map(p => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return m.vert(p[0] + dx / l * mg * 1.3, y, p[1] + dz / l * mg * 1.3, 0, 1, 0, 0, 0); });
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; m.tri(inner[i], outer[i], outer[j]); m.tri(inner[i], outer[j], inner[j]); }
  m.tri(inner[0], inner[1], inner[2]); m.tri(inner[0], inner[2], inner[3]);
  m.flip = false;
};
Bake.interior = function (P) {
  if (!Bake.on || !P || !P.c || !P.c.cell) return;
  const cell = P.c.cell, m = new Mesh(512); m.noAudit = 1; /* [fx2] alpha decal: overlapping pools are meant to overlap */ m.m1 = 0; m.m2 = 0; m.m3 = 0; m.layer = 0; m.cr = m.cg = m.cb = 0; m.grad = null; m.wind = 0;
  const T = P.T, ax = [T[0], T[2]], az = [T[8], T[10]];             // canonical x and z axes in world (x, z)
  const w2 = (x, z) => [T[12] + x * ax[0] + z * az[0], T[14] + x * ax[1] + z * az[1]];
  for (const it of P.items) {
    if (it.kind !== 'floor' && it.kind !== 'hearth') continue;
    if ((it.lift || 0) > 0.35 || !(it.x1 > it.x0)) continue;
    const L = P.lv[it.k]; if (!L) continue;
    const h = it.h || 0.5, y = L.y + 0.034; if (it.kind === 'floor' && h < 0.25 && (it.x1 - it.x0) * (it.z1 - it.z0) < 0.35) continue;
    const hearth = it.kind === 'hearth', A = hearth ? 0.7 : clamp(0.62 + h * 0.3, 0.66, 0.92), mg = hearth ? 0.7 : clamp(0.3 + h * 0.3, 0.34, 0.7);
    const pad = 0.03, cp = [[it.x0 + pad, it.z0 + pad], [it.x1 - pad, it.z0 + pad], [it.x1 - pad, it.z1 - pad], [it.x0 + pad, it.z1 - pad]], rmm = P.rooms && P.rooms[it.room];
    const bx0 = rmm ? rmm.x0 + 0.05 : -1e3, bx1 = rmm ? rmm.x1 - 0.05 : 1e3, bz0 = rmm ? rmm.z0 + 0.05 : -1e3, bz1 = rmm ? rmm.z1 - 0.05 : 1e3;      // a pool never crosses its room's wall
    const y3 = P.w2(0, y, 0)[1], cxp = (it.x0 + it.x1) / 2, czp = (it.z0 + it.z1) / 2;
    m.ao = A; const inner = cp.map(p => { const w = w2(p[0], p[1]); return m.vert(w[0], y3, w[1], 0, 1, 0, 0, 0); });
    m.ao = 0; const outer = cp.map(p => { const dx = p[0] - cxp, dz = p[1] - czp, l = Math.hypot(dx, dz) || 1, qx = Math.min(bx1, Math.max(bx0, p[0] + dx / l * mg * 1.3)), qz = Math.min(bz1, Math.max(bz0, p[1] + dz / l * mg * 1.3)), w = w2(qx, qz); return m.vert(w[0], y3, w[1], 0, 1, 0, 0, 0); });
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; m.tri(inner[i], outer[i], outer[j]); m.tri(inner[i], outer[j], inner[j]); }
    m.tri(inner[0], inner[1], inner[2]); m.tri(inner[0], inner[2], inner[3]); m.flip = false; Bake.stats.pools++;
  }
  if (m.ni) cell.decal = m;
  // light shafts: two stacked quads from the pane down to the floor in front of it
  { const sm = new Mesh(256); sm.noAudit = 1; sm.m1 = 0; sm.m2 = 0; sm.m3 = 0; sm.layer = 0; sm.grad = null; sm.wind = 0; sm.cr = 255; sm.cg = 232; sm.cb = 190; sm.ao = 1;
    for (const w of P.windows) {
      const wl = w.wall, hor = wl.ax === 'x', L = P.lv[w.k]; if (!L || !wl.ext || w.k !== 0 && !P.lv[0]) continue;
      const og = wl.open.find(o => o.type === 'win' && o.pos === w.pos), gc = og && og.glass; if (gc) { sm.cr = Math.round(Math.min(1, 0.25 + gc[0]) * 255); sm.cg = Math.round(Math.min(1, 0.25 + gc[1]) * 255); sm.cb = Math.round(Math.min(1, 0.25 + gc[2]) * 255); } else { sm.cr = 255; sm.cg = 232; sm.cb = 190; }      // stained glass throws its own colour
      const cx = hor ? w.pos : wl.c, cz = hor ? wl.c : w.pos, dx = hor ? 0 : -wl.ns, dz = hor ? -wl.ns : 0, tx = hor ? 1 : 0, tz = hor ? 0 : 1, y0 = L.y + 1.2, y1 = L.y + 1.95, fy = L.y + 0.05, rm = w.room, back = rm ? (hor ? (dz > 0 ? rm.z1 - wl.c : wl.c - rm.z0) : (dx > 0 ? rm.x1 - wl.c : wl.c - rm.x0)) : 3.6, len = Math.max(0.8, Math.min(3.4, back - 0.25)), side = rm ? (hor ? Math.min(w.pos - rm.x0, rm.x1 - w.pos) : Math.min(w.pos - rm.z0, rm.z1 - w.pos)) : 2;      // [l1] never longer or wider than its own room
      const at = (a, b, y) => P.w2(cx + dx * a + tx * b, y, cz + dz * a + tz * b);
      const quad = (v) => { const [p0, p1, p2, p3] = v; const a = sm.vert(p0[0], p0[1], p0[2], 0, 1, 0, 0, 0), b = sm.vert(p1[0], p1[1], p1[2], 0, 1, 0, 1, 0), c = sm.vert(p2[0], p2[1], p2[2], 0, 1, 0, 1, 1), d = sm.vert(p3[0], p3[1], p3[2], 0, 1, 0, 0, 1); sm.tri(a, b, c); sm.tri(a, c, d); sm.flip = false; };
      quad([at(0.15, -0.5, y1), at(0.15, 0.5, y1), at(len, Math.min(1.9, side - 0.15), fy), at(len, -Math.min(1.9, side - 0.15), fy)]);        // u across (the wall's own direction), v from the pane to the floor
      quad([at(0.35, -0.4, y1 - 0.25), at(0.35, 0.4, y1 - 0.25), at(len * 0.8, Math.min(1.4, side - 0.15), fy + 0.5), at(len * 0.8, -Math.min(1.4, side - 0.15), fy + 0.5)]);        // a second, inner sheet gives the beam some depth
      { const fp = L.y + 0.045, ws = (w.w || 1.0) * 0.5 + 0.35; sm.ao = 0.5; quad([at(0.35, -Math.min(ws, side - 0.1), fp), at(0.35, Math.min(ws, side - 0.1), fp), at(Math.min(3.3, len), Math.min(ws * 1.5, side - 0.1), fp), at(Math.min(3.3, len), -Math.min(ws * 1.5, side - 0.1), fp)]); sm.ao = 1; }      // the pool of window light on the floor
    }
    if (sm.ni) cell.shaft = sm; }
  // windows: a pane centre, its inward direction on the floor plane (world), the reach and a strength by size
  cell.wins = [];
  for (const w of P.windows) {
    const wl = w.wall, hor = wl.ax === 'x', L = P.lv[w.k]; if (!L) continue;
    const cx = hor ? w.pos : wl.c, cz = hor ? wl.c : w.pos, dx = hor ? 0 : -wl.ns, dz = hor ? -wl.ns : 0;
    const p0 = P.w2(cx + dx * 0.25, L.y + 1.5, cz + dz * 0.25), p1 = P.w2(cx + dx * 1.25, L.y + 1.5, cz + dz * 1.25);
    const dd = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) || 1;
    const og = wl.open.find(o => o.type === 'win' && o.pos === w.pos), gc = og && og.glass;
    cell.wins.push({ p: p0, d: [(p1[0] - p0[0]) / dd, (p1[2] - p0[2]) / dd], r: Math.max(9, Math.min(13, Math.max(w.room.x1 - w.room.x0, w.room.z1 - w.room.z0) * 0.9)), k: 1, k0: w.k, c: gc ? [0.45 + gc[0] * 0.9, 0.45 + gc[1] * 0.9, 0.45 + gc[2] * 0.9] : null });
    Bake.stats.wins++;
  }
};
// ── blob shadows under people (one dynamic quad list, one draw call) ──
// In sun the real shadow shows (villagers cast within R.q.villagerCast), so the blob fades with the key light; at night, in rooms and in overcast it is the only contact.
Bake.People = { N: 56, mesh: null, u: null };
Bake.people = function (cam, env) {
  if (!Bake.on || !SC.scene || typeof NPCS === 'undefined') return;
  Bake.groundUpdate(cam);
  const B = Bake.People;
  if (!B.mesh) {
    const { vec4, vec3, uv, uniform, smoothstep, length } = TSL, N = B.N;
    const g = new THREE.BufferGeometry(); B.pos = new Float32Array(N * 12); const uvs = new Float32Array(N * 8), ix = new Uint16Array(N * 6);
    for (let i = 0; i < N; i++) { uvs.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); ix.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    const pa = new THREE.BufferAttribute(B.pos, 3); pa.setUsage(THREE.DynamicDrawUsage); g.setAttribute('position', pa); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); g.setIndex(new THREE.BufferAttribute(ix, 1)); g.setDrawRange(0, 0);
    B.u = uniform(0.4); const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    m.fog = false; m.toneMapped = false; m.side = THREE.DoubleSide; m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -3;
    const d = length(uv().sub(0.5)).mul(2), a = smoothstep(1.0, 0.1, d);
    m.colorNode = vec4(vec3(0.0), a.mul(a).mul(B.u));
    const mesh = B.mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.layers.set(1); mesh.name = 'blobs'; SC.scene.add(mesh); B.pa = pa; B.g = g;
  }
  const kl = (env.keyCol[0] + env.keyCol[1] + env.keyCol[2]) / 3; if (Bake.dayU) Bake.dayU.value = World.cell ? 1 : 0.4 + 0.6 * Math.min(1, kl * 1.6); B.u.value = (TEST && TEST.blob !== undefined ? +TEST.blob : 0.46) / (1 + kl * 0.8);
  const list = [], push = (p, s) => { const dx = p[0] - cam[0], dz = p[2] - cam[2], d2 = dx * dx + dz * dz; if (d2 < 48 * 48 && Math.abs(p[1] - cam[1]) < 6) list.push([d2, p, s]); };
  for (const n of NPCS) { if (n.hid || !n.pos || n.anim === 'lie' || (n.obj && n.obj.visible === false && !n.ch)) continue; push(n.pos, n.scale || 1); }
  if (typeof Foes !== 'undefined' && Foes.list) for (const f of Foes.list) if (f.alive && f.pos && Cells.spaceOf(f.pos) === (Cells.cur ? Cells.cur.id : 0)) push(f.pos, f.scale || 1);
  list.sort((a, b) => a[0] - b[0]); const n = Math.min(list.length, B.N), P = B.pos;
  for (let i = 0; i < n; i++) { const p = list[i][1], r = 0.62 * list[i][2], y = p[1] + 0.03, o = i * 12;
    P[o] = p[0] - r; P[o + 1] = y; P[o + 2] = p[2] - r; P[o + 3] = p[0] + r; P[o + 4] = y; P[o + 5] = p[2] - r; P[o + 6] = p[0] + r; P[o + 7] = y; P[o + 8] = p[2] + r; P[o + 9] = p[0] - r; P[o + 10] = y; P[o + 11] = p[2] + r; }
  B.pa.clearUpdateRanges(); if (n) B.pa.addUpdateRange(0, n * 12); B.pa.needsUpdate = true; B.g.setDrawRange(0, n * 6); B.mesh.visible = n > 0;
};
// ── outdoor contact: a soft dark band round everything solid that stands on the ground ──
// Built once from World.colliders (walls, fences, props, trunks), the same footprints the splat map uses, but as geometry laid on whatever the ground really is
// there (terrain, paving, steps), so it also shows on the square's paving, which the terrain shader never sees. One mesh, one draw call: its index list is
// refilled from the 32 m squares round the camera (like the terrain pool), so only a few thousand triangles are ever drawn.
Bake.GR = { S: 16, built: false, mesh: null, sq: null, last: [1e9, 1e9], tris: 0 };
Bake.buildGround = function () {
  if (!Bake.on || (TEST && TEST.bakeg === 0) || Bake.GR.built) return;
  const GR = Bake.GR, S = GR.S, pos = [], al = [], sq = new Map(), t0 = performance.now();
  const gy = (x, z, h) => { let y = Terrain.y(x, z); const g = World.groundAt(x, z, h); if (isFinite(g) && g > y - 0.3 && g < h + 0.2) y = g; return y + 0.05; };
  const vert = (x, z, h, a) => { pos.push(x, gy(x, z, h), z); al.push(a); return al.length - 1; };
  const tri = (a, b, c) => { const k = Math.floor((pos[a * 3] + pos[b * 3] + pos[c * 3]) / (3 * S)) + ',' + Math.floor((pos[a * 3 + 2] + pos[b * 3 + 2] + pos[c * 3 + 2]) / (3 * S)); let l = sq.get(k); if (!l) sq.set(k, l = { i: [], m: [], x: 0, z: 0 }); (minor ? l.m : l.i).push(a, b, c); };
  let minor = false;
  for (const c of World.colliders) {
    if (Cells.inRegion(c.x) || Math.abs(c.x) > 190 || Math.abs(c.z) > 190) continue;
    const ty = Terrain.y(c.x, c.z), ht = c.y1 - c.y0; if (c.y0 > ty + 0.7 || ht < 0.35) continue;
    minor = ht < 1.2 && !c.shade;      // low things (crates, benches, stones) only get their band near the camera
    const h = c.y0 + 0.9, A = ht > 1.2 ? 0.9 : 0.66, m = clamp(0.55 + 0.18 * ht, 0.7, 1.35);
    if (c.r !== undefined) {
      if (c.r > 4) continue; const R = c.r + m * 0.9, n = c.r < 0.6 ? 6 : 8, ring0 = [], ring1 = [];
      for (let i = 0; i < n; i++) { const a = i / n * TAU, ca = Math.cos(a), sa = Math.sin(a); ring0.push(vert(c.x + ca * c.r * 0.85, c.z + sa * c.r * 0.85, h, A)); ring1.push(vert(c.x + ca * R, c.z + sa * R, h, 0)); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(ring0[i], ring1[i], ring1[j]); tri(ring0[i], ring1[j], ring0[j]); }
      continue;
    }
    if (c.hx * c.hz < 0.004 || (c.hx > 40 || c.hz > 40)) continue;
    const cc = c.shade ? Object.assign({}, c, { hx: c.hx + 0.1, hz: c.hz + 0.55 }) : c;      // a canopy: the whole shaded rectangle goes dark
    const P = (lx, lz) => [cc.x + cc.ax * lx + cc.bx * lz, cc.z + cc.az * lx + cc.bz * lz], e = m * 0.55;
    // four sides, each a strip along its edge (a little longer than the edge so the corners are covered), inner edge dark, outer edge clear
    for (const [ux, uz, ox, oz, half, hl] of [[1, 0, 0, 1, cc.hx, cc.hz], [1, 0, 0, -1, cc.hx, cc.hz], [0, 1, 1, 0, cc.hz, cc.hx], [0, 1, -1, 0, cc.hz, cc.hx]]) {
      const len = 2 * half + 2 * e, n = Math.max(1, Math.ceil(len / 3.4)); let pi = -1, po = -1;
      for (let k = 0; k <= n; k++) {
        const t = -half - e + len * k / n, endK = (k === 0 || k === n) ? 0.55 : 1, lx = ux ? t : ox * hl, lz = uz ? t : oz * hl;
        const pin = P(lx, lz), pout = P(lx + ox * m, lz + oz * m);
        const ai = vert(pin[0], pin[1], h, A * endK), ao = vert(pout[0], pout[1], h, 0);
        if (pi >= 0) { tri(pi, po, ao); tri(pi, ao, ai); }
        pi = ai; po = ao;
      }
    }
    if (c.shade) { const q = [P(-cc.hx, -cc.hz), P(cc.hx, -cc.hz), P(cc.hx, cc.hz), P(-cc.hx, cc.hz)].map(p => vert(p[0], p[1], h, A * 0.85)); tri(q[0], q[1], q[2]); tri(q[0], q[2], q[3]); }
  }
  // roofed ground: whatever lies under a gallery deck, the roofed bridge or the passage goes dark, soft at the edges (a filled rectangle: dark inside, a fade over 0.9 m outside)
  minor = false;
  for (const cv of World.covers || []) {
    const gm = 0.9, X0 = cv.x0, X1 = cv.x1, Z0 = cv.z0, Z1 = cv.z1, A = cv.dark ? 0.8 : 0.7, hh = (Terrain.y((X0 + X1) / 2, (Z0 + Z1) / 2)) + 1.0;
    const nx = Math.max(1, Math.ceil((X1 - X0) / 3)), nz = Math.max(1, Math.ceil((Z1 - Z0) / 3)), grid = [];
    for (let j = 0; j <= nz + 2; j++) { grid.push([]); for (let i = 0; i <= nx + 2; i++) {
      const fx = i === 0 ? -gm : i === nx + 2 ? 1 : 0, fz = j === 0 ? -gm : j === nz + 2 ? 1 : 0, ii = Math.min(Math.max(i - 1, 0), nx), jj = Math.min(Math.max(j - 1, 0), nz);
      const x = X0 + (X1 - X0) * ii / nx + (i === 0 ? -gm : i === nx + 2 ? gm : 0), z = Z0 + (Z1 - Z0) * jj / nz + (j === 0 ? -gm : j === nz + 2 ? gm : 0), edge = (i === 0 || i === nx + 2 || j === 0 || j === nz + 2);
      grid[j].push(vert(x, z, hh, edge ? 0 : A)); } }
    for (let j = 0; j < nz + 2; j++) for (let i = 0; i < nx + 2; i++) { const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i]; tri(a, b, c); tri(a, c, d); }
  }
  GR.pos = new Float32Array(pos); GR.tint = new Uint8Array(al.length * 4); for (let i = 0; i < al.length; i++) GR.tint[i * 4 + 3] = Math.round(al[i] * 255);
  GR.sq = [...sq.entries()].map(([k, l]) => { const [a, b] = k.split(',').map(Number); return { x: (a + 0.5) * S, z: (b + 0.5) * S, idx: Uint32Array.from(l.i), idm: Uint32Array.from(l.m) }; });
  GR.tris = GR.sq.reduce((s, q) => s + (q.idx.length + q.idm.length) / 3, 0); GR.built = true; GR.ms = Math.round(performance.now() - t0);
};
Bake.groundUpdate = function (cam) {
  const GR = Bake.GR; if (!GR.built || !SC.scene) return;
  if (!GR.mesh) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(GR.pos, 3)); g.setAttribute('tint', new THREE.BufferAttribute(GR.tint, 4, true));
    GR.cur = new Uint32Array(Math.min(GR.tris * 3, 1 << 20)); const ia = new THREE.BufferAttribute(GR.cur, 1); ia.setUsage(THREE.DynamicDrawUsage); g.setIndex(ia); g.setDrawRange(0, 0); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    GR.mesh = new THREE.Mesh(g, Bake.groundMat || (Bake.groundMat = Bake.mat())); GR.mesh.frustumCulled = false; GR.mesh.renderOrder = 2; GR.mesh.name = 'ground-contact'; SC.scene.add(GR.mesh); GR.geo = g; GR.ia = ia;
  }
  GR.mesh.visible = !World.cell && GR.n !== 0;
  if (World.cell) return;
  if (Math.hypot(cam[0] - GR.last[0], cam[2] - GR.last[1]) < 4 && !GR.stale) return;
  GR.last = [cam[0], cam[2]]; GR.stale = false;
  const reach = (R.q && R.q.houseFar ? Math.min(R.q.houseFar, 56) : 50) * 0.3 + 4; let n = 0;
  for (const q of GR.sq) { const dq = Math.hypot(q.x - cam[0], q.z - cam[2]); if (dq < reach + GR.S * 0.71 && n + q.idx.length <= GR.cur.length) { GR.cur.set(q.idx, n); n += q.idx.length; } if (dq < 16 + GR.S * 0.71 && n + q.idm.length <= GR.cur.length) { GR.cur.set(q.idm, n); n += q.idm.length; } }
  GR.n = n; GR.geo.setDrawRange(0, n); GR.ia.clearUpdateRanges(); if (n) GR.ia.addUpdateRange(0, n); GR.ia.needsUpdate = true; GR.mesh.visible = n > 0;
};
