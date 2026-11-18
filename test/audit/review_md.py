# [audit] docs/review/BUILD_NN.md from the slice camera's frames: every frame listed, pass unless named in FAULTS (written by the reviewer after
# looking at every frame). usage: python3 test/audit/review_md.py <frames dir> <build> <faults.json> > docs/review/BUILD_NN.md
import json, sys, os, glob, collections
src, build, F = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
P = json.load(open(src + '/points.json')); where = {}
for s in P['segs']:
    for i, x, y, z, yaw in s['pts']: where[(s['name'], i)] = (x, round(y - 1.6, 1), z, yaw)
order = ['ngate', 'chapel', 'nout', 'west', 'alley', 'hart', 'ring']
fs = sorted((os.path.basename(f)[:-4] for f in glob.glob(src + '/*.jpg')), key=lambda n: (order.index(n.split('_')[0]), n))
fault = {}
for k, v in F['faults']:
    for n in k.split(','): fault.setdefault(n.strip(), []).append(v)
skip = set(F.get('notplayer', []))
cnt = collections.Counter()
rows = []
for n in fs:
    seg, i, d, h = n.split('_'); w = where.get((seg, int(i)))
    v = '; '.join(fault[n]) if n in fault else ('not a player view: ' + F['notplayer_why'] if n in skip else 'pass')
    cnt['fault' if n in fault else 'skip' if n in skip else 'pass'] += 1
    rows.append(f"| `{n}` | {w[0]}, {w[2]} (ground {w[1]}) | {'ahead' if d == 'f' else 'behind'}, {'13:00' if h == 'd' else '22:00'} | {v} |")
print('\n'.join(F['head']).replace('{N}', str(len(fs))).replace('{P}', str(cnt['pass'])).replace('{F}', str(cnt['fault'])).replace('{S}', str(cnt['skip'])))
print('\n| Frame | x, z | Looking, hour | Verdict |\n|---|---|---|---|'); print('\n'.join(rows))
