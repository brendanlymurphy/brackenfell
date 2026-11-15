// ───────────────────────── sound: everything is synthesised with Web Audio ─────────────────────────
const Audio2 = {
  ctx: null, vol: 0.8, musicVol: 0.6, luteRequest: 0, t: { bird: 2, cricket: 0, crackle: 0, pad: 1, lute: 0, owl: 20 }, luteStep: 0, chord: 0, hammerK: 0, lastHour: -1,
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const c = this.ctx = new AC(), o = this;
      o.master = c.createGain(); o.master.gain.value = 0;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; o.master.connect(comp); comp.connect(c.destination);
      o.sfx = c.createGain(); o.sfx.connect(o.master); o.music = c.createGain(); o.music.connect(o.master);
      // shared noise + a synthetic hall for the bell and the music
      const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; o.noise = nb;
      const ir = c.createBuffer(2, c.sampleRate * 2.6, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2); }
      o.rev = c.createConvolver(); o.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = 0.55; o.rev.connect(rg); rg.connect(o.master);
      // continuous beds: wind, water, fire, crickets
      const bed = (type, f, q) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(o.sfx); s.start(); return { g, fl }; };
      o.wind = bed('bandpass', 420, 0.5); o.water = bed('bandpass', 1100, 0.7); o.fire = bed('lowpass', 420, 0.6);
      const cr = c.createOscillator(); cr.frequency.value = 4300; const cg = c.createGain(); cg.gain.value = 0; const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 31; const lg = c.createGain(); lg.gain.value = 0; lfo.connect(lg); lg.connect(cg.gain); cr.connect(cg); cg.connect(o.sfx); cr.start(); lfo.start(); o.crick = lg;
    } catch (e) { this.ctx = null; }
  },
  // enveloped oscillator
  tone(f, dur, vol, type, dest, f2, delay, attack) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + (attack || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, vol, type, f, q, dest, delay, f2) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + (delay || 0), s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q || 0.7;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 1.5, dur + 0.05);
  },
  pluck(f, vol, delay, long) { const d = long || 0.9; this.tone(f, d, vol, 'triangle', this.lutebus, null, delay, 0.004); this.tone(f * 2.003, d * 0.5, vol * 0.35, 'sine', this.lutebus, null, delay, 0.003); this.tone(f * 3.01, d * 0.22, vol * 0.18, 'sine', this.lutebus, null, delay, 0.002); },
  step(surface, run) {
    if (!this.ctx) return; const v = run ? 0.16 : 0.10, j = 0.85 + Math.random() * 0.3;
    if (surface === 'wood') { this.burst(0.09, v * 1.3, 'lowpass', 420 * j, 1.2); this.burst(0.03, v * 0.5, 'bandpass', 1900 * j, 2); }
    else if (surface === 'stone') { this.burst(0.05, v * 0.9, 'bandpass', 2300 * j, 1.5); this.burst(0.08, v * 0.7, 'lowpass', 500, 1); }
    else if (surface === 'water') { this.burst(0.22, v * 1.2, 'bandpass', 1400 * j, 0.8, null, 0, 600); }
    else if (surface === 'dirt') { this.burst(0.07, v, 'lowpass', 1300 * j, 0.8); }
    else { this.burst(0.11, v * 0.9, 'bandpass', 3200 * j, 0.6); this.burst(0.06, v * 0.6, 'lowpass', 600, 0.8); }
  },
  thud() { this.burst(0.18, 0.3, 'lowpass', 260, 1); },
  ui() { this.tone(880, 0.06, 0.04, 'triangle'); },
  page() { this.burst(0.16, 0.06, 'highpass', 2500, 0.5); },
  coin() { this.tone(2400, 0.12, 0.05, 'sine'); this.tone(3200, 0.2, 0.04, 'sine', null, null, 0.05); },
  pickup() { this.tone(520, 0.12, 0.07, 'triangle', null, 780); this.tone(1040, 0.18, 0.04, 'sine', null, null, 0.07); },
  chest() { this.burst(0.25, 0.1, 'bandpass', 500, 2, null, 0, 900); this.tone(140, 0.3, 0.08, 'sawtooth', null, 190); },
  drink() { for (let i = 0; i < 3; i++) this.tone(300 + i * 60, 0.09, 0.05, 'sine', null, 200, i * 0.16); },
  door(vol) { if (!this.ctx) return; this.tone(95, 0.42, 0.045 * vol, 'sawtooth', null, 150); this.burst(0.3, 0.02 * vol, 'bandpass', 700, 4, null, 0, 1200); },
  cluck(vol) { this.tone(700, 0.07, 0.06 * vol, 'square', null, 420); this.tone(760, 0.09, 0.05 * vol, 'square', null, 400, 0.12); },
  clang(vol) { if (!this.ctx) return; for (const [f, d] of [[1870, 0.35], [2790, 0.28], [4150, 0.2], [5630, 0.12]]) this.tone(f * (0.99 + Math.random() * 0.02), d, 0.05 * vol, 'sine'); this.burst(0.03, 0.12 * vol, 'highpass', 3000, 0.5); },
  quest(k) { const n = k === 0 ? [293.7, 440, 587.3] : k === 1 ? [440, 587.3] : [293.7, 370, 440, 587.3, 740]; n.forEach((f, i) => { this.tone(f, 1.6, 0.07, 'triangle', this.rev, null, i * 0.13, 0.01); this.tone(f, 0.5, 0.05, 'sine', null, null, i * 0.13); }); },
  bell(vol) { if (!this.ctx) return; const f0 = 196; for (const [m, d, a] of [[0.5, 7, 0.25], [1, 6, 0.5], [1.19, 4.5, 0.3], [1.5, 3.8, 0.25], [2, 3.2, 0.3], [2.51, 2.4, 0.16], [3.01, 1.8, 0.12], [4.1, 1.2, 0.08]]) { this.tone(f0 * m, d, 0.16 * a * vol, 'sine', this.rev, null, 0, 0.004); this.tone(f0 * m, d * 0.7, 0.10 * a * vol, 'sine', null, null, 0, 0.004); } this.burst(0.05, 0.1 * vol, 'bandpass', 2600, 1); },
  // called every frame with the listener's surroundings
  update(dt, st) {
    const c = this.ctx; if (!c || c.state !== 'running') return; const o = this, now = c.currentTime, T = o.t;
    o.master.gain.setTargetAtTime(st.playing ? o.vol : o.vol * 0.5, now, 0.3);
    const out = 1 - st.indoor;
    o.wind.g.gain.setTargetAtTime((0.035 + 0.05 * st.wind + st.height * 0.05) * (0.25 + 0.75 * out), now, 0.6); o.wind.fl.frequency.setTargetAtTime(300 + 300 * st.wind - 120 * st.indoor, now, 0.8);
    o.water.g.gain.setTargetAtTime(0.15 * st.water * (0.3 + 0.7 * out), now, 0.4);
    o.fire.g.gain.setTargetAtTime(0.16 * st.fire, now, 0.3);
    o.crick.gain.setTargetAtTime(0.012 * st.night * out, now, 1);
    T.crackle -= dt; if (st.fire > 0.05 && T.crackle <= 0) { T.crackle = 0.04 + Math.random() * 0.35; o.burst(0.02 + Math.random() * 0.04, 0.12 * st.fire * Math.random(), 'highpass', 1500 + Math.random() * 3000, 0.7); }
    T.bird -= dt; if (T.bird <= 0) { T.bird = 1.5 + Math.random() * 6; if (st.day > 0.4 && out > 0.3) { const f = 2400 + Math.random() * 2600, n = 2 + Math.floor(Math.random() * 5), v = 0.022 * out * (0.4 + Math.random() * 0.6); for (let i = 0; i < n; i++) o.tone(f * (1 + (Math.random() - 0.5) * 0.25), 0.07 + Math.random() * 0.07, v, 'sine', null, f * (0.8 + Math.random() * 0.5), i * (0.09 + Math.random() * 0.05)); } }
    T.owl -= dt; if (T.owl <= 0) { T.owl = 18 + Math.random() * 30; if (st.night > 0.7 && out > 0.5) { o.tone(410, 0.5, 0.03, 'sine', o.rev, 380, 0, 0.08); o.tone(360, 0.8, 0.035, 'sine', o.rev, 330, 0.7, 0.1); } }
    // the smith's hammer, the bell on the hour
    if (st.hammer >= 0) { const k = (st.hammer * 0.9) % 1; if (o.hammerK < 0.66 && k >= 0.66 && st.hammerDist < 60) o.clang(clamp(1.3 - st.hammerDist / 45, 0.05, 1) * (st.indoor ? 0.4 : 1)); o.hammerK = k; }
    const hr = Math.floor(st.hour); if (hr !== o.lastHour) { if (o.lastHour >= 0 && st.bellOn && (hr === 6 || hr === 12 || hr === 18)) o.bell(clamp(1.1 - st.bellDist / 160, 0.15, 0.8)); o.lastHour = hr; }
    // music: a soft drone of slow chords outdoors, and Lark's lute wherever Lark is
    if (!o.lutebus) { o.lutebus = c.createGain(); o.lutelp = c.createBiquadFilter(); o.lutelp.type = 'lowpass'; o.lutebus.connect(o.lutelp); o.lutelp.connect(o.music); const s = c.createGain(); s.gain.value = 0.5; o.lutelp.connect(s); s.connect(o.rev); o.padbus = c.createGain(); o.padbus.connect(o.rev); const pd = c.createGain(); pd.gain.value = 0.35; o.padbus.connect(pd); pd.connect(o.music); }
    o.music.gain.setTargetAtTime(o.musicVol, now, 0.3);
    o.luteRequest = Math.max(0, o.luteRequest - dt);
    const playing = st.lute || o.luteRequest > 0, lv = playing ? clamp(1.25 - st.luteDist / 26, 0, 1) * (st.luteWall ? 0.45 : 1) : 0;
    o.lutebus.gain.setTargetAtTime(lv * 0.9, now, 0.4); o.lutelp.frequency.setTargetAtTime(st.luteWall ? 900 : 5200, now, 0.4);
    T.lute -= dt;
    if (playing && lv > 0.02 && T.lute <= 0) {
      const scale = [146.83, 164.81, 174.61, 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23, 392, 440], mel = [7, 9, 10, 9, 7, 6, 4, 6, 7, 11, 10, 9, 7, 6, 7, -1, 4, 6, 7, 6, 4, 3, 2, 3, 4, 7, 6, 4, 3, 2, 0, -1], bass = [0, 0, 3, 3, 4, 4, 0, 0];
      const i = o.luteStep++ % mel.length, beat = 0.27; T.lute = beat;
      if (mel[i] >= 0) o.pluck(scale[mel[i]], 0.10, 0.02 + Math.random() * 0.012, 1.1);
      if (i % 4 === 0) o.pluck(scale[bass[(i / 4) % 8]] / 2, 0.11, 0.02, 1.6); else if (i % 4 === 2) o.pluck(scale[bass[Math.floor(i / 4) % 8] + 4] / 2, 0.05, 0.02, 0.9);
    }
    T.pad -= dt;
    if (T.pad <= 0) {
      T.pad = 9 + Math.random() * 5; const chords = [[146.83, 220, 349.23], [130.81, 196, 329.63], [116.54, 174.61, 293.66], [174.61, 261.63, 349.23], [146.83, 220, 293.66], [110, 164.81, 261.63]], ch = chords[o.chord++ % chords.length];
      const v = 0.05 * out * (playing && lv > 0.2 ? 0 : 1) * (st.playing ? 1 : 1.4) * (0.6 + 0.4 * st.night);
      if (v > 0.004) ch.forEach((f, k) => { for (const det of [0.997, 1.003]) { const os = c.createOscillator(), g = c.createGain(); os.type = k === 0 ? 'triangle' : 'sine'; os.frequency.value = f * det * (st.night > 0.5 && k === 2 ? 2 : 1); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(v / (k + 1.2), now + 4.5); g.gain.linearRampToValueAtTime(0.0001, now + 13); os.connect(g); g.connect(o.padbus); os.start(now); os.stop(now + 13.2); } });
    }
  },
};
