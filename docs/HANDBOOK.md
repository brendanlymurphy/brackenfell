# The Brackenfell handbook

Written 18 November 2026, when all work was stopped to reorganise. **This is the one file a new session reads first.** It holds
what the project is, what the owner wants, what went wrong and why, the rules that came of it, how to build, test, look and
publish, how assets get in, and what happens next. Everything older is reference; section 12 says which older file is still
true for what.

If you have ten minutes: read sections 1 to 5. If you are the Blender session: sections 1 to 4, then 8, then
`docs/briefs/AGENT_BLENDER.md`.

---

## 1. What this is

A first-person medieval village role-playing game that runs in a browser (Three.js r187, WebGPU with a WebGL 2 fallback). One
player, a personal project of one owner. Repository `brendanlymurphy/brackenfell`. Development branch `threejs`; `main` is what
is published, at https://brendanlymurphy.github.io/brackenfell/ (GitHub Pages, built by the `pages` workflow).

The look the owner wants is **Skyrim, Riften in particular**: realistic, muted, weathered timber and stone, mist, firelight.
The aim is a world: Brackenfell first, then other villages (a forest village, a mountain village), then the land between them
and out to the mountains.

What exists today (Build 89 live, Build 90 on `threejs` unpublished):
- One town, Brackenfell: about 130 buildings, 57 of them enterable as interiors (231 rooms), a market square and alley, a wharf,
  a chapel with a crypt, a mine, the land outside the walls.
- 77 named people (`docs/PEOPLE.md`) with homes, work, daily routines, lines; 17 of them carry the story. 529 of 774 lines have
  recorded voices (on `threejs`; `main` has 254).
- A main story in three acts, side quests, nine secrets, an economy, combat, a day of 40 minutes, weather.
- About 110 source files, 118 test scripts, a test gate on GitHub.

## 2. The owner, and how to work with him

- He plays on a MacBook in Chrome. He is the only person who plays. He reads on a phone or the laptop: **answers short, the
  conclusion first, plain words, say plainly whether a build is live and verified.**
- He judges by walking around and looking. His screenshots (`docs/owner/`) are the most valuable input the project gets.
- What he hates, in his words over many builds: glitches; things that look cheap, lazy or primitive; fake buildings and fake
  life; mute characters; copy and paste; adding things without thinking them through; being told something is fixed from a new
  flattering angle.
- What he asked for on 18 November, after five builds in one day each had something broken he found in two minutes: get every
  rule and lesson into one place (this file); build a large asset library in Blender; then one small village per agent; then
  revamp Brackenfell with the library; fix the bugs that came with the first geometry.
- He decides. Decisions made for him while he was away are listed in section 11 so that he can overrule them.
- His email address is private: never put it in a request to an outside service, a commit or a file. Git identity is
  `Claude <noreply@anthropic.com>`. Keys and secrets never go in chat or the repository.

## 3. Why it kept breaking (read this twice)

Days of work by five sessions, ninety builds, and every build still had something a person sees in two minutes. The cause was
never missing knowledge. It was these five things, and every rule below exists to stop one of them.

1. **Nearly everything a person recognises was built from code by something that never saw it.** A pig as two pink balls, a
   lute as a disc on a plank, a boat as a squashed ball, fish as white diamonds, a skull as a white lump, a tree as a stick with
   four arms. Code is right for terrain, walls, roofs and layout. It is the wrong tool for anything with a silhouette a person
   knows. The parts of the game that look good are the scanned models (Poly Haven) and kit pieces.
2. **Placement is rules, and rules collide.** Making interiors the size of their shells put a stair in the doorway of dozens of
   houses. A furnishing table that named rooms differently from the plans left 49 rooms empty without anyone noticing. A
   hanging that drew one more random number moved every piece placed after it. Two walkers were sent to one doorway.
3. **Nobody looked.** The sessions run headless. They see only the pictures they choose to take, and they chose flattering
   ones. Tests check what someone thought of. A stretched spike on the chapel, a timber hanging in the air, a ruler-straight
   patch of earth: all passed every test and the coordinator's review. The owner was the whole quality department.
4. **Too much at once.** All 57 buildings were made enterable: 231 rooms to make right together. Skyrim's own towns are full of
   locked doors.
5. **Too many hands in the same files.** Several sessions and workers changed overlapping systems in parallel. Every merge
   broke something: on 18 November five builds went out and three needed a second run (a ninth vertex attribute that WebGPU
   refuses, a tavern that lost four seats, a secret that could no longer be reached).

What worked, and is kept:
- **A camera that looks at everything the same way.** The room camera (`test/roomviews.mjs`: every room from each of its own
  doorways, day and night, one labelled sheet per house) found, in one hour, 77 empty rooms, 14 doors that swing into your
  face and 19 rooms dark by day that every test had passed.
- **Sending work back with the picture.** Wharfside went from eleven identical plank boxes to eleven different houses in four
  rounds, because each round was judged from honest pictures and specific faults were named.
- **Real models.** Every time a code-built thing was replaced by a kit piece or left out, the complaint stopped.
- **Ratchets.** Counts that may only fall (`tools/gate_ratchet.json`).

## 4. The rules

These are not style. Each one was paid for.

**Looking**
1. Nothing counts as done until the cameras have been over it and every frame has been looked at: the room camera for
   interiors, the walk camera (`test/walkviews.mjs`: a frame every 5 m of every lane, both ways and to each side, day and night)
   for outdoors. Not pictures at angles their author chose.
2. Proof of a fix is the same view the fault was reported from: the owner's position and heading, before and after. Never a
   new angle.
3. Look at your own work from the end, from behind and from below before you report it.
4. Say what you did not check. Nobody has verified anything audible, anything in motion (flicker, popping) or a real device;
   every report says so until someone has.

**Making things**
5. Nothing living or recognisable is built from primitives. It is a model (section 8) or it is left out.
6. A thing that cannot pass at arm's length (0.6 m) is left out. An honest gap beats a cheap object.
7. Inside and outside are the same building: storeys, windows, doors, chimneys, cellars agree.
8. From its own doorway every room answers "whose is this and what do they do here". From the street door a house shows its
   room, not the side of a stair.
9. No pure white, no pure colour, no black iron lifted to grey, no lawn in a town, no ruler-straight edge between ground
   materials, no flat sheet of one colour.
10. Nothing may pop in, pop out or swap detail within sight, on any quality tier. Medium and High are what the owner sees;
    nothing visible there is traded away for the Low budget.
11. Every door has 3 m clear before it and can be reached on foot. Every story object has a 0.9 m way to within reach.
12. A piece of dressing draws no random numbers of its own from the shared stream (it moves everything placed after it): derive
    variation from the piece's index.
13. Small first. Ten good buildings before fifty. A village is 8 to 12 buildings with 4 to 6 enterable until the owner says
    otherwise. Doors that are not finished are locked, as in any shipped game.

**Working together**
14. One area per session. Do not edit another session's files; ask in your report. The engine has one owner.
15. One branch per session (`fork-<name>`), from the latest `threejs`. Commit after every working step and push: sessions are
    restarted without warning (about every 45 minutes on the shared machine) and an unpushed step is lost.
16. Never `git stash` (shared by all worktrees). Never edit the text of a recorded line (recordings are keyed by speaker and
    exact text). Never put a `//` comment inside a long one-line statement. Never commit built files, `node_modules`, symlinks
    or secrets.
17. One headless browser at a time on a machine; check with `pgrep` before starting a test. All worktrees on one machine share
    port 8374.
18. Budgets are measured, not guessed: Medium at most 380k triangles and 220 draw calls in the four budget views (aim 335k in
    the square), Low at most 230k and 150. Accepted figures live in `tools/gate_budget.json` and only the coordinator moves
    them.
19. Assets are CC0, or CC-BY with author and link recorded next to the file. Nothing non-commercial, ripped or unclear.
20. Commits end with the two trailer lines used throughout the log (`Co-Authored-By`, `Claude-Session`).

## 5. What happens next (the plan the owner chose)

In this order. Do not start a step before the one above it has passed.

1. **This handbook** (done). Every session reads it and nothing else first. `CLAUDE.md` at the repository root points here.
2. **Prove Blender.** The owner sets up Blender 5.1 or newer with Blender Lab's connector in Claude Desktop (steps in section
   8) and starts a Blender session with `docs/briefs/AGENT_BLENDER.md`. The first job is five assets across the range: a house
   front (one wall bay with a window), a roof bay, a door in its frame, a clinker rowing boat, a market stall. Each as a
   rendered sheet at 0.6 m, 3 m and 6 m. The owner judges. If they read as Skyrim, go to 3. If they read as rounded blocks, the
   library is made by fitting scanned and CC0 models in Blender instead of modelling from nothing: same format, same pipeline.
3. **The asset library**, by a planned list (section 8): a realistic building kit first (it replaces the stylised kit the town
   is built from), then props, plants, food, tools. Every asset has its sheet looked at before it is accepted.
4. **A village becomes data.** One session, the engine's only owner, makes a settlement a folder: a site, plots, buildings
   picked from the kit, people. Today Brackenfell is written into about forty source files (section 7). Until this is done a
   second village means four sessions editing the same code again.
5. **One small village per agent** (forest, mountain, a third), each in its own folder, built only from the library and this
   handbook, accepted only by the cameras.
6. **Brackenfell revamped** with exteriors and props from the library. Until then, only what the owner screenshots is fixed.

One small job stands outside the order because the owner is waiting for it: **Build 90** (on `threejs`, d0991c0 and the docs
commits after it) carries 529 voice lines and Wharfside but failed two gate steps (`openings` in two shards, `geom` kitSheets
843 against 842). Fix, look, publish, so that he can hear the voices. `docs/NEXT.md` has the exact state of every branch.

## 6. Build, test, look, publish

**Build.** `npm ci` once. `node tools/build.mjs` bundles Three.js, concatenates `src/*.js` in name order into `game.js` and
writes `index.html` and `sw.js`. Built files are not tracked: build after every checkout, pull or merge. `node --check game.js`
after a merge.

**Test.** `node tools/gate.mjs --quick` (about 5 minutes) or `--full` (about 35); `--only a,b`, `--no-build`, `--cells id,id`,
`--list`. It retries a failed step once and writes `shots/gate/gate.md` and a log per step. Every push to `threejs` runs the
full gate on GitHub in six jobs; a push to a `fork-*` branch runs the quick one (`gh workflow run gate --ref fork-NAME -f
mode=full` for the full). A push that changes only `docs/`, `*.md` or `test/audit/` runs nothing. Read a result with
`gh run view <id> --json status,conclusion,jobs`, `gh run download <id> -n gate-K -D dir`, `grep FAIL dir/gate.md`. GitHub runs
at most twenty machines at once: cancel stale runs.

**Look.**
- One picture: `node test/shot.mjs --size 800x450 --opt webgl=1 --opt play=1 --opt quality=medium --do "return (await
  game.shot(x, null, z, yawDeg, pitchDeg, hour)).draws" --out file.png` (`y` null means eye height on the ground there).
  Indoors: `game.enter('cellId'); game.step(6, 1/30);` then `game.shot` with an explicit `y` (floor + 1.6).
- Any value: `node test/ev.mjs --opt webgl=1 "<js that returns a string>"`.
- Every room: `test/roomviews.mjs` and `test/roomviews_sheet.py` (on `fork-fin`, to be merged). Every lane:
  `test/walkviews.mjs` (begun on `fork-fin`, not finished).
- Under load a browser tab crashes ("Target crashed"): retry, or rely on GitHub.

**Publish (coordinator only).** Bump `BUILD_NAME` in `src/85_ui.js`, push `threejs`, wait for a green full gate, look at the
camera sheets, then `git merge-base --is-ancestor origin/main <sha> && git push origin <sha>:main`. The `pages` workflow
deploys. A build is live only when `curl -s "https://brendanlymurphy.github.io/brackenfell/game.js?t=$(date +%s)" | grep -o
"BUILD_NAME = 'Build [0-9]*'"` prints it. Say "live and verified" only then.

**Voices.** Generated offline with Gemini 3.1 Flash TTS and shipped as AAC; a line without a file is a subtitle. The key is a
network secret on one cloud environment only (the logic session's); 100 requests a day. Commands and checks are in `AGENTS.md`
("Spoken dialogue"). Only the owner's ear counts for quality.

## 7. How the code is laid out

Plain scripts, one global scope, load order by the number in the file name. The generated map of all 107 files with their own
first-line descriptions is `docs/SRC_MAP.md`. By area:

| Area | Files |
|---|---|
| Maths, renderer, mesh builder | `00_math` `10_gfx` `31_mesh` |
| Shading, light, materials, scene, frame, quality tiers | `40_*` `41_materials` `42_scene` `43_*` `72m_bake` |
| Kit loader, batching, culling, detail layer; sky, grass, water, particles | `44_kit` `45_sky` `46_grass` `47_water` `48_particles` `75_*` |
| Time, weather | `50_env` `50b_weather` |
| Characters (bodies, faces, clothes, level of detail), hand props | `49_chars` `76_characters` `77d_handprops` |
| The cast as data (generated from `docs/PEOPLE.md` by `tools/cast.mjs`: never edit by hand) | `54_cast` `54b_castrules` `82d_cast` |
| World data: sites, roads, infill, the wilds | `55_layout` `55b_infill` `55c_wilds` |
| Interior cells (each interior is its own space far from the town, joined by its door) | `56_cells` `56b_viewcube` |
| Terrain, props, house shells | `60_terrain` `70_props` `71_*` `72_buildings` `72c_infill` |
| Interiors: plan engine, plans, dressing, wares, objects, rooms table | `72d_plan` `72e_plans` `72h_trades` `72j_plans2` `72k_houses` `72g_dress` `72i_wares` `72l_hobjects` `72n_rooms` (generated from `docs/ROOMS.md` by `tools/rooms_data.mjs`) |
| The town built out: alley, dressing, levels, wharf, walls, lanes, square, plots, yards, ground | `73_village` `73b` to `73p` |
| Trees and vegetation | `74_vegetation` `74b_trees` |
| Villagers, routines, households, passers-by | `77_npc` `77b_ambient` `77c_patrons` `77e_households` |
| Player, collision, the wilds' life | `78_player` `79_*` |
| Rules, quests, story, interaction, secrets, ownership and hours, memory, scenes, mine, economy | `80_game` `82_*` `90_*` to `94_*` |
| Interface, map, input | `85_ui` `86_*` `87_*` |
| Sound and spoken lines | `88_*` |
| Boot and frame loop, test hooks (`game.shot`, `game.enter`, `game.tp`, `game.step`) | `99_main` |

Things a newcomer trips on:
- **Brackenfell is written into the code**, not into data: the town's layout, plots, yards, lanes and dressing live in
  `55_*`, `71_*` to `73p`. Step 4 of the plan exists to change this.
- **The building kit is stylised.** `kits/village.glb`, `props.glb`, `nature.glb` are Quaternius "MegaKit" packs (CC0, low
  polygon, cartoon proportions) reskinned with scanned Poly Haven textures (`kits/skin/`). That is the root of "blocky" and
  "copy paste" outdoors. `kits/scan.glb` (61 Poly Haven scans: furniture, barrels, tools, pots) and `kits/trees.glb` are the
  realistic part. Catalogues: `kits/CATALOG.json` (339 pieces with size, triangles, category, pivot), `kits/SCAN_CATALOG.json`.
- **Pieces are placed through batches** (`44_kit.js`): merged per material and 24 m cell, or instanced. Generated geometry goes
  through the mesh builder (`31_mesh.js`: `m.box`, `m.lathe`, `m.ball`, `m.quad2`, `m.mat`).
- **Each interior is a cell** built in its house's own frame at a far-off origin; the compass adds the site's bearing so that
  it reads true indoors.
- **The plan engine** (`72d_plan.js`) lays out rooms, stairs, doors and furniture on a grid with rules (`pAgainst`, `pPiece`,
  `pReach`, `pEnsureSeats`); `test/interiors.js` holds its invariants.
- **Tools**: `tools/kits.mjs` (convert kit packs), `tools/assets_pack.mjs` (compress GLBs, half-size textures: run after
  changing any GLB under `kits/` or `chars/`), `tools/scan/` (Poly Haven scans), `tools/cast.mjs`, `tools/rooms_data.mjs`,
  `tools/voice/`, `tools/gate.mjs`.

## 8. Assets: the library and Blender

**Why.** Section 3, cause 1. The library replaces, in this order: the stylised building kit; every code-built prop; then
adds what the world needs for new villages.

**Setting up Blender (the owner, once, about ten minutes).** Blender 5.1 or newer. In Claude Desktop: Customize, Connectors,
search "Blender", add the listing published by Blender Lab. Drag the add-on's install link from Blender Lab's page
(lab.blender.org/mcp-server) onto the Blender window, allow the "lab" repository, then drag it in a second time. In Blender:
Edit, Preferences, System, turn on Allow Online Access; Preferences, Add-ons, MCP: start the server and tick Auto Start. Test:
ask Claude what is in the open scene (a new scene has a camera, a cube and a light). It works only from Claude Desktop or
Claude Code on that machine, not from a browser or a cloud session. The connector can run any Python with the user's file
access: use that Blender for this project only. It has tools to run Python, summarise the scene, take screenshots and render;
it has no asset library of its own.

**What an asset is.** A `.glb` under `kits/assets/<name>.glb`: metres, +Y up, origin on the ground at the middle of the
footprint, facing +Z; at most 3 materials; textures at most 1024 px (512 for small things): base colour, normal, and one
occlusion-roughness-metal map; two levels of detail in the file, `<name>` (props under 3k triangles, large things under 8k)
and `<name>_far` (a quarter of that); a line in `kits/assets/ASSETS.md` (name, size, triangles, source, author, licence, date).
Modular building pieces also state their grid (the present kit is a 2 m bay, wall pivot at floor level) so that pieces snap.

**The bar.** Rendered in Blender beside a 1.75 m figure at 0.6 m, 3 m and 6 m, under a noon sun and under one warm lamp, on one
sheet `docs/proof/assets/<name>.jpg`. It must read as the thing at all three distances. Wood has grain along its length and
worn edges; iron is dark; cloth sags; stone has courses; nothing is a pure colour; nothing is a ball, a box or a tube with a
picture on it. The sheet is looked at by the coordinator and, for the first of each kind, by the owner.

**The planned list** (the Blender session keeps it current in `kits/assets/ASSETS.md`):
1. *Proof of five:* a wall bay with a window, a roof bay, a door in its frame, a clinker rowing boat, a market stall.
2. *Building kit, realistic, on the present 2 m grid so that existing plans keep working:* walls (timber frame with daub,
   plank, stone, brick; plain, with window, with door; corner posts, sill beams, jetties), roofs (thatch, slate, shingle, tile;
   bays, ridges, eaves, gable ends, dormers, chimneys with stacks), doors and frames (six, with ironwork), windows (leaded,
   shuttered, six), stairs inside and out, floors, porches and hoods, balconies, cellar hatches and gratings, fences, gates,
   palisade sections, well, market cross.
3. *Things now built from code* (each is a known complaint): boats (whole and half built), carts and barrows, fish and racks,
   nets, log piles and chopping block, bread, cheese, vegetables, pottery and glass, a wash line with clothes, hives, a hen
   coop, troughs, water butts, a tenter frame, cloth bolts, signs, awnings, stalls, tools by trade, a bier, grave markers, a
   lute, a tankard, a skull.
4. *Nature for new villages:* fruit trees, hedges, crops in rows, reeds, mountain rocks and scree, forest floor, fallen logs.
5. *Animals* are the characters session's job (realistic CC0 models: pig first), under the same bar.

**How an asset reaches the game.** The Blender session only adds files under `kits/assets/` and `docs/`. The engine's owner
writes the loader for `kits/assets/*.glb` (alongside `44_kit.js`: same batching, same lighting, the two levels of detail
switched outside the range where the switch can be seen) and wires each accepted asset in place of the code that built it.
Run `node tools/assets_pack.mjs` after adding GLBs. This loader does not exist yet: it is the first engine job once the proof
of five has passed.

## 9. Who does what

Before the stop there were a coordinator, four agent sessions on their own machines and three workers on the coordinator's
machine. Names and branches, so that their reports make sense: OG (`fork-cull`: logic, story, routines, voices, tests), New
(`fork-audit`: audits, never touches `src/`), Three (`fork-inout`: interior plans), Four (`fork-ch1`: characters, hand props,
animals), the town worker (`fork-fx3`: ground, yards, plots), the houses worker (`fork-hx`: exteriors, roofs, Wharfside), the
inspector (`fork-fin`: plan engine, placers, the cameras). They talked through the repository: the coordinator writes
`docs/inbox/<NAME>.md` on `threejs` (newest entry at the top); each session writes `docs/reports/<NAME>.md` on its own branch.

After the reorganisation the roles the plan needs are: **the coordinator** (merges, looks, publishes, talks to the owner);
**the Blender session** (assets); **the engine's owner** (loader, village as data; nobody else edits the engine); **a
reviewer** who looks at every camera frame of a candidate and writes pass or the fault per frame; **one village builder per
village**. The owner assigns sessions to roles.

A report says: what changed, the hash, the gate result, the pictures (paths), what you looked at yourself and what still
looks cheap to you, what could not be verified. A good report names its own faults; the best work of the last days came from
sessions that did.

## 10. Known faults on the live build (so that nobody is surprised)

- The chapel: a stretched spike from the lych-gate post and a timber box hanging off the wall (`docs/owner/b89_chapel_*.png`;
  `game.shot(3, null, -65.6, 270, -3, 13)`). The north gate: a ruler-straight earth patch, a grass rectangle, steps going down
  in front of the passage, pennants (`docs/owner/b89_gate_*.png`).
- Compact houses: the street door looks at the side of a stair (4 of the first ten doors from the gate, 3 more partly).
- 77 of 231 rooms look empty from their own door; 49 rooms have names the furnishing table does not know; 14 door leaves swing
  into the room; 19 rooms are dark by day (`docs/FINISH.md` on `fork-fin`, the room camera table).
- The Cobbler's House (in.44) cannot be reached; Wharf Street ends a metre below the quay; six yard gates have something in
  front of them; the palisade's south-west end may leave a dry way in along the shore.
- A door leaf stays shut for the player until the leave fade; from the street an open door shows a dark panel, not the room.
- Old Wenn has no key for the boat-house doors the texts send you to; the "Hidden Yard" is a name with no place.
- Roofs outside Wharfside may still be blown out pale (a shared material); drying fish are white.
- No animals. Six of 34 audit rules passed on Build 83, eight on Build 88 (`docs/SCORE.md`).
- 245 lines are not recorded; nobody has listened to the 275 newest.

## 11. Decisions made for the owner that he can overrule

A day lasts 40 minutes (was 20). Low quality ceiling 230k triangles and 150 draws (was 200k), since he plays on a MacBook.
The compass reads true directions indoors; the Hart's bricked-up doorway is on the truly east cellar wall. Alley shops' third
storey is a loft by ladder. Thirteen to fifteen year olds have youth bodies at about 1.5 to 1.6 m. No animals until a
realistic model passes (he has since opened the asset sites for that). The hunter lives outside the palisade and walks round
by the gate. The boat in the boat shed is a boat begun on trestles until a whole boat passes at arm's length.

## 12. The older documents: what each is still good for

| File | Still true for | Stale for |
|---|---|---|
| `docs/NEXT.md` | the exact state of every branch at the stop | |
| `docs/log/2026-11-18_coordinator.md` | what happened on the last day, hour by hour | |
| `AGENTS.md` | build, gate steps in full, publishing, the voice pipeline, the owner's feedback build by build | "this file is the whole onboarding": this handbook is |
| `docs/BLUEPRINT.md` | the 34 rules any village must pass (the audit's acceptance test); the base for a village brief | |
| `docs/SCORE.md`, `docs/AUDIT.md` | how Brackenfell scores against them | counts move with each build |
| `docs/TOWNPLAN.md` | why the town is laid out as it is | |
| `docs/PEOPLE.md` | the cast: the source of `54_cast.js` | |
| `docs/ROOMS.md` | what each room should hold: the source of `72n_rooms.js` | room names differ from the plans' (49 rooms unreached) |
| `docs/INOUT.md`, `docs/FINISH.md`, `docs/GEOMETRY.md`, `docs/DEFECTS.md`, `docs/YARDS.md` | open faults by area, with positions | anything marked fixed before Build 86 |
| `docs/STORY.md`, `docs/LOGIC.md`, `docs/audit/POINTERS.md` | the story, where it did not make sense, every text that points at a place | |
| `docs/DECISIONS.md` | what was tried and rejected: read before proposing something "new" | |
| `docs/STATE.md`, `docs/DESIGN.md`, `docs/HISTORY.md`, `ROADMAP.md` | how the engine works by area, the art direction, the build history | "in progress" lists |
| `docs/briefs/*`, `docs/inbox/*`, `docs/reports/*` | what each session was asked and answered | the scope cut of 16:45 on 18 Nov was replaced an hour later by the plan in section 5 |
| `kits/*PROVENANCE.md`, `audio/PROVENANCE.md` | where every asset came from | |

## 13. Starting a session

Paste to a new Claude Code session:

> You are joining Brackenfell. Clone `brendanlymurphy/brackenfell`, check out `threejs`, read `docs/HANDBOOK.md` and
> `docs/NEXT.md`, then tell me in five lines what you understand the state and the next step to be, and wait for my go.

For the Blender session (Claude Desktop on the Mac, Blender open, connector on):

> You are the Blender session for Brackenfell. Clone `brendanlymurphy/brackenfell`, check out `threejs`, read
> `docs/HANDBOOK.md` sections 1 to 4 and 8, then `docs/briefs/AGENT_BLENDER.md` and `docs/inbox/BLENDER.md`. Start with the
> proof of five and show me the first sheet before making the second.

To regenerate `docs/SRC_MAP.md`: list `src/*.js` with each file's line count and the text of its first `//` comment.
