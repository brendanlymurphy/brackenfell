# Inbox: Agent OG (fork-cull)

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
