# Brackenfell audit (branch `fork-audit`, taken at Build 74, commit 81aeabf)

Critic's report. No game code was changed. Everything here is a count from the running game or a picture; where a number comes from
reading code and was not seen in the game, it says so.

How it was made (all re-runnable, scripts in `test/audit/`):

| Evidence | Made by | Holds |
|---|---|---|
| `shots/audit/world.json` (not committed, 2.4 MB) | `node test/audit/run.mjs --opt audit=1 --json shots/audit/world.json test/audit/dump.js` | every building, door, collider, villager, tree and placed kit piece, read from the running game |
| `docs/audit/tables.json`, `docs/audit/map_town.png` | `python3 test/audit/analyse.py` | door reachability, barriers, trees by district, outside against inside, who lives where |
| pictures in `docs/audit/` | `test/audit/walls.js`, `shells.js`, `interiors.js`, `key_shots.js` | four walls of the enterable buildings, the front of every shell, every interior from its door |
| `docs/audit/people.md`, `docs/audit/story_refs.md` | read from `src/`, `tools/voice/plan.json`, `audio/voice/manifest.json` | one row per villager; every name the text mentions; what each quest step changes |
| `docs/audit/voice.md` | `node test/audit/voicebot.mjs --run story` (the play bot, real keys and clicks, with a recorder on `Snd.say`) | every line shown and whether a recording was found for it |

What this cannot tell: anything in motion (flicker, z-fighting), frame rate on a phone, anything audible. Nobody listened to a line.
The reachability map is flat (it ignores stairs and terraces), so it is used only for doors and fences at ground level.

Severity: **S1** breaks belief the first time a player meets it. **S2** seen on any normal walk. **S3** seen if you look.

## The verdict in numbers

| | |
|---|---|
| House-shaped buildings in and around the town | 132 |
| ... that can be entered | 57 (43%) |
| ... that are a solid box with a door drawn on it | 75 (72 town shells, the barn, 2 at Highfold); the 74 houses among them each have a door drawn, none opens (the barn is open-fronted) |
| Shells whose name is anything but "House" | 0 of 72 |
| Villagers | 80 |
| ... who say anything at all when spoken to | 17 |
| ... who answer `...` | **63** |
| ... who never leave their own building or plot | 41 |
| Enterable buildings whose ground floor inside is at least twice the footprint outside | 47 of 57 (35 are three times or more; the worst is six times) |
| Windows drawn outside on the 57 enterable buildings / windows inside the same 57 | 190 / 1,067 |
| Trees inside the built-up town (all districts) | 28, of which 15 on the Chapelgate fringe; 2 in the Market Place |
| Flower pots / wall vines placed in the same area | 345 / 324 |
| Quest and story steps traced / steps after which nothing in the world changes | 64 / 27 |
| Names used in text that refer to nobody or nothing in the game | 16 of 74 |

The owner's phrase was "fake life". The counts say where it comes from: more than half the buildings are props with doors, and
four villagers in five are props with names.

## The 30 worst findings

Pictures are in `docs/audit/`. "Where" is a building id and world x, z (metres; north is -z).

| # | Sev | Finding | Where | Picture | A player expects | What is there | Fix |
|---|---|---|---|---|---|---|---|
| A01 | S1 | **74 doors to nowhere.** | every shell: ids in `docs/audit/sheet_shells_1.jpg`, `_2.jpg`; e.g. `in.117`, `in.119`, `in.06`; Highfold `high.b` (118, 90), `high.barn` (99, 114) | `shell_in.117.jpg`, `shell_in.06.jpg`, `sheet_shells_1.jpg` | A plank door with a ring handle and a lantern beside it opens, or at least answers. | 72 town shells each have a modelled door (`73d_infill.js:286`) and a door lantern; pressing E does nothing, there is no prompt, no "locked". Only the two Highfold doors have a message. 57 doors open; 74 do not. | Decide per shell: make it real (household + interior), or make it honest (a back wall with no door: its door faces a yard the player cannot reach), or delete it. At minimum every remaining door gets a prompt and a reason ("Barred. Smoke from the chimney: someone is in."). Target: 0 doors without a response. |
| A02 | S1 | **63 of 80 villagers have nothing to say.** | everywhere; e.g. Wat Baker in `in.10` | `talk_resident.jpg` | A named person in their own house says something about themselves. | The name, then `...`, then "Farewell." (`85_ui.js:28`). No barks either: barks are per person and only the 17 story people have them. | See Part C. Short version: fewer people, each with 3 to 6 lines, a shared pool of greetings by voice type, and no name plate until they have lines. |
| A03 | S1 | **Inside is far bigger than outside.** | 47 of 57 buildings; worst `shop.n4` (48.5, -5.6): 4 x 4 m outside, 8 x 12 m inside on two floors plus a cellar | `pair_shop.n4.jpg`, `pair_shop.n2.jpg`, `pair_in.12.jpg` | The room behind a door is roughly the size of the house you saw. | Ground floor area inside / outside: median about 3. `in.12` "Hobb's Cottage": 6 x 5 m shell, 8 x 12 m hall-and-chamber with an upper solar. Full table: `tables.json` key `mismatch`. | Fit plans to the shell: a 6 x 5 m cottage is one room and a loft. Where a big interior is wanted, the shell grows (or takes over the shell behind it: see A05). Rule for the blueprint: inside ground area within 1.25 times the outside. |
| A04 | S1 | **Windows do not match.** | all 57; the six alley shops (`shop.n2..s2`) have 0 windows in their own shell and 22 to 24 inside | `pair_shop.n4.jpg` | A window seen inside exists outside on the same wall. | 190 outside, 1,067 inside. No building has the same count. | Generate the interior windows from the shell's openings (or the reverse), one list for both. |
| A05 | S1 | **72 buildings with no one in them and no reason.** | all `in.NN` shells; 20 "fishers" south of z = 70, 11 "cottages", 6 "dyers", 6 "poor", 4 "merchants", 25 with no district | `sheet_shells_1.jpg`, `wharf_lawn_above.jpg` | Each house belongs to somebody and shows it. | Name "House" (72 of 72). No household, no trade, no sign, no smoke with a cause, no light with a cause. They were placed by a scatter that fills blocks (`55b_infill.js:118`: "fill the blocks"). | Delete about half (Part C lists which), and give the rest an owner out of the people who already exist. A fake building is worse than a gap with a garden in it. |
| A06 | S1 | **The town has no edge; the gate blocks nothing.** | west gate (-58, -9); north wall fragment x -22..10 at z -58; nothing on the south, east or north-east | `edge_west_gate.jpg`, `edge_south_above.jpg`, `edge_north_above.jpg` | A palisade and a guarded gate mean you come in through the gate. | Six stakes either side of the gate, then lawn: walk round it in 5 m. Warden Hale guards a gate nobody needs. TOWNPLAN section 2 "An edge" is not built. | Either a continuous bank, ditch and palisade from the river round to the lake with two gates, or no gate at all (a toll bar and a hedge). Not a prop gate. |
| A07 | S1 | **Wharfside is sheds on a lawn.** | z 60..90, x -30..20 | `wharf_lawn_above.jpg`, `shell_in.124.jpg`, `shell_in.110.jpg`, `street_wharf_south.jpg` | The poorest, most crowded quarter: nets, boats, smoke, mud. | About 20 dark plank boxes at random angles with grass between them and one street. TOWNPLAN's own list of what is wrong (items 1 and 3) still describes it exactly. | It is next in TOWNPLAN's order; until then it is the weakest ground in the game. Halve the number of sheds and build plots for the rest. |
| A08 | S2 | **One roof.** | whole town | `top_town.jpg`, `edge_east_above.jpg` | Thatch by the water, stone slate at the chapel, shingle on the river (TOWNPLAN section 3). | From above every roof is the same dark grey. All 57 enterable shells use the shingle roof generator (`kitStyle.shingle` true on 57 of 57) although 50 of their specs say `thatch`. | Roof material by district, as the plan already says. Count per district must match the plan's table. |
| A09 | S2 | **No trees in the town.** | Market Place 2 (the oak and one birch), Riverside 2, Upper Ward 1, Westgate 2, Wharfside 6, Chapelgate 15 (fringe) | `top_town.jpg`, `map_town.png` (green rings) | A churchyard yew, an orchard behind the big house, a tree at the well, pollards along the river, fruit trees in plots. | 28 trees inside, 178 outside within 130 m; and 345 flower pots and 324 wall vines doing the job trees should do. No orchard, no garden trees in any plot. | Part C: about 40 placed trees with reasons (list of places there), and remove two thirds of the pots. |
| A10 | S2 | **Names are generated and collide.** | 56 generated residents | `docs/audit/people.md` (b) | Names you could tell apart, and no stranger sharing the name of a story character. | 41 first names for 80 people; Ivo x5, Wat x4, Aldous x3, Dunstan x2 beside the dead miner Dunstan Pell, whose name the main story turns on. Surname = trade with a capital letter (Wat Baker, Mabel Baker). | A hand-written list. No name shared with a story character. |
| A11 | S2 | **19 buildings are named for someone who does not live there.** | `in.94` "Pell House" (Agnes and Ivo Hollin live there), `in.67` "Bram's House" (Jory Bray), `in.34` "Wren Cottage" (Mabel Gale), `in.60` "Garrick's House" (Garrick is the outlaw chief), `in.12` "Hobb's Cottage" (the Holloways), `high.a` "the Reeve's House" (no Reeve exists), `high.c` "the Shepherd's House" (a woodcutter) | `people.md` (b) | The dead miner's house is the dead miner's house. | The house names and the residents were generated by two lists that never met. "Pell House" is the best unused story hook in the game. | One table: building, household, trade, name. Pell House gets Pell's widow or stands empty with his things in it. |
| A12 | S2 | **Daily life is sweeping.** | all 56 generated residents | `people.md` (b), (d) | People fetch water, go to the Hart, go to chapel, work their trade, visit each other. | All 56 sweep 2 to 5 times a day; 36 never leave the house; 0 ever go to the well, the inn or the chapel (the code comments promise all three; the bookings always fail). 14 shopkeepers have the identical day. 8 people named for a trade have no work at all. Nobody but Aldous is ever in the chapel. | Schedules written from places of work (the plan's "life follows the plan"): well at dawn, work, noon meal at home, Hart or bench in the evening, chapel on one day. Fewer people so each day can be written. |
| A13 | S2 | **Nothing happens when you walk into a house.** | all 56 houses | `people.md` (c) | Knock or be challenged; locked at night; the owner minds you sleeping in his bed. | Doors never lock (`56_cells.js:43`); the word trespass does not occur in `src/`; nobody greets; once Greta gives you a room every one of the 56 beds can be slept in, with the owner in it. The one reaction is "Oi! Put that back! Guards!", identical text for all 80, unvoiced. | Ownership: each cell has an owner; one greeting on entry by day, a challenge at night, doors barred from 22 to 6 unless you are a friend. |
| A14 | S2 | **The one overheard conversation is played by stand-ins.** | behind the chapel, 23:00 | `people.md` (d) (read from code, not seen) | Rowan and Greta meet in secret. | Two cloaked props speak five lines while the real Rowan lies in his bed and the real Greta stands at her bar. It is the only time two villagers exchange words. | Send the two real people. Then add ten more two-line exchanges (Part C). |
| A15 | S2 | **28 shell doors open onto a wall.** | `in.42 .43 .46 .50 .52 .55 .56 .57 .58 .59 .64 .71 .73 .88 .97 .103 .108 .109 .117 .118 .119 .120 .121 .122 .123 .126 .128 .130` | `sheet_shells_1.jpg` (in.108, in.118, in.130) | A front door faces a street or a yard. | No clear place to stand between 4 and 13 m in front of the door: another house is there. The scatter turned the houses, not the streets. | These are the first to delete or to turn into honest back walls. |
| A16 | S2 | **Storeys do not match.** | 20 kit houses built with one storey of wall (`kitStyle.up` 0): `shop.n2 .n3 .n4 .s0 .s1 .s2`, `in.02 .07 .10 .13 .20 .34 .37 .40 .45 .60 .66 .70 .111 .115` | `pair_shop.n2.jpg` | A low house has a loft at most. | Each has a full second floor of rooms inside; 21 of the 57 also have a cellar that nothing outside suggests (no hatch, no grating, no steps down). `in.67` is the reverse: two storeys outside, one inside. | The shell's storey count drives the plan. A cellar shows outside as a hatch or a light well. |
| A17 | S2 | **Interiors come from a small set of plans.** | 57 interiors | `sheet_interiors_1.jpg`, `_2.jpg` | Each house laid out for who lives there. | 12 houses are the same 8 x 12 m plan, 11 the same 10 x 12.5 m, 5 the same 6 x 14 m; 16 are the "shopfront" family. Rooms differ in dressing, not in shape. | Fewer interiors, each fitted to its shell (A03), differing in plan. |
| A18 | S2 | **Trades are doubled and one in six has none.** | bakers `in.10` and `shop.s0`; cutlers `in.37`, `shop.n3`; grocers `in.15`, `shop.n4`; tinkers `in.45`, `shop.s2`; 10 houses with trade "household" | `tables.json` `mismatch`.trade | A village of 80 has one baker, and everyone does something. | Four trades twice; ten houses whose people have no occupation; no trade can be told from outside on any `in.NN` house except by its name plate on entering. | One of each; the trade shows in the plot (TOWNPLAN "every house has a plot"). |
| A19 | S2 | **The Old Mine is in the wrong direction.** | mine door about (-70, -150) | `story_refs.md` (a) | "The door in the south-west cliffs" (Maren, recorded) is south-west. | It is north-north-west of the square. Four texts say south-west, two of them recorded lines. | Recorded lines cannot change, so the world must: move the mine, or add a line that corrects it. |
| A20 | S2 | **The text refers to 16 people and places that do not exist.** | | `story_refs.md` (a) | A name dropped is a name you can find. | Lindqvist (of "Lindqvist's Draper", which has two beds and no resident), the Reeve, Old Wenn, "T." of the love letter, Tobin's mother, "Edda's widow" (Edda is alive), the Highfold wedding nobody attends. 33 more names carry a contradiction. | Each name gets a person, a grave, or is cut from unrecorded text. |
| A21 | S2 | **The world does not react to the story.** | | `story_refs.md` (b) | The dead man is carried off; people talk about it; routines change after the ending. | Of 64 steps, 27 change nothing, 19 change only the quest giver's next line, 6 change another person's lines, 12 change the world. No schedule ever changes. The drowned man lies on the wharf for ever. Nine `hear_*` flags are set and never read. | For each main step: one visible change and two people who mention it. |
| A22 | S2 | **Different people say the same sentence, silently; after the ending their own ending lines may never play.** | after "open it"; after a theft; when carrying gold | `voice.md` | Each person reacts in their own words. | Played by input: Hale and Greta both say "There's bread on the Wharf every dawn now. My mother would have cried..." (the same mother); Rowan and Hale both say "You're jingling, friend. Mind the lanes after dusk."; Marta, whose shop it is, says "I heard about the business with the shop." None has a recording, so each plays as silence before the person's own voiced line. Reading the code, the generic row is matched first, so six recorded ending lines look unreachable (not confirmed by play). | Put the personal rows first; give the generic remark only to people without one. Add a bot check. |
| A23 | S2 | **The Hollow have no voice.** | the Bread Cave | `voice.md` | The climax is spoken. | The two "hollow" texts shown in the play-through have no recording and no voice in the cast. Every one of the 252 planned lines has audio; these are not in the plan. | Cast and plan them, or make them explicitly wordless. |
| A24 | S2 | **Villagers walk through walls and the ground does not hold.** | see `docs/WALK.md` | (its shot calls) | | The walk bot's own report at this build: the villagers' graph passes through a wall in 41 places, 164 stretches cannot be walked, 66 falls of more than 1.6 m, 249 places stuck. Not re-run here. | Already listed; it belongs in the same pass as the re-siting. |
| A25 | S2 | **Shell doors and windows are black rectangles.** | most shells in shade; `in.117`, `in.119`, `in.06` | `shell_in.117.jpg`, `shell_in.119.jpg` | Timber, glass, a glint, a curtain. | Door and panes render near black with no detail; shaded plank walls go to a flat dark brown. This is what "reads as a box" means. | Fewer shells, and the ones kept get the enterable houses' doors and panes. |
| A26 | S3 | **1,043 containers for 80 people.** | all interiors | `world.json` `interact` | A chest holds what its owner would keep. | 937 generic containers and 106 chests: 13 per villager, 18 per building. 68 readable notes, 4 of 20 house documents placed nowhere. Quantity stands in for meaning. | A third as many, each with contents chosen for the household. |
| A27 | S3 | **Households are not families.** | | `people.md` (b) | Children, old parents, apprentices. | 33 households of one, 22 of two, 1 of three. Two children in the whole town (Tobin, Pip), neither with a named parent at home except Pip. 11 of 14 couples do not share a surname. | Fewer, fuller households: 3 to 5 people, one surname, a child or an elder in most. |
| A28 | S3 | **Four important buildings have nobody.** | `draper` (32, -7), `barn` (113, -3), `chapel` (no bed for Aldous), `smithy` (no bed for Tobin) | `people.md` | | The draper's has two beds and no sleeper; Aldous prays or stands 24 hours; Tobin stands at home all night. | A bed and an owner for each, or remove the beds. |
| A29 | S3 | **Named villagers' bodies are reused for strangers.** | passers-by and the wilds | `people.md` (d) (read from code, not seen) | | 12 bystanders are spawned with the body ids of named villagers, so a player can meet a second Marta on the road. | Give bystanders their own bodies or a different tint and hat. |
| A30 | S3 | **The existing defect list is long and open.** | `docs/DEFECTS.md` | | | 51 "breaks play", 184 "ugly", 217 "minor" listed. Not re-verified here; many are in buildings this audit proposes to delete. | Re-run the sweep after the deletions. |

## People (item 8)

Full table, one row for each of the 80 with home, job, lines, voice, routine, relations and who they talk to: `docs/audit/people.md`.
Summary:

| Group | People | Lines each (dialogue + barks) | Voiced | Talk gives |
|---|---|---|---|---|
| Story people: Hale, Greta, Brandt, Tobin, Marta, Aldous, Maren, Osric, Edda, Finn, Lark, Wren, Rowan, Pip, Ivo, Hilda, Bram | 17 | 2 to 34 dialogue, 4 or 5 barks; 168 + 84 = 252 in all | all 252 have audio | their own tree |
| Hart regulars `pat1..7` | 7 | 0 | no | `...` |
| Generated residents `r_*`, `r2_*` | 56 | 0 | no | `...` |

- Homes: 56 of 58 buildings have a resident; 33 are one person. Tobin and Aldous have no bed.
- Relations stated anywhere in text: Pip is Hilda's child; Tobin is Brandt's boy; Bram works for Edda; Lark lodges at the Hart. That is all four.
  No generated resident has any relation to anyone, including the person they share a bed with.
- Who talks to whom without the player: one scene (five lines, played by props). Thirteen people sit in the Hart each evening and nothing is said.
- Walking into a house: nothing (A13).

## Voice (item 9)

`docs/audit/voice.md` lists every line. The play bot played, by real keys and clicks: the main story to an ending, the side quests,
the logic scenario, both orders of the story, and a death. 114 lines of speech were shown, 59 distinct.

| | Distinct lines |
|---|---|
| A recording was found and accepted for playing | 44 |
| Part silent: an unrecorded remark shown in front of a recorded line | 5 |
| Silent | 10 |

| Silent or part silent | Speaker | Cause |
|---|---|---|
| "There's bread on the Wharf every dawn now. My mother would have cried to see it." | Hale, Greta | generic remark from `IX.SAY`, the same words for whoever is asked; not in the voice plan |
| "You're jingling, friend. Mind the lanes after dusk." | Rowan, Hale | same |
| "I heard about the business with the shop. Keep your hands to yourself." | Hale, Marta | same; Marta is the shop |
| "Hold. That's theft, in front of a witness ... The fine is 20 gold ..." | Hale | built at run time (the fine), so never recorded |
| "Twelve stand in a row at the water's edge ..." | `hollow` | not in the plan, no voice in the cast; it is narration shown as speech |
| Six notice-board texts | `board` | narration shown through the dialogue box; nobody is speaking, which is right, but it looks like a silent speaker |

Also, not reached by this play-through but read from the code: 7 lines built at run time and 17 bystander lines are never voiced
(`story_refs.md` (c)). All 252 lines in the plan have a file. Barks: 6 attempted near the player, 5 played; the sixth was Nell Marsh,
one of the 63 who have none. "Started" could not be measured reliably because the bot moves on within a second; nobody listened.

## Item 1. Doors

131 door-shaped things on houses. 57 open on an interior (the walk bot used all 115 door leaves, both ways, without a retry: `docs/WALK.md`).
74 do not (A01). All 57 real doors can be reached on the flat reachability map (`map_town.png`: green dots). Kit door pieces with no
interaction within 1.8 m: 2 (a second door, `Wall_Plaster_Door_Flat` with its frame, on the guardhouse front at about (-35, -7), 1.8 m from the real one: the magenta square on the map).

| District | Real doors | Dead doors | Dead doors facing a wall |
|---|---|---|---|
| Market Place | 9 | 6 | 0 |
| Chapelgate | 12 | 19 | 4 |
| Riverside | 9 | 4 | 3 |
| Westgate | 8 | 11 | 4 |
| Wharfside | 12 | 32 | 17 |
| Upper Ward | 2 | 0 | 0 |
| Outside | 5 | 2 (Highfold) | 0 |

Per building: `docs/audit/buildings.md` section B.

## Item 2. Barriers

- **The town edge** does not exist as a barrier (A06, `edge_west_gate.jpg`, `edge_south_above.jpg`, `edge_east_above.jpg`). The north wall is a 32 m fragment with a wall walk; both ends are open.
- 303 fence and wall runs stand in the mapped area. For 135 the far side is a walk of 25 m or less. Most of those are yard fences with a
  proper way in, which is right. 56 are **free-standing fragments**: under 2.2 m high and passable by stepping round the end
  (detour no longer than the run plus 3.5 m): Chapelgate 13, Market Place 9, Riverside 7, Wharfside 5, Westgate 5, outside 17. List with
  coordinates: `tables.json` key `walkround`; drawn orange on `map_town.png`. Example: `bar_chapel_east.jpg`, a rail fence that stops in the open with the yard behind it open to the lawn.
- The plots built in Build 73 (Chapelgate, Market Place north) are the one place fences enclose something: `bar_westgate.jpg` shows beds, a fence and a gate that read as somebody's.
- The churchyard wall (`bar_churchyard.jpg`) encloses the graves on three sides; the fourth is open grass.
- Not measurable yet: whether each fence belongs to a plot. Plots are not data in the game; the blueprint asks for a plot table.

## Item 3. Seeing inside (done on Build 76)

Test: `test/audit/backface.js`. From 121 places a walker can reach (a 9 m lattice over the town, flooded from the square, at eye
height), two views each, every wall, roof and other piece of structure is drawn black from its front and red from its back. Red
in the picture is the inside of something seen from outside it. 242 views.

| | |
|---|---|
| Views with any red over 0.3% of the picture | 180 of 242 |
| Views with red over 2% | 44 |
| Mean red per view | 1.4% |
| Views into the hollow of a building shell | **0 found** in the 16 worst, compared by eye with the normal picture (`backface_pairs.jpg`) |

What the red is, from the 16 worst (`backface_worst.jpg`, `backface_pairs.jpg`):

| Kind | Example | Is it a fault |
|---|---|---|
| The underside of a roof or canopy that is one sheet: the lych gate, the well roof, every market stall, eaves | views 2, 7, 11, 17 | yes, cheap: no rafters, no thickness; seen every time a player looks up |
| A wall that is one sheet seen from behind: the cream gable over the inn passage | view 5; `geo_sheet_passage.jpg` | yes |
| A blank pale slab standing by the bell tower at about (19, 15) | view 6 | yes: an untextured panel |
| Door and window reveals, door leaves, stair treads and paving whose faces are wound the wrong way | views 1, 8, 13, 16 | no visible fault: every kit material is drawn two-sided, so they render; it is why the count is high |
| Open things: the boat, the cart | views 3, 8 | no |

So: no place was found where a walker sees into a shell or under the ground. Not covered: the galleries, wall walks and roofs a
player can climb to (the lattice is at ground level), interiors, and anything closer than the 9 m spacing. Every kit wall is drawn
two-sided, so a shell's inside is always there to be seen; the only thing preventing it is the collider. As a gate rule the red
count is noisy (reversed faces); it is in `rules.py` as 5.1 for the ratchet, with the mean at 1.4%.

## Item 4. Outside against inside

All 57: `docs/audit/buildings.md` section A (footprint, inside size, area ratio, storeys, cellar, windows, balcony).

| Mismatch | Buildings |
|---|---|
| Ground floor inside at least 2 times the footprint | 47 of 57 |
| ... at least 3 times | 35 |
| Windows: same count outside and inside | 0 of 57 (190 against 1,067) |
| One storey of wall outside, a full upper floor inside | 20 kit houses (A16), plus `inn`, `smithy`, `farm`, `fisher`, `high.c` by the data, to be checked by eye |
| Cellar inside, no sign of one outside | 21 |
| Balcony or gallery outside | 14; none of the plans has a door onto one |
| Doors: one outside, one inside | 55; two plans (`inn`, `chapel`) have a second outside door inside that has no twin outside |
| Chimney against hearth | not measured: every plan has 1 or 2 hearths (chapel 0); chimneys are generated geometry with no name to count. Needs a tag. |

## Item 5. Filler

`docs/audit/buildings.md`. The question "who lives there, what do they do, how can you tell from outside" has:

- no answer at all for the 72 shells and the two Highfold props (A05);
- no resident for `draper`, and Tobin and Aldous have no bed in theirs (A28);
- no trade for 10 enterable houses ("household");
- no outward sign for about 45 of the 57: 12 sign or banner pieces exist in the whole town, 6 of them on the seven oldest buildings.
- Sameness: 72 shells in 28 roof pitches but two materials (dark plank, grey rubble), one door, one window; the commonest size (4.4 m wide) is used 25 times.

## Item 6. Access

- 28 dead doors face a wall (A15), 17 of them in Wharfside.
- Every real door is reachable. Their approach is not always a street: the flat map cannot tell a lane from a lawn, and in Wharfside
  and Westgate it is lawn (`wharf_lawn_above.jpg`, `west_lawn_above.jpg`).
- `docs/WALK.md`: 164 stretches of the villagers' own routes cannot be walked by the player; 41 pass through a wall; 3 join two levels with no way between.
- Streets by hour: at most 30 of the 80 villagers are outdoors (15:00), 16 of them in the square. From 19:00 to 06:00 there are 1 or 2
  people outdoors in the whole town; 13 to 15 sit in the Hart, in silence; everyone else is at home.

## Item 7. Trees and green

| District | Trees | Flower pots | Wall vines | A real town would have |
|---|---|---|---|---|
| Market Place | 2 | 30 | 29 | the oak (there), a lime by the well, a pear against the inn's yard wall |
| Chapelgate | 15 (mostly the northern fringe) | 88 | 78 | two yews in the churchyard, an ash at the lych gate, apple trees in the long plots |
| Riverside | 2 | 40 | 20 | pollard willows and alders along the bank every 8 to 10 m, a walnut at the mill |
| Westgate | 2 | 53 | 57 | an orchard close, hedgerow elms, a tree in every farm yard |
| Wharfside | 6 | 99 | 116 | very few: an elder at a privy, willows at the slip; more nets than leaves |
| Upper Ward | 1 | 12 | 3 | the manor garden: a walled orchard of 8 to 12, a mulberry, a clipped yew at the gate |
| Outside, within 130 m | 178 | 23 | 21 | hedged closes, then fields, then wood |

Wharfside, the poorest quarter, has the most flower pots (99) and vines (116). Pots and vines were used as a fill brush.

## Item 10. Story and quests

`docs/audit/story_refs.md`. 74 names checked: 25 clean, 33 contradicted, 16 not in the game. 64 steps: 27 change nothing (A19 to A21).
The strongest single contradiction: the mine's direction (A19). The best unused material: Pell House, Widow Hale's house and her
son Corwin's letters, which are already written and point at the main story, while the houses themselves hold strangers.

## Item 11. Cheap graphics and bugs

By picture and by the geometry audit that is now on threejs (`tools/geomaudit.mjs`, `docs/GEOMETRY.md`; it reads the 66 static
meshes out of doors, not the kit pieces or the generated shells). No claim about motion.

| Count (`docs/GEOMETRY.md`, as last written) | |
|---|---|
| Places with a stretched texture | 38 (the barn's timber at 3.2 times the usual scale; a bell-tower roof face with one texel smeared over 11 to 14 m2; four stall canopies at 3 times) |
| Open edges: the end or top of a surface with no thickness, 0.8 m or longer, at a height a person sees | 249 |
| Single flat pieces over 2 m2 | 6 (two 16 m2 plaster gables over the inn passage, two on the terrace, two at the watchtower) |
| Views where a one-sheet roof or wall is seen from behind (item 3) | 44 of 242 over 2% of the picture |

| # | What | Where | Picture |
|---|---|---|---|
| G1 | Shell doors and window panes are flat near-black rectangles in shade | most shells | `shell_in.117.jpg`, `shell_in.119.jpg` |
| G2 | Stall canopies are one flat colour, stretched 3 times, and one sheet thick | the square, four stalls | `geo_stretch_awning.jpg`, `backface_worst.jpg` 7, 17 |
| G3 | The gables over the inn passage are single 16 m2 sheets of blank plaster | (11.4, -17.3) and (11.4, -22.4), 4 to 8 m up | `geo_sheet_passage.jpg` |
| G4 | A bell-tower roof face is one colour: a single texel over the whole face | about (8 to 11, 17 to 21), 14.5 m up | `geo_stretch_shingle.jpg` |
| G5 | Roof and canopy undersides have no structure: the lych gate, the well, eaves | town-wide | `backface_pairs.jpg` 2, 11 |
| G6 | A flat pale striped panel on a shell front; a lean-to roof plane down to the ground | (-5, 85); (14, 74) | `close_shell_door.jpg`, `close_wharf_house.jpg` |
| G7 | Shaded timber walls go to one flat dark brown; the box shows | all districts | `sheet_shells_1.jpg` |
| G8 | Roofs: one colour and material from above | all | `top_town.jpg` |
| G9 | 452 listed defects (floating, sunk, overlapping), not re-verified | | `docs/DEFECTS.md` |

The geometry audit does not yet read the generated shells or the kit pieces, which is where most of what a player sees is;
its counts are a floor. I looked at 8 of its worst entries: 5 are as it says, 1 put the camera inside thatch, and the churchyard
wall it lists first for open edges looks solid from where a player stands.

# Part B. How Skyrim, The Witcher 3 and Kingdom Come make a place believable

**Status of the sources.** The session's network policy refused every page fetch (UESP, the Creation Kit wiki, Joel Burgess's blog,
GDC Vault). Only web search worked. So each fact below is marked **[search]** (the text came back in a search result for that
address; the page itself was not opened and the wording should be checked before it is quoted on), **[inference]** or **[memory]**
(not verified at all). Nothing below is page-verified. The full notes with all addresses are in `docs/audit/research.md`.

## Numbers

| | Skyrim: Riverwood | Brackenfell now |
|---|---|---|
| Named residents | 14 permanent, 16 with Hadvar and Ralof, a dog [search: en.uesp.net/wiki/Skyrim:Riverwood, Skyrim:Riverwood_People; counted from the list] | 80 |
| Enterable interiors | 6: four houses, the trader, the inn; plus an open sawmill and forge [inference from that list] | 57 |
| People per interior | 2.7 | 1.4 |
| Buildings that cannot be entered | 0 [memory] | 75 |
| People with no lines | 0 [inference: every listed resident has a page with quoted dialogue] | 63 |

- Skyrim as a whole: about 1,100 characters, "more than 70" actors, "more than 60,000 lines" [search: nbcnews.com, pcgamer.com; en.wikipedia.org/wiki/Skywind]. About 16 characters per voice [inference].
- Kingdom Come: 550 persistent characters in the first game; "nearly 2400" in the second, about half in Kuttenberg; only about 70 can be drawn at once, so the team measured how many are visible from each spot in a white-box city before building it [search: gamesradar.com; schedule.gdconf.com session 915120; daily.dev summary of the Kuttenberg talk].
- Witcher 3, Novigrad harbour: "For the 50 sailors ... we made 200 possible spots" [search: gamesradar.com]. Four places to be for each person.
- Whiterun and Riften totals, and per-village counts for Rattay, Sasau, Skalitz and Uzhitz: not found.

## Methods

1. **Ownership.** A Skyrim interior has one owner, a person or a faction; anyone else is trespassing unless the cell is marked public; in a public cell the things are still owned, so a shop is free to enter and theft to take from [search: ck.uesp.net/wiki/Interior_Cells]. Alvor's house is locked; inside after midnight "you are not welcome and may be told to leave"; the family carry the keys [search: en.uesp.net/wiki/Skyrim:Alvor_and_Sigrid's_House]. Beds are owned one by one [search: forum sources]. Kingdom Come marks areas private, shops private at night [search: player reports].
2. **Schedules.** Alvor "works his forge every day between 8am and 8pm then spends an hour dining with Dorthe and Sigrid inside the house"; his daughter comes to the forge at 4pm to learn [search: en.uesp.net/wiki/Skyrim:Alvor]. Gerdur wakes at 7, works the mill, eats at home at noon [search: Skyrim:Gerdur]. Packages are hour blocks; default sleep starts between 19:00 and 01:00 and lasts 6 to 10 hours [search: ck.uesp.net/wiki/Sandbox_(Procedure)]. Kingdom Come puts the behaviour in the object: a bench teaches sitting, a hearth cooking [search: Warhorse forum repost]. The Witcher 3 gives no personal day: people rotate between activities at action points, and there are never more people than points [search: gamesradar.com; CDPR REDkit wiki].
3. **Conversations between villagers.** Riverwood's scenes are about another villager, not about the player: Hilde and Sven on the dragon, Hilde and Sigrid on the daughter, the forge lesson; the love triangle is told by both suitors and the innkeeper ("We've got something of a love triangle here in Riverwood") [search: en.uesp.net/wiki/Skyrim:Sven, Skyrim:Hilde]. Four found; more exist [memory].
4. **Dialogue per person.** Generic lines are recorded once per voice type; a named villager adds a few of their own that name a relation or a grievance, and sometimes one small favour [search: en.uesp.net/wiki/Skyrim:Generic_Dialogue; inference from the Riverwood pages].
5. **Kits.** Skyrim: "2 Kit Artists, 8 Level Designers, 7 Kits, 400+ Unique Cells, 30 Months" [search: slides of Burgess and Purkeypile, GDC 2013]. The warning in the same talk: if "things are always at 90 degree angles, the player will sense the system and art fatigue can set in"; "Repeated detail elements bother players. Repeated architecture is more forgivable" [search: transcript and secondary notes]. Remedy: combine pieces across kits, and change detail before structure.
6. **Inside against outside.** Skyrim's interiors are separate cells and are known to be larger than their shells; no developer statement of a rule was found. The Witcher 3 has no load at doors and not every building opens [search: gamespot.com, pcgamesn.com]. [inference] With separate interiors scale can be cheated a little; what a player checks is doors, windows, storeys and roof.
7. **Clutter.** Smith and Worch, GDC 2010: staging the space so it "can be interpreted as a meaningful whole"; "It has to be possible to miss some things to make finding them meaningful" [search: gdcvault.com/play/1012647; niemanstoryboard.org]. Bethesda's set dressers decide first who lives in a place, then furnish for their habits [search: news.xbox.com, Starfield clutter article].
8. **Layout.** Whiterun: three tiers by height and class, one landmark alone on top [search: en.uesp.net/wiki/Skyrim:Whiterun]. Riften: a canal splits it and a lower water level holds the poor [search: en.uesp.net/wiki/Lore:Riften]. Novigrad: "none of the houses have been placed procedurally" [search: wccftech.com interview]. Kingdom Come started from real maps and then pulled settlements closer [search: pcgamesn.com].
9. **Vegetation.** Witcher 3: foliage placed by hand, only a base grass layer generated; large trees hand-edited as landmarks [search: dualshockers.com; store.speedtree.com]. Kingdom Come's garden plots and orchards round each village: [memory], no source found.
10. **Passes.** Bethesda: a one-page pitch with "one unique thing" per place, then layout and gameplay, then lighting, clutter, effects and sound, then polish [search: Burgess, GDC 2014 slides].

## What it means for Brackenfell [inference]

Riverwood convinces with 6 interiors and 16 people because every one of the 16 has a house, a bed, a job, a relation and something
to say about a neighbour, and there is no seventh house. Brackenfell has nine times the interiors, five times the people, twelve times
the buildings, and a quarter of the people a player can talk to. The lesson is subtraction.

# Part C. Recommendations, ranked by effect on the owner's complaints against effort

Effort: S = days for one worker, M = a week, L = several weeks. Each has a number to hit.

| Rank | Do | Hits | Effort | Measure |
|---|---|---|---|---|
| 1 | **Delete the 28 shells whose doors face a wall** (list in A15), and with them 17 of Wharfside's 32. Put a yard, a garden, a drying ground or nothing where they stood. | fake buildings, copy paste, blocky | S | dead doors 74 to 46; draw calls go down |
| 2 | **Make every remaining dead door answer or go.** For each of the 46: remove the door (it becomes the back or side of a neighbour's outbuilding: byre, store, workshop, with a barn door or none), or give it a prompt with a true reason and an owner from the cast. | fake life | S | 0 doors without a response |
| 3 | **Give the 63 mute people lines.** Four each: who I am and what I do; a neighbour by name; the trouble (the bell, the dead man); a goodnight. 252 lines is about three days of the 100-a-day voice quota. Eight shared voices by age and sex for greetings; the cast file needs those eight. Until a person has lines, hide the name and the talk prompt. | fake life, bland | M (writing) | mute people 63 to 0 |
| 4 | **One table for buildings and households** (the blueprint's step 1 and 2), written by hand: 57 buildings, their people, surname, trade, relations, the house's name. Fix the 19 wrong house names from it. Pell House to the Pells; Widow Hale's to Hale's mother; one baker. Cut the cast to what the table can hold: about 60, in households of 2 to 4. | not thought through, bland | S to write, M to apply | 0 name clashes; 0 buildings named for a non-resident; households of one from 33 to under 8 |
| 5 | **Real days.** Replace the generated schedules with ones written from the table: well, work, noon meal at home, market, Hart or bench, chapel on a set day. Fix the three public bookings that always fail. | fake life | M | people who never leave home 41 to under 5; sweeps per person at most 1; outdoors at noon at least 35; nobody shares a day |
| 6 | **Ten exchanges between villagers** about a third villager, played by the real people at set hours in the square, the Hart and the well (about 40 lines). Send the real Rowan and Greta to the night meeting. | fake life | M | exchanges 1 to 11 |
| 7 | **Houses are owned.** Owner per cell; a greeting by day; barred 22 to 6; a challenge if inside at night; no sleeping in an owned bed. | fake life, not believable | M | the bot enters every house at 12:00 and 02:00 and gets a reaction in each |
| 8 | **Fit interiors to shells** for the worst 20 (area ratio 4 or more: the six alley shops first): one list of openings for shell and plan; the plan's ground floor within 1.25 of the footprint; storeys equal. Where a large interior matters (inn, store), enlarge the shell over a deleted neighbour. | not believable | L | ratio at most 1.25 on all 57; windows equal on all 57 |
| 9 | **An edge or no gate.** A bank, ditch and palisade from the river round to the lake with the west and north gates, houses backing onto it (TOWNPLAN already says so). | not believable, blocked off | M | flood from outside with gates shut does not reach the square |
| 10 | **Roofs by district** as TOWNPLAN's table: thatch in Westgate and Wharfside, stone slate at the chapel, shingle on the river. | all the same | S | from above, 4 roof materials, each over 15% |
| 11 | **About 40 trees with reasons** (the list in item 7), and remove two thirds of the 345 pots and half the 324 vines, most of all in Wharfside. | bland, filler | S | trees inside 28 to about 70; pots under 120 |
| 12 | **The story lands.** Move or correct the mine's direction; the dead man is carried to the chapel after Maren reads the token and a grave appears; each main step gets one visible change and two people who mention it; cut or people the 16 empty names; put the personal ending lines before the generic ones. | storylines coherent | M | steps with no reaction 27 to under 5; names without a referent 0 |
| 13 | **Signs and trade gear** on every shop and workshop, from the building table. | tells no story | S | every trade building identifiable in its front picture |
| 14 | **Cut containers to a third**, contents per household; place the 4 unplaced documents. | filler | S | containers 1,043 to about 350 |
| 15 | **Plots for every kept building** (TOWNPLAN order: Wharfside next). | lawn, copy paste | L | no grass touching a wall inside the edge |
| 16 | Tests for all of the above in the gate, from `test/audit/` (the dump already holds the data). | so it stays fixed | S | blueprint rules marked [auto] run in `--full` |

## What to delete

- **Now:** the 28 wall-facing shells (A15). They cannot be seen from a street as fronts; they are mass that makes the town feel blocked.
- **Wharfside:** of 32 shells keep at most 10, as net stores, smokehouse, boat shed and two real cottages, on plots.
- **Chapelgate, Westgate:** of 30 shells keep those that close a street front (about half) and turn them into outbuildings of the enterable house beside them.
- **Highfold:** the bolted house with its wedding that does not exist. Either people it or take the message off the door.
- **People:** the 7 Hart regulars as separate strangers: fold them into households (two already sleep in others' houses). Bystanders that reuse named bodies.
- **Lines:** the three generic remarks that different people speak in the same words.
- **Things:** two thirds of the flower pots, half the vines, two thirds of the containers.
- **Not to delete:** the 57 interiors. They are the best work in the game (`sheet_interiors_1.jpg`); they need shells that fit them and people who own them.

## Could not be verified headless

Frame rate, flicker and z-fighting in motion, anything audible, whether lines read well, whether routines look natural. Part B
is from search results only. Item 3 covers ground level only.
