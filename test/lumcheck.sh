#!/bin/bash
# Render check: from four compass directions at noon, no more than 1% of the frame may be near-black (shaded roofs and walls must keep texture).
# usage: test/lumcheck.sh <prefix> [shot.mjs opts, e.g. --opt webgl=1 --opt quality=medium]
cd "$(dirname "$0")/.."; P=$1; shift; A=(); i=0
for v in "0,9,-2,0,-12,12" "0,9,-2,90,-12,12" "0,9,-2,180,-12,12" "0,9,-2,270,-12,12"; do
  A+=(--do "await game.shot($v); return 1" --out /home/claude/shots/v2/${P}_$i.png); i=$((i+1)); done
node test/shot.mjs --size 844x390 "$@" "${A[@]}" 2>&1 | grep -v "^do:\|^saved"
python3 -W ignore - "$P" <<'PY'
import sys
from PIL import Image
P=sys.argv[1]; bad=0
def lin(v): v/=255; return v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4
for i in range(4):
    im=Image.open(f'/home/claude/shots/v2/{P}_{i}.png').convert('RGB'); px=list(im.getdata()); n=len(px)
    dark=sum(1 for a,b,c in px if 0.2126*lin(a)+0.7152*lin(b)+0.0722*lin(c)<0.012)
    f=dark/n; print(P,i,'near-black fraction %.4f'%f); bad+= f>0.01
print('LUMCHECK', 'FAIL' if bad else 'PASS')
PY
