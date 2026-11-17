# Rooms: what each household owns and uses, room by room (the spec to furnish from)

Made by `python3 test/audit/rooms_spec.py` from the hand-written table inside that script (edit it there, not here). Households are those of `docs/PEOPLE.md`;
rooms are the rooms the interiors have today (`docs/audit/INTERIORS.md`). Nothing here is built.

## Rules

- **Every room has one thing no other room has**, and it says something about who lives there or about a neighbour. It is the last column but one.
- **Cabinets face the room.** Today 613 of 653 show their backs.
- **No filler.** No cabinet or bench is placed because a wall is free. Barrels, sacks and crates stand only in cellars, stores, shops and workrooms, in the numbers given.
- **Containers:** 242 in all, against 1033 today (23%). Each has an owner and the contents named. The story's own containers (crypt, strongbox, hatbox) are extra and unchanged.
- **Light by wealth:** about 105 flames in all besides hearths (today 1,004 candle, lantern and torch flames). Tier 0: poor: the hearth, and at most one rushlight (`wooden_candlestick`) in the house. Tier 1: middling: the hearth, one candle in each lived room, a lantern where work needs it. Tier 2: well off: branched candles (`brass_candleholders_c`), a standing candlestick, a lantern in the stair hall. Cellars: one torch at the stair foot or nothing. A room marked "none" is dark unless the player brings a light, on purpose.
- **Beds:** one per sleeper in `docs/PEOPLE.md`, named here; no others except where a line says a bed is stripped or kept made for someone.
- **Rooms nobody uses are allowed** and say why (a shut solar, a stripped barracks bed). An unused room is dressed as unused, not filled.
- **Trade sets:** "(trade set)" means the workshop pieces the trade interior already has (`72h_trades.js`); keep them.
- **Pieces:** every name in `code style` is a kit piece that exists today (checked by the script against the placed kit). Things described in plain words (a cradle, a mangle, a loom, pallets, a slate board) have no piece yet: 31 kinds, listed at the end, to be made or cut.

## `inn` The Honeyed Hart

Greta Barleybrook, Lark (lodger); the traveller's bed. Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | common room | 4 `woodentable_01` with benches, the bar (`gen_counter`), 6 `folding_wooden_stool`, `Cauldron` at the hearth, `Peg_Rack` by the door | Lark's corner: one painted_wooden_chair_01 on a rug facing the room, his lute on a peg | 2: bar cupboard (mugs, a tally of who owes), till box (coin) | Chandelier, hearth, 2 brass_candleholders_c on the bar |
| store | kitchen | `wooden_table_02` (work table), `painted_wooden_shelves`, `brass_pan_01` x3 on `Peg_Rack`, `Cauldron`, `wooden_bucket_01` | a side of bacon and yellow_onion strings hung over the table | 2: flour bin (Hobb's bread, flour), crock shelf (honey from Tamsin, salt) | hearth glow from the hall, 1 wooden_lantern_01 |
| bedroom | Greta's room | `gothicbed_01`, `classicnightstand_01`, `treasure_chest`, `painted_wooden_cabinet`, `ornate_mirror_01` | three generations of Barleybrook tally sticks on Shelf_Simple | 2: chest (linen, her gran's brooch), cabinet (the Hart's ledger) | 1 wooden_candlestick |
| cellar | ale cellar | 6 `wine_barrel_01` on `Barrel_Holder` racks along one wall, 2 `Crate_Wooden` of bottles, `wooden_ladder` | the bricked-up arch in the north wall with one cask rolled aside from it | 1: crate (empty bottles, a silver-stained rag) | 1 Torch_Metal at the stair foot |
| vault | cold store | `painted_wooden_shelves` of cheeses (`ceramic_pot`), 2 `Barrel` (salt fish), hooks | Laurence Byrd's newest cask, still pale, chalked BYRD | 1: the locked strongbox (story) | none: you bring a light |
| loft | gallery | 2 `woodentable_01`, 4 `painted_wooden_stool`, balustrade to the hall | a chess_set left mid-game on the end table | 0 | 2 wooden_lantern_01 on the posts |
| chamber1 | the traveller's room | `gothicbed_01`, `classicnightstand_01`, `treasure_chest`, `wooden_bucket_02` and `ceramic_vase_04` for washing | Greta's note on the table (exists) | 1: chest (the player's) | 1 wooden_candlestick |
| chamber2 | Lark's room | `gothicbed_01`, `painted_wooden_table`, `painted_wooden_stool`, `Peg_Rack` with a travelling cloak | Book_5 open with half a song, and Sabina's name crossed out twice | 1: satchel (strings, two winters of unpaid reckoning) | 1 wooden_candlestick |

## `smithy` Brandt’s Forge

Brandt Ironhand, Tobin. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| forge | the forge | `Anvil_Log`, the hearth and bellows (trade set), `WeaponStand` of finished tools, `wooden_bucket_01` quench tub, `Whetstone` | a cart tyre leaning red-rusted by the door for Miles Ashdown | 1: tool chest (tongs, punches) | forge fire only |
| living | kitchen and table | `woodentable_01`, 2 `folding_wooden_stool`, `Cauldron`, `painted_wooden_shelves` | two bowls set, one small | 1: cupboard (bread, cheese, Roger Hask's bill for steel) | hearth, 1 wooden_candlestick |
| coalstore | charcoal and iron | 3 `Bag` of charcoal, `Crate_Wooden` of bar iron, `rusted_spade_01` | Tobin's wooden sword and a pot-lid shield hidden behind the sacks | 1: crate (bar iron) | none |
| loft | sleeping loft | `gothicbed_01` (Brandt), a straw pallet bed for Tobin under the eaves, `treasure_chest`, `Peg_Rack` with two aprons | Hilda's unpaid cloth, folded, on the chest | 1: chest (Sunday shirt, the cloth) | 1 wooden_candlestick |

## `store` Quill’s Sundries

Marta Quill. Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | Quill's Sundries | `gen_counter`, `painted_wooden_shelves` x3 of goods, `Shelf_Small_Bottles`, coils of hemp on `Peg_Rack`, the cellar hatch WITH a trap door | a card of buttons pinned up beside the bell rope she sold | 4: under the counter (coin), three shelves the player buys from | 2 wooden_lantern_01, daylight |
| stock | stock room | 4 `Crate_Wooden`, 2 `Bag`, `wooden_ladder`, `painted_wooden_shelves` | lamp oil flasks (Bottle_1) set apart with a chalked H for the gate | 3: crates (candles, soap, nails) | 1 wooden_candlestick |
| keeper | her kitchen | `painted_wooden_table`, `painted_wooden_chair_01`, `Cauldron`, `painted_wooden_cabinet` | one chair only | 1: cabinet (tea, sugar loaf) | hearth, 1 brass_candleholders_c |
| solar | bedroom | `gothicbed_01`, `classicnightstand_01`, `gothiccabinet_01`, `ornate_mirror_01` | the day book: every sale in Brackenfell for eleven years | 2: cabinet (dresses), nightstand (the day book) | 1 CandleStick_Stand |
| attic | attic | 2 `treasure_chest`, a broken `painted_wooden_chair_01`, dust sheets | her late husband's sign, QUILL AND SON, face to the wall | 2: chests (his clothes; unsold stock) | none |
| cellar | cellar | 3 `wine_barrel_01` (vinegar, oil, lamp oil), `Crate_Wooden` x2 | nothing else: she keeps it bare so she can see the floor | 2: crates | 1 Torch_Metal |

## `elder` Rowan’s Cottage

Elder Rowan. Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | the old manor hall | one long `woodentable_01` with benches, the Elder's chair (`painted_wooden_chair_01` with Tybalt's leather seat), `Shield_Wooden` (his father's buckler) over the hearth | six bread baskets (wicker_basket_02) stacked empty by the door | 1: sideboard (plate, the town seal) | hearth, 2 brass_candleholders_c |
| study | study | `painted_wooden_table`, `Book_5` x4, `wooden_bookshelf_worn`, `BookStand` | the levy roll open, and a brass spyglass case | 2: desk (letters), bookshelf box (deeds) | 1 CandleStick_Stand |
| stairhall | stair hall | `Peg_Rack` with his staff and cloak, a bench | his walking boots, mud to the ankle, though he says he no longer walks | 0 | 1 wooden_lantern_01 |
| chamber | bedroom | `gothicbed_01`, `classicnightstand_01`, `gothiccabinet_01` | a second pillow that has not been slept on in years | 1: cabinet (clothes) | 1 wooden_candlestick |
| solar | upper room, unused | `rockingchair_01` facing the window, dust sheets over a `painted_wooden_table` | the window looks straight at Pell House | 0 | none |
| strongroom | strongroom | 2 `treasure_chest`, `painted_wooden_shelves` of ledgers | twelve brass tally tokens on a nail, one nail empty | 2: chests (the town's silver; the founders' agreement) | none |

## `herbalist` Maren’s Cottage

Old Maren. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | front room | `painted_wooden_table` with pestle and bowls (`wooden_bowl_01`), `Shelf_Small_Bottles` x2, bunches of herbs from the beams, 2 `painted_wooden_stool` | Beatrix Ferrin's jars, each with Maren's mark scratched in | 3: jar shelf (tonics the player buys), drawer (bandage), basket (roots) | daylight, 1 wooden_candlestick |
| workroom | stillroom | `Cauldron`, `wooden_table_02`, `Potion_2` and `Potion_4` rows, `wooden_bucket_02` | a tray laid out as she laid out the drowned man's things | 2: cupboard (dried herbs), crock (honey) | hearth |
| chamber | bed and fire | `gothicbed_01`, `rockingchair_01` TO the fire, `treasure_chest` | sixty notches cut in the bedpost | 1: chest (shawls, a child's shoe) | hearth only |

## `guardhouse` Warden’s Lodge

Warden Hale, Guardsman Ivo. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| guard | guard room | `woodentable_01`, 2 `folding_wooden_stool`, `WeaponStand`, `Peg_Rack` with two cloaks, the roster board | Hugh Alder's two sheaves of arrows, still tied | 1: locker (fines, the cell key) | hearth, 1 wooden_lantern_01 |
| cells | the cell | a plank bed, `wooden_bucket_01` | scratched tallies on the wall, some very old | 0 | light through the bars |
| armoury | armoury | 2 `WeaponStand`, `Shield_Wooden` x3, `kite_shield`, `Crate_Wooden` of arrows | the first Warden's kettle hat on a shelf, dented | 1: crate (arrows) | none |
| barracks | barracks | 2 `gothicbed_01` in use, 2 bed frames stripped (the watch was four once), 2 `treasure_chest`, `Dummy` | Ivo's half-written letter home | 2: chests (Hale's: his mother's letters; Ivo's: dice, spare boots) | 1 wooden_candlestick |

## `weaver` Riverside Cottage

Hilda Weaver, Pip. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | loom room | the loom (trade set), `spinning_wheel_01`, baskets of yarn (`wicker_basket_02` x3), bolts for Lindqvist on a table | cloth cut and folded for Brandt, with the bill pinned on | 2: yarn basket, cloth press | daylight, 1 wooden_lantern_01 |
| living | kitchen | `painted_wooden_table`, 2 `painted_wooden_stool`, `Cauldron` | Pip's slate from school with a b turned into a bird | 1: cupboard (oats, honey cake) | hearth |
| yard | yard | tenter frames, `wooden_bucket_02`, washing | Wilmot's three colours hung to dry | 0 | open |
| loft | loft | `gothicbed_01` (Hilda), a small bed (Pip), `treasure_chest` | a man's hat on the peg nobody mentions | 1: chest (blankets) | 1 wooden_candlestick |

## `chapel` Chapel of the Dawn

Brother Aldous. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| nave | nave | pews, altar, `BookStand`, 2 `CandleStick_Stand` | the new hemp bell rope coming down through the ceiling | 1: alms box | Chandelier unlit, altar candles, stained light |
| sacristy | sacristy and his cell | a narrow cot (new), `painted_wooden_table`, `Book_5` x3, `Peg_Rack` with a habit | the Sexton's ledger open at a page he has turned to many times | 2: vestment press, book box | 1 wooden_candlestick |
| tower | bell tower foot | the rope, `wooden_ladder`, a stool | the old rotted rope coiled in the corner | 0 | daylight from above |
| vault | vault | 3 stone shelves, `ceramic_vase_02` urns, `Crate_Wooden` of candles | Silas Garrow's unlettered headstone waiting on trestles | 1: crate (candles) | none |
| crypt | crypt | as built (tombs, the reliquary) | unchanged: story | story containers only | as built |

## `mill` Dunn’s Mill

Osric Dunn. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | mill floor | the stones and hopper (trade set), 6 `Bag` of flour, scales, `wooden_ladder` | Greta's malt sacks set aside and forgotten, chalked HART | 2: flour bin, toll box | daylight |
| living | kitchen | `woodentable_01`, 1 `painted_wooden_chair_01`, `Cauldron` | a tally of who is owed, longer than the table | 1: cupboard | hearth, 1 wooden_candlestick |
| yard | yard | cart, 2 `Barrel`, the wheel pit rail | a millstone cracked in two, kept | 0 | open |
| loft | loft | `gothicbed_01`, `treasure_chest`, `Peg_Rack` | ear plugs of wool on the nightstand | 1: chest | 1 wooden_candlestick |

## `farm` Fairweather Farm

Edda Fairweather (Bram works here by day). Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | farm kitchen | `woodentable_01` with benches, `Cauldron`, `brass_pan_01` x2, `painted_wooden_shelves` | five names cut in the lintel, hers the last | 1: dresser (plates) | hearth, 1 wooden_lantern_01 |
| service | dairy | `wooden_bucket_01` x3, churn, `ceramic_pot` rows | Basilia Wold's Highfold cheese beside her own, for comparing | 1: crock shelf | daylight |
| passage | cross passage | `Peg_Rack`, boots, `rusted_spade_01`, Bram's barrow | Gillian Alder's bag of goose feathers by the door | 0 | none |
| buttery | buttery | 2 `wine_barrel_01` (cider), `Barrel_Apples`, `FarmCrate_Apple` | Bram's apples he gives away, in his own basket | 1: apple crate | none |
| parlour | parlour | `painted_wooden_table`, 2 `painted_wooden_chair_01`, `gothiccabinet_01`, `mantel_clock_01` | Tybalt's mended plough harness on the table, bill unpaid | 1: cabinet (deeds to the fields) | hearth, 1 brass_candleholders_c |
| solar | her room | `gothicbed_01`, `classicnightstand_01`, `treasure_chest` | a widow's cap on the stand (she is the widow Maren means) | 1: chest | 1 wooden_candlestick |
| landing | landing | linen press (`painted_wooden_cabinet`), a window seat | seed corn in labelled bags | 1: press (linen) | none |
| chamber | the men's room, empty | 3 bed frames, 1 made up for harvest hands | a row of pegs with one hat | 0 | none |

## `hunter` Wren’s Cabin

Wren. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `gothicbed_01`, `woodentable_01`, `WeaponStand` with bows, hides on frames, `Cauldron` | a bundle of letters signed T. under a jar of heather honey | 2: chest (furs), box (broadheads from Hugh Alder) | hearth only |

## `fisher` Fisher’s Hut

Finn Reedwater. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `woodentable_01`, `folding_wooden_stool`, nets on `Peg_Rack`, `wooden_bucket_01` of bait, `Cauldron` | the sailcloth's missing corner, cut square | 2: sea chest (line, hooks), crock (salt) | hearth only |
| loft | loft | `gothicbed_01`, `treasure_chest` | his father's oar hung over the bed | 1: chest | none |

## `draper` Lindqvist’s Draper

Anselm and Sabina Lindqvist. Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | the shop | `gen_counter`, `painted_wooden_shelves` x3 of bolts, a yardstick, `ornate_mirror_01` | the bolt of sailcloth with a length newly cut | 3: under the counter (coin, the book), two cloth presses | 2 brass_candleholders_c, daylight |
| back | back room | `painted_wooden_table`, 2 `painted_wooden_chair_01`, `Cauldron`, `gothiccabinet_01` | Anselm's grandfather's pack frame on the wall | 1: cabinet (accounts with Hilda and Wilmot) | hearth, 1 CandleStick_Stand |
| upfront | Sabina's room | `gothicbed_01`, `classicnightstand_01`, `painted_wooden_cabinet`, a dress form (`Dummy`) | a ribbon counting Lark's unpaid winters: two knots | 1: cabinet | 1 wooden_candlestick |
| upback | Anselm's room | `gothicbed_01`, `treasure_chest`, `rockingchair_01` at the window | his late wife's thimble on the sill | 1: chest | 1 wooden_candlestick |
| cellar | cellar | 4 `Crate_Wooden` of wool, cedar shavings, 1 `wine_barrel_01` | moth traps: he checks them daily | 2: crates | 1 Torch_Metal |

## `shop.n2` Shop

lock-up: Alaric Mossop by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | the apothecary | `gen_counter`, `Shelf_Small_Bottles` x3 with labels, scales, `Book_5` | every jar labelled in a hand nobody here can read | 3: bottle shelves (the player buys), drawer | 2 wooden_lantern_01 |
| back | compounding room | `wooden_table_02`, `Potion_2`, `Potion_4`, `Cauldron` (small) | a jar of plain mint, labelled at length | 1: cupboard | hearth |
| upfront | consulting room | `painted_wooden_table`, 2 `painted_wooden_chair_01`, a chart of the humours (`gen_paint`) | nobody has sat in the second chair | 0 | daylight |
| upback | store | 3 `Crate_Wooden` from the lowlands, straw | the crate he has not unpacked in two years | 2: crates | none |
| cellar | cellar | `Bottle_1` racks, 1 `wine_barrel_01` (spirit) | empty | 1: rack | none |

## `shop.n3` Shop

lock-up: Roger Hask by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | the cutler's | `gen_counter`, knives on a barred rack, `WeaponStand`, `Whetstone` | Brandt's steel bars with BI stamped, beside his own finished blades | 2: knife case (the player buys), till | 1 wooden_lantern_01 |
| back | finishing room | `wooden_table_02`, vice, files, horn and bone for handles in `wicker_basket_02` | the dead man's knife, tagged for Hale | 1: tool chest | hearth |
| upfront | polishing loft | a bench at the window, rouge pots (`ceramic_pot`) | his best work, unsold: a carving set | 1: case | daylight |
| upback | empty room | a stool, Odo's old grinding apron on a peg | swept, nothing kept | 0 | none |
| cellar | cellar | `Crate_Wooden` of bar steel, oil (`wine_barrel_01`) | empty | 1: crate | none |

## `shop.n4` Shop

lock-up: Elinor Thorne by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | Salt and Spice | `gen_counter`, salt blocks on `painted_wooden_shelves`, scales, small drawers | a painted pepper pod for a sign, inside out of the rain | 3: spice drawers (the player buys), salt bin, till | 1 brass_candleholders_c |
| back | packing room | `wooden_table_02`, `Bag` x3, twine, paper | Emmet Sele's book, ribbon at a picture | 1: cupboard | hearth |
| upfront | salt loft | 6 `Bag` of lake salt on a raised floor, `wooden_bucket_01` | drying racks: the whole room smells of the lake | 2: bins | daylight |
| upback | Gilbert's sample room | `painted_wooden_table`, `seadogs_compass`, `ship_pinnace` model, `Crate_Wooden` | lowland goods he cannot sell here | 1: crate | none |
| cellar | cellar | 2 `wine_barrel_01` of brine, `Barrel` | empty | 1: barrel | none |

## `shop.s0` Shop

lock-up: Tilly Hobb by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | the Bread Stall | `gen_counter` with `hamburger_buns_a` and long loaves, `wicker_basket_02` x3, a slate of prices | honey cake under a cloth | 2: bread baskets (the player buys), till | daylight |
| back | back room | `painted_wooden_table`, a stool, `Cauldron` for her dinner | a loaf with one slice gone, set aside daily for Giles | 1: cupboard | hearth |
| upfront | flour loft | 5 `Bag` from the mill, a sieve, `wooden_ladder` | Osric's chalk marks on every sack | 1: bin | none |
| upback | spare room | a bed frame, dust | where she will live when she marries, she says | 0 | none |
| cellar | cellar | 2 `Crate_Wooden` of day-old bread for the pigs, 1 `Barrel` | empty | 1: crate | none |

## `shop.s1` Shop

lock-up: Lettice (afternoons), Emmet Sele (market days). Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | the Bookstall | `gen_counter`, `wooden_bookshelf_worn` x2, `BookStand` with a chained `Book_5` | a reading stool worn smooth | 2: bookshelf (the player buys), till | 1 CandleStick_Stand, daylight |
| back | binding room | `wooden_table_02`, press, glue pot, paper | a child's primer half sewn | 1: paper chest | hearth |
| upfront | map room | `painted_wooden_table`, rolled maps in `ceramic_vase_04`, `seadogs_compass` | a map of the valley with the mine drawn north of the chapel | 1: map chest | daylight |
| upback | Lettice's corner | `rockingchair_01` at the window, `Book_5` x5 in a pile | the book whose ending she told Amice | 0 | 1 wooden_candlestick |
| cellar | cellar | `Crate_Wooden` x2 of unsold sermons | empty | 1: crate | none |

## `shop.s2` Shop

lock-up: Diggory Pike by day. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | the Tinker's Stall | `gen_counter`, `brass_pan_01` x4 and kettles hung, a grindstone | a list of who told him what, in his own shorthand | 2: pan rack (the player buys), till | 1 wooden_lantern_01 |
| back | solder room | `wooden_table_02`, brazier, tin snips | Greta's kettle and Goda's kettle side by side, tags swapped | 1: tool chest | hearth |
| upfront | scrap loft | `wicker_basket_02` x4 of broken pans | a bell with no clapper | 1: scrap bin | none |
| upback | empty | a stool, a blanket | where he naps and says he does not | 0 | none |
| cellar | cellar | `Bag` of charcoal, `Crate_Wooden` of tin | empty | 1: crate | none |

## `in.02` Cooper’s House

Laurence, Felice and Joyce Byrd. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | cooperage | shaving horse, staves stacked, hoops on `Peg_Rack`, 3 half-raised casks (`Barrel`), `wooden_axe_03` | one cask with JB burned inside the head | 1: tool chest | daylight, the firing brazier |
| leg | hoop store | iron hoops, withies in `wicker_basket_02` | Felice's draw knife, handle worn to her grip | 0 | none |
| living | kitchen | `woodentable_01`, 3 `painted_wooden_stool`, `Cauldron`, `painted_wooden_shelves` | a sign board painted BYRD AND, unfinished | 1: cupboard (Maren's hand salve) | hearth, 1 wooden_candlestick |
| yard | yard | seasoning oak stacked, cart, `wooden_bucket_02` | Greta's order chalked on the gate | 0 | open |
| loft | loft | `gothicbed_01` (Laurence and Felice), a second bed behind a curtain (Joyce), `treasure_chest` | Joyce's seven notches on the beam, one a year | 1: chest | 1 wooden_candlestick |

## `in.04` Fletcher’s House

workplace: Hugh Alder by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | fletcher's shop | `wooden_table_02` with a fletching jig, shafts in `ceramic_vase_04`, feathers in `wicker_basket_02`, `WeaponStand` | a target face shot to rags | 2: arrow chest, feather basket | daylight |
| pantry | shaft store | bundles of ash and birch, `Crate_Wooden` of heads | Wren's order tied with red | 1: crate | none |
| chamber | glue room | `Cauldron` (glue), drying racks | the smell: nobody eats here | 0 | hearth |
| solar | bow loft | bow staves seasoning on pegs, `Dummy` with a quiver | Hale's bow, restrung | 0 | daylight |

## `in.07` Potter’s House

workplace: Beatrix Ferrin by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | the Pottery | wheel and wedging table (trade set), `ceramic_pot` and `ceramic_vase_02` on `painted_wooden_shelves`, `wooden_bucket_01` of slip | green ware on a board with DO NOT TOUCH scratched in | 1: glaze cupboard | daylight |
| living | damp room | pots drying under cloth, a stool | Maren's jars, each marked | 1: shelf box | none |
| yard | kiln yard | the kiln, cordwood, a wheelbarrow, shards | a wall of wasters built into the fence | 0 | open |
| loft | pattern loft | `painted_wooden_table`, moulds, Amice's small crooked bowl kept on a shelf | the bowl | 0 | daylight |

## `in.08` Alder House

Hugh and Gillian Alder. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | hall | `woodentable_01` with benches, `Cauldron`, `painted_wooden_cabinet`, basket of quills (`wicker_basket_02`) | a feather on every flat surface | 1: cabinet (plates) | hearth, 1 wooden_candlestick |
| pantry | pantry | `painted_wooden_shelves`, 2 `ceramic_pot`, 1 `Barrel` (flour) | a covered dish she takes to Stephen forty paces away | 1: shelf crock | none |
| chamber | their room | `gothicbed_01`, `classicnightstand_01`, `treasure_chest` | Stephen's first shoe, badly made, kept | 1: chest | 1 wooden_candlestick |
| solar | Stephen's old room | a stripped bed, `painted_wooden_table` | made up fresh anyway | 0 | none |

## `in.10` Baker’s House

Godwin, Avice and Tilly Hobb. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | bakehouse | the oven (hearth), `wooden_table_02` kneading trough, peels on `Peg_Rack`, 4 `Bag` of flour, `wicker_basket_02` x4 | six empty loaf tins set apart: the Elder's order | 2: flour bin, salt box | oven glow, 1 wooden_lantern_01 |
| back | kitchen | `woodentable_01`, 3 `painted_wooden_stool`, `painted_wooden_shelves` | his chair set where he can hear the bell | 1: cupboard | daylight |
| upfront | Godwin and Avice's room | `gothicbed_01` with a heavy curtain (he sleeps by day), `classicnightstand_01`, `treasure_chest` | the shutters nailed half shut | 1: chest | none by day |
| upback | Tilly's room | `gothicbed_01`, `painted_wooden_cabinet`, `ornate_mirror_01` | a ribbon that smells faintly of the tannery | 1: cabinet | 1 wooden_candlestick |
| cellar | cellar | 2 `wine_barrel_01` (barm), `Crate_Wooden` | cool shelf for the dough | 1: crate | none |

## `in.12` Hobb’s Cottage

Idony Hobb. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | hall | `woodentable_01`, `rockingchair_01` TO the fire, `spinning_wheel_01`, `Cauldron` | a low chair by the door so she need not look up at people | 1: cupboard (eggs for the Hart) | hearth only |
| pantry | pantry | 1 `Barrel`, egg baskets (`wicker_basket_02` x2), `ceramic_pot` | a hen that is not supposed to be indoors | 1: crock | none |
| chamber | bedroom | `gothicbed_01`, `treasure_chest` | her husband's side still made | 1: chest (a miner's lamp she will not explain) | 1 wooden_candlestick |
| solar | upper room, shut | dust sheets, a cradle | she has not climbed the stair in six years | 0 | none |

## `in.13` Tanner’s House

Fulk and Giles Varrow. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | tannery | pits (trade set), scraping beam, hides on frames, `wooden_bucket_01` x3, `Bag` of oak bark | Humphrey's brand on every raw hide | 1: tool chest | daylight |
| leg | bark store | 4 `Bag` of bark, a mill stone | Giles's clean shirt hung as far from the pits as the room allows | 0 | none |
| living | kitchen | `woodentable_01`, 2 `folding_wooden_stool`, `Cauldron` | a loaf a day, half of them uneaten | 1: cupboard | hearth only |
| yard | yard | drying frames, lime barrel, cart | the stream gate | 0 | open |
| loft | loft | 2 `gothicbed_01`, 1 `treasure_chest` | a cake of Marta's soap, worn to a sliver | 1: chest | none |

## `in.15` Grocer’s House

Thorne's Store: Simon Thorne by day. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | grocer's | `gen_counter`, scales, `painted_wooden_shelves`, `yellow_onion` strings, 3 `Bag` (oats), `Barrel` (lard) | Gilbert's rent book hung where Simon must see it | 3: bins the player buys from, till | 1 wooden_lantern_01 |
| back | counting corner | `painted_wooden_table`, a stool, `Book_5` | a column of figures that does not come out | 1: desk | hearth |
| upfront | dry store | 6 `Bag`, 2 `Crate_Wooden`, `wooden_ladder` | Edda's cabbages Bram forgot to carry down | 2: crates | none |
| upback | Hamo the carter's old room | a bed frame, a whip on a peg | empty since the pass took him: Lettice's father | 0 | none |
| cellar | cellar | 3 `wine_barrel_01` (lamp oil, vinegar, ale), `Barrel` | cool | 1: barrel | 1 Torch_Metal |

## `in.20` Chandler’s House

Barnaby and Ursel Crane. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | ship chandler's | `gen_counter`, coils on `Peg_Rack`, candles hung by the wick in dozens, tar pots, `wooden_lantern_01` for sale x3 | a ledger line: ELDER, 12, FOR THE CAVE, every month | 3: candle box (the player buys), cord bin, till | lit by its own wares: 2 lanterns |
| back | dipping room | `Cauldron` of tallow, dipping frame, `wooden_table_02` | Tamsin's wax cakes stamped with a bee | 1: wax chest | hearth |
| upfront | their room | `gothicbed_01`, `classicnightstand_01`, `painted_wooden_cabinet` | two candles: she reads, he does not | 1: cabinet | 2 wooden_candlestick |
| upback | cordage loft | Ulric's rope in coils, a splicing bench | a rope tagged BELL, never collected | 1: locker | none |
| cellar | cellar | 3 `Barrel` of tar, tallow in `ceramic_pot` | empty | 1: crate | none |

## `in.21` Dyer’s House

Wilmot and Tom Arden. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | dye house | three vats (trade set) red, yellow, blue, paddles, `wooden_bucket_02` x2 | Hilda's cloth in the blue vat, a week in | 1: dyestuff chest (madder, weld, woad) | daylight |
| living | kitchen | REPLACE the two grey slabs with `woodentable_01`, 2 `painted_wooden_stool`, `Cauldron` | blue fingerprints on the cups | 1: cupboard | hearth, 1 wooden_candlestick |
| yard | yard | drying racks in three colours, rinse trough | the stream running three colours | 0 | open |
| loft | loft | `gothicbed_01` (Wilmot), a small bed (Tom), `treasure_chest` | Tom's sand, for scrubbing, in a bowl | 1: chest | 1 wooden_candlestick |

## `in.23` Widow Hale’s House

Widow Hale's House: locked (story). Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room, shut up | `gothicbed_01` stripped, `woodentable_01` under a sheet, the hatbox | unchanged: story | story containers only | none: the shutters are closed |

## `in.33` Merchant’s House

Gilbert and Elinor Thorne. Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | hall | `woodentable_01` with `painted_wooden_chair_01` x4, `gothiccabinet_01` with `brass_goblets`, painted panels (`gen_paint`) | a map of the passes with his losses pinned on | 1: cabinet (plate) | hearth, Chandelier (the only private one in town) |
| counting | counting room | `painted_wooden_table`, `Book_5` x3, scales, `treasure_chest` (locked), `mantel_clock_01` | the letter to the Crown assayer (the merchant's letter, placed here) | 2: strongbox, letter chest | 1 CandleStick_Stand |
| stairhall | stair hall | `Peg_Rack`, `carved_wooden_elephant` on a stand, a bench | three locks on the door | 0 | 1 wooden_lantern_01 |
| chamber | their room | `gothicbed_01` with hangings, 2 `classicnightstand_01`, `ornate_mirror_01`, `gothiccabinet_01` | Emmet's books on her side, bookmarks at the pictures | 2: cabinet, jewel box | 2 brass_candleholders_c |
| solar | guest room | `gothicbed_01`, `painted_wooden_table`, `marble_bust_01` | kept for a buyer who has not come | 1: chest | 1 wooden_candlestick |
| cellar | cellar | 4 `wine_barrel_01` (wine, real wine), `Crate_Wooden` x3 of lowland goods | a crate marked for the Hart, unpaid | 2: crates | 1 Torch_Metal |

## `in.34` Wren Cottage

Sedge Cottage: Alaric Mossop (lodger). Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | rented hall | `woodentable_01`, 1 `painted_wooden_chair_01`, `Cauldron` unused | his trunk never fully unpacked, in the middle of the floor | 1: trunk (books, city clothes) | hearth, 1 wooden_candlestick |
| pantry | pantry | nearly empty `painted_wooden_shelves`, `Bottle_1` x4 | he eats at the Hart | 0 | none |
| chamber | bedroom | `gothicbed_01`, `classicnightstand_01`, `Book_5` x3 | a letter from the lowlands asking when he is coming back | 1: nightstand | 1 wooden_candlestick |
| solar | upper room | the landlord's furniture under sheets | he has never been up | 0 | none |

## `in.36` Mason’s House

Silas Garrow. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | mason's shop | banker (stone bench), chisels on `Peg_Rack`, a headstone half cut, `picke_dirty_01` | the stone with no name, for the man on the wharf | 1: tool chest | daylight |
| leg | stone store | blocks, sand in `Bag` | a child's headstone, old, never collected | 0 | none |
| living | kitchen | `woodentable_01`, 1 `folding_wooden_stool`, `Cauldron` | one bowl, one cup, both clean | 1: cupboard | hearth only |
| yard | yard | rough stone, a sledge, `wooden_bucket_02` | his father's mark cut in the gatepost | 0 | open |
| loft | loft | `gothicbed_01`, `treasure_chest` | a rubbing of every stone he has cut, in a roll | 1: chest | none |

## `in.37` Cutler’s House

Roger and Odo Hask. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | grinding shed | the great wheel (Odo's), `Whetstone`, `wooden_bucket_01` of water, a bench | a cord strung from door to wheel at hand height, for Odo | 1: blade box | daylight |
| back | kitchen | `woodentable_01`, 2 `painted_wooden_chair_01`, `Cauldron` | everything kept in the same place, always | 1: cupboard | hearth |
| upfront | Roger's room | `gothicbed_01`, `treasure_chest`, `WeaponStand` of his prentice pieces | his master piece: a sword he never sold | 1: chest | 1 wooden_candlestick |
| upback | Odo's room | `gothicbed_01`, `rockingchair_01` at the window he cannot see from, a stick | a notched calendar stick: he counts by the bell | 1: box | none: he does not need one |
| cellar | cellar | grindstones, 1 `wine_barrel_01` | empty | 0 | none |

## `in.38` Marsh House

Peter, Ellen and Will Marsh. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | hall | `woodentable_01`, 3 `painted_wooden_stool`, `Cauldron`, nets on `Peg_Rack` | oars by the door, one newer than the other | 1: cupboard | hearth, 1 wooden_candlestick |
| pantry | smoke store | racks of smoked fish, 1 `Barrel` of salt, `wicker_basket_02` x2 | alder chips | 1: fish box | none |
| chamber | Peter and Ellen's room | `gothicbed_01`, `treasure_chest` | his wet boots hidden under the bed since that morning | 1: chest | 1 wooden_candlestick |
| solar | Will's room | a small bed, a toy boat, a pike's jawbone on a string | the jawbone | 0 | none |

## `in.40` Scribe’s House

Emmet Sele, Lettice. Light tier 2.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | schoolroom | 2 `woodentable_01` with benches, a slate board, `BookStand`, hornbooks | six slates: Ned, Amice, Will, Tom, Pip, and one unused | 1: slate box | daylight, 1 CandleStick_Stand |
| pantry | muniment room | `wooden_bookshelf_worn` x2, 3 `treasure_chest` of rolls | the Old Mine pay roll, never asked for | 3: roll chests (levy; deeds; the mine) | none: no flame near paper |
| chamber | Emmet's room | `gothicbed_01`, `painted_wooden_table`, `Book_5` x6 | spectacles and a second pair | 1: desk | 1 brass_candleholders_c |
| solar | Lettice's room | `gothicbed_01`, `wooden_bookshelf_worn`, `classicnightstand_01` | her father's carter's badge | 1: nightstand | 1 wooden_candlestick |

## `in.44` Cobbler’s House

Stephen Alder. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | cobbler's | bench with lasts, leather on `Peg_Rack`, boots in a row with tags | Ivo's boots, again | 2: last chest, till | daylight, 1 wooden_lantern_01 |
| back | kitchen | `painted_wooden_table`, a stool, `Cauldron` | his mother's covered dish, washed, waiting to go back | 1: cupboard | hearth |
| upfront | his room | `gothicbed_01`, `treasure_chest` | a pair of dancing shoes he made for nobody yet | 1: chest | 1 wooden_candlestick |
| upback | leather store | Fulk's hides rolled, `Bag` of pegs | the smell of the tannery, faint | 1: bin | none |
| cellar | cellar | 1 `Barrel`, old lasts in a `Crate_Wooden` | his grandfather's pegged-boot pattern | 1: crate | none |

## `in.45` Tinker’s House

Diggory and Alison Pike. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | mending room | `wooden_table_02`, `brass_pan_01` x5 in a queue with name tags, a brazier | her two heaviest skillets by the door | 1: tool chest | daylight |
| back | kitchen | `woodentable_01`, 2 `folding_wooden_stool`, `Cauldron` | Goda's jug, empty, every evening | 1: cupboard | hearth only |
| upfront | their room | `gothicbed_01`, `treasure_chest` | his side: a heap; hers: squared | 1: chest | 1 wooden_candlestick |
| upback | empty | a cradle, new, under a cloth | not spoken of | 0 | none |
| cellar | cellar | `Bag` of charcoal, scrap in `wicker_basket_02` | empty | 0 | none |

## `in.51` Basketmaker’s House

Adda the Rushworker. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | workroom | rushes soaking in a trough, willow rods, baskets stacked (`wicker_basket_02` x6), a low stool | every chair seat in town, redone here once | 1: tool roll | hearth only |
| loft | loft | `gothicbed_01`, a rush mat, `treasure_chest` | her brother's key on a cord over the bed | 1: chest | none |

## `in.60` Garrick’s House

Mercy Garrick. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `woodentable_01`, 2 stools (one unused), nets across the room on pegs, `Cauldron` | a lamp in the shuttered window, trimmed | 1: chest | hearth, the window lamp (wooden_lantern_01) |
| loft | loft | `gothicbed_01`, a second bed kept made | a boy's knife with G cut in the handle | 1: box | none |

## `in.65` Ropemaker’s House

the Ropewalk: Ulric Ferrin by day. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | rope walk | the wheel, the top and sledge (trade set), hemp in bales, tar pot | forty feet of bell rope, tarred, never asked for | 1: tool chest | daylight |
| living | hackling room | hackle boards, hemp in `wicker_basket_02` x3 | Amice's stool by the wheel | 0 | none |
| yard | the long walk | posts and rails the length of the plot | a groove worn in the ground by thirty years of walking backwards | 0 | open |
| loft | rope loft | coils by size on pegs, tags | the old bell rope's twin, laid the same day | 1: locker | none |

## `in.66` Saddler’s House

Tybalt and Winifred Varrow. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | saddlery | stitching horse, saddle trees on the wall, awls on `Peg_Rack`, hides | the Elder's chair seat, half restitched | 1: tool chest | daylight, 1 wooden_lantern_01 |
| leg | harness room | collars, traces on pegs, `horse_head` brass | Edda's plough harness, done, tagged | 0 | none |
| living | kitchen | `woodentable_01`, 2 `painted_wooden_chair_01` (one with a cushion), `Cauldron` | beeswax in everything | 1: cupboard (Maren's tea) | hearth, 1 wooden_candlestick |
| yard | yard | a saddle rack in the sun, `wooden_bucket_02` | Kat's gate opposite | 0 | open |
| loft | loft | `gothicbed_01`, `treasure_chest`, a cradle he made of harness leather and ash | the cradle | 1: chest (small clothes) | 1 wooden_candlestick |

## `in.67` Bram’s House

Bram. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `gothicbed_01`, `woodentable_01`, 1 stool, `Cauldron`, `rusted_spade_01` | a row of apples on the sill, one for each he gave away today | 1: chest | hearth only |

## `in.70` Tailor’s House

Jocelyn Lindqvist. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | tailor's | cutting table (`wooden_table_02`), `Dummy` with a half coat, shears, bolts from his father | chalk measurements of half the town on the wall, by name | 2: thread chest, till | daylight, 1 brass_candleholders_c |
| back | kitchen | `painted_wooden_table`, 1 `painted_wooden_chair_01`, `Cauldron` | pins in the bread | 1: cupboard | hearth |
| upfront | fitting room | `ornate_mirror_01`, a stool, `Peg_Rack` of coats waiting | the Highfold wedding coats' patterns | 1: pattern chest | daylight |
| upback | his room | `gothicbed_01`, `classicnightstand_01` | a list headed THINGS BRIDGET LAUGHED AT, one entry | 1: nightstand | 1 wooden_candlestick |
| cellar | cellar | 2 `Crate_Wooden` of cloth ends | the shroud offcut | 1: crate | none |

## `in.74` Thorne House

Simon and Ned Thorne. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | hall | `woodentable_01`, 2 `painted_wooden_chair_01`, `Cauldron`, the same blue door as his brother's | a place still laid for his wife | 1: cupboard | hearth, 1 wooden_candlestick |
| pantry | pantry | shop seconds: dented `Bag`, a cracked `ceramic_pot` | what the store could not sell | 1: bin | none |
| chamber | Simon's room | `gothicbed_01`, `treasure_chest`, `Book_5` (accounts) | bills under the mattress | 1: chest | 1 wooden_candlestick |
| solar | Ned's room | a small bed, a wooden sword, a slate | a tally of races against Pip: he is losing | 0 | none |

## `in.75` Ferrin’s House

Ulric, Beatrix and Amice Ferrin. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room, curtained in two | 2 `gothicbed_01` behind the curtain, `woodentable_01`, 3 stools, `Cauldron`, Beatrix's pots on every shelf, rope coils under the eaves | no two cups alike: all seconds | 2: chest, crock shelf | hearth, 1 wooden_candlestick |

## `in.77` Wheelwright’s House

Miles and Kat Ashdown. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | wheelwright's shop | wheel pit, spoke horse, felloes stacked, a wheel half built, mallets on `Peg_Rack` | a turnip cart with one new wheel: it carried the dead man | 1: tool chest | daylight |
| living | kitchen | `woodentable_01`, 2 `painted_wooden_chair_01`, `Cauldron` | Kat's account book, the only tidy thing | 1: desk box | hearth, 1 wooden_candlestick |
| yard | tyring yard | the tyring platform, cart, seasoning elm | scorch rings on the stones | 0 | open |
| loft | loft | `gothicbed_01`, `treasure_chest`, `classicnightstand_01` | a jar of Tamsin's honey, labelled in her hand | 1: chest | 1 wooden_candlestick |

## `in.82` Tamsin’s House

Tamsin Ashdown. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `gothicbed_01`, `painted_wooden_table` with pen and `Book_5`, wax cakes, straw skeps mending, `Cauldron` | a bundle of answers from the hunter, tied with heather | 2: chest, writing box | hearth, 2 wooden_candlestick of her own wax |

## `in.90` Woodcutter’s House

Jasper Holt. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `woodentable_01`, a stool, `wooden_axe_03` x2 on pegs, `Cauldron`, a chopping block | a map of the wood burned into the table top, the north side blank | 1: chest | hearth only |
| loft | loft | `gothicbed_01`, furs | a dog's blanket | 0 | none |

## `in.93` Shepherd’s House

Warin Shaw. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | one room | `gothicbed_01`, `woodentable_01`, a crook, fleeces baled, a dog's bowl, `Cauldron` | Emmeline's wedding ribbon nailed over the door | 1: chest | hearth only |

## `in.94` Pell House

Ysolt, Davy and Lambert Pell (Tobin on Sundays). Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | kitchen and wash house | `woodentable_01`, wash tubs (`wooden_bucket_01` x3), a mangle, lines across the room, Lambert's chair by the DOOR not the fire | a miner's pick over the lintel, inside | 1: linen press (the Hart's sheets) | hearth, 1 wooden_candlestick |
| loft | loft | `gothicbed_01` (Ysolt), 2 pallets (Davy; Tobin's kept made), Lambert's cot by the stair | a brass tally token on a nail: OM 15 | 1: chest (Dunstan's Sunday coat, fifty years folded) | none |

## `in.111` Butcher’s House

Humphrey and Hester Slate. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | butcher's | the block, hooks, `gen_counter`, scales, `bull_head` over the door | Ellen Marsh's smoked trout on the end of the counter | 2: meat safe (the player buys), till | daylight |
| back | kitchen | `woodentable_01`, 2 `painted_wooden_chair_01`, `Cauldron` always on | two cleavers hung side by side | 1: cupboard | hearth, 1 wooden_candlestick |
| upfront | their room | `gothicbed_01`, `treasure_chest`, `classicnightstand_01` | a letter from Hale about the lane, used as a bookmark | 1: chest | 1 wooden_candlestick |
| upback | sausage room | a table, casings, spice from Elinor | do not ask | 1: spice box | none |
| cellar | cold cellar | hooks, 2 `Barrel` of brine, sawdust | Fulk's share of hides, stacked for him | 1: salt bin | none |

## `in.113` Carpenter’s House

Randal Byrd, Old Wenn. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| work | boat shed | a hull on stocks, steam box, planks, adzes on `Peg_Rack` | every plank numbered in two hands | 1: tool chest | daylight |
| living | kitchen | `woodentable_01`, 2 chairs: `rockingchair_01` (Wenn's) to the fire, `Cauldron` | a board of keys with tags, one hook empty | 1: key box | hearth, 1 wooden_candlestick |
| yard | slip | the slip to the water, a boat upturned, tar pot | twenty boat names cut in the fence | 0 | open |
| loft | the locked loft | 2 `gothicbed_01`, `ship_pinnace` models, half models on the wall | the half model of the boat a woman built | 2: chest, model box | 1 wooden_candlestick |

## `in.115` Brewer’s House

Goda and Bridget Malkin. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | ale room | 2 `woodentable_01` with benches, a hatch, `Mug` rows, the ale-stake brought in at night | a slate of who has not paid, Diggory first | 1: mug cupboard | hearth, 1 wooden_lantern_01 |
| service | brewhouse | copper (`Cauldron`, large), mash tun, paddle six feet long, `wooden_bucket_01` x4 | the paddle | 1: malt bin | copper fire |
| passage | cross passage | `Barrel` x3 ready to go out, a hand cart | Laurence's chalk on every head | 0 | none |
| buttery | buttery | 3 `wine_barrel_01` on stillage, jugs | Alison Pike's jug, named | 1: jug shelf | none |
| parlour | parlour | `painted_wooden_table`, 2 `painted_wooden_chair_01`, `spinning_wheel_01` | Bridget's Friday shawl, by the back door | 1: cupboard | 1 wooden_candlestick |
| solar | Goda's room | `gothicbed_01`, `treasure_chest` | her husband's miner's boots, his father's before | 1: chest | 1 wooden_candlestick |
| landing | landing | a linen press, a window to the Hart | she can see who goes in | 1: press | none |
| chamber | Bridget's room | `gothicbed_01`, `painted_wooden_cabinet`, `ornate_mirror_01` | a tape measure left behind by a tailor | 1: cabinet | 1 wooden_candlestick |

## `in.116` Glover’s House

Petronel Vey. Light tier 1.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| shop | glover's | cutting board, glove trees (hands of wood) in a row, `gen_counter` | a pair cut for Maren, unpaid for by agreement | 2: glove drawers (the player buys), till | daylight |
| back | kitchen | `painted_wooden_table`, `rockingchair_01` to the fire, `Cauldron` | shears on the mantel | 1: cupboard | hearth, 1 wooden_candlestick |
| upfront | her room | `gothicbed_01`, `gothiccabinet_01` | her husband's gloves, his last pair, on the stand | 1: cabinet | 1 wooden_candlestick |
| upback | skin room | Fulk's kid skins on frames | the window open, always | 1: bin | none |
| cellar | cellar | 1 `wine_barrel_01`, alum in `ceramic_pot` | empty | 0 | none |

## `high.a` Highfold: the Reeve’s House

Jordan and Basilia Wold. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| room | the Reeve's one room | `gothicbed_01`, `woodentable_01` (long), 4 stools, the tally post's notched sticks in a rack, `Cauldron`, cheeses | forty borrowed trenchers (carved_wooden_plate) in stacks, and wedding cake | 2: chest, cheese safe | hearth, 1 wooden_candlestick |

## `high.c` Highfold: the Shepherd’s House

Kester and Rosalind Wold. Light tier 0.

| Room | Use | Furniture | Only here | Containers | Light |
|---|---|---|---|---|---|
| hall | hall | `woodentable_01`, 2 stools, `Cauldron`, a crook | garlands drying over the hearth | 1: cupboard (wedding gifts, unopened) | hearth only |
| pantry | pantry | 1 `Barrel`, `ceramic_pot`, a ham | his mother's cheese, a great deal of it | 1: crock | none |
| chamber | their room | `gothicbed_01`, `treasure_chest` | the coat with a split seam | 1: chest | 1 wooden_candlestick |
| solar | upper room | empty but for a `painted_wooden_chair_01` at the window that looks down the valley | the chair | 0 | none |

## Things named above that have no kit piece yet

cradle, pallet or small bed, cot, curtain, mangle and wash lines, loom, slate board and slates, pews and altar (exist as generated pieces), trap door for a cellar hatch, bench (indoor), churn, scales, shears and yardstick, glove trees, lasts, vice and files, dipping frame, steam box and hull on stocks, shaving horse and staves, stitching horse and saddle tree, spoke horse and wheel pit, banker and headstones, hackle boards, kneading trough and peels, the butcher's block and hooks, drying frames and racks, toy boat, wooden sword, dust sheets, a mattress-less bed frame, herb bunches, key board.

Many of the trade ones exist as generated geometry in the trade sets; the rest need a piece or the line cut. None should be faked with a barrel.
