#!/usr/bin/env python3
"""Bakes the game's surface materials from CC0 scans (plus generated layouts for cobbles, thatch, slates, beams, bark).
usage: bake_tex.py <src_tex dir> <out master dir> [names...]"""
import sys, os, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texlib import *

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = set(sys.argv[3:])
P = lambda *a: os.path.join(SRC, *a)
RES = {}

def finish(name, albedo, alpha, n, ao, rough, note=''):
    save_master(OUT, name, albedo, alpha, n, ao, rough)
    RES[name] = (albedo, n, ao, rough)
    m = (albedo.reshape(-1, 3).mean(0) * 255).astype(int)
    print(f'{name:9s} mean sRGB {tuple(int(v) for v in m)}  ao {ao.mean():.2f}  rough {rough.mean():.2f}  slope {np.abs(n[..., :2]).mean():.3f}  {note}')

def scan(name, color, normal=None, rough=None, ao=None, height=None, spec=None, alpha='tint', nscale=1.0, hstrength=6.0,
         flat=0.0, g=None, rough_base=0.9, rough_k=0.5, ao_amount=1.0, target=None, tstr=1.0, square=False, post=None):
    if ONLY and name not in ONLY: return
    ld = (lambda p, mode='RGB': tile2(load_wide(p, mode))) if square else (lambda p, mode='RGB': load(p, S, mode))
    alb = ld(color)
    lum = gray(alb)
    h_in = gray(ld(height)) if height is not None and not isinstance(height, np.ndarray) else height
    proxy = h_in if h_in is not None else blur(lum, 1.5)
    note = ''
    if normal is not None:
        nrgb = ld(normal) if not isinstance(normal, np.ndarray) else normal
        n, cc = to_engine_normal(nrgb, proxy); note = f'normal axis check {cc}'
        h = h_in if h_in is not None else height_from_normal(n)
    else:
        h = h_in if h_in is not None else norm01(blur(lum, 1.0) * 0.6 + blur(lum, 4) * 0.4)
        n = normal_from_height(h, hstrength)
    if nscale != 1.0:
        n = n.copy(); n[..., :2] *= nscale; n[..., 2] = np.sqrt(np.clip(1 - (n[..., :2] ** 2).sum(-1), 0.04, 1)); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    a_o = gray(ld(ao)) if ao is not None else ao_from_height(norm01(h), ao_amount)
    if rough is not None: r = gray(ld(rough))
    elif spec is not None: r = np.clip(rough_base - gray(ld(spec)) * rough_k, 0.2, 1)
    else: r = np.clip(rough_base - (norm01(lum) - 0.5) * 0.12, 0.3, 1)
    if flat: alb = flatten(alb, 90, flat)
    if g: alb = grade(alb, **g)
    if target is not None: alb = match_mean(alb, np.asarray(target) / 255.0, tstr)
    al = norm01(h) if alpha == 'height' else np.ones_like(lum)
    if post: alb, al, n, a_o, r = post(alb, al, n, a_o, r, h)
    finish(name, alb, al, n, a_o, r, note)

def load_wide(path, mode='RGB'):
    from PIL import Image
    im = Image.open(path).convert(mode)
    a = np.asarray(im).astype(np.float32) / 255.0
    return cv2.resize(a, (S, S // 2), interpolation=cv2.INTER_AREA)

# ------------------------------------------------------------------ ground
scan('grass', P('sr3', 'grass_green_d.jpg'), normal=P('sr3', 'grass_green_n.jpg'), alpha='height', flat=0.75,
     g=dict(sat=0.64, gain=0.90, tint=(1.0, 0.985, 0.86)), rough_base=0.92, nscale=1.15)
scan('grass2', P('sr3', 'grass_ground_d.jpg'), normal=P('sr3', 'grass_ground_n.jpg'), spec=P('sr3', 'grass_ground_s.jpg'), height=P('sr3', 'grass_ground_h.jpg'),
     alpha='height', flat=0.7, g=dict(sat=0.74, gain=1.0), rough_base=0.95, rough_k=0.25)
scan('forest', P('ambientcg_t3d', 'ground037_alb_ht.png'), alpha='height', flat=0.6, g=dict(sat=0.80, gain=0.62, tint=(0.95, 1.0, 0.88)),
     normal=load(P('ambientcg_t3d', 'ground037_nrm_rgh.png'), S, 'RGB'), height=load(P('ambientcg_t3d', 'ground037_alb_ht.png'), S, 'RGBA')[..., 3],
     rough_base=0.95)
scan('dirt', P('cgbookcase', 'Sandy_gravel_01_Color.png'), normal=P('cgbookcase', 'Sandy_gravel_01_Normal.png'), rough=P('cgbookcase', 'Sandy_gravel_01_Roughness.png'),
     ao=P('cgbookcase', 'Sandy_gravel_01_AO.png'), alpha='height', flat=0.6, g=dict(sat=0.55, gain=0.86, tint=(1.0, 0.97, 0.92)))
scan('mud', P('sr3', 'ground_mud_d.jpg'), normal=P('sr3', 'ground_mud_n.jpg'), spec=P('sr3', 'ground_mud_s.jpg'), alpha='height', flat=0.6,
     g=dict(sat=0.6, gain=0.9, tint=(1.04, 0.98, 0.9)), rough_base=0.8, rough_k=0.5)
scan('soil', P('sr3', 'ground_mud2_d.jpg'), normal=P('sr3', 'ground_mud2_n.jpg'), spec=P('sr3', 'ground_mud2_s.jpg'), alpha='height', flat=0.7,
     g=dict(sat=0.55, gain=0.78, tint=(1.0, 0.95, 0.88)), rough_base=0.95, rough_k=0.2)
scan('gravel', P('sr3', 'stones_gray_d.jpg'), normal=P('sr3', 'stones_gray_n.jpg'), spec=P('sr3', 'stones_gray_s.jpg'), alpha='height', flat=0.5,
     g=dict(sat=0.7, gain=0.95, tint=(1.03, 1.0, 0.95)), rough_base=0.85, rough_k=0.4)
scan('moss', P('cgbookcase', 'Moss_01_Color.png'), normal=P('cgbookcase', 'Moss_01_Normal.png'), rough=P('cgbookcase', 'Moss_01_Roughness.png'), ao=P('cgbookcase', 'Moss_01_AO.png'),
     alpha='height', flat=0.6, g=dict(sat=0.8, gain=0.95))
scan('rock', P('ambientcg_mk', 'rock__Rock020_1K_Color.jpg'), normal=P('ambientcg_mk', 'rock__Rock020_1K_Normal.jpg'), rough=P('ambientcg_mk', 'rock__Rock020_1K_Roughness.jpg'),
     ao=P('ambientcg_mk', 'rock__Rock020_1K_AmbientOcclusion.jpg'), height=P('ambientcg_mk', 'rock__Rock020_1K_Displacement.jpg'), flat=0.5,
     g=dict(sat=0.7, gain=1.05, tint=(1.03, 1.0, 0.96)))
# ------------------------------------------------------------------ buildings (scan based)
scan('stone', P('ambientcg_pc', 'bricks076a__color.webp'), normal=P('ambientcg_pc', 'bricks076a__normal.webp'), rough=P('ambientcg_pc', 'bricks076a__roughness.webp'),
     ao=P('ambientcg_pc', 'bricks076a__ao.webp'), height=P('ambientcg_pc', 'bricks076a__height.webp'), g=dict(sat=0.75, gain=0.96, tint=(1.05, 1.02, 0.96)))
scan('plaster', P('ambientcg_tls', 'wall_plaster_dirty_Color.png'), normal=P('ambientcg_tls', 'wall_plaster_dirty_NormalGL.jpg'), rough=P('ambientcg_tls', 'wall_plaster_dirty_Roughness.jpg'),
     flat=0.35, g=dict(sat=0.9, gain=0.9, tint=(1.0, 0.985, 0.95)), ao_amount=0.5, nscale=1.3)
scan('planks', P('ambientcg_mk', 'wood-floor-43__WoodFloor043_1K_Color.jpg'), normal=P('ambientcg_mk', 'wood-floor-43__WoodFloor043_1K_Normal.jpg'),
     rough=P('ambientcg_mk', 'wood-floor-43__WoodFloor043_1K_Roughness.jpg'), ao=P('ambientcg_mk', 'wood-floor-43__WoodFloor043_1K_AmbientOcclusion.jpg'),
     height=P('ambientcg_mk', 'wood-floor-43__WoodFloor043_1K_Displacement.jpg'), square=True, g=dict(sat=0.85, gain=0.95))

# ------------------------------------------------------------------ hybrids: generated layout + scan detail
def master(name):
    """Albedo, normal, ao, rough of an already baked material (this run or a previous one)."""
    if name in RES: return RES[name]
    from PIL import Image
    a = np.asarray(Image.open(os.path.join(OUT, name + '_a.png'))).astype(np.float32) / 255
    n = np.asarray(Image.open(os.path.join(OUT, name + '_n.png'))).astype(np.float32) / 255
    nn = np.stack([n[..., 0] * 2 - 1, n[..., 1] * 2 - 1, np.zeros_like(n[..., 0])], -1)
    nn[..., 2] = np.sqrt(np.clip(1 - nn[..., 0] ** 2 - nn[..., 1] ** 2, 0.02, 1))
    return a[..., :3], nn, n[..., 2], n[..., 3]
def want(name): return not ONLY or name in ONLY
def per_cell(idm, k): return np.modf(idm * k + 0.137 * k)[0].astype(np.float32)        # extra random numbers from the cell id

if want('cobble'):
    rock_a, rock_n, _, _ = master('rock'); mud_a = master('mud')[0]; moss_a = master('moss')[0]
    f1, f2, idm, ox, oy = voronoi(S, 15, 7, jitter=0.82)
    wob = (pnoise(S, 9, 71, 3) - 0.5) * 0.10
    e = f2 - f1 + wob
    top = smooth(0.05, 0.26, e); dome = 1 - (1 - top) ** 2
    r1, r2, r3 = per_cell(idm, 7.3), per_cell(idm, 13.7), per_cell(idm, 29.1)
    det = sample_offset(gray(rock_a), r1 * S, r2 * S); det = (det - det.mean()) / (det.std() + 1e-6)
    tilt = (ox * (r1 - 0.5) + oy * (r2 - 0.5)) * 0.5                                    # each stone leans its own way
    h = dome * (0.52 + 0.30 * r3 + tilt * 0.35 + det * 0.035) * top + (1 - top) * 0.06 * pnoise(S, 60, 72, 2)
    h = np.clip(h, 0, 1)
    stone = sample_offset(rock_a, r1 * S, r2 * S)
    stone = grade(stone, sat=0.6, gain=1.25)
    tint = np.stack([0.92 + 0.22 * r3 + 0.10 * (r1 > 0.7), 0.92 + 0.20 * r3 + 0.04 * (r1 > 0.7), 0.90 + 0.20 * r3 + 0.06 * (r2 > 0.8)], -1)
    stone = np.clip(stone * tint, 0, 1)
    worn = smooth(0.55, 1.0, dome)[..., None]
    stone = stone * (0.82 + 0.26 * worn)                                                # tops polished lighter by feet and wheels
    mossm = smooth(0.52, 0.72, pnoise(S, 5, 73, 4))[..., None] * 0.75
    gapc = grade(mud_a, gain=0.55, sat=0.7) * (1 - mossm) + grade(moss_a, gain=0.8) * mossm
    alb = gapc * (1 - top[..., None]) + stone * top[..., None]
    n = normal_from_height(blur(h, 0.7), 9.0)
    ao = np.clip(ao_from_height(h, 1.4, (2, 5, 12)) * (0.45 + 0.55 * smooth(0.0, 0.18, e)), 0.2, 1)
    rough = np.clip(0.95 - 0.38 * top * (0.5 + 0.5 * dome) - 0.08 * det * top, 0.35, 1)
    finish('cobble', alb, np.ones_like(h), n, ao, rough)

def courses(rows, cols, seed, jit=0.5, ragged=0.0, stagger=0.5):
    """Staggered rows of tiles. Returns lu, lv in [0,1] inside each tile, a 0-1 id per tile, and the row index. v grows down-slope."""
    r = rng(seed)
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    u = (x + 0.5) / S; v = (y + 0.5) / S
    rag = (pnoise(S, 48, seed + 5, 2, aniso=(1, 0.08)) - 0.5) * ragged
    vv = v * rows + rag
    row = np.floor(vv).astype(int) % rows; lv = vv - np.floor(vv)
    offs = r.random(rows).astype(np.float32); jits = (r.random((rows, cols + 1)).astype(np.float32) - 0.5) * jit
    xx = u * cols + offs[row] + row * stagger
    k = np.floor(xx).astype(int)
    b0 = k + jits[row, k % cols]; b1 = k + 1 + jits[row, (k + 1) % cols]
    lft = xx < b0; rgt = xx >= b1
    k = np.where(lft, k - 1, np.where(rgt, k + 1, k))
    b0 = k + jits[row, k % cols]; b1 = k + 1 + jits[row, (k + 1) % cols]
    lu = (xx - b0) / (b1 - b0)
    ids = r.random((rows, cols)).astype(np.float32)
    return lu, lv, ids[row, k % cols], row, (b1 - b0)

if want('shingle'):
    rock_a = load(P('ambientcg_t3d', 'rock023_alb_ht.png'), S, 'RGB')
    lu, lv, idm, row, wd = courses(8, 6, 21, jit=0.45)
    r1, r2, r3 = per_cell(idm, 7.3), per_cell(idm, 13.7), per_cell(idm, 29.1)
    chip = pnoise(S, 40, 22, 3, aniso=(1, 0.2)) * 0.10 * (0.4 + r3)                    # broken lower edges
    edge = 1.0 - chip
    body = smooth(0.0, 0.035, lu * wd) * smooth(0.0, 0.035, (1 - lu) * wd) * (lv < edge)
    det = sample_offset(gray(rock_a), r1 * S, r2 * S); det = (det - det.mean()) / (det.std() + 1e-6)
    h = (0.25 + 0.60 * lv + (r3 - 0.5) * 0.14 + (lu - 0.5) * (r1 - 0.5) * 0.16 + det * 0.022) * body
    h = np.clip(h, 0, 1)
    slate = grade(sample_offset(rock_a, r1 * S, r2 * S), sat=0.5, gain=0.62)
    hue = np.stack([0.80 + 0.22 * r3 + 0.16 * (r2 > 0.78), 0.86 + 0.20 * r3 + 0.05 * (r2 > 0.78), 0.98 + 0.20 * r3 - 0.10 * (r2 > 0.78)], -1)
    slate = np.clip(slate * hue, 0, 1)
    lichen = smooth(0.66, 0.80, pnoise(S, 22, 23, 3))[..., None] * smooth(0.3, 0.9, pnoise(S, 3, 24, 2))[..., None] * 0.55
    slate = slate * (1 - lichen) + np.array([0.46, 0.47, 0.30], np.float32) * lichen
    under = smooth(0.0, 0.16, lv)                                                       # tucked under the course above
    alb = slate * (0.50 + 0.50 * under[..., None]) * body[..., None] + np.array([0.035, 0.035, 0.04], np.float32) * (1 - body[..., None])
    n = normal_from_height(blur(h, 0.6), 7.0)
    ao = np.clip((0.45 + 0.55 * under) * (0.35 + 0.65 * body), 0.15, 1)
    rough = np.clip(0.70 - 0.10 * det + 0.2 * lichen[..., 0], 0.4, 1)
    finish('shingle', alb, np.ones_like(h), n, ao, rough)

if want('thatch'):
    straw = load(P('sr3', 'savanna_dry_d.jpg'))
    lu, lv, idm, row, wd = courses(3, 1, 31, jit=0.0, ragged=0.16, stagger=0.0)
    fib = pnoise(S, 150, 32, 2, aniso=(1, 0.02)) * 0.6 + pnoise(S, 60, 33, 2, aniso=(1, 0.035)) * 0.4      # reeds run down the slope
    bundle = pnoise(S, 22, 34, 3, aniso=(1, 0.12))
    fine = pnoise(S, 330, 37, 1, aniso=(1, 0.012))
    weath = pnoise(S, 3, 35, 3)
    butt = smooth(0.80, 1.0, lv)                                                        # cut reed ends at the bottom of each course
    under = smooth(0.0, 0.12, lv)
    h = np.clip(0.18 + 0.50 * lv ** 1.3 + (fib - 0.5) * 0.22 + (bundle - 0.5) * 0.18 + (fine - 0.5) * 0.16, 0, 1)
    col_v = cv2.blur(np.tile(straw, (3, 1, 1)), (3, 151))[S:2 * S]                      # streak the scan along the reeds
    col_v = grade(match_mean(col_v, np.array([150, 124, 78]) / 255.0), sat=0.75)
    alb = col_v * (0.58 + 0.66 * fib[..., None]) * (0.84 + 0.32 * bundle[..., None]) * (0.74 + 0.52 * fine[..., None])
    alb = alb * (1 - 0.45 * smooth(0.45, 0.8, weath)[..., None]) + np.array([0.30, 0.28, 0.22], np.float32) * 0.45 * smooth(0.45, 0.8, weath)[..., None]
    alb = alb * (0.55 + 0.45 * under[..., None]) * (1.0 - 0.25 * butt[..., None] * (fib[..., None] < 0.45))
    mossm = (smooth(0.62, 0.78, pnoise(S, 6, 36, 4)) * smooth(0.2, 0.7, 1 - lv))[..., None] * 0.5
    alb = np.clip(alb * (1 - mossm) + np.array([0.24, 0.30, 0.13], np.float32) * mossm, 0, 1)
    n = normal_from_height(h, 13.0)
    ao = np.clip((0.40 + 0.60 * under) * (0.72 + 0.56 * (fib - 0.25)) * (0.8 + 0.4 * fine), 0.15, 1)
    finish('thatch', alb, np.ones_like(h), n, ao, np.full_like(h, 0.93))

if want('timber'):
    pa, pn, pao, pr = master('planks')
    from PIL import Image
    hh = tile2(gray(load_wide(P('ambientcg_mk', 'wood-floor-43__WoodFloor043_1K_Displacement.jpg'))))
    seam = (cv2.dilate((pao < 0.80).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0).astype(np.uint8)   # board joints of the floor scan
    def heal(img8):                                                                      # paint the joints out so one beam is one piece of wood
        big = np.tile(img8, (3, 3) + ((1,) if img8.ndim == 3 else ())); m = np.tile(seam, (3, 3))
        return cv2.inpaint(big, m, 5, cv2.INPAINT_TELEA)[S:2 * S, S:2 * S]
    wood = heal((pa * 255).astype(np.uint8)).astype(np.float32) / 255
    hw = heal((hh * 255).astype(np.uint8)).astype(np.float32) / 255
    checks = pnoise(S, 5, 41, 3, aniso=(1, 9))                                           # drying cracks along the grain
    crack = (1 - smooth(0.0, 0.035, np.abs(checks - 0.5))) * smooth(0.45, 0.7, pnoise(S, 3, 42, 2))
    adze = pnoise(S, 7, 43, 2, aniso=(1, 3))
    alb = grade(wood, gain=0.66, sat=0.8, contrast=1.3, tint=(1.0, 0.93, 0.84)) * (0.86 + 0.28 * adze[..., None]) * (1 - 0.65 * crack[..., None])
    h = np.clip(norm01(hw) * 0.5 + adze * 0.35 - crack * 0.5 + 0.2, 0, 1)
    n = normal_from_height(blur(h, 0.8), 5.0)
    finish('timber', np.clip(alb, 0, 1), np.ones_like(h), n, np.clip(1 - crack * 0.6, 0.3, 1) * (0.85 + 0.15 * adze), np.clip(0.80 - 0.1 * adze, 0.5, 1))

if want('bark'):
    src = np.rot90(load(P('sr3', 'mntn_dark_d.jpg')))                                   # layered rock on its side has the right grit
    lum = gray(src); det = lum - blur(lum, 6); det /= (det.std() + 1e-6)
    def ridges(freq, seed, an):
        f = pnoise(S, freq, seed, 2, aniso=(1, an)); return 1 - np.abs(f * 2 - 1)
    warp = (pnoise(S, 4, 55, 2) - 0.5) * 70
    fur = np.clip(smooth(0.74, 0.97, sample_offset(ridges(9, 52, 0.15), warp, warp * 0)) * 0.9 + smooth(0.82, 0.98, ridges(23, 53, 0.2)) * 0.5, 0, 1)
    plate = 1 - fur                                                                      # furrows run along the trunk (v)
    h = np.clip(plate * (0.60 + 0.25 * pnoise(S, 14, 54, 2, aniso=(1, 0.3))) + det * 0.07, 0, 1)
    base = match_mean(flatten(src, 60, 0.85), np.array([96, 80, 64]) / 255.0)
    alb = grade(base, sat=0.75, contrast=1.1) * (0.36 + 0.72 * plate[..., None])
    n = normal_from_height(blur(h, 0.8), 9.0)
    finish('bark', np.clip(alb, 0, 1), np.ones_like(h), n, np.clip(0.35 + 0.65 * plate, 0.2, 1), np.full_like(h, 0.92))

# ------------------------------------------------------------------ preview sheet
if RES:
    from PIL import Image, ImageDraw
    names = list(RES.keys()); th = 300
    for si in range(0, len(names), 6):
        part = names[si:si + 6]
        sheet = Image.new('RGB', (len(part) * th, th * 2 + 18), (16, 16, 16)); d = ImageDraw.Draw(sheet)
        for i, nm in enumerate(part):
            alb, n, ao, r = RES[nm]
            lit = lit_preview(alb, n, ao, r)
            crop = lambda a: a[:S * 3 // 4, :S * 3 // 4]                                 # three quarters of a tile, close to 1:2.5 scale
            for rowi, img in enumerate([crop(alb), crop(lit)]):
                sheet.paste(Image.fromarray((cv2.resize(img, (th, th), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)), (i * th, rowi * th))
            d.text((i * th + 4, th * 2 + 3), nm, fill=(235, 235, 235))
        fn = os.path.join(OUT, f'_sheet{si // 6}.jpg'); sheet.save(fn, quality=90); print('sheet', fn, sheet.size)
