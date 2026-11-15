// Pure models of the two figures of the lesson « Suites géométriques & sommes
// infinies ». Specifications: docs/demandes/codex-lecon-03-analyse-reponse.md
// (section « Figures et interactions proposées pour Claude »).
// Decimal parameters are stored as integers (a = 5 means a = 0,5) and every
// value is an exact rational.
import { absR, add, cmp, div, isZero, mul, pow, rat, sub, type Rational } from './rational.ts';

/** Integer in [min, max] from a decimal value given in units of 1/scale. */
export function clampScaled(value: unknown, scale: number, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number * scale)));
}

/* Figure 1 — geometric sums, limit and error. */

/** a and q in tenths, N an integer; ε = 1/eps. */
export interface SumState { a: number; q: number; N: number; eps: number }

export const SUM_SCALE = { a: 10, q: 10, N: 1 } as const;
export const SUM_LIMITS = { a: [-20, 20], q: [-9, 9], N: [0, 80] } as const;
export const EPSILONS = [10, 100, 1000] as const;
export const SUM_MAX_RANK = 80;
export const SUM_PRESETS = {
  halves: { a: 5, q: 5, N: 3, eps: 100 },
  alternating: { a: 10, q: -5, N: 3, eps: 100 },
} as const satisfies Record<string, SumState>;

export interface SumReading {
  a: Rational; q: Rational; epsilon: Rational;
  /** u_N = a q^N */
  term: Rational;
  /** S_0 … S_N */
  sums: Rational[];
  limit: Rational;
  /** R_N = L − S_N */
  remainder: Rational;
  /** |R_N| < ε, decided exactly. */
  within: boolean;
  /** For each displayed rank n ≤ N, whether |R_n| < ε. */
  inBand: boolean[];
  /** First rank n ≤ 80 with |R_n| < ε, if any. */
  firstRank: number | undefined;
  /** Halves preset: the sums can be drawn as pieces of a unit segment. */
  halves: boolean;
}

export function geometricSum({ a: A, q: Q, N, eps }: SumState): SumReading {
  const a = rat(A, 10), q = rat(Q, 10), epsilon = rat(1, eps);
  const limit = div(a, sub(rat(1), q));
  const remainderAt = (n: number) => div(mul(a, pow(q, n + 1)), sub(rat(1), q));
  const below = (n: number) => cmp(absR(remainderAt(n)), epsilon) < 0;
  const sums: Rational[] = [];
  let sum = rat(0);
  for (let n = 0; n <= N; n++) { sum = add(sum, mul(a, pow(q, n))); sums.push(sum); }
  let firstRank: number | undefined;
  // |R_n| is non-increasing in n: the first rank found stays valid afterwards.
  for (let n = 0; n <= SUM_MAX_RANK; n++) if (below(n)) { firstRank = n; break; }
  const remainder = sub(limit, sums[N]);
  return {
    a, q, epsilon, term: mul(a, pow(q, N)), sums, limit, remainder,
    within: below(N),
    inBand: sums.map((_, n) => below(n)),
    firstRank,
    halves: A === 5 && Q === 5,
  };
}

/* Figure 2 — affine iteration x_{n+1} = q x_n + b and its fixed point. */

/** q in tenths, b and x0 in halves, n the current rank. */
export interface IterationState { q: number; b: number; x0: number; n: number }

export const ITERATION_SCALE = { q: 10, b: 2, x0: 2 } as const;
export const ITERATION_LIMITS = { q: [-9, 9], b: [-10, 10], x0: [-20, 20] } as const;
export const ITERATION_MAX_RANK = 40;
export const ITERATION_PRESETS = {
  average: { q: 5, b: 6, x0: 0, n: 0 },
  alternating: { q: -5, b: 9, x0: 14, n: 0 },
} as const satisfies Record<string, IterationState>;

export interface IterationReading {
  q: Rational; b: Rational; x0: Rational;
  fixedPoint: Rational;
  /** x_0 … x_n */
  positions: Rational[];
  /** e_k = x_k − p, equal to q^k (x_0 − p). */
  errors: Rational[];
}

export function affineIteration({ q: Q, b: B, x0: X, n }: IterationState): IterationReading {
  const q = rat(Q, 10), b = rat(B, 2), x0 = rat(X, 2);
  const fixedPoint = div(b, sub(rat(1), q));
  const positions = [x0];
  for (let k = 1; k <= n; k++) positions.push(add(mul(q, positions[k - 1]), b));
  return { q, b, x0, fixedPoint, positions, errors: positions.map(x => sub(x, fixedPoint)) };
}

/** e_k computed by the closed formula q^k (x_0 − p), to check the iteration. */
export function closedError(reading: IterationReading, k: number): Rational {
  return mul(pow(reading.q, k), sub(reading.x0, reading.fixedPoint));
}

export const reachesFixedPoint = (reading: IterationReading) => reading.errors.findIndex(isZero);
