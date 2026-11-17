// While walking and turning, nothing that should be seen may be missing: every square of terrain, water and props that is inside the view and not under
// the roofline as it is from exactly here must be in its mesh's index buffer on that frame. (The cuts of Build 69 keep sets of squares and refill them
// lazily; this is the check that laziness never shows as a hole.) usage: node test/shot.mjs --size 320x160 --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/cullwalk.js)"
const dt = 1 / 30, bad = [], streak = new Map(); let frames = 0, checked = 0, late = 0;
game.step(3, dt); Env.dayLength = 0; Env.hour = 13;
// [cull] the same on every machine: the refill timers (0.6 s) read the clock, and a slow machine takes a second over a frame that a fast one draws in 50 ms, so the
// two refilled on different frames. Here the clock advances one simulated frame per frame; the weather is fixed.
// ... and the walk starts only when everything that streams in (trees, characters, outlaws, scanned props) has arrived and the scene has stopped growing
{ let last = '', same = 0; for (let k = 0; k < 150 && same < 8; k++) { await new Promise(r => setTimeout(r, 200)); game.step(1, dt); await game.draw(); const sig = [SC.statics.length, SC.pools.reduce((a, P) => a + P.tiles.length, 0), Kit.dyn.length, Kit.pool.length, Kit.dyn.reduce((a, D) => a + D.units.length, 0), typeof Trees !== 'undefined' && Trees.ready, Chars.ready, typeof Foes !== 'undefined' && Foes.ready, NPCS.length].join(); const up = Chars.ready && (typeof Trees === 'undefined' || Trees.ready) && (typeof Foes === 'undefined' || Foes.ready || Foes.failed); same = sig === last && up ? same + 1 : 0; last = sig; } }
// chance is fixed from here on and everyone starts from their place for the hour, however long the waiting took
{ let a = 7; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; npcSnapAll(); if (typeof AMB !== 'undefined') for (const p of AMB.list) { p.state = 'away'; p.path = null; } }
const _pn = performance.now; let _T = performance.now(); performance.now = () => _T; if (typeof Weather !== 'undefined') Weather.set('fair');
const legs = [[4, -14, 200, 60, 0.05], [30, -2, 250, 60, -0.06], [-12, 4, 200, 40, 0.09], [14, 79, 180, 40, -0.04], [-60, -8, 90, 40, 0.12]];
const fr = new THREE.Frustum(), pm = new THREE.Matrix4();
for (const [x, z, yaw, n, turn] of legs) {
  game.tp(x, z, yaw);
  for (let i = 0; i < n; i++) {
    Input.keys = { KeyW: true, ShiftLeft: i % 20 > 12 }; Input.lookX = turn * (i % 30 < 20 ? 1 : -2); _T += 1000 * dt; game.step(1, dt); const r = RPG.st(); r.hp = RPG.MAXHP; await game.draw(); frames++;
    if (World.cell || World.deepIn) continue;       // deep indoors the outside is drawn short on purpose
    const e = R.cam.pos; fr.setFromProjectionMatrix(pm.multiplyMatrices(R.camera.projectionMatrix, R.camera.matrixWorldInverse));
    // candidates: in the view, not in the buffer
    let ctx0; const cand = []; const take = (list, what) => { for (const t of list) { if (!fr.intersectsSphere(t.sph) || t.on || t.ok === false) continue; checked++; cand.push([what, t.top !== undefined ? { x: t.sph.center.x, z: t.sph.center.z, r: t.rh, y1: t.top + 0.3 } /* a square is as high as its highest point and as wide as its footprint (42_scene.js) */ : { x: t.sph.center.x, z: t.sph.center.z, r: t.sph.radius, y1: t.sph.center.y + t.sph.radius }, t, ctx]); } }; let ctx = '';
    for (const P of SC.pools) take(P.tiles, P.kind);
    for (const s of SC.statics) if (s.view && s.sub && !s.view.full && !s.it.cell) { const d = Math.hypot(s.it.c[0] - e[0], s.it.c[1] - e[1], s.it.c[2] - e[2]); if (s.it.maxDist && d > s.it.maxDist + s.it.r) continue; ctx = 'mesh visible ' + s.mesh.visible + ' casts ' + s.mesh.castShadow + ' n ' + s.view.n + ' age ' + Math.round(SC.now - (s.view.t || 0)) + ' occN ' + s.view.occN + '/' + s.view.hidN + '/' + SC.occN + ' camStep ' + SC.camStep; take(s.sub.cells, 'prop'); }
    // A square that is in the view and not in its buffer must be one the game holds to be under the roofline (t.hid), and that must be true of the
    // roofline as it is from where the game last asked (SC.occAt, never more than 0.35 m away). The roofline itself is proven by test/kitcull.mjs.
    // (Asking it from here instead gives false alarms: it leaves out any house nearer than 2.5 m, so a step changes the answer beside a wall.)
    let open = cand.map(c => !c[2].hid); { const q = SC.occAt, occ = Kit.occlude(q); cand.forEach((c, k) => { if (!open[k] && !occ(c[1], Math.hypot(c[1].x - q[0], c[1].z - q[2]), 0.85)) open[k] = true; }); }
    // one frame late at the edge of the view while turning is not seen; a hole is: the same square missing three frames running, or anything big or near
    const now = new Set(); cand.forEach((c, k) => { if (!open[k]) return; const id = c[0] + c[1].x.toFixed(1) + ',' + c[1].z.toFixed(1), d = Math.hypot(c[1].x - e[0], c[1].z - e[2]); now.add(id); const run = (streak.get(id) || 0) + 1; streak.set(id, run); late++; if (run < 3 && !(c[1].r > 6 && d < 150) && d > 40) open[k] = false; }); for (const id of [...streak.keys()]) if (!now.has(id)) streak.delete(id);
    cand.forEach((c, k) => { if (open[k]) bad.push(c[0] + ' square at ' + [c[1].x, c[1].z].map(v => v.toFixed(0)) + ' (r ' + c[1].r.toFixed(0) + ') missing at frame ' + frames + ', camera ' + e.map(v => v.toFixed(1)) + ', ' + Math.hypot(c[1].x - e[0], c[1].z - e[2]).toFixed(0) + ' m away; in ' + c[2].in + ' on ' + c[2].on + ' hid ' + c[2].hid + ' ' + c[3]); });
  }
}
Input.keys = {}; performance.now = _pn;
if (bad.length) throw new Error('CULLWALK FAIL ' + bad.length + ' missing: ' + JSON.stringify(bad.slice(0, 5)));
return 'cullwalk PASS ' + frames + ' frames, ' + checked + ' hidden squares checked, ' + late + ' small far squares one or two frames late';
