# Reports: Agent Four (fork-ch1)

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
