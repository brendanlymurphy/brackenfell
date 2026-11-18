# Reports from Agent New (fork-audit), newest first

## 2026-11-18 (inbox of 15:45 UTC), working on the live build (Build 88, built from origin/main)

**1. Pointers replayed (done).** `docs/audit/POINTERS.md`, new dated section at the top; pictures `docs/audit/pointer_b88_*.jpg`. The Hart's
cellar works from the front door by held keys only: down the stair, round its foot, "Look at the fresh brick" with only the pointer,
"Pull at the fresh brick" once told, then the smugglers' door into the tunnel. Stage 7, 8 and 9 marks and the crypt marks inside the chapel
are fixed. Tobin's note says east now and the stone works from the wall foot. Wren's frostcap is north-west of the gate. Changed but still
not right: the boat-house doors now answer honestly (locked, keys with Wenn) and Wenn has no key; the "Hidden Yard" is still a name with no
place. The cellar corner is nearly black in daylight.

## 2026-11-18 (inbox of 04:10 UTC)

Branch `fork-audit`. No file under `src/` is touched. Headless throughout: nothing heard, nothing seen in motion, no phone.

**1. Exact views (done, commit 5f5ee17).** In `docs/audit/INTERIORS.md`, last section, picture `docs/audit/inspector_views_b83.jpg`.
Look with `game.enter(cell); game.step(4, 1/30); game.shot(x, y, z, yaw, -4, 13)`.
- Elder's strongroom: cell `elder`, x 714.40, y -401.38 (eye 1.55 m above the cellar floor), z 8.85, yaw 45. Still there on Build 83: from
  the middle of the room the view is planks a hand's breadth away, a shelving unit standing in the middle of the floor.
- Guardhouse cells: cell `guardhouse`, x 1007.90, y -398.13, z 5.85, yaw 45. **Not reproduced on Build 83**: the same view shows a post
  and walls, no panes. The Build 77 picture is `docs/audit/backface_rooms.jpg` number 3. Glass nearby is listed in the doc.

**3. Build 83 scored (done, 5f5ee17).** `docs/SCORE.md`: 6 of 34 pass. Dead doors 74 to 24, house-shaped buildings 131 to 81, doors facing a
wall 23 to 1, trees inside 23 to 35, pots 96 to 50. Unrecorded lines in the ratchet at 519 as asked; noon left failing. Ratchet also flags
1.2, 4.3 and 7.3 as worse (fewer buildings, new yard fences, fewer people); I did not accept them.

**5. Edge and yards (done, 5f5ee17).** `docs/audit/EDGE.md`. The palisade's south-west end stops short of the lake: the shore path at about
(-31 to -40, 74 to 79) is a dry way in round the west gate (`breach_sw_eye.jpg`). The east is closed by the palisade on the far bank and the
bridge gatehouse; the only other crossing found is 0.45 to 1.2 m of river. 17% of open ground inside is lawn (Wharfside 28%, Chapelgate 26%,
Riverside 21%; `lawn_marked.jpg`). 19 of 57 enterable buildings have a yard; 5 yards belong to shells nobody lives in; 22 shells remain,
including `in.39`, the first door inside the gate.

**4. Ten minutes, patient bot (done, this commit).** `docs/audit/FIRSTTEN10.md`. Start fixed (no hedge). Still breaking belief: Greta stands
in the fireplace; Diggory and Roger at the stalls are the same person; the drowned man lies alone with no prompt; the sword is out for ten
minutes; the first day lasts ten minutes.

**2. Pointers (done, `docs/audit/POINTERS.md`).** 301 pointers (135 spoken lines, 38 quest stages, 37 signs, 35 compass/map marks, 25
notes, 16 journal entries, 10 rumours, 5 board jobs). 249 point at something that exists; 29 findings cover the rest (4 high, 8 medium, 17 low);
8 are never shown. Ten played by input (pictures `pointer_hart_play.jpg`, `pointer_hart_cellar.jpg`, `pointer_marks.jpg`, `pointer_played.jpg`):
- The Hart's fresh brick and smugglers' door are 1.25 m behind the cellar's back wall, inside the ground: cannot be seen or used. "East" is
  the south wall's east end, and inside the Hart the compass is turned 180 degrees.
- The Hart's back door and cellar hatch are drawn on the north wall and do nothing; two texts point at them.
- Quest marks: inside a building every mark becomes that building's front door. Stage 7 inside the Hart points at the door you came in by;
  the crypt quest and main stage 2 inside the chapel point at the chapel door for every stage. Stages 8 and 9 point 1.1 km SSE at nothing.
- The boat-house doors under the quay are drawn only and Wenn has no key.
- Tobin's crooked stone is 4.5 m east of the plaque, not west. The Hidden Yard is not built. The Bread Cave works but is 24 m from the water.
  Wren's frostcap is due north of the gate and now outside the palisade.
Played with help: for six of the ten, each walk started on the street about 12 m from the target; only the last stretch was by input.
Not checked: whether the other 290 can be followed in play; where "Go up to the Hart's cellar" lands a player.
