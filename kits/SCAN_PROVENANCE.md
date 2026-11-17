# Scanned assets: where they come from

Everything in `scan.glb` comes from [Poly Haven](https://polyhaven.com), which publishes all of its assets under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/): public domain, free for any use, no attribution required. Credit is given here anyway.

The models were downloaded as glTF at 1k through the public API (`https://api.polyhaven.com/files/<id>`), converted by `tools/scan/convert.mjs` and cut down to a
phone-sized pack by `tools/scan/slim.mjs` (list and budgets in `tools/scan/slim.txt`): welded, simplified, positions and normals quantized, textures WebP at 512 px
(1024 px colour for the bed, bookshelf and trestle table). Sets that hold several objects were split earlier (`_a`, `_b`, ...); only the listed ones are in the pack.

## Models

| Poly Haven id | Page | Authors | Category | Objects in the pack |
|---|---|---|---|---|
| wine_barrel_01 | https://polyhaven.com/a/wine_barrel_01 | James Ray Cock | container | wine_barrel_01 |
| wooden_barrels_01 | https://polyhaven.com/a/wooden_barrels_01 | James Ray Cock | container | wooden_barrels_01_a |
| treasure_chest | https://polyhaven.com/a/treasure_chest | Rico Cilliers | container | treasure_chest |
| wicker_basket_02 | https://polyhaven.com/a/wicker_basket_02 | Kuutti Siitonen | container | wicker_basket_02 |
| wooden_bucket_01 | https://polyhaven.com/a/wooden_bucket_01 | James Ray Cock | container | wooden_bucket_01 |
| wooden_bucket_02 | https://polyhaven.com/a/wooden_bucket_02 | James Ray Cock | container | wooden_bucket_02 |
| ceramic_pot | https://polyhaven.com/a/ceramic_pot | Aron Łyczek | prop-small | ceramic_pot |
| ceramic_vase_04 | https://polyhaven.com/a/ceramic_vase_04 | James Ray Cock | prop-small | ceramic_vase_04 |
| ceramic_vase_02 | https://polyhaven.com/a/ceramic_vase_02 | James Ray Cock | prop-small | ceramic_vase_02 |
| carved_wooden_plate | https://polyhaven.com/a/carved_wooden_plate | Jan Martens | prop-small | carved_wooden_plate |
| wooden_bowl_01 | https://polyhaven.com/a/wooden_bowl_01 | Oliver Harries | prop-small | wooden_bowl_01 |
| brass_goblets | https://polyhaven.com/a/brass_goblets | Tina | prop-small | brass_goblets |
| food_apple_01 | https://polyhaven.com/a/food_apple_01 | Oliver Harries | food | food_apple_01 |
| food_pears_asian_01 | https://polyhaven.com/a/food_pears_asian_01 | Amal Kumar | food | food_pears_asian_01 |
| yellow_onion | https://polyhaven.com/a/yellow_onion | Kuutti Siitonen | food | yellow_onion |
| hamburger_buns | https://polyhaven.com/a/hamburger_buns | Alexander Shulha | food | hamburger_buns_a |
| brass_candleholders | https://polyhaven.com/a/brass_candleholders | Tina | light-source | brass_candleholders_c |
| wooden_candlestick | https://polyhaven.com/a/wooden_candlestick | Josh Dean | light-source | wooden_candlestick |
| wooden_lantern_01 | https://polyhaven.com/a/wooden_lantern_01 | James Ray Cock | light-source | wooden_lantern_01 |
| painted_wooden_table | https://polyhaven.com/a/painted_wooden_table | Kirill Sannikov | prop-furniture | painted_wooden_table |
| wooden_table_02 | https://polyhaven.com/a/wooden_table_02 | Serhii Khromov | prop-furniture | wooden_table_02 |
| WoodenTable_01 | https://polyhaven.com/a/WoodenTable_01 | Ethan Place | prop-furniture | woodentable_01 |
| painted_wooden_stool | https://polyhaven.com/a/painted_wooden_stool | Kirill Sannikov | prop-furniture | painted_wooden_stool |
| painted_wooden_chair_01 | https://polyhaven.com/a/painted_wooden_chair_01 | Kuutti Siitonen | prop-furniture | painted_wooden_chair_01 |
| wooden_bookshelf_worn | https://polyhaven.com/a/wooden_bookshelf_worn | Ulan Cabanilla | prop-furniture | wooden_bookshelf_worn |
| painted_wooden_shelves | https://polyhaven.com/a/painted_wooden_shelves | Kirill Sannikov | prop-furniture | painted_wooden_shelves |
| GothicBed_01 | https://polyhaven.com/a/GothicBed_01 | Kirill Sannikov | prop-furniture | gothicbed_01 |
| painted_wooden_cabinet | https://polyhaven.com/a/painted_wooden_cabinet | Kirill Sannikov | prop-furniture | painted_wooden_cabinet |
| wooden_axe_03 | https://polyhaven.com/a/wooden_axe_03 | Ulan Cabanilla | tool | wooden_axe_03 |
| rusted_spade_01 | https://polyhaven.com/a/rusted_spade_01 | Blemonade | tool | rusted_spade_01 |
| picke_dirty_01 | https://polyhaven.com/a/picke_dirty_01 | Dennis Halbeck | tool | picke_dirty_01 |
| cross_pein_hammer | https://polyhaven.com/a/cross_pein_hammer | Tics | tool | cross_pein_hammer |
| wooden_ladder | https://polyhaven.com/a/wooden_ladder | Miroslav Turura | tool | wooden_ladder |
| spinning_wheel_01 | https://polyhaven.com/a/spinning_wheel_01 | Sofia Pahaoja | tool | spinning_wheel_01 |
| kite_shield | https://polyhaven.com/a/kite_shield | Ulan Cabanilla | weapon | kite_shield |
| rock_moss_set_02 | https://polyhaven.com/a/rock_moss_set_02 | Kless Gyzen | rock | rock_moss_set_02_a, rock_moss_set_02_c, rock_moss_set_02_g |
| rock_moss_set_01 | https://polyhaven.com/a/rock_moss_set_01 | Kless Gyzen | rock | rock_moss_set_01_e |
| tree_stump_01 | https://polyhaven.com/a/tree_stump_01 | Rob Tuytel | ground-cover | tree_stump_01 |
| tree_stump_02 | https://polyhaven.com/a/tree_stump_02 | Rob Tuytel | ground-cover | tree_stump_02 |
| pine_roots | https://polyhaven.com/a/pine_roots | Rob Tuytel | ground-cover | pine_roots_a |
| dry_branches_medium_01 | https://polyhaven.com/a/dry_branches_medium_01 | Rico Cilliers | ground-cover | dry_branches_medium_01_a |
| dead_tree_trunk | https://polyhaven.com/a/dead_tree_trunk | Rob Tuytel | ground-cover | dead_tree_trunk |
| fern_02 | https://polyhaven.com/a/fern_02 | Rico Cilliers, Rob Tuytel | plant | fern_02_a |
| weed_plant_02 | https://polyhaven.com/a/weed_plant_02 | Rico Cilliers, Rob Tuytel | plant | weed_plant_02_a |
| ship_pinnace | https://polyhaven.com/a/ship_pinnace | James Ray Cock, Nicolò Zubbini, Rico Cilliers, Yann Kervran | decor | ship_pinnace |
| mantel_clock_01 | https://polyhaven.com/a/mantel_clock_01 | Rico Cilliers, Yann Kervran | decor | mantel_clock_01 |
| horse_head | https://polyhaven.com/a/horse_head | Tina | decor | horse_head |
| bull_head | https://polyhaven.com/a/bull_head | Tina | decor | bull_head |
| carved_wooden_elephant | https://polyhaven.com/a/carved_wooden_elephant | Greg Zaal | decor | carved_wooden_elephant |
| seadogs_compass | https://polyhaven.com/a/seadogs_compass | Benny Weimer | prop-small | seadogs_compass |
| chess_set | https://polyhaven.com/a/chess_set | Riley Queen | prop-small | chess_set |
| marble_bust_01 | https://polyhaven.com/a/marble_bust_01 | Rico Cilliers | decor | marble_bust_01 |
| ornate_mirror_01 | https://polyhaven.com/a/ornate_mirror_01 | James Ray Cock | decor | ornate_mirror_01 |
| Rockingchair_01 | https://polyhaven.com/a/Rockingchair_01 | Jorge Camacho | prop-furniture | rockingchair_01 |
| GothicCabinet_01 | https://polyhaven.com/a/GothicCabinet_01 | Kirill Sannikov | prop-furniture | gothiccabinet_01 |
| ClassicNightstand_01 | https://polyhaven.com/a/ClassicNightstand_01 | Kirill Sannikov | prop-furniture | classicnightstand_01 |
| round_wooden_table_01 | https://polyhaven.com/a/round_wooden_table_01 | Ulan Cabanilla | prop-furniture | round_wooden_table_01 |
| folding_wooden_stool | https://polyhaven.com/a/folding_wooden_stool | Ulan Cabanilla | prop-furniture | folding_wooden_stool |
| brass_pan_01 | https://polyhaven.com/a/brass_pan_01 | Rico Cilliers | prop-small | brass_pan_01 |

Light copies for the Low tier: `node tools/scan_low.mjs 0.28` adds a node `<name>@low` beside 15 of these models (the ones that stand out of
doors in numbers: the stall table, vases, pot, apple, pears, loaf, buckets, bowl, plate, barrels, basket, chest), each the same CC0 model with about a third
of its triangles (meshoptimizer). Nothing else in the file changes; run `node tools/assets_pack.mjs --only kits` afterwards.
