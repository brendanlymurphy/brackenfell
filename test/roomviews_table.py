# python3 test/roomviews_table.py <outdir> [ids...]  -> markdown table rows: house | room | level | verdict | what ROOMS_SPEC says an empty room holds
# Verdicts are a first pass from pixels and plan facts: dark (mean luma < 30), leaf (a warm plank band >= 18% wide at an image edge, none in the middle),
# stair (a stair or stairwell footprint within 3 m ahead on the view line), empty (no floor item over 0.3 m in the room, or under 2.5% of the frame's pixels on an edge: plaster and nothing else),
# else room. A room is "room" when any of its views is; otherwise the verdict of its first view. Check flagged rows by eye on the sheet.
import sys, os, json, re
from PIL import Image
import numpy as np
out = sys.argv[1]; ids = sys.argv[2:] or sorted(d for d in os.listdir(out) if os.path.exists(f'{out}/{d}/views.json'))
t = open(os.path.join(os.path.dirname(__file__), '..', 'src', '72n_rooms.js')).read().split('\n')[1]
S = json.loads(re.search(r'const ROOMS_SPEC = (\{.*\});?\s*$', t).group(1))
def verdict(path, v):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); H, W, _ = a.shape; L = a.mean(2)
    if L.mean() < 30: return 'dark by day'
    def wood(b): r, g, bl = b[..., 0], b[..., 1], b[..., 2]; return ((r > g) & (g > bl) & (r - bl > 40) & (b.mean(2) > 50) & (b.mean(2) < 170)).mean()
    w = int(W * 0.18); lw, rw, mw = wood(a[:, :w]), wood(a[:, W - w:]), wood(a[:, W // 3: 2 * W // 3])
    if max(lw, rw) > 0.6 and mw < 0.3: return 'leaf in the face'
    if v.get('stair'): return 'stair in the way'
    gy, gx = np.gradient(L)
    if v['items'] == 0 or (np.hypot(gx, gy) > 12).mean() < 0.025: return 'empty'
    return 'room'
rows = []
for id in ids:
    V = json.load(open(f'{out}/{id}/views.json')); by = {}
    for v in V:
        p = f"{out}/{id}/{v['n']}_13.jpg"
        if os.path.exists(p): by.setdefault((v['room'], v['k']), []).append((verdict(p, v), v))
    for (room, k), lst in by.items():
        vs = [x[0] for x in lst]; ver = 'room' if 'room' in vs else vs[0]
        spec = (S.get(id, {}).get('rooms', {}).get(room) or {})
        hold = ''
        if ver == 'empty':
            hold = (spec.get('use', '?') + ': ' + ', '.join(f'{n} x{c}' for n, c in spec.get('furn', [])) + ('; hearth' if spec.get('hearth') else '') + ('; only here: ' + spec['only'] if spec.get('only') else '')) if spec else 'not in ROOMS_SPEC'
        rows.append((id, room, k, ver, hold, lst[0][1].get('items', 0), '/'.join(vs)))
print('| house | room | level | verdict | views | floor items | ROOMS_SPEC says it should hold |'); print('|---|---|---|---|---|---|---|')
for r in rows: print(f'| {r[0]} | {r[1]} | L{r[2]} | {r[3]} | {r[6]} | {r[5]} | {r[4]} |')
from collections import Counter
print(); print('counts: ' + ', '.join(f'{k} {n}' for k, n in Counter(r[3] for r in rows).most_common()), file=sys.stderr)
