// [audit] the first ten doors from the gate: start 4.5 m in front of each, hold W looking at it until its prompt, press E (a real key event is not
// possible from inside the page: Cells.use is what the E key calls), wait for the fade, picture; then walk 1.5 m in and picture again.
const ang = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)), ids = (window.__DOORS || []), out = [];
const st = document.createElement('style'); st.textContent = '#hud, #quest, .tip, #tip, #toast { visibility: hidden !important; }'; document.head.appendChild(st);
for (const id of ids) { if (World.cell) { game.leave(); game.step(3, 1 / 30); } const h = World.houses[id], d = [].concat(h.xdoor || [])[0], it = World.interact.find(i => i.id === 'door.' + id + '.in'); if (!d || !it) { out.push({ id, err: 'no door' }); continue; }
  const nx = d.out[0] - d.c[0], nz = d.out[2] - d.c[2], l = Math.hypot(nx, nz), sx = d.c[0] + nx / l * 4.5, sz = d.c[2] + nz / l * 4.5; Cells.teleport({ p: [sx, World.groundAt(sx, sz, d.c[1] + 2), sz], yaw: Math.atan2(-nx, nz) }); game.step(4, 1 / 30);
  for (let k = 0; k < 150 && UI.prompt !== it; k++) { const P = Player, want = Math.atan2(it.p[0] - P.pos[0], -(it.p[2] - P.pos[2])), dh = Math.hypot(it.p[0] - P.pos[0], it.p[2] - P.pos[2]), dy = it.p[1] - (P.pos[1] + P.eye); Input.keys = { KeyW: dh > 0.9 }; Input.lookX = Math.max(-0.2, Math.min(0.2, ang(want, P.yaw))); Input.lookY = Math.max(-0.1, Math.min(0.1, P.pitch - Math.atan2(dy, dh))); game.step(1, 1 / 30); }
  Input.keys = {}; Input.lookX = Input.lookY = 0; const got = UI.prompt === it; if (!got) { out.push({ id, err: 'no prompt' }); continue; }
  Cells.use(it); for (let k = 0; k < 120; k++) game.step(1, 1 / 30); Player.pitch = 0; game.step(2, 1 / 30); game.draw(); await __snap('doors/' + id.replace('.', '') + '_a');
  for (let k = 0; k < 18; k++) { Input.keys = { KeyW: true }; game.step(1, 1 / 30); } Input.keys = {}; game.step(3, 1 / 30); game.draw(); await __snap('doors/' + id.replace('.', '') + '_b');
  out.push({ id, name: h.site.name, cell: World.cell ? World.cell.id : '', at: Player.pos.map(v => +v.toFixed(1)) }); }
if (World.cell) game.leave(); return out;
