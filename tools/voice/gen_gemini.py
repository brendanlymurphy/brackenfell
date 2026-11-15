# Generates the voice files listed in plan.json with Google's Gemini 3.1 Flash TTS (hosted), then trims, normalises and encodes each to mono
# AAC .m4a, exactly like gen.py does for Kokoro. Needs an API key in the environment variable GEMINI_API_KEY (never put the key in the repo
# or on the command line) and network access to generativelanguage.googleapis.com.
# usage:  python3 -I tools/voice/gen_gemini.py tools/voice/plan.json tools/voice/cast_gemini.json OUTDIR [--limit N] [--only speaker] [--sample]
#   OUTDIR is audio/voice for the real thing, or a scratch folder with --sample (one mid-length line per speaker, joined into OUTDIR/sample.m4a).
# Files that exist are skipped (resumable). File names hash the speaker, Gemini voice, direction and text, so a changed casting regenerates.
# NOT YET RUN AGAINST THE LIVE API (written without a key): check the request shape against https://ai.google.dev/gemini-api/docs/speech-generation
# on first use. The response carries base64 PCM (16-bit little-endian mono, 24 kHz) in candidates[0].content.parts[0].inlineData.data.
import sys, os, json, base64, hashlib, subprocess, tempfile, time, urllib.request, urllib.error
import numpy as np, soundfile as sf
planf, castf, out = sys.argv[1:4]; args = sys.argv[4:]
limit = int(args[args.index('--limit') + 1]) if '--limit' in args else 10**9
only = args[args.index('--only') + 1] if '--only' in args else None
sample = '--sample' in args
KEY = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
# No key in the environment is fine when the cloud environment has a network secret for generativelanguage.googleapis.com
# (header x-goog-api-key): the proxy attaches it after the request leaves the machine, and this script never sees it.
MODEL = os.environ.get('GEMINI_TTS_MODEL', 'gemini-3.1-flash-tts-preview')
URL = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent' % MODEL
plan = json.load(open(planf)); cast = json.load(open(castf)); style = cast.get('_style', ''); os.makedirs(out, exist_ok=True)

def tts(text, voice, direction):
    prompt = '%s %s Say exactly this line, in character, and nothing else:\n%s' % (style, direction, text)
    body = { 'contents': [{ 'parts': [{ 'text': prompt }] }],
             'generationConfig': { 'responseModalities': ['AUDIO'], 'speechConfig': { 'voiceConfig': { 'prebuiltVoiceConfig': { 'voiceName': voice } } } } }
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=dict({ 'Content-Type': 'application/json' }, **({ 'x-goog-api-key': KEY } if KEY else {})))
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r: j = json.load(r)
            part = j['candidates'][0]['content']['parts'][0]['inlineData']
            return np.frombuffer(base64.b64decode(part['data']), dtype='<i2').astype(np.float32) / 32768.0, 24000
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf8', 'replace')[:300]
            if e.code in (429, 500, 503): time.sleep(8 * (attempt + 1)); continue       # rate limit (the free tier is slow) or a hiccup: wait and retry
            sys.exit('Gemini API error %d: %s' % (e.code, msg))
        except (KeyError, IndexError): time.sleep(4); continue                         # an empty candidate now and then: ask again
    sys.exit('gave up on: ' + text[:60])

def encode(x, sr, dst):
    with tempfile.TemporaryDirectory() as td:
        a, b = os.path.join(td, 'a.wav'), os.path.join(td, 'b.wav'); sf.write(a, x, sr)
        t = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a, '-af', ','.join([t, 'areverse', t, 'areverse']), '-ar', '24000', b], check=True)
        x, sr = sf.read(b, dtype='float32'); act = x[np.abs(x) > 0.01]; rms = np.sqrt(np.mean(act ** 2)) if len(act) else 1e-4
        g = (10 ** (-18 / 20)) / max(rms, 1e-5); pk = np.max(np.abs(x)) * g
        if pk > 10 ** (-2.5 / 20): g *= (10 ** (-2.5 / 20)) / pk                        # about -18 dB RMS, peaks under -2.5 dB; no other processing
        y = np.concatenate([np.zeros(int(sr * 0.03)), x * g, np.zeros(int(sr * 0.08))]).astype(np.float32); c = os.path.join(td, 'c.wav'); sf.write(c, y, sr)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', c, '-ac', '1', '-c:a', 'aac', '-b:a', '56k', '-movflags', '+faststart', dst], check=True)
        return y, sr

def analyse(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.float32); n = 800
    return round(len(a) / 16000, 2), [int(min(99, round(np.sqrt(np.mean(a[i:i + n] ** 2) + 1e-12) * 300))) for i in range(0, len(a) - n + 1, n)]

todo = [p for p in plan['plan'] if (not only or p['speaker'] == only)]
if sample:
    seen, pick = set(), []
    for p in todo:
        if p['speaker'] in seen or p['kind'] != 'line' or not (60 < len(p['say']) < 200): continue
        seen.add(p['speaker']); pick.append(p)
    parts = []
    for p in pick:
        c = cast.get(p['speaker']) or cast['narrator']; x, sr = tts(p['say'], c['voice'], c['direction']); y, sr = encode(x, sr, os.path.join(out, p['speaker'] + '.m4a'))
        parts += [y, np.zeros(int(sr * 0.6), dtype=np.float32)]; print(p['speaker'], c['voice'], round(len(y) / sr, 1), 's', flush=True)
    w = os.path.join(out, 'sample.wav'); sf.write(w, np.concatenate(parts), 24000)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-c:a', 'aac', '-b:a', '64k', os.path.join(out, 'sample.m4a')], check=True); print('wrote', os.path.join(out, 'sample.m4a')); sys.exit(0)

mf = os.path.join(out, 'manifest.json'); man = { 'v': 1, 'lines': {}, 'barks': plan['barks'] }; done = 0; keep = set()
for p in todo:
    c = cast.get(p['speaker']) or cast['narrator']
    name = hashlib.sha1('|'.join([p['speaker'], 'gemini', c['voice'], c['direction'], style, p['say']]).encode()).hexdigest()[:14] + '.m4a'; dst = os.path.join(out, name); keep.add(name)
    if not os.path.exists(dst):
        if done >= limit: continue
        x, sr = tts(p['say'], c['voice'], c['direction']); tmp = dst + '.part.m4a'; encode(x, sr, tmp); os.replace(tmp, dst); done += 1
        print('%s %s [%d]' % (p['speaker'], name, done), flush=True)
    d, e = analyse(dst); man['lines'][p['key']] = { 'f': name, 'd': d, 'e': e, 's': p['speaker'] }
    json.dump(man, open(mf + '.tmp', 'w'), separators=(',', ':')); os.replace(mf + '.tmp', mf)
missing = len(todo) - len(man['lines'])
print('done: %d generated, %d of %d lines in the manifest%s' % (done, len(man['lines']), len(todo), '' if missing else '; every line has a file'))
if not missing and not only:                                                             # only once the set is complete: drop the old engine's files
    for f in os.listdir(out):
        if f.endswith('.m4a') and f not in keep: os.remove(os.path.join(out, f))
