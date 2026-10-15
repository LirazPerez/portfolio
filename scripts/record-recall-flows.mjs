// Records the three Recall flows in src/assets/work/recall/ (capture, browse, ask) from the
// live prototype. See the README in that folder for what each one shows.
//
// Frame by frame, like record-aeropulse-flow.mjs: a 390x844 phone viewport at device scale 3,
// one screenshot per 1/30 s, with the page's CSS animations slowed to the capture speed so
// sheets and transitions still move at their real pace in the video. Taps are real touch
// events; the only thing drawn on top is the tap indicator (a soft ring where the finger lands).
// The prototype's "Concept prototype ... Not affiliated with Google" strip is hidden and its
// height kept as a plain status-bar band; the site says the same thing under the hero.
//
// Every place photo on screen must have loaded before a frame is taken. If one fails, the run
// stops with an error instead of recording a placeholder.
//
// Playwright is not a project dependency. In a scratch folder:
//   npm i playwright && npx playwright install chromium
//   cp /path/to/record-recall-flows.mjs . && node record-recall-flows.mjs frames [capture|browse|ask]
// Then encode each flow, with a 0.4 s cross-dissolve back to frame 0 so it loops (N = frame count):
//   F=frames/capture; OFF=$(echo "scale=4; N/30 - 0.4" | bc)
//   FC="[0:v]scale=780:1688:flags=lanczos,setsar=1,fps=30[a];[1:v]scale=780:1688:flags=lanczos,setsar=1,fps=30,trim=duration=0.5[b];[a][b]xfade=transition=fade:duration=0.4:offset=$OFF,format=yuv420p[v]"
//   ffmpeg -framerate 30 -i $F/%05d.jpg -loop 1 -framerate 30 -i $F/00000.jpg -filter_complex "$FC" -map "[v]" \
//     -c:v libx264 -preset veryslow -crf 18 -tune animation -movflags +faststart -an capture.mp4
//   (same for .webm with -c:v libvpx-vp9 -crf 30 -b:v 0 -row-mt 1)
// Posters are each flow's key frame (frames 140, 190 and 262 in the current takes), resized to
// 780x1688 and saved as WebP.
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] ?? 'frames';
const ONLY = process.argv[3];
const URL = 'https://google-maps-recall-2.vercel.app';
const FPS = 30;
const DT = 1000 / FPS;

const browser = await chromium.launch();

async function setup(name) {
  const dir = `${OUT}/${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(() => {
    const css = `
      aside[aria-label="About this prototype"] { visibility: hidden; height: 47px; padding: 0 !important; }
      div:has(> aside[aria-label="About this prototype"]) { background: #fff !important; }
      #rec-ring { position: fixed; left: 0; top: 0; z-index: 2147483647; pointer-events: none; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: rgb(32 33 36 / 0.14); border: 2px solid rgb(32 33 36 / 0.32); opacity: 0; }
    `;
    const install = () => {
      if (document.getElementById('rec-ring')) return;
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      const ring = document.createElement('div');
      ring.id = 'rec-ring';
      document.body.appendChild(ring);
    };
    document.addEventListener('DOMContentLoaded', install);
    // ringT: 0..1 over the life of one tap (press, hold, lift and fade). Outside that, hidden.
    window.__ring = (ringT, x, y) => {
      install();
      const ring = document.getElementById('rec-ring');
      if (ringT < 0 || ringT > 1) {
        ring.style.opacity = '0';
        return;
      }
      const press = Math.min(1, ringT / 0.18);
      const fade = ringT < 0.45 ? 1 : 1 - (ringT - 0.45) / 0.55;
      const scale = 0.55 + 0.45 * (1 - Math.pow(1 - press, 3)) + (ringT > 0.45 ? 0.35 * (ringT - 0.45) / 0.55 : 0);
      ring.style.opacity = String(fade);
      ring.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };
  });
  // The page's own timers (the Ask field types its example question on an interval) follow the
  // video clock, not the wall clock: each frame advances them by exactly 1/30 s.
  await context.clock.install();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  return { dir, context, page, cdp };
}

async function recordFlow(name, script) {
  const { dir, context, page, cdp } = await setup(name);
  // Visit every screen with photos first, so each one is already loaded (and cached) when it
  // first appears on camera, instead of fading in from its placeholder.
  for (const path of ['/place/sauced', '/saved']) {
    await page.goto(URL + path, { waitUntil: 'networkidle' });
    await context.clock.runFor(1500);
    await photosLoaded(page);
  }
  await page.goto(URL, { waitUntil: 'networkidle' });
  await context.clock.runFor(1500);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__ring(-1, 0, 0));
  await photosLoaded(page);

  // How long one 3x screenshot really takes: CSS animations run at DT / that, so a transition
  // spans as many frames as it lasts at normal speed.
  const t0 = Date.now();
  for (let i = 0; i < 5; i++) await page.screenshot({ type: 'jpeg', quality: 92 });
  const shotMs = (Date.now() - t0) / 5;
  const rate = Math.min(1, DT / shotMs);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: rate });

  let frame = 0;
  let t = 0;
  let tap = null; // { t, x, y }
  const TAP_MS = 620;

  const shoot = async () => {
    const ringT = tap ? (t - tap.t) / TAP_MS : -1;
    await context.clock.runFor(DT);
    await page.evaluate(([r, x, y]) => window.__ring(r, x, y), [ringT, tap?.x ?? 0, tap?.y ?? 0]);
    await page.screenshot({ path: `${dir}/${String(frame).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    frame++;
    t += DT;
  };
  const rest = async (ms) => {
    const n = Math.round(ms / DT);
    for (let i = 0; i < n; i++) await shoot();
  };
  const point = async (locator, dx = 0, dy = 0) => {
    const b = await locator.boundingBox();
    if (!b) throw new Error(`${name}: nothing to tap for ${locator}`);
    return { x: b.x + b.width / 2 + dx, y: b.y + b.height / 2 + dy };
  };
  // A tap: the ring presses in for a few frames, the touch lands, then the page answers and
  // the ring lifts while the result plays out.
  const tapAt = async ({ x, y }, after = 900) => {
    tap = { t, x, y };
    await rest(110);
    await page.touchscreen.tap(x, y);
    await page.waitForLoadState('networkidle').catch(() => {});
    await photosLoaded(page);
    await rest(after);
  };
  await script({ page, rest, tapAt, point });

  await context.close();
  console.log(name, 'frames', frame, 'seconds', (frame / FPS).toFixed(2), 'shot ms', shotMs.toFixed(0));
}

// Every <img> on screen has a real photo, or the run stops.
async function photosLoaded(page) {
  // decode() resolves once the photo is loaded and ready to paint, and rejects if it fails.
  // (The page's timers are frozen between frames, so the 20 s limit runs here, in Node.)
  const check = page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((i) => i.getBoundingClientRect().width > 0)
        .map((i) => i.decode().then(() => null, () => (i.naturalWidth > 0 ? null : i.src))),
    ).then((list) => list.filter(Boolean)),
  );
  const broken = await Promise.race([
    check,
    new Promise((_, reject) => setTimeout(() => reject(new Error('photos still loading after 20 s')), 20000)),
  ]);
  if (broken.length) throw new Error(`photo failed to load: ${broken.join(', ')}`);
}

const flows = {
  // Map → a place that isn't saved yet (Sauced) → Save → the three AI tags → Done.
  capture: async ({ page, rest, tapAt, point }) => {
    await rest(1000);
    await tapAt(await point(page.locator('a', { hasText: 'Sauced' }).first(), 0, -6), 1800);
    await tapAt(await point(page.getByRole('button', { name: /Save/ }).first()), 3000);
    await tapAt(await point(page.getByRole('button', { name: 'Done' })), 1000);
  },
  // Map → Saved tab → Vibe → Date Night → the grid narrows → rest.
  browse: async ({ page, rest, tapAt, point }) => {
    await rest(600);
    await tapAt(await point(page.locator('a', { hasText: 'Save' }).last()), 1300);
    await tapAt(await point(page.getByRole('button', { name: /Vibe/ })), 900);
    await tapAt(await point(page.locator('button').filter({ hasText: /^\s*Date Night\s*$/ }).first()), 1300);
    await tapAt(await point(page.getByRole('button', { name: /^Vibe · 1/ }), -14), 2200);
  },
  // Map → Ask Maps → tap the field: the prototype types its example question letter by letter
  // (its own animation, 26 ms a letter; the demo answers that one question) → send →
  // Show results on map → Your pins.
  ask: async ({ page, rest, tapAt, point }) => {
    await rest(600);
    await tapAt(await point(page.getByRole('button', { name: /Ask Maps/ })), 800);
    await tapAt(await point(page.locator('input')), 2900);
    await tapAt(await point(page.getByRole('button', { name: 'send' }).last()), 1300);
    await tapAt(await point(page.getByRole('button', { name: 'Show results on map' })), 1300);
    await tapAt(await point(page.getByRole('button', { name: 'Your pins' })), 1700);
  },
};

for (const [name, script] of Object.entries(flows)) {
  if (ONLY && ONLY !== name) continue;
  await recordFlow(name, script);
}
await browser.close();
