# Working state (for whoever picks this up next)

Read this before touching anything. It replaces having the whole conversation in your head.

## What is live

See `ROADMAP.md` for the build list and `AGENTS.md` for build, test and publish steps. `main` and `threejs` are kept at the same commit after every publish.

## How it is put together

- `node tools/build.mjs` bundles Three (`src/lib/three-entry.js` -> `three.js`, globals `THREE`, `TSL`, `T3X`) and concatenates `src/*.js` in name order into `game.js`. No modules: every file is a classic script, so top-level names are shared. Wrap TSL code in a closure (TSL's `clamp`, `mix`, `length` collide with the game's maths helpers).
- `10_gfx.js` renderer init, texture pack (25 layers, ASTC or images), `MAT` layer ids. `40_shade.js` frame uniforms `SH.U` and helpers (`SH.hemi`, `SH.pointLights`, `SH.perturb`, fog). The scene has one DirectionalLight (sun or moon); all ambient and the hearth / lantern point lights are added in each material's `emissiveNode`, limited by zone so light does not leak through walls.
- `41_materials.js`, `42_scene.js`, `43_render.js` world renderer. `44_kit.js` kit loader and batcher (branch `fork-d` / `fork-e`, not yet on `threejs`). `45`-`48` sky, grass, water, particles. `49_chars.js` glTF villagers.
- `31_mesh.js` procedural mesh builder; `55_layout.js` sites; `60_terrain.js`; `70`-`74` props, houses, village, vegetation; `77_npc.js`; `78_player.js`; `80_game.js` quests and dialogue; `85_ui.js`; `88_audio.js`; `99_main.js` boot and loop.
- Tests: `node test/shot.mjs [--opt webgl=1] [--opt quality=medium] --do "<js>" --out file.png`. On WebGPU a headless browser cannot present the canvas, so test mode renders to a target and reads it back; never render straight to the canvas in a WebGPU test. `test/quest.js` is the scripted quest (must end with `fire 99 bonfire true`). Run one browser test at a time: the machine has 2 cores.
- Commits end with the two trailer lines used throughout the log (`Co-Authored-By`, `Claude-Session`).

## Unfinished work

See the In progress section of `ROADMAP.md`. Worker branches are `fork-<name>`; finished ones are merged and can be deleted.

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

## Publishing checklist (learned the hard way)

- No symlinks may be tracked: the GitHub Pages deployment fails on them (`git ls-tree -r main | grep ^120000` must print nothing).
- After pushing `main`, confirm the deployment: `gh run list -R brendanlymurphy/brackenfell -L 1` shows success, and the live page's `game.js?v=` hash matches the local `index.html`. Builds 10 and 11 were announced as live while their deployments had failed.
## Performance (fork-x3)
- Tiers (QUALITY in 43_render.js): flags maxLong, houseFar, farStatics, nearStatics, rockCast, grassThin, far1, shadowRes. Medium/low trade shadow reach and prop casters for triangles.
- Character LOD: tools/chars_lod.mjs adds `@lod` skinned copies (about 2200 tris) to chars/real/*.glb; 49_chars.js swaps by distance, low copy also casts shadows (layer 3, near map only).
- Kit LOD: tools/kits_budget.mjs (per-piece budgets, kit_budget.json) and tools/kits_far.mjs (`@far` hull-roof copies of houses); 44_kit.js swaps per mesh by `houseFar`; far buckets batch by cell.
- Interiors of other houses cost nothing (interiorShown in 42_scene.js). Terrain flat blocks merge into fans (60_terrain.js); grass thins per tier.
- Point lights loop is bounded by U.lightN / U.lightNOut. Add `?perf` for the overlay (86_perf.js).
- Rebuild order after kit edits: kits_budget, kits_far, then tools/build.mjs.

## Interiors as cells (Build 19 on)

- `src/56_cells.js`: every enterable building's interior is built at a remote origin; the village keeps only the shell. `Cells.use`
  is the door portal (fade, place name). `Cells.env` sets indoor light: the sun is off, `CELL_DAYLIGHT` lifts the day's ambient for
  rooms with windows, `daylight: 0` / `daylightFn` for cellars. `--opt cells=0` restores the old seamless houses.
- `src/72d_plan.js` is the plan engine (rooms on a 0.5 m grid, doors, stairs, cellars, placement helpers, `planValidate`).
  `PLAN_SHIP` in `src/72e_plans.js` lists the buildings whose plan is used in the published game; everything else keeps its old
  hand-made interior until its plan is designed and dressed. `test/parity.mjs` fails if a plan drops a quest object.
- `R.boneData` holds one slot per hinged, carried or animated thing (doors, pickups, characters). It grows on demand since Build 25;
  it overflowed silently at 96 slots once.

## Sound (Build 18 on)

- `Snd` in `src/88_audio.js`: buses amb / world / foot / ui / music into a master chain with a soft ceiling. Reverb spaces room,
  hall, cave; open air is dry. Sends are deliberately low. Speech bypasses the buses and goes dry to the master (`88d_voice.js`).
- No discovery jingle. Place banners only for landmarks (`minor: true` places are silent and bannerless).

## Outdoor look (fork-look)

- **View model** (`90_rpg.js`, `91_combat.js`): `RPG.swordGeo` (lofted fullered blade, guard, corded grip, wheel pommel), `RPG.fistGeo`,
  `RPG.forearmGeo`, material `RPG.gearMat` (per-vertex metal / roughness in attribute `mr`; steel mirrors `SH.skyBase` and glints from point
  lights, there is no environment map). The forearm is aimed every frame from the wrist at a fixed elbow point (`C.place`). Poses are unchanged.
- **Night**: window panes are `SH.paneLit` (called from one marked line in `44_kit.js`): values are tuned for the night exposure of 3, so keep
  them under about 0.6. Glows and sparks have an angular size limit in `48_particles.js`. `43b_lamps.js` bakes every outdoor lantern's pool
  into `G.lampTex` (640 px over the terrain square, houses block it); the terrain adds it with `SH.lampPool` and skips those lanterns as real
  lights (stored with a negative radius). Outdoors, indoor lights no longer take light slots.
- **Trees** (`74b_trees.js`, assets in `kits/trees.glb`, `trees_far.webp`, `TREES.json`; sources in `kits/TREES_PROVENANCE.md`): scanned
  Poly Haven firs, a pine and a small broadleaf. Three rings: near model, thinned middle model (also the near-shadow caster), flat
  stand-ins in 400 m cells. The inner rings are instance lists refilled when the player moves 1.2 m. `--opt trees=0` plants the old
  generated trees (also the fallback if the files fail to load). The big oaks and bushes are still generated.
- **Wind** (`Wind` in `50_env.js`, `SH.gust` / `SH.sway` / `SH.hangSway` in `40_shade.js`): one gust field carried downwind. Kit pieces
  named `gen_sign_*`, `gen_bunt_*` and `dr_laundry*` get hang weights in the batch attribute `kg.z / kg.w` (`SH.hangOf`, two marked lines
  in `44_kit.js`): a new hanging piece only needs a rule there.
- **Weather** (`50b_weather.js`): `Weather.set('fair' | 'overcast' | 'rain' | 'auto')`, `--opt weather=rain`. Writes `Env.cover`,
  `Env.mist`, `Env.rain`; `ENV.wet` drives the terrain (dark ground, pools, rings, lamp shine). Rain is particle kind 4. The sequence
  is a fixed function of game time; the first three minutes are always fair.
