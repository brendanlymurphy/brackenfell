// ───────────────────────── asset kits: modular buildings, props, nature (glTF packs under kits/) ─────────────────────────
// A pack is one GLB whose top-level nodes are the pieces, plus a catalogue (bbox, category, notes). Pieces from every pack share one
// namespace. Level code places pieces through a batch, which merges them into a few meshes per material and 24 m cell, or as
// instanced meshes for things repeated hundreds of times. Every kit material is lit like the rest of the world: Three's sun light
// and shadow, plus ambient and the zone-aware point lights in the emissive term (see 40_shade.js).
const Kit = (() => {
  const { Fn, float, vec2, vec3, vec4, uniform, attribute, texture, uv, positionWorld, positionLocal, positionGeometry, normalWorld, normalMap,
    mix, dot, sin, floor, fract, smoothstep, max, reflect, normalize, pow, frontFacing, select, abs } = TSL;
  const K_ = {
    PACKS: [{ glb: 'kits/village.glb', catalog: 'kits/CATALOG.json' }, { glb: 'kits/props.glb' }, { glb: 'kits/nature.glb' }, { glb: 'kits/scan.glb', catalog: 'kits/SCAN_CATALOG.json', optional: true }],
    pieces: {}, cat: {}, defs: {}, mats: new Map(), skin: 'realistic', skinDef: {}, ready: false, instanced: [], pending: [],
    grade: null,
  };
  const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _n3 = new THREE.Matrix3();

  // ── loading ──
  async function fetchJson(url, optional) { const r = await fetch(url); if (!r.ok) { if (optional) return null; throw new Error(url + ' ' + r.status); } return r.json(); }
  function extract(mesh) {       // one primitive -> plain arrays in piece space
    const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, T = g.attributes.uv, C = g.attributes.color, n = P.count;
    const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uvs = new Float32Array(n * 2), col = C ? new Float32Array(n * 3) : null;
    mesh.updateWorldMatrix(true, false); _n3.getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < n; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(mesh.matrixWorld); pos[i * 3] = _v.x; pos[i * 3 + 1] = _v.y; pos[i * 3 + 2] = _v.z;
      if (N) { _v.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize(); nrm[i * 3] = _v.x; nrm[i * 3 + 1] = _v.y; nrm[i * 3 + 2] = _v.z; } else nrm[i * 3 + 1] = 1;
      if (T) { uvs[i * 2] = T.getX(i); uvs[i * 2 + 1] = T.getY(i); }
      if (col) { col[i * 3] = C.getX(i); col[i * 3 + 1] = C.getY(i); col[i * 3 + 2] = C.getZ(i); }
    }
    let idx; if (g.index) idx = Uint32Array.from(g.index.array); else { idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; }
    return { mat: mesh.material.name || 'unnamed', pos, nrm, uv: uvs, col, idx, n };
  }
  function registerMaterial(m) {       // remember the glTF material's maps once per name
    const name = m.name || 'unnamed'; if (K_.defs[name]) return;
    const orm = m.roughnessMap || m.metalnessMap || null;
    K_.defs[name] = {
      name, map: m.map || null, normalMap: m.normalMap || null, orm, aoInOrm: !!m.aoMap || (!!orm && /ORM|_arm|_orm/i.test(orm.name || '')),
      color: m.color ? [m.color.r, m.color.g, m.color.b] : [1, 1, 1], rough: m.roughness === undefined ? 1 : m.roughness, metal: m.metalness || 0,
      alphaTest: m.alphaTest || 0, blend: !!m.transparent, opacity: m.transparent && m.opacity < 1 ? m.opacity : 1, doubleSided: m.side === THREE.DoubleSide,
      emissive: m.emissive ? [m.emissive.r * (m.emissiveIntensity || 1), m.emissive.g * (m.emissiveIntensity || 1), m.emissive.b * (m.emissiveIntensity || 1)] : [0, 0, 0], emissiveMap: m.emissiveMap || null,
      uvScale: [1, 1], gain: 1, nScale: 1,
    };
    for (const t of [m.map, m.normalMap, orm, m.emissiveMap]) if (t) { t.anisotropy = 4; }
    const d = K_.defs[name]; K_.pending.push(Promise.all([['map', 'color'], ['normalMap', 'data'], ['orm', 'data'], ['emissiveMap', 'color']].map(async ([k, kind]) => { if (d[k]) d[k] = await gfxTex(d[k], kind); })));
  }
  async function loadPack(pack, progress) {
    const loader = new T3X.GLTFLoader();
    let gltf;
    try { gltf = await loader.loadAsync(pack.glb, e => { if (progress && e.total) progress(e.loaded / e.total); }); }
    catch (e) { if (pack.optional) return false; throw new Error('kit ' + pack.glb + ': ' + (e && e.message || e)); }
    if (pack.catalog) { const c = await fetchJson(pack.catalog, pack.optional); if (c) Object.assign(K_.cat, c.pieces || c); }
    gltf.scene.updateMatrixWorld(true);
    for (const node of gltf.scene.children) {
      const prims = []; node.traverse(o => { if (o.isMesh) { registerMaterial(o.material); prims.push(extract(o)); } });
      if (!prims.length) continue;
      const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
      for (const p of prims) for (let i = 0; i < p.pos.length; i++) { const k = i % 3, v = p.pos[i]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
      K_.pieces[node.name] = { name: node.name, prims, min, max, pack: pack.glb };
    }
    return true;
  }
  const texLoad = (url, kind) => new Promise((res, rej) => new THREE.TextureLoader().load(url, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = 4; t.colorSpace = kind === 'data' ? THREE.NoColorSpace : THREE.SRGBColorSpace; gfxTex(t, kind).then(res, () => res(t)); }, undefined, () => rej(new Error('texture ' + url))));
  // the realistic skin: scanned or re-worked texture sets that replace the kit's painted ones, material by material (kits/skin/SKIN.json)
  // a painted texture the realistic skin replaces is never uploaded: free its decoded image too
  const dropPainted = (old, now) => { if (old && old !== now) { if (old.image && old.image.close) old.image.close(); old.dispose(); } };
  async function loadSkin() {
    const S = await fetchJson('kits/skin/SKIN.json', true); if (!S) { K_.skin = 'painted'; return; }
    K_.skinDef = S;
    if (S.grade) Object.assign(K_.gradeInit, S.grade);
    const jobs = [];
    for (const name of Object.keys(S.materials || {})) {
      const s = S.materials[name], d = K_.defs[name]; if (!d) continue;
      if (s.gain !== undefined) d.gain = s.gain; if (s.sat !== undefined) d.sat = s.sat; if (s.uvScale) d.uvScale = s.uvScale; if (s.nScale !== undefined) d.nScale = s.nScale; if (s.rough !== undefined) d.roughMul = s.rough;
      if (s.a) jobs.push(texLoad('kits/skin/' + s.a, 'color').then(t => { dropPainted(d.map, t); d.map = t; }));
      if (s.n) jobs.push(texLoad('kits/skin/' + s.n, 'data').then(t => { dropPainted(d.normalMap, t); d.normalMap = t; }));
      if (s.orm) jobs.push(texLoad('kits/skin/' + s.orm, 'data').then(t => { dropPainted(d.orm, t); d.orm = t; d.aoInOrm = s.ao !== false; }));
    }
    await Promise.all(jobs);
  }
  K_.gradeInit = { sat: 1, gain: 1, tint: [1, 1, 1], weather: 0 };
  // opts: { packs: [{ glb, catalog, optional }], skin: 'realistic' | 'painted' }
  K_.load = async function (progress, opts) {
    opts = opts || {};
    const packs = opts.packs || K_.PACKS; K_.skin = opts.skin || (TEST && TEST.skin) || 'realistic';
    for (let i = 0; i < packs.length; i++) await loadPack(packs[i], f => progress && progress((i + f) / (packs.length + 1)));
    await Promise.all(K_.pending); K_.pending.length = 0;
    if (K_.skin === 'realistic') await loadSkin();
    const g = K_.gradeInit;
    K_.grade = { sat: uniform(g.sat), gain: uniform(g.gain), tint: uniform(new THREE.Vector3(g.tint[0], g.tint[1], g.tint[2])), weather: uniform(g.weather || 0) };
    if (K_.skin !== 'realistic') { K_.grade.sat.value = 1; K_.grade.gain.value = 1; K_.grade.tint.value.set(1, 1, 1); K_.grade.weather.value = 0; }
    K_.ready = true; if (progress) progress(1);
  };
  // one knob set for the whole kit look: saturation, brightness, a colour cast, and weathering (large soft stains so no two walls match)
  K_.setGrade = function (o) { const G_ = K_.grade; if (o.weather !== undefined) G_.weather.value = o.weather; if (o.sat !== undefined) G_.sat.value = o.sat; if (o.gain !== undefined) G_.gain.value = o.gain; if (o.tint) G_.tint.value.set(o.tint[0], o.tint[1], o.tint[2]); };

  K_.info = name => { const p = K_.pieces[name]; if (!p) return null; return Object.assign({ name, min: p.min, max: p.max, size: [p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]] }, K_.cat[name] || {}); };
  K_.names = filter => Object.keys(K_.pieces).filter(n => !filter || filter(K_.info(n))).sort();
  // local positions of the light sources on a piece (candle tips, lantern, torch head), from the catalogue
  K_.lights = name => ((K_.cat[name] || {}).lights || []).map(p => p.slice());

  // position / rotation / scale shorthand -> Matrix4. Accepts a Matrix4, a column-major array of 16, or { p:[x,y,z], ry, r:[rx,ry,rz], s }
  function toMatrix(x, out) {
    out = out || new THREE.Matrix4();
    if (!x) return out.identity();
    if (x.isMatrix4) return out.copy(x);
    if (x.length === 16) return out.fromArray(x);
    const p = x.p || x.pos || [0, 0, 0], s = x.s === undefined ? 1 : x.s, sv = typeof s === 'number' ? [s, s, s] : s;
    const e = new THREE.Euler(x.r ? x.r[0] : 0, x.r ? x.r[1] : (x.ry || 0), x.r ? x.r[2] : 0, 'YXZ');
    return out.compose(new THREE.Vector3(p[0], p[1], p[2]), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(sv[0], sv[1], sv[2]));
  }
  K_.matrix = toMatrix;
  // world-space box of a placed piece: { min:[x,y,z], max:[x,y,z] }
  K_.box = function (name, xf) {
    const p = K_.pieces[name]; if (!p) return null;
    const M = toMatrix(xf, _m), min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
    for (let i = 0; i < 8; i++) { _v.set(i & 1 ? p.max[0] : p.min[0], i & 2 ? p.max[1] : p.min[1], i & 4 ? p.max[2] : p.min[2]).applyMatrix4(M); min[0] = Math.min(min[0], _v.x); min[1] = Math.min(min[1], _v.y); min[2] = Math.min(min[2], _v.z); max[0] = Math.max(max[0], _v.x); max[1] = Math.max(max[1], _v.y); max[2] = Math.max(max[2], _v.z); }
    return { min, max };
  };

  // ── materials ──
  const isFoliage = d => d.alphaTest > 0 || /leaf|leaves|grass|flower|vine|fern|plant|clover/i.test(d.name);
  const isGlass = d => /glass/i.test(d.name);
  const gradeFn = c => {
    const G_ = K_.grade, l = dot(c, vec3(0.2126, 0.7152, 0.0722)), wp = positionWorld;
    const st = texture(G.noiseTex, vec2(wp.x.add(wp.z.mul(0.7)).mul(0.11), wp.y.mul(0.16).add(wp.z.mul(0.05)))), stain = st.r.mul(0.65).add(st.g.mul(0.35)).sub(0.5).mul(1.5);
    return mix(vec3(l), c, G_.sat).mul(G_.tint).mul(G_.gain).mul(stain.mul(G_.weather).add(1).clamp(0.55, 1.25));
  };
  // mode 'batch': per-vertex kc (rgb tint, a sky visibility) and kz (x zone / 255, y emissive strength / 16 * 255 ...). mode 'inst': InstancedMesh, outdoors.
  function material(name, mode, o) {
    o = o || {};
    const key = name + '|' + mode + '|' + (o.wind ? 'w' : '') + (o.zone || 0) + (o.skyVis === undefined ? '' : o.skyVis);
    let m = K_.mats.get(key); if (m) return m;
    const d = K_.defs[name] || { name, color: [1, 1, 1], uvScale: [1, 1], gain: 1, rough: 1, metal: 0, alphaTest: 0, emissive: [0, 0, 0], nScale: 1 }, U = SH.U;
    m = new THREE.MeshStandardNodeMaterial(); m.name = key;
    const uvn = (d.uvScale[0] !== 1 || d.uvScale[1] !== 1) ? uv().mul(vec2(d.uvScale[0], d.uvScale[1])) : uv();
    const batch = mode === 'batch';
    const kc = batch ? attribute('kc', 'vec4') : null, kz = batch ? attribute('kz', 'vec4') : null;
    const tint = batch ? kc.rgb : (o.hasColor ? attribute('color', 'vec3') : vec3(1)).mul(o.hasTint ? attribute('itint', 'vec3') : vec3(1));
    // wall modules are often a single sheet seen from both sides: its back face is the room side. Such pieces carry a second zone and
    // sky visibility (kz.z, kz.w) that the back face uses; pieces without that have both pairs equal.
    const inside = batch ? frontFacing.not().and(abs(kz.z.sub(kz.x)).greaterThan(0.002)) : null;
    const skyVis = batch ? select(inside, kz.w, kc.a) : float(o.skyVis === undefined ? 1 : o.skyVis), zone = batch ? select(inside, kz.z, kz.x).mul(255).round() : float(o.zone || 0);
    const glow = batch ? kz.y.mul(255 / 16) : float(0);          // extra self-illumination in HDR units (candle wax near the flame, embers)
    const N = normalWorld, wp = positionWorld;
    if (isGlass(d)) {         // window panes: dark by day with a little sky in them, lit from inside after dusk (each pane a slightly different warmth)
      const cell = floor(wp.mul(0.9)), h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));
      const V = normalize(wp.sub(U.camPos)), R = reflect(V, N);
      const sky = SH.skyBase(vec3(R.x, max(R.y, 0.02), R.z)).mul(0.22);
      const lit = vec3(1.0, 0.60, 0.24).mul(h.mul(0.9).add(0.35)).mul(U.windowGlow).mul(2.4).mul(smoothstep(0.12, 0.3, h));
      m.colorNode = vec3(0.012, 0.016, 0.02); m.roughnessNode = float(0.15); m.metalnessNode = float(0);
      // from the room side a pane just shows the dim sky outside
      const outsideView = batch ? frontFacing : frontFacing;
      m.emissiveNode = select(outsideView, sky.add(lit), SH.skyBase(vec3(V.x, max(V.y, 0.03), V.z)).mul(0.55)).add(vec3(0.02, 0.025, 0.03).mul(SH.hemi(N, float(1), float(0))));
      m.side = THREE.DoubleSide;
      K_.mats.set(key, m); return m;
    }
    const base = d.map ? texture(d.map, uvn) : vec4(1);
    const orm = d.orm ? texture(d.orm, uvn) : null;
    const metal = orm ? orm.b : float(d.metal || 0);
    // no reflection probes here, so metal keeps a darkened diffuse instead of going black, and gets its shine from a lower roughness
    const raw = base.rgb.mul(vec3(d.color[0] * d.gain, d.color[1] * d.gain, d.color[2] * d.gain)).mul(tint);
    const alb = gradeFn(d.sat === undefined ? raw : mix(vec3(dot(raw, vec3(0.2126, 0.7152, 0.0722))), raw, d.sat)).mul(metal.mul(0.45).oneMinus()).toVar('kitAlbedo');
    const ao = (orm && d.aoInOrm) ? orm.r : float(1);
    m.colorNode = vec4(alb, d.opacity < 1 ? base.a.mul(d.opacity) : base.a);
    if (d.normalMap) m.normalNode = normalMap(texture(d.normalMap, uvn), vec2(d.nScale, d.nScale));
    m.roughnessNode = orm ? orm.g.mul(d.roughMul === undefined ? 1 : d.roughMul).clamp(0.08, 1) : float(d.rough);
    m.metalnessNode = float(0);
    let em = alb.mul(SH.hemi(N, skyVis.mul(ao), zone).add(SH.pointLights(wp, N, zone, 0.25).mul(ao.mul(0.4).add(0.6))));
    em = em.add(alb.mul(glow));
    if (d.emissiveMap) em = em.add(texture(d.emissiveMap, uvn).rgb.mul(vec3(d.emissive[0], d.emissive[1], d.emissive[2])));
    else if (d.emissive[0] + d.emissive[1] + d.emissive[2] > 0) em = em.add(vec3(d.emissive[0], d.emissive[1], d.emissive[2]));
    m.emissiveNode = em;
    if (batch) m.receivedShadowNode = Fn(([shadow]) => shadow.mul(select(inside, float(0), float(1))));      // the sheet would not shadow its own back face
    if (d.alphaTest > 0) { m.alphaTest = Math.max(d.alphaTest, 0.35); m.side = THREE.DoubleSide; }
    else m.side = d.doubleSided && !o.frontOnly ? THREE.DoubleSide : THREE.FrontSide;
    if (d.blend && !(d.alphaTest > 0)) { m.transparent = true; m.depthWrite = false; }
    if (o.wind) {             // trees lean with the gusts, leaves and grass flutter on top; the root stays planted
      m.positionNode = Fn(() => {
        const p = positionLocal, h = max(positionGeometry.y, 0), t = U.wind.w, ph = p.x.mul(0.31).add(p.z.mul(0.27));
        const lean = h.mul(h).mul(0.0016).mul(sin(t.mul(0.9).add(ph.mul(0.35))).mul(0.6).add(0.55));
        const flut = sin(t.mul(3.1).add(ph.mul(4.0)).add(h.mul(1.7))).mul(isFoliage(d) ? 0.035 : 0).mul(smoothstep(0.0, 1.2, h));
        const k = lean.add(flut).mul(U.wind.z);
        return vec3(p.x.add(U.wind.x.mul(k)), p.y, p.z.add(U.wind.y.mul(k)));
      })();
    }
    K_.mats.set(key, m); return m;
  }
  K_.material = material;

  // ── batches ──
  K_.batch = function (opts) {
    opts = opts || {};
    const cell = opts.cell || 24, buckets = new Map(), inst = [], B = { count: 0 };
    // o: { zone: 0 outdoors | n the interior of building n, skyVis: 1 outdoors .. ~0.3 indoors, tint: [r,g,b] linear, cast: true, glow: HDR self-illumination,
    //      lit: 0..1 for light-source pieces: the wax around each flame position glows (the flame itself is a particle the game adds),
    //      inZone, inSkyVis: for wall, gable and roof pieces (outside face = local +z or up): the room side gets this zone / sky visibility instead }
    B.add = function (name, xf, o) {
      const p = K_.pieces[name]; if (!p) { console.warn('Kit: unknown piece ' + name); return B; }
      o = o || {};
      const M = toMatrix(xf);
      _v.set((p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2).applyMatrix4(M);
      const ck = Math.floor(_v.x / cell) + ',' + Math.floor(_v.z / cell), cast = o.cast === false ? 0 : 1;
      for (const prim of p.prims) {
        const key = prim.mat + '|' + ck + '|' + cast; let b = buckets.get(key);
        if (!b) buckets.set(key, b = { mat: prim.mat, cast, items: [], nv: 0, ni: 0 });
        b.items.push({ prim, M, zone: o.zone || 0, skyVis: o.skyVis === undefined ? 1 : o.skyVis, tint: o.tint || null, glow: o.glow || 0, lit: o.lit || 0, lights: o.lit ? ((K_.cat[name] || {}).lights || null) : null, inZone: o.inZone, inSky: o.inSkyVis === undefined ? 0.3 : o.inSkyVis }); b.nv += prim.n; b.ni += prim.idx.length;
      }
      B.count++; return B;
    };
    // many copies of one piece (trees, rocks, tufts). matrices: array of Matrix4 / shorthand. o: { tints: [[r,g,b]...], wind, cast, cell, maxDist, zone, skyVis }
    B.addInstanced = function (name, matrices, o) {
      const p = K_.pieces[name]; if (!p) { console.warn('Kit: unknown piece ' + name); return B; }
      inst.push({ p, matrices: matrices.map(x => toMatrix(x)), o: o || {} }); return B;
    };
    B.build = function () {
      const group = new THREE.Group(); group.name = opts.name || 'kit-batch'; group.matrixAutoUpdate = false;
      const nm = new THREE.Matrix3(), v = new THREE.Vector3();
      for (const b of buckets.values()) {
        const pos = new Float32Array(b.nv * 3), nrm = new Int8Array(b.nv * 4), uvs = new Float32Array(b.nv * 2), kc = new Uint8Array(b.nv * 4), kz = new Uint8Array(b.nv * 4);
        const idx = b.nv > 65535 ? new Uint32Array(b.ni) : new Uint16Array(b.ni); let vo = 0, io = 0;
        for (const it of b.items) {
          const pr = it.prim, M = it.M, flip = M.determinant() < 0; nm.getNormalMatrix(M);
          const sky = Math.round(Math.min(Math.max(it.skyVis, 0), 1) * 255), skyIn = Math.round(Math.min(Math.max(it.inSky, 0), 1) * 255), split = it.inZone !== undefined, tr = it.tint ? it.tint[0] : 1, tg = it.tint ? it.tint[1] : 1, tb = it.tint ? it.tint[2] : 1, gl = Math.min(255, Math.round(it.glow * 16));
          for (let i = 0; i < pr.n; i++) {
            const o = vo + i;
            v.set(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2]).applyMatrix4(M); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
            v.set(pr.nrm[i * 3], pr.nrm[i * 3 + 1], pr.nrm[i * 3 + 2]).applyMatrix3(nm).normalize(); nrm[o * 4] = Math.round(v.x * 127); nrm[o * 4 + 1] = Math.round(v.y * 127); nrm[o * 4 + 2] = Math.round(v.z * 127);
            uvs[o * 2] = pr.uv[i * 2]; uvs[o * 2 + 1] = pr.uv[i * 2 + 1];
            const c = pr.col;
            kc[o * 4] = Math.min(255, Math.round((c ? c[i * 3] : 1) * tr * 255)); kc[o * 4 + 1] = Math.min(255, Math.round((c ? c[i * 3 + 1] : 1) * tg * 255)); kc[o * 4 + 2] = Math.min(255, Math.round((c ? c[i * 3 + 2] : 1) * tb * 255));
            // faces modelled toward the room (inner plaster, the ceiling beam, reveals) are indoors outright; single sheets switch by facing in the shader
            const inside = split && (pr.nrm[i * 3 + 2] < -0.5 || (pr.nrm[i * 3 + 2] < 0.5 && pr.pos[i * 3 + 2] < -0.12));
            kc[o * 4 + 3] = inside ? skyIn : sky; kz[o * 4] = inside ? it.inZone : it.zone;
            let g1 = gl;
            if (it.lights) { let best = 9; for (const L of it.lights) { const dx = pr.pos[i * 3] - L[0], dy = pr.pos[i * 3 + 1] - L[1], dz = pr.pos[i * 3 + 2] - L[2]; best = Math.min(best, Math.sqrt(dx * dx + dy * dy * 0.5 + dz * dz)); } g1 = Math.min(255, gl + Math.round(Math.max(0, 1 - best / 0.11) * it.lit * 40)); }
            kz[o * 4 + 1] = g1;
            kz[o * 4 + 2] = split ? it.inZone : it.zone; kz[o * 4 + 3] = split ? skyIn : sky;
          }
          const src = pr.idx;
          if (flip) for (let i = 0; i < src.length; i += 3) { idx[io + i] = src[i] + vo; idx[io + i + 1] = src[i + 2] + vo; idx[io + i + 2] = src[i + 1] + vo; }
          else for (let i = 0; i < src.length; i++) idx[io + i] = src[i] + vo;
          vo += pr.n; io += src.length;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 4, true)); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        g.setAttribute('kc', new THREE.BufferAttribute(kc, 4, true)); g.setAttribute('kz', new THREE.BufferAttribute(kz, 4, true)); g.setIndex(new THREE.BufferAttribute(idx, 1));
        g.computeBoundingBox(); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, material(b.mat, 'batch'));
        mesh.castShadow = !!b.cast && !isGlass(K_.defs[b.mat] || { name: b.mat }); mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = b.mat;
        group.add(mesh);
      }
      for (const it of inst) {
        const o = it.o, cs = o.cell || 48, cells = new Map();
        it.matrices.forEach((M, i) => { const k = Math.floor(M.elements[12] / cs) + ',' + Math.floor(M.elements[14] / cs); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(i); });
        for (const prim of it.p.prims) {
          const d = K_.defs[prim.mat] || { name: prim.mat, alphaTest: 0 };
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(prim.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(prim.nrm, 3)); g.setAttribute('uv', new THREE.BufferAttribute(prim.uv, 2));
          if (prim.col) g.setAttribute('color', new THREE.BufferAttribute(prim.col, 3));
          g.setIndex(new THREE.BufferAttribute(prim.idx, 1)); g.computeBoundingBox(); g.computeBoundingSphere();
          const wind = o.wind === undefined ? /tree|pine|bush|grass|flower|plant|fern|clover/i.test(it.p.name) : o.wind;
          const mat = material(prim.mat, 'inst', { wind, hasColor: !!prim.col, hasTint: !!o.tints, zone: o.zone, skyVis: o.skyVis });
          for (const list of cells.values()) {
            const gi = new THREE.BufferGeometry();          // shares the vertex buffers; each cell only adds its own instanced attributes
            for (const k of Object.keys(g.attributes)) gi.setAttribute(k, g.attributes[k]); gi.setIndex(g.index); gi.boundingBox = g.boundingBox; gi.boundingSphere = g.boundingSphere;
            const im = new THREE.InstancedMesh(gi, mat, list.length);
            list.forEach((src, j) => im.setMatrixAt(j, it.matrices[src]));
            if (o.tints) { const a = new Float32Array(list.length * 3); list.forEach((src, j) => { const t = o.tints[src] || [1, 1, 1]; a[j * 3] = t[0]; a[j * 3 + 1] = t[1]; a[j * 3 + 2] = t[2]; }); gi.setAttribute('itint', new THREE.InstancedBufferAttribute(a, 3)); }
            im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.computeBoundingBox();
            im.castShadow = o.cast !== false; im.receiveShadow = true; im.matrixAutoUpdate = false; im.name = it.p.name + ':' + prim.mat;
            if (o.maxDist) { im.userData.maxDist = o.maxDist; K_.instanced.push(im); }
            group.add(im);
          }
        }
      }
      return group;
    };
    return B;
  };
  // hides instanced cells that asked for a draw distance (o.maxDist) once the camera is farther than that
  K_.update = function (camPos) {
    for (const im of K_.instanced) { const s = im.boundingSphere, dx = s.center.x - camPos[0], dz = s.center.z - camPos[2]; im.visible = Math.sqrt(dx * dx + dz * dz) - s.radius < im.userData.maxDist; }
  };
  return K_;
})();
