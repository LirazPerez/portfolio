import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    /** One sentence. Shown on the card and under the case-study title. */
    tagline: z.string(),
    /** Position on the home page, 1 first. */
    order: z.number().int().positive(),
    /** Decides the card layout: desktop = large landscape card, mobile = phone card. */
    platform: z.enum(['desktop', 'mobile']),
    role: z.string(),
    duration: z.string(),
    tools: z.array(z.string()),
    status: z.enum(['shipped', 'prototype', 'in-progress', 'concept']),
    tags: z.array(z.string()),
  }),
});

export const collections = { work };
