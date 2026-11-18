// The Old Mine: every kind of foe in it can be killed with scripted input (delver, lurker, the Foreman), the Foreman's pattern is seen (slam, charge, stun), the lantern burns oil, the trap
// springs and can be cut. Run: node test/shot.mjs --opt webgl=1 --opt quality=medium --opt play=1 --do "$(cat test/mine.js)"
const log = [], fails = [], fx = (c, m) => { if (!c) fails.push(m); }, K = Input.keys, r = RPG.st(), dt = 1 / 30, sleep = ms => new Promise(q => setTimeout(q, ms));
game.step(1, dt); await Foes.loading; const mc = Cells.by.mine, O = mc.origin, FY = mc.floorY; fx(mc && MINE.built, 'no mine');
{ let a = 7 >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }       /* [cast] the seed again, after the foes have loaded: loading draws a different number of random numbers each time (assets arrive in any order), so a seed set before boot left the fight to chance (MINE FAIL twice on Build 85) */
Env.hour = 12; S.flags.bed = 1; qStart('welcome'); qDone('welcome'); S.items.lantern = 1; MINE_S().oil = 600; S.items.potion = 9;
const inMine = (x, z, yaw) => { Cells.teleport({ p: [O[0] + x, FY + 0.1, O[2] + z], yaw: (yaw || 0) * Math.PI / 180, cell: 'mine' }); game.step(3, dt); };
const mf = Foes.list.filter(f => f.camp.cell === 'mine'); fx(mf.length === MINE.SPAWN.length, 'mine foes ' + mf.length); log.push('mine foes ' + mf.map(f => f.kind).join(','));
// the lantern: lit, burns oil, goes dry, refills from a flask
inMine(0, 3); const o0 = MINE_S().oil; game.step(60, dt); fx(MINE.lamp.on && MINE_S().oil < o0 - 1.5, 'lantern did not burn (' + o0 + ' -> ' + MINE_S().oil + ')');
S.flags.lampOff = 1; game.step(2, dt); fx(!MINE.lamp.on, 'lantern did not douse'); S.flags.lampOff = 0; MINE_S().oil = 0; S.items.oil = 1; game.step(3, dt); fx(MINE_S().oil > 500 && !has('oil'), 'a flask did not refill the lantern'); MINE_S().oil = 600; log.push('lantern ok');
// the trap: walking into the cord springs it; cutting it first does not; a jump clears it
{ const ms = MINE_S(); ms.trap = 0; r.hp = 100; inMine(0, 12); Player.pos[1] = FY; Input.keys.KeyW = true; Player.yaw = Math.PI; game.step(45, dt); Input.keys = {}; fx(ms.trap === 1 && r.hp < 100, 'the trap did not spring (' + ms.trap + ', hp ' + r.hp + ')');
  ms.trap = 0; r.hp = 100; inMine(0, 12); const cord = World.interact.find(i => i.id === 'mine.cord'); fx(interactLabel(cord) === 'Cut the cord', 'no cord prompt'); interactUse(cord); fx(ms.trap === 2 && interactLabel(cord) === null, 'cord not cut');
  Input.keys.KeyW = true; Player.yaw = Math.PI; game.step(45, dt); Input.keys = {}; fx(ms.trap === 2 && r.hp === 100, 'a cut cord hurt'); log.push('trap sprung, cut'); ms.trap = 0; }
// fights
const seen = new Set();
async function fight(f, maxS, startAt) {
  inMine(startAt[0], startAt[1], startAt[2] || 0); Foes.calm(true); f.state = 'idle'; let i = 0, hpMin = 100;
  for (; i < 30 * maxS && f.alive; i++) {
    const P = Player, dx = f.pos[0] - P.pos[0], dz = f.pos[2] - P.pos[2], d = Math.hypot(dx, dz), want = Math.atan2(dx, -dz); let dy = want - P.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    P.yaw += Math.max(-0.12, Math.min(0.12, dy)); Input.keys.KeyW = d > 2.0;
    const incoming = Foes.list.some(g => g.alive && g.state === 'attack' && g.atk && !g.atk.done && Math.hypot(g.pos[0] - P.pos[0], g.pos[2] - P.pos[2]) < 3.2 && g.t > 0.12);
    RPG.in.block = incoming && r.sta > 14; const shown = f.kind !== 'foreman' || (seen.has('b_slam') && seen.has('b_charge')) || i > 30 * 60; RPG.in.atk = shown && d < 2.6 && !RPG.in.block && (i % 14) < 9;          /* [cast] the Foreman is not cut down before he has shown his slam and his charge (he sometimes fell first, and the pattern check failed by chance: MINE FAIL on Build 85) */ r.sta = Math.max(r.sta, 40);
    if (r.hp < 45) r.hp = 100; game.step(1, dt); hpMin = Math.min(hpMin, r.hp); seen.add(f.state);
  }
  RPG.in.atk = false; RPG.in.block = false; Input.keys = {};
  fx(!f.alive, f.id + ' not killed in ' + maxS + 's (hp ' + f.hp.toFixed(0) + '/' + f.maxHp + ', ' + f.state + ')'); log.push(f.id + ' down in ' + (i * dt).toFixed(1) + 's, min hp ' + hpMin.toFixed(0)); return i * dt;
}
await fight(mf.find(f => f.kind === 'delver'), 60, [3.5, 25.5]);
{ const L = mf.find(f => f.kind === 'lurker' && f.pos[0] - O[0] > 20 && f.pos[2] - O[2] < 40); inMine(10, 31, 90); L.state = 'idle'; Player.vel = [0, 0, 0]; let heard = 0; const _e = Snd.event; Snd.event = function (n) { if (n === 'creak' || n === 'rustle') heard++; return _e.apply(this, arguments); };
  for (let i = 0; i < 30 * 12; i++) { Player.pos[0] = O[0] + 14; Player.pos[2] = O[2] + 31.5; Player.pos[1] = FY - 0.8; game.step(1, dt); } Snd.event = _e; fx(heard >= 2, 'the lurker was not heard before it was seen (' + heard + ')'); fx(L.state === 'idle', 'lurker woke at range ' + L.state); log.push('lurker heard ' + heard + 'x from 12 m, still hidden');
  await fight(L, 60, [20, 31]); }
{ const B = mf.find(f => f.kind === 'foreman'); inMine(-2, 68.5, 0); Foes.calm(true); B.pos[0] = O[0] - 2; B.pos[2] = O[2] + 60.5; B.pos[1] = FY; B.state = 'b_charge'; B.t = 0; B.hitDone = false; r.hp = 100; let st = 0;
  for (let i = 0; i < 30 * 9 && !st; i++) { Player.pos[0] = O[0] - 2; Player.pos[2] = O[2] + 68.5; game.step(1, dt); if (B.state === 'b_stun') st = i; }
  fx(st > 0, 'the charge did not end against the column (' + B.state + ')'); fx(r.hp === 100, 'a charge at a player behind a column hurt (' + r.hp + ')'); const hp0 = B.hp; RPG.in.atk = false; log.push('charge into the column: stunned after ' + (st * dt).toFixed(1) + 's'); seen.add('b_stun'); }
await fight(mf.find(f => f.kind === 'foreman'), 200, [8, 60, 270]);
fx(seen.has('b_slam') && seen.has('b_charge') && seen.has('b_stun'), 'the Foreman did not show his pattern: ' + [...seen].join(','));
const fm = mf.find(f => f.kind === 'foreman'); const loot = World.interact.find(i => i.foe === fm); fx(loot && loot.loot.some(l => l[0] === 'foremankey'), 'the Foreman dropped no key');
log.push('foreman states ' + [...seen].filter(s => /^b_/.test(s)).join(','));
if (fails.length) throw new Error('MINE FAIL ' + JSON.stringify({ fails: fails.slice(0, 20).map(x => String(x).slice(0, 200)), log }));       /* [cast] the reasons first: the gate's log cuts a long message, and on Build 85 it cut them off */
return 'mine PASS ' + JSON.stringify(log);
