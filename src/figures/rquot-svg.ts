// SVG of the figure « anneau quotient » : the n classes modulo n as boxes,
// those of a, b, a + b and a b marked by labels. Only computed integers reach
// the markup.
import type { RQuotReading } from './rquot.ts';

export const WIDTH = 400;
export const HEIGHT = 150;
const LEFT = 16, RIGHT = 16;

const round = (value: number) => Math.round(value * 100) / 100;

export function rquotSvg(reading: RQuotReading): string {
  const { n, ra, rb, rs, rp } = reading;
  const gap = 6, boxY = 14, boxH = 40;
  const boxW = round((WIDTH - LEFT - RIGHT - gap * (n - 1)) / n);
  const body: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = round(LEFT + i * (boxW + gap));
    const flags = [i === ra ? 'a' : '', i === rb ? 'b' : '', i === rs ? 'a + b' : '', i === rp ? 'ab' : ''].filter(Boolean);
    const marked = flags.length ? ' rquot-class-marked' : '';
    const sumOrProduct = i === rs || i === rp ? ' rquot-class-result' : '';
    body.push(`<rect class="rquot-class${marked}${sumOrProduct}" x="${x}" y="${boxY}" width="${boxW}" height="${boxH}" rx="3"/>`);
    body.push(`<text class="fig-label rquot-label" x="${round(x + boxW / 2)}" y="${boxY + 25}" text-anchor="middle">[${i}]</text>`);
    flags.forEach((flag, k) => body.push(`<text class="fig-axis-title" x="${round(x + boxW / 2)}" y="${boxY + boxH + 14 + 13 * k}" text-anchor="middle">${flag}</text>`));
  }
  return `<g>${body.join('')}</g>`;
}
