// SVG of the figure « classes modulo n » : the integers from −40 to 40 on a
// graduated line (the integers of the class of a + b are filled), rings on a,
// b and a + b, and below the n classes as boxes, those of a, b and a + b
// marked. Only computed integers reach the markup.
import { int, remainder, type QuotientReading } from './quotient.ts';

export const WIDTH = 400;
export const HEIGHT = 208;
const LEFT = 16, RIGHT = 16, AXIS_Y = 74, HALF = 40;

const round = (value: number) => Math.round(value * 100) / 100;
const sx = (x: number) => round(LEFT + ((x + HALF) / (2 * HALF)) * (WIDTH - LEFT - RIGHT));

export function quotientSvg(reading: QuotientReading): string {
  const { n, a, b, sum, ra, rb, rs } = reading;
  const grid: string[] = [];
  grid.push(`<line class="fig-axis" x1="${LEFT}" y1="${AXIS_Y}" x2="${WIDTH - RIGHT}" y2="${AXIS_Y}"/>`);
  for (let t = -4; t <= 4; t++) {
    const px = sx(t * 10);
    grid.push(`<line class="fig-grid" x1="${px}" y1="${AXIS_Y - 5}" x2="${px}" y2="${AXIS_Y + 5}"/>`);
    const odd = t % 2 !== 0 ? ' fig-tick-odd' : '';
    grid.push(`<text class="fig-tick${odd}" x="${px}" y="${AXIS_Y + 22}" text-anchor="middle">${int(t * 10)}</text>`);
  }
  const body: string[] = [];
  for (let x = -HALF; x <= HALF; x++) {
    const same = remainder(x, n) === rs;
    body.push(`<circle class="fig-dot ${same ? 'fig-dot-out' : 'fig-dot-in'}" cx="${sx(x)}" cy="${AXIS_Y}" r="${same ? 2.6 : 1.8}"/>`);
  }
  const mark = (x: number, y: number, cls: string, label: string) => {
    const px = sx(x);
    body.push(`<line class="fig-segment ${cls}" x1="${px}" y1="${y + 4}" x2="${px}" y2="${AXIS_Y - 5}"/>`);
    body.push(`<text class="fig-axis-title" x="${px}" y="${y}" text-anchor="middle">${label}</text>`);
  };
  mark(a, 46, 'fig-segment-a', `a = ${int(a)}`);
  mark(b, 28, 'fig-segment-b', `b = ${int(b)}`);
  mark(sum, 10, 'fig-segment-construction', `a + b = ${int(sum)}`);
  body.push(`<circle class="fig-current-ring" cx="${sx(sum)}" cy="${AXIS_Y}" r="7"/>`);

  // The n classes, as boxes of equal width.
  const gap = 6, boxY = 126, boxH = 40;
  const boxW = round((WIDTH - LEFT - RIGHT - gap * (n - 1)) / n);
  for (let i = 0; i < n; i++) {
    const x = round(LEFT + i * (boxW + gap));
    const flags = [i === ra ? 'a' : '', i === rb ? 'b' : '', i === rs ? 'a + b' : ''].filter(Boolean);
    const marked = i === rs ? ' fig-class-sum' : flags.length ? ' fig-class-marked' : '';
    body.push(`<rect class="fig-class${marked}" x="${x}" y="${boxY}" width="${boxW}" height="${boxH}" rx="3"/>`);
    body.push(`<text class="fig-label" x="${round(x + boxW / 2)}" y="${boxY + 25}" text-anchor="middle">[${i}]</text>`);
    flags.forEach((flag, k) => body.push(`<text class="fig-axis-title" x="${round(x + boxW / 2)}" y="${boxY + boxH + 14 + 13 * k}" text-anchor="middle">${flag}</text>`));
  }
  return `<g aria-hidden="true">${grid.join('')}</g><g>${body.join('')}</g>`;
}
