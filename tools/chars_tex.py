#!/usr/bin/env python3
"""Character textures for chars/: the packs' PNG atlases resized and saved as WebP.
usage: chars_tex.py <Universal Base Characters[Standard]> <Modular Character Outfits - Fantasy[Standard]> <out chars dir>"""
import sys, os
from PIL import Image
UBC, OUTF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
B, T = os.path.join(UBC, 'Base Characters', 'Textures'), os.path.join(OUTF, 'Textures')
JOBS = [  # out name, source, size, quality
    ('q_peasant', f'{T}/Peasant/T_Peasant_BaseColor.png', 1024, 86), ('q_peasant2', f'{T}/Peasant/T_Peasant_2_BaseColor.png', 1024, 86), ('q_peasant_n', f'{T}/Peasant/T_Peasant_Normal.png', 1024, 90),
    ('q_ranger', f'{T}/Ranger/T_Ranger_BaseColor.png', 1024, 86), ('q_ranger3', f'{T}/Ranger/T_Ranger_3_BaseColor.png', 1024, 86), ('q_ranger_n', f'{T}/Ranger/T_Ranger_Normal.png', 1024, 90),
    ('q_skin_m', f'{T}/Base/T_Regular_Male_Dark_BaseColor.png', 512, 86), ('q_skin_f', f'{T}/Base/T_Regular_Female_Dark_BaseColor.png', 512, 86),
    ('q_head_m', f'{B}/T_Superhero_Male_Dark.png', 1024, 88), ('q_head_f', f'{B}/T_Superhero_Female_Dark_BaseColor.png', 1024, 88),
    ('q_hair1', f'{B}/T_Hair_1_BaseColor.png', 512, 86), ('q_hair2', f'{B}/T_Hair_2_BaseColor.png', 512, 86), ('q_eye', f'{B}/T_Eye_Brown.png', 256, 90),
]
tot = 0
for name, src, size, q in JOBS:
    im = Image.open(src); im = im.convert('RGBA' if im.mode == 'RGBA' else 'RGB')
    if im.size[0] > size: im = im.resize((size, size), Image.LANCZOS)
    dst = os.path.join(OUT, name + '.webp'); im.save(dst, 'WEBP', quality=q, method=6)
    tot += os.path.getsize(dst); print(f'{name:12s} {im.size[0]:5d} {os.path.getsize(dst) // 1024:5d} KB')
print('total', tot // 1024, 'KB')
