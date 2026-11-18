# Inbox: Agent OG (fork-cull)

## 2026-11-18 16:45 UTC: SCOPE CUT AND ONE BUILD A DAY (read this before anything older)

**The owner's decision, 16:45 UTC 18 Nov: cut the scope, one reviewed build a day.** He played Build 89 and found, in two minutes, a stretched spike and a hanging timber at the chapel and a ruler-straight earth patch at the north gate: things every test passed and I passed. Five builds went out today; three needed a second run. That stops.
- **The slice.** Until he says otherwise, only this is worked on: the walk from the west gate along the street to the market square, the square, the alley to Quill's Sundries, the Hart, and up to the chapel; and about sixteen interiors: the Hart, the chapel (with crypt), the Elder's house, Quill's Sundries (store), the smithy, the herbalist, the guardhouse, the mill, the draper, the weaver, the farm, the hunter's, the fisher's, the shut house (in.23), the Bookstall (shop.s1) and the Apothecary (shop.n2), plus any cell a quest stage, secret, note or shop needs (the logic session settles the exact list today). Every other house keeps its people and its lights but its door is locked to the player.
- **One build a day.** Candidates are cut at 12:00 UTC. A build ships only after the walk camera (every 5 m of every lane in the slice, both ways, eye height, day and night) and the room camera (every kept room from each doorway) have run on it and every frame has been looked at by the audit session and by me. Nothing ships from pictures at angles its author chose.
- **Assets, not code, for anything a person recognises** (animals, boats, carts, tools, furniture, plants, food): a kit piece or a model made or fitted in Blender (the owner is setting up a Blender session; `docs/briefs/AGENT_BLENDER.md`), or it is left out. Code builds terrain, walls, roofs and layout.
- **One area each.** Do not touch another session's files; ask in your report.

**Yours:** (1) today: the lock list. Derive from the source every cell that a quest stage, secret, note, board job, trade (a shop that sells) or the main story needs; add the sixteen above; everything else is locked to the player ("Locked", no lockpick, residents come and go as now), in `82f_owners.js`. Tests that enter all cells (`cells`, `interiors`, `inout`, the bot) run on the kept list and assert the others refuse. Write the list to `docs/SLICE.md` with the reason per cell. Hash and run to me; it is tomorrow's build. (2) Voices as planned. (3) Story and people only inside the slice otherwise.

## 2026-11-18 16:15 UTC

Read 4c84d1d's report: all of it is wanted (youth bodies, one at a time through a door, the drowned man's priority, the hearth check, the generator's order). Build 89 is live (main 997710c). Your branch goes into Build 90 as soon as a full run on its head is green: tell me the hash and run. The 529 recordings are only on your branch (main has 254): Build 90 brings them to the owner's ear, so make sure the manifest and the voice checks are in that head.
From the audit's replay on the live build, yours: (1) the boat-house doors say "locked, keys with Wenn" and Wenn has no key: either Wenn gives or sells the key at a point in the story, or the text changes; (2) the "Hidden Yard" is a name with no place: remove the name from every text or tell me where it should be and the town worker builds it; (3) the Hart's cellar corner by the brick is nearly black in daylight: one light of the cellar's should reach the bricked doorway (ask of the interiors session if it is the flame budget: cellars were to be served first). A picture of Tom, Lettice and Davy beside an adult when you can get one (game.shot from 3 m with npcSnapAll at a school hour).

## 2026-11-18 15:45 UTC

Read your report as relayed by the owner. Build 88 is live with everything of yours up to 83e8d54, and `hartdoor` passes: the inspector moved `World.hartWall` to the cellar's -x wall as you described. Decisions and next:
1. **Lettice (14) and Tom (13):** youth bodies at 0.9 scale (`f_maid` for Lettice, `m_youth` for Tom), about 1.5 m. The child bodies are for under 12. Add the bound to `test/cast.js` (13 to 15: a youth body at 0.88 to 0.95).
2. **Voices:** 529 of 774 noted, and thank you for pulling the 36 doubtful takes. Tomorrow's 245: whole-character requests only where the cut can be verified (your new refusal), otherwise one line per request for the characters with the most lines first, the story's speakers before the cast's barks. Put in your report the list of characters who are now complete, so that the owner knows whom to go and listen to.
3. **Two walkers at one door** (Marta and Bridget in the Hart's doorway at closing; I moved Marta's leaving to 21.8 in `77_npc.js`): the nearer goes through, the other waits a step back; then her hour can go back to 22.2.
4. **Greta stands in the fireplace** (the audit's first ten minutes) and **the drowned man has no prompt**: both yours.
5. The town worker added a marked `[fx3]` block in `77_npc.js` joining the new green's bench to the walking graph (note in `docs/FINISH.md`): keep it or do it your way.
6. `mine` and `bot-soak` deterministic, and the people re-homed from removed shells, as before.

## 2026-11-18 11:30 UTC

Build 87 is live (main aeb13ce) with your 83e8d54: the compass true indoors, the brick on the Hart's truly east wall (the inspector moved `World.hartWall`; `hartdoor` passes on the pair), the market cross, the well in turns, the quest marks, Roger's body. In `77_npc.js` I moved Marta's leaving the Hart from 22.2 to 21.8: with Bridget back at the Hart the two met in the doorway at closing (`apart`: 0.36 m for just over a second, both walking to the one portal). The real cure is yours: two walkers bound for the same door should go through one after the other (the nearer goes, the other waits a step back); then put Marta's hour back if you like.
Voices: carry on within the day's hundred; tell me when the manifest has them, and which characters are complete, so that the owner can be told what he can now hear.

## 2026-11-18 09:40 UTC

Read e830f9e's report. The market cross, the well in turns, seeded `wilds`, the talk camera, the pointer texts: all taken for the build after 86.
Build 86's first run failed (a ninth vertex attribute on villagers, the door label test, the Hart's four lost table seats, budget, ratchet); the second run is threejs 284bc3a. In `77e_households.js` I added `c.name = nm` beside the door label and `inn.seat1..3` to the end of HART_SEATS (the refitted Hart has 8 table seats, not 12; the interiors session is asked for the tables back). Merge origin/threejs before your next candidate.

1. **The compass: true directions, indoors as out.** Inside and outside are the same building, so a compass that turns when you walk through a door is a glitch. Indoors the compass (and the map's north) read the building's real bearing. Then the Hart's fresh brick must be on the wall that is truly east, so that Rowan's and Odo's recorded lines stay true: the plan's -x wall of the cellar. The inspector moves `World.hartWall` and the recess (asked today); you move the door, the prompt and `test/hartdoor.js` with it, and the test should assert that the brick's outward normal, turned by the site's bearing, points east within 20 degrees. If the -x wall cannot take it (the stair or the doorway is there), say so and stop: we then keep the brick and rewrite nothing recorded; I decide.
2. **Quest marks inside a building** (POINTERS.md): a mark whose target is inside the building you stand in points at the target, not at the front door; a mark elsewhere points at the door that leads towards it. Stages 8 and 9 pointing 1.1 km at nothing: fix the targets.
3. **Roger Hask stands on a child's body** (Agent Four saw it at the stalls; his row says voice M, age 50). Find why (the stall's lookup, a hash into CAST_BODY, or the scale) and add to `test/cast.js`: nobody over 15 on `m_boy` or `f_child`, nobody under 13 on an adult body.
4. Still yours from before: record the 519 lines within the day's hundred; `mine` and `bot-soak` deterministic; the people re-homed from removed shells.

## 2026-11-18 09:10 UTC

Your branch is in Build 86 (threejs 4bc4a47, in the gate) through the interiors session's integration (it kept both bars and made
`hartdoor` walk through the cellar door). Merge `origin/threejs` before anything else. From Build 85's run: `mine` failed again
("MINE FAIL", second try too) and is yours to make deterministic. The town worker removed more empty shells (in.11, in.18, in.47,
in.48, in.76, in.16, in.86, in.87, in.88): anyone the cast sent to their yards falls back to their other place (Jasper, Tamsin):
re-home them properly. Then item 2 and 3 of the 06:20 entry (pointers, the tour's empty houses) and your open list.

## 2026-11-18 07:10 UTC

Trial merge of all seven branches is on `fork-integ` (7b637a0). It fails `hartdoor` (the interiors session's refitted Hart blocks the
way from the door to the stair head), `npcsep` and `apart` (the three Byrds at `in.02.home`). The plan files now have ONE owner, the
interiors session (Agent Three): do not edit `72e_plans.js`, `72h_trades.js`, `72j_plans2.js`, `72k_houses.js` any more; put what you
need of a plan (a bar that always exists, `castBeds`, seats) as a request in your report and as an invariant in a test. In resolving
conflicts I took Three's side, which dropped your bar retry in `dressInn` and your `castBeds` call in the smithy: Three is told.
One change of mine in your file `77e_households.js` for Build 84: `seat = k < seats.length ? seats[k] : null` (it was modulo: the
Cooper's House has two seats and three Byrds, and two sat in one another at every meal); the one over eats standing at `fire1`.

## 2026-11-18 06:20 UTC

Read your reports: all accepted (day 40 minutes, sword, talk camera, bier, sittings, chapel, sleepers, the Hart door walk). I merge
e553b8f next, as Build 85, after Build 84 (in the gate now) is out.

1. **Two fixes for the Hart door now exist.** The inspector found the same cause and its fix is in Build 84 on threejs: `dressInn`
   publishes `World.hartWall` and `82c_secrets.js` / `94d_act2.js` read it ([fin] lines). Yours is `src/94e_hartdoor.js` with the
   prompts, the compass and `test/hartdoor.js`. Merge `origin/threejs` and make it one mechanism: yours places everything, taking the
   position from `World.hartWall` when it is there; no second patch, doorway or portal. Keep the `hartdoor` gate step. The look of the
   brick, the opening and the rubble is the inspector's (it has it as its first item); the recess in the wall's own mesh is theirs too.
2. From `docs/audit/POINTERS.md` (fork-audit, merging with 85), yours: inside a building every quest mark becomes the front door
   (stage 7 in the Hart, the crypt quest in the chapel): point at the thing; stages 8 and 9 point 1.1 km SSE at nothing; the Hart's back
   door and cellar hatch are drawn and do nothing though two texts point at them (make them work or change the texts: new lines, never
   edit a recorded one); the boat-house doors and Wenn's key; Tobin's crooked stone is 4.5 m east of the plaque, the text says west;
   Wren's frostcap is now outside the palisade; the Hidden Yard is not built.
3. From the inspector's tour (docs/FINISH.md TOUR on threejs): the mill is empty at 12 h and 20 h; the guardhouse empty at 20 h and Ivo
   asleep at noon; Godwin in bed at 20 h; Quill's empty at 20 h; the Hart at noon holds only Greta; the chapel one person.
4. `planNav` (72d_plan.js) bends links round stairwells only: villagers walk through tables and benches in every interior. I am giving
   that to the inspector; tell me in your report if you would rather take it.
5. Then your open list, the leak, the hollow steps.

## 2026-11-18 05:00 UTC

Build 83 is LIVE (main 431f9fb) with your c0481fc. Four things from its gate runs, yours:

- **A leak.** `bot-soak` failed twice: "geo grows over 30 minutes of play: 280 half way, 365 at the end" (S2, use npc:tobin). Something makes
  geometries and never disposes of them: suspects are the hand props put away and taken out (characters session), the window cube map, the
  scenes, the remade cells. Find it by counting `renderer.info.memory.geometries` per subsystem over ten minutes; fix or name the owner.
- **A hollow step.** The inspector reports the gate's `interiors` step ran with 0 buildings (plans not loaded) and passed; with
  `--opt plans=all` it checks 57. Make the step fail when it checks fewer buildings than there are cells, and look for other steps that
  can pass on nothing.
- **The Hart's cellar: cause found** by the inspector (on fork-fin, merging next): the fresh-brick secret and the doorway stood at world
  (266.5,-402.2,4.6), outside the cellar as the plan now builds it, so no patch was drawn and the prompt could never fire. `dressInn` now
  publishes `World.hartWall` and 82c/94d read it. Keep those [fin] reads. Your part of item 1 is what remains on the pointer side:
  the way down is an open stair behind a rail on the north wall of the bar room, dark and unsigned.
- Tests I changed, tell me if you disagree: `kitcull` fails a view only above 2 differing pixels (a lamp halo's single pixel, twice);
  the play bot's theft witness stands on an open side of the player in the same room (the rebuilt Quill's has a shelf where she stood).

## 2026-11-18 04:25 UTC

**Voices approved.** The owner listened to sample.m4a tonight: "all the voices were excellent". All ten new voices are cast as sampled:
start recording the 519 lines now, Market Place households first, batching where the cut is clean (the 100-a-day limit and the model
rule stand). Put the day's count and what is left in each report. This goes ahead of everything in the list below except item 1
(the Hart's cellar), and runs alongside it.

Also from the owner tonight: he plays on a MacBook now, so the phone is the lesser concern. Medium and High are what he sees. Do not
trade anything visible on those tiers for the Low budget; the Low ceiling is relaxed to 230k triangles / 150 draws until a phone is measured.

## 2026-11-18 04:10 UTC

c0481fc is merged into Build 83 (threejs 431f9fb, in the gate). Protocol change: read `docs/inbox/README.md`; reports now go in
`docs/reports/OG.md` on your branch. The owner is asleep; work through this list in order.

Decisions on your questions: Tobin's bed goes in the forge loft (beds may now stand low under a window: merge threejs). Burglar: leave
as it is. Chapel: add story conditions to schedules, six at dawn once the bell rings again. Voices wait for the owner's ear.

1. **The door in the Hart that is not there.** Owner, tonight: "all these things point to a door in the Hart that doesn't even exist,
   like there is no cellar door". Play it by input as a new player who has only the pointers (Pip's list, Rowan's "the east cellar wall,
   newer brick", the ledger, the compass): Hart front door, find the way down, the fresh brick, through to the tunnel. Write down exactly
   where a player loses the thread: no visible way to the cellar, no prompt at the wall, nothing drawn where the bricks come out, a
   marker pointing at a wall. Fix everything on the story and prompt side; every pointer must lead to a thing that can be seen and used.
   What needs geometry (a cellar door or stair that reads as one from the bar room, a doorway in the wall) put in your report with
   positions: the interiors inspector builds it.
2. From `docs/audit/CAST81.md` and `docs/audit/FIRSTTEN.md`: stagger the noon meal (10 outdoors at 12:30, was 18); 16 people never leave
   their building; a sleeper is not talked to in his day voice (Godwin); in.34 and in.15 keep old names; children Ned and Tom work in
   shell-house yards (the town worker is re-doing yards from `docs/YARDS.md`: give them a real place meanwhile).
3. The day is 20 minutes and the clock ran 07:55 to 11:20 in under three minutes of play: lengthen it to 40 minutes (schedules, the
   bell, sleep and the tests that step a day). Say in the report what else assumes 20.
4. The sword is sheathed until drawn (it lies across the screen from the first second). The talk camera puts the speaker's head in the
   upper half of the picture, never under a shelf or behind a trunk, with the subtitle clear of the face (seated and short speakers too).
   People stand by the drowned man's bier (it is alone in an empty circle).
5. Your open list: mine and bot-soak deterministic; geomaudit as a ratchet; wire `test/openings.js` (town worker) and `test/inout.js`
   (interiors session) into `tools/gate.mjs` as ratchets with today's counts; other door leaves the player must open.

The gate now has steps `doors`, `gaps`, `shore`; `test/cells.js` ignores the night bar (a barred door opened to a lockpick by chance and
four cells failed on GitHub); `test/kitcull.mjs` leaves torch flames out. `src/77e_households.js`: a yard that has gone with its house
falls back to the person's other place, and a yard with no one of the table goes to the nearest neighbour. Change them if you have better.
