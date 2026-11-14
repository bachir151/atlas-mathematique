import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { katexMath } from './src/lib/math-plugin.mjs';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  // $…$ and $$…$$ in lessons, rendered at build time by KaTeX (see src/lib/math-plugin.mjs).
  markdown: { processor: satteri({ features: { math: true }, mdastPlugins: [katexMath] }) },
  // This prototype uses local SVG only: no image transformation service is needed.
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
  devToolbar: { enabled: false },
});
