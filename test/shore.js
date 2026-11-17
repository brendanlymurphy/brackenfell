// the outline of a water mesh is never visible. Every boundary edge of every water mesh (lake sheet, river ribbon) is checked: where the ground under the edge is more than 5 cm below the water,
// the vertex must have faded to nothing (tint alpha under 4 %), else the sheet ends in a visible straight line over ground. Run: node test/ev.mjs --opt audit=1 "$(cat test/shore.js)"; prints {edges, fails, worst:[...]}.
const out = { edges: 0, fails: 0, worst: [], meshes: 0 };
const AM = window.__AUDIT_MESH || [];      // kept by the audit option (meshes are freed after upload)
for (const pk of World.packs) for (const it of pk.items || []) {
  if (it.kind !== 'water') continue; const m = AM.find(q => q.ni === it.count && q.ni > 0 && q.f && Math.abs(q.f[1] - Math.round(q.f[1] * 100) / 100) < 1e-3); if (!m) continue; out.meshes++;
  const key = v => Math.round(m.f[v * 8] * 20) + ',' + Math.round(m.f[v * 8 + 2] * 20), count = new Map();
  for (let i = 0; i < m.ni; i += 3) for (let k = 0; k < 3; k++) { const a = m.idx[i + k], b = m.idx[i + (k + 1) % 3], ka = key(a), kb = key(b), e = ka < kb ? ka + '|' + kb : kb + '|' + ka, r = count.get(e); if (r) r.n++; else count.set(e, { n: 1, a, b }); }
  for (const r of count.values()) { if (r.n !== 1) continue; out.edges++;
    for (const v of [r.a, r.b]) { const x = m.f[v * 8], y = m.f[v * 8 + 1], z = m.f[v * 8 + 2], g = Terrain.y(x, z), depth = y - g, alpha = m.u8[v * 32 + 27] / 255;
      if (depth > 0.05 && alpha > 0.04) { out.fails++; (out.pos = out.pos || {})[Math.round(x / 10) * 10 + "," + Math.round(z / 10) * 10] = ((out.pos || {})[Math.round(x / 10) * 10 + "," + Math.round(z / 10) * 10] || 0) + 1; if (out.worst.length < 12) out.worst.push(pk.label + " " + [+x.toFixed(1), +z.toFixed(1), +depth.toFixed(2), +alpha.toFixed(2)].join(' ')); } } }
}
return out;
