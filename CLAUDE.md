# lirazhazala.com

The personal portfolio of **Liraz Hazala Perez, product designer**. The site is itself proof of the work: it is designed and built by Liraz, so craft, accessibility and restraint in the code matter as much as the case studies.

The approved visual direction is `reference/specimen.html`. When in doubt about a visual decision, open it in a browser and match it. (The portrait, CV and persona-photo originals in `reference/` are gitignored; the copies the site uses live in `src/assets/` and `public/cv/`.)

`V00/` and `V01/` are archived material from earlier versions (several GB, nested git repos). They are gitignored and excluded from Vite, Tailwind and TypeScript. Never import from them.

## Stack

- **Astro 7** (static output), **TypeScript** (strict; pinned to TS 6 because `astro check` does not support TS 7 yet).
- **Tailwind CSS v4** via `@tailwindcss/vite`. All config lives in CSS (`src/styles/global.css`), there is no `tailwind.config`.
- **React** only for interactive islands. Today there is one: the falling facts in the home hero (`FallingFacts.tsx`, `client:visible`, physics by **matter-js** from npm, loaded lazily at the moment of the drop). Everything else ships as zero-JS static HTML. Small progressive enhancements (theme toggle, signature stroke, TOC scroll-spy) are plain `<script>` tags inside `.astro` components.
- **MDX** for case studies, through the `work` content collection.
- Markdown runs through `unified()` from `@astrojs/markdown-remark`, because Astro 7's default processor skips rehype plugins and we need one (see Content).

Commands: `npm run dev` (http://localhost:4321), `npm run build` (runs `astro check` first), `npm run preview`.

## Design tokens

Defined **once**, as CSS custom properties in `src/styles/global.css`, and mapped into Tailwind with `@theme inline`. **Never hardcode a color in a component.** Tailwind's default palette is wiped (`--color-*: initial`), so `bg-red-500` will not compile; use `bg-surface`, `text-muted`, `border-line`, and so on, or `var(--token)` in scoped CSS.

Contrast ratios are WCAG 2.x, measured against `bg` of the same theme. AA needs 4.5 for body text, 3 for large text and UI.

### Light

| Token | Hex | vs bg | Use |
|---|---|---|---|
| `bg` | `#FCFBFD` | 1.00 | Page background |
| `surface` | `#F5F3F8` | 1.07 | Cards, stages, hover fills |
| `raise` | `#FFFFFF` | 1.03 | Chips and anything sitting on a surface |
| `ink` | `#2A2631` | 14.34 | Body text, headings |
| `muted` | `#625C6B` | 6.24 | Secondary text |
| `line` | `#E6E3EB` | 1.23 | Hairline borders (decorative only) |
| `accent` | `#89599E` | 5.11 | Accent text, focus ring, primary button fill |
| `accent-strong` | `#6E4482` | 7.24 | Links, active nav text, hover of accent |
| `accent-tint` | `#F1EAF5` | 1.14 | Active nav pill, hover fills |
| `on-accent` | `#FFFFFF` | 1.03 | Text on `accent` fills |

### Dark

| Token | Hex | vs bg | Use |
|---|---|---|---|
| `bg` | `#131215` | 1.00 | Page background |
| `surface` | `#1C1A20` | 1.08 | Cards, stages, hover fills |
| `raise` | `#232028` | 1.16 | Chips and anything sitting on a surface |
| `ink` | `#E2DFE7` | 14.17 | Body text, headings |
| `muted` | `#A7A1B0` | 7.44 | Secondary text |
| `line` | `#2C2931` | 1.31 | Hairline borders (decorative only) |
| `accent` | `#C39BD3` | 7.95 | Accent text, focus ring, primary button fill |
| `accent-strong` | `#D7B8E4` | 10.55 | Links, active nav text, hover of accent |
| `accent-tint` | `#2E2436` | 1.26 | Active nav pill, hover fills |
| `on-accent` | `#131215` | 1.00 | Text on `accent` fills |

### Key pairings (other than vs bg)

| Pair | Light | Dark |
|---|---|---|
| `ink` on `surface` | 13.42 | 13.09 |
| `muted` on `surface` | 5.84 | 6.87 |
| `muted` on `raise` | 6.44 | 6.39 |
| `accent` on `surface` (lowest text pair) | 4.78 | 7.35 |
| `accent-strong` on `accent-tint` (active nav item) | 6.34 | 8.35 |
| `on-accent` on `accent` (primary button) | 5.27 | 7.95 |
| `on-accent` on `accent-strong` (primary button hover) | 7.47 | 10.55 |
| `warn` on `warn-tint` (didn't-work box) | 4.85 | 6.88 |
| `warn` on `surface` / `bg` | 5.04 / 5.38 | 8.35 / 9.04 |
| `ok` on `ok-tint` (did-instead box) | 4.59 | 7.76 |

`bg`, `surface`, `raise`, `line` and `accent-tint` are surfaces, not text colors. `line` (1.23 / 1.31) is decorative: never let it be the only boundary of a form control or anything a user must find to operate.

Supporting tokens follow the theme too: `--glass` (translucent capsule fill), `--shadow` (the soft shadow, Tailwind `shadow-soft`) and `--shadow-lift` (the deeper one under the laptop and its floating screens, `shadow-lift`).

**Case-study status pair:** `warn` / `warn-tint` (light `#A84E26` / `#FBEDE6`, dark `#F0A27E` / `#3A2620`) and `ok` / `ok-tint` (light `#2F7A57` / `#E7F4EC`, dark `#8FD3B0` / `#1E3329`). Only for diagrams and "considered" lines, always next to a word or an icon that says the same thing. (The concept's light warn `#B4542A` was 4.33 on its tint, so it was darkened.)

**Laptop mockup:** `--bezel`, `--bezel-edge`, `--deck`, `--deck-edge`, `--deck-shadow` (see `Laptop.astro`). Decorative surfaces, not text colors.

### Shape, spacing, layout

- **Radii:** `rounded-pill` 999px (pills, nav capsule, buttons), `rounded-card` 16px / `rounded-frame` 14px (cards, frames, stages), `rounded-control` 8px / `rounded-control-sm` 6px (small controls).
- **Borders:** hairline 1px `line` instead of heavy shadows. The soft shadow is reserved for floating things (capsule, card hover, fact pills).
- **Spacing:** 8px scale. Tailwind's `--spacing` is set to 8px, so `p-1` = 8px, `p-2` = 16px, `gap-3` = 24px, `p-0.5` = 4px (half step). Pixel-exact values from the specimen are fine as arbitrary values (`px-[18px]`).
- **Width:** content max ~1120px, `max-w-content`. Side gutter `px-[clamp(16px,5vw,56px)]`.
- **Breakpoints:** `md` = 760px (the nav docks to the bottom below it). `lg` = 1024px (the case-study TOC becomes a side column).

## Typography: the one-font rule

**No all-caps, anywhere.** No `text-transform: uppercase` (Tailwind `uppercase`) and no wide letter-spacing on eyebrows, labels or small headings. Labels are sentence case: only the first letter capitalized ("What I noticed", "Next project", "On this page"). Small labels get their emphasis from weight and color, not from caps or tracking.


**Geist** (`@fontsource-variable/geist`, self-hosted, one variable file for all weights) is the only typeface on the site. No other fonts, no serif, no monospace (Tailwind's `font-mono` is removed and `code`/`pre` inherit Geist).

**The single exception** is the signature wordmark in the nav, set in **Caveat 600** (`@fontsource/caveat`, Latin 600 only). It is a logo, not text. Caveat must never be used anywhere else. Both font files are preloaded in `BaseLayout.astro`.

## Theme

- Default follows the device (`prefers-color-scheme`). The nav toggle switches light/dark; the choice persists in `localStorage` under **`lh-theme`** (`"light"` or `"dark"`).
- An inline script at the top of `<head>` applies the saved choice as `data-theme` on `<html>` before first paint (no flash). It also adds the `js` class, which reveals the toggle (without JS the toggle would do nothing, so it is hidden).
- Dark tokens apply under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and under `:root[data-theme="dark"]`. Both set `color-scheme: dark`; light sets `color-scheme: light`. `<meta name="color-scheme" content="light dark">` covers the moment before CSS loads.
- Prefer tokens over `dark:`. A `dark:` variant exists (matching both rules above) for the rare case a token is not enough, typically inside a project stage.

## Navigation rules (`src/components/Nav.astro`)

- **Signature wordmark**, far left, outside the capsule, is the home link. "Liraz" with "Perez" just below, offset right (`margin-left: .5em`), the whole mark rotated -4deg, joined by one pen stroke from the tail of the z into the top of the P. The stroke is an SVG path computed in the browser from the real glyph boxes once Caveat has loaded (same math as the specimen). Accessible name: **"Liraz Perez, home"**, so it matches the visible words (WCAG 2.5.3, label in name); the visible letters are `aria-hidden`. On hover it turns `accent-strong`.
- **Capsule**, floating and centered: `--glass` background with backdrop blur, hairline border, soft shadow. Items in this order: **Work, About, CV, Contact**, a divider, then the theme toggle (moon in light mode, sun in dark mode, labelled "Switch to dark mode" / "Switch to light mode").
- **Active pill**: `accent-tint`, rendered inside the current item. It has `view-transition-name: nav-pill`, so cross-document view transitions slide it to the new item with a spring (`cubic-bezier(.3,1.4,.5,1)`), with no JS. Work is active on `/` (`aria-current="page"`) and on `/work/*` (`aria-current="true"`); About on `/about`.
- **CV** is the only item with an icon (download arrow). It is a real download (`download` attribute, here and on the footer CV link), so the icon, the "PDF download" label and the behavior all agree; the file is `/cv/liraz-hazala-perez-cv.pdf`. Its accessible name is "CV, PDF download, X MB", where the size is read from the real file at build time (`src/lib/cv.ts`), so replacing the PDF updates the label.
- **Contact** jumps to `#contact`, the footer on every page.
- **Under 760px** the capsule docks to the bottom as a floating tab bar (`bottom: 12px + env(safe-area-inset-bottom)`), and `<body>` gets bottom padding so nothing hides behind it. The wordmark stays top-left (not sticky on mobile, so it never floats over text).
- Every nav target is at least 44px tall.

## Project colors stay in their stage

Every project may have its own palette, but **only inside its hero stage** (`src/components/Stage.astro`, marked `data-project="<slug>"`). Define project colors as `--<slug>-*` custom properties scoped to that stage, with dark variants under the same theme selectors as the tokens. Site chrome (nav, cards, text, buttons, TOC) stays neutral and purple.

**Stage background and media** (`Stage.astro`, resolved by `src/lib/stage-media.ts`): a blurred, darkened real-world photo per project, one per theme, plus an optional muted looping screen recording. Nothing is registered in code: drop files in `src/assets/stages/` by name (`<slug>-light.jpg`, `<slug>-dark.jpg`, `<slug>.mp4`, `<slug>-poster.jpg`; see the README there for the TODO list). Until a photo exists: Waypoint shows its built-in backdrop, the other stages a neutral gradient. Videos are muted, looping, `playsinline`, no controls, `aria-hidden`; the text alternative is on the stage (`role="img"`, `aria-label`). They play only when motion is allowed and on screen; otherwise the poster shows.

**Waypoint's stage** is a pure-CSS scene (`WaypointScene.astro`): phone with code, scan line, physician view rising, rows appearing, alerts first. It loops over 7s, starts mid-cycle so the first frame is complete, is held at that frame until on screen, and under reduced motion shows the final frame (the un-animated style).

## Accessibility rules

Accessibility is a feature of this portfolio, not a checklist. Target **WCAG 2.2 AA**.

- `lang="en"`, a "Skip to content" link (first focusable element), landmarks (`header`, `nav`, `main#main`, `footer`), **exactly one `h1` per page**, headings in order.
- **Focus ring:** 2px `accent` outline, 3px offset, on every interactive element (global `:focus-visible` rule). Never remove it without a visible replacement.
- **Touch targets** at least 44 x 44px.
- **Reduced motion:** with `prefers-reduced-motion: reduce` nothing moves and the final state is shown. Global rule kills animations, transitions and view transitions. Write components so the **un-animated style is the final state**, and gate decorative motion behind `@media (prefers-reduced-motion: no-preference)`.
- **Never color alone.** Current nav item = pill shape + color. Current TOC section = bar + weight + color. Statuses and placeholders = text. Body links are underlined (`.prose-link`).
- Text contrast at least 4.5:1 in both themes (see tables). Re-measure if a token changes.
- Decorative SVGs get `aria-hidden="true" focusable="false"`. Visually hidden text uses `.sr-only-text`.
- Pages must work without JavaScript; scripts only enhance.
- When moving focus programmatically (TOC jumps), give the target `tabindex="-1"`.

## Content collection: `work`

Schema in `src/content.config.ts`; files in `src/content/work/<slug>.mdx`. The filename is the slug and the URL (`/work/<slug>`). Every case study renders through one template, `src/pages/work/[slug].astro`.

```ts
{
  title: string;
  tagline: string;          // one sentence; card + case-study header
  order: number;            // position on the home page, 1 first
  platform: 'desktop' | 'mobile';  // desktop = large full-width card, mobile = phone card (two per row)
  role: string;
  duration: string;
  tools: string[];
  status: 'shipped' | 'prototype' | 'in-progress' | 'concept';
  tags: string[];
  category?: string;        // case-study eyebrow after "Case study ·" (e.g. "Desktop SaaS"); falls back to the platform
  heroScreens?: string[];   // up to two stills (file names in src/assets/work/<slug>/) floating beside the hero laptop
  stageAlt?: string;        // text alternative for the hero stage or laptop recording; generic fallback if omitted
  statusLabel?: string;     // case-study meta row: overrides the label for `status` (e.g. "In daily use by 20 to 30 people")
  origin?: string;          // one line under the meta row: where the project comes from, what is and is not shown
  lede?: string;            // case-study lede when it should differ from the card's tagline
  phones?: { clip, title, caption, alt }[];  // mobile: up to three recordings, each in a <Phone>; the hero shows all, middle one larger
  cardPhones?: string[];    // which `phones` (by clip) the home card shows, up to two
  nativeScreen?: boolean;   // recordings from the iOS Simulator (own status bar and island): native phone, 590:1282
  cardPhoto?: { image, alt };                    // a real photo beside the card's phone, tilted
  heroPhoto?: { image, title, caption, alt };    // a real photo closing the hero's phone row
  comingSoon?: boolean;     // the page shows "Case study coming soon" instead of the outline and TOC
  draft?: boolean;          // hidden everywhere: no card, no page, no "Next project" link (src/lib/work.ts)
}
```

`statusLabel` and `origin` are shown only on the case-study page (the meta row and the line under it). `status` stays the enum; `statusLabel` just replaces its wording.

The home card shows the product on top (the laptop with the flow recording for a desktop project that has one, two phones for a mobile project with `cardPhones`, otherwise the stage), then title, tagline, tags and "View case study". No annotation, no "What I noticed" line. **Role, duration, status and tools are not on the card**; they live on the case-study page.

**Case-study hero** (`case/CaseHero.astro`): "All work", eyebrow "Case study · <category>", `h1`, tagline, one meta row (Role, Time, Tools, Status), the product (laptop plus `heroScreens` floating beside it, drifting only when motion is allowed; or the stage), then `origin`.

Current entries: `aeropulse` (1, desktop), `waypoint` (2, desktop), `neta` (3, mobile, native phones plus real Watch photos), `recall` (4, mobile, phones). `ComingSoonPhone` is kept for the next `comingSoon` project. `classpass` is a draft: its file is kept, nothing links to it.

Always list entries through `publishedWork()` (`src/lib/work.ts`), never `getCollection('work')` directly, so drafts stay hidden.

**Phone mockup** (`Phone.astro`): a generic dark frame (`--bezel`, `--bezel-edge`), a pill camera cutout, no logo, a 390:844 screen with the recording filling it (cover, from the top). `native` drops the cutout and uses a 590:1282 screen, for Simulator recordings that carry their own status bar and Dynamic Island (Neta). Everything scales with its own width (container units). One image to assistive tech (`label`). A mobile project's recordings live in its media folder as `<clip>.mp4`, `<clip>.webm`, `<clip>-poster.*` (`workClip` in `stage-media.ts`); Recall's are recorded by `scripts/record-recall-flows.mjs` (see the README in its media folder).

**Case-study sections.** Every case study has these sections, in this order, with these ids (single source: `SECTIONS` in `src/lib/case-study.ts`):

| id | `##` heading in MDX |
|---|---|
| `what-i-noticed` | What I noticed |
| `problem` | Problem |
| `how-i-ran-it` | How I ran it |
| `process` | Process |
| `decisions` | Key decisions (or Decisions) |
| `build` | The build (or Build) |
| `outcome` | Outcome |
| `still-open` | Still open |

Write each section in MDX as a `## <heading>` exactly as above. The `##` renders as the section's small sentence-case eyebrow; the TOC keeps the short titles (Decisions, Build), and the visible headings "Key decisions" and "The build" map to the same ids (`heading` in `SECTIONS`, `ALIASES` in the rehype plugin). A rehype plugin (`src/lib/rehype-case-study-sections.mjs`) wraps each `##` and its content in `<section id="<id>" aria-labelledby="<id>-heading">`, and **fails the build** if the headings are missing, renamed or out of order. Use `###` and below freely inside a section. While an MDX body is empty, the template renders the outline with clearly tagged placeholder copy.

The TOC (`src/components/CaseStudyToc.astro`) is a sticky side column from 1024px and a collapsed "On this page" bar pinned to the top below that. Its links work without JS; a small script marks the current section (`aria-current="true"`) while scrolling.

## Case-study components and media

Available in every case-study MDX without importing (the template passes them as MDX components):

- **`<Screen project="<slug>" name="<file>" alt="..." pin={n} pinX={..} pinY={..} />`** (`Screen.astro`): an app screenshot in the floating frame treatment (hairline border, soft shadow, three-dot bar). The still is found by name in `src/assets/work/<slug>/` (`src/lib/work-media.ts`: jpg, jpeg, png, webp or avif); if the file is missing a tagged "Screenshot to add" placeholder renders instead of failing the build. The frame spans the content column plus 24px each side, and never taller than 70% of the viewport (its width derives from the image's aspect ratio; the image is never stretched). Stills lazy-load. **`alt` is required: say what the screen shows and what to notice.** One optional numbered pin (accent disc matching the decision number), `aria-hidden` (the text beside it carries the meaning). `pinX` / `pinY` are percent from the image's top-left; place the pin on empty space or an element's edge, **never on text**. Without coordinates it sits on the frame's top-right corner.
- **`<ExternalLink href="..." variant="primary">Label</ExternalLink>`** (`ExternalLink.astro`): a pill link that opens in a new tab (`rel="noopener noreferrer"`), shows an icon, and adds "(opens an external site in a new tab)" to its accessible name. `variant="primary"` is the filled accent button (the live-app link).

**Section components** (`src/components/case/`, reusable for every case study; each sizes itself with a container query, so it follows the room it really has next to the TOC):

| Component | What it draws |
|---|---|
| `<Intro headline lede>` | The big headline sentence and an optional lede under the `##` eyebrow. Children = a visual: the section goes two columns when the content column is 820px+. `slot="after"` sits under the lede (e.g. a legend). |
| `<Converge label sources note calls result>` | Sources that disagree, an arrow, one shared number. `role="img"`, `label` says it all. |
| `<Compare before after>` | Two framings side by side, the second emphasized; each has its own label. |
| `<StatRow stats>` / `<OutcomeStats stats>` | Small stats under an accent rule / big outcome cards. `spoken` overrides how a value is read aloud ("20–30" → "20 to 30"). |
| `<StakeholderMap label hub owner nodes>` + `<MapLegend owner others>` | SVG, tokens only. A ring from 480px of its own width, a vertical spine below that. The owner's sub-line names it as owner, so color is not the only cue. |
| `<ProcessFlow steps>` | Numbered `ol`, horizontal from 680px, vertical with down arrows below. `key` steps get a 2px accent border and a "Key step" note for screen readers. |
| `<DidInstead dropped why instead>` | What didn't work (struck through, cross icon) next to what I did instead (check icon). |
| `<Decision n title summary considered verdict>` | A `###` decision with its number, one sentence, its `<Screen />`s as children, and one "Considered" line. |
| `<BuildSplit mine tools>` | My part vs the tools' part, as chips. |
| `<OpenCards items>` | Still-open cards (dashed = not done). |
| `<SubIntro eyebrow headline lede>` | A sub-part inside a section (e.g. "Edge cases" in Process): `###` eyebrow plus a smaller headline. |
| `<FailureModes under over>` | Two ways something fails, side by side, with a small decorative pin drawing. |
| `<GapMatrix caption columns rows>` | A real `<table>` (caption, row and column headers) that scrolls inside its own frame on phones. Marks are ✓ ½ ✕ – with a spoken word each, and a key. Last column = ours. |
| `<PivotNote when title text>` | A dated moment that changed the plan. |
| `<Persona name role quote stats>` | Persona card next to big numbers. |
| `<FlowRow project clip alt eyebrow title steps decision flip component>` | One flow: its recording in a `<Phone>`, steps as pills, the key decision, an optional component loop. |
| `<ComponentStrip project items>` | Component loops cropped tight to the component, two across from 600px (an odd last item spans the row, text beside it), stacked on phones. |
| `<ClipFrame project clip alt>` | One component loop in a hairline frame (used by the two above and `TagOptions`). |
| `<TagOptions options component>` | Design options drawn as real chips, each with a status word; the product's chip colors are scoped `--recall-*` properties. The shipped component's loop sits beside a short caption. |
| `<ScopeSplit proven unproven quote next>` | Proven vs not proven (icon + word), then one quoted line. |
| `<EdgeCards project items>` | Edge-case cards with a still or a recording in a small phone. |
| `<HrDrift label caption start end cap distance stats>` | Heart rate over one run against a cap: SVG from tokens, the easy zone labelled in words, big stats beside it. |
| `<CompareTable caption columns rows>` | A comparison in words as a real `<table>`; the last column is ours (named in its header, tinted). |
| `<RuleCards rules loop>` | Rules written before the build (`firm` ones tinted, "Firm rule" for screen readers), then the work loop as pills. |
| `<DeviceFigures project items>` | The product off the phone in real photos (a Watch pair, a widget), with status pills that say their state in words. |
| `<MomentColumns project columns>` | Small details by moment (before, during, after): cards with a cropped still, a photo, a drawn notification or drawn lines. |
| `<TwoUp>` + `<Shot project name alt photo>` | Two visuals side by side inside a decision; `Shot` is a still cropped to one card (or a real photo). |
| `<Timeline items>` / `<PromptSample label lead sections end>` | A dated timeline (`now` entry tinted and named) / a sample of generated text, in Geist. |

`Decision` takes any visual as children, and its `summary` and "Considered" line are optional.

Every diagram has a text alternative (`role="img"` with a full `aria-label`, or real text in lists). Nothing carries meaning by color alone.

The template also renders a "Next project" link to the entry with the next `order` at the end of the page. Plain markdown prose still works inside a section (direct children of the section get the prose styles).

**Per-project media** lives in `src/assets/work/<slug>/` (each folder has a README with the file names and what each must show). A desktop project's **flow recording** is `flow.mp4`, `flow.webm` and `flow-poster.webp` in that folder (`flowMedia` in `stage-media.ts`): one continuous take of the product in use with a drawn cursor, shown in `Laptop.astro` on both the home card and the case-study hero. Laptop: generic dark bezel and thin base, no logo, 16:10 screen, video `object-fit: cover` from the top-left. The poster is the reduced-motion and no-JS fallback. AeroPulse's is recorded by `scripts/record-aeropulse-flow.mjs` (read-only on the live app; see the README in its media folder).

## Home page content you edit without touching code

- `src/data/facts.ts`: the falling facts (text and `ops` purple / `build` neutral kind).
- `src/data/lab.ts`: the "AI that works for me" heading, intro line and the cards (two today: the job search agent and the money app) (status is `active` / `paused` / `planned`; the pill differs by shape and word, never color alone).
- Contact (footer): email, LinkedIn URL and the CV link are constants at the top of `src/components/Footer.astro`.

**Falling facts behavior.** Server-rendered as the static resting layout (this is also what no-JS and `prefers-reduced-motion` show, and it is exposed as a list labelled "What I bring"). With motion allowed, once the portrait is 40% in view the facts drop once under matter-js at a fixed 1/60 s step, rest just below the photo's bottom edge, and the loop stops when every body sleeps. Pills start over their row slots (bottom rows first) and the settle is simulated off-screen first, so the pile stays below the face and hair line (`KEEP_CLEAR_FRACTION` in `FallingFacts.tsx`). Change the portrait and that constant needs a re-check.

## Files at a glance

```
src/
  styles/global.css          tokens, Tailwind mapping, base, focus, reduced motion, view transitions
  layouts/BaseLayout.astro   <head>, no-flash theme script, skip link, nav, main, footer
  components/
    Nav.astro                signature wordmark + capsule
    ThemeToggle.astro
    Footer.astro             #contact: email (selectable, copy, mailto), LinkedIn, CV download
    WorkCard.astro           home cards: product on top (laptop, phones or stage), title, tagline, tags
    Laptop.astro             generic laptop mockup playing a flow recording
    Phone.astro              generic phone mockup playing a recording (or any slot content); `native` variant
    Photo.astro              a real photo in a rounded frame (square, wide or its own shape)
    ComingSoonPhone.astro    the phone with a neutral "Case study coming soon" screen (comingSoon projects)
    Stage.astro              project hero stage (the only place for project colors)
    StageVideo.astro         muted looping recording (stage or laptop); plays only when motion is allowed and on screen
    WaypointScene.astro      Waypoint's CSS scene
    FallingFacts.tsx/.css    the React island
    AiLab.astro              "AI that works for me"
    Screen.astro             case-study screenshot: floating frame, one pin, placeholder when missing
    ExternalLink.astro       external link with icon and "opens in a new tab" name
    CaseStudyToc.astro
    case/                    case-study hero and section components (see above)
  content.config.ts          `work` schema
  content/work/*.mdx
  data/facts.ts, data/lab.ts home-page content
  assets/stages/             stage photos and recordings, picked up by file name (see its README)
  assets/work/<slug>/        case-study stills, flow recording and poster (see each README)
  lib/work-media.ts          finds a case-study still by project and file name
  lib/stage-media.ts         finds a project's stage media, flow recording and named clips by file name
  lib/work.ts                publishedWork(): entries in order, drafts left out
  lib/case-study.ts          SECTIONS, status and platform labels
  lib/rehype-case-study-sections.mjs
  lib/cv.ts                  CV path + size label
  pages/  index, about, accessibility, 404, work/[slug]
public/cv/liraz-hazala-perez-cv.pdf
scripts/record-aeropulse-flow.mjs   re-records AeroPulse's flow video (Playwright, not a dependency)
scripts/record-recall-flows.mjs     re-records Recall's three phone flows (same approach)
```
