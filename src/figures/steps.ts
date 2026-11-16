// Pure model of the figure of the lesson « Sous-groupes & multiples entiers ».
// Specification: docs/demandes/codex-lecon-04-algebre-reponse.md
// (section « Interaction proposée »). Everything is an integer: no rounding.
// The figure lists the positions m·a + n·b for m and n in a FINITE range; it
// never claims to list every reachable position.

export interface StepsState { a: number; b: number; m: number; n: number }

export const STEP_LIMITS = { a: [-12, 12], b: [-12, 12] } as const;
export const COEFFICIENT_LIMITS = { m: [-5, 5], n: [-5, 5] } as const;
export const LIMITS = { ...STEP_LIMITS, ...COEFFICIENT_LIMITS } as const;
export const COEFFICIENT_MAX = 5;
export const STEPS_PRESET: StepsState = { a: 6, b: 4, m: 0, n: 0 };

export type StepsField = keyof StepsState;
export const FIELDS: readonly StepsField[] = ['a', 'b', 'm', 'n'];

/** Integer in the limits of the field; the fallback replaces a non-number. */
export function clampField(name: StepsField, value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = LIMITS[name];
  return Math.min(max, Math.max(min, Math.round(number)));
}

export interface Reached {
  value: number;
  /** A couple (m, n) giving the value, with |m| + |n| minimal (first found on ties). */
  m: number;
  n: number;
}

export interface StepsReading {
  ma: number;
  nb: number;
  total: number;
  /** Distinct values m·a + n·b for −5 ≤ m, n ≤ 5, increasing. */
  reached: Reached[];
  smallestPositive: number | undefined;
  /** Largest |value| reached, to scale the drawing. */
  reach: number;
}

export function stepsReading({ a, b, m, n }: StepsState): StepsReading {
  const best = new Map<number, Reached>();
  for (let i = -COEFFICIENT_MAX; i <= COEFFICIENT_MAX; i++) {
    for (let j = -COEFFICIENT_MAX; j <= COEFFICIENT_MAX; j++) {
      const value = i * a + j * b;
      const known = best.get(value);
      if (!known || Math.abs(i) + Math.abs(j) < Math.abs(known.m) + Math.abs(known.n)) best.set(value, { value, m: i, n: j });
    }
  }
  const reached = [...best.values()].sort((x, y) => x.value - y.value);
  const positive = reached.find(r => r.value > 0);
  return {
    ma: m * a, nb: n * b, total: m * a + n * b, reached,
    smallestPositive: positive?.value,
    reach: Math.max(...reached.map(r => Math.abs(r.value))),
  };
}

/* Text reading (also the content of the status line and of the table). */

const MINUS = '−';
/** French display of an integer, with the true minus sign. */
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
/** Same, parenthesised when negative: « 2 × (−3) ». */
const factor = (x: number) => (x < 0 ? `(${int(x)})` : String(x));

export interface StepsText {
  rows: [string, string][];
  status: string;
  table: [string, string, string][];
}

export function stepsText(state: StepsState, reading: StepsReading): StepsText {
  const { a, b, m, n } = state;
  const { ma, nb, total, reached, smallestPositive } = reading;
  const rows: [string, string][] = [
    ['Pas et coefficients', `a = ${int(a)} ; b = ${int(b)} ; m = ${int(m)} ; n = ${int(n)}`],
    ['m × a', `${factor(m)} × ${factor(a)} = ${int(ma)}`],
    ['n × b', `${factor(n)} × ${factor(b)} = ${int(nb)}`],
    ['Position m a + n b', `${int(ma)} + ${factor(nb)} = ${int(total)}`],
    ['Positions distinctes affichées', `${reached.length}, pour m et n entiers entre ${int(-COEFFICIENT_MAX)} et ${COEFFICIENT_MAX}`],
    ['Plus petite position strictement positive affichée', smallestPositive === undefined ? 'aucune' : String(smallestPositive)],
  ];
  const range = `Positions calculées seulement pour m et n entre ${int(-COEFFICIENT_MAX)} et ${COEFFICIENT_MAX} : ce ne sont pas nécessairement toutes les positions accessibles.`;
  const status = (a === 0 && b === 0
    ? 'a = b = 0 : toute combinaison m a + n b vaut 0, quelle que soit la valeur de m et de n. '
    : `Position courante : ${int(ma)} + ${factor(nb)} = ${int(total)}. `) + range;
  const table = reached.map(({ value, m: i, n: j }): [string, string, string] => [
    int(value), `(${int(i)}, ${int(j)})`, `${factor(i)} × ${factor(a)} + ${factor(j)} × ${factor(b)}`,
  ]);
  return { rows, status, table };
}
