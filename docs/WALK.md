# Walking the world: what the walk bot found

Written by `node test/walkbot.mjs` (do not edit by hand: run it again). The bot moves only by input (W, turning, Space, the E key) along every
stretch of the villagers' navigation graph outdoors and in all interiors, both ways; every way point of the galleries, wall walks, terraces
and the wharf; every path of the wilds; the mine, tunnel and cave. Walking speed measured on open ground: 2.90 m/s.

This run: 416 m walked (4 minutes of play), 106 stretches, 2 doors used by the E key, 5 places the bot had to be lifted past.

To look at a finding: `node test/shot.mjs --opt webgl=1 --do "await <shot call>" --out f.png` (the call puts the camera where the player's eye was).
Owner: **player** = collision, camera, prompts (the behaviour worker: fixed here or listed in docs/BUGS.md); **geometry** = where things stand (the
visual workers: outdoors `fork-fx1`, interiors `fork-fx2`). The bot cannot see flicker or how a place looks.

How far to trust it: falls, water, the camera and prompt findings and the door counts are measured directly and hold. "Could not be walked",
"stuck", "snag" and "slide" are where the bot, walking the straight line the villagers' graph draws between two points, was stopped: most are
real obstacles on a line people are meant to walk (a table leg in a doorway, a step too high), some are lines only villagers use. Look at the
shot before changing anything. Every door in the game (2 uses, both directions) gave its prompt and opened; none needed a second try unless listed.

| Kind | Places |
|---|---|
| Could not be walked at all (the bot was lifted on) | 5 |
| Stuck: no progress for 2 s with W held | 8 |
| Stairs that needed more than one try | 2 |
| Prompts offered through a wall | 1 |
| Sliding: moving more than 35 degrees off the way the player faces | 2 |
| Snags: under half walking speed | 10 |
| Stretches that needed more than one try | 1 |
| Prompts for things more than 60 degrees off the view | 1 |

## Could not be walked at all (the bot was lifted on) (5)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 266.5, -399.4, -0.1 (inn 1826>617) | 1 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 266.1, -399.7, -0.5 | geometry | `game.shot(266.48, -397.77, -0.05, 313, -12, 13)` |
| inn 260.1, -402.0, 0.4 (inn 617>1826) | 1 | could not be walked: lifted to the next way point after 5 tries (walk); heading for 260.0, -399.7, -0.7 | geometry | `game.shot(260.08, -400.37, 0.4, 356, -12, 13)` |
| inn 258.8, -398.8, 1.0 (inn 1826>632) | 1 | could not be walked: lifted to the next way point after 4 tries (walk); heading for 258.4, -399.7, 1.4 | geometry | `game.shot(258.78, -397.17, 0.97, 222, -12, 13)` |
| inn 266.0, -395.4, -1.8 (inn 1832>635) | 1 | could not be walked: lifted to the next way point after 3 tries (stair); heading for 265.8, -395.6, -0.7 | geometry | `game.shot(265.98, -393.72, -1.82, 191, -12, 13)` |
| inn 261.9, -395.3, 5.9 (inn 1833>637) | 1 | could not be walked: lifted to the next way point after 3 tries (stair); heading for 261.3, -395.6, 6.3 | geometry | `game.shot(261.92, -393.64, 5.91, 238, -12, 13)` |

## Stuck: no progress for 2 s with W held (8)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 260.2, -399.7, -0.5 (inn 1826>617) | 1 | no progress for 2 s, 5.8 m short of the next way point; heading for 266.1, -399.7, -0.5 | geometry | `game.shot(260.23, -398.00, -0.45, 90, -12, 13)` |
| inn 265.8, -399.7, -1.0 (inn 617>1826) | 1 | no progress for 2 s, 5.8 m short of the next way point; heading for 260.0, -399.7, -0.7 | geometry | `game.shot(265.77, -398.00, -0.97, 267, -12, 13)` |
| inn 263.1, -399.7, -0.9 (inn 618>1826) | 1 | no progress for 2 s, 3.2 m short of the next way point; heading for 260.0, -399.7, -0.7 | geometry | `game.shot(263.15, -398.00, -0.87, 266, -12, 13)` |
| inn 258.7, -399.7, 1.0 (inn 1826>632) | 1 | no progress for 2 s, 0.6 m short of the next way point; heading for 258.4, -399.7, 1.4 | geometry | `game.shot(258.72, -398.00, 0.99, 219, -12, 13)` |
| inn 263.8, -396.2, -0.7 (inn 1832>635) | 1 | no progress for 2 s, 2.0 m short of the next way point (stair); heading for 265.8, -395.6, -0.7 | geometry | `game.shot(263.78, -394.55, -0.67, 90, -12, 13)` |
| inn 265.0, -396.2, 5.1 (inn 1833>636) | 1 | no progress for 2 s, 1.1 m short of the next way point (stair); heading for 265.8, -395.6, 4.3 | geometry | `game.shot(265.03, -394.55, 5.1, 43, -12, 13)` |
| inn 264.2, -396.2, 3.9 (inn 636>1833) | 1 | no progress for 2 s, 2.1 m short of the next way point (stair); heading for 263.5, -396.2, 5.8 | geometry | `game.shot(264.22, -394.55, 3.87, 200, -12, 13)` |
| inn 262.6, -396.2, 6.3 (inn 1833>637) | 1 | no progress for 2 s, 1.3 m short of the next way point (stair); heading for 261.3, -395.6, 6.3 | geometry | `game.shot(262.57, -394.55, 6.33, 270, -12, 13)` |

## Stairs that needed more than one try (2)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 265.5, -395.3, 3.9 (inn 1833>636) | 1 | the stair needed 4 tries; heading for 265.8, -395.6, 4.3 | geometry | `game.shot(265.5, -393.68, 3.87, 151, -12, 13)` |
| inn 263.0, -396.2, 5.7 (inn 636>1833) | 1 | the stair needed 4 tries; heading for 263.5, -396.2, 5.8 | geometry | `game.shot(262.99, -394.55, 5.67, 109, -12, 13)` |

## Prompts offered through a wall (1)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 254.5, -399.7, 4.2 (inn 1827>1835) | 1 | "Sit down" (seat.inn.table8bench1) is offered through a solid box 1.6 x 0.3 m, 1.8 high, 1.8 m away | player | `game.shot(254.49, -398.00, 4.2, 2, -12, 13)` |

## Sliding: moving more than 35 degrees off the way the player faces (2)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 260.9, -399.7, 1.1 (inn 1836>1826) | 1 | moving 63 degrees off the way it faces | player | `game.shot(260.85, -398.00, 1.12, 333, -12, 13)` |
| inn 264.4, -399.7, -1.1 (inn 1826>617) | 1 | moving 68 degrees off the way it faces | player | `game.shot(264.43, -398.00, -1.06, 112, -12, 13)` |

## Snags: under half walking speed (10)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 260.2, -399.7, -0.5 (inn 1826>617) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(260.23, -398.00, -0.46, 90, -12, 13)` |
| inn 264.4, -399.7, -0.8 (inn 1826>617) | 1 | speed 0.6 of 2.9 m/s with W held | player | `game.shot(264.43, -398.00, -0.75, 101, -12, 13)` |
| inn 265.8, -399.7, -1.0 (inn 617>1826) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(265.77, -398.00, -0.97, 267, -12, 13)` |
| inn 260.4, -399.7, -1.2 (inn 1826>618) | 1 | speed 0.7 of 2.9 m/s with W held | player | `game.shot(260.36, -398.00, -1.2, 87, -12, 13)` |
| inn 263.1, -399.7, -0.9 (inn 618>1826) | 1 | speed 0.2 of 2.9 m/s with W held | player | `game.shot(263.15, -398.00, -0.88, 266, -12, 13)` |
| inn 258.7, -399.7, 1.0 (inn 1826>632) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(258.72, -398.00, 0.99, 219, -12, 13)` |
| inn 263.8, -396.2, -0.7 (inn 1832>635) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(263.78, -394.55, -0.67, 90, -12, 13)` |
| inn 265.8, -396.2, -1.4 (inn 1832>635) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(265.75, -394.55, -1.44, 180, -12, 13)` |
| inn 265.0, -396.2, 5.1 (inn 1833>636) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(265.03, -394.55, 5.1, 43, -12, 13)` |
| inn 264.2, -396.2, 3.9 (inn 636>1833) | 1 | speed 0.0 of 2.9 m/s with W held | player | `game.shot(264.22, -394.55, 3.87, 200, -12, 13)` |

## Stretches that needed more than one try (1)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 260.1, -399.7, -0.1 (inn 618>1826) | 1 | the way needed 2 tries; heading for 260.0, -399.7, -0.7 | geometry | `game.shot(260.11, -398.00, -0.15, 348, -12, 13)` |

## Prompts for things more than 60 degrees off the view (1)

| Where | Times | What | Owner | Shot |
|---|---|---|---|---|
| inn 264.4, -396.2, 0.1 (inn 1832>635) | 1 | "Open the locked chest (not yours)" (cont.inn.chest2) is offered 60 degrees off the view, 1.5 m away | player | `game.shot(264.4, -394.55, 0.07, 358, -12, 13)` |
