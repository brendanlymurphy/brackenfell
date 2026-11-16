# How the engine is put together

`AGENTS.md` has build, test, publish and the rules. This file is the map of the machinery: read the section for the area you are
about to touch. Measurements and step-by-step records are in `docs/HISTORY.md`; rejected ideas in `docs/DECISIONS.md`.

## Code layout

- No modules. `tools/build.mjs` concatenates `src/*.js` in name order into `game.js`; every file is a classic script and top-level
  names are shared. Three.js r187 is bundled from `src/lib/three-entry.js` into `three.js` as the globals `THREE`, `TSL` (node
  materials) and `T3X` (extras: `T3X.gltf()` is the glTF loader with the meshopt decoder attached).
- Wrap TSL code in a closure: TSL's `clamp`, `mix`, `length` collide with the game's maths helpers.
- Later files extend earlier ones by wrapping (`const base = TALK.greta; TALK.greta = function () { ... base.call(this) ... }`).
  Prefer that to editing a file you do not own.
- Never put a `//` comment inside a long single-line statement: the rest of the line is commented out. It has happened four times.

## Rendering

- `10_gfx.js`: renderer (WebGPU, WebGL 2 fallback), the material texture pack (25 layers; ASTC where supported, images elsewhere),
  `MAT` layer ids, `GFX_TEX` caps (`color <= 512` on phones, Low and Medium; `tiny` picks the half-size pack).
- `40_shade.js`: frame uniforms `SH.U` and helpers (`SH.hemi`, `SH.pointLights`, `SH.perturb`, fog, wind `SH.gust` / `SH.sway`).
  The scene has ONE real light, a DirectionalLight (sun or moon). Ambient and up to 8 point lights (hearths, lanterns) are added in
  each material's `emissiveNode`, limited by zone so light does not leak through walls. `40b_depth.js` room depth and grime,
  `40c_light.js` window light and fire pools, `72m_bake.js` baked contact darkening.
- `41_materials.js`, `42_scene.js`, `43_render.js`: materials, scene objects, the frame (camera pass + near sun-shadow map + wide
  sun-shadow map; the wide map is redrawn every third frame on medium, every fourth on low). `QUALITY` in `43_render.js` holds the
  tiers (low / medium / high): `houseFar`, `shadowRes`, `grassRange`, `lights`, `yardRange` and so on. `99_main.js` adapts the tier.
- `43b_lamps.js` bakes every outdoor lantern's pool into `G.lampTex`; the terrain adds it (`SH.lampPool`), so street lamps cost
  no light slots. Window panes are `SH.paneLit`, tuned for the night exposure of 3: keep values under about 0.6.
- On WebGPU a headless browser cannot present the canvas: test mode renders to a target and reads it back. Never render straight
  to the canvas in a WebGPU test.

## Kit, culling and the budget views

- `44_kit.js` loads the GLB packs and batches every placed piece. Each piece is a unit with its own index range; `Kit.update` gives
  it a state (full model, far copy, not drawn) from distance (`R.q.houseFar`, `Kit.DROP` x size, or `Kit.RANGE[batch name]`), the
  view cone and occlusion (`Kit.occlude`: a 720-bin horizon from the houses' shadow boxes). All batches share one pooled mesh per
  material (`Kit.poolGroup`). Index buffers are rewritten when the camera moves 1.5 m or turns 11 degrees.
- Pieces added to a batch after it was built are ignored (the outlaw camps' props). `test/kitcull.mjs` renders 16 viewpoints with
  culling off and on and must find them identical.
- `42_scene.js` pools terrain and water tiles, cuts big static prop meshes into 8 m squares (drawn by view; a twin casts into the
  near shadow map), and keeps boulders as two instance lists. `46_grass.js` draws tufts from a list of grid cells in view.
  `74b_trees.js`: scanned trees in three rings (near model, thinned middle model, flat stand-ins).
- Switches for comparing: `--opt kitdyn=0 kitocc=0 kitcone=0 pool=0 sub=0 rockring=0 treering=0 grassall=1 grasscone=0 trees=0`.
- The four budget views (square, alley, terrace, lake) are `test/perf_views.js`; `window.__cat = true` before it prints the cost by
  category. Target: medium 220 draw calls / 380k triangles, low 140 / 200k. Measured at Build 59: medium square 216 / 452k, alley
  224 / 452k; low square 170 / 246k, alley 181 / 269k. `tools/gate_budget.json` holds the accepted numbers the gate compares with.
- Asset tools: `tools/kits.mjs`, `kits_budget.mjs` (per-piece triangle budgets), `kits_far.mjs` (`@far` copies), then ALWAYS
  `node tools/assets_pack.mjs` (meshopt compression, the small packs `kits/s`, `kits/skin/s`); `tools/tex_half.mjs` after the
  material pack changes (`tex/s`). `tools/build.mjs` prints what a first visit downloads per device.

## Characters (`49_chars.js`, `76_characters.js`, `77*.js`)

- `Chars.define(name, cfg)`; boot tries the `real` set (MakeHuman bodies in `chars/real`, clips retargeted from the Quaternius
  names), then `quaternius`. Each villager id has its own body (`BODY` table); outlaws are lazy bodies (`Chars.ensure`).
- Four weights per body: full (about 10 000 triangles), `@mid` 4600, `@lod` 2200, `@far` 700, swapped by `Chars.LOD.dist[tier]`.
  Regenerate with `tools/chars_lod.mjs --level mid|lod|far`, then `assets_pack.mjs`.
- Faces: there are no jaw or eye joints and no morph targets. Skin vertices are moved in the vertex shader by their place in the
  shared skin atlas (`cfg.face`): `H.uMouth`, `H.uBlink`, `H.uGaze`. `faceUpdate` reads the playing line (`Snd.vox.cur`).
  Clothes are dyed per person from `NPC_DEFS` (`top`, `legs`); hats, belts and pouches are merged into the body mesh (`accGeometry`).
- `77_npc.js` who people are and their schedules; `77b_ambient.js` passers-by; `77c_patrons.js` inn regulars; `77d_handprops.js`;
  `77e_households.js` people at home and at work. `R.boneData` holds one slot per hinged, carried or animated thing.
- Test hooks on a handle: `ch.mouthTest` (0..1), `ch.blinkTest`, `ch.gazeTest = [u, v]`.

## World

- `55_layout.js` sites and roads, `55b_infill.js` infill houses, `55c_wilds.js` places outside the village. `60_terrain.js` height
  field and ground. `70` to `73k`: props, house shells, the village build-out (alley, dressing, boardwalks, levels, wharf, vertical
  routes, walls, lanes, the square). `74*` vegetation. `79_wilds.js`, `79b_life.js` the wilds and the people in them.
- `50_env.js` time of day and the single wind (`Wind`); `50b_weather.js` (`Weather.set('fair' | 'overcast' | 'rain' | 'auto')`,
  `ENV.wet` drives wet ground). Hanging kit pieces (`gen_sign_*`, `gen_bunt_*`, `dr_laundry*`) sway through `SH.hangOf`.

## Interiors as cells (`56_cells.js`, `72d` to `72l`)

- Every enterable building's interior is built at a remote origin; the village keeps only the shell. `Cells.use` is the door
  (fade, place name). `Cells.env` sets indoor light: sun off, `CELL_DAYLIGHT` lifts ambient for rooms with windows. `Cells.list`
  has 58 cells at Build 59.
- `72d_plan.js` is the plan engine: rooms on a 0.5 m grid, doors, stairs, cellars, placement helpers, `planValidate`. Designed plans
  are in `72e_plans.js`, `72h_trades.js`, `72j_plans2.js`; six layout families for ordinary houses in `72k_houses.js`; dressing in
  `72g_dress.js`, `72i_wares.js`, `72l_hobjects.js`; the crypt in `72f_underworld.js`; the Old Mine is its own cell (`94_mine.js`).
- `test/interiors.js` (placement validator, quest objects present), `test/parity.mjs` (a plan must not drop a quest object),
  `test/cells.js` (enter every cell, walk it, leave).

## Game rules and story

- `80_game.js` state `S`, quests, `TALK` dialogue (`node(text, options)`), save. `81_wilds_story.js` wilds quests. `82_story.js`
  the main story, Act 1 (`docs/STORY.md`). `82b_interact.js` containers, loose things, letters, theft and the cell, locks, seats,
  stew and beds, and `IX.SAY` (remarks people make before their own line). `82c_secrets.js` nine town secrets. `94_mine.js`,
  `94b_economy.js` (shops, perks, notice board, rumours), `94d_act2.js` (Acts 2 and 3, two endings).
- `90_rpg.js` health, stamina, damage, HUD; `91_combat.js` first-person sword; `92_foes.js` outlaw camps; `93_inventory.js` pack.
- `78_player.js` collision and walkable surfaces. `85_ui.js` HUD, dialogue, journal, pause (and the `Build N` label); `86_map.js`;
  `87_feel.js` camera feel; `87b_input.js` controls.

## Sound and voices

- `Snd` in `88_audio.js`: buses amb / world / foot / ui / music into a master chain with a soft ceiling; reverb spaces room, hall,
  cave; open air is dry. `88b_sfx.js` synthesised effects, `88c_*` ambience, music, world state.
- `88d_voice.js`: when a dialogue node is shown, `Snd.say(npc, text)` looks up `cyrb53(speaker + '\n' + text)` in
  `audio/voice/manifest.json` and plays the file DRY (never through a bus or reverb). No entry means a subtitle only. When the whole
  text has no entry but its paragraphs do (a remark from `IX.SAY` in front of the villager's own line), the paragraphs are played
  in turn. A notice of the form `<b>Name</b>: “line”` (overheard talk) plays that speaker's recording.
- Offline pipeline (`tools/voice`): `extract.mjs` walks the source for spoken text (`node()` calls, `addOpt('id', ...)`, `IX.SAY`
  rows, `[id, line]` pairs, overheard notices; `extra_speakers.json` names the speakers it cannot work out) and writes `lines.json`;
  `plan.mjs` adds the barks (`barks.json`) and writes `plan.json` in story order; `gen_gemini.py` generates missing files (resumable,
  stops at the daily limit of 100 requests), `--have` rewrites the manifest from the files that exist; `check.mjs` verifies.
  `cast_gemini.json` is the casting: one prebuilt voice and a one-line acting direction per character.
- Text built at run time (prices, counts) cannot be recorded and stays a subtitle; `extract.mjs` lists those as `dynamic`.

## Loading, offline, service worker

- `index.html` and `sw.js` are written by the build with content hashes. The page is fetched network-first, assets cache-first;
  the manifest groups (`kits`, `kitss`, `astc`, `astcs`, `chars`, ...) decide what a device downloads. `test/sw.mjs`,
  `test/loadshots.mjs`, `test/real.mjs` (production boot), `test/fallback.mjs` (must end on WebGL 2).

## Test harness

- `test/pw.mjs` finds Playwright and a Chrome on any machine. `test/shot.mjs` serves the repository, opens the page with the
  `--opt` values as `TEST`, runs each `--do` script in the page and prints what it returns; `--out` saves a screenshot.
- In the page: `game.shot(x, y|null, z, yawDeg, pitchDeg, hour)` returns `{draws, tris}`; `game.enter(id)`, `game.leave()`,
  `game.tp(...)`, `game.step(n, dt)`, `game.draw()`, `window.__gpuErrors()`, `G.backend`.
- `tools/gate.mjs` runs everything in order, one browser at a time; see `AGENTS.md`.
- Tests cannot see frame rate on a real phone, flicker or z-fighting in motion, or anything audible.
