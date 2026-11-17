# [audit] Offline analysis of shots/audit/world.json (made by test/audit/dump.js): map, doors, barriers, trees, outside-against-inside.
# usage: python3 test/audit/analyse.py   -> docs/audit/map.png, docs/audit/tables.json, prints a summary
import json, math, collections, sys
from PIL import Image, ImageDraw
W = json.load(open('shots/audit/world.json'))
H = {h['id']: h for h in W['houses']}
LO, HI, RES = -130.0, 130.0, 0.25
N = int((HI - LO) / RES)
gg = W['groundGrid']
def ground(x, z):
    fx = min(max((x + 130) / 2, 0), 129.999); fz = min(max((z + 130) / 2, 0), 129.999); i = int(fx); j = int(fz); a = fx - i; b = fz - j
    return (gg[j][i] * (1 - a) + gg[j][i + 1] * a) * (1 - b) + (gg[j + 1][i] * (1 - a) + gg[j + 1][i + 1] * a) * b
def district(x, z):
    if x > 52: return 'Outside (east of the river)'
    if abs(x) > 62 or z < -84 or z > 88: return 'Outside'
    if z < -30: return 'Chapelgate'
    if z > 32: return 'Wharfside'
    if x > 24: return 'Riverside'
    if x < -30: return 'Westgate'
    if z > 10 and x < -4: return 'Upper Ward'
    return 'Market Place'
# ---- blocked grid for a walker: any collider between 0.45 and 1.5 m above the ground there, grown by a body radius of 0.3
blocked = bytearray(N * N); R = 0.3
barriers = []
for c in W['colliders']:
    if len(c) == 5:
        x, z, r, y0, y1 = c; g = ground(x, z)
        if y1 < g + 0.45 or y0 > g + 1.5: continue
        rr = r + R; i0 = int((x - rr - LO) / RES); i1 = int((x + rr - LO) / RES) + 1; j0 = int((z - rr - LO) / RES); j1 = int((z + rr - LO) / RES) + 1
        for j in range(max(j0, 0), min(j1, N)):
            for i in range(max(i0, 0), min(i1, N)):
                px = LO + (i + .5) * RES; pz = LO + (j + .5) * RES
                if (px - x) ** 2 + (pz - z) ** 2 < rr * rr: blocked[j * N + i] = 1
    else:
        x, z, hx, hz, ang, y0, y1, off = c
        if off: continue
        g = ground(x, z)
        if y1 < g + 0.45 or y0 > g + 1.5: continue
        ca, sa = math.cos(ang), math.sin(ang); ext = math.hypot(hx, hz) + R
        i0 = int((x - ext - LO) / RES); i1 = int((x + ext - LO) / RES) + 1; j0 = int((z - ext - LO) / RES); j1 = int((z + ext - LO) / RES) + 1
        for j in range(max(j0, 0), min(j1, N)):
            for i in range(max(i0, 0), min(i1, N)):
                dx = LO + (i + .5) * RES - x; dz = LO + (j + .5) * RES - z; lx = dx * ca + dz * sa; lz = -dx * sa + dz * ca
                if abs(lx) < hx + R and abs(lz) < hz + R: blocked[j * N + i] = 1
        L, T = max(hx, hz), min(hx, hz)
        if L >= 1.0 and T <= 0.45 and (y1 - g) < 6 and abs(x) < 125 and abs(z) < 125: barriers.append(dict(x=x, z=z, L=L * 2, T=T * 2, ang=ang if hx >= hz else ang + math.pi / 2, top=round(y1 - g, 2), y0=y0))
# water and steep ground stop a walker too
lake = W['lakeY']
for j in range(N):
    for i in range(N):
        px = LO + (i + .5) * RES; pz = LO + (j + .5) * RES
        if ground(px, pz) < lake - 0.9: blocked[j * N + i] = 1
def cell(x, z): return int((x - LO) / RES), int((z - LO) / RES)
def flood(sx, sz, maxd=None, target=None):
    i, j = cell(sx, sz); dist = {}; q = collections.deque()
    if blocked[j * N + i]:
        best = None
        for dj in range(-4, 5):
            for di in range(-4, 5):
                if 0 <= i + di < N and 0 <= j + dj < N and not blocked[(j + dj) * N + i + di]:
                    d = di * di + dj * dj
                    if best is None or d < best[0]: best = (d, i + di, j + dj)
        if not best: return dist
        i, j = best[1], best[2]
    dist[j * N + i] = 0; q.append((i, j))
    while q:
        i, j = q.popleft(); d = dist[j * N + i]
        if maxd and d >= maxd: continue
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            a, b = i + di, j + dj
            if 0 <= a < N and 0 <= b < N and not blocked[b * N + a] and (b * N + a) not in dist:
                dist[b * N + a] = d + 1; q.append((a, b))
    return dist
main = flood(0, -6)
def reach(x, z, tol=3):
    i, j = cell(x, z)
    for dj in range(-tol, tol + 1):
        for di in range(-tol, tol + 1):
            if (j + dj) * N + i + di in main: return True
    return False
# ---- doors
doors = []
for h in W['houses']:
    for d in h['xdoors']:
        ox, oy, oz = d['out']; cx, cy, cz = d['c']; g = ground(ox, oz)
        # what stands in front of the door: first blocked cell on the outward ray, up to 8 m
        nx, nz = ox - cx, oz - cz; l = math.hypot(nx, nz) or 1; nx /= l; nz /= l; clear = 8.0
        for k in range(8, 33):
            t = k * 0.25; i, j = cell(cx + nx * t, cz + nz * t)
            if blocked[j * N + i]: clear = t; break
        doors.append(dict(id=h['id'], name=h['name'], x=cx, z=cz, sillAboveGround=round(cy - 1 - ground(cx, cz), 2), outAboveGround=round(oy - g, 2), reach=reach(ox, oz), clearAhead=clear, district=district(cx, cz)))
# kit door pieces with no portal within 1.6 m
portals = [i for i in W['interact'] if i.get('kind') == 'portal' and i['p'][1] > -100]
fake = []
for k in W['kit']:
    n, x, y, z, yaw = k
    if not ('Door' in n or 'door' in n): continue
    if abs(x) > 400 or y < -100: continue
    near = min((math.hypot(x - p['p'][0], z - p['p'][2]) for p in portals), default=99)
    if near > 1.8: fake.append(dict(piece=n, x=x, y=y, z=z, nearestPortal=round(near, 1), district=district(x, z)))
# ---- barriers that block nothing: stand 0.8 m either side of the middle; how far is it to walk round
walkround = []
for b in barriers:
    if b['top'] < 0.6: continue
    nx, nz = -math.sin(b['ang']), math.cos(b['ang'])
    a = (b['x'] + nx * (b['T'] / 2 + 0.75), b['z'] + nz * (b['T'] / 2 + 0.75)); c = (b['x'] - nx * (b['T'] / 2 + 0.75), b['z'] - nz * (b['T'] / 2 + 0.75))
    ia = cell(*a); ic = cell(*c)
    if blocked[ia[1] * N + ia[0]] or blocked[ic[1] * N + ic[0]]: b['sides'] = 'one side solid'; continue
    d = flood(a[0], a[1], maxd=400); k = ic[1] * N + ic[0]
    b['detour'] = round(d[k] * RES, 1) if k in d else None
    b['district'] = district(b['x'], b['z'])
    if b['detour'] is not None and b['detour'] <= 25: walkround.append(b)
# ---- trees
trees = collections.Counter(); treeList = []
for sp, arr in W['trees'].items():
    for t in arr:
        if abs(t[0]) < 130 and abs(t[2]) < 130: trees[(district(t[0], t[2]), sp)] += 1; treeList.append((t[0], t[2], sp))
green = collections.Counter()
for k in W['kit']:
    if abs(k[1]) < 130 and abs(k[3]) < 130 and k[2] > -100:
        n = k[0]; kind = 'vine on a wall' if 'Vine' in n else 'flower pot' if n.startswith('dr_fpot') else 'stump or dead trunk' if 'stump' in n or 'dead_tree' in n else None
        if kind: green[(district(k[1], k[3]), kind)] += 1
# ---- outside against inside
mism = []
for h in W['houses']:
    p = h.get('plan'); s = h['site']; sp = h['spec']
    if not p: continue
    ks = sp.get('kitStyle') or {}
    out_st = 2 if ks.get('up') else 1
    lv = [int(k) for k in p['levels']]; in_up = len([k for k in lv if k >= 0]); cellar = any(k < 0 for k in lv)
    d = p.get('dims') or {}
    fa_out = s['w'] * s['d']; fa_in = (d.get('W') or 0) * (d.get('D') or 0)
    winOut = len(sp.get('windows', [])); winIn = len(p.get('windows', []))
    hearths = len(p.get('hearths') or [])
    chim = sum(1 for k in W['kit'] if 'himney' in k[0] and math.hypot(k[1] - s['x'], k[3] - s['z']) < max(s['w'], s['d']) * 0.75)
    mism.append(dict(id=h['id'], name=h['name'], out=f"{s['w']}x{s['d']}", inn=f"{d.get('W')}x{d.get('D')}", areaOut=round(fa_out), areaIn=round(fa_in), ratio=round(fa_in / fa_out, 1), stOut=out_st, stIn=in_up, cellar=cellar, winOut=winOut, winIn=winIn, balconyOut=bool(ks.get('balcony')), hearthsIn=hearths, chimneysOut=chim, doorsOut=len(h['xdoors']), doorsInExt=sum(1 for q in p['pdoors'] if q.get('b') is None), rooms=len(p['rooms']), trade=(p.get('fam') or {}).get('trade'), family=(p.get('fam') or {}).get('fam')))
# ---- households
res = collections.defaultdict(list)
for n in W['npcs']:
    hs = n['def'].get('house')
    if not hs:
        spots = [s[1].split('.')[0] for s in n['def'].get('sched', []) if s[2] == 'lie']
        hs = spots[0] if spots else None
        if spots and spots[0] in ('in','shop','high'): hs = '.'.join([s[1] for s in n['def'].get('sched', []) if s[2] == 'lie'][0].split('.')[:2])
    res[hs].append(n['name'])
# ---- map
S = 6; im = Image.new('RGB', (int(260 * S), int(260 * S)), (232, 228, 214)); dr = ImageDraw.Draw(im)
def P(x, z): return ((x - LO) * S, (z - LO) * S)
px = im.load()
for j in range(N):
    for i in range(N):
        k = j * N + i
        col = None
        if blocked[k]: col = (150, 150, 150)
        elif k not in main: col = (255, 205, 150)
        if col:
            for a in range(int(i * RES * S), int((i + 1) * RES * S) + 1):
                for b in range(int(j * RES * S), int((j + 1) * RES * S) + 1):
                    if a < im.width and b < im.height: px[a, b] = col
for j in range(0, N, 2):
    for i in range(0, N, 2):
        x = LO + i * RES; z = LO + j * RES
        if ground(x, z) < lake: dr.point(P(x, z), (120, 160, 210))
for h in W['houses']:
    s = h['site']; c, n = math.cos(s['yaw']), math.sin(s['yaw']); pts = []
    for u, v in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        lx, lz = u * s['w'] / 2, v * s['d'] / 2; pts.append(P(s['x'] + lx * c - lz * n, s['z'] + lx * n + lz * c))
    if abs(s['x']) < 130 and abs(s['z']) < 130: dr.polygon(pts, fill=(120, 96, 78), outline=(40, 30, 20)); dr.text(P(s['x'] - 2.5, s['z'] - 1), h['id'], fill=(255, 255, 255))
for x, z, sp in treeList: dr.ellipse([P(x - 1.2, z - 1.2), P(x + 1.2, z + 1.2)], outline=(30, 120, 40), width=2)
for d in doors:
    if abs(d['x']) < 130 and abs(d['z']) < 130: dr.ellipse([P(d['x'] - .6, d['z'] - .6), P(d['x'] + .6, d['z'] + .6)], fill=(0, 160, 0) if d['reach'] else (230, 0, 0))
for f in fake: dr.rectangle([P(f['x'] - .5, f['z'] - .5), P(f['x'] + .5, f['z'] + .5)], outline=(230, 0, 200), width=2)
for b in walkround:
    ca, sa = math.cos(b['ang']), math.sin(b['ang']); dr.line([P(b['x'] - ca * b['L'] / 2, b['z'] - sa * b['L'] / 2), P(b['x'] + ca * b['L'] / 2, b['z'] + sa * b['L'] / 2)], fill=(230, 120, 0), width=3)
for gx in range(-120, 121, 20):
    dr.line([P(gx, LO), P(gx, HI)], fill=(200, 196, 182)); dr.line([P(LO, gx), P(HI, gx)], fill=(200, 196, 182)); dr.text(P(gx + .5, LO + .5), str(gx), fill=(90, 90, 90)); dr.text(P(LO + .5, gx + .5), str(gx), fill=(90, 90, 90))
im.save('docs/audit/map.png'); im.crop((int(60 * S), int(40 * S), int(200 * S), int(225 * S))).save('docs/audit/map_town.png')
T = dict(doors=doors, fakeDoors=fake, barriers=len(barriers), walkround=walkround, trees={f'{k[0]}|{k[1]}': v for k, v in trees.items()}, green={f'{k[0]}|{k[1]}': v for k, v in green.items()}, mismatch=mism, residents=res)
json.dump(T, open('docs/audit/tables.json', 'w'), indent=1)
print('doors', len(doors), 'not reached by the flood', [d['id'] for d in doors if not d['reach']])
print('doors with something solid within 2 m straight ahead', [(d['id'], d['clearAhead']) for d in doors if d['clearAhead'] <= 2.0])
print('door sill above ground > 0.6', [(d['id'], d['sillAboveGround']) for d in doors if abs(d['sillAboveGround']) > 0.6])
print('kit door pieces with no portal', len(fake), collections.Counter(f['piece'] for f in fake))
print('barriers', len(barriers), 'walk-round within 25 m', len(walkround), collections.Counter(b['district'] for b in walkround))
print('trees', sorted(trees.items())); print('green', sorted(green.items()))
print('houses with no resident', [h['id'] for h in W['houses'] if h['id'] not in res]); print('resident groups', {k: v for k, v in res.items() if k not in H})
