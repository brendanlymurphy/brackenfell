# Inbox: Agent Three (fork-inout)

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
