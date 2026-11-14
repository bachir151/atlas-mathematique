import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { katexMath, scrollableTables } from './src/lib/math-plugin.mjs';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  // $…$ and $$…$$ in lessons, rendered at build time by KaTeX (see src/lib/math-plugin.mjs).
  // No Shiki: its inline styles conflict with the CSP below; lessons need no code highlighting.
  markdown: { syntaxHighlight: false, processor: satteri({ features: { math: true }, mdastPlugins: [katexMath], hastPlugins: [scrollableTables] }) },
  // This prototype uses local SVG only: no image transformation service is needed.
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
  devToolbar: { enabled: false },
  // Content Security Policy as a <meta> element on every built page (not in dev).
  // Astro hashes its own inline and bundled scripts; nothing else may run.
  // Netlify adds the directives a <meta> cannot carry (netlify.toml).
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "connect-src 'self'", // p5.js would otherwise fetch translations from jsDelivr (docs/P5.md)
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // KaTeX output and the Atlas map position elements with style="" attributes.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
});
