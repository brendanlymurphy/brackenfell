// Offline audio test: renders every library sound and a set of ambience states through an OfflineAudioContext (the real engine, the real master chain),
// measures duration, peak, RMS, spectral centroid and silence, fails on NaN, clipping or silence, and saves WAV files and spectrogram PNGs.
// usage: node test/audio.mjs [--out /home/claude/shots/a1] [--only sfx|beds|music] [--json file]
import { chromium, CHROME } from './pw.mjs';
import fs from 'node:fs';
const args = process.argv.slice(2); let out = '/home/claude/shots/a1', only = '', json = '';
for (let i = 0; i < args.length; i++) { if (args[i] === '--out') out = args[++i]; else if (args[i] === '--only') only = args[++i]; else if (args[i] === '--json') json = args[++i]; }
fs.mkdirSync(out, { recursive: true });
const root = new URL('../', import.meta.url).pathname;
const code = ['88_audio', '88b_sfx', '88c_beds', '88c_world', '88c_music'].map(f => fs.readFileSync(root + 'src/' + f + '.js', 'utf8')).join('\n');
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 300)));
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[console]', m.text().slice(0, 300)); });
await page.setContent('<html><body><canvas id="cv"></canvas></body></html>');
await page.addScriptTag({ content: code + '\nwindow.Snd = Snd; window.Audio2 = Audio2;' });
await page.addScriptTag({ content: `
const SR = 48000;
const DEF = { x: 0, y: 0, z: 0, zone: 0, zid: '', indoor: 0, space: 'open', hour: 12, night: 0, day: 1, wind: 0.8, rain: 0, forest: 0.15, meadow: 0.4, playing: true, menu: false, talk: false, dead: false,
  riverD: 99, riverX: 0, riverY: 0, riverZ: 0, lakeD: 99, lakeX: 0, lakeY: 0, lakeZ: 0, sqX: 0, sqY: 0, sqZ: 0, nearSquare: 99, nSquare: 0, mkX: 0, mkY: 0, mkZ: 0, nearMarket: 99, nMarket: 0,
  innZone: 0, innX: 0, innY: 0, innZ: 0, nearInn: 99, nInn: 0, millOn: false, grindOn: false, millX: 0, millY: 0, millZ: 0, millZone: 0, lanternNear: null, pHunter: null, pBarn: null, pFarm: null };
async function renderOffline(secs, prep, stepFn, stepDt) {
  const oc = new OfflineAudioContext(2, Math.ceil(SR * secs), SR);
  Snd.ctx = oc; Snd.last = {}; Snd.fakeNow = undefined; Snd.vEnd.fill(0); Snd.off = false; Snd.err = 0; Snd.testHold = true; Snd.T = 0; Snd.frame = 0;
  Snd.build(oc, { instant: true }); Snd.fadeIn = 1; Snd.pausedMul = 1; Snd.beds && 0;
  for (const k in Snd.sch) Snd.sch[k] = 2;
  Object.assign(Snd.G, DEF);
  if (prep) prep(Snd);
  if (stepFn) { const n = Math.floor(secs / stepDt), ps = []; for (let i = 1; i < n; i++) ps.push(oc.suspend(i * stepDt)); const done = oc.startRendering(); for (let i = 0; i < ps.length; i++) { await ps[i]; stepFn(i, stepDt); oc.resume(); } return await done; }
  return await oc.startRendering();
}
function mono(buf) { const a = buf.getChannelData(0), b = buf.getChannelData(1), m = new Float32Array(a.length); for (let i = 0; i < a.length; i++) m[i] = (a[i] + b[i]) * 0.5; return m; }
function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
const db = x => 20 * Math.log10(Math.max(x, 1e-9));
function analyze(buf, o) {
  o = o || {}; const L = buf.getChannelData(0), Rr = buf.getChannelData(1), m = mono(buf), n = m.length; let peak = 0, nan = 0, sum = 0;
  for (let i = 0; i < n; i++) { const a = L[i], b = Rr[i]; if (a !== a || b !== b) { nan++; continue; } const p = Math.max(Math.abs(a), Math.abs(b)); if (p > peak) peak = p; sum += m[i] * m[i]; }
  const win = Math.floor(SR * 0.02), wr = []; for (let i = 0; i + win <= n; i += win) { let s = 0; for (let k = 0; k < win; k++) s += m[i + k] * m[i + k]; wr.push(Math.sqrt(s / win)); }
  const thr = peak * Math.pow(10, -50 / 20); let first = -1, last = -1, act = 0, na = 0; wr.forEach((r, i) => { if (r > thr) { if (first < 0) first = i; last = i; act += r * r; na++; } });
  const silent = wr.filter(r => r < 3e-4).length / Math.max(1, wr.length);
  // centroid over the loudest frames
  const N = 2048, hann = new Float32Array(N); for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); let cs = 0, cw = 0; const idx = []; for (let i = 0; i + N <= n; i += N / 2) idx.push(i);
  idx.sort((a, b) => { let sa = 0, sb = 0; for (let k = 0; k < N; k += 8) { sa += m[a + k] ** 2; sb += m[b + k] ** 2; } return sb - sa; });
  for (const st of idx.slice(0, 24)) { const re = new Float32Array(N), im = new Float32Array(N); for (let k = 0; k < N; k++) re[k] = m[st + k] * hann[k]; fft(re, im); let s = 0, w = 0; for (let k = 1; k < N / 2; k++) { const mg = Math.hypot(re[k], im[k]); s += mg * k * SR / N; w += mg; } if (w > 0) { cs += s; cw += w; } }
  return { dur: first < 0 ? 0 : +((last - first + 1) * 0.02).toFixed(2), peakDb: +db(peak).toFixed(1), rmsDb: +db(Math.sqrt(sum / n)).toFixed(1), actRmsDb: +db(Math.sqrt(act / Math.max(1, na) )).toFixed(1), centroid: cw ? Math.round(cs / cw) : 0, silentFrac: +silent.toFixed(2), nan, clip: peak > 0.8915, peak };
}
function wavB64(buf, maxSec) { const m = mono(buf), n = Math.min(m.length, Math.floor(SR * (maxSec || 99))), ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, m[i])) * 32767, true);
  let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); }
function specPNG(buf, maxSec) {
  const m = mono(buf), n = Math.min(m.length, Math.floor(SR * (maxSec || 99))), N = 1024, cols = Math.min(900, Math.floor(n / (N / 2))), hop = Math.max(N / 2, Math.floor((n - N) / cols)), rows = 256, cv = document.getElementById('cv'); cv.width = cols; cv.height = rows; const g = cv.getContext('2d'), img = g.createImageData(cols, rows);
  const hann = new Float32Array(N); for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  for (let c = 0; c < cols; c++) { const st = c * hop; if (st + N > n) break; const re = new Float32Array(N), im = new Float32Array(N); for (let k = 0; k < N; k++) re[k] = m[st + k] * hann[k]; fft(re, im);
    for (let r = 0; r < rows; r++) { const f = r / rows * 12000, k = Math.min(N / 2 - 1, Math.round(f / (SR / N))), mg = Math.hypot(re[k], im[k]) / (N / 4), d = Math.max(0, Math.min(1, (db(mg) + 100) / 70)), y = rows - 1 - r, o = (y * cols + c) * 4; img.data[o] = 255 * Math.min(1, d * 1.6); img.data[o + 1] = 255 * Math.max(0, d * 1.6 - 0.6); img.data[o + 2] = 255 * Math.max(0, 0.6 - Math.abs(d - 0.3)) * 1.2; img.data[o + 3] = 255; } }
  g.putImageData(img, 0, 0); return cv.toDataURL('image/png').split(',')[1]; }
window.T = { renderOffline, analyze, wavB64, specPNG, DEF, SR };
` });
const results = []; let fail = 0;
const save = async (name, b64wav, b64png) => { if (b64wav) fs.writeFileSync(`${out}/${name}.wav`, Buffer.from(b64wav, 'base64')); if (b64png) fs.writeFileSync(`${out}/${name}.png`, Buffer.from(b64png, 'base64')); };
const row = (kind, name, m, note) => { results.push({ kind, name, ...m, note }); const bad = m.nan > 0 || m.clip || m.peakDb < -78; if (bad) fail++; console.log((bad ? 'FAIL ' : 'ok   ') + kind.padEnd(6) + name.padEnd(22) + 'dur ' + String(m.dur).padStart(5) + 's  peak ' + String(m.peakDb).padStart(6) + '  rms ' + String(m.rmsDb).padStart(6) + '  act ' + String(m.actRmsDb).padStart(6) + '  cent ' + String(m.centroid).padStart(5) + ' Hz  silent ' + m.silentFrac + (m.nan ? '  NaN ' + m.nan : '') + (m.clip ? '  CLIP' : '') + (note ? '  ' + note : '')); };

// ── one-shots ──
if (!only || only === 'sfx') {
  const names = await page.evaluate(() => Object.keys(Snd.lib));
  const keep = new Set(['fs.cobble', 'fs.dirt', 'fs.grass', 'fs.mud', 'fs.water', 'fs.wood', 'fs.plank', 'fs.stone', 'fs.stairs', 'door.open', 'door.close', 'door.locked', 'chest.open', 'pickup.coin', 'hit.flesh', 'hit.metal', 'hit.shield', 'swing.heavy', 'bell.stroke', 'anvil', 'bird.robin', 'bird.chaffinch', 'bird.wren', 'bird.thrush', 'bird.pigeon', 'owl', 'dog', 'rooster', 'q.begin', 'q.done', 'discover', 'hurt', 'heart', 'foe.shout', 'creak', 'drip', 'bellows', 'paddle', 'breath', 'land']);
  for (const nm of names) {
    const r = await page.evaluate(async (nm) => { const secs = Math.max(1.5, Math.min(7, (Snd.lib[nm].dur || 1) + 0.8)); let best = null; const ms = [];
      for (let k = 0; k < 3; k++) { const buf = await T.renderOffline(secs, S => { S.play(nm, null, 1, { w: 1, v: 9, lo: 0.8, delay: 0.3 }); }); const m = T.analyze(buf); ms.push(m); if (k === 1 || !best) best = { m, wav: T.wavB64(buf, 6), png: T.specPNG(buf, 6) }; }
      ms.sort((a, b) => a.peakDb - b.peakDb); best.m.peakDb = ms[1].peakDb; best.m.clip = ms.some(x => x.clip); best.m.nan = ms.reduce((a, x) => a + x.nan, 0); return best; }, nm);
    row('sfx', nm, r.m); if (keep.has(nm)) await save('sfx_' + nm.replace(/\./g, '_'), r.wav, r.png);
  }
  // footsteps in a row, as a player would walk, per surface; and the stride test
  const w = await page.evaluate(async () => { const secs = 22, surf = ['cobble', 'dirt', 'grass', 'mud', 'water', 'wood', 'plank', 'stone', 'stairs']; const buf = await T.renderOffline(secs, S => { surf.forEach((s, i) => { for (let k = 0; k < 6; k++) S.c && S.play('fs.' + s, null, 1, { w: 1, free: true, delay: 0.3 + i * 2.4 + k * 0.38 }); }); }); return { wav: T.wavB64(buf), png: T.specPNG(buf), m: T.analyze(buf) }; });
  await save('footsteps_walk', w.wav, w.png); row('sfx', 'footsteps_walk(all)', w.m);
}

// ── ambience states ──
const STATES = [
  ['square_noon', { hour: 12, day: 1, wind: 0.8, forest: 0.05, meadow: 0.1, sqX: 7, nearSquare: 7, nSquare: 6, mkX: 30, mkZ: 3, nearMarket: 30 }],
  ['square_dawn', { hour: 6.2, day: 0.45, wind: 0.5, forest: 0.1, meadow: 0.2, sqX: 8, nearSquare: 8, nSquare: 2 }],
  ['forest_wind', { hour: 13, wind: 1.0, forest: 1, meadow: 0 }],
  ['forest_dawn_birds', { hour: 6, day: 0.4, wind: 0.4, forest: 0.9, meadow: 0 }],
  ['meadow_evening', { hour: 18.2, day: 0.55, night: 0.15, wind: 0.5, forest: 0.1, meadow: 1 }],
  ['meadow_night', { hour: 23, day: 0, night: 1, wind: 0.5, forest: 0.1, meadow: 1 }],
  ['river_bank', { riverD: 4, riverX: 4, wind: 0.6 }],
  ['river_40m', { riverD: 40, riverX: 40, wind: 0.6 }],
  ['lake_shore', { lakeD: 3, lakeX: 0, lakeZ: 3, wind: 0.5 }],
  ['rain_open', { rain: 0.8, wind: 0.9, hour: 14 }],
  ['rain_indoors', { rain: 0.8, indoor: 1, zone: 4, space: 'room', hour: 14 }],
  ['inn_evening', { hour: 20.5, day: 0, night: 0.9, indoor: 1, zone: 5, zid: 'inn', space: 'hall', innZone: 5, innX: 3, nearInn: 3, nInn: 6, fires: [{ on: true, x: -3, y: 0, z: -1, zone: 5, ref: 1.8, max: 32, lvl: 1 }], riverD: 6, riverX: 6, nSquare: 0 }],
  ['inn_vs_river', { hour: 14, indoor: 1, zone: 5, zid: 'inn', space: 'hall', riverD: 6, riverX: 6, innZone: 5, nInn: 0 }],
  ['hearth_near', { hour: 20, night: 0.9, indoor: 1, zone: 3, space: 'room', fires: [{ on: true, x: 1.5, y: 0, z: 0, zone: 3, ref: 1.8, max: 32, lvl: 0.9 }] }],
  ['hearth_other_room', { hour: 20, night: 0.9, indoor: 0, zone: 0, fires: [{ on: true, x: 6, y: 0, z: 0, zone: 3, ref: 1.8, max: 32, lvl: 0.9 }] }],
  ['bonfire_10m', { hour: 20, night: 0.9, day: 0, fires: [{ on: true, x: 10, y: 0, z: 0, zone: 0, ref: 4, max: 70, lvl: 1.5 }] }],
  ['cellar', { indoor: 1, zone: 9, zid: 'cellar', space: 'cave' }],
  ['chapel', { hour: 10, indoor: 1, zone: 8, zid: 'chapel', space: 'hall' }],
  ['mill_10m', { millOn: true, millX: 10, riverD: 12, riverX: 12 }],
  ['alley_windy', { hour: 12, wind: 1.3, nearMarket: 6, mkX: 5, nMarket: 3, lanternNear: [3, 3, 2] }]
];
if (!only || only === 'beds') {
  for (const [name, g] of STATES) {
    const r = await page.evaluate(async ([name, g]) => {
      const secs = 14; const buf = await T.renderOffline(secs, S => { Object.assign(S.G, g); S.G.fires = g.fires ? g.fires.concat([{ on: false }, { on: false }]).slice(0, 3) : S.G.fires.map(f => ({ ...f, on: false })); S.fadeIn = 1; S.G.fires.forEach(f => { f.sc = 1; }); }, (i, dt) => { Object.assign(Snd.G, g); if (g.fires) Snd.G.fires = g.fires.concat([{ on: false }, { on: false }]).slice(0, 3); Snd.step(dt); }, 0.1);
      const m = T.analyze(buf); const beds = {}; for (const k in Snd.beds) { const b = Snd.beds[k]; if (Array.isArray(b)) b.forEach((x, i) => { if (x.lvl > 0.0015) beds[k + i] = +x.lvl.toFixed(4); }); else if (b.lvl > 0.0015) beds[k] = +b.lvl.toFixed(4); }
      // loudness of the last ten seconds
      const L = buf.getChannelData(0), R = buf.getChannelData(1); let s = 0, n = 0; for (let i = SR * 4; i < L.length; i++) { s += (L[i] * L[i] + R[i] * R[i]) / 2; n++; } m.tailRms = +(20 * Math.log10(Math.sqrt(s / n) + 1e-9)).toFixed(1);
      return { m, beds, wav: T.wavB64(buf, 14), png: T.specPNG(buf, 14), err: Snd.err ? Snd.errMsg : '' };
    }, [name, g]);
    row('bed', name, r.m, 'tail ' + r.m.tailRms + ' dB  ' + JSON.stringify(r.beds) + (r.err ? ' ERR ' + r.err.slice(0, 200) : '')); results[results.length - 1].tailRms = r.m.tailRms; results[results.length - 1].beds = r.beds;
    await save('bed_' + name, r.wav, r.png);
    if (r.err) fail++;
  }
}

// ── music cues ──
if (!only || only === 'music') {
  for (const cue of ['dawn', 'day', 'dusk', 'night', 'tavern', 'tension', 'combat', 'discovery']) {
    const r = await page.evaluate(async (cue) => { const secs = cue === 'discovery' ? 12 : 40; const buf = await T.renderOffline(secs, S => { S.music.cueName = cue; S.renderCue(cue, secs - 4); }); const m = T.analyze(buf); return { m, wav: T.wavB64(buf, 40), png: T.specPNG(buf, 40) }; }, cue);
    row('music', cue, r.m); await save('music_' + cue, r.wav, r.png);
  }
  // the lute: Lark's tune, 24 s, from 3 m away
  const l = await page.evaluate(async () => { const buf = await T.renderOffline(24, S => { S.G.lark.on = true; S.G.lark.x = 3; S.G.lark.d = 3; S.G.lark.y = 0; S.G.lark.zone = 0; }, (i, dt) => { Snd.G.lark.on = true; Snd.G.lark.x = 3; Snd.G.lark.d = 3; Snd.step(dt); }, 0.05); return { m: T.analyze(buf), wav: T.wavB64(buf, 24), png: T.specPNG(buf, 24) }; });
  row('music', 'lute(Lark)', l.m); await save('music_lute', l.wav, l.png);
}

// ── checks across states ──
const by = n => results.find(r => r.kind === 'bed' && r.name === n);
const check = (ok, msg) => { console.log((ok ? 'pass ' : 'FAIL ') + msg); if (!ok) fail++; };
if (by('river_bank') && by('inn_vs_river')) {
  check(by('river_bank').beds.river > 4.5 * (by('inn_vs_river').beds.river || 0), `river bed gain at the bank (${by('river_bank').beds.river}) is > 13 dB above its gain from inside the inn (${by('inn_vs_river').beds.river})`);
  check(by('river_bank').tailRms > by('river_40m').tailRms + 3, `river falls off with distance (${by('river_bank').tailRms} -> ${by('river_40m').tailRms} dB)`);
  check(by('hearth_near').tailRms > by('hearth_other_room').tailRms + 3, `a fire is louder in its own room (${by('hearth_near').tailRms}) than from outside (${by('hearth_other_room').tailRms})`);
  check(by('rain_open').tailRms > by('rain_indoors').tailRms + 1.5, `rain is quieter indoors`);
  check(by('meadow_night').beds.night > 0 && !by('square_noon').beds.night, `night shimmer only at night`);
  for (const r of results.filter(r => r.kind === 'bed')) check(r.tailRms > -52 && r.tailRms < -16, `${r.name} bed loudness ${r.tailRms} dB sits in -52..-16`);
}
fs.writeFileSync(json || `${out}/audio_results.json`, JSON.stringify(results.map(r => { const { peak, ...x } = r; return x; }), null, 1));
console.log(fail ? `\n${fail} FAILURES` : '\nall audio checks passed'); await browser.close(); process.exit(fail ? 1 : 0);
