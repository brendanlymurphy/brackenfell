// Checks the generated voice files against the plan: every spoken line has a file, durations fit the text (catches truncated or babbling output),
// nothing is silent or clipped, the total is within the 14 MB budget. usage: node tools/voice/check.mjs [--allow-missing]
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const root = new URL('../../', import.meta.url).pathname, dir = root + 'audio/voice/', plan = JSON.parse(fs.readFileSync(root + 'tools/voice/plan.json', 'utf8')).plan;
const man = fs.existsSync(dir + 'manifest.json') ? JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8')) : { lines: {} };
const allow = process.argv.includes('--allow-missing'); let fail = 0, bytes = 0, secs = 0, n = 0, missing = 0; const bad = m => { fail++; console.log('FAIL', m); };
for (const p of plan) {
  const e = man.lines[p.key], file = e && e.f; if (!e || !fs.existsSync(dir + file))        /* the manifest names the file (Gemini files are named differently from the plan's Kokoro names) */ { missing++; if (!allow) bad('missing ' + p.speaker + ': ' + p.text.slice(0, 50)); continue; }
  const size = fs.statSync(dir + file).size; bytes += size; secs += e.d; n++;
  // Length against the text. An acted voice (Gemini) pauses where Kokoro did not, so the old upper band (0.11 s per character) flagged good
  // lines; what must never ship is a take that is not the line at all: gemini-3.8-flash-tts read the acting direction aloud and returned
  // 24 s for "Hey! I only sell apples!". So: fail anything over 0.45 s per character (4 s for the shortest barks), anything over 30 s,
  // and anything implausibly fast (under 0.035 s per character: a cut-off take).
  const per = e.d / p.say.length; if ((e.d > 30 && e.d > p.say.length * 0.13) /* over 30 s is a fault unless the line is long enough to take it: Rowan's two 340-character lines run 35 to 40 s read slowly, and the flat limit kept them silent for ever */ || e.d > Math.max(4, p.say.length * 0.45) || (p.say.length >= 14 ? per < 0.035 : e.d < 0.3)) bad(`duration ${e.d}s for ${p.say.length} chars (${per.toFixed(3)} s/char) ${p.speaker}: ${p.text.slice(0, 40)}`);
  const s = (execFileSync('sh', ['-c', `ffmpeg -v info -i '${dir + file}' -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"`], { encoding: 'utf8' }));
  const mean = +/mean_volume: (-?[\d.]+)/.exec(s)[1], max = +/max_volume: (-?[\d.]+)/.exec(s)[1];
  if (max < -30 || Math.max(...e.e) < 4) bad('silent ' + file); if (max > -1.0) bad(`clipped (${max} dB) ` + file); if (mean < -32 || mean > -10) bad(`mean ${mean} dB out of range ` + file);
}
console.log(`${n}/${plan.length} files, ${(secs / 60).toFixed(1)} minutes, ${(bytes / 1048576).toFixed(2)} MB${missing ? ', ' + missing + ' missing' : ''}`);
if (bytes > 14 * 1048576) bad('over the 14 MB budget');       /* 10 MB was set when 180 lines were planned; 252 lines are 12.4 MB. A line is fetched when it is first spoken, never at start-up, so this is disk in the offline cache, not load time */
console.log(fail ? fail + ' FAILURES' : 'voice files ok'); process.exit(fail ? 1 : 0);
