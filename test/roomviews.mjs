// Room camera for everyone's use. For a house (cell id) and a level, stands at each doorway of each room (1.3 m inside the room, clear of the leaf's swing, eye 1.6 m, level) looking along the room's long axis
// toward the far end, and at each stair head turning to the largest free floor; shoots each at 13:00 and 21:00 as in play.
// node test/roomviews.mjs <ids comma list> [outdir]   -> outdir/<id>/<n>_<h>.jpg and outdir/<id>/views.json ; then python3 test/roomviews_sheet.py outdir <id>
// Never run alongside another browser or a gate.
import fs from 'node:fs';
import { open } from './qa/harness.mjs';
const ids = process.argv[2].split(','), out = process.argv[3] || '/tmp/roomviews';
const s = await open({ webgl: 1, quality: 'low', play: 1, cellnight: 10 }, [640, 360]);
for (const id of ids) {
  fs.mkdirSync(`${out}/${id}`, { recursive: true });
  let views;
  try {
    views = JSON.parse(await s.run(`game.enter(${JSON.stringify(id)}); game.step(8,1/30); Env.hour=13; game.step(2,1/30);
      const P = World.houses[${JSON.stringify(id)}].plan, V = [];
      const solid = (i, k) => i.k === k && ['floor', 'stair', 'hearth', 'hole'].includes(i.kind) && (i.h === undefined || i.h > 0.3);
      const free = (r, k, x, z) => x > r.in.x0 + 0.3 && x < r.in.x1 - 0.3 && z > r.in.z0 + 0.3 && z < r.in.z1 - 0.3 && !P.items.some(i => solid(i, k) && x > i.x0 - 0.2 && x < i.x1 + 0.2 && z > i.z0 - 0.2 && z < i.z1 + 0.2);
      for (const [rid, r] of Object.entries(P.rooms)) {
        const k = r.k, W = r.in.x1 - r.in.x0, D = r.in.z1 - r.in.z0, ax = W >= D ? [1, 0] : [0, 1], cx = (r.in.x0 + r.in.x1) / 2, cz = (r.in.z0 + r.in.z1) / 2;
        for (const d of P.doors) { if (d.a !== rid && d.b !== rid) continue;
          const dw = [[Math.abs(d.x - r.in.x0), 1, 0], [Math.abs(d.x - r.in.x1), -1, 0], [Math.abs(d.z - r.in.z0), 0, 1], [Math.abs(d.z - r.in.z1), 0, -1]].sort((p, q) => p[0] - q[0])[0], nx = dw[1], nz = dw[2];
          const off = Math.min(1.3, (nx ? W : D) / 2), px = d.x + nx * off, pz = d.z + nz * off, along = (cx - px) * ax[0] + (cz - pz) * ax[1], sg = Math.abs(along) < 0.3 ? ((px - r.in.x0) * ax[0] + (pz - r.in.z0) * ax[1] < (W >= D ? W : D) / 2 ? 1 : -1) : Math.sign(along);
          V.push({ k, room: rid, what: 'door', p: [px, pz], v: [ax[0] * sg, ax[1] * sg], dir: (ax[0] ? (sg > 0 ? 'E' : 'W') : (sg > 0 ? 'S' : 'N')) }); }
      }
      for (const st of P.stairs) { const r = Object.entries(P.rooms).find(([i, r]) => r.k === st.k1 && st.highPt[0] > r.in.x0 - 0.2 && st.highPt[0] < r.in.x1 + 0.2 && st.highPt[1] > r.in.z0 - 0.2 && st.highPt[1] < r.in.z1 + 0.2); if (!r) continue;
        const [x0, z0] = st.highPt; let best = -1, bd = null;
        for (let a = 0; a < 360; a += 15) { const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180); let n = 0;
          for (let dist = 0.6; dist < 6; dist += 0.4) for (let sp = -0.4; sp <= 0.4; sp += 0.4) { const x = x0 + ca * dist - sa * sp * dist, z = z0 + sa * dist + ca * sp * dist; if (free(r[1], st.k1, x, z)) n++; }
          if (n > best) { best = n; bd = [ca, sa]; } }
        V.push({ k: st.k1, room: r[0], what: 'stairhead', p: [x0, z0], v: bd, dir: 'free(' + best + ')' }); }
      return JSON.stringify(V);`));
  } catch (e) { console.log(id, 'views fail', String(e).slice(0, 120)); continue; }
  if (process.env.DRY) { console.log(id, JSON.stringify(views)); continue; }
  let n = 0; const meta = [];
  for (const v of views) {
    for (const h of [13, 21]) for (let t = 0; t < 2; t++) try {
      const r = await s.run(`const P = World.houses[${JSON.stringify(id)}].plan, fy = P.lv[${v.k}].y, a = P.w2(${v.p[0]}, fy + 1.6, ${v.p[1]}), b = P.w2(${v.p[0] + v.v[0]}, fy + 1.6, ${v.p[1] + v.v[1]}), yaw = Math.round(Math.atan2(b[0] - a[0], -(b[2] - a[2])) * 180 / Math.PI); Env.hour = ${h}; game.step(2, 1/30); await __game.shot(a[0], a[1], a[2], yaw, 0, ${h}); const A = await QA.draw(); return QA.jpeg(A);`);
      fs.writeFileSync(`${out}/${id}/${n}_${h}.jpg`, Buffer.from(r, 'base64')); break;
    } catch (e) { if (t) console.log(id, n, h, 'fail', String(e).slice(0, 80)); }
    meta.push(Object.assign({ n }, v)); n++;
  }
  fs.writeFileSync(`${out}/${id}/views.json`, JSON.stringify(meta)); console.log(id, n, 'views');
}
await s.close();
