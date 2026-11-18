# [audit] rank pairs of villagers with the same body who stand within 25 m of each other at some hour, by how alike they are dressed.
# usage: python3 test/audit/lookalikes.py shots/audit/lookalikes.json -> shots/audit/lookalike_pairs.json
import json, math, itertools, collections, sys
d = json.load(open(sys.argv[1])); L = {x['id']: x for x in d['looks']}; P = d['pos']
num = lambda v: v if isinstance(v, (int, float)) else 0.0
def cdist(a, b):
    if not isinstance(a, list) or not isinstance(b, list): return 0.0 if a == b else 1.0
    return math.sqrt(sum((num(x) - num(y)) ** 2 for x, y in zip(a, b)))
def tdist(a, b):
    if not a or not b: return 0.0 if a == b else 1.0
    return max(cdist(a.get(k), b.get(k)) for k in set(a) | set(b))
pairs = []
for a, b in itertools.combinations(L.values(), 2):
    if a['body'] != b['body']: continue
    diff = [k for k in ('skin', 'hair', 'hairStyle', 'hat') if a[k] != b[k]]
    td, tc, lc = tdist(a['tint'], b['tint']), cdist(a['top'], b['top']), cdist(a['legs'], b['legs']); wc = cdist(a['wear'], b['wear']) if a['wear'] and b['wear'] else 0.0
    score = len(diff) + min(td, 1) + min(tc * 3, 1) + min(lc * 3, 1) + min(wc * 2, 1)
    tog = [(h, c1 or 'out', round(math.hypot(x1 - x2, z1 - z2), 1)) for (h, c1, x1, z1), (_, c2, x2, z2) in zip(P[a['id']], P[b['id']]) if c1 == c2 and math.hypot(x1 - x2, z1 - z2) < 25]
    if tog: pairs.append(dict(a=a['id'], an=a['name'], b=b['id'], bn=b['name'], body=a['body'], diff=diff, tint=round(td, 2), top=round(tc, 2), legs=round(lc, 2), wear=round(wc, 2), score=round(score, 2), together=tog[:4], hours=len(tog)))
pairs.sort(key=lambda p: (p['score'], -p['hours']))
json.dump(pairs, open('shots/audit/lookalike_pairs.json', 'w'), indent=1)
print(len(pairs), 'same-body pairs seen within 25 m; with nothing different but colour shade (score < 1):', sum(1 for p in pairs if p['score'] < 1))
for p in pairs[:30]: print(p['score'], p['an'], '|', p['bn'], '|', p['body'], p['diff'], 'tint', p['tint'], 'top', p['top'], 'legs', p['legs'], 'wear', p['wear'], '|', p['hours'], 'h', p['together'][:2])
print(collections.Counter(x['body'] for x in L.values()).most_common())
