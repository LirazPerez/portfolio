import { getCollection } from 'astro:content';

/** Every published case study (drafts left out), in home-page order. */
export async function publishedWork() {
  return (await getCollection('work', (entry) => !entry.data.draft)).sort((a, b) => a.data.order - b.data.order);
}
