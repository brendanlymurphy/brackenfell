// Lists every line of spoken dialogue in the game source, with its speaker, and writes tools/voice/lines.json.
// usage: node tools/voice/extract.mjs [--check]     (run from anywhere; reads src/80_game.js, 81_wilds_story.js, 93_inventory.js ... any src file calling node())
// A line is the first argument of node(...) (and the third argument of TALK.buy). Text built at run time from variables (prices, item names)
// cannot be recorded: those are written to dynamic[] and stay text-only. The speaker is the nearest enclosing key / assignment named after a villager id.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const root = new URL('../../', import.meta.url).pathname; let acorn; for (const b of [root, '/opt/npm-tools/']) { try { acorn = createRequire(b + 'package.json')('acorn'); break; } catch (e) { } }
const IDS = ['hale', 'greta', 'brandt', 'tobin', 'marta', 'aldous', 'maren', 'osric', 'edda', 'finn', 'lark', 'wren', 'rowan', 'pip', 'ivo', 'hilda', 'bram'];
const FILE_SPEAKER = { '93_inventory.js': 'brandt' };           // trade dialogue in the pack code is the smith's
const extra = JSON.parse(fs.readFileSync(root + 'tools/voice/extra_speakers.json', 'utf8'));   // speakers named by other words (hermit etc.) and manual overrides
export const lines = [], dynamic = [], unresolved = [];
const fold = n => { if (!n) return null; if (n.type === 'Literal' && typeof n.value === 'string') return n.value; if (n.type === 'TemplateLiteral' && !n.expressions.length) return n.quasis[0].value.cooked; if (n.type === 'BinaryExpression' && n.operator === '+') { const a = fold(n.left), b = fold(n.right); return a !== null && b !== null ? a + b : null; } return null; };
const nameOf = (n) => { if (!n) return ''; if (n.type === 'Identifier') return n.name; if (n.type === 'Literal') return String(n.value); if (n.type === 'MemberExpression') return nameOf(n.property); return ''; };
const idOf = (nm) => { let best = ''; for (const id of IDS) if (nm.toLowerCase().startsWith(id) && id.length > best.length) best = id; return best; };
for (const f of fs.readdirSync(root + 'src').filter(f => f.endsWith('.js')).sort()) {
  const src = fs.readFileSync(root + 'src/' + f, 'utf8'); if (!/\bnode\(|TALK\.buy\(/.test(src) && !IDS.some(id => src.includes("['" + id + "', '"))) continue;       /* a file may hold only a table of ['speaker', 'line'] pairs (82a_memory.js) */
  let ast; try { ast = acorn.parse(src, { ecmaVersion: 2022, locations: true }); } catch (e) { console.error('parse', f, e.message); continue; }
  const walk = (n, stack) => {
    if (!n || typeof n.type !== 'string') return;
    let push = null;
    if (n.type === 'Property' || n.type === 'MethodDefinition') push = nameOf(n.key); else if (n.type === 'AssignmentExpression') push = nameOf(n.left); else if (n.type === 'VariableDeclarator') push = nameOf(n.id);
    let st = push ? stack.concat(push) : stack;
    // addOpt('finn', ...) hangs an option (and the nodes inside it) on that villager
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'addOpt' && n.arguments.length && IDS.includes(fold(n.arguments[0]))) st = st.concat(fold(n.arguments[0]));
    // Tables of lines outside node(): ['hale', () => condition, 'line'] (IX.SAY: a remark spoken before the villager's own line) and ['greta', 'line'] pairs
    if (n.type === 'ArrayExpression' && (n.elements.length === 2 || n.elements.length === 3) && n.elements.every(Boolean)) { const id = fold(n.elements[0]), tx = fold(n.elements[n.elements.length - 1]);
      if (IDS.includes(id) && tx && tx.length > 11 && /\s/.test(tx) && (n.elements.length === 2 || /Function/.test(n.elements[1].type))) lines.push({ speaker: id, text: tx, where: f + ':' + n.loc.start.line }); }
    // a named table of [() => condition, 'line'] rows all said by one person (extra_speakers.json "tables": RUMOURS -> greta)
    if (n.type === 'ArrayExpression' && n.elements.length >= 2 && n.elements[0] && /Function/.test(n.elements[0].type) && fold(n.elements[1])) { const tb = st.find(x => (extra.tables || {})[x]); if (tb) lines.push({ speaker: extra.tables[tb], text: fold(n.elements[1]), where: f + ':' + n.loc.start.line }); }
    // overheard talk shown as a notice: '<b>Rowan</b>: “line”' (88d_voice.js plays the line when such a notice appears)
    if (n.type === 'Literal' && typeof n.value === 'string') { const m = /^<b>(\w+)<\/b>: “(.+)”$/.exec(n.value); if (m && IDS.includes(m[1].toLowerCase())) lines.push({ speaker: m[1].toLowerCase(), text: m[2], where: f + ':' + n.loc.start.line }); }
    if (n.type === 'CallExpression') {
      const cal = n.callee; let text = null;
      if (cal.type === 'Identifier' && cal.name === 'node' && n.arguments.length) text = n.arguments[0];
      else if (cal.type === 'MemberExpression' && nameOf(cal.property) === 'buy' && nameOf(cal.object) === 'TALK' && n.arguments.length > 2) text = n.arguments[2];
      if (text) {
        let sp = FILE_SPEAKER[f] || ''; if (!sp) for (let i = st.length - 1; i >= 0 && !sp; i--) sp = (extra.silent || []).includes(st[i]) ? '-' : idOf(st[i]);
        // a conditional picks one of several lines: take each literal branch; a bare variable (TALK.buy's line) is covered where the call passes it
        const cands = x => x.type === 'ConditionalExpression' ? cands(x.consequent).concat(cands(x.alternate)) : x.type === 'LogicalExpression' ? cands(x.right) : [x];
        for (const c of cands(text)) {
          const v = fold(c), where = f + ':' + n.loc.start.line;
          if (v === null) { if (c.type !== 'Identifier') dynamic.push({ speaker: sp, where, raw: src.slice(c.start, c.end).slice(0, 160) }); }
          else if (v.trim().length > 1 && v !== '...') lines.push({ speaker: sp, text: v, where });
        }
      }
    }
    for (const k in n) { if (k === 'loc') continue; const c = n[k]; if (Array.isArray(c)) c.forEach(x => walk(x, st)); else if (c && typeof c.type === 'string') walk(c, st); }
  };
  walk(ast, []);
}
// [cast] the sixty of docs/PEOPLE.md (src/54_cast.js, generated): every line of each, said by that person in one of ten shared voices (`as`: old man, older and
// younger man, young man, boy, and the same for women; cast_gemini.json holds the ten). Order: the households of the Market first, then district by district.
{ const src = fs.readFileSync(root + 'src/54_cast.js', 'utf8'), C = new Function(src + '; return { CAST, CAST_PLACES };')();
  const cls = p => p.voice === 'M' ? (p.age >= 45 ? 'v.M1' : 'v.M2') : p.voice === 'W' ? (p.age >= 45 ? 'v.W1' : 'v.W2') : 'v.' + p.voice, DIST = ['Market', 'Riverside', 'Chapelgate', 'Westgate', 'Wharfside', 'Upper Ward', 'Highfold'];
  const ord = p => { const d = DIST.indexOf((C.CAST_PLACES[p.home] || {}).district); return d < 0 ? 9 : d; };
  for (const p of C.CAST.slice().sort((a, b) => ord(a) - ord(b))) for (const k of ['g', 'me', 'nb', 'pt', 'b1', 'b2', 'g2', 'nt']) if (p.lines[k]) lines.push({ speaker: p.id, text: p.lines[k], where: '54_cast.js:' + p.id + '.' + k, as: cls(p), note: 'Aged ' + p.age + '; ' + p.trade.split(/[;:,(]/)[0].trim() + '.' }); }
// manual speakers for lines the walk could not attribute, and extra lines (see extra_speakers.json)
// byText: the start of a line -> its speaker, a list of speakers (a line two people can say is recorded once each), or '-' (never spoken aloud).
// silent: names (a notice board, a carved slab) whose "dialogue" is reading text.
{ const more = []; for (const l of lines) { if (l.speaker) continue; for (const [pre, sp] of Object.entries(extra.byText || {})) if (l.text.startsWith(pre)) { const a = [].concat(sp); l.speaker = a[0]; for (const o of a.slice(1)) more.push({ speaker: o, text: l.text, where: l.where }); } } lines.push(...more); }
const seen = new Set(), out = []; for (const l of lines) { if (l.speaker === '-') continue; const k = l.speaker + '\n' + l.text; if (seen.has(k)) continue; seen.add(k); out.push(l); }
fs.writeFileSync(root + 'tools/voice/lines.json', JSON.stringify({ lines: out, dynamic, unresolved: out.filter(l => !l.speaker).map(l => ({ where: l.where, text: l.text.slice(0, 70) })) }, null, 1));
const by = {}; for (const l of out) by[l.speaker || '?'] = (by[l.speaker || '?'] || 0) + 1;
console.log(out.length + ' spoken lines,', dynamic.length + ' dynamic (text-only),', 'by speaker', JSON.stringify(by));
if (out.some(l => !l.speaker)) { console.log('UNATTRIBUTED:'); out.filter(l => !l.speaker).forEach(l => console.log(' ', l.where, l.text.slice(0, 70))); process.exitCode = 1; }
