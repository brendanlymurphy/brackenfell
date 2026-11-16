# Scanned trees: where they come from

`trees.glb`, `trees_far.webp` and `TREES.json` are built from [Poly Haven](https://polyhaven.com) models. Poly Haven publishes all of
its assets under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/): public domain, free for any use, no attribution
required. The sources are recorded here so the origin of every file can be checked.

| In the game | Poly Haven id | Page | Used for |
|---|---|---|---|
| `fir_b`, `fir_c` | fir_tree_01 (objects `_b`, `_c`) | https://polyhaven.com/a/fir_tree_01 | the conifer forest |
| `pine_c` | pine_tree_01 (object `_c`) | https://polyhaven.com/a/pine_tree_01 | the conifer forest (the tallest quarter) |
| `broadleaf_small` | tree_small_02 | https://polyhaven.com/a/tree_small_02 | the autumn broadleaves that replace the generated birches |

Author names are on each asset's page; they could not be looked up from the build machine (no access to polyhaven.com there).
Baked but not shipped yet (in `tools/scan/_bake`): `fir_a`, `pine_b`, `fir_sapling` (fir_sapling), `pine_sapling` (pine_sapling_small).

## How they are built

1. `tools/scan/trees.sh <download dir> <cache dir>`: for each line of `tools/scan/trees.txt`, `tree_prep.py` groups the scan's foliage
   into clusters and lays one card over each, `tree_bake.mjs` draws the real foliage onto the cards' atlas, `tree_post.py` makes the
   atlas usable with alpha testing, `trees.mjs` simplifies the wood and writes one compact model per tree into the cache.
   The intermediate results of these steps go to `tools/scan/_bake` (200 MB: raw atlases and point clouds), so step 2 can be rerun without
   the original downloads. That folder was tracked until Build 59 and is no longer (it was a third of every checkout and was being
   deployed to the live site). To get it back: `git fetch origin 65f45a3 && git checkout 65f45a3 -- tools/scan/_bake && git rm -r -q --cached tools/scan/_bake`.
2. `node tools/scan/trees.mjs tools/scan/_bake <cache dir> <names>` then
   `TREE_ATLAS=2048 TREE_KEEP=0.17 TREE_GROW=2.05 node tools/scan/tree_pack.mjs <cache dir> kits fir_b fir_c pine_c broadleaf_small`
   writes the three shipped files: wood simplified to about 700 triangles (90 for the far model), the far model's foliage made from a
   quarter of the near cards enlarged, atlases as WebP at 2048 (the game halves them on phones and on the Low and Medium tiers), and
   the flat stand-in pictures drawn by a small software rasteriser.

The game side is `src/74b_trees.js`.
