// Pure model of the figure of the lesson « Anneaux quotients & morphismes ».
// Specification: docs/demandes/codex-lecon-13-anneaux-quotients-reponse.md
// (paragraph « Interaction proposée, après validation »). Everything is an
// integer: no rounding. The figure computes remainders, the classes of a + b
// and a b, the computations before reduction and the two full tables of the
// classes modulo n, for ONE chosen n and two chosen integers: it illustrates
// a case and proves nothing.

export interface RQuotState { n: number; a: number; b: number }

export const LIMITS = { n: [2, 8], a: [-20, 20], b: [-20, 20] } as const;
export const RQUOT_PRESET: RQuotState = { n: 4, a: 1, b: 2 };

export type RQuotField = keyof RQuotState;
export const FIELDS: readonly RQuotField[] = ['n', 'a', 'b'];

/** Integer in the limits of the field; the fallback replaces a non-number. */
export function clampField(name: RQuotField, value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = LIMITS[name];
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** Remainder of x in the Euclidean division by n: always between 0 and n − 1. */
export const remainder = (x: number, n: number) => ((x % n) + n) % n;

/** Change of a representative by +n or −n, if it stays within the bounds. */
export function shifted(state: RQuotState, name: 'a' | 'b', direction: 1 | -1): number | undefined {
  const value = state[name] + direction * state.n;
  const [min, max] = LIMITS[name];
  return value >= min && value <= max ? value : undefined;
}

export interface RQuotReading {
  n: number;
  a: number;
  b: number;
  ra: number;
  rb: number;
  sum: number;
  product: number;
  rs: number;
  rp: number;
  /** add[i][j] = remainder of i + j, for 0 ≤ i, j ≤ n − 1. */
  add: number[][];
  /** mul[i][j] = remainder of i × j, for 0 ≤ i, j ≤ n − 1. */
  mul: number[][];
  /** Pairs i ≤ j of non-zero classes whose product is the class [0]. */
  zeroProducts: [number, number][];
}

export function rquotReading({ n, a, b }: RQuotState): RQuotReading {
  const grid = (op: (i: number, j: number) => number) =>
    Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => remainder(op(i, j), n)));
  const mul = grid((i, j) => i * j);
  const zeroProducts: [number, number][] = [];
  for (let i = 1; i < n; i++) for (let j = i; j < n; j++) if (mul[i][j] === 0) zeroProducts.push([i, j]);
  return {
    n, a, b, ra: remainder(a, n), rb: remainder(b, n),
    sum: a + b, product: a * b, rs: remainder(a + b, n), rp: remainder(a * b, n),
    add: grid((i, j) => i + j), mul, zeroProducts,
  };
}

/* Text reading (also the content of the status line and of the tables). */

const MINUS = '−';
/** French display of an integer, with the true minus sign. */
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
/** Same, parenthesised when negative: « 2 × (−3) ». */
const factor = (x: number) => (x < 0 ? `(${int(x)})` : String(x));
/** Class written [x]. */
export const cls = (x: number) => `[${int(x)}]`;
const quotientName = (n: number) => `ℤ/${n}ℤ`;

export interface RQuotTable {
  corner: string;
  head: string[];
  body: { header: string; cells: string[] }[];
  /** Coordinates of the cell of the current result. */
  current: { row: number; col: number };
  caption: string;
}

export interface RQuotText {
  rows: [string, string][];
  status: string;
  add: RQuotTable;
  mul: RQuotTable;
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

/** « [x] = [r] » or « [x] » when x is already its own remainder. */
const same = (x: number, r: number) => (x === r ? cls(x) : `${cls(x)} = ${cls(r)}`);

/** Description of the zero products among non-zero classes. */
export function zeroProductsText(n: number, pairs: [number, number][]): string {
  if (pairs.length === 0) return `aucun produit de deux classes non nulles ne donne ${cls(0)} dans ${quotientName(n)}`;
  const list = pairs.map(([i, j]) => `${cls(i)} × ${cls(j)} = ${cls(0)}`).join(' ; ');
  return `${list} (classes non nulles, produit nul dans ${quotientName(n)})`;
}

export function rquotText(reading: RQuotReading): RQuotText {
  const { n, a, b, ra, rb, sum, product, rs, rp, add, mul, zeroProducts } = reading;
  const labels = Array.from({ length: n }, (_, i) => cls(i));
  const rows: [string, string][] = [
    ['Modulo n', `n = ${n} : ${n} classes, notées ${labels.join(', ')}`],
    ['Représentants', `a = ${int(a)} ; b = ${int(b)}`],
    ['Reste de a', division(a, ra, n)],
    ['Reste de b', division(b, rb, n)],
    ['Classe de a', classOf(a, ra, n)],
    ['Classe de b', classOf(b, rb, n)],
    ['Somme avant réduction', `a + b = ${int(a)} + ${factor(b)} = ${int(sum)}`],
    ['Produit avant réduction', `a × b = ${int(a)} × ${factor(b)} = ${int(product)}`],
    ['Reste de a + b', division(sum, rs, n)],
    ['Reste de ab', division(product, rp, n)],
    ['Somme des classes', `${cls(ra)} + ${cls(rb)} = ${cls(rs)} (reste de ${ra} + ${rb} = ${ra + rb}, modulo ${n})`],
    ['Produit des classes', `${cls(ra)} × ${cls(rb)} = ${cls(rp)} (reste de ${ra} × ${rb} = ${ra * rb}, modulo ${n})`],
    ['Produits nuls', zeroProductsText(n, zeroProducts)],
  ];
  const status = `Cas courant dans ${quotientName(n)} : ${cls(a)} + ${cls(b)} = ${same(sum, rs)} et ${cls(a)} × ${cls(b)} = ${same(product, rp)}, `
    + `car ${int(a)} + ${factor(b)} = ${int(sum)} a pour reste ${rs} et ${int(a)} × ${factor(b)} = ${int(product)} a pour reste ${rp} modulo ${n}. `
    + 'Cette figure illustre un seul cas, avec des valeurs bornées : elle ne démontre rien.';
  const table = (corner: string, grid: number[][], row: number, col: number, what: string): RQuotTable => ({
    corner, head: labels,
    body: grid.map((line, i) => ({ header: labels[i], cells: line.map(cls) })),
    current: { row, col },
    caption: `Table des ${what} de classes dans ${quotientName(n)} : à l’intersection de la ligne [i] et de la colonne [j] figure la classe [i] ${corner} [j]`,
  });
  return {
    rows, status,
    add: table('+', add, ra, rb, 'sommes'),
    mul: table('×', mul, ra, rb, 'produits'),
    summary: `${n} classes modulo ${n} ; les classes des représentants a = ${int(a)} et b = ${int(b)}, de a + b = ${int(sum)} et de ab = ${int(product)} sont repérées.`,
  };
}
