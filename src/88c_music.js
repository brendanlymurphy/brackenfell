// ───────────────────────── music: sparse, modal, procedural, with long silences ─────────────────────────
// Voices: drone (detuned saws and a fifth), plucked string (Karplus-Strong), bowed string (saws, vibrato, slow attack), frame drum, small bells.
// Cues (dawn, day, dusk, night, tavern, tension, combat, discovery) schedule one bar at a time from update, each bar made fresh from a random walk over
// the mode, so nothing repeats. After an ambient cue comes a silence of one to three minutes. Dialogue ducks the music bus (88_audio.js, busLevels).
// The lute that Lark plays is diegetic: a tune composed here, played from Lark's position through the world bus.
(() => {
  const K = Snd, R = (a, b) => a + Math.random() * (b - a), P = a => a[Math.floor(Math.random() * a.length)], sat = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const MODES = { dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], phryg: [0, 1, 3, 5, 7, 8, 10] };
  const ROOTS = { d: 146.83, a: 110, g: 98, f: 87.31, e: 82.41 };
  const fq = (root, mode, deg) => { const m = MODES[mode], o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7; return root * Math.pow(2, (m[i] + 12 * o) / 12); };
  const M = K.music = { cue: null, cg: null, nextBar: 0, bar: 0, bars: 0, silentUntil: 0, t0: 0, want: null, wantT: 0, calmT: 0, mode: 'dorian', root: 146.83, walk: 3, lastCue: '', cues: {}, disc: 0, startT: 0 };
  K.inits.push((K, c) => { M.cue = null; M.cg = null; M.silentUntil = 25 + R(0, 20); M.nextBar = 0; M.lute = { g: c.createGain(), lp: c.createBiquadFilter(), pan: c.createStereoPanner ? c.createStereoPanner() : null, ev: null, idx: 0, base: 0, end: 0, phrase: 0, gapUntil: 0, audible: false, dest: K.bus.world.in };
    const l = M.lute; l.g.gain.value = 0; l.lp.type = 'lowpass'; l.lp.frequency.value = 6000; l.g.connect(l.lp); if (l.pan) { l.lp.connect(l.pan); l.pan.connect(l.dest); } else l.lp.connect(l.dest); });

  // ── voices (all take an output node, a start time, a frequency) ──
  const drone = (o, t, dur, f, v, fifth) => { const c = K.c, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(220, t); lp.frequency.linearRampToValueAtTime(520, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(240, t + dur); lp.Q.value = 0.7;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(4, dur * 0.35)); g.gain.setValueAtTime(v, t + dur - Math.min(5, dur * 0.4)); g.gain.linearRampToValueAtTime(0, t + dur); lp.connect(g); g.connect(o);
    for (const [m, det, ty, a] of [[1, -5, 'sawtooth', 0.5], [1, 6, 'sawtooth', 0.5], [0.5, 0, 'sine', 0.8], [fifth ? 1.5 : 2, 3, 'triangle', 0.35]]) { const os = c.createOscillator(), og = c.createGain(); os.type = ty; os.frequency.value = f * m; os.detune.value = det; og.gain.value = a; os.connect(og); og.connect(lp); os.start(t); os.stop(t + dur + 0.1); } };
  const pluckV = (o, t, f, v, br) => K.pluck(o, t, f, v, { dur: 2.2, bright: br === undefined ? 0.55 : br });
  const bowed = (o, t, f, dur, v) => { const c = K.c, g = c.createGain(), lp = c.createBiquadFilter(), vb = c.createOscillator(), vg = c.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.4); lp.frequency.linearRampToValueAtTime(600, t + dur); lp.Q.value = 1.2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.7, dur * 0.3)); g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur); vb.frequency.value = R(4.8, 5.6); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + dur * 0.6); vb.connect(vg); lp.connect(g); g.connect(o);
    for (const det of [-6, 5]) { const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.value = f; os.detune.value = det; vg.connect(os.frequency); os.connect(lp); os.start(t); os.stop(t + dur + 0.1); } vb.start(t); vb.stop(t + dur + 0.1); };
  const frame = (o, t, v, low) => { K.tn(o, t, { f: low ? 62 : 95, f2: low ? 42 : 58, d: 0.28, a: 0.004, v: v }); K.nb(o, t, { type: 'lowpass', f: low ? 300 : 500, d: 0.12, v: v * 0.6 }); K.nb(o, t, { f: 1800, q: 1, d: 0.03, v: v * 0.14 }); };
  const shaker = (o, t, v) => K.nb(o, t, { type: 'highpass', f: 5000, a: 0.012, d: 0.07, v });
  const bellV = (o, t, f, v) => { K.tn(o, t, { f, d: 2.2, a: 0.004, v }); K.tn(o, t, { f: f * 2.76, d: 0.7, a: 0.002, v: v * 0.3 }); K.tn(o, t, { f: f * 5.4, d: 0.3, a: 0.002, v: v * 0.1 }); };

  // ── a melody over a mode: a random walk with an arch, rests, and a landing on the tonic or the fifth ──
  const walkMelody = (n, start, rest, spread) => { const out = []; let d = start; for (let i = 0; i < n; i++) { if (Math.random() < rest) { out.push(null); continue; } const s = P([-2, -1, -1, 0, 1, 1, 2, spread > 1 ? 3 : 1, spread > 1 ? -3 : -1]); d = Math.max(0, Math.min(11, d + s)); if (i === n - 1) d = P([0, 4, 7]); out.push(d); } return out; };

  // ── cues: bar(t, i) schedules bar i starting at t (all into M.cg), len = bar length in seconds ──
  const C = M.cues;
  C.dawn = { dur: 78, len: () => 6, vol: 0.55, setup() { M.root = ROOTS.f * 2; M.mode = 'lydian'; M.walk = 7; },
    bar(t, i, o) { if (i === 0) { drone(o, t, 70, M.root / 2, 0.06, true); } const n = P([2, 3, 3, 4]); for (let k = 0; k < n; k++) if (Math.random() < 0.75) { const d = M.walk = Math.max(2, Math.min(13, M.walk + P([-2, -1, 1, 2, 3, -3]))); pluckV(o, t + k * R(0.9, 1.6) + R(0, 0.4), fq(M.root, M.mode, d), 0.13, 0.5); }
      if (i % 3 === 1) bellV(o, t + R(1, 4), fq(M.root, M.mode, P([7, 9, 11])) * 2, 0.025); } };
  C.day = { dur: 96, len: () => 4, vol: 0.5, setup() { M.root = P([ROOTS.d, ROOTS.g]) * 2; M.mode = M.root > 250 ? 'dorian' : 'mixo'; M.walk = 6; },
    bar(t, i, o) { if (i === 0) drone(o, t, 80, M.root / 2, 0.045, true); const m = walkMelody(4, M.walk, 0.5, 1); m.forEach((d, k) => { if (d === null) return; M.walk = d; pluckV(o, t + k * 0.95 + R(0, 0.08), fq(M.root, M.mode, d + 2), 0.14, 0.55); });
      if (i % 6 === 3) bowed(o, t + 0.5, fq(M.root, M.mode, P([0, 4, 2])), R(3, 4.5), 0.05); } };
  C.dusk = { dur: 84, len: () => 6, vol: 0.5, setup() { M.root = ROOTS.a * 2; M.mode = 'aeolian'; M.walk = 4; },
    bar(t, i, o) { if (i === 0) drone(o, t, 76, M.root / 2, 0.06, true); if (i % 2 === 0) bowed(o, t, fq(M.root, M.mode, P([0, 2, 4, 5])), R(4, 5.5), 0.06); const n = P([1, 2]); for (let k = 0; k < n; k++) { M.walk = Math.max(0, Math.min(11, M.walk + P([-2, -1, 1, 2]))); pluckV(o, t + R(1.5, 5), fq(M.root, M.mode, M.walk + 3), 0.12, 0.45); } } };
  C.night = { dur: 90, len: () => 8, vol: 0.4, setup() { M.root = ROOTS.e * 2; M.mode = 'phryg'; M.walk = 2; },
    bar(t, i, o) { if (i === 0) drone(o, t, 82, M.root / 2, 0.05, false); if (Math.random() < 0.7) bellV(o, t + R(0.5, 6), fq(M.root, M.mode, P([4, 7, 9, 11])) * 2, 0.03); if (i % 3 === 1) bowed(o, t + R(0, 3), fq(M.root, M.mode, P([0, 1, 4])) * 2, R(5, 7), 0.035); } };
  C.tavern = { dur: 46, len: () => 2.4, vol: 0.5, setup() { M.root = ROOTS.g * 2; M.mode = 'mixo'; M.walk = 6; },
    bar(t, i, o) { const q = 0.3; const m = walkMelody(8, M.walk, 0.18, 1); m.forEach((d, k) => { if (d === null) return; M.walk = d; pluckV(o, t + k * q, fq(M.root, M.mode, d + 2), 0.08, 0.6); }); pluckV(o, t, fq(M.root, M.mode, 0) / 2, 0.1, 0.4); pluckV(o, t + q * 4, fq(M.root, M.mode, 4) / 2, 0.08, 0.4); frame(o, t, 0.1); frame(o, t + q * 4, 0.08); shaker(o, t + q * 2, 0.012); shaker(o, t + q * 6, 0.012); } };
  C.tension = { dur: 1e9, len: () => 3, vol: 0.55, setup() { M.root = ROOTS.e; M.mode = 'phryg'; M.walk = 0; },
    bar(t, i, o) { if (i === 0) { drone(o, t, 40, M.root, 0.08, false); drone(o, t, 40, M.root * 1.0595, 0.04, false); } if (i > 0 && i % 12 === 0) { drone(o, t, 40, M.root, 0.08, false); drone(o, t, 40, M.root * 1.0595, 0.04, false); } frame(o, t, 0.18, true); frame(o, t + 0.9, 0.1, true); if (Math.random() < 0.3) bowed(o, t + R(0, 2), fq(M.root, M.mode, P([1, 3, 6])) * 2, R(2.5, 3.5), 0.03); } };
  C.combat = { dur: 1e9, len: () => 2.4, vol: 0.6, setup() { M.root = ROOTS.a; M.mode = 'aeolian'; M.walk = 0; },
    bar(t, i, o) { const q = 0.3; if (i % 16 === 0) drone(o, t, 40, M.root, 0.07, true); for (let k = 0; k < 8; k++) { if (k % 4 === 0) frame(o, t + k * q, 0.32, true); else if (k === 6 || (k === 3 && Math.random() < 0.4)) frame(o, t + k * q, 0.2); else if (Math.random() < 0.3) frame(o, t + k * q, 0.08); }
      const pat = i % 4 === 3 ? [0, 0, 1, 0, 4, 3, 1, 0] : [0, 0, 0, 2, 0, 0, 4, 3]; pat.forEach((d, k) => { const f = fq(M.root, M.mode, d) * 2; K.tn(o, t + k * q, { f, d: 0.25, a: 0.015, v: 0.05, type: 'sawtooth' }); }); if (i % 2 === 0) bowed(o, t, fq(M.root, M.mode, P([0, 4, 5])) * 2, 2.2, 0.04); } };
  C.discovery = { dur: 9, len: () => 3, vol: 0.5, setup() { M.root = ROOTS.d * 2; M.mode = 'lydian'; M.walk = 2; },
    bar(t, i, o) { if (i === 0) { drone(o, t, 9, M.root / 2, 0.06, true); [0, 2, 4, 6, 9].forEach((d, k) => { pluckV(o, t + 0.2 + k * 0.38, fq(M.root, M.mode, d + 2), 0.16, 0.5); bellV(o, t + 0.2 + k * 0.38, fq(M.root, M.mode, d + 2) * 2, 0.02); }); } } };

  // ── the state machine ──
  const startCue = (name, now) => { const c = K.c, cu = C[name]; if (M.cg) fadeOut(M.cg, 1.4, now); const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(cu.vol, now, 0.6); g.connect(K.bus.music.in); M.cg = g; M.cue = cu; M.cueName = name; cu.setup(); M.bar = 0; M.nextBar = now + 0.3; M.t0 = now; };
  const fadeOut = (g, s, now) => { g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0, now, s / 4); setTimeout(() => { try { g.disconnect(); } catch (e) { } }, s * 1000 + 500); };
  const stopCue = (now, fade) => { if (M.cg) fadeOut(M.cg, fade || 3, now); M.cg = null; M.cue = null; M.cueName = ''; };
  M.threat = { tension: false, combat: false, d: 99 };
  const sense = () => { let ten = false, com = false, dmin = 99; if (typeof Foes !== 'undefined' && Foes.list && typeof Player !== 'undefined') for (const f of Foes.list) { if (!f.alive) continue; const d = Math.hypot(f.pos[0] - Player.pos[0], f.pos[2] - Player.pos[2]); if (d > 55) continue; const s = f.state; if (s === 'idle' || s === 'return' || s === 'gone') continue; if (d < dmin) dmin = d; if (d < 16 && (s === 'circle' || s === 'attack' || s === 'guard' || s === 'stagger' || s === 'chase')) com = true; ten = true; }
    if (typeof RPG !== 'undefined' && RPG.combatT < 4 && dmin < 30) com = true; M.threat.tension = ten; M.threat.combat = com; M.threat.d = dmin; };
  const pickAmbient = G => { const h = G.hour, inn = G.zid === 'inn' && h >= 17 && !G.lark.on;
    if (inn && Math.random() < 0.8) return 'tavern'; if (G.indoor > 0.5) return null;
    if (h >= 5 && h < 8.6) return 'dawn'; if (h >= 8.6 && h < 17) return 'day'; if (h >= 17 && h < 20.5) return 'dusk'; return 'night'; };

  K.ups.push(function (K, dt, G) {
    if (!M.lute) return; const c = K.c, now = K.now();
    luteUpdate(K, dt, G, now);
    if (!G.playing) { if (M.cue) stopCue(now, 2); return; }
    if ((K.frame & 7) === 0) sense();
    const th = M.threat;
    // priority: combat > tension > ambient; discovery is a short flourish that never interrupts a fight
    if (th.combat) { M.calmT = 0; if (M.cueName !== 'combat') startCue('combat', now); }
    else if (th.tension) { M.calmT = 0; if (M.cueName !== 'tension' && M.cueName !== 'combat') startCue('tension', now); else if (M.cueName === 'combat' && M.calmT === 0) { M.calmT = 0; } }
    else if (M.cueName === 'combat' || M.cueName === 'tension') { M.calmT += dt; if (M.calmT > 7) { stopCue(now, 4); M.silentUntil = now + R(25, 50); M.calmT = 0; } }
    if (M.disc && !th.tension && M.cueName !== 'discovery') { M.disc = 0; startCue('discovery', now); }
    else if (M.cueName === 'combat' && !th.combat && th.tension) startCue('tension', now);
    // ambient cues: only after a silence, and only when the place suits music
    if (!M.cue && now >= M.silentUntil && !th.tension && !G.talk && !G.menu) { const nm = pickAmbient(G); if (nm) startCue(nm, now); else M.silentUntil = now + 20; }
    else if (M.cue && M.cueName !== 'combat' && M.cueName !== 'tension' && (now - M.t0 > M.cue.dur || (G.indoor > 0.7 && M.cueName !== 'tavern') )) { stopCue(now, 5); M.silentUntil = now + R(70, 180); }
    if (M.cue) while (M.nextBar < now + 1.5) { M.cue.bar(M.nextBar, M.bar++, M.cg); M.nextBar += M.cue.len(M.bar); }
  });
  K.discover = () => { M.disc = 1; };

  // ── Lark's lute: a tune made up as it goes, in D dorian, played from where Lark stands. Events are [eighths, Hz, velocity] ──
  const lutePhrase = l => { const root = ROOTS.d * 2, mode = 'dorian', out = [], rh = [[1, 1, 1, 1, 1, 1, 1, 1], [2, 1, 1, 2, 1, 1], [1, 1, 2, 1, 1, 2], [3, 1, 2, 2], [2, 2, 1, 1, 2], [1, 2, 1, 2, 2]], k = l.phrase % 4; let d = k === 2 ? 7 : 4;
    for (let bar = 0; bar < 2; bar++) { const pat = P(rh); let tt = bar * 8; for (let i = 0; i < pat.length; i++) { d = Math.max(0, Math.min(11, d + P([-2, -1, -1, 0, 1, 1, 2]) + (k === 2 && Math.random() < 0.3 ? 1 : 0))); if (bar === 1 && i === pat.length - 1) d = P(k === 3 ? [0] : [0, 4, 4]); out.push([tt, fq(root, mode, d), 0.28 * R(0.8, 1)]); tt += pat[i]; } }
    out.push([0, fq(root, mode, 0) / 2, 0.22], [4, fq(root, mode, 4) / 2, 0.16], [8, fq(root, mode, 0) / 2, 0.2], [12, fq(root, mode, k === 3 ? 0 : 3) / 2, 0.16]); out.sort((a, b) => a[0] - b[0]); return out; };
  function luteUpdate(K, dt, G, now) {
    const l = M.lute, Lk = G.lark, on = Lk.on && K.set.world > 0.01 && Lk.d < 45; Audio2.luteRequest = Math.max(0, Audio2.luteRequest - dt);
    if ((K.frame & 3) === 0) { if (on && K.spat(Lk.x, Lk.y, Lk.z, Lk.zone, 3, 45, K._s)) { l.g.gain.setTargetAtTime(0.9 * K._s.g, now, 0.2); l.lp.frequency.setTargetAtTime(K._s.lp, now, 0.2); if (l.pan) l.pan.pan.setTargetAtTime(K._s.pan, now, 0.2); l.audible = true; } else { l.g.gain.setTargetAtTime(0, now, 0.25); l.audible = false; } }
    if (!on || !l.audible) { l.ev = null; return; }        // nobody hears it, so it is not rendered; a fresh phrase begins when you come within earshot
    const half = 0.17;
    if (!l.ev) { if (now < l.gapUntil) return; l.ev = lutePhrase(l); l.idx = 0; l.base = now + 0.15; l.end = l.base + 16 * half; l.phrase++; }
    while (l.idx < l.ev.length && l.base + l.ev[l.idx][0] * half < now + 0.5) { const e = l.ev[l.idx++]; K.pluck(l.g, Math.max(l.base + e[0] * half + R(0, 0.012), now), e[1], e[2], { dur: e[1] < 140 ? 2.2 : 1.5, bright: e[1] < 140 ? 0.35 : 0.55 }); }
    if (l.idx >= l.ev.length && now >= l.end - 0.05) { l.ev = null; if (l.phrase % 4 === 0) l.gapUntil = now + R(3, 8); }
  }
  // test hooks
  K.renderCue = (name, secs) => { const c = K.c, cu = C[name]; const g = c.createGain(); g.gain.value = cu.vol; g.connect(K.bus.music.in); cu.setup(); let t = 0.1, i = 0; while (t < secs) { cu.bar(t, i++, g); t += cu.len(i); } };
})();
