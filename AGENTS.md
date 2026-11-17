# Brackenfell: start here (for any AI or person joining the work)

A first-person medieval village RPG that runs in a phone or laptop browser. One player, personal project. Live at
https://brendanlymurphy.github.io/brackenfell/. Development happens on `threejs`; `main` is what is published.

This file is the whole onboarding: a worker brief only needs to say "read AGENTS.md" and then name the task. Read more only for
the area you touch: `docs/DESIGN.md` (art, sound and feel), `docs/STATE.md` (how the engine works, by area), `ROADMAP.md` (done, in
progress, next, known problems), `docs/DECISIONS.md` (what was tried and rejected: read before proposing something "new"),
`docs/TOWNPLAN.md` (how the town is laid out and why: the authority for anything outdoors), `docs/BLUEPRINT.md` (the rules any village must pass) and `docs/AUDIT.md` (what Brackenfell fails, with counts and pictures), `docs/STORY.md` (the main story), `docs/LOGIC.md` (where story, routines and rules did not make sense, what was done, what is open), `docs/DEFECTS.md` (open visual defects), `docs/HISTORY.md` (old measurements).

## Build and run

- `npm ci` once, then `node tools/build.mjs`: bundles Three.js r187 to `three.js`, concatenates `src/*.js` in name order into
  `game.js`, writes `index.html` and `sw.js` with cache-busting hashes, and prints what a first visit downloads.
- No modules: every `src/NN_name.js` is a plain script sharing one global scope; the number sets load order. Three.js is the
  global `THREE`, node-material helpers `TSL`, extras `T3X`.
- Open `index.html` through any static server. `?perf` shows the performance overlay; `?plans=all` previews unfinished interiors.
- The built files (`game.js`, `index.html`, `sw.js`, `three.js`) are NOT in the repository (git-ignored since Build 67). Build after
  every checkout, pull or merge and before any test by hand; `tools/gate.mjs` builds first by itself. GitHub builds and publishes them.

## Test: one command

```
node tools/gate.mjs --quick        about 5 minutes: build, silent boot, quest, stairs, interiors, voices, budget, two cells, production boot
node tools/gate.mjs --full         everything below, about 35 minutes on 4 cores
node tools/gate.mjs --only story,mine      named steps      --skip cells      --cells inn,chapel      --list      --no-build
```

It runs one browser at a time, retries a failed step once (a pass on the second try is printed as flaky), prints one PASS/FAIL
table with timings, writes `shots/gate/gate.md`, a log per step and screenshots, and exits non-zero on failure. Every push to
`threejs` or a `fork-*` branch runs `--full` on GitHub (workflow `gate`, four jobs side by side, about 25 minutes; a push during a
run waits for it, it does not cancel it): the result is the check mark on the commit, and the tables and screenshots are the run's `gate-1..4` artifacts. So: run `--quick` (or `--only` your area) before a push, read the GitHub result
after it, and do not run `--full` on a small shared machine.

What `--full` runs: build; silent boot (no `warn` or `error` line: a builder that throws only logs a warning, and a build shipped
that way once); `quest` (ends `fire 99 bonfire true`); `stairs`, `npcstairs`, `npcsep`, `routes`, `combat`, `wilds`, `story`, `mine`,
`secrets`, `interact`, `econ`; `interiors`, `parity`; `voice_game`, `voice_parts`, `audio_game`, `voices` (`tools/voice/check.mjs`); the budget
views on medium and low; every cell in chunks of 8 (a software-rendered tab dies after about a dozen); `kitcull`; one WebGPU
shot in the square and in the inn with no GPU errors; `cullwalk` (nothing in sight missing while walking and turning); the offline start; `test/real.mjs` (production boot); and the play bot.

The play bot (`test/playbot.mjs`, steps `bot-story`, `bot-play`, `bot-phone`, `bot-sweep`, `bot-soak`) plays by real keys, clicks and
taps: the story to both endings, a reload at seven points of it, every conversation, side quests, shop, perks, board, theft and
jail, death, other orders, saves from old builds, the mine, the secrets, a phone screen with a notch, 30 minutes in one page.
`node test/playbot.mjs --run story,side` runs scenarios by hand (`story` first: the others start from its checkpoints).
`docs/BUGS.md` lists what it found; a behaviour bug you fix gets a line there and a check in the bot.

The walk bot (`node test/walkbot.mjs`, about 7 minutes) walks by input along every street, through every interior, route, path and the
mine, and writes `docs/WALK.md`: falls, snags, places it could not walk, camera and prompt faults, each with a `game.shot` call. Run
it after moving colliders, floors, stairs or doors. `--part town|cells|routes|wilds|mine`, `--cells inn,chapel`, `--from-json`.

Budgets (draw calls / triangles in the four views of `test/perf_views.js`): target medium 220 / 380k, low 140 / 200k (Build 69: medium
square 157 / 292k, low square 125 / 195k; only the alley on Low is over, at 148 / 218k). The gate
fails a view that is more than 3% worse than `tools/gate_budget.json` and reports "over target" otherwise. After a deliberate
change: `node tools/gate.mjs --only budget-medium,budget-low --accept-budget`, commit the file and say why.

A single test by hand: `node test/shot.mjs --size 844x390 --opt webgl=1 --opt play=1 --do "$(cat test/story.js)" [--out file.png]`.
`--opt webgl=1` forces WebGL 2 (fast; without it the page uses WebGPU), `--opt quality=low|medium|high`, `--opt play=1` starts a
playing game. In the page: `game.shot(x, y|null, z, yawDeg, pitchDeg, hour)` returns `{draws, tris}`, `game.enter(id)`,
`game.leave()`, `game.tp(...)`, `game.step(n, dt)`, `window.__gpuErrors()`.

Tests cannot see: frame rate on a real phone, flicker and z-fighting in motion, anything audible. Say so in every report. Look at
your own screenshots: tests passing has repeatedly not meant it looks right.

## WORKER RULES

1. One branch and one git worktree per worker (`fork-<name>`), branched from the latest `threejs`. Push only to your branch. Never
   push to `threejs` or `main`: the coordinator merges and publishes. No pull requests unless asked.
2. Commit after every working step and push often: sessions are restarted mid-task without warning, and an unpushed step is lost.
3. One headless browser at a time on your machine. Never start a second test while one runs.
4. Never `git stash` (the stash is shared by all worktrees; one worker popped another's changes). Commit to your branch instead.
5. Never edit the text of an existing spoken line: recordings are keyed by speaker + exact text, so a changed comma silences it.
   New wording is a new line. New spoken text goes through `node()` / `IX.SAY` so `tools/voice/extract.mjs` finds it (run it: it
   must not print UNATTRIBUTED), and is a subtitle until the daily voice batch records it.
6. After changing any GLB under `kits/` or `chars/`: `node tools/assets_pack.mjs` (and `tools/tex_half.mjs` after the material pack).
7. Stay in the files you own (the brief says which). In anyone else's file make only small, marked, additive lines
   (`// [yourtag] why`), or wrap the function from your own file.
8. Do not bump `Build N` (`src/85_ui.js`): the coordinator does at publish.
9. To take in `threejs`: `git fetch origin threejs && git merge origin/threejs`, then `node tools/build.mjs`. The built files are not
   tracked, so they can no longer conflict. If git says a built file "would be overwritten" or reports a modify/delete conflict on
   one (a branch from before Build 67): `git rm --cached -q game.js index.html sw.js three.js`, continue, rebuild. A conflict in
   `audio/voice/manifest.json`: take either side, then
   `python3 -I tools/voice/gen_gemini.py tools/voice/plan.json tools/voice/cast_gemini.json audio/voice --have`.
10. Before a push: `node tools/gate.mjs --quick` plus the steps for your area. After it: read the GitHub `gate` result.
11. Report to the coordinator with a commit hash as soon as a visible chunk passes, so it ships early. A report says: what changed,
    the gate result, what you looked at yourself, and what could not be verified headless. Do not end your turn after a report:
    carry on with the next part of the brief.
12. Assets must be CC0 with the source recorded next to them (`kits/*_PROVENANCE.md`). Never commit symlinks (the Pages deployment
    fails on them), `node_modules`, secrets, or tool intermediates.
13. Never put a `//` comment inside a long one-line statement (it comments out the rest of the line), and check the bundle parses.
14. Commits end with the two trailer lines used throughout the log (`Co-Authored-By`, `Claude-Session`). No model names elsewhere.

## Publish (coordinator only)

1. Merge the worker branch into `threejs` (its `gate` check must be green on GitHub), bump `Build N` in `src/85_ui.js`, commit,
   push `threejs`, wait for its `gate`. Nothing built is committed: there is no `node tools/build.mjs` step and no built file to add.
2. Look at screenshots in the `gate` artifacts (or take your own). Passing is not the same as looking right.
3. `git checkout main && git merge threejs && git push origin main`, back to `threejs`.
4. The push to main starts the `pages` workflow: it builds, boots the game from the built folder, deploys, then fetches the live
   page and fails unless it serves that build. A green `pages` run is the proof the build is live (about 3 minutes); a red one means
   the old build is still being served, nothing is half-published. Read it with the Actions list for branch `main`.
5. Add the build's line to `ROADMAP.md`.

If the site ever has to be served the old way again: commit the four built files on `main` (`git add -f`) and set
Settings > Pages > Source back to "Deploy from a branch".

## Where things are (`src/`) and who owns them

Ownership is by area; the worker named in `ROADMAP.md` "In progress" owns an area while that work is open, otherwise the coordinator.

| Area | Files |
|---|---|
| Maths, renderer set-up, texture pack, mesh builder | `00_math` `10_gfx` `31_mesh` |
| Shading, light, materials, scene, frame, quality tiers, lamp map | `40_shade` `40b_depth` `40c_light` `41_materials` `42_scene` `43_render` `43b_lamps` `72m_bake` |
| Kit loader, batcher and culling; sky, grass, water, particles, air | `44_kit` `45_sky` `46_grass` `47_water` `48_particles` `75_particles` `75b_air` |
| Time of day, wind, weather | `50_env` `50b_weather` |
| Characters: bodies, faces, level of detail | `49_chars` `76_characters` |
| World data: sites, roads, infill, places outside | `55_layout` `55b_infill` `55c_wilds` |
| Terrain, props, house shells, upper floors | `60_terrain` `70_props` `71_*` `72_buildings` `72b_furnish` `72c_infill` |
| Interiors: cells, plan engine, designed plans, dressing, crypt | `56_cells` `72d_plan` `72e_plans` `72f_underworld` `72g_dress` `72h_trades` `72i_wares` `72j_plans2` `72k_houses` `72l_hobjects` |
| Town build-out: alley, dressing, boardwalks, levels, wharf, routes, walls, lanes, square | `73_village` `73b` to `73k` |
| Vegetation and scanned trees | `74_vegetation` `74b_trees` |
| Villagers, schedules, passers-by, inn regulars, hand props, households | `77_npc` `77b_ambient` `77c_patrons` `77d_handprops` `77e_households` |
| Player and collision; the wilds and their life | `78_player` `79_wilds` `79b_life` |
| Game rules, quests, dialogue | `80_game` `81_wilds_story` `90_rpg` `91_combat` `92_foes` `93_inventory` |
| Main story, interaction layer, secrets, mine, economy, Acts 2 and 3 | `82_story` `82b_interact` `82c_secrets` `94_mine` `94b_economy` `94d_act2` |
| Interface, map, camera feel, controls, performance overlay | `85_ui` `86_map` `86_perf` `87_feel` `87b_input` `index.html` `style.css` |
| Sound engine, effects, ambience, music, spoken lines | `88_audio` `88b_sfx` `88c_*` `88d_voice` |
| Boot and frame loop | `99_main` |
| Build, gate, CI, docs, voice pipeline | `tools/build.mjs` `tools/gate.mjs` `test/pw.mjs` `test/shot.mjs` `.github/` `tools/voice/` `*.md` |

Assets: `tex/` (material texture pack; `tex/s` half size), `kits/` (building kit, props, scanned models, trees, skins; `kits/s`
small packs), `chars/` (character sets), `audio/voice/` (spoken lines and `manifest.json`).

## Spoken dialogue

Voices are generated offline with Gemini 3.1 Flash TTS (`gemini-3.1-flash-tts-preview` and no other model) and shipped as AAC
files; nothing runs on the device. The owner approved it by ear after rejecting Kokoro; only the owner's ear counts for quality.

```
node tools/voice/extract.mjs && node tools/voice/plan.mjs
python3 -I tools/voice/gen_gemini.py tools/voice/plan.json tools/voice/cast_gemini.json audio/voice            # generate what is missing
python3 -I tools/voice/gen_gemini.py tools/voice/plan.json tools/voice/cast_gemini.json audio/voice --have     # manifest from what exists
node tools/voice/check.mjs --allow-missing
```

- The API key is a network secret on the infrastructure session's cloud environment (host generativelanguage.googleapis.com, header
  `x-goog-api-key`); it is never in the repository, the environment or a chat. Only that environment can generate.
- 100 requests a day. The script stops cleanly at the limit and resumes. Every planned line has audio now (252); nothing is
  scheduled, so after adding lines run the commands above. A line without a file is a subtitle. `audio/voice/manifest.json` lists only lines that have audio.
- Speech is played dry: never route it through reverb or process it. `cast_gemini.json` holds one voice and one acting direction
  per character; `--sample` makes one clip per character for the owner to approve before a new voice is used.
- `check.mjs` fails a file over 0.45 s per character, or over 30 s unless the line is long enough to need it (a model once read
  its direction aloud for 24 s).

## What the owner wants (direct feedback, most recent last)

- Realistic, Skyrim-like: muted colours, weathered timber, mist, firelight. No cartoon or chibi assets.
- Dense and complex: a compact town with levels, alleys, layers and places to explore; no open empty space, nothing bare.
- Every building enterable as its own larger interior with floors, cellars, dungeons; taverns full of people.
- Interiors must make physical sense (floor plans, nothing overlapping) AND be richly filled; bare planned rooms were rejected.
- Runs well on an iPhone in Safari. Nobody has measured it: Settings > Graphics > "Copy performance report" copies 30 s of frame
  times, draw calls, device and build as text for the owner to paste to us.
- Sound: restrained and dry. No echo on everything, no jingles, voices straight from the model without processing.
- Dialogue as plain white subtitles, no text box.
- Glitches (flicker, interpenetrating roofs, duplicated characters, floating boardwalks) matter more to them than new features.
- Plain step-by-step instructions when they have to click something themselves.
- Build 69: add nothing new until what exists is right and filled out. "The ground is flat, every house looks the same on the
  outside, the terraces and platform are all fucked up, not to mention the walls; none of it really flows, it all feels like
  copy paste." Also to be made coherent: general logic, the storylines, what characters do, and their mechanics.
- "Everything is blocky, blocked off, clunky and lazy. Think like an artist and a city planner: every touch intentional, not just
  filling space, but all the space filled at the same time, and full of life." The answer is `docs/TOWNPLAN.md`: read it before
  touching anything outdoors. It outranks any brief.
- Build 74: "buildings that really are just filling space and don't tell a story ... 80% of the characters don't even have lines
  ... it's all fake life ... we add things without fully thinking about them and then it just becomes a jumbled mess." The goal:
  a village good enough to be the blueprint for every later one. A critic session counted it (`docs/AUDIT.md`: 75 of 132
  buildings are boxes with a door drawn on; 63 of 80 villagers answer "..."; interiors 2 to 6 times their shells) and wrote
  `docs/BLUEPRINT.md`, the acceptance test for this and every village. Its order of work is binding: the cast table and the
  building table come before anything is placed. No fake buildings; subtraction before addition.
