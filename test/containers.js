// Openable containers per building: before (every item the old rule matched) and after (what the cap leaves), total, and the story ones.
// usage: node test/shot.mjs --opt plans=all --opt play=1 --do "$(cat test/containers.js)"
const rows = [], per = {}; let before = 0, after = 0;
for (const c of Cells.list) { const P = c.ctx && (c.ctx.planDone || c.ctx.plan); if (!P || !P.items) continue; let b = 0; for (const it of P.items) { if (it.kind !== 'floor') continue; const id = String(it.id || ''); if (IX.SEAT.test(id) && it.h <= 1.1) continue; if (IX.KINDS.find(k => k[0].test(id))) b++; } per[c.id] = [b, 0]; before += b; }
for (const o of World.interact) if (o.kind === 'cont' && o.cell && per[o.cell]) { per[o.cell][1]++; after++; }
const worst = Object.entries(per).sort((a, b) => b[1][1] - a[1][1]).slice(0, 5).map(e => e[0] + ' ' + e[1][1] + ' of ' + e[1][0]);
const story = World.interact.filter(o => o.sec || /^(cont|chest)/.test(o.kind) && o.id && !/^cont\./.test(o.id)).map(o => o.id);
const stuck = []; for (const o of World.interact) if (o.kind === 'cont' && o.id.startsWith('cont.') && !/^cont\..*(barrel|cask|keg|sack|crate|basket|hamper|apile|cspile)/.test(o.id) === false && !o.loot) stuck.push(o.id);
const bn = Object.keys(per).length, tot = World.interact.filter(o => o.kind === 'cont' || o.kind === 'chest').length;
console.log('buildings ' + bn + ': stock and furniture candidates before ' + before + ' (' + (before / bn).toFixed(1) + ' a building), openable cont after ' + after + ' (' + (after / bn).toFixed(1) + '); all openable (cont + chest) ' + tot + '; most: ' + worst.join(', '));
console.log('named and story containers still openable: ' + story.length + ' [' + story.slice(0, 40).join(' ') + ']; empty ones: ' + stuck.length);
return 'containers: ' + tot;
