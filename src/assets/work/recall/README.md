# Google Maps Recall media

Each file is picked up by name (`workClip` in `src/lib/stage-media.ts`); nothing in the
components needs to change when one is replaced. Every recording has an `.mp4` (H.264, played
first), a `.webm` (VP9) and a `-poster.webp`, which is what reduced motion and no JS show.

## Flow recordings (phones on the home card, the case-study hero and the three flows)

Recorded from the live prototype, https://google-maps-recall-2.vercel.app, by
`scripts/record-recall-flows.mjs` (its header has the steps to re-run it).

- 390x844 phone viewport, device scale 3, one screenshot per 1/30 s, downscaled with Lanczos
  to 780x1688 (2x), 30 fps, muted.
- The page's CSS animations are slowed to the capture speed and its timers run on the video
  clock, so sheets, typing and transitions play at their real pace.
- The tap indicator is a soft ring where the finger lands. No arrow cursor.
- The prototype's "Concept prototype ... Not affiliated with Google" strip is hidden and its
  height kept as a plain status-bar band, so the phone's camera cutout never covers text. The
  site says the same thing under the case-study hero.
- Every place photo on screen is loaded (and checked) before a frame is taken; the recorder
  stops with an error if one fails.
- The last 0.4 s cross-dissolves back into the first frame, so each one loops cleanly.

| Clip | Length | MP4 | WebM | Steps |
|---|---|---|---|---|
| `capture` | 7.2 s | 0.66 MB | 0.49 MB | Map → tap Sauced (not saved yet) → its sheet with the photo → tap Save → the Saved card with three AI tags (Casual, American, Lower East Side) → tap Done → map |
| `browse` | 6.8 s | 0.72 MB | 0.88 MB | Map → tap the Save tab → Saved Places grid → tap Vibe → tap Date Night → the grid narrows to Lucia Trattoria, Clover Club and Attaboy → tap Vibe to close → rest |
| `ask` | 9.2 s | 0.61 MB | 0.83 MB | Map → tap Ask Maps → tap the field: the prototype types its example question letter by letter → tap send → the answer and its matching chips → tap Show results on map → 8 matches → tap Your pins → 3 saved |

Posters are each flow's key moment, not its first frame (all three start on the same map):
`capture-poster` the tags applied, `browse-poster` the narrowed grid, `ask-poster` Your pins.

Note on Ask: the demo answers one example question, and focusing its field types that
question itself (26 ms a letter). The recording shows that real behavior rather than typing
over it, which would make the demo answer "This demo answers one example question".

## Component loops (from `V01/Google Maps Recall/Case Study Media/02 Component Clips`)

Re-encoded from the edited clips at 30 fps, muted, each cropped tight to the component (the
card and the dropdown it opens), so the UI fills its frame and reads at full size. Poster = a
representative frame.

The two dropdown clips are trimmed to one take with the dropdown open the whole time, so there
is never empty space below the card: that take plays forward, then backward, so the loop joins
with no jump (the list scrolls down, then back up).

| File | Source | Take | Crop (w:h:x:y) | Used in |
|---|---|---|---|---|
| `comp-tag-group` | 01 Demo AI Organized Tag Group | 7.95 to 10.25 s, the Location list scrolling; 4.6 s loop | 744:1040:136:122 | Decision 1, next to its caption |
| `comp-custom-tag` | 02 Demo Custom Tag Picker | 1.55 to 4.25 s, the category list scrolling; 5.4 s loop | 742:1114:80:96 | New components strip |
| `comp-log-input` | 03 Demo Minimal Log Input | whole clip | 832:1200:66:0 | New components strip |
| `comp-photo-row` | 04 Demo Photo Attach Row | whole clip | 738:1212:96:12 | New components strip |
| `comp-saved-grid` | 05 Demo saved-grid | whole clip | 740:1350:30:50 (filters and two rows) | Next to the Browse flow |

## Edge cases (from `05 Edge case`)

| File | Source |
|---|---|
| `edge-zero-saved.webp` | `edge_zero_saved.png`, top 794x1060 |
| `edge-empty-query.webp` | `edge_empty_query.png`, cropped to the tabs and the empty card |
| `edge-note.*` | `note.MP4` (a phone screen recording), 600 px wide, 30 fps. The phone's own status bar and camera cutout (top 180 px) are covered with the app's top-band color, so only the app shows inside the frame; poster at 12.5 s, the note back after reopening |
