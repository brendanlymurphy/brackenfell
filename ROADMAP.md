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

## In progress (branch, owner)

- **Bugs by playing** (`fork-bugs`, the second Claude Code session): `test/playbot.mjs` plays by input and `docs/BUGS.md` lists what
  breaks. Notes, newest last:
  - Item 0: the four built files are no longer tracked; GitHub builds and publishes main (`pages` workflow) and then checks the
    live page serves that build. A push during a gate run now waits instead of cancelling it.
  - Item 1: seven bugs fixed (a gate shut again after a reload blocked the story; saves loaded a kilometre away; unsaved progress;
    long dialogue off a phone screen; small touch targets; the ledger opening over other windows; the night meeting in sight of
    Garrick's camp). The bot's scenarios are steps of the gate.
  - Items 2 and 3: phone fit, rotation, hide and resume, sound after the first tap, offline start, and a 30-minute soak are bot
    scenarios; nothing leaks and nobody gets stuck in the soak as measured.
  - Item 4: 178 of 248 lines have audio and lip tracks; the rest come from the daily batch (08:20 UTC).
- `fork-play` (the second Claude Code session): walk bot (`docs/WALK.md`), performance round 2, prompts not offered through walls,
  daily voice batches.
- FREEZE (owner, Build 69): nothing new; make what exists right. Three workers:
  - `fork-fx3` ground and levels: real ground (fall, crowned streets, earth, mud, grass, wear paths), every terrace, platform,
    deck and wall walk rebuilt into the terrain or removed, the town wall given age and variety; then the outdoor overlap list.
  - `fork-hx` house exteriors: sameness measured by script, then structure, roofs, add-ons, placement and wear varied by district
    and wealth (no two neighbours alike). The mine's look (`fork-fx2`: rock walls, torch pools, flood water) waits behind it.
  - `fork-ch1` characters: apron glitch, aprons varied, men's tunics shown, posture, hair and beards; no two people alike.
  - Logic, storylines, what people do, mechanics: asked of the second Claude Code session (`fork-logic`, docs/LOGIC.md).

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
- First load: 60 MB on a phone (Medium), 39 MB on Low, 72 MB on a desktop on High.
- 70 spoken lines have no audio yet (subtitles only) until the daily batches finish; remarks anyone may say (`*`), the notice board
  and the slab are subtitles by design. Text with prices or counts in it cannot be recorded.
- Feet still slide 0.25 m/s in the walk clip. Mouths open by loudness only until `fork-ch1` merges.
- Sound effects are synthesised and can read as artificial; nobody on the team can listen. Flicker and z-fighting in motion can
  only be seen on a real GPU: `docs/DEFECTS.md` lists what the owner or a QA sweep reported.
