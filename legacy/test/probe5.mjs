import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs';
const srv = http.createServer((q,s)=>{ try{ const b=fs.readFileSync('/home/claude/village/test'+q.url.split('?')[0]); s.writeHead(200,{'content-type':'text/html'}); s.end(b);}catch(e){s.writeHead(404);s.end();} }).listen(8123);
const base = ['--no-sandbox','--enable-unsafe-webgpu','--ignore-gpu-blocklist','--use-webgpu-adapter=swiftshader'];
for (const hash of ['', '#canvas']) {
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: base });
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    page.on('pageerror', e => console.log('[pageerror]', e.message));
    page.on('console', m => console.log('[console]', m.text().slice(0,300)));
    await page.goto('http://localhost:8123/probe5.html'+hash);
    await page.waitForFunction(() => document.title === 'done', null, { timeout: 30000 });
    console.log(hash||'offscreen', JSON.stringify(await page.evaluate(() => window.__out)));
  } catch (e) { console.log('FAIL', e.message.slice(0, 200)); }
  finally { if (browser) await browser.close(); }
}
srv.close();
