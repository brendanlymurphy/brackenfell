/* Brackenfell service worker. Written by tools/build.mjs: the build id, the app-shell file list and the asset hashes are filled in there.
   - App shell (index.html, scripts, fonts, icons): cached at install under this build's name. index.html is served stale-while-revalidate;
     when the network copy differs, the worker asks the browser to look for a newer sw.js, which installs the next build beside this one.
   - Assets (tex, kits, chars): cache-first in one shared cache, keyed by path and content hash, so a new build re-downloads only files that changed.
   - A new build waits until the page says 'skip' (the "Update available: reload" button), then takes over and deletes what the old one left.
   - If anything fails the request simply goes to the network: the game never depends on this file. */
const BUILD = '__BUILD__', APP = /*__APP__*/[], ASSETS = /*__ASSETS__*/{};
const APPC = 'bf-app-' + BUILD, ASSC = 'bf-assets', SCOPE = self.registration.scope, ORIGIN = new URL(SCOPE).origin, BASE = new URL(SCOPE).pathname;
const abs = p => new URL(p, SCOPE).href, assetKey = p => abs(p) + '?h=' + ASSETS[p];
const APPSET = new Set(APP);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(APPC);
    await Promise.all(APP.map(async u => { const r = await fetch(new Request(abs(u), { cache: 'reload' })); if (!r.ok) throw new Error(u + ' ' + r.status); await c.put(abs(u), r); }));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('bf-app-') && k !== APPC) await caches.delete(k);
    try {
      const a = await caches.open(ASSC), live = new Set(Object.keys(ASSETS).map(assetKey));
      for (const r of await a.keys()) if (!live.has(r.url)) await a.delete(r);
    } catch (err) { }
    try { await self.clients.claim(); } catch (err) { }
  })());
});

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

async function shell(event) {
  const c = await caches.open(APPC), hit = await c.match(abs('index.html'));
  const refresh = (async () => {
    try {
      const r = await fetch(new Request(abs('index.html'), { cache: 'no-cache' }));
      if (r.ok && hit) { const a = await r.text(), b = await hit.clone().text(); if (a !== b) await self.registration.update(); }
    } catch (err) { }
  })();
  event.waitUntil(refresh);
  if (hit) return hit;
  return fetch(event.request);
}
async function fromApp(req, path) {
  const c = await caches.open(APPC), hit = await c.match(abs(path));
  return hit || fetch(req);
}
async function asset(req, path) {
  const c = await caches.open(ASSC), key = assetKey(path), hit = await c.match(key);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok && r.status === 200) { try { await c.put(key, r.clone()); } catch (err) { } }
  return r;
}
// spoken lines: fetched when first needed, kept for good (172 files, 3.3 MB); the manifest tries the network first so a new script is noticed
async function voice(req, path) {
  const c = await caches.open('bf-voice'), hit = await c.match(req.url);
  if (path.endsWith('manifest.json')) { try { const r = await fetch(req); if (r.ok) { await c.put(req.url, r.clone()); return r; } } catch (err) { } return hit || fetch(req); }
  if (hit) return hit;
  const r = await fetch(req); if (r.ok && r.status === 200) { try { await c.put(req.url, r.clone()); } catch (err) { } } return r;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url); if (u.origin !== ORIGIN || !u.pathname.startsWith(BASE)) return;
  const path = u.pathname.slice(BASE.length);
  try {
    if (req.mode === 'navigate' && (path === '' || path === 'index.html')) { e.respondWith(shell(e).catch(() => fetch(req))); return; }
    if (APPSET.has(path + u.search) || APPSET.has(path)) { e.respondWith(fromApp(req, APPSET.has(path + u.search) ? path + u.search : path).catch(() => fetch(req))); return; }
    if (path.startsWith('audio/voice/') && !req.headers.has('range')) { e.respondWith(voice(req, path).catch(() => fetch(req))); return; }
    if (ASSETS[path] && !req.headers.has('range')) e.respondWith(asset(req, path).catch(() => fetch(req)));
  } catch (err) { }
});
