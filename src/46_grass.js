// ───────────────────────── grass: a sliding window of tufts placed entirely in the vertex shader ─────────────────────────
// The window is a square of N x N cells (K.grassCell apart) that sits ahead of the camera. Instance i is cell (i mod N, i / N)
// of that window; everything about a tuft comes from a hash of its absolute cell, so tufts stay put while the window slides.
// A tuft is 3 to 5 blades (more on the higher detail tiers). Height and colour vary blade by blade, tuft by tuft and in broad
// patches; drifts of tufts carry a tall pale seed stalk; gusts lay the blades over and catch the light as they pass.
const Grass = { mesh: null, N: 0, range: 0 };
(() => {
  const WINDOW = 1.4, AHEAD = 0.45;        // window side and forward shift, in units of the grass range
  Grass.build = function (scene, quality) {
    Grass.dispose();
    const range = (quality && quality.grassRange) || 0;
    if (!(range > 0)) return null;
    const { Fn, If, float, vec2, vec3, ivec2, uniform, attribute, texture, textureLoad, varyingProperty, instanceIndex, mix, smoothstep, step, max, min, sin, cos, sqrt, floor, abs, fract, length, distance, normalize, transformNormalToView } = TSL;
    const U = SH.U, sat = SH.sat, noiseL = SH.noiseL;
    if (!G.hashTex) {       // white noise: four independent random bytes per cell
      const rnd = rng(9173), d = new Uint8Array(256 * 256 * 4); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 256) | 0;
      const t = new THREE.DataTexture(d, 256, 256, THREE.RGBAFormat, THREE.UnsignedByteType);
      t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; G.hashTex = t;
    }
    const cellSz = K.grassCell * ((quality && quality.grassThin) || 1), N = Math.max(8, Math.round(range * WINDOW / cellSz)), TH = K.terrainHalf, HN = K.heightN;
    const uOrg = uniform(new THREE.Vector2());
    const blades = range <= 32 ? 3 : 4;      // kept modest: every blade vertex samples several textures, and phones run the middle tier
    U.grassRange.value = range;
    const vCol = varyingProperty('vec3', 'vGrassCol'), vEm = varyingProperty('vec3', 'vGrassEm');
    const m = new THREE.MeshLambertNodeMaterial({ side: THREE.DoubleSide });
    const b = attribute('b', 'vec4');         // side (-1, 0, 1), height along the blade (0..1), blade angle, radial offset
    m.positionNode = Fn(() => {
      const cell = attribute('gc', 'vec2');            // this tuft's cell of the world-wide grid, from the list Grass.update keeps
      const r0 = textureLoad(G.hashTex, ivec2(cell.add(65536.5).mod(256)));
      const root2 = cell.add(r0.xy).mul(cellSz);
      const out = vec3(0, -10000, 0).toVar();
      vCol.assign(vec3(0)); vEm.assign(vec3(0));
      const lim = U.grassRange.mul(r0.z.mul(0.72).add(0.28));
      const inside = abs(root2.x).lessThan(TH - 0.5).and(abs(root2.y).lessThan(TH - 0.5));
      If(inside.and(distance(root2, U.camPos.xz).lessThan(lim)), () => {
        const r1 = textureLoad(G.hashTex, ivec2(cell.add(vec2(65536.5 + 97, 65536.5 + 41)).mod(256)));
        const hy = texture(G.heightTex, root2.add(TH).div(2 * TH).mul((HN - 1) / HN).add(0.5 / HN)).level(0).r;
        const suv = root2.div(2 * TH).add(0.5);
        const sp = texture(G.splatTex, suv).level(0), s2 = texture(G.splat2Tex, suv).level(0);   // r road, g cobbles, b field, a bare | r under trees, g wet, b contact, a worn
        const mn = noiseL(root2.mul(0.0041)), mn2 = noiseL(root2.mul(0.037));
        const root = vec3(root2.x, hy, root2.y);
        const dcam = distance(root, U.camPos);
        const field = step(0.5, sp.b);
        const bare = max(max(sp.r, sp.g), sp.a);
        const s = smoothstep(lim.mul(0.72), lim, dcam).oneMinus().mul(step(bare, r0.w.mul(0.25).add(0.22))).mul(step(U.lakeY.add(0.05), hy)).toVar();
        s.mulAssign(step(r1.z, mn2.a.mul(0.9).add(0.35).add(field)));                 // natural bald patches
        s.mulAssign(step(r1.w.mul(0.999), float(1).sub(s2.r.mul(0.72)).sub(s2.a.mul(1.4))));               // thin under trees and where the turf is worn
        If(s.greaterThan(0.001), () => {
          // one tuft in a drift (clumped by noise) sends up a seed stalk: its first blade grows tall, thin and straw-coloured
          const seedy = step(0.80, r0.w).mul(smoothstep(0.50, 0.62, mn2.g)).mul(field.oneMinus()).mul(step(b.w, 0.31));
          const hb = fract(b.z.mul(0.731).add(r1.x.mul(3.1)));                                               // differs blade by blade
          const height = mix(0.20, 0.46, r1.x).mul(mn2.r.mul(0.8).add(0.65)).mul(s2.a.mul(0.45).oneMinus())
            .mul(mix(0.62, 1.18, hb)).mul(mn.g.mul(1.1).add(0.50)).toVar();                                   // and in broad patches of long and short grass
          height.assign(mix(height, height.mul(1.5).add(r1.y.mul(0.22)).add(0.22), seedy));
          height.assign(mix(height, r1.x.mul(0.2).add(0.80), field));
          const t = b.y, ang = b.z.add(r1.y.mul(6.2831853)), dirv = vec2(cos(ang), sin(ang));
          const p0 = vec3(root.x.add(dirv.x.mul(b.w).mul(0.08)), root.y, root.z.add(dirv.y.mul(b.w).mul(0.08)));
          // wind: slow gusts drifting across the meadow plus a quick shiver; `wave` is kept for the colour
          const wv = SH.gust(root2);                                                                              // the valley's one gust field (40_shade.js)
          const gust = wv.mul(2.2).add(sin(U.time.mul(2.6).add(root2.x.mul(0.9)).add(root2.y.mul(1.3))).mul(0.18));
          const toP = root2.sub(U.camPos.xz), dP = length(toP);
          const pushAmt = smoothstep(0.25, 1.0, dP).oneMinus().mul(step(abs(U.camPos.y.sub(1.6).sub(hy)), 1.2));      // blades part around the player
          const bend0 = dirv.mul(mix(0.32, 0.06, field)).add(U.wind.xy.mul(gust.mul(U.wind.z).mul(0.55))).add(toP.div(max(dP, 0.05)).mul(pushAmt).mul(0.9));
          const bl0 = length(bend0), bend = bend0.mul(float(0.95).div(max(bl0, 0.95))), bl = min(bl0, 0.95);
          const tt = t.mul(t), wide = dcam.mul(0.0011).add(0.016).mul(mix(1.0, 0.7, field)).mul(mix(1.0, 0.55, seedy));
          out.assign(vec3(
            p0.x.add(bend.x.mul(tt).mul(height)).sub(dirv.y.mul(b.x).mul(wide).mul(s)),
            p0.y.add(t.mul(height).mul(s).mul(sqrt(float(1).sub(bl.mul(bl).mul(t))))),
            p0.z.add(bend.y.mul(tt).mul(height)).add(dirv.x.mul(b.x).mul(wide).mul(s))));
          // colour matches the terrain tint below it
          const base = vec3(0.062, 0.082, 0.032).mul(SH.groundTint(mn, mn2)).mul(mix(1.0, 0.72, s2.r)).toVar();
          base.mulAssign(mix(vec3(0.92, 1.02, 0.86), vec3(1.08, 0.98, 0.82), r1.z));                           // fresh green to yellowing, tuft by tuft
          base.assign(mix(base, vec3(0.16, 0.145, 0.045), smoothstep(0.75, 1.0, r1.w).mul(0.6)));
          const sheen = sat(wv.mul(2.4)).mul(U.wind.z).mul(0.30).add(1);                                      // a passing gust shows as a paler band
          const tip = base.mul(vec3(1.24, 1.22, 1.02)).mul(sheen).toVar();
          tip.assign(mix(tip, vec3(0.40, 0.33, 0.15).mul(mn2.r.mul(0.5).add(0.75)), seedy));
          base.assign(mix(base, vec3(0.21, 0.165, 0.085), field)); tip.assign(mix(tip, vec3(0.50, 0.40, 0.21), field));      // [l1] ripe wheat is a dull gold-buff, not lemon
          const flower = step(float(1 - 0.006).sub(smoothstep(0.55, 0.80, mn2.b).mul(0.05)), r0.w).mul(field.oneMinus()).mul(step(0.5, t)).mul(0.85);
          const fc = mix(mix(vec3(0.95, 0.9, 0.85), vec3(0.95, 0.75, 0.15), step(0.5, r1.x)), vec3(0.55, 0.35, 0.85), step(0.75, r1.y));
          const c = mix(mix(base.mul(0.55), tip, t), fc, flower).toVar();
          c.mulAssign(mix(float(1), 0.74, U.wet));                 // wet grass is darker, like the turf under it
          vCol.assign(c);
          const amb = mix(U.ambGnd, U.ambSky, 0.85).mul(mix(0.5, 1.0, t));
          vEm.assign(c.mul(amb.add(SH.pointLights(root.add(vec3(0, 0.2, 0)), vec3(0, 1, 0), float(0), float(0.5)))));
        });
      });
      return out;
    })();
    m.colorNode = vCol;
    m.emissiveNode = vEm;
    m.normalNode = transformNormalToView(normalize(vec3(0, 1, 0).add(U.sunDir.mul(0.6))));     // blades take the sun as the turf does, whichever way they face
    // one triangle per blade
    const gv = [], pv = []; for (let k = 0; k < blades; k++) { const a = k * 2.2 + 0.4, ro = 0.3 + k * 0.35; gv.push(-1, 0, a, ro, 1, 0, a, ro, 0, 1, a, ro); pv.push(-1, 0, 0, 1, 0, 0, 0, 1, 0); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); g.setAttribute('b', new THREE.Float32BufferAttribute(gv, 4));
    const gc = new Float32Array(N * N * 2), gcA = new THREE.InstancedBufferAttribute(gc, 2); gcA.setUsage(THREE.DynamicDrawUsage); g.setAttribute('gc', gcA);
    g.instanceCount = 0;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = 'grass';
    scene.add(mesh);
    Object.assign(Grass, { mesh, N, range, cellSz, uOrg, scene, blades, tufts: N * N, verts: N * N * blades * 3, gc, gcA, geo: g, last: [1e9, 1e9, 9], has: Grass.has || new Map() });
    return mesh;
  };
  // The cells that can hold grass at all, out of the window ahead of the camera: the list is rebuilt when the player has moved a metre
  // or turned 11 degrees. Cells are taken 8 x 8 at a time; a block is skipped when it lies beyond the grass range, outside the view cone
  // (cut 20 degrees wider than the screen) or wholly on road, cobbles, bare earth or lake bed (checked once per block and remembered).
  // On the cobbled square that leaves a few hundred tufts to place instead of fifteen thousand.
  const BLK = 8;
  Grass.blockHasGrass = function (bx, bz) {
    const key = bx + ',' + bz; let v = Grass.has.get(key); if (v !== undefined) return v; v = false;
    const c = Grass.cellSz, x0 = bx * BLK * c, z0 = bz * BLK * c, n = 9, TH = K.terrainHalf, lake = (World.lakeY || -1e9) + 0.05;
    for (let j = 0; j < n && !v; j++) for (let i = 0; i < n; i++) { const x = x0 + (i / (n - 1)) * (BLK + 1) * c, z = z0 + (j / (n - 1)) * (BLK + 1) * c;
      if (Math.abs(x) > TH || Math.abs(z) > TH) continue;
      if (Math.max(Terrain.splat(x, z, 0), Terrain.splat(x, z, 1), Terrain.splat(x, z, 3)) < 0.5 && Terrain.y(x, z) > lake - 0.3) { v = true; break; } }
    Grass.has.set(key, v); return v;
  };
  Grass.update = function (camPos, fwdXZ) {
    if (!Grass.mesh) return;
    const r = Grass.range, c = Grass.cellSz, fl = Math.hypot(fwdXZ[0], fwdXZ[1]) || 1, fx = fwdXZ[0] / fl, fz = fwdXZ[1] / fl, yaw = Math.atan2(fx, -fz);
    let dy = yaw - Grass.last[2]; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (Math.hypot(camPos[0] - Grass.last[0], camPos[2] - Grass.last[1]) < 1 && Math.abs(dy) < 0.19) return; Grass.last = [camPos[0], camPos[2], yaw];
    const cx = camPos[0] + fx * r * AHEAD, cz = camPos[2] + fz * r * AHEAD, N = Grass.N, ox = Math.floor(cx / c) - (N >> 1), oz = Math.floor(cz / c) - (N >> 1);
    const half = (typeof R !== 'undefined' && R.camera ? Math.atan(Math.tan(R.camera.fov * Math.PI / 360) * R.camera.aspect) : 0.81) + 0.35, cone = !(TEST && TEST.grasscone === 0) && Math.abs(R.cam.pitch) < 0.9;
    const gc = Grass.gc, bh = BLK * c * 0.7072, R1 = r + 1.5; let n = 0;                   // tufts stand up to one cell off their cell's corner, and the list is a metre stale at worst
    for (let bz = Math.floor(oz / BLK); bz <= Math.floor((oz + N - 1) / BLK); bz++) for (let bx = Math.floor(ox / BLK); bx <= Math.floor((ox + N - 1) / BLK); bx++) {
      const mx = (bx + 0.5) * BLK * c - camPos[0], mz = (bz + 0.5) * BLK * c - camPos[2], d = Math.hypot(mx, mz);
      if (d - bh > R1) continue;
      if (cone && d > 5 + bh && Math.acos(Math.max(-1, Math.min(1, (mx * fx + mz * fz) / d))) > half + Math.asin(Math.min(1, bh / d))) continue;
      if (!(TEST && TEST.grassall) && !Grass.blockHasGrass(bx, bz)) continue;
      for (let j = 0; j < BLK; j++) { const z = bz * BLK + j; if (z < oz || z >= oz + N) continue; const dz = (z + 0.5) * c - camPos[2];
        for (let i = 0; i < BLK; i++) { const x = bx * BLK + i; if (x < ox || x >= ox + N) continue; const dx = (x + 0.5) * c - camPos[0]; if (dx * dx + dz * dz > R1 * R1) continue; gc[n * 2] = x; gc[n * 2 + 1] = z; n++; } }
    }
    Grass.geo.instanceCount = n; Grass.count = n;
    if (n) { const at = Grass.gcA; at.clearUpdateRanges(); at.addUpdateRange(0, n * 2); at.needsUpdate = true; }
  };
  Grass.dispose = function () {
    if (!Grass.mesh) return;
    if (Grass.scene) Grass.scene.remove(Grass.mesh);
    Grass.mesh.geometry.dispose(); Grass.mesh.material.dispose(); Grass.mesh = null;
  };
})();
