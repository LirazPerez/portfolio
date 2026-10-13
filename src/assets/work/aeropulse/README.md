# AeroPulse media

Captured from https://aero-pulse-ops.base44.app (viewport 1440x900, device scale factor 2,
the "Edit with Base44" badge hidden). Each file is picked up by name; nothing in the MDX or
the components needs to change when one is replaced.

## Stills (WebP, each cropped to the part that proves its point)

| File | What it shows |
|---|---|
| `decision-1-draft-projects.webp` | `/drafts`: Central WH Avail colored by shortfall, and the Transfer From dropdown |
| `decision-2-cable-low-stock.webp` | `/cables`: Qty on Hand, Min Threshold and Status; the warning icon sits in the low-stock rows |
| `decision-2-defect-banner.webp` | `/defects`: the red banner above the KPI cards and charts |
| `decision-3-shipment-confirmed.webp` | `/shipments`: a shipment row opened, showing the Bill of Lading / Package Photos slots and Mark Arrived |

Note on decision 3: no shipment in the demo data has a photo attached, so the still shows
the evidence slots and the Mark Arrived action, not a populated photo.

## Hero recording (home card and top of the case study)

| File | Notes |
|---|---|
| `stage.mp4` | H.264, muted, 4.5 s, loops seamlessly (starts and ends on the original value) |
| `stage.webm` | Same clip, VP9 |
| `stage-poster.webp` | First frame: the reduced-motion and no-JS fallback |

The clip is `/drafts`: the Transfer From dropdown on the Thermal Optic Pod T7 row is changed to
another project and then put back.

## Pins

Each decision shows one numbered pin, placed with `pinX` / `pinY` (percent from the image's
top-left) on the `<Screen />` in `src/content/work/aeropulse.mdx`. If a still is replaced or
re-cropped, re-place its pin on empty space or an element's edge, never on text.
