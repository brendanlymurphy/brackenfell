#!/bin/bash
# Builds every villager in specs.json: run_all.sh <work dir> <out dir> [names...]
here=$(cd "$(dirname "$0")" && pwd); work=$1; out=$2; shift 2
PY=${BLENDER_PY:-/home/claude/ext/humans/venv/bin/python}
names=${@:-$(python3 -c "import json;print(' '.join(json.load(open('$here/specs.json'))))")}
mkdir -p "$work" "$out"
for n in $names; do
  nice -n 10 $PY "$here/gen.py" "$here/specs.json" $n "$work" 2>&1 | grep "^body under\|^body faces\|^{'name\|Error\|rror:\|fallback\|missing asset"
  [ -f "$work/${n}_raw.glb" ] && nice -n 10 node "$here/post.mjs" "$work/${n}_raw.glb" "$out/$n.glb" 10000 2>&1 | grep "^{\|rror"
done
# [ch4] then, on the installed files, in this order (see each tool's header):
#   node tools/chars_lod.mjs --level mid --tris 4600 <out>/*.glb; ... --level lod --tris 2200 ...; ... --level far --tris 700 ...
#   node tools/humans/reskin.mjs <out>/*.glb      unweighted vertices, the back cloak, skin under the kirtle, apron/belt/straps on the kirtle
#   node tools/assets_pack.mjs --only chars
