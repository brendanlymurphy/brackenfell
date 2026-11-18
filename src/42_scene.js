// ───────────────────────── scene: Three objects built from the generated world ─────────────────────────
// Layers: 0 = seen by the camera and both sun shadow maps; 1 = camera and the near shadow map only (interiors, full trees,
// villagers, small props); 2 = the wide shadow map only (flat tree stand-ins that cast for every tree out there).
// Layer 3 = the near sun-shadow map only: casters the camera never draws (the low copy of a villager, the plain pine used for shadows). The near map's camera enables it.
const SHADOW_ONLY_LAYER = 3;
const FARHIDE = (typeof TEST !== "undefined" && TEST && TEST.farhide !== undefined) ? +TEST.farhide : 1e9;       // [cull] how far away ground may still be hidden under the roofline (was 600 m)
const SC = { scene: null, statics: [], cells: [], rigid: [], bodies: [], mats: {}, pools: [] };
// Draw distances (m) for small things. vis: drawn by the camera up to here; cast: drawn into the near sun-shadow map up to here; near: a chicken
// is drawn as separate parts up to this distance and as one rigid body beyond it. indoor: while the camera is inside a building, outdoor
// meshes whose bounding sphere lies beyond this are not drawn at all (they can only show through a window). Raise a number to back a cut out.
const DRAW = {
  door: { vis: 90, cast: 22 }, chicken: { vis: 60, cast: 14, near: 14 }, pickup: { vis: 45, cast: 0 }, mill: { vis: 160, cast: 40 }, misc: { vis: 160, cast: 160 },
  indoor: 45, indoorCast: 18, doorSee: 14,
};
// true while the camera is inside a building and no open door within DRAW.doorSee metres is in front of it: then little outside can be seen (only through a
// window), so grass, scatter and small outdoor things are not drawn, the outdoors is drawn short and the far sun-shadow map is left as it was
function deepIndoors(e) {
  if (!World.camZone) return false;
  const fx = Math.sin(R.cam.yaw), fz = -Math.cos(R.cam.yaw);
  for (const d of World.doors) {         // an open door that is behind the camera shows nothing of the outdoors
    if (!(d.open > 0.02) || d.internal) continue;
    const dx = d.c[0] - e[0], dz = d.c[2] - e[2], l = hyp(dx, dz);
    if (l < DRAW.doorSee && (l < 2.5 || (dx * fx + dz * fz) / l > 0.3)) return false;
  }
  return true;
}
// Furniture of a building is drawn only when it can be seen: the camera is inside it, or one of its doors is (opening or) open. Window panes are opaque, so
// nothing inside shows through them. A building whose doors are open archways (no leaf registered) keeps the old rule: near enough. INTERIOR_NEAR: metres from its centre.
const INTERIOR_NEAR = 9;
function interiorShown(site, camPos) {
  if (hyp(site.x - camPos[0], site.z - camPos[2]) >= INTERIOR_NEAR + Math.max(site.w, site.d) * 0.5) return false;
  const z = World.camZone; if (z && World.zones[z - 1] && World.zones[z - 1].site === site) return true;
  let any = false; for (const d of World.doors) if (d.site === site) { if (d.open > 0.02) return true; any = true; }
  return !any;
}
function sceneBuild() {
  const scene = SC.scene = new THREE.Scene(), M = SC.mats;
  scene.matrixWorldAutoUpdate = true;
  M.static = surfaceMaterial('static'); M.inst = surfaceMaterial('inst'); M.rigid = surfaceMaterial('rigid'); M.leaf = foliageMaterial(); M.leafFar = foliageMaterial(true); M.terrain = terrainMaterial();
  M.water = WaterMat(); M.glow = GlowMat(); M.decal = Bake.mat(); M.shaft = Bake.shaftMat();      // [l1] decal: 72m_bake.js
  const sphere = (c, r) => new THREE.Sphere(new THREE.Vector3(c[0], c[1], c[2]), r);
  const geo = (pk, first, count, inst) => {
    const g = inst ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
    for (const k in pk.attr) if (k !== 'wind' || inst) g.setAttribute(k, pk.attr[k]);
    g.setIndex(pk.index); g.setDrawRange(first, count);
    return g;
  };
  // ── static world: terrain tiles, houses inside and out, props, water, window panes ──
  for (const pk of World.packs) for (const it of pk.items) {
    const mat = it.kind === 'terrain' ? M.terrain : it.kind === 'water' ? M.water : it.kind === 'glow' ? M.glow : it.kind === 'decal' ? M.decal : it.kind === 'shaft' ? M.shaft : M.static;
    if (!mat || !it.count) continue;
    // terrain and water tiles of one pack are drawn together: one mesh whose index buffer is refilled from the tiles in view (see poolUpdate)
    if ((it.kind === 'terrain' || it.kind === 'water') && !it.cell && !it.nearOnly && !(TEST && TEST.pool === 0)) {
      let P = SC.pools.find(q => q.pk === pk && q.kind === it.kind);
      if (!P) { P = { pk, kind: it.kind, tiles: [], groups: [], mat, n: 0 }; SC.pools.push(P); } const g0 = P.tiles.length;
      if (it.kind === 'water' && it.r > 30) { for (const c of squares(pk, it.first, it.count, 16)) P.tiles.push({ it, idx: c.idx, top: c.top, rh: c.rh, sph: c.sph, big: new THREE.Sphere(c.sph.center, c.sph.radius + 14), on: false }); }       // a river or lake tile is hundreds of metres long: cut it into 16 m squares
      else if (it.kind === 'terrain' && it.r > 60 && it.count > 600 && !(TEST && TEST.terrsq === 0)) { for (const c of squares(pk, it.first, it.count, it.r > 300 ? 130 : 32 /* [cull] was 260 : 96. A square is hidden only when all of it is under the roofline, and a 96 m square of town ground always showed down some street */)) P.tiles.push({ it, idx: c.idx, top: c.top, rh: c.rh, sph: c.sph, big: new THREE.Sphere(c.sph.center, c.sph.radius + 10), on: false }); }       // [perf] a terrain tile is 200 to 1700 m across and was drawn whole when any of it was in view: cut into squares, each is tested against the view and the roofline
      else P.tiles.push({ it, sph: sphere(it.c, it.r), big: sphere(it.c, it.r + 6), on: false });
      { let gr = it.r; for (let i = g0; i < P.tiles.length; i++) { const q = P.tiles[i].sph; gr = Math.max(gr, hyp(q.center.x - it.c[0], q.center.y - it.c[1], q.center.z - it.c[2]) + q.radius); } P.groups.push({ it, a: g0, b: P.tiles.length, sph: sphere(it.c, gr + 0.5) }); }       /* holds every square's own sphere, so a square is never skipped that would have been tested */       /* [cull] the squares of one tile are tested together first: with squares a third the size there are four times as many, and most tiles are nowhere near the view */
      P.n += it.count; continue;
    }
    const g = geo(pk, it.first, it.count); g.boundingSphere = sphere(it.c, it.r);
    const mesh = new THREE.Mesh(g, mat); mesh.matrixAutoUpdate = false;
    mesh.castShadow = !!pk.shadow && !it.noShadow && it.kind === 'opaque'; mesh.receiveShadow = it.kind === 'opaque' || it.kind === 'terrain';
    if (it.kind === 'terrain') mesh.renderOrder = 1;      // after the other opaque draws, so the ground shader only runs where nothing nearer already stands
    if (it.kind === 'water' || it.kind === 'decal') mesh.renderOrder = 2; else if (it.kind === 'glow' || it.kind === 'shaft') mesh.renderOrder = 3;
    if (it.nearOnly) mesh.layers.set(1);
    const st = { mesh, it }; scene.add(mesh); SC.statics.push(st);
    // A big merged piece of the village (fences, wells, stalls over 100 m) used to go into the near sun-shadow map whole. Its triangles are
    // sorted into 8 m squares here; a twin that only that shadow map draws holds just the squares the map covers (subUpdate).
    if (it.kind === 'opaque' && !it.cell && it.r > 18 && !(TEST && TEST.sub === 0)) {
      const cellList = squares(pk, it.first, it.count, 4);       /* [cull] was 8 m: finer squares let more of a yard hide behind its house */
      const g2 = new THREE.BufferGeometry(); for (const k in pk.attr) if (k !== 'wind') g2.setAttribute(k, pk.attr[k]);
      const cur = new Uint32Array(it.count), at = new THREE.BufferAttribute(cur, 1); at.setUsage(THREE.DynamicDrawUsage); g2.setIndex(at); g2.setDrawRange(0, 0); g2.boundingSphere = g.boundingSphere;
      const tw = new THREE.Mesh(g2, mat); tw.matrixAutoUpdate = false; tw.frustumCulled = false; tw.castShadow = true; tw.receiveShadow = false; tw.layers.set(SHADOW_ONLY_LAYER); tw.visible = false; tw.name = 'static-shadow'; scene.add(tw);
      tw.castShadow = mesh.castShadow;
      st.sub = { mesh: tw, geo: g2, cur, cells: cellList, last: [1e9, 1e9], n: 0, casts: mesh.castShadow };
      // and the camera draws the same mesh from the squares in view (while the mesh itself casts no shadow: see sceneUpdate)
      const g1 = new THREE.BufferGeometry(); for (const k in pk.attr) if (k !== 'wind') g1.setAttribute(k, pk.attr[k]);
      const c1 = new Uint32Array(it.count), a1 = new THREE.BufferAttribute(c1, 1); a1.setUsage(THREE.DynamicDrawUsage); g1.setIndex(a1); g1.boundingSphere = g.boundingSphere;
      c1.set(pk.index.array.subarray(it.first, it.first + it.count)); g1.setDrawRange(0, it.count);
      st.view = { geo: g1, cur: c1, full: true, n: it.count, total: it.count, pk, it }; mesh.geometry = g1; g.dispose();
    }
  }
  for (const P of SC.pools) {
    const g = new THREE.BufferGeometry(); for (const k in P.pk.attr) if (k !== 'wind') g.setAttribute(k, P.pk.attr[k]);
    P.cur = new Uint32Array(P.n); const at = new THREE.BufferAttribute(P.cur, 1); at.setUsage(THREE.DynamicDrawUsage); g.setIndex(at); g.setDrawRange(0, 0); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mesh = P.mesh = new THREE.Mesh(g, P.mat); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = P.kind === 'terrain'; mesh.renderOrder = P.kind === 'terrain' ? 1 : 2; mesh.name = P.kind + '-pool'; mesh.visible = false;
    P.geo = g; scene.add(mesh);
  }
  // ── instanced trees, bushes and boulders: one mesh per (model, cell) so cells cull and switch level of detail ──
  const IBA = THREE.InstancedBufferAttribute;
  for (const grp of World.instGroups) {
    if (!(grp.kind === 'opaque' && grp.maxDist && grp.nearOnly) || SC.rocks || (TEST && TEST.rockring === 0)) continue;
    const n = grp.cells.reduce((a, c) => a + c.count, 0), src = new Float32Array(n * 8); let o = 0; for (const c of grp.cells) { src.set(grp.ibuf.subarray(c.first * 8, (c.first + c.count) * 8), o); o += c.count * 8; }
    const ring = (cap, layer, cast) => { const g = geo(World.instPack, grp.first, grp.count, true), a = new Float32Array(cap * 4), b = new Float32Array(cap * 4), ia = new IBA(a, 4), ib = new IBA(b, 4); ia.setUsage(THREE.DynamicDrawUsage); ib.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('ipos', ia); g.setAttribute('iprm', ib); g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
      const mesh = new THREE.Mesh(g, M.inst); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.castShadow = cast; mesh.receiveShadow = !cast; mesh.layers.set(layer); mesh.visible = false; mesh.name = cast ? 'rocks-shadow' : 'rocks'; scene.add(mesh);
      return { g, a, b, ia, ib, cap, n: 0, mesh }; };
    SC.rocks = { grp, src, maxDist: grp.maxDist, cam: ring(Math.min(n, 512), 1, false), cast: ring(Math.min(n, 96), SHADOW_ONLY_LAYER, true), last: [1e9, 0, 1e9, 9, ''] };
  }
  for (const grp of World.instGroups) for (const c of grp.cells) {
    if (SC.rocks && SC.rocks.grp === grp) continue;
    if (!c.ipos) {
      const a = new Float32Array(c.count * 4), b = new Float32Array(c.count * 4), src = grp.ibuf;
      for (let i = 0; i < c.count; i++) { const o = (c.first + i) * 8; a.set(src.subarray(o, o + 4), i * 4); b.set(src.subarray(o + 4, o + 8), i * 4); }
      c.ipos = new IBA(a, 4); c.iprm = new IBA(b, 4);
    }
    const g = geo(World.instPack, grp.first, grp.count, true); g.setAttribute('ipos', c.ipos); g.setAttribute('iprm', c.iprm); g.instanceCount = c.count; g.boundingSphere = sphere(c.c, c.r);
    const mesh = new THREE.Mesh(g, grp.kind === 'leaf' ? M.leaf : M.inst); mesh.matrixAutoUpdate = false;
    mesh.castShadow = !!grp.shadow && grp.lod !== 2; mesh.receiveShadow = true;
    if (grp.nearOnly || grp.lod === 1) mesh.layers.set(1);
    scene.add(mesh); SC.cells.push({ mesh, grp, c });
    if (grp.lod === 2 && grp.shadow) { const tw = new THREE.Mesh(g, M.leafFar); tw.matrixAutoUpdate = false; tw.castShadow = true; tw.layers.set(2); scene.add(tw); }
  }
  // ── hinged and carried things (doors, mill wheel, pickups, chickens): rigid pieces, one per bone, moved by R.boneData ──
  const pk = World.skinPack, mmA = pk.attr.mm.array, ixA = pk.index.array, pieces = new Map();
  const split = obj => {
    let p = pieces.get(obj.first); if (p) return p;
    const by = new Map();
    for (let k = obj.first; k < obj.first + obj.count; k += 3) { const b = mmA[ixA[k] * 4 + 1]; let l = by.get(b); if (!l) by.set(b, l = []); l.push(ixA[k], ixA[k + 1], ixA[k + 2]); }
    p = [];
    for (const [bone, list] of by) { const g = new THREE.BufferGeometry(); for (const k in pk.attr) if (k !== 'wind') g.setAttribute(k, pk.attr[k]); g.setIndex(new THREE.BufferAttribute(new Uint32Array(list), 1)); p.push({ bone, g }); }
    pieces.set(obj.first, p); return p;
  };
  for (const obj of World.skinned) {
    if (obj.npc && obj.hasChar) continue;      // an animated glTF villager stands in for this old body (49_chars.js)
    if (obj.npc) {
      const mat = surfaceMaterial('skin'), g = geo(pk, obj.first, obj.count), mesh = new THREE.Mesh(g, mat);
      mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = true; mesh.layers.set(1);
      scene.add(mesh); SC.bodies.push({ mesh, obj, mat });
    } else for (const p of split(obj)) {
      const mesh = new THREE.Mesh(p.g, M.rigid); mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = true; mesh.layers.set(1);
      scene.add(mesh); SC.rigid.push({ mesh, obj, o: obj.slot * 256 + p.bone * 16 });
    }
  }
  if (typeof Trees !== 'undefined') Trees.build(scene);       // scanned trees (74b_trees.js)
  return scene;
}
// Pooled terrain and water: every frame each tile is tested against the camera's view; the index buffer is only rewritten when a tile
// comes into view that is not in it yet, and then it takes every tile within 14 m of the view, so turning the head rarely costs an upload.
const _frWide = new THREE.Frustum(); let _wideCam = null;       // the view widened by about a third: what is kept ready beside the view, so that turning does not refill an index buffer every frame
const _frHit = q => SC.all || _fr.intersectsSphere(q), _frWideHit = q => SC.all || _frWide.intersectsSphere(q);       /* [view] SC.all: everything, for the picture the windows show (56b_viewcube.js) */
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _rfr = new THREE.Frustum(), _rs = new THREE.Sphere(new THREE.Vector3(), 3.2);
function poolUpdate(e, cur, inside) {
  if (!SC.pools.length) return;
  _fr.setFromProjectionMatrix(_pm.multiplyMatrices(R.camera.projectionMatrix, R.camera.matrixWorldInverse));
  for (const P of SC.pools) {
    if (cur) { P.mesh.visible = false; P.stale = true; continue; }
    { const oN = !inside && SC.occ ? SC.occN : -1; if (!SC.camStep && !P.stale && P.first && oN === P.hidN && inside === P.inside) { P.mesh.visible = P.count > 0; continue; } P.inside = inside; }
    let miss = false, need = 0, have = 0;
    const occ0 = !inside && SC.occ ? SC.occ : null, fresh = (occ0 ? SC.occN : -1) !== P.hidN; P.hidN = occ0 ? SC.occN : -1;       // a square counted as hidden is asked again as soon as the roofline is new: nothing in view may wait for the refill timer
    for (const g of P.groups) {
      const it = g.it, d = hyp(it.c[0] - e[0], it.c[1] - e[1], it.c[2] - e[2]), ok = (!it.maxDist || d <= (it.lowDist && R.qName === 'low' ? it.lowDist : it.maxDist) + it.r) && !(inside && d - it.r > DRAW.indoor), T = P.tiles;
      if (!ok || !_frHit(g.sph)) { for (let i = g.a; i < g.b; i++) { const t = T[i]; t.ok = ok; t.in = false; t.hid = false; if (t.on) { have++; if (!ok) miss = true; } } continue; }       /* out of view: nothing to ask; a square that comes back is asked afresh (hid cleared) */
      for (let i = g.a; i < g.b; i++) { const t = T[i]; if (t.hid && fresh) { const du = Math.hypot(t.u.x - SC.occAt[0], t.u.z - SC.occAt[2]); t.hid = !!occ0 && du < FARHIDE && occ0(t.u, du, 0.85); }
        t.ok = ok; t.in = _frHit(t.sph); if (t.in) { need++; if (!t.on && !t.hid) miss = true; } if (t.on) have++; }       /* t.hid: under the roofline when last asked; not a reason to refill */
    }
    // [perf] ground and water wholly under the roofline as seen from here (the kit's horizon, 44_kit.js) are not drawn: from a lane, most of the
    // valley's 59k terrain triangles lie behind houses. Asked again whenever the horizon is rebuilt (the camera moved 1.5 m or turned).
    const occ = !inside && SC.occ ? SC.occ : null, occN = occ ? SC.occN : -1; if (occN !== P.occN && SC.now - (P.t || 0) > 600) { P.occN = occN; P.stale = true; }       /* a new roofline alone refills at most every 0.6 s: each refill uploads the index buffer */
    if (miss || have > need * 3 + 24 || P.stale) {
      if (miss) P.nMiss = (P.nMiss || 0) + 1; else if (P.stale) P.nStale = (P.nStale || 0) + 1;       /* counters for test/perf: why the buffer was refilled */
      let n = 0, same = !P.first ? false : true; const src = P.pk.index.array; P.stale = false; P.first = true;
      // decide first, copy only if the set of squares changed: the roofline is rebuilt every 1.5 m or 11 degrees of turning, and refilling 60k
      // triangles of index buffer each time was a hitch while turning (26 ms at worst in the square)
      for (const g of P.groups) { const wide = _frWideHit(g.sph); for (let i = g.a; i < g.b; i++) { const t = P.tiles[i]; let on = t.ok && (t.in || (wide && _frWideHit(t.sph)));       /* a square found in view above is on whatever the band says: the band is the view as it was at the last step */ if (on && occ) { const u = t.u || (t.u = t.top !== undefined ? { x: t.sph.center.x, z: t.sph.center.z, r: t.rh, y1: t.top + 0.3 } : { x: t.sph.center.x, z: t.sph.center.z, r: t.sph.radius, y1: t.sph.center.y + t.sph.radius });       /* [cull] a square of ground is as high as its highest point and as wide as its footprint: the top of its bounding sphere is tens of metres above a flat square 100 m across, so ground behind the roofs was almost never counted as hidden */ const du = Math.hypot(u.x - SC.occAt[0], u.z - SC.occAt[2]); t.hid = du < FARHIDE && occ(u, du, 0.85); /* the far hills are the skyline: never hidden */ if (t.hid) on = false; } else t.hid = false; if (on !== t.on) same = false; t.on2 = on; } }
      P.t = SC.now; if (same) { P.mesh.visible = P.count > 0; continue; }
      for (const t of P.tiles) { t.on = t.on2; if (t.on) { if (t.idx) { P.cur.set(t.idx, n); n += t.idx.length; } else { P.cur.set(src.subarray(t.it.first, t.it.first + t.it.count), n); n += t.it.count; } } }
      P.geo.setDrawRange(0, n); P.count = n;
      if (n) { const at = P.geo.index; at.clearUpdateRanges(); at.addUpdateRange(0, n); at.needsUpdate = true; }
    }
    P.mesh.visible = P.count > 0;
  }
}
// sorts a pack item's triangles into squares of `size` metres (seen from above); each square knows a sphere round its triangles
function squares(pk, first, count, size) {
  const ix = pk.index.array, P_ = pk.attr.position.array, cells = new Map();
  for (let k = first; k < first + count; k += 3) { const a = ix[k] * 3, b = ix[k + 1] * 3, c = ix[k + 2] * 3, key = Math.floor((P_[a] + P_[b] + P_[c]) / (3 * size)) + ',' + Math.floor((P_[a + 2] + P_[b + 2] + P_[c + 2]) / (3 * size));
    let l = cells.get(key); if (!l) cells.set(key, l = { idx: [], lo: [1e9, 1e9, 1e9], hi: [-1e9, -1e9, -1e9] }); l.idx.push(ix[k], ix[k + 1], ix[k + 2]);
    for (const v of [a, b, c]) for (let d = 0; d < 3; d++) { const p = P_[v + d]; if (p < l.lo[d]) l.lo[d] = p; if (p > l.hi[d]) l.hi[d] = p; } }
  return [...cells.values()].map(l => { const c = [(l.lo[0] + l.hi[0]) / 2, (l.lo[1] + l.hi[1]) / 2, (l.lo[2] + l.hi[2]) / 2], r = 0.5 * hyp(l.hi[0] - l.lo[0], l.hi[1] - l.lo[1], l.hi[2] - l.lo[2]);
    return { x: c[0], z: c[2], top: l.hi[1], rh: 0.5 * hyp(l.hi[0] - l.lo[0], l.hi[2] - l.lo[2]), idx: Uint32Array.from(l.idx), sph: new THREE.Sphere(new THREE.Vector3(c[0], c[1], c[2]), r), big: new THREE.Sphere(new THREE.Vector3(c[0], c[1], c[2]), r + 10), on: true }; });
}
// camera side of a big static mesh: all of it while it casts shadow itself, else the squares in (or within 10 m of) the view, refilled when one comes into view that is missing
function viewUpdate(s, subset) {
  const v = s.view, cells = s.sub.cells;
  if (!subset) { if (!v.full) { v.cur.set(v.pk.index.array.subarray(v.it.first, v.it.first + v.it.count)); v.geo.setDrawRange(0, v.total); const at = v.geo.index; at.clearUpdateRanges(); at.addUpdateRange(0, v.total); at.needsUpdate = true; v.full = true; for (const c of cells) c.on = true; } return; }
  const occ = SC.occ && !World.cell ? SC.occ : null, occN = occ ? SC.occN : -1, ex = occ ? SC.occAt[0] : R.cam.pos[0], ez = occ ? SC.occAt[2] : R.cam.pos[2];       /* [logic] distances for the roofline test are taken from where the roofline was taken, not from the eye: the eye moves every frame and the roofline every 0.35 m, and a square on the line was hidden and shown on alternate frames */
  const due = occN !== v.occN && SC.now - (v.t || 0) > 600, fresh = occN !== v.hidN; v.hidN = occN; if (!SC.camStep && !v.full && !due && !fresh) return;
  let miss = v.full, need = 0, have = 0;
  for (const c of cells) { if (c.hid && fresh) c.hid = !!occ && occ(c.u, Math.hypot(c.u.x - ex, c.u.z - ez), 0.85); c.in = _frHit(c.sph); if (c.in) { need++; if (!c.on && !c.hid) miss = true; } if (c.on) have++; }
  if (due) { v.occN = occN; miss = true; }       // [perf] squares of props under the roofline are skipped too
  if (!miss && have <= need * 3 + 16) return;
  let n = 0; v.full = false; v.t = SC.now;
  for (const c of cells) { c.on = c.in || _frWideHit(c.sph); if (c.on && occ) { const u = c.u || (c.u = c.top !== undefined ? { x: c.sph.center.x, z: c.sph.center.z, r: c.rh, y1: c.top + 0.3 } : { x: c.sph.center.x, z: c.sph.center.z, r: c.sph.radius, y1: c.sph.center.y + c.sph.radius }); c.hid = occ(u, Math.hypot(u.x - ex, u.z - ez), 0.85); if (c.hid) c.on = false; } else c.hid = false; if (c.on) { v.cur.set(c.idx, n); n += c.idx.length; } }
  v.n = n; v.geo.setDrawRange(0, n); if (n) { const at = v.geo.index; at.clearUpdateRanges(); at.addUpdateRange(0, n); at.needsUpdate = true; }
}
const sb_casts = s => s.sub.casts;
function subUpdate(sb, e, q) {
  const r0 = q.shadowNear, cx = e[0] + Math.sin(R.cam.yaw) * r0 * 0.72, cz = e[2] - Math.cos(R.cam.yaw) * r0 * 0.72;       // centre of the near shadow map (43_render.js)
  if (hyp(cx - sb.last[0], cz - sb.last[1]) < 2 && sb.r0 === r0) return; sb.last = [cx, cz]; sb.r0 = r0;
  let n = 0; const reach = r0 + 6 + 8;          // the map, the 8 m squares' own half-diagonal, and room for long shadows falling in from outside
  for (const c of sb.cells) if (hyp(c.x - cx, c.z - cz) < reach) { sb.cur.set(c.idx, n); n += c.idx.length; }
  sb.n = n; sb.geo.setDrawRange(0, n); if (n) { const at = sb.geo.index; at.clearUpdateRanges(); at.addUpdateRange(0, n); at.needsUpdate = true; }
}
// Boulders: instead of one instanced mesh per 110 m cell (every boulder of a cell drawn, and drawn again into the shadow map), two short
// lists refilled as the player moves: those worth drawing from here, and the few big ones near enough to cast a shadow that shows.
function rocksUpdate(e, q, hidden) {
  const K_ = SC.rocks; if (!K_) return;
  K_.cam.mesh.visible = !hidden && K_.cam.n > 0; K_.cast.mesh.visible = !hidden && K_.cast.n > 0; if (hidden) return;
  let dy = R.cam.yaw - K_.last[3]; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  if (hyp(e[0] - K_.last[0], e[2] - K_.last[2]) < 1.5 && Math.abs(dy) < 0.19 && K_.last[4] === R.qName) return; K_.last = [e[0], e[1], e[2], R.cam.yaw, R.qName];
  const fx = Math.sin(R.cam.yaw), fz = -Math.cos(R.cam.yaw), half = Math.atan(Math.tan(R.camera.fov * Math.PI / 360) * R.camera.aspect) + 0.35, cone = Math.abs(R.cam.pitch) < 0.9;
  const far = Math.min(K_.maxDist, q.rockDist), RS = q.rockCast === false ? -1 : q.shadowNear * 1.72 + 3, src = K_.src; K_.cam.n = K_.cast.n = 0;
  const put = (r, o) => { if (r.n >= r.cap) return; const j = r.n++ * 4; r.a.set(src.subarray(o, o + 4), j); r.b.set(src.subarray(o + 4, o + 8), j); };
  for (let o = 0; o < src.length; o += 8) {
    const dx = src[o] - e[0], dz = src[o + 2] - e[2], d = Math.sqrt(dx * dx + dz * dz), sc = src[o + 3];
    if (d > far || d > Math.max(45, sc * 150)) continue;                         // a pebble is not drawn at 150 m
    if (d < RS && sc > 0.45) put(K_.cast, o);
    if (cone && d > 10 && Math.acos(clamp((dx * fx + dz * fz) / d, -1, 1)) > half + Math.asin(Math.min(1, 1.6 * sc / d))) continue;
    put(K_.cam, o);
  }
  for (const r of [K_.cam, K_.cast]) { for (const at of [r.ia, r.ib]) { at.clearUpdateRanges(); if (r.n) { at.addUpdateRange(0, r.n * 4); at.needsUpdate = true; } } r.g.instanceCount = r.n; r.mesh.visible = r.n > 0; }
}
// per frame: move the dynamic pieces, switch tree detail, hide what is too far to matter
function sceneUpdate(camPos, q) {
  const bd = R.boneData, e = camPos, cur = World.cell;       // cur: the cell the player is in. Then only that cell is drawn (its generated meshes, kit groups, door leaf); outdoors, no cell is
  if (!SC.nearLayerOn && R.shadows) { R.shadows.lights[0].shadow.camera.layers.enable(SHADOW_ONLY_LAYER); SC.nearLayerOn = true; }
  World.deepIn = cur ? true : deepIndoors(e); const inside = !cur && World.deepIn, ind = DRAW.indoor;
  R.camera.updateMatrixWorld(); R.camera.matrixWorldInverse.copy(R.camera.matrixWorld).invert();       // [perf] the view tests below must use this frame's camera: the renderer brings the inverse up to date only when it draws, so they ran one frame behind (a square at the edge of a fast turn came a frame late)
  _fr.setFromProjectionMatrix(_pm.multiplyMatrices(R.camera.projectionMatrix, R.camera.matrixWorldInverse));
  // [perf] which squares of terrain, water and props are in view is asked again only when the camera has moved 0.4 m or turned 2 degrees
  // (the squares carry a margin of 10 m): standing still or walking straight, these loops over a few hundred squares are skipped
  SC.now = performance.now();
  // the roofline for terrain and prop squares is asked afresh every 0.35 m of movement (the kit's own, for its pieces, every 1.5 m): a square that has just
  // come out from behind a house must not stay hidden while the player walks on
  { const H = SC.occAt || (SC.occAt = [1e9, 1e9, 1e9]); if (!cur && typeof Kit !== 'undefined' && Kit.occlude && !(TEST && (TEST.sceneocc === 0 || TEST.kitocc === 0)) && Math.abs(e[0] - H[0]) + Math.abs(e[1] - H[1]) + Math.abs(e[2] - H[2]) > 0.35) { H[0] = e[0]; H[1] = e[1]; H[2] = e[2]; SC.occ = Kit.occlude(e, SC.occOwn || (SC.occOwn = {})); SC.occN = (SC.occN || 0) + 1; } if (SC.all) { SC.occ = null; SC.occN = (SC.occN || 0) + 1; H[0] = 1e9; } if (cur || (TEST && (TEST.sceneocc === 0 || TEST.kitocc === 0))) SC.occ = null; }
  { const c = R.camera; if (!_wideCam) _wideCam = new THREE.PerspectiveCamera(); _wideCam.fov = Math.min(150, c.fov * 1.3); _wideCam.aspect = c.aspect * 1.15; _wideCam.near = c.near; _wideCam.far = c.far; _wideCam.updateProjectionMatrix(); _frWide.setFromProjectionMatrix(_pm.multiplyMatrices(_wideCam.projectionMatrix, c.matrixWorldInverse)); }
  { const L = SC.camLast || (SC.camLast = [1e9, 0, 0, 9, 9]), c = R.cam; SC.camStep = Math.abs(e[0] - L[0]) + Math.abs(e[1] - L[1]) + Math.abs(e[2] - L[2]) > 0.4 || Math.abs(c.yaw - L[3]) > 0.035 || Math.abs(c.pitch - L[4]) > 0.035 || !!(TEST && TEST.camstep === 0); if (SC.camStep) { L[0] = e[0]; L[1] = e[1]; L[2] = e[2]; L[3] = c.yaw; L[4] = c.pitch; } }
  for (const s of SC.statics) {
    const it = s.it;
    if (cur || it.cell) { s.mesh.visible = !!cur && it.cell === cur.id; if (s.cast0 === undefined) s.cast0 = s.mesh.castShadow; continue; }
    const d = hyp(it.c[0] - e[0], it.c[1] - e[1], it.c[2] - e[2]), far = d - it.r;
    s.mesh.visible = (!it.maxDist || d <= (it.lowDist && R.qName === 'low' ? it.lowDist : it.maxDist) + it.r) && (!it.minDist || d + it.r >= (it.lowMin && R.qName === 'low' ? it.lowMin : it.minDist)) && !(inside && far > ind);
    if (s.cast0 === undefined) s.cast0 = s.mesh.castShadow;
    s.mesh.castShadow = s.cast0 && !(inside && far > DRAW.indoorCast) && !(s.farCapable && q.nearStatics === false);
    // generated village props (fences, walls, wells ...) cast into the wide sun-shadow map only on tiers that have q.farStatics; the near map always gets them
    if (s.farCapable === undefined) s.farCapable = !!s.cast0 && it.kind === 'opaque' && !it.nearOnly && s.mesh.layers.mask === 1;
    if (s.farCapable) s.mesh.layers.mask = q.farStatics ? 1 : 2;
    if (s.sub) {         // while this mesh would only cast into the near map anyway, the twin casts for it
      const use = sb_casts(s) && s.mesh.castShadow && s.mesh.visible && !(s.farCapable && q.farStatics), sb = s.sub;
      if (use) { s.mesh.castShadow = false; subUpdate(sb, e, q); } sb.mesh.visible = use && sb.n > 0;
      if (s.mesh.visible) { viewUpdate(s, !s.mesh.castShadow); if (!s.view.full && !s.view.n) s.mesh.visible = false; }
    }
  }
  for (const s of SC.cells) {
    if (cur) { s.mesh.visible = false; continue; }
    const c = s.c, grp = s.grp, dc = hyp(c.c[0] - e[0], c.c[2] - e[2]);
    s.mesh.visible = !((grp.lod === 1 && dc > q.treeLod + c.r) || (grp.lod === 2 && dc < q.treeLod - c.r) || (grp.maxDist && dc > Math.min(grp.maxDist, q.rockDist) + c.r) || (inside && grp.lod === 0 && dc - c.r > ind));
    if (s.cast0 === undefined) s.cast0 = s.mesh.castShadow;
    s.mesh.castShadow = s.cast0 && !(inside && dc - c.r > DRAW.indoorCast) && !(grp.nearOnly && grp.maxDist && q.rockCast === false);      // boulders: no shadow on tiers with rockCast false
  }
  poolUpdate(e, cur, inside); rocksUpdate(e, q, !!cur || inside);
  if (Grass.mesh) Grass.mesh.visible = !inside && !cur;
  if (typeof Trees !== 'undefined') Trees.update(e, q, !!cur);
  if (typeof Kit !== 'undefined' && Kit.poolGroup) Kit.poolGroup.visible = !cur;       // the town's pooled kit meshes (44_kit.js) are not drawn from inside a cell
  _rfr.setFromProjectionMatrix(_pm.multiplyMatrices(R.camera.projectionMatrix, R.camera.matrixWorldInverse));
  for (const r of SC.rigid) {
    const o = r.obj;
    if (cur ? o.cell !== cur.id : o.cell) { r.mesh.visible = false; continue; }
    const dr = DRAW[o.kind || 'misc'], d = hyp(bd[o.slot * 256 + 12] - e[0], bd[o.slot * 256 + 14] - e[2]);
    let vis = o.visible && d < dr.vis && !(inside && d > ind);
    if (dr.near) vis = vis && (r.whole ? d >= dr.near : d < dr.near);
    // [perf] these meshes cannot be frustum-culled by the renderer (they share one vertex buffer and are placed by a matrix each frame), so every door
    // and sign within reach was drawn, behind the camera too: 61 draw calls in the square. Outside the view, and too far to throw a shadow into it, they are skipped.
    if (vis && d > 9 && !(TEST && TEST.rigidcull === 0)) { _rs.center.set(bd[o.slot * 256 + 12], bd[o.slot * 256 + 13] + 1, bd[o.slot * 256 + 14]); if (!_rfr.intersectsSphere(_rs)) vis = false; }
    r.mesh.visible = vis; if (!vis) continue;
    r.mesh.castShadow = !r.whole && d < Math.min(dr.cast, inside ? DRAW.indoorCast : 1e9);
    r.mesh.matrix.fromArray(bd, r.o); r.mesh.matrixWorld.copy(r.mesh.matrix);
  }
  for (const b of SC.bodies) {
    const o = b.obj; b.mesh.visible = o.visible; if (!o.visible) continue;
    const k = o.slot * 256, arr = b.mat.userData.bones;
    for (let i = 0; i < 11; i++) arr[i].fromArray(bd, k + i * 16);
    b.mat.userData.zoneU.value = bd[k + 240]; b.mat.userData.lightU.value = bd[k + 241];
  }
}
