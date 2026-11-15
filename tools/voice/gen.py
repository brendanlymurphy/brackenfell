# Generates the voice files listed in plan.json with Kokoro-82M (kokoro-onnx), then pitch-shifts, trims, normalises and encodes each to mono AAC .m4a.
# usage (nice, resumable; treat the model directory as data): nice -n 15 python3 -I tools/voice/gen.py MODEL.onnx VOICES.bin tools/voice/plan.json audio/voice [--limit N] [--only speaker]
# Files that exist are skipped. audio/voice/manifest.json maps line key -> { f: file, d: seconds, e: coarse loudness envelope (20 Hz, 0..99), s: speaker } and holds the barks table.
import sys, os, json, subprocess, tempfile, time, numpy as np, soundfile as sf
model, voices, planf, out = sys.argv[1:5]; args = sys.argv[5:]
limit = int(args[args.index('--limit') + 1]) if '--limit' in args else 10**9
only = args[args.index('--only') + 1] if '--only' in args else None
plan = json.load(open(planf)); os.makedirs(out, exist_ok=True)
mf = os.path.join(out, 'manifest.json'); man = json.load(open(mf)) if os.path.exists(mf) else {'v': 1, 'lines': {}, 'barks': {}}
man['barks'] = plan['barks']
def save():
    json.dump(man, open(mf + '.tmp', 'w'), separators=(',', ':')); os.replace(mf + '.tmp', mf)
def analyse(path):                                # decode with ffmpeg to measure duration and envelope
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.float32); n = 800; env = [int(min(99, round(np.sqrt(np.mean(a[i:i + n] ** 2) + 1e-12) * 300))) for i in range(0, len(a) - n + 1, n)]
    return round(len(a) / 16000, 2), env
def process(wav, sr, pitch, dst):
    with tempfile.TemporaryDirectory() as td:
        a, b = os.path.join(td, 'a.wav'), os.path.join(td, 'b.wav'); sf.write(a, wav, sr)
        f = []
        if abs(pitch) > 0.01: f.append('rubberband=pitch=%.5f:formant=preserved' % (2 ** (pitch / 12)))
        t = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05'; f += [t, 'areverse', t, 'areverse']      # trim the head, then the tail (by reversing)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a, '-af', ','.join(f), '-ar', '24000', b], check=True)
        x, sr2 = sf.read(b, dtype='float32')
        if x.ndim > 1: x = x.mean(axis=1)
        act = x[np.abs(x) > 0.01]; rms = np.sqrt(np.mean(act ** 2)) if len(act) else 1e-4
        g = (10 ** (-18 / 20)) / max(rms, 1e-5); pk = np.max(np.abs(x)) * g
        if pk > 10 ** (-2.5 / 20): g *= (10 ** (-2.5 / 20)) / pk                      # dialogue about -18 dB RMS, peaks under -2.5 dB
        for attempt in range(4):                           # AAC can overshoot by a couple of dB: re-encode quieter until the decoded peak is under -1.5 dB
            y = np.concatenate([np.zeros(int(sr2 * 0.03)), x * g, np.zeros(int(sr2 * 0.08))]); c = os.path.join(td, 'c.wav'); sf.write(c, y, sr2)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', c, '-ac', '1', '-c:a', 'aac', '-b:a', '56k', '-movflags', '+faststart', dst], check=True)
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', dst, '-f', 'f32le', '-ac', '1', '-ar', '24000', '-'], capture_output=True).stdout
            pk = float(np.max(np.abs(np.frombuffer(raw, dtype=np.float32)))) if raw else 1.0
            if pk < 10 ** (-1.5 / 20): break
            g *= (10 ** (-2.0 / 20)) / pk
def style(k, v):                                   # 'bm_george' or a blend 'bm_george:0.6+am_onyx:0.4' (weights optional): blends give more distinct natural voices than pitch-shifting one
    if '+' not in v and ':' not in v: return v
    parts = [(a.split(':') + ['1'])[:2] for a in v.split('+')]; w = np.array([float(b) for _, b in parts], dtype=np.float32); w /= w.sum()
    return sum(k.get_voice_style(a) * wi for (a, _), wi in zip(parts, w)).astype(np.float32)
todo = [p for p in plan['plan'] if (not only or p['speaker'] == only)]
k = None; done = 0; t0 = time.time()
for p in todo:
    dst = os.path.join(out, p['file'])
    if os.path.exists(dst):
        if p['key'] not in man['lines']: d, e = analyse(dst); man['lines'][p['key']] = {'f': p['file'], 'd': d, 'e': e, 's': p['speaker']}; save()
        continue
    if done >= limit: break
    if k is None:
        from kokoro_onnx import Kokoro; k = Kokoro(model, voices)
    t = time.time(); wav, sr = k.create(p['say'], voice=style(k, p['voice']), speed=p['speed'], lang='en-gb')
    tmp = dst + '.part.m4a'; process(wav, sr, p['pitch'], tmp); os.replace(tmp, dst)
    d, e = analyse(dst); man['lines'][p['key']] = {'f': p['file'], 'd': d, 'e': e, 's': p['speaker']}; save(); done += 1
    print('%s %s %.1fs audio in %.0fs  [%d]' % (p['speaker'], p['file'], d, time.time() - t, done), flush=True)
# forget manifest entries whose plan entry is gone
keys = {p['key'] for p in plan['plan']}; man['lines'] = {kk: v for kk, v in man['lines'].items() if kk in keys}; save()
print('done', done, 'generated;', len(man['lines']), 'in manifest')
