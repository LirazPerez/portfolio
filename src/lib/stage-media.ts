import type { ImageMetadata } from 'astro';

/**
 * Finds a project's stage media by filename in src/assets/stages/. Nothing to register:
 * drop the files in and the stage picks them up on the next build.
 *
 *   <slug>-light.<jpg|jpeg|png|webp|avif>   background photo for the light theme
 *   <slug>-dark.<jpg|jpeg|png|webp|avif>    background photo for the dark theme
 *   <slug>.<mp4|webm>                       muted looping screen recording
 *   <slug>-poster.<jpg|jpeg|png|webp|avif>  poster frame for that video
 *
 * If only one of -light / -dark exists it is used for both themes. See
 * src/assets/stages/README.md for the full list of expected file names.
 */
const images = import.meta.glob<ImageMetadata>('../assets/stages/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});
const videos = import.meta.glob<string>('../assets/stages/*.{mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function byName<T>(files: Record<string, T>): Map<string, T> {
  const out = new Map<string, T>();
  for (const [path, value] of Object.entries(files)) {
    const file = path.split('/').pop() ?? path;
    out.set(file.replace(/\.[^.]+$/, ''), value);
  }
  return out;
}

const imageByName = byName(images);

const VIDEO_TYPES: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm' };

export interface StageVideoSource {
  src: string;
  type: string;
}

export interface StageMedia {
  light?: ImageMetadata;
  dark?: ImageMetadata;
  poster?: ImageMetadata;
  videos: StageVideoSource[];
}

export function stageMedia(slug: string): StageMedia {
  const light = imageByName.get(`${slug}-light`);
  const dark = imageByName.get(`${slug}-dark`);
  const sources: StageVideoSource[] = [];
  for (const [path, src] of Object.entries(videos)) {
    const file = path.split('/').pop() ?? '';
    const [name, ext] = [file.replace(/\.[^.]+$/, ''), file.split('.').pop() ?? ''];
    if (name === slug && VIDEO_TYPES[ext]) sources.push({ src, type: VIDEO_TYPES[ext] });
  }
  return {
    light: light ?? dark,
    dark: dark ?? light,
    poster: imageByName.get(`${slug}-poster`),
    videos: sources,
  };
}
