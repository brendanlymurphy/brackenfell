// ───────────────────────── town secrets (q1): nine things worth walking to, all inside the existing town ─────────────────────────
// Each is found by looking at a prop that does not belong (a loose stone, a hatch, a patch of fresh brick, a box in the bell frame, a plate in the quay wall), each pays out, and each
// leaves a note that points at the next one. Nothing here is a quest marker: a lockpick opens every lock, so no order is forced and nothing can dead-end.
//   1 bell      a tin box in the Watch Bell's frame                 -> lockpick, gold; points at 2
//   2 stone     a loose stone in the terrace wall                   -> cellar key, gold; points at 3
//   3 cellar    a locked hatch in Washing Lane                      -> silver, the house key; points at 9 and 8
//   4 attic     a trunk in the loft over the Hart's passage         -> silver, gold; the Hart's ledger points at 5
//   5 wall      fresh brick in the Hart's cellar                    -> the strongbox key, silver; points at 6 and Act 2
//   6 strongbox an iron plate in the quay wall, from the landing    -> gold, silver
//   7 meeting   the Elder and Greta behind the chapel, 23:00-03:30  -> overheard; a dropped purse
//   8 magpie    a thief you follow from the square to the yard      -> her stash
//   9 house     the house nobody will talk about                    -> Hale's letters
Object.assign(ITEMS, {
  silverbar: ['Bar of grey silver', 'Cast in a sand mould and never stamped. Purer than anything the Crown mints.', { value: 45 }],
  cellarkey: ['Cellar key', 'Short and dark, with a magpie’s feather knotted through the bow.'],
  housekey: ['Key with a wren cut in the bow', 'It has been oiled. Somebody has kept faith with a house nobody goes into.'],
  wharfkey: ['Wharf strongbox key', 'Salt-eaten iron on a length of fishing line. It smells of the lake.'],
});
const SEC = { built: false, list: [], mag: { st: 'off' }, meet: { st: 'off' } };
const secFlag = id => !!(S.flags && S.flags['sec_' + id]);
const secCount = () => SEC.list.filter(s => secFlag(s.sec)).length;
// a prop that is a skinned mesh (so it can sit in a cell, move, and hide): the builder draws it at the origin facing +z
function secProp(fn, p, yaw, o) {
  o = o || {}; const m = new Mesh(o.cap || 1200); m.m1 = 0; m.m2 = 0; m.m3 = 0; m.ao = 1; m.grad = null; m.wind = 0; fn(m);
  const mi = World.skinPack.add(m), obj = addSkinned(mi, { c: p.slice(), r: o.r || 1.6, zone: o.zone || 0, kind: 'misc', cell: o.cell, light: o.light === undefined ? 1 : o.light });
  secPlace(obj, p, yaw); return obj;
}
function secPlace(obj, p, yaw) { R.boneData.set(m4.rotY(m4.translate(m4.create(), p[0], p[1], p[2]), yaw || 0), obj.slot * 256); obj.c = p.slice(); }
const secChest = (m, w, h, d, c1, c2) => { m.mat(MAT.PLANKS, c1 || [0.42, 0.32, 0.22], 0.5); m.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, 4); m.mat(MAT.METAL, c2 || [0.22, 0.2, 0.18]); for (const x of [-w * 0.3, w * 0.3]) m.box(x - 0.025, -0.005, -d / 2 - 0.01, x + 0.025, h + 0.01, d / 2 + 0.01, 0); m.box(-0.03, h * 0.55, d / 2, 0.03, h * 0.8, d / 2 + 0.03, 0); };
const secCloak = (m, c, tall) => { m.mat(MAT.CLOTH, c, 0.6); m.lathe([[0.34, 0], [0.28, 0.5], [0.22, 1.1 * tall], [0.16, 1.42 * tall], [0.1, 1.5 * tall]], 9, 0); m.mat(MAT.PLAIN, [0.62, 0.5, 0.42]); m.ball(0, 1.58 * tall, 0.03, 0.085, 0.1, 0.09, 8, 5); m.mat(MAT.CLOTH, c.map(v => v * 0.8), 0.6); m.ball(0, 1.6 * tall, -0.02, 0.12, 0.13, 0.12, 8, 5); };
// ── the places and what is in them ──
const SECRETS = {
  bell: { p: [9.0, 10.54, 18.5], r: 2.2, ck: 'chest', verb: 'Open the tin box', label: 'Look at the tin box in the frame', loot: [['gold', 12], ['lockpick', 1]], note: ['Tobin’s box', 'A tin that held tea once. Inside, under a rag: a lockpick, a few coins, and a page torn from a ledger.\n\nTHE BELL WAS NEVER RUNG FOR THE FIRE. IT WAS RUNG FOR THE LIGHTS ON THE LAKE. If you are the sort who climbs, you are the sort who looks. The Magpie keeps a spare key where the Elder looks down on the market and never thinks to look at the wall: the stone with the crooked mortar, west of the plaque.'] },
  stone: { p: [-19.0, 1.3, 12.3], r: 2.0, ck: 'chest', verb: 'Work the stone loose', label: 'Push the crooked stone', loot: [['cellarkey', 1], ['gold', 6]], note: ['Behind the stone', 'A hollow the size of a loaf, dry and lined with sacking. A key, a few coins, and a scrap of paper.\n\nWASHING LANE. THE HATCH UNDER THE LINES. Take what is in it and leave the rest. I am not the only one who goes down there. — M.'] },
  cellar: { p: [-39.3, 0, -43.15], r: 1.8, ck: 'chest', verb: 'Open the hatch', label: 'Open the hatch', locked: true, key: 'cellarkey', hard: 0.55, loot: [['silverbar', 2], ['housekey', 1], ['gold', 14]], note: ['The Magpie’s cellar', 'A cold hole under the lane, lined with flour sacks. Two grey bars of silver, a key with a wren on it, and a list in a round hand:\n\nHart, back door, by the bar. 9 gold the bar and no questions.\nThe house on the south lane: do NOT. Not for any money. Not after what I saw in the window.'] },
  attic: { p: [11.4, 3.7, -21.4], r: 2.2, ck: 'chest', verb: 'Open the trunk', label: 'Open the trunk under the eaves', loot: [['silverbar', 1], ['gold', 30]], note: ['The Hart’s ledger', 'Kept in two inks. The first is wine and malt. The second is silver.\n\nIn by the cellar way after dark. Out by the north door. Greta counts. The Elder takes the third part and the Warden is never told.\n\nSomebody has written beside the last line: THE WALL IN THE CELLAR IS NOT THE END OF THE CELLAR.'] },
  wall: { cell: 'inn', zone: 1, p: [266.5, -402.2, 4.6], r: 2.2, ck: 'chest', verb: 'Pull out the loose bricks', label: 'Pull at the fresh brick', gate: () => secFlag('attic') || S.flags.hear_hartledger, gateMsg: 'Newer brick than the rest. Just a wall, unless you know what is behind it.', hint: 'Look at the fresh brick', loot: [['wharfkey', 1], ['silverbar', 2], ['gold', 40]], note: ['Behind the bricks', 'A room no wider than a bed, whitewashed once. A shelf with a tally cut into it, a lantern, a crowbar and a key on a fishing line.\n\nOne mark for every barrow that went out by the lake cave. Two hundred and six. The newest is a week old.\n\nSomeone has scratched a door on the back wall, and under it: DOWN.'] },
  strongbox: { p: [17.6, -0.55, 82.55], r: 2.2, ck: 'chest', verb: 'Open the iron door', label: 'Open the iron door in the quay', locked: true, key: 'wharfkey', hard: 0.45, loot: [['gold', 70], ['silverbar', 3]], note: ['The strongbox', 'Dry. Somebody dug this into the quay when it was built and has paid it a visit every season since. Coin, silver, and a paper in the old Elder’s hand:\n\nFor the hands below. To be spent on bread, if bread is what the Quiet will take.'] },
  meetpouch: { p: [-9.0, 0, -77.4], r: 2.0, ck: 'chest', verb: 'Take the pouch', label: 'Take the dropped pouch', gate: () => !!S.flags.hear_meeting, gateMsg: 'Dew on the grass and nothing else.', hint: 'Nothing here', loot: [['gold', 25], ['candle', 2]], note: null },
  magpie: { p: [0, 0, 0], r: 2.0, ck: 'chest', verb: 'Pull the sack from under the well-lip', label: 'Look under the well-lip', gate: () => !!S.flags.magpieYard, gateMsg: 'A well, a bench and a stool. Somebody comes here to be alone.', hint: 'The well', loot: [['gold', 22], ['silverbar', 1], ['lockpick', 1]], note: ['The Magpie’s sack', 'A flour sack with a cord through it, and a card inside, written in charcoal:\n\nIf you followed me here you are better at it than the Warden’s men. Take half. I never took a thing from a poor house. Only silver, only after dark, only from the ones who had too much of it.'] },
};
function secMakeCont(id, s) {
  const o = { kind: 'cont', sec: id, id: 'sec.' + id, ck: s.ck, verb: s.verb, label: s.label, p: s.p.slice(), r: s.r, zone: s.zone || 0, cell: s.cell, locked: !!s.locked, key: s.key, hard: s.hard, loot: s.loot, gate: s.gate, gateMsg: s.gateMsg, hint: s.hint, note: s.note };
  World.interact.push(o); SEC.list.push(o); return o;
}
// the properties: each prop that does not belong
function secBuild() {
  if (SEC.built) return; SEC.built = true;
  const g = (x, z, y) => World.groundAt(x, z, y === undefined ? 8 : y);
  // 1: a tin box in the bell frame
  { const s = SECRETS.bell; secProp(m => { m.mat(MAT.METAL, [0.5, 0.5, 0.46]); m.box(-0.2, 0, -0.14, 0.2, 0.16, 0.14, 0); m.mat(MAT.METAL, [0.62, 0.62, 0.58]); m.box(-0.21, 0.16, -0.15, 0.21, 0.2, 0.15, 0); m.mat(MAT.CLOTH, [0.5, 0.4, 0.3], 0.5); m.box(-0.1, 0.2, -0.06, 0.12, 0.23, 0.07, 0); }, [s.p[0], s.p[1], s.p[2]], 0.3, { r: 1.0 }); secMakeCont('bell', s); }
  // 2: a loose stone in the terrace's north wall, west of the plaque: a block that stands proud with a dark gap round it
  { const s = SECRETS.stone; secProp(m => { m.mat(MAT.PLAIN, [0.03, 0.028, 0.024]); m.box(-0.27, -0.2, -0.04, 0.27, 0.2, 0.02, 0); m.mat(MAT.STONE, [1.0, 0.96, 0.9], 0.8); m.box(-0.23, -0.16, -0.1, 0.23, 0.16, 0.0, 4); m.mat(MAT.PLAIN, [0.55, 0.52, 0.46]); m.box(-0.23, -0.16, -0.11, -0.2, 0.16, -0.09, 0); }, s.p, Math.PI, { r: 1.0 }); secMakeCont('stone', s); }
  // 3: a hatch in Washing Lane
  { const s = SECRETS.cellar, l = (INF.lanes || []).find(l => l.role === 'wash'); if (l) { s.p = [l.x1 - 1.0, 0, l.zc]; } s.p[1] = g(s.p[0], s.p[2], 1) + 0.03;
    secProp(m => { m.mat(MAT.PLANKS, [0.36, 0.28, 0.2], 0.5); m.box(-0.45, 0, -0.45, 0.45, 0.07, 0.45, 4); m.mat(MAT.METAL, [0.2, 0.19, 0.18]); for (const z of [-0.28, 0.28]) m.box(-0.46, 0.065, z - 0.03, 0.46, 0.085, z + 0.03, 0); m.cyl(0, 0.07, 0, 0.07, 0.07, 0.025, 8, 0); m.mat(MAT.PLAIN, [0.1, 0.06, 0.05]); m.box(-0.05, 0.085, 0.36, 0.05, 0.12, 0.42, 0); }, s.p, 0, { r: 1.0 }); secMakeCont('cellar', s); }
  // 4: a trunk in the loft
  { const s = SECRETS.attic; secProp(m => secChest(m, 0.9, 0.46, 0.5, [0.34, 0.26, 0.18]), s.p, 0.4, { r: 1.2 }); secMakeCont('attic', s); }
  // 5: fresh brick in the Hart's cellar (the east wall, between two casks)
  { const s = SECRETS.wall; secProp(m => { m.mat(MAT.PLASTER, [0.82, 0.74, 0.62], 0.6); m.box(-0.95, 0, -0.06, 0.95, 2.0, 0.0, 4); m.mat(MAT.PLAIN, [0.45, 0.2, 0.14]); for (let r = 0; r < 12; r++) for (let c = 0; c < 6; c++) if ((r * 7 + c * 3) % 4) m.box(-0.9 + c * 0.3 + (r % 2) * 0.12, 0.08 + r * 0.16, 0.0, -0.64 + c * 0.3 + (r % 2) * 0.12, 0.2 + r * 0.16, 0.025, 0); }, [s.p[0] + 0.45, s.p[1] - 0.5, s.p[2]], -Math.PI / 2, { r: 2.0, zone: 1, cell: 'inn', light: 0.9, cap: 1500 }); secMakeCont('wall', s); }
  // 6: an iron plate in the quay wall, at the water-level landing
  { const s = SECRETS.strongbox; s.p[1] = LAKE.y + 0.95; secProp(m => { m.mat(MAT.METAL, [0.2, 0.19, 0.18]); m.box(-0.38, -0.3, 0, 0.38, 0.3, 0.07, 0); m.mat(MAT.METAL, [0.3, 0.27, 0.24]); for (const [x, y] of [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]]) m.cyl(x, y, 0.07, 0.03, 0.03, 0.03, 6, 0); m.cyl(0, 0, 0.07, 0.06, 0.06, 0.04, 8, 0); m.mat(MAT.PLAIN, [0.04, 0.035, 0.03]); m.box(-0.03, -0.12, 0.07, 0.03, -0.04, 0.1, 0); }, [s.p[0], s.p[1], s.p[2] + 0.02], 0, { r: 1.2 }); secMakeCont('strongbox', s); }
  // 7: the meeting behind the chapel: two cloaks, a candle between them, only between 23:00 and 03:30
  { const cx = -9.0, cz = -76.4; SEC.meet = { st: 'off', t: 0, x: cx, z: cz, a: secProp(m => secCloak(m, [0.2, 0.16, 0.14], 1.0), [cx - 0.7, g(cx, cz), cz], 1.4, { r: 1.2 }), b: secProp(m => secCloak(m, [0.26, 0.2, 0.22], 0.9), [cx + 0.7, g(cx, cz), cz], -1.7, { r: 1.2 }) };
    SEC.meet.a.visible = SEC.meet.b.visible = false; SEC.meet.em = { type: 'candle', p: [cx, g(cx, cz) + 0.5, cz], zone: 0, always: false, seed: 0.3 };
    const s = SECRETS.meetpouch; s.p = [cx, g(cx, cz) + 0.1, cz - 1.0]; secProp(m => { m.mat(MAT.CLOTH, [0.3, 0.26, 0.2], 0.4); m.ball(0, 0.07, 0, 0.1, 0.08, 0.1, 8, 5); }, s.p, 0, { r: 0.6 }); secMakeCont('meetpouch', s); }
  // 8: the Magpie: a cloak that walks from the square to the Hidden Yard at dusk; the sack under the well-lip is there after you have seen where she goes
  { const l = (INF.lanes || []).find(l => l.role === 'dead'); const ex = l ? l.x1 : -26.16, zc = l ? l.zc : 52.15; SEC.yard = { l, ex, zc };
    const s = SECRETS.magpie; s.p = [ex + 4.5, g(ex + 4.5, zc - 1.6) + 0.15, zc - 1.6];
    SEC.mag = { st: 'off', t: 0, fig: secProp(m => secCloak(m, [0.1, 0.1, 0.12], 1.0), [0, -50, 0], 0, { r: 1.5 }), sack: secProp(m => { m.mat(MAT.CLOTH, [0.55, 0.5, 0.4], 0.5); m.ball(0, 0.16, 0, 0.18, 0.18, 0.15, 8, 5); m.mat(MAT.PLAIN, [0.2, 0.15, 0.1]); m.box(-0.06, 0.3, -0.02, 0.06, 0.34, 0.02, 0); }, s.p, 0.5, { r: 0.8 }), path: null, i: 0 };
    SEC.mag.fig.visible = false; SEC.mag.sack.visible = false; secMakeCont('magpie', s); }
  // 9: the house nobody talks about: Widow Hale's, shut, its chest holds the letters
  { const id = 'in.23', ch = World.interact.find(i => i.kind === 'cont' && i.id === 'cont.in.23.chest');
    IX.LOCKS[id] = { key: 'housekey', hard: 0.5, msg: 'Shuttered, locked, and the lock is oiled. The neighbours do not look at this door as they pass.' };
    if (ch) { ch.sec = 'house'; ch.loot = [['silverring', 1], ['gold', 18]]; ch.note = ['Letters in a hatbox', 'Tied in blue wool. They are all from the same hand and all to Widow Hale, from Corwin, her son:\n\nMother, the Warden has asked me to say nothing, and I will not. But I have seen what they leave on the slab at the mouth of the deep. If I do not come up, ask Hale why he barred the door and why he sleeps with the key under his pillow.\n\nThe last is unopened. It is addressed to Hale.']; ch.label = 'Look at the hatbox'; SEC.list.push(ch); } }
  if (typeof ixApplyLocks === 'function') ixApplyLocks();
}
// ── use, labels, the find ──
const _il95 = interactLabel, _iu95 = interactUse;
interactLabel = function (it) {
  if (it.sec) { if (S.opened[it.id]) return 'Empty'; if (it.gate && !it.gate()) return it.hint || null; if (it.locked && !(S.unlocked && S.unlocked[it.id])) return 'Open the ' + (it.key === 'wharfkey' ? 'iron door' : 'hatch'); return it.label || it.verb; }
  return _il95(it);
};
interactUse = function (it) {
  if (!it.sec) return _iu95(it);
  if (S.opened[it.id]) return toast('Empty.');
  if (it.gate && !it.gate()) return toast(it.gateMsg || 'Nothing.');
  const was = secCount(); ixOpenCont(it);
  if (S.opened[it.id]) { S.flags['sec_' + it.sec] = 1; S.notes = S.notes || []; const n = secCount(); if (n > was) toast('<b>A secret of Brackenfell</b>: ' + n + ' of ' + SEC.list.length + ' found'); if (it.note) { S.read = S.read || {}; S.read['sec.' + it.sec] = 1; S.notes.push('sec.' + it.sec); openReader(it.note[0], it.note[1]); } if (it.sec === 'attic') S.flags.hear_hartledger = 1; save(); }
};
// loot a locked secret may also be reached with a lockpick: ixLockTry already allows it. Containers that start closed show 'Empty' once taken.
// ── per frame: the meeting and the Magpie ──
const SECQ = { gap: 0 };
function secTick(dt) {
  if (!SEC.built || !game.playing || (World.cell && World.cell.id)) return;
  const P = Player.pos, h = Env.hour, d2 = (x, z) => hyp(P[0] - x, P[2] - z);
  // the meeting
  { const M = SEC.meet; if (M && M.a) { const night = h >= 23 || h < 3.5, near = d2(M.x, M.z);
      if (M.st === 'off' && night && near < 40 && !S.flags.hear_meeting) { M.st = 'here'; M.a.visible = M.b.visible = true; M.t = 0; if (SEC.meetEm !== 1) { World.emitters.push(M.em); SEC.meetEm = 1; } M.em.always = true; }
      if (M.st === 'here') {
        if (near < 3.2 || (!night)) { M.st = 'gone'; M.a.visible = M.b.visible = false; M.em.always = false; if (near < 3.2) toast('Someone is there. The cloaks are gone before you have a name for them.'); }
        else if (near < 11) { M.t += dt; const L = [[0, '<b>Rowan</b>: “The bread was late twice this week.”'], [4, '<b>Greta</b>: “The new one has been asking about the mine door.”'], [8.5, '<b>Rowan</b>: “Then Hale is closer than I would like. Say nothing in the Hart.”'], [13, '<b>Greta</b>: “And if they go down?”'], [17, '<b>Rowan</b>: “Then they find what Corwin found. Go. Go before the bell.”']]; for (const l of L) if (M.t >= l[0] && !(M['l' + l[0]])) { M['l' + l[0]] = 1; toast(l[1]); }
          if (M.t > 21) { M.st = 'gone'; S.flags.hear_meeting = 1; M.a.visible = M.b.visible = false; M.em.always = false; toast('<b>You overheard them</b>: they have dropped a purse in the grass as they went.'); save(); } } }
      if (M.st === 'gone' && !night) { M.st = 'off'; for (const k in M) if (/^l\d/.test(k)) delete M[k]; } } }
  // the thief
  { const G = SEC.mag; if (G && G.fig) { const dusk = h >= 18.5 && h < 23, ex = SEC.yard.ex, zc = SEC.yard.zc;
      if (G.st === 'off' && dusk && !S.flags.magpieYard && Nav.nodes.length) {
        const near = (x, z) => { let b = -1, bd = 1e9; for (let i = 0; i < Nav.nodes.length; i++) { const n = Nav.nodes[i]; if (Math.abs(n[1] - World.groundY(x, z)) > 1.6) continue; const dd = hyp(n[0] - x, n[2] - z); if (dd < bd) { bd = dd; b = i; } } return b; };
        const a = near(3, -4), b = near((SEC.yard.l ? SEC.yard.l.x0 : ex - 5) - 0.6, zc), idx = a >= 0 && b >= 0 ? navPath(a, b) : null;
        if (idx) { G.path = idx.map(i => [Nav.nodes[i][0], Nav.nodes[i][2]]).concat([[ex - 0.5, zc], [ex + 2.0, zc], [ex + 3.6, zc - 0.5]]); G.i = 0; G.x = G.path[0][0]; G.z = G.path[0][1]; G.st = 'wait'; G.t = 0; G.fig.visible = true; }
      }
      if (G.st === 'wait' || G.st === 'walk') {
        const dist = d2(G.x, G.z);
        if (!dusk) { G.st = 'off'; G.fig.visible = false; }
        else if (dist < 3.0) { G.st = 'gone'; G.fig.visible = false; toast('A cloak slides into the dusk before you can reach it. She will be back another evening.'); }
        else {
          if (G.st === 'wait' && dist < 16) G.st = 'walk';
          if (G.st === 'walk' && dist < 21) { const q = G.path[Math.min(G.i + 1, G.path.length - 1)], dx = q[0] - G.x, dz = q[1] - G.z, dl = hyp(dx, dz), st = Math.min(dl, 2.3 * dt); if (dl < 0.2) { if (G.i < G.path.length - 1) G.i++; else { G.st = 'yard'; G.t = 0; } } else { G.x += dx / dl * st; G.z += dz / dl * st; G.yaw = Math.atan2(dx, -dz); } }
          secPlace(G.fig, [G.x, World.groundY(G.x, G.z) + 0.02, G.z], (G.yaw || 0) + Math.PI);
        }
      }
      if (G.st === 'yard') { G.t += dt; if (G.t > 3.5) { G.st = 'done'; G.fig.visible = false; S.flags.magpieYard = 1; G.sack.visible = true; toast('<b>She went to ground in the Hidden Yard.</b> Something is wedged under the well-lip.'); save(); } }
      if (G.st === 'gone' && !dusk) G.st = 'off';
      if (S.flags.magpieYard && G.sack && !G.sack.visible) G.sack.visible = true;
      if (G.st === 'done' && !dusk) G.st = 'finished'; } }
}
// the house nobody talks about: three villagers change the subject
for (const [id, line] of [['greta', 'The house on the south lane? Nobody’s lived there in years. Pass the salt, love, and don’t ask me twice.'], ['marta', 'Oh, that. I sell nothing to that house and I take nothing from it. Will you be wanting candles?'], ['finn', 'Don’t look at the shutters. My father said never to look at the shutters.'], ['aldous', 'There are houses the Dawn will not name, child. That is one. Leave it to her.']]) addOpt(id, n => ['Whose house is shut up on the south lane?', () => { S.flags.hear_house = 1; return node(line); }]);
// rumours and the number found are read by the journal; secrets seen are listed in S.notes (the reader)
