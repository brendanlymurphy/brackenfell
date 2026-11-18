// The view through the windows (src/56b_viewcube.js): entering a house draws the town once from the house's own place into a small cube map, which the panes show.
// Checked here: one drawing on entering, none while standing indoors, one more when the hour turns, none for a room with no house out of doors; the picture is of the
// town (a red post planted east of the house is in the middle of the east face and nowhere on the west face) and has sky above and ground below.
Weather.set('fair'); Env.dayLength = 0; Env.hour = 13; const dt = 1 / 30; game.step(2, dt); await game.draw(); const bad = [];
const hf = h => { const e = (h >> 10) & 31, f = h & 1023; return e === 0 ? f / 1024 * Math.pow(2, -14) : e === 31 ? 1e4 : (1 + f / 1024) * Math.pow(2, e - 15); };
const face = async i => { const px = await G.renderer.readRenderTargetPixelsAsync(ViewCube.rt, 0, 0, 256, 256, 0, i), fl = px instanceof Uint16Array; return (x, y) => { const o = (y * 256 + x) * 4; return [0, 1, 2].map(k => fl ? hf(px[o + k]) : px[o + k] / 255); }; };
const c = Cells.by.inn, f = ViewCube.frame(c); if (!f) throw new Error('VIEW FAIL the inn has no place out of doors');
const post = new THREE.Mesh(new THREE.BoxGeometry(1.5, 40, 1.5), new THREE.MeshBasicMaterial({ color: 0xff0000 })); post.position.set(f.p[0] + 14, f.p[1], f.p[2]); post.frustumCulled = false; SC.scene.add(post);
const s0 = ViewCube.shots; game.enter('inn'); game.step(3, dt); await game.draw();
if (ViewCube.shots !== s0 + 1) bad.push('entering the inn drew the view ' + (ViewCube.shots - s0) + ' times, not once'); if (SH.U.viewOn.value !== 1) bad.push('the panes are not switched to the view'); if (!World.cell || World.cell.id !== 'inn') bad.push('the player is not left in the inn after the drawing');
const isRed = v => v[0] > 0.3 && v[0] > v[1] * 3 && v[0] > v[2] * 3; const E = await face(0), Wf = await face(1), U = await face(2), D = await face(3);
let redE = 0, redW = 0; for (let y = 96; y < 160; y += 4) for (let x = 0; x < 256; x += 4) { if (x > 112 && x < 144 && isRed(E(x, y))) redE++; if (isRed(Wf(x, y))) redW++; }
if (redE < 24) bad.push('the post east of the inn is not in the middle of the east face (' + redE + ' of 112 samples)'); if (redW) bad.push('the post east of the inn shows on the west face');
const lum = v => v[0] + v[1] + v[2]; let up = 0, dn = 0, mn = 1e9, mx = 0; for (let y = 8; y < 256; y += 16) for (let x = 8; x < 256; x += 16) { const a = lum(U(x, y)), b = lum(D(x, y)); up += a; dn += b; mn = Math.min(mn, a, b); mx = Math.max(mx, a, b); }
if (!(up > dn * 1.15)) bad.push('the sky face is no brighter than the ground face (' + up.toFixed(1) + ' against ' + dn.toFixed(1) + ')'); if (!(mn > 0.001)) bad.push('part of the picture is black');
const s1 = ViewCube.shots; for (let i = 0; i < 90; i++) game.step(1, dt); await game.draw(); if (ViewCube.shots !== s1) bad.push('the view was drawn again ' + (ViewCube.shots - s1) + ' times in 90 frames indoors');
Env.hour = 20.2; game.step(2, dt); await game.draw(); await game.draw(); if (ViewCube.shots !== s1 + 1) bad.push('the hour turned and the view was drawn ' + (ViewCube.shots - s1) + ' times, not once'); const N = await face(2); let upN = 0; for (let y = 8; y < 256; y += 16) for (let x = 8; x < 256; x += 16) upN += lum(N(x, y)); if (!(upN < up * 0.6)) bad.push('the evening sky in the glass is as bright as noon (' + upN.toFixed(1) + ' against ' + up.toFixed(1) + ')');
game.leave(); game.step(2, dt); await game.draw(); SC.scene.remove(post);
const s2 = ViewCube.shots; let under = null; for (const id of ['crypt', 'mine', 'cellar']) if (Cells.by[id] && !ViewCube.frame(Cells.by[id])) { under = id; break; }
if (under) { game.enter(under); game.step(3, dt); await game.draw(); if (ViewCube.shots !== s2) bad.push(under + ' has no house out of doors and a view was drawn'); if (SH.U.viewOn.value !== 0) bad.push(under + ': the panes still show the last house\'s view'); game.leave(); }
if (bad.length) throw new Error('VIEW FAIL ' + bad.length + ': ' + bad.join('; '));
return 'view PASS drawn once on entering and once when the hour turned, never between; east is east; sky ' + up.toFixed(0) + ' over ground ' + dn.toFixed(0) + ', evening sky ' + upN.toFixed(0) + (under ? '; none for the ' + under : '');
