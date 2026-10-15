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

## Flow recording (laptop on the home card and at the top of the case study)

| File | Notes |
|---|---|
| `flow.mp4` | H.264, 1440x900, 30 fps, muted, 20.6 s, about 1.0 MB |
| `flow.webm` | Same clip, VP9, about 1.1 MB |
| `flow-poster.webp` | First frame: what reduced motion and no JS show |

One continuous take of the live app, signed out, with a drawn cursor (an arrow, plus a soft
ring on each click) and the "Edit with Base44" badge hidden. Read-only: only navigation links,
a row's expand arrow, a photo thumbnail and the lightbox close are clicked.

1. Dashboard, resting.
2. Draft Projects (Demands): the cursor points at the orange Central WH Avail on Thermal Optic
   Pod T7 (4 against 8 requested), then at that line's Transfer From cell.
3. Defect & Maintenance Analysis: rests on the red "Wear & Tear accounts for 63%" banner.
4. Archive: opens FX-88520 with the arrow at the start of its row, opens the delivery photo,
   rests, closes it with its X.
5. Back to the Dashboard, cursor at its starting point: the last frame matches the first, so
   the loop is seamless.

It is captured frame by frame (one 2x screenshot per 1/30 s, downscaled with Lanczos), so no
frame is ever dropped and text stays crisp. To re-record, run
`scripts/record-aeropulse-flow.mjs` (its header has the steps).

## Pins

Each decision shows one numbered pin, placed with `pinX` / `pinY` (percent from the image's
top-left) on the `<Screen />` in `src/content/work/aeropulse.mdx`. If a still is replaced or
re-cropped, re-place its pin on empty space or an element's edge, never on text.
