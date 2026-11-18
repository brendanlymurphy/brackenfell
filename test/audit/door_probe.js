// [audit] the door data of named buildings: portal, its place against the house's door, lock text, label
const ids = ['in.40', 'in.07', 'in.08', 'in.04', 'in.65', 'in.10'], out = {};
for (const id of ids) { const h = World.houses[id], d = h && [].concat(h.xdoor || [])[0], ps = World.interact.filter(i => i.kind === 'portal' && i.cell === id);
  out[id] = { name: h && h.site.name, xdoor: d ? { c: d.c.map(v => +v.toFixed(2)), out: d.out.map(v => +v.toFixed(2)) } : null, portals: ps.map(i => ({ id: i.id, side: i.side, p: i.p.map(v => +v.toFixed(2)), r: i.r, label: i.label, lock: typeof i.lock === 'function' ? i.lock() : i.lock || null, labelNow: typeof interactLabel === 'function' ? interactLabel(i) : '?' })) }; }
return out;
