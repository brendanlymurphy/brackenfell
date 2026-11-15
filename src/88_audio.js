// ───────────────────────── Snd: the sound engine ─────────────────────────
// 88_audio.js   engine: context, master chain (soft limiter), buses, reverb spaces, listener, positional routing, voices, iOS handling,
//               Settings block, and the Audio2 shim the rest of the game still calls.
// 88b_sfx.js    synthesised one-shots (footsteps, doors, combat, UI, bells, birds ...): Snd.lib[name] = { bus, prio, gap, fn }.
// 88c_beds.js   ambience beds, positional loops (river, lake, fire, mill, forge, crowd) and scheduled nature sounds.
// 88c_world.js  reads the game (player, zones, ENV, NPCs, foes) once per frame and drives footsteps, doors, bell, forge, combat.
// 88c_music.js  procedural adaptive music and the lute tune.
// Everything is built on any BaseAudioContext, so test/audio.mjs renders it offline. Nothing here allocates per frame, and every
// call is safe when there is no audio device (the context stays null or suspended and update() returns at once).
const Snd = {
  ctx: null, disabled: false, T: 0, frame: 0, err: 0, errMsg: '', pausedMul: 1, ups: [], lib: {}, bus: {}, rin: {}, rret: {}, sp: { open: 1, room: 0, hall: 0, cave: 0 }, spT: { open: 1, room: 0, hall: 0, cave: 0 },
  set: { master: 0.8, amb: 0.85, world: 0.85, foot: 0.85, ui: 0.85, music: 0.6, musicOn: true },
  // base trims per bus (dB-ish scaling chosen so that ambience beds sit near -27 dB RMS, footsteps and interactions peak near -12 dB)
  trim: { amb: 2.0, world: 1.0, foot: 1.0, ui: 1.0, music: 2.5 },
  rvSend: { amb: 0.1, world: 0.55, foot: 0.7, ui: 0.25, music: 0.4 },
  L: { x: 0, y: 0, z: 0, yaw: 0, fx: 0, fz: -1, rx: 1, rz: 0 },
  G: { x: 0, y: 0, z: 0, zone: 0, zid: '', indoor: 0, space: 'open', hour: 12, night: 0, day: 1, wind: 0.8, rain: 0, forest: 0, playing: false, menu: false, talk: false, dead: false, speed: 0, ground: true, outd: 1, nearTown: 0 },
  dbg: {}, trims: {}, vEnd: new Float64Array(64), vPrio: new Uint8Array(64), vN: 0, last: {}, _s: { g: 0, lp: 16000, pan: 0, d: 0 },

  // ── persistence of the volume block (master and music are shared with the older Sound / Music sliders through Audio2) ──
  load() { try { const j = JSON.parse(localStorage.getItem('brackenfell.snd') || 'null'); if (j) for (const k in this.set) if (j[k] !== undefined && typeof j[k] === typeof this.set[k]) this.set[k] = j[k]; } catch (e) { } },
  save() { try { localStorage.setItem('brackenfell.snd', JSON.stringify(this.set)); } catch (e) { } },

  // ── context ──
  start() {
    if (this.ctx) { this.resume(); return; }
    if (this.disabled) return;
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); if (!AC) { this.disabled = true; return; }
    try {
      const c = new AC({ latencyHint: 'interactive' }); this.build(c); this.ctx = c; this.running = c.state === 'running';
      c.onstatechange = () => { this.running = c.state === 'running'; };
      // iOS only starts a context from inside a gesture: play one silent sample now, and resume on every later gesture if it is suspended or interrupted
      const b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
      this.resume();
    } catch (e) { this.ctx = null; this.disabled = true; this.errMsg = String(e); }
  },
  resume() { const c = this.ctx; if (!c || this.hidden) return; if (c.state !== 'running') { try { const p = c.resume(); if (p && p.catch) p.catch(() => { }); } catch (e) { } } },
  hush() { const c = this.ctx; if (c && c.state === 'running') { try { const p = c.suspend(); if (p && p.catch) p.catch(() => { }); } catch (e) { } } },

  // ── graph ──
  build(c, o) {
    const S = this; S.ctx = S.ctx || null; S.c = c; S.sr = c.sampleRate; o = o || {};
    S.master = c.createGain(); S.master.gain.value = 0;
    S.shelf = c.createBiquadFilter(); S.shelf.type = 'highshelf'; S.shelf.frequency.value = 7000; S.shelf.gain.value = -2.5;           // phone speakers are bright: take the edge off
    S.comp = c.createDynamicsCompressor(); S.comp.threshold.value = -4; S.comp.knee.value = 3; S.comp.ratio.value = 16;      // a limiter, not a leveller: the browsers add make-up gain to compressors, so keep it near +2 dB S.comp.attack.value = 0.004; S.comp.release.value = 0.14;
    S.clip = c.createWaveShaper();            // the last word: a soft ceiling at 0.89 (-1 dBFS), linear below 0.6, so nothing can leave the chain above -1 dB
    const n = 2048, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, a = Math.abs(x); cv[i] = (a < 0.6 ? a : 0.6 + 0.29 * Math.tanh((a - 0.6) / 0.29)) * Math.sign(x); } S.clip.curve = cv;
    S.pre = c.createGain(); S.pre.connect(S.master); S.master.connect(S.shelf); S.shelf.connect(S.comp); S.comp.connect(S.clip); S.clip.connect(c.destination);
    // noise stock: white, pink (Kellet), brown. Every bed and burst plays slices of these.
    S.nz = {}; for (const k of ['white', 'pink', 'brown']) S.nz[k] = S.mkNoise(k, 4);
    // slow random control signal in [-1, 1], features about 1 s long at rate 1 (play faster for quicker flutter): modulates levels and filters
    { const n = 60 * 8000, b = c.createBuffer(1, n, 8000), d = b.getChannelData(0), pts = new Float32Array(62); let s = 4242; for (let i = 0; i < 62; i++) { s = (s * 1664525 + 1013904223) >>> 0; pts[i] = (s / 4294967296) * 2 - 1; } pts[60] = pts[0];
      for (let i = 0; i < n; i++) { const x = i / 8000, k = Math.floor(x), f = x - k, u = f * f * (3 - 2 * f); d[i] = pts[k] + (pts[k + 1] - pts[k]) * u; } d[n - 1] = d[0]; S.slow = b; }
    // reverb spaces: a small room, a hall (inn, chapel), a stone cellar; open air is a faint filtered slap
    S.rv = {};
    for (const [k, dur, dec, bright, pre, er] of [['room', 0.5, 5.5, 0.55, 0.004, 1], ['hall', 2.3, 3.4, 0.5, 0.018, 0.6], ['cave', 3.6, 2.6, 0.32, 0.03, 0.3]]) {
      const cv2 = c.createConvolver(); cv2.buffer = S.mkIR(dur, dec, bright, pre, er); const rg = c.createGain(); rg.gain.value = 0; cv2.connect(rg); rg.connect(S.pre); S.rin[k] = cv2; S.rret[k] = rg;
    }
    { const d = c.createDelay(0.5), fb = c.createGain(), lp = c.createBiquadFilter(), rg = c.createGain(); d.delayTime.value = 0.13; fb.gain.value = 0.22; lp.type = 'lowpass'; lp.frequency.value = 2200; rg.gain.value = 0;
      const inn = c.createGain(); inn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(rg); rg.connect(S.pre); S.rin.open = inn; S.rret.open = rg; }
    S.rvList = ['open', 'room', 'hall', 'cave'];
    for (const k of ['amb', 'world', 'foot', 'ui', 'music']) {
      const g = c.createGain(); g.gain.value = S.set[k] * S.trim[k]; g.connect(S.pre);
      const b = S.bus[k] = { g, in: g, snd: {} };
      for (const s of S.rvList) { const sg = c.createGain(); sg.gain.value = 0; g.connect(sg); sg.connect(S.rin[s]); b.snd[s] = sg; }
    }
    S.out = S.bus.world.in;
    S.master.gain.value = o.instant ? S.set.master : 0;
    S.spT.open = 1; S.sp.open = 1; S.applySends(true);
    S.buf = S.buf || {};
    S.vN = 0; S.vEnd.fill(0);
    for (const fn of S.inits || []) fn(S, c);
    return S;
  },
  mkNoise(kind, secs) {
    const c = this.c, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0, a6 = 0, br = 0, s = 12345;
    for (let i = 0; i < n; i++) {
      s = (s * 1664525 + 1013904223) >>> 0; const w = (s / 4294967296) * 2 - 1;
      if (kind === 'white') d[i] = w;
      else if (kind === 'pink') { a0 = 0.99886 * a0 + w * 0.0555179; a1 = 0.99332 * a1 + w * 0.0750759; a2 = 0.969 * a2 + w * 0.153852; a3 = 0.8665 * a3 + w * 0.3104856; a4 = 0.55 * a4 + w * 0.5329522; a5 = -0.7616 * a5 - w * 0.016898; d[i] = (a0 + a1 + a2 + a3 + a4 + a5 + a6 + w * 0.5362) * 0.11; a6 = w * 0.115926; }
      else { br = (br + 0.02 * w) / 1.02; d[i] = br * 3.5; }
    }
    // make it loop seamlessly: crossfade the last 2000 samples into the first
    const x = Math.min(2000, n >> 2); for (let i = 0; i < x; i++) { const k = i / x; d[i] = d[i] * k + d[n - x + i] * (1 - k); }
    return b;
  },
  mkIR(dur, decay, bright, pre, er) {
    const c = this.c, sr = c.sampleRate, n = Math.floor(sr * dur), b = c.createBuffer(2, n, sr);
    let s = 987654321 + Math.floor(dur * 1000);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0; const p0 = Math.floor(pre * sr);
      for (let i = p0; i < n; i++) {
        s = (s * 1664525 + 1013904223) >>> 0; const w = (s / 4294967296) * 2 - 1, t = (i - p0) / (n - p0);
        const k = bright * Math.pow(1 - t, 1.6) + 0.05; lp += (w - lp) * Math.min(1, k * 0.9 + 0.03);       // the tail gets darker as it dies
        d[i] = lp * Math.exp(-decay * 2.3 * t) * (1 - Math.exp(-(i - p0) / (sr * 0.004)));
      }
      // sparse early reflections
      for (let e = 0; e < 7; e++) { s = (s * 1664525 + 1013904223) >>> 0; const at = p0 + Math.floor((0.004 + (s / 4294967296) * 0.05 * (dur > 1 ? 1.6 : 1)) * sr); if (at < n) d[at] += (ch ? -1 : 1) * er * (0.35 - e * 0.03); }
    }
    return b;
  },

  // ── reverb space and bus levels ──
  applySends(now) {
    const S = this, t = S.now(), tc = now ? 0.001 : 0.25;
    for (const k of S.rvList) {
      const w = S.sp[k], ret = k === 'open' ? 0.22 : k === 'room' ? 0.9 : k === 'hall' ? 1.0 : 1.0;
      S.rret[k].gain.setTargetAtTime(ret, t, 0.05);
      for (const bn of ['amb', 'world', 'foot', 'ui', 'music']) {
        const b = S.bus[bn]; let lv = S.rvSend[bn] * w;
        if (bn === 'music') lv = S.rvSend.music * (k === 'open' ? 0 : 0.6 * w) + (k === 'hall' ? 0.45 * (1 - 0.5 * w) : 0);        // the music always has a little hall around it
        else if (k === 'open') lv *= bn === 'amb' || bn === 'ui' ? 0 : 0.5;
        b.snd[k].gain.setTargetAtTime(lv, t, tc);
      }
    }
  },
  busLevels() {
    const S = this, t = S.now(), u = S.set, m = S.G.talk ? 0.38 : 1;
    S.master.gain.setTargetAtTime(u.master * S.pausedMul * S.fadeIn, t, 0.15);
    const dk = 1 - 0.45 * (S.duck || 0);      // speech ducks the ambience and the world
    S.bus.amb.g.gain.setTargetAtTime(u.amb * S.trim.amb * dk, t, 0.3);
    S.bus.world.g.gain.setTargetAtTime(u.world * S.trim.world * dk, t, 0.3);
    S.bus.foot.g.gain.setTargetAtTime(u.foot * S.trim.foot, t, 0.3);
    S.bus.ui.g.gain.setTargetAtTime(u.ui * S.trim.ui, t, 0.3);
    S.dbg.music = (u.musicOn ? u.music : 0) * S.trim.music * m * (1 - 0.6 * (S.duck || 0)); S.bus.music.g.gain.setTargetAtTime(S.dbg.music, t, S.G.talk ? 0.35 : 1.2);        // ducks under dialogue
  },

  // ── voices: a hard limit on one-shots, with room kept for important ones ──
  voice(prio, dur) {
    const S = this, now = S.now(); let n = 0, free = -1;
    for (let i = 0; i < 64; i++) { if (S.vEnd[i] > now) n++; else if (free < 0) free = i; }
    S.vN = n; const lim = prio >= 2 ? 40 : prio === 1 ? 30 : 22;
    if (n >= lim || free < 0) return false;
    S.vEnd[free] = now + dur; S.vPrio[free] = prio; S.vN = n + 1; return true;
  },

  // ── positional audibility: distance roll-off, air absorption, and a muffled wall when the source is in another zone ──
  spat(x, y, z, zone, ref, maxD, out) {
    const S = this, L = S.L, G = S.G, dx = x - L.x, dy = y - L.y, dz = z - L.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz), o = out || S._s;
    o.d = d; if (d > maxD) { o.g = 0; return false; }
    let g = ref / Math.max(d, ref); const f = d / maxD; g *= 1 - f * f * f;
    let lp = 16000 / (1 + d / 18); if (lp < 1400) lp = 1400;
    if (zone !== G.zone) { g *= G.zone && zone ? 0.1 : 0.2; lp = Math.min(lp, G.zone && zone ? 450 : 700); }       // through a wall (or two)
    const dl = d > 0.01 ? 1 / d : 0, hx = dx * dl, hz = dz * dl;
    o.pan = d < 1.2 ? 0 : Math.max(-0.95, Math.min(0.95, (hx * L.rx + hz * L.rz) * 0.9));
    const back = hx * L.fx + hz * L.fz; if (back < 0) lp *= 0.75 + 0.25 * (1 + back);                                  // head shadow behind you
    o.g = g; o.lp = lp; return g > 0.004;
  },
  // a disposable chain for one voice: returns the node to connect the sound to, or null when it could not be heard
  route(bus, x, y, z, zone, ref, maxD, v) {
    const S = this, c = S.c, o = S._s; if (!S.spat(x, y, z, zone, ref || 2.5, maxD || 90, o)) return null;
    const g = c.createGain(), lp = c.createBiquadFilter(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    g.gain.value = o.g * (v === undefined ? 1 : v); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.Q.value = 0.5; g.connect(lp);
    if (p) { p.pan.value = o.pan; lp.connect(p); p.connect(S.bus[bus].in); } else lp.connect(S.bus[bus].in);
    return g;
  },
  zoneOf(x, y, z) { return typeof World !== 'undefined' && World.zoneAt ? World.zoneAt(x, y + 1, z) : 0; },

  // ── playing a library sound. pos = [x,y,z] or null for a sound at the listener. Returns true if it started. ──
  play(name, pos, v, p) {
    const S = this, c = S.c, e = S.lib[name]; if (!c || !e || S.off) return false;
    const now = S.now();
    if (e.gap && !(p && p.free)) { const l = S.last[name]; if (l !== undefined && now - l < e.gap) return false; S.last[name] = now; }
    if (!S.voice(e.prio || 1, e.dur || 1)) return false;
    let out = S.bus[e.bus || 'world'].in;
    if (pos) { out = S.route(e.bus || 'world', pos[0], pos[1], pos[2], p && p.zone !== undefined ? p.zone : S.zoneOf(pos[0], pos[1], pos[2]), e.ref, e.max, 1); if (!out) return false; }
    e.fn(S, c, out, now + (p && p.delay || 0.004), (v === undefined ? 1 : v) * (S.trims[name] || 1), p || null);
    return true;
  },
  event(name, pos, v, p) { return this.play(name, pos || null, v, p); },

  // ── helpers the library uses ──
  // a started slice of the stock noise, stopped by the caller
  src(kind, t, dur, rate) { const s = this.c.createBufferSource(), b = this.nz[kind || 'white']; s.buffer = b; if (rate) s.playbackRate.value = rate; s.start(t, Math.random() * (b.duration - dur - 0.1), dur + 0.05); return s; },
  // enveloped filtered noise: o = { d, a, f, f2, q, type, v, kind, hp, rate }
  nb(out, t, o) {
    const c = this.c, d = o.d || 0.1, a = o.a || 0.003, s = this.src(o.kind, t, d + a, o.rate), fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + d); fl.Q.value = o.q || 0.8;
    const v = Math.max(1e-4, o.v === undefined ? 0.5 : o.v); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    s.connect(fl); let last = fl; if (o.hp) { const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = o.hp; fl.connect(h); last = h; }
    last.connect(g); g.connect(out); return g;
  },
  // enveloped oscillator: o = { f, f2, d, a, v, type, det, vib, vibf }
  tn(out, t, o) {
    const c = this.c, d = o.d || 0.2, a = o.a || 0.005, os = c.createOscillator(), g = c.createGain(); os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f, t); if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fd || d)); if (o.det) os.detune.value = o.det;
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vibf || 5.5; lg.gain.value = o.vib; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + a + d + 0.05); }
    const v = Math.max(1e-4, o.v === undefined ? 0.2 : o.v); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    os.connect(g); g.connect(out); os.start(t); os.stop(t + a + d + 0.05); return g;
  },
  // modal resonators: a struck object is a handful of decaying sines. parts: [[ratio, amp, decaySeconds], ...]
  modal(out, t, f0, parts, v, o) {
    const c = this.c, sum = c.createGain(); sum.gain.value = v; sum.connect(out); o = o || {};
    for (let i = 0; i < parts.length; i++) { const p = parts[i], f = f0 * p[0] * (1 + (o.jit || 0) * (Math.random() - 0.5)); if (f > 18000) continue; this.tn(sum, t, { f, d: p[2], a: o.a || 0.0015, v: p[1] }); }
    return sum;
  },
  // Karplus-Strong string, rendered once into a buffer and cached by pitch (lute, harp, plucked voices)
  ks(f, dur, bright) {
    const S = this, key = Math.round(f * 4) + ':' + dur + ':' + bright; S.buf.ks = S.buf.ks || {}; if (S.buf.ks[key]) return S.buf.ks[key];
    const sr = S.sr, n = Math.floor(sr * dur), N = Math.max(2, Math.round(sr / f)), b = S.c.createBuffer(1, n, sr), d = b.getChannelData(0), ring = new Float32Array(N);
    let s = Math.floor(f * 977) + 1; for (let i = 0; i < N; i++) { s = (s * 1664525 + 1013904223) >>> 0; ring[i] = ((s / 4294967296) * 2 - 1) * (0.3 + 0.7 * bright); }
    let lp = 0; for (let i = 1; i < N; i++) { lp += (ring[i] - lp) * (0.35 + 0.6 * bright); ring[i] = lp; }
    const damp = 0.996 - (1 - bright) * 0.004; let idx = 0;
    for (let i = 0; i < n; i++) { const j = (idx + 1) % N, v = (ring[idx] + ring[j]) * 0.5 * damp; d[i] = ring[idx]; ring[idx] = v; idx = j; }
    for (let i = 0; i < 64; i++) d[n - 1 - i] *= i / 64; S.buf.ks[key] = b; return b;
  },
  pluck(out, t, f, v, o) { const c = this.c, s = c.createBufferSource(), g = c.createGain(); o = o || {}; s.buffer = this.ks(f, o.dur || 1.6, o.bright === undefined ? 0.6 : o.bright); g.gain.value = v; s.connect(g); g.connect(out); s.start(t); return g; },
  now() { return this.fakeNow !== undefined ? this.fakeNow : this.c.currentTime; },
  rnd(a, b) { return a + Math.random() * (b - a); },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
};
Snd.inits = [];
Snd.load();

// the main per-frame call. Never throws, never allocates; after repeated failures it switches itself off and the game goes on silently.
Snd.update = function (dt) {
  const S = this, c = S.ctx; if (!c || S.off) return;
  if (c.state !== 'running') { S.running = false; return; }
  S.running = true; S.step(dt);
};
Snd.step = function (dt) {
  const S = this;
  try {
    dt = Math.min(dt, 0.1); S.T += dt; S.frame++; S.dt = dt;
    if (S.fadeIn === undefined) S.fadeIn = 0; S.fadeIn = Math.min(1, S.fadeIn + dt / 1.5);
    if (S.gather) S.gather(dt);
    const G = S.G; S.pausedMul += ((!G.playing ? 0.55 : G.menu ? 0.6 : G.dead ? 0.5 : 1) - S.pausedMul) * Math.min(1, dt * 3);
    // reverb space: crossfade towards the one the listener is in
    const tgt = S.spT; tgt.open = G.space === 'open' ? 1 : 0; tgt.room = G.space === 'room' ? 1 : 0; tgt.hall = G.space === 'hall' ? 1 : 0; tgt.cave = G.space === 'cave' ? 1 : 0;
    const k = Math.min(1, dt / 0.7); for (const n of S.rvList) S.sp[n] += (tgt[n] - S.sp[n]) * k;
    if ((S.frame & 3) === 0) { S.applySends(false); S.busLevels(); }
    for (let i = 0; i < S.ups.length; i++) S.ups[i](S, dt, G);
  } catch (e) { S.err++; if (S.err === 1) { S.errMsg = String(e && e.stack || e); if (typeof console !== 'undefined') console.warn('[Snd]', S.errMsg); } if (S.err > 30) S.off = true; }
};

// ── iOS and friends: unlock on the first touch, resume after the phone was locked, a call, or the tab was hidden ──
if (typeof document !== 'undefined') {
  const wake = () => { if (typeof game !== 'undefined' && !game.ready && !Snd.ctx) return; Snd.start(); };
  for (const ev of ['touchstart', 'touchend', 'pointerup', 'mousedown', 'keydown']) document.addEventListener(ev, wake, { capture: true, passive: true });
  const hide = () => { Snd.hidden = true; Snd.hush(); };
  const show = () => { Snd.hidden = false; Snd.resume(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); else show(); });
  addEventListener('pagehide', hide); addEventListener('pageshow', show); addEventListener('blur', () => { if (document.hidden) hide(); });
}

// ── Settings: a small additive block under the existing Sound and Music sliders (built here so no other file needs to know) ──
Snd.settingsUI = function () {
  if (this.uiDone || typeof document === 'undefined') return; const m = document.getElementById('setMusic'); if (!m || !m.parentNode) return; this.uiDone = true;
  const anchor = m.parentNode, S = this; let after = anchor;
  const row = (label, id, key) => { const l = document.createElement('label'); l.className = 'row'; l.htmlFor = id; const s = document.createElement('span'); s.textContent = label; const i = document.createElement('input'); i.type = 'range'; i.min = 0; i.max = 1; i.step = 0.05; i.id = id; i.value = S.set[key]; i.addEventListener('input', e => { S.set[key] = +e.target.value; S.save(); if (S.ctx) S.busLevels(); }); l.appendChild(s); l.appendChild(i); after.after(l); after = l; };
  row('Ambience', 'setAmb', 'amb'); row('World effects', 'setWorld', 'world'); row('Footsteps', 'setFoot', 'foot'); row('Voices and interface', 'setUi', 'ui');
  const l = document.createElement('label'); l.className = 'row check'; l.htmlFor = 'setMusicOn'; const s = document.createElement('span'); s.textContent = 'Music on'; const i = document.createElement('input'); i.type = 'checkbox'; i.id = 'setMusicOn'; i.checked = S.set.musicOn;
  i.addEventListener('change', e => { S.set.musicOn = e.target.checked; S.save(); if (S.ctx) S.busLevels(); }); l.appendChild(s); l.appendChild(i); after.after(l);
  const l2 = document.createElement('label'); l2.className = 'row check'; l2.htmlFor = 'setVoices'; const s2 = document.createElement('span'); s2.textContent = 'Spoken voices'; const i2 = document.createElement('input'); i2.type = 'checkbox'; i2.id = 'setVoices'; i2.checked = S.set.voices; i2.addEventListener('change', e => { S.set.voices = e.target.checked; S.save(); if (!S.set.voices && S.vox) S.vox.stop(); }); l2.appendChild(s2); l2.appendChild(i2); l.after(l2);
  const l3 = document.createElement('label'); l3.className = 'row'; l3.htmlFor = 'setVoiceVol'; const s3 = document.createElement('span'); s3.textContent = 'Voice volume'; const i3 = document.createElement('input'); i3.type = 'range'; i3.min = 0; i3.max = 1; i3.step = 0.05; i3.id = 'setVoiceVol'; i3.value = S.set.voiceVol; i3.addEventListener('input', e => { S.set.voiceVol = +e.target.value; S.save(); }); l3.appendChild(s3); l3.appendChild(i3); l2.after(l3);
  const l4 = document.createElement('label'); l4.className = 'row check'; l4.htmlFor = 'setSubs'; const s4 = document.createElement('span'); s4.textContent = 'Subtitles while voiced'; const i4 = document.createElement('input'); i4.type = 'checkbox'; i4.id = 'setSubs'; i4.checked = S.set.subs; i4.addEventListener('change', e => { S.set.subs = e.target.checked; S.save(); document.body.classList.toggle('nosubs', !S.set.subs); }); l4.appendChild(s4); l4.appendChild(i4); l3.after(l4);
  // the two older sliders write Audio2.vol / Audio2.musicVol: keep them in step with this block
};
Snd.ups.push(S => { if (!S.uiDone && (S.frame & 31) === 1) S.settingsUI(); });

// ── Audio2: the old name, kept so the rest of the game keeps working; every method now plays a library sound ──
const Audio2 = {
  luteRequest: 0,
  get ctx() { return Snd.ctx; },
  get vol() { return Snd.set.master; }, set vol(v) { Snd.set.master = v; Snd.save(); },
  get musicVol() { return Snd.set.music; }, set musicVol(v) { Snd.set.music = v; Snd.save(); },
  start() { Snd.start(); }, update(dt) { Snd.update(dt); },
  // positionless events from older call sites (a position is added where the caller knows one)
  ui() { Snd.event('ui.click'); }, page() { Snd.event('ui.page'); }, coin() { Snd.event('pickup.coin'); }, pickup(m) { Snd.event('pickup.' + (m || Snd.lastMat || 'generic')); },
  chest() { Snd.event('chest.open'); }, drink() { Snd.event('drink'); }, eat() { Snd.event('eat'); },
  door(vol) { },                                    // doors are heard from their own animation (88c_world.js)
  cluck(vol) { Snd.event('cluck', null, vol); }, clang(vol) { Snd.event('anvil', null, vol); },
  quest(k) { Snd.event(k === 0 ? 'q.begin' : k === 1 ? 'q.update' : 'q.done'); },
  bell(vol) { Snd.event('bell.ring', null, vol); },
  swing(heavy) { Snd.event(heavy ? 'swing.heavy' : 'swing.light'); }, hitFlesh(heavy) { Snd.event(heavy ? 'hit.flesh.heavy' : 'hit.flesh'); },
  clash(vol) { Snd.event(vol > 0.9 ? 'hit.metal' : 'hit.shield', null, 1); }, hurt() { Snd.event('hurt'); },
  hop() { Snd.event('jump'); }, shout(deep) { Snd.event(deep ? 'foe.shout.deep' : 'foe.shout'); }, fall() { Snd.event('player.death'); },
  thud() { Snd.event('land', null, 1, { v: typeof Player !== 'undefined' ? -Player.vel[1] : 7 }); },
  step() { },                                       // footsteps are timed from the player's stride in 88c_world.js
};
