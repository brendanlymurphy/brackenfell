#!/usr/bin/env python3
"""Downloads tiling PBR textures from Poly Haven at 1k and writes kits/tex/<name>_color.webp, _normal.webp (OpenGL convention,
as in glTF), _orm.webp (R = ambient occlusion, G = roughness, B = metalness).
usage: textures.py <download dir> <kits/tex dir>"""
import sys, os, json, io, urllib.request
from PIL import Image
DL, OUT = sys.argv[1], sys.argv[2]
SETS = {  # our name: (Poly Haven id, metres one repeat covers on the original scan, what it is for)
 'wood_beam': ('rough_wood', 'rough weathered timber: beams, posts, lintels'),
 'wood_planks_dark': ('weathered_planks', 'dark weathered boards: walls, doors, shutters'),
 'wood_planks_brown': ('weathered_brown_planks', 'brown weathered boards'),
 'wood_door_studded': ('medieval_wood', 'studded oak planks: heavy doors, gates'),
 'wood_siding': ('dark_planks', 'overlapping dark clapboards: barn and boathouse walls'),
 'plaster_clean': ('plastered_wall_04', 'smooth lime plaster'),
 'plaster_white_worn': ('white_rough_plaster', 'flaking whitewash'),
 'plaster_rough': ('medieval_wall_01', 'rough white render'),
 'plaster_damaged': ('damaged_plaster', 'plaster fallen away over brick'),
 'plaster_mossy': ('worn_mossy_plasterwall', 'damp stained plaster with moss'),
 'plaster_clay': ('clay_plaster', 'ochre clay daub'),
 'stone_wall_rubble': ('castle_wall_slates', 'grey rubble masonry'),
 'stone_wall_blocks': ('rustic_stone_wall', 'squared rustic blocks'),
 'stone_wall_old': ('old_stone_wall', 'old mortared fieldstone'),
 'stone_wall_mossy': ('mossy_stone_wall', 'dark stones with mossy joints'),
 'stone_wall_drystack': ('rock_wall_10', 'dry-stacked dark rock: field walls, foundations'),
 'roof_slate': ('roof_slates_02', 'weathered stone slates'),
 'roof_slate_grey': ('roof_slates_03', 'regular grey slates'),
 'roof_slate_mossy': ('red_slate_roof_tiles_01', 'slates under moss and lichen'),
 'roof_clay_tiles': ('clay_roof_tiles_02', 'orange clay pantiles'),
 'roof_tiles_old': ('roof_07', 'old mossy tiles'),
 'roof_thatch': ('reed_roof_03', 'straw thatch'),
 'roof_thatch_dark': ('thatch_roof_angled', 'old dark thatch'),
 'cobble_grey': ('cobblestone_floor_08', 'rounded grey setts'),
 'cobble_small': ('cobblestone_05', 'small worn setts'),
 'cobble_mossy': ('mossy_cobblestone', 'setts with moss in the joints'),
 'flagstone': ('monastery_stone_floor', 'large irregular flagstones'),
 'flagstone_tan': ('stone_pathway', 'tan crazy paving'),
 'floor_boards_dark': ('old_wood_floor', 'dark old floor boards'),
 'floor_boards_worn': ('old_wooden_floor_02', 'worn polished boards'),
 'floor_boards_raw': ('raw_wooden_floor_01', 'pale scrubbed boards'),
}
UA = {'User-Agent': 'brackenfell-asset-fetch/1.0'}
def get(url, path):
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r: data = r.read()
        open(path, 'wb').write(data)
    return path
def pick(files, keys):
    for k in keys:
        if k in files and '1k' in files[k]:
            e = files[k]['1k']; f = e.get('jpg') or e.get('png'); return f['url']
    return None
os.makedirs(OUT, exist_ok=True); info = {}; total = 0
for name, (pid, use) in SETS.items():
    d = os.path.join(DL, 'tex_' + pid); fj = get('https://api.polyhaven.com/files/' + pid, os.path.join(d, 'files.json')); files = json.load(open(fj))
    aj = get('https://api.polyhaven.com/info/' + pid, os.path.join(d, 'info.json')); meta = json.load(open(aj))
    col = pick(files, ['Diffuse', 'diff', 'diffuse']); nor = pick(files, ['nor_gl']); arm = pick(files, ['arm'])
    if not (col and nor and arm): print('SKIP', name, pid, [k for k in files][:12]); continue
    c = Image.open(get(col, os.path.join(d, 'color.' + col.split('.')[-1]))).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    n = Image.open(get(nor, os.path.join(d, 'normal.' + nor.split('.')[-1]))).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    a = Image.open(get(arm, os.path.join(d, 'arm.' + arm.split('.')[-1]))).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    c.save(os.path.join(OUT, name + '_color.webp'), 'WEBP', quality=80, method=6)
    n.save(os.path.join(OUT, name + '_normal.webp'), 'WEBP', quality=86, method=6)
    a.save(os.path.join(OUT, name + '_orm.webp'), 'WEBP', quality=72, method=6)
    sz = sum(os.path.getsize(os.path.join(OUT, name + s)) for s in ('_color.webp', '_normal.webp', '_orm.webp')); total += sz
    dims = meta.get('dimensions') or [0, 0]
    info[name] = {'source': pid, 'url': 'https://polyhaven.com/a/' + pid, 'authors': sorted((meta.get('authors') or {}).keys()), 'use': use, 'metres': [round(x / 1000, 2) for x in dims[:2]] if dims and dims[0] else None, 'bytes': sz}
json.dump(info, open(os.path.join(OUT, 'TEXTURES.json'), 'w'), indent=1)
print(len(info), 'texture sets', round(total / 1e6, 1), 'MB')
