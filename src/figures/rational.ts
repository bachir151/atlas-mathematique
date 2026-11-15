// Exact rational numbers (BigInt) and their French display, for the figures of
// the lesson « Suites géométriques & sommes infinies »: every test such as
// |R_N| < ε is decided exactly, and approximate displays are marked « ≈ ».

export interface Rational { readonly n: bigint; readonly d: bigint } // d > 0, reduced

const abs = (x: bigint) => (x < 0n ? -x : x);
function gcd(a: bigint, b: bigint): bigint {
  a = abs(a); b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function rat(n: bigint | number, d: bigint | number = 1n): Rational {
  let num = BigInt(n), den = BigInt(d);
  if (den === 0n) throw new RangeError('Dénominateur nul');
  if (den < 0n) { num = -num; den = -den; }
  const g = gcd(num, den) || 1n;
  return { n: num / g, d: den / g };
}

export const add = (x: Rational, y: Rational) => rat(x.n * y.d + y.n * x.d, x.d * y.d);
export const sub = (x: Rational, y: Rational) => rat(x.n * y.d - y.n * x.d, x.d * y.d);
export const mul = (x: Rational, y: Rational) => rat(x.n * y.n, x.d * y.d);
export const div = (x: Rational, y: Rational) => rat(x.n * y.d, x.d * y.n);
export const absR = (x: Rational): Rational => ({ n: abs(x.n), d: x.d });
export const sign = (x: Rational) => (x.n > 0n ? 1 : x.n < 0n ? -1 : 0);
export const cmp = (x: Rational, y: Rational) => sign(sub(x, y));
export const isZero = (x: Rational) => x.n === 0n;
export function pow(x: Rational, k: number): Rational {
  return rat(x.n ** BigInt(k), x.d ** BigInt(k));
}
export const toNumber = (x: Rational) => Number(x.n) / Number(x.d);

const MINUS = '−';
const digits = (x: bigint) => abs(x).toString().length;

/** Number of decimals of x if its decimal expansion is finite, else undefined. */
function decimals(x: Rational): number | undefined {
  let d = x.d, twos = 0, fives = 0;
  while (d % 2n === 0n) { d /= 2n; twos++; }
  while (d % 5n === 0n) { d /= 5n; fives++; }
  return d === 1n ? Math.max(twos, fives) : undefined;
}

function exactDecimal(x: Rational, places: number): string {
  const scaled = abs(x.n) * 10n ** BigInt(places) / x.d;
  const text = scaled.toString().padStart(places + 1, '0');
  const int = text.slice(0, text.length - places), frac = text.slice(text.length - places);
  return `${x.n < 0n ? MINUS : ''}${int}${places ? `,${frac}` : ''}`;
}

const SUPERSCRIPT: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const SUBSCRIPT = '₀₁₂₃₄₅₆₇₈₉';
export const subscript = (k: number) => String(k).split('').map(c => SUBSCRIPT[Number(c)]).join('');

/** Approximate French display of a JavaScript number: 6 significant digits (3 in scientific notation). */
export function approxNumber(x: number): string {
  if (x === 0) return '0';
  const a = Math.abs(x);
  let text: string;
  if (a >= 1e-3 && a < 1e6) {
    text = String(Number(a.toPrecision(6))).replace('.', ',');
  } else {
    const [mantissa, exponent] = a.toExponential(2).split('e');
    text = `${mantissa.replace('.', ',')} × 10${exponent.replace('+', '').split('').map(c => SUPERSCRIPT[c]).join('')}`;
  }
  return `${x < 0 ? MINUS : ''}${text}`;
}

export interface Display { text: string; exact: boolean }

/**
 * Short display: integer, short decimal, fraction with small terms, or an
 * approximation flagged « ≈ » when the exact value is too long to read.
 */
export function display(x: Rational): Display {
  if (x.d === 1n) return { text: `${x.n < 0n ? MINUS : ''}${abs(x.n)}`, exact: true };
  const fraction = { text: `${x.n < 0n ? MINUS : ''}${abs(x.n)}/${x.d}`, exact: true };
  const places = decimals(x);
  // Halves, quarters…: fractions as in the lesson (15/16, 1/24); others as decimals.
  const powerOfTwo = (x.d & (x.d - 1n)) === 0n;
  if (powerOfTwo && x.d >= 8n && digits(x.n) <= 6) return fraction;
  if (places !== undefined && places <= 8) return { text: exactDecimal(x, places), exact: true };
  if (digits(x.n) <= 6 && digits(x.d) <= 4) return fraction;
  return { text: `≈ ${approxNumber(toNumber(x))}`, exact: false };
}

/** Display followed, for a fraction, by its decimal value (« = » if finite and short, else « ≈ »). */
export function displayWithDecimal(x: Rational): string {
  const shown = display(x);
  if (!shown.exact || !shown.text.includes('/')) return shown.text;
  const places = decimals(x);
  return places !== undefined && places <= 6
    ? `${shown.text} = ${exactDecimal(x, places)}`
    : `${shown.text} ≈ ${approxNumber(toNumber(x))}`;
}

/** « = 15/16 = 0,9375 » for an exact value, « ≈ 0,003933 » for an approximation. */
export function relation(x: Rational): string {
  const text = displayWithDecimal(x);
  return text.startsWith('≈') ? text : `= ${text}`;
}

/** Number field value (dot decimal) of an integer count of 1/scale. */
export const fieldValue = (scaled: number, scale: number) => String(scaled / scale);

/** French display of a parameter stored as an integer count of 1/scale. */
export const displayScaled = (scaled: number, scale: number) => display(rat(scaled, scale)).text;
