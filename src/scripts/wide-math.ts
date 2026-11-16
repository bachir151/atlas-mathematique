// A long inline formula cannot be broken across lines (KaTeX only breaks after
// relations and binary operators). When it is wider than its line, it scrolls
// inside its own box instead of widening the page (WCAG 1.4.10), as display
// formulas and tables already do. Narrow formulas are left untouched, so the
// baseline of ordinary inline math is never altered.

const WIDE = 'katex-wide';

/** Content width of the nearest block ancestor, in pixels. */
function lineWidth(element: HTMLElement): number {
  const block = element.closest<HTMLElement>('p, li, dd, td, th, summary, h3') ?? element.parentElement;
  if (!block) return Infinity;
  const style = getComputedStyle(block);
  return block.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

export function markWideInlineMath(root: ParentNode = document): void {
  const formulas = root.querySelectorAll<HTMLElement>('.lesson-content .katex');
  for (const formula of formulas) {
    if (formula.closest('.math-display')) continue;
    const wide = formula.classList.contains(WIDE);
    // Natural width: the scroll width when already constrained.
    const natural = wide ? formula.scrollWidth : formula.getBoundingClientRect().width;
    const tooWide = natural > lineWidth(formula) + 1;
    if (tooWide === wide) continue;
    formula.classList.toggle(WIDE, tooWide);
    if (tooWide) formula.tabIndex = 0;
    else formula.removeAttribute('tabindex');
  }
}

export function initWideMath(): void {
  markWideInlineMath();
  let frame = 0;
  let width = document.documentElement.clientWidth;
  new ResizeObserver(() => {
    const next = document.documentElement.clientWidth;
    if (next === width) return;
    width = next;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => markWideInlineMath());
  }).observe(document.documentElement);
}
