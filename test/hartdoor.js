// The door in the Hart's cellar, by input (owner, Build 83: "all these things point to a door in the Hart that doesn't even exist").
// From inside the Hart's front door a player holds W and steers along the villagers' own way to the cellar, then to the east wall; there the prompt must name
// the fresh brick; once told (Rowan's Act 2), using it opens the bricks, the doorway shows, and the smugglers' door takes you into the tunnel; the way back up
// lands in front of the same wall, inside the cellar. Every step is by the movement keys and E, not by teleport.
const bad = [], dt = 1 / 30, I = Input, log = []; Env.dayLength = 0; Weather.set('fair'); Env.hour = 10; npcSnapAll(); if (typeof OWN !== 'undefined') OWN.off = true;
const press = c => { I.keys[c] = true; }, lift = c => { I.keys[c] = false; };
const walkTo = (x, y, z, tol, max) => { let best = 1e9, still = 0; for (let i = 0; i < (max || 900); i++) { const P = Player.pos, d = Math.hypot(x - P[0], z - P[2]); if (d < (tol || 0.45) && (y === undefined || Math.abs(P[1] - y) < 0.9)) { lift('KeyW'); return true; }
    const want = Math.atan2(x - P[0], -(z - P[2])); Player.yaw += angDiff(want, Player.yaw) * 0.5; Player.pitch = 0; press('KeyW'); game.step(1, dt); if (d < best - 0.02) { best = d; still = 0; } else if (++still > 120) break; } lift('KeyW'); return false; };
const walkPath = (from, to) => { const p = navPath(from, to); if (!p) return 'no way on the villagers\' graph'; for (const k of p.slice(1)) { const n = Nav.nodes[k]; if (Nav.portal[k] !== undefined && Nav.portal[Nav.portal[k]] === k && Math.hypot(n[0] - Player.pos[0], n[2] - Player.pos[2]) > 30) return null; if (!walkTo(n[0], n[1], n[2], 0.5)) return 'stuck at ' + Player.pos.map(v => v.toFixed(1)).join(', ') + ' short of ' + n.map(v => v.toFixed(1)).join(', '); } return null; };
game.enter('inn'); game.step(5, dt); const c = Cells.by.inn, f = HART.at; if (!f) throw new Error('HARTDOOR FAIL the Hart has no cellar in its plan');
// 1. from the front door down to the cellar, on foot
const start = Player.pos.slice(); log.push('door ' + start.map(v => v.toFixed(1)));
// the stair the plan built (not the villagers' graph, which joins the two floors by a step straight through the common-room floor): its head, then down it
const P = World.houses.inn.plan, st = P.stairs.find(q => q.k0 < 0 && q.k1 === 0) || P.stairs.find(q => q.k1 === 0); if (!st) bad.push('the Hart has no stair to its cellar');
else { const lo = st.low, along = st.axis === 'x', mid = along ? (lo.z0 + lo.z1) / 2 : (lo.x0 + lo.x1) / 2, top = st.dir > 0 ? (along ? lo.x1 : lo.z1) : (along ? lo.x0 : lo.z0), bot = st.dir > 0 ? (along ? lo.x0 : lo.z0) : (along ? lo.x1 : lo.z1), sg = st.dir > 0 ? 1 : -1;
  const at = (u, k, h) => P.w2(along ? u : mid, P.lv[k].y + (h || 0), along ? mid : u), head = at(top + sg * 0.9, 0), foot = at(bot - sg * 0.9, st.k0);
  log.push('stair head ' + head.map(v => v.toFixed(1)) + ' foot ' + foot.map(v => v.toFixed(1)));
  { const cd = P.doors.find(d => d.cellarDoor); if (cd) {      /* [inout] the stair is behind a door in the common room's back wall (inbox, 2026-11-18): through it first, by the villagers' own way to the top of the stair */
      const wp = [[cd.x * 0.5, 2.0], [cd.x, cd.z - 0.9], [cd.x, cd.z + 0.9]];
      for (const [x, z] of wp) { const w = P.w2(x, 0.02, z); if (!walkTo(w[0], w[1], w[2], 0.45)) { bad.push('could not walk from the door to the cellar door: stopped at ' + Player.pos.map(v => v.toFixed(1)).join(', ') + ' short of local ' + x.toFixed(1) + ',' + z.toFixed(1)); break; } } } }
  if (!bad.length && !walkTo(head[0], head[1], head[2], 0.4)) bad.push('could not walk from the door to the head of the cellar stair: stopped at ' + Player.pos.map(v => v.toFixed(1)).join(', '));
  else if (!walkTo(foot[0], foot[1], foot[2], 0.5)) bad.push('could not walk down the cellar stair: stopped at ' + Player.pos.map(v => v.toFixed(1)).join(', ')); else log.push('in the cellar at ' + Player.pos.map(v => v.toFixed(1))); }
if (Player.pos[1] > f.prop[1] + 0.8) bad.push('not down in the cellar (feet at ' + Player.pos[1].toFixed(2) + ', cellar floor ' + f.prop[1].toFixed(2) + ')');
// 2. to the east wall, and the prompt there
if (!bad.length) { if (!walkTo(f.land[0], f.land[1], f.land[2], 0.35)) bad.push('could not walk up to the fresh brick from ' + Player.pos.map(v => v.toFixed(1)).join(', '));
  Player.yaw = Math.PI / 2; Player.pitch = -0.1; game.step(4, dt); log.push('prompt untold: ' + (UI.prompt ? UI.promptLab : '-')); if (!UI.prompt || !/fresh brick/i.test(UI.promptLab)) bad.push('at the east wall a player who has not been told gets no word about the fresh brick (' + (UI.prompt ? UI.promptLab : 'no prompt') + ')');
  S.flags.act2 = 1; game.step(3, dt); log.push('prompt told: ' + (UI.prompt ? UI.promptLab : '-')); if (!UI.prompt || !/Pull at the fresh brick/.test(UI.promptLab)) bad.push('told, the prompt is not "Pull at the fresh brick" (' + (UI.prompt ? UI.promptLab : 'none') + ')');
  if (UI.prompt) { interactUse(UI.prompt); for (let i = 0; i < 40 && UI.reader; i++) { closeReader(); game.step(1, dt); } }
  if (!S.flags.sec_wall) bad.push('using the fresh brick did not open it');
  game.step(4, dt); if (A2.door && A2.door.visible === false) bad.push('the doorway is not drawn where the bricks came out');
  log.push('prompt opened: ' + (UI.prompt ? UI.promptLab : '-')); if (!UI.prompt || UI.prompt.id !== 'door.tunnel.in') bad.push('in front of the opened wall the prompt is not the smugglers\' door (' + (UI.prompt ? UI.promptLab : 'none') + ')');
  else { interactUse(UI.prompt); for (let i = 0; i < 200 && Cells.busy; i++) { game.step(1, dt); await new Promise(r => setTimeout(r, 20)); } game.step(4, dt); if (!World.cell || World.cell.id !== 'mine') bad.push('the smugglers\' door did not lead into the tunnel (' + (World.cell && World.cell.id) + ')');
    const back = World.interact.find(o => o.id === 'door.tunnel.out'); if (back) { Cells.travel(back.dest); for (let i = 0; i < 200 && Cells.busy; i++) { game.step(1, dt); await new Promise(r => setTimeout(r, 20)); } game.step(4, dt); const P = Player.pos; if (!World.cell || World.cell.id !== 'inn' || Math.abs(P[1] - f.prop[1]) > 0.8 || Math.hypot(P[0] - f.land[0], P[2] - f.land[2]) > 1.2) bad.push('the way up from the tunnel lands at ' + P.map(v => v.toFixed(1)).join(', ') + ' in ' + (World.cell && World.cell.id) + ', not in front of the brick'); } } }
// 3. the compass, in the Hart with the cellar to find
{ const q0 = S.q.main; S.q.main = { stage: 7 }; game.leave(); game.step(2, dt); game.enter('inn'); game.step(3, dt); const t = questTarget('main'); if (!t || !HART.stair || Math.hypot(t[0] - HART.stair[0], t[2] - HART.stair[2]) > 0.5) bad.push('in the common room the compass does not point at the head of the cellar stair');
  Cells.teleport({ p: f.land.slice(), yaw: Math.PI / 2 }); game.step(3, dt); const t2 = questTarget('main'); if (!t2 || Math.hypot(t2[0] - f.use[0], t2[2] - f.use[2]) > 0.5) bad.push('down in the cellar the compass does not point at the brick'); if (q0) S.q.main = q0; else delete S.q.main; }
delete S.flags.act2; delete S.flags.sec_wall; if (typeof OWN !== 'undefined') OWN.off = false;
if (bad.length) throw new Error('HARTDOOR FAIL ' + bad.length + ': ' + bad.join('; ') + ' | ' + log.join(' | '));
return 'hartdoor PASS front door to the cellar on foot, the fresh brick named at the east wall, opened once told, the doorway drawn, into the tunnel and back up in front of it; the compass points at the stair head from the common room and at the brick from the cellar | ' + log.join(' | ');
