// The four reference views of the performance budget, with a breakdown of where draw calls and triangles go.
// Run: node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/perf_views.js)"      (window.__cat = true adds the table by category)
// (game.shot draws the frame twice, so the per-category tally is halved.) Each entry: draws / triangles of one whole frame (camera pass + near sun-shadow map + wide sun-shadow map, which a test redraws every frame).
const VIEWS = { square: [4, null, -14, 200, 0, 10], alley: [30, null, -2, 250, 2, 17.6], terrace: [-12, null, 4, 200, 6, 13], lake: [26, 6, 92, 315, -12, 13] };
const cat = new Map(), put = (o, c) => { if (o && !cat.has(o)) cat.set(o, c); };
const classify = () => {
  cat.clear();
  for (const s of SC.statics) put(s.mesh, s.it.kind === 'terrain' ? 'terrain' : s.it.kind === 'water' ? 'water' : s.it.kind === 'glow' ? 'props' : s.it.cell ? 'interior' : 'props');
  for (const s of SC.cells) put(s.mesh, /leaf/.test(s.grp.kind) || s.grp.lod ? 'trees' : 'rocks+bushes');
  for (const s of SC.rigid) put(s.mesh, 'props'); for (const s of SC.bodies) put(s.mesh, 'characters');
  if (Grass.mesh) put(Grass.mesh, 'grass');
  if (typeof Trees !== 'undefined' && Trees.sets) { for (const s of Trees.sets) for (const m of s.nearMeshes.concat([s.midMesh, s.castMesh])) put(m, 'trees'); for (const m of Trees.farMeshes) put(m, 'trees'); }
  if (typeof Chars !== 'undefined' && Chars.group) Chars.group.traverse(o => put(o, 'characters'));
  SC.scene.traverse(o => { if (!o.isMesh || cat.has(o)) return;
    let p = o, kit = null; while (p) { if (/^kit|infill|alley|dress|village|wilds|boards|terrace|wharf/i.test(p.name || '') && p !== o) kit = p.name; p = p.parent; }
    if (o.name === 'sky' || o.name === 'particles') return put(o, 'sky+particles');
    if (o.name === 'static-shadow') return put(o, 'props'); if (/^rocks/.test(o.name)) return put(o, 'rocks+bushes');
    if (o.name === 'terrain-pool') return put(o, 'terrain'); if (o.name === 'water-pool') return put(o, 'water');
    if (typeof Trees !== 'undefined' && ((Trees.farCastRing && o === Trees.farCastRing.mesh) || (Trees.farRing && o === Trees.farRing.mesh))) return put(o, 'trees');
    if (o.userData && o.userData.kitDyn) return put(o, 'houses+kit near');
    if (o.userData && o.userData.lod === 2) return put(o, 'houses far');
    if (o.isInstancedMesh) return put(o, 'kit instances');
    if (o.geometry && o.geometry.attributes.kc) return put(o, 'houses+kit near');
    put(o, 'other'); });
};
const info = G.renderer.info, prev = info.update, tally = {};
const run = async v => {
  for (const k in tally) delete tally[k];
  const r = await game.shot(...v);
  if (window.__cat) { classify(); const shadowMaps = R.shadows.lights.map(l => l.shadow.map);
    info.update = (o, count, inst) => { const rt = G.renderer.getRenderTarget(), pass = rt === shadowMaps[0] ? 'near' : rt === shadowMaps[1] ? 'far' : 'cam', c = cat.get(o) || 'other', t = tally[c] || (tally[c] = { cam: [0, 0], near: [0, 0], far: [0, 0] }); t[pass][0]++; if (o.isMesh) t[pass][1] += inst * count / 3; prev(o, count, inst); };
    await game.shot(...v); info.update = prev; }
  return r;
};
const out = {};
for (const k in VIEWS) { const r = await run(VIEWS[k]); out[k] = r.draws + ' / ' + Math.round(r.tris / 1000) + 'k';
  if (window.__cat) out[k + ' by category (draws/k tris: camera | near shadow | far shadow)'] = Object.keys(tally).sort((a, b) => (tally[b].cam[1] + tally[b].near[1] + tally[b].far[1]) - (tally[a].cam[1] + tally[a].near[1] + tally[a].far[1])).map(c => c + ': ' + ['cam', 'near', 'far'].map(p => tally[c][p][0] / 2 + '/' + Math.round(tally[c][p][1] / 2000)).join(' | ')); }
return out;
