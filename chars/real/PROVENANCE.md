# Where the realistic people come from

`chars/real/` holds the 'real' character set: 21 people (17 villagers, 4 outlaws) and one shared clips file. Every person was built by
`tools/humans/` (Blender 5.3 as a Python module, the MPFB2 add-on, MakeHuman assets), then optimised with `tools/humans/post.mjs`
(glTF-Transform, meshoptimizer, sharp). Nothing was paid for and no account was used.
The body shapes, skins, hair and clothes are all assets that MakeHuman and its community publish as CC0 1.0. Animation is the CC0 Quaternius /
Mesh2Motion clip set that `chars/PROVENANCE.md` describes, retargeted onto the MakeHuman rig by `tools/humans/retarget.py`.

Build tools (not shipped, not part of the game): Blender 5.3 (GPL), MPFB2 (GPL add-on; its output is not covered by its code licence), glTF-Transform (MIT),
meshoptimizer (MIT), sharp (Apache-2.0), Pillow, numpy.

## Licence statement for the MakeHuman assets

"Assets are per default released as CC0" and targets, proxies and the base mesh are "covered by CC0": MakeHuman Community, *What changed regarding
the license in 2020?*, https://static.makehumancommunity.org/oldsite/faq/what_changed_regarding_the_license_in_2020.html.
Every asset below is also listed with licence CC0 on its MakeHuman Community asset-pack page (https://static.makehumancommunity.org/assets/assetpacks.html,
the packs named in the table) and, for the later downloads, in the pack's own `packs/<pack>.json` ("license": "CC0").

**Please check this one point before shipping outside this project:** the copies of `wdg_mycenaean_tunic`, `elvs_double_mh_braid`,
`elvs_unkempt_french_braid` and `rehmanpolanski_hair_bun_brown` that came with the MPFB2 data (Debian `makehuman-data` package) still carry a
legacy `license AGPL3` line in their `.mhclo` header, and the MakeHuman system assets (base mesh, skins, `short01`..`short04`, `bob02`, `braid01`,
`ponytail01`, eyes, eyebrows) carry the old AGPLv3 header text from before the 2020 change. The asset-pack pages and the 2020 statement above say CC0
for all of them, which is why they are used, but the headers disagree. If that matters, drop those four items (the tunic is the only plain tunic,
so it matters for the women) or ask the MakeHuman team.

## Sources

| Used for | Asset (folder in MPFB2 `data/`) | Author | Licence | Pack / where from |
| --- | --- | --- | --- | --- |
| Body shape (macro targets), rig `game_engine`, UV, helper-free base mesh | MakeHuman base mesh, targets, proxies | MakeHuman Team | CC0 | `makehuman_system_assets` pack; MPFB2 data |
| Skins: `young_*`, `middleage_*`, `old_*` (caucasian, african, asian, male and female, 10 of them used) | `skins/*` | MakeHuman Team | CC0 | `makehuman_system_assets` |
| Skins `jartur69_middleage_slavic_male...`, `jartur69_old_slavic_male...` (beard painted in) | `skins/jartur69_*` | jartur69 | CC0 | `skins02` |
| Eyes (low-poly mesh; blue, brown, green, grey irises), eyebrows `eyebrow001`, `eyebrow006` | `eyes/`, `eyebrows/` | MakeHuman Team | CC0 | `makehuman_system_assets` |
| Hair `short01`..`short04`, `bob02`, `braid01`, `ponytail01` | `hair/*` | MakeHuman Team | CC0 | `makehuman_system_assets` |
| Hair `cortu_short_messy_hair` | `hair/` | Cortu | CC0 | `hair01` |
| Hair `elvs_double_mh_braid`, `elvs_unkempt_french_braid` | `hair/` | Elvaerwyn | CC0 (header says AGPL3, see above) | `hair01` |
| Hair `rehmanpolanski_hair_bun_brown` | `hair/` | Rehman Polanski | CC0 (header says AGPL3, see above) | `hair01` |
| Monk robe with hood up, hood down, no hood (`donitz_monk_robe`, `_hood`, `_hood_down`) | `clothes/` | Donitz | CC0 | `suits02` |
| Tunic, trousers, boots (`rehmanpolanski_viking_tunic`, `_pants`, `_boots`) | `clothes/` | Rehman Polanski | CC0 | `suits02` |
| `toigo_wool_pants`, `toigo_long_full_skirt`, `toigo_ankle_boots_female`, `toigo_bodice_dress_with_lace_ruffle_skirt` | `clothes/` | Margaret Toigo (MRT) | CC0 | `pants01`, `skirts01`, `dress01` |
| `culturalibre_male_boots` | `clothes/` | culturalibre | CC0 | MPFB2 data |
| `wdg_mycenaean_tunic` | `clothes/` | WDG | CC0 (header says AGPL3, see above) | `dress01` |
| Hoods `culturalibre_hero-heroine_hood_1`, `_hood_2` (the outlaws) | `clothes/` | culturalibre | CC0 | `masks01`, https://files.makehumancommunity.org/asset_packs/masks01/masks01_cc0.zip, sha256 `868e0e92…` |
| 48 animation clips | Quaternius Universal Animation Library clips via Mesh2Motion | Quaternius, Mesh2Motion contributors | CC0 | see `chars/PROVENANCE.md` |
| Face morph targets (15 Oculus visemes, jawOpen, brows, smile) | `visemes02` and `faceunits01` MakeHuman functional packs | Mika Suominen / MakeHuman Community | CC0 | https://files.makehumancommunity.org/functional/visemes02.zip (sha256 `a69ab6fb95ddd5f56f70acc7e859f5f9c6ae613c527d577ea1571eff2183d29e`), https://files.makehumancommunity.org/functional/faceunits01.zip (sha256 `d113107bd7eb59f3af4df6fc0ec29bfcc593f496d0b336aec14f086a80ce7146`); baked by `tools/humans/visemes_table.py` into `visemes.png`/`visemes.json` |
| Mouth-shape tracks (`c` in `audio/voice/manifest.json`) | Rhubarb Lip Sync (wasm build `rhubarb-lip-sync-wasm`) run by `tools/voice/visemes.mjs` | Daniel Wolf | MIT | the tool is not shipped; its output is data |
| Wardrobe (belts, pouches, aprons, straps, cloaks, hats, cuffs, tabard, kettle hat) | modelled procedurally by `tools/humans/garb.py` | this project | n/a | no outside asset |

All textures were re-graded (tint, saturation) and resized by `gen.py` and `post.mjs`; those are changes to CC0 material and need no credit.

## Files

| File | What |
| --- | --- |
| `m_*.glb`, `f_*.glb` | The 17 villagers, one body each: mesh (body, eyes, eyebrows, hair, clothes as separate materials), 53-joint MakeHuman `game_engine` skeleton, one 1024 px skin, 512-1024 px cloth and hair textures (WebP), no normal maps, no clips. 6k to 10k triangles each. `m_boy` and `f_child` are children, the rest adults of various age, build and skin tone. |
| `o_hood_m.glb`, `o_hood_f.glb`, `o_brute.glb`, `o_rogue.glb` | The outlaws (hooded man and woman in dark wool and leather, a bearded brute that is also the camp leader with a red tint, a rogue). Loaded on demand by `Chars.ensure`. |
| `clips.glb` | 48 clips on the rest pose of `m_smith.glb`, 30 fps, thinned: idle (4), talk, walk (2), jog, sprint, sit (3), sleeping, hammering, guitar-playing (stands in for a lute), pray, polearm, lantern, farm and dig work, chop, clap, victory, greeting, nod, interact, pick-up, open-door, kneel, one-hand sword idle, three sword attacks and a combo, block, draw, two hit reactions, two deaths, jump (3), dodge, back-step, strafe left and right. The game fits them to each body at load time (`clipFor` in `src/49_chars.js`). |

Rebuild: `tools/humans/run_all.sh <work dir> <out dir>` (bodies, see `specs.json`), then
`python -I tools/humans/retarget.py <body.glb> <raw clips.glb> chars/q_clips.glb:<clip>[=<name>],...` and `node tools/humans/clips_post.mjs <raw> chars/real/clips.glb`.
