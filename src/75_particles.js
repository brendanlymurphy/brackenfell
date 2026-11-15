// ───────────────────────── billboards: flames, glows, smoke, embers, fireflies ─────────────────────────
const FX = { smoke: [], embers: [], flies: [], motes: [], acc: 0, glows: [] };
function fxInit() {
  const R = rng(55);
  for (let i = 0; i < 46; i++) FX.flies.push({ o: [R.s() * 22, 0.4 + R() * 1.8, R.s() * 22], ph: R() * 100, sp: 0.3 + R() * 0.5 });
  for (let i = 0; i < 36; i++) FX.motes.push({ o: [R.s() * 9, R() * 4, R.s() * 9], ph: R() * 100 });
  World.emitters.forEach((e, i) => { e.seed = (i * 0.618) % 1; e.t = e.seed * 3; });
}
function fxUpdate(dt, time, env, cam) {
  const d = R.partData, max = R.partMax; let n = 0;
  const put = (x, y, z, size, r, g, b, a, rot, kind, aspect, seed) => { if (n >= max) return; const o = n++ * 12; d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = size; d[o + 4] = r; d[o + 5] = g; d[o + 6] = b; d[o + 7] = a; d[o + 8] = rot; d[o + 9] = kind; d[o + 10] = aspect; d[o + 11] = seed; };
  const lit = env.windowGlow, wx = env.windDir[0] * env.windStrength, wz = env.windDir[1] * env.windStrength;
  const here = World.cell ? World.cell.id : null;
  for (const e of World.emitters) {
    if (e.cell === undefined) { const zi = e.zone ? World.zones[e.zone - 1] : null; e.cell = zi && zi.cell || null; }
    if (e.cell !== here) continue;          // in a cell only its own flames burn; outdoors none of them do
    const dx = e.p[0] - cam[0], dy = e.p[1] - cam[1], dz = e.p[2] - cam[2], dist = hyp(dx, dy, dz);
    if (e.type === 'fire' || e.type === 'bonfire') {
      if (e.type === 'bonfire' && !World.bonfire) continue;
      if (dist > 110) continue;
      const s = e.size, fl = flick(time, e.seed * 9);
      for (let k = 0; k < (e.type === 'bonfire' ? 5 : 3); k++) { const a = k * 2.4 + e.seed * 6, r = s * (k ? 0.24 : 0); put(e.p[0] + Math.cos(a) * r, e.p[1] + s * (0.5 + (k % 2) * 0.1), e.p[2] + Math.sin(a) * r, s * (k ? 0.62 : 0.85), 1, 1, 1, 0.9 * fl, 0, 2, 1.2, e.seed + k * 0.37); }
      put(e.p[0], e.p[1] + s * 0.5, e.p[2], s * 2.6, 1.0, 0.42, 0.12, 0.13 * fl, 0, 0, 1, e.seed);
      if (dist < 45) { e.t += dt; const rate = e.type === 'bonfire' ? 0.035 : 0.16; while (e.t > rate) { e.t -= rate; if (FX.embers.length < 150) FX.embers.push({ p: [e.p[0] + (Math.random() - 0.5) * s * 0.6, e.p[1] + s * 0.4, e.p[2] + (Math.random() - 0.5) * s * 0.6], v: [(Math.random() - 0.5) * 0.5, 0.9 + Math.random() * 1.4 * (s > 1 ? 2 : 1), (Math.random() - 0.5) * 0.5], life: 0, max: 0.7 + Math.random() * 1.1 * (s > 1 ? 2 : 1), ph: Math.random() * 9 }); } }
    } else if (e.type === 'smoke') {
      if (dist > 150) continue;
      e.t += dt; while (e.t > 0.6) { e.t -= 0.6; if (FX.smoke.length < 230) FX.smoke.push({ p: [e.p[0], e.p[1], e.p[2]], life: 0, max: 5.5 + Math.random() * 2, seed: Math.random(), rot: Math.random() * 6 }); }
    } else if (e.type === 'candle') {
      if ((lit < 0.05 && !e.always) || dist > 40) continue;
      const k = e.always ? 1 : lit;
      put(e.p[0], e.p[1], e.p[2], 0.05, 1, 1, 1, 0.9 * k, 0, 2, 1.7, e.seed); put(e.p[0], e.p[1] + 0.01, e.p[2], 0.2, 1.0, 0.6, 0.22, 0.5 * k, 0, 0, 1, e.seed);
    } else if (e.type === 'torch') {             // wall torches and standing candelabra: always burning
      if (dist > 55) continue;
      const fl = flick(time, e.seed * 9), sz = e.size || 0.16;
      put(e.p[0], e.p[1] + sz * 0.45, e.p[2], sz, 1, 1, 1, 0.9 * fl, 0, 2, 1.5, e.seed); put(e.p[0], e.p[1] + sz * 0.4, e.p[2], sz * 4.2, 1.0, 0.5, 0.16, 0.2 * fl, 0, 0, 1, e.seed);
    } else if (e.type === 'lantern') {
      if (lit < 0.05 || dist > 170) continue;
      put(e.p[0], e.p[1], e.p[2], 0.055 + dist * 0.0016, 1.0, 0.66, 0.26, 1.5 * lit, 0, 0, 1, e.seed); put(e.p[0], e.p[1], e.p[2], 0.42 + dist * 0.006, 1.0, 0.50, 0.17, 0.11 * lit, 0, 0, 1, e.seed);      // a small bright flame and a faint halo (it was a white ball a metre across)
    } else if (e.type === 'herb') {
      if (e.gone || dist > 60) continue;
      put(e.p[0], e.p[1] + 0.12, e.p[2], 0.34, 0.55, 0.85, 1.0, 0.16 + 0.10 * Math.sin(time * 2 + e.seed * 20) + env.night * 0.25, 0, 0, 1, e.seed);
    }
  }
  // chimney smoke drifts with the wind and thins out
  if (World.cell) FX.smoke.length = 0;
  for (let i = FX.smoke.length - 1; i >= 0; i--) {
    const s = FX.smoke[i]; s.life += dt; if (s.life > s.max) { FX.smoke[i] = FX.smoke[FX.smoke.length - 1]; FX.smoke.pop(); continue; }
    const k = s.life / s.max, wv = Wind.at(s.p[0], s.p[2]), wk = 0.25 + 0.95 * k;          // the gust over this chimney, taking hold as the smoke leaves its shelter
    s.p[0] += (wv[0] * wk + Math.sin(s.seed * 20 + s.life) * 0.08) * dt; s.p[1] += (1.15 - k * 0.5) / (1 + 0.35 * Math.hypot(wv[0], wv[1])) * dt; s.p[2] += (wv[1] * wk) * dt;
    put(s.p[0], s.p[1], s.p[2], 0.14 + k * 0.95, 0.30, 0.30, 0.31, Math.min(k * 5, 1) * Math.pow(1 - k, 1.3) * 0.42, s.rot + s.life * 0.2, 1, 1.5 + k, s.seed);       // thin grey wisps that fade out (they were large opaque white blobs from above)
  }
  for (let i = FX.embers.length - 1; i >= 0; i--) {
    const s = FX.embers[i]; s.life += dt; if (s.life > s.max) { FX.embers[i] = FX.embers[FX.embers.length - 1]; FX.embers.pop(); continue; }
    const ew = World.cell ? [0, 0] : Wind.at(s.p[0], s.p[2]);
    s.p[0] += (s.v[0] + ew[0] * 0.5 + Math.sin(s.ph + s.life * 7) * 0.4) * dt; s.p[1] += s.v[1] * dt; s.p[2] += (s.v[2] + ew[1] * 0.5 + Math.cos(s.ph + s.life * 6) * 0.4) * dt;
    put(s.p[0], s.p[1], s.p[2], 0.035, 1.0, 0.5, 0.12, 2.6 * (1 - s.life / s.max), 0, 3, 1, 0);
  }
  // fireflies after dusk, drifting specks of dust by day (both wrap around the camera)
  if (env.night > 0.05 && !World.indoor) for (const f of FX.flies) {
    const x = cam[0] + ((f.o[0] - cam[0]) % 44 + 66) % 44 - 22 + Math.sin(time * f.sp + f.ph) * 1.5, z = cam[2] + ((f.o[2] - cam[2]) % 44 + 66) % 44 - 22 + Math.cos(time * f.sp * 0.8 + f.ph) * 1.5;
    const b = Math.max(0, Math.sin(time * 1.3 + f.ph * 3)) * env.night;
    if (b > 0.02) put(x, World.groundY(x, z) + f.o[1] + Math.sin(time * 0.7 + f.ph) * 0.3, z, 0.07, 0.75, 1.0, 0.35, 2.2 * b, 0, 3, 1, 0);
  }
  if (env.day > 0.3) for (const f of FX.motes) {
    const x = cam[0] + ((f.o[0] - cam[0] + time * 0.15) % 18 + 27) % 18 - 9, y = cam[1] - 1.2 + ((f.o[1] + time * 0.05) % 4), z = cam[2] + ((f.o[2] - cam[2]) % 18 + 27) % 18 - 9 + Math.sin(time * 0.3 + f.ph) * 0.4;
    put(x, y, z, 0.022, 1.0, 0.95, 0.8, 0.5 * env.day * (0.5 + 0.5 * Math.sin(time + f.ph)), 0, 3, 1, 0);
  }
  if (typeof airUpdate === 'function') airUpdate(put, dt, time, env, cam);
  R.partCount = n;
}
