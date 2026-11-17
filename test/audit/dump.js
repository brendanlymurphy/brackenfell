// [audit] Everything countable about the world, as JSON. usage: node test/audit/run.mjs --opt audit=1 --json shots/audit/world.json test/audit/dump.js
const r2 = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v;
const safe = (o, depth = 4, seen = new WeakSet()) => { if (o === null || o === undefined) return o; if (typeof o === 'number') return r2(o); if (typeof o === 'function') return undefined; if (typeof o !== 'object') return o; if (o.isObject3D || o.isMatrix4 || o.isBufferGeometry || o.isMaterial) return undefined; if (ArrayBuffer.isView(o)) return o.length <= 16 ? Array.from(o, r2) : undefined; if (seen.has(o)) return undefined; if (depth <= 0) return undefined; seen.add(o); if (Array.isArray(o)) return o.slice(0, 400).map(v => safe(v, depth - 1, seen)); const r = {}; for (const k of Object.keys(o)) { if (/^(pair|obj|ch|ctx|cell|site|mesh|geo|m|baseM|S|real)$/.test(k)) continue; const v = safe(o[k], depth - 1, seen); if (v !== undefined) r[k] = v; } return r; };
const A = v => Array.isArray(v) ? v : (v && typeof v === 'object') ? Object.values(v) : [];
const out = {};
out.houses = Object.values(World.houses).map(h => { const P = h.cell && h.cell.ctx && (h.cell.ctx.planDone || h.cell.ctx.plan);
  const o = { id: h.site.id, name: h.site.name, site: safe(h.site, 2), isite: h.isite ? { x: r2(h.isite.x), z: r2(h.isite.z), y: r2(h.isite.y), w: h.isite.w, d: h.isite.d } : null, spec: safe(h.spec, 4), kit: !!h.kit, cell: h.cell ? h.cell.id : null, cellName: h.cell ? h.cell.name : null, cellKind: h.cell ? h.cell.kind : null, cellW: h.cell ? h.cell.w : null, cellD: h.cell ? h.cell.d : null, floorY: r2(h.floorY), xFloorY: r2(h.xFloorY),
    xdoors: [].concat(h.xdoor || []).map(d => ({ c: (d.c||[]).map(r2), out: (d.out||[]).map(r2), yaw: r2(d.yaw), w: r2(d.w), h: r2(d.h) })), idoors: [].concat(h.door || []).map(d => ({ c: (d.c||[]).map(r2), w: r2(d.w) })) };
  if (P) { o.plan = { fam: P.fam, dims: safe(P.dims, 3), w2: P.w2, base: safe(P.base, 2), levels: Object.keys(P.lv), rooms: A(P.rooms).map(r => safe(r, 2)), doors: A(P.doors).length, pdoors: A(P.doors).map(d => safe(d, 2)), windows: A(P.windows).map(w => safe(w, 2)), stairs: A(P.stairs).map(s => safe(s, 2)), hearths: safe(P.hearths, 3), spots: Object.keys(P.spots || {}), nItems: A(P.items).length, itemKinds: (() => { const m = {}; for (const it of A(P.items)) { const k = it.kind || it.k || it.name || it.id || '?'; m[k] = (m[k] || 0) + 1; } return m; })(), refused: A(P.refused).length, hall: safe(P.hall, 2) }; }
  return o; });
out.cells = Cells.list.map(c => ({ id: c.id, name: c.name, kind: c.kind, origin: safe(c.origin), w: c.w, d: c.d, site: c.site ? c.site.id : null, wins: c.wins ? (c.wins.length || 0) : 0 }));
out.doors = World.doors.map(d => ({ side: d.side, cell: d.cell, site: d.site && d.site.id, c: d.c.map(r2), out: d.out.map(r2), w: r2(d.w), h: r2(d.h) }));
out.interact = World.interact.map(i => { const o = safe(i, 3); delete o.loot; if (o.text) o.text = String(o.text).slice(0, 80); return o; });
out.places = safe(World.places, 3);
out.npcs = NPCS.map(n => ({ id: n.id, name: n.name, pos: n.pos.map(r2), def: safe(n.def, 4), talk: typeof TALK[n.id] === 'function' }));
out.colliders = World.colliders.filter(c => c.y0 > -100).map(c => c.r !== undefined ? [r2(c.x), r2(c.z), r2(c.r), r2(c.y0), r2(c.y1)] : [r2(c.x), r2(c.z), r2(c.hx), r2(c.hz), r2(Math.atan2(c.az, c.ax)), r2(c.y0), r2(c.y1), c.off ? 1 : 0]);
out.trees = {}; for (const k in World.treePos) out.trees[k] = World.treePos[k].map(t => [r2(t[0]), r2(t[1]), r2(t[2]), r2(t[3])]);
out.treeCount = World.treeCount; out.hedge = [A(World.hedgeClumps).length, A(World.hedgeSaplings).length]; out.garden = A(World.gardenPlants).length; out.chickens = A(World.chickens).length;
out.kit = (window.__AUDIT_KIT || []).filter(k => !k.zone).map(k => { const e = k.M.elements; return [k.name, r2(e[12]), r2(e[13]), r2(e[14]), r2(Math.atan2(e[8], e[10]))]; });
out.kitIn = (() => { const m = {}; for (const k of (window.__AUDIT_KIT || [])) if (k.zone) { m[k.zone] = (m[k.zone] || 0) + 1; } return m; })();
out.zones = World.zones.map(z => ({ id: z.id, cell: z.cell, y0: r2(z.y0), y1: r2(z.y1), hw: z.hw, hd: z.hd, H: z.H }));
out.routes = safe(World.routes, 4); out.stairs = World.stairs.map(s => safe(s, 2)); out.spots = Object.keys(World.spots || {});
out.groundGrid = (() => { const g = []; for (let z = -130; z <= 130; z += 2) { const row = []; for (let x = -130; x <= 130; x += 2) row.push(r2(World.groundAt(x, z, 50))); g.push(row); } return g; })();
out.talkKeys = Object.keys(TALK); out.lakeY = World.lakeY;
out.shells = (typeof INFS !== 'undefined' ? INFS.shells : []).map(h => ({ id: h.id, x: r2(h.x), z: r2(h.z), yaw: r2(h.yaw), w: h.w, d: h.d, floors: h.floors, name: (SITE[h.id] || {}).name }));
out.wildShut = (typeof WILDS !== 'undefined' ? WILDS.houses : []).filter(h => !h.enter).map(h => h.id);
out.gateSpots = Object.keys(World.spots || {}).filter(k => /^gate\./.test(k)).map(k => [k, safe(World.spots[k], 3)]);
out.build = typeof BUILD_NAME !== 'undefined' ? BUILD_NAME : null;
out.bodies = NPCS.map(n => [n.id, n.def.body || null]);
{ const keepLen = Env.dayLength; Env.dayLength = 0; const by = []; for (let h = 0; h < 24; h++) { Env.hour = h + 0.5; npcSnapAll(); game.step(3, 1 / 30); let o = 0, sq = 0, inn = 0; for (const n of NPCS) { const c = Cells.at(n.pos[0], n.pos[1], n.pos[2]); if (c) { if (c.id === 'inn') inn++; } else { o++; if (Math.hypot(n.pos[0], n.pos[2] + 2) < 22) sq++; } } by.push([o, sq, inn]); } out.byHour = by; Env.dayLength = keepLen; }
return out;
