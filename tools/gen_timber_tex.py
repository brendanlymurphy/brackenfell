# Generates the two texture sets used by the dark-timber walls and the grey shingle roofs of the infill houses
# (kits/skin/MI_Planks_*, MI_Shingle_*): 512 px, built from the kit's own dark wood grain (MI_WoodTrim_a) plus procedural board/shingle layout.
import numpy as np, sys
from PIL import Image, ImageFilter
rs = np.random.RandomState(7)
S = 512
src = np.asarray(Image.open('kits/skin/MI_WoodTrim_a.webp').convert('RGB')).astype(np.float32) / 255
grain = src[10:330, :, :]                       # the dark horizontal-grain band of the trim sheet
grain = np.rot90(grain)                         # vertical grain
gl = grain.mean(axis=2); gl = (gl - gl.mean()) / (gl.std() + 1e-6)
def normal_from(h, k=2.2):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * k; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * k
    n = np.stack([-gx, -gy, np.ones_like(h)], -1); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)
def save(a, n, orm, name):
    Image.fromarray(a).save(f'kits/skin/{name}_a.webp', quality=80)
    Image.fromarray(n).save(f'kits/skin/{name}_n.webp', quality=82)
    Image.fromarray(orm).save(f'kits/skin/{name}_orm.webp', quality=80)
def tile_crop(w, h, ox, oy):
    ys = (np.arange(h) + oy) % gl.shape[0]; xs = (np.arange(w) + ox) % gl.shape[1]
    return gl[np.ix_(ys, xs)]
# ── planks: 8 vertical boards, each with its own tone, a groove between, staggered butt joints, knots of darker tone ──
nb = 8; bw = S // nb
A = np.zeros((S, S, 3), np.float32); Hm = np.zeros((S, S), np.float32); AO = np.ones((S, S), np.float32)
for b in range(nb):
    segs = [0, int(rs.uniform(0.35, 0.65) * S), S] if b % 2 else [0, S]
    for s0, s1 in zip(segs[:-1], segs[1:]):
        g = tile_crop(bw, s1 - s0, rs.randint(0, 900), rs.randint(0, 200))
        tone = rs.uniform(0.62, 1.0); warm = rs.uniform(-0.04, 0.05)
        base = np.array([0.30 + warm, 0.235, 0.18 - warm * 0.5]) * tone
        col = base[None, None, :] * (1 + 0.28 * g[..., None])
        A[s0:s1, b * bw:(b + 1) * bw] = col; Hm[s0:s1, b * bw:(b + 1) * bw] = g * 0.12
        Hm[s0:s1, b * bw:b * bw + 3] -= 1.0; Hm[s0:s1, (b + 1) * bw - 2:(b + 1) * bw] -= 0.5
        AO[s0:s1, b * bw:b * bw + 3] = 0.35; AO[s0:s1, (b + 1) * bw - 2:(b + 1) * bw] = 0.6
        if s0 > 0: Hm[s0:s0 + 3, b * bw:(b + 1) * bw] -= 1.0; AO[s0:s0 + 3, b * bw:(b + 1) * bw] = 0.35
# weathering: darker streaks, a pale silvering at random
fl = np.asarray(Image.fromarray((rs.rand(64, 8) * 255).astype(np.uint8)).resize((S, S), Image.BICUBIC)).astype(np.float32) / 255
A *= (0.85 + 0.3 * fl[..., None]); A = A * 1.15
A = np.clip(A, 0, 1)
orm = np.stack([AO, np.full((S, S), 0.82, np.float32), np.zeros((S, S), np.float32)], -1)
save((A * 255).astype(np.uint8), normal_from(Hm), (orm * 255).astype(np.uint8), 'MI_Planks')
# ── shingles: 8 courses of 64 px, shingles about 70 px wide, staggered, grey-brown, darker under the butt of the course above ──
A = np.zeros((S, S, 3), np.float32); Hm = np.zeros((S, S), np.float32); AO = np.ones((S, S), np.float32)
rows = 8; rh = S // rows
for r in range(rows):
    x = -int(rs.uniform(0, 70)); y0 = r * rh
    while x < S:
        wd = int(rs.uniform(54, 84)); x0, x1 = max(x, 0), min(x + wd, S)
        if x1 > x0:
            tone = rs.uniform(0.55, 1.0); grey = rs.uniform(0, 1)
            base = (np.array([0.40, 0.34, 0.28]) * (1 - grey) + np.array([0.34, 0.34, 0.33]) * grey) * 1.7
            g = tile_crop(x1 - x0, rh + 14, rs.randint(0, 900), rs.randint(0, 200))
            col = base[None, None, :] * tone * (1 + 0.3 * g[..., None])
            # a shingle is a little longer than its course and lies over the one below: its lower end is the exposed butt
            yy = np.arange(rh + 14)[:, None]; fade = 0.55 + 0.45 * np.clip((yy - 4) / (rh * 0.8), 0, 1)
            ys = np.arange(y0 - 14, y0 + rh); ys %= S
            A[np.ix_(ys, np.arange(x0, x1))] = col * fade[..., None]
            Hm[np.ix_(ys, np.arange(x0, x1))] = (yy / rh * 0.5 + g * 0.05)
            Hm[np.ix_(ys, [x0, x1 - 1])] -= 0.8
            AO[np.ix_(ys, [x0, x0 + 1, x1 - 2, x1 - 1])] = 0.4
        x += wd
    AO[(y0 + rh - 4) % S:(y0 + rh) % S or S, :] = 0.5
fl = np.asarray(Image.fromarray((rs.rand(32, 32) * 255).astype(np.uint8)).resize((S, S), Image.BICUBIC)).astype(np.float32) / 255
A *= (0.8 + 0.35 * fl[..., None]); A = np.clip(A, 0, 1)
orm = np.stack([AO, np.full((S, S), 0.88, np.float32), np.zeros((S, S), np.float32)], -1)
save((A * 255).astype(np.uint8), normal_from(Hm, 3.0), (orm * 255).astype(np.uint8), 'MI_Shingle')
