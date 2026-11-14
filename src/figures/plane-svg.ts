// SVG markup of the plane figures, as strings, so the same code renders the
// static figure at build time (Astro) and updates it in the browser.
// Only numbers computed by src/figures/plane.ts reach the markup: no user text.
import {
  formatNumber, mediatrix, reflection, squareVertices, twoReflections,
  type MediatrixState, type Point, type ReflectionState, type TwoReflectionsState,
} from './plane.ts';

export const VIEW = 400;
const MARGIN = 30; // room for the graduations along the left and bottom edges

/** World square [−range, range]² mapped onto the viewBox, y pointing up. */
export interface Frame { range: number; toSvg(point: Point): [number, number]; toWorld(svgX: number, svgY: number): Point; unit: number }

export function frame(range: number): Frame {
  const unit = (VIEW - 2 * MARGIN) / (2 * range);
  const centre = VIEW / 2;
  return {
    range, unit,
    toSvg: ([x, y]) => [round(centre + x * unit), round(centre - y * unit)],
    toWorld: (svgX, svgY) => [(svgX - centre) / unit, (centre - svgY) / unit],
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

function grid(f: Frame): string {
  const lines: string[] = [];
  const step = f.range > 8 ? 2 : 1;
  for (let k = -f.range; k <= f.range; k++) {
    const [x] = f.toSvg([k, 0]);
    const [, y] = f.toSvg([0, k]);
    const cls = k === 0 ? 'fig-axis' : 'fig-grid';
    lines.push(`<line class="${cls}" x1="${x}" y1="${MARGIN}" x2="${x}" y2="${VIEW - MARGIN}"/>`);
    lines.push(`<line class="${cls}" x1="${MARGIN}" y1="${y}" x2="${VIEW - MARGIN}" y2="${y}"/>`);
    // Graduations along the frame edges, away from the points and their labels.
    if (k % step === 0) {
      const tick = Math.abs(k / step) % 2 === 1 ? 'fig-tick fig-tick-odd' : 'fig-tick';
      lines.push(`<text class="${tick}" x="${x}" y="${VIEW - MARGIN + 17}" text-anchor="middle">${formatNumber(k)}</text>`);
      lines.push(`<text class="${tick}" x="${MARGIN - 5}" y="${y + 4}" text-anchor="end">${formatNumber(k)}</text>`);
    }
  }
  return `<g aria-hidden="true">${lines.join('')}</g>`;
}

function segment(f: Frame, from: Point, to: Point, cls: string): string {
  const [x1, y1] = f.toSvg(from), [x2, y2] = f.toSvg(to);
  return `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}

/** Infinite line through two points, clipped to the drawing area. */
function line(f: Frame, from: Point, to: Point, cls: string): string {
  const [x1, y1] = from, [x2, y2] = to;
  const r = f.range + 1;
  const dx = x2 - x1, dy = y2 - y1;
  const k = (2 * r) / Math.hypot(dx, dy);
  return segment(f, [x1 - dx * k, y1 - dy * k], [x2 + dx * k, y2 + dy * k], cls);
}

function point(f: Frame, p: Point, cls: string, label?: string, dx = 9, dy = -9): string {
  const [x, y] = f.toSvg(p);
  const text = label ? `<text class="fig-label" x="${x + dx}" y="${y + dy}">${label}</text>` : '';
  return `<circle class="${cls}" cx="${x}" cy="${y}" r="${cls.includes('fig-ring') ? 9 : 6}"/>${text}`;
}

function lineLabel(f: Frame, at: Point, text: string): string {
  const [x, y] = f.toSvg(at);
  return `<text class="fig-line-label" x="${x}" y="${y}">${text}</text>`;
}

/** Drawing area: SVG clip so that lines stop at the frame. */
const CLIP = `<clipPath id="CLIPID"><rect x="${MARGIN}" y="${MARGIN}" width="${VIEW - 2 * MARGIN}" height="${VIEW - 2 * MARGIN}"/></clipPath>`;
const clipped = (id: string, f: Frame, body: string) => `${grid(f)}<defs>${CLIP.replace('CLIPID', id)}</defs><g clip-path="url(#${id})">${body}</g>`;

/* Figure 1 */
export const MEDIATRIX_RANGE = 6;

export function mediatrixSvg(state: MediatrixState, id: string): string {
  const f = frame(MEDIATRIX_RANGE);
  const r = mediatrix(state);
  const body = [
    line(f, [0, -1], [0, 1], 'fig-axis-line'),
    lineLabel(f, [0.25, MEDIATRIX_RANGE - 0.6], 'd : x = 0'),
    segment(f, r.P, r.A, 'fig-segment fig-segment-a'),
    segment(f, r.P, r.B, 'fig-segment fig-segment-b'),
    point(f, r.A, 'fig-point fig-point-fixed', 'A', -16, -10),
    point(f, r.B, 'fig-point fig-point-fixed', 'B', 6, -10),
    `<g data-drag-handle>${point(f, r.P, 'fig-point fig-point-current', 'P')}</g>`,
  ].join('');
  return clipped(`${id}-clip`, f, body);
}

/* Figure 2 */
export function reflectionRange(state: ReflectionState): number {
  const r = reflection(state);
  const extent = Math.max(4, ...[r.P, r.image, r.H].flat().map(Math.abs));
  return Math.min(15, extent + 2);
}

export function reflectionSvg(state: ReflectionState, id: string): string {
  const f = frame(reflectionRange(state));
  const r = reflection(state);
  const parts = [
    line(f, [state.c, -1], [state.c, 1], 'fig-axis-line'),
    lineLabel(f, [state.c + 0.25, f.range - 0.6], `d : x = ${formatNumber(state.c)}`),
  ];
  if (!r.onAxis) {
    // Construction: perpendicular through P, right angle at H, equal lengths HP = HP′.
    parts.push(segment(f, r.P, state.count > 0 ? r.image : r.H, 'fig-segment fig-segment-construction'));
    const [hx, hy] = f.toSvg(r.H);
    const side = Math.sign(r.P[0] - state.c) || 1;
    const size = 10;
    parts.push(`<path class="fig-right-angle" d="M${hx + side * size} ${hy} v${-size} h${-side * size}"/>`);
    if (state.count > 0) {
      for (const end of [r.P, r.image]) {
        const [mx, my] = f.toSvg([(end[0] + r.H[0]) / 2, end[1]]);
        parts.push(`<line class="fig-tick-mark" x1="${mx}" y1="${my - 7}" x2="${mx}" y2="${my + 7}"/>`);
      }
    }
  }
  parts.push(point(f, r.H, 'fig-point fig-point-construction', 'H', 8, 20));
  // The initial position P stays visible as a ring; the current point is filled.
  const odd = state.count % 2 === 1;
  parts.push(point(f, r.P, 'fig-ring', 'P', -6, -14));
  if (state.count > 0 && !odd && !r.onAxis) parts.push(point(f, r.image, 'fig-point fig-point-image', 'P′', -6, -14));
  parts.push(`<g data-drag-handle>${point(f, r.current, 'fig-point fig-point-current', odd && !r.onAxis ? 'P′' : undefined, -6, -14)}</g>`);
  return clipped(`${id}-clip`, f, parts.join(''));
}

/* Figure 3 */
export const TWO_REFLECTIONS_RANGE = 5;

export function twoReflectionsSvg(state: TwoReflectionsState, id: string): string {
  const f = frame(TWO_REFLECTIONS_RANGE);
  const r = twoReflections(state);
  const v = squareVertices();
  const corner = (p: Point) => f.toSvg(p).join(' ');
  const parts = [
    `<path class="fig-square" d="M${corner(v.A)} L${corner(v.B)} L${corner(v.C)} L${corner(v.D)} Z"/>`,
    ...(['A', 'B', 'C', 'D'] as const).map(name => {
      const [x, y] = f.toSvg(v[name]);
      const dx = v[name][0] < 0 ? -18 : 7, dy = v[name][1] > 0 ? -7 : 20;
      return `<text class="fig-square-label" x="${x + dx}" y="${y + dy}">${name}</text>`;
    }),
    line(f, [0, -1], [0, 1], 'fig-axis-line fig-axis-s'),
    lineLabel(f, [0.25, -TWO_REFLECTIONS_RANGE + 0.4], 'axe de s : x = 0'),
    line(f, [-1, -1], [1, 1], 'fig-axis-line fig-axis-t'),
    lineLabel(f, [-4.8, -3.3], 'axe de t : y = x'),
  ];
  for (let i = 1; i < r.path.length; i++) parts.push(segment(f, r.path[i - 1], r.path[i], 'fig-segment fig-segment-construction'));
  const names = ['P', 'P₁', 'P₂'];
  const same = (u: Point, v: Point) => u[0] === v[0] && u[1] === v[1];
  r.path.forEach((p, i) => {
    const last = i === r.path.length - 1;
    // Coinciding points share one label, e.g. « P₁ = P₂ ».
    const label = r.path.map((q, j) => (same(q, p) ? names[j] : '')).filter(Boolean);
    const first = r.path.findIndex(q => same(q, p)) === i;
    const text = first ? label.join(' = ') : undefined;
    const cls = last ? 'fig-point fig-point-current' : i === 0 ? 'fig-ring' : 'fig-point fig-point-image';
    const drawn = point(f, p, cls, text, 9, -10);
    parts.push(i === 0 ? `<g data-drag-handle>${drawn}</g>` : drawn);
  });
  return clipped(`${id}-clip`, f, parts.join(''));
}
