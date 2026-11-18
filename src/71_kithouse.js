// ───────────────────────── houses assembled from the village kit, furnished from the props kit ─────────────────────────
// buildHouse() still lays out every building (zones, colliders, floors, doors, window light, seats, hearths); in kit style its
// generated shell is thrown away here and replaced by kit modules: 2 m wall panels scaled to the wall runs, with door and window
// panels exactly where the building's openings are, corner posts, a tiled roof that fits, timber gables, chimneys, and on some
// buildings a second storey with a balcony. Props.* calls made while furnishing are swapped for kit props at the same place.
const HOUSE_STYLE = (TEST && TEST.house) || 'kit';        // 'kit' | 'legacy' (the generated houses)
const KIT_STYLE = {
  inn: { ground: 'stone', pitch: 50, vines: 4, banner: true, round: true },
  smithy: { ground: 'stone', vines: 1 },
  store: { timber: true, shingle: true, ground: 'plaster', up: 1, balcony: 'front', vines: 2 },
  elder: { timber: true, shingle: true, ground: 'stone', up: 1, vines: 3 },
  herbalist: { timber: true, shingle: true, ground: 'plaster', vines: 4, round: true },
  guardhouse: { shingle: true, ground: 'stone', up: 1, balcony: 'front' },
  weaver: { timber: true, shingle: true, ground: 'plaster', up: 1, vines: 2 },
  chapel: { ground: 'stone', pitch: 56, thin: true, banner: true, arch: true },
  mill: { shingle: true, ground: 'stone', up: 1, vines: 2 },
  farm: { timber: true, shingle: true, ground: 'plaster', vines: 2 },
  hunter: { shingle: true, ground: 'stone', vines: 1 },
  fisher: { timber: true, shingle: true, ground: 'plaster' },
  draper: { timber: true, shingle: true, ground: 'plaster', up: 1, balcony: 'front', vines: 1 },
};
World.kitExt = {}; World.kitInt = {}; World.kitYard = null; World.kitGroups = [];
const kitReady = () => HOUSE_STYLE === 'kit' && typeof Kit !== 'undefined' && !!Kit.ready;
function kitWanted(site, spec) { return kitReady() && !!KIT_STYLE[site.id]; }
async function kitBoot(progress) {
  if (HOUSE_STYLE !== 'kit' || typeof Kit === 'undefined') return;
  try { await Kit.load(progress, { packs: Kit.PACKS.filter(p => /village|props|scan|dungeon/.test(p.glb)) }); kitFixups(); if (typeof infillMaterials === 'function') await infillMaterials(); }       // scanned rocks photograph dark; lift them a little /* [q1] dungeon pack */
  catch (e) { console.warn('kits unavailable, building the generated houses instead: ' + (e && e.message || e)); G.kitNote = String(e && e.message || e); }
}
// pieces and material tweaks made once the packs are in: stained-glass clones of the arched windows, tints for the scanned pieces that photograph wrong
function kitFixups() {
  for (const n of ['ceramic_vase_02', 'ceramic_vase_04', 'ceramic_pot']) if (Kit.defs[n]) { Kit.defs[n].gain = 0.5; Kit.defs[n].color = [0.7, 0.46, 0.31]; }       // [fx1] scanned glazed pots photographed white in the sun: now read as earthenware
  for (const n of ['rock_moss_set_01', 'rock_moss_set_02']) if (Kit.defs[n]) { Kit.defs[n].gain = 2.0; Kit.defs[n].sat = 0.85; }       // scanned rocks photograph dark
  for (const n of ['Window_Wide_Flat1', 'Window_Wide_Round1', 'Window_Thin_Round1']) { const p = Kit.pieces[n]; if (p) Kit.pieces[n + '_Open'] = Object.assign({}, p, { name: n + '_Open', prims: p.prims.filter(q => q.mat !== 'MI_WindowGlass') }); }       // the frame without the pane: upstairs windows you can look out of
  for (const n of [4, 6, 8]) { const p = Kit.pieces['Roof_Front_Brick' + n]; if (p) Kit.pieces['Roof_Front_Brick' + n + '_Open'] = Object.assign({}, p, { name: 'Roof_Front_Brick' + n + '_Open', prims: p.prims.filter(q => q.mat !== 'MI_Plaster') }); }       // gable frames without their plaster, where a window is cut in (gableFill, 71c_upper.js)
  if (Kit.defs.MI_WindowGlass) Kit.defs.MI_StainedGlass = Object.assign({}, Kit.defs.MI_WindowGlass, { name: 'MI_StainedGlass' });
  for (const n of ['Window_Thin_Round1', 'Window_Wide_Round1']) { const p = Kit.pieces[n]; if (p) Kit.pieces[n + '_Stained'] = Object.assign({}, p, { name: n + '_Stained', prims: p.prims.map(q => q.mat === 'MI_WindowGlass' ? Object.assign({}, q, { mat: 'MI_StainedGlass' }) : q) }); }
}
const kitOpen = n => (Kit.pieces[n + '_Open'] ? n + '_Open' : n);
// the building's spec adjusted to what the kit panels can do: 3 m storeys, kit door and window sizes, no slit windows
function kitSpec(site, spec) {
  const SS = shellStyle(site, spec), st = Object.assign({}, KIT_STYLE[site.id]), s = Object.assign({}, spec, { kitStyle: st });      // [fx2] a copy: the shell style may change the ground floor and the cladding
  if (SS.ground) st.ground = SS.ground; if (st.timber && SS.lime) st.timber = false;
  s.H = Math.max(spec.H || 2.6, 3.0); s.pitch = st.pitch || 52;
  const sy = s.H / 3;
  s.doors = (spec.doors || []).map(o => { const sx = clamp((o.w || 1.05) / 1.08, 1.0, 1.4); return Object.assign({}, o, { w: 1.1 * sx, h: 2.12 * sy, ksx: sx, lamp: false, kLamp: o.lamp !== false }); });
  s.windows = (spec.windows || []).filter(o => (o.sill === undefined ? 1 : o.sill) < 2.0).map(o => Object.assign({}, o, { w: 1.2, sill: 0.95 * sy, h: 1.55 * sy, kwin: st.thin || (o.w || 0.9) < 0.85 ? 'thin' : st.round ? 'round' : 'wide', khw: st.thin ? 1.3 : 1, shutters: st.thin ? false : o.shutters }));
  if (st.up) s.ceiling = true;
  return s;
}
// [fin] FACING CONVENTION: a piece's front is +z in its own frame (kit and scan alike); a placer turns +z into the room. pAgainst(..., back = -1) uses rotBack(side, -1) and does that; PD.floorAt turns by rotBack(side, +1) (-z into the room) because the built pieces (pdShelf, cupboard) are made facing -z, so a kit piece drawn through it takes ry = PI.
const KH = (() => {
  const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _l = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  // base * translate * rotateY * scale
  const xf = (base, x, y, z, s, ry) => { const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s; _l.compose(_p.set(x, y, z), _q.setFromAxisAngle(Y, ry || 0), _s.set(sv[0], sv[1], sv[2])); return new THREE.Matrix4().multiplyMatrices(base, _l); };
  return { V, xf };
})();

let kitFB = null;
// With cells the shell is laid twice: pass 'ext' on the village site (outside faces, a closed door, glowing windows, no interior) and pass 'int' in the cell's own
// frame (the room's side of the same walls, floor, roof lining). Without cells one pass, 'both', lays it all on the site as it always was.
function kitShell(c) { if (!c.cell) return kitShellPass(c, 'both'); kitShellPass(c, 'ext'); if (!c.planned) kitShellPass(c, 'int'); }
function kitShellPass(c, pass) {
  const { spec, w, d, H, t, hd, glow, zone, openings, tanP } = c, site = c.xsite, X = pass !== 'int', I = pass !== 'ext', ext = pass === 'int' ? c.ext : c.xext, Ms = pass === 'int' ? c.Ms : c.Mx, st = spec.kitStyle, sy = H / 3, stone = st.ground === 'stone';
  // drop the generated shell; everything it registered in the world (colliders, floors, doors, window light) stays
  if (X) { for (const m of [c.xext, c.ext, glow]) { m.nv = 0; m.ni = 0; m.min = [1e9, 1e9, 1e9]; m.max = [-1e9, -1e9, -1e9]; } }
  const b = X ? (site.facade ? (() => { const nb = Kit.batch({ name: 'kit-' + site.id, cell: 4096, far: true }); nb.add = () => {}; return nb; })() : site.infill && typeof infBatch === 'function' ? infBatch() : Kit.batch({ name: 'kit-' + site.id, cell: 4096, far: true, gBase: site.y, gTop: c.xFloorY + H + (st.up ? 3 : 0) })) : kitIntBatch(zone);
  if (X) World.kitExt[site.id] = { batch: b, site, Ms: c.Mx, w, hd, top: H + (st.up ? 3 : 0), rise: hd * tanP, shared: !!site.infill };
  const SSt = (typeof shellStyle === 'function' && shellStyle(site, spec)) || {};      // [fx2] covering, pitch, tone, sag, eaves, wall tone of this shell
  const MS = new THREE.Matrix4().fromArray(Ms), R = rng(site.x * 71 + site.z * 13 + 3);
  const cellExt = pass === 'ext';          // in a cell the village shell knows nothing of the room: its inside faces are plain dark
  const OUT = { zone: 0, skyVis: 1, inZone: cellExt ? 0 : zone, inSkyVis: cellExt ? 0.12 : INT_AO }, EXT = { zone: 0, skyVis: 1 }, UP = { zone: 0, skyVis: 1, inZone: cellExt ? 0 : st.up ? zone : 0, inSkyVis: st.up && !cellExt ? INT_AO : 0.12 };       // the second storey is a room of the house (71b_storeys.js)
  const IN = { zone, skyVis: INT_AO, inZone: zone, inSkyVis: INT_AO };
  const frames = {}, wbs = {};
  for (const wn in WALLS) { const W = WALLS[wn], s0 = W.start(w, d); frames[wn] = new THREE.Matrix4().makeBasis(KH.V(W.u), KH.V([0, 1, 0]), KH.V(W.n)).setPosition(s0[0], s0[1], s0[2]).premultiply(MS); wbs[wn] = m4.basis(m4.create(), W.u, [0, 1, 0], W.n, s0); }
  const add = (F, name, x, y, z, s, o, ry) => {
    o = o || OUT;
    if (pass === 'int') { if (o === EXT) { if (!/^DoorFrame|^Door_1/.test(name)) return; o = IN; } else o = o.tint ? Object.assign({}, IN, { tint: o.tint }) : IN; }
    else if (cellExt && o.inZone !== undefined && o !== OUT && o !== UP) o = Object.assign({}, o, { inZone: 0, inSkyVis: 0.12 });
    if (st.timber && typeof infTimber === 'function') name = infTimber(name);
    if (SSt.wallTint && pass !== 'int' && /^(Wall_(?!UnevenBrick)|Corner_Exterior)/.test(name)) o = Object.assign({}, o, { tint: SSt.wallTint });
    if (Array.isArray(s) && (Math.abs(Math.abs(s[0]) - 1) > 0.02 || Math.abs(s[1] - 1) > 0.02)) o = Object.assign({}, o, { uvs: [Math.abs(s[0]), s[1]] });
    b.add(name, KH.xf(F, x, y, z, s, ry), o);
  };
  const Ytop = H + (st.up ? 3 : 0);
  if (X) Object.assign(c, { kb: b, kMX: MS, kFrames: frames }); if (I) c.kMS = MS; c.kYtop = Ytop; c.kR = c.kR || R;
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
  const infW = site.infill && typeof infKitWalls === 'function' && INFS.mats;
  if (infW) infKitWalls(c, b, MS, frames, zone, sy, R, pass);
  for (const wn of ['front', 'back', 'left', 'right']) {
    if (infW) continue;
    const F = frames[wn], L = WALLS[wn].len(w, d);
    // ── ground storey: door and window panels where the openings are, plain panels scaled to fill between them ──
    const slots = openings[wn].map(o => ({ o, c: (o.u0 + o.u1) / 2, hw: o.door ? (o.def.ksx || 1) : (o.def.khw || 1) })).sort((a, e) => a.c - e.c);
    for (const s of slots) s.hw = Math.min(s.hw, s.c, L - s.c);
    for (let i = 0; i < slots.length - 1; i++) { const a = slots[i], n = slots[i + 1], gap = n.c - a.c, sum = a.hw + n.hw; if (sum > gap) { a.hw *= gap / sum; n.hw *= gap / sum; } }
    let cur = 0;
    for (const s of slots) {
      const o = s.o, sx = s.hw, S = [sx, sy, 1];
      if (!o.door && sx < 0.5) continue;                      // no room for a window panel: the wall stays solid there
      filler(F, cur, s.c - sx, 0, sy, stone, cur === 0, false);
      if (o.door) {
        add(F, G + '_Door_Flat', s.c, 0, 0, S); add(F, st.arch ? 'DoorFrame_Round_Brick' : 'DoorFrame_Flat_WoodDark', s.c, 0, 0, st.arch ? [S[0], S[1] * 0.93, 1.1] : S, EXT);
        if (X && o.def.kLamp) { const side = s.c + sx + 1.0 < L ? 1 : -1; c.kDoorLamps.push({ F, wn, u: s.c + side * (sx + 0.42), v: 1.5 * sy }); }
      } else {
        const k = WIN[o.def.kwin] || WIN.wide;
        add(F, G + k[0], s.c, 0, 0, S); add(F, o.def.glass && Kit.pieces[k[1] + '_Stained'] ? k[1] + '_Stained' : k[1], s.c, 0, 0, S, o.def.glass ? Object.assign({}, OUT, { tint: o.def.glass }) : undefined);
        if (o.def.shutters !== false && sx > 0.9 && s.c - 1.3 > 0 && s.c + 1.3 < L) add(F, k[2], s.c, 0, 0, S, EXT);
        if (X && !o.def.glass && !st.arch && sx > 0.9 && (wn === 'front' || R() < 0.3) && R() < 0.7) { const fb = (kitFB = kitFB || [0, 1, 2].map(i => genFlowerBox(1.25, rng(70 + i)))); c.kb.add(R.pick(fb), KH.xf(F, s.c, 0.9 * sy, 0.27, 1, 0), EXT); }
      }
      cur = s.c + sx;
    }
    filler(F, cur, L, 0, sy, stone, cur === 0, true);
    add(F, 'Corner_Exterior_Wood', 0, 0, 0, [1.25, sy, 1.25], EXT);
    // ── upper storey: timber and plaster, windows on alternate panels, a balcony over the door on some ──
    if (st.up) {
      const n = Math.max(1, Math.round(L / 2)), m = L / n, sx = m / 2, S = [sx, 1, 1], mid = n >> 1, RU = rng(site.x * 91 + site.z * 7 + wn.charCodeAt(0) * 13);       // its own sequence: the inside copy of the wall must pick the same windows
      for (let k = 0; k < n; k++) {
        const uc = (k + 0.5) * m;
        if (st.balcony === wn && n >= 3 && k === mid) {
          add(F, 'Wall_Plaster_Door_Flat', uc, H, -0.015, S, UP); add(F, 'DoorFrame_Flat_WoodDark', uc, H, 0, S, EXT); add(F, 'Door_1_Flat', uc - 0.54 * sx, H, -0.05, S, EXT);
          add(F, 'Balcony_Simple_Corner', uc + sx, H, 0, S, EXT); add(F, 'Balcony_Simple_Corner', uc - sx, H, 0, [-sx, 1, 1], EXT);
          add(F, 'Floor_WoodDark_Half3', uc - sx, H, 1, S, EXT); add(F, 'Floor_WoodDark_Half3', uc + sx, H, 1, S, EXT);
          for (const sg of [-1, 1]) add(F, 'Roof_Support2', uc + sg * 1.7 * sx, H - 0.74, 0.02, 1, EXT);
        } else if (n > 1 && k === 0) add(F, 'Wall_Plaster_Straight_L', uc, H, -0.015, S, UP);
        else if (n > 1 && k === n - 1) add(F, 'Wall_Plaster_Straight_R', uc, H, -0.015, S, UP);
        else if (n <= 3 || (k + (wn === 'front' || wn === 'back' ? 0 : 1)) % 2 === 1) {
          const r = RU();
          if (r < 0.4) { add(F, 'Wall_Plaster_Window_Wide_Flat2', uc, H, -0.015, S, UP); add(F, kitOpen('Window_Wide_Flat1'), uc, H, -0.015, S, UP); }
          else if (r < 0.75) { add(F, 'Wall_Plaster_Window_Wide_Flat', uc, H, -0.015, S, UP); add(F, kitOpen('Window_Wide_Flat1'), uc, H, -0.015, S, UP); if (uc > 1.4 && uc < L - 1.4) add(F, 'WindowShutters_Wide_Flat_Open', uc, H, 0, S, EXT); }
          else { add(F, 'Wall_Plaster_Window_Thin_Round', uc, H, -0.015, S, UP); add(F, kitOpen('Window_Thin_Round1'), uc, H, -0.015, S, UP); add(F, 'WindowShutters_Thin_Round_Closed', uc, H, 0, S, EXT); }
        } else add(F, 'Wall_Plaster_Straight', uc, H, -0.015, S, UP);
      }
      add(F, 'Corner_Exterior_Wood', 0, H, 0, [1.25, 1, 1.25], EXT);
    }
    // ── gable ends carry the timber triangle of the roof ──
    if ((wn === 'left' || wn === 'right') && !(st.shingle && typeof infRoofGen === 'function')) { const span = d <= 5 ? 4 : d <= 7.2 ? 6 : 8, ridge = Kit.info('Roof_RoundTiles_' + span + 'x8').max[1]; const gw = spec.gableWin && spec.gableWin[wn] && Kit.pieces['Roof_Front_Brick' + span + '_Open'];
      add(F, 'Roof_Front_Brick' + span + (gw ? '_Open' : ''), L / 2, Ytop, 0, [d / span, hd * tanP / ridge, 1], { zone: 0, skyVis: 1, inZone: zone, inSkyVis: INT_AO });
      if (gw) gableFill(c, wbs[wn], L, Ytop, spec.gableWin[wn], (nm, u, v, s) => add(F, nm, u, v, 0, [s, s, 1], OUT), pass, ext); }
  }
  // ── roof: the kit roof nearest in size, turned so its ridge runs along the building and scaled to the footprint and pitch ──
  if (st.shingle && typeof infRoofGen === 'function') { if (X) infRoofGen(b, MS, { w, d, top: Ytop, tanP, ridgeX: true, zc: pass === 'ext' && typeof shellJetty === 'function' ? -shellJetty(site, st) : 0, ov: SSt.ov || 0.5, lift: 0.14, mat: SSt.mat, ts: SSt.ts, sag: SSt.sag, thick: SSt.thick, thatch: SSt.thatch, nl: infNeighbour(site, false) > 0, nr: infNeighbour(site, true) > 0, patch: SSt.patch, inZone: cellExt ? 0 : st.up ? 0 : zone, inSky: cellExt ? 0.12 : st.up ? 0.2 : INT_AO, tint: SSt.tint || [1, 1, 1] }); }
  else {
    const span = d <= 5 ? 4 : d <= 7.2 ? 6 : 8, lens = span === 4 ? [4, 6, 8] : span === 6 ? [4, 6, 8, 10, 12, 14] : [8, 10, 12];
    let len = lens[0]; for (const l of lens) if (Math.abs(Math.log(w / l)) < Math.abs(Math.log(w / len))) len = l;
    let name = 'Roof_RoundTiles_' + span + 'x' + len; const ridge = Kit.info(name).max[1]; if (st.shingle && typeof infR === 'function') name = infR(name);
    const RF = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)).setPosition(0, Ytop, 0).premultiply(MS);
    const nbL = !site.alleyRow && infNeighbour(site, false) > 0, nbR = !site.alleyRow && infNeighbour(site, true) > 0, rk = (nbL ? 0.04 : 0.2) + (nbR ? 0.04 : 0.2);      // [fx3] a neighbour against the gable end: the roof stops 4 cm out, not 0.85 m over it
    b.add(name, KH.xf(RF, ((nbR ? 0.04 : 0.2) - (nbL ? 0.04 : 0.2)) / 2 * (nbL || nbR ? 1 : 0), 0, 0, [d / span, hd * tanP / ridge, site.alleyRow ? (w + 0.14) / Kit.info(name).size[2] : (nbL || nbR) ? (w + rk) / Kit.info(name).size[2] : w / len]), pass === 'int' ? { zone, skyVis: INT_AO, inZone: zone, inSkyVis: 0.2 } : { zone: 0, skyVis: 1, inZone: cellExt ? 0 : zone, inSkyVis: cellExt ? 0.12 : 0.2 });
  }
  if (X && typeof shellDress === 'function') shellDress(c, b, frames, MS, { w, d, H, Ytop, tanP, st, site, SSt, openings, lift: 0.14 });      // [fx2]
  // ── floor tiles (in the outdoor batch, so the room is not a hole when its furniture is hidden by distance; in a cell they are the cell's) ──
  if (I) {
    const nx = Math.max(1, Math.round(w / 2)), nz = Math.max(1, Math.round(d / 2)), sx = (w - 0.3) / (2 * nx), sz = (d - 0.3) / (2 * nz), tile = spec.floor === 'stone' ? 'Floor_UnevenBrick' : 'Floor_WoodDark';
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.add(tile, KH.xf(MS, (i - (nx - 1) / 2) * 2 * sx, 0.012, (j - (nz - 1) / 2) * 2 * sz, [sx, 1, sz]), { zone, skyVis: INT_AO, cast: false });
  }
  // ── generated parts that still make sense: stone plinth down to the ground, door steps, ceiling or roof lining ──
  const inner = () => { ext.m1 = zone; ext.ao = INT_AO; }, outer = () => { ext.m1 = 0; ext.ao = 1; };
  if (X) outer(), ext.mat(MAT.STONE, [0.92, 0.92, 0.92]), ext.grad = [1, 0.6], ext.box(-w / 2 - 0.07, -1.7, -hd - 0.07, w / 2 + 0.07, 0, hd + 0.07, 4), ext.grad = null;
  if (X) for (const wn in WALLS) for (const o of openings[wn]) if (o.door) {
    ext.push(); m4.mul(ext.m, ext.m, wbs[wn]); ext.dirty = true;
    outer(); ext.mat(MAT.STONE, [0.9, 0.9, 0.9], 0.8); ext.box(o.u0 - 0.35, -0.5, 0, o.u1 + 0.35, -0.02, 0.5); ext.box(o.u0 - 0.2, -0.5, 0.5, o.u1 + 0.2, -0.17, 0.95);
    ext.pop();
  }
  const e = 0.16;          // the kit walls are thinner than the generated ones: reach to their inner face
  if (st.up) c.needUpper = true;           // a second storey: its floor, with the stairwell, is built by the building (upperFloor in 71b_storeys.js)
  if (I && spec.ceiling && !st.up) {
    inner(); ext.mat(MAT.PLANKS, COL.wood); ext.ao = INT_AO * 0.85;
    ext.quad([-w / 2 + e, H, hd - e], [-w / 2 + e, H, -hd + e], [w / 2 - e, H, -hd + e], [w / 2 - e, H, hd - e]);
  } else if (I && !st.up) {
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
  if (I) c.kCol0 = World.colliders.length;
  // lanterns by the doors
  if (X) for (const l of c.kDoorLamps) {
    if (site.infill && typeof INFS !== 'undefined' && INFS.mats) {          // a small generated bracket lantern instead of the 2800-triangle kit lantern
      const [lf, lg] = INFS.lan || (INFS.lan = AL.lan || (AL.lan = genBracketLantern())), q = KH.xf(l.F, l.u, 2.15, 0.1, 1, 0), p0 = new THREE.Vector3(0, -0.1, 0.42).applyMatrix4(q), p = [p0.x, p0.y, p0.z];
      b.add(lf, q, EXT); b.add(lg, q, { zone: 0, skyVis: 1, cast: false, glow: 2.2 }); World.emitters.push({ type: 'lantern', p, zone: 0 }); addLight(p, 9, [3.4, 1.9, 0.75], 0, 'lantern'); continue;
    }
    add(l.F, 'Lantern_Wall', l.u, l.v, 0.03, 0.8, { zone: 0, skyVis: 1, lit: 1 });
    const lp = Kit.lights('Lantern_Wall')[0] || [0, 0.53, 0.76], v = new THREE.Vector3(lp[0] * 0.8, lp[1] * 0.8, lp[2] * 0.8).applyMatrix4(KH.xf(l.F, l.u, l.v, 0.03)), p = [v.x, v.y, v.z];
    World.emitters.push({ type: 'lantern', p, zone: 0 }); addLight(p, 9, [3.4, 1.9, 0.75], 0, 'lantern');
  }
  outer(); ext.grad = null;
}
// a kit chimney above a hearth at house-local (lx, lz), rising clear of the ridge
function kitChimney(c, lx, lz) {
  lx = clamp(lx, -c.w / 2 + 0.6, c.w / 2 - 0.6); lz = clamp(lz, -c.hd * 0.3, c.hd * 0.3);          // inside the footprint, near the ridge
  const SSc = (typeof shellStyle === 'function' && shellStyle(c.xsite, null)) || {};      // [fx2] each stack its own size and height
  const top = infChimney(c.kb, c.kMX, { x: lx, z: lz, top: c.kYtop, tanP: c.tanP, hs: c.hd, ridgeX: true, zc: 0, lift: 0.14, size: SSc.chimSize, up: SSc.chimUp });
  World.emitters.push({ type: 'smoke', p: m4.tp(c.Mx, [lx, top + 0.2, lz]), zone: 0 });
}

// ── furnishing: Props.* calls land here while kits are loaded and are answered with kit pieces at the same spot ──
const KITP = { rnd: rng(4242), lc: {} };
// only the first few small flames in a room cast light: the renderer lights a view with its eight strongest lights, and hearths must stay among them
const kitLightOk = (zone, cap) => { const n = KITP.lc[zone] = (KITP.lc[zone] || 0) + 1; return n <= cap; };
function kitIntBatch(zone) {
  let k = World.kitInt[zone];
  if (!k) { const zi = World.zones[zone - 1]; k = World.kitInt[zone] = { batch: Kit.batch({ name: 'kitint-' + (zi ? zi.site.id : zone), cell: 4096 }), site: zi ? zi.site : null, cell: zi ? zi.cell : null }; }
  return k.batch;
}
// ── scanned stand-ins ──
// A painted kit piece is answered with a photo-scanned model of the same kind when the scan pack is loaded. The scan is fitted to the box the painted
// piece would have filled (so colliders, seats and wall spacing still hold) and stands on the same floor line. Per entry: n = scanned model(s),
// fit = 'box' (stretch to the box, within lo..hi), 'contain' (uniform, as big as fits), 'xz' (uniform on the footprint, height within 25%),
// one = outdoors only the first model is used (fewer materials, fewer draw calls), k = extra per-axis factor, mul = extra scale, y = lift in metres, ry = turn in radians (a quarter turn swaps the footprint), tint = colour factor, skip = draw nothing.
const SCANR = {
  Table_Large: { n: ['wooden_table_02'], fit: 'row', tint: [0.34, 0.42, 0.42] },
  Bench: { n: ['woodentable_01'], fit: 'row', tint: [0.6, 0.43, 0.31] },
  Stool: { n: ['painted_wooden_stool'], fit: 'contain', tint: [0.3, 0.23, 0.17] },
  Chair_1: { n: ['painted_wooden_chair_01'], fit: 'contain', tint: [0.27, 0.2, 0.14] },
  Bed_Twin1: { n: ['gothicbed_01'], fit: 'xz' }, Bed_Twin2: { n: ['gothicbed_01'], fit: 'xz' },
  Chest_Wood__Base: { n: ['treasure_chest'], fit: 'box', lo: 0.8, hi: 1.3, box: [1, 1.2, 1] }, Chest_Wood__Lid: { skip: true },
  Barrel: { n: ['wine_barrel_01'], fit: 'xz', one: 1, inOnly: 1 },          // [fx2] the second scan has doubled coplanar staves inside it (9000 audit pairs): one model
  Vase_2: { n: ['ceramic_vase_02', 'ceramic_pot'], fit: 'contain', one: 1 }, Vase_4: { n: ['ceramic_vase_04'], fit: 'contain' },
  Table_Plate: { n: ['carved_wooden_plate'], fit: 'contain' },
  Candle_1: { n: ['wooden_candlestick'], fit: 'contain', mul: 1.25 }, Candle_2: { n: ['wooden_candlestick'], fit: 'contain' },
  CandleStick_Triple: { n: ['brass_candleholders_c'], fit: 'contain', mul: 0.75 },
  Bucket_Wooden_1: { n: ['wooden_bucket_01', 'wooden_bucket_02'], fit: 'contain', mul: 1.1, one: 1 },
  Bookcase_2: { n: ['wooden_bookshelf_worn'], fit: 'box', lo: 0.7, hi: 1.3 }, Cabinet: { n: ['painted_wooden_cabinet'], fit: 'box', lo: 0.7, hi: 1.3, tint: [0.5, 0.4, 0.31] },
  Nightstand_Shelf: { n: ['painted_wooden_shelves'], fit: 'box', lo: 0.7, hi: 1.4, tint: [0.4, 0.28, 0.19] },
  Workbench: { n: ['painted_wooden_table'], fit: 'box', lo: 0.7, hi: 1.3, tint: [1, 0.52, 0.3] },
  Pickaxe_Bronze: { n: ['picke_dirty_01'], fit: 'contain' }, Axe_Bronze: { n: ['wooden_axe_03'], fit: 'contain', ry: PI / 2 },
};
const SCAN_FLAT = { wooden_axe_03: 1, rusted_spade_01: 1, kite_shield: 1, cross_pein_hammer: 1, picke_dirty_01: 1 };
// top of a crate of nominal size s (things stacked on crates are placed with this)
const crateTop = s => s;       // crates stay the painted kit piece (the scanned crate is a flat box): its top is at the nominal size
const scanOn = () => kitReady() && !!Kit.pieces.wine_barrel_01 && !(TEST && TEST.scan === 0);
const _sm = new THREE.Matrix4(), _sv = new THREE.Vector3(), _sq = new THREE.Quaternion(), _su = new THREE.Vector3(0, 1, 0);
// where a painted piece placed at (x, y, z) with scale s and turn ry ends up: { name, M, tint }, the scan stand-in if there is one
function kplace(m, name, x, y, z, s, ry) {
  const base = new THREE.Matrix4().fromArray(m.m), E = scanOn() ? SCANR[name] : null, P = Kit.pieces[name];
  if (!E || !P) { if (scanOn() && SCAN_FLAT[name]) { const q = Kit.pieces[name]; if (q) return { name, M: KH.xf(base, x, y + (q.max[1] - q.min[1]) * 0.5 * (typeof s === 'number' ? s : s[1]), z, s, ry) }; } return { name, M: KH.xf(base, x, y, z, s, ry) }; }
  if (E.skip) return null;
  if (E.inOnly && !(m.m1 | 0)) return { name, M: KH.xf(base, x, y, z, s, ry) };       // [fx1] a scanned barrel is 1957 triangles: out in the street the painted kit barrel (654) does
  const sv = s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s, W = [P.max[0] - P.min[0], P.max[1] - P.min[1], P.max[2] - P.min[2]];
  const tw = Math.abs(W[0] * sv[0]) * (E.box ? E.box[0] : 1), th = Math.abs(W[1] * sv[1]) * (E.box ? E.box[1] : 1), td = Math.abs(W[2] * sv[2]) * (E.box ? E.box[2] : 1);
  const tcx = (P.min[0] + P.max[0]) / 2 * sv[0], tcz = (P.min[2] + P.max[2]) / 2 * sv[2], tby = P.min[1] * sv[1];
  const sn = E.n[E.n.length > 1 && !(E.one && !(m.m1 | 0)) ? Math.floor(KITP.rnd() * E.n.length) : 0], Q = Kit.pieces[sn]; if (!Q) return { name, M: KH.xf(base, x, y, z, s, ry) };
  const quarter = Math.abs(Math.sin(E.ry || 0)) > 0.9, sw = quarter ? Q.max[2] - Q.min[2] : Q.max[0] - Q.min[0], sh = Q.max[1] - Q.min[1], sd = quarter ? Q.max[0] - Q.min[0] : Q.max[2] - Q.min[2];
  const mul = E.mul || 1, k = E.k || [1, 1, 1]; let f, more = null;
  if (E.fit === 'row') {       // long pieces (tables, benches) as a row of uniformly scaled short ones: no stretched grain
    const u0 = th / sh, n = Math.max(1, Math.round(tw / (sw * u0))), sx = tw / n / sw, sz = Math.min(u0 * 1.3, Math.max(u0 * 0.8, td / sd)); f = [sx, u0, sz];
    const L0 = KH.xf(base, x, y, z, 1, ry), loc0 = new THREE.Matrix4().makeTranslation(-(Q.min[0] + Q.max[0]) / 2, -Q.min[1], -(Q.min[2] + Q.max[2]) / 2), res = [];
    for (let i = 0; i < n; i++) { _sm.compose(_sv.set(tcx + (i - (n - 1) / 2) * tw / n, tby, tcz), _sq.identity(), new THREE.Vector3(f[0], f[1], f[2])); res.push({ name: sn, M: new THREE.Matrix4().multiplyMatrices(L0, _sm).multiply(loc0), tint: E.tint }); }
    res[0].more = res.slice(1); return res[0];
  }
  if (E.fit === 'box') { const lo = E.lo || 0.5, hi = E.hi || 2.2, c = v => Math.min(hi, Math.max(lo, v)); f = [c(tw / sw), c(th / sh), c(td / sd)]; }
  else if (E.fit === 'xz') { const u = Math.min(tw / sw, td / sd); f = [u, Math.min(u * 1.25, Math.max(u * 0.8, th / sh)), u]; }
  else { const u = Math.min(tw / sw, th / sh, td / sd); f = [u, u, u]; }
  f = [f[0] * mul * k[0], f[1] * mul * k[1], f[2] * mul * k[2]];
  const L = KH.xf(base, x, y, z, 1, ry);
  const cx = (Q.min[0] + Q.max[0]) / 2, cz = (Q.min[2] + Q.max[2]) / 2;
  _sm.compose(_sv.set(tcx, tby + (E.y || 0), tcz), _sq.setFromAxisAngle(_su, E.ry || 0), new THREE.Vector3(f[0], f[1], f[2]));
  const loc = new THREE.Matrix4().makeTranslation(-cx, -Q.min[1], -cz);
  return { name: sn, M: new THREE.Matrix4().multiplyMatrices(L, _sm).multiply(loc), tint: E.tint };
}
// outdoor props too small to leave a shadow worth a draw call in the sun-shadow maps stay out of them (and so out of a second mesh per material)
const YARD_CELL = 40;        // m: yard props are merged into one mesh per material per cell
const YARD_CAST_MIN = 0.6;        // m: the largest side a yard prop needs to cast. 0 = every prop casts
function yardCasts(P) { if (!(YARD_CAST_MIN > 0)) return true; const b = Kit.box(P.name, P.M); return !b || Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) >= YARD_CAST_MIN; }
function kadd(m, P, extra) {
  if (typeof P_REC !== 'undefined' && P_REC) { P_REC.parts.push({ name: P.name, M: P.M.clone() }); if (P_REC.defer) { P_REC.pend.push([m, P, extra]); return; } }          // [fx2] 72d_plan.js pPut: pieces are measured before they are committed
  kaddNow(m, P, extra);
}
const KIT_CAP = { ceramic_vase_04: 12, ceramic_vase_02: 8, ceramic_pot: 6, wooden_bowl_01: 8, wooden_candlestick: 8 };
function kaddNow(m, P, extra) {
  const zone = m.m1 | 0;
  if (zone) { const ck = zone + '|' + P.name, cap = KIT_CAP[P.name]; KITP.sc = KITP.sc || {}; if (cap && (KITP.sc[ck] = (KITP.sc[ck] || 0) + 1) > cap) return; }          // [fx2] a few hundred tiny, 600-triangle pots on shelves nobody reads: a room keeps at most a handful of each
  let B; if (zone) B = extra && extra.fine ? furnFineBatch(zone) : kitIntBatch(zone); else { if (!World.kitYard) World.kitYard = Kit.batch({ name: 'kit-yard', cell: YARD_CELL }); B = World.kitYard; }
  const o = Object.assign({ zone, skyVis: zone ? INT_AO : 1, cast: !zone && yardCasts(P) }, extra || {}); if (P.tint && !o.tint) o.tint = P.tint;
  B.add(P.name, P.M, o); if (zone && !o.noBlob) furnBlob(zone, P);
}
// place a kit piece relative to the mesh's current transform (the same frame the generated prop would be drawn in)
const SCAN_TINT = { painted_wooden_table: [1, 0.52, 0.3], painted_wooden_cabinet: [0.5, 0.4, 0.31], painted_wooden_shelves: [0.58, 0.48, 0.38], painted_wooden_stool: [0.3, 0.23, 0.17], painted_wooden_chair_01: [0.27, 0.2, 0.14] };          // [fx2] the painted scans come out blue and white: weathered oak and dull plaster tones
function kp(m, name, x, y, z, s, ry, extra) { const P = kplace(m, name, x, y, z, s, ry); if (P && !P.tint && SCAN_TINT[P.name]) P.tint = SCAN_TINT[P.name]; if (P) { kadd(m, P, extra); if (P.more) for (const Q of P.more) kadd(m, Q, extra); } }
// a light-source piece: the piece itself with glowing wax, one flame per candle tip, one point light for the whole piece
function kitLit(m, name, x, y, z, s, ry, o) {
  const zone = m.m1 | 0, P = kplace(m, name, x, y, z, s, ry), M = P.M, pts = Kit.lights(P.name), v = new THREE.Vector3(), c = [0, 0, 0];
  kadd(m, P, { lit: 1 });
  for (const p of pts) { v.set(p[0], p[1], p[2]).applyMatrix4(M); c[0] += v.x / pts.length; c[1] += v.y / pts.length; c[2] += v.z / pts.length; World.emitters.push(o.flame === 'torch' ? { type: 'torch', p: [v.x, v.y, v.z], zone, size: o.size } : { type: 'candle', p: [v.x, v.y + 0.02, v.z], zone, always: !!o.always }); }
  if (!pts.length) { v.set(0, 0.2, 0).applyMatrix4(M); c[0] = v.x; c[1] = v.y; c[2] = v.z; }
  if (o.cap === undefined || kitLightOk(zone, o.cap)) addLight([c[0], c[1] + 0.1, c[2]], o.r || 5, o.c || [1.9, 1.15, 0.5], zone, o.kind || 'candle');
}
(function kitPropsInstall() {
  const wrap = (name, fn) => { const orig = Props[name]; Props[name] = function () { return kitReady() ? fn.apply(Props, arguments) : orig.apply(Props, arguments); }; };
  wrap('table', (m, len, wid, h) => {
    h = h || 0.76; kp(m, 'Table_Large', 0, 0, 0, [len / 2.85, h / 0.81, wid / 1.1]); addBoxCollider(m, -len / 2, -wid / 2, len / 2, wid / 2, 0, h);
    if ((m.m1 | 0) && len >= 1.4 && KITP.rnd() < 0.65) kitLit(m, 'CandleStick_Triple', len * 0.18, h, 0.03, 1, KITP.rnd() * 3, { r: 5.0, c: [1.9, 1.15, 0.5], kind: 'candle', flame: 'candle', cap: 3 });
  });
  wrap('bench', (m, len, noCol) => { kp(m, 'Bench', 0, 0, 0, [len / 2.78, 0.46 / 0.52, 0.66]); if (!noCol) addBoxCollider(m, -len / 2, -0.16, len / 2, 0.16, 0, 0.46); });
  wrap('stool', m => kp(m, 'Stool', 0, 0, 0, [0.8, 0.45 / 0.58, 0.8]));
  wrap('chair', m => kp(m, 'Chair_1', 0, 0, 0, [0.85, 0.9, 0.85], KITP.chairRy));
  wrap('bed', (m, w) => { w = w || 1.0; kp(m, KITP.rnd() < 0.5 ? 'Bed_Twin1' : 'Bed_Twin2', 0, 0, 0, [(w + 0.14) / 1.88, 0.74, 2.08 / 2.41], KITP.bedRy); addBoxCollider(m, -w / 2, -1, w / 2, 1, 0, 0.6); });
  wrap('chest', (m, w) => { w = w || 0.85; const s = w / 1.2; kp(m, 'Chest_Wood__Base', 0, 0.01, 0, s, KITP.chestRy); kp(m, 'Chest_Wood__Lid', 0, 0.01, 0, s, KITP.chestRy); addBoxCollider(m, -w / 2, -0.25, w / 2, 0.25, 0, 0.6); });
  wrap('barrel', (m, r, h, noCol) => { r = r || 0.33; h = h || 0.9; kp(m, 'Barrel', 0, 0, 0, [r / 0.35, h / 0.9, r / 0.35], KITP.rnd() * 6); if (!noCol) addCircleCollider(m, 0, 0, r, 0, h); });
  wrap('keg', (m, r, len) => { const s = (2 * r + 0.3) / 1.25; kp(m, 'Barrel_Holder', 0, 0, 0, [len / 1.15, s, s]); });
  wrap('crate', (m, s, noCol) => { s = s || 0.6; const k = s / 0.88; if (m.m1 | 0) kp(m, 'Crate_Wooden', 0, 0.05 * k, 0, k); else kp(m, 'Prop_Crate', 0, 0, 0, s / 1.07); if (!noCol) addBoxCollider(m, -s / 2, -s / 2, s / 2, s / 2, 0, s); });
  wrap('sack', (m, s) => { s = s || 0.3; kp(m, 'Bag', 0, 0, 0, 1.9 * s / 0.8, KITP.rnd() * 6); });
  wrap('pot', (m, s) => { s = s || 0.14; kp(m, KITP.rnd() < 0.5 ? 'Vase_4' : 'Vase_2', 0, 0, 0, 2.1 * s / 0.5); });
  wrap('jug', m => kp(m, 'Vase_4', 0, 0, 0, 0.56));
  wrap('bottle', m => { const r = KITP.rnd(); kp(m, r < 0.6 ? 'Bottle_1' : r < 0.8 ? 'Potion_2' : 'Potion_4', 0, 0, 0, r < 0.6 ? 0.75 : 0.9); });
  wrap('mug', m => kp(m, 'Mug', 0, 0.006, 0, 0.7, KITP.rnd() * 6));
  wrap('plate', m => kp(m, 'Table_Plate', 0, 0.003, 0, 0.75));
  wrap('book', (m, col, w) => kp(m, 'Book_5', 0, 0.026, 0, [0.85, (w || 0.04) / 0.06, 0.85], 0, col ? { tint: [0.55 + col[0] * 0.6, 0.55 + col[1] * 0.6, 0.55 + col[2] * 0.6] } : null));
  wrap('candle', (m, ctx, tall) => {
    const P = kplace(m, tall ? 'Candle_2' : 'Candle_1', 0, 0, 0, 1, 0), lp = Kit.lights(P.name)[0] || [0, tall ? 0.27 : 0.15, 0], v = new THREE.Vector3(lp[0], lp[1], lp[2]).applyMatrix4(P.M);
    kadd(m, P, { lit: 1 });
    World.emitters.push({ type: 'candle', p: [v.x, v.y + 0.02, v.z], zone: ctx.zone, always: !!ctx.always });
    if (ctx.candleLight !== false && kitLightOk(ctx.zone | 0, 2)) addLight([v.x, v.y + 0.1, v.z], 4.6, [1.6, 1.0, 0.44], ctx.zone, 'candle');
  });
  wrap('cauldron', (m, r) => { r = r || 0.24; kp(m, 'Cauldron', 0, 0, 0, 2.1 * r / 0.99); });
  wrap('anvil', m => { kp(m, 'Anvil_Log', 0, 0, 0, 0.78); addCircleCollider(m, 0, 0, 0.32, 0, 0.8); });
  wrap('sword', m => kp(m, 'Sword_Bronze', 0, 0.2, 0, 0.9));
  wrap('shield', m => kp(m, 'Shield_Wooden', 0, 0, 0, 1.08));
  // food, tableware and lamps that exist only as scans: the generated prop stays when the scan pack is not loaded
  const swrap = (name, fn) => { const prev = Props[name]; Props[name] = function () { return scanOn() ? fn.apply(Props, arguments) : prev.apply(Props, arguments); }; };
  let nApple = 0; const apple0 = Props.apple;
  swrap('apple', (m, col) => { if (++nApple % 3) return apple0.call(Props, m, col); kp(m, 'food_apple_01', 0, 0, 0, 0.8, KITP.rnd() * 6); });
  swrap('loaf', m => kp(m, 'hamburger_buns_a', 0, 0, 0, 1.7, KITP.rnd() * 6));
  swrap('bowl', m => kp(m, 'wooden_bowl_01', 0, 0, 0, 0.7, KITP.rnd() * 6));
  const lantern0 = Props.lantern;
  Props.lantern = function (m, ctx, kind) {      // hanging lamp, origin at the hook: scanned indoors only (every outdoor lamp would add two draw calls)
    if (!scanOn() || !ctx.zone) return lantern0.call(Props, m, ctx, kind);
    const name = 'wooden_lantern_01', P = kplace(m, name, 0, 0, 0, 0.8, 0); P.M.multiply(new THREE.Matrix4().makeTranslation(0, -Kit.info(name).size[1], 0));
    kadd(m, P, { lit: 1 });
    const lp = Kit.lights(name)[0] || [0, 0.17, 0], v = new THREE.Vector3(lp[0], lp[1] - Kit.info(name).size[1], lp[2]).applyMatrix4(new THREE.Matrix4().fromArray(m.m).multiply(KH.xf(new THREE.Matrix4(), 0, 0, 0, 0.8, 0))), p = [v.x, v.y, v.z];
    World.emitters.push({ type: 'lantern', p, zone: ctx.zone });
    addLight(p, ctx.zone ? 6.5 : 9, ctx.zone ? [2.3, 1.35, 0.55] : [3.4, 1.9, 0.75], ctx.zone, kind || 'lantern');
  };
})();
KITP.chairRy = PI; KITP.bedRy = 0; KITP.chestRy = PI;       // which way each kit piece faces relative to the generated prop it stands in for

// extra dressing per building, once its own interior has been laid out
// Floor pieces go against free wall, wall pieces hang where no window or tall furniture is in the way.
// footprint along the wall, depth, tall, scale, [light]
const KIT_ITEM = {
  Bookcase_2: [1.46, 0.43, 1, 0.9], Cabinet: [1.36, 0.38, 0, 1], Nightstand_Shelf: [0.7, 0.4, 0, 0.9], Workbench: [2.02, 1.02, 0, 0.95], WeaponStand: [1.39, 0.98, 0, 0.85],
  Dummy: [0.8, 0.6, 0, 0.95], Barrel: [0.7, 0.7, 0, 1], Barrel_Apples: [0.7, 0.7, 0, 1], Crate_Wooden: [0.86, 0.9, 0, 0.8], Bag: [0.66, 0.54, 0, 0.9], Bucket_Wooden_1: [0.43, 0.4, 0, 1],
  Vase_2: [0.69, 0.69, 0, 0.8], FarmCrate_Apple: [0.71, 0.45, 0, 1], FarmCrate_Carrot: [0.71, 0.57, 0, 1], CandleStick_Stand: [0.6, 0.6, 0, 0.95, 1], BookStand: [0.51, 0.51, 0, 1],
  Whetstone: [1.14, 0.9, 0, 0.8], Barrel_Holder: [1.36, 0.74, 0, 0.9],
  // scan-only floor pieces (footprint is the model's own)
  spinning_wheel_01: [0.55, 1.05, 0, 1], wooden_ladder: [0.98, 0.52, 0, 1], treasure_chest: [0.97, 0.54, 0, 1], wicker_basket_02: [0.4, 0.3, 0, 1.2], rock_moss_set_02_g: [0.9, 0.7, 0, 0.7],
};
const KIT_WALL = {            // width, height of the pivot above the floor, stand-off from the wall
  Torch_Metal: [0.5, 1.85, 0.01], Shelf_Simple: [1.2, 1.55, 0.01], Shelf_Arch: [1.25, 1.8, 0.01], Shelf_Small_Bottles: [1.15, 1.5, 0.01], Peg_Rack: [1.2, 1.75, 0.01],
  Shield_Wooden: [0.7, 1.9, 0.01], kite_shield: [0.6, 1.75, 0.04, 0.7], rusted_spade_01: [0.3, 0.95, 0.03, 1], cross_pein_hammer: [0.3, 1.6, 0.03, 1.2], Banner_1_Cloth: [0.85, 2.7, 0.05], Banner_2_Cloth: [0.85, 2.6, 0.05], Axe_Bronze: [0.4, 1.75, 0.04], Pickaxe_Bronze: [0.85, 1.8, 0.08], Sword_Bronze: [0.35, 1.5, 0.04],
};
const KIT_DRESS = {
  inn: { floor: ['CandleStick_Stand', 'Barrel_Holder', 'Cabinet', 'Barrel', 'Crate_Wooden', 'Bag', 'Barrel'], wall: ['Torch_Metal', 'Banner_1_Cloth', 'Shield_Wooden', 'Torch_Metal', 'Banner_1_Cloth', 'Peg_Rack', 'Shelf_Simple', 'Torch_Metal'] },
  smithy: { floor: ['Workbench', 'WeaponStand', 'Barrel', 'Whetstone', 'Crate_Wooden', 'Bucket_Wooden_1'], wall: ['Torch_Metal', 'Peg_Rack', 'Pickaxe_Bronze', 'Axe_Bronze', 'kite_shield', 'Torch_Metal'] },
  store: { floor: ['Cabinet', 'Bookcase_2', 'Crate_Wooden', 'FarmCrate_Apple', 'Barrel', 'FarmCrate_Carrot', 'Bag', 'Vase_2', 'Nightstand_Shelf', 'Barrel_Apples'], wall: ['Shelf_Small_Bottles', 'Torch_Metal', 'Shelf_Simple', 'Shelf_Arch', 'Torch_Metal', 'Peg_Rack'] },
  elder: { floor: ['Bookcase_2', 'BookStand', 'Bookcase_2', 'CandleStick_Stand', 'treasure_chest', 'Cabinet', 'Nightstand_Shelf'], wall: ['Shelf_Arch', 'Torch_Metal', 'Banner_1_Cloth', 'Shelf_Simple'] },
  herbalist: { floor: ['Cabinet', 'Nightstand_Shelf', 'Vase_2', 'Bucket_Wooden_1', 'Bag', 'Crate_Wooden'], wall: ['Shelf_Small_Bottles', 'Torch_Metal', 'Shelf_Simple', 'Shelf_Arch'] },
  guardhouse: { floor: ['WeaponStand', 'Dummy', 'Barrel', 'Crate_Wooden', 'Nightstand_Shelf', 'treasure_chest'], wall: ['kite_shield', 'Torch_Metal', 'Peg_Rack', 'Banner_1_Cloth', 'Sword_Bronze', 'Torch_Metal', 'kite_shield'] },
  weaver: { floor: ['spinning_wheel_01', 'Cabinet', 'wicker_basket_02', 'Nightstand_Shelf', 'Bag', 'Crate_Wooden', 'Vase_2'], wall: ['Shelf_Simple', 'Torch_Metal', 'Banner_1_Cloth', 'Peg_Rack'] },
  mill: { floor: ['Bag', 'Barrel', 'Bag', 'wooden_ladder', 'Crate_Wooden', 'Bag', 'Bucket_Wooden_1', 'Nightstand_Shelf'], wall: ['Torch_Metal', 'Peg_Rack', 'Shelf_Simple'] },
  farm: { floor: ['FarmCrate_Apple', 'Barrel_Apples', 'wooden_ladder', 'FarmCrate_Carrot', 'Bag', 'Cabinet', 'Bucket_Wooden_1', 'wicker_basket_02'], wall: ['Shelf_Simple', 'Torch_Metal', 'rusted_spade_01', 'Peg_Rack'] },
  hunter: { floor: ['Crate_Wooden', 'Barrel', 'Bag', 'WeaponStand', 'treasure_chest'], wall: ['Torch_Metal', 'Peg_Rack', 'Axe_Bronze', 'kite_shield', 'rusted_spade_01'] },
  fisher: { floor: ['Barrel', 'Bucket_Wooden_1', 'wicker_basket_02', 'Crate_Wooden'], wall: ['Torch_Metal', 'Peg_Rack'] },
  draper: { floor: ['spinning_wheel_01', 'Dummy', 'Cabinet', 'wicker_basket_02', 'Bag'], wall: ['Banner_1_Cloth', 'Torch_Metal', 'Banner_2_Cloth', 'Shelf_Simple', 'Torch_Metal'] },
  chapel: { floor: ['CandleStick_Stand', 'CandleStick_Stand', 'BookStand', 'CandleStick_Stand', 'CandleStick_Stand'], wall: ['Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal', 'Banner_1_Cloth', 'Torch_Metal'] },
};
// extra dressing per building, once its own interior has been laid out
function kitDress(c) {
  if (typeof furnishHouse === 'function') furnishHouse(c);
  const { site, w, d, H, hd, zone, spec } = c, id = site.id, st = spec.kitStyle, R = c.kR, dress = KIT_DRESS[id] || {}, e = 0.21, sy = H / 3;
  const X0 = -w / 2 + e, X1 = w / 2 - e, Z0 = -hd + e, Z1 = hd - e, m = { m: c.Ms, m1: zone, ao: INT_AO }, EXT = { zone: 0, skyVis: 1 };
  // is this patch of floor (house-local) taken by something the house has already registered?
  const blocked = (x, z, r) => {
    const p = m4.tp(c.Ms, [x, 0, z]);
    for (let i = c.kCol0; i < World.colliders.length; i++) {
      const k = World.colliders[i]; if (k.y0 > p[1] + 2.2) continue;
      if (k.r !== undefined) { if (hyp(k.x - p[0], k.z - p[2]) < k.r + r) return true; continue; }
      const dx = p[0] - k.x, dz = p[2] - k.z; if (Math.abs(dx * k.ax + dz * k.az) < k.hx + r && Math.abs(dx * k.bx + dz * k.bz) < k.hz + r) return true;
    }
    for (const dd of c.doors) if (hyp(dd.ins[0] - p[0], dd.ins[2] - p[2]) < 1.25 + r) return true;
    for (const k in World.spots) { const s = World.spots[k]; if (s.site === id && Math.abs(s.p[1] - p[1]) < 1.5 && hyp(s.p[0] - p[0], s.p[2] - p[2]) < 0.6 + r) return true; }
    return false;
  };
  const sides = [
    { wn: 'back', len: X1 - X0, at: (u, o) => [X0 + u, Z1 - o], ry: PI, lo: X0 }, { wn: 'left', len: Z1 - Z0, at: (u, o) => [X0 + o, Z0 + u], ry: PI / 2, lo: Z0 },
    { wn: 'right', len: Z1 - Z0, at: (u, o) => [X1 - o, Z0 + u], ry: -PI / 2, lo: Z0 }, { wn: 'front', len: X1 - X0, at: (u, o) => [X0 + u, Z0 + o], ry: 0, lo: X0 }];
  const nearOpening = (sd, u, half, doorsOnly) => c.openings[sd.wn].some(o => (!doorsOnly || o.door) && Math.abs((o.def.pos || 0) - sd.lo - u) < half + (o.door ? 1.0 : 0.75));
  const tall = [];           // [side, u, half] of tall furniture, so nothing is hung behind it
  // ── floor pieces along the walls ──
  const queue = (dress.floor || []).filter(n => Kit.pieces[n]); let guard = 0;
  for (let si = 0; si < 8 && queue.length; si++) {
    const sd = sides[(si + (R() * 4 | 0)) % 4];
    for (let u = 0.5; u < sd.len - 0.5 && queue.length && guard++ < 400; u += 0.3) {
      const name = queue[0], it = KIT_ITEM[name]; if (!it) { queue.shift(); continue; }
      const sc = it[3], wid = it[0] * sc, dep = it[1] * sc, half = wid / 2;
      if (u - half < 0.12 || u + half > sd.len - 0.12 || nearOpening(sd, u, half, !it[2])) continue;
      const p = sd.at(u, dep / 2 + 0.03), pa = sd.at(u - half * 0.7, dep / 2 + 0.03), pb = sd.at(u + half * 0.7, dep / 2 + 0.03), r = Math.min(dep, wid) * 0.5;
      if (blocked(p[0], p[1], r) || blocked(pa[0], pa[1], r) || blocked(pb[0], pb[1], r)) continue;
      const ry = sd.ry + (it[2] || wid > 1 ? 0 : R.s() * 0.5), y = 0.02 + (name === 'Crate_Wooden' ? 0.05 * sc : 0);
      if (it[4]) kitLit(m, name, p[0], y, p[1], sc, ry, { r: 6.5, c: [2.3, 1.4, 0.6], kind: 'candle' }); else kp(m, name, p[0], y, p[1], sc, ry);
      const fm = { m: m4.mul(m4.create(), c.Ms, m4.rotY(m4.translate(m4.create(), p[0], 0, p[1]), -sd.ry)) };
      if (wid > 0.55) addBoxCollider(fm, -half, -dep / 2, half, dep / 2, 0, it[2] ? 2.2 : 0.9);
      if (it[2]) tall.push([sd, u, half]);
      queue.shift(); u += wid + 0.1 + R() * 0.5;
    }
  }
  // ── things on the walls ──
  const hung = []; let torches = 0;
  const wq = (dress.wall || []).concat(id === 'chapel' || id === 'smithy' ? [] : ['Shelf_Simple', 'Peg_Rack']).filter(n => Kit.pieces[n]);
  for (let si = 0; si < 8 && wq.length; si++) {
    const sd = sides[(si + 1 + (R() * 4 | 0)) % 4];
    for (let u = 0.8 + R() * 0.6; u < sd.len - 0.7 && wq.length; u += 0.45) {
      const name = wq[0], it = KIT_WALL[name]; if (!it) { wq.shift(); continue; }
      const half = it[0] / 2, y = Math.min(it[1] * (name.startsWith('Banner') ? sy : 1), H - 0.3);
      if (nearOpening(sd, u, half, false) || tall.some(t => t[0] === sd && Math.abs(t[1] - u) < t[2] + half + 0.1) || hung.some(t => t[0] === sd && Math.abs(t[1] - u) < t[2] + half + 0.5)) continue;
      const p = sd.at(u, it[2]);
      if (blocked(sd.at(u, 0.3)[0], sd.at(u, 0.3)[1], 0.12) && y < 2.4) continue;           // a hearth or stair is in front of this stretch of wall
      if (name === 'Torch_Metal') { kitLit(m, name, p[0], y, p[1], 1, sd.ry, { r: 6.2, c: [2.5, 1.45, 0.55], kind: 'fire', flame: 'torch', size: 0.14 }); torches++; }
      else kp(m, name, p[0], y, p[1], it[3] || 1, sd.ry);
      if (name === 'Shelf_Simple' || name === 'Shelf_Arch') {
        const q = sd.at(u - 0.28, 0.19), q2 = sd.at(u + 0.26, 0.19), pickOn = list => { const l = list.filter(e => Kit.pieces[e[0]]); return l.length ? R.pick(l) : null; };
        const a = pickOn([['SmallBottles_1', 1], ['Book_Stack_1', 1], ['Potion_2', 1], ['ceramic_vase_04', 0.6], ['wooden_bowl_01', 0.8], ['food_pears_asian_01', 1], ['ceramic_pot', 0.5]]);
        const b2 = pickOn([['Book_Stack_2', 0.7], ['Bottle_1', 0.7], ['Vase_4', 0.7], ['brass_goblets', 0.7], ['wooden_candlestick', 0.8], ['carved_wooden_plate', 0.9], ['yellow_onion', 1]]);
        if (a) kp(m, a[0], q[0], y + 0.11, q[1], a[1], sd.ry); if (b2) kp(m, b2[0], q2[0], y + 0.11, q2[1], b2[1], sd.ry + 0.4);
      }
      hung.push([sd, u, half]); wq.shift(); u += it[0] + 1.2 + R() * 1.2;
    }
  }
  if (id === 'chapel') for (const x of [-w * 0.2, w * 0.2]) kitLit(m, 'Chandelier', x, H + 0.9, 0, 1.1, 0, { r: 10, c: [3.0, 1.9, 0.85], kind: 'candle', always: true });
  // ── density: hearth rug, firewood, mantel candles and antlers, paintings and herb racks on the free walls ──
  if (id !== 'chapel') {
    const hr = c.hearth, mm = c.int, Z1h = hd - 0.3;
    if (hr && Math.abs(hr.rot) < 0.01) {
      at(mm, hr.x, 0.02, hr.z, 0, () => at(mm, hr.dep + 0.8, 0, 0, 0, () => Props.rug(mm, 1.2, hr.wid + 0.6, id === 'smithy' ? [0.3, 0.26, 0.22] : [0.5, 0.32, 0.2])));
      for (const sg of [1, -1]) { const zz = hr.z + sg * (hr.wid / 2 + 0.55), xx = hr.x + 0.4; if (Math.abs(zz) < Z1h - 0.3 && !blocked(xx, zz, 0.5)) { at(mm, xx, 0.02, zz, 0, () => Props.woodpile(mm, 4, 4, 0.5)); break; } }
      if (id !== 'smithy') {
        for (const sg of [-1, 1]) kitLit(m, 'CandleStick_Triple', hr.x + 0.42, 1.6, hr.z + sg * (hr.wid / 2 - 0.32), 0.8, sg, { cap: 0, kind: 'candle', flame: 'candle' });
        kp(m, 'Vase_4', hr.x + 0.42, 1.6, hr.z, 0.8, 0.4); kp(m, 'Mug', hr.x + 0.3, 1.6, hr.z + 0.3, 0.9, 1);
        if (id !== 'hunter') at(mm, hr.x + 0.68, id === 'inn' ? 2.85 : 2.1, hr.z, PI / 2, () => antlers(mm));
      }
    }
    // paintings and herb racks where the walls are still bare
    let want = Math.max(2, Math.round(w * d / 11)), n = 0;
    for (let si = 0; si < 8 && want > 0; si++) {
      const sd = sides[(si + 2 + (R() * 4 | 0)) % 4];
      for (let u = 1.0 + R() * 0.8; u < sd.len - 0.8 && want > 0; u += 0.7) {
        if (nearOpening(sd, u, 0.5, false) || tall.some(t => t[0] === sd && Math.abs(t[1] - u) < t[2] + 0.6) || hung.some(t => t[0] === sd && Math.abs(t[1] - u) < t[2] + 0.9)) continue;
        const q = sd.at(u, 0.3); if (blocked(q[0], q[1], 0.12)) continue;
        const p = sd.at(u, 0.03), rack = id !== 'smithy' && n % 3 === 2;
        if (id === 'smithy' && n % 2) { n++; continue; }
        if (rack) kp(m, kitGen('rack', R), p[0], 2.05, p[1], 1, sd.ry); else kp(m, kitGen('paint', R), p[0], 1.6 + R() * 0.3, p[1], 1, sd.ry);
        hung.push([sd, u, 0.5]); n++; want--; u += 0.6 + R() * 0.8;
      }
    }
    if (id === 'inn') {
      at(mm, 4.9, 1.6, Z1h - 0.17, 0, () => Props.shelf(mm, 3.0, 1.2, 3, 0.3, (i, y) => Props.clutter(mm, R, -1.3, 1.3, y, 0, ['bottle', 'bottle', 'mug', 'jug', 'bottle'], 6)));
      at(mm, 4.8, 2.5, 1.2, 0, () => Props.lantern(mm, c));
      at(mm, 4.4, 0.02, -1.0, 0.1, () => Props.rug(mm, 2.4, 1.6, [0.35, 0.34, 0.22]));
      at(mm, -1.0, 0.02, 3.3, 0.2, () => Props.rug(mm, 1.3, 0.9, [0.4, 0.22, 0.16]));
      for (const x of [-6.0, -6.6]) kp(m, 'Barrel', x, 0.02, 4.3, 0.9, R() * 6);       // (the back wall between x = -2 and 2.4 is the stair)
    }
  }
  // ── outside: vines up the walls, a banner by the door ──
  for (let i = 0; i < Math.ceil((st.vines || 0) / 2); i++) {      // [fx2] half as many wall vines (FINISH I-vines), on the shaded back and side walls only
    const wn = R.pick(['back', 'left', 'back', 'right']), L = WALLS[wn].len(w, d), u = 0.9 + R() * (L - 1.8), up = !!st.up && R() < 0.6;
    if (!up && c.openings[wn].some(o => Math.abs((o.u0 + o.u1) / 2 - u) < 1.5)) continue;
    if (up && st.balcony === wn && Math.abs(u - L / 2) < 2.6) continue;
    c.kb.add(R.pick(['Prop_Vine1', 'Prop_Vine2', 'Prop_Vine1', 'Prop_Vine4']), KH.xf(c.kFrames[wn], u, up ? H + 2.45 : H * 0.84, 0.1, [1.2, up ? 1.2 : Math.min(1.2, H * 0.84 / 2.2), 1]), EXT);
  }
  if (st.dormers) for (const x of st.dormers) { const z = -hd * 0.5, y = c.kYtop + hd * 0.5 * c.tanP - 0.35; c.kb.add('Roof_Dormer_RoundTile', KH.xf(c.kMS, x, y, z, 1.25, PI), { zone: 0, skyVis: 1 }); }
  if (st.banner) { const dw = spec.doors[0].wall, o = c.openings[dw].find(q => q.door), L = WALLS[dw].len(w, d); if (o) for (const sg of [-1, 1]) { const u = (o.u0 + o.u1) / 2 + sg * 2.3; if (u > 0.6 && u < L - 0.6) c.kb.add(sg < 0 ? 'Banner_1' : 'Banner_2', KH.xf(c.kFrames[dw], u, Math.min(3.1 * sy, H + 0.5), 0.12, 1, -PI / 2), EXT); } }
}

// ── scanned ground dressing: rocks, stumps, a trunk, ferns and weeds beside the houses and around the lake shore (instanced, a few hundred in all) ──
function kitScatter() {
  if (!scanOn() || (TEST && TEST.scatter === 0)) return null;
  const R = rng(9091), gy = (x, z) => (Math.abs(x) < 143 && Math.abs(z) < 143) ? Terrain.y(x, z) : terrainH(x, z), B = Kit.batch({ name: 'scan-scatter' });
  const lists = {}, add = (key, name, x, z, s, sink, ry) => { const y = gy(x, z); (lists[key] = lists[key] || {})[name] = lists[key][name] || []; lists[key][name].push(Kit.matrix({ p: [x, y - sink * s, z], ry: ry === undefined ? R() * TAU : ry, s })); return y; };
  const clear = (x, z, pad) => {
    for (const s of SITES) { const l = worldToSite(s, x, z); if (Math.abs(l[0]) < s.w / 2 + pad + (s.porch || 0) + 0.5 && Math.abs(l[1]) < s.d / 2 + pad + 0.5) return false; }
    for (const r of Roads) if (r.line.dist(x, z, r.w / 2 + pad) < r.w / 2 + pad) return false;
    for (const f of FIELDS) if (x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad) return false;
    if (River.dist(x, z, 7 + pad) < 6.5 + pad) return false;
    if (hyp((x - SQUARE.x) / (SQUARE.rx + 1), (z - SQUARE.z) / (SQUARE.rz + 1)) < 1 || placeW(x, z, 2.5) > 0) return false;      /* [fx3] no fern or weed clumps on the cobbled place or at its edge */
    const dk = World.spots['dock.end']; if (dk && hyp(x - dk.p[0], z - dk.p[2]) < 7) return false;
    for (const c of World.colliders) { if (c.r !== undefined ? hyp(x - c.x, z - c.z) < c.r + pad : (Math.abs(x - c.x) < c.hx + pad + 0.3 && Math.abs(z - c.z) < c.hz + pad + 0.3)) return false; }
    return true;
  };
  const rocks = ['rock_moss_set_02_g', 'rock_moss_set_02_c', 'rock_moss_set_02_a', 'rock_moss_set_01_e'], rockSize = n => Math.max(...Kit.info(n).size);
  const rock = (key, x, z, k) => {       // k: 0 pebble .. 1 boulder
    const n = R.pick(key === 'h' ? rocks.slice(0, 2) : rocks), s = (0.12 + 0.5 * k * k) * (1 + R() * 0.5) / Math.max(0.5, rockSize(n)) * 2.2;
    add(key, n, x, z, s, 0.08 * Kit.info(n).size[1], undefined);
    if (rockSize(n) * s > 0.9 && hyp(x, z) < WORLD_RADIUS + 5) World.colliders.push({ x, z, r: rockSize(n) * s * 0.36, y0: gy(x, z) - 1, y1: gy(x, z) + 0.8 });
  };
  // beside the houses: a few at the foot of the walls, away from the doors
  for (const s of SITES) {
    if (!HOUSES[s.id] || s.id === 'barn' || s.infill) continue;
    const dl = siteDoorLocal(s, 0); let n = 0;
    for (let t = 0; t < 40 && n < 7; t++) {
      const side = R.i(0, 3), u = R.s() * 0.5, off = 0.9 + R() * 1.6;
      const [lx, lz] = side === 0 ? [u * s.w, -s.d / 2 - off] : side === 1 ? [u * s.w, s.d / 2 + off] : side === 2 ? [-s.w / 2 - off, u * s.d] : [s.w / 2 + off, u * s.d];
      if (hyp(lx - dl[0], lz - dl[1]) < 3.2) continue;
      const p = siteToWorld(s, lx, lz); if (!clear(p[0], p[1], 0.5) || Math.abs(gy(p[0], p[1]) - s.y) > 0.5) continue;
      const r = R();
      if (r < 0.34) add('h', 'fern_02_a', p[0], p[1], 0.5 + R() * 0.4, 0.04); else if (r < 0.58) add('h', 'weed_plant_02_a', p[0], p[1], 1.2 + R() * 0.8, 0.02);
      else rock('h', p[0], p[1], R() * 0.6);
      n++;
    }
  }
  // the lake shore: reeds of weeds and fern at the water's edge, rocks half in the shallows, a fallen trunk or two, stumps
  const LK = 'l';
  for (let i = 0, n = 0; i < 400 && n < 78; i++) {
    const a = R() * TAU, r0 = lakeR(LAKE.x + Math.cos(a) * LAKE.r, LAKE.z + Math.sin(a) * LAKE.r), off = -0.8 + Math.pow(R(), 1.3) * 7;
    const x = LAKE.x + Math.cos(a) * (r0 + off), z = LAKE.z + Math.sin(a) * (r0 + off), y = gy(x, z);
    if (y < LAKE.y - 0.35 || y > LAKE.y + 3 || !clear(x, z, 0.4)) continue;
    const q = R();
    if (off < 1.5 && q < 0.5) rock(LK, x, z, 0.2 + R() * 0.8); else if (q < 0.55) add(LK, 'fern_02_a', x, z, 0.55 + R() * 0.5, 0.04); else if (q < 0.8) add(LK, 'weed_plant_02_a', x, z, 1.3 + R() * 0.9, 0.02);
    else if (q < 0.9) rock(LK, x, z, R() * 0.5); else if (q < 0.95) add(LK, 'dead_tree_trunk', x, z, 0.8 + R() * 0.4, 0.05, a + PI / 2 + R.s() * 0.6); else add(LK, 'tree_stump_01', x, z, 0.4 + R() * 0.25, 0.06);
    n++;
  }
  for (const key in lists) for (const name in lists[key]) B.addInstanced(name, lists[key][name], { cell: key === 'h' ? 80 : 60, maxDist: key === 'h' ? 70 : 80, cast: false });
  return B;
}

// ── scene: build the batches once the scene exists, hide interiors that are far away ──
function kitAttach() {
  if (!kitReady() || !SC.scene) return;
  const addG = (g, info) => { g.traverse(o => { if (o.isMesh && info.interior) { o.layers.set(1); o.castShadow = false; } }); SC.scene.add(g); World.kitGroups.push(Object.assign({ g }, info)); };
  // The modelled houses do not draw into the sun-shadow maps: tiled roofs and window frames would triple their cost. One plain
  // box-and-prism stand-in per house casts the shadow instead, all in a single mesh the camera does not see (it writes nothing).
  const tri = [], V = (M, x, y, z) => { const p = m4.tp(M, [x, y, z]); tri.push(p[0], p[1], p[2]); }, Q = (M, a, b2, c2, d2) => { for (const q of [a, b2, c2, a, c2, d2]) V(M, q[0], q[1], q[2]); };
  for (const id in World.kitExt) {
    let k = World.kitExt[id]; if (!k.batch.count && !k.shared) continue;
    if (!k.shared) { const g = k.batch.build(); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); addG(g, { site: k.site, ext: true }); }
    const M = k.Ms, x = k.w / 2 + 0.3, xw = k.w / 2 - 0.12, z = k.hd + 0.4, y = k.top, r = y + k.rise + 0.4 * k.rise / k.hd - 0.25; k = Object.assign({}, k, { hd: k.hd - 0.12 });
    Q(M, [-xw, -1, -k.hd], [xw, -1, -k.hd], [xw, y, -k.hd], [-xw, y, -k.hd]); Q(M, [-xw, -1, k.hd], [xw, -1, k.hd], [xw, y, k.hd], [-xw, y, k.hd]);
    Q(M, [-xw, -1, -k.hd], [-xw, -1, k.hd], [-xw, y, k.hd], [-xw, y, -k.hd]); Q(M, [xw, -1, -k.hd], [xw, -1, k.hd], [xw, y, k.hd], [xw, y, -k.hd]);
    Q(M, [-x, y - 0.55, -z], [x, y - 0.55, -z], [x, r, 0], [-x, r, 0]); Q(M, [-x, y - 0.55, z], [x, y - 0.55, z], [x, r, 0], [-x, r, 0]);
    for (const sx of [-xw, xw]) { V(M, sx, y - 0.2, -k.hd); V(M, sx, y - 0.2, k.hd); V(M, sx, r - 0.2, 0); }
  }
  if (AL.batch && AL.batch.count) {
    const g = AL.batch.build(); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); addG(g, { alley: true });
    if (AL.batch2.count) { const g2 = AL.batch2.build(); g2.traverse(o => { if (o.isMesh) o.castShadow = false; }); addG(g2, { alley: true, dress: true }); }
    for (const p of AL.proxies) { const M = p.Ms, xw = p.w / 2 - 0.1, x = p.w / 2 + 0.3, z0 = -p.d / 2 - 0.55, z1 = p.d / 2 - 0.1, y = p.top, r = y + p.rise;
      Q(M, [-xw, -1, z0], [xw, -1, z0], [xw, y, z0], [-xw, y, z0]); Q(M, [xw, -1, z1], [-xw, -1, z1], [-xw, y, z1], [xw, y, z1]); Q(M, [-xw, -1, z1], [-xw, -1, z0], [-xw, y, z0], [-xw, y, z1]); Q(M, [xw, -1, z0], [xw, -1, z1], [xw, y, z1], [xw, y, z0]);
      if (p.rx) { const zc = (z0 + z1) / 2 + (p.zc || 0) * 0 - 0.25, xe = p.w / 2 + 0.05; Q(M, [-xe, y - 0.25, z0 - 0.3], [xe, y - 0.25, z0 - 0.3], [xe, r, zc], [-xe, r, zc]); Q(M, [xe, y - 0.25, z1 + 0.3], [-xe, y - 0.25, z1 + 0.3], [-xe, r, zc], [xe, r, zc]); for (const sx of [-xe, xe]) { V(M, sx, y - 0.2, z0); V(M, sx, y - 0.2, z1); V(M, sx, r - 0.2, zc); } continue; }
      Q(M, [-x, y - 0.25, z0 - 0.3], [-x, y - 0.25, z1 + 0.3], [0, r, z1 + 0.3], [0, r, z0 - 0.3]); Q(M, [x, y - 0.25, z1 + 0.3], [x, y - 0.25, z0 - 0.3], [0, r, z0 - 0.3], [0, r, z1 + 0.3]); V(M, -xw, y, z0); V(M, xw, y, z0); V(M, 0, r, z0); V(M, xw, y, z1); V(M, -xw, y, z1); V(M, 0, r, z1); }
  }
  if (tri.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tri), 3));
    const mat = new THREE.MeshBasicNodeMaterial(); mat.side = THREE.DoubleSide; mat.colorWrite = false; mat.depthWrite = false; mat.depthTest = false; mat.fog = false;
    const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = -5; mesh.name = 'kit-shadow-proxy'; SC.scene.add(mesh);
  }
  try { const sb = kitScatter(); if (sb) addG(sb.build(), { scatter: true }); } catch (e) { console.warn('scan scatter skipped: ' + (e && e.message || e)); }
  for (const z in World.kitInt) { const k = World.kitInt[z]; if (k.batch.count) { const g = k.batch.build(); furnBlobs(+z, g); addG(g, { site: k.site, interior: true, cell: k.cell }); } }
  for (const z in World.kitFine) { const k = World.kitFine[z]; if (k.batch.count) addG(k.batch.build(), { site: k.site, interior: true, fine: true, cell: k.cell }); }
  if (World.kitYard && World.kitYard.count) { const g = World.kitYard.build(); g.traverse(o => { if (o.isMesh) o.layers.set(1); }); addG(g, { yard: true }); }
  const inner = sceneUpdate;
  sceneUpdate = function (camPos, q) {
    inner(camPos, q);
    // furniture only shows through an open door or a window, so it is drawn for the nearest buildings alone
    const cur = World.cell;
    for (const k of World.kitGroups) {
      if (cur || k.cell) { k.g.visible = !!cur && k.cell === cur.id && !(k.fine && q.name === 'Low'); continue; }        // in a cell: that cell's groups only; outside: no cell's
      if (k.interior && k.site) k.g.visible = interiorShown(k.site, camPos) && !(k.fine && q.name === 'Low');
      else if (k.ext && World.deepIn) k.g.visible = hyp(k.site.x - camPos[0], k.site.z - camPos[2]) < DRAW.indoor + Math.max(k.site.w, k.site.d) * 0.5;
      else if (k.scatter) k.g.visible = q.scatter && !World.deepIn;
      else if (k.yard) for (const o of k.g.children) { const bs = o.geometry && o.geometry.boundingSphere; if (bs) { o.visible = !World.deepIn && hyp(bs.center.x - camPos[0], bs.center.z - camPos[2]) < q.yardRange + bs.radius; if (o.userData.cast0 === undefined) o.userData.cast0 = o.castShadow; o.castShadow = q.yardCast && o.userData.cast0; } }
      else if (k.alley) { const cx = camPos[0], cz = camPos[2], d = hyp(Math.max(0, ALLEY.x0 - cx, cx - ALLEY.x1), Math.max(0, Math.abs(cz - 1.5) - 10)); k.g.visible = d < (World.deepIn ? 9 : q.yardRange * 1.6 + 8) && (!k.dress || q.scatter || d < 28); }
      else k.g.visible = true;
    }
    if (Kit.update && !cur) Kit.update(camPos);
  };
}
