# Inbox: Agent Four (fork-ch1)

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
