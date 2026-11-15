// Town tests (browser): node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/town.js)"
// Sections (set window.__town = ['roofs', ...] to run some): roofs.
// roofs: for every generated roof, sample points on the top of each slope; fail where the point lies inside another building's walls or roof slab (interpenetration).
const only = window.__town, want = k => !only || only.includes(k), fails = [], rows = [];
const fx = (c, m) => { if (!c) fails.push(m); };
if (want('roofs')) {
  const inv = ROOFS.map(r => new THREE.Matrix4().fromArray(r.M).invert()), M = ROOFS.map(r => new THREE.Matrix4().fromArray(r.M));
  const name = r => { const s = SITES.reduce((b, q) => Math.hypot(q.x - r.M[12], q.z - r.M[14]) < Math.hypot(b.x - r.M[12], b.z - r.M[14]) ? q : b, SITES[0]); return s.id; };
  const ids = ROOFS.map(name);
  const surf = (r, x, z) => { const v = (r.ridgeX ? z - r.zc : x), u = (r.ridgeX ? x : z - r.zc); if (u < r.a0 || u > r.a1 || Math.abs(v) > r.ve) return null; return r.top + r.lift + (r.hs - Math.abs(v)) * r.tanP; };
  let n = 0, hit = 0;
  for (let i = 0; i < ROOFS.length; i++) {
    const r = ROOFS[i], P = new THREE.Vector3();
    for (let su = r.a0 + 0.3; su < r.a1; su += 0.5) for (const sg of [-1, 1]) for (let sv = 0.15; sv < r.hs; sv += 0.45) {
      const y = r.top + r.lift + (r.hs - sv) * r.tanP - 0.02;                   // just under the top surface
      P.set(r.ridgeX ? su : sg * sv, y, r.ridgeX ? r.zc + sg * sv : r.zc + su).applyMatrix4(M[i]); n++;
      for (let j = 0; j < ROOFS.length; j++) {
        if (j === i || ids[j] === ids[i]) continue;
        const q = P.clone().applyMatrix4(inv[j]), o = ROOFS[j], wallIn = Math.abs(q.x) < o.w / 2 + 0.02 && Math.abs(q.z) < o.d / 2 + 0.02 && q.y < o.top + 0.001 && q.y > -1;
        const ys = surf(o, q.x, q.z), roofIn = ys !== null && q.y < ys - 0.005 && q.y > ys - o.T - 0.02;
        if (wallIn || roofIn) { hit++; if (hit <= 12) fails.push('roof ' + ids[i] + ' meets ' + ids[j] + (wallIn ? ' wall' : ' roof') + ' at ' + [P.x, P.y, P.z].map(v => v.toFixed(1))); break; }
      }
    }
  }
  rows.push('roofs ' + ROOFS.length + ' samples ' + n + ' intersecting ' + hit);
  fx(hit === 0, hit + ' roof sample points lie inside a neighbour');
}
if (fails.length) throw new Error('TOWN FAIL ' + JSON.stringify({ rows, fails }));
return 'town PASS ' + JSON.stringify(rows);
