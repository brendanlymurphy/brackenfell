// Service worker check on a production-mode page (localhost counts as secure): first load fills the caches, a second load with the network cut still starts,
// and a changed build is noticed ("Update available"). usage: node test/sw.mjs
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs';
const root = new URL('../', import.meta.url).pathname, port = 8700 + Math.floor(Math.random() * 200);
const TYPES = { html: 'text/html', js: 'text/javascript', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', json: 'application/json', webmanifest: 'application/manifest+json', woff2: 'font/woff2' };
let swExtra = '';       // appended to sw.js to simulate a new build
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); let b = fs.readFileSync(f); if (u === '/sw.js') b = Buffer.concat([b, Buffer.from(swExtra)]); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-cache' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage(); page.setDefaultTimeout(300000);
const url = `http://localhost:${port}/?webgl`, out = {};
await page.goto(url); await page.waitForFunction(() => window.__ready === true);
// the worker is registered, has taken the page, and what the first load fetched is cached (the idle top-up, Load.warm, may still be running).
// Asked in the page with a plain loop: an async test function handed to waitForFunction is a promise, which counts as true at once, so the old wait never waited
// and on a slow machine "first" was read before the worker had registered (GitHub, Build 68: sw false, then offline and update both fine).
await page.evaluate(async () => { const t0 = Date.now(); for (;;) { const reg = await navigator.serviceWorker.getRegistration(); const n = (await (await caches.open('bf-assets')).keys()).length;
  if (reg && navigator.serviceWorker.controller && n >= 70) return; if (Date.now() - t0 > 600000) throw new Error('no service worker in control after 10 minutes (registered ' + !!reg + ', controller ' + !!navigator.serviceWorker.controller + ', cached ' + n + ')'); await new Promise(r => setTimeout(r, 2000)); } });
out.first = await page.evaluate(async () => ({ sw: !!(await navigator.serviceWorker.getRegistration()), keys: await caches.keys(), cacheMB: Load.cacheBytes / 1048576 | 0, n: (await (await caches.open('bf-assets')).keys()).length, warmed: !!Load.cached }));
console.log('first', JSON.stringify(out.first));
await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 30000 }).catch(() => { });
await ctx.setOffline(true);
const t0 = Date.now(); await page.reload(); await page.waitForFunction(() => window.__ready === true);
out.offline = await page.evaluate(() => ({ ready: __game.ready, controlled: !!navigator.serviceWorker.controller, backend: G.backend })); out.offlineMs = Date.now() - t0; console.log('offline', JSON.stringify(out.offline), out.offlineMs + 'ms');
await ctx.setOffline(false);
swExtra = '\n// new build ' + Date.now() + '\n';      // a different sw.js: the browser installs it beside the old one
await page.waitForFunction(() => Load.reg, null, { timeout: 60000 }); await page.evaluate(() => Load.reg.update());
await page.waitForFunction(() => Load.updateReady, null, { timeout: 60000 }).catch(() => { });
out.update = await page.evaluate(() => ({ ready: Load.updateReady, noteShown: !document.getElementById('updateNote').hidden, caches: null })); out.update.caches = await page.evaluate(async () => caches.keys()); console.log('update', JSON.stringify(out.update));
await page.evaluate(() => Load.applyUpdate()); await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 }).catch(() => { });
out.after = await page.evaluate(async () => ({ caches: await caches.keys() })); console.log('after', JSON.stringify(out.after));
const ok = out.first.sw && out.offline.ready && out.update.ready; console.log(ok ? 'SW PASS' : 'SW FAIL');
await browser.close(); srv.close(); process.exit(ok ? 0 : 1);
