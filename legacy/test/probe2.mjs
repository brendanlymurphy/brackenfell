import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const base = ['--no-sandbox','--enable-unsafe-webgpu','--ignore-gpu-blocklist'];
const flagSets = {
  c: [...base,'--use-webgpu-adapter=swiftshader','--disable-gpu-sandbox'],
  d: [...base,'--use-webgpu-adapter=swiftshader','--in-process-gpu'],
  e: [...base,'--enable-features=Vulkan','--use-vulkan=swiftshader','--use-angle=vulkan','--disable-vulkan-surface','--disable-gpu-sandbox'],
  f: [...base,'--use-gl=angle','--use-angle=swiftshader','--enable-features=Vulkan,WebGPU','--use-webgpu-adapter=swiftshader','--disable-gpu-sandbox','--in-process-gpu'],
};
const only = process.argv[2];
for (const [k, args] of Object.entries(flagSets)) {
  if (only && only !== k) continue;
  const t0 = Date.now();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args });
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    page.on('console', m => console.log('[console]', m.text()));
    page.on('pageerror', e => console.log('[pageerror]', e.message));
    await page.goto('file:///home/claude/village/test/probe.html');
    await page.waitForFunction(() => document.title === 'done', null, { timeout: 30000 });
    const out = await page.evaluate(() => window.__out);
    console.log(k, JSON.stringify({adapter:out.adapter,info:out.info,fmt:out.fmt,rendered:out.rendered,err:out.err}), (Date.now() - t0) + 'ms');
    await page.screenshot({ path: `/home/claude/village/test/probe_${k}.png` });
  } catch (e) { console.log(k, 'FAIL', e.message.slice(0, 300)); }
  finally { if (browser) await browser.close(); }
}
