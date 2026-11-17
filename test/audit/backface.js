// [audit] Blueprint 5.1, seeing inside: from places a walker can stand, draw the back faces of walls, roofs and other structure red and count the red.
// A red pixel is the inside of something solid seen from outside it (an open end, a missing face, a sheet with no thickness, a view into a shell).
// usage: node test/audit/run.mjs --size 480x270 --dir shots/audit --json shots/audit/backface.json test/audit/backface.js   (materials are not put back: run it in a page of its own)      (window.__BF = { step: 10, top: 16 } to change)
const O = Object.assign({ step: 9, top: 24, x0: -62, x1: 62, z0: -84, z1: 90 }, window.__BF || {});
const sc = R.scenePass.scene, T = TSL, keep = new Map();
const STRUCT = /^MI_(WoodTrim|Plaster|UnevenBrick|Brick|Plaster_Planks|RockTrim|Slate_Roof|Shingle_Roof|Thatch_Roof|Stone_DS)\b/, ROOF = /Roof/;
const mk = (front, back) => { const m = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide }); m.colorNode = T.select(T.frontFacing, T.vec3(front[0], front[1], front[2]), T.vec3(back[0], back[1], back[2])); m.fog = false; return m; };
const WALL = mk([0.02, 0.02, 0.02], [1, 0, 0]), ROOFM = mk([0.02, 0.02, 0.02], [0, 0, 1]), BLACK = new THREE.MeshBasicNodeMaterial({ color: 0x050505, side: THREE.DoubleSide });
const hide = [];
const swap = on => sc.traverse(o => { if (!(o.isMesh)) return; const nm = (o.material && o.material.name) || '', on2 = o.name || '';
  if (/terrain|water|sky|rocks/.test(on2)) return;                                   // keep: the ground must occlude as it does in play
  if (o.isSkinnedMesh || /grass|particles|shadow|villager/.test(on2) || o.isInstancedMesh) { if (on) { keep.set(o, o.visible); o.visible = false; } else if (keep.has(o)) o.visible = keep.get(o); return; }
  if (on) { keep.set(o, o.material); const structural = STRUCT.test(nm) || (o.material.isMeshStandardNodeMaterial && !nm && !on2 && o.material.side === THREE.FrontSide); o.material = structural ? (ROOF.test(nm) ? ROOFM : WALL) : BLACK; } else if (keep.has(o)) o.material = keep.get(o); });
const inside = (x, y, z) => { const l = Col.grid.get(Math.floor(x / Col.cell) * 4096 + Math.floor(z / Col.cell)); if (!l) return false; for (const c of l) { if (c.off || y < c.y0 || y > c.y1) continue; const dx = x - c.x, dz = z - c.z; if (c.r !== undefined) { if (dx * dx + dz * dz < (c.r + 0.35) * (c.r + 0.35)) return true; continue; } const lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz; if (Math.abs(lx) < c.hx + 0.35 && Math.abs(lz) < c.hz + 0.35) return true; } return false; };
const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
const count = async () => { const b = await __png(), im = new Image(); await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + b; }); cv.width = im.width; cv.height = im.height; cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, im.width, im.height).data; let red = 0, blue = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 120 && d[i + 1] < 60 && d[i + 2] < 60) red++; else if (d[i + 2] > 120 && d[i] < 60 && d[i + 1] < 60) blue++; } const n = d.length / 4; return [red / n, blue / n]; };
// only places a walker can reach: flood on a 1 m grid from the square through everything that is not solid at body height
const free = (x, z) => { const g = World.groundAt(x, z, 50); return g > World.lakeY + 0.05 && g < 12 && !inside(x, g + 1.0, z) && !inside(x, g + 1.6, z); };
const seen = new Set(), q = [[0, -6]]; seen.add('0,-6'); while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b2 = z + dz, k = a + ',' + b2; if (a < O.x0 || a > O.x1 || b2 < O.z0 || b2 > O.z1 || seen.has(k) || !free(a, b2)) continue; if (Math.abs(World.groundAt(a, b2, 50) - World.groundAt(x, z, 50)) > 0.6) continue; seen.add(k); q.push([a, b2]); } }
let pts = []; for (let z = O.z0; z <= O.z1; z += O.step) for (let x = O.x0; x <= O.x1; x += O.step) if (seen.has(x + ',' + z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(d => seen.has((x + d[0]) + ',' + (z + d[1])))) pts.push([x, z]);
let views = []; { let k = 0; for (const [x, z] of pts) for (const yaw of (k++ % 2 ? [45, 225] : [135, 315])) views.push([x, z, yaw]); } if (O.views) views = O.views;
document.body.classList.add('audit-nohud'); const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
const rows = []; swap(true);
for (const [x, z, yaw] of views) { game.shot(x, null, z, yaw, 6, 13); const [red, blue] = await count(); rows.push({ x, z, yaw, wall: +(red * 100).toFixed(2), roof: +(blue * 100).toFixed(2) }); }
const top = rows.filter(r => r.wall > 0.3).sort((a, b) => b.wall - a.wall).slice(0, O.top);
let i = 0; for (const r of top) { i++; game.shot(r.x, null, r.z, r.yaw, 6, 13); await __snap('bf/' + String(i).padStart(2, '0') + '_red'); }
st.remove();
return { points: pts.length, views: rows.length, wallViews: rows.filter(r => r.wall > 0.3).length, wallViews2: rows.filter(r => r.wall > 2).length, roofViews: rows.filter(r => r.roof > 0.3).length, meanWall: +(rows.reduce((a, r) => a + r.wall, 0) / rows.length).toFixed(3), meanRoof: +(rows.reduce((a, r) => a + r.roof, 0) / rows.length).toFixed(3), top, rows };
