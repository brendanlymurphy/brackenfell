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
