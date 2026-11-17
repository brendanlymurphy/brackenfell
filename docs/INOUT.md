# Inside against outside: all 57 enterable buildings

Written by `test/inout.js` (build Build 77): `node test/audit/run.mjs --opt audit=1 test/inout.js`. Do not edit by hand.
The outside is read off the drawn shell (window, door and balcony pieces; panes and door leaves in the generated walls; glass in gables and dormers); the inside is the plan.
Cannot tell: whether a window that matches by count also looks the same size and style, anything a roof or a neighbour hides, cellar signs drawn into a larger mesh (the inn's hatch).

## Totals

| | |
|---|---|
| Buildings / failing at least one of the five checks | 57 / **57** |
| 1. Storeys shown outside differ from levels above ground inside | **25** (outside shows more: 7; inside holds more: 18) |
| 2. Plan does not fit the shell within 15 percent | **57** (ground floor area over shell area: least 1.3, median 3, worst 6) |
| 3. Upper doors outside / with no door inside on that wall and level | 5 / **5** |
| ... balconies outside / with no door onto them | 5 / **5** |
| ... upper doors inside that open onto nothing outside | **0** |
| 4. Windows outside / inside | 363 / 1030 |
| ... difference summed per wall and level / outside windows with an inside window in the same place | **775** / 112 of 363 |
| ... buildings whose windows do not all match | **57** |
| 5. Cellars inside / with nothing outside that shows one | 21 / **21** |

## Every building

Storeys: walls to the eaves in 3 m storeys, "+r" = windows above the eaves (gable or dormer) counted as one more. Footprint in metres, w x d; plan = the ground floor rooms without yards.
Windows by wall (F front, B back, L left, R right seen from inside the front door) and level: outside/inside. Fails: s storeys, f footprint, d upper door or balcony, w windows, c cellar.

| id | name | storeys out | levels in | eave m | shell | plan | area x | upper doors out | balconies | upper doors in | unserved | windows out / in | same place | windows by wall and level | cellar | sign | fails |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `inn` | The Honeyed Hart | 1+r | 2 | 3.7 | 15 x 9.6 | 14 x 13 | 1.3 |  |  |  |  | 15 / 28 | 5 | F 0:4/3 1:0/4 roof:1/0; B 0:3/4 1:0/4; L 0:3/3 1:0/4; R 0:4/3 1:0/3 | yes |  | f w c |
| `smithy` | Brandt’s Forge | 1 | 2 | 3.1 | 9.5 x 7 | 14 x 12 | 2.2 |  |  |  |  | 3 / 19 | 1 | F 0:1/3 1:0/1; B 0:1/4 1:0/1; L 0:0/3 1:0/2; R 0:1/3 1:0/2 |  |  | s f w |
| `store` | Quill’s Sundries | 2 | 2 | 6.1 | 8.4 x 6.6 | 14 x 12 | 3 | front L1 | front L1 |  | 2 | 8 / 23 | 1 | F 0:1/3 1:1/4; B 0:1/4 1:1/4; L 0:1/3 1:1/1; R 0:1/3 1:1/1 | yes |  | f d w c |
| `elder` | Rowan’s Cottage | 2 | 2 | 6.1 | 7.2 x 5.6 | 14 x 14 | 4.9 |  |  |  |  | 9 / 21 | 3 | F 0:1/3 1:1/0; B 0:1/4 1:2/4; L 0:1/4 1:1/1; R 0:1/4 1:1/1 | yes |  | f w c |
| `herbalist` | Maren’s Cottage | 1 | 1 | 3.1 | 6.6 x 5.6 | 10 x 11 | 3 |  |  |  |  | 5 / 10 | 0 | F 0:1/2; B 0:2/2; L 0:1/3; R 0:1/3 |  |  | f w |
| `guardhouse` | Warden’s Lodge | 2 | 2 | 6.1 | 7.2 x 5.6 | 12 x 11 | 3.3 | front L1 | front L1 |  | 2 | 7 / 26 | 4 | F 0:1/2 1:1/4; B 0:1/4 1:1/4; L 0:0/3 1:1/3; R 0:1/3 1:1/3 |  |  | f d w |
| `weaver` | Riverside Cottage | 2 | 2 | 6.1 | 7.6 x 6 | 10 x 12.5 | 2 |  |  |  |  | 8 / 15 | 0 | F 0:1/2 1:1/1; B 0:2/1 1:1/1; L 0:0/4 1:1/2; R 0:1/2 1:1/2 |  |  | f w |
| `chapel` | Chapel of the Dawn | 1 | 1 | 4.6 | 14 x 8 | 18 x 12 | 1.5 |  |  |  |  | 8 / 12 | 2 | F 0:4/3; B 0:4/4; L 0:0/2; R 0:0/3 | yes |  | f w c |
| `mill` | Dunn’s Mill | 2 | 2 | 6.1 | 7.4 x 6.4 | 10 x 12.5 | 1.9 |  |  |  |  | 8 / 15 | 1 | F 0:2/2 1:1/1; B 0:0/1 1:1/1; L 0:1/2 1:1/2; R 0:1/4 1:1/2 |  |  | f w |
| `farm` | Fairweather Farm | 1 | 2 | 3.1 | 8 x 6 | 12 x 13 | 3.3 |  |  |  |  | 3 / 23 | 0 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/3; R 0:0/4 1:0/4 |  |  | s f w |
| `hunter` | Wren’s Cabin | 1 | 1 | 3.1 | 6.2 x 5.2 | 7 x 8 | 1.7 |  |  |  |  | 2 / 7 | 0 | F 0:1/1; B 0:1/2; L 0:0/2; R 0:0/2 |  |  | f w |
| `fisher` | Fisher’s Hut | 1 | 2 | 3.1 | 5.2 x 4.6 | 8 x 8 | 2.7 |  |  |  |  | 1 / 14 | 0 | F 0:1/2 1:0/2; B 0:0/2 1:0/2; L 0:0/2 1:0/1; R 0:0/2 1:0/1 |  |  | s f w |
| `draper` | Lindqvist’s Draper | 2 | 2 | 6.1 | 6.4 x 5.6 | 8 x 12 | 2.7 | front L1 | front L1 |  | 2 | 7 / 24 | 2 | F 0:2/2 1:0/2; B 0:0/2 1:1/2; L 0:1/4 1:1/4; R 0:1/4 1:1/4 | yes |  | f d w c |
| `shop.n2` | Shop | 3 | 2 | 8.8 | 4 x 4 | 6 x 14 | 5.3 |  |  |  |  | 3 / 22 | 1 | F 0:1/0 1:1/2 2:1/0; B 0:0/2 1:0/2; L 0:0/4 1:0/4; R 0:0/4 1:0/4 | yes |  | s f w c |
| `shop.n3` | Shop | 2 | 2 | 5.8 | 6 x 4 | 8 x 12 | 4 | front L1 | front L1 |  | 2 | 2 / 24 | 2 | F 0:2/2 1:0/2; B 0:0/2 1:0/2; L 0:0/4 1:0/4; R 0:0/4 1:0/4 | yes |  | f d w c |
| `shop.n4` | Shop | 3 | 2 | 8.8 | 4 x 4 | 8 x 12 | 6 |  |  |  |  | 3 / 24 | 0 | F 0:1/2 1:1/2 2:1/0; B 0:0/2 1:0/2; L 0:0/4 1:0/4; R 0:0/4 1:0/4 | yes |  | s f w c |
| `shop.s0` | Shop | 2 | 2 | 5.8 | 4 x 4 | 8 x 12 | 6 |  |  |  |  | 2 / 24 | 0 | F 0:1/2 1:1/2; B 0:0/2 1:0/2; L 0:0/4 1:0/4; R 0:0/4 1:0/4 | yes |  | f w c |
| `shop.s1` | Shop | 3 | 2 | 8.8 | 6 x 4 | 6 x 14 | 3.5 | front L1 | front L1 |  | 2 | 4 / 22 | 0 | F 0:2/0 1:0/2 2:2/0; B 0:0/2 1:0/2; L 0:0/4 1:0/4; R 0:0/4 1:0/4 | yes |  | s f d w c |
| `shop.s2` | Shop | 2 | 2 | 5.8 | 6 x 4 | 6 x 14 | 3.5 |  |  |  |  | 3 / 22 | 0 | F 0:2/0 1:1/2; B 0:0/2 1:0/2; L 0:0/4 1:0/4; R 0:0/4 1:0/4 | yes |  | f w c |
| `in.02` | Cooper’s House | 1 | 2 | 3 | 6.4 x 5.2 | 10 x 12.5 | 2.3 |  |  |  |  | 4 / 16 | 1 | F 0:1/2 1:0/1; B 0:2/2 1:0/1; L 0:0/2 1:0/2; R 0:1/4 1:0/2 |  |  | s f w |
| `in.04` | Fletcher’s House | 2 | 2 | 6 | 6.4 x 5.8 | 8 x 12.5 | 2.7 |  |  |  |  | 13 / 20 | 5 | F 0:1/2 1:3/2; B 0:3/2 1:1/2; L 0:1/4 1:1/2; R 0:2/4 1:1/2 |  |  | f w |
| `in.07` | Potter’s House | 1 | 2 | 3 | 5.4 x 5 | 10 x 12.5 | 3.4 |  |  |  |  | 4 / 15 | 1 | F 0:1/2 1:0/1; B 0:2/1 1:0/1; L 0:0/4 1:0/2; R 0:1/2 1:0/2 |  |  | s f w |
| `in.08` | Alder House | 2 | 2 | 6 | 5.6 x 6 | 8 x 12.5 | 3 |  |  |  |  | 10 / 20 | 4 | F 0:1/2 1:3/2; B 0:2/2 1:1/2; L 0:0/4 1:1/2; R 0:1/4 1:1/2 |  |  | f w |
| `in.10` | Baker’s House | 1 | 2 | 3 | 5.4 x 5 | 6 x 14 | 3.1 |  |  |  |  | 7 / 22 | 3 | F 0:1/0 1:0/2; B 0:3/2 1:0/2; L 0:1/4 1:0/4; R 0:2/4 1:0/4 | yes |  | s f w c |
| `in.12` | Hobb’s Cottage | 2 | 2 | 6 | 6 x 5 | 8 x 12 | 3.2 |  |  |  |  | 10 / 20 | 4 | F 0:1/2 1:3/2; B 0:2/2 1:1/2; L 0:0/4 1:1/2; R 0:1/4 1:1/2 |  |  | f w |
| `in.13` | Tanner’s House | 1 | 2 | 3 | 6 x 5.6 | 10 x 12.5 | 2.2 |  |  |  |  | 4 / 16 | 1 | F 0:1/2 1:0/1; B 0:2/2 1:0/1; L 0:0/4 1:0/2; R 0:1/2 1:0/2 |  |  | s f w |
| `in.15` | Grocer’s House | 2 | 2 | 6 | 5.6 x 6 | 8 x 12 | 2.9 |  |  |  |  | 10 / 24 | 5 | F 0:1/2 1:3/2; B 0:2/2 1:1/2; L 0:0/4 1:1/4; R 0:1/4 1:1/4 | yes |  | f w c |
| `in.20` | Chandler’s House | 1 | 2 | 3 | 6 x 4.4 | 8 x 12 | 3.6 |  |  |  |  | 4 / 24 | 3 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/4; R 0:1/4 1:0/4 | yes |  | s f w c |
| `in.21` | Dyer’s House | 2 | 2 | 6 | 6.4 x 5 | 10 x 12.5 | 2.9 |  |  |  |  | 10 / 15 | 1 | F 0:1/2 1:3/1; B 0:2/1 1:1/1; L 0:0/2 1:1/2; R 0:1/4 1:1/2 |  |  | f w |
| `in.23` | Widow Hale’s House | 1 | 1 | 3 | 5 x 5 | 7 x 8 | 2.2 |  |  |  |  | 3 / 7 | 3 | F 0:0/1; B 0:2/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `in.33` | Merchant’s House | 2 | 2 | 6 | 7.6 x 5 | 10 x 12 | 3.2 |  |  |  |  | 10 / 20 | 3 | F 0:1/2 1:2/2; B 0:2/2 1:2/2; L 0:0/4 1:1/2; R 0:1/4 1:1/2 | yes |  | f w c |
| `in.34` | Wren Cottage | 1 | 2 | 3 | 7.6 x 6.2 | 9 x 12 | 2.3 |  |  |  |  | 4 / 22 | 0 | F 0:1/2 1:0/3; B 0:2/2 1:0/3; L 0:0/4 1:0/2; R 0:1/4 1:0/2 |  |  | s f w |
| `in.36` | Mason’s House | 2+r | 2 | 6 | 7 x 5 | 10 x 12.5 | 2.2 |  |  |  |  | 11 / 16 | 1 | F 0:1/2 1:2/1 roof:1/0; B 0:2/2 1:2/1; L 0:0/4 1:1/2; R 0:1/2 1:1/2 |  |  | s f w |
| `in.37` | Cutler’s House | 1 | 2 | 3 | 7 x 5.6 | 6 x 14 | 2.1 |  |  |  |  | 4 / 22 | 3 | F 0:1/0 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/4; R 0:1/4 1:0/4 | yes |  | s f w c |
| `in.38` | Marsh House | 2+r | 2 | 6 | 7 x 4.4 | 8 x 12.5 | 3.2 |  |  |  |  | 11 / 20 | 3 | F 0:1/2 1:2/2 roof:1/0; B 0:2/2 1:2/2; L 0:0/4 1:1/2; R 0:1/4 1:1/2 |  |  | s f w |
| `in.40` | Scribe’s House | 1 | 2 | 3 | 5.4 x 4.4 | 9 x 12 | 4.5 |  |  |  |  | 6 / 22 | 1 | F 0:1/2 1:0/3; B 0:3/2 1:0/3; L 0:0/4 1:0/2; R 0:2/4 1:0/2 |  |  | s f w |
| `in.44` | Cobbler’s House | 2 | 2 | 6 | 5 x 5.2 | 8 x 12 | 3.7 |  |  |  |  | 9 / 24 | 3 | F 0:0/2 1:3/2; B 0:2/2 1:1/2; L 0:0/4 1:1/4; R 0:1/4 1:1/4 | yes |  | f w c |
| `in.45` | Tinker’s House | 1 | 2 | 3 | 5.6 x 5.8 | 8 x 12 | 3 |  |  |  |  | 4 / 24 | 2 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/4; R 0:1/4 1:0/4 | yes |  | s f w c |
| `in.51` | Basketmaker’s House | 2 | 2 | 6 | 5 x 5.2 | 6 x 8 | 1.8 |  |  |  |  | 9 / 12 | 5 | F 1:3/2; B 0:2/2 1:1/2; L 0:0/2 1:1/1; R 0:1/2 1:1/1 |  |  | f w |
| `in.60` | Garrick’s House | 1 | 2 | 3 | 5 x 5.2 | 6 x 8 | 1.8 |  |  |  |  | 3 / 12 | 3 | F 1:0/2; B 0:2/2 1:0/2; L 0:0/2 1:0/1; R 0:1/2 1:0/1 |  |  | s f w |
| `in.65` | Ropemaker’s House | 2 | 2 | 6 | 5.6 x 4.4 | 10 x 12.5 | 3.7 |  |  |  |  | 10 / 15 | 1 | F 0:1/2 1:3/1; B 0:2/1 1:1/1; L 0:0/2 1:1/2; R 0:1/4 1:1/2 |  |  | f w |
| `in.66` | Saddler’s House | 1 | 2 | 3 | 7 x 4.6 | 10 x 12.5 | 2.3 |  |  |  |  | 4 / 16 | 0 | F 0:1/2 1:0/1; B 0:2/2 1:0/1; L 0:0/4 1:0/2; R 0:1/2 1:0/2 |  |  | s f w |
| `in.67` | Bram’s House | 2 | 1 | 6 | 5.6 x 4.6 | 7 x 7 | 1.9 |  |  |  |  | 10 / 7 | 3 | F 0:1/1 1:3/0; B 0:2/2 1:1/0; L 0:0/2 1:1/0; R 0:1/2 1:1/0 |  |  | s f w |
| `in.70` | Tailor’s House | 1 | 2 | 3 | 5.6 x 5 | 8 x 12 | 3.4 |  |  |  |  | 4 / 24 | 3 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/4; R 0:1/4 1:0/4 | yes |  | s f w c |
| `in.74` | Thorne House | 2 | 2 | 6 | 6.2 x 5 | 9 x 12 | 3.5 |  |  |  |  | 10 / 22 | 3 | F 0:1/2 1:3/3; B 0:2/2 1:1/3; L 0:0/4 1:1/2; R 0:1/4 1:1/2 |  |  | f w |
| `in.75` | Ferrin’s House | 1 | 1 | 3 | 5.6 x 4.6 | 6 x 7 | 1.6 |  |  |  |  | 4 / 6 | 3 | F 0:1/0; B 0:2/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `in.77` | Wheelwright’s House | 2 | 2 | 6 | 6.2 x 5 | 10 x 12.5 | 3 |  |  |  |  | 10 / 15 | 2 | F 0:1/2 1:3/1; B 0:2/1 1:1/1; L 0:0/4 1:1/2; R 0:1/2 1:1/2 |  |  | f w |
| `in.82` | Tamsin’s House | 1 | 1 | 3 | 5 x 5.4 | 8 x 7 | 2.1 |  |  |  |  | 3 / 8 | 2 | F 0:0/2; B 0:2/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `in.90` | Woodcutter’s House | 2 | 2 | 6 | 6.2 x 5 | 7 x 8 | 1.8 |  |  |  |  | 10 / 13 | 5 | F 0:1/1 1:3/2; B 0:2/2 1:1/2; L 0:0/2 1:1/1; R 0:1/2 1:1/1 |  |  | f w |
| `in.93` | Shepherd’s House | 1 | 1 | 3 | 7 x 4.6 | 7 x 7 | 1.5 |  |  |  |  | 4 / 7 | 2 | F 0:1/1; B 0:2/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `in.94` | Pell House | 2 | 2 | 6 | 6.2 x 4.6 | 7 x 8.5 | 2.1 |  |  |  |  | 10 / 13 | 5 | F 0:1/1 1:3/2; B 0:2/2 1:1/2; L 0:0/2 1:1/1; R 0:1/2 1:1/1 |  |  | f w |
| `in.111` | Butcher’s House | 1 | 2 | 3 | 5 x 5 | 8 x 12 | 3.8 |  |  |  |  | 3 / 24 | 1 | F 0:0/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/4; R 0:1/4 1:0/4 | yes |  | s f w c |
| `in.113` | Carpenter’s House | 2+r | 2 | 6 | 7 x 5 | 10 x 12.5 | 2.6 |  |  |  |  | 11 / 15 | 1 | F 0:1/2 1:2/1 roof:1/0; B 0:2/1 1:2/1; L 0:0/4 1:1/2; R 0:1/2 1:1/2 |  |  | s f w |
| `in.115` | Brewer’s House | 1 | 2 | 3 | 7 x 5 | 12 x 13 | 4.5 |  |  |  |  | 4 / 23 | 1 | F 0:1/2 1:0/2; B 0:2/2 1:0/2; L 0:0/4 1:0/3; R 0:1/4 1:0/4 |  |  | s f w |
| `in.116` | Glover’s House | 2 | 2 | 6 | 4.6 x 6.2 | 8 x 12 | 3.4 |  |  |  |  | 10 / 24 | 1 | F 0:0/2 1:2/2; B 0:3/2 1:2/2; L 0:0/4 1:1/4; R 0:1/4 1:1/4 | yes |  | f w c |
| `high.a` | Highfold: the Reeve’s House | 1 | 1 | 3.1 | 6.4 x 5.2 | 8 x 8 | 1.9 |  |  |  |  | 3 / 8 | 2 | F 0:1/2; B 0:1/2; L 0:0/2; R 0:1/2 |  |  | f w |
| `high.c` | Highfold: the Shepherd’s House | 1 | 2 | 3.1 | 6 x 5 | 9 x 12 | 3.6 |  |  |  |  | 2 / 22 | 0 | F 0:1/2 1:0/3; B 0:1/2 1:0/3; L 0:0/4 1:0/2; R 0:0/4 1:0/2 |  |  | s f w |
