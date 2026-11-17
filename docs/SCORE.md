# Score: the blueprint's rules, measured

Made by `node test/audit/score.mjs` (do not edit by hand). One row per rule of `docs/BLUEPRINT.md` that a script can measure;
the rules a person must judge are listed at the end. "Build 74" is the audit's measurement, re-made with the same script from the Build 74 dump.
Numbers come from the running game through `test/audit/dump.js` and `test/audit/rules.py`; rules 5.x are read from other tools' last reports
(`docs/GEOMETRY.md`, `docs/WALK.md`, `shots/audit/backface.json`), which may be older than this build.

Passing now: **4 of 34**.

| Rule | What is counted | Target | Build 74 | Build 76 | Build 77 | Against Build 74 | Now |
|---|---|---|---|---|---|---|---|
| 1.1 | house-shaped buildings (enterable + shells + shut) | 20 to 30, all real | 131 | 131 | 131 | same | miss |
| 1.2 | named people per enterable building | 2.5 to 3 (or fewer buildings) | 1.4 | 1.4 | 1.4 | same | pass |
| 2.1 | doors drawn on buildings that cannot be entered | 0 | 74 | 74 | 74 | same | miss |
| 2.2 | share of buildings that are shut (%) | at most 20 | 56 | 56 | 56 | same | miss |
| 2.3 | doors with under half of the 3 m in front of them free to stand on, or not reachable (real doors + shell doors) | 0 | 21 | 23 | 23 | **worse** | miss |
| 2.4 | buildings named for someone who does not live there | 0 | 12 | 12 | 12 | same | miss |
| 2.5 | trades held by two buildings | 0 | 6 | 6 | 6 | same | miss |
| 2.6 | trade buildings with no kit sign or banner at the walls | 0 | 32 | 32 | 32 | same | miss |
| 3.1 | interiors with a ground floor over 1.25 times the footprint | 0 | 57 | 57 | 57 | same | miss |
| 3.1b | worst area ratio inside / outside | at most 1.25 | 6 | 6 | 6 | same | miss |
| 3.2 | kit houses whose storey count differs inside | 0 | 21 | 21 | 21 | same | miss |
| 3.2b | cellars (none shows outside today) | each shown outside | 21 | 21 | 21 | same | pass |
| 3.3 | buildings whose window count differs outside and inside | 0 | 57 | 57 | 57 | same | miss |
| 4.2 | the square can be reached from outside the west gate with the gates shut (1 = yes) | 0 | 1 | 1 | 1 | same | miss |
| 4.3 | free-standing fence and wall runs (stepped round within their own length + 3.5 m) | each belongs to a plot | 55 | 63 | 63 | **worse** | miss |
| 6.1 | named people with no lines | 0 | 63 | 63 | 63 | same | miss |
| 6.2 | people with no bed in their day | 0 | 2 | 2 | 2 | same | miss |
| 6.3 | households of one | under 8 | 33 | 33 | 33 | same | miss |
| 6.3b | first names used more than once | 0 | 20 | 20 | 20 | same | miss |
| 6.5 | people who never leave their own building or plot | under 5 | 40 | 36 | 36 | better | miss |
| 6.5b | people who sweep more than once a day | 0 | 56 | 42 | 42 | better | miss |
| 6.6 | people whose day is the same as someone else's | 0 | 23 | 16 | 16 | better | miss |
| 6.5c | people outdoors at 12:30 | at least 35 |  | 18 | 18 |  | miss |
| 6.5d | fewest people outdoors in any hour from 7 to 21 | at least 5 |  | 1 | 1 |  | miss |
| 7.3 | containers per villager | about 4 | 13 | 13 | 13 | same | miss |
| 9.1 | trees inside the town | about 70 | 28 | 23 | 23 | **worse** | miss |
| 9.2 | flower pots inside the town | under 120 | 322 | 96 | 96 | better | pass |
| 8.4 | planned lines without a recording | 0 | 0 | 0 | 0 | same | pass |
| 5.2 | stretched texture places (geomaudit) | 0 | 38 | 38 | 38 | same | miss |
| 5.2b | open edges (geomaudit) | 0 | 249 | 249 | 249 | same | miss |
| 5.2c | single flat pieces (geomaudit) | 0 | 6 | 6 | 6 | same | miss |
| 5.4 | walk bot: falls / cannot be walked / graph through a wall (as last written to docs/WALK.md) | 0 / 0 / 0 | 66 / 164 / 41 | 66 / 164 / 41 | 66 / 164 / 41 |  | miss |
| 5.1 | views (of 242) where over 2% of the picture is the back of a wall | 0 |  | 44 | 44 |  | miss |
| 5.1b | mean share of the picture that is the back of a wall (%) | 0 |  | 1.412 | 1.412 |  | miss |

## How each number is made

- Reachability is flat: colliders between 0.45 and 1.5 m above the ground, a body 0.3 m in radius, flooded from the square. Stairs and terraces are ignored.
- 2.3: the strip 3 m deep in front of a door (a shell's whole front) must be at least half free.
- 2.4 is a name match (a possessive or a "... House" name against the people who sleep there) and misses names that are wrong in subtler ways.
- 2.6 counts only kit sign and banner pieces; a generated sign is not seen.
- 3.2 uses the kit shell's `up` flag; the hand-designed buildings are not counted.
- 4.2 shuts the gates (a 5 m block at each gate spot) and floods from outside the west gate.
- 4.3 cannot tell an honest yard fence from a loose run until plots are data.
- 5.1 is `test/audit/backface.js`: from places a walker can reach, the back faces of walls and other structure are drawn red and counted.
- 6.x read the schedules as data; nothing is watched in motion.

## Rules no script measures yet

2.7 sameness of neighbours (use `test/houses_survey.js`), 3.4 chimney over hearth (chimneys need a tag), 3.5 what is seen through a window, 4.1 lawn inside the town, 4.4 plots (plots are not data), 4.5 fall of the ground, 6.4 workplaces, 6.7 failed bookings, 6.8 relations, 6.9 exchanges between villagers, 7.1 and 7.2 owned houses (needs the play bot), 7.4, 8.1 to 8.3 (the tables in `docs/audit/story_refs.md` were made by reading), 8.5 and everything audible, 9.3, 10.x layout, 11 the picture test.
