# contact sheets from the tour: python3 -I test/qa/sheet.py /home/claude/shots/qa
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]; db = json.load(open(out + '/tour.json'))
safe = lambda s: re.sub(r'[^A-Za-z0-9.,@_-]+', '_', s)
TW, TH, PER_ROW, ROWS = 400, 183, 2, 5
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except Exception: font = ImageFont.load_default()
groups = {}
for k, m in db.items():
    a = m['v']['area']; g = 'interiors' if a.startswith('int.') else a
    groups.setdefault(g, {}).setdefault((m['v']['area'], m['v']['id']), {})[k.split('|')[2]] = m
def flags(m):
    f = []
    if m['black'] > 0.06: f.append('black %.0f%%' % (m['black'] * 100))
    if m['white'] > 0.04: f.append('white %.0f%%' % (m['white'] * 100))
    if m['flat'] and m['flat']['f'] > 0.03: f.append('flat %.0f%% %s' % (m['flat']['f'] * 100, m['flat']['col']))
    if m['part'] > 0.08: f.append('glow %.0f%%' % (m['part'] * 100))
    if m.get('jit', 0) > 0.02: f.append('jitter %.1f%%' % (m['jit'] * 100))
    return ' '.join(f)
os.makedirs(out + '/sheets', exist_ok=True)
for g, views in sorted(groups.items()):
    items = sorted(views.items(), key=lambda kv: kv[0])
    per = PER_ROW * ROWS
    for si in range(0, len(items), per):
        chunk = items[si:si + per]; nrows = (len(chunk) + PER_ROW - 1) // PER_ROW
        W = PER_ROW * (2 * TW + 8) + 8; H = nrows * (TH + 34) + 8
        sheet = Image.new('RGB', (W, H), (24, 24, 24)); d = ImageDraw.Draw(sheet)
        for n, ((area, vid), hs) in enumerate(chunk):
            cx = 8 + (n % PER_ROW) * (2 * TW + 8); cy = 8 + (n // PER_ROW) * (TH + 34)
            m13 = hs.get('13'); v = (m13 or next(iter(hs.values())))['v']
            d.text((cx, cy), '%s  %s  (%.0f, %.0f) yaw %.0f' % (area, vid, v['x'], v['z'], v['yaw']), fill=(230, 230, 230), font=font)
            for j, h in enumerate(['13', '21']):
                m = hs.get(h)
                if not m: continue
                p = '%s/img/%s/%s_%s.jpg' % (out, safe(area), safe(vid), h)
                if os.path.exists(p): sheet.paste(Image.open(p).resize((TW, TH)), (cx + j * TW, cy + 14))
                fl = flags(m)
                if fl: d.text((cx + j * TW + 4, cy + 14 + TH + 1), h + 'h ' + fl, fill=(255, 140, 90), font=font)
        sheet.save('%s/sheets/%s_%d.jpg' % (out, safe(g), si // per + 1), quality=88)
print('sheets written to', out + '/sheets')
