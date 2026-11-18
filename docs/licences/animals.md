# Animals: sources and licences

Every animal in `kits/animals/` with where it came from. Realistic models only; CC0, or CC-BY with the author and link recorded here.
Packed by `tools/animals/pack.mjs` (one skinned mesh, one atlas as WebP, a light copy `@far`, only the clips the game plays, meshopt).
Placed by `src/78_animals.js`.

| File | Animal | Name at source | Author | Source page | Licence | Fetched | What was changed |
|---|---|---|---|---|---|---|---|
| `kits/animals/hen.glb` | hen | Chicken (animated), `chicken_0.zip` (`chickenV2.blend`, `textures/UV-Texture.png`, `textures/ChickenNorm.png`) | Čestmír Dammer (made for the Kelgar project); the colour texture is derived from photos by Rick Hoppmann (the archive's `license.txt`) | https://opengameart.org/content/chicken-animated | CC0 (page and `license.txt`) | 2026-11-18 | Exported from Blender 5.3 to glTF, scaled to 0.40 m at the comb; the sculpt-reference cylinder, camera and lamps removed; the three parts (body, comb, eyes) joined into one mesh on the one atlas; textures to WebP 1024; a 650-triangle copy for distance; clips kept: Walk, Idle1, Idle2, Stand, Pecking1, Eating (Dying, BeginPecking, EndPecking, StopPecking, Pecking2/3 and the 1186-frame Idle dropped). |

## Looked at and not taken

| Animal | Where | Why not |
|---|---|---|
| pig | Sketchfab: "Piglet" (sgrosjean, CC-BY, rigged, realistic); the other realistic pigs there | Sketchfab downloads need a signed-in account (the API answers 401 without one); the inbox says to stop at a login. |
| pig | OpenGameArt "Pig", "Low Poly Pig", Quaternius farm pack (CC0) | cartoon or low-poly look |
| pig | Poly Haven | none: its animals are statues and a rat |
| sheep | OpenGameArt "Sheep" (CC0) | cartoon; "Sheep (rigged, textured and animated)" is CC-BY-SA, not allowed |
| horse | OpenGameArt "Rigged Horse" (Lyndon Daniels, CC0) | realistic, rigged: a candidate for later (order: ox and horse last) |
| cow | OpenGameArt "Realtime Rancher's 3D Model Pack" (Lyndon Daniels, CC0) | realistic, not rigged: a candidate for later (stills) |
