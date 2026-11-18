# Ten minutes as a new player

## 2026-11-18: again on the live build (Build 88)

Same patient bot (`test/audit/firstten10.mjs --out ft88`), plus `test/audit/doors_view.js` (the first ten doors from the gate), `door_reach.js`
and `body_reach.js` (can a held-W approach reach the prompt). Pictures `firstten_b88.jpg`, `doors_first10_b88.jpg`, `firstten_b88_body_*.jpg`.

| Question | Build 83 | Build 88 |
|---|---|---|
| Greta in the fireplace | Yes, three pictures | **Fixed.** She stands behind a counter with a window at her back (`firstten_b88.jpg` 3, 4, 5). |
| The sword out | All ten minutes | **Fixed.** No blade in the Hart, at the stalls or in conversation; only the health bar shows. |
| The drowned man without a prompt | No prompt | **Prompt works from the quay deck** ("Examine the body", reached from 5 of 8 sides). But the body lies on the raised quay: walking down Wharf Street the bot ends at (8.7, -1.0, 80.3), a metre below the deck's west edge, and from the street side (north) the prompt never comes (`firstten_b88_body_north.jpg`). Where the way up onto the quay is was not found by the bot; a player may have the same trouble. |
| The square at 08:40 | 3 to 4 people | 0 to 3 in view |
| The stalls at 10:30 | 4 to 7 | **Up to 14 in view**, 7 standing (`firstten_b88.jpg` 6) |

### The first ten doors from the gate (`doors_first10_b88.jpg`; each picture after the fade, standing in the doorway)

| # | Door | What fills the first view |
|---|---|---|
| 1 | Ropemaker's House (`in.65`) | **The stair**, across the left half; a doorway beyond |
| 2 | Ferrin's House (`in.75`) | Dark: a doorway and a wall; a stair edge at the right |
| 3 | Scribe's House (`in.40`) | A man standing in the doorway, close; the room with windows beyond |
| 4 | Warden's Lodge | A doorway, a stone wall, the stair edge at the right |
| 5 | The Pottery (`in.07`) | **The stair** across the whole view, and a person below it |
| 6 | Baker's House (`in.10`) | **A head and shoulders filling half the view**: someone standing just inside the door; a stair beyond |
| 7 | Alder House (`in.08`) | **The stair** on the left half, a door ahead |
| 8 | Brandt's Forge | The forge fire and Brandt: a room |
| 9 | Fletcher's House (`in.04`) | **The stair** fills the view |
| 10 | The Honeyed Hart | The hearth, logs, a window: a room |

So of the first ten doors a player meets, the stair fills or dominates the first view in **4** (`in.65`, `in.07`, `in.08`, `in.04`) and edges into
3 more; a resident stands in the doorway in 2 (`in.10`, `in.40`); only the forge and the Hart open on a room. All ten doors can be reached
and entered; the prompt shows at 2.7 m. One door that cannot: the Cobbler's House (`in.44`): the closest a player gets is 4.2 m and no prompt
shows (`door_reach.js`).

### Where the bot failed (not the game)

The bot entered Hobb's Cottage's doorway while Alison Pike stood in it, pressed E, and was left in her conversation for the rest of the run, so
the house, the wharf and Finn were not seen in this run; the doors and the body were redone with the separate checks above.

## Build 83, waiting for people

`test/audit/firstten10.mjs`: by input from the title screen, walking at a person's pace on the villagers' own paths. It waits for anyone
who is walking to stop, steps up until the prompt names that person, picks the first question and then leaves the conversation, and stands
still to watch in the square, the Hart and the market. 615 seconds of play, 38 pictures (`firstten10_1.jpg`, `firstten10_2.jpg`; the
numbers below). 844 x 390, Medium. Nothing heard, nothing seen in motion.

Route: gate and Hale, main street, 30 s watching the square, the Hart and Greta, 15 s watching the Hart, 30 s at the stalls, Hobb's
Cottage, Wharf Street, the drowned man, Finn, Maren, then the square until ten minutes were up.

## Better than Build 81

- The start: on the road facing the gate, no hedge in the face (2).
- Talk prompts name the person (3, 11, 25) and Hale, Greta, Finn, Maren and Lark are voiced.
- Market at 12:30: 4 to 7 people in view, 2 to 4 of them standing (17 to 19). The square at dusk has lamps and a few walkers (30 to 38).

## What breaks belief, in order met

| # | Clock | Pic | What | Sev |
|---|---|---|---|---|
| 1 | 07:55 | 2 to 38 | The sword is drawn across the screen for the whole ten minutes, including in the Hart and in conversation. | S2 |
| 2 | 09:20 | 8, 9, 10 | The same tip, "Tap the menu button for your journal, pack and map", sits on screen in three pictures in a row over 20 seconds of standing. | S3 |
| 3 | 11:50 | 11, 12, 14 | **Greta stands in the fireplace.** Talking to her, she is framed by the hearth opening with the fire behind her, in three pictures from the doorway side. Seen on Build 81 too. | S1 |
| 4 | 12:00 | 15, 16 | The Hart at noon: nobody but Greta. A loaf on a table offers "Steal rye loaf". | S2 |
| 5 | 12:40 | 17, 19 | **Diggory Pike and Roger Hask, standing side by side at the stalls, have the same face, skin, headscarf and smock.** Two people in one, the owner's complaint, in the busiest place in town. | S1 |
| 6 | 12:40 | 17 to 19 | The bot could not get Roger Hask's prompt while Diggory stood next to him (the prompt kept naming Diggory or Maren). A person would point at Roger and get Diggory. | S2? |
| 7 | 13:55 | 20, 21 | Into Hobb's Cottage: the inside picture is black two seconds after the door (the fade). Idony was not at home. Nobody reacts to a stranger walking in. | S2 |
| 8 | 15:25 | 23, 24 | **The drowned man still lies alone** on a bier in the middle of an empty cobbled circle. Peter Marsh stands 8 m off. The bot stood beside it and got no prompt; E did nothing. | S1 |
| 9 | 17:10 | 25, 26 | Finn: "Shh. You'll scare the char." He found the body this morning; his first line is about fish. Voiced, and his eyes are open. | S3 |
| 10 | 18:53 | | A notice: "A cloak slides into the dusk before you can reach it. She will be back another evening." Nothing was visible to reach. | S3 |
| 11 | 19:00 to 20:10 | 33 to 38 | The square empties: 0 to 3 people in view, mostly walking away. The regulars are in the Hart; nobody sits out. | S3 |

The clock ran 07:55 to 20:10 in 615 seconds. A new player's whole first day is ten minutes.

## Where the bot gave up after waiting (people it could not talk to)

Stephen Alder on the main street, Roger Hask at the stalls, Idony Hobb (not at home), Peter Marsh at the wharf. Each was waited for and
approached up to eight times. Some of this is the bot (it does not walk round a person to their front); Roger is the case above.
