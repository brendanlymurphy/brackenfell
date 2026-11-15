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
  const src = fs.readFileSync(root + 'src/' + f, 'utf8'); if (!/\bnode\(|TALK\.buy\(/.test(src)) continue;
  let ast; try { ast = acorn.parse(src, { ecmaVersion: 2022, locations: true }); } catch (e) { console.error('parse', f, e.message); continue; }
  const walk = (n, stack) => {
    if (!n || typeof n.type !== 'string') return;
    let push = null;
    if (n.type === 'Property' || n.type === 'MethodDefinition') push = nameOf(n.key); else if (n.type === 'AssignmentExpression') push = nameOf(n.left); else if (n.type === 'VariableDeclarator') push = nameOf(n.id);
    const st = push ? stack.concat(push) : stack;
    if (n.type === 'CallExpression') {
      const cal = n.callee; let text = null;
      if (cal.type === 'Identifier' && cal.name === 'node' && n.arguments.length) text = n.arguments[0];
      else if (cal.type === 'MemberExpression' && nameOf(cal.property) === 'buy' && nameOf(cal.object) === 'TALK' && n.arguments.length > 2) text = n.arguments[2];
      if (text) {
        let sp = FILE_SPEAKER[f] || ''; if (!sp) for (let i = st.length - 1; i >= 0 && !sp; i--) sp = idOf(st[i]);
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
// manual speakers for lines the walk could not attribute, and extra lines (see extra_speakers.json)
for (const l of lines) { if (!l.speaker) for (const [pre, sp] of Object.entries(extra.byText || {})) if (l.text.startsWith(pre)) l.speaker = sp; }
const seen = new Set(), out = []; for (const l of lines) { const k = l.speaker + '\n' + l.text; if (seen.has(k)) continue; seen.add(k); out.push(l); }
fs.writeFileSync(root + 'tools/voice/lines.json', JSON.stringify({ lines: out, dynamic, unresolved: out.filter(l => !l.speaker).map(l => ({ where: l.where, text: l.text.slice(0, 70) })) }, null, 1));
const by = {}; for (const l of out) by[l.speaker || '?'] = (by[l.speaker || '?'] || 0) + 1;
console.log(out.length + ' spoken lines,', dynamic.length + ' dynamic (text-only),', 'by speaker', JSON.stringify(by));
if (out.some(l => !l.speaker)) { console.log('UNATTRIBUTED:'); out.filter(l => !l.speaker).forEach(l => console.log(' ', l.where, l.text.slice(0, 70))); process.exitCode = 1; }
