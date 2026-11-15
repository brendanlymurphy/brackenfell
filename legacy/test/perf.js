const out = {};
const view = async (x, z, yaw, q) => { __game.tp(x, z, yaw); __game.step(3, 1 / 30); const env = updateEnv(__game.time, World.indoor); env.time = __game.time; renderFrame(__game.time, env); const a = Object.assign({}, R.stats); return a.draws + 'd(' + a.sh + 'sh) ' + Math.round(a.tris / 1000) + 'k+' + Math.round(a.shTris / 1000) + 'k'; };
for (const q of ['high', 'medium', 'low']) {
  __game.qualitySetting = q; await __game.applyQuality();
  out[q] = [await view(-78, -5, 90), await view(-9, 9, 25), await view(0, -20, 180), await view(21, -112, 165), await view(100, 6, 150)];
}
const t0 = performance.now(); __game.step(200, 1 / 60); out.tickMs = +((performance.now() - t0) / 200).toFixed(3);
return out;
