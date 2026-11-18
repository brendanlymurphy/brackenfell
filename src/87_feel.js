// ───────────────────────── game feel: the camera, the first two minutes, hints, and the ink marks drawn over the view ─────────────────────────
// Feel.post(dt) runs once a tick right after playerUpdate and owns the final camera pose while the player is in the world:
//   head bob matched to stride length and speed (and a little to the surface), a lateral sway, a landing dip, roll when strafing, a wider
//   field of view when sprinting, breathing when still, and a smooth settle after a fade. All of it is off under Settings > Reduce motion.
// During dialogue the camera eases to frame the speaker in the upper part of the view (the words sit below).
const Feel = {
  reduce: false, t: 0, roll: 0, fov: 0, dipK: 0, lastDip: 0, settleT: 0, bobS: 0, base: 0.92, talkNpc: null, talkT: 0,
  intro: null, hints: null, tipT: 0, tipKey: '', moved: 0, turned: 0, last: null, greeted: false, usedSeen: 0, playT: 0,
};
const FEEL_SURF = { wood: 1.12, stone: 1.18, dirt: 0.92, grass: 0.82, water: 0.55 };
Feel.post = function (dt) {
  const P = Player, cam = R.cam; Feel.t += dt;
  if (!Feel.base0) Feel.base0 = Feel.base = cam.fovMin;
  const rm = Feel.reduce, base = Feel.base0;
  // landing: the dip playerUpdate computed also nudges the view down and back, once
  if (P.dip > Feel.lastDip + 0.02 && !rm) Feel.dipK = Math.min(0.045, P.dip * 0.28);
  Feel.lastDip = P.dip; Feel.dipK += (0 - Feel.dipK) * Math.min(1, dt * 7);
  const sp = P.speed, run = sp > 4;
  // roll into a sideways step, FOV out with a sprint; both ease, neither snaps
  const rx = Math.cos(P.yaw), rz = Math.sin(P.yaw), side = P.vel[0] * rx + P.vel[2] * rz;
  const rollT = rm || !P.onGround || Player.locked ? 0 : -clamp(side / 5.4, -1, 1) * 0.024;
  Feel.roll += (rollT - Feel.roll) * Math.min(1, dt * 6);
  let fovT = base + (!rm && run && P.onGround && !Player.locked ? 0.075 : 0) - (Feel.talkNpc && !rm ? 0.07 : 0);
  if (Feel.settleT > 0) { Feel.settleT = Math.max(0, Feel.settleT - dt); fovT += 0.06 * smooth(0, 1, Feel.settleT / 1.1); }
  Feel.fov += (fovT - Feel.fov) * Math.min(1, dt * (Feel.settleT > 0 ? 2.2 : 4.5)); if (!Feel.fov) Feel.fov = fovT;
  cam.fovMin = Feel.fov;
  // bob: amplitude grows with speed, the phase is the stride (P.step already advances with distance), the surface changes its bite
  const amp = rm ? 0 : (0.012 + 0.02 * sat((sp - 1.6) / 3.8)) * (FEEL_SURF[P.surface] || 1) * P.bobAmt;
  const ph = P.step * TAU, bob = Math.sin(ph) * amp, lat = Math.sin(ph * 0.5) * amp * 0.42;
  const still = rm ? 0 : sat(1 - P.bobAmt * 1.4), br = Math.sin(Feel.t * 1.15) * 0.0032 * still, brp = Math.sin(Feel.t * 0.8 + 1.3) * 0.0011 * still;
  let y = P.camY + P.eye - (rm ? 0 : P.dip) + bob + br; if (rm) y = P.camY + P.eye;
  cam.pos[0] = P.pos[0] + rx * lat; cam.pos[1] = y; cam.pos[2] = P.pos[2] + rz * lat;
  cam.yaw = P.yaw + (rm ? 0 : Math.cos(P.step * PI) * 0.0022 * P.bobAmt + brp);
  cam.pitch = P.pitch - Feel.dipK + (rm ? 0 : br * 0.5 + (Feel.settleT > 0 ? -0.035 * smooth(0, 1, Feel.settleT / 1.1) : 0));
  cam.roll = Feel.roll + (rm ? 0 : lat * 0.05);
  // dialogue framing and the held opening shot move the player's own view (so it stays where it settles)
  if (Feel.talkNpc) {
    /* [cast] FIRSTTEN 14, owner: the speaker's head is in the upper half of the view, clear of the subtitle, and nothing stands between you and it. The head is
       found from the body's own head bone (a seated villager's head was assumed 1.22 m above a point that is already the seat, and fell to the bottom edge
       under the subtitle); the view is pitched so the head sits a third of the way down. If a shelf, a beam or a chest is in the way, you step to the nearest
       place round the speaker where the line is clear (Feel.talkPlace, once per conversation). */
    const n = Feel.talkNpc, e = [P.pos[0], P.camY + P.eye, P.pos[2]], hb = n.ch && n.ch.bones && n.ch.bones.head;
    let hy = n.pos[1] + (n.anim === 'lie' ? 0.5 : n.anim === 'sit' ? 1.22 : 1.56 * (n.scale || 1)), hx = n.pos[0], hz = n.pos[2];
    if (hb && n.ch.pivot && n.ch.pivot.visible !== false) { hb.getWorldPosition(Feel._hv || (Feel._hv = new THREE.Vector3())); if (Math.abs(Feel._hv.y - n.pos[1]) < 2.4) { hy = Feel._hv.y + 0.07; hx = Feel._hv.x; hz = Feel._hv.z; } }
    if (!Feel.talkPlaced) { Feel.talkPlaced = true; Feel.talkPlace(n, [hx, hy, hz]); }
    if (Feel.talkMove) { const m = Feel.talkMove, q = Math.min(1, dt * 6); P.pos[0] += (m[0] - P.pos[0]) * q; P.pos[2] += (m[2] - P.pos[2]) * q; if (Math.hypot(m[0] - P.pos[0], m[2] - P.pos[2]) < 0.02) Feel.talkMove = null; }
    const d = hyp(hx - e[0], hz - e[2]) || 1, fovy = (R.camera && R.camera.fov ? R.camera.fov * Math.PI / 180 : 0.92), up = Math.atan(0.36 * Math.tan(fovy / 2));
    const yawT = headingTo(e[0], e[2], hx, hz) + 0.04, pitT = clamp(Math.atan2(hy - e[1], d) - up, -1.2, 1.2), k = Math.min(1, dt * (rm ? 30 : 3.2));
    P.yaw += angDiff(yawT, P.yaw) * k; P.pitch += (pitT - P.pitch) * k;
  }
  Feel.introFrame(dt);
};
Feel.talk = npc => { Feel.talkNpc = npc; Feel.talkPlaced = false; Feel.talkMove = null; };
// [cast] where to stand to talk: here if the line from the eye to the speaker's head is clear and nothing hangs over your head; otherwise the nearest clear place
// on a ring round the speaker (1.1 to 1.9 m, on the same floor, not in anything solid)
Feel.talkPlace = (n, h) => {
  const P = Player, eyeAt = (x, y, z) => [x, y + P.eye, z], clear = (x, y, z) => { const e = eyeAt(x, y, z); return !World.sightBlocked(e[0], e[1], e[2], h[0], h[1], h[2], 0.35) && !World.sightBlocked(x, y + 0.5, z, x, e[1] + 0.25, z + 0.001, 0.05) && !World.blockedAt(x, z, 0.28); };
  if (clear(P.pos[0], P.pos[1], P.pos[2])) return;
  const a0 = Math.atan2(P.pos[0] - n.pos[0], -(P.pos[2] - n.pos[2])); let best = null, bs = 1e9;
  for (const r of [1.3, 1.6, 1.1, 1.9]) for (let i = 0; i < 16; i++) { const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 8, x = n.pos[0] + Math.sin(a) * r, z = n.pos[2] - Math.cos(a) * r, g = World.groundAt(x, z, P.pos[1] + 0.6);
    if (Math.abs(g - P.pos[1]) > 0.35 || !clear(x, g, z)) continue; const sc = Math.hypot(x - P.pos[0], z - P.pos[2]) + Math.abs(r - 1.4); if (sc < bs) { bs = sc; best = [x, g, z]; } }
  if (best && bs < 4) Feel.talkMove = best;
};
Feel.talkEnd = () => { Feel.talkNpc = null; Feel.settleT = Math.max(Feel.settleT, 0.01); };
Feel.settle = () => { if (!Feel.reduce) Feel.settleT = 1.1; };

// ── the opening: a new game starts on the road above the town at dawn, a held shot of the valley with the title, then control ──
Feel.START = { x: -132, z: -7, yaw: 90, pitch: 3 };
Feel.begin = () => {
  const s = Feel.START, P = Player; Env.hour = 6.1; npcSnapAll();
  P.pos = [s.x, World.groundAt(s.x, s.z, 1e9), s.z]; P.vel = [0, 0, 0]; P.yaw = s.yaw * PI / 180; P.pitch = s.pitch * PI / 180; P.camY = P.pos[1];
  Feel.intro = { t: 0, len: Feel.reduce ? 3.2 : 6.2, y0: P.pitch }; Player.locked = true; document.body.classList.add('cine'); $('hud').style.opacity = '0';
  setTimeout(() => { if (Feel.intro) banner('The Greyspine Valley', 'Brackenfell'); }, 700);
};
Feel.introFrame = dt => {
  const I = Feel.intro; if (!I) return; const P = Player;
  I.t += dt; const k = I.t / I.len;
  if (!Feel.reduce) { const dir = [Math.sin(P.yaw), -Math.cos(P.yaw)]; P.pos[0] += dir[0] * 0.38 * dt; P.pos[2] += dir[1] * 0.38 * dt; P.pitch = I.y0 - 0.03 * smooth(0, 1, k); }
  if (k > 0.8) $('hud').style.opacity = String(Math.min(1, (k - 0.8) / 0.2));
  if (I.t >= I.len) { Feel.intro = null; document.body.classList.remove('cine'); $('hud').style.opacity = ''; Player.locked = uiBusy(); Feel.playT = 0; if (qAt('welcome') < 0) qStart('welcome'); Feel.tip('goal'); }
};

// ── hints: a few notes, each shown only until the player has done the thing ──
const FEEL_HINTS = {
  goal: () => 'Warden Hale waits at the gate, up the road. <b>Follow the gold mark on the compass.</b>',
  move: () => Input.touch || coarse() ? 'Touch and drag on the <b>left</b> to walk. Push the stick all the way over to run.' : '<b>W A S D</b> to walk, <b>Shift</b> to run.',
  look: () => Input.touch || coarse() ? 'Drag on the <b>right</b> to look around.' : 'Move the <b>mouse</b> to look around. <b>Esc</b> pauses.',
  use: () => UI.prompt ? (Input.touch || coarse() ? 'Tap <b>' + $('actVerb').textContent + '</b> to ' + $('actVerb').textContent.toLowerCase() + ' it.' : 'Press <b>E</b> to ' + $('actVerb').textContent.toLowerCase() + '.') : '',
  fight: () => Input.touch || coarse() ? 'The <b>sword</b> strikes; hold it for a heavy blow. The <b>shield</b> blocks: raise it just as the blow comes and it is turned aside. The <b>arrows</b> dodge.' : '<b>Click</b> to strike; hold for a heavy blow. <b>Right button</b> blocks: raise it just as the blow comes and it is turned aside. <b>Q</b> dodges.',       /* [logic] fighting was explained nowhere */
  journal: () => Input.touch || coarse() ? 'Tap the <b>menu</b> button for your journal, pack and map.' : 'Press <b>Tab</b> for your journal, <b>M</b> for the map.',
};
Feel.load = () => { try { Feel.hints = JSON.parse(localStorage.getItem('brackenfell.hints') || 'null'); } catch (e) { } if (!Feel.hints) Feel.hints = {}; };
Feel.did = k => { if (!Feel.hints) Feel.load(); if (Feel.hints[k]) return; Feel.hints[k] = 1; try { localStorage.setItem('brackenfell.hints', JSON.stringify(Feel.hints)); } catch (e) { } if (Feel.tipKey === k || (k === 'move' && Feel.tipKey === 'goal')) Feel.tipHide(); };
Feel.tip = key => {
  if (!Feel.hints) Feel.load(); if (Feel.hints[key] && key !== 'goal') return; const t = FEEL_HINTS[key](); if (!t) return;
  const el = $('tip'); el.innerHTML = t; el.classList.remove('out'); el.hidden = false; Feel.tipKey = key; Feel.tipT = key === 'use' ? 4.5 : 9;
};
Feel.tipHide = () => { const el = $('tip'); el.classList.add('out'); Feel.tipKey = ''; setTimeout(() => { if (!Feel.tipKey) el.hidden = true; }, 650); };
Feel.hintFrame = dt => {
  if (!Feel.hints) Feel.load(); const P = Player, H = Feel.hints;
  if (Feel.intro) return;
  if (!Feel.last) Feel.last = [P.pos[0], P.pos[2], P.yaw];
  const mv = hyp(P.pos[0] - Feel.last[0], P.pos[2] - Feel.last[1]); if (mv < 3) Feel.moved += mv; Feel.turned += Math.abs(angDiff(P.yaw, Feel.last[2])); Feel.last = [P.pos[0], P.pos[2], P.yaw];
  if (!P.locked) Feel.playT += dt;
  if (!H.fight && typeof Combat !== 'undefined' && typeof RPG !== 'undefined' && (Combat.blocking() || RPG.dodgeT > 0)) Feel.did('fight');
  if (Feel.moved > 5) Feel.did('move'); if (Feel.turned > 1.4 && Feel.moved > 0.5) Feel.did('look');
  if (uiBusy()) { if (Feel.tipKey) Feel.tipHide(); return; }
  if (Feel.tipKey) { Feel.tipT -= dt; if (Feel.tipT <= 0) { const was = Feel.tipKey; Feel.tipHide(); Feel.shownAt = Feel.t; } return; }
  if (Feel.t - (Feel.shownAt || 0) < 3.2) return;
  // in order: walk, look, use what you are facing, open the journal. Each is offered at most a few times.
  const tryTip = k => { if (H[k]) return false; Feel.counts = Feel.counts || {}; if ((Feel.counts[k] = (Feel.counts[k] || 0)) >= 3) return false; Feel.counts[k]++; Feel.tip(k); return true; };
  if (!H.fight && typeof Foes !== 'undefined' && typeof Combat !== 'undefined') { if (Foes.list.some(f => f.alive && (f.state === 'notice' || f.state === 'chase' || f.state === 'attack')) && tryTip('fight')) return; }
  if (!H.move) { if (Feel.playT > 1.2 && Feel.playT < 40 && tryTip('move')) return; }
  else if (!H.look) { if (tryTip('look')) return; }
  else if (!H.use && UI.prompt) { if (tryTip('use')) return; }
  else if (!H.journal && H.use && Feel.playT > 60 && S.q.welcome) { if (tryTip('journal')) return; }
  // a greeting when the warden first sees you
  if (!Feel.greeted && NPC.hale && qAt('welcome') === 0 && hyp(NPC.hale.pos[0] - P.pos[0], NPC.hale.pos[2] - P.pos[2]) < 8) { Feel.greeted = true; toast('<b>Warden Hale</b> “Hold there, traveller.”'); }
};

// ── ink marks drawn over the view on one 2D canvas (no extra 3D pass, so it costs the same on Low): the thing you are looking at, where doors lead,
// a faint glint on things worth taking, and the quest giver when he is in sight ──
const Mark = { cv: null, ctx: null, w: 0, h: 0, dpr: 1, drawn: false, v: null, glint: [], tmp: [0, 0, 0] };
Mark.init = () => { Mark.cv = $('ovl'); Mark.ctx = Mark.cv.getContext('2d'); Mark.v = new THREE.Vector3(); Mark.size(); addEventListener('resize', Mark.size); };
Mark.size = () => { const d = Math.min(window.devicePixelRatio || 1, 2); Mark.dpr = d; Mark.w = innerWidth; Mark.h = innerHeight; Mark.cv.width = Math.round(Mark.w * d); Mark.cv.height = Math.round(Mark.h * d); };
// world point -> screen pixels, or null when behind the camera / far off to the side
Mark.at = (x, y, z) => { const v = Mark.v.set(x, y, z).project(R.camera); if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.15) return null; return [(v.x * 0.5 + 0.5) * Mark.w, (-v.y * 0.5 + 0.5) * Mark.h]; };
Mark.diamond = (c, x, y, s, fill, ink, a) => { c.globalAlpha = a; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.72, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.72, y); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 1.6; c.strokeStyle = ink; c.stroke(); };
Mark.star = (c, x, y, r, a) => { c.globalAlpha = a; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.7, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r * 0.7, y); c.quadraticCurveTo(x, y, x, y - r); c.fillStyle = '#fff3cf'; c.fill(); };
Mark.tag = (c, x, y, text, gold) => {
  c.font = '500 ' + Math.round(13 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ts')) || 1)) + 'px "IM Fell English SC", Georgia, serif'; const w = c.measureText(text).width + 18, h = 22;
  c.globalAlpha = 0.9; c.fillStyle = gold ? 'rgba(216,181,99,0.94)' : 'rgba(228,214,179,0.92)'; c.strokeStyle = 'rgba(42,32,22,0.8)'; c.lineWidth = 1; c.beginPath(); if (c.roundRect) c.roundRect(x - w / 2, y - h / 2, w, h, 3); else c.rect(x - w / 2, y - h / 2, w, h); c.fill(); c.stroke();
  c.fillStyle = '#2a2016'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 1);
};
Mark.draw = () => {
  const c = Mark.ctx; if (!c) return;
  const playing = game.playing && !uiBusy() && !Feel.intro && !Feel.talkNpc;
  if (!playing) { if (Mark.drawn) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, Mark.cv.width, Mark.cv.height); Mark.drawn = false; } return; }
  c.setTransform(Mark.dpr, 0, 0, Mark.dpr, 0, 0); c.clearRect(0, 0, Mark.w, Mark.h); Mark.drawn = false;
  const P = Player, t = performance.now() / 1000, rm = Feel.reduce, e = [P.pos[0], P.pos[1] + P.eye, P.pos[2]], fx = Math.sin(P.yaw) * Math.cos(P.pitch), fz = -Math.cos(P.yaw) * Math.cos(P.pitch), fy = Math.sin(P.pitch);
  const front = (x, y, z) => ((x - e[0]) * fx + (y - e[1]) * fy + (z - e[2]) * fz) / (hyp(x - e[0], y - e[1], z - e[2]) || 1);
  // 1. the thing you can use: a small ink diamond above it, breathing
  if (UI.prompt && UI.promptPos) {
    const p = UI.promptPos, s = Mark.at(p[0], p[1] + (UI.prompt.npc ? 0.62 : 0.32), p[2]);
    if (s) { const k = rm ? 0 : Math.sin(t * 3.2); c.globalAlpha = 0.28 + 0.1 * k; c.beginPath(); c.arc(s[0], s[1], 13 + 2.5 * k, 0, TAU); c.fillStyle = '#f6e7b4'; c.fill(); Mark.diamond(c, s[0], s[1], 6.5, '#ebe0c6', '#14110d', 0.95); Mark.drawn = true; }
  }
  // 2. doors: where this one leads (outside only, the nearest two, in front of you, not the one you are about to use)
  if (!World.camZone && !World.cell && !(UI.prompt && UI.prompt.kind === 'portal')) {
    let n = 0; const cand = [];
    for (const d of World.doors) { if (!d.site || d.site.facade || d.site.alleyRow && !d.site.name) continue; const dx = d.c[0] - e[0], dz = d.c[2] - e[2], dist = hyp(dx, dz); if (dist > 10 || dist < 1.2) continue; if (front(d.c[0], d.c[1], d.c[2]) < 0.55) continue; cand.push([dist, d]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [dist, d] of cand) { if (n >= 2) break; const s = Mark.at(d.c[0], d.c[1] + 1.35, d.c[2]); if (!s) continue; n++; c.globalAlpha = 1; Mark.tag(c, s[0], s[1], d.site.title || d.site.name /* [cast] the table's name for the house */, false); c.globalAlpha = 1; Mark.drawn = true; }
  }
  // 3. a faint glint on what can be taken
  const list = UI.glintList || (UI.glintList = []), now = performance.now();
  if (now - (Mark.gt || 0) > 400) { Mark.gt = now; list.length = 0; for (const it of World.interact) { if (it.gone || (it.kind !== 'pickup' && it.kind !== 'chest' && it.kind !== 'loot') || (it.kind === 'chest' && S.opened[it.id])) continue; if (it.zone !== undefined && it.zone !== World.camZone && it.zone !== 0) continue; if (hyp(it.p[0] - e[0], it.p[2] - e[2]) < 15) list.push(it); } if (list.length > 8) { list.sort((a, b) => hyp(a.p[0] - e[0], a.p[2] - e[2]) - hyp(b.p[0] - e[0], b.p[2] - e[2])); list.length = 8; } }
  for (let i = 0; i < list.length; i++) {
    const it = list[i]; if (it.gone || it === UI.prompt) continue; const s = Mark.at(it.p[0], it.p[1] + 0.12, it.p[2]); if (!s) continue; const dist = hyp(it.p[0] - e[0], it.p[2] - e[2]);
    const tw = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.9), a = (0.18 + 0.5 * tw) * (1 - smooth(8, 15, dist)); if (a < 0.04) continue;
    Mark.star(c, s[0], s[1], (5 + 4 * tw) * (1 - 0.4 * smooth(2, 12, dist)), a); Mark.drawn = true;
  }
  // 4. the person the first quest points at, while he is in sight
  const gt = (S.q.welcome && !S.q.welcome.done && S.q.welcome.stage === 0 && NPC.hale) ? NPC.hale : null;
  if (gt) { const dist = hyp(gt.pos[0] - e[0], gt.pos[2] - e[2]); if (dist > 4.5 && dist < 70 && front(gt.pos[0], gt.pos[1] + 1.8, gt.pos[2]) > 0.6) { const s = Mark.at(gt.pos[0], gt.pos[1] + 2.15, gt.pos[2]); if (s) { const b = rm ? 0 : Math.sin(t * 2.4) * 2; Mark.diamond(c, s[0], s[1] + b, 6, '#d8b563', '#14110d', 0.95); c.globalAlpha = 1; Mark.tag(c, s[0], s[1] - 22 + b, 'Warden Hale', true); Mark.drawn = true; } } }
  c.globalAlpha = 1;
};
