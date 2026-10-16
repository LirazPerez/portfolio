# Neta media

Each file is picked up by name (`workClip` in `src/lib/stage-media.ts` for recordings,
`workScreen` in `src/lib/work-media.ts` for stills and photos); nothing in the components needs
to change when one is replaced.

Sources are in `V01/Neta Media/` (its README describes the demo mode: every app screen uses
synthetic data, no real Apple Health data). The crops match the approved concept,
`reference/neta-concept.html`, cut from the full-size originals and exported as WebP (quality 82).

## Recordings (phones on the home card, the case-study hero and the three moments)

Captured in the iOS Simulator, 590x1282, 30 fps, muted, looping. They already include the
phone's own status bar and Dynamic Island, so they play in the `native` phone variant
(`Phone.astro`), which draws no camera cutout. Copied unchanged from `V01/Neta Media/recordings/`;
posters re-encoded from the JPGs there to WebP.

| Clip | Length | MP4 | WebM | Shows |
|---|---|---|---|---|
| `why` | 6.6 s | 0.71 MB | 0.73 MB | Today on an easy treadmill run → scroll to the why → Read in Hebrew → the right-to-left text |
| `replan` | 8.4 s | 0.64 MB | 0.47 MB | My week → Thursday busy → proposed week with the reason → Approve |
| `pain` | 6.7 s | 0.68 MB | 0.69 MB | Finished run → quick log → knee pain → Save → Thursday's tempo becomes rest |

Each has `<clip>-poster.webp` (its key moment), which reduced motion and no JS show.

## App stills (cropped to one card, from `V01/Neta Media/stills/`, 1206x2622 originals)

| File | Source | Crop (x1, y1, x2, y2) | Used in |
|---|---|---|---|
| `today-hr-cap.webp` | `01-today-easy-treadmill.png` | 48, 779, 1157, 1798 | Decision 1 (the HR cap card) |
| `progress-pace-at-hr-cap.webp` | `07c-progress-pace-at-hr-cap.png` | 48, 371, 1157, 1559 | Decision 1 (the chart card) |
| `settings-shoes.webp` | `14-settings-shoes.png` | 48, 494, 1157, 1553 | Thought of that: shoes |
| `today-make-it-easier.webp` | `16-today-make-it-easier.png` | 48, 717, 1157, 1298 | Thought of that: a bad night |
| `today-missed-run.webp` | `17-today-missed-run.png` | 48, 717, 1157, 1098 | Thought of that: missed run |
| `today-how-did-your-run-go.webp` | `18-today-how-did-your-run-go.png` | 48, 717, 1157, 936 | Thought of that: how did your run go |
| `race-guide-morning.webp` | `19b-race-guide-morning.png` | 48, 365, 1157, 1213 | Thought of that: race morning |

## Real photos (mine, from `V01/Neta Media/real/`)

| File | Source | Crop | Used in |
|---|---|---|---|
| `watch-above-cap.webp` | `watch-hr-above-cap.jpg` | 483, 1004, 1383, 1904, to 900x900 | Home card, Off the phone, Thought of that, Decision 2 |
| `watch-in-range.webp` | `watch-hr-in-range.jpg` | 701, 901, 1602, 1801, to 900x900 | Case-study hero, Off the phone |
| `widget-home.webp` | `widget-home.png` | 52, 249, 602, 823 (the widget only, no other app icons) | Off the phone |

Not used, on purpose: the two `watch-scheduled-*` photos, `watch-hr-above-cap-blurry.jpg` and
`widget-lock.png`.

The long-run reminder in "Thought of that" is drawn in HTML, not a screenshot: the Simulator
can't show the real notification (demo mode never asks for notification permission).
