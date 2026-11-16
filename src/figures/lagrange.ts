// Pure model of the figures of the lesson « Lagrange & conjugaison ».
// Specification: docs/demandes/codex-lecon-10-lagrange-conjugaison-reponse.md
// (section « Figures et interactions proposées »).
// Group: D₄ = {rⁱ, rⁱs | 0 ≤ i < 4}, r quarter turn counter-clockwise
// r(x, y) = (−y, x), s vertical-axis reflection s(x, y) = (−x, y), composition
// from right to left (gh = apply h, then g). Each element is an integer 2×2
// matrix [a, b, c, d] (rows (a, b) and (c, d)); every product is computed
// exactly, nothing is hard-coded except the names and the five subgroups.

export type Matrix = readonly [number, number, number, number];

// « + 0 » turns a negative zero into 0.
const mul = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[1] * n[2] + 0, m[0] * n[1] + m[1] * n[3] + 0,
  m[2] * n[0] + m[3] * n[2] + 0, m[2] * n[1] + m[3] * n[3] + 0,
];
const IDENTITY: Matrix = [1, 0, 0, 1];
const R: Matrix = [0, -1, 1, 0];
const S: Matrix = [-1, 0, 0, 1];

/** Elements in the order e, r, r², r³, s, rs, r²s, r³s (index i < 4: rⁱ; index 4 + i: rⁱs). */
export const ELEMENT_NAMES: readonly string[] = ['e', 'r', 'r²', 'r³', 's', 'rs', 'r²s', 'r³s'];
export const ORDER = ELEMENT_NAMES.length;
export const MATRICES: readonly Matrix[] = (() => {
  const powers: Matrix[] = [IDENTITY];
  for (let i = 1; i < 4; i++) powers.push(mul(R, powers[i - 1]));
  return [...powers, ...powers.map(p => mul(p, S))];
})();

const same = (m: Matrix, n: Matrix) => m.every((x, i) => x === n[i]);
/** Index of the element equal to the matrix (always found for products of elements). */
function indexOf(m: Matrix): number {
  const i = MATRICES.findIndex(n => same(m, n));
  if (i < 0) throw new Error('Matrice hors de D₄');
  return i;
}

/** Product gh (apply h first, then g), as an element index. */
export const product = (g: number, h: number) => indexOf(mul(MATRICES[g], MATRICES[h]));
export const inverse = (g: number) => {
  const i = MATRICES.findIndex((_, h) => product(g, h) === 0);
  return i;
};
/** g x g⁻¹. */
export const conjugate = (g: number, x: number) => product(product(g, x), inverse(g));
export const isReflection = (x: number) => x >= 4;
/** Order of the element (smallest k ≥ 1 with xᵏ = e). */
export function elementOrder(x: number): number {
  let k = 1, p = x;
  while (p !== 0) { p = product(p, x); k++; }
  return k;
}

/* Reflection axes: the direction (dx, dy) of the fixed line, among four. */
export type Axis = readonly [number, number];
const AXES: readonly { dir: Axis; name: string }[] = [
  { dir: [0, 1], name: 'l’axe vertical' },
  { dir: [1, 0], name: 'l’axe horizontal' },
  { dir: [1, 1], name: 'la diagonale y = x' },
  { dir: [1, -1], name: 'la diagonale y = −x' },
];
const apply = (m: Matrix, [x, y]: Axis): Axis => [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
/** Axis of a reflection (undefined for a rotation): the candidate line it fixes pointwise. */
export function axisOf(x: number): { dir: Axis; name: string } | undefined {
  if (!isReflection(x)) return undefined;
  return AXES.find(({ dir }) => { const [u, v] = apply(MATRICES[x], dir); return u === dir[0] && v === dir[1]; });
}

/* Subgroups offered by the left-cosets panel. */
export interface SubgroupChoice { label: string; members: readonly number[] }
export const SUBGROUPS: readonly SubgroupChoice[] = [
  { label: '{e}', members: [0] },
  { label: '{e, r²}', members: [0, 2] },
  { label: '{e, r, r², r³}', members: [0, 1, 2, 3] },
  { label: '{e, s}', members: [0, 4] },
  { label: 'D₄ (les huit éléments)', members: [0, 1, 2, 3, 4, 5, 6, 7] },
];

export interface ClassesState { sub: number; rep: number }
export interface ConjugationState { x: number; g: number }
export const CLASSES_PRESET: ClassesState = { sub: 1, rep: 1 };
export const CONJUGATION_PRESET: ConjugationState = { x: 4, g: 1 };

/** Integer index in [0, count − 1]; the fallback replaces anything else. */
export function clampIndex(value: unknown, count: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || value === '' || value === null) return fallback;
  return Math.min(count - 1, Math.max(0, Math.round(n)));
}

export const MINUS = '−';
const name = (i: number) => ELEMENT_NAMES[i];
const setText = (items: readonly number[]) => `{${items.map(name).join(', ')}}`;
const sortedSet = (items: readonly number[]) => [...new Set(items)].sort((a, b) => a - b);

/* ---------- Left cosets ---------- */

export interface ClassesReading {
  h: readonly number[];
  /** aH in the order of H: a·h for h in H. */
  aH: number[];
  /** Distinct left cosets, as sorted sets, ordered by their smallest element. */
  classes: number[][];
  /** Position (0-based) in `classes` of the coset containing each element. */
  classOf: number[];
  selected: number;
  size: number;
  index: number;
  aHContainsE: boolean;
}

export function classesReading({ sub, rep }: ClassesState): ClassesReading {
  const h = SUBGROUPS[sub].members;
  const aH = h.map(x => product(rep, x));
  const seen = new Map<string, number[]>();
  for (let a = 0; a < ORDER; a++) {
    const coset = sortedSet(h.map(x => product(a, x)));
    const key = coset.join(',');
    if (!seen.has(key)) seen.set(key, coset);
  }
  const classes = [...seen.values()].sort((p, q) => p[0] - q[0]);
  const classOf = new Array<number>(ORDER).fill(-1);
  classes.forEach((c, k) => c.forEach(x => { classOf[x] = k; }));
  const key = sortedSet(aH).join(',');
  return {
    h, aH, classes, classOf,
    selected: classes.findIndex(c => c.join(',') === key),
    size: h.length, index: classes.length, aHContainsE: aH.includes(0),
  };
}

export interface FigureText {
  rows: [string, string][];
  status: string;
  headers: string[];
  caption: string;
  table: string[][];
}

export function classesText(state: ClassesState, reading: ClassesReading): FigureText {
  const { rep } = state;
  const { h, aH, classes, selected, size, index, aHContainsE } = reading;
  const calc = h.map((x, k) => `${name(rep)}·${name(x)} = ${name(aH[k])}`).join(' ; ');
  const sizes = classes.map(c => c.length);
  const equal = sizes.every(s => s === size);
  const containsE = aHContainsE ? 'contient e' : 'ne contient pas e';
  const rows: [string, string][] = [
    ['Sous-groupe H', `${SUBGROUPS[state.sub].label}, ${size} élément${size > 1 ? 's' : ''}`],
    ['Représentant a', name(rep)],
    ['Classe aH', `${setText(aH)} (${calc})`],
    ['Taille de aH', String(aH.length)],
    ['e dans aH', aHContainsE ? 'oui' : 'non'],
    ['Classes à gauche distinctes', `${index} : ${classes.map((c, k) => `C${k + 1} = ${setText(c)}`).join(' ; ')}`],
    ['Tailles des classes', `${sizes.join(' ; ')}${equal ? ' : toutes égales' : ''}`],
    ['Indice [D₄ : H]', `${index}, et ${index} × ${size} = ${index * size} éléments dans D₄ (|D₄| = ${ORDER})`],
  ];
  const status = `aH = ${setText(aH)} : ${aH.length} élément${aH.length > 1 ? 's' : ''}, ${containsE}. `
    + `${index} classe${index > 1 ? 's' : ''} à gauche distincte${index > 1 ? 's' : ''}, de taille${equal ? ` ${size} chacune` : 's inégales'} ; `
    + `chaque élément de D₄ figure dans exactement une classe (${sizes.join(' + ')} = ${sizes.reduce((p, q) => p + q, 0)}).`
    + ` Classe de a : C${selected + 1}.`;
  const table = classes.map((c, k): string[] => [
    `C${k + 1}`, setText(c), String(c.length), c.includes(0) ? 'oui' : 'non', k === selected ? 'oui' : 'non',
  ]);
  return {
    rows, status,
    headers: ['Classe', 'Éléments', 'Taille', 'Contient e', 'Est aH'],
    caption: 'Classes à gauche distinctes de H dans D₄, avec leurs éléments',
    table,
  };
}

/* ---------- Conjugation ---------- */

export interface ConjugationReading {
  result: number;
  ginv: number;
  axisBefore: ReturnType<typeof axisOf>;
  axisAfter: ReturnType<typeof axisOf>;
  /** Distinct conjugates gxg⁻¹ for g in D₄, ordered as the elements. */
  conjugates: number[];
  /** C(x) = {g | gx = xg}. */
  centralizer: number[];
  centralizerIndex: number;
  /** For each g (in element order): gxg⁻¹. */
  perG: number[];
}

export function conjugationReading({ x, g }: ConjugationState): ConjugationReading {
  const perG = Array.from({ length: ORDER }, (_, k) => conjugate(k, x));
  const result = conjugate(g, x);
  const centralizer: number[] = [];
  for (let k = 0; k < ORDER; k++) if (product(k, x) === product(x, k)) centralizer.push(k);
  return {
    result, ginv: inverse(g),
    axisBefore: axisOf(x), axisAfter: axisOf(result),
    conjugates: sortedSet(perG), centralizer,
    centralizerIndex: ORDER / centralizer.length, perG,
  };
}

export function conjugationText(state: ConjugationState, reading: ConjugationReading): FigureText {
  const { x, g } = state;
  const { result, ginv, axisBefore, axisAfter, conjugates, centralizer, centralizerIndex, perG } = reading;
  const expression = `${name(g)} ${name(x)} ${name(ginv)}`;
  const axes = axisBefore && axisAfter
    ? `${axisBefore.name[0].toUpperCase()}${axisBefore.name.slice(1)} devient ${axisAfter.name}`
    : `x = ${name(x)} est une rotation, sans axe`;
  const rows: [string, string][] = [
    ['x et g', `x = ${name(x)} ; g = ${name(g)}`],
    ['Inverse de g', `g⁻¹ = ${name(ginv)}`],
    ['Conjugué g x g⁻¹', `${expression} = ${name(result)}`],
    ['Axe initial', axisBefore ? axisBefore.name : 'aucun : x est une rotation'],
    ['Axe obtenu', axisAfter ? axisAfter.name : 'aucun : g x g⁻¹ est une rotation'],
    ['Conjugués distincts de x', `${conjugates.length} : ${setText(conjugates)}`],
    ['Centralisateur C(x)', `${setText(centralizer)}, ${centralizer.length} élément${centralizer.length > 1 ? 's' : ''}`],
    ['Indice [D₄ : C(x)]', `${ORDER} / ${centralizer.length} = ${centralizerIndex}, à comparer au nombre de conjugués distincts : ${conjugates.length}`],
  ];
  const status = `g x g⁻¹ = ${expression} = ${name(result)}. ${axes}. `
    + `${conjugates.length} conjugué${conjugates.length > 1 ? 's' : ''} distinct${conjugates.length > 1 ? 's' : ''} de ${name(x)} ; `
    + `centralisateur de ${centralizer.length} élément${centralizer.length > 1 ? 's' : ''}, d’indice ${centralizerIndex}.`;
  const table = Array.from({ length: ORDER }, (_, k): string[] => [
    name(k), name(inverse(k)), `${name(k)} ${name(x)} ${name(inverse(k))} = ${name(perG[k])}`,
    k === g ? 'oui' : (perG[k] === result ? 'même conjugué' : 'non'),
  ]);
  return {
    rows, status,
    headers: ['g', 'g⁻¹', 'Calcul de g x g⁻¹', 'g choisi'],
    caption: `Conjugués de x = ${name(x)} par chacun des huit éléments g`,
    table,
  };
}
