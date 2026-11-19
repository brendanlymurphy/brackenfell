# Reports: Agent OG (fork-cull) to the coordinator

Newest first. Times UTC.

## 2026-11-19, the 16:45 inbox (the slice)

Merged `origin/threejs` (c153f8e, the handbook) first. Read `docs/HANDBOOK.md` and `docs/NEXT.md`.

Gate: quick running on `6cf364e` (result to follow here).

1. **The lock list** (`7ed0731`, tests `2b18d09`, bots `ace9375`, `docs/SLICE.md` `6cf364e`). **17 interiors open:** the sixteen
   and the mine, which main stages 8 and 9 enter through the Hart's cellar. **41 locked.** It was derived from the running game,
   not read off by hand:
   - all 990 quest targets (every quest, every stage, at six hours of the day, people wherever they are at that hour);
   - the 9 secrets, every story object inside a cell, the traders (Brandt, Marta, Greta) and the board.

   Nothing outside the sixteen was needed except the mine: the shut house (`in.23`) carries the one indoor secret, and every
   other stage lands in the sixteen. `docs/SLICE.md` gives every cell with its reason, and every locked house with who lives there.
   - **The lock** (`SLICE` in `82f_owners.js`): every door into a locked house, back doors and hatches included, says "Locked."
     and offers only "Locked". There is no pick try, a pick in hand is not used, and this holds at every hour. The people keep
     their days and their beds (59 sleep in locked houses).
   - Books and letters now lie only in kept houses (one marked line in `82b_interact.js`), so no clue is shut away: 12 books
     placed.
   - **Tests:** a new quick step `slice` (`test/slice.js`) derives all of the above again and asserts every one of the 42 locked
     doors refuses. The `cells-*` chunks, `interiors` (16 buildings) and `inout` go through kept interiors only. `inout` was
     accepted at 0: none of the kept houses differs inside from out, against 12 town-wide.
   - `owners` uses the Draper's and the Bookstall, and checks that the Cooper's, the Baker's and the Bread Stall say "Locked.".
     The play bot's sweep skips locked houses; theft and the witness use a kept house; the night scenario uses the Draper's.
     The walk bot goes through kept interiors only.
   - Not seen by me: the bot's full run on this (GitHub runs it).
2. **Voices.** The run began at 08:41 with the generator's new order. **570 of 774 lines have audio (was 529).** The day's limit came at 70 requests, not 100.
   None of 29 whole-character batches passed the new cut check, so every batch fell back and 41 lines came one per request.
   Tomorrow's run goes line by line from the start (reminder set for 08:40 UTC). `check.mjs` passes and `extract.mjs`
   prints no UNATTRIBUTED.
   - **Complete since yesterday** (the owner can listen to these): Giles Varrow, Diggory Pike, Hester Slate, Goda Malkin. With
     yesterday's that is the story's 17 and 33 of the cast.
   - Partly recorded: Tilly 9 of 10, Felice 7 of 8, Gillian 1 of 8, Jocelyn 1 of 10.
   - None yet (23): Laurence, Ned, Tybalt, Winifred, Miles, Kat, Tamsin, Jasper, Ysolt, Davy, Warin, Ulric, Beatrix, Amice,
     Emmet, Lettice, Roger, Odo, Ursel, Silas, Adda, Ellen, Kester. 204 lines; three more days at this rate.
   - Nobody has heard these; only the owner's ear counts.
3. **The 16:15 entry**, read against the scope cut:
   - The boat-house doors and Wenn's key, and the "Hidden Yard": the wharf and Washing Lane are outside the slice, so they are
     left as they are until you say. The boat-house doors are not in the slice's walk.
   - **The Hart's cellar corner** is inside the slice. It is the interiors session's light (72e). Request to them: one of the
     cellar's flames should reach the bricked doorway.
   - The picture of Tom, Lettice and Davy: below, when taken.

## 2026-11-18, the 15:45 inbox

Merged `origin/threejs` (Build 89) first: no conflict.
Gate: quick on `4c84d1d` passes, 21 of 21. Merge candidate.

1. **Tom, Lettice and Davy on youth bodies** (`9178b30`). Under 13 keeps a child's body; 13 to 15 has `m_youth` or `f_maid` at
   0.88 + 0.035 a year: Tom (13) `m_youth` 0.88, Lettice (14) `f_maid` 0.915, Davy (15) `m_youth` 0.95, about 1.51, 1.57 and 1.63 m.
   Their days are unchanged (Tom and Lettice still keep the school and play rows of a child; they no longer run). `test/cast.js`
   holds the bound (13 to 15 on a youth body at 0.88 to 0.95): 77 pass. **No picture:** four tries in the square had furniture in the
   way or the five walked off before the frame; the bodies and scales above are read from the running game.
2. **Voices.** The day's limit was spent this morning; it resets at 08:00 UTC and a reminder for 08:40 is set. The generator now
   orders single-line requests as you asked (a character's whole set in one request only when every cut passes the refusal; otherwise one
   line per request, the characters with the most lines missing first, story speakers before the cast, a character's lines before
   their barks).
   **Complete now (every line recorded; the owner can listen to these):**
   - the story's 17: Brandt, Hale, Greta, Ivo, Osric, Tobin, Maren, Aldous, Marta, Rowan, Edda, Finn, Lark, Wren, Pip, Hilda, Bram;
   - of the cast, 29: Godwin, Avice and Idony Hobb; Hugh and Stephen Alder; Joyce and Randal Byrd; Anselm and Sabina Lindqvist; Petronel
     Vey; Gilbert, Elinor and Simon Thorne; Fulk Varrow; Alison Pike; Lambert Pell; Old Wenn; Barnaby Crane; Humphrey Slate; Bridget
     Malkin; Peter and Will Marsh; Mercy Garrick; Alaric Mossop; Wilmot and Tom Arden; Jordan, Basilia and Rosalind Wold.
   - Partly: Tilly Hobb 9 of 10, Felice 7 of 8, Gillian Alder 1 of 8.
   - Not yet: Laurence Byrd, Jocelyn Lindqvist, Ned Thorne, Giles, Tybalt and Winifred Varrow, Diggory Pike, Miles, Kat and Tamsin
     Ashdown, Jasper Holt, Ysolt and Davy Pell, Warin Shaw, Ulric, Beatrix and Amice Ferrin, Emmet and Lettice Sele, Roger and Odo Hask,
     Ursel Crane, Silas Garrow, Hester Slate, Goda Malkin, Adda, Ellen Marsh, Kester Wold.
   - 529 of 774 lines; 245 to go.
3. **One at a time through a door** (`436f994`). Their two ways joined at a way point 2 m inside the Hart, not at the threshold, and they
   reached it together from two sides; so the rule is for any way point, the door's threshold included. A walker 1.5 m short of the next
   point of their way stops, idle, while someone nearer is bound for the same point or has only just left it (within 0.7 m), or, at a door,
   someone who has come through stands on the threshold; at most 3 s, so two can never wait on each other. Marta leaves the Hart at 22.2
   again. `apart` (83 people, a whole day) and `npcsep` pass; `routes`, `interact`, `cast`, `memory`, `scenes` (12 of 12) and `owners`
   pass with it (nobody is late anywhere it matters).
4. **Greta in the fireplace: not so on Build 89.** In the refitted Hart her place at the bar is 5 m from the hall's hearth and 12 m from
   the kitchen's; from the doorway and from the talk camera on three sides she stands behind the long table with a window behind her
   (pictures taken; the audit saw it on Build 81's Hart). `test/cast.js` now fails if any place in anyone's day lies inside a hearth.
   **The drowned man's prompt: found** (`f8aa8f3`). The mourners I gave him (Peter, Hester, Ellen, Mercy, Humphrey; Finn and Ivo) stand
   at the bier, and looking level from beside it the prompt named the one across the bier: her head is straight ahead, the body 32
   degrees below. The body now has a small priority (`it.pri`, one marked term in 85_ui's scoring): it wins while it is in view, the
   mourner when you look at her (Hester is still spoken to from all eight sides). E opens the card, gives the tally and starts the
   story. `test/pointers.js` checks the prompt from four sides at eleven, with Hester there.
5. **The `[fx3]` block** (the green's stepping stones): kept as it is. Each stone links only where the way is clear, the green's wider
   link radius applies to its bench alone, and the hunter's yard detour is a fact of the town.
6. **`mine`, `bot-soak`:** both passed in every threejs run since Build 86 (aeb13ce, 5ca78ee, 997710c, and the failed b56755e and
   3b991ca, which failed elsewhere). The re-homed people hold (`cast`: everyone is sent only to places that exist).
   - b56755e failed `bot-play` once: "the hatbox in the shut house did not open" (`cont.in.23.chest`). Already answered by your Build 88
     line in `82c_secrets.js` (the hatbox beyond the bed in that loft, reach 1.9 m at 2.06 m; now 2.5 m); the way round the bed is the
     interiors session's. Nothing of mine.

## 2026-11-18, the 09:40 inbox

**At the top: `hartdoor` fails on this branch until the inspector's move is in, by design.** It now asserts that the fresh brick faces true
east, and `World.hartWall` (published by `dressInn`, 72e) is still the cellar's +x wall, which faces 270 degrees (west). The -x wall can
take the door: the cellar stair (plan x -2.6 to 1.4, z 6.7 to 7.8) and the doorway to the vault (on the z = 8 wall) are elsewhere; only
casks stand along it. With `hartWall` published on the -x wall (plan x -6.8, z 4.05, simulated in the page), the whole walk passes: brick at
90 degrees true, named, opened once told, through the tunnel and back. Nothing of mine needs to change when it moves.

Gate: quick on `e8f573b`, 19 of 21 pass. `hartdoor` fails on the bearing only (above). `budget-medium` was over the file taken from threejs
(alley 199 draws against 193; square 195 against 192; lake 171 against 168: the cast out of doors) and is re-accepted at these figures.
GitHub `gate` on `83e8d54`: every step passes except `hartdoor`, the bearing only (5 of 6 jobs green).

1. **The compass reads true indoors.** A cell is built in its house's own frame: the door inside, turned by the site's yaw about the cell's
   origin, lands on the door outside with 0.00 m error in all 57 cells. So the heading inside plus the site's yaw is the heading in the
   town. `Cells.trueYaw()` (94f) gives it; the compass's points (85_ui) and the map's arrow (86_map) add it (marked `[cast]` lines);
   discovered places on the compass are measured from the house's outside door when you are in. Quest marks were already right relative
   to you (both ends in the cell's frame). In the Hart (site yaw 180) the plan's -x is truly east. `test/pointers.js` checks the frame in
   every cell and the turn inside and out.
   - The Hart's brick: everything of mine follows `World.hartWall` wherever it is published (prompt, doorway, both portals, the landing,
     the compass); without it, `HART.find` now picks whichever cellar wall is truly east, not the plan's x1. `test/hartdoor.js` faces the
     wall wherever it is, walks round the cellar floor to it (straight across from the stair foot leads back up the stair, which runs along
     x), and asserts east within 20 degrees.
2. **Quest marks.** Inside a building the mark already pointed at a target in the same building (`Cells.mapTarget`) and at the door for
   anything elsewhere; the chapel and the Hart had targets that were outside (fixed earlier). New: out of doors a mark on a building's
   middle (the crypt quest on the chapel, main stages 2, 7, 8, 9 on the Hart) pointed at the roof; it now points at the door that leads
   in. Audit of every quest and stage: none is on a building's middle any more and none is far off; `test/pointers.js` keeps it so.
3. **Roger Hask is not on a child's body.** In the running game he is `m_hunter` at scale 1 at every hour (checked 9, 11, 14, 16 h; the
   body comes from his voice M). The child in Agent Four's market picture (`docs/proof/chars/dress/market_and_draper.jpg` on fork-ch1) is
   Lettice Sele, 14, who minds the bookstall: voice G, so `f_child`, as the table says. `test/cast.js` now checks the drawn body against
   the age (nobody over 15 on `m_boy`/`f_child`, nobody under 13 on a grown body; Tobin and Pip as children): 77 pass.
   - **Decision for you:** at 14 Lettice is drawn 1.34 m tall (the child scale tops out at 0.78 of 1.72 m); Tom at 13 is 1.31 m. Real
     children of that age are nearer 1.50 to 1.60 m. Either give 13 and 14 the youth bodies at 0.9 (as a YM under 17 already is), or
     raise the child scale for them. I have changed nothing.
4. **Voices: under way.** One request now carries all of one character's missing lines (`--batch 12`); a pilot of Tilly's ten in one
   request cut cleanly (0.06 to 0.10 s per character, every piece). 510 lines were missing in 63 speakers: 63 requests if every batch
   cuts. **529 of 774 lines have audio now (was 254).** The day's limit
   stopped it. 38 batches cut cleanly; 32 did not and fell back to one line per request, which spent the rest of the day. A connection
   dropped once mid-run; the generator now retries that.
   - **Six takes and four characters taken out again (36 files), until tomorrow:** two clipped files (Tilly, Felice) and every new
     take of Kat, Beatrix, Ned and Hester. Each of those four had a piece whose length cannot be its text (Hester's 95 characters in
     2.65 s, Ned's 18 in 0.64 s, Kat's "Winifred! Noon!" over 5 s, Beatrix's "Careful. Careful!" nearly 5 s), so a cut probably landed
     wrong, and a wrong cut shifts its neighbours. The batch check now also refuses any piece of 14 or more characters outside
     0.045 to 0.2 s a character; all four batches would have been refused. `voices`, `voice_game`, `voice_parts`, `audio_game` pass;
     `extract.mjs` prints no UNATTRIBUTED.
   - 245 lines remain (subtitles until made): about 40 requests at the cut rate seen today. Tomorrow's run:
     `python3 -I tools/voice/gen_gemini.py tools/voice/plan.json tools/voice/cast_gemini.json audio/voice --batch 12`, then `--have`.
   - Not heard by anyone: only the owner's ear counts. The cut checks are lengths, not listening.

## 2026-11-18, the 09:10 inbox

Gate: quick passes locally on `475ffc7` except the medium budget, re-accepted in `fef5c4c` (square 195 draws, alley 199; more people out of doors).
**Low is over its 140 / 200k target in three views** (square 150 / 217k, alley 147 / 205k, lake 123 / 205k; it was 136 / 198k in the square
before the merge). The part I added is people (37 villagers in the square view); the rest came with Build 86. Needs whoever owns Low.

Merged `origin/threejs` (Build 86). Conflicts: the plan file (took the interiors session's), `77e_households.js` (kept mine: it has your
one-seat fix plus distinct standing places), `test/hartdoor.js` (both: through the new cellar door first, then a player's own way round the
furniture to the stair head), the budget file (yours).

- **`mine` is deterministic now.** Caught the failure: "the Foreman did not show his pattern" (no `b_charge`). The test sometimes killed him
  before he charged. Also the seed was used up during loading (assets arrive in any order), so the fight differed run to run even with
  `seed=7`. Now: the seed is set again after the foes load, the test does not cut the Foreman down before he has shown his slam and his
  charge (or a minute has passed), and the failure message puts the reasons first (the gate's log cut them off). Six runs, six passes.
- **Re-homed after the removed shells:** Jasper out by the west gate in the morning and at his own axe block after noon; Tamsin at the hive
  yard (in.32) and her own skeps by her door; Idony at her own hens (the new in.12 yard); Giles at the tannery yard; Wilmot at the new dye
  yard (in.06); Felice at home. No yard that is gone is named any more.
- **Scene 7 plays:** the town worker built butts behind the guardhouse, so on every seventh day Hugh and Hale shoot there from about four
  to five, and the scene is heard. All 12 scenes pass.
- **The Hart in the evening:** the new Hart has fewer evening seats; the two of scene 10 are seated first, and anyone left over stands at
  the bar in a place of their own (two had stood in one).

## 2026-11-18, after the 07:10 inbox: wilds, the market cross, the well

- **`wilds` was failing on this branch after the merge** ("to hamlet: stuck"), not every time. Two causes. (1) The new stepped market
  cross in the square (`73k_square.js`, the town worker's) had one solid 3 × 3 m collider 0.6 m high over its three 0.17 m steps: nobody
  could climb it, yet the walk tests and the villagers' graph went across it. Now the steps are floors and only the pillar is solid
  (a small marked edit in their file). (2) The test was not seeded, and passers-by stood in the way by chance: the gate's `wilds` step
  now runs with `seed=7`, as `mine` does. Seeds 7 and 3 pass; two gate runs pass.
- **The morning well** held seven in a ring at once and blocked the square. Each of the ten now has a twenty-minute turn at a set time,
  never more than four at once (the table's "four spots and a queue"), and the pairs of scenes 1 and 2 still meet there.
- **Talk camera:** where you stand is judged only by whether you can see the speaker; standing against a dais or a table no longer makes it
  step you aside.
- **Written pointer texts** (not recorded): the passage note's loft key ("nobody ever locks it"; there is no key and no pot), the Magpie
  notice's lane (her real route), two signposts ("the Wayside Shrine", "the watchtower road").

## 2026-11-18, the 07:10 inbox (fork-integ)

**GitHub:** `5e74547` red on `stairs` only (all other steps green); `cd42e2c` and `2f57662` in the gate as I write. The `stairs` failure is
the single walk "inn.cellar down stick-half from (266.2, −399.7, −0.5)": a start point 3.2 m from the cellar stair's head that falls between
the Hart's counter (the interiors session's `dressInn`, counter at x 265.1, z −1.75 to 2.05) and the east wall, where the walk snags at
once. It came with the merge of `threejs`; on this branch before the merge it passed. For the interiors session (or the test: a start
point behind a counter is not a place a player comes down a stair from).

**Also changed since the last entry:** three cast lines that pointed at nothing (Emmet's ledger and pay roll, Ellen's "Humphrey's stall"),
none recorded (`2f57662`).

**Not mine, from POINTERS.md, needs a decision:** inside a building the compass uses the building's own frame; the Hart's site is turned
180 degrees, so inside it the compass reads south as you walk in northwards. Rowan's recorded "the east cellar wall" and Odo's "east wall"
are east only on that turned compass: the brick (on the plan's +x wall) faces true west. Either the compass stays as it is (my reading,
easiest to undo, nothing changed), or it is set to true directions and the brick moves to the plan's −x wall (then the inspector's recess
moves too).

I checked out `fork-integ` (7b637a0) in a scratch worktree and ran the three failing steps there, with my files copied in. Nothing pushed
to it.

**`apart` and `npcsep` (the Byrds).** On fork-integ the cooper's plan has two seats, no bench, and every place it names (`home`, `fire1`,
`stand2`, `front`, `pew1` ...) at one point, because a plan's missing places are all made at its `home`. Your `k < seats.length` fix was
not enough: all three Byrds worked and ate at that one point. Now (`77e_households.js`, my file) no two of a household are given standing
places closer than 0.8 m. When every place the plan names is taken, one is made on the plan with `pSpot` (read-only use of the plan
functions) at the nearest free point of that floor, 0.8 m off the walls, facing the room. Stair ends, pews, door and `front` places are
never used for this. With that file on fork-integ, `apart`, `npcsep` and `people` pass; on this branch too.

**`hartdoor`.** On fork-integ there is no way across the Hart's floor from the front door to the cellar stair's head: a floor map with a
height-aware collision test shows the head (x 264.5 to 266, z 2.0 to 2.5, the stair now at the back wall) boxed in. A solid line runs across
z 0.5 to 1.5 from x 255.5 to 267, with one gap at x 256 that leads to the stairwell's west end, not its head; beyond z 3.0 a strip at
x 266 leads nowhere. **For the interiors session:** open the way to the stair head from the bar room (the rail or counter across z 0.5 to 1.5
near x 264 to 266). The check now finds a player's own way round the furniture on a 0.25 m floor grid, not the villagers' graph, so it
fails only when a player truly cannot get there.

**Requests for the plan files (now the interiors session's), each held by a test:**
- A bar in the Hart that always exists (my retry is gone); held by `people` (Greta at her bar, not the hearth) and `hartdoor`.
- A bed for every sleeper (`castBeds` / `castBedIn`: 10 extra beds, Tobin's in the forge loft); held by `cast` (77 beds, one sleeper each,
  in their own house).
- Seats: a household eats at its own table where the room allows; held by `apart`/`people` (now passes without seats, by standing).
- Distinct standing places in a workshop or back room (a bench, a counter, a hearth) rather than everything at `home`.

**Found:** `World.blockedAt` ignores height (it tests at y = 0), so inside a cell it counts the floors and ceilings as solid and reports
nearly everything blocked. Anything that uses it indoors is wrong. Callers: `77_npc.js` passers-by, `77c_patrons.js`, `73k_square.js`
(all outdoors, so fine today). My talk camera's step aside (`87_feel.js`) used it, so indoors it never stepped you clear of a shelf: now height-aware.

Gate: quick 20 of 21 locally on this head; `stairs` is the one inherited from `threejs`.

## 2026-11-18, the 06:20 inbox

Gate: quick 20 of 21 locally on the head; `stairs` fails, the same single walk as on `threejs` 2cc9ae6 (the Hart's cellar stair at half stick from (266.2, −399.7, −0.5)): not from this branch, it came with the merge.

Merged `origin/threejs` (Build 84). Conflicts: `tools/gate_budget.json` (took yours, then re-accepted) and the Hart's bar in `72e_plans.js`
(we both fixed the missing counter; I took the inspector's version).

**1. The Hart door is one mechanism.** `94e_hartdoor.js` places the brick, the doorway, both portals and the landing from `World.hartWall`
when it exists (its `inW` point gives the inward direction), from the plan otherwise. Checked in the page: source `hartWall`, one
`sec.wall`, one `door.tunnel.in`, one `door.tunnel.out`. `hartdoor` passes.

**2. Pointers (POINTERS.md), all in `src/94f_pointers.js` plus small marked lines, gate step `pointers` (quick):**
- In the chapel the crypt quest's mark points at the sacristy chest, the crypt gate and the reliquary in turn (main stage 2 too, by what
  you hold); it pointed at the chapel door.
- Stages 8 and 9: out of doors, at the Hart (the way in), or at the cave's cleft once the tunnel has been walked; in the Hart, at the stair
  head then the brick. They pointed 1.1 km SSE.
- The Hart's back door ("Go in by the kitchen door", into the kitchen) and cellar hatch ("Go down the cellar hatch", to the cellar, barred
  22 to 6) work. Back door at (3.0, 0.1, −27.8), hatch at (−1.5, 1.1, −28.4). Both give their prompt to a player who walks up and looks.
- Boat-house doors: "Knock on the boat-house door"; nobody answers, the keys are with Old Wenn (as the board says, and as Wenn and Joyce now
  say in the cast). Not a way in: they stay shut.
- Tobin's note says east of the plaque (it is a written note, not recorded); the stone is 4.5 m east.
- Wren's frostcap (recorded line "forest edge, north-west of the gate") moved from (−57, −47) to (−70.3, −17.5): outside the west gate,
  north-west of it.
- The Hidden Yard: still not built (no lane has that role). Until it is, the Magpie's message reads "She went to ground behind the
  Cutler's House" and the sack's prompt "Look in the grass by the fence" (there is no well there; I looked). When `hiddenyard` exists the
  old text comes back.
- Not done from POINTERS.md (not in your list): the compass inside the Hart being turned 180 degrees, "the weavers' lane", the rusted cellar
  key, the loft key under the pot, Emmet's ledger and pay roll, the burial stone, the signposts, Maren's directions.

**3. The tour:** who is in each building now (whole-day probe):
| | 10:30 | 12:18 | 15:18 | 20:12 |
|---|---|---|---|---|
| The Hart | Greta | Greta + 5 diners | Greta | 15 |
| Chapel | Aldous, Felice | Aldous | Aldous, Idony | Aldous |
| Mill | (Osric at the door) | Osric | Osric | Osric |
| Guardhouse | Ivo asleep | Ivo at dinner | (both out) | Ivo at supper |
| Baker's | Godwin asleep | Godwin asleep | Godwin asleep | Godwin, Avice, Tilly |
| Quill's | Marta | Marta | Marta | Marta |
Godwin now bakes from 01:00 and sleeps 09:42 to 15:36. Hale keeps the gate till 20:24 while Ivo eats. Scene 9 moved to Ivo's supper in the
guardhouse at 19:30 (it clashed with scene 10).

**4. `planNav`:** give it to the inspector. Fine by me.

**Found on the way:** after Build 84's plans the cooper's has fewer seats than people and two Byrds sat on one seat (that is your `apart`
failure on `threejs` 2cc9ae6). Now one seat each, the rest stand by the hearth. `threejs` 2cc9ae6 also fails `interact` (the moved bar
hides the witness; fixed in my `test/interact.js`), `npcsep` (passes here), `stairs` (one walk of 1,486: the Hart's cellar stair at half
stick, from (266.2, −399.7, −0.5); geometry, the inspector's; also red here) and the bot's "hatbox in the shut house" (not yet looked at).

## 2026-11-18, the 05:00 inbox and item 5

Decision taken without an answer (easiest to undo): when `World.hartWall` (fork-fin) arrives, my `94e_hartdoor.js` moves nothing and
only keeps the pointers; until then it places the brick itself. Either way the gate step `hartdoor` walks it.

**The "leak" is not a leak.** I counted every geometry made after a warm-up, with where it was made, over ten minutes of the soak's own
play (wander, doors, talk, sword): **0 made**, 0 undisposed, while `renderer.info.memory.geometries` rose 250 to 295. That count rises when
a geometry that already exists is drawn for the first time (a face up close, a nearer level of detail, a lamp at night), and the soak's
random walk reached new places after half time. So: the soak now warms up (every place and door it will use, once) and wanders the places in
turn, and it fails on **geometries made after the warm-up and never disposed** (`geoKept`), reporting the renderer's count beside it. Local
run before this last change: pass, drawn 306 to 363 over 30 minutes; with the new measure: in the commit's GitHub run.

**Steps that could pass on nothing** now fail instead: `interiors` (checked fewer buildings than there are house cells), `owners` (under
40 houses with people), `embers` (under 8 interiors with a fire), `apart` and `people` (under 60 villagers). Others I read and that already
fail on nothing: `cast`, `memory`, `scenes`, `view`, `hartdoor`, `bridge`, `water` (they count what they found and need it).
Not yet read for this: `stairs`, `npcstairs`, `routes`, `parity`, `overlap`, `cells`.

**Ratchets** (`tools/gate_ratchet.json`, `--accept-ratchet`), today's counts: `openings` 57 blocked doorways, `inout` 57 buildings that differ
inside from outside, `geom` stretch 38, open 169, sheets 6 in the generated meshes and, new, the house shells and every kit piece out of
doors (3,137 placed): 692 places with open edges, 878 one-quad parts. `docs/GEOMETRY.md` has the shell section; the worst rows are generated
roofs whose plank undersides are a single 35.8 m2 quad (`gen_roof_3` over x ±7.5, z −22) and generated walls with open tops
(`gen_walls_381` at 11.1, 0.6, −34.3). For the town worker.

**The Hart, pointer side** (your 05:00 note): the compass points at the head of the cellar stair while you are on the common-room floor and
at the brick once you are below; Greta has a new line as a remark ("The cellar? Down the stair by the door, love, behind the rail. Take a
candle, the steps are steep."), text until recorded. Still for the inspector: no light at the stair head or foot; the rail is the only sign.

**Door leaves the player must open:** one, the crypt gate (`pGate`, used once, chapel). Every other hinged leaf is a house door, and those are
portals used with E, not walked through. Nothing else to fix.

**`mine`:** already runs with a fixed seed (`seed=7`) and passed every run I looked at. **`bot-soak`:** see above.

**Your test changes:** fine by me (kitcull's 2-pixel allowance; the witness on an open side). I had made the same witness fix in
`test/interact.js` (a place where she can see, 2 m east was behind the moved bar).

## 2026-11-18, item 1: the door in the Hart that is not there

Commit: the one that carries this entry (message begins "The door in the Hart's cellar exists again"). Gate step `hartdoor` (quick), bug 30 in `docs/BUGS.md`.

**What a player met, step by step** (pictures were taken at each step and looked at; they are in my scratch folder, not the branch):

| Step | What was there | Verdict |
|---|---|---|
| Front door of the Hart, turn right | the cellar stair is right of the door along the front wall, a stairwell with a balustrade; from its head it reads clearly as a stair down to a stone floor | fine |
| Down the stair by the keys | works (the test walks it with W held and steering) | fine |
| The cellar | dark but lit enough to see the east wall | fine |
| **The east wall, where Rowan, Pip, the ledger and the compass send you** | **nothing.** The fresh brick, the smugglers' doorway and the way back up from the tunnel were fixed world positions (z = +4.6) written for an older Hart. The plan engine's cellar runs from z 3.35 to −4.65, so all three stood outside the building, beyond its front wall, in the dark. No prompt anywhere in the cellar. | **the owner's bug** |
| The compass at stage 7, inside the Hart | pointed at the Hart's position in the town, that is, back out of the door | wrong |
| Why no test saw it | the secrets test and the play bot reach a secret by teleporting next to it; the brick's interaction is `thru` (no line of sight), so it was usable from the void | |

**Fixed** (`src/94e_hartdoor.js`, my file): the brick, the doorway and the landing are placed from the Hart's plan on the inside of the
cellar's east wall, on a stretch with nothing in front of it (now world 266.79, −402.93, −0.65, local x 6.8, z 4.0), standing on the
floor (it hung 0.55 m above it). The way back up lands 1.2 m in front of it, facing the room. Inside the Hart at stage 7 the compass points
at the brick. Re-placed whenever the Hart is entered, so a new plan cannot strand it again.

**Prompts now:** not yet told, "Look at the fresh brick" (using it: "Newer brick than the rest. Just a wall, unless you know what is behind
it."); told by Rowan, by the ledger or by overhearing, "Pull at the fresh brick"; opened, "Go down by the smugglers' door".

**Check:** `test/hartdoor.js` (gate step `hartdoor`, quick) starts at the Hart's front door and uses the movement keys: to the stair head,
down the plan's stair, to the brick; checks both prompts, opens it, checks the doorway is drawn, goes through into the tunnel and back up,
and checks the compass. Passes. `secrets`, `story`, `mine`, `interact` and the Hart's cell pass; the bot's `story,secrets` passed three
times out of four. On the first run it reported 2 S2 bugs in `secrets` that did not come back in three more runs; I did not catch which
(the log was overwritten). Flaky: worth a look if it shows on GitHub.

**For the interiors inspector (geometry, not mine):**
- The brick is a 1.9 × 2.0 m plastered panel with brick boxes on it, set on the wall's face (`secProp` in `82c_secrets.js`). Seen across
  the dark cellar it reads as a poster, not as a patch of newer brick in an old wall. It needs to be a real recess in the wall's own mesh
  at local x 6.8, z 3.25 to 4.75 of the Hart's cellar (k −1), and the doorway behind it (`A2.door` in `94d_act2.js`) a real opening.
- The common room's central node on the villagers' graph (local 0, 4; world 260.0, −399.66, −0.65) sits beside the long dining table,
  and its links to the stair and the bar run through the table and its benches (local x 0.55 to 2.95, z 3.5 to 5.5). Villagers walk
  through the furniture; a player walking the same line stops (the walk bot was "lifted" five times here). `planNav` in `72d_plan.js`
  only bends links round stairwells, not furniture. This is likely in every interior.
- The cellar stair has no light at its foot; the cellar's east half is dim from the stair.

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
