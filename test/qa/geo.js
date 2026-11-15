// Geometry checks from world data, no rendering. Needs --opt audit=1 (piece and mesh hooks). QA.geo([kinds]) returns { defects: [...], stats }.
// Each defect: { k: kind, area: site or place id, x, y, z, d: detail, n: weight }
window.QA.geoChecks = {};
window.QA.geo = (only) => {
const want = k => !only || only.includes(k), D = [], stats = {}, push = (k, area, x, y, z, d, n) => D.push({ k, area, x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1), d, n: n === undefined ? 1 : +(+n).toFixed(2) });
const OUT = (x, y) => x < 190 && y > -100;                               // outdoors (cells live at x >= 190, y = -400)
// ---- which site or place a point belongs to ----
const areaAt = (x, z, y) => {
  if (x >= 190) { const c = Cells.at(x, y === undefined ? CELL.y : y, z); return c ? 'cell.' + c.id : 'cell?'; }
  let b = null, bd = 1e9; for (const s of SITES) { const r = Math.max(s.w, s.d) * 0.75 + 6, d = hyp(s.x - x, s.z - z); if (d < r && d - r < bd) { bd = d - r; b = s.id; } }
  if (b) return b; for (const p of WILDS.places) if (hyp(p.x - x, p.z - z) < p.r + 6) return 'wild.' + p.id;
  for (const p of World.places) if (hyp(p.x - x, p.z - z) < p.r) return p.id; return 'open@' + Math.round(x / 40) * 40 + ',' + Math.round(z / 40) * 40;
};
window.QA.areaAt = areaAt;
const col = World.colliders.filter(c => c.y0 > -100), flr = World.floors.filter(f => f.y > -100);
const obb = c => c.r !== undefined ? null : c;
const inObb = (c, x, z, m) => { if (c.r !== undefined) return hyp(x - c.x, z - c.z) < c.r + m; const dx = x - c.x, dz = z - c.z, lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz; return Math.abs(lx) < c.hx + m && Math.abs(lz) < c.hz + m; };
const waterDepth = (x, z) => { const w = World.waterAt(x, z); return w < -900 ? 0 : w - Terrain.y(x, z); };
// highest solid surface under (x, z) that is not above y: terrain, floors, collider tops
const surfaceUnder = (x, z, y) => { let b = Terrain.y(x, z); for (const f of flr) { if (Math.abs(f.x - x) > f.hx + f.hz + 0.3 || Math.abs(f.z - z) > f.hx + f.hz + 0.3) continue; const h = floorHeight(f, x, z); if (h !== null && h <= y && h > b) b = h; } for (const c of col) if (c.y1 <= y && c.y1 > b && inObb(c, x, z, 0)) b = c.y1; return b; };

// ================= 1. coplanar faces (z-fighting) on everything outdoors =================
if (want('coplanar')) {
  const K = window.__AUDIT_KIT || [], Mh = window.__AUDIT_MESH || [], P = [], Nn = [], Dd = [], SRC = [], ITEM = [], names = [], nameIx = {}; let item = 0;
  const addTri = (a, b, c, src, it) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-7) return;
    nx /= l; ny /= l; nz /= l; let s = 1; if (nx < -1e-4 || (Math.abs(nx) <= 1e-4 && (ny < -1e-4 || (Math.abs(ny) <= 1e-4 && nz < 0)))) s = -1;
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); Nn.push(nx * s, ny * s, nz * s, s); Dd.push((nx * a[0] + ny * a[1] + nz * a[2]) * s); SRC.push(src); ITEM.push(it);
  };
  const V = new THREE.Vector3(); const nm = n => nameIx[n] === undefined ? (nameIx[n] = names.push(n) - 1) : nameIx[n];
  for (const it of K) { const p = Kit.pieces[it.name]; if (!p) continue; item++; const sid = nm(it.name);
    for (const pr of p.prims) { const W = []; for (let i = 0; i < pr.pos.length; i += 3) { V.set(pr.pos[i], pr.pos[i + 1], pr.pos[i + 2]).applyMatrix4(it.M); W.push([V.x, V.y, V.z]); }
      if (W[0][1] < -100 || W[0][0] > 190) continue; const sm = nm(it.name + ':' + pr.mat); for (let k = 0; k < pr.idx.length; k += 3) addTri(W[pr.idx[k]], W[pr.idx[k + 1]], W[pr.idx[k + 2]], sm, item); } }
  let mi = 0; for (const m of Mh) { mi++; if (!m.nv) continue; const f = m.f, ix = m.indices; if (f[1] < -100 || f[0] > 190) continue; item++; const sid = nm('mesh'); const lay = i => m.u8[i * 32 + 28]; const W = i => [f[i * 8], f[i * 8 + 1], f[i * 8 + 2]];
    for (let k = 0; k < ix.length; k += 3) { const sl = nm('mesh:l' + lay(ix[k])); addTri(W(ix[k]), W(ix[k + 1]), W(ix[k + 2]), sl, -mi); } }
  const T = Dd.length; stats.coplanarTris = T;
  const by = new Map(), CS = 2.5;
  for (let t = 0; t < T; t++) {
    const o = t * 9, x0 = Math.min(P[o], P[o + 3], P[o + 6]), x1 = Math.max(P[o], P[o + 3], P[o + 6]), z0 = Math.min(P[o + 2], P[o + 5], P[o + 8]), z1 = Math.max(P[o + 2], P[o + 5], P[o + 8]);
    const gx0 = Math.floor(x0 / CS), gx1 = Math.min(Math.floor(x1 / CS), gx0 + 3), gz0 = Math.floor(z0 / CS), gz1 = Math.min(Math.floor(z1 / CS), gz0 + 3), q = t * 4, k2 = Math.floor(Dd[t] / 0.02), nk = Math.round(Nn[q] * 40) * 10000 + Math.round(Nn[q + 1] * 40) * 100 + Math.round(Nn[q + 2] * 40);
    for (const kk of [k2, k2 + 1]) for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) { const K_ = nk + '|' + kk + '|' + gx + '|' + gz; let l = by.get(K_); if (!l) by.set(K_, l = []); l.push(t); }
  }
  const area2 = Q => { let s = 0; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  const overlap = (a, b) => {
    const n = [Nn[a * 4], Nn[a * 4 + 1], Nn[a * 4 + 2]], ax = Math.abs(n[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0]; let u = [ax[1] * n[2] - ax[2] * n[1], ax[2] * n[0] - ax[0] * n[2], ax[0] * n[1] - ax[1] * n[0]]; const ul = Math.hypot(...u); u = u.map(v => v / ul); const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const pr = t => [0, 3, 6].map(i => [P[t * 9 + i] * u[0] + P[t * 9 + i + 1] * u[1] + P[t * 9 + i + 2] * u[2], P[t * 9 + i] * v[0] + P[t * 9 + i + 1] * v[1] + P[t * 9 + i + 2] * v[2]]);
    let A = pr(a), B = pr(b); const sgn = Q => ((Q[1][0] - Q[0][0]) * (Q[2][1] - Q[0][1]) - (Q[1][1] - Q[0][1]) * (Q[2][0] - Q[0][0])) > 0 ? 1 : -1; if (sgn(B) < 0) B = [B[0], B[2], B[1]];
    let poly = A; for (let i = 0; i < 3 && poly.length; i++) { const e0 = B[i], e1 = B[(i + 1) % 3], side = q => (e1[0] - e0[0]) * (q[1] - e0[1]) - (e1[1] - e0[1]) * (q[0] - e0[0]), out = []; for (let j = 0; j < poly.length; j++) { const p0 = poly[j], p1 = poly[(j + 1) % poly.length], sa = side(p0), sb = side(p1); if (sa >= 0) out.push(p0); if ((sa >= 0) !== (sb >= 0)) { const tt = sa / (sa - sb); out.push([p0[0] + (p1[0] - p0[0]) * tt, p0[1] + (p1[1] - p0[1]) * tt]); } } poly = out; }
    return poly.length >= 3 ? area2(poly) : 0;
  };
  const agg = new Map(), seen = new Set(); let pairs = 0;
  for (const L of by.values()) {
    if (L.length < 2 || L.length > 400) continue;
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j]; if (ITEM[a] === ITEM[b] && ITEM[a] > 0) continue; if (Math.abs(Dd[a] - Dd[b]) > 0.008) continue;
      if (Math.abs(Nn[a * 4] - Nn[b * 4]) + Math.abs(Nn[a * 4 + 1] - Nn[b * 4 + 1]) + Math.abs(Nn[a * 4 + 2] - Nn[b * 4 + 2]) > 0.03) continue;
      const pk = a < b ? a * 4194304 + b : b * 4194304 + a; if (seen.has(pk)) continue;
      const oa = a * 9, ob = b * 9; let ok = true; for (const k of [0, 1, 2]) { const lo1 = Math.min(P[oa + k], P[oa + 3 + k], P[oa + 6 + k]), hi1 = Math.max(P[oa + k], P[oa + 3 + k], P[oa + 6 + k]), lo2 = Math.min(P[ob + k], P[ob + 3 + k], P[ob + 6 + k]), hi2 = Math.max(P[ob + k], P[ob + 3 + k], P[ob + 6 + k]); if (lo1 > hi2 || lo2 > hi1) { ok = false; break; } } if (!ok) continue;
      const same = Nn[a * 4 + 3] === Nn[b * 4 + 3] ? (names[SRC[a]].startsWith('mesh') && names[SRC[b]].startsWith('mesh')) : false;
      const bothMesh = names[SRC[a]].startsWith('mesh') && names[SRC[b]].startsWith('mesh'); if (bothMesh && Nn[a * 4 + 3] !== Nn[b * 4 + 3]) continue;   // opposite facings of two mesh faces: back to back, not z-fighting
      seen.add(pk); const ov = overlap(a, b); if (ov < 0.0004) continue; pairs++;
      const cx = (P[oa] + P[oa + 3] + P[oa + 6]) / 3, cy = (P[oa + 1] + P[oa + 4] + P[oa + 7]) / 3, cz = (P[oa + 2] + P[oa + 5] + P[oa + 8]) / 3, ar = areaAt(cx, cz), key = ar + ' | ' + [names[SRC[a]], names[SRC[b]]].sort().join(' x ');
      let e = agg.get(key); if (!e) agg.set(key, e = { ar, key, m2: 0, n: 0, x: cx, y: cy, z: cz }); e.m2 += ov; e.n++;
    }
  }
  stats.coplanarPairs = pairs;
  for (const e of agg.values()) if (e.m2 > 0.01) push('coplanar', e.ar, e.x, e.y, e.z, e.key.split(' | ')[1] + ' ' + e.m2.toFixed(2) + ' m2 x' + e.n, e.m2);
}
for (const f of window.QA.geoParts || []) f({ want, push, stats, areaAt, col, flr, inObb, waterDepth, surfaceUnder });
return { defects: D, stats };
};
