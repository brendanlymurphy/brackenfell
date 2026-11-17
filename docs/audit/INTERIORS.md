# Interiors audit: all 57 enterable buildings (Build 77)

Same method as the town audit: counts from the running game, a picture for each claim, nothing sampled. No game code changed.
The owner's own pictures (branch `owner-shots`, `docs/owner/`) are the starting list; each is answered below with a count.

| Evidence | Made by |
|---|---|
| `shots/audit/interiors_data.json` (not committed): every room, piece of furniture with the wall it backs onto, placed model with its facing, window, hearth, stair hole, light | `node test/audit/run.mjs --opt audit=1 --json shots/audit/interiors_data.json test/audit/interiors_dump.js` |
| the table at the end, `docs/audit/interiors_table.md` | `python3 test/audit/interiors.py` |
| 235 pictures, one of every room from a corner (`shots/audit/rooms`, not committed; two sheets of 42 here: `int_rooms_a.jpg`, `int_rooms_b.jpg`) | the picture list `interiors.py` writes |

Cannot tell: flicker, anything in motion, sound. I looked at 2 of the 6 sheets (84 rooms) and at 22 single rooms; the counts cover all 235.

## Verdict in numbers

| | |
|---|---|
| Interiors / rooms / levels | 57 / 235 / 126 |
| Painted cabinets | 653 (11 a building) |
| ... standing with their blank back to the room | **613 (94%)**, in all 57 buildings |
| Floor items | 2,904 |
| ... that are barrels, casks, sacks, crates, baskets, buckets, log piles | 873 (30%) |
| ... that are filler cabinets and filler benches (ids `dNNcb`, `dNNbn`) | 615 + 223 |
| Rooms whose furniture list is identical to a room in another building | 72, in 21 groups |
| Hearths / hearths with a room straight above | 58 / 38 |
| ... of those with a flue or chimney breast in the room above | 0 |
| Stair holes / with a rail in the plan data | 69 / 1 |
| Beds as furniture / beds that can be used | 109 / 56 |
| Windows inside / on the shells of the same buildings | 1,067 / 190 |
| Ground floor larger than 1.25 times the shell | 57 of 57 |
| Containers a player can open | 1,033 |
| Readable notes | 31 |

## Findings

Severity as in `docs/AUDIT.md`. "Owner" marks a finding the owner photographed.

| # | Sev | Finding | Where | Picture | Expected | What is there | Fix |
|---|---|---|---|---|---|---|---|
| I01 | S1 | **Cabinets stand backwards.** Owner: `dressers_backwards.png`. | all 57; most: inn 27, farm 26, `in.115` 23, `in.33` 20, elder 18 | `int_cabinet_back.jpg` against `int_cabinet_front.jpg`; `int_rooms_a.jpg` (in.12 pantry, in.13 leg, in.36 leg) | Drawers and doors face the room. | 613 of 653 `painted_wooden_cabinet` pieces are turned 180 degrees from the 40 that are right: the room sees a blank board. One wrong sign where the filler cabinets (`dNNcb`) are turned to their wall. | Turn them; then cut their number (I02). Test: `interiors.py` column "with the back to the room" must be 0. |
| I02 | S1 | **Rooms are filled, not furnished.** | all | `int_rooms_a.jpg`, `int_rooms_b.jpg` | A room holds what its people use. | 30% of all floor items are storage (barrels 326, sacks about 180, crates about 130); 838 more are filler cabinets and benches placed along free wall. A tailor's bedroom and a butcher's are the same bed, chest, two sacks and a crate. | Dress each room from its household's row in `docs/PEOPLE.md` (blueprint 7.4). Storage belongs in the store room and cellar. Target: under 10% storage outside cellars and stores; no filler ids. |
| I03 | S1 | **The same room, over and over.** | 72 rooms in 21 groups: 8 yards (one cart each, the same cart), 7 cellars, 6 + 5 + 5 + 3 + 3 bedrooms, 4 pantries | `int_rooms_b.jpg` (the cellars of shop.n2, n3, n4, s0: one barrel on cobbles; the yards of in.77 and the mill) | No two houses alike. | Identical furniture lists between buildings; many more differ by one item. 16 "shopfront" plans, 11 "workshop", 12 "cottage" share their room layout exactly. | Fewer plan families is fine; identical dressing is not. Each room gets its one unique thing (Bethesda's rule, `docs/AUDIT.md` Part B). |
| I04 | S1 | **Inside does not match outside.** Owner: `quill_upper_door.png`. | 57 of 57 | `pair_shop.n4.jpg` | | Unchanged since Build 74: every ground floor is over 1.25 times its shell (median about 3, worst 6); windows 1,067 against 190; 21 cellars nothing outside shows; 20 houses with one storey of wall and two floors of rooms. | `docs/AUDIT.md` Part C rank 8. |
| I05 | S1 | **Sparks from the hearth come up through the floor.** Owner: `embers_through_floor.png`, `window_view_inside.png`. | 38 hearths have a room above; seen in `in.12` solar, `in.34` solar | `int_embers_upstairs.jpg` | Fire stays in the fireplace. | Ember particles rise through the ceiling into the room above (yellow dots in mid air upstairs) and, in the owner's picture, show through window glass from outside. No flue or chimney breast stands in any of the 38 upper rooms, so the fire below has no way up. | Clip the embers to the hearth's own room and height; give every upper room over a hearth a chimney breast (blueprint 3.4). |
| I06 | S2 | **Stair holes are open pits.** Owner: `cellar_stair_hole.png`. | 69 holes; 1 with a rail in the plan data | `int_stair_hole.jpg` (in.90 loft: three thin posts), `int_hatch_hole.jpg` (the store: an open hatch in the shop floor between the door and the counter) | A stair well has a balustrade on its open sides; a cellar hatch has a trap door or a rail. | Thin posts or nothing. The walk bot's falls of more than 1.6 m (`docs/WALK.md`: 66 at Build 74) are mostly these. | A rail on every open side; a hinged trap over cellar hatches in shops. |
| I07 | S2 | **109 beds, 56 that work, for 77 people.** | all; inn 4 beds 1 usable, guardhouse 4 and 1, farm 3 and 1 | table below | Each sleeper has a bed that is theirs. | One usable bed per building whatever the household. `docs/PEOPLE.md` needs 77 sleeping places; 2 of the 17 story people have none today. | One usable, owned bed per sleeper in the cast table; remove the rest. |
| I08 | S2 | **Grey untextured slabs.** | `in.21` living | `int_grey_slabs.jpg` | Shelves or a workbench. | Two thick flat grey boards the width of the room with a person standing behind them. | Find the piece and texture or replace it. |
| I09 | S2 | **Chairs face the wall.** | 3 of 3 rocking chairs | `int_rocker_to_wall.jpg` | A chair faces the fire or the room. | The same 180-degree turn as I01. | With I01. |
| I10 | S3 | **1,033 containers.** | all | | | 18 a building; the town audit's A26, unchanged. | A third as many, contents per household. |
| I11 | S3 | **Light is one recipe.** | all | `int_rooms_a.jpg` | Poor houses dark, rich ones bright. | 425 sconces, 234 torches, 697 candle flames: 24 flames a building, the same white pool on every floor. Only 1 room of 235 has neither window nor light, so nothing is ever dark either. | Light by wealth and use: one rushlight in a cottage, a branch of candles at the merchant's. |
| I12 | S3 | **Two rooms are bare.** | chapel vault (28 m2, 2 items), `in.115` passage (26 m2, 0) | | | | Dress or shrink. |

What the data says is fine: no furniture overlaps furniture, none passes through a wall, none is taller than its room, none blocks a
doorway or stands in front of a window (all 0 by the plan's rectangles; the plan engine already refuses these). No window is on an
inside wall or in a cellar.

## The owner's pictures, answered

| Picture | Finding | Count |
|---|---|---|
| `dressers_backwards.png` | I01 | 613 of 653 |
| `cellar_stair_hole.png` | I06 | 68 of 69 holes without a rail |
| `embers_through_floor.png`, `window_view_inside.png` | I05 | 38 hearths under a room |
| `quill_upper_door.png` (a door on the store's upper storey outside) | I04 | 14 shells have a balcony or upper door; no plan has a door onto one |
| `two_people_in_one.png`, `brandt_hammer.png`, `pig_blob.png`, `leofric_no_lines.png` | characters and props: `docs/audit/CHARACTERS.md` | |

## Every interior

Empty cells are 0. "area x shell" is ground floor inside divided by the footprint outside.

| id | name | area x shell | rooms | levels | floor items | of which barrels, sacks, crates, baskets | painted cabinets | with the back to the room | furniture through furniture | furniture through a wall | windows behind tall furniture | doorways with furniture in them | hearths under a room | with no flue in that room | stair holes with no rail | bare rooms | rooms with no window or light | windows in a cellar | beds | beds that can be used | containers |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `inn` | The Honeyed Hart | 1.3 | 8 | 3 | 131 | 31 | 29 | 27 |  |  |  |  | 2 | 2 | 2 |  |  |  | 4 | 1 | 28 |
| `smithy` | Brandt’s Forge | 2.5 | 4 | 2 | 75 | 37 | 9 | 8 |  |  |  |  |  |  | 1 |  |  |  | 1 | 1 | 10 |
| `store` | Quill’s Sundries | 3.0 | 6 | 3 | 103 | 42 | 18 | 17 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 43 |
| `elder` | Rowan’s Cottage | 4.9 | 6 | 3 | 62 | 6 | 18 | 18 |  |  |  |  |  |  | 2 |  |  |  | 1 | 1 | 12 |
| `herbalist` | Maren’s Cottage | 3.0 | 3 | 1 | 62 | 41 | 5 | 5 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 42 |
| `guardhouse` | Warden’s Lodge | 3.3 | 4 | 2 | 63 | 20 | 4 | 4 |  |  |  |  | 1 | 1 |  |  |  |  | 4 | 1 | 5 |
| `weaver` | Riverside Cottage | 2.7 | 4 | 2 | 51 | 29 | 7 | 7 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 9 |
| `chapel` | Chapel of the Dawn | 1.5 | 5 | 2 | 49 | 1 | 1 | 1 |  |  |  |  |  |  | 1 | 1 | 1 |  |  |  | 4 |
| `mill` | Dunn’s Mill | 2.6 | 4 | 2 | 50 | 30 | 8 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 12 |
| `farm` | Fairweather Farm | 3.2 | 8 | 2 | 116 | 39 | 29 | 26 |  |  |  |  | 1 | 1 | 1 |  |  |  | 3 | 1 | 42 |
| `hunter` | Wren’s Cabin | 1.7 | 1 | 1 | 23 | 6 | 4 | 3 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 6 |
| `fisher` | Fisher’s Hut | 2.7 | 2 | 2 | 29 | 5 | 9 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 1 | 1 | 8 |
| `draper` | Lindqvist’s Draper | 2.7 | 5 | 3 | 63 | 18 | 15 | 15 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 28 |
| `shop.n2` | Shop | 5.2 | 5 | 3 | 60 | 18 | 10 | 10 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 27 |
| `shop.n3` | Shop | 4.0 | 5 | 3 | 67 | 20 | 15 | 15 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 31 |
| `shop.n4` | Shop | 6.0 | 5 | 3 | 68 | 22 | 16 | 16 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 30 |
| `shop.s0` | Shop | 6.0 | 5 | 3 | 70 | 22 | 15 | 15 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 30 |
| `shop.s1` | Shop | 3.5 | 5 | 3 | 57 | 17 | 12 | 12 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 27 |
| `shop.s2` | Shop | 3.5 | 5 | 3 | 55 | 18 | 12 | 12 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 28 |
| `in.02` | Cooper’s House | 3.8 | 5 | 2 | 51 | 16 | 6 | 5 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 13 |
| `in.04` | Fletcher’s House | 2.7 | 4 | 2 | 52 | 13 | 16 | 15 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 20 |
| `in.07` | Potter’s House | 4.6 | 4 | 2 | 29 | 9 | 7 | 6 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 9 |
| `in.08` | Alder House | 3.0 | 4 | 2 | 45 | 12 | 13 | 11 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 18 |
| `in.10` | Baker’s House | 3.1 | 5 | 3 | 56 | 21 | 12 | 12 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 29 |
| `in.12` | Hobb’s Cottage | 3.2 | 4 | 2 | 45 | 11 | 12 | 11 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 17 |
| `in.13` | Tanner’s House | 3.7 | 5 | 2 | 37 | 12 | 9 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 1 | 1 | 10 |
| `in.15` | Grocer’s House | 2.9 | 5 | 3 | 64 | 22 | 16 | 16 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 30 |
| `in.20` | Chandler’s House | 3.6 | 5 | 3 | 65 | 20 | 15 | 15 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 29 |
| `in.21` | Dyer’s House | 3.9 | 4 | 2 | 34 | 11 | 7 | 7 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 13 |
| `in.23` | Widow Hale’s House | 2.2 | 1 | 1 | 21 | 5 | 4 | 3 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 8 |
| `in.33` | Merchant’s House | 3.2 | 6 | 3 | 72 | 21 | 21 | 20 |  |  |  |  |  |  | 2 |  |  |  | 2 | 1 | 32 |
| `in.34` | Wren Cottage | 2.3 | 4 | 2 | 50 | 11 | 15 | 14 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 17 |
| `in.36` | Mason’s House | 3.6 | 5 | 2 | 37 | 14 | 9 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 13 |
| `in.37` | Cutler’s House | 2.1 | 5 | 3 | 54 | 18 | 12 | 12 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 27 |
| `in.38` | Marsh House | 3.2 | 4 | 2 | 45 | 11 | 13 | 12 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 18 |
| `in.40` | Scribe’s House | 4.5 | 4 | 2 | 51 | 10 | 16 | 15 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 17 |
| `in.44` | Cobbler’s House | 3.7 | 5 | 3 | 64 | 20 | 16 | 16 |  |  |  |  | 1 | 1 | 2 |  |  |  | 1 | 1 | 28 |
| `in.45` | Tinker’s House | 3.0 | 5 | 3 | 61 | 20 | 15 | 15 |  |  |  |  | 1 | 1 | 2 |  |  |  | 1 | 1 | 29 |
| `in.51` | Basketmaker’s House | 1.8 | 2 | 2 | 24 | 4 | 7 | 6 |  |  |  |  | 1 | 1 | 1 |  |  |  | 1 | 1 | 7 |
| `in.60` | Garrick’s House | 1.8 | 2 | 2 | 22 | 4 | 6 | 5 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 6 |
| `in.65` | Ropemaker’s House | 5.1 | 4 | 2 | 34 | 8 | 8 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 1 | 1 | 10 |
| `in.66` | Saddler’s House | 3.9 | 5 | 2 | 35 | 11 | 9 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 10 |
| `in.67` | Bram’s House | 1.9 | 1 | 1 | 19 | 4 | 4 | 3 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 7 |
| `in.70` | Tailor’s House | 3.4 | 5 | 3 | 65 | 19 | 16 | 16 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 28 |
| `in.74` | Thorne House | 3.5 | 4 | 2 | 47 | 12 | 15 | 14 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 17 |
| `in.75` | Ferrin’s House | 1.6 | 1 | 1 | 17 | 2 | 3 | 2 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 6 |
| `in.77` | Wheelwright’s House | 4.0 | 4 | 2 | 34 | 9 | 8 | 7 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 8 |
| `in.82` | Tamsin’s House | 2.1 | 1 | 1 | 21 | 3 | 6 | 5 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 4 |
| `in.90` | Woodcutter’s House | 1.8 | 2 | 2 | 25 | 5 | 6 | 5 |  |  |  |  | 1 | 1 | 1 |  |  |  | 1 | 1 | 8 |
| `in.93` | Shepherd’s House | 1.5 | 1 | 1 | 20 | 4 | 5 | 4 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 6 |
| `in.94` | Pell House | 2.1 | 2 | 2 | 24 | 4 | 10 | 8 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 6 |
| `in.111` | Butcher’s House | 3.8 | 5 | 3 | 63 | 21 | 16 | 16 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 29 |
| `in.113` | Carpenter’s House | 3.6 | 4 | 2 | 33 | 9 | 8 | 7 |  |  |  |  | 1 | 1 | 1 |  |  |  | 2 | 1 | 9 |
| `in.115` | Brewer’s House | 4.5 | 8 | 2 | 91 | 20 | 26 | 23 |  |  |  |  | 1 | 1 | 1 | 1 |  |  | 3 | 1 | 23 |
| `in.116` | Glover’s House | 3.4 | 5 | 3 | 67 | 18 | 15 | 15 |  |  |  |  | 1 | 1 | 2 |  |  |  | 2 | 1 | 27 |
| `high.a` | Highfold: the Reeve’s House | 1.9 | 1 | 1 | 22 | 4 | 4 | 3 |  |  |  |  |  |  |  |  |  |  | 1 | 1 | 6 |
| `high.c` | Highfold: the Shepherd’s House | 3.6 | 4 | 2 | 54 | 13 | 11 | 10 |  |  |  |  |  |  | 1 |  |  |  | 3 | 1 | 17 |
| **all** | | | **235** | **126** | **2904** | **873** | **653** | **613** | **0** | **0** | **0** | **0** | **38** | **38** | **68** | **2** | **1** | **0** | **109** | **56** | **1033** |
