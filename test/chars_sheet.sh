#!/bin/bash
# usage: test/chars_sheet.sh <out dir> [bodies...]   (one browser launch; waits for other shot.mjs runs; then python test/chars_sheet.py <out dir> stitches)
cd "$(dirname "$0")/.."; out=$1; shift; mkdir -p "$out"
names=${@:-$(node -e "console.log('m_guard f_maid m_smith m_boy f_herbalist m_monk f_elder m_innkeeper f_farmer m_fisher m_youth f_girl m_elder f_child m_hunter f_weaver m_farmer o_hood_m o_brute o_hood_f o_rogue')")}
for i in $(seq 1 48); do [ "$(pgrep -fc 'node test/shot.mjs')" -lt 1 ] && break; sleep 10; done
args=(--opt webgl=${WEBGL:-1} --opt quality=${QUALITY:-medium} --opt play=1 --size ${SIZE:-844x390} --do "$(cat test/chars_lineup.js)")
for n in $names; do
  VIEWS=${VIEWS:-"f0:1.2:0:true:13:false b0:2.5:0:false:13:false e0:8:0:false:13:false i0:1.3:20:true:19.7:true"}
  for v in $VIEWS; do
    IFS=: read tag d az face hr inn <<< "$v"
    args+=(--do "await LU.show('$n',$d,$az,{face:$face,hour:$hr,inn:$inn}); return 1" --out "$out/${n}_$tag.png")
  done
done
node test/shot.mjs "${args[@]}" 2>&1 | grep -i "error\|GPU\|fail" | head
