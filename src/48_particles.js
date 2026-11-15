// ───────────────────────── billboards: glows, smoke, flames, embers, fireflies ─────────────────────────
// One instanced quad fed from R.partData (12 floats per particle: x y z size | r g b a | rot kind aspect seed), R.partCount of them.
// kind 0 soft additive glow, 1 smoke puff (alpha), 2 flame tongue (upright), 3 ember / firefly. Output is premultiplied.
const Particles = { mesh: null };
(() => {
  Particles.build = function (scene) {
    if (Particles.mesh) { if (Particles.mesh.parent) Particles.mesh.parent.remove(Particles.mesh); Particles.mesh.geometry.dispose(); Particles.mesh.material.dispose(); Particles.mesh = null; }
    const { Fn, If, float, vec2, vec3, vec4, attribute, texture, positionWorld, cameraWorldMatrix, mix, smoothstep, max, min, pow, abs, sin, cos, exp, dot, normalize, distance, select } = TSL;
    const U = SH.U, sat = SH.sat, noiseL = SH.noiseL;
    if (!R.partData) R.partData = new Float32Array((R.partMax || 1536) * 12);
    const max_ = R.partData.length / 12;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    const ib = new THREE.InstancedInterleavedBuffer(R.partData, 12, 1); ib.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('ps', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('pcol', new THREE.InterleavedBufferAttribute(ib, 4, 4)); g.setAttribute('prm', new THREE.InterleavedBufferAttribute(ib, 4, 8));
    g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const m = new THREE.NodeMaterial();
    m.transparent = true; m.depthWrite = false; m.side = THREE.DoubleSide; m.fog = false; m.lights = false; m.toneMapped = false;
    m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
    const ps = attribute('ps', 'vec4'), pcol = attribute('pcol', 'vec4'), prm = attribute('prm', 'vec4'), corner = attribute('position', 'vec3').xy;
    const vNear = TSL.varyingProperty('float', 'vPartNear');       // fades a glow or spark out as it passes through the eye
    m.positionNode = Fn(() => {
      const camR = normalize(cameraWorldMatrix.mul(vec4(1, 0, 0, 0)).xyz), camU = normalize(cameraWorldMatrix.mul(vec4(0, 1, 0, 0)).xyz);
      const upright = prm.y.greaterThan(1.5).and(prm.y.lessThan(2.5));          // flames stand up instead of tilting with the view
      const right = select(upright, normalize(vec3(camR.x, 0, camR.z)), camR), up = select(upright, vec3(0, 1, 0), camU);
      const cr = cos(prm.x), sr = sin(prm.x);
      const cc = vec2(corner.x.mul(cr).sub(corner.y.mul(sr)), corner.x.mul(sr).add(corner.y.mul(cr)));
      // glows and sparks are never drawn larger than a set angle: a firefly at arm's length stays a speck and a lamp's halo near the eye stays a halo
      const dEye = distance(ps.xyz, U.camPos), lim = select(prm.y.lessThan(0.5), float(0.17), select(prm.y.greaterThan(2.5), float(0.02), float(1e6)));
      const size = min(ps.w, dEye.mul(lim));
      vNear.assign(select(prm.y.greaterThan(2.5), smoothstep(0.2, 0.9, dEye), select(prm.y.lessThan(0.5), smoothstep(0.1, 0.6, dEye), float(1))));
      const wp = ps.xyz.add(right.mul(cc.x).add(up.mul(cc.y.mul(prm.z))).mul(size));
      return wp.add(normalize(U.camPos.sub(ps.xyz)).mul(min(size.mul(0.35), 0.3)));      // pull toward the eye so sprites don't slice into walls (capped: a big glow must not float in front of its fire)
    })();
    m.fragmentNode = Fn(() => {
      const q = corner, wp = positionWorld, r2 = dot(q, q), kind = prm.y, seed = prm.w;
      const n = texture(G.noiseTex, q.mul(0.21).add(vec2(seed.mul(7.3), seed.mul(3.1).sub(U.time.mul(0.05)))));
      const fogf = exp(U.fogDens.negate().mul(distance(wp, U.camPos)).mul(0.5));
      const out = vec4(0).toVar();
      If(kind.lessThan(0.5), () => {                       // soft additive glow
        const a = exp(r2.mul(-4.5)).mul(smoothstep(0.7, 1.0, r2).oneMinus());
        out.assign(vec4(pcol.rgb.mul(a.mul(pcol.a).mul(fogf).mul(vNear)), 0));
      }).ElseIf(kind.lessThan(1.5), () => {                // smoke puff, lit by the sky
        const a = sat(r2.oneMinus().mul(n.r.mul(1.3).add(0.35)).sub(0.25)).mul(pcol.a);
        const lit = U.ambSky.mul(1.3).add(U.sunCol.mul(0.35)).mul(pcol.rgb);
        out.assign(vec4(mix(lit, SH.fogColor(), SH.fogAmount()).mul(a), a));
      }).ElseIf(kind.lessThan(2.5), () => {                // flame tongue: a teardrop that sways and is eaten away from the top by rising noise
        const y = q.y.mul(0.5).add(0.5), tm = U.time.mul(1.7).add(seed.mul(31.0));
        const turb = smoothstep(0.06, 0.30, ps.w);          // candles burn steadily, hearth fires lick and tear
        const nA = noiseL(vec2(q.x.mul(0.10).add(seed), y.mul(0.13).sub(tm.mul(0.25)))).g;
        const nB = noiseL(vec2(q.x.mul(0.21).add(seed.mul(2.0)), y.mul(0.27).sub(tm.mul(0.50)))).r;
        const nC = noiseL(vec2(q.x.mul(0.47).add(seed.mul(3.0)), y.mul(0.60).sub(tm.mul(1.05)))).b;
        const x = q.x.add(nA.sub(0.5).mul(mix(0.35, 1.5, turb)).mul(y).mul(y.add(0.25)));
        const rad = pow(sat(y.oneMinus()), 0.6).mul(smoothstep(0.0, 0.22, y).mul(0.5).add(0.5)).mul(mix(0.36, 0.56, turb));
        const d = abs(x).div(max(rad, 0.02)), near = sat(float(1.5).sub(d));     // noise may push tongues a little past the outline, never far from it
        const heat = sat(d.oneMinus()).mul(float(1.2).sub(y.mul(0.5)))
          .add(nB.sub(0.5).mul(y).mul(mix(0.4, 2.1, turb)).mul(near)).add(nC.sub(0.5).mul(y.mul(0.8).add(0.2)).mul(mix(0.1, 1.0, turb)).mul(near))
          .sub(y.mul(y).mul(mix(2.6, 0.34, turb))).mul(smoothstep(0.0, 0.05, y));
        const a = smoothstep(0.06, 0.42, heat), core = smoothstep(0.58, 1.08, heat);
        const fc = mix(mix(vec3(1.0, 0.10, 0.01), vec3(1.0, 0.46, 0.08), smoothstep(0.10, 0.50, heat)), vec3(1.0, 0.86, 0.58), core).toVar();
        fc.addAssign(vec3(0.10, 0.22, 0.75).mul(smoothstep(0.30, 0.02, y).mul(sat(d.oneMinus())).mul(turb.oneMinus()).mul(0.7)));   // the blue foot of a candle flame
        out.assign(vec4(fc.mul(a.mul(core.mul(0.8).add(0.36))).mul(pcol.a.mul(mix(1.9, 1.0, turb))).mul(pcol.rgb), 0));
      }).Else(() => {                                      // firefly / ember
        out.assign(vec4(pcol.rgb.mul(exp(r2.mul(-7.0)).mul(pcol.a).mul(fogf).mul(vNear)), 0));
      });
      return out;
    })();
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 2000; mesh.name = 'particles';
    scene.add(mesh);
    Object.assign(Particles, { mesh, buffer: ib, capacity: max_ });
    return mesh;
  };
  Particles.update = function () {
    const mesh = Particles.mesh; if (!mesh) return;
    const n = Math.min(R.partCount | 0, Particles.capacity);
    mesh.geometry.instanceCount = n; mesh.visible = n > 0;
    if (n > 0) { const b = Particles.buffer; b.clearUpdateRanges(); b.addUpdateRange(0, n * 12); b.needsUpdate = true; }
  };
})();
