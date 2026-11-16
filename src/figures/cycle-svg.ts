// SVG of the figure « cadran » : n positions on a circle, the positions
// already reached filled, a hand towards the current position and a ring on it.
// Only computed integers reach the markup.
import { position, type CycleState } from './cycle.ts';

export const WIDTH = 400;
export const HEIGHT = 270;
const CX = WIDTH / 2, CY = HEIGHT / 2, RADIUS = 92, LABEL_RADIUS = 114;

const round = (value: number) => Math.round(value * 100) / 100;

/** Position p of n: 0 at the top, clockwise. */
function point(p: number, n: number, radius: number) {
  const angle = (2 * Math.PI * p) / n;
  return { x: round(CX + radius * Math.sin(angle)), y: round(CY - radius * Math.cos(angle)) };
}

export function cycleSvg(state: CycleState): string {
  const { n, visited } = state;
  const current = position(state);
  const out: string[] = [];
  out.push(`<circle class="fig-axis cycle-rim" cx="${CX}" cy="${CY}" r="${RADIUS}" fill="none"/>`);
  const tip = point(current, n, RADIUS);
  out.push(`<line class="fig-segment fig-segment-a cycle-hand" x1="${CX}" y1="${CY}" x2="${tip.x}" y2="${tip.y}"/>`);
  out.push(`<circle class="fig-point fig-point-fixed" cx="${CX}" cy="${CY}" r="3"/>`);
  for (let p = 0; p < n; p++) {
    const at = point(p, n, RADIUS), label = point(p, n, LABEL_RADIUS);
    const cls = visited[p] ? 'fig-dot fig-dot-in' : 'fig-dot cycle-dot-unvisited';
    out.push(`<circle class="${cls}" cx="${at.x}" cy="${at.y}" r="5"/>`);
    out.push(`<text class="fig-tick cycle-label" x="${label.x}" y="${round(label.y + 4)}" text-anchor="middle">${p}</text>`);
  }
  out.push(`<circle class="fig-current-ring" cx="${tip.x}" cy="${tip.y}" r="10"/>`);
  return `<g aria-hidden="true">${out.join('')}</g>`;
}
