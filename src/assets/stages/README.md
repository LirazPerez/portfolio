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

`waypoint.mp4`, `waypoint.webm`, `waypoint-poster.webp`: the same take as the case study's hero
clip (recording A, `src/assets/work/waypoint/flow.*`), 10.9 s, 1600x1000, 30 fps, muted, seamless
loop. Recorded from the deployed demo, https://waypoint-app-three.vercel.app (`?role=caregiver`),
which runs on sample data only (patient Ilan, caregiver Dana), by
`scripts/record-waypoint-clips.mjs <frames-dir> flow` and encoded with
`scripts/encode-waypoint-clips.sh <frames-dir> flow 15 src/assets/stages waypoint`.

The story: the caregiver's home → "Check medications are still correct" → the medical record on
the two medications to check → Gabapentin's source document, the Hebrew original beside the
English translation. The poster is the caregiver's home. It replaces `WaypointScene.astro` (kept
in the repo as the fallback, unused while this recording exists).

## Specs

- Photos: `.jpg`, `.jpeg`, `.png`, `.webp` or `.avif`. About 1600 px wide is plenty; the stage
  blurs and darkens it, so a sharp original is not needed. If only one of `-light` / `-dark`
  exists, it is used for both themes.
- Videos: no audio needed (always muted), short loop, under about 3 MB. They load only near the
  screen and play only when motion is allowed and the stage is on screen; otherwise the poster
  shows.
- Until a photo exists, stages show a neutral placeholder gradient.
