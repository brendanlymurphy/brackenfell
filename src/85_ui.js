// ───────────────────────── HUD, dialogue, journal ─────────────────────────
const $ = id => document.getElementById(id);
const UI = { talk: null, menu: false, reader: false, prompt: null, compass: [], seen: {}, placeT: 0, lastYaw: 9, lastObj: '' };
function toast(html) { const d = document.createElement('div'); d.innerHTML = html; $('toasts').appendChild(d); setTimeout(() => d.remove(), 5300); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); }
function banner(small, big) { const p = $('place'); p.innerHTML = '<small>' + small + '</small>' + big; p.classList.add('on'); clearTimeout(UI.placeT); UI.placeT = setTimeout(() => p.classList.remove('on'), 3800); }
function fadeDo(fn) { const f = $('fade'); f.classList.add('on'); Player.locked = true; setTimeout(() => { fn(); setTimeout(() => { f.classList.remove('on'); Player.locked = uiBusy(); }, 350); }, 950); }
const uiBusy = () => !!(UI.talk || UI.menu || UI.reader);
function uiPurse() { $('purse').textContent = S.gold + ' gold'; }
function uiObjective() {
  let h = ''; const act = QORDER.filter(id => S.q[id] && !S.q[id].done).sort((a, b) => S.q[b].t - S.q[a].t).slice(0, 3);
  for (const id of act) { let st = QUESTS[id].stages[S.q[id].stage]; if (id === 'herbs' && S.q[id].stage === 0) st += ' (' + Math.min(frostN(), 5) + ' of 5)'; h += '<div><b>' + QUESTS[id].name + '</b>' + st + '</div>'; }
  if (h !== UI.lastObj) { $('objective').innerHTML = h; UI.lastObj = h; }
}
function releaseLook() { if (document.pointerLockElement) document.exitPointerLock(); Input.joy = null; Input.joyT = null; Input.look = null; $('stick').style.display = 'none'; }
// ── dialogue ──
function startTalk(npc) {
  UI.talk = npc; npc.talking = true; Player.locked = true; releaseLook();
  npc.yawBefore = npc.yaw; if (npc.anim !== 'sit' && npc.anim !== 'lie') npc.yaw = headingTo(npc.pos[0], npc.pos[2], Player.pos[0], Player.pos[2]);
  $('dname').textContent = npc.name; $('dialog').hidden = false; $('act').hidden = true;
  showNode((TALK[npc.id] || (() => node('...')))()); Audio2.ui();
}
function showNode(n) {
  if (!n) return endTalk();
  $('dtext').textContent = n.t; const box = $('dopts'); box.textContent = '';
  n.o.forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o[0]; if (o[2]) b.className = 'quest'; b.onclick = () => { Audio2.ui(); showNode(o[1] ? o[1]() : null); }; box.appendChild(b); if (i === 0 && !Input.touch) setTimeout(() => b.focus(), 30); });
}
function endTalk() { const n = UI.talk; if (n) { n.talking = false; if (n.path) n.yaw = n.yawBefore; } UI.talk = null; $('dialog').hidden = true; Player.locked = uiBusy(); uiObjective(); }
function openReader(title, text) { UI.reader = true; Player.locked = true; releaseLook(); $('rtitle').textContent = title; $('rtext').textContent = text; $('reader').hidden = false; Audio2.page(); }
function closeReader() { UI.reader = false; $('reader').hidden = true; Player.locked = uiBusy(); }
// ── journal / pack / settings ──
function openMenu(tab) {
  UI.menu = true; Player.locked = true; releaseLook(); $('menu').hidden = false; showTab(tab || 'journal'); Audio2.page();
  let h = ''; for (const id of QORDER) { const q = S.q[id]; if (!q) continue; h += '<h3>' + QUESTS[id].name + '</h3>'; QUESTS[id].stages.forEach((s, i) => { if (i < q.stage || q.done) h += '<p class="done">' + s + '</p>'; else if (i === q.stage) h += '<p>' + s + (id === 'herbs' && i === 0 ? ' (' + Math.min(frostN(), 5) + ' of 5)' : '') + '</p>'; }); }
  $('tab-journal').innerHTML = h || '<p class="empty">Nothing yet. Speak with the guard at the gate.</p>';
  Inv.render(); $('setTime').value = Env.hour;
  const inf = G.gpuName || ''; $('diag').textContent = 'Build 11 \u00b7 ' + G.backend + (G.gfxWhy ? ' (' + G.gfxWhy.slice(0, 90) + ')' : '') + (G.chars ? '' : ' \u00b7 old villagers') + ' \u00b7 textures ' + (G.pack || '?') + (G.packNote ? ' (' + G.packNote.slice(0, 60) + ')' : '') + (inf ? ' (' + inf + ')' : '') + ' \u00b7 ' + G.w + ' \u00d7 ' + G.h + ' at ' + Math.round(R.scale * 100) + '% \u00b7 detail ' + game.tier + (Perf.T > 20 ? ' \u00b7 browser cap ' + Math.round(1000 / Perf.T) + ' fps' : '') + (G.errors.length ? ' \u00b7 ' + G.errors.length + ' warnings: ' + G.errors[0].slice(0, 160) : '');
}
function showTab(t) { for (const b of $('tabs').querySelectorAll('[data-tab]')) { const on = b.dataset.tab === t; b.classList.toggle('on', on); $('tab-' + b.dataset.tab).hidden = !on; } }
function closeMenu() { UI.menu = false; $('menu').hidden = true; Player.locked = uiBusy(); saveSettings(); }
function saveSettings() { try { localStorage.setItem('brackenfell.set', JSON.stringify({ q: game.qualitySetting, sens: Input.sens, vol: Audio2.vol, music: Audio2.musicVol, inv: Input.invertY, fps: game.showFps, flow: Env.dayLength })); } catch (e) { } }
function loadSettings() { try { const j = JSON.parse(localStorage.getItem('brackenfell.set') || 'null'); if (!j) return; if (j.q) game.qualitySetting = j.q; Input.sens = j.sens || 1; Audio2.vol = j.vol === undefined ? 0.8 : j.vol; Audio2.musicVol = j.music === undefined ? 0.6 : j.music; Input.invertY = !!j.inv; game.showFps = !!j.fps; if (j.flow !== undefined) Env.dayLength = j.flow; } catch (e) { } }
function uiInit() {
  const tr = $('ctrack');
  for (const [l, a, minor] of [['N', 0], ['NE', 45, 1], ['E', 90], ['SE', 135, 1], ['S', 180], ['SW', 225, 1], ['W', 270], ['NW', 315, 1]]) { const s = document.createElement('span'); s.textContent = l; if (minor) s.className = 'minor'; tr.appendChild(s); UI.compass.push({ el: s, a: a * PI / 180 }); }
  UI.marks = []; for (let i = 0; i < 4; i++) { const m = document.createElement('span'); m.className = 'mark'; const d = document.createElement('span'); d.className = 'dist'; tr.appendChild(m); tr.appendChild(d); UI.marks.push({ el: m, d }); }
  $('act').addEventListener('click', e => { e.preventDefault(); if (UI.prompt && !Player.locked) interactUse(UI.prompt); });
  $('menuBtn').addEventListener('click', () => openMenu()); $('mclose').addEventListener('click', closeMenu); $('rclose').addEventListener('click', closeReader);
  for (const b of $('tabs').querySelectorAll('[data-tab]')) b.addEventListener('click', () => showTab(b.dataset.tab));
  $('setQuality').value = game.qualitySetting; $('setSens').value = Input.sens; $('setVol').value = Audio2.vol; $('setMusic').value = Audio2.musicVol; $('setInvert').checked = Input.invertY; $('setFps').checked = game.showFps; $('setFlow').value = String(Env.dayLength);
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
  $('resetBtn').addEventListener('click', () => { clearSave(); location.reload(); });
  $('fps').hidden = !game.showFps;
}
function onKey(e) {
  if (!game.playing) return;
  const c = e.code;
  if (UI.talk) { if (c === 'Escape') endTalk(); const n = +e.key; if (n >= 1 && n <= 9) { const b = $('dopts').children[n - 1]; if (b) b.click(); } return; }
  if (UI.reader) { if (c === 'Escape' || c === 'KeyE' || c === 'Enter') closeReader(); return; }
  if (UI.menu) { if (c === 'Escape' || c === 'Tab' || c === 'KeyJ') closeMenu(); return; }
  if (c === 'KeyE' || c === 'KeyF' || c === 'Enter') { if (UI.prompt) interactUse(UI.prompt); }
  else if (c === 'Tab' || c === 'KeyJ') openMenu('journal'); else if (c === 'KeyI') openMenu('pack');
}
function onPointerUnlock() { if (game.playing && !uiBusy() && !Input.touch && !TEST) openMenu('settings'); }
// per-frame HUD: prompt, compass, clock, place names
function uiFrame(dt) {
  const P = Player;
  // nearest thing to use, in front of the player
  let best = null, bs = -1e9; const fx = Math.sin(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch), ex = P.pos[0], ey = P.pos[1] + P.eye, ez = P.pos[2];
  if (!P.locked) {
    const test = (it, p, r) => { const dx = p[0] - ex, dy = p[1] - ey, dz = p[2] - ez, d = hyp(dx, dy, dz); if (d > r) return; const dot = (dx * fx + dy * fy + dz * fz) / (d || 1); if (dot < 0.35 && d > 0.9) return; const sc = dot * 2 - d * 0.35; if (sc > bs && interactLabel(it)) { bs = sc; best = it; } };
    for (const it of World.interact) { if (it.zone !== undefined && it.zone !== World.camZone && it.zone !== 0 && World.camZone !== 0) continue; test(it, it.p, it.r || 2); }
    for (const n of NPCS) { if (!n.io) n.io = { npc: n }; if (hyp(n.pos[0] - ex, n.pos[2] - ez) < 3.2) test(n.io, [n.pos[0], n.pos[1] + (n.anim === 'lie' ? 0.3 : n.anim === 'sit' ? 1.0 : 1.35 * n.scale), n.pos[2]], 2.9); }
  }
  if (best !== UI.prompt) { UI.prompt = best; const a = $('act'); a.hidden = !best; if (best) { $('actLabel').textContent = interactLabel(best); $('actKey').textContent = Input.touch ? '•' : 'E'; } }
  // compass
  if (Math.abs(P.yaw - UI.lastYaw) > 0.002 || (R.frame & 15) === 0) {
    UI.lastYaw = P.yaw; const W = $('compass').clientWidth || 300, span = 1.9;
    for (const c of UI.compass) { const d = angDiff(c.a, P.yaw); c.el.style.display = Math.abs(d) < span / 2 ? '' : 'none'; c.el.style.left = (50 + d / span * 100) + '%'; }
    let k = 0;
    for (const id of QORDER) { if (!S.q[id] || S.q[id].done || k >= UI.marks.length) continue; const t = questTarget(id); if (!t) continue; const m = UI.marks[k++], d = clamp(angDiff(headingTo(ex, ez, t[0], t[2]), P.yaw), -span * 0.44, span * 0.44), dist = hyp(t[0] - ex, t[2] - ez); m.el.style.display = ''; m.d.style.display = ''; m.el.style.left = m.d.style.left = (50 + d / span * 100) + '%'; m.d.textContent = dist < 4 ? '' : Math.round(dist) + ' m'; }
    for (; k < UI.marks.length; k++) { UI.marks[k].el.style.display = 'none'; UI.marks[k].d.style.display = 'none'; }
  }
  if ((R.frame & 31) === 0) { const h = Math.floor(Env.hour), m = Math.floor((Env.hour - h) * 60 / 10) * 10; const part = Env.hour < 5 ? 'Night' : Env.hour < 8 ? 'Dawn' : Env.hour < 12 ? 'Morning' : Env.hour < 17 ? 'Afternoon' : Env.hour < 20.5 ? 'Dusk' : 'Night'; $('clock').textContent = part + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); uiObjective();
    for (const pl of World.places) { if (UI.seen[pl.id] || hyp(pl.x - ex, pl.z - ez) > pl.r) continue; UI.seen[pl.id] = 1; if (game.clock > 4) banner('Discovered', pl.name); break; } }
}
