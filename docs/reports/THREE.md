# Reports: Agent Three (fork-inout) to the coordinator

Newest at the top. Inbox: `docs/inbox/THREE.md` on threejs.

## 2026-11-18 (morning): every district done once; 36 of 57 pass

**Hash:** the commit that adds this entry; a full gate dispatched on it (number in the next entry). All 57 buildings are now refitted.

### What changed since the last entry

- Wharfside, Highfold, Riverside, Westgate: `in.20 in.23 in.34 in.36 in.37 in.38 in.51 in.60 in.111 in.113 in.115 hunter fisher
  high.a high.c mill farm in.65 in.75 in.93` on the compact plan (the brewer's, the farm's and the mill's keep their trade sets in the
  front room). Pictures: `docs/proof/inout/<id>/` for each.
- The compact plan puts its partitions where they clear the shell's windows, so a window never has to slide off its place (it may
  slide 0.5 m at most now, was 1 m). Every room has a light. The household's place (`home`) is in the front room when the kitchen
  is small (three Byrds stood in one spot in a 12 m2 kitchen).
- Ladder lofts also for two-storey houses whose shell shows windows above (none found yet: the dormers are not read; see below).

### Counts (`test/inout.js`)

| | step 1 | now |
|---|---|---|
| passing | 0 | **36** |
| plan over 1.5 times the shell | 57 | **0** (median 1.46, all 1.26 to 1.5) |
| storeys differ | 25 | 2 (`in.10`, `in.33`) |
| upper doors and balconies unserved | 10 | 0 |
| windows outside / inside / same place | 363 / 1,030 / 112 | 355 / 318 / 308 (and 23 outside that open into the next house) |
| cellars with no sign outside | 21 | 6 (`inn`, `elder`, `chapel`, `draper`, `in.33`, `in.37`) |

The 21 that still fail, and why:

- Cellar sign only (outside): `chapel`, `draper`.
- Windows that are the outside's to fix: the generated end-wall faces (`shellDress` in `72c_infill.js`, "a real face for a blank
  end") are drawn after the interiors are laid out, so no plan can follow them, and most sit 1.3 m from the wall's own windows:
  `in.04 in.20 in.23 in.34 in.36 in.37 in.38 in.40 in.44 in.51 in.60 in.111 in.113 in.115`, `mill`. Ask: drop the face windows on
  houses that are entered (their windows come from the plan now), or have them read `P.windows`.
- `in.10`, `in.33`: a dormer the test sees and the plan reader does not (dormer glass is not recorded yet); mine, next.
- `inn`, `elder`: one window each more than 0.6 m off; mine, next.

### Gate (this machine, after the last fixes)

boot, quest, npcstairs, story, secrets, overlap, parity, bot-story, view, cast, memory, owners, embers, interiors (57), stairs (all),
apart pass. `people` fails only on "4 people have exactly the same day" (the chance finding in the previous entry).

### Open for you

1. The stair seen from the street door in the compact houses (entry before last): I will move it to the back corner of the kitchen
   where the house is 7 m deep or more unless you say otherwise.
2. The `people` same-day check: routines, not plans.
3. The end-wall face windows: outside.
4. ROOMS.md line by line for the 48 compact houses: not done. They have the trade set, the table by the fire, a cabinet, shelves,
   a barrel, beds by the cast, a candle by wealth, one memorable object each.

## 2026-11-18 (night, later): ladder lofts; merge candidate 156f642

**Merge candidate:** 156f642 (threejs merged in; one conflict in the Hart's bar, both sides kept: the [fin] shorter counter and my
shallower common room, second standing place and kegs off the window). Full gate dispatched on GitHub for it (the earlier run 261
was cancelled by a later push). The quick gate on 4cecbd0 before the merge: 18 of 19 pass, `overlap` failed on the loft's 2.3 m
walls, fixed in 4cecbd0 itself (severe 0 after).

**One finding you need to route:** after the merge, `people` flags "4 people have exactly the same day": Ulric Ferrin, Emmet Sele,
Joyce Byrd, Bridget Malkin. Two of the four live in houses I have not touched (`in.75`, `in.115`). On clean threejs their days
differ by one or two hours each (`sito` at 15 h, `idl` in the evening): small differences in who claims which spot first, not
different lives. Changing any plan shifts those claims, so this check will keep failing by chance until the generated routines of
helpers and children differ by design. That is the routines' owner's, not mine; I have not touched the test.

### The ladder (inbox 06:20)

- `inoutLadder` and `inoutTrap` in `71b_storeys.js` (marked, additive): two stiles, rungs every 0.28 m, 75 degrees, the stiles 0.9 m
  above the trap; the trap framed with its lid standing open. `pLadder` in the plan engine: the hole in the loft floor, the ladder
  against a side wall of the room below, two prompts ("Climb the ladder" / "Climb down") moving the player between landing points
  inside the cell. Tested both ways by the prompt (up 2.65 m, down again). Villagers do not use it; the validator counts it as a way.
- `shop.n2`, `shop.n4`, `shop.s1` have their loft (2.4 m, floor with thickness, the shell's third-storey windows, sacks, crates, a
  chest, a lantern). All three pass every check now. Picture: `docs/proof/inout/shop.n2/loft_trap_and_window.jpg`.
- `test/inout.js`: a loft lit by the shell's own windows counts as that storey; inside windows and doors are carried onto the shell
  through the house's transforms, so the chapel (entered at its gable) now compares: 8 / 8 in the same place.

### Counts (`test/inout.js`, all 57)

| | step 1 | Market Place done | now |
|---|---|---|---|
| passing | 0 | 1 | **10** |
| plan over 1.5 times | 57 | 47 | 19 |
| storeys differ | 25 | 22 | 11 |
| upper doors and balconies unserved | 5 + 5 | 2 + 2 | 0 + 0 |
| windows inside / outside / same place | 1,030 / 363 / 112 | 911 / 377 / 202 | 534 / 377 / 261 |
| cellars with no sign outside | 21 | 21 | 9 |

Next: Wharfside (the largest: 15), then Riverside (mill, farm) and Westgate. Still open from earlier: the stair seen from the door
in the compact houses (I will do (a), the stair in the kitchen corner, where the house is 7 m deep or more, unless you say otherwise).

## 2026-11-18 (night): Chapelgate

**Hash:** the commit that adds this entry. Decisions still open: the stair seen from the door (Market Place infill entry) and the
alley shops' third storey (alley entry).

### What changed

- `chapel`: 10 x 16 inside a 14 x 8 shell (1.43; was 18 x 12, out of line with the shell). The shell's door is in its gable end,
  so the nave runs 12.5 m from the door to the altar; the sacristy (Aldous's cot, the chest with the crypt key, the crypt stair) and
  the bell chamber (bell, rope, `bell`) are behind the altar wall; the crypt is under the nave behind its gate; the eight stained
  lancets are where the shell has them. `chapel.book`, `chapel.sacristy`, `chapel.relic`, `chapel.gate`, `bell` all kept; story,
  secrets, quest and the story bot pass. The old west tower room is gone: the shell shows no tower.
- `in.33 in.45 in.66 in.67 in.70 in.77 in.82`: the compact plan. `in.33` (the merchant's) keeps a cellar.
- All compact houses: the stair well is 0.5 m longer at the foot (a jump down it hit the slab), a fire never stands under a stair
  head (its stack blocked the top of `in.33`'s stair), and the second place by the fire is its own spot (two Varrows stood in one).

### Counts (`test/inout.js`, all 57)

passing 7 (was 6), plan over 1.5 times 19 (was 26), storeys differ 14, windows inside 530 (outside 377, 239 in the same place),
cellars with no sign 9. The chapel's windows count 8 / 8 but "0 in the same place": the test compares walls by the plan's own
front, which for a building entered at its gable end is the shell's side. The test needs the plan's walls turned to the shell's
before it compares; next on my list (it is a test fault, not a plan fault: see `docs/proof/inout/chapel/front.jpg` against
`level0.jpg`). `in.33` shows two storeys and a dormer: its roof space is not a room yet.

### Gate (this machine, 28 refitted houses)

interiors, stairs (all, by input), people, apart, npcstairs, cast, story, secrets, quest, parity, cells (chapel and the seven),
bot-story, embers, overlap pass.

### Pictures

`docs/proof/inout/chapel/` (front, crypt, nave from the door), `docs/proof/inout/in.33 ... in.82/`. The chapel nave reads well. The
houses: same as the Market Place infill, the stair is the first thing seen and the rooms are dark (light tier 0 and 1).

### Outside list, Chapelgate

1. `chapel`: cellar (crypt) sign: none needed if the crypt is entered only from inside; say if you want a grating.
2. `in.33`: cellar sign, back wall; the dormer has no room behind it.
3. Per house, windows into neighbours and rooms wanting a window: `docs/INOUT.md`, For the outside worker.

## 2026-11-18 (later still): the six alley shops

**Decision needed: the third storey of `shop.n2`, `shop.n4`, `shop.s1`.** A 24 m2 floor cannot take two straight flights (each 2.7 to
3.2 m with its landing), and the engine has only straight stairs. A steep corner (winder or ladder) stair is stair geometry
(`71b_storeys.js`, the stair worker's). Taken meanwhile (easy to undo): shop below, chamber above, one flight; those three still
show a third storey outside with nothing behind it (`test/inout.js` counts them as failing storeys). Choices: (a) the stair worker
adds a corner stair 1.2 x 1.2 m that I can place, and I add the loft; (b) the outside loses the third storey on those three; (c) a
ladder through a trap door (also stair geometry).

**Hash:** the commit that adds this entry.

### What changed

| id | shell | plan, area x | storeys out / in | windows out / in / same place | balcony door |
|---|---|---|---|---|---|
| `shop.n2` | 4 x 4 | 5.5 x 4, 1.38 (was 5.3) | 3 / 2 | 3 / 2 / 2 | |
| `shop.n3` | 6 x 4 | 6.5 x 5.5, 1.49 (was 4.0) | 2 / 2 | 2 / 2 / 2 | yes, walkable onto the gallery over the alley |
| `shop.n4` | 4 x 4 | 5.5 x 4, 1.38 (was 6.0) | 3 / 2 | 3 / 2 / 2 | |
| `shop.s0` | 4 x 4 | 5.5 x 4, 1.38 (was 6.0) | 2 / 2 | 2 / 2 / 2 | |
| `shop.s1` | 6 x 4 | 6.5 x 5.5, 1.49 (was 3.5) | 3 / 2 | 4 / 2 / 2 | yes |
| `shop.s2` | 6 x 4 | 6.5 x 5.5, 1.49 (was 3.5) | 2 / 2 | 3 / 3 / 3 | |

`shop.n3`, `shop.s0` and `shop.s2` pass every check. The 4 m shops are 5.5 m wide inside (the narrowest a straight stair along the
back wall fits), which is 1.38 times the shell. The alley's facades are drawn after the plans are built, so their openings are read
from the facade rule in `ALLEY_SHOPS` (`alleyOpenings`, `72d_plan.js`). All six lost their cellars (no room for a second stair).
The 4 m shops have no fire (no wall left for one).

### Counts (`test/inout.js`, all 57)

passing 6 (was 3), plan over 1.5 times 26 (was 32), unserved upper doors and balconies 0 (was 2 + 2), windows inside 607 (outside 377,
224 in the same place), cellars with no sign 11 (was 17).

### Gate (this machine)

interiors (six), stairs (six), people, npcstairs, cast pass; standing on both balconies holds at the floor height. Not run: the full
gate (the run for the kit buildings is GitHub run 261 on 18bddd8).

### Pictures

`docs/proof/inout/shop.*/front.jpg`, `level0.jpg`, `level1.jpg`, `out_of_the_upper_door.jpg` (n3, s1). Looked at all. The upper
rooms are too alike (bed, chest, bench under the window): they need the ROOMS.md lines, not yet done for these six.

### Outside list, the alley

1. `shop.n2`, `shop.n4`, `shop.s1`: the third storey, as above.
2. `shop.n2`, right wall, levels 0 and 1, 3.4 and 3.1 m back from the front: windows into the next shop (from the step 1 table).
3. No cellar signs needed any more on the six (no cellars).

## 2026-11-18 (later): Market Place, the fifteen infill houses (not a merge candidate yet)

**Decision needed: see "Open" below.** Taken without asking: these houses go through one new compact plan instead of the six families
(the families are 8 to 12 m whatever the shell and cannot shrink to 7 x 6). Easy to undo: `INOUT_FIT` in `72k_houses.js` lists the
houses that use it; take an id out and the house goes back to its family.

**Hash:** the commit that adds this entry. Full gate on GitHub for the kit buildings: run 261 on 18bddd8 (queued when written).

### What changed

`in.02 in.04 in.07 in.08 in.10 in.12 in.13 in.15 in.21 in.40 in.44 in.74 in.90 in.94 in.116`: each is 1.37 to 1.5 times its shell
(was 2.2 to 4.5). Front room across the street front (work room, shop or hall by trade), the stair along its back wall, store or
pantry and kitchen or chamber behind, the shell's two storeys upstairs or a loft under one storey, the shell's windows only. Mirrored
house by house (hash of the id) and the back rooms split 45, 50 or 55 percent. Cellars only where the stair fits (`in.15`, `in.44`,
`in.116` lost theirs; `in.10` had one and lost it): four fewer cellars with nothing outside to show them.

### Counts (`test/inout.js`)

| | before this push | after |
|---|---|---|
| buildings passing | 1 | 3 (`smithy`, `in.02`, `in.13`) |
| plan over 1.5 times the shell | 47 | 32 |
| storeys differ | 22 | 17 |
| windows inside, all 57 | 911 | 732 (outside 377; 216 in the same place) |
| cellars with no sign outside | 21 | 17 |

The other thirteen fail only on windows: mostly a window the corner rule moved more than 0.6 m, and the generated end-wall windows
counted twice. Not yet looked at house by house.

### Gate (this machine)

interiors (all fifteen), stairs (all), people, npcstairs pass after the fixes in this commit. Before the last two fixes:
boot, quest, story, secrets, overlap, parity, cells (8 of them), bot-story, cast, apart passed. Not rerun after the mirroring: cells, bot-story.

### Open: the stair is the first thing you see

Pictures `docs/proof/inout/in.*/level0.jpg`: in a 7 x 6 house the straight stair (3.2 m) along the front room's back wall fills the
view from the street door with its boarded side, in every house. The plan engine has only straight stairs. Choices, my preference
first: (a) the stair in the back corner of the kitchen against the gable wall, rising along it, the kitchen made deeper and the
front room shallower (needs D of 7 m or more; about half of these); (b) a winder or ladder stair (new geometry in `71b_storeys.js`,
not mine); (c) leave it. I go on with the alley shops meanwhile and will do (a) where it fits unless you say otherwise.

### ROOMS.md

The compact houses are dressed generically: trade set, table by the fire, cabinet, shelves, barrel, beds by the cast, candle by
wealth, one memorable object each (`hMemo`). The room-by-room lines of ROOMS.md for these fifteen are not done yet.

### Outside list, Market Place infill (see `docs/INOUT.md`, section For the outside worker)

Windows that open into a neighbour and rooms with no window are listed there by house; I have not checked them by picture yet.

## 2026-11-18: Market Place, the eight kit buildings (step 3, first district)

Taken without asking (easiest to undo): the Market Place district is split in two pushes. This one is the eight kit buildings round
the square (`inn`, `smithy`, `store`, `elder`, `herbalist`, `guardhouse`, `weaver`, `draper`). The fifteen infill houses of the same
district (`in.02` ... `in.116`) come next, before the alley shops, because they all go through the family layouts in `72k_houses.js`.
Those layouts have to be made to take their size from the shell first. Say if you want the alley shops first instead.

**Hash:** the commit that adds this report (see `git log -1 docs/reports/THREE.md`). Quick gate on the commit before it, b86093a: 18 of 19 pass;
`bot-story` failed (`door.tunnel.in`: a filler bench stood in front of the smugglers' door in the Hart's cellar). Fixed in this commit
(that corner of the cellar is kept clear); `playbot --run story` passes again, 45 steps, 0 bugs. A full gate run on GitHub follows.

### What changed, one line a building

| id | before: plan, area x shell, windows out / in (same place) | after |
|---|---|---|
| `smithy` | 14 x 12, 2.2, 3 / 19 (1) | 12 x 8, 1.44, 3 / 3 (3). One storey and a sleeping loft under the rafters (level marked `loft`). Forge, family room, coal store. **Passes every check.** |
| `elder` | 14 x 14, 4.9, 9 / 21 (3) | 8.5 x 7, 1.48, 9 / 8 (7). Hall and study; Rowan's chamber and the unused solar above (rocker to the window); strongroom below with `elder.strongbox`. |
| `herbalist` | 10 x 11, 3.0, 5 / 10 (0) | 8.5 x 6.5, 1.49, 4 / 4 (3). Front room where she sells, stillroom with the still and her fire, her chamber with the fire, bed and rocker. |
| `guardhouse` | 12 x 11, 3.3, 7 / 26 (4) | 8.5 x 7, 1.48, 4 inside of 7 outside (3 of the 7 open into the neighbours). Guard room, cell with bars, armoury; barracks above with **the door onto the balcony** (walkable, rails). |
| `weaver` | 10 x 12.5, 2.0, 8 / 15 (0) | 9 x 7.5, 1.48, 8 / 8 (6). Loom room across the front, kitchen behind; Hilda's and Pip's beds and the wool store above. The roofed yard is gone (the yard is outside). |
| `draper` | 8 x 12, 2.7, 7 / 24 (2) | 7.5 x 7, 1.46, 5 inside of 7 outside (2 open into `shop.n2`). Shop and back room; Sabina's room with **the balcony door**, Anselm's room; wool cellar. |
| `inn` | 14 x 13, 1.3, 15 / 28 (5) | same size, 7 / 7 (6). Windows only where the shell has them. **The cellar (inbox item 4):** a door in the back wall of the common room (a real leaf standing open) onto a passage behind it; the cellar stair goes down from the passage, and the kitchen and keeper's room open off it. The bar moved forward 1.2 m to fit. Nobody had done it first. |
| `store` | done earlier (Build 83) | unchanged. |

Engine (`72d_plan.js`): `pFitBox` (the plan's rectangle at 1.5 times the shell, the street door where the shell has it), `pPiece`
(a kit piece by its ROOMS.md name with its own box), windows read also from glass in generated shell pieces and from the openings the
generated infill walls were built from, `pWinSnap` (a window keeps off corners and partitions, moved at most 1 m), a window that opens
into the next house is left out inside, two openings drawn on top of each other: one kept inside.

### Counts (`test/inout.js`, all 57)

| | step 1 | now |
|---|---|---|
| buildings failing / passing | 57 / 0 | 56 / 1 (`smithy`) |
| plan over 1.5 times the shell | 57 (old 15% rule) | 47 |
| upper doors and balconies with no door inside | 5 + 5 | 2 + 2 (`shop.n3`, `shop.s1`) |
| windows outside / inside | 363 / 1,030 | 377 / 911 |
| outside windows with one in the same place inside | 112 | 202 |

In the eight, what still fails: `inn` windows (one of 7 more than 0.6 m from its place) and cellar sign; `elder` windows (the
clash below) and cellar sign; `herbalist`, `weaver` one or two windows moved more than 0.6 m off their place by the corner rule;
`guardhouse`, `draper` windows that open into the neighbours (outside); `store`, `draper` cellar signs (outside).

### Gate

On this machine for the district: boot, quest, stairs, npcstairs, story, secrets, interiors, overlap (severe 0, solid 6), parity,
cells (all eight), cast, people, embers, view, apart all pass. `cells` with a short `--cells` list starting at `smithy` failed on
a clean threejs too before 431f9fb; it passes after the merge. 
Not run here: the full gate (a merge candidate run will be started on GitHub).

### Pictures (in the branch)

`docs/proof/inout/<id>/front.jpg`, `level-1.jpg` / `level0.jpg` / `level1.jpg` (from the street door or the stair head),
`out_of_the_upper_door.jpg` (guardhouse, draper), and for the Hart `cellar_door_from_the_common_room.jpg` and
`passage_cellar_stair.jpg`. I looked at all of them. Weak ones: the smithy's and the guardhouse's front pictures are blocked by a
lean-to and a wall (the camera rule is crude); the guardhouse's view out of its upper door looks down onto a roof right in front of
the balcony (check from the street: that roof may be the outside worker's).

### Not verified headless

Flicker and z-fighting in motion, sound, frame rate on a phone. Walking onto the guardhouse and draper balconies by keys (placed and
stood on, not walked into the rails). Whether the Hart's open cellar leaf reads well in motion (it stands open into the common room).

### ROOMS.md: furnished, and what was not

Furnished from ROOMS.md by name where the piece exists: cabinets, shelves, chests, candlesticks and lanterns by the light tier,
beds by the cast (`castBeds`), the Elder's chair, buckler, bread baskets, worn bookcase, lectern, candle stand, rocker; Maren's rocker
by the fire; the Warden's stands, shields, dummy, Hugh Alder's arrows; the weaver's yarn baskets; the draper's dress form, rocker,
wool crates. No filler pass (`hFinish` not called on the refitted houses).
Not done yet: container contents per household (the containers are the engine's; their contents are not changed), "one thing only
here" for most rooms. Named in ROOMS.md with no kit piece (not built from boxes): Tobin's straw pallet, the two stripped barracks
frames, Pip's slate, tenter frames and washing (the weaver's yard is outdoors), the cloth press, the yardstick, the roster board.

### Outside list, Market Place (house, wall, level, where, what)

Walls as in `WALLS` (71_house.js): front is the door wall; left and right seen from inside looking out of the front door.

1. `store`, the three already with the outside worker (balcony rail, kitchen window, cellar sign).
2. `guardhouse`, left wall, level 1, 2.8 m back from the front: window opens into `in.10`: remove.
3. `guardhouse`, right wall, level 0 at 2.0 m and level 1 at 2.8 m back from the front: two windows open into `in.41`: remove.
4. `draper`, left wall, level 0 at 3.1 m and level 1 at 2.8 m back: two windows open into `shop.n2`: remove.
5. `smithy`, back wall, level 0, 2.4 m from the middle toward the right: window opens into `in.10`: remove.
6. `elder`, back wall, level 1: a kit window at 0.9 m left of the middle and a generated end-wall window at the middle are drawn
   less than 1 m apart: remove the generated one.
7. Cellar signs (hatch with two leaves against the wall, or three steps down to a low door): `inn` back wall, middle (the kitchen
   side); `elder` back wall, 2.3 m left of the middle; `draper` back wall, middle.
8. Rooms with an outside wall and no window in the shell (a window wanted there): `smithy` coal store, back wall 2 m right of the
   middle, level 0; `smithy` loft, left wall 3.5 m back, level 1 (a gable window); `guardhouse` armoury, back wall 1.7 m right of the
   middle, level 0; `draper` back room, back wall, middle, level 0; `inn` keeper's room, back wall 3.8 m right of the middle, level 0.
9. Windows above the eaves with no room behind them (the gable and the dormer are roof space): `store` front gable, `elder` front
   dormer, `inn` both gable ends. Either they go, or the roof space becomes a loft room (my side): say which.
