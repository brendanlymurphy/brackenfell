# [audit] docs/audit/POINTERS.md from shots/audit/pointers_src.json (every pointer, extracted from src/ by reading), shots/audit/marks.json
# (test/audit/marks.js) and the pointer plays (test/audit/pointerplay.mjs). usage: python3 test/audit/pointers.py
import json, collections, re, math
d = json.load(open('shots/audit/pointers_src.json')); P = d['pointers']; T = d['targets']; SUS = d['suspect']; M = json.load(open('shots/audit/marks.json'))
sus_of = collections.defaultdict(list)
for s in SUS:
    for pid in s['pointers']: sus_of[pid].append(s)
SEV = {'high': 0, 'medium': 1, 'low': 2}
def verdict(p):
    t = p.get('target_ref'); tg = T.get(t) if t else None
    if not p.get('live', True): return 'never shown'
    if t is None: return 'no target named'
    if t.startswith('MISSING'): return '**target does not exist**'
    ss = sus_of.get(p['id'], [])
    if ss: return '**' + min(ss, key=lambda s: SEV.get(s['severity'], 3))['kind'] + '**'
    return 'exists' + ('' if not p.get('direction_words') else ', direction agrees')
rows = sorted(P, key=lambda p: (min([SEV.get(s['severity'], 3) for s in sus_of.get(p['id'], [])] or [3]), p['kind'], p['file'], p.get('line') or 0))
cnt = collections.Counter(verdict(p).strip('*').split(',')[0] for p in P)
o = ['# Pointers: every text or mark that sends the player somewhere (Build 83)', '',
     'The owner, after playing: "all these things point to a door in the Hart that doesn\'t even exist, like there is no cellar door". This audits',
     'every pointer: each spoken line, note, sign, board, quest stage, journal entry, rumour and compass or map mark that names a place or a thing.',
     'For each: does the place exist, can a player with only that pointer find and use it, and is the direction right.', '',
     'How it was made. The list of 301 was extracted from `src/` and `tools/voice/plan.json` by reading (a helper agent; data in',
     '`shots/audit/pointers_src.json`, not committed; the script is `test/audit/pointers.py`). Each named place was looked up in the source and',
     'in the Build 83 world dump; each direction was checked against the coordinates (north is -z). The Hart\'s cellar and nine of the worst',
     'were then played by input (`test/audit/pointerplay.mjs`, cases in `test/audit/pointer_cases.json`), and where each quest\'s compass mark',
     'points was measured in the running game (`test/audit/marks.js`). Headless: nothing heard, nothing seen in motion.', '',
     '## Counts', '', '| | |', '|---|---|', f'| Pointers | {len(P)} ({", ".join(f"{k} {v}" for k, v in collections.Counter(p["kind"] for p in P).most_common())}) |',
     f'| Never shown in play | {sum(1 for p in P if not p.get("live", True))} |',
     f'| Suspect (target missing, unusable, misplaced, or direction wrong) | {len(SUS)} findings covering {len(sus_of)} pointers: {sum(1 for s in SUS if s["severity"] == "high")} high, {sum(1 for s in SUS if s["severity"] == "medium")} medium, {sum(1 for s in SUS if s["severity"] == "low")} low |',
     f'| Pointers that give a compass direction / that contradict the coordinates by more than 50 degrees | {sum(1 for p in P if p.get("direction_words"))} / 8 |', '',
     '## 1. The Hart\'s cellar (the owner\'s complaint): confirmed', '',
     '| | |', '|---|---|',
     '| What the texts say | Rowan: "The Hart. The east cellar wall, newer brick than the rest." Odo, Laurence, Pip, the Hart\'s ledger ("In by the cellar way after dark. Out by the north door"), the Magpie\'s list ("Hart, back door, by the bar"), Corwin\'s journal, the Sexton\'s ledger, and main quest stages 7 to 9 all send the player to the cellar or to a back door. |',
     '| How you get down | An open stair with a rail in the common-room floor, just inside the front door (it exists and works). The cellar is 14 x 8 m with casks along both long walls; a vault under the kitchen. |',
     '| Where the "fresh brick" is | `sec.wall` and the smugglers\' door `door.tunnel.in` both stand at (266.5, -402.2, 4.6): **1.25 m behind the cellar\'s back wall, inside the ground**, under the keeper\'s bedroom where there is no cellar. The cellar room ends at z 3.35. The brick panel is drawn there and can only be seen with the camera inside the rock (`pointer_hart_cellar.jpg`: top left from behind, top right and bottom left from inside the cellar: a shelf of sacks against a dark wall). |',
     '| Played by input | Down the stair to the back wall: stopped 2.1 m short by a cask and sacks, no prompt, E does nothing, with and without the story flags (`pointer_hart_play.jpg`). The prompt reaches through the wall only within 2.2 m. The gate tests pass because they call the object, not walk to it. |',
     '| "East" | It is the east end of the **south** wall in world terms. Inside the Hart the compass is turned 180 degrees (the site\'s yaw), so a player reading "east" off the compass faces the opposite end of the cellar. |',
     '| The back door | The Hart\'s north wall has a kitchen door, a pentice and a sloping cellar hatch **drawn** on it (`72c_infill.js:182`). No prompt; E does nothing (played). Two texts point at it. |',
     '| The quest mark | Stage 7 ("Find the way under the Honeyed Hart"): inside the Hart the gold mark is the front door you just came in by. Stage 8 and 9, in the square: the mark points 1,086 to 1,129 m to the south-south-east, at the mine cell\'s remote coordinates. Inside the Hart at stage 8 it is the front door again. |',
     '| Coming back up | "Go up to the Hart\'s cellar" lands the player at (265.3, -402.6, 4.6), also behind the wall. Not played. |',
     '| Fix | Put the brick and the door on the wall\'s face at z 3.35 (or on the true east wall, x 267, at about z 2.2 next to the last cask: the extraction\'s suggestion), clear the cask and sacks in front, light that corner, say "the back wall, behind the casks" or turn the text to the world\'s east, and give the cellar a mark at stage 7 that is inside the cell. Make the drawn back door either a door or not a door. |', '',
     '## 2. The ten worst, played', '',
     '| # | Pointer | Played | Result | Picture |', '|---|---|---|---|---|',
     '| 1 | The Hart\'s fresh brick and smugglers\' door | down the stair, to the back wall, E, then with flags set | **Cannot be found or used.** Above. | `pointer_hart_play.jpg`, `pointer_hart_cellar.jpg` |',
     '| 2 | Quest stage 7 mark, inside the Hart | stood in the common room | **Points at the front door** (measured: the mark is the cell\'s exit) | `pointer_marks.jpg` 1 |',
     '| 3 | Quest stages 8 and 9 mark | stood in the square | **Points 1.1 km SSE at nothing**, bearing 155 and 161 | `pointer_marks.jpg` 2 |',
     '| 4 | The Hart\'s back door and cellar hatch | walked to the north wall, E | **Drawn only.** No prompt, nothing happens. | `pointer_marks.jpg` 3 |',
     '| 5 | Crypt quest (3 stages) and main stage 2 mark, inside the chapel | measured in the chapel | **Points at the chapel door** for every stage; never at the sacristy chest, the crypt gate or the reliquary | (measured) |',
     '| 6 | "The doors under the quay are the boat-houses: knock first, the keys are with Old Wenn" | walked to the doors at (11.6, 74.9), E | **Drawn only.** No prompt; Wenn has no key to give. | `pointer_played.jpg` 1 |',
     '| 7 | Tobin\'s box: "the stone with the crooked mortar, west of the plaque" | stood west of the plaque; then at the real stone | Nothing west of the plaque. **The stone is 4.5 m east of it.** No prompt at the real stone either (the secret is gated until the note is read; correct). | `pointer_played.jpg` 2, 3 |',
     '| 8 | "She went to ground in the Hidden Yard" | walked to the sack\'s place (-21.7, 50.5) | The Hidden Yard is not built in Build 83 (no lane has that role); the sack sits at fallback coordinates in an unnamed spot. A player cannot know where "the Hidden Yard" is. | `pointer_played.jpg` 4 |',
     '| 9 | "THE BREAD CAVE. West shore, past the reeds, under the grey rock" / "a cleft in the rock by the water" | walked to (-47.4, 122) | **Works**: prompt "Go into the cave", E enters. But the cleft is on a hillock 24 m from the water, not "by the water". | `pointer_played.jpg` 5 |',
     '| 10 | Wren: "Forest edge, north-west of the gate" (frostcaps) | walked toward (-57, -47) | Stopped by the palisade 16 m short: the frostcap is outside the north wall now, **due north** of the gate, not north-west. A player must go out by a gate first. | `pointer_played.jpg` 6 |', '',
     'Where the bot had to be helped: for cases 6 to 10 each walk started on the villagers\' paths about 12 m from the target (the bot got stuck between distant targets); only the last stretch was walked by input.', '',
     '## 3. All findings (from reading, worst first)', '', '| Severity | Kind | Pointers | Why |', '|---|---|---|---|']
for s in sorted(SUS, key=lambda s: SEV.get(s['severity'], 3)): o.append(f"| {s['severity']} | {s['kind']} | {', '.join('`' + x + '`' for x in s['pointers'][:6])}{' ...' if len(s['pointers']) > 6 else ''} | {s['reason'][:420].replace(chr(10), ' ').replace('|', '/')} |")
o += ['', '## 4. Every pointer', '', '| id | kind | who or what | text (start) | sends the player to | direction words | verdict | where in src |', '|---|---|---|---|---|---|---|---|']
for p in rows: o.append(f"| `{p['id']}` | {p['kind']} | {(p.get('speaker_or_title') or '')[:30]} | {(p['text'] or '').replace(chr(10), ' ').replace('|', '/')[:110]} | {(p.get('target') or '')[:70].replace('|', '/')} | {(p.get('direction_words') or '')[:40]} | {verdict(p)} | `{p['file']}:{p.get('line')}` |")
o += ['', '## Not checked', '', 'Whether each of the 270 pointers with no finding can really be followed by a player (played: 10). What is visible or audible when following them. Where "Go up to the Hart\'s cellar" really lands the player. The direction check covers only pointers whose words and target both have a direction and coordinates.']
open('docs/audit/POINTERS.md', 'w').write('\n'.join(o) + '\n')
print(len(o), 'lines;', cnt.most_common())
