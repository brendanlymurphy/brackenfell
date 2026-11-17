# Cheap-looking geometry: a list made without eyes

Made by `node tools/geomaudit.mjs` (the reader is `test/geom.js`). It reads the 66 static meshes of the town and the wilds out of doors
(123,888 triangles: walls, fences, plots, stalls, steps, the barn, the tower) and lists three kinds of fault. It does not read the modelled kit
pieces, the generated house shells (they are in the kit's batches), the terrain or interiors, and it fixes nothing: each line is for whoever owns
that file. Positions are world metres; the last column is a call to paste in the page's console (or `test/shot.mjs --do`) that looks at the place.

Counts now: 38 places with stretched texture, 249 with open edges, 6 single flat pieces. Each table shows the worst first.

What the three mean and how sure they are:
- **Stretched texture** is measured exactly (metres of surface per repeat of the texture, along each axis of the texture). A face is listed when one axis is
  more than 2.5 times the other, or when it is more than 3 times off what the same material measures elsewhere. Sure.
- **Open edge** is an edge that only one triangle uses, 0.8 m or longer, 0.2 to 3 m above ground a person can stand on: the end or top of a surface with no
  thickness. Cloth, leaves, thatch and shingle are left out (they are sheets by nature). Some entries will be meant (a board nailed flat to a wall has open
  edges that nobody can see): look before fixing.
- **Single flat piece** is a part made of one or two triangles, over 2 m2, not lying on the ground: a wall, a lid or a roof that is one quad.

Metres per repeat, the median for each material (what "usual" means above): plaster 1.5, timber 0.75, planks 1.1, stone 1.6, cobble 1.25, thatch 1.59, shingle 1, dirt 4.5, rock 2, bark 0.49, mud 1.5, soil 1.5, gravel 1.25, moss 2.4, cloth 0.3, metal 1.

## Stretched texture (38, worst 38)

| Where (x, y, z) | Material | What | Look at it |
|---|---|---|---|
| 113, 5.9, -7.2 | timber | 49.0 m2 in 8 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(116, 7.1, -4.2, 315, -12, 13)` |
| 7.9, 14.5, 17.2 | shingle | 13.8 m2 in 1 triangles: stretched 10.2 times one way (1.0 by 10.2 m a repeat) | `game.shot(10.9, 15.7, 20.2, 315, -12, 13)` |
| 7.9, 14.5, 20.8 | shingle | 13.8 m2 in 1 triangles: stretched 10.2 times one way (1.0 by 10.2 m a repeat) | `game.shot(10.9, 15.7, 23.8, 315, -12, 13)` |
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
| 109.5, 2.6, -7.5 | timber | 9.2 m2 in 12 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.5, 3.8, -4.5, 315, -12, 13)` |
| -12.2, 2, -4.6 | cloth | 9.6 m2 in 6 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(-9.2, 3.2, -1.6, 315, -12, 13)` |
| 109.3, 4.5, -0.5 | timber | 8.6 m2 in 10 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.3, 5.7, 2.5, 315, -12, 13)` |
| -11.8, 6.7, 12.7 | plaster | 4.4 m2 in 2 triangles: stretched 4.8 times one way (4.6 by 0.9 m a repeat) | `game.shot(-8.8, 7.9, 15.7, 315, -12, 13)` |
| -11.8, 6.7, 15.4 | plaster | 4.4 m2 in 2 triangles: stretched 4.8 times one way (4.6 by 0.9 m a repeat) | `game.shot(-8.8, 7.9, 18.4, 315, -12, 13)` |
| 11.2, 2, -3.1 | cloth | 6.4 m2 in 4 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(14.2, 3.2, -0.1, 315, -12, 13)` |
| 4.7, 1.9, 5 | cloth | 6.4 m2 in 4 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(7.7, 3.1, 8, 315, -12, 13)` |
| 11.4, 2.2, -5.3 | cloth | 6.4 m2 in 4 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(14.4, 3.4, -2.3, 315, -12, 13)` |
| -108.6, 2.8, -11.7 | shingle | 1.8 m2 in 2 triangles: one texel smeared over the whole face | `game.shot(-105.6, 4, -8.7, 315, -12, 13)` |
| 5.5, 1.9, 4.3 | cloth | 4.8 m2 in 3 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(8.5, 3.1, 7.3, 315, -12, 13)` |
| 116.8, 1.6, -2.9 | timber | 4.2 m2 in 12 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(119.8, 2.8, 0.1, 315, -12, 13)` |
| -35.8, 6, 18.8 | stone | 3.4 m2 in 2 triangles: stretched 3.8 times one way (3.6 by 1.0 m a repeat) | `game.shot(-32.8, 7.2, 21.8, 315, -12, 13)` |
| -32, 6, 18.8 | stone | 3.4 m2 in 2 triangles: stretched 3.8 times one way (3.6 by 1.0 m a repeat) | `game.shot(-29, 7.2, 21.8, 315, -12, 13)` |
| 6.6, 15.2, 18.1 | shingle | 1.3 m2 in 1 triangles: stretched 10.3 times one way (1.0 by 0.1 m a repeat) | `game.shot(9.6, 16.4, 21.1, 315, -12, 13)` |
| 6.6, 15.2, 19.9 | shingle | 1.3 m2 in 1 triangles: stretched 10.3 times one way (1.0 by 0.1 m a repeat) | `game.shot(9.6, 16.4, 22.9, 315, -12, 13)` |
| -12.3, 2.1, -4.1 | cloth | 3.2 m2 in 2 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(-9.3, 3.3, -1.1, 315, -12, 13)` |
| 63.8, -0.6, -0.5 | stone | 2.3 m2 in 1 triangles: blown up 3.0 times against this material elsewhere (4.9 m a repeat, usually 1.6) | `game.shot(66.8, 0.6, 2.5, 315, -12, 13)` |
| -30.5, 6.2, 29.3 | stone | 2.5 m2 in 2 triangles: stretched 2.7 times one way (2.6 by 0.9 m a repeat) | `game.shot(-27.5, 7.4, 32.3, 315, -12, 13)` |
| -25.5, 6.2, 29.3 | stone | 2.5 m2 in 2 triangles: stretched 2.7 times one way (2.6 by 0.9 m a repeat) | `game.shot(-22.5, 7.4, 32.3, 315, -12, 13)` |
| 109.6, 4.6, -2.4 | timber | 2.0 m2 in 2 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.6, 5.8, 0.6, 315, -12, 13)` |
| 63.8, -0.1, 4.5 | stone | 2.3 m2 in 1 triangles: stretched 2.6 times one way (2.0 by 5.2 m a repeat) | `game.shot(66.8, 1.1, 7.5, 315, -12, 13)` |
| 4.3, 2, 5.4 | cloth | 1.6 m2 in 1 triangles: blown up 3.0 times against this material elsewhere (0.9 m a repeat, usually 0.3) | `game.shot(7.3, 3.2, 8.4, 315, -12, 13)` |
| -47.6, 2.4, 120.3 | rock | 1.1 m2 in 7 triangles: stretched 3.3 times one way (0.7 by 2.4 m a repeat) | `game.shot(-44.6, 3.6, 123.3, 315, -12, 13)` |
| -47.5, 2.4, 123.7 | rock | 1.1 m2 in 7 triangles: stretched 3.3 times one way (0.7 by 2.4 m a repeat) | `game.shot(-44.5, 3.6, 126.7, 315, -12, 13)` |
| 109.3, 4.5, -3.6 | timber | 1.0 m2 in 2 triangles: blown up 3.2 times against this material elsewhere (2.4 m a repeat, usually 0.8) | `game.shot(112.3, 5.7, -0.6, 315, -12, 13)` |

## Open edges (249, worst 80)

| Where (x, y, z) | Material | What | Look at it |
|---|---|---|---|
| -22.7, 6.4, -75.1 | stone | 30.5 m of open edge in 2 pieces: a top or side 15.3 m long, 0.9 m up | `game.shot(-19.7, 7.6, -72.1, 315, -12, 13)` |
| -15, 3.4, 30.8 | stone | 15.3 m of open edge in 6 pieces: a top or side 5.0 m long, 2.2 m up | `game.shot(-12, 4.6, 33.8, 315, -12, 13)` |
| -154.4, 2.1, -3.4 | stone | 11.9 m of open edge in 4 pieces: a top or side 3.9 m long, 0.3 m up | `game.shot(-151.4, 3.3, -0.4, 315, -12, 13)` |
| 109.3, 3, -4.7 | timber | 11.0 m of open edge in 4 pieces: an upright end 3.0 m long, 1.5 m up | `game.shot(112.3, 4.2, -1.7, 315, -12, 13)` |
| 109.3, 3, -1.2 | timber | 11.0 m of open edge in 4 pieces: an upright end 3.0 m long, 1.5 m up | `game.shot(112.3, 4.2, 1.8, 315, -12, 13)` |
| -28, 3.4, 30.6 | stone | 10.3 m of open edge in 5 pieces: a top or side 5.0 m long, 1.6 m up | `game.shot(-25, 4.6, 33.6, 315, -12, 13)` |
| -11.8, 6.1, 14.3 | timber | 9.0 m of open edge in 2 pieces: a top or side 4.5 m long, 2.7 m up | `game.shot(-8.8, 7.3, 17.3, 315, -12, 13)` |
| -16, 8.7, -66.7 | timber | 8.8 m of open edge in 4 pieces: a top or side 2.4 m long, 2.3 m up | `game.shot(-13, 9.9, -63.7, 315, -12, 13)` |
| 36.4, 7.8, -163.5 | stone | 8.1 m of open edge in 2 pieces: a top or side 4.4 m long, 2.4 m up | `game.shot(39.4, 9, -160.5, 315, -12, 13)` |
| -151.3, 2.1, -3.4 | stone | 7.7 m of open edge in 2 pieces: a top or side 3.9 m long, 0.7 m up | `game.shot(-148.3, 3.3, -0.4, 315, -12, 13)` |
| 73.1, 2.3, 1.6 | timber | 7.6 m of open edge in 2 pieces: a top or side 3.9 m long, 2.8 m up | `game.shot(76.1, 3.5, 4.6, 315, -12, 13)` |
| 72.7, 4.8, 1 | planks | 7.5 m of open edge in 4 pieces: a top or side 2.0 m long, 1.8 m up | `game.shot(75.7, 6, 4, 315, -12, 13)` |
| 33.2, 2.8, 165.1 | planks | 7.1 m of open edge in 3 pieces: a top or side 3.4 m long, 1.9 m up | `game.shot(36.2, 4, 168.1, 315, -12, 13)` |
| -28.4, 3.2, 34.3 | stone | 7.0 m of open edge in 6 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-25.4, 4.4, 37.3, 315, -12, 13)` |
| -7.4, 0.1, 34.7 | stone | 7.0 m of open edge in 6 pieces: an upright end 1.2 m long, 1.2 m up | `game.shot(-4.4, 1.3, 37.7, 315, -12, 13)` |
| -7.4, 0.1, 34.3 | stone | 7.0 m of open edge in 6 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-4.4, 1.3, 37.3, 315, -12, 13)` |
| 116.8, 2.9, -7.5 | timber | 7.0 m of open edge in 4 pieces: an upright end 2.0 m long, 1.5 m up | `game.shot(119.8, 4.1, -4.5, 315, -12, 13)` |
| 36.3, 6, -163.4 | stone | 7.0 m of open edge in 2 pieces: a top or side 4.5 m long, 0.6 m up | `game.shot(39.3, 7.2, -160.4, 315, -12, 13)` |
| 38, 7.8, -166.5 | stone | 6.9 m of open edge in 2 pieces: a top or side 4.4 m long, 2.0 m up | `game.shot(41, 9, -163.5, 315, -12, 13)` |
| -5.2, 3.5, 30 | stone | 6.7 m of open edge in 5 pieces: a top or side 1.4 m long, 2.4 m up | `game.shot(-2.2, 4.7, 33, 315, -12, 13)` |
| 34, 1.2, 162.7 | stone | 6.2 m of open edge in 2 pieces: a top or side 3.5 m long, 0.4 m up | `game.shot(37, 2.4, 165.7, 315, -12, 13)` |
| 13.6, 1, 75.6 | planks | 6.2 m of open edge in 4 pieces: a top or side 1.6 m long, 1.0 m up | `game.shot(16.6, 2.2, 78.6, 315, -12, 13)` |
| 116.8, 3.4, -3 | timber | 6.0 m of open edge in 7 pieces: a top or side 1.0 m long, 1.9 m up | `game.shot(119.8, 4.6, 0, 315, -12, 13)` |
| 72.7, 4.8, 5 | planks | 6.0 m of open edge in 3 pieces: a top or side 2.0 m long, 1.8 m up | `game.shot(75.7, 6, 8, 315, -12, 13)` |
| 73.7, 0, 17 | dirt | 6.0 m of open edge in 3 pieces: a top or side 2.0 m long, 0.5 m up | `game.shot(76.7, 1.2, 20, 315, -12, 13)` |
| -72.2, 4.4, -152.8 | timber | 6.0 m of open edge in 2 pieces: a top or side 3.0 m long, 2.3 m up | `game.shot(-69.2, 5.6, -149.8, 315, -12, 13)` |
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
| -33.3, 2.3, -45.8 | planks | 4.8 m of open edge in 4 pieces: a top or side 1.4 m long, 0.6 m up | `game.shot(-30.3, 3.5, -42.8, 315, -12, 13)` |
| -18.6, 1.7, 34.7 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 2.6 m up | `game.shot(-15.6, 2.9, 37.7, 315, -12, 13)` |
| -18.6, 1.7, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-15.6, 2.9, 37.3, 315, -12, 13)` |
| -21.4, 1.9, 34.7 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 2.8 m up | `game.shot(-18.4, 3.1, 37.7, 315, -12, 13)` |
| -20, 1.9, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-17, 3.1, 37.3, 315, -12, 13)` |
| -10.2, 0.3, 34.7 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 1.4 m up | `game.shot(-7.2, 1.5, 37.7, 315, -12, 13)` |
| -8.8, 0.3, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-5.8, 1.5, 37.3, 315, -12, 13)` |
| -29.8, 3.4, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-26.8, 4.6, 37.3, 315, -12, 13)` |
| -13, 0.7, 34.7 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 1.7 m up | `game.shot(-10, 1.9, 37.7, 315, -12, 13)` |
| -11.6, 0.7, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-8.6, 1.9, 37.3, 315, -12, 13)` |
| -15.8, 1.3, 34.7 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 2.3 m up | `game.shot(-12.8, 2.5, 37.7, 315, -12, 13)` |
| -15.8, 1.3, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-12.8, 2.5, 37.3, 315, -12, 13)` |
| -24.2, 2.6, 34.3 | stone | 4.7 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-21.2, 3.8, 37.3, 315, -12, 13)` |
| 34.6, 3.5, -64.4 | planks | 4.7 m of open edge in 2 pieces: a top or side 3.0 m long, 2.1 m up | `game.shot(37.6, 4.7, -61.4, 315, -12, 13)` |
| 34.6, 3.5, -66.4 | planks | 4.7 m of open edge in 2 pieces: a top or side 3.0 m long, 2.1 m up | `game.shot(37.6, 4.7, -63.4, 315, -12, 13)` |
| -36.8, 1.1, 31.8 | stone | 4.6 m of open edge in 1 pieces: an upright end 4.6 m long, 1.6 m up | `game.shot(-33.8, 2.3, 34.8, 315, -12, 13)` |
| 14.6, 0.6, 79.5 | planks | 4.6 m of open edge in 2 pieces: a top or side 2.3 m long, 0.6 m up | `game.shot(17.6, 1.8, 82.5, 315, -12, 13)` |
| 14.6, 0.6, 78.9 | planks | 4.6 m of open edge in 2 pieces: a top or side 2.3 m long, 0.6 m up | `game.shot(17.6, 1.8, 81.9, 315, -12, 13)` |
| -12.6, 7.8, -67.8 | stone | 4.5 m of open edge in 1 pieces: a top or side 4.5 m long, 1.3 m up | `game.shot(-9.6, 8.9, -64.8, 315, -12, 13)` |
| -12.6, 7.8, -67.2 | stone | 4.5 m of open edge in 1 pieces: a top or side 4.5 m long, 1.3 m up | `game.shot(-9.6, 8.9, -64.2, 315, -12, 13)` |
| -28, 3.5, -59.2 | dirt | 4.5 m of open edge in 5 pieces: a top or side 0.9 m long, 0.4 m up | `game.shot(-25, 4.7, -56.2, 315, -12, 13)` |
| -16, 5.6, -59.2 | dirt | 4.5 m of open edge in 5 pieces: a top or side 0.9 m long, 0.3 m up | `game.shot(-13, 6.8, -56.2, 315, -12, 13)` |
| -4, 6, -59.2 | dirt | 4.5 m of open edge in 5 pieces: a top or side 0.9 m long, 0.5 m up | `game.shot(-1, 7.2, -56.2, 315, -12, 13)` |
| 12.3, -0.2, 75 | planks | 4.5 m of open edge in 3 pieces: an upright end 1.6 m long, 0.8 m up | `game.shot(15.3, 1, 78, 315, -12, 13)` |
| -32.6, 3.8, 34.3 | stone | 4.5 m of open edge in 4 pieces: an upright end 1.2 m long, 0.6 m up | `game.shot(-29.6, 5, 37.3, 315, -12, 13)` |
| -22, 4.9, -59.2 | dirt | 4.3 m of open edge in 5 pieces: a top or side 0.9 m long, 0.8 m up | `game.shot(-19, 6.1, -56.2, 315, -12, 13)` |
| -31.9, 3.8, 18.8 | plain | 4.0 m of open edge in 4 pieces: a top or side 1.0 m long, 0.3 m up | `game.shot(-28.9, 5, 21.8, 315, -12, 13)` |
| -28, 3.8, 28 | plain | 4.0 m of open edge in 4 pieces: a top or side 1.0 m long, 0.3 m up | `game.shot(-25, 5, 31, 315, -12, 13)` |
| -17.1, 8.7, -67.5 | timber | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 2.3 m up | `game.shot(-14.1, 9.9, -64.5, 315, -12, 13)` |
| -25, 8.7, -58.3 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 2.0 m up | `game.shot(-22, 9.9, -55.3, 315, -12, 13)` |
| -19, 9.7, -58.3 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 2.0 m up | `game.shot(-16, 10.9, -55.3, 315, -12, 13)` |
| -1, 10.1, -58.3 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 2.0 m up | `game.shot(2, 11.3, -55.3, 315, -12, 13)` |
| 5, 9.2, -58.3 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 2.0 m up | `game.shot(8, 10.4, -55.3, 315, -12, 13)` |
| 72.3, 5.6, -43 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 1.9 m up | `game.shot(75.3, 6.8, -40, 315, -12, 13)` |
| 72.7, 1, -43 | dirt | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 0.5 m up | `game.shot(75.7, 2.2, -40, 315, -12, 13)` |
| 73.7, 1, -43 | dirt | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 0.5 m up | `game.shot(76.7, 2.2, -40, 315, -12, 13)` |
| 72.3, 5.4, -37 | planks | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 1.9 m up | `game.shot(75.3, 6.6, -34, 315, -12, 13)` |
| 72.7, 1, -37 | dirt | 4.0 m of open edge in 2 pieces: a top or side 2.0 m long, 0.5 m up | `game.shot(75.7, 2.2, -34, 315, -12, 13)` |

## Single flat pieces (6)

| Where (x, y, z) | Material | What | Look at it |
|---|---|---|---|
| 11.4, 7.9, -17.3 | plaster | 16.2 m2 single flat piece, upright, 4.2 m above the ground | `game.shot(14.4, 9.1, -14.3, 315, -12, 13)` |
| 11.4, 7.9, -22.4 | plaster | 16.2 m2 single flat piece, upright, 7.8 m above the ground | `game.shot(14.4, 9.1, -19.4, 315, -12, 13)` |
| -11.8, 6.7, 12.7 | plaster | 4.4 m2 single flat piece, upright, 4.0 m above the ground | `game.shot(-8.8, 7.9, 15.7, 315, -12, 13)` |
| -11.8, 6.7, 15.4 | plaster | 4.4 m2 single flat piece, upright, 3.3 m above the ground | `game.shot(-8.8, 7.9, 18.4, 315, -12, 13)` |
| 38, 8.2, -166.5 | stone | 2.4 m2 single flat piece, upright, 2.4 m above the ground | `game.shot(41, 9.4, -163.5, 315, -12, 13)` |
| 36.4, 8.2, -163.5 | stone | 2.4 m2 single flat piece, upright, 2.8 m above the ground | `game.shot(39.4, 9.4, -160.5, 315, -12, 13)` |
