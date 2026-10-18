/**
 * Every word and number on the About page. Edit text here; the layout is in
 * src/pages/about.astro and src/components/about/.
 *
 * Copy rules: sentence case, plain hyphens only (2022-2024, never an en or em dash).
 * Dates that place things on the timeline are 'YYYY-MM' (month 01-12). The timeline's
 * start year and today are read from here and from the build date.
 */

export const ABOUT_TITLE = 'About';

/* ---------- 1. Opening ---------- */

export const OPENING = {
  eyebrow: 'About',
  /** The h1 in two parts: `accent` is set in the accent color, like the home headline. */
  headline: { lead: 'I learned design in New York', accent: 'while running defense programs there.' },
  lede: 'For six years I worked full time on international defense programs and studied design full time at FIT. Now I design products and build them.',
  pills: ['Tel Aviv, Israel', 'Hebrew and English', 'Design and code'],
  portraitAlt: 'Liraz Hazala Perez',
  /**
   * Clay objects from the home hero, resting beside the headline. Each one opens a row of
   * "My path": `entry` is the timeline entry it selects (an `id` in PATH_ROWS).
   * `label` shows on hover or focus; `ariaLabel` must contain the label's words.
   * `x`, `y`, `w` place it in a 360 x 300 box (px at full size, top-left of the image),
   * `r` tilts it in degrees, `z` stacks it (higher is in front). Listed in timeline order,
   * which is also the order on phones and for the keyboard.
   */
  objects: [
    { id: 'obj-beret', entry: 'army', label: 'Army', ariaLabel: 'Clay beret, see my army years in the timeline', x: 30, y: 74, w: 132, r: -12, z: 3 },
    { id: 'obj-statue-of-liberty', entry: 'ministry', label: 'Ministry of Defense, New York', ariaLabel: 'Clay Statue of Liberty, see my Ministry of Defense, New York years in the timeline', x: 150, y: 6, w: 96, r: 4, z: 1 },
    { id: 'obj-grad-cap', entry: 'bfa', label: 'Design school', ariaLabel: 'Clay graduation cap, see my design school years in the timeline', x: 206, y: 176, w: 140, r: 9, z: 3 },
    { id: 'obj-laptop', entry: 'freelance', label: 'Product design', ariaLabel: 'Clay laptop, see my product design work in the timeline', x: 6, y: 140, w: 172, r: -6, z: 2 },
  ],
};

/* ---------- 2. My path (the timeline) ---------- */

/** Each row has its own color family (tokens `--path-<family>` in global.css). */
export type PathFamily = 'army' | 'ministry' | 'school' | 'product' | 'awards';

export interface PathEntry {
  id: string;
  /** Muted line above the title in the details. */
  when: string;
  title: string;
  text: string;
  /** Short dates, shown on phones and read out with the bar's name. */
  dates: string;
  /** Where it sits: 'YYYY-MM'. A diamond only needs `start`. */
  start: string;
  /** 'today' runs to the build date. */
  end?: string | 'today';
  /** Text inside the bar (desktop). Bars without one show no text. */
  barLabel?: string;
  /** The bar fades out on the right: still going. */
  ongoing?: boolean;
  /** Put this bar in the row's lower lane (two bars that overlap in time). */
  lane?: 2;
}

export interface PathRow {
  id: string;
  label: string;
  sub?: string;
  family: PathFamily;
  /** 'markers' = the thin row of diamonds. */
  kind: 'bars' | 'markers';
  entries: PathEntry[];
}

export const PATH = {
  heading: 'My path',
  startYear: 2017,
  /** The soft tinted band and its legend. */
  newYork: { from: '2021-01', legend: 'New York' },
  /** Shown in the details panel before anyone touches the timeline. */
  initial: 'ministry',
  todayLabel: 'Today',
  /** Under the heading: one line for a mouse, one for touch screens (chosen by media query). */
  hint: { pointer: 'Hover or click a bar to read more', touch: 'Tap a row to read more' },
};

export const PATH_ROWS: PathRow[] = [
  {
    id: 'army',
    label: 'Army',
    sub: 'Israel',
    family: 'army',
    kind: 'bars',
    entries: [
      {
        id: 'army',
        when: '2017-2021 · Israel Defense Forces',
        title: 'War room, then deputy company commander',
        text: 'I started in observation and ran a war room as a platoon commander. As deputy company commander I commanded from the war room: holding the full picture, coordinating every force and decision through an event, and leading 150 soldiers and 40 intelligence personnel.',
        dates: '2017-2021',
        start: '2017-01',
        end: '2021-01',
        barLabel: 'Deputy company commander',
      },
    ],
  },
  {
    id: 'ministry',
    label: 'Ministry of Defense',
    sub: 'Mission in New York',
    family: 'ministry',
    kind: 'bars',
    entries: [
      {
        id: 'ministry-procurement',
        when: '2021-2023 · Israeli Ministry of Defense, New York',
        title: 'Procurement specialist, air systems',
        text: 'Contracts and procurement for the air systems department, the role I was promoted from in 2023.',
        dates: '2021-2023',
        start: '2021-01',
        end: '2023-01',
        barLabel: 'Procurement',
      },
      {
        id: 'ministry',
        when: '2023-2026 · Israeli Ministry of Defense, New York',
        title: 'Senior project manager, procurement',
        text: 'Global logistics and procurement budgets in the hundreds of millions of dollars, a 30% cost reduction, and a contract pipeline of 15+ international vendors including the U.S. Armed Forces.',
        dates: '2023-2026',
        start: '2023-01',
        end: '2026-07',
        barLabel: 'Senior project manager',
      },
    ],
  },
  {
    id: 'school',
    label: 'Design school',
    sub: 'FIT, SUNY',
    family: 'school',
    kind: 'bars',
    entries: [
      {
        id: 'associate',
        when: "2022-2024 · FIT, SUNY · Dean's List",
        title: 'Associate degree (AAS), Communication Design Foundation',
        text: "FIT's foundation in communication design: design studio, typography, vector graphics and design history, across advertising, graphic, packaging and exhibition design, ending in a capstone studio. It leads into FIT's bachelor's programs.",
        dates: 'Aug 2022-May 2024',
        start: '2022-08',
        end: '2024-05',
        barLabel: 'Associate degree',
      },
      {
        id: 'bfa',
        when: "2024-2026 · FIT, SUNY · Dean's List",
        title: 'Bachelor of Fine Arts, Advertising and Digital Design',
        text: 'Art direction, copy, brand strategy and digital design. The digital track covers UX and UI: design systems for UX and UI, user experience and interaction design, and kinetic typography.',
        dates: 'Aug 2024-May 2026',
        start: '2024-08',
        end: '2026-05',
        barLabel: "Bachelor's, BFA",
      },
    ],
  },
  {
    id: 'product',
    label: 'Product design',
    family: 'product',
    kind: 'bars',
    entries: [
      {
        id: 'internship',
        when: 'May-Aug 2026 · New York',
        title: 'Product design intern, Vibe Code Mama',
        text: 'Owned the MVP design end to end. Changed the product direction based on how users behaved, and built the UI in React and Tailwind with Claude Code.',
        dates: 'May-Aug 2026',
        start: '2026-05',
        end: '2026-08',
      },
      {
        id: 'freelance',
        when: 'July 2026 to today · Self-employed',
        title: 'Freelance product designer and builder',
        text: 'I design and build working tools for clients, from user research and flows to production. One of them, an internal logistics and inventory system, is used daily by 20-30 people and saves the team 8-10 hours a week.',
        dates: 'July 2026 to today',
        start: '2026-07',
        end: 'today',
        ongoing: true,
        lane: 2,
      },
    ],
  },
  {
    id: 'awards',
    label: 'Awards and training',
    family: 'awards',
    kind: 'markers',
    // Diamonds close in time are spread apart automatically, so they never overlap.
    entries: [
      {
        id: 'head-of-mission',
        when: '2022 · Ministry of Defense',
        title: 'Head of Mission Award',
        text: 'For excellence in contract execution.',
        dates: '2022',
        start: '2022-04',
      },
      {
        id: 'mentorship',
        when: '2022 · Ministry of Defense training',
        title: 'Mentorship and Onboarding',
        text: 'Certified to train new staff. I went on to train and certify many of them.',
        dates: '2022',
        start: '2022-08',
      },
      {
        id: 'negotiation',
        when: '2024 · External workshop',
        title: 'Advanced Negotiation',
        text: 'A week-long external workshop on negotiation strategy and the psychology behind it.',
        dates: '2024',
        start: '2024-02',
      },
      {
        id: 'deans-list-associate',
        when: '2024 · FIT',
        title: "Dean's List, associate degree",
        text: 'Communication Design Foundation.',
        dates: 'May 2024',
        start: '2024-05',
      },
      {
        id: 'ai-coding',
        when: '2026 · Memorisely',
        title: 'AI Coding for Designers',
        text: 'Four weeks of design engineering with Cursor and Claude Code: Next.js, Tailwind tokens, shadcn/ui and GitHub. Where I started building what I design.',
        dates: '2026',
        start: '2026-02',
      },
      {
        id: 'claude-design',
        when: '2026 · Memorisely',
        title: 'Claude Design: AI Prototyping with Design Systems',
        text: 'Structuring a design system as tokens and components, then turning it into high-fidelity, testable prototypes.',
        dates: '2026',
        start: '2026-03',
      },
      {
        id: 'deans-list-bfa',
        when: '2026 · FIT',
        title: "Dean's List, bachelor's degree",
        text: 'Advertising and Digital Design.',
        dates: 'May 2026',
        start: '2026-05',
      },
    ],
  },
];

/* ---------- 3. The certificates on my wall ---------- */

export interface Certificate {
  issuer: string;
  title: string;
  line: string;
  years: string;
  deansList?: boolean;
  /** Compact card (second row): small muted description. */
  compact?: boolean;
}

export const CERTIFICATES = {
  heading: 'The certificates on my wall',
  deansListLabel: "Dean's List",
  /** In this order: row 1 the three big ones (BFA, associate, award), row 2 four compact ones. */
  items: [
    {
      issuer: 'Fashion Institute of Technology, SUNY · New York',
      title: 'Bachelor of Fine Arts, Advertising and Digital Design',
      line: 'Art direction, brand strategy and digital product design, including UX and UI.',
      years: '2024-2026',
      deansList: true,
    },
    {
      issuer: 'Fashion Institute of Technology, SUNY',
      title: 'Associate degree, Communication Design Foundation',
      line: 'Typography, layout and design studio.',
      years: '2022-2024',
      deansList: true,
    },
    {
      issuer: 'Israeli Ministry of Defense',
      title: 'Head of Mission Award',
      line: 'For excellence in contract execution.',
      years: '2022',
    },
    {
      issuer: 'Memorisely',
      title: 'AI Coding for Designers',
      line: 'Design engineering with Cursor and Claude Code.',
      years: '2026',
      compact: true,
    },
    {
      issuer: 'Memorisely',
      title: 'Claude Design: AI Prototyping with Design Systems',
      line: 'From a design system to testable prototypes.',
      years: '2026',
      compact: true,
    },
    {
      issuer: 'Ministry of Defense training',
      title: 'Mentorship and Onboarding',
      line: 'Certified to train and certify new staff.',
      years: '2022',
      compact: true,
    },
    {
      issuer: 'External workshop',
      title: 'Advanced Negotiation',
      line: 'A week-long workshop on negotiation strategy and the psychology behind it.',
      years: '2024',
      compact: true,
    },
  ] satisfies Certificate[],
};

/* ---------- 4. Before design ---------- */

export const BEFORE_DESIGN = {
  heading: 'Before design',
  subtitle: 'Before I designed tools for operations, I ran them.',
  /** `family` colors the small dot next to the source (the same colors as the timeline rows). */
  stats: [
    {
      value: '30%',
      text: 'cost reduction on logistics and procurement budgets in the hundreds of millions of dollars',
      source: 'Ministry of Defense',
      family: 'ministry',
    },
    {
      value: '15+',
      text: 'international vendors in my contract pipeline, the U.S. Armed Forces among them',
      source: 'Ministry of Defense',
      family: 'ministry',
    },
    {
      value: '4-6',
      spoken: '4 to 6',
      text: 'projects at once, across finance, legal and shipping teams',
      source: 'Ministry of Defense',
      family: 'ministry',
    },
    { value: '150', text: 'soldiers in my company, plus 40 intelligence personnel I led', source: 'Army', family: 'army' },
    { value: '45+', text: 'soldiers trained on operational protocols', source: 'Army', family: 'army' },
    { value: '100+', text: 'community members using a design language I set up', source: 'Vibe Code Mama', family: 'product' },
  ] satisfies { value: string; spoken?: string; text: string; source: string; family: PathFamily }[],
};

/* ---------- 5. Design, build, run ---------- */

export const DESIGN_BUILD_RUN = {
  heading: 'Design, build, run',
  cards: [
    {
      title: 'I design',
      points: [
        'Research, flows and wireframes to high-fidelity UI',
        'Design systems and tokens in Figma',
        'Motion and prototypes people can tap',
      ],
    },
    {
      title: 'I build',
      points: [
        'From design to a working product with Claude Code, Cursor and Base44',
        'Every project on this site runs as real code',
        'This site too, from first commit to launch',
      ],
    },
    {
      title: 'I run the project',
      points: [
        'Stakeholders, budgets and contracts across two countries',
        'One clear picture for everyone involved',
        'Realistic timelines, and I keep them',
      ],
    },
    {
      title: 'Languages I work in',
      points: [
        'Hebrew, native. English, fluent',
        'HTML, CSS and React, enough to build and fix',
        "AI agents: I brief them the way I'd brief a team",
      ],
    },
  ],
};

/* ---------- 6. Off the clock ---------- */

export const OFF_THE_CLOCK = {
  heading: 'Off the clock',
  subtitle: 'For anyone who picked something up on the home page.',
  /**
   * `photo` is the file name in src/assets/about/ (without extension), filled by
   * scripts/import-about-photos.mjs. Until it exists the card shows a neutral tile.
   * `link` turns those words of `line` into a link.
   */
  items: [
    {
      photo: 'bobby',
      alt: 'Liraz crouching with Bobby, her Goldendoodle puppy, on a riverside walk with the Manhattan skyline behind them',
      title: 'Bobby',
      line: 'My Goldendoodle, and the real manager of the house',
    },
    {
      photo: 'running',
      alt: 'Liraz walking with Bobby on a sunny city street, in workout clothes',
      title: 'Half marathon',
      line: 'Training with Neta, the coach app I built for it',
      link: { text: 'Neta', href: '/work/neta' },
    },
    {
      photo: 'snowboarding',
      alt: 'Liraz smiling on a snowy mountain slope, standing by her snowboard',
      title: 'Snowboarding',
      line: "Whenever there's snow within a flight",
    },
    {
      photo: 'trails',
      alt: 'Liraz crossing a glacial stream on a fallen log, holding a rope line, with trekking poles',
      title: 'Trails around the world',
      line: 'Always planning the next trek',
    },
  ] as { photo: string; alt: string; title: string; line: string; link?: { text: string; href: string } }[],
};

/* ---------- 7. Closing ---------- */

export const CLOSING = {
  heading: 'Want the short version?',
  cv: 'Download CV (PDF)',
};
