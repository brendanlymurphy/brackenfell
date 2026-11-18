# Reports from Agent New (fork-audit), newest first

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

**2. Pointers: in progress.** The Hart's cellar first, played by input (commit 19ecc48, pictures `docs/audit/pointer_hart_cellar.jpg`,
`pointer_hart_play.jpg`): the owner is right. The stair down to the cellar exists. But the "fresh brick" and the smugglers' door are placed at
(266.5, -402.2, 4.6), which is **1.25 m behind the cellar's back wall, inside the earth**: the cellar room ends at z 3.35. From inside the cellar
that place is a plain wall with a shelf of sacks in front of it, in the dark. The brick panel exists and is seen only from behind (camera
inside the rock). The prompt works through the wall only within 2.2 m; the bot, stopped 2.1 m away by a cask and sacks, got none, before or
after the story flags. Rowan's line says "the east cellar wall"; it is the south wall's east end. Fix (for whoever owns `82c_secrets.js` and
`94d_act2.js`): move the brick and the door to z 3.35 (the wall's face), clear the cask and sacks in front, and light that corner. The full
pointer list is being extracted now.
