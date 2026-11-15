#!/usr/bin/env python3
"""Step 3 of the tree builder: makes the baked atlas usable with alpha testing. Needles are thinner than a texel, so their coverage is
low; this thickens and boosts it, then bleeds colour into the empty texels so mip-mapping does not pull in black.
usage: tree_post.py <bake dir>/<name> [gain] [size]"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
d = sys.argv[1]; gain = float(sys.argv[2]) if len(sys.argv) > 2 else 3.2; size = int(sys.argv[3]) if len(sys.argv) > 3 else 2048
im = np.asarray(Image.open(d + '/atlas_raw.png').convert('RGBA')).astype(np.float32) / 255
rgb, a = im[..., :3], im[..., 3]
a2 = np.clip((0.55 * a + 0.45 * ndi.maximum_filter(a, size=3)) * gain, 0, 1)
a2 = np.clip(ndi.gaussian_filter(a2, 0.6) * 1.15, 0, 1)
known = a > 0.02
idx = ndi.distance_transform_edt(~known, return_distances=False, return_indices=True)
rgb = rgb[idx[0], idx[1]]
out = Image.fromarray((np.concatenate([rgb, a2[..., None]], -1) * 255 + 0.5).astype(np.uint8), 'RGBA')
if size != out.size[0]: out = out.resize((size, size), Image.LANCZOS)
out.save(d + '/atlas.png')
print(d.split('/')[-1], 'atlas: texels over the cut-off', round(float((a2 > 0.5).mean()), 3), 'of', size)
