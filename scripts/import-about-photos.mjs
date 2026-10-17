/**
 * Imports the About page's photos from the archive (git-ignored) into src/assets/about/:
 *
 *   liraz-portrait.webp   from V01/Hero Objects/liraz-portrait-hd.jpg (the opening portrait)
 *   bobby.webp, running.webp, snowboarding.webp, trails.webp
 *                         from V01/About Photos/, any file whose name starts with that word
 *                         (bobby.jpg, Running-2.png, ...). Photos that are not there yet are
 *                         skipped; the page shows a calm placeholder tile for them.
 *
 * Each photo is turned upright (EXIF), scaled down to a sensible master and saved as WebP.
 * Astro then serves it as responsive WebP at the sizes the page asks for. Alt text lives in
 * src/data/about.ts, not here.
 *
 * Run from the project root whenever a photo is added or replaced:
 *   node scripts/import-about-photos.mjs
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const OUT = 'src/assets/about';
const PHOTOS_DIR = 'V01/About Photos';
const PORTRAIT = 'V01/Hero Objects/liraz-portrait-hd.jpg';
// "Off the clock" photos, by name (must match the `photo` names in src/data/about.ts).
const PHOTOS = ['bobby', 'running', 'snowboarding', 'trails'];
const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

// Longest side in px: about 2x the largest display (portrait 220px wide, photo cards ~260px).
async function exportPhoto(src, name, width) {
  const out = join(OUT, `${name}.webp`);
  await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  console.log(`  ${src} -> ${out}`);
}

await mkdir(OUT, { recursive: true });

if (existsSync(PORTRAIT)) await exportPhoto(PORTRAIT, 'liraz-portrait', 880);
else console.log(`  portrait not found at ${PORTRAIT}, kept the current one`);

const files = existsSync(PHOTOS_DIR) ? await readdir(PHOTOS_DIR) : [];
if (!files.length) console.log(`  no photos in ${PHOTOS_DIR} yet`);
for (const name of PHOTOS) {
  const file = files.find((f) => f.toLowerCase().startsWith(name) && IMAGE.has(extname(f).toLowerCase()));
  if (file) await exportPhoto(join(PHOTOS_DIR, file), name, 1040);
  else console.log(`  ${name}: no photo yet (placeholder stays)`);
}
