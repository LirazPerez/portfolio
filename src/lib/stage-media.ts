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
 * src/assets/stages/README.md for the expected file names.
 *
 * A desktop project's flow recording lives in its own folder and is shown in the laptop
 * mockup (home card and case-study hero) instead of the stage; see `flowMedia` below:
 *
 *   src/assets/work/<slug>/flow.<mp4|webm>     one continuous recording of the app in use
 *   src/assets/work/<slug>/flow-poster.<ext>   its first frame (reduced motion and no JS)
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

  return {
    light: light ?? dark,
    dark: dark ?? light,
    poster: imageByName.get(`${slug}-poster`),
    videos: videoSources(videos, (_folder, name) => name === slug),
  };
}

export interface FlowMedia {
  poster?: ImageMetadata;
  videos: StageVideoSource[];
}

/** The project's flow recording, or null when it has none (then the stage is used). */
export function flowMedia(slug: string): FlowMedia | null {
  const sources = videoSources(workVideos, (folder, name) => folder === slug && name === 'flow');
  if (sources.length === 0) return null;
  // MP4 first: every browser plays it, so it should be the one picked.
  sources.sort((a, b) => (a.type === 'video/mp4' ? -1 : 0) - (b.type === 'video/mp4' ? -1 : 0));
  const poster = Object.entries(workImages).find(([path]) =>
    /\/work\/[^/]+\/flow-poster\.[a-z]+$/.test(path) && path.includes(`/work/${slug}/`),
  )?.[1];
  return { poster, videos: sources };
}
