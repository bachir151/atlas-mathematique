// Pure model of the figure of the lesson « Polynômes, division & racines ».
// Specification: docs/demandes/codex-lecon-14-polynomes-reponse.md
// (paragraphe « Interaction facultative proposée : division par un facteur
// linéaire »). P = X³ + c₂X² + c₁X + c₀ is divided by X − a in ℚ by the
// Euclidean division algorithm (exact rationals). The figure explores a finite
// range of examples; it proves nothing.
import { add, div, isZero, mul, rat, sub, type Rational } from './rational.ts';

export interface PolyState { c2: number; c1: number; c0: number; a: number }
export type PolyField = keyof PolyState;
export const FIELDS: readonly PolyField[] = ['c2', 'c1', 'c0', 'a'];
export const LIMITS = { c2: [-3, 3], c1: [-3, 3], c0: [-3, 3], a: [-3, 3] } as const;
export const POLY_PRESET: PolyState = { c2: 0, c1: 0, c0: -1, a: 1 };
/** Integers at which the discrete graph of P is drawn. */
export const GRAPH_MIN = -4;
export const GRAPH_MAX = 4;

/** Integer in the limits of the field; the fallback replaces a non-number. */
export function clampField(name: PolyField, value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = LIMITS[name];
  return Math.min(max, Math.max(min, Math.round(number)));
}

/* Polynomials over ℚ: coefficients from degree 0 upward, no trailing zero (zero = []). */
export type Poly = Rational[];

export function trim(p: Poly): Poly {
  const q = [...p];
  while (q.length && isZero(q[q.length - 1])) q.pop();
  return q;
}
export const degree = (p: Poly) => trim(p).length - 1; // −1 for the zero polynomial
export const polyFromInts = (coefficients: number[]): Poly => trim(coefficients.map(c => rat(c)));
export const polyMul = (p: Poly, q: Poly): Poly => {
  const out: Rational[] = Array.from({ length: Math.max(0, p.length + q.length - 1) }, () => rat(0));
  p.forEach((x, i) => q.forEach((y, j) => { out[i + j] = add(out[i + j], mul(x, y)); }));
  return trim(out);
};
export const polyAdd = (p: Poly, q: Poly): Poly =>
  trim(Array.from({ length: Math.max(p.length, q.length) }, (_, i) => add(p[i] ?? rat(0), q[i] ?? rat(0))));
export const polyEqual = (p: Poly, q: Poly) => {
  const x = trim(p), y = trim(q);
  return x.length === y.length && x.every((c, i) => c.n === y[i].n && c.d === y[i].d);
};

/** Euclidean division in ℚ[X]: P = D·Q + R with deg R < deg D (D ≠ 0). */
export function divide(p: Poly, d: Poly): { quotient: Poly; remainder: Poly } {
  const divisor = trim(d);
  if (divisor.length === 0) throw new RangeError('Division par le polynôme nul');
  const dd = divisor.length - 1, lead = divisor[dd];
  let r = trim(p);
  const q: Rational[] = Array.from({ length: Math.max(0, r.length - dd) }, () => rat(0));
  while (r.length - 1 >= dd && r.length > 0) {
    const shift = r.length - 1 - dd;
    const factor = div(r[r.length - 1], lead);
    q[shift] = factor;
    r = r.map((c, i) => (i >= shift ? sub(c, mul(factor, divisor[i - shift])) : c));
    r = trim(r.slice(0, r.length - 1)); // the leading term cancels exactly
  }
  return { quotient: trim(q), remainder: r };
}

/** Exact value by Horner's rule. */
export function evaluate(p: Poly, x: Rational): Rational {
  let value = rat(0);
  for (let i = p.length - 1; i >= 0; i--) value = add(mul(value, x), p[i]);
  return value;
}

export interface PolyReading {
  p: Poly;
  divisor: Poly;
  quotient: Poly;
  remainder: Poly;
  /** P(a). */
  value: Rational;
  /** Values P(x) for x = GRAPH_MIN … GRAPH_MAX. */
  graph: { x: number; y: number }[];
}

export const polyOf = ({ c2, c1, c0 }: PolyState): Poly => polyFromInts([c0, c1, c2, 1]);

export function polyReading(state: PolyState): PolyReading {
  const p = polyOf(state);
  const divisor = polyFromInts([-state.a, 1]);
  const { quotient, remainder } = divide(p, divisor);
  const graph: { x: number; y: number }[] = [];
  for (let x = GRAPH_MIN; x <= GRAPH_MAX; x++) graph.push({ x, y: Number(evaluate(p, rat(x)).n) });
  return { p, divisor, quotient, remainder, value: evaluate(p, rat(state.a)), graph };
}

/* Text reading. */

const MINUS = '−';
export const NNBSP = ' '; // before ? ! ; (narrow no-break space)
export const NBSP = ' '; // before :
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
const SUPER: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const power = (k: number) => (k === 0 ? '' : k === 1 ? 'X' : `X${SUPER[k] ?? `^${k}`}`);
const ratText = (x: Rational) => `${x.n < 0n ? MINUS : ''}${(x.n < 0n ? -x.n : x.n).toString()}${x.d === 1n ? '' : `/${x.d}`}`;

/** Readable polynomial: X³ − 2X + 1, zero terms omitted, true minus signs. */
export function formatPoly(p: Poly): string {
  const q = trim(p);
  if (q.length === 0) return '0';
  let text = '';
  for (let k = q.length - 1; k >= 0; k--) {
    const c = q[k];
    if (isZero(c)) continue;
    const negative = c.n < 0n;
    const magnitude = rat(negative ? -c.n : c.n, c.d);
    const unit = magnitude.n === 1n && magnitude.d === 1n;
    const body = k === 0 ? ratText(magnitude)
      : `${unit ? '' : (magnitude.d === 1n ? ratText(magnitude) : `(${ratText(magnitude)})`)}${power(k)}`;
    text += text === '' ? (negative ? `${MINUS}${body}` : body) : ` ${negative ? MINUS : '+'} ${body}`;
  }
  return text;
}

/** Linear divisor X − a written as X, X − 2 or X + 2. */
export const formatDivisor = (a: number) => (a === 0 ? 'X' : a > 0 ? `X ${MINUS} ${a}` : `X + ${-a}`);

/** « P = (X − a)·Q + R », with the computed polynomials. */
export function formatIdentity(state: PolyState, reading: PolyReading): string {
  const q = formatPoly(reading.quotient);
  const quotient = reading.quotient.length > 1 && q !== '' ? `(${q})` : q;
  const rem = formatPoly(reading.remainder);
  const remainderTerm = rem.startsWith(MINUS) ? `${MINUS} ${rem.slice(1)}` : `+ ${rem}`;
  return `${formatPoly(reading.p)} = (${formatDivisor(state.a)})${reading.quotient.length === 0 ? ' × 0' : ` × ${quotient}`} ${remainderTerm}`;
}

export interface PolyText {
  rows: [string, string][];
  status: string;
  table: [string, string][];
}

export function polyText(state: PolyState, reading: PolyReading): PolyText {
  const { c2, c1, c0, a } = state;
  const value = ratText(reading.value);
  const remainder = formatPoly(reading.remainder);
  const same = ratText(reading.value) === (reading.remainder.length ? ratText(reading.remainder[0]) : '0');
  const zero = reading.remainder.length === 0;
  const coincidence = same
    ? `le reste ${remainder} et P(${int(a)}) = ${value} coïncident`
    : `le reste ${remainder} et P(${int(a)}) = ${value} sont différents`;
  const verdict = zero
    ? `Le reste est nul${NBSP}: ${int(a)} est une racine de P (calcul exact).`
    : `Le reste n’est pas nul${NBSP}: ${int(a)} n’est pas une racine de P (calcul exact).`;
  const identity = formatIdentity(state, reading);
  const rows: [string, string][] = [
    ['Paramètres', `c₂ = ${int(c2)}${NNBSP}; c₁ = ${int(c1)}${NNBSP}; c₀ = ${int(c0)}${NNBSP}; a = ${int(a)}`],
    ['Polynôme P', formatPoly(reading.p)],
    ['Diviseur', formatDivisor(a)],
    ['Quotient Q', formatPoly(reading.quotient)],
    ['Reste R', remainder],
    [`Valeur P(${int(a)})`, value],
    ['Identité de division', identity],
    ['Comparaison', `${coincidence[0].toUpperCase()}${coincidence.slice(1)}.`],
  ];
  const range = `Exploration sur c₂, c₁, c₀ et a entiers entre ${int(-3)} et 3${NBSP}: ces essais ne démontrent rien.`;
  const status = `P = ${formatPoly(reading.p)}, divisé par ${formatDivisor(a)}. Quotient ${formatPoly(reading.quotient)}, reste ${remainder}, P(${int(a)}) = ${value}. ${identity}. ${coincidence[0].toUpperCase()}${coincidence.slice(1)}. ${verdict} ${range}`;
  const table = reading.graph.map(({ x, y }): [string, string] => [int(x), int(y)]);
  return { rows, status, table };
}
