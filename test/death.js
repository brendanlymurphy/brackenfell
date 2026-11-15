// Dies far from the inn and respawns in the bed. Run: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/death.js)" --out /tmp/death.png
const log = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const r = RPG.st(), bed = World.interact.find(i => i.id === 'inn.bed');
S.flags.bed = 1; S.gold = 100; game.tp(-84, -6.5, 90); game.step(10, 1 / 30);
// food heals
r.hp = 40; give('bread'); Inv.use('bread'); log.push('ate bread hp ' + r.hp + ' bread ' + (S.items.bread || 0));
give('potion'); Inv.use('potion'); log.push('potion hp ' + r.hp);
Inv.use('apple'); // none left: must do nothing
// damage with armour and the i-frames of a dodge
r.hp = 100; const d1 = RPG.damage(20, null, 'melee'); log.push('hit ' + d1 + ' hp ' + r.hp);
RPG.iframes = 1; log.push('during iframes ' + RPG.damage(20, null, 'melee')); RPG.iframes = 0;
// die
game.step(3, 1 / 30);
RPG.damage(500, null, 'melee');
game.step(20, 1 / 30);
log.push('dead ' + RPG.dead + ' locked ' + Player.locked + ' msgShown ' + !document.getElementById('deadMsg').hidden + ' hp ' + r.hp);
for (let i = 0; i < 400 && RPG.dead; i++) await sleep(50);      // respawn is on real timers (about 1.3 s; slower when the page is busy drawing)
log.push('after respawn dead ' + RPG.dead + ' hp ' + r.hp + ' sta ' + r.sta + ' gold ' + S.gold + ' locked ' + Player.locked);
const dx = Player.pos[0] - bed.p[0], dz = Player.pos[2] - bed.p[2];
log.push('distance to bed ' + Math.hypot(dx, dz).toFixed(2) + ' y ' + Player.pos[1].toFixed(2) + ' bed y ' + bed.p[1].toFixed(2) + ' msgHidden ' + document.getElementById('deadMsg').hidden);
game.step(30, 1 / 30);
log.push('still alive ' + !RPG.dead + ' hp ' + r.hp);
return log;
