// Pure model of the figure of the lesson « Polynômes irréductibles & racines ».
// Specification: docs/demandes/codex-lecon-15-irreductibilite-reponse.md
// (section « Interaction proposée, après validation »). Everything is an
// integer computed modulo 2 : the figure evaluates the monic polynomials
// X² + bX + c and X³ + bX + c at the two elements 0 and 1 of ℤ/2ℤ, lists the
// roots and reads the conclusion off the theorem 1 of the lesson (degrees 2
// and 3). It is an exhaustive search in this one field and proves nothing.

export type Degree = 2 | 3;
export type Bit = 0 | 1;
export interface IrredState { degree: Degree; b: Bit; c: Bit }

export const DEGREES: readonly Degree[] = [2, 3];
export const BITS: readonly Bit[] = [0, 1];
export const IRRED_PRESET: IrredState = { degree: 2, b: 1, c: 1 };

export function isDegree(value: unknown): value is Degree { return value === 2 || value === 3; }
export function isBit(value: unknown): value is Bit { return value === 0 || value === 1; }

/** Reads a radio value (string or number) ; undefined when it is not a valid choice. */
export function parseChoice(name: keyof IrredState, value: unknown): Degree | Bit | undefined {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (name === 'degree') return isDegree(number) ? number : undefined;
  return isBit(number) ? number : undefined;
}

/** Remainder modulo 2 of a non-negative integer. */
export const mod2 = (k: number) => k % 2;

/** The integer value of x^degree + b·x + c, before reduction modulo 2. */
export function rawValue({ degree, b, c }: IrredState, x: Bit): number {
  return x ** degree + b * x + c;
}

/** Value of the polynomial at x in ℤ/2ℤ. */
export function valueAt(state: IrredState, x: Bit): Bit {
  return mod2(rawValue(state, x)) as Bit;
}

export interface IrredReading {
  state: IrredState;
  raw: [number, number];
  values: [Bit, Bit];
  roots: Bit[];
  /** Irreducible over ℤ/2ℤ, by the criterion of theorem 1 (degrees 2 and 3 only). */
  irreducible: boolean;
}

export function irredReading(state: IrredState): IrredReading {
  const raw: [number, number] = [rawValue(state, 0), rawValue(state, 1)];
  const values: [Bit, Bit] = [valueAt(state, 0), valueAt(state, 1)];
  const roots = BITS.filter(x => values[x] === 0);
  return { state, raw, values, roots, irreducible: roots.length === 0 };
}

/** The 8 polynomials of the range, degree first, then b, then c. */
export function allStates(): IrredState[] {
  return DEGREES.flatMap(degree => BITS.flatMap(b => BITS.map(c => ({ degree, b, c }))));
}

/* Text reading. */

const SUPERSCRIPT: Record<Degree, string> = { 2: '²', 3: '³' };
export const FIELD = 'ℤ/2ℤ';

/** « X² + X + 1 », « X³ + 1 », « X² ». */
export function polyName({ degree, b, c }: IrredState): string {
  return `X${SUPERSCRIPT[degree]}${b ? ' + X' : ''}${c ? ' + 1' : ''}`;
}

export function rootsText(roots: Bit[]): string {
  if (roots.length === 0) return 'aucune';
  return roots.length === 1 ? `${roots[0]}` : roots.join(' et ');
}

/** « 1² + 1 × 1 + 1 = 3, soit 1 modulo 2 » (the reduction is shown only when needed). */
function evaluation(state: IrredState, x: Bit): string {
  const { degree, b, c } = state;
  const raw = rawValue(state, x);
  const value = mod2(raw);
  const head = `P(${x}) = ${x}${SUPERSCRIPT[degree]} + ${b} × ${x} + ${c} = ${raw}`;
  return raw === value ? head : `${head}, soit ${value} modulo 2`;
}

export function conclusion(reading: IrredReading): string {
  const { state, roots, irreducible } = reading;
  const name = polyName(state);
  const where = `sur ${FIELD}`;
  if (irreducible) {
    return `Aucune racine dans ${FIELD} : d’après le théorème 1 de la leçon (degré ${state.degree}), ${name} est irréductible ${where}.`;
  }
  const rootPhrase = roots.length === 1 ? `la racine ${roots[0]}` : 'les racines 0 et 1';
  return `${name} a ${rootPhrase} dans ${FIELD} : il est donc réductible ${where} (théorème 1 de la leçon).`;
}

export interface IrredText {
  rows: [string, string][];
  status: string;
  summary: string;
}

export const EXHAUST = `Le corps ${FIELD} a exactement deux éléments, 0 et 1 : ces deux évaluations épuisent toutes les valeurs possibles de x.`;
export const DEGREE_NOTE = 'La conclusion dépend du degré : le théorème 1 de la leçon traite les degrés 2 et 3 ; en degré 4, l’absence de racine ne suffirait plus (remarque de la leçon).';
export const SCOPE = `La figure parcourt seulement les 8 polynômes X² + bX + c et X³ + bX + c sur ${FIELD}, avec b et c valant 0 ou 1 : elle illustre une recherche exhaustive dans ce corps précis et ne démontre rien.`;

export function irredText(reading: IrredReading): IrredText {
  const { state, values, roots } = reading;
  const name = polyName(state);
  const rows: [string, string][] = [
    ['Polynôme', `P = ${name} sur ${FIELD} (X${SUPERSCRIPT[state.degree]} + ${state.b} X + ${state.c})`],
    ['Degré', String(state.degree)],
    ['Évaluation en 0', evaluation(state, 0)],
    ['Évaluation en 1', evaluation(state, 1)],
    ['Racines dans ' + FIELD, rootsText(roots)],
    ['Conclusion', conclusion(reading)],
    ['Pourquoi deux valeurs', EXHAUST],
    ['Rôle du degré', DEGREE_NOTE],
  ];
  const status = `${name} sur ${FIELD} : P(0) = ${values[0]}, P(1) = ${values[1]}, racines : ${rootsText(roots)}. ${conclusion(reading)} `
    + 'Cette figure parcourt un seul corps et une plage finie : elle ne démontre rien.';
  const summary = `Deux cases, en 0 et en 1, avec les valeurs ${values[0]} et ${values[1]} du polynôme ${name} ; racines : ${rootsText(roots)}.`;
  return { rows, status, summary };
}

export interface TableRow { key: string; cells: string[] }

/** Summary table of the 8 polynomials : degree, b, c, polynomial, P(0), P(1), roots, conclusion. */
export function tableRows(): TableRow[] {
  return allStates().map(state => {
    const r = irredReading(state);
    return {
      key: rowKey(state),
      cells: [String(state.degree), String(state.b), String(state.c), polyName(state), String(r.values[0]), String(r.values[1]), rootsText(r.roots), r.irreducible ? 'irréductible' : 'réductible'],
    };
  });
}
export const rowKey = ({ degree, b, c }: IrredState) => `${degree}-${b}-${c}`;
export const TABLE_HEAD = ['Degré', 'b', 'c', 'Polynôme', 'P(0)', 'P(1)', 'Racines', 'Conclusion'];
export const TABLE_CAPTION = `Les 8 polynômes X² + bX + c et X³ + bX + c sur ${FIELD} : évaluations en 0 et en 1, racines et conclusion`;
