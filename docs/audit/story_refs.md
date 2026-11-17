# Story references audit

Sources: every string in `src/*.js` shown to the player (dialogue nodes, notices, reading text, quest text, item text), `tools/voice/plan.json`, `tools/voice/lines.json`, `audio/voice/manifest.json`, `shots/audit/world.json` (80 villagers, 58 buildings, 98 places, 68 readable things), `docs/STORY.md`. Coordinates are world x,z; in every text and on the watchman's compass (`73i_walls.js:164`) the lake (z +90) is south, so -z is north.

## Headline

- 74 names checked. **16** point at a person, place or event that does not exist; 33 more exist in some form but carry a note (a contradiction, a second name, or a claim nothing backs); 25 are clean.
- The largest: the Old Mine is called "south-west" in 4 texts and stands north-north-west; "Edda's widow"; a wedding at Highfold with no guests; Widow Hale's "shut" house has a lodger scheduled into its bed; Corwin has five incompatible histories and no body; the twelve do not add up.
- 64 quest and story steps traced. **27** change nothing at all and **19** change only the quest-giver's own next line: 46 of 64 leave the rest of the village exactly as it was. 6 make some other person say something new; 12 change something you can see or hear.
- Voice: 252 of 252 planned lines have audio (0 missing). But 7 generic remarks, 7 run-time lines, the theft shout and 17 lines of 12 unnamed bystanders are shown as speech and are not in the plan; and **6 recorded lines can never be heard** because of the order of a table.

## (a) Names against the world

| name | where mentioned | exists? | note |
|---|---|---|---|
| Warden Hale / Hale / the Warden | 80_game.js:74-78 (own lines); Greta :82; Tobin :103; ledger 82_story.js:97; roster 82b_interact.js:54; Pip's list :63; journal 94_mine.js:382; meeting 82c_secrets.js:110; quest text | yes: NPC `hale` | ok |
| Greta / Greta Barleybrook / G. | Hale 80_game.js:74; Rowan :131; inn note 71b_storeys.js:202; recipe 82b_interact.js:49; IOU :64; Hart's ledger 82c_secrets.js:37; Rowan 94d_act2.js:38; gallery door 73h_routes.js:91 | yes: NPC `greta` | ok |
| Barleybrooks (three generations), "my gran" | Greta 80_game.js:88 | no | offstage family; harmless |
| Osric / Osric Dunn | Greta 80_game.js:82,90; mill tally 82b_interact.js:47; quest text :31 | yes: NPC `osric`, `mill` "Dunn's Mill" | the tally is titled "A miller's tally" and speaks of Osric in the third person: the miller writing about himself |
| Brandt | Greta 80_game.js:85; Tobin :103; gossip 82b_interact.js:51; order book :53; item texts | yes: NPC `brandt` | ok |
| Tobin | Brandt 80_game.js:95-98; rumour 94b_economy.js:80; "Tobin's box" 82c_secrets.js:34 | yes: NPC `tobin` | ok |
| Old Maren / Maren | Greta 80_game.js:85; Finn :134; Hilda :139; beekeeper 79b_life.js:8; quest text | yes: NPC `maren` | ok |
| Brother Aldous | Greta 80_game.js:85; quest text :34 | yes: NPC `aldous` | ok |
| Marta / Quill's Sundries | Aldous 80_game.js:116,118; gossip 82b_interact.js:51; rumour 94b_economy.js:85; slab 94d_act2.js:112 | yes: NPC `marta`, building `store` | ok |
| Elder Rowan / the Elder / R. | Greta 80_game.js:85; mill tally, warn note, invoice, will (82b_interact.js:47,50,56,59); ledger 82_story.js:97; body's note :77; Hale :109; rumours | yes: NPC `rowan` | ok |
| Edda | Marta 80_game.js:121 ("Edda's trees"); Bram :140 | yes: NPC `edda` | ok |
| "Edda's widow" | Maren 81_wilds_story.js:50 (recorded line) | NO | Edda is alive, a woman, and is the farmer. No widow of anyone called Edda exists. Reads as a slip for another name |
| Bram | Edda 80_game.js:133; recipe 82b_interact.js:49 | yes: NPC `bram` | Edda: "if you see Bram dawdling at the market": the market stall is his scheduled post 07:30-18:00 (77_npc.js:37) |
| Finn | body text 82_story.js:77; Hale :104-105; rumour 94b_economy.js:85; "Finn's log" 82b_interact.js:61 | yes: NPC `finn` | "Finn's log" lies in the farm and in Highfold's Shepherd's House, never in the Fisher's Hut |
| Lark | draper's ledger 72_buildings.js:242 | yes: NPC `lark` | ok |
| Wren | Rowan 80_game.js:148 ("it is not Wren's"); love letter 82b_interact.js:48; watch log 73i_walls.js:165 | yes: NPC `wren` | watch log says the night watch was "RELIEVED AT DAWN BY WREN, WHO SNORES": Wren is a hunter who never leaves her cabin plot; the roster (82b:54) lists Hale and Ivo only |
| Pip | Hilda 80_game.js:139; rumour 94b_economy.js:88; "Pip's list" | yes: NPC `pip` | ok |
| Ivo | roster 82b_interact.js:54 | yes: NPC `ivo` | ok. 4 other villagers are also called Ivo |
| Hilda | gossip 82b_interact.js:51 | yes: NPC `hilda` | ok |
| Lindqvist | building name "Lindqvist's Draper" (55_layout / world.json `draper`) | NO | nobody of that name; Hilda Weaver keeps the counter; nobody sleeps there |
| Corwin / C. | Rowan 81_wilds_story.js:57,59; mine board 79_wilds.js:310; shrine sign :166; hermit's note :339; Maren 82_story.js:110; Hale :109; journal 94_mine.js:382; hatbox 82c_secrets.js:83; meeting :110; quests `brother`, `main` | NO body, no NPC | Five accounts that do not agree. (1) Rowan (recorded): "went down the old mine after silver, a good while back". (2) Journal: "Third week of the dry", i.e. this month. (3) Maren (recorded): Pell "dug under Corwin, a good while back", which makes Corwin a man of the old shift, 50 years ago. (4) Hatbox: Corwin is Widow Hale's son and was told by the Warden to say nothing. (5) Mine board: he is Hob's brother. docs/STORY.md says he is alive and hands the player a lamp or a key; in the game he is never met and the side quest ends with his cap as "the end of a long hope" while the main story's journal has him walking off to join the Foreman |
| Hob (Corwin's brother) | mine board 79_wilds.js:310; Rowan 81_wilds_story.js:57,59; place "Hob's Lumber Camp" | NO NPC of that role | the man at the lumber camp is "a woodcutter" with Bram's body (79b_life.js:6). Two unrelated villagers are called Hob (Hob the Carter, Hob Cutler). Rowan: "his brother Hob was the last to see him": cannot be asked |
| Widow Hale | building `in.23`; hatbox 82c_secrets.js:83 | house yes, person NO | Greta: "Nobody's lived there in years" (82c:136); the door is locked (82c:82); yet Nell Marsh (`pat6`) is scheduled to sleep in `in.23.bed` every night (77c_patrons.js:11). Relation to Warden Hale never stated |
| Dunstan Pell / D. Pell | Maren 82_story.js:110; burial register 82b_interact.js:55; IOU :64; Rowan 94d_act2.js:38 | corpse prop only (82_story.js:77) | body text: "a man of fifty"; Rowan: sealed below fifty years ago. IOU to Greta "will pay when the silver's in" makes him her contemporary debtor. Tally is "OM 14" in a story of twelve. "Pell House" (`in.94`) houses the Hollins. Two living villagers are also called Dunstan |
| The Sexton | Maren 82_story.js:112; ledger :97; burial register 82b_interact.js:55; rumour 94b_economy.js:86; item texts | dead, by design | reliquary holds "the Sexton" per ledger; ok |
| The Foreman | journal 94_mine.js:382; count 94d_act2.js:107; rumour 94b_economy.js:87 | yes: boss enemy (92_foes.js:122) | ok |
| The Hollow / the Quiet / "the twelve" | ledger 82_story.js:97; count 94d_act2.js:107; Rowan :38; strongbox note 82c_secrets.js:39; Silverthread text | 12 cloak props + 10 enemies + Foreman | numbers do not close: twelve sealed (Rowan); Pell, one of them, is dead on the wharf; the journal counts "eleven. I make it twelve" plus the Foreman in front; the cave still shows twelve; the player kills up to 10 more on the way |
| Rowan's father / "the old Elder" / "the Elder's father" | Rowan 94d_act2.js:38, 80_game.js:150; order book 82b_interact.js:53; strongbox 82c_secrets.js:39; rumour 94b_economy.js:83; count 94d_act2.js:107 | dead, by design | docs/STORY.md says young Rowan, the Sexton and the first Warden sealed the mine; the game says Rowan's father did, alone, for money |
| The Magpie / M. | WANTED notice 82b_interact.js:66; notes 82c_secrets.js:35,36,41; rumours 94b_economy.js:81,82,84 | a cloak prop that walks at dusk (82c:75) | "Five gold from the Warden": there is no way to report her and Hale has no line. "Last seen on the weavers' lane": no such place |
| Garrick One-Ear | Brandt 80_game.js:153 ("One ear, red beard"); quest `tools`; item "Garrick's blade"; notice "Garrick's camp is silent" | yes: enemy chief (92_foes.js:8) | a town house is called "Garrick's House" (`in.60`) |
| Outlaws | Rowan 80_game.js:148; Hale :159; board jobs | yes: 2 camps of 3 + leader | Rowan after the quest: "the children can pick berries at the wood's edge again"; the three ordinary outlaws and the Brute return after 3 days (92_foes.js:111,332) |
| Old Wenn | boatwright's board 73g_wharf.js:59 | NO | "the keys are with Old Wenn": nobody; no boatwright either |
| Adda the Rushworker, her brother | burnt-cottage board 79_wilds.js:280 | NO | her key opens the strongbox at the hermit's (`hermit.box`, 79_wilds.js:338): so the hermit is her brother, which no text says |
| The hermit / E. | note 79_wilds.js:339; place "The Hermit's Pool" | a figure "the hermit" with Rowan's body (79b_life.js:10) | note says "gone to gather bogbean, back by dusk" while the figure stands there all day. The note: "the silver is not in the mine. It never was"; the journal, Rowan and Brandt all say the silver is in the mine |
| T. (Wren's correspondent) | love letter 82b_interact.js:48 | NO | nobody identifiable; copies lie in the bookseller's and the Tailor's House, not at Wren's |
| The Reeve | market cross 73k_square.js:57; shepherd 79b_life.js:11; building "Highfold: the Reeve's House" | NO | the Reeve's House is occupied by Agnes Shepherd alone |
| "The wedding at Highfold" | toll notice 79_wilds.js:456; shut door :483; shepherd 79b_life.js:11 | NO event | "Everyone is at the Reeve's": the Reeve's House is enterable and holds one resident who sweeps; the other Highfold house holds two; no gathering, bride, groom or guest exists. The wedding never ends |
| The toll guard | toll notice 79_wilds.js:456 | NO | "away at the wedding", permanently |
| The Landlord | passage note 73h_routes.js:118; boarded door :133 | NO | the Hart's keeper is Greta; "the landlord's hand" belongs to nobody |
| "The boy" who forgets the lantern | 73h_routes.js:118 | unclear | Tobin is the smith's boy; no inn boy exists |
| The Wardens of Brackenfell (plural), "the first Warden" | plaque 73f_levels.js:174 | historical | ok |
| The watch / the Watch / "the Warden's men" | watch log 73i_walls.js:165; Magpie's card 82c_secrets.js:41; rumour 94b_economy.js:80; meeting 82c:110 ("before the watch comes round") | 2 men (Hale, Ivo) | nobody is ever posted on the Watch Bell; Ivo is at the gate all night, so no watch "comes round" behind the chapel |
| Greta's buyer / the merchant / the Crown assayer | merchant's letter 82b_interact.js:60; Rowan 94d_act2.js:38; ending text :118 | offstage | the merchant's letter (`assay`) is one of 4 written documents that are placed in no building |
| "Wage-paid men asking at the Hart" | rest ending 94d_act2.js:119 | NO | nobody is added to the inn |
| Tobin's mum | note 82b_interact.js:57 | NO | Tobin lives at the forge; no parent exists |
| Pip's father | - | NO | Hilda and Pip are the only family of two generations in the game |
| Finn's father; Brandt's grandfather; Hale's grandfather; "my grandmother" (Greta's rumour); "my mother" (generic remark) | 82c_secrets.js:136; 82b_interact.js:267; 80_game.js:76; 94b_economy.js:87; 94d_act2.js:76 | offstage | the generic remark "My mother would have cried to see it" is said by all of the 16 it can reach, including Pip (whose mother is alive) and Tobin |
| "J + M" | hoist loft 73h_routes.js:177 | flavour | - |
| A grey tom cat; a goose ("a boy chasing a goose", "dragging a goose by the neck of a sack") | 73h_routes.js:176; 73f_levels.js:208; 73h_routes.js:95 | text only | world.json has 8 chickens and no other animal in town |
| "Sixty souls" | Hale 80_game.js:78 (recorded) | 80 villagers + 6 passers-by | count is off by a third |
| Brackenfell | everywhere | yes | ok |
| The Honeyed Hart / the Hart | many | yes: `inn` | "back door, by the bar" (82c_secrets.js:36) and "Out by the north door" (:37): world.json gives the inn one door |
| Chapel of the Dawn / the Dawn | Aldous; prayer card; Book of the Dawn | yes: `chapel` | ok |
| The Old Watchtower / the beacon / the crag | Hale 80_game.js:76; Brandt :98; Tobin :103; quest text | yes: place `tower` (26,-124) | ok: north of town as said |
| The Watch Bell | rumour 94b_economy.js:80 | yes: place `belltower` | two different towers are called "watch"; ok |
| The Old Mine, "in the south-west cliffs" | quest stage 82_story.js:15; Maren :112 (recorded); quest `brother` 81_wilds_story.js:17; Rowan :59 (recorded) | yes: `wild.mine` at (-70,-150) | **wrong direction.** The lake and wharf are at z +80..+90 and are "south" in every text; the mine is at z -150, i.e. north-north-west of the square, beside the watchtower road (sign: "Mine road, west" from the tower). Four texts, two of them recorded, say south-west |
| The Bread Cave, "north shore, past the reeds" | cave map 82b_interact.js:65; Finn's log :61 ("off the north shore") | yes: cleft at (-48,122), portal `door.cave.in` | the town sits on the north shore (wharf z 80); the cleft is 55 m west and 32 m south of the lake's centre (7,90): the code comment itself calls it "the west shore" (94d_act2.js:53) |
| Mirrormere | Finn 80_game.js:134; watchman's mark 73i_walls.js:164 | yes: place `lake` | ok |
| Stonewater / Stonewater Bridge | Hale, Osric, Brandt, Ivo | yes: place `bridge` | ok |
| Greyspine (passes, Road, Levy, Field) | Hale 80_game.js:78; Brandt :100; toll notice; standard 79_wilds.js:383; signpost :493 | region; no place entry | signpost says "Greyspine Field"; the map place is "The Old Battlefield" |
| Shrine of the Turn | signpost 79_wilds.js:491 | place is named "Wayside Shrine" | two names for one place |
| Hermit's Fall | signposts 79_wilds.js:492 | place is named "The Hermit's Pool" | two names for one place |
| "Fishing hamlet", "the south shore and the boats" | signposts 79_wilds.js:494 | place is named "The Far Shore" | two or three names for one place |
| Watch Road, Mine road, "the old mill road" | signposts 79_wilds.js:493,492,166 | no | road names used once each |
| Highfold | toll notice; signposts; shepherd | yes: `wild.hamlet`, houses `high.a`, `high.c` | "Highfold has four doors": 2 enterable houses, 1 bolted house, 1 chained barn = four, ok |
| Hob's Lumber Camp, the Hunter's Blind, the Burnt Cottage, the Standing Stones, the Bee Meadow, the Toll Ford | signposts; Maren 81_wilds_story.js:50 | yes | Maren says "the old stones on the eastern hill": the stones are at (112,-118), north-east; acceptable |
| Washing Lane; the Hidden Yard; the terrace / Elder's plaque; the Wharf; Market Square; market cross | rumours; notes | yes | ok |
| "The weavers' lane"; "west of the weavers" | WANTED notice 82b_interact.js:66; rumour 94b_economy.js:84 | NO | no lane or quarter of weavers. Districts are Merchants' Row, the Net Lofts, the Thatches, the Warren, the Dyers' Bank. The one weaver's house (`weaver`, Riverside Cottage) is at x +39; the Hidden Yard the rumour leads to is at x -24 |
| "The house on the south lane" | Greta, Marta, Finn, Aldous 82c_secrets.js:136; rumour; Magpie's list | the house yes (`in.23`, z +41); no place called the south lane | findable only by trying doors south of the square |
| "The stile" | love letter 82b_interact.js:48 | NO | - |
| Fairweather Farm / Fields | Edda; board | yes | ok |
| "The baker's awning"; the Baker's Rack | spyglass 73f_levels.js:208; place `bakerrack` | yes: place; shop.s0 baker | the baker cannot be spoken to and sells nothing |
| The Crown; lowland caravans; the passes | Marta; letters | offstage | ok |
| The Long Frost; Candlemas; "the year of the second frost" | plaque, chronicle, boards | dates | Rowan's chronicle (72_buildings.js:159): "We kept the Dawn bell ringing through every winter but this one" stays after the bell is mended |

### Contradictions, listed plainly

1. **The mine is not south-west.** `wild.mine` is at (-70,-150); the square is (0,-2), the lake (7,90). Said "south-west" in the main quest stage (`82_story.js:15`), Maren's recorded line (`82_story.js:112`), the `brother` quest stage (`81_wilds_story.js:17`) and Rowan's recorded line (`81_wilds_story.js:59`). The compass mark is right; the words send the player the wrong way.
2. **"Edda's widow"** (`81_wilds_story.js:50`, recorded). Edda is alive.
3. **The wedding.** Three texts (`79_wilds.js:456`, `:483`, `79b_life.js:11`) say all Highfold is at a wedding at the Reeve's. The Reeve's House holds one sweeping resident. It is a permanent excuse for a bolted door and an absent toll guard.
4. **Widow Hale's house** is locked, "nobody's lived there in years" (`82c_secrets.js:82, 136`), and is the scheduled bed of Nell Marsh (`77c_patrons.js:11`), who walks home to it at 23:30 through the locked door.
5. **Corwin** (see table): a good while back / this month / fifty years ago; Widow Hale's son / Hob's brother; dead (cap, "end of a long hope") / gone to the Foreman / alive (STORY.md).
6. **Dunstan Pell**: "a man of fifty" (`82_story.js:77`) sealed below "fifty years back" (`94d_act2.js:38`); owes Greta money "when the silver's in" (`82b_interact.js:64`); buried in an empty grave (`:55`, a document that is placed nowhere).
7. **The count.** Twelve sealed. One (Pell) is dead in the open. Journal: eleven counted, "I make it twelve", plus the Foreman (`94_mine.js:382`). Cave: twelve standing (`94d_act2.js:63`). Enemies of the same kind killed on the way: 7 in the mine, 3 in the tunnel. Tally number: 14.
8. **Who sealed the mine.** STORY.md: Rowan as a young man, with the Sexton and the first Warden, 51 winters ago. Game: Rowan's father, alone, 50 years ago, for the sale price (`94d_act2.js:38`). Rowan "carried it thirty years"; Hale says "fifty years of bread" (`82_story.js:109`).
9. **Why the bread stopped.** STORY.md: Rowan's hips gave out. Game: he stopped on purpose three weeks ago because Greta found a buyer (`94d_act2.js:38`). The hermit's note says the silver "is not in the mine. It never was" (`79_wilds.js:339`); everything else says it is.
10. **The night meeting** has Greta behind the chapel from 23:00 (`82c_secrets.js:107`) while her schedule keeps her at the bar until 23:30 (`77_npc.js:7`), and Rowan there while he lies in bed from 21:30 (`:28`). They say "before the watch comes round": no watch walks; Ivo holds the gate all night.
11. **The bell.** Fixed by the player; Hale's "a chapel bell that no longer rings" (`80_game.js:78`) and Rowan's chronicle (`72_buildings.js:159`) never change.
12. **The Magpie** is wanted for 5 gold "from the Warden" (`82b_interact.js:66`); there is no way to claim it and the place named, "the weavers' lane", does not exist.
13. **The hatbox letter "addressed to Hale"** (`82c_secrets.js:83`): cannot be delivered.
14. **The ale.** Greta "can't brew on promises" but sells honeyed ale from the first conversation (`80_game.js:88, 90`).
15. **The hammer.** Lost for three days; Brandt hammers at the anvil from 06:30 daily (`77_npc.js:9`).
16. **Bram** is scolded for being at the market (`80_game.js:133`); the market stall is his schedule.
17. **Watch log** has Wren on night watch (`73i_walls.js:165`); she is a hunter who never leaves her plot.
18. **Three places have two names**: Wayside Shrine / Shrine of the Turn; Hermit's Pool / Hermit's Fall; Far Shore / Fishing hamlet / south shore; plus Old Battlefield / Greyspine Field.
19. **The Hart's doors**: "back door, by the bar", "the north door" (`82c_secrets.js:36-37`); the building has one door.
20. **"Sixty souls"** (`80_game.js:78`): 80.
21. **After either ending the drowned man is still on his bier** with his candle (`82_story.js:41-77`; nothing hides the mesh or the prompt).

### Documents and where they lie

`IX.BOOKS` holds 20 documents (`82b_interact.js:46-67`); 27 copies are placed (world.json `interact`, kind `read`, ids `book.*`).

| finding | detail |
|---|---|
| 4 documents are placed nowhere | "The smith's order book" (`pickheads`), "The gate roster" (`roster`), "The burial register" (`burial`), "A merchant's letter" (`assay`). The burial register is the only text that says Pell's grave is empty; the merchant's letter is the only proof of Greta's silver trade |
| the same private paper in several houses | miller's tally x4 (mill, Tanner's, Chandler's, Woodcutter's); Tobin's note to Brandt x3 (smithy, Shepherd's House, Pell House); Pip's list x2 (inn, Brewer's); the Bread Cave map x2 (Riverside Cottage, the Reeve's House at Highfold); Finn's log x2 (the farm, Highfold); the child's drawing x2; the love letter to Wren x2 (bookseller, Tailor's); Pell's IOU to Greta x2 (Cooper's, Dyer's) |
| a paper in the wrong house | "Greta's ale" recipe is in Wren's Cabin; Finn's log is never in Finn's hut; the letter to Wren is never at Wren's; the IOU addressed to Greta is never at the Hart |
| Tobin's note answers the hammer quest | it lies on a table in Brandt's own forge and says where the hammer is ("B., it is by the fire ring at the tower") |
| the village notice text is unreachable | `73_village.js:88` (hammer lost, bell rope wanted, frostcaps, farm hands) is replaced by the job board (`94b_economy.js:73-77`); the old text can no longer be opened |

## (b) What the world does after each step

Class: *world changes* = something visible or audible outside a dialogue box; *another person* = someone other than the quest-giver has a new line; *giver only* = only the person who set the task says something new (usually one line of thanks); *nothing reacts*.

| step | flag | reaction (code) | class |
|---|---|---|---|
| **Side quests (`80_game.js`)** |  |  |  |
| A Stranger at the Gate: speak to Hale | `q.welcome` stage 1 | Hale's greeting becomes "Road's quiet" (:76). Nothing else | giver's own next line only |
| …find Greta (quest done) / Ale for the Hart begins | `q.welcome` done, `flags.bed` | Every bed in town becomes usable (:218); death wakes you at the Hart (90_rpg.js:74); Greta gains stew and room options (82b_interact.js:256); Rowan's "Is the valley safe?" unlocks (:148) | world changes |
| Ale: take the malt from Osric | `q.ale` stage 1, item `malt` | Osric falls back to his stock line (:91). Nothing else | giver's own next line only |
| Ale: deliver | `q.ale` done | Greta's thanks, then "What can I get you, love?". "There'll be ale by week's end": she sold ale at 2 gold before the malt came (:88, offered at :90) and goes on doing so. Nothing changes | giver's own next line only |
| Hammer: accept from Brandt | `q.hammer` stage 0 | nothing reacts (Brandt goes on playing the `hammer` animation at his anvil, `77_npc.js:8-9`, with the hammer missing) | **nothing reacts** |
| Hammer: Tobin confesses | stage 1 | nothing reacts | **nothing reacts** |
| Hammer: picked up at the tower | stage 2, item | the pickup disappears | **nothing reacts** |
| Hammer: returned | done | Brandt: "She rings true again" (:97); Tobin: "He wasn't even cross" (:103) | another person speaks differently |
| Frostcaps: accept | `q.herbs` 0 | nothing reacts | **nothing reacts** |
| Frostcaps: five gathered | stage 1 | pickups disappear as taken | **nothing reacts** |
| Frostcaps: delivered | done | Maren's stock line; unlocks the tea quest (81_wilds_story.js:50) | giver's own next line only |
| Bell: accept from Aldous | `q.bell` 0 | Marta's rope option is marked as a quest option (:121) | **nothing reacts** |
| Bell: rope bought | stage 1 | nothing reacts | **nothing reacts** |
| Bell: rope given | stage 2 | the bell under the tower can be rung (:185) | world changes |
| Bell: rung | done, `flags.bell` | the bell tolls on the hour from then on (88c_world.js:132); Aldous: "The valley has its voice again" (:118). Hale still says "a chapel bell that no longer rings" (:78, recorded) and Rowan's chronicle still says the bell is silent | world changes |
| Harvest Fire: Rowan asks | `q.fire` 0/1 | Rowan only | giver's own next line only |
| Harvest Fire: lit | done, `flags.fire` | all 80 villagers stand round the fire that evening (:224-232); the bonfire burns 19:00-02:00 every night after (99_main.js:111), with nobody at it; new lines for Hale (:75), Greta (:86), Rowan (:125) | world changes |
| Smoke in the Pines: accept | `q.camp` 0 | nothing reacts | **nothing reacts** |
| …camp cleared | stage 1 | notice "The camp in the pines is silent." (:171) | **nothing reacts** |
| …reported | done | Rowan's thanks and a buckler (:150). Hale says nothing. The camp refills after 3 days (92_foes.js:111) | giver's own next line only |
| Tongs and Temper: accept / tools taken / returned | `q.tools` | Brandt's thanks and a sword (:154). Nothing else, 3 steps | giver's own next line only |
| Sexton's Key: key found in the sacristy | `q.crypt` 1 | nothing reacts. Aldous has no line about his sacristy being searched | **nothing reacts** |
| …crypt gate unlocked | stage 2 | the gate and its collider are removed (:200) | world changes |
| …reliquary opened | done | nothing reacts. Nobody mentions the emptied reliquary; Aldous's only related option disappears | **nothing reacts** |
| Bounty: accept / five put down / paid | `q.bounty` | Hale's one line (:160). Nothing else, 3 steps | giver's own next line only |
| **Wilds quests (`81_wilds_story.js`)** |  |  |  |
| Three-Herb Tea: accept / gathered / delivered | `q.tea` | Maren's thanks (:51). The person it is for ("Edda's widow") does not exist. 3 steps | giver's own next line only |
| What Became of Corwin: accept / cap found / cap to Rowan | `q.brother` | Rowan's thanks (:57). Does not touch the main story, which asks the same question again; 3 steps | giver's own next line only |
| **Main story (`82_story.js`, `94_mine.js`, `94d_act2.js`)** |  |  |  |
| The body examined | `flags.sawBody`, item `tally` | Finn gains "The man you found" (82_story.js:115) and a remark (82b_interact.js:272); Hale's wharf option goes. The bier itself is never removed, in any ending | another person speaks differently |
| Maren reads the token | `flags.pell` | Aldous gains the Sexton's-key option (:114) and a remark (82b:271); Marta sells a lantern (:121) | another person speaks differently |
| Reliquary: key, lantern, ledger | item `minekey` | the ledger opens. Nobody reacts | **nothing reacts** |
| Mine door opened | `flags.mineOpen` | board shows a third job and "Three of them" (94b_economy.js:71); Greta's rumour changes (:86-87) and she has a remark (82b:269); the generic remark "They say the old mine door is open" (82b:264) for 16 people, unrecorded | another person speaks differently |
| Corwin's journal taken | `flags.corwin` | Hale answers with the journal node (82_story.js:103,109) | another person speaks differently |
| Hale reads it | `flags.act1` | Rowan's node changes (:124); Finn's and Pip's wharf options are withdrawn (:115-116); one rumour retires | another person speaks differently |
| Rowan: "not today" | `flags.rowanAsked`, `rowanDay` | Rowan only; journal line changes (94d_act2.js:26) | giver's own next line only |
| Rowan tells the rest | `flags.act2` | the Hart's cellar wall can be pulled out without the ledger (94d_act2.js:43). Greta, whose cellar and whose smuggling it is, has no line at any point of Acts 2 or 3 | world changes |
| The bricks pulled out | `flags.sec_wall` | brick prop hidden, doorway and portal appear (:139) | world changes |
| Into the tunnel | `flags.tunnel` | nothing reacts | **nothing reacts** |
| Into the Bread Cave | `flags.cave` | one notice | **nothing reacts** |
| Ending: bread | `flags.ending = 'bread'` | 7 candles and a loaf table on the Wharf (:70-71, 122-123); Rowan's line (:36); one free stew (82b:254); mine enemies removed (:133); the night meeting stops (82c_secrets.js:107). The text says Rowan carries bread at dawn, the village keeps the count and silver goes out monthly: no schedule changes and nobody ever goes to the table | world changes |
| Ending: rest | `flags.ending = 'rest'` | a cairn at the cleft, 2 lanterns at the mine door, the door unbarred, the twelve props hidden (:122-127); Rowan's line (:37). The text says men are asking for wages at the Hart and the Elder sits by the lake: neither happens | world changes |
| **Secrets (`82c_secrets.js`)** |  |  |  |
| Tobin's box in the Watch Bell | `sec_bell` | one of Greta's rumours retires (94b_economy.js:80). Tobin has no line | **nothing reacts** |
| The stone in the terrace wall | `sec_stone` | one rumour retires | **nothing reacts** |
| The Magpie's cellar hatch | `sec_cellar` | one rumour retires | **nothing reacts** |
| The Hart's ledger (trunk on the roof walk) | `sec_attic`, `hear_hartledger` | the cellar wall can be opened; Pip's hint retires (82_story.js:118). Greta, named in it as counting the silver, has no line | world changes |
| Behind the bricks | `sec_wall` | the tunnel doorway | world changes |
| The quay strongbox | `sec_strongbox` | one rumour retires | **nothing reacts** |
| The night meeting overheard | `hear_meeting` | a pouch can be taken; the meeting never recurs. Neither Rowan nor Greta has a line about being overheard | **nothing reacts** |
| The dropped pouch | `sec_meetpouch` | Pip's hint retires | **nothing reacts** |
| The Magpie followed to the Hidden Yard | `magpieYard` | a sack appears under the well-lip (:130) | world changes |
| The Magpie's sack | `sec_magpie` | one rumour retires. The WANTED notice cannot be answered | **nothing reacts** |
| Widow Hale's hatbox | `sec_house` | one rumour retires. The unopened letter "addressed to Hale" cannot be given to Hale; he has no line | **nothing reacts** |
| Asking about the shut house (4 people) | `hear_house` | the flag is written and never read | **nothing reacts** |
| **Board jobs (`94b_economy.js`)** |  |  |  |
| Outlaws on the passes / The Old Mine / Lamp oil for the watch | `rpg.job` | the board's own text. The oil is "for the gate": Hale and Ivo have no line and receive nothing. 3 jobs | **nothing reacts** |
| **Reading** |  |  |  |
| 14 of the 20 house documents set a `hear_*` flag (`82b_interact.js:187`): bread, cave, hollow, mine, pell, frostcap, silver, cellar, magpie | `hear_bread` … | none of the 9 flags is read anywhere in `src/` (the comment at :45 says they feed "the rumours and the story") | **nothing reacts** |

**Counts (64 steps):** nothing reacts **27**; giver's own line only **19**; another person speaks differently **6**; the world changes **12**.

What never reacts to anything: the 63 villagers without dialogue (no flag is read by any of them); every schedule in the game (no quest or ending changes a single `sched` row; the only overrides are the harvest-fire ring, `80_game.js:227`); shop stock and prices; the bodies on the wharf and in the cave after the "bread" ending.

**A defect found while tracing this.** `IX.SAY` rows are tried in order and the first match wins (`82b_interact.js:276`). `94d_act2.js:75-83` puts the two "anyone" ending rows first:

- after the bread ending, row 1 ("There's bread on the Wharf every dawn now. My mother would have cried to see it.") matches for every speaker, always;
- after the rest ending, row 2 ("The quiet's different. Lighter…") does.

So the six rows below them can never be chosen: Greta x2 ("I'll not charge you for the stew this once, love…", "The Hart's never been so full…"), Hale x2 ("The count is kept and the gate is quiet…", "I've left the old door unbarred…"), Brandt ("Silver for a blade? Aye, I'll work it now…"), Finn ("Nobody's come out of the lake since…"). All six are recorded (in the manifest) and unreachable. The nine person-specific rows of the original table (`82b_interact.js:265-273`) are also dead once an ending is reached, and before that are masked whenever a generic condition holds (night, rain, 120 gold, an unpaid fine, the mine open). What the player hears instead is the same unrecorded sentence from each of 16 people (Rowan returns early, `94d_act2.js:36-37`). Read from code; not run.

## (c) Voice coverage

### Planned lines with no audio

**None.** `plan.json` has 252 entries (168 dialogue, 84 barks) for 17 speakers; all 252 keys are in `manifest.json`; the manifest has no key that is not in the plan; every dialogue text in the plan still occurs verbatim in `src/` (0 stale). Per speaker (dialogue + barks): greta 34+5, rowan 22+5, brandt 20+5, hale 18+5, marta 13+5, maren 12+5, aldous 10+5, ivo 7+5, finn 6+5, pip 6+5, tobin 4+5, osric 3+5, lark 3+5, bram 3+5, wren 3+4, edda 2+5, hilda 2+5.

The plan is complete only because the plan is small: 63 of 80 villagers have no line to record.

### Shown as speech, not in the plan

**1. Seven generic remarks, said by any of the 17 (16 after an ending), never recorded.** They are prefixed to the speaker's own line with a blank line; `88d_voice.js:40-41` then plays only the paragraphs that have a file, so the remark is silent text above a voiced line.

| text | condition | where |
|---|---|---|
| I heard about the business with the shop. Keep your hands to yourself. | unpaid fine | `82b_interact.js:260` |
| You're about late. Mind the dark. | 22:00-04:30 | `:261` |
| Foul day to be standing about in. Get under a roof. | rain, outdoors | `:262` |
| You're jingling, friend. Mind the lanes after dusk. | 120 gold or more | `:263` |
| They say the old mine door is open. Folk are talking. | mine open, journal not found | `:264` |
| There's bread on the Wharf every dawn now. My mother would have cried to see it. | bread ending | `94d_act2.js:76` |
| The quiet's different. Lighter. I slept the night through for the first time since the frost. | rest ending | `94d_act2.js:77` |

Cause: speaker is `*`, so `extract.mjs` attributes them to nobody; recording them means 7 x 17 = 119 files, or one voice each.

**2. Lines built at run time** (`lines.json` `dynamic`, 15 entries). Cause for all: the text contains a number or a list, so it has no fixed key.

| speaker | where | text as written in the source (first 90 chars) |
|---|---|---|
| maren | `80_game.js:109` | `'You have ' + frostN() + ' of five. Keep looking where it is cold and quiet.'` |
| (buyer/keeper) | `80_game.js:123` | `'That’s ' + cost + ' gold, dear, and you have ' + S.gold + '. Greta or Brandt might have p` |
| rowan | `80_game.js:131` | `'There are troubles enough: ' + left.join(', ') + '. Mend those, and come back to me.'` |
| maren | `81_wilds_story.js:52` | `'Bogbean ' + (has('bogbean') ? 'in hand' : 'still wanting') + ', sunwort ' + (has('sunwort` |
| pip | `82_story.js:119` | `PIP_SEEN[i][1]` |
| (buyer/keeper) | `82b_interact.js:214` | `'Hold. That’s theft, in front of a witness, and I’ll not have it in my town. The fine is '` |
| brandt | `93_inventory.js:61` | `'That’s ' + m.cost + ' gold, and you’ve ' + S.gold + '. Hale pays a bounty on outlaws, if ` |
| (buyer/keeper) | `94b_economy.js:40` | `'That’s ' + pr + ' gold, and you’ve ' + S.gold + '. The board in the square pays for hones` |
| brandt | `94b_economy.js:53` | `'Ninety gold, and you’ve ' + S.gold + '.'` |
| - | `94b_economy.js:67` | `j.title + ': ' + (j.have ? 'three flasks of lamp oil, you have ' + (S.items.oil // 0) : r.` |
| - | `94b_economy.js:69` | `d.text + '\n\nYou take the notice.'` |
| - | `94b_economy.js:71` | `(S.flags.mineOpen ? 'Notices, pinned over notices. Three of them are in a clean hand and h` |
| greta | `94b_economy.js:94` | `pick[0][1]` |
| - | `94d_act2.js:112` | `'Three loaves, and you have ' + bread + '. The Hart has stew and Marta has loaves, and nob` |
| - | `94d_act2.js:114` | `'Twelve stand in a row at the water’s edge, and not one of them breathes. The slab before ` |

Of these: 5 belong to the notice board and the slab (silent by design: `94b_economy.js:67,69,71`, `94d_act2.js:112,114`); 2 are tables whose rows *are* recorded (`PIP_SEEN`, `RUMOURS`); `93_inventory.js:61` is dead code (`Inv.shop` is replaced at `94b_economy.js:37`). That leaves **7 spoken lines that can never have a recording as written**: Maren x2 (`80_game.js:109`, `81_wilds_story.js:52`), Marta's "That's N gold, dear…" (`80_game.js:123`), Rowan's list of troubles (`:131`), the arrest speech by Hale or Ivo (`82b_interact.js:214`: the first thing a guard ever says to a thief), Brandt x2 (`94b_economy.js:40, 53`).

**3. Speech shown as a notice, never in the plan.**

| speaker shown | text | where | cause |
|---|---|---|---|
| any of the 80 | "Oi! Put that back! Guards!" | `82b_interact.js:151` | a notice with the witness's name; not a dialogue node, so the extractor does not see it; 63 possible speakers have no cast voice |
| Marta | "Fifteen gold, dear. Ask me at the counter." | `80_game.js:221` | written as `Marta: “…”` without the bold name, so it is neither extracted nor matched by the overheard-line player (`88d_voice.js:58-59`) |
| Hale | "Don't make me do that twice." | `82b_interact.js:229` | inside a narration notice |
| 6 passers-by | "Morning." / "Fine day." / "Mind the carts." / "Good day to you." / "Well met." | `77b_ambient.js:82` | unnamed speakers ("A farmhand: …"); not in cast |
| 6 people in the wilds | 12 lines, two each (`79b_life.js:6-11`), e.g. "Highfold has four doors and one opinion." | `79b_life.js:33` | unnamed speakers; not in cast |
| the 63 without dialogue | `...` | `85_ui.js:28` | there is nothing to record |
| Hale / Ivo fallback | "Move along." | `82b_interact.js:249` | marked never spoken in `extra_speakers.json`; unreachable, both have dialogue |

**4. Recorded and unreachable:** the six ending remarks listed under (b).

**5. Cast with no lines:** `narrator` (voice Schedar) has 0 planned lines. The slab's narration, the two ending texts and every note are read silently.

## What this audit could not check

Nothing was run. Whether a recording matches its text, how any line sounds, and whether the first-match defect behaves in the page as the code reads, are unverified here; the last deserves one play-bot check (talk to Greta and Hale after each ending).
