#!/bin/bash
# usage: test/chars_levels.sh <out dir> [bodies...]   face close-ups of every body at each of its four weights (0 full, 1 mid, 2 lod, 3 far), by moving the LOD thresholds
cd "$(dirname "$0")/.."; out=$1; shift; mkdir -p "$out"
names=${@:-"m_guard f_maid m_smith m_boy f_herbalist m_monk f_elder m_innkeeper f_farmer m_fisher m_youth f_girl m_elder f_child m_hunter f_weaver m_farmer o_hood_m o_brute o_hood_f o_rogue"}
for i in $(seq 1 48); do [ "$(pgrep -fc 'node test/shot.mjs')" -lt 1 ] && break; sleep 10; done
args=(--opt webgl=${WEBGL:-1} --opt quality=medium --opt play=1 --size ${SIZE:-844x390} --do "$(cat test/chars_lineup.js)")
for n in $names; do for L in 0 1 2 3; do
  args+=(--do "const B=1e9, D={0:{hi:B,mid:B,lo:B},1:{hi:0,mid:B,lo:B},2:{hi:0,mid:0,lo:B},3:{hi:0,mid:0,lo:0}}[$L]; Chars.LOD.dist.medium=D; Chars.LOD.hyst=0; await LU.show('$n',1.6,0,{face:true,hour:13}); for(let i=0;i<3;i++) await new Promise(r=>setTimeout(r,60)); return 1" --out "$out/${n}_L$L.png")
done; done
node test/shot.mjs "${args[@]}" 2>&1 | grep -i "error\|GPU\|fail" | head
