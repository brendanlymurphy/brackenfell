// usage: node test/shot.mjs [--size WxH] [--opt key=val ...] --do "<js>" --out file.png [--do ... --out ...]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs';
const args = process.argv.slice(2);
let size = [844, 390], steps = [], opts = {}, port = 8200 + Math.floor(Math.random() * 500), timeout = 240000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--opt') { const [k, v] = args[++i].split('='); opts[k] = isNaN(+v) ? v : +v; }
  else if (args[i] === '--do') steps.push({ js: args[++i] });
  else if (args[i] === '--out') steps.push({ out: args[++i] });
  else if (args[i] === '--timeout') timeout = +args[++i];
}
const root = new URL('../dist/', import.meta.url).pathname;
const srv = http.createServer((q, s) => { try { const b = fs.readFileSync(root + (q.url === '/' ? 'index.html' : q.url.split('?')[0].slice(1))); s.writeHead(200, { 'content-type': 'text/html' }); s.end(b); } catch (e) { s.writeHead(404); s.end(); } }).listen(port);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--use-webgpu-adapter=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, hasTouch: !!opts.touch });
page.setDefaultTimeout(timeout);
page.on('console', m => { const t = m.text(); if (!t.includes('Failed to load resource') && !t.startsWith('[wgsl') && !t.startsWith('[gpu]')) console.log('[console.' + m.type() + ']', t.slice(0, 600)); });
page.on('pageerror', e => { const t = (e.stack || e.message); if (!t.includes('is invalid due to a previous error')) console.log('[pageerror]', t.slice(0, 800)); });
await page.addInitScript(o => { window.__TEST__ = o; }, opts);
const t0 = Date.now();
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__ready === true, null, { timeout });
console.log('ready in', Date.now() - t0, 'ms');
for (const s of steps) {
  if (s.js) { const t = Date.now(); try { const r = await page.evaluate(`(async()=>{ ${s.js} })()`); console.log('do:', s.js.slice(0, 70), '->', r === undefined ? '' : JSON.stringify(r), (Date.now() - t) + 'ms'); } catch (e) { console.log('EVAL FAIL:', s.js.slice(0, 60), String(e.message).slice(0, 400)); } }
  if (s.out) { await page.screenshot({ path: s.out }); console.log('saved', s.out); }
}
const errs = await page.evaluate(() => (window.__gpuErrors ? window.__gpuErrors() : []));
if (errs.length) console.log('GPU ERRORS:\n' + errs.slice(0, 12).join('\n').slice(0, 5000));
await browser.close(); srv.close();
