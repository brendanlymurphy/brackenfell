// ───────────────────────── asset kits: modular buildings, props, nature (glTF packs under kits/) ─────────────────────────
// A pack is one GLB whose top-level nodes are the pieces, plus a catalogue (bbox, category, notes). Pieces from every pack share one
// namespace. Level code places pieces through a batch, which merges them into a few meshes per material and 24 m cell, or as
// instanced meshes for things repeated hundreds of times. Every kit material is lit like the rest of the world: Three's sun light
// and shadow, plus ambient and the zone-aware point lights in the emissive term (see 40_shade.js).
const Kit = (() => {
  const { Fn, float, vec2, vec3, vec4, uniform, attribute, texture, uv, positionWorld, positionLocal, positionGeometry, normalWorld, normalMap,
    mix, dot, sin, floor, fract, smoothstep, max, reflect, normalize, pow, frontFacing, select, abs, step } = TSL;
  const K_ = {
    PACKS: [{ glb: 'kits/village.glb', catalog: 'kits/CATALOG.json' }, { glb: 'kits/props.glb' }, { glb: 'kits/nature.glb' }, { glb: 'kits/scan.glb', catalog: 'kits/SCAN_CATALOG.json', optional: true }, { glb: 'kits/dungeon.glb', catalog: 'kits/DUNGEON_CATALOG.json', optional: true }]  /* q1: dungeon pack */,
    pieces: {}, far: {}, cat: {}, defs: {}, mats: new Map(), skin: 'realistic', skinDef: {}, ready: false, instanced: [], pending: [],
    fill: null, fill2: null, grade: null, FAR_KEEP: 2.5, FAR_DROP: /Shutter|Balcony|Lantern|Prop_|Flower|Vine|Torch|Sign|Banner|Barrel|Crate|Bag|Pot_/,
    lodMeshes: [], SMALL: /kits\/(village|props|nature)\.glb$/,
    ROOF: /^(S_|T_)?(Roof_(RoundTile|Modular|Tower|Wooden|2x4|Log|Dormer)|Overhang_Roof)|^gen_/,       // slope pieces and generated pieces: outside faces are marked by their own normals (down = room side), not by the kit wall convention (outside = +z)
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
    const loader = T3X.gltf();
    let gltf;
    const small = GFX_TEX.color <= 512 && K_.SMALL.test(pack.glb), url = small ? pack.glb.replace('kits/', 'kits/s/') : pack.glb;       // phones and the lighter tiers cap textures at 512: they fetch the pack that only holds that much
    try { gltf = await loader.loadAsync(url, e => { if (progress && e.total) progress(e.loaded / e.total); }); }
    catch (e) { if (pack.optional) return false; throw new Error('kit ' + pack.glb + ': ' + (e && e.message || e)); }
    if (pack.catalog) { const c = await fetchJson(pack.catalog, pack.optional); if (c) Object.assign(K_.cat, c.pieces || c); }
    gltf.scene.updateMatrixWorld(true);
    for (const node of gltf.scene.children) {
      if (/@far$/.test(node.name)) { const fp = []; node.traverse(o => { if (o.isMesh) { registerMaterial(o.material); fp.push(extract(o)); } }); K_.far[node.name.slice(0, -4)] = fp; continue; }      // the light copy of a piece (tools/kits_far.mjs)
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
    const jobs = [], skinDir = GFX_TEX.color <= 512 && GFX_TEX.data <= 512 ? 'kits/skin/s/' : 'kits/skin/';       // half-size copies (tools/assets_pack.mjs) where the cap would halve them anyway
    for (const name of Object.keys(S.materials || {})) {
      const s = S.materials[name], d = K_.defs[name]; if (!d) continue;
      if (s.tint) d.color = d.color.map((v, i) => v * s.tint[i]); if (s.moss !== undefined) d.moss = s.moss; if (s.gain !== undefined) d.gain = s.gain; if (s.sat !== undefined) d.sat = s.sat; if (s.uvScale) d.uvScale = s.uvScale; if (s.nScale !== undefined) d.nScale = s.nScale; if (s.rough !== undefined) d.roughMul = s.rough;
      if (s.a) jobs.push(texLoad(skinDir + s.a, 'color').then(t => { dropPainted(d.map, t); d.map = t; }));
      if (s.n) jobs.push(texLoad(skinDir + s.n, 'data').then(t => { dropPainted(d.normalMap, t); d.normalMap = t; }));
      if (s.orm) jobs.push(texLoad(skinDir + s.orm, 'data').then(t => { dropPainted(d.orm, t); d.orm = t; d.aoInOrm = s.ao !== false; }));
    }
    await Promise.all(jobs);
  }
  K_.gradeInit = { sat: 1, gain: 1, tint: [1, 1, 1], weather: 0 };
  // opts: { packs: [{ glb, catalog, optional }], skin: 'realistic' | 'painted' }
  K_.load = async function (progress, opts) {
    if (GFX_TEX.color <= 512 && typeof Load !== 'undefined' && Load.groups && Load.groups.indexOf('kits') >= 0) Load.use(Load.groups.map(g => g === 'kits' ? 'kitss' : g));       // the loading bar counts the small packs this device fetches
    opts = opts || {};
    const packs = opts.packs || K_.PACKS; K_.skin = opts.skin || (TEST && TEST.skin) || 'realistic';
    for (let i = 0; i < packs.length; i++) await loadPack(packs[i], f => progress && progress((i + f) / (packs.length + 1)));
    await Promise.all(K_.pending); K_.pending.length = 0;
    if (K_.skin === 'realistic') await loadSkin();
    const g = K_.gradeInit;
    K_.grade = { sat: uniform(g.sat), gain: uniform(g.gain), tint: uniform(new THREE.Vector3(g.tint[0], g.tint[1], g.tint[2])), weather: uniform(g.weather || 0) };
    if (K_.skin !== 'realistic') { K_.grade.sat.value = 1; K_.grade.gain.value = 1; K_.grade.tint.value.set(1, 1, 1); K_.grade.weather.value = 0; }
    K_.fill = uniform(new THREE.Vector3(0.0, 0.02, 0.012)); K_.occ = uniform(new THREE.Vector3(0.42, 0.62, 0.8));      // [l1] occlusion at the ground, under eaves, share taken from the sun
    K_.fill2 = uniform(new THREE.Vector3(0.25, 0.3, 0.02));
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
    if (isGlass(d) && /stained/i.test(d.name)) {       // leaded coloured glass (kc.rgb = the pane's base colour): jewel colours from inside by day, a lamp-lit glow from outside after dusk
      const h2 = abs(N.z), hc = wp.x.mul(h2).add(wp.z.mul(abs(N.x))), cell = floor(vec2(hc.mul(3.4), wp.y.mul(3.0))), fr = vec2(fract(hc.mul(3.4)), fract(wp.y.mul(3.0)));
      const hh = fract(sin(dot(cell, vec2(12.9898, 78.233))).mul(43758.5453)), h3 = fract(hh.mul(7.31).add(0.37));
      const lead = float(1).sub(smoothstep(0.0, 0.09, fr.x.min(fr.y).min(float(1).sub(fr.x).min(float(1).sub(fr.y)))));
      const base = kc.rgb, pane = mix(base, base.zxy.mul(0.9).add(vec3(0.05, 0.03, 0.0)), smoothstep(0.55, 0.62, hh)).mul(h3.mul(0.7).add(0.55)).mul(lead.oneMinus().mul(0.92).add(0.08));
      const V = normalize(wp.sub(U.camPos)), R = reflect(V, N), sky = SH.skyBase(vec3(R.x, max(R.y, 0.02), R.z)).mul(0.12);
      m.colorNode = vec3(0.01, 0.012, 0.015); m.roughnessNode = float(0.2); m.metalnessNode = float(0);
      const dayF = float(1).sub(U.windowGlow);
      const jew = pane.mul(pane).mul(1.6);
      m.emissiveNode = select(frontFacing, sky.add(jew.mul(U.windowGlow.mul(1.5).add(0.05))), jew.mul(dayF.mul(0.9).add(0.08)));
      m.side = THREE.DoubleSide; K_.mats.set(key, m); return m;
    }
    if (isGlass(d)) {         // window panes: dark by day with a little sky in them, lit from inside after dusk (each pane a slightly different warmth)
      const cell = floor(wp.mul(0.9)), h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));
      const V = normalize(wp.sub(U.camPos)), R = reflect(V, N);
      const sky = SH.skyBase(vec3(R.x, max(R.y, 0.02), R.z)).mul(0.22);
      const lit = SH.paneLit ? SH.paneLit(wp, N, h) : vec3(1.0, 0.60, 0.24).mul(h.mul(0.9).add(0.35)).mul(U.windowGlow).mul(2.4).mul(smoothstep(0.12, 0.3, h));      // fork-look: leaded amber panes that do not clip (40_shade.js)
      m.colorNode = vec3(0.012, 0.016, 0.02); m.roughnessNode = float(0.15); m.metalnessNode = float(0);
      // from the room side a pane just shows the dim sky outside
      const outsideView = batch ? frontFacing : frontFacing;
      m.emissiveNode = select(outsideView, sky.add(lit), (SH.paneOut ? SH.paneOut(wp, N, V) : SH.skyBase(vec3(V.x, max(V.y, 0.03), V.z)).mul(0.55))).add(vec3(0.02, 0.025, 0.03).mul(SH.hemi(N, float(1), float(0))));
      m.side = THREE.DoubleSide;
      K_.mats.set(key, m); return m;
    }
    const base = d.map ? texture(d.map, uvn) : vec4(1);
    const orm = d.orm ? texture(d.orm, uvn) : null;
    const metal = orm ? orm.b : float(d.metal || 0);
    // no reflection probes here, so metal keeps a darkened diffuse instead of going black, and gets its shine from a lower roughness
    const raw = base.rgb.mul(vec3(d.color[0] * d.gain, d.color[1] * d.gain, d.color[2] * d.gain)).mul(tint);
    let rawS = d.sat === undefined ? raw : mix(vec3(dot(raw, vec3(0.2126, 0.7152, 0.0722))), raw, d.sat);
    if (d.moss) {         // roofs: patches of moss and lichen at a scale no tile texture repeats at
      const mn = texture(G.noiseTex, vec2(wp.x.mul(0.37).add(wp.z.mul(0.21)), wp.z.mul(0.33).sub(wp.y.mul(0.25)))), mk = smoothstep(0.62, 0.8, mn.r.mul(0.7).add(mn.g.mul(0.3))).mul(d.moss);
      rawS = mix(rawS, vec3(0.2, 0.27, 0.1).mul(dot(raw, vec3(1.4, 1.4, 1.4)).add(0.5)), mk);
    }
    // depth and grime (40b_depth.js): room occlusion for everything indoors; dirt, soot and (outdoors, from the kg heights) mud, moss and eave stains on walls
    const useRoom = batch || !!o.zone, rm = useRoom ? SH.room(wp, N, zone).toVar() : null;
    let gcol = gradeFn(rawS);
    if (batch && /Plaster|Brick|Rock|WoodTrim/.test(name)) {
      const kg = attribute('kg', 'vec4'), gr = SH.grime(wp, N, kg.x.mul(8), kg.y.mul(8), rm.y, rm.z, float(/Brick|Rock/.test(name) ? 1 : 0)).toVar();
      gcol = mix(gcol.mul(gr.rgb), vec3(0.15, 0.22, 0.07).mul(dot(gcol, vec3(1.2)).add(0.35)), gr.w.mul(0.75));
    }
    const alb = gcol.mul(metal.mul(0.45).oneMinus()).toVar('kitAlbedo');
    const ao = (orm && d.aoInOrm) ? orm.r : float(1);
    m.colorNode = vec4(alb, d.opacity < 1 ? base.a.mul(d.opacity) : base.a);
    if (d.normalMap) m.normalNode = normalMap(texture(d.normalMap, uvn), vec2(d.nScale, d.nScale));
    m.roughnessNode = orm ? orm.g.mul(d.roughMul === undefined ? 1 : d.roughMul).clamp(0.08, 1) : float(d.rough);
    m.metalnessNode = float(0);
    const aoR = rm ? rm.x : float(1);
    let em = alb.mul(SH.hemi(N, skyVis.mul(ao).mul(aoR), zone).add(SH.pointLights(wp, N, zone, 0.25).mul(ao.mul(0.4).add(0.6)).mul(aoR.mul(0.65).add(0.35)).add(SH.winLight(wp, N, zone).mul(ao.mul(0.4).add(0.6)).mul(aoR.mul(0.6).add(0.4)))));      // [l1] window light (40c_light.js)
    em = em.add(alb.mul(glow));
    if (!isFoliage(d)) {          // outdoors, a surface turned from the sun keeps readable texture: a fill of sun-coloured bounce and sky, and a floor (roofs and walls went black in shade)
      const outM = float(1).sub(step(0.5, zone)), F = K_.fill, F2 = K_.fill2, wallK = float(1).sub(smoothstep(0.25, 0.55, N.y));       // roofs get F, upright walls F + F2 (dark timber must still read in shade)
      em = em.add(alb.mul(U.sunCol.mul(F.x.add(F2.x.mul(wallK))).add(U.ambSky.mul(F.y.add(F2.y.mul(wallK))))).mul(skyVis).mul(outM));
      const dayK = smoothstep(0.012, 0.2, dot(U.ambSky, vec3(0.3333))).mul(0.97).add(0.03);       // the floor follows the daylight: constant, it left roofs and walls glowing pale at night while the ground went dark
      const fl = F.z.add(F2.z.mul(wallK)).mul(skyVis).mul(outM).mul(dayK);
      em = max(em, alb.mul(fl.mul(4)).add(vec3(fl.mul(0.4))));       // a floor that keeps the surface's own colour (black albedo still reads a little)
    }
    // [l1] contact and eave occlusion on outdoor walls (kg.x: metres above the ground, kg.y: metres below the eaves; 8 = none): a wall darkens where it meets the ground and under its eaves, sun included
    let occK = float(1);
    if (batch && !isFoliage(d)) {
      const kgo = attribute('kg', 'vec4'), hg = kgo.x.mul(8), ev = kgo.y.mul(8), wl = float(1).sub(abs(N.y)), outM2 = float(1).sub(step(0.5, zone));
      const occ = mix(float(1), mix(K_.occ.x, float(1), smoothstep(0.0, 1.3, hg)), wl).mul(mix(float(1), mix(K_.occ.y, float(1), smoothstep(0.0, 0.8, ev)), wl));
      occK = mix(float(1), occ, outM2); em = em.mul(occK);
    }
    if (d.emissiveMap) em = em.add(texture(d.emissiveMap, uvn).rgb.mul(vec3(d.emissive[0], d.emissive[1], d.emissive[2])));
    else if (d.emissive[0] + d.emissive[1] + d.emissive[2] > 0) em = em.add(vec3(d.emissive[0], d.emissive[1], d.emissive[2]));
    m.emissiveNode = em;
    if (batch) m.receivedShadowNode = Fn(([shadow]) => shadow.mul(select(inside, float(0), float(1))).mul(mix(float(1), occK, K_.occ.z)));      // [l1] occK: contact and eave occlusion also takes some of the sun      // the sheet would not shadow its own back face
    if (d.alphaTest > 0) { m.alphaTest = Math.max(d.alphaTest, 0.35); m.side = THREE.DoubleSide; }
    else m.side = d.doubleSided && !o.frontOnly ? THREE.DoubleSide : THREE.FrontSide;
    if (d.blend && !(d.alphaTest > 0)) { m.transparent = true; m.depthWrite = false; }
    if (batch && SH.hangSway) m.positionNode = SH.hangSway();      // fork-look: vertices marked as hanging (kg.z) sway; all others are untouched
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
    // Outdoor batches are "dynamic": every placed piece (a unit) keeps its own range of indices in the merged meshes, and K_.update
    // rewrites each mesh's index buffer from the units that matter now: full model near the camera, the far copy beyond R.q.houseFar,
    // nothing when it is too small to see at that distance, outside the view cone or hidden behind nearer houses. So detail is decided
    // house by house (it used to be per 48 m cell) and a batch is one draw call per material, not one per material and cell.
    // Interior batches (their own cell, a few rooms) stay static: merged per material and opts.cell, drawn whole.
    const dyn = !(TEST && TEST.kitdyn === 0) && opts.dynamic !== false && !/^kitint|^kitfine/.test(opts.name || ''), units = [];
    const cell = dyn ? 1e7 : (opts.cell || 24), buckets = new Map(), inst = [], B = { count: 0, tally: {} };      // tally: how often each piece was placed (for budgets)
    // o: { zone: 0 outdoors | n the interior of building n, skyVis: 1 outdoors .. ~0.3 indoors, tint: [r,g,b] linear, cast: true, glow: HDR self-illumination,
    //      lit: 0..1 for light-source pieces: the wax around each flame position glows (the flame itself is a particle the game adds),
    //      uvs: [sx, sy] the panel's scale, so plaster and brick keep their texel size instead of stretching
    //      inZone, inSkyVis: for wall, gable and roof pieces (outside face = local +z or up): the room side gets this zone / sky visibility instead }
    B.add = function (name, xf, o) {
      const p = K_.pieces[name]; if (!p) { console.warn('Kit: unknown piece ' + name); return B; }
      o = o || {};
      const M = toMatrix(xf);
      if (TEST && TEST.audit) (window.__AUDIT_KIT = window.__AUDIT_KIT || []).push({ name, M: M.clone(), zone: o.zone || 0 });          // test/audit.js: every placed piece (coplanar-face audit)
      _v.set((p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2).applyMatrix4(M);
      const ck = Math.floor((_v.x + (opts.off || 0)) / cell) + ',' + Math.floor((_v.z + (opts.off || 0)) / cell), cast = o.cast === false ? 0 : 1;
      // the unit: where the piece stands and how big it is (for distance, view-cone and occlusion tests), and its outline seen from above (as an occluder)
      const e = M.elements, sc = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
      const unit = { x: _v.x, y: _v.y, z: _v.z, r: 0.5 * Math.hypot(p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]) * sc, name, state: 1, hasFar: false, always: !!o.zone, y0: 1e9, y1: -1e9, foot: null, ents: [] };
      { const foot = []; for (let k = 0; k < 8; k++) { const q = new THREE.Vector3(k & 1 ? p.max[0] : p.min[0], k & 2 ? p.max[1] : p.min[1], k & 4 ? p.max[2] : p.min[2]).applyMatrix4(M); unit.y0 = Math.min(unit.y0, q.y); unit.y1 = Math.max(unit.y1, q.y); if (!(k & 2)) foot.push([q.x, q.z]); } unit.foot = foot; }
      if (dyn) units.push(unit);
      for (const prim of p.prims) {
        const key = prim.mat + '|' + ck + '|' + cast; let b = buckets.get(key);
        if (!b) buckets.set(key, b = { mat: prim.mat, cast, items: [], nv: 0, ni: 0 });
        b.items.push({ prim, M, zone: o.zone || 0, skyVis: o.skyVis === undefined ? 1 : o.skyVis, tint: o.tint || null, glow: o.glow || 0, lit: o.lit || 0, lights: o.lit ? ((K_.cat[name] || {}).lights || null) : null, inZone: o.inZone, inSky: o.inSkyVis === undefined ? 0.3 : o.inSkyVis, uvs: o.uvs && /Plaster|Brick/.test(prim.mat) ? o.uvs : null, rf: K_.ROOF.test(name), unit, farCopy: false }); b.nv += prim.n; b.ni += prim.idx.length;
      }
      // the far copy of this piece: its own light version if the pack has one, nothing for small things (under FAR_KEEP metres across), else the piece itself
      if (opts.far) {
        const fp = K_.far[name] || ((Math.max(p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]) >= K_.FAR_KEEP && !(K_.FAR_DROP.test(name))) ? p.prims : []);
        for (const prim of fp) {
          const key = prim.mat + '|' + ck + (dyn ? '|0' : '|far'); let b = buckets.get(key);      // dynamic: far copies share the material's mesh with the full models
          if (!b) buckets.set(key, b = { mat: prim.mat, cast: 0, far: !dyn, items: [], nv: 0, ni: 0 }); unit.hasFar = true;
          b.items.push({ prim, M, zone: o.zone || 0, skyVis: o.skyVis === undefined ? 1 : o.skyVis, tint: o.tint || null, glow: 0, lit: 0, lights: null, inZone: o.inZone, inSky: o.inSkyVis === undefined ? 0.3 : o.inSkyVis, uvs: o.uvs && /Plaster|Brick/.test(prim.mat) ? o.uvs : null, rf: K_.ROOF.test(name), unit, farCopy: true }); b.nv += prim.n; b.ni += prim.idx.length;
        }
      }
      B.count++; B.tally[name] = (B.tally[name] || 0) + 1; return B;
    };
    // many copies of one piece (trees, rocks, tufts). matrices: array of Matrix4 / shorthand. o: { tints: [[r,g,b]...], wind, cast, cell, maxDist, zone, skyVis }
    B.addInstanced = function (name, matrices, o) {
      const p = K_.pieces[name]; if (!p) { console.warn('Kit: unknown piece ' + name); return B; }
      inst.push({ p, matrices: matrices.map(x => toMatrix(x)), o: o || {} }); return B;
    };
    B.build = function () {
      const group = new THREE.Group(); group.name = opts.name || 'kit-batch'; group.matrixAutoUpdate = false;
      const nm = new THREE.Matrix3(), v = new THREE.Vector3(), D = dyn ? { name: group.name, group, far: !!opts.far, units, buckets: [], key: '' } : null;
      for (const b of buckets.values()) {
        const pos = new Float32Array(b.nv * 3), nrm = new Int8Array(b.nv * 4), uvs = new Float32Array(b.nv * 2), kc = new Uint8Array(b.nv * 4), kz = new Uint8Array(b.nv * 4), kg = new Uint8Array(b.nv * 4).fill(255);
        const gB = opts.gBase, gT = opts.gTop;
        const idx = b.nv > 65535 ? new Uint32Array(b.ni) : new Uint16Array(b.ni); let vo = 0, io = 0;
        for (const it of b.items) {
          const pr = it.prim, M = it.M, flip = M.determinant() < 0; nm.getNormalMatrix(M);
          const hang = SH.hangOf && !it.zone ? SH.hangOf(pr, M) : null;      // fork-look: pennants, washing and hung signs move with the wind (50_env.js)
          const sky = Math.round(Math.min(Math.max(it.skyVis, 0), 1) * 255), skyIn = Math.round(Math.min(Math.max(it.inSky, 0), 1) * 255), split = it.inZone !== undefined, tr = it.tint ? it.tint[0] : 1, tg = it.tint ? it.tint[1] : 1, tb = it.tint ? it.tint[2] : 1, gl = Math.min(255, Math.round(it.glow * 16));
          for (let i = 0; i < pr.n; i++) {
            const o = vo + i;
            v.set(pr.pos[i * 3], pr.pos[i * 3 + 1], pr.pos[i * 3 + 2]).applyMatrix4(M); pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
            if (gB !== undefined) kg[o * 4] = Math.max(0, Math.min(255, Math.round((v.y - gB) * 32))); if (gT !== undefined) kg[o * 4 + 1] = Math.max(0, Math.min(255, Math.round((gT - v.y) * 32)));
            v.set(pr.nrm[i * 3], pr.nrm[i * 3 + 1], pr.nrm[i * 3 + 2]).applyMatrix3(nm).normalize(); nrm[o * 4] = Math.round(v.x * 127); nrm[o * 4 + 1] = Math.round(v.y * 127); nrm[o * 4 + 2] = Math.round(v.z * 127);
            uvs[o * 2] = pr.uv[i * 2] * (it.uvs ? it.uvs[0] : 1); uvs[o * 2 + 1] = pr.uv[i * 2 + 1] * (it.uvs ? it.uvs[1] : 1);
            const c = pr.col;
            kc[o * 4] = Math.min(255, Math.round((c ? c[i * 3] : 1) * tr * 255)); kc[o * 4 + 1] = Math.min(255, Math.round((c ? c[i * 3 + 1] : 1) * tg * 255)); kc[o * 4 + 2] = Math.min(255, Math.round((c ? c[i * 3 + 2] : 1) * tb * 255));
            // faces modelled toward the room (inner plaster, the ceiling beam, reveals) are indoors outright; single sheets switch by facing in the shader
            const inside = split && (it.rf ? nrm[o * 4 + 1] < -38 : (pr.nrm[i * 3 + 2] < -0.5 || (pr.nrm[i * 3 + 2] < 0.5 && pr.pos[i * 3 + 2] < -0.12)));
            kc[o * 4 + 3] = inside ? skyIn : sky; kz[o * 4] = inside ? it.inZone : it.zone;
            let g1 = gl;
            if (it.lights) { let best = 9; for (const L of it.lights) { const dx = pr.pos[i * 3] - L[0], dy = pr.pos[i * 3 + 1] - L[1], dz = pr.pos[i * 3 + 2] - L[2]; best = Math.min(best, Math.sqrt(dx * dx + dy * dy * 0.5 + dz * dz)); } g1 = Math.min(255, gl + Math.round(Math.max(0, 1 - best / 0.11) * it.lit * 40)); }
            kz[o * 4 + 1] = g1;
            kz[o * 4 + 2] = split ? it.inZone : it.zone; kz[o * 4 + 3] = split ? skyIn : sky;
            if (hang) { kg[o * 4 + 2] = hang.w(i); kg[o * 4 + 3] = hang.dir; }      // fork-look
          }
          const src = pr.idx;
          if (flip) for (let i = 0; i < src.length; i += 3) { idx[io + i] = src[i] + vo; idx[io + i + 1] = src[i + 2] + vo; idx[io + i + 2] = src[i + 1] + vo; }
          else for (let i = 0; i < src.length; i++) idx[io + i] = src[i] + vo;
          if (D) { (b.ents || (b.ents = [])).push({ unit: it.unit, far: it.farCopy, start: io, count: src.length }); it.unit.ents.push(b); }
          vo += pr.n; io += src.length;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 4, true)); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        g.setAttribute('kc', new THREE.BufferAttribute(kc, 4, true)); g.setAttribute('kz', new THREE.BufferAttribute(kz, 4, true)); g.setAttribute('kg', new THREE.BufferAttribute(kg, 4, true)); g.setIndex(new THREE.BufferAttribute(idx, 1));
        g.computeBoundingBox(); g.computeBoundingSphere();
        if (D) {         // the index buffer on the GPU is a working copy: K_.update fills it from the units' ranges of `all`
          const cur = new (idx.constructor)(idx.length), at = new THREE.BufferAttribute(cur, 1); at.setUsage(THREE.DynamicDrawUsage); g.setIndex(at);
          let n = 0; for (const e of b.ents) if (!e.far) { cur.set(idx.subarray(e.start, e.start + e.count), n); n += e.count; } g.setDrawRange(0, n);
          b.all = idx; b.cur = cur; b.geo = g; b.dirty = false; D.buckets.push(b);
        }
        const mesh = new THREE.Mesh(g, material(b.mat, 'batch')); if (D) { b.mesh = mesh; mesh.frustumCulled = false; mesh.userData.kitDyn = true; }
        mesh.castShadow = !!b.cast && !isGlass(K_.defs[b.mat] || { name: b.mat }); mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = b.mat;
        if (opts.far && !D) { mesh.userData.lod = b.far ? 2 : 1; K_.lodMeshes.push(mesh); mesh.visible = !b.far; }       // 1 = the full mesh, 2 = its far copy: K_.update swaps them by distance
        group.add(mesh);
      }
      if (D) { D.buckets = D.buckets.map(b => ({ mat: b.mat, ents: b.ents, all: b.all, cur: b.cur, geo: b.geo, mesh: b.mesh })); for (const b of buckets.values()) { b.ents = null; b.all = b.cur = b.geo = b.mesh = null; }       // the batch keeps its own bucket list untouched (pieces added after the build are ignored, as before)
        for (const u of units) { u.D = D; u.ents = []; } K_.dyn.push(D); K_.dynNew.push(D); group.userData.kitDyn = D; }
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
  // Full or far meshes of batches built with { far: true }: the far copy is drawn from FAR metres (nearest point of the mesh's box) on, with a little hysteresis.
  K_.farDist = 55;
  function lodUpdate(camPos) {
    const F = (typeof R !== 'undefined' && R.q && R.q.houseFar) || K_.farDist;
    for (const m of K_.lodMeshes) {
      const g = m.geometry, b = g.boundingBox; if (!b) continue;
      const dx = Math.max(b.min.x - camPos[0], 0, camPos[0] - b.max.x), dz = Math.max(b.min.z - camPos[2], 0, camPos[2] - b.max.z), d = Math.sqrt(dx * dx + dz * dz);
      let far = m.userData.far; far = far ? d > F - 3 : d > F + 3; m.userData.far = far;
      m.visible = m.userData.lod === 2 ? far : !far;
    }
  }
  // ── dynamic batches: decide every unit's state, rewrite the index buffers that changed ──
  // state 0 = not drawn, 1 = full model, 2 = far copy. Runs when the camera has moved 1.5 m or turned 11 degrees (the view cone is cut
  // 20 degrees wider than the screen, so nothing can turn into view before the next run).
  // how far each kind of batch is drawn at all (m from the camera; the code that made the batch used to hide its cells at these ranges)
  K_.RANGE = { 'kit-yard': q => q.yardRange || 58, 'dress-town': q => (q.yardRange || 58) * 1.1 + 4, 'dress-out': q => (q.yardRange || 58) * 1.1 + 4 };
  K_.dyn = []; K_.dynNew = []; K_.pool = []; K_.dynLast = [1e9, 0, 1e9, 9, '']; K_.DROP = { low: 40, medium: 70, high: 100 };       // DROP: a piece without a far copy is drawn out to this many times its own size (m)
  // Pooling: batches built since the last run hand their meshes over; meshes with the same material, shadow flags and layers become one
  // mesh for the whole town (in K_.poolGroup). A batch's own group stays as the handle other code shows and hides: its units follow it.
  function poolNew() {
    const by = new Map(), fresh = K_.dynNew; K_.dynNew = [];
    for (const D of fresh) for (const b of D.buckets) { const m = b.mesh, k = b.mat + '|' + (m.castShadow ? 1 : 0) + (m.receiveShadow ? 1 : 0) + '|' + m.layers.mask + '|' + m.renderOrder; let l = by.get(k); if (!l) by.set(k, l = []); l.push(b); }
    if (!K_.poolGroup) { K_.poolGroup = new THREE.Group(); K_.poolGroup.name = 'kit-pool'; K_.poolGroup.matrixAutoUpdate = false; SC.scene.add(K_.poolGroup); }
    for (const list of by.values()) {
      const m0 = list[0].mesh; let nv = 0, ni = 0; for (const b of list) { nv += b.geo.attributes.position.count; ni += b.all.length; }
      const g = new THREE.BufferGeometry(), all = new Uint32Array(ni), ents = [];
      for (const k of Object.keys(m0.geometry.attributes)) { const a0 = m0.geometry.attributes[k], arr = new (a0.array.constructor)(nv * a0.itemSize); let o = 0; for (const b of list) { const a = b.geo.attributes[k].array; arr.set(a, o); o += a.length; } g.setAttribute(k, new THREE.BufferAttribute(arr, a0.itemSize, a0.normalized)); }
      let vo = 0, io = 0; for (const b of list) { const src = b.all; for (let i = 0; i < src.length; i++) all[io + i] = src[i] + vo; for (const e of b.ents) ents.push({ unit: e.unit, far: e.far, start: e.start + io, count: e.count }); vo += b.geo.attributes.position.count; io += src.length; }
      const cur = new Uint32Array(ni), at = new THREE.BufferAttribute(cur, 1); at.setUsage(THREE.DynamicDrawUsage); g.setIndex(at); g.setDrawRange(0, 0);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
      const mesh = new THREE.Mesh(g, m0.material); mesh.castShadow = m0.castShadow; mesh.receiveShadow = m0.receiveShadow; mesh.layers.mask = m0.layers.mask; mesh.renderOrder = m0.renderOrder; mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.name = m0.name; mesh.visible = false; mesh.userData.kitDyn = true;
      const P = { mat: list[0].mat, ents, all, cur, geo: g, mesh, dirty: true };
      // a pool that casts sun shadow gets a twin that only the near shadow map draws, holding just the units close enough (and big enough) to throw a shadow that matters
      if (m0.castShadow) {
        mesh.castShadow = false; const g2 = new THREE.BufferGeometry(); for (const k of Object.keys(g.attributes)) g2.setAttribute(k, g.attributes[k]);
        const cur2 = new Uint32Array(ni), at2 = new THREE.BufferAttribute(cur2, 1); at2.setUsage(THREE.DynamicDrawUsage); g2.setIndex(at2); g2.setDrawRange(0, 0); g2.boundingSphere = g.boundingSphere;
        const tw = new THREE.Mesh(g2, m0.material); tw.castShadow = true; tw.receiveShadow = false; tw.layers.set(typeof SHADOW_ONLY_LAYER !== 'undefined' ? SHADOW_ONLY_LAYER : 3); tw.matrixAutoUpdate = false; tw.frustumCulled = false; tw.visible = false; tw.name = m0.name + ':shadow';
        K_.poolGroup.add(tw); P.cast = { geo: g2, cur: cur2, mesh: tw, dirty: true };
      }
      K_.poolGroup.add(mesh); K_.pool.push(P);
      for (const b of list) { if (b.mesh.parent) b.mesh.parent.remove(b.mesh); b.geo.dispose(); b.all = b.cur = b.geo = b.mesh = b.ents = null; }
    }
    for (const D of fresh) { D.buckets = []; for (const u of D.units) { u.ents = []; u.state = -1; } }
    for (const P of K_.pool) for (const e of P.ents) if (e.unit.ents.indexOf(P) < 0) e.unit.ents.push(P);
  }
  // ── occlusion: what stands wholly behind nearer houses is not drawn ──
  // Occluders are the plain boxes that already stand in for each house in the shadow map (wall footprint, ground to eaves): solid, no
  // openings. Around the camera the compass is cut into 720 bins; each occluder writes, into the bins it spans completely, how steeply
  // one must look up to see over it and how far away its far side is. A unit is hidden when, in every bin it touches, some occluder
  // nearer than the unit's nearest point rises above the unit's highest point. Every step errs toward drawing: bins at an occluder's
  // edges are left out, eaves count 0.25 m lower, and the unit is taken as a cylinder round its bounding sphere.
  const OCC = { N: 720, K: 3, slope: null, far: null, boxes: null, n: 0 };
  function occBoxes() {
    const out = [], add = (M, hw, z0, z1, top) => { const c = [[-hw, z0], [hw, z0], [hw, z1], [-hw, z1]].map(q => { const p = m4.tp(M, [q[0], 0, q[1]]); return [p[0], p[2]]; }); out.push({ c, top: m4.tp(M, [0, top, 0])[1] - 0.25 }); };
    if (typeof World !== 'undefined' && World.kitExt) for (const id in World.kitExt) { const k = World.kitExt[id]; if (k.shared || !k.Ms || !(k.w > 2)) continue; add(k.Ms, k.w / 2 - 0.2, -k.hd + 0.2, k.hd - 0.2, k.top); }
    if (typeof INFS !== 'undefined' && INFS.proxies) for (const p of INFS.proxies) add(p.Ms, p.w / 2 - 0.2, -p.d / 2 + 0.1, p.d / 2 - 0.2, p.top);
    return out;
  }
  K_.occlude = function (cam) {
    const n = (typeof World !== 'undefined' && World.kitExt ? Object.keys(World.kitExt).length : 0) + (typeof INFS !== 'undefined' && INFS.proxies ? INFS.proxies.length : 0);
    if (!OCC.boxes || OCC.n !== n) { OCC.boxes = occBoxes(); OCC.n = n; OCC.slope = new Float32Array(OCC.N * OCC.K); OCC.far = new Float32Array(OCC.N * OCC.K); }
    const N = OCC.N, K = OCC.K, S = OCC.slope, Fd = OCC.far, TAU_ = Math.PI * 2; S.fill(-1e9); Fd.fill(0);
    for (const b of OCC.boxes) {
      let a0 = 0, lo = 1e9, hi = -1e9, dmax = 0, dmin = 1e9;
      for (let i = 0; i < 4; i++) { const dx = b.c[i][0] - cam[0], dz = b.c[i][1] - cam[2], d = Math.hypot(dx, dz); let a = Math.atan2(dz, dx); if (i === 0) a0 = a; else { a -= a0; a = Math.atan2(Math.sin(a), Math.cos(a)) + a0; } lo = Math.min(lo, a); hi = Math.max(hi, a); dmax = Math.max(dmax, d); dmin = Math.min(dmin, d); }
      if (dmin < 2.5 || dmax > 170 || hi - lo > 2.6) continue;          // too close (the camera may be beside or inside it), or too far to matter
      const h = b.top - cam[1], sl = h > 0 ? h / dmax : h / dmin, i0 = Math.ceil(lo / TAU_ * N) + 1, i1 = Math.floor(hi / TAU_ * N) - 1;
      for (let i = i0; i < i1; i++) {         // bin i covers i..i+1: only bins wholly inside the span, less one at each edge
        const o = (((i % N) + N) % N) * K;
        // keep the K most useful per bin: the steepest, and among those the nearest
        let w = -1, ws = sl; for (let k = 0; k < K; k++) if (S[o + k] < ws) { ws = S[o + k]; w = k; }
        if (w >= 0) { S[o + w] = sl; Fd[o + w] = dmax; }
      }
    }
    return function (u, dc) {
      const near = dc - u.r; if (near < 3) return false;
      const h = u.y1 - cam[1], sl = h > 0 ? h / near : h / (dc + u.r), a = Math.atan2(u.z - cam[2], u.x - cam[0]), w = Math.asin(Math.min(1, u.r / dc));
      const i0 = Math.floor((a - w) / TAU_ * N), i1 = Math.floor((a + w) / TAU_ * N);
      for (let i = i0; i <= i1; i++) { const o = (((i % N) + N) % N) * K; let ok = false; for (let k = 0; k < K; k++) if (Fd[o + k] > 0 && Fd[o + k] < near && S[o + k] >= sl) { ok = true; break; } if (!ok) return false; }
      return true;
    };
  };
  function dynUpdate(camPos) {
    const fresh = K_.dynNew.length > 0; if (fresh) { if (typeof SC === 'undefined' || !SC.scene) return; poolNew(); }
    const L = K_.dynLast, cam = (typeof R !== 'undefined' && R.cam) || { yaw: 0, pitch: 0 }, qn = (typeof R !== 'undefined' && R.qName) || 'medium';
    const F = (typeof R !== 'undefined' && R.q && R.q.houseFar) || K_.farDist; let key = qn + F; for (const D of K_.dyn) key += D.group.visible ? '1' : '0';
    let dy = cam.yaw - L[3]; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (!fresh && Math.hypot(camPos[0] - L[0], camPos[2] - L[2]) < 1.5 && Math.abs(camPos[1] - L[1]) < 1 && Math.abs(dy) < 0.19 && key === L[4]) return;
    L[0] = camPos[0]; L[1] = camPos[1]; L[2] = camPos[2]; L[3] = cam.yaw; L[4] = key;
    const fx = Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), drop = K_.DROP[qn] || 70;
    const half = (typeof R !== 'undefined' && R.camera ? Math.atan(Math.tan(R.camera.fov * Math.PI / 360) * R.camera.aspect) : 0.81) + 0.35, cone = Math.abs(cam.pitch) < 0.9 && !(TEST && TEST.kitcone === 0);
    const occ = K_.occlude && !(TEST && TEST.kitocc === 0) ? K_.occlude(camPos) : null;
    const q_ = (typeof R !== 'undefined' && R.q) || {}, RS = q_.yardCast === false ? -1 : (q_.shadowNear || 20) * 1.72 + 2;       // reach of the near sun-shadow map from the camera
    const S_ = K_.dynStat = { units: 0, near: 0, far: 0, cone: 0, dist: 0, hidden: 0, draws: 0 };
    // batches rebuilt for another tier (dressing, the wilds) take their old group off the scene: drop those units from the pools
    for (let i = K_.dyn.length - 1; i >= 0; i--) { const D = K_.dyn[i]; if (D.group.parent) D.seen = true; else if (D.seen) { D.dead = true; K_.dyn.splice(i, 1);
      for (const P of K_.pool) { const n = P.ents.length; P.ents = P.ents.filter(e => !e.unit.D.dead); if (P.ents.length !== n) { P.dirty = true; if (P.cast) P.cast.dirty = true; } } } }
    for (const D of K_.dyn) {
      const shown = D.group.visible, range = K_.RANGE[D.name] ? K_.RANGE[D.name](q_) : 1e9;
      for (const u of D.units) {
        const dx = u.x - camPos[0], dz = u.z - camPos[2], dc = Math.sqrt(dx * dx + dz * dz), d = Math.max(0, dc - u.r); let st;
        S_.units++;
        if (!shown) st = 0;
        else if (u.always) st = 1;
        else if (d > range || (!D.far && d > Math.max(26, 2 * u.r * drop))) { st = 0; S_.dist++; }
        else if (cone && d > 12 && Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / dc))) > half + Math.asin(Math.min(1, u.r / dc))) { st = 0; S_.cone++; }
        else if (occ && d > 6 && occ(u, dc)) { st = 0; S_.hidden++; }
        else if (D.far) { st = (u.wasFar ? d > F - 3 : d > F + 3) ? (u.hasFar ? 2 : 0) : 1; u.wasFar = st !== 1; }
        else st = 1;
        if (st === 1) S_.near++; else if (st === 2) S_.far++;
        if (st !== u.state) { u.state = st; for (const b of u.ents) b.dirty = true; }
        const sh = shown && !u.always && dc - u.r < RS && u.r > 0.3 ? 1 : 0; if (sh !== u.sh) { u.sh = sh; for (const b of u.ents) if (b.cast) b.cast.dirty = true; }
      }
    }
    for (const b of K_.pool) {
      if (b.dirty) {
        b.dirty = false; let n = 0; const cur = b.cur, all = b.all;
        for (const e of b.ents) if (e.unit.state === (e.far ? 2 : 1)) { cur.set(all.subarray(e.start, e.start + e.count), n); n += e.count; }
        b.geo.setDrawRange(0, n); b.mesh.visible = n > 0;
        if (n) { const at = b.geo.index; at.clearUpdateRanges(); at.addUpdateRange(0, n); at.needsUpdate = true; }
      }
      if (b.cast && b.cast.dirty) { const c = b.cast; c.dirty = false; let n = 0; for (const e of b.ents) if (!e.far && e.unit.sh) { c.cur.set(b.all.subarray(e.start, e.start + e.count), n); n += e.count; }
        c.geo.setDrawRange(0, n); c.mesh.visible = n > 0; if (n) { const at = c.geo.index; at.clearUpdateRanges(); at.addUpdateRange(0, n); at.needsUpdate = true; } }
      if (b.mesh.visible) S_.draws++;
    }
  }
  K_.update = function (camPos) {
    lodUpdate(camPos); dynUpdate(camPos);
    for (const im of K_.instanced) { const s = im.boundingSphere, dx = s.center.x - camPos[0], dz = s.center.z - camPos[2]; im.visible = Math.sqrt(dx * dx + dz * dz) - s.radius < im.userData.maxDist; }
  };
  return K_;
})();
