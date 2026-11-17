// [audit] four pictures of every building shell (front, left, back, right) from 7 m. usage: node test/audit/run.mjs --size 640x400 --dir shots/audit --json shots/audit/walls.json test/audit/walls.js
// Camera per building from site data: stand on a wall's normal 7 m out (4 m if something solid is closer; then step sideways along the street), look at the middle of that wall.
// usage: node test/ev.mjs "$(cat test/front_views.js)"   (set `want` to a list of ids; `walls` is front by default, 'left'/'right'/'back' too)
const want = null, walls = ['front','left','back','right'];
const cols = World.colliders.filter(c => c.y0 < 1.5 && c.y1 > 0.8), sites = Object.values(World.houses).map(h => h.site);
const inRect = (s, x, z, pad) => { const dx = x - s.x, dz = z - s.z, c = Math.cos(s.yaw), n = Math.sin(s.yaw), u = dx * c + dz * n, v = -dx * n + dz * c; return Math.abs(u) < s.w / 2 + pad && Math.abs(v) < s.d / 2 + pad; };
const hit = (x, z, pad, self) => cols.some(c => c.r !== undefined ? Math.hypot(x - c.x, z - c.z) < c.r + pad : (Math.abs(x - c.x) < c.hx + pad && Math.abs(z - c.z) < c.hz + pad)) || sites.some(s => s !== self && s.w && inRect(s, x, z, pad));
const out = [], miss = [];
for (const h of Object.values(World.houses)) {
  const st = h.site; if (want && !want.includes(st.id)) continue;
  for (const wall of walls) {
    const fx = Math.sin(st.yaw), fz = -Math.cos(st.yaw), sx = Math.cos(st.yaw), sz = Math.sin(st.yaw);     // front normal and the way along the front
    const [nx, nz, half, run] = wall === 'front' ? [fx, fz, st.d / 2, st.w] : wall === 'back' ? [-fx, -fz, st.d / 2, st.w] : wall === 'left' ? [-sx, -sz, st.w / 2, st.d] : [sx, sz, st.w / 2, st.d];
    const tx = st.x + nx * half, tz = st.z + nz * half, ax = -nz, az = nx;                                 // target = middle of the wall; (ax, az) runs along it
    let best = null;
    for (const dist of [7, 4, 9, 5.5, 11, 13]) for (const lat of [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10]) {
      const px = tx + nx * dist + ax * lat, pz = tz + nz * dist + az * lat;
      if (hit(px, pz, 0.5, st)) continue;
      let ok = true; for (let k = 1; k <= 9; k++) { const f = k / 10; if (hit(px + (tx - px) * f, pz + (tz - pz) * f, 0.3, st)) { ok = false; break; } }
      if (ok) { best = { px, pz, dist, lat }; break; }
    }
    if (!best) { miss.push(st.id + '.' + wall); best = { px: tx + nx * 7, pz: tz + nz * 7, dist: 7, lat: 0 }; }
    const yaw = Math.atan2(tx - best.px, -(tz - best.pz)) * 180 / Math.PI;      // tour camera forward = (sin yaw, -cos yaw)
    out.push({ n: st.id + (wall === 'front' ? '' : '.' + wall), x: +best.px.toFixed(2), y: null, z: +best.pz.toFixed(2), yaw: +yaw.toFixed(1), pitch: 3, h: [13, 21], info: [best.dist, best.lat] });
  }
}

// [audit] shoot every wall of every building, then every interior from its door
const log=[];
for (const v of out) { const r = game.shot(v.x, v.y, v.z, v.yaw, v.pitch, 13); await __snap('h/' + v.n.replace(/\.(left|back|right)$/, '_$1').replace(/^([^_]*)$/, '$1_front')); log.push({ n: v.n, x: v.x, z: v.z, yaw: v.yaw, draws: r.draws, tris: r.tris, info: v.info }); }
return { views: log, miss };
