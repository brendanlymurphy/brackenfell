// ───────────────────────── HUD, dialogue, journal, pause, settings ─────────────────────────
// The interface is parchment and ink and keeps out of the way: bars and quest text rest when nothing changes and return on change; the one thing
// on screen that asks for a finger is the use button, and it exists only while something can be used (and says what it will do).
// Public hooks for other code: UI.discover(name) (banner + map label), UI.extra (an object saved with the settings), toast(), banner(), #sndExtra (Sound page).
const $ = id => document.getElementById(id);
const BUILD_NAME = 'Build 86';      // the number people quote; bump on every publish (the hash beside it is the build id)
const UI = { talk: null, menu: false, reader: false, paused: false, pauseWhy: '', prompt: null, promptPos: null, compass: [], seen: {}, placeT: 0, lastYaw: 9, lastObj: '', hudT: 8, quiet: false, extra: {}, portrait: false, fromPause: false, lastPart: '', lastGold: -1, glintT: 0 };
function toast(html, act) { const d = document.createElement('div'); d.innerHTML = html; if (act) { const b = document.createElement('button'); b.type = 'button'; b.textContent = act[0]; b.onclick = act[1]; d.appendChild(b); } $('toasts').appendChild(d); UI.hudT = Math.max(UI.hudT, 3); setTimeout(() => d.remove(), act ? 9000 : 5300); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
function banner(small, big, cls) { const p = $('place'); p.innerHTML = '<small>' + small + '</small>' + big; p.className = (cls || '') + ' on'; clearTimeout(UI.placeT); UI.placeT = setTimeout(() => p.classList.remove('on'), /^Quest/.test(small) ? 2200 : 3000); }       /* was 3.8 s plus 1.4 s of fade each way, across the middle of the view: a quest line is now up for about 3.5 s in all */
function fadeDo(fn) { const f = $('fade'); f.classList.add('on'); Player.locked = true; setTimeout(() => { fn(); setTimeout(() => { f.classList.remove('on'); Player.locked = uiBusy(); if (typeof Feel !== 'undefined') Feel.settle(); }, 350); }, 950); }
const uiBusy = () => !!(UI.talk || UI.menu || UI.reader || UI.paused);
function uiPurse() { $('purse').textContent = S.gold + ' gold'; if (S.gold !== UI.lastGold) { if (UI.lastGold >= 0) UI.hudT = Math.max(UI.hudT, 6); UI.lastGold = S.gold; } }
function questLine(id) { let st = QUESTS[id].stages[S.q[id].stage]; if (id === 'herbs' && S.q[id].stage === 0) st += ' (' + Math.min(frostN(), 5) + ' of 5)'; return st; }
function uiObjective() {
  let h = ''; const act = QORDER.filter(id => S.q[id] && !S.q[id].done).sort((a, b) => (b === 'main') - (a === 'main') || S.q[b].t - S.q[a].t).slice(0, 3);
  for (const id of act) h += '<div><b>' + QUESTS[id].name + '</b>' + questLine(id) + '</div>';
  if (h !== UI.lastObj) { $('objective').innerHTML = h; if (UI.lastObj !== '' || h) UI.hudT = Math.max(UI.hudT, 9); UI.lastObj = h; }
}
function releaseLook() { if (document.pointerLockElement) document.exitPointerLock(); Input.joy = null; Input.joyT = null; Input.look = null; $('stick').style.display = 'none'; }
const UI_VERBS = [[/^Talk to /, 'Talk'], [/^Open /, 'Open'], [/^Search /, 'Search'], [/^Take /, 'Take'], [/^Pick /, 'Take'], [/^Read/, 'Read'], [/^Sleep/, 'Sleep'], [/^Ring /, 'Ring'], [/^Light /, 'Light'], [/^Enter ?/, 'Enter'], [/^Leave ?/, 'Leave'], [/^Climb ?/, 'Climb'], [/^Use /, 'Use']];
function promptParts(label) { for (const [re, v] of UI_VERBS) if (re.test(label)) return [v, label.replace(re, '').replace(/^(the|a|an|to) /i, '')]; return ['Examine', label]; }
// ── dialogue: the camera has framed the speaker (87_feel.js); the HUD steps aside ──
function startTalk(npc) {
  UI.talk = npc; npc.talking = true; Player.locked = true; releaseLook();
  npc.yawBefore = npc.yaw; if (npc.anim !== 'sit' && npc.anim !== 'lie') npc.yaw = headingTo(npc.pos[0], npc.pos[2], Player.pos[0], Player.pos[2]);
  $('dname').textContent = npc.name; $('dialog').hidden = false; $('act').hidden = true; UI.prompt = null; document.body.classList.add('talking');
  if (typeof Feel !== 'undefined') Feel.talk(npc);
  showNode((TALK[npc.id] || (() => node('...')))()); Audio2.ui(); if (typeof Feel !== 'undefined') Feel.did('talk');
}
function showNode(n) {
  if (!n) return endTalk();
  $('dtext').textContent = n.t; const box = $('dopts'); box.textContent = '';
  n.o.forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = (Input.touch ? '' : (i + 1) + '.  ') + o[0]; if (o[2]) b.className = 'quest'; b.onclick = () => { Audio2.ui(); showNode(o[1] ? o[1]() : null); }; box.appendChild(b); if (i === 0 && !Input.touch) setTimeout(() => b.focus(), 30); });
  $('dialog').scrollTop = 0;
}
function endTalk() { const n = UI.talk; if (n) { n.talking = false; if (n.path) n.yaw = n.yawBefore; } UI.talk = null; $('dialog').hidden = true; document.body.classList.remove('talking'); Player.locked = uiBusy(); if (typeof Feel !== 'undefined') Feel.talkEnd(); uiObjective(); UI.hudT = 8; }
function openReader(title, text) { UI.reader = true; Player.locked = true; releaseLook(); $('rtitle').textContent = title; $('rtext').textContent = text; $('reader').hidden = false; Audio2.page(); if (typeof Feel !== 'undefined') Feel.did('use'); }
function closeReader() { UI.reader = false; $('reader').hidden = true; Player.locked = uiBusy(); }
// ── journal: quests, map, pack, settings ──
function renderJournal() {
  const act = [], done = []; for (const id of QORDER) { const q = S.q[id]; if (!q) continue; (q.done ? done : act).push(id); }
  act.sort((a, b) => S.q[b].t - S.q[a].t);
  const card = id => { const q = S.q[id], Q = QUESTS[id]; let h = '<div class="qc' + (q.done ? ' done' : '') + '"><span class="tag">' + (q.done ? 'Done' : 'Active') + '</span><h3>' + Q.name + '</h3>';
    if (!q.done) { h += '<ul>'; Q.stages.forEach((s, i) => { if (i > q.stage) return; h += '<li' + (i < q.stage ? ' class="ok"' : '') + '>' + (i === q.stage ? questLine(id) : s) + '</li>'; }); h += '</ul>'; }
    return h + '</div>'; };
  let h = '';
  if (act.length) h += '<h4>Active</h4><div class="qlog">' + act.map(card).join('') + '</div>';
  if (done.length) h += '<h4>Completed</h4><div class="qlog">' + done.map(card).join('') + '</div>';
  $('tab-journal').innerHTML = h || '<p class="empty">Nothing yet. Speak with the guard at the gate.</p>';
}
function openMenu(tab, fromPause) {
  if (UI.menu) return showTab(tab || 'journal');
  UI.menu = true; UI.fromPause = !!fromPause; Player.locked = true; releaseLook(); $('menu').hidden = false; $('pause').hidden = true; showTab(tab || 'journal'); Audio2.page();
  renderJournal(); Inv.render(); $('setTime').value = Env.hour; UI.diag(); if (UI.updateReady) $('updBtn').hidden = false;
  if (typeof Feel !== 'undefined') Feel.did('journal');
}
UI.diag = () => {
  const inf = G.gpuName || '';
  $('diag').textContent = BUILD_NAME + ' (' + (typeof Load !== 'undefined' ? Load.M.v : 'dev') + ')' + ' · ' + G.backend + (G.gfxWhy ? ' (' + G.gfxWhy.slice(0, 90) + ')' : '') + (G.chars ? '' : ' · old villagers') + ' · textures ' + (G.pack || '?') + (G.packNote ? ' (' + G.packNote.slice(0, 60) + ')' : '') + (inf ? ' (' + inf + ')' : '') + ' · ' + G.w + ' × ' + G.h + ' at ' + Math.round(R.scale * 100) + '% · detail ' + game.tier + (Perf.T > 20 ? ' · browser cap ' + Math.round(1000 / Perf.T) + ' fps' : '') + (UI.offline ? ' · ' + UI.offline : '') + (G.errors.length ? ' · ' + G.errors.length + ' warnings: ' + G.errors[0].slice(0, 160) : '');
};
function showTab(t) { for (const b of $('tabs').querySelectorAll('[data-tab]')) { const on = b.dataset.tab === t; b.classList.toggle('on', on); $('tab-' + b.dataset.tab).hidden = !on; } if (t === 'map' && typeof GameMap !== 'undefined') GameMap.show(); }
function closeMenu() { UI.menu = false; $('menu').hidden = true; saveSettings(); if (UI.paused) { $('pause').hidden = false; return; } Player.locked = uiBusy(); UI.hudT = 6; }
// ── settings: one JSON blob; every key is optional so older blobs load ──
function saveSettings() { try { localStorage.setItem('brackenfell.set', JSON.stringify({ q: game.qualitySetting, sens: Input.sens, vol: Audio2.vol, music: Audio2.musicVol, inv: Input.invertY, fps: game.showFps, flow: Env.dayLength, lefty: UI.pref.lefty, btn: UI.pref.btn, ts: UI.pref.ts, hc: UI.pref.hc, reduce: UI.pref.reduce, hold: UI.pref.hold, x: UI.extra })); } catch (e) { } }
UI.pref = { lefty: false, btn: 1, ts: 1, hc: false, reduce: false, hold: false };
function applyPrefs() {
  const p = UI.pref, b = document.body, r = document.documentElement.style;
  b.classList.toggle('lefty', !!p.lefty); b.classList.toggle('hc', !!p.hc); b.classList.toggle('reduce', !!p.reduce);
  r.setProperty('--ts', String(p.ts)); r.setProperty('--bs', String(p.btn));
  Input.lefty = !!p.lefty; Input.holdUse = !!p.hold; if (typeof Feel !== 'undefined') Feel.reduce = !!p.reduce;
}
function loadSettings() {
  UI.pref.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  try {
    const j = JSON.parse(localStorage.getItem('brackenfell.set') || 'null'); if (!j) return applyPrefs();
    if (j.q) game.qualitySetting = j.q; Input.sens = j.sens || 1; Audio2.vol = j.vol === undefined ? 0.8 : j.vol; Audio2.musicVol = j.music === undefined ? 0.6 : j.music; Input.invertY = !!j.inv; game.showFps = !!j.fps; if (j.flow !== undefined) Env.dayLength = j.flow === 1200 ? 2400 : j.flow;       /* [cast] 1200 was the old default, saved by everyone who never chose: it becomes the new default, 40 minutes */
    for (const k of ['lefty', 'btn', 'ts', 'hc', 'reduce', 'hold']) if (j[k] !== undefined) UI.pref[k] = j[k];
    if (j.x && typeof j.x === 'object') UI.extra = j.x;
  } catch (e) { }
  applyPrefs();
}
function uiInit() {
  Mark.init(); const tr = $('ctrack');
  for (const [l, a, minor] of [['N', 0], ['NE', 45, 1], ['E', 90], ['SE', 135, 1], ['S', 180], ['SW', 225, 1], ['W', 270], ['NW', 315, 1]]) { const s = document.createElement('span'); s.textContent = l; if (minor) s.className = 'minor'; tr.appendChild(s); UI.compass.push({ el: s, a: a * PI / 180 }); }
  UI.marks = []; for (let i = 0; i < 4; i++) { const m = document.createElement('span'); m.className = 'mark'; const d = document.createElement('span'); d.className = 'dist'; tr.appendChild(m); tr.appendChild(d); UI.marks.push({ el: m, d }); }
  UI.pmarks = []; for (let i = 0; i < 6; i++) { const m = document.createElement('span'); m.className = 'pl'; const n = document.createElement('span'); n.className = 'pln'; tr.appendChild(m); tr.appendChild(n); UI.pmarks.push({ el: m, n }); }
  // the use button: instant on touch (pointerdown), optionally held for half a second
  const act = $('act'); let hold = null;
  const fire = () => { if (UI.prompt && !Player.locked) { const it = UI.prompt; if (typeof Feel !== 'undefined') Feel.did('use'); interactUse(it); } };
  const stop = () => { if (hold) { clearTimeout(hold.t); hold = null; } act.classList.remove('on'); const h = $('actHold'); h.style.transition = 'none'; h.style.transform = 'scaleX(0)'; };
  act.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Input.touch = e.pointerType !== 'mouse' || Input.touch; act.classList.add('on');
    if (Input.holdUse) { const h = $('actHold'); h.style.transition = 'transform 0.45s linear'; h.style.transform = 'scaleX(1)'; hold = { t: setTimeout(() => { hold = null; stop(); fire(); }, 450) }; } else { fire(); } });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) act.addEventListener(ev, stop);
  act.addEventListener('click', e => e.preventDefault()); act.addEventListener('contextmenu', e => e.preventDefault());
  $('menuBtn').addEventListener('click', () => openMenu()); $('mclose').addEventListener('click', closeMenu); $('rclose').addEventListener('click', closeReader);
  for (const b of $('tabs').querySelectorAll('[data-tab]')) b.addEventListener('click', () => showTab(b.dataset.tab));
  for (const b of $('setTabs').querySelectorAll('[data-set]')) b.addEventListener('click', () => { for (const x of $('setTabs').children) x.classList.toggle('on', x === b); for (const p of document.querySelectorAll('#tab-settings .sp')) p.hidden = p.id !== 'set-' + b.dataset.set; });
  const P = UI.pref, sv = () => saveSettings();
  $('setQuality').value = game.qualitySetting; $('setSens').value = Input.sens; $('setVol').value = Audio2.vol; $('setMusic').value = Audio2.musicVol; $('setInvert').checked = Input.invertY; $('setFps').checked = game.showFps; $('setFlow').value = String(Env.dayLength);
  $('setLefty').checked = P.lefty; $('setBtn').value = P.btn; $('setText').value = String(P.ts); $('setContrast').checked = P.hc; $('setMotion').checked = P.reduce; $('setHold').checked = P.hold;
  $('setQuality').addEventListener('change', e => { game.qualitySetting = e.target.value; game.applyQuality(); });
  $('setGfx').value = G.backend === 'WebGPU' ? 'webgpu' : 'webgl'; $('setGfx').addEventListener('change', e => { saveSettings(); try { if (game.playing) save(); } catch (er) { } gfxPrefer(e.target.value); });
  $('setSens').addEventListener('input', e => { Input.sens = +e.target.value; });
  $('setVol').addEventListener('input', e => { Audio2.vol = +e.target.value; });
  $('setMusic').addEventListener('input', e => { Audio2.musicVol = +e.target.value; });
  $('setTime').addEventListener('input', e => { Env.hour = +e.target.value % 24; });
  $('setTime').addEventListener('change', () => npcSnapAll());
  $('setFlow').addEventListener('change', e => { Env.dayLength = +e.target.value; });
  $('setInvert').addEventListener('change', e => { Input.invertY = e.target.checked; });
  $('setFps').addEventListener('change', e => { game.showFps = e.target.checked; $('fps').hidden = !game.showFps; });
  { const b = $('perfCopy'); if (b) b.addEventListener('click', () => PerfHud.copy()); }
  $('setLefty').addEventListener('change', e => { P.lefty = e.target.checked; applyPrefs(); sv(); });
  $('setBtn').addEventListener('input', e => { P.btn = +e.target.value; applyPrefs(); });
  $('setText').addEventListener('change', e => { P.ts = +e.target.value; applyPrefs(); sv(); });
  $('setContrast').addEventListener('change', e => { P.hc = e.target.checked; applyPrefs(); sv(); });
  $('setMotion').addEventListener('change', e => { P.reduce = e.target.checked; applyPrefs(); sv(); });
  $('setHold').addEventListener('change', e => { P.hold = e.target.checked; applyPrefs(); sv(); });
  $('resetBtn').addEventListener('click', () => { clearSave(); try { localStorage.removeItem('brackenfell.hints'); } catch (e) { } location.reload(); });
  for (const id of ['updBtn', 'updBtn2']) $(id).addEventListener('click', () => { try { if (game.playing) save(); } catch (e) { } saveSettings(); Load.applyUpdate(); });
  $('pResume').addEventListener('click', () => UI.resume()); $('pJournal').addEventListener('click', () => openMenu('journal', true)); $('pSettings').addEventListener('click', () => openMenu('settings', true));
  $('fps').hidden = !game.showFps;
  $('kbNote').hidden = coarse(); $('setBtn').closest('.row').hidden = !coarse(); $('setHold').closest('.row').hidden = false;
  if (typeof GameMap !== 'undefined') GameMap.init();
}
// a newer build has been downloaded and is waiting: say so on the title screen, in Settings and once in play
UI.updateAvailable = () => {
  UI.updateReady = true; $('updateNote').hidden = false; $('updBtn').hidden = false;
  if (game.playing) toast('A newer build of Brackenfell is ready.', ['Reload', () => { try { save(); } catch (e) { } saveSettings(); Load.applyUpdate(); }]);
};
UI.storageNote = () => { if (typeof Load !== 'undefined' && Load.cached) UI.offline = 'works offline (' + (Load.cacheBytes / 1048576).toFixed(0) + ' MB kept on this device)'; };
// the "place discovered" banner and its mark on the map and compass. Others may call UI.discover('Some Name') when the player first reaches somewhere.
UI.disc = () => S.disc || (S.disc = {});
UI.discover = (name, id) => {
  const pl = id ? World.places.find(p => p.id === id) : World.places.find(p => p.name === name), key = pl ? pl.id : name, d = UI.disc();
  if (d[key]) return false; d[key] = 1; UI.hudT = Math.max(UI.hudT, 7);
  banner('Discovered', name || (pl && pl.name), 'disc');      // silent: the owner asked for no jingle on discovery
  try { save(); } catch (e) { } return true;
};
function onKey(e) {
  if (!game.playing) return;
  const c = e.code;
  if (UI.paused && !UI.menu) { if (c === 'Escape' || c === 'Enter' || c === 'Space') UI.resume(); return; }
  if (UI.talk) { if (c === 'Escape') endTalk(); const n = +e.key; if (n >= 1 && n <= 9) { const b = $('dopts').children[n - 1]; if (b) b.click(); } return; }
  if (UI.reader) { if (c === 'Escape' || c === 'KeyE' || c === 'Enter') closeReader(); return; }
  if (UI.menu) { if (c === 'Escape' || c === 'Tab' || c === 'KeyJ' || (c === 'KeyM' && !$('tab-map').hidden)) closeMenu(); else if (c === 'KeyM') showTab('map'); return; }
  if (c === 'KeyE' || c === 'KeyF' || c === 'Enter') { if (UI.prompt) { if (typeof Feel !== 'undefined') Feel.did('use'); interactUse(UI.prompt); } }
  else if (c === 'Tab' || c === 'KeyJ') openMenu('journal'); else if (c === 'KeyI') openMenu('pack'); else if (c === 'KeyM') openMenu('map');
  else if (c === 'Escape') UI.pause('esc');
}
// Esc while the pointer is captured releases it (the page never sees the key): that is the pause
function onPointerUnlock() { if (game.playing && !uiBusy() && !Input.touch && !TEST) UI.pause('esc'); }
// ── pause: Esc, a hidden tab, a locked phone, a portrait phone. Saves first, freezes the world (frame() draws but does not step), mutes the audio ──
UI.pause = why => {
  if (!game.playing || UI.paused) return;
  UI.paused = true; UI.pauseWhy = why; try { save(); } catch (e) { } saveSettings(); releaseLook(); Player.locked = true;
  if (Audio2.ctx && Audio2.ctx.state === 'running') Audio2.ctx.suspend();
  $('pauseNote').textContent = why === 'hidden' ? 'Your progress is saved while you are away.' : why === 'turn' ? 'Turn your phone sideways to carry on.' : 'Your progress is saved.';
  if (!UI.menu) $('pause').hidden = false;
};
UI.resume = () => {
  if (!UI.paused) return; UI.paused = false; $('pause').hidden = true; if (UI.menu) { closeMenu(); }
  Player.locked = uiBusy(); if (Audio2.ctx && game.playing) Audio2.ctx.resume(); lastT = performance.now();
  if (!Input.touch && !coarse() && !TEST && !UI.talk) { try { const p = G.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
};
UI.lifecycle = () => {
  document.addEventListener('visibilitychange', () => { lastT = performance.now(); if (document.hidden) { try { if (game.playing && !(typeof RPG !== 'undefined' && RPG.dead)) save(); } catch (e) { } if (!TEST) UI.pause('hidden'); else if (Audio2.ctx) Audio2.ctx.suspend(); } else if (Audio2.ctx && game.playing && !UI.paused) Audio2.ctx.resume(); });
  addEventListener('pagehide', () => { try { if (game.playing) { save(); saveSettings(); } } catch (e) { } });
  const mq = window.matchMedia ? matchMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 760px)') : null;
  const turn = () => { UI.portrait = !!(mq && mq.matches); if (UI.portrait) { if (game.playing && !UI.paused) { UI.pause('turn'); UI.turnPaused = true; } } else if (UI.turnPaused) { UI.turnPaused = false; if (UI.paused && UI.pauseWhy === 'turn') UI.resume(); } };
  if (mq) { (mq.addEventListener ? mq.addEventListener('change', turn) : mq.addListener(turn)); turn(); }
};
// ── per-frame HUD: what can be used, compass, clock, places, quiet fades ──
function uiFrame(dt) {
  const P = Player;
  let best = null, bs = -1e9, bp = null; const fx = Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch), ex = P.pos[0], ey = P.pos[1] + P.eye, ez = P.pos[2];
  if (!P.locked) {
    const test = (it, p, r) => { const dx = p[0] - ex, dy = p[1] - ey, dz = p[2] - ez, d = hyp(dx, dy, dz); if (d > r) return; const dot = (dx * fx + dy * fy + dz * fz) / (d || 1); if (dot < (d > 0.9 ? 0.5 : 0.15)) return;       /* within 60 degrees of where you look (was 70, and anything at all within 0.9 m, behind you included) */ let sc = dot * 6 - d * 0.35 /* what you look at wins over what is merely nearer: a bed with a chest at its foot offered only the chest (bug 8) */; const lb = sc > bs - 4 && interactLabel(it); if (lb === 'Empty') sc -= 4;       /* an emptied box never hides something usable behind it (the smugglers' door is behind the pulled bricks) */ if (sc > bs && lb && (it.thru || !World.sightBlocked(ex, ey, ez, p[0], p[1], p[2], it.npc ? 0.5 : 0))) { bs = sc; best = it; bp = p; } };
    for (const it of World.interact) { if (it.zone !== undefined && it.zone !== World.camZone && it.zone !== 0 && World.camZone !== 0) continue; test(it, it.p, it.r || 2); }
    for (const n of NPCS) { if (!TALK[n.id]) continue;       /* [audit, interim] someone with nothing written to say is not offered for talk and is not named: 63 people answered "..." (until docs/PEOPLE.md gives them lines) */ if (!n.io) n.io = { npc: n }; if (hyp(n.pos[0] - ex, n.pos[2] - ez) < 3.2) test(n.io, [n.pos[0], n.pos[1] + (n.anim === 'lie' ? 0.3 : n.anim === 'sit' ? 1.0 : 1.35 * n.scale), n.pos[2]], 2.9); }
  }
  const lab = best ? interactLabel(best) : null;
  if (best !== UI.prompt || (best && lab !== UI.promptLab)) {
    UI.prompt = best; UI.promptLab = lab; const a = $('act'); a.hidden = !best;
    if (best) { const [v, rest] = promptParts(lab); $('actVerb').textContent = v; $('actName').textContent = rest; $('actLabel').textContent = lab; $('actKey').textContent = 'E'; }
  }
  UI.promptPos = bp;
  // compass: the cardinal points, a gold diamond for each active quest, a small mark and name for places you have found
  if (Math.abs(P.yaw - UI.lastYaw) > 0.002 || (R.frame & 15) === 0) {
    UI.lastYaw = P.yaw; const span = 1.9;
    for (const c of UI.compass) { const d = angDiff(c.a, P.yaw); c.el.style.display = Math.abs(d) < span / 2 ? '' : 'none'; c.el.style.left = (50 + d / span * 100) + '%'; }
    let k = 0;
    for (const id of QORDER) { if (!S.q[id] || S.q[id].done || k >= UI.marks.length) continue; const t = CELLS_ON ? Cells.mapTarget(questTarget(id)) : questTarget(id); if (!t) continue; const m = UI.marks[k++], d = clamp(angDiff(headingTo(ex, ez, t[0], t[2]), P.yaw), -span * 0.44, span * 0.44), dist = hyp(t[0] - ex, t[2] - ez); m.el.style.display = ''; m.d.style.display = ''; m.el.style.left = m.d.style.left = (50 + d / span * 100) + '%'; m.d.textContent = dist < 4 ? '' : Math.round(dist) + ' m'; }
    for (; k < UI.marks.length; k++) { UI.marks[k].el.style.display = 'none'; UI.marks[k].d.style.display = 'none'; }
    // discovered places in view (nearest first); the nearest few get a name
    let j = 0; const dsc = UI.disc();
    if (S.disc) { const seenIn = []; for (const pl of World.places) { if (!dsc[pl.id] || pl.id.startsWith('camp.') && false) continue; const d = angDiff(headingTo(ex, ez, pl.x, pl.z), P.yaw), dist = hyp(pl.x - ex, pl.z - ez); if (Math.abs(d) < span * 0.5 && dist > 6) seenIn.push([dist, d, pl]); }
      seenIn.sort((a, b) => a[0] - b[0]); for (const [dist, d, pl] of seenIn) { if (j >= UI.pmarks.length) break; const m = UI.pmarks[j++], l = (50 + d / span * 100) + '%'; m.el.style.display = ''; m.el.style.left = l; m.n.style.display = j <= 2 ? '' : 'none'; m.n.style.left = l; m.n.textContent = pl.name.replace(/^(The|Brackenfell) /, ''); } }
    for (; j < UI.pmarks.length; j++) { UI.pmarks[j].el.style.display = 'none'; UI.pmarks[j].n.style.display = 'none'; }
  }
  if ((R.frame & 31) === 0) {
    const h = Math.floor(Env.hour), m = Math.floor((Env.hour - h) * 60 / 10) * 10; const part = Env.hour < 5 ? 'Night' : Env.hour < 8 ? 'Dawn' : Env.hour < 12 ? 'Morning' : Env.hour < 17 ? 'Afternoon' : Env.hour < 20.5 ? 'Dusk' : 'Night';
    $('clock').textContent = part + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); if (part !== UI.lastPart) { if (UI.lastPart) UI.hudT = Math.max(UI.hudT, 5); UI.lastPart = part; } uiObjective();
    for (const pl of World.places) { if (UI.disc()[pl.id] || hyp(pl.x - ex, pl.z - ez) > pl.r) continue; if (game.clock > 3 && !pl.minor) { UI.discover(pl.name, pl.id); break; } else UI.disc()[pl.id] = 1; }      // minor places (ordinary buildings) are marked seen without a banner
  }
  // quiet HUD: the quest text, clock and purse rest a few seconds after the last change
  UI.hudT -= dt; const q = UI.hudT <= 0 && !uiBusy(); if (q !== UI.quiet) { UI.quiet = q; $('hud').classList.toggle('quiet', q); }
  // The game saved only at certain moments (a chest, a quest step), so experience, a level, coin spent at the bar or a flag set in talk could be lost
  // to a crash or to the phone dropping the tab. Now also every 10 s of play, and whenever the page is hidden (visibilitychange below: on iOS a
  // tab in the background is often discarded without a pagehide).
  UI.saveT = (UI.saveT || 0) + dt; if (UI.saveT > 10 && game.playing && !uiBusy() && !Cells.busy && !(typeof RPG !== 'undefined' && RPG.dead)) { UI.saveT = 0; save(); }
  // "click to look" for a mouse that has not captured the pointer
  const cue = !Input.touch && !Input.plock && !UI.talk && !uiBusy() && !coarse() && !TEST; if (cue !== UI.cue) { UI.cue = cue; $('lookcue').hidden = !cue; }
  if (typeof Feel !== 'undefined') Feel.hintFrame(dt);
}
