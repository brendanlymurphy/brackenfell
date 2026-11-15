// ───────────────────────── sky dome: gradient, stars, sun and moon, aurora, clouds ─────────────────────────
// A sphere that follows the camera. It is drawn after the opaque world with the depth test on, so only uncovered pixels pay for it.
const Sky = { mesh: null, radius: 10000 };
(() => {
  Sky.build = function (scene) {
    const { Fn, If, float, vec2, vec3, positionLocal, mix, smoothstep, max, pow, sin, dot, normalize, length, floor, fract, abs } = TSL;
    const U = SH.U, sat = SH.sat, noiseL = SH.noiseL;
    const h31 = (p, k) => fract(sin(dot(p, k)).mul(43758.5453));
    const m = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false });
    m.fog = false; m.toneMapped = false;
    m.colorNode = Fn(() => {
      const dir = normalize(positionLocal).toVar();
      const c = SH.skyBase(dir).toVar();
      const t = U.time;
      // stars
      If(U.stars.greaterThan(0.01).and(dir.y.greaterThan(-0.05)), () => {
        const sp = dir.mul(260), cell = floor(sp), f = fract(sp).sub(0.5);
        const rnd = h31(cell, vec3(127.1, 311.7, 74.7));
        If(rnd.greaterThan(0.955), () => {
          const off = vec3(h31(cell, vec3(269.5, 183.3, 246.1)), h31(cell, vec3(113.5, 271.9, 124.6)), h31(cell, vec3(71.3, 157.7, 311.3))).sub(0.5);
          const dd = length(f.sub(off.mul(0.6)));
          const tw = sin(t.mul(rnd.mul(40).add(2)).add(rnd.mul(100))).mul(0.25).add(0.75);
          const warm = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.88, 0.7), h31(cell, vec3(12.9, 78.2, 37.7)));
          c.addAssign(warm.mul(smoothstep(0.0, 0.16, dd).oneMinus().mul(rnd.sub(0.955)).mul(40).mul(tw).mul(U.stars).mul(smoothstep(-0.05, 0.25, dir.y))));
        });
      });
      // sun and moon discs
      const sd = dot(dir, U.sunDisc);
      c.addAssign(U.fogSun.mul(smoothstep(0.99985, 0.99995, sd).mul(U.sunDiscI)));
      const md = dot(dir, U.moonDir);
      If(md.greaterThan(0.9993), () => {
        const mr = sat(md.sub(0.9993).div(0.0007));
        const crater = noiseL(dir.xy.mul(300 * 0.02)).g;
        c.addAssign(vec3(0.78, 0.84, 1.0).mul(smoothstep(0.0, 0.25, mr).mul(crater.mul(0.6).add(0.55)).mul(U.moonBright)));
      });
      c.addAssign(vec3(0.3, 0.4, 0.6).mul(pow(max(md, 0), 300).mul(0.25).mul(U.moonBright)));
      // aurora over the northern peaks
      If(U.aurora.greaterThan(0.01).and(dir.y.greaterThan(0.04)), () => {
        const q = dir.xz.div(dir.y.add(0.32));
        const n = noiseL(vec2(q.x.mul(0.10).add(t.mul(0.003)), q.y.mul(0.03).add(t.mul(0.001)))).r;
        const curtain = pow(sat(abs(n.sub(0.5)).mul(6.5).oneMinus()), 2);
        const rays = noiseL(vec2(q.x.mul(1.9).add(q.y.mul(0.4)), t.mul(0.015))).a;
        const hgt = smoothstep(0.04, 0.3, dir.y).mul(smoothstep(0.45, 0.98, dir.y).oneMinus()).mul(smoothstep(-0.35, 0.45, dir.z.negate()));
        const ac = mix(vec3(0.08, 1.0, 0.42), vec3(0.55, 0.18, 0.95), smoothstep(0.28, 0.8, dir.y.add(rays.mul(0.2))));
        c.addAssign(ac.mul(curtain.mul(rays.mul(1.1).add(0.35)).mul(hgt).mul(U.aurora).mul(0.5)));
      });
      // clouds: one flat layer high above, lit from the sun side
      If(dir.y.greaterThan(0.012), () => {
        const pc = U.camPos.xz.add(dir.xz.mul(float(K.cloudH).sub(U.camPos.y).div(dir.y)));
        const dens = SH.cloudDensity(pc).toVar();
        If(dens.greaterThan(0.003), () => {
          const det = noiseL(pc.mul(0.0031).add(vec2(t.mul(0.004), 0))).a;
          dens.assign(sat(dens.mul(det.mul(0.6).add(0.72))));
          const toward = SH.cloudDensity(pc.add(U.sunDisc.xz.mul(260)));
          const lit = sat(float(1.15).sub(toward.mul(1.1)));
          const sunlit = U.sunCol.mul(0.5).add(U.ambSky).add(U.fogSun.mul(pow(max(sd, 0), 4).mul(0.5)));
          const dark = U.ambSky.mul(0.55).add(U.horizon.mul(0.25));
          const cc = mix(dark, sunlit, lit.mul(dens.oneMinus().mul(0.45).add(0.55)));
          const fade = smoothstep(0.012, 0.20, dir.y);
          c.assign(mix(c, mix(U.horizon, cc, fade), dens.mul(fade).mul(0.94)));
        });
      });
      return c;
    })();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), m);
    mesh.scale.setScalar(Sky.radius); mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false;
    mesh.renderOrder = 1000;          // last among the opaque draws
    mesh.name = 'sky';
    scene.add(mesh); Sky.mesh = mesh;
    return mesh;
  };
  Sky.update = function (camPos) {
    if (Sky.mesh) { Sky.mesh.position.set(camPos[0], camPos[1], camPos[2]); Sky.mesh.updateMatrixWorld(); }
  };
})();
