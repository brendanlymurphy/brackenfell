# Two more roof texture sets for the town's shells (kits/skin/MI_Slate_*, MI_Thatch_*), 512 px, same layout as tools/gen_timber_tex.py.
# Slate: stone slates in courses that get smaller toward the ridge, grey with ochre lichen and a few mossy slabs. Thatch: layered straw, weathered grey-gold, dark where it is old and damp.
import numpy as np
from PIL import Image
rs = np.random.RandomState(11)
S = 512
def normal_from(h, k=2.2):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * k; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * k
    n = np.stack([-gx, -gy, np.ones_like(h)], -1); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)
def save(a, n, orm, name):
    Image.fromarray(a).save(f'kits/skin/{name}_a.webp', quality=80); Image.fromarray(n).save(f'kits/skin/{name}_n.webp', quality=82); Image.fromarray(orm).save(f'kits/skin/{name}_orm.webp', quality=80)
def blob(h, w, sc):                      # tileable value noise
    return np.asarray(Image.fromarray((rs.rand(h // sc, w // sc) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
# ── stone slate: 6 courses of 64..100 px (a tall slab at the eaves, short at the top: the sheet is one band of that gradient), slabs 80..150 px wide ──
A = np.zeros((S, S, 3), np.float32); Hm = np.zeros((S, S), np.float32); AO = np.ones((S, S), np.float32)
hs = [96, 88, 84, 80, 78, 86]; y0 = 0
grit = blob(S, S, 2)
for r, rh in enumerate(hs):
    x = -int(rs.uniform(0, 120))
    while x < S:
        wd = int(rs.uniform(78, 150)); xa, xb = max(x, 0), min(x + wd, S)
        if xb > xa:
            tone = rs.uniform(0.5, 0.95); warm = rs.uniform(0, 1)
            base = np.array([0.33, 0.34, 0.34]) * (1 - warm * 0.55) + np.array([0.42, 0.36, 0.26]) * warm * 0.55
            lich = rs.rand() < 0.22; moss = rs.rand() < 0.07
            col = base * tone * 1.55
            if lich: col = col * 0.8 + np.array([0.33, 0.3, 0.14]) * 0.35
            if moss: col = col * 0.7 + np.array([0.12, 0.19, 0.08]) * 0.5
            ys = (np.arange(y0 - 12, y0 + rh)) % S; xs = np.arange(xa, xb); yy = np.arange(rh + 12)[:, None]
            g = 1 + 0.35 * (grit[np.ix_(ys, xs)] - 0.5)
            fade = 0.5 + 0.5 * np.clip((yy - 4) / (rh * 0.85), 0, 1)           # the lower edge of a slab is lit, under the course above it is dark
            A[np.ix_(ys, xs)] = (col[None, None, :] * g[..., None]) * fade[..., None]
            Hm[np.ix_(ys, xs)] = yy / rh * 0.6 + grit[np.ix_(ys, xs)] * 0.08
            Hm[np.ix_(ys, [xa, xb - 1])] -= 0.9; AO[np.ix_(ys, [xa, xa + 1, xb - 2, xb - 1])] = 0.45
        x += wd
    AO[(y0 + rh - 5) % S:(y0 + rh) % S or S, :] = 0.5; y0 += rh
A *= (0.82 + 0.3 * blob(S, S, 16)[..., None]); A = np.clip(A, 0, 1)
save((A * 255).astype(np.uint8), normal_from(Hm, 3.2), (np.stack([AO, np.full((S, S), 0.9, np.float32), np.zeros((S, S), np.float32)], -1) * 255).astype(np.uint8), 'MI_Slate')
# ── thatch: straw laid in 5 courses, each a mat of long strands running down the slope, butt ends ragged along the course line ──
A = np.zeros((S, S, 3), np.float32); Hm = np.zeros((S, S), np.float32); AO = np.ones((S, S), np.float32)
ch = S // 4
for r in range(4):
    yb = r * ch
    for x in range(S):
        L = int(ch * rs.uniform(0.9, 1.25)); tone = rs.uniform(0.55, 1.0); aged = rs.uniform(0.35, 1)
        base = (np.array([0.50, 0.40, 0.22]) * (1 - aged * 0.6) + np.array([0.34, 0.31, 0.25]) * aged * 0.6) * tone * 0.95
        ys = (np.arange(yb - 10, yb - 10 + L)) % S; t = np.linspace(0, 1, L)[:, None]
        wob = 1 + 0.18 * np.sin(np.arange(L) * 0.2 + x)[:, None]
        A[ys, x] = base[None, :] * wob * (0.62 + 0.5 * t)                     # darker toward the top of the strand (under the course above), lit at the butt
        Hm[ys, x] = t[:, 0] * 0.5 + rs.rand() * 0.15
    AO[yb:yb + 6, :] = 0.55
A *= (0.8 + 0.35 * blob(S, S, 8)[..., None]); A[..., 2] *= 0.95; A = np.clip(A, 0, 1)
save((A * 255).astype(np.uint8), normal_from(Hm, 2.5), (np.stack([AO, np.full((S, S), 0.95, np.float32), np.zeros((S, S), np.float32)], -1) * 255).astype(np.uint8), 'MI_Thatch')
