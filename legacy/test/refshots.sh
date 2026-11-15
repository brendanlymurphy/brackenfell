#!/bin/bash
# usage: refshots.sh <outdir>
O=$1
node test/shot.mjs --size 844x390 --opt texRes=256 --opt play=1 --opt quality=high \
  --do "$(cat test/int.js)" \
  --do "return await __game.shot(-30, null, -5, 80, -4, 10)" --out $O/r1.png \
  --do "return await __game.shot(8, null, 84, 175, -6, 23)" --out $O/r2.png \
  --do "return await __in('inn', 3.0, -1.0, -120, -4, 22)" --out $O/r3.png \
  --do "return await __game.shot(60, null, 16, 20, -10, 17.5)" --out $O/r4.png \
  --do "return await __game.shot(-6, null, -60, 0, 35, 12)" --out $O/r5.png \
  --do "await __game.debugTextures(0, 5, 4, 1); return 1" --out $O/r6.png 2>&1 | grep -v "^$" | grep -i "error\|saved\|ready" 
