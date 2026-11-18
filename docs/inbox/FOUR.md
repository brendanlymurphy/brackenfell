# Inbox: Agent Four (fork-ch1)

## 2026-11-18 16:45 UTC: SCOPE CUT AND ONE BUILD A DAY (read this before anything older)

**The owner's decision, 16:45 UTC 18 Nov: cut the scope, one reviewed build a day.** He played Build 89 and found, in two minutes, a stretched spike and a hanging timber at the chapel and a ruler-straight earth patch at the north gate: things every test passed and I passed. Five builds went out today; three needed a second run. That stops.
- **The slice.** Until he says otherwise, only this is worked on: the walk from the west gate along the street to the market square, the square, the alley to Quill's Sundries, the Hart, and up to the chapel; and about sixteen interiors: the Hart, the chapel (with crypt), the Elder's house, Quill's Sundries (store), the smithy, the herbalist, the guardhouse, the mill, the draper, the weaver, the farm, the hunter's, the fisher's, the shut house (in.23), the Bookstall (shop.s1) and the Apothecary (shop.n2), plus any cell a quest stage, secret, note or shop needs (the logic session settles the exact list today). Every other house keeps its people and its lights but its door is locked to the player.
- **One build a day.** Candidates are cut at 12:00 UTC. A build ships only after the walk camera (every 5 m of every lane in the slice, both ways, eye height, day and night) and the room camera (every kept room from each doorway) have run on it and every frame has been looked at by the audit session and by me. Nothing ships from pictures at angles its author chose.
- **Assets, not code, for anything a person recognises** (animals, boats, carts, tools, furniture, plants, food): a kit piece or a model made or fitted in Blender (the owner is setting up a Blender session; `docs/briefs/AGENT_BLENDER.md`), or it is left out. Code builds terrain, walls, roofs and layout.
- **One area each.** Do not touch another session's files; ask in your report.

**Yours:** the people a player meets in the slice (the gate guard, the square at noon, the Hart in the evening, the chapel): faces, hands, held things at arm's length; and the animals, as in the 15:55 entry, placed only in the slice first (a pig, hens, a dog). One sheet per animal or person group before anything is merged.

## 2026-11-18 15:55 UTC: animals are allowed; the owner has opened the hosts

The owner has given your environment access to `opengameart.org`, `polyhaven.com` and `sketchfab.com`. Animals move to the top of your list, above the items in the entry below.
**What may come in:** realistic models only (no stylised, low-poly-look or cartoon ones), licence CC0, or CC-BY with the author and link recorded; nothing "non-commercial", "editorial" or unclear; nothing ripped from a game. For each file keep `docs/licences/animals.md`: name, author, source page, licence, date fetched, what you changed. Download through the page's own download, never past a login or paywall; if a site wants an account, stop and say so.
**Order:** pig (the owner named it), hens and a cock, a dog, a cat, sheep, a goose, then ox and horse. One animal fully done before the next.
**The bar, each animal:** passes at 0.6 m and at 6 m beside a villager for scale (true size: a sow about 0.75 m at the shoulder, a hen 0.4 m); fur or feather texture that holds at arm's length; a skeleton with at least stand, walk, and one idle (root, peck, graze, sit), or, if the model is not rigged, two or three believable still poses (lying, standing head down) and it does not walk: a still animal that looks alive beats a sliding one. Feet on the ground on slopes, a contact shadow, no sliding, no popping within sight, eyes not black holes.
**Cost:** under 3k triangles each within 12 m and a low version beyond; all animals together at most 12 draws and 25k triangles in any budget view (Medium square is at 336k of a 380k limit; Low 230k / 150 draws). Tell me the figures.
**Where:** the pens and yards that already say an animal lives there (the wallows, the sheep close and fold, the hen run, the yards by household in `73m2_crafts.js` and `73n_wharfside.js`: read, the placing goes through a small table of your own, e.g. `src/78_animals.js`, that those files do not need to change for). No animal on a lane a villager's path uses unless it yields.
**Proof before I merge any:** per animal one sheet: 0.6 m, 3 m, 6 m with a villager, from the side and the front, noon and dusk, and its pen from the gate. I look at every one; an animal that does not pass is left out.

## 2026-11-18 15:45 UTC

Read your report as relayed by the owner. 62d709b is in Build 87 and live (the WebGPU fault never reached `main`: the integration had taken the older commit, the gate caught it, and your fix replaced mine). Roger: he is a grown man in the cast; the child at the stalls was Lettice Sele (14), who now gets a youth body at 0.9 (the logic session). Laurence and Joyce on one seat: fixed in Build 84.
Animals: the three hosts need the owner's yes for this environment; I have asked him. Until then, none.
Next, as in the 09:40 entry below, in this order: (1) boot toes at the foot of beds; the bodies tipped on their side by the sleeping clip: lay the spine flat for the frames a player can see; (2) a tool put down should be somewhere: on the bench, the rack or leaning by the door of the place its owner works (the logic session's work spots give the place), not vanish; (3) the arm's-length tour for people: ten villagers at 0.6 m (face, hands, hem, the held thing), listed with pictures, fixing what is yours; (4) faces: the audit still finds pairs it cannot tell apart at 3 m beyond clothes: propose what can vary in the face without new models (brow, jaw, nose from the morph table, skin tone, age lines) and show ten faces side by side.

## 2026-11-18 09:40 UTC

Read 142117d's report; thank you for the warning on the ninth attribute. The integration had taken 3121395, so Build 86's first run failed `webgpu` exactly as you said; I packed the flag into `mid` as a second component on threejs (284bc3a). When you next merge origin/threejs keep whichever of the two fixes you prefer in `49_chars.js`, one of them only, and run `webgpu`.

1. **Animals: none for now.** No candidate passes and I will not allow hosts outside the list while the owner sleeps. Nothing living from primitives stays the rule; it is on the owner's list to decide.
2. 62d709b (market sameness, blanket details) is taken for the build after 86 once run 315 is green: tell me its result.
3. Boot toes showing at the foot of some beds: lengthen the blanket or tuck the feet, your choice; picture from the foot of the bed.
4. Roger on a child's body goes to the logic session (the body comes from `77e_households.js`).
5. Next: the arm's-length tour for people: ten villagers at 0.6 m (face, hands, hem, the held thing), listed the way the inspector listed rooms; fix what is yours.

## 2026-11-18 09:10 UTC

Your branch is in Build 86 (threejs 4bc4a47, in the gate). I looked at the sleepers: accepted. One thing in `sleep/after.jpg`: the
heads lie at or past the head end of the bed, off the pillow in most of the eight: the body should lie 0.25 m further down so the
head is on the bolster. Then the list of 06:20 (besom and tools, sameness, the blanket's first frames, animals).

## 2026-11-18 06:20 UTC

Read your reports: crouch, sleepers under blankets with hats off, Hale without his helmet at table, the lute slung on its strap, the
tankard: all accepted from the descriptions; I look at the pictures and merge 3121395 with Build 85.

Next: (1) the besom and one true-size tool per work motion by trade (item 5); (2) sameness: the audit's patient play found "Diggory
and Roger at the stalls are the same person"; `docs/WARDROBE.md`, then dress the 77 from `docs/PEOPLE.md` so that any two who live,
work or stand at stalls together differ in hat, hair and one garment; the audit session is listing every such pair with pictures;
(3) the blanket appearing two frames after lying down: lie down already covered; the knee hump; bodies turned on their side;
(4) animals: candidates with licence and pictures, add none without a yes.

## 2026-11-18 04:10 UTC

54cda7b is merged into Build 83 (threejs 431f9fb). I looked at the lute and the hammer: both pass. Protocol change: read
`docs/inbox/README.md`; reports now go in `docs/reports/FOUR.md` on your branch. The owner is asleep; work through this list in order.

1. The crouch (harvest bend): skirts, Hale's tabard, Brandt's tunic.
2. Sleepers, from the audit's night pictures (`docs/audit/CHARACTERS.md`, third pass): everyone lies on top of the made bed fully
   dressed with the hat on; one arm sticks straight up in 9 of 15; the over-garment stands up as a room-high spike in 4 of 15. A sleeper
   lies under the blanket (a blanket form over the body is enough), hat and outer garment off, arms down, head on the bolster.
3. A hatless Hale body for the table and the bed (the logic session calls it by schedule).
4. The lute's strap and the lute slung on the back when not played; the tankard's pale zig-zag band.
5. Item 3 of your brief: the besom and one true-size tool per work motion by trade (the logic session cut sweepers from 57 to 4; the
   rest use the generic work motion with empty hands).
6. Sameness: `docs/WARDROBE.md`, then dress the 77 from `docs/PEOPLE.md` (age, trade, means): any two who live or work together differ in
   hat, hair and one garment. The cast is in the game now.
7. Animals: candidates with licence and pictures in your report; add none without a yes.

After each item: merge `origin/threejs`, re-run `test/audit/chars.js`, `test/garb.js`, `test/hold.js`, the area gate, then
`gh workflow run gate --ref fork-ch1 -f mode=full`, and put the hash and run number in your report.
