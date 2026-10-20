# Stage media

Each project's hero stage picks up its media from this folder **by file name**. Drop the
files in and rebuild; there is nothing to register or edit in code.

Replace `<slug>` with the project slug: `aeropulse`, `waypoint`, `recall`, `classpass`.

| File | What it is | Status |
|---|---|---|
| `<slug>-light.jpg` | Real-world photo from the project's world, for the **light** theme | TODO, all four |
| `<slug>-dark.jpg` | The same world, for the **dark** theme | TODO, all four |
| `<slug>.mp4` (and optionally `<slug>.webm`) | Muted, looping screen recording that plays inside the stage frame | **waypoint: done.** Not needed for aeropulse and recall (their cards and heroes use a laptop or phones); classpass is a draft |
| `<slug>-poster.<jpg/webp>` | Poster frame shown before the video plays, and always under reduced motion | waypoint: done |

## Waypoint

`waypoint.mp4` (1.5 MB), `waypoint.webm` (1.4 MB), `waypoint-poster.webp`: 9.4 s, 1600x1000,
30 fps, muted, seamless loop. Recorded from the deployed demo, https://waypoint-app-three.vercel.app
(`?role=caregiver`), which runs on mock data only (patient Ilan, caregiver Dana; no login, no
real personal or health data), by `scripts/record-aeropulse-clips.mjs waypoint` and encoded with
`scripts/encode-aeropulse-clips.sh <frames-dir> waypoint 175 src/assets/stages`.

The story: the caregiver's home → Ilan's code (zoom in on the QR card) → See what a doctor
sees → the doctor's one-screen view (zoom in on "Alerts: read first") → back to the home screen.
The poster is the alerts close-up. It replaces `WaypointScene.astro` (kept in the repo, unused
while this recording exists).

## Specs

- Photos: `.jpg`, `.jpeg`, `.png`, `.webp` or `.avif`. About 1600 px wide is plenty; the stage
  blurs and darkens it, so a sharp original is not needed. If only one of `-light` / `-dark`
  exists, it is used for both themes.
- Videos: no audio needed (always muted), short loop, under about 3 MB. They load only near the
  screen and play only when motion is allowed and the stage is on screen; otherwise the poster
  shows.
- Until a photo exists, stages show a neutral placeholder gradient.
