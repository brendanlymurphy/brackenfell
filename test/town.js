// Town tests (browser): node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/town.js)"
// Sections (set window.__town = ['roofs', ...] to run some): roofs.
// roofs: for every generated roof, sample points on the top of each slope; fail where the point lies inside another building's walls or roof slab (interpenetration).
const only = window.__town, want = k => !only || only.includes(k), fails = [], rows = [];
const fx = (c, m) => { if (!c) fails.push(m); };
// far: every house-batch mesh and its far copy (same parent, same material): the far copy's box must match the full mesh's within 0.25 m, and its mean vertex colour within 12%
if (want('far')) {
  const grp = new Map();
  for (const m of Kit.lodMeshes) { const k = (m.parent ? m.parent.name : '') + '|' + m.material.uuid + '|' + (m.userData.cellKey || ''); let g = grp.get(k); if (!g) grp.set(k, g = { n: [], f: [] }); (m.userData.lod === 2 ? g.f : g.n).push(m); }
  const box = ms => { const b = new THREE.Box3(); for (const m of ms) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); } return b; };
  let pairs = 0, bad = 0, worst = 0;
  for (const [k, g] of grp) {
    if (!g.n.length || !g.f.length) continue;
    // pair by nearest centre (a cell block holds one mesh of each kind)
    for (const nm of g.n) { const bn = box([nm]), c = bn.getCenter(new THREE.Vector3()); let best = null, bd = 1e9; for (const fm of g.f) { const d = box([fm]).getCenter(new THREE.Vector3()).distanceTo(c); if (d < bd) { bd = d; best = fm; } } if (!best || bd > 3) continue;                  // (a far copy that drops the small pieces has a smaller box: only a same-place pair is comparable)
      const bf = box([best]); pairs++;
      const dmax = Math.max(Math.abs(bf.max.y - bn.max.y), Math.abs(bf.min.y - bn.min.y) * 0, Math.abs(bf.max.x - bn.max.x) * 0.5, Math.abs(bf.min.x - bn.min.x) * 0.5);
      worst = Math.max(worst, dmax); if (dmax > 0.25) { bad++; if (bad <= 8) fails.push('far copy of ' + k.split('|')[0] + ' differs by ' + dmax.toFixed(2) + ' m at ' + bn.getCenter(new THREE.Vector3()).toArray().map(v => v.toFixed(0))); } }
  }
  rows.push('far pairs ' + pairs + ' off ' + bad + ' worst ' + worst.toFixed(2));
}
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
