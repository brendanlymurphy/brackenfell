// ───────────────────────── the map: drawn from world data onto a canvas, parchment and ink ─────────────────────────
// A static layer (paper relief, forest stipple, river, lake, roads, paths, fields, building footprints) is drawn once into an offscreen canvas;
// every redraw lays it over the paper and adds what changes: labels for places you have discovered, you, and the quest targets.
// Outside the village you see the whole valley; inside a building cell the map shows the village with a room label.
const GameMap = { cv: null, base: null, view: { cx: 0, cz: 5, s: 1 }, zoom: 1, K: 4.4, X0: -200, Z0: -190, SPAN: 400, ptr: new Map(), paper: null };
GameMap.init = () => {
  const cv = GameMap.cv = $('mapCv'); cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); GameMap.ptr.set(e.pointerId, [e.clientX, e.clientY]); GameMap.pd = null; });
  cv.addEventListener('pointermove', e => {
    const p = GameMap.ptr.get(e.pointerId); if (!p) return; const V = GameMap.view, n = GameMap.ptr.size;
    if (n === 1) { V.cx -= (e.clientX - p[0]) / V.s; V.cz -= (e.clientY - p[1]) / V.s; }
    else if (n === 2) { const o = [...GameMap.ptr.entries()].find(([id]) => id !== e.pointerId)[1], d0 = Math.hypot(p[0] - o[0], p[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (d0 > 0) GameMap.zoomBy(d1 / d0); }
    GameMap.ptr.set(e.pointerId, [e.clientX, e.clientY]); GameMap.draw();
  });
  for (const ev of ['pointerup', 'pointercancel']) cv.addEventListener(ev, e => GameMap.ptr.delete(e.pointerId));
  cv.addEventListener('wheel', e => { e.preventDefault(); GameMap.zoomBy(e.deltaY < 0 ? 1.18 : 1 / 1.18); GameMap.draw(); }, { passive: false });
  $('mapZoom').addEventListener('click', () => { GameMap.zoom = GameMap.zoom > 1.01 ? 1 : 2.6; GameMap.center(true); GameMap.draw(); $('mapZoom').textContent = GameMap.zoom > 1.01 ? '−' : '+'; });
  $('mapHome').addEventListener('click', () => { GameMap.center(false); GameMap.draw(); });
};
GameMap.fit = () => Math.min(GameMap.cv.clientWidth, GameMap.cv.clientHeight) / (GameMap.SPAN * 0.6);
GameMap.zoomBy = f => { const V = GameMap.view, lo = GameMap.fit() * 0.8, s = clamp(V.s * f, lo, GameMap.fit() * 6); V.s = s; GameMap.zoom = s / GameMap.fit(); };
GameMap.center = onPlayer => { const V = GameMap.view, P = Player; V.s = GameMap.fit() * GameMap.zoom; if (onPlayer || GameMap.zoom > 1.01) { const p = GameMap.pos(); V.cx = p[0]; V.cz = p[1]; } else { V.cx = 0; V.cz = 5; } };
// where the player is on the village map (inside a cell: at the door it was entered by)
// Where to draw something that may be inside a building: interiors are built far outside the valley, so on the map a thing indoors stands at its
// building's street door (the place you come out at). Before this, inside any building the map showed neither you nor a quest mark: both were drawn
// at the interior's own coordinates, a kilometre off the sheet.
GameMap.out = (x, y, z) => { if (typeof Cells === 'undefined' || !CELLS_ON) return [x, z]; const c = Cells.at(x, y === undefined ? CELL.y : y, z); return c && c.leave && c.leave.p ? [c.leave.p[0], c.leave.p[2]] : [x, z]; };
GameMap.pos = () => { const P = Player; if (typeof World !== 'undefined' && World.cell && Cells.cur && Cells.cur.leave && Cells.cur.leave.p) { const d = Cells.cur.leave.p; return [d[0], d[2]]; } return [P.pos[0], P.pos[2]]; };
GameMap.show = () => {
  const cv = GameMap.cv; if (!cv) return; const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d); GameMap.dpr = d;
  if (!GameMap.base) GameMap.build(); GameMap.zoom = 1; $('mapZoom').textContent = '+'; GameMap.center(false); GameMap.draw();
  $('mapKey').textContent = 'You: red arrow   Quest: gold mark   Names appear as you discover places';
};
const mrng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
GameMap.build = () => {
  const K = GameMap.K, N = Math.round(GameMap.SPAN * K), b = document.createElement('canvas'); b.width = b.height = N; const c = b.getContext('2d'), R = mrng(77);
  const X = x => (x - GameMap.X0) * K, Z = z => (z - GameMap.Z0) * K;
  // relief: a soft brown wash on slopes facing away from the light
  { const g = document.createElement('canvas'), n = GameMap.SPAN; g.width = g.height = n; const gc = g.getContext('2d'), im = gc.createImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = GameMap.X0 + i, z = GameMap.Z0 + j, s = (Terrain.y(x - 1.5, z - 1.5) - Terrain.y(x + 1.5, z + 1.5)), a = Math.min(0.5, Math.abs(s) * 0.09), o = (j * n + i) * 4; im.data[o] = s > 0 ? 250 : 70; im.data[o + 1] = s > 0 ? 238 : 50; im.data[o + 2] = s > 0 ? 200 : 25; im.data[o + 3] = a * 255; }
    gc.putImageData(im, 0, 0); c.imageSmoothingQuality = 'high'; c.globalAlpha = 0.9; c.drawImage(g, 0, 0, N, N); c.globalAlpha = 1; }
  const ink = (a) => 'rgba(52,38,24,' + a + ')';
  // forest: stipple and small pine ticks
  const T = World.treePos; if (T) { c.fillStyle = 'rgba(58,70,42,0.55)'; c.strokeStyle = 'rgba(46,58,34,0.7)'; c.lineWidth = 1.1;
    for (const k of ['pine', 'birch', 'oak']) for (const t of T[k]) { const x = X(t[0]), z = Z(t[2]); if (x < 0 || z < 0 || x > N || z > N) continue; if (k === 'pine') { c.beginPath(); c.moveTo(x - 2.2, z + 1.6); c.lineTo(x, z - 3); c.lineTo(x + 2.2, z + 1.6); c.stroke(); } else { c.beginPath(); c.arc(x, z, k === 'oak' ? 2.6 : 1.5, 0, TAU); c.fill(); } } }
  const path = (pts, w, col, dash) => { c.beginPath(); pts.forEach((p, i) => { const x = X(p[0]) + (R() - 0.5) * 0.6, z = Z(p[1]) + (R() - 0.5) * 0.6; i ? c.lineTo(x, z) : c.moveTo(x, z); }); c.lineWidth = w; c.strokeStyle = col; c.setLineDash(dash || []); c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); c.setLineDash([]); };
  // lake and river: a blue-grey wash with an ink edge and a few ripple strokes
  { const pts = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, x0 = LAKE.x + Math.cos(a) * LAKE.r, z0 = LAKE.z + Math.sin(a) * LAKE.r, r = lakeR(x0, z0) - 0.5; pts.push([LAKE.x + Math.cos(a) * r, LAKE.z + Math.sin(a) * r]); }
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(X(p[0]), Z(p[1])) : c.moveTo(X(p[0]), Z(p[1]))); c.closePath(); c.fillStyle = 'rgba(122,150,160,0.62)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(48,66,76,0.85)'; c.stroke();
    c.save(); c.clip(); c.strokeStyle = 'rgba(48,66,76,0.35)'; c.lineWidth = 1; for (let z = LAKE.z - LAKE.r; z < LAKE.z + LAKE.r; z += 5) { c.beginPath(); const x0 = LAKE.x - 20 + (R() - 0.5) * 14; c.moveTo(X(x0), Z(z)); c.quadraticCurveTo(X(x0 + 8), Z(z - 1), X(x0 + 16), Z(z)); c.stroke(); } c.restore(); }
  const river = catmull(RIVER_PTS, 3); path(river, 5.2 * K, 'rgba(122,150,160,0.62)'); path(river, 1.2, 'rgba(48,66,76,0.55)');
  for (const dx of [-1, 1]) path(river.map(p => [p[0] + dx * 2.7, p[1]]), 1.4, 'rgba(48,66,76,0.75)');
  // fields: hatching
  for (const f of FIELDS) { c.save(); c.beginPath(); c.rect(X(f.x0), Z(f.z0), (f.x1 - f.x0) * K, (f.z1 - f.z0) * K); c.fillStyle = 'rgba(176,150,80,0.25)'; c.fill(); c.clip(); c.strokeStyle = ink(0.4); c.lineWidth = 1; for (let k = -40; k < (f.x1 - f.x0 + f.z1 - f.z0); k += 2.2) { c.beginPath(); c.moveTo(X(f.x0 + k), Z(f.z0)); c.lineTo(X(f.x0 + k - (f.z1 - f.z0)), Z(f.z1)); c.stroke(); } c.restore(); c.strokeStyle = ink(0.7); c.lineWidth = 1.4; c.strokeRect(X(f.x0), Z(f.z0), (f.x1 - f.x0) * K, (f.z1 - f.z0) * K); }
  // roads: an ink outline with paper inside; footpaths are dashed
  const rs = ROADS.map(r => [r, catmull(r.pts, 1.5)]);
  for (const [r, p] of rs) if (!r.path) path(p, (r.w + 0.9) * K, ink(0.8));
  for (const [r, p] of rs) if (!r.path) path(p, (r.w - 0.2) * K, '#e6d8b2');
  for (const [r, p] of rs) if (r.path) path(p, 1.8, ink(0.75), [5, 4]);
  // the square and the bridge
  c.beginPath(); c.ellipse(X(SQUARE.x), Z(SQUARE.z), SQUARE.rx * K, SQUARE.rz * K, 0, 0, TAU); c.fillStyle = 'rgba(214,198,160,0.7)'; c.fill(); c.lineWidth = 2; c.strokeStyle = ink(0.8); c.stroke();
  c.fillStyle = ink(0.35); for (let i = 0; i < 160; i++) { const a = R() * TAU, r = Math.sqrt(R()); c.fillRect(X(SQUARE.x + Math.cos(a) * SQUARE.rx * r), Z(SQUARE.z + Math.sin(a) * SQUARE.rz * r), 1.3, 1.3); }
  c.strokeStyle = ink(0.9); c.lineWidth = 2; for (const o of [-BRIDGE.w / 2, BRIDGE.w / 2]) { c.beginPath(); c.moveTo(X(BRIDGE.x - BRIDGE.len / 2), Z(BRIDGE.z + o)); c.lineTo(X(BRIDGE.x + BRIDGE.len / 2), Z(BRIDGE.z + o)); c.stroke(); }
  // buildings: a footprint with its ridge line and a door tick
  for (const s of SITES) {
    if (s.id === 'tower') { c.beginPath(); c.arc(X(s.x), Z(s.z), s.w / 2 * K, 0, TAU); c.fillStyle = 'rgba(120,104,84,0.8)'; c.fill(); c.lineWidth = 2; c.strokeStyle = ink(0.95); c.stroke(); continue; }
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, d]) => siteToWorld(s, a * s.w / 2, d * s.d / 2));
    c.beginPath(); q.forEach((p, i) => i ? c.lineTo(X(p[0]), Z(p[1])) : c.moveTo(X(p[0]), Z(p[1]))); c.closePath(); c.fillStyle = s.infill || s.alleyRow ? 'rgba(104,78,52,0.55)' : 'rgba(112,72,46,0.7)'; c.fill(); c.lineWidth = s.infill || s.alleyRow ? 1.2 : 1.9; c.strokeStyle = ink(0.95); c.stroke();
    const a = siteToWorld(s, -s.w / 2, 0), z = siteToWorld(s, s.w / 2, 0); c.beginPath(); c.moveTo(X(a[0]), Z(a[1])); c.lineTo(X(z[0]), Z(z[1])); c.lineWidth = 1; c.strokeStyle = 'rgba(235,224,198,0.5)'; c.stroke();
  }
  // a hand-drawn frame
  c.strokeStyle = ink(0.85); c.lineWidth = 3; c.strokeRect(6, 6, N - 12, N - 12); c.lineWidth = 1; c.strokeRect(14, 14, N - 28, N - 28);
  GameMap.base = b;
  // the paper: warm base, blotches and fibres, made once
  const pp = document.createElement('canvas'); pp.width = pp.height = 256; const pc = pp.getContext('2d'); pc.fillStyle = '#d8c89e'; pc.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { const g = pc.createRadialGradient(R() * 256, R() * 256, 0, R() * 256, R() * 256, 70); g.addColorStop(0, R() < 0.5 ? 'rgba(255,248,222,0.12)' : 'rgba(150,110,60,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); pc.fillStyle = g; pc.fillRect(0, 0, 256, 256); }
  for (let i = 0; i < 700; i++) { pc.fillStyle = 'rgba(90,64,34,' + (R() * 0.12) + ')'; pc.fillRect(R() * 256, R() * 256, 1 + R() * 2, 1); }
  GameMap.paper = pc.canvas;
};
GameMap.draw = () => {
  const cv = GameMap.cv; if (!cv || !GameMap.base || cv.clientWidth === 0) return; const c = cv.getContext('2d'), d = GameMap.dpr || 1, W = cv.clientWidth, H = cv.clientHeight, V = GameMap.view, ts = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ts')) || 1;
  c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = c.createPattern(GameMap.paper, 'repeat'); c.fillRect(0, 0, W, H);
  const sx = x => (x - V.cx) * V.s + W / 2, sz = z => (z - V.cz) * V.s + H / 2;
  c.imageSmoothingQuality = 'high'; c.drawImage(GameMap.base, sx(GameMap.X0), sz(GameMap.Z0), GameMap.SPAN * V.s, GameMap.SPAN * V.s);
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.8); vg.addColorStop(0, 'rgba(120,84,40,0)'); vg.addColorStop(1, 'rgba(110,76,36,0.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  // names of discovered places only, kept from overlapping
  const disc = UI.disc(), boxes = []; c.textBaseline = 'middle';
  const place = (x, y, text, bold) => { c.font = (bold ? 'italic 500 ' : 'italic 400 ') + Math.round(14 * ts) + 'px Alegreya, Georgia, serif'; const w = c.measureText(text).width, h = 15 * ts; let bx = x + 7; if (bx + w > W - 4) bx = x - 7 - w; const r = [Math.min(bx, x) - 4, y - h / 2, Math.max(bx + w, x), y + h / 2]; if (boxes.some(o => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) return; boxes.push(r);
    c.lineWidth = 3; c.strokeStyle = 'rgba(228,214,179,0.85)'; c.strokeText(text, bx, y); c.fillStyle = '#2a2016'; c.fillText(text, bx, y); c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fillStyle = '#2a2016'; c.fill(); };
  for (const pl of World.places) { if (!disc[pl.id]) continue; place(sx(pl.x), sz(pl.z), pl.name, V.s > GameMap.fit() * 1.4); }
  // quest targets: a gold diamond with an ink edge
  for (const id of QORDER) { if (!S.q[id] || S.q[id].done) continue; let t; try { t = questTarget(id); } catch (e) { t = null; } if (!t) continue; const o = GameMap.out(t[0], t[1], t[2]), x = sx(o[0]), y = sz(o[1]); c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 7, y); c.lineTo(x, y + 9); c.lineTo(x - 7, y); c.closePath(); c.fillStyle = '#d8b563'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a2016'; c.stroke(); }
  // you: a red arrow turned the way you face
  // [cast] indoors the arrow turns by the building's true bearing, as the compass does (Cells.trueYaw, 94f_pointers.js)
  const p = GameMap.pos(), x = sx(p[0]), y = sz(p[1]); c.save(); c.translate(x, y); c.rotate(Player.yaw + (typeof Cells !== 'undefined' && Cells.trueYaw ? Cells.trueYaw() : 0)); c.beginPath(); c.moveTo(0, -11); c.lineTo(7.5, 8); c.lineTo(0, 4); c.lineTo(-7.5, 8); c.closePath(); c.fillStyle = '#a8321e'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a2016'; c.stroke(); c.restore();
  // title cartouche and, indoors, the room
  c.textAlign = 'left'; c.font = '400 ' + Math.round(17 * ts) + 'px "IM Fell English SC", Georgia, serif'; c.fillStyle = 'rgba(42,32,22,0.9)'; c.fillText('Brackenfell and the Greyspine Valley', 18, 22);
  if (World.cell && Cells.cur) { c.font = 'italic 400 ' + Math.round(14 * ts) + 'px Alegreya, Georgia, serif'; c.fillText('You are inside ' + (Cells.cur.name || Cells.cur.id), 18, 42); }
  c.fillStyle = 'rgba(42,32,22,0.8)'; c.fillRect(W - 18 - 50 * V.s, H - 24, 50 * V.s, 2); c.font = '12px Alegreya, Georgia, serif'; c.textAlign = 'right'; c.fillText('50 m', W - 18, H - 34); c.textAlign = 'left';
};
