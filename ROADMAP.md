# Brackenfell roadmap

Target look, from the reference images in the project chat: a dense timber village on a misty lake, a crowded market
alley of shop fronts, and warm cluttered interiors lit by hearths and candles. As realistic as free art allows:
simple shapes, photographed textures, muted colours, mist and firelight.

## Done

- **Build 5** New engine: Three.js r187 (WebGPU, automatic WebGL 2 fallback), animated glTF villagers, overcast sky with mist, meadow grass, close-range fire. Old build kept at `classic/`.
- **Build 6** Twelve of thirteen buildings rebuilt from the Quaternius village kit with a scanned-texture skin; interiors furnished and lit by torches, candles and chandeliers.
- **Build 7** Sprint, jump, stamina, health, sword combat (chain, heavy, block, dodge), two outlaw camps with leaders, loot, inventory, trading with the smith, three quests, death and respawn.
- **Build 8** Fifty photo-scanned Poly Haven props replace painted ones; scanned rocks, stumps and ferns.
- **Build 9** Performance and memory pass: about half the draw calls, textures capped and shared on phones.

## In progress

- [ ] Realistic villagers and outlaws (MakeHuman-generated, CC0) merged with the performance path: `fork-h`
- [ ] Village polish: muted roofs, inn dormers, chapel windows, scanned-furniture tints; a market alley on the east road; denser interiors and yards: `fork-v`

## Next

- [ ] Texture compression for kits, props and characters (KTX2 / Basis, transcoded to ASTC on phones): cuts GPU memory several times over and shortens the first load (about 55 MB today)
- [ ] Triangle budget: lower-detail far versions of houses and villagers, grass and terrain tuning (square is about 700k triangles on medium)
- [ ] Realistic trees: scanned conifers with level-of-detail stand-ins; the generated trees are now the least realistic thing outdoors
- [ ] A dungeon under the watchtower (trapdoor, three rooms, a lever gate, a boss, a chest)
- [ ] Props in villagers' hands (hammer, lute, mug, broom), better eyes and hair on the realistic set, more outfit variety
- [ ] Villagers path around furniture indoors; villagers visit the market alley by day
- [ ] Jettied upper storeys and proper shop signs; thatch on the poorer cottages
- [ ] Wolves or boar in the forest; a second, harder camp across the river
- [ ] Shield bash and parry; bow and arrows
- [ ] Weather: rain, wet ground, lake mist at dawn; seasons
- [ ] Music and more ambient sound; footsteps by surface
- [ ] Save slots; a map

## Known problems

- Never run on a real iPhone since Build 4. Frame rate, memory and touch feel are all unverified.
- First load is large (about 55 MB).
- Combat difficulty and feel were tuned by scripted input only.
- Wall panels stretch on odd wall lengths; villagers walk through some furniture.
