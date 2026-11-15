// Shared browser harness for the QA sweep: one static server, one headless Chrome, one page. Used by test/sweep.mjs.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs';
export const root = new URL('../../', import.meta.url).pathname;
const TYPES = { html: 'text/html', js: 'text/javascript', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream', json: 'application/json' };
export const busy = () => { try { return (fs.readdirSync('/proc').filter(p => /^\d+$/.test(p)).map(p => { try { return fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').replace(/\0/g, ' '); } catch (e) { return ''; } }).filter(c => /test\/shot\.mjs|sweep\.mjs/.test(c) && !c.includes('pgrep')).length); } catch (e) { return 0; } };
export async function open(opts = {}, size = [844, 390], timeout = 400000) {
  const port = 8800 + Math.floor(Math.random() * 500);
  const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--use-webgpu-adapter=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(timeout);
  const msgs = [];
  page.on('console', m => { const t = m.text(); if (t.includes('Failed to load resource') || t.includes('GPU stall')) return; if (/warn|error/.test(m.type())) msgs.push(m.type() + ': ' + t.slice(0, 300)); });
  page.on('pageerror', e => { const t = e.stack || e.message; if (!t.includes('is invalid due to a previous error')) msgs.push('pageerror: ' + t.slice(0, 400)); });
  await page.addInitScript(o => { window.__TEST__ = o; }, opts);
  await page.goto(`http://localhost:${port}/`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout });
  for (const f of ['lib', 'geo', 'geo2', 'chars', 'player']) await page.evaluate(fs.readFileSync(root + 'test/qa/' + f + '.js', 'utf8'));
  return { page, msgs, run: async (js) => page.evaluate(`(async()=>{ ${js} })()`), close: async () => { await browser.close(); srv.close(); } };
}
