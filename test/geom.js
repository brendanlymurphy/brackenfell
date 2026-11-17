// Cheap-looking geometry, found without eyes (the owner: "a wall that is a leaning sheet, open at its end, texture stretched").
// Reads every static mesh out of doors (the generated town: walls, fences, plots, stalls, steps; not the kit's modelled pieces, the terrain or interiors) and lists
//  1. STRETCH  triangles whose texture is stretched: metres per repeat along one axis more than 2.5 times the other, or more than 3 times off the material's median
//  2. OPEN     edges that belong to one triangle only (the end or top of a sheet: you can see the thing has no thickness), 0.8 m or longer, between 0.2 and 3 m above
//              the ground a person can stand on
//  3. SHEET    free-standing flat pieces of one or two triangles over 2 m2 that are not lying on the ground (a wall or roof that is a single quad)
// Each line: where (x, y, z), what material, how big, and a game.shot() call that looks at it. usage: node tools/geomaudit.mjs  (writes docs/GEOMETRY.md)
const LAY = Object.entries(MAT).reduce((a, [k, v]) => (a[v] = k, a), {}), r1 = v => +v.toFixed(1), GROUNDISH = new Set([MAT.DIRT, MAT.GRASS, MAT.GRASS2, MAT.FOREST, MAT.MUD, MAT.SOIL, MAT.GRAVEL, MAT.MOSS, MAT.COBBLE]);
const SKIP_OPEN = new Set([MAT.CLOTH, MAT.STRIPES, MAT.LEAVES, MAT.IMPOSTOR, MAT.THATCH, MAT.SHINGLE]);       // cloth hangs as a sheet, leaves are cards, roof coverings end in an open eave by nature
const stretch = new Map(), open = new Map(), sheets = [], perLayer = {}; let tris = 0, meshes = 0;
const cell = (m, x, y, z, add) => { const k = Math.round(x / 3) + ',' + Math.round(z / 3) + ',' + add.layer; let c = m.get(k); if (!c) m.set(k, c = { x, y, z, n: 0, size: 0, layer: add.layer, worst: 0, note: '' }); c.n++; c.size += add.size; if (add.worst > c.worst) { c.worst = add.worst; c.x = x; c.y = y; c.z = z; c.note = add.note || ''; } };
const seenGeo = new Set();
for (const s of SC.statics) { const it = s.it; if (it.cell || it.kind !== 'opaque' || !s.mesh.geometry.index) continue; meshes++;
  const g = s.mesh.geometry, P = g.attributes.position.array, UV = g.attributes.uv.array, MM = g.attributes.mm.array, I = s.view && s.view.pk ? s.view.pk.index.array : g.index.array, base = 0;       /* the pack's own index (a mesh cut into squares draws from a buffer of its own that holds only what is in view) */
  const weld = new Map(), wid = i => { const k = Math.round(P[i * 3] * 100) + ',' + Math.round(P[i * 3 + 1] * 100) + ',' + Math.round(P[i * 3 + 2] * 100); let w = weld.get(k); if (w === undefined) weld.set(k, w = weld.size); return w; };
  const edges = new Map(), triW = [], triInfo = [];
  for (let t = it.first; t + 2 < it.first + it.count; t += 3) { const a = I[t] + base, b = I[t + 1] + base, c = I[t + 2] + base; tris++;
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], e1 = [P[b * 3] - ax, P[b * 3 + 1] - ay, P[b * 3 + 2] - az], e2 = [P[c * 3] - ax, P[c * 3 + 1] - ay, P[c * 3 + 2] - az];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], A2 = Math.hypot(nx, ny, nz), area = A2 / 2; if (area < 1e-4) continue;
    const layer = MM[a * 4], cx = (ax + P[b * 3] + P[c * 3]) / 3, cy = (ay + P[b * 3 + 1] + P[c * 3 + 1]) / 3, cz = (az + P[b * 3 + 2] + P[c * 3 + 2]) / 3;
    // 1. texture scale: the lengths of dP/du and dP/dv
    const du1 = UV[b * 2] - UV[a * 2], dv1 = UV[b * 2 + 1] - UV[a * 2 + 1], du2 = UV[c * 2] - UV[a * 2], dv2 = UV[c * 2 + 1] - UV[a * 2 + 1], det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) > 1e-7 && area > 0.15 && layer !== MAT.PLAIN && layer !== MAT.IMPOSTOR && layer !== MAT.LEAVES) { const mu = Math.hypot((e1[0] * dv2 - e2[0] * dv1) / det, (e1[1] * dv2 - e2[1] * dv1) / det, (e1[2] * dv2 - e2[2] * dv1) / det), mv = Math.hypot((e2[0] * du1 - e1[0] * du2) / det, (e2[1] * du1 - e1[1] * du2) / det, (e2[2] * du1 - e1[2] * du2) / det);
      (perLayer[layer] = perLayer[layer] || []).push([mu, mv, area, cx, cy, cz]); }
    else if (Math.abs(det) <= 1e-7 && area > 0.5 && layer !== MAT.PLAIN) cell(stretch, cx, cy, cz, { layer, size: area, worst: 99, note: 'one texel smeared over the whole face' });
    const wa = wid(a), wb = wid(b), wc = wid(c), ti = triInfo.length; triInfo.push({ area, n: [nx / A2, ny / A2, nz / A2], layer, c: [cx, cy, cz], w: [wa, wb, wc] });
    for (const [p, q, pi, qi] of [[wa, wb, a, b], [wb, wc, b, c], [wc, wa, c, a]]) { if (p === q) continue; const k = p < q ? p * 1048576 + q : q * 1048576 + p; const e = edges.get(k); if (e) e.n++; else edges.set(k, { n: 1, t: ti, a: pi, b: qi }); } }
  // 2. open edges
  for (const e of edges.values()) { if (e.n !== 1) continue; const T = triInfo[e.t]; if (SKIP_OPEN.has(T.layer)) continue; const ax = P[e.a * 3], ay = P[e.a * 3 + 1], az = P[e.a * 3 + 2], bx = P[e.b * 3], by = P[e.b * 3 + 1], bz = P[e.b * 3 + 2], L = Math.hypot(ax - bx, ay - by, az - bz); if (L < 0.8) continue;
    const mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2; if (Math.hypot(mx, mz) > WORLD_RADIUS) continue; const gy = World.groundAt(mx, mz, my + 0.5), ga = World.groundAt(ax, az, ay + 0.5), gb = World.groundAt(bx, bz, by + 0.5);
    if (my - gy < 0.2 || my - gy > 3 || (ay - ga < 0.12 && by - gb < 0.12)) continue;       // lying on the ground, or out of reach overhead
    if (Math.abs(T.n[1]) > 0.9 && my - gy < 0.25) continue;
    cell(open, mx, my, mz, { layer: T.layer, size: L, worst: L, note: (Math.abs(ay - by) > 0.7 * L ? 'an upright end' : 'a top or side') + ' ' + L.toFixed(1) + ' m long, ' + (my - gy).toFixed(1) + ' m up' }); }
  // 3. single flat pieces: components of one or two triangles
  { const par = new Map(), find = x => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x))); x = par.get(x); } return x; }; for (const T of triInfo) for (const w of T.w) if (!par.has(w)) par.set(w, w); for (const T of triInfo) { const r = find(T.w[0]); par.set(find(T.w[1]), r); par.set(find(T.w[2]), r); }
    const comp = new Map(); for (const T of triInfo) { const r = find(T.w[0]); let c = comp.get(r); if (!c) comp.set(r, c = { n: 0, area: 0, T }); c.n++; c.area += T.area; }
    for (const c of comp.values()) { if (c.n > 2 || c.area < 2) continue; const T = c.T; if (SKIP_OPEN.has(T.layer) || Math.hypot(T.c[0], T.c[2]) > WORLD_RADIUS) continue; const gy = World.groundAt(T.c[0], T.c[2], T.c[1] + 0.5); if (Math.abs(T.n[1]) > 0.9 && (T.c[1] - gy < 0.3 || GROUNDISH.has(T.layer))) continue;       /* a patch of ground */
      const tilt = Math.round(Math.acos(Math.min(1, Math.abs(T.n[1]))) * 57.3); sheets.push({ x: T.c[0], y: T.c[1], z: T.c[2], layer: T.layer, area: c.area, tilt, up: T.c[1] - gy }); } }
}
// texture scale outliers against each material's own median
const med = {}; for (const l in perLayer) { const v = perLayer[l].map(q => Math.sqrt(q[0] * q[1])).sort((a, b) => a - b); med[l] = v[v.length >> 1]; for (const [mu, mv, area, x, y, z] of perLayer[l]) { const an = Math.max(mu, mv) / Math.max(1e-6, Math.min(mu, mv)), off = Math.max(Math.sqrt(mu * mv) / med[l], med[l] / Math.sqrt(mu * mv)); if (Math.hypot(x, z) > WORLD_RADIUS) continue; if (an > 2.5 || off > 3) cell(stretch, x, y, z, { layer: +l, size: area, worst: Math.max(an, off), note: an > 2.5 ? 'stretched ' + an.toFixed(1) + ' times one way (' + mu.toFixed(1) + ' by ' + mv.toFixed(1) + ' m a repeat)' : (Math.sqrt(mu * mv) > med[l] ? 'blown up ' : 'shrunk ') + off.toFixed(1) + ' times against this material elsewhere (' + Math.sqrt(mu * mv).toFixed(1) + ' m a repeat, usually ' + med[l].toFixed(1) + ')' }); } }
const shot = c => 'game.shot(' + [r1(c.x + 3), r1(c.y + 1.2), r1(c.z + 3), 315, -12, 13].join(', ') + ')';
const row = (c, what) => '| ' + [r1(c.x), r1(c.y), r1(c.z)].join(', ') + ' | ' + (LAY[c.layer] || c.layer).toLowerCase() + ' | ' + what + ' | `' + shot(c) + '` |';
const S = [...stretch.values()].filter(c => c.size > 1).sort((a, b) => b.size * Math.min(b.worst, 8) - a.size * Math.min(a.worst, 8)), O = [...open.values()].sort((a, b) => b.size - a.size), H = sheets.sort((a, b) => b.area - a.area);
return JSON.stringify({ meshes, tris, counts: { stretch: S.length, open: O.length, sheets: H.length }, median: Object.fromEntries(Object.entries(med).map(([l, v]) => [(LAY[l] || l).toLowerCase(), +v.toFixed(2)])),
  stretch: S.slice(0, 60).map(c => row(c, c.size.toFixed(1) + ' m2 in ' + c.n + ' triangles: ' + c.note)), open: O.slice(0, 80).map(c => row(c, c.size.toFixed(1) + ' m of open edge in ' + c.n + ' pieces: ' + c.note)), sheets: H.slice(0, 60).map(c => row(c, c.area.toFixed(1) + ' m2 single flat piece, ' + (c.tilt > 80 ? 'upright' : c.tilt < 10 ? 'level' : 'leaning ' + (90 - c.tilt) + ' degrees off upright') + ', ' + c.up.toFixed(1) + ' m above the ground')) });
