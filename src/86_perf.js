// ───────────────────────── performance overlay: "Show performance" in Settings, or ?perf in the address (?perf=0 turns it off) ─────────────────────────
// Measures real frame intervals (requestAnimationFrame timestamps, not capped), averaged over the last second, and the longest one in that second.
// Draw calls and triangles are what the renderer drew for the whole frame (scene pass and both sun shadow maps). Cheap: one array write a frame and
// a text update twice a second, only while shown. game.showFps is the switch (saved with the other settings).
const PerfHud = (() => {
  const H = { ring: new Float32Array(240), n: 0, i: 0, t: 0, last: '' };
  // The last 30 s, always kept (one array write a frame): the performance report in Settings reads it, so the owner can send what a real
  // phone did without having had the overlay on. L.ms frame intervals, L.dr / L.tr draw calls and triangles of those frames, L.at when.
  const L = H.log = { ms: new Float32Array(4096), dr: new Uint16Array(4096), tr: new Float32Array(4096), at: new Float64Array(4096), i: 0, n: 0 };
  H.frame = function (rawMs) {
    if (game.playing && rawMs > 0 && rawMs < 5000 && !(typeof UI !== 'undefined' && UI.paused)) { L.ms[L.i] = rawMs; L.dr[L.i] = R.stats.draws; L.tr[L.i] = R.stats.tris; L.at[L.i] = performance.now(); L.i = (L.i + 1) % 4096; if (L.n < 4096) L.n++; }
    if (!game.showFps) return;
    H.ring[H.i] = rawMs; H.i = (H.i + 1) % H.ring.length; if (H.n < H.ring.length) H.n++;
  };
  H.text = function () {
    // frames of the last second, newest first
    let sum = 0, worst = 0, k = 0; for (let j = 1; j <= H.n && sum < 1000; j++) { const v = H.ring[(H.i - j + H.ring.length) % H.ring.length]; sum += v; if (v > worst) worst = v; k++; }
    const fps = sum > 0 ? Math.round(1000 * k / sum) : 0, info = G.renderer && G.renderer.info, mem = info && info.memory, w = Math.round(G.w * R.scale), h = Math.round(G.h * R.scale);
    return fps + ' fps  worst ' + Math.round(worst) + ' ms' + (Perf.T > 20 ? ' (browser cap ' + Math.round(1000 / Perf.T) + ')' : '') + '\n' +
      R.stats.draws + ' draws  ' + (R.stats.tris >= 1000 ? Math.round(R.stats.tris / 1000) + 'k' : R.stats.tris) + ' tris\n' +
      w + 'x' + h + ' (' + Math.round(R.scale * 100) + '% of ' + G.w + 'x' + G.h + ')\n' +
      game.tier + '  ' + (G.backend || '?') + '  chars ' + (G.chars ? (Chars.name || '?') : 'old') + '\n' +
      (mem ? 'tex ' + mem.textures + '  geo ' + mem.geometries : '');
  };
  H.update = function (dtMs) {       // call every frame
    const el = $('fps'); if (!el) return;
    if (!game.showFps) { if (!el.hidden) el.hidden = true; return; }
    el.hidden = false; H.t += dtMs; if (H.t < 500) return; H.t = 0;
    const s = H.text(); if (s !== H.last) { H.last = s; el.textContent = s; }
  };
  // what one tap in Settings copies: everything we need to know about how the game runs on this device, as plain text
  H.report = function () {
    const now = performance.now(), ms = [], dr = [], tr = []; for (let j = 1; j <= L.n; j++) { const k = (L.i - j + 4096) % 4096; if (now - L.at[k] > 30000) break; ms.push(L.ms[k]); dr.push(L.dr[k]); tr.push(L.tr[k]); }
    const n = ms.length, sum = ms.reduce((a, b) => a + b, 0), sorted = ms.slice().sort((a, b) => a - b), pct = q => n ? sorted[Math.min(n - 1, Math.floor(n * q))] : 0, avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, max = a => a.length ? Math.max.apply(null, a) : 0;
    const over = t => ms.filter(v => v > t).length, info = G.renderer && G.renderer.info, mem = info && info.memory, pm = performance.memory, nav = navigator, scr = screen;
    const lines = [
      'Brackenfell performance report',
      'Build: ' + BUILD_NAME + ' (' + (typeof Load !== 'undefined' ? Load.M.v : 'dev') + ')',
      'Device: ' + (nav.userAgentData && nav.userAgentData.platform || nav.platform || '?') + ', screen ' + scr.width + ' x ' + scr.height + ' at ' + (window.devicePixelRatio || 1).toFixed(2) + 'x, ' + (nav.hardwareConcurrency || '?') + ' cores' + (nav.deviceMemory ? ', ' + nav.deviceMemory + ' GB' : '') + (nav.maxTouchPoints ? ', touch' : ''),
      'Browser: ' + nav.userAgent,
      'Graphics: ' + (G.backend || '?') + (G.gpuName ? ' on ' + G.gpuName : '') + (G.gfxWhy ? ' (' + String(G.gfxWhy).slice(0, 80) + ')' : '') + ', textures ' + (G.pack || '?'),
      'Detail: ' + game.tier + ' (setting ' + game.qualitySetting + '), drawing ' + Math.round(G.w * R.scale) + ' x ' + Math.round(G.h * R.scale) + ' (' + Math.round(R.scale * 100) + '% of ' + G.w + ' x ' + G.h + ')',
      n ? 'Last ' + Math.round(sum / 1000) + ' s of play, ' + n + ' frames: average ' + (sum / n).toFixed(1) + ' ms (' + Math.round(1000 * n / sum) + ' fps), median ' + pct(0.5).toFixed(1) + ', 95th ' + pct(0.95).toFixed(1) + ', 99th ' + pct(0.99).toFixed(1) + ', worst ' + max(ms).toFixed(0) + ' ms' : 'No frames recorded yet: play for half a minute first',
      n ? 'Hitches: ' + over(50) + ' frames over 50 ms, ' + over(100) + ' over 100 ms, ' + over(250) + ' over 250 ms' + (Perf.T > 20 ? '; the browser caps at ' + Math.round(1000 / Perf.T) + ' fps' : '') : '',
      n ? 'Drawn: ' + Math.round(avg(dr)) + ' draw calls and ' + Math.round(avg(tr) / 1000) + 'k triangles on average, most ' + max(dr) + ' and ' + Math.round(max(tr) / 1000) + 'k' : '',
      'Memory: ' + (pm ? Math.round(pm.usedJSHeapSize / 1048576) + ' MB of script memory in use (limit ' + Math.round(pm.jsHeapSizeLimit / 1048576) + ')' : 'not reported by this browser') + (mem ? ', ' + mem.textures + ' textures, ' + mem.geometries + ' geometries' : ''),
      'Where: ' + (World.cell ? 'inside ' + World.cell.id : 'outdoors at ' + Math.round(Player.pos[0]) + ', ' + Math.round(Player.pos[2])) + ', ' + String(Math.floor(Env.hour)).padStart(2, '0') + ':' + String(Math.floor(Env.hour % 1 * 60)).padStart(2, '0') + (G.errors && G.errors.length ? ', ' + G.errors.length + ' warnings: ' + String(G.errors[0]).slice(0, 120) : ''),
    ];
    return lines.filter(Boolean).join('\n');
  };
  // copy it (the tap is the user gesture the clipboard needs); where the clipboard is refused, show it in the reader to select by hand
  H.copy = function () {
    const text = H.report(), ok = () => toast('Performance report copied. Paste it in a message.'), show = () => { if (typeof closeMenu === 'function' && UI.menu) closeMenu(); openReader('Performance report', text); };
    const old = () => { try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length); const done = document.execCommand('copy'); ta.remove(); if (done) ok(); else show(); } catch (e) { show(); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, old); else old(); } catch (e) { old(); }
    return text;
  };
  // ?perf in the address switches it on and remembers it
  const m = /[?&]perf(?:=(\w+))?/.exec(location.search);
  H.url = m ? (m[1] === '0' || m[1] === 'off' ? 0 : 1) : -1;
  return H;
})();
