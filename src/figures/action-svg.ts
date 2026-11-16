// SVG of the figure « action sur les sommets du carré » : the square with its
// four vertices A, B, C, D (A top left, B top right, C bottom right, D bottom
// left: fixed locations), the selected vertex (orange ring), its image (blue
// dot) and the other vertices of its orbit (green). With the eight symmetries
// the diagonal through A and C (axis of s) is dashed. No direction of turn is
// drawn. Only computed values reach the markup.
import { VERTICES, type ActionReading, type GroupId, type Vertex } from './action.ts';

export const WIDTH = 320;
export const HEIGHT = 300;
const L = 80, R = 240, T = 50, B = 210;
const POINTS: Record<Vertex, [number, number]> = { 0: [L, T], 1: [R, T], 2: [R, B], 3: [L, B] };
const LABELS: Record<Vertex, [number, number]> = { 0: [L - 22, T - 14], 1: [R + 22, T - 14], 2: [R + 22, B + 28], 3: [L - 22, B + 28] };

export function actionSvg(reading: ActionReading, group: GroupId): string {
  const pts = ([0, 1, 2, 3] as Vertex[]).map(v => POINTS[v].join(','));
  const out: string[] = [];
  out.push(`<polygon class="fig-square" points="${pts.join(' ')}"/>`);
  if (group === 'symmetries') {
    out.push(`<line class="fig-axis-line" x1="${L}" y1="${T}" x2="${R}" y2="${B}"/>`);
  }
  for (const v of [0, 1, 2, 3] as Vertex[]) {
    const [x, y] = POINTS[v];
    const cls = v === reading.image ? 'fig-point fig-point-image'
      : reading.orbit.includes(v) ? 'fig-point fig-point-fixed' : 'fig-point fig-point-construction';
    out.push(`<circle class="${cls}" cx="${x}" cy="${y}" r="7"/>`);
  }
  const [sx, sy] = POINTS[reading.vertex];
  out.push(`<circle class="fig-ring" cx="${sx}" cy="${sy}" r="13"/>`);
  for (const v of [0, 1, 2, 3] as Vertex[]) {
    const [x, y] = LABELS[v];
    out.push(`<text class="fig-label" x="${x}" y="${y}" text-anchor="middle">${VERTICES[v]}</text>`);
  }
  return `<g aria-hidden="true">${out.join('')}</g>`;
}
