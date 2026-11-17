# [audit] contact sheets: python3 test/audit/sheet.py <out prefix> <cols> <tile w> <label 0/1> file1 file2 ...   (rows of <cols>, 6 rows a sheet)
import sys, os
from PIL import Image, ImageDraw
out, cols, tw, files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[5:]
rows = int(os.environ.get('ROWS', 6)); per = cols * rows
for s in range(0, len(files), per):
    chunk = files[s:s + per]; ims = []
    for f in chunk:
        try: im = Image.open(f); im = im.resize((tw, int(im.height * tw / im.width)))
        except Exception: im = Image.new('RGB', (tw, int(tw * 0.625)), (60, 0, 0))
        ImageDraw.Draw(im).rectangle([0, 0, tw, 13], fill=(0, 0, 0)); ImageDraw.Draw(im).text((3, 1), os.path.basename(f).rsplit('.', 1)[0], fill=(255, 255, 0)); ims.append(im)
    th = ims[0].height; sh = Image.new('RGB', (cols * tw, ((len(ims) + cols - 1) // cols) * th), (20, 20, 20))
    for i, im in enumerate(ims): sh.paste(im, ((i % cols) * tw, (i // cols) * th))
    sh.save(f'{out}{s // per + 1:02d}.jpg', quality=72)
