// ───────────────────────── things in people's hands: lute, hammer, spear, staff, rod, mug, flute, drum ─────────────────────────
// The 'real' characters carry nothing of their own (def.prop was only drawn by the old procedural body). Each prop is a small vertex-coloured mesh in the sword's grip frame
// (origin where the hand closes, long axis +y), parented to a hand bone with Chars.attach, lit like the villagers (RPG.litMat). The lute is held by the left hand on its neck
// with its body against the player's hip while the 'lute' clip runs: HP.LUTE is the pose (rotation, position in the hand bone's frame), tuned by eye.
const HP = { cache: {}, LUTE: [0, 0, 1.5, 0, 0.05, 0.04] };
function hpGeo(kind) {
  if (HP.cache[kind]) return HP.cache[kind];
  const T = THREE, X = RPG.xf, WD = [0.16, 0.08, 0.035], WL = [0.26, 0.15, 0.07], DK = [0.04, 0.025, 0.015], ST = [0.3, 0.31, 0.34], IR = [0.12, 0.12, 0.13], CL = [0.5, 0.36, 0.2];
  let P;
  if (kind === 'lute') P = [
    [new T.SphereGeometry(1, 14, 10), X(0, -0.3, 0, 0, 0, 0, 0.17, 0.23, 0.095), WD],                                      // the pear-shaped bowl
    [new T.CylinderGeometry(0.045, 0.045, 0.012, 12), X(0, -0.25, 0.088, PI / 2, 0, 0), DK],                                   // the sound hole
    [new T.BoxGeometry(0.15, 0.012, 0.014), X(0, -0.42, 0.09), WL],                                                         // the bridge
    [new T.BoxGeometry(0.05, 0.56, 0.03), X(0, 0.17, 0, 0, 0, 0), WD],                                                        // the neck
    [new T.BoxGeometry(0.04, 0.46, 0.012), X(0, 0.2, 0.02), DK],                                                           // the fingerboard
    [new T.BoxGeometry(0.06, 0.14, 0.03), X(0, 0.52, -0.035, -0.55, 0, 0), WD],                                              // the pegbox, bent back
    [new T.BoxGeometry(0.004, 0.8, 0.004), X(-0.012, 0.0, 0.026), [0.7, 0.66, 0.55]], [new T.BoxGeometry(0.004, 0.8, 0.004), X(0.012, 0.0, 0.026), [0.7, 0.66, 0.55]],
  ];
  else if (kind === 'hammer') P = [[new T.CylinderGeometry(0.02, 0.024, 0.5, 7), X(0, 0.12, 0), WD], [new T.BoxGeometry(0.17, 0.075, 0.08), X(0, 0.4, 0), IR], [new T.BoxGeometry(0.04, 0.1, 0.07), X(0.095, 0.4, 0), IR]];
  else if (kind === 'spear') P = [[new T.CylinderGeometry(0.014, 0.016, 1.9, 6), X(0, 0.35, 0), WD], [new T.ConeGeometry(0.035, 0.26, 4), X(0, 1.43, 0), ST], [new T.CylinderGeometry(0.022, 0.022, 0.06, 6), X(0, 1.29, 0), IR]];
  else if (kind === 'staff') P = [[new T.CylinderGeometry(0.02, 0.026, 1.7, 6), X(0, 0.35, 0), WD], [new T.SphereGeometry(0.045, 8, 6), X(0, 1.22, 0), WL]];
  else if (kind === 'rod') P = [[new T.CylinderGeometry(0.006, 0.014, 2.0, 5), X(0, 0.7, 0), WL]];
  else if (kind === 'mug') P = [[new T.CylinderGeometry(0.042, 0.036, 0.1, 10), X(0, 0.05, 0), CL], [new T.TorusGeometry(0.03, 0.007, 5, 8, PI), X(0.044, 0.05, 0, 0, 0, -PI / 2), CL], [new T.CylinderGeometry(0.038, 0.038, 0.006, 10), X(0, 0.093, 0), [0.45, 0.28, 0.08]]];
  else if (kind === 'flute') P = [[new T.CylinderGeometry(0.011, 0.011, 0.42, 6), X(0, 0.1, 0, 0, 0, 0), WL], [new T.CylinderGeometry(0.0125, 0.0125, 0.02, 6), X(0, 0.31, 0), DK]];
  else if (kind === 'drum') P = [[new T.CylinderGeometry(0.17, 0.17, 0.12, 14), X(0, 0, 0), WD], [new T.CylinderGeometry(0.16, 0.16, 0.012, 14), X(0, 0.062, 0), [0.55, 0.45, 0.3]], [new T.CylinderGeometry(0.172, 0.172, 0.015, 14), X(0, -0.04, 0), IR]];
  else return null;
  return HP.cache[kind] = RPG.merge(P);
}
// the props each person carries (def.prop from the schedules table, plus the regulars' mugs and flute)
function hpKinds(def) {
  const k = [];
  if (def.prop && ['lute', 'hammer', 'spear', 'staff', 'rod'].includes(def.prop)) k.push(def.prop);
  if (def.id === 'osric' || def.id === 'greta') k.push('mug');
  if (/^pat\d/.test(def.id)) k.push(def.id === 'pat4' ? 'flute' : 'mug');
  return k;
}
function npcHandProp(npc) {
  const ch = npc.ch; if (!ch || typeof RPG === 'undefined' || !RPG.merge) return;
  for (const kind of hpKinds(npc.def)) {
    const g = hpGeo(kind); if (!g) continue;
    const mesh = new THREE.Mesh(g, RPG.litMat(ch.uZone, ch.uLight, 0.55)); mesh.layers.set(1); mesh.castShadow = false; mesh.name = 'prop:' + kind;
    const grip = (Chars.cfg && Chars.cfg.grip) || [1.384, 0.06, -0.916, 0.023, 0.024, 0.014], sc = 1 / (((Chars.cfg && Chars.cfg.scale) || 1) * (npc.scale || 1));
    if (kind === 'lute') { const L = HP.LUTE; mesh.rotation.set(L[0], L[1], L[2]); mesh.position.set(L[3], L[4], L[5]); mesh.scale.setScalar(sc); Chars.attach(ch, 'handL', mesh); }
    else { mesh.rotation.set(grip[0], grip[1], grip[2]); mesh.position.set(grip[3], grip[4], grip[5]); mesh.scale.setScalar(kind === 'mug' || kind === 'flute' ? sc * 1.0 : sc); Chars.attach(ch, 'handR', mesh); }
    npc.props = (npc.props || []).concat([mesh]);
  }
}
