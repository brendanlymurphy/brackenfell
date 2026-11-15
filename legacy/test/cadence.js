// drives the adaptive-quality logic with a synthetic device: cost(tier, scale) in ms, and a callback cadence that may be capped
const out = [];
const realApply = game.applyQuality, realToast = window.toast;
const toasts = [];
toast = (m) => { toasts.push(m); };
game.applyQuality = async () => { let t = game.qualitySetting; if (t === 'auto') t = game.autoTier || 'medium'; game.tier = t; };
window.__TEST__.loop = 1;
function run(name, costFn, capFn, secs, opts) {
  opts = opts || {};
  Object.assign(Perf, { ft: 16.7, T: 16.7, hold: 3, ceil: 1, ceilT: 0, lowT: 0, acc: 0, n: 0, probeN: 0, probeAt: -99, fastT: 0, capT: 0, first: 0.45, fails: 0, triedHigh: false, goodT: 0, probeT: 0, raised: false, capSaid: false });
  Perf.probeBuf.length = 0; toasts.length = 0;
  game.qualitySetting = 'auto'; game.autoTier = null; game.tier = 'medium'; game.playing = opts.title ? false : true; R.scale = 1; R.busy = false;
  let t = 0, probes = 0, frozen = 0; const log = [];
  let lastKey = '';
  while (t < secs) {
    const C = capFn(t);
    let dt;
    if (Perf.probeN > 0) { dt = C; if (Perf.probeN === 7) probes++; frozen += dt; Perf.probeBuf.push(dt); if (--Perf.probeN === 0) cadenceDone(); }
    else { const cost = costFn(game.tier, R.scale, t); dt = Math.ceil(cost / C - 1e-6) * C; game.time += dt / 1000; perfUpdate(Math.min(dt, 100), Math.min(dt, 100) / 1000); }
    t += dt / 1000;
    const key = game.tier + ' ' + R.scale.toFixed(2) + ' T' + Perf.T.toFixed(1);
    if (key !== lastKey) { log.push(t.toFixed(1) + 's ' + key); lastKey = key; }
  }
  out.push(name + ' => END ' + lastKey + ' fps~' + Math.round(1000 / Perf.ft) + ' probes ' + probes + ' frozen ' + Math.round(frozen) + 'ms | toasts: ' + JSON.stringify(toasts) + '\n    ' + log.slice(0, 40).join(' | '));
}
const k = { medium: 1, high: 1.55, low: 0.55 };
run('1 fast phone, no cap', (tier, s) => (3 + 6 * s * s) * k[tier], () => 16.7, 60);
run('2 mid phone, no cap', (tier, s) => (6 + 18 * s * s) * k[tier], () => 16.7, 90);
run('3 fast phone, Low Power Mode from the start', (tier, s) => (3 + 6 * s * s) * k[tier], () => 33.3, 90);
run('4 fast phone, cap lifts at 50s', (tier, s) => (3 + 6 * s * s) * k[tier], t => t < 50 ? 33.3 : 16.7, 120);
run('5 mid phone, cap lifts at 50s', (tier, s) => (6 + 18 * s * s) * k[tier], t => t < 50 ? 33.3 : 16.7, 200);
run('6 fast phone, thermal cap starts at 40s', (tier, s) => (3 + 6 * s * s) * k[tier], t => t < 40 ? 16.7 : 33.3, 120);
run('7 weak phone, no cap', (tier, s) => (14 + 30 * s * s) * k[tier], () => 16.7, 120);
run('8 weak phone in Low Power Mode', (tier, s) => (14 + 30 * s * s) * k[tier], () => 33.3, 120);
run('9 title screen only (throttled frame)', (tier, s) => (3 + 6 * s * s) * k[tier], () => 33.3, 40, { title: 1 });
run('10 120Hz phone, fast', (tier, s) => (3 + 6 * s * s) * k[tier], () => 8.33, 60);
run('11 120Hz phone, mid', (tier, s) => (6 + 18 * s * s) * k[tier], () => 8.33, 90);
game.applyQuality = realApply; toast = realToast; window.__TEST__.loop = 0; game.playing = true;
return '\n' + out.join('\n');
