/**
 * Wraps each `## heading` in a case-study MDX file, plus everything after it up to the
 * next `##`, in <section id="<slug>" aria-labelledby="<slug>-heading">.
 * Fails the build if the headings don't match SECTIONS in src/lib/case-study.ts,
 * so section ids stay stable for the TOC and for deep links.
 */
const EXPECTED = [
  'what-i-noticed', 'problem', 'how-i-ran-it', 'process',
  'decisions', 'build', 'outcome', 'still-open',
]; // keep in sync with SECTIONS

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
        const id = slug(textOf(node));
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
    if (ids.join() !== EXPECTED.join()) {
      throw new Error(
        `[case study] ${path}\nSections must be, in order: ${EXPECTED.join(', ')}\nFound: ${ids.join(', ')}`,
      );
    }
    tree.children = out;
  };
}
