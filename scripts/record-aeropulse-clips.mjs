// Records the case-study clips from the live AeroPulse demo: the hero flow and one clip per
// key decision (see the README in src/assets/work/aeropulse/). Waypoint's clips have their
// own script, record-waypoint-clips.mjs.
//
// Frame by frame: the app runs in a 1440x900 viewport, and every frame is captured through a
// virtual camera (a rectangle on the page, 16:10). The browser re-renders that rectangle at
// 2400x1500, so text stays sharp at any zoom; the encode scales it to 1600x1000. The cursor is
// drawn in the DOM, so it zooms with the page. Camera and cursor moves are eased.
// READ-ONLY: only navigation links, a row's expand arrow, a photo thumbnail and the lightbox
// close are clicked. Never add a click on anything that saves.
//
// Playwright is not a project dependency. In a scratch folder:
//   npm i playwright && npx playwright install chromium
//   node /path/to/record-aeropulse-clips.mjs <out-dir> [clip ...]
// It writes <out-dir>/<clip>/00000.jpg ... Then encode each clip (see encode-aeropulse-clips.sh).
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] ?? 'clips';
const only = process.argv.slice(3);
const APP = 'https://aero-pulse-ops.base44.app';
const VW = 1440;
const VH = 900;
const CAPTURE_W = 2400;
const FPS = 30;
const DT = 1000 / FPS;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
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

// ---------- Engine ----------
let dir = '';
let frame = 0;
let t = 0;
let pos = { x: 0, y: 0 };
let cam = { x: VW / 2, y: VH / 2, w: VW }; // center and width, in CSS px
let lastClick = null;

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const lerp = (a, b, u) => a + (b - a) * u;

function clampCam(c) {
  const w = Math.min(VW, Math.max(320, c.w));
  const h = (w * VH) / VW;
  return { w, x: Math.min(VW - w / 2, Math.max(w / 2, c.x)), y: Math.min(VH - h / 2, Math.max(h / 2, c.y)) };
}

/** A camera that frames a page rectangle (CSS px), with some margin, kept 16:10. */
function frameRect(r, margin = 40) {
  const w = Math.max(r.width + margin * 2, ((r.height + margin * 2) * VW) / VH);
  return clampCam({ x: r.x + r.width / 2, y: r.y + r.height / 2, w });
}
const WIDE = { x: VW / 2, y: VH / 2, w: VW };

function pressScale() {
  if (!lastClick) return 1;
  const d = t - lastClick.t;
  return d >= 0 && d < 140 ? 0.86 + 0.14 * (d / 140) : 1;
}

async function shoot() {
  const ringT = lastClick ? (t - lastClick.t) / 480 : -1;
  await page.evaluate(([x, y, p, r, rx, ry]) => window.__rec(x, y, p, r, rx, ry), [
    pos.x, pos.y, pressScale(), ringT, lastClick?.x ?? 0, lastClick?.y ?? 0,
  ]);
  const c = clampCam(cam);
  const h = (c.w * VH) / VW;
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 95,
    clip: { x: c.x - c.w / 2, y: c.y - h / 2, width: c.w, height: h, scale: CAPTURE_W / c.w },
  });
  fs.writeFileSync(`${dir}/${String(frame).padStart(5, '0')}.jpg`, Buffer.from(shot.data, 'base64'));
  frame++;
  t += DT;
}

async function rest(ms) {
  const n = Math.round(ms / DT);
  for (let i = 0; i < n; i++) await shoot();
}

/** Moves the cursor (on a gentle arc) and/or the camera together, over `ms`. */
async function tween(ms, { to, camTo, bend = 0.1 } = {}) {
  const from = { ...pos };
  const cam0 = { ...cam };
  const cam1 = camTo ? clampCam(camTo) : cam0;
  const c = to && { x: from.x + (to.x - from.x) / 2 - (to.y - from.y) * bend, y: from.y + (to.y - from.y) / 2 + (to.x - from.x) * bend };
  const n = Math.max(1, Math.round(ms / DT));
  for (let i = 1; i <= n; i++) {
    const u = ease(i / n);
    if (to) {
      pos = {
        x: (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * c.x + u * u * to.x,
        y: (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * c.y + u * u * to.y,
      };
    }
    // Zoom in log space so the zoom speed feels even.
    const w = Math.exp(lerp(Math.log(cam0.w), Math.log(cam1.w), u));
    cam = { x: lerp(cam0.x, cam1.x, u), y: lerp(cam0.y, cam1.y, u), w };
    await shoot();
  }
}

async function click(settle = 1400) {
  lastClick = { t, x: pos.x, y: pos.y };
  await page.mouse.move(pos.x, pos.y);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(settle);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.18 });
  await page.evaluate(() =>
    Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
  );
}

const box = async (locator) => {
  const b = await locator.boundingBox();
  if (!b) throw new Error('no box for ' + locator);
  return b;
};
const center = async (locator) => {
  const b = await box(locator);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
const union = (...rs) => {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, width: Math.max(...rs.map((r) => r.x + r.width)) - x, height: Math.max(...rs.map((r) => r.y + r.height)) - y };
};
const link = (href) => page.locator(`a[href="${href}"]`).filter({ hasText: /\w/ }).first();
const linkPoint = async (href) => {
  const b = await box(link(href));
  return { x: b.x + 54, y: b.y + b.height / 2 };
};

async function open(path) {
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.goto(path.startsWith('http') ? path : APP + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.18 });
}

async function record(name, path, start, scene) {
  if (only.length && !only.includes(name)) return;
  dir = `${OUT}/${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  frame = 0;
  t = 0;
  lastClick = null;
  cam = { ...WIDE };
  await open(path);
  pos = { ...start };
  await scene();
  console.log(name, 'frames', frame, 'seconds', (frame / FPS).toFixed(2));
}

// The line every clip about requests comes back to: 8 Thermal Optic Pods requested, 4 in the
// warehouse, a transfer from another project suggested on the same line.
const t7 = () => page.locator('tr', { hasText: 'Thermal Optic Pod T7' }).first();
// Asset name through Transfer From, column headers included: the request, the check, the offer.
async function requestFrame(margin = 28) {
  const cells = t7().locator('td');
  const ths = page.locator('thead th');
  return frameRect(union(await box(ths.nth(1)), await box(ths.nth(4)), await box(cells.nth(1)), await box(cells.nth(4))), margin);
}

// ---------- Clips ----------

// Hero: a field request, its availability check and the transfer, then the shipment arriving
// with proof. Starts and ends on the same wide frame of Draft Projects.
await record('flow', '/drafts', { x: 760, y: 640 }, async () => {
  const startPos = { ...pos };
  await rest(900);
  const cells = t7().locator('td');
  // Zoom to the request line.
  const avail = await box(cells.nth(3));
  await tween(1400, { to: { x: avail.x + avail.width + 6, y: avail.y + avail.height / 2 + 6 }, camTo: await requestFrame() });
  await rest(1200);
  const from = await box(cells.nth(4).locator('select'));
  await tween(700, { to: { x: from.x + from.width + 10, y: from.y + from.height / 2 + 4 }, bend: 0.05 });
  await rest(1300);
  // Out, and on to the archive, where an arrived shipment carries its proof.
  await tween(1100, { camTo: WIDE, to: await linkPoint('/archive') });
  await rest(150);
  await click();
  await rest(300);
  const r = page.locator('tr', { hasText: 'FX-88520' }).first();
  const arrow = await center(r.locator('td').first().locator('button'));
  await tween(750, { to: arrow, bend: -0.12 });
  await rest(150);
  await click(1300);
  await rest(250);
  const photo = page.locator('button[title="Delivery Photo"]').first();
  const rowBox = await box(r);
  const thumbs = union(await box(photo), await box(photo.locator('xpath=following-sibling::*[1]')));
  const tp = await center(photo);
  await tween(1300, { camTo: frameRect(union({ x: rowBox.x, y: rowBox.y, width: 10, height: rowBox.height }, thumbs), 56), to: { x: tp.x + 8, y: tp.y + 10 } });
  await rest(1600);
  // Collapse the row and come back to the start.
  await tween(1000, { camTo: WIDE, to: arrow, bend: 0.1 });
  await rest(120);
  await click(900);
  await tween(900, { to: await linkPoint('/drafts'), bend: 0.08 });
  await rest(120);
  await click(1500);
  await tween(800, { to: startPos, bend: -0.1 });
  lastClick = null;
  await rest(300);
});

// Decision 1: availability before purchase. Wide, then into the request line.
await record('decision-1-transfer', '/drafts', { x: 760, y: 640 }, async () => {
  const startPos = { ...pos };
  await rest(800);
  const cells = t7().locator('td');
  const req = await box(cells.nth(2));
  await tween(1300, { to: { x: req.x + req.width + 6, y: req.y + req.height / 2 + 6 }, camTo: await requestFrame() });
  await rest(700);
  const avail = await box(cells.nth(3));
  await tween(600, { to: { x: avail.x + avail.width + 6, y: avail.y + avail.height / 2 + 6 }, bend: 0.04 });
  await rest(900);
  const from = await box(cells.nth(4).locator('select'));
  await tween(650, { to: { x: from.x + from.width + 10, y: from.y + from.height / 2 + 4 }, bend: 0.05 });
  await rest(1400);
  await tween(1200, { camTo: WIDE, to: startPos, bend: -0.08 });
  await rest(400);
});

// Decision 2a: a recoverable shortage stays in its row.
await record('decision-2-low-stock', '/cables', { x: 760, y: 640 }, async () => {
  const startPos = { ...pos };
  await rest(800);
  const rows = page.locator('tbody tr');
  const low1 = rows.filter({ hasText: 'Telemetry Ribbon Cable' }).first();
  const low2 = rows.filter({ hasText: 'Ground Station USB-C Link' }).first();
  // Quantity through reorder action: the warning, the threshold, the status, the reorder.
  const ths = page.locator('thead th');
  const area = union(await box(ths.nth(3)), await box(ths.nth(6)), await box(rows.last().locator('td').nth(6)));
  const w1 = await box(low1.locator('td').nth(3));
  await tween(1300, { camTo: frameRect(area, 30), to: { x: w1.x + w1.width - 40, y: w1.y + w1.height - 4 } });
  await rest(900);
  const s2 = await box(low2.locator('td').nth(6).locator('span, div').first());
  await tween(900, { to: { x: s2.x + s2.width + 12, y: s2.y + s2.height / 2 + 6 }, bend: 0.06 });
  await rest(1500);
  await tween(1200, { camTo: WIDE, to: startPos, bend: -0.08 });
  await rest(400);
});

// Decision 2b: an urgent, unexplained pattern goes straight to the evidence. Wide on the full
// page (the chart is whole), then in to the banner and the totals, ending just below them.
await record('decision-2-defects', '/defects', { x: 1010, y: 600 }, async () => {
  const startPos = { ...pos };
  await rest(1000);
  const banner = page.getByText('accounts for 63%', { exact: false }).first();
  const bannerBox = await box(banner.locator('xpath=ancestor::div[contains(@class,"border")][1]'));
  const kpis = await box(page.getByText('High Readiness Impact').first().locator('xpath=ancestor::div[contains(@class,"border")][1]'));
  const bc = await center(banner);
  await tween(1400, { camTo: frameRect(union(bannerBox, kpis), 22), to: { x: bc.x + 60, y: bc.y + 8 } });
  await rest(1100);
  const total = await center(page.getByText('Total Defects').first());
  await tween(800, { to: { x: total.x + 10, y: total.y + 34 }, bend: -0.05 });
  await rest(1300);
  await tween(1200, { camTo: WIDE, to: startPos, bend: 0.08 });
  await rest(500);
});

// Decision 3: arrived means a photo and a bill of lading are attached.
await record('decision-3-proof', '/archive', { x: 900, y: 640 }, async () => {
  const startPos = { ...pos };
  await rest(700);
  const r = page.locator('tr', { hasText: 'FX-88520' }).first();
  const arrow = await center(r.locator('td').first().locator('button'));
  await tween(900, { to: arrow, bend: -0.12 });
  await rest(150);
  await click(1300);
  await rest(250);
  const photo = page.locator('button[title="Delivery Photo"]').first();
  const bolLoc = photo.locator('xpath=following-sibling::*[1]');
  const thumbs = union(await box(photo), await box(bolLoc));
  const rowBox = await box(r);
  // The left of the row (tracking number) and both attachments.
  const left = union({ x: rowBox.x, y: rowBox.y, width: 10, height: rowBox.height }, thumbs);
  const pc = await center(photo);
  await tween(1300, { camTo: frameRect(left, 56), to: { x: pc.x + 8, y: pc.y + 10 } });
  await rest(600);
  const bol = await box(bolLoc);
  await tween(700, { to: { x: bol.x + bol.width / 2 + 8, y: bol.y + bol.height / 2 + 10 }, bend: 0.05 });
  await rest(900);
  // Ease back to the whole row: the proof sits under the status it backs up.
  const pill = await box(r.getByText('Arrived', { exact: true }).first());
  await tween(1200, { camTo: frameRect(union(rowBox, thumbs, pill), 40), to: { x: pill.x + pill.width + 24, y: pill.y + pill.height / 2 + 8 }, bend: -0.04 });
  await rest(1100);
  await tween(1100, { camTo: WIDE, to: arrow, bend: 0.1 });
  await rest(120);
  await click(900);
  await tween(800, { to: startPos, bend: -0.1 });
  lastClick = null;
  await rest(300);
});

await browser.close();
