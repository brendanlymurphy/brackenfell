// In-page view lists for test/tour.mjs. window.TOUR.set(name) returns [{n, x, y, z, yaw, pitch, h:[hours], cell?}] (y null = stand on the ground there).
// Eye height 1.66 m everywhere. Yaw 0 looks toward -z (as game.shot). Interiors are generated lazily by TOUR.cellViews(id) because plans are built on first entry.
window.TOUR = (() => {
const T = {}, D = 180 / PI, EYE = 1.66;
const toward = (x, z, tx, tz) => Math.atan2(tx - x, -(tz - z)) * D;
const r1 = v => +v.toFixed(2);
const gy = (x, z, up) => World.groundAt(x, z, up === undefined ? Terrain.y(x, z) + 1.3 : up) + EYE;
const V = [];
const add = (n, x, z, yaw, pitch, h, y) => { V.push({ n, x: r1(x), z: r1(z), y: y === undefined ? r1(gy(x, z)) : r1(y), yaw: r1(yaw), pitch: pitch === undefined ? -2 : pitch, h: h || [13] }); };
// walk a polyline from its start: stops every `step` m; alternate looking ahead and back so every stretch is seen from both ways at half the cost
const along = (name, pts, step, h, x0, x1) => {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = s => { let i = 1; while (i < pts.length - 1 && L[i] < s) i++; const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]; };
  let k = 0; for (let s = 1; s < L[L.length - 1] - 1; s += step, k++) {
    const p = at(s); if (x0 !== undefined && (p[0] < x0 || p[0] > x1)) continue; const fwd = k % 2 === 0, q = at(Math.min(L[L.length - 1], Math.max(0, s + (fwd ? 6 : -6))));
    add(name + '.' + Math.round(s) + (fwd ? 'f' : 'b'), p[0], p[1], toward(p[0], p[1], q[0], q[1]), -3, h);
  }
};
const free = (x, z, r) => { if (!World.blockedAt(x, z, r || 0.4)) return [x, z]; for (let d = 0.5; d < 4; d += 0.5) for (let a = 0; a < 6.28; a += 0.5) { const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (!World.blockedAt(px, pz, r || 0.4)) return [px, pz]; } return [x, z]; };

T.set = name => {
  V.length = 0;
  if (name === 'streets') {
    const R = id => ROADS.find(r => r.id === id).pts;
    along('main', R('main'), 14, [13, 21], -120, 90);
    for (const id of ['north', 'crag', 'south', 'hunter', 'fisher', 'mill']) along(id, R(id), 10, [13]);
    for (const [nm, x, z] of [['sq', 3, 3], ['sqw', -7, -3]]) { const p = free(x, z, 0.5); for (let a = 0; a < 360; a += 45) add(nm + a, p[0], p[1], a, -2, a % 90 === 0 && nm === 'sq' ? [13, 21] : [13]); }
    for (const nm of ['alley.n', 'alley.s', 'passage.mid', 'passage.lane', 'loft.in', 'loft.platform', 'north.bottom', 'north.top', 'east.bottom', 'east.top', 'gallery.bottom', 'gallery.top', 'belltower.bottom', 'belltower.top', 'terrace.view', 'wharf.view', 'dock.end', 'bridge.west', 'gate.post', 'gate.post2', 'tower.fire', 'elder.porch', 'square.well', 'herbalist.garden', 'farm.yard', 'hunter.yard', 'mill.door']) {
      const s = World.spots[nm]; if (!s) continue; const yaw = s.yaw * D;
      for (const dy of (/top|bottom|view|end|post/.test(nm) ? [0, 180] : [0])) add('sp.' + nm + (dy ? '.r' : ''), s.p[0], s.p[2], yaw + dy, -4, [13], s.p[1] + EYE);
    }
  } else if (name === 'places') {
    for (const p of World.places) {
      if (!/^(wild\.|gate|bridge|bridgegate|tower|wharf|lake|fields|graves|uward|hartgallery|passage|hoistloft|chapelgate|belltower|washlane|hiddenyard|steplane|dist\.)/.test(p.id)) continue;
      const wild = p.id.startsWith('wild.'), dist = Math.min(Math.max(p.r * 0.7, 6), 12);
      for (const a0 of wild ? [0, 120, 240] : [0, 180]) {
        const base = toward(p.x, p.z, 0, 0), a = (base + a0) / D, cx = p.x + Math.sin(a) * dist, cz = p.z - Math.cos(a) * dist, f = free(cx, cz, 0.4);
        add('pl.' + p.id + '.' + a0, f[0], f[1], toward(f[0], f[1], p.x, p.z), -3, a0 === 0 ? [13, 21] : [13]);
      }
    }
  } else if (name === 'doors') {
    let ink = 0;
    for (const s of SITES) {
      if (/^in\./.test(s.id) && (ink++ % 3)) continue;          // the infill houses share one generator: every third door
      const dl = siteDoorLocal(s, 3), d0 = siteDoorLocal(s, 0), w = siteToWorld(s, dl[0], dl[1]), dw = siteToWorld(s, d0[0], d0[1]);
      add('door.' + s.id, w[0], w[1], toward(w[0], w[1], dw[0], dw[1]), 0, [13]);
    }
  }
  return V.slice();
};

// interiors: the doorway; the middle of every room turned four ways (largest two) or toward the far side (others); stairs; cellars
T.cellViews = id => {
  const c = Cells.by[id], out = [], p0 = c.enter.p, add2 = (n, x, y, z, yaw, h) => out.push({ n: 'in.' + id + '.' + n, x: r1(x), y: r1(y), z: r1(z), yaw: r1(yaw), pitch: -3, h: h || [13], cell: id });
  add2('door', p0[0], p0[1] + EYE, p0[2], c.enter.yaw * D, [13, 21]);
  const P = c.planDone || c.plan;
  if (P) {
    const rooms = Object.values(P.rooms).filter(r => r.kind !== 'closet').sort((a, b) => (b.x1 - b.x0) * (b.z1 - b.z0) - (a.x1 - a.x0) * (a.z1 - a.z0));
    rooms.forEach((r, i) => {
      const cx = (r.in.x0 + r.in.x1) / 2, cz = (r.in.z0 + r.in.z1) / 2, w = P.w2(cx, P.lv[r.k].y + 0.02, cz);
      for (const a of i < 2 ? [0, 90, 180, 270] : [(i * 90) % 360]) add2((r.k < 0 ? 'cellar.' : r.k > 0 ? 'up.' : '') + r.id + '.' + a, w[0], w[1] + EYE, w[2], a, i === 0 && a === 0 ? [13, 21] : [13]);
    });
  } else {
    const sp = Object.values(World.spots).filter(s => s.site === id && hyp(s.p[0] - c.origin[0], s.p[2] - c.origin[2]) < 40);
    const picks = []; for (const s of sp) if (!picks.some(q => hyp(q.p[0] - s.p[0], q.p[2] - s.p[2]) < 3 && Math.abs(q.p[1] - s.p[1]) < 1)) picks.push(s);
    picks.slice(0, 4).forEach((s, i) => { for (const a of i < 2 ? [0, 90, 180, 270] : [toward(s.p[0], s.p[2], p0[0], p0[2])]) add2('sp' + i + '.' + a, s.p[0], s.p[1] + EYE, s.p[2], a, i === 0 && a === 0 ? [13, 21] : [13]); });
  }
  return out;
};
// the mine: the middle of every region of MINE.REG, along and across it (and the tunnel and the cave when their regions are listed)
T.mineViews = () => {
  const out = [], O = MINE.O, FY = MINE.FY;
  out.push({ n: 'mine.door', x: r1(O[0] + MINE.AT.arrive[0]), y: r1(FY + EYE), z: r1(O[2] + MINE.AT.arrive[1]), yaw: 0, pitch: -3, h: [13], cell: 'mine' });
  for (const r of MINE.REG) {
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, long = (r.z1 - r.z0) > (r.x1 - r.x0), nm = 'mine.' + (r.id || r.kind) + '.' + Math.round(cx) + '.' + Math.round(cz);
    const stops = []; const L = long ? r.z1 - r.z0 : r.x1 - r.x0; for (let u = 2; u < L - 1; u += 8) stops.push(u);
    if (!stops.length) stops.push(L / 2);
    for (const u of stops.slice(0, 4)) for (const a of long ? [0, 180] : [90, 270]) out.push({ n: nm + '.' + Math.round(u) + '.' + a, x: r1(O[0] + (long ? cx : r.x0 + u)), y: r1(FY + (r.fl || 0) + EYE), z: r1(O[2] + (long ? r.z0 + u : cz)), yaw: a, pitch: -3, h: [13], cell: 'mine' });
  }
  return out;
};
return T;
})();
