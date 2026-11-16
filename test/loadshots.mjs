// Screenshots of the loading screen at about 0, 40 and 100 percent, the ready title, and the portrait warning. usage: node test/loadshots.mjs outdir [WxH]
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs';
const root = new URL('../', import.meta.url).pathname, port = 9100 + Math.floor(Math.random() * 100), dir = process.argv[2] || '/tmp', [W, H] = (process.argv[3] || '844x390').split('x').map(Number);
const T = { html: 'text/html', js: 'text/javascript', woff2: 'font/woff2', png: 'image/png', json: 'application/json' };
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': T[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true })).newPage(); page.setDefaultTimeout(600000);
await page.goto(`http://localhost:${port}/?webgl`, { waitUntil: 'commit' });
const shot = async (n) => { await page.screenshot({ path: `${dir}/${n}.png` }); console.log(n, await page.evaluate(() => document.getElementById('loadPct') && document.getElementById('loadPct').textContent + ' ' + document.getElementById('loadMB').textContent)); };
await page.waitForFunction(() => document.getElementById('loadHint') && document.getElementById('loadHint').textContent); await page.waitForTimeout(400); await shot('load_00');
await page.waitForFunction(() => Load.shown > 0.4); await shot('load_40');
await page.waitForFunction(() => window.__ready === true); await page.waitForTimeout(2500); await shot('load_100');
await page.setViewportSize({ width: H, height: W }); await page.waitForTimeout(500); await page.screenshot({ path: `${dir}/portrait.png` });
await browser.close(); srv.close();
