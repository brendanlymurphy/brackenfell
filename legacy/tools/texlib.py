"""Helpers for baking tileable material maps (all arrays float32, images wrap in both directions)."""
import numpy as np, cv2, os
from scipy import ndimage as ndi
from PIL import Image

S = 1024

def _to_f(im):
    a = np.asarray(im).astype(np.float32)
    return a / (65535.0 if a.max() > 255 else 255.0)

def load(path, size=S, mode='RGB'):
    """Load an image as float [0,1], resized to size x size (area filter when shrinking)."""
    im = Image.open(path)
    if mode: im = im.convert(mode)
    a = _to_f(im)
    if a.shape[0] != size or a.shape[1] != size:
        interp = cv2.INTER_AREA if a.shape[0] > size else cv2.INTER_CUBIC
        a = cv2.resize(a, (size, size), interpolation=interp)
    return np.clip(a, 0, 1)

def gray(a):
    return a if a.ndim == 2 else (a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114)

def s2l(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def l2s(c):
    c = np.clip(c, 0, None)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)

def blur(a, sigma):
    if a.ndim == 3: return np.stack([ndi.gaussian_filter(a[..., i], sigma, mode='wrap') for i in range(a.shape[2])], -1)
    return ndi.gaussian_filter(a, sigma, mode='wrap')

def norm01(a, lo=0.5, hi=99.5):
    p0, p1 = np.percentile(a, [lo, hi])
    return np.clip((a - p0) / max(p1 - p0, 1e-6), 0, 1)

def grad(h):
    """Central differences with wrap. Returns (dh/du, dh/dv) with v pointing down the image, per pixel."""
    return (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5, (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5

def normal_from_height(h, strength):
    """h in [0,1]; strength = slope multiplier. Returns unit normals, engine convention (x = -dh/du, y = -dh/dv_down)."""
    gx, gy = grad(h)
    n = np.stack([-gx * strength, -gy * strength, np.ones_like(h)], -1)
    return n / np.linalg.norm(n, axis=-1, keepdims=True)

def decode_normal(rgb):
    n = rgb[..., :3] * 2 - 1
    n[..., 2] = np.sqrt(np.clip(1 - n[..., 0] ** 2 - n[..., 1] ** 2, 0.02, 1))
    return n / np.linalg.norm(n, axis=-1, keepdims=True)

def height_from_normal(n):
    """Frankot-Chellappa integration of a periodic normal field (engine convention). Returns height normalised to [0,1]."""
    p = -n[..., 0] / np.maximum(n[..., 2], 0.05)      # dh/du
    q = -n[..., 1] / np.maximum(n[..., 2], 0.05)      # dh/dv
    H, W = p.shape
    u = np.fft.fftfreq(W)[None, :] * 2 * np.pi; v = np.fft.fftfreq(H)[:, None] * 2 * np.pi
    P = np.fft.fft2(p); Q = np.fft.fft2(q)
    den = u * u + v * v; den[0, 0] = 1
    Z = (-1j * u * P - 1j * v * Q) / den; Z[0, 0] = 0
    return norm01(np.real(np.fft.ifft2(Z)).astype(np.float32), 0.2, 99.8)

def to_engine_normal(nrm_rgb, height=None, name=''):
    """Decode a normal map of unknown handedness and return it in engine convention.
    The sign of each axis is checked against a height field (given, or a blurred-luminance proxy)."""
    n = decode_normal(nrm_rgb)
    if height is None: return n, (0, 0)
    gx, gy = grad(blur(height, 1.2))
    def corr(a, b):
        a = a - a.mean(); b = b - b.mean()
        return float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-9))
    cx, cy = corr(n[..., 0], -gx), corr(n[..., 1], -gy)
    if cx < -0.05: n[..., 0] *= -1
    if cy < -0.05: n[..., 1] *= -1
    return n, (round(cx, 2), round(cy, 2))

def ao_from_height(h, amount=1.0, radii=(2, 6, 16)):
    """Cavity occlusion: how far a point sits below its blurred surroundings, at a few scales."""
    occ = np.zeros_like(h)
    for r in radii: occ += np.clip(blur(h, r) - h, 0, 1) * (1.0 + r * 0.08)
    return np.clip(1 - occ * amount * 2.2, 0.15, 1)

def flatten(rgb, sigma=90, amount=0.7):
    """Remove part of the low-frequency brightness drift so a tile repeats less obviously."""
    l = gray(rgb); low = blur(l, sigma)
    k = (low.mean() / np.maximum(low, 1e-3)) ** amount
    return np.clip(rgb * k[..., None], 0, 1)

def grade(rgb, gain=1.0, sat=1.0, tint=(1, 1, 1), gamma=1.0, contrast=1.0):
    c = np.clip(rgb, 0, 1) ** gamma
    l = gray(c)[..., None]
    c = l + (c - l) * sat
    m = c.mean()
    c = (c - m) * contrast + m
    return np.clip(c * gain * np.asarray(tint, np.float32), 0, 1)

def match_mean(rgb, target, strength=1.0):
    """Shift the average colour toward target (sRGB 0-1) by per-channel gain."""
    m = rgb.reshape(-1, 3).mean(0)
    k = (np.asarray(target, np.float32) / np.maximum(m, 1e-3)) ** strength
    return np.clip(rgb * k, 0, 1)

def tile2(a, shift=0.5):
    """Stack an image wider than tall (W x W/2) into a square by repeating it with a horizontal offset."""
    return np.concatenate([a, np.roll(a, int(a.shape[1] * shift), 1)], 0)

# ---------- periodic procedural building blocks ----------
def rng(seed): return np.random.default_rng(seed)

def pnoise(size, freq, seed, octaves=4, persistence=0.5, aniso=(1, 1)):
    """Periodic value-noise fbm in [0,1]. freq = cells across the tile (x aniso)."""
    out = np.zeros((size, size), np.float32); amp = 1.0; tot = 0.0
    r = rng(seed)
    for o in range(octaves):
        fx = max(1, int(round(freq * aniso[0] * 2 ** o))); fy = max(1, int(round(freq * aniso[1] * 2 ** o)))
        g = r.random((fy, fx), dtype=np.float32)
        g = np.tile(g, (3, 3))
        z = cv2.resize(g, (size * 3, size * 3), interpolation=cv2.INTER_CUBIC)[size:2 * size, size:2 * size]
        out += z * amp; tot += amp; amp *= persistence
    return np.clip(out / tot, 0, 1)

def voronoi(size, n, seed, jitter=0.9):
    """Periodic Voronoi on a jittered n x n grid. Returns f1, f2 (distances in cell units), id (0-1 per cell), and the cell-centre offsets."""
    r = rng(seed)
    px = (np.arange(n)[None, :] + 0.5 + (r.random((n, n)) - 0.5) * jitter)
    py = (np.arange(n)[:, None] + 0.5 + (r.random((n, n)) - 0.5) * jitter)
    ids = r.random((n, n))
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    x = (x + 0.5) / size * n; y = (y + 0.5) / size * n
    cx = np.floor(x).astype(int); cy = np.floor(y).astype(int)
    f1 = np.full((size, size), 9.0, np.float32); f2 = np.full((size, size), 9.0, np.float32)
    idm = np.zeros((size, size), np.float32); ox = np.zeros((size, size), np.float32); oy = np.zeros((size, size), np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            ix = cx + dx; iy = cy + dy
            qx = px[iy % n, ix % n] + (ix - ix % n); qy = py[iy % n, ix % n] + (iy - iy % n)
            d = np.sqrt((qx - x) ** 2 + (qy - y) ** 2).astype(np.float32)
            closer = d < f1
            f2 = np.where(closer, f1, np.minimum(f2, d))
            idm = np.where(closer, ids[iy % n, ix % n], idm)
            ox = np.where(closer, qx - x, ox); oy = np.where(closer, qy - y, oy)
            f1 = np.where(closer, d, f1)
    return f1, f2, idm.astype(np.float32), ox, oy

def sample_offset(img, ox, oy):
    """Read img with a per-pixel integer offset (wraps). ox/oy in pixels."""
    h, w = img.shape[:2]
    y, x = np.mgrid[0:h, 0:w]
    return img[(y + oy.astype(int)) % h, (x + ox.astype(int)) % w]

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

# ---------- output ----------
def pack_nar(n, ao, rough):
    return np.clip(np.stack([n[..., 0] * 0.5 + 0.5, n[..., 1] * 0.5 + 0.5, ao, rough], -1), 0, 1)

def save_master(outdir, name, albedo, alpha, n, ao, rough):
    os.makedirs(outdir, exist_ok=True)
    a = np.concatenate([np.clip(albedo, 0, 1), np.clip(alpha, 0, 1)[..., None]], -1)
    Image.fromarray((a * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(outdir, name + '_a.png'))
    Image.fromarray((pack_nar(n, ao, rough) * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(outdir, name + '_n.png'))

def lit_preview(albedo, n, ao, rough, light=(-0.55, -0.55, 0.63)):
    """Quick shaded preview (light from the top-left, raking) to judge the maps together."""
    L = np.asarray(light, np.float32); L /= np.linalg.norm(L)
    nl = np.clip(n[..., 0] * L[0] + n[..., 1] * L[1] + n[..., 2] * L[2], 0, 1)
    Hv = L + np.array([0, 0, 1], np.float32); Hv /= np.linalg.norm(Hv)
    nh = np.clip(n[..., 0] * Hv[0] + n[..., 1] * Hv[1] + n[..., 2] * Hv[2], 0, 1)
    gl = 1 - rough
    spec = nh ** (4 + gl * gl * 180) * gl * 0.5
    lin = s2l(albedo) * (nl[..., None] * 1.5 + 0.28 * ao[..., None]) + spec[..., None]
    return np.clip(l2s(lin / (1 + lin * 0.25)), 0, 1)
