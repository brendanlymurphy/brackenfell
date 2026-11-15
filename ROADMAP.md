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

## In progress (branch, owner)

- **Town with levels** (`fork-v2`): cost first; then an upper ward on a terrace, a lower quay level, alleys and covered passages,
  galleries and wall walks, the fisher's corner rebuilt; then every house enterable, civic buildings, gatehouses, harbour, back yards.
- **Interiors** (`fork-c2`): flicker on walls, corners and windows indoors (suspect: cells built 3000 m from the origin, coincident
  faces); duplicated and overlapping inn regulars; instruments and hand props; much denser dressing for inn and chapel; then designed
  plans by trade (store, smithy, elder's hall, guardhouse and others), layout families for ordinary houses, cellars, a smugglers'
  tunnel and cave, the watchtower dungeon, the Old Mine, people at home.
- **Outdoor look** (`fork-look`, a separate Claude Code session): first-person sword and hand, night windows and glows, scanned
  trees, one wind, weather. It pushes its branch only; the coordinating session merges.
- **Defect hunt** (`fork-qa`): scripted walk of every place at four hours, coplanar-face audit outdoors, floating and sunk objects,
  character problems; fixes in unowned files, reports for the rest.

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
