# Where things stand and what is next (written 18 Nov 2026, about 17:00 UTC, when everything was stopped)

Read `docs/HANDBOOK.md` first (written at the stop: the rules, the lessons, the plan); this file is the exact state of every branch at that moment. The day's full log is `docs/log/2026-11-18_coordinator.md`.

## State
- **Live:** Build 89 (`main` 997710c), verified.
- **`threejs` head:** Build 90 (d0991c0 plus docs commits): Wharfside house by house and the logic session's work, including **529 of 774 voice lines** (main has 254). **It failed its gate** (`openings` in two shards; `geom` kitSheets 843 against 842), both from the Wharfside merge. Not published. Fixing those two and publishing is the one small job worth doing before the reorganisation, so that the owner can hear the voices.
- **Branches with unmerged work** (all pushed): `fork-fin` cf5b975 (inspector: crypt skull, door leaves in wood tones, an open street door shows the street, `test/roomviews.mjs`, `test/walkviews.mjs` begun), `fork-fx3` bc6aa86 (town worker: steps at the wharf, work in progress on the owner's two screenshots; the last commit is uncommitted work saved at the stop: check it), `fork-hx` b724eca (houses: shingle roofs no longer blown out; white fish not yet fixed), `fork-cull`, `fork-ch1`, `fork-inout`, `fork-audit` (the four agents; see their `docs/reports/`).
- **Owner's open screenshots:** `docs/owner/b89_chapel_spike_beam.png` (a stretched spike from the lych-gate post and a timber box hanging off the chapel wall; reproduce with `game.shot(3, null, -65.6, 270, -3, 13)`), `docs/owner/b89_gate_steps_patch.png` (north gate: a ruler-straight pale earth patch, a bright grass rectangle, steps going down in front of the passage, pennants).
- **Stopped:** the three local workers, the coordinator's scheduled check-ins. One scheduled task is left on purpose: the logic session's "Record the remaining voice lines" at 08:40 UTC on 19 Nov.

## Why it was stopped (the owner's question, and the answer we agreed)
Days of work and every build still had something broken that a person sees in two minutes. The cause is not missing knowledge. (1) Nearly everything recognisable was built from code by sessions that never see it; (2) placement is rules, and rules collide; (3) the owner was the only one who played: tests check what someone thought of; (4) all 57 buildings were made enterable (231 rooms); (5) several sessions changed overlapping files in parallel, so merges broke things (five builds on 18 Nov, three needed a second run).

## The plan the owner chose
1. **One handbook.** Every rule and lesson in one file (`docs/HANDBOOK.md`: written; sources: `AGENTS.md`, `docs/briefs/*`, `docs/FINISH.md`, `docs/SCORE.md`, `docs/ROOMS.md`, `docs/PEOPLE.md`, `docs/INOUT.md`, `docs/audit/*`, the inbox files, this log). Every session reads that and nothing else.
2. **An asset library made in Blender.** The owner sets up Blender 5.1+ with Blender Lab's connector in Claude Desktop and starts a Blender session with `docs/briefs/AGENT_BLENDER.md` (asset format, the bar, a first list). **Prove it first:** five assets across the range (a house front, a roof, a door, the boat, a market stall) as rendered sheets for the owner's eye. If they pass, scale to a planned list by category (building kit, props, plants, food, tools). If they do not, fit scanned and CC0 models in Blender instead: same pipeline.
3. **A village becomes data before a second one is built.** One session owns the engine and makes a settlement a folder (site, plots, buildings picked from the kit, people); nobody else edits the engine.
4. **Then one small village per agent** (forest, mountain, a third): 8 to 12 buildings, 4 to 6 enterable, built only from the library and the handbook, each in its own folder.
5. **Brackenfell is revamped last** with exteriors and props from the library; until then only what the owner screenshots is fixed.

## Two guards that stay whatever the schedule
- **Nothing counts as done until the cameras have been over it and every frame has been looked at:** `test/roomviews.mjs` (every room from each of its doorways, day and night) and `test/walkviews.mjs` (a frame every 5 m of every lane, both ways). Not pictures at angles their author chose. The room camera found 77 empty rooms in an hour that every test had passed.
- **Small first.** Ten good buildings before fifty.

## Rules that held all along (carry into the handbook)
Nothing living or recognisable from primitives; a thing that cannot pass at arm's length is left out; inside and outside are the same building; look from the end, behind and below; proof at the owner's own angle, never a new flattering one; nothing pops within sight; no pure white or pure colour; no lawn in town; every door 3 m clear; never edit a recorded line; the owner's email is private; keys never in chat or repo; one browser at a time on the shared machine; commit after every step.

## Not verified by anyone
Anything audible (nobody has listened to the 275 new lines), motion and flicker, a real device.

## Added after the stop was called
- `docs/HANDBOOK.md`, `CLAUDE.md` (points to it), `docs/SRC_MAP.md` (every source file with its own description).
- The two cameras are on `threejs` now, copied from `fork-fin`: `test/roomviews.mjs` (+ `roomviews_sheet.py`, `roomviews_table.py`) works and was run over all 57 buildings; `test/walkviews.mjs` (+ `walkviews_sheet.py`) was written minutes before the stop and has **not** been run: treat it as a draft. `docs/FINISH.md` on `threejs` is the inspector's latest, with the room table at its end.
