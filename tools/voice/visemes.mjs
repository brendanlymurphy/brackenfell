// Adds a mouth-shape track to every voiced line in audio/voice/manifest.json: "c" = "<centiseconds><shape>..." with Rhubarb Lip Sync's shapes A-H and X.
// (49_chars.js maps them to the 15 Oculus visemes: see VISEME_OF there.) usage: RHUBARB=/path/to/node_modules/rhubarb-lip-sync-wasm node tools/voice/visemes.mjs [--force]
// Rhubarb (MIT, PocketSphinx inside) is not a dependency of the game: install it anywhere (npm i rhubarb-lip-sync-wasm) and point RHUBARB at it. ffmpeg decodes the AAC.
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const R = process.env.RHUBARB || '/tmp/np/node_modules/rhubarb-lip-sync-wasm', { Rhubarb } = await import(pathToFileURL(path.join(R, 'dist/index.js')).href);
const man = JSON.parse(fs.readFileSync('audio/voice/manifest.json', 'utf8')), plan = JSON.parse(fs.readFileSync('tools/voice/plan.json', 'utf8')).plan, text = {};
for (const p of plan) text[p.key] = p.say || p.text;
const log = console.log; console.log = (...a) => { if (!String(a[0]).startsWith('[DEBUG]')) log(...a); };
const force = process.argv.includes('--force'); let n = 0;
for (const [key, e] of Object.entries(man.lines)) {
  if (e.c && !force) continue;
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', 'audio/voice/' + e.f, '-ar', '16000', '-ac', '1', '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const t = (text[key] || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, ' ');
  const r = await Rhubarb.getLipSync(pcm, { dialogText: t });
  let s = '', last = ''; for (const c of r.mouthCues) { if (c.value === last) continue; last = c.value; s += Math.round(c.start * 100) + c.value; }
  e.c = s; n++; log(key, e.d, 's', r.mouthCues.length, 'cues');
  fs.writeFileSync('audio/voice/manifest.json', JSON.stringify(man));      // resumable
}
log('tracks added:', n);
