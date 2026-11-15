// ───────────────────────── scene: Three objects built from the generated world ─────────────────────────
// Layers: 0 = seen by the camera and both sun shadow maps; 1 = camera and the near shadow map only (interiors, full trees,
// villagers, small props); 2 = the wide shadow map only (flat tree stand-ins that cast for every tree out there).
// Layer 3 = the near sun-shadow map only: casters the camera never draws (the low copy of a villager, the plain pine used for shadows). The near map's camera enables it.
const SHADOW_ONLY_LAYER = 3;
const SC = { scene: null, statics: [], cells: [], rigid: [], bodies: [], mats: {} };
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
    if (!(d.open > 0.02)) continue;
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
  M.water = WaterMat(); M.glow = GlowMat();
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
    if (it.kind === 'terrain') mesh.renderOrder = 1;      // after the other opaque draws, so the ground shader only runs where nothing nearer already stands
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
  const bd = R.boneData, e = camPos, cur = World.cell;       // cur: the cell the player is in. Then only that cell is drawn (its generated meshes, kit groups, door leaf); outdoors, no cell is
  if (!SC.nearLayerOn && R.shadows) { R.shadows.lights[0].shadow.camera.layers.enable(SHADOW_ONLY_LAYER); SC.nearLayerOn = true; }
  World.deepIn = cur ? true : deepIndoors(e); const inside = !cur && World.deepIn, ind = DRAW.indoor;
  for (const s of SC.statics) {
    const it = s.it;
    if (cur || it.cell) { s.mesh.visible = !!cur && it.cell === cur.id; if (s.cast0 === undefined) s.cast0 = s.mesh.castShadow; continue; }
    const d = hyp(it.c[0] - e[0], it.c[1] - e[1], it.c[2] - e[2]), far = d - it.r;
    s.mesh.visible = (!it.maxDist || d <= it.maxDist + it.r) && !(inside && far > ind);
    if (s.cast0 === undefined) s.cast0 = s.mesh.castShadow;
    s.mesh.castShadow = s.cast0 && !(inside && far > DRAW.indoorCast) && !(s.farCapable && q.nearStatics === false);
    // generated village props (fences, walls, wells ...) cast into the wide sun-shadow map only on tiers that have q.farStatics; the near map always gets them
    if (s.farCapable === undefined) s.farCapable = !!s.cast0 && it.kind === 'opaque' && !it.nearOnly && s.mesh.layers.mask === 1;
    if (s.farCapable) s.mesh.layers.mask = q.farStatics ? 1 : 2;
  }
  for (const s of SC.cells) {
    if (cur) { s.mesh.visible = false; continue; }
    const c = s.c, grp = s.grp, dc = hyp(c.c[0] - e[0], c.c[2] - e[2]);
    s.mesh.visible = !((grp.lod === 1 && dc > q.treeLod + c.r) || (grp.lod === 2 && dc < q.treeLod - c.r) || (grp.maxDist && dc > Math.min(grp.maxDist, q.rockDist) + c.r) || (inside && grp.lod === 0 && dc - c.r > ind));
    if (s.cast0 === undefined) s.cast0 = s.mesh.castShadow;
    s.mesh.castShadow = s.cast0 && !(inside && dc - c.r > DRAW.indoorCast) && !(grp.nearOnly && grp.maxDist && q.rockCast === false);      // boulders: no shadow on tiers with rockCast false
  }
  if (Grass.mesh) Grass.mesh.visible = !inside && !cur;
  for (const r of SC.rigid) {
    const o = r.obj;
    if (cur ? o.cell !== cur.id : o.cell) { r.mesh.visible = false; continue; }
    const dr = DRAW[o.kind || 'misc'], d = hyp(bd[o.slot * 256 + 12] - e[0], bd[o.slot * 256 + 14] - e[2]);
    let vis = o.visible && d < dr.vis && !(inside && d > ind);
    if (dr.near) vis = vis && (r.whole ? d >= dr.near : d < dr.near);
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
