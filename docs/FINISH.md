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

## Style sheet (canonical materials; outliers are brought to these by rule)
| Material | Tone (albedo, linear) | Scale | Notes |
|---|---|---|---|
| Stone (rubble walls, plinths) | 0.45 to 0.6, neutral grey, no saturation | blocks 0.25 to 0.4 m (MAT.STONE tile 0.7) | shade faces lifted by lvLift so they never go black |
| Timber framing | COL.timberDark 0.12 to 0.2 brown | posts 0.12 to 0.2 m | cbox with chamfer; never pure black |
| Plank cladding | 0.30 to 0.45 warm brown, grain visible | boards 0.18 to 0.22 m | one tile scale per wall |
| Plaster / limewash | 0.65 to 0.8 warm off-white | n/a | stained near the foot |
| Roof | thatch or shingle, 0.3 to 0.45 | n/a | one material per roof |
| Cloth (awnings, banners, bunting, canopies) | dull madder 0.34/0.18/0.15, woad 0.17/0.21/0.3, weld 0.4/0.3/0.16, walnut, undyed 0.42; stalls and awnings go through the kit cloth material, which brightens about 1.6x: feed 0.34 to 0.66 of the table value | stripes 0.3 m | no pastel, no mint, no candy stripes |
| Iron | 0.2 to 0.3 dark, straps catch light at 0.42 on door leaves | straps 0.04 m | |
| Earthenware | 0.5/0.33/0.22 brown glaze, scanned pots tinted 0.7/0.46/0.31 at gain 0.5 | 0.2 to 0.3 m | never white |

Rules added so far: origin-collider guards (secProp, wPickMesh) and boot assertion; push/pop balance warnings; door leaf is one shared oak leaf; street barrels use the painted 654-triangle barrel, scanned ones indoors only; awning, canopy and bunting colours go through desaturation and a 0.4 to 0.66 scale; lantern glass albedo is halved and its glow doubled, outdoor glow is off by day.

## Overlap finder (test/overlap.js)
`node test/shot.mjs --opt webgl=1 --opt quality=low --do "window.__ovTop=60; $(cat test/overlap.js)"` ranks solid x solid intersections (walls meeting walls excluded), door approaches blocked by a low solid, spots and stairs inside solids, each with a shot call. Baseline at Build 59 + fx1: 325 solids, 0 blocked doors, 18 spots. Most solid hits are stall and rock circles against house boxes (conservative circles); the spots are counters and fires whose spot lies in the counter's own collider.
Open from the second tour (t2): hunter.1f black slab is a pine trunk in shade (lighting: tree bark in shade), wall lamps still pale by day, tower door view faces a blank wall, bunting flags read white.

## INTERIORS (fx2)

Style sheet (interiors). Scale reference: a person is 1.75 m. Door 0.95 x 2.0 m, table top 0.76 m, chair seat 0.45 m, bed 0.9-1.1 x 2.0 m, counter 1.0 m, hearth opening 0.9-1.2 m wide.
- Floor boards: oak/pine planks 0.18-0.22 m wide, weathered grey-brown, roughness 0.85; flags (kitchen, smithy, cellar, crypt): 0.5-0.7 m stones, cool grey, roughness 0.9.
- Plaster: lime wash, off-white to ochre, roughness 0.95, never pure white. Beams and frame timber: dark oak, 0.18-0.25 m section, roughness 0.8.
- Hearth stone: rough grey fieldstone, roughness 0.95, chimney above the hearth through the ceiling.
- Cloth dyes (muted): madder brown-red, woad grey-blue, weld ochre, undyed linen, lichen green. No saturated red, blue or gold.
- Lights: tallow candle (warm 2200 K, small), oil lamp (iron, hung from a hook), torch only in smithy, guardhouse, mine. Hung things hang from a hook, rope or bracket.

Rules in the generators (fixed for all 57 cells at once)
- [x] Measured placement: every item is drawn, measured and refused if it pokes through wall, ceiling, another item, a door, stair or window zone. Overlap scoreboard (test/overlap_in.mjs): 617 -> 7.
- [x] Honest footprints for rotated and round pieces, standing spots moved out of solids.
- [x] Counters keep wares on the counter; one scanned barrel (the second had doubled staves).
- [x] Tiny hung hammers and spades ("T" marks on walls, spade up at the ceiling) removed or re-pivoted.

- [x] Keeper room behind counters; standing spots outside a room edge move in; colliders are measured with the item (nothing stops a person inside a wall).
- [x] The firewood beside a hearth is a recorded floor item (it was drawn and given a collider but unknown to the plan; casks were put through it).
- [x] Sconce is a bracket with a dish and a candle (it read as a black T); hook cloth and tapestries are muted; door straps are blackened iron.
- [x] Inn at 19:40 on medium: 95 draws / 278k -> 94 / 204k triangles (cabinet cap per room with a cupboard fallback, caps on 600-triangle small pots, no vase scan as a bottle).
- [x] Top-up pass restores wall coverage lost to measured placement (0.524 -> 0.594; before measured placement 0.611), by the room's trade (PD.TRADE) and never with pictures.
- [x] Pictures only in the elder's hall, the inn, store and draper and now and then a better house (2-3 each); banners only where there is something to declare.
- [x] Slumped sacks with a tied neck instead of balls (Props.sack, one marked line in 70_props.js).
- [x] A draw that leaves a transform pushed (high.a) lifted every later item 0.15 m: guarded in pPut/pHang.
- [x] Hidden faces (wall backs, floor bottoms, ceiling tops of recorded items) dropped after the plan: 9,350 triangles over 57 cells.

Open flaws, by severity
1. [ ] Coplanar kit wall trims where wall panels meet (MI_WoodTrim x MI_WoodTrim, mostly below the floor line): instanced kit pieces, not yet trimmed. Inn: 1,519 pairs at 1.5 mm.
2. [ ] Bare dark walls and corners in lofts and back rooms (inn.loft 0.35, smithy.coalstore, guardhouse.cells); 51 rooms under 0.5 wall coverage.
3. [ ] Flat landscape pictures from kitGen (73b_alley.js, fx1): cartoon, left to fx1.
4. [ ] Window reveals: casings are dark boxes with no sill in many rooms.
5. [ ] Remaining overlap: in.116 counter spot inside a bench; one rug pair.
6. [ ] Mine coplanar meshes 420-422; cellars, crypt, tunnel not yet toured.
