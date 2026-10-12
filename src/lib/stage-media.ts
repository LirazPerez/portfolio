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
 * A project's own folder works too, for media that belongs to its case study:
 *
 *   src/assets/work/<slug>/stage.<mp4|webm>        the recording (same role as <slug>.mp4)
 *   src/assets/work/<slug>/stage-poster.<ext>      its poster frame
 *
 * The project folder wins when both exist. If only one of -light / -dark exists it is
 * used for both themes. See src/assets/stages/README.md and the README in each work
 * folder for the expected file names.
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

const workImages = import.meta.glob<ImageMetadata>('../assets/work/*/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});
const workVideos = import.meta.glob<string>('../assets/work/*/*.{mp4,webm}', {
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

function videoSources(files: Record<string, string>, matches: (folder: string, name: string) => boolean) {
  const sources: StageVideoSource[] = [];
  for (const [path, src] of Object.entries(files)) {
    const parts = path.split('/');
    const file = parts.pop() ?? '';
    const folder = parts.pop() ?? '';
    const name = file.replace(/\.[^.]+$/, '');
    const ext = file.split('.').pop() ?? '';
    const type = VIDEO_TYPES[ext];
    if (type && matches(folder, name)) sources.push({ src, type });
  }
  return sources;
}

export function stageMedia(slug: string): StageMedia {
  const light = imageByName.get(`${slug}-light`);
  const dark = imageByName.get(`${slug}-dark`);

  // The project's own folder first, then the shared stages folder.
  const ownSources = videoSources(workVideos, (folder, name) => folder === slug && name === 'stage');
  const sources = ownSources.length > 0 ? ownSources : videoSources(videos, (_folder, name) => name === slug);

  const ownPoster = Object.entries(workImages).find(([path]) =>
    path.endsWith(`/work/${slug}/stage-poster.${path.split('.').pop()}`),
  )?.[1];

  return {
    light: light ?? dark,
    dark: dark ?? light,
    poster: ownPoster ?? imageByName.get(`${slug}-poster`),
    videos: sources,
  };
}
