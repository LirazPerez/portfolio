/**
 * The case-study outline. Every case study renders these sections, in this order,
 * with these ids. The TOC, the template and the MDX build check all read from here.
 * In MDX, write each section as `## <title>`; the title slugs to the id.
 */
export const SECTIONS = [
  { id: 'what-i-noticed', title: 'What I noticed' },
  { id: 'problem', title: 'Problem' },
  { id: 'how-i-ran-it', title: 'How I ran it' },
  { id: 'process', title: 'Process' },
  { id: 'decisions', title: 'Decisions' },
  { id: 'build', title: 'Build' },
  { id: 'outcome', title: 'Outcome' },
  { id: 'still-open', title: 'Still open' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

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
