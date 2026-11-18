// ───────────────────────── shared shading: frame uniforms and TSL helpers every material uses ─────────────────────────
// SH.init() must run after the textures in G exist. Other files take what they need from SH and from TSL inside their own closure,
// because TSL names such as clamp, mix or length would collide with the game's own maths helpers at the top level.
const SH = { U: null, LAMP_PEAK: 1.6 };
SH.init = function () {
  const { Fn, If, Loop, float, int, vec2, vec3, step, uniform, uniformArray, texture, positionWorld, mix, smoothstep, clamp, max, pow, exp, abs, dot, normalize, length, sqrt, select, dFdx, dFdy } = TSL;
  const V3 = () => new THREE.Vector3(), V4 = () => new THREE.Vector4();
  // one set of uniforms for the whole frame, written by renderFrame() from ENV
  const U = SH.U = {
    time: uniform(0), camPos: uniform(V3()),                 // camPos is always the player's eye, also inside shadow passes
    sunDir: uniform(new THREE.Vector3(0, 1, 0)), sunCol: uniform(V3()),      // active key light (sun or moon)
    ambSky: uniform(V3()), ambGnd: uniform(V3()),
    fogCol: uniform(V3()), mistK: uniform(0), fogDens: uniform(0.001), fogSun: uniform(V3()), fogFall: uniform(0.011),
    zenith: uniform(V3()), horizon: uniform(V3()), stars: uniform(0), aurora: uniform(0),
    moonDir: uniform(new THREE.Vector3(0, 1, 0)), moonBright: uniform(0), sunDisc: uniform(new THREE.Vector3(0, 1, 0)), sunDiscI: uniform(0),
    wind: uniform(V4()), windOff: uniform(new THREE.Vector2()),     // wind: dir.x, dir.z, strength, time. windOff: how far (m) the air has travelled, which carries the gust pattern
    rain: uniform(0), wet: uniform(0),                        // falling now (0..1), and how wet the ground is (lags behind)
    cloud: uniform(0.45), grassRange: uniform(30), treeLod: uniform(65), windowGlow: uniform(0), lakeY: uniform(0), indoor: uniform(0), viewX: uniform(new THREE.Vector2(1, 0)), viewZ: uniform(new THREE.Vector2(0, 1)), viewOn: uniform(0),      /* [view] what the panes show from inside (56b_viewcube.js) */
    lightPos: uniformArray(Array.from({ length: 8 }, V4), 'vec4'),   // xyz, radius
    lightCol: uniformArray(Array.from({ length: 8 }, V4), 'vec4'),   // rgb, zone (255 = everywhere)
    terrLayers: uniform(1), lightN: uniform(8, 'int'), lightNOut: uniform(8, 'int'),         // lights in use, and how many of them (listed first) reach surfaces outdoors: the loop below stops there
  };
  const sat = SH.sat = x => clamp(x, 0, 1);
  const noiseL = SH.noiseL = uvn => texture(G.noiseTex, uvn).level(0);
  // sky gradient without clouds (also used for reflections)
  SH.skyBase = Fn(([dir]) => {
    const t = pow(sat(max(dir.y, 0).oneMinus()), 3.5);
    const c = mix(U.zenith, U.horizon, t).toVar();
    const sd = max(dot(dir, U.sunDisc), 0);
    c.addAssign(U.fogSun.mul(pow(sd, 6).mul(0.45).mul(t.mul(0.7).add(0.3)).add(pow(sd, 90).mul(0.8))));
    return mix(c, U.fogCol, smoothstep(-0.10, 0.03, dir.y).oneMinus());
  });
  SH.cloudDensity = Fn(([p]) => {
    const t = U.time, uvc = p.mul(0.00022).sub(vec2(t.mul(0.0026), t.mul(0.0019)));      // clouds travel the way the wind blows (they used to drift against it)
    const d = noiseL(uvc).r.mul(0.64).add(noiseL(uvc.mul(3.1).add(vec2(t.mul(0.002), 0))).g.mul(0.36));
    return smoothstep(float(0.86).sub(U.cloud.mul(0.62)), float(1.10).sub(U.cloud.mul(0.62)), d);
  });
  // sky + ground ambient for a surface. skyVis: 0 deep interior .. 1 open sky. Rooms (zone != 0) get a greyer, warmer bounce.
  SH.hemi = Fn(([N, skyVis, zone]) => {
    const h = mix(U.ambGnd, U.ambSky, N.y.mul(0.5).add(0.5)).mul(skyVis);
    const room = mix(vec3(dot(h, vec3(0.3333))), h, 0.25).mul(vec3(1.10, 1.0, 0.88));
    return mix(h, room, step(0.5, zone));      // arithmetic, not select(): select() with these branches makes Three r187 emit a redeclared variable
  });
  // the eight nearest point lights (hearths, lanterns). A light only reaches surfaces of its own zone, so it cannot leak through walls.
  // A light stored with a negative radius is a street lantern whose pool on the ground is already in the lamp map (43b_lamps.js):
  // the terrain skips those (SH.pointLightsGround), everything else lights from them as usual.
  const pointFn = ground => Fn(([wp, N, zone, wrap]) => {
    const acc = vec3(0).toVar();
    const nEnd = select(zone.lessThan(0.5), U.lightNOut, U.lightN);      // an outdoor surface only loops over the outdoor lights; none near: no iterations
    Loop({ start: int(0), end: nEnd, type: 'int', condition: '<' }, ({ i }) => {
      const lc = U.lightCol.element(i), lp = U.lightPos.element(i);
      const d = lp.xyz.sub(wp), d2 = dot(d, d), r2 = lp.w.mul(lp.w);
      let ok = abs(lc.w.sub(zone)).lessThan(0.5).or(lc.w.greaterThan(254.5)).and(d2.lessThan(r2)); if (ground) ok = ok.and(lp.w.greaterThan(0));
      If(ok, () => {
        const f = float(1).sub(d2.div(r2)), att = f.mul(f).div(d2.mul(step(0.5, zone).mul(0.7).add(0.55)).add(1)).mul(step(0.5, zone).mul(0.45).add(1));      // [l1] in a room the fire's pool is tighter and brighter: a pool, then dark
        const ndl = dot(N, d).mul(max(d2, 1e-4).inverseSqrt()).add(wrap).div(float(1).add(wrap));
        acc.addAssign(lc.rgb.mul(att.mul(max(ndl, 0))));
      });
    });
    return acc;
  });
  SH.pointLights = pointFn(false); SH.pointLightsGround = pointFn(true);
  // warm light lying on the ground under every street lantern, from the baked lamp map (one sample; lit with the windows at dusk)
  SH.lampPool = Fn(([wp]) => { if (!G.lampTex) Lamps.init(); const t = texture(G.lampTex, wp.xz.div(2 * K.terrainHalf).add(0.5)).r; return vec3(1.0, 0.56, 0.22).mul(t.mul(t).mul(SH.LAMP_PEAK).mul(U.windowGlow).mul(1.9)); });
  // A window pane lit from inside, as seen from the street: small leaded diamonds, each a little different, the room behind unevenly
  // bright. Values are chosen for the night exposure so the glass stays amber instead of clipping to white. h: a random number per window.
  SH.paneLit = Fn(([wp, N, h, pl]) => {
    const hc = wp.x.mul(abs(N.z)).add(wp.z.mul(abs(N.x))), q = vec2(hc, wp.y).mul(5.2);
    const a = q.x.add(q.y), b = q.x.sub(q.y), lat = TSL.min(abs(TSL.fract(a).sub(0.5)), abs(TSL.fract(b).sub(0.5)));
    const lead = mix(smoothstep(0.035, 0.10, lat), float(1), pl);
    const id = TSL.floor(vec2(a.add(0.5), b.add(0.5))), hv = TSL.fract(TSL.sin(dot(id, vec2(127.1, 311.7))).mul(43758.5453));
    const room = texture(G.noiseTex, vec2(hc.mul(0.11), wp.y.mul(0.13))).r;                     // furniture, curtains and people between the fire and the glass
    const flick = TSL.sin(U.time.mul(6.0).add(h.mul(40))).mul(0.04).add(0.96).mul(float(1).sub(step(0.82, h).mul(float(0.16).add(TSL.sin(U.time.mul(11.0).add(h.mul(97))).mul(TSL.sin(U.time.mul(4.3).add(h.mul(53))).mul(0.14))))));      // [l1] a few windows have a real candle or fire behind them: they waver
    const on = smoothstep(0.26, 0.34, h);                                                       // a quarter of the windows are dark
    const warm = mix(mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.70, 0.36), hv), vec3(0.95, 0.80, 0.52), smoothstep(0.55, 0.9, h).mul(0.7));      // [l1] ember orange .. candle .. a pale lantern
    return warm.mul(lead.mul(0.92).add(0.08)).mul(hv.mul(0.35).add(0.65)).mul(mix(smoothstep(0.15, 0.75, room).mul(0.75).add(0.35), float(0.85), pl)).mul(h.mul(0.5).add(0.55)).mul(flick).mul(on).mul(U.windowGlow).mul(0.52);
  });
  // [c3] what a window shows from inside: a sky with soft cloud, a skyline of roofs and gables, dark street below; at night deep blue with a few warm windows. The sky colour itself
  // is the engine's (SH.skyBase), so the hour of day stays right; the lattice adds leading and mullions. wp world position, N the pane normal, V the view direction.
  SH.paneOut = Fn(([wp, N, V]) => {
    const at2 = TSL.atan2 || TSL.atan, az = at2(V.x, V.z), el = V.y, nz = (u, v) => texture(G.noiseTex, vec2(u, v)).r;
    const sky = SH.skyBase(vec3(V.x, max(V.y, 0.03), V.z)).mul(0.55);
    const cloud = nz(az.mul(0.8), el.mul(1.6).add(0.2)).mul(0.22).add(0.89);
    const roof = nz(az.mul(1.1), 0.31).mul(0.2).add(nz(az.mul(3.7), 0.7).mul(0.07)).sub(0.06);
    const mask = smoothstep(roof.add(0.012), roof.sub(0.012), el);
    const cell = vec2(TSL.floor(az.mul(150)), TSL.floor(el.mul(150))), hv = TSL.fract(TSL.sin(dot(cell, vec2(127.1, 311.7))).mul(43758.5453));
    const spec = step(0.965, hv).mul(mask).mul(step(-0.12, el));
    const wall = mix(vec3(0.34, 0.30, 0.26), vec3(0.22, 0.20, 0.19), nz(az.mul(7), el.mul(9))).mul(sky.r.add(sky.g).add(sky.b).mul(0.45).add(0.04));
    const street = wall.mul(smoothstep(0.02, -0.25, el).mul(0.6).oneMinus());
    let col = mix(sky.mul(cloud), street, mask);
    col = col.mul(float(1).sub(spec.mul(float(1).sub(U.windowGlow)).mul(0.4))).add(vec3(1.0, 0.55, 0.2).mul(spec).mul(U.windowGlow).mul(0.5));
    /* [view] the town itself, drawn once from the house's own place when the player came in (56b_viewcube.js): the line of sight turned from the room's frame
       into the house's; the painted skyline above remains for a room with no house out of doors (the mine, the crypt) and when the map is switched off */
    if (typeof ViewCube !== 'undefined' && !ViewCube.off && TSL.cubeTexture) { const dw = vec3(V.x.mul(U.viewX.x).add(V.z.mul(U.viewZ.x)), V.y, V.x.mul(U.viewX.y).add(V.z.mul(U.viewZ.y))); const ct = ViewCube.base().sample(dw); col = mix(col, ct.rgb.mul(0.5), U.viewOn); }
    const hc = wp.x.mul(abs(N.z)).add(wp.z.mul(abs(N.x))), q = vec2(hc, wp.y).mul(4.2), a = q.x.add(q.y), b = q.x.sub(q.y);
    const lat = TSL.min(abs(TSL.fract(a).sub(0.5)), abs(TSL.fract(b).sub(0.5))), lead = smoothstep(0.03, 0.075, lat);
    return col.mul(lead.mul(0.88).add(0.12)).mul(float(1).sub(U.windowGlow).mul(TEST && TEST.pane === 0 ? 0 : 1.9).add(1));      // [l1] by day the sky in a pane is the brightest thing in a room
  });
  // tangent frame from screen derivatives, then a tangent-space normal (xy in 0..1) applied to the world normal N
  SH.perturb = Fn(([N, wp, uvn, nxy, strength]) => {
    const dp1 = dFdx(wp), dp2 = dFdy(wp), du1 = dFdx(uvn), du2 = dFdy(uvn);
    const det = du1.x.mul(du2.y).sub(du2.x.mul(du1.y)), sg = select(det.greaterThanEqual(0), float(1), float(-1));
    const T0 = dp1.mul(du2.y).sub(dp2.mul(du1.y)).mul(sg), B0 = dp2.mul(du1.x).sub(dp1.mul(du2.x)).mul(sg);
    const T = T0.sub(N.mul(dot(N, T0))), B = B0.sub(N.mul(dot(N, B0)));
    const tl = dot(T, T), bl = dot(B, B), n2 = nxy.mul(2).sub(1).mul(strength);
    const out = normalize(T.mul(max(tl, 1e-20).inverseSqrt().mul(n2.x)).add(B.mul(max(bl, 1e-20).inverseSqrt().mul(n2.y))).add(N.mul(sqrt(max(float(1).sub(dot(n2, n2)), 0.05)))));
    return mix(N, out, step(1e-14, tl).mul(step(1e-14, bl)));
  });
  // height fog with a sun-side glow; use as scene.fogNode = TSL.fog(SH.fogColor(), SH.fogAmount())
  SH.fogAmount = Fn(() => {
    const d = positionWorld.sub(U.camPos), dist = length(d), k = U.fogFall.mul(d.y);
    const ks = mix(k, float(0.002), step(abs(k), 0.002)), integ = dist.mul(float(1).sub(exp(ks.negate()))).div(ks);
    const dens = U.fogDens.mul(exp(U.fogFall.negate().mul(max(U.camPos.y.sub(K.fogBase), 0))));
    // [l1] a low mist: thick near the ground (3.5 m deep, measured from the camera's feet), thinning upward; dawn, dusk and wet weather
    const lay = U.mistK.mul(dist).mul(exp(max(positionWorld.y.sub(U.camPos.y.sub(1.7)), 0).div(-3.5)));
    return float(1).sub(exp(dens.negate().mul(integ).sub(lay)));
  });
  SH.fogColor = Fn(() => {
    const vd = normalize(positionWorld.sub(U.camPos)), s = pow(max(dot(vd, U.sunDisc), 0), 6);
    const moon = pow(max(dot(vd, U.moonDir), 0), 7).mul(U.moonBright).mul(0.09);          // [l1] the moon lights the mist round it
    return mix(U.fogCol, U.fogCol.add(U.fogSun.mul(0.6)), s).add(vec3(0.55, 0.75, 1.0).mul(moon));
  });
  // ── one wind ──
  // U.wind = direction x, direction z, strength, time. Gusts are a slow noise pattern that travels downwind across the valley; everything
  // that moves reads the gust at its own place, so a gust is seen to arrive: first the far trees, then the grass, then the washing.
  // (On the CPU the same field is Wind.gust(x, z), see 50_env.js.)
  SH.gust = Fn(([xz]) => noiseL(xz.sub(U.windOff).mul(0.013)).r.sub(0.42));          // about -0.4 (lull) .. 0.6 (gust)
  SH.gustK = Fn(([xz]) => U.wind.z.mul(max(SH.gust(xz).mul(1.7).add(0.7), 0.12)));      // wind speed felt at a place (Wind.feel on the CPU)
  // Things that hang (kit batches, see SH.hangOf in 50_env.js): kg.z = 1 - how freely the vertex moves, kg.w = 1 for cloth, else the
  // compass direction a board on chains can swing in. Cloth billows downwind and flutters; a sign swings across its own face.
  SH.hangSway = () => Fn(() => {
    const kg = TSL.attribute('kg', 'vec4'), w = kg.z.oneMinus(), p = TSL.positionLocal.toVar();
    If(w.greaterThan(0.012), () => {
      const k = SH.gustK(p.xz), t = U.wind.w, free = step(0.995, kg.w), ang = kg.w.mul(255 / 254 * 6.2831853), axis = vec2(TSL.cos(ang), TSL.sin(ang));
      const swing = dot(U.wind.xy, axis).mul(k).mul(0.085).add(TSL.sin(t.mul(2.7).add(p.x.mul(0.11)).add(p.z.mul(0.09))).mul(k).mul(0.05));
      const fl = TSL.sin(t.mul(5.3).add(p.x.mul(3.1)).add(p.z.mul(2.7)).add(p.y.mul(4.0))).mul(0.6).add(TSL.sin(t.mul(8.1).add(p.x.mul(5.3)).sub(p.y.mul(6.0))).mul(0.4));
      const cloth = U.wind.xy.mul(k.mul(0.15).add(fl.mul(k).mul(0.055)).mul(w.mul(w.mul(0.5).add(0.5))));
      const off = mix(axis.mul(swing.mul(w)), cloth, free);
      p.addAssign(vec3(off.x, mix(swing.mul(swing).mul(w).mul(0.5), k.mul(0.045).mul(w), free), off.y));
    });
    return p;
  })();
  // how far a point on a tree is pushed: root = the foot of the tree (world), p = the point relative to the foot, ww = how freely it moves, ph = the tree's own phase
  SH.sway = Fn(([root, p, ww, ph]) => {
    const g = SH.gust(root.xz), wt = U.wind.w, k = U.wind.z.mul(max(g.mul(1.7).add(0.7), 0.12)), y2 = p.y.mul(p.y);
    const lean = y2.mul(0.0008).mul(k).add(TSL.sin(wt.mul(0.9).add(ph)).mul(y2).mul(0.00032).mul(k));                       // the whole stem bends downwind and rocks slowly
    const flut = TSL.sin(wt.mul(2.3).add(ph.mul(1.7)).add(p.x.mul(1.3)).add(p.y.mul(0.9))).mul(0.6).add(TSL.sin(wt.mul(3.7).add(ph).add(p.z.mul(1.9))).mul(0.4)).mul(ww).mul(0.055).mul(k);
    const along = lean.add(flut);
    return vec3(U.wind.x.mul(along), flut.mul(0.45), U.wind.y.mul(along));
  });
  if (typeof Lamps !== 'undefined' && !G.lampTex) Lamps.init();
  SH.groundTint = (mn, mn2) => mix(vec3(0.80, 0.90, 0.70), vec3(1.16, 1.06, 0.80), mn.r).mul(mn2.a.mul(0.28).add(0.86));
};
// copies ENV (see 50_env.js) and the camera into the frame uniforms
SH.update = function (env, camPos, time) {
  const U = SH.U, s3 = (u, a) => u.value.set(a[0], a[1], a[2]);
  U.time.value = time; s3(U.camPos, camPos);
  s3(U.sunDir, env.keyDir); s3(U.sunCol, env.keyCol); s3(U.ambSky, env.ambSky); s3(U.ambGnd, env.ambGnd);
  s3(U.fogCol, env.fogCol); U.fogDens.value = env.fogDensity; U.mistK.value = env.mistK || 0; s3(U.fogSun, env.fogSun);
  s3(U.zenith, env.zenith); s3(U.horizon, env.horizon); U.stars.value = env.stars; U.aurora.value = env.aurora;
  s3(U.moonDir, env.moonDir); U.moonBright.value = env.moonBright; s3(U.sunDisc, env.sunDir); U.sunDiscI.value = env.sunDisc;
  U.wind.value.set(env.windDir[0], env.windDir[1], env.windStrength, time); U.windOff.value.set(Wind.off[0], Wind.off[1]);
  U.rain.value = env.rain || 0; U.wet.value = env.wet || 0;
  U.cloud.value = env.cloud; U.windowGlow.value = env.windowGlow; U.lakeY.value = World.lakeY || 0; U.indoor.value = World.indoor || 0;
};
