# [audit] Every recorded line: clip length against text length (characters per second), silence at either end, very short clips.
# Headless: this measures the files, it does not judge how they sound. usage: python3 test/audit/voice_lengths.py <dir with audio/voice and tools/voice/plan.json>
# -> docs/audit/VOICE_LENGTHS.md and shots/audit/voice_lengths.json
import json, sys, os, re, subprocess, statistics
root = sys.argv[1]; man = json.load(open(os.path.join(root, 'audio/voice/manifest.json'))); L = man.get('lines', man)
plan = json.load(open(os.path.join(root, 'tools/voice/plan.json'))); P = {p['key']: p for p in plan['plan']}
def probe(f):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'silencedetect=noise=-45dB:d=0.12', '-f', 'null', '-'], capture_output=True, text=True).stderr
    dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r); dur = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3)) if dur else None
    starts = [float(x) for x in re.findall(r'silence_start: ([\-\d.]+)', r)]; ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    lead = ends[0] if starts and abs(starts[0]) < 0.02 and ends else 0.0
    tail = dur - starts[-1] if starts and dur and (len(ends) < len(starts) or (ends and ends[-1] >= dur - 0.05)) else 0.0
    gaps = [e - s for s, e in zip(starts, ends) if s > 0.05 and e < (dur or 0) - 0.05]
    return dur, lead, tail, max(gaps) if gaps else 0.0
rows = []
for key, e in L.items():
    f = os.path.join(root, 'audio/voice', e['f']); p = P.get(key, {}); text = p.get('text', ''); sp = p.get('speaker', '?')
    if not os.path.exists(f): rows.append(dict(key=key, speaker=sp, text=text, err='file missing')); continue
    dur, lead, tail, gap = probe(f); speech = max(0.01, (dur or 0) - lead - tail)
    rows.append(dict(key=key, file=e['f'], speaker=sp, kind=p.get('kind', ''), chars=len(text), dur=round(dur or 0, 2), lead=round(lead, 2), tail=round(tail, 2), gap=round(gap, 2), cps=round(len(text) / speech, 1) if text else None, text=text))
ok = [r for r in rows if r.get('cps')]
cps = [r['cps'] for r in ok]; med = statistics.median(cps)
json.dump(rows, open('shots/audit/voice_lengths.json', 'w'), indent=1)
def row(r): return f"| {r['speaker']} | {r['dur']} | {r['chars']} | **{r['cps']}** | {r['lead']} / {r['tail']} | {r['gap']} | {r['text'].replace(chr(10), ' ')[:110]} | `{r['file']}` |"
H = '| Speaker | Clip s | Characters | Chars per s of speech | Silence start / end s | Longest pause s | Text (start) | File |\n|---|---|---|---|---|---|---|---|'
fast = sorted(ok, key=lambda r: -r['cps'])[:20]; slow = sorted(ok, key=lambda r: r['cps'])[:20]
short = [r for r in ok if r['dur'] < 0.6]; quiet = [r for r in ok if r['lead'] > 0.5 or r['tail'] > 0.5]; pause = [r for r in ok if r['gap'] > 1.5]
by = {}
for r in ok: by.setdefault(r['speaker'], []).append(r['cps'])
o = ['# Recorded lines: length against text (for the owner\'s ear)', '',
     f'Made by `python3 test/audit/voice_lengths.py` from branch `fork-cull` (the only branch with the 529 recordings; `main` and `threejs` have 254).',
     'Each file decoded with ffmpeg; silence is anything under -45 dB for at least 0.12 s. Characters per second counts the text\'s characters over the clip',
     'with its leading and trailing silence removed. **Nothing was listened to**: this list only says which clips to listen to first.', '',
     f'| | |', '|---|---|', f'| Lines with a file | {len(rows)} ({sum(1 for r in rows if r.get("err"))} missing) |',
     f'| Characters per second: median / 10th / 90th percentile | {med} / {sorted(cps)[len(cps) // 10]} / {sorted(cps)[len(cps) * 9 // 10]} |',
     f'| Clips under 0.6 s | {len(short)} |', f'| More than 0.5 s of silence at the start or the end | {len(quiet)} |', f'| A pause of more than 1.5 s inside the line | {len(pause)} |', '',
     'A natural reading pace is around 14 to 16 characters per second. Much faster usually means words dropped or rushed; much slower means a long pause,',
     'a drawn-out reading, or something said that is not in the text (a model once read its acting direction aloud).', '',
     '## The 20 fastest', '', H] + [row(r) for r in fast] + ['', '## The 20 slowest', '', H] + [row(r) for r in slow]
o += ['', '## Silence of more than 0.5 s at either end', '', H] + [row(r) for r in sorted(quiet, key=lambda r: -max(r['lead'], r['tail']))] if quiet else ['', '## Silence of more than 0.5 s at either end', '', 'None.']
o += ['', '## Pauses of more than 1.5 s inside a line', '', H] + [row(r) for r in sorted(pause, key=lambda r: -r['gap'])] if pause else ['', '## Pauses of more than 1.5 s inside a line', '', 'None.']
o += ['', '## Clips under 0.6 s', '', H] + [row(r) for r in short] if short else ['', '## Clips under 0.6 s', '', 'None.']
o += ['', '## Pace by speaker (median characters per second)', '', '| Speaker | Lines | Median | Fastest | Slowest |', '|---|---|---|---|---|'] + [f'| {k} | {len(v)} | {statistics.median(v)} | {max(v)} | {min(v)} |' for k, v in sorted(by.items(), key=lambda kv: -statistics.median(kv[1]))]
open('docs/audit/VOICE_LENGTHS.md', 'w').write('\n'.join(o) + '\n')
print(len(rows), 'median', med, 'short', len(short), 'quiet', len(quiet), 'pause', len(pause)); print('fast', [(r['speaker'], r['cps']) for r in fast[:5]]); print('slow', [(r['speaker'], r['cps']) for r in slow[:5]])
