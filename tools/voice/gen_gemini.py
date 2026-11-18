# Generates the voice files listed in plan.json with Google's Gemini 3.1 Flash TTS (hosted), then trims, normalises and encodes each to mono
# AAC .m4a, exactly like gen.py does for Kokoro. Needs an API key in the environment variable GEMINI_API_KEY (never put the key in the repo
# or on the command line) and network access to generativelanguage.googleapis.com.
# usage:  python3 -I tools/voice/gen_gemini.py tools/voice/plan.json tools/voice/cast_gemini.json OUTDIR [--limit N] [--only speaker] [--sample] [--partial] [--have] [--batch N]
#   OUTDIR is audio/voice for the real thing, or a scratch folder with --sample (one mid-length line per speaker, joined into OUTDIR/sample.m4a).
# Files that exist are skipped (resumable). File names hash the speaker, Gemini voice, direction and text, so a changed casting regenerates.
# NOT YET RUN AGAINST THE LIVE API (written without a key): check the request shape against https://ai.google.dev/gemini-api/docs/speech-generation
# on first use. The response carries base64 PCM (16-bit little-endian mono, 24 kHz) in candidates[0].content.parts[0].inlineData.data.
import sys, os, io, json, base64, hashlib, subprocess, tempfile, time, urllib.request, urllib.error
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

# [cast] the sixty share ten voices: a plan entry of theirs names its voice class (`as`, e.g. v.M1) and a word on who is speaking (`note`: age and trade),
# which is added to the class's direction so that a tanner of forty-five and a merchant of fifty-two are not one man.
def who(p):
    c = cast.get(p['speaker'])
    if c: return c
    c = cast.get(p.get('as') or '')
    if c: return { 'voice': c['voice'], 'direction': (c['direction'] + ' ' + p.get('note', '')).strip() }
    return cast['narrator']

def tts(text, voice, direction):
    prompt = '%s %s Say exactly this line, in character, and nothing else:\n%s' % (style, direction, text)
    body = { 'contents': [{ 'parts': [{ 'text': prompt }] }],
             'generationConfig': { 'responseModalities': ['AUDIO'], 'speechConfig': { 'voiceConfig': { 'prebuiltVoiceConfig': { 'voiceName': voice } } } } }
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=dict({ 'Content-Type': 'application/json' }, **({ 'x-goog-api-key': KEY } if KEY else {})))
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=120) as r: j = json.load(r)
            part = next(q['inlineData'] for q in j['candidates'][0]['content']['parts'] if 'inlineData' in q)       # the audio part (mimeType audio/L16;codec=pcm;rate=24000)
            raw = base64.b64decode(part['data'])
            if raw[:4] == b'RIFF' or 'wav' in part.get('mimeType', ''):              # newer models (gemini-3.8-flash-tts) send a WAV file, not bare samples
                x, rate = sf.read(io.BytesIO(raw), dtype='float32'); return (x.mean(axis=1) if x.ndim > 1 else x).astype(np.float32), rate
            rate = int((part.get('mimeType', '').split('rate=') + ['24000'])[1].split(';')[0] or 24000)
            return np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0, rate
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf8', 'replace')[:900]
            if e.code == 429 and 'per_day' in msg: sys.exit('Daily request limit for this model reached (' + text[:40] + '...). Run again after it resets: finished files are kept. ' + msg[-120:].replace('\n', ' '))
            if e.code in (429, 500, 503): time.sleep(8 * (attempt + 1)); continue       # rate limit (the free tier is slow) or a hiccup: wait and retry
            sys.exit('Gemini API error %d: %s' % (e.code, msg))
        except (KeyError, IndexError, StopIteration): time.sleep(4); continue                         # an empty candidate now and then: ask again
    sys.exit('gave up on: ' + text[:60])

# --batch N: several lines of one character in one request (the daily limit counts requests, not seconds of speech). The lines are sent
# numbered, the model is asked to leave a long pause between them, and the take is cut at its N - 1 longest silences. Each piece must
# then have a plausible length for its text, or the whole batch is thrown away and those lines are asked for one by one as before.
def tts_batch(says, voice, direction):
    listing = '\n'.join('%d. %s' % (i + 1, t) for i, t in enumerate(says))
    x, sr = tts('(%d separate lines follow, numbered. Say each one exactly, in character, as its own remark. Leave three full seconds of silence after each line. Never say the numbers.)\n%s' % (len(says), listing), voice, direction)
    n = int(sr * 0.02); fr = np.array([np.sqrt(np.mean(x[i:i + n] ** 2) + 1e-12) for i in range(0, len(x) - n + 1, n)]); quiet = fr < max(fr.max() * 0.02, 1e-4)
    gaps = []; i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]: j += 1
            if i > 0 and j < len(quiet): gaps.append((j - i, i, j))            # silences inside the take, not at its ends
            i = j
        else: i += 1
    gaps.sort(reverse=True); cuts = sorted((a + b) // 2 for _, a, b in gaps[:len(says) - 1])
    if len(cuts) < len(says) - 1 or any(g[0] * 0.02 < 0.7 for g in gaps[:len(says) - 1]): return None            # the pauses are not all there: do not guess
    edges = [0] + [c * n for c in cuts] + [len(x)]; parts = [x[edges[k]:edges[k + 1]] for k in range(len(says))]
    rate = [len(t) / max(0.2, float(np.sum(np.abs(p) > max(np.abs(x).max() * 0.02, 1e-4))) / sr) for t, p in zip(says, parts)]            # characters per second of actual sound
    med = sorted(rate)[len(rate) // 2]
    if any(r < med * 0.45 or r > med * 2.2 for r in rate): return None            # a piece far too long or short for its text: a cut landed inside a line, or lines ran together
    return parts, sr

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
        sk = p.get('as') or p['speaker']            # one clip per voice: the sixty share ten
        if sk in seen or p['kind'] != 'line' or not (60 < len(p['say']) < 200): continue
        if '--new' in args and p['speaker'] in cast: continue            # --new: only voices that have never been heard (the ten classes)
        seen.add(sk); pick.append(p)
    parts = []
    for p in pick:
        c = who(p); x, sr = tts(p['say'], c['voice'], c['direction']); y, sr = encode(x, sr, os.path.join(out, (p.get('as') or p['speaker']) + '.m4a'))
        parts += [y, np.zeros(int(sr * 0.6), dtype=np.float32)]; print(p.get('as') or p['speaker'], '(' + p['speaker'] + ')', c['voice'], round(len(y) / sr, 1), 's', flush=True)
    w = os.path.join(out, 'sample.wav'); sf.write(w, np.concatenate(parts), 24000)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-c:a', 'aac', '-b:a', '64k', os.path.join(out, 'sample.m4a')], check=True); print('wrote', os.path.join(out, 'sample.m4a')); sys.exit(0)

mf = os.path.join(out, 'manifest.json'); man = { 'v': 1, 'lines': {}, 'barks': plan['barks'] }; done = 0; keep = set()
if '--partial' in args:
    # No API calls. For each character, the conversation lines switch to Gemini once all of them have a file, and likewise the barks
    # (the short calls in passing); every other line keeps the manifest's current (Kokoro) file. Use while a run is waiting for the
    # daily limit; a later full run finishes the job. Until then a character can converse in one voice and call out in the other.
    old = json.load(open(mf)); name_of = {}; by = {}
    for p in todo:
        c = who(p)
        name_of[p['key']] = hashlib.sha1('|'.join([p['speaker'], 'gemini', c['voice'], c['direction'], style, p['say']]).encode()).hexdigest()[:14] + '.m4a'
        by.setdefault((p['speaker'], p['kind']), []).append(p)
    ready = sorted(g for g, ps in by.items() if all(os.path.exists(os.path.join(out, name_of[p['key']])) for p in ps)); n = 0
    for p in todo:
        if (p['speaker'], p['kind']) in ready: d, e = analyse(os.path.join(out, name_of[p['key']])); old['lines'][p['key']] = { 'f': name_of[p['key']], 'd': d, 'e': e, 's': p['speaker'] }; n += 1
    json.dump(old, open(mf + '.tmp', 'w'), separators=(',', ':')); os.replace(mf + '.tmp', mf)
    print('%d lines now Gemini:' % n, ', '.join('%s %ss' % g for g in ready) or 'none'); print('still Kokoro:', ', '.join('%s %ss' % g for g in sorted(set(by) - set(ready)))); sys.exit(0)
if '--have' in args:
    # No API calls. Write the game's manifest from the lines that have a file now, so each day's batch can ship while the rest waits for
    # the daily limit: a line without a file is simply not listed and stays a subtitle. A file that is far too long for its text (the
    # model reading its direction aloud, see docs/DECISIONS.md) is deleted here and asked for again on the next run.
    n = 0
    for p in todo:
        c = who(p); name = hashlib.sha1('|'.join([p['speaker'], 'gemini', c['voice'], c['direction'], style, p['say']]).encode()).hexdigest()[:14] + '.m4a'; dst = os.path.join(out, name)
        if not os.path.exists(dst): continue
        d, e = analyse(dst)
        if (d > 30 and d > len(p['say']) * 0.13) or d > max(4, len(p['say']) * 0.45): print('TOO LONG, removed: %s %.1fs %s' % (p['speaker'], d, p['say'][:50])); os.remove(dst); continue
        man['lines'][p['key']] = { 'f': name, 'd': d, 'e': e, 's': p['speaker'] }; n += 1
    old = json.load(open(mf)) if os.path.exists(mf) else {}
    for k, v in old.get('lines', {}).items():                       # keep what other tools added to an entry (lip-sync tracks) when the file is the same
        if k in man['lines'] and v.get('f') == man['lines'][k]['f']: man['lines'][k] = dict(v, **man['lines'][k])
    json.dump(man, open(mf + '.tmp', 'w'), separators=(',', ':')); os.replace(mf + '.tmp', mf)
    print('%d of %d lines have audio and are in the manifest' % (n, len(todo))); sys.exit(0)
batch = int(args[args.index('--batch') + 1]) if '--batch' in args else 0
if batch > 1:            # first pass: missing lines, character by character, several per request; whatever fails is left for the one-by-one pass below
    def fname(p):
        c = who(p); return hashlib.sha1('|'.join([p['speaker'], 'gemini', c['voice'], c['direction'], style, p['say']]).encode()).hexdigest()[:14] + '.m4a'
    by = {}
    for p in todo:
        if not os.path.exists(os.path.join(out, fname(p))): by.setdefault(p['speaker'], []).append(p)
    for sp, ps in by.items():
        c = who(ps[0])
        for k in range(0, len(ps), batch):
            grp = ps[k:k + batch]
            if len(grp) < 2 or done >= limit: continue
            got = tts_batch([p['say'] for p in grp], c['voice'], c['direction']); done += 1
            if not got: print('%s: batch of %d could not be cut cleanly, falling back to single lines' % (sp, len(grp)), flush=True); continue
            for p, part in zip(grp, got[0]): dst = os.path.join(out, fname(p)); tmp = dst + '.part.m4a'; encode(part, got[1], tmp); os.replace(tmp, dst)
            print('%s: %d lines in one request' % (sp, len(grp)), flush=True)
for p in todo:
    c = who(p)
    name = hashlib.sha1('|'.join([p['speaker'], 'gemini', c['voice'], c['direction'], style, p['say']]).encode()).hexdigest()[:14] + '.m4a'; dst = os.path.join(out, name); keep.add(name)
    if not os.path.exists(dst):
        if done >= limit: continue
        x, sr = tts(p['say'], c['voice'], c['direction']); tmp = dst + '.part.m4a'; encode(x, sr, tmp); os.replace(tmp, dst); done += 1
        print('%s %s [%d]' % (p['speaker'], name, done), flush=True)
    d, e = analyse(dst); man['lines'][p['key']] = { 'f': name, 'd': d, 'e': e, 's': p['speaker'] }
    json.dump(man, open(mf + '.tmp', 'w'), separators=(',', ':')); os.replace(mf + '.tmp', os.path.join(out, 'manifest.partial.json'))      # the game's own manifest is only replaced when the set is complete (below): a half-finished run must not leave lines without a file
missing = len(todo) - len(man['lines'])
if not missing and not only: os.replace(os.path.join(out, 'manifest.partial.json'), mf)
print('done: %d generated, %d of %d lines in the manifest%s' % (done, len(man['lines']), len(todo), '' if missing else '; every line has a file'))
if not missing and not only:                                                             # only once the set is complete: drop the old engine's files
    for f in os.listdir(out):
        if f.endswith('.m4a') and f not in keep: os.remove(os.path.join(out, f))
