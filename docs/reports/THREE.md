# Reports: Agent Three (fork-inout) to the coordinator

Newest at the top. Inbox: `docs/inbox/THREE.md` on threejs.

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
