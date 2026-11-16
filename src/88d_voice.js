// ───────────────────────── spoken dialogue and barks ─────────────────────────
// Lines are generated at build time (tools/voice, Kokoro-82M) into audio/voice/*.m4a with a manifest keyed by a hash of speaker + on-screen text.
// When a dialogue node is shown the line is fetched (the speaker's other lines are prefetched), decoded and played from the speaker's position on the
// voice bus, ducking ambience and music. Subtitles stay, as a slim strip (body.voiced). Choices wait for the line to end or a tap, which skips it.
// If the manifest, the file or the audio context is missing, nothing changes: the text box behaves exactly as before.
// showNode / endTalk (85_ui.js) are wrapped here rather than edited; barks read NPC positions and Combat.swingN.
(() => {
  const K = Snd, V = K.vox = { man: null, loading: false, failed: false, buf: new Map(), pend: new Map(), cur: null, wait: false, lastBark: -99, perNpc: new Map(), swing: 0, key: null, wrapped: false, req: [], waitT: 0 };
  const cyrb53 = (str, seed = 0) => { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
  V.keyOf = (speaker, text) => cyrb53(speaker + '\n' + text);
  const BASE = 'audio/voice/';
  K.set.voices = true; K.set.voiceVol = 0.9; K.set.subs = true; K.load();
  // the slim subtitle strip and the waiting state (styles are injected here so the interface files stay untouched)
  if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = '/* [voice] */\nbody.voiced.nosubs #dtext { visibility: hidden; }\n#dopts.vwait { visibility: hidden; }'; document.head.appendChild(st); }

  V.init = function () { if (V.loading || V.man || V.failed) return; V.loading = true;
    fetch(BASE + 'manifest.json').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => { V.man = j; V.loading = false; }).catch(() => { V.failed = true; V.loading = false; }); };
  const decode = (c, ab) => new Promise((res, rej) => { try { const p = c.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); } catch (e) { rej(e); } });
  // fetch and decode one file once; resolves to an AudioBuffer or null
  V.load = function (file) { if (V.buf.has(file)) return Promise.resolve(V.buf.get(file)); if (V.pend.has(file)) return V.pend.get(file); const c = K.ctx; if (!c) return Promise.resolve(null);
    const p = fetch(BASE + file).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(ab => decode(c, ab)).then(b => { V.buf.set(file, b); V.pend.delete(file); return b; }).catch(() => { V.pend.delete(file); return null; }); V.pend.set(file, p); return p; };
  V.prefetch = function (speaker) { if (!V.man) return; const m = V.man.lines; let n = 0; for (const k in m) if (m[k].s === speaker && !V.buf.has(m[k].f) && !V.pend.has(m[k].f) && n++ < 16) setTimeout(() => V.load(m[k].f), 80 * n); };
  V.stop = function (quiet) { const cu = V.cur; V.cur = null; if (cu) { try { cu.g.gain.setTargetAtTime(0, K.now(), 0.03); cu.src.stop(K.now() + 0.15); } catch (e) { } } V.reveal(); V.key = null; };
  V.reveal = function () { V.wait = false; if (typeof document === 'undefined') return; const b = document.getElementById('dopts'); if (b) b.classList.remove('vwait'); };
  // play a decoded buffer from a position (or at the listener) on the voice bus; returns the handle
  V.play = function (buf, speaker, pos, vol, o) {
    const c = K.ctx; if (!c || K.off) return null; const G = K.G; let dest = K.bus.ui.in, g = c.createGain(), src = c.createBufferSource(); src.buffer = buf; g.gain.value = vol * K.set.voiceVol * (o && o.trim || 1);
    // Speech is DRY: straight to the master chain, never through a bus (the buses feed the room reverbs and the outdoor echo, which made every
    // line sound shouted across a hall). Conversation (o.dry, or no position) is centred at full level, like any game's dialogue. A passing bark
    // keeps distance fall-off, a little pan and the wall muffle, but still no reverb.
    dest = K.pre || K.bus.ui.in;
    if (pos && !(o && o.dry)) { const sp = K._s; if (!K.spat(pos[0], pos[1], pos[2], o && o.zone !== undefined ? o.zone : G.zone, o && o.ref || 3, o && o.max || 40, sp)) return null;
      g.gain.value *= sp.g; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.max(sp.lp, 2600); lp.Q.value = 0.5; g.connect(lp);
      if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = sp.pan * 0.45; lp.connect(pn); pn.connect(dest); } else lp.connect(dest);
    } else g.connect(dest);
    src.connect(g); src.start(K.now() + 0.02); const h = { src, g, t0: K.now(), dur: buf.duration, speaker }; src.onended = () => { if (V.cur === h) { V.cur = null; V.reveal(); } }; return h; };
  // a dialogue node was shown: returns true if the line is voiced. The speaker is an NPC object or id.
  K.say = function (npc, text) {
    V.stop(); if (!K.set.voices || !K.ctx || K.off || !npc || !V.man) return false; const id = npc.id || npc, whole = V.man.lines[V.keyOf(id, text)];
    // [voice parts] A remark put in front of a villager's own line (IX.SAY in 82b_interact.js joins them with a blank line) is recorded on its
    // own: when the whole text has no file, the paragraphs that have one are played one after another. Before this, such a remark silenced the line.
    const seq = whole ? [whole] : String(text).indexOf('\n\n') > 0 ? String(text).split('\n\n').map(t => V.man.lines[V.keyOf(id, t)]).filter(Boolean) : [];
    if (!seq.length) { document.body.classList.remove('voiced'); return false; }
    const key = V.key = V.keyOf(id, text); V.wait = true; const box = document.getElementById('dopts'); if (box) box.classList.add('vwait'); document.body.classList.add('voiced'); document.body.classList.toggle('nosubs', !K.set.subs); V.waitT = K.now();
    const pos = npc.pos ? [npc.pos[0], npc.pos[1] + 1.55, npc.pos[2]] : null;
    const run = (bufs, i) => { const h = V.play(bufs[i][0], id, pos, 1, { ref: 3, max: 40, dry: true }); if (!h) { V.reveal(); return; } V.cur = h; h.env = bufs[i][1].e; h.cues = bufs[i][1].c; /* [ch1] mouth-shape track for 49_chars.js */ V.lastPlayed = { speaker: id, file: bufs[i][1].f, text };
      if (i + 1 < bufs.length) h.src.onended = () => { if (V.cur !== h) return; V.cur = null; if (V.key !== key) { V.reveal(); return; } V.wait = true; setTimeout(() => { if (V.key === key) run(bufs, i + 1); }, 260); }; };
    Promise.all(seq.map(e => V.load(e.f))).then(got => { if (V.key !== key) return; const bufs = got.map((b, i) => [b, seq[i]]).filter(x => x[0]); if (!bufs.length) { V.reveal(); document.body.classList.remove('voiced'); return; }
      if (K.ctx.state !== 'running') { V.reveal(); return; } run(bufs, 0); });
    // do not hold the choices hostage to a slow download
    setTimeout(() => { if (V.key === key && !V.cur) { V.reveal(); } }, 2500);
    return true; };
  K.voiceBusy = () => !!V.cur || V.wait;
  // the interface: tapping the dialogue skips the line (and does not pick an option); wrapped here so 85_ui.js stays untouched
  function wrap() {
    if (V.wrapped || typeof showNode !== 'function' || typeof endTalk !== 'function') return; V.wrapped = true;
    const sn = showNode, et = endTalk;
    // [voice overheard] talk you overhear is shown as a notice, '<b>Rowan</b>: “line”' (the night meeting in 82c_secrets.js): play its recording if there is one, one after another
    if (typeof toast === 'function') { const ts = toast; toast = function (h) { const r = ts.apply(this, arguments); try { const m = /^<b>(\w+)<\/b>: “(.+)”$/.exec(String(h)), e = m && V.man && K.set.voices && K.ctx && !K.off && V.man.lines[V.keyOf(m[1].toLowerCase(), m[2])];
      if (e) V.load(e.f).then(buf => { if (!buf || K.ctx.state !== 'running') return; const at = Math.max(K.now(), V.overT || 0); V.overT = at + buf.duration + 0.3; setTimeout(() => { if (!V.cur && !V.wait) V.play(buf, m[1].toLowerCase(), null, 0.8, { dry: true }); }, (at - K.now()) * 1000); }); } catch (e) { } return r; }; }
    showNode = function (n) { sn(n); try { if (n && UI.talk) { K.say(UI.talk, n.t); V.prefetch(UI.talk.id); } } catch (e) { } };
    endTalk = function () { try { V.stop(); document.body.classList.remove('voiced'); } catch (e) { } return et.apply(this, arguments); };
    const d = document.getElementById('dialog'); if (d) d.addEventListener('click', e => { if (V.wait || V.cur) { V.stop(); e.stopPropagation(); e.preventDefault(); } }, true);
    addEventListener('keydown', e => { if ((V.wait || V.cur) && typeof UI !== 'undefined' && UI.talk && (e.code === 'Space' || e.code === 'Enter' || /^Digit\d$/.test(e.code))) { V.stop(); e.stopPropagation(); e.preventDefault(); } }, true);
  }
  // ── barks: a greeting by time of day for an idle villager close by, a protest when a sword is swung near them ──
  const cat = h => h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night';
  V.bark = function (npc, c) { if (!V.man || !K.set.voices || !K.ctx) return false; const arr = V.man.barks && V.man.barks[npc.id] && V.man.barks[npc.id][c]; if (!arr || !arr.length) return false; const key = arr[Math.floor(Math.random() * arr.length)], e = V.man.lines[key]; if (!e) return false;
    V.lastBark = K.T; V.perNpc.set(npc, K.T);
    V.load(e.f).then(buf => { if (!buf || V.cur || K.ctx.state !== 'running') return; const h = V.play(buf, npc.id, [npc.pos[0], npc.pos[1] + 1.55, npc.pos[2]], 0.55, { ref: 2, max: 14, bus: 'world', zone: K.zoneOf(npc.pos[0], npc.pos[1], npc.pos[2]) }); if (h) { V.barkH = h; h.cues = e.c; h.env = h.env || e.e; /* [ch1] */ V.lastPlayed = { speaker: npc.id, file: e.f, bark: c }; } }); return true; };
  K.ups.push(function (K, dt, G) {
    if (!G.playing && !K.ctx) return; if (!V.man && !V.failed && !V.loading && K.T > 1) V.init(); if (!V.wrapped && typeof game !== 'undefined' && game.ready) wrap();
    // ducking: ambience and music dip while anyone is speaking
    const tgt = V.cur ? (V.cur.speaker && V.barkH === V.cur ? 0.25 : 1) : 0; K.duck = (K.duck || 0) + (tgt - (K.duck || 0)) * Math.min(1, dt * (tgt > (K.duck || 0) ? 6 : 1.5));
    if (V.barkH && V.barkH.src && K.now() > V.barkH.t0 + V.barkH.dur + 0.2) V.barkH = null;
    if (!G.playing || G.talk || G.menu || !K.set.voices || typeof NPCS === 'undefined' || (K.frame & 15) !== 0) return;
    // a swung sword near a villager
    if (typeof Combat !== 'undefined' && Combat.swingN !== V.swing) { V.swing = Combat.swingN; for (const n of NPCS) { if (n.anim === 'lie' || n.talking || Math.hypot(n.pos[0] - G.x, n.pos[2] - G.z) > 9) continue; if (K.T - (V.perNpc.get(n) || -99) < 25) continue; V.bark(n, 'weapon'); break; } return; }
    if (K.T - V.lastBark < 22 || V.cur) return;
    for (const n of NPCS) { const d = Math.hypot(n.pos[0] - G.x, n.pos[2] - G.z); if (d > 4.5 || d < 0.8 || n.anim === 'lie' || n.anim === 'sit' && G.night > 0.5 || n.talking) continue; if (K.T - (V.perNpc.get(n) || -99) < 150) continue; if (Math.random() < 0.5) { V.perNpc.set(n, K.T - 100); continue; } V.bark(n, cat(G.hour)); break; }
  });
})();
