import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs';
const srv = http.createServer((q,s)=>{ try{ const b=fs.readFileSync('/home/claude/village/test'+q.url.split('?')[0]); s.writeHead(200,{'content-type':'text/html'}); s.end(b);}catch(e){s.writeHead(404);s.end();} }).listen(8123);
const base = ['--no-sandbox','--enable-unsafe-webgpu','--ignore-gpu-blocklist'];
const sets = {
  g: { headless:true, args:[...base,'--use-webgpu-adapter=swiftshader'], url:'http://localhost:8123/probe3.html' },
  h: { headless:true, args:[...base,'--headless=old','--use-webgpu-adapter=swiftshader'], url:'http://localhost:8123/probe3.html' },
  i: { headless:true, args:[...base,'--use-angle=swiftshader-webgl','--use-webgpu-adapter=swiftshader','--disable-gpu-compositing'], url:'http://localhost:8123/probe3.html' },
  j: { headless:true, args:[...base,'--disable-gpu','--use-webgpu-adapter=swiftshader'], url:'http://localhost:8123/probe3.html' },
  k: { headless:true, args:[...base,'--enable-features=Vulkan,SkiaGraphite','--use-angle=swiftshader','--use-webgpu-adapter=swiftshader','--disable-features=DawnGraphite'], url:'http://localhost:8123/probe3.html' },
};
const only = process.argv[2];
for (const [k, o] of Object.entries(sets)) {
  if (only && only !== k) continue;
  const t0 = Date.now(); let browser;
  try {
    browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: o.headless, args: o.args });
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    page.on('pageerror', e => console.log('[pageerror]', e.message));
    await page.goto(o.url);
    await page.waitForFunction(() => document.title === 'done', null, { timeout: 30000 });
    console.log(k, JSON.stringify(await page.evaluate(() => window.__out)), (Date.now() - t0) + 'ms');
    await page.screenshot({ path: `/home/claude/village/test/probe_${k}.png` });
  } catch (e) { console.log(k, 'FAIL', e.message.slice(0, 200)); }
  finally { if (browser) await browser.close(); }
}
srv.close();
