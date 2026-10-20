#!/bin/sh
# Encodes clips recorded by record-aeropulse-clips.mjs into src/assets/work/aeropulse/.
# Usage: scripts/encode-aeropulse-clips.sh <frames-dir> <clip> <poster-frame>
# The poster is the clip's key moment (what reduced motion and no JS show).
set -e
IN="$1/$2"
OUT="$(dirname "$0")/../src/assets/work/aeropulse"
VF="scale=1600:1000:flags=lanczos"
ffmpeg -nostdin -y -loglevel error -framerate 30 -i "$IN/%05d.jpg" -vf "$VF,format=yuv420p" \
  -c:v libx264 -preset veryslow -crf 22 -tune animation -movflags +faststart -an "$OUT/$2.mp4"
ffmpeg -nostdin -y -loglevel error -framerate 30 -i "$IN/%05d.jpg" -vf "$VF" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p -an "$OUT/$2.webm"
# The poster through sharp (the project's own image library; this ffmpeg has no WebP encoder).
node -e "require('sharp')(process.argv[1]).resize(1600, 1000, { kernel: 'lanczos3' }).webp({ quality: 82 }).toFile(process.argv[2])" \
  "$IN/$(printf %05d "$3").jpg" "$OUT/$2-poster.webp"
ls -la "$OUT/$2".* "$OUT/$2-poster.webp"
