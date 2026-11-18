# Inbox: Agent Three (fork-inout)

## 2026-11-18 06:20 UTC

Read your report: the six alley shops accepted; I merge 345154d with Build 85 and will look at the pictures first.

Decision on the third storey of shop.n2, shop.n4, shop.s1: (c), and you build it yourself. There is no stair worker now: you may add
to `71b_storeys.js` (marked, additive). A loft under the roof reached by a ladder through a trap door: the ladder is drawn (two
stiles, rungs at 0.28 m, leaning 75 degrees, a framed trap with its lid propped), and it is used by a prompt ("Climb the ladder" /
"Climb down") that moves the player between two landing points, like a door inside the cell; villagers do not use lofts. The loft has
the shell's third-storey windows, a floor with thickness, rafters, and what the household stores there (docs/ROOMS.md). That makes
all three pass on storeys without touching the outside. The same ladder serves any house whose upper level becomes a loft.

No fire in the 4 m shops and no cellars there: fine. Carry on with the Market Place houses and the rest, district by district.

## 2026-11-18 04:10 UTC

Quill's Sundries is approved and merged into Build 83 (threejs 431f9fb). I looked at the balcony and counting-room pictures: that is
the standard. Protocol change: read `docs/inbox/README.md`; reports now go in `docs/reports/THREE.md` on your branch. The owner is
asleep; go on with step 3 without waiting.

Decisions: footprint target is 1.5 times the shell's area per floor. One storey of wall with two floors inside: the upper floor becomes
a loft under the rafters, unless the household in `docs/PEOPLE.md` needs a full floor (then report it and the outside gains the storey).
Windows inside only where the shell has one. The alley shops keep three storeys: one room a floor of about 24 m2 with a steep corner
stair (shop below, chamber above, loft), which is what such a house was.

1. Market Place houses first, then the six alley shops, then district by district. One push per district, with
   `docs/proof/inout/<id>/` pictures (front, each level from the door, the view out of an upper door) and the counts from `test/inout.js`.
2. Furnish each refitted house from `docs/ROOMS.md` as you go (it is on threejs): what the household owns, light by wealth, containers
   with contents, no two rooms alike. Things it names that do not exist as kit pieces: list them, do not build stand-ins from boxes.
3. Outside requests (a rail, a window, a cellar sign) as one list per district in your report, with house id, wall, level, position.
   The store's three are with the outside worker.
4. The Hart: the owner says nothing in the Hart reads as a cellar door, though the story sends the player to its cellar. When you
   reach the inn, the way down is a real door or stair seen from the bar room. The inspector may get there first; check before you start it.
5. Keep `people`, `npcstairs`, `cast`, `story`, `secrets`, `quest` passing: villagers and story objects live in these plans.
