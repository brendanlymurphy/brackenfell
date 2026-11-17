# [audit] docs/audit/buildings.md: every building, who lives there, what they do, how one can tell from outside; and outside against inside. usage: python3 test/audit/buildings.py
import json, math, collections
W = json.load(open('shots/audit/world.json')); S = json.load(open('shots/audit/shells.json')); T = json.load(open('docs/audit/tables.json'))
M = {m['id']: m for m in T['mismatch']}; R = T['residents']; missing = {m.split('.front')[0] for m in S['miss']}
signs = [k for k in W['kit'] if 'sign' in k[0].lower() or 'banner' in k[0].lower()]
def sign_near(s): return sum(1 for k in signs if math.hypot(k[1] - s['x'], k[3] - s['z']) < max(s['w'], s['d']) * 0.5 + 2.5)
o = ['# Every building: who lives there, what do they do, how can you tell from outside', '',
     'Made by `python3 test/audit/buildings.py` from the world dump. "Sign" = a kit sign or banner piece within 2.5 m of the walls (generated signs that are not kit pieces are not counted, so 0 means "none found", to be checked by eye). Trade is the interior plan\'s `fam.trade`.', '',
     '## A. The 57 enterable buildings, outside against inside', '',
     '| id | name | x, z | lives there | trade | sign | outside w x d | inside W x D | area x | storeys out / in | cellar | windows out / in | balcony out |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|']
noAnswer = []
for h in W['houses']:
    s = h['site']; m = M.get(h['id'])
    if not m: continue
    res = R.get(h['id'], []); sg = sign_near(s)
    o.append(f"| `{h['id']}` | {h['name']} | {s['x']:.0f}, {s['z']:.0f} | {', '.join(res) or '**nobody**'} | {m['trade'] or '(designed)'} | {sg} | {m['out']} | {m['inn']} | **{m['ratio']}** | {m['stOut']} / {m['stIn']} | {'yes' if m['cellar'] else ''} | {m['winOut']} / {m['winIn']} | {'yes' if m['balconyOut'] else ''} |")
    if not res or m['trade'] == 'household': noAnswer.append((h['id'], h['name'], 'nobody lives there' if not res else 'no trade: "household"'))
o += ['', f'Ground floor inside at least twice the footprint: {sum(1 for m in M.values() if m["ratio"] >= 2)} of {len(M)}; three times: {sum(1 for m in M.values() if m["ratio"] >= 3)}. Windows: {sum(m["winOut"] for m in M.values())} outside, {sum(m["winIn"] for m in M.values())} inside. Storey count differs: {sum(1 for m in M.values() if m["stOut"] != m["stIn"])} (outside storeys are read from the shell\'s `kitStyle.up`; the seven hand-designed buildings without that flag are counted as 1 and may be wrong: inn, smithy, farm, fisher).', '',
      '## B. The 75 buildings that cannot be entered', '',
      'Who lives there: nobody, in every row. What do they do: nothing. How can you tell from outside: you cannot; every one is called "House".', '',
      '| id | x, z | w x d | floors | district tag | door faces a wall (no standing room 4 to 13 m in front) | outside stair to an upper door |', '|---|---|---|---|---|---|---|']
for s in sorted(S['shells'], key=lambda s: int(s['id'].split('.')[1])):
    o.append(f"| `{s['id']}` | {s['x']:.0f}, {s['z']:.0f} | {s['w']} x {s['d']} | {s['floors']} | {s.get('dist') or '(none)'} | {'**yes**' if s['id'] in missing else ''} | {'yes' if s['stairs'] else ''} |")
o += ['| `barn` | 113, -3 | 9 x 7.5 | 1 | farm | | (open front, a cart and hay inside: the only honest one) |', '| `high.b` | 118, 90 | | 2 | Highfold | | message: "Bolted. Nobody is home: they are all at the wedding." No wedding exists. |', '| `high.barn` | 99, 114 | | 1 | Highfold | | message: "The barn door is chained. Sheep bleat behind it." |', '',
      '## C. Enterable buildings with no answer', '', '| id | name | why |', '|---|---|---|'] + [f'| `{a}` | {b} | {c} |' for a, b, c in noAnswer]
dup = collections.Counter(m['trade'] for m in M.values() if m['trade'] and m['trade'] != 'household')
o += ['', 'Trades held by two buildings: ' + ', '.join(f'{k} ({v})' for k, v in dup.items() if v > 1) + '.']
open('docs/audit/buildings.md', 'w').write('\n'.join(o) + '\n'); print(len(o), len(noAnswer), [ (h['id'], sign_near(h['site'])) for h in W['houses']][:14], len(signs))
