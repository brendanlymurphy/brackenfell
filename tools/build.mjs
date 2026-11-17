// Builds the game into the repo root: three.js (bundled library), game.js (src/*.js in name order), index.html, sw.js.
// index.html carries a manifest of every file the game can download (size and content hash) and src/boot.inl, the inline start-up script.
// sw.js is src/sw.tpl with the build id, the app-shell list and the asset hashes written in: a new build is a new sw.js, which is how installed copies learn of it.
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
const css = fs.readFileSync(src + 'style.css', 'utf8'), boot = fs.readFileSync(src + 'boot.inl', 'utf8'), tpl = fs.readFileSync(src + 'index.html', 'utf8');
const threeV = hash(fs.readFileSync(root + 'three.js')), gameV = hash(js);
const BUILD = hash(js + threeV + css + boot + tpl + fs.readFileSync(src + 'sw.tpl', 'utf8'));

// ── every file the game downloads: [bytes, content hash] per path, grouped by when it is needed ──
const walk = (dir, keep) => { const o = []; for (const f of fs.readdirSync(root + dir, { withFileTypes: true })) { const p = dir + f.name; if (f.isFile() && keep(f.name)) o.push(p); } return o.sort(); };
const F = {}, add = p => { if (!F[p]) { const b = fs.readFileSync(root + p); F[p] = [b.length, hash(b)]; } return p; };
const G = {
  app: ['three.js', 'game.js', 'index.html', 'manifest.webmanifest', 'fonts/IMFellEnglishSC.woff2', 'fonts/Alegreya.woff2', 'fonts/Alegreya-Italic.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'].map(p => p === 'three.js' || p === 'game.js' || p === 'index.html' ? p : add(p)),
  astc: [...walk('tex/', n => /^[an]_.*\.png$/.test(n)), 'tex/noise.bin'].map(add),
  imgs: [...walk('tex/', n => /^a_.*\.webp$/.test(n)), ...walk('tex/', n => /^n_.*\.jpg$/.test(n)), 'tex/noise.bin'].map(add),
  kits: [...walk('kits/', n => /\.(glb|json)$/.test(n)), ...walk('kits/skin/', n => /\.(webp|json|png|jpg)$/.test(n))].map(add),
  chars: walk('chars/real/', n => n.endsWith('.glb')).map(add),
  astcs: [...walk('tex/s/', n => /^[an]_.*\.png$/.test(n)), 'tex/noise.bin'].map(add),        // the half-resolution pack (tools/tex_half.mjs): Low tier and low-memory devices
  kitss: [],        // what a device with the 512 texture cap fetches instead of `kits` (tools/assets_pack.mjs writes the small copies under kits/s and kits/skin/s; 44_kit.js and 74b_trees.js pick them)
  charsq: walk('chars/', n => /^q_/.test(n)).map(add),
};
G.kitss = G.kits.map(p => { const q = p.replace(/^kits\/skin\//, 'kits/skin/s/').replace(/^kits\/([^/]+\.glb)$/, 'kits/s/$1'); return q !== p && fs.existsSync(root + q) ? add(q) : p; });
// the three built files are hashed after the fact (index.html is the template output below, so its hash is the build id)
F['three.js'] = [fs.statSync(root + 'three.js').size, threeV]; F['game.js'] = [Buffer.byteLength(js), gameV]; F['index.html'] = [0, BUILD];
const scripts = ['three.js?v=' + threeV, 'game.js?v=' + gameV];
const manifest = { v: BUILD, scripts, files: F, groups: G };
let html = tpl.replace('/*__CSS__*/', () => css).replace('/*__BOOT__*/', () => boot).replace('/*__MANIFEST__*/', () => JSON.stringify(manifest));
fs.writeFileSync(root + 'index.html', html); F['index.html'][0] = Buffer.byteLength(html);
// the page's copy of the manifest carries index.html's size, which is only known now: write it again (same length class, size is informational)
html = html.replace(/("index\.html":\[)0(,)/, '$1' + F['index.html'][0] + '$2'); fs.writeFileSync(root + 'index.html', html);

// ── service worker ──
const APP = [...G.app.filter(p => p !== 'index.html' && p !== 'three.js' && p !== 'game.js'), ...scripts, 'index.html'];
const ASSETS = {}; for (const g of ['astc', 'astcs', 'imgs', 'kits', 'kitss', 'chars', 'charsq']) for (const p of G[g]) ASSETS[p] = F[p][1];
fs.writeFileSync(root + 'sw.js', fs.readFileSync(src + 'sw.tpl', 'utf8').replace('__BUILD__', BUILD).replace('/*__APP__*/[]', JSON.stringify(APP)).replace('/*__ASSETS__*/{}', JSON.stringify(ASSETS)));

const sum = names => names.reduce((a, g) => a + G[g].reduce((s, p) => s + F[p][0], 0), 0);
const mb = n => (n / 1048576).toFixed(1) + ' MB';
console.log('built game.js', (js.length / 1024).toFixed(1) + ' KB', files.length + ' files; build', BUILD);
console.log('first visit downloads: phone, Low tier or low-memory device', mb(sum(['app', 'astcs', 'kitss', 'chars'])), '| tablet or laptop on Medium (512 texture cap)', mb(sum(['app', 'astc', 'kitss', 'chars'])), '| desktop High', mb(sum(['app', 'astc', 'kits', 'chars'])), '| without ASTC (images):', mb(sum(['app', 'imgs', 'kits', 'chars'])), '| app shell only:', mb(sum(['app'])));
console.log('  by group:', ['app', 'astc', 'astcs', 'imgs', 'kits', 'kitss', 'chars'].map(g => g + ' ' + mb(sum([g]))).join(', '));
