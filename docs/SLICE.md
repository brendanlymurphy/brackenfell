# The slice: which doors open

The owner's decision of 18 November, 16:45 UTC: until he says otherwise, work and the player are confined to the walk from the
west gate along the street to the market square, the square, the alley to Quill's Sundries, the Hart, and up to the chapel,
and to the interiors below. Every other house keeps its people and its lights; its door is locked to the player.

Source: `SLICE` in `src/82f_owners.js`. Gate step `slice` (`test/slice.js`) derives everything below again from the running
game on every run.

## How the lock works

- The door says **"Locked."** and the prompt reads **Locked**. There is no lockpick try, at any hour, and a pick in hand is
  not used. A back door or hatch into a locked house is locked the same way.
- The people of a locked house live as before: they sleep there and come and go through the door. 59 people sleep in locked
  houses.
- Letters and books are placed only in kept houses (`82b_interact.js`), so no rumour or clue is shut away.
- `game.enter(id)` is a test tool, not a door. It still enters any cell.

## How the list was derived

These were read from the running game and are checked again by `test/slice.js`:

- Every quest and every stage, at 7, 10, 13, 16, 19 and 22 h: 990 targets in all. A stage that points at a person counts
  wherever that person is at that hour.
- Every secret.
- Every story object inside a cell. Containers, loose things and books are dressing, not story.
- Everyone who trades: Brandt, Marta, Greta.
- The board's three jobs: outlaws on the passes, the mine, Marta's oil.

The result was then added to the sixteen the owner named.

## Kept: 17 interiors

| Cell | Name | Why |
|---|---|---|
| `inn` | The Honeyed Hart | The sixteen. Main quest 5 (at night) and 7 to 9: Greta, the cellar stair, the fresh brick, the tunnel. Quests `welcome` and `ale` 1 onwards. Greta's trade (rooms, ale). The back door and the cellar hatch. |
| `chapel` | Chapel of the Dawn | The sixteen. Main quest 2, the `bell` quest from stage 1, the `crypt` quest (sacristy chest, crypt gate, reliquary). Brother Aldous. |
| `elder` | Rowan's Cottage | The sixteen. Main quest 6, `fire` 0, `camp` 1 to 4, `brother` 1. Rowan. |
| `store` | Quill's Sundries | The sixteen. The `bell` quest, stage 0. Marta's trade: she buys, and sells the lamp oil for the board's oil job. |
| `smithy` | Brandt's Forge | The sixteen. The `hammer` and `tools` quests. Brandt's trade (weapons, armour). |
| `herbalist` | Maren's Cottage | The sixteen. Main quest 1, `herbs` 1, `tea` 1. Maren. |
| `guardhouse` | Warden's Lodge | The sixteen. Hale and Ivo: fines, the bounty, the jail. |
| `mill` | Dunn's Mill | The sixteen. `ale` 0 (Osric's malt). |
| `draper` | Lindqvist's Draper | The sixteen. Anselm and Sabina. |
| `weaver` | Riverside Cottage | The sixteen. Hilda and Pip. |
| `farm` | Fairweather Farm | The sixteen. Edda. |
| `hunter` | Wren's Cabin | The sixteen. Wren. |
| `fisher` | Fisher's Hut | The sixteen. Finn. |
| `in.23` | Widow Hale's House (the shut house) | The sixteen. The secret `house`: the hatbox, opened with Wren's key. |
| `shop.s1` | The Bookstall | The sixteen. Lettice minds it. |
| `shop.n2` | The Apothecary | The sixteen. Alaric. |
| `mine` | The Old Mine | Main quest 8 and 9: reached through the Hart's cellar and the tunnel, not by a door in the town. The board's mine job. |

## Locked: 41 interiors

None is named by a quest stage, a secret, a trade or the board. A book that would have lain in one now lies in a kept house.

| Cell | Name | Who lives or works there |
|---|---|---|
| `shop.n3` | The Cutler's | Roger (works) |
| `shop.n4` | Thorne's Salt and Spice | Elinor (works) |
| `shop.s0` | The Bread Stall | Tilly (works) |
| `shop.s2` | The Tinker's Stall | Diggory (works) |
| `in.02` | Cooper's House | Laurence, Felice, Joyce |
| `in.04` | Fletcher's House | Hugh (works) |
| `in.07` | The Pottery | Beatrix (works) |
| `in.08` | Alder House | Hugh, Gillian |
| `in.10` | Baker's House | Godwin, Avice, Tilly |
| `in.12` | Hobb's Cottage | Idony |
| `in.13` | Tanner's House | Fulk, Giles |
| `in.15` | Thorne's Store | Simon (works) |
| `in.20` | Chandler's House | Barnaby, Ursel |
| `in.21` | Dyer's House | Wilmot, Tom |
| `in.33` | Merchant's House | Gilbert, Elinor |
| `in.34` | Sedge Cottage | Alaric |
| `in.36` | Mason's House | Silas |
| `in.37` | Cutler's House | Roger, Odo |
| `in.38` | Marsh House | Peter, Ellen, Will |
| `in.40` | Scribe's House | Emmet, Lettice |
| `in.44` | Cobbler's House | Stephen |
| `in.45` | Tinker's House | Diggory, Alison |
| `in.51` | Basketmaker's House | Adda |
| `in.60` | Garrick's House | Mercy |
| `in.65` | The Ropewalk | Ulric (works) |
| `in.66` | Saddler's House | Tybalt, Winifred |
| `in.67` | Bram's House | Bram (of the story; no stage sends you to his house) |
| `in.70` | Tailor's House | Jocelyn |
| `in.74` | Thorne House | Simon, Ned |
| `in.75` | Ferrin's House | Ulric, Beatrix, Amice |
| `in.77` | Wheelwright's House | Miles, Kat |
| `in.82` | Tamsin's House | Tamsin |
| `in.90` | Woodcutter's House | Jasper |
| `in.93` | Shepherd's House | Warin |
| `in.94` | Pell House | Ysolt, Davy, Lambert |
| `in.111` | Butcher's House | Humphrey, Hester |
| `in.113` | The Boatwright's | Randal, Old Wenn |
| `in.115` | Brewer's House | Goda, Bridget |
| `in.116` | Glover's House | Petronel |
| `high.a` | Highfold: the Reeve's House | Jordan, Basilia |
| `high.c` | Highfold: the Shepherd's House | Kester, Rosalind |

## What the tests do now

- The gate's `cells-*` chunks, `interiors` and `inout` cover the kept interiors only. `interiors` checks 16 buildings, since
  the mine has no plan. `inout` was accepted at 0: none of the kept houses differs inside from outside, against 12 across the
  whole town before.
- `slice` (quick) asserts that every locked door refuses, and that everything the game asks of the player is in the slice or
  out of doors.
- `owners` uses the Draper's and the Bookstall, and checks that the Cooper's, the Baker's and the Bread Stall say "Locked."
- The play bot's sweep leaves what lies in locked houses. Its theft and witness scenarios use a kept house. The night-time
  owners scenario uses the Draper's, and finds the Cooper's locked at noon.
- The walk bot goes through the kept interiors only.
