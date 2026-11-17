// ───────────────────────── things in people's hands: lute, hammer, spear, staff, rod, mug, flute ─────────────────────────
// [ch1] Rebuilt. The 'real' characters carry nothing of their own, so every prop is a small mesh in metres (true size), in a frame of its own: origin where the hand closes,
// long axis +y, the lute's soundboard facing +z. Wood and iron use RPG.gearMat (grain streaks on wood, worn metal). A prop is
//   - held: parented to the hand bone with HP.GRIP (the handle lies across the palm, along the knuckles) while the fingers curl round it (Chars.grip), or
//   - placed by a post-update function that reads the two hand bones: the lute is put between the hands (right hand over the strings, left round the neck) so nothing floats,
//     and slung on the back when he is not playing; the hammer hangs from the belt unless it is being swung; the spear stands grounded beside the body unless it is held.
// mesh.userData = { kind, holding, grip: [x,y,z] the point of the prop that must be in the hand (test/hold.js), hand: 'R'|'L', len: longest side in metres }.
const HP = { cache: {}, GRIP: { rot: [0, 0, Math.PI / 2], pos: [0, 0.07, -0.015], curl: 0.75 } };
const HP_SIZE = { lute: 0.8, hammer: 0.4, spear: 2.3, staff: 1.8, rod: 2.2, mug: 0.14, flute: 0.45 };      // longest side allowed, metres (test/hold.js)
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
    for (let i = 0; i < R; i++) { const a0 = Math.PI / 2 + i * Math.PI / R; P.push([new T.LatheGeometry(pr, 3, a0, Math.PI / R), X(0, 0, 0, 0, 0, 0, 1, 1, 0.47), i % 2 ? [0.36, 0.22, 0.10] : [0.26, 0.15, 0.07], MW]); }
    const sh = new T.Shape(); pr.forEach((v, i) => i ? sh.lineTo(v.x, v.y) : sh.moveTo(v.x, v.y)); for (let i = pr.length - 1; i >= 0; i--) sh.lineTo(-pr[i].x, pr[i].y);
    P.push([new T.ShapeGeometry(sh), X(0, 0, 0.0015), [0.50, 0.36, 0.20], MW]);                                                   // the soundboard
    P.push([new T.CircleGeometry(0.036, 14), X(0, -0.03, 0.0028), DK, MW], [new T.RingGeometry(0.036, 0.043, 14), X(0, -0.03, 0.0032), [0.30, 0.19, 0.09], MW]);      // the rose
    P.push([new T.BoxGeometry(0.11, 0.014, 0.012), X(0, -0.17, 0.008), DK, MW]);                                                    // the bridge
    P.push([new T.BoxGeometry(0.048, 0.30, 0.022), X(0, 0.31, 0.011), WD, MW], [new T.BoxGeometry(0.040, 0.26, 0.006), X(0, 0.31, 0.025), DK, MW]);      // neck and fingerboard
    P.push([new T.BoxGeometry(0.06, 0.13, 0.026), X(0, 0.505, -0.03, -1.15, 0, 0), WD, MW]);                                         // the pegbox, bent back
    for (let i = 0; i < 6; i++) { const x = -0.0105 + i * 0.0042; P.push([new T.BoxGeometry(0.0013, 0.62, 0.0013), X(x, 0.14, 0.029), [0.74, 0.70, 0.58], MW]); }
  }
  else if (kind === 'hammer') P = [hpWood(0.36, 0.0135, 0.0165, -0.14, WD), [new T.BoxGeometry(0.07, 0.040, 0.034), X(0, 0.225, 0), IR, MI], [new T.BoxGeometry(0.030, 0.048, 0.044), X(0.048, 0.225, 0), IR, MI], [new T.BoxGeometry(0.045, 0.026, 0.026), X(-0.052, 0.225, 0), IR, MI]];
  else if (kind === 'spear') P = [hpWood(1.9, 0.0145, 0.012, -0.95, WD, 6), [new T.ConeGeometry(0.028, 0.24, 6), X(0, 1.07, 0, 0, 0, 0, 1, 1, 0.45), IR, MI], [new T.CylinderGeometry(0.019, 0.019, 0.05, 6), X(0, 0.96, 0), IR, MI]];
  else if (kind === 'staff') P = [hpWood(1.65, 0.021, 0.017, -0.8, WD, 7), [new T.SphereGeometry(0.036, 8, 6), X(0, 0.87, 0), WL, MW]];
  else if (kind === 'rod') P = [hpWood(2.0, 0.015, 0.004, -0.5, WL, 5)];
  else if (kind === 'mug') P = [[new T.CylinderGeometry(0.040, 0.034, 0.095, 12), X(0, 0.02, 0), CL, MW], [new T.TorusGeometry(0.03, 0.006, 5, 8, Math.PI), X(0.04, 0.02, 0, 0, 0, -Math.PI / 2), CL, MW], [new T.CylinderGeometry(0.036, 0.036, 0.006, 12), X(0, 0.066, 0), [0.40, 0.20, 0.07], MW]];
  else if (kind === 'flute') P = [[new T.CylinderGeometry(0.0095, 0.0095, 0.42, 8), X(0, 0.1, 0), WL, MW], [new T.CylinderGeometry(0.0105, 0.0105, 0.02, 8), X(0, 0.30, 0), DK, MW]];
  else return null;
  const g = RPG.merge(P); g.computeBoundingBox(); HP.cache[kind] = g; return g;
}
// the props each person carries (def.prop from the schedules table, plus the regulars' mugs and flute)
function hpKinds(def) {
  const k = [];
  if (def.prop && ['lute', 'hammer', 'spear', 'staff', 'rod'].includes(def.prop)) k.push(def.prop);
  if (def.id === 'osric' || def.id === 'greta') k.push('mug');
  if (/^pat\d/.test(def.id)) k.push(def.id === 'pat4' ? 'flute' : 'mug');
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
function hpLute(mesh) { return (H) => {
  const f = hpFrame(H), play = H.animNow === 'lute' && !H.talkNow, y = new THREE.Vector3(), z = new THREE.Vector3(), o = new THREE.Vector3();
  if (play) {      // the right hand over the strings (at y = -0.12 on the soundboard), the left round the neck
    y.subVectors(f.pL, f.pR).normalize(); z.copy(f.F); hpPlace(mesh, o.copy(f.pR).addScaledVector(y, 0.12).addScaledVector(z, -0.045), y, z);
    mesh.userData.holding = true; Chars.grip(H, 'L', 0.55); Chars.grip(H, 'R', 0.25);
  } else {      // slung on the back by its strap, neck up over the left shoulder, soundboard outward
    y.copy(f.U).multiplyScalar(0.93).addScaledVector(f.R, 0.34).normalize(); z.copy(f.F).negate();
    hpPlace(mesh, o.copy(f.sp).addScaledVector(f.F, -0.15).addScaledVector(f.U, -0.2).addScaledVector(f.R, -0.04), y, z); mesh.userData.holding = false; Chars.grip(H, 'L', 0); Chars.grip(H, 'R', 0);
  }
  mesh.userData.grip = [0, 0.31, 0.02]; mesh.userData.hand = 'L'; mesh.scale.setScalar(1); mesh.visible = true;
}; }
function hpHammer(mesh) { return (H) => {
  const swing = H.animNow === 'hammer' && !H.talkNow, f = hpFrame(H);
  mesh.userData.holding = swing; Chars.grip(H, 'R', swing ? HP.GRIP.curl : 0);
  if (swing) { mesh.parent !== H.bones.handR && H.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos); mesh.scale.setScalar(1 / Math.max(1e-3, H.root.scale.y)); }
  else {      // through the apron loop at the right hip, head down
    mesh.parent !== H.pivot && H.pivot.add(mesh); const y = new THREE.Vector3(0, -1, 0).addScaledVector(f.R, 0.08).normalize(), z = f.F.clone(), o = f.pel.clone().addScaledVector(f.R, 0.2).addScaledVector(f.U, 0.02).addScaledVector(f.F, 0.02);
    hpPlace(mesh, o, y, z); mesh.scale.setScalar(1);
  }
  mesh.userData.grip = [0, 0.02, 0]; mesh.userData.hand = 'R';
}; }
function hpSpear(mesh) { return (H) => {
  const held = H.animNow === 'guard' && !H.talkNow, f = hpFrame(H); mesh.userData.holding = held; Chars.grip(H, 'R', held ? HP.GRIP.curl : 0);
  if (held) { mesh.parent !== H.bones.handR && H.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos); mesh.scale.setScalar(1 / Math.max(1e-3, H.root.scale.y)); }
  else { mesh.parent !== H.pivot && H.pivot.add(mesh); const o = f.pel.clone().addScaledVector(f.R, 0.3).addScaledVector(f.F, 0.06); o.y = 0.95; hpPlace(mesh, o, new THREE.Vector3(0, 1, 0), f.F.clone()); mesh.scale.setScalar(1); }      // grounded beside the body
  mesh.userData.grip = [0, 0.02, 0]; mesh.userData.hand = 'R';
}; }
function npcHandProp(npc) {
  const ch = npc.ch; if (!ch || typeof RPG === 'undefined' || !RPG.merge) return;
  for (const kind of hpKinds(npc.def)) {
    const g = hpGeo(kind); if (!g) continue;
    const mesh = new THREE.Mesh(g, RPG.gearMat ? RPG.gearMat(ch.uZone, ch.uLight) : RPG.litMat(ch.uZone, ch.uLight, 0.55)); mesh.layers.set(1); mesh.castShadow = false; mesh.name = 'prop:' + kind; mesh.frustumCulled = false;
    mesh.userData = { kind, holding: true, grip: [0, 0, 0], hand: 'R', len: HP_SIZE[kind] };
    ch.pivot.add(mesh); (ch.post = ch.post || []);
    if (kind === 'lute') ch.post.push(hpLute(mesh));
    else if (kind === 'hammer') ch.post.push(hpHammer(mesh));
    else if (kind === 'spear') ch.post.push(hpSpear(mesh));
    else { ch.bones.handR.add(mesh); mesh.rotation.set(HP.GRIP.rot[0], HP.GRIP.rot[1], HP.GRIP.rot[2]); mesh.position.fromArray(HP.GRIP.pos);
      ch.post.push(H => { mesh.scale.setScalar(1 / Math.max(1e-3, H.root.scale.y)); Chars.grip(H, 'R', HP.GRIP.curl); }); }
    npc.props = (npc.props || []).concat([mesh]);
  }
}
