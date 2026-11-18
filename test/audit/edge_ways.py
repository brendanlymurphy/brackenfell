# [audit] Every way into the town on foot that is not a gate: shut every gate (a 2.6 m block at each gate spot the dump lists, and the east bridge
# gatehouse given by --shut x,z), treat water deeper than --deep (default 0.5 m) as a barrier, flood from points outside, trace the walk to the
# square, report where it crosses the palisade's line. usage: python3 test/audit/edge_ways.py world.json water.json [--shut 66,2.4] [--deep 0.5]
import json, math, collections, sys
A = sys.argv[1:]; WJ = A[0]; WAT = A[1]
DEEP = float(A[A.index('--deep') + 1]) if '--deep' in A else 0.5
SH = [tuple(map(float, A[i + 1].split(','))) for i, a in enumerate(A) if a == '--shut']
src = open('test/audit/rules.py').read().split('# ---- 1. size')[0].replace("A = sys.argv[1:]", "A = ['%s']" % WJ)
exec(src)
WD = json.load(open(WAT))['depth']
g2 = bytearray(blocked)
for j in range(N):
    for i in range(N):
        x = LO + (i + .5) * RES; z = LO + (j + .5) * RES
        if WD[min(max(int(round(z)) + 130, 0), 260)][min(max(int(round(x)) + 130, 0), 260)] > DEEP: g2[j * N + i] = 1
gates = [g[1]['p'] for g in W.get('gateSpots', []) if g[1] and g[1].get('p')]
for p in gates: fill(p[0], p[2], 2.6, 2.6, 0, g2)
for x, z in SH: fill(x, z, 3.0, 3.0, 0, g2)
def bfs(sx, sz):
    i, j = cell(sx, sz); prev = {j * N + i: -1}; q = collections.deque([(i, j)])
    while q:
        i, j = q.popleft()
        for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            a, b = i + di, j + dj
            if 0 <= a < N and 0 <= b < N and not g2[b * N + a] and b * N + a not in prev: prev[b * N + a] = j * N + i; q.append((a, b))
    return prev
out = []
for start in [(-100, -8), (0, -118), (100, -22), (-118, 60), (0, 125), (110, 60)]:
    prev = bfs(*start); ti, tj = cell(0, -6); t = next(((tj + dj) * N + ti + di for dj in range(-8, 9) for di in range(-8, 9) if (tj + dj) * N + ti + di in prev), None)
    if t is None: out.append((start, 'closed', None)); continue
    path = []; c = t
    while c != -1: path.append(c); c = prev[c]
    path.reverse(); P = [(round(LO + (k % N + .5) * RES, 1), round(LO + (k // N + .5) * RES, 1)) for k in path]
    out.append((start, round(len(P) * RES), P[::20]))
for o in out: print(o[0], o[1], o[2][:60] if o[2] else '')
print('gates shut:', [[round(v, 1) for v in g] for g in gates], 'extra:', SH)
