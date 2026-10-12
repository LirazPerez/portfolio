import type { ImageMetadata } from 'astro';

/**
 * Case-study screenshots, found by file name in src/assets/work/<project>/.
 * Nothing to import by hand: drop `<name>.webp` (or jpg, png, avif) into the project's
 * folder and a `<Screen project="<project>" name="<name>" />` in the MDX picks it up on
 * the next build. A missing file renders a clearly tagged placeholder instead of
 * failing the build, so a case study can be written before its screens exist.
 */
const files = import.meta.glob<ImageMetadata>('../assets/work/*/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

const index = new Map<string, ImageMetadata>();
for (const [path, meta] of Object.entries(files)) {
  const parts = path.split('/');
  const file = parts.pop() ?? '';
  const folder = parts.pop() ?? '';
  index.set(`${folder}/${file.replace(/\.[^.]+$/, '')}`, meta);
}

export function workScreen(project: string, name: string): ImageMetadata | undefined {
  return index.get(`${project}/${name}`);
}
