// In-page library for the QA sweep (loaded by test/qa/harness.mjs after the game is ready). Everything hangs off window.QA.
window.QA = (() => {
  const Q = {};
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  // ---------- views ----------
  Q.cam = (x, y, z, yaw, pitch) => {           // like game.shot, also works inside cells (y absolute); yaw/pitch in degrees
    R.cam.pos = [x, y === null || y === undefined ? Terrain.y(x, z) + 1.65 : y, z]; R.cam.yaw = yaw * PI / 180; R.cam.pitch = (pitch || 0) * PI / 180;
    Player.pos = [x, R.cam.pos[1] - 1.6, z]; Cells.sync(R.cam.pos); World.camZone = World.zoneAt(x, R.cam.pos[1], z); World.indoor = World.cell || World.camZone ? 1 : 0;
  };
  Q.hour = h => { Env.dayLength = 0; Env.hour = h; };
  Q.draw = async (noSky) => {                  // render now, return ImageData of the canvas
    const env = updateEnv(game.time, World.indoor); env.time = game.time;
    const sk = Sky.mesh && Sky.mesh.visible; if (noSky && Sky.mesh) Sky.mesh.visible = false;
    let src; const gpu = G.renderer.backend && G.renderer.backend.isWebGPUBackend;
    if (gpu) { await gfxCapture(() => renderFrame(game.time, env)); src = document.getElementById('testcv'); } else { renderFrame(game.time, env); src = G.canvas; }
    cv.width = src.width; cv.height = src.height; cx.drawImage(src, 0, 0); const d = cx.getImageData(0, 0, cv.width, cv.height);
    if (noSky && Sky.mesh) Sky.mesh.visible = sk; return d;
  };
  Q.settle = (x, z) => { game.time += 0.4; npcUpdate(0.4, R.cam.pos); updateDynamics(0.4, [R.cam.pos].concat(NPCS.map(n => n.pos))); const env = updateEnv(game.time, World.indoor); env.time = game.time; World.bonfire = !!S.flags.fire && (Env.hour > 19 || Env.hour < 2); fxUpdate(0.4, game.time, env, R.cam.pos); fxUpdate(0.4, game.time, env, R.cam.pos); };
  return Q;
})();
// ---------- the view list ----------
(() => {
const Q = window.QA, D2R = 180 / PI;
const toward = (x, z, tx, tz) => Math.atan2(tx - x, -(tz - z)) * D2R;
const clampPt = (x, z) => [x, z];
Q.views = () => {
  const V = [], seen = new Set();
  const add = (area, id, x, z, yaw, pitch, y, extra) => { const k = area + '|' + id; if (seen.has(k)) return; seen.add(k); V.push(Object.assign({ area, id, x: +x.toFixed(2), z: +z.toFixed(2), yaw: +yaw.toFixed(1), pitch: pitch === undefined ? -2 : pitch, y: y === undefined ? null : y }, extra || {})); };
  // 1. every site from the street, 8 m out, facing the door
  for (const s of SITES) { const l = siteDoorLocal(s, 8), w = siteToWorld(s, l[0], l[1]), d = siteDoorLocal(s, 0), dw = siteToWorld(s, d[0], d[1]); add(s.alleyRow ? 'alley' : s.wild ? 'wilds' : 'village', 'site.' + s.id, w[0], w[1], toward(w[0], w[1], dw[0], dw[1]), -2); }
  // 2. places: from the side the player arrives, looking at the centre
  const placed = new Set(SITES.map(s => s.id));
  for (const p of World.places) {
    if (placed.has(p.id)) continue; const wild = p.id.startsWith('wild.'), dist = Math.min(Math.max(p.r * 0.8, 9), 16);
    const dx = -p.x, dz = -p.z, L = hyp(dx, dz) || 1, cx = p.x + dx / L * dist, cz = p.z + dz / L * dist;
    add(wild ? 'wilds' : 'places', 'place.' + p.id, cx, cz, toward(cx, cz, p.x, p.z), -4);
    if (wild) { const a = toward(p.x, p.z, 0, 0) + 90, ox = p.x + Math.sin(a / D2R) * dist, oz = p.z - Math.cos(a / D2R) * dist; add('wilds', 'place2.' + p.id, ox, oz, toward(ox, oz, p.x, p.z), -4); }
  }
  // 3. both ends of every path and road, looking along it
  for (const r of ROADS) { if (r.id === 'main') continue; const P = r.pts, n = P.length; for (const end of [0, 1]) { const a = end ? P[n - 1] : P[0], b = end ? P[n - 3 > 0 ? n - 3 : 0] : P[Math.min(2, n - 1)]; const yaw = toward(b[0], b[1], a[0], a[1]); add('paths', 'end.' + r.id + (end ? '.b' : '.a'), b[0], b[1], yaw, -3); } }
  add('paths', 'end.main.w', -150, 2, 90, -2); add('paths', 'end.main.e', 150, -16, 270 - 180 + 90, -2);
  // 4. raised walkways and bridges: floors above the ground, clustered
  const F = World.floors.filter(f => f.y > -100 && f.y > Terrain.y(f.x, f.z) + 0.1), par = F.map((_, i) => i), find = i => par[i] === i ? i : (par[i] = find(par[i]));
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (Math.abs(F[i].x - F[j].x) < 4 && Math.abs(F[i].z - F[j].z) < 4 && Math.abs(F[i].y - F[j].y) < 1.0) par[find(i)] = find(j);
  const groups = new Map(); F.forEach((f, i) => { const r = find(i); (groups.get(r) || groups.set(r, []).get(r)).push(f); });
  let gi = 0; for (const g of [...groups.values()].sort((a, b) => b.length - a.length)) {
    if (g.length < 2 || gi > 40) continue; gi++; const cx = g.reduce((s, f) => s + f.x, 0) / g.length, cz = g.reduce((s, f) => s + f.z, 0) / g.length;
    let e = g[0]; for (const f of g) if (hyp(f.x - cx, f.z - cz) > hyp(e.x - cx, e.z - cz)) e = f;
    const dx = cx - e.x, dz = cz - e.z, L = hyp(dx, dz) || 1, bx = e.x - dx / L * 4, bz = e.z - dz / L * 4;
    add('walks', 'walk' + gi + '@' + Math.round(cx) + ',' + Math.round(cz) + ' n' + g.length, bx, bz, toward(bx, bz, cx, cz), -8, Terrain.y(bx, bz) + 1.65 > e.y + 1 ? null : e.y + 1.65);
    const sx = cx + (-dz / L) * 9, sz = cz + (dx / L) * 9; add('walks', 'walkside' + gi, sx, sz, toward(sx, sz, cx, cz), -10, Math.max(Terrain.y(sx, sz), e.y - 0.5) + 1.65);
  }
  // 5. interiors
  for (const c of Cells.list) {
    if (!c.enter) continue; const p = c.enter.p, yaw = c.enter.yaw * D2R;
    add('int.' + c.id, 'door', p[0], p[2], yaw, -3, p[1] + 1.6);
    const sp = Object.values(World.spots).filter(s => s.site === c.id && Math.abs(s.p[1] - p[1]) < 1.5); let far = null, fd = 0; for (const s of sp) { const d = hyp(s.p[0] - p[0], s.p[2] - p[2]); if (d > fd) { fd = d; far = s; } }
    if (far && fd > 3) add('int.' + c.id, 'far', far.p[0], far.p[2], toward(far.p[0], far.p[2], p[0], p[2]), -3, far.p[1] + 1.6);
  }
  return V;
};
})();
// ---------- per-view analysis ----------
(() => {
const Q = window.QA;
const isMag = (d, i) => d[i] > 150 && d[i + 1] < 45 && d[i + 2] > 150;
// A: normal render, C: render with no sky and no particles on a magenta clear (sky = magenta), returns metrics (fractions of the non-sky pixels unless noted)
Q.measure = (A, C, B) => {
  const W = A.width, H = A.height, a = A.data, c = C.data, N = W * H; let sky = 0, blk = 0, wht = 0, part = 0;
  const mask = new Uint8Array(N);                                    // 1 = sky
  for (let i = 0; i < N; i++) if (isMag(c, i * 4) && isMag(c, i * 4)) { mask[i] = 1; sky++; }
  for (let i = 0; i < N; i++) {
    if (mask[i]) continue; const r = a[i * 4], g = a[i * 4 + 1], b = a[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < 10) blk++; if (mn > 244) wht++;
    if (B) { const d = Math.abs(r - B.data[i * 4]) + Math.abs(g - B.data[i * 4 + 1]) + Math.abs(b - B.data[i * 4 + 2]); if (d > 60) part++; }
  }
  const ns = Math.max(1, N - sky);
  // flat regions: 6x6 blocks whose colour never varies by more than 3 levels; join neighbours of the same colour
  const BS = 6, bw = Math.floor(W / BS), bh = Math.floor(H / BS), flat = new Int32Array(bw * bh).fill(-1), col = new Float32Array(bw * bh * 3), ok = new Uint8Array(bw * bh);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    let lo = [255, 255, 255], hi = [0, 0, 0], s = [0, 0, 0], sk = 0;
    for (let y = by * BS; y < by * BS + BS; y++) for (let x = bx * BS; x < bx * BS + BS; x++) { const i = y * W + x; if (mask[i]) sk++; for (let k = 0; k < 3; k++) { const v = a[i * 4 + k]; if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; s[k] += v; } }
    const o = by * bw + bx; if (sk === 0 && hi[0] - lo[0] <= 3 && hi[1] - lo[1] <= 3 && hi[2] - lo[2] <= 3) { ok[o] = 1; for (let k = 0; k < 3; k++) col[o * 3 + k] = s[k] / (BS * BS); }
  }
  const comp = []; const seen = new Uint8Array(bw * bh);
  for (let o = 0; o < bw * bh; o++) {
    if (!ok[o] || seen[o]) continue; const st = [o]; seen[o] = 1; let n = 0, sx = 0, sy = 0; const c0 = [col[o * 3], col[o * 3 + 1], col[o * 3 + 2]];
    while (st.length) { const q = st.pop(); n++; const qx = q % bw, qy = (q / bw) | 0; sx += qx; sy += qy;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = qx + dx, y = qy + dy; if (x < 0 || y < 0 || x >= bw || y >= bh) continue; const p = y * bw + x; if (seen[p] || !ok[p]) continue; if (Math.abs(col[p * 3] - c0[0]) + Math.abs(col[p * 3 + 1] - c0[1]) + Math.abs(col[p * 3 + 2] - c0[2]) > 12) continue; seen[p] = 1; st.push(p); } }
    comp.push({ f: n * BS * BS / ns, col: c0.map(v => Math.round(v)), at: [Math.round(sx / n * BS), Math.round(sy / n * BS)] });
  }
  comp.sort((p, q) => q.f - p.f);
  // large black / white regions as components too (blocks of near-black or near-white pixels)
  return { sky: +(sky / N).toFixed(3), black: +(blk / ns).toFixed(4), white: +(wht / ns).toFixed(4), part: B ? +(part / ns).toFixed(4) : 0, flat: comp[0] ? { f: +comp[0].f.toFixed(4), col: comp[0].col, at: comp[0].at } : null };
};
// ---------- one view: both renders and the numbers ----------
Q.diff = (a, b) => { let n = 0; const x = a.data, y = b.data; for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 60) n++; return n / (x.length / 4); };
// one view at one hour: A (normal), C (no sky, magenta clear: the sky mask), B (no particles), J (camera shifted 2 mm: z-fighting); jitter only when asked (it doubles the cost)
Q.look = async (v, hour, jitter) => {
  Q.hour(hour); Q.cam(v.x, v.y, v.z, v.yaw, v.pitch); Q.settle();
  const mp = Particles.mesh, oc = G.renderer.getClearColor(new THREE.Color()), oa = G.renderer.getClearAlpha();
  const A = await Q.draw();
  G.renderer.setClearColor(0xff00ff, 1); const C = await Q.draw(true); G.renderer.setClearColor(oc, oa);
  let B = null; if (mp) { mp.visible = false; B = await Q.draw(); mp.visible = true; }
  const out = Q.measure(A, C, B);
  if (jitter) { const y = v.y === null || v.y === undefined ? Terrain.y(v.x, v.z) + 1.65 : v.y; Q.cam(v.x + 0.002, y, v.z + 0.002, v.yaw, v.pitch); out.jit = +Q.diff(A, await Q.draw()).toFixed(4); }
  return { A, out };
};
Q.jpeg = A => { const c = document.createElement('canvas'); c.width = A.width; c.height = A.height; c.getContext('2d').putImageData(A, 0, 0); return c.toDataURL('image/jpeg', 0.86).split(',')[1]; };
})();
