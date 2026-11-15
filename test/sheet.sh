#!/bin/sh
# usage: test/sheet.sh out.jpg in1.png in2.png ... : a 2-column contact sheet (viewing many shots in one image)
out=$1; shift; montage "$@" -tile 2x -geometry 844x390+2+2 -quality 82 "$out"
