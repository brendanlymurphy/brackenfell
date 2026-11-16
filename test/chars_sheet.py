# stitch the per-body shots of test/chars_sheet.sh into one strip per body and one contact sheet. usage: python3 test/chars_sheet.py <dir> [width of one cell]
import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; cw = int(sys.argv[2]) if len(sys.argv) > 2 else 420
tags = ['f0', 'b0', 'e0', 'i0']
names = sorted({os.path.basename(p).rsplit('_', 1)[0] for p in glob.glob(d + '/*_f0.png')})
rows = []
for n in names:
    ims = [Image.open(f'{d}/{n}_{t}.png').convert('RGB') for t in tags if os.path.exists(f'{d}/{n}_{t}.png')]
    ch = int(ims[0].size[1] * cw / ims[0].size[0]); strip = Image.new('RGB', (cw * len(ims), ch))
    for i, im in enumerate(ims): strip.paste(im.resize((cw, ch), Image.LANCZOS), (i * cw, 0))
    ImageDraw.Draw(strip).text((6, 4), n, fill=(255, 255, 0)); strip.save(f'{d}/strip_{n}.jpg', quality=85); rows.append(strip)
if rows:
    for k in range(0, len(rows), 6):
        s = Image.new('RGB', (rows[0].size[0], sum(r.size[1] for r in rows[k:k + 6]))); y = 0
        for r in rows[k:k + 6]: s.paste(r, (0, y)); y += r.size[1]
        s.save(f'{d}/sheet{k // 6}.jpg', quality=82)
