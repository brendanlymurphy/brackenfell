// Fallback check: production boot with no query on a browser whose WebGPU cannot present (headless Chrome loses the device).
// Expected: the page notices, remembers it in localStorage, reloads itself and comes up on WebGL 2.
// usage: node test/fallback.mjs [out.png]
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs';
const root = new URL('../', import.meta.url).pathname, port = 8700 + Math.floor(Math.random() * 200), out = process.argv[2];
const TYPES = { html: 'text/html', js: 'text/javascript', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', bin: 'application/octet-stream' };
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--use-webgpu-adapter=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const logs = []; let loads = 0;
page.on('console', m => { const t = m.text(); if (!t.includes('Failed to load resource') && !t.includes('GL Driver Message')) logs.push('[' + m.type() + '] ' + t.slice(0, 200)); });
page.on('pageerror', e => logs.push('[pageerror] ' + (e.stack || e.message).slice(0, 300)));
page.on('load', () => { loads++; });
await page.goto(`http://localhost:${port}/`);
const st = () => page.evaluate(() => ({ backend: G.backend, why: G.gfxWhy || '', stored: localStorage.getItem('brackenfell.gfx'), ready: !!(window.__game && __game.ready), lost: G.lost, frame: R.frame, errors: G.errors.slice(0, 2), load: document.getElementById('loadText').textContent })).catch(e => ({ navigating: String(e.message).slice(0, 80) }));
for (let i = 0; i < 14; i++) { await page.waitForTimeout(10000); const s = await st(); console.log(loads, JSON.stringify(s)); if (s.backend === 'WebGL 2' && s.ready && s.frame > 2) break; }
if (out) { try { await page.screenshot({ path: out, timeout: 20000 }); console.log('saved', out); } catch (e) { console.log('no screenshot (machine busy)'); } }
console.log([...new Set(logs)].slice(0, 10).join('\n'));
await browser.close(); srv.close();
