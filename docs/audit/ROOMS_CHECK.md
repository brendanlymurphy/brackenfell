# The inspector's room table checked by eye (Build 88)

The interiors inspector's table (`docs/FINISH.md` on `origin/fork-fin`, "ROOM CAMERA, ALL PLAN BUILDINGS AT 13:00": 227 room rows, 117 "room",
76 "empty", 19 dark by day, 14 leaf in the face, 1 stair in the way) says what a player sees first from each doorway. Its sheets are on
another machine, so I took the same views myself with its own camera (`test/roomviews.mjs` from `fork-fin`, `HOURS=13`) on the live build
(Build 88, built from `origin/main`), for 20 "empty" rows and 20 "room" rows drawn at random (seed 88). Picture: `rooms_check40_b88.jpg`,
one tile per row, labelled with the inspector's verdict; the first doorway view of each room.

## Agreement: 34 of 40

| | Inspector says empty | Inspector says room |
|---|---|---|
| I agree | 20 of 20 | 14 of 20 |
| I disagree | 0 | 6 |

All 20 "empty" rows are empty to my eye too: bare plaster from the doorway, at most a lantern, a rail, a barrel's edge or a chair's edge
(tiles 1 to 20). The six "room" rows I would call empty or nearly so from the door:

| Tile | Room | What the doorway shows |
|---|---|---|
| 24 | `high.c` hall | A window, the stair and bare walls |
| 29 | `elder` solar | A rail, the stone chimney, a window; no furniture |
| 35 | `in.08` solar | A rail and a lantern on bare plaster |
| 36 | `in.111` shop | A window, one barrel, a crate's corner; a butcher's shop with nothing to sell in view |
| 37 | `in.07` work | A window and the edge of one thing; the Pottery's workroom shows no wheel, no pots |
| 39 | `in.113` work | A window and two stools; the boatwright's shop shows no boat |

Borderline but agreed: 28 (`in.15` upfront: a stool and a sack), 32 and 40 (a row of hanging gourds on a wall ledge, which reads as a shelf of
pots), 34 (the store's keeper room, seen mostly through a doorway). So the inspector's "room" errs generous: about one in three of its "room"
rows would look empty to a player standing in the door.

## The ten emptiest houses a player is most likely to enter

From the inspector's table (share of rooms empty or dark from the door), the first ten doors from the gate (`FIRSTTEN10.md`), and the quest
routes (the Hart, the forge, the mill for Greta's malt).

| # | House | Why a player goes in | Rooms empty or dark from the door | What the door shows first (Build 88) |
|---|---|---|---|---|
| 1 | Scribe's House (`in.40`) | 3rd door from the gate, on the main street | 2 of 2 | A man standing in the doorway |
| 2 | Baker's House (`in.10`) | 6th door, on the main street, its prompt shows from the street | 3 of 4 | A resident's head and shoulders, then the stair |
| 3 | Fletcher's House (`in.04`) | 9th door, by the square | 3 of 5 | The stair |
| 4 | Brandt's Forge | the hammer quest | 3 of 4 (living, coal store, loft) | The forge: fine; it is the rooms behind |
| 5 | The Honeyed Hart | the first quest, the bed, the cellar | 5 of 9 (bedroom, loft and chamber1 dark; store and passage) | The hearth: fine; upstairs is dark |
| 6 | Dunn's Mill | Greta's malt | 3 of 5 (store, solar, loft) | |
| 7 | Ferrin's House (`in.75`) | 2nd door from the gate | 2 of 4 | Dark, a wall |
| 8 | The Pottery (`in.07`) | 5th door | 2 of 4; and its workroom (tile 37) is bare | The stair across the view |
| 9 | The Bookstall (`shop.s1`) | the alley of shops off the square | 2 of 2 | |
| 10 | Lindqvist's Draper | the alley of shops; Sabina and Anselm | 2 of 4 (back, upfront) | |

Not checked: rooms seen from anywhere but the first doorway view; anything at night; rooms the inspector marked dark or leaf-in-the-face.
