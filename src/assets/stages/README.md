# Stage media

Each project's hero stage picks up its media from this folder **by file name**. Drop the
files in and rebuild; there is nothing to register or edit in code.

Replace `<slug>` with the project slug: `aeropulse`, `waypoint`, `recall`, `classpass`.

| File | What it is | Status |
|---|---|---|
| `<slug>-light.jpg` | Real-world photo from the project's world, for the **light** theme | TODO, all four |
| `<slug>-dark.jpg` | The same world, for the **dark** theme | TODO, all four |
| `<slug>.mp4` (and optionally `<slug>.webm`) | Muted, looping screen recording that plays inside the stage frame | Not needed for aeropulse and waypoint (their cards and heroes use a browser window) or for neta and recall (phones); classpass is a draft |
| `<slug>-poster.<jpg/webp>` | Poster frame shown before the video plays, and always under reduced motion | Only with a stage video |

## Specs

- Photos: `.jpg`, `.jpeg`, `.png`, `.webp` or `.avif`. About 1600 px wide is plenty; the stage
  blurs and darkens it, so a sharp original is not needed. If only one of `-light` / `-dark`
  exists, it is used for both themes.
- Videos: no audio needed (always muted), short loop, under about 3 MB. They load only near the
  screen and play only when motion is allowed and the stage is on screen; otherwise the poster
  shows.
- Until a photo exists, stages show a neutral placeholder gradient.
