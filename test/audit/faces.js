// [ch4] Ten faces side by side at 0.7 m in daylight, people who share a body (the audit could not tell them apart at 3 m). --opt faceoff=1 shows them without the per-person face.
// usage: node test/audit/run.mjs --size 360x420 --dir docs/proof/chars/faces [--opt faceoff=1] [--opt tag=before] test/audit/faces.js
const st0 = document.createElement('style'); st0.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st0);
Env.dayLength = 0; if (Cells.cur) game.leave(); const V3 = THREE.Vector3, sx = 4.2, sz = -2.5, sy = Terrain.y(sx, sz), out = [], tag = (window.__TEST__ || {}).tag || 'after';
const bodyOf = id => Chars.set.cfg.look(NPC_DEFS.find(d => d.id === id)).body, by = {}; for (const d of NPC_DEFS) if (d.cast) { const b = bodyOf(d.id); (by[b] = by[b] || []).push(d.id); }
const ids = String((window.__TEST__ || {}).who || '') ? String(window.__TEST__.who).split(',') : Object.values(by).sort((a, b) => b.length - a.length).slice(0, 2).flatMap(l => l.slice(0, 5));
for (const id of ids) { const def = NPC_DEFS.find(d => d.id === id), H = Chars.spawn(def), s = { pos: [sx, sy, sz], yaw: 0, anim: 'idle', scale: def.scale || 1, zone: 0, light: 1, visible: true, cast: true, look: [0, 0], talking: false };
  H.shedOverride = 1;      // hats off: the face, not the cap
  for (let i = 0; i < 10; i++) Chars.update(H, s, 0.1); const hd = H.root.getObjectByName('head').getWorldPosition(new V3()).add(new V3(0, 0.08, 0));
  for (let i = 0; i < 2; i++) { Chars.update(H, s, 0.016); game.shot(hd.x, hd.y, hd.z - 0.7, 180, 0, 11); } await __snap(tag + '_' + id); out.push([id, H.body]); Chars.remove(H); }
st0.remove(); return out;
