#!/bin/sh
# Renders the contact sheets of every kit piece. usage: test/kit_sheets.sh [out dir] [skin]
OUT=${1:-/home/claude/shots/D}; SKIN=${2:-painted}; cd "$(dirname "$0")/.."
sheet() { # name cats [flip]
  pages=$(node test/shot.mjs --size 1680x1250 --page /test/kit_sheet.html --opt webgl=1 --opt skin=$SKIN --opt cat=$2 ${3:+--opt flip=1} --do "return window.__sheet.pages" --out "$OUT/sheet_$1.png" 2>&1 | sed -n 's/.*-> \([0-9]*\) .*/\1/p')
  p=1; while [ "$p" -lt "${pages:-1}" ]; do node test/shot.mjs --size 1680x1250 --page /test/kit_sheet.html --opt webgl=1 --opt skin=$SKIN --opt cat=$2 --opt page=$p ${3:+--opt flip=1} --out "$OUT/sheet_$1_$((p+1)).png" >/dev/null 2>&1; p=$((p+1)); done
  echo "sheet_$1 pages=${pages:-?}"
}
sheet village_walls wall,wall-door,wall-window,corner
sheet village_walls_back wall,wall-door,wall-window,corner flip
sheet village_openings door,doorframe,window,shutter
sheet village_floors floor
sheet village_roofs roof
sheet village_roofparts roof-part
sheet village_overhangs overhang
sheet village_stairs stair-interior,stair-exterior
sheet village_extras balcony,fence,chimney,vine,prop-exterior
sheet props_furniture prop-furniture
sheet props_containers prop-container
sheet props_small prop-small
sheet props_lights_weapons light-source,prop-weapon,prop-banner
sheet nature_trees tree
sheet nature_rocks rock,rock-small
sheet nature_plants plant,grass,bush
