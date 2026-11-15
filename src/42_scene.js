// ───────────────────────── scene: Three objects built from the generated world ─────────────────────────
// Layers: 0 = seen by the camera and both sun shadow maps; 1 = camera and the near shadow map only (interiors, full trees,
// villagers, small props); 2 = the wide shadow map only (flat tree stand-ins that cast for every tree out there).
const SC = { scene: null, statics: [], cells: [], rigid: [], bodies: [], mats: {} };
function sceneBuild() {
  const scene = SC.scene = new THREE.Scene(), M = SC.mats;
  scene.matrixWorldAutoUpdate = true;
  M.static = surfaceMaterial('static'); M.inst = surfaceMaterial('inst'); M.rigid = surfaceMaterial('rigid'); M.leaf = foliageMaterial(); M.leafFar = foliageMaterial(true); M.terrain = terrainMaterial();
  if (typeof WaterMat !== 'undefined') M.water = WaterMat();
  else { M.water = new THREE.MeshBasicNodeMaterial(); M.water.colorNode = SH.U.horizon.mul(0.35).add(TSL.vec3(0.01, 0.03, 0.03)); M.water.opacityNode = TSL.float(0.82); M.water.transparent = true; M.water.depthWrite = false; }
  M.glow = typeof GlowMat !== 'undefined' ? GlowMat() : null;
  const sphere = (c, r) => new THREE.Sphere(new THREE.Vector3(c[0], c[1], c[2]), r);
  const geo = (pk, first, count, inst) => {
    const g = inst ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
    for (const k in pk.attr) if (k !== 'wind' || inst) g.setAttribute(k, pk.attr[k]);
    g.setIndex(pk.index); g.setDrawRange(first, count);
    return g;
  };
  // ── static world: terrain tiles, houses inside and out, props, water, window panes ──
  for (const pk of World.packs) for (const it of pk.items) {
    const mat = it.kind === 'terrain' ? M.terrain : it.kind === 'water' ? M.water : it.kind === 'glow' ? M.glow : M.static;
    if (!mat || !it.count) continue;
    const g = geo(pk, it.first, it.count); g.boundingSphere = sphere(it.c, it.r);
    const mesh = new THREE.Mesh(g, mat); mesh.matrixAutoUpdate = false;
    mesh.castShadow = !!pk.shadow && !it.noShadow && it.kind === 'opaque'; mesh.receiveShadow = it.kind === 'opaque' || it.kind === 'terrain';
    if (it.kind === 'water') mesh.renderOrder = 2; else if (it.kind === 'glow') mesh.renderOrder = 3;
    if (it.nearOnly) mesh.layers.set(1);
    scene.add(mesh); SC.statics.push({ mesh, it });
  }
  // ── instanced trees, bushes and boulders: one mesh per (model, cell) so cells cull and switch level of detail ──
  const IBA = THREE.InstancedBufferAttribute;
  for (const grp of World.instGroups) for (const c of grp.cells) {
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
  return scene;
}
// per frame: move the dynamic pieces, switch tree detail, hide what is too far to matter
function sceneUpdate(camPos, q) {
  const bd = R.boneData, e = camPos;
  for (const s of SC.statics) { const it = s.it; if (it.maxDist) s.mesh.visible = hyp(it.c[0] - e[0], it.c[1] - e[1], it.c[2] - e[2]) <= it.maxDist + it.r; }
  for (const s of SC.cells) {
    const c = s.c, grp = s.grp, dc = hyp(c.c[0] - e[0], c.c[2] - e[2]);
    s.mesh.visible = !((grp.lod === 1 && dc > q.treeLod + c.r) || (grp.lod === 2 && dc < q.treeLod - c.r) || (grp.maxDist && dc > grp.maxDist + c.r));
  }
  for (const r of SC.rigid) {
    const o = r.obj, vis = o.visible && hyp(bd[o.slot * 256 + 12] - e[0], bd[o.slot * 256 + 14] - e[2]) < 160;
    r.mesh.visible = vis; if (!vis) continue;
    r.mesh.matrix.fromArray(bd, r.o); r.mesh.matrixWorld.copy(r.mesh.matrix);
  }
  for (const b of SC.bodies) {
    const o = b.obj; b.mesh.visible = o.visible; if (!o.visible) continue;
    const k = o.slot * 256, arr = b.mat.userData.bones;
    for (let i = 0; i < 11; i++) arr[i].fromArray(bd, k + i * 16);
    b.mat.userData.zoneU.value = bd[k + 240]; b.mat.userData.lightU.value = bd[k + 241];
  }
}
