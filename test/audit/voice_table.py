# [audit] docs/audit/voice.md from the lines recorded by test/audit/voicebot.mjs. usage: python3 test/audit/voice_table.py shots/audit/voice_*.jsonl
import json, sys, collections
L = []
for f in sys.argv[1:]:
    for l in open(f):
        if l.strip(): L.append(json.loads(l))
D = [l for l in L if l['kind'] == 'dialogue']; seen = {}; 
for l in D: seen.setdefault((l['speaker'], l['text']), l)
U = list(seen.values())
def state(l):
    if l['whole']: return 'recording'
    if l['partsWithFile'] == l['parts']: return 'recording (in parts)'
    if l['partsWithFile']: return 'PART SILENT'
    return 'SILENT'
def cause(l):
    if l['whole'] or l['partsWithFile'] == l['parts']: return ''
    if l['speaker'] in ('hollow',): return 'speaker has no voice in the cast and no line in the plan'
    if l['partsWithFile']: return 'a remark from IX.SAY is shown in front of the recorded line; the remark itself has no recording for this speaker'
    return 'no entry in audio/voice/manifest.json for this speaker and text'
o = ['# Voice: every line shown while the play bot played by input', '', 'Made by `node test/audit/voicebot.mjs --run ...` then `python3 test/audit/voice_table.py`. A line counts as having a recording when the game found a file for it in `audio/voice/manifest.json` and accepted it for playing with the audio context running. Headless: nobody heard anything; whether it sounds right is not tested.', '',
     f'Lines shown (counting repeats): {len(D)}. Distinct lines: {len(U)}. With a recording: {sum(1 for l in U if state(l).startswith("recording"))}. Part silent: {sum(1 for l in U if state(l) == "PART SILENT")}. Silent: {sum(1 for l in U if state(l) == "SILENT")}.',
     f'Barks attempted near the player: {sum(1 for l in L if l["kind"] == "bark")}, of which played: {sum(1 for l in L if l["kind"] == "bark" and l["accepted"])}. Refused (villager has no barks): {sorted(set(l["name"] for l in L if l["kind"] == "bark" and not l["accepted"]))}.', '',
     '## Silent and part-silent lines', '', '| Speaker | Text | State | Cause |', '|---|---|---|---|']
for l in U:
    if not state(l).startswith('recording'): o.append(f"| {l['speaker']} | {l['text'].replace(chr(10), ' / ')[:170]} | {state(l)} ({l['partsWithFile']} of {l['parts']} paragraphs) | {cause(l)} |")
o += ['', '## All distinct lines', '', '| Speaker | Text (start) | State |', '|---|---|---|']
for l in U: o.append(f"| {l['speaker']} | {l['text'].replace(chr(10), ' / ')[:90]} | {state(l)} |")
by = collections.Counter(l['speaker'] for l in U); o += ['', 'Distinct lines per speaker in this play-through: ' + ', '.join(f'{k} {v}' for k, v in by.most_common())]
open('docs/audit/voice.md', 'w').write('\n'.join(o) + '\n'); print(o[4]); print(o[5])
