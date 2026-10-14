# AeroPulse media

Captured from https://aero-pulse-ops.base44.app (viewport 1440x900, device scale factor 2,
the "Edit with Base44" badge hidden). Each file is picked up by name; nothing in the MDX or
the components needs to change when one is replaced.

## Stills (WebP, each cropped to the part that proves its point)

| File | What it shows |
|---|---|
| `decision-1-draft-projects.webp` | `/drafts`: Central WH Avail colored by shortfall, and the Transfer From dropdown |
| `decision-2-cable-low-stock.webp` | `/cables`: Part Number through Reorder Action (about 870 CSS px, close to the defect banner's width so both decision 2 screens render at a similar scale); the warning icon sits in the two low-stock rows |
| `decision-2-defect-banner.webp` | `/defects`: the red banner above the KPI cards and charts |
| `decision-3-shipment-confirmed.webp` | `/archive`: shipment FX-88520 opened with its row arrow, showing its two attachments, the delivery photo and the bill of lading, as thumbnails (Tracking # through Final Status, about 1020 CSS px) |

Note on decision 3: FX-88520 was chosen over DHL-50501 because its bill of lading still reads at
thumbnail size. Its attachments are generated demo images that match the shipment (FedEx, Central
Logistics Depot to Mountain Region Hub, drone parts, October 2026). The app's thumbnails are about
120 px, so the crop now includes the Final Status column ("Arrived") and they still render larger
than before.

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
