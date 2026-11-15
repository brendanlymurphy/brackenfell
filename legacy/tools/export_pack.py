#!/usr/bin/env python3
"""Writes the shippable image pack from the baked masters.  usage: export_pack.py <master dir> <dist/tex dir>"""
import sys, os, numpy as np
from PIL import Image
M, OUT = sys.argv[1], sys.argv[2]
NAMES = ['plaster', 'timber', 'planks', 'stone', 'cobble', 'thatch', 'shingle', 'dirt', 'grass', 'rock', 'bark', 'grass2', 'forest', 'mud', 'soil', 'gravel', 'moss', 'plain', 'birch', 'pine', 'leaves', 'impostor', 'cloth', 'metal', 'stripes']
os.makedirs(OUT, exist_ok=True); tot = 0
for n in (sys.argv[3:] or NAMES):
    a = Image.open(os.path.join(M, n + '_a.png')).convert('RGBA')
    nar = np.asarray(Image.open(os.path.join(M, n + '_n.png')).convert('RGBA'))
    fa = os.path.join(OUT, 'a_' + n + '.webp'); a.save(fa, 'WEBP', quality=84, alpha_quality=75, method=6, exact=True)
    mos = np.concatenate([np.concatenate([nar[..., 0], nar[..., 1]], 1), np.concatenate([nar[..., 2], nar[..., 3]], 1)], 0)   # nx ny / ao rough
    fn = os.path.join(OUT, 'n_' + n + '.jpg'); Image.fromarray(mos, 'L').save(fn, 'JPEG', quality=78, optimize=True)
    sa, sn = os.path.getsize(fa), os.path.getsize(fn); tot += sa + sn
    print(f'{n:8s} albedo {sa / 1024:6.0f} KB   maps {sn / 1024:6.0f} KB')
print('total', round(tot / 1e6, 1), 'MB')
