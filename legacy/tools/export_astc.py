#!/usr/bin/env python3
"""ASTC variant of the texture pack: every mip level pre-compressed, one file per layer and map.
usage: export_astc.py <master dir> <dist/tex dir> [quality]
file: 'BFTX', block w, block h, u16 size, u8 mip count, pad to 16 bytes, then the raw blocks of each mip level."""
import sys, os, struct, numpy as np, cv2
from multiprocessing import Pool
from PIL import Image
import astc_encoder as A
M, OUT = sys.argv[1], sys.argv[2]
Q = float(sys.argv[3]) if len(sys.argv) > 3 else 60.0
NAMES = ['plaster', 'timber', 'planks', 'stone', 'cobble', 'thatch', 'shingle', 'dirt', 'grass', 'rock', 'bark', 'grass2', 'forest', 'mud', 'soil', 'gravel', 'moss', 'plain', 'birch', 'pine', 'leaves', 'impostor', 'cloth', 'metal', 'stripes']
RES = 1020            # a multiple of both block sizes, as compressed textures require
def png_wrap(data, width=2048):
    """The artifact host only serves web file types, so each blob travels as a grey PNG whose pixel bytes are the data (rows unfiltered, last row zero padded)."""
    import zlib
    h = (len(data) + width - 1) // width
    data = data + b'\0' * (h * width - len(data))
    raw = b''.join(b'\0' + data[y * width:(y + 1) * width] for y in range(h))
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, h, 8, 0, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b'')
def s2l(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def l2s(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)
def mips(img, srgb):
    """img float RGBA 0-1 at master size -> list of uint8 levels from RES down to 1 (colour averaged in linear light)."""
    a = img.copy()
    if srgb: a[..., :3] = s2l(a[..., :3])
    out = []; w = RES
    while True:
        lv = cv2.resize(a, (w, w), interpolation=cv2.INTER_AREA).reshape(w, w, 4)
        if srgb: lv = np.concatenate([l2s(lv[..., :3]), lv[..., 3:]], -1)
        out.append((np.clip(lv, 0, 1) * 255 + 0.5).astype(np.uint8))
        if w == 1: break
        w = max(1, w // 2)
    return out
def encode(levels, bx, by, srgb):
    cfg = A.ASTCConfig(A.ASTCProfile.LDR_SRGB if srgb else A.ASTCProfile.LDR, bx, by, 1, Q)
    ctx = A.ASTCContext(cfg); sw = A.ASTCSwizzle.from_str('RGBA')
    blob = b'BFTX' + struct.pack('<BBHB', bx, by, RES, len(levels)) + b'\0' * 7
    for lv in levels:
        h, w = lv.shape[:2]
        data = ctx.compress(A.ASTCImage(A.ASTCType.U8, w, h, 1, np.ascontiguousarray(lv).tobytes()), sw)
        assert len(data) == ((w + bx - 1) // bx) * ((h + by - 1) // by) * 16, (w, len(data))
        blob += data
    return blob
def job(n):
    a = np.asarray(Image.open(os.path.join(M, n + '_a.png')).convert('RGBA')).astype(np.float32) / 255
    m = np.asarray(Image.open(os.path.join(M, n + '_n.png')).convert('RGBA')).astype(np.float32) / 255
    ba = encode(mips(a, True), 6, 6, True); bn = encode(mips(m, False), 5, 5, False)
    open(os.path.join(OUT, 'a_' + n + '.png'), 'wb').write(png_wrap(ba)); open(os.path.join(OUT, 'n_' + n + '.png'), 'wb').write(png_wrap(bn))
    return n, len(ba), len(bn)
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[4:] or NAMES
    with Pool(min(8, os.cpu_count() or 2)) as p: res = p.map(job, only)
    print('astc', len(res), 'layers', round(sum(r[1] + r[2] for r in res) / 1e6, 1), 'MB  (albedo', res[0][1] // 1024, 'KB, maps', res[0][2] // 1024, 'KB each)')
