// ───────────────────────── time of day, sky colours, light ─────────────────────────
const Env = { hour: 7.9, dayLength: 1200, paused: false, cover: 0.38, mist: 0.07 };      // dayLength: real seconds per in-game day
const ENV = {
  keyDir: [0, 1, 0], keyCol: [3, 3, 3], sunDir: [0, 1, 0], moonDir: [0, 1, 0], ambSky: [0, 0, 0], ambGnd: [0, 0, 0],
  fogCol: [0, 0, 0], fogSun: [0, 0, 0], zenith: [0, 0, 0], horizon: [0, 0, 0], windDir: [0.8, 0.6], windStrength: 1,
  exposure: 0.6, shadowStrength: 1, night: 0, day: 1, cloud: 0.45, fogDensity: 0.001, stars: 0, aurora: 0, moonBright: 0, sunDisc: 0, windowGlow: 0,
};
// ── one wind ──
// The whole valley shares one moving air: a direction that veers slowly, a strength, and gusts: a noise pattern carried downwind
// (Wind.off is how far the air has travelled). The shaders read the same pattern (SH.gust in 40_shade.js), so smoke, falling leaves and
// the sound of the wind (CPU) agree with grass, trees, washing and signs (GPU).
const Wind = { off: [0, 0], time: -1, SPEED: 2.7 };
Wind.step = function (time, env) {
  const dt = Wind.time < 0 ? 0 : clamp(time - Wind.time, 0, 0.5); Wind.time = time;
  const a = 0.6435 + 0.30 * Math.sin(time * 0.011) + 0.12 * Math.sin(time * 0.037);       // about the old fixed heading (0.8, 0.6), swinging some 20 degrees either way
  env.windDir = [Math.cos(a), Math.sin(a)];
  Wind.off[0] += env.windDir[0] * Wind.SPEED * dt; Wind.off[1] += env.windDir[1] * Wind.SPEED * dt;
};
Wind.gust = function (x, z) {        // the same value as SH.gust: about -0.4 in a lull .. 0.6 in a gust
  const t = G.noiseTex, d = t && t.image && t.image.data; if (!d) return 0;
  const u = (x - Wind.off[0]) * 0.013 * 256 - 0.5, v = (z - Wind.off[1]) * 0.013 * 256 - 0.5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
  const at = (a, b) => d[(((b % 256) + 256) % 256 * 256 + ((a % 256) + 256) % 256) * 4];
  return (lerp(lerp(at(i, j), at(i + 1, j), fu), lerp(at(i, j + 1), at(i + 1, j + 1), fu), fv)) / 255 - 0.42;
};
Wind.feel = (x, z) => ENV.windStrength * Math.max(0.12, 0.7 + 1.7 * Wind.gust(x, z));         // wind speed felt at a place, 1 = a steady breeze
Wind.at = (x, z) => { const k = Wind.feel(x, z); return [ENV.windDir[0] * k, ENV.windDir[1] * k]; };
// Which vertices of a kit piece hang free, for the kit batcher (it calls this per primitive; two marked lines in 44_kit.js).
// Returns null, or { w(i): byte 255 = fixed .. 0 = free, dir: byte 255 = cloth, else the compass direction a hung board swings in }.
SH.hangOf = function (prim, M) {
  let name = SH.hangNames.get(prim);
  if (name === undefined) { for (const n in Kit.pieces) for (const q of Kit.pieces[n].prims) SH.hangNames.set(q, n); name = SH.hangNames.get(prim) || ''; SH.hangNames.set(prim, name); }
  if (/^gen_sign_/.test(name)) {          // the board and its chains, below the arm (73b_alley.js genSign): hung at y = -0.04, the board ends at -0.82
    const e = M.elements, ang = Math.atan2(e[2], e[0]);
    return { w: i => prim.pos[i * 3 + 2] > 0.4 ? 255 - Math.round(255 * sat((-0.04 - prim.pos[i * 3 + 1]) / 0.78)) : 255, dir: Math.round((((ang % TAU) + TAU) % TAU) / TAU * 254) };
  }
  if (/^gen_bunt_|^dr_laundry/.test(name) && /Cloth/.test(prim.mat)) return { w: i => 255 - Math.round(255 * sat((prim.uv[i * 2 + 1] - 0.27) / 0.18)), dir: 255 };      // pennants and washing: the cloth quads run from the line (v 0.27) to the free edge (v 0.45)
  return null;
};
SH.hangNames = new Map();
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function updateEnv(time, indoor) {
  const e = ENV, th = (Env.hour - 6) / 12 * PI, maxEl = 0.62;      // a northern autumn sun: it never climbs high, so shadows stay long
  const sun = v3.norm([Math.cos(th), Math.sin(th) * Math.sin(maxEl), Math.sin(th) * Math.cos(maxEl) + 0.12]);
  const moon = v3.norm([-sun[0] * 0.9 + 0.25, -sun[1] + 0.12, -sun[2] * 0.8 + 0.3]);
  e.sunDir = sun; e.moonDir = moon;
  const sy = sun[1];
  const day = smooth(-0.10, 0.14, sy), night = 1 - smooth(-0.22, -0.02, sy);
  const golden = Math.exp(-(sy * sy) / 0.06);                 // peaks at the horizon
  e.day = day; e.night = night;
  const sunI = smooth(-0.015, 0.11, sy), moonI = smooth(0.02, 0.2, moon[1]) * smooth(-0.04, -0.12, sy);
  const sunCol = mix3([1.0, 0.42, 0.14], [1.0, 0.925, 0.79], smooth(0.0, 0.42, sy));
  if (sunI > 0.001 || moonI <= 0) { e.keyDir = sun[1] > 0.02 ? sun : v3.norm([sun[0], 0.02, sun[2]]); e.keyCol = v3.scale(sunCol, 3.7 * sunI); }
  else { e.keyDir = moon; e.keyCol = v3.scale([0.36, 0.54, 1.0], 0.17 * moonI); }
  e.shadowStrength = sunI > 0.001 ? smooth(0.0, 0.25, sunI) : smooth(0.0, 0.3, moonI) * 0.9;
  // sky
  const zDay = [0.115, 0.28, 0.72], hDay = [0.52, 0.68, 0.90], zSet = [0.10, 0.15, 0.36], hSet = [0.95, 0.50, 0.24], zNight = [0.0035, 0.007, 0.020], hNight = [0.010, 0.019, 0.040];
  let z = mix3(zNight, zSet, smooth(-0.24, 0.0, sy)), h = mix3(hNight, hSet, smooth(-0.20, 0.02, sy));
  z = mix3(z, zDay, smooth(0.0, 0.30, sy)); h = mix3(h, hDay, smooth(0.04, 0.34, sy));
  e.zenith = z; e.horizon = h;
  e.fogSun = v3.scale(sunCol, (0.22 + 0.75 * golden) * smooth(-0.12, 0.04, sy));
  e.sunDisc = 26 * smooth(-0.03, 0.05, sy);
  e.ambSky = v3.add(v3.add(v3.scale(mix3(z, h, 0.45), 1.0), v3.scale(sunCol, 0.07 * sunI)), [0.004, 0.006, 0.012]);
  e.ambGnd = v3.add(v3.scale(mix3([0.20, 0.17, 0.12], [0.30, 0.20, 0.14], golden), (0.10 + 0.55 * day)), [0.002, 0.003, 0.006]);
  // night: what little bounces up from the ground is moonlit blue, not the warm earth of the day, so unlit streets read as dark blue
  e.ambGnd = mix3(e.ambGnd, [0.0045, 0.0075, 0.017], night); e.ambSky = mix3(e.ambSky, [0.008, 0.016, 0.040], night * 0.6);
  const mist = Math.exp(-Math.pow((Env.hour - 6.3) / 1.3, 2)) * 0.9 + Math.exp(-Math.pow((Env.hour - 19.6) / 1.5, 2)) * 0.2;
  e.fogCol = mix3(mix3(h, z, 0.42), [0.5 * (h[0] + h[1]), 0.5 * (h[0] + h[1]), 0.5 * (h[1] + h[2])], 0.25);
  e.fogDensity = 0.00115 * (1 + mist * 1.3 + golden * 0.5) + 0.0005 * night;
  e.stars = night; e.aurora = night * (0.55 + 0.45 * Math.sin(time * 0.05));
  e.moonBright = smooth(-0.02, -0.14, sy) * 1.4;
  e.cloud = 0.44 + 0.16 * Math.sin(time * 0.011 + 1.3);
  e.windStrength = 0.75 + 0.4 * Math.sin(time * 0.07) + 0.2 * Math.sin(time * 0.23); Wind.step(time, e);
  e.windowGlow = smooth(0.62, 0.22, day);
  const outExp = lerp(lerp(0.56, 0.84, golden), 3.0, night);
  e.exposure = lerp(outExp, lerp(1.05, 1.25, night), indoor || 0);
  // weather: a light overcast with mist that gathers over the valley around dawn (Env.cover / Env.mist set the base amounts)
  if (typeof Sky !== 'undefined' && Sky.applyWeather) { Sky.setWeather(Env.cover, Env.mist + 0.24 * Math.exp(-Math.pow((Env.hour - 6.6) / 1.5, 2))); Sky.applyWeather(e); }
  if (World.cell) Cells.env(e);      // overcast and mist reshape the light, see 45_sky.js
  return e;
}
