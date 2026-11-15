#!/usr/bin/env python3
"""Writes kits/SCAN_PROVENANCE.md from the model list, the Poly Haven index and the catalogue.
usage: provenance.py <accepted.txt> <models.json> <kits dir>"""
import sys, json, os
lst, idx, kits = sys.argv[1:4]
models = json.load(open(idx)); cat = json.load(open(os.path.join(kits, 'SCAN_CATALOG.json'))); tex = json.load(open(os.path.join(kits, 'tex', 'TEXTURES.json')))
rows = [l.split() for l in open(lst) if l.strip() and not l.startswith('#')]
by = {}
for n, e in cat.items(): by.setdefault(e['source'], []).append(n)
out = ['# Scanned assets: where they come from', '',
 'Everything in `scan_props.glb`, `scan_nature.glb` and `tex/` comes from [Poly Haven](https://polyhaven.com), which publishes all of its assets under',
 '[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/): public domain, free for any use, no attribution required. Credit is given here anyway.', '',
 'The models were downloaded as glTF at 1k through the public API (`https://api.polyhaven.com/files/<id>`), then simplified, re-textured to WebP and packed',
 'by the scripts in `tools/scan/`. Sets were split into separate objects (`_a`, `_b`, ...). Trees were rebuilt as baked card models from the scans (see `tools/scan/trees.md`).', '',
 '## Models', '', '| Poly Haven id | Page | Authors | Category | Objects in the pack |', '|---|---|---|---|---|']
for pid, c in rows:
    m = models.get(pid, {}); names = sorted(by.get(pid, []))
    if not names: continue
    out.append(f"| {pid} | https://polyhaven.com/a/{pid} | {', '.join(sorted((m.get('authors') or {}).keys())) or '?'} | {c} | {', '.join(names)} |")
out += ['', '## Tiling textures (`tex/`)', '', 'Each set is `<name>_color.webp`, `<name>_normal.webp` (OpenGL convention, as in glTF) and `<name>_orm.webp` (R ambient occlusion, G roughness, B metalness), 1024 px.', '',
 '| Name | Poly Haven id | Page | Authors | Covers (m) | Use |', '|---|---|---|---|---|---|']
for n, e in tex.items():
    out.append(f"| {n} | {e['source']} | {e['url']} | {', '.join(e['authors']) or '?'} | {' x '.join(str(x) for x in e['metres']) if e['metres'] else '?'} | {e['use']} |")
open(os.path.join(kits, 'SCAN_PROVENANCE.md'), 'w').write('\n'.join(out) + '\n')
print('provenance:', sum(1 for r in rows if by.get(r[0])), 'models,', len(tex), 'texture sets')
