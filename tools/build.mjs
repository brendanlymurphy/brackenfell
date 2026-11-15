// Builds the game into the repo root: three.js (bundled library), game.js (src/*.js in name order), index.html.
import fs from 'node:fs'; import crypto from 'node:crypto'; import { build } from 'esbuild';
const root = new URL('../', import.meta.url).pathname, src = root + 'src/';
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
const entry = src + 'lib/three-entry.js', stamp = root + 'node_modules/.three-stamp';
const want = hash(fs.readFileSync(entry) + fs.readFileSync(root + 'node_modules/three/package.json'));
if (!fs.existsSync(root + 'three.js') || !fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8') !== want) {
  await build({ entryPoints: [entry], bundle: true, minify: true, format: 'iife', target: 'es2022', outfile: root + 'three.js', legalComments: 'none', logLevel: 'error' });
  fs.writeFileSync(stamp, want);
  console.log('built three.js', (fs.statSync(root + 'three.js').size / 1024).toFixed(0) + ' KB');
}
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
let js = '';
for (const f of files) js += `\n// ---- ${f} ----\n` + fs.readFileSync(src + f, 'utf8') + '\n';
fs.writeFileSync(root + 'game.js', js);
const css = fs.readFileSync(src + 'style.css', 'utf8');
let html = fs.readFileSync(src + 'index.html', 'utf8');
html = html.replace('/*__CSS__*/', () => css).replace('__THREE__', 'three.js?v=' + hash(fs.readFileSync(root + 'three.js'))).replace('__GAME__', 'game.js?v=' + hash(js));
fs.writeFileSync(root + 'index.html', html);
console.log('built game.js', (js.length / 1024).toFixed(1) + ' KB', files.length + ' files');
