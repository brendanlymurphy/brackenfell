/* Brackenfell service worker. Written by tools/build.mjs: the build id, the app-shell file list and the asset hashes are filled in there.
   - App shell (index.html, scripts, fonts, icons): cached at install under this build's name. index.html is fetched from the network first (cached copy when offline or slow);
     when the network copy differs, the worker asks the browser to look for a newer sw.js, which installs the next build beside this one.
   - Assets (tex, kits, chars): cache-first in one shared cache, keyed by path and content hash, so a new build re-downloads only files that changed.
   - A new build waits until the page says 'skip' (the "Update available: reload" button), then takes over and deletes what the old one left.
   - If anything fails the request simply goes to the network: the game never depends on this file. */
const BUILD = '748045f0', APP = ["manifest.webmanifest","fonts/IMFellEnglishSC.woff2","fonts/Alegreya.woff2","fonts/Alegreya-Italic.woff2","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-icon.png","icons/favicon-32.png","three.js?v=1fd7fb4a","game.js?v=7b3381dc","index.html"], ASSETS = {"tex/a_bark.png":"f95f2b97","tex/a_birch.png":"ae880c6f","tex/a_cloth.png":"9ba8ffe1","tex/a_cobble.png":"ff9270e9","tex/a_dirt.png":"1a6edea8","tex/a_forest.png":"f152c4aa","tex/a_grass.png":"60723c50","tex/a_grass2.png":"70abab69","tex/a_gravel.png":"9651c133","tex/a_impostor.png":"3b6f34fa","tex/a_leaves.png":"957386c9","tex/a_metal.png":"70724018","tex/a_moss.png":"86535902","tex/a_mud.png":"1caf63f5","tex/a_pine.png":"3e849835","tex/a_plain.png":"f7689eb4","tex/a_planks.png":"13c7a9de","tex/a_plaster.png":"14880a54","tex/a_rock.png":"81a6bab5","tex/a_shingle.png":"cb464c47","tex/a_soil.png":"55e63811","tex/a_stone.png":"e7cb2fe2","tex/a_stripes.png":"6f98f28a","tex/a_thatch.png":"99731f27","tex/a_timber.png":"992f588d","tex/n_bark.png":"401e7f80","tex/n_birch.png":"53f4a94d","tex/n_cloth.png":"34c7f583","tex/n_cobble.png":"475f96a6","tex/n_dirt.png":"4a9e453c","tex/n_forest.png":"1e19d86c","tex/n_grass.png":"f9219482","tex/n_grass2.png":"41095993","tex/n_gravel.png":"60a6898c","tex/n_impostor.png":"51d41bef","tex/n_leaves.png":"6297ff23","tex/n_metal.png":"963d2d6f","tex/n_moss.png":"08577bcb","tex/n_mud.png":"ea1fe8d6","tex/n_pine.png":"0b9f4809","tex/n_plain.png":"0dd65f28","tex/n_planks.png":"cc98e850","tex/n_plaster.png":"11ad51ec","tex/n_rock.png":"f04be874","tex/n_shingle.png":"56e37eda","tex/n_soil.png":"6253db4a","tex/n_stone.png":"a78f553f","tex/n_stripes.png":"f3085b82","tex/n_thatch.png":"8e69b489","tex/n_timber.png":"19bd6b83","tex/noise.bin":"c1d88f6b","tex/a_bark.webp":"1ad1e7df","tex/a_birch.webp":"4fdf01b8","tex/a_cloth.webp":"01ee0db5","tex/a_cobble.webp":"7a167447","tex/a_dirt.webp":"a050fc28","tex/a_forest.webp":"0733e2f4","tex/a_grass.webp":"54fb7a3d","tex/a_grass2.webp":"da2813b1","tex/a_gravel.webp":"16c09e77","tex/a_impostor.webp":"5a01b06b","tex/a_leaves.webp":"b1584d19","tex/a_metal.webp":"69ec0d4d","tex/a_moss.webp":"a66c2a93","tex/a_mud.webp":"7a619851","tex/a_pine.webp":"f6795063","tex/a_plain.webp":"210d1228","tex/a_planks.webp":"e5fc05bb","tex/a_plaster.webp":"c1c9c91d","tex/a_rock.webp":"832d17da","tex/a_shingle.webp":"faf571ce","tex/a_soil.webp":"d320983d","tex/a_stone.webp":"9eb5ed31","tex/a_stripes.webp":"dd234242","tex/a_thatch.webp":"bfa24137","tex/a_timber.webp":"f8da1e57","tex/n_bark.jpg":"9269edf4","tex/n_birch.jpg":"e0ac5e43","tex/n_cloth.jpg":"65d6b0c5","tex/n_cobble.jpg":"4dcd288f","tex/n_dirt.jpg":"99664d82","tex/n_forest.jpg":"4f168b16","tex/n_grass.jpg":"47f1697e","tex/n_grass2.jpg":"b20531a7","tex/n_gravel.jpg":"fcf22635","tex/n_impostor.jpg":"c02cfbbb","tex/n_leaves.jpg":"aab7c04c","tex/n_metal.jpg":"63c154af","tex/n_moss.jpg":"1c8d1267","tex/n_mud.jpg":"29034164","tex/n_pine.jpg":"21377a9b","tex/n_plain.jpg":"f78e4933","tex/n_planks.jpg":"45d35407","tex/n_plaster.jpg":"f25f0b39","tex/n_rock.jpg":"30bb8a35","tex/n_shingle.jpg":"602c6ddf","tex/n_soil.jpg":"8254e2b3","tex/n_stone.jpg":"20730bff","tex/n_stripes.jpg":"0392ced4","tex/n_thatch.jpg":"c4dde4c8","tex/n_timber.jpg":"9edd3a71","kits/CATALOG.json":"ac8e14b1","kits/SCAN_CATALOG.json":"c74a2f54","kits/TREES.json":"313a8d31","kits/nature.glb":"c27b0673","kits/props.glb":"39c87e69","kits/scan.glb":"53f674fe","kits/trees.glb":"58a520c7","kits/village.glb":"ffbf81df","kits/skin/MI_Brick_a.webp":"b9d1d5d6","kits/skin/MI_Brick_n.webp":"78c16fd4","kits/skin/MI_Brick_orm.webp":"451565ab","kits/skin/MI_MetalOrnaments_a.webp":"6a9a62a5","kits/skin/MI_MetalOrnaments_n.webp":"186bfc0c","kits/skin/MI_MetalOrnaments_orm.webp":"2d60fde2","kits/skin/MI_Planks_a.webp":"5aa7b22f","kits/skin/MI_Planks_n.webp":"4410eced","kits/skin/MI_Planks_orm.webp":"9623811f","kits/skin/MI_Plaster_a.webp":"028800de","kits/skin/MI_Plaster_n.webp":"d52d732e","kits/skin/MI_Plaster_orm.webp":"760c3427","kits/skin/MI_RedBrick_a.webp":"0d39afe1","kits/skin/MI_RedBrick_n.webp":"35ed410d","kits/skin/MI_RedBrick_orm.webp":"1f097901","kits/skin/MI_RockTrim_a.webp":"b36d56c3","kits/skin/MI_RockTrim_n.webp":"44fa2037","kits/skin/MI_RockTrim_orm.webp":"df31cd30","kits/skin/MI_RoundTiles_a.webp":"31761965","kits/skin/MI_RoundTiles_n.webp":"d01599f1","kits/skin/MI_RoundTiles_orm.webp":"c6878954","kits/skin/MI_Shingle_a.webp":"37c15514","kits/skin/MI_Shingle_n.webp":"fc2d90ac","kits/skin/MI_Shingle_orm.webp":"a9606c4d","kits/skin/MI_Trim_Cloth_a.webp":"16667e37","kits/skin/MI_Trim_Cloth_n.webp":"4c7aa7b3","kits/skin/MI_Trim_Cloth_orm.webp":"a4e672f6","kits/skin/MI_Trim_Furniture_a.webp":"dd9c0b2d","kits/skin/MI_Trim_Furniture_n.webp":"d1f41f1c","kits/skin/MI_Trim_Furniture_orm.webp":"c47493e2","kits/skin/MI_Trim_Metal_a.webp":"fda78dc7","kits/skin/MI_Trim_Metal_n.webp":"3837621d","kits/skin/MI_Trim_Metal_orm.webp":"b0f883e2","kits/skin/MI_Trim_Props_a.webp":"beb69363","kits/skin/MI_Trim_Props_n.webp":"7461b05e","kits/skin/MI_Trim_Props_orm.webp":"8055b9d3","kits/skin/MI_UnevenBrick_a.webp":"4b78542b","kits/skin/MI_UnevenBrick_n.webp":"946c9abb","kits/skin/MI_UnevenBrick_orm.webp":"16b01a12","kits/skin/MI_WoodTrim_a.webp":"c668432e","kits/skin/MI_WoodTrim_n.webp":"d75e55db","kits/skin/MI_WoodTrim_orm.webp":"9ed76354","kits/skin/SKIN.json":"642deea3","kits/skin/sources.json":"4259c7c8","chars/real/clips.glb":"84b7fe46","chars/real/f_child.glb":"2697deca","chars/real/f_elder.glb":"34e777f4","chars/real/f_farmer.glb":"ab291b6c","chars/real/f_girl.glb":"8bf22923","chars/real/f_herbalist.glb":"bff952f5","chars/real/f_maid.glb":"35e3ea72","chars/real/f_weaver.glb":"a4318da0","chars/real/m_boy.glb":"a089ce89","chars/real/m_elder.glb":"73ba4df8","chars/real/m_farmer.glb":"dcc5ffb4","chars/real/m_fisher.glb":"0a48c1bc","chars/real/m_guard.glb":"c71f848c","chars/real/m_hunter.glb":"b3c99633","chars/real/m_innkeeper.glb":"8ba5dbf9","chars/real/m_monk.glb":"dcadfb49","chars/real/m_smith.glb":"0053788f","chars/real/m_youth.glb":"1b59c3fe","chars/real/o_brute.glb":"54847cdb","chars/real/o_hood_f.glb":"b3c205da","chars/real/o_hood_m.glb":"dd4d6383","chars/real/o_rogue.glb":"2764fb4f","chars/q_clips.glb":"fea3eb2a","chars/q_eye.webp":"f8c65134","chars/q_female.glb":"7c23d8ce","chars/q_hair1.webp":"979fb56b","chars/q_hair2.webp":"a1fea3c3","chars/q_head_f.webp":"4940c820","chars/q_head_m.webp":"f1d6177d","chars/q_male.glb":"3ab3788d","chars/q_peasant.webp":"483f41ed","chars/q_peasant2.webp":"2494d98a","chars/q_peasant_n.webp":"29d06f17","chars/q_ranger.webp":"872109dc","chars/q_ranger3.webp":"9b563a4b","chars/q_ranger_n.webp":"e7be32fa","chars/q_skin_f.webp":"2f0b08ca","chars/q_skin_m.webp":"172ee808"};
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
  // Network first: when online the player always gets the newest build straight away (this project ships several builds a day, and
  // serving yesterday's page from cache until a reload button is tapped caused confusion). Offline, or if the network takes over 4 s,
  // the cached page starts instead. A page that differs from the cached one also makes the browser fetch the next sw.js, so the
  // offline copy follows along.
  const c = await caches.open(APPC), hit = await c.match(abs('index.html'));
  try {
    const r = await Promise.race([fetch(new Request(abs('index.html'), { cache: 'no-cache' })), new Promise((_, no) => setTimeout(() => no(new Error('slow')), hit ? 4000 : 30000))]);
    if (r && r.ok) {
      if (hit) event.waitUntil((async () => { try { const a = await r.clone().text(), b = await hit.clone().text(); if (a !== b) await self.registration.update(); } catch (err) { } })());
      return r;
    }
  } catch (err) { }
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
