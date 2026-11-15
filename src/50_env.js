// ───────────────────────── time of day, sky colours, light ─────────────────────────
const Env = { hour: 7.9, dayLength: 1200, paused: false, cover: 0.38, mist: 0.07 };      // dayLength: real seconds per in-game day
const ENV = {
  keyDir: [0, 1, 0], keyCol: [3, 3, 3], sunDir: [0, 1, 0], moonDir: [0, 1, 0], ambSky: [0, 0, 0], ambGnd: [0, 0, 0],
  fogCol: [0, 0, 0], fogSun: [0, 0, 0], zenith: [0, 0, 0], horizon: [0, 0, 0], windDir: [0.8, 0.6], windStrength: 1,
  exposure: 0.6, shadowStrength: 1, night: 0, day: 1, cloud: 0.45, fogDensity: 0.001, stars: 0, aurora: 0, moonBright: 0, sunDisc: 0, windowGlow: 0,
};
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
  else { e.keyDir = moon; e.keyCol = v3.scale([0.50, 0.64, 1.0], 0.20 * moonI); }
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
  const mist = Math.exp(-Math.pow((Env.hour - 6.3) / 1.3, 2)) * 0.9 + Math.exp(-Math.pow((Env.hour - 19.6) / 1.5, 2)) * 0.2;
  e.fogCol = mix3(mix3(h, z, 0.42), [0.5 * (h[0] + h[1]), 0.5 * (h[0] + h[1]), 0.5 * (h[1] + h[2])], 0.25);
  e.fogDensity = 0.00115 * (1 + mist * 1.3 + golden * 0.5) + 0.0005 * night;
  e.stars = night; e.aurora = night * (0.55 + 0.45 * Math.sin(time * 0.05));
  e.moonBright = smooth(-0.02, -0.14, sy) * 1.4;
  e.cloud = 0.44 + 0.16 * Math.sin(time * 0.011 + 1.3);
  e.windStrength = 0.75 + 0.4 * Math.sin(time * 0.07) + 0.2 * Math.sin(time * 0.23);
  e.windowGlow = smooth(0.62, 0.22, day);
  const outExp = lerp(lerp(0.56, 0.84, golden), 3.0, night);
  e.exposure = lerp(outExp, lerp(1.05, 1.25, night), indoor || 0);
  // weather: a light overcast with mist that gathers over the valley around dawn (Env.cover / Env.mist set the base amounts)
  if (typeof Sky !== 'undefined' && Sky.applyWeather) { Sky.setWeather(Env.cover, Env.mist + 0.24 * Math.exp(-Math.pow((Env.hour - 6.6) / 1.5, 2))); Sky.applyWeather(e); }
  if (World.cell) Cells.env(e);      // overcast and mist reshape the light, see 45_sky.js
  return e;
}
