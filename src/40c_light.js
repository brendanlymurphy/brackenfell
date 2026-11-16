// ───────────────────────── [l1] window light: daylight that comes from the panes, not from a uniform lift ─────────────────────────
// Rooms with windows used to get the day's ambient multiplied up evenly (Cells.env, CELL_DAYLIGHT), so a room was as bright in its far corner as at the glass.
// Now a cell that knows its windows (c.wins, filled by Bake.interior in 72m_bake.js) gets a small ambient and up to SH.WINMAX window lights: each is a soft
// cool light that falls off with distance, lights what is in front of the pane (a floor pool, the facing wall) and not what is behind it.
// Same loop shape as SH.pointLights; only drawn indoors (zone != 0), and the loop does not run at all outdoors.
SH.WINMAX = 6;
(function () {
  const _init = SH.init;
  SH.init = function () {
    _init.apply(this, arguments);
    const { Fn, If, Loop, int, float, vec3, uniform, uniformArray, dot, max, select, smoothstep } = TSL, U = SH.U;
    const mk = () => uniformArray(Array.from({ length: SH.WINMAX }, () => new THREE.Vector4()), 'vec4');
    U.winP = mk();         // xyz: centre of the pane, w: reach (m)
    U.winD = mk();         // x, y: inward direction on the floor plane (x, z), z: unused, w: unused
    U.winC = mk();         // rgb: colour of the light in HDR units
    U.winN = uniform(0, 'int');
    SH.winLight = Fn(([wp, N, zone]) => {
      const acc = vec3(0).toVar();
      const nEnd = select(zone.lessThan(0.5), int(0), U.winN);
      Loop({ start: int(0), end: nEnd, type: 'int', condition: '<' }, ({ i }) => {
        const P = U.winP.element(i), D = U.winD.element(i), C = U.winC.element(i);
        const d = wp.sub(P.xyz), d2 = dot(d, d), r2 = P.w.mul(P.w);
        If(d2.lessThan(r2), () => {
          const f = float(1).sub(d2.div(r2)), dn = d.mul(max(d2, 1e-4).inverseSqrt());
          const lobe = smoothstep(-0.9, 0.45, dot(vec3(D.x, 0, D.y), dn));          // only in front of the pane
          const ndl = max(dot(N, dn.negate()).mul(0.7).add(0.3), 0);                 // surfaces that face the glass catch more
          const up = float(1).sub(TSL.clamp(d.y.sub(0.2).div(1.5), 0, 1).mul(0.75));      // above the glass the light thins out: ceilings stay dark
          acc.addAssign(C.rgb.mul(f.mul(f).div(d2.mul(0.18).add(1)).mul(lobe).mul(ndl).mul(up)));
        });
      });
      return acc;
    });
  };
  // firelight on worn wood: a soft highlight from the room's lights on glossy boards and table tops (indoors only; the loop does not run outdoors)
  SH.pointSpec = null;
  const _init2 = SH.init;
  SH.init = function () {
    _init2.apply(this, arguments);
    const { Fn, If, Loop, int, float, vec3, dot, max, select, abs, pow, normalize } = TSL, U = SH.U;
    SH.pointSpec = Fn(([wp, N, V, gloss, zone]) => {
      const acc = vec3(0).toVar(), shin = gloss.mul(46).add(6);
      const nEnd = select(zone.lessThan(0.5), int(0), U.lightN);
      Loop({ start: int(0), end: nEnd, type: 'int', condition: '<' }, ({ i }) => {
        const lc = U.lightCol.element(i), lp = U.lightPos.element(i), d = lp.xyz.sub(wp), d2 = dot(d, d), r2 = lp.w.mul(lp.w);
        If(abs(lc.w.sub(zone)).lessThan(0.5).or(lc.w.greaterThan(254.5)).and(d2.lessThan(r2)), () => {
          const f = float(1).sub(d2.div(r2)), att = f.mul(f).div(d2.mul(0.55).add(1)), L = d.mul(max(d2, 1e-4).inverseSqrt()), H = normalize(L.add(V));
          acc.addAssign(lc.rgb.mul(att.mul(pow(max(dot(N, H), 0), shin))));
        });
      });
      return acc.mul(gloss);
    });
  };
  // choose the windows of the cell the camera is in (the nearest few) and write the uniforms; env.winCol is set by Cells.env
  SH.winSet = function (env, cam) {
    const U = SH.U, c = World.cell, W = c && c.wins;
    if (!U || !U.winP) return;
    if (!W || !W.length || !env.winCol) { U.winN.value = 0; if (Bake.shaftU) Bake.shaftU.value = 0; return; }
    const cand = W.filter(w => Math.abs(w.p[1] - cam[1]) < 2.6).map(w => [(w.p[0] - cam[0]) ** 2 + (w.p[2] - cam[2]) ** 2, w]).sort((a, b) => a[0] - b[0]).slice(0, SH.WINMAX);
    const P = U.winP.array, D = U.winD.array, C = U.winC.array, col = env.winCol;
    cand.forEach(([, w], i) => { P[i].set(w.p[0], w.p[1], w.p[2], w.r); D[i].set(w.d[0], w.d[1], 0, 0); const tc = w.c || [1, 1, 1]; C[i].set(col[0] * w.k * tc[0], col[1] * w.k * tc[1], col[2] * w.k * tc[2], 0); });
    U.winN.value = cand.length;
    if (Bake.shaftU) Bake.shaftU.value = Math.min(0.5, (col[0] + col[1] + col[2]) / 3 * (TEST && TEST.shaft !== undefined ? +TEST.shaft : 0.009));
  };
})();
