# Inside against outside: all 57 enterable buildings

Written by `test/inout.js` (build Build 83): `node test/audit/run.mjs --opt audit=1 test/inout.js`. Do not edit by hand.
The outside is read off the drawn shell (window, door and balcony pieces; the openings the generated walls were built from; glass in gables, dormers and end walls); the inside is the plan.
A floor may be up to 1.5 times the shell's area; places along a wall are compared after scaling the plan's wall to the shell's; a loft under the rafters is not a storey.
Cannot tell: whether a window that matches by count also looks the same size and style, anything a roof or a neighbour hides, cellar signs drawn into a larger mesh (the inn's hatch).

## Totals

| | |
|---|---|
| Buildings / failing at least one of the five checks | 57 / **47** |
| 1. Storeys shown outside differ from levels above ground inside | **11** (outside shows more: 1; inside holds more: 10) |
| 2. A floor is more than 1.5 times the shell's area | **19** (ground floor area over shell area: least 1.26, median 1.48, worst 4.46) |
| 3. Upper doors outside / with no door inside on that wall and level | 5 / **0** |
| ... balconies outside / with no door onto them | 5 / **0** |
| ... upper doors inside that open onto nothing outside | **0** |
| 4. Windows outside / inside | 377 / 534 |
| ... difference summed per wall and level / outside windows with an inside window in the same place | **275** / 261 of 377 |
| ... buildings whose windows do not all match | **45** |
| 5. Cellars inside / with nothing outside that shows one | 9 / **9** |

## Every building

Storeys: walls to the eaves in 3 m storeys, "+r" = windows above the eaves (gable or dormer) counted as one more. Footprint in metres, w x d; plan = the ground floor rooms without yards.
Windows by wall (F front, B back, L left, R right seen from inside the front door) and level: outside/inside. Fails: s storeys, f footprint, d upper door or balcony, w windows, c cellar.

| id | name | storeys out | levels in | eave m | shell | plan | area x | upper doors out | balconies | upper doors in | unserved | windows out / in | same place | windows by wall and level | cellar | sign | fails |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `inn` | The Honeyed Hart | 1+r | 2 | 3.7 | 15 x 9.6 | 14 x 13 | 1.26 |  |  |  |  | 7 / 7 | 6 | F 0:4/4 1:0/1 roof:1/0; B 0:1/1; R 0:1/1 | yes |  | w c |
| `smithy` | Brandt’s Forge | 1 | 1+loft | 3.1 | 9.5 x 7 | 12 x 8 | 1.44 |  |  |  |  | 3 / 3 | 3 | F 0:1/1; B 0:1/1; R 0:1/1 |  |  |  |
| `store` | Quill’s Sundries | 2 | 2 | 6.1 | 8.4 x 6.6 | 10 x 8 | 1.44 | front L1 | front L1 | front L1 |  | 8 / 8 | 8 | F 0:1/1 1:1/1; B 0:1/1 1:1/1; L 0:1/1 1:1/1; R 0:1/1 1:1/1 | yes |  | c |
| `elder` | Rowan’s Cottage | 2 | 2 | 6.1 | 7.2 x 5.6 | 8.5 x 7 | 1.48 |  |  |  |  | 9 / 8 | 7 | F 0:1/1 1:1/1; B 0:1/1 1:2/1; L 0:1/1 1:1/1; R 0:1/1 1:1/1 | yes |  | w c |
| `herbalist` | Maren’s Cottage | 1 | 1 | 3.1 | 6.6 x 5.6 | 8.5 x 6.5 | 1.49 |  |  |  |  | 4 / 4 | 3 | F 0:1/1; B 0:1/1; L 0:1/1; R 0:1/1 |  |  | w |
| `guardhouse` | Warden’s Lodge | 2 | 2 | 6.1 | 7.2 x 5.6 | 8.5 x 7 | 1.48 | front L1 | front L1 | front L1 |  | 7 / 4 | 4 | F 0:1/1 1:1/1; B 0:1/1 1:1/1; L 1:1/0; R 0:1/0 1:1/0 |  |  | w |
| `weaver` | Riverside Cottage | 2 | 2 | 6.1 | 7.6 x 6 | 9 x 7.5 | 1.48 |  |  |  |  | 8 / 8 | 6 | F 0:1/1 1:1/1; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `chapel` | Chapel of the Dawn | 1 | 1 | 4.6 | 14 x 8 | 10 x 16 | 1.43 |  |  |  |  | 8 / 8 | 8 | F 0:4/4; B 0:4/4 | yes |  | c |
| `mill` | Dunn’s Mill | 2 | 2 | 6.1 | 7.4 x 6.4 | 10 x 12.5 | 1.94 |  |  |  |  | 8 / 15 | 4 | F 0:2/4 1:1/3; B 0:0/2 1:1/0; L 0:1/2 1:1/0; R 0:1/1 1:1/3 |  |  | f w |
| `farm` | Fairweather Farm | 1 | 2 | 3.1 | 8 x 6 | 12 x 13 | 3.25 |  |  |  |  | 3 / 23 | 1 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/3; R 0:0/4 1:0/4 |  |  | s f w |
| `hunter` | Wren’s Cabin | 1 | 1 | 3.1 | 6.2 x 5.2 | 7 x 8 | 1.74 |  |  |  |  | 2 / 7 | 0 | F 0:1/1; B 0:1/2; L 0:0/2; R 0:0/2 |  |  | f w |
| `fisher` | Fisher’s Hut | 1 | 2 | 3.1 | 5.2 x 4.6 | 8 x 8 | 2.68 |  |  |  |  | 1 / 14 | 1 | F 0:1/2; B 0:0/2 1:0/2; L 0:0/2 1:0/2; R 0:0/2 1:0/2 |  |  | s f w |
| `draper` | Lindqvist’s Draper | 2 | 2 | 6.1 | 6.4 x 5.6 | 7.5 x 7 | 1.46 | front L1 | front L1 | front L1 |  | 7 / 5 | 4 | F 0:2/2; B 1:1/1; L 0:1/0 1:1/0; R 0:1/1 1:1/1 | yes |  | w c |
| `shop.n2` | Shop | 3 | 3 | 8.8 | 4 x 4 | 5.5 x 4 | 1.38 |  |  |  |  | 3 / 3 | 3 | F 0:1/1 1:1/1 2:1/1 |  |  |  |
| `shop.n3` | Shop | 2 | 2 | 5.8 | 6 x 4 | 6.5 x 5.5 | 1.49 | front L1 | front L1 | front L1 |  | 2 / 2 | 2 | F 0:2/2 |  |  |  |
| `shop.n4` | Shop | 3 | 3 | 8.8 | 4 x 4 | 5.5 x 4 | 1.38 |  |  |  |  | 3 / 3 | 3 | F 0:1/1 1:1/1 2:1/1 |  |  |  |
| `shop.s0` | Shop | 2 | 2 | 5.8 | 4 x 4 | 5.5 x 4 | 1.38 |  |  |  |  | 2 / 2 | 2 | F 0:1/1 1:1/1 |  |  |  |
| `shop.s1` | Shop | 3 | 3 | 8.8 | 6 x 4 | 6.5 x 5.5 | 1.49 | front L1 | front L1 | front L1 |  | 4 / 4 | 4 | F 0:2/2 2:2/2 |  |  |  |
| `shop.s2` | Shop | 2 | 2 | 5.8 | 6 x 4 | 6.5 x 5.5 | 1.49 |  |  |  |  | 3 / 3 | 3 | F 0:2/2 1:1/1 |  |  |  |
| `in.02` | Cooper’s House | 1 | 1+loft | 3 | 6.4 x 5.2 | 7.5 x 6.5 | 1.46 |  |  |  |  | 4 / 4 | 4 | F 0:1/1; B 0:2/2; R 0:1/1 |  |  |  |
| `in.04` | Fletcher’s House | 2 | 2 | 6 | 6.4 x 5.8 | 7.5 x 7 | 1.41 |  |  |  |  | 12 / 7 | 5 | F 0:1/1 1:3/3; B 0:2/0 1:1/0; L 0:1/0 1:1/1; R 0:2/1 1:1/1 |  |  | w |
| `in.07` | Potter’s House | 1 | 1+loft | 3 | 5.4 x 5 | 6 x 6.5 | 1.44 |  |  |  |  | 4 / 3 | 3 | F 0:1/1; B 0:2/2; R 0:1/0 |  |  | w |
| `in.08` | Alder House | 2 | 2 | 6 | 5.6 x 6 | 7 x 7 | 1.46 |  |  |  |  | 10 / 7 | 7 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/0; R 0:1/0 1:1/0 |  |  | w |
| `in.10` | Baker’s House | 1 | 2 | 3 | 5.4 x 5 | 6 x 6.5 | 1.44 |  |  |  |  | 6 / 3 | 2 | F 0:1/1; B 0:2/2; L 0:1/0; R 0:2/0 |  |  | s w |
| `in.12` | Hobb’s Cottage | 2 | 2 | 6 | 6 x 5 | 7.5 x 6 | 1.5 |  |  |  |  | 10 / 10 | 8 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.13` | Tanner’s House | 1 | 1+loft | 3 | 6 x 5.6 | 7 x 7 | 1.46 |  |  |  |  | 4 / 4 | 4 | F 0:1/1; B 0:2/2; R 0:1/1 |  |  |  |
| `in.15` | Grocer’s House | 2 | 2 | 6 | 5.6 x 6 | 7 x 7 | 1.46 |  |  |  |  | 10 / 10 | 8 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.20` | Chandler’s House | 1 | 2 | 3 | 6 x 4.4 | 8 x 12 | 3.64 |  |  |  |  | 6 / 24 | 5 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:1/4 1:0/4; R 0:2/4 1:0/4 | yes |  | s f w c |
| `in.21` | Dyer’s House | 2 | 2 | 6 | 6.4 x 5 | 8 x 6 | 1.5 |  |  |  |  | 10 / 10 | 8 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.23` | Widow Hale’s House | 1 | 1 | 3 | 5 x 5 | 7 x 8 | 2.24 |  |  |  |  | 6 / 7 | 4 | F 0:0/1; B 0:3/2; L 0:1/2; R 0:2/2 |  |  | f w |
| `in.33` | Merchant’s House | 2+r | 2 | 6 | 7.6 x 5 | 9.5 x 6 | 1.5 |  |  |  |  | 11 / 10 | 8 | F 0:1/1 1:2/2 roof:1/0; B 0:2/2 1:2/2; L 1:1/1; R 0:1/1 1:1/1 | yes |  | s w c |
| `in.34` | Wren Cottage | 1 | 2 | 3 | 7.6 x 6.2 | 9 x 12 | 2.29 |  |  |  |  | 5 / 22 | 2 | F 0:1/2 1:0/1; B 0:2/2 1:0/3; L 0:1/4 1:0/3; R 0:1/4 1:0/3 |  |  | s f w |
| `in.36` | Mason’s House | 2 | 2 | 6 | 7 x 5 | 10 x 12.5 | 2.16 |  |  |  |  | 14 / 16 | 6 | F 0:1/4 1:2/0; B 0:3/1 1:3/3; L 0:1/4 1:1/3; R 0:2/1 1:1/0 |  |  | f w |
| `in.37` | Cutler’s House | 1 | 2 | 3 | 7 x 5.6 | 6 x 14 | 2.14 |  |  |  |  | 6 / 22 | 2 | F 0:1/0 1:0/2; B 0:2/2 1:0/2; L 0:1/4 1:0/4; R 0:2/4 1:0/4 | yes |  | s f w c |
| `in.38` | Marsh House | 2 | 2 | 6 | 7 x 4.4 | 8 x 12.5 | 3.25 |  |  |  |  | 13 / 20 | 7 | F 0:1/2 1:2/0; B 0:2/2 1:3/2; L 0:1/4 1:1/3; R 0:2/4 1:1/3 |  |  | f w |
| `in.40` | Scribe’s House | 1 | 1+loft | 3 | 5.4 x 4.4 | 6 x 5.5 | 1.39 |  |  |  |  | 6 / 4 | 4 | F 0:1/1; B 0:3/2; R 0:2/1 |  |  | w |
| `in.44` | Cobbler’s House | 2 | 2 | 6 | 5 x 5.2 | 5.5 x 7 | 1.48 |  |  |  |  | 9 / 8 | 8 | F 1:3/2; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.45` | Tinker’s House | 1 | 1+loft | 3 | 5.6 x 5.8 | 6.5 x 7 | 1.4 |  |  |  |  | 4 / 4 | 4 | F 0:1/1; B 0:2/2; R 0:1/1 |  |  |  |
| `in.51` | Basketmaker’s House | 2 | 2 | 6 | 5 x 5.2 | 6 x 8 | 1.85 |  |  |  |  | 11 / 12 | 2 | F 1:3/0; B 0:3/2 1:1/2; L 0:1/2 1:1/2; R 0:1/2 1:1/2 |  |  | f w |
| `in.60` | Garrick’s House | 1 | 2 | 3 | 5 x 5.2 | 6 x 8 | 1.85 |  |  |  |  | 6 / 12 | 3 | B 0:3/2 1:0/2; L 0:1/2 1:0/2; R 0:2/2 1:0/2 |  |  | s f w |
| `in.65` | Ropemaker’s House | 2 | 2 | 6 | 5.6 x 4.4 | 10 x 12.5 | 3.73 |  |  |  |  | 10 / 15 | 5 | F 0:1/2 1:3/0; B 0:2/1 1:1/3; L 0:0/2 1:1/0; R 0:1/4 1:1/3 |  |  | f w |
| `in.66` | Saddler’s House | 1 | 1+loft | 3 | 8.04 x 4.6 | 10 x 5.5 | 1.49 |  |  |  |  | 4 / 3 | 3 | F 0:1/1; B 0:2/2; R 0:1/0 |  |  | w |
| `in.67` | Bram’s House | 2 | 2 | 6 | 5.6 x 4.6 | 6 x 6 | 1.4 |  |  |  |  | 10 / 9 | 9 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/0; R 0:1/1 1:1/1 |  |  | w |
| `in.70` | Tailor’s House | 1 | 1+loft | 3 | 5.6 x 5 | 6 x 7 | 1.5 |  |  |  |  | 4 / 3 | 3 | F 0:1/1; B 0:2/2; R 0:1/0 |  |  | w |
| `in.74` | Thorne House | 2 | 2 | 6 | 6.2 x 5 | 7.5 x 6 | 1.45 |  |  |  |  | 10 / 10 | 8 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.75` | Ferrin’s House | 1 | 1 | 3 | 5.6 x 4.6 | 6 x 7 | 1.63 |  |  |  |  | 4 / 6 | 3 | F 0:1/0; B 0:2/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `in.77` | Wheelwright’s House | 2 | 2 | 6 | 6.2 x 5 | 7.5 x 6 | 1.45 |  |  |  |  | 10 / 10 | 8 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.82` | Tamsin’s House | 1 | 1+loft | 3 | 5 x 5.4 | 5.5 x 7 | 1.43 |  |  |  |  | 3 / 2 | 2 | B 0:2/2; R 0:1/0 |  |  | w |
| `in.90` | Woodcutter’s House | 2 | 2 | 6 | 6.2 x 5 | 7.5 x 6 | 1.45 |  |  |  |  | 10 / 10 | 8 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `in.93` | Shepherd’s House | 1 | 1 | 3 | 8.040000000000003 x 4.6 | 7 x 7 | 1.32 |  |  |  |  | 4 / 7 | 2 | F 0:1/1; B 0:2/2; L 0:0/2; R 0:1/2 |  |  | w |
| `in.94` | Pell House | 2 | 2 | 6 | 6.2 x 4.6 | 7 x 6 | 1.47 |  |  |  |  | 10 / 9 | 9 | F 0:1/1 1:3/3; B 0:2/2 1:1/1; L 1:1/0; R 0:1/1 1:1/1 |  |  | w |
| `in.111` | Butcher’s House | 1 | 2 | 3 | 5 x 5 | 8 x 12 | 3.84 |  |  |  |  | 5 / 24 | 4 | F 0:0/2 1:0/2; B 0:3/2 1:0/2; L 0:1/4 1:0/4; R 0:1/4 1:0/4 | yes |  | s f w c |
| `in.113` | Carpenter’s House | 2 | 2 | 6 | 7 x 5 | 10 x 12.5 | 2.63 |  |  |  |  | 14 / 15 | 6 | F 0:1/2 1:2/0; B 0:3/1 1:3/3; L 0:1/4 1:1/3; R 0:2/2 1:1/0 |  |  | f w |
| `in.115` | Brewer’s House | 1 | 2 | 3 | 7 x 5 | 12 x 13 | 4.46 |  |  |  |  | 7 / 23 | 4 | F 0:1/2 1:0/2; B 0:3/2 1:0/2; L 0:1/4 1:0/3; R 0:2/4 1:0/4 |  |  | s f w |
| `in.116` | Glover’s House | 2 | 2 | 6 | 4.6 x 6.2 | 5.5 x 7.5 | 1.45 |  |  |  |  | 8 / 8 | 6 | F 1:2/2; B 0:2/2 1:1/1; L 1:1/1; R 0:1/1 1:1/1 |  |  | w |
| `high.a` | Highfold: the Reeve’s House | 1 | 1 | 3.1 | 6.4 x 5.2 | 8 x 8 | 1.92 |  |  |  |  | 3 / 8 | 3 | F 0:1/2; B 0:1/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `high.c` | Highfold: the Shepherd’s House | 1 | 2 | 3.1 | 6 x 5 | 9 x 12 | 3.6 |  |  |  |  | 2 / 22 | 2 | F 0:1/2 1:0/1; B 0:1/2 1:0/3; L 0:0/4 1:0/3; R 0:0/4 1:0/3 |  |  | s f w |

## For the outside worker

Sides as in `WALLS` (71_house.js): front is the door wall, left and right as seen from inside looking out of the front door. Distances are on the shell.

### Cellars: where the outside should show one

From the plans as they are today; a plan refitted to its shell may move its cellar, and its row here changes with it.

| id | name | where |
|---|---|---|
| `inn` | The Honeyed Hart | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |
| `store` | Quill’s Sundries | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |
| `elder` | Rowan’s Cottage | back wall, 2.3 m from the middle toward the left wall: a hatch with two leaves against the wall, or three steps down to a low door |
| `chapel` | Chapel of the Dawn | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |
| `draper` | Lindqvist’s Draper | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |
| `in.20` | Chandler’s House | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |
| `in.33` | Merchant’s House | back wall, 1.6 m from the middle toward the left wall: a hatch with two leaves against the wall, or three steps down to a low door |
| `in.37` | Cutler’s House | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |
| `in.111` | Butcher’s House | back wall, middle: a hatch with two leaves against the wall, or three steps down to a low door |

### Rooms with an outside wall and no window in the shell

Only buildings whose plan already takes its windows from the shell.

| id | name | room: where a window is wanted |
|---|---|---|
| `inn` | The Honeyed Hart | bedroom (level 0): back wall, 3.8 m from the middle toward the right wall; chamber1 (level 1): right wall, 3 m back from the front wall; chamber2 (level 1): back wall, 3.8 m from the middle toward the right wall |
| `smithy` | Brandt’s Forge | coalstore (level 0): back wall, 2 m from the middle toward the right wall; loft (level 1): left wall, 3.5 m back from the front wall |
| `store` | Quill’s Sundries | keeper (level 0): back wall, 1.3 m from the middle toward the right wall |
| `guardhouse` | Warden’s Lodge | armoury (level 0): back wall, 1.7 m from the middle toward the right wall |
| `draper` | Lindqvist’s Draper | back (level 0): back wall, middle |
| `shop.n3` | Shop | chamber (level 1): back wall, middle |
| `shop.s1` | Shop | chamber (level 1): back wall, middle |
| `in.02` | Cooper’s House | loft (level 1): back wall, middle |
| `in.04` | Fletcher’s House | pantry (level 0): back wall, 1.5 m from the middle toward the left wall; chamber (level 0): back wall, 1.7 m from the middle toward the right wall; loft (level 1): back wall, middle |
| `in.07` | Potter’s House | loft (level 1): left wall, 2.5 m back from the front wall |
| `in.10` | Baker’s House | upfront (level 1): left wall, 1.3 m back from the front wall; upback (level 1): back wall, middle |
| `in.13` | Tanner’s House | loft (level 1): left wall, 2.8 m back from the front wall |
| `in.40` | Scribe’s House | loft (level 1): back wall, middle |
| `in.45` | Tinker’s House | loft (level 1): left wall, 2.9 m back from the front wall |
| `in.66` | Saddler’s House | loft (level 1): back wall, middle |
| `in.70` | Tailor’s House | loft (level 1): left wall, 2.5 m back from the front wall |
| `in.82` | Tamsin’s House | hall (level 0): left wall, 1.5 m back from the front wall; loft (level 1): left wall, 2.7 m back from the front wall |

### Windows on the shell that open into the house next door (left out inside; remove them outside)

| id | name | where |
|---|---|---|

### Openings drawn on top of one another

| id | name | where |
|---|---|---|
| `elder` | Rowan’s Cottage | back wall, level 1: two openings drawn less than 1 m apart; one is kept inside |
| `in.44` | Cobbler’s House | front wall, level 1: two openings drawn less than 1 m apart; one is kept inside |
| `smithy` | Brandt’s Forge | back wall, 2.4 m from the middle toward the right wall, level 0: opens into `in.10` |
| `guardhouse` | Warden’s Lodge | left wall, 2.8 m back from the front wall, level 1: opens into `in.10`; right wall, 2 m back from the front wall, level 0: opens into `in.41`; right wall, 2.8 m back from the front wall, level 1: opens into `in.41` |
| `draper` | Lindqvist’s Draper | left wall, 3.1 m back from the front wall, level 0: opens into `shop.n2`; left wall, 2.8 m back from the front wall, level 1: opens into `shop.n2` |
| `in.04` | Fletcher’s House | back wall, 1.3 m from the middle toward the left wall, level 0: opens into `in.08`; back wall, 1.4 m from the middle toward the right wall, level 0: opens into `in.08`; back wall, middle, level 1: opens into `in.08` |
| `in.07` | Potter’s House | right wall, 1.6 m back from the front wall, level 0: opens into `in.08` |
| `in.08` | Alder House | right wall, 2.1 m back from the front wall, level 0: opens into `in.04`; left wall, 3 m back from the front wall, level 1: opens into `in.07`; right wall, 3 m back from the front wall, level 1: opens into `in.04` |
| `in.10` | Baker’s House | left wall, 4.5 m back from the front wall, level 0: opens into `smithy`; right wall, 3.5 m back from the front wall, level 1: opens into `guardhouse`; right wall, 1.6 m back from the front wall, level 0: opens into `guardhouse` |
| `in.66` | Saddler’s House | right wall, 1.4 m back from the front wall, level 0: opens into `in.67` |
| `in.67` | Bram’s House | left wall, 2.3 m back from the front wall, level 1: opens into `in.66` |
| `in.70` | Tailor’s House | right wall, 1.6 m back from the front wall, level 0: opens into `in.69` |
| `in.82` | Tamsin’s House | right wall, 1.8 m back from the front wall, level 0: opens into `in.81` |
| `in.94` | Pell House | left wall, 2.3 m back from the front wall, level 1: opens into `in.93` |
