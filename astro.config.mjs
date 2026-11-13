import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  // This prototype uses local SVG only. Disable Sharp image decoding while the
  // dependency migration is pending; this does not remove npm advisories.
  image: { service: { entrypoint: 'astro/assets/services/noop' } },
  devToolbar: { enabled: false },
});
