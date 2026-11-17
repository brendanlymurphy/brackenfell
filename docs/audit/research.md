# What makes a settlement believable: Skyrim, The Witcher 3, Kingdom Come: Deliverance

Research for a 25-building first-person village. Date: 2026-11-17.

## Read this first: how far to trust each line

Direct page fetches were blocked in this session (en.uesp.net, ck.uesp.net, blog.joelburgess.com, fandom, wikipedia all refused by the network policy). Only web search worked. So **nothing below is "I read the full page"**. The tags are:

- **[SNIPPET]** the text or number came back in the search result for that URL. I did not open the page. Quotes are as the search returned them and should be checked before being re-quoted.
- **[INFERENCE]** my reasoning from snippet facts.
- **[RECALLED, not verified]** from memory, no source seen in this session.
- **[NOT FOUND]** searched, no number or source.

To upgrade these to verified, allow `en.uesp.net`, `ck.uesp.net`, `blog.joelburgess.com`, `media.gdcvault.com`, `unwinnable.com`, `news.xbox.com`, `gamesradar.com` in the session's network settings and re-run.

---

## 1. Counts per settlement

**Riverwood (Skyrim)**
- Residents by building, as listed on UESP [SNIPPET, https://en.uesp.net/wiki/Skyrim:Riverwood and https://en.uesp.net/wiki/Skyrim:Riverwood_People]. I counted from the list returned:
  - Alvor and Sigrid's House: Alvor, Sigrid, Dorthe, Hadvar* (3 + 1 conditional)
  - Hod and Gerdur's House: Hod, Gerdur, Frodnar, Ralof* (3 + 1 conditional), plus Stump (dog)
  - Sven and Hilde's House: Sven, Hilde (2)
  - Faendal's House: Faendal (1)
  - Riverwood Trader: Lucan Valerius, Camilla Valerius (2)
  - Sleeping Giant Inn: Delphine, Orgnar, Embry (3)
  - **Count: 14 permanent named people, 16 with Hadvar and Ralof, 1 dog.**
- Cross-check: "a total of sixteen residents (and one dog, as well as chickens and cows)" [SNIPPET, https://elderscrolls.fandom.com/wiki/Riverwood_(Skyrim)].
- Enterable interiors: 4 houses + trader + inn = **6**, plus the open-air sawmill and Alvor's outdoor forge [INFERENCE from the list above; RECALLED that there are no other enterable buildings].
- **Ratio: 16 named people / 6 interiors = 2.7 per interior; 11 house-dwellers / 4 houses = 2.75 per house. No anonymous villagers; guards are the only generic bodies.** [INFERENCE]
- Services on that one street: sawmill, blacksmith, general store, inn [SNIPPET, https://en.uesp.net/wiki/Skyrim:Riverwood].

**Whiterun (Skyrim)**
- 29 mapped locations including farms, stables and towers outside the walls [SNIPPET, https://skyrimmap.com/whiterun-map]. Per-district counts [NOT FOUND].
- Named NPC total [NOT FOUND]. [RECALLED, not verified]: roughly 70 to 80 named residents; do not rely on this.
- "Most of the city's residents live in the Wind District" [SNIPPET, https://en.m.uesp.net/wiki/Skyrim:Proventus_Avenicci].

**Riften (Skyrim)**
- UESP lists residents per building (Honorhall Orphanage, Haelga's Bunkhouse, Black-Briar Manor, Temple of Mara, Bee and Barb, Ragged Flagon, jail) [SNIPPET, https://en.uesp.net/wiki/Skyrim:Riften]. Total [NOT FOUND].
- Shops and services named: Black-Briar Meadery, Elgrim's Elixirs, Pawned Prawn, Scorched Hammer, Bee and Barb, Riften Fishery [SNIPPET, same URL].

**Skyrim overall**: "about 1,100 non-playable characters voiced by 70 actors" [SNIPPET, https://en.wikipedia.org/wiki/Skywind].

**Kingdom Come: Deliverance**
- KCD1: 550 persistent characters; only 2 of them owned horses, yet horse pathfinding had to be built: "If you want to do this feature, you have to support it" [SNIPPET, https://www.gamesradar.com/games/rpg/kingdom-come-deliverance-had-to-add-complex-pathfinding-for-just-2-npcs-that-owned-horses-if-you-want-to-do-this-feature-you-have-to-support-it/].
- KCD2: the sequel "quadrupled the amount of NPCs on the map to nearly 2400" and put "around half of that into a single city" [SNIPPET, https://schedule.gdconf.com/session/supporting-thousands-of-npcs-in-kingdom-come-deliverance-kingdom-come-deliverance-ii/915120].
- Kuttenberg: about 1,400 NPCs needed, only about 70 renderable at once; the team built a white-box city early to measure how many NPCs are visible from each vantage point [SNIPPET, secondary summary, https://daily.dev/posts/designing-kuttenberg-city-around-design-constraints-kcd-2-u9dm2glxv; talk at https://www.youtube.com/watch?v=WbSIIHiEESM].
- Kuttenberg is "some ten times larger than" Rattay [SNIPPET, https://www.deepsilver.com/games/kingdom-come-deliverance-ii/news/kuttenberg-a-medieval-metropolis].
- KCD1 map about 16 km² [SNIPPET, https://en.wikipedia.org/wiki/Kingdom_Come:_Deliverance]. Per-village building and NPC counts for Rattay, Sasau, Skalitz, Uzhitz [NOT FOUND].

**The Witcher 3**
- Novigrad harbour: "For the 50 sailors at Novigrad harbour ... we made 200 possible spots" [SNIPPET, https://www.gamesradar.com/games/the-witcher/the-witcher-3-devs-tried-to-give-npcs-fear-reactions-but-it-got-cut-after-a-few-horrifying-weeks-when-women-were-just-dropping-their-babies-left-and-right/]. That is a 4:1 ratio of activity spots to people.
- Building or NPC totals for White Orchard, Novigrad, Oxenfurt [NOT FOUND]. The often-repeated "2,000 NPCs in Novigrad" could not be sourced.

## 2. Ownership

- A Skyrim interior cell has an Owner NPC or an Owner Faction (one greys out the other); a faction owner can require a minimum rank [SNIPPET, https://ck.uesp.net/wiki/Interior_Cells].
- Anyone else in an owned cell is trespassing unless the cell is flagged Public Area or the owner has unlocked the load doors [SNIPPET, same URL].
- In a Public cell nobody trespasses, but objects still inherit the cell's ownership, so taking them is theft [SNIPPET, same URL]. This is how a shop works: walk in freely, everything is still the shopkeeper's.
- A faction needs "Can Be Owner" ticked before it can own a cell or container [SNIPPET, https://ck.uesp.net/wiki/Faction]. Riverwood has `TownRiverwoodFaction` and a `Riverwood Trader Faction` [SNIPPET, https://en.uesp.net/wiki/Category:Skyrim-Factions-TownRiverwoodFaction].
- Taking an owned item is theft unless you hold the faction rank or are friends with the owner [SNIPPET, https://en.uesp.net/wiki/Skyrim_Mod:Creation_Kit_Usage].
- Beds: ownership is set per bed reference (actor or faction); an inn's rented bed is a property on the innkeeper's rent-room script [SNIPPET, forum, https://forums.nexusmods.com/topic/13029867-change-bed-ownership-with-script/]. A sleep package fails if the only beds in range are owned by someone else [SNIPPET, forum, http://tesalliance.org/forums/index.php?%2Ftopic%2F8091-sky-follower-sleep-mod-help%2F=].
- Time-dependent welcome: Alvor's house is usually locked; inside after midnight "you are not welcome and may be told to leave"; keys are carried by Alvor, Sigrid and Dorthe [SNIPPET, https://en.uesp.net/wiki/Skyrim:Alvor_and_Sigrid's_House].
- KCD: areas are marked private; shops become private at night; a paid bed should not count as trespass; a short grace period lets you walk out [SNIPPET, player reports of the intended design and its bugs, https://steamcommunity.com/app/1771300/discussions/0/732500995379108424]. KCD2 trespass fines differ by place (merchant shop 15 groschen, noble's private room 30) [SNIPPET, fan guide, unverified, https://lootlore-d2ce2.web.app/en/kingdom-come-deliverance-2/mechanics/kcd2-trespassing-and-crime-guide].

## 3. Daily schedules

**Skyrim**
- Alvor: "works his forge every day between 8am and 8pm then spends an hour dining with Dorthe and Sigrid inside the house" [SNIPPET, https://en.uesp.net/wiki/Skyrim:Alvor]. Dorthe comes to the forge at 4pm to learn the trade [SNIPPET, same].
- Gerdur: "wakes up at 7am and goes to the mill", a 12-hour workday, short breaks at home, a one-hour lunch at home at noon [SNIPPET, https://en.uesp.net/wiki/Skyrim:Gerdur].
- Hod should be at the mill by 8am [SNIPPET, https://en.uesp.net/wiki/Skyrim:Hod]. Most merchants open about 8am to 8pm [SNIPPET, https://en.uesp.net/wiki/Skyrim:Merchants].
- Sunrise is always 5am and sunset 7pm [SNIPPET, https://en.uesp.net/wiki/Skyrim:Time].
- Package naming in Bethesda's tutorial is start hour x duration: "8x1" starts at 8am and lasts 1 hour [SNIPPET, https://ck.uesp.net/w/index.php?title=Bethesda_Tutorial_Packages]. Schedules are in blocks of at least one hour [SNIPPET, https://geckwiki.com/index.php?title=Sandbox_Package].
- Catch-all sandbox package: radius 1500 units, about one small interior [SNIPPET, Bethesda Tutorial Packages URL above].
- Sandbox defaults: sleep starts between 19:00 and 01:00, lasts 6 to 10 hours; a meal lasts 0.5 to 2 hours [SNIPPET, https://ck.uesp.net/wiki/Sandbox_(Procedure)].
- So a typical villager is 4 to 6 stacked packages: sleep, work, meal, evening sandbox at home or inn, with a default sandbox underneath [INFERENCE from the above].

**KCD**
- "Every NPC has a daily routine" the player can affect [SNIPPET, https://en.wikipedia.org/wiki/Kingdom_Come:_Deliverance].
- Behaviours live in the world: objects, areas and quests are made "smart" and extend the NPC's behaviour tree. A fireplace tells an NPC how to cook or eat, a bench how to sit. Scripting is behaviour-tree-like with state machines inside nodes [SNIPPET, forum repost of Warhorse Weekly Torch, https://forum.kingdomcomerpg.com/t/warhorse-studios-weekly-torch/29593/9].
- The schedule mixes a preset plan with emergent patching [SNIPPET, same].
- Routines are tied to places and keep running while the player is far away [SNIPPET, GDC abstract URL in section 1].
- After work NPCs go home or to the tavern [SNIPPET, https://rpgwatch.com/articles/kingdom-come--deliverance-gamescom-preview-342.html].
- Number of distinct behaviours [NOT FOUND].

**Witcher 3**
- No personal day cycle: "Rather than giving each a particular cycle, they made them rotate between particular activities" (chop wood, go inside to eat, walk elsewhere) [SNIPPET, gamesradar URL in section 1].
- REDkit: ActionPoints are where NPCs spawn and where their work animations are defined; spawn trees can pick different entities for day and night; NPC count must never exceed the action points that support them [SNIPPET, https://cdprojektred.atlassian.net/wiki/spaces/W3REDkit/pages/47186233/HOW-TO+Create+an+encounter+with+NPC+merchant].
- A GDC talk on the "community system" [NOT FOUND].

## 4. NPC-to-NPC conversations

- Riverwood scenes found, counted: (1) Hilde and Sven, "A dragon! I saw a dragon!", only before 8pm on the first day [SNIPPET, https://en.uesp.net/wiki/Skyrim:Sven]; (2) Hilde and Sigrid about Dorthe growing up and helping at the forge; (3) Hilde and a guard about whether Sven tried to join the war, both "at random times" [SNIPPET, https://en.uesp.net/wiki/Skyrim:Hilde]; (4) Dorthe's daily 4pm forge lesson with Alvor [SNIPPET, Alvor URL]. **4 found; the full list was not reachable**, and I recall more (Gerdur/Hod, Frodnar/Dorthe, Orgnar/Delphine) [RECALLED, not verified].
- The love triangle is seeded three ways: Sven's greeting "Some day Camilla will know of my affections", Faendal's lines, and the innkeeper: "We've got something of a love triangle here in Riverwood" [SNIPPET, https://en.uesp.net/wiki/Skyrim:Sven, https://elderscrolls.fandom.com/wiki/A_Lovely_Letter]. The losing suitor later sends hired thugs [SNIPPET, https://en.uesp.net/wiki/Skyrim_talk:A_Lovely_Letter].
- Pattern: scenes are about another named villager, never about the player or the world plot [INFERENCE].
- Witcher 3: about 45,000 recorded lines, times seven languages [SNIPPET, https://www.asoundeffect.com/the-witcher-3-sound/]. Ambient reactions are "voicesets" keyed to triggers such as rain, being bumped, Geralt approaching [SNIPPET, https://tcrf.net/The_Witcher_3:_Wild_Hunt/Dialogues_and_Chats].
- KCD chatter counts [NOT FOUND].

## 5. Dialogue structure per person (Skyrim)

- "more than 70 different actors will deliver more than 60,000 lines" [SNIPPET, https://www.nbcnews.com/news/world/skyrim-will-feature-star-studded-cast-70-actors-flna120396; also https://www.pcgamer.com/skyrim-has-60000-lines-of-dialogue-new-dragon-shouts-revealed-horses-confirmed/]. Oblivion had about 14 actors [SNIPPET, https://www.pcgamer.com/e3-2011-the-elder-scrolls-v-skyrim-has-70-voice-actors-players-free-to-explore-from-start/].
- So about 1,100 NPCs share about 70 voices: roughly 16 NPCs per actor [INFERENCE].
- Generic lines are recorded per voice type, not per person: greetings, services, reactions [SNIPPET, https://en.uesp.net/wiki/Skyrim:Generic_Dialogue].
- Innkeepers: one quest (`WITavern`) holds generic dialogue recorded for every innkeeper voice type plus unique per-person lines [SNIPPET, https://en.uesp.net/wiki/Skyrim:Kleppr].
- Layering for a minor villager: shared voice-type lines, a handful of unique greetings that name a relationship or a grievance, one or two topics, sometimes one favour quest (Hod: chop wood) [INFERENCE from Sven, Hilde, Hod pages above].
- Count of voice types and unique-line count for a minor NPC [NOT FOUND]. [RECALLED, not verified]: a minor villager has on the order of 5 to 15 unique lines.

## 6. Kit-based architecture (Burgess and Purkeypile, GDC 2013)

- Skyrim: "2 Kit Artists, 8 Level Designers, 7 Kits, 400+ Unique Cells, 30 Months" [SNIPPET, slides, https://www.slideshare.net/JoelBurgess/gdc2013-kit-buildingfinal]. Transcript: http://blog.joelburgess.com/2013/04/skyrims-modular-level-design-gdc-2013.html.
- Each kit had 50+ pieces [SNIPPET, secondary, https://gamesoftaste.blogspot.com/2013/04/gdc-20-aaa-level-design-in-day-22.html].
- Kit: "A contextual system snapped to grids that is more than a sum of its parts" [SNIPPET, secondary, same].
- Footprint: "a 3D bounding box that every kit piece must fit into"; designers snap at half the footprint [SNIPPET, https://book.leveldesignbook.com/process/blockout/metrics/modular].
- The cost: a kit "will always feel like a kit" [SNIPPET, transcript URL]. If "things are always at 90 degree angles, the player will sense the system and art fatigue can set in" [SNIPPET, transcript URL].
- Remedies named: kit-bash pieces from different kits in unintended combinations; "Repeated detail elements bother players. Repeated architecture is more forgivable" [SNIPPET, secondary notes, gamesoftaste URL].
- A kit change has "wide effects across the instances" [SNIPPET, transcript URL].
- How Whiterun and Riften house variants differ [NOT FOUND].

## 7. Interior versus exterior

- Skyrim interiors are separate cells behind load doors; modders document the "bigger on the inside" effect [SNIPPET, https://duathfel.wordpress.com/2017/08/25/behind-the-scenes/]. A developer statement of why [NOT FOUND]; forum explanations (first-person camera room, fewer active NPCs, parallel teams) are speculation [SNIPPET, https://www.gamesas.com/exterior-interiors-mismatch-t241542-25.html].
- Witcher 3: "just going in and out of a building, there's no loading time" (Jonas Mattsson) [SNIPPET, https://www.gamespot.com/articles/the-witcher-3-is-an-open-world-with-no-loading-tim/1100-6426896/]. Not every building is enterable [SNIPPET, https://www.pcgamesn.com/the-witcher-3-wild-hunt/the-witcher-3-does-away-with-pesky-loading-screens].
- KCD seamless interiors: [RECALLED, not verified]; no source found.
- Implication: with a separate interior you may cheat scale, but door and window positions, storey count and roof shape are the things a player checks, so keep those consistent [INFERENCE]. A developer rule about window and door consistency [NOT FOUND].

## 8. Clutter and environmental storytelling

- Smith and Worch (GDC 2010): "staging player-space with environmental properties that can be interpreted as a meaningful whole" [SNIPPET, https://www.gdcvault.com/play/1012647; notes via https://www.witchboy.net/?p=621].
- "It has to be possible to miss some things to make finding them meaningful" [SNIPPET, https://niemanstoryboard.org/2011/01/14/harvey-smith-on-environmental-storytelling-and-embedding-narrative/]. Technique: "establish a discernible chain of events" [SNIPPET, https://slidetodoc.com/level-design-workshop-what-happened-here-environmental-storytelling/].
- Bethesda has a dedicated clutter group [SNIPPET, https://www.tweaktown.com/news/89740/bethesda-has-dedicated-clutter-team-that-adds-substance-and-style-to-worlds/index.html]; a set dresser first decides who lives in a place, then furnishes for their habits and hobbies [SNIPPET, https://news.xbox.com/en-us/2023/12/13/starfield-clutter-and-the-story-behind-bethesdas-love-of-junk/].
- Riverwood houses have "small vegetable gardens" [SNIPPET, fan wiki, https://uspm.fandom.com/wiki/Riverwood_(Skyrim)].

## 9. Layout and landmarks

- Whiterun, three tiers by height and class: Plains (market, shops, inns, a few homes, gates), Wind (main residential, Temple of Kynareth, Jorrvaskr, Skyforge), Cloud (Dragonsreach only) [SNIPPET, https://en.uesp.net/wiki/Skyrim:Whiterun, https://en.m.uesp.net/wiki/Lore:Whiterun].
- Riften: Plankside (market, shops, meadery, inn) separated from Dryside by a canal, with water-level entrances to a lower level holding small homes, an alchemist, Beggar's Row [SNIPPET, https://en.uesp.net/wiki/Lore:Riften, https://en.uesp.net/wiki/Skyrim:Elgrim's_Elixirs, https://en.uesp.net/wiki/Skyrim:Valindor's_House].
- Novigrad: "none of the houses have been placed procedurally ... carefully planned ... from the rough districts to individual pathways in between (or through) houses" [SNIPPET, https://wccftech.com/the-witcher-3-dev-answers-questions-level-design/].
- Novigrad read through Lynch's five elements: winding paths, edges between districts, a marketplace node in almost every district; "landmarks lend importance to nodes, but nodes give meaning to landmarks" [SNIPPET, critic's analysis, not a CDPR statement, https://unwinnable.com/2019/08/12/planning-novigrad/]. Architecture based on Gdansk [SNIPPET, https://thirdeyetraveller.com/gdansk-in-the-witcher-free-city-of-novigrad/].
- Witcher 3: "the quest content dictated the size of the world, not the other way around" (Miles Tost) [SNIPPET, https://kotaku.com/how-the-witcher-3s-developers-ensured-their-open-world-1735034176]. The "40 second rule" was tested on footage and found real but playstyle-dependent [SNIPPET, https://uu.diva-portal.org/smash/get/diva2:1569059/FULLTEXT01.pdf].
- KCD: started from satellite maps, digitally rebuilt period buildings, then "massaged the geography"; settlements pulled closer, forests shrunk [SNIPPET, https://www.pcgamesn.com/kingdom-come-deliverance/kingdom-come-deliverance-historical-accuracy]. Sasau was shrunk and moved about 2.5 km south [SNIPPET, http://english.edgeoftheworld.cz/2018/02/23/kingdom-come-deliverance-map-compare/]. Full-time historian [SNIPPET, same pcgamesn URL].
- Kuttenberg: "avenues with almost wide streets and city blocks - it's not like a maze" [SNIPPET, deepsilver URL in section 1].
- Lynch tested on open-world games: only 2 of 5 elements clearly confirmed; paths matter less without street names; a new category emerged, "characters" [SNIPPET, https://cs.wellesley.edu/~pmwh/mvmap/papers/open_world_elements/open_world_elements.html].

## 10. Vegetation in settlements

- Witcher 3: terrain textures painted by hand, foliage placed by hand, only a base grass layer generated from terrain type [SNIPPET, https://www.dualshockers.com/the-witcher-3-dev-explains-how-the-games-enormous-world-was-created-and-destructible-environments/].
- Witcher 3 uses SpeedTree; small and mid trees procedural, large landmark trees such as oaks hand-edited [SNIPPET, https://store.speedtree.com/?p=2530].
- Skyrim does not use SpeedTree [SNIPPET, forum only, https://forum.openmw.org/viewtopic.php?p=49679].
- KCD kitchen gardens, orchards, fences, field counts, tree tool [NOT FOUND]. [RECALLED, not verified]: KCD villages sit inside a ring of wattle-fenced garden plots, orchards, then strip fields, then forest.

## 11. Documented rules and passes

- Bethesda level passes: Pass 0 planning (one-page pitch, "Focus on One Unique Thing", asset request list), then concept, layout, gameplay as structural passes, then "Beauty Passes: Lighting, Clutter, Effects, Sound" done by artists with the designer hands-off, then polish [SNIPPET, https://media.gdcvault.com/GDC2014/Presentations/Burgess_Joel_How_We_Used.pdf, http://blog.joelburgess.com/2014/07/gdc-2014-transcript-iterative-level.html].
- Polish is "as many passes as can possibly be fit into the schedule" [SNIPPET, https://www.escapistmagazine.com/getting-past-the-ship-with-shame-stage-at-bethesda/].
- CDPR: never more NPCs than action points [SNIPPET, REDkit URL, section 3].
- Warhorse: set scripting limits early; measure NPC visibility in a white box before building [SNIPPET, section 1 URLs].
- "Every NPC has a bed" and "every house has an owner" as a written Bethesda rule [NOT FOUND]. Riverwood obeys both in practice [INFERENCE from section 1].

---

## 20 methods that transfer to a 25-building village

1. **Name everyone; no anonymous villagers.** Riverwood: 16 named, 0 generic besides guards (s1).
2. **Aim for about 2.5 to 3 named people per enterable building.** 25 buildings gives about 60 to 70 people at Riverwood's ratio; a smaller cast means some buildings must be workshops or stores, not homes (s1) [INFERENCE].
3. **List residents per building as the master table**, as UESP's Riverwood page does. If a person has no building, or a house no person, it is a bug (s1).
4. **One owner per interior (person or household faction); shops are public but owned.** Free to enter, theft to take (s2).
5. **Welcome depends on the hour:** locked and unwelcome after midnight, family carry the key (s2).
6. **One owned bed per resident;** a sleep routine that finds no bed it owns fails (s2).
7. **Schedules as hour blocks in "start x duration" form,** minimum one hour (s3).
8. **Give everyone the same skeleton:** wake 7, work 8 to 20, one-hour meal at home with family, evening sandbox, sleep 6 to 10 hours starting between 19:00 and 01:00 (s3: Alvor, Gerdur, sandbox defaults).
9. **A fallback "sandbox near home" routine of about one room's radius** under every schedule so nobody ever stands idle (s3).
10. **Put behaviours in the objects** (bench, hearth, anvil), not in the person (s3, Warhorse).
11. **Provide about four activity spots per person present** so spots are never contested: 50 sailors, 200 spots (s1, s3).
12. **Tie one child or apprentice to an adult's workplace at a fixed hour** (Dorthe at the forge at 4pm): one cheap line reads as family life (s3).
13. **Write 3 to 5 two-person scenes whose subject is a third villager,** some one-off and time-limited, some random (s4).
14. **Seed one local tension from three mouths:** both parties plus the innkeeper (s4).
15. **Dialogue in layers:** shared lines per voice type, then a few unique greetings per person, then at most one favour (s5). About 16 characters per voice was acceptable in Skyrim.
16. **Build from a small kit on a footprint grid, then break it:** kit-bash, rotate off 90 degrees, and vary detail before structure, since repeated detail is what players notice (s6).
17. **Dress each interior from a written answer to "who lives here and what do they do in the evening"** before placing anything; leave some things missable (s8).
18. **Organise by height and trade:** market and gate low, homes in the middle, one landmark alone on top; add a second level reached by water or steps (s9, Whiterun and Riften).
19. **Give every cluster its own small gathering node next to a landmark** (well, shrine, cross): node and landmark reinforce each other (s9).
20. **Work in ordered passes with one unique thing per building,** clutter and lighting last, and count visible NPCs from each vantage point in a blockout first (s11, s1).
