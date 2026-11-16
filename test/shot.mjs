// usage: node test/shot.mjs [--size WxH] [--opt key=val ...] --do "<js>" --out file.png [--do ... --out ...]
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs';
const args = process.argv.slice(2);
let pagePath = '/', size = [844, 390], steps = [], opts = {}, port = 8200 + Math.floor(Math.random() * 500), timeout = 240000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--opt') { const [k, v] = args[++i].split('='); opts[k] = isNaN(+v) ? v : +v; }
  else if (args[i] === '--do') steps.push({ js: args[++i] });
  else if (args[i] === '--out') steps.push({ out: args[++i] });
  else if (args[i] === '--timeout') timeout = +args[++i];
  else if (args[i] === '--page') pagePath = args[++i];
}
const root = new URL('../', import.meta.url).pathname;
const TYPES = { html: 'text/html', js: 'text/javascript', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream', json: 'application/json' };
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--use-webgpu-adapter=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, hasTouch: !!opts.touch });
page.setDefaultTimeout(timeout);
const seen = new Map();
page.on('console', m => { const t = m.text(); if (t.includes('Failed to load resource') || t.includes('GPU stall due to ReadPixels')) return; const k = t.replace(/0x[0-9a-f]+/g, '').slice(0, 160); const n = (seen.get(k) || 0) + 1; seen.set(k, n); if (n === 1) { console.log('[console.' + m.type() + ']', t.slice(0, 700)); if (t.length > 700) fs.appendFileSync('/tmp/shot_long.txt', '\n=====\n' + t); } });
page.on('pageerror', e => { const t = (e.stack || e.message); if (!t.includes('is invalid due to a previous error')) console.log('[pageerror]', t.slice(0, 800)); });
await page.addInitScript(o => { window.__TEST__ = o; }, opts);
// --opt seed=N: the page's Math.random becomes a fixed sequence, so a test that depends on chance (how often a lurker creaks) gives the same result every run
if (opts.seed) await page.addInitScript(n => { let a = (+n || 1) >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, opts.seed);
const t0 = Date.now();
await page.goto(`http://localhost:${port}${pagePath}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout });
console.log('ready in', Date.now() - t0, 'ms');
for (const s of steps) {
  if (s.js) { const t = Date.now(); try { const r = await page.evaluate(`(async()=>{ ${s.js} })()`); console.log('do:', s.js.slice(0, 70), '->', r === undefined ? '' : JSON.stringify(r), (Date.now() - t) + 'ms'); } catch (e) { console.log('EVAL FAIL:', s.js.slice(0, 60), String(e.message).slice(0, 400)); } }
  if (s.out) { await page.screenshot({ path: s.out }); console.log('saved', s.out); }
}
const errs = await page.evaluate(() => (window.__gpuErrors ? window.__gpuErrors() : []));
if (errs.length) console.log('GPU ERRORS:\n' + errs.slice(0, 12).join('\n').slice(0, 5000));
for (const [k, n] of seen) if (n > 1) console.log('  (x' + n + ')', k.slice(0, 110));
await browser.close(); srv.close();
process.exit(0);
