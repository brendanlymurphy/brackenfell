# The first minutes as a new player (Build 81, the live build)

Played by input from the title screen: W and a look delta each frame, the E key and clicks as real events
(`test/audit/firstten.mjs`; timeline in `shots/audit/firstten.json`, not committed). Phone-landscape window, 844 x 390, Medium.
Pictures: `firstten_1.jpg` (1 to 15), `firstten_2.jpg` (16 to 29); numbers below are the picture numbers.

What this is not: a person playing. The bot walks the villagers' own graph, so it does not get lost, miss a door or fight the
controls; it looked at 29 moments, not at motion; it heard nothing. It covered the route gate, street, square, inn, one house,
wharf in **172 seconds of play**, so "ten minutes" is really the first three. It failed to talk to three people (below), which
I report as the bot's failures unless the picture shows otherwise.

## What breaks belief, in the order met

| # | When | Pic | What a new player meets | Sev |
|---|---|---|---|---|
| 1 | 0 s | 2 to 5 | **You start inside a hedge.** The first view is half leaves; turning round, three of the four directions are leaves at arm's length. The town is visible down the road through a gap. | S1 |
| 2 | 0 s | 2 | **A sword is drawn across the screen** from the first second, in "a highland village to wander". It stays there in every outdoor picture and in conversation (20). | S2 |
| 3 | 11 s | 6 to 8 | Hale: works. The prompt, the two lines and the quest text are clear, and the line was voiced. His spear shaft crosses the picture and the kettle hat's brim hides his eyes at this distance. | fine |
| 4 | 15 s | 9, 10 | **The first house inside the gate does not open.** `in.39`, five steps from Hale: a dark plank wall, a black door, a black window. Looking at it gives no prompt; E does nothing; nothing says why. The first thing a new player tries after the gate teaches them that doors are scenery. | S1 |
| 5 | 15 s | 9 | The quest text and a second quest banner cover the top left of the view while you look at that door: three text blocks on a phone screen. | S3 |
| 6 | 25 to 40 s | 11, 12 | The main street and the stalls read well: people, awnings, a bell tower ahead. This is the best the game looks. | fine |
| 7 | 40 s | 12, 13, 16 | **A woman in a dress of pink, green and purple patches** stands at the stalls: the broken garment colours of `CHARACTERS.md` C01, seen from 20 m in the square. | S2 |
| 8 | 49 s | 13 | The first villager I walked up to (Avice Hobb) walked on; no prompt came. Bot failure, or she cannot be stopped while walking: not decided. | ? |
| 9 | 59 s | 14, 15 | The square: 3 to 6 people in view at 09:00, one standing idle. A "Read" prompt for the notice board from several metres. Good. | fine |
| 10 | 64 s | 17 | **At the inn door four texts are on screen at once:** the quest list, "DISCOVERED: The Hart's Gallery" across the door, the Enter button and a tutorial tip. | S3 |
| 11 | 66 s | 18 | Entering: the screen is black for about two seconds. Acceptable as a fade; long on a slow phone. | S3 |
| 12 | 80 s | 19 to 22 | **The Hart at nine in the morning: Greta and Lark, nobody else, and Greta appears to stand in the fireplace** (her figure is framed by the hearth opening, lit from behind, in all four pictures). The owner asked for "taverns full of people"; the regulars come at 19:00, about nine minutes of play away. | S2 |
| 13 | 80 s | 19 | I could not reach Greta: stopped 5.3 m short among the tables. The quest sends every new player to her. Not decided whether a person would also snag. | ? |
| 14 | 81 s | 20 to 22 | **Talking to Lark: his head is at the bottom edge of the screen and the subtitle runs across his chin; his eyes look shut.** He is seated and the camera stays at standing height. Voiced. | S2 |
| 15 | 99 s | 23 to 25 | **Walked into the baker's house. Nothing.** Black for two seconds, then an empty bakehouse with bread on every shelf. Nobody challenges, nobody greets. Godwin is upstairs (he bakes at night); Avice was out. | S1 |
| 16 | 143 to 156 s | 26, 27 | Wharf Street: dark plank shells on both sides, one person in the whole street. | S2 |
| 17 | 171 s | 28, 29 | **The dead man: a small bier alone in the middle of an empty cobbled circle.** Nobody stands by it. No crowd, no guard, no Finn; Peter Marsh idles 8 m away. This is the hook of the main story. The bot stopped 6 m short and E did nothing from there. | S1 |

Also, from the timeline rather than a picture: **the clock ran from 07:55 to 11:20 in 172 seconds.** A day is 20 minutes
(`Env.dayLength` 1200). A new player who talks to four people and reads a notice has used the morning; the Hart fills and empties
in under three minutes; "come back tomorrow" is a twenty-minute wait or a bed.

## The five to fix first

1. Start the player on the road, facing the gate, hands empty (1, 2).
2. No dead door within sight of the gate; `in.39` is the worst-placed shell in the town (4).
3. Something happens when you walk into a house: the "in my house at night" lines exist in the cast; a daytime "can I help you?" from whoever is home, or a note on the counter if nobody is (15).
4. Stage the body: Finn beside it, two onlookers, Hale's man keeping them back, for the first day (17).
5. Seat the camera for seated speakers and put Greta at her bar (12, 14).

## Not verified

Whether a person would get stuck where the bot did (8, 13, 17). Anything in motion or audible. Frame rate. Touch controls:
the bot used keys and a mouse on a touch-sized window, so the on-screen sticks were drawn and never used.
