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
Round 2 (Build 61 to 62): FIXED terrace embankment (houses on the terrace no longer pull a 6 m dirt heap outside the retaining wall; 60_terrain.js), bell tower cladding (whole storeys of weatherboard, slit windows; 73i_walls.js), beached boats, skinning-rack pelts, stall cloth bolts and bunting (dye palette), wall piles in the gap between terraced shops, hidden yard fitted to the gap between houses, hamlet well, boulders on walls, festival ring spots, hay and door leaves.
Overlap finder (test/overlap.js, a gate step): severe 37 -> 8, solid 225 -> 171. Ceilings in tools/gate.mjs. The 8 left: 4 inside remote-origin cells (fx2), a barrel pile against a wall, boulder against a fallen standing stone (wilds stones), a buried low box beside a house.
Still open (outdoors): low-quality alley crates (A8), secrets as dark boxes, drowned man, plank wall scale, window panes, mill beams. Lighting-owned, reported: black pine bark and plank faces in shade (hunter palisade, bell tower back), specular hot spots on palisade planks, pale backlit bunting flags, bright gravel glint at the fishing camp.

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

## INSPECTION, BUILD 74 (fork-fin; eye-height tour every 8 m, 4 directions + up 25 degrees, 10h; pictures /home/claude/shots/fin/market/, sheets in sheets_market/ and sheets2_market/)

Severity: 1 = the owner would screenshot it, 2 = visible, 3 = minor. Market Place quarter, west third (x -46..-14) covered so far; the rest follows below as it is looked at.

- [ ] I1 (sev 1) Market Place / Upper Ward terrace: every retaining wall is a one-sided sheet. The quad branch (KQ) of wallRun draws a battered face, a base course, a weathered top and a parapet, but no end caps at u0/u1, no inside face, and buttress cheeks that stand free: from the end of a wall you see into it and a leaning sliver stands in the air (the owner's picture). Where: west wall end near (-37, 30), south wall west end (-44, 30), (-38, 14..30). Pictures: market_-38_30_y0_10, market_-38_30_y90_10, market_-38_30_yUP_10, market_-44.2_30_y90_10, owner terrace_wall_end.png. Source: src/73f_levels.js buildLevels > wallRun (KQ branch, buttress KQ branch). PLANNER'S FILE: needs end-cap quads, an inner face, and closed cheeks.
- [ ] I2 (sev 1) Same walls: rubble texture is about 4 times the scale of every house wall next to it (stones the size of a head at 1 m, blurred). Tile size TS = 3.6 m in wallRun's KQ quads (UV [U0, base/TS ...]); houses use about 1 m. Pictures: market_-38_14_y90_10, market_-38_14_yUP_10, market_-38_30_y90_10. Source: src/73f_levels.js wallRun, constant TS (and toff). PLANNER'S FILE: TS about 1.2.
- [ ] I3 (sev 2) Two-tone block pillar and a brick-textured box standing against the rubble wall at the terrace's south-west corner (different texture, flat box): market_-44.2_30_y90_10, market_-38_30_y180_10. Source: wallRun buttress (KQ cc colour, INF_R) / terrace corner. PLANNER'S FILE.
- [ ] I4 (sev 2) Dyer's racks in the west-south yards: two flat, saturated blue and red rectangles hanging as plain quads. market_-46_6_y180_10, market_-46_14_yUP_10. Source: src/73m_plots.js trade() kind 'dyer' (second put: m.quad2 cloths [0.34,0.38,0.5] / [0.55,0.34,0.28] with no texture variation, no sag, no fold). PLANNER'S FILE.
- [ ] I5 (sev 2) Kitchen gardens: beds of mud boxes with grey-white balls for cabbages and grey spiky blades on bean poles; read as glass shards and rocks. market_-46_18_y90_10, market_-38_-18_y270_10, market_-29.4_-26_y90_10. Source: src/73m_plots.js trade() kind 'garden' (m.ball LEAVES colours 0.24..0.4, beam poles with 0.5 m ellipsoid 'beans'). PLANNER'S FILE.
- [ ] I6 (sev 2) Terrace stone shed and well: regular ashlar block texture (even bond, no variation) next to the rubble terrace wall and the house walls, and a flat bright blue square on the shed's front. market_-22.3_29.5_y270_10, market_-22_22_y180_10, market_-21.8_15.2_y270_10. Source: src/73f_levels.js "on the terrace" section (the shed and well boxes). PLANNER'S FILE.
- [ ] I7 (sev 2) Ginnel between the guardhouse row and the poor lane: under the jetties the walls and undersides are near-black flat planes with no texture, and a black diagonal brace crosses the view. market_-37.7_-35.8_y0_10, market_-37.7_-35.8_y180_10, market_-37.7_-35.8_yUP_10, market_-30_-34_y90_10. Source: probably src/71_kithouse.js jetty and overhang undersides, or src/73d_infill.js back-wall boards; HOUSES WORKER'S FILES.
- [ ] I8 (sev 3) Large plain beige plaster wall faces with no variation (limewash without staining or panelling): market_-38_-10_y0_10, market_-22_-10_y180_10 (interior shell view). Source: src/71_*.js plaster wall material. HOUSES WORKER'S.
- [ ] I9 (sev 3) The tour grid stands in house shells (hollow plaster boxes with leaded windows and cobble floors): not reachable by a player (colliders), but World.blockedAt returns false inside a house footprint, so any path or spawn using it can put a person or camera inside. Source: src/70_props.js or the collider builder.
- [ ] I10 (sev 1) Watch Bell tower (8, 19): the whole tower is a saturated flat orange plank box over a cream stone base, with identical small black window holes in a grid; it reads as a toy block and is the tallest thing in the view from the square and the lane. market_2_30_y0_10, market_2_30_yUP_10, market_2_30_y90_10. Source: src/73i_walls.js (bell tower build; colours and plank material). PLANNER'S FILE.
- [ ] I11 (sev 2) Terrace east wall at the flight from the square: a leaning stone wedge stands free beside the wall (buttress cheek / cap, see I1) and large flat black plates sit on the rubble face (the drain-spout stain quad: wallRun `mm.quad2` with MAT.PLAIN [0.3,0.29,0.27], about 0.4 x 1.2 m, reads as a hole). market_2.5_14.4_y270_10, market_2.5_14.4_y180_10, market_2_30_y270_10. Source: src/73f_levels.js wallRun (spout and stain; buttress KQ). PLANNER'S FILE.
- [ ] I12 (sev 2) Stone flight cheeks on the terrace stair are a zig-zag diamond block pattern at giant scale, unlike any wall around: market_-14_6_y180_10, market_-14_6_y90_10. Source: src/73f_levels.js "the flight from the market square" (cheek quads/boxes with the herringbone material). PLANNER'S FILE.
- [x] I13 [PARTLY FIXED (fin): dull dyed palette, weave tone, folded ends, an unrolled length; still reads flat grey-teal in shade, see ba3.jpg] (sev 2) Stall goods: bolts of cloth are flat white/cream cylinders hanging or stacked with no pattern (market_-6_-10_y0_10, market_-14_-10_y0_10: flat white slabs on the counter). Source: src/73c_dress.js dBolts / dLogCloth with DRCOL.cloth (palette too pale; no weave variation). MY FILE: fix.
- [x] I14 [NOT MINE: the red flag is the lookout-corner flag in src/73f_levels.js (the tower lookout block near line 211), planner's file; mute and fray there] (sev 2) Bright saturated red flag on a pole above the terrace gate (-14, 22) and a flat red gate banner elsewhere: market_-14_22_y90_10, market_-14_22_yUP_10. Source: src/73h_routes.js / 73_village.js banner (Props.banner with AWN.madder). MY FILE: mute and add wear.
- [ ] I15 (sev 2) Log pile in the west-south yard has bright cream hexagonal end faces (flat pale colour), market_-14_-26_y270_10. Source: src/73m_plots.js trade() kind 'woodyard' (beam logs 0.3 m) or 73c_dress logs. Check: end-grain colour.
- [ ] I16 (sev 3) Bonfire stack is a dark spiky tipi (market_2_-10_y270_10); pale mint plaster wall with a black doorway at (9.7,-33.5) (market_9.7_-33.5_y180_10); the same bare dark plank wall twice at (-14,-18) (market_-14_-18_y90_10).
- [x] I17 [FIXED (fin): cabbage dark soft green, apples russet / yellow-green, cheese tan; ba3.jpg] (sev 2) Market stall wares: the cabbages are one fused bright lime-green mass with a glossy sheen, apples saturated red; other stalls show flat pink and flat white slabs (cheese/cloth). market_10_-2_y0_10, market_10_6_y90_10, market_10_-10_y90_10. Source: stall goods in src/73c_dress.js (dStall goods / DRCOL) or the dstall builder in 73c_dress. MY FILE: fix (dull and break up the greens, separate heads, tint).
- [ ] I18 (sev 2) Watch Bell tower base (8, 19), south face: plain cream ashlar with an even bond, and a dark vertical chute hanging from the top to a window slot. market_10_22_y0_10. Source: src/73i_walls.js bell tower. PLANNER'S FILE.
- [ ] I19 (sev 3) Door and window leaves on the house at (10, 4) read as flat black rectangles at 10h (no wood grain, no frame light): market_10_6_y180_10. Source: house door/shutter materials, 71_*.js (houses worker) or baked contact shade (72m_bake.js, lighting worker).
- [ ] I20 (sev 2) Washing in the yards behind the alley (19, 14): five flat grey-green, brown-pink and slate rectangles 1 m x 1.2 m on a line, no weave, fold or sag, hung dead straight. market_19.2_14_y270_10, market_19.2_14_y180_10. Source: src/73m_plots.js trade() kind 'washing' (m.quad2 with MAT.CLOTH palette k = 0..4). PLANNER'S FILE.
- [x] I21 [FIXED (fin): board ceiling between lighter joists, readable; ba3.jpg] (sev 2) Under the Hart's gallery (18, -16): near-black flat planes (underside and back wall) with crossing diagonal braces and no texture. market_18.3_-16.2_y0_10, _y180_10, _yUP_10. Source: gallery undersides in src/73h_routes.js or src/73c_dress.js (hartgallery); mine to check.
- [ ] I22 (sev 2) Door leaves are flat black slabs at the backs of the alley houses (26, 30) with pale silver ivy leaves over them: market_26_30_y180_10, market_26_30_y270_10. Source: house door material (71_*, houses worker); ivy in 73c_dress.js (mine: darken ivy).
- [ ] I23 (sev 3) South-side houses of the Market Place: upper floors in a bright cream/yellow plaster that is lighter than anything else in view (market_26.1_5.4_y0_10); a pale mint crate of produce on the pavement. Source: house plaster tint 71_*.js / 72k_houses.js; crate = genProduce 73b_alley.js (fixed in my next commit).

## UPWARD JUNCTION TOUR (fin, Build 78/79): looking up at 25 and 40 degrees at 30 pairs of buildings within 1.5 m (core region)
Pictures: /home/claude/shots/fin/pairs_core/<idA>__<idB>_<x>_<z>_p25|p40.jpg, sheets /home/claude/shots/fin/sheets_pairs/p40_00..03.jpg. Counted from 93 p40 views: no sky gap seen between party walls and no roof plane left hanging in the air in this region; the owner's roof_between_houses case was not reproduced here.
- [ ] J1 (sev 2) Lower roof runs straight into a taller wall with no flashing, step or lead line (the most common junction, about a third of the views): guardhouse__in.41, in.04__in.08, in.06__in.07 (sheet p40_01 rows 1-3). Source: the roof code of the infill houses, src/72c_infill.js / 73d_infill.js (houses worker); the rule wanted is a lead flashing strip along the wall line and a stepped course.
- [ ] J2 (sev 2) Gable walls end in a single thin cap with no verge board or eaves return at the top of a taller house against a lower neighbour: p40_01 row 2 col 1 and 3 (in.06__in.42 and in.07__in.08). Source: same.
- [ ] J3 (sev 3) Roof edges and jetty undersides read as single thin sheets from below at the draper / shop.n2 pair: draper__shop.n2_34.2_-2 and _36.7_-14.8 (p40_00 row 1 col 2 and 3). Source: shop row roofs and jetty undersides, src/72c_infill.js (houses worker).
- [ ] J4 (sev 3) Flat dark roof planes with no slate course texture at the in.41 / guardhouse side: p40_01 row 3 col 2 (flat black roof). Source: roof material tint on infill houses (houses worker).

## CHAPELGATE DAY TOUR (fin, 10h): 55 points x 5 views, /home/claude/shots/fin/chapel/, sheets /home/claude/shots/fin/sheets_chapel/c0_00..04.jpg (yaw 0 only reviewed)
- [ ] C1 (sev 2) Tall flat brown plank wall (a yard or churchyard boundary, no posts, no top, no texture variation, one thin sheet that curves with the road) north of the chapel steps: chapel_-0.6_-51.8_y0_10 and chapel_-16_-52_y0_10 (sheet c0_00 tiles 1 and 6). Source: the yard fence builder, probably src/73m_plots.js buildChurchyard or 73_village.js (planner's file for 73m): needs top rail, posts and a lower stone course.
- [ ] C2 (sev 3) A face of dressed stone filling the whole frame with a blurred, stretched look at the foot of a wall: sheet c0_02 tile 3 (chapel_-7.9_-67.4_y0_10). Source: wall texture scale in the same plot code.
- [ ] C3 (sev 3) Raw boulders stacked as a stub wall end against a house front, open end with no cap: chapel_0.6_-44_y0_10. Source: terrace or plot walls (73f_levels.js / 73i_walls.js, planner).
Good in this district: the churchyard (stones, yew-like trees, wall), the chapel side with its stained windows, the grass slopes and the path up the hill read well; no sky gaps seen.

## MARKET EAST AT DUSK (fin, 19 h): 90 points x 5 views, /home/claude/shots/fin/market/*_19.jpg, sheets /home/claude/shots/fin/sheets_m19/m19_0..3.jpg (east part x >= 18, yaw 0 only reviewed)
- [ ] M1 (sev 2) Large dark plank house walls with no window, door, post or trim, one flat texture from eave to plinth, at 4 to 8 m from a lit street: sheet m19_1 tiles 1, 6 and 10 (market_*_y0_19 east of x 18). Source: the back and side wall of the infill houses, src/72c_infill.js / 73d_infill.js (houses worker): needs a door or window, a lean-to or a stack on every blank wall over 4 m.
- [ ] M2 (sev 3) Stone close-ups at wall feet fill the frame with one stretched texture (m19_0 tiles 2 and 6): same texture-scale fault as C2. Source: wall texture UV scale in the plot or terrace walls (73f_levels.js / 73i_walls.js, planner).
Good at dusk: lit doors with lanterns, lit leaded windows, the stalls' warm light and the cobbles reading well; no black holes and no sky gaps seen.

## CLOTH CHECK (fin, 10 h): views from the square, 72 shots yaw 0/90/180/270, sheets /home/claude/shots/fin/sheets_m19/cloth_0.jpg and cloth_1.jpg (sun and shade both present in them)
- [x] CL0 Checked: stall awnings (straw, dull blue, grey, striped), stall covers, cloth bolts on counters, banner pennants, hanging cloth under the gallery: in sun all read as dull wool/linen, not saturated; in shade they stay dark but keep their hue. No grey-teal slabs seen in these views.
- [x] CL1 (sev 3) Two hanging cloth panels at the draper's stall read as flat white blurry rectangles with no fold, sag or hem, brighter than anything near them, beside white rolled bolts: market_-14_-2_y0_10, sheet cloth_1 tile 9. Source: the draper stall in src/73_village.js or 73c_dress.js (dBolts / stall drape): off-white tone, a fold strip or two, uneven hem (mine, to do next). Fixed: laundry line in 73_village.js (both blocks) and dLaundry in 73c_dress.js now hang as five folded strips with uneven hem, dull dyed tones; COL.linen lowered to [0.66,0.61,0.50] in 70_props.js. Sheet: shots/fin/cl1/sheet_cl1.jpg.
- Not checked: awnings in deep shade at 10 h (no stall lies fully in shade in these points) and any view at night.

## HART CELLAR (owner: "there is no cellar door in the Hart")
- [x] H1 (sev 1) The fresh-brick secret and the smugglers' doorway stood at world (266.5, 4.6): outside the rebuilt Hart's cellar (cellar plan x -6.8..6.8, z 0.2..7.8, floor y -402.93), so the prompt never appeared and no patch was drawn in the cellar. Fixed: 72e_plans.js dressInn publishes World.hartWall (east wall of the cellar, plan (6.8, z 4.0), world (266.8, -402.93, -0.65)); 82c_secrets.js (patch, interaction point) and 94d_act2.js (doorway, portal point, return point) read it. [fin] edits, logic session please keep them.
- [x] H2 (sev 2) Casks stood in front of the wall at that spot. Fixed: a 1.5 x 1.5 m floor zone (plan x 5.3..6.8, z 3.25..4.75, level -1) is kept clear of casks, crates and shelves; the two casks on each side remain.
- [x] H3 (sev 2) Patch is now 1.1 x 2.0 m of cleaner, darker-red brick with light mortar against the grey wall; the open doorway has stone jambs, a rough timber lintel, a dark opening, brick rubble and dust at the foot.
- [x] H4 Way down checked by real input (keys W, steering): from the front door along the hall, 0.3 m radius, to the stair top at the east end of the north rail (plan 6.3, 0.95), down the stair, across the cellar to 2.0 m from the patch; prompt "Look at the fresh brick" appears at 2.1 m. The way down is an open stair behind a balustrade along the north wall (no hatch, no hole behind the bar); the opening is at the east end of the rail by the east wall. It is dark; a sign or lantern at the top would help (not done).
- Pictures: shots/fin/hart/sheet_hart_cellar.jpg (bar room looking at the stair, cellar east wall closed, doorway open), before: sheet_b1.jpg (blank east wall).
- Logic session: S.flags.sec_wall opens it; the doorway visibility switch in 94d_act2.js secTick is unchanged.

## BAKER'S in.10 and lanes (build 83 audit)
- [x] B1 (sev 2) in.10 back room: table and benches sat in the 2.9 m corridor between the two stairs (0.5 m lanes), seats and hearth front cut off. Fixed in 72e_plans.js pDining: a table is accepted only with a 0.9 m way to every seat (pLaneOk) and when a 0.9 m wide way still runs from the room's doors to every seat, the hearth front and each stair foot (pConnOk); wall bench fallback takes the first side that keeps the way. 72k_houses.js shopfront: dressHall may seat the household in the shop (alt); in.10 hearth is narrower and leans away from the cellar stair so the stair foot has an exit. in.10 now: table with four seats in the shop by the door, all spots reachable at 0.9 m.
- [ ] B2 (sev 2) Same grid check (HW 0.45, reach 0.8) still lists seats or stair feet that cannot be reached at 0.9 m in about 38 other houses (hearth-corner pockets, dressing pieces v_* standing in a stair-foot pocket, wall benches in corners): elder, herbalist, guardhouse, weaver, mill, farm, hunter, fisher, shop.n2/n3/s0/s1/s2, draper, in.02/04/07/08/12/13/20/21/23/33/34/36/37/38/40/51/60/66/67/75/77/113/115/116, high.a, high.c. Source 72k_houses.js house builders and 72l_hobjects.js hPlace (houses worker): keep a 0.9 m way to stair feet and seats; the interiors test now prints spot fallbacks (schedule-wanted spots on the hearth front or home): 2 of 57 houses (inn fire2, smithy anvil).
- [x] B3 Hart (inn) by real input: door to bar, barfront, fire1, fire2, stand1, tables, workspot, stair foot walked; grid at 0.9 m: all 26 spots reachable (12 table seats at three tables, bar reachable). Tables use the strict rule (0.9 m lanes); the old third table at the west wall was moved to a shorter table in the middle row.

## TOUR: people in rooms, 12 h and 20 h (build 83 + fin 4b6040b)
Ten houses (inn, smithy, store = Quill's, draper, in.10 baker's, in.13 and in.40 cottages, chapel, guardhouse, mill), script /tmp/n1 tour (NPC position against the plan: inside a solid item other than a bench or bed, seat or lying height, facing a wall within 0.7 m, two on one seat). Pictures from the door: shots/fin/tour/sheet_tour_12.jpg and sheet_tour_20.jpg (night is very dark; candles only).
- Furniture and spot faults found: none. Everybody sitting is on a bench seat, everybody lying is on a bed (Godwin Hobb in.10 upback bed 12 h and 20 h; Guardsman Ivo guardhouse bed2 12 h), sitting height 0.02 above floor with sit 0.46 offset, nobody facing a wall, nobody on a seat another stands on (inn 20 h: 18 people, 11 seated at tables 0, 4, 8 plus Lark playing, Bram, Greta behind the bar).
- in.10 12 h and 20 h: Avice and Tilly sit at the new shop table (1.8,1.3) and (1.2,2.7); Godwin lies in the upback bed both hours (PEOPLE.md: asleep 10-14; asleep at 20 h is early, logic session to check).
- Schedule problems for the logic session (not furniture): mill empty at 12 h and 20 h (Osric Dunn is at the Hart at 20 h; at 12 h nobody in the mill, where is he?); guardhouse empty at 20 h (Hale and Ivo at the Hart) and Ivo asleep in the barracks bed at 12 h; store (Quill's) empty at 20 h (Marta at the Hart, shop closed: fine if the door is barred); Hart at 12 h holds only Greta; chapel has one person at both hours; smithy 12 h only Brandt, 20 h only Tobin (living room mealbench).
- [ ] T1 (sev 3) Chapel cot (picture shots/fin/beds/cot_0.jpg): the cot sits against the sacristy west wall under a hook rail, clear of the window and with a way round; mattress and pillow still render near white under the sacristy light even after Props.bed mattress was dimmed 22 percent (70_props.js bed, line 61): look for another bed draw or the cloth gain in MI_Trim_Cloth.

## ELDER STRONGROOM (audit view 714.40,-401.38,8.85)
- [x] SR1 (sev 2) That camera is at plan (3.5, y -1.7, 11.5): inside the cellar stair run (stCellar x 1.30..5.26, z 10.37..11.63, treads reach y -1.75 at x 3.5), so the view is the stair's solid plank side. Not a shelf. Pictures shots/fin/bars/sr0.jpg and sr3_sheet.jpg (from the floor, eye 1.6 m: the stair side fills the view looking north; the shelves along z 13.4 stand against the wall, crates and sacks 0.6 m with ways between).
- [ ] SR2 (sev 2) The real fault is the layout: a closed 1.6 m high stair body stands mid-floor in a 6.6 x 4.6 m strongroom and splits it. Request below.

## REQUESTS FOR THE INTERIORS SESSION
- elder (72h_trades.js): move pStair stCellar (x 1.3, z 11.0, axis x) against the north wall, z about 9.95, and move the d66-69bn benches (z 9.2..9.65) to the west wall or drop two; the strongroom then reads as a room with a stair along one wall, not a stair in the middle. See SR2.
- inn (72e_plans.js): keep the Hart bar at a.x1 - 2.3 (lane to the east wall at least 1.8 m), the stairs test needs it.
- shop.n2, shop.n3, shop.n4, shop.s0, shop.s1, shop.s2, in.10, in.37, in.111: the upstairs stair head stands against the chimney stack (hearth width): narrow the hearth by 0.3 m or turn the stair head.
- store (72h_trades.js): kshelf at the cellar foot blocks stUp: move it 0.9 m along the wall.
- elder hightable, herbalist chamber meal table, in.33 chamber, in.115 parlour table: table cuts off a seat or a stair foot at 0.9 m (test/interiors.js prints the ways); shift the table 0.5 m or drop one seat.

## LIGHT BY HOUSEHOLD (audit I11) and CONTAINERS (coordinator list 3, 4)
- Done in my files: pLightTone(P) in 72d_plan.js scales night lights by tier (cottage 0.72 radius x 0.8 colour, amber; tradesman 0.9 x 0.95; merchant, inn, elder, high.*, chapel 1.0 x 1.05); not yet called.
- REQUEST for the interiors session (72e_plans.js planBuild): call pLightTone(P) right after pLightCut(P). Light budget numbers to set in pLightCut: cottage (in.*) = hearth + 1 rushlight (kind 'fire', r 5, colour 3.0,1.4,0.5) and nothing else; tradesman = hearth + 2 or 3 lights; merchant (store, shop.*) = 3 lights; inn and elder = candle branches, 5 to 6 lights; never more than 8 flames a building (now 24). Windows keep their daylight stand-in.
- Containers: 1574 interactions, 931 'cont' + 105 chests. The surplus comes from one rule, ixScan in 82b_interact.js: every floor item whose id matches barrel, cask, sack, crate, basket, hamper became openable (cbarrel# 144, wicker_basket 83, barrel# 68, csack# 57, ccrate# 40, sacks# 39, cask# 35 ...). Fixed there by rule: barrels, sacks and crates are openable only up to 3 a building (6 in store, inn, mill, farm), lowest hash; chests, cupboards, wardrobes, shelves and strongboxes always. The interiors session names its stock items with it.named = true to keep them openable.

## CHAPELGATE UPWARD VIEWS (fin, 10 h): 55 points looking up (yUP), contact sheet shots/fin/sheets_chapel/up.jpg (12 of 55 on it)
- [x] CU1 Checked: eaves, roof undersides, gallery edges, the chapel gable and tower, trees against sky and the hill read as built; no sky gap through a roof or wall, no open back faces, no floating tile, no untextured plane. Gallery plank fascias are plain but have rails and posts; the half-timbered gables are the best reads.
- [ ] CU2 (sev 3) Looking up at tall house walls (tiles 9 and 11, chapel_0.6_-44 and chapel_0_-76) a long unbroken plank wall with one thin trim line fills the frame to the eave: same blank-wall fault as M1 (72c_infill.js / 73d_infill.js, houses worker).
- After the merge of the interiors session's new plans (536f3afb) 16 ways still cross furniture (was 10): store, draper dip7, shop.s2 bench4, in.04 lofttable, in.12, in.15, in.21, in.36 stack1 (level 1, the stair head pocket against the chimney stack), in.33 bed2. Request for the interiors session: keep a 0.9 m pocket at the stair head (pKeepStairHeads covers the floor below; the upper floor needs the same against the stack). Ratchet in test/rooms_people.js now 16.

## ARM'S LENGTH (fin, indoors at 0.6 m, day, 10 houses: inn, smithy, store, draper, in.10, in.13, in.40, chapel, guardhouse, herbalist; 8 to 9 views each: four walls, three big items, the hearth, two floor views)
Pictures /home/claude/shots/fin/arm/sheet_<house>.jpg (tile names are position: wall_n, item_<id>, hearth, down0/1); script /tmp/n1/arm.mjs. Before and after: arm/sheet_ba.jpg.
- [ ] AL1 (sev 2) Plaster walls of the planned interiors have no detail layer at 0.6 m: one flat ochre, brown or grey fill with a faint noise, no grain, patching, stains, cracks or edge wear; whole frames of it: inn wall_w, smithy wall_n, store wall_e/n/s/w, in.10 wall_e/n/w, in.13 wall_n/w, in.40 wall_e/n/w, guardhouse wall_e/n/w, herbalist wall_n/w, chapel wall_e and wall_w. The stone, plank and half-timber walls read well (inn wall_s, store down0, herbalist wall_s, guardhouse hearth). Source: the interior plaster quads of the plan mesh (72d_plan.js pWallEmit, mine) take MAT.PLASTER with no detail layer; the houses worker's detail layer for walls is missing on them. Needs the layer switched on for the plan's interior wall material (houses worker: 71_* and the shared material).
- [x] AL2 (sev 3) in.13 dye vats (hobjects TP.vat): the dye surface was a black flat disc with the stirring stick standing in it. Fixed in 72l_hobjects.js: the dye in its own colour with a paler ring, a timber rim, 18 sides; picture sheet_ba.jpg top.
- [x] AL3 (sev 3) Bottles, jars, flasks, bolts and pots were 7 to 9 sided (herbalist counter, store shelves): 12 to 14 sides now (72i_wares.js PD.ware, 70_props.js bottle and pot). Sheet_ba.jpg bottom. Still plain flat colour, no label or glaze variation: left.
- [ ] AL4 (sev 3) draper wall_s and wall_w: cloth bolts and the red stack read as bare flat-coloured boxes and tubes with no weave or fold at 0.6 m. Source 72i_wares.js PD.ware.bolt and folded (mine): next.
- [ ] AL5 (sev 2) chapel wall_n: a flat olive-green plank wall (no variation, a green cast unlike every other plank wall); chapel wall_s: a flat ochre strip, no fold, no hem, in a stone wall (a hung cloth drawn as a plain quad). Source: chapel dressing in 72f_underworld.js (interiors session).
- [ ] AL6 (sev 3) draper wall_n and smithy wall_w: a black frame (view into a corner or a post at 0.6 m) shows nothing but black: the room's light does not reach 0.6 m from the wall at 13 h with cellnight=10. Not a geometry fault; looks cheap in game: lights near the walls (interiors session, light by household).
- No z-fighting plane, sunk or floating prop and no piece through a wall found in the 82 views. Floor views: boards and stone read well; rugs (dark red runners with a border) are acceptable but the fringe is not visible at that distance.
