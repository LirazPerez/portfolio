import type { ImageMetadata } from 'astro';

/**
 * About page photos, found by file name in src/assets/about/ (written by
 * scripts/import-about-photos.mjs). A photo that is not there yet returns undefined, and the
 * page shows a neutral tile in its place instead of failing the build.
 */
const files = import.meta.glob<ImageMetadata>('../assets/about/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

const index = new Map<string, ImageMetadata>();
for (const [path, meta] of Object.entries(files)) {
  index.set((path.split('/').pop() ?? '').replace(/\.[^.]+$/, ''), meta);
}

export function aboutPhoto(name: string): ImageMetadata | undefined {
  return index.get(name);
}
