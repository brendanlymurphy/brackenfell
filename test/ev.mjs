// usage: node test/ev.mjs [--opt k=v ...] "<js body returning a string or json>"   prints the whole result (shot.mjs truncates it) [fx2]
import { open } from './qa/harness.mjs';
const a = process.argv.slice(2), opts = { webgl: 1, quality: 'low' }; let js = '';
for (let i = 0; i < a.length; i++) { if (a[i] === '--opt') { const [k, v] = a[++i].split('='); opts[k] = isNaN(+v) ? v : +v; } else js = a[i]; }
const s = await open(opts, [640, 360]); const r = await s.run(js); console.log(typeof r === 'string' ? r : JSON.stringify(r)); if (s.msgs.length) console.error([...new Set(s.msgs)].slice(0, 5).join('\n')); await s.close(); process.exit(0);
