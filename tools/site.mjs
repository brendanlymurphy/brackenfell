// Assembles the folder GitHub Pages serves: a fresh build plus the assets, and nothing else (no sources, tests, tools or docs).
// usage: node tools/site.mjs [out dir, default _site] [--no-build]
// Used by .github/workflows/pages.yml (deploy on a push to main) and by the gate's proof that the folder boots (`node test/real.mjs --root _site`).
// The site is every tracked file outside the development folders, plus the four built files whether or not they are tracked: so the day
// the built files stop being committed nothing here changes.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync, spawnSync } from 'node:child_process';
const ROOT = new URL('../', import.meta.url).pathname, args = process.argv.slice(2), out = path.resolve(ROOT, args.find(a => !a.startsWith('--')) || '_site');
const DEV = /^(src|test|tools|docs|shots|legacy|node_modules|\.github)\/|^(package(-lock)?\.json|\.gitignore|[A-Z]+\.md)$/, BUILT = ['index.html', 'game.js', 'three.js', 'sw.js'];
if (!args.includes('--no-build')) { const r = spawnSync('node', ['tools/build.mjs'], { cwd: ROOT, stdio: 'inherit' }); if (r.status) process.exit(r.status); }
const files = [...new Set(execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\0').filter(f => f && !DEV.test(f)).concat(BUILT))];
fs.rmSync(out, { recursive: true, force: true }); let bytes = 0;
for (const f of files) { const src = ROOT + f, st = fs.lstatSync(src); if (st.isSymbolicLink()) { console.error('symlink in the site (Pages refuses them): ' + f); process.exit(1); }
  fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true }); fs.copyFileSync(src, path.join(out, f)); bytes += st.size; }
fs.writeFileSync(path.join(out, '.nojekyll'), '');
const v = (/game\.js\?v=([0-9a-f]+)/.exec(fs.readFileSync(path.join(out, 'index.html'), 'utf8')) || [])[1];
console.log(`site: ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB in ${path.relative(ROOT, out) || out}, game.js?v=${v}`);
