#!/usr/bin/env python3
"""Download Poly Haven models (glTF at 1k with textures). usage: fetch.py <accepted.txt> <out dir> [ids...]"""
import sys, os, json, urllib.request, concurrent.futures as cf
lst, out = sys.argv[1], sys.argv[2]
ids = sys.argv[3:] or [l.split()[0] for l in open(lst) if l.strip() and not l.startswith('#')]
UA = {'User-Agent': 'brackenfell-asset-fetch/1.0'}
def get(url, path=None):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=600) as r:
        data = r.read()
    if path:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path + '.part', 'wb') as f: f.write(data)
        os.replace(path + '.part', path)
    return data
def one(id):
    d = os.path.join(out, id); os.makedirs(d, exist_ok=True)
    fj = os.path.join(d, 'files.json')
    if not os.path.exists(fj): get('https://api.polyhaven.com/files/' + id, fj)
    j = json.load(open(fj)); g = j['gltf']; res = '1k' if '1k' in g else sorted(g.keys())[0]
    e = g[res]['gltf']; tot = 0
    todo = [(e['url'], os.path.join(d, id + '.gltf'), e['size'])] + [(v['url'], os.path.join(d, k), v['size']) for k, v in e.get('include', {}).items()]
    for k, v in j.items():                      # alpha / opacity maps are separate files on Poly Haven
        if ('alpha' in k.lower() or 'opacity' in k.lower()) and isinstance(v, dict) and 'glass' not in k.lower():
            e = v.get('1k') or list(v.values())[0]; f = e.get('png') or e.get('jpg') or list(e.values())[0]
            todo.append((f['url'], os.path.join(d, 'maps', k + '.' + f['url'].split('.')[-1]), f['size']))
    for url, path, size in todo:
        if not (os.path.exists(path) and os.path.getsize(path) == size): get(url, path)
        tot += size
    return id, res, tot
with cf.ThreadPoolExecutor(8) as ex:
    futs = {ex.submit(one, i): i for i in ids}; total = 0
    for f in cf.as_completed(futs):
        try: id, res, tot = f.result(); total += tot
        except Exception as e: print('FAIL', futs[f], repr(e)[:200])
print('done', len(ids), 'models', round(total / 1e6), 'MB')
