# [audit] Does the cast in the running game match docs/PEOPLE.md? Compares the world dump with the cast and building tables.
# usage: python3 test/audit/cast_vs_game.py [world.json]   (exit 1 on any difference; --summary prints counts only)
import json, re, sys, collections
A = sys.argv[1:]; W = json.load(open(next((a for a in A if a.endswith('.json')), 'shots/audit/world.json'))); t = open('docs/PEOPLE.md').read()
sec = lambda a, b: t[t.index(a):t.index(b)]
cast = [[c.strip() for c in r.split('|')[1:-1]] for r in sec('## 4. The cast', '### What changes').split('\n') if r.startswith('| ') and not r.startswith('| id |') and not r.startswith('|---')]
want = {c[0]: dict(name=c[1], home=re.search(r'`([a-z0-9.]+)`', c[4]).group(1)) for c in cast}
STORY = dict(hale='guardhouse', greta='inn', brandt='smithy', tobin='smithy', marta='store', aldous='chapel', maren='herbalist', osric='mill', edda='farm', finn='fisher', lark='inn', wren='hunter', rowan='elder', pip='weaver', ivo='guardhouse', hilda='weaver', bram='in.67')
names = {n['name']: n for n in W['npcs']}; ids = {n['id']: n for n in W['npcs']}; bad = collections.defaultdict(list)
plan = collections.Counter()
try:
    for l in json.load(open('tools/voice/plan.json'))['plan']: plan[l.get('speaker')] += 1
except Exception: pass
def home(n):
    lie = [s[1] for s in n['def'].get('sched', []) if s[2] == 'lie' and isinstance(s[1], str)]; h = n['def'].get('house')
    if not h and lie: p = lie[0].split('.'); h = '.'.join(p[:2]) if p[0] in ('in', 'shop', 'high') else p[0]
    return h, bool(lie)
for cid, w in want.items():
    n = names.get(w['name']) or ids.get(cid)
    if not n: bad['in PEOPLE.md, not in the game'].append(w['name']); continue
    h, bed = home(n)
    if h != w['home']: bad['sleeps in the wrong building'].append(f"{w['name']}: {h} (table: {w['home']})")
    if not bed: bad['no bed in the day'].append(w['name'])
    if not n.get('talk') and plan.get(n['id'], 0) == 0: bad['no lines'].append(w['name'])
    elif plan.get(n['id'], 0) < 6: bad['fewer than 6 lines in the voice plan'].append(f"{w['name']}: {plan.get(n['id'], 0)}")
for sid, hm in STORY.items():
    n = ids.get(sid)
    if not n: bad['story person missing'].append(sid); continue
    h, bed = home(n)
    if h != hm: bad['story person sleeps elsewhere than the table says'].append(f'{sid}: {h} (table: {hm})')
    if not bed: bad['no bed in the day'].append(n['name'])
known = set(w['name'] for w in want.values())
for n in W['npcs']:
    if n['id'] not in STORY and n['name'] not in known: bad['in the game, not in PEOPLE.md'].append(n['name'])
for k, v in bad.items(): print(f'{k}: {len(v)}' + ('' if '--summary' in A else '  ' + '; '.join(v[:80])))
print('cast table', len(want), '+ story', len(STORY), '| game', len(W['npcs']), '| differences', sum(len(v) for v in bad.values()))
sys.exit(1 if bad else 0)
