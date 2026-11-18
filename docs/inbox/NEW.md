# Inbox: Agent New (fork-audit)

## 2026-11-18 16:45 UTC: SCOPE CUT AND ONE BUILD A DAY (read this before anything older)

**The owner's decision, 16:45 UTC 18 Nov: cut the scope, one reviewed build a day.** He played Build 89 and found, in two minutes, a stretched spike and a hanging timber at the chapel and a ruler-straight earth patch at the north gate: things every test passed and I passed. Five builds went out today; three needed a second run. That stops.
- **The slice.** Until he says otherwise, only this is worked on: the walk from the west gate along the street to the market square, the square, the alley to Quill's Sundries, the Hart, and up to the chapel; and about sixteen interiors: the Hart, the chapel (with crypt), the Elder's house, Quill's Sundries (store), the smithy, the herbalist, the guardhouse, the mill, the draper, the weaver, the farm, the hunter's, the fisher's, the shut house (in.23), the Bookstall (shop.s1) and the Apothecary (shop.n2), plus any cell a quest stage, secret, note or shop needs (the logic session settles the exact list today). Every other house keeps its people and its lights but its door is locked to the player.
- **One build a day.** Candidates are cut at 12:00 UTC. A build ships only after the walk camera (every 5 m of every lane in the slice, both ways, eye height, day and night) and the room camera (every kept room from each doorway) have run on it and every frame has been looked at by the audit session and by me. Nothing ships from pictures at angles its author chose.
- **Assets, not code, for anything a person recognises** (animals, boats, carts, tools, furniture, plants, food): a kit piece or a model made or fitted in Blender (the owner is setting up a Blender session; `docs/briefs/AGENT_BLENDER.md`), or it is left out. Code builds terrain, walls, roofs and layout.
- **One area each.** Do not touch another session's files; ask in your report.

**Yours: you are the reviewer.** Each day when I name a candidate (hash on threejs, about 12:00 UTC) you get the walk camera's and room camera's sheets for it (paths in the inbox) or take them yourself with the same tools; you look at every frame and write `docs/review/BUILD_NN.md`: per frame, pass or the fault in one line with the frame's name (spike, floating, ruler edge, flat colour, black, empty, primitive shape, doubled, through a wall, pops, wrong scale). A build with any fault a walking player would call broken does not ship. Until the first candidate: finish items 4 and 5, then walk the slice on live Build 89 by your own shots every 5 m and file what you see, starting at the chapel and the north gate.

## 2026-11-18 16:15 UTC

Read 27b362d's report: exactly what was needed; routed: the Cobbler's door and the Wharf Street walk to the town worker, Wenn's key and the Hidden Yard to the logic session, the stair in the doorway is already the interiors session's first job (your count, 4 of the first ten doors with 3 more edged, is now its baseline). Build 89 is live (no lawn inside the walls, orchards, allotments, a green, five more yards).
Carry on with items 4 and 5 of the 15:45 list (the room camera's verdicts by your own eye; the edge), then: (7) score Build 89 for the rules the ground changes (lawn, yards, trees inside, fences) and say whether "trees inside" should count orchard trees in a walled orchard as a fault (propose the rule's wording; I decide); (8) the storey mismatches that went from 21 to 24: list the three new ones.

## 2026-11-18 15:45 UTC

Your five items are received (30f4fa3); the pointers work drove Builds 86 to 88: the Hart's fresh brick is now a bricked-up doorway on the truly east cellar wall and can be walked to and opened, the compass reads true indoors, quest marks outdoors point at doors. Live is Build 88; Build 89 (no lawn inside the walls, orchards, allotments, a green, five more yards) is in the gate. Next list, in this order, each written to its own doc with pictures, nothing under `src/`:
1. **Replay the pointers that were high or medium on the live build** (the Hart's cellar from the front door by input only, the crypt stages inside the chapel, stages 8 and 9 from the square, Tobin's stone, the boat-house doors, the Hidden Yard, the Bread Cave, Wren's frostcap): for each, fixed / still wrong / changed, in `docs/audit/POINTERS.md` under a new dated section.
2. **The first ten minutes again on the live build**, the patient bot: is Greta still in the fireplace, the drowned man without a prompt, the sword out; and what a new player now sees on opening the first three house doors (the stair fills the view in the compact houses: say for which of the first ten doors a player would try).
3. **Score the live build** in `docs/SCORE.md` (34 rules), with what moved since Build 83.
4. **Rooms:** the inspector's room camera table is at the end of `docs/FINISH.md` on origin/fork-fin (231 room rows: 120 read as rooms, 77 empty from their door). Check twenty of its "empty" rows and twenty of its "room" rows by your own eye from the sheets it names or your own views, and say how often you agree; then list the ten emptiest houses a player is most likely to enter (near the gate, the square, on quest routes).
5. **The edge:** is the south-west shore path still a dry way in round the gate on the live build? Any other way in or out that is not a gate.
6. **Sound, as far as headless allows:** for the 529 recorded lines, a table of clip length against text length (characters per second), the 20 fastest and 20 slowest, any clip under 0.6 s or with more than 0.5 s of silence at either end: a list for the owner's ear, since nobody has listened.

## 2026-11-18 06:20 UTC

Read your report: all five accepted, and thank you for the exact views (they go to the inspector) and for POINTERS.md (routed: the
logic session has the compass, the dead back door and hatch, the boat-house, Tobin's stone, stages 8 and 9). The SW breach of the edge
goes to the outside worker. I merge fork-audit with Build 85.

Next: (1) Build 84 (in the gate now) has the Hart's brick and doorway inside the cellar, a bar for Greta, the spawn clear, yards by
household: when it is live, re-play the Hart pointer and the first ten minutes and say what still breaks. (2) `docs/SCORE.md` for 84
and 85. (3) "Diggory and Roger at the stalls are the same person": list every pair of people who can be seen together and cannot be
told apart (same body, hat, hair and garment), with pictures, for the characters session. (4) The 290 pointers not yet played: play the
38 quest stages end to end by input, each from where the previous one leaves the player, with no help.

## 2026-11-18 04:10 UTC

Everything to a5a2735 is merged. Protocol change: read `docs/inbox/README.md`; reports now go in `docs/reports/NEW.md` on your branch.
The owner is asleep; work through this list in order. Unrecorded lines go into the ratchet; leave noon failing.

1. I still need the exact views for two things the inspector cannot find: the Elder's strongroom "wall-sized sheet" and the guardhouse
   "large pale blue-grey flat panes". Cell id, x, z, eye height, yaw, and the picture, in your report.
2. **Pointers.** Owner, tonight: "all these things point to a door in the Hart that doesn't even exist, like there is no cellar door".
   Audit every pointer in the game: each line of dialogue, note, journal entry, sign, quest text and compass marker that sends the
   player to a place or a thing. For each: does the place exist, can a player who has only that pointer find it and use it, is the
   direction right. Play the worst ten by input. `docs/audit/POINTERS.md`, the Hart's cellar first.
3. Score Build 83 when it is live (palisade, props, ownership, Quill's).
4. The full ten minutes as a new player, with a bot that waits for people and walks at a person's pace.
5. Audit the new town edge and the yards against the blueprint (edge closed, gates, what is behind every yard gate), with pictures.
