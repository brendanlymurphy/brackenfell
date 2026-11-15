// ───────────────────────── shared shading: frame uniforms and TSL helpers every material uses ─────────────────────────
// SH.init() must run after the textures in G exist. Other files take what they need from SH and from TSL inside their own closure,
// because TSL names such as clamp, mix or length would collide with the game's own maths helpers at the top level.
const SH = { U: null };
SH.init = function () {
  const { Fn, If, Loop, float, int, vec2, vec3, step, uniform, uniformArray, texture, positionWorld, mix, smoothstep, clamp, max, pow, exp, abs, dot, normalize, length, sqrt, select, dFdx, dFdy } = TSL;
  const V3 = () => new THREE.Vector3(), V4 = () => new THREE.Vector4();
  // one set of uniforms for the whole frame, written by renderFrame() from ENV
  const U = SH.U = {
    time: uniform(0), camPos: uniform(V3()),                 // camPos is always the player's eye, also inside shadow passes
    sunDir: uniform(new THREE.Vector3(0, 1, 0)), sunCol: uniform(V3()),      // active key light (sun or moon)
    ambSky: uniform(V3()), ambGnd: uniform(V3()),
    fogCol: uniform(V3()), fogDens: uniform(0.001), fogSun: uniform(V3()), fogFall: uniform(0.011),
    zenith: uniform(V3()), horizon: uniform(V3()), stars: uniform(0), aurora: uniform(0),
    moonDir: uniform(new THREE.Vector3(0, 1, 0)), moonBright: uniform(0), sunDisc: uniform(new THREE.Vector3(0, 1, 0)), sunDiscI: uniform(0),
    wind: uniform(V4()),                                      // dir.x, dir.z, strength, time
    cloud: uniform(0.45), grassRange: uniform(30), treeLod: uniform(65), windowGlow: uniform(0), lakeY: uniform(0), indoor: uniform(0),
    lightPos: uniformArray(Array.from({ length: 8 }, V4), 'vec4'),   // xyz, radius
    lightCol: uniformArray(Array.from({ length: 8 }, V4), 'vec4'),   // rgb, zone (255 = everywhere)
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
    const t = U.time, uvc = p.mul(0.00022).add(vec2(t.mul(0.0030), t.mul(0.0011)));
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
  SH.pointLights = Fn(([wp, N, zone, wrap]) => {
    const acc = vec3(0).toVar();
    Loop({ start: int(0), end: int(8), type: 'int', condition: '<' }, ({ i }) => {
      const lc = U.lightCol.element(i), lp = U.lightPos.element(i);
      const d = lp.xyz.sub(wp), d2 = dot(d, d), r2 = lp.w.mul(lp.w);
      If(abs(lc.w.sub(zone)).lessThan(0.5).or(lc.w.greaterThan(254.5)).and(d2.lessThan(r2)), () => {
        const f = float(1).sub(d2.div(r2)), att = f.mul(f).div(d2.mul(0.55).add(1));
        const ndl = dot(N, d).mul(max(d2, 1e-4).inverseSqrt()).add(wrap).div(float(1).add(wrap));
        acc.addAssign(lc.rgb.mul(att.mul(max(ndl, 0))));
      });
    });
    return acc;
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
    return float(1).sub(exp(dens.negate().mul(integ)));
  });
  SH.fogColor = Fn(() => {
    const s = pow(max(dot(normalize(positionWorld.sub(U.camPos)), U.sunDisc), 0), 6);
    return mix(U.fogCol, U.fogCol.add(U.fogSun.mul(0.6)), s);
  });
  SH.groundTint = (mn, mn2) => mix(vec3(0.80, 0.90, 0.70), vec3(1.16, 1.06, 0.80), mn.r).mul(mn2.a.mul(0.28).add(0.86));
};
// copies ENV (see 50_env.js) and the camera into the frame uniforms
SH.update = function (env, camPos, time) {
  const U = SH.U, s3 = (u, a) => u.value.set(a[0], a[1], a[2]);
  U.time.value = time; s3(U.camPos, camPos);
  s3(U.sunDir, env.keyDir); s3(U.sunCol, env.keyCol); s3(U.ambSky, env.ambSky); s3(U.ambGnd, env.ambGnd);
  s3(U.fogCol, env.fogCol); U.fogDens.value = env.fogDensity; s3(U.fogSun, env.fogSun);
  s3(U.zenith, env.zenith); s3(U.horizon, env.horizon); U.stars.value = env.stars; U.aurora.value = env.aurora;
  s3(U.moonDir, env.moonDir); U.moonBright.value = env.moonBright; s3(U.sunDisc, env.sunDir); U.sunDiscI.value = env.sunDisc;
  U.wind.value.set(env.windDir[0], env.windDir[1], env.windStrength, time);
  U.cloud.value = env.cloud; U.windowGlow.value = env.windowGlow; U.lakeY.value = World.lakeY || 0; U.indoor.value = World.indoor || 0;
};
