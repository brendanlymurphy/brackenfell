# Working state (for whoever picks this up next)

Read this before touching anything. It replaces having the whole conversation in your head.

## What is live

- `main` is what GitHub Pages serves: Build 5, the village on Three.js r187. Built files (`index.html`, `game.js`, `three.js`) are committed on `main` only.
- `classic/` is Build 4 (hand-written WebGPU renderer). `legacy/` is its source.
- `threejs` is the development branch. Merge finished work here, test, then merge to `main`, run `node tools/build.mjs`, commit the built files, push.

## How it is put together

- `node tools/build.mjs` bundles Three (`src/lib/three-entry.js` -> `three.js`, globals `THREE`, `TSL`, `T3X`) and concatenates `src/*.js` in name order into `game.js`. No modules: every file is a classic script, so top-level names are shared. Wrap TSL code in a closure (TSL's `clamp`, `mix`, `length` collide with the game's maths helpers).
- `10_gfx.js` renderer init, texture pack (25 layers, ASTC or images), `MAT` layer ids. `40_shade.js` frame uniforms `SH.U` and helpers (`SH.hemi`, `SH.pointLights`, `SH.perturb`, fog). The scene has one DirectionalLight (sun or moon); all ambient and the hearth / lantern point lights are added in each material's `emissiveNode`, limited by zone so light does not leak through walls.
- `41_materials.js`, `42_scene.js`, `43_render.js` world renderer. `44_kit.js` kit loader and batcher (branch `fork-d` / `fork-e`, not yet on `threejs`). `45`-`48` sky, grass, water, particles. `49_chars.js` glTF villagers.
- `31_mesh.js` procedural mesh builder; `55_layout.js` sites; `60_terrain.js`; `70`-`74` props, houses, village, vegetation; `77_npc.js`; `78_player.js`; `80_game.js` quests and dialogue; `85_ui.js`; `88_audio.js`; `99_main.js` boot and loop.
- Tests: `node test/shot.mjs [--opt webgl=1] [--opt quality=medium] --do "<js>" --out file.png`. On WebGPU a headless browser cannot present the canvas, so test mode renders to a target and reads it back; never render straight to the canvas in a WebGPU test. `test/quest.js` is the scripted quest (must end with `fire 99 bonfire true`). Run one browser test at a time: the machine has 2 cores.
- Commits end with the two trailer lines used throughout the log (`Co-Authored-By`, `Claude-Session`).

## Unfinished work, by worktree

| Worktree | Branch | State |
|---|---|---|
| `/home/claude/wt/e` | `fork-e` | Village rebuild from the Quaternius kit (`71_kithouse.js`). Just started; uncommitted files. Brief: every building from kit pieces on a 2 m grid, furnished candle-lit interiors, game logic unchanged. |
| `/home/claude/wt/g` | `fork-g` | Gameplay (sprint, jump, stamina, sword, bandit camps, loot, inventory, quests, dungeon). Just started; uncommitted files. |
| `/home/claude/wt/f` | `fork-f` | Poly Haven scanned props. `kits/scan.glb` (50 CC0 models, 5 MB, built by `tools/scan/slim.mjs` from `tools/scan/slim.txt`) is loaded by `kitBoot`; `kp()` in `71_kithouse.js` answers painted pieces with scans (`SCANR` table), houses, yards and the lake shore get scanned clutter and ground cover. Without the pack the painted props stay (`--opt scan=0` simulates that, `--opt scatter=0` drops the ground cover). Screenshots in `/home/claude/shots/F2/`. |
| `/home/claude/wt/h` | `fork-h` | Realistic humans: the `real` character set (21 MakeHuman people + `clips.glb` in `chars/real/`, built by `tools/humans/`), wired into `49_chars.js`; default set, `quaternius` is the fallback and `?chars=quaternius` picks it. Renders in `/home/claude/shots/H2/`. |
| `/home/claude/wt/d` | `fork-d` | Done: kits packed in `kits/`, `Kit` loader, realistic skin. Merged into `fork-e`, not into `threejs`. |

Kits and sources live outside the repo in `/home/claude/ext/` (kits, scan, chars2, humans).

## Gameplay layer (fork-g)

`90_rpg.js` (health, stamina, damage, death, HUD, hit effects), `91_combat.js` (sword and shield in view), `92_foes.js` (two outlaw camps, `Chars` bodies), `93_inventory.js` (pack tab, smith trade). Called from `tick` (`RPG.tick`) and `playerUpdate` (`RPG.move`). Saved in `S.rpg`; old saves get defaults. Tests: `test/combat.js` (set `window.__clear = true` to clear the camp), `test/death.js`, `test/rpgquest.js`. Foes load after the first tick: `game.step(1); await Foes.loading`. In headless shots wait about 1.5 s before a screenshot or the title fade is still showing.

## Character sets (`49_chars.js`)

`Chars.define(name, cfg)`; boot tries `real` then `quaternius` (`?chars=name` or `TEST.chars` forces one, no fallback). `real` bodies carry their own textures (`cfg.matOf`), each villager id has its own body (`BODY` table in the `real` block), outlaws are `lazy` bodies loaded by `Chars.ensure` (`cfg.foeLooks`). `real` clips are the Quaternius clip names retargeted onto the MakeHuman rig, so `cfg.anims` and 92_foes names are unchanged. To rebuild the people: `tools/humans/run_all.sh /tmp/w /tmp/out` (needs Blender-as-module venv and the MPFB2 data, see `chars/real/PROVENANCE.md`), then `retarget.py` and `clips_post.mjs`.

## Art direction

The user wants it as realistic as possible, like Skyrim: simple shapes, photographed textures, muted colours, mist, firelight. Hand-painted kit art is acceptable only with the scanned-texture skin. Chibi or cartoon assets are not.

## Rules of the road

- Never push to `main` anything that has not booted on both backends and passed `test/quest.js`.
- The user's phone (iPhone, Safari) cannot be tested here. Keep the WebGL 2 fallback and the classic link working.
- See `ROADMAP.md` for what comes next.

## Performance (fork-x3)
- Tiers (QUALITY in 43_render.js): flags maxLong, houseFar, farStatics, nearStatics, rockCast, grassThin, far1, shadowRes. Medium/low trade shadow reach and prop casters for triangles.
- Character LOD: tools/chars_lod.mjs adds `@lod` skinned copies (about 2200 tris) to chars/real/*.glb; 49_chars.js swaps by distance, low copy also casts shadows (layer 3, near map only).
- Kit LOD: tools/kits_budget.mjs (per-piece budgets, kit_budget.json) and tools/kits_far.mjs (`@far` hull-roof copies of houses); 44_kit.js swaps per mesh by `houseFar`; far buckets batch by cell.
- Interiors of other houses cost nothing (interiorShown in 42_scene.js). Terrain flat blocks merge into fans (60_terrain.js); grass thins per tier.
- Point lights loop is bounded by U.lightN / U.lightNOut. Add `?perf` for the overlay (86_perf.js).
- Rebuild order after kit edits: kits_budget, kits_far, then tools/build.mjs.
