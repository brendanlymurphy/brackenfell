// ───────────────────────── [l1] baked contact: soft dark pools under furniture, window data for the window light ─────────────────────────
// A post-step over the plan engine's output (called from one marked line at the end of planBuild in 72e_plans.js). It reads the plan's records, never
// changes them, and adds two things to the cell:
//   c.cell.decal  one merged mesh of soft dark pools on the floor round everything that stands on it (kind 'decal' in the pack, one draw call per cell);
//   c.cell.wins   the windows in world space, which SH.winSet (40c_light.js) turns into the cell's daylight.
// The pool is a ring: 4 inner vertices (alpha A, under the object) and 4 outer vertices (alpha 0, a margin away), so the shade fades out smoothly.
const Bake = { on: !(typeof TEST !== 'undefined' && TEST && TEST.bake === 0), stats: { pools: 0, wins: 0 } };
Bake.mat = function () {
  const { vec4, vec3, attribute, clamp, smoothstep } = TSL;
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  m.fog = false; m.toneMapped = false; m.side = THREE.DoubleSide; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  const a = attribute('tint', 'vec4').a, t = clamp(a.div(0.7), 0, 1);
  m.colorNode = vec4(vec3(0.0), t.mul(t).mul(t.mul(-2).add(3)).mul(0.7));
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
  const cell = P.c.cell, m = new Mesh(512); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.layer = 0; m.cr = m.cg = m.cb = 0; m.grad = null; m.wind = 0;
  const T = P.T, ax = [T[0], T[2]], az = [T[8], T[10]];             // canonical x and z axes in world (x, z)
  const w2 = (x, z) => [T[12] + x * ax[0] + z * az[0], T[14] + x * ax[1] + z * az[1]];
  for (const it of P.items) {
    if (it.kind !== 'floor' && it.kind !== 'hearth') continue;
    if ((it.lift || 0) > 0.35 || !(it.x1 > it.x0)) continue;
    const L = P.lv[it.k]; if (!L) continue;
    const h = it.h || 0.5, y = L.y + 0.034;
    const hearth = it.kind === 'hearth', A = hearth ? 0.55 : clamp(0.34 + h * 0.3, 0.38, 0.62), mg = hearth ? 0.5 : clamp(0.14 + h * 0.2, 0.16, 0.42);
    const pad = 0.03, c = [[it.x0 + pad, it.z0 + pad], [it.x1 - pad, it.z0 + pad], [it.x1 - pad, it.z1 - pad], [it.x0 + pad, it.z1 - pad]].map(p => w2(p[0], p[1]));
    const y3 = P.w2(0, y, 0)[1]; Bake.pool(m, y3, c, mg, A); Bake.stats.pools++;
  }
  if (m.ni) cell.decal = m;
  // windows: a pane centre, its inward direction on the floor plane (world), the reach and a strength by size
  cell.wins = [];
  for (const w of P.windows) {
    const wl = w.wall, hor = wl.ax === 'x', L = P.lv[w.k]; if (!L) continue;
    const cx = hor ? w.pos : wl.c, cz = hor ? wl.c : w.pos, dx = hor ? 0 : -wl.ns, dz = hor ? -wl.ns : 0;
    const p0 = P.w2(cx + dx * 0.25, L.y + 1.5, cz + dz * 0.25), p1 = P.w2(cx + dx * 1.25, L.y + 1.5, cz + dz * 1.25);
    const dd = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) || 1;
    cell.wins.push({ p: p0, d: [(p1[0] - p0[0]) / dd, (p1[2] - p0[2]) / dd], r: 7.5, k: 1, k0: w.k });
    Bake.stats.wins++;
  }
};
