# AeroPulse media

Recorded from the live demo app, https://aero-pulse-ops.base44.app (viewport 1440x900, signed
out, the "Edit with Base44" badge hidden), by `scripts/record-aeropulse-clips.mjs`, and encoded by
`scripts/encode-aeropulse-clips.sh`. Each file is picked up by name; nothing in the MDX or the
components needs to change when one is replaced.

## How they are made

- Frame by frame, 30 fps, through a virtual camera: every frame the browser re-renders the
  camera's rectangle at 2400x1500, so text stays sharp at any zoom. Encoded at 1600x1000.
- Each clip opens on the whole screen, eases in to the part that matters, and eases back out.
  The cursor is drawn in the page, moves on gentle arcs and rests beside text, never on it.
- One action per clip, and every clip ends on its first frame, so the loop is seamless.
- Read-only: only navigation links, a row's expand arrow and the archive row are clicked.
- The poster (`<clip>-poster.webp`) is the clip's key moment, zoomed in: what reduced motion
  and no JS show. Videos preload nothing until they near the screen.

## Clips

| Clip | Length | MP4 | WebM | Used in | Shows |
|---|---|---|---|---|---|
| `flow` | 14.4 s | 2.3 MB | 2.2 MB | Browser window, home card and case-study hero | Draft Projects → zoom into Thermal Optic Pod T7: 8 requested, 4 in the central warehouse, transfer from Rockies High-Altitude Hub → Archive → FX-88520 expanded → zoom into its delivery photo and bill of lading → back |
| `decision-1-transfer` | 8.0 s | 0.9 MB | 0.9 MB | Decision 1 | The same request line, zoomed: requested, available, Transfer From |
| `decision-2-low-stock` | 7.0 s | 0.8 MB | 0.7 MB | Decision 2 | Cable inventory, zoomed on quantity through reorder action: the warning stays in the two low-stock rows |
| `decision-2-defects` | 7.3 s | 0.9 MB | 0.8 MB | Decision 2 | Defect analysis, whole page (full chart), then in to the red banner and the totals |
| `decision-3-proof` | 10.1 s | 1.8 MB | 1.6 MB | Decision 3 | Archive: FX-88520 expanded, zoom into the delivery photo and the bill of lading, then out to the row's Arrived |

The demo has no form for a new request, and its Transfer From selects are read-only when signed
out, so the request story is told on an existing draft line rather than by typing one.

## Re-recording

In a scratch folder: `npm i playwright && npx playwright install chromium`, then
`node /path/to/scripts/record-aeropulse-clips.mjs <frames-dir> [clip ...]`, then for each clip
`scripts/encode-aeropulse-clips.sh <frames-dir> <clip> <poster-frame>` (poster frames used:
flow 95, decision-1-transfer 110, decision-2-low-stock 100, decision-2-defects 115,
decision-3-proof 105).
