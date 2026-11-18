# [audit] contact sheets of the slice camera's frames, 3 x 3 at 640 x 360, labelled, in order: segment, point, forward/back, day/night.
# usage: python3 test/audit/slicesheets.py <frames dir> <out dir> [day|night|all]
import sys, os, glob
from PIL import Image, ImageDraw
src, dst = sys.argv[1], sys.argv[2]; which = sys.argv[3] if len(sys.argv) > 3 else 'all'; os.makedirs(dst, exist_ok=True)
fs = sorted(f for f in glob.glob(src + '/*.jpg') if (which == 'all' or f.endswith('_' + which[0] + '.jpg')))
order = ['ngate', 'chapel', 'nout', 'west', 'alley', 'hart', 'ring']
fs.sort(key=lambda f: (order.index(os.path.basename(f).split('_')[0]) if os.path.basename(f).split('_')[0] in order else 9, os.path.basename(f)))
W, H, n = 640, 360, 9
for s in range(0, len(fs), n):
    sh = Image.new('RGB', (W * 3, (H + 20) * 3), (15, 15, 15)); d = ImageDraw.Draw(sh)
    for i, f in enumerate(fs[s:s + n]):
        x, y = (i % 3) * W, (i // 3) * (H + 20); sh.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y + 20)); d.text((x + 4, y + 4), os.path.basename(f)[:-4], fill=(240, 230, 190))
    sh.save(f'{dst}/sheet_{which}_{s // n:02d}.jpg', quality=78)
print(len(fs), 'frames', (len(fs) + n - 1) // n, 'sheets')
