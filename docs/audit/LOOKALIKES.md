# Look-alikes: people who can be seen together and cannot be told apart (Build 89)

For the characters session. `test/audit/lookalikes.js` reads how the game dresses each of the 77 villagers (body model, skin, hair, hair
style, hat, garment colours, the per-garment tint) and where each stands at every hour from 06 to 22; `lookalikes.py` lists every pair with the
same body model who stand within 25 m of each other in the same place at some hour, ranked by how little else differs. Pictures:
`lookalikes_b89.jpg` (`lookalike_shots.js`, each person of the 14 most alike pairs, face-on at an hour they are together). Build 89, built from
`origin/main`. Headless.

## Counts

| | |
|---|---|
| Body models for 77 people | 17; the commonest carry 9 (`m_farmer`), 7 (`f_maid`, `m_fisher`, `m_elder`, `m_hunter`, `f_weaver`), 6 (`f_farmer`) people |
| Pairs with the same body who are within 25 m of each other in the same place at some hour | **48** |
| ... of which nothing differs but the shade of the clothes (no skin, hair, hair style or hat difference) | 1 (Miles Ashdown and Peter Marsh, together in the Hart 20:00 to 22:00, 2.3 m apart) |
| ... of which only one of skin, hair or hat differs | 13 |
| Garment colour fields (`top`, `legs`, worn-part colours) | the same for every one of the 60 new people: only the per-garment tint differs |

## What the pictures show

The camera placed itself badly for most people standing behind stalls or counters (it stood on the far side); three things are clear:

- **Ned Thorne and Tom Arden at school** (`lookalikes_b89.jpg`, row 2, right): side by side at the same table in the Scribe's House, the same
  face, the same white cap, the same tunic. The data says their skin differs; in the picture it does not show. Will Marsh, the third boy on
  the same bench, is the same body again. Three of the four schoolchildren are one boy.
- **Emmet Sele and Odo Hask** (row 4, second): two old men in the same pale robe crossing the square together; not told apart at 10 m.
- **Amice Ferrin's clothes break up**: the close picture (row 6, first) is a wall of red cloth shards with a white fringe: the garment fault of
  `CHARACTERS.md` C01, on a child.
- Jasper Holt is shown three times because he is in three pairs; Gilbert, Ulric and Laurence, his pair-mates on the same `m_farmer` body, were
  missed by the camera.

## The 30 most alike pairs

| A | B | Body | What differs besides tint | Tint difference (0 = same) | Hours together | Where and how far apart |
|---|---|---|---|---|---|---|
| Miles Ashdown | Peter Marsh | `m_fisher` | nothing | 0.97 | 2 | 20:00 inn 2.3 m, 21:00 inn 2.3 m |
| Winifred Varrow | Ursel Crane | `f_weaver` | skin | 0.45 | 1 | 10:00 out 7.6 m |
| Gilbert Thorne | Jasper Holt | `m_farmer` | skin | 0.77 | 5 | 13:00 out 6.8 m, 14:00 out 6.8 m |
| Ned Thorne | Tom Arden | `m_boy` | skin | 0.77 | 5 | 9:00 in.40 0.7 m, 10:00 in.40 0.7 m |
| Godwin Hobb | Silas Garrow | `m_hunter` | skin | 0.77 | 1 | 16:00 out 24.6 m |
| Elinor Thorne | Alison Pike | `f_herbalist` | hair | 0.77 | 1 | 10:00 out 9.1 m |
| Emmet Sele | Odo Hask | `m_elder` | hair | 0.9 | 1 | 10:00 out 25.0 m |
| Petronel Vey | Basilia Wold | `f_elder` | skin | 0.94 | 1 | 10:00 out 18.1 m |
| Beatrix Ferrin | Ursel Crane | `f_weaver` | skin | 0.94 | 1 | 10:00 out 23.5 m |
| Ulric Ferrin | Jasper Holt | `m_farmer` | skin | 0.97 | 1 | 10:00 out 19.1 m |
| Amice Ferrin | Lettice Sele | `f_child` | hair | 1.35 | 6 | 9:00 in.40 1.5 m, 10:00 in.40 1.5 m |
| Jasper Holt | Laurence Byrd | `m_farmer` | hair | 1.24 | 3 | 17:00 out 20.7 m, 20:00 inn 3.2 m |
| Beatrix Ferrin | Winifred Varrow | `f_weaver` | skin | 1.17 | 1 | 10:00 out 17.2 m |
| Alison Pike | Ellen Marsh | `f_herbalist` | skin | 1.33 | 1 | 10:00 out 23.3 m |
| Diggory Pike | Silas Garrow | `m_hunter` | skin, hair | 0.27 | 3 | 19:00 inn 5.8 m, 20:00 inn 5.8 m |
| Avice Hobb | Hester Slate | `f_weaver` | skin, hair | 0.27 | 1 | 10:00 out 0.9 m |
| Ned Thorne | Will Marsh | `m_boy` | skin, hair | 0.45 | 4 | 9:00 in.40 1.4 m, 10:00 in.40 1.4 m |
| Laurence Byrd | Humphrey Slate | `m_farmer` | skin, hair | 0.6 | 3 | 19:00 inn 1.0 m, 20:00 inn 1.0 m |
| Gilbert Thorne | Laurence Byrd | `m_farmer` | skin, hair | 0.6 | 1 | 17:00 out 14.4 m |
| Tilly Hobb | Bridget Malkin | `f_maid` | skin, hair | 0.77 | 1 | 10:00 out 1.5 m |
| Will Marsh | Tom Arden | `m_boy` | skin, hair | 0.87 | 3 | 9:00 in.40 1.6 m, 10:00 in.40 1.6 m |
| Roger Hask | Barnaby Crane | `m_hunter` | skin, hair | 0.94 | 1 | 10:00 out 24.7 m |
| Anselm Lindqvist | Odo Hask | `m_elder` | skin, hair | 0.97 | 1 | 16:00 out 4.0 m |
| Avice Hobb | Gillian Alder | `f_weaver` | skin, hair | 1.17 | 4 | 14:00 out 12.0 m, 15:00 out 12.0 m |
| Jocelyn Lindqvist | Miles Ashdown | `m_fisher` | skin, hair | 1.17 | 3 | 19:00 inn 7.4 m, 20:00 inn 7.4 m |
| Jocelyn Lindqvist | Peter Marsh | `m_fisher` | skin, hair | 1.17 | 2 | 20:00 inn 9.0 m, 21:00 inn 9.0 m |
| Jasper Holt | Humphrey Slate | `m_farmer` | skin, hair | 1.24 | 2 | 20:00 inn 3.4 m, 21:00 inn 3.4 m |
| Hugh Alder | Tybalt Varrow | `m_farmer` | skin, hair | 1.24 | 1 | 15:00 out 0.8 m |
| Fulk Varrow | Humphrey Slate | `m_farmer` | skin, hair | 1.33 | 1 | 16:00 out 2.4 m |
| Tobin | Ned Thorne | `m_boy` | skin, hair | 1.0 | 2 | 16:00 out 0.8 m, 17:00 out 0.8 m |

Fix: within any household, school bench or evening table, no two people on the same body unless hair, hat and one garment differ; the cast table
(`docs/PEOPLE.md`) gives ages and trades to dress from. Not checked: faces up close, and whether "skin" as the data has it shows on the body at all
(Ned and Tom suggest it may not).
