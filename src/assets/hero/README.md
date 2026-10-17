# Home hero: clay heap

Transparent WebP files used by the clay heap in the home hero (`src/components/ClayHeap.tsx`).
They are exported from the source PNGs in `V01/Hero Objects/` (git-ignored, never linked) by:

```
node scripts/export-hero-objects.mjs
```

The script clears near-transparent stray pixels, trims each image to its visible pixels,
resizes it, writes the WebP, checks the edges for a light fringe (a halo on the dark theme),
and writes `shapes.json`: each image's aspect ratio and a simplified convex outline, used for
the physics bodies and the grab areas. Re-run it after replacing any source file.

Labels, sizes and drop order are in `src/data/hero-objects.ts`.

| File | What it shows | Exported size | Weight |
|---|---|---|---|
| `liraz-cutout-portrait.webp` | Me, cut out, waist up (pinned to the right of the stage) | 575 x 900 | 58 KB |
| `obj-bobby.webp` | Bobby, my dog, in clay | 215 x 320 | 19 KB |
| `obj-statue-of-liberty.webp` | Statue of Liberty | 160 x 320 | 13 KB |
| `obj-beret.webp` | IDF beret | 320 x 194 | 9 KB |
| `obj-grad-cap.webp` | Graduation cap, "FIT" | 320 x 266 | 12 KB |
| `obj-laptop.webp` | Laptop | 320 x 277 | 13 KB |
| `obj-running-shoe.webp` | Running shoe | 320 x 202 | 11 KB |
| `obj-snowboard.webp` | Snowboard | 131 x 320 | 9 KB |
| `obj-passport.webp` | Passport with stamps | 260 x 225 | 9 KB |
| `shapes.json` | Generated outlines; do not edit by hand | | |

Sizes: on a full-width desktop page one stage unit is about 0.72 px, so the largest object
(176 units) shows at about 127 CSS px and the cutout at about 360 px tall; the exports are
about 2.5x that. Between 600 and 760 px wide the stage is larger, and they are still about 1.6x.
