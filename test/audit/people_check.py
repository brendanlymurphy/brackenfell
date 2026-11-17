# [audit] checks docs/PEOPLE.md against its own rules: every enterable building has a row, names unique and clear of story names, lines per person, totals.
# usage: python3 test/audit/people_check.py   (exit 1 on a failure)
import re, sys, json, collections
t = open('docs/PEOPLE.md').read(); bad = []
STORY = 'hale greta brandt tobin marta aldous maren osric edda finn lark wren rowan pip ivo hilda bram corwin dunstan hob garrick'.split()
sec = lambda a, b: t[t.index(a):t.index(b)]
bl = re.findall(r'^\| `([a-z0-9.]+)` \|', sec('## 3. The buildings', '## 4. The cast'), re.M)
cast = [[c.strip() for c in r.split('|')[1:-1]] for r in sec('## 4. The cast', '### What changes').split('\n') if r.startswith('| ') and not r.startswith('| id |') and not r.startswith('|---')]
names = [c[1] for c in cast]; first = [n.split()[-1] if n.startswith('Old ') else n.split()[0] for n in names]
dup = [k for k, v in collections.Counter(first).items() if v > 1]
if dup: bad.append('first names used twice: ' + str(dup))
for f in first:
    for s in STORY:
        if f.lower() == s or (len(f) > 3 and f.lower()[:4] == s[:4]): bad.append(f'{f} is too close to the story name {s}')
try:
    W = json.load(open('shots/audit/world.json')); want = [h['id'] for h in W['houses'] if h.get('plan')]
    miss = [i for i in want if i not in bl]
    if miss: bad.append('enterable buildings with no row: ' + str(miss))
    for c in cast:
        if not re.search(r'`([a-z0-9.]+)`', c[4]) or re.search(r'`([a-z0-9.]+)`', c[4]).group(1) not in want: bad.append(c[1] + ' sleeps in a building that is not enterable: ' + c[4])
except FileNotFoundError: print('(no world dump: building ids not checked)')
L = sec('## 5. Lines', '## 6. Twelve scenes'); blocks = re.split(r'\n\*\*', L)[1:]; total = 0; per = {}
for b in blocks:
    nm = b.split('**')[0]; keys = re.findall(r'^- (\w+)', b, re.M); per[nm] = keys; total += len(keys)
    need = ['g', 'me', 'nb', 'pt', 'b1', 'b2'] + ([] if len(keys) == 6 else ['g2', 'nt'])
    if sorted(keys) != sorted(need): bad.append(f'{nm}: lines {keys}')
    for ln in re.findall(r'^- \w+(?: \[\w+\])?: (.+)$', b, re.M):
        if len(ln) > 190: bad.append(f'{nm}: a line of {len(ln)} characters')
        if re.search(r'south.west', ln, re.I): bad.append(f'{nm}: says south-west')
for n in names:
    if n not in per and not any(k.startswith(n) for k in per): bad.append('no lines for ' + n)
sc = sec('## 6. Twelve scenes', '## 7. Where people are'); sl = sum(len(re.findall(r'\*\*\w[\w ]*\*\*:', r)) for r in sc.split('\n') if re.match(r'\d+\. ', r))
print('buildings', len(bl), 'cast', len(cast), 'line blocks', len(blocks), 'lines', total, 'scene lines', sl, 'total', total + sl, 'days', -(-(total + sl) // 100))
print('voices', dict(collections.Counter(c[3] for c in cast)))
for b in bad: print('FAIL', b)
sys.exit(1 if bad else 0)
