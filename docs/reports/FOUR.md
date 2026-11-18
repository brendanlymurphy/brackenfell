# Reports: Agent Four (fork-ch1)

## 2026-11-18 (item 7: animals, candidates only; none added)

**No candidate passes; nothing added. Decision needed from you:** allow the hosts below, or accept no animals for now.

The brief asks for realistic CC0 animals (pig, hen, goose, dog, cat, sheep, ox, horse) reachable from GitHub or npm. Searched GitHub
code and repositories by file name and by topic.

| Candidate | Licence | Why it fails |
|---|---|---|
| `ir-engine/ir-engine-assets-basic` `assets/animals/` Horse, Cow, Pig, Chicken | CPAL-1.0 (repository licence) | Not CC0. The files are Git LFS pointers, so not fetchable from raw GitHub. |
| KhronosGroup `glTF-Sample-Assets` Fox | mesh CC0 (PixelMannen), rig and animation CC-BY 4.0 | Not wholly CC0; low-poly; a fox is not on the list. |
| Quaternius farm animals, Kenney animal kits, Hubs avatars, `series-ai` critters | CC0 | Stylised or low-poly cartoon: the owner's rule rejects these. |
| Poly Haven `horse_statue_01` | CC0 | A porcelain figurine, not an animal. |

What would help: the session's network allows only GitHub and package registries, and `opengameart.org` failed to resolve. If you add
`opengameart.org`, `polyhaven.com` and `sketchfab.com` to the environment, I can check:
- OpenGameArt CC0 horse and cow entries (2K textures, said to be realistic; licence to verify);
- Sketchfab models marked CC0 (scans exist, but each needs a login to download, so you would download them);
- Smithsonian Open Access 3D (CC0; mostly specimens and skeletons).
Until then, the rule (no living thing from primitives) leaves the town without animals, as it is now.

## 2026-11-18 (items 5 and 6: besom and trade tools; sameness. And a WebGPU fault of mine, fixed)

Head `82f793f` (merged with threejs `bc1cac4`). Full gate at this hash: **run 301** (pending when written). Run 294, at `2187dd1`, was superseded before it started. **Readings taken without a decision from you** (all easy to undo, all in `src/49_chars.js` / `src/77d_handprops.js`):
(a) the sweep motion is now `farm-watering` (standing), not `shovel-dig` (a crouch that tented every skirt); (b) "differ in one garment"
is read as the colour of the main garment, not a different piece; (c) tools put down = not drawn (no bench or rack placement).

- **WebGPU, mine, fixed.** Run 268 (full gate for items 2 and 3) failed `webgpu` with 12 GPU errors.
  - Cause: my garment tag for taking clothes off was a ninth vertex attribute; WebGPU allows eight, so every villager and shadow
    pipeline was invalid. WebGL did not mind, so my local gates passed.
  - Fix: the tag now rides in `_vid` as a negative number (garments never carry a face-morph column). `webgpu` step passes locally.
  - **Do not merge `4f15974` to `2187dd1` without `82f793f`.**
- **Besom.** For the four sweepers: ash handle and a head of birch twigs bound twice, held in both hands in front of the body. The
  twig tips sweep side to side on the floor 0.8 m ahead, in a standing stance. Picture: `docs/proof/chars/hold/besom_sweep.jpg`.
- **Trade tools.** One true-size tool per working person, by `CAST` trade, held only while working: shears, awl, knife, cleaver,
  mallet, axe, paddle, dough scraper, pestle, tinker's hammer, netting shuttle, sickle, tongs. Story people: Marta pestle, Hilda
  shuttle, Brandt tongs, Bram and Edda sickle, Wren knife.
  - People with no tool: counter keepers, the scribe, merchants, shepherds, the potter, the beekeeper, the Reeve.
  - Tools are not drawn beyond the middle level of detail; they had cost 2 to 4 draw calls in the budget views.
  - Picture: `docs/proof/chars/hold/trade_tools.jpg`. Hilda's shuttle is too small to see at 1 m; most tools are held across the
    fist, horizontal, as the work clip's hand hangs.
- `test/hold.js`: 0 of 4480 (50 people with something in hand). One fault along the way was mine: a besom edit moved Brandt's
  hammer grip 20 cm off his palm (`d86986e` restores it).
- **Sameness** (`dressPlan` in `src/49_chars.js`, `docs/WARDROBE.md`). The cast is dressed in id order; each person takes the first
  hat, hair colour and garment colour that nobody already dressed in their household or workplace has.
  - `test/dress.js` (new): 32 pairs who live or work together; before 32 shared a hair colour and 25 a garment colour, now 0 share
    hat, hair or garment colour.
  - Town spread: 7 hair colours, 8 garment colours; 11 caps, 11 hoods, 11 coifs, 9 kerchiefs, 18 bare-headed. Hair greys by age.
  - Picture: `docs/proof/chars/dress/households.jpg` (six households and workplaces side by side).
  - Still: bodies are 12 for 60 people (no Blender here: a new hair style or face needs a new body); two fair hair shades are close;
    in sun the garment colours all read pale.
- Area gate at `2187dd1`: boot, quest, story, parity, people, budget-medium (square 179/318k) and budget-low pass.
- **`npcsep` fails, not mine:** Laurence and Joyce both sit at `in.02.sit` at 7:00 and 18:30. That comes from the household
  schedules; none of `src/77e_households.js`, `src/77_npc.js` or `src/54b_castrules.js` differs from threejs on my branch.
- Not checked: motion (sweep, strum, the tools in the work clip), a real phone.
- Next: item 7, animals (candidates only).

## 2026-11-18 (item 4: lute strap, tankard)

Commit `09c8b5b`. Push gate: run 271.

- **Lute.** Slung on the back whenever Lark is not playing: walking between his places, and seated at the fire at night. It hangs
  by a leather strap over the left shoulder, across the chest to the right hip and round to the tail of the bowl. The strap is a
  ribbon rebuilt from his bones each frame while the lute is slung; it is not drawn while he plays (players then used none).
  Pictures: `docs/proof/chars/hold/lute_slung_strap.jpg` (standing and walking, five angles).
- **Tankard.** Cause: the kit `Mug`'s iron hoops are broken rings that lie at the cup's own radius. They fought the staves (pale
  zig-zags); pushed out they showed their backs through the gaps; blackened they showed as dark holes. They are left out: the tankard
  is a plain turned wooden cup with its handle. Picture: `docs/proof/chars/hold/tankard_after.jpg`.
- `test/hold.js` 0 of 1420.
- Not checked: the strap in motion (walk cycle), the lute against a chair back when seated.

## 2026-11-18 (items 2 and 3: sleepers, Hale without his helmet)

Commit `4f15974` (merged with threejs). Full gate requested on GitHub for `fork-ch1` at this hash (run 268: FAILED webgpu, my fault, fixed in `82f793f`, see above; the push gate on the same hash, run 265, passed). Area gate: 8 of 8 pass
(medium square 180/318k, low square 132/194k).

- **Sleepers.** In bed: hat and outer garments (cloak, apron, tabard, straps, belt, pouch) off; a coif or kerchief stays on.
  - Arms lie straight along the body, hands by the hips.
  - A dark wool blanket covers them from the shoulders to past the feet. It is shaped to the body as it lies, at most 0.34 m above
    the bed, and falls over the sides.
  - `test/sleep.js` at 02:30: 75 asleep; 0 dressed, 0 without a blanket, 0 with a hand more than 0.45 m above the body.
  - Pictures: `docs/proof/chars/sleep/after.jpg` (eight sleepers: from above, from the side, and the same side view with the blanket
    hidden). Before: `before_audit.jpg`.
- **How things come off.** No second body: every garment vertex carries a tag (hat, outer garment), and the material skips what is
  off. Indoors at table the hat comes off; in bed, hat and outer garments. `Chars.shed(H, level)` lets a schedule row override it
  (0 nothing off, 1 hat, 2 hat and outer).
- **Hale at table** (item 3): no helmet, and the spear is not drawn (indoors off duty). Picture: `docs/proof/chars/sleep/hat_off_at_table.jpg`.
  Brandt keeps his apron at supper.
- Still visible:
  - Where the sleeping clip draws a knee up (Giles, Lark, Tom), the blanket humps over it.
  - Lark's shirt shows at one fold.
  - The sleeping clip still turns some bodies a little on their side.
- Not checked: the moment of getting into or out of bed (the blanket appears two frames after lying down and goes on getting up);
  motion; a real phone. The audit's L4 (Lark's `inn.bed3` is a table; Hale's bed has no mattress) and L6 (a sleeper answers with the
  day greeting) belong to the furniture and logic sessions.
- `test/hold.js` 0 of 1420, `test/garb.js` 0 of 210 (before the sleeper change; the sleeper change touches neither).
- Next: item 4 (lute strap and slung lute, tankard band).

## 2026-11-18 (item 1, the crouch)

Commit `3f950e9` (merged with threejs at `363a37d`). Reading taken without a decision from you: **the generic work motion is now
`farm-watering` (a standing stance over the task), not `farm-harvest` (the squat)**. Easy to undo: one word in `src/49_chars.js`
(`work:` in both clip tables).

- Cause: the harvest squat folds the body until no shell garment can follow it. Re-weighting the skirt (`tools/humans/reskin.mjs`
  step 3b) fixed sitting (the lap no longer rises to the chest) but the squat stayed a tent with the boots showing, Hale's tabard tore
  open at the back and Brandt's tunic broke up. Every other work clip I tried (watering, chopping, picking up) keeps all three whole.
  Most `work` rows are indoor trades at a bench anyway.
- Also: the lower hem between the shins hangs from both shins (in a stride it tore half a metre wide); bodies under an ankle-length
  skirt lose their legs down to mid-shin (skin showed through the lap when seated).
- `test/garb.js`: 0 of 220 (every body in every hat and piece, six poses). Pictures: `docs/proof/chars/c01/after_work_pose_1.jpg`
  (Marta, Greta), `after_work_pose_2.jpg` (Hale, Brandt): stand, sit, work, sweep, reach, three sides each.
- Still visible: a few small dark specks on Hale's tabard front; Brandt's sleeve edge shows a pale stripe from behind.
- Not checked: motion (the stride of the new work clip is only seen at two moments), a real phone.
- Next: item 2 sleepers (in progress at the next commit: hat and outer garments off in bed and the hat off at table indoors, by one
  per-vertex tag, no second body; a blanket shaped to the sleeper; `test/sleep.js`).
