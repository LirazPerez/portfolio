// Captures Waypoint's case-study stills into <out-dir> as PNGs (then optimized to WebP into
// src/assets/work/waypoint/ by the last step of this script). See the README in that folder.
//
// From the live demo (https://waypoint-app-three.vercel.app, sample data only), 1440 wide,
// light mode unless named: both homes, the medication table,
// one complete medication row per state (at 1024), the accessibility crops and one dark-mode page.
//
// Earlier mobile homes no longer exist in the live app. Build the waypoint-app commits and
// serve each one's dist/ locally, then pass them as HISTORY:
//   HISTORY="153432f=http://localhost:5171,01ce219=http://localhost:5172,..." node capture-waypoint-stills.mjs <out-dir>
// 153432f is the version tested in the first sessions (the case study shows it beside the final
// desktop home). Later builds still carry a floating button that was removed from the product;
// it is hidden in the capture.
//
// Playwright is not a project dependency (see record-waypoint-clips.mjs). Run from a scratch folder.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const OUT = process.argv[2] ?? 'stills';
const ASSETS = process.argv[3]; // optional: src/assets/work/waypoint, to write the WebPs
const APP = 'https://waypoint-app-three.vercel.app';
const NOW = new Date('2026-10-20T09:40:00');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const INIT = (theme) => {
  try {
    localStorage.setItem('waypoint-ask-hint-dismissed', '1');
    localStorage.setItem('waypoint-theme', theme);
  } catch {}
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = `[aria-label^="Nearest "] { display: none !important; }`;
    document.head.appendChild(s);
  });
};

async function open(url, { width = 1440, height = 900, theme = 'light', mobile = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 3 : 2,
    colorScheme: theme,
    isMobile: mobile,
    hasTouch: mobile,
  });
  await context.addInitScript(INIT, theme);
  const page = await context.newPage();
  await page.clock.install({ time: NOW });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.clock.runFor(2000);
  await page.waitForTimeout(600);
  return page;
}
const settle = async (page) => {
  await page.clock.runFor(1500);
  await page.waitForTimeout(500);
};
const shot = (page, name, clip) => page.screenshot({ path: path.join(OUT, `${name}.png`), clip });
const pad = (b, p = 0) => ({ x: b.x - p, y: b.y - p, width: b.width + p * 2, height: b.height + p * 2 });
const nav = (page, name) => page.locator('nav').getByRole('button', { name, exact: true }).first();
const rounded = (loc) => loc.locator('xpath=ancestor::*[contains(@class,"rounded")][1]');

// Homes.
let page = await open(`${APP}/?role=caregiver`);
await shot(page, 'home-caregiver');
await page.context().close();
page = await open(`${APP}/?role=patient`);
await shot(page, 'home-patient');
await page.context().close();

// The medication table, one crop per state, the accessibility crops.
page = await open(`${APP}/?role=caregiver`);
const glance = await rounded(page.getByText('Ilan at a glance')).boundingBox();
await shot(page, 'a11y-status', pad(glance, 6));
// Keyboard: tab from the top of the page to the third item of the sidebar, focus ring visible.
for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
await settle(page);
const sidebar = await page.locator('nav').first().boundingBox();
const add = await page.getByRole('button', { name: '+ Add record' }).first().boundingBox();
await shot(page, 'a11y-keyboard', { x: 0, y: add.y - 16, width: sidebar.x + sidebar.width + 8, height: 330 });
await nav(page, 'Medical record').click();
await settle(page);
const tableCard = await rounded(page.locator('table').first()).boundingBox();
await shot(page, 'record-table', pad(tableCard, 6));
// Escape closes every dialog: the document viewer, with its close button.
await page.locator('tr', { hasText: 'Gabapentin' }).first().getByRole('button', { name: /Open source document/ }).click();
await settle(page);
const dialog = await page.getByRole('dialog').first().boundingBox();
// Its top-right corner: the title's end, the close button and the details beside the document.
await shot(page, 'a11y-dialog', { x: dialog.x + dialog.width - 520, y: dialog.y, width: 520, height: 300 });
await page.keyboard.press('Escape');
await settle(page);
await page.context().close();

// Dark mode.
page = await open(`${APP}/?role=caregiver`, { theme: 'dark' });
await nav(page, 'Medical record').click();
await settle(page);
await shot(page, 'record-dark');
await page.context().close();

// One medication row in each state, complete (every column, nothing cut at the edges). At
// 1024, where the desktop layout starts, the whole table fits, so a row reads about 1:1 in
// the case study's text column.
page = await open(`${APP}/?role=caregiver`, { width: 1024, height: 800 });
await nav(page, 'Medical record').click();
await settle(page);
const states = [
  ['state-needs-check', 'Gabapentin'],
  ['state-confirmed', 'Levothyroxine'],
  ['state-stopped', 'Tramadol'],
  ['state-completed', 'Cefazolin'],
];
for (const [name, med] of states) {
  const row = await page.locator('tr', { hasText: med }).first().boundingBox();
  await shot(page, name, { x: row.x, y: row.y, width: row.width, height: row.height });
}
await page.context().close();

// Earlier mobile homes, from local builds of the waypoint-app history.
for (const pair of (process.env.HISTORY ?? '').split(',').filter(Boolean)) {
  const [commit, base] = pair.split('=');
  const query = ['153432f', '01ce219'].includes(commit) ? '' : '?role=caregiver';
  page = await open(`${base}/${query}`, { width: 390, height: 844, mobile: true });
  await shot(page, `mobile-${commit}`);
  await page.context().close();
}
await browser.close();

// Optimize: WebP at 2x of the largest size the page shows each one.
if (ASSETS) {
  const require = createRequire(path.resolve(ASSETS, '../../../../package.json'));
  const sharp = require('sharp');
  for (const file of fs.readdirSync(OUT).filter((f) => f.endsWith('.png'))) {
    const name = file.replace(/\.png$/, '');
    const meta = await sharp(path.join(OUT, file)).metadata();
    const max = name.startsWith('mobile-') ? 780 : 2000;
    await sharp(path.join(OUT, file))
      .resize({ width: Math.min(max, meta.width), withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(ASSETS, `${name}.webp`));
  }
}
