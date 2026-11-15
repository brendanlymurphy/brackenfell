#!/bin/sh
# Renders the contact sheets for every category. usage: tools/scan/sheets.sh <out dir>
out=${1:-/home/claude/shots/F}; mkdir -p "$out"
python3 -I - "$out" <<'PY'
import json, subprocess, sys, math
out = sys.argv[1]; cat = json.load(open('kits/SCAN_CATALOG.json'))
by = {}
for n, e in cat.items(): by.setdefault(e['category'], []).append(n)
for c, names in sorted(by.items()):
    for page in range(math.ceil(len(names) / 30)):
        rows = math.ceil(min(30, len(names) - page * 30) / 6); f = f"{out}/sheet_{c}{'_' + str(page + 1) if len(names) > 30 else ''}.png"
        subprocess.run(['node', 'test/shot.mjs', '--size', f'1560x{rows * 260}', '--page', '/test/scan_sheet.html', '--opt', 'webgl=1', '--opt', f'cat={c}', '--opt', f'page={page}', '--opt', 'marks=1', '--out', f], capture_output=True)
        print(f)
PY
