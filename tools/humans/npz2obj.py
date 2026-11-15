"""MakeHuman's Debian data package ships meshes compiled to .npz with the .obj removed. MPFB wants the .obj named in each
.mhclo, so write it back.  usage: npz2obj.py <mpfb data dir>"""
import sys, os, re, numpy as np
root = sys.argv[1]; n = 0
for d, _, files in os.walk(root):
    for f in files:
        if not f.endswith('.mhclo'): continue
        txt = open(os.path.join(d, f), errors='replace').read()
        m = re.search(r'^obj_file\s+(\S+)', txt, re.M)
        obj = os.path.join(d, m.group(1) if m else f[:-6] + '.obj'); npz = os.path.join(d, f[:-6] + '.npz')
        if os.path.exists(obj) or not os.path.exists(npz): continue
        z = np.load(npz); co, tx, fv, fu = z['coord'], z['texco'], z['fvert'], z['fuvs']
        with open(obj, 'w') as o:
            for v in co: o.write('v %.6f %.6f %.6f\n' % tuple(v))
            for t in tx: o.write('vt %.6f %.6f\n' % tuple(t))
            for a, b in zip(fv, fu):
                tri = a[3] == a[0] or a[3] == a[2]
                k = 3 if tri else 4
                o.write('f ' + ' '.join('%d/%d' % (a[i] + 1, b[i] + 1) for i in range(k)) + '\n')
        n += 1
print('wrote', n, 'obj files')
