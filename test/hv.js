// Houses: list the validator's violations per building without throwing (window.__only = ['in.02', ...] limits). usage: node test/shot.mjs --opt webgl=1 --do "$(cat test/hv.js)"
const out = [], only = window.__only;
for (const id in World.houses) { const h = World.houses[id]; if (!h.plan || (only && !only.includes(id))) continue; const v = planValidate(h.plan); const f = h.plan.fam; out.push(id + ' [' + (f ? f.fam + '/' + f.trade + '/sx' + f.sx : '-') + '] ' + Object.keys(h.plan.rooms).length + 'r ' + h.plan.items.length + 'i ' + v.length + 'v'); for (const x of v) out.push('   ' + x); }
return out.join('\n');
