# before/after sheet: one row per body, left half before, right half after, same camera and light. usage: python3 test/chars_compare.py <before dir> <after dir> <out.jpg> <tags comma list, e.g. f0,b0> <bodies...>
import sys, os
from PIL import Image, ImageDraw
b, a, out, tags = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(','); names = sys.argv[5:]; cw = 560
rows = []
for n in names:
    cells = []
    for side in (b, a):
        for t in tags:
            p = f'{side}/{n}_{t}.png'
            if os.path.exists(p): cells.append(Image.open(p).convert('RGB'))
    if not cells: continue
    ch = int(cells[0].size[1] * cw / cells[0].size[0]); row = Image.new('RGB', (cw * len(cells), ch))
    for i, im in enumerate(cells): row.paste(im.resize((cw, ch), Image.LANCZOS), (i * cw, 0))
    d = ImageDraw.Draw(row); d.text((6, 4), n + '  before | after', fill=(255, 255, 0)); rows.append(row)
if rows:
    s = Image.new('RGB', (rows[0].size[0], sum(r.size[1] for r in rows)))
    y = 0
    for r in rows: s.paste(r, (0, y)); y += r.size[1]
    s.save(out, quality=85)
