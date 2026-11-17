import os
"""Procedural medieval garments fitted to a MakeHuman body inside Blender (called by gen.py after the body and its clothes are baked).

Everything is generated from the body's own surface, so it sits on the skull / waist / shoulders of THAT body:
  * radial fits: a ray from an axis (the head's centre, the waist) outward to the outermost surface gives a radius per angle; a garment is
    a grid of rings at that radius plus a thickness (caps, hats, coifs, belts, cloaks);
  * panel fits: a grid of rays from the front (aprons, tabards) onto body and clothes, offset by a thickness that grows with distance from the waist.
Pieces are separate meshes named w_<piece> (a wardrobe: 49_chars.js wears the ones a villager's definition asks for), skinned by copying the
weights of the nearest body vertices, all sharing one material ('cloth_trim', no texture). A per-vertex colour carries
R = ambient occlusion, G = cleanliness (1 clean .. 0 mud), B = trim band (cuffs, hems, neckline), A = colour slot of a trim piece / 10.
"""
import bpy, bmesh, math, random
import numpy as np
from mathutils import Vector, kdtree
from mathutils.bvhtree import BVHTree

SLOT = dict(leather=0, hat=1, metal=2, apron=3, cloak=4, tabard=5, linen=6, strap=7, straw=8, wool=9, teeth=10, tongue=11)

def world_verts(o): return [o.matrix_world @ v.co for v in o.data.vertices]

def bvh_of(objs):
    vs, ps = [], []
    for o in objs:
        base = len(vs); mw = o.matrix_world
        vs += [mw @ v.co for v in o.data.vertices]; ps += [tuple(base + i for i in p.vertices) for p in o.data.polygons]
    return BVHTree.FromPolygons(vs, ps)

class Fit:
    """Holds what garments need to know about one body."""
    def __init__(self, rig, body, clothes, hair, eyes):
        self.rig, self.body, self.clothes, self.hair, self.eyes = rig, body, clothes, hair, eyes
        B = rig.data.bones; mw = rig.matrix_world
        self.bone = lambda n, tail=False: mw @ (B[n].tail_local if tail else B[n].head_local)
        self.head_c = self.bone('head') + Vector((0, 0, 0.075))             # centre of the skull, a little above the head joint
        self._build()

    def _build(self):
        rig, body, clothes, hair = self.rig, self.body, self.clothes, self.hair
        self.bvh_head = bvh_of([o for o in (body, hair) if o])
        self.bvh_all = bvh_of([body] + list(clothes) + ([hair] if hair else []))
        self.bvh_cloth = bvh_of(list(clothes)) if clothes else self.bvh_all; self.bvh_body = bvh_of([body])
        # the trunk without the arms (an A-posed arm would otherwise count as part of the torso)
        vs, ps = [], []
        for o in [body] + list(clothes):
            gi = {g.index: g.name for g in o.vertex_groups}; base = len(vs); mw = o.matrix_world
            armw = []
            for v in o.data.vertices:
                aw = sum(g.weight for g in v.groups if g.group in gi and gi[g.group].startswith(('upperarm_', 'lowerarm_', 'hand_', 'thumb', 'index', 'middle', 'ring', 'pinky')))
                armw.append(aw)
            vs += [mw @ v.co for v in o.data.vertices]
            ps += [tuple(base + i for i in p.vertices) for p in o.data.polygons if sum(armw[i] for i in p.vertices) / len(p.vertices) < 0.45]
        self.bvh_torso = BVHTree.FromPolygons(vs, ps)
        kd = kdtree.KDTree(sum(len(o.data.vertices) for o in [body] + list(clothes))); self.src = []
        for o in [body] + list(clothes):
            gi = {g.index: g.name for g in o.vertex_groups}
            for v in o.data.vertices:
                self.src.append({gi[g.group]: g.weight for g in v.groups if g.group in gi})
                kd.insert(o.matrix_world @ v.co, len(self.src) - 1)
        kd.balance(); self.kd = kd

    def add_clothes(self, objs):
        """Garments built so far count as clothing for the ones built after (an apron lies outside a kirtle, not inside it)."""
        self.clothes = list(self.clothes) + list(objs); self._build()

    def outer(self, origin, d, bvh=None, far=0.6):
        """Distance from origin along unit direction d to the OUTERMOST surface (casting inward from far away)."""
        bvh = bvh or self.bvh_all
        h = bvh.ray_cast(origin + d * far, -d, far + 0.01)
        return (far - h[3]) if h[0] is not None else None

def hash01(*a):
    return (math.sin(sum(a[i] * (12.9898 + 78.233 * i) for i in range(len(a))) * 43758.5453) % 1.0 + 1.0) % 1.0

def new_mesh(name, verts, faces, fit, slot, mat, colors=None, group_override=None):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces]); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat)
    # skin weights: nearest source vertices (inverse distance, four of them, merged)
    for v_i, v in enumerate(me.vertices):
        w = {}
        for (co, idx, dist) in fit.kd.find_n(Vector(v.co), 4):
            k = 1.0 / (dist + 0.01)
            for bn, bw in fit.src[idx].items(): w[bn] = w.get(bn, 0) + bw * k
        if group_override: w = {group_override: 1.0}
        top = sorted(w.items(), key=lambda t: -t[1])[:4]; tot = sum(x[1] for x in top) or 1
        for bn, bw in top:
            g = o.vertex_groups.get(bn) or o.vertex_groups.new(name=bn); g.add([v_i], bw / tot, 'REPLACE')
    mod = o.modifiers.new('Armature', 'ARMATURE'); mod.object = fit.rig; o.parent = fit.rig
    # vertex colour: AO, cleanliness, trim band, slot
    ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    for i, v in enumerate(me.vertices):
        c = colors[i] if colors else (1, 1, 1, slot / 12.0); ca.data[i].color = (c[0], c[1], c[2], c[3] if len(c) > 3 else slot / 12.0)
    return o

# ───────────────────────── grids ─────────────────────────
def grid_faces(nu, nv, wrap_u=False, flip=False):
    """Quad grid of nu columns by nv rows of vertices (row-major: v * nu + u) as triangles."""
    F = []
    cols = nu if wrap_u else nu - 1
    for j in range(nv - 1):
        for i in range(cols):
            a = j * nu + i; b = j * nu + (i + 1) % nu; c = (j + 1) * nu + (i + 1) % nu; d = (j + 1) * nu + i
            F += ([(a, c, b), (a, d, c)] if not flip else [(a, b, c), (a, c, d)])
    return F

def blur(a, wrap_u=True, it=1):
    a = np.array(a, float)
    for _ in range(it):
        p = np.pad(a, ((1, 1), (0, 0)), mode='edge'); q = np.roll(a, 1, axis=1) if wrap_u else a
        a = (a * 2 + np.roll(a, 1, 1) + np.roll(a, -1, 1) + p[:-2] + p[2:]) / 6.0
    return a

def sph(theta, alpha):
    """Direction: theta 0 = front (-Y), growing toward +X (the person's left); alpha = elevation above horizontal."""
    return Vector((math.sin(theta) * math.cos(alpha), -math.cos(theta) * math.cos(alpha), math.sin(alpha)))

# ───────────────────────── caps and hats on the skull ─────────────────────────
HEAD = {   # style: (front, side, back elevation of the lower edge in degrees; face opening half-angle; thickness m; slot)
    'cap':      dict(cut=(16, 0, -22), face=180, t=0.010, slot='hat', roll=0.010),
    'coif':     dict(cut=(8, -42, -44), face=62, t=0.008, slot='linen', roll=0.0),
    'kerchief': dict(cut=(14, -4, -48), face=180, t=0.007, slot='linen', roll=0.0, tails=True),
    'straw':    dict(cut=(6, 6, 6), face=180, t=0.016, slot='straw', brim=0.12, droop=0.03),
    'kettle':   dict(cut=(4, 4, 4), face=180, t=0.012, slot='metal', brim=0.055, droop=0.025),
    'hood':     dict(cut=(8, -52, -58), face=60, t=0.011, slot='hat', roll=0.0),
    'feather':  dict(cut=(14, 2, -18), face=180, t=0.012, slot='hat', roll=0.012, feather=True),
}

def head_piece(fit, style, mat, name='w_hat'):
    P = HEAD[style]; c = fit.head_c; N = 24; K = 7
    fa, sa, ba = [math.radians(x) for x in P['cut']]
    def cutf(th):       # elevation of the lower edge round the head: front value at the face, back value behind, smooth between
        s = abs(math.sin(th / 2)) ** 1.0; w = math.cos(th) * 0.5 + 0.5            # w = 1 in front, 0 behind
        base = ba + (fa - ba) * (w ** 1.3)
        side = (1 - abs(math.cos(th))) * (sa - (fa + ba) / 2) * 0.5
        a = base + side
        if abs(th) < math.radians(P['face']) and P['face'] < 180: pass
        return a
    # outermost surface of head and hair along every ray
    R = np.zeros((K + 1, N)); AL = np.zeros((K + 1, N)); TH = np.array([i / N * 2 * math.pi for i in range(N)])
    for i in range(N):
        th = TH[i]; lim = math.radians(P['face'])
        dth = min(th, 2 * math.pi - th)
        ac = cutf(th)
        if P['face'] < 180:      # a coif frames the face: in front of the ears the lower edge climbs to the brow
            f = min(1.0, max(0.0, (math.radians(P['face']) + 0.35 - dth) / 0.35)) if dth < math.radians(P['face']) + 0.35 else 0.0
            ac = ac + (fa - ac) * f
        for k in range(K + 1):
            al = math.pi / 2 + (ac - math.pi / 2) * (k / K)
            d = sph(th, al); r = fit.outer(c, d, fit.bvh_head, 0.5)
            R[k, i] = r if r is not None else (R[k - 1, i] if k else 0.1); AL[k, i] = al
    R = blur(R, True, 2) if style not in ('coif', 'hood') else blur(R, True, 1)
    R = np.maximum(R, 0.0)
    t = P['t']
    V, Fc, COL = [], [], []
    for k in range(K + 1):
        for i in range(N):
            d = sph(TH[i], AL[k, i]); r = R[k, i] + t * (0.6 + 0.4 * (1 - k / K)) + (0.004 if k == K else 0)
            V.append(c + d * r)
    Fc += grid_faces(N, K + 1, True)
    base_ring = list(range(K * N, (K + 1) * N))
    # a rolled hem: a second ring slightly out and down makes the edge thick
    if P.get('roll'):
        ro = len(V)
        for i in range(N):
            d = sph(TH[i], AL[K, i] - 0.03); r = R[K, i] + t + P['roll']; V.append(c + d * r)
        for i in range(N):
            a, b = base_ring[i], base_ring[(i + 1) % N]; Fc += [(a, ro + (i + 1) % N, b), (a, ro + i, ro + (i + 1) % N)]
    # brims
    if P.get('brim'):
        br = P['brim']; B = 3; start = len(V) - 0
        z0 = np.mean([V[j].z for j in base_ring])
        prev = base_ring
        for s in range(1, B + 1):
            f = s / B; ring = []
            for i in range(N):
                th = TH[i]; v0 = V[base_ring[i]]; rad = Vector((v0.x - c.x, v0.y - c.y, 0)); rl = rad.length or 1
                out = rad / rl * (rl + br * f * (1.0 + 0.10 * math.cos(th)))          # the front of a hat's brim is a little wider
                dz = -P['droop'] * f * f - 0.004 * math.sin(th * 3 + 1) * f
                ring.append(len(V)); V.append(Vector((c.x + out.x, c.y + out.y, v0.z + dz)))
            for i in range(N):
                a, b = prev[i], prev[(i + 1) % N]; cc, dd = ring[(i + 1) % N], ring[i]; Fc += [(a, b, cc), (a, cc, dd)]
            prev = ring
        # a thin underside/edge so the brim has thickness
        edge = prev
        for i in range(N):
            a, b = edge[i], edge[(i + 1) % N]; Fc += [(a, b, a), ]
        Fc = [f for f in Fc if len(set(f)) == 3]
    # a kerchief's tails and a feather
    if P.get('tails'):
        i0 = int(round(N * 0.5)); n0 = len(V)
        for sgn in (-1, 1):
            p0 = V[(K * N) + (i0 + sgn * 2) % N]
            V += [p0, p0 + Vector((sgn * 0.02, 0.05, -0.04)), p0 + Vector((sgn * 0.045, 0.09, -0.14)), p0 + Vector((sgn * 0.005, 0.07, -0.13))]
            Fc += [(n0, n0 + 1, n0 + 2), (n0, n0 + 2, n0 + 3)]; n0 += 4
    if P.get('feather'):
        n0 = len(V); p = c + sph(math.radians(115), math.radians(48)) * (R[2, 12] + 0.02)
        pts = [p, p + Vector((0.02, 0.03, 0.07)), p + Vector((0.04, 0.09, 0.10)), p + Vector((0.05, 0.16, 0.06))]
        for j, q in enumerate(pts):
            w = 0.022 * math.sin(math.pi * (j + 0.5) / len(pts)) + 0.004
            V += [q + Vector((-w, 0, 0)), q + Vector((w, 0, 0))]
        for j in range(len(pts) - 1): a = n0 + j * 2; Fc += [(a, a + 1, a + 3), (a, a + 3, a + 2)]
    cols = []
    for v in V: cols.append((1.0, 1.0, 0.0, SLOT[P['slot']] / 12.0))
    return new_mesh(name + '_' + style, V, Fc, fit, SLOT[P['slot']], mat, cols, group_override='head')

# ───────────────────────── belt, buckle, pouch ─────────────────────────
def torso_centre(fit, z):
    """(y centre, x half width) of the clothed torso at height z, from rays along y and x."""
    ys = []
    for sgn in (-1, 1):
        o = Vector((0, sgn * 0.6, z)); h = fit.bvh_torso.ray_cast(o, Vector((0, -sgn, 0)), 1.2)
        if h[0] is not None: ys.append(h[0].y)
    yc = sum(ys) / len(ys) if ys else 0.0
    xs = []
    for sgn in (-1, 1):
        o = Vector((sgn * 0.5, yc, z)); h = fit.bvh_torso.ray_cast(o, Vector((-sgn, 0, 0)), 1.0)
        if h[0] is not None: xs.append(abs(h[0].x))
    return yc, (max(xs) if xs else 0.17)

def ring_radii(fit, centre, z, N, bvh=None, far=0.6):
    out = []
    for i in range(N):
        th = i / N * 2 * math.pi; d = Vector((math.sin(th), -math.cos(th), 0))
        r = fit.outer(Vector((centre[0], centre[1], z)), d, bvh or fit.bvh_torso, far); out.append(r if r is not None else 0.15)
    return np.array(out)

def _box(V, Fc, cx, cy, cz, sx, sy, sz, rot=0.0):
    b = len(V); cs, sn = math.cos(rot), math.sin(rot)
    for k in range(8):
        x = (sx if k & 1 else -sx); y = (sy if k & 2 else -sy); zz = (sz if k & 4 else -sz)
        V.append(Vector((cx + x * cs - y * sn, cy + x * sn + y * cs, cz + zz)))
    for f in [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]:
        Fc += [(b + f[0], b + f[1], b + f[2]), (b + f[0], b + f[2], b + f[3])]
    return b

def waist(fit):
    pel = fit.bone('pelvis'); pt = fit.bone('pelvis', True)
    z = pel.z + (pt.z - pel.z) * 0.75; yc, hw = torso_centre(fit, z); return z, yc

def belt_piece(fit, mat, width=0.038, buckle=True):
    N = 28; z, yc = waist(fit); V, Fc, cols = [], [], []; rows = []
    for dz, dr in ((width / 2, 0.0), (width / 2, 0.006), (-width / 2, 0.006), (-width / 2, 0.0)):
        R = blur(ring_radii(fit, (0, yc), z + dz, N)[None, :].repeat(3, 0), True, 1)[1]
        rows.append(len(V))
        for i in range(N):
            th = i / N * 2 * math.pi; d = Vector((math.sin(th), -math.cos(th), 0)); V.append(Vector((0, yc, z + dz)) + d * (R[i] + 0.004 + dr))
    for a in range(3):
        for i in range(N):
            p, q = rows[a] + i, rows[a] + (i + 1) % N; r_, s_ = rows[a + 1] + (i + 1) % N, rows[a + 1] + i
            Fc += [(p, q, r_), (p, r_, s_)]
    nleather = len(V); R0 = ring_radii(fit, (0, yc), z, N); metal = []
    if buckle:
        r = R0[0] + 0.010; b0 = _box(V, Fc, 0, yc - r, z, 0.017, 0.004, width * 0.5 + 0.004); metal = range(b0, b0 + 8)
    cols = [(1.0, 1.0, 0.0, SLOT['metal' if i in metal else 'leather'] / 12.0) for i in range(len(V))]
    return new_mesh('w_belt', V, Fc, fit, 0, mat, cols)

def pouch_piece(fit, mat, side=1, knife=False):
    N = 28; z, yc = waist(fit); R0 = ring_radii(fit, (0, yc), z, N); V, Fc = [], []
    th = math.radians(62 * side); d = Vector((math.sin(th), -math.cos(th), 0)); r = R0[int(round((th % (2 * math.pi)) / (2 * math.pi) * N)) % N] + 0.03
    cx, cy = d.x * r, yc + d.y * r; _box(V, Fc, cx, cy, z - 0.085, 0.045, 0.022, 0.05, -th); _box(V, Fc, cx, cy, z - 0.04, 0.047, 0.024, 0.02, -th)
    if knife:
        th = math.radians(-70 * side); d = Vector((math.sin(th), -math.cos(th), 0)); r = R0[int(round((th % (2 * math.pi)) / (2 * math.pi) * N)) % N] + 0.02
        _box(V, Fc, d.x * r, yc + d.y * r, z - 0.1, 0.012, 0.01, 0.12, -th)
    return new_mesh('w_pouch', V, Fc, fit, 0, mat, [(1.0, 1.0, 0.0, SLOT['leather'] / 12.0)] * len(V))

# ───────────────────────── tubes round a limb: cuffs, chemise sleeves, bracers, garters ─────────────────────────
def tube_piece(fit, mat, name, bone, t0, t1, off, rings=3, N=12, slot='linen', roll=0.0, flare=0.0, bone2=None, auto=False):
    """A tube round the axis of a bone from fraction t0 to t1 of its length, `off` outside the surface. auto: start where the sleeve ends."""
    a = fit.bone(bone); b = fit.bone(bone, True)
    if bone2: b = fit.bone(bone2, True)
    ax = (b - a); L = ax.length; ax.normalize()
    u = ax.cross(Vector((0, 0, 1))); u = u.normalized() if u.length > 1e-3 else Vector((1, 0, 0)); w = ax.cross(u)
    def covered(t):
        p = a + ax * (L * t); n = 0
        for i in range(6):
            ang = i / 6 * 2 * math.pi; d = u * math.cos(ang) + w * math.sin(ang)
            if fit.bvh_cloth.ray_cast(p, d, 0.12)[0] is not None: n += 1
        return n >= 4
    if auto:
        te = 0.0
        for k in range(21):
            if covered(k / 20.0): te = k / 20.0
        t0 = max(0.0, te - 0.12)
        if te > 0.9: t0 = 0.8                           # long sleeves: only a narrow turned cuff
    V, Fc = [], []
    for k in range(rings + 1):
        t = t0 + (t1 - t0) * k / rings; p = a + ax * (L * t)
        for i in range(N):
            ang = i / N * 2 * math.pi; d = u * math.cos(ang) + w * math.sin(ang)
            r = fit.outer(p, d, fit.bvh_all, 0.25); rb = fit.outer(p, d, fit.bvh_body, 0.25)
            cov = fit.bvh_cloth.ray_cast(p + d * 0.2, -d, 0.21)[0] is not None
            r = (rb if rb is not None else (r - 0.010 if r is not None else 0.04)) if not (cov and k == rings and auto and t0 >= 0.8) else r
            r = (r if r is not None else 0.04) + off + flare * (k / rings)
            V.append(p + d * r)
    Fc += grid_faces(N, rings + 1, True)
    return new_mesh(name, V, Fc, fit, 0, mat, [(1.0, 1.0, 1.0, SLOT[slot] / 12.0)] * len(V))

# ───────────────────────── apron and tabard: panels projected onto the front and back ─────────────────────────
def surface_y(fit, x, z, front=True, bvh=None):
    bvh = bvh or fit.bvh_torso
    o = Vector((x, -0.7 if front else 0.7, z)); h = bvh.ray_cast(o, Vector((0, 1 if front else -1, 0)), 1.4)
    return h[0].y if h[0] is not None else None

def apron_piece(fit, mat, z_top=None, z_hem=None, hw_top=0.13, slot='apron', name='w_apron', straps=True, back=False, hw_hem=None, stand=0.035, wscale=0.98):
    sp = fit.bone('spine_03'); neck = fit.bone('neck_01')
    z_top = z_top if z_top is not None else sp.z + (neck.z - sp.z) * 0.15 + 0.06
    knee = fit.bone('calf_l')
    z_hem = z_hem if z_hem is not None else knee.z + 0.08
    pel = fit.bone('pelvis'); zw = pel.z + 0.1
    yc, hwb = torso_centre(fit, zw)
    nx, nz = 9, 14; V, Fc, C = [], [], []
    hw_w = hwb * wscale
    hw_hem = hw_hem or (hw_w + 0.05)
    for j in range(nz):
        f = j / (nz - 1); z = z_top + (z_hem - z_top) * f
        # half width: narrow bib, full at the waist, flaring to the hem
        if z > zw: g = (z_top - z) / max(z_top - zw, 1e-3); hw = hw_top + (hw_w - hw_top) * min(1, max(0, g))
        else: g = (zw - z) / max(zw - z_hem, 1e-3); hw = hw_w + (hw_hem - hw_w) * g
        for i in range(nx):
            x = hw * (i / (nx - 1) * 2 - 1)
            y = surface_y(fit, max(-0.3, min(0.3, x)) * 0.9, z, not back)
            if y is None: y = yc + (-1 if not back else 1) * 0.1
            drape = (stand * (max(0, zw - z) / max(zw - z_hem, 1e-3)) ** 1.2 + 0.016) * (1 if back else -1)
            ripple = 0.006 * math.sin(x * 36 + z * 5) * (1 if z < zw else 0.3) * (1 if back else -1)
            sag = 0.012 * (1 - (2 * i / (nx - 1) - 1) ** 2) * (1 if back else -1) * (max(0, zw - z) / max(zw - z_hem, 1e-3))      # hangs out in the middle
            V.append(Vector((x, y + drape + ripple + sag, z)))
    Fc += grid_faces(nx, nz, False, flip=back)
    cols = [(1, 1, 1, SLOT[slot] / 12.0)] * len(V)
    o_ = new_mesh(name, V, Fc, fit, 0, mat, cols)
    return o_

def strap_piece(fit, mat, name='w_straps', xs=(-0.105, 0.105), slot='apron', z_front=None, z_back=None, width=0.03):
    """Shoulder straps: from the front of the chest over the shoulder and down the back."""
    V, Fc = [], []
    sp = fit.bone('spine_03'); neck = fit.bone('neck_01'); z_front = z_front or (sp.z + (neck.z - sp.z) * 0.15 + 0.06); z_back = z_back or (z_front - 0.2)
    for x in xs:
        path = []
        yf = surface_y(fit, x, z_front, True)
        if yf is None: continue
        # up the front, over the top, down the back
        for z in np.linspace(z_front, z_front + 0.07, 3): y = surface_y(fit, x, z, True); path.append(Vector((x, (y if y is not None else yf) - 0.006, z)))
        ys = np.linspace(path[-1].y, (surface_y(fit, x, z_back, False) or 0.08), 6)
        for y in ys[1:]:
            o = Vector((x, y, 1.75)); h = fit.bvh_torso.ray_cast(o, Vector((0, 0, -1)), 0.5)
            if h[0] is not None: path.append(Vector((x, y, h[0].z + 0.006)))
        for z in np.linspace(z_back + 0.12, z_back, 3): y = surface_y(fit, x, z, False); path.append(Vector((x, (y if y is not None else 0.08) + 0.006, z)))
        b = len(V)
        for p in path: V += [p + Vector((-width / 2, 0, 0)), p + Vector((width / 2, 0, 0))]
        for j in range(len(path) - 1): a = b + j * 2; Fc += [(a, a + 1, a + 3), (a, a + 3, a + 2)]
    if not V: return None
    return new_mesh(name, V, Fc, fit, 0, mat, [(1, 1, 1, SLOT[slot] / 12.0)] * len(V))

# ───────────────────────── cloak: a draped half-cylinder down the back ─────────────────────────
def cloak_piece(fit, mat, slot='cloak', z_top=None, z_hem=None, name='w_cloak', open_front=1.0, flare=0.13, folds=0.022):
    sp = fit.bone('spine_03'); neck = fit.bone('neck_01'); z_top = z_top or (neck.z - 0.03); z_hem = z_hem or fit.bone('calf_l').z - 0.05
    N = 22; Kz = 12; V, Fc = [], []
    yc, hw = torso_centre(fit, sp.z)
    span = math.pi - open_front * 0.5            # half angle covered, measured from the back
    for j in range(Kz + 1):
        f = j / Kz; z = z_top + (z_hem - z_top) * f
        for i in range(N):
            a = (i / (N - 1) * 2 - 1) * span; th = math.pi + a                       # theta = pi is the back
            d = Vector((math.sin(th), -math.cos(th), 0))
            zc = min(z, fit.bone('pelvis').z + 0.05)
            cx, cy = 0, torso_centre(fit, max(z, 0.9))[0]
            r0 = fit.outer(Vector((cx, cy, max(z, 0.7))), d, fit.bvh_torso, 0.7) or 0.2
            hang = (f ** 1.15) * flare * (0.55 + 0.45 * math.cos(a * 1.5))
            fold = folds * math.sin(a * 5.0 + f * 2.2 + 0.4) * min(1, f * 3.0)
            clasp = 1.0 if f < 0.05 else 0.0
            r = r0 + 0.018 + hang + fold
            V.append(Vector((cx + d.x * r, cy + d.y * r, z - 0.03 * abs(math.sin(a * 2.0)) * f)))
    Fc += grid_faces(N, Kz + 1, False, flip=False)
    cols = [(1, 1, 1, SLOT[slot] / 12.0)] * len(V)
    return new_mesh(name, V, Fc, fit, 0, mat, cols)

# ───────────────────────── tabard ─────────────────────────
def tabard_pieces(fit, mat, slot='tabard'):
    neck = fit.bone('neck_01'); z_top = neck.z - 0.07
    out = [apron_piece(fit, mat, z_top=z_top, z_hem=fit.bone('calf_l').z + 0.14, hw_top=0.075, slot=slot, name='w_tabard_f', stand=0.02, hw_hem=None),
           apron_piece(fit, mat, z_top=z_top, z_hem=fit.bone('calf_l').z + 0.14, hw_top=0.075, slot=slot, name='w_tabard_b', stand=0.02, back=True)]
    return out

# ───────────────────────── per-vertex data: ambient occlusion, dirt, trim bands ─────────────────────────
def _hemi_dirs(n):
    # fixed cosine-weighted directions in a local frame (z = normal)
    out = []
    for i in range(n):
        u = (i + 0.5) / n; ph = i * 2.399963
        r = math.sqrt(u); out.append((r * math.cos(ph), r * math.sin(ph), math.sqrt(max(0.0, 1 - u))))
    return out

def bake_colors(fit, objs, ao_dist=0.09, rays=10, trim=0.035, clean=None):
    """COLOR_0 for body and garments: R ambient occlusion, G cleanliness, B trim band (distance to an open edge: cuffs, hems, neckline), A 0."""
    dirs = _hemi_dirs(rays); bvh = fit.bvh_all
    for o in objs:
        me = o.data
        mw = o.matrix_world; nm = mw.to_3x3()
        # boundary vertices (open edges) for trim bands
        bnd = set()
        edge_faces = {}
        for p in me.polygons:
            vs = list(p.vertices)
            for k in range(len(vs)):
                key = tuple(sorted((vs[k], vs[(k + 1) % len(vs)]))); edge_faces[key] = edge_faces.get(key, 0) + 1
        for (a, b), c in edge_faces.items():
            if c == 1: bnd.add(a); bnd.add(b)
        kd = None
        if bnd and trim:
            kd = kdtree.KDTree(len(bnd))
            for i, vi in enumerate(sorted(bnd)): kd.insert(mw @ me.vertices[vi].co, i)
            kd.balance()
        is_cloth = o.name.split('.')[-1] not in ('', ) and (o.name.startswith(('w_kirtle', 'w_sleeve', 'w_apron')) or 'rehman' in o.name or 'toigo' in o.name or 'donitz' in o.name or 'wdg' in o.name or 'culturalibre' in o.name) and 'hood' not in o.name
        ca = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
        for v in me.vertices:
            co = mw @ v.co; n = (nm @ v.normal).normalized()
            t = n.cross(Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))).normalized(); b = n.cross(t)
            occ = 0
            for d in dirs:
                w = t * d[0] + b * d[1] + n * d[2]
                if bvh.ray_cast(co + n * 0.003, w, ao_dist)[0] is not None: occ += 1
            ao = 1.0 - 0.8 * occ / rays
            # dirt: mud up the hem and boots, a few low-frequency stains, grimy where hands and knees work
            z = co.z; g = 1.0 - 0.55 * max(0.0, min(1.0, (0.32 - z) / 0.32))
            st = math.sin(co.x * 23.0 + co.z * 11.0) * math.sin(co.y * 19.0 - co.z * 7.0) + 0.5 * math.sin(co.x * 41.0 + co.y * 33.0)
            g *= 1.0 - 0.45 * max(0.0, min(1.0, (st - 0.55) * 2.0))
            g *= 0.92 + 0.08 * hash01(co.x * 311, co.y * 173, co.z * 97)
            if clean is not None: g = 1.0 - (1.0 - g) * clean
            tr = 0.0
            if kd is not None and is_cloth:
                _, _, dist = kd.find(co); tr = max(0.0, 1.0 - dist / trim)
            ca.data[v.index].color = (ao, g, tr, ca.data[v.index].color[3] if o.name.startswith('w_') else 0.0)
    return True


# ───────────────────────── kirtle / tunic: a shell grown from the body ─────────────────────────
def kirtle_pieces(fit, mat, hem='ankle', sleeve='long', slot='wool', flare=0.17, folds=0.02, name='w_kirtle'):
    """Neck-to-hem garment from rays cast at the torso and legs: fitted over chest and waist, widening over the hips into a skirt with folds that
    ends at the ankle (kirtle, smock) or the knee (tunic); with sleeves to the wrist as tubes along the arms. Returns [body piece, left sleeve, right sleeve]."""
    neck = fit.bone('neck_01'); pel = fit.bone('pelvis'); foot = fit.bone('foot_l'); knee = fit.bone('calf_l')
    z_top = neck.z - 0.012
    z_hem = (foot.z + 0.13) if hem == 'ankle' else (knee.z + 0.04 if hem == 'knee' else knee.z + 0.20)
    z_hip = pel.z - 0.02
    N = 28; zs = [z_top, z_top - 0.035, z_top - 0.075, z_top - 0.12]
    k = 0.19
    while zs[-1] > z_hip: zs.append(zs[-1] - 0.06)
    nsk = 9
    for j in range(1, nsk + 1): zs.append(zs[-1] - (zs[-1] - z_hem) / (nsk + 1 - j) if j < nsk else z_hem)
    V, Fc = [], []; rprev = [0.0] * N; z_w = fit.bone('spine_01').z
    for jr, z in enumerate(zs):
        t = max(0.0, (z_hip - z) / max(1e-3, z_hip - z_hem))                     # 0 at the hips, 1 at the hem
        yc, hw = torso_centre(fit, max(z, 0.8))
        for i in range(N):
            th = i / N * 2 * math.pi; d = Vector((math.sin(th), -math.cos(th), 0))
            r0 = fit.outer(Vector((0, yc, z)), d, fit.bvh_torso, 0.7)
            if r0 is None: r0 = rprev[i] if rprev[i] > 0 else 0.14
            rb = r0 + 0.012 + (0.010 if z < z_w else 0.0)
            if z < z_hip: rb = max(rb, rprev[i])                            # the body radius never shrinks below the hips (a skirt does not tuck in at the knees)
            rprev[i] = rb; r = rb
            if z < z_hip:
                r = rb + flare * (t ** 1.25) * (0.7 + 0.3 * abs(math.cos(th)))
                r += folds * (math.sin(th * 7.0 + z * 4.0) + 0.5 * math.sin(th * 11.0 - z * 6.0)) * min(1.0, t * 3.0)
            V.append(Vector((d.x * r, yc + d.y * r, z - ((0.045 * abs(math.sin(th * 2 + 0.6)) + 0.02 * math.sin(th * 5 + 1.3)) * t ** 1.5 if z < z_hip else 0.0))))
    Fc += grid_faces(N, len(zs), True, flip=False)
    body = new_mesh(name, V, Fc, fit, 0, mat, [(1.0, 1.0, 1.0, SLOT[slot] / 12.0)] * len(V))
    out = [body]
    for sd in ('l', 'r'):
        if sleeve == 'none': break
        out.append(tube_piece(fit, mat, 'w_sleeve' + sd.upper(), 'upperarm_' + sd, -0.22, 1.0 if sleeve == 'long' else 0.45, 0.008, rings=7, N=12, slot=slot, bone2='lowerarm_' + sd, flare=0.012))
    return out

# ───────────────────────── a wardrobe ─────────────────────────
DEFAULT_WEAR = dict(
    m=['belt', 'pouch', 'hat:cap', 'hat:straw', 'hat:coif', 'apron', 'straps', 'cloak', 'cuffs'],
    f=['belt', 'pouch', 'hat:kerchief', 'hat:coif', 'hat:straw', 'apron', 'straps', 'cloak', 'cuffs'])

def wardrobe(fit, mat, spec):
    wear = spec.get('wear') or DEFAULT_WEAR['m' if spec['macro']['gender'] > 0.5 else 'f']
    wear = sorted(wear, key=lambda w: 0 if w.startswith('kirtle') else 1)      # the shell first: everything else is fitted over it
    out = []
    for w in wear:
        o = None
        if w == 'belt': o = belt_piece(fit, mat)
        elif w == 'pouch': o = pouch_piece(fit, mat, knife=spec.get('knife', False))
        elif w == 'hat:hood':                              # hood with a short shoulder cape (chaperon)
            out.append(head_piece(fit, 'hood', mat)); o = cloak_piece(fit, mat, slot='hat', z_top=fit.bone('neck_01').z - 0.01, z_hem=fit.bone('neck_01').z - 0.27, flare=0.05, folds=0.012, name='w_hat_hood_cape')
        elif w.startswith('hat:'): o = head_piece(fit, w[4:], mat)
        elif w == 'apron': o = apron_piece(fit, mat)
        elif w == 'apron_half': o = apron_piece(fit, mat, z_top=waist(fit)[0] + 0.02, z_hem=fit.bone('calf_l').z + 0.02, hw_top=torso_centre(fit, waist(fit)[0])[1] * 0.98, name='w_apron_half', stand=0.03)
        elif w == 'apron_long': o = apron_piece(fit, mat, z_hem=fit.bone('foot_l').z + 0.2, hw_top=0.085, hw_hem=None, name='w_apron_long', wscale=0.72, stand=0.03)
        elif w == 'straps': o = strap_piece(fit, mat)
        elif w == 'cloak': o = cloak_piece(fit, mat, flare=0.09)
        elif w == 'tabard': out += tabard_pieces(fit, mat); continue
        elif w.startswith('kirtle'):                     # 'kirtle:ankle:long' | 'kirtle:knee:long'
            q = w.split(':'); out += kirtle_pieces(fit, mat, hem=q[1] if len(q) > 1 else 'ankle', sleeve=q[2] if len(q) > 2 else 'long', flare=0.09 if spec['macro']['age'] < 0.3 else 0.17); fit.add_clothes(out); continue
        elif w == 'cuffs':
            for s in ('l', 'r'): out.append(tube_piece(fit, mat, 'w_cuff' + s.upper(), 'lowerarm_' + s, 0.0, 1.0, 0.005, auto=True))
            continue
        if o: out.append(o)
    return out
