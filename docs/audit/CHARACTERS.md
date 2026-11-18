# Characters and held things at 1 m (Build 77)

Every villager photographed from about 1.1 m: once at 11:00 doing what their day says (80 pictures), and up to three people for
each other animation in anyone's day (18 pictures). Script: `test/audit/chars.js`; data `shots/audit/chars.json` (not committed).
Sheets: `chars_day_1.jpg`, `chars_day_2.jpg` (the 80), `chars_anims.jpg`, and nine enlarged in `chars_closeups.jpg`.

How far to trust it. Counts from data (props, animations, people standing in each other, body models) are exact. Everything about
how a body, a garment or a prop looks is judged by eye from 480 x 300 pictures; I enlarged nine. Of the 98 pictures about 62 show
the person clearly; in 11 the camera landed in a wall or the person was walking away, and the 3 sleeping pictures are black (night,
no light) so beds and lying poses were **not assessed**. Nothing was seen in motion: no walk cycle, no lip sync, no blink.

## Counts

| | |
|---|---|
| Villagers | 80 |
| Body models among them | 10 for the 63 residents and regulars (the same male body 10 times, three others 7 or 8 times); the 17 story people have their own |
| People with a held prop | 6: Hale and Ivo (spear), Brandt (hammer), Finn (rod), Lark (lute), Rowan (staff) |
| People whose day has "sweep" / with a broom in any picture | 57 / 0 |
| People whose day has "work" / with a tool in any picture | 41 / 0 |
| Pairs of people within 0.45 m of each other, over 24 hourly checks | 9, all Tobin walking through a Hart regular (Nell Marsh 5 times, Tilda Fenn 2, Piers Ashby 2) |
| Residents standing within arm's reach of their partner in the same spot at 11:00 | 1 seen (`in.77`: the camera is inside the second person's head) |

## Findings

| # | Sev | Finding | Who | Picture | Expected | What is there | Fix |
|---|---|---|---|---|---|---|---|
| C01 | S1 | **Clothes break up.** | at least 5 with large white shards: `r2_in12`, `r_in20`, `r_in51`, `r_in94`, Marta at work; about 30 of the 63 residents wear the same pale sleeveless coat that shows as ragged patches with holes | `chars_closeups.jpg` (top row), `chars_day_2.jpg` | A coat is a coat. | Triangles of the over-garment fly out as white spikes a metre long when the person sits or bends; standing, the coat is a scatter of pale patches over the dark shirt. Three people show it pink and green. This is the worst thing a player sees when they walk up to anyone. | The `w_*` wardrobe parts on the generated bodies: check their skin weights and the colour slot; until fixed, do not dress residents in that part. A test exists in spirit: any garment vertex further than 0.5 m from the body's bones is a failure. |
| C02 | S1 | **Everybody is the same person.** | the 63 | `chars_day_1.jpg` (rows 3 to 5), `chars_day_2.jpg` | 60 faces you could tell apart. | 10 bodies; nearly every resident has the same grey skull cap and the same coat, differing in tint. Owner: "duplicated characters". | The cast in `docs/PEOPLE.md` gives each person an age and a trade; dress and hair from that. At least hat, hair and one garment different for any two people who meet. |
| C03 | S1 | **Work is mime.** | 57 sweepers, 41 workers | `chars_closeups.jpg` (middle: Agnes at Highfold bent over empty hands), `chars_anims.jpg` | A broom, a ladle, a needle, an awl. | No tool in any hand except the six listed. Sweeping without a broom is the most common action in the town. | A prop per work animation, from the trade (the hand-prop system exists: `77d_handprops.js`). |
| C04 | S2 | **The lute is a brown lump.** Owner: `brandt_hammer.png` is the same kind of fault. | Lark | `chars_closeups.jpg` (middle left) | A lute held to the body. | A flattened brown egg on a stick, held out flat like a tray. | Model it or use a kit instrument; the hold needs a pose. |
| C05 | S2 | **Brandt's hammer.** | Brandt | `chars_closeups.jpg` (middle right) | A smith's hammer in a fist, striking an anvil. | In this picture his hands meet in front of him round something the size of a peg; in the owner's picture the hammer is a grey box as long as his arm floating beside an open hand. Two different wrong sizes means the prop is scaled by the pose it is attached in. | One hammer, in the hand bone's space, at one size. |
| C06 | S2 | **The rod goes through Finn.** | Finn | `chars_closeups.jpg` (bottom middle) | | The fishing rod crosses his chest and passes through his forearm. | Hold it in both hands or rest it on the dock. |
| C07 | S2 | **People stand in each other.** Owner: `two_people_in_one.png`. | Tobin and the Hart regulars (9 hourly hits); the couple in `in.77` | `chars_closeups.jpg` (top right) | | Build 77's separation rule moves a walker off a body within 0.6 m; standing spots for couples at home are still the same spot. | Spots for two; Tobin's round should not pass through the regulars' places. |
| C08 | S3 | **Hale wears his helmet and spear at table.** | Hale at the Hart | `chars_closeups.jpg` (bottom left) | Off duty, the kettle hat is on the bench. | Helmet on, spear on his back, at supper. | Hat and spear off by schedule row. |
| C09 | S3 | **Seated poses.** | 15 sitting at 11:00 | `chars_day_1.jpg`, `chars_day_2.jpg` | | Those I could see sit at the right height behind their tables; several lean with elbows on nothing. Not measured. | Needs a side-on picture per seat; not done. |

## Not found, not checked

- No face with eyes or mouth visibly broken in the nine enlargements. The owner's `leofric_no_lines.png` shows hands raised in
  front of a face in the talk pose: I did not reproduce a talk pose (63 people have no talk).
- The pig and other animals (owner: `pig_blob.png`) are not villagers and are not in this pass.
- Lying poses and beds: pictures black. To do with a lamp-lit hour or the test light.
- Hands: fingers and grips need closer than 1 m and a prop to hold; with 6 props in the town there is little to check.

## Second pass: lying, talking, seated side-on, animals, bystanders (`test/audit/poses_props.js`, sheet `chars_poses.jpg`)

41 pictures at 640 x 400. Honest result: this pass answered less than it was meant to.

| Asked | Result |
|---|---|
| Lying poses with a test light | **Still not assessed.** The only light a test can change is the hour, and setting the hour to 13 for the picture sends the sleepers back to their day: all six beds are empty in the pictures. It needs a hook in the game: a test flag that lights a cell without moving the clock (for the lighting owner; one line in `Cells.env`). |
| Talk poses | **Not assessed.** On `startTalk` the person turns to the player, who is not where the camera is, so five of six pictures show a back. Maren, seen from the side, gestures with both hands at chest height and nothing passes through her face. The owner's `leofric_no_lines.png` (hands in front of the face) is not reproduced or ruled out. It needs the camera placed where the player stands. |
| Seated, side-on | 6 pictures. Maren sits square on her bench at the right height. Osric "sits" bent double over the mill table. **Tobin "sits" on the cobbles in the middle of the street in a running crouch** at 20:30 (his row says sit at home; he has no seat there). Marta's picture shows only her back. |
| Things in hands at the Hart | Greta holds a pale cylinder (a mug with no handle or rim) in each hand. **Brandt, Marta and Greta each have a small white rectangle and a grey block hanging at the apron front**, which reads as a stray label; it is a wardrobe part (pouch or tag) drawn flat and unshaded. |
| Hens | 8 in the game; the one photographed is a proper modelled hen. Fine. |
| Sheep | 6 in the west close. **White rounded boxes on four dark pegs with a grey cube for a head** (`chars_poses.jpg`, sheep_close2). They are built from two ellipsoids and a box in `73m_plots.js`. S2: this is the "pig blob" of the owner's picture, in wool. |
| Pigs | 4 in the south close, the same construction in pink. My camera stood in the hedge both times; the owner's `pig_blob.png` is the evidence. |
| Passers-by | 6 exist at the time of the pictures; the camera found none of them (they have a position but the pictures show a door). Not assessed. |
| People of the wilds | 6 exist; the one photographed (west of the town) is a full body with a face, like a villager. The other five were not reached. |

Fix for the animals: a modelled sheep and pig (CC0 kits have both) or none. A farm close with no animals is better than one with boxes.

## Third pass on Build 81: lying and talking (`test/audit/poses2.js`, sheet `chars_lie_talk.jpg`)

No new hook was needed: `--opt cellnight=10` (already in `56_cells.js`) lights a cell at night without moving the clock. For talk,
the player is put 1.15 m in front of the person and the picture is the player's own view.

**Lying (75 of 77 asleep at 02:30; 15 photographed).**

| # | Sev | Finding | Seen in |
|---|---|---|---|
| L1 | S1 | **Everyone sleeps on top of the made bed, fully dressed, hat on.** Bram in his straw hat, Hale in his helmet. No blanket covers anyone. | all 15 |
| L2 | S1 | **One arm sticks straight up in the air.** | 9 of 15 (Aldous, Bram, Giles, Jasper, Lark, Roger, Simon, Tom, Hale) |
| L3 | S1 | **The over-garment stands up from the body as a pale spike as tall as the room** (C01, lying). | 4 of 15 (Avice, Ellen, Gillian, Hester) |
| L4 | S2 | Lark sleeps on a table with a candle and a paper on it (`inn.bed3` is a table). Hale's bed has no mattress. | 2 |
| L5 | fine | Nobody shares a spot: 0 pairs of sleepers within 0.9 m. Everyone is 0.56 m above the floor. | data, all 75 |
| L6 | S2 | A sleeper can be talked to and answers with the day greeting, lying down (Godwin). | 1 tried |

**Talking (12 people).**

| # | Sev | Finding | Seen in |
|---|---|---|---|
| T1 | fine | No hands in front of the face in any of the 12; the owner's picture was not reproduced. Brandt now holds a recognisable hammer at his shoulder. | 12 |
| T2 | S2 | **Standing where the talk prompt works puts the player's eye inside something** for Greta and Marta: the top half of the view is the underside of a hanging shade or shelf over the counter. | 2 |
| T3 | S2 | Rowan on his bench: the oak's trunk fills the middle of the view from in front of him. | 1 |
| T4 | S2 | Seated and short speakers (Lambert, Maren, Tilly, Sabina) are at the bottom third of the picture with the subtitle and four option buttons over them; the face is under the text. | 4 |
| T5 | fine | The new people have the three questions (who are you, who lives round here, what should a stranger know) and their greeting shows. | 5 new people tried |
