# AeroPulse media (TODO: add the real screens)

These could not be captured automatically: the live app (aero-pulse-ops.base44.app) sends
every page to its login screen, so a headless browser cannot reach the dashboard. Export
them yourself while signed in, then drop the files here. They are picked up by file name on
the next build; nothing in the MDX or the components needs to change. Until then each slot
shows a clearly tagged "Screenshot to add" placeholder.

## Stills (WebP, DPR 2)

Crop each to the part that proves its point. No full-screen dumps. The frame is never
wider than the text column plus a little, and never taller than 70% of the viewport, so a
roughly 16:10 to 2:1 crop at about 1600 px wide works well.

| File | What it must show |
|---|---|
| `decision-1-draft-projects.webp` | `/drafts`: the table with the colored "Central WH Avail" column and the "Transfer From" dropdown |
| `decision-2-cable-low-stock.webp` | `/cables`: Cable & Harness Inventory, a low-stock row with its warning icon |
| `decision-2-defect-banner.webp` | Defect & Maintenance Analysis: the red banner above its chart |
| `decision-3-shipment-confirmed.webp` | Shipment Requests: an arrival confirmed, with the delivery photo attached |

Close the floating "Edit with Base44" badge before capturing.

## Hero recording (home card and top of the case study)

| File | Notes |
|---|---|
| `stage.mp4` | H.264, muted, 4 to 6 seconds, loops. On `/drafts`, open a "Transfer From" dropdown and pick another project. Under 2 MB. |
| `stage.webm` | Same clip as WebM (optional but recommended) |
| `stage-poster.webp` | One frame from the clip: the reduced-motion and no-JS fallback |

## Pins

Each decision shows one numbered pin. Without coordinates it sits on the frame's top-right
corner, where it cannot cover text. Once the screens exist, place each pin on the element
the decision is about, on empty space or an element's edge, never on text:
`pinX` and `pinY` are percentages from the image's top-left, set on the `<Screen />` in
`src/content/work/aeropulse.mdx`.
