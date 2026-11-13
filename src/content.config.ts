import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ base: './src/content/lessons', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['awaiting-validation', 'validated']),
  }),
});

export const collections = { lessons };
