// Records Waypoint's case-study clips from the live demo (https://waypoint-app-three.vercel.app,
// sample data only: patient Ilan, caregiver Dana). See the README in src/assets/work/waypoint/.
//
//   flow       A · hero: caregiver home → "Check medications are still correct" → the record with
//                the two medications to check → Gabapentin's source document, Hebrew original
//                beside the English translation → closed → back to the home. Also Waypoint's
//                coming-soon stage clip.
//   roles      B · the welcome screen, "I'm caring for someone", Dana's home; then Patient in
//                Profile, and Ilan's home.
//   confirm    C · in the record, Confirm next to Gabapentin → Confirmed → home: one medication
//                left to check, the confirmation at the top of Recent activity → back to the record.
//   source     D · Gabapentin's source → the document → Gabapentin under "Supports these
//                records" → back to the row in the record, highlighted, until the tint fades.
//   clinician  E · Ilan's profile → My code → a drawn viewfinder closes in on the code → the
//                one-screen view a clinician sees, alerts first → closed → back to the profile.
//
// Every clip ends in the state it starts in, so it loops with a plain cut. Two can't fully:
// the app has no way back to the welcome screen (B) and no undo for a confirmation (C), so
// those return to the same page and the cut resets only that.
//
// The same engine as record-aeropulse-clips.mjs: a 1440x900 light-mode viewport, every frame
// captured through a virtual camera (16:10, re-rendered at 2400px wide so zooms stay sharp),
// a cursor drawn in the DOM that moves slowly on eased arcs (the real mouse follows it, so
// hover states match the drawing), and a short pause after every click. Each clip starts in
// a fresh browser context (clean sample data, no stored role). The page's clock is faked and
// advanced one frame at a time, so the app's own timers (the highlight on a row, the flight
// date) run on video time, not capture time.
//
// Playwright is not a project dependency. In a scratch folder:
//   npm i playwright && npx playwright install chromium
//   node /path/to/record-waypoint-clips.mjs <out-dir> [clip ...]
// It writes <out-dir>/<clip>/00000.jpg ... Then encode each clip (encode-waypoint-clips.sh).
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] ?? 'clips';
const only = process.argv.slice(3);
const APP = 'https://waypoint-app-three.vercel.app';
const VW = 1440;
const VH = 900;
const CAPTURE_W = 2400;
const FPS = 30;
const DT = 1000 / FPS;
// A Tuesday morning, so every clip says "Good morning" and shows the same week.
const NOW = new Date('2026-10-20T09:40:00');

const browser = await chromium.launch();

const INIT = () => {
  try {
    localStorage.setItem('waypoint-ask-hint-dismissed', '1');
    localStorage.setItem('waypoint-theme', 'light');
  } catch {}
  const css = `
    #rec-finder { position: fixed; left: 0; top: 0; z-index: 2147483645; pointer-events: none; opacity: 0; }
    #rec-finder i { position: absolute; width: 22%; height: 22%; border: 0 solid #fff; filter: drop-shadow(0 0 1.5px rgb(15 23 42 / 0.7)); }
    #rec-finder i:nth-child(1) { left: 0; top: 0; border-width: 4px 0 0 4px; border-top-left-radius: 10px; }
    #rec-finder i:nth-child(2) { right: 0; top: 0; border-width: 4px 4px 0 0; border-top-right-radius: 10px; }
    #rec-finder i:nth-child(3) { left: 0; bottom: 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 10px; }
    #rec-finder i:nth-child(4) { right: 0; bottom: 0; border-width: 0 4px 4px 0; border-bottom-right-radius: 10px; }
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
  // A camera-style viewfinder: four corner brackets, drawn for the scan moment in clip E.
  window.__finder = (x, y, w, h, o) => {
    install();
    let f = document.getElementById('rec-finder');
    if (!f) {
      f = document.createElement('div');
      f.id = 'rec-finder';
      f.innerHTML = '<i></i><i></i><i></i><i></i>';
      document.body.appendChild(f);
    }
    Object.assign(f.style, { transform: `translate(${x}px, ${y}px)`, width: `${w}px`, height: `${h}px`, opacity: String(o) });
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
};

// ---------- Engine ----------
let page;
let cdp;
let dir = '';
let frame = 0;
let t = 0;
let pos = { x: 0, y: 0 };
let cam = { x: VW / 2, y: VH / 2, w: VW };
let lastClick = null;

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const lerp = (a, b, u) => a + (b - a) * u;

function clampCam(c) {
  const w = Math.min(VW, Math.max(320, c.w));
  const h = (w * VH) / VW;
  return { w, x: Math.min(VW - w / 2, Math.max(w / 2, c.x)), y: Math.min(VH - h / 2, Math.max(h / 2, c.y)) };
}
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
  await page.clock.runFor(DT);
}

async function rest(ms) {
  const n = Math.round(ms / DT);
  for (let i = 0; i < n; i++) await shoot();
}

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
    const w = Math.exp(lerp(Math.log(cam0.w), Math.log(cam1.w), u));
    cam = { x: lerp(cam0.x, cam1.x, u), y: lerp(cam0.y, cam1.y, u), w };
    await shoot();
  }
  // The real mouse follows the drawn one, so hover states match it (and match again at the
  // loop point, where the cursor is back at its start).
  if (to) await page.mouse.move(pos.x, pos.y);
}

/** Clicks where the cursor is. CSS transitions play at real speed while the page settles. */
async function click(settle = 600) {
  lastClick = { t, x: pos.x, y: pos.y };
  await page.mouse.move(pos.x, pos.y);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.mouse.down();
  await page.mouse.up();
  await page.clock.runFor(50);
  await page.waitForTimeout(settle);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.18 });
}

const box = async (locator) => {
  const b = await locator.boundingBox();
  if (!b) throw new Error('no box for ' + locator);
  return b;
};
const center = async (locator, dx = 0, dy = 0) => {
  const b = await box(locator);
  return { x: b.x + b.width / 2 + dx, y: b.y + b.height / 2 + dy };
};
const union = (...rs) => {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, width: Math.max(...rs.map((r) => r.x + r.width)) - x, height: Math.max(...rs.map((r) => r.y + r.height)) - y };
};
const nav = (name) => page.locator('nav').getByRole('button', { name, exact: true }).first();

async function record(name, path, start, prep, scene) {
  if (only.length && !only.includes(name)) return;
  dir = `${OUT}/${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  frame = 0;
  t = 0;
  lastClick = null;
  cam = { ...WIDE };
  const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'no-preference' });
  await context.addInitScript(INIT);
  page = await context.newPage();
  await page.clock.install({ time: NOW });
  cdp = await context.newCDPSession(page);
  await page.goto(APP + path, { waitUntil: 'networkidle' });
  await page.clock.runFor(1500);
  await page.waitForTimeout(800);
  if (prep) await prep();
  await page.clock.runFor(1500);
  await page.waitForTimeout(600);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.18 });
  pos = { ...start };
  await page.mouse.move(pos.x, pos.y);
  await page.clock.runFor(300);
  await scene();
  console.log(name, 'frames', frame, 'seconds', (frame / FPS).toFixed(2));
  await context.close();
}

const CAREGIVER = '/?role=caregiver';
const table = () => page.locator('table').first();
const medRow = (name) => page.locator('tr', { hasText: name }).first();
const openRecord = async () => {
  await nav('Medical record').click();
};

// ---------- A · hero ----------
await record('flow', CAREGIVER, { x: 760, y: 560 }, null, async () => {
  const start = { ...pos };
  await rest(500);
  await tween(1000, { to: await center(page.getByRole('button', { name: /Check medications are still correct/ }), -60, 6) });
  await rest(150);
  await click();
  await rest(300);
  // The record, on the two medications to check.
  const rows = union(await box(medRow('Gabapentin')), await box(medRow('Omeprazole')), await box(table().locator('thead')));
  await tween(1000, { camTo: frameRect(rows, 30), to: await center(medRow('Gabapentin').getByText('Needs check'), 20, 14) });
  await rest(900);
  // Out to the whole page and on to Gabapentin's source.
  const source = medRow('Gabapentin').getByRole('button', { name: /Open source document/ });
  await tween(1000, { camTo: WIDE, to: await center(source, 0, 6), bend: 0.06 });
  await rest(150);
  await click(800);
  await rest(300);
  // The document: the Hebrew original beside the English translation.
  const dialog = page.getByRole('dialog').first();
  const card = (text) => dialog.getByText(text).first().locator('xpath=ancestor::*[contains(@class,"rounded")][1]');
  const original = await box(dialog.getByText('Original · Hebrew').first());
  const english = await box(card('Prescription Renewal with Dose Change'));
  await tween(1000, { camTo: frameRect(union(original, english), 28), to: { x: english.x + english.width - 90, y: english.y + english.height - 26 } });
  await rest(1300);
  // Close it, and back to the home the clip started on.
  const close = dialog.getByRole('button', { name: 'Close' }).first();
  await tween(900, { camTo: WIDE, to: await center(close, 2, 4), bend: -0.08 });
  await rest(100);
  await click(500);
  await tween(800, { to: await center(nav('Home'), -20, 4), bend: 0.1 });
  await rest(100);
  await click(900);
  await tween(800, { to: start, bend: -0.1 });
  lastClick = null;
  await rest(400);
});

// ---------- B · two roles ----------
await record('roles', '/', { x: 900, y: 520 }, null, async () => {
  const start = { ...pos };
  // Close on the welcome question, then out to the whole home once a role is chosen.
  const patient = page.getByText("I'm the patient").locator('xpath=ancestor::button[1]');
  const caring = page.getByText("I'm caring for someone").locator('xpath=ancestor::button[1]');
  const question = await box(page.getByText('Who’s using Waypoint?').or(page.getByText("Who's using Waypoint?")).first());
  const welcome = clampCam(frameRect(union(question, await box(patient), await box(caring)), 90));
  cam = { ...welcome };
  await rest(800);
  await tween(900, { to: await center(page.getByText("I'm caring for someone"), 40, 6) });
  await rest(150);
  await click();
  await tween(800, { camTo: WIDE });
  await rest(900);
  await tween(1000, { to: await center(page.getByRole('button', { name: /Open your profile/ }), 0, 4), bend: -0.1 });
  await rest(150);
  await click();
  await rest(300);
  await tween(800, { to: await center(page.getByRole('radio', { name: 'Patient', exact: true }), 4, 6) });
  await rest(150);
  await click();
  await rest(500);
  await tween(900, { to: await center(nav('Home'), -20, 4), bend: 0.08 });
  await rest(150);
  await click();
  await rest(1500);
  // The app has no way back to the welcome screen: the loop cuts back to it from here,
  // with the cursor and the camera already where the clip starts.
  await tween(900, { to: start, camTo: welcome });
  lastClick = null;
  await rest(300);
});

// ---------- C · confirming a medication ----------
await record('confirm', CAREGIVER, { x: 760, y: 640 }, openRecord, async () => {
  const start = { ...pos };
  await rest(600);
  const confirm = medRow('Gabapentin').getByRole('button', { name: /Confirm Gabapentin/ });
  const rows = union(await box(medRow('Gabapentin')), await box(medRow('Omeprazole')), await box(table().locator('thead')));
  await tween(1100, { camTo: frameRect(rows, 30), to: await center(confirm, 6, 6) });
  await rest(200);
  await click();
  await rest(1100);
  await tween(1000, { camTo: WIDE, to: await center(nav('Home'), -20, 4), bend: 0.1 });
  await rest(150);
  await click();
  await rest(200);
  // Home: the counter, the checklist and the activity log all moved.
  const rounded = (text) => page.getByText(text).first().locator('xpath=ancestor::*[contains(@class,"rounded")][1]');
  const tile = await box(rounded('Active medications'));
  const firstRow = await box(page.locator('tbody tr').first());
  const tp = await box(page.getByText(/needs? checking/).first());
  await tween(1000, { camTo: frameRect(union(tile, firstRow), 24), to: { x: tp.x + tp.width + 14, y: tp.y + tp.height / 2 + 8 } });
  await rest(700);
  await tween(900, { to: { x: firstRow.x + firstRow.width - 70, y: firstRow.y + firstRow.height / 2 + 10 }, bend: -0.06 });
  await rest(1000);
  // Back to the record the clip started on (the confirmation stays: the app has no undo).
  await tween(1000, { camTo: WIDE, to: await center(nav('Medical record'), -30, 4), bend: 0.08 });
  await rest(150);
  await click(900);
  await tween(800, { to: start, bend: -0.1 });
  lastClick = null;
  await rest(400);
});

// ---------- D · document and source ----------
await record('source', CAREGIVER, { x: 760, y: 640 }, openRecord, async () => {
  const start = { ...pos };
  await rest(600);
  const source = medRow('Gabapentin').getByRole('button', { name: /Open source document/ });
  await tween(1000, { to: await center(source, 0, 6) });
  await rest(150);
  await click(800);
  const dialog = page.getByRole('dialog').first();
  const original = await box(dialog.getByText('Original · Hebrew').first());
  const supports = dialog.getByRole('button', { name: /Gabapentin 300mg/ });
  const sup = await box(supports);
  await tween(1200, { camTo: frameRect(union(original, sup), 24), to: { x: original.x + 520, y: original.y + 150 } });
  await rest(1100);
  await tween(800, { to: { x: sup.x + 60, y: sup.y + sup.height / 2 + 6 }, bend: 0.08 });
  await rest(200);
  await click(500);
  // Back in the record, on Gabapentin's row, tinted for a moment.
  const row = medRow('Gabapentin');
  const cells = row.locator('td');
  const rowBox = union(await box(cells.nth(0)), await box(cells.nth(4)), await box(table().locator('thead th').first()));
  const name = await box(row.getByText('Gabapentin', { exact: true }));
  await tween(1000, { camTo: frameRect(rowBox, 40), to: { x: name.x + name.width + 18, y: name.y + name.height / 2 + 8 } });
  await rest(1300);
  // Out, and the tint fades (2.6 s after the click): the record as the clip started.
  await tween(1000, { camTo: WIDE, to: start, bend: -0.08 });
  lastClick = null;
  await rest(700);
});

// ---------- E · the clinician view ----------
const openProfile = async () => {
  await page.getByRole('button', { name: /profile/i }).first().click();
};
await record('clinician', '/?role=patient', { x: 760, y: 600 }, openProfile, async () => {
  const start = { ...pos };
  await rest(400);
  await tween(800, { to: await center(page.getByRole('button', { name: 'My code', exact: true }).first(), -20, 4) });
  await rest(100);
  await click(500);
  // The code on screen, then a viewfinder closes in on it: the scan.
  const qr = await box(page.locator('[aria-label^="QR code"]').first());
  const dialogBox = await box(page.getByRole('dialog').first());
  await tween(700, { camTo: frameRect(dialogBox, 30), to: { x: dialogBox.x + dialogBox.width + 60, y: dialogBox.y + dialogBox.height - 40 } });
  const n = Math.round(800 / DT);
  for (let i = 1; i <= n; i++) {
    const u = ease(i / n);
    const grow = lerp(150, 8, u);
    await page.evaluate(([x, y, w, h, o]) => window.__finder(x, y, w, h, o), [qr.x - grow, qr.y - grow, qr.width + grow * 2, qr.height + grow * 2, Math.min(1, i / (n * 0.3))]);
    await shoot();
  }
  await rest(250);
  // The view opens on the scan (no cursor click), alerts first.
  await page.evaluate(() => window.__finder(0, 0, 0, 0, 0));
  await page.getByText(/See what a doctor sees/).click();
  await page.clock.runFor(300);
  await page.waitForTimeout(500);
  cam = { ...WIDE };
  const alerts = await box(page.getByText('Alerts: read first').first().locator('xpath=..'));
  const head = await box(page.getByText('Age 63').first());
  await tween(800, { camTo: frameRect(union(alerts, head), 28) });
  await rest(1300);
  // Close the view and the code: back on the profile.
  const closeView = page.getByText('Close preview').first();
  await tween(800, { camTo: WIDE, to: await center(closeView, 0, 4) });
  await rest(100);
  await click(500);
  const closeCode = page.getByRole('dialog').first().getByRole('button', { name: 'Close' }).first();
  await tween(500, { to: await center(closeCode, 0, 3) });
  await rest(100);
  await click(500);
  await tween(700, { to: start, bend: -0.1 });
  lastClick = null;
  await rest(300);
});

await browser.close();
