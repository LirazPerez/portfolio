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
| `liraz-cutout-portrait.webp` | Me, cut out, waist up (pinned to the right of the stage) | 729 x 1140 | 84 KB |
| `obj-bobby.webp` | Bobby, my dog, in clay | 341 x 508 | 34 KB |
| `obj-statue-of-liberty.webp` | Statue of Liberty | 221 x 442 | 19 KB |
| `obj-beret.webp` | IDF beret | 330 x 200 | 10 KB |
| `obj-grad-cap.webp` | Graduation cap, "FIT" | 324 x 269 | 11 KB |
| `obj-laptop.webp` | Laptop | 406 x 351 | 16 KB |
| `obj-running-shoe.webp` | Running shoe | 360 x 228 | 12 KB |
| `obj-snowboard.webp` | Snowboard | 212 x 518 | 15 KB |
| `obj-passport.webp` | Passport with stamps | 272 x 236 | 9 KB |
| `shapes.json` | Generated outlines; do not edit by hand | | |

Sizes: on a full desktop page the wide stage shows one unit as about 1px and the objects at
1.45x their size, so the largest object (176 units) shows at about 259 CSS px and the cutout
at about 545px tall (up to about 570 on the phone stage just under 760px wide). The exports
are about 2x that.
