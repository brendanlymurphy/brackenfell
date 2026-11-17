// ───────────────────────── house generator: shell, timber frame, roof, openings, interior hooks ─────────────────────────
const WALLS = {
  front: { n: [0, 0, -1], u: [-1, 0, 0], start: (w, d) => [w / 2, 0, -d / 2], len: (w, d) => w, toU: (p, w, d) => w / 2 - p },
  back: { n: [0, 0, 1], u: [1, 0, 0], start: (w, d) => [-w / 2, 0, d / 2], len: (w, d) => w, toU: (p, w, d) => p + w / 2 },
  left: { n: [-1, 0, 0], u: [0, 0, 1], start: (w, d) => [-w / 2, 0, -d / 2], len: (w, d) => d, toU: (p, w, d) => p + d / 2 },
  right: { n: [1, 0, 0], u: [0, 0, -1], start: (w, d) => [w / 2, 0, d / 2], len: (w, d) => d, toU: (p, w, d) => d / 2 - p },
};
World.doors = []; World.spots = {}; World.houses = {}; World.cell = null;
const INT_AO = 0.30;       // sky visibility of interior surfaces
function addFloor(m, x0, z0, x1, z1, y, y2, axis) {
  const M = m.m, c = m4.tp(M, [(x0 + x1) / 2, y, (z0 + z1) / 2]), sx = hyp(M[0], M[2]) || 1, sz = hyp(M[8], M[10]) || 1;
  const f = { x: c[0], z: c[2], hx: Math.abs(x1 - x0) / 2, hz: Math.abs(z1 - z0) / 2, ax: M[0] / sx, az: M[2] / sx, bx: M[8] / sz, bz: M[10] / sz, y: c[1] };
  if (y2 !== undefined) { f.y2 = c[1] + (y2 - y); f.axis = axis; }        // ramp: y at -h .. y2 at +h along local x ('x') or z ('z')
  World.floors.push(f); return f;
}
function siteMatrix(site, y) { const M = m4.create(); m4.translate(M, site.x, y, site.z); m4.rotY(M, -site.yaw); return M; }

function buildHouse(site, spec) {
  const kit = typeof kitWanted === 'function' && kitWanted(site, spec);      // kit-built shell (71_kithouse.js) or the procedural one below
  if (kit) spec = kitSpec(site, spec);
  const col0 = World.colliders.length, fl0 = World.floors.length, lt0 = World.lights.length;
  // Cells (56_cells.js): the interior is built in its own frame far from the village (isite, Ms) and only the shell stays on the site (site, Mx). Without cells both are the same.
  const cell = kit && CELLS_ON ? Cells.make(site.id, site.name, { site }) : null, isite = cell ? cell.cs : site;
  const w = site.w, d = site.d, H = spec.H || 2.6, t = 0.3, P = (spec.pitch || 48) * PI / 180, tanP = Math.tan(P), hd = d / 2;
  const floorY = isite.y + 0.32, xFloorY = site.y + 0.32, zone = World.zones.length + 1, R = rng(site.x * 131 + site.z * 17 + 5);
  const Mx = siteMatrix(site, xFloorY), Ms = cell ? siteMatrix(isite, floorY) : Mx;
  const ext = new Mesh(4096), ins = cell ? new Mesh(2048) : ext, int = new Mesh(4096), glow = new Mesh(256);
  for (const m of [ext, ins, int, glow]) { m.m = (m === ext || m === glow ? Mx : Ms).slice(); m.dirty = true; m.seed = (site.x * 977 + site.z * 31) | 0; }
  const ridgeY = H + hd * tanP, roofY = z => H + (hd - Math.abs(z)) * tanP;
  const zinfo = { id: zone, site: isite, y0: floorY - 0.7, y1: floorY + ridgeY + 1.5, hw: w / 2, hd, cell: cell ? cell.id : null };
  zinfo.H = H; zinfo.slope = spec.ceiling ? 0 : tanP; World.zones.push(zinfo); if (cell) cell.zones.push(zone);
  const inner = () => { ins.m1 = zone; ins.ao = INT_AO; }, outer = () => { ext.m1 = 0; ext.ao = 1; };
  const faces = [...new Set([ext, ins, int, glow])];
  int.m1 = zone; int.ao = INT_AO;
  const walls = spec.walls || 'timber', stoneH = walls === 'half' ? (spec.stoneH || 1.05) : 0;
  const plaster = spec.plaster || [1, 1, 1], timberC = spec.timber || COL.timberDark;
  const outerMat = v => { if (walls === 'stone' || v < stoneH) ext.mat(MAT.STONE, spec.stoneCol || [1, 1, 1]); else if (walls === 'log') ext.mat(MAT.TIMBER, [0.9, 0.84, 0.78], 1.6); else ext.mat(MAT.PLASTER, plaster); };
  const innerMat = () => { if (walls === 'stone') ins.mat(MAT.STONE, [0.95, 0.93, 0.9]); else if (walls === 'log') ins.mat(MAT.TIMBER, [0.95, 0.88, 0.8], 1.6); else ins.mat(MAT.PLASTER, [0.97, 0.93, 0.86]); };
  const openings = { front: [], back: [], left: [], right: [] };
  for (const o of spec.doors || []) openings[o.wall].push({ door: true, pos: o.pos || 0, w: o.w || 1.05, v0: 0, v1: o.h || 2.05, def: o });
  for (const o of spec.windows || []) openings[o.wall].push({ pos: o.pos, w: o.w || 0.9, v0: o.sill === undefined ? 1.0 : o.sill, v1: (o.sill === undefined ? 1.0 : o.sill) + (o.h || 1.0), def: o });
  const aoOut = v => v > H - 0.7 ? lerp(1, 0.55, (v - (H - 0.7)) / 0.7) : v < 0.45 ? lerp(0.7, 1, v / 0.45) : 1;
  const doorList = [], xdoorList = [];

  for (const wn of ['front', 'back', 'left', 'right']) {
    const W = WALLS[wn], L = W.len(w, d), gable = wn === 'left' || wn === 'right', Hin = gable ? H : H + t * tanP;
    const wb = m4.create(); m4.basis(wb, W.u, [0, 1, 0], W.n, W.start(w, d));
    for (const m of faces) { m.push(); m4.mul(m.m, m.m, wb); m.dirty = true; }
    const ops = openings[wn].map(o => Object.assign(o, { u0: W.toU(o.pos, w, d) - o.w / 2, u1: W.toU(o.pos, w, d) + o.w / 2 })).sort((a, b) => a.u0 - b.u0);
    const inOp = (u, v) => ops.some(o => u > o.u0 && u < o.u1 && v > o.v0 && v < o.v1);
    const ub = [0, t, L - t, L], vb = [0, 0.45, H - 0.7, H]; if (stoneH) vb.push(stoneH);
    for (const o of ops) { ub.push(o.u0, o.u1); vb.push(o.v0, o.v1); }
    const us = [...new Set(ub.map(x => +x.toFixed(4)))].sort((a, b) => a - b), vs = [...new Set(vb.map(x => +x.toFixed(4)))].filter(v => v >= 0 && v <= H).sort((a, b) => a - b);
    // outer + inner faces
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < vs.length - 1; j++) {
      const u0 = us[i], u1 = us[i + 1], v0 = vs[j], v1 = vs[j + 1];
      if (inOp((u0 + u1) / 2, (v0 + v1) / 2)) continue;
      outer(); outerMat((v0 + v1) / 2); ext.grad = [aoOut(v1), aoOut(v0)];
      ext.quad([u0, v1, 0], [u0, v0, 0], [u1, v0, 0], [u1, v1, 0], u0 / ext.tile, (H - v1) / ext.tile, u1 / ext.tile, (H - v0) / ext.tile);
      if (u0 >= t - 0.001 && u1 <= L - t + 0.001) {
        const top = (j === vs.length - 2) ? Hin : v1;
        inner(); innerMat(); ins.grad = [v1 > H - 0.4 ? 0.8 : 1, v0 < 0.3 ? 0.78 : 1];
        ins.quad([u1, top, -t], [u1, v0, -t], [u0, v0, -t], [u0, top, -t], u1 / ins.tile, (H - top) / ins.tile, u0 / ins.tile, (H - v0) / ins.tile);
      }
    }
    ext.grad = null; ins.grad = null;
    if (gable) {          // gable triangles
      const ay = H + L / 2 * tanP;
      outer(); outerMat(H + 1); if (walls === 'half' || walls === 'timber') ext.mat(MAT.PLASTER, plaster);
      ext.poly([[0, H, 0], [L, H, 0], [L / 2, ay, 0]]);
      inner(); innerMat(); ins.poly([[L - t * 0.2, H, -t], [t * 0.2, H, -t], [L / 2, ay, -t]]);
      if (walls !== 'stone' && walls !== 'log') {     // decorative truss
        outer(); ext.mat(MAT.TIMBER, timberC);
        ext.box(L / 2 - 0.08, H, 0, L / 2 + 0.08, ay - 0.25, 0.035, 16);
        const cy = H + (ay - H) * 0.45, cx = (cy - H) / tanP; ext.box(cx, cy - 0.07, 0, L - cx, cy + 0.07, 0.035, 16);
        for (const s of [-1, 1]) ext.beam([L / 2 + s * (L / 2 - 0.5), H + 0.08, 0.018], [L / 2 + s * 0.1, cy - 0.05, 0.018], 0.035, 0.13);
      }
    }
    // openings: reveals, frames, shutters, panes
    for (const o of ops) {
      const { u0, u1, v0, v1 } = o;
      outer(); ext.ao = 0.75; if (walls === 'stone') ext.mat(MAT.STONE, [0.9, 0.9, 0.9]); else ext.mat(MAT.TIMBER, timberC);
      ext.quad([u0, v1, 0], [u0, v0, 0], [u0, v0, -t], [u0, v1, -t]); ext.quad([u1, v1, -t], [u1, v0, -t], [u1, v0, 0], [u1, v1, 0]);
      ext.quad([u0, v1, 0], [u0, v1, -t], [u1, v1, -t], [u1, v1, 0]);
      if (!o.door) ext.quad([u0, v0, -t], [u0, v0, 0], [u1, v0, 0], [u1, v0, -t]);
      ext.ao = 1; ext.mat(MAT.TIMBER, timberC);
      if (o.door) {
        // frame + lintel + stone steps outside
        ext.box(u0 - 0.13, 0, 0, u0, v1 + 0.14, 0.05, 16); ext.box(u1, 0, 0, u1 + 0.13, v1 + 0.14, 0.05, 16); ext.box(u0, v1, 0, u1, v1 + 0.14, 0.05, 16);
        ext.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); ext.box(u0 - 0.35, -0.5, 0, u1 + 0.35, -0.02, 0.5); ext.box(u0 - 0.2, -0.5, 0.5, u1 + 0.2, -0.17, 0.95);
        addFloor(ext, u0 - 0.35, -t, u1 + 0.35, 0.5, -0.01); addFloor(ext, u0 - 0.2, 0.5, u1 + 0.2, 0.95, -0.17);
        inner(); if (spec.floor === 'stone') ins.mat(MAT.COBBLE, [1, 1, 1], 1.4); else ins.mat(MAT.PLANKS, COL.woodDark);
        ins.quad([u0, 0.02, -t], [u0, 0.02, 0], [u1, 0.02, 0], [u1, 0.02, -t]);
        // a door leaf on each side (one in the village, one in the cell); the doorway itself is closed to walkers, the leaf is a portal (56_cells.js)
        const leaf = (m, side) => { const hinge = m4.tp(m.m, [u0 + 0.02, 0, -t / 2]), dirU = m4.td(m.m, [1, 0, 0]); return { site: side === 'in' ? isite : site, zone: side === 'in' ? zone : cell ? 0 : zone, side, cell: cell ? cell.id : null, hinge, yaw: Math.atan2(dirU[0], -dirU[2]) - PI / 2, w: o.w - 0.04, h: v1 - 0.03, open: 0, c: m4.tp(m.m, [(u0 + u1) / 2, 1, -t / 2]), out: m4.tp(m.m, [(u0 + u1) / 2, -0.3, 1.6]), ins: m4.tp(m.m, [(u0 + u1) / 2, 0, -t - 1.0]), sill: m4.tp(m.m, [(u0 + u1) / 2, 0, -t / 2]), baseM: m4.mul(m4.create(), m.m, m4.translate(m4.create(), u0 + 0.02, 0, -t / 2)) }; };
        const dd = leaf(ins, 'in'), dx = cell ? leaf(ext, 'out') : null;
        if (!o.def.noLeaf) { World.doors.push(dd); if (dx) World.doors.push(dx); } doorList.push(dd); if (dx) { dx.pair = dd; dd.pair = dx; xdoorList.push(dx); }
        if (cell) { addBoxCollider(ext, u0, -t, u1, 0, 0, H + 3); addBoxCollider(ins, u0, -t, u1, 0, 0, H + 3); }
        if (o.def.lamp !== false) at(ext, u1 + 0.55, v1 + 0.25, 0.02, 0, () => { ext.mat(MAT.METAL, COL.black); ext.beam([0, 0.1, 0], [0, 0.1, 0.36], 0.03, 0.03); at(ext, 0, 0.1, 0.34, 0, () => Props.lantern(ext, { zone: 0 })); });
      } else {
        const z = -t * 0.45, uc = (u0 + u1) / 2;
        ext.box(u0, v0, z - 0.03, u0 + 0.05, v1, z + 0.03); ext.box(u1 - 0.05, v0, z - 0.03, u1, v1, z + 0.03); ext.box(u0, v1 - 0.05, z - 0.03, u1, v1, z + 0.03); ext.box(u0, v0, z - 0.03, u1, v0 + 0.05, z + 0.03);
        ext.box(uc - 0.02, v0, z - 0.02, uc + 0.02, v1, z + 0.02); ext.box(u0, v0 + (v1 - v0) * 0.56 - 0.02, z - 0.02, u1, v0 + (v1 - v0) * 0.56 + 0.02, z + 0.02);
        if (walls === 'stone') { ext.mat(MAT.STONE, [0.85, 0.85, 0.85], 0.8); ext.box(u0 - 0.1, v0 - 0.1, 0, u1 + 0.1, v0, 0.08, 16); }
        else {
          ext.box(u0 - 0.1, v0 - 0.09, 0, u1 + 0.1, v0, 0.09, 16); ext.box(u0 - 0.11, v0, 0, u0, v1 + 0.11, 0.045, 16); ext.box(u1, v0, 0, u1 + 0.11, v1 + 0.11, 0.045, 16); ext.box(u0, v1, 0, u1, v1 + 0.11, 0.045, 16);
          if (o.def.shutters !== false) { const sw = (u1 - u0) / 2; ext.mat(MAT.PLANKS, spec.shutter || [0.45, 0.55, 0.42], 0.5);
            for (const [a, b] of [[u0 - 0.11 - sw, u0 - 0.11], [u1 + 0.11, u1 + 0.11 + sw]]) { ext.box(a, v0, 0.01, b, v1, 0.05, 16); ext.mat(MAT.TIMBER, timberC); ext.box(a, v0 + 0.12, 0.05, b, v0 + 0.2, 0.065, 16); ext.box(a, v1 - 0.2, 0.05, b, v1 - 0.12, 0.065, 16); ext.mat(MAT.PLANKS, spec.shutter || [0.45, 0.55, 0.42], 0.5); } }
        }
        glow.mat(MAT.PLAIN, o.def.glass || [1.0, 0.66, 0.30]); glow.m3 = 34;
        glow.quad([u0, v1, z - 0.04], [u0, v0, z - 0.04], [u1, v0, z - 0.04], [u1, v1, z - 0.04], 0, 0, (u1 - u0) / 0.9, (v1 - v0) / 0.9);
        addLight(m4.tp(ins.m, [uc, (v0 + v1) / 2 + 0.1, -t - 0.7]), 5.6, [1.5, 1.42, 1.28], zone, 'daylight');
      }
    }
    // timber frame on the outside face
    if (walls === 'timber' || walls === 'half') {
      outer(); ext.mat(MAT.TIMBER, timberC);
      const z1 = 0.035, posts = [0.09, L - 0.09], solid = [];
      let cur = 0; for (const o of ops) { if (o.door || true) { solid.push([cur, o.u0, o]); cur = o.u1; } } solid.push([cur, L, null]);
      for (const o of ops) if (o.door) { /* door frame already there */ } else { posts.push(o.u0 - 0.17, o.u1 + 0.17); }
      const sorted = posts.filter(p => p > 0 && p < L).sort((a, b) => a - b), all = [];
      for (let i = 0; i < sorted.length; i++) { all.push(sorted[i]); if (i < sorted.length - 1) { const gap = sorted[i + 1] - sorted[i]; const blocked = ops.some(o => o.u0 < sorted[i + 1] && o.u1 > sorted[i]); if (!blocked && gap > 2.1) { const n = Math.ceil(gap / 1.7); for (let k = 1; k < n; k++) all.push(sorted[i] + gap * k / n); } } }
      for (const p of all) { if (ops.some(o => p > o.u0 - 0.05 && p < o.u1 + 0.05)) continue; ext.box(p - 0.08, stoneH, 0, p + 0.08, H, z1, 16 | 4); }
      ext.box(0, H - 0.17, 0, L, H, z1 + 0.005, 16);
      const rail = (v, skipWin) => { let a = 0; const cuts = ops.filter(o => o.door || (skipWin && v > o.v0 - 0.01 && v < o.v1)).sort((x, y) => x.u0 - y.u0); for (const o of cuts) { if (o.u0 - a > 0.2) ext.box(a, v, 0, o.u0, v + 0.14, z1, 16); a = o.u1; } if (L - a > 0.2) ext.box(a, v, 0, L, v + 0.14, z1, 16); };
      rail(stoneH, false);
      if (H - stoneH > 2.0) rail(Math.max(stoneH + 0.75, 0.86), true);
      // corner braces
      const mid = Math.max(stoneH + 0.75, 0.86), a2 = all.filter(p => p > 0.3 && p < L - 0.3);
      if (a2.length && !ops.some(o => o.u0 < a2[0])) ext.beam([0.17, stoneH + 0.14, 0.018], [a2[0] - 0.08, mid, 0.018], 0.035, 0.12);
      if (a2.length && !ops.some(o => o.u1 > a2[a2.length - 1])) ext.beam([L - 0.17, stoneH + 0.14, 0.018], [a2[a2.length - 1] + 0.08, mid, 0.018], 0.035, 0.12);
      // interior posts
      inner(); ins.mat(MAT.TIMBER, timberC);
      for (const p of all) { if (p < t + 0.1 || p > L - t - 0.1 || ops.some(o => p > o.u0 - 0.05 && p < o.u1 + 0.05)) continue; ins.box(p - 0.07, 0, -t - 0.04, p + 0.07, Hin, -t, 32); }
    }
    // collision: solid spans (windows block, doors don't)
    { let a = 0; const cuts = ops.filter(o => o.door); for (const o of cuts) { if (o.u0 - a > 0.02) { addBoxCollider(ext, a, -t, o.u0, 0, 0, H + 3); if (cell) addBoxCollider(ins, a, -t, o.u0, 0, 0, H + 3); } a = o.u1; } if (L - a > 0.02) { addBoxCollider(ext, a, -t, L, 0, 0, H + 3); if (cell) addBoxCollider(ins, a, -t, L, 0, 0, H + 3); } }
    for (const m of faces) m.pop();
  }
  // ── floor, plinth ──
  inner(); if (spec.floor === 'stone') ins.mat(MAT.COBBLE, [1, 1, 1], 1.4); else ins.mat(MAT.PLANKS, COL.woodDark);
  ins.quad([-w / 2 + t, 0.02, -hd + t], [-w / 2 + t, 0.02, hd - t], [w / 2 - t, 0.02, hd - t], [w / 2 - t, 0.02, -hd + t], 0, 0, (w - 2 * t) / ins.tile, (d - 2 * t) / ins.tile);
  outer(); ext.mat(MAT.STONE, [0.92, 0.92, 0.92]); ext.grad = [1, 0.6]; ext.box(-w / 2 - 0.07, -1.7, -hd - 0.07, w / 2 + 0.07, 0, hd + 0.07, 4); ext.grad = null;
  addFloor(ins, -w / 2, -hd, w / 2, hd, 0.02);
  // ── roof ──
  const thatch = (spec.roof || 'thatch') === 'thatch', rt = thatch ? 0.30 : 0.10, ov = spec.overhang || 0.55, og = 0.4, X = w / 2 + og;
  const eY = H - ov * tanP, sl = (hd + ov) / Math.cos(P), rc = spec.roofCol || (thatch ? [1, 1, 1] : [0.9, 0.85, 0.8]), rl = thatch ? MAT.THATCH : MAT.SHINGLE;
  outer(); ext.mat(rl, rc);
  ext.quad([X, ridgeY + rt, 0], [X, eY + rt, -(hd + ov)], [-X, eY + rt, -(hd + ov)], [-X, ridgeY + rt, 0], 0, 0, 2 * X / ext.tile, sl / ext.tile);
  ext.quad([-X, ridgeY + rt, 0], [-X, eY + rt, hd + ov], [X, eY + rt, hd + ov], [X, ridgeY + rt, 0], 0.37, 0, 0.37 + 2 * X / ext.tile, sl / ext.tile);
  // edges
  ext.mat(rl, v3.scale(rc, 0.72)); ext.ao = 0.8;
  ext.quad([X, eY + rt, -(hd + ov)], [X, eY, -(hd + ov)], [-X, eY, -(hd + ov)], [-X, eY + rt, -(hd + ov)], 0, 0, 2 * X / ext.tile, 0.12);
  ext.quad([-X, eY + rt, hd + ov], [-X, eY, hd + ov], [X, eY, hd + ov], [X, eY + rt, hd + ov], 0, 0, 2 * X / ext.tile, 0.12);
  for (const s of [-1, 1]) {
    ext.poly(s > 0 ? [[X, eY, -(hd + ov)], [X, eY + rt, -(hd + ov)], [X, ridgeY + rt, 0], [X, ridgeY, 0]] : [[-X, eY + rt, -(hd + ov)], [-X, eY, -(hd + ov)], [-X, ridgeY, 0], [-X, ridgeY + rt, 0]]);
    ext.poly(s > 0 ? [[X, eY + rt, hd + ov], [X, eY, hd + ov], [X, ridgeY, 0], [X, ridgeY + rt, 0]] : [[-X, eY, hd + ov], [-X, eY + rt, hd + ov], [-X, ridgeY + rt, 0], [-X, ridgeY, 0]]);
  }
  ext.ao = 1;
  if (thatch) { ext.mat(MAT.THATCH, v3.scale(rc, 0.85)); ext.push().T(-X - 0.03, ridgeY + rt - 0.07, 0).RZ(-PI / 2); ext.lathe([[0.24, 0], [0.24, 2 * X + 0.06]], 8, 3); ext.pop(); }
  else { ext.mat(MAT.TIMBER, timberC); ext.box(-X - 0.02, ridgeY + rt - 0.03, -0.09, X + 0.02, ridgeY + rt + 0.06, 0.09);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ext.beam([sx * (X + 0.02), eY + rt * 0.5, sz * (hd + ov)], [sx * (X + 0.02), ridgeY + rt * 0.5, 0], 0.05, 0.2); }
  // undersides: eaves + gable overhangs outside, the rest inside
  ext.mat(MAT.PLANKS, COL.woodDark); ext.ao = 0.5;
  for (const s of [-1, 1]) {
    const q = (x0, x1, z0, z1, M) => { M = M || ext; const a = [x0, roofY(z0), s * z0], b = [x0, roofY(z1), s * z1], c = [x1, roofY(z1), s * z1], e = [x1, roofY(z0), s * z0]; if (s < 0) M.quad(a, b, c, e); else M.quad(e, c, b, a); };
    outer(); ext.ao = 0.5; q(-X, X, hd - t, hd + ov); q(-X, -w / 2 + t, 0, hd - t); q(w / 2 - t, X, 0, hd - t);
    if (!spec.ceiling) { inner(); ins.mat(MAT.PLANKS, COL.woodDark); ins.ao = INT_AO * 0.9; q(-w / 2 + t, w / 2 - t, 0, hd - t, ins); }
  }
  // ── interior roof timbers ──
  int.mat(MAT.TIMBER, timberC);
  if (spec.ceiling) {
    inner(); ins.mat(MAT.PLANKS, COL.wood); ins.ao = INT_AO * 0.85;
    ins.quad([-w / 2 + t, H, hd - t], [-w / 2 + t, H, -hd + t], [w / 2 - t, H, -hd + t], [w / 2 - t, H, hd - t]);
    for (let x = -w / 2 + t + 0.6; x < w / 2 - t; x += 1.2) int.box(x - 0.07, H - 0.16, -hd + t, x + 0.07, H, hd - t, 8);
  } else {
    const nb = Math.max(1, Math.round((w - 2 * t) / 2.5)), xs = []; for (let i = 1; i <= nb; i++) xs.push(-w / 2 + t + (w - 2 * t) * i / (nb + 1));
    for (const x of xs) {
      if (!(spec.noTie && spec.noTie(x))) { int.box(x - 0.09, H - 0.2, -hd + t, x + 0.09, H, hd - t); int.box(x - 0.07, H, -0.07, x + 0.07, ridgeY - 0.2, 0.07, 4); }
      for (const s of [-1, 1]) int.beam([x, roofY(hd - t) - 0.10, s * (hd - t - 0.02)], [x, ridgeY - 0.12, s * 0.02], 0.1, 0.14);
    }
    for (let i = 0; i <= nb; i++) { const x = lerp(-w / 2 + t + 0.15, w / 2 - t - 0.15, (i + 0.5) / (nb + 1)); for (const s of [-1, 1]) int.beam([x, roofY(hd - t) - 0.08, s * (hd - t - 0.02)], [x, ridgeY - 0.10, s * 0.02], 0.07, 0.1); }
    int.box(-w / 2 + t, ridgeY - 0.24, -0.07, w / 2 - t, ridgeY - 0.1, 0.07);
    for (const s of [-1, 1]) { const z = s * (hd - t) * 0.5; int.box(-w / 2 + t, roofY(z) - 0.2, z - 0.06, w / 2 - t, roofY(z) - 0.08, z + 0.06); }
  }
  ext.ao = 1; ext.m1 = 0; ins.ao = 1; ins.m1 = 0;
  // ctx.site / ctx.ext / ctx.Ms are the INTERIOR frame (what the furnishing code builds in); ctx.xsite / xext / Mx are the shell on the village site
  const ctx = {
    site: isite, xsite: site, cell, zone, w, d, H, t, hd, ext: ins, xext: ext, int, glow, R, floorY, xFloorY, ridgeY, roofY, spec, doors: doorList, xdoors: xdoorList, kit, Ms, Mx, openings, tanP, zoneInfo: zinfo,
    world: (x, y, z) => m4.tp(Ms, [x, y, z]),
    spot(name, x, z, yawLocal, y, extra) { const p = m4.tp(Ms, [x, y || 0.02, z]); World.spots[site.id + '.' + name] = Object.assign({ p, yaw: isite.yaw + (yawLocal || 0), zone, site: site.id }, extra || {}); },
    // hearth against a wall. frame: origin on the inner wall face, +x into the room. (x, z) = house-local position, rot = RY angle
    fireplace(x, z, rot, opt) {
      opt = opt || {}; const wid = opt.w || 1.9, dep = 0.8, m = int; ctx.hearth = { x, z, rot, wid, dep }; World.zones[zone - 1].hearth = [x, z, wid];
      m.push().T(x, 0, z).RY(rot);
      m.mat(MAT.STONE, [0.95, 0.93, 0.9], 0.8);
      m.box(0, 0, -wid / 2, dep, 1.15, -wid / 2 + 0.38); m.box(0, 0, wid / 2 - 0.38, dep, 1.15, wid / 2);
      m.box(0, 1.15, -wid / 2, dep, 1.5, wid / 2); m.box(0, 0, -wid / 2 + 0.38, 0.14, 1.15, wid / 2 - 0.38, 1 | 4 | 8);
      m.box(0, 0, -wid / 2 - 0.15, dep + 0.4, 0.07, wid / 2 + 0.15, 4);
      const lz = m4.tp(m4.mul(m4.create(), m4.rotY(m4.translate(m4.create(), x, 0, z), rot), m4.create()), [dep * 0.5, 0, 0])[2];
      const top = roofY(lz);
      m.box(0, 1.5, -wid / 2 + 0.25, dep - 0.15, spec.ceiling ? H : top - 0.03, wid / 2 - 0.25, 8);
      m.mat(MAT.TIMBER, COL.woodDark); m.box(-0.0, 1.5, -wid / 2 - 0.1, dep + 0.12, 1.6, wid / 2 + 0.1);
      m.mat(MAT.PLAIN, [0.07, 0.06, 0.06]); m.quad([0.145, 1.15, wid / 2 - 0.38], [0.145, 0.07, wid / 2 - 0.38], [0.145, 0.07, -wid / 2 + 0.38], [0.145, 1.15, -wid / 2 + 0.38]);
      at(m, dep * 0.55, 0.07, 0, PI / 2, () => Props.logs(m, 3, 0.55, 0.06));
      emit(m, 1.3, () => { m.mat(MAT.PLAIN, [1, 0.35, 0.08]); m.box(dep * 0.25, 0.07, -0.28, dep * 0.85, 0.10, 0.28, 4); });
      const fp = wp(m, dep * 0.55, 0.2, 0);
      World.emitters.push({ type: 'fire', p: fp, size: opt.size || 0.5, zone });
      addLight(wp(m, dep + 0.7, 0.85, 0), opt.r || 9.5, opt.c || [3.4, 1.75, 0.62], zone, 'fire');
      if (opt.cauldron) { at(m, dep * 0.55, 0.42, 0, 0, () => Props.cauldron(m, 0.2)); m.mat(MAT.METAL, COL.black); m.box(dep * 0.55 - 0.01, 0.7, -0.01, dep * 0.55 + 0.01, 1.15, 0.01); }
      addBoxCollider(m, 0, -wid / 2 - 0.1, dep + 0.25, wid / 2 + 0.1, 0, 2);
      // chimney stack above the roof
      const sp = wp(m, dep * 0.5 - 0.02, 0, 0); m.pop();
      const l = worldToSite(isite, sp[0], sp[2]);
      if (kit) { kitChimney(ctx, l[0], l[1]); ctx.fire = fp; return; }
      outer(); ext.mat(MAT.STONE, [0.95, 0.93, 0.9], 0.8);
      const y0 = roofY(l[1]) - 0.5, y1 = Math.max(ridgeY + 0.9, roofY(l[1]) + 1.5);
      ext.cbox(l[0], y0, l[1], 0.85, y1 - y0, 0.85, 4); ext.cbox(l[0], y1, l[1], 1.02, 0.14, 1.02);
      ext.mat(MAT.PLAIN, [0.05, 0.05, 0.05]); ext.cbox(l[0], y1 + 0.14, l[1], 0.5, 0.01, 0.5, 4);
      World.emitters.push({ type: 'smoke', p: m4.tp(Mx, [l[0], y1 + 0.2, l[1]]), zone: 0 });
      ctx.fire = fp;
    },
    solid(x0, z0, x1, z1, h) { addBoxCollider(int, x0, z0, x1, z1, 0, h || 1); },
    interact(x, y, z, o) { const it = Object.assign({ p: m4.tp(Ms, [x, y, z]), r: 2.0, zone }, o); World.interact.push(it); return it; },
  };
  const planned = !!(kit && cell && typeof planWanted === 'function' && planWanted(site, spec));
  ctx.planned = planned;
  if (kit) kitShell(ctx);
  if (planned) {          // the interior is a plan (72d_plan.js): drop the shell-shaped room the generator made and build the plan on the same door instead
    for (const mm of [ins, int]) { mm.nv = 0; mm.ni = 0; mm.min = [1e9, 1e9, 1e9]; mm.max = [-1e9, -1e9, -1e9]; }
    const cellSide = x => x > CELL.x0 - CELL.half;
    for (let i = World.colliders.length - 1; i >= col0; i--) if (cellSide(World.colliders[i].x)) World.colliders.splice(i, 1);
    for (let i = World.floors.length - 1; i >= fl0; i--) if (cellSide(World.floors[i].x)) World.floors.splice(i, 1);
    for (let i = World.lights.length - 1; i >= lt0; i--) if (cellSide(World.lights[i].p[0])) World.lights.splice(i, 1);
    planBuild(ctx);
  } else if (kit && typeof UPPER !== 'undefined' && UPPER[site.id] && !(TEST && TEST.noUpper)) UPPER[site.id](ctx);       // stairs and upper floor first, so the ground-floor furniture goes round them
  if (!planned && spec.interior) spec.interior(ctx);
  if (kit && !planned) kitDress(ctx);
  if (kit && !planned && ctx.needUpper && !ctx.upperDone) upperFloor(ctx, {});        // a building whose interior did not build its own second storey still gets a closed one
  int.grad = null;
  if (cell) {
    int.append(ins);          // the interior's wall faces, floor and ceiling travel with the rest of the cell's generated meshes
    cell.floorY = floorY; cell.zone = zone; cell.door = doorList[0]; cell.xdoor = xdoorList[0]; cell.w = w; cell.d = d; cell.ctx = ctx;
    if (cell.door && cell.xdoor) Cells.portals(cell, site);
  }
  World.houses[site.id] = { spec, kit: !!kit, site, isite, zone, ctx, floorY, xFloorY, door: doorList[0], xdoor: xdoorList[0], cell, plan: ctx.plan || null }; // [fx2] spec and kit kept for the survey
  return { ext, int, glow, ctx, cell };
}
