// Pure model of the figure of the lesson « Idéaux & multiples ».
// Specification: docs/demandes/codex-lecon-12-ideaux-reponse.md
// (section « Interaction proposée après validation »). Everything is an integer.
// The figure lists the integers from −24 to 24 and the combinations u·a + v·b
// for u and v in a FINITE range: the list may omit elements of the ideal and
// proves nothing about its general description. The « multiples of 0 » are {0}.

export interface IdealState { a: number; b: number; u: number; v: number }

export const LIMITS = { a: [-12, 12], b: [-12, 12], u: [-5, 5], v: [-5, 5] } as const;
export const LINE_MAX = 24;
export const COEFFICIENT_MAX = 5;
export const IDEAL_PRESET: IdealState = { a: 6, b: 4, u: 1, v: -1 };

export type IdealField = keyof IdealState;
export const FIELDS: readonly IdealField[] = ['a', 'b', 'u', 'v'];

/** Integer in the limits of the field; the fallback replaces a non-number. */
export function clampField(name: IdealField, value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = LIMITS[name];
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** k is a multiple of d: for d = 0 the only multiple is 0 (no division by 0). */
export function isMultiple(k: number, d: number): boolean {
  return d === 0 ? k === 0 : k % d === 0;
}

export interface Combination { u: number; v: number }

export interface Entry {
  k: number;
  inA: boolean;
  inB: boolean;
  inBoth: boolean;
  /** A couple (u, v) within ±5 giving k, with |u| + |v| minimal (first found on ties), or null. */
  combination: Combination | null;
}

export interface IdealReading {
  ua: number;
  vb: number;
  total: number;
  /** The selected value lies on the drawn line (−24 to 24). */
  onLine: boolean;
  currentInA: boolean;
  currentInB: boolean;
  entries: Entry[];
  countA: number;
  countB: number;
  countBoth: number;
  /** Displayed integers that are a multiple of a or of b. */
  countEither: number;
  countCombination: number;
  smallestPositiveCombination: number | undefined;
}

export function idealReading({ a, b, u, v }: IdealState): IdealReading {
  const best = new Map<number, Combination>();
  for (let i = -COEFFICIENT_MAX; i <= COEFFICIENT_MAX; i++) {
    for (let j = -COEFFICIENT_MAX; j <= COEFFICIENT_MAX; j++) {
      const value = i * a + j * b;
      const known = best.get(value);
      if (!known || Math.abs(i) + Math.abs(j) < Math.abs(known.u) + Math.abs(known.v)) best.set(value, { u: i, v: j });
    }
  }
  const entries: Entry[] = [];
  for (let k = -LINE_MAX; k <= LINE_MAX; k++) {
    const inA = isMultiple(k, a), inB = isMultiple(k, b);
    entries.push({ k, inA, inB, inBoth: inA && inB, combination: best.get(k) ?? null });
  }
  const total = u * a + v * b + 0;
  const positive = entries.find(e => e.k > 0 && e.combination);
  return {
    ua: u * a + 0, vb: v * b + 0, total,
    onLine: Math.abs(total) <= LINE_MAX,
    currentInA: isMultiple(total, a), currentInB: isMultiple(total, b),
    entries,
    countA: entries.filter(e => e.inA).length,
    countB: entries.filter(e => e.inB).length,
    countBoth: entries.filter(e => e.inBoth).length,
    countEither: entries.filter(e => e.inA || e.inB).length,
    countCombination: entries.filter(e => e.combination).length,
    smallestPositiveCombination: positive?.k,
  };
}

/* Text reading (also the content of the status line and of the table). */

const MINUS = '−';
const NB = ' ';
/** French display of an integer, with the true minus sign. */
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
/** Same, parenthesised when negative: « 2 × (−3) ». */
const factor = (x: number) => (x < 0 ? `(${int(x)})` : String(x));
const yesNo = (x: boolean) => (x ? 'oui' : 'non');

export interface IdealText {
  rows: [string, string][];
  status: string;
  table: [string, string, string, string, string][];
}

/** « 1 × 6 + (−1) × 4 = 2 » */
export const calculation = (u: number, a: number, v: number, b: number) =>
  `${factor(u)} × ${factor(a)} + ${factor(v)} × ${factor(b)} = ${int(u * a + v * b)}`;

export function idealText(state: IdealState, reading: IdealReading): IdealText {
  const { a, b, u, v } = state;
  const { total, onLine, currentInA, currentInB, countA, countB, countBoth, countEither, countCombination, smallestPositiveCombination } = reading;
  const count = (n: number, zero: boolean) => (zero ? `${n} (seulement 0)` : String(n));
  const rows: [string, string][] = [
    ['Générateurs et coefficients', `a = ${int(a)} ; b = ${int(b)} ; u = ${int(u)} ; v = ${int(v)}`],
    ['Calcul sélectionné u a + v b', calculation(u, a, v, b)],
    ['Position du résultat', onLine ? `${int(total)}, sur la droite` : `${int(total)}, hors de la droite (de ${int(-LINE_MAX)} à ${LINE_MAX})`],
    ['Multiple de a', yesNo(currentInA)],
    ['Multiple de b', yesNo(currentInB)],
    ['Multiples de a affichés', count(countA, a === 0)],
    ['Multiples de b affichés', count(countB, b === 0)],
    ['Multiples communs à a et à b affichés', count(countBoth, a === 0 || b === 0)],
    ['Entiers affichés multiples de a ou de b', String(countEither)],
    ['Entiers affichés avec une combinaison dans les bornes', `${countCombination}, pour u et v entiers entre ${int(-COEFFICIENT_MAX)} et ${COEFFICIENT_MAX}`],
    ['Plus petit entier strictement positif affiché comme combinaison', smallestPositiveCombination === undefined ? 'aucun' : String(smallestPositiveCombination)],
  ];
  const zeroNote = a === 0 && b === 0
    ? ` a = b = 0${NB}: les multiples de 0 se réduisent à 0 et toute combinaison u a + v b vaut 0, quelles que soient les valeurs de u et de v.`
    : a === 0 || b === 0
      ? ` ${a === 0 ? 'a' : 'b'} = 0${NB}: les multiples de 0 se réduisent à 0.`
      : '';
  const range = ` Entiers affichés de ${int(-LINE_MAX)} à ${LINE_MAX}, combinaisons calculées seulement pour u et v entre ${int(-COEFFICIENT_MAX)} et ${COEFFICIENT_MAX}${NB}: la liste peut omettre des éléments de l’idéal et ne prouve rien sur sa description générale.`;
  const status = `Calcul sélectionné${NB}: ${calculation(u, a, v, b)}. Ce résultat `
    + (onLine ? 'est sur la droite affichée' : 'est hors de la droite affichée')
    + `${NB}; multiple de a${NB}: ${yesNo(currentInA)}${NB}; multiple de b${NB}: ${yesNo(currentInB)}.` + zeroNote + range;
  const table = reading.entries.map((e): [string, string, string, string, string] => [
    int(e.k), yesNo(e.inA), yesNo(e.inB), yesNo(e.inBoth),
    e.combination ? `(${int(e.combination.u)}, ${int(e.combination.v)})${NB}: ${calculation(e.combination.u, a, e.combination.v, b)}` : 'aucune dans les bornes',
  ]);
  return { rows, status, table };
}
