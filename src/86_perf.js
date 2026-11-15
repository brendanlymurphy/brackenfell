// ───────────────────────── performance overlay: "Show performance" in Settings, or ?perf in the address (?perf=0 turns it off) ─────────────────────────
// Measures real frame intervals (requestAnimationFrame timestamps, not capped), averaged over the last second, and the longest one in that second.
// Draw calls and triangles are what the renderer drew for the whole frame (scene pass and both sun shadow maps). Cheap: one array write a frame and
// a text update twice a second, only while shown. game.showFps is the switch (saved with the other settings).
const PerfHud = (() => {
  const H = { ring: new Float32Array(240), n: 0, i: 0, t: 0, last: '' };
  H.frame = function (rawMs) {
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
  // ?perf in the address switches it on and remembers it
  const m = /[?&]perf(?:=(\w+))?/.exec(location.search);
  H.url = m ? (m[1] === '0' || m[1] === 'off' ? 0 : 1) : -1;
  return H;
})();
