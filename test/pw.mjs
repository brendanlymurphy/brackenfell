// One place that finds Playwright and a Chrome to drive, on any machine: the repository's own node_modules (CI: `npm ci` installs the
// `playwright` dev dependency), or the copies the cloud containers ship under /opt. Chrome: $CHROME, the system Google Chrome, or Playwright's own.
// usage: import { chromium, CHROME, launch } from './pw.mjs';   const browser = await launch(['--extra-flag']);
import fs from 'node:fs';
let chromium = null;
for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright/index.mjs', '/opt/node-tools/node_modules/playwright/index.mjs']) { try { ({ chromium } = await import(p)); if (chromium) break; } catch (e) { } }
if (!chromium) throw new Error('Playwright not found: run `npm ci` in the repository');
const CHROME = [process.env.CHROME, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium'].find(p => p && fs.existsSync(p)) || undefined;
// software rendering works everywhere; WebGPU needs the SwiftShader adapter named
const BASE = ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'], GPU = ['--enable-unsafe-webgpu', '--use-webgpu-adapter=swiftshader'];
const launch = (extra, o) => chromium.launch(Object.assign({ executablePath: CHROME, headless: true, args: BASE.concat(extra || []) }, o || {}));
export { chromium, CHROME, launch, BASE, GPU };
