// SVG of the figure « corps à quatre éléments » : the four elements as boxes,
// with x, y and the result marked. Only computed values reach the markup.
import { ELEMENTS, calculate, eltIndex, name, type FieldState } from './field.ts';

export const WIDTH = 400;
export const HEIGHT = 130;

export function fieldSvg(state: FieldState): string {
  const { result } = calculate(state);
  const marks: [number, string][] = [[eltIndex(state.x), 'x'], [eltIndex(state.y), 'y'], [eltIndex(result), 'résultat']];
  const gap = 10, left = 16, boxW = (WIDTH - 2 * left - 3 * gap) / 4, boxY = 22, boxH = 44;
  const out: string[] = [];
  ELEMENTS.forEach((e, i) => {
    const x = left + i * (boxW + gap);
    const cls = i === eltIndex(result) ? ' fig-class-sum' : marks.some(([k]) => k === i) ? ' fig-class-marked' : '';
    out.push(`<rect class="fig-class${cls}" x="${x}" y="${boxY}" width="${boxW}" height="${boxH}" rx="3"/>`);
    out.push(`<text class="fig-label" x="${x + boxW / 2}" y="${boxY + 28}" text-anchor="middle">${name(e)}</text>`);
    marks.filter(([k]) => k === i).forEach(([, label], n) =>
      out.push(`<text class="fig-axis-title" x="${x + boxW / 2}" y="${boxY + boxH + 16 + 14 * n}" text-anchor="middle">${label}</text>`));
  });
  return `<g>${out.join('')}</g>`;
}
