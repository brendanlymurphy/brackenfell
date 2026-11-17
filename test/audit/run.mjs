// Audit runner [audit]: opens the game once, runs page scripts in order, lets a script save pictures itself.
// usage: node test/audit/run.mjs [--size WxH] [--opt k=v ...] [--json out.json] script.js [script2.js ...]
// In the page: await __snap('name') saves docs/audit/<name>.jpg of what is on the canvas (call game.shot(...) first);
//              a script's return value is written to --json (or printed).
import { chromium, CHROME } from '../pw.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const a = process.argv.slice(2); let size = [960, 540], opts = { webgl: 1, quality: 'medium', play: 1 }, files = [], json = null, dir = 'docs/audit', q = 62;
for (let i = 0; i < a.length; i++) { if (a[i] === '--size') size = a[++i].split('x').map(Number); else if (a[i] === '--opt') { const [k, v] = a[++i].split('='); opts[k] = isNaN(+v) ? v : +v; } else if (a[i] === '--json') json = a[++i]; else if (a[i] === '--dir') dir = a[++i]; else if (a[i] === '--q') q = +a[++i]; else files.push(a[i]); }
const root = new URL('../../', import.meta.url).pathname;
const TYPES = { html: 'text/html', js: 'text/javascript', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', json: 'application/json', css: 'text/css', m4a: 'audio/mp4', aac: 'audio/aac', mp3: 'audio/mpeg' };
const port = 9300 + Math.floor(Math.random() * 400);
const srv = http.createServer((rq, s) => { try { const u = decodeURIComponent(rq.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
page.setDefaultTimeout(1800000);
page.on('console', m => { const t = m.text(); if (/^\[audit\]/.test(t)) console.log(t.slice(0, 400)); });
page.on('pageerror', e => console.log('[pageerror]', String(e.stack || e.message).slice(0, 300)));
await page.addInitScript(o => { window.__TEST__ = o; }, opts);
fs.mkdirSync(root + dir, { recursive: true });
await page.exposeFunction('__snap', async (name) => { const f = path.join(root, dir, name + '.jpg'); fs.mkdirSync(path.dirname(f), { recursive: true }); await page.screenshot({ path: f, type: 'jpeg', quality: q }); return f; });
await page.exposeFunction('__png', async () => (await page.screenshot({ type: 'png' })).toString('base64'));
await page.exposeFunction('__write', async (name, text) => { fs.writeFileSync(path.join(root, name), text); });
const t0 = Date.now(); await page.goto(`http://localhost:${port}/`); await page.waitForFunction(() => window.__ready === true, null, { timeout: 600000 }); console.log('ready', Date.now() - t0, 'ms');
for (const f of files) { const t = Date.now(); try { const r = await page.evaluate(`(async()=>{ ${fs.readFileSync(f, 'utf8')} })()`); const s = typeof r === 'string' ? r : JSON.stringify(r, null, 1); if (json && s !== undefined) fs.writeFileSync(json, s); else if (s !== undefined) console.log(s.slice(0, 20000)); console.log('ran', f, Date.now() - t, 'ms'); } catch (e) { console.log('FAIL', f, String(e.message).slice(0, 1500)); } }
await browser.close(); srv.close(); process.exit(0);
