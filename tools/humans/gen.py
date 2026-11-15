"""Generates one MakeHuman villager inside headless Blender (bpy + MPFB2) and exports a raw GLB.

usage: python gen.py <spec.json> <character name> <out dir>

Spec entry: { "macro": {gender, age, muscle, weight, height, proportions, race:{asian,caucasian,african}},
              "skin": "old_caucasian_male", "eyes": "brown", "brows": "eyebrow006",
              "hair": ["short04", [r,g,b] tint or null, saturation], "clothes": [["donitz_monk_robe", [r,g,b], saturation], ...] }
What it does beyond assembling the MakeHuman assets:
  * removes the body surface that clothes cover (no skin poking through cloth, far fewer triangles);
  * blanks the parts of the skin texture nothing uses any more, and bakes clothing tints into 1K textures.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh, numpy as np, mh_common as C
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from PIL import Image, ImageDraw, ImageFilter

spec_path, name, outdir = sys.argv[-3], sys.argv[-2], sys.argv[-1]
spec = json.load(open(spec_path))[name]
os.makedirs(outdir, exist_ok=True); texdir = os.path.join(outdir, 'tex_' + name); os.makedirs(texdir, exist_ok=True)
C.boot()
Human = C.svc('humanservice', 'HumanService'); Asset = C.svc('assetservice', 'AssetService'); Target = C.svc('targetservice', 'TargetService')
Export = C.svc('exportservice', 'ExportService')

md = Target.get_default_macro_info_dict()
for k, v in spec['macro'].items(): md[k] = v
bm_obj = Human.create_human(macro_detail_dict=md, feet_on_ground=True, scale=0.1)
bm_obj.name = name
skin = Asset.find_asset_absolute_path(spec['skin'] + '.mhmat', asset_subdir='skins')
if not skin:
    import glob
    g = glob.glob(os.path.join(os.path.dirname(Asset.find_asset_absolute_path('young_caucasian_male.mhmat', asset_subdir='skins')), '..', spec['skin'], '*.mhmat'))
    skin = g[0] if g else None
if not skin and spec.get('skinFallback'): skin = Asset.find_asset_absolute_path(spec['skinFallback'] + '.mhmat', asset_subdir='skins')
assert skin, 'skin ' + spec['skin']
Human.set_character_skin(skin, bm_obj, skin_type='GAMEENGINE')
Human.add_builtin_rig(bm_obj, 'game_engine')

def add(sub, fname, atype):
    p = Asset.find_asset_absolute_path(fname + '.mhclo', asset_subdir=sub)
    if not p: raise SystemExit('missing asset ' + sub + '/' + fname)
    o = Human.add_mhclo_asset(p, bm_obj, asset_type=atype, material_type='GAMEENGINE')
    for m in list(o.modifiers):
        if m.type == 'SUBSURF': o.modifiers.remove(m)
    return o
eyes = add('eyes', 'low-poly', 'Eyes')
try: brows = add('eyebrows', spec.get('brows', 'eyebrow006'), 'Eyebrows')
except Exception as e:
    print('brow fallback', e)
    for o in [o for o in bpy.data.objects if o.type == 'MESH' and o not in (bm_obj, eyes)]: bpy.data.objects.remove(o, do_unlink=True)
    brows = add('eyebrows', 'eyebrow006', 'Eyebrows')
hair = add('hair', spec['hair'][0], 'Hair') if spec.get('hair') else None
clothes = [(add('clothes', c[0], 'Clothes'), c) for c in spec['clothes']]

def base_image_node(obj):
    mat = obj.data.materials[0]
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            l = n.inputs['Base Color'].links
            if l and l[0].from_node.type == 'TEX_IMAGE': return l[0].from_node
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image: return n
    return None
def load_rgba(img): return Image.open(bpy.path.abspath(img.filepath)).convert('RGBA')
def set_image(node, pil, fname):
    p = os.path.join(texdir, fname); pil.save(p)
    im = bpy.data.images.load(p); im.name = fname[:-4]; node.image = im
def grade(pil, tint, sat, size, contrast=None):
    a = np.asarray(pil.resize((size, size), Image.LANCZOS)).astype(np.float32) / 255
    rgb = a[..., :3]
    if contrast is not None: mean = rgb.mean((0, 1), keepdims=True); rgb = mean + (rgb - mean) * contrast
    lum = (rgb * [0.299, 0.587, 0.114]).sum(-1, keepdims=True)
    rgb = lum + (rgb - lum) * (1.0 if sat is None else sat)
    if tint: rgb = rgb * np.asarray(tint, np.float32)
    out = np.concatenate([np.clip(rgb, 0, 1), a[..., 3:]], -1)
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA')

# eyes: iris colour by swapping the texture
node = base_image_node(eyes); eye_png = Asset.find_asset_absolute_path(spec.get('eyes', 'brown') + '_eye.png', asset_subdir='eyes/materials') or os.path.join(os.path.dirname(bpy.path.abspath(node.image.filepath)), '..', 'materials', spec.get('eyes', 'brown') + '_eye.png')
if not os.path.exists(eye_png): eye_png = bpy.path.abspath(node.image.filepath)
set_image(node, Image.open(eye_png).convert('RGBA').resize((256, 256), Image.LANCZOS), 'eye.png')
for o, tag in ((brows, 'brows'),):
    node = base_image_node(o)
    if node: set_image(node, grade(load_rgba(node.image), spec.get('browTint'), 1.0, 256), tag + '.png')
if hair:
    node = base_image_node(hair); h = spec['hair']
    set_image(node, grade(load_rgba(node.image), h[1] if len(h) > 1 else None, h[2] if len(h) > 2 else None, 1024), 'hair.png')
for k, (o, c) in enumerate(clothes):
    node = base_image_node(o)
    if node: set_image(node, grade(load_rgba(node.image).convert('RGB').convert('RGBA'), c[1] if len(c) > 1 else None, c[2] if len(c) > 2 else None, 1024, c[3] if len(c) > 3 else None), 'cloth%d.png' % k)

# bake the body shape (MPFB keeps it as shape keys), MPFB's own masks, and drop helper geometry
Target.bake_targets(bm_obj)
Export.bake_modifiers_remove_helpers(bm_obj, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)
bpy.context.view_layer.update()

# ── remove body surface covered by clothes ──
cl_objs = [o for o, _ in clothes]
verts, polys = [], []
for o in cl_objs:
    base = len(verts); mw = o.matrix_world
    verts += [mw @ v.co for v in o.data.vertices]; polys += [tuple(base + i for i in p.vertices) for p in o.data.polygons]
bvh = BVHTree.FromPolygons(verts, polys)
me = bm_obj.data; mw = bm_obj.matrix_world; nmat = mw.to_3x3().inverted().transposed()
gi = {g.name: g.index for g in bm_obj.vertex_groups}
keep_groups = {gi[n] for n in gi if n in ('head', 'neck_01') or n.startswith(('hand_', 'index_', 'middle_', 'ring_', 'pinky_', 'thumb_'))}
leg_groups = {gi[n] for n in gi if n.startswith(('thigh_', 'calf_'))}
covered = np.zeros(len(me.vertices), bool)
for v in me.vertices:
    wk = sum(g.weight for g in v.groups if g.group in keep_groups)
    if wk >= 0.35: continue
    wl = sum(g.weight for g in v.groups if g.group in leg_groups)
    co = mw @ v.co; n = (nmat @ v.normal).normalized()
    hit = bvh.ray_cast(co + n * 0.002, n, 0.30 if wl > 0.5 else 0.06)
    if hit[0] is None and wl <= 0.5: hit = bvh.ray_cast(co + n * 0.02, -n, 0.03)       # cloth lying just inside the skin
    covered[v.index] = hit[0] is not None
b = bmesh.new(); b.from_mesh(me); b.verts.ensure_lookup_table()
for _ in range(2):                                  # leave a margin of skin under every opening
    nxt = covered.copy()
    for v in b.verts:
        if covered[v.index] and any(not covered[e.other_vert(v).index] for e in v.link_edges): nxt[v.index] = False
    covered = nxt
dead = [f for f in b.faces if all(covered[v.index] for v in f.verts)]
nb = len(b.faces); bmesh.ops.delete(b, geom=dead, context='FACES')
loose = [v for v in b.verts if not v.link_faces]; bmesh.ops.delete(b, geom=loose, context='VERTS')
b.to_mesh(me); b.free(); me.update()
print('body faces', nb, '->', len(me.polygons))

info_eye_z = max((eyes.matrix_world @ v.co).z for v in eyes.data.vertices) + 0.02
# ── skin texture: 1K, with everything no remaining face uses painted flat ──
node = base_image_node(bm_obj); src = load_rgba(node.image).convert('RGB').resize((1024, 1024), Image.LANCZOS)
mask = Image.new('L', (1024, 1024), 0); dr = ImageDraw.Draw(mask); uvl = me.uv_layers.active.data
for p in me.polygons:
    pts = [(uvl[li].uv[0] * 1024, (1 - uvl[li].uv[1]) * 1024) for li in p.loop_indices]
    dr.polygon(pts, fill=255)
mask = mask.filter(ImageFilter.MaxFilter(17))
a = np.asarray(src).astype(np.float32); m = np.asarray(mask) > 0
if spec.get('skinTint'): a = a * np.asarray(spec['skinTint'], np.float32)
flat = a[m].mean(0) if m.any() else np.array([150, 110, 90], np.float32)
a[~m] = flat
if hair:
    hv, hp = [hair.matrix_world @ v.co for v in hair.data.vertices], [tuple(p.vertices) for p in hair.data.polygons]
    hb = BVHTree.FromPolygons(hv, hp); under = np.zeros(len(me.vertices), bool)
    for v in me.vertices:
        co = mw @ v.co; n = (nmat @ v.normal).normalized()
        under[v.index] = co.z > info_eye_z and hb.ray_cast(co + n * 0.001, n, 0.035)[0] is not None
    sm = Image.new('L', (1024, 1024), 0); dr = ImageDraw.Draw(sm)
    for p in me.polygons:
        if all(under[i] for i in p.vertices): dr.polygon([(uvl[li].uv[0] * 1024, (1 - uvl[li].uv[1]) * 1024) for li in p.loop_indices], fill=255)
    sm = np.asarray(sm.filter(ImageFilter.GaussianBlur(5))).astype(np.float32)[..., None] / 255
    hi = np.asarray(Image.open(os.path.join(texdir, 'hair.png')).convert('RGBA')).astype(np.float32); w = hi[..., 3:] / 255
    hcol = (hi[..., :3] * w).sum((0, 1)) / max(w.sum(), 1) * 0.8
    a = a * (1 - sm * 0.92) + hcol * sm * 0.92
set_image(node, Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'), 'skin.png')

# names the optimiser understands
bm_obj.data.materials[0].name = 'body'; eyes.data.materials[0].name = 'eye'; brows.data.materials[0].name = 'eyebrow'
if hair: hair.data.materials[0].name = 'hair'
for k, (o, c) in enumerate(clothes): o.data.materials[0].name = 'cloth_' + c[0]
rig = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; rig.name = 'rig'
tot = 0
for o in bpy.data.objects:
    if o.type == 'MESH': o.data.calc_loop_triangles(); tot += len(o.data.loop_triangles)
head = rig.data.bones['head']; eye_h = max((eyes.matrix_world @ v.co).z for v in eyes.data.vertices) - 0.012
info = {'name': name, 'rawTris': tot, 'height': round(max((mw @ v.co).z for v in me.vertices), 3), 'eyeHeight': round(eye_h, 3), 'hipHeight': round((rig.matrix_world @ rig.data.bones['pelvis'].head_local).z, 3)}
json.dump(info, open(os.path.join(outdir, name + '.json'), 'w')); print(info)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(outdir, name + '_raw.glb'), export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_yup=True, export_apply=False)
