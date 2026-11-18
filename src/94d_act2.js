// ───────────────────────── Acts 2 and 3 (q1): the smugglers' tunnel, the Bread Cave, what is owed, two endings ─────────────────────────
// Rowan tells the rest. The way is the Hart's cellar wall (the fresh brick: a door now), a timbered smugglers' tunnel under the town that runs out under the lake shore to the Bread Cave, where
// twelve stand in a row and a slab wants bread. The tunnel and cave are more regions of the Old Mine's cell (94_mine.js builds them), joined to the Hart's cellar and to a cleft on the west shore.
// Two endings change the village (S.flags.ending = 'bread' | 'rest'): candles and a loaf table on the Wharf and a bread-day in the Hart; or the mine door open with lanterns, a cairn of silver and
// the dead put to bed. Nothing is a dead end: the wall opens with the Elder's word instead of the ledger, and bread can be bought.
// (the cell is 150 m square and the world finds it by position, so all of it stays within x and z of -75 to 75 in the cell's frame: the tunnel runs west under the north side)
MINE.REG.push(
  { id: 'hartstep', x0: 60, z0: -34, x1: 70, z1: -26, h: 3.0, kind: 'timber' },
  { id: 'tn1', x0: -34, z0: -32, x1: 60, z1: -28, h: 2.9, kind: 'timber' },
  { id: 'cache', x0: 20, z0: -40, x1: 30, z1: -32, h: 3.2, kind: 'cave' },
  { id: 'bread', x0: -66, z0: -48, x1: -34, z1: -12, h: 6.5, kind: 'cave' },
  { id: 'shore', x0: -72, z0: -33, x1: -66, z1: -27, h: 3.5, kind: 'cave', ramp: { ax: 'x', a: -66, b: -72, y0: 0, y1: 1.2 } },
);
MINE.SPAWN.push({ kind: 'lurker', x: 40, z: -30, yaw: PI / 2 }, { kind: 'delver', x: 4, z: -30, yaw: -PI / 2 }, { kind: 'lurker', x: -24, z: -30, yaw: PI / 2 });
MINE.AT.hart = [64, -30]; MINE.AT.bread = [-50, -30]; MINE.AT.shore = [-69, -30];
const A2 = { built: false, cave: { x: -48, z: 122 } };
const a2w = (x, y, z) => [MINE.O[0] + x, MINE.FY + y, MINE.O[2] + z];
// ── the story: stages, Rowan's telling, the way ──
QUESTS.main.stages.push('Find the way under the Honeyed Hart', 'Follow the smugglers’ tunnel to the shore', 'Decide what is owed at the Bread Cave');
MAIN_FACTS = () => [!!S.flags.sawBody, !!S.flags.pell, has('minekey') || !!S.flags.mineOpen, !!S.flags.mineOpen, has('journal') || !!S.flags.corwin, !!S.flags.act1, !!S.flags.act2, !!S.flags.tunnel, !!S.flags.cave, !!S.flags.ending];
mainSync = function () {
  if (_mainBusy || qAt('main') < 0 || qAt('main') === 99) return; _mainBusy = true;
  try { const f = MAIN_FACTS(); let i = f.indexOf(false); if (i < 0) i = f.length; if (i >= f.length) { qDone('main'); } else qStage('main', i); } finally { _mainBusy = false; }
};
// [logic] the journal says what Rowan said: come back tomorrow
const _ql94d = questLine; questLine = function (id) { if (id === 'main' && qAt('main') === 6 && S.flags.rowanAsked && !S.flags.act2 && S.flags.rowanDay !== undefined && (RPG.st().day || 0) <= S.flags.rowanDay) return 'Go back to Elder Rowan tomorrow: he will tell the rest when he has slept on it'; return _ql94d(id); };
const _qt94d = questTarget;
questTarget = function (id) {
  if (id !== 'main') return _qt94d(id);
  const st = qAt('main'); if (st === 7) { const h = World.houses.inn; return h && h.site ? [h.site.x, 0, h.site.z] : [0, 0, -17]; }
  if (st === 8) return a2w(S.flags.tunnel ? -50 : 64, 1, -30); if (st === 9) return a2w(-50, 1, -30);
  return _qt94d(id);
};
const _rowan94d = TALK.rowan;
TALK.rowan = function () {
  if (S.flags.ending === 'bread') return node('The bread goes out at dawn. I carry it myself, and I am too old to be told it is a kindness.\n\nThe count stays kept. Sit. It will not hurt you to be counted.');
  if (S.flags.ending === 'rest') return node('It is quiet. I did not know quiet could be this loud.\n\nThey are asleep. Thank you. I could not have said the names. I tried.');
  if (S.flags.rowanAsked && !S.flags.act2 && !(S.flags.rowanDay !== undefined && (RPG.st().day || 0) <= S.flags.rowanDay)) return node('Sit. You will want it from the start, and you will not like where it starts.\n\nFifty years back my father sold the last seam of the Old Mine to a Crown assayer, and the silver was singing, and he would not share it. He sealed the adit with twelve of his own shift still below. They did not die as you or I do. They stayed. They kept digging.', [['And the bread?', () => node('It was never for their bellies. It was so that someone remembered them. Every dawn a loaf and a pail, left on the slab in the cave on the shore, and the count said aloud: one to twelve. As long as the count is kept they stay men. If it is not, the song takes what is left of the men in them, and they come up.\n\nI carried it thirty years.', [['Then why did it stop?', () => node('I stopped it. Three weeks ago. Greta has found a buyer who pays double and wants the silver by the barrow, and I am old, and I thought: let it end with me. Pell walked out by the lake cave to ask why the bread had not come. You saw how far a man gets in daylight who has been so long under.', [['What must I do?', () => { S.flags.act2 = 1; mainSync(); toast('<b>Act two begins.</b> The way is the Hart’s east cellar wall.'); save(); return node('Go the way Greta’s people ran the silver out. The Hart’s cellar has a wall that was never the end of the cellar: the fresh brick on the east side. A tunnel runs from there under the town to the lake cave.\n\nThe twelve stand by the slab. You will know what to do when you see them. I never did.'); }, 1]])]])]]);
  if (S.flags.act2) return node('Go on. The Hart. The east cellar wall, newer brick than the rest. Take bread. Take a light. Take your courage in both hands, because it has been a long while since anyone went that way and meant well.');
  return _rowan94d.call(this);
};
// the Hart's cellar wall opens for those who have been told (no dead end if the ledger was never found)
if (typeof SECRETS !== 'undefined') SECRETS.wall.gate = () => secFlag('attic') || !!S.flags.hear_hartledger || !!S.flags.act2;
// ── the places ──
function act2Build() {
  if (A2.built) return; A2.built = true;
  const fm = (fn, p, yaw, o) => secProp(fn, p, yaw, Object.assign({ cell: 'mine', light: 0.8 }, o || {}));
  // the doorway in the Hart's cellar (shown once the bricks are out) and its portal; the way back
  { const inn = Cells.by.inn, ip = [266.4, -402.2, 4.6];
    A2.door = secProp(m => { m.mat(MAT.PLAIN, [0.02, 0.018, 0.016]); m.box(-0.5, 0, -0.1, 0.5, 1.9, 0.0, 0); m.mat(MAT.TIMBER, COL.timberDark, 0.6); m.box(-0.62, 0, -0.14, -0.5, 2.0, 0.04, 4); m.box(0.5, 0, -0.14, 0.62, 2.0, 0.04, 4); m.box(-0.62, 1.9, -0.14, 0.62, 2.04, 0.04, 4); }, [266.95, -402.7, 4.6], -Math.PI / 2, { r: 2.0, zone: 1, cell: 'inn', light: 0.9 }); A2.door.visible = false;
    World.interact.push({ kind: 'portal', thru: true, id: 'door.tunnel.in', p: ip, r: 2.4, zone: 1, cell: 'inn', label: 'Go down by the smugglers’ door', dest: { p: a2w(63, 0.1, -30), yaw: -Math.PI / 2, cell: 'mine', name: 'The Smugglers’ Tunnel' }, side: 'in', lock: () => S.flags.sec_wall ? null : 'Just a wall.' });
    World.interact.push({ kind: 'portal', id: 'door.tunnel.out', p: a2w(68.6, 1.0, -30), r: 2.4, zone: 0, cell: 'mine', label: 'Go up to the Hart’s cellar', dest: { p: [265.3, -402.6, 4.6], yaw: -Math.PI / 2, cell: 'inn', name: 'The Honeyed Hart' }, side: 'in' }); }
  // the way out to the lake, a cleft in the west shore, and the way back in
  { const cx = A2.cave.x, cz = A2.cave.z, cy = Terrain.y(cx, cz);
    World.interact.push({ kind: 'portal', id: 'door.cave.out', p: a2w(-71, 2.2, -30), r: 2.6, zone: 0, cell: 'mine', label: 'Climb out to the shore', dest: { p: [cx + 2.0, Terrain.y(cx + 2.0, cz), cz], yaw: Math.PI / 2, cell: null, name: 'The lake shore' }, side: 'in' });
    World.interact.push({ kind: 'portal', id: 'door.cave.in', p: [cx + 0.6, cy + 1.0, cz], r: 2.6, zone: 0, label: 'Go into the cave', dest: { p: a2w(-68.5, 1.0, -30), yaw: Math.PI / 2, cell: 'mine', name: 'The Bread Cave' }, side: 'out' });
    act2CaveOutside(cx, cz, cy); }
  // the tunnel's furnishing: crates and kegs in the cache, a bench, rope; the lanterns have been put out
  fm(m => { for (const [x, z, s, r] of [[0, 0, 0.7, 0.2], [1.2, 0.3, 0.6, -0.4], [0.4, 1.1, 0.5, 1.1]]) { m.push().T(x, 0, z).RY(r); Props.crate(m, s, true); m.pop(); } m.push().T(-1.3, 0, 0.8); Props.barrel(m, 0.34, 0.9, true); m.pop(); m.push().T(-1.9, 0, 0.1); Props.barrel(m, 0.34, 0.9, true); m.pop(); }, a2w(25, 0, -37), 0.3, { r: 4 });
  fm(m => { m.mat(MAT.TIMBER, COL.timberDark, 0.6); m.box(-0.9, 0.4, -0.2, 0.9, 0.46, 0.2, 4); for (const x of [-0.8, 0.8]) m.box(x - 0.05, 0, -0.18, x + 0.05, 0.4, 0.18, 0); m.mat(MAT.CLOTH, [0.5, 0.44, 0.34], 0.5); m.ball(0.1, 0.52, 0, 0.18, 0.08, 0.14, 7, 4); }, a2w(-8, 0, -28.7), 0.1, { r: 2 });
  // the slab, the old loaves on it, the candle ends, and the twelve in a row by the water
  fm(m => { m.mat(MAT.STONE, [0.7, 0.68, 0.64], 0.7); m.box(-1.5, 0, -0.55, 1.5, 0.9, 0.55, 4); m.mat(MAT.STONE, [0.82, 0.8, 0.76], 0.7); m.box(-1.6, 0.9, -0.62, 1.6, 1.0, 0.62, 4); m.mat(MAT.CLOTH, [0.34, 0.4, 0.28], 0.4); for (const x of [-0.9, -0.3, 0.3, 0.9]) m.ball(x, 1.06, ((x * 7) % 0.3), 0.16, 0.07, 0.11, 7, 4); m.mat(MAT.PLAIN, [0.8, 0.74, 0.6]); for (const x of [-1.3, 1.3]) m.cyl(x, 1.0, 0.2, 0.03, 0.03, 0.13, 6, 0); }, a2w(-50, 0, -30), Math.PI / 2, { r: 4 });
  { const row = [], zs = [-45.5, -43.3, -41.1, -38.9, -36.7, -34.5, -25.5, -23.3, -21.1, -18.9, -16.7, -14.5]; zs.forEach((z, k) => { const c = [0.18 + (k % 3) * 0.02, 0.15 + (k % 2) * 0.02, 0.14]; row.push(fm(m => secCloak(m, c, 0.9 + (k % 4) * 0.04), a2w(-58 - (k % 2) * 0.35, 0, z), Math.PI / 2 + (k % 3) * 0.06, { r: 1.3 })); }); A2.row = row; }
  for (const [x, y, z, r, c] of [[-60, 3.2, -30, 16, [0.6, 1.0, 1.8]], [-48, 3.4, -30, 12, [0.5, 0.8, 1.4]], [-69, 2.4, -30, 8, [0.6, 0.9, 1.2]], [62, 2.0, -30, 8, [0.5, 0.7, 1.0]]]) MINE.lights.push(addLight(a2w(x, y, z), r, c, 0, 'hum'));
  for (const [x, z] of [[-50.5, -31.2], [-47.5, -31.2]]) { const e = { type: 'candle', p: a2w(x, 1.15, z), zone: 0, always: true, seed: x, cell: 'mine' }; World.emitters.push(e); }
  // the slab and the tally book
  World.interact.push({ p: a2w(-52, 1.2, -30), r: 2.6, zone: 0, cell: 'mine', kind: 'slab', id: 'mine.slab', label: 'Stand at the slab' });
  // what the endings put in the village
  A2.end = { bread: [], rest: [] };
  { const cs = []; for (let k = 0; k < 7; k++) { const e = { type: 'candle', p: [10.6 + k * 1.3, 0.55, 76.1], zone: 0, always: false, seed: 3 + k }; World.emitters.push(e); cs.push(e); } A2.candles = cs;
    A2.loaves = secProp(m => { m.mat(MAT.PLANKS, [0.45, 0.36, 0.26], 0.5); m.box(-0.8, 0.5, -0.35, 0.8, 0.55, 0.35, 4); for (const x of [-0.7, 0.7]) for (const z of [-0.28, 0.28]) m.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.5, z + 0.04, 0); m.mat(MAT.CLOTH, [0.72, 0.58, 0.34], 0.4); for (let i = 0; i < 8; i++) m.ball(-0.6 + i * 0.17, 0.62, (i % 2 ? 0.12 : -0.12), 0.1, 0.07, 0.08, 6, 3); }, [12.0, 0.0, 77.4], 0.1, { r: 1.6 }); A2.loaves.visible = false;
    const cp = Terrain.y(A2.cave.x + 3, A2.cave.z + 2); A2.cairn = secProp(m => { m.mat(MAT.STONE, [0.55, 0.52, 0.48], 0.7); for (let i = 0; i < 6; i++) m.ball(Math.cos(i * 1.1) * 0.3, 0.12 + (i % 2) * 0.12, Math.sin(i * 1.1) * 0.3, 0.2, 0.14, 0.2, 6, 3); m.mat(MAT.METAL, [0.78, 0.8, 0.84]); m.box(-0.12, 0.38, -0.06, 0.12, 0.46, 0.06, 0); m.box(-0.09, 0.46, -0.05, 0.09, 0.53, 0.05, 0); }, [A2.cave.x + 3, cp, A2.cave.z + 2], 0, { r: 1.2 }); A2.cairn.visible = false;
    A2.lant = []; for (const dz of [-1.6, 1.6]) { const P = WILDS.P.mine, q = siteToWorld(P, dz, 3.4); const e = { type: 'lantern', p: [q[0], Terrain.y(q[0], q[1]) + 1.7, q[1]], zone: 0, halo: 0.6, always: false }; World.emitters.push(e); A2.lant.push(e); } }
  // the loaves you leave, and what the village says
  IX.SAY.unshift(
    ['*', () => S.flags.ending === 'bread', 'There’s bread on the Wharf every dawn now. I never thought to see it.'],
    ['*', () => S.flags.ending === 'rest', 'The quiet’s different. Lighter. I slept the night through for the first time since the frost.'],
    ['greta', () => S.flags.ending === 'bread', 'I’ll not charge you for the stew this once, love. Don’t make it a habit.'],
    ['greta', () => S.flags.ending === 'rest', 'The Hart’s never been so full. People want to be near other people, after.'],
    ['hale', () => S.flags.ending === 'bread', 'The count is kept and the gate is quiet. I’ll sleep tonight with the key out of my hand.'],
    ['hale', () => S.flags.ending === 'rest', 'I’ve left the old door unbarred. Nothing in it wants out now.'],
    ['brandt', () => S.flags.ending === 'rest', 'Silver for a blade? Aye, I’ll work it now. It’s only metal again.'],
    ['finn', () => S.flags.ending, 'Nobody’s come out of the lake since. I check every morning.']);
}
function act2CaveOutside(cx, cz, cy) {
  // a cleft in the west shore, mouth to the lake: two leaning slabs, a dark slot between, reeds, a fallen sack of old loaves
  const m = new Mesh(1200); m.seed = 88; m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0; m.push().T(cx, cy, cz).RY(PI / 2);       /* [owner, Build 77] was -PI / 2: the dark box stood out in front of the stones, on the side the player comes out */
  m.mat(MAT.PLAIN, [0.015, 0.015, 0.018]); m.box(-0.6, -0.1, -1.4, 0.6, 2.4, -0.2);
  m.mat(MAT.ROCK, [0.64, 0.62, 0.58], 0.6); for (const s of [-1, 1]) { m.push().T(s * 1.05, 0, -0.2).RZ(-s * 0.12); m.lathe([[1.1, -0.6], [0.9, 0.8], [0.62, 2.2], [0.34, 3.2], [0.04, 3.7]], 7, 0); m.pop(); }
  m.mat(MAT.ROCK, [0.5, 0.48, 0.44], 0.6); m.box(-1.3, 2.4, -0.9, 1.3, 3.0, 0.4);
  m.mat(MAT.CLOTH, [0.5, 0.42, 0.3], 0.5); m.ball(1.5, 0.12, 1.5, 0.22, 0.12, 0.17, 7, 3);
  m.pop();
  const pack = new MeshPack(); pack.shadow = false; pack.add(m, { kind: 'opaque', maxDist: 110, noShadow: true }); pack.upload('act2-cave'); World.packs.push(pack);
  addBoxCollider(m, cx - 0.4, cz - 1.8, cx + 0.4, cz + 1.8, cy - 1, cy + 3);
  cleftCrag('blind', cx, cz, -1, 0);
}
// ── the slab: the twist and the choice ──
const _il94d = interactLabel, _iu94d = interactUse;
interactLabel = function (it) {
  if (it.id === 'door.tunnel.in') return S.flags.sec_wall ? it.label : null;
  if (it.kind === 'slab') return S.flags.ending ? null : it.label;
  return _il94d(it);
};
interactUse = function (it) {
  if (it.kind === 'slab') return S.flags.ending ? null : startTalk({ id: 'hollow', name: 'The slab', pos: it.p.slice(), yaw: 0, anim: 'idle', path: null });
  return _iu94d(it);
};
const A2_BOOK = 'THE COUNT, in the Foreman’s hand and, below it, another.\n\nTwelve below. Twelve names in the Elder’s father’s hand, struck through one by one as each man’s wages fell due: struck through, and not paid. The silver took them instead. It sings. They dig for it still.\n\nThe bread was never for their bellies. It was for their names. So long as somebody leaves a loaf and says the count, they are men; when nobody does, the song takes what is left of the man in them and they come up the shaft for the silver’s price.\n\nGreta’s buyer would have the silver by the barrow. The Hollow will give it while they are fed. The village has called that a kindness for fifty years, and it has been a rent.\n\n— and fresh, in a shaking hand —\n\nA thirteenth mark. Whoever stands at the slab with the book open is counted.';
TALK.hollow = function () {
  const names = [['Read the count.', () => { openReader('The Foreman’s count', A2_BOOK); return TALK.hollow(); }]];
  const bread = S.items.bread || 0;
  const opts = [names[0],
    ['Leave the bread and say the count. (needs 3 bread)', () => { if (bread < 3) return node('Three loaves, and you have ' + bread + '. The Hart has stew and Marta has loaves, and nobody here is going anywhere.'); give('bread', -3); return endAct3('bread'); }, 1],
    ['Say their names and tell them to lie down.', () => endAct3('rest'), 1]];
  return node('Twelve stand in a row at the water’s edge, and not one of them breathes. The slab before them is bare. The old loaves on it are green and the candle ends are cold, and the count ' + (Foes.list.some(f => f.kind === 'foreman' && f.alive) ? 'is open in the Foreman’s hand' : 'lies open on the slab where the Foreman left it') + '.\n\nSomeone has to say it or no one will.', opts.concat([bye]));
};
function endAct3(kind) {
  S.flags.ending = kind; S.flags.cave = 1; endTalk && endTalk(); mainSync();
  if (kind === 'bread') { gold(150); RPG.xp(120); openReader('The count is kept', 'You put the loaves on the slab and say it aloud, one to twelve, and thirteen at the end, because the book says so and no one is left to argue.\n\nThe twelve do not move. Something in the cave lets go of its breath. When you look again the green loaves are only bread, and the candles you did not light are burning.\n\nThe bread goes out every dawn now. The village has built a table on the Wharf for it, and a row of candles, and nobody calls it a kindness. They call it the count. The silver comes up the shaft in a barrow each month and Greta’s buyer takes it at her price, which is fair.\n\nThe Quiet is a thing the village keeps, like the bell.'); }
  else { for (let i = 0; i < 5; i++) give('silverbar'); RPG.xp(120); openReader('Lie down', 'You say the names. All twelve, in the Elder’s father’s order, and the last one is your own, because the book says so.\n\nThe twelve sit, one after another, like men at the end of a shift. The song goes out of the cave like a held breath.\n\nBy dawn the mine door stands open with two lanterns on it, and the Warden has taken the bar down. The silver stays in the rock where it is: whoever wants it has to dig, and wage-paid men are already asking at the Hart.\n\nThe Elder sits by the lake and does not talk to it any more. It is only a lake.'); }
  A2.applyEnding(); save();
}
A2.applyEnding = function () {
  const e = S.flags.ending; if (!A2.built) return;
  for (const c of A2.candles || []) c.always = e === 'bread'; if (A2.loaves) A2.loaves.visible = e === 'bread';
  if (A2.cairn) A2.cairn.visible = e === 'rest'; for (const l of A2.lant || []) l.always = e === 'rest';
  if (e === 'rest' && Cells.by.mine && Cells.by.mine.portalOut && !A2.unbarred) { A2.unbarred = true; Cells.by.mine.portalOut.lock = () => null; }
  if (A2.row) for (const o of A2.row) o.visible = e !== 'rest';
};
// tunnel and cave progress, once per frame, and the ending's look being kept after a load
function act2Tick() {
  if (!A2.built) return; const c = World.cell;
  if (c && c.id === 'mine') { const x = Player.pos[0] - MINE.O[0]; const z = Player.pos[2] - MINE.O[2]; if (x > 50 && z < -20 && !S.flags.tunnel) { S.flags.tunnel = 1; mainSync(); } if (x < -35 && z < -10 && !S.flags.cave) { S.flags.cave = 1; mainSync(); save(); toast('<b>The Bread Cave.</b> Twelve stand in a row, and none of them breathes.'); } }
  if (S.flags.ending && typeof Foes !== 'undefined') for (const f of Foes.list) if (f.camp && f.camp.cell === 'mine' && f.state !== 'gone' && f.h) { f.alive = false; f.state = 'gone'; f.hp = 0; f.h.pivot.visible = false; }
  if ((S.flags.ending || '') !== (A2.shown || '')) { A2.shown = S.flags.ending || ''; A2.applyEnding(); }
}
const _st94d = secBuild; secBuild = function () { _st94d(); try { act2Build(); } catch (e) { console.warn('act2: ' + (e && e.stack || e)); } try { A2.applyEnding(); } catch (e) { } };
const _stk94d = secTick; secTick = function (dt) { _stk94d(dt); try { act2Tick(); } catch (e) { if (!A2.warned) { A2.warned = 1; console.warn('act2Tick: ' + (e && e.stack || e)); } } };
// the wall's door appears once the bricks are out
const _tick94d = secTick; secTick = function (dt) { _tick94d(dt); if (A2.door && SEC.wallObj) { const open = !!S.flags.sec_wall; A2.door.visible = open; SEC.wallObj.visible = !open; } };
