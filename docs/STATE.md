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

## Where the frame goes (fork-perf, measured at Build 41)

`node test/shot.mjs --opt webgl=1 --opt quality=medium --do "window.__cat=true; $(cat test/perf_views.js)"` prints this for the four
budget views (square, alley, terrace, lake). One frame = camera pass + near sun-shadow map + wide sun-shadow map. A test redraws the
wide map every frame; the game redraws it every third frame on medium and every fourth on low, so its share is smaller in play.
Budget: medium 220 draw calls / 380k triangles, low 140 / 200k.

Totals at Build 41 (draw calls / triangles):

| Tier | Square | Alley | Terrace | Lake |
|---|---|---|---|---|
| medium | 280 / 566k | 328 / 583k | 244 / 434k | 280 / 440k |
| low | 215 / 317k | 264 / 347k | 199 / 260k | 231 / 269k |

Medium, by category, draw calls / thousand triangles (camera + near shadow + wide shadow where they differ from zero):

| Category | Square | Alley | Terrace | Lake |
|---|---|---|---|---|
| Houses and kit batches, full detail | 73 / 170 | 83 / 192 | 56 / 131 | 22 / 90 |
| Houses, distant copies | 20 / 3 | 44 / 7 | 16 / 2 | 87 / 19 |
| Kit instances (plants, tufts, repeated props) | 13 / 29 | 15 / 31 | 4 / 8 | 13 / 20 |
| Generated props and yard things | 31 / 36 + 10 / 29 near shadow | 30 / 33 + 15 / 38 | 38 / 34 + 19 / 31 | 26 / 36 + 7 / 16 |
| Terrain | 35 / 59 | 35 / 59 | 32 / 55 | 38 / 65 |
| Grass | 1 / 45 | 1 / 45 | 1 / 45 | 1 / 45 |
| Trees | 16 / 33 + 2 / 1 near + 6 / 23 wide | 17 / 36 + 4 / 3 + 7 / 24 | 16 / 31 + 3 / 2 + 8 / 24 | 19 / 42 + 2 / 2 + 8 / 24 |
| Boulders and bushes | 9 / 21 + 7 / 19 near + 2 / 1 wide | 8 / 22 + 9 / 22 + 3 / 1 | 7 / 12 + 6 / 15 + 3 / 1 | 11 / 24 + 6 / 16 + 3 / 1 |
| Characters | 19 / 51 + 10 / 23 near | 26 / 36 + 5 / 11 | 1 / 2 + 8 / 19 | 10 / 14 + 1 / 2 |
| Water | 6 / 15 | 6 / 15 | 6 / 15 | 6 / 15 |
| Sky, particles, view model, other | 16 / 5 + 4 / 4 shadow | same | same | same |

What stands out: full-detail houses are a third of the triangles and a quarter of the draw calls in town; kit batches cast no sun
shadow at all (the shadow passes hold only props, boulders, trees and people); terrain is 32 to 38 draw calls whatever the view;
grass is a flat 45k on medium; the wide shadow map spends 23k triangles on tree stand-ins; props and boulders cost almost as much
again in the near shadow map as in the camera pass. On low the same views are terrain 59k, trees 28k + 23k, houses 64k to 106k.

### After step 2 (houses, pooling, shadow casters)

| Tier | Square | Alley | Terrace | Lake |
|---|---|---|---|---|
| medium | 159 / 381k | 171 / 382k | 146 / 274k | 127 / 288k |
| low | 118 / 261k | 127 / 258k | 120 / 201k | 94 / 204k |

How it works now:
- `44_kit.js`: every outdoor batch is "dynamic". Each placed piece is a unit with its own index range; `Kit.update` gives each unit a
  state (full model, far copy, not drawn) from its distance (`R.q.houseFar`, or `Kit.DROP` x its size for pieces without a far copy,
  or `Kit.RANGE[batch name]`), the view cone (20 degrees wider than the screen) and occlusion (`Kit.occlude`: a 720-bin horizon built
  from the houses' shadow stand-in boxes). All batches share one pooled mesh per material (`Kit.poolGroup`); a batch's own group is
  only the handle other code shows and hides. Index buffers are rewritten when the camera has moved 1.5 m or turned 11 degrees.
  `--opt kitdyn=0` restores the old per-cell meshes; `--opt kitocc=0` / `kitcone=0` switch off one test. `node test/kitcull.mjs <dir>`
  renders 16 viewpoints with culling off and on and must report them identical.
- `42_scene.js`: terrain and water tiles of a pack are one mesh each (`SC.pools`, refilled when a tile comes into view); big static
  prop meshes cast into the near shadow map through a twin holding only the 8 m squares the map covers (`st.sub`); boulders are two
  instance lists (`SC.rocks`: worth drawing from here / near and big enough to cast).
- `74b_trees.js`: the wide shadow map draws tree stand-ins from a list round the map (`Trees.farCastRing`), not every tree in the valley.
- Pieces added to a batch after it was built are still ignored (as before): the outlaw camps' props go to `kit-yard` on the first tick.

### After step 3 (grass, trees, props and water by what is in view)

| Tier | Square | Alley | Terrace | Lake |
|---|---|---|---|---|
| medium | 154 / 314k | 165 / 323k | 140 / 221k | 120 / 233k |
| low | 113 / 220k | 121 / 224k | 115 / 163k | 87 / 176k |

- `46_grass.js`: tufts come from a list of grid cells (`gc` attribute), rebuilt when the player moves 1 m or turns 11 degrees: 8 x 8
  blocks inside the grass range and the view cone that can hold grass at all (`Grass.blockHasGrass`, remembered per block).
- `42_scene.js`: big static prop meshes and long water tiles are cut into squares (`squares()`: 8 m props, 16 m water); the camera
  draws the squares in or within 10 m of the view (`viewUpdate`), unless the mesh itself still casts shadow (high tier), then all of it.
- `74b_trees.js`: the camera's flat stand-ins are one instance list of the trees in the view cone (`Trees.farRing`); the middle
  model keeps a sixth of the cards (`TREE_KEEP=0.17 TREE_GROW=2.05` in `tree_pack.mjs`).
- Switches for comparing: `--opt pool=0`, `sub=0`, `rockring=0`, `treering=0`, `grassall=1`, `grasscone=0`.

