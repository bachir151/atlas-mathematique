// SVG of the figure « pas entiers » : a graduated line, a dot on every position
// m·a + n·b listed (finite range of coefficients), the two steps m·a then n·b
// as segments, and a ring on the current position. Only computed integers
// reach the markup.
import { int, type StepsReading } from './steps.ts';

export const WIDTH = 400;
export const HEIGHT = 170;
const LEFT = 20, RIGHT = 20, AXIS_Y = 118;

const round = (value: number) => Math.round(value * 100) / 100;

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * magnitude;
}

export function stepsSvg(reading: StepsReading): string {
  const half = Math.max(12, reading.reach, Math.abs(reading.ma), Math.abs(reading.total));
  const sx = (x: number) => round(LEFT + ((x + half) / (2 * half)) * (WIDTH - LEFT - RIGHT));
  const grid: string[] = [];
  grid.push(`<line class="fig-axis" x1="${LEFT}" y1="${AXIS_Y}" x2="${WIDTH - RIGHT}" y2="${AXIS_Y}"/>`);
  const step = niceStep(2 * half, 8);
  for (let t = Math.ceil(-half / step); t * step <= half; t++) {
    const x = t * step, px = sx(x);
    grid.push(`<line class="fig-grid" x1="${px}" y1="${AXIS_Y - 4}" x2="${px}" y2="${AXIS_Y + 4}"/>`);
    const odd = t % 2 !== 0 ? ' fig-tick-odd' : '';
    grid.push(`<text class="fig-tick${odd}" x="${px}" y="${AXIS_Y + 20}" text-anchor="middle">${int(x)}</text>`);
  }
  const body: string[] = [];
  const r = reading.reached.length <= 40 ? 4 : 2.5;
  for (const { value } of reading.reached) body.push(`<circle class="fig-dot fig-dot-in" cx="${sx(value)}" cy="${AXIS_Y}" r="${r}"/>`);
  const segment = (from: number, to: number, y: number, cls: string, label: string) => {
    if (from === to) return;
    const x1 = sx(from), x2 = sx(to);
    body.push(`<line class="fig-segment ${cls}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`);
    body.push(`<line class="fig-segment ${cls}" x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}"/>`);
    body.push(`<line class="fig-segment ${cls}" x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}"/>`);
    body.push(`<text class="fig-axis-title" x="${round((x1 + x2) / 2)}" y="${y - 8}" text-anchor="middle">${label}</text>`);
  };
  segment(0, reading.ma, 84, 'fig-segment-a', 'm × a');
  segment(reading.ma, reading.total, 48, 'fig-segment-b', 'n × b');
  body.push(`<circle class="fig-current-ring" cx="${sx(reading.total)}" cy="${AXIS_Y}" r="${r + 5}"/>`);
  return `<g aria-hidden="true">${grid.join('')}</g><g>${body.join('')}</g>`;
}
