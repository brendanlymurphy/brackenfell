#!/usr/bin/env python3
# contact sheets of the walk camera: 12 frames per sheet (3 columns x 4 rows of 800x450 shown at 600x338), labelled with position and heading
# python3 test/walkviews_sheet.py <dir with index.json and the frames>   -> <dir>/sheet_<hour>_<nn>.jpg
import json, os, sys
from PIL import Image, ImageDraw
d = sys.argv[1]; idx = json.load(open(os.path.join(d, 'index.json')))
TW, TH, C, R = 600, 338, 3, 4
for hour in sorted({f['hour'] for f in idx['frames']}):
    fr = [f for f in idx['frames'] if f['hour'] == hour and os.path.exists(os.path.join(d, f['name'] + '.jpg'))]
    for n in range(0, len(fr), C * R):
        sh = Image.new('RGB', (C * TW, R * TH))
        for i, f in enumerate(fr[n:n + C * R]):
            im = Image.open(os.path.join(d, f['name'] + '.jpg')).convert('RGB').resize((TW, TH))
            dr = ImageDraw.Draw(im)
            x, z = f.get('x2', f['x']), f.get('z2', f['z'])
            lab = f"{f['name']} {f['leg']} ({x:.1f},{z:.1f}) yaw {f['yaw']} {f['kind']} {hour}:00"
            if f.get('stepped'): lab += f" ASIDE {f['stepped']} m"
            if f.get('stillBlocked'): lab += ' BLOCKED'
            dr.rectangle([0, 0, TW, 13], fill=(0, 0, 0)); dr.text((3, 1), lab, fill=(255, 255, 0))
            sh.paste(im, ((i % C) * TW, (i // C) * TH))
        sh.save(os.path.join(d, f"sheet_{hour}_{n // (C * R):02d}.jpg"), quality=85)
print('sheets written')
