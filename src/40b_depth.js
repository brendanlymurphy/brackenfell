// ───────────────────────── depth and grime: analytic room ambient occlusion, dirt, soot, damp ─────────────────────────
// Rooms (World.zones) are boxes in their site's frame. A surface inside one darkens its ambient light and hearth light near the floor,
// the ceiling and the corners, by its own position and normal (no baked data, no extra texture reads). Walls also gather dirt near
// the floor and soot above the hearth, and outdoor kit walls gather mud, moss and eave stains from two per-vertex heights (kg).
// Extends SH from 40_shade.js: SH.init and SH.update are wrapped so nothing there has to change.
SH.ROOMS = 64;
const RK = { cw: 1.3, cs: 0.85, fh: 1.0, fs: 0.8, ch: 1.1, cs2: 0.8, up: 0.38, low: 0.3 };      // [l1] room mood: corner width/strength, floor height/strength, ceiling height/strength, upper-wall dim, wall-foot dim
if (typeof TEST !== 'undefined' && TEST && TEST.room === 0) Object.assign(RK, { cw: 0.9, cs: 0.5, fh: 0.7, fs: 0.7, ch: 0.6, cs2: 0.65, up: 0, low: 0 });
if (typeof TEST !== 'undefined' && TEST && TEST.roomk) Object.assign(RK, JSON.parse(TEST.roomk));
(function () {
  const _init = SH.init, _upd = SH.update;
  SH.init = function () {
    _init.apply(this, arguments);
    const { Fn, If, int, float, vec2, vec3, vec4, uniformArray, abs, max, min, smoothstep, mix, length, select, texture } = TSL, U = SH.U, sat = SH.sat;
    const mk = fill => uniformArray(Array.from({ length: SH.ROOMS }, () => new THREE.Vector4(fill[0], fill[1], fill[2], fill[3])), 'vec4');
    U.roomA = mk([0, 0, 1, 0]);            // site x, z, cos yaw, sin yaw
    U.roomB = mk([1e4, 1e4, -1e4, 1e4]);   // half width, half depth, floor y, wall height  (zone 0 is "everywhere": nothing ever occludes)
    U.roomC = mk([0, 1e4, 1e4, 0]);        // roof slope (0 under a flat ceiling), loft floor y, loft starts at local x
    U.roomD = mk([0, 0, 0, 0]);            // hearth local x, z, width, 1 when there is one
    const nz1 = p => texture(G.noiseTex, p).level(1);
    // x: ambient multiplier (1 = open), y: dirt on lower walls, z: soot above the hearth
    SH.room = Fn(([wp, N, zone]) => {
      const out = vec4(1, 0, 0, 0).toVar();
      If(zone.greaterThan(0.5), () => {
        const zi = int(zone), A = U.roomA.element(zi), B = U.roomB.element(zi), C = U.roomC.element(zi), D = U.roomD.element(zi);
        const dx = wp.x.sub(A.x), dz = wp.z.sub(A.y);
        const lx = dx.mul(A.z).add(dz.mul(A.w)), lz = dz.mul(A.z).sub(dx.mul(A.w));
        const nx = N.x.mul(A.z).add(N.z.mul(A.w)), nzl = N.z.mul(A.z).sub(N.x.mul(A.w));
        const tx = sat(B.x.sub(0.12).sub(abs(lx)).div(RK.cw)).oneMinus(), tz = sat(B.y.sub(0.12).sub(abs(lz)).div(RK.cw)).oneMinus();      // [l1] RK: room mood knobs
        const wallAo = float(1).sub(tx.mul(tx).mul(RK.cs).mul(float(1).sub(abs(nx)))).mul(float(1).sub(tz.mul(tz).mul(RK.cs).mul(float(1).sub(abs(nzl)))));
        const onLoft = wp.y.greaterThan(C.y.sub(0.3)).and(lx.greaterThan(C.z.sub(0.1)));
        const underLoft = lx.greaterThan(C.z).and(onLoft.not());
        const fl = select(onLoft, C.y, B.z), h = wp.y.sub(fl);
        const roofTop = B.z.add(B.w).add(max(B.y.sub(abs(lz)), 0).mul(C.x));
        const top = select(onLoft, roofTop, select(underLoft, C.y.sub(0.3), roofTop)), g = top.sub(wp.y);
        const fa = sat(h.div(RK.fh)).oneMinus(), ca = sat(g.div(RK.ch)).oneMinus();
        const flAo = float(1).sub(fa.mul(fa).mul(RK.fs).mul(float(1).sub(max(N.y, 0))));
        const clAo = float(1).sub(ca.mul(RK.cs2).mul(float(1).sub(max(N.y.negate(), 0))));
        const upper = float(1).sub(smoothstep(1.7, 2.9, h).mul(RK.up)), wallL = float(1).sub(float(1).sub(smoothstep(0.0, 1.1, h)).mul(RK.low).mul(float(1).sub(abs(N.y))));      // [l1] the upper third and the foot of a wall go dim: the light sits at table height
        out.x.assign(wallAo.mul(flAo).mul(clAo).mul(upper).mul(wallL));
        const wallness = float(1).sub(abs(N.y));
        const nn = nz1(vec2(lx.add(lz).mul(0.55), wp.y.mul(0.8).add(lz.mul(0.2)))).toVar();
        out.y.assign(sat(h.div(nn.r.mul(1.0).add(0.55))).oneMinus().mul(wallness));
        const hd2 = length(vec2(lx.sub(D.x).sub(0.4), lz.sub(D.y))), rad = max(h.sub(1.2), 0).mul(0.5).add(0.9);
        out.z.assign(sat(hd2.div(rad)).oneMinus().mul(smoothstep(1.0, 1.9, h)).mul(D.w).mul(nn.g.mul(0.6).add(0.55)));
      });
      return out;
    });
    // outdoor and indoor wall grime as one colour multiplier (rgb) and a moss amount (w). hgt: metres above the ground, eave: metres below the eaves
    SH.grime = Fn(([wp, N, hgt, eave, rdirt, rsoot, stone]) => {
      const out = vec4(1, 1, 1, 0).toVar();
      If(hgt.lessThan(7.9).or(eave.lessThan(7.9)).or(rdirt.greaterThan(0.01)).or(rsoot.greaterThan(0.01)), () => {
        const nn = nz1(vec2(wp.x.add(wp.z).mul(0.5), wp.y.mul(0.7).add(wp.x.sub(wp.z).mul(0.09)))).toVar(), wallness = float(1).sub(abs(N.y));
        const dirtE = TSL.sqrt(sat(hgt.div(nn.r.mul(0.9).add(1.0))).oneMinus()).mul(wallness).mul(0.8);
        const dirt = max(dirtE, rdirt);
        const streak = sat(eave.div(nn.g.mul(0.5).add(0.3))).oneMinus().mul(wallness).mul(smoothstep(0.3, 0.6, nn.b));
        const rgb = (mix(vec3(1), vec3(0.36, 0.30, 0.22), dirt).mul(mix(vec3(1), vec3(0.56, 0.53, 0.5), streak.mul(0.8))).mul(mix(vec3(1), vec3(0.12, 0.11, 0.10), rsoot)));
        const mo = (sat(hgt.div(nn.a.mul(0.6).add(0.4))).oneMinus().mul(smoothstep(0.38, 0.58, nn.r.mul(0.5).add(nn.b.mul(0.5)))).mul(wallness).mul(stone));
        out.assign(vec4(rgb, mo));
      });
      return out;
    });
  };
  // house boxes into the uniforms, once the village exists (zones are added while it is built)
  SH.syncRooms = function () {
    const U = SH.U; if (!U || !U.roomA) return;
    const Z = World.zones; SH._roomsN = Z.length;
    for (const z of Z) {
      if (z.id >= SH.ROOMS) continue; const s = z.site, i = z.id, fy = z.y0 + 0.7;
      if (s.id === 'inn' && !z.loft) { z.loft = 2.6; z.loftX = 2.4; }       // the inn's loft (until the structure work moves it, see 72_buildings.js)
      U.roomA.array[i].set(s.x, s.z, Math.cos(s.yaw), Math.sin(s.yaw));
      U.roomB.array[i].set(z.hw, z.hd, fy, z.H || 3);
      U.roomC.array[i].set(z.slope || 0, z.loft ? fy + z.loft : 1e4, z.loft ? z.loftX : 1e4, 0);
      U.roomD.array[i].set(z.hearth ? z.hearth[0] : 0, z.hearth ? z.hearth[1] : 0, z.hearth ? z.hearth[2] : 0, z.hearth ? 1 : 0);
    }
  };
  SH.update = function () { if (SH._roomsN !== World.zones.length) SH.syncRooms(); return _upd.apply(this, arguments); };
})();
