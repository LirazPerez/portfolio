# Waypoint media

Everything here comes from the live demo, https://waypoint-app-three.vercel.app, which runs on
sample data only (patient Ilan, caregiver Dana), or from local builds of earlier commits of the
waypoint-app repository. Nothing links into `V01/`.

## Recordings

1440x900 light-mode viewport, a drawn cursor that moves slowly, a pause after every click, a
fresh browser (clean sample data) for each one. 1600x1000, 30 fps, no sound, MP4 (H.264) and
WebM, each with a WebP poster (what reduced motion and no JS show). The last half second
crossfades into the first, so every clip loops without a jump.

| Files | Clip | Shows | Length |
|---|---|---|---|
| `flow.*` | A, hero (laptop) | Caregiver home → "Check medications are still correct" → the record on the two medications → Gabapentin's source, original beside translation | 10.9 s |
| `roles.*` | B, decision 1 | Welcome screen → "I'm caring for someone" → Dana's home → Patient in Profile → Ilan's home | 10.8 s |
| `confirm.*` | C, the system | Confirm next to Gabapentin → Confirmed → home: 1 needs checking, the confirmation in Recent activity | 10.1 s |
| `source.*` | D, decision 2 | Gabapentin's source → the document → Gabapentin under "Supports these records" → back to the row, highlighted | 9.0 s |

Re-record (Playwright is not a project dependency; run from a scratch folder):

    node scripts/record-waypoint-clips.mjs <frames-dir> [flow roles confirm source]
    scripts/encode-waypoint-clips.sh <frames-dir> flow 15
    scripts/encode-waypoint-clips.sh <frames-dir> roles 300
    scripts/encode-waypoint-clips.sh <frames-dir> confirm 270
    scripts/encode-waypoint-clips.sh <frames-dir> source 210
    scripts/encode-waypoint-clips.sh <frames-dir> flow 15 src/assets/stages waypoint

The last number is the poster frame. Check the poster frames still land on the right moment
after a re-record.

## Stills

Captured by `scripts/capture-waypoint-stills.mjs <png-dir> src/assets/work/waypoint`, which also
writes the WebPs here (2x of their largest shown size).

| File | What it shows | Used in |
|---|---|---|
| `home-caregiver`, `home-patient` | The two desktop homes, 1440, light | The system; decision 3 |
| `mobile-153432f` | The first mobile home, the version tested | Decision 3 |
| `mobile-01ce219`, `mobile-0432e29`, `mobile-72ec069` | The three mobile home directions after testing | Process |
| `doctor-view` | The one-screen summary opened from My code | Process |
| `record-table` | The medications table | The build (spec line) |
| `state-*` | One crop per record state, and the empty state | The build (states grid) |
| `a11y-*` | Status in words, the focus ring, a dialog with its close button | The build |
| `record-dark` | The medical record in dark mode | The build |
| `phone-home`, `phone-record` | Today's app at 390 | The build |

The earlier mobile homes no longer exist in the live app: build those commits of waypoint-app,
serve each `dist/`, and pass them as `HISTORY` (see the script). Two of them still carry a
floating button that was later removed from the product; the capture hides it.
