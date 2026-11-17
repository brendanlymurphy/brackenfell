// usage: node test/overlap_in.mjs [--cells inn,store] [--out /tmp/ov.json] [--top 40] [--all]   (runs test/overlap_in.js in the page; prints counts per cell)
import fs from 'node:fs'; import { open, root } from './qa/harness.mjs';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const s = await open({ webgl: 1, ovl: 1, quality: 'low' }, [640, 360]);
const cells = arg('cells', null), r = JSON.parse(await s.run(`window.__ovOnly = ${cells ? JSON.stringify(cells.split(',')) : 'null'}; window.__ovTop = ${+arg('top', 40)}; window.__ovDetAll = ${argv.includes('--all') ? 1 : 0}; ${fs.readFileSync(root + 'test/overlap_in.js', 'utf8')}`));
if (arg('out', null)) fs.writeFileSync(arg('out'), JSON.stringify(r, null, 1));
console.log('TOTAL', r.all, JSON.stringify(r.totals)); console.log(r.cells.join('\n')); if (r.over) console.log('--- footprint overshoot by type\n' + r.over.join('\n')); if (r.top) console.log(r.top.join('\n'));
if (s.msgs.length) console.log([...new Set(s.msgs)].slice(0, 5).join('\n'));
await s.close(); process.exit(0);
