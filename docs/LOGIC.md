# Logic audit: story, people, mechanics

Made by playing (`test/playbot.mjs`), by reading every line in story order (`shots/bot/trace.log`, `tools/voice/plan.json`) and by
reading the rules in the source. Each finding says what was wrong, what was done, and the check that keeps it right. "Open" means
found and not fixed, with the reason. Nothing here adds a quest, a place or a feature.

A recorded line is never reworded (the recording is keyed by its text). Where a recorded line was the problem, the world was changed
to agree with the line, or a new line was added beside it. New lines are subtitles until the daily voice batch records them.

Checks: `node test/playbot.mjs --run logic` (part of gate step `bot-play`), `test/story.js`, `test/econ.js`, `test/people.js` (gate
step `people`). What no check can tell: whether a line reads well aloud, and whether a routine looks natural in motion.

## 1. Story

Played to both endings. Order of telling: Hale at the gate, the body at the wharf, Maren, Aldous and the crypt, the reliquary (key,
lantern, ledger), the Old Mine and Corwin's journal, Rowan, the wall in the Hart's cellar, the tunnel, the Bread Cave, the choice.

| # | What did not make sense | What was done | Check |
|---|---|---|---|
| S1 | Rowan says "Not today. Come back tomorrow" and then told everything a second later if asked again. | His first refusal records the day; the rest is told on a later day. Asked again the same day he has a new line ("Tomorrow, I said. An old man needs a night to find the words. Sleep, and come back."). The journal says "Go back to Elder Rowan tomorrow". | `test/story.js`, bot `story` |
| S2 | Sleeping put the clock back: to bed at 22:00, up at 07:00 the same day, so "tomorrow" never came by sleeping; a nap at 10:00 went back three hours. Dying and the cell did the same. | Bed, death and the cell all wake you the next morning and turn the day. | bot `logic` (bed, cell), bot `death` |
| S3 | Hale's "something on his mind" could be asked once only, and the option about the wharf vanished if the player walked away, leaving no way to learn where to go. | It stays until the body has been seen, and asking it starts the story. Pip can be asked "What's happening at the wharf?" and starts it too. | bot `logic` (Pip) |
| S4 | Options presumed what the player had not learned: Aldous could be asked about the sexton's ledger before anyone had named it; Finn about the drowned man before the story began or after it was settled; Marta sold a miner's lantern "for the mine" before the mine had been spoken of. | Each option now waits for the fact it rests on (the ledger: after Maren names Pell; Finn: between the start and the end of Act 1; the lantern: once Pell, the key or the open door is known). | bot `logic` (Marta), bot `talks` |
| S5 | The notice board offered work in the Old Mine while its door was still barred and sealed, and its text said "Three of them" whatever was pinned up. | The mine notice appears when the door has been opened; the board counts two or three notices to match. | `test/econ.js`, bot `logic` |
| S6 | Greta told rumours that give away her own secrets: the trunk on her roof walk, the wall in her own cellar, the lights behind the chapel (she is one of the two people there). | Those three are no longer hers. Pip, who climbs and watches, tells the two that are safe for a child to know ("Seen anything odd, Pip?"); the cellar wall is learned from Rowan, as the story intends. | bot `logic`, `tools/voice/extract.mjs` |
| S7 | The journal in the mine was signed by a man who "went down three weeks ago", but Maren's recorded line says Pell "dug under Corwin, a good while back", which makes Corwin an old hand. | The journal's first line now reads "Corwin, miner: the last of the old shift left above ground", which agrees with Maren. | reading |
| S8 | The two cloaked people behind the chapel talked of "the stranger" before the player could have been noticed, counted the weeks differently from the ledger, and went on meeting after the matter under the town was settled. | Their unrecorded lines were reworded to agree with the ledger (three weeks without bread); the meeting no longer happens once either ending is reached. | bot `logic` (after the ending) |
| S9 | Brandt's remark about the blade from the mine was written for an item that does not exist (`silverpick`), so it was never said. | It now fires for Silverthread, the blade the Foreman's chest holds. | bot `talks` |
| S10 | After the bread ending Greta says the stew is on the house, and charged three gold for it. | The first bowl after that ending is free. | bot `logic` |
| S11 | The slab in the Bread Cave described the Foreman as waiting below whether or not the player had killed him. | Its text depends on whether he is alive. | bot `story` |
| S12 | Journal stages named places the player had not been told of ("Go to the wharf" with no reason; "Find Corwin" before his name was known). | Reworded: "Go to the wharf: a dead man lies on a bier there"; "Find what became of Corwin in the deep workings" appears after the journal. | `test/story.js` |
| S13 | Things were offered through walls and floors, so the cellar's loose bricks could be pulled from the taproom. | Line of sight is needed, with the two things that are reached through their wall exempt. | walk bot, bot `story` |

Withdrawn: an earlier note said no shop sold bread although the slab in the cave says Marta's bread is left there. She has always
sold a rye loaf for 3 gold; a second, cheaper loaf added during this audit was a duplicate, was caught by the bot and is removed.

Open:

| # | What | Why open |
|---|---|---|
| S14 | Steps can still be done out of order by a player who explores: the reliquary and the mine can be opened before the body is seen. The story then catches up (the bot plays this), but Hale's first lines still speak as if nothing is known. | Would need new lines for Hale for each order; they are recorded lines today. Proposed: one new line ("You've been busy, I hear") gated on `mineOpen`. |
| S15 | Rowan's telling is long (nine lines) and is the only place the whole history is given; a player who skips it has only the journal. | Writing, not logic. |
| S16 | Nobody in town speaks differently after the "rest" ending except Greta, Rowan and Aldous. | Needs new recorded lines for 14 people: a writing task with a voice cost of about 30 lines. |

## 2. People

`test/people.js` moves the clock through the day and writes where everyone is and what they are doing each hour; it fails on a
keeper away from an open shop, two people in one spot, a person standing through the night, and one routine shared by several
people. Regenerate the table with `window.__peopleFull = true` in that test.

What was wrong and is fixed:

| # | What | What was done |
|---|---|---|
| P1 | The 60 household residents shared four routines to the minute: whole streets got up, went out and came in together, and most stood in their doorway all day ("idle" at `.home`). | Each resident has a day built from who they are (a shopkeeper keeps the counter, a tradesman works his yard, the others keep house): sweeping the step, water from the well, the market, a walk, a midday meal, an evening by the fire or at the Hart, bed. Times differ per person by up to 40 minutes. |
| P2 | People were sent to the same well, bench or stall at the same hour and stood inside each other. | Public places are booked: a place has one person at a time, the next goes elsewhere. `npcsep` is clean. |
| P3 | Greta stood behind the bar for 18 hours and never went to the kitchen or the cellar. | Kitchen before opening, the cellar in the slack of the afternoon, the bar the rest of the day, bed at 23:30. |
| P4 | Marta stood at the counter from 06:00 with the shop shut until 07:30. | She fetches stock from the cellar first. |
| P5 | Lark played the lute by the Hart's fire all night, every night. | He sits by the fire when the room empties and has a guest bed at the Hart from half past midnight. |
| P6 | The gate was unguarded from 19:30 to 06:00 while Hale drank and slept, and Ivo did nothing different from Hale. | Ivo sleeps in the morning, patrols in the afternoon and holds the gate at night. |
| P7 | Maren and Wren worked outdoors for fourteen hours without a pause. | Each sits down indoors at midday. |
| P8 | Rain changed nothing: people sat on benches and played the lute in it. | Anyone out of doors with nothing that must be done there goes under their own roof while it rains; people at work stay (the field, the forge, the watch, the nets). Villagers remark on the weather if spoken to outdoors in rain. The six unnamed passers-by go home in rain as they do at dusk. Check: bot `logic`. |
| P9a | The Hart's seven regulars stood in the square from 07:30 to 18:30 every day with nothing to do, though four are named for trades; one shared his full name with a householder. | The four of working age have a morning's work (the field, the barn, carting at the mill, the yard) and the afternoon in town; the youth and the two old ones idle, as they would. The duplicate is renamed (Piers Ashby). |

Reactions that exist and were confirmed by the bot: a witnessed theft (the witness shouts, a guard comes, people mention it, and
now the shops will not trade until it is settled); the hour ("You're about late"); a full purse; a wounded player (Maren); a fine
blade (Hale); a sword swung near people (a spoken protest); rain (P8); beds at night for everyone who has one.

Open:

| # | What | Why open |
|---|---|---|
| P9 | Tobin stands in the forge from 21:30 to 07:00, and Brother Aldous prays at the altar from 18:00 to 09:00: neither building has a bed for them. | A bed is a piece of furniture in an interior plan (`72e_plans.js`, the interiors worker). Wanted: a pallet in the smithy (`smithy.bed2`) and a cot in the chapel's vestry (`chapel.bed`); the schedule rows are a one-line change once the spots exist. |
| P10 | Tobin "runs errands" for twelve hours without a break. | Kept: he is a boy and the route is long; a midday meal at the forge would be better and needs P9's seat check first. |
| P11 | A swing of the sword within 9 m draws a spoken protest from whoever is near, but nobody steps back, and a blade merely held gets no notice. | A flinch needs an animation the character sets do not have. |
| P13 | Which way a keeper faces at the counter could not be judged from the test's pictures. | Needs a person to look. |
| P14 | One villager was seen in the square at 10:00 in a rigid arms-out pose. | A character-set fault (for the characters worker), not a routine. |

### Where everyone is, hour by hour

| Who | The day |
|---|---|
| Warden Hale | 00-06 sleeps Warden’s Lodge; 06-19 guards by Scribe’s House; 19-22 sits The Honeyed Hart; 22-24 sleeps Warden’s Lodge |
| Greta Barleybrook | 00-05 sleeps The Honeyed Hart; 05-07 works The Honeyed Hart; 07-14 stands The Honeyed Hart; 14-15 works The Honeyed Hart; 15-23 stands The Honeyed Hart; 23-24 sleeps The Honeyed Hart |
| Brandt Ironhand | 00-06 sleeps Brandt’s Forge; 06-12 hammers Brandt’s Forge; 12-13 works Brandt’s Forge; 13-19 hammers Brandt’s Forge; 19-22 sits The Honeyed Hart; 22-24 sleeps Brandt’s Forge |
| Tobin | 00-07 stands Brandt’s Forge; 07-19 run by The Pillory; 19-21 sits Brandt’s Forge; 21-24 stands Brandt’s Forge |
| Marta Quill | 00-06 sleeps Quill’s Sundries; 06-07 works Quill’s Sundries; 07-20 stands Quill’s Sundries; 20-22 sits The Honeyed Hart; 22-24 sleeps Quill’s Sundries |
| Brother Aldous | 00-09 prays Chapel of the Dawn; 09-12 stands Chapel of the Dawn; 12-14 prays Chapel of the Dawn; 14-18 stands Chapel of the Dawn; 18-24 prays Chapel of the Dawn |
| Old Maren | 00-07 sleeps Maren’s Cottage; 07-12 works by Glover’s House; 12-14 sits Maren’s Cottage; 14-18 works by Glover’s House; 18-21 sits Maren’s Cottage; 21-24 sleeps Maren’s Cottage |
| Osric Dunn | 00-06 sleeps Dunn’s Mill; 06-10 works Dunn’s Mill; 10-13 stands by Dunn’s Mill; 13-19 works Dunn’s Mill; 19-22 sits The Honeyed Hart; 22-24 sleeps Dunn’s Mill |
| Edda Fairweather | 00-06 sleeps Fairweather Farm; 06-10 works by Fairweather Fields; 10-12 stands by Fairweather Farm; 12-17 works by Fairweather Fields; 17-19 sweeps by Fairweather Farm; 19-21 sits Fairweather Farm; 21-24 sleeps Fairweather Farm |
| Finn Reedwater | 00-05 sleeps Fisher’s Hut; 05-19 fishes by Mirrormere; 19-22 sits The Honeyed Hart; 22-24 sleeps Fisher’s Hut |
| Lark | 00-09 sleeps The Honeyed Hart; 09-13 plays by The Market Cross; 13-15 plays The Honeyed Hart; 15-18 plays by The Market Cross; 18-24 plays The Honeyed Hart |
| Wren | 00-06 sleeps Wren’s Cabin; 06-11 works by Wren’s Cabin; 11-13 sits Wren’s Cabin; 13-20 works by Wren’s Cabin; 20-22 sits Wren’s Cabin; 22-24 sleeps Wren’s Cabin |
| Elder Rowan | 00-08 sleeps Rowan’s Cottage; 08-14 sits by The Pillory; 14-19 sits by Rowan’s Cottage; 19-21 sits Rowan’s Cottage; 21-24 sleeps Rowan’s Cottage |
| Pip | 00-07 sleeps Riverside Cottage; 07-19 run by Merchants’ Row; 19-20 stands Riverside Cottage; 20-24 sleeps Riverside Cottage |
| Guardsman Ivo | 00-06 guards by Scribe’s House; 06-13 sleeps Warden’s Lodge; 13-19 walks by Brackenfell Gate; 19-24 guards by Scribe’s House |
| Hilda Weaver | 00-08 sleeps Riverside Cottage; 08-12 stands Lindqvist’s Draper; 12-14 stands by Riverside Cottage; 14-18 stands Lindqvist’s Draper; 18-21 stands Riverside Cottage; 21-24 sleeps Riverside Cottage |
| Bram | 00-07 sleeps Fairweather Farm; 07-18 stands by Cooper’s House; 18-19 works by Barn; 19-22 stands The Honeyed Hart; 22-24 sleeps Fairweather Farm |
| Wat Cooper | 00-07 sleeps Cooper’s House; 07-11 works by Fairweather Fields; 11-13 stands by Cooper’s House; 13-15 stands by The Market Cross; 15-18 sits by The Pillory; 18-23 sits The Honeyed Hart; 23-24 sleeps Cooper’s House |
| Tilda Fenn | 00-07 sleeps Fletcher’s House; 07-12 works by Barn; 12-14 stands by Cooper’s House; 14-16 stands by The Pillory; 16-18 stands by Rowan’s Cottage; 18-23 sits The Honeyed Hart; 23-24 sleeps Fletcher’s House |
| Hob the Carter | 00-07 sleeps Potter’s House; 07-10 works by Dunn’s Mill; 10-12 stands by Riverside Cottage; 12-15 stands by The Wharf; 15-18 stands by The Market Cross; 18-23 sits The Honeyed Hart; 23-24 sleeps Potter’s House |
| Sorrel Vane | 00-07 sleeps Tanner’s House; 07-12 sits by Rowan’s Cottage; 12-16 stands by Quill’s Sundries; 16-18 stands by The Pillory; 18-23 sits The Honeyed Hart; 23-24 sleeps Tanner’s House |
| Piers Ashby | 00-10 sleeps Dyer’s House; 10-14 stands by Merchants’ Row; 14-18 stands by The Pillory; 18-23 sits The Honeyed Hart; 23-24 sleeps Dyer’s House |
| Nell Marsh | 00-07 sleeps Widow Hale’s House; 07-12 stands by The Pillory; 12-16 stands by Riverside Cottage; 16-18 stands by The Market Cross; 18-23 sits The Honeyed Hart; 23-24 sleeps Widow Hale’s House |
| Jory Thatcher | 00-08 sleeps Fletcher’s House; 08-10 works by Fairweather Farm; 10-13 stands by The Market Cross; 13-16 stands by Cooper’s House; 16-18 stands by The Pillory; 18-23 sits The Honeyed Hart; 23-24 sleeps Fletcher’s House |
| Agnes Shepherd | 00-07 sleeps Highfold: the Reeve’s House; 07-10 sweeps Highfold: the Reeve’s House; 10-11 sits Highfold: the Reeve’s House; 11-12 stands by The Pillory; 12-15 sits Highfold: the Reeve’s House; 15-17 stands by The Hawker’s Passage; 17-18 sweeps Highfold: the Reeve’s House; 18-22 sits Highfold: the Reeve’s House; 22-24 sleeps Highfold: the Reeve’s House |
| Cecily Woodcutter | 00-07 sleeps Highfold: the Shepherd’s House; 07-08 sweeps Highfold: the Shepherd’s House; 08-09 sits Highfold: the Shepherd’s House; 09-11 stands by Quill’s Sundries; 11-12 sweeps Highfold: the Shepherd’s House; 12-14 sits Highfold: the Shepherd’s House; 14-16 stands by The Hawker’s Passage; 16-18 sweeps Highfold: the Shepherd’s House; 18-22 sits Highfold: the Shepherd’s House; 22-24 sleeps Highfold: the Shepherd’s House |
| Rafe Brook | 00-07 sleeps Highfold: the Shepherd’s House; 07-10 sweeps Highfold: the Shepherd’s House; 10-15 sits Highfold: the Shepherd’s House; 15-17 stands by The Market Cross; 17-18 sweeps Highfold: the Shepherd’s House; 18-22 sits Highfold: the Shepherd’s House; 22-24 sleeps Highfold: the Shepherd’s House |
| Piers Cooper | 00-07 sleeps Cooper’s House; 07-12 works Cooper’s House; 12-13 stands Cooper’s House; 13-16 works Cooper’s House; 16-17 stands by The Pillory; 17-19 sweeps Cooper’s House; 19-23 stands Cooper’s House; 23-24 sleeps Cooper’s House |
| Leofric Fletcher | 00-07 sleeps Fletcher’s House; 07-09 sits Fletcher’s House; 09-11 stands by Market Square; 11-12 sweeps Fletcher’s House; 12-15 sits Fletcher’s House; 15-16 stands by The Chapel Gate; 16-18 sweeps Fletcher’s House; 18-22 sits Fletcher’s House; 22-24 sleeps Fletcher’s House |
| Isolde Potter | 00-07 sleeps Potter’s House; 07-08 sweeps Potter’s House; 08-12 works Potter’s House; 12-13 stands Potter’s House; 13-17 works Potter’s House; 17-18 stands by The Market Cross; 18-20 sweeps Potter’s House; 20-22 stands Potter’s House; 22-24 sleeps Potter’s House |
| Rosamund Thatcher | 00-07 sleeps Alder House; 07-10 sweeps Alder House; 10-13 stands by The Market Cross; 13-15 sits Alder House; 15-17 sweeps Alder House; 17-22 sits Alder House; 22-24 sleeps Alder House |
| Wat Baker | 00-07 sleeps Baker’s House; 07-08 sweeps Baker’s House; 08-18 stands Baker’s House; 18-19 sweeps Baker’s House; 19-22 stands Baker’s House; 22-24 sleeps Baker’s House |
| Alder Butcher | 00-07 sleeps Butcher’s House; 07-08 sweeps Butcher’s House; 08-18 stands Butcher’s House; 18-20 sweeps Butcher’s House; 20-22 stands Butcher’s House; 22-24 sleeps Butcher’s House |
| Wynne Bray | 00-07 sleeps Butcher’s House; 07-10 sweeps Butcher’s House; 10-15 stands Butcher’s House; 15-17 stands by Market Square; 17-22 stands Butcher’s House; 22-24 sleeps Butcher’s House |
| Wat Carpenter | 00-07 sleeps Carpenter’s House; 07-08 sweeps Carpenter’s House; 08-12 works Carpenter’s House; 12-13 stands Carpenter’s House; 13-17 works Carpenter’s House; 17-18 stands by Quill’s Sundries; 18-20 sweeps Carpenter’s House; 20-22 stands Carpenter’s House; 22-24 sleeps Carpenter’s House |
| Agnes Brewer | 00-07 sleeps Brewer’s House; 07-12 works Brewer’s House; 12-13 sits Brewer’s House; 13-17 works Brewer’s House; 17-18 sits Brewer’s House; 18-20 sweeps Brewer’s House; 20-23 sits Brewer’s House; 23-24 sleeps Brewer’s House |
| Ivo Fenn | 00-07 sleeps Brewer’s House; 07-09 sweeps Brewer’s House; 09-11 sits Brewer’s House; 11-12 stands by Market Square; 12-13 sits Brewer’s House; 13-15 stands by The Bridge Gate; 15-17 sweeps Brewer’s House; 17-22 sits Brewer’s House; 22-24 sleeps Brewer’s House |
| Alder Glover | 00-07 sleeps Glover’s House; 07-08 sweeps Glover’s House; 08-18 stands Glover’s House; 18-19 sweeps Glover’s House; 19-22 stands Glover’s House; 22-24 sleeps Glover’s House |
| Isolde Fenn | 00-07 sleeps Glover’s House; 07-10 sweeps Glover’s House; 10-13 stands Glover’s House; 13-15 stands by The Pillory; 15-18 sweeps Glover’s House; 18-22 stands Glover’s House; 22-24 sleeps Glover’s House |
| Dunstan Holloway | 00-07 sleeps Hobb’s Cottage; 07-08 sweeps Hobb’s Cottage; 08-09 sits Hobb’s Cottage; 09-10 sweeps Hobb’s Cottage; 10-14 sits Hobb’s Cottage; 14-16 stands by The Market Cross; 16-17 sweeps Hobb’s Cottage; 17-22 sits Hobb’s Cottage; 22-24 sleeps Hobb’s Cottage |
| Rosamund Holloway | 00-07 sleeps Hobb’s Cottage; 07-09 sits Hobb’s Cottage; 09-10 sweeps Hobb’s Cottage; 10-16 sits Hobb’s Cottage; 16-18 sweeps Hobb’s Cottage; 18-22 sits Hobb’s Cottage; 22-24 sleeps Hobb’s Cottage |
| Wat Grocer | 00-07 sleeps Grocer’s House; 07-08 sweeps Grocer’s House; 08-18 stands Grocer’s House; 18-19 sweeps Grocer’s House; 19-22 stands Grocer’s House; 22-24 sleeps Grocer’s House |
| Isolde Chandler | 00-07 sleeps Chandler’s House; 07-08 sweeps Chandler’s House; 08-18 stands Chandler’s House; 18-20 sweeps Chandler’s House; 20-23 stands Chandler’s House; 23-24 sleeps Chandler’s House |
| Piers Dunmore | 00-07 sleeps Chandler’s House; 07-10 sweeps Chandler’s House; 10-15 stands Chandler’s House; 15-16 stands by The Watch Bell; 16-17 sweeps Chandler’s House; 17-22 stands Chandler’s House; 22-24 sleeps Chandler’s House |
| Wynne Dyer | 00-07 sleeps Dyer’s House; 07-08 sweeps Dyer’s House; 08-12 works Dyer’s House; 12-13 stands Dyer’s House; 13-17 works Dyer’s House; 17-20 sweeps Dyer’s House; 20-23 stands Dyer’s House; 23-24 sleeps Dyer’s House |
| Nell Merchant | 00-07 sleeps Merchant’s House; 07-12 sweeps Merchant’s House; 12-16 sits Merchant’s House; 16-17 sweeps Merchant’s House; 17-22 sits Merchant’s House; 22-24 sleeps Merchant’s House |
| Mabel Gale | 00-07 sleeps Wren Cottage; 07-08 sweeps Wren Cottage; 08-09 sits Wren Cottage; 09-11 stands by The Pillory; 11-13 sweeps Wren Cottage; 13-15 sits Wren Cottage; 15-16 stands by The Hawker’s Passage; 16-18 sweeps Wren Cottage; 18-22 sits Wren Cottage; 22-24 sleeps Wren Cottage |
| Maud Mason | 00-07 sleeps Mason’s House; 07-08 sweeps Mason’s House; 08-12 works Mason’s House; 12-13 stands Mason’s House; 13-17 works Mason’s House; 17-19 sweeps Mason’s House; 19-22 stands Mason’s House; 22-24 sleeps Mason’s House |
| Rafe Ketch | 00-07 sleeps Mason’s House; 07-11 stands Mason’s House; 11-13 sweeps Mason’s House; 13-15 stands by Quill’s Sundries; 15-18 sweeps Mason’s House; 18-22 stands Mason’s House; 22-24 sleeps Mason’s House |
| Aldous Cutler | 00-07 sleeps Cutler’s House; 07-08 sweeps Cutler’s House; 08-18 stands Cutler’s House; 18-19 sweeps Cutler’s House; 19-23 stands Cutler’s House; 23-24 sleeps Cutler’s House |
| Jory Hollin | 00-07 sleeps Marsh House; 07-09 sweeps Marsh House; 09-15 sits Marsh House; 15-17 sweeps Marsh House; 17-22 sits Marsh House; 22-24 sleeps Marsh House |
| Bess Scribe | 00-07 sleeps Scribe’s House; 07-12 works Scribe’s House; 12-13 sits Scribe’s House; 13-17 works Scribe’s House; 17-19 sweeps Scribe’s House; 19-22 sits Scribe’s House; 22-24 sleeps Scribe’s House |
| Alder Thatcher | 00-06 sleeps Scribe’s House; 06-07 sweeps Scribe’s House; 07-09 sits Scribe’s House; 09-10 sweeps Scribe’s House; 10-14 sits Scribe’s House; 14-17 sweeps Scribe’s House; 17-22 sits Scribe’s House; 22-24 sleeps Scribe’s House |
| Alder Cobbler | 00-07 sleeps Cobbler’s House; 07-08 sweeps Cobbler’s House; 08-18 stands Cobbler’s House; 18-20 sweeps Cobbler’s House; 20-22 stands Cobbler’s House; 22-24 sleeps Cobbler’s House |
| Ivo Tinker | 00-06 sleeps Tinker’s House; 06-08 sweeps Tinker’s House; 08-18 stands Tinker’s House; 18-20 sweeps Tinker’s House; 20-22 stands Tinker’s House; 22-24 sleeps Tinker’s House |
| Rosamund Basketmaker | 00-07 sleeps Basketmaker’s House; 07-10 sweeps Basketmaker’s House; 10-11 sits Basketmaker’s House; 11-12 sweeps Basketmaker’s House; 12-15 sits Basketmaker’s House; 15-16 stands by Rowan’s Cottage; 16-17 sweeps Basketmaker’s House; 17-22 sits Basketmaker’s House; 22-24 sleeps Basketmaker’s House |
| Leofric Thatcher | 00-07 sleeps Garrick’s House; 07-10 sweeps Garrick’s House; 10-15 sits Garrick’s House; 15-16 stands by Wheelwright’s House; 16-17 sweeps Garrick’s House; 17-22 sits Garrick’s House; 22-24 sleeps Garrick’s House |
| Rafe Ropemaker | 00-07 sleeps Ropemaker’s House; 07-12 works Ropemaker’s House; 12-13 stands Ropemaker’s House; 13-16 works Ropemaker’s House; 16-17 stands Ropemaker’s House; 17-19 sweeps Ropemaker’s House; 19-22 stands Ropemaker’s House; 22-24 sleeps Ropemaker’s House |
| Maud Saddler | 00-07 sleeps Saddler’s House; 07-12 works Saddler’s House; 12-13 stands Saddler’s House; 13-16 works Saddler’s House; 16-17 stands Saddler’s House; 17-19 sweeps Saddler’s House; 19-22 stands Saddler’s House; 22-24 sleeps Saddler’s House |
| Cuthbert Lowe | 00-07 sleeps Saddler’s House; 07-11 stands Saddler’s House; 11-13 sweeps Saddler’s House; 13-15 stands Saddler’s House; 15-17 stands by The Bridge Gate; 17-18 sweeps Saddler’s House; 18-22 stands Saddler’s House; 22-24 sleeps Saddler’s House |
| Jory Bray | 00-07 sleeps Bram’s House; 07-08 sweeps Bram’s House; 08-09 sits Bram’s House; 09-13 sweeps Bram’s House; 13-14 sits Bram’s House; 14-18 sweeps Bram’s House; 18-23 sits Bram’s House; 23-24 sleeps Bram’s House |
| Cecily Tailor | 00-07 sleeps Tailor’s House; 07-08 sweeps Tailor’s House; 08-18 stands Tailor’s House; 18-19 sweeps Tailor’s House; 19-23 stands Tailor’s House; 23-24 sleeps Tailor’s House |
| Piers Lowe | 00-07 sleeps Tailor’s House; 07-08 sweeps Tailor’s House; 08-09 stands Tailor’s House; 09-11 sweeps Tailor’s House; 11-15 stands Tailor’s House; 15-17 sweeps Tailor’s House; 17-22 stands Tailor’s House; 22-24 sleeps Tailor’s House |
| Ivo Marsh | 00-07 sleeps Thorne House; 07-08 sweeps Thorne House; 08-09 sits Thorne House; 09-13 sweeps Thorne House; 13-17 sits Thorne House; 17-18 sweeps Thorne House; 18-22 sits Thorne House; 22-24 sleeps Thorne House |
| Tilda Marsh | 00-07 sleeps Thorne House; 07-10 sweeps Thorne House; 10-11 sits Thorne House; 11-12 sweeps Thorne House; 12-15 sits Thorne House; 15-17 sweeps Thorne House; 17-23 sits Thorne House; 23-24 sleeps Thorne House |
| Leofric Ashby | 00-07 sleeps Ferrin’s House; 07-10 sweeps Ferrin’s House; 10-16 sits Ferrin’s House; 16-18 sweeps Ferrin’s House; 18-22 sits Ferrin’s House; 22-24 sleeps Ferrin’s House |
| Alys Wheelwright | 00-07 sleeps Wheelwright’s House; 07-09 sweeps Wheelwright’s House; 09-11 stands Wheelwright’s House; 11-13 sweeps Wheelwright’s House; 13-14 stands Wheelwright’s House; 14-17 sweeps Wheelwright’s House; 17-22 stands Wheelwright’s House; 22-24 sleeps Wheelwright’s House |
| Rafe Gale | 00-07 sleeps Wheelwright’s House; 07-10 sweeps Wheelwright’s House; 10-15 stands Wheelwright’s House; 15-17 sweeps Wheelwright’s House; 17-22 stands Wheelwright’s House; 22-24 sleeps Wheelwright’s House |
| Gunnora Bray | 00-07 sleeps Tamsin’s House; 07-11 sits Tamsin’s House; 11-13 sweeps Tamsin’s House; 13-15 sits Tamsin’s House; 15-17 stands by The Bridge Gate; 17-18 sweeps Tamsin’s House; 18-22 sits Tamsin’s House; 22-24 sleeps Tamsin’s House |
| Mabel Woodcutter | 00-06 sleeps Woodcutter’s House; 06-10 sweeps Woodcutter’s House; 10-11 sits Woodcutter’s House; 11-13 sweeps Woodcutter’s House; 13-15 stands by The Bridge Gate; 15-17 sweeps Woodcutter’s House; 17-22 sits Woodcutter’s House; 22-24 sleeps Woodcutter’s House |
| Gunnora Shepherd | 00-07 sleeps Shepherd’s House; 07-12 sweeps Shepherd’s House; 12-15 sits Shepherd’s House; 15-17 sweeps Shepherd’s House; 17-23 sits Shepherd’s House; 23-24 sleeps Shepherd’s House |
| Agnes Hollin | 00-07 sleeps Pell House; 07-10 sweeps Pell House; 10-16 sits Pell House; 16-17 sweeps Pell House; 17-23 sits Pell House; 23-24 sleeps Pell House |
| Ivo Hollin | 00-07 sleeps Pell House; 07-09 sweeps Pell House; 09-16 sits Pell House; 16-17 sweeps Pell House; 17-22 sits Pell House; 22-24 sleeps Pell House |
| Tam Apothecary | 00-07 sleeps Shop; 07-08 sweeps Shop; 08-18 stands Shop; 18-19 sweeps Shop; 19-22 stands Shop; 22-24 sleeps Shop |
| Hob Cutler | 00-07 sleeps Shop; 07-08 sweeps Shop; 08-18 stands Shop; 18-20 sweeps Shop; 20-22 stands Shop; 22-24 sleeps Shop |
| Dunstan Grocer | 00-07 sleeps Shop; 07-08 sweeps Shop; 08-18 stands Shop; 18-20 sweeps Shop; 20-23 stands Shop; 23-24 sleeps Shop |
| Hawise Fenn | 00-07 sleeps Shop; 07-09 stands Shop; 09-11 sweeps Shop; 11-15 stands Shop; 15-18 sweeps Shop; 18-22 stands Shop; 22-24 sleeps Shop |
| Mabel Baker | 00-07 sleeps Shop; 07-08 sweeps Shop; 08-18 stands Shop; 18-20 sweeps Shop; 20-22 stands Shop; 22-24 sleeps Shop |
| Aldous Bookseller | 00-07 sleeps Shop; 07-08 sweeps Shop; 08-18 stands Shop; 18-20 sweeps Shop; 20-22 stands Shop; 22-24 sleeps Shop |
| Maud Tinker | 00-07 sleeps Shop; 07-12 works Shop; 12-13 stands Shop; 13-16 works Shop; 16-18 stands Shop; 18-20 sweeps Shop; 20-22 stands Shop; 22-24 sleeps Shop |

## 3. Mechanics

For each: the rule, whether the game tells the player, whether it is worth using, and what was wrong.

| Mechanic | The rule | Told in the game? | Worth using? |
|---|---|---|---|
| Combat | Light and heavy swings cost stamina (a swing without it does 60%); a block costs stamina per blow, and a block raised within a quarter of a second turns the blow and staggers the attacker; a dodge is 16 stamina with a third of a second untouchable. Armour takes 25 / 38 / 50% off. Health comes back at 1.4 a second after 7 s out of a fight. Foes that lose you go home and mend at 8% a second, and are whole again if you die. | It was not: nothing said how to strike, block or dodge, or that a late block costs more than a timely one (M9). Weapon and armour numbers are shown in the shop and the pack. | Yes. No way was found to win without fighting: leaving the camp's range heals the camp. |
| Economy | Brandt: iron sword 70, longsword 150, leather 55, brigandine 160, hauberk 320; the silver-edged blade is three bars and 90 gold. Marta buys loot at its value. The board pays 30 to 50 a job, each once a day. | Prices and effects are in the option text. | Yes: the hauberk is about three days of work, which is the length of the story. |
| Theft and the cell | Everything in a house belongs to it. Taking it where someone awake, on your floor and with a clear line to you can see is theft: a fine of twice the value plus 6, or hand it all back, or a night in the cell. | Now yes: the prompt says "Steal ..." and "(not yours)". | Unseen, yes; seen, no. That is the intended shape. |
| Lockpicking | A lock opens to its key, or to a pick 62% of the time (the shut house 50%, the wharf strongbox 45%, the cell 70%). A pick breaks on every failure and on three successes in ten. | The lock's message says a key or a pick is needed; the pick's description says it will not last. | Marginal: see M10. |
| Death | A quarter of the purse, at most 80 gold; you wake the next morning in your bed at the Hart (or by the road), foes healed. | The notice on waking says what was lost. | It is a cost worth avoiding from about 100 gold up. |
| Levels and perks | 60, 150, 270, 420, 600, 810, 1050 xp for levels 2 to 8; a perk at each; seven perks, so all are had by level 8. Kills pay 10 to 25 (the Foreman 150), a finished quest 30, a board job 20. | The level notice says to choose a perk; each perk states its number. | All seven do what they say (checked in the source one by one). |
| The lantern | Works in the Old Mine only. A flask burns ten minutes; the lantern refills itself from a flask; a thin bar shows what is left; dry, the mine is black. Lit, a lurker notices you from 5.6 m instead of 3. | The flask says ten minutes. That light draws the lurkers was said nowhere: the lantern's description now says so. | Yes: dousing to pass a lurker is the one stealth choice in the game. |

Exploits and dead rules, worst first:

| # | What | What was done | Check |
|---|---|---|---|
| M1 | Money and levels for nothing: the board's oil job paid 30 gold and 20 xp for three flasks that Marta, 50 m away, sells for 21. Any number of times, with no risk. | Each board job is paid once a day; the board says the notice will be back tomorrow. | bot `logic` |
| M2 | The cell was free: going quietly cost nothing, healed you fully, did not pass a day, and you kept any coin you had stolen and the price of anything you had already sold. It was always better than paying the fine. | A night in the cell turns the day, takes back what was stolen, coin included, and takes the value of what is no longer on you from the purse. | bot `logic`, bot `crime` |
| M3 | "Hand it back" returned goods but never coin: steal a purse and an apple, hand back the apple, keep the purse, no fine. It was also offered when part of the haul had been sold. | Stolen coin is counted and goes back; the option is offered only if everything taken is still held. | bot `logic` |
| M4 | A shopkeeper would buy your loot and sell to you while the watch was looking for you, a minute after shouting for the guard. | Brandt and Marta will not trade until the fine is settled (two new lines each side of the counter). | bot `logic` |
| M5 | Witnesses saw through walls and floors: anyone awake within 9 m on the map counted, upstairs or in the next room. The player could not tell when it was safe. | A witness is on your floor and has a clear line to you. | bot `logic` |
| M6 | Nothing said a thing was someone's: "Take bread" in a shop and "Take bread" in the woods read the same until the shout. | Owned things read "Steal ..."; owned chests and cupboards add "(not yours)". | bot `logic` |
| M7 | Sleeping, dying and the cell did not turn the day (see S2), so the outlaws' three-day return and "come back tomorrow" could be waited out only by standing still. | Fixed with S2. | bot `logic`, `death` |
| M8 | The perk "Hard bargainer" said "buy 15% cheaper" and only Brandt's prices changed (Marta's and Greta's prices are part of their spoken options). | The perk now says what it does: Brandt's prices 15% lower, and what you sell fetches 15% more. | reading |
| M9 | Fighting was explained nowhere: no notice said how to strike, strike hard, block or dodge, on keys or on a phone. | The first time something hostile notices you a notice says how; it stops once you have blocked or dodged. | reading; the hint cannot be judged headless |

Open:

| # | What | Why open |
|---|---|---|
| M10 | Picks cannot be bought; they turn up by chance, mostly in the guardhouse's boxes and rarely in a house. There are three fixed locks in the world worth a pick (the shut house, the hatch behind it, the wharf strongbox, each of which also has a key) and a scatter of locked cupboards. The skill is real but thin, and the best source of picks is stealing from the watch. | Selling picks is a new stock item, which the "nothing new" rule excludes; it is a one-line change if wanted (a rumour of who sells them would fit Finn). |
| M11 | Picking a lock in front of its owner is not a crime; only taking what is inside is. | Small; the theft that follows is caught by the same witness. |
| M12 | The lantern lights nothing outside the Old Mine: the crypt, cellars and the night are as dark with it as without ("There is no use for a lantern here"). | A carried light outdoors is a renderer change (the lamp map), not a rule change. |
| M13 | Against ordinary outlaws (38 health) the silver-edged blade kills in the same two light blows as the longsword; it shows only against leaders and the Foreman. | Numbers are consistent; noted in case the tiers are rebalanced. |
| M14 | The fine for picking the cell door is a flat 10 gold, less than most fines it lets you escape. | Kept low on purpose so that carrying a pick is worth something; say if it should be the original fine. |
| M15 | Levels give nothing but the perk, and all seven perks are had by level 8, so there is no choice to regret. | A design question, not a fault. |
