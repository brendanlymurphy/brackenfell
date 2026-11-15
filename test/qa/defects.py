# Merge the sweep's raw results into one defect list and write docs/DEFECTS.md.
#   python3 -I test/qa/defects.py merge   -> /home/claude/shots/qa/defects.json (ids, severity, owner, shot call)
#   python3 -I test/qa/defects.py md      -> docs/DEFECTS.md (needs defects.json; screenshot paths where a file exists)
# Statuses are kept in test/qa/status.json ({id-key: "fixed"|"wontfix: why"|"reported"}); the key is stable across runs.
import json, os, re, sys, math, hashlib
OUT = '/home/claude/shots/qa'; ROOT = os.path.dirname(os.path.abspath(__file__)) + '/../..'
mode = sys.argv[1] if len(sys.argv) > 1 else 'merge'
load = lambda f, d=None: json.load(open(f)) if os.path.exists(f) else d
SEV = {'breaks play': 0, 'ugly': 1, 'minor': 2}

def owner(d):
    a, k, t = d['area'], d['k'], d['d']
    if a.startswith('cell.'): return 'fork-c2'
    if k in ('handprop',): return 'fork-c2 (77d_handprops)'
    if k in ('wedged', 'fall', 'climb', 'onwater'): return 'qa (78_player)'
    if k in ('look-black', 'look-white', 'look-glow', 'look-flat') and a.startswith('int.'): return 'fork-c2'
    if k in ('look-glow', 'look-white', 'look-black'): return 'fork-look'
    if a.startswith('wild.') or a.startswith('high.') or a in ('hamlet',) or a.startswith('place.wild') or a.startswith('wilds') or (a.startswith('open@') and (abs(d['x']) > 130 or abs(d['z']) > 130 or (d['x'] < -90))): return 'qa (79_wilds/55c_wilds)'
    if k == 'coplanar':
        if re.search(r'T_Wall|Wall_Uneven|Wall_Plaster|Corner_', t): return 'fork-c2 (71_kithouse)'
        if 'mesh:l20' in t: return 'fork-look (74_vegetation)'
        return 'fork-v2 (73d_infill)' if 'gen_' in t else 'fork-v2'
    if k in ('npcsep', 'twin', 'charsunk', 'charfloat', 'charinside', 'slide', 'treadmill'): return 'qa (49_chars/77)' if k in ('slide', 'treadmill') else 'fork-c2 (npc placement)'
    return 'fork-v2'

def severity(d):
    k, t, n = d['k'], d['d'], d.get('n', 1)
    if k in ('wedged', 'fall'): return 'breaks play'
    if k == 'door': return 'breaks play'
    if k == 'road': return 'breaks play' if ('main' in t or 'south' in t or 'north' in t) else 'ugly'
    if k in ('walkdrop',): return 'breaks play'
    if k in ('npcsep', 'twin', 'charinside', 'handprop', 'fencecross', 'roofhit', 'deckfloat', 'waterpost', 'float', 'sunk', 'look-black', 'look-white', 'look-glow', 'look-flat', 'look-jitter', 'charsunk', 'charfloat', 'fencedouble', 'climb', 'onwater', 'slide'): return 'ugly'
    if k == 'coplanar':
        return 'ugly' if (n >= 0.15 and 'mesh:l17 x mesh:l17' not in t and 'mesh:l22 x mesh:l22' not in t) else 'minor'
    return 'minor'

def shot(d):
    x, y, z = d['x'], d['y'], d['z']
    if d.get('cam'): c = d['cam']; return "game.shot(%g, %s, %g, %g, %g, %g)" % (c[0], c[1] if c[1] is not None else 'null', c[2], c[3], c[4], c[5])
    if x >= 190:
        cid = d['area'].replace('cell.', '')
        # inside a cell: stand 3.5 m off, toward the cell's origin side, eye 1.5 m above the point
        dx, dz = 3.0, 0.0; ang = math.degrees(math.atan2(-dx, dz)) if False else 90
        return "game.enter('%s'); game.shot(%.1f, %.1f, %.1f, %.0f, -12, 13)" % (cid, x - 3.0, y + 1.5, z, 90)
    # outdoors: 6 m away on the side facing the square, looking at the defect
    L = math.hypot(x, z + 2) or 1; cx = x - x / L * 6; cz = z - (z + 2) / L * 6
    yaw = math.degrees(math.atan2(x - cx, -(z - cz))); dist = 6.0
    return "game.shot(%.1f, null, %.1f, %.0f, -8, 13)" % (cx, cz, yaw)

def keyOf(d): return hashlib.md5((d['k'] + '|' + d['area'] + '|' + re.sub(r'[0-9.]+ ?m2? ?x?\d*|\d+\.\d+', '#', d['d'])[:60] + '|' + str(round(d['x'] / 4)) + ',' + str(round(d['z'] / 4))).encode()).hexdigest()[:8]

if mode == 'merge':
    raw = []
    for f in ('geo', 'chars', 'player'):
        r = load(OUT + '/' + f + '.json')
        if r: raw += r['defects']
    # the tour: flagged views
    tour = load(OUT + '/tour.json', {})
    for key, m in tour.items():
        v = m['v']; hr = key.split('|')[2]; a = v['area']; fl = []
        if m['black'] > 0.06: fl.append(('look-black', 'black region covers %.0f%% of the frame (non-sky) at %sh' % (m['black'] * 100, hr), m['black']))
        if m['white'] > 0.04: fl.append(('look-white', 'blown-out white covers %.0f%% of the frame at %sh' % (m['white'] * 100, hr), m['white']))
        if m['flat'] and m['flat']['f'] > 0.03 and max(m['flat']['col']) > 25: fl.append(('look-flat', 'flat single colour %s covers %.0f%% of the frame at %sh' % (m['flat']['col'], m['flat']['f'] * 100, hr), m['flat']['f']))
        if m['part'] > 0.08: fl.append(('look-glow', 'glow/particle sprites cover %.0f%% of the frame at %sh' % (m['part'] * 100, hr), m['part']))
        if m.get('jit', 0) > 0.02: fl.append(('look-jitter', 'z-fighting: %.1f%% of pixels flip with a 2 mm camera shift' % (m['jit'] * 100), m['jit'] * 10))
        for k, t, n in fl:
            raw.append({'k': k, 'area': a, 'x': v['x'], 'y': 0, 'z': v['z'], 'd': v['id'] + ': ' + t, 'n': round(n, 3), 'cam': [v['x'], v['y'], v['z'], v['yaw'], v['pitch'], int(hr)], 'view': v['id']})
    # aggregate float / sunk / emitter by (area, first word)
    agg = {}; out = []
    for d in raw:
        if d['k'] in ('float', 'sunk'):
            nm = d['d'].split(' ')[0]; key = (d['k'], d['area'], nm)
            if key in agg: agg[key]['count'] += 1; agg[key]['n'] = max(agg[key]['n'], d['n']); continue
            d = dict(d); d['count'] = 1; agg[key] = d
        out.append(d)
    for d in out:
        if d.get('count', 1) > 1: d['d'] += ' (x%d)' % d['count']
        d['key'] = keyOf(d); d['sev'] = severity(d); d['owner'] = owner(d); d['shotcall'] = shot(d)
    seen = {}; res = []
    for d in out:
        if d['key'] in seen: continue
        seen[d['key']] = 1; res.append(d)
    res.sort(key=lambda d: (SEV[d['sev']], -d.get('n', 1)))
    c = {}
    for d in res:
        p = {'breaks play': 'B', 'ugly': 'U', 'minor': 'M'}[d['sev']]; c[p] = c.get(p, 0) + 1; d['id'] = '%s%03d' % (p, c[p])
    json.dump(res, open(OUT + '/defects.json', 'w'), indent=0)
    print(len(res), 'defects', {k: sum(1 for d in res if d['sev'] == k) for k in SEV})
elif mode == 'md':
    res = load(OUT + '/defects.json', []); st = load(ROOT + '/test/qa/status.json', {})
    L = ['# Defects found by the QA sweep', '', 'Generated by `python3 -I test/qa/defects.py md` from the sweep results (`node test/sweep.mjs ...`). One line per defect. Coordinates are world x, y, z (metres). Shot calls run in the page (`node test/shot.mjs --opt webgl=1 --do "await ..."`). Owner: which worker\'s files the cause lives in. Status: open, reported (not our files), fixed.', '']
    for sev in SEV:
        rows = [d for d in res if d['sev'] == sev]
        L += ['## ' + sev + ' (%d)' % len(rows), '', '| id | area | where | what | shot | screenshot | owner | status |', '|---|---|---|---|---|---|---|---|']
        for d in rows:
            img = '/home/claude/shots/qa/defects/%s.jpg' % d['id']; img = img if os.path.exists(img) else ''
            s = st.get(d['key'], 'open' if d['owner'].startswith('qa') else 'reported')
            L.append('| %s | %s | %g, %g, %g | %s | `%s` | %s | %s | %s |' % (d['id'], d['area'], d['x'], d['y'], d['z'], d['d'].replace('|', '/'), d['shotcall'], img, d['owner'], s))
        L.append('')
    open(ROOT + '/docs/DEFECTS.md', 'w').write('\n'.join(L)); print('wrote docs/DEFECTS.md', len(res))
