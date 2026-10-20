/**
 * The case-study outline. Every case study renders these sections, in this order,
 * with these ids. The TOC, the template and the MDX build check all read from here.
 * In MDX, write each section as `## <title>` (or `## <heading>` where one is given: the
 * visible eyebrow may differ from the TOC title); either slugs to the id. Other visible
 * headings for the same section are listed in ALIASES.
 * An `optional` section may be left out; when present it must sit in its place, and the
 * TOC lists it only on the pages that have it.
 */
export const SECTIONS = [
  { id: 'what-i-noticed', title: 'What I noticed' },
  { id: 'problem', title: 'Problem' },
  { id: 'system', title: 'The system', optional: true },
  { id: 'how-i-ran-it', title: 'How I ran it' },
  { id: 'process', title: 'Process' },
  { id: 'decisions', title: 'Decisions', heading: 'Key decisions' },
  { id: 'build', title: 'Build', heading: 'The build' },
  { id: 'outcome', title: 'Outcome' },
  { id: 'still-open', title: 'Still open' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/**
 * Visible `##` headings (slugged) that map to a section id. Keep in sync with ALIASES in
 * src/lib/rehype-case-study-sections.mjs.
 */
export const ALIASES: Record<string, SectionId> = {
  'key-decisions': 'decisions',
  'the-build': 'build',
  'problem-and-constraints': 'problem',
  'the-system-one-record-two-lenses': 'system',
  'process-including-what-didnt-work': 'process',
  result: 'outcome',
  'whats-still-open': 'still-open',
};

const slug = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

/** The sections a case-study body really has, in outline order (for the TOC). */
export function sectionsIn(body: string) {
  const found = new Set(
    [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => {
      const raw = slug(m[1]);
      return ALIASES[raw] ?? raw;
    }),
  );
  return SECTIONS.filter((s) => !('optional' in s) || found.has(s.id));
}

export const STATUS_LABEL = {
  shipped: 'Shipped',
  prototype: 'Prototype',
  'in-progress': 'In progress',
  concept: 'Concept',
} as const;

export const PLATFORM_LABEL = {
  desktop: 'Desktop',
  mobile: 'Mobile',
} as const;
