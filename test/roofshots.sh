#!/bin/bash
# usage: test/roofshots.sh <prefix> [extra shot.mjs opts]   -> /home/claude/shots/v2/<prefix>_1..6.png
cd "$(dirname "$0")/.." ; P=$1; shift
A=(); i=1
for v in "4,22,-34,180,-38,12" "6,null,-6,150,14,12" "0,45,-40,180,-40,12" "30,14,-2,250,-12,12" "-9,null,-8,0,0,12" "45,25,10,270,-30,12"; do
  A+=(--do "await game.shot($v); return 1" --out /home/claude/shots/v2/${P}_$i.png); i=$((i+1)); done
node test/shot.mjs --size 844x390 --opt webgl=1 --opt quality=medium "$@" "${A[@]}" 2>&1 | grep -v "^do:\|^saved"
