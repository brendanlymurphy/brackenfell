# [audit] Blueprint 4.1 (no lawn inside the town). Inside = west of the river, inside the ellipse that the palisade follows ((x/62)^2 + ((z-2)/84)^2 < 1, read
# from the Build 83 picture from above), not under water, not under a building or prop at body height. Every 2 m lattice point of that open ground is
# classed by its colour in the straight-down picture (test/audit/lawn.js): green = grass.   usage: python3 test/audit/lawn.py [world.json water.json top.jpg out.jpg]
import json, math, collections, sys
from PIL import Image, ImageDraw
exec(open('test/audit/rules.py').read().split('# ---- 1. size')[0].replace("A = sys.argv[1:]", "A = sys.argv[1:2]"))
WD = json.load(open(sys.argv[2] if len(sys.argv) > 2 else 'shots/audit/water.json'))['depth']
wet = lambda x, z: WD[min(max(int(round(z)) + 130, 0), 260)][min(max(int(round(x)) + 130, 0), 260)] > 0.05
inside = lambda x, z: (in_town(x, z) if W.get('groundEdge') else ((x / 62) ** 2 + ((z - 2) / 84) ** 2 < 1 and x < 52)) and not wet(x, z)      # the game's own edge when the build has one
L = json.load(open('shots/audit/lawn.json'))['pts']; im = Image.open(sys.argv[3] if len(sys.argv) > 3 else 'docs/audit/lawn_top.jpg').convert('RGB'); px = im.load(); Wd, Ht = im.size
cls = collections.Counter(); byd = collections.defaultdict(collections.Counter); d = ImageDraw.Draw(im)
def district(x, z):
    if z < -30: return 'Chapelgate'
    if z > 32: return 'Wharfside'
    if x > 24: return 'Riverside'
    if x < -30: return 'Westgate'
    if z > 10 and x < -4: return 'Upper Ward'
    return 'Market Place'
for x, z, u, v in L:
    if not inside(x, z): continue
    i, j = cell(x, z)
    if blocked[j * N + i]: continue
    X, Y = int(u * Wd), int(v * Ht)
    if not (2 <= X < Wd - 2 and 2 <= Y < Ht - 2): continue
    r = g = b = 0
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1): c = px[X + dx, Y + dy]; r += c[0]; g += c[1]; b += c[2]
    k = 'grass' if g > r * 1.08 and g > b * 1.1 else 'other'
    cls[k] += 1; byd[district(x, z)][k] += 1
    if k == 'grass': d.rectangle([X - 3, Y - 3, X + 3, Y + 3], outline=(255, 0, 255), width=2)
im.save(sys.argv[4] if len(sys.argv) > 4 else 'docs/audit/lawn_marked.jpg', quality=70)
tot = sum(cls.values()); print('open ground points inside:', tot, 'grass:', cls['grass'], '(%d%%), about %d m2' % (round(100 * cls['grass'] / tot), cls['grass'] * 4))
for k, v in sorted(byd.items()): print('  %-13s %4d points, grass %3d%%' % (k, sum(v.values()), round(100 * v['grass'] / sum(v.values()))))
json.dump(dict(points=tot, grass=cls['grass'], byDistrict={k: dict(v) for k, v in byd.items()}), open('shots/audit/lawn_result.json', 'w'))
