// Text alternative of the two figures of « Suites géométriques & sommes
// infinies »: the same information as the graphs, with exact values when they
// are short and approximations explicitly marked « ≈ » otherwise.
import { absR, display, displayScaled, displayWithDecimal, isZero, relation, sign, subscript, type Rational } from './rational.ts';
import { closedError, type IterationReading, type IterationState, type SumReading, type SumState } from './series.ts';

export interface FigureText { rows: [string, string][]; status: string }

export interface SeriesFigureText extends FigureText {
  /** Rows of the iteration table: rank, x_k, e_k, |e_k|. */
  table?: [string, string, string, string][];
}

const s = subscript;
/** « = 15/16 » for an exact display, « ≈ 0,6667 » for an approximation. */
function rel(x: Rational): string {
  const shown = display(x);
  return shown.exact ? `= ${shown.text}` : shown.text;
}

export function sumText(state: SumState, r: SumReading): SeriesFigureText {
  const N = state.N;
  const a = displayScaled(state.a, 10), q = displayScaled(state.q, 10);
  const eps = `1/${state.eps}`;
  const L = display(r.limit).text;
  const position = isZero(r.remainder) ? `S${s(N)} = L (reste nul)`
    : sign(r.remainder) > 0 ? `S${s(N)} < L (reste positif)` : `S${s(N)} > L (reste négatif)`;
  const first = r.firstRank === undefined
    ? 'non atteint dans les 81 sommes affichées (N ≤ 80)'
    : `N = ${r.firstRank} (${r.firstRank + 1} terme${r.firstRank ? 's' : ''})`;
  const rows: [string, string][] = [
    ['Paramètres', `a = ${a} ; q = ${q} ; ε = ${eps}`],
    ['Termes additionnés', `N + 1 = ${N + 1} : ${N === 0 ? 'u₀' : `u₀ à u${s(N)}`}`],
    [`Dernier terme u${s(N)}`, `a qᴺ ${relation(r.term)}`],
    [`Somme partielle S${s(N)}`, `a (1 − qᴺ⁺¹)/(1 − q) ${relation(r.sums[N])}`],
    ['Limite L', `a/(1 − q) ${relation(r.limit)}`],
    [`Reste R${s(N)} = L − S${s(N)}`, `a qᴺ⁺¹/(1 − q) ${relation(r.remainder)}`],
    ['Position', position],
    [`|R${s(N)}| < ε ?`, `${r.within ? 'oui' : 'non'} (comparaison exacte)`],
    ['Premier rang où |Rₙ| < ε', first],
  ];
  let status: string;
  if (state.a === 0) status = 'a = 0 : tous les termes, toutes les sommes partielles et tous les restes sont nuls.';
  else if (state.q === 0) status = `q = 0 : S${s(N)} = a = ${a} = L, le reste est nul à tout rang.`;
  else {
    const side = sign(r.remainder) > 0 ? 'sous la limite' : 'au-dessus de la limite';
    status = `S${s(N)} ${rel(r.sums[N])}, ${side} L = ${L} ; erreur |R${s(N)}| ${rel(absR(r.remainder))} ${r.within ? '<' : '≥'} ε = ${eps}. `
      + (r.firstRank === undefined ? 'Précision non atteinte dans les 81 sommes affichées.'
        : `Premier rang où l’erreur est inférieure à ε : N = ${r.firstRank}.`);
  }
  return { rows, status };
}

export function iterationText(state: IterationState, r: IterationReading): SeriesFigureText {
  const n = state.n;
  const q = displayScaled(state.q, 10), b = displayScaled(state.b, 2), x0 = displayScaled(state.x0, 2);
  const p = display(r.fixedPoint).text;
  const x = r.positions[n], e = r.errors[n];
  const rows: [string, string][] = [
    ['Récurrence', `xₙ₊₁ = q xₙ + b, avec q = ${q} ; b = ${b} ; x₀ = ${x0}`],
    ['Point fixe p', `b/(1 − q) ${relation(r.fixedPoint)}`],
    ['Rang', `${n} sur 40`],
    [`Position x${s(n)}`, displayWithDecimal(x)],
    [`Erreur e${s(n)} = x${s(n)} − p`, `qⁿ (x₀ − p) ${relation(closedError(r, n))}`],
    [`|e${s(n)}|`, displayWithDecimal(absR(e))],
  ];
  const table = r.positions.map((value, k) => [String(k), display(value).text, display(r.errors[k]).text, display(absR(r.errors[k])).text] as [string, string, string, string]);
  let status: string;
  if (isZero(r.errors[0])) status = `x₀ = p = ${p} : la position initiale est le point fixe et ne change pas.`;
  else if (state.q === 0) status = n === 0 ? `Rang 0 : x₀ = ${x0}. Avec q = 0, x₁ = b = p.` : `Rang ${n} : x${s(n)} = p = ${p}, atteint dès le rang 1 car q = 0.`;
  else {
    const side = sign(e) > 0 ? 'au-dessus de p' : 'au-dessous de p';
    status = `Rang ${n} : x${s(n)} ${rel(x)}, ${side} = ${p} ; |e${s(n)}| ${rel(absR(e))}. `
      + `À chaque étape, la distance à p est multipliée par |q| = ${displayScaled(Math.abs(state.q), 10)}.`;
  }
  return { rows, status, table };
}
