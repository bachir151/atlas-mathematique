// SVG of the figure « morphisme » : the 25 integers from −12 to 12 on a line,
// each dot coloured by its rotation (e, r, r², r³), with markers on m and n.
// Only computed integers reach the markup.
import { RANGE, int, rotation, rotationName, type MorphismReading } from './morphism.ts';

export const WIDTH = 400;
export const HEIGHT = 140;
const LEFT = 18, RIGHT = 18, AXIS_Y = 80;

const round = (value: number) => Math.round(value * 100) / 100;
const sx = (k: number) => round(LEFT + ((k - RANGE[0]) / (RANGE[1] - RANGE[0])) * (WIDTH - LEFT - RIGHT));

export function morphismSvg({ m, n }: Pick<MorphismReading, 'm' | 'n'>): string {
  const grid: string[] = [`<line class="fig-axis" x1="${LEFT}" y1="${AXIS_Y}" x2="${WIDTH - RIGHT}" y2="${AXIS_Y}"/>`];
  const body: string[] = [];
  for (let k = RANGE[0]; k <= RANGE[1]; k++) {
    const s = rotation(k), x = sx(k);
    body.push(`<circle class="fig-dot morphism-rot-${s}" cx="${x}" cy="${AXIS_Y}" r="4.5"/>`);
    grid.push(`<text class="fig-axis-title morphism-rot-label" x="${x}" y="${AXIS_Y + 20}" text-anchor="middle">${rotationName(s)}</text>`);
    if (k % 4 === 0) grid.push(`<text class="fig-tick" x="${x}" y="${AXIS_Y + 38}" text-anchor="middle">${int(k)}</text>`);
  }
  body.push(`<circle class="fig-current-ring" cx="${sx(m)}" cy="${AXIS_Y}" r="9"/>`);
  body.push(`<circle class="fig-ring" cx="${sx(n)}" cy="${AXIS_Y}" r="13"/>`);
  body.push(`<text class="fig-axis-title" x="${sx(m)}" y="${AXIS_Y - 24}" text-anchor="middle">m</text>`);
  body.push(`<text class="fig-axis-title" x="${sx(n)}" y="${AXIS_Y - (m === n ? 38 : 24)}" text-anchor="middle">n</text>`);
  return `<g aria-hidden="true">${grid.join('')}</g><g>${body.join('')}</g>`;
}
