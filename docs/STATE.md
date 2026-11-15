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
| `/home/claude/wt/h` | `fork-h` | Realistic humans with Blender + MakeHuman. Test renders in `/home/claude/shots/H/`; no verdict yet. |
| `/home/claude/wt/d` | `fork-d` | Done: kits packed in `kits/`, `Kit` loader, realistic skin. Merged into `fork-e`, not into `threejs`. |

Kits and sources live outside the repo in `/home/claude/ext/` (kits, scan, chars2, humans).

## Gameplay layer (fork-g)

`90_rpg.js` (health, stamina, damage, death, HUD, hit effects), `91_combat.js` (sword and shield in view), `92_foes.js` (two outlaw camps, `Chars` bodies), `93_inventory.js` (pack tab, smith trade). Called from `tick` (`RPG.tick`) and `playerUpdate` (`RPG.move`). Saved in `S.rpg`; old saves get defaults. Tests: `test/combat.js` (set `window.__clear = true` to clear the camp), `test/death.js`, `test/rpgquest.js`. Foes load after the first tick: `game.step(1); await Foes.loading`. In headless shots wait about 1.5 s before a screenshot or the title fade is still showing.

## Art direction

The user wants it as realistic as possible, like Skyrim: simple shapes, photographed textures, muted colours, mist, firelight. Hand-painted kit art is acceptable only with the scanned-texture skin. Chibi or cartoon assets are not.

## Rules of the road

- Never push to `main` anything that has not booted on both backends and passed `test/quest.js`.
- The user's phone (iPhone, Safari) cannot be tested here. Keep the WebGL 2 fallback and the classic link working.
- See `ROADMAP.md` for what comes next.
