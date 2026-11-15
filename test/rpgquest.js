// The three outlaw quests, with kills made by direct sweeps (the fighting itself is test/combat.js), plus loading an old save.
// Run: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/rpgquest.js)"
const log = [], dt = 1 / 30;
game.step(1, dt); await Foes.loading;
const opt = t => { const b = [...document.getElementById('dopts').children].find(b => b.textContent.startsWith(t)); if (b) b.click(); else log.push('MISSING option ' + t); };
const talkTo = (id, ...picks) => { const n = NPC[id]; Player.pos = [n.pos[0] + 1, n.pos[1], n.pos[2]]; startTalk(n); for (const p of picks) opt(p); let g = 0; while (UI.talk && g++ < 6) { const k = document.getElementById('dopts').children; k[k.length - 1].click(); } };
const kill = f => { Player.pos = [f.pos[0] - 1.2, f.pos[1], f.pos[2]]; Player.yaw = Math.PI / 2; Foes.sweep(Player.pos, Player.yaw, 3, 3.2, 999, true); game.step(2, dt); };
const loot = f => { const it = World.interact.find(i => i.foe === f); if (it) { Player.pos = [f.pos[0] - 1, f.pos[1], f.pos[2]]; interactUse(it); } else log.push('no loot on ' + f.id); };
// old save: no S.rpg at all
const old = JSON.parse(JSON.stringify({ v: 1, S: { gold: 77, items: { hammer: 1 }, q: { welcome: { stage: 1, done: true } }, flags: { bed: 1 }, opened: {}, picked: {} }, hour: 9, pos: [-84, 0, -6.5], yaw: 1 }));
applySave(old); log.push('old save: gold ' + S.gold + ' hp ' + RPG.st().hp + ' weapon ' + RPG.st().eq.weapon + ' has sword ' + has('shortsword'));
S.q = { welcome: { stage: 1, done: true, t: 0 } }; S.items = { shortsword: 1 }; S.gold = 10; S.flags = { bed: 1 }; S.rpg = null; RPG.st();
// elder: camp in the pines
const board = World.interact.find(i => i.id === 'board'); log.push('board ' + (board ? interactLabel(board) : 'none')); if (board) { interactUse(board); closeReader(); }
log.push('bounty quest ' + qAt('bounty') + ' ' + bountyN() + '/' + BOUNTY_N);
talkTo('rowan', 'Is the valley safe', 'I’ll see to it'); log.push('camp quest ' + qAt('camp'));
for (const f of Foes.alive('pines')) kill(f); log.push('pines cleared, camp quest ' + qAt('camp'));
const g0 = S.gold; talkTo('rowan', 'The camp in the pines'); log.push('camp quest ' + qAt('camp') + ' gold +' + (S.gold - g0) + ' buckler ' + has('buckler'));
// smith: tools from the chief at the crag camp
talkTo('brandt', 'Have the outlaws', 'I’ll get them back'); log.push('tools quest ' + qAt('tools'));
const chief = Foes.list.find(f => f.chief); kill(chief); loot(chief); log.push('after chief: tools ' + has('tools') + ' steelsword ' + has('steelsword') + ' quest stage ' + qAt('tools'));
talkTo('brandt', 'I have your tongs'); log.push('tools quest ' + qAt('tools') + ' ironsword ' + has('ironsword') + ' tools left ' + has('tools'));
// bounty: eight kills so far, five of them since the board was read
for (const f of Foes.list) if (f.alive) kill(f);
log.push('bounty ' + bountyN() + '/' + BOUNTY_N + ' stage ' + qAt('bounty'));
// the dead stay dead across a save and a reload of state
save(); const j = JSON.parse(localStorage.getItem('brackenfell.v1')); log.push('saved rpg kills ' + j.S.rpg.kills + ' cleared ' + Object.keys(j.S.rpg.cleared || {}).join(','));
const g1 = S.gold; talkTo('hale', 'I’ve come for the bounty'); log.push('bounty quest ' + qAt('bounty') + ' gold +' + (S.gold - g1));
log.push('active quests ' + QORDER.filter(id => S.q[id] && !S.q[id].done).join(',') + ' done ' + QORDER.filter(id => qAt(id) === 99).join(','));
return log;
