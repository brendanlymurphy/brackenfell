# Every building: who lives there, what do they do, how can you tell from outside

Made by `python3 test/audit/buildings.py` from the world dump. "Sign" = a kit sign or banner piece within 2.5 m of the walls (generated signs that are not kit pieces are not counted, so 0 means "none found", to be checked by eye). Trade is the interior plan's `fam.trade`.

## A. The 57 enterable buildings, outside against inside

| id | name | x, z | lives there | trade | sign | outside w x d | inside W x D | area x | storeys out / in | cellar | windows out / in | balcony out |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `inn` | The Honeyed Hart | 0, -22 | Greta Barleybrook, Lark | (designed) | 1 | 15x9.6 | 14x13 | **1.3** | 1 / 2 | yes | 6 / 28 |  |
| `smithy` | Brandt’s Forge | -23, -13 | Brandt Ironhand | (designed) | 1 | 9.5x7 | 14x12 | **2.5** | 1 / 2 |  | 4 / 19 |  |
| `store` | Quill’s Sundries | 23, -8 | Marta Quill | (designed) | 1 | 8.4x6.6 | 14x12 | **3.0** | 2 / 2 | yes | 4 / 23 | yes |
| `elder` | Rowan’s Cottage | -18, 20 | Elder Rowan | (designed) | 1 | 7.2x5.6 | 14x14 | **4.9** | 2 / 2 | yes | 3 / 21 |  |
| `herbalist` | Maren’s Cottage | 18, 22 | Old Maren | (designed) | 1 | 6.6x5.6 | 10x11 | **3.0** | 1 / 1 |  | 2 / 10 |  |
| `guardhouse` | Warden’s Lodge | -36, -10 | Warden Hale, Guardsman Ivo | (designed) | 0 | 7.2x5.6 | 12x11 | **3.3** | 2 / 2 |  | 3 / 26 | yes |
| `weaver` | Riverside Cottage | 38, 11 | Pip, Hilda Weaver | weaver | 1 | 7.6x6 | 10x12.5 | **2.7** | 2 / 2 |  | 4 / 18 |  |
| `chapel` | Chapel of the Dawn | -6, -75 | **nobody** | (designed) | 0 | 14x8 | 14x12 | **1.5** | 1 / 1 | yes | 8 / 12 |  |
| `mill` | Dunn’s Mill | 67, 26 | Osric Dunn | miller | 0 | 7.4x6.4 | 10x12.5 | **2.6** | 2 / 2 |  | 4 / 18 |  |
| `farm` | Fairweather Farm | 98, -22 | Edda Fairweather, Bram | farmer | 0 | 8x6 | 12x13 | **3.2** | 1 / 2 |  | 3 / 23 |  |
| `hunter` | Wren’s Cabin | -72, 44 | Wren | hunter | 0 | 6.2x5.2 | 7x8 | **1.7** | 1 / 1 |  | 2 / 7 |  |
| `fisher` | Fisher’s Hut | -9, 82 | Finn Reedwater | fisher | 0 | 5.2x4.6 | 8x8 | **2.7** | 1 / 2 |  | 1 / 14 |  |
| `draper` | Lindqvist’s Draper | 32, -7 | **nobody** | draper | 0 | 6.4x5.6 | 8x12 | **2.7** | 2 / 2 | yes | 4 / 24 | yes |
| `shop.n2` | Shop | 38, -6 | Tam Apothecary | apothecary | 2 | 4x4 | 6x14 | **5.2** | 1 / 2 | yes | 0 / 22 |  |
| `shop.n3` | Shop | 43, -6 | Hob Cutler | cutler | 2 | 6x4 | 8x12 | **4.0** | 1 / 2 | yes | 0 / 24 |  |
| `shop.n4` | Shop | 48, -6 | Dunstan Grocer, Hawise Fenn | grocer | 1 | 4x4 | 8x12 | **6.0** | 1 / 2 | yes | 0 / 24 |  |
| `shop.s0` | Shop | 25, 8 | Mabel Baker | baker | 1 | 4x4 | 8x12 | **6.0** | 1 / 2 | yes | 0 / 24 |  |
| `shop.s1` | Shop | 31, 8 | Aldous Bookseller | bookseller | 2 | 6x4 | 6x14 | **3.5** | 1 / 2 | yes | 0 / 22 |  |
| `shop.s2` | Shop | 46, 9 | Maud Tinker | tinker | 1 | 6x4 | 6x14 | **3.5** | 1 / 2 | yes | 0 / 22 |  |
| `in.02` | Cooper’s House | 16, 11 | Wat Cooper, Piers Cooper | cooper | 0 | 6.4x5.2 | 10x12.5 | **3.8** | 1 / 2 |  | 4 / 20 |  |
| `in.04` | Fletcher’s House | -22, 4 | Tilda Fenn, Jory Thatcher, Leofric Fletcher | fletcher | 0 | 6.4x5.8 | 8x12.5 | **2.7** | 2 / 2 |  | 4 / 20 | yes |
| `in.07` | Potter’s House | -34, 2 | Hob the Carter, Isolde Potter | potter | 0 | 5.4x5 | 10x12.5 | **4.6** | 1 / 2 |  | 4 / 18 |  |
| `in.08` | Alder House | -28, 3 | Rosamund Thatcher | household | 0 | 5.6x6 | 8x12.5 | **3.0** | 2 / 2 |  | 4 / 20 |  |
| `in.10` | Baker’s House | -29, -9 | Wat Baker | baker | 0 | 5.4x5 | 6x14 | **3.1** | 1 / 2 | yes | 4 / 22 |  |
| `in.12` | Hobb’s Cottage | -20, -28 | Dunstan Holloway, Rosamund Holloway | household | 0 | 6x5 | 8x12 | **3.2** | 2 / 2 |  | 4 / 20 | yes |
| `in.13` | Tanner’s House | -21, -36 | Sorrel Vane | tanner | 0 | 6x5.6 | 10x12.5 | **3.7** | 1 / 2 |  | 4 / 20 |  |
| `in.15` | Grocer’s House | -6, -32 | Wat Grocer | grocer | 0 | 5.6x6 | 8x12 | **2.9** | 2 / 2 | yes | 4 / 24 |  |
| `in.20` | Chandler’s House | 7, 46 | Isolde Chandler, Piers Dunmore | chandler | 0 | 6x4.4 | 8x12 | **3.6** | 1 / 2 | yes | 4 / 24 |  |
| `in.21` | Dyer’s House | -9, 24 | Piers Ashby, Wynne Dyer | dyer | 0 | 6.4x5 | 10x12.5 | **3.9** | 2 / 2 |  | 4 / 18 | yes |
| `in.23` | Widow Hale’s House | -8, 41 | Nell Marsh | widow | 0 | 5x5 | 7x8 | **2.2** | 1 / 1 |  | 3 / 7 |  |
| `in.33` | Merchant’s House | -7, -46 | Nell Merchant | merchant | 0 | 7.6x5 | 10x12 | **3.2** | 2 / 2 | yes | 4 / 20 | yes |
| `in.34` | Wren Cottage | 9, 54 | Mabel Gale | household | 0 | 7.6x6.2 | 9x12 | **2.3** | 1 / 2 |  | 4 / 22 |  |
| `in.36` | Mason’s House | 10, 68 | Maud Mason, Rafe Ketch | mason | 0 | 7x5 | 10x12.5 | **3.6** | 2 / 2 |  | 4 / 20 | yes |
| `in.37` | Cutler’s House | -7, 53 | Aldous Cutler | cutler | 0 | 7x5.6 | 6x14 | **2.1** | 1 / 2 | yes | 4 / 22 |  |
| `in.38` | Marsh House | -3, 62 | Jory Hollin | household | 0 | 7x4.4 | 8x12.5 | **3.2** | 2 / 2 |  | 4 / 20 | yes |
| `in.40` | Scribe’s House | -49, -10 | Bess Scribe, Alder Thatcher | scribe | 0 | 5.4x4.4 | 9x12 | **4.5** | 1 / 2 |  | 4 / 22 |  |
| `in.44` | Cobbler’s House | -33, -24 | Alder Cobbler | cobbler | 0 | 5x5.2 | 8x12 | **3.7** | 2 / 2 | yes | 3 / 24 |  |
| `in.45` | Tinker’s House | -28, -44 | Ivo Tinker | tinker | 0 | 5.6x5.8 | 8x12 | **3.0** | 1 / 2 | yes | 4 / 24 |  |
| `in.51` | Basketmaker’s House | 20, 37 | Rosamund Basketmaker | basketmaker | 0 | 5x5.2 | 6x8 | **1.8** | 2 / 2 |  | 3 / 12 |  |
| `in.60` | Garrick’s House | -18, 63 | Leofric Thatcher | household | 0 | 5x5.2 | 6x8 | **1.8** | 1 / 2 |  | 3 / 12 |  |
| `in.65` | Ropemaker’s House | -51, -27 | Rafe Ropemaker | ropemaker | 0 | 5.6x4.4 | 10x12.5 | **5.1** | 2 / 2 |  | 4 / 18 |  |
| `in.66` | Saddler’s House | -41, -61 | Maud Saddler, Cuthbert Lowe | saddler | 0 | 7x4.6 | 10x12.5 | **3.9** | 1 / 2 |  | 4 / 20 |  |
| `in.67` | Bram’s House | -34, -61 | Jory Bray | household | 0 | 5.6x4.6 | 7x7 | **1.9** | 2 / 1 |  | 4 / 7 |  |
| `in.70` | Tailor’s House | -29, -54 | Cecily Tailor, Piers Lowe | tailor | 0 | 5.6x5 | 8x12 | **3.4** | 1 / 2 | yes | 4 / 24 |  |
| `in.74` | Thorne House | -32, -33 | Ivo Marsh, Tilda Marsh | household | 0 | 6.2x5 | 9x12 | **3.5** | 2 / 2 |  | 4 / 22 | yes |
| `in.75` | Ferrin’s House | -42, -26 | Leofric Ashby | household | 0 | 5.6x4.6 | 6x7 | **1.6** | 1 / 1 |  | 4 / 6 |  |
| `in.77` | Wheelwright’s House | 9, -56 | Alys Wheelwright, Rafe Gale | wheelwright | 0 | 6.2x5 | 10x12.5 | **4.0** | 2 / 2 |  | 4 / 18 | yes |
| `in.82` | Tamsin’s House | 8, -49 | Gunnora Bray | household | 0 | 5x5.4 | 8x7 | **2.1** | 1 / 1 |  | 3 / 8 |  |
| `in.90` | Woodcutter’s House | 14, -34 | Mabel Woodcutter | woodcutter | 0 | 6.2x5 | 7x8 | **1.8** | 2 / 2 |  | 4 / 13 | yes |
| `in.93` | Shepherd’s House | -56, 21 | Gunnora Shepherd | shepherd | 0 | 7x4.6 | 7x7 | **1.5** | 1 / 1 |  | 4 / 7 |  |
| `in.94` | Pell House | -49, 21 | Agnes Hollin, Ivo Hollin | household | 0 | 6.2x4.6 | 7x8.5 | **2.1** | 2 / 2 |  | 4 / 13 | yes |
| `in.111` | Butcher’s House | -22, 56 | Alder Butcher, Wynne Bray | butcher | 0 | 5x5 | 8x12 | **3.8** | 1 / 2 | yes | 3 / 24 |  |
| `in.113` | Carpenter’s House | -26, 70 | Wat Carpenter | carpenter | 0 | 7x5 | 10x12.5 | **3.6** | 2 / 2 |  | 4 / 18 | yes |
| `in.115` | Brewer’s House | -8, 70 | Agnes Brewer, Ivo Fenn | brewer | 0 | 7x5 | 12x13 | **4.5** | 1 / 2 |  | 4 / 23 |  |
| `in.116` | Glover’s House | 31, 20 | Alder Glover, Isolde Fenn | glover | 0 | 4.6x6.2 | 8x12 | **3.4** | 2 / 2 | yes | 3 / 24 |  |
| `high.a` | Highfold: the Reeve’s House | 104, 100 | Agnes Shepherd | shepherd | 0 | 6.4x5.2 | 8x8 | **1.9** | 1 / 1 |  | 3 / 8 |  |
| `high.c` | Highfold: the Shepherd’s House | 124, 113 | Cecily Woodcutter, Rafe Brook | woodcutter | 0 | 6x5 | 9x12 | **3.6** | 1 / 2 |  | 2 / 22 |  |

Ground floor inside at least twice the footprint: 47 of 57; three times: 35. Windows: 190 outside, 1067 inside. Storey count differs: 26 (outside storeys are read from the shell's `kitStyle.up`; the seven hand-designed buildings without that flag are counted as 1 and may be wrong: inn, smithy, farm, fisher).

## B. The 75 buildings that cannot be entered

Who lives there: nobody, in every row. What do they do: nothing. How can you tell from outside: you cannot; every one is called "House".

| id | x, z | w x d | floors | district tag | door faces a wall (no standing room 4 to 13 m in front) | outside stair to an upper door |
|---|---|---|---|---|---|---|
| `in.06` | -39, 2 | 4.4 x 4.4 | 2 | (none) |  |  |
| `in.11` | -18, -20 | 4.4 x 5 | 2 | merchants |  |  |
| `in.16` | -8, -39 | 4 x 5 | 2 | (none) |  |  |
| `in.18` | 5, 11 | 4.4 x 5.6 | 3 | merchants |  |  |
| `in.19` | 7, 39 | 6 x 4.4 | 2 | (none) |  |  |
| `in.24` | -7, 46 | 4.4 x 4.4 | 1 | fishers |  |  |
| `in.32` | -18, -49 | 4.4 x 4.4 | 2 | (none) |  |  |
| `in.35` | 9, 62 | 5 x 5.6 | 1 | fishers |  |  |
| `in.39` | -58, 2 | 4.4 x 5 | 1 | cottages |  |  |
| `in.41` | -43, -10 | 6.4 x 6.2 | 2 | (none) |  |  |
| `in.42` | -45, 2 | 6.4 x 5.2 | 1 | cottages | **yes** |  |
| `in.43` | -33, -17 | 5 x 4.6 | 2 | (none) | **yes** |  |
| `in.46` | -1, -38 | 4.4 x 4.6 | 2 | (none) | **yes** |  |
| `in.47` | 18, -19 | 4.4 x 4.4 | 2 | merchants |  |  |
| `in.48` | 10, 11 | 4.4 x 5.2 | 3 | merchants |  |  |
| `in.49` | 20, 30 | 4.4 x 5.2 | 1 | (none) |  |  |
| `in.50` | 13, 38 | 6.4 x 5.2 | 3 | (none) | **yes** |  |
| `in.52` | 14, 45 | 6.4 x 5.8 | 1 | fishers | **yes** |  |
| `in.53` | 21, 45 | 5.6 x 4.4 | 1 | fishers |  |  |
| `in.55` | -14, 42 | 6.4 x 4.6 | 1 | fishers | **yes** |  |
| `in.56` | 17, 53 | 5.6 x 5.8 | 1 | fishers | **yes** |  |
| `in.57` | 17, 68 | 6.4 x 4.6 | 1 | fishers | **yes** |  |
| `in.58` | -13, 55 | 4.4 x 5.8 | 1 | fishers | **yes** |  |
| `in.59` | -10, 62 | 5 x 5.2 | 1 | fishers | **yes** |  |
| `in.61` | -57, 10 | 5.6 x 5.8 | 1 | cottages |  |  |
| `in.62` | -59, -18 | 5.6 x 4.6 | 1 | cottages |  |  |
| `in.63` | -58, -25 | 4.4 x 5.2 | 1 | cottages |  |  |
| `in.64` | -51, -20 | 6.4 x 5.2 | 1 | cottages | **yes** |  |
| `in.68` | -42, -54 | 5.6 x 5 | 2 | poor |  |  |
| `in.69` | -35, -54 | 5.6 x 5 | 3 | poor |  |  |
| `in.71` | -40, -47 | 7 x 5 | 3 | poor | **yes** |  |
| `in.72` | -41, -40 | 6.2 x 5 | 3 | poor |  |  |
| `in.73` | -40, -33 | 7 x 5 | 3 | poor | **yes** | yes |
| `in.76` | -10, -20 | 5 x 4.6 | 2 | poor |  |  |
| `in.78` | 18, -56 | 4.4 x 5 | 1 | (none) |  |  |
| `in.79` | 24, -56 | 4.4 x 5 | 2 | (none) |  |  |
| `in.80` | 31, -56 | 5 x 5 | 1 | cottages |  |  |
| `in.81` | 2, -49 | 4.4 x 5.4 | 2 | (none) |  |  |
| `in.83` | 16, -49 | 5 x 5.4 | 2 | (none) |  |  |
| `in.84` | 23, -49 | 5 x 5.4 | 2 | (none) |  |  |
| `in.85` | 30, -49 | 6.2 x 5.4 | 1 | (none) |  |  |
| `in.86` | 12, -40 | 4.4 x 5.4 | 2 | (none) |  |  |
| `in.87` | 18, -41 | 5.6 x 5.4 | 1 | (none) |  |  |
| `in.88` | 24, -40 | 5 x 5.4 | 2 | (none) | **yes** |  |
| `in.89` | 34, -41 | 4.4 x 5.4 | 2 | (none) |  |  |
| `in.97` | -56, 28 | 6.2 x 5.4 | 2 | cottages | **yes** |  |
| `in.98` | -48, 28 | 7 x 5.4 | 2 | cottages |  |  |
| `in.102` | -58, 35 | 4.4 x 4.6 | 1 | cottages |  |  |
| `in.103` | -52, 35 | 6.2 x 4.6 | 1 | cottages | **yes** |  |
| `in.106` | -29, 42 | 7 x 4.6 | 1 | (none) |  |  |
| `in.107` | -21, 42 | 7 x 4.6 | 2 | (none) |  |  |
| `in.108` | -29, 48 | 7 x 5.4 | 2 | fishers | **yes** |  |
| `in.109` | -22, 48 | 5.6 x 5.4 | 1 | fishers | **yes** |  |
| `in.110` | -29, 56 | 5.6 x 5 | 1 | fishers |  |  |
| `in.112` | -30, 62 | 4.4 x 4.6 | 1 | fishers |  |  |
| `in.114` | -15, 70 | 6.2 x 5 | 1 | fishers |  |  |
| `in.117` | 29, 27 | 5.6 x 5.4 | 3 | (none) | **yes** |  |
| `in.118` | 36, 27 | 5.6 x 5.4 | 2 | dyers | **yes** |  |
| `in.119` | 29, 34 | 6.2 x 5.4 | 1 | (none) | **yes** |  |
| `in.120` | 26, 41 | 4.4 x 4.6 | 2 | (none) | **yes** |  |
| `in.121` | 32, 41 | 4.4 x 4.6 | 2 | (none) | **yes** |  |
| `in.122` | 28, 48 | 7 x 5.4 | 2 | fishers | **yes** |  |
| `in.123` | 36, 48 | 5.6 x 5.4 | 1 | fishers | **yes** |  |
| `in.124` | 26, 56 | 6.2 x 5.4 | 1 | fishers |  | yes |
| `in.125` | 34, 56 | 4.4 x 5.4 | 1 | fishers |  |  |
| `in.126` | 24, 63 | 6.2 x 5.4 | 1 | fishers | **yes** |  |
| `in.127` | 23, 70 | 4.4 x 4.6 | 1 | fishers |  |  |
| `in.128` | 40, 20 | 6.2 x 4.6 | 2 | dyers | **yes** |  |
| `in.129` | 42, 26 | 5 x 5 | 2 | dyers |  |  |
| `in.130` | 36, 34 | 4.4 x 5 | 2 | dyers | **yes** |  |
| `in.131` | 43, 34 | 4.4 x 5 | 1 | dyers |  |  |
| `in.132` | 39, 40 | 7 x 5 | 2 | dyers |  |  |
| `barn` | 113, -3 | 9 x 7.5 | 1 | farm | | (open front, a cart and hay inside: the only honest one) |
| `high.b` | 118, 90 | | 2 | Highfold | | message: "Bolted. Nobody is home: they are all at the wedding." No wedding exists. |
| `high.barn` | 99, 114 | | 1 | Highfold | | message: "The barn door is chained. Sheep bleat behind it." |

## C. Enterable buildings with no answer

| id | name | why |
|---|---|---|
| `chapel` | Chapel of the Dawn | nobody lives there |
| `draper` | Lindqvist’s Draper | nobody lives there |
| `in.08` | Alder House | no trade: "household" |
| `in.12` | Hobb’s Cottage | no trade: "household" |
| `in.34` | Wren Cottage | no trade: "household" |
| `in.38` | Marsh House | no trade: "household" |
| `in.60` | Garrick’s House | no trade: "household" |
| `in.67` | Bram’s House | no trade: "household" |
| `in.74` | Thorne House | no trade: "household" |
| `in.75` | Ferrin’s House | no trade: "household" |
| `in.82` | Tamsin’s House | no trade: "household" |
| `in.94` | Pell House | no trade: "household" |

Trades held by two buildings: cutler (2), grocer (2), baker (2), tinker (2), woodcutter (2), shepherd (2).
