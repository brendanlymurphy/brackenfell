# History: measurements and step-by-step records

Moved out of `docs/STATE.md` so that file stays short. Nothing here is needed to work on the game; it is the evidence behind what
`STATE.md` and `DECISIONS.md` state. Newest numbers first where a section has several.

## Performance work of Build 49 (fork-perf): where the frame went at Build 41, and after each step

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

### After step 4 (characters)

| Tier | Square | Alley | Terrace | Lake | Budget |
|---|---|---|---|---|---|
| medium | 154 / 282k | 165 / 297k | 140 / 204k | 120 / 223k | 220 / 380k |
| low | 113 / 193k | 121 / 199k | 115 / 149k | 87 / 166k | 140 / 200k |

Inn hall (`game.enter('inn')`, looking in, 15 people): 95 draw calls / 248k triangles (was 293k; budget 260k).

- Bodies now have four weights: full (about 10 000 triangles), `@mid` (4600, hair and brows kept), `@lod` (2200), `@far` (700).
  `Chars.LOD.dist[tier]` = `{ hi, mid, lo }` metres (medium 4.5 / 11 / 26, low 3.5 / 7 / 16, high 7 / 18 / 40); the far copy also casts
  the sun shadow. Regenerate after changing a body: `node tools/chars_lod.mjs --level mid --tris 4600 chars/real/[fmo]_*.glb`, then
  `--level lod --tris 2200`, then `--level far --tris 700`. The copies add about 170 KB per body file.
- Low tier: `houseFar` 26 (was 30), `Kit.DROP.low` 40, near trees inside 11 m.

### Step 5: what a first visit downloads

| Device | Build 41 | Now |
|---|---|---|
| Phone, or Medium tier (512 texture cap) | 74.9 MB | 56.9 MB |
| Low tier chosen, or a low-memory device | 74.9 MB | 36.3 MB |
| Desktop on High | 74.9 MB | 69.0 MB |

(`node tools/build.mjs` prints these and the size of each group.) What changed:
- `tools/assets_pack.mjs`: geometry of every GLB in `kits/` and `chars/real/` is stored with EXT_meshopt_compression (the loaders use
  `T3X.gltf()`, which carries the decoder); character normals, UVs and skin weights are small integers. Characters 15.8 > 10.4 MB
  (after the two extra detail levels of step 4 had added 3.2 MB), kit packs 27.7 MB.
- Small packs for devices whose texture cap is 512 anyway (`GFX_TEX.color <= 512`: phones, Low, Medium): `kits/s/*.glb` (512
  textures; the trees' atlases at 1024) and `kits/skin/s/*.webp`. 15.6 MB instead of 27.7 MB. Manifest group `kitss`.
- `tools/tex_half.mjs`: `tex/s/` is the ASTC material pack without its top mip level (7.3 MB instead of 27.9 MB, a quarter of the
  texture memory). Used when the Low tier is chosen or the device reports little memory (`GFX_TEX.tiny`); `?texpack=half` / `full`
  forces one. Group `astcs`. Not used on iPhones by default: Safari does not report memory, and whether the ground still looks sharp
  enough at 512 on a real phone has to be judged there. If it does, switching phones to it saves another 20 MB.
- After `tree_pack.mjs`, `chars_lod.mjs` or `kits*.mjs` rewrite a file, run `node tools/assets_pack.mjs` again (and `tex_half.mjs`
  after the material pack changes).
- Not done: KTX2 / Basis. No encoder is installed here and the asset hosts are blocked; the WebP textures are still decoded to
  uncompressed RGBA on the GPU (a 512 map is 1.4 MB, a 1024 map 5.6 MB).


## Publishing accidents

- Builds 10 and 11 were announced as live while their GitHub Pages deployments had failed: a symlink was tracked. Check the run.
- A builder that throws only logs a warning; a build shipped with two places silently missing. Hence the silent-boot check.
- `R.boneData` (one slot per hinged, carried or animated thing) overflowed silently at 96 slots once; it grows on demand since Build 25.
- Build 56: a 24-second voice file (the model read its acting direction aloud) was pushed unmeasured; see `DECISIONS.md`.
