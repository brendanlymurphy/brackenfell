#!/bin/sh
# Builds every tree in tools/scan/trees.txt (or the names given): prepare, bake, post-process, assemble.
# usage: tools/scan/trees.sh <download dir> <cache dir> [names...]
DL=${1:-/home/claude/ext/scan}; CACHE=${2:-/home/claude/ext/scan/_conv}; shift 2 2>/dev/null
B=tools/scan/_bake
grep -v '^#' tools/scan/trees.txt | while read name pid sel kn kf gain size; do
  [ -z "$name" ] && continue
  if [ $# -gt 0 ]; then case " $* " in *" $name "*) ;; *) continue;; esac; fi
  python3 -I tools/scan/tree_prep.py "$DL" "$pid" "$sel" "$name" $B "$kn" "$kf" | tail -3 || continue
  node tools/scan/tree_bake.mjs "$name" 2>&1 | grep -v 404
  python3 -I tools/scan/tree_post.py $B/"$name" ${gain:-3.2} ${size:-2048}
  node tools/scan/trees.mjs $B "$CACHE" "$name" 2>&1 | grep -v '^prune\|^dedup'
  rm -f $B/"$name"/pos_*.bin $B/"$name"/uv.bin $B/"$name"/idx.bin $B/"$name"/shade.bin
done
# then pack what the game loads (kits/trees.glb, trees_far.webp, TREES.json): see kits/TREES_PROVENANCE.md
# TREE_ATLAS=2048 node tools/scan/tree_pack.mjs "$CACHE" kits fir_b fir_c pine_c broadleaf_small
