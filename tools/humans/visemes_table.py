"""Builds chars/real/visemes.png + visemes.json: the face-shape table the game's vertex shader reads (src/49_chars.js, "face morphs").

Source: the MakeHuman Community 'functional' asset packs visemes02 (15 Oculus visemes) and faceunits01 (ARKit face units), CC0, by Mika Suominen
(https://static.makehumancommunity.org/assets/assetpacks/visemes02.html, .../faceunits01.html; zips at files.makehumancommunity.org/functional/).
Each target is a list of "base-mesh vertex, dx dy dz" in decimetres. This keeps the 19 channels below for the face vertices of the MakeHuman base mesh
(the first 13380 vertices; the helper geometry beyond is not in the game's bodies), as one row of an image per channel and one column per vertex:
R, G, B = delta / scale[channel] * 127 + 128. Two extra columns stand for the lower teeth and the tongue (they follow the jaw), one for the upper teeth (still).
usage: python visemes_table.py <dir with visemes02 and faceunits01 unpacked: targets/...> <out dir>
"""
import sys, os, json, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
VIS = ['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U']
UNITS = [['jawOpen'], ['browInnerUp'], ['browDownLeft', 'browDownRight'], ['mouthSmileLeft', 'mouthSmileRight']]
NAMES = ['viseme_' + v for v in VIS] + ['jawOpen', 'browInnerUp', 'browDown', 'mouthSmile']
NBASE = 13380
def load(p):
    d = {}
    for l in open(p):
        t = l.split()
        if len(t) == 4 and not l.startswith('#'): d[int(t[0])] = np.array([float(x) for x in t[1:]])
    return d
chan = []
for v in VIS: chan.append(load(f'{src}/targets/visemes/viseme_{v}.target'))
for u in UNITS:
    d = {}
    for n in u:
        for k, x in load(f'{src}/targets/faceunits/{n}.target').items(): d[k] = d.get(k, 0) + x
    chan.append(d)
idx = sorted({k for d in chan for k in d if k < NBASE})
row = {k: i + 1 for i, k in enumerate(idx)}          # row 0: no morph
nb = len(idx); W = nb + 4      # + zero, upper teeth, lower teeth, tongue
scale = [max(1e-6, max([np.abs(x).max() for k, x in d.items() if k < NBASE] or [0.0])) * 0.1 for d in chan]       # metres
# lower teeth and tongue follow the chin and the lower lip: the mean delta of the vertices that move most vertically in jawOpen (the chin and lower lip)
jaw = chan[15]; lower = [k for k, x in jaw.items() if k < NBASE and x[1] < -0.5 * min(v[1] for v in jaw.values())] 
img = np.full((len(chan), W, 4), 128, np.uint8); img[..., 3] = 255
for c, d in enumerate(chan):
    for k, x in d.items():
        if k in row: img[c, row[k], :3] = np.clip(np.round(x * 0.1 / scale[c] * 127 + 128), 0, 255)
    m = np.mean([d.get(k, np.zeros(3)) for k in lower], axis=0) if lower else np.zeros(3)
    img[c, nb + 2, :3] = np.clip(np.round(m * 0.1 / scale[c] * 127 + 128), 0, 255)          # lower teeth
    img[c, nb + 3, :3] = np.clip(np.round(m * 0.1 * 0.7 / scale[c] * 127 + 128), 0, 255)    # tongue, a little less
os.makedirs(out, exist_ok=True)
Image.fromarray(img, 'RGBA').save(f'{out}/visemes.png', optimize=True)
json.dump({'names': NAMES, 'scale': [round(s, 6) for s in scale], 'idx': idx, 'rows': W, 'upper': nb + 1, 'lower': nb + 2, 'tongue': nb + 3, 'refHead': 0.161}, open(f'{out}/visemes.json', 'w'), separators=(',', ':'))
print('channels', len(chan), 'columns', W, 'png', os.path.getsize(f'{out}/visemes.png'), 'bytes', 'scale mm', [round(s * 1000, 1) for s in scale])
