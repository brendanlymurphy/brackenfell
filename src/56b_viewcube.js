// ───────────────────────── what the windows show from inside: the town itself ─────────────────────────
// [view] The owner: "windows look nothing like what outside actually looks like" (a painted skyline with yellow squares). Now: on the way into a house,
// during the fade, the town is drawn once from where that house really stands into a small cube map (six faces of 256 px), and every pane seen from the room
// side shows that map along the line of sight, turned from the room's frame into the house's own (its site's yaw). It is drawn again when the hour of the
// day changes while the player is still indoors. Nothing is drawn per frame: a pane costs one cube-map read in place of the three noise reads of the painted
// skyline. Memory: 6 x 256 x 256 half-float texels, 3 MB. There is no parallax (the map is taken from one point, 1.7 m above the house's floor at its middle):
// right for what is across the street, a little off for a barrel under the sill. ?viewcube=0 or --opt viewcube=0 gives the painted skyline back.
const ViewCube = { rt: null, cam: null, blank: null, nodes: [], cell: null, hour: -1, busy: false, shots: 0, size: 256, off: (typeof TEST !== 'undefined' && TEST && TEST.viewcube === 0) || (typeof location !== 'undefined' && /[?&]viewcube=0/.test(location.search)) };
ViewCube.target = function () { if (!ViewCube.rt) { ViewCube.rt = new THREE.CubeRenderTarget(ViewCube.size, { type: THREE.HalfFloatType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); ViewCube.cam = new THREE.CubeCamera(0.5, 12000, ViewCube.rt);       /* far enough for the sky's dome */ ViewCube.blank = new THREE.CubeRenderTarget(4, { generateMipmaps: false }); ViewCube.drt = new THREE.CubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); ViewCube.dcam = new THREE.CubeCamera(0.3, 12000, ViewCube.drt); } return ViewCube.rt; };
ViewCube.dbase = function () { if (!ViewCube.dnode) ViewCube.dnode = TSL.cubeTexture((ViewCube.target(), ViewCube.drt).texture); return ViewCube.dnode; };
// the room's frame against the world's: where the house's local x and z point out of doors (cells are laid out unturned, far from the town)
// one texture node for every pane (each samples it along its own line of sight), so that the map can be swapped for a blank while it is being drawn
ViewCube.base = function () { if (!ViewCube.node) ViewCube.node = TSL.cubeTexture(ViewCube.target().texture); return ViewCube.node; };
ViewCube.frame = function (c) { const s = c && c.site; if (!s || s.x === undefined || typeof siteToWorld !== 'function') return null; const o = siteToWorld(s, 0, 0), a = siteToWorld(s, 1, 0), b = siteToWorld(s, 0, 1); return { p: [o[0], (s.y !== undefined ? s.y : World.groundY(o[0], o[1])) + 1.7, o[1]], ax: a[0] - o[0], az: a[1] - o[1], bx: b[0] - o[0], bz: b[1] - o[1] }; };
ViewCube.capture = function (c) {
  if (ViewCube.off || ViewCube.busy || !c || typeof SC === 'undefined' || !SC.scene || !G.renderer) return false; const f = ViewCube.frame(c); if (!f) { if (SH.U.viewOn) SH.U.viewOn.value = 0; ViewCube.cell = null; return false; }
  ViewCube.busy = true; ViewCube.target(); ViewCube.cell = c.id; ViewCube.hour = Math.floor(Env.hour);       // set first: a capture that fails is not tried again every frame
  const was = Cells.cur, cam0 = R.cam.pos.slice(), yaw0 = R.cam.yaw, pitch0 = R.cam.pitch, camObj = R.camera, cp = camObj.position.clone(), cq = camObj.quaternion.clone();
  let _di = null;
  try {
    if (was) Cells.change(null);                                    // the town is what is drawn: its ground, water and sky are switched off while indoors
    R.cam.pos[0] = f.p[0]; R.cam.pos[1] = f.p[1]; R.cam.pos[2] = f.p[2]; camObj.position.set(f.p[0], f.p[1], f.p[2]); camObj.updateMatrixWorld(true);
    { const st = c.site, hw = (st.w || 6) / 2 + 1.3, hd = (st.d || 6) / 2 + 1.3; if (typeof Kit !== 'undefined') Kit.skip = u => { const l = worldToSite(st, u.x, u.z); return Math.abs(l[0]) < hw && Math.abs(l[1]) < hd; }; }       // the house's own shell (its pieces stand within its footprint)
    if (typeof deepIndoors === 'function') { _di = deepIndoors; deepIndoors = () => false; }       /* [fin] the camera stands inside the house's footprint: the town's indoor culling would hide the neighbours' walls and yards from the picture (only seen when the hour turned indoors) */
    SC.all = true; if (typeof Kit !== 'undefined') Kit.all = true;   // everything round the house, not what the player's own view had kept (42_scene.js, 44_kit.js)
    if (typeof updateEnv === 'function') { try { updateEnv(game.time, 0); } catch (e) { } }
    if (SC.camLast) SC.camLast[0] = 1e9;       /* [fin] a capture taken while a cell is current (the hour turns indoors) must not reuse the cell-mode culling of the last frame: the neighbours' walls were missing from it */
    if (typeof Kit !== 'undefined' && Kit.update) Kit.update(R.cam.pos); if (typeof sceneUpdate === 'function') sceneUpdate(R.cam.pos, R.q);
    const hide = []; if (typeof Chars !== 'undefined' && Chars.group && Chars.group.visible) { Chars.group.visible = false; hide.push(Chars.group); }      // people move; a still of them in the glass would be a ghost
    ViewCube.base().value = ViewCube.blank.texture;        // panes are in the picture too (seen from the street): they must not read the map while it is being drawn
    ViewCube.cam.position.set(f.p[0], f.p[1], f.p[2]); ViewCube.cam.update(G.renderer, SC.scene);
    ViewCube.base().value = ViewCube.rt.texture;
    { // [fin] the street door's own map: from 1.2 m outside that door at eye height, so a lane shows its far side and the sky above it; the nearest lane lantern within 12 m becomes a warm lobe (uniform doorLamp: world direction and strength)
      const dx = World.doors.find(w => w.cell === c.id && w.side === 'out'); let dp = f.p, lamp = [0, 0, 0, 0];
      if (dx) { const nx = dx.out[0] - dx.c[0], nz = dx.out[2] - dx.c[2], l = Math.hypot(nx, nz) || 1; dp = [dx.c[0] + nx / l * 1.2, dx.c[1] + 0.6, dx.c[2] + nz / l * 1.2]; }
      let best = 12; for (const e of World.emitters) if (e.type === 'lantern' && !e.zone) { const d = Math.hypot(e.p[0] - dp[0], e.p[1] - dp[1], e.p[2] - dp[2]); if (d < best) { best = d; const k = 1 / (d || 1); lamp = [(e.p[0] - dp[0]) * k, (e.p[1] - dp[1]) * k, (e.p[2] - dp[2]) * k, 1 - d / 12]; } }
      if (typeof Kit !== 'undefined') { Kit.skip = null; if (Kit.dynLast) Kit.dynLast[4] = ''; if (Kit.update) Kit.update([dp[0], dp[1], dp[2]]); }       // the house's own wall stands behind this camera and may be seen: only the window map hides the shell (its porch and steps sat inside the skip box and the door map came out empty)
      ViewCube.dbase().value = ViewCube.blank.texture; ViewCube.dcam.position.set(dp[0], dp[1], dp[2]); ViewCube.dcam.update(G.renderer, SC.scene); ViewCube.dbase().value = ViewCube.drt.texture; SH.U.doorLamp.value.set(lamp[0], lamp[1], lamp[2], lamp[3]);
    }
    for (const o of hide) o.visible = true;
    SH.U.viewX.value.set(f.ax, f.az); SH.U.viewZ.value.set(f.bx, f.bz); SH.U.viewOn.value = 1; ViewCube.cell = c.id; ViewCube.hour = Math.floor(Env.hour); ViewCube.shots++;
  } catch (e) { console.warn('viewcube: ' + (e && e.message || e)); if (SH.U.viewOn) SH.U.viewOn.value = 0; }
  if (_di) deepIndoors = _di;
  SC.all = false; if (typeof Kit !== 'undefined') { Kit.all = false; Kit.skip = null; if (Kit.dynLast) Kit.dynLast[4] = ''; }
  R.cam.pos[0] = cam0[0]; R.cam.pos[1] = cam0[1]; R.cam.pos[2] = cam0[2]; R.cam.yaw = yaw0; R.cam.pitch = pitch0; camObj.position.copy(cp); camObj.quaternion.copy(cq); camObj.updateMatrixWorld(true);
  if (was) Cells.change(was); if (SC.camLast) SC.camLast[0] = 1e9;
  ViewCube.busy = false; return true;
};
// going in: the picture is taken before the player is moved (the screen is black in the fade); indoors, again when the hour turns
{ const _tp = Cells.teleport; Cells.teleport = function (dest) { try { const c = dest && dest.p ? Cells.at(dest.p[0], dest.p[1], dest.p[2]) : null; if (c && c !== Cells.cur) ViewCube.capture(c); } catch (e) { console.warn('viewcube: ' + (e && e.message || e)); } return _tp.apply(this, arguments); }; }
ViewCube.tick = function () { const c = Cells.cur; if (!c || ViewCube.off || ViewCube.busy) return; if (ViewCube.cell !== c.id || ViewCube.hour !== Math.floor(Env.hour)) ViewCube.capture(c); };
