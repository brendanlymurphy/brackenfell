# Reports: Agent OG (fork-cull) to the coordinator

Newest first. Times UTC.

## 2026-11-18 (after the 04:10 inbox)

Branch head at the time of writing is in the commit that carries this file; the hashes below are the steps.

Decision taken without an answer (easiest to undo): none on this round.

### Done: items 2, 3 and 4 of the inbox, and the decisions

| What | Before | After | Commit |
|---|---|---|---|
| Tobin's bed | coal store | forge loft, low under a window (a blank wall first, then under a window, never free in the room) | `2e81638` |
| Noon meal | 10 people out of doors at 12:30 | 17 (three sittings by household: 11:33, 12:15, 12:57; first sitting markets after) | `2e81638` |
| People who never leave their building (whole day, every half hour) | 16 | 2: Greta (keeps the Hart) and Aldous (keeps the chapel). Lambert goes to his step, Wenn to the wharf, Anselm to the square bench, the Wolds to their doors, Basilia's cheese to the stall, the shopkeepers an hour of air after closing (dealt in turn), Randal and Wilmot an hour by the water | `2e81638` |
| Chapel at dawn once the bell rings | nobody | Idony, Odo, Gillian, Felice, Silas, Emmet (+ Aldous). Schedules may now depend on the story: `def.schedIf()` in `77_npc.js npcRow` | `2e81638` |
| in.34 / in.15 names | Wren Cottage / Grocer's House | Sedge Cottage / Thorne's Store, at the door's prompt and the door tag (`site.title`; `site.name` stays, the plan is chosen by it) | `2e81638` |
| Ned and Tom in shell-house yards | in.06 / in.42 yards | Ned in his father's store yard (in.15), Tom at his mother's vats (in.21 work) | `2e81638` |
| Talking to a sleeper | the day greeting, eyes shut (any road into `startTalk`) | "Godwin is asleep" on the prompt; `startTalk` refuses anyone lying down | `f2622ed` |
| Length of the day | 20 minutes | 40 (`Env.dayLength` 2400; a saved 1200, the old default everyone has, reads as 2400; the menu offers 40, 24, 12, stop) | `f2622ed` |
| Sword | across the screen from the first second (the start is over 66 m from the square, where the old rule kept it out) | sheathed until drawn: a press of attack or block (the first press draws, it does not swing), a hit, or a foe that has seen you within 25 m; back after nine quiet seconds; never in hand while talking | `f2622ed` |
| Talk camera | aimed at a guessed head height (a seated speaker's head fell under the subtitle) | the body's own head bone, a third of the way down the view; if a shelf, beam or chest is between, you step to the nearest clear place on a ring round the speaker. Measured: Lark 33 %, Greta 31 %, Hale seated 32 %, Maren 32 % from the top | `f2622ed` |
| Greta "in the fireplace" | the Hart's counter did not fit where it was asked for, so there was no bar and her place fell back to the hearth | the counter tries along the east wall and a shorter length; she stands behind it facing the room; kegs kept off the windows | `f2622ed` |
| The bier | alone | until the tally is read (`S.flags.pell`): Finn 9:00 to 15:24, Peter, Hester, Ellen, Mercy, Humphrey an hour or two each, Ivo 14:12 to 17:12 keeping them back | `f2622ed` |

What else assumed a 20-minute day: nothing found. Schedules, the bell, sleep and the night bar are all in game hours. Tests that step a day set
`Env.dayLength = 0` and move the hour themselves; `test/day.js` sets 720 and the soak 720 on purpose.

Tests changed to follow the game: `test/quest.js` reaches Rowan at ten (it found him in bed at 07:54); `test/interact.js` switches the
night rules off (`OWN.off`: it tests theft at three in the morning inside houses) and puts its witness where she can see the theft (2 m east
was behind the moved bar); `test/walkbot.mjs` does not count the way round the lake to Highfold's doorsteps as a detour.

Budget re-accepted (`c858793`): medium square 186 draws / 325k (was 177 / 329k), low square 136 / 198k: more people are out of doors at the reference
hour now that the noon meal is staggered.

Pictures (scratch, not committed): Greta at her bar, the bier with four people round it, four conversations. I can add them to the branch if
you want them in `docs/`.

Could not check: frame rate, anything in motion or audible. The sword's first press makes no sound of drawing (it borrows the swing
sound; a draw sound is for the sound session). Hale's hat at table still needs a hatless body.

### Next

1. The Hart's cellar door (inbox item 1), played by input.
2. The open list: mine and bot-soak deterministic; geomaudit as a ratchet; `test/openings.js` and `test/inout.js` as gate ratchets; door
   leaves the player must open.
