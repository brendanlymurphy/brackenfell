// ───────────────────────── things in people's hands: lute, hammer, spear, staff, rod, mug, flute ─────────────────────────
// [ch1] Rebuilt. The 'real' characters carry nothing of their own, so every prop is a small mesh in metres (true size), in a frame of its own: origin where the hand closes,
// long axis +y, the lute's soundboard facing +z. Wood and iron use RPG.gearMat (grain streaks on wood, worn metal). A prop is
//   - held: parented to the hand bone with HP.GRIP (the handle lies across the palm, along the knuckles) while the fingers curl round it (Chars.grip), or
//   - placed by a post-update function that reads the two hand bones: the lute is put between the hands (right hand over the strings, left round the neck) so nothing floats,
//     and slung on the back when he is not playing; the hammer hangs from the belt unless it is being swung; the spear stands grounded beside the body unless it is held.
// mesh.userData = { kind, holding, grip: [x,y,z] the point of the prop that must be in the hand (test/hold.js), hand: 'R'|'L', len: longest side in metres }.
const HP = { cache: {}, GRIP: { rot: [0, 0, Math.PI / 2], pos: [0, 0.07, -0.015], curl: 0.75 } };
const HP_SIZE = { lute: 0.8, hammer: 0.4, spear: 2.3, staff: 1.8, rod: 2.2, mug: 0.14, flute: 0.45, besom: 1.55, shears: 0.26, awl: 0.17, knife: 0.3, cleaver: 0.32, mallet: 0.34, axe: 0.72, paddle: 0.8, scraper: 0.16, pestle: 0.2, tinhammer: 0.3, shuttle: 0.24, sickle: 0.48, tongs: 0.52 };      // longest side allowed, metres (test/hold.js)
function hpWood(len, r0, r1, y0, col, seg) {      // a tapered shaft, lathe-turned
  const T = THREE, pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(new T.Vector2(r0 + (r1 - r0) * t + (i === 0 || i === 6 ? -0.0015 : 0), y0 + len * t)); }
  return [new T.LatheGeometry(pts, seg || 8), null, col, [0, 0.78]];
}
function hpGeo(kind) {
  if (HP.cache[kind]) return HP.cache[kind];
  const T = THREE, X = RPG.xf, WD = [0.20, 0.125, 0.06], WL = [0.30, 0.20, 0.10], DK = [0.045, 0.028, 0.016], IR = [0.20, 0.20, 0.21], MW = [0, 0.78], MI = [0.85, 0.42], CL = [0.42, 0.30, 0.17];
  let P;
  if (kind === 'lute') {
    // pear-shaped bowl (0.32 wide, 0.48 long, 0.15 deep) of nine ribs, flat soundboard with a rose, bridge, neck with fingerboard, pegbox bent back, six strings
    const prof = n => { const a = []; for (let i = 0; i <= 10; i++) { const u = i / 10, r = 0.16 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.75) * (1 - 0.35 * u) + 0.03 * Math.pow(u, 4); a.push(new T.Vector2(Math.max(0.0005, r), -0.27 + 0.48 * u)); } return a; };
    P = []; const R = 9, pr = prof();
    for (let i = 0; i < R; i++) { const a0 = Math.PI / 2 + i * Math.PI / R; P.push([new T.LatheGeometry(pr, 3, a0, Math.PI / R), X(0, 0, 0, 0, 0, 0, 1, 1, 0.94), i % 2 ? [0.30, 0.18, 0.085] : [0.21, 0.12, 0.055], MW]); }      // [ch4] 0.15 deep: it was 0.075, a pan
    const sh = new T.Shape(); pr.forEach((v, i) => i ? sh.lineTo(v.x, v.y) : sh.moveTo(v.x, v.y)); for (let i = pr.length - 1; i >= 0; i--) sh.lineTo(-pr[i].x, pr[i].y);
    P.push([new T.ShapeGeometry(sh), X(0, 0, 0.0006, 0, 0, 0, 1.0, 1.0, 1), DK, MW]);      // the dark edge band, and on it the soundboard: aged spruce in 26 strips of grain, each its own tone, no two neighbours alike
    { const NS = 26, hw = yy => { const u = Math.max(0, Math.min(1, (yy + 0.27) / 0.48)); return Math.max(0.0005, 0.16 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.75) * (1 - 0.35 * u) + 0.03 * Math.pow(u, 4)) * 0.965; };
      for (let i = 0; i < NS; i++) { const g = new T.BufferGeometry(), pp = [], ix = [], RW = 16; for (let j = 0; j <= RW; j++) { const yy = -0.268 + 0.474 * j / RW, w = hw(yy); pp.push((i / NS * 2 - 1) * w, yy, 0, ((i + 1) / NS * 2 - 1) * w, yy, 0); if (j < RW) { const a0 = j * 2; ix.push(a0, a0 + 1, a0 + 3, a0, a0 + 3, a0 + 2); } }
        g.setAttribute('position', new T.BufferAttribute(new Float32Array(pp), 3)); g.setIndex(ix); g.computeVertexNormals(); const h = Math.sin(i * 12.9898) * 43758.5453, t = 0.86 + 0.24 * (h - Math.floor(h)) - (i % 5 === 0 ? 0.10 : 0), ed = 1 - 0.18 * Math.pow(Math.abs(i / (NS - 1) * 2 - 1), 3);
        P.push([g, X(0, 0, 0.0018), [0.33 * t * ed, 0.235 * t * ed, 0.125 * t * ed], MW]); } }
    P.push([new T.CircleGeometry(0.036, 14), X(0, -0.03, 0.0028), DK, MW], [new T.RingGeometry(0.036, 0.043, 14), X(0, -0.03, 0.0032), [0.30, 0.19, 0.09], MW]);      // the rose
    P.push([new T.BoxGeometry(0.11, 0.014, 0.012), X(0, -0.17, 0.008), DK, MW]);                                                    // the bridge
    P.push([new T.BoxGeometry(0.048, 0.30, 0.022), X(0, 0.31, 0.011), WD, MW], [new T.BoxGeometry(0.040, 0.26, 0.006), X(0, 0.31, 0.025), DK, MW]);      // neck and fingerboard
    P.push([new T.CylinderGeometry(0.017, 0.031, 0.15, 4, 1), X(0, 0.492, -0.052, -1.2, Math.PI / 4, 0, 1, 1, 0.55), WD, MW]);                    // the pegbox, bent back and tapering
    for (let i = 0; i < 6; i++) { const u = 0.02 + i * 0.022, sd = i % 2 ? 1 : -1; P.push([new T.CylinderGeometry(0.0035, 0.0055, 0.05, 5), X(sd * 0.036, 0.468 + u * 0.36, -0.012 - u * 0.93, 0, 0, Math.PI / 2 * sd), DK, MW]); }      // six pegs, three a side
    for (let i = 0; i < 6; i++) { const x = -0.0105 + i * 0.0042; P.push([new T.BoxGeometry(0.0013, 0.62, 0.0013), X(x, 0.14, 0.029), [0.74, 0.70, 0.58], MW]); }
  }
  else if (kind === 'hammer') P = [hpWood(0.36, 0.0135, 0.0165, -0.14, WD), [new T.BoxGeometry(0.07, 0.040, 0.034), X(0, 0.225, 0), IR, MI], [new T.BoxGeometry(0.030, 0.048, 0.044), X(0.048, 0.225, 0), IR, MI], [new T.BoxGeometry(0.045, 0.026, 0.026), X(-0.052, 0.225, 0), IR, MI]];
  else if (kind === 'spear') P = [hpWood(1.9, 0.0145, 0.012, -0.95, WD, 6), [new T.ConeGeometry(0.028, 0.24, 6), X(0, 1.07, 0, 0, 0, 0, 1, 1, 0.45), IR, MI], [new T.CylinderGeometry(0.019, 0.019, 0.05, 6), X(0, 0.96, 0), IR, MI]];
  else if (kind === 'staff') P = [hpWood(1.65, 0.021, 0.017, -0.8, WD, 7), [new T.SphereGeometry(0.036, 8, 6), X(0, 0.87, 0), WL, MW]];
  else if (kind === 'rod') P = [hpWood(2.0, 0.015, 0.004, -0.1, WL, 5)];
  else if (kind === 'mug') {      // [ch4] the kit's own tankard (a turned cup with a handle), not a cylinder: its form at 0.11 m, the handle turned away from the palm, the wall of the cup at the origin
    const kp = typeof Kit !== 'undefined' && Kit.pieces && Kit.pieces.Mug; if (!kp) return null; P = [];
    const hgt = kp.max[1] - kp.min[1], sc = 0.11 / hgt; let ax = 0, az = 0, na = 0, r = 0;
    for (const pr of kp.prims) for (let i = 0; i < pr.n; i++) if (pr.pos[i * 3 + 1] < kp.min[1] + hgt * 0.15) { ax += pr.pos[i * 3]; az += pr.pos[i * 3 + 2]; na++; } ax /= na || 1; az /= na || 1;
    for (const pr of kp.prims) for (let i = 0; i < pr.n; i++) if (pr.pos[i * 3 + 1] < kp.min[1] + hgt * 0.15) r = Math.max(r, Math.hypot(pr.pos[i * 3] - ax, pr.pos[i * 3 + 2] - az));
    const hx = (kp.min[0] + kp.max[0]) / 2 - ax, hz = (kp.min[2] + kp.max[2]) / 2 - az, turn = Math.atan2(hx, hz), M = new T.Matrix4().makeTranslation(0, 0, r * sc * 1.05).multiply(new T.Matrix4().makeRotationY(-turn)).multiply(new T.Matrix4().makeScale(sc, sc, sc)).multiply(new T.Matrix4().makeTranslation(-ax, -(kp.min[1] + hgt * 0.5), -az));
        for (const pr of kp.prims) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(Float32Array.from(pr.pos), 3)); g.setAttribute('normal', new T.BufferAttribute(Float32Array.from(pr.nrm), 3)); g.setIndex(new T.BufferAttribute(Uint32Array.from(pr.idx), 1)); const met = /metal|iron|steel/i.test(pr.mat); if (met) { g.dispose(); continue; }      // the kit's hoops are broken rings that fought the staves (pale zig-zags, then gaps): a plain turned wooden tankard
      P.push([g, M, [0.24, 0.155, 0.08], MW]); }
  }
  // [ch4] a besom: an ash handle 1.4 m and a head of birch twigs bound twice, flaring to 0.24 m at the tips. Origin at the hand, the twigs toward +y.
  else if (kind === 'besom') { P = [hpWood(1.08, 0.0145, 0.017, -0.38, WL)]; const tw = [0.33, 0.25, 0.12];
    for (let i = 0; i < 42; i++) { const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / 42), x0 = Math.cos(a) * rr * 0.022, z0 = Math.sin(a) * rr * 0.022, x1 = Math.cos(a) * rr * 0.12 * (0.8 + 0.3 * Math.sin(i * 3.1)), z1 = Math.sin(a) * rr * 0.05, l = 0.42 + 0.05 * Math.sin(i * 1.7);
      const g = new T.CylinderGeometry(0.0012, 0.0028, l, 3, 1), dx = x1 - x0, dz = z1 - z0, tilt = Math.atan2(Math.hypot(dx, dz), l); const M = new T.Matrix4().makeTranslation((x0 + x1) / 2, 0.69 + l / 2, (z0 + z1) / 2).multiply(new T.Matrix4().makeRotationAxis(new T.Vector3(dz, 0, -dx).normalize(), tilt)); P.push([g, M, tw.map(v => v * (0.75 + 0.4 * ((i * 7) % 5) / 5)), MW]); }
    P.push([new T.CylinderGeometry(0.03, 0.03, 0.03, 10, 1, true), X(0, 0.75, 0), [0.30, 0.22, 0.12], MW], [new T.CylinderGeometry(0.042, 0.042, 0.025, 10, 1, true), X(0, 0.86, 0, 0, 0, 0, 1.35, 1, 0.75), [0.30, 0.22, 0.12], MW]); }
  // trade tools, true size; origin where the fist closes on the handle, the working end toward +y
  else if (kind === 'shears') { const bl = () => { const sh = new T.Shape(); sh.moveTo(-0.004, 0); sh.lineTo(0.006, 0); sh.lineTo(0.002, 0.15); sh.lineTo(-0.003, 0.14); sh.closePath(); return new T.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false }); };
    P = [[bl(), X(0.004, 0.08, -0.004, 0, 0, -0.06), IR, MI], [bl(), X(-0.004, 0.08, 0.001, 0, 0, 0.06), IR, MI], [new T.TorusGeometry(0.018, 0.0035, 5, 12), X(0, 0.055, 0), IR, MI], [new T.BoxGeometry(0.012, 0.03, 0.006), X(0, 0.075, 0), IR, MI], [new T.BoxGeometry(0.01, 0.07, 0.005), X(0.012, 0.02, 0, 0, 0, 0.15), IR, MI], [new T.BoxGeometry(0.01, 0.07, 0.005), X(-0.012, 0.02, 0, 0, 0, -0.15), IR, MI]]; }
  else if (kind === 'awl') P = [[new T.LatheGeometry([[0.001, -0.045], [0.012, -0.04], [0.015, -0.01], [0.013, 0.025], [0.008, 0.035], [0.001, 0.036]].map(v => new T.Vector2(v[0], v[1])), 8), null, WD, MW], [new T.ConeGeometry(0.0022, 0.075, 5), X(0, 0.072, 0), IR, MI]];
  else if (kind === 'knife' || kind === 'cleaver') { const cl = kind === 'cleaver', sh = new T.Shape(); if (cl) { sh.moveTo(-0.004, 0); sh.lineTo(0.07, 0); sh.lineTo(0.075, 0.17); sh.lineTo(-0.004, 0.17); } else { sh.moveTo(-0.003, 0); sh.lineTo(0.016, 0); sh.quadraticCurveTo(0.018, 0.1, 0.0, 0.15); sh.lineTo(-0.003, 0.12); } sh.closePath();
    P = [[new T.ExtrudeGeometry(sh, { depth: cl ? 0.004 : 0.0025, bevelEnabled: false }), X(cl ? -0.006 : -0.004, 0.06, -0.0015), IR, MI], hpWood(cl ? 0.13 : 0.1, 0.012, 0.014, -0.07, DK), [new T.CylinderGeometry(0.003, 0.003, 0.03, 5), X(0, 0.0, 0, 0, 0, Math.PI / 2), IR, MI]]; }
  else if (kind === 'mallet') P = [hpWood(0.26, 0.012, 0.014, -0.1, WD), [new T.CylinderGeometry(0.038, 0.04, 0.12, 10), X(0, 0.19, 0, 0, 0, Math.PI / 2), WL, MW], [new T.TorusGeometry(0.039, 0.004, 4, 10), X(0.055, 0.19, 0, 0, Math.PI / 2, 0), IR, MI], [new T.TorusGeometry(0.039, 0.004, 4, 10), X(-0.055, 0.19, 0, 0, Math.PI / 2, 0), IR, MI]];
  else if (kind === 'axe') { const hd = new T.Shape(); hd.moveTo(0, -0.02); hd.lineTo(0.05, -0.035); hd.quadraticCurveTo(0.14, -0.06, 0.15, 0.0); hd.quadraticCurveTo(0.14, 0.07, 0.05, 0.04); hd.lineTo(0, 0.028); hd.lineTo(-0.035, 0.02); hd.lineTo(-0.035, -0.02); hd.closePath();
    P = [hpWood(0.7, 0.016, 0.019, -0.12, WD), [new T.ExtrudeGeometry(hd, { depth: 0.02, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.004, bevelSegments: 1 }), X(0, 0.53, -0.01), IR, MI]]; }
  else if (kind === 'paddle') P = [hpWood(0.56, 0.014, 0.016, -0.12, WL), [new T.BoxGeometry(0.09, 0.22, 0.016), X(0, 0.55, 0), WL, MW]];
  else if (kind === 'scraper') { const sh = new T.Shape(); sh.moveTo(-0.06, 0.01); sh.lineTo(0.06, 0.01); sh.lineTo(0.065, 0.1); sh.lineTo(-0.065, 0.1); sh.closePath(); P = [[new T.ExtrudeGeometry(sh, { depth: 0.0015, bevelEnabled: false }), X(0, 0.0, 0), IR, MI], [new T.CylinderGeometry(0.012, 0.012, 0.13, 8), X(0, 0.0, 0.004, 0, 0, Math.PI / 2), WD, MW]]; }
  else if (kind === 'pestle') P = [[new T.LatheGeometry([[0.001, -0.06], [0.012, -0.055], [0.014, 0.02], [0.022, 0.1], [0.024, 0.12], [0.015, 0.14], [0.001, 0.142]].map(v => new T.Vector2(v[0], v[1])), 10), null, [0.45, 0.43, 0.40], [0, 0.9]]];
  else if (kind === 'tinhammer') P = [hpWood(0.25, 0.010, 0.012, -0.08, WD), [new T.CylinderGeometry(0.011, 0.014, 0.1, 8), X(0, 0.17, 0, 0, 0, Math.PI / 2), IR, MI]];
  else if (kind === 'shuttle') { const sh = new T.Shape(); sh.moveTo(0, -0.11); sh.quadraticCurveTo(0.018, -0.05, 0.016, 0.0); sh.lineTo(0.016, 0.07); sh.quadraticCurveTo(0.012, 0.11, 0, 0.12); sh.quadraticCurveTo(-0.012, 0.11, -0.016, 0.07); sh.lineTo(-0.016, 0.0); sh.quadraticCurveTo(-0.018, -0.05, 0, -0.11);
    P = [[new T.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: false }), X(0, 0.06, -0.002), WL, MW], [new T.CylinderGeometry(0.009, 0.009, 0.1, 6), X(0, 0.05, 0), [0.55, 0.50, 0.38], [0, 0.95]]]; }
  else if (kind === 'sickle') { const C = new T.EllipseCurve(0.06, 0.13, 0.11, 0.13, Math.PI * 1.05, Math.PI * 0.15, true), pts = C.getPoints(14), sh = new T.Shape(); pts.forEach((p2, i) => i ? sh.lineTo(p2.x, p2.y) : sh.moveTo(p2.x, p2.y)); for (let i = pts.length - 1; i >= 0; i--) { const p2 = pts[i], k = i / (pts.length - 1); sh.lineTo(0.06 + (p2.x - 0.06) * (0.84 + 0.12 * k), 0.13 + (p2.y - 0.13) * (0.84 + 0.12 * k)); }
    P = [hpWood(0.12, 0.012, 0.014, -0.06, DK), [new T.ExtrudeGeometry(sh, { depth: 0.002, bevelEnabled: false }), X(-0.05, 0.03, -0.001), IR, MI]]; }
  else if (kind === 'tongs') P = [[new T.BoxGeometry(0.008, 0.42, 0.008), X(0.008, 0.1, 0, 0, 0, -0.03), IR, MI], [new T.BoxGeometry(0.008, 0.42, 0.008), X(-0.008, 0.1, 0, 0, 0, 0.03), IR, MI], [new T.CylinderGeometry(0.008, 0.008, 0.025, 6), X(0, 0.27, 0, Math.PI / 2, 0, 0), IR, MI], [new T.BoxGeometry(0.03, 0.06, 0.012), X(0, 0.33, 0), IR, MI]];
  else if (kind === 'flute') P = [[new T.CylinderGeometry(0.0095, 0.0095, 0.42, 8), X(0, 0.1, 0), WL, MW], [new T.CylinderGeometry(0.0105, 0.0105, 0.02, 8), X(0, 0.30, 0), DK, MW]];
  else return null;
  const g = RPG.merge(P); if (kind === 'besom') g.applyMatrix4(new T.Matrix4().makeRotationX(Math.PI));      // [ch4] the twigs toward the ground from the fist
  g.computeBoundingBox(); HP.cache[kind] = g; return g;
}
// the props each person carries (def.prop from the schedules table, plus the regulars' mugs and flute)
function hpKinds(def) {
  const k = [];
  if (def.prop && ['lute', 'hammer', 'spear', 'staff', 'rod'].includes(def.prop)) k.push(def.prop);
  if (def.id === 'osric' || def.id === 'greta') k.push('mug');
  if (typeof CAST_HART !== 'undefined' && CAST_HART.includes(def.id)) k.push('mug');
  if (typeof TEST !== 'undefined' && TEST && TEST.toolsoff) return k;      // [ch4] test switch: without the besom and trade tools (to measure what they cost)
  if ((def.sched || []).some(r => r[2] === 'sweep')) k.push('besom');      // [ch4]
  { const t = (def.sched || []).some(r => r[2] === 'work') ? hpTool(def) : null; if (t && !k.includes(t)) k.push(t); }      // [ch4] the Hart's evening table (the old regulars pat1..7 are gone and their mugs went with them)
  return k;
}
// ── placing a prop from the hands (pivot-local space; the person's own right / up / forward from the shoulders) ──
const _hv = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), m: new THREE.Matrix4(), inv: new THREE.Matrix4(), q: new THREE.Quaternion() };
function hpLocal(H, bone, out) { bone.getWorldPosition(out); return H.pivot.worldToLocal(out); }
function hpFrame(H) {
  const f = H._hpf || (H._hpf = { R: new THREE.Vector3(), U: new THREE.Vector3(0, 1, 0), F: new THREE.Vector3(), pR: new THREE.Vector3(), pL: new THREE.Vector3(), sp: new THREE.Vector3(), pel: new THREE.Vector3(), t: new THREE.Vector3() });
  H.pivot.updateMatrixWorld(true); H.root.updateWorldMatrix(false, true);
  const ur = H.root.getObjectByName('upperarm_r'), ul = H.root.getObjectByName('upperarm_l'), sp = H.root.getObjectByName('spine_03'), pel = H.root.getObjectByName('pelvis');
  hpLocal(H, ur, f.R); hpLocal(H, ul, f.t); f.R.sub(f.t).setY(0).normalize(); f.F.crossVectors(f.U, f.R).normalize();      // forward = up x right
  hpLocal(H, H.bones.handR, f.pR); hpLocal(H, H.bones.handL, f.pL); hpLocal(H, sp, f.sp); hpLocal(H, pel, f.pel); return f;
}
function hpPlace(mesh, o, y, z) {      // origin o, long axis y, front z (z made square to y)
  z.addScaledVector(y, -z.dot(y)).normalize(); const x = _hv.c.crossVectors(y, z).normalize();
  _hv.m.makeBasis(x, y, z); mesh.quaternion.setFromRotationMatrix(_hv.m); mesh.position.copy(o);
}
// [ch4] one true size whatever the body: a prop on a hand bone would take the person's girth and height (each body is scaled a few per cent on each axis); divide it out
const _hps = new THREE.Vector3();
function hpTrue(mesh) { mesh.scale.set(1, 1, 1); mesh.parent.getWorldScale(_hps); const q = mesh.quaternion, ax = new THREE.Vector3(1, 0, 0).applyQuaternion(q), ay = new THREE.Vector3(0, 1, 0).applyQuaternion(q), az = new THREE.Vector3(0, 0, 1).applyQuaternion(q), k = v => 1 / Math.max(1e-3, Math.hypot(v.x * _hps.x, v.y * _hps.y, v.z * _hps.z)); mesh.scale.set(k(ax), k(ay), k(az)); }
// [ch4] the lute's strap when it is slung: a leather band from the neck end, over the left shoulder, across the chest to the right hip and round to the tail of the bowl.
// A ribbon of 18 segments rebuilt each frame from the bones while it is shown (only near: the post functions run for visible people).
function hpStrap(H, lute) {
  const T = THREE; let m = H._strap; if (!m) { const g = new T.BufferGeometry(), n = 19; g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 2 * 3), 3)); g.setAttribute('normal', new T.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const col = new Float32Array(n * 2 * 3), mr = new Float32Array(n * 2 * 2); for (let i = 0; i < n * 2; i++) { const t = 0.85 + 0.15 * Math.sin(i * 2.1); col.set([0.075 * t, 0.048 * t, 0.03 * t], i * 3); mr.set([0, 0.75], i * 2); } g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('mr', new T.BufferAttribute(mr, 2));
    const ix = []; for (let i = 0; i < n - 1; i++) ix.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(ix);
    m = H._strap = new T.Mesh(g, lute.material); m.material.side = T.DoubleSide; m.frustumCulled = false; m.layers.mask = lute.layers.mask; m.name = 'prop:strap'; H.pivot.add(m); }
  const f = hpFrame(H), k = H.root.scale.y || 1, wd = (H.wide || 1), u1 = hpLocal(H, H.root.getObjectByName('upperarm_l'), new T.Vector3()), u2 = hpLocal(H, H.root.getObjectByName('upperarm_r'), new T.Vector3()), ua = u1.clone().sub(f.sp).dot(f.R) < u2.clone().sub(f.sp).dot(f.R) ? u1 : u2, nk = hpLocal(H, H.root.getObjectByName('neck_01'), new T.Vector3()), cl = nk.clone().lerp(ua, 0.55), P = [];      // the top of the shoulder on the neck's side (-R): between the neck and the head of the upper arm (the clavicle bone starts at the breastbone)
  lute.updateMatrix(); const L = (x, y, z) => new T.Vector3(x, y, z).applyMatrix4(lute.matrix);
  P.push(L(0, 0.27, -0.03), cl.clone().addScaledVector(f.F, -0.06 * wd).addScaledVector(f.U, 0.035 * k), cl.clone().addScaledVector(f.F, 0.07 * wd).addScaledVector(f.U, 0.0 * k), cl.clone().addScaledVector(f.F, 0.15 * wd).addScaledVector(f.U, -0.12 * k).addScaledVector(f.R, 0.06 * k),
    f.sp.clone().addScaledVector(f.F, 0.175 * wd).addScaledVector(f.R, 0.03 * k).addScaledVector(f.U, -0.05 * k), f.pel.clone().addScaledVector(f.F, 0.15 * wd).addScaledVector(f.R, 0.14 * k).addScaledVector(f.U, 0.13 * k),
    f.pel.clone().addScaledVector(f.R, 0.21 * k * wd).addScaledVector(f.U, 0.11 * k), L(0.05, -0.26, -0.035));
  const cv = new T.CatmullRomCurve3(P, false, 'centripetal'), pos = m.geometry.attributes.position, nor = m.geometry.attributes.normal, n = pos.count / 2, q = new T.Vector3(), tg = new T.Vector3(), out = new T.Vector3(), w = new T.Vector3(), c0 = f.sp;
  for (let i = 0; i < n; i++) { const u = i / (n - 1); cv.getPointAt(u, q); cv.getTangentAt(u, tg); out.set(q.x - c0.x, 0, q.z - c0.z).normalize(); w.crossVectors(tg, out).normalize().multiplyScalar(0.016); pos.setXYZ(i * 2, q.x + w.x, q.y + w.y, q.z + w.z); pos.setXYZ(i * 2 + 1, q.x - w.x, q.y - w.y, q.z - w.z); nor.setXYZ(i * 2, out.x, out.y, out.z); nor.setXYZ(i * 2 + 1, out.x, out.y, out.z); }
  pos.needsUpdate = true; nor.needsUpdate = true; m.geometry.computeBoundingSphere(); m.visible = true;
}
function hpLute(mesh) { const T = THREE, y = new T.Vector3(), z = new T.Vector3(), o = new T.Vector3(), tR = new T.Vector3(), tL = new T.Vector3(), bx = new T.Vector3(), by = new T.Vector3(), bz = new T.Vector3(), mq = new T.Matrix4(), qL = new T.Quaternion(), qR = new T.Quaternion(); let wPlay = 0;
  // [ch4] The lute is set against the body and the hands go to it (Chars.reach). Hung between the two animated hands it went through the belly: the clip is a guitar's, and a lute's bowl is 0.15 m deep.
  return (H, st) => {
  if (H._strap) H._strap.visible = false;
  if (H.animNow === 'lie') { mesh.visible = false; mesh.userData.holding = false; Chars.reach(H, 'R', null); Chars.reach(H, 'L', null); Chars.grip(H, 'L', 0); Chars.grip(H, 'R', 0); return; }      // by the bed, not on his back in it
  const f = hpFrame(H), play = H.animNow === 'lute' && !H.talkNow, k = H.root.scale.y || 1; wPlay = play ? 1 : 0;
  if (play) {      // the bowl on the belly a little to the player's right, the neck up to the left at 20 degrees and a little forward, the soundboard turned up 12 degrees
    y.copy(f.R).multiplyScalar(-0.93).addScaledVector(f.U, 0.33).addScaledVector(f.F, 0.14).normalize(); z.copy(f.F).multiplyScalar(0.978).addScaledVector(f.U, 0.21);
    hpPlace(mesh, o.copy(f.pel).addScaledVector(f.U, 0.21 * k).addScaledVector(f.R, 0.035 * k).addScaledVector(f.F, 0.118 * k * (H.wide || 1) + 0.158), y, z); mesh.scale.setScalar(1); mesh.updateMatrixWorld(true);
    const t = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000 + (H.seed % 7), strum = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5;
    // right wrist over the lower edge of the bowl, fingers at the strings between rose and bridge, brushing across them; left wrist under the neck, fingers over the fingerboard
    mesh.localToWorld(tR.set(0.075 + 0.012 * strum, -0.125, 0.05)); mesh.localToWorld(tL.set(0.062, 0.33 + 0.02 * Math.sin(t * 0.7), -0.022));
    mesh.matrixWorld.extractBasis(bx, by, bz); bx.normalize(); by.normalize(); bz.normalize();
    // hand frames (x along the knuckles, y along the fingers, -z out of the palm): left palm to the back of the neck, fingers up across it; right palm to the soundboard, fingers up the strings toward the rose
    mq.makeBasis(by.clone().negate(), bx.clone().negate(), bz.clone().negate()); qL.setFromRotationMatrix(mq);
    mq.makeBasis(by.clone().multiplyScalar(1), bx.clone().negate().lerp(by, 0.25).normalize(), bz.clone()); { const X0 = new T.Vector3(), Y0 = new T.Vector3(), Z0 = new T.Vector3(); mq.extractBasis(X0, Y0, Z0); Z0.copy(bz).negate(); X0.crossVectors(Y0, Z0).normalize(); Z0.crossVectors(X0, Y0).normalize(); mq.makeBasis(X0, Y0, Z0); } qR.setFromRotationMatrix(mq);
    Chars.reach(H, 'R', tR, qR); Chars.reach(H, 'L', tL, qL); mesh.userData.holding = true; Chars.grip(H, 'L', 0.6); Chars.grip(H, 'R', 0.3);
  } else {      // slung on the back by its strap: the bowl against the back, the neck up over the left shoulder, the soundboard outward
    Chars.reach(H, 'R', null); Chars.reach(H, 'L', null);
    y.copy(f.U).multiplyScalar(0.93).addScaledVector(f.R, -0.34).normalize(); z.copy(f.F).negate();
    hpPlace(mesh, o.copy(f.sp).addScaledVector(f.F, -(0.105 * k * (H.wide || 1) + 0.158)).addScaledVector(f.U, -0.16 * k).addScaledVector(f.R, 0.05 * k), y, z); mesh.userData.holding = false; Chars.grip(H, 'L', 0); Chars.grip(H, 'R', 0); mesh.scale.setScalar(1); hpStrap(H, mesh);
  }
  mesh.userData.grip = [0.0, 0.33, 0.0]; mesh.userData.hand = 'L'; mesh.scale.setScalar(1); mesh.visible = true;
}; }
function hpHammer(mesh) { return (H) => {
  mesh.visible = H.animNow !== 'lie'; if (!mesh.visible) { mesh.userData.holding = false; Chars.grip(H, 'R', 0); return; }
  const swing = H.animNow === 'hammer' && !H.talkNow, f = hpFrame(H);
  mesh.userData.holding = swing; Chars.grip(H, 'R', swing ? HP.GRIP.curl : 0);
  if (swing) { mesh.parent !== H.bones.handR && H.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos); hpTrue(mesh); }
  else {      // through the apron loop at the right hip, head down
    mesh.parent !== H.pivot && H.pivot.add(mesh); const y = new THREE.Vector3(0, -1, 0).addScaledVector(f.R, 0.08).normalize(), z = f.F.clone(), o = f.pel.clone().addScaledVector(f.R, 0.2).addScaledVector(f.U, 0.02).addScaledVector(f.F, 0.02);
    hpPlace(mesh, o, y, z); mesh.scale.setScalar(1);
  }
  mesh.userData.grip = [0, 0.02, 0]; mesh.userData.hand = 'R';
}; }
function hpPole(mesh, tilt, always, only) { return (H, st) => {
  // [ch4] put down when it is not in use: a spear is carried on guard and out of doors, and stays in the rack when its owner is indoors off duty, at table or in bed (it stood upright through
  // the bed and beside the supper table); a staff is laid by when its owner lies down; the rod is in the hand only while fishing.
  { const a = H.animNow, show = only ? a === only : always ? a !== 'lie' : a === 'guard' || (!(st && st.zone) && a !== 'sit' && a !== 'lie'); mesh.visible = show; if (!show) { mesh.userData.holding = false; Chars.grip(H, 'R', 0); return; } }      // a spear, staff or rod: stands in the fist, shaft up (rod: leaning forward), the hand slides along it; a spear is grounded beside the body when its holder is talking
  const f = hpFrame(H), held = true; mesh.userData.holding = held; Chars.grip(H, 'R', held ? HP.GRIP.curl : 0);
  mesh.parent !== H.pivot && H.pivot.add(mesh); const y = new THREE.Vector3(0, 1, 0).addScaledVector(f.F, tilt).normalize(), o = new THREE.Vector3();
  if (held) { H.bones.handR.localToWorld(o.fromArray(HP.GRIP.pos)); H.pivot.worldToLocal(o); } else { o.copy(f.pel).addScaledVector(f.R, 0.3).addScaledVector(f.F, 0.06); o.y = 0.95; y.set(0, 1, 0); }      // grounded beside the body
  hpPlace(mesh, o, y, f.F.clone()); mesh.scale.setScalar(1); mesh.userData.grip = [0, 0, 0]; mesh.userData.hand = 'R';
}; }
// [ch4] A mug: upright in the right fist, the arm brought to it (Chars.reach): on the table in front of a seated drinker, at the waist of someone carrying it. The innkeeper and the maid
// carry one while they stand or walk (not bent over their work); a guest of the Hart has one only while seated there. Nobody holds one in bed.
function hpMug(mesh, npc, staff) { const T = THREE, t = new T.Vector3(), X0 = new T.Vector3(), mq = new T.Matrix4(), q = new T.Quaternion(), pq = new T.Quaternion();
  return (H) => { const seated = H.animNow === 'sit', on = staff ? (H.animNow === 'idle' || H.animNow === 'walk') : seated && typeof npc.at === 'string' && /^inn\./.test(npc.at);
    mesh.visible = on; mesh.userData.holding = on; if (!on) { Chars.reach(H, 'R', null); Chars.grip(H, 'R', 0); return; }
    const f = hpFrame(H), k = H.root.scale.y || 1; t.copy(f.pel).addScaledVector(f.F, (seated ? 0.36 : 0.27) * k).addScaledVector(f.U, (seated ? 0.31 : 0.16) * k).addScaledVector(f.R, 0.17 * k); H.pivot.localToWorld(t);
    mq.makeBasis(X0.copy(f.U).negate(), f.F, f.R); q.setFromRotationMatrix(mq); H.pivot.getWorldQuaternion(pq); q.premultiply(pq);      // knuckles upright, fingers forward, palm to the left: the cup stands in the fist
    Chars.reach(H, 'R', t, q); Chars.grip(H, 'R', 0.95); hpTrue(mesh); mesh.userData.grip = [0, 0, 0]; mesh.userData.hand = 'R'; }; }
// [ch4] one tool per person who works with their hands, by their trade (CAST), and for the story people by who they are; nobody's hand is empty at the bench
const HP_TRADE = [[/tailor|draper|glover/, 'shears'], [/cobbler|saddler|harness/, 'awl'], [/butcher|the block/, 'cleaver'], [/fletcher|fletching|cutler|grinder|basket|tanner|shaves hoops/, 'knife'],
  [/cooper|boatwright|wheelwright|mason/, 'mallet'], [/woodcutter/, 'axe'], [/dyer|vats|alewife|brews|laundress/, 'paddle'], [/baker|bakehouse/, 'scraper'], [/apothecary/, 'pestle'], [/tinker|mends pans/, 'tinhammer'], [/net|weaver/, 'shuttle']];
const HP_WHO = { marta: 'pestle', hilda: 'shuttle', brandt: 'tongs', bram: 'sickle', edda: 'sickle', wren: 'knife' };
function hpTool(def) { if (HP_WHO[def.id]) return HP_WHO[def.id]; const c = typeof CAST !== 'undefined' && CAST.find ? CAST.find(x => x.id === def.id) : null, t = c && c.trade || ''; for (const [re, k] of HP_TRADE) if (re.test(t)) return k; return null; }
// [ch4] Where a tool is put down: at its owner's place of work (the schedule's work spot), on the nearest table or bench top within 1.6 m (a collision box whose top is
// 0.55 to 1.05 m above that floor, no longer than 3 m and long enough for the tool), lying flat along it; else, for a long tool, leaning against the nearest wall there (a box
// over 1.8 m); else on the floor beside the place.
// Found once per person. While it lies there it belongs to the world, not the person: it stays when they walk away and is drawn like any other thing in the room.
function hpRestPlace(npc, mesh) {
  if (npc._toolRest !== undefined) return npc._toolRest; npc._toolRest = null;
  const cnt = {}; for (const r of npc.def.sched || []) if (r[2] === 'work') cnt[r[1]] = (cnt[r[1]] || 0) + 1; const key = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], sp = key && World.spots[key]; if (!sp || typeof Col === 'undefined') return null;      // the place they work most
  const p = sp.p, fy = p[1], T = THREE, bb = mesh.geometry.boundingBox, cs = Col.cell, len = bb.max.y - bb.min.y, small = len < 0.36, cands = []; let best = null, bd = 1e9, wall = null, wd = 1e9;
  for (let gx = Math.floor((p[0] - 2) / cs); gx <= Math.floor((p[0] + 2) / cs); gx++) for (let gz = Math.floor((p[2] - 2) / cs); gz <= Math.floor((p[2] + 2) / cs); gz++) for (const c of Col.grid.get(gx * 4096 + gz) || []) {
    if (c.r !== undefined || c.off) continue; const top = c.y1 - fy; if (c.y0 - fy > 0.4) continue; const dx = p[0] - c.x, dz = p[2] - c.z, lx = dx * c.ax + dz * c.az, lz = dx * c.bx + dz * c.bz, qx = Math.max(-c.hx, Math.min(c.hx, lx)), qz = Math.max(-c.hz, Math.min(c.hz, lz)), d = Math.hypot(lx - qx, lz - qz);
    if (top > 0.55 && top < (small ? 1.25 : 1.05) && Math.max(c.hx, c.hz) < 1.5 && Math.min(c.hx, c.hz) > 0.12 && Math.max(c.hx, c.hz) * 2 > len * 0.75 && d < 1.6) { cands.push({ c, qx, qz, d }); if (d < bd) { bd = d; best = { c, qx, qz }; } }      // long enough to hold it (a paddle balanced on a sack); a small tool may lie on a loom beam or a high shelf
    else if (top > 1.8 && d < 1.6 && d < wd) { wd = d; wall = { c, qx, qz, lx, lz }; } }
  // the collision box says where a table stands, not always how high its top is drawn: a ray down at the middle and both ends of the tool must meet the same flat top there
  if (best && typeof SC !== 'undefined' && SC.scene) { const rc = new T.Raycaster(), down = new T.Vector3(0, -1, 0); best = null;
    for (const cd of cands.sort((a, b) => a.d - b.d).slice(0, 4)) { const { c } = cd, along = c.hx > c.hz ? new T.Vector3(c.ax, 0, c.az) : new T.Vector3(c.bx, 0, c.bz), m = 0.06, ux = Math.max(-c.hx + m, Math.min(c.hx - m, cd.qx * 0.75)), uz = Math.max(-c.hz + m, Math.min(c.hz - m, cd.qz * 0.75)), mid = new T.Vector3(c.x + ux * c.ax + uz * c.bx, 0, c.z + ux * c.az + uz * c.bz);
      rc.set(new T.Vector3(mid.x, fy + 1.4, mid.z), down); rc.far = 1.3; rc.layers.enableAll(); const h = rc.intersectObject(SC.scene, true).find(x => x.object !== mesh && !(x.object.name || '').startsWith('villager') && !(x.object.name || '').startsWith('prop:') && x.object.visible !== false), top = h ? h.point.y : -1e9;
      const y = h ? top : c.y1;      // a ray that meets nothing (furniture drawn in batches does not answer it) leaves the box's own top
      if (y - fy > 0.5 && y - fy < (small ? 1.3 : 1.1)) return npc._toolRest = { o: new T.Vector3(mid.x, y + 0.004, mid.z), y: along.normalize(), z: new T.Vector3(0, 1, 0), lift: -Math.min(bb.min.z, bb.min.x) }; } }
  if (best) { const { c } = best, m = 0.06, ux = Math.max(-c.hx + m, Math.min(c.hx - m, best.qx * 0.75)), uz = Math.max(-c.hz + m, Math.min(c.hz - m, best.qz * 0.75)), along = c.hx > c.hz ? new T.Vector3(c.ax, 0, c.az) : new T.Vector3(c.bx, 0, c.bz);
    const o = new T.Vector3(c.x + ux * c.ax + uz * c.bx, c.y1 + 0.004, c.z + ux * c.az + uz * c.bz); return npc._toolRest = { o, y: along.normalize(), z: new T.Vector3(0, 1, 0), lift: -Math.min(bb.min.z, bb.min.x) }; }
  if (wall && !small) { const { c } = wall, n = new T.Vector3((wall.lx - wall.qx) * c.ax + (wall.lz - wall.qz) * c.bx, 0, (wall.lx - wall.qx) * c.az + (wall.lz - wall.qz) * c.bz); if (n.lengthSq() < 1e-6) n.set(p[0] - c.x, 0, p[2] - c.z); n.normalize();
    const face = new T.Vector3(c.x + wall.qx * c.ax + wall.qz * c.bx, fy, c.z + wall.qx * c.az + wall.qz * c.bz), y = new T.Vector3(0, 1, 0).addScaledVector(n, -0.22).normalize(), o = face.clone().addScaledVector(n, 0.03 + len * 0.22).addScaledVector(y, -bb.min.y); o.y = fy - bb.min.y * y.y + 0.005;
    return npc._toolRest = { o, y, z: n, lift: 0 }; }
  const yaw = sp.yaw || 0, r = new T.Vector3(Math.cos(yaw), 0, Math.sin(yaw)); return npc._toolRest = { o: new T.Vector3(p[0] + r.x * 0.45, fy + 0.012, p[2] + r.z * 0.45), y: r, z: new T.Vector3(0, 1, 0), lift: 0.01 };
}
function hpWork(mesh, anim, npc) { return (H) => { const on = H.animNow === anim && !H.talkNow;
  if (on) { if (mesh.parent !== H.bones.handR) { H.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos); }
    mesh.visible = (H.lodLevel || 0) <= 1; mesh.userData.holding = true; Chars.grip(H, 'R', HP.GRIP.curl); hpTrue(mesh); mesh.frustumCulled = false; return; }      // a hand tool is not drawn beyond the middle weight (a draw call each)
  mesh.userData.holding = false; Chars.grip(H, 'R', 0); const R = npc && hpRestPlace(npc, mesh);
  if (!R) { mesh.visible = false; return; }
  if (mesh.parent !== H.pivot.parent) { H.pivot.parent.add(mesh); mesh.scale.set(1, 1, 1); hpPlace(mesh, R.o.clone().addScaledVector(R.z, R.lift || 0), R.y.clone(), R.z.clone()); mesh.frustumCulled = true; mesh.geometry.computeBoundingSphere(); mesh.updateMatrixWorld(true); }
  mesh.visible = true; }; }
// the besom: twig tips on the floor 0.78 m in front of the feet, a little to the right, swaying side to side; the handle rises to 0.34 m in front of the chest and both hands are brought
// to it (right at the hip, left 0.37 m above at the chest). The sweeping stance is a standing one (49_chars.js 'sweep'): the old crouching dig tented every skirt.
function hpBesom(mesh) { const T = THREE, fp = new T.Vector3(), y = new T.Vector3(), z = new T.Vector3(), o = new T.Vector3(), t = new T.Vector3(), q = new T.Vector3(); return (H) => { const on = H.animNow === 'sweep' && !H.talkNow && (H.lodLevel || 0) <= 2; mesh.visible = on; mesh.userData.holding = on;
  if (!on) { Chars.grip(H, 'R', 0); Chars.grip(H, 'L', 0); Chars.reach(H, 'L', null); Chars.reach(H, 'R', null); return; }
  if (mesh.parent !== H.pivot) H.pivot.add(mesh); mesh.scale.setScalar(1); const f = hpFrame(H), k = H.root.scale.y || 1, tm = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000 + H.seed % 5, sw = Math.sin(tm * 1.9);
  fp.copy(f.pel).addScaledVector(f.F, 0.82 * k).addScaledVector(f.R, 0.12 * k + 0.16 * sw); fp.y = 0.02;
  // the handle top in front of the chest, clear of a broad one
  const top = f.sp.clone().addScaledVector(f.F, 0.36 * k * (H.wide || 1) + 0.03).addScaledVector(f.R, 0.08 * k); y.subVectors(top, fp).normalize(); z.copy(f.F).negate();
  o.copy(fp).addScaledVector(y, 1.1); hpPlace(mesh, o, y, z); mesh.updateMatrixWorld(true);
  // each hand to the handle where it passes nearest that shoulder (the right a hand's width lower, the left at it): every body reaches it, whatever its build
  const shR = hpLocal(H, H.root.getObjectByName('upperarm_r'), new T.Vector3()), shL = hpLocal(H, H.root.getObjectByName('upperarm_l'), new T.Vector3());
  // if the handle passes beyond an arm's reach of either shoulder, slide the whole besom toward the body (along the ground) until it does not
  const armLen = s => { const u = H.root.getObjectByName('upperarm_' + s), l = H.root.getObjectByName('lowerarm_' + s), hd = H.root.getObjectByName('hand_' + s); const a = u.getWorldPosition(new T.Vector3()), b = l.getWorldPosition(new T.Vector3()), c = hd.getWorldPosition(new T.Vector3()); return a.distanceTo(b) + b.distanceTo(c); };
  for (const [sh, L] of [[shR, armLen('r')], [shL, armLen('l')]]) { const t0 = Math.max(-0.6, Math.min(0.3, sh.clone().sub(o).dot(y))), np = o.clone().addScaledVector(y, t0), d = np.distanceTo(sh), lim = L * 0.86;
    if (d > lim) { const mv = sh.clone().sub(np).setY(0); const k2 = Math.min(1, (d - lim) / Math.max(0.01, mv.length())); mv.multiplyScalar(k2 * 1.05); o.add(mv); fp.add(mv); } }
  hpPlace(mesh, o, y, z); mesh.updateMatrixWorld(true);
  const along = P => Math.max(-0.6, Math.min(0.3, P.clone().sub(o).dot(y))), tR = along(shR) - 0.12, tL = Math.min(0.32, Math.max(tR + 0.3, along(shL) + 0.02));
  const lowR = H.pivot.localToWorld(q.copy(o).addScaledVector(y, tR)), hiL = H.pivot.localToWorld(t.copy(o).addScaledVector(y, tL));
  Chars.reach(H, 'R', lowR.clone()); Chars.reach(H, 'L', hiL.clone()); Chars.grip(H, 'R', HP.GRIP.curl); Chars.grip(H, 'L', HP.GRIP.curl); mesh.userData.grip = [0, tR, 0]; mesh.userData.hand = 'R'; }; }
function npcHandProp(npc) {
  const ch = npc.ch; if (!ch || typeof RPG === 'undefined' || !RPG.merge) return;
  for (const kind of hpKinds(npc.def)) {
    const g = hpGeo(kind); if (!g) continue;
    const mesh = new THREE.Mesh(g, RPG.gearMat ? RPG.gearMat(ch.uZone, ch.uLight) : RPG.litMat(ch.uZone, ch.uLight, 0.55)); mesh.layers.set(1); mesh.castShadow = false; mesh.name = 'prop:' + kind; mesh.frustumCulled = false;
    mesh.userData = { kind, holding: true, grip: [0, 0, 0], hand: 'R', len: HP_SIZE[kind] }; if (kind === 'mug') { mesh.material.side = THREE.DoubleSide; }      // [ch4] the kit's cup is modelled to be seen from both sides (its inside is the back of its outside)
    ch.pivot.add(mesh); (ch.post = ch.post || []);
    if (kind === 'lute') ch.post.push(hpLute(mesh));
    else if (kind === 'hammer') ch.post.push(hpHammer(mesh));
    else if (kind === 'spear') ch.post.push(hpPole(mesh, 0, false));
    else if (kind === 'staff') ch.post.push(hpPole(mesh, 0.05, true));
    else if (kind === 'rod') ch.post.push(hpPole(mesh, 0.7, true, 'fish'));
    else if (kind === 'besom') ch.post.push(hpBesom(mesh));
    else if (HP_SIZE[kind] && !['lute', 'hammer', 'spear', 'staff', 'rod', 'mug', 'flute'].includes(kind)) { ch.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos); ch.post.push(hpWork(mesh, 'work', npc)); }
    else if (kind === 'mug') { ch.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos); ch.post.push(hpMug(mesh, npc, npc.def.id === 'osric' || npc.def.id === 'greta')); }
    else { ch.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos);
      ch.post.push(H => { mesh.scale.setScalar(1 / Math.max(1e-3, H.root.scale.y)); Chars.grip(H, 'R', HP.GRIP.curl); }); }
    npc.props = (npc.props || []).concat([mesh]);
  }
}
