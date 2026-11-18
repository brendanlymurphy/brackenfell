# The cast merge on Build 81, checked against docs/PEOPLE.md

Build 81 is on `main` (a release branch from Build 78); `threejs` says Build 80. Measured from a build of `origin/main`.
Scripts: `test/audit/cast_vs_game.py`, `people_check.py`, `rules.py`.

## Right

| Check | Result |
|---|---|
| The 60 people of the table are in the game, the 63 old ones are gone | 77 in the game, 0 differences |
| Everyone sleeps in the building the table gives, and has a bed row | 77 of 77 (Tobin, Aldous and Bram included) |
| Every line of the table is in the voice plan, word for word (against `main`'s copy of the table, which has 30 pointer lines reworded since my draft) | 470 of 470 |
| The 49 scene lines are in the plan | 49 of 49 |
| First names used twice | 0 (was 20) |
| People with no lines | 0 (was 63) |
| The well in the morning | 10 people booked, as the table lists |
| School at the Scribe's, 9 to 12 | Ned, Amice, Will, Tom, with Emmet and Lettice |
| The Hart in the evening | 16 to 18 people from 19:00 to 22:00 (was 13 to 15) |
| People who sweep more than once a day | 2 (was 56): Mercy Garrick, Basilia Wold |
| People whose day equals someone else's | 2 (was 23) |

## Wrong or missing

| # | What | Count | Detail |
|---|---|---|---|
| 1 | **None of the new lines is recorded.** | 519 planned lines without audio (254 in the manifest) | Expected: six voice days. Until then 60 people speak in subtitles only. |
| 2 | **Two buildings kept their old names.** | 2 | `in.34` is still "Wren Cottage" (table: Sedge Cottage; Wren does not live there), `in.15` still "Grocer's House" (table: Thorne's Store, nobody sleeps there). |
| 3 | **Nobody goes to the chapel.** | 0 besides Aldous | The table books six at dawn and everyone on the seventh day. |
| 4 | **Children work in strangers' yards.** | 2 seen | Ned Thorne's afternoon work is `in.06.yard` and Tom Arden's is `in.42.yard`: yards of shell houses that belong to no household. Tom should be at his mother's vats. |
| 5 | **The streets are emptier at noon than before.** | 10 outdoors at 12:30 (18 on Build 77) | Everyone goes home to eat at once, as the table says; the table did not say the stalls should stand unattended. From 19:00 to 06:00 there are 1 or 2 people outdoors, unchanged. |
| 6 | **16 people never leave their own building.** | 16 (was 36) | Greta, Aldous, Maren, Edda, Wren (as before), and Anselm and Sabina Lindqvist, Godwin Hobb, Lambert Pell, Old Wenn, Barnaby and Ursel Crane, and all four Wolds at Highfold. The table sends Basilia to the market cross with cheese and Lambert at least to his door. |
| 7 | **Standing about is still the commonest thing anyone does.** | 200 "idle" rows of 604; 147 "work" rows | Work has no tool in the hand (`CHARACTERS.md` C03). |
| 8 | **Beds.** | 56 usable for 77 sleepers | Every sleeper has a spot to lie on; the beds a player can use were not changed. |
| 9 | **The butts.** | no such place | Scene 7 (Hugh and Hale shooting, every seventh day) has nowhere to happen. |
| 10 | **You can talk to a sleeper.** | seen with Godwin | He gives his greeting lying down with his eyes shut (`chars_lie_talk.jpg`, talk_godwin shows the room: he is in bed). |
| 11 | **Scenes.** | 12 defined (`CAST_SCENES`) | Whether they play, and with the real two people, was not checked: none ran during the play-through of the first three minutes. |
| 12 | **Households of one sleeping place.** | 20 buildings with one sleeper | The table has 11 by design; the rest are couples the game has put in separate buildings or my rule counting lodgers. Not untangled. |

## Score

`docs/SCORE.md` has the Build 81 column: 6 of 34 rules pass (4 on Build 77). Newly passing: nobody without lines, nobody without
a bed, no repeated first names. Newly failing against the ratchet: lines without a recording (0 to 519), people outdoors at noon (18 to 10).
The ratchet file is not changed; say if those two should be accepted.
