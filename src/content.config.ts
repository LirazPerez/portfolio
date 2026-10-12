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
    /** The card's "What I noticed" line: the one observation the project started from. */
    noticed: z.string(),
    /** One annotation, numbered 1 on the card, pointing at a detail in the hero stage. */
    annotation: z.string(),
    /** Text alternative for the hero stage (role="img"). Falls back to a generic placeholder line. */
    stageAlt: z.string().optional(),
    /** Overrides the label for `status` on the case-study page, e.g. "Built and in daily use". */
    statusLabel: z.string().optional(),
    /** One line under the meta row: where the project comes from, and what is and is not shown. */
    origin: z.string().optional(),
  }),
});

export const collections = { work };
