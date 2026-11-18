# Reports: Agent Four (fork-ch1)

## 2026-11-18 (items 2 and 3: sleepers, Hale without his helmet)

Commit `4f15974` (merged with threejs). Full gate requested on GitHub for `fork-ch1` at this hash (workflow_dispatch, mode full; run
number not yet listed when this was written: look for the newest `workflow_dispatch` run on `fork-ch1`). Area gate: 8 of 8 pass
(medium square 180/318k, low square 132/194k).

- **Sleepers.** In bed: hat and outer garments (cloak, apron, tabard, straps, belt, pouch) off; a coif or kerchief stays on.
  - Arms lie straight along the body, hands by the hips.
  - A dark wool blanket covers them from the shoulders to past the feet. It is shaped to the body as it lies, at most 0.34 m above
    the bed, and falls over the sides.
  - `test/sleep.js` at 02:30: 75 asleep; 0 dressed, 0 without a blanket, 0 with a hand more than 0.45 m above the body.
  - Pictures: `docs/proof/chars/sleep/after.jpg` (eight sleepers: from above, from the side, and the same side view with the blanket
    hidden). Before: `before_audit.jpg`.
- **How things come off.** No second body: every garment vertex carries a tag (hat, outer garment), and the material skips what is
  off. Indoors at table the hat comes off; in bed, hat and outer garments. `Chars.shed(H, level)` lets a schedule row override it
  (0 nothing off, 1 hat, 2 hat and outer).
- **Hale at table** (item 3): no helmet, and the spear is not drawn (indoors off duty). Picture: `docs/proof/chars/sleep/hat_off_at_table.jpg`.
  Brandt keeps his apron at supper.
- Still visible:
  - Where the sleeping clip draws a knee up (Giles, Lark, Tom), the blanket humps over it.
  - Lark's shirt shows at one fold.
  - The sleeping clip still turns some bodies a little on their side.
- Not checked: the moment of getting into or out of bed (the blanket appears two frames after lying down and goes on getting up);
  motion; a real phone. The audit's L4 (Lark's `inn.bed3` is a table; Hale's bed has no mattress) and L6 (a sleeper answers with the
  day greeting) belong to the furniture and logic sessions.
- `test/hold.js` 0 of 1420, `test/garb.js` 0 of 210 (before the sleeper change; the sleeper change touches neither).
- Next: item 4 (lute strap and slung lute, tankard band).

## 2026-11-18 (item 1, the crouch)

Commit `3f950e9` (merged with threejs at `363a37d`). Reading taken without a decision from you: **the generic work motion is now
`farm-watering` (a standing stance over the task), not `farm-harvest` (the squat)**. Easy to undo: one word in `src/49_chars.js`
(`work:` in both clip tables).

- Cause: the harvest squat folds the body until no shell garment can follow it. Re-weighting the skirt (`tools/humans/reskin.mjs`
  step 3b) fixed sitting (the lap no longer rises to the chest) but the squat stayed a tent with the boots showing, Hale's tabard tore
  open at the back and Brandt's tunic broke up. Every other work clip I tried (watering, chopping, picking up) keeps all three whole.
  Most `work` rows are indoor trades at a bench anyway.
- Also: the lower hem between the shins hangs from both shins (in a stride it tore half a metre wide); bodies under an ankle-length
  skirt lose their legs down to mid-shin (skin showed through the lap when seated).
- `test/garb.js`: 0 of 220 (every body in every hat and piece, six poses). Pictures: `docs/proof/chars/c01/after_work_pose_1.jpg`
  (Marta, Greta), `after_work_pose_2.jpg` (Hale, Brandt): stand, sit, work, sweep, reach, three sides each.
- Still visible: a few small dark specks on Hale's tabard front; Brandt's sleeve edge shows a pale stripe from behind.
- Not checked: motion (the stride of the new work clip is only seen at two moments), a real phone.
- Next: item 2 sleepers (in progress at the next commit: hat and outer garments off in bed and the hat off at table indoors, by one
  per-vertex tag, no second body; a blanket shaped to the sleeper; `test/sleep.js`).
