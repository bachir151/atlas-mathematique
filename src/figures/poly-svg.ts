// SVG of the figure « division par X − a » : the discrete graph of P on the
// integers −4 … 4 (one dot per integer, a thin stem down to the axis), with the
// point (a, P(a)) highlighted. Only computed integers reach the markup.
import { GRAPH_MAX, GRAPH_MIN, int, type PolyReading, type PolyState } from './poly.ts';

export const WIDTH = 400;
export const HEIGHT = 250;
const LEFT = 52, RIGHT = 20, TOP = 34, BOTTOM = 36;

const round = (value: number) => Math.round(value * 100) / 100;

export function polySvg(state: PolyState, reading: PolyReading): string {
  const ys = reading.graph.map(point => point.y);
  const ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys);
  const span = ymax - ymin || 1;
  const sx = (x: number) => round(LEFT + ((x - GRAPH_MIN) / (GRAPH_MAX - GRAPH_MIN)) * (WIDTH - LEFT - RIGHT));
  const sy = (y: number) => round(TOP + ((ymax - y) / span) * (HEIGHT - TOP - BOTTOM));
  const zero = sy(0);
  const grid: string[] = [];
  grid.push(`<line class="fig-axis" x1="${LEFT}" y1="${zero}" x2="${WIDTH - RIGHT}" y2="${zero}"/>`);
  for (let x = GRAPH_MIN; x <= GRAPH_MAX; x++) {
    grid.push(`<line class="fig-grid" x1="${sx(x)}" y1="${zero - 4}" x2="${sx(x)}" y2="${zero + 4}"/>`);
    // Labels sit below the whole drawing so that they never meet the dots.
    grid.push(`<text class="fig-tick" x="${sx(x)}" y="${HEIGHT - 10}" text-anchor="middle">${int(x)}</text>`);
  }
  const yTicks = new Set([0, ymin, ymax]);
  for (const y of yTicks) {
    grid.push(`<line class="fig-grid" x1="${LEFT - 4}" y1="${sy(y)}" x2="${LEFT}" y2="${sy(y)}"/>`);
    grid.push(`<text class="fig-tick" x="${LEFT - 8}" y="${sy(y) + 4}" text-anchor="end">${int(y)}</text>`);
  }
  grid.push(`<text class="fig-axis-title" x="${WIDTH - RIGHT}" y="${HEIGHT - 10 - 16}" text-anchor="end">x</text>`);
  grid.push(`<text class="fig-axis-title" x="${LEFT}" y="14" text-anchor="middle">P(x)</text>`);
  const body: string[] = [];
  for (const { x, y } of reading.graph) {
    if (y !== 0) body.push(`<line class="poly-stem" x1="${sx(x)}" y1="${zero}" x2="${sx(x)}" y2="${sy(y)}"/>`);
    const current = x === state.a;
    if (!current) body.push(`<circle class="fig-dot fig-dot-in poly-dot${y === 0 ? ' poly-dot-root' : ''}" cx="${sx(x)}" cy="${sy(y)}" r="4"/>`);
  }
  const point = reading.graph.find(({ x }) => x === state.a)!;
  const cx = sx(point.x), cy = sy(point.y);
  body.push(`<circle class="fig-dot fig-dot-out poly-dot-current" cx="${cx}" cy="${cy}" r="5.5"/>`);
  body.push(`<circle class="fig-current-ring" cx="${cx}" cy="${cy}" r="10"/>`);
  const anchor = cx < LEFT + 60 ? 'start' : cx > WIDTH - RIGHT - 60 ? 'end' : 'middle';
  const above = cy > TOP + 26;
  const lx = anchor === 'start' ? cx - 4 : anchor === 'end' ? cx + 4 : cx;
  body.push(`<text class="poly-point-label" x="${lx}" y="${above ? cy - 16 : cy + 24}" text-anchor="${anchor}">(${int(point.x)}, ${int(point.y)})</text>`);
  return `<g aria-hidden="true">${grid.join('')}</g><g>${body.join('')}</g>`;
}
