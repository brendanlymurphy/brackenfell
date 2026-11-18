# Reports from Agent New (fork-audit), newest first

## 2026-11-18 (inbox of 16:45 UTC: the reviewer)

**Then the chapel from below (`docs/review/BUILD_89.md`, last section; `build89_chapel_up.jpg`; commit 0936117).** The owner's hanging timber is the
lean-to on each end of the chapel: two dark posts, a beam and one loose board for a roof over a bench, hung on the wall with nothing to carry or
cover. The stretched spike is very likely one of its posts. It stands in line with the middle of the door, its grain stretched up its whole
height, and it is the post and beam in front of the door in my eye-height frames. Also: the tree west of the chapel draws black leaf flakes
against the sky.

**The slice on live Build 89 by my own camera (done, `docs/review/BUILD_89.md`, picture `docs/review/build89_faults.jpg`).** Started at the
north gate and the chapel, then the west gate road, the alley to Quill's, the Hart's front and a ring round the square. Eye height every 5 m along
the villagers' paths, ahead and behind, at 13:00 and 22:00 (`test/audit/slicewalk.js`, sheets `test/audit/slicesheets.py`). 280 frames, every
one looked at: 199 pass, 73 name a fault, 8 not a player view (my ring crossed the Hart). **By your rule Build 89 would not ship.** Worst first:
a post and a knee-high beam between the path and the chapel door; the earth bank on the chapel way, a wedge with a ruler-straight ridge and a
loose grass sheet (very likely what the owner saw); ivy hanging in the air in the north gate passage; an untextured dark slab 3 m tall beside the
chapel way; one of the villagers' path nodes inside a tree trunk at (8.3, -58.9); the Hart's window-box flowers are pastel cubes, with a fringe of
grey spikes over the window; a faceted grey sack at a market stall; black untextured posts in the street (six frames); a woodpile of white discs;
at night the chapel's windows glow neon green and pink, and the west road's puddles read as white paint. Borderline: a dead-straight dark strip
across the square. Not found at eye height: the owner's hanging timber and stretched spike at the chapel (the roof and tower are never in frame
from the paths: next I look up). Nothing seen in motion.

## 2026-11-18 (inbox of 16:15 UTC)

**Leftover from 06:20, item 4: the quest stages played by following the mark (done, `docs/audit/QUESTWALK.md`, picture `questwalk_b89.jpg`).**
The game has 37 stages, not 38. All 37 were walked in order on the live Build 89, each from where the last one ended. The walker used held keys only: no
teleport, no items or flags given. The walker needed four rounds of fixes first; the first runs' failures were all the bot's. Result: the mark leads to
the place with the right prompt on 21; to an honestly shut door on 5 (the mine without its key; Maren's and Marta's doors barred at night with a
good message); the game's fault on 4; the bot's fault on 6 (stuck behind the Hart's bar with Greta or Brandt in the gap, and after being knocked
out at the outlaws' camp; the links out of both places walk fine by input); 1 not established. Faults, worst first:
1. **"Discovered · undefined"**: Build 89's four new ground places (`orchard.nw`, `orchard.ne`, `green.sw`, `drying.sw`) have no name, and three have
   no centre or radius, so the discovery check (`85_ui.js:203`) never skips them and the banner reads "undefined" (seen at the fire pit).
2. **Marks inside a building point through the floor or ceiling**: crypt 1 and 2 at the gate and reliquary below the nave, not the way down;
   bell 1 at Aldous asleep 3.8 m overhead. The Hart's stair-head mark (stages 7 to 9) is right and shows how.
3. **The bier**: the path graph's only link to it climbs the quay's 1 m wall from the beach. A player cannot climb it, and the mark leads to the
   foot of the wall, 6 m from the body.
4. **Osric stands in the Hart's front door at 22:00**: the prompt there is "Talk Osric", not "Leave".
5. Optional: at night the objective could say the shop or house opens in the morning.
Not checked: fighting, anything behind a lock, whether the conversations advance the stage, anything heard or in motion.

**Leftover from 06:20, item 3: look-alikes (done, `docs/audit/LOOKALIKES.md`, picture `lookalikes_b89.jpg`).** 17 body models for 77 people;
48 pairs on the same body stand within 25 m of each other at some hour; 14 differ in at most one of skin, hair, hat. Miles Ashdown and Peter
Marsh differ only in shade, side by side in the Hart every evening. Clearest in the pictures: Ned Thorne and Tom Arden on the school bench are
the same boy (and Will Marsh beside them is the same body again); Emmet Sele and Odo Hask cross the square in the same pale robe; Amice Ferrin's
clothes break into red shards. The camera missed most people standing behind stalls.

**7. Build 89, the ground rules (done, `docs/audit/GROUND.md`; `docs/SCORE.md` has the Build 89 column).** The rules now use the game's own edge
(`GROUND.edge`) and count yard, green and orchard trees. Lawn inside the edge 7% (two thirds of it the east-bank strip between the river and the
palisade; the rest the green and yard edges). Trees inside 16 to 45, 25 in orchards. Yards people work in: unchanged at 23, 5 of them still of
shells. Fences 72 to 73. Proposed wording for 9.1 (orchard trees count toward the target; a tree with no plot, green, churchyard or street line
counts against): in GROUND.md for you to decide.

**8. The storey mismatches (done, GROUND.md).** Four new, one fixed, net three: Widow Hale's (`in.23`), Ferrin's (`in.75`), Tamsin's (`in.82`) and
the Shepherd's House (`in.93`) were refitted to their shells with a second level inside while the shell is one storey; Bram's House (`in.67`) no
longer differs. The new levels are probably roof lofts; not checked from outside whether the shells show them.

## 2026-11-18 (inbox of 15:45 UTC), working on the live build (Build 88, built from origin/main)

**1. Pointers replayed (done).** `docs/audit/POINTERS.md`, new dated section at the top; pictures `docs/audit/pointer_b88_*.jpg`. The Hart's
cellar works from the front door by held keys only: down the stair, round its foot, "Look at the fresh brick" with only the pointer,
"Pull at the fresh brick" once told, then the smugglers' door into the tunnel. Stage 7, 8 and 9 marks and the crypt marks inside the chapel
are fixed. Tobin's note says east now and the stone works from the wall foot. Wren's frostcap is north-west of the gate. Changed but still
not right: the boat-house doors now answer honestly (locked, keys with Wenn) and Wenn has no key; the "Hidden Yard" is still a name with no
place. The cellar corner is nearly black in daylight.

**2. The first ten minutes on Build 88 (done, `docs/audit/FIRSTTEN10.md`, dated section).** Greta is behind a counter now, not in the
fireplace; the sword is no longer drawn. The drowned man's prompt works from the quay deck but not from Wharf Street, where the walk ends a
metre below the deck. Of the first ten doors from the gate, the stair fills or dominates the first view in 4 (`in.65`, `in.07`, `in.08`,
`in.04`) and edges into 3 more; a resident stands in the doorway in 2 (`in.10`, `in.40`). The Cobbler's House door (`in.44`) cannot be
reached closer than 4.2 m and shows no prompt.

**3. Score of Build 88 (done, `docs/SCORE.md`).** 8 of 34 pass (6 on Build 83). Better: worst interior against its shell 6.0 to 1.5,
window mismatches 57 to 44, hidden cellars 21 to 7, people who never leave home 18 to 7, identical days 4 to 0, people out at noon 10 to 16,
containers per person 13.6 to 3.8, open edges 249 to 169. Worse: trees inside 35 to 16, storey mismatches 21 to 24. The ratchet fails on
trees, storeys, noon (still below Build 76's 18), fences and one more unrecorded line; I did not accept them. `docs/WALK.md` on this build is a
4-minute run, so rule 5.4's zero falls means little.

**4. Rooms (done, `docs/audit/ROOMS_CHECK.md`).** The inspector's sheets are on another machine, so I took its own room camera on Build 88 for
20 "empty" and 20 "room" rows drawn at random (`rooms_check40_b88.jpg`). I agree with 34 of 40: all 20 "empty", 14 of 20 "room". The six I would
call empty from the door: `high.c` hall, `elder` solar, `in.08` solar, `in.111` shop, `in.07` work (the Pottery shows no wheel or pots),
`in.113` work (the boatwright's shows no boat). Ten emptiest houses a player is most likely to enter: Scribe's, Baker's, Fletcher's, the Forge's
back rooms, the Hart upstairs, the Mill, Ferrin's, the Pottery, the Bookstall, the Draper.

**5. The edge on Build 88 (done, `docs/audit/EDGE.md`, dated section; `edge_b88.jpg`).** Two dry ways in that are not gates. The south-west
one is still open: the palisade now turns and runs further south but ends short of the lake, so the shore path at about (-45 to -30, 82.6) goes
round it. New: the south-east. The east-bank palisade stops north of the mill, the bank south of it is open meadow to the lake, and the mill's
footbridge (z 13.4) crosses into town with no gate.

**6. Sound (done, `docs/audit/VOICE_LENGTHS.md`).** The 529 recordings are only on `fork-cull` (main and threejs have 254); measured from
there with ffmpeg. Median 12.6 characters per second of speech. To listen to first: the 20 fastest (Tobin 19.8, Greta 19.4 and 18.9, Alison,
Alaric) and the 20 slowest (mostly two-word barks read with long gaps: Finn's "Shh. Fish." 3.2); 3 clips with more than 0.5 s of silence at an
end (all Godwin: 1.61 s at the end of his greeting, 1.28 s and 1.06 s at the start of two others); 6 lines with a pause over 1.5 s inside
(Aldous 2.68 s in the bell-rope line); 2 clips under 0.6 s (Randal "What then?" 0.56 s, Wren "Hm." 0.47 s). Nobody listened.

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
