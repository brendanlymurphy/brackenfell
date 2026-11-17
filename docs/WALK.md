# Walking the world: what the walk bot found

Written by `node test/walkbot.mjs` (do not edit by hand: run it again). The bot moves only by input (W, turning, Space, the E key) along every
stretch of the villagers' navigation graph outdoors and in all interiors, both ways; every way point of the galleries, wall walks, terraces
and the wharf; every path of the wilds; the mine, tunnel and cave. Walking speed measured on open ground: 2.90 m/s.

This run: 18970 m walked (190 minutes of play), 4328 stretches, 115 doors used by the E key, 378 places the bot had to be lifted past.

To look at a finding: `node test/shot.mjs --opt webgl=1 --do "await <shot call>" --out f.png` (the call puts the camera where the player's eye was).
Owner: **player** = collision, camera, prompts (the behaviour worker: fixed here or listed in docs/BUGS.md); **geometry** = where things stand (the
visual workers: outdoors `fork-fx1`, interiors `fork-fx2`). The bot cannot see flicker or how a place looks.

How far to trust it: falls, water, the camera and prompt findings and the door counts are measured directly and hold. "Could not be walked",
"stuck", "snag" and "slide" are where the bot, walking the straight line the villagers' graph draws between two points, was stopped: most are
real obstacles on a line people are meant to walk (a table leg in a doorway, a step too high), some are lines only villagers use. Look at the
shot before changing anything. Every door in the game (115 uses, both directions) gave its prompt and opened; none needed a second try unless listed.

| Kind | Places |
|---|---|
| Falls of more than 1.6 m | 66 |
| Could not be walked at all (the bot was lifted on) | 164 |
| The villagers’ graph joins two levels with no walkable way (villagers are slid along it) | 3 |
| The villagers’ graph passes through a wall (villagers walk through it) | 41 |
| In water for 5 s | 5 |
| Stuck: no progress for 2 s with W held | 249 |
| The eye or the near plane inside something solid | 10 |
| Stairs that needed more than one try | 45 |
| Prompts offered through a wall | 14 |
| The eye within 10 cm of the underside of a floor or stair | 2 |
| Sliding: moving more than 35 degrees off the way the player faces | 69 |
| Snags: under half walking speed | 313 |
| Stretches that needed more than one try | 56 |
| Prompts for things more than 60 degrees off the view | 22 |

## Falls of more than 1.6 m (66)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors 46.5, 4.1, -150.1 (street 300>301) | 3 | fell 2.0 m | geometry | `game.shot(46.26, 7.84, -149.98, 172, -12, 13)` |
| outdoors 57.9, -2.1, 2.2 (street 46>45) | 2 | fell 3.0 m | geometry | `game.shot(57.11, 2.56, 1.54, 196, -12, 13)` |
| smithy 417.2, -399.7, 1.4 (smithy 1682>636) | 2 | fell 3.6 m | geometry | `game.shot(418.79, -394.38, 2.02, 253, -12, 13)` |
| mill 264.1, -399.7, 145.2 (mill 751>1759) | 2 | fell 3.0 m | geometry | `game.shot(263.8, -395.05, 145.99, 43, -12, 13)` |
| in.21 863.5, -399.7, 455.1 (in.21 1073>1971) | 2 | fell 3.0 m | geometry | `game.shot(862.52, -395.05, 455, 133, -12, 13)` |
| in.37 412.8, -402.1, 606.9 (in.37 2025>2019) | 2 | fell 1.9 m | geometry | `game.shot(412.86, -398.58, 609.06, 355, -12, 13)` |
| outdoors -2.2, 6.9, -56.4 (street 1564>83) | 1 | fell 1.8 m | geometry | `game.shot(-4.16, 10.33, -56.38, 40, -12, 13)` |
| outdoors 0.1, 4.9, -56.4 (street 1564>83) | 1 | fell 2.0 m | geometry | `game.shot(-2.18, 8.54, -56.38, 71, -12, 13)` |
| outdoors -0.5, 5.3, -56.4 (street 1564>83) | 1 | fell 2.1 m | geometry | `game.shot(-2.79, 9.10, -56.38, 78, -12, 13)` |
| outdoors 7.1, 2.6, -44.7 (street 557>559) | 1 | fell 2.1 m | geometry | `game.shot(2, 6.30, -59.02, 224, -12, 13)` |
| outdoors 14.3, 0.1, -22.8 (street 1561>561) | 1 | fell 3.6 m | geometry | `game.shot(12.86, 5.36, -21.86, 27, -12, 13)` |
| outdoors 14.7, -0.0, -13.9 (street 1559>375) | 1 | fell 3.7 m | geometry | `game.shot(14.02, 5.36, -15.53, 156, -12, 13)` |
| outdoors 67.3, -0.2, 5.6 (street 1567>114) | 1 | fell 3.2 m | geometry | `game.shot(69.36, 4.61, 5.19, 296, -12, 13)` |
| outdoors 10.2, -3.9, 103.9 (street 112>1538) | 1 | fell 2.8 m | geometry | `game.shot(10.17, 0.56, 101.97, 152, -12, 13)` |
| outdoors 7.8, -2.2, 81.8 (street 1540>111) | 1 | fell 2.2 m | geometry | `game.shot(9.07, 1.66, 81.4, 254, -12, 13)` |
| outdoors 46.2, 4.2, -151.5 (street 301>300) | 1 | fell 2.0 m | geometry | `game.shot(46.45, 7.84, -149.99, 38, -12, 13)` |
| inn 260.0, -399.7, -3.5 (inn 1670>614) | 1 | fell 3.5 m | geometry | `game.shot(266.15, -394.55, 5.67, 50, -12, 13)` |
| store 558.1, -402.9, 6.0 (store 1695>1701) | 1 | fell 3.3 m | geometry | `game.shot(559.28, -398.00, 6.19, 330, -12, 13)` |
| store 559.3, -399.7, 8.3 (store 1700>1693) | 1 | fell 3.6 m | geometry | `game.shot(558.3, -394.45, 8.08, 126, -12, 13)` |
| store 559.1, -399.7, 8.2 (store 656>1703) | 1 | fell 3.6 m | geometry | `game.shot(558.79, -394.45, 7.5, 164, -12, 13)` |
| elder 714.4, -402.9, 9.3 (elder 1710>1717) | 1 | fell 3.3 m | geometry | `game.shot(715.5, -398.00, 9.5, 333, -12, 13)` |
| elder 710.9, -399.7, -1.5 (elder 1708>676) | 1 | fell 4.1 m | geometry | `game.shot(717.05, -393.95, 8.67, 49, -12, 13)` |
| guardhouse 1010.9, -399.7, -1.5 (guardhouse 1730>711) | 1 | fell 3.5 m | geometry | `game.shot(1015.04, -394.55, -2, 310, -12, 13)` |
| weaver 1156.7, -398.5, 6.1 (weaver 723>1739) | 1 | fell 1.8 m | geometry | `game.shot(1157.47, -395.05, 4.5, 227, -12, 13)` |
| weaver 1156.5, -399.7, 4.2 (weaver 726>1743) | 1 | fell 3.0 m | geometry | `game.shot(1157.69, -395.05, 4.17, 331, -12, 13)` |
| chapel 1305.6, -401.9, -7.9 (chapel 1755>1746) | 1 | fell 1.7 m | geometry | `game.shot(1307.72, -398.62, -8.26, 286, -12, 13)` |
| farm 407.5, -399.7, 155.4 (farm 1769>1778) | 1 | fell 3.1 m | geometry | `game.shot(407.59, -394.95, 156.31, 63, -12, 13)` |
| draper 859.6, -402.5, 156.7 (draper 1794>1800) | 1 | fell 2.8 m | geometry | `game.shot(860.88, -398.00, 155.67, 165, -12, 13)` |
| shop.n2 1008.5, -399.7, 156.7 (shop.n2 835>1810) | 1 | fell 3.0 m | geometry | `game.shot(1009.58, -395.05, 156.98, 294, -12, 13)` |
| shop.n2 1013.5, -402.5, 156.7 (shop.n2 837>1812) | 1 | fell 2.8 m | geometry | `game.shot(1012.38, -398.00, 156.99, 66, -12, 13)` |
| shop.n2 1012.9, -402.1, 157.7 (shop.n2 1813>1803) | 1 | fell 1.9 m | geometry | `game.shot(1012.96, -398.58, 159.86, 355, -12, 13)` |
| shop.n3 1163.5, -402.5, 154.7 (shop.n3 854>1824) | 1 | fell 2.8 m | geometry | `game.shot(1162.44, -398.00, 154.97, 66, -12, 13)` |
| shop.n4 1312.5, -402.5, 154.7 (shop.n4 870>1836) | 1 | fell 2.8 m | geometry | `game.shot(1311.37, -398.00, 155, 66, -12, 13)` |
| shop.s0 264.5, -402.5, 304.7 (shop.s0 887>1848) | 1 | fell 2.8 m | geometry | `game.shot(263.43, -398.00, 304.97, 66, -12, 13)` |
| shop.s1 407.5, -399.7, 306.7 (shop.s1 902>1858) | 1 | fell 3.0 m | geometry | `game.shot(408.58, -395.05, 306.98, 294, -12, 13)` |
| shop.s1 412.5, -402.5, 306.7 (shop.s1 904>1860) | 1 | fell 2.8 m | geometry | `game.shot(411.38, -398.00, 306.99, 66, -12, 13)` |
| shop.s1 411.9, -402.1, 307.7 (shop.s1 1861>1851) | 1 | fell 1.9 m | geometry | `game.shot(411.96, -398.58, 309.86, 355, -12, 13)` |
| shop.s2 557.5, -399.7, 306.7 (shop.s2 917>1870) | 1 | fell 3.0 m | geometry | `game.shot(558.62, -395.05, 307, 294, -12, 13)` |
| shop.s2 562.5, -402.5, 306.7 (shop.s2 919>1872) | 1 | fell 2.8 m | geometry | `game.shot(561.44, -398.00, 306.97, 66, -12, 13)` |
| shop.s2 561.9, -402.1, 307.7 (shop.s2 1873>1863) | 1 | fell 1.9 m | geometry | `game.shot(561.96, -398.58, 309.86, 355, -12, 13)` |
| in.02 715.3, -399.7, 305.0 (in.02 931>1878) | 1 | fell 3.0 m | geometry | `game.shot(714.31, -395.05, 304.88, 132, -12, 13)` |
| in.07 1006.7, -398.5, 306.6 (in.07 961>1897) | 1 | fell 1.8 m | geometry | `game.shot(1007.47, -395.05, 305, 227, -12, 13)` |
| in.07 1006.5, -399.7, 304.7 (in.07 964>1901) | 1 | fell 3.0 m | geometry | `game.shot(1007.69, -395.05, 304.67, 331, -12, 13)` |
| in.08 1162.6, -399.7, 304.4 (in.08 982>1910) | 1 | fell 3.0 m | geometry | `game.shot(1161.52, -395.05, 304.68, 66, -12, 13)` |
| in.10 1313.4, -399.7, 306.2 (in.10 997>1920) | 1 | fell 3.0 m | geometry | `game.shot(1312.32, -395.05, 306.47, 66, -12, 13)` |
| in.10 1308.4, -402.5, 306.2 (in.10 999>1922) | 1 | fell 2.8 m | geometry | `game.shot(1309.45, -398.00, 306.46, 294, -12, 13)` |
| in.12 262.6, -399.7, 454.2 (in.12 1016>1931) | 1 | fell 3.1 m | geometry | `game.shot(261.54, -394.95, 454.46, 66, -12, 13)` |
| in.15 559.1, -402.5, 456.7 (in.15 1948>1954) | 1 | fell 2.8 m | geometry | `game.shot(557.94, -398.00, 456.97, 359, -12, 13)` |
| in.20 710.9, -402.5, 457.3 (in.20 1960>1966) | 1 | fell 2.8 m | geometry | `game.shot(711.76, -398.00, 456.18, 161, -12, 13)` |
| in.33 1162.7, -402.1, 455.2 (in.33 1994>1981) | 1 | fell 1.7 m | geometry | `game.shot(1162.98, -398.73, 457.18, 357, -12, 13)` |
| in.36 259.4, -399.7, 605.6 (in.36 2008>1137) | 1 | fell 3.0 m | geometry | `game.shot(258.06, -395.05, 607.15, 45, -12, 13)` |
| in.37 408.4, -399.7, 605.9 (in.37 1155>2023) | 1 | fell 3.0 m | geometry | `game.shot(409.48, -395.05, 606.18, 294, -12, 13)` |
| in.37 413.4, -402.5, 605.9 (in.37 1157>2025) | 1 | fell 2.8 m | geometry | `game.shot(412.33, -398.00, 606.17, 66, -12, 13)` |
| in.40 712.8, -399.7, 603.4 (in.40 2039>1190) | 1 | fell 3.2 m | geometry | `game.shot(711.61, -394.85, 604.75, 55, -12, 13)` |
| in.40 714.9, -399.7, 604.5 (in.40 1192>2043) | 1 | fell 3.2 m | geometry | `game.shot(713.83, -394.85, 604.77, 66, -12, 13)` |
| in.44 859.1, -402.5, 606.9 (in.44 2049>2055) | 1 | fell 2.8 m | geometry | `game.shot(857.88, -398.00, 607.17, 0, -12, 13)` |
| in.45 1010.5, -402.5, 606.6 (in.45 2061>2067) | 1 | fell 2.8 m | geometry | `game.shot(1011.78, -398.00, 605.57, 165, -12, 13)` |
| in.66 411.2, -399.7, 755.8 (in.66 2092>1283) | 1 | fell 3.0 m | geometry | `game.shot(409.86, -395.05, 757.35, 45, -12, 13)` |
| in.70 710.8, -402.5, 757.0 (in.70 2105>2111) | 1 | fell 2.8 m | geometry | `game.shot(709.22, -398.00, 756.26, 37, -12, 13)` |
| in.74 861.3, -399.7, 753.1 (in.74 2116>1333) | 1 | fell 3.1 m | geometry | `game.shot(859.81, -394.95, 754.45, 55, -12, 13)` |

(6 more in shots/walk/walk.json)

## Could not be walked at all (the bot was lifted on) (164)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| in.82 1310.9, -399.3, 751.0 (in.82 2133>1375) | 18 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 1309.7, -399.7, 752.9 | geometry | `game.shot(1310.87, -397.64, 751.05, 213, -12, 13)` |
| inn 260.6, -399.7, 1.6 (inn 1663>620) | 11 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 260.1, -399.7, 1.8 | geometry | `game.shot(260.61, -398.00, 1.56, 251, -12, 13)` |
| smithy 413.1, -399.1, 3.3 (smithy 1681>631) | 10 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 413.1, -399.7, 2.6 | geometry | `game.shot(413.06, -397.47, 3.25, 359, -12, 13)` |
| in.65 261.2, -398.9, 758.5 (in.65 2080>1267) | 10 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 261.2, -399.7, 757.9 | geometry | `game.shot(261.17, -397.19, 758.49, 3, -12, 13)` |
| chapel 1312.4, -399.3, 0.6 (chapel 1745>741) | 9 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 1312.5, -399.7, 0.0 | geometry | `game.shot(1312.41, -397.64, 0.64, 4, -12, 13)` |
| fisher 708.9, -399.3, 152.2 (fisher 801>1785) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 710.6, -399.7, 151.8 | geometry | `game.shot(708.9, -397.64, 152.22, 78, -12, 13)` |
| in.02 713.0, -399.7, 308.6 (in.02 1876>929) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 713.0, -399.7, 308.0 | geometry | `game.shot(712.97, -398.00, 308.59, 3, -12, 13)` |
| in.07 1008.8, -399.1, 307.0 (in.07 1895>960) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 1008.8, -399.7, 307.6 | geometry | `game.shot(1008.83, -397.49, 307.01, 183, -12, 13)` |
| in.21 861.2, -398.8, 458.2 (in.21 1969>1072) | 9 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 861.2, -399.7, 457.6 | geometry | `game.shot(861.17, -397.13, 458.19, 3, -12, 13)` |
| in.36 257.0, -399.7, 607.5 (in.36 2006>1135) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 257.0, -399.7, 608.1 | geometry | `game.shot(257.03, -398.00, 607.51, 183, -12, 13)` |
| in.66 408.8, -399.7, 757.7 (in.66 2090>1281) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 408.8, -399.7, 758.3 | geometry | `game.shot(408.83, -398.00, 757.71, 183, -12, 13)` |
| in.67 561.0, -399.7, 753.3 (in.67 2099>1300) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 560.4, -399.7, 753.3 | geometry | `game.shot(560.99, -398.00, 753.26, 271, -12, 13)` |
| in.67 558.2, -399.3, 750.8 (in.67 1300>2099) | 9 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 559.1, -399.7, 751.4 | geometry | `game.shot(558.18, -397.64, 750.83, 119, -12, 13)` |
| in.77 1157.0, -399.1, 757.0 (in.77 2125>1357) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 1157.0, -399.7, 757.6 | geometry | `game.shot(1157.03, -397.49, 757.01, 183, -12, 13)` |
| in.93 412.8, -399.7, 903.2 (in.93 2140>1405) | 9 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 412.2, -399.7, 903.3 | geometry | `game.shot(412.79, -398.00, 903.17, 262, -12, 13)` |
| in.113 857.0, -398.9, 907.0 (in.113 2160>1447) | 9 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 857.0, -399.7, 907.6 | geometry | `game.shot(857.03, -397.19, 907.01, 183, -12, 13)` |
| fisher 710.7, -398.9, 152.5 (fisher 1785>805) | 8 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 711.8, -399.7, 154.3 | geometry | `game.shot(710.72, -397.19, 152.54, 148, -12, 13)` |
| in.08 1161.5, -398.9, 300.7 (in.08 1903>978) | 8 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 1161.5, -399.7, 300.1 | geometry | `game.shot(1161.53, -397.27, 300.69, 357, -12, 13)` |
| in.40 708.5, -399.7, 601.5 (in.40 2036>1187) | 8 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 708.0, -399.7, 601.2 | geometry | `game.shot(708.49, -398.00, 601.53, 304, -12, 13)` |
| in.74 856.7, -399.0, 750.7 (in.74 2113>1330) | 8 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 856.2, -399.7, 750.4 | geometry | `game.shot(856.69, -397.37, 750.73, 304, -12, 13)` |
| in.04 856.7, -398.9, 301.1 (in.04 1885>953) | 7 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 856.7, -399.7, 300.5 | geometry | `game.shot(856.67, -397.19, 301.09, 3, -12, 13)` |
| in.12 261.5, -399.0, 450.3 (in.12 1924>1018) | 7 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 261.5, -399.7, 450.9 | geometry | `game.shot(261.51, -397.35, 450.31, 181, -12, 13)` |
| in.34 1308.7, -398.8, 450.2 (in.34 1995>1128) | 7 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 1308.0, -399.7, 450.6 | geometry | `game.shot(1308.71, -397.17, 450.16, 241, -12, 13)` |
| in.38 561.4, -399.4, 600.1 (in.38 2027>1176) | 7 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 561.5, -399.7, 600.7 | geometry | `game.shot(561.44, -397.77, 600.11, 174, -12, 13)` |
| in.94 559.9, -398.9, 904.3 (in.94 2142>1423) | 7 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 560.3, -399.7, 904.8 | geometry | `game.shot(559.89, -397.27, 904.29, 138, -12, 13)` |
| high.c 261.7, -399.7, 1050.9 (high.c 2200>1520) | 7 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 262.0, -399.7, 1050.4 | geometry | `game.shot(261.66, -398.00, 1050.88, 35, -12, 13)` |
| outdoors 57.9, -2.1, 2.2 (street 46>45) | 2 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 52.9, -0.1, 2.1 | geometry | `game.shot(57.93, -0.40, 2.18, 271, -12, 13)` |
| outdoors 8.9, 0.4, 3.2 (street 365>1530) | 2 | could not be walked: lifted to the next way point after 3 tries (walk); heading for 8.7, 0.0, 3.7 | geometry | `game.shot(8.9, 2.02, 3.16, 196, -12, 13)` |
| inn 258.8, -398.7, 1.8 (inn 1663>1672) | 2 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 256.5, -399.7, 3.4 | geometry | `game.shot(258.84, -397.08, 1.78, 236, -12, 13)` |
| chapel 1312.0, -399.4, -1.0 (chapel 1745>736) | 2 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 1312.5, -399.7, 0.0 | geometry | `game.shot(1311.97, -397.77, -1.01, 155, -12, 13)` |
| outdoors 45.4, 6.4, -150.5 (path bridge up 3) | 2 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 46.0, 4.1, -150.0 | geometry | `game.shot(45.44, 8.07, -150.46, 129, -12, 13)` |
| outdoors 46.0, 4.1, -150.0 (path bridge up 4) | 2 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 51.0, 4.8, -150.0 | geometry | `game.shot(46, 5.80, -150, 90, -12, 13)` |
| outdoors -9.7, 6.0, -59.0 (street 80>79) | 1 | could not be walked: lifted to the next way point after 4 tries (stair); heading for -9.4, 4.6, -55.3 | geometry | `game.shot(-9.73, 7.61, -59.02, 174, -12, 13)` |
| outdoors -6.7, 5.3, -58.0 (street 79>80) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for -6.8, 5.7, -59.5 | geometry | `game.shot(-6.74, 6.94, -58.02, 359, -12, 13)` |
| outdoors -4.0, 5.7, -59.0 (street 80>1565) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for -4.3, 8.8, -56.0 | geometry | `game.shot(-3.95, 7.33, -59.02, 186, -12, 13)` |
| outdoors -5.0, 8.8, -58.0 (street 1565>80) | 1 | could not be walked: lifted to the next way point after 4 tries (stair); heading for -6.8, 5.7, -59.5 | geometry | `game.shot(-4.97, 10.43, -58.02, 309, -12, 13)` |
| outdoors -0.4, 5.3, -59.0 (street 83>1564) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 0.9, 4.1, -56.0 | geometry | `game.shot(-0.42, 6.91, -59.02, 156, -12, 13)` |
| outdoors 1.1, 4.5, -57.3 (street 1564>83) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for -1.6, 6.4, -61.4 | geometry | `game.shot(1.07, 6.14, -57.28, 328, -12, 13)` |
| outdoors 1.7, 5.4, -59.0 (street 553>557) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 7.1, 2.6, -44.7 | geometry | `game.shot(1.67, 7.04, -59.02, 159, -12, 13)` |
| outdoors 11.4, 0.1, -19.9 (street 561>1561) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 11.4, 3.7, -19.8 | geometry | `game.shot(11.41, 1.74, -19.86, 280, -12, 13)` |
| outdoors 5.8, 4.0, -56.8 (street 557>553) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 8.3, 3.9, -60.6 | geometry | `game.shot(5.81, 5.68, -56.8, 34, -12, 13)` |
| outdoors 57.1, 1.1, 3.0 (street 47>46) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 57.9, -2.1, 2.2 | geometry | `game.shot(57.09, 2.79, 2.99, 46, -12, 13)` |
| outdoors 11.6, 0.5, 5.5 (street 445>1529) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 11.1, -0.1, 5.1 | geometry | `game.shot(11.6, 2.20, 5.45, 302, -12, 13)` |
| outdoors 9.0, 0.2, 4.6 (street 445>365) | 1 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 9.0, 0.0, 3.0 | geometry | `game.shot(8.96, 1.88, 4.59, 1, -12, 13)` |
| outdoors 10.7, 0.9, -3.5 (street 37>1553) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 11.7, 0.0, -3.7 | geometry | `game.shot(10.69, 2.57, -3.5, 79, -12, 13)` |
| outdoors 14.2, 0.2, -16.9 (street 375>1559) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 13.7, 3.7, -16.4 | geometry | `game.shot(14.22, 1.89, -16.93, 224, -12, 13)` |
| outdoors 36.8, 0.3, 3.2 (street 42>1549) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 36.6, -0.3, 3.8 | geometry | `game.shot(36.77, 1.97, 3.18, 197, -12, 13)` |
| outdoors 40.7, 0.1, 4.2 (street 43>1550) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 41.1, -0.2, 3.8 | geometry | `game.shot(40.71, 1.78, 4.23, 43, -12, 13)` |
| outdoors 59.0, 1.1, 2.7 (street 45>46) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 57.9, -2.1, 2.2 | geometry | `game.shot(58.99, 2.80, 2.68, 295, -12, 13)` |
| outdoors 104.9, 1.1, 92.0 (street 171>172) | 1 | could not be walked: lifted to the next way point after 4 tries (stair); heading for 107.5, 0.6, 93.1 | geometry | `game.shot(104.94, 2.71, 91.95, 114, -12, 13)` |
| outdoors -3.9, 0.8, 18.1 (street 99>379) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for -14.3, 3.4, 17.5 | geometry | `game.shot(-3.88, 2.41, 18.1, 273, -12, 13)` |
| outdoors -5.3, 2.6, 23.0 (street 379>99) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for -1.1, -0.3, 21.2 | geometry | `game.shot(-5.32, 4.23, 23.03, 67, -12, 13)` |
| outdoors 10.2, -3.9, 103.9 (street 112>1538) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 9.5, -1.1, 102.8 | geometry | `game.shot(10.22, -2.24, 103.92, 326, -12, 13)` |
| outdoors 13.9, -2.3, 82.8 (street 111>1540) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 14.0, 0.0, 80.0 | geometry | `game.shot(13.86, -0.64, 82.82, 3, -12, 13)` |
| outdoors 80.8, -0.5, 17.2 (street 154>1541) | 1 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 93.0, -0.4, 16.0 | geometry | `game.shot(80.81, 1.16, 17.24, 84, -12, 13)` |
| outdoors 81.6, -0.5, 12.2 (street 1541>154) | 1 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 74.5, -0.6, 14.3 | geometry | `game.shot(81.59, 1.20, 12.21, 253, -12, 13)` |
| outdoors 112.5, 0.6, 19.0 (street 407>1542) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 112.0, 0.3, 20.0 | geometry | `game.shot(112.52, 2.23, 18.96, 207, -12, 13)` |
| outdoors 112.1, 0.9, 11.6 (street 1542>407) | 1 | could not be walked: lifted to the next way point after 5 tries (stair); heading for 107.7, 1.1, -3.0 | geometry | `game.shot(112.09, 2.53, 11.59, 343, -12, 13)` |
| outdoors -65.1, 0.4, 43.3 (street 134>1547) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for -65.8, -0.3, 42.9 | geometry | `game.shot(-65.14, 2.10, 43.29, 301, -12, 13)` |
| inn 258.4, -398.8, 0.6 (inn 1663>610) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 258.4, -399.7, 1.4 | geometry | `game.shot(258.41, -397.17, 0.64, 184, -12, 13)` |

(104 more in shots/walk/walk.json)

## The villagers’ graph joins two levels with no walkable way (villagers are slid along it) (3)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors 68.8, 0.5, 7.3 (street 114>1567) | 1 | could not be walked: lifted to the next way point after 4 tries (level); heading for 70.0, 3.0, 5.5 | geometry | `game.shot(68.78, 2.12, 7.34, 34, -12, 13)` |
| outdoors 7.2, -0.0, 19.5 (street 98>1568) | 1 | could not be walked: lifted to the next way point after 5 tries (level); heading for 6.0, 10.5, 19.0 | geometry | `game.shot(7.2, 1.62, 19.52, 293, -12, 13)` |
| outdoors 5.6, 10.5, 17.9 (street 1568>98) | 1 | could not be walked: lifted to the next way point after 5 tries (level); heading for -0.6, -0.0, 16.1 | geometry | `game.shot(5.59, 12.20, 17.89, 286, -12, 13)` |

## The villagers’ graph passes through a wall (villagers walk through it) (41)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| in.33 1159.1, -399.7, 450.6 (in.33 1979>1104) | 8 | the villagers’ way from here to 1155.7,-399.66,450.6 passes through a solid box 1.2 x 0.8 m | geometry | `game.shot(1159.1, -398.00, 450.65, 271, -12, 13)` |
| in.33 1155.7, -399.7, 450.6 (in.33 1104>1979) | 8 | the villagers’ way from here to 1159.1,-399.66,450.65 passes through a solid box 1.2 x 0.8 m | geometry | `game.shot(1155.7, -398.00, 450.6, 91, -12, 13)` |
| outdoors -33.2, 0.5, -28.4 (street 513>545) | 2 | the villagers’ way from here to -32.7,0.71,-36.8 passes through a solid box 6.2 x 0.3 m | geometry | `game.shot(-33.23, 2.20, -28.37, 4, -12, 13)` |
| outdoors -9.8, -1.7, 83.8 (street 357>358) | 2 | the villagers’ way from here to -5.4,-1.7,82.2 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(-9.82, -0.04, 83.85, 70, -12, 13)` |
| outdoors -22.0, -1.2, 62.1 (street 525>577) | 2 | the villagers’ way from here to -24.84,-1.16,73.6 passes through a solid box 7.0 x 0.3 m | geometry | `game.shot(-21.98, 0.50, 62.08, 194, -12, 13)` |
| farm 411.0, -399.7, 153.7 (farm 1767>1775) | 2 | the villagers’ way from here to 412,-399.66,149.55 passes through a solid box 0.4 x 10.3 m | geometry | `game.shot(411, -398.00, 153.65, 14, -12, 13)` |
| in.115 1010.9, -399.7, 904.1 (in.115 2170>2178) | 2 | the villagers’ way from here to 1011.9,-399.66,900.05 passes through a solid box 0.4 x 10.3 m | geometry | `game.shot(1010.9, -398.00, 904.15, 14, -12, 13)` |
| outdoors -16.5, 1.0, -29.7 (street 465>513) | 1 | the villagers’ way from here to -33.23,0.54,-28.37 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(-16.47, 2.69, -29.66, 266, -12, 13)` |
| outdoors -32.7, 0.7, -36.8 (street 545>513) | 1 | the villagers’ way from here to -33.23,0.54,-28.37 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(-32.7, 2.37, -36.8, 184, -12, 13)` |
| outdoors -23.6, 2.0, -42.1 (street 517>533) | 1 | the villagers’ way from here to -40.47,2.29,-64.6 passes through a solid box 3.1 x 0.3 m | geometry | `game.shot(-23.57, 3.69, -42.14, 323, -12, 13)` |
| outdoors -40.5, 2.3, -64.6 (street 533>517) | 1 | the villagers’ way from here to -23.57,2.03,-42.14 passes through a solid box 2.0 x 0.3 m | geometry | `game.shot(-40.47, 3.95, -64.6, 143, -12, 13)` |
| outdoors 110.0, 8.9, -115.0 (street 282>283) | 1 | the villagers’ way from here to 112.27,8.85,-110.59 passes through a solid post | geometry | `game.shot(110, 10.59, -115, 153, -12, 13)` |
| outdoors 18.1, -0.0, -6.6 (street 375>1558) | 1 | the villagers’ way from here to 21.2,-0.02,-16.4 passes through a solid box 2.8 x 1.0 m | geometry | `game.shot(18.1, 1.63, -6.6, 18, -12, 13)` |
| outdoors 21.2, -0.0, -16.4 (street 1558>375) | 1 | the villagers’ way from here to 18.1,-0.03,-6.6 passes through a solid box 6.6 x 0.3 m | geometry | `game.shot(21.2, 1.64, -16.4, 198, -12, 13)` |
| outdoors 30.7, -0.3, 4.7 (street 437>585) | 1 | the villagers’ way from here to 29.8,-0.53,15.4 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(30.7, 1.32, 4.67, 185, -12, 13)` |
| outdoors 29.8, -0.5, 15.4 (street 585>437) | 1 | the villagers’ way from here to 30.7,-0.34,4.67 passes through a solid box 6.0 x 0.3 m | geometry | `game.shot(29.8, 1.13, 15.4, 5, -12, 13)` |
| outdoors -14.3, -1.7, 85.8 (street 356>357) | 1 | the villagers’ way from here to -9.82,-1.7,83.85 passes through a solid box 4.6 x 0.3 m | geometry | `game.shot(-14.35, -0.07, 85.84, 66, -12, 13)` |
| outdoors 14.3, -0.8, 19.5 (street 383>521) | 1 | the villagers’ way from here to 23.91,-1.02,34.94 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(14.25, 0.90, 19.53, 148, -12, 13)` |
| outdoors 23.9, -1.0, 34.9 (street 521>383) | 1 | the villagers’ way from here to 14.25,-0.76,19.53 passes through a solid box 4.4 x 5.2 m | geometry | `game.shot(23.91, 0.64, 34.94, 328, -12, 13)` |
| outdoors -14.3, 3.4, 17.5 (street 379>1539) | 1 | the villagers’ way from here to -20,3.4,14.9 passes through a solid box 3.9 x 0.3 m | geometry | `game.shot(-14.25, 5.06, 17.53, 295, -12, 13)` |
| outdoors -20.0, 3.4, 14.9 (street 1539>379) | 1 | the villagers’ way from here to -14.25,3.4,17.53 passes through a solid box 3.9 x 0.3 m | geometry | `game.shot(-20, 5.06, 14.9, 115, -12, 13)` |
| outdoors -2.1, -1.3, 53.7 (street 501>525) | 1 | the villagers’ way from here to -21.98,-1.16,62.08 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(-2.07, 0.40, 53.73, 247, -12, 13)` |
| outdoors -24.8, -1.2, 73.6 (street 577>525) | 1 | the villagers’ way from here to -21.98,-1.16,62.08 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(-24.84, 0.50, 73.6, 14, -12, 13)` |
| outdoors -5.4, -1.7, 82.2 (street 358>357) | 1 | the villagers’ way from here to -9.82,-1.7,83.85 passes through a solid box 2.7 x 0.3 m | geometry | `game.shot(-5.4, -0.04, 82.2, 250, -12, 13)` |
| outdoors 112.3, 8.8, -110.6 (street 283>282) | 1 | the villagers’ way from here to 110,8.93,-115 passes through a solid post | geometry | `game.shot(112.27, 10.51, -110.59, 333, -12, 13)` |
| outdoors -41.9, -0.1, -11.1 (street 387>549) | 1 | the villagers’ way from here to -43.2,0.08,-21.7 passes through a solid box 1.1 x 0.3 m | geometry | `game.shot(-41.9, 1.56, -11.1, 353, -12, 13)` |
| outdoors -43.2, 0.1, -21.7 (street 549>387) | 1 | the villagers’ way from here to -41.9,-0.1,-11.1 passes through a solid box 2.2 x 0.9 m | geometry | `game.shot(-43.2, 1.74, -21.7, 173, -12, 13)` |
| elder 714.4, -399.7, 6.3 (elder 1712>1713) | 1 | the villagers’ way from here to 716.86,-399.66,7 passes through a solid box 3.2 x 0.4 m | geometry | `game.shot(714.4, -398.00, 6.35, 105, -12, 13)` |
| elder 716.9, -399.7, 7.0 (elder 1713>1712) | 1 | the villagers’ way from here to 714.4,-399.66,6.35 passes through a solid box 3.2 x 0.4 m | geometry | `game.shot(716.86, -398.00, 7, 285, -12, 13)` |
| farm 412.0, -399.7, 149.6 (farm 1775>1767) | 1 | the villagers’ way from here to 411,-399.66,153.65 passes through a solid box 0.4 x 10.3 m | geometry | `game.shot(412, -398.00, 149.55, 194, -12, 13)` |
| farm 410.0, -399.7, 148.8 (farm 1777>1767) | 1 | the villagers’ way from here to 411,-399.66,153.65 passes through a solid box 0.4 x 1.5 m | geometry | `game.shot(410, -398.00, 148.85, 168, -12, 13)` |
| farm 410.0, -399.7, 157.2 (farm 1778>1767) | 1 | the villagers’ way from here to 411,-399.66,153.65 passes through a solid box 0.4 x 6.1 m | geometry | `game.shot(410, -398.00, 157.15, 16, -12, 13)` |
| shop.s0 261.0, -399.7, 301.1 (shop.s0 1838>880) | 1 | the villagers’ way from here to 263.8,-399.66,302.75 passes through a solid box 1.9 x 1.5 m | geometry | `game.shot(261, -398.00, 301.15, 120, -12, 13)` |
| shop.s0 263.8, -399.7, 302.8 (shop.s0 880>1838) | 1 | the villagers’ way from here to 261,-399.66,301.15 passes through a solid box 1.9 x 1.5 m | geometry | `game.shot(263.8, -398.00, 302.75, 300, -12, 13)` |
| in.10 1310.9, -399.7, 301.6 (in.10 1912>996) | 1 | the villagers’ way from here to 1309.4,-399.66,300.65 passes through a solid box 1.9 x 1.5 m | geometry | `game.shot(1310.9, -398.00, 301.65, 304, -12, 13)` |
| in.10 1309.4, -399.7, 300.6 (in.10 996>1912) | 1 | the villagers’ way from here to 1310.9,-399.66,301.65 passes through a solid box 1.9 x 1.5 m | geometry | `game.shot(1309.4, -398.00, 300.65, 124, -12, 13)` |
| in.21 861.9, -399.7, 457.1 (in.21 1969>1975) | 1 | the villagers’ way from here to 861.7,-399.66,454.7 passes through a solid box 1.4 x 0.6 m | geometry | `game.shot(861.85, -398.00, 457.15, 356, -12, 13)` |
| in.21 861.7, -399.7, 454.7 (in.21 1975>1969) | 1 | the villagers’ way from here to 861.85,-399.66,457.15 passes through a solid box 1.4 x 0.6 m | geometry | `game.shot(861.7, -398.00, 454.7, 177, -12, 13)` |
| in.115 1011.9, -399.7, 900.0 (in.115 2178>2170) | 1 | the villagers’ way from here to 1010.9,-399.66,904.15 passes through a solid box 0.4 x 10.3 m | geometry | `game.shot(1011.9, -398.00, 900.05, 194, -12, 13)` |
| in.115 1009.9, -399.7, 899.4 (in.115 2180>2170) | 1 | the villagers’ way from here to 1010.9,-399.66,904.15 passes through a solid box 0.4 x 1.5 m | geometry | `game.shot(1009.9, -398.00, 899.35, 168, -12, 13)` |
| in.115 1009.9, -399.7, 907.6 (in.115 2181>2170) | 1 | the villagers’ way from here to 1010.9,-399.66,904.15 passes through a solid box 0.4 x 6.1 m | geometry | `game.shot(1009.9, -398.00, 907.65, 16, -12, 13)` |

## In water for 5 s (5)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors 46.5, 4.1, -150.1 (street 300>301) | 4 | in water for 5 s | geometry | `game.shot(46.46, 5.80, -150.07, 149, -12, 13)` |
| outdoors 57.9, -2.1, 2.2 (street 46>45) | 2 | in water for 5 s | geometry | `game.shot(57.93, -0.40, 2.18, 334, -12, 13)` |
| outdoors 8.7, -2.2, 81.5 (street 111>1540) | 1 | in water for 5 s | geometry | `game.shot(8.68, -0.52, 81.45, 75, -12, 13)` |
| mine 427.4, -400.5, 1081.8 (mine 5) | 1 | in water for 5 s | geometry | `game.shot(427.44, -398.82, 1081.75, 96, -12, 13)` |
| mine 422.4, -400.5, 1081.2 (mine 10) | 1 | in water for 5 s | geometry | `game.shot(422.4, -398.82, 1081.18, 275, -12, 13)` |

## Stuck: no progress for 2 s with W held (249)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| in.93 411.5, -399.7, 901.0 (in.93 2140>1405) | 18 | no progress for 2 s, 2.3 m short of the next way point; heading for 412.2, -399.7, 903.3 | geometry | `game.shot(411.53, -398.00, 901.04, 163, -12, 13)` |
| inn 258.8, -399.7, 1.8 (inn 1663>1672) | 14 | no progress for 2 s, 2.8 m short of the next way point; heading for 256.5, -399.7, 3.4 | geometry | `game.shot(258.84, -398.00, 1.78, 236, -12, 13)` |
| chapel 1311.9, -399.7, 0.0 (chapel 1745>736) | 11 | no progress for 2 s, 0.6 m short of the next way point; heading for 1312.5, -399.7, 0.0 | geometry | `game.shot(1311.86, -398.00, 0.02, 88, -12, 13)` |
| in.65 261.6, -399.7, 757.5 (in.65 2080>1267) | 11 | no progress for 2 s, 0.6 m short of the next way point; heading for 261.2, -399.7, 757.9 | geometry | `game.shot(261.64, -398.00, 757.51, 228, -12, 13)` |
| smithy 412.6, -399.7, 2.3 (smithy 1681>631) | 10 | no progress for 2 s, 0.6 m short of the next way point; heading for 413.1, -399.7, 2.6 | geometry | `game.shot(412.57, -398.00, 2.31, 125, -12, 13)` |
| fisher 711.1, -399.7, 153.6 (fisher 801>1785) | 9 | no progress for 2 s, 1.9 m short of the next way point; heading for 710.6, -399.7, 151.8 | geometry | `game.shot(711.12, -398.00, 153.63, 344, -12, 13)` |
| in.02 713.4, -399.7, 307.5 (in.02 1876>929) | 9 | no progress for 2 s, 0.6 m short of the next way point; heading for 713.0, -399.7, 308.0 | geometry | `game.shot(713.35, -398.00, 307.52, 216, -12, 13)` |
| in.21 861.6, -399.7, 457.2 (in.21 1969>1072) | 9 | no progress for 2 s, 0.6 m short of the next way point; heading for 861.2, -399.7, 457.6 | geometry | `game.shot(861.65, -398.00, 457.21, 229, -12, 13)` |
| in.23 1010.9, -399.7, 451.9 (in.23 1977>1091) | 9 | no progress for 2 s, 2.4 m short of the next way point; heading for 1009.7, -399.7, 454.1 | geometry | `game.shot(1010.87, -398.00, 451.91, 209, -12, 13)` |
| in.23 1010.7, -399.7, 453.4 (in.23 1091>1977) | 9 | no progress for 2 s, 1.7 m short of the next way point; heading for 1010.9, -399.7, 451.6 | geometry | `game.shot(1010.66, -398.00, 453.37, 8, -12, 13)` |
| in.36 256.6, -399.7, 607.6 (in.36 2006>1135) | 9 | no progress for 2 s, 0.6 m short of the next way point; heading for 257.0, -399.7, 608.1 | geometry | `game.shot(256.65, -398.00, 607.62, 144, -12, 13)` |
| in.66 408.4, -399.7, 757.8 (in.66 2090>1281) | 9 | no progress for 2 s, 0.6 m short of the next way point; heading for 408.8, -399.7, 758.3 | geometry | `game.shot(408.45, -398.00, 757.82, 144, -12, 13)` |
| in.67 561.0, -399.7, 750.6 (in.67 2099>1295) | 9 | no progress for 2 s, 0.8 m short of the next way point (stair); heading for 561.4, -399.1, 751.3 | geometry | `game.shot(561.05, -398.00, 750.56, 159, -12, 13)` |
| in.67 559.1, -399.7, 752.9 (in.67 1300>2099) | 9 | no progress for 2 s, 1.5 m short of the next way point; heading for 559.1, -399.7, 751.4 | geometry | `game.shot(559.1, -398.00, 752.87, 0, -12, 13)` |
| in.77 1156.5, -399.7, 757.2 (in.77 2125>1357) | 9 | no progress for 2 s, 0.6 m short of the next way point; heading for 1157.0, -399.7, 757.6 | geometry | `game.shot(1156.54, -398.00, 757.23, 129, -12, 13)` |
| in.82 1310.9, -399.7, 751.3 (in.82 2133>1375) | 9 | no progress for 2 s, 2.0 m short of the next way point; heading for 1309.7, -399.7, 752.9 | geometry | `game.shot(1310.87, -398.00, 751.25, 216, -12, 13)` |
| in.82 1309.3, -399.7, 752.5 (in.82 1375>2133) | 9 | no progress for 2 s, 2.2 m short of the next way point; heading for 1310.9, -399.7, 751.0 | geometry | `game.shot(1309.25, -398.00, 752.47, 47, -12, 13)` |
| in.113 856.6, -399.7, 907.2 (in.113 2160>1447) | 9 | no progress for 2 s, 0.6 m short of the next way point; heading for 857.0, -399.7, 907.6 | geometry | `game.shot(856.56, -398.00, 907.2, 132, -12, 13)` |
| guardhouse 1014.7, -399.7, 0.3 (guardhouse 704>1727) | 8 | no progress for 2 s, 3.8 m short of the next way point; heading for 1010.9, -399.7, 0.3 | geometry | `game.shot(1014.72, -398.00, 0.33, 270, -12, 13)` |
| fisher 710.6, -399.7, 151.8 (fisher 1785>805) | 8 | no progress for 2 s, 2.7 m short of the next way point; heading for 711.8, -399.7, 154.3 | geometry | `game.shot(710.64, -398.00, 151.83, 154, -12, 13)` |
| in.04 858.9, -399.7, 300.5 (in.04 1885>947) | 8 | no progress for 2 s, 2.2 m short of the next way point; heading for 856.7, -399.7, 300.5 | geometry | `game.shot(858.87, -398.00, 300.5, 270, -12, 13)` |
| in.08 1160.9, -399.7, 300.1 (in.08 1903>978) | 8 | no progress for 2 s, 0.6 m short of the next way point; heading for 1161.5, -399.7, 300.1 | geometry | `game.shot(1160.91, -398.00, 300.14, 86, -12, 13)` |
| in.12 260.9, -399.7, 450.8 (in.12 1924>1012) | 8 | no progress for 2 s, 0.6 m short of the next way point; heading for 261.5, -399.7, 450.9 | geometry | `game.shot(260.92, -398.00, 450.77, 103, -12, 13)` |
| in.34 1308.5, -399.7, 450.3 (in.34 1995>1122) | 8 | no progress for 2 s, 0.6 m short of the next way point; heading for 1308.0, -399.7, 450.6 | geometry | `game.shot(1308.52, -398.00, 450.27, 242, -12, 13)` |
| in.40 708.5, -399.7, 600.6 (in.40 1187>2036) | 8 | no progress for 2 s, 2.4 m short of the next way point; heading for 710.9, -399.7, 601.0 | geometry | `game.shot(708.53, -398.00, 600.56, 99, -12, 13)` |
| in.40 710.7, -399.7, 601.2 (in.40 2036>1191) | 8 | no progress for 2 s, 1.3 m short of the next way point; heading for 709.4, -399.7, 601.2 | geometry | `game.shot(710.72, -398.00, 601.2, 270, -12, 13)` |
| in.74 856.7, -399.7, 750.8 (in.74 2113>1330) | 8 | no progress for 2 s, 0.6 m short of the next way point; heading for 856.2, -399.7, 750.4 | geometry | `game.shot(856.68, -398.00, 750.75, 306, -12, 13)` |
| in.94 559.8, -399.7, 904.4 (in.94 2142>1418) | 8 | no progress for 2 s, 0.6 m short of the next way point; heading for 560.3, -399.7, 904.8 | geometry | `game.shot(559.81, -398.00, 904.42, 124, -12, 13)` |
| guardhouse 1011.2, -399.7, 0.6 (guardhouse 1727>704) | 7 | no progress for 2 s, 4.1 m short of the next way point; heading for 1015.3, -399.7, 0.3 | geometry | `game.shot(1011.23, -398.00, 0.61, 86, -12, 13)` |
| in.07 1008.8, -399.7, 307.0 (in.07 1895>967) | 7 | no progress for 2 s, 0.6 m short of the next way point; heading for 1008.8, -399.7, 307.6 | geometry | `game.shot(1008.83, -398.00, 307.01, 183, -12, 13)` |
| in.38 560.9, -399.7, 600.8 (in.38 2027>1176) | 7 | no progress for 2 s, 0.6 m short of the next way point; heading for 561.5, -399.7, 600.7 | geometry | `game.shot(560.93, -398.00, 600.84, 76, -12, 13)` |
| high.c 261.6, -399.7, 1050.8 (high.c 2200>1520) | 7 | no progress for 2 s, 0.6 m short of the next way point; heading for 262.0, -399.7, 1050.4 | geometry | `game.shot(261.55, -398.00, 1050.78, 50, -12, 13)` |
| outdoors 8.9, 0.0, 3.2 (street 365>445) | 3 | no progress for 2 s, 5.5 m short of the next way point; heading for 12.3, -0.2, 7.5 | geometry | `game.shot(8.9, 1.66, 3.16, 142, -12, 13)` |
| outdoors 58.0, 0.9, 2.2 (street 47>46) | 2 | no progress for 2 s, 0.1 m short of the next way point (stair); heading for 57.9, -2.1, 2.2 | geometry | `game.shot(57.98, 2.58, 2.2, 214, -12, 13)` |
| outdoors 57.9, -2.1, 2.2 (street 46>45) | 2 | no progress for 2 s, 5.0 m short of the next way point (stair); heading for 52.9, -0.1, 2.1 | geometry | `game.shot(57.93, -0.40, 2.18, 271, -12, 13)` |
| outdoors 11.5, -0.1, 5.6 (street 445>1529) | 2 | no progress for 2 s, 0.6 m short of the next way point; heading for 11.1, -0.1, 5.1 | geometry | `game.shot(11.51, 1.57, 5.57, 316, -12, 13)` |
| outdoors 105.3, 0.5, 93.0 (street 172>171) | 2 | no progress for 2 s, 3.9 m short of the next way point (stair); heading for 104.3, -0.3, 89.3 | geometry | `game.shot(105.26, 2.19, 93.01, 346, -12, 13)` |
| outdoors 80.8, -0.5, 15.5 (street 154>1541) | 2 | no progress for 2 s, 12.2 m short of the next way point; heading for 93.0, -0.4, 16.0 | geometry | `game.shot(80.81, 1.15, 15.53, 92, -12, 13)` |
| outdoors -135.0, -0.5, -57.2 (street 179>178) | 2 | no progress for 2 s, 3.4 m short of the next way point; heading for -136.0, -0.5, -54.0 | geometry | `game.shot(-134.97, 1.18, -57.19, 198, -12, 13)` |
| smithy 409.0, -399.7, 6.0 (smithy 1687>1683) | 2 | no progress for 2 s, 1.7 m short of the next way point; heading for 410.5, -399.7, 6.7 | geometry | `game.shot(408.98, -398.00, 6, 113, -12, 13)` |
| mill 266.0, -396.7, 147.6 (mill 1759>751) | 2 | no progress for 2 s, 1.3 m short of the next way point (stair); heading for 264.7, -396.1, 147.7 | geometry | `game.shot(266.02, -395.05, 147.58, 267, -12, 13)` |
| shop.s1 410.6, -402.5, 307.4 (shop.s1 1854>1860) | 2 | no progress for 2 s, 0.7 m short of the next way point; heading for 410.6, -402.5, 306.7 | geometry | `game.shot(410.6, -400.85, 307.44, 0, -12, 13)` |
| shop.s2 560.6, -402.5, 307.4 (shop.s2 1866>1872) | 2 | no progress for 2 s, 0.7 m short of the next way point; heading for 560.6, -402.5, 306.7 | geometry | `game.shot(560.6, -400.85, 307.44, 0, -12, 13)` |
| in.02 713.6, -396.7, 307.1 (in.02 1878>930) | 2 | no progress for 2 s, 1.2 m short of the next way point (stair); heading for 712.6, -396.1, 306.3 | geometry | `game.shot(713.62, -395.05, 307.05, 308, -12, 13)` |
| in.04 861.4, -399.7, 305.4 (in.04 1890>1886) | 2 | no progress for 2 s, 1.4 m short of the next way point; heading for 861.4, -399.7, 306.8 | geometry | `game.shot(861.35, -398.00, 305.36, 180, -12, 13)` |
| in.04 859.9, -396.6, 306.7 (in.04 1888>949) | 2 | no progress for 2 s, 2.0 m short of the next way point (stair); heading for 861.9, -396.1, 306.7 | geometry | `game.shot(859.88, -394.95, 306.73, 90, -12, 13)` |
| in.07 1008.4, -399.7, 307.2 (in.07 1895>960) | 2 | no progress for 2 s, 0.6 m short of the next way point; heading for 1008.8, -399.7, 307.6 | geometry | `game.shot(1008.35, -398.00, 307.22, 130, -12, 13)` |
| in.34 1312.2, -396.7, 456.0 (in.34 1998>1124) | 2 | no progress for 2 s, 2.0 m short of the next way point (stair); heading for 1314.2, -396.1, 456.0 | geometry | `game.shot(1312.18, -395.05, 456.03, 90, -12, 13)` |
| in.36 256.4, -396.7, 607.1 (in.36 2008>1136) | 2 | no progress for 2 s, 1.2 m short of the next way point (stair); heading for 257.4, -396.1, 606.4 | geometry | `game.shot(256.38, -395.05, 607.15, 52, -12, 13)` |
| in.36 256.5, -396.7, 605.9 (in.36 1136>2008) | 2 | no progress for 2 s, 1.3 m short of the next way point (stair); heading for 256.4, -396.7, 607.1 | geometry | `game.shot(256.52, -395.05, 605.9, 188, -12, 13)` |
| in.66 408.2, -396.7, 757.4 (in.66 2092>1282) | 2 | no progress for 2 s, 1.2 m short of the next way point (stair); heading for 409.1, -396.1, 756.6 | geometry | `game.shot(408.18, -395.05, 757.35, 52, -12, 13)` |
| in.66 408.3, -396.7, 756.1 (in.66 1282>2092) | 2 | no progress for 2 s, 1.3 m short of the next way point (stair); heading for 408.1, -396.7, 757.4 | geometry | `game.shot(408.32, -395.05, 756.1, 188, -12, 13)` |
| in.74 856.9, -399.7, 755.3 (in.74 2118>2114) | 2 | no progress for 2 s, 1.4 m short of the next way point; heading for 856.9, -399.7, 756.6 | geometry | `game.shot(856.85, -398.00, 755.26, 180, -12, 13)` |
| in.94 559.4, -396.7, 903.6 (in.94 2143>1419) | 2 | no progress for 2 s, 2.0 m short of the next way point (stair); heading for 561.4, -396.1, 903.6 | geometry | `game.shot(559.38, -395.05, 903.58, 90, -12, 13)` |
| high.c 256.9, -399.7, 1055.3 (high.c 2205>2201) | 2 | no progress for 2 s, 1.4 m short of the next way point; heading for 256.9, -399.7, 1056.7 | geometry | `game.shot(256.85, -398.00, 1055.26, 180, -12, 13)` |
| outdoors 45.9, 6.2, -150.0 (path bridge up 3) | 2 | no progress for 2 s, 0.1 m short of the next way point (stair); heading for 46.0, 4.1, -150.0 | geometry | `game.shot(45.93, 7.84, -149.99, 136, -12, 13)` |
| outdoors 46.0, 4.1, -150.0 (path bridge up 4) | 2 | no progress for 2 s, 5.0 m short of the next way point (stair); heading for 51.0, 4.8, -150.0 | geometry | `game.shot(46, 5.80, -150, 90, -12, 13)` |
| outdoors 0.0, 0.0, -6.4 (street 362>359) | 1 | no progress for 2 s, 4.4 m short of the next way point; heading for 0.0, 0.0, -2.0 | geometry | `game.shot(0.01, 1.66, -6.42, 180, -12, 13)` |
| outdoors -0.0, 0.0, -2.8 (street 359>362) | 1 | no progress for 2 s, 7.2 m short of the next way point; heading for 0.0, 0.0, -10.0 | geometry | `game.shot(-0.02, 1.66, -2.78, 0, -12, 13)` |
| outdoors -9.3, 5.6, -59.0 (street 80>79) | 1 | no progress for 2 s, 3.7 m short of the next way point (stair); heading for -9.4, 4.6, -55.3 | geometry | `game.shot(-9.29, 7.22, -59.02, 181, -12, 13)` |

(189 more in shots/walk/walk.json)

## The eye or the near plane inside something solid (10)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| in.65 260.4, -396.8, 757.0 (in.65 1268>2082) | 2 | the eye is inside a solid box 0.7 x 1.8 m from y 2.9 to 5.3 | player | `game.shot(260.38, -395.15, 756.95, 120, -12, 13)` |
| in.70 709.8, -402.5, 759.0 (in.70 1317>1318) | 2 | the eye is inside a solid box 1.9 x 0.7 m from y -2.8 to -0.2 | player | `game.shot(709.77, -400.85, 758.99, 204, -12, 13)` |
| in.77 1157.8, -396.7, 756.6 (in.77 1358>2127) | 2 | the eye is inside a solid box 0.7 x 1.8 m from y 3.0 to 5.4 | player | `game.shot(1157.82, -395.05, 756.65, 240, -12, 13)` |
| in.113 857.8, -396.7, 906.6 (in.113 1448>2162) | 2 | the eye is inside a solid box 0.7 x 1.8 m from y 3.0 to 5.4 | player | `game.shot(857.82, -395.05, 906.65, 240, -12, 13)` |
| in.116 1158.0, -402.5, 909.2 (in.116 1487>1488) | 2 | the eye is inside a solid box 1.9 x 0.7 m from y -2.8 to -0.2 | player | `game.shot(1157.97, -400.85, 909.2, 204, -12, 13)` |
| outdoors 14.0, 3.7, -22.2 (street 1561>561) | 1 | the eye is inside a solid box 6.4 x 0.2 m from y 3.7 to 7.1 | player | `game.shot(14.04, 5.40, -22.22, 71, -12, 13)` |
| store 558.6, -396.1, 5.3 (store 1693>652) | 1 | the eye is inside a solid box 1.2 x 0.3 m from y 3.6 to 5.4 | player | `game.shot(558.63, -394.41, 5.32, 153, -12, 13)` |
| draper 858.9, -402.5, 158.7 (draper 820>821) | 1 | the eye is inside a solid box 1.9 x 0.7 m from y -2.8 to -0.2 | player | `game.shot(858.87, -400.85, 158.68, 207, -12, 13)` |
| in.15 558.0, -402.5, 458.6 (in.15 1046>1047) | 1 | the eye is inside a solid box 1.9 x 0.7 m from y -2.8 to -0.2 | player | `game.shot(557.97, -400.85, 458.64, 204, -12, 13)` |
| in.20 709.8, -402.5, 459.3 (in.20 1063>1064) | 1 | the eye is inside a solid box 1.9 x 0.7 m from y -2.8 to -0.2 | player | `game.shot(709.77, -400.85, 459.25, 204, -12, 13)` |

## Stairs that needed more than one try (45)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors 14.6, 0.8, -30.2 (street 557>561) | 2 | the stair needed 5 tries; heading for 15.1, 0.8, -30.2 | geometry | `game.shot(14.58, 2.49, -30.21, 91, -12, 13)` |
| in.36 256.5, -396.0, 606.6 (in.36 1136>2008) | 2 | the stair needed 3 tries; heading for 256.4, -396.7, 607.1 | geometry | `game.shot(256.46, -394.32, 606.63, 192, -12, 13)` |
| in.66 408.3, -396.0, 756.8 (in.66 1282>2092) | 2 | the stair needed 3 tries; heading for 408.1, -396.7, 757.4 | geometry | `game.shot(408.26, -394.32, 756.83, 192, -12, 13)` |
| outdoors 104.7, -0.2, 89.6 (street 172>171) | 1 | the stair needed 3 tries; heading for 104.3, -0.3, 89.3 | geometry | `game.shot(104.72, 1.45, 89.57, 307, -12, 13)` |
| inn 263.0, -396.2, 5.7 (inn 614>1670) | 1 | the stair needed 4 tries; heading for 263.5, -396.2, 5.8 | geometry | `game.shot(262.99, -394.55, 5.67, 109, -12, 13)` |
| store 559.0, -396.1, 5.9 (store 1693>652) | 1 | the stair needed 3 tries; heading for 559.4, -395.6, 6.3 | geometry | `game.shot(559.03, -394.45, 5.92, 142, -12, 13)` |
| store 559.0, -398.1, 8.3 (store 657>656) | 1 | the stair needed 3 tries; heading for 558.9, -399.7, 7.8 | geometry | `game.shot(559.04, -396.47, 8.33, 344, -12, 13)` |
| guardhouse 1007.4, -395.5, -1.1 (guardhouse 1730>712) | 1 | the stair needed 3 tries; heading for 1007.9, -395.6, -1.4 | geometry | `game.shot(1007.44, -393.80, -1.09, 55, -12, 13)` |
| weaver 1159.1, -396.0, 8.1 (weaver 1739>724) | 1 | the stair needed 4 tries; heading for 1159.2, -396.1, 8.6 | geometry | `game.shot(1159.09, -394.30, 8.09, 174, -12, 13)` |
| weaver 1156.4, -398.3, 4.2 (weaver 727>726) | 1 | the stair needed 3 tries; heading for 1156.8, -399.7, 4.2 | geometry | `game.shot(1156.42, -396.60, 4.17, 94, -12, 13)` |
| mill 267.4, -396.2, 147.6 (mill 1759>752) | 1 | the stair needed 3 tries; heading for 267.9, -396.1, 147.7 | geometry | `game.shot(267.39, -394.52, 147.59, 96, -12, 13)` |
| mill 263.5, -398.3, 144.9 (mill 755>754) | 1 | the stair needed 4 tries; heading for 263.5, -399.7, 145.3 | geometry | `game.shot(263.48, -396.60, 144.93, 177, -12, 13)` |
| farm 407.1, -396.6, 155.6 (farm 772>1770) | 1 | the stair needed 2 tries; heading for 407.5, -396.6, 155.4 | geometry | `game.shot(407.05, -394.95, 155.62, 64, -12, 13)` |
| in.02 712.4, -396.7, 305.8 (in.02 1878>930) | 1 | the stair needed 3 tries; heading for 712.6, -396.1, 306.3 | geometry | `game.shot(712.43, -395.05, 305.8, 155, -12, 13)` |
| in.02 714.0, -396.1, 307.2 (in.02 930>1878) | 1 | the stair needed 3 tries; heading for 713.6, -396.7, 307.1 | geometry | `game.shot(714.03, -394.40, 307.22, 294, -12, 13)` |
| in.02 712.9, -396.7, 304.6 (in.02 1878>931) | 1 | the stair needed 3 tries; heading for 712.6, -396.1, 305.0 | geometry | `game.shot(712.9, -395.05, 304.57, 209, -12, 13)` |
| in.07 1009.1, -396.0, 308.6 (in.07 1897>962) | 1 | the stair needed 4 tries; heading for 1009.1, -396.1, 309.1 | geometry | `game.shot(1009.09, -394.30, 308.59, 174, -12, 13)` |
| in.07 1006.4, -398.3, 304.7 (in.07 965>964) | 1 | the stair needed 3 tries; heading for 1006.9, -399.7, 304.7 | geometry | `game.shot(1006.42, -396.60, 304.67, 94, -12, 13)` |
| in.13 408.2, -396.0, 456.3 (in.13 1026>1937) | 1 | the stair needed 3 tries; heading for 408.1, -396.9, 456.9 | geometry | `game.shot(408.18, -394.38, 456.32, 183, -12, 13)` |
| in.21 861.6, -396.7, 457.6 (in.21 1073>1971) | 1 | the stair needed 4 tries; heading for 861.9, -396.7, 457.1 | geometry | `game.shot(861.63, -395.05, 457.61, 26, -12, 13)` |
| in.21 860.9, -396.2, 458.6 (in.21 1971>1074) | 1 | the stair needed 3 tries; heading for 860.9, -396.1, 459.1 | geometry | `game.shot(860.91, -394.52, 458.59, 186, -12, 13)` |
| in.21 863.6, -398.3, 454.7 (in.21 1077>1076) | 1 | the stair needed 4 tries; heading for 863.1, -399.7, 454.7 | geometry | `game.shot(863.57, -396.60, 454.68, 267, -12, 13)` |
| in.23 1013.5, -399.7, 452.0 (in.23 1977>1086) | 1 | the stair needed 3 tries; heading for 1013.1, -399.1, 451.6 | geometry | `game.shot(1013.53, -398.00, 452.02, 316, -12, 13)` |
| in.33 1156.3, -396.5, 457.1 (in.33 1106>1983) | 1 | the stair needed 3 tries; heading for 1156.6, -396.5, 456.6 | geometry | `game.shot(1156.3, -394.85, 457.08, 35, -12, 13)` |
| in.34 1310.5, -396.7, 456.3 (in.34 1124>1998) | 1 | the stair needed 4 tries; heading for 1310.9, -396.7, 456.1 | geometry | `game.shot(1310.51, -395.05, 456.29, 58, -12, 13)` |
| in.34 1312.2, -396.5, 453.8 (in.34 1998>1125) | 1 | the stair needed 5 tries; heading for 1312.4, -396.1, 454.3 | geometry | `game.shot(1312.22, -394.82, 453.78, 163, -12, 13)` |
| in.36 257.6, -396.7, 605.9 (in.36 2008>1136) | 1 | the stair needed 4 tries; heading for 257.4, -396.1, 606.4 | geometry | `game.shot(257.58, -395.05, 605.9, 206, -12, 13)` |
| in.65 261.8, -396.8, 757.0 (in.65 1268>2082) | 1 | the stair needed 4 tries; heading for 261.9, -396.8, 757.5 | geometry | `game.shot(261.82, -395.15, 756.95, 177, -12, 13)` |
| in.66 409.4, -396.7, 756.1 (in.66 2092>1282) | 1 | the stair needed 4 tries; heading for 409.1, -396.1, 756.6 | geometry | `game.shot(409.38, -395.05, 756.1, 206, -12, 13)` |
| in.67 561.0, -399.0, 751.7 (in.67 2099>1295) | 1 | the stair needed 4 tries; heading for 561.4, -399.1, 751.3 | geometry | `game.shot(561.03, -397.35, 751.73, 39, -12, 13)` |
| in.77 1156.4, -396.7, 756.6 (in.77 1358>2127) | 1 | the stair needed 3 tries; heading for 1156.3, -396.7, 757.1 | geometry | `game.shot(1156.38, -395.05, 756.65, 183, -12, 13)` |
| in.77 1157.3, -396.0, 758.6 (in.77 2127>1359) | 1 | the stair needed 4 tries; heading for 1157.3, -396.1, 759.1 | geometry | `game.shot(1157.29, -394.30, 758.59, 174, -12, 13)` |
| in.77 1154.6, -398.3, 754.7 (in.77 1361>1360) | 1 | the stair needed 3 tries; heading for 1155.0, -399.7, 754.7 | geometry | `game.shot(1154.62, -396.60, 754.67, 94, -12, 13)` |
| in.82 1310.8, -399.6, 751.3 (in.82 1370>2133) | 1 | the stair needed 3 tries; heading for 1310.9, -399.7, 751.0 | geometry | `game.shot(1310.82, -397.96, 751.29, 13, -12, 13)` |
| in.90 256.5, -396.2, 903.3 (in.90 2136>1389) | 1 | the stair needed 5 tries; heading for 256.9, -396.3, 902.9 | geometry | `game.shot(256.5, -394.50, 903.3, 40, -12, 13)` |
| in.93 412.9, -399.1, 901.0 (in.93 2140>1400) | 1 | the stair needed 3 tries; heading for 413.1, -399.1, 901.3 | geometry | `game.shot(412.95, -397.47, 901.04, 145, -12, 13)` |
| in.94 559.0, -396.7, 904.1 (in.94 1420>2143) | 1 | the stair needed 3 tries; heading for 559.1, -396.7, 903.6 | geometry | `game.shot(558.98, -395.05, 904.13, 13, -12, 13)` |
| in.113 856.4, -396.7, 906.6 (in.113 1448>2162) | 1 | the stair needed 3 tries; heading for 856.4, -396.7, 907.1 | geometry | `game.shot(856.38, -395.05, 906.65, 183, -12, 13)` |
| in.113 857.3, -396.0, 908.6 (in.113 2162>1449) | 1 | the stair needed 4 tries; heading for 857.4, -396.1, 909.1 | geometry | `game.shot(857.29, -394.30, 908.59, 174, -12, 13)` |
| in.113 854.6, -398.3, 904.7 (in.113 1452>1451) | 1 | the stair needed 3 tries; heading for 855.0, -399.7, 904.7 | geometry | `game.shot(854.62, -396.60, 904.67, 94, -12, 13)` |
| in.115 1009.2, -396.4, 907.7 (in.115 2173>1469) | 1 | the stair needed 5 tries; heading for 1008.6, -396.1, 907.6 | geometry | `game.shot(1009.16, -394.72, 907.72, 280, -12, 13)` |
| in.115 1007.0, -396.6, 906.1 (in.115 1469>2173) | 1 | the stair needed 2 tries; heading for 1007.4, -396.6, 905.9 | geometry | `game.shot(1006.95, -394.95, 906.12, 64, -12, 13)` |
| outdoors 109.3, 0.8, 95.9 (path hamlet up 18) | 1 | needed 5 tries; heading for 110.0, 0.9, 96.0 | geometry | `game.shot(109.33, 2.49, 95.9, 98, -12, 13)` |
| outdoors 106.9, 1.4, 92.7 (path hamlet back 4) | 1 | needed 3 tries; heading for 106.7, 0.4, 92.0 | geometry | `game.shot(106.86, 3.05, 92.66, 344, -12, 13)` |
| outdoors 103.8, -0.4, 88.5 (path hamlet back 5) | 1 | needed 3 tries; heading for 103.3, -0.5, 88.0 | geometry | `game.shot(103.81, 1.25, 88.5, 316, -12, 13)` |

## Prompts offered through a wall (14)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors -7.9, -1.7, 85.6 (street 357>358) | 1 | "Enter Fisher’s Hut" (door.fisher.in) is offered through a solid box 1.5 x 0.3 m, 6.0 high, 2.3 m away | player | `game.shot(-7.9, -0.04, 85.57, 37, -12, 13)` |
| inn 254.5, -399.7, 4.2 (inn 1664>1672) | 1 | "Sit down" (seat.inn.table8bench1) is offered through a solid box 1.6 x 0.3 m, 1.8 high, 1.8 m away | player | `game.shot(254.49, -398.00, 4.2, 2, -12, 13)` |
| farm 408.5, -399.7, 147.7 (farm 1768>1777) | 1 | "Leave to Brackenfell" (door.farm.out) is offered through a solid box 0.4 x 1.3 m, 2.9 high, 2.6 m away | player | `game.shot(408.5, -398.00, 147.7, 62, -12, 13)` |
| farm 408.9, -399.7, 154.9 (farm 1769>1781) | 1 | "Search the crates" (cont.farm.wicker_basket_02d87) is offered through a solid box 1.6 x 0.3 m, 1.8 high, 1.9 m away | player | `game.shot(408.87, -398.00, 154.92, 51, -12, 13)` |
| farm 408.9, -399.7, 154.9 (farm 1769>1781) | 1 | "Search the crates" (cont.farm.wicker_basket_02d86) is offered through a solid box 1.6 x 0.3 m, 1.8 high, 1.9 m away | player | `game.shot(408.94, -398.00, 154.92, 50, -12, 13)` |
| in.15 558.6, -399.7, 452.1 (in.15 1944>1040) | 1 | "Look along the shelf" (cont.in.15.shelf) is offered through a solid box 1.8 x 0.3 m, 2.4 high, 1.9 m away | player | `game.shot(558.58, -398.00, 452.06, 211, -12, 13)` |
| in.20 710.4, -399.7, 452.7 (in.20 1956>1056) | 1 | "Look along the shelf" (cont.in.20.shelf) is offered through a solid box 1.8 x 0.3 m, 2.4 high, 1.9 m away | player | `game.shot(710.38, -398.00, 452.66, 211, -12, 13)` |
| in.33 1159.7, -399.7, 459.0 (in.33 1988>1983) | 1 | "Open the chest" (cont.in.33.strongbox14) is offered through a solid box 0.4 x 6.4 m, 3.0 high, 1.8 m away | player | `game.shot(1159.67, -398.00, 459, 243, -12, 13)` |
| in.33 1158.3, -399.7, 451.4 (in.33 1979>1111) | 1 | "Talk to Nell" (Talk to Nell Merchant) is offered through a solid box 1.2 x 0.8 m, 1.7 high, 2.7 m away | player | `game.shot(1158.28, -398.00, 451.38, 334, -12, 13)` |
| in.36 259.0, -399.7, 606.6 (in.36 2012>2006) | 1 | "Talk to Maud" (Talk to Maud Mason) is offered through a solid box 0.4 x 3.4 m, 2.8 high, 2.5 m away | player | `game.shot(258.97, -398.00, 606.63, 260, -12, 13)` |
| in.66 410.8, -399.7, 756.8 (in.66 2096>2090) | 1 | "Talk to Maud" (Talk to Maud Saddler) is offered through a solid box 0.4 x 3.4 m, 2.8 high, 2.5 m away | player | `game.shot(410.77, -398.00, 756.83, 260, -12, 13)` |
| in.67 557.1, -399.7, 748.8 (in.67 2099>2100) | 1 | "Leave to Brackenfell" (door.in.67.out) is offered through a solid box 1.2 x 0.3 m, 1.8 high, 2.3 m away | player | `game.shot(557.1, -398.00, 748.78, 25, -12, 13)` |
| in.70 710.0, -396.7, 752.8 (in.70 2108>2104) | 1 | "Look in the cupboard" (cont.in.70.wardrobe) is offered through a solid box 1.1 x 0.6 m, 1.8 high, 1.8 m away | player | `game.shot(710.02, -395.05, 752.8, 193, -12, 13)` |
| in.115 1008.4, -399.7, 898.2 (in.115 2171>2180) | 1 | "Leave to Brackenfell" (door.in.115.out) is offered through a solid box 0.4 x 1.3 m, 2.9 high, 2.6 m away | player | `game.shot(1008.39, -398.00, 898.2, 62, -12, 13)` |

## The eye within 10 cm of the underside of a floor or stair (2)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors 8.7, -0.2, 18.2 (street 383>98) | 1 | the eye is 10 cm from the underside of a floor or stair | player | `game.shot(8.68, 1.45, 18.22, 283, -12, 13)` |
| outdoors 12.5, -2.0, 83.7 (street 111>1540) | 1 | the eye is -45 cm from the underside of a floor or stair | player | `game.shot(12.51, -0.36, 83.74, 86, -12, 13)` |

## Sliding: moving more than 35 degrees off the way the player faces (69)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| in.23 1010.6, -399.7, 453.4 (in.23 1091>1977) | 9 | moving 52 degrees off the way it faces | player | `game.shot(1010.63, -398.00, 453.37, 10, -12, 13)` |
| in.67 557.6, -399.7, 752.8 (in.67 1300>2099) | 9 | moving 40 degrees off the way it faces | player | `game.shot(557.6, -398.00, 752.8, 341, -12, 13)` |
| guardhouse 1014.2, -399.7, -1.4 (guardhouse 1727>704) | 7 | moving 57 degrees off the way it faces | player | `game.shot(1014.2, -398.00, -1.44, 147, -12, 13)` |
| outdoors -7.7, 5.5, -59.0 (street 80>79) | 2 | moving 65 degrees off the way it faces | player | `game.shot(-7.68, 7.21, -59.02, 205, -12, 13)` |
| outdoors 106.6, 0.5, 92.8 (street 172>171) | 2 | moving 66 degrees off the way it faces | player | `game.shot(106.6, 2.19, 92.79, 327, -12, 13)` |
| shop.n4 1309.2, -399.7, 152.4 (shop.n4 1826>864) | 2 | moving 70 degrees off the way it faces | player | `game.shot(1309.18, -398.00, 152.42, 110, -12, 13)` |
| in.02 712.9, -399.7, 299.7 (in.02 1874>1880) | 2 | moving 46 degrees off the way it faces | player | `game.shot(712.91, -398.00, 299.73, 148, -12, 13)` |
| in.93 412.4, -399.7, 900.2 (in.93 2140>1400) | 2 | moving 56 degrees off the way it faces | player | `game.shot(412.43, -398.00, 900.16, 146, -12, 13)` |
| outdoors -137.2, -0.5, -56.5 (path burnt up 1) | 2 | moving 64 degrees off the way it faces | player | `game.shot(-137.18, 1.18, -56.46, 354, -12, 13)` |
| outdoors -10.1, -1.7, 84.7 (path lakeside up 25) | 2 | moving 60 degrees off the way it faces | player | `game.shot(-10.07, -0.04, 84.72, 51, -12, 13)` |
| outdoors -2.6, 0.0, -5.9 (street 360>362) | 1 | moving 59 degrees off the way it faces | player | `game.shot(-2.63, 1.66, -5.88, 33, -12, 13)` |
| outdoors 1.9, 0.0, -6.4 (street 362>359) | 1 | moving 50 degrees off the way it faces | player | `game.shot(1.92, 1.66, -6.42, 140, -12, 13)` |
| outdoors -1.9, 0.0, -6.0 (street 359>362) | 1 | moving 39 degrees off the way it faces | player | `game.shot(-1.95, 1.66, -6.03, 27, -12, 13)` |
| outdoors -137.4, -0.5, -56.6 (street 178>179) | 1 | moving 62 degrees off the way it faces | player | `game.shot(-137.45, 1.18, -56.56, 353, -12, 13)` |
| outdoors -11.7, 0.0, -7.5 (street 69>1533) | 1 | moving 36 degrees off the way it faces | player | `game.shot(-11.71, 1.66, -7.46, 216, -12, 13)` |
| outdoors -24.4, 2.0, -44.7 (street 517>541) | 1 | moving 57 degrees off the way it faces | player | `game.shot(-24.38, 3.71, -44.67, 314, -12, 13)` |
| outdoors -26.0, 2.1, -46.7 (street 541>517) | 1 | moving 50 degrees off the way it faces | player | `game.shot(-26.02, 3.74, -46.71, 151, -12, 13)` |
| outdoors -5.6, 8.8, -56.4 (street 1565>80) | 1 | moving 69 degrees off the way it faces | player | `game.shot(-5.64, 10.43, -56.43, 339, -12, 13)` |
| outdoors -8.1, 8.8, -58.0 (street 1565>80) | 1 | moving 69 degrees off the way it faces | player | `game.shot(-8.12, 10.43, -58.02, 339, -12, 13)` |
| outdoors -0.1, 5.2, -59.0 (street 83>1564) | 1 | moving 71 degrees off the way it faces | player | `game.shot(-0.05, 6.88, -59.02, 161, -12, 13)` |
| outdoors 0.1, 4.8, -56.4 (street 1564>83) | 1 | moving 72 degrees off the way it faces | player | `game.shot(0.1, 6.49, -56.38, 342, -12, 13)` |
| outdoors 10.2, 3.8, -59.3 (street 553>557) | 1 | moving 39 degrees off the way it faces | player | `game.shot(10.21, 5.46, -59.32, 129, -12, 13)` |
| outdoors 8.1, 1.6, -39.0 (street 557>561) | 1 | moving 40 degrees off the way it faces | player | `game.shot(8.11, 3.30, -39.04, 141, -12, 13)` |
| outdoors 12.3, 3.7, -21.4 (street 1561>561) | 1 | moving 72 degrees off the way it faces | player | `game.shot(12.26, 5.36, -21.42, 18, -12, 13)` |
| outdoors 13.6, 0.8, -31.5 (street 561>557) | 1 | moving 64 degrees off the way it faces | player | `game.shot(13.61, 2.51, -31.48, 334, -12, 13)` |
| outdoors 5.8, 3.8, -58.0 (street 557>553) | 1 | moving 44 degrees off the way it faces | player | `game.shot(5.81, 5.46, -58.02, 44, -12, 13)` |
| outdoors 25.8, -0.6, 18.1 (street 585>1545) | 1 | moving 60 degrees off the way it faces | player | `game.shot(25.78, 1.09, 18.05, 195, -12, 13)` |
| outdoors 24.7, -0.6, 18.1 (street 1545>585) | 1 | moving 72 degrees off the way it faces | player | `game.shot(24.7, 1.05, 18.08, 63, -12, 13)` |
| outdoors 27.3, -0.6, 18.0 (street 1545>585) | 1 | moving 43 degrees off the way it faces | player | `game.shot(27.28, 1.11, 17.99, 43, -12, 13)` |
| outdoors -3.9, 0.8, 20.9 (street 99>379) | 1 | moving 45 degrees off the way it faces | player | `game.shot(-3.88, 2.41, 20.93, 225, -12, 13)` |
| outdoors -5.3, 2.5, 19.2 (street 379>99) | 1 | moving 52 degrees off the way it faces | player | `game.shot(-5.32, 4.15, 19.21, 52, -12, 13)` |
| outdoors 80.8, -0.5, 13.3 (street 154>1541) | 1 | moving 39 degrees off the way it faces | player | `game.shot(80.81, 1.17, 13.25, 39, -12, 13)` |
| outdoors 81.6, -0.5, 16.5 (street 1541>154) | 1 | moving 44 degrees off the way it faces | player | `game.shot(81.59, 1.16, 16.51, 224, -12, 13)` |
| outdoors -136.7, -0.5, -57.8 (street 179>178) | 1 | moving 59 degrees off the way it faces | player | `game.shot(-136.71, 1.18, -57.82, 169, -12, 13)` |
| outdoors 7.9, 0.0, -6.4 (street 361>1556) | 1 | moving 56 degrees off the way it faces | player | `game.shot(7.9, 1.66, -6.43, 46, -12, 13)` |
| outdoors 9.7, 0.0, -6.5 (street 1556>361) | 1 | moving 55 degrees off the way it faces | player | `game.shot(9.65, 1.66, -6.52, 226, -12, 13)` |
| outdoors -1.1, 0.0, -7.5 (street 362>360) | 1 | moving 58 degrees off the way it faces | player | `game.shot(-1.08, 1.66, -7.46, 234, -12, 13)` |
| inn 260.8, -399.7, 1.1 (inn 1673>1663) | 1 | moving 64 degrees off the way it faces | player | `game.shot(260.83, -398.00, 1.12, 334, -12, 13)` |
| smithy 409.0, -399.7, 6.0 (smithy 1687>1683) | 1 | moving 64 degrees off the way it faces | player | `game.shot(408.98, -398.00, 5.95, 116, -12, 13)` |
| elder 708.1, -399.5, 4.6 (elder 1705>1715) | 1 | moving 41 degrees off the way it faces | player | `game.shot(708.13, -397.80, 4.63, 204, -12, 13)` |
| elder 709.0, -399.7, 6.9 (elder 1715>1705) | 1 | moving 68 degrees off the way it faces | player | `game.shot(708.95, -398.00, 6.87, 22, -12, 13)` |
| guardhouse 1015.4, -396.2, 3.6 (guardhouse 1730>709) | 1 | moving 66 degrees off the way it faces | player | `game.shot(1015.36, -394.55, 3.56, 156, -12, 13)` |
| guardhouse 1013.1, -396.2, -1.2 (guardhouse 1730>711) | 1 | moving 70 degrees off the way it faces | player | `game.shot(1013.11, -394.55, -1.16, 70, -12, 13)` |
| guardhouse 1008.6, -396.2, -1.2 (guardhouse 1730>712) | 1 | moving 72 degrees off the way it faces | player | `game.shot(1008.65, -394.55, -1.18, 288, -12, 13)` |
| chapel 1307.7, -399.7, -1.0 (chapel 1751>1745) | 1 | moving 52 degrees off the way it faces | player | `game.shot(1307.73, -398.00, -1.03, 128, -12, 13)` |
| chapel 1307.7, -399.7, 1.1 (chapel 1752>1745) | 1 | moving 52 degrees off the way it faces | player | `game.shot(1307.73, -398.00, 1.05, 52, -12, 13)` |
| fisher 709.5, -399.7, 153.5 (fisher 1785>801) | 1 | moving 61 degrees off the way it faces | player | `game.shot(709.49, -398.00, 153.47, 109, -12, 13)` |
| shop.s1 410.4, -399.7, 301.0 (shop.s1 1850>898) | 1 | moving 38 degrees off the way it faces | player | `game.shot(410.42, -398.00, 300.96, 87, -12, 13)` |
| in.02 714.8, -398.4, 306.6 (in.02 931>1878) | 1 | moving 66 degrees off the way it faces | player | `game.shot(714.79, -396.79, 306.59, 246, -12, 13)` |
| in.20 708.4, -399.7, 450.9 (in.20 1956>1060) | 1 | moving 61 degrees off the way it faces | player | `game.shot(708.42, -398.00, 450.93, 209, -12, 13)` |
| in.23 1012.9, -399.7, 450.9 (in.23 1977>1086) | 1 | moving 68 degrees off the way it faces | player | `game.shot(1012.89, -398.00, 450.86, 158, -12, 13)` |
| in.33 1160.3, -399.7, 458.5 (in.33 1988>1983) | 1 | moving 44 degrees off the way it faces | player | `game.shot(1160.33, -398.00, 458.48, 232, -12, 13)` |
| in.33 1158.2, -396.5, 454.6 (in.33 1106>1983) | 1 | moving 63 degrees off the way it faces | player | `game.shot(1158.16, -394.85, 454.61, 153, -12, 13)` |
| in.74 861.4, -396.6, 756.0 (in.74 1333>2116) | 1 | moving 67 degrees off the way it faces | player | `game.shot(861.35, -394.95, 755.95, 252, -12, 13)` |
| in.82 1313.3, -399.7, 750.2 (in.82 2133>1370) | 1 | moving 64 degrees off the way it faces | player | `game.shot(1313.32, -398.00, 750.16, 154, -12, 13)` |
| in.93 411.2, -399.7, 900.2 (in.93 1400>2140) | 1 | moving 58 degrees off the way it faces | player | `game.shot(411.18, -398.00, 900.18, 196, -12, 13)` |
| in.94 560.1, -396.7, 901.6 (in.94 2143>1419) | 1 | moving 40 degrees off the way it faces | player | `game.shot(560.14, -395.05, 901.64, 83, -12, 13)` |
| in.115 1008.9, -399.7, 902.9 (in.115 1470>1471) | 1 | moving 60 degrees off the way it faces | player | `game.shot(1008.89, -398.00, 902.88, 150, -12, 13)` |
| in.115 1008.1, -396.6, 908.4 (in.115 1469>2173) | 1 | moving 74 degrees off the way it faces | player | `game.shot(1008.11, -394.95, 908.4, 344, -12, 13)` |
| outdoors 107.1, 0.4, 91.6 (path hamlet up 18) | 1 | moving 66 degrees off the way it faces | player | `game.shot(107.08, 2.02, 91.6, 146, -12, 13)` |

(9 more in shots/walk/walk.json)

## Snags: under half walking speed (313)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 258.9, -399.7, 1.2 (inn 1663>1672) | 15 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(258.88, -398.00, 1.2, 227, -12, 13)` |
| smithy 413.2, -399.7, 3.2 (smithy 1686>1681) | 11 | speed 1.4 of 2.9 m/s with W held | player | `game.shot(413.18, -398.00, 3.22, 313, -12, 13)` |
| chapel 1311.9, -399.7, 0.0 (chapel 1745>736) | 11 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1311.86, -398.00, 0.02, 88, -12, 13)` |
| in.82 1310.7, -399.7, 752.3 (in.82 1370>2133) | 10 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1310.71, -398.00, 752.34, 8, -12, 13)` |
| in.93 411.5, -399.7, 901.0 (in.93 2140>1405) | 10 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(411.53, -398.00, 901.04, 163, -12, 13)` |
| fisher 709.5, -399.7, 152.2 (fisher 801>1785) | 9 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(709.48, -398.00, 152.22, 72, -12, 13)` |
| in.23 1010.7, -399.7, 453.4 (in.23 1091>1977) | 9 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1010.66, -398.00, 453.37, 8, -12, 13)` |
| in.23 1009.0, -399.7, 453.4 (in.23 1091>1977) | 9 | speed 0.9 of 2.9 m/s with W held | player | `game.shot(1009.03, -398.00, 453.42, 343, -12, 13)` |
| in.67 559.1, -399.7, 750.3 (in.67 1295>2099) | 9 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(559.1, -398.00, 750.33, 180, -12, 13)` |
| in.67 559.1, -399.7, 752.9 (in.67 1300>2099) | 9 | speed 0.1 of 2.9 m/s with W held | player | `game.shot(559.14, -398.00, 752.87, 359, -12, 13)` |
| in.93 412.8, -399.7, 903.2 (in.93 2140>1405) | 9 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(412.79, -398.00, 903.17, 263, -12, 13)` |
| guardhouse 1014.7, -399.7, 0.3 (guardhouse 704>1727) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1014.72, -398.00, 0.29, 269, -12, 13)` |
| fisher 710.6, -399.7, 151.8 (fisher 1785>805) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(710.64, -398.00, 151.83, 154, -12, 13)` |
| in.04 858.9, -399.7, 300.5 (in.04 1885>947) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(858.87, -398.00, 300.49, 270, -12, 13)` |
| in.04 856.7, -399.7, 301.1 (in.04 1885>947) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(856.67, -398.00, 301.09, 3, -12, 13)` |
| in.08 1160.9, -399.7, 300.1 (in.08 1903>978) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1160.91, -398.00, 300.14, 86, -12, 13)` |
| in.12 260.9, -399.7, 450.8 (in.12 1924>1012) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(260.92, -398.00, 450.77, 103, -12, 13)` |
| in.23 1010.9, -399.7, 451.9 (in.23 1977>1092) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1010.87, -398.00, 451.91, 209, -12, 13)` |
| in.34 1308.5, -399.7, 450.3 (in.34 1995>1122) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1308.52, -398.00, 450.27, 242, -12, 13)` |
| in.40 708.5, -399.7, 601.5 (in.40 2036>1187) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(708.48, -398.00, 601.55, 306, -12, 13)` |
| in.74 856.7, -399.7, 750.8 (in.74 2113>1330) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(856.68, -398.00, 750.75, 306, -12, 13)` |
| in.94 559.8, -399.7, 904.4 (in.94 2142>1418) | 8 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(559.81, -398.00, 904.42, 124, -12, 13)` |
| guardhouse 1011.2, -399.7, 0.6 (guardhouse 1727>704) | 7 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1011.23, -398.00, 0.61, 86, -12, 13)` |
| in.38 560.9, -399.7, 600.8 (in.38 2027>1176) | 7 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(560.93, -398.00, 600.84, 77, -12, 13)` |
| high.c 261.6, -399.7, 1050.8 (high.c 2200>1520) | 7 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(261.55, -398.00, 1050.78, 50, -12, 13)` |
| outdoors -137.9, -0.5, -56.8 (street 178>179) | 2 | speed 0.8 of 2.9 m/s with W held | player | `game.shot(-137.95, 1.18, -56.75, 6, -12, 13)` |
| outdoors -8.0, 5.5, -59.0 (street 80>79) | 2 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(-7.95, 7.21, -59.02, 201, -12, 13)` |
| outdoors -24.2, 2.0, -45.8 (street 517>541) | 2 | speed 1.2 of 2.9 m/s with W held | player | `game.shot(-24.16, 3.71, -45.82, 305, -12, 13)` |
| outdoors -6.7, 5.3, -58.0 (street 79>80) | 2 | speed 0.1 of 2.9 m/s with W held | player | `game.shot(-6.73, 6.94, -58.02, 358, -12, 13)` |
| outdoors 5.8, 3.8, -59.0 (street 553>557) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(5.81, 5.47, -59.02, 175, -12, 13)` |
| outdoors 57.9, -2.1, 2.2 (street 46>45) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(57.93, -0.40, 2.18, 271, -12, 13)` |
| outdoors 11.6, -0.1, 5.7 (street 365>445) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(11.64, 1.56, 5.68, 159, -12, 13)` |
| outdoors 25.0, -0.6, 17.3 (street 585>1545) | 2 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(24.97, 1.08, 17.25, 238, -12, 13)` |
| outdoors 107.3, 0.4, 91.5 (street 171>172) | 2 | speed 0.3 of 2.9 m/s with W held | player | `game.shot(107.33, 2.04, 91.55, 175, -12, 13)` |
| outdoors 4.1, -0.0, 10.0 (street 97>1531) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(4.1, 1.64, 10.01, 99, -12, 13)` |
| outdoors 106.5, 0.5, 92.8 (street 172>171) | 2 | speed 1.1 of 2.9 m/s with W held | player | `game.shot(106.49, 2.19, 92.81, 328, -12, 13)` |
| outdoors 80.8, -0.5, 15.2 (street 154>1541) | 2 | speed 0.2 of 2.9 m/s with W held | player | `game.shot(80.81, 1.15, 15.16, 94, -12, 13)` |
| outdoors -135.9, -0.5, -57.5 (street 179>178) | 2 | speed 1.0 of 2.9 m/s with W held | player | `game.shot(-135.95, 1.18, -57.55, 180, -12, 13)` |
| smithy 409.0, -399.7, 6.0 (smithy 1687>1683) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(408.98, -398.00, 6, 113, -12, 13)` |
| mill 266.0, -396.7, 147.4 (mill 1759>751) | 2 | speed 0.6 of 2.9 m/s with W held | player | `game.shot(266.02, -395.05, 147.42, 260, -12, 13)` |
| farm 407.5, -399.7, 152.4 (farm 773>774) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(407.47, -398.00, 152.38, 194, -12, 13)` |
| shop.s1 410.6, -402.5, 307.4 (shop.s1 1854>1860) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(410.6, -400.85, 307.44, 0, -12, 13)` |
| shop.s2 560.6, -402.5, 307.4 (shop.s2 1866>1872) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(560.6, -400.85, 307.44, 1, -12, 13)` |
| in.02 713.6, -396.7, 307.1 (in.02 1878>930) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(713.62, -395.05, 307.05, 308, -12, 13)` |
| in.36 256.5, -396.7, 605.9 (in.36 1136>2008) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(256.52, -395.05, 605.9, 188, -12, 13)` |
| in.36 257.8, -396.7, 605.9 (in.36 1136>2008) | 2 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(257.83, -395.05, 605.9, 166, -12, 13)` |
| in.66 408.3, -396.7, 756.1 (in.66 1282>2092) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(408.32, -395.05, 756.1, 188, -12, 13)` |
| in.66 409.6, -396.7, 756.1 (in.66 1282>2092) | 2 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(409.63, -395.05, 756.1, 166, -12, 13)` |
| in.93 413.0, -399.7, 900.2 (in.93 2140>1400) | 2 | speed 0.6 of 2.9 m/s with W held | player | `game.shot(413.04, -398.00, 900.16, 174, -12, 13)` |
| in.94 559.4, -396.7, 903.6 (in.94 2143>1419) | 2 | speed 0.1 of 2.9 m/s with W held | player | `game.shot(559.38, -395.05, 903.61, 89, -12, 13)` |
| in.115 1007.4, -399.7, 902.9 (in.115 1470>1471) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(1007.37, -398.00, 902.88, 194, -12, 13)` |
| outdoors 46.0, 4.1, -150.0 (path bridge up 4) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(46, 5.80, -150, 90, -12, 13)` |
| outdoors -11.0, -1.7, 84.4 (path lakeside up 25) | 2 | speed 1.0 of 2.9 m/s with W held | player | `game.shot(-10.98, -0.04, 84.36, 2, -12, 13)` |
| mine 438.7, -399.7, 1098.7 (mine 9) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(438.67, -398.02, 1098.67, 333, -12, 13)` |
| mine 407.9, -399.7, 1085.3 (mine 11) | 2 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(407.93, -398.02, 1085.33, 180, -12, 13)` |
| outdoors -3.5, 0.0, -6.2 (street 360>362) | 1 | speed 0.2 of 2.9 m/s with W held | player | `game.shot(-3.55, 1.66, -6.21, 43, -12, 13)` |
| outdoors 0.0, 0.0, -6.4 (street 362>359) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(0.02, 1.66, -6.42, 180, -12, 13)` |
| outdoors -0.0, 0.0, -2.8 (street 359>362) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(-0.03, 1.66, -2.78, 0, -12, 13)` |
| outdoors -38.3, 0.2, -28.6 (street 513>529) | 1 | speed 0.5 of 2.9 m/s with W held | player | `game.shot(-38.34, 1.84, -28.6, 279, -12, 13)` |
| outdoors -41.8, 0.2, -29.2 (street 529>513) | 1 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(-41.84, 1.89, -29.17, 95, -12, 13)` |

(253 more in shots/walk/walk.json)

## Stretches that needed more than one try (56)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| in.23 1009.2, -399.7, 454.1 (in.23 1977>1091) | 9 | the way needed 3 tries; heading for 1009.7, -399.7, 454.1 | geometry | `game.shot(1009.16, -398.00, 454.07, 88, -12, 13)` |
| in.23 1011.1, -399.7, 451.2 (in.23 1091>1977) | 9 | the way needed 3 tries; heading for 1010.9, -399.7, 451.6 | geometry | `game.shot(1011.14, -398.00, 451.17, 207, -12, 13)` |
| in.93 411.0, -399.3, 900.8 (in.93 1405>2140) | 9 | the way needed 3 tries; heading for 410.9, -399.7, 901.4 | geometry | `game.shot(411, -397.64, 900.83, 191, -12, 13)` |
| guardhouse 1011.0, -399.7, 0.8 (guardhouse 704>1727) | 8 | the way needed 2 tries; heading for 1010.9, -399.7, 0.3 | geometry | `game.shot(1010.98, -398.00, 0.81, 350, -12, 13)` |
| in.40 711.4, -398.9, 600.7 (in.40 1187>2036) | 8 | the way needed 4 tries; heading for 710.9, -399.7, 601.0 | geometry | `game.shot(711.39, -397.25, 600.74, 247, -12, 13)` |
| guardhouse 1015.1, -399.7, -0.1 (guardhouse 1727>704) | 7 | the way needed 2 tries; heading for 1015.3, -399.7, 0.3 | geometry | `game.shot(1015.09, -398.00, -0.1, 155, -12, 13)` |
| shop.n3 1162.1, -402.3, 154.7 (shop.n3 854>1824) | 3 | the way needed 3 tries; heading for 1161.6, -402.5, 154.7 | geometry | `game.shot(1162.11, -400.62, 154.67, 267, -12, 13)` |
| outdoors 12.3, -0.2, 8.1 (street 365>445) | 2 | the way needed 4 tries; heading for 12.3, -0.2, 7.5 | geometry | `game.shot(12.35, 1.49, 8.05, 358, -12, 13)` |
| outdoors -135.5, -0.5, -54.0 (street 179>178) | 2 | the way needed 2 tries; heading for -136.0, -0.5, -54.0 | geometry | `game.shot(-135.54, 1.18, -53.99, 271, -12, 13)` |
| shop.n2 1012.1, -402.3, 156.7 (shop.n2 837>1812) | 2 | the way needed 3 tries; heading for 1011.6, -402.5, 156.7 | geometry | `game.shot(1012.11, -400.62, 156.67, 267, -12, 13)` |
| shop.n4 1311.1, -402.3, 154.7 (shop.n4 870>1836) | 2 | the way needed 3 tries; heading for 1310.6, -402.5, 154.7 | geometry | `game.shot(1311.11, -400.62, 154.67, 267, -12, 13)` |
| shop.s1 411.1, -402.3, 306.7 (shop.s1 904>1860) | 2 | the way needed 3 tries; heading for 410.6, -402.5, 306.7 | geometry | `game.shot(411.11, -400.62, 306.67, 267, -12, 13)` |
| shop.s2 561.1, -402.3, 306.7 (shop.s2 919>1872) | 2 | the way needed 3 tries; heading for 560.6, -402.5, 306.7 | geometry | `game.shot(561.11, -400.62, 306.67, 267, -12, 13)` |
| outdoors -0.3, 0.0, -2.3 (street 362>359) | 1 | the way needed 3 tries; heading for 0.0, 0.0, -2.0 | geometry | `game.shot(-0.33, 1.66, -2.32, 134, -12, 13)` |
| outdoors -0.2, 0.0, -9.5 (street 359>362) | 1 | the way needed 2 tries; heading for 0.0, 0.0, -10.0 | geometry | `game.shot(-0.19, 1.66, -9.5, 21, -12, 13)` |
| outdoors 22.3, -0.8, 18.4 (street 585>1545) | 1 | the way needed 5 tries; heading for 22.7, -0.8, 18.7 | geometry | `game.shot(22.25, 0.86, 18.42, 118, -12, 13)` |
| outdoors 29.3, -0.5, 15.7 (street 1545>585) | 1 | the way needed 3 tries; heading for 29.8, -0.5, 15.4 | geometry | `game.shot(29.34, 1.12, 15.65, 61, -12, 13)` |
| outdoors 5.6, -0.1, 10.6 (street 97>1531) | 1 | the way needed 3 tries; heading for 6.1, -0.1, 10.3 | geometry | `game.shot(5.64, 1.59, 10.61, 58, -12, 13)` |
| inn 259.5, -399.7, -0.9 (inn 1672>1663) | 1 | the way needed 2 tries; heading for 260.0, -399.7, -0.7 | geometry | `game.shot(259.51, -398.00, -0.9, 117, -12, 13)` |
| smithy 410.8, -399.7, 1.0 (smithy 1686>1681) | 1 | the way needed 2 tries; heading for 410.5, -399.7, 0.7 | geometry | `game.shot(410.82, -398.00, 1.01, 318, -12, 13)` |
| smithy 411.0, -399.7, 6.5 (smithy 1687>1683) | 1 | the way needed 2 tries; heading for 410.5, -399.7, 6.7 | geometry | `game.shot(410.98, -398.00, 6.5, 253, -12, 13)` |
| smithy 408.8, -399.7, 5.0 (smithy 1683>1687) | 1 | the way needed 3 tries; heading for 408.5, -399.7, 4.7 | geometry | `game.shot(408.78, -398.00, 5.03, 324, -12, 13)` |
| store 558.5, -399.7, 0.1 (store 1698>1690) | 1 | the way needed 5 tries; heading for 558.1, -399.7, 0.3 | geometry | `game.shot(558.55, -398.00, 0.11, 242, -12, 13)` |
| elder 710.7, -399.7, 2.3 (elder 1715>1705) | 1 | the way needed 2 tries; heading for 710.9, -399.7, 1.9 | geometry | `game.shot(710.68, -398.00, 2.27, 28, -12, 13)` |
| mill 260.1, -399.7, 149.8 (mill 1762>1756) | 1 | the way needed 2 tries; heading for 259.7, -399.7, 149.4 | geometry | `game.shot(260.11, -398.00, 149.75, 310, -12, 13)` |
| farm 414.7, -399.7, 150.0 (farm 1775>1765) | 1 | the way needed 2 tries; heading for 414.5, -399.7, 150.4 | geometry | `game.shot(414.68, -398.00, 149.97, 203, -12, 13)` |
| farm 407.1, -399.7, 149.2 (farm 1777>1768) | 1 | the way needed 3 tries; heading for 407.5, -399.7, 148.9 | geometry | `game.shot(407.1, -398.00, 149.24, 50, -12, 13)` |
| farm 409.6, -399.7, 149.2 (farm 1768>1777) | 1 | the way needed 3 tries; heading for 410.0, -399.7, 148.8 | geometry | `game.shot(409.59, -398.00, 149.16, 53, -12, 13)` |
| draper 859.6, -396.7, 156.0 (draper 1797>1793) | 1 | the way needed 3 tries; heading for 860.0, -396.7, 156.3 | geometry | `game.shot(859.6, -395.05, 156.03, 129, -12, 13)` |
| shop.n2 1012.0, -402.1, 157.0 (shop.n2 1806>1812) | 1 | the way needed 3 tries; heading for 1011.6, -402.5, 156.7 | geometry | `game.shot(1012.02, -400.46, 157.03, 308, -12, 13)` |
| shop.n4 1311.7, -399.7, 150.9 (shop.n4 1826>865) | 1 | the way needed 2 tries; heading for 1311.5, -399.7, 151.3 | geometry | `game.shot(1311.7, -398.00, 150.89, 206, -12, 13)` |
| shop.n4 1308.7, -399.7, 150.8 (shop.n4 865>1826) | 1 | the way needed 3 tries; heading for 1309.0, -399.7, 151.2 | geometry | `game.shot(1308.66, -398.00, 150.79, 137, -12, 13)` |
| shop.s0 263.1, -402.3, 304.7 (shop.s0 887>1848) | 1 | the way needed 3 tries; heading for 262.6, -402.5, 304.7 | geometry | `game.shot(263.11, -400.62, 304.67, 267, -12, 13)` |
| shop.s0 263.7, -402.0, 304.7 (shop.s0 1848>887) | 1 | the way needed 4 tries; heading for 264.1, -402.5, 304.7 | geometry | `game.shot(263.67, -400.34, 304.67, 95, -12, 13)` |
| shop.s1 411.0, -402.1, 307.0 (shop.s1 1854>1860) | 1 | the way needed 3 tries; heading for 410.6, -402.5, 306.7 | geometry | `game.shot(411.02, -400.46, 307.03, 308, -12, 13)` |
| shop.s2 561.0, -402.1, 307.0 (shop.s2 1866>1872) | 1 | the way needed 3 tries; heading for 560.6, -402.5, 306.7 | geometry | `game.shot(561.02, -400.46, 307.03, 308, -12, 13)` |
| in.04 861.7, -399.7, 307.1 (in.04 1890>1886) | 1 | the way needed 2 tries; heading for 861.4, -399.7, 306.8 | geometry | `game.shot(861.73, -398.00, 307.14, 316, -12, 13)` |
| in.04 861.0, -399.7, 304.2 (in.04 1886>1890) | 1 | the way needed 2 tries; heading for 861.4, -399.7, 303.8 | geometry | `game.shot(861.03, -398.00, 304.18, 37, -12, 13)` |
| in.15 558.7, -396.7, 456.0 (in.15 1951>1947) | 1 | the way needed 3 tries; heading for 559.1, -396.7, 456.4 | geometry | `game.shot(558.7, -395.05, 456.03, 129, -12, 13)` |
| in.20 710.5, -396.7, 456.6 (in.20 1963>1959) | 1 | the way needed 3 tries; heading for 710.9, -396.7, 456.9 | geometry | `game.shot(710.51, -395.05, 456.64, 128, -12, 13)` |
| in.34 1312.9, -399.7, 456.5 (in.34 2000>1996) | 1 | the way needed 2 tries; heading for 1313.2, -399.7, 456.1 | geometry | `game.shot(1312.87, -398.00, 456.52, 31, -12, 13)` |
| in.34 1312.9, -399.7, 453.4 (in.34 1996>2000) | 1 | the way needed 2 tries; heading for 1313.2, -399.7, 453.1 | geometry | `game.shot(1312.88, -398.00, 453.42, 36, -12, 13)` |
| in.40 708.4, -399.7, 607.4 (in.40 2041>2037) | 1 | the way needed 2 tries; heading for 708.6, -399.7, 607.0 | geometry | `game.shot(708.38, -398.00, 607.41, 30, -12, 13)` |
| in.40 708.4, -399.7, 604.3 (in.40 2037>2041) | 1 | the way needed 2 tries; heading for 708.6, -399.7, 604.0 | geometry | `game.shot(708.38, -398.00, 604.32, 36, -12, 13)` |
| in.40 709.0, -399.7, 601.6 (in.40 2036>1191) | 1 | the way needed 2 tries; heading for 709.4, -399.7, 601.2 | geometry | `game.shot(709.05, -398.00, 601.61, 40, -12, 13)` |
| in.44 858.7, -396.9, 606.2 (in.44 2052>2048) | 1 | the way needed 3 tries; heading for 859.1, -396.9, 606.5 | geometry | `game.shot(858.71, -395.25, 606.24, 128, -12, 13)` |
| in.65 262.1, -399.7, 754.7 (in.65 2080>2086) | 1 | the way needed 3 tries; heading for 261.7, -399.7, 755.0 | geometry | `game.shot(262.12, -398.00, 754.68, 233, -12, 13)` |
| in.70 710.5, -396.7, 756.3 (in.70 2108>2104) | 1 | the way needed 3 tries; heading for 710.9, -396.7, 756.6 | geometry | `game.shot(710.51, -395.05, 756.34, 128, -12, 13)` |
| in.74 856.7, -399.7, 757.2 (in.74 2118>2114) | 1 | the way needed 2 tries; heading for 856.9, -399.7, 756.6 | geometry | `game.shot(856.66, -398.00, 757.16, 20, -12, 13)` |
| in.74 856.6, -399.7, 754.0 (in.74 2114>2118) | 1 | the way needed 2 tries; heading for 856.9, -399.7, 753.6 | geometry | `game.shot(856.58, -398.00, 754.02, 36, -12, 13)` |
| in.115 1007.0, -399.7, 899.6 (in.115 2180>2171) | 1 | the way needed 3 tries; heading for 1007.4, -399.7, 899.4 | geometry | `game.shot(1006.95, -398.00, 899.65, 61, -12, 13)` |
| in.115 1009.5, -399.7, 899.7 (in.115 2171>2180) | 1 | the way needed 3 tries; heading for 1009.9, -399.7, 899.4 | geometry | `game.shot(1009.49, -398.00, 899.66, 53, -12, 13)` |
| in.116 1158.7, -396.7, 906.5 (in.116 2193>2189) | 1 | the way needed 3 tries; heading for 1159.1, -396.7, 906.9 | geometry | `game.shot(1158.71, -395.05, 906.54, 128, -12, 13)` |
| in.116 1158.0, -399.7, 899.3 (in.116 2186>1481) | 1 | the way needed 3 tries; heading for 1157.5, -399.7, 899.5 | geometry | `game.shot(1157.97, -398.00, 899.31, 248, -12, 13)` |
| high.c 256.6, -399.7, 1057.1 (high.c 2205>2201) | 1 | the way needed 2 tries; heading for 256.9, -399.7, 1056.7 | geometry | `game.shot(256.57, -398.00, 1057.11, 31, -12, 13)` |
| high.c 256.6, -399.7, 1054.0 (high.c 2201>2205) | 1 | the way needed 2 tries; heading for 256.9, -399.7, 1053.7 | geometry | `game.shot(256.57, -398.00, 1054.02, 37, -12, 13)` |

## Prompts for things more than 60 degrees off the view (22)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| outdoors -38.9, 2.4, -63.9 (street 517>533) | 1 | "Enter Saddler’s House" (door.in.66.in) is offered 60 degrees off the view, 1.9 m away | player | `game.shot(-38.92, 4.05, -63.86, 295, -12, 13)` |
| outdoors 12.4, 0.0, -3.4 (street 37>1553) | 1 | "Talk to Sorrel" (Talk to Sorrel Vane) is offered 69 degrees off the view, 0.9 m away | player | `game.shot(12.44, 1.66, -3.37, 0, -12, 13)` |
| outdoors 117.9, 2.8, 113.8 (street 193>194) | 1 | "Read" (sign.fishing) is offered 60 degrees off the view, 2.0 m away | player | `game.shot(117.88, 4.45, 113.85, 219, -12, 13)` |
| outdoors 112.3, 0.3, 20.8 (street 407>1542) | 1 | "Talk to Edda" (Talk to Edda Fairweather) is offered 69 degrees off the view, 0.9 m away | player | `game.shot(112.3, 1.96, 20.8, 272, -12, 13)` |
| outdoors -65.8, -0.3, 43.7 (street 134>1547) | 1 | "Talk to Wren" (Talk to Wren) is offered 69 degrees off the view, 0.9 m away | player | `game.shot(-65.84, 1.38, 43.74, 70, -12, 13)` |
| inn 264.4, -396.2, 0.1 (inn 1669>613) | 1 | "Open the locked chest" (cont.inn.chest2) is offered 60 degrees off the view, 1.5 m away | player | `game.shot(264.4, -394.55, 0.07, 358, -12, 13)` |
| smithy 412.2, -399.7, 2.7 (smithy 1681>641) | 1 | "Talk to Brandt" (Talk to Brandt Ironhand) is offered 69 degrees off the view, 0.9 m away | player | `game.shot(412.21, -398.00, 2.7, 154, -12, 13)` |
| store 553.5, -401.9, 6.0 (store 1701>1695) | 1 | "Search the crates" (cont.store.stockcrate1) is offered 60 degrees off the view, 1.9 m away | player | `game.shot(553.51, -400.22, 5.96, 95, -12, 13)` |
| store 553.1, -402.2, 5.7 (store 654>655) | 1 | "Search the sacks" (cont.store.stocksack3) is offered 60 degrees off the view, 1.9 m away | player | `game.shot(553.13, -400.51, 5.72, 90, -12, 13)` |
| shop.s2 562.1, -400.6, 309.5 (shop.s2 919>920) | 1 | "Talk to Maud" (Talk to Maud Tinker) is offered 60 degrees off the view, 2.2 m away | player | `game.shot(562.08, -398.93, 309.46, 181, -12, 13)` |
| in.04 857.3, -399.7, 301.1 (in.04 1885>947) | 1 | "Talk to Leofric" (Talk to Leofric Fletcher) is offered 69 degrees off the view, 0.9 m away | player | `game.shot(857.26, -398.00, 301.12, 250, -12, 13)` |
| in.08 1156.5, -399.7, 299.9 (in.08 1903>975) | 1 | "Sit down" (seat.in.08.tablebench1) is offered 60 degrees off the view, 1.4 m away | player | `game.shot(1156.53, -398.00, 299.87, 36, -12, 13)` |
| in.33 1162.8, -399.9, 457.8 (in.33 1110>1109) | 1 | "Search the crates" (cont.in.33.crate2) is offered 61 degrees off the view, 1.7 m away | player | `game.shot(1162.75, -398.23, 457.75, 2, -12, 13)` |
| in.40 712.7, -399.7, 599.8 (in.40 2036>1184) | 1 | "Take rye loaf" (loose.in.40.0) is offered 60 degrees off the view, 1.1 m away | player | `game.shot(712.66, -398.00, 599.76, 103, -12, 13)` |
| in.51 1158.8, -399.7, 603.3 (in.51 2069>1239) | 1 | "Sit down" (seat.in.51.bench15) is offered 61 degrees off the view, 0.9 m away | player | `game.shot(1158.78, -398.00, 603.32, 106, -12, 13)` |
| in.65 261.8, -396.8, 757.1 (in.65 2082>1268) | 1 | "Take rye loaf" (loose.in.65.0) is offered 60 degrees off the view, 1.0 m away | player | `game.shot(261.82, -395.15, 757.13, 250, -12, 13)` |
| in.65 254.8, -399.7, 756.8 (in.65 2085>2081) | 1 | "Search the barrel" (cont.in.65.barrel21) is offered 60 degrees off the view, 1.3 m away | player | `game.shot(254.83, -398.00, 756.84, 172, -12, 13)` |
| in.67 559.2, -399.7, 750.1 (in.67 1295>2099) | 1 | "Sit down" (seat.in.67.tablebench0) is offered 60 degrees off the view, 1.5 m away | player | `game.shot(559.18, -398.00, 750.09, 185, -12, 13)` |
| in.111 713.0, -402.5, 909.1 (in.111 1438>1439) | 1 | "Search the barrel" (cont.in.111.cbarrel4) is offered 60 degrees off the view, 1.5 m away | player | `game.shot(712.99, -400.85, 909.13, 130, -12, 13)` |
| in.115 1012.6, -399.7, 901.3 (in.115 2168>2179) | 1 | "Look along the shelf" (cont.in.115.shelf) is offered 61 degrees off the view, 1.0 m away | player | `game.shot(1012.63, -398.00, 901.29, 212, -12, 13)` |
| in.116 1158.0, -402.5, 909.2 (in.116 1487>1488) | 1 | "Open chest" (in.116.cellarchest) is offered 60 degrees off the view, 1.4 m away | player | `game.shot(1157.97, -400.85, 909.2, 279, -12, 13)` |
| outdoors 6.7, 5.4, 18.2 (route belltower back 8) | 1 | "Read" (bell.log) is offered 61 degrees off the view, 1.6 m away | player | `game.shot(6.71, 7.06, 18.22, 271, -12, 13)` |
