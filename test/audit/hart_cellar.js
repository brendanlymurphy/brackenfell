// [audit] The Hart's cellar wall that the story points to: where the fresh brick and the smugglers' door are, against the cellar's own walls.
// usage: node test/audit/run.mjs --size 960x540 --dir shots/audit --json shots/audit/hart_cellar.json test/audit/hart_cellar.js
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
game.enter('inn'); game.step(4, 1 / 30);
const pos = o => { if (!o) return null; const q = o.position || (o.obj && o.obj.position) || o.p || o.pos; if (!q) return Object.keys(o).slice(0, 12); return (Array.isArray(q) ? q : [q.x, q.y, q.z]).map(v => +(+v).toFixed(2)); };
const P = Cells.by.inn.ctx.planDone || Cells.by.inn.ctx.plan, T = Array.from(P.T).slice(12, 15);
const out = { innOrigin: T.map(v => +v.toFixed(2)), cellarRoomWorld: null, wallObj: pos(SEC.wallObj), doorObj: typeof A2 !== 'undefined' ? pos(A2.door) : null, secWall: SECRETS.wall.p, tunnelPortal: (World.interact.find(i => i.id === 'door.tunnel.in') || {}).p };
const r = Object.values(P.rooms).find(x => x.id === 'cellar'); out.cellarRoomWorld = { x0: T[0] + r.x0, x1: T[0] + r.x1, z0: T[2] + r.z0, z1: T[2] + r.z1 };
for (const [tag, x, y, z, yaw, p] of [['cel_from_cellar', 266.0, -401.3, 1.2, 180, -5], ['cel_from_cellar_wide', 262, -401.3, 0.0, 150, -5], ['cel_from_behind', 266.5, -401.3, 6.4, 0, -5], ['cel_side', 268.5, -401.3, 4.0, 270, -5]]) { game.shot(x, y, z, yaw, p, 13); await __snap('pp/' + tag); }
return out;
