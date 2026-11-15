# Where the character files come from

Everything in this folder is built from public-domain (CC0 1.0) sources by `tools/chars.mjs` (meshes, clips) and
`tools/chars_tex.py` (textures). Nothing was paid for and no account was used; the two itch.io packs are the free
"Standard" tiers, fetched with `tools/fetch_itch.py`.

## Sources

| Used for | Pack | Author | Licence | Fetched from | Archive (sha256, size) |
| --- | --- | --- | --- | --- | --- |
| Outfits (peasant, ranger), regular male and female bodies under them | Modular Character Outfits - Fantasy [Standard] | Quaternius | CC0 1.0 (`License_Standard.txt` in the archive) | https://quaternius.itch.io/modular-character-outfits-fantasy | `c3468b18…95187f70`, 294 MB |
| Heads, eyes, eyebrows, hair, beard | Universal Base Characters [Standard] | Quaternius | CC0 1.0 (`License.txt` in the archive) | https://quaternius.itch.io/universal-base-characters | `fdbf1804…08455f40`, 129 MB |
| Animation clips (on the Quaternius universal rig) | Mesh2Motion asset library, `static/assets/human/animations/` | Scott Petrovic and contributors; the human clips derive from Quaternius' Universal Animation Library | CC0 1.0 (`LICENSE-CC0.MD`: "All 3d models, blend files, rigs, animations") | https://github.com/Mesh2Motion/mesh2motion-app at commit `5d6918ef` | git clone, 118 MB |

Also downloaded and looked at, not shipped:

- Universal Animation Library 1 and 2 [Standard] (Quaternius, CC0), from opengameart.org. Library 1's free file is on an
  older skeleton with different joint names, and the Mesh2Motion set already holds the same motions on the current
  skeleton, so the clips come from there.
- Mesh2Motion's own human models: bare mannequins, modern "PSX" people, and Sintel, Jay and the bunny, which are
  CC-BY (Blender Studio), not CC0.
- dramatis (github.com/tonioloewald/dramatis3d): MakeHuman bodies (CC0) on the same skeleton, modern clothes only.
- KayKit Adventurers (CC0): rejected for style.

## Files

| File | What | Size |
| --- | --- | --- |
| `q_male.glb`, `q_female.glb` | Every part of one body as separate meshes on one skeleton and one skin: `Peasant_Body/Arms/Legs/Feet`, `Ranger_Body/Arms/Arms_Bracer/Body_Belt_1/Body_Belt_2/Legs/Feet/Head_Hood/Pauldrons`, `HeadSkin`, `Eyes`, `Brows`, `Hair_Buns/Buzzed/Long/SimpleParted` (+ `Hair_Beard` for the male). No textures inside; materials carry the pack's names (`MI_Peasant`, `MI_Ranger`, `MI_Regular_Male/Female`, `MI_Skin_Head`, `MI_Hair_1/2`, `MI_Eyes`). | 1.5 MB each |
| `q_clips.glb` | 55 clips, 15 keys a second, skinned joints only: the villagers' daily animations plus a sword, bow, jump, hit and death set for later. | 1.4 MB |
| `q_peasant.webp`, `q_peasant2.webp`, `q_ranger.webp`, `q_ranger3.webp` | Outfit colour atlases and the pack's alternative colourways, 1024 px | 42-70 KB |
| `q_peasant_n.webp`, `q_ranger_n.webp` | Outfit normal maps (OpenGL convention), 1024 px | 110-125 KB |
| `q_skin_m.webp`, `q_skin_f.webp`, `q_head_m.webp`, `q_head_f.webp` | Skin for hands and heads | 10-28 KB |
| `q_hair1.webp`, `q_hair2.webp`, `q_eye.webp` | Grey hair atlases (tinted per villager), eye | 2-20 KB |

## What the build changes

- The packs ship each outfit piece, hair style and base body as its own file with its own bind pose. The build moves every
  piece into the outfit body's bind pose and puts them on one skin, so a villager is one skeleton and a few merged meshes.
- The free base-character tier only has the muscular "Superhero" full bodies. Only their heads are used (the part skinned
  to the head and neck joints); the bodies under the clothes are the outfits' own "Regular" ones.
- The female peasant arms ship with the hands on the cloth material although they are mapped for the skin texture; the
  build splits the hands off onto the skin material.
- Meshes are simplified to about 60 %, normals, texture coordinates and weights are quantised; textures are resized from
  2048-4096 px PNG to WebP.
- Clips are resampled to 15 keys a second, lose their scale tracks and all translation except the hips', and one joint is
  renamed (`head` to `Head`) to match Quaternius' spelling. At load time each clip is fitted to the male and female rest
  poses (see `clipFor` in `src/49_chars.js`).
