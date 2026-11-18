// ───────────────────────── boot, main loop, adaptive quality ─────────────────────────
const game = { time: 0, clock: 0, playing: false, qualitySetting: 'auto', showFps: false, tier: 'high', ready: false };
window.__game = game;
window.__gpuErrors = () => G.errors;
const Perf = { ft: 16.7, T: 16.7, hold: 3, ceil: 1, ceilT: 0, lowT: 0, acc: 0, n: 0, fps: 60, probeN: 0, probeBuf: [], probeAt: -99, fastT: 0, capT: 0, first: 0 };
const coarse = () => (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 520;

function resize() {
  const c = G.canvas; let pr = Math.min(window.devicePixelRatio || 1, R.q.pr);
  const long = Math.max(c.clientWidth, c.clientHeight) * pr; if (R.q.maxLong && long > R.q.maxLong) pr *= R.q.maxLong / long;      // cap the long side of the canvas per tier (high-DPI phones and tablets)
  gfxResize(Math.round(c.clientWidth * pr), Math.round(c.clientHeight * pr));
}
game.applyQuality = async () => {
  let tier = game.qualitySetting;
  if (tier === 'auto') tier = game.autoTier || (coarse() ? 'medium' : 'high');
  if (tier === game.tier && R.P) return;
  game.tier = tier; R.busy = true;
  try { await setQuality(tier); } catch (e) { console.warn('quality', tier, e); G.errors.push('quality ' + tier + ': ' + (e && e.message)); if (tier !== 'low') { game.tier = 'low'; game.autoTier = 'low'; await setQuality('low'); } else throw e; }
  resize(); R.busy = false;
};
// Browsers sometimes hold a page to 30 callbacks a second (Low Power Mode, a warm phone, an embedded frame nobody has
// touched yet). Lowering detail cannot buy that back, so before giving anything up we time a few callbacks with no drawing.
function cadenceProbe() { const P = Perf; P.probeN = 7; P.probeBuf.length = 0; P.probeAt = game.time; }
function cadenceDone() {
  const P = Perf, b = P.probeBuf.slice(2).sort((x, y) => x - y), c = b[b.length >> 1];
  P.T = c < 19 ? 16.7 : Math.min(c, 50); P.ft = P.T; P.hold = 1; P.fastT = 0;
}
// keep the frame rate by trading resolution first, then detail
function perfUpdate(dtMs, dt) {
  const P = Perf; PerfHud.update(dtMs); P.ft += (dtMs - P.ft) * 0.06; P.acc += dtMs; P.n++;
  if (P.acc > 500) {
    P.fps = Math.round(1000 * P.n / P.acc); P.acc = 0; P.n = 0;
    if (G.errors.length && !game.errSaid) { game.errSaid = true; const m = 'This device reported a graphics error, so the valley may not draw correctly: ' + G.errors[0].slice(0, 260); const n = $('gpuNote'); n.textContent = m; n.hidden = false; if (game.playing) toast(m.slice(0, 190)); }
  }
  if ((TEST && !TEST.loop) || R.busy || document.hidden || !game.playing) return;
  if (P.first > 0) { P.first -= dt; if (P.first <= 0) cadenceProbe(); return; }
  const T = P.T, r = P.ft / T;
  // callbacks arriving faster than the target: the cap has gone
  if (r < 0.8) { P.fastT += dt; if (P.fastT > 1) { P.T = 16.7; P.fastT = 0; P.hold = Math.max(P.hold, 1); } } else P.fastT = 0;
  if (T > 20) {
    P.capT += dt;
    if (P.capT > 6 && !P.capSaid) { P.capSaid = true; toast('The browser is holding this page to ' + Math.round(1000 / T) + ' frames a second. Low Power Mode, a warm phone or an embedded view will do that.'); }
    if (game.time - P.probeAt > (uiBusy() ? 15 : 45)) { cadenceProbe(); return; }
  } else P.capT = 0;
  // a phone that holds full resolution with ease gets one try at the next tier up
  if (game.qualitySetting === 'auto') {
    if (game.tier === 'medium' && !P.triedHigh && !coarse()) {      // phones and tablets stay on medium: a failed trial of high costs seconds of stutter
       P.goodT = (R.scale >= 1 && r < 1.04) ? (P.goodT || 0) + dt : 0; if (P.goodT > 9) { P.triedHigh = true; P.probeT = 14; game.autoTier = 'high'; game.applyQuality(); } }
    else if (P.probeT > 0) { P.probeT -= dt; if (R.scale < 0.86) { P.probeT = 0; game.autoTier = 'medium'; R.scale = 1; P.hold = 3; game.applyQuality(); } }
  }
  P.hold -= dt; P.ceilT -= dt;
  if (P.hold > 0) return;
  if (r > 1.6 && !P.raised && game.time - P.probeAt > 12) { cadenceProbe(); return; }      // looks like half rate: rule out a cap first
  const q = x => Math.round(clamp(x, 0.5, 1) * 20) / 20;
  if (r > 1.10) {
    if (P.raised) {            // the last step up was one too many: return to what worked, and wait longer each time before trying again
      P.fails = Math.min((P.fails || 0) + 1, 4); R.scale = q(R.scale - 0.05); P.ceil = R.scale; P.ceilT = 40 * (1 << (P.fails - 1)); P.hold = 1.4; P.raised = false;
    } else if (R.scale > 0.5) { R.scale = q(R.scale - (r > 1.26 ? 0.1 : 0.05)); P.hold = r > 1.26 ? 0.9 : 1.4; }
    else P.hold = 0.5;
  }
  else if (r < 1.04 && R.scale < 1 && (P.ceilT <= 0 || R.scale + 0.05 <= P.ceil + 1e-6)) { R.scale = q(R.scale + 0.05); P.hold = 2.2; P.raised = true; }
  else { P.hold = 0.5; if (r < 1.04) P.raised = false; }
  // out of resolution to give: drop a detail tier (auto only). High detail is not worth keeping below 70% resolution.
  const hi = game.tier === 'high';
  // below 70% resolution the picture is soft enough that a lighter tier is the better trade; the count decays while the frame time is fine
  if (R.scale <= 0.7 + 1e-6 && (hi || r > 1.10)) P.lowT += 1; else P.lowT = Math.max(0, P.lowT - 0.5);
  if (P.lowT > 5 && game.qualitySetting === 'auto' && game.tier !== 'low') { P.lowT = 0; game.autoTier = hi ? 'medium' : 'low'; R.scale = hi ? 0.9 : 0.8; P.hold = 4; P.raised = false; P.triedHigh = true; game.applyQuality(); toast('Detail lowered to keep things smooth.'); }
}
function updateDynamics(dt, chars) {
  const bd = R.boneData, tmp = POSE.S, pp = Player.pos;
  for (const d of World.doors) {
    // [fin] one rule for every leaf: open when someone on the same level comes within reach (2.3 m); stay open at least 2.5 s; close only after nobody has been within 3.6 m for 1.2 s; fixed speed; never reverse within 0.5 s
    let reach = false, wide = false;
    for (const c of chars) if (CELLS_ON && c === chars[0]) continue; else if (Math.abs(c[0] - d.c[0]) < 3.6 && Math.abs(c[2] - d.c[2]) < 3.6 && Math.abs(c[1] - d.c[1] + 1) < 2.2) { const h = hyp(c[0] - d.c[0], c[2] - d.c[2]); if (h < 3.6) wide = true; if (h < 2.3) { reach = true; break; } }
    if (d.gate) reach = wide = !!S.opened[d.gate];          // a locked gate stays shut until the key has turned, and then stands open for good. [owner, Build 73] it used to wait for someone to come near, and since interiors became cells the player is left out of that test (line above), so the crypt gate unlocked, lost its collider and stayed drawn shut
    d.hold = d.hold === undefined ? 0 : d.hold; d.away = d.away === undefined ? 9 : d.away; d.dirT = d.dirT === undefined ? 9 : d.dirT; d.dir = d.dir || -1;
    d.dirT += dt; d.hold = Math.max(0, d.hold - dt); d.away = wide ? 0 : d.away + dt;
    let want = d.dir;
    if (reach) { want = 1; d.hold = 2.5; } else if (d.hold <= 0 && d.away > 1.2) want = -1;
    if (want !== d.dir && d.dirT >= 0.5) { d.dir = want; d.dirT = 0; if (want === 1 && d.open === 0 && game.playing) { const dd = hyp(pp[0] - d.c[0], pp[2] - d.c[2]); if (dd < 14) Audio2.door(clamp(1.2 - dd / 12, 0.1, 1)); } }
    d.open = clamp(d.open + d.dir * dt * 2.4, 0, 1);
    if (d.open === d.last) continue; d.last = d.open;
    m4.copy(tmp, d.baseM); m4.rotY(tmp, smooth(0, 1, d.open) * 1.85); m4.mul(tmp, tmp, d.S); bd.set(tmp, d.obj.slot * 256);
  }
  const w = World.millWheel; if (w) { w.angle += dt * 0.5; m4.copy(tmp, w.base); m4.rotZ(tmp, w.angle); bd.set(tmp, w.obj.slot * 256); }
}
function attractCamera(t) {
  const a = t * 0.03 + 2.45, r = 64 + 10 * Math.sin(t * 0.021), cx = 2, cz = -8, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, y = Math.max(Terrain.y(x, z) + 6, 19 + 5 * Math.sin(t * 0.017));
  R.cam.pos = [x, y, z]; R.cam.yaw = headingTo(x, z, cx, cz); R.cam.pitch = -Math.atan2(y - 4, r) * 0.72;
  World.camZone = 0; World.indoor += (0 - World.indoor) * 0.1;
}
function audioState() {
  const p = R.cam.pos, st = game.ast || (game.ast = { fire: 0, water: 0 });
  st.playing = game.playing; st.indoor = World.indoor; st.wind = ENV.windStrength; st.night = ENV.night; st.day = ENV.day; st.hour = Env.hour; st.height = sat((p[1] - 3) / 25);
  if ((R.frame & 7) === 0) {
    let f = 0; for (const e of World.emitters) { if (e.type !== 'fire' && !(e.type === 'bonfire' && World.bonfire)) continue; const d = hyp(e.p[0] - p[0], e.p[1] - p[1], e.p[2] - p[2]); f = Math.max(f, sat(1 - d / (e.type === 'bonfire' ? 22 : 8)) * (e.zone === World.camZone || e.zone === 0 ? 1 : 0.35)); } st.fire = f;
    const wd = River.dist(p[0], p[2], 30), ld = hyp(p[0] - LAKE.x, p[2] - LAKE.z) - LAKE.r, md = World.millPos ? hyp(p[0] - World.millPos[0], p[2] - World.millPos[2]) : 99;
    st.water = Math.max(sat(1 - wd / 26) * 0.8, sat(1 - ld / 20) * 0.35, sat(1 - md / 18));
  }
  st.cell = !!World.cell; const b = NPC.brandt; st.hammer = b && b.anim === 'hammer' && !b.talking ? b.t : -1; const hb = b ? Cells.hear(b.pos, p) : null; st.hammerDist = b ? (CELLS_ON ? hb.d : hyp(b.pos[0] - p[0], b.pos[2] - p[2])) : 999; st.hammerWall = !!hb && hb.wall;
  const l = NPC.lark; st.lute = !!(l && l.anim === 'lute' && !l.talking); const hl = l ? Cells.hear(l.pos, p) : null; st.luteDist = l ? (CELLS_ON ? hl.d : hyp(l.pos[0] - p[0], l.pos[2] - p[2])) : 999; st.luteWall = !!l && (CELLS_ON ? hl.wall : World.zoneAt(l.pos[0], l.pos[1] + 1, l.pos[2]) !== World.camZone);
  st.bellOn = !!S.flags.bell; st.bellDist = World.bell ? hyp(World.bell.p[0] - p[0], World.bell.p[2] - p[2]) : 999;
  for (const c of World.chickens) if (c.cluck) { c.cluck = false; Audio2.cluck(clamp(1.2 - hyp(c.pos[0] - p[0], c.pos[2] - p[2]) / 8, 0, 1)); }
  return st;
}
function tick(dt) {
  game.time += dt;
  if (game.playing) game.clock += dt;
  if (Env.dayLength > 0 && !UI.menu && game.playing) Env.hour = (Env.hour + dt * 24 / Env.dayLength) % 24;
  // villagers are obstacles too
  Col.dyn.length = 0; const pp = Player.pos, chars = [pp];
  for (const n of NPCS) { chars.push(n.pos); if (n.anim !== 'lie' && Math.abs(n.pos[0] - pp[0]) < 4 && Math.abs(n.pos[2] - pp[2]) < 4) Col.dyn.push({ x: n.pos[0], z: n.pos[2], r: 0.27 * n.scale, y0: n.pos[1] - 0.3, y1: n.pos[1] + 1.7 }); }
  if (game.playing) { playerUpdate(dt); Feel.post(dt); } else attractCamera(game.time);
  npcUpdate(dt, game.playing ? pp : R.cam.pos);
  updateDynamics(dt, chars);
  World.bonfire = !!S.flags.fire && (Env.hour > 19 || Env.hour < 2);
  if (World.festival && Env.hour > 23.4 && Env.hour < 23.9) { World.festival = false; for (const n of NPCS) n.override = null; }
  const env = updateEnv(game.time, World.indoor); env.time = game.time;
  fxUpdate(dt, game.time, env, R.cam.pos);
  RPG.tick(dt);
  if (game.playing) uiFrame(dt);
  Audio2.update(dt, audioState());
  return env;
}
let lastT = 0;
function frame(tms) {
  requestAnimationFrame(frame);
  if (G.lost) return;
  const rawMs = tms - lastT, dtMs = Math.min(rawMs, 100); lastT = tms;
  if (dtMs <= 0 || document.hidden) return;
  PerfHud.frame(rawMs);
  if (Perf.probeN > 0) { Perf.probeBuf.push(dtMs); if (--Perf.probeN === 0) cadenceDone(); return; }
  try {
    const env = UI.paused && game.env ? game.env : tick(dtMs / 1000); game.env = env;      // paused: the world is drawn but not stepped
    perfUpdate(dtMs, dtMs / 1000);
    if (!R.busy) { renderFrame(game.time, env); Mark.draw(); }
  } catch (e) { if (!game.crashed) { game.crashed = true; console.error(e); G.errors.push(String(e && e.stack || e)); } }
  // WebGPU that reports errors (or throws) in its first seconds of drawing will not get better: switch this device to WebGL 2
  if (!G.gfxChecked) { if (!G.tDraw) G.tDraw = tms; if (G.errors.length) { G.gfxChecked = true; gfxFallback(G.errors[0]); } else if (tms - G.tDraw > 12000) G.gfxChecked = true; }
}
function onDeviceLost() {
  $('title').classList.remove('gone'); $('startRow').hidden = true; $('bar').hidden = true; $('loadText').textContent = 'The graphics device was lost. Reloading to return to Brackenfell.';
  if (TEST) return;
  try { if (game.playing && typeof save === 'function') save(); } catch (e) { }
  let n = 1; try { n = (+sessionStorage.getItem('brackenfell.lost') || 0) + 1; sessionStorage.setItem('brackenfell.lost', String(n)); } catch (e) { }
  // lost while starting up, or for the second time: this device and WebGPU do not get along, so come back on WebGL 2
  if ((performance.now() - (G.t0 || 0) < 30000 || n >= 2) && gfxFallback('graphics device lost')) return;
  if (n > 3) { $('loadText').textContent = 'The graphics device keeps being lost. Reload the page to try again.'; return; }
  const again = () => { if (!document.hidden) location.reload(); };
  if (document.hidden) document.addEventListener('visibilitychange', again); else setTimeout(again, 1200);
}
function startGame(cont) {
  Audio2.start();
  const sv = cont && loadSave(); if (sv) applySave(sv); else { clearSave(); }
  npcSnapAll(); uiPurse(); uiObjective();
  game.playing = true; Perf.first = 0.45; Perf.ft = Perf.T = 16.7; Perf.hold = 3; R.scale = 1; $('title').classList.add('gone'); $('hud').hidden = false; Player.pos[1] = World.groundAt(Player.pos[0], Player.pos[2], Player.pos[1] + (Cells.inRegion(Player.pos[0]) ? 0.8 : 50)); if (CELLS_ON) { Cells.sync(Player.pos); World.camZone = World.zoneAt(Player.pos[0], Player.pos[1] + 1, Player.pos[2]); }
  if (!Input.touch && !coarse() && !TEST) { try { const p = G.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  if (!sv) { if (!TEST || TEST.intro) Feel.begin(); else setTimeout(() => { if (qAt('welcome') < 0) qStart('welcome'); }, 5200); }
  else { setTimeout(() => { banner('The Greyspine Valley', 'Brackenfell'); }, 900); if (S.q.welcome) Feel.did('move'), Feel.did('look'), Feel.did('use'); }
}
// every label the loading screen shows while the valley is made; Load (index.html's inline script) draws the bar and the byte counts
const bootSay = t => { if (typeof Load !== 'undefined') Load.say(t); else $('loadText').textContent = t; };
const bootStage = f => { if (typeof Load !== 'undefined') Load.stage(f); };
const gfxSync = async () => { try { const b = G.renderer && G.renderer.backend; if (b && b.device && b.device.queue && b.device.queue.onSubmittedWorkDone) await b.device.queue.onSubmittedWorkDone(); else if (b && b.gl && b.gl.finish) b.gl.finish(); } catch (e) { } };
// Draw a few frames from places that between them put every kind of surface on screen (roads, houses, people, grass, water, a lit room), so the
// shader and pipeline compiles happen behind the loading screen instead of as a hitch in the first seconds of play. Safe on both backends: these are
// ordinary frames of the same pipeline; nothing here is compiled separately. A failed frame is only a skipped warm-up.
async function warmShaders() {
  const here = [R.cam.pos.slice(), R.cam.yaw, R.cam.pitch], zone0 = World.camZone, ind0 = World.indoor;

  const views = [[-84, null, -6.5, 90, 2], [0, null, 8, 0, 4], [10, null, 84, 0, 2], [-40, null, -2, 270, 8]];
  let i = 0;
  for (const v of views) {
    bootSay('Warming the lanterns'); bootStage(0.84 + 0.14 * (i++ / views.length));
    try {
      R.cam.pos = [v[0], v[1] === null ? Terrain.y(v[0], v[2]) + 1.7 : v[1], v[2]]; R.cam.yaw = v[3] * PI / 180; R.cam.pitch = v[4] * PI / 180;
      World.camZone = World.zoneAt(v[0], R.cam.pos[1], v[2]); World.indoor = World.camZone ? 1 : 0;
      npcUpdate(0.05, R.cam.pos); fxUpdate(0.05, game.time, updateEnv(game.time, World.indoor), R.cam.pos);
      const env = updateEnv(game.time, World.indoor); env.time = game.time;
      renderFrame(game.time, env); renderFrame(game.time + 0.03, env);
      await gfxSync();
    } catch (e) { console.warn('warm-up frame skipped', e && e.message); }
    await new Promise(r => setTimeout(r, 16));
  }
  R.cam.pos = here[0]; R.cam.yaw = here[1]; R.cam.pitch = here[2]; World.camZone = zone0; World.indoor = ind0;
}
(async function boot() {
  const load = (t, f) => { bootSay(t); bootStage(f); return new Promise(r => setTimeout(r, TEST ? 0 : 30)); };
  let t0 = performance.now(); const laps = game.laps = {}, lap = n => { const t = performance.now(); laps[n] = Math.round(t - t0); t0 = t; };
  try {
    loadSettings(); if (PerfHud.url >= 0) { game.showFps = !!PerfHud.url; saveSettings(); } gfxTexInit(game.qualitySetting === 'auto' ? (TEST && TEST.quality) : game.qualitySetting);
    const canvas = $('view');
    bootSay('Waking the valley');
    try { await gfxInit(canvas); }
    catch (e) { $('bar').hidden = true; $('loadNums').hidden = true; bootSay('Brackenfell could not start 3D graphics in this browser. Try a current Chrome, Edge or Safari.'); console.warn(e); G.errors.push(String(e && e.stack || e)); window.__ready = true; return; }
    if (typeof Load !== 'undefined' && !G.astc) Load.use(['app', 'imgs', 'kits', 'chars']);        // no ASTC on this GPU: the WebP and JPEG texture files are fetched instead
    gfxResize(G.canvas.clientWidth, G.canvas.clientHeight);
    await load('Mixing lime, straw and river stone', 0.02);
    const lowMem = (navigator.deviceMemory || 8) <= 3;
    bootSay(Load.first ? 'Unpacking stone, timber and thatch (first visit: kept on this device for next time)' : 'Unpacking stone, timber and thatch');
    await loadNoise();
    await loadPack(lowMem, f => { }); lap('pack');
    SH.init();
    // animated villagers; if their files cannot be loaded the old hand-built bodies stand in
    bootSay('Dressing the villagers');
    // the realistic set first, the stylized one if its files cannot be loaded; ?chars=quaternius (or TEST.chars) picks one set and no fallback
    if (typeof Chars !== 'undefined' && !(TEST && TEST.oldBodies)) {
      const want = (TEST && TEST.chars) || (/[?&]chars=(\w+)/.exec(location.search) || [])[1], order = want ? [want] : ['real', 'quaternius'];
      for (const name of order) {
        try { if (name === 'quaternius' && typeof Load !== 'undefined') Load.use(Load.groups.concat('charsq')); await Chars.load(name, f => { }); G.chars = true; G.charSet = name; break; }
        catch (e) { console.warn('character set ' + name + ' unavailable: ' + (e && e.message || e)); G.charsNote = String(e && e.message || e); Chars.ready = false; Chars.set = null; }
      }
    }
    lap('chars');
    if (typeof kitBoot === 'function') await kitBoot(f => { bootSay('Carting in beams, barrels and roof tiles'); });
    renderInit();
    await load('Raising the Greyspine', 0.1); buildTerrain(); buildSplat(); buildWater(); lap('terrain');
    await load('Framing timber, laying thatch', 0.25); buildVillage(); lap('village');
    await load('Waking the villagers', 0.5); buildNPCs(); festivalSpots(); lap('npcs');
    await load('Planting pine and birch', 0.62); if (typeof Trees !== 'undefined') await Trees.load(); /* fork-look: scanned trees (74b_trees.js) */ buildVegetation(); if (typeof buildWilds === 'function') buildWilds(); if (typeof settleSolids === 'function') settleSolids(); /* [fx3] earlier, taller solids win over piles and stalls */ lap('veg');
    World.villagePack.upload('village'); World.skinPack.upload('skin');
    buildSplat2(); colBuild(); if (typeof Bake !== 'undefined') Bake.buildGround(); /* [l1] 72m_bake.js */ navBuild(); fxInit(); lap('nav');
    await load('Lighting the lanterns', 0.74);
    if (TEST && TEST.quality) game.qualitySetting = TEST.quality;
    await game.applyQuality(); lap('pipelines');
    if (typeof kitAttach === 'function') kitAttach();
    if (typeof infillAttach === 'function') infillAttach();
  if (typeof dressAttach === 'function') dressAttach();
    if (typeof wildsAttach === 'function') wildsAttach();
    festivalClear();
    if (TEST && TEST.hour !== undefined) Env.hour = TEST.hour;
    npcSnapAll(); uiInit(); inputInit2(G.canvas, $('touch'));
    addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 250));
    UI.lifecycle();
    if (!TEST || TEST.warm) await warmShaders();
    bootStage(1); if (typeof Load !== 'undefined') Load.complete(); else $('barFill').style.transform = 'scaleX(1)';
    $('loadBox').hidden = true; $('startRow').hidden = false; $('title').classList.remove('loading'); $('title').classList.add('ready');
    $('hint').textContent = coarse() ? 'Drag on the left to walk, on the right to look. Push the stick all the way to run. Walk up to a door to go in.' : 'W A S D to walk, mouse to look, Shift to run, E to use, Tab for your journal and map, Esc to pause.';
    if (loadSave()) $('contBtn').hidden = false;
    $('startBtn').addEventListener('click', () => startGame(false)); $('contBtn').addEventListener('click', () => startGame(true));
    if (typeof Load !== 'undefined') { Load.update = () => UI.updateAvailable(); if (Load.updateReady) UI.updateAvailable(); setTimeout(() => { Load.register(); setTimeout(() => Load.warm().then(() => UI.storageNote()), 4000); }, 1500); }
    { const bad = World.colliders.filter(c => Math.hypot(c.x, c.z) < 1.5 && !(c.bonfire)); if (bad.length) console.warn('[fx1] ' + bad.length + ' colliders within 1.5 m of the world origin (a prop built at the origin and moved registered them):', JSON.stringify(bad.slice(0, 4))); }          // boot assertion
    game.ready = true;
    // ── test hooks ──
    game.info = () => ({ tris: World.packs.map(p => p.tris | 0), veg: World.instPack.tris | 0, trees: World.treeCount, lights: World.lights.length, colliders: World.colliders.length, floors: World.floors.length, skinned: World.skinCount, emitters: World.emitters.length, nav: Nav.nodes.length, laps });
        game.step = (n, dt) => { let env; for (let i = 0; i < (n || 1); i++) env = tick(dt || 1 / 30); return env; };
    game.draw = async () => { const env = updateEnv(game.time, World.indoor); env.time = game.time; renderFrame(game.time, env); await gfxCapture(() => renderFrame(game.time, env)); Mark.draw(); return R.stats; };
    game.tp = (x, z, yawDeg, pitchDeg, y) => {       // tp(spotName, yawDeg?) goes to a named spot (inside a cell too); tp(x, z, ...) to coordinates, y optional
      if (typeof x === 'string') { const sp = World.spots[x]; if (!sp) throw new Error('no spot ' + x); yawDeg = z === undefined ? sp.yaw * 180 / PI : z; pitchDeg = 0; y = sp.p[1]; z = sp.p[2]; x = sp.p[0]; }
      Player.pos = [x, y === undefined ? World.groundAt(x, z, 1e9) : y, z]; Player.vel = [0, 0, 0]; if (yawDeg !== undefined) Player.yaw = yawDeg * PI / 180; Player.pitch = (pitchDeg || 0) * PI / 180;
      if (CELLS_ON) Cells.sync(Player.pos); World.indoor = World.cell || World.zoneAt(x, Player.pos[1] + 1, z) ? 1 : 0; World.camZone = World.zoneAt(x, Player.pos[1] + 1, z); R.cam.pos[0] = x; R.cam.pos[1] = Player.pos[1] + Player.eye; R.cam.pos[2] = z; Player.camY = Player.pos[1];
    };
    game.enter = id => { const c = Cells.by[id]; if (!c) throw new Error('no cell ' + id); Cells.teleport(c.enter); return c.id; };         // instant, no fade (tests); the door interaction is Cells.use
    game.leave = () => { const c = Cells.cur; if (!c) return false; Cells.teleport(c.leave); return true; };
    game.shot = async (x, y, z, yaw, pitch, hour) => {
      if (hour !== undefined) { Env.hour = hour; npcSnapAll(); }
      game.playing = false; const save = attractCamera; R.cam.pos = [x, y === null ? Terrain.y(x, z) + 1.65 : y, z]; R.cam.yaw = yaw * PI / 180; R.cam.pitch = (pitch || 0) * PI / 180;
      if (CELLS_ON) Cells.sync(R.cam.pos); World.camZone = World.zoneAt(x, R.cam.pos[1], z); World.indoor = World.cell || World.camZone ? 1 : 0;
      game.time += 0.4; npcUpdate(0.4, R.cam.pos); updateDynamics(0.4, [R.cam.pos].concat(NPCS.map(n => n.pos)));
      const env = updateEnv(game.time, World.indoor); env.time = game.time; World.bonfire = !!S.flags.fire && (Env.hour > 19 || Env.hour < 2);
      fxUpdate(0.4, game.time, env, R.cam.pos); fxUpdate(0.4, game.time, env, R.cam.pos);
      renderFrame(game.time, env); await gfxCapture(() => renderFrame(game.time, env));
      return R.stats;
    };
    if (TEST && !TEST.title) $('title').classList.add('gone');
    if (TEST && TEST.play) startGame(false);
    if (!TEST || TEST.loop) requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
    window.__ready = true;
  } catch (e) {
    console.error(e && e.stack || e);
    // shader and pipeline messages arrive a moment later; show them too so a screenshot of this screen says what failed
    if (gfxFallback('start-up failed: ' + (e && e.message || e))) return;
    const show = () => { $('bar').hidden = true; $('loadText').textContent = 'Something went wrong while building the village: ' + (e && e.message || e) + (G.errors.length ? ' [' + G.errors.slice(0, 2).join(' | ').slice(0, 420) + ']' : ''); };
    show(); setTimeout(show, 900); setTimeout(() => { G.errors.push(String(e && e.stack || e)); }, 1000); window.__ready = true;
  }
})();
