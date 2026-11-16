// Pure model of the figure of the lesson « Morphismes & isomorphismes ».
// Specification: docs/demandes/codex-lecon-06-morphismes-isomorphismes-reponse.md
// (section « Interaction proposée après validation »). Everything is an integer.
// The figure tries the map p(k) = r^k on a FINITE range of integers; it never
// claims that finite trials prove the general property.

export interface MorphismState { m: number; n: number }

export const RANGE: readonly [number, number] = [-12, 12];
export const SUM_RANGE: readonly [number, number] = [-24, 24];
export const MORPHISM_PRESET: MorphismState = { m: 1, n: 5 };
export const FIELDS = ['m', 'n'] as const;
export type MorphismField = (typeof FIELDS)[number];

/** Integer in the range; the fallback replaces a non-number. */
export function clampField(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(RANGE[1], Math.max(RANGE[0], Math.round(number)));
}

/** Euclidean division by 4: k = 4q + s with 0 ≤ s < 4. */
export function euclid(k: number): { q: number; s: number } {
  const s = ((k % 4) + 4) % 4;
  return { q: (k - s) / 4, s };
}

/** Exponent s in {0, 1, 2, 3} of the rotation p(k) = r^k = r^s. */
export const rotation = (k: number): number => euclid(k).s;
/** Composition r^a ∘ r^b = r^((a + b) mod 4), for exponents in {0, …, 3}. */
export const compose = (a: number, b: number): number => rotation(a + b);

export interface MorphismReading {
  m: number; n: number;
  pm: number; pn: number;
  difference: number;
  quotient: number; remainder: number;
  sameRotation: boolean;
  sum: number;
  pSum: number;
  composed: number;
  sumsAgree: boolean;
}

export function morphismReading({ m, n }: MorphismState): MorphismReading {
  const pm = rotation(m), pn = rotation(n);
  const difference = n - m;
  const { q, s } = euclid(difference);
  const sum = m + n;
  const pSum = rotation(sum), composed = compose(pm, pn);
  return {
    m, n, pm, pn, difference, quotient: q, remainder: s,
    sameRotation: pm === pn, sum, pSum, composed, sumsAgree: pSum === composed,
  };
}

/* Text reading (also the content of the status line and of the table). */

const MINUS = '−';
/** French display of an integer, with the true minus sign. */
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
/** Same, parenthesised when negative. */
const factor = (x: number) => (x < 0 ? `(${int(x)})` : String(x));
/** Name of the rotation of exponent 0..3: e, r, r², r³. */
export const rotationName = (s: number) => ['e', 'r', 'r²', 'r³'][s];

export interface MorphismText {
  rows: [string, string][];
  status: string;
  table: [string, string, string][];
}

export function morphismText(reading: MorphismReading): MorphismText {
  const { m, n, pm, pn, difference, quotient, remainder, sameRotation, sum, pSum, composed, sumsAgree } = reading;
  const sub = `${int(n)} − ${factor(m)} = ${int(difference)}`;
  const division = `${int(difference)} = 4 × ${factor(quotient)} + ${remainder}`;
  const rows: [string, string][] = [
    ['Entiers choisis', `m = ${int(m)} ; n = ${int(n)}`],
    ['p(m)', `p(${int(m)}) = ${rotationName(pm)}`],
    ['p(n)', `p(${int(n)}) = ${rotationName(pn)}`],
    ['Différence n − m', sub],
    ['Reste modulo 4 de n − m', `${division} : reste ${remainder}`],
    ['p(m) et p(n)', sameRotation ? 'même rotation' : 'rotations différentes'],
    ['Somme m + n', `${int(m)} + ${factor(n)} = ${int(sum)}`],
    ['p(m + n)', `p(${int(sum)}) = ${rotationName(pSum)}`],
    ['p(m) ∘ p(n)', `${rotationName(pm)} ∘ ${rotationName(pn)} = ${rotationName(composed)}`],
    ['p(m + n) et p(m) ∘ p(n)', sumsAgree ? 'même rotation' : 'rotations différentes'],
  ];
  const first = `Essai avec m = ${int(m)} et n = ${int(n)} : p(m) = ${rotationName(pm)}, p(n) = ${rotationName(pn)} ; n − m = ${int(difference)}, de reste ${remainder} modulo 4 ; ${sameRotation ? 'mêmes rotations' : 'rotations différentes'}. `;
  const second = `p(m + n) = p(${int(sum)}) = ${rotationName(pSum)} et p(m) ∘ p(n) = ${rotationName(composed)} : ${sumsAgree ? 'mêmes rotations' : 'rotations différentes'}. `;
  const range = `Expérience finie : m et n entre ${int(RANGE[0])} et ${RANGE[1]}, somme calculée exactement entre ${int(SUM_RANGE[0])} et ${SUM_RANGE[1]} ; ces essais ne prouvent pas la propriété générale.`;
  const table: [string, string, string][] = [];
  for (let k = RANGE[0]; k <= RANGE[1]; k++) {
    const { q, s } = euclid(k);
    table.push([int(k), `${int(k)} = 4 × ${factor(q)} + ${s}`, rotationName(s)]);
  }
  return { rows, status: first + second + range, table };
}
