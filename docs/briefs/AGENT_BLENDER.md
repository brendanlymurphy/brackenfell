# Brief: the Blender session (assets for Brackenfell)

You run on the owner's Mac with Blender open and the Blender connector on. You make and fit the models the game needs so that nothing a person recognises is built from code primitives. The game is a first-person medieval village in the browser (Three.js); realistic, Skyrim or Riften in look. Repo `brendanlymurphy/brackenfell`, branch `threejs`; read `AGENTS.md` and the newest entry of `docs/inbox/BLENDER.md` first, report in `docs/reports/BLENDER.md` on your own branch `fork-assets`.

## What an asset is
- A `.glb` under `kits/assets/<name>.glb`: true scale in metres, +Y up, origin on the ground at the middle of the footprint, facing +Z; one mesh per material, at most 3 materials; textures at most 1024 px (512 for small things), base colour + normal + ORM, no emissive unless it glows.
- Two levels of detail in the file: `<name>` (within 12 m; props under 3k triangles, large things under 8k) and `<name>_far` (under a quarter of that). Smooth normals where the thing is round; hard edges where it is cut timber or stone.
- A line in `kits/assets/ASSETS.md`: name, size, triangles, source (made here / Poly Haven / other), author, licence (CC0, or CC-BY with the link), date.
- Sources: make it yourself; or fit a CC0 or CC-BY model or scan (Poly Haven first). Nothing non-commercial, ripped or unclear.

## The bar
Each asset is rendered in Blender at 0.6 m, 3 m and 6 m beside a 1.75 m figure under a noon sun and under a single warm lamp, on one sheet `docs/proof/assets/<name>.jpg`. It must read as the thing at all three. Wood has grain along its length and worn edges; iron is dark; cloth sags; nothing is a pure colour; nothing is a ball, a box or a tube with a texture on it. If it does not pass, it does not go in.

## First list (things the game now builds from code, in the slice the owner walks)
1. A clinker rowing boat (whole) and the same boat half built on trestles.
2. A hand cart and a market barrow.
3. Fish: one split dried fish, a string of them on a rack.
4. A log pile, a chopping block with an axe.
5. Bread, cheese, apples, cabbages (market stalls and kitchens).
6. Pottery: three jars, a jug, a bowl; two glass bottles.
7. A wash line with a shirt, a sheet and hose.
8. A beehive (skep) on a stand, a hen coop, a pig trough, a water butt.
9. A tenter frame with cloth; bolts of cloth and folded cloth.
10. A bench, a stool, a trestle table that are better than the kit's where the kit's are plain.
Animals are another session's job.

## How it reaches the game
You only add files under `kits/assets/` and `docs/`. The coordinator wires an asset into the game (a loader for `kits/assets/*.glb` and the placement) once its sheet has been looked at. Commit after every asset; never touch `src/`.
