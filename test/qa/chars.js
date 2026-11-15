// Character checks: people inside each other, identical twins side by side, sunk or floating, inside furniture or walls, detached hand props, sliding feet.
// QA.chars(hours) -> { defects, stats }. The schedule is snapped at each hour (as test/npcsep.js does).
window.QA.chars = (hours) => {
  hours = hours || [3, 6, 7, 9, 10.5, 12, 14, 15, 17, 18.5, 20, 21, 22.5, 23.5]; const D = [], stats = { people: NPCS.length, hours: hours.length };
  const push = (k, area, p, d, n) => D.push({ k, area, x: +p[0].toFixed(1), y: +p[1].toFixed(1), z: +p[2].toFixed(1), d, n: n === undefined ? 1 : n });
  const look = n => JSON.stringify([n.def.body || n.def.id.replace(/\d+$/, '#'), n.def.tint, n.def.skin, n.def.hair, n.def.hairStyle, n.def.top, n.def.apron, n.def.legs, n.def.hat]);
  const col = World.colliders, inObb = (c, x, z, m) => { if (c.r !== undefined) return hyp(x - c.x, z - c.z) < c.r + m; const dx = x - c.x, dz = z - c.z, lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz; return Math.abs(lx) < c.hx + m && Math.abs(lz) < c.hz + m; };
  const seen = new Set(), once = (k, f) => { if (seen.has(k)) return; seen.add(k); f(); };
  Env.dayLength = 0;
  for (const h of hours) {
    Env.hour = h; npcSnapAll(); const tag = h + 'h ';
    for (let i = 0; i < NPCS.length; i++) {
      const a = NPCS[i], sp = Cells.spaceOf(a.pos), ar = sp ? 'cell.' + sp : QA.areaAt ? QA.areaAt(a.pos[0], a.pos[2]) : 'open', sit = /sit|lie|bed|bench|eat/.test((a.anim || '') + (a.rowAnim || ''));
      for (let j = i + 1; j < NPCS.length; j++) { const b = NPCS[j]; if (Cells.spaceOf(b.pos) !== sp) continue; const d = hyp(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]); if (Math.abs(a.pos[1] - b.pos[1]) > 1.2) continue;
        if (d < 0.4) once('sep' + a.id + b.id, () => push('npcsep', ar, a.pos, tag + a.id + ' and ' + b.id + ' ' + d.toFixed(2) + ' m apart (' + (a.at || a.goal) + ' / ' + (b.at || b.goal) + ')', 2));
        else if (d < 1.6 && look(a) === look(b)) once('twin' + a.id + b.id, () => push('twin', ar, a.pos, tag + a.id + ' and ' + b.id + ' look identical and stand ' + d.toFixed(2) + ' m apart', 1)); }
      const gy = World.groundAt(a.pos[0], a.pos[2], a.pos[1] + 0.6), gap = a.pos[1] - gy;
      if (!a.path) { if (gap < -0.12 && !/bed/.test(a.at || a.goal || '')) once('sunk' + a.id + Math.round(a.pos[0]), () => push('charsunk', ar, a.pos, tag + a.id + ' stands ' + (-gap).toFixed(2) + ' m below the floor (' + (a.at || a.goal) + ')', -gap)); if (gap > 0.15 && !/lie|sit|bed|bench|seat/.test((a.rowAnim || '') + (a.at || '') + (a.goal || ''))) once('float' + a.id + Math.round(a.pos[0]), () => push('charfloat', ar, a.pos, tag + a.id + ' stands ' + gap.toFixed(2) + ' m above the floor (' + (a.at || a.goal) + ')', gap)); }
      if (!a.path && !sit) for (const c of col) { if (Math.abs(c.x - a.pos[0]) > 6 || Math.abs(c.z - a.pos[2]) > 6) continue; if (c.y0 > a.pos[1] + 1.3 || c.y1 < a.pos[1] + 0.5) continue; if ((c.y1 - c.y0) < 0.5) continue; if (inObb(c, a.pos[0], a.pos[2], -0.12)) { once('solid' + a.id + Math.round(a.pos[0] * 2) + Math.round(a.pos[2] * 2), () => push('charinside', ar, a.pos, tag + a.id + ' stands inside a collider ' + (c.r !== undefined ? 'r' + c.r.toFixed(2) : (c.hx * 2).toFixed(1) + 'x' + (c.hz * 2).toFixed(1)) + ' h ' + (c.y1 - c.y0).toFixed(1) + ' (' + (a.at || a.goal) + ')', 1)); break; } }
    }
  }
  // hand props: every prop must hang from a bone and sit within 25 cm of the hand
  for (const n of NPCS) { if (!n.props || !n.ch) continue; n.ch.pivot.updateMatrixWorld(true);
    for (const m of n.props) { const kind = (m.name || '').replace('prop:', ''), side = kind === 'lute' ? 'handL' : 'handR', bone = n.ch.bones && n.ch.bones[side];
      if (!m.parent) { push('handprop', 'chars', n.pos, n.id + ' ' + kind + ' is not attached to anything', 2); continue; }
      if (!bone) { push('handprop', 'chars', n.pos, n.id + ' ' + kind + ' has no ' + side + ' bone', 2); continue; }
      const a = new THREE.Vector3(), b = new THREE.Vector3(); m.getWorldPosition(a); bone.getWorldPosition(b); const d = a.distanceTo(b); if (d > 0.25) push('handprop', 'chars', n.pos, n.id + ' ' + kind + ' is ' + d.toFixed(2) + ' m from its ' + side + ' bone', d); } }
  // feet: positions over 3 s at a few hours: moving without a walk or run clip, or a walk clip without moving
  let sl = 0;
  for (const h of [8, 12, 17, 20]) { Env.hour = h; npcSnapAll(); const P0 = NPCS.map(n => n.pos.slice()), cnt = NPCS.map(() => ({ mv: 0, w: 0, n: 0 }));
    for (let s = 0; s < 90; s++) { const before = NPCS.map(n => n.pos.slice()); npcUpdate(1 / 30, R.cam.pos); NPCS.forEach((n, i) => { const sp = Cells.spaceOf(n.pos); if (sp !== Cells.spaceOf(before[i])) return; const v = hyp(n.pos[0] - before[i][0], n.pos[2] - before[i][2]) * 30, walk = /walk|run/.test(n.anim || ''); cnt[i].n++; if (v > 0.45 && !walk) cnt[i].mv++; if (walk && v < 0.1) cnt[i].w++; }); }
    NPCS.forEach((n, i) => { if (cnt[i].mv > 6) { sl++; push('slide', QA.areaAt ? QA.areaAt(n.pos[0], n.pos[2]) : 'open', n.pos, h + 'h ' + n.id + ' moves without a walk clip for ' + cnt[i].mv + ' frames (anim ' + n.anim + ')', 1); } if (cnt[i].w > 45) push('treadmill', QA.areaAt ? QA.areaAt(n.pos[0], n.pos[2]) : 'open', n.pos, h + 'h ' + n.id + ' plays a walk clip without moving (' + cnt[i].w + ' frames, goal ' + n.goal + ')', 1); }); }
  stats.slide = sl; return { defects: D, stats };
};
