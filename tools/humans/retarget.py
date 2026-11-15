#!/usr/bin/env python3
"""Retargets clips from the Quaternius Universal Animation Library (CC0) onto the MakeHuman 'game_engine' skeleton.

usage: retarget.py <target character.glb> <out clips.glb> <src.glb>:<Clip>[=<NewName>][,<Clip>...] [<src2.glb>:...]

Everything happens in world space, so the two rigs may differ in bone roll, parenting details and rest pose:
  torso bones copy the source's world-space change from its rest pose;
  limb bones are additionally aimed the way the source limb points (so a T-pose source and an A-pose target agree);
  the pelvis position is scaled by the ratio of hip heights.
Output: a GLB with the target's joint nodes (same names, rest pose) and one animation per clip, sampled at 30 fps.
"""
import sys, json, struct, numpy as np

FPS = 30.0
# target bone -> source bone names (first that exists wins)
def src_names(t):
    side = t[-2:] if t.endswith(('_l', '_r')) else ''
    S = side.upper().replace('_', '.')            # '.L'
    base = t[:-2] if side else t
    m = {'pelvis': ['pelvis', 'DEF-hips'], 'spine_01': ['spine_01', 'DEF-spine.001'], 'spine_02': ['spine_02', 'DEF-spine.002'], 'spine_03': ['spine_03', 'DEF-spine.003'],
         'neck_01': ['neck_01', 'DEF-neck'], 'head': ['Head', 'head', 'DEF-head'],
         'clavicle': ['clavicle' + side, 'DEF-shoulder' + S], 'upperarm': ['upperarm' + side, 'DEF-upper_arm' + S], 'lowerarm': ['lowerarm' + side, 'DEF-forearm' + S], 'hand': ['hand' + side, 'DEF-hand' + S],
         'thigh': ['thigh' + side, 'DEF-thigh' + S], 'calf': ['calf' + side, 'DEF-shin' + S], 'foot': ['foot' + side, 'DEF-foot' + S], 'ball': ['ball' + side, 'DEF-toe' + S]}
    if base in m: return m[base]
    for f in ('index', 'middle', 'ring', 'pinky', 'thumb'):
        if base.startswith(f + '_0'):
            k = base[-1]; return [base + side, ('DEF-thumb.0%s%s' if f == 'thumb' else 'DEF-f_' + f + '.0%s%s') % (k, S)]
    return [t]
AIM_CHILD = {'upperarm': 'lowerarm', 'lowerarm': 'hand', 'hand': 'middle_01', 'thigh': 'calf', 'calf': 'foot', 'foot': 'ball',
             'index_01': 'index_02', 'index_02': 'index_03', 'middle_01': 'middle_02', 'middle_02': 'middle_03', 'ring_01': 'ring_02', 'ring_02': 'ring_03',
             'pinky_01': 'pinky_02', 'pinky_02': 'pinky_03', 'thumb_01': 'thumb_02', 'thumb_02': 'thumb_03'}
AIM_FROM_PARENT = {'index_03', 'middle_03', 'ring_03', 'pinky_03', 'thumb_03'}

# ── quaternions (x, y, z, w), arrays of shape (..., 4) ──
def qmul(a, b):
    ax, ay, az, aw = np.moveaxis(a, -1, 0); bx, by, bz, bw = np.moveaxis(b, -1, 0)
    return np.stack([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz], -1)
def qinv(a): return a * np.array([-1, -1, -1, 1.0])
def qrot(q, v): return qmul(qmul(q, np.concatenate([v, np.zeros(v.shape[:-1] + (1,))], -1)), qinv(q))[..., :3]
def qnorm(q): return q / np.linalg.norm(q, axis=-1, keepdims=True)
def qbetween(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); c = np.cross(a, b); d = float(np.dot(a, b))
    if d < -0.999999: ax = np.cross(a, [1, 0, 0]); ax = ax if np.linalg.norm(ax) > 1e-6 else np.cross(a, [0, 1, 0]); ax /= np.linalg.norm(ax); return np.array([ax[0], ax[1], ax[2], 0.0])
    return qnorm(np.array([c[0], c[1], c[2], 1.0 + d]))
def qfrom_m(m):
    m = np.asarray(m, float); t = m[0, 0] + m[1, 1] + m[2, 2]
    if t > 0: s = np.sqrt(t + 1) * 2; q = [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, 0.25 * s]
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]: s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; q = [0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s, (m[2, 1] - m[1, 2]) / s]
    elif m[1, 1] > m[2, 2]: s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; q = [(m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s, (m[0, 2] - m[2, 0]) / s]
    else: s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; q = [(m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s, (m[1, 0] - m[0, 1]) / s]
    return qnorm(np.array(q))
def trs(t, r, s):
    x, y, z, w = r; m = np.eye(4)
    m[:3, :3] = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]) * np.asarray(s)[None, :]
    m[:3, 3] = t; return m
def rot_of(m):
    r = m[:3, :3] / np.linalg.norm(m[:3, :3], axis=0, keepdims=True); return qfrom_m(r)

# ── GLB reading ──
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
class GLB:
    def __init__(self, path):
        b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]
        self.j = json.loads(b[20:20 + n]); self.bin = b[20 + n + 8:]
        self.nodes = self.j['nodes']; self.parent = {}
        for i, nd in enumerate(self.nodes):
            for c in nd.get('children', []): self.parent[c] = i
        self.byname = {nd.get('name'): i for i, nd in enumerate(self.nodes)}
        self.order = []
        def walk(i):
            self.order.append(i)
            for c in self.nodes[i].get('children', []): walk(c)
        for i in range(len(self.nodes)):
            if i not in self.parent: walk(i)
    def acc(self, k):
        a = self.j['accessors'][k]; v = self.j['bufferViews'][a['bufferView']]; dt = CT[a['componentType']]; nc = NC[a['type']]
        off = v.get('byteOffset', 0) + a.get('byteOffset', 0); stride = v.get('byteStride')
        if stride and stride != np.dtype(dt).itemsize * nc:
            raw = np.frombuffer(self.bin, np.uint8, stride * a['count'], off).reshape(a['count'], stride)[:, :np.dtype(dt).itemsize * nc]
            out = np.frombuffer(raw.tobytes(), dt).reshape(a['count'], nc)
        else: out = np.frombuffer(self.bin, dt, a['count'] * nc, off).reshape(a['count'], nc)
        out = out.astype(np.float64)
        if a.get('normalized'): out = np.maximum(out / {np.int8: 127, np.uint8: 255, np.int16: 32767, np.uint16: 65535}[dt], -1)
        return out
    def rest(self, i):
        nd = self.nodes[i]
        if 'matrix' in nd: m = np.array(nd['matrix'], float).reshape(4, 4).T; return m[:3, 3], rot_of(m), np.linalg.norm(m[:3, :3], axis=0)
        return np.array(nd.get('translation', [0, 0, 0]), float), np.array(nd.get('rotation', [0, 0, 0, 1]), float), np.array(nd.get('scale', [1, 1, 1]), float)
    def world(self, local):          # local: {node: (t, r, s)} overrides -> world matrices for all nodes
        W = [None] * len(self.nodes)
        for i in self.order:
            t, r, s = local.get(i) or self.rest(i); m = trs(t, r, s)
            W[i] = W[self.parent[i]] @ m if i in self.parent else m
        return W

def sample(times, vals, t, interp, rot):
    if interp == 'CUBICSPLINE': vals = vals.reshape(len(times), 3, -1)[:, 1]
    if t <= times[0]: return vals[0]
    if t >= times[-1]: return vals[-1]
    k = int(np.searchsorted(times, t, 'right')) - 1; a, b = vals[k], vals[k + 1]
    if interp == 'STEP': return a
    f = (t - times[k]) / (times[k + 1] - times[k])
    if rot:
        if np.dot(a, b) < 0: b = -b
        return qnorm(a + (b - a) * f)
    return a + (b - a) * f

def main():
    tgt = GLB(sys.argv[1]); out_path = sys.argv[2]
    skin = tgt.j['skins'][0]; tj = skin['joints']; tname = [tgt.nodes[i]['name'] for i in tj]
    Wt0 = tgt.world({}); Rt0 = {i: rot_of(Wt0[i]) for i in range(len(tgt.nodes))}; Pt0 = {i: Wt0[i][:3, 3].copy() for i in range(len(tgt.nodes))}
    tid = {n: i for n, i in zip(tname, tj)}
    assert Pt0[tid['hand_l']][0] > 0, 'target must face +Z (left hand at +X)'
    tracks_out = []                                             # (clip name, times, {node: rotations}, pelvis translations)
    for spec in sys.argv[3:]:
        path, clipsel = spec.rsplit(':', 1); src = GLB(path)
        Ws0 = src.world({}); Rs0 = {i: rot_of(Ws0[i]) for i in range(len(src.nodes))}; Ps0 = {i: Ws0[i][:3, 3].copy() for i in range(len(src.nodes))}
        smap = {}
        for n in tname:
            for c in src_names(n):
                if c in src.byname: smap[n] = src.byname[c]; break
        missing = [n for n in tname if n not in smap and n != 'Root']
        if missing: print('  unmapped in', path.split('/')[-1], missing)
        flip = Ps0[smap['hand_l']][0] < 0                        # source faces -Z: turn everything half a turn about Y
        assert not flip, 'source faces -Z; not handled'
        # aim corrections (target rest direction -> source rest direction) for limb bones
        A = {}
        for n in tname:
            base = n[:-2] if n.endswith(('_l', '_r')) else n; side = n[-2:] if n != base else ''
            if n not in smap: continue
            if base in AIM_CHILD and (AIM_CHILD[base] + side) in tid and (AIM_CHILD[base] + side) in smap:
                c = AIM_CHILD[base] + side
                A[n] = qbetween(Pt0[tid[c]] - Pt0[tid[n]], Ps0[smap[c]] - Ps0[smap[n]])
            elif base in AIM_FROM_PARENT:
                p = tgt.nodes[tgt.parent[tid[n]]]['name']
                if p in smap: A[n] = qbetween(Pt0[tid[n]] - Pt0[tid[p]], Ps0[smap[n]] - Ps0[smap[p]])
        kscale = Pt0[tid['pelvis']][1] / Ps0[smap['pelvis']][1]
        anims = {a['name']: a for a in src.j['animations']}
        for item in clipsel.split(','):
            cname, _, newname = item.partition('='); newname = newname or cname
            pose_only = cname.endswith('@0'); cname = cname[:-2] if pose_only else cname
            if cname not in anims: print('  no clip', cname, 'in', path.split('/')[-1]); continue
            a = anims[cname]; chans = {}
            dur = 0.0
            for ch in a['channels']:
                sm = a['samplers'][ch['sampler']]; tm = src.acc(sm['input'])[:, 0]; vl = src.acc(sm['output'])
                chans[(ch['target']['node'], ch['target']['path'])] = (tm, vl, sm.get('interpolation', 'LINEAR')); dur = max(dur, tm[-1])
            nf = 2 if pose_only else max(2, int(round(dur * FPS)) + 1)
            times = np.linspace(0, 1.0 if pose_only else dur, nf)
            rots = {n: np.zeros((nf, 4)) for n in tname if n in smap}; ptr = np.zeros((nf, 3))
            for f in range(nf):
                t = 0.0 if pose_only else times[f]; local = {}
                for i in range(len(src.nodes)):
                    T, R, S = src.rest(i)
                    for path_, key in (('translation', 0), ('rotation', 1), ('scale', 2)):
                        c = chans.get((i, path_))
                        if c is not None:
                            v = sample(c[0], c[1], t, c[2], path_ == 'rotation')
                            if key == 0: T = v
                            elif key == 1: R = v
                            else: S = v
                    local[i] = (T, R, S)
                Ws = src.world(local)
                Rw = dict(Rt0)                                    # target world rotations this frame (unmapped bones keep rest)
                for n in tname:                                   # joints are listed parents first by Blender's exporter
                    if n not in smap: continue
                    d = qmul(rot_of(Ws[smap[n]]), qinv(Rs0[smap[n]]))
                    Rw[tid[n]] = qnorm(qmul(qmul(d, A[n]) if n in A else d, Rt0[tid[n]]))
                for n in tname:
                    if n not in smap: continue
                    i = tid[n]; p = tgt.parent.get(i)
                    rots[n][f] = qnorm(qmul(qinv(Rw[p]), Rw[i])) if p is not None else Rw[i]
                # pelvis position: source offset from its rest, scaled to the target's leg length, expressed in the pelvis parent's frame
                wp = Pt0[tid['pelvis']] + (Ws[smap['pelvis']][:3, 3] - Ps0[smap['pelvis']]) * kscale
                pm = Wt0[tgt.parent[tid['pelvis']]]
                ptr[f] = (np.linalg.inv(pm) @ np.append(wp, 1))[:3]
            for n in rots:                                       # keep quaternion sign continuous
                for f in range(1, nf):
                    if np.dot(rots[n][f], rots[n][f - 1]) < 0: rots[n][f] = -rots[n][f]
            tracks_out.append((newname, times, rots, ptr)); print('  %-26s %5.2fs %4d frames' % (newname, times[-1], nf))
    # ── write: joint hierarchy (rest pose, no mesh) + animations ──
    keep = sorted(set(tj) | {tgt.parent[i] for i in tj if i in tgt.parent})
    remap = {o: k for k, o in enumerate(keep)}; nodes = []
    for o in keep:
        nd = tgt.nodes[o]; T, R, S = tgt.rest(o)
        e = {'name': nd['name'], 'translation': [float(x) for x in T], 'rotation': [float(x) for x in R]}
        ch = [remap[c] for c in nd.get('children', []) if c in remap]
        if ch: e['children'] = ch
        nodes.append(e)
    roots = [remap[o] for o in keep if tgt.parent.get(o) not in remap]
    blob = bytearray(); views = []; accs = []
    def add(arr, typ):
        arr = np.ascontiguousarray(arr, np.float32)
        while len(blob) % 4: blob.append(0)
        views.append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': arr.nbytes}); blob.extend(arr.tobytes())
        a = {'bufferView': len(views) - 1, 'componentType': 5126, 'count': int(arr.shape[0]), 'type': typ}
        if typ == 'SCALAR': a['min'] = [float(arr.min())]; a['max'] = [float(arr.max())]
        accs.append(a); return len(accs) - 1
    animations = []
    for name, times, rots, ptr in tracks_out:
        ti = add(times, 'SCALAR'); samplers = []; channels = []
        for n, r in rots.items():
            samplers.append({'input': ti, 'output': add(r, 'VEC4'), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': remap[tid[n]], 'path': 'rotation'}})
        samplers.append({'input': ti, 'output': add(ptr, 'VEC3'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': remap[tid['pelvis']], 'path': 'translation'}})
        animations.append({'name': name, 'samplers': samplers, 'channels': channels})
    j = {'asset': {'version': '2.0', 'generator': 'brackenfell retarget.py'}, 'scene': 0, 'scenes': [{'nodes': roots}], 'nodes': nodes, 'animations': animations,
         'buffers': [{'byteLength': len(blob)}], 'bufferViews': views, 'accessors': accs,
         'extras': {'hipHeight': float(Pt0[tid['pelvis']][1]), 'fps': FPS}}
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    while len(blob) % 4: blob.append(0)
    with open(out_path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob))); f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(blob), 0x004E4942)); f.write(bytes(blob))
    print('wrote', out_path, len(animations), 'clips', round((len(js) + len(blob)) / 1e6, 2), 'MB')

main()
