// Text alternative of each figure: the same information as the drawing,
// with exact values (docs/demandes/codex-lecon-02-geometrie-reponse.md).
import {
  formatNumber as n, formatPoint as p, mediatrix, reflection, twoReflections,
  type MediatrixState, type ReflectionState, type TwoReflectionsState,
} from './plane.ts';

export interface FigureText { rows: [string, string][]; status: string }

/** "(1 + 2)" or "(1 − 2)", keeping negative values readable: "(−3 + 2)". */
const sum = (x: number, sign: '+' | '−', a: number) => `(${n(x)} ${sign} ${a})`;
const square = (value: number) => (value < 0 ? `(${n(value)})²` : `${value}²`);

export function mediatrixText(state: MediatrixState): FigureText {
  const r = mediatrix(state);
  const { a, x, y } = state;
  return {
    rows: [
      ['a', String(a)],
      ['P', p(r.P)],
      ['PA²', `(x + a)² + y² = ${sum(x, '+', a)}² + ${square(y)} = ${r.pa2}`],
      ['PB²', `(x − a)² + y² = ${sum(x, '−', a)}² + ${square(y)} = ${r.pb2}`],
      ['PA² − PB²', `4ax = 4 × ${a} × ${x < 0 ? `(${n(x)})` : x} = ${n(r.difference)}`],
    ],
    status: r.closer === 'equal' ? 'P est sur la médiatrice d : PA = PB.'
      : `P est plus près de ${r.closer}.`,
  };
}

export function reflectionText(state: ReflectionState): FigureText {
  const r = reflection(state);
  const rows: [string, string][] = [
    ['Axe d', `x = ${n(state.c)}`],
    ['P (position initiale)', p(r.P)],
    ['H (projeté sur d)', p(r.H)],
    ['P′ (image)', `(2c − x, y) = ${p(r.image)}`],
    ['HP et HP′', `${r.distance} et ${r.distance}`],
    ['Réflexions appliquées', String(state.count)],
  ];
  let status: string;
  if (r.onAxis) status = 'Le point est sur l’axe et reste fixe.';
  else if (state.count === 0) status = `Point courant : P = ${p(r.P)}, avant réflexion.`;
  else if (state.count % 2 === 1) status = `Point courant : P′ = ${p(r.image)}. Position initiale : P = ${p(r.P)}.`;
  else status = `Point courant : ${p(r.P)}, la position initiale P, après ${state.count} réflexions.`;
  return { rows, status };
}

export function twoReflectionsText(state: TwoReflectionsState): FigureText {
  const r = twoReflections(state);
  const diagonalFirst = state.order === 'diagonal-first';
  const rows: [string, string][] = [
    ['Ordre appliqué', diagonalFirst ? 'd’abord t (axe y = x), puis s (axe x = 0) : s ∘ t'
      : 'd’abord s (axe x = 0), puis t (axe y = x) : t ∘ s'],
    ['P (initial)', p(r.P)],
  ];
  if (state.step >= 1) rows.push([diagonalFirst ? 'P₁ = t(P)' : 'P₁ = s(P)', `${diagonalFirst ? '(y, x)' : '(−x, y)'} = ${p(r.middle)}`]);
  if (state.step >= 2) rows.push([diagonalFirst ? 'P₂ = s(P₁)' : 'P₂ = t(P₁)', `${diagonalFirst ? '(−y, x)' : '(y, −x)'} = ${p(r.final)}`]);
  let status: string;
  if (state.step < 2) status = `Étape ${state.step} sur 2.`;
  else if (r.central) status = 'Pour l’origine, les images coïncident : choisissez un point non central pour distinguer les deux ordres.';
  else status = diagonalFirst ? 'P₂ = (−y, x) : s ∘ t est le quart de tour positif r.'
    : 'P₂ = (y, −x) : t ∘ s est le quart de tour négatif r⁻¹.';
  return { rows, status };
}
