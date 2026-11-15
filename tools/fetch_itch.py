# Fetches the free files of a "name your own price" itch.io page without paying or signing in:
# the same three requests the "No thanks, just take me to the downloads" link makes.
import sys, re, json, urllib.request, urllib.parse, http.cookiejar, os
page, outdir, want = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3:]
cj = http.cookiejar.CookieJar(); op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36')]
html = op.open(page, timeout=60).read().decode('utf8', 'replace')
m = re.search(r'name="csrf_token" value="([^"]+)"', html) or re.search(r'<meta name="csrf_token" value="([^"]+)"', html)
csrf = m.group(1) if m else ''
r = json.loads(op.open(urllib.request.Request(page + '/download_url', data=urllib.parse.urlencode({'csrf_token': csrf}).encode()), timeout=60).read())
print('download page:', r)
dl = op.open(r['url'], timeout=60).read().decode('utf8', 'replace')
ups = re.findall(r'data-upload_id="(\d+)"', dl); names = re.findall(r'<strong title="([^"]+)" class="name"', dl)
print('uploads:', list(zip(ups, names)))
key = urllib.parse.unquote(urllib.parse.urlparse(r['url']).path.rstrip('/').split('/')[-1])
os.makedirs(outdir, exist_ok=True)
for uid, name in zip(ups, names):
    if want and not any(w.lower() in name.lower() for w in want): continue
    m2 = re.search(r'name="csrf_token" value="([^"]+)"', dl); csrf2 = m2.group(1) if m2 else csrf
    j = json.loads(op.open(urllib.request.Request(f'{page}/file/{uid}?source=game_download', data=urllib.parse.urlencode({'csrf_token': csrf2}).encode(), headers={'Referer': r['url'], 'X-Requested-With': 'XMLHttpRequest'}), timeout=60).read())
    print(name, '->', urllib.parse.urlparse(j.get('url', '')).netloc)
    if 'url' not in j: print('  no url:', j); continue
    dst = os.path.join(outdir, name)
    with op.open(j['url'], timeout=120) as resp, open(dst, 'wb') as f:
        while True:
            b = resp.read(1 << 20)
            if not b: break
            f.write(b)
    print('  saved', dst, os.path.getsize(dst))
