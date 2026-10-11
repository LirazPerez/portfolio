// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import rehypeCaseStudySections from './src/lib/rehype-case-study-sections.mjs';

export default defineConfig({
  site: 'https://lirazhazala.com',
  // Astro 7's default Markdown processor skips rehype plugins; opt into unified so the
  // case-study section wrapper runs. MDX inherits this processor.
  markdown: { processor: unified({ rehypePlugins: [rehypeCaseStudySections] }) },
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
    // V00/ and V01/ are archived material (several GB, nested repos). Keep the dev server out of them.
    server: { watch: { ignored: ['**/V00/**', '**/V01/**', '**/reference/**'] } },
  },
});
