// Pure model of the figure of the lesson « Corps finis & polynômes
// irréductibles » (F = 𝔽₂[X]/(X² + X + 1), α = [X], α² = α + 1).
// Specification: docs/demandes/codex-lecon-16-corps-finis-reponse.md
// (section « Interaction proposée après validation »). An element is a
// couple (a, b) of coefficients modulo 2 meaning a + bα. All computations are
// on integers; the figure shows ONE operation at a time and proves nothing.

export interface Elt { a: 0 | 1; b: 0 | 1 }
export type Op = 'add' | 'mul';
export interface FieldState { x: Elt; y: Elt; op: Op }

/** The four elements, in the order 0, 1, α, α + 1. */
export const ELEMENTS: readonly Elt[] = [{ a: 0, b: 0 }, { a: 1, b: 0 }, { a: 0, b: 1 }, { a: 1, b: 1 }];
export const OPS: readonly Op[] = ['mul', 'add'];
export const FIELD_PRESET: FieldState = { x: { a: 0, b: 1 }, y: { a: 1, b: 1 }, op: 'mul' };

/** Code of an element in a form value: coefficients (a, b), e.g. « 01 » for α. */
export const code = (e: Elt) => `${e.a}${e.b}`;
export const parseElt = (value: unknown): Elt | undefined => ELEMENTS.find(e => code(e) === value);
export const parseOp = (value: unknown): Op | undefined => OPS.find(op => op === value);
export const eltIndex = (e: Elt) => ELEMENTS.findIndex(f => f.a === e.a && f.b === e.b);

/** Polynomial c2 α² + c1 α + c0 in descending order; zero coefficients are omitted. */
export function poly(c0: number, c1: number, c2 = 0): string {
  const terms: string[] = [];
  const term = (c: number, sym: string) => {
    if (c === 0) return;
    terms.push(sym === '' ? String(c) : `${c === 1 ? '' : c}${sym}`);
  };
  term(c2, 'α²'); term(c1, 'α'); term(c0, '');
  return terms.length ? terms.join(' + ') : '0';
}

/** Name of an element: 0, 1, α, α + 1. */
export const name = (e: Elt) => poly(e.a, e.b);

export interface Calculation {
  /** Coefficients of the development, before reduction (integers). */
  raw: [number, number, number];
  /** Coefficients after replacing α² by α + 1 (integers). */
  reduced: [number, number];
  result: Elt;
}

/** Operation in F, step by step: development, reduction by α² = α + 1, modulo 2. */
export function calculate({ x, y, op }: FieldState): Calculation {
  const raw: [number, number, number] = op === 'add'
    ? [x.a + y.a, x.b + y.b, 0]
    : [x.a * y.a, x.a * y.b + x.b * y.a, x.b * y.b];
  const reduced: [number, number] = [raw[0] + raw[2], raw[1] + raw[2]];
  return { raw, reduced, result: { a: (reduced[0] % 2) as 0 | 1, b: (reduced[1] % 2) as 0 | 1 } };
}

/** Full table of an operation: table[i][j] = index of ELEMENTS[i] ∘ ELEMENTS[j]. */
export function fieldTable(op: Op): number[][] {
  return ELEMENTS.map(x => ELEMENTS.map(y => eltIndex(calculate({ x, y, op }).result)));
}

/* Text reading (also the content of the status line and of the tables). */

export const FIELD_NAME = '𝔽₂[X]/(X² + X + 1)';
export const RULE = 'α² = α + 1';
const operand = (e: Elt) => (e.a === 1 && e.b === 1 ? `(${name(e)})` : name(e));
const symbol = (op: Op) => (op === 'add' ? '+' : '×');
const expression = ({ x, y, op }: FieldState) => `${operand(x)} ${symbol(op)} ${operand(y)}`;

export interface FieldText {
  rows: [string, string][];
  status: string;
  summary: string;
}

export function fieldText(state: FieldState): FieldText {
  const { x, y, op } = state;
  const { raw, reduced, result } = calculate(state);
  const developed = poly(raw[0], raw[1], raw[2]);
  const reducedText = poly(reduced[0], reduced[1]);
  const opName = op === 'add' ? 'addition' : 'multiplication';
  const rows: [string, string][] = [
    ['Opérandes', `x = ${name(x)} ; y = ${name(y)}`],
    ['Opération', `${opName} : ${expression(state)}`],
    ['Développement', op === 'add'
      ? `${expression(state)} = ${developed}`
      : `${expression(state)} = ${developed} (on développe le produit des deux polynômes en α)`],
    ['Réduction par α² = α + 1', raw[2] === 0
      ? `aucun terme en α² : rien à réduire, ${developed}`
      : `α² est remplacé par α + 1 : ${developed} = ${reducedText}`],
    ['Coefficients modulo 2', `coefficient de α : ${reduced[1]}, soit ${reduced[1] % 2} ; coefficient de 1 : ${reduced[0]}, soit ${reduced[0] % 2}`],
    ['Résultat', `${expression(state)} = ${name(result)}`],
  ];
  const status = `Cas courant dans F = ${FIELD_NAME} : ${expression(state)} = ${name(result)}. `
    + 'La figure traite une seule opération entre deux des quatre éléments : elle ne démontre rien.';
  const summary = `Les quatre éléments 0, 1, α et α + 1 du corps F ; x = ${name(x)}, y = ${name(y)} et le résultat ${name(result)} de la ${opName} sont repérés.`;
  return { rows, status, summary };
}

/** Header labels of the tables. */
export const headers = ELEMENTS.map(name);

export const EXAMPLE = 'α(α + 1) = α² + α = (α + 1) + α = 2α + 1 = 1, car 2 vaut 0 modulo 2.';
