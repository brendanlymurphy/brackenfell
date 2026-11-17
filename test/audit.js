// Audit: coplanar and near-coplanar overlapping faces inside the cells (z-fighting candidates) and gaps. Needs --opt audit=1 (hooks in 44_kit.js and 31_mesh.js record every placed piece).
// usage: node test/shot.mjs --opt webgl=1 --opt audit=1 --do "window.__cells=['inn']; $(cat test/audit.js)"
// A pair is reported when two triangles lie in one plane within 8 mm (any facing) and overlap by more than 4 cm^2.
const only = window.__cells, TOL = window.__tol || 0.008, MINA = window.__mina || 0.0004, rep = {}, tot = {};
const cellOf = (x, y, z) => Cells.at(x, y, z);
const tris = {};            // cell id -> [{ p: [9 floats], n, d, src }]
const push = (c, a, b, c2, src) => {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c2[0] - a[0], vy = c2[1] - a[1], vz = c2[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-7) return; nx /= l; ny /= l; nz /= l;
  (tris[c.id] = tris[c.id] || []).push({ p: [a[0], a[1], a[2], b[0], b[1], b[2], c2[0], c2[1], c2[2]], n: [nx, ny, nz], d: nx * a[0] + ny * a[1] + nz * a[2], src, ix: pushIx });
};
const V = new THREE.Vector3(); let pushIx = 0;
for (const it of window.__AUDIT_KIT || []) {
  const p = Kit.pieces[it.name]; if (!p) continue;
  for (const pr of p.prims) {
    const W = []; for (let i = 0; i < pr.pos.length; i += 3) { V.set(pr.pos[i], pr.pos[i + 1], pr.pos[i + 2]).applyMatrix4(it.M); W.push([V.x, V.y, V.z]); }
    const c = cellOf(W[0][0], W[0][1], W[0][2]); if (!c) continue;
    for (let k = 0; k < pr.idx.length; k += 3) push(c, W[pr.idx[k]], W[pr.idx[k + 1]], W[pr.idx[k + 2]], it.name + ':' + pr.mat);
  }
}
let mi = 0;
for (const m of window.__AUDIT_MESH || []) {
  mi++; if (m.noAudit) continue; const f = m.f, ix = m.indices, W = i => [f[i * 8], f[i * 8 + 1], f[i * 8 + 2]]; if (!m.nv) continue;
  const c = cellOf(f[0], f[1], f[2]); if (!c) continue;
  for (let k = 0; k < ix.length; k += 3) { pushIx = k / 3 | 0; push(c, W(ix[k]), W(ix[k + 1]), W(ix[k + 2]), 'mesh' + mi + ':l' + (m.u8[ix[k] * 32 + 28]) + ':' + ((m.own || []).find(o => k >= o[0] && k < o[1]) || [0, 0, '?'])[2]); }
}
// 2D overlap area of two coplanar triangles: clip a by b (Sutherland-Hodgman) in the plane's basis
const area2 = (P) => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
const clip = (S, A, B) => { let out = S; const ccw = ((B[0] - A[0]) * 0); for (const [ax, ay, bx, by, sg] of [[...A, ...B, 1]]) { } return out; };
function overlap(t1, t2) {
  const n = t1.n; let ax = Math.abs(n[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0];
  let u = [ax[1] * n[2] - ax[2] * n[1], ax[2] * n[0] - ax[0] * n[2], ax[0] * n[1] - ax[1] * n[0]]; const ul = Math.hypot(...u); u = u.map(v => v / ul); const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const pr = t => [0, 3, 6].map(i => [t.p[i] * u[0] + t.p[i + 1] * u[1] + t.p[i + 2] * u[2], t.p[i] * v[0] + t.p[i + 1] * v[1] + t.p[i + 2] * v[2]]);
  let A = pr(t1), B = pr(t2);
  const sgn = P => ((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0])) > 0 ? 1 : -1;
  if (sgn(B) < 0) B = [B[0], B[2], B[1]];
  let poly = A;
  for (let i = 0; i < 3 && poly.length; i++) {
    const e0 = B[i], e1 = B[(i + 1) % 3], side = q => (e1[0] - e0[0]) * (q[1] - e0[1]) - (e1[1] - e0[1]) * (q[0] - e0[0]), out = [];
    for (let j = 0; j < poly.length; j++) {
      const a = poly[j], b = poly[(j + 1) % poly.length], sa = side(a), sb = side(b);
      if (sa >= 0) out.push(a);
      if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    poly = out;
  }
  return poly.length >= 3 ? area2(poly) : 0;
}
const out = {}, samples = {}, ex = {};
for (const c of Cells.list) {
  if (only && !only.includes(c.id)) continue; const T = tris[c.id] || []; let pairs = 0, area = 0; const by = new Map();
  for (const t of T) {                       // normalise the normal's sign so opposite facings share a bucket
    let s = 1; if (t.n[0] < -1e-4 || (Math.abs(t.n[0]) <= 1e-4 && (t.n[1] < -1e-4 || (Math.abs(t.n[1]) <= 1e-4 && t.n[2] < 0)))) s = -1;
    t.q = [t.n[0] * s, t.n[1] * s, t.n[2] * s]; t.dd = t.d * s;
    const key = Math.round(t.q[0] * 40) + ',' + Math.round(t.q[1] * 40) + ',' + Math.round(t.q[2] * 40), k2 = Math.floor(t.dd / 0.02);
    for (const kk of [k2, k2 + 1]) { const K = key + '|' + kk; (by.get(K) || by.set(K, []).get(K)).push(t); }
  }
  const seen = new Set();
  for (const [K, L] of by) {
    if (L.length < 2) continue;
    const bb = L.map(t => { const xs = [t.p[0], t.p[3], t.p[6]], ys = [t.p[1], t.p[4], t.p[7]], zs = [t.p[2], t.p[5], t.p[8]]; return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), Math.min(...zs), Math.max(...zs)]; });
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j]; if (a === b || Math.abs(a.dd - b.dd) > TOL) continue;
      if (Math.abs(a.q[0] - b.q[0]) + Math.abs(a.q[1] - b.q[1]) + Math.abs(a.q[2] - b.q[2]) > 0.03) continue;
      const A = bb[i], B = bb[j]; if (A[0] > B[1] || B[0] > A[1] || A[2] > B[3] || B[2] > A[3] || A[4] > B[5] || B[4] > A[5]) continue;
      const same = (a.n[0] * b.n[0] + a.n[1] * b.n[1] + a.n[2] * b.n[2]) > 0, isKit = !a.src.startsWith('mesh') || !b.src.startsWith('mesh'); if (!same && !isKit) continue; const ov = overlap(a, b);
      if (ov > MINA) { pairs++; area += ov; { const gk = [a.src.replace(/^mesh\d+/, 'mesh'), b.src.replace(/^mesh\d+/, 'mesh')].sort().join(' x ') + ' n' + a.q.map(v => Math.round(v)).join(',') , G = (window.__AG = window.__AG || {})[gk] || ((window.__AG)[gk] = { pairs: 0, area: 0, cells: new Set() }); G.pairs++; G.area += ov; G.cells.add(c.id); if (!G.ex) G.ex = [c.id, a.p.map(v => +v.toFixed(2)), b.p.map(v => +v.toFixed(2)), a.dd.toFixed(3), b.dd.toFixed(3)]; } const kk = [a.src, b.src].sort().join(' x '); samples[c.id + ' ' + kk] = (samples[c.id + ' ' + kk] || 0) + ov; if (!ex[c.id + ' ' + kk]) ex[c.id + ' ' + kk] = [a.q.map(v => +v.toFixed(2)), +a.dd.toFixed(3), +b.dd.toFixed(3), a.p.map(v => +v.toFixed(2)), b.p.map(v => +v.toFixed(2)), a.ix, b.ix]; }
    }
  }
  out[c.id] = { tris: T.length, pairs, area: +area.toFixed(2) };
}
const worst = Object.entries(samples).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ' ' + v.toFixed(2) + 'm2 ' + JSON.stringify(ex[k]));
const groups = Object.entries(window.__AG || {}).sort((a, b) => b[1].pairs - a[1].pairs).slice(0, 40).map(([k, v]) => k + ' | pairs ' + v.pairs + ' area ' + v.area.toFixed(1) + ' cells ' + v.cells.size + ' ex ' + JSON.stringify(v.ex));
return JSON.stringify({ out, worst, groups }, null, 0);
