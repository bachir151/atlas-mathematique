// Pure model of the figure of the lesson « Groupes quotients & classes ».
// Specification: docs/demandes/codex-lecon-07-groupes-quotients-reponse.md
// (section « Interaction proposée après validation »). Everything is an
// integer: no rounding. The figure computes remainders and the addition table
// of the classes modulo n for ONE chosen n and two chosen integers: it
// illustrates a case and proves nothing.

export interface QuotientState { n: number; a: number; b: number }

export const LIMITS = { n: [2, 8], a: [-20, 20], b: [-20, 20] } as const;
export const QUOTIENT_PRESET: QuotientState = { n: 4, a: 1, b: 2 };

export type QuotientField = keyof QuotientState;
export const FIELDS: readonly QuotientField[] = ['n', 'a', 'b'];

/** Integer in the limits of the field; the fallback replaces a non-number. */
export function clampField(name: QuotientField, value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = LIMITS[name];
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** Remainder of x in the Euclidean division by n: always between 0 and n − 1. */
export const remainder = (x: number, n: number) => ((x % n) + n) % n;

/** Change of a representative by +n or −n, if it stays within the bounds. */
export function shifted(state: QuotientState, name: 'a' | 'b', direction: 1 | -1): number | undefined {
  const value = state[name] + direction * state.n;
  const [min, max] = LIMITS[name];
  return value >= min && value <= max ? value : undefined;
}

export interface QuotientReading {
  n: number;
  a: number;
  b: number;
  ra: number;
  rb: number;
  sum: number;
  rs: number;
  /** table[i][j] = remainder of i + j, for 0 ≤ i, j ≤ n − 1. */
  table: number[][];
}

export function quotientReading({ n, a, b }: QuotientState): QuotientReading {
  const table = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => remainder(i + j, n)));
  return { n, a, b, ra: remainder(a, n), rb: remainder(b, n), sum: a + b, rs: remainder(a + b, n), table };
}

/* Text reading (also the content of the status line and of the table). */

const MINUS = '−';
/** French display of an integer, with the true minus sign. */
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
/** Same, parenthesised when negative: « 2 × (−3) ». */
const factor = (x: number) => (x < 0 ? `(${int(x)})` : String(x));
/** Class written [x]. */
export const cls = (x: number) => `[${int(x)}]`;
const quotientName = (n: number) => `ℤ/${n}ℤ`;

export interface QuotientText {
  rows: [string, string][];
  status: string;
  /** Header cells of the columns (after the corner cell). */
  head: string[];
  /** Row header, then the cells of the row. */
  body: { header: string; cells: string[] }[];
  /** Coordinates of the cell of the current sum, in the table. */
  current: { row: number; col: number };
  caption: string;
  /** Short description of the drawing. */
  summary: string;
}

/** « [−3] = [1] = 1 + 4ℤ » : the class of x with its remainder as representative. */
function classOf(x: number, r: number, n: number): string {
  return x === r ? `${cls(x)} = ${r} + ${n}ℤ` : `${cls(x)} = ${cls(r)} = ${r} + ${n}ℤ`;
}

function division(x: number, r: number, n: number): string {
  return `${int(x)} = ${factor((x - r) / n)} × ${n} + ${r}`;
}

export function quotientText(reading: QuotientReading): QuotientText {
  const { n, a, b, ra, rb, sum, rs, table } = reading;
  const rows: [string, string][] = [
    ['Modulo n', `n = ${n} : ${n} classes, notées ${Array.from({ length: n }, (_, i) => cls(i)).join(', ')}`],
    ['Représentants', `a = ${int(a)} ; b = ${int(b)}`],
    ['Reste de a', division(a, ra, n)],
    ['Reste de b', division(b, rb, n)],
    ['Classe de a', classOf(a, ra, n)],
    ['Classe de b', classOf(b, rb, n)],
    ['Somme a + b', `${int(a)} + ${factor(b)} = ${int(sum)}`],
    ['Reste de a + b', division(sum, rs, n)],
    ['Somme des classes', `${cls(ra)} + ${cls(rb)} = ${cls(rs)} (reste de ${ra} + ${rb} = ${ra + rb}, modulo ${n})`],
  ];
  const status = `Cas courant dans ${quotientName(n)} : ${cls(a)} + ${cls(b)} = ${sum === rs ? cls(sum) : `${cls(sum)} = ${cls(rs)}`}, car ${int(a)} + ${factor(b)} = ${int(sum)} a pour reste ${rs} modulo ${n}. `
    + 'Cette figure illustre un seul cas, avec des valeurs bornées : elle ne démontre rien.';
  const labels = Array.from({ length: n }, (_, i) => cls(i));
  return {
    rows, status,
    head: labels,
    body: table.map((line, i) => ({ header: labels[i], cells: line.map(cls) })),
    current: { row: ra, col: rb },
    caption: `Table des sommes de classes dans ${quotientName(n)} : à l’intersection de la ligne [i] et de la colonne [j] figure la classe [i] + [j]`,
    summary: `Droite des entiers de −40 à 40 et ${n} classes modulo ${n} ; les représentants a = ${int(a)} et b = ${int(b)} et leur somme ${int(sum)} sont repérés.`,
  };
}
