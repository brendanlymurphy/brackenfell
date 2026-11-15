# Brackenfell roadmap

Target look, from the reference images: a dense timber village on a misty lake, a crowded market alley of shop fronts,
and warm cluttered interiors lit by hearths and candles. Realistic in mood, hand-painted in texture, because the
free art that exists at this quality is stylized (Quaternius kits, CC0).

## Build 5: new engine (in progress)

- [ ] Three.js renderer (WebGPU, WebGL 2 fallback) replacing the hand-written one: `fork-a`
- [ ] Sky, grass, water, particles as modules: `fork-c`
- [ ] Animated glTF characters with normal proportions (Quaternius base characters, fantasy outfits, animation library): `fork-b`
- [ ] Kit pipeline: village, props and nature kits packed for the web, with a loader that batches pieces: `fork-d`
- [ ] Merge, check on both backends, publish to `main` (GitHub Pages)

## Build 6: the village rebuilt from kits

- [ ] Building assembler: footprint on a 2 m grid, storeys of 3 m, timber or stone walls, doors, windows, shutters, roofs, chimneys, balconies, overhangs
- [ ] Every existing site rebuilt with it (inn, smithy, mill, chapel, cottages, barn, tower), keeping doors, quests and schedules working
- [ ] Interiors furnished from the props kit: beds, tables, bookcases, barrels, chandeliers, candles, each candle a real light
- [ ] A market alley: two rows of tall shop fronts, stalls, banners, hanging signs, lanterns
- [ ] Kit trees, rocks, ferns and flowers replace the generated ones
- [ ] Village clutter pass: fences, wagons, crates, vines on walls

## Build 7: things to do

- [ ] Sprint, jump, stamina
- [ ] Sword and shield: attack chain, block, dodge, hit reactions
- [ ] Enemies outside the village (wolves or bandits first), health, death, respawn
- [ ] Loot, inventory, equipment, a shop that sells something useful
- [ ] A dungeon under the tower built from the dungeon kit, with a boss and a reward
- [ ] More quests that use all of the above

## Later

- Weather (overcast, rain, mist over the lake), seasons
- More villagers with routines, a festival night
- Music
- Save slots
- Compressed (KTX2) textures for the kits, level-of-detail for distant buildings
