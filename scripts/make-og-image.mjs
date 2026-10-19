/**
 * Draws the link preview image, public/og.png (1200 x 630), from the site's own font and
 * the clay hero objects in src/assets/hero/. Re-run after changing the name, the line or
 * an object image.
 *
 * Playwright is not a project dependency. In a scratch folder:
 *   npm i playwright && npx playwright install chromium
 *   node /path/to/scripts/make-og-image.mjs
 * (run from that scratch folder, so `playwright` resolves there; sharp comes from the project).
 *
 * Text stays inside the safe area (60px from every edge) so LinkedIn's crop never cuts it.
 */
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fromCwd = createRequire(path.join(process.cwd(), 'noop.js'));
const fromRoot = createRequire(path.join(ROOT, 'noop.js'));
const { chromium } = fromCwd('playwright');
const sharp = fromRoot('sharp');

const W = 1200;
const H = 630;
const OUT = path.join(ROOT, 'public/og.png');

const dataUrl = async (file, type) =>
  `data:${type};base64,${(await readFile(path.join(ROOT, file))).toString('base64')}`;
const font = await dataUrl('node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2', 'font/woff2');
const obj = (name) => dataUrl(`src/assets/hero/obj-${name}.webp`, 'image/webp');

// The heap, hand placed: left/bottom of each object's box and its height, in px; drawn in order.
const HEAP = [
  { name: 'statue-of-liberty', left: 846, bottom: 120, height: 300, rotate: -4 },
  { name: 'laptop', left: 668, bottom: 46, height: 176, rotate: -6 },
  { name: 'running-shoe', left: 848, bottom: 40, height: 112, rotate: 4 },
  { name: 'beret', left: 702, bottom: 196, height: 84, rotate: -12 },
  { name: 'bobby', left: 976, bottom: 40, height: 270, rotate: 2 },
];
const images = await Promise.all(HEAP.map(async (o) => ({ ...o, src: await obj(o.name) })));

const html = `<!doctype html><html><head><style>
  @font-face { font-family: Geist; src: url(${font}) format('woff2'); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; }
  body { position: relative; overflow: hidden; background: #FCFBFD; font-family: Geist; color: #2A2631; }
  .text { position: absolute; left: 88px; top: 0; bottom: 0; width: 600px;
    display: flex; flex-direction: column; justify-content: center; gap: 26px; }
  .rule { width: 72px; height: 5px; border-radius: 999px; background: #89599E; }
  h1 { font-size: 84px; line-height: 1.02; font-weight: 650; letter-spacing: -0.035em; }
  p { font-size: 32px; line-height: 1.3; font-weight: 450; letter-spacing: -0.01em; color: #625C6B; max-width: 520px; }
  .site { font-size: 22px; font-weight: 550; color: #89599E; letter-spacing: -0.005em; }
  img { position: absolute; width: auto; filter: drop-shadow(0 10px 14px rgba(42, 38, 49, .10)); }
</style></head><body>
  <div class="text">
    <div class="rule"></div>
    <h1>Liraz Hazala Perez</h1>
    <p>Product Designer.<br>I design and build products.</p>
    <div class="site">lirazhazala.com</div>
  </div>
  ${images
    .map(
      (o) =>
        `<img src="${o.src}" alt="" style="left:${o.left}px;bottom:${o.bottom}px;height:${o.height}px;transform:rotate(${o.rotate}deg)">`,
    )
    .join('\n  ')}
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot({ type: 'png' });
await browser.close();

const png = await sharp(shot).png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 }).toBuffer();
await writeFile(OUT, png);
console.log(`public/og.png ${W}x${H}, ${Math.round(png.length / 1024)} KB`);
