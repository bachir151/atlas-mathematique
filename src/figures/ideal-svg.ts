// SVG of the figure « idéal engendré » : the integers from −24 to 24 on four
// lanes (multiples of a, multiples of b, common multiples, combinations
// u·a + v·b listed), with a marker on the selected result. Shapes differ per
// lane, so colour is never the only cue. Only computed integers reach the markup.
import { int, LINE_MAX, type IdealReading } from './ideal.ts';

export const WIDTH = 400;
export const HEIGHT = 196;
const LEFT = 58, RIGHT = 14, AXIS_Y = 142;
const LANES = { a: 30, b: 56, both: 82, combo: 108 } as const;

const round = (value: number) => Math.round(value * 100) / 100;
export const sx = (k: number) => round(LEFT + ((k + LINE_MAX) / (2 * LINE_MAX)) * (WIDTH - LEFT - RIGHT));

export function idealSvg(reading: IdealReading): string {
  const grid: string[] = [];
  const labels: [keyof typeof LANES, string][] = [['a', 'mult. de a'], ['b', 'mult. de b'], ['both', 'communs'], ['combo', 'u a + v b']];
  for (const [lane, label] of labels) {
    grid.push(`<line class="fig-grid" x1="${LEFT}" y1="${LANES[lane]}" x2="${WIDTH - RIGHT}" y2="${LANES[lane]}"/>`);
    grid.push(`<text class="ideal-lane-label" x="${LEFT - 6}" y="${LANES[lane] + 4}" text-anchor="end">${label}</text>`);
  }
  grid.push(`<line class="fig-axis" x1="${LEFT}" y1="${AXIS_Y}" x2="${WIDTH - RIGHT}" y2="${AXIS_Y}"/>`);
  for (let k = -LINE_MAX; k <= LINE_MAX; k++) {
    const px = sx(k);
    const major = k % 6 === 0;
    grid.push(`<line class="fig-grid" x1="${px}" y1="${AXIS_Y - (major ? 5 : 2)}" x2="${px}" y2="${AXIS_Y + (major ? 5 : 2)}"/>`);
    if (major) {
      const odd = (k / 6) % 2 !== 0 ? ' fig-tick-odd' : '';
      grid.push(`<text class="fig-tick${odd}" x="${px}" y="${AXIS_Y + 22}" text-anchor="middle">${int(k)}</text>`);
    }
  }
  const body: string[] = [];
  for (const e of reading.entries) {
    const x = sx(e.k);
    if (e.inA) body.push(`<circle class="ideal-mark ideal-mark-a" cx="${x}" cy="${LANES.a}" r="3"/>`);
    if (e.inB) body.push(`<rect class="ideal-mark ideal-mark-b" x="${round(x - 3)}" y="${LANES.b - 3}" width="6" height="6"/>`);
    if (e.inBoth) body.push(`<path class="ideal-mark ideal-mark-both" d="M${x} ${LANES.both - 4.5}L${round(x + 4.5)} ${LANES.both}L${x} ${LANES.both + 4.5}L${round(x - 4.5)} ${LANES.both}Z"/>`);
    if (e.combination) body.push(`<path class="ideal-mark ideal-mark-combo" d="M${round(x - 3.5)} ${LANES.combo - 3}L${round(x + 3.5)} ${LANES.combo + 3}M${round(x + 3.5)} ${LANES.combo - 3}L${round(x - 3.5)} ${LANES.combo + 3}"/>`);
  }
  if (reading.onLine) {
    const x = sx(reading.total);
    body.push(`<line class="ideal-current" x1="${x}" y1="${LANES.a - 14}" x2="${x}" y2="${AXIS_Y}"/>`);
    body.push(`<circle class="fig-current-ring" cx="${x}" cy="${LANES.combo}" r="8"/>`);
    body.push(`<text class="fig-tick" x="${x}" y="${LANES.a - 18}" text-anchor="middle">${int(reading.total)}</text>`);
  } else {
    const left = reading.total < 0;
    body.push(`<text class="fig-axis-title" x="${left ? LEFT : WIDTH - RIGHT}" y="${LANES.a - 14}" text-anchor="${left ? 'start' : 'end'}">${left ? '◀ ' : ''}${int(reading.total)} hors de la droite${left ? '' : ' ▶'}</text>`);
  }
  return `<g aria-hidden="true">${grid.join('')}</g><g>${body.join('')}</g>`;
}
