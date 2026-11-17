# Agent Four: people you can look at from one metre

You are one of five Claude Code sessions on Brackenfell. Read `AGENTS.md` first (build, test, rules, where things are). The
coordinator is another session; you reach it only through the owner, who pastes messages both ways. Keep reports short and exact.

## Your job

Bodies, clothes, faces, hands and everything a person holds. The owner's pictures are in `docs/owner/`: `brandt_hammer.png`
("nobody is holding their items right"), `lute_disc.png` ("this speaks for itself"), `piers_no_lines.png`, `leofric_no_lines.png`,
`hale_lines_stacked.png`, `two_people_in_one.png`, `pig_blob.png`. The audit of all 80 villagers at 1 m is
`docs/audit/CHARACTERS.md` with sheets `docs/audit/chars_*.jpg`; its script `test/audit/chars.js` retakes them. Read all of it.

## Branch and files

- Branch `fork-ch1` (it exists on origin with a previous worker's unfinished work; its last commit is marked WIP and was not
  verified in pictures: judge it, keep or redo). Merge `threejs` into it first. Push only to it; the coordinator merges.
- Yours: `src/49_chars.js`, `src/77d_handprops.js`, the character pipeline `tools/humans/` (`garb.py`, `specs.json`, `post.mjs`),
  `tools/chars_lod.mjs`, character skins, new tests under `test/`.
- Not yours: who is where and when, routines, lines, voices, the cast (`docs/PEOPLE.md` is being built into the game by another
  session), `tools/gate_budget.json`, any spoken line. Rooms and furniture belong to others.

## Order of work

1. **C01, clothes break up.** At least five people (`r2_in12`, `r_in20`, `r_in51`, `r_in94`, Marta at work) throw white triangles
   a metre long when they sit or bend; about 30 of 63 residents wear one pale sleeveless over-coat that shows as ragged patches
   and holes (also the "holes" in Leofric's coat and Hale's red tabard). Find the cause in the garment build (weights of the
   over-garment, or a layer whose weights are not taken from the body under it), fix it there, prove it on the five named people in
   sit, bend, sweep and reach. A garment that cannot follow the body leaves the wardrobe.
2. **Held things.** Six exist (two spears, hammer, rod, lute, staff). Each: one true size whatever the pose (the hammer is a peg in
   one picture and an arm-long box in another: the prop takes a bone's or a pose's scale; parent it in the hand bone's space with
   the scale divided out); real form, not a cylinder and a box (a lute is a ribbed pear-shaped bowl 0.32 x 0.48 x 0.15 m with a
   soundboard, rose, strings and a bent-back pegbox, 0.75 m over all, not a disc on a plank); held the way it is held, fingers
   closed round it; passing through no arm or body in any frame of the animation it is used with; put down somewhere real when
   not in use (lute on the back by its strap, spear in the rack, hat on the bench: give the schedule's owner a call to put it down).
   If a thing cannot pass at arm's length the hand stays empty. Hammer and lute first, with pictures front, side and over the
   shoulder at 1 m; then the rest. `test/hold.js` fails on any held thing that intersects the holder's forearm or torso capsules or
   exceeds a true-size table.
3. **Work is mime (C03).** 57 people sweep and 41 work with empty hands. Make a real besom (ash handle 1.4 m, bound birch) held in
   both hands, then one true-size tool per work animation by trade. Another session is cutting how many people sweep.
4. **Faces and hands up close.** Eyebrows and eye lines drawn like ink dashes, teeth as a white bar, the talk gesture that lifts
   both hands over the face, hands and fingers through the table edge when seated, a mug floating by the wrist, skin going
   orange-red under candle light while cloth stays grey, the camera height in talk.
5. **Sameness (C02).** Ten bodies and one cap and coat for 63 people. Do not rebuild the wardrobe until the cast is in the game;
   until then write down what the pipeline can vary (caps, hair, garments, colours, builds, ages) in `docs/WARDROBE.md` so the
   cast table can pick from it. Then: any two people who live or work together differ in hat, hair and one garment.
6. **Animals.** The pig was two pink lumps and has been removed. Rule: no living thing from primitives. Find realistic CC0
   animal models reachable from GitHub or npm (pig, hen, goose, dog, cat, sheep, ox, horse), with licence and source for
   `kits/PROVENANCE.md`; report candidates with pictures before adding any.

## Standards

- Realistic, weathered, Skyrim's Riften: nothing cartoon, nothing flat-coloured at arm's length. Assets CC0 with provenance.
- The phone is the target: mind `tools/gate.mjs --only budget-medium,budget-low` and the triangle count of anything 80 people wear.
- Proof is pictures you have looked at yourself, committed as small JPEGs under `docs/proof/chars/<item>/`, before and after, at
  1 m, from the front, the side and behind. Say what you could not judge (motion, lying poses).
- Gate for your area before a push: `node tools/gate.mjs --only boot,quest,npcsep,people,parity,budget-medium,budget-low,story`;
  then read GitHub's gate on your branch.
- Never edit an existing spoken line. Never `git stash`. Commit after every step. Git identity `Claude <noreply@anthropic.com>`.

## Report format (paste-ready for the owner to forward)

Hash; one line per item with what the cause was; picture paths in the branch; counts from `test/hold.js` and `test/audit/chars.js`
before and after; what you could not check.
