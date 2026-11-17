// [audit] every interior as data: rooms, furniture rectangles with the wall each backs onto, kit pieces with their facing, windows, hearths, stair holes, lights, spots.
// usage: node test/audit/run.mjs --opt audit=1 --json shots/audit/interiors_data.json test/audit/interiors_dump.js
const r2 = v => typeof v === 'number' ? Math.round(v * 100) / 100 : v, A = v => Array.isArray(v) ? v : Object.values(v || {});
const flat = (o, keys) => { const r = {}; for (const k of keys) if (o[k] !== undefined && typeof o[k] !== 'object') r[k] = r2(o[k]); return r; };
const kit = {}; for (const k of (window.__AUDIT_KIT || [])) if (k.zone) { const e = k.M.elements; (kit[k.zone] = kit[k.zone] || []).push([k.name, r2(e[12]), r2(e[13]), r2(e[14]), r2(Math.atan2(e[8], e[10])), r2(Math.hypot(e[0], e[1], e[2]))]); }
const out = [];
for (const c of Cells.list) { const P = c.ctx && (c.ctx.planDone || c.ctx.plan); if (!P) { out.push({ id: c.id, name: c.name, noPlan: true, zone: c.zone, kit: (kit[c.zone] || []).length }); continue; }
  out.push({ id: c.id, name: c.name, zone: c.zone, T: Array.from(P.T || [], r2), lv: Object.values(P.lv).map(l => flat(l, ['k', 'y', 'H'])), fam: P.fam ? flat(P.fam, ['trade', 'fam', 'wealth', 'wallKind', 'floorKind']) : null,
    rooms: A(P.rooms).map(r => flat(r, ['id', 'kind', 'k', 'x0', 'z0', 'x1', 'z1', 'floor', 'win'])),
    items: A(P.items).map(i => Object.assign(flat(i, ['k', 'x0', 'z0', 'x1', 'z1', 'kind', 'id', 'h', 'room', 'back', 'rot', 'top']))),
    wallItems: A(P.wallItems).map(i => Object.assign(flat(i, ['k', 'u0', 'u1', 'y0', 'y1', 'id', 'room', 'side']), { wall: i.wall ? flat(i.wall, ['k', 'ax', 'c', 'a', 'b', 'ext', 'cellar']) : null })),
    windows: A(P.windows).map(w => Object.assign(flat(w, ['k', 'u0', 'u1', 'x', 'z', 'pos', 'w', 'sill', 'h', 'room', 'side', 'kind']), { wall: w.wall ? flat(w.wall, ['k', 'ax', 'c', 'a', 'b', 'ext', 'cellar']) : null })),
    doors: A(P.doors).map(d => Object.assign(flat(d, ['a', 'b', 'x', 'z', 'w', 'k']), { ext: !!(d.wall && d.wall.ext) })),
    stairs: A(P.stairs).map(s => flat(s, ['id', 'k0', 'k1', 'axis', 'dir', 'x', 'z', 'width', 'rise', 'run', 'n'])), holes: A(P.holes).map(h => Object.assign({ k: h.k }, flat(h.r || {}, ['x0', 'x1', 'z0', 'z1']))),
    hearths: A(P.hearths).map(h => flat(h, ['k', 'x', 'z', 'side', 'wid'])), spots: Object.keys(P.spots || {}), spotPos: Object.fromEntries(Object.entries(P.spots || {}).map(([k, s]) => [k, s && s.p ? s.p.map(r2) : (Array.isArray(s) ? s.map(r2) : null)])),
    kit: kit[c.zone] || [], beds: World.interact.filter(i => i.kind === 'bed' && i.zone === c.zone).map(i => i.id), seats: World.interact.filter(i => i.kind === 'seat' && i.zone === c.zone).length, containers: World.interact.filter(i => (i.kind === 'cont' || i.kind === 'chest') && i.zone === c.zone).length, reads: World.interact.filter(i => i.kind === 'read' && i.zone === c.zone).length,
    emitters: (World.emitters || []).filter(e => e.zone === c.zone).map(e => flat(e, ['kind', 'type', 'x', 'y', 'z'])) }); }
return { build: typeof BUILD_NAME !== 'undefined' ? BUILD_NAME : null, cells: out, emitter0: World.emitters && World.emitters[0] ? Object.keys(World.emitters[0]) : null, nEmit: (World.emitters || []).length };
