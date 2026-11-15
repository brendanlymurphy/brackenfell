#!/bin/bash
# Render check: from four compass directions at noon, no more than 1% of the frame may be near-black (shaded roofs and walls must keep texture).
# usage: test/lumcheck.sh <prefix> [shot.mjs opts, e.g. --opt webgl=1 --opt quality=medium]
cd "$(dirname "$0")/.."; P=$1; shift; A=(); i=0
for v in "0,9,-2,0,-12,12" "0,9,-2,90,-12,12" "0,9,-2,180,-12,12" "0,9,-2,270,-12,12"; do
  A+=(--do "await game.shot($v); return 1" --out /home/claude/shots/v2/${P}_$i.png); i=$((i+1)); done
node test/shot.mjs --size 844x390 "$@" "${A[@]}" 2>&1 | grep -v "^do:\|^saved"
python3 -W ignore - "$P" <<'PY'
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
# A roof or wall region is a connected patch of pixels: doors, window panes and tree trunks are small patches, a black slope would be a big one.
# Fail when one connected patch below the floor (linear luminance 0.006, about 1/16 of a sunlit wall) fills more than 1% of the frame.
P=sys.argv[1]; bad=0
def lin(v): v=v/255; return np.where(v<=0.04045,v/12.92,((v+0.055)/1.055)**2.4)
for i in range(4):
    a=np.array(Image.open(f'/home/claude/shots/v2/{P}_{i}.png').convert('RGB')).astype(float)
    L=0.2126*lin(a[...,0])+0.7152*lin(a[...,1])+0.0722*lin(a[...,2])
    m=L<0.006; lab,n=nd.label(m); s=np.bincount(lab.ravel())[1:] if n else np.array([0])
    f=s.max()/m.size; print(P,i,'darkest patch %.4f  total below floor %.4f'%(f,m.mean())); bad+= f>0.01
print('LUMCHECK', 'FAIL' if bad else 'PASS')
PY
