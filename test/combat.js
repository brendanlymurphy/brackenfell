// Fights an outlaw at the pines camp with scripted input until one dies, loots it, checks health, stamina, inventory and quest state.
// Run: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/combat.js)" --out /tmp/combat.png
const log = [], K = Input.keys, r = RPG.st(), dt = 1 / 30;
game.step(1, dt); await Foes.loading;
const camp = Foes.camps[0], tgtId = window.__foe;           // optional: window.__foe = 'pines.1' to pick the opponent
Env.hour = 17.5; S.flags.bed = 1; qStart('welcome'); qDone('welcome'); qStart('bounty'); bountyText();
const bounty0 = bountyN(), kills0 = r.kills, gold0 = S.gold, inv0 = JSON.stringify(S.items);
// walk up from the east side, outside the sight range
game.tp(camp.x + 20, camp.z + 14, 0); game.step(4, dt);
let minHp = 100, minSta = 100, hitStops = 0, victim = null, t = 0, maxFoeState = {}, swings = 0, blocks = 0, prevSw = 0;
const states = new Set();
for (let i = 0; i < 30 * 90 && !victim; i++) {
  const P = Player, f = Foes.nearest(P.pos, camp.id); if (!f) break;
  const dx = f.pos[0] - P.pos[0], dz = f.pos[2] - P.pos[2], d = Math.hypot(dx, dz), want = Math.atan2(dx, -dz);
  let dy = want - P.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  P.yaw += Math.max(-0.12, Math.min(0.12, dy));
  K.KeyW = d > 2.1; K.ShiftLeft = d > 9;
  const incoming = Foes.list.some(g => g.alive && g.state === 'attack' && g.atk && !g.atk.done && Math.hypot(g.pos[0] - P.pos[0], g.pos[2] - P.pos[2]) < 3.2 && g.t > 0.12);
  RPG.in.block = incoming && r.sta > 14;
  RPG.in.atk = d < 2.7 && !RPG.in.block && (i % 14) < 9;
  if (r.hp < 38 && has('potion')) Inv.use('potion'); else if (r.hp < 40 && has('bread')) Inv.use('bread');
  if (r.hp < 40 && !has('potion') && !has('bread')) r.hp = 100;            // keep the script alive: this test is about the kill
  const k0 = r.kills; game.step(1, dt); minHp = Math.min(minHp, r.hp); minSta = Math.min(minSta, r.sta); if (RPG.hitStop > 0) hitStops++; if (Combat.swingN !== prevSw) { prevSw = Combat.swingN; swings++; }
  for (const g of Foes.list) states.add(g.state);
  if (r.kills > k0) victim = Foes.list.find(g => g.state === 'dead' && g.t < 0.2) || Foes.list.find(g => !g.alive && g.lootIt);
  t = i * dt;
}
K.KeyW = false; K.ShiftLeft = false; RPG.in.atk = false; RPG.in.block = false;
log.push('killed ' + (victim && victim.id) + ' after ' + t.toFixed(1) + 's, swings ' + swings + ', min hp ' + minHp.toFixed(0) + ', min sta ' + minSta.toFixed(0) + ', hit-stop frames ' + hitStops);
log.push('states seen ' + [...states].join(','));
log.push('kills ' + (r.kills - kills0) + ' bounty ' + bounty0 + '->' + bountyN() + ' quest bounty stage ' + qAt('bounty'));
if (victim) {
  game.step(40, dt);
  game.tp(victim.pos[0] - 1.0, victim.pos[2], 90); game.step(2, dt);
  const it = World.interact.find(i => i.foe === victim); log.push('loot prompt ' + (it ? interactLabel(it) : 'none'));
  if (it) interactUse(it);
  log.push('gold ' + gold0 + '->' + S.gold + ' items ' + inv0 + ' -> ' + JSON.stringify(S.items));
}
log.push('hp ' + r.hp.toFixed(0) + ' sta ' + r.sta.toFixed(0) + ' alive foes ' + Foes.alive().length);
return log;
