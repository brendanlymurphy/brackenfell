// ───────────────────────── houses assembled from the village kit, furnished from the props kit ─────────────────────────
// buildHouse() still lays out every building (zones, colliders, floors, doors, window light, seats, hearths); in kit style its
// generated shell is thrown away here and replaced by kit modules: 2 m wall panels scaled to the wall runs, with door and window
// panels exactly where the building's openings are, corner posts, a tiled roof that fits, timber gables, chimneys, and on some
// buildings a second storey with a balcony. Props.* calls made while furnishing are swapped for kit props at the same place.
const HOUSE_STYLE = (TEST && TEST.house) || 'kit';        // 'kit' | 'legacy' (the generated houses)
const KIT_STYLE = {
  inn: { ground: 'stone', pitch: 50, vines: 4, banner: true, round: true },
  smithy: { ground: 'stone', vines: 1 },
  store: { ground: 'plaster', up: 1, balcony: 'front', vines: 2 },
  elder: { ground: 'stone', up: 1, vines: 3 },
  herbalist: { ground: 'plaster', vines: 4, round: true },
  guardhouse: { ground: 'stone', up: 1, balcony: 'front' },
  weaver: { ground: 'plaster', up: 1, vines: 2 },
  chapel: { ground: 'stone', pitch: 56, thin: true, banner: true },
  mill: { ground: 'stone', up: 1, vines: 2 },
  farm: { ground: 'plaster', vines: 2 },
  hunter: { ground: 'stone', vines: 1 },
  fisher: { ground: 'plaster' },
};
World.kitExt = {}; World.kitInt = {}; World.kitYard = null; World.kitGroups = [];
const kitReady = () => HOUSE_STYLE === 'kit' && typeof Kit !== 'undefined' && !!Kit.ready;
function kitWanted(site, spec) { return kitReady() && !!KIT_STYLE[site.id]; }
async function kitBoot(progress) {
  if (HOUSE_STYLE !== 'kit' || typeof Kit === 'undefined') return;
  try { await Kit.load(progress, { packs: Kit.PACKS.filter(p => /village|props/.test(p.glb)) }); }
  catch (e) { console.warn('kits unavailable, building the generated houses instead: ' + (e && e.message || e)); G.kitNote = String(e && e.message || e); }
}
// the building's spec adjusted to what the kit panels can do: 3 m storeys, kit door and window sizes, no slit windows
function kitSpec(site, spec) {
  const st = KIT_STYLE[site.id], s = Object.assign({}, spec, { kitStyle: st });
  s.H = Math.max(spec.H || 2.6, 3.0); s.pitch = st.pitch || 52;
  const sy = s.H / 3;
  s.doors = (spec.doors || []).map(o => { const sx = clamp((o.w || 1.05) / 1.08, 1.0, 1.4); return Object.assign({}, o, { w: 1.1 * sx, h: 2.12 * sy, ksx: sx, lamp: false, kLamp: o.lamp !== false }); });
  s.windows = (spec.windows || []).filter(o => (o.sill === undefined ? 1 : o.sill) < 2.0).map(o => Object.assign({}, o, { w: 1.2, sill: 0.95 * sy, h: 1.55 * sy, kwin: st.thin || (o.w || 0.9) < 0.85 ? 'thin' : st.round ? 'round' : 'wide' }));
  if (st.up) s.ceiling = true;
  return s;
}
const KH = (() => {
  const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _l = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  // base * translate * rotateY * scale
  const xf = (base, x, y, z, s, ry) => { const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s; _l.compose(_p.set(x, y, z), _q.setFromAxisAngle(Y, ry || 0), _s.set(sv[0], sv[1], sv[2])); return new THREE.Matrix4().multiplyMatrices(base, _l); };
  return { V, xf };
})();

function kitShell(c) {
  const { site, spec, w, d, H, t, hd, ext, glow, zone, Ms, openings, tanP } = c, st = spec.kitStyle, sy = H / 3, stone = st.ground === 'stone';
  // drop the generated shell; everything it registered in the world (colliders, floors, doors, window light) stays
  ext.nv = 0; ext.ni = 0; ext.min = [1e9, 1e9, 1e9]; ext.max = [-1e9, -1e9, -1e9]; glow.nv = 0; glow.ni = 0;
  const b = Kit.batch({ name: 'kit-' + site.id, cell: 4096 }); World.kitExt[site.id] = { batch: b, site };
  const MS = new THREE.Matrix4().fromArray(Ms), R = rng(site.x * 71 + site.z * 13 + 3);
  const OUT = { zone: 0, skyVis: 1, inZone: zone, inSkyVis: INT_AO }, EXT = { zone: 0, skyVis: 1 }, UP = { zone: 0, skyVis: 1, inZone: 0, inSkyVis: 0.12 };
  const frames = {}, wbs = {};
  for (const wn in WALLS) { const W = WALLS[wn], s0 = W.start(w, d); frames[wn] = new THREE.Matrix4().makeBasis(KH.V(W.u), KH.V([0, 1, 0]), KH.V(W.n)).setPosition(s0[0], s0[1], s0[2]).premultiply(MS); wbs[wn] = m4.basis(m4.create(), W.u, [0, 1, 0], W.n, s0); }
  const add = (F, name, x, y, z, s, o, ry) => b.add(name, KH.xf(F, x, y, z, s, ry), o || OUT);
  const Ytop = H + (st.up ? 3 : 0);
  Object.assign(c, { kb: b, kMS: MS, kYtop: Ytop, kFrames: frames, kR: R });
  const G = stone ? 'Wall_UnevenBrick' : 'Wall_Plaster';
  const filler = (F, a, e, y, ys, isStone, endL, endR, o) => {
    const g = e - a; if (g < 0.05) return;
    const n = Math.max(1, Math.round(g / 2)), m = g / n;
    for (let k = 0; k < n; k++) {
      const sx = m / 2; let name;
      if (isStone) name = 'Wall_UnevenBrick_Straight';
      else if (sx < 0.6) name = 'Wall_Plaster_Straight_Base';
      else if (k === 0 && endL) name = 'Wall_Plaster_Straight_L'; else if (k === n - 1 && endR) name = 'Wall_Plaster_Straight_R';
      else name = (k % 2) ? 'Wall_Plaster_Straight_Base' : 'Wall_Plaster_Straight';
      add(F, name, a + (k + 0.5) * m, y, 0, [sx, ys, 1], o);
    }
  };
  const WIN = {
    thin: ['_Window_Thin_Round', 'Window_Thin_Round1', 'WindowShutters_Thin_Round_Open'],
    round: ['_Window_Wide_Round', 'Window_Wide_Round1', 'WindowShutters_Wide_Round_Open'],
    wide: ['_Window_Wide_Flat', 'Window_Wide_Flat1', 'WindowShutters_Wide_Flat_Open'],
  };
  c.kDoorLamps = [];
  for (const wn of ['front', 'back', 'left', 'right']) {
    const F = frames[wn], L = WALLS[wn].len(w, d);
    // ── ground storey: door and window panels where the openings are, plain panels scaled to fill between them ──
    const slots = openings[wn].map(o => ({ o, c: (o.u0 + o.u1) / 2, hw: o.door ? (o.def.ksx || 1) : 1 })).sort((a, e) => a.c - e.c);
    for (const s of slots) s.hw = Math.min(s.hw, s.c, L - s.c);
    for (let i = 0; i < slots.length - 1; i++) { const a = slots[i], n = slots[i + 1], gap = n.c - a.c, sum = a.hw + n.hw; if (sum > gap) { a.hw *= gap / sum; n.hw *= gap / sum; } }
    let cur = 0;
    for (const s of slots) {
      const o = s.o, sx = s.hw, S = [sx, sy, 1];
      if (!o.door && sx < 0.5) continue;                      // no room for a window panel: the wall stays solid there
      filler(F, cur, s.c - sx, 0, sy, stone, cur === 0, false);
      if (o.door) {
        add(F, G + '_Door_Flat', s.c, 0, 0, S); add(F, 'DoorFrame_Flat_WoodDark', s.c, 0, 0, S, EXT);
        if (o.def.kLamp) { const side = s.c + sx + 1.0 < L ? 1 : -1; c.kDoorLamps.push({ F, wn, u: s.c + side * (sx + 0.42), v: 1.5 * sy }); }
      } else {
        const k = WIN[o.def.kwin] || WIN.wide;
        add(F, G + k[0], s.c, 0, 0, S); add(F, k[1], s.c, 0, 0, S);
        if (o.def.shutters !== false && sx > 0.9 && s.c - 1.3 > 0 && s.c + 1.3 < L) add(F, k[2], s.c, 0, 0, S, EXT);
      }
      cur = s.c + sx;
    }
    filler(F, cur, L, 0, sy, stone, cur === 0, true);
    add(F, 'Corner_Exterior_Wood', 0, 0, 0, [1.25, sy, 1.25], EXT);
    // ── upper storey: timber and plaster, windows on alternate panels, a balcony over the door on some ──
    if (st.up) {
      const n = Math.max(1, Math.round(L / 2)), m = L / n, sx = m / 2, S = [sx, 1, 1], mid = n >> 1;
      for (let k = 0; k < n; k++) {
        const uc = (k + 0.5) * m;
        if (st.balcony === wn && n >= 3 && k === mid) {
          add(F, 'Wall_Plaster_Door_Flat', uc, H, 0, S, UP); add(F, 'DoorFrame_Flat_WoodDark', uc, H, 0, S, EXT); add(F, 'Door_1_Flat', uc - 0.54 * sx, H, -0.05, S, EXT);
          add(F, 'Balcony_Simple_Corner', uc + sx, H, 0, S, EXT); add(F, 'Balcony_Simple_Corner', uc - sx, H, 0, [-sx, 1, 1], EXT);
          add(F, 'Floor_WoodDark_Half3', uc - sx, H, 1, S, EXT); add(F, 'Floor_WoodDark_Half3', uc + sx, H, 1, S, EXT);
          for (const sg of [-1, 1]) add(F, 'Roof_Support2', uc + sg * 1.7 * sx, H - 0.74, 0.02, 1, EXT);
        } else if (n > 1 && k === 0) add(F, 'Wall_Plaster_Straight_L', uc, H, 0, S, UP);
        else if (n > 1 && k === n - 1) add(F, 'Wall_Plaster_Straight_R', uc, H, 0, S, UP);
        else if (n <= 3 || (k + (wn === 'front' || wn === 'back' ? 0 : 1)) % 2 === 1) {
          const r = R();
          if (r < 0.4) { add(F, 'Wall_Plaster_Window_Wide_Flat2', uc, H, 0, S, UP); add(F, 'Window_Wide_Flat1', uc, H, 0, S, UP); }
          else if (r < 0.75) { add(F, 'Wall_Plaster_Window_Wide_Flat', uc, H, 0, S, UP); add(F, 'Window_Wide_Flat1', uc, H, 0, S, UP); if (uc > 1.4 && uc < L - 1.4) add(F, 'WindowShutters_Wide_Flat_Open', uc, H, 0, S, EXT); }
          else { add(F, 'Wall_Plaster_Window_Thin_Round', uc, H, 0, S, UP); add(F, 'Window_Thin_Round1', uc, H, 0, S, UP); add(F, 'WindowShutters_Thin_Round_Closed', uc, H, 0, S, EXT); }
        } else add(F, 'Wall_Plaster_Straight', uc, H, 0, S, UP);
      }
      add(F, 'Corner_Exterior_Wood', 0, H, 0, [1.25, 1, 1.25], EXT);
    }
    // ── gable ends carry the timber triangle of the roof ──
    if (wn === 'left' || wn === 'right') { const span = d <= 5 ? 4 : d <= 7.2 ? 6 : 8, ridge = Kit.info('Roof_RoundTiles_' + span + 'x8').max[1]; add(F, 'Roof_Front_Brick' + span, L / 2, Ytop, 0, [d / span, hd * tanP / ridge, 1], { zone: 0, skyVis: 1, inZone: st.up ? 0 : zone, inSkyVis: INT_AO }); }
  }
  // ── roof: the kit roof nearest in size, turned so its ridge runs along the building and scaled to the footprint and pitch ──
  {
    const span = d <= 5 ? 4 : d <= 7.2 ? 6 : 8, lens = span === 4 ? [4, 6, 8] : span === 6 ? [4, 6, 8, 10, 12, 14] : [8, 10, 12];
    let len = lens[0]; for (const l of lens) if (Math.abs(Math.log(w / l)) < Math.abs(Math.log(w / len))) len = l;
    const name = 'Roof_RoundTiles_' + span + 'x' + len, ridge = Kit.info(name).max[1];
    const RF = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)).setPosition(0, Ytop, 0).premultiply(MS);
    b.add(name, KH.xf(RF, 0, 0, 0, [d / span, hd * tanP / ridge, w / len]), { zone: 0, skyVis: 1, inZone: st.up ? 0 : zone, inSkyVis: 0.2 });
  }
  // ── floor tiles (in the outdoor batch, so the room is not a hole when its furniture is hidden by distance) ──
  {
    const nx = Math.max(1, Math.round(w / 2)), nz = Math.max(1, Math.round(d / 2)), sx = (w - 0.3) / (2 * nx), sz = (d - 0.3) / (2 * nz), tile = spec.floor === 'stone' ? 'Floor_UnevenBrick' : 'Floor_WoodDark';
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.add(tile, KH.xf(MS, (i - (nx - 1) / 2) * 2 * sx, 0.012, (j - (nz - 1) / 2) * 2 * sz, [sx, 1, sz]), { zone, skyVis: INT_AO, cast: false });
  }
  // ── generated parts that still make sense: stone plinth down to the ground, door steps, ceiling or roof lining ──
  const inner = () => { ext.m1 = zone; ext.ao = INT_AO; }, outer = () => { ext.m1 = 0; ext.ao = 1; };
  outer(); ext.mat(MAT.STONE, [0.92, 0.92, 0.92]); ext.grad = [1, 0.6]; ext.box(-w / 2 - 0.07, -1.7, -hd - 0.07, w / 2 + 0.07, 0, hd + 0.07, 4); ext.grad = null;
  for (const wn in WALLS) for (const o of openings[wn]) if (o.door) {
    ext.push(); m4.mul(ext.m, ext.m, wbs[wn]); ext.dirty = true;
    outer(); ext.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); ext.box(o.u0 - 0.35, -0.5, 0, o.u1 + 0.35, -0.02, 0.5); ext.box(o.u0 - 0.2, -0.5, 0.5, o.u1 + 0.2, -0.17, 0.95);
    ext.pop();
  }
  const e = 0.16;          // the kit walls are thinner than the generated ones: reach to their inner face
  if (spec.ceiling) {
    inner(); ext.mat(MAT.PLANKS, COL.wood); ext.ao = INT_AO * 0.85;
    ext.quad([-w / 2 + e, H, hd - e], [-w / 2 + e, H, -hd + e], [w / 2 - e, H, -hd + e], [w / 2 - e, H, hd - e]);
    if (st.up) { outer(); ext.ao = 0.15; ext.mat(MAT.PLANKS, COL.woodDark); ext.quad([-w / 2 + e, H + 0.05, -hd + e], [-w / 2 + e, H + 0.05, hd - e], [w / 2 - e, H + 0.05, hd - e], [w / 2 - e, H + 0.05, -hd + e]); }
  } else {
    const roofY = c.roofY;
    ext.mat(MAT.PLANKS, COL.woodDark);
    for (const s of [-1, 1]) {
      const q = (x0, x1, z0, z1) => { const a = [x0, roofY(z0) - 0.04, s * z0], p = [x0, roofY(z1) - 0.04, s * z1], r = [x1, roofY(z1) - 0.04, s * z1], f = [x1, roofY(z0) - 0.04, s * z0]; if (s < 0) ext.quad(a, p, r, f); else ext.quad(f, r, p, a); };
      inner(); ext.ao = INT_AO * 0.9; q(-w / 2 + e, w / 2 - e, 0, hd - e);
    }
    for (const wn of ['left', 'right']) {
      ext.push(); m4.mul(ext.m, ext.m, wbs[wn]); ext.dirty = true;
      inner(); ext.mat(MAT.PLASTER, [0.97, 0.93, 0.86]); ext.poly([[d - 0.05, H, -e - 0.02], [0.05, H, -e - 0.02], [d / 2, H + d / 2 * tanP, -e - 0.02]]);
      ext.pop();
    }
  }
  // lanterns by the doors
  for (const l of c.kDoorLamps) {
    add(l.F, 'Lantern_Wall', l.u, l.v, 0.03, 0.8, { zone: 0, skyVis: 1, lit: 1 });
    const lp = Kit.lights('Lantern_Wall')[0] || [0, 0.53, 0.76], v = new THREE.Vector3(lp[0] * 0.8, lp[1] * 0.8, lp[2] * 0.8).applyMatrix4(KH.xf(l.F, l.u, l.v, 0.03)), p = [v.x, v.y, v.z];
    World.emitters.push({ type: 'lantern', p, zone: 0 }); addLight(p, 9, [3.4, 1.9, 0.75], 0, 'lantern');
  }
  outer(); ext.grad = null;
}
// a kit chimney above a hearth at house-local (lx, lz), rising clear of the ridge
function kitChimney(c, lx, lz) {
  const ridge = c.kYtop + c.hd * c.tanP, base = c.kYtop + (c.hd - Math.abs(lz)) * c.tanP - 1.0, hgt = Math.max(3.18, ridge + 1.1 - base);
  c.kb.add('Prop_Chimney', KH.xf(c.kMS, lx, base, lz, [1.1, hgt / 3.18, 1.1]), { zone: 0, skyVis: 1 });
  World.emitters.push({ type: 'smoke', p: m4.tp(c.Ms, [lx, base + hgt + 0.2, lz]), zone: 0 });
}

// ── furnishing: Props.* calls land here while kits are loaded and are answered with kit pieces at the same spot ──
const KITP = { rnd: rng(4242) };
function kitIntBatch(zone) {
  let k = World.kitInt[zone];
  if (!k) { const zi = World.zones[zone - 1]; k = World.kitInt[zone] = { batch: Kit.batch({ name: 'kitint-' + (zi ? zi.site.id : zone), cell: 4096 }), site: zi ? zi.site : null }; }
  return k.batch;
}
// place a kit piece relative to the mesh's current transform (the same frame the generated prop would be drawn in)
function kp(m, name, x, y, z, s, ry, extra) {
  const zone = m.m1 | 0;
  let B; if (zone) B = kitIntBatch(zone); else { if (!World.kitYard) World.kitYard = Kit.batch({ name: 'kit-yard', cell: 40 }); B = World.kitYard; }
  B.add(name, KH.xf(new THREE.Matrix4().fromArray(m.m), x, y, z, s, ry), Object.assign({ zone, skyVis: zone ? INT_AO : 1, cast: !zone }, extra || {}));
}
(function kitPropsInstall() {
  const wrap = (name, fn) => { const orig = Props[name]; Props[name] = function () { return kitReady() ? fn.apply(Props, arguments) : orig.apply(Props, arguments); }; };
  wrap('table', (m, len, wid, h) => { h = h || 0.76; kp(m, 'Table_Large', 0, 0, 0, [len / 2.85, h / 0.81, wid / 1.1]); addBoxCollider(m, -len / 2, -wid / 2, len / 2, wid / 2, 0, h); });
  wrap('bench', (m, len, noCol) => { kp(m, 'Bench', 0, 0, 0, [len / 2.78, 0.46 / 0.52, 0.66]); if (!noCol) addBoxCollider(m, -len / 2, -0.16, len / 2, 0.16, 0, 0.46); });
  wrap('stool', m => kp(m, 'Stool', 0, 0, 0, [0.8, 0.45 / 0.58, 0.8]));
  wrap('chair', m => kp(m, 'Chair_1', 0, 0, 0, [0.85, 0.9, 0.85], KITP.chairRy));
  wrap('bed', (m, w) => { w = w || 1.0; kp(m, KITP.rnd() < 0.5 ? 'Bed_Twin1' : 'Bed_Twin2', 0, 0, 0, [(w + 0.14) / 1.88, 0.74, 2.08 / 2.41], KITP.bedRy); addBoxCollider(m, -w / 2, -1, w / 2, 1, 0, 0.6); });
  wrap('chest', (m, w) => { w = w || 0.85; const s = w / 1.2; kp(m, 'Chest_Wood__Base', 0, 0.01, 0, s, KITP.chestRy); kp(m, 'Chest_Wood__Lid', 0, 0.01, 0, s, KITP.chestRy); addBoxCollider(m, -w / 2, -0.25, w / 2, 0.25, 0, 0.6); });
  wrap('barrel', (m, r, h, noCol) => { r = r || 0.33; h = h || 0.9; kp(m, 'Barrel', 0, 0, 0, [r / 0.35, h / 0.9, r / 0.35], KITP.rnd() * 6); if (!noCol) addCircleCollider(m, 0, 0, r, 0, h); });
  wrap('crate', (m, s, noCol) => { s = s || 0.6; const k = s / 0.88; kp(m, 'Crate_Wooden', 0, 0.05 * k, 0, k); if (!noCol) addBoxCollider(m, -s / 2, -s / 2, s / 2, s / 2, 0, s); });
  wrap('sack', (m, s) => { s = s || 0.3; kp(m, 'Bag', 0, 0, 0, 1.9 * s / 0.8, KITP.rnd() * 6); });
  wrap('pot', (m, s) => { s = s || 0.14; kp(m, KITP.rnd() < 0.5 ? 'Vase_4' : 'Vase_2', 0, 0, 0, 2.1 * s / 0.5); });
  wrap('jug', m => kp(m, 'Vase_4', 0, 0, 0, 0.56));
  wrap('bottle', m => { const r = KITP.rnd(); kp(m, r < 0.6 ? 'Bottle_1' : r < 0.8 ? 'Potion_2' : 'Potion_4', 0, 0, 0, r < 0.6 ? 0.75 : 0.9); });
  wrap('mug', m => kp(m, 'Mug', 0, 0.006, 0, 0.7, KITP.rnd() * 6));
  wrap('plate', m => kp(m, 'Table_Plate', 0, 0.003, 0, 0.75));
  wrap('book', (m, col, w) => kp(m, 'Book_5', 0, 0.026, 0, [0.85, (w || 0.04) / 0.06, 0.85], 0, col ? { tint: [0.55 + col[0] * 0.6, 0.55 + col[1] * 0.6, 0.55 + col[2] * 0.6] } : null));
  wrap('candle', (m, ctx, tall) => {
    const name = tall ? 'Candle_2' : 'Candle_1', lp = Kit.lights(name)[0] || [0, tall ? 0.27 : 0.15, 0];
    kp(m, name, 0, 0, 0, 1, 0, { lit: 1 });
    World.emitters.push({ type: 'candle', p: wp(m, lp[0], lp[1] + 0.02, lp[2]), zone: ctx.zone, always: !!ctx.always });
    if (ctx.candleLight !== false) addLight(wp(m, lp[0], lp[1] + 0.1, lp[2]), 4.2, [1.5, 0.95, 0.42], ctx.zone, 'candle');
  });
  wrap('cauldron', (m, r) => { r = r || 0.24; kp(m, 'Cauldron', 0, 0, 0, 2.1 * r / 0.99); });
  wrap('anvil', m => { kp(m, 'Anvil_Log', 0, 0, 0, 0.78); addCircleCollider(m, 0, 0, 0.32, 0, 0.8); });
  wrap('sword', m => kp(m, 'Sword_Bronze', 0, 0.2, 0, 0.9));
  wrap('shield', m => kp(m, 'Shield_Wooden', 0, 0, 0, 1.08));
})();
KITP.chairRy = 0; KITP.bedRy = 0; KITP.chestRy = 0;

// extra dressing per building, once its own interior has been laid out
function kitDress(c) { }

// ── scene: build the batches once the scene exists, hide interiors that are far away ──
function kitAttach() {
  if (!kitReady() || !SC.scene) return;
  const addG = (g, info) => { g.traverse(o => { if (o.isMesh && info.interior) { o.layers.set(1); o.castShadow = false; } }); SC.scene.add(g); World.kitGroups.push(Object.assign({ g }, info)); };
  for (const id in World.kitExt) { const k = World.kitExt[id]; if (k.batch.count) addG(k.batch.build(), { site: k.site }); }
  for (const z in World.kitInt) { const k = World.kitInt[z]; if (k.batch.count) addG(k.batch.build(), { site: k.site, interior: true }); }
  if (World.kitYard && World.kitYard.count) { const g = World.kitYard.build(); g.traverse(o => { if (o.isMesh) o.layers.set(1); }); addG(g, { yard: true }); }
  const inner = sceneUpdate;
  sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    // furniture only shows through an open door or a window, so it is drawn for the nearest buildings alone
    for (const k of World.kitGroups) {
      if (k.interior && k.site) k.g.visible = hyp(k.site.x - camPos[0], k.site.z - camPos[2]) < 15 + Math.max(k.site.w, k.site.d) * 0.5;
      else if (k.yard) for (const o of k.g.children) { const bs = o.geometry && o.geometry.boundingSphere; if (bs) o.visible = hyp(bs.center.x - camPos[0], bs.center.z - camPos[2]) < 75 + bs.radius; }
    }
    if (Kit.update) Kit.update(camPos);
  };
}
