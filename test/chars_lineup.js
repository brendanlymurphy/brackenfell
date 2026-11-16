// Character close-up harness (art review). Run first, in the same page: it defines window.LU.
//   LU.show(name, dist, az, opts)   name: a villager id (hale...), a body (m_smith) or an outlaw (o_brute); dist in m; az: degrees round the person (0 = face on)
//   opts: { hour, inn: true (put them at the inn hearth), face: true (camera at head height), anim, look: [yaw, pitch] }
// then take a screenshot. usage: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/chars_lineup.js)" --do "await LU.show('hale',1.2,0)" --out f.png
window.LU = (() => {
  const LU = { cur: null, where: null };
  const BODY_ID = { m_guard: 'hale', f_maid: 'greta', m_smith: 'brandt', m_boy: 'tobin', f_herbalist: 'marta', m_monk: 'aldous', f_elder: 'maren', m_innkeeper: 'osric', f_farmer: 'edda', m_fisher: 'finn', m_youth: 'lark', f_girl: 'wren', m_elder: 'rowan', f_child: 'pip', m_hunter: 'ivo', f_weaver: 'hilda', m_farmer: 'bram' };
  const FOE = { o_hood_m: 0, o_brute: 1, o_hood_f: 2, o_rogue: 3 };
  LU.names = Object.keys(BODY_ID).concat(Object.keys(FOE));
  // a voiced line of a speaker, with its mouth-shape track (manifest "c"); LU.show(..., { line: LU.line('hale'), at: seconds }) poses the face as at that moment of the line
  LU.line = async (id, which = 0) => {
    LU.man = LU.man || await (await fetch('audio/voice/manifest.json')).json(); LU.plan = LU.plan || (await (await fetch('tools/voice/plan.json')).json()).plan;
    const ks = LU.plan.filter(p => p.speaker === id && p.kind === 'line' && LU.man.lines[p.key] && LU.man.lines[p.key].c), p = ks[Math.min(which, ks.length - 1)]; if (!p) return null;
    const e = LU.man.lines[p.key]; return { key: p.key, text: p.say || p.text, dur: e.d, env: e.e, cues: e.c };
  };
  LU.show = async (name, dist, az, o = {}) => {
    const id = BODY_ID[name] || name;
    if (LU.cur && LU.cur.id !== id) { Chars.remove(LU.cur.h); LU.cur = null; }
    if (!LU.cur) {
      let def;
      if (FOE[id] !== undefined) { await Chars.ensure([id]); def = { id: 'lu.' + id, foe: Chars.cfg.foeLooks.list[FOE[id]] }; }
      else { const bn = BODY_ID[name] ? name : Object.keys(BODY_ID).find(k => BODY_ID[k] === name); def = Object.assign({}, NPC_DEFS.find(d => d.id === id) || {}, { id: 'lu.' + id, body: bn }); }
      const h = Chars.spawn(def); h.pivot.traverse(o => { o.layers.set(1); }); LU.cur = { id, h, def, scale: (NPC_DEFS.find(d => d.id === id) || {}).scale || 1 };
    }
    const hr = o.hour === undefined ? 13 : o.hour, inn = !!o.inn;
    if (inn !== !!Cells.cur) { if (inn) game.enter('inn'); else game.leave(); }
    let sx, sz, sy, yaw;
    if (inn) { const sp = World.spots['inn.fire1']; sx = sp.p[0]; sz = sp.p[2]; sy = sp.p[1]; yaw = sp.yaw; sx += 0; if (o.turn) yaw += Math.PI; }
    else { sx = 4.2; sz = -2.5; sy = Terrain.y(sx, sz); yaw = 0; }
    const a = yaw + az * Math.PI / 180, cx = sx + Math.sin(a) * dist, cz = sz - Math.cos(a) * dist;
    const st = { pos: [sx, sy, sz], yaw, anim: o.anim || 'idle', scale: LU.cur.scale, zone: inn ? 1 : 0, light: inn ? 0.34 : 1, visible: true, cast: true, look: o.look || [0, 0], talking: false };
    if (o.line) { st.talking = true; const V = Snd.vox, t = o.at || 0, now = Snd.now(); V.cur = { speaker: 'lu.' + id, t0: now - t, dur: o.line.dur, env: o.line.env, cues: o.line.cues };
      for (let i = 0; i < 24; i++) { V.cur.t0 = Snd.now() - t - (23 - i) * 0 ; Chars.update(LU.cur.h, st, 0.016); } }
    else { LU.cur.h.face && (LU.cur.h.face.open = 0); if (Snd.vox) Snd.vox.cur = null; }
    for (let i = 0; i < 8; i++) Chars.update(LU.cur.h, st, 0.1);
    const hb = LU.cur.h.bones.head, p = new THREE.Vector3(); hb.getWorldPosition(p);
    const cy = o.face ? p.y + 0.04 : sy + (dist > 5 ? 1.5 : 1.25), pitch = o.face ? 0 : (dist > 5 ? -2 : 4);
    return await game.shot(cx, cy, cz, (a + Math.PI) * 180 / Math.PI, pitch, hr);
  };
  return LU;
})();
return LU.names.length;
