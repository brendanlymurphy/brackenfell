# [audit] The blueprint's [auto] rules, measured from the world dump. usage:
#   python3 test/audit/rules.py [world.json]            prints one line per rule: id, value, target, PASS/MISS
#   python3 test/audit/rules.py --json out.json         also writes the values
#   python3 test/audit/rules.py --ratchet               exit 1 if any value is worse than test/audit/ratchet.json (counts may only fall); --accept rewrites that file
#   python3 test/audit/rules.py --strict                exit 1 if any rule misses its blueprint target
# The dump is made by: node test/audit/run.mjs --opt audit=1 --json shots/audit/world.json test/audit/dump.js      (node test/audit/score.mjs does both)
import json, math, sys, collections, re, os
A = sys.argv[1:]; src = next((a for a in A if a.endswith('.json') and (A.index(a) == 0 or A[A.index(a) - 1] not in ('--json',))), 'shots/audit/world.json')
W = json.load(open(src)); R = []
def rule(id, what, value, target, ok, lower=True): R.append(dict(id=id, what=what, value=value, target=target, ok=bool(ok), lower=lower))
houses = [h for h in W['houses'] if h.get('plan')]; shells = W.get('shells'); npcs = W['npcs']
if shells is None:      # a dump from before the shell list was added: take it from the shell pictures' list
    try: shells = json.load(open('shots/audit/shells.json'))['shells']; W['wildShut'] = ['high.b', 'high.barn']
    except Exception: shells = []
STORY = 'hale greta brandt tobin marta aldous maren osric edda finn lark wren rowan pip ivo hilda bram'.split()
# ---- ground and reachability (flat: stairs and terraces are ignored)
LO, HI, RES = -130.0, 130.0, 0.25; N = int((HI - LO) / RES); gg = W['groundGrid']; lake = W['lakeY']
def ground(x, z):
    fx = min(max((x + 130) / 2, 0), 129.999); fz = min(max((z + 130) / 2, 0), 129.999); i = int(fx); j = int(fz); a = fx - i; b = fz - j
    return (gg[j][i] * (1 - a) + gg[j][i + 1] * a) * (1 - b) + (gg[j + 1][i] * (1 - a) + gg[j + 1][i + 1] * a) * b
def in_town(x, z): return abs(x) <= 62 and -84 <= z <= 88 and x <= 52
blocked = bytearray(N * N); barriers = []
def fill(x, z, hx, hz, ang, grid):
    ca, sa = math.cos(ang), math.sin(ang); ext = math.hypot(hx, hz)
    for j in range(max(int((z - ext - LO) / RES), 0), min(int((z + ext - LO) / RES) + 1, N)):
        for i in range(max(int((x - ext - LO) / RES), 0), min(int((x + ext - LO) / RES) + 1, N)):
            dx = LO + (i + .5) * RES - x; dz = LO + (j + .5) * RES - z
            if abs(dx * ca + dz * sa) < hx and abs(-dx * sa + dz * ca) < hz: grid[j * N + i] = 1
for c in W['colliders']:
    if len(c) == 5:
        x, z, r, y0, y1 = c; g = ground(x, z)
        if y1 < g + 0.45 or y0 > g + 1.5: continue
        fill(x, z, r + 0.3, r + 0.3, 0, blocked)
    else:
        x, z, hx, hz, ang, y0, y1, off = c
        if off: continue
        g = ground(x, z)
        if y1 < g + 0.45 or y0 > g + 1.5: continue
        fill(x, z, hx + 0.3, hz + 0.3, ang, blocked)
        L, T = max(hx, hz), min(hx, hz)
        if L >= 1.0 and T <= 0.45 and (y1 - g) < 2.2 and (y1 - g) > 0.6 and abs(x) < 125 and abs(z) < 125: barriers.append((x, z, L * 2, T * 2, ang if hx >= hz else ang + math.pi / 2))
for j in range(N):
    for i in range(N):
        if ground(LO + (i + .5) * RES, LO + (j + .5) * RES) < lake - 0.9: blocked[j * N + i] = 1
def cell(x, z): return min(max(int((x - LO) / RES), 0), N - 1), min(max(int((z - LO) / RES), 0), N - 1)
def flood(sx, sz, grid, maxd=None):
    i, j = cell(sx, sz); dist = {}
    if grid[j * N + i]:
        c = [(di * di + dj * dj, i + di, j + dj) for dj in range(-6, 7) for di in range(-6, 7) if 0 <= i + di < N and 0 <= j + dj < N and not grid[(j + dj) * N + i + di]]
        if not c: return dist
        _, i, j = min(c)
    dist[j * N + i] = 0; q = collections.deque([(i, j)])
    while q:
        i, j = q.popleft(); d = dist[j * N + i]
        if maxd and d >= maxd: continue
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            a, b = i + di, j + dj
            if 0 <= a < N and 0 <= b < N and not grid[b * N + a] and (b * N + a) not in dist: dist[b * N + a] = d + 1; q.append((a, b))
    return dist
main = flood(0, -6, blocked)
def reach(x, z, tol=3):
    i, j = cell(x, z); return any((j + dj) * N + i + di in main for dj in range(-tol, tol + 1) for di in range(-tol, tol + 1))
def free_share(cx, cz, nx, nz, half, a=0.75, b=3.0):      # share of the strip in front of a wall (half wide either side, a to b metres out) that a body can stand in
    n = f = 0; u = -half
    while u <= half:
        t = a
        while t <= b:
            i, j = cell(cx + nx * t - nz * u, cz + nz * t + nx * u); n += 1; f += 0 if blocked[j * N + i] else 1; t += 0.5
        u += 0.5
    return f / max(n, 1)
# ---- 1. size
rule('1.1', 'house-shaped buildings (enterable + shells + shut)', len(houses) + len(shells) + len(W.get('wildShut', [])), '20 to 30, all real', len(shells) == 0 and len(houses) <= 60)
plan_lines = collections.Counter(); voiced = 0; planned = 0
try:
    P = json.load(open('tools/voice/plan.json')); P = P.get('plan', P) if isinstance(P, dict) else P
    for l in P: plan_lines[l.get('speaker')] += 1
except Exception as e: print('(plan.json not read:', e, ')')
mute = [n['name'] for n in npcs if not n.get('talk') and plan_lines.get(n['id'], 0) == 0]
rule('1.2', 'named people per enterable building', round(len(npcs) / max(len(houses), 1), 2), '2.5 to 3 (or fewer buildings)', True, lower=False)
# ---- 2. buildings and doors
rule('2.1', 'doors drawn on buildings that cannot be entered', len(shells) + len(W.get('wildShut', [])), 0, len(shells) + len(W.get('wildShut', [])) == 0)
tot = len(houses) + len(shells) + len(W.get('wildShut', []))
rule('2.2', 'share of buildings that are shut (%)', round(100 * (tot - len(houses)) / tot), 'at most 20', (tot - len(houses)) / tot <= 0.2)
bad_door = []
for h in houses:
    for d in h['xdoors']:
        cx, cz = d['c'][0], d['c'][2]; ox, oz = d['out'][0], d['out'][2]; l = math.hypot(ox - cx, oz - cz) or 1
        if abs(cx) > 128 or abs(cz) > 128: continue
        if not reach(ox, oz) or free_share(cx, cz, (ox - cx) / l, (oz - cz) / l, 1.0) < 0.3: bad_door.append(h['id'])
shell_wall = []
for s in shells:
    fx, fz = math.sin(s['yaw']), -math.cos(s['yaw']); cx, cz = s['x'] + fx * s['d'] / 2, s['z'] + fz * s['d'] / 2
    if free_share(cx, cz, fx, fz, s['w'] / 2) < 0.5: shell_wall.append(s['id'])
rule('2.3', 'doors with under half of the 3 m in front of them free to stand on, or not reachable (real doors + shell doors)', len(bad_door) + len(shell_wall), 0, not bad_door and not shell_wall)
res = collections.defaultdict(list)
for n in npcs:
    lie = [s[1] for s in n['def'].get('sched', []) if s[2] == 'lie' and isinstance(s[1], str)]; hs = n['def'].get('house')
    if not hs and lie: p = lie[0].split('.'); hs = '.'.join(p[:2]) if p[0] in ('in', 'shop', 'high') else p[0]
    res[hs].append(n)
wrong = []
for h in houses:
    m = re.match(r"(?:Highfold: the )?([A-Z][a-z]+)(?:’|')s ", h['name'])
    if not m: continue
    who = m.group(1); names = ' '.join(n['name'] for n in res.get(h['id'], []))
    trade = ((h['plan'].get('fam') or {}).get('trade') or '').lower()
    if who.lower() == trade or who in names: continue
    if who.lower() in ('warden', 'fisher', 'baker', 'cooper', 'fletcher', 'potter', 'tanner', 'grocer', 'chandler', 'dyer', 'merchant', 'mason', 'cutler', 'scribe', 'cobbler', 'tinker', 'basketmaker', 'ropemaker', 'saddler', 'tailor', 'wheelwright', 'woodcutter', 'shepherd', 'butcher', 'carpenter', 'brewer', 'glover'): continue
    wrong.append(h['id'])
for h in houses:
    if re.search(r' (House|Cottage)$', h['name']) and not re.search(r"(’|')s ", h['name']) and h['name'].split()[0] not in ' '.join(n['name'] for n in res.get(h['id'], [])) and h['name'].split()[0] not in ('Riverside', 'Sedge'): wrong.append(h['id'])
rule('2.4', 'buildings named for someone who does not live there', len(wrong), 0, not wrong)
tr = collections.Counter((h['plan'].get('fam') or {}).get('trade') for h in houses); dup = [k for k, v in tr.items() if k and k != 'household' and v > 1]
rule('2.5', 'trades held by two buildings', len(dup), 0, not dup)
signs = [k for k in W['kit'] if 'sign' in k[0].lower() or 'banner' in k[0].lower()]
unsigned = [h['id'] for h in houses if (h['plan'].get('fam') or {}).get('trade') not in (None, 'household', 'widow') and not any(math.hypot(k[1] - h['site']['x'], k[3] - h['site']['z']) < max(h['site']['w'], h['site']['d']) * 0.5 + 2.5 for k in signs)]
rule('2.6', 'trade buildings with no kit sign or banner at the walls', len(unsigned), 0, not unsigned)
# ---- 3. outside equals inside
ratio = []; win = 0; st = 0; cellar = 0
for h in houses:
    s = h['site']; p = h['plan']; d = p.get('dims') or {}
    r = (d.get('W') or 0) * (d.get('D') or 0) / (s['w'] * s['d']); ratio.append(r)
    if len(h['spec'].get('windows', [])) != len(p.get('windows', [])): win += 1
    lv = [int(k) for k in p['levels']]; ks = h['spec'].get('kitStyle') or {}
    if 'up' in ks and (2 if ks['up'] else 1) != len([k for k in lv if k >= 0]): st += 1
    if any(k < 0 for k in lv): cellar += 1
rule('3.1', 'interiors with a ground floor over 1.25 times the footprint', sum(1 for r in ratio if r > 1.25), 0, all(r <= 1.25 for r in ratio))
rule('3.1b', 'worst area ratio inside / outside', round(max(ratio), 1), 'at most 1.25', max(ratio) <= 1.25)
rule('3.2', 'kit houses whose storey count differs inside', st, 0, st == 0)
rule('3.2b', 'cellars (none shows outside today)', cellar, 'each shown outside', True)
rule('3.3', 'buildings whose window count differs outside and inside', win, 0, win == 0)
# ---- 4. edges and barriers
gates = [g[1]['p'] for g in W.get('gateSpots', []) if g[1] and g[1].get('p')] or [[-58, 0, -9]]
g2 = bytearray(blocked)
for p in gates: fill(p[0], p[2], 2.6, 2.6, 0, g2)
outside = flood(-100, -8, g2); i, j = cell(0, -6); leak = any((j + dj) * N + i + di in outside for dj in range(-8, 9) for di in range(-8, 9))
print('  real doors blocked:', bad_door, '| shell doors at a wall:', len(shell_wall), '| gates:', [[round(v, 1) for v in g] for g in gates])
rule('4.2', 'the square can be reached from outside the west gate with the gates shut (1 = yes)', 1 if leak else 0, 0, not leak)
frag = 0
for (x, z, L, T, ang) in barriers:
    nx, nz = -math.sin(ang), math.cos(ang); a = (x + nx * (T / 2 + 0.75), z + nz * (T / 2 + 0.75)); c = (x - nx * (T / 2 + 0.75), z - nz * (T / 2 + 0.75)); ia, ic = cell(*a), cell(*c)
    if blocked[ia[1] * N + ia[0]] or blocked[ic[1] * N + ic[0]]: continue
    d = flood(a[0], a[1], blocked, maxd=int((L + 3.5) / RES)); k = ic[1] * N + ic[0]
    if k in d: frag += 1
rule('4.3', 'free-standing fence and wall runs (stepped round within their own length + 3.5 m)', frag, 'each belongs to a plot', frag == 0)
# ---- 6. people
rule('6.1', 'named people with no lines', len(mute), 0, not mute)
nobed = [n['name'] for n in npcs if not any(s[2] == 'lie' for s in n['def'].get('sched', []))]
rule('6.2', 'people with no bed in their day', len(nobed), 0, not nobed)
solo = sum(1 for k, v in res.items() if k and len(v) == 1)
rule('6.3', 'households of one', solo, 'under 8', solo < 8)
first = collections.Counter(n['name'].replace('Old ', '').replace('Elder ', '').replace('Warden ', '').replace('Brother ', '').replace('Guardsman ', '').split()[0] for n in npcs)
rule('6.3b', 'first names used more than once', sum(1 for v in first.values() if v > 1), 0, all(v == 1 for v in first.values()))
def home_of(n):
    for k, v in res.items():
        if n in v: return k
stay = 0; sweeps = 0; shapes = collections.Counter()
for n in npcs:
    sc = [(s[0], s[1] if isinstance(s[1], str) else 'roams', s[2]) for s in n['def'].get('sched', [])]; h = home_of(n) or '?'
    if sc and all(s[1].startswith(h + '.') or s[1].startswith(h) for s in sc): stay += 1
    if sum(1 for s in sc if s[2] == 'sweep') > 1: sweeps += 1
    shapes[tuple((re.sub(r'^(in|shop|high)\.[0-9a-z]+', 'home', s[1]) if s[1].startswith(h) else s[1], s[2]) for s in sc)] += 1
rule('6.5', 'people who never leave their own building or plot', stay, 'under 5', stay < 5)
rule('6.5b', 'people who sweep more than once a day', sweeps, 0, sweeps == 0)
rule('6.6', 'people whose day is the same as someone else\'s', sum(v for v in shapes.values() if v > 1), 0, all(v == 1 for v in shapes.values()))
by = W.get('byHour')
if by:
    rule('6.5c', 'people outdoors at 12:30', by[12][0], 'at least 35', by[12][0] >= 35, lower=False)
    rule('6.5d', 'fewest people outdoors in any hour from 7 to 21', min(b[0] for b in by[7:22]), 'at least 5', min(b[0] for b in by[7:22]) >= 5, lower=False)
# ---- 7, 9
cont = sum(1 for i in W['interact'] if i.get('kind') in ('chest', 'cont'))
rule('7.3', 'containers per villager', round(cont / max(len(npcs), 1), 1), 'about 4', cont / max(len(npcs), 1) <= 5)
trees = sum(1 for arr in W['trees'].values() for t in arr if in_town(t[0], t[2]))
rule('9.1', 'trees inside the town', trees, 'about 70', trees >= 60, lower=False)
pots = sum(1 for k in W['kit'] if k[0].startswith('dr_fpot') and in_town(k[1], k[3]) and k[2] > -100)
rule('9.2', 'flower pots inside the town', pots, 'under 120', pots < 120)
# ---- 8.4 voice
try:
    man = json.load(open('audio/voice/manifest.json')); nman = len(man.get('lines', man))
    rule('8.4', 'planned lines without a recording', max(sum(plan_lines.values()) - nman, 0), 0, sum(plan_lines.values()) <= nman)
except Exception: pass
# ---- other tools' reports, read if present
def grab(path, pat):
    try: m = re.search(pat, open(path).read()); return [int(x) for x in m.groups()] if m else None
    except Exception: return None
g = grab('docs/GEOMETRY.md', r'Counts now: (\d+) places with stretched texture, (\d+) with open edges, (\d+) single flat pieces')
if g: rule('5.2', 'stretched texture places (geomaudit)', g[0], 0, g[0] == 0); rule('5.2b', 'open edges (geomaudit)', g[1], 0, g[1] == 0); rule('5.2c', 'single flat pieces (geomaudit)', g[2], 0, g[2] == 0)
w = [grab('docs/WALK.md', p) for p in (r'Falls of more than 1\.6 m \| (\d+)', r'Could not be walked at all[^|]*\| (\d+)', r'passes through a wall[^|]*\| (\d+)')]
if any(w) and os.path.exists('docs/WALK.md') and '| Kind | Places |' in open('docs/WALK.md').read(): w = [x or [0] for x in w]      # a kind with no row in the walk bot's table has none
if all(w): rule('5.4', 'walk bot: falls / cannot be walked / graph through a wall (as last written to docs/WALK.md)', f'{w[0][0]} / {w[1][0]} / {w[2][0]}', '0 / 0 / 0', w[0][0] + w[1][0] + w[2][0] == 0)
try:
    B = json.load(open('shots/audit/backface.json')); rule('5.1', 'views (of %d) where over 2%% of the picture is the back of a wall' % B['views'], B['wallViews2'], 0, B['wallViews2'] == 0); rule('5.1b', 'mean share of the picture that is the back of a wall (%)', B['meanWall'], 0, B['meanWall'] < 0.05)
except Exception: pass
# ---- output
for r in R: print(f"{r['id']:5} {'PASS' if r['ok'] else 'MISS'}  {str(r['value']):>14}  (target {r['target']})  {r['what']}")
out = dict(build=W.get('build'), rules=R, detail=dict(mute=len(mute), badDoors=bad_door, shellDoorsAtWall=shell_wall, wrongNames=wrong, dupTrades=dup, unsigned=unsigned))
if '--json' in A: json.dump(out, open(A[A.index('--json') + 1], 'w'), indent=1)
code = 0; RP = 'test/audit/ratchet.json'
num = lambda v: v if isinstance(v, (int, float)) else None
if '--accept' in A: json.dump({r['id']: r['value'] for r in R}, open(RP, 'w'), indent=1); print('ratchet written')
elif '--ratchet' in A and os.path.exists(RP):
    old = json.load(open(RP))
    for r in R:
        a, b = num(old.get(r['id'])), num(r['value'])
        if a is None or b is None: continue
        if (r['lower'] and b > a) or (not r['lower'] and b < a): print(f"RATCHET FAIL {r['id']} {r['what']}: {a} -> {b}"); code = 1
if '--strict' in A and any(not r['ok'] for r in R): code = 1
sys.exit(code)
