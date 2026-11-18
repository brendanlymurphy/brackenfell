// ── The door in the Hart's cellar (owner, Build 83: "all these things point to a door in the Hart that doesn't even exist") ──
// [cast] Pip's list, Rowan ("the east cellar wall, newer brick"), the ledger and the compass all send the player to the fresh brick in the Hart's cellar. The
// brick, the smugglers' doorway behind it and the way back up from the tunnel were written as fixed world positions for an older Hart. The Hart is now built by
// the plan engine, whose cellar runs the other way: the brick stood at z +4.6, outside the building beyond its front wall, where only a test that teleports
// could reach it. Here they are placed from the plan itself: on the inside face of the cellar's east wall, on a stretch with nothing in front of it, at the
// floor, and the way back up from the tunnel lands just in front of it. Called before the secrets are built and again whenever the Hart is entered.
const HART = { at: null };
HART.find = function () {
  const P = World.houses.inn && World.houses.inn.plan; if (!P || !P.rooms || !P.w2) return null;
  const r = P.rooms.cellar || Object.values(P.rooms).find(q => q.k < 0); if (!r) return null;
  const a = r.in || r, k = r.k, y = P.lv[k].y, X = a.x1, W = 1.5;
  const busy = z => P.items.some(t => t.k === k && t.x1 > X - 1.0 && t.z1 > z - W / 2 && t.z0 < z + W / 2) || (P.holes || []).some(h => h.k === k && h.r.x1 > X - 1.4 && h.r.z1 > z - W / 2 - 0.3 && h.r.z0 < z + W / 2 + 0.3) || P.doors.some(d => (d.a === r.id || d.b === r.id) && Math.abs(d.x - X) < 0.3 && Math.abs(d.z - z) < W);
  const mid = (a.z0 + a.z1) / 2; let best = null;
  for (let i = 0; i <= 40; i++) { const z = mid + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.2; if (z - W / 2 < a.z0 + 0.3 || z + W / 2 > a.z1 - 0.3) continue; if (!busy(z)) { best = z; break; } }
  if (best === null) best = mid;
  const w = (x, h) => P.w2(x, y + h, best);
  // the prop is drawn facing -x (yaw -PI/2) as the old code drew it; the plan's x runs the same way as the world's, so the east wall faces west in both
  return { k, z: best, wallX: X, prop: w(X - 0.01, 0.0), use: w(X - 0.5, 1.05), land: w(X - 1.2, 0.05), local: [X, y, best] };
};
HART.apply = function () {
  const f = HART.find(); if (!f) return false; HART.at = f;
  if (typeof SECRETS !== 'undefined' && SECRETS.wall) SECRETS.wall.p = f.use.slice();
  const it = World.interact.find(o => o.id === 'sec.wall'); if (it) it.p = f.use.slice();
  if (typeof SEC !== 'undefined' && SEC.wallObj) secPlace(SEC.wallObj, f.prop, -Math.PI / 2);
  if (typeof A2 !== 'undefined' && A2.door) secPlace(A2.door, f.prop, -Math.PI / 2);
  const pin = World.interact.find(o => o.id === 'door.tunnel.in'); if (pin) pin.p = f.use.slice();
  const pout = World.interact.find(o => o.id === 'door.tunnel.out'); if (pout && pout.dest) { pout.dest.p = f.land.slice(); pout.dest.yaw = -Math.PI / 2; }
  return true;
};
{ const _sb = secBuild; secBuild = function () { HART.apply(); const r = _sb.apply(this, arguments); HART.apply(); return r; }; }
{ const _ch = Cells.change; Cells.change = function (c) { const r = _ch.apply(this, arguments); try { if (c && (c.id || c) === 'inn') HART.apply(); } catch (e) { } return r; }; }
// the compass: once you are in the Hart with the way to the cellar to find (main stage 7), it points at the brick, not back out of the door
{ const _qt = questTarget; questTarget = function (id) { if (id === 'main' && qAt('main') === 7 && World.cell && World.cell.id === 'inn' && HART.at) return HART.at.use.slice(); return _qt(id); }; }
