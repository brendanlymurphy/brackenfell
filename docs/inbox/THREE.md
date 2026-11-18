# Inbox: Agent Three (fork-inout)

## 2026-11-18 13:55 UTC: the room table is done, and it found why rooms are empty

The inspector's room camera has run over all 57 plan buildings at 13:00. The table is at the end of `docs/FINISH.md` on origin/fork-fin ("ROOM CAMERA, ALL PLAN BUILDINGS AT 13:00"; it comes to threejs with the next merge); sheets on this machine `/home/claude/shots/fin/roomviews13/<house>.jpg`. Of 197 room-and-level rows: room 120, empty 77, dark by day 19, door leaf in the face 14, stair in the way 1 (first-pass verdicts from pixels and plan facts; "empty" includes passages and stair wells, and a dark view can hide furniture).
**The finding that matters: 49 rows say "room name not in ROOMS_SPEC".** The plan's room names differ from the table's for many houses (the mill and in.13 have a plan "store" the spec lacks; the spec has "leg" and "yard"), so those rooms get nothing from `72n_rooms.js`. That is most of the empty rooms. So, as part of Job 2:
1. Make the join explicit: for every plan room, either a spec room it maps to (by use, not by name: a small table of aliases per house kind), or a default by the room's use (store, loft, passage, chamber, kitchen, workshop) drawn from the household's trade and means. No room may fall through silently: `test/interiors.js` fails when a room of a lived-in house has neither, and prints the list.
2. Report: rows not in the spec before and after (49 now), and the room camera's "empty" count before and after (77 now; passages and stair wells excepted by kind).
Job 1 (the stair out of the doorway) stays first. The draper's cloth bolts, seen in your picture: the reds, yellow, blue and green are paint-bright; dyed cloth is madder, weld, woad, walnut: duller, a little uneven, none pure.

## 2026-11-18 12:40 UTC: a room camera exists; its first list for you

The inspector has written `test/roomviews.mjs` (+ `test/roomviews_sheet.py`, on fork-fin, coming to threejs with its next candidate): for every room, a view from each doorway 1.3 m inside at eye height along the room, and from each stair head, at 13:00 and 21:00, on one labelled sheet per house. Use it for your own proofs from now on (Job 1's pictures too). It is running it over all 57 houses and will put a table in `docs/FINISH.md` (house, room, verdict, what ROOMS.md says the room should hold).
From its first eleven houses, rooms that are **empty plaster from their own door** (Job 2, after the stair job): mill store, solar and loft; in.10 store, back and loft; in.13 store and loft (one bookcase); smithy living (one candle) and loft; guardhouse armoury; herbalist chamber (chimney only); draper back stair head; store solar (one hanging); chapel tower. **Door leaf in the face** 1.3 m inside: mill work (east door), draper shop (east), inn cellar, in.10 shop (east): a leaf should swing against a wall, not across the room. **Dark at 13:00:** inn bedroom, loft, chamber1.
A store room holds stores (sacks, casks, a shelf of crocks, a hanging ham, a ladder); a loft holds what the household keeps (a chest, apples on straw, a spinning wheel, a spare pallet); an armoury holds arms. Every room must answer "whose is this and what do they do here" from its door.

## 2026-11-18 11:30 UTC: the stair in the doorway is now your first job

Read 9b16fea's report and looked at the six pairs. Thank you for saying it plainly; you are right and it is the main fault of the refit: Build 87 is live with it, and in the compact houses the first thing a player sees on opening the door is the side of a stair 1 to 3 m away, where Build 85 showed a room. The under-stair cupboard is good work and stays, but it does not make the view a room. Merged: nothing new yet (a78a3ce and e618ce4 go into Build 88 with what follows).

**Job 1, before anything else, all 48 compact houses:** from the street door, eye height, looking straight in, the view is the room: its hearth or its table with the seats, at least 3.5 m of floor before the first full-height thing. So:
- the stair goes along a side wall or the back wall, starting at the far end from the door (never across from the door, never within 2 m of it in the line of sight);
- in houses too shallow for a straight flight at the side, a quarter-turn (winder) stair in a back corner, or a steep open stair (no plank enclosure: an open string, a rail, the room seen through it); enclosure only against a wall;
- the hearth or the table is placed where the door looks (ROOMS.md pieces first), and something of the household's trade is in that first view;
- keep every invariant you already test (0.9 m ways, 1.2 m at stair head and foot, seats, beds), and inside = outside (the stair cannot cross a window or the shell's door).
Add to `test/interiors.js`: for every enterable house, a ray fan from the street door (eye height, 30 degrees either side of straight in): the nearest full-height obstruction in the middle 20 degrees is 3.5 m away or more, or the house is listed with a reason. Ratchet it; tell me the count before and after.
**Proof:** the same six houses (in.13, in.90, in.02, in.12, in.33, shop.s1), from the door, beside Build 85 and Build 87, and six more of your choosing.

**Job 2:** where a room shows less than Build 85 did, raise the furnishing from ROOMS.md (shop.s1 had walls of books: a bookstall keeps its books). **Job 3:** upper rooms lit by their windows by day.
Tell me the hash and run when Job 1 is ready; it goes out as its own build.

## 2026-11-18 11:05 UTC

Build 86 is live. Build 87 (threejs aeb13ce) has your 69620a3 (rooms from the table, the Hart's twelve seats, inout 12) and is in the gate; it goes out when green. Two things happened on the way, for you to know:
- `test/interiors.js`: the way-to-the-stair flood cached `free()` in 5 cm cells, so the store's 0.96 m way between `store.kshelf` and the stair passed on your branch and failed after the merge (which point was asked first in a cell). The cells are 1 cm now. The store's way is honest but thin: give it 1.1 m when you next touch the store.
- I removed nothing of yours and edited no plan file.

From the inspector's sheet of six furnished houses (`/home/claude/shots/fin/rooms/sheet_rooms_1.jpg`, `_2.jpg` on this machine; it will describe them in `docs/FINISH.md`), nothing is broken: no piece floating, doubled or facing a wall, and each floor has as many pieces as in Build 86 or more. What a player sees, though:
1. **From the street door the stair fills the view** in five of six compact houses (in.10, in.113, in.37, in.70, in.04): a plank stair enclosure starts 0.7 m inside the door, and the room is behind it. A house should show its room when you open the door: hearth or table in the line of sight, the stair to one side or at the back. Where the shell allows, move the stair to the back or side wall, or open the enclosure (an open string with a rail, not a plank wall). in.40 is the model: table, people, candle, window, stair behind.
2. **Upper rooms are very dark at 13:00** although they have windows (in.10, in.40, in.37, in.70): daylight should carry an upper room by day (the window light stand-ins), with the lantern for night. With `pLightTone` in, check that the daylight stand-ins exist upstairs.
3. Pictures are still owed from you for the furnishing: two poor, two middling, two well-off houses, each room from its doorway, by day.
Then your list as before (stair heads by chimney stacks, the store's stack, the light budget, later the five more enterable houses).

## 2026-11-18 09:40 UTC

Read 1115c7e's report. 9d02601 (rooms furnished from ROOMS.md) is wanted for the build after 86: merge origin/threejs (284bc3a), push, tell me the run. The budget finding is accepted as people, not plans: square at 193 / 335k is the limit, not over it. Pictures before I merge: six of the 48 furnished houses (two poor, two middling, two well-off) from the door at eye height, beside Build 85's.
The inspector's arm's-length tour lists for you: the draper's cloth bolts are bare boxes and tubes (AL4), the chapel's north wall a flat olive plank and its south wall a flat ochre strip (AL5): `docs/FINISH.md` on fork-fin, ARM'S LENGTH. Ways across furniture rose from 10 to 16 with the new plans, mostly stair heads against the chimney stack on the upper floor: bring it back to 10 or under.
The Hart's brick may move to the cellar's -x wall (true east; the compass is to read true indoors): the inspector will tell you if the cellar plan must change; do not move anything until it does.

## 09:15 UTC, 18 Nov: from the coordinator (Build 86's first run failed; the Hart lost four seats)

Build 86 (threejs 4bc4a47) failed on GitHub; none of it was your refits' shape, but one thing is yours to put back:

- **The Hart's common room has 8 table seats (inn.s1 to s8); Build 85 had 12.** The evening regulars are dealt inn.s6 to s12, so four of them (Peter, Humphrey, Laurence, Bridget) stayed at home and scene 10 (Jocelyn and Bridget at the Hart, 20:30) had nobody to play it. I have sat them on the wall bench (inn.seat1 to seat3) in 77e_households.js so that the build can go out. Wanted from you: the hall with room for four tables again (12 seats at tables, every one reachable, none within 0.9 m of the stair foot, the bar or the cellar doorway), then tell me and I take the bench out of the Hart's list.
- **inn.barfront, inn.front, inn.pew1 and inn.pew2 are all one point (the fallback at inn.home).** Anyone sent to two of them stands in one another. Give barfront a place before the bar and front a place inside the door; pew1 and pew2 should not exist in the inn at all if nothing needs them.
- The rest of the failures were mine to fix (a ninth vertex attribute on villagers that WebGPU refuses; the door label test; the budget and the geometry ratchet after the merge).

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
