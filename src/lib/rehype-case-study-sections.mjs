/**
 * Wraps each `## heading` in a case-study MDX file, plus everything after it up to the
 * next `##`, in <section id="<slug>" aria-labelledby="<slug>-heading">.
 * Fails the build if the headings don't match SECTIONS in src/lib/case-study.ts,
 * so section ids stay stable for the TOC and for deep links.
 */
const OUTLINE = [
  'what-i-noticed', 'problem', 'system', 'how-i-ran-it', 'process',
  'decisions', 'build', 'outcome', 'still-open',
]; // keep in sync with SECTIONS
const OPTIONAL = new Set(['system']); // sections with `optional: true`

// A section's visible heading may use other words than its TOC title; its id stays the same.
// Keep in sync with ALIASES in src/lib/case-study.ts.
const ALIASES = {
  'key-decisions': 'decisions',
  'the-build': 'build',
  'problem-and-constraints': 'problem',
  'the-system-one-record-two-lenses': 'system',
  'one-number-five-roles': 'system',
  'process-including-what-didnt-work': 'process',
  result: 'outcome',
  'whats-still-open': 'still-open',
};

const slug = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const textOf = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join('');

export default function rehypeCaseStudySections() {
  return (tree, file) => {
    const path = String(file.path ?? file.history?.[0] ?? '');
    if (!path.includes('/content/work/')) return;

    const out = [];
    const ids = [];
    let current = null;
    for (const node of tree.children) {
      if (node.type === 'element' && node.tagName === 'h2') {
        const raw = slug(textOf(node));
        const id = ALIASES[raw] ?? raw;
        ids.push(id);
        node.properties = { ...node.properties, id: `${id}-heading` };
        current = {
          type: 'element',
          tagName: 'section',
          properties: { id, ariaLabelledBy: `${id}-heading`, className: ['cs-section'] },
          children: [node],
        };
        out.push(current);
      } else if (current) {
        current.children.push(node);
      } else {
        out.push(node);
      }
    }
    if (ids.length === 0) return; // empty body: the template renders placeholders
    const expected = OUTLINE.filter((id) => !OPTIONAL.has(id) || ids.includes(id));
    if (ids.join() !== expected.join()) {
      throw new Error(
        `[case study] ${path}\nSections must be, in order: ${OUTLINE.join(', ')} (optional: ${[...OPTIONAL].join(', ')})\nFound: ${ids.join(', ')}`,
      );
    }
    tree.children = out;
  };
}
