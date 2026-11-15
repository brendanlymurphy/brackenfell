import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const flagSets = {
  a: ['--enable-unsafe-webgpu','--enable-features=Vulkan','--use-angle=swiftshader','--use-webgpu-adapter=swiftshader','--ignore-gpu-blocklist','--no-sandbox'],
  b: ['--enable-unsafe-webgpu','--use-webgpu-adapter=swiftshader','--no-sandbox'],
};
for (const [k, args] of Object.entries(flagSets)) {
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
    console.log(k, JSON.stringify(out), (Date.now() - t0) + 'ms');
    await page.screenshot({ path: `/home/claude/village/test/probe_${k}.png` });
  } catch (e) { console.log(k, 'FAIL', e.message.slice(0, 300)); }
  finally { if (browser) await browser.close(); }
}
