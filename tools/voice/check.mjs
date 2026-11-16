// Checks the generated voice files against the plan: every spoken line has a file, durations fit the text (catches truncated or babbling output),
// nothing is silent or clipped, the total is within the 10 MB budget. usage: node tools/voice/check.mjs [--allow-missing]
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const root = new URL('../../', import.meta.url).pathname, dir = root + 'audio/voice/', plan = JSON.parse(fs.readFileSync(root + 'tools/voice/plan.json', 'utf8')).plan;
const man = fs.existsSync(dir + 'manifest.json') ? JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8')) : { lines: {} };
const allow = process.argv.includes('--allow-missing'); let fail = 0, bytes = 0, secs = 0, n = 0, missing = 0; const bad = m => { fail++; console.log('FAIL', m); };
for (const p of plan) {
  const e = man.lines[p.key], file = e && e.f; if (!e || !fs.existsSync(dir + file))        /* the manifest names the file (Gemini files are named differently from the plan's Kokoro names) */ { missing++; if (!allow) bad('missing ' + p.speaker + ': ' + p.text.slice(0, 50)); continue; }
  const size = fs.statSync(dir + file).size; bytes += size; secs += e.d; n++;
  // ~0.065 s per character at speed 1 (British Kokoro voices), so slower or faster casting scales it; allow a wide but telling band
  const per = (e.d - 0.35) / p.say.length * p.speed, lo = 0.035, hi = 0.11; if (p.say.length < 14 ? (e.d < 0.4 || e.d > 3.2) : (per < lo || per > hi)) bad(`duration ${e.d}s for ${p.say.length} chars (${per.toFixed(3)} s/char x speed) ${p.speaker}: ${p.text.slice(0, 40)}`);
  const s = (execFileSync('sh', ['-c', `ffmpeg -v info -i '${dir + file}' -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"`], { encoding: 'utf8' }));
  const mean = +/mean_volume: (-?[\d.]+)/.exec(s)[1], max = +/max_volume: (-?[\d.]+)/.exec(s)[1];
  if (max < -30 || Math.max(...e.e) < 4) bad('silent ' + file); if (max > -1.0) bad(`clipped (${max} dB) ` + file); if (mean < -32 || mean > -10) bad(`mean ${mean} dB out of range ` + file);
}
console.log(`${n}/${plan.length} files, ${(secs / 60).toFixed(1)} minutes, ${(bytes / 1048576).toFixed(2)} MB${missing ? ', ' + missing + ' missing' : ''}`);
if (bytes > 10 * 1048576) bad('over the 10 MB budget');
console.log(fail ? fail + ' FAILURES' : 'voice files ok'); process.exit(fail ? 1 : 0);
