/**
 * Exports the home hero's clay objects and cutout from the source PNGs
 * (V01/Hero Objects/, git-ignored) into src/assets/hero/:
 *
 *   <name>.webp   trimmed to its visible pixels, transparent, sized for 2x display
 *   shapes.json   per image: aspect ratio and a simplified convex hull (0..1 of the
 *                 image box), used for the physics bodies and the grab areas
 *
 * Run from the project root after replacing a source file:
 *   node scripts/export-hero-objects.mjs
 *
 * Near-transparent pixels (alpha < 24) are cleared first: some sources carry faint
 * stray marks that would otherwise widen the trim. Edge pixels are also checked for a
 * light fringe (a halo on the dark theme) and reported.
 */
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';

const SRC = 'V01/Hero Objects';
const OUT = 'src/assets/hero';

// Longest side in px: about 2x the largest display. On a full desktop page the wide stage
// shows one unit as about 1px and objects at 1.45x their size in hero-objects.ts, so an
// object shows at up to size x 1.47 px (the snowboard, 176, at about 259px); the cutout at
// about 545px tall (and up to about 570 on the phone stage just under 760px wide).
const FILES = [
  { name: 'liraz-cutout-portrait', longest: 1140, quality: 80 },
  { name: 'obj-bobby', longest: 508 },
  { name: 'obj-statue-of-liberty', longest: 442 },
  { name: 'obj-beret', longest: 330 },
  { name: 'obj-grad-cap', longest: 324 },
  { name: 'obj-laptop', longest: 406 },
  { name: 'obj-running-shoe', longest: 360 },
  { name: 'obj-snowboard', longest: 518 },
  { name: 'obj-passport', longest: 272 },
];
const CLEAR_BELOW = 24;
const HULL_ALPHA = 96; // hull hugs the solid object, not its softest edge
const HULL_POINTS = 12;

function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Visvalingam: drop the vertex whose triangle is smallest until `max` remain.
function simplify(poly, max) {
  const p = [...poly];
  const area = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
  while (p.length > max) {
    let min = Infinity;
    let at = 0;
    for (let i = 0; i < p.length; i++) {
      const a = area(p[(i - 1 + p.length) % p.length], p[i], p[(i + 1) % p.length]);
      if (a < min) {
        min = a;
        at = i;
      }
    }
    p.splice(at, 1);
  }
  return p;
}

await mkdir(OUT, { recursive: true });
const shapes = {};

for (const { name, longest, quality = 80 } of FILES) {
  const { data, info } = await sharp(`${SRC}/${name}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < CLEAR_BELOW) data[i] = 0;

  const cleaned = sharp(data, { raw: info });
  const trimmed = await cleaned.png().toBuffer().then((b) => sharp(b).trim({ threshold: 0 }).png().toBuffer());
  const resized = await sharp(trimmed)
    .resize(longest, longest, { fit: 'inside', withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = resized.info;

  await sharp(resized.data).webp({ quality, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/${name}.webp`);

  // Hull and fringe check on the exported pixels.
  const px = await sharp(resized.data).ensureAlpha().raw().toBuffer();
  const pts = [];
  let edgeLum = 0;
  let edgeN = 0;
  let solidLum = 0;
  let solidN = 0;
  for (let y = 0; y < h; y++) {
    let first = -1;
    let last = -1;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = px[i + 3];
      const lum = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      if (a >= HULL_ALPHA) {
        if (first < 0) first = x;
        last = x;
      }
      if (a > 30 && a < 160) {
        edgeLum += lum;
        edgeN++;
      } else if (a >= 250) {
        solidLum += lum;
        solidN++;
      }
    }
    if (first >= 0) pts.push([first, y], [last + 1, y], [first, y + 1], [last + 1, y + 1]);
  }
  const hull = simplify(convexHull(pts), HULL_POINTS).map(([x, y]) => [+(x / w).toFixed(4), +(y / h).toFixed(4)]);
  shapes[name] = { aspect: +(w / h).toFixed(4), hull };

  const { size } = await import('node:fs/promises').then((fs) => fs.stat(`${OUT}/${name}.webp`));
  const edge = edgeN ? edgeLum / edgeN : 0;
  const solid = solidN ? solidLum / solidN : 0;
  console.log(
    `${name}.webp  ${w}x${h}  ${(size / 1024).toFixed(0)} KB  edge lum ${edge.toFixed(0)} vs solid ${solid.toFixed(0)}${edge - solid > 40 ? '  <- light fringe?' : ''}`,
  );
}

const json = Object.entries(shapes).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
await writeFile(`${OUT}/shapes.json`, `{\n${json.join(',\n')}\n}\n`);
