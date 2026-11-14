// Build-time KaTeX rendering for Markdown/MDX math, using the project's own
// KaTeX version (no second copy pulled in by a third-party plugin).
// Sätteri parses `$…$` (inline) and `$$…$$` (display) when `features.math` is
// enabled; this mdast plugin replaces those nodes with KaTeX HTML + MathML.
import katex from 'katex';

/** KaTeX options shared by Markdown math and the <Formula> component. */
export const katexOptions = Object.freeze({
  throwOnError: true, // invalid TeX fails the build instead of reaching readers
  trust: false, // no \href, \url, \htmlClass… : formulas cannot inject links or HTML
  strict: 'error',
  output: 'htmlAndMathml', // MathML for assistive technologies
});

function render(ctx, tex, displayMode) {
  try {
    return katex.renderToString(tex, { ...katexOptions, displayMode });
  } catch (error) {
    const where = ctx.fileURL ? decodeURIComponent(ctx.fileURL.pathname) : 'document';
    throw new Error(`Formule invalide dans ${where} : « ${tex} » — ${error.message}`);
  }
}

export const katexMath = {
  name: 'atelier-katex',
  inlineMath(node, ctx) {
    return { raw: render(ctx, node.value, false), mdxExpressions: false };
  },
  math(node, ctx) {
    // Wrapper lets long display formulas scroll horizontally on narrow screens.
    return { raw: `<div class="math-display">${render(ctx, node.value, true)}</div>`, mdxExpressions: false };
  },
};

/**
 * Markdown tables are wrapped in a horizontally scrollable region, so that a
 * wide table never widens the page on a narrow screen (WCAG 1.4.10 reflow).
 * The region is focusable so keyboard users can scroll it.
 */
export const scrollableTables = {
  name: 'atelier-tables',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Tableau défilant horizontalement' },
        children: [],
      });
    },
  },
};
