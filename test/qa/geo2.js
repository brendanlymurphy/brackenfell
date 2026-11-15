// Geometry checks, part 2 (needs the helpers of geo.js): floating and sunk pieces, colliders, roads, doors, fences, footprints, roofs, walkways, water posts, emitters.
(QA.geoParts = QA.geoParts || []).push(E => {
const { want, push, stats, areaAt, col, flr, inObb, waterDepth, surfaceUnder } = E;
// ================= 2. floating and sunk pieces (kit placements) =================
if (want('float')) {
  const K = (window.__AUDIT_KIT || []).filter(it => Kit.pieces[it.name]), BB = [], V = new THREE.Vector3(), GR = new Map(), CSZ = 4;
  const HANG = /Lantern|Sign|Banner|Shutter|Balcony|Awning|Window|Hook|Flag|Torch|Pennant|Bracket|Vine|Ivy|Beam|Dormer|Cloth|Laundry|Garland|Chimney|Roof|Overhang|Gable|Eave|Ladder|Rope|Bell|Pole|Pipe|Light|Glass|Frame|Stair|Step|Rafter|Floor_|Ceiling|Arch|Lintel|^gen_/i;
  for (const it of K) { const p = Kit.pieces[it.name]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (const cx of [p.min[0], p.max[0]]) for (const cy of [p.min[1], p.max[1]]) for (const cz of [p.min[2], p.max[2]]) { V.set(cx, cy, cz).applyMatrix4(it.M); x0 = Math.min(x0, V.x); x1 = Math.max(x1, V.x); y0 = Math.min(y0, V.y); y1 = Math.max(y1, V.y); z0 = Math.min(z0, V.z); z1 = Math.max(z1, V.z); }
    if (y0 < -100 || x0 > 190) continue; const b = { n: it.name, pack: p.pack, x0, y0, z0, x1, y1, z1 }; BB.push(b);
    for (let gx = Math.floor(x0 / CSZ); gx <= Math.floor(x1 / CSZ); gx++) for (let gz = Math.floor(z0 / CSZ); gz <= Math.floor(z1 / CSZ); gz++) { const k = gx * 4096 + gz; let l = GR.get(k); if (!l) GR.set(k, l = []); l.push(b); } }
  stats.pieces = BB.length; let nf = 0, ns = 0;
  for (const b of BB) {
    const w = b.x1 - b.x0, dd = b.z1 - b.z0, h = b.y1 - b.y0; if (h < 0.08 || w < 0.05 || dd < 0.05) continue;
    const S = [[(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2], [b.x0 + w * 0.2, b.z0 + dd * 0.2], [b.x1 - w * 0.2, b.z0 + dd * 0.2], [b.x0 + w * 0.2, b.z1 - dd * 0.2], [b.x1 - w * 0.2, b.z1 - dd * 0.2]];
    let tmax = -1e9; for (const [x, z] of S) tmax = Math.max(tmax, Terrain.y(x, z));
    const free = b.pack !== 'kits/village.glb';
    if (free && h > 0.3 && !/Grass|Fern|Flower|Clover|Plant|Rock|Stone|Bush|Log|Stump|Tuft|Mushroom|Root/i.test(b.n) && (tmax - b.y0) > h / 3 && (tmax - b.y0) > 0.15) { ns++; push('sunk', areaAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2), (b.x0 + b.x1) / 2, b.y0, (b.z0 + b.z1) / 2, b.n + ' ' + Math.round((tmax - b.y0) / h * 100) + '% under ground (h ' + h.toFixed(2) + ')', (tmax - b.y0) / h); }
    if (HANG.test(b.n) || b.y0 - tmax < 0.12 || !free) continue;
    let sup = false; const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    for (const [x, z] of S) { const s = surfaceUnder(x, z, b.y0 + 0.08); if (b.y0 - s < 0.12) { sup = true; break; } }
    if (!sup) { for (let gx = Math.floor(b.x0 / CSZ); gx <= Math.floor(b.x1 / CSZ) && !sup; gx++) for (let gz = Math.floor(b.z0 / CSZ); gz <= Math.floor(b.z1 / CSZ) && !sup; gz++) for (const o of GR.get(gx * 4096 + gz) || []) { if (o === b) continue; if (o.y1 > b.y0 - 0.12 && o.y1 < b.y0 + 0.3 && o.x0 < b.x1 - 0.05 && o.x1 > b.x0 + 0.05 && o.z0 < b.z1 - 0.05 && o.z1 > b.z0 + 0.05 && o.y0 < b.y0) { sup = true; break; } } }
    if (!sup) { nf++; push('float', areaAt(cx, cz), cx, b.y0, cz, b.n + ' bottom ' + (b.y0 - tmax).toFixed(2) + ' m above ground, nothing under it', b.y0 - tmax); }
  }
  stats.floatPieces = nf; stats.sunkPieces = ns;
}
// ================= 3. colliders: floating, sunk, on roads, before doors, crossing fences =================
const thin = c => c.r === undefined && Math.min(c.hx, c.hz) < 0.16 && Math.max(c.hx, c.hz) > 0.45;
if (want('collider')) {
  let nf = 0, ns = 0;
  for (const c of col) {
    const t0 = Terrain.y(c.x, c.z), h = c.y1 - c.y0, ex = c.r !== undefined ? c.r : hyp(c.hx, c.hz); if (h < 0.15) continue;
    let tmax = t0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) tmax = Math.max(tmax, Terrain.y(c.x + dx * ex * 0.8, c.z + dz * ex * 0.8));
    if (c.y0 - tmax > 0.5 && ex < 5) { const s = surfaceUnder(c.x, c.z, c.y0 + 0.05); if (c.y0 - s > 0.5) { nf++; push('float', areaAt(c.x, c.z), c.x, c.y0, c.z, 'collider bottom ' + (c.y0 - s).toFixed(2) + ' m over the surface below (h ' + h.toFixed(2) + ')', c.y0 - s); } }
  }
  stats.floatColliders = nf; stats.sunkColliders = ns;
}
if (want('road')) {
  const hit = new Map();
  for (const r of Roads) { const L = r.line.len; for (let s = 2; s < L - 2; s += 0.6) { const [x, z] = r.line.point(s); if (x > 190) continue; const gy = Terrain.y(x, z);
    for (let ci = 0; ci < col.length; ci++) { const c = col[ci]; if (c.y1 - gy < 0.35 || c.y0 > gy + 1.2) continue; if (Math.abs(c.x - x) > 8 || Math.abs(c.z - z) > 8) continue; if (!inObb(c, x, z, 0.1)) continue;
      if (flr.some(f => Math.abs(f.y - gy) > 0.4 && floorHeight(f, x, z) !== null)) continue;
      const k = r.id + '|' + ci; if (!hit.has(k)) hit.set(k, { r: r.id, c, x, z, n: 0 }); hit.get(k).n++; } } }
  for (const e of hit.values()) push('road', areaAt(e.x, e.z), e.x, Terrain.y(e.x, e.z), e.z, 'road ' + e.r + ' centre line blocked by a ' + (e.c.r !== undefined ? 'round' : (e.c.hx * 2).toFixed(1) + 'x' + (e.c.hz * 2).toFixed(1)) + ' collider h ' + (e.c.y1 - e.c.y0).toFixed(1) + ' (' + e.n + ' samples)', e.n * 0.6);
}
if (want('door')) {
  for (const s of SITES) { const dl = siteDoorLocal(s, 0), dw = siteToWorld(s, dl[0], dl[1]); let bad = 0, where = '';
    for (const dist of [1.2, 1.8, 2.6]) { const l = siteDoorLocal(s, dist), w = siteToWorld(s, l[0], l[1]), gy = Terrain.y(w[0], w[1]); for (const c of col) { if (c.y1 - gy < 0.35 || c.y0 > gy + 1.2) continue; if (Math.abs(c.x - w[0]) > 8 || Math.abs(c.z - w[1]) > 8) continue; if (inObb(c, w[0], w[1], 0.3)) { bad++; where += ' ' + dist + 'm'; break; } } }
    if (bad) push('door', s.id, dw[0], Terrain.y(dw[0], dw[1]), dw[1], 'solid within 0.3 m of the approach at' + where + ' in front of the door', bad); }
}
if (want('fence')) {
  const T = col.filter(thin).filter(c => c.y1 - c.y0 <= 2.0 && c.y1 - c.y0 >= 0.3 && c.x < 190), seg = c => { const lx = c.hx >= c.hz, hl = lx ? c.hx : c.hz, ux = lx ? c.ax : c.bx, uz = lx ? c.az : c.bz; return [c.x - ux * hl, c.z - uz * hl, c.x + ux * hl, c.z + uz * hl, ux, uz, hl, lx ? c.hz : c.hx]; };
  const S = T.map(seg);
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    const a = S[i], b = S[j]; if (Math.abs(a[0] - b[0]) > 12 || Math.abs(a[1] - b[1]) > 12) continue; if (T[i].y0 > T[j].y1 || T[j].y0 > T[i].y1) continue;
    const cr = Math.abs(a[4] * b[5] - a[5] * b[4]);
    if (cr > 0.34) {
      const d1x = a[2] - a[0], d1z = a[3] - a[1], d2x = b[2] - b[0], d2z = b[3] - b[1], den = d1x * d2z - d1z * d2x; if (Math.abs(den) < 1e-6) continue;
      const t = ((b[0] - a[0]) * d2z - (b[1] - a[1]) * d2x) / den, u = ((b[0] - a[0]) * d1z - (b[1] - a[1]) * d1x) / den;
      if (t > 0.08 && t < 0.92 && u > 0.08 && u < 0.92) { const x = a[0] + d1x * t, z = a[1] + d1z * t; push('fencecross', areaAt(x, z), x, Terrain.y(x, z), z, 'two fence/rail segments cross (' + (T[i].hx * 2).toFixed(1) + 'x' + (T[i].hz * 2).toFixed(1) + ' and ' + (T[j].hx * 2).toFixed(1) + 'x' + (T[j].hz * 2).toFixed(1) + ') at ' + Math.round(Math.asin(Math.min(1, cr)) * 57.3) + ' deg', 2); }
    } else {
      const lat = Math.abs((b[0] - a[0]) * -a[5] + (b[1] - a[1]) * a[4]); if (lat > 0.12) continue; const pa = (b[0] - a[0]) * a[4] + (b[1] - a[1]) * a[5], lo = Math.max(-a[6], pa - b[6]), hi = Math.min(a[6], pa + b[6]);
      if (hi - lo > 0.7 && Math.abs(T[i].y0 - T[j].y0) < 0.2) { const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2; push('fencedouble', areaAt(x, z), x, Terrain.y(x, z), z, 'two parallel fence segments overlap ' + (hi - lo).toFixed(1) + ' m, ' + lat.toFixed(2) + ' m apart', hi - lo); }
    }
  }
  stats.fenceSegs = T.length;
}
// ================= 4. buildings: footprints and roofs that intersect =================
if (want('footprint')) {
  const sat = (A, B) => { let best = 1e9; for (const s of [A, B]) for (const [ax, az] of [[Math.cos(s.yaw), Math.sin(s.yaw)], [-Math.sin(s.yaw), Math.cos(s.yaw)]]) { const pr = o => { const hw = o.w / 2, hd = o.d / 2, c = Math.cos(o.yaw), sn = Math.sin(o.yaw); let lo = 1e9, hi = -1e9; for (const [lx, lz] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) { const x = o.x + lx * c - lz * sn, z = o.z + lx * sn + lz * c, p = x * ax + z * az; lo = Math.min(lo, p); hi = Math.max(hi, p); } return [lo, hi]; }; const p = pr(A), q = pr(B), ov = Math.min(p[1], q[1]) - Math.max(p[0], q[0]); if (ov <= 0) return 0; best = Math.min(best, ov); } return best; };
  const L = SITES.filter(s => s.w && s.d && s.yaw !== undefined); let n = 0;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if (hyp(a.x - b.x, a.z - b.z) > hyp(a.w, a.d) / 2 + hyp(b.w, b.d) / 2) continue; const ov = sat(a, b); if (ov > 0.15) { n++; push('footprint', a.id, (a.x + b.x) / 2, Terrain.y((a.x + b.x) / 2, (a.z + b.z) / 2), (a.z + b.z) / 2, 'footprints of ' + a.id + ' and ' + b.id + ' overlap by ' + ov.toFixed(2) + ' m', ov); } }
  stats.footprintPairs = n;
}
if (want('roofs') && typeof ROOFS !== 'undefined') {
  const inv = ROOFS.map(r => new THREE.Matrix4().fromArray(r.M).invert()), M = ROOFS.map(r => new THREE.Matrix4().fromArray(r.M)), nameOf = r => { const s = SITES.reduce((b, q) => hyp(q.x - r.M[12], q.z - r.M[14]) < hyp(b.x - r.M[12], b.z - r.M[14]) ? q : b, SITES[0]); return s.id; }, ids = ROOFS.map(nameOf);
  const surf = (r, x, z) => { const v = (r.ridgeX ? z - r.zc : x), u = (r.ridgeX ? x : z - r.zc); if (u < r.a0 || u > r.a1 || Math.abs(v) > r.ve) return null; return r.top + r.lift + (r.hs - Math.abs(v)) * r.tanP; };
  const pairs = new Map(), Pv = new THREE.Vector3();
  for (let i = 0; i < ROOFS.length; i++) { const r = ROOFS[i];
    for (let su = r.a0 + 0.3; su < r.a1; su += 0.5) for (const sg of [-1, 1]) for (let sv = 0.15; sv < r.hs; sv += 0.45) {
      const y = r.top + r.lift + (r.hs - sv) * r.tanP - 0.02; Pv.set(r.ridgeX ? su : sg * sv, y, r.ridgeX ? r.zc + sg * sv : r.zc + su).applyMatrix4(M[i]);
      for (let j = 0; j < ROOFS.length; j++) { if (j === i || ids[j] === ids[i]) continue; const q = Pv.clone().applyMatrix4(inv[j]), o = ROOFS[j];
        const wallIn = Math.abs(q.x) < o.w / 2 + 0.02 && Math.abs(q.z) < o.d / 2 + 0.02 && q.y < o.top + 0.001 && q.y > -1, ys = surf(o, q.x, q.z), roofIn = ys !== null && q.y < ys - 0.005 && q.y > ys - o.T - 0.02;
        if (wallIn || roofIn) { const k = ids[i] + ' / ' + ids[j] + (wallIn ? ' (wall)' : ' (roof)'); const e = pairs.get(k) || { n: 0, x: Pv.x, y: Pv.y, z: Pv.z, a: ids[i] }; e.n++; pairs.set(k, e); break; } } } }
  for (const [k, e] of pairs) push('roofhit', e.a, e.x, e.y, e.z, 'roof of ' + k + ': ' + e.n + ' sample points inside', e.n / 10);
  stats.roofs = ROOFS.length;
}
// ================= 5. walkways: floating decks, steps and drops at the ends, posts in water, emitters in solids =================
if (want('walk')) {
  let nl = 0;
  for (const f of flr) {
    if (f.x > 190 || f.y2 !== undefined) continue; const hl = Math.max(f.hx, f.hz), ex = f.hx >= f.hz;
    let gmax = -1e9, wet = 0; for (const [a, b] of [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const lx = a * f.hx * 0.9, lz = b * f.hz * 0.9, x = f.x + lx * f.ax + lz * f.bx, z = f.z + lx * f.az + lz * f.bz; gmax = Math.max(gmax, Terrain.y(x, z)); if (waterDepth(x, z) > 0.1) wet++; }
    if (wet === 0 && f.y - gmax > 0.55 && Math.min(f.hx, f.hz) < 3 && !flr.some(o => o !== f && o.y < f.y - 0.5 && Math.abs(o.x - f.x) < 6 && Math.abs(o.z - f.z) < 6 && floorHeight(o, f.x, f.z) !== null)) { nl++; push('deckfloat', areaAt(f.x, f.z), f.x, f.y, f.z, 'deck ' + (f.hx * 2).toFixed(1) + 'x' + (f.hz * 2).toFixed(1) + ' is ' + (f.y - gmax).toFixed(2) + ' m above land (no water under it)', f.y - gmax); }
    if (Math.min(f.hx, f.hz) > 0.3 && Math.min(f.hx, f.hz) < 3 && f.y > Terrain.y(f.x, f.z) - 0.2) for (const sg of [-1, 1]) {
      const ux = ex ? f.ax : f.bx, uz = ex ? f.az : f.bz, x = f.x + ux * sg * (hl + 0.45), z = f.z + uz * sg * (hl + 0.45), g = World.groundAt(x, z, f.y + 0.62), wd = waterDepth(x, z);
      if (g < f.y - 0.62 && !(wd > 0.1 && g > f.y - 4)) { const joined = flr.some(o => o !== f && Math.hypot(o.x - x, o.z - z) < Math.max(o.hx, o.hz) + 0.6 && Math.abs((o.y2 !== undefined ? Math.max(o.y, o.y2) : o.y) - f.y) < 1.4); if (!joined) push('walkdrop', areaAt(x, z), x, f.y, z, 'walkway end drops ' + (f.y - g).toFixed(2) + ' m (limit 0.62): ' + (f.hx * 2).toFixed(1) + 'x' + (f.hz * 2).toFixed(1) + ' deck at y ' + f.y.toFixed(2), f.y - g); }
    }
  }
  stats.decksFloating = nl;
}
if (want('water')) {
  for (const c of col) { if (c.x > 190 || (c.r !== undefined && c.r > 1) || (c.r === undefined && Math.max(c.hx, c.hz) > 0.6)) continue; if (c.y1 - c.y0 < 0.5) continue; const wd = waterDepth(c.x, c.z); if (wd < 0.3) continue;
    const piles = flr.some(f => (f.y > c.y0 && floorHeight(f, c.x, c.z) !== null) || Math.hypot(f.x - c.x, f.z - c.z) < Math.max(f.hx, f.hz) + 0.8); if (!piles) push('waterpost', areaAt(c.x, c.z), c.x, c.y0, c.z, 'post/pole standing in ' + wd.toFixed(1) + ' m of water with no deck above it (h ' + (c.y1 - c.y0).toFixed(1) + ')', wd); }
}
if (want('emitter')) {
  for (const e of World.emitters) { const p = e.p; if (!p) continue; const x = p[0], y = p[1], z = p[2]; if (x < 190) { const t = Terrain.y(x, z); if (y < t - 0.05 && e.type !== 'splash' && e.type !== 'ripple') push('emitter', areaAt(x, z), x, y, z, e.type + ' emitter ' + (t - y).toFixed(2) + ' m under the ground', t - y); }
    for (const c of World.colliders) { if (Math.abs(c.x - x) > 8 || Math.abs(c.z - z) > 8) continue; if (!(x > 190 && /fire|candle|lantern/.test(e.type)) && y > c.y0 + 0.08 && y < c.y1 - 0.08 && inObb(c, x, z, -0.05) && (c.r === undefined ? Math.min(c.hx, c.hz) > 0.12 : c.r > 0.12)) { push('emitter', areaAt(x, z, y), x, y, z, e.type + ' emitter inside a solid collider (' + (c.y1 - y).toFixed(2) + ' m under its top)', 1); break; } } }
}
});
