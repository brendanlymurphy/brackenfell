#!/usr/bin/env python3
"""Step 1 of the tree builder. Poly Haven trees model every needle and leaf (millions of triangles). This turns one tree into a
"billboard cloud": the foliage is grouped into clusters along the branches, each cluster becomes three crossed cards, and the real
foliage is later rendered onto those cards (tree_bake.html) so the cards carry the scan's own needles.
Writes into <bake dir>/<name>/: vertex buffers for the bake, meta.json, and tree.gltf (trunk + cards, atlas referenced as atlas.png).
usage: tree_prep.py <download dir> <poly haven id> <node name contains> <out name> <bake dir> [near clusters] [far clusters]"""
import sys, os, json, shutil, numpy as np
import scipy.sparse as sp, scipy.sparse.csgraph as cg
from scipy.cluster.vq import kmeans2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gltfio import Gltf
DL, pid, nodesel, name, BAKE = sys.argv[1:6]
KN = int(sys.argv[6]) if len(sys.argv) > 6 else 150; KF = int(sys.argv[7]) if len(sys.argv) > 7 else 14
ATLAS = 4096                                    # bake resolution (the page halves it)
out = os.path.join(BAKE, name); os.makedirs(out, exist_ok=True)
g = Gltf(os.path.join(DL, pid, pid + '.gltf'))
is_fol = lambda m: m.get('alphaMode') in ('BLEND', 'MASK') or any(k in m['name'].lower() for k in ('twig', 'leav', 'needle'))
fol, wood = [], []
for nname, mat, P, N, UV, I in g.meshes(nodesel):
    if UV is None:                              # a trunk without texture coordinates: wrap the bark around it
        UV = np.stack([np.arctan2(P[:, 2] - P[:, 2].mean(), P[:, 0] - P[:, 0].mean()) / np.pi, P[:, 1] / 2.0], 1).astype(np.float32)
    (fol if is_fol(mat) else wood).append((mat, P, N, UV, I))
assert fol, 'no foliage found'
# ── put the tree on the origin: centre of the trunk's foot ──
allwood = np.concatenate([w[1] for w in wood]) if wood else np.concatenate([f[1] for f in fol])
y0 = allwood[:, 1].min(); foot = allwood[allwood[:, 1] < y0 + 0.4]; origin = np.array([foot[:, 0].mean(), y0, foot[:, 2].mean()], np.float32)
# ── foliage as one indexed mesh ──
P = np.concatenate([f[1] for f in fol]) - origin; UV = np.concatenate([f[3] for f in fol]); off = np.cumsum([0] + [len(f[1]) for f in fol])[:-1]
I = np.concatenate([f[4] + o for f, o in zip(fol, off)])
fmat = fol[0][0]
print(name, 'foliage', len(P), 'verts', len(I), 'tris; wood prims', len(wood))
# connected pieces (needles, leaves, twigs) so that no piece is split between two cards
key = np.round(P * 2e4).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel(); T = inv[I]; nn = int(inv.max()) + 1
nc, lab = cg.connected_components(sp.coo_matrix((np.ones(len(T) * 2, np.int8), (np.r_[T[:, 0], T[:, 1]], np.r_[T[:, 1], T[:, 2]])), shape=(nn, nn)), directed=False)
vlab = lab[inv]                                  # piece id per vertex
cen = np.zeros((nc, 3)); cnt = np.bincount(vlab, minlength=nc); np.add.at(cen, vlab, P); cen /= np.maximum(cnt, 1)[:, None]
# crown shape: radius by height, used for soft normals and for darkening the inside
H = P[:, 1].max(); ylo = P[:, 1].min(); rad = np.hypot(P[:, 0], P[:, 2]); nb = 24; bins = np.clip(((P[:, 1] - ylo) / max(H - ylo, 1e-3) * nb).astype(int), 0, nb - 1)
prof = np.array([np.percentile(rad[bins == b], 96) if (bins == b).any() else 0.1 for b in range(nb)]); prof = np.maximum(prof, 0.15)
Rv = prof[bins]; shade = (0.50 + 0.50 * np.clip((rad / Rv - 0.10) / 0.75, 0, 1)).astype(np.float32)
Rmax = float(prof.max()); yc = ylo + 0.35 * (H - ylo)
def soft_normal(q):
    n = np.stack([q[:, 0], (q[:, 1] - yc) * (Rmax / max(H - yc, 1e-3)) * 0.8 + 0.30 * Rmax, q[:, 2]], 1); return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-6)
up = np.array([0, 1.0, 0])
def cards_for(K, seed):
    rs = np.random.RandomState(seed); w = cen * np.array([1, 1.4, 1])           # prefer flat tiers over tall blobs
    _, cl = kmeans2(w, min(K, max(2, nc // 4)), minit='++', seed=rs, iter=12)
    vcl = cl[vlab]; cards = []
    for c in np.unique(cl):
        vs = np.nonzero(vcl == c)[0]
        if len(vs) < 3: continue
        q = P[vs].astype(np.float64); m = q.mean(0); d = q - m
        e1 = np.linalg.svd(d[:: max(1, len(d) // 4000)], full_matrices=False)[2][0]
        r = np.array([m[0], 0, m[2]]); rl = np.linalg.norm(r)
        if abs(e1[1]) > 0.85: e1 = r / rl if rl > 0.2 else np.array([1.0, 0, 0])
        if rl > 0.2 and np.dot(e1, r) < 0: e1 = -e1
        e2 = np.cross(up, e1); e2 /= np.linalg.norm(e2); e3 = np.cross(e1, e2)
        for ea, eb, en in ((e2, e1, e3), (e1, e3, e2), (e2, e3, e1)):
            a = d @ ea; b = d @ eb; n = d @ en
            lo = (np.percentile(a, 0.5), np.percentile(b, 0.5)); hi = (np.percentile(a, 99.5), np.percentile(b, 99.5))
            if hi[0] - lo[0] < 0.06 or hi[1] - lo[1] < 0.06: continue
            cards.append(dict(vs=vs, m=m, ea=ea, eb=eb, en=en, a0=lo[0], a1=hi[0], b0=lo[1], b1=hi[1], n0=n.min(), n1=n.max(), a=a, b=b, n=n))
    return cards
levels = [('near', cards_for(KN, 1)), ('far', cards_for(KF, 2))]
# ── atlas: cells proportional to card size, shelf packed; far cards get a quarter of the pixel density ──
allc = [(c, 1.0 if lv == 'near' else 0.5) for lv, cs in levels for c in cs]
def pack(ppm):
    order = sorted(range(len(allc)), key=lambda i: -(allc[i][0]['b1'] - allc[i][0]['b0']) * allc[i][1]); x = y = rowh = 0; pad = 6
    for i in order:
        c, k = allc[i]; w = max(12, int(round((c['a1'] - c['a0']) * ppm * k))); h = max(12, int(round((c['b1'] - c['b0']) * ppm * k)))
        if x + w + pad > ATLAS: x = 0; y += rowh + pad; rowh = 0
        if y + h + pad > ATLAS: return False
        c['cell'] = (x + pad // 2, y + pad // 2, w, h); x += w + pad; rowh = max(rowh, h)
    return True
area = sum((c['a1'] - c['a0']) * (c['b1'] - c['b0']) * k * k for c, k in allc); ppm = np.sqrt(0.92 * ATLAS * ATLAS / area)
while not pack(ppm): ppm *= 0.97
print('  cards near', len(levels[0][1]), 'far', len(levels[1][1]), 'pixels per metre', round(ppm / 2, 1), '(final atlas)')
# ── bake buffers: one position stream per card type per level (every foliage vertex appears once in each) ──
np.ascontiguousarray(UV, np.float32).tofile(os.path.join(out, 'uv.bin')); shade.tofile(os.path.join(out, 'shade.bin')); np.ascontiguousarray(I, np.uint32).tofile(os.path.join(out, 'idx.bin'))
passes = []
for lv, cs in levels:
    # cards of one level are grouped into streams so that a vertex is used at most once per stream
    streams = {}
    for c in cs:
        key2 = id(c['vs']); k = 0
        while (k, key2) in streams: k += 1
        streams[(k, key2)] = c
    for k in sorted(set(s[0] for s in streams)):
        pos = np.full((len(P), 3), 4.0, np.float32)                       # off-screen unless a card claims the vertex
        for (kk, _), c in streams.items():
            if kk != k: continue
            x, y, w, h = c['cell']; fa = (c['a'] - c['a0']) / (c['a1'] - c['a0']); fb = (c['b'] - c['b0']) / (c['b1'] - c['b0'])
            fa = np.clip(fa, 0, 1); fb = np.clip(fb, 0, 1); vs = c['vs']            # the few stragglers outside the card are pressed onto its edge
            px = x + fa * w; py = y + (1 - fb) * h; z = 1 - 2 * (c['n'] - c['n0']) / max(c['n1'] - c['n0'], 1e-6)     # nearer to the card's front wins
            pos[vs, 0] = px / ATLAS * 2 - 1; pos[vs, 1] = 1 - py / ATLAS * 2; pos[vs, 2] = z * 0.98
        f = f'pos_{lv}_{k}.bin'; pos.tofile(os.path.join(out, f)); passes.append(f)
# textures for the bake
imgs = g.j['images']; tex = g.j['textures']; bi = tex[fmat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
duri = imgs[bi]['uri']; shutil.copy(os.path.join(DL, pid, duri), os.path.join(out, 'diff.jpg'))
mapdir = os.path.join(DL, pid, 'maps'); am = [f for f in os.listdir(mapdir) if 'alpha' in f.lower()] if os.path.isdir(mapdir) else []
assert am, 'alpha map missing for ' + pid
shutil.copy(os.path.join(mapdir, am[0]), os.path.join(out, 'alpha.' + am[0].split('.')[-1]))
json.dump(dict(verts=len(P), tris=len(I), atlas=ATLAS, passes=passes, alpha='alpha.' + am[0].split('.')[-1]), open(os.path.join(out, 'meta.json'), 'w'))
# ── glTF: trunk and branches as they are (simplified later), cards for both levels ──
bufs = []; views = []; accs = []; meshes = []; nodes = []; mats = []; images = []; textures = []
def add(arr, target=None, minmax=False):
    arr = np.ascontiguousarray(arr); o = sum(len(b) for b in bufs); b = arr.tobytes(); b += b'\0' * (-len(b) % 4); bufs.append(b)
    views.append(dict(buffer=0, byteOffset=o, byteLength=arr.nbytes, **({'target': target} if target else {})))
    ct = {np.dtype(np.float32): 5126, np.dtype(np.uint32): 5125, np.dtype(np.uint16): 5123}[arr.dtype]; ty = {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3'}[1 if arr.ndim == 1 else arr.shape[1]]
    a = dict(bufferView=len(views) - 1, componentType=ct, count=len(arr), type=ty)
    if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1
def tex_of(uri, nm):
    shutil.copy(os.path.join(DL, pid, uri), os.path.join(out, nm)); images.append(dict(uri=nm)); textures.append(dict(source=len(images) - 1)); return len(textures) - 1
wood_prims = []
for mat, Pw, Nw, UVw, Iw in wood:
    pm = mat.get('pbrMetallicRoughness', {}); uv = UVw.copy(); xf = pm.get('baseColorTexture', {}).get('extensions', {}).get('KHR_texture_transform')
    if xf: uv = uv * np.array(xf.get('scale', [1, 1]), np.float32) + np.array(xf.get('offset', [0, 0]), np.float32)
    m = dict(name=name + '_' + mat['name'].replace(pid + '_', ''), pbrMetallicRoughness=dict(metallicFactor=0, roughnessFactor=1))
    if 'baseColorTexture' in pm: m['pbrMetallicRoughness']['baseColorTexture'] = dict(index=tex_of(imgs[tex[pm['baseColorTexture']['index']]['source']]['uri'], f'wood{len(mats)}_color.jpg'))
    if 'normalTexture' in mat: m['normalTexture'] = dict(index=tex_of(imgs[tex[mat['normalTexture']['index']]['source']]['uri'], f'wood{len(mats)}_normal.jpg'))
    mats.append(m)
    attrs = dict(POSITION=add((Pw - origin).astype(np.float32), 34962, True), TEXCOORD_0=add(uv.astype(np.float32), 34962))
    if Nw is not None: attrs['NORMAL'] = add(Nw.astype(np.float32), 34962)
    wood_prims.append(dict(attributes=attrs, indices=add(Iw.astype(np.uint32).ravel(), 34963), material=len(mats) - 1))
images.append(dict(uri='atlas.png')); textures.append(dict(source=len(images) - 1))
mats.append(dict(name=name + '_foliage', alphaMode='MASK', alphaCutoff=0.5, doubleSided=False, pbrMetallicRoughness=dict(baseColorTexture=dict(index=len(textures) - 1), metallicFactor=0, roughnessFactor=0.85))); folmat = len(mats) - 1
for lv, cs in levels:
    V = []; U = []; X = []
    for c in cs:
        x, y, w, h = c['cell']; base = len(V)
        for fa, fb in ((0, 0), (1, 0), (1, 1), (0, 1)):
            V.append(c['m'] + c['ea'] * (c['a0'] + fa * (c['a1'] - c['a0'])) + c['eb'] * (c['b0'] + fb * (c['b1'] - c['b0'])) + c['en'] * ((c['n0'] + c['n1']) / 2))
            U.append(((x + fa * w) / ATLAS, (y + (1 - fb) * h) / ATLAS))
        X += [base, base + 1, base + 2, base, base + 2, base + 3, base, base + 2, base + 1, base, base + 3, base + 2]      # both faces, same soft normals
    V = np.array(V, np.float32); prims = [dict(attributes=dict(POSITION=add(V, 34962, True), NORMAL=add(soft_normal(V).astype(np.float32), 34962), TEXCOORD_0=add(np.array(U, np.float32), 34962)), indices=add(np.array(X, np.uint32), 34963), material=folmat)]
    meshes.append(dict(name=name + ('' if lv == 'near' else '_far'), primitives=wood_prims + prims)); nodes.append(dict(name=meshes[-1]['name'], mesh=len(meshes) - 1))
blob = b''.join(bufs); open(os.path.join(out, 'tree.bin'), 'wb').write(blob)
json.dump(dict(asset=dict(version='2.0'), scene=0, scenes=[dict(nodes=list(range(len(nodes))))], nodes=nodes, meshes=meshes, materials=mats, textures=textures, images=images,
               accessors=accs, bufferViews=views, buffers=[dict(uri='tree.bin', byteLength=len(blob))], extras=dict(source=pid, height=float(H), crownRadius=Rmax)), open(os.path.join(out, 'tree.gltf'), 'w'))
print('  height', round(float(H), 2), 'm, crown radius', round(Rmax, 2), 'm, bake passes', len(passes))
