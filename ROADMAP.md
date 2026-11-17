# Brackenfell roadmap

New here? Read `AGENTS.md` first. Target look: a dense timber town on a misty lake (Skyrim's Riften), crowded lanes, warm cluttered
interiors lit by hearths and candles. As realistic as free art allows.

## Done (what each published build added)

- **5** New engine: Three.js r187 (WebGPU, WebGL 2 fallback), animated villagers, sky, mist, grass. Old build kept at `classic/`.
- **6 to 9** Buildings from the Quaternius village kit with a scanned-texture skin; sprint, stamina, sword combat, outlaw camps, loot,
  inventory, three quests; photo-scanned props; first performance and memory pass.
- **10 to 16** Realistic (MakeHuman) villagers; a market alley; stairs and real upper floors; interior detail; triangle diet and
  level of detail; performance overlay.
- **17** Compact timber town: 25 infill houses, plank walls, shingle roofs, boardwalks.
- **18** Sound engine: ambience by place and hour, footsteps by surface, room acoustics. All synthesised.
- **19** Interiors are separate "cells" entered through doors with a fade.
- **20, 22** Spoken dialogue for every line (Kokoro, generated offline) and villager barks; sparse adaptive music.
- **21** Roof pass: no black slopes, roof thickness, chimneys through roofs.
- **23, 24** The wilds: twelve places outside the village, thirteen footpaths, two quests, people at work, wildlife particles.
- **25** Planned interiors for the inn (common room, kitchen, cellar, guest rooms, seven regulars) and chapel (crypt, key quest).
- **26** Speech dry; open-air echo removed; no discovery jingle; dialogue as white subtitles; buildings no longer glow at night.
- **27** Voices regenerated with the full-precision model, no pitch-shifting, blended voices for variety.
- **28** Loading screen with real progress, offline cache (service worker, page fetched network-first), Add to Home Screen, touch
  tuning, interact highlight, map, journal, settings pages, camera feel, dawn opening; indoor flicker fixes (coplanar faces, cells
  moved near the origin, tighter depth range); inn regulars made distinct, one person per spot, hand props (lute, hammer, spears, mugs).

- **29 to 31** Denser inn and chapel; dense town (128 infill houses in lanes); fork-look: first-person sword, night windows and
  glows, scanned trees, one wind, weather.
- **32 to 35** Two real lights per room; QA sweep and `docs/DEFECTS.md`; wilds fixes; interior windows with sky and lattice;
  village defect fixes (clear door approaches, forecourts, plank doors, nets, plank wall variation).
- **36** Gemini voices for the conversation lines of 13 characters; old-engine audio removed.
- **37 to 39** Store, elder's hall and smithy from designed plans; solid stair undersides; Rowan's Terrace (upper ward, 3.4 m above
  the square).
- **40 to 43** Guardhouse and herbalist; warm minimum light indoors at night; the Wharf (stone quay, landing, boardwalk); six house
  layout families, six alley shops enterable.
- **44** The Hart's gallery, Hawker's Passage, roofed bridge, palisade wall walks with two gate towers, the Watch Bell tower, three
  distinct lanes.
- **45** Main story "The Quiet Under Brackenfell" (docs/STORY.md), Act 1 to the mine door; the interaction layer (src/82b_interact.js:
  containers, loose things, letters, theft and the cell, locks, seats, stew and a rented bed).
- **46 to 47** 36 enterable infill houses with their own finishes and one memorable object each; the square's ground and wall detail.
- **48** The Old Mine (src/94_mine.js: delvers, lurkers, the Foreman, lantern and oil, Silverthread, a second exit); weaver, draper,
  mill, hunter, fisher and farm interiors; kits/dungeon.glb.
- **49** fork-perf merged (dynamic kit batches with distance, view-cone and occlusion culling; character weights by distance;
  meshopt-compressed packs; small texture packs; mouths, eyes, dyed clothes): square 311 / 696k to 201 / 430k on medium. Market
  cross, pillory, open forge, faded awnings, limewashed bell tower.
- **50** Districts told apart by roofs; tall and low cottages, narrow shops, muted dyes, smaller scan pack.
- **51** Nine town secrets (src/82c_secrets.js); brighter mine with an oil gauge.

- **52** Shops with buy and sell, weapon and armour tiers, perks, the notice board, rumours (src/94b_economy.js).
- **53** People at home and at work (56 residents in 42 houses), L-shaped workshops, scanned furniture variety.
- **54** Contact shadows on the ground, window light indoors with floor pools, blob shadows under people, colour grade by hour.
- **55** Acts 2 and 3 of the story: the smugglers' tunnel, the Bread Cave, Rowan's telling, two endings (src/94d_act2.js).
- **56** Gemini voices for 167 of 172 lines; no Kokoro audio remains.
- **57** Rooms with dark corners and ceilings, shadows under furniture, window light pools and soft shafts, lamp pools at night.
- **58** Clean-up batch 1: real door leaves, wharf doors, muted awnings, lamp glass glows at night only, stray colliders removed.
- **59** Lighting pass 3 (coloured light from stained glass, contact bands, low mist at dawn and dusk, wet cobbles at the wharf);
  stall goods; secrets' props; scanned rock in the mine.
- **60-62** Gemini voices live for 171 of 172 original lines; real lip sync (19 face morphs, cue tracks per recording); a crash
  in `Snd.now()` without an audio context fixed (62).
- **63-66** Clean-up: outdoor overlaps (severe 37 to 5), measured placement indoors (617 overlaps to 3), pictures as varnished
  panels, wardrobe parts, per-person girth and height.
- **67** A real child in a smock, kirtles for five women; interiors batch; first build published by GitHub Actions.
- **68** (not published by itself) Play-bot bug fixes: crypt gate after a reload, saves load where made, progress kept between
  save points, dialogue options fit a phone, 44 px touch targets; built files untracked.
- **69** Build 68 plus: loot taken wherever it fell, long fights robust, "Copy performance report" in Settings, lighting round two
  (shade floors, cloth keeps its dye, palisade glare gone), interiors (oak tints, muted cloaks). The offline test now waits for
  the service worker in the page (it had failed on GitHub while the game itself was fine).
- **70** Speed: medium 216 draws / 433k triangles in the square to 157 / 292k, low 170 / 225k to 125 / 195k, same pictures. Prompts
  are not offered through walls or for things behind the player; the walk bot. Interiors: garlic strings, dressed cellars, muted
  chapel cloth, rugs and hooks apart. The mine: cut rock walls, earth floor, torches that light their surroundings, visible water.
- **71** A reload in the cell no longer locks the player in; broken saves are mended or refused. Phone interface pass at 844 x 390
  (map shows you and quest marks indoors, one button style, smaller quest banner). Phones take the half-resolution ground pack by
  default (first visit 61.0 to 40.4 MB). Culling: squares refilled only when one in sight is missing; `test/cullwalk.js`.
- **72** The Market Place rebuilt to `docs/TOWNPLAN.md`: an enclosed four-sided place with cobbles wall to wall, a drain, worn and
  dirty ground; the west main street, the Wharf Street mouth and the alley as streets with rows on the line and party walls; the
  terrace held by a battered rubble wall with buttresses and a flight; the market's stalls in two rows; 15 walled or fenced yards
  dressed by trade with back lanes; three houses turned gable to the street. Houses: roofs from Poly Haven CC0 scans by district
  (every roof had been one shingle texture), per-house pitch, sag and eaves; the inn's cross gable and dormers; jetties; dark
  lattice windows in four designs; proud timber framing, sills, lintels, plinths; six weathered door finishes; the inn's working
  back. Budget re-accepted for the district (medium terrace 154 / 238k, lake 138 / 255k; low square 128 / 215k, terrace 127 / 170k).
  With it (fork-logic): story logic first pass, a day of their own for every resident, mechanics made honest (docs/LOGIC.md), all
  252 lines voiced with lip tracks, walkers that see ledges, the culling flicker fix. The villagers' road graph joins each road end
  to its nearest neighbour (the north road had come loose from the place and people walked 500 m round by the hills).
- **73** Chapelgate to the town plan: Chapel Street paved front to front with five broad steps beside a cart ramp, walled yards on
  both sides, the east cluster on a wandering cobbled lane to a well with yards behind both rows, the churchyard behind a coped
  rubble wall with a roofed lych gate, a hedged way from the gate (shrub clumps on a bank), the palisade weathered. Market Place:
  the north entry opened (2.8 m ginnel, lean-to sheds on the blank backs), stalls moved off the fixed cameras, the store's plot,
  yards made rougher and each different. Culling: each roofline owns its numbers (cullwalk was intermittent). Both gate arches
  walkable. Accepted: overlap solid 17 (a hamlet wall), low alley 155 draws, low lake 206k.
- **74** Swimming: deep water no longer freezes the player (they float with the head out and swim to a shore). The shore west of
  the wharf is dry land: the lake's sheet had covered the fisher's hut and its path.
- **75** The terrace retaining walls are closed solids with end caps and the rubble at true scale (it was drawn three times too
  large; the owner's screenshot), the corner landing in the same stone. Chapelgate: the way carried to the lych gate, yews as
  dark rounded masses. Westgate, first slice: a hedged earth lane to the gate with sheep and pig closes and ruts.

- **60, 61** Real lip sync (visemes from the audio of every voiced line), natural skin and eyes, gaze, fitted helmet and kerchiefs.
- **62** One gate command, the gate on GitHub for every push, onboarding docs rewritten, seven new voiced story lines.
- **63 to 66** Wardrobe pass (layered clothes, fitted hats, hair off the eyes); interiors batches; pictures as varnished panels.
- **67** A real child in a smock, kirtles for five women; interiors batches 3 and 4.
- **68** Bugs found by playing (`test/playbot.mjs`, `docs/BUGS.md`): the crypt gate after a reload, saves loaded where they were
  made, autosave, long dialogue and touch targets on a phone, the night meeting. Built files are no longer in the repository:
  GitHub builds and publishes main and checks the live page.

## In progress (branch, owner)

- `fork-cull` (second Claude Code session): culling made the same on every machine (in Build 73); gate steps `town` (streets, gates, detours, standing
  points, swimming out of the lake) and `water`; every yard has someone working in it; Low tier under 200k triangles in all four views (ground cut
  into 32 m squares measured by their real tops, light copies of the stall props, the middle ring of hills at half detail: pictures in docs/low/);
  `docs/GEOMETRY.md` lists stretched textures, open edges and single-quad walls by position for the town workers. Open: the alley on Low is 148
  draw calls against 140; the western stream in the wilds is drawn but is dry ground to the game; a fence rail down the back lane behind the passage.

- **Walking, speed, loose ends** (`fork-play`, the second Claude Code session). Notes, newest last:
  - The play bot's soak no longer fails on sounds (an artifact of stepping time); long fights and looting are robust.
  - Walk bot (`test/walkbot.mjs`): 19 km by input through every street, all 57 interiors (115 door uses), the routes, the wilds
    paths, the mine. `docs/WALK.md` is its report. Fixed from it: prompts through walls (88 places), prompts for things beside or
    behind the player (867), the bed-and-chest prompt (bug 8).
  - Speed: Settings has "Copy performance report" (30 s of frame times, draw calls, device, build). Medium went from 216 draws /
    433k triangles in the square to 157 / 292k and Low from 170 / 225k to 125 / 195k with the pictures unchanged (ferns and stones
    given a draw distance; doors and signs outside the view skipped; terrain cut into squares; terrain and props under the
    roofline skipped).
  - Phones take the half-resolution ground pack by default: first visit 40.4 MB instead of 61.0 (docs/DECISIONS.md has the numbers).
  - Loose ends: a reload in the cell no longer locks the player in; broken saves are mended or refused; the map shows you and the
    quest marks when you are indoors; one pill style for buttons; the quest banner is smaller, shorter and clear of the clock.
- FREEZE (owner, Build 69): nothing new; make what exists right, to `docs/TOWNPLAN.md` (the authority outdoors). One district
  finished at a time, Market Place first. Two workers on the town (the machine restarts under three):
  - `fork-fx3` the planner: the Market Place as an enclosed four-sided room, buildings re-sited onto street lines, the terrace
    wall and the four entries, ground, plots, the market's stalls; then the next district.
  - `fork-hx` house exteriors: `test/houses_survey.js` (13 visible types across 58 at Build 69); roofs by district (every roof was
    one shingle texture), then fronts designed one by one. The mine's remaining rooms (`fork-fx2`) wait behind it.
  - `fork-ch1` characters: paused until a town worker frees up (apron glitch, aprons varied, men's tunics, posture, hair).
  - Logic, storylines, what people do, mechanics: asked of the second Claude Code session (`fork-logic`, docs/LOGIC.md). First pass done on `fork-logic`: 13 story faults, 8 routine faults and 9 rule faults fixed, each with a check (bot `logic`, gate step `people`); what is open and why is listed per part in docs/LOGIC.md (beds for Tobin and Aldous need the interiors worker).
  - Voices: all 252 planned lines (168 of conversation, 84 barks) have a recording and a lip track as of `fork-logic` (29 minutes, 12.9 MB, fetched a line at a time). No daily batch is scheduled any more; new lines need one run of the commands in AGENTS.md.

## Next

The audit's sixteen recommendations (docs/AUDIT.md Part C), all accepted at Build 75, with owners:

| # | What | Owner |
|---|---|---|
| 1, 2 | Delete the 28 shells whose doors face a wall; every remaining dead door answers or goes; Wharfside keeps at most 10 shells as honest working buildings | town workers, by district |
| 4 | One table of buildings and households written by hand (about 60 people in households of 2 to 4, 57 buildings, names, trades, relations): `docs/PEOPLE.md` | logic session, reviewed by the coordinator |
| 3, 5, 6, 7 | Lines for every person (hide the talk prompt until they have them), real days, ten exchanges between villagers, houses owned and barred at night | logic session, after the table |
| 8 | Interiors fitted to shells: one list of openings, ground floor within 1.25 of the footprint, storeys equal; the six alley shops first | houses worker, after Wharfside |
| 9 | An edge from the river round to the lake with the west and north gates | planner |
| 10, 13 | Roofs by district that read as different from above; signs and trade gear on every shop | houses worker |
| 11 | About 40 trees with reasons; two thirds of the flower pots and half the vines removed | town workers and the inspector |
| 12, 14 | The story lands (mine's direction, the dead man carried to the chapel, a visible change per main step); containers cut to a third | logic session |
| 15 | Plots for every kept building | town workers |
| 16 | The blueprint's [auto] rules as gate steps | logic session |

## Known problems

- Frame rate on the iPhone has never been measured; the owner said "not fast enough" at Build 13. No test can see it.
- Over the performance target since Build 52: medium square 216 draw calls / 452k triangles and alley 224 / 452k (target 220 /
  380k); low square 170 / 246k, alley 181 / 269k (target 140 / 200k).
- First load: 40 MB on a phone, 61 MB on a tablet or laptop on Medium, 73 MB on a desktop on High.
- 70 spoken lines have no audio yet (subtitles only) until the daily batches finish; remarks anyone may say (`*`), the notice board
  and the slab are subtitles by design. Text with prices or counts in it cannot be recorded.
- Feet still slide 0.25 m/s in the walk clip. Mouths open by loudness only until `fork-ch1` merges.
- Sound effects are synthesised and can read as artificial; nobody on the team can listen. Flicker and z-fighting in motion can
  only be seen on a real GPU: `docs/DEFECTS.md` lists what the owner or a QA sweep reported.
