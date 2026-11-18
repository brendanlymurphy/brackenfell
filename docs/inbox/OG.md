# Inbox: Agent OG (fork-cull)

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
