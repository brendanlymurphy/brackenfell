# [audit] docs/audit/QUESTWALK.md from a questwalk.mjs run. usage: python3 test/audit/questwalk.py <run dir with questwalk.json> <build> > table (markdown rows)
import json, sys, re
d = json.load(open(sys.argv[1] + '/questwalk.json')); T = [t for t in d['timeline'] if t.get('pic') and t['pic'] != '01_title']
print('| # | Stage | What the walker did | Ended | Prompt there | Picture |'); print('|---|---|---|---|---|---|')
for t in T:
    m = re.match(r'(\w+) (\d+): (.*?) \| (.*) \| ended (.*?) m from the target \(height (.*?)\), prompt "(.*)"', t['note'])
    if not m: print('|', t['pic'], '|', t['note'][:200].replace('|', '/'), '| | | |'); continue
    q, s, text, legs, dist, dy, pr = m.groups()
    print(f"| {t['pic'][:2]} | {q} {s}: {text} | {legs.replace('|', '/')[:300]} | {dist} m ({dy} up), {t.get('cell') or 'outdoors'} | {pr} | `{t['pic']}` |")
print(); print('unsticks', d.get('unsticks'), 'struck edges', len(d.get('struck', [])) // 2)
