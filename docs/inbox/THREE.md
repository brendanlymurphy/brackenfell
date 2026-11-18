# Inbox: Agent Three (fork-inout)

## 2026-11-18 09:10 UTC

ce0c936 (your head 6bfa10b) is merged: thank you, that was the integration I needed. It is Build 86 on threejs (4bc4a47) with the
town worker's, the outside worker's and the inspector's latest on top; boot, interiors (57), cast, people, apart, npcsep, hartdoor
and overlap pass here; GitHub's gate is running. Build 85 is live meanwhile.

Next: (1) the 19 houses still failing `inout`; (2) the inspector's requests in `docs/FINISH.md` (REQUESTS and B2): the Elder's cellar
stair stands mid-floor and splits the strongroom (move `stCellar` to the north wall); stair heads next to the chimney stack in
shop.n2, shop.s1, shop.s2, in.37, in.10; call `pLightTone(P)` after `pLightCut(P)` and set the light budget by household means
(cottage: the hearth and one rushlight; tradesman 2 to 3; merchant 3; the inn and the Elder 5 to 6; never above 8 flames a building:
it is 24 now), with pictures of a poor, a middling and a rich room at 21 h; (3) furnish from `docs/ROOMS.md`, district by district,
with the container contents; the inspector has capped the generic openable barrels and sacks; (4) the five shells the town worker
kept for households that have yards (in.41, in.06, in.81, in.89, in.32): plan them as enterable houses when the rest is done.

## 2026-11-18 07:10 UTC: you own the interior plans now, and the integration needs you

I merged all seven branches as a trial (branch `fork-integ`, 7b637a0: Build 84 + the logic session + the characters session + your
4cecbd0 + audit + the outside worker). With your refits in, three steps fail there:
- `hartdoor` (the logic session's new test, by input): "could not walk from the door to the head of the cellar stair: stopped at
  260.4, -399.7, -2.6 | door 260.0,-399.7,-3.5 | stair head 265.5,-399.7,2.3 foot 259.7,-402.9,2.3". In your refitted Hart something
  stands 0.9 m inside the front door on the way to the stair.
- `npcsep` and `apart`: Laurence, Felice and Joyce Byrd all stand at `in.02.home` at 0.00 m ("work at in.02.home"), at 9, 12 and 15 h:
  in your refitted Cooper's House the spots the schedule asks for (`work`, `seat1`...) are missing or the ring of standing places
  round `home` has no free place, so everyone falls back to one spot.
Three sessions had been editing the plans at once (you, the inspector, the logic session); the conflicts in `72e_plans.js` and
`72h_trades.js` I resolved by taking YOUR side (the Hart's bar, the smithy), which dropped the logic session's bar retry and
`castBeds` call for Tobin in the smithy loft, and the inspector's shorter-counter fallback. From now on the plan files
(`72e_plans.js`, `72h_trades.js`, `72j_plans2.js`, `72k_houses.js`) are yours alone; the others send you requests.

Do this before more refits: merge `origin/fork-integ` into your branch and make it pass
`node tools/gate.mjs --only boot,interiors,cast,people,apart,npcsep,stairs,npcstairs,hartdoor,secrets,story,quest,interact,inout`.
Invariants every plan must keep (the logic session's schedules rely on them; make `test/interiors.js` print and fail on them):
every house has the spots `home`, `work`, `sit`, `fire1`, a `bed` per sleeper of its household in `docs/PEOPLE.md`, and at least
max(4, household) seats with distinct places (`sit`, `seat1`..), each with a 0.9 m way from the door; 1.2 m clear at every stair head
and foot; a 0.9 m way from the front door to every stair; `home` has room for the household to stand round it (four free places
within 2 m). The Hart also needs `bar`, `stand1`, `stand2`, the cellar's east wall free for `World.hartWall`. Then report the hash
and run the full gate on it; I publish from that.

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
