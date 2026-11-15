#!/usr/bin/env python3
"""Writes kits/SCAN_PROVENANCE.md from the model list, the Poly Haven index and the catalogue.
usage: provenance.py <slim.txt> <models.json> <kits dir>"""
import sys, json, os
lst, idx, kits = sys.argv[1:4]
models = json.load(open(idx)); cat = json.load(open(os.path.join(kits, 'SCAN_CATALOG.json')))
rows = [(l.split()[1], 'scan') for l in open(lst) if l.strip() and not l.startswith('#')]
by = {}
for n, e in cat.items(): by.setdefault(e['source'], []).append(n)
out = ['# Scanned assets: where they come from', '',
 'Everything in `scan.glb` comes from [Poly Haven](https://polyhaven.com), which publishes all of its assets under',
 '[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/): public domain, free for any use, no attribution required. Credit is given here anyway.', '',
 'The models were downloaded as glTF at 1k through the public API (`https://api.polyhaven.com/files/<id>`), converted by `tools/scan/convert.mjs` and cut down to a',
 'phone-sized pack by `tools/scan/slim.mjs` (list and budgets in `tools/scan/slim.txt`): welded, simplified, positions and normals quantized, textures WebP at 512 px',
 '(1024 px colour for the bed, bookshelf and trestle table). Sets that hold several objects were split earlier (`_a`, `_b`, ...); only the listed ones are in the pack.', '',
 '## Models', '', '| Poly Haven id | Page | Authors | Category | Objects in the pack |', '|---|---|---|---|---|']
seen = set()
for pid, c in rows:
    if pid in seen: continue
    seen.add(pid); m = models.get(pid, {}); names = sorted(by.get(pid, []))
    if not names: continue
    c = cat[names[0]]['category']
    out.append(f"| {pid} | https://polyhaven.com/a/{pid} | {', '.join(sorted((m.get('authors') or {}).keys())) or '?'} | {c} | {', '.join(names)} |")
open(os.path.join(kits, 'SCAN_PROVENANCE.md'), 'w').write('\n'.join(out) + '\n')
print('provenance:', len(set(r[0] for r in rows if by.get(r[0]))), 'source models')
