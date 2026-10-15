// Records src/assets/work/aeropulse/flow.* from the live app (see the README in that folder).
// Frame by frame: one 2x screenshot per 1/30 s, cursor drawn in the DOM, and the app settles
// fully after each click (at normal speed), so nothing drops and charts are never mid-draw.
// READ-ONLY: only navigation links, a row's expand arrow, the photo thumbnail and the
// lightbox close are clicked. Never add a click on anything that saves.
//
// Playwright is not a project dependency. In a scratch folder:
//   npm i playwright && npx playwright install chromium
//   node /path/to/record-aeropulse-flow.mjs frames
// Then encode (ffmpeg) and write the poster from frames/00000.jpg:
//   ffmpeg -framerate 30 -i frames/%05d.jpg -vf "scale=1440:900:flags=lanczos,format=yuv420p" \
//     -c:v libx264 -preset veryslow -crf 17 -tune animation -movflags +faststart -an flow.mp4
//   ffmpeg -framerate 30 -i frames/%05d.jpg -vf "scale=1440:900:flags=lanczos" \
//     -c:v libvpx-vp9 -crf 26 -b:v 0 -row-mt 1 -pix_fmt yuv420p -an flow.webm
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] ?? 'frames';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const FPS = 30;
const DT = 1000 / FPS;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await context.addInitScript(() => {
  const css = `
    #base44-edit-badge { display: none !important; }
    #rec-cursor { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none; width: 26px; height: 34px; transform-origin: 2px 2px; will-change: transform; }
    #rec-ring { position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; background: rgb(15 23 42 / 0.16); border: 2px solid rgb(15 23 42 / 0.35); opacity: 0; }
  `;
  const install = () => {
    if (document.getElementById('rec-cursor')) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    const ring = document.createElement('div');
    ring.id = 'rec-ring';
    document.body.appendChild(ring);
    const cur = document.createElement('div');
    cur.id = 'rec-cursor';
    cur.innerHTML =
      '<svg width="26" height="34" viewBox="0 0 26 34"><path d="M2 2 L2 26 L8.2 20.2 L12.6 30.4 L16.6 28.7 L12.3 18.7 L20.8 18.7 Z" fill="#111" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cur);
  };
  window.__rec = (x, y, press, ringT, rx, ry) => {
    install();
    document.getElementById('rec-cursor').style.transform = `translate(${x - 2}px, ${y - 2}px) scale(${press})`;
    const ring = document.getElementById('rec-ring');
    if (ringT >= 0 && ringT <= 1) {
      const e = 1 - Math.pow(1 - ringT, 3);
      ring.style.opacity = String(0.9 * (1 - ringT));
      ring.style.transform = `translate(${rx}px, ${ry}px) scale(${0.35 + e * 0.95})`;
    } else ring.style.opacity = '0';
  };
});

const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.goto('https://aero-pulse-ops.base44.app/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
// Capture runs slower than real time; slow the app's CSS transitions to match.
await cdp.send('Animation.enable');
await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.18 });

let frame = 0;
let pos = { x: 900, y: 60 };
let lastClick = null; // { t, x, y }
let t = 0;

const center = async (locator) => {
  const b = await locator.boundingBox();
  if (!b) throw new Error('no box for ' + locator);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

async function shoot(press = 1) {
  const ringT = lastClick ? (t - lastClick.t) / 480 : -1;
  await page.mouse.move(pos.x, pos.y);
  await page.evaluate(([x, y, p, r, rx, ry]) => window.__rec(x, y, p, r, rx, ry), [
    pos.x, pos.y, press, ringT, lastClick?.x ?? 0, lastClick?.y ?? 0,
  ]);
  await page.screenshot({ path: `${OUT}/${String(frame).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94 });
  frame++;
  t += DT;
}

function pressScale() {
  if (!lastClick) return 1;
  const d = t - lastClick.t;
  return d >= 0 && d < 140 ? 0.86 + 0.14 * (d / 140) : 1;
}

async function rest(ms) {
  const n = Math.round(ms / DT);
  for (let i = 0; i < n; i++) await shoot(pressScale());
}

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

async function move(to, ms, bend = 0.12) {
  const from = { ...pos };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // A gentle arc: one control point pushed sideways from the midpoint.
  const c = { x: from.x + dx / 2 - dy * bend, y: from.y + dy / 2 + dx * bend };
  const n = Math.max(1, Math.round(ms / DT));
  for (let i = 1; i <= n; i++) {
    const u = ease(i / n);
    pos = {
      x: (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * c.x + u * u * to.x,
      y: (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * c.y + u * u * to.y,
    };
    await shoot(pressScale());
  }
}

async function click(settle = 1600) {
  lastClick = { t, x: pos.x, y: pos.y };
  await page.mouse.move(pos.x, pos.y);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(settle);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.18 });
  await page.evaluate(() => Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))));
}

const link = (href) => page.locator(`a[href="${href}"]`).filter({ hasText: /\w/ }).first();
const linkPoint = async (href) => {
  const b = await link(href).boundingBox();
  return { x: b.x + 54, y: b.y + b.height / 2 };
};

const start = { ...pos };

// 1. Dashboard, resting.
await rest(1100);
// 2. Draft Projects.
await move(await linkPoint('/drafts'), 1000);
await rest(220);
await click();
await rest(500);
// Colored Central WH Avail on a short line (Thermal Optic Pod T7: 8 requested, 4 available).
const t7 = page.locator('tr', { hasText: 'Thermal Optic Pod T7' }).first();
const t7cells = t7.locator('td');
const availBox = await t7cells.nth(3).boundingBox();
await move({ x: availBox.x + availBox.width - 9, y: availBox.y + availBox.height / 2 + 11 }, 1050, -0.08);
await rest(1100);
// Transfer From cell, same row.
const from = await center(t7cells.nth(4));
await move({ x: from.x - 30, y: from.y + 3 }, 650, 0.05);
await rest(1000);
// 3. Defect & Maintenance Analysis, rest on the red banner.
await move(await linkPoint('/defects'), 1050, 0.1);
await rest(220);
await click(3500);
await rest(350);
const banner = await center(page.getByText('accounts for 63%', { exact: false }).first());
await move({ x: banner.x + 40, y: banner.y + 6 }, 950, -0.1);
await rest(1500);
// 4. Archive, open FX-88520 with its row arrow.
await move(await linkPoint('/archive'), 1000, 0.1);
await rest(220);
await click();
await rest(350);
const arrow = await center(page.locator('tr', { hasText: 'FX-88520' }).first().locator('td').first().locator('button'));
await move(arrow, 800, -0.12);
await rest(220);
await click(1400);
await rest(550);
// The delivery photo, opened in its lightbox.
const thumb = await center(page.locator('button[title="Delivery Photo"]').first());
await move({ x: thumb.x + 8, y: thumb.y + 10 }, 700, 0.1);
await rest(220);
await click(1800);
await rest(1700);
// Close it with its X (top-right of the overlay).
const close = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.top < 80 && r.left > 1300 && r.width > 0 && b.id !== 'badge-close';
  });
  const r = cands[0]?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
});
if (!close) throw new Error('lightbox close not found');
await move(close, 1050, -0.1);
await rest(220);
await click(1200);
await rest(450);
// 5. Back to the Dashboard and the starting point, so the loop is seamless.
await move(await linkPoint('/'), 1000, 0.08);
await rest(220);
await click(2500);
await move(start, 850, -0.1);
lastClick = null;
// Hold until the last frame matches the first.
await rest(300);

console.log('frames', frame, 'seconds', (frame / FPS).toFixed(2));
await browser.close();
