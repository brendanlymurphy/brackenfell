# Brackenfell: direction

The bible for anyone adding to the game. If a change does not serve one of the pillars, it waits.

## Pillars

1. **A place, not a level.** A northern timber town in a misty valley that feels lived in when the player is not looking. Everything has a reason to be where it is.
2. **Go anywhere, open everything.** Every door leads somewhere, every cellar has something in it, every path ends at a place.
3. **Mood over polygons.** Realism comes from light, weather, sound and wear, not from detail the phone cannot afford.
4. **It must run in a phone browser.** Budgets are part of the design (docs/STATE.md).

## Art direction

**Reference frame:** Skyrim's Riften and Whiterun, an alpine lake village, firelit timber halls. Reference images are in /home/claude/refs (outside the repo).

**Value and colour**
- Three reads at any distance: dark timber and roofs, mid ground, light sky. Plaster and snow are the only near-whites; never a pure white or a saturated primary on a large surface.
- Palette by time: dawn cool blue-grey with warm rim; noon neutral and slightly desaturated; dusk amber key with violet shadow; night deep blue with small islands of orange light. Interiors are always warmer than outdoors.
- Colour is spent on small things: pennants, a red door, autumn birch, flowers, cloth on a stall. Large surfaces stay earth and stone.
- Distance fades to the sky colour (atmospheric perspective); mist gathers low at dawn and dusk.

**Shape**
- Silhouette first: steep roofs of varied pitch and height, chimneys, gables, jetties, a tower or spire visible from every approach. No two neighbours the same height.
- Nothing on a visible grid. Rotate, offset, lean, vary scale by a few percent. Fences sag, signs hang off-true.
- Roofs must be judged from above as well as from the street.

**Surface**
- Everything is weathered: grime where walls meet ground, soot above fire, moss on north faces and stone bases, wear on paths and thresholds, darker wood where hands and rain reach.
- Ground is never one texture: paths, mud, leaf drifts, straw, puddles, weeds at edges.
- Scanned textures and props first; hand-painted kit art only under the scanned-texture skin.

**Light**
- One sun, and many small fires. Night scenes are composed with pools of light the player walks between.
- Windows glow at night; by day they are dark from outside and bright from inside.
- Shadows anchor objects: contact darkening under and around everything.

**Motion**
- One wind drives everything: grass, leaves, smoke, pennants, laundry, hanging signs, water ripples. Gusts travel across the valley.
- Something is always moving in frame: smoke, birds, a banner, a person.

**People**
- Normal proportions, plain clothes, muted colours. They carry what their work needs. They look at the player when spoken to and get on with their day when not.

## Sound direction

- Sound tells the player where they are with eyes closed: river, lake lapping, wind in pines, the forge, the inn's murmur, the chapel bell on the hour.
- Layers: a bed (wind, air), locals (river, fire, crowd, animals) positioned in the world, and one-shots (door, bell, bird, footstep). Day and night have different casts.
- Footsteps change with the surface: cobbles, planks, grass, mud, stone floor, wooden floor, stairs.
- Indoors is close and dry with the outside muffled; cellars and crypts ring. Music is sparse and stops for silence.

## Feel

- The first two minutes: arrive on the road at dawn, see the town below with smoke rising, walk in, be greeted, be given a reason to enter a building.
- Every interaction answers: a highlight on what can be used, a sound, a small motion, a line of text.
- Discovery is rewarded: a name on screen, a mark on the map, something to take.
- The interface is parchment and ink, quiet, and gets out of the way while walking.
- On a phone: thumbs never cover what matters, nothing needs a precise tap, the game survives being put in a pocket (pause, save, resume).

## Systems, in the order they add life

1. Time and weather change behaviour: lamps lit at dusk, shops shut, people go in from rain, the inn fills in the evening.
2. Villagers talk to each other, greet by time of day, react to a drawn weapon or a theft.
3. Things to make: cooking at a hearth, potions at the herbalist's bench, sharpening at the forge.
4. Skills that grow with use; a few perks.
5. Property and crime: owned items, locked doors, guards, fines.
6. A main thread: what lies under the chapel and the tower, told through notes, places and people.

## Craft rules for workers

- Look at your screenshots next to the references before reporting. From above and from eye height.
- Measure cost with `game.shot` and stay in budget; cheap detail (decals, shading, particles, sound) before meshes.
- Never block a door or a road. Run the door and stair tests.
- Record the source and licence of every asset. CC0 only.
