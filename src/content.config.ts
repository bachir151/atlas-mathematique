import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * One MDX file per lesson in src/content/lessons/<slug>.mdx, published at
 * /cours/<slug>/ by src/pages/cours/[slug].astro. Authoring guide:
 * docs/GABARIT-LECON.md.
 *
 * status:
 * - placeholder: interface slots only, no scientific content (published);
 * - draft: content written but not validated by the project director — built
 *   only by `npm run dev` (or ATELIER_DRAFTS=1 for local checks), never in a
 *   normal production build;
 * - validated: requires `validation`, a reference to the director's decision.
 */
const lessons = defineCollection({
  loader: glob({ base: './src/content/lessons', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string().trim().min(1),
    // Optional two-part display title: "lead" then an emphasised line.
    heading: z.object({ lead: z.string().trim().min(1), emphasis: z.string().trim().min(1).optional() }).optional(),
    summary: z.string().trim().min(1),
    domain: z.enum(['Algèbre', 'Géométrie', 'Analyse']),
    number: z.string().regex(/^\d{2}$/, 'Numéro sur deux chiffres, par exemple "02"'),
    breadcrumb: z.string().trim().min(1).optional(),
    status: z.enum(['placeholder', 'draft', 'validated']),
    validation: z.string().trim().min(1).optional(),
    // In-page navigation; every id must exist in the page (checked by verify:build).
    sections: z.array(z.object({
      id: z.string().regex(/^[a-z][a-z0-9-]*$/),
      label: z.string().trim().min(1),
    })).min(1),
    companion: z.boolean().default(false),
  }).refine(lesson => lesson.status !== 'validated' || Boolean(lesson.validation), {
    message: 'Un cours « validated » exige une référence de validation dans « validation ».',
    path: ['validation'],
  }),
});

export const collections = { lessons };
