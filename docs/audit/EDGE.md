# The town edge and yards against the blueprint

## 2026-11-18: ways in that are not a gate, on the live build (Build 88)

`python3 test/audit/edge_ways.py shots/audit/world_b88.json shots/audit/water_b88.json --shut 66,2.4`: every gate the game lists shut (the
west gate's three posts) and the east bridge's gatehouse shut by hand, water deeper than 0.5 m a barrier, a flat flood from six points outside to
the square. Pictures `edge_b88.jpg` (from above and at eye height). Water depths read in the game with `World.waterAt`.

| Way in | Build 83 | Build 88 | Picture |
|---|---|---|---|
| South-west, round the palisade's end by the lake | Open at (-31 to -40, 74 to 79) | **Still open.** The palisade now turns a corner and runs further south, but it still ends short of the water: the walk goes south outside it along x -48.6 to z 82.6, east along the dry shore (-45 to -30, 82.6) and in at (-29.6, 78.4). 282 m from outside the west gate (the gate itself is about 106 m). At eye height there is also a gap with a shrub where two runs of the palisade meet (`edge_b88.jpg`, bottom right). | sw_above, sw_eye |
| South-east, round the east-bank palisade and over the mill's footbridge | Not found (the east looked closed) | **Open.** The palisade on the river's east bank stops north of the mill; south of it the bank is open meadow down to the lake. The walk comes from the south-east, north along the east bank (62.6, 57.6 to 17.6, all dry) and crosses the river by the mill's footbridge at z 13.4 into the town: no gate on that bridge. 179 m from (110, 60). | se_above, se_eye, se_bridge |
| North, the farm road, the lake front | | Closed on dry land (the north road and the farm need the gates; the lake front is water) | |

Fix: carry the south-west run into the water or end it at a gate; put a gate on the mill footbridge or close the east bank down to the lake.

## Build 83

Measured on `threejs` at Build 83 (the log palisade round the town). Scripts: `test/audit/rules.py` (via `score.mjs`),
`test/audit/edge_shots.js`, `test/audit/water.js`, `test/audit/lawn.js` and `lawn.py`. Pictures: `edge83_sheet.jpg` (the edge from above on
every side, both gates, the yards), `breach_*.jpg`, `lawn_marked.jpg`. Nothing here was seen in motion.

## Verdict

The palisade changes the town more than anything since the audit began. From above it now reads as a walled place with a west gate,
a north gate and a gatehouse at the east bridge; outside it, fields and hedged closes. Dead doors went from 74 to 24, doors facing a
wall from 23 to 1, trees inside from 23 to 35, flower pots from 96 to 50. Three things keep it from passing the blueprint.

## Rule 4.2: the only ways in are the gates (fails, one place)

With the two west gate posts shut, a walker still gets into the square on dry land, by one route:

| Where | How | Picture |
|---|---|---|
| **The south-west end of the palisade, about (-31 to -40, 74 to 79)** | The palisade runs down toward the lake and stops beside a hedge, short of the water. The lakeshore path passes the end. Water depth there: dry (`World.waterAt`). The walk from outside the west gate is 272 m round the end, against 106 m through the gate. | `breach_sw_eye.jpg` (eye height, the end of the palisade, open grass beyond), `breach_sw_above.jpg` |

Checked and not a way in:
- **The east.** The palisade stands on the far (east) bank, so the river and the mill are inside it. The main bridge has a
  gatehouse at its east end (`breach_east_bridge.jpg`). The one walk the flat test found from the farm crosses the river at about
  (57 to 62, -32), where it is 0.45 to 1.2 m deep: that is swimming, not a way in on foot (`breach_ford.jpg`).
- **The north**: the walk from the north road never used the north gate's line; it went round by the east and the river.
- **The lake front** (the wharf, x -5 to 50) is open to the water by design.

Fix: carry the palisade on into the lake for two or three posts, or end it at a gate or a fence across the shore path.

## Rule 4.1: no lawn inside the town (fails)

Inside is taken as west of the river and inside the line the palisade follows (an ellipse fitted to it: `(x/62)^2 + ((z-2)/84)^2 < 1`), not
under water and not under a building or prop. Every 2 m of that open ground was classed by its colour in a picture from straight above
at noon (magenta marks in `lawn_marked.jpg`).

| District | Open ground points | Grass |
|---|---|---|
| Market Place | 605 | 0% |
| Upper Ward | 81 | 0% |
| Westgate | 333 | 1% |
| Riverside | 315 | 21% |
| Chapelgate | 804 | 26% |
| Wharfside | 915 | 28% |
| **All** | **3,053** | **17%, about 2,100 m2** |

Where it is: a band inside the palisade on the north round the chapel and along the whole east side between the houses and the river,
and the south-east of Wharfside. Some of it is honest (a churchyard is grass; a river bank is grass): the blueprint allows grass "in
churchyards, on the green, along the back lanes". But the east band is 15 to 20 m wide and 100 m long with nothing on it: the lawn the
town plan was written to remove. The ellipse is my approximation; ground just inside the palisade where it bulges out is missed, and
ground just outside where it pulls in is counted.

## Rule 4.4: every building on its plot, every plot owned (fails)

| | |
|---|---|
| Buildings with a yard (a `.yard` place people work in) | 24 |
| ... of which belong to a household in `docs/PEOPLE.md` | 19 of 57 enterable buildings |
| ... of which belong to a shell nobody lives in | 5: `in.06`, `in.32`, `in.41`, `in.81`, `in.89` |
| Enterable buildings with no yard | 38 |
| Shells still standing (no door that opens) | 22, plus the two at Highfold |
| ... including **`in.39`, the first house inside the west gate** | the first door a new player tries (`FIRSTTEN.md` item 4) |

Children and residents are booked to work in the five shell yards (Ned in `in.06`'s, Tom in `in.42`'s on Build 81). The yards themselves
(`edge83_sheet.jpg`, yards from above) are real: fenced, with beds, sheds and paths, and they read as somebody's. They are just not
everybody's.

## Rule 4.3: free-standing fences (worse)

Fence and wall runs a walker can step round within their own length plus 3.5 m: 73 (63 on Build 81). The new yard fences account for
the rise. The rule cannot yet tell a gap that is a yard's entrance from a run that encloses nothing, because plots are not data. Until
they are, treat this count as noise.

## What changed on the score (Build 81 to 83)

| Rule | Build 81 | Build 83 |
|---|---|---|
| 1.1 house-shaped buildings | 131 | 81 |
| 2.1 doors that do not open | 74 | 24 |
| 2.2 share of buildings shut | 56% | 30% |
| 2.3 doors facing a wall | 23 | 1 |
| 4.2 gate bypass | 1 | 1 (now only the south-west shore) |
| 4.3 free-standing runs | 63 | 73 |
| 9.1 trees inside | 23 | 35 |
| 9.2 flower pots inside | 96 | 50 |
| 6.5 people who never leave home | 16 | 18 |

Ratchet (Build 83 against the file): four rules are worse than the file, all expected: 1.2 people per building (fewer buildings counted the
other way), 4.3 (new yard fences), 6.5c noon (left failing as you asked), 7.3 containers per person (fewer people, same containers).
Unrecorded lines (8.4) are now in the ratchet at 519.
