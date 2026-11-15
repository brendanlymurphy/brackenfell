"""List or fetch single items of a remote asset-pack zip with HTTP range requests (the mirror is slow, the packs are big).
usage: rzip.py list <url>   |   rzip.py get <url> <dest dir> <name substring> [...]"""
import sys, os
from remotezip import RemoteZip
mode, url = sys.argv[1], sys.argv[2]
with RemoteZip(url, timeout=120) as z:
    if mode == 'list':
        import collections
        c = collections.Counter()
        for i in z.infolist(): c['/'.join(i.filename.split('/')[:2])] += i.compress_size
        for k, v in sorted(c.items()): print('%8.1f MB  %s' % (v / 1e6, k))
    else:
        dest, keys = sys.argv[3], sys.argv[4:]
        for i in z.infolist():
            if i.is_dir() or not any(k in i.filename for k in keys) or i.filename.endswith('.thumb') and False: continue
            out = os.path.join(dest, i.filename)
            if os.path.exists(out) and os.path.getsize(out) == i.file_size: continue
            z.extract(i, dest); print('got', i.filename, i.file_size, flush=True)
