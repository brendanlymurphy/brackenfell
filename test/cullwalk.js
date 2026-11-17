// While walking and turning, nothing that should be seen may be missing: every square of terrain, water and props that is inside the view and not under
// the roofline as it is from exactly here must be in its mesh's index buffer on that frame. (The cuts of Build 69 keep sets of squares and refill them
// lazily; this is the check that laziness never shows as a hole.) usage: node test/shot.mjs --size 320x160 --opt webgl=1 --opt quality=low --opt play=1 --do "$(cat test/cullwalk.js)"
const dt = 1 / 30, bad = [], streak = new Map(); let frames = 0, checked = 0, late = 0;
game.step(3, dt); Env.dayLength = 0; Env.hour = 13;
const legs = [[4, -14, 200, 60, 0.05], [30, -2, 250, 60, -0.06], [-12, 4, 200, 40, 0.09], [14, 79, 180, 40, -0.04], [-60, -8, 90, 40, 0.12]];
const fr = new THREE.Frustum(), pm = new THREE.Matrix4();
for (const [x, z, yaw, n, turn] of legs) {
  game.tp(x, z, yaw);
  for (let i = 0; i < n; i++) {
    Input.keys = { KeyW: true, ShiftLeft: i % 20 > 12 }; Input.lookX = turn * (i % 30 < 20 ? 1 : -2); game.step(1, dt); const r = RPG.st(); r.hp = RPG.MAXHP; await game.draw(); frames++;
    if (World.cell) continue;
    const e = R.cam.pos; fr.setFromProjectionMatrix(pm.multiplyMatrices(R.camera.projectionMatrix, R.camera.matrixWorldInverse));
    // candidates: in the view, not in the buffer
    const cand = []; const take = (list, what) => { for (const t of list) { if (!fr.intersectsSphere(t.sph) || t.on || t.ok === false) continue; checked++; cand.push([what, { x: t.sph.center.x, z: t.sph.center.z, r: t.sph.radius, y1: t.sph.center.y + t.sph.radius }]); } };
    for (const P of SC.pools) take(P.tiles, P.kind);
    for (const s of SC.statics) if (s.view && s.sub && !s.view.full && !s.it.cell) { const d = Math.hypot(s.it.c[0] - e[0], s.it.c[1] - e[1], s.it.c[2] - e[2]); if (s.it.maxDist && d > s.it.maxDist + s.it.r) continue; take(s.sub.cells, 'prop'); }
    // A candidate is a hole only if it is in sight from here and from half a metre to every side: the roofline leaves out any house nearer than 2.5 m,
    // so standing 2.49 m from a wall it calls visible what the wall hides. Seen from all five places, it is really in sight.
    let open = cand.map(() => true);
    for (const [ox, oz] of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) { const q = [e[0] + ox, e[1], e[2] + oz], occ = Kit.occlude(q); cand.forEach((c, k) => { if (open[k] && occ(c[1], Math.hypot(c[1].x - q[0], c[1].z - q[2]))) open[k] = false; }); }
    // one frame late at the edge of the view while turning is not seen; a hole is: the same square missing three frames running, or anything big or near
    const now = new Set(); cand.forEach((c, k) => { if (!open[k]) return; const id = c[0] + c[1].x.toFixed(1) + ',' + c[1].z.toFixed(1), d = Math.hypot(c[1].x - e[0], c[1].z - e[2]); now.add(id); const run = (streak.get(id) || 0) + 1; streak.set(id, run); late++; if (run < 3 && !(c[1].r > 6 && d < 150) && d > 40) open[k] = false; }); for (const id of [...streak.keys()]) if (!now.has(id)) streak.delete(id);
    cand.forEach((c, k) => { if (open[k]) bad.push(c[0] + ' square at ' + [c[1].x, c[1].z].map(v => v.toFixed(0)) + ' (r ' + c[1].r.toFixed(0) + ') missing at frame ' + frames + ', camera ' + e.map(v => v.toFixed(1)) + ', ' + Math.hypot(c[1].x - e[0], c[1].z - e[2]).toFixed(0) + ' m away'); });
  }
}
Input.keys = {};
if (bad.length) throw new Error('CULLWALK FAIL ' + bad.length + ' missing: ' + JSON.stringify(bad.slice(0, 5)));
return 'cullwalk PASS ' + frames + ' frames, ' + checked + ' hidden squares checked, ' + late + ' small far squares one or two frames late';
