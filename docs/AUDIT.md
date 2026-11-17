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
| A22 | S2 | **After the ending, Hale and Greta say the same sentence, silently, and their own ending lines may never play.** | after "open it" | `voice.md` | Each person reacts in their own words. | Played by input: both say "There's bread on the Wharf every dawn now. My mother would have cried..." (the same mother), with no recording, before their usual line. Reading the code, the generic row is matched first, so six recorded ending lines look unreachable (not confirmed by play). | Put the personal rows first; give the generic remark only to people without one. Add a bot check. |
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

`docs/audit/voice.md` lists every line shown. First play-through (main story to the "open it" ending, by input): 37 lines shown, 36
distinct; 32 had a recording, 2 were part silent (A22), 2 silent (A23). A longer run (side quests, both orders, death) is being added.
Static check: all 252 planned lines have a file. Shown as speech but in no plan, so never voiced: 7 generic remarks, 7 lines built
at run time (the arrest speech, the theft shout, Marta's shop notice), 17 bystander lines (`story_refs.md` (c)).

## Still to come in this file

Items 2 (barriers, with the fence list), 3 (seeing inside), 6 (access, by district), 11 (cheap graphics, by picture) in full; the
outside-against-inside table for all 57; the per-building "who lives here and how can you tell" list; Part B (research) and Part C
(recommendations, including the delete list). `docs/BLUEPRINT.md` is drafted separately.
