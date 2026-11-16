# Brackenfell: start here (for any AI or person joining the work)

A first-person medieval village RPG that runs in a phone or laptop browser. One player, personal project. Live at
https://brendanlymurphy.github.io/brackenfell/ (GitHub Pages serves the `main` branch root). Development happens on `threejs`.

Read in this order: this file, `docs/DESIGN.md` (art, sound and feel direction), `docs/STATE.md` (how the engine is put together, test
harness details, publishing checklist), `ROADMAP.md` (what is done, in progress, next, known problems).

## Build and run

- `npm ci` once. `node tools/build.mjs` bundles Three.js r187 to `three.js`, concatenates `src/*.js` in name order into `game.js`, and
  writes the root `index.html` with cache-busting hashes. The built files are committed (Pages serves them).
- No modules: every `src/NN_name.js` is a plain script sharing one global scope; the number sets load order. Three.js is the global
  `THREE`, node-material helpers `TSL`, extras `T3X`.
- Open `index.html` through any static server. `?perf` shows the performance overlay. `?plans=all` previews unfinished interiors.

## Test (headless Chrome through Playwright, software rendering)

`node test/shot.mjs --size 844x390 [--opt key=val ...] --do "<js run in the page>" [--out file.png] [--do ... --out ...]`

- `--opt webgl=1` forces WebGL 2 (fast). Without it the page uses WebGPU. `--opt quality=low|medium|high`. `--opt play=1` starts a
  playing game (needed by most gameplay tests).
- In the page: `game.shot(x, y|null, z, yawDeg, pitchDeg, hour)` renders a view and returns `{draws, tris}`; `game.enter(id)` /
  `game.leave()` go into and out of a building's interior; `game.tp(...)`, `game.step(n, dt)`, `window.__gpuErrors()`, `G.backend`.
- The list that must pass before anything is published:
  - `--opt webgl=1 --opt quality=low --do "$(cat test/quest.js)"` ends with `fire 99 bonfire true`
  - with `--opt play=1`: `test/stairs.js` (prints `stairs PASS`), `test/combat.js` (kills an outlaw), `test/wilds.js` (PASS, 14 pickups),
    `test/voice_game.js` and `test/audio_game.js` (print PASSED), `test/npcstairs.js` (villagers reach their beds), `test/npcsep.js`
    (no two people in one spot), `test/cells.js` in chunks (put
    `window.__cells=['inn','chapel']; window.__noRest=true;` before the script: a software-rendered tab dies after about a dozen)
  - `test/overlap.js` (overlap finder; `severe` must not rise above its ceiling, 8 at Build 61, from 37: solids through solids by 0.35 m or more, blocked door approaches, spots and stairs inside solids; run `window.__ovTop=60;` first to list the worst with shot calls)
  - `node test/parity.mjs`, `test/interiors.js` (interiors keep every quest object; placement validator)
  - once on WebGPU (no `webgl` option): a `game.shot` in the square and inside the inn with `window.__gpuErrors().length === 0`
  - `node test/real.mjs` (production boot)
  - boot with `--do "return 1"` and grep the output for `warn|rror`: it must be empty. A builder that throws only logs a warning; one
    shipped that way once (two places silently stopped building).
- Tests cannot see: frame rate on a real phone, flicker and z-fighting in motion, anything audible. Say so in reports.

## Publish

1. Work on a branch, merge into `threejs`, bump `Build N` in `src/85_ui.js`, `node tools/build.mjs`, commit.
2. Run the list above. Look at screenshots yourself: tests passing has repeatedly not meant it looks right.
3. `git checkout main && git merge threejs && git push origin main`, back to `threejs`, push it.
4. `gh run list -R brendanlymurphy/brackenfell -L 1` must show success, and the live page's `game.js?v=` hash must equal the local one.
5. Never commit symlinks (Pages deployment fails on them) or `node_modules`.

## Where things are (src/)

| Area | Files |
|---|---|
| Maths, renderer set-up, texture pack | `00_math` `10_gfx` `31_mesh` |
| Shading (one sun, ambient and up to 8 point lights added in emissive), materials, scene, render loop, quality tiers | `40_shade` `40b_depth` `41_materials` `42_scene` `43_render` |
| Kit loader and batcher (merged static geometry, distant copies), sky, grass, water, particles | `44_kit` `45_sky` `46_grass` `47_water` `48_particles` `75_particles` `75b_air` |
| Characters (glTF sets, clips, level of detail) | `49_chars` `76_characters` |
| World data: sites, roads, infill houses, places outside the village | `55_layout` `55b_infill` `55c_wilds` |
| Interiors as separate "cells" entered through doors with a fade | `56_cells` |
| Terrain, props, houses (shell and old hand-made interiors) | `60_terrain` `70_props` `71_*` `72_buildings` `72b_furnish` `72c_infill` |
| Interior plan engine, designed plans, crypt | `72d_plan` `72e_plans` `72f_underworld` |
| Village build-out: alley, dressing, infill, boardwalks | `73_*` |
| Vegetation | `74_vegetation` |
| Villagers, schedules, ambient folk, inn regulars | `77_npc` `77b_ambient` `77c_patrons` |
| Player, the outside world's builders and life | `78_player` `79_wilds` `79b_life` |
| Game rules, quests, dialogue tables | `80_game` `81_wilds_story` `90_rpg` `91_combat` `92_foes` `93_inventory` |
| Interface | `85_ui` `86_perf` `index.html` `style.css` |
| Sound engine, effects, ambience, music, spoken lines | `88_audio` `88b_sfx` `88c_*` `88d_voice` |
| Boot and frame loop | `99_main` |

Assets: `tex/` (texture array pack), `kits/` (building kit, props, scanned models, realistic skin), `chars/` (character sets),
`audio/voice/` (spoken lines and `manifest.json`).

## Spoken dialogue

Lines are generated offline with Kokoro-82M (Apache 2.0) and shipped as AAC files; nothing runs on the device.
`node tools/voice/plan.mjs` reads the dialogue tables and `tools/voice/cast.json` and writes `plan.json`;
`python3 -I tools/voice/gen.py MODEL.onnx VOICES.bin tools/voice/plan.json audio/voice` generates missing files (resumable);
`node tools/voice/check.mjs` verifies. Use the full-precision model (`kokoro-v1.0.onnx`), no pitch-shifting, speeds near 1.0; blends
(`'bm_george:0.5+am_onyx:0.5'`) make distinct voices. Speech is played dry: never route it through reverb. Any new spoken text must go
in the same tables, then regenerate.

The owner rejected Kokoro as too artificial (about 1055 in the Artificial Analysis blind-listening arena; hosted leaders are about
1200) and approved Gemini 3.1 Flash TTS by ear. Voices now come from `tools/voice/gen_gemini.py` with `tools/voice/cast_gemini.json`
(model `gemini-3.1-flash-tts-preview`, one prebuilt voice and a one-line acting direction per character). The key is a network
secret on the cloud environment for generativelanguage.googleapis.com (header `x-goog-api-key`), so nothing is needed on the machine;
only an environment that has that secret can generate. The key allows 100 speech requests per model per day: the script stops
cleanly at the limit and resumes on the next run; `--partial` switches finished groups in the manifest without calling the API;
`--sample` makes one clip per character for the owner to approve. State at Build 36: 79 conversation lines of 13 characters are
Gemini; barks and the lines of Bram, Hilda, Ivo and Pip have no audio (subtitles only) until the rest is generated on branch
`fork-voice`: the old-engine files were removed so the two engines are never heard together. `audio/voice/manifest.json` lists only
lines that have audio. `tools/voice/check.mjs` still expects all 172 files and a pace tuned for Kokoro (0.11 s per character): widen
it for Gemini once the owner has judged the three lines it flags as slow. Only the owner's ear counts for voice quality.

## Working with several agents at once

- One branch and one git worktree per worker (`fork-<name>`); the coordinator merges into `threejs` and publishes.
- Agree file ownership before starting; in files you do not own make only small, marked, additive lines.
- Commit after every working step (sessions have been restarted mid-task several times). Never run two browsers at once on a small
  machine; three workers is the practical limit on 2 cores.
- Send the coordinator a commit hash as soon as a visible chunk passes its tests, so it ships early.
- Workers so far ran on a cheaper model with a self-contained written brief. Briefs that named concrete defects and a measurable check
  worked; vague ones produced work that passed tests and looked wrong.

## What the owner wants (direct feedback, most recent last)

- Realistic, Skyrim-like: muted colours, weathered timber, mist, firelight. No cartoon or chibi assets.
- Dense and complex: a compact town with levels, alleys, layers and places to explore; no open empty space, nothing bare.
- Every building enterable as its own larger interior with floors, cellars, dungeons; taverns full of people.
- Interiors must make physical sense (floor plans, nothing overlapping) AND be richly filled; bare planned rooms were rejected.
- Runs well on an iPhone in Safari.
- Sound: restrained and dry. No echo on everything, no jingles, voices straight from the model without processing.
- Dialogue as plain white subtitles, no text box.
- Glitches (flicker, interpenetrating roofs, duplicated characters, floating boardwalks) matter more to them than new features.
