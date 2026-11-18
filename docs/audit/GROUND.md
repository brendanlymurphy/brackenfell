# The ground on Build 89 (no lawn inside the walls, orchards, allotments, a green), and the storey mismatches

Measured on Build 89, built from `origin/main`, with `test/audit/score.mjs` (dump + `rules.py`), `test/audit/lawn.js` and `lawn.py`. From this
build the rules use the game's own edge (`GROUND.edge` in `73p_ground.js`) instead of my ellipse, and count the trees the ground work plants
(`World.yardTrees`, `World.orchardTrees`) as well as the scanned ones. Picture: `lawn_marked_b89.jpg` (straight down at noon; magenta = open
ground inside the edge that reads as grass). Headless: nothing seen in motion.

## Item 7: the rules the ground changes

| Rule | Build 88 | Build 89 | Note |
|---|---|---|---|
| 4.1 open ground inside the edge that is grass | 17% on Build 83 by my ellipse | **7%** (223 of 3,262 points, about 900 m2) inside the game's edge | Market Place and Upper Ward 0%, Westgate 1%, Chapelgate 7%, Riverside 10%, Wharfside 12% |
| 9.1 trees inside | 16 (scanned trees only) | **45** (scanned + yard + green + orchard) | target about 70 |
| 9.1b of which in orchards | (not counted) | 25 | the blueprint asks for one orchard of 6 or more: passes |
| 9.2 flower pots inside | 48 | 44 | passes |
| 4.4 yards people work in | 23 places, 18 of enterable houses, 5 of shells | **unchanged** (23, 18, 5) | the "five more yards" are closes and plots with walls and gates, not places anyone is booked to work in; a yard with nobody in it is scenery |
| 4.3 free-standing fence runs | 72 | 73 | the new plots' fences; still cannot tell a yard's gateway from a loose run |
| 6.5c people outdoors at noon | 16 | 15 | |

Where the 7% is (`lawn_marked_b89.jpg`): two thirds of it is one strip, the east bank between the river and the palisade, about 8 m wide and
100 m long, from the bridge north to the corner and south past the mill. The rest: the village green in the south-west (a green with a purpose,
which the blueprint allows), and a few points at the edges of yards. Seen from above, the ground inside is now earth, beds and paths
everywhere; it reads as worked. It also reads as one colour of bare earth over large open stretches north-east of the square and in Chapelgate:
not lawn, but not yet "all the space filled".

### Should orchard trees inside the walls count as a fault?

No. Rule 9.1 exists because Build 74 had 28 trees inside the town and none in a plot; it already asks for "an orchard of 6 or more behind the
richest house". The fault it is after is a town with no trees where people would plant them, or a tree dropped on open ground as filler. Proposed
wording (for you to decide):

> **9.1 Trees inside the edge, each with a reason.** At least 60, counting orchard, yard, green, churchyard and street trees alike. Among them:
> one at the main gathering place, two in the churchyard, an orchard of 6 or more behind a wall or hedge, and a fruit tree in at least a third of
> the yards. A tree on open ground that belongs to no plot, green, churchyard or street line counts against the total.

The script would need one more fact per tree (which place it stands in); orchard, yard and green trees already carry it in the lists above.

## Item 8: the storey mismatches, 21 on Build 83 to 24 on Build 88

Four houses newly differ and one no longer does (net three). All four are compact houses whose interiors were refitted to their shells between
Build 83 and 88 and were given an upper level, while the shell still has one storey of wall (`kitStyle.up` 0):

| House | Shell | Interior on Build 83 | Interior on Build 88 |
|---|---|---|---|
| Widow Hale's House (`in.23`) | 5 x 5 m, one storey | 7 x 8 m, one level | 6 x 6 m, two levels |
| Ferrin's House (`in.75`) | 5.6 x 4.6 m, one storey | 6 x 7 m, one level | 6 x 6 m, two levels |
| Tamsin's House (`in.82`) | 5 x 5.4 m, one storey | 8 x 7 m, one level | 6 x 6.5 m, two levels |
| Shepherd's House (`in.93`) | 8 x 4.6 m, one storey | 7 x 7 m, one level | 10 x 5.5 m, two levels |
| No longer differs: Bram's House (`in.67`) | two storeys | one level | two levels |

The new upper levels are probably lofts in the roof space. A loft under a pitched roof is honest if the outside shows it (a gable window or a
dormer); I did not look at these four shells from outside, so whether they show one is not checked. If they do, rule 3.2 should count a roof
loft as half a storey and these four stop failing.
