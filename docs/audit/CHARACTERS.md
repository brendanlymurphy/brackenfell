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
