# draws /tmp/townmap.json to a PNG (1 px = 0.25 m; x east, z south). usage: python3 tools/townmap.py [json] [png] [x0 z0 x1 z1]
import json, sys, math
from PIL import Image, ImageDraw, ImageFont
j = json.load(open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/townmap.json'))
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/townmap.png'
x0, z0, x1, z1 = (map(float, sys.argv[3:7]) if len(sys.argv) > 6 else (-100, -100, 100, 130))
S = 6
W, H = int((x1 - x0) * S), int((z1 - z0) * S)
im = Image.new('RGB', (W, H), (60, 80, 50)); d = ImageDraw.Draw(im)
P = lambda x, z: ((x - x0) * S, (z - z0) * S)
lk = j['LAKE']; d.ellipse([*P(lk['x'] - lk['r'], lk['z'] - lk['r']), *P(lk['x'] + lk['r'], lk['z'] + lk['r'])], fill=(50, 90, 130))
d.line([P(*p[:2]) for p in j['RIVER']], fill=(70, 110, 160), width=int(9 * S))
for r in j['ROADS']: d.line([P(*p[:2]) for p in r['line']], fill=(150, 130, 100), width=max(2, int(r['w'] * S)))
sq = j['SQUARE']; d.ellipse([*P(sq['x'] - sq['rx'], sq['z'] - sq['rz']), *P(sq['x'] + sq['rx'], sq['z'] + sq['rz'])], fill=(120, 120, 115))
for f in j['FIELDS']: d.rectangle([*P(f['x0'], f['z0']), *P(f['x1'], f['z1'])], fill=(100, 80, 50))
def rect(s, col, fill=None):
    c, sn = math.cos(s['yaw']), math.sin(s['yaw']); pts = []
    for lx, lz in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
        a, b = lx * s['w'] / 2, lz * s['d'] / 2; pts.append(P(s['x'] + a * c - b * sn, s['z'] + a * sn + b * c))
    d.polygon(pts, outline=col, fill=fill)
    fx, fz = s['x'] + (-s['d'] / 2) * (-sn) , s['z'] + (-s['d'] / 2) * c   # front (local -z)
    d.line([P(s['x'], s['z']), P(fx, fz)], fill=(255, 255, 0), width=2)
    d.text(P(s['x'] - 2, s['z'] - 1), s['id'].replace('in.', 'i'), fill=(255, 255, 255))
for s in j['SITES']: rect(s, (255, 255, 255), (90, 60, 40))
im.save(out); print(out, W, H)
