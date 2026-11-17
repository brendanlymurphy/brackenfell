// Repairs the wardrobe of finished character GLBs without Blender [ch4]. Safe to run again; rewrites the files in place.
//   node tools/humans/reskin.mjs chars/real/[fmo]_*.glb        then: node tools/assets_pack.mjs
// 1. Unweighted vertices. garb.py takes a garment vertex's weights from the four nearest body vertices; where those have none the
//    exporter binds the vertex to "neutral_bone", which never moves: the vertex stays at standing height while the body sits and its
//    triangles become metre-long shards. Such a vertex gets the weights of the nearest weighted vertex of its own mesh.
// 2. The cloak. It was fitted round whatever the torso search returned, and once kirtle sleeves existed that included the
//    outstretched arms: a wrap 0.9 m wide in the bind pose that folds onto the arms like a ragged coat and that the kirtle shows
//    through. It is rebuilt here as a back cloak: over the shoulders from a clasp at the throat, down the back to the knee, its
//    edges behind the arms; fitted outside everything worn on the torso; weights from the surface under it above the hips, the
//    hips alone below (legs and arms never drag it). Lighter grids replace the @mid and @lod copies.
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, EXTTextureWebP, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'node:fs';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions([KHRMeshQuantization, EXTTextureWebP, EXTMeshoptCompression]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const ARM = /^(upperarm|lowerarm|hand|thumb|index|middle|ring|pinky)_/, LEG = /^(thigh|calf|foot|ball)_/;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]), lerp = (a, b, t) => a + (b - a) * t, sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// closest point on triangle (Ericson), returns [point, barycentric]
function closest(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return [a, [1, 0, 0]];
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return [b, [0, 1, 0]];
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [[a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v], [1 - v, v, 0]]; }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return [c, [0, 0, 1]];
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [[a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w], [1 - w, 0, w]]; }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + d5 - d6); return [[b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w], [0, 1 - w, w]]; }
  const dn = 1 / (va + vb + vc), v = vb * dn, w = vc * dn; return [[a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w], [1 - v - w, v, w]];
}
function rayTri(o, d, a, b, c) { const e1 = sub(b, a), e2 = sub(c, a), h = cross(d, e2), det = dot(e1, h); if (Math.abs(det) < 1e-12) return -1; const f = 1 / det, s = sub(o, a), u = f * dot(s, h); if (u < 0 || u > 1) return -1; const q = cross(s, e1), v = f * dot(d, q); if (v < 0 || u + v > 1) return -1; return f * dot(e2, q); }
const inv4 = m => { // rigid-ish 4x4 inverse (column major), general
  const r = new Array(16), a = m; const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; r[12] = (-a[4] * b09 + a[5] * b07 - a[6] * b06) / det; r[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) / det; r[14] = (-a[12] * b03 + a[13] * b01 - a[14] * b00) / det; return [r[12], r[13], r[14]]; };

for (const file of process.argv.slice(2)) {
  const doc = await io.read(file), root = doc.getRoot(), skin = root.listSkins()[0]; if (!skin) continue;
  const J = skin.listJoints().map(j => j.getName()), ibm = skin.getInverseBindMatrices(), bone = {}; { const e = []; J.forEach((n, i) => { ibm.getElement(i, e); bone[n] = inv4(e); }); }
  const NI = J.indexOf('neutral_bone'), log = [];
  const prims = []; for (const n of root.listNodes()) { const m = n.getMesh(); if (m) for (const p of m.listPrimitives()) prims.push({ name: m.getName(), node: n, mesh: m, p }); }
  const wOf = (x, i) => { const e = [], g = []; x.p.getAttribute('JOINTS_0').getElement(i, e); x.p.getAttribute('WEIGHTS_0').getElement(i, g); return [e, g]; };
  const setW = (x, list) => { // list: per vertex Map(joint -> weight); bytes that add up to exactly 255
    const n = list.length, jb = new Uint8Array(n * 4), wb = new Uint8Array(n * 4);
    list.forEach((mp, i) => { const top = [...mp].filter(t => t[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4), tot = top.reduce((s, t) => s + t[1], 0) || 1; let sum = 0; top.forEach((t, k) => { jb[i * 4 + k] = t[0]; wb[i * 4 + k] = Math.round(t[1] / tot * 255); sum += wb[i * 4 + k]; }); wb[i * 4] += 255 - sum; });
    const buf = x.p.getAttribute('POSITION').getBuffer();
    x.p.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(jb).setBuffer(buf)); x.p.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(wb).setNormalized(true).setBuffer(buf)); };

  // ── 1. unweighted vertices ──
  if (NI >= 0) for (const x of prims) { if (/^w_cloak/.test(x.name)) continue; const pos = x.p.getAttribute('POSITION'), n = pos.getCount(), W = [], bad = [], P = [];
    for (let i = 0; i < n; i++) { const [e, g] = wOf(x, i), mp = new Map(); let nb = 0; for (let k = 0; k < 4; k++) if (g[k] > 0) { if (e[k] === NI) nb += g[k]; else mp.set(e[k], (mp.get(e[k]) || 0) + g[k]); } W.push(mp); P.push(pos.getElement(i, [])); if (nb > 0.01) bad.push(i); }
    if (!bad.length) continue; const good = i => !bad.includes(i) && W[i].size;
    for (const i of bad) { let best = -1, bd = 1e9; for (let k = 0; k < n; k++) if (good(k)) { const d = len(sub(P[i], P[k])); if (d < bd) { bd = d; best = k; } } if (best >= 0) W[i] = new Map(W[best]); }
    setW(x, W); log.push(x.name + ' unweighted ' + bad.length); }

  // ── 2. the cloak ──
  const cloaks = prims.filter(x => /^w_cloak(@|$)/.test(x.name));
  if (cloaks.length && bone.neck_01 && bone.pelvis && bone.calf_l) {
    // what is worn on the torso, full weight only: triangles that are not arm, head or hat
    const T = []; for (const x of prims) { if (/@/.test(x.name) || /^w_(cloak|hat|pouch)/.test(x.name) || /brow|low-poly|teeth|tongue/i.test(x.name)) continue; const kind = (x.p.getMaterial().getExtras() || {}).kind; if (kind === 'hair' || kind === 'eye' || kind === 'brow') continue;
      const pos = x.p.getAttribute('POSITION'), ix = x.p.getIndices().getArray(), n = pos.getCount(), P = [], W = [], arm = [];
      for (let i = 0; i < n; i++) { P.push(pos.getElement(i, [])); const [e, g] = wOf(x, i), mp = new Map(); let a = 0; for (let k = 0; k < 4; k++) if (g[k] > 0) { mp.set(e[k], (mp.get(e[k]) || 0) + g[k]); if (ARM.test(J[e[k]]) || J[e[k]] === 'head') a += g[k]; } W.push(mp); arm.push(a); }
      for (let t = 0; t < ix.length; t += 3) { const a = ix[t], b = ix[t + 1], c = ix[t + 2]; if (arm[a] > 0.35 || arm[b] > 0.35 || arm[c] > 0.35) continue; T.push({ a: P[a], b: P[b], c: P[c], w: [W[a], W[b], W[c]] }); } }
    const outer = (o, d) => { let best = -1; for (const t of T) { const k = rayTri(o, d, t.a, t.b, t.c); if (k > best && k < 0.6) best = k; } return best; };
    const yTop = bone.neck_01[1] - 0.03, yHem = bone.calf_l[1] - 0.02, yHip = bone.pelvis[1], ySh = (bone.upperarm_l || bone.clavicle_l || bone.spine_03)[1], zc = bone.spine_03 ? (bone.spine_03[2] + bone.pelvis[2]) / 2 : bone.pelvis[2];
    const SKIRT = prims.some(x => x.name === 'w_kirtle') && prims.find(x => x.name === 'w_kirtle').p.getAttribute('POSITION').getMin([])[1] < bone.calf_l[1] - 0.1;      // an ankle-length kirtle
    const PEL = J.indexOf('pelvis'), col = (() => { const c = cloaks[0].p.getAttribute('COLOR_0'); return c ? c.getElement(0, []) : [1, 1, 1, 4 / 12]; })();
    const build = (N, K) => { const V = [], R = [], A = [], F = [];
      for (let j = 0; j <= K; j++) { const f = j / K, y = lerp(yTop, yHem, f), span = lerp(2.05, 1.22, sm(0.04, 0.24, f)); R.push([]); A.push([]);
        for (let i = 0; i < N; i++) { const a = (i / (N - 1) * 2 - 1) * span, d = [Math.sin(a), 0, -Math.cos(a)], yr = SKIRT ? y : Math.max(y, yHip - 0.08); let r = outer([0, yr, zc], d);
          if (r < 0) r = j ? R[j - 1][i] : 0.12; R[j].push(r); A[j].push(a); } }
      // the cloth cannot follow every hollow: smooth the radii, and never come back in under what hangs above (cloth falls from the shoulder blades and the seat)
      for (let pass = 0; pass < 2; pass++) for (let j = 0; j <= K; j++) { const row = R[j].slice(); for (let i = 0; i < N; i++) R[j][i] = Math.max(row[i], (row[Math.max(0, i - 1)] + row[i] * 2 + row[Math.min(N - 1, i + 1)]) / 4); }
      for (let j = 1; j <= K; j++) for (let i = 0; i < N; i++) { const f = j / K; if (f > 0.22) R[j][i] = Math.max(R[j][i], R[j - 1][i] - 0.012); }
      for (let j = 0; j <= K; j++) { const f = j / K, y = lerp(yTop, yHem, f);
        for (let i = 0; i < N; i++) { const a = A[j][i], d = [Math.sin(a), 0, -Math.cos(a)], side = Math.sin(a) ** 2;
          const hang = Math.pow(f, 1.15) * (SKIRT ? 0.035 : 0.10) * (0.6 + 0.4 * Math.cos(a)), fold = 0.016 * Math.sin(a * 6.0 + f * 2.2 + 0.4) * Math.min(1, f * 3), arm = 0.045 * side * sm(0.12, 0.3, f);      // stands off the upper arms
          const r = R[j][i] + 0.02 + 0.012 * (1 - sm(0.1, 0.3, f)) + hang + fold + arm; V.push([d[0] * r, y - 0.025 * Math.abs(Math.sin(a * 2)) * f, zc + d[2] * r]); } }
      for (let j = 0; j < K; j++) for (let i = 0; i < N - 1; i++) { const a = j * N + i, b = a + 1, c = a + N + 1, e = a + N; F.push(a, b, c, a, c, e); }
      // weights: the surface underneath above the hips, the hips alone below; arms and legs never
      const W = V.map(v => { const mp = new Map(); let bd = 1e9, bt = null, bb = null; for (const t of T) { const [q, bc] = closest(v, t.a, t.b, t.c), dd = len(sub(v, q)); if (dd < bd) { bd = dd; bt = t; bb = bc; } }
        for (let k = 0; k < 3; k++) for (const [jn, w] of bt.w[k]) { if (ARM.test(J[jn]) || (!SKIRT && LEG.test(J[jn])) || J[jn] === 'neutral_bone') continue; mp.set(jn, (mp.get(jn) || 0) + w * bb[k]); }
        let tot = 0; for (const w of mp.values()) tot += w; const low = SKIRT ? 0 : 1 - sm(yHip - 0.12, yHip + 0.1, v[1]);      // over a skirt the cloak lies on the skirt and goes where it goes; over hose it hangs from the hips if (tot < 1e-4) { mp.clear(); mp.set(PEL, 1); return mp; }
        for (const [k, w] of mp) mp.set(k, w / tot * (1 - low)); mp.set(PEL, (mp.get(PEL) || 0) + low); return mp; });
      // normals, outward
      const Nn = V.map(() => [0, 0, 0]); for (let t = 0; t < F.length; t += 3) { const n = cross(sub(V[F[t + 1]], V[F[t]]), sub(V[F[t + 2]], V[F[t]])); for (const k of [F[t], F[t + 1], F[t + 2]]) { Nn[k][0] += n[0]; Nn[k][1] += n[1]; Nn[k][2] += n[2]; } }
      let outw = 0; V.forEach((v, i) => { outw += Nn[i][0] * v[0] + Nn[i][2] * (v[2] - zc); }); const flip = outw < 0;
      if (flip) for (let t = 0; t < F.length; t += 3) { const s = F[t + 1]; F[t + 1] = F[t + 2]; F[t + 2] = s; }
      Nn.forEach(n => { const l = (len(n) || 1) * (flip ? -1 : 1); n[0] /= l; n[1] /= l; n[2] /= l; });
      return { V, F, W, Nn }; };
    for (const x of cloaks) { const lv = (/@(\w+)$/.exec(x.name) || [])[1], [N, K] = !lv ? [16, 11] : lv === 'mid' ? [9, 7] : [8, 6], g = build(N, K), buf = x.p.getAttribute('POSITION').getBuffer(), n = g.V.length;
      const cA = x.p.getAttribute('COLOR_0'), cb = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { const hem = Math.floor(i / N) === K || i % N === 0 || i % N === N - 1; cb[i * 4] = 235; cb[i * 4 + 1] = Math.round(255 * (1 - 0.35 * sm(0.55, 1, Math.floor(i / N) / K))); cb[i * 4 + 2] = hem ? 255 : 0; cb[i * 4 + 3] = Math.round(col[3] * 255); }      // R occlusion, G cleaner at the top than the hem, B the trim band on the open edges, A the colour slot
      for (const s of x.p.listSemantics()) if (!/^(POSITION|NORMAL|JOINTS_0|WEIGHTS_0|COLOR_0)$/.test(s)) x.p.setAttribute(s, null);
      x.p.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(g.V.flat())).setBuffer(buf));
      x.p.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(Int8Array.from(g.Nn.flat().map(v => Math.round(v * 127)))).setNormalized(true).setBuffer(buf));
      if (cA) x.p.setAttribute('COLOR_0', doc.createAccessor().setType('VEC4').setArray(cb).setNormalized(true).setBuffer(buf));
      x.p.setIndices(doc.createAccessor().setType('SCALAR').setArray(Uint16Array.from(g.F)).setBuffer(buf)); setW(x, g.W); log.push(x.name + ' ' + g.F.length / 3); }
  }

  // ── 3. skin under the kirtle ──
  // gen.py removes the body a stock garment covers; under the kirtle shell and its sleeves most of it was left, and it shows through
  // as patches of skin on the chest, the shoulders and a bent elbow. A body triangle goes when all three corners lie under the
  // shell (within 8 cm of it, not more than 5 cm outside, and not beyond one of its openings: neck, cuffs, hem). Legs stay.
  { const shell = prims.filter(x => /^w_(kirtle|sleeve[LR])$/.test(x.name)), S = [];
    if (shell.length) {
      const key = v => Math.round(v[0] * 5000) + ',' + Math.round(v[1] * 5000) + ',' + Math.round(v[2] * 5000);
      for (const x of shell) { const pos = x.p.getAttribute('POSITION'), ix = x.p.getIndices().getArray(), P = [], cnt = new Map(), ek = (a, b) => { const ka = key(P[a]), kb = key(P[b]); return ka < kb ? ka + '|' + kb : kb + '|' + ka; };
        for (let i = 0; i < pos.getCount(); i++) P.push(pos.getElement(i, []));
        for (let t = 0; t < ix.length; t += 3) for (const [a, b] of [[ix[t], ix[t + 1]], [ix[t + 1], ix[t + 2]], [ix[t + 2], ix[t]]]) cnt.set(ek(a, b), (cnt.get(ek(a, b)) || 0) + 1);
        for (let t = 0; t < ix.length; t += 3) { const a = ix[t], b = ix[t + 1], c = ix[t + 2], n = cross(sub(P[b], P[a]), sub(P[c], P[a])), l = len(n) || 1; S.push({ m: x, a: P[a], b: P[b], c: P[c], n: [n[0] / l, n[1] / l, n[2] / l], open: [cnt.get(ek(b, c)) === 1, cnt.get(ek(c, a)) === 1, cnt.get(ek(a, b)) === 1] }); } }
      // which way is out: the shell's normals should point away from the spine
      { let o = 0; for (const t of S) o += t.n[0] * (t.a[0]) * (Math.abs(t.a[0]) < 0.15 ? 1 : 0) + t.n[2] * (t.a[2] - bone.pelvis[2]) * (Math.abs(t.a[0]) < 0.15 ? 1 : 0); if (o < 0) for (const t of S) t.n = t.n.map(v => -v); }
      // an edge is an opening only if no other piece of the shell lies against it (the armhole is where sleeve meets kirtle, not an opening)
      for (const t of S) for (let k = 0; k < 3; k++) if (t.open[k]) { const p = [t.a, t.b, t.c], u = p[(k + 1) % 3], v = p[(k + 2) % 3], mid = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2]; for (const q of S) if (q.m !== t.m && len(sub(closest(mid, q.a, q.b, q.c)[0], mid)) < 0.03) { t.open[k] = false; break; } }
      const covered = v => { let bd = 1e9, bt = null, bb = null, bq = null; for (const t of S) { const [q, bc] = closest(v, t.a, t.b, t.c), d = len(sub(v, q)); if (d < bd) { bd = d; bt = t; bb = bc; bq = q; } }
        if (bd > 0.08) return false; for (let k = 0; k < 3; k++) if (bb[k] < 1e-6 && bt.open[k]) return false;
        return dot(sub(v, bq), bt.n) < 0.05; };
      for (const x of prims) { if (!/^base(@|$)/.test(x.name)) continue; const pos = x.p.getAttribute('POSITION'), ia = x.p.getIndices(), ix = ia.getArray(), n = pos.getCount(), cov = new Uint8Array(n);
        for (let i = 0; i < n; i++) { const [e, g] = wOf(x, i); let leg = 0, keep = 0; for (let k = 0; k < 4; k++) { if (LEG.test(J[e[k]])) leg += g[k]; if (/^(head|hand|thumb|index|middle|ring|pinky)/.test(J[e[k]])) keep += g[k]; } cov[i] = leg < 0.5 && keep < 0.5 && covered(pos.getElement(i, [])) ? 1 : 0; }
        const out = []; for (let t = 0; t < ix.length; t += 3) if (!(cov[ix[t]] && cov[ix[t + 1]] && cov[ix[t + 2]])) out.push(ix[t], ix[t + 1], ix[t + 2]);
        if (out.length < ix.length) { x.p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new ix.constructor(out)).setBuffer(ia.getBuffer())); log.push(x.name + ' under the kirtle -' + (ix.length - out.length) / 3); } } } }

  // ── 4. what lies on the kirtle moves with the kirtle ──
  // Apron, straps, belt and pouch took their weights from the nearest body vertices, the kirtle from its own rule: seated, the skirt
  // went one way and the apron on it another (a crumpled pale sheet on the lap, the belt a lump behind). Each of their vertices now
  // carries the weights of the point of the kirtle it lies on.
  { const kir = prims.filter(x => x.name === 'w_kirtle'), K = [];
    for (const x of kir) { const pos = x.p.getAttribute('POSITION'), ix = x.p.getIndices().getArray(), P = [], W = [];
      for (let i = 0; i < pos.getCount(); i++) { P.push(pos.getElement(i, [])); const [e, g] = wOf(x, i), mp = new Map(); for (let k = 0; k < 4; k++) if (g[k] > 0 && e[k] !== NI) mp.set(e[k], (mp.get(e[k]) || 0) + g[k]); W.push(mp); }
      for (let t = 0; t < ix.length; t += 3) K.push({ a: P[ix[t]], b: P[ix[t + 1]], c: P[ix[t + 2]], w: [W[ix[t]], W[ix[t + 1]], W[ix[t + 2]]] }); }
    if (K.length) for (const x of prims) { if (!/^w_(apron|straps|belt|pouch)/.test(x.name)) continue; const pos = x.p.getAttribute('POSITION'), list = [];
      for (let i = 0; i < pos.getCount(); i++) { const v = pos.getElement(i, []), mp = new Map(); let bd = 1e9, bt = null, bb = null; for (const t of K) { const [q, bc] = closest(v, t.a, t.b, t.c), d = len(sub(v, q)); if (d < bd) { bd = d; bt = t; bb = bc; } }
        for (let k = 0; k < 3; k++) for (const [jn, w] of bt.w[k]) mp.set(jn, (mp.get(jn) || 0) + w * bb[k]); list.push(mp); }
      setW(x, list);
      // and lies outside it: corners, edge middles and face centres at least 14 mm clear of the kirtle (a coarse apron cut through the folds of the skirt and showed as holes)
      if (/^w_(apron|straps)/.test(x.name)) { const ix = x.p.getIndices().getArray(), n = pos.getCount(), P = []; for (let i = 0; i < n; i++) P.push(pos.getElement(i, []));
        const KN = K.map(t => { const nn = cross(sub(t.b, t.a), sub(t.c, t.a)), l = len(nn) || 1; return [nn[0] / l, nn[1] / l, nn[2] / l]; }); let o = 0; K.forEach((t, k) => { if (Math.abs(t.a[0]) < 0.15) o += KN[k][0] * t.a[0] + KN[k][2] * (t.a[2] - bone.pelvis[2]); }); const sg = o < 0 ? -1 : 1;
        const clear = v => { let bd = 1e9, bi = 0, bq = null; K.forEach((t, k) => { const q = closest(v, t.a, t.b, t.c)[0], d = len(sub(v, q)); if (d < bd) { bd = d; bi = k; bq = q; } }); const nn = KN[bi].map(c => c * sg); return [dot(sub(v, bq), nn), nn, bd]; };
        let moved = 0; for (let pass = 0; pass < 5; pass++) { const push = P.map(() => [0, 0, 0, 0]);
          const sample = (vs) => { const v = [0, 1, 2].map(c => vs.reduce((s2, i) => s2 + P[i][c], 0) / vs.length), [d, nn, bd] = clear(v); if (bd < 0.06 && d < 0.014) for (const i of vs) { const k = 0.014 - d; if (k > push[i][3]) push[i] = [nn[0] * k, nn[1] * k, nn[2] * k, k]; } };
          for (let i = 0; i < n; i++) sample([i]); for (let t = 0; t < ix.length; t += 3) { const A = ix[t], B = ix[t + 1], C = ix[t + 2]; sample([A, B]); sample([B, C]); sample([C, A]); sample([A, B, C]); }
          let any = 0; push.forEach((q, i) => { if (q[3] > 1e-4) { P[i][0] += q[0]; P[i][1] += q[1]; P[i][2] += q[2]; any++; } }); moved += any; if (!any) break; }
        if (moved) x.p.setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(P.flat())).setBuffer(pos.getBuffer())); }
      log.push(x.name + ' on the kirtle'); } }
  for (const a of root.listAccessors()) if (a.listParents().every(p => p.propertyType === 'Root')) a.dispose();
  const before = fs.statSync(file).size; await io.write(file, doc);
  console.log(file.split('/').pop(), (before / 1024 | 0) + 'KB >', (fs.statSync(file).size / 1024 | 0) + 'KB', log.join(', '));
}
