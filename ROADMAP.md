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

## In progress (branch, owner)

- **Adventure** (`fork-q1`): shops with buy and sell, weapon and armour tiers, perks, bounty board, rumours; wilds places on existing
  ground (bandit camp, barrow, wreck, shrine); Acts 2 and 3 with two endings. New spoken lines are listed in docs/NEWLINES.md and
  are subtitles-only until voiced.
- **Interiors** (`fork-c5`): remaining room shapes (steps down, see-through passage, gallery hall, L-shaped workshop), scanned
  furniture across all houses, people at home and at work.
- **Lighting** (`fork-l1`): baked corner and contact darkening, window light and fire pools, mist and grade, materials, night. Must not
  cost frame time (budget: square 210 draws / 440k triangles medium, 160 / 235k low).
- **Voices** (`fork-voice`, the other Claude Code session): 92 of 172 Gemini lines still to generate (100 requests a day); nothing new
  pushed as of Build 51.
- Rules that cost us tonight: never edit the text of an existing spoken line (voice files are keyed by speaker + exact text); after
  changing any GLB under kits/ run `node tools/assets_pack.mjs --only kits`; one headless browser at a time on the shared machine;
  never `git stash` (shared across worktrees).

## Next

- Lighting and weather as composition: pools of light at night, shafts through windows, eye adaptation at doors, rain and wet ground.
- One wind driving grass, smoke, pennants, laundry, signs.
- A world that reacts: lamps lit at dusk, people in from rain, villagers talking to each other, reactions to a drawn weapon or theft.
- Cooking, potions, sharpening; skills that grow with use; property and crime.
- Realistic trees (scanned conifers with stand-ins): the generated trees are the least realistic thing outdoors.
- Texture compression for kits, props and characters (KTX2 to ASTC): shorter first load (about 60 MB today) and less GPU memory.
- Better faces, eyes and hair on the realistic character set; more outfits.
- A more expressive voice model for main characters if Kokoro still reads as flat (candidates: Chatterbox, MIT).
- Animals with bodies (deer, sheep, dogs) from a CC0 pack that sits beside realistic villagers.
- First-person weapon and hand models (the sword is a grey prism and the hand a block).

## Known problems

- Frame rate on the iPhone has never been measured; the owner said "not fast enough" at Build 13. Village views are about 350 draw
  calls and 550k triangles on medium; the budget is 300 and 450k.
- Indoors: flicker reported on walls, corners and windows on a real GPU. Old interiors (every building except inn and chapel) are
  jumbled; the generic planned interior is one layout and is not shipped.
- Fisher's cabin: boardwalk floats over land, rails cross each other.
- Village is flat with open grass between rows.
- Sound effects are synthesised and can read as artificial; nobody on the team can listen.
- Window panes blow out to white at night; lamp and firefly glows have no size clamp near the camera.
- First load is large. No save slots.
