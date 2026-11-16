// Pure model of the figure of the lesson « Anneaux & corps ».
// Specification: docs/demandes/codex-lecon-11-anneaux-corps-reponse.md
// (section « Interaction proposée après validation »). Everything is an
// integer: no rounding. The figure shows the multiplication table of the
// classes modulo n for ONE chosen n (from 2 to 12) and two chosen remainders:
// it illustrates finite cases and proves no general criterion.

export interface RingState { n: number; a: number; b: number }

export const LIMITS = { n: [2, 12] } as const;
export const RING_PRESET: RingState = { n: 6, a: 2, b: 3 };

export type RingField = keyof RingState;
export const FIELDS: readonly RingField[] = ['n', 'a', 'b'];

/** Bounds of a field in a state: a and b range over the remainders 0 … n − 1. */
export function boundsOf(name: RingField, n: number): [number, number] {
  return name === 'n' ? [LIMITS.n[0], LIMITS.n[1]] : [0, n - 1];
}

/** Integer within the bounds; the fallback replaces a non-number. */
export function clampField(name: RingField, value: unknown, fallback: number, n: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = boundsOf(name, n);
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** Changes n and brings a and b back to their remainders modulo the new n. */
export function withModulus(state: RingState, n: number): RingState {
  return { n, a: state.a % n, b: state.b % n };
}

/** Change of n by +1 or −1, if it stays within the bounds. */
export function steppedModulus(state: RingState, direction: 1 | -1): number | undefined {
  const n = state.n + direction;
  return n >= LIMITS.n[0] && n <= LIMITS.n[1] ? n : undefined;
}

export interface RingReading {
  n: number;
  a: number;
  b: number;
  /** Integer product a × b. */
  product: number;
  /** Remainder of a × b modulo n. */
  rp: number;
  /** table[i][j] = remainder of i × j, for 0 ≤ i, j ≤ n − 1. */
  table: number[][];
  /** inverse[x] = the inverse of x modulo n, or undefined. */
  inverse: (number | undefined)[];
  /** Units (invertible remainders) with their inverse, in increasing order. */
  units: { value: number; inverse: number }[];
  /** Pairs i ≤ j of non-zero remainders with i × j ≡ 0 modulo n. */
  zeroPairs: [number, number][];
}

export function ringReading({ n, a, b }: RingState): RingReading {
  const table = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i * j) % n));
  const inverse = Array.from({ length: n }, (_, x) => {
    for (let y = 0; y < n; y++) if (table[x][y] === 1) return y;
    return undefined;
  });
  const units: { value: number; inverse: number }[] = [];
  inverse.forEach((y, x) => { if (y !== undefined) units.push({ value: x, inverse: y }); });
  const zeroPairs: [number, number][] = [];
  for (let i = 1; i < n; i++) for (let j = i; j < n; j++) if (table[i][j] === 0) zeroPairs.push([i, j]);
  return { n, a, b, product: a * b, rp: table[a][b], table, inverse, units, zeroPairs };
}

/* Text reading (also the content of the status line and of the table). */

/** Class written [x]. */
export const cls = (x: number) => `[${x}]`;
const ringName = (n: number) => `ℤ/${n}ℤ`;

export interface RingText {
  rows: [string, string][];
  status: string;
  /** Header cells of the columns (after the corner cell). */
  head: string[];
  /** Row header, then the cells of the row. */
  body: { header: string; cells: string[] }[];
  /** Coordinates of the selected cell, in the table. */
  current: { row: number; col: number };
  caption: string;
  /** Short description of the drawing. */
  summary: string;
}

function inverseText(x: number, inverse: number | undefined, n: number): string {
  return inverse === undefined
    ? `${cls(x)} n’a pas d’inverse modulo ${n} : aucun reste y entre 0 et ${n - 1} ne donne ${x} × y de reste 1`
    : `${cls(x)} a pour inverse ${cls(inverse)} : ${x} × ${inverse} = ${x * inverse}, de reste 1 modulo ${n}`;
}

export function ringText(reading: RingReading): RingText {
  const { n, a, b, product, rp, table, inverse, units, zeroPairs } = reading;
  const unitList = units.length === 0
    ? 'aucun'
    : units.map(({ value, inverse: y }) => `${cls(value)} (inverse ${cls(y)})`).join(', ');
  const zeroList = zeroPairs.length === 0
    ? `aucun couple de restes non nuls de produit nul modulo ${n}`
    : zeroPairs.map(([i, j]) => `${cls(i)} × ${cls(j)} = ${cls(0)}`).join(' ; ');
  const rows: [string, string][] = [
    ['Modulo n', `n = ${n} : ${n} classes, notées ${Array.from({ length: n }, (_, i) => cls(i)).join(', ')}`],
    ['Restes choisis', `a = ${a} ; b = ${b}`],
    ['Case sélectionnée', `ligne ${cls(a)}, colonne ${cls(b)}`],
    ['Calcul entier', `${a} × ${b} = ${product}`],
    ['Reste modulo n', `${product} a pour reste ${rp} modulo ${n}`],
    ['Produit des classes', `${cls(a)} × ${cls(b)} = ${cls(rp)}`],
    ['Inverse de a', inverseText(a, inverse[a], n)],
    ['Inverse de b', inverseText(b, inverse[b], n)],
    ['Classes inversibles', unitList],
    ['Produits nuls de facteurs non nuls', zeroList],
  ];
  const status = `Cas courant dans ${ringName(n)} : ${cls(a)} × ${cls(b)} = ${cls(rp)}, car ${a} × ${b} = ${product} a pour reste ${rp} modulo ${n}. `
    + `Classes inversibles : ${units.length} sur ${n}. Couples non nuls de produit nul : ${zeroPairs.length}. `
    + 'Cette figure illustre des cas finis, pour n de 2 à 12 : elle ne démontre aucun critère général.';
  const labels = Array.from({ length: n }, (_, i) => cls(i));
  return {
    rows, status,
    head: labels,
    body: table.map((line, i) => ({ header: labels[i], cells: line.map(cls) })),
    current: { row: a, col: b },
    caption: `Table des produits de classes dans ${ringName(n)} : à l’intersection de la ligne [i] et de la colonne [j] figure la classe [i] × [j]`,
    summary: `Table de multiplication de ${n} lignes et ${n} colonnes ; la case de la ligne ${cls(a)} et de la colonne ${cls(b)} est sélectionnée et contient ${cls(rp)}.`,
  };
}
