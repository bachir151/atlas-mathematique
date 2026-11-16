// SVG of the figure « table de multiplication modulo n » : the n × n table as
// a grid of squares (zero products orange, products equal to 1 green), the
// row of a and the column of b lightly marked, the selected cell ringed.
// Only computed integers reach the markup.
import type { RingReading } from './ring.ts';

export const WIDTH = 400;
export const HEIGHT = 400;
const MARGIN = 28;

const round = (value: number) => Math.round(value * 100) / 100;

export function ringSvg(reading: RingReading): string {
  const { n, a, b, table } = reading;
  const size = round((WIDTH - 2 * MARGIN) / n);
  const body: string[] = [];
  const fontSize = n > 9 ? 12 : 15;
  const dense = n > 9 ? ' ring-dense' : '';
  for (let i = 0; i < n; i++) {
    const labelAt = round(MARGIN + i * size + size / 2);
    body.push(`<text class="fig-tick ring-head${i === b ? ' ring-head-on' : ''}" x="${labelAt}" y="${MARGIN - 9}" text-anchor="middle">${i}</text>`);
    body.push(`<text class="fig-tick ring-head${i === a ? ' ring-head-on' : ''}" x="${MARGIN - 9}" y="${round(labelAt + 4)}" text-anchor="end">${i}</text>`);
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const value = table[i][j];
      const zero = value === 0 && i !== 0 && j !== 0 ? ' ring-cell-zero' : value === 1 ? ' ring-cell-one' : '';
      const line = i === a || j === b ? ' ring-cell-line' : '';
      const x = round(MARGIN + j * size), y = round(MARGIN + i * size);
      body.push(`<rect class="ring-cell${zero}${line}" x="${x}" y="${y}" width="${size}" height="${size}"/>`);
      body.push(`<text class="ring-value" x="${round(x + size / 2)}" y="${round(y + size / 2 + fontSize * 0.35)}" text-anchor="middle">${value}</text>`);
    }
  }
  body.push(`<rect class="fig-current-ring ring-selected" x="${round(MARGIN + b * size + 1)}" y="${round(MARGIN + a * size + 1)}" width="${round(size - 2)}" height="${round(size - 2)}"/>`);
  return `<g class="ring-grid${dense}">${body.join('')}</g>`;
}
