# Village blueprint: the rules any village must pass (draft from the Build 74 audit)

Brackenfell is the first village and failed most of these (`docs/AUDIT.md`). The rules are written so that the next village
cannot fail the same way: each one is a count or a yes/no, and most can be checked by a script before anyone looks at a picture.
`docs/TOWNPLAN.md` stays the authority for how a town is laid out; this file is the acceptance test.

Marks: **[auto]** a script can decide it from the running game (the dump in `test/audit/dump.js` already holds the data);
**[auto+eye]** a script finds candidates, a person confirms from the picture; **[eye]** only a person looking; **[ear]** only the owner listening.
"Brackenfell now" is the Build 74 measurement, so the distance to go is visible.

Measured after each build in `docs/SCORE.md` (`node test/audit/score.mjs`); the rules a script can decide are in `test/audit/rules.py`
(`--ratchet`: exit 1 if a count got worse than `test/audit/ratchet.json`; `--strict`: exit 1 if any rule misses its target).

## 0. Order of work (the rule that prevents the rest)

Nothing is placed before the table exists. In this order, each step signed off before the next:

1. **The cast table**: every person, their household, trade, home, bed, workplace, three relations. [eye]
2. **The building table**: every building, its household or use, its trade, its one unique thing, how you tell from outside. A building without a row is not built. [auto: every building id has a row]
3. **The plan from above**: streets, plots, edge, landmarks, trees. White boxes only. Walk it. [eye]
4. Shells and interiors together, from one list of openings per building.
5. Dressing, from the household's row. Lighting. Then people's routines on the finished places.
6. Lines and voices last, when the people and places they mention exist.

Brackenfell did 4 and 5 first and generated 1 and 2 afterwards. That is the whole audit in one sentence.

## 1. Size

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 1.1 | 20 to 30 buildings, all real. A village is finished small before it is made big. | [auto] count | 132 house-shaped buildings |
| 1.2 | 2.5 to 3 named people per enterable building; 50 to 80 people at most, and no more than can each be given lines (section 6). | [auto] | 80 people / 57 interiors = 1.4, but 63 are mute |
| 1.3 | The budget views stay inside `tools/gate_budget.json`. | [auto] gate | passes |

## 2. Buildings and doors

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 2.1 | **No fake buildings.** Every building with a door drawn on it can be entered, or its door answers with a reason that is true in the world (the person named exists, the event happens). | [auto] every door-shaped piece has an interaction within 1.8 m | 57 open, 74 dead |
| 2.2 | At most 1 building in 5 may be shut, and a shut building still has an owner in the cast table, a light at night and smoke when they are home. | [auto] | 75 of 132 shut, 0 owned |
| 2.3 | Every door has 3 m of clear standing ground in front of it, on a street, lane or yard, reached by a route a person would use (not through another yard, not over a fence). | [auto] flood from the square with body radius 0.3; clear ray in front | 28 shell doors face a wall |
| 2.4 | A building's name names who lives or works there; the person exists. | [auto] name's person in the cast with this home | 19 wrong |
| 2.5 | One of each trade unless the building table says why there are two. | [auto] | 4 trades doubled |
| 2.6 | From outside you can tell what a building is: a sign, the trade's gear in the plot, the form (forge, mill wheel, church). One answer per row of the building table, and it is visible from the street. | [auto+eye] sign or trade prop within the plot; picture of each front | 12 signs in the town |
| 2.7 | No two neighbouring buildings share footprint, storeys, roof and wall treatment. No building is rotated for variety: its angle comes from its street. | [auto] `test/houses_survey.js` | fails on the shells |

## 3. Outside equals inside

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 3.1 | Ground floor inside is 0.8 to 1.25 times the footprint outside. | [auto] | 47 of 57 at 2 times or more; worst 6 times |
| 3.2 | Same number of storeys. A cellar shows outside (hatch, grating, steps). An attic shows as a gable window or dormer. | [auto] | 26 differ; 21 hidden cellars |
| 3.3 | Windows and doors are one list used by both shell and interior: same wall, same position, same count. A balcony or gallery outside has a door inside, and the reverse. | [auto] | 190 windows outside, 1,067 inside |
| 3.4 | Every hearth inside has a chimney outside above it, and every chimney a hearth. Smoke only from a lit hearth. | [auto] | not measured (chimneys are generated pieces; needs a tag) |
| 3.5 | What you see through a window from outside is the room that is there (or a shuttered or curtained window). | [eye] | not checked |

## 4. Ground, edges, barriers

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 4.1 | No lawn inside the town: every square metre is street, yard, garden, churchyard, green with a use, or water. | [auto] ground type under a 2 m lattice inside the edge; [eye] picture from above | Wharfside, Westgate fail |
| 4.2 | If there is a gate there is a wall: from outside, the only ways in are the gates (and the water). If there is no wall there is no gate. | [auto] flood from outside with the gates closed must not reach the square | fails: walk round the west gate in 5 m |
| 4.3 | Every fence or wall encloses something that belongs to someone, and has a gate or a gap where its owner would walk. No free-standing run. | [auto] each barrier run belongs to a closed plot outline with one opening | 135 of 303 runs can be walked round within 25 m (many are honest yard fences; the plot outlines are not in the data yet, so this cannot be decided) |
| 4.4 | Every building stands on its plot; every plot has an owner and holds what that household would own. | [auto] plot table; [eye] | the 72 shells have none |
| 4.5 | The ground has a shape: at least 4 m of fall across the town, streets crowned, plots stepped. | [auto] height range along each street | not measured here |

## 5. Seeing and solidity

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 5.1 | From any place the player can stand or climb to, no view into a shell, under the ground, through a wall or into an open end. | [auto+eye] the walk bot's eye positions, a render with back faces painted red, any red pixel is a finding | `test/audit/backface.js`: 0 views into a shell found; 44 of 242 views show the back of a one-sheet roof or wall |
| 5.2 | Nothing thinner than 3 cm seen edge on; no single quad for a board, a wall or a roof edge. | [auto] kit pieces by bounding box; [eye] | open |
| 5.3 | Nothing floats or sinks: every prop's base is within 3 cm of the surface under it. | [auto] `test/qa` sweep | 452 defects listed in `docs/DEFECTS.md` |
| 5.4 | The walk bot walks every street, lane, interior and stair with 0 falls, 0 "could not be walked", 0 graph lines through walls. | [auto] `test/walkbot.mjs` | 66 falls, 164, 41 |

## 6. People

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 6.1 | **Nobody is mute.** Every named person has at least 3 lines of their own (who I am, what I think of a neighbour, what I think of the current trouble) and a greeting pool by voice type. A person without lines has no name and cannot be addressed. | [auto] plan.json lines per speaker | 63 of 80 mute |
| 6.2 | Every person has a home in the building table and a bed that is theirs; no bed without an owner. | [auto] | Tobin, Aldous without; draper's 2 beds unowned |
| 6.3 | Households are families: 2 to 5 people, shared surname unless the table says why, one child or elder in at least half. No name used twice; no name shared with a story character. | [auto] | 33 households of one; 20 first names repeated |
| 6.4 | Every working-age person has a workplace and is at it in working hours; the workplace has the tools. | [auto] `test/people.js` | 8 trade-named people with no work; 10 houses with no trade |
| 6.5 | A day has at least 5 different blocks in at least 3 different places, one of them shared with other people (well, market, inn, chapel, a neighbour's bench), and one meal at home with the household. No filler action more than once a day. | [auto] | 41 never leave home; everyone sweeps 2 to 5 times |
| 6.6 | No two people have the same day. | [auto] | 14 identical |
| 6.7 | Four activity spots per person present in a public place, so bookings never fail silently; a failed booking is a test failure, not a fallback to sweeping. | [auto] | the well, inn and chapel bookings fail for all 56 |
| 6.8 | Every person has 3 stated relations (kin, work, a liking or a grudge), each said aloud by at least two people. | [auto] relation table against lines | 4 relations in the whole town |
| 6.9 | At least one two-person exchange per 5 people, played by the real people, about a third villager; at least one visible at any hour between 7 and 22 somewhere public. | [auto] | 1, played by props |
| 6.10 | No body or face appears twice in one view. | [auto] body ids of everyone within 40 m | 12 bystanders reuse named bodies |

## 7. Houses are owned

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 7.1 | Each interior has an owner. Shops are open in opening hours; homes greet you by day and challenge you at night; doors are barred at night unless you are a friend. | [auto] enter every cell at 12 and at 2 | no locks, no reaction |
| 7.2 | Sleeping in someone's bed, or taking their things, has a consequence that depends on who they are. | [auto] bot | any of 56 beds; one shared shout |
| 7.3 | Containers: no more than the household would have (a guide: 2 per person plus 2 per trade), contents chosen for the owner. | [auto] | 1,043 for 80 people |
| 7.4 | Each interior answers, in its building-table row, "who lives here and what do they do in the evening", and three objects in it show the answer. | [eye] | not written |

## 8. Story and reaction

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 8.1 | Every person, place and thing named in any text exists, where the text says it is. | [auto] the name list in `docs/audit/story_refs.md`, regenerated | 16 missing, 33 contradicted |
| 8.2 | Every quest step changes one thing you can see and what at least two people say. | [auto] flags read by more than the giver | 27 of 64 change nothing |
| 8.3 | After an ending, routines change (who is where), not only lines. | [auto] schedules differ by ending flag | no schedule ever changes |
| 8.4 | Every line shown as speech has a recording, or is deliberately a subtitle and listed as such. | [auto] `test/audit/voicebot.mjs` | see `docs/audit/voice.md` |
| 8.5 | Voices sound right. | [ear] | the owner's ear only |

## 9. Green

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 9.1 | Trees where a town has them: one at the main gathering place, a yew or two in the churchyard, an orchard of 6 or more behind the richest house, a fruit tree in at least a third of the plots, pollards on the water, a hedge-row tree every 15 m outside. | [auto] count by place | 28 inside the town, none in a plot |
| 9.2 | Kitchen beds in at least half the plots; pots only at doors and sills of people who would keep them (at most 3 per house). | [auto] | 345 pots |
| 9.3 | Outside the edge: garden closes, then fields, then wood, in that order, each with a boundary. | [eye] from above | fields on the east only |

## 10. Layout

| # | Rule | Test | Brackenfell now |
|---|---|---|---|
| 10.1 | One landmark alone on the highest ground, visible from every gate. | [auto] line of sight from each entry | partly (bell tower) |
| 10.2 | Each district has its own gathering node beside a small landmark (well, cross, shrine, slip). | [eye] | Market only |
| 10.3 | A photograph tells you the district: paving, walling and roofing differ by district as TOWNPLAN's table says. | [auto] material counts per district | one roof everywhere |
| 10.4 | Streets end on something; widths by rank (main 6 to 7 m, side 4, lane 2.5, ginnel 1.5). | [auto] widths from the flood map; [eye] | not measured |

## 11. The picture test

For every building: one picture of the front from the street at eye height, one of the interior from the door, side by side
(`docs/audit/pair_*.jpg`). For every district: one picture from straight above and one walk at eye height. A person looks at
every one before the village is called done. Tests passing has repeatedly not meant it looks right.

## Not testable headless

Frame rate on a phone, flicker and z-fighting in motion, anything audible, whether a line reads well, whether a routine looks
natural in motion. Each needs the owner or a device.
