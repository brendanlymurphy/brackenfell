// ───────────────────────── animals [ch4]: realistic models only, from the pens and yards that already say an animal lives there ─────────────────────────
// Sources and licences: docs/licences/animals.md. Packed by tools/animals/pack.mjs into kits/animals/<kind>.glb (one skinned mesh, one atlas, a light copy "@far").
// Where: World.henRuns (filled by the hen coops in 73m_plots.js: one marked line each). An animal walks, pecks and stands within a small yard in front of its coop
// (K.yard around a point K.off in front of it), its feet on World.groundAt; at night it is in the coop (not drawn). The light copy is drawn beyond ANI.near; nothing is drawn beyond ANI.far.
// At most ANI.maxDrawn animals are drawn at once (the nearest), so all animals together stay within the budget (12 draws).
const ANI = { kinds: { hen: { file: 'kits/animals/hen.glb', walk: 'Walk', idle: ['Idle1', 'Idle2', 'Stand'], feed: ['Pecking1', 'Pecking2', 'Eating'], speed: 0.16, per: 3, yard: 1.0, off: 1.6 } },
  near: 12, far: 40, maxDrawn: 6, list: [], ready: false, data: {} };
World.henRuns = World.henRuns || [];
// a coop records where it stands and which way its yard opens: [x, ground y, z, yaw of the yard's direction]
function animalPen(kind, x, y, z, yaw) { const k = kind + 'Runs'; (World[k] = World[k] || []).push([x, y, z, yaw || 0]); }

async function animalsLoad() {
  for (const kind in ANI.kinds) { const K = ANI.kinds[kind];
    try { const g = await T3X.gltf().loadAsync(K.file); const src = g.scene; src.updateMatrixWorld(true);
      const near = [], far = []; src.traverse(o => { if (o.isSkinnedMesh) (/@far$/.test(o.name) ? far : near).push(o); });
      const tex = near[0] && near[0].material && near[0].material.map, nrm = near[0] && near[0].material && near[0].material.normalMap;
      ANI.data[kind] = { scene: src, clips: g.animations, mat: animalMat(tex, nrm) };
    } catch (e) { console.warn('animal ' + kind + ' unavailable: ' + (e && e.message || e)); } }
}
// lit like the villagers' cloth: the texture, the sky and sun of the place (SH.hemi), lanterns near by; a soft sheen, no plastic shine
function animalMat(tex, nrm) {
  const { texture, uv, normalWorld, positionWorld, float, uniform } = TSL, m = new THREE.MeshStandardNodeMaterial(); m.roughness = 0.88; m.metalness = 0;
  const zone = uniform(0), light = uniform(1), alb = tex ? texture(tex, uv()).rgb : TSL.vec3(0.4, 0.3, 0.2);
  if (tex) { tex.colorSpace = THREE.SRGBColorSpace; } if (nrm) m.normalMap = nrm;
  m.colorNode = alb; m.emissiveNode = alb.mul(SH.hemi(normalWorld.normalize(), light, zone).add(SH.pointLights(positionWorld, normalWorld.normalize(), zone, float(0.25)))).mul(0.85);
  m.userData.zone = zone; m.userData.light = light; return m;
}
function animalsAttach() {
  (async () => { await animalsLoad(); let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (const kind in ANI.kinds) { const D = ANI.data[kind]; if (!D) continue; const K = ANI.kinds[kind];
      for (const pen of World[kind + 'Runs'] || []) for (let i = 0; i < K.per; i++) {
        const rig = T3X.SkeletonUtils.clone(D.scene); let near = null, far = null; rig.traverse(o => { if (o.isSkinnedMesh) { o.material = D.mat; o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true; o.layers.set(1); if (/@far$/.test(o.name)) far = o; else near = o; } });
        const mixer = new THREE.AnimationMixer(rig), act = {}; for (const c of D.clips) act[c.name] = mixer.clipAction(c);
        const a = rnd() * Math.PI * 2, r = K.yard * (0.3 + 0.6 * rnd()), A = { kind, K, pen, rig, near, far, mixer, act, cur: null, x: pen[0] + Math.sin(pen[3]) * K.off + Math.cos(a) * r, z: pen[2] - Math.cos(pen[3]) * K.off + Math.sin(a) * r, yaw: rnd() * Math.PI * 2, state: 'idle', t: rnd() * 3, tx: 0, tz: 0 };
        { const T = animalPick(A); if (!T) { continue; } A.x = T[0]; A.z = T[1]; }
        rig.visible = false; SC.scene.add(rig); ANI.list.push(A); } }
    ANI.ready = true; })();
}
// a place an animal may stand: nothing solid there (World.blockedAt), no hedge clump within 0.45 m, and on ground no steeper than a step from its pen
function animalFree(x, z, pen) { if (World.blockedAt && World.blockedAt(x, z, 0.16)) return false; for (const c of World.hedgeClumps || []) if (Math.hypot(c[0] - x, c[2] - z) < 0.45 + (c[3] || 0.3)) return false;
  const g = World.groundAt(x, z, pen[1] + 1.0); return isFinite(g) && Math.abs(g - pen[1]) < 0.45; }
function animalPick(A) { const K = A.K, cx = A.pen[0] + Math.sin(A.pen[3]) * K.off, cz = A.pen[2] - Math.cos(A.pen[3]) * K.off;
  for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2, r = K.yard * Math.sqrt(Math.random()), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (animalFree(x, z, A.pen)) return [x, z]; } return null; }
function animalPlay(A, name) { if (A.cur === name || !A.act[name]) return; const n = A.act[name]; n.reset().play(); if (A.cur && A.act[A.cur]) A.act[A.cur].crossFadeTo(n, 0.3, false); A.cur = name; }
const _anCam = new THREE.Vector3();
function animalsUpdate(dt, eye) {
  if (!ANI.ready || !ANI.list.length || World.indoor) { for (const A of ANI.list) A.rig.visible = false; return; }
  const night = Env.hour >= 20.5 || Env.hour < 5.5;
  for (const A of ANI.list) A.d = Math.hypot(A.x - eye[0], A.z - eye[2]);
  const order = ANI.list.slice().sort((p, q) => p.d - q.d), drawn = new Set(order.slice(0, ANI.maxDrawn).filter(A => A.d < ANI.far));
  for (const A of ANI.list) {
    const show = !night && drawn.has(A); A.rig.visible = show; if (!show) continue; const K = A.K;
    A.t -= dt;
    if (A.state === 'walk') { const dx = A.tx - A.x, dz = A.tz - A.z, L = Math.hypot(dx, dz); if (L < 0.05) { A.state = Math.random() < 0.6 ? 'feed' : 'idle'; A.t = 2 + Math.random() * 4; }
      else { const want = Math.atan2(dx, dz), dy = ((want - A.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; A.yaw += Math.max(-dt * 3, Math.min(dt * 3, dy)); if (Math.abs(dy) < 0.6) { const s = Math.min(L, K.speed * dt), nx = A.x + Math.sin(A.yaw) * s, nz = A.z + Math.cos(A.yaw) * s; if (animalFree(nx, nz, A.pen)) { A.x = nx; A.z = nz; } else { A.state = 'idle'; A.t = 1 + Math.random() * 2; } } } }
    else if (A.t <= 0) { const T = Math.random() < 0.55 && animalPick(A); if (T) { A.tx = T[0]; A.tz = T[1]; A.state = 'walk'; } else { A.state = Math.random() < 0.6 ? 'feed' : 'idle'; A.t = 2 + Math.random() * 4; } }
    animalPlay(A, A.state === 'walk' ? K.walk : A.state === 'feed' ? K.feed[(A.x * 7 | 0) & 1 ? 0 : 2] : K.idle[(A.z * 5 | 0) % K.idle.length & 1]);
    // the walk clip is played at the rate of the steps actually taken (no sliding feet)
    if (A.cur === K.walk && A.act[K.walk]) A.act[K.walk].timeScale = 1.0;
    A.mixer.update(dt);
    const gy = World.groundAt(A.x, A.z, A.pen[1] + 1.0); A.rig.position.set(A.x, isFinite(gy) ? gy : A.pen[1], A.z); A.rig.rotation.y = A.yaw;
    // the full mesh near, the light copy beyond; the shadow always from the light copy (near, on the shadow-only layer the villagers use)
    const nearOn = A.d < ANI.near || !A.far, SL = (typeof Chars !== 'undefined' && Chars.LOD && Chars.LOD.shadowLayer) || 1;
    if (A.near) { A.near.visible = nearOn; A.near.castShadow = !A.far; A.near.layers.set(1); }
    if (A.far) { A.far.visible = true; A.far.castShadow = true; if (nearOn) A.far.layers.set(SL); else A.far.layers.set(1); } }
}
