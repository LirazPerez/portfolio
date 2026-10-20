# Waypoint media

Everything here comes from the live demo, https://waypoint-app-three.vercel.app, which runs on
sample data only (patient Ilan, caregiver Dana), or from local builds of earlier commits of the
waypoint-app repository. Nothing links into `V01/`.

## Recordings

1440x900 light-mode viewport, a drawn cursor that moves slowly (the real mouse follows it, so
hover states match), a pause after every click, a fresh browser (clean sample data) for each
one. 1600x1000, 30 fps, no sound, MP4 (H.264) and WebM, each with a WebP poster (what reduced
motion and no JS show). Every clip ends in the state it starts in and loops with a plain cut:
no crossfade, never two screens on top of each other.

| Files | Clip | Shows | Length | Loop |
|---|---|---|---|---|
| `flow.*` | A, hero (browser window) | Caregiver home → "Check medications are still correct" → the record on the two medications → Gabapentin's source, original beside translation → closed → home | 10.7 s | exact |
| `roles.*` | B, decision 1 | Welcome screen → "I'm caring for someone" → Dana's home → Patient in Profile → Ilan's home | 10.3 s | cut back to the welcome screen (the app has no way back to it) |
| `confirm.*` | C, the system | In the record, Confirm next to Gabapentin → Confirmed → home: 1 needs checking, the confirmation in Recent activity → back to the record | 10.3 s | same page; only the badge and its footnote reset (the app has no undo) |
| `source.*` | D, decision 2 | Gabapentin's source → the document → Gabapentin under "Supports these records" → back to the row, tinted until it fades | 9.1 s | exact |
| `clinician.*` | E, process | Ilan's profile → My code → a drawn camera frame closes in on the code → the clinician view, alerts first → closed → profile | 7.6 s | exact |

Re-record (Playwright is not a project dependency; run from a scratch folder):

    node scripts/record-waypoint-clips.mjs <frames-dir> [flow roles confirm source clinician]
    scripts/encode-waypoint-clips.sh <frames-dir> flow 15
    scripts/encode-waypoint-clips.sh <frames-dir> roles 250
    scripts/encode-waypoint-clips.sh <frames-dir> confirm 165
    scripts/encode-waypoint-clips.sh <frames-dir> source 200
    scripts/encode-waypoint-clips.sh <frames-dir> clinician 125
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
| `mobile-01ce219`, `mobile-0432e29`, `mobile-72ec069` | The mobile home in three rounds: written for the patient, then led by recovery stats, then by what needs attention | Decision 1 |
| `record-table` | The medications table | The build (spec line) |
| `state-*` | One crop per record state, and the empty state | The build (states grid) |
| `a11y-*` | Status in words, the focus ring, a dialog with its close button | The build |
| `record-dark` | The medical record in dark mode | The build |
| `phone-home`, `phone-record` | Today's app at 390, with the bottom tab bar | The build |

The historical homes stay as captured (they show the past); re-running the script without HISTORY leaves them alone. The earlier mobile homes no longer exist in the live app: build those commits of waypoint-app,
serve each `dist/`, and pass them as `HISTORY` (see the script). Two of them still carry a
floating button that was later removed from the product; the capture hides it.
