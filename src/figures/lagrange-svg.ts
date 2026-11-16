// SVG of the figures of the lesson « Lagrange & conjugaison ». Only computed
// values reach the markup. Class membership is never carried by colour alone:
// every node also shows its class number.
import {
  ELEMENT_NAMES, ORDER, type ClassesReading, type ClassesState, type ConjugationReading, type ConjugationState,
} from './lagrange.ts';

export const WIDTH = 400;
export const HEIGHT = 190;
const round = (v: number) => Math.round(v * 100) / 100;

export function classesSvg(state: ClassesState, reading: ClassesReading): string {
  const inCoset = new Set(reading.aH);
  const nodes: string[] = [];
  for (let i = 0; i < ORDER; i++) {
    const cx = 55 + (i % 4) * 97, cy = i < 4 ? 62 : 138;
    const cls = reading.classOf[i];
    const ring = inCoset.has(i) ? `<circle class="fig-current-ring lagr-coset-ring" cx="${cx}" cy="${cy}" r="25"/>` : '';
    const rep = i === state.rep ? `<circle class="fig-ring" cx="${cx}" cy="${cy}" r="31"/>` : '';
    nodes.push(`${rep}${ring}<circle class="lagr-node lagr-class-${cls % 4}" cx="${cx}" cy="${cy}" r="20"/>`
      + `<text class="lagr-node-name" x="${cx}" y="${cy + 5}" text-anchor="middle">${ELEMENT_NAMES[i]}</text>`
      + `<text class="fig-axis-title" x="${cx}" y="${cy - 27}" text-anchor="middle">C${cls + 1}</text>`);
  }
  return `<g>${nodes.join('')}</g>`;
}

export function conjugationSvg(state: ConjugationState, reading: ConjugationReading): string {
  const cx = 200, cy = 95, half = 52, reach = 78;
  const out: string[] = [];
  out.push(`<rect class="fig-square" x="${cx - half}" y="${cy - half}" width="${2 * half}" height="${2 * half}"/>`);
  const line = (dir: readonly [number, number], cls: string) => {
    const k = reach / Math.hypot(dir[0], dir[1]);
    // The y axis of the plane points up; the SVG one points down.
    const dx = round(dir[0] * k), dy = round(-dir[1] * k);
    return `<line class="${cls}" x1="${cx - dx}" y1="${cy - dy}" x2="${cx + dx}" y2="${cy + dy}"/>`;
  };
  const { axisBefore, axisAfter } = reading;
  if (axisBefore && axisAfter) {
    const coincide = axisBefore.dir[0] === axisAfter.dir[0] && axisBefore.dir[1] === axisAfter.dir[1];
    out.push(line(axisBefore.dir, 'fig-axis-line'));
    if (!coincide) out.push(line(axisAfter.dir, 'fig-axis-line lagr-axis-after'));
    out.push(`<text class="fig-axis-title" x="${cx}" y="14" text-anchor="middle">`
      + `${coincide ? 'axe initial = axe obtenu (tirets verts)' : 'axe initial : tirets verts ; axe obtenu : tirets orange'}</text>`);
  } else {
    out.push(`<text class="fig-axis-title" x="${cx}" y="14" text-anchor="middle">`
      + `${axisBefore ? 'g x g⁻¹ est une rotation' : `${ELEMENT_NAMES[state.x]} est une rotation : pas d’axe`}</text>`);
  }
  out.push(`<text class="fig-axis-title" x="${cx}" y="${HEIGHT - 6}" text-anchor="middle">carré [−1, 1]²</text>`);
  return `<g>${out.join('')}</g>`;
}
