# Finishing pass (fork-fx1): what the eye-height tour found

Tool: `node test/tour.mjs` (views in `test/tour_views.js`; pictures and contact sheets in /home/claude/shots/fx1/tour/<run>/). Rows are sorted by how badly they break the picture. [x] fixed, [ ] open, [-] left on purpose (reason given). Shot names are file names in the run directory (`name_hour`).

## A. Breaks the picture (holes, black, missing, floating)

- [ ] A1 Terrace embankment and ramp lane are bare dirt against the stone wall, a stone wedge floats in the slope (south.11b, south.1f, south.31b, sq180, sq225)
- [ ] A2 Wharf boat-house doors are not drawn: only their black straps float on the quay wall (pl.wharf.0)
- [ ] A3 Gate leaves and gate-tower insides read black by day (pl.bridgegate.180, pl.chapelgate.180, pl.tower.180, pl.passage.180)
- [ ] A4 Black slab between a house and the palisade (hunter.1f)
- [ ] A5 Beams stand out of the water across the view at the mill bridge (mill.11b)
- [ ] A6 A vertical triangle of board stands in the lake under the jetty (pl.lake.180)
- [ ] A7 Colliders registered at the world origin by origin-built props (two remain near the bonfire; see src/99_main.js warning)
- [ ] A8 Crates near the camera vanish in the alley on Low (`game.shot(30,null,-2,250,2,17.6)`)

## B. Cartoon leftovers

- [ ] B1 Stall goods: identical white jugs, green balls for cabbages (sq135, sq180)
- [ ] B2 Big white cauldron by the square (sq0, sq270, sq315), hay cart load is a green ball (sq270)
- [ ] B3 Bright flat red gate banners (pl.gate.0)
- [ ] B4 Square white lantern boxes, flat white notice paper (pl.dist.poor.180, pl.hartgallery.0)
- [ ] B5 Dark box crates with flat X panels (sq0, sq315)

## C. Scale and texture

- [ ] C1 Plank wall texture is magnified and blurred at 3 m (pl.dist.cottages.0, pl.dist.cottages.180)
- [ ] C2 Terrace stone is a different brick scale from its neighbours (north.51b)
- [ ] C3 Window panes are flat sky blue and do not fill the frame (pl.dist.dyers.0, pl.dist.cottages.0)
- [ ] C4 Herringbone stone ramp at giant scale at the Wharf corner (south.71b)

## D. Not done / reported to others

- Lamp glow discs float large at night on the Wharf wall (pl.wharf.0_21): lighting worker.

## Round 1 status (fx1)
Fixed: A2 door leaves (new oak leaf), A7 wharf boat-house door planks drawn, B2 hay cart load, B3 gate banners, awnings weathered, outdoor lamp glass glows at night only, 12 muted pictures instead of one landscape, lvLift covers planks/timber, origin colliders (lumber fire pit stray pop, secProp/wPickMesh guards, boot assertion, push/pop warnings).
Mine tour (r1/mine.*, lantern off): walls are the gravel-heap texture with large flat facets (flood, rampA, niche); not yet faced with scanned rock_face. Open, medium.
Fixed A8: alley-dress group (crates, barrels with colliders) was hidden on Low (src/71_kithouse.js alley visibility); now shown within 28 m.
Still open: terrace embankment bare dirt, low-quality alley crates (A8), stall goods, secrets as dark boxes, drowned man, herb racks, plank wall scale, window panes, bell tower coplanar (U112), mill beams, hunter black slab.
