import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs';
const srv = http.createServer((q,s)=>{ try{ const b=fs.readFileSync('/home/claude/village/test'+q.url.split('?')[0]); s.writeHead(200,{'content-type':'text/html'}); s.end(b);}catch(e){s.writeHead(404);s.end();} }).listen(8125);
const base = ['--no-sandbox','--enable-unsafe-webgpu','--ignore-gpu-blocklist','--use-webgpu-adapter=swiftshader'];
const sets = {
  a: { headless: true, args: [...base, '--disable-gpu-compositing'] },
  b: { headless: true, args: [...base, '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader'] },
  c: { headless: true, args: [...base, '--disable-features=SkiaGraphite,Vulkan'] },
  d: { headless: true, args: [...base, '--enable-features=SkiaGraphite', '--skia-graphite-backend=dawn-swiftshader'] },
  e: { headless: false, args: [...base, '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  f: { headless: true, args: [...base, '--disable-gpu-process-for-dx12-info-collection', '--webgpu-developer-features', '--disable-dawn-features=use_multi_planar_format_extension'] },
};
const only = process.argv[2];
for (const [k, o] of Object.entries(sets)) {
  if (only && !only.includes(k)) continue;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: o.headless, args: o.args });
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    await page.goto('http://localhost:8125/probe4.html');
    await page.waitForFunction(() => document.title === 'done', null, { timeout: 20000 });
    const r = await page.evaluate(() => window.__out);
    console.log(k, JSON.stringify({ steps: r.steps.slice(-3), lost: r.lost, err: (r.err||'').slice(0,80) }));
  } catch (e) { console.log(k, 'FAIL', e.message.slice(0, 160)); }
  finally { if (browser) await browser.close(); }
}
srv.close();
