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
    /** Case-study eyebrow after "Case study ·", e.g. "Desktop SaaS". Falls back to the platform. */
    category: z.string().optional(),
    /** Up to two screens (file names in src/assets/work/<slug>/) floating beside the hero laptop. */
    /** Text alternative for the hero stage or laptop recording (role="img"). Falls back to a generic line. */
    stageAlt: z.string().optional(),
    /** Overrides the label for `status` on the case-study page, e.g. "Built and in daily use". */
    statusLabel: z.string().optional(),
    /** One line under the meta row: where the project comes from, and what is and is not shown. */
    origin: z.string().optional(),
    /** A live demo: a filled button in the case-study hero, opening in a new tab. */
    demo: z.object({ href: z.url(), label: z.string() }).optional(),
    /** Up to three summary bullets in the case-study hero, under the demo button. */
    highlights: z.array(z.string()).max(3).optional(),
    /** Numbered notes under the hero recording: what to notice in it, in order. */
    heroNotes: z.array(z.string()).max(4).optional(),
    /** Case-study lede under the title, when it should differ from the card's tagline. */
    lede: z.string().optional(),
    /**
     * A mobile project's recordings, each shown in a phone (src/assets/work/<slug>/<clip>.mp4,
     * .webm and <clip>-poster.*). The case-study hero shows them all, the middle one larger.
     */
    phones: z
      .array(z.object({ clip: z.string(), title: z.string(), caption: z.string(), alt: z.string() }))
      .max(3)
      .optional(),
    /** Which of `phones` (by clip) the home card shows. */
    cardPhones: z.array(z.string()).max(2).optional(),
    /**
     * The recordings were captured in the iOS Simulator and already show the phone's own status
     * bar and Dynamic Island: play them in the native phone (no drawn cutout, 590:1282 screen).
     */
    nativeScreen: z.boolean().optional(),
    /** A real photo (file name in src/assets/work/<slug>/) beside the card's phone, slightly tilted. */
    cardPhoto: z.object({ image: z.string(), alt: z.string() }).optional(),
    /** A real photo after the hero's phones, as the last of the row, with its own caption. */
    heroPhoto: z.object({ image: z.string(), title: z.string(), caption: z.string(), alt: z.string() }).optional(),
    /** The case study is not written yet: the page says it's coming soon. */
    comingSoon: z.boolean().optional(),
    /** Hidden everywhere: no card, no page, no "Next project" link. The file is kept. */
    draft: z.boolean().optional(),
  }),
});

export const collections = { work };
