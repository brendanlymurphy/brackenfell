// ───────────────────────── Snd.lib: synthesised one-shots ─────────────────────────
// Each entry: { bus, prio, dur, gap, ref, max, fn(S, c, out, t, v, p) }. v is a volume multiplier, p optional parameters. Recipes are filtered noise,
// modal resonators (struck wood, metal, glass are a few decaying sines), formant-filtered saws for voices and short Karplus-Strong plucks.
// Peak levels were set from the offline measurements in test/audio.mjs (footsteps and interactions near -12 dB after the master chain).
(() => {
  const L = Snd.lib, def = (name, bus, prio, dur, fn, x) => { L[name] = Object.assign({ bus, prio, dur, fn }, x); }, R = (a, b) => a + Math.random() * (b - a), J = (x, k) => x * (1 + (Math.random() - 0.5) * 2 * (k || 0.12));
  // formant voice: a saw through parallel bandpass filters, with a little breath
  Snd.voc = function (out, t, o) {
    const c = this.c, d = o.d || 0.25, a = o.a || 0.02, os = c.createOscillator(), g = c.createGain(), sum = c.createGain(); os.type = 'sawtooth';
    os.frequency.setValueAtTime(o.f0, t); os.frequency.linearRampToValueAtTime(o.f1 || o.f0, t + d);
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vibf || 5.5; lg.gain.value = o.vib; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + d + a + 0.1); }
    const v = Math.max(1e-4, o.v || 0.2); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setTargetAtTime(0, t + a + d * 0.55, d * 0.22);
    os.connect(g); for (const f of o.form || [[700, 5, 1], [1200, 6, 0.6], [2600, 8, 0.3]]) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f[0] * (o.fs || 1); b.Q.value = f[1]; const fg = c.createGain(); fg.gain.value = f[2]; g.connect(b); b.connect(fg); fg.connect(sum); }
    sum.gain.value = 1; sum.connect(out); os.start(t); os.stop(t + a + d * 2.2 + 0.1);
    if (o.breath) this.nb(out, t, { d: d * 0.9, a, f: 2400, q: 0.5, v: v * o.breath });
  };
  // hinge and floorboard creak: stick-slip friction, a saw with a wandering pitch through a sweeping resonance
  Snd.creakSnd = function (out, t, o) {
    const c = this.c, d = o.d || 0.5, os = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain(), lf = c.createOscillator(), lg = c.createGain(), tr = c.createGain();
    os.type = 'sawtooth'; const f = o.f || 110; os.frequency.setValueAtTime(f * 0.8, t); os.frequency.linearRampToValueAtTime(f * R(1.0, 1.35), t + d * 0.5); os.frequency.linearRampToValueAtTime(f * R(0.9, 1.2), t + d);
    bp.type = 'bandpass'; bp.Q.value = 7; bp.frequency.setValueAtTime(o.fb || 600, t); bp.frequency.linearRampToValueAtTime((o.fb || 600) * R(1.3, 1.9), t + d);
    lf.frequency.value = R(26, 52); lg.gain.value = 0.5; tr.gain.value = 0.5; lf.connect(lg); lg.connect(tr.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.v || 0.1, t + d * 0.15); g.gain.linearRampToValueAtTime(0, t + d);
    os.connect(bp); bp.connect(tr); tr.connect(g); g.connect(out); os.start(t); lf.start(t); os.stop(t + d + 0.05); lf.stop(t + d + 0.05);
  };
  // a wet send for stingers and bells that should bloom in the hall whatever room the player stands in
  Snd.wet = function (out, k, lvl) { const g = this.c.createGain(); g.gain.value = lvl; out.connect(g); g.connect(this.rin[k || 'hall']); };

  // ───────── footsteps ─────────
  // p.w is stride weight (0.7 creeping .. 1.4 sprint); all are two-part: heel, then toe/sole a few hundredths later
  const fs = (name, fn, x) => def(name, 'foot', 1, 0.5, (S, c, out, t, v, p) => { const w = (p && p.w) || 1; fn(S, c, out, t, v * (0.6 + 0.45 * w), w); S.nb(out, t, { f: 2800, q: 0.4, a: 0.02, d: 0.13, v: 0.05 * v * w }); }, Object.assign({ gap: 0.12 }, x));
  fs('fs.cobble', (S, c, o, t, v, w) => { const j = R(0.88, 1.12);
    S.nb(o, t, { f: 2300 * j, q: 1.6, d: 0.035, v: 0.5 * v }); S.modal(o, t, 1050 * j, [[1, 0.3, 0.05], [1.9, 0.2, 0.035], [3.1, 0.1, 0.025]], 0.55 * v); S.nb(o, t, { type: 'lowpass', f: 170, d: 0.09, v: 0.7 * v });
    S.nb(o, t + 0.06, { f: 1900 * j, q: 1.2, d: 0.025, v: 0.25 * v }); });
  fs('fs.dirt', (S, c, o, t, v, w) => { const j = R(0.85, 1.15);
    S.nb(o, t, { type: 'lowpass', f: 1100 * j, q: 0.7, d: 0.085, v: 0.65 * v }); S.nb(o, t, { type: 'highpass', f: 3500, d: 0.03, v: 0.2 * v }); S.nb(o, t, { type: 'lowpass', f: 200, d: 0.07, v: 0.6 * v }); S.nb(o, t + 0.05, { type: 'lowpass', f: 1500 * j, d: 0.05, v: 0.25 * v }); });
  fs('fs.grass', (S, c, o, t, v, w) => { const j = R(0.85, 1.15);
    S.nb(o, t, { f: 3200 * j, q: 0.5, a: 0.012, d: 0.12, v: 0.32 * v }); S.nb(o, t, { type: 'lowpass', f: 420, d: 0.07, v: 0.6 * v }); if (Math.random() < 0.5) S.nb(o, t + 0.03, { type: 'highpass', f: 6000, d: 0.02, v: 0.1 * v }); });
  fs('fs.mud', (S, c, o, t, v, w) => { const j = R(0.85, 1.15);
    S.nb(o, t, { type: 'lowpass', f: 380 * j, d: 0.13, v: 0.9 * v }); S.nb(o, t, { f: 260, f2: 800, q: 3, a: 0.01, d: 0.08, v: 0.3 * v }); S.nb(o, t + 0.13, { f: 900, f2: 300, q: 2.5, a: 0.01, d: 0.1, v: 0.2 * v }); });
  fs('fs.water', (S, c, o, t, v, w) => { const j = R(0.85, 1.15), deep = 0;
    S.nb(o, t, { f: 1600 * j, f2: 700, q: 0.7, a: 0.01, d: 0.24, v: 0.5 * v }); S.nb(o, t, { type: 'lowpass', f: 260, d: 0.12, v: 0.6 * v });
    for (let i = 0; i < 2; i++) S.tn(o, t + 0.03 + i * R(0.03, 0.07), { f: R(600, 1000), f2: R(1500, 2200), d: 0.035, a: 0.004, v: 0.07 * v }); });
  fs('fs.wood', (S, c, o, t, v, w) => { const j = R(0.9, 1.1);
    S.modal(o, t, 140 * j, [[1, 0.5, 0.13], [1.9, 0.3, 0.08], [3.2, 0.16, 0.05]], 0.9 * v); S.nb(o, t, { f: 900, q: 1, d: 0.03, v: 0.35 * v }); S.nb(o, t, { type: 'lowpass', f: 320, d: 0.07, v: 0.4 * v }); });
  fs('fs.plank', (S, c, o, t, v, w) => { const j = R(0.9, 1.1);
    S.modal(o, t, 190 * j, [[1, 0.4, 0.07], [2.3, 0.2, 0.04], [3.7, 0.1, 0.03]], 0.7 * v); S.nb(o, t, { f: 1200, q: 1, d: 0.025, v: 0.3 * v }); S.nb(o, t, { type: 'lowpass', f: 260, d: 0.06, v: 0.4 * v });
    if (Math.random() < 0.09) S.creakSnd(o, t + 0.02, { d: R(0.2, 0.4), f: 140, fb: 500, v: 0.05 * v }); });
  fs('fs.stone', (S, c, o, t, v, w) => { const j = R(0.9, 1.1);
    S.nb(o, t, { f: 2600 * j, q: 2, d: 0.03, v: 0.5 * v }); S.modal(o, t, 1300 * j, [[1, 0.25, 0.08], [2.2, 0.15, 0.05]], 0.5 * v); S.nb(o, t, { type: 'lowpass', f: 200, d: 0.1, v: 0.6 * v }); S.nb(o, t + 0.055, { f: 2000, q: 1.5, d: 0.025, v: 0.2 * v }); });
  fs('fs.stairs', (S, c, o, t, v, w) => { const j = R(0.9, 1.1);
    S.modal(o, t, 150 * j, [[1, 0.55, 0.11], [2.1, 0.3, 0.07], [3.5, 0.15, 0.04]], 1.0 * v); S.nb(o, t, { f: 800, q: 1, d: 0.03, v: 0.3 * v }); S.nb(o, t, { type: 'lowpass', f: 240, d: 0.07, v: 0.5 * v }); });
  // villagers use the same recipes quieter, through the world bus and a spatial route (see 88c_world.js)
  def('rustle', 'foot', 0, 0.3, (S, c, o, t, v) => { S.nb(o, t, { f: 2800, q: 0.4, a: 0.03, d: 0.16, v: 0.12 * v, hp: 1200 }); }, { gap: 0.25 });

  // ───────── body ─────────
  def('land', 'foot', 2, 0.5, (S, c, o, t, v, p) => { const h = Math.min(1, ((p && p.v) || 6) / 12);
    S.nb(o, t, { type: 'lowpass', f: 130, q: 0.7, d: 0.16 + 0.1 * h, v: (0.35 + 0.7 * h) * v }); S.nb(o, t, { type: 'lowpass', f: 700, d: 0.1, v: 0.35 * v * (0.4 + h) }); S.nb(o, t, { f: 3000, q: 0.5, a: 0.02, d: 0.12, v: 0.15 * v * (0.4 + h) });
    if (h > 0.55) S.voc(o, t + 0.01, { f0: 150, f1: 95, d: 0.18, v: 0.3 * v * h, form: [[500, 5, 1], [900, 6, 0.5], [2400, 8, 0.2]], breath: 0.3 }); });
  def('jump', 'foot', 1, 0.3, (S, c, o, t, v) => { S.voc(o, t, { f0: 150, f1: 185, d: 0.12, a: 0.015, v: 0.14 * v, form: [[600, 5, 1], [1000, 6, 0.5], [2500, 8, 0.2]], breath: 0.4 }); S.nb(o, t, { f: 2800, q: 0.4, a: 0.03, d: 0.14, v: 0.1 * v, hp: 1200 }); }, { gap: 0.2 });
  def('breath', 'ui', 0, 1.2, (S, c, o, t, v, p) => { const lo = (p && p.lo) || 0.5;       // a gasp in, a push out; louder the more tired
    S.nb(o, t, { f: 1100, f2: 1700, q: 0.7, a: 0.16, d: 0.3, v: (0.12 + 0.2 * lo) * v }); S.nb(o, t + 0.45, { f: 1500, f2: 800, q: 0.8, a: 0.05, d: 0.5, v: (0.1 + 0.16 * lo) * v }); }, { gap: 0.9 });
  def('hurt', 'ui', 2, 0.6, (S, c, o, t, v) => { S.voc(o, t, { f0: 200, f1: 118, d: 0.28, a: 0.01, v: 0.3 * v, form: [[800, 5, 1], [1150, 6, 0.6], [2900, 8, 0.25]], breath: 0.3 }); S.nb(o, t, { type: 'lowpass', f: 330, d: 0.2, v: 0.55 * v }); S.nb(o, t, { f: 2500, q: 0.5, a: 0.02, d: 0.1, v: 0.1 * v }); }, { gap: 0.15 });
  def('player.death', 'ui', 2, 2.2, (S, c, o, t, v) => { S.voc(o, t, { f0: 190, f1: 70, d: 0.9, a: 0.02, v: 0.3 * v, form: [[700, 5, 1], [1100, 6, 0.5], [2700, 8, 0.2]], breath: 0.4 }); S.nb(o, t + 0.5, { type: 'lowpass', f: 120, d: 0.5, v: 0.9 * v }); S.nb(o, t + 0.5, { type: 'lowpass', f: 600, d: 0.4, v: 0.4 * v }); S.nb(o, t + 0.55, { f: 3000, q: 0.5, d: 0.3, v: 0.12 * v }); });
  def('heart', 'ui', 1, 0.7, (S, c, o, t, v) => { S.tn(o, t, { f: 62, f2: 42, d: 0.14, a: 0.008, v: 0.65 * v }); S.tn(o, t + 0.21, { f: 52, f2: 38, d: 0.13, a: 0.008, v: 0.45 * v }); }, { gap: 0.4 });

  // ───────── doors, chests, things picked up ─────────
  const latch = (S, o, t, v) => { S.nb(o, t, { f: 2400, q: 3, d: 0.012, v: 0.3 * v }); S.modal(o, t, 950, [[1, 0.2, 0.05], [2.6, 0.12, 0.03]], 0.3 * v); };
  def('door.open', 'world', 1, 1.2, (S, c, o, t, v) => { latch(S, o, t, v); S.creakSnd(o, t + 0.04, { d: R(0.45, 0.7), f: R(95, 125), fb: R(500, 700), v: 0.28 * v }); S.nb(o, t + 0.1, { f: 300, q: 0.5, a: 0.2, d: 0.4, v: 0.05 * v }); S.nb(o, t + 0.55, { type: 'lowpass', f: 150, d: 0.12, v: 0.25 * v }); }, { ref: 3, max: 45, gap: 0.2 });
  def('door.close', 'world', 1, 1.0, (S, c, o, t, v) => { S.nb(o, t, { f: 400, f2: 200, q: 0.5, a: 0.12, d: 0.3, v: 0.08 * v }); S.modal(o, t + 0.32, 110, [[1, 0.8, 0.16], [2.1, 0.35, 0.08], [3.4, 0.15, 0.05]], 0.9 * v); S.nb(o, t + 0.32, { type: 'lowpass', f: 420, d: 0.1, v: 0.6 * v }); latch(S, o, t + 0.36, v * 0.8); }, { ref: 3, max: 45, gap: 0.2 });
  def('door.locked', 'world', 1, 0.8, (S, c, o, t, v) => { for (let i = 0; i < 3; i++) { S.nb(o, t + i * 0.075, { f: 1800, q: 4, d: 0.02, v: 0.35 * v }); S.modal(o, t + i * 0.075, 800 + i * 90, [[1, 0.25, 0.06], [2.7, 0.15, 0.04]], 0.35 * v); } S.modal(o, t, 130, [[1, 0.5, 0.09]], 0.4 * v); S.creakSnd(o, t + 0.2, { d: 0.18, f: 150, fb: 800, v: 0.07 * v }); }, { ref: 3, max: 30 });
  def('chest.open', 'world', 1, 1.4, (S, c, o, t, v) => { latch(S, o, t, v); S.creakSnd(o, t + 0.05, { d: 0.6, f: 100, fb: 450, v: 0.28 * v }); S.modal(o, t + 0.62, 160, [[1, 0.5, 0.14], [2.3, 0.3, 0.07]], 0.6 * v); S.nb(o, t + 0.64, { f: 1500, q: 1, d: 0.05, v: 0.18 * v });
    for (let i = 0; i < 3; i++) S.modal(o, t + 0.7 + i * 0.07, R(2300, 3000), [[1, 0.2, 0.15], [2.4, 0.12, 0.08]], 0.18 * v); }, { ref: 3, max: 30 });
  def('pickup.coin', 'ui', 1, 0.7, (S, c, o, t, v) => { for (let i = 0; i < 2; i++) S.modal(o, t + i * 0.055, R(2400, 3000), [[1, 0.4, 0.22], [2.4, 0.22, 0.12], [4.1, 0.1, 0.07]], 0.5 * v); S.nb(o, t, { f: 5000, q: 1, d: 0.02, v: 0.1 * v }); });
  def('coins', 'ui', 1, 1.0, (S, c, o, t, v) => { for (let i = 0; i < 5; i++) S.modal(o, t + i * R(0.04, 0.08), R(2200, 3200), [[1, 0.3, 0.2], [2.4, 0.18, 0.1]], 0.4 * v); });
  def('pickup.cloth', 'ui', 1, 0.4, (S, c, o, t, v) => { S.nb(o, t, { f: 2200, q: 0.3, a: 0.035, d: 0.2, v: 0.3 * v, hp: 900 }); S.nb(o, t, { type: 'lowpass', f: 300, d: 0.08, v: 0.2 * v }); });
  def('pickup.metal', 'ui', 1, 0.6, (S, c, o, t, v) => { S.modal(o, t, R(1700, 2300), [[1, 0.3, 0.3], [2.76, 0.2, 0.18], [5.4, 0.1, 0.08]], 0.5 * v); S.nb(o, t, { f: 4500, q: 1, d: 0.03, v: 0.15 * v }); S.nb(o, t + 0.05, { f: 2500, q: 1, a: 0.02, d: 0.1, v: 0.1 * v }); });
  def('pickup.herb', 'ui', 1, 0.5, (S, c, o, t, v) => { S.nb(o, t, { type: 'highpass', f: 3000, a: 0.02, d: 0.1, v: 0.16 * v }); S.nb(o, t + 0.09, { f: 2600, q: 0.5, a: 0.02, d: 0.12, v: 0.18 * v }); S.nb(o, t, { type: 'lowpass', f: 400, d: 0.06, v: 0.2 * v }); });
  def('pickup.wood', 'ui', 1, 0.4, (S, c, o, t, v) => { S.modal(o, t, R(380, 460), [[1, 0.6, 0.08], [2.4, 0.3, 0.05], [4.1, 0.1, 0.03]], 0.7 * v); S.nb(o, t, { f: 1500, q: 1, d: 0.025, v: 0.2 * v }); });
  def('pickup.food', 'ui', 1, 0.4, (S, c, o, t, v) => { S.nb(o, t, { type: 'lowpass', f: 300, d: 0.09, v: 0.45 * v }); S.nb(o, t + 0.02, { f: 2000, q: 0.4, a: 0.03, d: 0.14, v: 0.15 * v, hp: 1000 }); });
  def('pickup.paper', 'ui', 1, 0.5, (S, c, o, t, v) => { S.nb(o, t, { f: 2500, q: 0.5, a: 0.03, d: 0.22, v: 0.3 * v }); S.nb(o, t + 0.1, { type: 'highpass', f: 4500, d: 0.06, v: 0.1 * v }); });
  def('pickup.generic', 'ui', 1, 0.5, (S, c, o, t, v) => { S.nb(o, t, { f: 2400, q: 0.4, a: 0.025, d: 0.15, v: 0.25 * v, hp: 1000 }); S.modal(o, t + 0.02, 600, [[1, 0.4, 0.07], [2.3, 0.2, 0.04]], 0.4 * v); });
  def('ui.click', 'ui', 1, 0.2, (S, c, o, t, v) => { S.modal(o, t, 760, [[1, 0.4, 0.05], [2.8, 0.2, 0.03]], 0.5 * v); S.nb(o, t, { f: 3200, q: 1, d: 0.012, v: 0.18 * v }); }, { gap: 0.04 });
  def('ui.page', 'ui', 1, 0.5, (S, c, o, t, v) => { S.nb(o, t, { f: 2500, q: 0.5, a: 0.035, d: 0.24, v: 0.32 * v }); S.nb(o, t + 0.12, { type: 'highpass', f: 4000, d: 0.07, v: 0.1 * v }); S.nb(o, t, { type: 'lowpass', f: 400, a: 0.05, d: 0.1, v: 0.1 * v }); }, { gap: 0.1 });
  def('eat', 'ui', 1, 0.8, (S, c, o, t, v) => { for (let i = 0; i < 3; i++) { S.nb(o, t + i * 0.17, { f: R(1500, 2400), q: 2, d: 0.045, v: 0.4 * v }); S.nb(o, t + i * 0.17, { type: 'lowpass', f: 400, d: 0.05, v: 0.3 * v }); } });
  def('drink', 'ui', 1, 1.2, (S, c, o, t, v) => { for (let i = 0; i < 3; i++) { S.tn(o, t + i * 0.2, { f: 260, f2: 150, d: 0.13, a: 0.02, v: 0.25 * v }); S.nb(o, t + i * 0.2, { f: 700, f2: 400, q: 1.5, a: 0.02, d: 0.12, v: 0.2 * v }); }
    S.modal(o, t + 0.8, 520, [[1, 0.5, 0.1], [2.3, 0.3, 0.06]], 0.45 * v); S.nb(o, t + 0.82, { f: 1400, q: 1, d: 0.03, v: 0.15 * v }); });
  def('mug', 'world', 0, 0.6, (S, c, o, t, v) => { S.modal(o, t, R(1300, 1700), [[1, 0.35, 0.2], [2.3, 0.25, 0.1], [4.4, 0.1, 0.05]], 0.5 * v); S.nb(o, t, { f: 3500, q: 1, d: 0.02, v: 0.15 * v }); }, { ref: 3, max: 25, gap: 0.5 });
  def('cloth.flap', 'world', 0, 0.5, (S, c, o, t, v) => { let tt = t; for (let i = 0; i < 4; i++) { S.nb(o, tt, { f: R(1400, 2200), q: 1, d: 0.05, v: 0.3 * v }); tt += R(0.05, 0.11); } }, { ref: 3, max: 40, gap: 0.3 });

  // ───────── stingers ─────────
  const bell = (S, o, t, f, v, dec) => S.tn(o, t, { f, d: dec || 1.6, a: 0.006, v: 0.2 * v }) && S.tn(o, t, { f: f * 2.76, d: (dec || 1.6) * 0.3, a: 0.003, v: 0.05 * v });
  def('q.begin', 'ui', 2, 3.5, (S, c, o, t, v) => { for (const [f, d] of [[293.7, 0], [440, 0.14], [587.3, 0.28]]) { S.pluck(o, t + d, f, 0.4 * v, { dur: 2, bright: 0.7 }); bell(S, o, t + d, f * 2, v * 0.8, 1.4); } S.wet(o, 'hall', 0.5); });
  def('q.update', 'ui', 2, 2.5, (S, c, o, t, v) => { for (const [f, d] of [[440, 0], [587.3, 0.13]]) { S.pluck(o, t + d, f, 0.35 * v, { dur: 1.6, bright: 0.65 }); bell(S, o, t + d, f * 2, v * 0.6, 1.1); } S.wet(o, 'hall', 0.45); });
  def('q.done', 'ui', 2, 4.5, (S, c, o, t, v) => { [293.7, 370, 440, 587.3, 740].forEach((f, i) => { S.pluck(o, t + i * 0.13, f, 0.35 * v, { dur: 2.4, bright: 0.7 }); bell(S, o, t + i * 0.13, f * 2, v * 0.7, 1.8); }); S.tn(o, t + 0.5, { f: 146.8, d: 3, a: 0.4, v: 0.14 * v, type: 'triangle' }); S.wet(o, 'hall', 0.6); });
  def('discover', 'ui', 2, 5, (S, c, o, t, v) => { S.tn(o, t, { f: 110, d: 3.8, a: 1.0, v: 0.13 * v, type: 'triangle' }); S.tn(o, t, { f: 165, d: 3.6, a: 1.1, v: 0.08 * v }); [[587.3, 0.3], [740, 0.75], [880, 1.2]].forEach(([f, d]) => { S.pluck(o, t + d, f, 0.28 * v, { dur: 2.6, bright: 0.5 }); bell(S, o, t + d, f * 2, v * 0.5, 2); }); S.wet(o, 'hall', 0.7); });
  // a church bell stroke: a low hum, the strike tone, and the inharmonic partials a cast bell really has
  def('bell.stroke', 'world', 2, 9, (S, c, o, t, v, p) => { const f0 = 196; for (const [m, d, a] of [[0.5, 7, 0.25], [1, 6, 0.5], [1.19, 4.5, 0.3], [1.5, 3.8, 0.25], [2, 3.2, 0.3], [2.51, 2.4, 0.16], [3.01, 1.8, 0.12], [4.1, 1.2, 0.08]]) S.tn(o, t, { f: f0 * m * (1 + R(-0.002, 0.002)), d, a: 0.004, v: 0.17 * a * v });
    S.nb(o, t, { f: 2600, q: 1, d: 0.05, v: 0.12 * v }); S.wet(o, 'hall', 0.35); }, { ref: 18, max: 420 });
  L['bell.ring'] = Object.assign({}, L['bell.stroke'], { bus: 'ui' });

  // ───────── combat ─────────
  def('swing.light', 'ui', 1, 0.4, (S, c, o, t, v) => { S.nb(o, t, { f: 700, f2: 2100, q: 1.2, a: 0.06, d: 0.17, v: 0.3 * v }); }, { gap: 0.08 });
  def('swing.heavy', 'ui', 1, 0.5, (S, c, o, t, v) => { S.nb(o, t, { f: 450, f2: 1500, q: 1.1, a: 0.1, d: 0.26, v: 0.4 * v }); S.nb(o, t, { type: 'lowpass', f: 320, a: 0.1, d: 0.25, v: 0.18 * v }); }, { gap: 0.08 });
  const flesh = (S, o, t, v, h) => { S.tn(o, t, { f: h ? 70 : 95, f2: 45, d: 0.16, a: 0.004, v: (h ? 0.6 : 0.45) * v }); S.nb(o, t, { type: 'lowpass', f: 520, d: 0.11, v: (h ? 0.6 : 0.45) * v }); S.nb(o, t, { f: 1200, q: 1, d: 0.04, v: 0.28 * v }); if (h) S.nb(o, t + 0.02, { f: 2200, q: 2, d: 0.03, v: 0.2 * v }); };
  def('hit.flesh', 'world', 2, 0.5, (S, c, o, t, v) => flesh(S, o, t, v, false), { ref: 4, max: 50, gap: 0.05 });
  def('hit.flesh.heavy', 'world', 2, 0.5, (S, c, o, t, v) => flesh(S, o, t, v, true), { ref: 4, max: 50, gap: 0.05 });
  def('hit.wood', 'world', 2, 0.5, (S, c, o, t, v) => { S.modal(o, t, R(280, 340), [[1, 0.5, 0.1], [2.3, 0.3, 0.06], [3.9, 0.2, 0.035]], 0.8 * v); S.nb(o, t, { f: 1500, q: 1, d: 0.03, v: 0.3 * v }); }, { ref: 4, max: 50, gap: 0.05 });
  def('hit.metal', 'world', 2, 1.4, (S, c, o, t, v) => { const j = R(0.97, 1.03); S.modal(o, t, 1870 * j, [[1, 0.3, 0.55], [1.49, 0.22, 0.4], [2.22, 0.2, 0.3], [3.0, 0.12, 0.2], [4.1, 0.07, 0.12]], 0.7 * v); S.nb(o, t, { type: 'highpass', f: 3000, d: 0.04, v: 0.35 * v }); S.nb(o, t, { f: 900, q: 1, d: 0.03, v: 0.2 * v }); }, { ref: 4, max: 60, gap: 0.05 });
  def('hit.shield', 'world', 2, 1.0, (S, c, o, t, v) => { S.modal(o, t, 520, [[1, 0.5, 0.14], [2.1, 0.3, 0.08], [3.2, 0.15, 0.05]], 0.75 * v); S.modal(o, t, 2200 * R(0.97, 1.03), [[1, 0.2, 0.3], [2.4, 0.1, 0.15]], 0.5 * v); S.nb(o, t, { f: 2500, q: 1, d: 0.03, v: 0.3 * v }); S.nb(o, t, { type: 'lowpass', f: 200, d: 0.08, v: 0.4 * v }); }, { ref: 4, max: 60, gap: 0.05 });
  def('foe.effort', 'world', 1, 0.4, (S, c, o, t, v) => { S.voc(o, t, { f0: R(100, 115), f1: 80, d: 0.17, a: 0.015, v: 0.32 * v, form: [[570, 5, 1], [840, 6, 0.6], [2410, 8, 0.2]], breath: 0.35 }); }, { ref: 4, max: 45, gap: 0.3 });
  def('foe.hurt', 'world', 1, 0.5, (S, c, o, t, v) => { S.voc(o, t, { f0: R(150, 175), f1: 100, d: 0.24, a: 0.01, v: 0.36 * v, form: [[640, 5, 1], [1000, 6, 0.6], [2500, 8, 0.2]], breath: 0.3 }); }, { ref: 4, max: 45, gap: 0.2 });
  def('foe.shout', 'world', 2, 0.8, (S, c, o, t, v) => { S.voc(o, t, { f0: 165, f1: 128, d: 0.34, a: 0.03, v: 0.3 * v, vib: 6, form: [[700, 5, 1], [1100, 6, 0.6], [2600, 8, 0.25]], breath: 0.4 }); }, { ref: 6, max: 80, gap: 0.5 });
  def('foe.shout.deep', 'world', 2, 0.8, (S, c, o, t, v) => { S.voc(o, t, { f0: 120, f1: 92, d: 0.4, a: 0.03, v: 0.34 * v, vib: 5, form: [[600, 5, 1], [900, 6, 0.6], [2400, 8, 0.25]], breath: 0.4 }); }, { ref: 6, max: 80, gap: 0.5 });
  def('foe.death', 'world', 2, 1.8, (S, c, o, t, v) => { S.voc(o, t, { f0: 150, f1: 60, d: 0.7, a: 0.02, v: 0.34 * v, form: [[640, 5, 1], [1000, 6, 0.6], [2500, 8, 0.2]], breath: 0.4 }); S.nb(o, t + 0.55, { type: 'lowpass', f: 140, d: 0.4, v: 0.7 * v }); S.nb(o, t + 0.55, { type: 'lowpass', f: 700, d: 0.3, v: 0.3 * v }); }, { ref: 5, max: 70 });

  // ───────── places ─────────
  def('anvil', 'world', 1, 2.0, (S, c, o, t, v) => { const j = R(0.985, 1.015); S.modal(o, t, 1870 * j, [[1, 0.3, 0.9], [1.49, 0.2, 0.6], [2.22, 0.22, 0.45], [3.0, 0.12, 0.3], [4.16, 0.08, 0.2]], 0.55 * v); S.nb(o, t, { type: 'highpass', f: 3000, d: 0.025, v: 0.32 * v }); S.nb(o, t, { f: 700, q: 1, d: 0.03, v: 0.25 * v }); S.tn(o, t, { f: 120, f2: 80, d: 0.08, v: 0.3 * v }); }, { ref: 8, max: 120, gap: 0.2 });
  def('bellows', 'world', 0, 2.0, (S, c, o, t, v) => { S.nb(o, t, { f: 500, f2: 1100, q: 0.5, a: 0.3, d: 0.35, v: 0.2 * v }); S.nb(o, t + 0.65, { f: 900, f2: 350, q: 0.6, a: 0.08, d: 0.7, v: 0.3 * v }); S.nb(o, t + 0.65, { type: 'lowpass', f: 250, a: 0.1, d: 0.7, v: 0.3 * v }); }, { ref: 5, max: 60, gap: 1.2 });
  def('quench', 'world', 0, 2.0, (S, c, o, t, v) => { S.nb(o, t, { type: 'highpass', f: 3500, a: 0.04, d: 1.3, v: 0.2 * v }); S.nb(o, t, { f: 1500, q: 0.5, a: 0.05, d: 0.9, v: 0.1 * v }); }, { ref: 5, max: 60, gap: 5 });
  def('paddle', 'world', 0, 1.0, (S, c, o, t, v) => { S.nb(o, t, { f: 800, f2: 300, q: 0.6, a: 0.03, d: 0.5, v: 0.3 * v }); S.tn(o, t, { f: 90, f2: 60, d: 0.25, a: 0.02, v: 0.25 * v, type: 'triangle' }); for (let i = 0; i < 3; i++) S.tn(o, t + R(0.1, 0.5), { f: R(900, 1500), f2: R(1800, 2600), d: 0.03, v: 0.05 * v }); }, { ref: 8, max: 60, gap: 0.3 });
  def('drip', 'world', 0, 0.5, (S, c, o, t, v) => { S.tn(o, t, { f: R(900, 1500), f2: R(2200, 3200), d: 0.05, fd: 0.03, a: 0.002, v: 0.25 * v }); S.nb(o, t, { f: 3000, q: 1.5, d: 0.012, v: 0.06 * v }); }, { ref: 3, max: 35, gap: 0.8 });
  def('creak', 'world', 0, 1.0, (S, c, o, t, v) => { S.creakSnd(o, t, { d: R(0.35, 0.8), f: R(80, 130), fb: R(500, 900), v: 0.16 * v }); }, { ref: 3, max: 30, gap: 1.2 });
  def('cluck', 'world', 0, 0.5, (S, c, o, t, v) => { S.voc(o, t, { f0: 720, f1: 430, d: 0.07, a: 0.008, v: 0.2 * v, form: [[1000, 6, 1], [2200, 8, 0.4]] }); S.voc(o, t + 0.12, { f0: 770, f1: 420, d: 0.09, a: 0.008, v: 0.17 * v, form: [[1000, 6, 1], [2200, 8, 0.4]] }); }, { ref: 3, max: 25, gap: 0.3 });
  def('dog', 'world', 0, 2.5, (S, c, o, t, v) => { const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const tt = t + i * R(0.22, 0.3); S.voc(o, tt, { f0: R(480, 560), f1: 300, d: 0.13, a: 0.008, v: 0.45 * v, form: [[650, 6, 1], [1500, 7, 0.7], [2800, 8, 0.2]], breath: 0.5 }); } }, { ref: 10, max: 180, gap: 20 });
  def('cow', 'world', 0, 3, (S, c, o, t, v) => { S.voc(o, t, { f0: 98, f1: 92, d: 1.3, a: 0.25, v: 0.5 * v, vib: 2.5, vibf: 6, form: [[450, 5, 1], [900, 6, 0.8], [1800, 8, 0.2]], breath: 0.1 }); }, { ref: 12, max: 200, gap: 30 });
  def('rooster', 'world', 0, 3, (S, c, o, t, v) => { const form = [[900, 7, 1], [2100, 8, 0.7], [3200, 8, 0.3]]; [[0, 650, 820, 0.14], [0.2, 800, 980, 0.12], [0.36, 740, 1100, 0.14], [0.55, 980, 820, 0.9]].forEach(([d, a, b, du]) => S.voc(o, t + d, { f0: a, f1: b, d: du, a: 0.012, v: 0.4 * v, vib: du > 0.5 ? 25 : 0, vibf: 9, form, breath: 0.3 })); }, { ref: 12, max: 200, gap: 40 });
  def('owl', 'world', 0, 3, (S, c, o, t, v) => { S.tn(o, t, { f: 410, f2: 385, d: 0.5, a: 0.07, v: 0.4 * v, vib: 6, vibf: 4 }); S.tn(o, t + 0.8, { f: 370, f2: 330, d: 0.25, a: 0.05, v: 0.35 * v }); S.tn(o, t + 1.15, { f: 370, f2: 310, d: 0.9, a: 0.08, v: 0.4 * v, vib: 6, vibf: 4 }); S.nb(o, t, { f: 600, q: 1, a: 0.1, d: 1.9, v: 0.02 * v }); }, { ref: 15, max: 220, gap: 20 });

  // ───────── birdsong: one oscillator and one gain per call, each note a pitch glide and an amplitude puff ─────────
  const song = (S, o, t, notes, v, wob) => {
    const c = S.c, os = c.createOscillator(), g = c.createGain(); os.type = 'sine'; let end = t;
    if (wob) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = wob[0]; lg.gain.value = wob[1]; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + 4); }
    g.gain.setValueAtTime(0, t); os.frequency.setValueAtTime(notes[0][1], t);
    for (const n of notes) { const t0 = t + n[0], d = n[3]; os.frequency.setValueAtTime(n[1], t0); os.frequency.linearRampToValueAtTime(n[2], t0 + d); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime((n[4] || 1) * v, t0 + d * 0.25); g.gain.linearRampToValueAtTime(0.0001, t0 + d); if (t0 + d > end) end = t0 + d; }
    os.connect(g); g.connect(S._birdOut); os.start(t); os.stop(end + 0.05); return end - t;
  };
  const bird = (name, dur, mk, x) => def(name, 'amb', 1, dur, (S, c, o, t, v) => { S._birdOut = o; const n = mk(); song(S, o, t, n.notes, 0.22 * v, n.wob); }, Object.assign({ ref: 6, max: 140 }, x));
  bird('bird.chaffinch', 2.2, () => { const n = [], f = R(3600, 4600); let t = 0; for (let i = 0; i < 9; i++) { n.push([t, f * (1 - i * 0.03), f * (0.86 - i * 0.03), 0.055, 1 - i * 0.04]); t += 0.085; } n.push([t + 0.05, f * 0.7, f * 1.05, 0.09, 1], [t + 0.17, f * 1.0, f * 0.8, 0.1, 0.8]); return { notes: n }; });
  bird('bird.robin', 3.0, () => { const n = []; let t = 0; for (let i = 0; i < 7 + Math.floor(Math.random() * 4); i++) { const f = R(2800, 5600), d = R(0.05, 0.13); n.push([t, f, f * R(0.7, 1.35), d, R(0.5, 1)]); t += d + R(0.02, 0.12); } return { notes: n, wob: [38, 160] }; });
  bird('bird.wren', 1.6, () => { const n = []; let t = 0, f = R(4300, 5400); for (let i = 0; i < 22; i++) { n.push([t, f, f * R(0.9, 1.1), 0.028, 1 - i * 0.012]); t += 0.04; if (i === 14) f *= 0.82; } return { notes: n }; });
  bird('bird.thrush', 4.0, () => { const n = []; let t = 0; for (let k = 0; k < 3 + Math.floor(Math.random() * 3); k++) { const f = R(1700, 2700), d = R(0.12, 0.22); n.push([t, f, f * R(0.8, 1.25), d, 1], [t + d + 0.02, f * 1.1, f * 0.9, d * 0.6, 0.7]); t += d * 1.8 + R(0.15, 0.45); } return { notes: n, wob: [6, 20] }; });
  bird('bird.pigeon', 3.0, () => { const f = R(430, 520), n = [], d = [0, 0.38, 0.9, 1.5, 1.85]; d.forEach((t, i) => n.push([t, f, f * 0.93, i === 1 || i === 3 ? 0.4 : 0.22, 1])); return { notes: n, wob: [3, 12] }; }, { max: 220 });
  def('bird.crow', 'amb', 1, 2, (S, c, o, t, v) => { const n = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) S.voc(o, t + i * 0.4, { f0: R(380, 450), f1: 300, d: 0.22, a: 0.015, v: 0.34 * v, form: [[800, 4, 1], [1500, 5, 0.6], [2400, 6, 0.3]], breath: 0.9 }); }, { ref: 8, max: 220, gap: 8 });
})();
