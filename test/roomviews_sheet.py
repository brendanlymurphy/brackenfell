# python3 test/roomviews_sheet.py <outdir> <id>  -> <outdir>/<id>/sheet.jpg : one row per view, 13:00 left, 21:00 right, 320x180 tiles, labelled
import sys, json
from PIL import Image, ImageDraw
out, id = sys.argv[1], sys.argv[2]
V = json.load(open(f'{out}/{id}/views.json')); W, H = 320, 180
sh = Image.new('RGB', (W * 4, H * ((len(V) + 1) // 2)))
for i, v in enumerate(V):
    for j, h in enumerate((13, 21)):
        try: im = Image.open(f"{out}/{id}/{v['n']}_{h}.jpg").resize((W, H))
        except Exception: im = Image.new('RGB', (W, H))
        d = ImageDraw.Draw(im); d.rectangle([0, 0, W, 13], fill=(0, 0, 0)); d.text((3, 1), f"{id} L{v['k']} {v['room']} {v['what']} {v['dir']} {h}:00", fill=(255, 255, 0))
        sh.paste(im, (((i % 2) * 2 + j) * W, (i // 2) * H))
sh.save(f'{out}/{id}/sheet.jpg', quality=85)
