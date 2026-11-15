/* Brackenfell start-up: runs inline in index.html before any game script. Not part of game.js.
   1. Load: the loading screen's state. Bytes of every asset fetched (scripts, texture pack, kits, villagers) are counted as they stream in.
   2. A fetch wrapper that counts bytes and, outside test mode, keeps asset files in Cache Storage (the service worker, sw.js, serves them later).
   3. Fetches three.js and game.js itself (so the bar moves while they download), then runs them. If anything here fails, plain script tags take over.
   4. Load.register(): service worker registration and the "update available" signal. Called by the game once it has started. */
(function () {
  'use strict';
  var M = window.__MANIFEST__ || { v: 'dev', files: {}, groups: {} };
  var base = new URL('.', location.href).pathname, $ = function (id) { return document.getElementById(id); };
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var L = window.Load = {
    M: M, base: base, want: {}, total: 0, got: 0, per: {}, groups: [], build: 0, shown: 0, first: true, raf: 0, persist: false,
    hints: [
      'Doors open as you walk up to them. Most of them lead somewhere.',
      'Everyone in Brackenfell has something to say. Walk up and speak.',
      'The compass at the top shows where your quest leads, and places you have found.',
      'Your journal holds your quests, your pack and a map that fills in as you explore.',
      'Hold the stick all the way over to run. Stamina comes back when you stop.',
      'Lanterns are lit at dusk. The inn is warm, and Greta keeps a bed for guests.',
      'Frostcaps glow faintly at dusk, in cold, quiet places.',
      'Put the phone in your pocket whenever you like. The game pauses and saves.',
      'Settings has left-handed controls, a look-speed slider and a reduce-motion switch.'
    ],
    // the key of a same-origin file, relative to the site root, without its query string
    keyOf: function (url) { try { var u = new URL(url, location.href); if (u.origin !== location.origin || u.pathname.indexOf(base) !== 0) return null; return u.pathname.slice(base.length); } catch (e) { return null; } },
    // choose which groups this device is going to download (app, astc or imgs, kits, chars); can be called again when more is known
    use: function (names) {
      L.groups = names; L.want = {}; L.total = 0;
      names.forEach(function (g) { (M.groups[g] || []).forEach(function (k) { var f = M.files[k]; if (f && !(k in L.want)) { L.want[k] = f[0]; L.total += f[0]; } }); });
      L.got = 0; for (var k in L.want) L.got += Math.min(L.per[k] || 0, L.want[k]);
      L.paint();
    },
    add: function (key, n) {
      var size = M.files[key] ? M.files[key][0] : 0, have = L.per[key] || 0; L.per[key] = have + n;
      if (key in L.want) { L.got += Math.max(0, Math.min(n, L.want[key] - have)); L.paint(); }
    },
    say: function (text) { L.text = text; var t = $('loadText'); if (t) t.textContent = text; },
    stage: function (f) { L.build = Math.max(L.build, Math.min(1, f)); L.paint(); },
    // 70% of the bar is bytes arriving, 30% is the work of building the valley from them
    fraction: function () { var b = L.total ? Math.min(1, L.got / L.total) : 0; return Math.min(1, b * 0.7 + L.build * 0.3); },
    paint: function () { if (L.raf) return; L.raf = requestAnimationFrame(function () { L.raf = 0; L.draw(); }); },
    draw: function () {
      var p = Math.max(L.shown, L.fraction()); L.shown = p;
      var f = $('barFill'); if (f) f.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var m = $('loadMB'); if (m) m.textContent = L.total > 3e6 ? (L.got / 1e6).toFixed(1) + ' of ' + (L.total / 1e6).toFixed(0) + ' MB' : '';
      var pc = $('loadPct'); if (pc) pc.textContent = Math.round(p * 100) + '%';
      var b = $('bar'); if (b) b.setAttribute('aria-valuenow', Math.round(p * 100));
    },
    complete: function () { try { localStorage.setItem('brackenfell.visited', M.v); } catch (e) { } L.shown = 1; L.build = 1; var f = $('barFill'); if (f) f.style.transform = 'scaleX(1)'; var pc = $('loadPct'); if (pc) pc.textContent = '100%'; var m = $('loadMB'); if (m) m.textContent = ''; },
    update: null,        // set by the game: called when a newer build has been cached by the service worker
    updateReady: false, reg: null, cacheBytes: 0
  };
  try { L.first = !localStorage.getItem('brackenfell.visited'); } catch (e) { }
  L.persist = secure && !window.__TEST__ && 'caches' in window;
  L.use(['app', 'astc', 'kits', 'chars']);
  // rotating one-line hints under the bar
  (function () {
    var i = Math.floor(Math.random() * L.hints.length), el = null;
    function show() { el = $('loadHint'); if (!el) return; if (!$('title') || $('title').classList.contains('ready') || $('title').classList.contains('gone')) return; el.classList.add('out'); setTimeout(function () { el.textContent = L.hints[i = (i + 1) % L.hints.length]; el.classList.remove('out'); }, 450); setTimeout(show, 6500); }
    document.addEventListener('DOMContentLoaded', function () { el = $('loadHint'); if (el) el.textContent = L.hints[i]; setTimeout(show, 6500); });
  })();

  // ── fetch wrapper ──
  var realFetch = window.fetch ? window.fetch.bind(window) : null, assetCache = null;
  var isAsset = function (k) { return /^(tex|kits|chars)\//.test(k) && M.files[k]; };
  var cacheKey = function (k) { return location.origin + base + k + '?h=' + M.files[k][1]; };
  var openCache = function () { return assetCache || (assetCache = caches.open('bf-assets')); };
  L.hasAsset = function (k) { return openCache().then(function (c) { return c.match(cacheKey(k)); }).then(function (r) { return !!r; }, function () { return false; }); };
  function counted(res, key) {
    try {
      if (!res.body || !window.TransformStream || !(key in M.files)) return res;
      var ts = new TransformStream({ transform: function (chunk, ctl) { L.add(key, chunk.byteLength); ctl.enqueue(chunk); } });
      return new Response(res.body.pipeThrough(ts), { status: res.status, statusText: res.statusText, headers: res.headers });
    } catch (e) { return res; }
  }
  if (realFetch) window.fetch = function (input, init) {
    var key = null, url = typeof input === 'string' ? input : (input && input.url); if (url) key = L.keyOf(url);
    var plain = !init || !init.method || init.method === 'GET', isGet = (typeof input === 'string' || !input.method || input.method === 'GET') && plain;
    if (!key || !isGet || !(key in M.files)) return realFetch(input, init);
    var viaSW = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    var net = function () {
      return realFetch(input, init).then(function (res) {
        if (res.ok && res.status === 200 && L.persist && !viaSW && isAsset(key)) { try { var keep = res.clone(); openCache().then(function (c) { return c.put(cacheKey(key), keep); }).catch(function () { }); } catch (e) { } }
        return counted(res, key);
      });
    };
    if (L.persist && !viaSW && isAsset(key)) return openCache().then(function (c) { return c.match(cacheKey(key)); }).then(function (hit) { return hit ? counted(hit, key) : net(); }, net);
    return net();
  };

  // ── scripts ──
  function run(code) { var s = document.createElement('script'); s.text = code; document.head.appendChild(s); s.parentNode.removeChild(s); }
  function viaTags() { M.scripts.forEach(function (u) { var s = document.createElement('script'); s.src = u; s.async = false; document.head.appendChild(s); }); }
  function grab(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.text(); }); }
  L.say(L.first ? 'Fetching the game' : 'Opening the game');
  if (!realFetch || !window.Promise || !window.TransformStream) viaTags();
  else Promise.all(M.scripts.map(grab)).then(function (code) { code.forEach(run); }, function (e) { console.warn('script fetch failed, using script tags', e); viaTags(); });

  // ── service worker ──
  L.register = function () {
    if (!secure || window.__TEST__ || !('serviceWorker' in navigator)) return;
    try {
      var had = !!navigator.serviceWorker.controller, reloading = false;
      var ready = function (w) { if (!w) return; L.updateReady = true; L.waiting = w; if (L.update) L.update(); };
      navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(function (reg) {
        L.reg = reg;
        if (reg.waiting && navigator.serviceWorker.controller) ready(reg.waiting);
        reg.addEventListener('updatefound', function () { var w = reg.installing; if (!w) return; w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) ready(w); }); });
        var check = function () { try { reg.update(); } catch (e) { } };
        document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); }); setInterval(check, 30 * 60 * 1000);
      }).catch(function (e) { console.warn('service worker unavailable', e && e.message); });
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (!had || reloading) { had = true; return; } reloading = true; if (L.onReload) { try { L.onReload(); } catch (e) { } } location.reload(); });
    } catch (e) { }
  };
  // the player chose "reload": the waiting worker takes over, the page reloads when it has
  L.applyUpdate = function () { if (L.waiting) { L.waiting.postMessage('skip'); setTimeout(function () { location.reload(); }, 1500); } else location.reload(); };
  // after the game is up: make sure every file this device uses is in Cache Storage, a couple at a time, when the page is idle
  L.warm = function () {
    if (!L.persist || !realFetch) return Promise.resolve(0);
    var keys = []; L.groups.forEach(function (g) { (M.groups[g] || []).forEach(function (k) { if (isAsset(k) && keys.indexOf(k) < 0) keys.push(k); }); });
    var n = 0, bytes = 0;
    function one() {
      var k = keys.shift(); if (!k) return Promise.resolve();
      return L.hasAsset(k).then(function (has) {
        if (has) { bytes += M.files[k][0]; return; }
        var viaSW = !!(navigator.serviceWorker && navigator.serviceWorker.controller);      // a controlling worker keeps what passes through it
        return realFetch(base + k).then(function (r) { if (!r.ok) return; var keep = viaSW ? null : r.clone(); return (keep ? openCache().then(function (c) { return c.put(cacheKey(k), keep); }) : Promise.resolve()).then(function () { return r.arrayBuffer(); }).then(function () { n++; bytes += M.files[k][0]; }); }).catch(function () { });
      }).then(function () { L.cacheBytes = bytes; return one(); });
    }
    return Promise.all([one(), one()]).then(function () { L.cacheBytes = bytes; L.cached = true; try { localStorage.setItem('brackenfell.visited', M.v); } catch (e) { } return n; });
  };
})();
