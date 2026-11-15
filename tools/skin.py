#!/usr/bin/env python3
"""Builds the "realistic skin" for the kits: kits/skin/<Material>_{a,n,orm}.webp + kits/skin/SKIN.json.

usage: python3 -I tools/skin.py [kits source dir] [poly haven dir] [out dir]

Two kinds of material:
 * tiling surfaces (plaster, rubble, ashlar, red brick) are replaced outright by scanned Poly Haven sets (CC0);
 * trim sheets (beams, furniture, metal, cloth, roof tiles, stone trims) keep their painted layout, because the kit UVs depend on it:
   wood regions are re-made from a scanned wood tile (grain along U, like the painted sheet) modulated by the painted sheet's
   edges and wear; everything else is desaturated and darkened, with scanned grit added so it does not look hand-painted.
"""
import sys, os, json
import numpy as np, cv2
from PIL import Image

KITS = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/ext/kits'
PH = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/ext/ph/tex'
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kits', 'skin')
ROCK = '/home/claude/village/build/tex_master/rock_a.png'      # pattern-free cliff scan (ambientCG Rock020), used only as grit
V = os.path.join(KITS, 'medieval_village_megakitstandard/glTF')
P = os.path.join(KITS, 'fantasy_props_megakitstandard/Textures')
R = 1024
os.makedirs(OUT, exist_ok=True)

def s2l(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def l2s(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)
def load(path, size=R, srgb=False):
    a = np.asarray(Image.open(path).convert('RGB').resize((size, size), Image.LANCZOS)).astype(np.float32) / 255
    return s2l(a) if srgb else a
def lum(c): return c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722
def blur(a, s):
    """gaussian blur that wraps around, so tiling maps stay tiling"""
    p = int(np.ceil(s * 3)); b = cv2.copyMakeBorder(a, p, p, p, p, cv2.BORDER_WRAP)
    return cv2.GaussianBlur(b, (0, 0), s)[p:-p, p:-p]
def desat(c, k): l = lum(c)[..., None]; return l + (c - l) * k
def tile(a, nu, nv):
    """repeat a square map nu x nv times across an R x R sheet"""
    h = max(8, int(round(R / nv))); w = max(8, int(round(R / nu)))
    t = cv2.resize(a, (w, h), interpolation=cv2.INTER_AREA)
    return np.tile(t, (int(np.ceil(R / h)), int(np.ceil(R / w)), 1) if a.ndim == 3 else (int(np.ceil(R / h)), int(np.ceil(R / w))))[:R, :R]
def save(name, rgb_lin=None, nrm=None, orm=None):
    out = {}
    if rgb_lin is not None: Image.fromarray((np.clip(l2s(rgb_lin), 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, name + '_a.webp'), 'WEBP', quality=88, method=6); out['a'] = name + '_a.webp'
    if nrm is not None: Image.fromarray((np.clip(nrm, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, name + '_n.webp'), 'WEBP', quality=94, method=6); out['n'] = name + '_n.webp'
    if orm is not None: Image.fromarray((np.clip(orm, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, name + '_orm.webp'), 'WEBP', quality=86, method=6); out['orm'] = name + '_orm.webp'
    return out
def nblend(base, det, k):
    """detail normal over a base normal (both 0..1 maps, GL convention)"""
    b = base * 2 - 1; d = det * 2 - 1
    n = np.stack([b[..., 0] + d[..., 0] * k, b[..., 1] + d[..., 1] * k, b[..., 2]], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-6
    return n * 0.5 + 0.5
def hsv(c):
    h = cv2.cvtColor(np.clip(l2s(c), 0, 1).astype(np.float32), cv2.COLOR_RGB2HSV); return h[..., 0], h[..., 1], h[..., 2]

grit = lum(load(ROCK, 512, True)); grit = grit / (blur(grit, 12) + 1e-4)                    # high-passed stone grain, mean ~1
WOOD = {k: {'d': load(f'{PH}/{k}_diff.jpg', srgb=True), 'n': load(f'{PH}/{k}_nor.jpg'), 'arm': load(f'{PH}/{k}_arm.jpg')} for k in ['wood_table_worn', 'dark_wooden_planks']}
mats = {}; prov = []

# ── 1. tiling surfaces: straight replacement ──
def scan(mat, pid, tint=(1, 1, 1), gain=1.0, sat=1.0, uv=(1, 1), nscale=1.0):
    d = desat(load(f'{PH}/{pid}_diff.jpg', srgb=True), sat) * np.asarray(tint, np.float32) * gain
    m = save(mat, d, load(f'{PH}/{pid}_nor.jpg'), load(f'{PH}/{pid}_arm.jpg'))
    m.update({'uvScale': list(uv), 'nScale': nscale, 'source': 'polyhaven:' + pid}); mats[mat] = m; prov.append((mat, pid))
scan('MI_Plaster', 'painted_plaster_wall', tint=(1.10, 1.03, 0.90), gain=1.12, sat=0.8)
scan('MI_UnevenBrick', 'old_stone_wall', gain=0.9, sat=0.85)
scan('MI_Brick', 'medieval_blocks_03', gain=0.95, sat=0.8)
scan('MI_RedBrick', 'medieval_red_brick', gain=0.85, sat=0.8)

# ── 2. trim sheets ──
def wood_mask(c, hmax=52):
    h, s, v = hsv(c)                      # painted wood is orange to brown
    m = ((h > 8) & (h < hmax) & (s > 0.28)).astype(np.float32)
    return np.clip(blur(m, 2.0) * 1.4 - 0.2, 0, 1)
def restyle(mat, base, nrm, orm, wood=None, wood_gain=0.62, wood_sat=0.72, nu=4, nv=3, other_sat=0.45, other_gain=0.72, grit_k=0.35, metal=False, moss=False, ao_from_r=True, hmax=52):
    c = load(base, srgb=True); n = load(nrm) if nrm else np.dstack([np.full((R, R), 0.5), np.full((R, R), 0.5), np.ones((R, R))]).astype(np.float32)
    o = load(orm) if orm else np.dstack([np.ones((R, R)), np.full((R, R), 0.8), np.zeros((R, R))]).astype(np.float32)
    L = lum(c); g = tile(grit, 3, 3)
    other = desat(c, other_sat) * other_gain * (1 + (g - 1) * grit_k)[..., None]
    if moss:                               # keep the moss on the roof but stop it glowing
        h, s, v = hsv(c); mm = np.clip(blur(((h > 70) & (h < 150) & (s > 0.3)).astype(np.float32), 1.5), 0, 1)[..., None]
        other = other * (1 - mm) + desat(c, 0.55) * 0.42 * mm
    out = other; rough = o[..., 1].copy()
    if wood:
        W = WOOD[wood]; m = wood_mask(c, hmax)
        S = desat(tile(W['d'], nu, nv), wood_sat)
        det = np.clip((L / (blur(L, 10) + 1e-4)), 0.5, 1.7) ** 0.9                      # painted grain lines, edges and wear
        rel = np.clip(blur(L, 40) / (np.sum(blur(L, 40) * m) / (np.sum(m) + 1e-6) + 1e-6), 0.55, 1.6) ** 0.55     # light planks stay lighter than dark beams
        wd = S * (det * rel * wood_gain)[..., None]
        out = other * (1 - m[..., None]) + wd * m[..., None]
        m3 = m[..., None]; n = nblend(n, tile(W['n'], nu, nv) * m3 + np.array([0.5, 0.5, 1.0], np.float32) * (1 - m3), 0.8)
        rough = rough * (1 - m) + np.clip(tile(W['arm'], nu, nv)[..., 1] * 1.05, 0, 1) * m
    if metal: rough = np.clip(rough * 0.9 + 0.08, 0.2, 1)
    o2 = np.dstack([o[..., 0] if ao_from_r else np.ones((R, R), np.float32), rough, o[..., 2]])
    m = save(mat, out, n, o2); m.update({'source': 'restyled:' + os.path.basename(base) + (' + polyhaven:' + wood if wood else '')}); mats[mat] = m
    if wood: prov.append((mat, wood))

restyle('MI_WoodTrim', f'{V}/T_WoodTrim_BaseColor.png', f'{V}/T_WoodTrim_Normal.png', f'{V}/T_WoodTrim_Roughness.png', wood='wood_table_worn', wood_gain=0.50, wood_sat=0.62, ao_from_r=False)
mats['MI_WoodTrim_Wear'] = dict(mats['MI_WoodTrim'])
restyle('MI_RockTrim', f'{V}/T_RockTrim_BaseColor.png', f'{V}/T_RockTrim_Normal.png', f'{V}/T_RockTrim_ORM.png', other_sat=0.5, other_gain=0.70, grit_k=0.55)
restyle('MI_RoundTiles', f'{V}/T_RoundTiles_BaseColor.png', f'{V}/T_RoundTiles_Normal.png', f'{V}/T_RoundTiles_Roughness.png', other_sat=0.50, other_gain=0.50, grit_k=0.6, moss=True, ao_from_r=False)
restyle('MI_MetalOrnaments', f'{V}/T_MetalOrnaments_BaseColor.png', None, f'{V}/T_MetalOrnaments_Roughness.png', other_sat=0.3, other_gain=0.42, grit_k=0.3, metal=True, ao_from_r=False)
restyle('MI_Trim_Furniture', f'{P}/T_Trim_Furniture_BaseColor.png', f'{P}/T_Trim_Furniture_Normal.png', f'{P}/T_Trim_Furniture_ORM.png', wood='wood_table_worn', wood_gain=0.85, wood_sat=0.75, other_sat=0.4, other_gain=0.6)
restyle('MI_Trim_Metal', f'{P}/T_Trim_Metal_BaseColor.png', f'{P}/T_Trim_Metal_Normal.png', f'{P}/T_Trim_Metal_ORM.png', other_sat=0.35, other_gain=0.55, grit_k=0.3, metal=True)
mats['MI_Trim_Metal_Vertex'] = dict(mats['MI_Trim_Metal'])
restyle('MI_Trim_Props', f'{P}/T_Trim_Props_BaseColor.png', f'{P}/T_Trim_Props_Normal.png', f'{P}/T_Trim_Props_ORM.png', wood='wood_table_worn', wood_gain=0.6, other_sat=0.6, other_gain=0.8, grit_k=0.15, hmax=36)
mats['MI_Trim_Props_Vertex'] = dict(mats['MI_Trim_Props'])
restyle('MI_Trim_Cloth', f'{P}/T_Trim_Cloth_BaseColor.png', f'{P}/T_Trim_Cloth_Normal.png', f'{P}/T_Trim_Cloth_ORM.png', other_sat=0.6, other_gain=0.72, grit_k=0.1)
mats['MI_Banner'] = dict(mats['MI_Trim_Cloth'])

# ── 3. materials that only get a per-material colour correction at run time ──
for k in ['Leaves_TwistedTree', 'Leaves_NormalTree', 'Leaves', 'Leaves_Pine', 'Grass', 'Flowers']: mats[k] = {'sat': 0.55, 'gain': 0.55}
for k in ['Bark_NormalTree', 'Bark_DeadTree', 'Bark_TwistedTree']: mats[k] = {'sat': 0.55, 'gain': 0.6}
for k in ['Rocks', 'PathRocks', 'Mushrooms']: mats[k] = {'sat': 0.5, 'gain': 0.7}
mats['MI_Vine'] = {'sat': 0.6, 'gain': 0.55}

json.dump({'grade': {'sat': 0.92, 'gain': 1.0, 'tint': [1.0, 0.985, 0.96], 'weather': 0.55}, 'materials': mats}, open(os.path.join(OUT, 'SKIN.json'), 'w'), indent=1)
json.dump(sorted(set(p for _, p in prov)), open(os.path.join(OUT, 'sources.json'), 'w'))
tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print('skin:', len(mats), 'materials,', len([f for f in os.listdir(OUT) if f.endswith('.webp')]), 'textures,', round(tot / 1e6, 2), 'MB ->', OUT)
