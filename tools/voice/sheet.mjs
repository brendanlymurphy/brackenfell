// A contact sheet to judge the casting by ear: one line from each of ten characters, joined with gaps, written as WAV and m4a. usage: node tools/voice/sheet.mjs [outdir]
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const root = new URL('../../', import.meta.url).pathname, out = process.argv[2] || '/home/claude/shots/a1', dir = root + 'audio/voice/';
const plan = JSON.parse(fs.readFileSync(root + 'tools/voice/plan.json', 'utf8')).plan, man = JSON.parse(fs.readFileSync(dir + 'manifest.json', 'utf8')).lines; fs.mkdirSync(out, { recursive: true });
const cast = ['hale', 'greta', 'brandt', 'marta', 'aldous', 'maren', 'tobin', 'pip', 'finn', 'rowan', 'lark', 'osric'], pick = [];
for (const sp of cast) { const c = plan.filter(p => p.speaker === sp && p.kind === 'line' && man[p.key]).sort((a, b) => Math.abs(man[a.key].d - 6) - Math.abs(man[b.key].d - 6)); if (c.length) pick.push(c[0]); }
const list = pick.slice(0, 12); const inputs = [], filt = [];
list.forEach((p, i) => { inputs.push('-i', dir + p.file); filt.push(`[${i}:a]aresample=24000,apad=pad_dur=0.8[a${i}]`); });
const fc = filt.join(';') + ';' + list.map((_, i) => `[a${i}]`).join('') + `concat=n=${list.length}:v=0:a=1[o]`;
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', '[o]', '-ac', '1', out + '/voice_cast_sample.wav']);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', out + '/voice_cast_sample.wav', '-c:a', 'aac', '-b:a', '48k', out + '/voice_cast_sample.m4a']);
fs.writeFileSync(out + '/voice_cast_sample.txt', list.map((p, i) => `${i + 1}. ${p.speaker} (${p.voice}, speed ${p.speed}, pitch ${p.pitch}): ${p.text.slice(0, 110)}`).join('\n') + '\n');
console.log(fs.readFileSync(out + '/voice_cast_sample.txt', 'utf8'));
