// ───────────────────────── air: birds, lake mist, drifting leaves, moths at lanterns, forest-edge fireflies ─────────────────────────
// All of it is billboards in the existing particle buffer (no triangles, no extra draw calls). airUpdate(put, ...) is called from fxUpdate.
const AIR = { t: 0, trees: [], pines: [], near: [], lamps: [], birds: [], flocks: [], leaves: [], ready: false, roofs: [] };
function airInit() {
  const R_ = rng(6161), V = World.vegInst || {};
  AIR.trees = [].concat(V.oak || [], V.birch || []).map(t => [t[0], t[1], t[2], t[3] || 1]); AIR.pines = (V.pine || []).map(t => [t[0], t[1], t[2], t[3] || 1]);
  for (let i = 0; i < 5; i++) AIR.birds.push({ a: R_() * TAU, r: 45 + R_() * 50, h: 48 + R_() * 30, sp: (0.05 + R_() * 0.04) * (R_() < 0.5 ? 1 : -1), ph: R_() * 10, cx: 8 + R_.s() * 20, cz: 10 + R_.s() * 30 });
  // roofs where small flocks perch: the ridges of the market alley and a few cottages (x, y, z of a point on a ridge)
  for (const s of ALLEY_SHOPS) { const st = SITE[s.id]; if (st && s.floors) AIR.roofs.push([st.x, st.y + s.floors * 3 + (s.w ? 2.0 : 2), st.z]); }
  for (const id of ['inn', 'store', 'smithy', 'elder', 'herbalist']) { const st = SITE[id]; if (st) AIR.roofs.push([st.x, st.y + 6.0, st.z]); }
  AIR.roofs.slice(0, 7).forEach((p, i) => AIR.flocks.push({ p, n: 4 + (i % 3), st: 'perch', t: 0, wait: 0, dir: R_() * TAU, ph: R_() * 100 }));
  AIR.ready = true;
}
function airUpdate(put, dt, time, env, cam) {
  if (TEST && TEST.air === 0) return;
  if (!AIR.ready) airInit();
  const day = env.day, night = env.night, hr = Env.hour, wx = env.windDir[0] * env.windStrength, wz = env.windDir[1] * env.windStrength, outdoors = !World.indoor;
  AIR.t += dt;
  if (!outdoors) return;
  // pick nearby trees, pines and lanterns twice a second
  if (AIR.t - (AIR.sel || -9) > 0.5) {
    AIR.sel = AIR.t; const nr = (list, rad, max) => { const o = []; for (const t of list) { const d = hyp(t[0] - cam[0], t[2] - cam[2]); if (d < rad) o.push([d, t]); } o.sort((a, b) => a[0] - b[0]); return o.slice(0, max).map(v => v[1]); };
    AIR.near = nr(AIR.trees, 26, 5); AIR.nearPine = nr(AIR.pines, 34, 5);
    AIR.lamps = []; for (const e of World.emitters) if (e.type === 'lantern' && hyp(e.p[0] - cam[0], e.p[2] - cam[2]) < 22) AIR.lamps.push(e); AIR.lamps = AIR.lamps.slice(0, 6);
  }
  // birds circling far overhead (dark flecks that flap by changing shape)
  if (day > 0.15) for (const b of AIR.birds) {
    const a = b.a + time * b.sp, x = b.cx + Math.cos(a) * b.r, z = b.cz + Math.sin(a) * b.r, y = b.h + Math.sin(time * 0.3 + b.ph) * 4, fl = Math.sin(time * 6 + b.ph * 3);
    put(x, y, z, 0.5, 0.06, 0.06, 0.07, 0.8 * Math.min(1, day * 2), Math.atan2(-Math.sin(a), Math.cos(a)) * 1 + 1.57, 1, 2.6 + fl * 1.1, b.ph);
  }
  // flocks lifting off a roof when the player comes close, circling away, returning later
  if (day > 0.2) for (const f of AIR.flocks) {
    const d = hyp(f.p[0] - cam[0], f.p[2] - cam[2]);
    if (f.st === 'perch') { if (d < 70) for (let i = 0; i < f.n; i++) put(f.p[0] + (i - f.n / 2) * 0.45 + Math.sin(f.ph + i) * 0.1, f.p[1] + 0.12, f.p[2] + Math.cos(f.ph * 2 + i * 2) * 0.35, 0.16, 0.1, 0.09, 0.09, 0.85, 0, 1, 1.4, f.ph + i); if (d < 9) { f.st = 'fly'; f.t = 0; } }
    else if (f.st === 'fly') {
      f.t += dt; for (let i = 0; i < f.n; i++) { const k = f.t + i * 0.12, sp = 6 + i * 0.7, a = f.dir + i * 0.15 + Math.sin(f.t * 0.7 + i) * 0.35; put(f.p[0] + Math.cos(a) * sp * k + (i - f.n / 2) * 0.4, f.p[1] + Math.min(k * 3.4, 22) + Math.sin(k * 9 + i) * 0.25, f.p[2] + Math.sin(a) * sp * k, 0.24, 0.07, 0.07, 0.08, 0.85 * Math.max(0, 1 - f.t / 12), a + 1.57, 1, 2.4 + Math.sin(time * 14 + i * 2) * 1.1, i); }
      if (f.t > 12) { f.st = 'gone'; f.t = 0; f.wait = 40 + (f.ph % 30); }
    } else { f.wait -= dt; if (f.wait <= 0 && d > 25) f.st = 'perch'; }
  }
  // lake mist in the first and last light of the day, drifting over the water
  const mist = Math.max(Math.exp(-Math.pow((hr - 6.0) / 1.6, 2)), Math.exp(-Math.pow((hr - 19.2) / 1.4, 2)));
  if (mist > 0.04 && hyp(cam[0] - LAKE.x, cam[2] - LAKE.z) < 120) for (let i = 0; i < 26; i++) {
    const a = i * 2.399 + 0.4, r = LAKE.r * (0.15 + 0.8 * ((i * 0.618) % 1)), x = LAKE.x + Math.cos(a) * r + Math.sin(time * 0.05 + i) * 3 + wx * time * 0.1 % 6, z = LAKE.z + Math.sin(a) * r + Math.cos(time * 0.04 + i * 1.7) * 3;
    put(x, LAKE.y + 0.5 + (i % 3) * 0.35, z, 7 + (i % 4) * 1.6, 0.74, 0.78, 0.82, 0.075 * mist, i, 1, 1, i * 0.13);
  }
  // leaves loosen from the nearest trees by day and spiral down on the wind
  if (day > 0.3 && AIR.near.length) for (let k = 0; k < AIR.near.length; k++) for (let j = 0; j < 4; j++) {
    const t = AIR.near[k], ph = (time * 0.12 + (k * 4 + j) * 0.21) % 1, h = 9 * t[3] * 0.6 * (1 - ph) + 0.1, a = (k * 4 + j) * 2.1 + time * 0.2;
    put(t[0] + Math.cos(a) * 2.4 * t[3] * 0.5 + wx * ph * 5 + Math.sin(time * 1.5 + j) * 0.4, World.groundY(t[0], t[2]) + h, t[2] + Math.sin(a) * 2.4 * t[3] * 0.5 + wz * ph * 5, 0.045, 0.5, 0.36, 0.14, 0.9 * Math.sin(ph * 3.14), time * 2 + j, 1, 1, j);
  }
  // moths around lanterns after dusk
  if (night > 0.3) AIR.lamps.forEach((e, k) => { for (let i = 0; i < 2; i++) { const a = time * (1.8 + i * 0.7) + k * 2 + i * 3, r = 0.28 + 0.15 * Math.sin(time * 0.9 + i + k); put(e.p[0] + Math.cos(a) * r, e.p[1] + 0.05 + Math.sin(a * 1.7) * 0.22, e.p[2] + Math.sin(a) * r, 0.03, 0.9, 0.85, 0.7, 1.1 * night * (0.6 + 0.4 * Math.sin(time * 18 + i * 5 + k)), 0, 3, 1, k); } });
  // more fireflies along the forest edge
  if (night > 0.1) AIR.nearPine.forEach((t, k) => { for (let i = 0; i < 4; i++) { const ph = k * 3.1 + i * 1.7, a = time * 0.25 + ph, b = Math.max(0, Math.sin(time * 1.1 + ph * 3)) * night; if (b > 0.02) put(t[0] + Math.cos(a) * (2.2 + i * 0.7), World.groundY(t[0], t[2]) + 0.5 + i * 0.35 + Math.sin(time * 0.6 + ph) * 0.3, t[2] + Math.sin(a * 1.3) * (2.2 + i * 0.7), 0.07, 0.75, 1.0, 0.35, 2.2 * b, 0, 3, 1, 0); } });
}
