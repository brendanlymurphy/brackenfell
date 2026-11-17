# [audit] Interior measures for every enterable building, from shots/audit/interiors_data.json (test/audit/interiors_dump.js) and the world dump.
# usage: python3 test/audit/interiors.py   -> docs/audit/interiors_table.md, shots/audit/interiors.json, /tmp/rooms.js (the picture list)
import json, math, collections, re, sys
D = json.load(open('shots/audit/interiors_data.json')); C = [c for c in D['cells'] if not c.get('noPlan')]
W = json.load(open('shots/audit/world.json')); H = {h['id']: h for h in W['houses']}
INTO = {'n': (0, 1), 's': (0, -1), 'e': (-1, 0), 'w': (1, 0)}
STORE = re.compile(r'barrel|cask|sack|crate|bag|basket|bucket|stack|logs', re.I)
rows = []; views = []; tot = collections.Counter(); lists = collections.defaultdict(list)
def ov(a, b): return max(0, min(a['x1'], b['x1']) - max(a['x0'], b['x0'])) * max(0, min(a['z1'], b['z1']) - max(a['z0'], b['z0']))
for c in C:
    T = c['T']; lv = {l['k']: l for l in c['lv']}; w = lambda x, z: (T[0] * x + T[8] * z + T[12], T[2] * x + T[10] * z + T[14])
    fl = [i for i in c['items'] if i.get('kind') == 'floor']; r = collections.Counter(); rooms = c['rooms']
    r['rooms'] = len(rooms); r['levels'] = len(lv); r['cellar'] = sum(1 for k in lv if k < 0); r['items'] = len(fl); r['storage'] = sum(1 for i in fl if STORE.search(i['id'].split('.')[-1]))
    # cabinets with their back to the room
    for it in fl:
        if 'back' not in it or it['k'] not in lv: continue
        cx, cz = w((it['x0'] + it['x1']) / 2, (it['z0'] + it['z1']) / 2); y0 = T[13] + lv[it['k']]['y']; ix, iz = INTO[it['back']]; wx, wz = T[0] * ix + T[8] * iz, T[2] * ix + T[10] * iz
        k = next((k for k in c['kit'] if abs(k[1] - cx) < 0.35 and abs(k[3] - cz) < 0.35 and y0 - 0.2 < k[2] < y0 + 0.6), None)
        if not k: continue
        fx, fz = math.sin(k[4]), math.cos(k[4]); q = int(round(math.degrees(math.atan2(fx * wz - fz * wx, fx * wx + fz * wz)) / 90)) % 4 * 90
        if k[0] == 'painted_wooden_cabinet': r['cabinets'] += 1; r['cabBack'] += q == 180
        if k[0] in ('rockingchair_01',) and q == 180: r['chairToWall'] += 1
    # furniture through furniture
    solid = [i for i in fl if not i.get('top') and (i.get('h') or 0) > 0.3 and not re.search(r'rug|bench|stool|chair', i['id'])]
    for a in range(len(solid)):
        for b in range(a + 1, len(solid)):
            if solid[a]['k'] == solid[b]['k'] and ov(solid[a], solid[b]) > 0.08: r['overlap'] += 1; lists['overlap'].append((c['id'], solid[a]['id'], solid[b]['id']))
    # furniture outside its room, or taller than the room
    R = {(x['id'], x['k']): x for x in rooms}
    for i in fl:
        rm = next((x for x in rooms if x['id'] == i.get('room') and x['k'] == i['k']), None)
        if rm and (i['x0'] < rm['x0'] - 0.06 or i['x1'] > rm['x1'] + 0.06 or i['z0'] < rm['z0'] - 0.06 or i['z1'] > rm['z1'] + 0.06): r['throughWall'] += 1; lists['throughWall'].append((c['id'], i['id']))
        if i['k'] in lv and (i.get('h') or 0) > lv[i['k']]['H'] + 0.05: r['tooTall'] += 1; lists['tooTall'].append((c['id'], i['id'], i['h'], lv[i['k']]['H']))
    # windows: on inside walls, in cellars, blocked by tall furniture; doors blocked
    r['windows'] = len(c['windows']); r['winInside'] = sum(1 for x in c['windows'] if x.get('wall') and not x['wall'].get('ext')); r['winCellar'] = sum(1 for x in c['windows'] if x['k'] < 0)
    for x in c['windows']:
        wl = x.get('wall') or {}
        if 'pos' not in x or 'c' not in wl: continue
        for i in fl:
            if i['k'] != x['k'] or (i.get('h') or 0) < 1.3: continue
            lo, hi, a0, a1 = (i['z0'], i['z1'], i['x0'], i['x1']) if wl['ax'] == 'x' else (i['x0'], i['x1'], i['z0'], i['z1'])
            if min(abs(lo - wl['c']), abs(hi - wl['c'])) < 0.45 and a0 < x['pos'] + 0.45 and a1 > x['pos'] - 0.45: r['winBlocked'] += 1; lists['winBlocked'].append((c['id'], i['id'])); break
    for d in c['doors']:
        for i in fl:
            if i['k'] == d['k'] and (i.get('h') or 0) > 0.3 and i['x0'] - 0.45 < d['x'] < i['x1'] + 0.45 and i['z0'] - 0.45 < d['z'] < i['z1'] + 0.45 and not re.search(r'rug', i['id']): r['doorBlocked'] += 1; lists['doorBlocked'].append((c['id'], i['id'])); break
    # a hearth with a room straight above it (the flue must pass through that room); stair holes
    for h in c['hearths']:
        if any(x['k'] == h['k'] + 1 and x['x0'] - 0.3 <= h['x'] <= x['x1'] + 0.3 and x['z0'] - 0.3 <= h['z'] <= x['z1'] + 0.3 for x in rooms):
            r['hearthUnderRoom'] += 1
            if not any(i['k'] == h['k'] + 1 and re.search(r'chimney|flue|breast|stack$', i['id']) and abs((i['x0'] + i['x1']) / 2 - h['x']) < 1.5 and abs((i['z0'] + i['z1']) / 2 - h['z']) < 1.5 for i in c['items']): r['noFlueAbove'] += 1
    r['hearths'] = len(c['hearths']); r['stairs'] = len(c['stairs']); r['holes'] = len(c['holes'])
    r['holesNoRail'] = sum(1 for h in c['holes'] if not any(re.search(r'rail|balust|banister|guard', i['id'], re.I) and i['k'] == h['k'] for i in c['items'] + c['wallItems']))
    # rooms: bare, and with neither window nor light
    for x in rooms:
        n = sum(1 for i in fl if i.get('room') == x['id'] and i['k'] == x['k']); lit = any(re.search(r'torch|sconce|candle|lantern|lamp|chandel', i['id'], re.I) and i.get('room') == x['id'] for i in c['wallItems'] + c['items']) or any(h['k'] == x['k'] and x['x0'] <= h['x'] <= x['x1'] and x['z0'] <= h['z'] <= x['z1'] for h in c['hearths'])
        area = (x['x1'] - x['x0']) * (x['z1'] - x['z0'])
        if n < 3 and area > 6: r['bareRooms'] += 1; lists['bareRooms'].append((c['id'], x['id'], n, round(area)))
        if not lit and not x.get('win'): r['darkRooms'] += 1; lists['darkRooms'].append((c['id'], x['id']))
        # the picture: from the corner nearest the door side, looking across the room
        if x['k'] in lv:
            px, pz = w(x['x0'] + 0.7, x['z0'] + 0.7); qx, qz = w((x['x0'] + x['x1']) / 2, (x['z0'] + x['z1']) / 2); views.append([c['id'], x['id'], round(px, 2), round(T[13] + lv[x['k']]['y'] + 1.5, 2), round(pz, 2), round(math.degrees(math.atan2(qx - px, -(qz - pz))), 1)])
    r['bedItems'] = sum(1 for i in fl if re.search(r'bed', i['id'].split('.')[-1]) and not re.search(r'bedside', i['id'])); r['bedsUsable'] = len(c['beds']); r['seats'] = c['seats']; r['containers'] = c['containers']; r['notes'] = c['reads']
    h = H.get(c['id']); 
    if h: s = h['site']; d = (h.get('plan') or {}).get('dims') or {}; r['shellWin'] = len(h['spec'].get('windows', [])); ratio = round((d.get('W', 0) * d.get('D', 0)) / (s['w'] * s['d']), 1)
    else: ratio = ''
    rows.append((c['id'], c['name'], r, ratio)); tot.update(r)
K = [('rooms', 'rooms'), ('levels', 'levels'), ('items', 'floor items'), ('storage', 'of which barrels, sacks, crates, baskets'), ('cabinets', 'painted cabinets'), ('cabBack', 'with the back to the room'), ('overlap', 'furniture through furniture'), ('throughWall', 'furniture through a wall'), ('winBlocked', 'windows behind tall furniture'), ('doorBlocked', 'doorways with furniture in them'), ('hearthUnderRoom', 'hearths under a room'), ('noFlueAbove', 'with no flue in that room'), ('holesNoRail', 'stair holes with no rail'), ('bareRooms', 'bare rooms'), ('darkRooms', 'rooms with no window or light'), ('winCellar', 'windows in a cellar'), ('bedItems', 'beds'), ('bedsUsable', 'beds that can be used'), ('containers', 'containers')]
o = ['| id | name | area x shell | ' + ' | '.join(k[1] for k in K) + ' |', '|---|---|---|' + '---|' * len(K)]
for id, name, r, ratio in rows: o.append(f'| `{id}` | {name} | {ratio} | ' + ' | '.join(str(r.get(k[0], 0) or '') for k in K) + ' |')
o.append('| **all** | | | ' + ' | '.join(f'**{tot.get(k[0], 0)}**' for k in K) + ' |')
open('docs/audit/interiors_table.md', 'w').write('\n'.join(o) + '\n')
json.dump(dict(build=D['build'], total=dict(tot), lists={k: v for k, v in lists.items()}, rows=[(a, b, dict(r), q) for a, b, r, q in rows]), open('shots/audit/interiors.json', 'w'), indent=1)
open('/tmp/rooms.js', 'w').write("const V=%s; const st=document.createElement('style'); st.textContent='body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st); let cur=null, n=0; for (const v of V) { if (cur!==v[0]) { if (cur) { game.leave(); game.step(2,1/30); } game.enter(v[0]); game.step(4,1/30); cur=v[0]; } game.shot(v[2], v[3], v[4], v[5], -12, 13); await __snap('rooms/'+v[0]+'__'+v[1]); n++; } return n;" % json.dumps(views))
print(len(C), 'interiors', len(views), 'rooms'); print(dict(tot))
for k in ('overlap', 'throughWall', 'tooTall', 'winBlocked', 'doorBlocked'): print(k, len(lists[k]), lists[k][:5])
