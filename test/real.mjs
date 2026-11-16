// Production-mode boot (no test hooks): phone-sized touch page, WebGL 2 backend because a headless browser cannot present WebGPU.
// usage: node test/real.mjs [out.png] [--root dir]     (--root serves another folder, e.g. the _site folder that tools/site.mjs assembles for Pages)
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ri = process.argv.indexOf('--root'), root = ri > 0 ? path.resolve(process.argv[ri + 1]) + '/' : new URL('../', import.meta.url).pathname, port = 8377 + Math.floor(Math.random() * 300), out = process.argv.slice(2).find((a, i, l) => !a.startsWith('--') && l[i - 1] !== '--root');
const TYPES = { html: 'text/html', js: 'text/javascript', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', bin: 'application/octet-stream' };
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const logs = [];
page.on('console', m => { const t = m.text(); if (!t.includes('Failed to load resource') && !t.includes('GL Driver Message')) logs.push('[' + m.type() + '] ' + t.slice(0, 300)); });
page.on('pageerror', e => logs.push('[pageerror] ' + (e.stack || e.message).slice(0, 400)));
await page.goto(`http://localhost:${port}/?webgl`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
const st = () => page.evaluate(() => ({ backend: G.backend, pack: G.pack, ready: __game.ready, tier: __game.tier, canvas: [G.w, G.h], scale: R.scale, frame: R.frame, playing: __game.playing, crashed: !!__game.crashed, errors: G.errors.slice(0, 3), load: document.getElementById('loadText').textContent, diag: (document.getElementById('diag') || {}).textContent }));
console.log(JSON.stringify(await st()));
page.setDefaultTimeout(180000); await page.evaluate(() => document.getElementById('startBtn').click()); await page.waitForTimeout(12000);
console.log(JSON.stringify(await st()));
if (out) { await page.screenshot({ path: out }); console.log('saved', out); }
console.log([...new Set(logs)].slice(0, 12).join('\n'));
await browser.close(); srv.close();
