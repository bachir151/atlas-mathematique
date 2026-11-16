// SVG of the figure « permutations » : n slots numbered 1..n, a card in each
// slot (labelled by its initial position, placed at its current position) and
// one arrow per image x ↦ σ(x) between slots: arcs above for σ(x) > x, below
// for σ(x) < x, a small loop for a fixed point. Colour = cycle (also given in
// text). Only computed integers reach the markup.
import { cycles, type PermState } from './perm.ts';

export const WIDTH = 400;
export const HEIGHT = 240;
const LEFT = 20, ROW_Y = 120, HALF = 20;

const round = (value: number) => Math.round(value * 100) / 100;

export function permSvg(state: PermState): string {
  const { n, images, positions } = state;
  const step = Math.min(64, (WIDTH - 2 * LEFT) / n);
  const start = (WIDTH - step * n) / 2;
  const cx = (position: number) => round(start + (position - 0.5) * step);
  const colorOf = new Map<number, number>();
  cycles(images).forEach((cycle, index) => cycle.forEach(x => colorOf.set(x, index % 5)));

  const arrows: string[] = [];
  for (let x = 1; x <= n; x++) {
    const y = images[x - 1], cls = `perm-arrow perm-c${colorOf.get(x)}`;
    if (x === y) {
      const px = cx(x);
      arrows.push(`<path class="${cls}" d="M ${round(px - 8)} ${ROW_Y - HALF - 2} C ${round(px - 14)} ${ROW_Y - HALF - 24} ${round(px + 14)} ${ROW_Y - HALF - 24} ${round(px + 8)} ${ROW_Y - HALF - 2}"/>`);
      arrows.push(`<polygon class="perm-head perm-c${colorOf.get(x)}" points="${round(px + 8)},${ROW_Y - HALF - 1} ${round(px + 2)},${ROW_Y - HALF - 8} ${round(px + 13)},${ROW_Y - HALF - 8}"/>`);
      continue;
    }
    const up = y > x, sign = up ? -1 : 1;
    const y0 = ROW_Y + sign * (HALF + 2);
    const x1 = cx(x) + (up ? 5 : -5), x2 = cx(y) + (up ? -5 : 5);
    const ctrlY = round(y0 + sign * (16 + 22 * Math.abs(y - x)));
    const mx = round((x1 + x2) / 2);
    arrows.push(`<path class="${cls}" d="M ${round(x1)} ${y0} Q ${mx} ${ctrlY} ${round(x2)} ${y0}"/>`);
    // Arrowhead along the tangent at the end point (from the control point).
    const dx = x2 - mx, dy = y0 - ctrlY, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const bx = x2 - 9 * ux, by = y0 - 9 * uy;
    arrows.push(`<polygon class="perm-head perm-c${colorOf.get(x)}" points="${round(x2)},${y0} ${round(bx + 4 * px)},${round(by + 4 * py)} ${round(bx - 4 * px)},${round(by - 4 * py)}"/>`);
  }

  const slots: string[] = [];
  for (let p = 1; p <= n; p++) {
    slots.push(`<rect class="perm-slot" x="${round(cx(p) - HALF - 3)}" y="${ROW_Y - HALF - 3}" width="${2 * HALF + 6}" height="${2 * HALF + 6}" rx="4"/>`);
    slots.push(`<text class="fig-tick" x="${cx(p)}" y="${ROW_Y + HALF + 20}" text-anchor="middle">${p}</text>`);
  }
  const cards: string[] = [];
  for (let c = 1; c <= n; c++) {
    cards.push(`<rect class="perm-card perm-c${colorOf.get(c)}" x="${round(cx(positions[c - 1]) - HALF)}" y="${ROW_Y - HALF}" width="${2 * HALF}" height="${2 * HALF}" rx="4"/>`);
    cards.push(`<text class="perm-card-label" x="${cx(positions[c - 1])}" y="${ROW_Y + 6}" text-anchor="middle">${c}</text>`);
  }
  return `<g aria-hidden="true">${slots.join('')}</g><g>${arrows.join('')}</g><g>${cards.join('')}</g>`;
}
