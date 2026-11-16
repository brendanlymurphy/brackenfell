// ───────────────────────── scanned trees: firs, pines and a small broadleaf from Poly Haven scans ─────────────────────────
// kits/trees.glb holds, per species, a near model (simplified trunk and boughs, about 200 foliage cards cut from the scan and baked
// into an atlas) and a far model (a stub of trunk and a quarter of the cards, enlarged). kits/trees_far.webp holds each species drawn flat from two
// sides. Built by tools/scan/trees.sh and tools/scan/tree_pack.mjs; sources in kits/TREES_PROVENANCE.md.
// Three rings round the player, so the cost follows what is near and not how many trees the valley holds:
//   inside NEAR[tier] m   near model (camera only)                               one draw each for wood and cards per species
//   out to q.treeLod      far model; the same model casts the near sun shadow    one draw per species (wood and cards in one)
//   beyond                two crossed flat pictures, in 400 m cells, which also cast into the wide shadow map
// The first two rings are instance lists refilled when the player has moved a little; nothing is switched in the shader there.
// If the files cannot be loaded, Trees.ready stays false and 74_vegetation.js plants the old generated trees instead.
const Trees = { ready: false, sp: {}, items: [], NEAR: { low: 11, medium: 20, high: 30 }, lastPos: [1e9, 0, 1e9], lastLod: -1 };
// which scan stands in for which planted tree, how tall it grows (m, at planting scale 1) and how its baked colours are corrected
Trees.SPEC = {
  fir_b: { tall: 13.5, gain: [1.1, 1.28, 1.15] }, fir_c: { tall: 14.5, gain: [1.15, 1.3, 1.15] }, pine_c: { tall: 16, gain: [2.0, 2.25, 1.95] },
  broadleaf_small: { tall: 6.2, gain: [1.0, 1.0, 1.0], autumn: 1 },
};
Trees.load = async function () {
  if (TEST && TEST.trees === 0) return;
  try {
    const meta = await (await fetch('kits/TREES.json')).json();
    const [gltf, farTex] = await Promise.all([new T3X.GLTFLoader().loadAsync('kits/trees.glb'), new THREE.TextureLoader().loadAsync('kits/trees_far.webp')]);
    farTex.colorSpace = THREE.SRGBColorSpace; farTex.wrapS = farTex.wrapT = THREE.ClampToEdgeWrapping; farTex.anisotropy = 2; farTex.premultiplyAlpha = false;
    Trees.farTex = farTex; Trees.meta = meta;
    const BA = THREE.BufferAttribute;
    // geometry as plain attributes: position, normal, uv, wind (how freely this vertex moves), tk (1 on wood, 0 on foliage)
    const plain = (mesh, H, rad, wood) => {
      const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, U_ = g.attributes.uv, n = P.count, v = new THREE.Vector3();
      mesh.updateWorldMatrix(true, false); const MW = mesh.matrixWorld, NM = new THREE.Matrix3().getNormalMatrix(MW);       // the pack stores quantized positions: the node's matrix restores metres
      const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(n * 2), wind = new Float32Array(n), tk = new Float32Array(n).fill(wood ? 1 : 0);
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(MW); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
        const out = Math.min(1, Math.hypot(v.x, v.z) / Math.max(rad, 0.1)), up = Math.min(1, v.y / H);
        wind[i] = wood ? out * 0.5 : 0.3 + out * 0.7 + up * 0.2;       // twigs and outer foliage shiver, the trunk only leans
        v.fromBufferAttribute(N, i).applyMatrix3(NM).normalize(); nrm[i * 3] = v.x; nrm[i * 3 + 1] = v.y; nrm[i * 3 + 2] = v.z;
        uv[i * 2] = U_.getX(i); uv[i * 2 + 1] = U_.getY(i);
      }
      return { pos, nrm, uv, wind, tk, idx: Uint32Array.from(g.index.array), n };
    };
    const join = (a, b) => {
      const o = { n: a.n + b.n, idx: new Uint32Array(a.idx.length + b.idx.length) };
      for (const [k, w] of [['pos', 3], ['nrm', 3], ['uv', 2], ['wind', 1], ['tk', 1]]) { o[k] = new Float32Array(o.n * w); o[k].set(a[k]); o[k].set(b[k], a.n * w); }
      o.idx.set(a.idx); for (let i = 0; i < b.idx.length; i++) o.idx[a.idx.length + i] = b.idx[i] + a.n;
      return o;
    };
    const geo = a => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new BA(a.pos, 3)); g.setAttribute('normal', new BA(a.nrm, 3)); g.setAttribute('uv', new BA(a.uv, 2)); g.setAttribute('wind', new BA(a.wind, 1)); g.setAttribute('tk', new BA(a.tk, 1)); g.setIndex(new BA(a.idx, 1)); g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g; };
    let k = 0;
    for (const name in Trees.SPEC) {
      const m = meta.species[name], near = gltf.scene.getObjectByName(name), far = gltf.scene.getObjectByName(name + '_far'); if (!m || !near || !far) throw new Error('trees.glb has no ' + name);
      const parts = o => { const l = []; o.traverse(c => { if (c.isMesh) l.push(c); }); return { wood: l.find(c => /_wood$/.test(c.material.name)), leaf: l.find(c => /_foliage$/.test(c.material.name)) }; };
      const pn = parts(near), pf = parts(far), atlas = pn.leaf.material.map, bark = pn.wood.material.map;
      atlas.anisotropy = 4; bark.anisotropy = 2; bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
      // the atlas ships at 2048; phones and the lighter tiers keep 1024 (a quarter of the memory: 5.6 MB instead of 22 MB per species)
      { const cap = (TEST && TEST.treeAtlas) || Math.min(2048, GFX_TEX.color * 2), im = atlas.image; if (im && im.width > cap) { try { const bmp = await createImageBitmap(im, { resizeWidth: cap, resizeHeight: cap, resizeQuality: 'high', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); if (im.close) im.close(); atlas.image = bmp; atlas.needsUpdate = true; } catch (e) { } } }
      const wN = plain(pn.wood, m.height, m.crownRadius, true), lN = plain(pn.leaf, m.height, m.crownRadius, false), mid = join(plain(pf.wood, m.height, m.crownRadius, true), plain(pf.leaf, m.height, m.crownRadius, false));
      Trees.sp[name] = Object.assign({ name, k: k++, m, atlas, bark, wood: wN, leaf: lN, mid, items: [], trisNear: (wN.idx.length + lN.idx.length) / 3, trisMid: mid.idx.length / 3, geo }, Trees.SPEC[name]);
    }
    Trees.ready = true;
  } catch (e) { console.warn('scanned trees unavailable, planting the generated ones:', e && e.message || e); Trees.ready = false; }
};
// Called by buildVegetation with the planted trees (the same lists the generated trees used: x, y, z, scale, yaw, tint, phase).
Trees.plant = function (inst) {
  const S = Trees.sp, items = Trees.items = [], rnd = rng(4242);
  const houses = SITES.concat(typeof INF !== 'undefined' ? INF.houses : []).filter(s => s && s.w && s.d);
  for (const t of inst.pine) {
    const r = rnd(), sp = r < 0.42 ? S.fir_b : r < 0.76 ? S.fir_c : S.pine_c;
    items.push({ sp, x: t[0], y: t[1] - 0.12, z: t[2], s: sp.tall * t[3] / sp.m.height, yaw: t[4], tint: t[5], ph: t[6] });
  }
  for (const t of inst.birch) {
    const sp = S.broadleaf_small; let s = sp.tall * t[3] / sp.m.height, yaw = t[4];
    // in the yards: no wider than the gap to the nearest wall, and turned so its leaning crown hangs away from that wall
    let best = 1e9, bx = 0, bz = 0;
    for (const h of houses) { const dc = hyp(h.x - t[0], h.z - t[2]); if (dc > 16) continue; const l = worldToSite(h, t[0], t[2]), d = Math.max(Math.abs(l[0]) - h.w / 2, Math.abs(l[1]) - h.d / 2); if (d < best) { best = d; bx = h.x; bz = h.z; } }
    if (best < 6) { s = Math.min(s, Math.max(0.75, (best - 0.2) / 1.5)); yaw = Math.atan2(t[0] - bx, t[2] - bz) + rnd.s() * 0.5; }
    items.push({ sp, x: t[0], y: t[1] - 0.05, z: t[2], s, yaw, tint: t[5], ph: t[6] });
  }
  // a coarse grid to find the trees near the player
  const G_ = Trees.grid = new Map(), C = Trees.CELL = 32;
  for (const it of items) { const key = Math.floor(it.x / C) + ',' + Math.floor(it.z / C); let l = G_.get(key); if (!l) G_.set(key, l = []); l.push(it); }
  World.treeCount = items.length;
};
Trees.materials = function (sp) {
  const { Fn, float, vec2, vec3, vec4, attribute, texture, uv, varying, positionLocal, normalLocal, positionWorld, cos, sin, mix, step, smoothstep, dot, normalize, max, pow, distance, transformNormalToView, uniform } = TSL, U = SH.U;
  const ipos = attribute('ipos', 'vec4'), iprm = attribute('iprm', 'vec4');
  const gain = vec3(sp.gain[0], sp.gain[1], sp.gain[2]);
  // instance transform and wind. flat: the stand-in quads (unit quad scaled by idim); hideNear / hideFar: collapse by distance from the player
  const place = o => Fn(() => {
    const c = cos(iprm.x), s = sin(iprm.x), ww = o.flat ? positionLocal.y.mul(positionLocal.y) : attribute('wind', 'float');
    const lp0 = o.flat ? positionLocal.mul(vec3(attribute('idim', 'vec4').x, attribute('idim', 'vec4').y, attribute('idim', 'vec4').x)) : positionLocal.mul(ipos.w);
    const p = vec3(lp0.x.mul(c).add(lp0.z.mul(s)), lp0.y, lp0.x.negate().mul(s).add(lp0.z.mul(c)));
    const off = SH.sway(ipos.xyz, p, ww, iprm.z.mul(40));
    const w = p.add(off).add(ipos.xyz), d = distance(ipos.xyz, U.camPos);
    if (o.hideNear) return mix(w, vec3(0, -20000, 0), step(d, U.treeLod));
    if (o.hideFar) return mix(w, vec3(0, -20000, 0), step(U.treeLod, d));
    return w;
  })();
  const rotN = () => { const c = cos(iprm.x), s = sin(iprm.x), n = normalLocal; return vec3(n.x.mul(c).add(n.z.mul(s)), n.y, n.x.negate().mul(s).add(n.z.mul(c))); };
  // autumn: each broadleaf turns by its own amount, from tired green to ochre and rust
  const tintOf = () => sp.autumn ? mix(vec3(1.05, 1.0, 0.8), mix(vec3(2.3, 1.45, 0.42), vec3(2.2, 0.95, 0.30), smoothstep(0.7, 1.0, iprm.y)), smoothstep(0.15, 0.6, iprm.y)) : mix(vec3(0.86, 0.92, 0.9), vec3(1.12, 1.06, 0.9), iprm.y);
  const cut = a => SH.sat(a.sub((TEST && TEST.treeCut) || 0.34).div(max(TSL.fwidth(a), 0.001)).add(0.5));
  const leafLight = (albedo, N, sky) => { const V = normalize(U.camPos.sub(positionWorld)), back = pow(SH.sat(dot(V, U.sunDir.negate())), 3).mul(0.55);
    return albedo.mul(SH.hemi(N, sky, float(0)).add(SH.pointLights(positionWorld, N, float(0), float(0.6))).add(vec3(1.3, 1.25, 0.6).mul(U.sunCol).mul(back.mul(sky).mul(0.3)))); };
  const lambert = (o, colour, alpha, sky) => {
    const m = new THREE.MeshLambertNodeMaterial(); m.positionNode = place(o);
    const N = normalize(varying(o.flat ? vec3(0, 1, 0) : rotN()));
    m.colorNode = colour; if (alpha) { m.opacityNode = alpha; m.alphaTest = 0.5; m.side = THREE.DoubleSide; }
    m.normalNode = transformNormalToView(normalize(N.add(U.sunDir.mul(0.6)))); m.emissiveNode = leafLight(colour, N, sky);
    return m;
  };
  const vTint = varying(tintOf()), height = positionLocal.y.div(sp.m.height);
  // near: cards from the atlas; crowns are darker inside and low down
  const a = texture(sp.atlas, uv()), leafCol = a.rgb.mul(gain).mul(vTint), skyL = varying(smoothstep(0.1, 0.9, height).mul(0.35).add(0.65));
  const leaf = lambert({}, leafCol, cut(a.a), skyL);
  const wood = new THREE.MeshStandardNodeMaterial(); wood.positionNode = place({});
  { const N = normalize(varying(rotN())), alb = texture(sp.bark, uv()).rgb.mul(0.8); wood.colorNode = alb; wood.normalNode = transformNormalToView(N); wood.roughnessNode = float(0.95); wood.metalnessNode = float(0);
    wood.emissiveNode = alb.mul(SH.hemi(N, float(0.75), float(0)).add(SH.pointLights(positionWorld, N, float(0), float(0.25)))); }
  // middle ring: wood and cards in one draw; wood takes the bark's average colour
  const tk = varying(attribute('tk', 'float')), barkC = vec3(sp.m.bark[0], sp.m.bark[1], sp.m.bark[2]).mul(vec3(sp.m.bark[0], sp.m.bark[1], sp.m.bark[2])).mul(0.8);
  const midCol = mix(leafCol, barkC, tk), midA = max(cut(a.a), tk);
  const mid = lambert({ hideFar: true }, midCol, midA, skyL), midCast = lambert({}, midCol, midA, skyL);
  return { leaf, wood, mid, midCast };
};
// the flat stand-ins share one material (and one for the copy that only the wide shadow map draws, which never hides)
Trees.farMaterial = function (noLod) {
  const { Fn, float, vec2, vec3, attribute, texture, varying, positionLocal, positionWorld, cos, sin, mix, step, smoothstep, dot, normalize, max, pow, distance, transformNormalToView } = TSL, U = SH.U;
  const ipos = attribute('ipos', 'vec4'), iprm = attribute('iprm', 'vec4'), idim = attribute('idim', 'vec4'), q = attribute('q', 'vec3');       // q: u (0..1), v (0..1), which of the two pictures
  const m = new THREE.MeshLambertNodeMaterial();
  m.positionNode = Fn(() => {
    const c = cos(iprm.x), s = sin(iprm.x), lp = positionLocal.mul(vec3(idim.x, idim.y, idim.x));
    const p = vec3(lp.x.mul(c).add(lp.z.mul(s)), lp.y, lp.x.negate().mul(s).add(lp.z.mul(c)));
    const w = p.add(SH.sway(ipos.xyz, p, positionLocal.y.mul(0.6), iprm.z.mul(40))).add(ipos.xyz);
    return noLod ? w : mix(w, vec3(0, -20000, 0), step(distance(ipos.xyz, U.camPos), U.treeLod));
  })();
  const n = Trees.meta.count, tuv = vec2(idim.z.add(q.z).add(q.x.mul(0.96).add(0.02)).div(n), q.y), a = texture(Trees.farTex, tuv);
  const autumn = step(0.5, idim.w), tint = varying(mix(mix(vec3(0.86, 0.92, 0.9), vec3(1.12, 1.06, 0.9), iprm.y), mix(vec3(1.05, 1.0, 0.8), mix(vec3(2.3, 1.45, 0.42), vec3(2.2, 0.95, 0.30), smoothstep(0.7, 1.0, iprm.y)), smoothstep(0.15, 0.6, iprm.y)), autumn).mul(attribute('igain', 'vec3')));
  const col = a.rgb.mul(tint), N = normalize(varying(vec3(positionLocal.x.mul(cos(iprm.x)).mul(0.6), 0.6, positionLocal.x.mul(sin(iprm.x)).mul(-0.6))));
  m.colorNode = col; m.opacityNode = SH.sat(a.a.sub(0.36).div(max(TSL.fwidth(a.a), 0.001)).add(0.5)); m.alphaTest = 0.5; m.side = THREE.DoubleSide;
  m.normalNode = transformNormalToView(normalize(N.add(U.sunDir.mul(0.6))));
  const V = normalize(U.camPos.sub(positionWorld)), back = pow(SH.sat(dot(V, U.sunDir.negate())), 3).mul(0.55), sky = varying(smoothstep(0.1, 0.9, q.y).mul(0.35).add(0.65));
  m.emissiveNode = col.mul(SH.hemi(N, sky, float(0)).add(vec3(1.3, 1.25, 0.6).mul(U.sunCol).mul(back.mul(sky).mul(0.3))));
  return m;
};
Trees.build = function (scene) {
  if (!Trees.ready || !Trees.items.length) return;
  const T = THREE, IBA = T.InstancedBufferAttribute, mk = (g, mat, layer, cast) => { const o = new T.Mesh(g, mat); o.matrixAutoUpdate = false; o.frustumCulled = false; o.castShadow = !!cast; o.receiveShadow = !cast; if (layer !== undefined) o.layers.set(layer); o.visible = false; scene.add(o); return o; };
  Trees.sets = [];
  const ring = (g, cap) => { const a = new Float32Array(cap * 4), b = new Float32Array(cap * 4), ia = new IBA(a, 4), ib = new IBA(b, 4); ia.setUsage(T.DynamicDrawUsage); ib.setUsage(T.DynamicDrawUsage); g.setAttribute('ipos', ia); g.setAttribute('iprm', ib); return { g, a, b, ia, ib, cap, n: 0 }; };
  for (const name in Trees.sp) {
    const sp = Trees.sp[name], M = Trees.materials(sp), set = { sp, meshes: [] };
    const gW = sp.geo(sp.wood), gL = sp.geo(sp.leaf), near = ring(gW, 48); gL.setAttribute('ipos', near.ia); gL.setAttribute('iprm', near.ib);
    set.near = near; set.nearMeshes = [mk(gW, M.wood, 1), mk(gL, M.leaf, 1)]; set.nearGeos = [gW, gL];
    set.mid = ring(sp.geo(sp.mid), 320); set.midMesh = mk(set.mid.g, M.mid, 1);
    set.cast = ring(sp.geo(sp.mid), 96); set.castMesh = mk(set.cast.g, M.midCast, SHADOW_ONLY_LAYER, true);
    set.leafMats = [M.leaf, M.mid, M.midCast];
    Trees.sets.push(set);
  }
  // stand-ins: two crossed quads per tree, bucketed into big cells
  const CS = typeof FAR_TREE_CELL !== 'undefined' ? FAR_TREE_CELL : 400, cells = new Map();
  for (const it of Trees.items) { const key = Math.floor(it.x / CS) + ',' + Math.floor(it.z / CS); let l = cells.get(key); if (!l) cells.set(key, l = []); l.push(it); }
  const pos = [], q = [], idx = [];
  for (let j = 0; j < 2; j++) { const ax = j ? [0, 0, 1] : [1, 0, 0], o = j * 4; for (const [s, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { pos.push(ax[0] * s, v, ax[2] * s); q.push(s * 0.5 + 0.5, v, j); } idx.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  const farMat = Trees.farMat = Trees.farMaterial(false), farCast = Trees.farMaterial(true); Trees.farMeshes = [];
  const ringOf = (cap, mat) => { const g = new T.InstancedBufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('q', new T.Float32BufferAttribute(q, 3)); g.setIndex(idx);
    const F = { g, cap, n: 0, a: new Float32Array(cap * 4), b: new Float32Array(cap * 4), d: new Float32Array(cap * 4), gn: new Float32Array(cap * 3), last: [1e9, 1e9, 9] };
    for (const [k, arr, w] of [['ipos', F.a, 4], ['iprm', F.b, 4], ['idim', F.d, 4], ['igain', F.gn, 3]]) { const at = new IBA(arr, w); at.setUsage(T.DynamicDrawUsage); g.setAttribute(k, at); }
    g.instanceCount = 0; g.boundingSphere = new T.Sphere(new T.Vector3(), 1e6);
    F.mesh = new T.Mesh(g, mat); F.mesh.matrixAutoUpdate = false; F.mesh.frustumCulled = false; F.mesh.visible = false; scene.add(F.mesh);
    F.put = it => { if (F.n >= F.cap) return; const o = F.n++, m = it.sp.m; F.a.set([it.x, it.y, it.z, it.s], o * 4); F.b.set([it.yaw, it.tint, it.ph, 0], o * 4); F.d.set([m.halfWidth * it.s, m.height * it.s, m.tiles[0], it.sp.autumn ? 1 : 0], o * 4); F.gn.set(it.sp.gain, o * 3); };
    F.flush = () => { for (const k of ['ipos', 'iprm', 'idim', 'igain']) { const at = g.attributes[k]; at.clearUpdateRanges(); if (F.n) { at.addUpdateRange(0, F.n * at.itemSize); at.needsUpdate = true; } } g.instanceCount = F.n; };
    return F; };
  // the camera's stand-ins: every tree beyond the middle ring that lies in the view cone (cut 20 degrees wide), one draw
  if (!(TEST && TEST.treering === 0)) { Trees.farRing = ringOf(Trees.items.length, farMat); Trees.farRing.mesh.receiveShadow = true; }
  for (const list of Trees.farRing ? [] : cells.values()) {
    const n = list.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), d = new Float32Array(n * 4), gn = new Float32Array(n * 3); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    list.forEach((it, i) => { const m = it.sp.m; a.set([it.x, it.y, it.z, it.s], i * 4); b.set([it.yaw, it.tint, it.ph, 0], i * 4); d.set([m.halfWidth * it.s, m.height * it.s, m.tiles[0], it.sp.autumn ? 1 : 0], i * 4); gn.set(it.sp.gain, i * 3);
      x0 = Math.min(x0, it.x); x1 = Math.max(x1, it.x); y0 = Math.min(y0, it.y); y1 = Math.max(y1, it.y + m.height * it.s); z0 = Math.min(z0, it.z); z1 = Math.max(z1, it.z); });
    const g = new T.InstancedBufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('q', new T.Float32BufferAttribute(q, 3)); g.setIndex(idx);
    g.setAttribute('ipos', new IBA(a, 4)); g.setAttribute('iprm', new IBA(b, 4)); g.setAttribute('idim', new IBA(d, 4)); g.setAttribute('igain', new IBA(gn, 3)); g.instanceCount = n;
    g.boundingSphere = new T.Sphere(new T.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), 0.5 * hyp(x1 - x0, y1 - y0, z1 - z0) + 8);
    const m1 = new T.Mesh(g, farMat); m1.matrixAutoUpdate = false; m1.receiveShadow = true; scene.add(m1); Trees.farMeshes.push(m1);
  }
  // the wide sun-shadow map only needs the stand-ins of trees standing in or beside it: one instance list, refilled as the player moves or turns
  { const F = Trees.farCastRing = ringOf(1536, farCast); F.mesh.castShadow = true; F.mesh.layers.set(2); }
  Trees.lastPos = [1e9, 0, 1e9];
};
// multisampled tiers smooth the cut-out edges with alpha to coverage (as the old leaf material did)
Trees.quality = function (q) {
  if (!Trees.sets) return; const a2c = q.msaa > 1;
  for (const m of Trees.sets.flatMap(s => s.leafMats).concat([Trees.farMat])) if (m.alphaToCoverage !== a2c) { m.alphaToCoverage = a2c; m.alphaTest = a2c ? 0.06 : 0.5; m.needsUpdate = true; }
  Trees.lastPos = [1e9, 0, 1e9];
};
// per frame: refill the two inner rings when the player has moved
Trees.update = function (e, q, hidden) {
  if (!Trees.sets) return;
  for (const s of Trees.sets) { s.nearMeshes[0].visible = s.nearMeshes[1].visible = !hidden && s.near.n > 0; s.midMesh.visible = !hidden && s.mid.n > 0; s.castMesh.visible = !hidden && s.cast.n > 0; }
  for (const m of Trees.farMeshes) m.visible = !hidden;
  const FC = Trees.farCastRing; FC.mesh.visible = !hidden && FC.n > 0; if (Trees.farRing) Trees.farRing.mesh.visible = !hidden && Trees.farRing.n > 0;
  if (hidden) return;
  { // centre of the wide shadow map (43_render.js: 92 m radius, pushed 0.6 of that ahead of the view)
    const cx = e[0] + Math.sin(R.cam.yaw) * 55, cz = e[2] - Math.cos(R.cam.yaw) * 55, RR = 92 + 22;
    if (hyp(cx - FC.last[0], cz - FC.last[1]) > 6) {
      FC.last = [cx, cz]; FC.n = 0; const C = Trees.CELL, G_ = Trees.grid;
      for (let gz = Math.floor((cz - RR) / C); gz <= Math.floor((cz + RR) / C); gz++) for (let gx = Math.floor((cx - RR) / C); gx <= Math.floor((cx + RR) / C); gx++) { const l = G_.get(gx + ',' + gz); if (!l) continue; for (const it of l) if (hyp(it.x - cx, it.z - cz) <= RR) FC.put(it); }
      FC.flush(); FC.mesh.visible = FC.n > 0;
    }
  }
  const FR = Trees.farRing;
  if (FR) {
    let dy = R.cam.yaw - FR.last[2]; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (hyp(e[0] - FR.last[0], e[2] - FR.last[1]) > 2 || Math.abs(dy) > 0.19 || FR.lod !== q.treeLod) {
      FR.last = [e[0], e[2], R.cam.yaw]; FR.lod = q.treeLod; FR.n = 0;
      const fx = Math.sin(R.cam.yaw), fz = -Math.cos(R.cam.yaw), half = Math.atan(Math.tan(R.camera.fov * Math.PI / 360) * R.camera.aspect) + 0.35, cone = Math.abs(R.cam.pitch) < 0.9, near = q.treeLod - 4;
      for (const it of Trees.items) { const dx = it.x - e[0], dz = it.z - e[2], d = Math.sqrt(dx * dx + dz * dz); if (d < near) continue;        // the shader hides those inside treeLod exactly; this only keeps the list short
        if (cone && Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / d))) > half + Math.asin(Math.min(1, 6 / d))) continue; FR.put(it); }
      FR.flush();
    }
    FR.mesh.visible = FR.n > 0;
  }
  const R1 = q.treeLod + 2.5, R0 = Trees.NEAR[R.qName] || 20, RS = Math.min(R1, q.shadowNear * 1.72 + 9);
  if (hyp(e[0] - Trees.lastPos[0], e[2] - Trees.lastPos[2]) < 1.2 && Trees.lastLod === R1 + R0) return;
  Trees.lastPos = [e[0], e[1], e[2]]; Trees.lastLod = R1 + R0;
  const C = Trees.CELL, G_ = Trees.grid, found = [];
  for (let gz = Math.floor((e[2] - R1) / C); gz <= Math.floor((e[2] + R1) / C); gz++) for (let gx = Math.floor((e[0] - R1) / C); gx <= Math.floor((e[0] + R1) / C); gx++) {
    const l = G_.get(gx + ',' + gz); if (!l) continue;
    for (const it of l) { const d = hyp(it.x - e[0], it.z - e[2]); if (d < R1) { it.d = d; found.push(it); } }
  }
  found.sort((a, b) => a.d - b.d);
  for (const s of Trees.sets) s.near.n = s.mid.n = s.cast.n = 0;
  const put = (r, it) => { if (r.n >= r.cap) return; const o = r.n++ * 4; r.a[o] = it.x; r.a[o + 1] = it.y; r.a[o + 2] = it.z; r.a[o + 3] = it.s; r.b[o] = it.yaw; r.b[o + 1] = it.tint; r.b[o + 2] = it.ph; r.b[o + 3] = 0; };
  let nNear = 0; const maxNear = R.qName === 'low' ? 10 : R.qName === 'medium' ? 18 : 40; Trees.stat = { near: 0, mid: 0, cast: 0 };
  for (const it of found) {
    const s = Trees.sets[it.sp.k];
    if (it.d < R0 && nNear < maxNear) { put(s.near, it); nNear++; Trees.stat.near++; } else { put(s.mid, it); Trees.stat.mid++; }
    if (it.d < RS) { put(s.cast, it); Trees.stat.cast++; }
  }
  for (const s of Trees.sets) {
    for (const r of [s.near, s.mid, s.cast]) { r.ia.clearUpdateRanges(); r.ib.clearUpdateRanges(); if (r.n) { r.ia.addUpdateRange(0, r.n * 4); r.ib.addUpdateRange(0, r.n * 4); r.ia.needsUpdate = r.ib.needsUpdate = true; } }
    s.nearGeos[0].instanceCount = s.nearGeos[1].instanceCount = s.near.n; s.mid.g.instanceCount = s.mid.n; s.cast.g.instanceCount = s.cast.n;
    s.nearMeshes[0].visible = s.nearMeshes[1].visible = s.near.n > 0; s.midMesh.visible = s.mid.n > 0; s.castMesh.visible = s.cast.n > 0;
  }
};
