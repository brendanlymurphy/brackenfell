# The 38 quest stages, played by following the mark (Build 89, live)

Inbox 06:20 item 4: "play the 38 quest stages end to end by input, each from where the previous one leaves the player, with no help."

How: `node test/audit/questwalk.mjs --out <dir>` on a worktree of `origin/main` (Build 89). For every stage of every quest in the order the game
lists them (`QORDER`), the quest is set to that stage. The walker then reads the compass mark the game shows (`Cells.mapTarget(questTarget(q))`)
and walks to it by held keys (W and turning, 30 steps a second). Outdoors it follows the villagers' path graph, using the graph's own costs.
At a door it steps up until the door's prompt shows and presses E. Inside, it follows the mark again. Each stage starts where the last
one ended. Nothing is teleported. No item, key or story flag is given, so anything locked stays locked: this tests whether the **mark** leads a
player somewhere usable, not whether the story's logic holds. The clock ran on from 09:50 on day one to 12:36 on day two, so some stages fall at night.
Pictures: `questwalk_b89.jpg` (12 views); every stage's picture is in the run folder (not committed). Headless: nothing seen in motion,
nothing heard.

Four runs were needed before the walker was good enough to judge the game by. The first three runs' failures were the bot's:
- it counted links instead of costs, so it took the graph's "eight times the length" fallback links, which run through walls;
- one stuck leg removed a link for the rest of the run;
- it read the cell before a door had finished, because the fade runs on real time.

A place where the bot kept getting trapped, (21.7, 1.8, -59.3), can be walked out of in three directions by input (`trap_probe.js`).

## Result (run e)

| | Stages |
|---|---|
| The mark led to the place, with the right prompt or the person in reach | **21** |
| The mark led to a door that is shut, with an honest message (the mine needs its key; houses barred at night) | 5 |
| Not reached because of the game (faults 2 and 3: the bier, Aldous overhead, the crypt gate and reliquary below) | 4 |
| Not reached because of the bot (stuck behind the Hart's bar, or after being knocked out at the outlaws' camp), re-checked below | 6 |
| Not established (Elder Rowan at 02:00) | 1 |

The game lists **37** stages, not 38: `QORDER` holds 13 quests: main 10 stages; hammer, bell and crypt 3 each; the other nine 2 each.

## Faults found (the game's, not the bot's)

| # | Fault | Where | Evidence | Fix |
|---|---|---|---|---|
| 1 | **"Discovered · undefined"** banner | Build 89's four new ground places `orchard.nw`, `orchard.ne`, `green.sw`, `drying.sw` are in `World.places` with no `name`, and the two orchards and the drying green have no `x`, `z`, `r` (they are boxes, `x0..x1`). The discovery check (`85_ui.js:203`, `hyp(pl.x - ex, pl.z - ez) > pl.r`) is then never true, so it never skips them and the banner shows "undefined" wherever the player is, one at a time. | `places_unnamed.js` lists them. Seen in play at the fire pit at 02:20 (`questwalk_b89.jpg`, "fire 1"). | Give them names, or `minor: 1`, and a centre and radius. Or skip places with no name in the check. |
| 2 | **Stage marks inside a building point through the floor or the ceiling** | Crypt stages 1 and 2: in the chapel the mark points straight at the gate and reliquary 2.2 to 2.8 m **below** the nave, not at the way down. The walker stood within 2 m of the gate's mark, on the floor above it (`crypt 2`). Bell stage 1 at night: Brother Aldous is asleep 3.8 m **overhead**; the mark points at the ceiling (`bell 1`). | questwalk notes 35, 36, 26 | Inside a cell, when the target is on another level, mark the stair or hatch that leads there (the Hart already does this for stage 7). |
| 3 | **The bier can only be reached by a way the mark does not show** | Stage 0 ("a dead man lies on a bier"): the mark points across the shore. The villagers' path graph reaches the bier only by link 112 to 1644, which climbs the quay's 1 m wall from the beach (5.5, -1.06, 82.7) to (14, 0, 80). The player cannot climb it (`edges_probe.js`: stuck 5.3 m short). With that link removed the graph has **no other way** to the bier node. The walker stopped at the foot of the quay wall, 6 m from the body (`questwalk_b89.jpg`, first two views). A player can reach the deck by the wharf, as on Build 88, but nothing points there. | edges_probe, questwalk note 02 | Link the bier to the quay deck's own path; or put steps where the graph climbs. |
| 4 | **A villager stands in the Hart's front door at night** | At 22:00 Osric stands inside the Hart's doorway. The prompt there is "Talk Osric", not "Leave". The walker could not get out for one stage. | `questwalk_b89.jpg`, "22:00 Osric in the Hart door" (run c, stage herbs 1) | His evening spot should be off the door's line. |
| 5 | (honest, but worth a look) **The mark sends the player to a barred door at night** | Bring the frostcaps to Maren (00:48) and buy a rope from Marta (01:00): the mark is the house door. E says "Barred for the night. This is Old Maren's door." / "Shut. Marta Quill opens at eight." Correct, and the message is good. But the objective does not say to wait, and the mark keeps pointing at the door. | toasts in the run | Optional: "(she opens at eight)" on the objective line at night. |

Checked and found to be the bot, not the game:
- **Behind the Hart's bar** (264.4, -399.7, -1.4): the walker followed Greta's mark to her place behind the counter. The link out (1863 to 1864) walks
  fine by input when tried on its own (`edges_probe.js`: ok). From that spot only the south-west is open (8 directions: 0.1, 0.1, 0, 1.0, 1.0, 2.4,
  0, 0 m in 3 s), and Greta or Brandt standing in it blocks the turn. A player would step round them; the walker did not. Five stages lost (ale 0, hammer 0, hammer 1, and the start of herbs 0).
- **After the outlaws' camp**: the walker does not fight. It was knocked out ("You come to by the road, bruised and 1 gold lighter"), and the two
  stages after that show a black screen. The links out of that roadside place walk fine by input. The knock-out's fade runs on real
  time, which the walker does not wait for: a bot fault, not judged further.
- **Elder Rowan at 02:00** (fire 0): the walker stopped 17.6 m short against the rock of the chapel hill at night. Not established which.

## Every stage

| # | Stage | Ended | Prompt there | Verdict |
|---|---|---|---|---|
| 02 | main 0: Go to the wharf: a dead man lies on a bier | 6 m short, at the foot of the quay wall | | **fault 3** |
| 03 | main 1: Show Old Maren the tally token | 0.9 m | Talk to Maren | ok |
| 04 | main 2: Find the Sexton's mine key in the crypt | in the chapel, 1.3 m | Open chest | ok |
| 05 | main 3: Unlock the Old Mine | at the mine door | Enter the Old Mine: "Barred from the far side ... Somebody, once, kept a key for it." | shut, honest (no key carried) |
| 06 | main 4: Find what became of Corwin | the same | the same | shut, honest |
| 07 | main 5: Take Corwin's journal to Warden Hale | 0.9 m | Talk to Hale | ok |
| 08 | main 6: Ask Elder Rowan what has been left at the lake | 0.9 m | Talk to Rowan | ok |
| 09 | main 7: Find the way under the Honeyed Hart | in the Hart, at the cellar stair head | | ok (Build 86's fix holds) |
| 10 | main 8: Follow the smugglers' tunnel | the same stair head | | ok |
| 11 | main 9: Decide what is owed at the Bread Cave | the same stair head | | ok (the way is through the cellar) |
| 12 | welcome 0: Speak to the guard at the gate | out of the Hart, across the square, 1 m | Talk to Hale | ok |
| 13 | welcome 1: Find Greta at the Honeyed Hart | in, behind the bar | Read | bot (the bar) |
| 15 | ale 0: Fetch the malt from Osric at the mill | stuck behind the bar | Talk to Greta | bot |
| 16 | ale 1: Carry the malt back to Greta | 0.6 m | Talk to Greta | ok |
| 18 | hammer 0: Ask the boy Tobin | stuck behind the bar | Talk to Greta | bot |
| 20 | hammer 1: Search the Old Watchtower | stuck behind the bar | Talk to Brandt | bot |
| 21 | hammer 2: Return the hammer to Brandt | 2.5 m (Brandt at the Hart in the evening) | Talk to Brandt | ok |
| 23 | herbs 0: Gather five frostcaps | out, 3.7 m from the first frostcap | | ok |
| 24 | herbs 1: Bring the frostcaps to Maren | her door, 00:48 | Enter: "Barred for the night" | shut, honest (fault 5) |
| 25 | bell 0: Buy a rope from Marta | the shop door, 01:00 | Enter: "Shut. Marta Quill opens at eight." | shut, honest (fault 5) |
| 26 | bell 1: Take the rope to Brother Aldous | in the chapel, 1 m across, 3.8 m below him | | **fault 2** |
| 27 | bell 2: Ring the bell | 1.1 m | Ring the bell | ok |
| 28 | fire 0: Speak with Elder Rowan (02:00) | 17.6 m, against the chapel hill | | not established |
| 29 | fire 1: Light the fire pit in the square | 1.5 m | Light the harvest fire | ok; **fault 1** on screen |
| 30 | camp 0: Drive the outlaws from their camp | 1.4 m; attacked, knocked out | | ok (the bot does not fight) |
| 31 | camp 1: Tell Elder Rowan the camp is empty | black screen after the knock-out | | bot |
| 32 | tools 0: Find Garrick One-Ear | the same | | bot |
| 33 | tools 1: Bring Brandt his tools | in the smithy, 2.5 m | Talk to Brandt | ok |
| 34 | crypt 0: Find the crypt key in the sacristy | 1.3 m | Open chest | ok |
| 35 | crypt 1: Unlock the gate in the crypt | 2.2 m across, **2.2 m above** the gate | Open chest (the sacristy's) | **fault 2** |
| 36 | crypt 2: Open the reliquary | 3.7 m across, 2.8 m above, against the nave wall | | **fault 2** |
| 37 | bounty 0: Put down five outlaws | 2.5 m from the mark on the north road | | ok |
| 38 | bounty 1: Collect the bounty from Warden Hale | 1 m | Talk to Hale | ok |
| 39 | tea 0: Gather bogbean, sunwort and stonecrop | 1.3 m | | ok |
| 40 | tea 1: Bring the herbs to Maren | 1 m | Talk to Maren | ok |
| 41 | brother 0: Find what happened to Corwin | the mine door | Enter the Old Mine (barred) | shut, honest |
| 42 | brother 1: Bring Corwin's cap to Elder Rowan | 0.9 m | Talk to Rowan | ok |

(Rows 14, 17, 19 and 22 of the run are the walker's extra pictures where a door prompt was taken by the person beside it.)

## Not checked

Fighting (the bot does not), anything behind a lock (no keys carried), whether each conversation then advances the stage, and
anything heard or in motion. The Bread Cave and the tunnel were played by input on Build 88 (`POINTERS.md`); here the walk stopped at
the Hart's stair head for stages 8 and 9, which is where their marks point from inside the Hart.
