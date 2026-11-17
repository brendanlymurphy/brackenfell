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

- **60, 61** Real lip sync (visemes from the audio of every voiced line), natural skin and eyes, gaze, fitted helmet and kerchiefs.
- **62** One gate command, the gate on GitHub for every push, onboarding docs rewritten, seven new voiced story lines.
- **63 to 66** Wardrobe pass (layered clothes, fitted hats, hair off the eyes); interiors batches; pictures as varnished panels.
- **67** A real child in a smock, kirtles for five women; interiors batches 3 and 4.
- **68** Bugs found by playing (`test/playbot.mjs`, `docs/BUGS.md`): the crypt gate after a reload, saves loaded where they were
  made, autosave, long dialogue and touch targets on a phone, the night meeting. Built files are no longer in the repository:
  GitHub builds and publishes main and checks the live page.

## In progress (branch, owner)

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
- Other worker branches (`fork-fx1` outdoors overlap, `fork-fx2` interiors, `fork-ch1` characters, `fork-l1` lighting) are named in
  the coordinator's briefs; when one merges, its line goes to Done.

## Next

- Rain and wet ground as weather everywhere (the wharf has wet cobbles); eye adaptation at doors.
- A world that reacts: lamps lit at dusk, people in from rain, villagers talking to each other, reactions to a drawn weapon.
- Cooking, potions, sharpening; skills that grow with use; property.
- KTX2 / ASTC textures for kits, props and characters: shorter first load (60 MB on a phone today) and less GPU memory.
- New faces, hair and garments (needs the Blender / MakeHuman pipeline in `tools/humans`, not set up on any build machine).
- Animals with bodies (deer, sheep, dogs) from a CC0 pack that sits beside realistic villagers.
- Save slots.

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
