# Agent Three: inside matches outside

You are one of five Claude Code sessions on Brackenfell. Read `AGENTS.md` first (build, test, rules, where things are). The
coordinator is another session; you reach it only through the owner, who pastes messages both ways. Keep reports short and exact.

## Your job

Every enterable building is the same building inside as outside. Today it is not: the owner photographed Quill's Sundries
(`docs/owner/quill_upper_door.png`): a door on the upper storey outside with no door inside, and "buildings only being two stories
and not 3 even when they are three stories on the exterior is hella annoying". He has asked for this three times.

Measured (`docs/audit/INTERIORS.md` I04, `docs/AUDIT.md` Part C rank 8): 57 enterable buildings; every ground floor is over 1.25
times its shell (median 3, worst 6); 1,067 windows inside against 190 on the same shells; 14 shells have a balcony or upper door
and no plan has a door onto one; 20 houses show one storey of wall and hold two floors of rooms; 21 cellars nothing outside shows.

## Branch and files

- Branch `fork-inout`, made from `threejs`. Push only to it. Never push to `threejs` or `main`; the coordinator merges.
- Yours: the interior plans and their builder (`src/72d_plan.js`, `72e_plans.js`, `72h_trades.js`, `72j_plans2.js`, `72k_houses.js`,
  `72f_underworld.js` rooms only), new tests under `test/`, `docs/INOUT.md`.
- Read but do not edit: the shells (`src/71_kithouse.js`, `72c_infill.js`, `73d_infill.js`, `73n_wharfside.js`): another worker is
  changing roofs and house rows there now. When the outside has to change, write the exact change in your report (house id, wall,
  level, what) and the coordinator passes it on.
- Not yours: stair wells and hatches, furniture facing (a worker has them), furnishing (waits for `docs/ROOMS.md`), villagers,
  routines, voices, `tools/gate_budget.json`, any spoken line.

## Order of work

1. **Measure, change nothing.** Write `test/inout.js` (run through `test/shot.mjs --do`, see AGENTS.md). One row per enterable
   building: id, name; storeys the shell shows (eave height, rows of windows, jetties) against levels above ground in the plan;
   footprint outside w x d against plan w x d; upper doors, balconies and galleries outside against doors on that level and wall
   inside; windows per wall and level outside against inside; cellar inside against any sign outside (hatch, grating, steps).
   Commit the table as `docs/INOUT.md` with totals at the top. Report the totals.
2. **Quill's Sundries (`store`) as the worked example.** Rules, in order of preference:
   - The outside is the truth for what the town looks like. Where it shows three storeys the inside gets the third level: a real
     floor reached by a real stair, a room the household would have (chamber, store loft, drying loft). Only where that would be
     absurd does the outside lose the storey (report it).
   - Every upper door outside has a door in the same wall at the same height inside, and the player can walk out of it onto the
     same balcony or gallery. An upper door that cannot be served is reported for removal.
   - Windows: same wall, same level, same place, same count inside as outside. A window seen from the street is one you can stand at.
   - Footprint: the plan fits inside the shell's walls within 15 percent. Rooms get smaller or fewer; a cramped true house beats a
     roomy false one.
   Proof for the coordinator, committed as small JPEGs under `docs/proof/inout/store/`: the front from the street, each level from a
   corner, the view standing at the upper door looking out, before and after. Send the hash and wait for a yes before step 3.
3. **All 57, one district per push**, Market Place first, then the six alley shops (`shop.n2` to `shop.s2`, 3.5 to 6 times their
   shells), then the rest. After each district: `node tools/gate.mjs --only interiors,parity,stairs,npcstairs,people,overlap,cells`
   for the houses you touched (`--cells id,id`), push, read GitHub's gate on your branch, report.
4. Make `test/inout.js` print `inout PASS` or `inout FAIL n` so it can join the gate, with the count as a ratchet.

## Standards

- A storey that exists is finished: floor with thickness, walls, ceiling or roof timbers, a stair with strings and treads, light.
- No two houses get the same added room. What a household has comes from `docs/PEOPLE.md` (who sleeps there, trade, means).
- Villagers already sleep, work and walk in these plans: after any change every bed, seat and spot is still reachable (`people`
  and `npcstairs` steps), and every container and story object is still where the story needs it (`story`, `secrets`, `quest`).
- Look at your own pictures before you report, from where a player stands: from the door, from the stair head, out of the window.
- Never edit an existing spoken line. Never `git stash`. Commit after every step. Git identity `Claude <noreply@anthropic.com>`.

## Report format (paste-ready for the owner to forward)

Hash; what changed in one line per building; the before and after counts from `test/inout.js`; picture paths in the branch; what you
could not check; anything the outside worker must change.
