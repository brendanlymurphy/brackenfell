// Runs test/tree_bake.html in headless Chrome for each prepared tree and saves <bake dir>/<name>/atlas_raw.png.
// usage: node tools/scan/tree_bake.mjs <name> [<name> ...]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs';
const root = new URL('../../', import.meta.url).pathname, port = 8700 + Math.floor(Math.random() * 200);
const TYPES = { html: 'text/html', js: 'text/javascript', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' };
const srv = http.createServer((q, s) => { try { const f = root + decodeURIComponent(q.url.split('?')[0]).slice(1); const st = fs.statSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream', 'content-length': st.size }); fs.createReadStream(f).pipe(s); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--max-old-space-size=8192'] });
for (const name of process.argv.slice(2)) {
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } }); page.setDefaultTimeout(900000);
  page.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
  const t = Date.now(); await page.goto(`http://localhost:${port}/test/tree_bake.html?name=${name}`); await page.waitForFunction(() => window.__ready === true);
  const err = await page.evaluate(() => window.__error); if (err) { console.log('FAIL', name, err); await page.close(); continue; }
  const data = await page.evaluate(() => window.__bake);
  fs.writeFileSync(`${root}tools/scan/_bake/${name}/atlas_raw.png`, Buffer.from(data.split(',')[1], 'base64'));
  console.log('baked', name, ((Date.now() - t) / 1000).toFixed(1) + ' s'); await page.close();
}
await browser.close(); srv.close();
