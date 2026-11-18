# Cheap-looking geometry: a list made without eyes

Made by `node tools/geomaudit.mjs` (the reader is `test/geom.js`). It reads the 112 static meshes of the town and the wilds out of doors
(224,343 triangles: walls, fences, plots, stalls, steps, the barn, the tower) and lists three kinds of fault. Since Build 83 it also reads the house shells and every other kit piece placed out of doors (last section).
It does not read the terrain or interiors, and it fixes nothing: each line is for whoever owns
that file. Positions are world metres; the last column is a call to paste in the page's console (or `test/shot.mjs --do`) that looks at the place.

Counts now: 38 places with stretched texture, 169 with open edges, 6 single flat pieces. Each table shows the worst first.

What the three mean and how sure they are:
- **Stretched texture** is measured exactly (metres of surface per repeat of the texture, along each axis of the texture). A face is listed when one axis is
  more than 2.5 times the other, or when it is more than 3 times off what the same material measures elsewhere. Sure.
- **Open edge** is an edge that only one triangle uses, 0.8 m or longer, 0.2 to 3 m above ground a person can stand on: the end or top of a surface with no
  thickness. Cloth, leaves, thatch and shingle are left out (they are sheets by nature). Some entries will be meant (a board nailed flat to a wall has open
  edges that nobody can see): look before fixing.
- **Single flat piece** is a part made of one or two triangles, over 2 m2, not lying on the ground: a wall, a lid or a roof that is one quad.

Metres per repeat, the median for each material (what "usual" means above): plaster 1.5, timber 0.75, planks 1.1, stone 1.91, cobble 1.25, thatch 1.58, shingle 1, grass 3, rock 1.97, bark 0.95, mud 1.5, soil 1.5, gravel 1.25, moss 3.15, cloth 0.27, metal 1.

## Stretched texture (38, worst 38)

| Where (x, y, z) | Material | What | Look at it |
|---|---|---|---|
| 113, 5.9, -7.2 | timber | 49.0 m2 in 8 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(116, 7.1, -4.2, 315, -12, 13)` |
| 7.9, 14.5, 17.2 | shingle | 13.8 m2 in 1 triangles: stretched 10.3 times one way (1.0 by 10.3 m a repeat) | `game.shot(10.9, 15.7, 20.2, 315, -12, 13)` |
| 7.9, 14.5, 20.8 | shingle | 13.8 m2 in 1 triangles: stretched 10.3 times one way (1.0 by 10.3 m a repeat) | `game.shot(10.9, 15.7, 23.8, 315, -12, 13)` |
| 109.6, 4.6, -5.5 | timber | 30.8 m2 in 14 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.6, 5.8, -2.5, 315, -12, 13)` |
| 10.9, 14.5, 19 | shingle | 11.4 m2 in 1 triangles: one texel smeared over the whole face | `game.shot(13.9, 15.7, 22, 315, -12, 13)` |
| 116.6, 2.6, -7.5 | timber | 26.5 m2 in 24 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(119.6, 3.8, -4.5, 315, -12, 13)` |
| 116.8, 4, -0.1 | timber | 25.9 m2 in 22 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(119.8, 5.2, 2.9, 315, -12, 13)` |
| 113, 5.9, 1.5 | timber | 24.6 m2 in 4 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(116, 7.1, 4.5, 315, -12, 13)` |
| 113, 5.9, 1.2 | timber | 24.4 m2 in 4 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(116, 7.1, 4.2, 315, -12, 13)` |
| 109.6, 4.6, 0.4 | timber | 19.8 m2 in 11 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.6, 5.8, 3.4, 315, -12, 13)` |
| 11.4, 7.9, -17.3 | plaster | 16.2 m2 in 2 triangles: stretched 2.7 times one way (6.6 by 2.5 m a repeat) | `game.shot(14.4, 9.1, -14.3, 315, -12, 13)` |
| 11.4, 7.9, -22.4 | plaster | 16.2 m2 in 2 triangles: stretched 2.7 times one way (6.6 by 2.5 m a repeat) | `game.shot(14.4, 9.1, -19.4, 315, -12, 13)` |
| 111.9, 1.6, 1.5 | timber | 11.0 m2 in 3 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(114.9, 2.8, 4.5, 315, -12, 13)` |
| -12.2, 2, -4.6 | cloth | 9.6 m2 in 6 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(-9.2, 3.2, -1.6, 315, -12, 13)` |
| -1.8, -0.5, 77.8 | planks | 7.5 m2 in 30 triangles: blown up 3.9 times against this material elsewhere (4.3 m a repeat, usually 1.1) | `game.shot(1.2, 0.7, 80.8, 315, -12, 13)` |
| 109.5, 2.6, -7.5 | timber | 9.2 m2 in 12 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.5, 3.8, -4.5, 315, -12, 13)` |
| 109.3, 4.5, -0.5 | timber | 8.6 m2 in 10 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.3, 5.7, 2.5, 315, -12, 13)` |
| 11.2, 2, -3.1 | cloth | 6.4 m2 in 4 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(14.2, 3.2, -0.1, 315, -12, 13)` |
| 4.7, 1.9, 5 | cloth | 6.4 m2 in 4 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(7.7, 3.1, 8, 315, -12, 13)` |
| 11.4, 2.2, -5.3 | cloth | 6.4 m2 in 4 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(14.4, 3.4, -2.3, 315, -12, 13)` |
| -11.8, 6.7, 12.7 | plaster | 4.4 m2 in 2 triangles: stretched 4.8 times one way (4.6 by 0.9 m a repeat) | `game.shot(-8.8, 7.9, 15.7, 315, -12, 13)` |
| -11.8, 6.7, 15.4 | plaster | 4.4 m2 in 2 triangles: stretched 4.8 times one way (4.6 by 0.9 m a repeat) | `game.shot(-8.8, 7.9, 18.4, 315, -12, 13)` |
| 5.5, 1.9, 4.3 | cloth | 4.8 m2 in 3 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(8.5, 3.1, 7.3, 315, -12, 13)` |
| -108.6, 2.8, -11.7 | shingle | 1.8 m2 in 2 triangles: one texel smeared over the whole face | `game.shot(-105.6, 4, -8.7, 315, -12, 13)` |
| 116.8, 1.6, -2.9 | timber | 4.2 m2 in 12 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(119.8, 2.8, 0.1, 315, -12, 13)` |
| -35.8, 6, 18.8 | stone | 3.4 m2 in 2 triangles: stretched 3.8 times one way (3.6 by 1.0 m a repeat) | `game.shot(-32.8, 7.2, 21.8, 315, -12, 13)` |
| -32, 6, 18.8 | stone | 3.4 m2 in 2 triangles: stretched 3.8 times one way (3.6 by 1.0 m a repeat) | `game.shot(-29, 7.2, 21.8, 315, -12, 13)` |
| -12.3, 2.1, -4.1 | cloth | 3.2 m2 in 2 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(-9.3, 3.3, -1.1, 315, -12, 13)` |
| 6.6, 15.2, 18.1 | shingle | 1.3 m2 in 1 triangles: stretched 10.3 times one way (1.0 by 0.1 m a repeat) | `game.shot(9.6, 16.4, 21.1, 315, -12, 13)` |
| 6.6, 15.2, 19.9 | shingle | 1.3 m2 in 1 triangles: stretched 10.3 times one way (1.0 by 0.1 m a repeat) | `game.shot(9.6, 16.4, 22.9, 315, -12, 13)` |
| -30.5, 6.2, 29.3 | stone | 2.5 m2 in 2 triangles: stretched 2.7 times one way (2.6 by 0.9 m a repeat) | `game.shot(-27.5, 7.4, 32.3, 315, -12, 13)` |
| -25.5, 6.2, 29.3 | stone | 2.5 m2 in 2 triangles: stretched 2.7 times one way (2.6 by 0.9 m a repeat) | `game.shot(-22.5, 7.4, 32.3, 315, -12, 13)` |
| 109.6, 4.6, -2.4 | timber | 2.0 m2 in 2 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.6, 5.8, 0.6, 315, -12, 13)` |
| 63.8, -0.1, 4.5 | stone | 2.3 m2 in 1 triangles: stretched 2.6 times one way (2.0 by 5.2 m a repeat) | `game.shot(66.8, 1.1, 7.5, 315, -12, 13)` |
| 4.3, 1.9, 5.4 | cloth | 1.6 m2 in 1 triangles: blown up 3.4 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(7.3, 3.1, 8.4, 315, -12, 13)` |
| -48.4, 3.6, 123.7 | rock | 1.1 m2 in 7 triangles: stretched 3.3 times one way (0.7 by 2.4 m a repeat) | `game.shot(-45.4, 4.8, 126.7, 315, -12, 13)` |
| -48.5, 3.6, 120.3 | rock | 1.1 m2 in 7 triangles: stretched 3.3 times one way (0.7 by 2.4 m a repeat) | `game.shot(-45.5, 4.8, 123.3, 315, -12, 13)` |
| 109.3, 4.5, -3.6 | timber | 1.0 m2 in 2 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.3, 5.7, -0.6, 315, -12, 13)` |

## Open edges (169, worst 80)

| Where (x, y, z) | Material | What | Look at it |
|---|---|---|---|
| -22.7, 6.4, -75.1 | stone | 30.5 m of open edge in 2 pieces: a top or side 15.3 m long, 0.9 m up | `game.shot(-19.7, 7.6, -72.1, 315, -12, 13)` |
| -40.4, 1.6, -43.1 | stone | 20.1 m of open edge in 2 pieces: a top or side 10.0 m long, 0.9 m up | `game.shot(-37.4, 2.8, -40.1, 315, -12, 13)` |
| -51, 0.9, -23.9 | stone | 18.9 m of open edge in 2 pieces: a top or side 9.4 m long, 0.8 m up | `game.shot(-48, 2.1, -20.9, 315, -12, 13)` |
| 28.9, -0.2, 37.7 | stone | 18.5 m of open edge in 2 pieces: a top or side 9.2 m long, 0.8 m up | `game.shot(31.9, 1, 40.7, 315, -12, 13)` |
| -52, 0.5, 38.7 | stone | 18.5 m of open edge in 2 pieces: a top or side 9.2 m long, 0.8 m up | `game.shot(-49, 1.7, 41.7, 315, -12, 13)` |
| 20.5, 1.6, -40.4 | stone | 16.9 m of open edge in 2 pieces: a top or side 8.4 m long, 0.8 m up | `game.shot(23.5, 2.8, -37.4, 315, -12, 13)` |
| 24.6, -0.2, 33.8 | stone | 16.9 m of open edge in 2 pieces: a top or side 8.4 m long, 0.8 m up | `game.shot(27.6, 1, 36.8, 315, -12, 13)` |
| 25.4, -0.1, 26.6 | stone | 16.9 m of open edge in 2 pieces: a top or side 8.4 m long, 0.7 m up | `game.shot(28.4, 1.1, 29.6, 315, -12, 13)` |
| -45.1, 1.6, -46.8 | stone | 16.1 m of open edge in 2 pieces: a top or side 8.0 m long, 0.5 m up | `game.shot(-42.1, 2.8, -43.8, 315, -12, 13)` |
| -44.2, 1, -32.7 | stone | 16.1 m of open edge in 2 pieces: a top or side 8.0 m long, 0.6 m up | `game.shot(-41.2, 2.2, -29.7, 315, -12, 13)` |
| 24.2, 1.1, -36.5 | stone | 16.1 m of open edge in 2 pieces: a top or side 8.0 m long, 0.7 m up | `game.shot(27.2, 2.3, -33.5, 315, -12, 13)` |
| -15, 3.4, 30.8 | stone | 15.3 m of open edge in 6 pieces: a top or side 5.0 m long, 2.2 m up | `game.shot(-12, 4.6, 33.8, 315, -12, 13)` |
| 18, 1, -22.8 | stone | 14.9 m of open edge in 2 pieces: a top or side 7.4 m long, 0.9 m up | `game.shot(21, 2.2, -19.8, 315, -12, 13)` |
| 21.4, 0.9, -19.5 | stone | 14.9 m of open edge in 2 pieces: a top or side 7.4 m long, 0.8 m up | `game.shot(24.4, 2.1, -16.5, 315, -12, 13)` |
| 31.6, 0.1, 29.9 | stone | 14.6 m of open edge in 4 pieces: a top or side 3.8 m long, 0.8 m up | `game.shot(34.6, 1.3, 32.9, 315, -12, 13)` |
| -154.4, 2.1, -3.4 | stone | 11.9 m of open edge in 4 pieces: a top or side 3.9 m long, 0.3 m up | `game.shot(-151.4, 3.3, -0.4, 315, -12, 13)` |
| -53.2, 0.5, 32.3 | stone | 11.4 m of open edge in 3 pieces: a top or side 3.8 m long, 0.9 m up | `game.shot(-50.2, 1.7, 35.3, 315, -12, 13)` |
| 109.3, 3, -4.7 | timber | 11.0 m of open edge in 4 pieces: an upright end 3.0 m long, 1.5 m up | `game.shot(112.3, 4.2, -1.7, 315, -12, 13)` |
| 109.3, 3, -1.2 | timber | 11.0 m of open edge in 4 pieces: an upright end 3.0 m long, 1.5 m up | `game.shot(112.3, 4.2, 1.8, 315, -12, 13)` |
| -28, 3.4, 30.6 | stone | 10.3 m of open edge in 5 pieces: a top or side 5.0 m long, 1.6 m up | `game.shot(-25, 4.6, 33.6, 315, -12, 13)` |
| -39.5, 1, -29 | stone | 10.0 m of open edge in 1 pieces: a top or side 10.0 m long, 0.7 m up | `game.shot(-36.5, 2.2, -26, 315, -12, 13)` |
| -39.5, 1, -28.4 | stone | 10.0 m of open edge in 1 pieces: a top or side 10.0 m long, 0.7 m up | `game.shot(-36.5, 2.2, -25.4, 315, -12, 13)` |
| -11.8, 6.1, 14.3 | timber | 9.0 m of open edge in 2 pieces: a top or side 4.5 m long, 2.7 m up | `game.shot(-8.8, 7.3, 17.3, 315, -12, 13)` |
| -16, 8.7, -66.7 | timber | 8.8 m of open edge in 4 pieces: a top or side 2.4 m long, 2.3 m up | `game.shot(-13, 9.9, -63.7, 315, -12, 13)` |
| 27.9, 1.1, -40.4 | stone | 8.4 m of open edge in 1 pieces: a top or side 8.4 m long, 0.8 m up | `game.shot(30.9, 2.3, -37.4, 315, -12, 13)` |
| 28.5, 1.1, -40.4 | stone | 8.4 m of open edge in 1 pieces: a top or side 8.4 m long, 0.8 m up | `game.shot(31.5, 2.3, -37.4, 315, -12, 13)` |
| 36.4, 7.8, -163.5 | stone | 8.1 m of open edge in 2 pieces: a top or side 4.4 m long, 2.4 m up | `game.shot(39.4, 9, -160.5, 315, -12, 13)` |
| -48.6, 0.8, -16.2 | stone | 7.8 m of open edge in 2 pieces: a top or side 3.9 m long, 0.9 m up | `game.shot(-45.6, 2, -13.2, 315, -12, 13)` |
| -151.3, 2.1, -3.4 | stone | 7.7 m of open edge in 2 pieces: a top or side 3.9 m long, 0.7 m up | `game.shot(-148.3, 3.3, -0.4, 315, -12, 13)` |
| 73.1, 2.3, 1.6 | timber | 7.6 m of open edge in 2 pieces: a top or side 3.9 m long, 2.8 m up | `game.shot(76.1, 3.5, 4.6, 315, -12, 13)` |
| 33.2, 2.8, 165.1 | planks | 7.1 m of open edge in 3 pieces: a top or side 3.4 m long, 1.9 m up | `game.shot(36.2, 4, 168.1, 315, -12, 13)` |
| 116.8, 2.9, -7.5 | timber | 7.0 m of open edge in 4 pieces: an upright end 2.0 m long, 1.5 m up | `game.shot(119.8, 4.1, -4.5, 315, -12, 13)` |
| 26.8, -0.1, 30.5 | stone | 7.0 m of open edge in 2 pieces: a top or side 3.5 m long, 0.8 m up | `game.shot(29.8, 1.1, 33.5, 315, -12, 13)` |
| 38.7, 0.3, 30.5 | stone | 7.0 m of open edge in 2 pieces: a top or side 3.5 m long, 0.8 m up | `game.shot(41.7, 1.5, 33.5, 315, -12, 13)` |
| 36.3, 6, -163.4 | stone | 7.0 m of open edge in 2 pieces: a top or side 4.5 m long, 0.6 m up | `game.shot(39.3, 7.2, -160.4, 315, -12, 13)` |
| 38, 7.8, -166.5 | stone | 6.9 m of open edge in 2 pieces: a top or side 4.4 m long, 2.0 m up | `game.shot(41, 9, -163.5, 315, -12, 13)` |
| -5.2, 3.5, 30 | stone | 6.7 m of open edge in 5 pieces: a top or side 1.4 m long, 2.4 m up | `game.shot(-2.2, 4.7, 33, 315, -12, 13)` |
| 21.8, 2.1, -44.3 | stone | 6.4 m of open edge in 2 pieces: a top or side 3.2 m long, 0.8 m up | `game.shot(24.8, 3.3, -41.3, 315, -12, 13)` |
| 26.6, 1.5, -44.3 | stone | 6.4 m of open edge in 2 pieces: a top or side 3.2 m long, 0.7 m up | `game.shot(29.6, 2.7, -41.3, 315, -12, 13)` |
| 34, 1.2, 162.7 | stone | 6.2 m of open edge in 2 pieces: a top or side 3.5 m long, 0.4 m up | `game.shot(37, 2.4, 165.7, 315, -12, 13)` |
| 13.6, 1, 75.6 | planks | 6.2 m of open edge in 4 pieces: a top or side 1.6 m long, 1.0 m up | `game.shot(16.6, 2.2, 78.6, 315, -12, 13)` |
| 116.8, 3.4, -3 | timber | 6.0 m of open edge in 7 pieces: a top or side 1.0 m long, 1.9 m up | `game.shot(119.8, 4.6, 0, 315, -12, 13)` |
| -72.2, 4.4, -152.8 | timber | 6.0 m of open edge in 2 pieces: a top or side 3.0 m long, 2.3 m up | `game.shot(-69.2, 5.6, -149.8, 315, -12, 13)` |
| -4.7, 2.2, -36.7 | stone | 5.8 m of open edge in 2 pieces: a top or side 2.9 m long, 0.5 m up | `game.shot(-1.7, 3.4, -33.7, 315, -12, 13)` |
| 2.3, 0.6, 6.8 | stone | 5.8 m of open edge in 2 pieces: a top or side 2.9 m long, 0.9 m up | `game.shot(5.3, 1.8, 9.8, 315, -12, 13)` |
| 6.9, 0.6, 6.8 | stone | 5.8 m of open edge in 2 pieces: a top or side 2.9 m long, 0.9 m up | `game.shot(9.9, 1.8, 9.8, 315, -12, 13)` |
| -19.9, 6.4, -67.8 | stone | 5.7 m of open edge in 1 pieces: a top or side 5.7 m long, 0.9 m up | `game.shot(-16.9, 7.6, -64.8, 315, -12, 13)` |
| -19.9, 6.4, -67.2 | stone | 5.7 m of open edge in 1 pieces: a top or side 5.7 m long, 0.9 m up | `game.shot(-16.9, 7.6, -64.2, 315, -12, 13)` |
| 11.6, -0.6, 74.9 | plain | 5.6 m of open edge in 4 pieces: a top or side 1.4 m long, 0.4 m up | `game.shot(14.6, 0.6, 77.9, 315, -12, 13)` |
| 16.4, -0.6, 74.9 | plain | 5.6 m of open edge in 4 pieces: a top or side 1.4 m long, 0.4 m up | `game.shot(19.4, 0.6, 77.9, 315, -12, 13)` |
| 34.6, 1.8, -66.6 | stone | 5.4 m of open edge in 2 pieces: a top or side 3.1 m long, 0.3 m up | `game.shot(37.6, 3, -63.6, 315, -12, 13)` |
| -33.5, 3.5, 30.7 | stone | 5.3 m of open edge in 4 pieces: a top or side 1.3 m long, 1.9 m up | `game.shot(-30.5, 4.7, 33.7, 315, -12, 13)` |
| -24.9, 3.5, 30.7 | stone | 5.3 m of open edge in 4 pieces: a top or side 1.3 m long, 1.9 m up | `game.shot(-21.9, 4.7, 33.7, 315, -12, 13)` |
| -21.4, 3.5, 30.7 | stone | 5.3 m of open edge in 4 pieces: a top or side 1.3 m long, 1.9 m up | `game.shot(-18.4, 4.7, 33.7, 315, -12, 13)` |
| -18.3, 3.5, 30.7 | stone | 5.3 m of open edge in 4 pieces: a top or side 1.3 m long, 1.9 m up | `game.shot(-15.3, 4.7, 33.7, 315, -12, 13)` |
| -12, 3.5, 30.7 | stone | 5.3 m of open edge in 4 pieces: a top or side 1.3 m long, 2.0 m up | `game.shot(-9, 4.7, 33.7, 315, -12, 13)` |
| -9.7, 3.5, 30.7 | stone | 5.3 m of open edge in 4 pieces: a top or side 1.3 m long, 2.0 m up | `game.shot(-6.7, 4.7, 33.7, 315, -12, 13)` |
| 34, 2.8, 162.9 | planks | 5.3 m of open edge in 2 pieces: a top or side 3.4 m long, 1.9 m up | `game.shot(37, 4, 165.9, 315, -12, 13)` |
| -28, 5.9, 28 | stone | 5.0 m of open edge in 1 pieces: a top or side 5.0 m long, 2.5 m up | `game.shot(-25, 7.1, 31, 315, -12, 13)` |
| 109.6, 2.9, -4.7 | timber | 4.9 m of open edge in 2 pieces: an upright end 2.9 m long, 1.4 m up | `game.shot(112.6, 4.1, -1.7, 315, -12, 13)` |
| 109.6, 2.9, -1.3 | timber | 4.9 m of open edge in 2 pieces: an upright end 2.9 m long, 1.4 m up | `game.shot(112.6, 4.1, 1.7, 315, -12, 13)` |
| -16, 8.7, -68.5 | timber | 4.8 m of open edge in 2 pieces: a top or side 2.4 m long, 2.3 m up | `game.shot(-13, 9.9, -65.5, 315, -12, 13)` |
| -9.4, 0.6, -21.8 | planks | 4.8 m of open edge in 4 pieces: a top or side 1.4 m long, 0.5 m up | `game.shot(-6.4, 1.8, -18.8, 315, -12, 13)` |
| 8.9, 0.4, 13 | planks | 4.8 m of open edge in 4 pieces: a top or side 1.4 m long, 0.5 m up | `game.shot(11.9, 1.6, 16, 315, -12, 13)` |
| -33.8, 2.6, -45.9 | planks | 4.8 m of open edge in 4 pieces: a top or side 1.4 m long, 0.6 m up | `game.shot(-30.8, 3.8, -42.9, 315, -12, 13)` |
| 34.6, 3.5, -64.4 | planks | 4.7 m of open edge in 2 pieces: a top or side 3.0 m long, 2.1 m up | `game.shot(37.6, 4.7, -61.4, 315, -12, 13)` |
| 34.6, 3.5, -66.4 | planks | 4.7 m of open edge in 2 pieces: a top or side 3.0 m long, 2.1 m up | `game.shot(37.6, 4.7, -63.4, 315, -12, 13)` |
| 14.6, 0.6, 79.5 | planks | 4.6 m of open edge in 2 pieces: a top or side 2.3 m long, 0.6 m up | `game.shot(17.6, 1.8, 82.5, 315, -12, 13)` |
| 14.6, 0.6, 78.9 | planks | 4.6 m of open edge in 2 pieces: a top or side 2.3 m long, 0.6 m up | `game.shot(17.6, 1.8, 81.9, 315, -12, 13)` |
| -12.6, 7.8, -67.8 | stone | 4.5 m of open edge in 1 pieces: a top or side 4.5 m long, 1.3 m up | `game.shot(-9.6, 8.9, -64.8, 315, -12, 13)` |
| -12.6, 7.8, -67.2 | stone | 4.5 m of open edge in 1 pieces: a top or side 4.5 m long, 1.3 m up | `game.shot(-9.6, 8.9, -64.2, 315, -12, 13)` |
| 12.3, -0.2, 75 | planks | 4.5 m of open edge in 3 pieces: an upright end 1.6 m long, 0.8 m up | `game.shot(15.3, 1, 78, 315, -12, 13)` |
| -30.4, 1.3, -15.3 | planks | 4.2 m of open edge in 4 pieces: a top or side 1.1 m long, 1.4 m up | `game.shot(-27.4, 2.5, -12.3, 315, -12, 13)` |
| -31.9, 3.8, 18.8 | plain | 4.0 m of open edge in 4 pieces: a top or side 1.0 m long, 0.3 m up | `game.shot(-28.9, 5, 21.8, 315, -12, 13)` |
| -28, 3.8, 28 | plain | 4.0 m of open edge in 4 pieces: a top or side 1.0 m long, 0.3 m up | `game.shot(-25, 5, 31, 315, -12, 13)` |
| -17.1, 8.7, -67.5 | timber | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 2.3 m up | `game.shot(-14.1, 9.9, -64.5, 315, -12, 13)` |
| 72.7, 4.8, 1 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 1.8 m up | `game.shot(75.7, 6, 4, 315, -12, 13)` |
| -36.2, 3.5, 30.7 | stone | 4.0 m of open edge in 3 pieces: a top or side 1.3 m long, 2.4 m up | `game.shot(-33.2, 4.7, 33.7, 315, -12, 13)` |
| -8.2, 8.2, -59.1 | timber | 3.9 m of open edge in 1 pieces: a top or side 3.9 m long, 2.6 m up | `game.shot(-5.2, 9.4, -56.1, 315, -12, 13)` |
| 69.4, 2.3, 1.6 | timber | 3.9 m of open edge in 1 pieces: a top or side 3.9 m long, 2.7 m up | `game.shot(72.4, 3.5, 4.6, 315, -12, 13)` |

## Single flat pieces (6)

| Where (x, y, z) | Material | What | Look at it |
|---|---|---|---|
| 11.4, 7.9, -17.3 | plaster | 16.2 m2 single flat piece, upright, 4.2 m above the ground | `game.shot(14.4, 9.1, -14.3, 315, -12, 13)` |
| 11.4, 7.9, -22.4 | plaster | 16.2 m2 single flat piece, upright, 7.8 m above the ground | `game.shot(14.4, 9.1, -19.4, 315, -12, 13)` |
| -11.8, 6.7, 12.7 | plaster | 4.4 m2 single flat piece, upright, 4.0 m above the ground | `game.shot(-8.8, 7.9, 15.7, 315, -12, 13)` |
| -11.8, 6.7, 15.4 | plaster | 4.4 m2 single flat piece, upright, 3.3 m above the ground | `game.shot(-8.8, 7.9, 18.4, 315, -12, 13)` |
| 38, 8.2, -166.5 | stone | 2.4 m2 single flat piece, upright, 2.4 m above the ground | `game.shot(41, 9.4, -163.5, 315, -12, 13)` |
| 36.4, 8.2, -163.5 | stone | 2.4 m2 single flat piece, upright, 2.8 m above the ground | `game.shot(39.4, 9.4, -160.5, 315, -12, 13)` |

## The house shells and other kit pieces out of doors (3137 placed)

Read from the placements the kit records under `--opt audit=1`: each modelled piece's own open edges (0.8 m or longer, 0.2 to 3 m above the ground) and its
parts of one or two triangles over 2 m2, found once in the piece and put where every copy stands. Leaves, cloth, thatch, shingle, glass, straw and ivy are left
out. A wall panel that is one quad shows here once per copy, so the worst rows are the pieces to fix in the kit, not the places.

### Open edges (692 places, worst 60)

| Where (x, y, z) | Piece | What | Look at it |
|---|---|---|---|
| 0, 3.2, -16.6 | gen_roofe_4 | 136.0 m of open edge in 32 edges: MI_Slate_Roof, a top or side 15.4 m, 2.9 m up | `game.shot(3, 4.4, -13.6, 315, -12, 13)` |
| 11.1, 1.5, -34.3 | gen_walls_381 | 115.9 m of open edge in 79 edges: MI_Stone_DS, a top or side 5.0 m, 0.6 m up | `game.shot(14.1, 2.7, -31.3, 315, -12, 13)` |
| -24.4, 4, -36.1 | gen_roofe_177 | 110.3 m of open edge in 67 edges: MI_Slate_Roof, a top or side 6.4 m, 2.5 m up | `game.shot(-21.4, 5.2, -33.1, 315, -12, 13)` |
| -22.4, 2.6, 7.2 | gen_dress_137 | 107.7 m of open edge in 79 edges: MI_WoodTrim, a top or side 5.0 m, 2.7 m up | `game.shot(-19.4, 3.8, 10.2, 315, -12, 13)` |
| 15.5, 1.7, 19.5 | gen_roofe_51 | 105.4 m of open edge in 58 edges: MI_Slate_Roof, a top or side 7.0 m, 2.6 m up | `game.shot(18.5, 2.9, 22.5, 315, -12, 13)` |
| -15.2, -0.7, 66.9 | gen_walls_414 | 105.3 m of open edge in 66 edges: MI_Stone_DS, a top or side 7.0 m, 0.3 m up | `game.shot(-12.2, 0.5, 69.9, 315, -12, 13)` |
| -31.2, 4.7, -44.5 | gen_roofe_298 | 95.8 m of open edge in 54 edges: MI_Slate_Roof, a top or side 6.0 m, 2.6 m up | `game.shot(-28.2, 5.9, -41.5, 315, -12, 13)` |
| 15.6, 1, 65.5 | gen_roofe_232 | 90.5 m of open edge in 48 edges: MI_Slate_Roof, a top or side 8.0 m, 2.0 m up | `game.shot(18.6, 2.2, 68.5, 315, -12, 13)` |
| -29.4, 2.1, -11.7 | gen_roofe_158 | 89.3 m of open edge in 49 edges: MI_Slate_Roof, a top or side 5.6 m, 2.2 m up | `game.shot(-26.4, 3.3, -8.7, 315, -12, 13)` |
| 35.6, 1.7, -4.9 | Wall_Plaster_Straight_Base | 88.8 m of open edge in 59 edges: MI_Plaster, an upright end 3.0 m, 1.8 m up | `game.shot(38.6, 2.9, -1.9, 315, -12, 13)` |
| 29.3, 1.7, -4.9 | Wall_Plaster_Straight_Base | 88.7 m of open edge in 69 edges: MI_Plaster, an upright end 3.0 m, 1.8 m up | `game.shot(32.3, 2.9, -1.9, 315, -12, 13)` |
| -27, 2.7, -13 | gen_roofe_23 | 87.0 m of open edge in 41 edges: MI_Slate_Roof, a top or side 9.9 m, 2.8 m up | `game.shot(-24, 3.9, -10, 315, -12, 13)` |
| 34.2, 1.5, 8.2 | T_Wall_Plaster_Straight_Base | 78.3 m of open edge in 40 edges: MI_Plaster_Planks, an upright end 3.0 m, 1.8 m up | `game.shot(37.2, 2.7, 11.2, 315, -12, 13)` |
| -11, -0.7, 66.1 | gen_walls_414 | 75.9 m of open edge in 52 edges: MI_Stone_DS, a top or side 5.0 m, 0.3 m up | `game.shot(-8, 0.5, 69.1, 315, -12, 13)` |
| -40.9, 5.1, -63.5 | gen_roofe_334 | 75.6 m of open edge in 30 edges: MI_Slate_Roof, a top or side 8.3 m, 2.9 m up | `game.shot(-37.9, 6.3, -60.5, 315, -12, 13)` |
| -4.8, 1.8, 21.2 | gen_terrace_walls | 75.4 m of open edge in 48 edges: MI_Rubble_Wall, an upright end 3.5 m, 1.4 m up | `game.shot(-1.8, 3, 24.2, 315, -12, 13)` |
| -34, 3.6, -63 | gen_walls_337 | 74.9 m of open edge in 48 edges: MI_Stone_DS, a top or side 5.6 m, 0.6 m up | `game.shot(-31, 4.8, -60, 315, -12, 13)` |
| -69.4, 2.8, 44 | gen_roofe_81 | 74.3 m of open edge in 47 edges: MI_WoodTrim, a top or side 6.6 m, 2.8 m up | `game.shot(-66.4, 4, 47, 315, -12, 13)` |
| -56.1, 2.4, 24.1 | gen_roofe_393 | 73.7 m of open edge in 40 edges: MI_Slate_Roof, a top or side 8.3 m, 2.6 m up | `game.shot(-53.1, 3.6, 27.1, 315, -12, 13)` |
| -70.5, 2.7, -1.3 | gen_roofe_363 | 73.7 m of open edge in 43 edges: MI_WoodTrim, a top or side 6.0 m, 2.4 m up | `game.shot(-67.5, 3.9, 1.7, 315, -12, 13)` |
| -25.5, 0.5, 3.4 | gen_walls_147 | 73.4 m of open edge in 50 edges: MI_Stone_DS, a top or side 6.0 m, 0.6 m up | `game.shot(-22.5, 1.7, 6.4, 315, -12, 13)` |
| -70.5, 2.7, 4.5 | gen_roofe_363 | 73.4 m of open edge in 46 edges: MI_WoodTrim, a top or side 6.0 m, 2.4 m up | `game.shot(-67.5, 3.9, 7.5, 315, -12, 13)` |
| 6.3, 1.6, 59.8 | gen_roofe_192 | 73.4 m of open edge in 48 edges: MI_WoodTrim, a top or side 6.4 m, 2.6 m up | `game.shot(9.3, 2.8, 62.8, 315, -12, 13)` |
| -21.1, 2.1, -33 | gen_walls_174 | 72.8 m of open edge in 46 edges: MI_Stone_DS, a top or side 5.6 m, 0.6 m up | `game.shot(-18.1, 3.3, -30, 315, -12, 13)` |
| -6.4, 2.3, -17.4 | Wall_UnevenBrick_Straight | 72.5 m of open edge in 46 edges: MI_Plaster, an upright end 3.6 m, 2.1 m up | `game.shot(-3.4, 3.5, -14.4, 315, -12, 13)` |
| 124, 5.7, 110 | gen_dress_458 | 71.4 m of open edge in 46 edges: MI_WoodTrim, a top or side 4.2 m, 2.7 m up | `game.shot(127, 6.9, 113, 315, -12, 13)` |
| -19.8, 1.2, 59.8 | gen_roofe_258 | 71.0 m of open edge in 38 edges: MI_WoodTrim, a top or side 7.4 m, 2.4 m up | `game.shot(-16.8, 2.4, 62.8, 315, -12, 13)` |
| 8.8, 1.7, 66.6 | gen_roofe_232 | 68.2 m of open edge in 29 edges: MI_WoodTrim, a top or side 8.0 m, 2.7 m up | `game.shot(11.8, 2.9, 69.6, 315, -12, 13)` |
| 9.2, 4.4, -54 | gen_walls_366 | 68.1 m of open edge in 46 edges: MI_Rubble_Wall, a top or side 6.2 m, 0.6 m up | `game.shot(12.2, 5.6, -51, 315, -12, 13)` |
| 118, 3.9, 92.7 | gen_roofe_762 | 67.6 m of open edge in 34 edges: MI_WoodTrim, a top or side 7.4 m, 2.7 m up | `game.shot(121, 5.1, 95.7, 315, -12, 13)` |
| -50.4, 1.3, -8 | gen_walls_278 | 67.4 m of open edge in 50 edges: MI_Plaster_Planks, an upright end 2.1 m, 1.1 m up | `game.shot(-47.4, 2.5, -5, 315, -12, 13)` |
| 1.7, 5.3, -16.6 | gen_cross_11 | 66.9 m of open edge in 45 edges: MI_Plaster, an upright end 5.0 m, 1.6 m up | `game.shot(4.7, 6.5, -13.6, 315, -12, 13)` |
| -19.4, -0.6, 60.3 | gen_walls_255 | 66.7 m of open edge in 40 edges: MI_Stone_DS, a top or side 7.0 m, 0.6 m up | `game.shot(-16.4, 0.6, 63.3, 315, -12, 13)` |
| 46.4, 2.3, 6.2 | gen_pent_513 | 66.6 m of open edge in 37 edges: MI_WoodTrim, a top or side 5.7 m, 2.4 m up | `game.shot(49.4, 3.5, 9.2, 315, -12, 13)` |
| 126.3, 4.8, 110 | T_Wall_Plaster_Straight_Base | 66.4 m of open edge in 44 edges: MI_Plaster_Planks, an upright end 3.0 m, 1.8 m up | `game.shot(129.3, 6, 113, 315, -12, 13)` |
| 35.6, 1.7, -10.1 | Wall_Plaster_Straight_L | 66.3 m of open edge in 40 edges: MI_Plaster, an upright end 3.0 m, 1.8 m up | `game.shot(38.6, 2.9, -7.1, 315, -12, 13)` |
| 5.7, 5, -48.4 | gen_walls_374 | 66.1 m of open edge in 53 edges: MI_Plaster_Planks, an upright end 1.6 m, 2.0 m up | `game.shot(8.7, 6.2, -45.4, 315, -12, 13)` |
| -9, 4, 27 | gen_walls_200 | 65.4 m of open edge in 44 edges: MI_Stone_DS, a top or side 6.4 m, 0.6 m up | `game.shot(-6, 5.2, 30, 315, -12, 13)` |
| -17.7, 4.1, -35.9 | gen_roofe_177 | 65.2 m of open edge in 26 edges: MI_Slate_Roof, a top or side 6.4 m, 2.6 m up | `game.shot(-14.7, 5.3, -32.9, 315, -12, 13)` |
| 27.4, 1.4, 9.8 | T_Wall_Plaster_Straight_Base | 65.1 m of open edge in 33 edges: MI_Plaster_Planks, an upright end 3.0 m, 1.7 m up | `game.shot(30.4, 2.6, 12.8, 315, -12, 13)` |
| -37.5, 1, -0.5 | gen_walls_577 | 64.5 m of open edge in 46 edges: MI_Stone_DS, an upright end 3.3 m, 1.4 m up | `game.shot(-34.5, 2.2, 2.5, 315, -12, 13)` |
| 27.2, 1.4, 6 | T_Wall_Plaster_Straight_Base | 64.5 m of open edge in 42 edges: MI_Plaster_Planks, an upright end 3.0 m, 1.2 m up | `game.shot(30.2, 2.6, 9, 315, -12, 13)` |
| 5.8, -0.1, 58.4 | gen_walls_189 | 64.4 m of open edge in 49 edges: MI_Plaster_Planks, an upright end 2.1 m, 1.0 m up | `game.shot(8.8, 1.1, 61.4, 315, -12, 13)` |
| 7.5, 2.3, -17.4 | Wall_UnevenBrick_Straight | 64.0 m of open edge in 37 edges: MI_Plaster, an upright end 3.6 m, 2.1 m up | `game.shot(10.5, 3.5, -14.4, 315, -12, 13)` |
| -23, 2.9, -8.3 | gen_dress_29 | 63.6 m of open edge in 32 edges: MI_WoodTrim, a top or side 6.4 m, 2.9 m up | `game.shot(-20, 4.1, -5.3, 315, -12, 13)` |
| 30.7, 0.1, 23.2 | gen_walls_438 | 63.6 m of open edge in 44 edges: MI_Stone_DS, a top or side 4.6 m, 0.6 m up | `game.shot(33.7, 1.3, 26.2, 315, -12, 13)` |
| -45.7, 0.4, 21.1 | gen_walls_396 | 63.4 m of open edge in 44 edges: MI_Stone_DS, a top or side 4.6 m, 0.6 m up | `game.shot(-42.7, 1.6, 24.1, 315, -12, 13)` |
| 0.4, 1.8, 68 | gen_roofe_317 | 63.4 m of open edge in 42 edges: MI_WoodTrim, a top or side 5.4 m, 2.8 m up | `game.shot(3.4, 3, 71, 315, -12, 13)` |
| -73.3, 1, 1.6 | gen_walls_360 | 63.3 m of open edge in 43 edges: MI_Rubble_Wall, a top or side 4.6 m, 0.6 m up | `game.shot(-70.3, 2.2, 4.6, 315, -12, 13)` |
| 23.3, 1.2, 29.8 | gen_roofe_611 | 63.1 m of open edge in 31 edges: MI_Slate_Roof, a top or side 4.8 m, 2.2 m up | `game.shot(26.3, 2.4, 32.8, 315, -12, 13)` |
| -32, 0.5, -8.6 | gen_walls_155 | 62.7 m of open edge in 32 edges: MI_Stone_DS, a top or side 5.0 m, 0.6 m up | `game.shot(-29, 1.7, -5.6, 315, -12, 13)` |
| -15.2, 1.9, 64 | gen_roofe_258 | 62.4 m of open edge in 28 edges: MI_WoodTrim, a top or side 7.4 m, 2.8 m up | `game.shot(-12.2, 3.1, 67, 315, -12, 13)` |
| -5.8, 3.4, 24.5 | gen_walls_200 | 62.2 m of open edge in 25 edges: MI_Stone_DS, a top or side 5.0 m, 0.5 m up | `game.shot(-2.8, 4.6, 27.5, 315, -12, 13)` |
| -28.3, 0.5, 6.4 | gen_walls_147 | 62.2 m of open edge in 43 edges: MI_Stone_DS, a top or side 5.6 m, 0.6 m up | `game.shot(-25.3, 1.7, 9.4, 315, -12, 13)` |
| -56.1, 2.6, 18.1 | gen_roofe_393 | 62.2 m of open edge in 32 edges: MI_Slate_Roof, a top or side 8.3 m, 2.8 m up | `game.shot(-53.1, 3.8, 21.1, 315, -12, 13)` |
| 16.5, 2.4, 7.6 | gen_roofe_123 | 61.6 m of open edge in 24 edges: MI_Slate_Roof, a top or side 6.8 m, 2.6 m up | `game.shot(19.5, 3.6, 10.6, 315, -12, 13)` |
| -28.5, 5.4, -50.6 | gen_roofe_348 | 61.4 m of open edge in 41 edges: MI_WoodTrim, a top or side 5.8 m, 2.3 m up | `game.shot(-25.5, 6.6, -47.6, 315, -12, 13)` |
| 43.2, 2.3, -3 | gen_pent_476 | 61.3 m of open edge in 34 edges: MI_WoodTrim, a top or side 5.7 m, 2.4 m up | `game.shot(46.2, 3.5, 0, 315, -12, 13)` |
| -24.4, 4.8, -43.2 | gen_roofe_298 | 61.2 m of open edge in 26 edges: MI_Slate_Roof, a top or side 6.0 m, 2.8 m up | `game.shot(-21.4, 6, -40.2, 315, -12, 13)` |
| -48.8, 0.4, 23.4 | gen_walls_396 | 60.1 m of open edge in 39 edges: MI_Stone_DS, a top or side 6.2 m, 0.7 m up | `game.shot(-45.8, 1.6, 26.4, 315, -12, 13)` |

### Single flat pieces (878, largest 40)

| Where (x, y, z) | Piece | What | Look at it |
|---|---|---|---|
| 7.5, 6.5, -22 | gen_roof_3 | 35.8 m2 single flat piece (MI_Plaster_Planks) | `game.shot(10.5, 7.7, -19, 315, -12, 13)` |
| -7.5, 6.5, -22 | gen_roof_3 | 35.8 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-4.5, 7.7, -19, 315, -12, 13)` |
| 94.5, 5.8, 114 | gen_roof_768 | 25.4 m2 single flat piece (MI_Plaster_Planks) | `game.shot(97.5, 7, 117, 315, -12, 13)` |
| 103.5, 5.8, 114 | gen_roof_768 | 25.4 m2 single flat piece (MI_Plaster_Planks) | `game.shot(106.5, 7, 117, 315, -12, 13)` |
| -6, 13.2, -68 | gen_roof_66 | 24.0 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-3, 14.4, -65, 315, -12, 13)` |
| -6, 13.2, -82 | gen_roof_66 | 24.0 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-3, 14.4, -79, 315, -12, 13)` |
| 23, 8.2, -4.3 | gen_roof_32 | 19.1 m2 single flat piece (MI_Plaster_Planks) | `game.shot(26, 9.4, -1.3, 315, -12, 13)` |
| 23, 8.2, -12.7 | gen_roof_32 | 19.1 m2 single flat piece (MI_Plaster_Planks) | `game.shot(26, 9.4, -9.7, 315, -12, 13)` |
| -21.9, 2.5, -6.4 | gen_dress_29 | 18.3 m2 single flat piece (MI_WoodTrim) | `game.shot(-18.9, 3.7, -3.4, 315, -12, 13)` |
| -21.9, 2.7, -7.3 | gen_dress_29 | 18.3 m2 single flat piece (MI_WoodTrim) | `game.shot(-18.9, 3.9, -4.3, 315, -12, 13)` |
| -8.1, 2.6, -20.5 | gen_dress_7 | 17.3 m2 single flat piece (MI_WoodTrim) | `game.shot(-5.1, 3.8, -17.5, 315, -12, 13)` |
| -8.8, 2.5, -20.5 | gen_dress_7 | 17.3 m2 single flat piece (MI_WoodTrim) | `game.shot(-5.8, 3.7, -17.5, 315, -12, 13)` |
| -41, 8.6, -36.5 | gen_roof_662 | 17.2 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-38, 9.8, -33.5, 315, -12, 13)` |
| -41, 8.6, -41.5 | gen_roof_662 | 17.2 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-38, 9.8, -38.5, 315, -12, 13)` |
| 28.4, 7.6, 19.7 | gen_roof_443 | 16.9 m2 single flat piece (MI_Plaster_Planks) | `game.shot(31.4, 8.8, 22.7, 315, -12, 13)` |
| 33, 7.6, 19.7 | gen_roof_443 | 16.9 m2 single flat piece (MI_Plaster_Planks) | `game.shot(36, 8.8, 22.7, 315, -12, 13)` |
| -48.2, 7.3, 31.1 | gen_roof_730 | 16.7 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-45.2, 8.5, 34.1, 315, -12, 13)` |
| -48.2, 7.3, 25.7 | gen_roof_730 | 16.7 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-45.2, 8.5, 28.7, 315, -12, 13)` |
| -22, 8, 0.8 | gen_roof_133 | 15.4 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-19, 9.2, 3.8, 315, -12, 13)` |
| -22, 8, 7.2 | gen_roof_133 | 15.4 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-19, 9.2, 10.2, 315, -12, 13)` |
| -23, 4.7, -17.8 | gen_roof_22 | 14.8 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-20, 5.9, -14.8, 315, -12, 13)` |
| -23, 4.7, -8.2 | gen_roof_22 | 14.8 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-20, 5.9, -5.2, 315, -12, 13)` |
| 34.2, 7.6, 11 | gen_roof_62 | 14.6 m2 single flat piece (MI_Plaster_Planks) | `game.shot(37.2, 8.8, 14, 315, -12, 13)` |
| 41.8, 7.6, 11 | gen_roof_62 | 14.6 m2 single flat piece (MI_Plaster_Planks) | `game.shot(44.8, 8.8, 14, 315, -12, 13)` |
| -31.1, 7.8, 3.4 | gen_roof_151 | 14.6 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-28.1, 9, 6.4, 315, -12, 13)` |
| -25.5, 7.8, 3.4 | gen_roof_151 | 14.6 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-22.5, 9, 6.4, 315, -12, 13)` |
| -32.4, 7.9, -9.6 | gen_roof_58 | 14.3 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-29.4, 9.1, -6.6, 315, -12, 13)` |
| -39.6, 7.9, -9.6 | gen_roof_58 | 14.3 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-36.6, 9.1, -6.6, 315, -12, 13)` |
| -4.8, 8.9, -67.4 | gen_dress_70 | 14.1 m2 single flat piece (MI_WoodTrim) | `game.shot(-1.8, 10.1, -64.4, 315, -12, 13)` |
| -7.2, 8.9, -82.6 | gen_dress_71 | 14.1 m2 single flat piece (MI_WoodTrim) | `game.shot(-4.2, 10.1, -79.6, 315, -12, 13)` |
| -4.8, 8.8, -66.7 | gen_dress_70 | 14.1 m2 single flat piece (MI_WoodTrim) | `game.shot(-1.8, 10, -63.7, 315, -12, 13)` |
| -7.2, 8.8, -83.3 | gen_dress_71 | 14.1 m2 single flat piece (MI_WoodTrim) | `game.shot(-4.2, 10, -80.3, 315, -12, 13)` |
| -20.1, 1, 60.1 | gen_dress_264 | 13.8 m2 single flat piece (MI_WoodTrim) | `game.shot(-17.1, 2.2, 63.1, 315, -12, 13)` |
| -5.6, 9.1, -29.3 | gen_roof_184 | 13.6 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-2.6, 10.3, -26.3, 315, -12, 13)` |
| -5.9, 9.1, -34.9 | gen_roof_184 | 13.6 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-2.9, 10.3, -31.9, 315, -12, 13)` |
| 1.2, 6, -17.5 | gen_cross_11 | 13.4 m2 single flat piece (MI_Slate_Roof) | `game.shot(4.2, 7.2, -14.5, 315, -12, 13)` |
| -43, 7.2, -6.7 | gen_roof_603 | 12.9 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-40, 8.4, -3.7, 315, -12, 13)` |
| -43, 7.2, -12.9 | gen_roof_603 | 12.9 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-40, 8.4, -9.9, 315, -12, 13)` |
| -21, 6.3, -39 | gen_roof_176 | 12.7 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-18, 7.5, -36, 315, -12, 13)` |
| -21.1, 6.3, -33 | gen_roof_176 | 12.7 m2 single flat piece (MI_Plaster_Planks) | `game.shot(-18.1, 7.5, -30, 315, -12, 13)` |
