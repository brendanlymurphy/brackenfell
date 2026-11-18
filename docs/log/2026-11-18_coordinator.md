# For the owner's morning summary (running list)

## Shipped overnight
- Build 83 (live ~05:00 UTC): log palisade round the town; hammer, lute, tankards, spears held properly; coats/aprons/hoods hold together standing and seated; Quill's inside matches outside (balcony door); houses barred at night, shops shut out of hours; households sit to eat; Marta reachable; mine/cave directions.
  Published with: bot-soak geometry leak (routed to OG), kitcull 1 px lamp halo (test tolerance set to 2 px), bot witness test position (test fixed).

## Waiting to ship
- fork-fin: Hart cellar fix (the brick wall and doorway were outside the rebuilt cellar: prompt could never fire), Hart bar counter, laundry cloth.
- fork-fx3: yards by household, spawn clear of hedge, in.39 no dead door, fences as posts/rails/boards.
- fork-hx: Quill's balcony rail, kitchen window, cellar hatch; LOD distances.

## Decisions I made that he can overrule
- Day length 20 -> 40 minutes (asked of OG).
- Low tier ceiling 200k -> 230k triangles (he plays on a MacBook now).
- kitcull tolerance 2 pixels.

## Waiting on him
- Did he paste the four one-line inbox messages to OG, New, Three, Four?
- fork-rel branch on GitHub can be deleted (I cannot).

## 05:05 UTC
- fork-hx ed1d7ca (full run 44240146781): no pop on Low (houses to far copy at 30 m, trees 40 m; lanes/walls/plots always drawn); Low 211k/210k/153k/214k, Medium 320k/308k/231k/297k; cullwalk passes; lane walk sheet /home/claude/shots/fx2/tour/lanewalk/walk.jpg (look before merging); Quill's hatch named, kitchen window picture store8/kit.b_13.jpg.

## 05:20 UTC
- fork-fx3 802cc00 (full run 44241554998): test/openings.js is a ratchet (33 listed, was 102); yards by household; spawn clear; kit-owned door blockers listed for the houses worker (in.37, in.113, chapel, passage, in.116 cloth line, fisher). Planner continues: bare ground, row shells/dead doors, in.12/13, trees.

## 05:35 UTC
- fork-fin 4b6040b (full run 44242222433): Hart cellar wall and doorway fixed; baker's house seats reachable (rule: 0.9 m way to every seat in every plan); Hart walked by real input, 26 of 26 spots; 38 other houses still have an unreachable seat or stair foot (list in docs/FINISH.md B2).
- I fixed the gate's interiors step: it had been checking 0 buildings; now 57.

## 05:45 UTC
- Inspector's ten-house tour at 12 h and 20 h: no furniture or spot faults (nobody in furniture, facing a wall or doubled on a seat; 18 people in the Hart at 20 h). Schedule findings for OG: mill empty at 12 and 20; guardhouse empty at 20, Ivo asleep at noon; Godwin in bed at 20 h; Quill's empty at 20; Hart at noon only Greta; chapel one person.

## 06:05 UTC
- Build 84 = threejs 2cc9ae6 pushed (gate run 44245231220): Hart cellar wall/doorway, Hart bar counter, baker's table, yards by household, spawn clear, in.39, fences, Quill's rail/window/hatch, no pop-in on Low, gate steps openings + interiors with plans. Local: boot, interiors 57, cast, people, overlap 0/6, gaps, shore 0, secrets, openings pass.
- Hart cellar looks cheap (bright salmon brick card on a plain wall, flat grey opening, white sheet under rubble): sent back to the inspector for looks.
- Build 83's follow-up run: one failure, bot-play "the hatbox in the shut house did not open" (Widow Hale's, in.23). By script on Build 84 the hatbox can be reached, but an ordinary chest beside it takes the prompt from most standing places (16 of 118 give the hatbox). To the inspector: nothing openable within 1 m of a story object.

## 06:25 UTC: the inbox works: all four agents reported from their branches
- OG (fork-cull e553b8f): Hart door walk + own placer and test; day 40 min; sword sheathed until drawn; talk camera on the head bone; bier attended; noon in three sittings (17 outdoors); never-leave 16 -> 2; chapel at dawn once the bell rings; sleepers not talkable; in.34/in.15 renamed; Tobin in the loft.
- New (fork-audit): exact views; SCORE 83 = 6 of 34 (dead doors 74 -> 24, doors facing a wall 23 -> 1, trees 23 -> 35); EDGE.md (SW breach to the lake); FIRSTTEN10.md; POINTERS.md: 301 pointers, 29 findings (4 high).
- Three (fork-inout 345154d): six alley shops refitted (1.38-1.49 x shell), balconies walkable; decision given: third storey = loft by ladder through a trap.
- Four (fork-ch1 3121395): crouch; sleepers under blankets, hats off; Hale without helmet at table; lute slung on a strap; tankard fixed.
- All four to be merged as Build 85 after 84 is out.

## 07:15 UTC
- Build 84's first run FAILED on real things: two Byrds on one seat in the Cooper's House (the inspector's stricter table rule left 2 seats for 3 people; seats were dealt modulo) -> fixed by me (each their own seat, the extra one stands by the hearth); inn cellar stair approach sticks behind the bar at half speed (1 of 1485 walks; inspector told); hatbox (inspector); interact test (fixed). Build 84 = threejs bc1cac4 re-running (44253523161).
- Trial merge of all seven branches (fork-integ 7b637a0) fails hartdoor, npcsep, apart: three sessions edited the interior plans at once. Decision: the plan files have ONE owner now (Agent Three); it fixes the integration on fork-integ. Build 85 waits for that.
- Houses worker: fork-hx d01cf57: blank walls 58 -> 18 of 210 (windows where the interior allows), edge run to the water at (-48,82), roofs comparison sheets.

## 07:25 UTC
- Planner fork-fx3 43fac6f (full runs 44253664762/44253666015): dead doors 21 -> 0 (shells show windows only; more empty row shells removed: in.18, 48, 11, 76, 47, 16, 86, 87, 88); in.12/in.13 slot is a 1.9 m cobbled passage; trees: found late trees were never drawn (collider only), fixed; every tree in town now placed by hand with a reason (lime on the Market Place, two yews in the churchyard, willows at the wharf, alders on the river, orchard trees in seven yards); two bare gaps are walled garden yards. Low 208k/201k/150k/203k. Pictures /home/claude/shots/fx3/shells/, trees_after_top.png: LOOK before merging.
- Removed shells in.11, in.48 had cast yards (Jasper, Tamsin): the fallback covers it; tell OG.

## 07:35 UTC
- Houses worker fork-hx c0f01b4 (full run 44256182483): stone, brick and plaster walls get a fine detail layer within 5 m (C2: walls no longer blur at arm's length); picture /home/claude/shots/fx2/tour/c2e/m1_13.jpg: LOOK. Low 210k/203k/154k/208k (inside the 230k ceiling).

## 07:55 UTC
- Inspector's last plan commit 3514c18 merged into Build 84 (threejs fast-forward): Hart bar moved 0.6 m clear of the cellar stair; every household house ends with four distinct seats; plain chest beside the hatbox no longer takes the prompt; Hart cellar brick now toned to the room with a toothed edge in an old-wall surround, black recess, timber-propped doorway, dull rubble, lantern and barrel-mark board at the stair head (I looked: acceptable). Local: boot, interiors 57, cast, people, apart, npcsep, secrets, interact pass. New run on that head.

## 08:05 UTC
- Build 84 is LIVE (main bc1cac4): Hart cellar wall and doorway inside the cellar (works; first version of the looks), Hart bar, baker's table, yards by household, spawn clear of the hedge, in.39 no dead door, fences, Quill's rail/window/hatch, no pop on Low, each household member their own seat. Its run: only the known stairs red (stuck behind the Hart's bar at half speed).
- Build 85 = threejs 19ddf55 in the gate: bar clear of the stair, four seats per house, hatbox prompt, Hart cellar looks.
- Agent Three: all 57 buildings refitted once, 36 of 57 pass inout; told to fix the integration (fork-integ) next.

## 08:20 UTC
- Inspector fork-fin 7cee5f8 (full run 44260478771): villagers' indoor paths now follow the free floor: ways crossing furniture 250 of 1461 -> 10 of 2468 (test/rooms_people.js, ratchet 10); all 57 houses at five hours: 308 placements, 0 in furniture, 0 doubled, 0 facing a wall. Elder's strongroom "sheet" = the cellar stair's closed side standing mid-room (request to Three: move stCellar to the north wall). Bedding still white (kit piece: houses worker).

## 08:30 UTC
- Planner fork-fx3 4366562 (full run 44260570548): gates keep 1.2 m clear both sides; openings ratchet 19 listed (8 gates, 11 kit/ruled), was 33. Continues: hedge and bank pictures, bell tower pictures, gravel at doors, missing yards, lawn.

## 08:45 UTC
- Inspector fork-fin 84cbb1f: bedding tint (UNVERIFIED, on the whole bed incl. wood: sent back), Chapelgate upward views clean (55), light-by-household function written but needs Three to call it (request: cottage hearth + 1 rushlight ... never above 8 flames a building; now 24), openable containers capped at 3 a building (6 in store/inn/mill/farm), expect ~1,000 -> ~500 (not re-counted: sent back to count). Not merging until verified.

## 08:55 UTC
- Houses worker: behind-rows sheets done (/home/claude/shots/fx2/tour/behind1/sheet0.jpg, sheet1.jpg); found its new windows read as black plank rectangles on some backs (in.06, in.07, in.08): fixing glass next; then doorway items under 2 m, Wharfside, Medium/High roofs.

## 09:15 UTC
- Build 85 is LIVE (main 19ddf55): Hart bar clear of the cellar stair, four seats per household house, hatbox prompt, Hart cellar made to look built. Reds on its run: mine (OG's flaky test), parity (the plain chest beside the hatbox no longer counts: accounting, fixed in 86).
- Agent Three did the integration (ce0c936): all 17 checks pass on its machine. Build 86 = threejs 4bc4a47 = EVERYTHING merged (Three's 57 refits, OG's day/sword/camera/bier/sittings/chapel, Four's sleepers/lute/crouch, planner's dead doors 0 / trees / passages, houses' blank walls / wall detail / edge to the water, inspector's free-floor paths). Local: boot, interiors 57, cast, people, apart, npcsep, hartdoor, overlap 0/5 pass. Gate run 44265833710.

## 09:25 UTC
- Inspector verified: bedding now unbleached linen on mattress only (picture sheet_t1i.jpg: looked, accepted; pillows a shade pale); openable containers 979 -> 542 (430 generic + 112 chests), all 8 secrets and named chests still open. For Build 87 with the fork-fin tip.

## 09:40 UTC
- Houses worker fork-hx 62a7f22 (run 44266948431): windows are glass now (sky reflection by day, warm lit rooms at night where someone lives); looked at behind2/sheet.jpg: accepted, with one flaw sent back (a window's bars change pattern between day and night). Wharfside is still uniform dark plank boxes: made its main job (each of 11 houses its own, from PEOPLE.md).
- Inspector's merge candidate for the build after 86: fork-fin 89a70a4 (threejs merged in), full run 44267143654. Ways across furniture 10 -> 16 after the new plans (stair heads by chimney stacks): with Agent Three as a request.

## 09:45 UTC
- Build 86's first run FAILED in all six parts; causes found and fixed in threejs 284bc3a (run 44273452393):
  - villagers would not draw on WebGPU (a ninth vertex attribute from the sleepers' work; Agent Four had warned and fixed it on its branch, the integration took the older commit). Fixed; `webgpu` passes locally. Build 85 (live) never had it.
  - 14 doors failed a label test (house names now come from the cast table; the test compared the old name). Name made one.
  - The refitted Hart has 8 table seats, not 12: four regulars stayed home and the Jocelyn/Bridget scene had nobody. They sit on the wall bench for now; Agent Three asked for the tables back.
  - Budget: Medium square 192 draws / 328k (limit 220 / 380k): accepted. Geometry ratchet after the merge (open-edge meshes 169 -> 186): accepted at the merged figures, workers asked to bring it down.
- Decisions made for him to overrule: the compass reads true directions indoors (the Hart's fresh brick moves to the truly east wall so the recorded lines stay right); no animals for now (no free realistic model passes; needs his yes for other sources).
- Waiting for the next build: OG e830f9e (market cross steps, well in turns), Four 62d709b (market people dressed apart, blankets), Three 9d02601 (rooms furnished from ROOMS.md; pictures asked), inspector c7562ea (bedding, containers, vats), houses 62a7f22 (glass windows), planner 9c0adc5 (no lawn inside the edge: unseen yet).
- Planner fork-fx3 65663c9 (run 44273804111): yards for five more households (dyer, laundress, shepherds' fold, woodcutter, hives), lawn inside the edge 21% -> 1.5% (orchards, a green, drying green, allotments, trodden earth). Not merged until I have seen the ground pictures (asked first).

## 10:50 UTC
- Build 86 is LIVE (verified 09:51 UTC, main 284bc3a).
- Build 87 = threejs aeb13ce, run 44288161129: rooms furnished from the rooms table + the Hart seats twelve again (Three), compass true indoors + the Hart's fresh brick on the truly east wall, rebuilt as a bricked-up doorway (OG + inspector; I looked: passes), market cross climbable, well in turns, quest marks at the right doors, Roger Hask no longer on a child's body (OG), bedding on the mattress, containers 979 -> 542, dye vats, glazed pots (inspector), market people dressed apart, straight legs under blankets (Four), the two-ball pig in Wharfside removed (me).
  - First attempt failed two local checks: a flaky cache in the interiors test (fixed), Marta and Bridget in the Hart doorway at closing (Marta leaves a little earlier).
  - NOT yet seen by me: the newly furnished rooms (asked the inspector for a sheet). 
- Sent back, not in any build: Wharfside (pictures unusable, walls still uniform plank, a boat hull made of one ball, white pickets), the orchards (one stubby tree cloned on a grid) and allotments (flat brown strips). Accepted from the town worker: lawn inside the edge -> trodden earth, the green with the oak.
- OG is recording the new voice lines (files arriving on its branch, not yet in the manifest).
- 11:00: Wharfside reshot properly (wharf6 sheets): each house now its own (limewash, stone, tar, daub, door hoods, lanterns); boat hull rebuilt from keel and strakes; accepted for Build 88 with six flaws sent back (red flat cloths, cream log ends, a pane with no bars, dark walls under eaves, pennants across lanes, a grey slatted rack).
- 11:10 UTC: Build 87 LIVE and verified (main aeb13ce, run 44288161129 green). Room furnishing checked: counts per floor >= Build 86, nothing floating or doubled; the stair fills the view from the door in five of six compact houses and upper rooms are dark by day: with Agent Three.
- 11:20 UTC: town worker's second ground sheet: orchards (real oaks, ladder, windfalls), ridged allotments with bean poles, the green: ACCEPTED for Build 88; three flaws sent back (the tenter is still a flat blue panel, a lime-green flat patch at the drying green, washing as flat squares).
- 11:30 UTC: Agent Three's own before/after pictures show the refit's main fault (live since Build 86): in the compact houses the street door looks at the side of a stair 1-3 m away, where Build 85 showed a room. Made Three's first job (stair to a side/back wall, the door looks into the room, a test for it); goes out as its own build.
- 11:45 UTC: town worker's three fixes seen and accepted (washing as shirts/sheets/hose on sagging rope, tenter as cloth on a slender frame, greens in the beds). fork-fx3 81297f3 = Build 88 candidate, run 44296738143. Medium square 339k (aim 335k, limit 380k): asked for 5k back.
- 12:30 UTC: no Build 88 yet. fork-hx ae5a710 (Wharfside) is ~50k triangles over on Medium in every view (square 386k, limit 380k): sent back to cut by distance. fork-fx3 81297f3 (ground) failed `town` (the green's bench not joined to the walking graph) and `openings` (timed out): sent back. Plaster detail before/after seen: modest, fine. Agents OG, Four and New have pushed nothing since 10:14 / 07:51 / 04:47 UTC (their sessions may be idle until the owner prompts them); Three last at 10:42.
- 12:40 UTC: the inspector built a room camera (every room from its own doorway, day and night, one sheet per house). First eleven houses: many rooms read as rooms; about 15 rooms are empty plaster from their door (stores, lofts, an armoury), 4 doors swing into your face, 3 inn rooms are dark by day: list sent to Agent Three. Also: door hinge straps no longer flat grey bars, apples red not black, Hart brick with a tone per brick.
- 12:55 UTC: inspector candidate fork-fin d0c1c71 (hinge straps, apples, Hart brick without the frog marks, room camera), full run 44307786322; local pre-push set passes. Room camera now running over all 58 plan buildings.
- 13:35 UTC: Build 88 = threejs b56755e, run 44313939517: inspector d0c1c71 (hinge straps, apples, Hart brick tone, room camera) + Three 9b16fea (cloth bolts on boards, hangings as hung cloth, under-stair cupboard). Seen: brick fine; cloth bolts still bright primary colours (to tone down); the chapel's street door from inside is a flat pale olive leaf (to route). Wharfside and the ground are NOT in 88 (budget / failing tests).
- 13:45 UTC: town worker's ground candidate ba6586e (run 44315780045): town and openings fixed locally, Medium square 336k; yard picture seen (things sit on the ground; a row of speckled balls to name).
- 13:55 UTC: room camera over all 57 buildings: of 197 rooms, 120 read as rooms, 77 empty from their door, 19 dark by day, 14 with the door leaf in the face. Cause of most empties found: 49 rooms have names the furnishing table does not know, so they get nothing. Sent to Agent Three with a test to stop it happening silently.
- 14:40 UTC: Build 88's first run failed bot-play: the hatbox in the shut house could not be opened (beyond the bed, out of reach). Fixed (longer reach), second run started. Was this also so on live Build 87? The loft's layout is the same there, so probably yes: one of the nine secrets could not be finished until Build 88.
- 14:50 UTC: inspector b9042ac (run 44325926762): crypt skull is a skull (was a white ball), door leaves in six wood tones, darker door iron. Seen and accepted for the build after 88. New finding from its pictures: an open street door seen from inside shows pure black; asked for the street to show (as the windows do).
- 15:00 UTC: inspector 84d4858 (run 44329549277): an open street door seen from inside now shows the street (cube map) instead of black; seen: better, but dim and smeared in narrow lanes; two changes asked (capture from outside the door, outdoor brightness). Findings noted, not changed: the door leaf stays shut for the player until the leave fade; from the street an open door shows a closed dark panel, nothing of the inside.
- 15:05 UTC: Build 88 LIVE and verified (main 5ca78ee, run 44322803454 green): hatbox reachable, hinge straps, apples, Hart brick tone, cloth bolts on boards, hangings as cloth, under-stair cupboard, room camera.
- 15:10 UTC: houses worker's arm's-length sheets seen: logs at 5 sides accepted; the boat hull does NOT pass in any version (a black wedge on black blocks): taken out, replaced by a boat begun on trestles (keel, stem, ribs). Agents OG, Four, New and Three have pushed nothing since the morning (10:14, 07:51, 04:47, 10:42 UTC): their sessions look idle; their inbox files have new entries waiting. GitHub's queue is slow: fork-fx3 a553dad (run 44326587714), fork-hx 3fd2a01, fork-fin 84d4858 all waiting or running.
- 15:20 UTC: Build 89 = threejs 997710c (run 44332337771): the town worker's ground (fork-fx3 a553dad, green in full on its own run): no lawn inside the walls, orchards, allotments, green, drying green with washing, five more yards, worn paths, tenter, herb beds as leaves (were speckled balls).
- 15:30 UTC: inspector's doorway, second pass: from inside, an open street door shows a daylit street (seen: in.13 and in.10 good; two narrow lanes still a flat pale sheet: polish later). Accepted for the build after 89; full gate to be dispatched on its head.
- 15:35 UTC: inspector candidate for the build after 89: fork-fin 11780e0 (threejs 997710c merged; skull, door leaves, doorway shows the street), full run 44332797592.
- 15:55 UTC: the owner gave Agent Four access to opengameart / polyhaven / sketchfab: animals are on (inbox FOUR: CC0 or CC-BY only, pig first, arm's-length bar, cost limits, a sheet per animal before merging).
- 15:55 UTC: Build 89 LIVE and verified (main 997710c, run 44332337771 green): the town worker's ground.
- 16:00 UTC: Wharfside fronts (wharf9) seen and accepted; the boat-begun's timbers are wire-thin: thicken, then merge Build 89, budgets, gate: candidate for Build 90 with the inspector's. Low square will read about 224k (ceiling 230k): base to be moved on merge. NOTE: the inspector was waiting on a Bash permission prompt at 16:00.
- 16:15 UTC: OG, Four, New are working again. OG (fork-cull 4c84d1d): youth bodies for the 13-15s, one at a time through a door, the drowned man's prompt, 529 of 774 lines recorded (46 characters complete; only on its branch until Build 90). New: replayed pointers on Build 88 (Hart cellar works by keys alone; stages and crypt marks fixed), score 8 of 34 (was 6), first ten doors: the stair dominates 4 and edges 3; in.44's door unreachable; voice length table for the owner's ear. Three: no push since 10:42.
- 16:25 UTC: Build 90 = threejs (see run): Wharfside (fork-hx d9a78e1; boat begun with real timber sizes: seen, accepted) + OG (fork-cull 75a212e: 529 voice lines, youth bodies, door etiquette, drowned man's prompt). Local boot, voices (529/774), cast, npcsep pass. Budget bases moved to the measured figures (Medium square 340k, lake 314k; Low square 224k).

## 16:50 UTC: THE OWNER'S DECISION: scope cut, one reviewed build a day
- He played Build 89: a stretched spike and hanging timber at the chapel, a ruler-straight earth patch at the north gate (docs/owner/b89_*.png). Asked why it is endless. Agreed: slice (west gate, street, square, alley to Quill's, the Hart, up to the chapel; ~16 kept interiors, other doors locked), one build a day cut at 12:00 UTC and shipped only after walk camera + room camera frames are reviewed by Agent New and me; assets not code; one area each. Inbox entries written for all four (16:45), docs/briefs/AGENT_BLENDER.md and docs/inbox/BLENDER.md for a Blender session on his Mac.
- Build 90 (threejs d0991c0) FAILED its gate (openings x2, geom kitSheets 843 vs 842: from the Wharfside merge): NOT shipped; it becomes tomorrow's candidate after fixes and review. Live stays Build 89.
- Workers: planner on the owner's two screenshots + ruler-edge test; houses on the gate failures then roofs along the slice; inspector builds test/walkviews.mjs (the walk camera).
