// Pure models of the three figures of the lesson « Médiatrices & réflexions
// du plan ». Specifications: docs/demandes/codex-lecon-02-geometrie-reponse.md
// (section « Figures et interactions proposées pour Claude »).
// Coordinates are integers: every displayed value is exact.

export type Point = readonly [number, number];

/** Integer in [min, max]; anything else falls back to `fallback`. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** French display of an integer, with a true minus sign. */
export function formatNumber(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : String(value);
}

export function formatPoint([x, y]: Point): string {
  return `(${formatNumber(x)}, ${formatNumber(y)})`;
}

/* Figure 1 — perpendicular bisector of A=(−a,0), B=(a,0); P=(x,y). */

export const MEDIATRIX_LIMITS = { a: [1, 4], x: [-5, 5], y: [-5, 5] } as const;
export const MEDIATRIX_PRESET = { a: 2, x: 1, y: 3 } as const;

export interface MediatrixState { a: number; x: number; y: number }

export interface MediatrixReading {
  A: Point; B: Point; P: Point;
  pa2: number; pb2: number;
  /** PA² − PB², equal to 4ax. */
  difference: number;
  closer: 'A' | 'B' | 'equal';
}

export function mediatrix({ a, x, y }: MediatrixState): MediatrixReading {
  const pa2 = (x + a) ** 2 + y ** 2;
  const pb2 = (x - a) ** 2 + y ** 2;
  const difference = pa2 - pb2;
  return {
    A: [-a, 0], B: [a, 0], P: [x, y], pa2, pb2, difference,
    closer: difference === 0 ? 'equal' : difference > 0 ? 'B' : 'A',
  };
}

/* Figure 2 — reflection in the vertical line d: x = c. */

// x reaches 5 so that the suggested preset c = 2, P = (5, −1) is available.
export const REFLECTION_LIMITS = { c: [-4, 4], x: [-5, 5], y: [-4, 4] } as const;
export const REFLECTION_PRESET = { c: 2, x: 5, y: -1 } as const;

export interface ReflectionState { c: number; x: number; y: number; /** reflections applied */ count: number }

export interface ReflectionReading {
  P: Point; H: Point; image: Point;
  /** Point currently shown: P after an even number of reflections, P′ after an odd one. */
  current: Point;
  onAxis: boolean;
  /** HP and HP′, equal by construction. */
  distance: number;
}

export function reflectInVertical(c: number, [x, y]: Point): Point {
  return [2 * c - x, y];
}

export function reflection({ c, x, y, count }: ReflectionState): ReflectionReading {
  const P: Point = [x, y];
  const image = reflectInVertical(c, P);
  return {
    P, H: [c, y], image,
    current: count % 2 === 0 ? P : image,
    onAxis: x === c,
    distance: Math.abs(x - c),
  };
}

/* Figure 3 — s: reflection in x = 0, t: reflection in y = x, square [−a, a]². */

export const TWO_REFLECTIONS_LIMITS = { x: [-4, 4], y: [-4, 4] } as const;
export const TWO_REFLECTIONS_PRESET = { x: 1, y: 0, order: 'diagonal-first' } as const;
export const SQUARE_HALF_SIDE = 2;

export type ReflectionOrder = 'diagonal-first' | 'vertical-first';

export interface TwoReflectionsState { x: number; y: number; order: ReflectionOrder; /** 0, 1 or 2 */ step: number }

export const s = ([x, y]: Point): Point => [-x, y];
export const t = ([x, y]: Point): Point => [y, x];

export interface TwoReflectionsReading {
  P: Point; middle: Point; final: Point;
  /** Points reached so far, in order (1 to 3 points). */
  path: Point[];
  /** The composite as written: s ∘ t (t first) or t ∘ s (s first). */
  composite: 's ∘ t' | 't ∘ s';
  /** r(x,y) = (−y,x) is the positive quarter turn, r⁻¹(x,y) = (y,−x) the negative one. */
  result: 'r' | 'r⁻¹';
  /** At the origin both orders give the same image. */
  central: boolean;
}

export function twoReflections({ x, y, order, step }: TwoReflectionsState): TwoReflectionsReading {
  const P: Point = [x, y];
  const first = order === 'diagonal-first' ? t : s;
  const second = order === 'diagonal-first' ? s : t;
  const middle = first(P);
  const final = second(middle);
  const reached = Math.min(2, Math.max(0, step));
  return {
    P, middle, final,
    path: [P, middle, final].slice(0, reached + 1),
    composite: order === 'diagonal-first' ? 's ∘ t' : 't ∘ s',
    result: order === 'diagonal-first' ? 'r' : 'r⁻¹',
    central: x === 0 && y === 0,
  };
}

/** Square vertices at their initial positions (lesson 01 convention). */
export function squareVertices(a = SQUARE_HALF_SIDE): Record<'A' | 'B' | 'C' | 'D', Point> {
  return { A: [-a, a], B: [a, a], C: [a, -a], D: [-a, -a] };
}
