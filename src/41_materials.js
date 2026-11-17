// ───────────────────────── materials: buildings and props, terrain, foliage ─────────────────────────
// The sun (diffuse, specular, shadow) is Three's own DirectionalLight. Everything else a surface receives (sky and ground
// ambient, hearth and lantern light limited to its own zone, glowing geometry) is added through emissiveNode with the SH helpers.
function gfxDataTex(data, w, h, format, type) {
  const t = new THREE.DataTexture(data, w, h, format, type);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}
// tree / rock instance transform with wind; ipos = xyz scale, iprm = yaw, tint, phase
function instNodes(noLod) {
  const { Fn, vec3, attribute, positionLocal, normalLocal, cos, sin, distance, select, float } = TSL, U = SH.U;
  const ipos = attribute('ipos', 'vec4'), iprm = attribute('iprm', 'vec4'), lod = attribute('mm', 'vec4').w.mul(255).round();
  const pos = Fn(() => {
    const c = cos(iprm.x), s = sin(iprm.x), ww = attribute('wind', 'float');
    // vertex lod 3 marks the one boulder shape: every instance squashes it by its own random amounts (iprm.y, iprm.z), so one mesh gives many shapes
    const sq = TSL.mix(vec3(1, 1, 1), vec3(iprm.y.mul(0.55).add(0.8), iprm.z.mul(0.4).add(0.8), float(1.3).sub(iprm.y.mul(0.55))), TSL.step(2.5, lod)), lp = positionLocal.mul(ipos.w).mul(sq);
    const p = vec3(lp.x.mul(c).add(lp.z.mul(s)), lp.y, lp.x.negate().mul(s).add(lp.z.mul(c)));
    // the same sway as the scanned trees (SH.sway): the stem leans with the gust passing over it, leaves flutter on top
    const w = p.add(SH.sway(ipos.xyz, p, ww, iprm.z.mul(40))).add(ipos.xyz);
    // full trees near the player, flat stand-ins beyond; measured from the player even while a shadow map is drawn
    const d = distance(ipos.xyz, U.camPos);
    const far = TSL.step(U.treeLod, d), is1 = TSL.step(TSL.abs(lod.sub(1)), 0.5), is2 = TSL.step(TSL.abs(lod.sub(2)), 0.5);
    return noLod ? w : TSL.mix(w, vec3(0, -20000, 0), is1.mul(far).add(is2.mul(far.oneMinus())));
  })();
  const c = cos(iprm.x), s = sin(iprm.x), n = normalLocal;
  const nrm = vec3(n.x.mul(c).add(n.z.mul(s)), n.y, n.x.negate().mul(s).add(n.z.mul(c)));
  const tintK = TSL.mix(vec3(0.80, 0.86, 0.80), vec3(1.16, 1.06, 0.84), iprm.y);
  return { pos, nrm, tintK, float };
}
// mode: 'static' world-space geometry | 'inst' instanced trunks and rocks | 'rigid' objects moved by their matrix | 'skin' two-bone villagers
function surfaceMaterial(mode) {
  const { float, int, vec3, vec4, attribute, texture, uv, varying, uniform, uniformArray, positionWorld, positionLocal, normalLocal, normalWorld, mix, mod, step, normalize, transformNormalToView } = TSL;
  const m = new THREE.MeshStandardNodeMaterial();
  const mm = attribute('mm', 'vec4').mul(255).round(), tint = attribute('tint', 'vec4');
  let vN, tintLin = tint.rgb.mul(tint.rgb), zone = float(0), light = float(1), unlit = float(0);
  if (mode === 'static') { vN = varying(normalLocal); zone = mm.y; unlit = step(1.5, mod(mm.z, 4)); }
  else if (mode === 'inst') { const I = instNodes(); m.positionNode = I.pos; vN = varying(I.nrm); tintLin = varying(tintLin.mul(I.tintK)); }
  else if (mode === 'rigid') { vN = TSL.normalWorldGeometry; }
  else {
    const bones = uniformArray(Array.from({ length: 16 }, () => new THREE.Matrix4()), 'mat4');
    const zoneU = uniform(0), lightU = uniform(1);
    const b0 = bones.element(int(mm.y)), b1 = bones.element(int(mm.z)), w1 = mm.w.div(255);
    const p4 = vec4(positionLocal, 1), n4 = vec4(normalLocal, 0);
    m.positionNode = mix(b0.mul(p4).xyz, b1.mul(p4).xyz, w1);
    vN = varying(mix(b0.mul(n4).xyz, b1.mul(n4).xyz, w1));
    zone = zoneU; light = lightU; m.userData = { bones: bones.array, zoneU, lightU };
  }
  const layer = int(mm.x), a = texture(G.albedoArr, uv()).depth(layer), nt = texture(G.narArr, uv()).depth(layer);
  const albedo = a.rgb.mul(mix(vec3(1), tintLin, a.a));
  const N = SH.perturb(normalize(vN), positionWorld, uv(), nt.xy, float(1));
  // rooms: occlusion near floor, ceiling and corners, soot over the hearth (40b_depth.js); only generated room geometry and people carry a zone
  const rm = (mode === 'static' || mode === 'skin') ? SH.room(positionWorld, N, zone).toVar() : null, aoR = rm ? rm.x : float(1);
  let amb = SH.hemi(N, tint.a.mul(light).mul(nt.z).mul(aoR), zone).add(SH.pointLights(positionWorld, N, zone, float(0.25)).mul(mix(float(0.6), 1.0, nt.z)).mul(aoR.mul(0.65).add(0.35))).add(SH.winLight(positionWorld, N, zone).mul(aoR.mul(0.6).add(0.4)));      // [l1] window light (40c_light.js)
  if (!(TEST && TEST.shade === 0)) amb = amb.add(SH.U.ambSky.mul(0.3).add(SH.U.sunCol.mul(0.035)).mul(vec3(0.85, 0.95, 1.1)).mul(float(1).sub(step(0.5, zone))).mul(tint.a.mul(0.5).add(0.5)));      // [l1] shade keeps a floor of sky and bounce: bark, posts and fences do not go black out of the sun
  const sootK = rm ? mix(vec3(1), vec3(0.22, 0.21, 0.2), rm.z.mul(0.9)) : vec3(1);
  m.colorNode = albedo.mul(sootK).mul(unlit.oneMinus());
  m.emissiveNode = albedo.mul(sootK).mul(mix(amb, vec3(mm.w.div(16)), unlit)).add(mode === 'static' && !(TEST && TEST.gloss === 0) ? SH.pointSpec(positionWorld, N, normalize(SH.U.camPos.sub(positionWorld)), step(TSL.abs(mm.x.sub(MAT.PLANKS)), 0.5).mul(0.5), zone).mul(0.16) : vec3(0));      // [l1] worn planks catch the firelight
  m.normalNode = transformNormalToView(N);
  m.roughnessNode = (TEST && TEST.rough === 0) ? nt.w : TSL.max(nt.w, float(0.8).mul(float(1).sub(step(0.5, zone))));      // [l1] nothing dry out of doors sparkles: a rough floor on every static and rigid surface
  m.metalnessNode = float(0);
  return m;
}
// leaf cards: cut-out, lit from both sides, a little sun shining through
// noLod: the copy that only the wide shadow map draws, where every tree is its flat stand-in whatever the distance
function foliageMaterial(noLod) {
  const { float, int, vec3, attribute, texture, uv, varying, positionWorld, normalize, transformNormalToView, pow, dot, max } = TSL, U = SH.U;
  const m = new THREE.MeshLambertNodeMaterial();
  const I = instNodes(noLod), mm = attribute('mm', 'vec4').mul(255).round(), tint = attribute('tint', 'vec4');
  m.positionNode = I.pos;
  const vN = varying(I.nrm), vTint = varying(tint.rgb.mul(tint.rgb).mul(I.tintK)), sky = varying(tint.a);
  const a = texture(G.albedoArr, uv()).depth(int(mm.x)), raw = a.rgb.mul(vTint), N = normalize(vN);
  // leaves were the brightest, most saturated thing in the valley (and glowed at night): take them down toward the ground's values
  const albedo = TSL.mix(vec3(dot(raw, vec3(0.2126, 0.7152, 0.0722))), raw, 0.72).mul(0.62);
  const V = normalize(U.camPos.sub(positionWorld)), back = pow(SH.sat(dot(V, U.sunDir.negate())), 3).mul(0.55);
  // sharpen the cut-out to about one pixel so multisampling can smooth the leaf edges
  m.colorNode = albedo; m.opacityNode = SH.sat(a.a.sub(0.45).div(max(TSL.fwidth(a.a), 0.001)).add(0.5)); m.alphaTest = 0.5;
  m.normalNode = transformNormalToView(normalize(N.add(U.sunDir.mul(0.6))));      // wrap the sun around the crown
  m.emissiveNode = albedo.mul(SH.hemi(N, sky, float(0)).add(SH.pointLights(positionWorld, N, float(0), float(0.6))).add(vec3(1.3, 1.25, 0.6).mul(U.sunCol).mul(back.mul(sky).mul(0.3))));
  m.side = THREE.DoubleSide;
  return m;
}
// terrain: scanned ground layers blended by painted masks, slope and their own height
function terrainMaterial() {
  const { Fn, If, float, int, vec2, vec3, vec4, property, texture, varying, positionWorld, normalLocal, mix, smoothstep, step, max, pow, abs, sin, dot, normalize, length, distance, reflect, dFdx, dFdy, transformNormalToView } = TSL;
  const U = SH.U, sat = SH.sat, TH = K.terrainHalf, wp = positionWorld, vN = varying(normalLocal);
  const m = new THREE.MeshStandardNodeMaterial();
  const pN = property('vec3'), pRough = property('float'), pEmis = property('vec3');
  m.colorNode = Fn(() => {
    const r = length(wp.xz), dist = distance(wp, U.camPos);
    const inside = step(abs(wp.x), TH).mul(step(abs(wp.z), TH)), suv = wp.xz.div(2 * TH).add(0.5);
    const sp = texture(G.splatTex, suv).mul(inside).toVar(), s2 = texture(G.splat2Tex, suv).mul(inside).toVar();      // sp: r road, g cobbles, b field, a bare
    const mn = texture(G.noiseTex, wp.xz.mul(0.0041)).toVar(), mn2 = texture(G.noiseTex, wp.xz.mul(0.037)).toVar(), mn3 = texture(G.noiseTex, wp.xz.mul(0.23)).toVar();
    const dn = texture(G.noiseTex, wp.xz.mul(0.0013)).zw.sub(0.5);
    const Nv = normalize(vN.add(vec3(dn.x, 0, dn.y).mul(smoothstep(260, 700, r).mul(1.1)))).toVar();
    const slope = Nv.y.oneMinus();
    const uvG = wp.xz.div(3).toVar(), uvF = wp.xz.div(14).add(vec2(0.37, 0.11)).toVar(), uvC = wp.xz.div(2.5).toVar(), uvR = vec2(wp.x, wp.y.mul(1.3)).mul(0.16).toVar(), uvR2 = vec2(wp.z.add(7.3), wp.y.mul(1.3)).mul(0.16).toVar();       // rock is mapped on two vertical planes (x-y and z-y) and blended by the facing, so no cliff smears
    const dGx = dFdx(uvG).toVar(), dGy = dFdy(uvG).toVar(), dFx = dFdx(uvF).toVar(), dFy = dFdy(uvF).toVar(), dCx = dFdx(uvC).toVar(), dCy = dFdy(uvC).toVar(), dRx = dFdx(uvR).toVar(), dRy = dFdy(uvR).toVar(), dR2x = dFdx(uvR2).toVar(), dR2y = dFdy(uvR2).toVar();
    const det = dist.lessThan(56);                              // normal maps only matter near the camera (one sample less per layer beyond that)
    const farK = smoothstep(16, 55, dist).toVar();
    const wRock = sat(slope.sub(0.24).add(mn2.r.sub(0.5).mul(0.22)).sub(smoothstep(120, 300, wp.y).mul(0.12)).mul(7)).toVar();
    const wSnow = smoothstep(400, 540, wp.y.add(mn.r.mul(170))).mul(smoothstep(0.30, 0.60, slope).oneMinus()).toVar();
    const wFar = smoothstep(300, 480, r).mul(wRock.mul(0.7).oneMinus()).mul(smoothstep(210, 330, wp.y.add(mn.g.mul(90))).oneMinus());
    const tintG = SH.groundTint(mn, mn2).toVar();
    const samp = (layer, uvn, dx, dy) => {
      const a = texture(G.albedoArr, uvn).depth(int(layer)).grad(dx, dy).toVar();
      const o = { c: a.rgb.toVar(), h: a.a.toVar(), n: vec2(0.5).toVar(), ao: float(1).toVar(), r: float(0.9).toVar() };
      If(det, () => { const t = texture(G.narArr, uvn).depth(int(layer)).grad(dx, dy).toVar(); o.n.assign(t.xy); o.ao.assign(t.z); o.r.assign(t.w); });
      return o;
    };
    // meadow: a near and a far repeat of the same scan, cross-faded, so it is sharp underfoot and never a grid on the hills
    const G0 = samp(MAT.GRASS, uvG, dGx, dGy);
    If(farK.greaterThan(0.01), () => { const f = texture(G.albedoArr, uvF).depth(int(MAT.GRASS)).grad(dFx, dFy).toVar(); G0.c.assign(mix(G0.c, f.rgb, farK.mul(0.85))); G0.h.assign(mix(G0.h, f.a, farK)); });
    G0.c.mulAssign(tintG);
    // b shows through first where b's own surface stands higher, so borders follow pebbles and tufts instead of fading
    const over = (b, w) => {
      const k = sat(w.sub(0.5).mul(3).add(b.h.sub(G0.h).mul(1.4)).add(0.5)).mul(smoothstep(0, 0.10, w)).toVar();
      G0.c.assign(mix(G0.c, b.c, k)); G0.h.assign(mix(G0.h, b.h, k)); G0.n.assign(mix(G0.n, b.n, k)); G0.ao.assign(mix(G0.ao, b.ao, k)); G0.r.assign(mix(G0.r, b.r, k));
    };
    const w2 = sat(sat(mn.g.sub(0.47).mul(6).add(mn2.r.sub(0.5).mul(1.6))).mul(0.8).add(s2.a.mul(1.2))).toVar();
    If(w2.greaterThan(0.004).and(U.terrLayers.greaterThan(0.5)), () => { const g2 = samp(MAT.GRASS2, uvG.mul(1.31), dGx.mul(1.31), dGy.mul(1.31)); g2.c.mulAssign(tintG); over(g2, w2); });
    If(s2.r.greaterThan(0.004), () => { over(samp(MAT.FOREST, uvG, dGx, dGy), s2.r); });
    G0.c.assign(mix(G0.c, vec3(0.030, 0.062, 0.030).mul(mn2.r.mul(0.9).add(0.6)), wFar));
    const wSoil = max(sp.b, sp.a.mul(0.92)).toVar();
    If(wSoil.greaterThan(0.004), () => {
      const s = samp(MAT.SOIL, uvG, dGx, dGy), fr = sin(wp.x.mul(0.35).add(wp.z.mul(0.94)).mul(8.2)).mul(sp.b).toVar();
      s.c.mulAssign(fr.mul(0.22).add(1)); s.n.assign(vec2(s.n.x.add(fr.mul(0.16)), s.n.y)); s.h.addAssign(fr.mul(0.2)); over(s, wSoil);
    });
    // road: trodden gravel in the middle, mud along the verge and wherever water stands
    const road = sat(sp.r.add(mn3.g.sub(0.5).mul(0.30).mul(step(0.03, sp.r)))).toVar();
    const wMud = max(smoothstep(0.10, 0.34, road).mul(smoothstep(0.48, 0.74, road).oneMinus()), s2.g.mul(sp.a.oneMinus())).mul(sp.g.oneMinus()).toVar();
    If(wMud.greaterThan(0.004), () => { over(samp(MAT.MUD, uvG.mul(1.17), dGx.mul(1.17), dGy.mul(1.17)), wMud); });
    const wPath = smoothstep(0.44, 0.76, road).toVar();
    If(wPath.greaterThan(0.004), () => { over(samp(MAT.DIRT, uvG, dGx, dGy), wPath); });
    const wGrav = sp.a.mul(smoothstep(0.25, 0.65, s2.g)).toVar();
    If(wGrav.greaterThan(0.004), () => { over(samp(MAT.GRAVEL, uvG.mul(1.4), dGx.mul(1.4), dGy.mul(1.4)), wGrav); });
    If(sp.g.greaterThan(0.004), () => { const c = samp(MAT.COBBLE, uvC, dCx, dCy); c.h.assign(c.h.mul(0.2).add(0.72)); over(c, sat(sp.g.mul(1.15)).toVar()); });
    // puddles collect in the low spots of roads and wet banks
    // rain: water stands on every road, between the cobbles and on bare earth, the ground darkens and takes a sheen
    const wet = (TEST && TEST.shore === 0) ? U.wet : max(U.wet, smoothstep(17, 3, TSL.length(wp.xz.sub(vec2(14, 80)))).mul(0.8)), hard = max(max(road, sp.g), sp.a);      // [l1] the wharf's cobbles are always wet
    const wetGround = max(max(max(wMud, wPath.mul(0.8)), s2.g.mul(0.9)).mul(sp.g.oneMinus()), wet.mul(hard.mul(0.75).add(0.2)));
    const pud = smoothstep(float(0.58).sub(wet.mul(0.20)), float(0.70).sub(wet.mul(0.17)), mn2.a.mul(0.50).add(mn3.b.mul(0.28)).add(s2.g.mul(0.55))).mul(wetGround).mul(smoothstep(0.02, 0.09, slope).oneMinus()).mul(smoothstep(0.30, 0.55, G0.h).oneMinus()).mul(farK.mul(0.6).oneMinus()).toVar();
    // in rain, broad shallow pools also lie over cobbles and packed road whatever the stones' height
    pud.assign(max(pud, smoothstep(0.50, 0.60, mn2.a.mul(0.55).add(mn3.b.mul(0.15)).add(mn.r.mul(0.30))).mul(wet).mul(hard).mul(smoothstep(0.02, 0.07, slope).oneMinus()).mul(farK.mul(0.5).oneMinus())));
    const damp = sat(s2.g.mul(0.7).add(pud).add(wet.mul(0.7))).toVar();
    if (!(TEST && TEST.rough === 0)) G0.r.assign(max(G0.r, 0.86));      // [l1] dry ground never glints; water and wet cobbles below still shine
    G0.c.mulAssign(mix(float(1), 0.52, damp)); G0.r.assign(mix(G0.r, 0.07, pud)); G0.r.assign(mix(G0.r, mix(float(0.45), 0.24, wet), damp.mul(0.6))); G0.n.assign(mix(G0.n, vec2(0.5), pud)); G0.ao.assign(mix(G0.ao, 1.0, pud));
    If(wRock.greaterThan(0.004), () => {
      const q = samp(MAT.ROCK, uvR, dRx, dRy), q2 = samp(MAT.ROCK, uvR2, dR2x, dR2y), kx = Nv.z.mul(Nv.z).div(Nv.x.mul(Nv.x).add(Nv.z.mul(Nv.z)).add(0.0001)).toVar();       // kx: weight of the x-y plane (faces looking along z)
      q.c.assign(mix(q2.c, q.c, kx)); q.ao.assign(mix(q2.ao, q.ao, kx)); q.r.assign(mix(q2.r, q.r, kx)); q.c.mulAssign(vec3(0.97, 0.98, 1.04).mul(mn.g.mul(0.45).add(0.80)));
      G0.c.assign(mix(G0.c, q.c, wRock)); G0.ao.assign(mix(G0.ao, q.ao, wRock)); G0.r.assign(mix(G0.r, q.r, wRock)); G0.n.assign(mix(G0.n, vec2(0.5), wRock));
    });
    G0.c.assign(mix(G0.c, vec3(0.80, 0.84, 0.90), wSnow));
    const N = SH.perturb(Nv, wp, uvG, G0.n, smoothstep(38, 56, dist).oneMinus()).toVar();
    // raindrops ring the standing water: one expanding ring per half-metre cell, each on its own clock
    If(U.rain.greaterThan(0.02).and(pud.greaterThan(0.03)).and(dist.lessThan(30)), () => {
      const g = wp.xz.mul(2.1), cell = TSL.floor(g), h = TSL.fract(sin(vec3(dot(cell, vec2(127.1, 311.7)), dot(cell, vec2(269.5, 183.3)), dot(cell, vec2(419.2, 371.9)))).mul(43758.5453));
      const ph = TSL.fract(U.time.mul(1.15).add(h.x)), d2 = TSL.fract(g).sub(0.5).sub(h.yz.sub(0.5).mul(0.45)), dl = length(d2), rr = ph.mul(0.42);
      const ring = sin(dl.sub(rr).mul(46)).mul(smoothstep(0.075, 0.0, abs(dl.sub(rr)))).mul(ph.oneMinus()).mul(smoothstep(0.0, 0.08, ph));
      const push = d2.div(max(dl, 0.01)).mul(ring.mul(0.42).mul(U.rain).mul(pud));
      N.assign(normalize(N.add(vec3(push.x, 0, push.y))));
    });
    const ao = G0.ao.mul(s2.b.mul(0.7).oneMinus()), contact = sat(s2.b.mul(0.44).add(s2.b.mul(s2.b).mul(0.34)).oneMinus());        // [l1] a deeper contact band at the foot of walls and trunks        // soft contact shade at the foot of walls and trunks
    // standing water mirrors the sky
    const V = normalize(U.camPos.sub(wp)), Rf = reflect(V.negate(), N), F = pow(sat(dot(N, V).oneMinus()), 5).mul(0.97).add(0.03);
    const k = F.mul(pud).mul(0.85).mul(step(0.01, pud)).toVar();
    const sky = SH.skyBase(vec3(Rf.x, abs(Rf.y).add(0.02), Rf.z));
    const albedo = G0.c.mul(contact).mul(k.oneMinus()).toVar();
    pN.assign(N); pRough.assign(mix(G0.r, 0.6, wSnow));
    const lamp = SH.lampPool(wp).mul(inside).toVar();
    // wet ground throws lamp light back at the eye: puddles and wet cobbles under a lantern shine
    const shine = lamp.mul(pud.mul(0.55).add(damp.mul(wet).mul(0.12))).mul(F.mul(2.5).add(0.35));
    pEmis.assign(albedo.mul(SH.hemi(N, ao, float(0)).add(SH.pointLightsGround(wp, N, float(0), float(0.25)).add(lamp).mul(mix(float(0.6), 1.0, ao)))).add(sky.mul(k).mul(contact)).add(shine));
    return vec4(albedo, 1);
  })();
  m.normalNode = transformNormalToView(pN); m.roughnessNode = pRough; m.metalnessNode = float(0); m.emissiveNode = pEmis;
  return m;
}
