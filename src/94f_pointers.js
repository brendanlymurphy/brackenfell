// ── Every pointer leads to a thing that can be seen and used (docs/audit/POINTERS.md, Build 83) ──
// [cast] The quest mark inside a building was always the building's own front door (Cells.mapTarget turns anything outside into "through the door"), so in
// the chapel the crypt quest pointed out of the chapel; stages 8 and 9 of the main quest named a place in the mine's cell and pointed 1.1 km south-south-east
// of the town at nothing; the Hart's back door and cellar hatch were drawn and did nothing though the ledger and the Magpie's list send you to them; the
// boat-house doors were drawn only; Wren's frostcap "north-west of the gate" was due north and behind the palisade.
const PTR = {};
// the compass and the map read true directions indoors as out (inbox 09:40): a cell is built in its house's own frame (the door inside, turned by the site's yaw
// about the cell's origin, lands exactly on the door outside, in all 57 cells), so a heading inside plus the site's yaw is the heading in the town. The mine has
// no house: 0.
Cells.trueYaw = () => { const c = World.cell && Cells.cur; return (c && c.site && c.site.yaw) || 0; };
// where a quest stage really is, when you are inside the building it is in: [quest, stage, cell, interact id]
PTR.chapelStep = () => !has('cryptkey') && !S.opened['chapel.gate'] ? 'chapel.sacristy' : !S.opened['chapel.gate'] ? 'chapel.gate' : 'chapel.relic';          // the key in the sacristy chest, the gate in the crypt, the reliquary behind it
PTR.INSIDE = [['crypt', 0, 'chapel', 'chapel.sacristy'], ['crypt', 1, 'chapel', 'chapel.gate'], ['crypt', 2, 'chapel', 'chapel.relic'], ['main', 2, 'chapel', PTR.chapelStep]];
PTR.itemAt = id => { const it = World.interact.find(o => o.id === id || o.id === 'cont.' + id); return it ? it.p.slice() : null; };
{ const _qt = questTarget; questTarget = function (id) {
    const st = qAt(id), c = World.cell && World.cell.id;
    for (const [q, s, cell, it] of PTR.INSIDE) if (q === id && s === st && c === cell) { const p = PTR.itemAt(typeof it === 'function' ? it() : it); if (p) return p; }
    // the mine's cell has no door in the town: stages 8 and 9 (the tunnel, the slab) point at the way in, the Hart, or, once the tunnel has been walked, the cave's
    // cleft on the west shore; inside the Hart, at the fresh brick (94e_hartdoor.js)
    if (id === 'main' && (st === 8 || st === 9) && c !== 'mine') {
      if (c === 'inn' && typeof HART !== 'undefined' && HART.at) return (Player.pos[1] > HART.at.use[1] + 0.45 && HART.stair) ? HART.stair.slice() : HART.at.use.slice();
      const cave = World.interact.find(o => o.id === 'door.cave.in'); if (S.flags.tunnel && cave) return cave.p.slice();
      const h = World.houses.inn; return h && h.site ? PTR.door([h.site.x, 0, h.site.z]) : _qt(id); }
    return PTR.door(_qt(id)); }; }
// out of doors, a mark on a building's middle (the chapel for the crypt, the Hart for stages 7 to 9) points at the door that leads in, not at the roof
PTR.door = t => { if (!t || World.cell) return t; for (const k in World.houses) { const h = World.houses[k], c = h && h.cell && Cells.by[h.cell.id || h.cell]; if (h && h.site && c && c.xdoor && Math.hypot(h.site.x - t[0], h.site.z - t[2]) < 1.0) return c.xdoor.c.slice(); } return t; };
// the Hart's back door and its cellar hatch (drawn by 72c_infill.js on the back wall): the back door goes into the kitchen, the hatch down into the cellar
PTR.hart = function () {
  const h = World.houses.inn, c = Cells.by.inn; if (!h || !h.site || !c || typeof WALLS === 'undefined' || World.interact.some(o => o.id === 'door.inn.back')) return;
  const st = h.site, W = WALLS.back, s0 = W.start(st.w, st.d), Lw = W.len(st.w, st.d), at = (u, z, y) => { const q = siteToWorld(st, s0[0] + W.u[0] * u + W.n[0] * z, s0[2] + W.u[2] * u + W.n[2] * z); return [q[0], World.groundY(q[0], q[1]) + y, q[1]]; };
  const P = h.plan, sp = (n, k) => { const s = P && P.spots[n]; return s && (k === undefined || s.k === k) ? World.spots['inn.' + n] : null; };
  const kitchen = (sp('work', 0) || sp('home', 0) || {}).p, cellar = (sp('cellar0', -1) || {}).p;
  if (kitchen) World.interact.push({ kind: 'portal', id: 'door.inn.back', p: at(Lw * 0.3, 0.7, 1.1), r: 2.2, zone: 0, label: 'Go in by the kitchen door', dest: { p: kitchen.slice(), yaw: 0, cell: 'inn', name: 'The Honeyed Hart' }, side: 'out' });
  if (cellar) World.interact.push({ kind: 'portal', id: 'door.inn.hatch', p: at(Lw * 0.6, 1.1, 0.5), r: 2.5, zone: 0, label: 'Go down the cellar hatch', dest: { p: cellar.slice(), yaw: 0, cell: 'inn', name: 'The Honeyed Hart, the cellar' }, side: 'out', lock: () => (Env.hour >= 22 || Env.hour < 6) ? 'Barred from inside for the night.' : null });
};
// the boat-house doors under the quay: knocked on, they answer as the board and Joyce say (the keys are with Old Wenn, who keeps them)
PTR.boathouses = function () {
  if (World.interact.some(o => o.id === 'wharf.boathouse0')) return;
  [11.6, 16.4].forEach((x, i) => { const z = (typeof WHARF !== 'undefined' && WHARF.Z0 !== undefined) ? WHARF.Z0 - 0.5 : 74.4, g = World.groundAt(x, z, 3); World.interact.push({ p: [x, g + 1.1, z], r: 2.0, zone: 0, kind: 'knock', id: 'wharf.boathouse' + i, r: 2.5, label: 'Knock on the boat-house door' }); });
};
{ const _lb = interactLabel; interactLabel = function (it) { if (it && it.kind === 'knock') return it.label; return _lb.apply(this, arguments); }; }
{ const _use = interactUse; interactUse = function (it) { if (it && it.kind === 'knock') { Audio2.door(0.5); toast(S.flags.ending ? 'Nobody answers. Through the boards: oars, nets, and the smell of tar.' : 'Nobody answers. It is locked, and the keys are with Old Wenn at the boatyard.'); return; } return _use.apply(this, arguments); }; }
// the Magpie's sack when the Hidden Yard is not built (73j_lanes.js gives no lane that role): there is no well there, so it is not 'under the well-lip'
PTR.magpie = function () { if (World.places.some(p => p.id === 'hiddenyard')) return; const it = World.interact.find(o => o.id === 'sec.magpie'); if (it) { it.label = 'Look in the grass by the fence'; it.verb = 'Pick up the sack'; } };
{ const _sb = secBuild; secBuild = function () { const r = _sb.apply(this, arguments); for (const f of ['hart', 'boathouses', 'magpie']) { try { PTR[f](); } catch (e) { console.warn('pointers ' + f + ': ' + (e && e.message || e)); } } return r; }; }
// the drowned man lies at knee height and his mourners stand at the bier (77e_households.js): looking level from beside him the prompt named the mourner across
// the bier, and the audit's bot got no word of the body. A little priority: the body wins while it is in view, the mourner when you look at her
{ const _st = storyBuild; storyBuild = function () { const r = _st.apply(this, arguments); const it = World.interact.find(o => o.id === 'wharf.body'); if (it) it.pri = 1.0; return r; }; }
