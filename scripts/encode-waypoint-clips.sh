#!/bin/sh
# Encodes clips recorded by record-waypoint-clips.mjs into src/assets/work/waypoint/.
# Usage: scripts/encode-waypoint-clips.sh <frames-dir> <clip> <poster-frame> [out-dir] [out-name]
# (out-dir defaults to src/assets/work/waypoint; out-name to the clip's name.)
#
# Every clip ends in the state it starts in (record-waypoint-clips.mjs), so the loop is a plain
# cut: no crossfade, no frame where two screens overlap.
# The poster is the clip's key moment (what reduced motion and no JS show).
set -e
IN="$1/$2"
OUT="${4:-$(dirname "$0")/../src/assets/work/waypoint}"
NAME="${5:-$2}"
VF="scale=1600:1000:flags=lanczos"
ffmpeg -nostdin -y -loglevel error -framerate 30 -i "$IN/%05d.jpg" -vf "$VF,format=yuv420p" \
  -c:v libx264 -preset veryslow -crf 22 -tune animation -movflags +faststart -an "$OUT/$NAME.mp4"
ffmpeg -nostdin -y -loglevel error -framerate 30 -i "$IN/%05d.jpg" -vf "$VF" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p -an "$OUT/$NAME.webm"
# The poster through sharp (the project's own image library; this ffmpeg has no WebP encoder).
node -e "require('sharp')(process.argv[1]).resize(1600, 1000, { kernel: 'lanczos3' }).webp({ quality: 82 }).toFile(process.argv[2])" \
  "$IN/$(printf %05d "$3").jpg" "$OUT/$NAME-poster.webp"
ls -la "$OUT/$NAME".* "$OUT/$NAME-poster.webp"
