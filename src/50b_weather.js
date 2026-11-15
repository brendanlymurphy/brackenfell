// ───────────────────────── weather: fair, overcast and rain, drifting from one to the next ─────────────────────────
// Weather.step() runs inside updateEnv() and writes the existing hooks: Env.cover (cloud), Env.mist, Env.rain (the sky in 45_sky.js and the
// rain and roof sound beds in 88c already read those). It also keeps Weather.wet, how wet the ground is: it rises within a minute of
// rain starting and dries slowly afterwards; the terrain shader turns that into dark ground, a sheen and puddles (41_materials.js).
// The sequence is fixed (a slow noise of game time), so a given moment of a play-through always has the same weather. The first minutes
// are always fair: the arrival at dawn should show the valley. Tests and the console: Weather.set('fair' | 'overcast' | 'rain' | 'auto').
const Weather = { cover: 0.38, rain: 0, wet: 0, time: -1, forced: null, base: null, now: 'fair', drops: { low: 260, medium: 520, high: 900 } };
Weather.KINDS = { fair: { cover: 0.34, rain: 0 }, overcast: { cover: 0.92, rain: 0 }, rain: { cover: 1, rain: 0.8 } };
Weather.set = function (kind, instant) {
  Weather.forced = kind === 'auto' ? null : (Weather.KINDS[kind] || null);
  if (Weather.forced && instant !== false) { Weather.cover = Weather.forced.cover; Weather.rain = Weather.forced.rain; Weather.wet = Weather.forced.rain > 0 ? 1 : 0; }
};
Weather.target = function (time) {
  if (Weather.forced) return Weather.forced;
  // one slow value: below 0.54 fair (more or less cloud), then overcast, above 0.60 rain that grows heavier
  const n = 0.5 + 0.5 * fbm(time / 380 + 7.7, 3.1, 2, 91), k = n * smooth(200, 420, time);
  if (k < 0.54) return { cover: 0.18 + 0.42 * smooth(0.25, 0.54, k), rain: 0 };
  if (k < 0.60) return { cover: 0.92, rain: 0 };
  return { cover: 1, rain: 0.35 + 0.65 * smooth(0.60, 0.72, k) };
};
Weather.step = function (time) {
  if (!Weather.base) { Weather.base = { cover: Env.cover, mist: Env.mist }; if (TEST && TEST.weather) Weather.set(TEST.weather); }
  const dt = Weather.time < 0 ? 0 : clamp(time - Weather.time, 0, 0.5); Weather.time = time;
  const T = Weather.target(time), go = (v, to, per) => v + clamp(to - v, -dt / per, dt / per);
  Weather.cover = go(Weather.cover, T.cover, 40); Weather.rain = go(Weather.rain, Weather.cover > 0.85 ? T.rain : 0, 18);       // rain waits for the cloud to close in
  Weather.wet = Weather.rain > 0.02 ? Math.min(1, Weather.wet + dt * Weather.rain / 35) : Math.max(0, Weather.wet - dt / 240);
  Weather.now = Weather.rain > 0.05 ? 'rain' : Weather.cover > 0.75 ? 'overcast' : 'fair';
  // a clear, still dawn after a dry night draws the most mist off the lake; rain flattens it into a general haze
  Env.cover = Weather.cover; Env.rain = Weather.rain; Env.mist = Weather.base.mist + 0.16 * Weather.rain + 0.05 * Weather.wet;
  if (typeof Sky !== 'undefined') Sky.weather.rain = Weather.rain;
};
// applied to ENV after the sky has taken cover and mist (45_sky.js)
Weather.apply = function (e) {
  const r = Weather.rain, c = Weather.cover;
  e.rain = r; e.wet = Weather.wet; e.windStrength += 0.4 * r;
  e.windowGlow = Math.max(e.windowGlow, 0.75 * smooth(0.25, 0.8, r) + 0.2 * smooth(0.85, 1, c));        // lamps and hearths are lit against a dark wet day
  e.exposure *= 1 + 0.12 * r * e.day;                                                               // eyes open a little under the low cloud
  // rain darkens and cools timber, stone and roofs outdoors (one knob on the kit's grade; rooms are left alone)
  if (typeof Kit !== 'undefined' && Kit.grade && Kit.grade.gain) { if (Weather.kitGain === undefined) Weather.kitGain = Kit.grade.gain.value; Kit.grade.gain.value = Weather.kitGain * (World.cell ? 1 : 1 - 0.2 * Weather.wet); }
};
// how strong the lake's dawn (and faint dusk) mist is right now, 0..1
Weather.lakeMist = function (hour) {
  const dawn = Math.exp(-Math.pow((hour - 6.1) / 1.7, 2)), dusk = 0.45 * Math.exp(-Math.pow((hour - 19.4) / 1.4, 2));
  return Math.max(dawn, dusk) * (1 - 0.7 * Weather.rain) * (1.15 - 0.35 * sat((ENV.windStrength - 0.6) / 0.6));
};
// roofs: no rain is drawn inside a building's footprint (the player may stand in a doorway or under an upper storey)
Weather.roofed = function (x, z) {
  if (!Weather.grid) {
    const TH = K.terrainHalf, N = Weather.gridN = 2 * TH, g = Weather.grid = new Uint8Array(N * N);
    for (const s of SITES.concat(typeof INF !== 'undefined' ? INF.houses : [])) { if (!s || !s.w || !s.d) continue; const r = Math.ceil(0.75 * Math.max(s.w, s.d));
      for (let j = Math.floor(s.z - r); j <= s.z + r; j++) for (let i = Math.floor(s.x - r); i <= s.x + r; i++) { const l = worldToSite(s, i + 0.5, j + 0.5); if (Math.abs(l[0]) < s.w / 2 + 0.2 && Math.abs(l[1]) < s.d / 2 + 0.2 && Math.abs(i) < TH - 1 && Math.abs(j) < TH - 1) g[(j + TH) * N + i + TH] = 1; } }
  }
  const TH = K.terrainHalf, i = Math.floor(x) + TH, j = Math.floor(z) + TH; return i >= 0 && j >= 0 && i < Weather.gridN && j < Weather.gridN && Weather.grid[j * Weather.gridN + i] === 1;
};
// rain streaks round the camera and splashes where they land: billboards in the shared particle buffer (kind 4 streak, kind 0 splash)
Weather.particles = function (put, dt, time, env, cam) {
  const r = Weather.rain; if (r < 0.02 || World.cell || World.indoor) return;
  const n = Math.round((Weather.drops[R.qName] || 520) * (0.35 + 0.65 * r)), RAD = 8, H = 10, SP = 9.5;
  const lum = 0.2126 * env.ambSky[0] + 0.7152 * env.ambSky[1] + 0.0722 * env.ambSky[2] + 0.05 * (env.keyCol[0] + env.keyCol[1] + env.keyCol[2]) / 3, c = [lum * 1.9, lum * 2.0, lum * 2.2];
  const wv = [env.windDir[0] * env.windStrength * 2.6, env.windDir[1] * env.windStrength * 2.6], top = cam[1] + 6.5;
  for (let i = 0; i < n; i++) {
    const hx = (i * 0.61803398875) % 1, hz = (i * 0.75487766625) % 1, hy = (i * 0.56984029099) % 1, ph = (hy + time * SP / H * (0.85 + 0.3 * hx)) % 1, fallT = ph * H / SP;
    const x = cam[0] + ((hx * 2 * RAD + wv[0] * fallT - cam[0]) % (2 * RAD) + 2 * RAD) % (2 * RAD) - RAD, z = cam[2] + ((hz * 2 * RAD + wv[1] * fallT - cam[2]) % (2 * RAD) + 2 * RAD) % (2 * RAD) - RAD;
    if (Weather.roofed(x, z)) continue;
    put(x, top - ph * H, z, 0.0035 + 0.0025 * hz, c[0], c[1], c[2], 0.34 * (0.4 + 0.6 * r), 0, 4, 70 + 50 * hy, hx);
  }
  // splashes: a fixed set of spots, each flashing for a moment and moving on
  const ns = Math.round(n / 9);
  for (let i = 0; i < ns; i++) {
    const slot = time * 3.1 + i * 0.37, k = slot % 1, id = Math.floor(slot) * 7.13 + i * 3.71, a = (Math.sin(id * 12.9898) * 43758.5453) % 1, b = (Math.sin(id * 78.233) * 12543.123) % 1;
    const x = cam[0] + a * 7.5, z = cam[2] + b * 7.5; if (Weather.roofed(x, z)) continue;
    put(x, World.groundY(x, z) + 0.03 + k * 0.05, z, 0.025 + k * 0.07, c[0], c[1], c[2], 0.5 * (1 - k) * r, 0, 0, 1, a);
  }
};
