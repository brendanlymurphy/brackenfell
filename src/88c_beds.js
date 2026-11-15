// ───────────────────────── ambience: beds, positional loops, scheduled nature ─────────────────────────
// Beds are looped noise through filters whose levels follow the world (see 88c_world.js for what is read). A bed whose level is ~0 is disconnected
// from the graph, so a silent bed costs nothing. Positional loops (river, lake, fire, crowd, mill) run through distance, air absorption, zone
// occlusion and a stereo pan. Birds, owls, drips and the rest are one-shots scheduled from update with random gaps, never on a fixed grid.
(() => {
  const S = Snd, sat = x => x < 0 ? 0 : x > 1 ? 1 : x, R = (a, b) => a + Math.random() * (b - a);
  S.beds = {}; S.sch = { bird: 3, owl: 30, dog: 60, cow: 80, rooster: 30, drip: 2, lap: 1, mug: 4, creak: 5, flap: 3, cricket: 0 };

  // a bed: sources connect to .in; .g is the level; .lp muffles it; .pan places it; connected to its bus only while audible
  const mkLoop = (c, dest) => { const inn = c.createGain(), lp = c.createBiquadFilter(), pan = c.createStereoPanner ? c.createStereoPanner() : null, g = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = 0.5; g.gain.value = 0; inn.connect(lp); let last = lp; if (pan) { lp.connect(pan); last = pan; } last.connect(g); return { in: inn, lp, pan, g, dest, conn: false, off: 0, lvl: 0 }; };
  const loopSrc = (kind, rate) => { const s = S.c.createBufferSource(), b = S.nz[kind]; s.buffer = b; s.loop = true; s.playbackRate.value = rate || 1; s.start(0, Math.random() * b.duration); return s; };
  const filt = (type, f, q) => { const b = S.c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b; };
  const gain = v => { const g = S.c.createGain(); g.gain.value = v; return g; };
  // random modulation of a parameter: noise -> lowpass -> depth -> param
  const modulate = (param, kind, hz, depth) => { const s = S.c.createBufferSource(); s.buffer = S.slow; s.loop = true; s.playbackRate.value = hz * R(0.8, 1.2); s.start(0, Math.random() * 40); const d = gain(depth); s.connect(d); d.connect(param); };
  // one strand of a texture: a noise source, a band, optional random amplitude modulation, into the loop
  const strand = (lp, kind, type, f, q, level, modHz, modDepth, f2, q2) => { const s = loopSrc(kind, R(0.85, 1.15)), b = filt(type, f, q); s.connect(b); let end = b; if (f2) { const b2 = filt(type === 'lowpass' ? 'highpass' : 'lowpass', f2, q2 || 0.7); b.connect(b2); end = b2; } const g = gain(level); end.connect(g); if (modHz) modulate(g.gain, 'pink', modHz, modDepth); g.connect(lp.in); return g; };
  const bedSet = (b, v, tc) => {
    const t = S.now(); b.lvl = v;
    if (v > 0.0015) { if (!b.conn) { b.g.connect(b.dest); b.conn = true; } b.off = 0; b.g.gain.setTargetAtTime(v, t, tc || 0.35); }
    else if (b.conn) { b.g.gain.setTargetAtTime(0, t, tc || 0.35); if (!b.off) b.off = t; else if (t - b.off > (tc || 0.35) * 7) { b.g.disconnect(); b.conn = false; b.off = 0; } }
  };
  S.bedSet = bedSet;
  const place = (b, sp, extra) => { const t = S.now(); b.lp.frequency.setTargetAtTime(sp.lp, t, 0.25); if (b.pan) b.pan.pan.setTargetAtTime(sp.pan, t, 0.2); };

  S.inits.push((S, c) => {
    // the outdoor sub-bus: wind and weather lose their top end and most of their level when you step inside
    const ob = S.outBus = { g: gain(1), lp: filt('lowpass', 16000, 0.5) }; ob.g.connect(ob.lp); ob.lp.connect(S.bus.amb.in);
    const B = S.beds, amb = S.bus.amb.in, wor = S.bus.world.in;
    // wind: broad body, a pitched howl and the sound of the gusts themselves
    B.wind = mkLoop(c, ob.g); strand(B.wind, 'pink', 'bandpass', 480, 0.5, 0.9, 0.22, 0.45); strand(B.wind, 'pink', 'bandpass', 210, 4, 0.5, 0.13, 0.3); strand(B.wind, 'white', 'bandpass', 1400, 0.6, 0.08, 0.35, 0.06);
    B.leaves = mkLoop(c, ob.g); strand(B.leaves, 'white', 'bandpass', 3600, 0.5, 0.5, 0.5, 0.35, 9000); strand(B.leaves, 'pink', 'bandpass', 650, 1.1, 0.7, 0.18, 0.4);
    B.rain = mkLoop(c, ob.g); strand(B.rain, 'white', 'highpass', 1100, 0.5, 0.5, 0, 0, 9500); strand(B.rain, 'pink', 'lowpass', 420, 0.5, 0.45, 0.4, 0.15);
    B.roof = mkLoop(c, amb); strand(B.roof, 'pink', 'bandpass', 900, 0.7, 0.6, 0.5, 0.25); strand(B.roof, 'brown', 'lowpass', 160, 0.5, 0.35);
    B.room = mkLoop(c, amb); strand(B.room, 'brown', 'lowpass', 170, 0.5, 0.8); strand(B.room, 'pink', 'bandpass', 700, 0.5, 0.1, 0.1, 0.04);
    B.cave = mkLoop(c, amb); strand(B.cave, 'brown', 'lowpass', 100, 0.5, 1.0, 0.07, 0.3); strand(B.cave, 'pink', 'bandpass', 320, 2.5, 0.12, 0.12, 0.08);
    B.night = mkLoop(c, ob.g); strand(B.night, 'white', 'bandpass', 5800, 6, 0.05, 0.2, 0.025);        // the shimmer under the crickets
    // water, crowds and the mill: positional (set each frame from the nearest point of the source)
    B.river = mkLoop(c, amb); strand(B.river, 'pink', 'bandpass', 620, 0.5, 1.0, 0.35, 0.25); strand(B.river, 'white', 'highpass', 1700, 0.5, 0.2, 5, 0.18, 6500); strand(B.river, 'brown', 'lowpass', 150, 0.5, 0.5, 0.2, 0.2);
    B.lake = mkLoop(c, amb); strand(B.lake, 'pink', 'lowpass', 520, 0.5, 0.8, 0.25, 0.5); strand(B.lake, 'white', 'bandpass', 2200, 0.5, 0.05, 0.3, 0.03);
    B.mill = mkLoop(c, wor); strand(B.mill, 'pink', 'bandpass', 480, 0.5, 0.9, 0.5, 0.2); strand(B.mill, 'white', 'highpass', 1800, 0.5, 0.15, 4, 0.1, 6000); strand(B.mill, 'brown', 'lowpass', 120, 0.5, 0.5);
    B.grind = mkLoop(c, wor); strand(B.grind, 'brown', 'lowpass', 240, 0.8, 0.9, 2.2, 0.5); strand(B.grind, 'pink', 'bandpass', 900, 1.2, 0.25, 3.8, 0.2);
    const crowd = k => { const b = mkLoop(c, wor); strand(b, 'pink', 'bandpass', 420, 1.0, 0.7, 5, 0.45); strand(b, 'pink', 'bandpass', 1300, 1.2, 0.4, 7, 0.3); strand(b, 'pink', 'bandpass', 2500, 1.0, 0.12, 9, 0.08); return b; };
    B.crowd = crowd(); B.market = crowd(); B.inn = crowd();
    // fire: three loops that follow the nearest hearths. crackle is a looped buffer of random pops, rumble and flutter are noise
    const cb = S.crack = c.createBuffer(1, Math.floor(c.sampleRate * 3), c.sampleRate), cd = cb.getChannelData(0);
    for (let k = 0; k < 90; k++) { const at = Math.floor(Math.random() * (cb.length - 4000)), amp = Math.pow(Math.random(), 2.5) * 0.9 + 0.05, len = Math.floor(R(0.002, 0.02) * c.sampleRate), hi = Math.random(); let lp = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; lp += (w - lp) * (0.3 + 0.7 * hi); cd[at + i] += (w - lp * 0.5) * amp * Math.exp(-i / (len * 0.3)); } }
    for (let i = 0; i < cd.length; i++) cd[i] = Math.max(-1, Math.min(1, cd[i]));
    B.fire = []; for (let i = 0; i < 3; i++) { const b = mkLoop(c, wor), s = c.createBufferSource(); s.buffer = cb; s.loop = true; s.playbackRate.value = R(0.9, 1.1); s.start(0, Math.random() * 2.5); const h = filt('highpass', 800, 0.6), g = gain(0.7); s.connect(h); h.connect(g); g.connect(b.in);
      strand(b, 'brown', 'lowpass', 520, 0.6, 0.9, 0.9, 0.5); strand(b, 'pink', 'bandpass', 1800, 0.7, 0.18, 8, 0.12); b.fire = null; B.fire.push(b); }
    // crickets: three fixed pitches, each switched in short pulse groups from update
    S.crick = []; for (let i = 0; i < 3; i++) { const o = c.createOscillator(), g = gain(0); o.frequency.value = 4100 + i * 330 + R(0, 120); o.connect(g); g.connect(ob.g); o.start(); S.crick.push({ o, g, next: 0, f: 3.2 + i * 0.7, conn: true }); }
  });

  // ── per-frame update of everything above ──
  const tmp = { g: 0, lp: 16000, pan: 0, d: 0 };
  S.ups.push(function (S, dt, G) {
    const c = S.c, t = S.now(), B = S.beds, f3 = (S.frame % 3) === 0; if (!B.wind) return;
    // outdoor sub-bus follows how far inside the listener is
    if (f3) {
      S.outBus.g.gain.setTargetAtTime(1 - 0.86 * G.indoor, t, 0.3); S.outBus.lp.frequency.setTargetAtTime(16000 - 15300 * G.indoor, t, 0.3);
      const out = 1 - G.indoor, ws = G.wind, rain = G.rain;
      // wind follows ENV.windStrength (0.15 .. 1.35); trees add leaf hiss and low soughing
      bedSet(B.wind, (0.035 + 0.055 * ws * ws) * (0.5 + 0.5 * sat(ws)) * 0.95 + 0.012, 0.8);
      bedSet(B.leaves, 0.045 * G.forest * (0.15 + 0.85 * sat(ws * 0.9)) + 0.008 * G.forest, 0.8);
      bedSet(B.rain, rain * 0.1, 0.8); bedSet(B.roof, rain * 0.08 * G.indoor, 0.8);
      bedSet(B.night, 0.7 * G.night * out * (1 - rain) * (0.4 + 0.6 * G.meadow), 2);
      // indoors
      const rm = G.indoor * (G.space === 'cave' ? 0 : 1), cv = G.indoor * (G.space === 'cave' ? 1 : 0);
      bedSet(B.room, 0.08 * rm, 0.5); bedSet(B.cave, 0.085 * cv, 0.8);
      // river: a line, so use the nearest point; muffled and quieter through walls (spat does that via zone)
      if (G.riverD < 60) { if (S.spat(G.riverX, G.riverY, G.riverZ, 0, 9, 75, tmp)) { place(B.river, tmp); bedSet(B.river, 0.13 * tmp.g * (1 + 0.8 * sat(1 - G.riverD / 5)), 0.35); } else bedSet(B.river, 0, 0.5); } else bedSet(B.river, 0, 0.5);
      if (G.lakeD < 70) { if (S.spat(G.lakeX, G.lakeY, G.lakeZ, 0, 7, 80, tmp)) { place(B.lake, tmp); bedSet(B.lake, 0.06 * tmp.g, 0.5); } else bedSet(B.lake, 0, 0.5); } else bedSet(B.lake, 0, 0.5);
      // the town's murmur: by who is actually standing about
      const day = G.day, sqL = 0.1 + 0.9 * sat(G.nSquare / 4);
      const cd = G.nearSquare; if (cd < 95 && S.spat(G.sqX, G.sqY, G.sqZ, 0, 13, 95, tmp)) { place(B.crowd, tmp); bedSet(B.crowd, 0.1 * tmp.g * (0.3 + 0.7 * sqL) * (0.35 + 0.65 * day) * (1 - 0.7 * rain), 0.8); } else bedSet(B.crowd, 0, 0.8);
      if (G.nearMarket < 60 && S.spat(G.mkX, G.mkY, G.mkZ, 0, 9, 60, tmp)) { place(B.market, tmp); bedSet(B.market, 0.07 * tmp.g * day * (1 - 0.5 * rain) * (0.4 + 0.6 * sat(G.nMarket / 2)), 0.8); } else bedSet(B.market, 0, 0.8);
      if (G.innZone && G.nearInn < 60 && S.spat(G.innX, G.innY, G.innZ, G.innZone, 6, 60, tmp)) { place(B.inn, tmp); bedSet(B.inn, 0.12 * tmp.g * sat(G.nInn / 5), 0.8); } else bedSet(B.inn, 0, 0.8);
      // the mill: wheel and race while the wheel is turning, the stone while the miller works
      if (G.millOn && S.spat(G.millX, G.millY, G.millZ, 0, 8, 70, tmp)) { place(B.mill, tmp); bedSet(B.mill, 0.12 * tmp.g, 0.6); } else bedSet(B.mill, 0, 0.6);
      if (G.grindOn && S.spat(G.millX, G.millY + 1, G.millZ, G.millZone, 4, 40, tmp)) { place(B.grind, tmp); bedSet(B.grind, 0.1 * tmp.g, 0.6); } else bedSet(B.grind, 0, 0.6);
      // fires: the nearest three, each at its own place
      for (let i = 0; i < 3; i++) { const b = B.fire[i], f = G.fires[i];
        if (f.on && S.spat(f.x, f.y, f.z, f.zone, f.ref, f.max, tmp)) { place(b, tmp); bedSet(b, 0.15 * f.lvl * tmp.g, 0.2); } else bedSet(b, 0, 0.3); }
      // crickets: night, outdoors, mostly away from the square
      const cv2 = G.night * out * (1 - rain) * (0.35 + 0.65 * G.meadow); for (let i = 0; i < 3; i++) S.crick[i].lvl = cv2 * (i === 0 ? 1 : 0.7);
    }
    // cricket pulses: groups of three or four chirps of about 12 ms, a group every 0.3 .. 0.5 s, scheduled 0.3 s ahead
    for (let i = 0; i < 3; i++) { const k = S.crick[i]; if (k.lvl < 0.01) { if (k.conn && k.next === 0) { } continue; }
      while (k.next < t + 0.3) { if (k.next < t) k.next = t; const n = 3 + (Math.random() * 2 | 0); for (let j = 0; j < n; j++) { const a = k.next + j * 0.03; k.g.gain.setValueAtTime(0.022 * k.lvl, a); k.g.gain.setValueAtTime(0, a + 0.012); } k.next += 1 / k.f * R(0.85, 1.2); } }
    // lake lapping, and scheduled one-shots
    const T = S.sch; if (!G.playing) return;
    if (B.lake.lvl > 0.004) { T.lap -= dt; if (T.lap <= 0) { T.lap = R(1.4, 3.6); S.nb(B.lake.in, t + 0.02, { f: R(500, 800), f2: R(180, 300), q: 0.8, a: R(0.08, 0.2), d: R(0.4, 0.9), v: 0.5, kind: 'pink' }); S.nb(B.lake.in, t + 0.1, { type: 'highpass', f: 3500, a: 0.1, d: 0.3, v: 0.05 }); } }
    // birds: the dawn chorus, a quiet noon, a thrush at evening. One call at a random bearing, 8 .. 70 m off, up in the trees.
    const h = G.hour, dawn = Math.exp(-Math.pow((h - 6.1) / 1.25, 2)), eve = Math.exp(-Math.pow((h - 18.1) / 1.4, 2)) * 0.55, mid = h > 7.8 && h < 17 ? 0.2 : 0, br = (dawn + eve + mid) * (1 - G.night) * (1 - G.rain * 0.9) * (0.35 + 0.65 * G.forest + 0.2 * G.meadow);
    T.bird -= dt;
    if (T.bird <= 0 && br > 0.02) {
      T.bird = R(1.2, 3.2) / br; const a = Math.random() * 6.283, d = R(9, 70), x = G.x + Math.cos(a) * d, z = G.z + Math.sin(a) * d, y = G.y + R(3, 12), r = Math.random();
      const nm = dawn > 0.35 ? (r < 0.26 ? 'robin' : r < 0.5 ? 'chaffinch' : r < 0.7 ? 'wren' : r < 0.9 ? 'thrush' : 'crow') : eve > 0.15 ? (r < 0.5 ? 'thrush' : r < 0.75 ? 'robin' : r < 0.9 ? 'chaffinch' : 'crow') : (r < 0.3 ? 'pigeon' : r < 0.55 ? 'chaffinch' : r < 0.75 ? 'wren' : r < 0.95 ? 'robin' : 'crow');
      S.play('bird.' + nm, [x, y, z], R(0.7, 1.1));
    }
    T.owl -= dt; if (T.owl <= 0) { T.owl = R(22, 55); if (G.night > 0.7 && G.indoor < 0.5) { const a = Math.random() * 6.283, d = R(40, 120); S.play('owl', [G.x + Math.cos(a) * d, G.y + 8, G.z + Math.sin(a) * d], 1); } }
    // livestock and dogs: far off, at the farm, the barn and the hunter's cabin; the route drops them if they cannot be heard from here
    T.dog -= dt; if (T.dog <= 0) { T.dog = R(50, 140); const p = G.pHunter; if (p && G.night < 0.9) S.play('dog', p, 1); }
    T.cow -= dt; if (T.cow <= 0) { T.cow = R(60, 150); const p = G.pBarn; if (p && G.day > 0.3) S.play('cow', p, 1); }
    T.rooster -= dt; if (T.rooster <= 0) { T.rooster = R(35, 90); const p = G.pFarm; if (p && h > 4.6 && h < 8.5) S.play('rooster', p, 1); }
    // cellar drip: a random drop somewhere in the room
    T.drip -= dt; if (T.drip <= 0) { T.drip = R(1.2, 4.5); if (G.space === 'cave' && G.indoor > 0.5) S.play('drip', [G.x + R(-4, 4), G.y + 0.1, G.z + R(-4, 4)], R(0.6, 1)); }
    // the inn: mugs and a clink of cutlery while it is full
    T.mug -= dt; if (T.mug <= 0) { T.mug = R(2.5, 8); if (G.nInn >= 3 && G.nearInn < 40) S.play('mug', [G.innX + R(-4, 4), G.innY + 1, G.innZ + R(-3, 3)], R(0.5, 1)); }
    // hanging signs and lanterns creak, bunting flaps, when the wind is up
    T.creak -= dt; if (T.creak <= 0) { T.creak = R(2.5, 8) / Math.max(0.2, G.wind * G.wind); const p = G.lanternNear; if (G.wind > 0.85 && p) S.play('creak', p, 1); }
    T.flap -= dt; if (T.flap <= 0) { T.flap = R(1.4, 4) / Math.max(0.2, G.wind); if (G.wind > 0.7 && G.nearMarket < 40) S.play('cloth.flap', [G.mkX + R(-6, 6), G.y + 3, G.mkZ + R(-2, 2)], 0.5 + 0.5 * sat(G.wind - 0.5)); }
  });
})();
