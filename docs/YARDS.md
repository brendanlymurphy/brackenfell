# Yards against households (for the town worker)

From the build session after the cast went in (Build 81). The yards of `73m_plots.js` were given their trades before the people
existed; `docs/PEOPLE.md` now says who lives and works in each house. Where the two disagree the yard tells the wrong story. People
have been sent to the nearest yard that fits (`77e_households.js`: `CAST_OUT`, `CAST_TASK`), which is a patch, not an answer.

## Yards of houses that have people: trade does not fit

| Yard | Its trade now | Who is there (PEOPLE.md) | What it should show |
|---|---|---|---|
| `in.40` Scribe's House | forge | Emmet Sele, scribe and schoolmaster; Lettice | a slate, a bench for the children; no forge |
| `draper` Lindqvist's | cooper | Anselm and Sabina, drapers | tenter frame, cloth airing |
| `in.13` Tanner's House | woodyard | Fulk and Giles Varrow, tanners | pits, hides on frames (bark is right, as a stack beside them) |
| `in.33` Merchant's House | hives | Gilbert and Elinor Thorne | mounting block, a cart; the hives belong to Tamsin |
| `in.12` Hobb's Cottage | garden | Idony Hobb, "keeps hens" | hens (she is sent to `in.47`'s hen run) |
| `in.15` Thorne's Store | hens | Simon Thorne, grocer | sacks, scales, a handcart |
| `in.65` The Ropewalk | garden | Ulric Ferrin, ropemaker | the long walk and the wheel |
| `in.10` Baker's House | pigs | Godwin, Avice, Tilly Hobb | oven wood, bread racks (a pig is possible, but it is not the tell) |
| `shop.n2` The Apothecary | hens | Alaric Mossop | a herb bed, jars |
| `shop.n3` The Cutler's | garden | Roger Hask | the grinding wheel |
| `shop.s2` The Tinker's Stall | pigs | Diggory Pike | kettles, a grindstone |
| `in.02` Cooper's House | washing | Laurence, Felice, Joyce Byrd, coopers | staves, hoops, half-made casks |
| `in.08` Alder House | washing | Hugh and Gillian Alder (fletcher) | arrow shafts seasoning, a goose or two |
| `in.07` The Pottery | woodyard | Beatrix Ferrin, potter | kiln and drying boards (the wood stack can stay) |

Fits, or near enough: `in.45` Tinker's House (hens), `in.75` Ferrin's House (hens).

## People whose trade needs a yard and whose house has none

| Who | House | Needs | Sent to meanwhile |
|---|---|---|---|
| Tamsin Ashdown, beekeeper | `in.82` | hives | `in.32`, `in.89`, `in.48` (three hive yards behind shells) |
| Wilmot and Tom Arden, dyers | `in.21` | vats, racks | `in.42` (the dye yard is behind a shell, across the town from her house) |
| Ysolt Pell, laundress | `in.94` | wash lines | the gallery stair (the two washing yards are the Cooper's and the Alders') |
| Jasper Holt, woodcutter | `in.90` | cordwood, axe block | `in.11`, `in.46` |
| Warin Shaw and Davy Pell, shepherds | `in.93` | fold, fleeces; a pasture west of the gate | the gate and Wren's yard (there is no pasture place) |
| Hugh Alder | `in.04` Fletcher's House | the butts (scene 7 waits for them) | none |

## Yards behind houses nobody lives in (shells)

`in.18` garden, `in.48` hives, `in.11` woodyard, `in.47` hens, `in.41` garden, `in.32` hives, `in.46` woodyard, `in.88` woodyard,
`in.89` hives, `in.81` garden, `in.42` dyer, `in.06` hens: twelve yards with a trade and no household. Either the yard moves to the
house of the person who has that trade, or the shell goes (BLUEPRINT: no fake buildings).
