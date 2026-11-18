// [audit] given nav edges the quest walker could not walk (EDGES below), walk each by held keys from its first node and picture the way from there and from above
const EDGES = (window.__EDGES || [[112, 1644], [416, 418], [99, 399], [388, 1846]]), P = Player, dt = 1 / 30, ang = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b)); const out = [];
const to = e => typeof e === 'number' ? e : e[0];
for (const [a, b] of EDGES) { const A = Nav.nodes[a], B = Nav.nodes[b]; const r = { a, b, A: A.map(v => +v.toFixed(2)), B: B.map(v => +v.toFixed(2)), len: +Math.hypot(B[0] - A[0], B[2] - A[2]).toFixed(1), cost: ((Nav.adj[a] || []).find(e => to(e) === b) || [])[1], portal: [Nav.portal ? Nav.portal[a] : null, Nav.portal ? Nav.portal[b] : null] };
  const c = Cells.at ? Cells.at(A[0], A[1], A[2]) : null; r.cell = c ? c.id : '';
  if (c && (!World.cell || World.cell.id !== c.id)) { try { game.enter(c.id); } catch (e) { } } else if (!c && World.cell) { try { game.leave(); } catch (e) { } }
  game.step(10, dt); Cells.teleport({ p: A.slice(), yaw: Math.atan2(B[0] - A[0], -(B[2] - A[2])) }); game.step(10, dt);
  r.startAt = P.pos.map(v => +v.toFixed(2)); let best = 1e9, since = 0, t = 0; r.result = 'time';
  while (t < 20) { const d = Math.hypot(B[0] - P.pos[0], B[2] - P.pos[2]); if (d < 0.7) { r.result = 'ok'; break; } if (d < best - 0.05) { best = d; since = t; } if (t - since > 2.5) { r.result = 'stuck ' + d.toFixed(1) + ' m short'; break; } const w = Math.atan2(B[0] - P.pos[0], -(B[2] - P.pos[2])), dd = ang(w, P.yaw); Input.keys = { KeyW: Math.abs(dd) < 1 }; Input.lookX = Math.max(-0.2, Math.min(0.2, dd)); Input.lookY = 0; game.step(1, dt); t += dt; }
  Input.keys = {}; Input.lookX = 0; r.endAt = P.pos.map(v => +v.toFixed(2)); r.y = { groundA: +World.groundAt(A[0], A[2], A[1] + 1).toFixed(2), groundB: +World.groundAt(B[0], B[2], B[1] + 1).toFixed(2) };
  const yaw = Math.atan2(B[0] - A[0], -(B[2] - A[2])) * 180 / Math.PI;
  game.shot(A[0], A[1] + 1.6, A[2], yaw, -12, 13); await __snap('edge_' + a + '_' + b + '_eye');
  game.shot((A[0] + B[0]) / 2 - Math.sin(yaw * Math.PI / 180) * 4, Math.max(A[1], B[1]) + 6, (A[2] + B[2]) / 2 + Math.cos(yaw * Math.PI / 180) * 4, yaw, -50, 13); await __snap('edge_' + a + '_' + b + '_above');
  out.push(JSON.stringify(r)); }
return out.join('\n');
