// [audit] Plays the story with the play bot (real keys and clicks) and records, for every line of speech the game shows, whether a recording existed and started.
// It does not change test/playbot.mjs: it runs a copy with one recorder line added after the page opens.
// usage: node test/audit/voicebot.mjs [--run story,side,...]   -> shots/audit/voice_lines.jsonl (one JSON per shown line)
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
const root = new URL('../../', import.meta.url).pathname, out = root + 'shots/audit/voice_lines.jsonl';
let src = fs.readFileSync(root + 'test/playbot.mjs', 'utf8');
const REC = `(() => { const iv = setInterval(() => { try { if (typeof Snd === 'undefined' || !Snd.vox || !Snd.vox.wrapped || !Snd.vox.man || Snd.__rec) return; Snd.__rec = 1; clearInterval(iv); const V = Snd.vox, say = Snd.say;
  Snd.say = function (npc, text) { const id = npc && (npc.id || npc), has = t => !!V.man.lines[V.keyOf(id, t)], parts = String(text).split('\\n\\n'); const r = say.apply(this, arguments);
    const rec = { kind: 'dialogue', speaker: id, name: npc && npc.name, text: String(text), whole: has(text), parts: parts.length, partsWithFile: parts.filter(has).length, accepted: !!r, ctx: Snd.ctx && Snd.ctx.state, voicesOn: !!Snd.set.voices, hour: +Env.hour.toFixed(1) };
    setTimeout(() => { rec.started = !!(V.lastPlayed && V.lastPlayed.text === String(text)); console.log('[voicerec]' + JSON.stringify(rec)); }, 1200); return r; };
  const bark = V.bark; V.bark = function (npc, c) { const r = bark.apply(this, arguments); console.log('[voicerec]' + JSON.stringify({ kind: 'bark', speaker: npc.id, name: npc.name, cat: c, accepted: !!r })); return r; };
  if (typeof toast === 'function') { const ts = toast; toast = function (h) { const m = /^<b>(\\w+)<\\/b>: “(.+)”$/.exec(String(h)); if (m) console.log('[voicerec]' + JSON.stringify({ kind: 'overheard', speaker: m[1].toLowerCase(), text: m[2], whole: !!V.man.lines[V.keyOf(m[1].toLowerCase(), m[2])] })); return ts.apply(this, arguments); }; }
} catch (e) { console.log('[voicerec]' + JSON.stringify({ kind: 'error', text: String(e) })); } }, 200); })()`;
const a = 'await ev(IN_PAGE);'; if (!src.includes(a)) throw new Error('playbot.mjs changed: anchor not found');
src = src.replace(a, a + ' await page.evaluate(' + JSON.stringify(REC) + ');');
const b = "page.on('pageerror',"; src = src.replace(b, "page.on('console', m => { const t = m.text(); if (t.startsWith('[voicerec]')) fs.appendFileSync(" + JSON.stringify(out) + ", t.slice(10) + '\\n'); }); " + b);
if (!/import fs from/.test(src)) src = "import fs from 'node:fs';\n" + src;
const tmp = root + 'test/_audit_playbot.mjs'; fs.writeFileSync(tmp, src); fs.mkdirSync(root + 'shots/audit', { recursive: true }); fs.writeFileSync(out, '');
const r = spawnSync('node', [tmp, ...process.argv.slice(2)], { stdio: 'inherit', cwd: root }); fs.unlinkSync(tmp); process.exit(r.status || 0);
