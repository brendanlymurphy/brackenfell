// Builds tools/voice/plan.json (what to generate) and the key function the game shares. usage: node tools/voice/plan.mjs
// A line's key is a hash of speaker + exact on-screen text (88d_voice.js computes the same); its file name is a hash that also covers the voice settings.
import fs from 'node:fs'; import crypto from 'node:crypto';
const root = new URL('../../', import.meta.url).pathname, J = f => JSON.parse(fs.readFileSync(root + 'tools/voice/' + f, 'utf8'));
export const cyrb53 = (str, seed = 0) => { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
const cast = J('cast.json'), pron = J('pronounce.json'), barks = J('barks.json'), ex = J('lines.json');
export const clean = (t) => { let s = t.replace(/\[[^\]]*\]/g, '').replace(/\*[^*]*\*/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s*[—–]\s*/g, ', ').replace(/…/g, '...').replace(/\.\.\.\s*/g, '... ').replace(/\s+/g, ' ').trim();
  for (const [w, r] of Object.entries(pron)) { if (w.startsWith('_')) continue; s = s.replace(new RegExp("(?<![\\w'])" + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(?![\\w])", 'gi'), r); } return s; };
const plan = [], seen = new Set(), manifestBarks = {};
const add = (speaker, text, kind) => { const c = cast[speaker]; if (!c) { console.error('no cast for', speaker); return; } const key = cyrb53(speaker + '\n' + text); if (seen.has(key)) return; seen.add(key);
  const say = clean(text), file = crypto.createHash('sha1').update([speaker, c.voice, c.speed, c.pitch, say].join('|')).digest('hex').slice(0, 14) + '.m4a';
  plan.push({ key, speaker, kind, text, say, voice: c.voice, speed: c.speed, pitch: c.pitch, file }); return key; };
for (const l of ex.lines) add(l.speaker, l.text, 'line');
for (const [sp, cats] of Object.entries(barks)) { if (sp.startsWith('_')) continue; manifestBarks[sp] = {}; for (const [cat, arr] of Object.entries(cats)) manifestBarks[sp][cat] = arr.map(t => add(sp, t, 'bark')); }
// priority order for generation: the main characters' first lines and the first quest come first
const first = ['hale', 'greta', 'brandt', 'marta', 'aldous', 'maren', 'rowan']; plan.sort((a, b) => (a.kind === 'line' ? 0 : 1) - (b.kind === 'line' ? 0 : 1) || (first.includes(a.speaker) ? 0 : 1) - (first.includes(b.speaker) ? 0 : 1));
fs.writeFileSync(root + 'tools/voice/plan.json', JSON.stringify({ plan, barks: manifestBarks }, null, 1));
console.log(plan.length + ' files planned (' + plan.filter(p => p.kind === 'line').length + ' dialogue, ' + plan.filter(p => p.kind === 'bark').length + ' barks), ' + plan.reduce((a, p) => a + p.say.length, 0) + ' characters');
