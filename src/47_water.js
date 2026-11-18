// ───────────────────────── water surface and lit window panes ─────────────────────────
// Both are used on meshes built by the world code: attributes position, uv, 'tint' (Uint8 x4 normalized) and 'mm' (Uint8 x4 normalized).
let WaterMat, GlowMat;
(() => {
  let water = null, glow = null;
  // River and lake: uv carries the flow direction, tint.a the water depth (0 at the bank .. 1).
  WaterMat = function () {
    if (water) return water;
    const { Fn, float, vec2, vec3, vec4, attribute, texture, uv, positionWorld, mix, smoothstep, max, pow, abs, dot, normalize, reflect } = TSL;
    const U = SH.U, sat = SH.sat;
    const m = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const noise = uvn => texture(G.noiseTex, uvn);
    const res = Fn(() => {
      const t = U.time, wp = positionWorld, p = wp.xz, fd = uv(), depth = attribute('tint', 'vec4').a;
      const n1 = noise(p.mul(0.09).sub(fd.mul(t.mul(0.05)))).rg;
      const n2 = noise(p.mul(0.23).sub(fd.mul(t.mul(0.09))).add(vec2(0.37, 0.11))).ga;
      const n3 = noise(p.sub(U.windOff.mul(0.05)).mul(0.71)).rb;                 // the fine ripples run before the wind
      const nn = n1.add(n2.mul(0.7)).add(n3.mul(0.35)).sub(1.025);
      const N = normalize(vec3(nn.x.mul(0.55), 1.0, nn.y.mul(0.55)));
      const V = normalize(U.camPos.sub(wp));
      const fres = pow(sat(dot(N, V).oneMinus()), 5).mul(0.975).add(0.025);
      const R0 = reflect(V.negate(), N), R = vec3(R0.x, abs(R0.y), R0.z);
      const refl = SH.skyBase(R).toVar();
      const pc = U.camPos.xz.add(R.xz.mul(float(K.cloudH).div(max(R.y, 0.05))));
      const cl = SH.cloudDensity(pc).mul(smoothstep(0.04, 0.25, R.y));
      refl.assign(mix(refl, U.sunCol.mul(0.45).add(U.ambSky.mul(0.9)), cl.mul(0.8)));
      refl.assign(mix(vec3(0.02, 0.045, 0.03).mul(U.ambSky.mul(2.0).add(U.sunCol.mul(0.3))), refl, smoothstep(0.015, 0.16, R.y)));   // dark far bank
      const spec = U.sunCol.mul(pow(max(dot(R, U.sunDir), 0), 260).mul(7.0));
      const body = vec3(0.03, 0.085, 0.075).mul(U.ambSky.mul(1.2).add(U.sunCol.mul(0.35)));
      const foam = smoothstep(0.0, 0.16, depth).oneMinus().mul(smoothstep(0.35, 0.75, n3.x.add(n1.y.mul(0.6))));
      const col = mix(mix(body, refl, fres).add(spec), U.ambSky.add(U.sunCol.mul(0.6)).mul(0.75), foam.mul(0.6));
      const alpha = max(mix(0.30, 0.94, smoothstep(0.0, 0.7, depth)), fres).mul(smoothstep(0.0, 0.39, depth));
      return vec4(col, max(alpha, foam.mul(0.5)));
    })();
    m.colorNode = res.rgb; m.opacityNode = res.a;
    m.toneMapped = false;
    return (water = m);
  };
  // Window panes after dusk: a leaded lattice, each pane a little different, added on top of the wall. mm.w * 255 / 16 is the strength.
  GlowMat = function () {
    if (glow) return glow;
    const { Fn, vec2, vec3, attribute, uv, positionWorld, smoothstep, min, abs, sin, exp, dot, floor, fract, length } = TSL;
    const U = SH.U;
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    m.fog = false; m.toneMapped = false;
    m.colorNode = Fn(() => {
      const wp = positionWorld, tint = attribute('tint', 'vec4'), strength = attribute('mm', 'vec4').w.mul(255).round().mul(0.0625);
      const q = uv().mul(vec2(4.0, 5.0));
      const lat = min(abs(fract(q.x.add(q.y)).sub(0.5)), abs(fract(q.x.sub(q.y)).sub(0.5)));
      const pane = smoothstep(0.02, 0.08, lat);
      const id = floor(vec2(q.x.add(q.y), q.x.sub(q.y)));
      const hv = fract(sin(dot(id, vec2(127.1, 311.7))).mul(43758.5453));
      const flick = sin(U.time.mul(7.0).add(wp.x.mul(3.0)).add(wp.z.mul(5.0))).mul(0.1).add(0.9);
      const fade = exp(U.fogDens.negate().mul(length(wp.sub(U.camPos))).mul(0.6));
      return tint.rgb.mul(tint.rgb).mul(pane.mul(hv.mul(0.5).add(0.65)).mul(flick).mul(U.windowGlow).mul(strength).mul(fade));
    })();
    return (glow = m);
  };
})();
